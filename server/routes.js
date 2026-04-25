/**
 * @fileoverview API route handlers for ElectIQ.
 * Each route is a clean, focused handler that delegates to Google Cloud services.
 * Integrates: Gemini AI, Cloud Logging, BigQuery, Error Reporting, and Secret Manager.
 *
 * @module routes
 * @version 2.0.0
 */

import express from 'express';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import { genAI, logger, writeCloudLog, insertQuizAnalytics, getQuizStatistics, reportError } from './googleServices.js';
import { ChatResponseSchema, QuizSchema, StepExplainerSchema } from './schemas.js';
import config from './config.js';
import { ELECTION_ASSISTANT_INSTRUCTION, QUIZ_GENERATOR_INSTRUCTION, STEP_EXPLAINER_INSTRUCTION } from './prompts.js';

/** @type {express.Router} Express router for all API endpoints */
const router = express.Router();

/** @type {NodeCache} In-memory cache with 10-minute TTL for AI response deduplication */
const responseCache = new NodeCache({ stdTTL: config.cache.stdTTL, checkperiod: config.cache.checkperiod });

/**
 * Generates an MD5 hash of the input string for cache key generation.
 *
 * @param {string} input - The string to hash
 * @returns {string} The MD5 hex digest
 */
function generateCacheKey(input) {
  return crypto.createHash('md5').update(input.trim().toLowerCase()).digest('hex');
}

/**
 * Calls Google Gemini with the given system instruction and user prompt.
 * Implements caching, JSON parsing, and Zod schema validation.
 *
 * @param {string} systemInstruction - The AI persona instruction
 * @param {string} userPrompt - The user's input
 * @param {import('zod').ZodSchema} schema - The Zod schema for validation
 * @param {string} cachePrefix - Cache key namespace prefix
 * @returns {Promise<object>} The validated AI response
 * @throws {Error} If schema validation fails
 */
async function callGemini(systemInstruction, userPrompt, schema, cachePrefix) {
  const cacheKey = `${cachePrefix}:${generateCacheKey(userPrompt)}`;
  const cached = responseCache.get(cacheKey);

  if (cached) {
    logger.info({ cacheKey }, 'Cache Hit — Serving instant response');
    return cached;
  }

  logger.info({ cacheKey: cacheKey.substring(0, 25) }, 'Cache Miss — Calling Gemini');

  const model = genAI.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction,
    generationConfig: {
      temperature: config.gemini.temperature,
      topP: config.gemini.topP,
      maxOutputTokens: config.gemini.maxOutputTokens,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(userPrompt);
  const response = await result.response;
  const text = response.text();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (parseErr) {
    logger.warn({ parseErr }, 'JSON parse failed, attempting cleanup');
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    logger.error({ errors: validated.error.issues }, 'Zod validation failed');
    throw new Error('AI response failed schema validation');
  }

  responseCache.set(cacheKey, validated.data);
  logger.info({ cacheKey }, 'Response cached successfully');
  return validated.data;
}

// ── Route Handlers ─────────────────────────────────────────────────────────

/**
 * GET /api/health
 * Health check endpoint for Cloud Run load balancer probes.
 */
router.get('/health', (req, res) => {
  writeCloudLog('INFO', 'Health check', { requestId: req.requestId });
  res.json({
    status: 'healthy',
    service: 'electiq',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

/**
 * POST /api/chat
 * Election assistant chatbot — processes natural language questions
 * about the election process using Google Gemini AI.
 */
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'A message is required.' });
    }

    if (!config.gemini.apiKey) {
      return res.status(500).json({ error: 'Gemini service is not configured.' });
    }

    const result = await callGemini(
      ELECTION_ASSISTANT_INSTRUCTION,
      message.substring(0, config.inputLimits.chatMaxLength),
      ChatResponseSchema,
      'chat'
    );

    res.json(result);
    writeCloudLog('INFO', 'Chat response served', { requestId: req.requestId, category: result.category });
  } catch (error) {
    reportError(error, { endpoint: '/api/chat', requestId: req.requestId });
    logger.error({ error: error.message, requestId: req.requestId }, 'Chat failed');
    writeCloudLog('ERROR', 'Chat failed', { error: error.message, requestId: req.requestId });
    res.status(500).json({ error: 'Failed to process your question. Please try again.' });
  }
});

/**
 * POST /api/quiz
 * Generates an interactive, AI-powered election knowledge quiz.
 * Results are asynchronously logged to Google BigQuery for analytics.
 */
router.post('/quiz', async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ error: 'A quiz topic is required.' });
    }

    if (!config.gemini.apiKey) {
      return res.status(500).json({ error: 'Gemini service is not configured.' });
    }

    const result = await callGemini(
      QUIZ_GENERATOR_INSTRUCTION,
      `Generate a quiz about: ${topic.substring(0, config.inputLimits.quizTopicMaxLength)}`,
      QuizSchema,
      'quiz'
    );

    res.json(result);
    writeCloudLog('INFO', 'Quiz generated', { requestId: req.requestId, topic });

    // Async: Log quiz generation to BigQuery for analytics dashboarding
    insertQuizAnalytics({
      topic: result.topic,
      questionCount: result.questions.length,
      requestId: req.requestId,
      action: 'generated',
    }).catch(() => {});
  } catch (error) {
    reportError(error, { endpoint: '/api/quiz', requestId: req.requestId });
    logger.error({ error: error.message, requestId: req.requestId }, 'Quiz generation failed');
    writeCloudLog('ERROR', 'Quiz generation failed', { error: error.message, requestId: req.requestId });
    res.status(500).json({ error: 'Failed to generate quiz. Please try again.' });
  }
});

/**
 * POST /api/explain-step
 * Provides a detailed AI-generated explanation of a specific
 * election process step with key points, mistakes, and tips.
 */
router.post('/explain-step', async (req, res) => {
  try {
    const { step } = req.body;

    if (!step || typeof step !== 'string' || step.trim().length === 0) {
      return res.status(400).json({ error: 'An election step name is required.' });
    }

    if (!config.gemini.apiKey) {
      return res.status(500).json({ error: 'Gemini service is not configured.' });
    }

    const result = await callGemini(
      STEP_EXPLAINER_INSTRUCTION,
      `Explain this election step in detail: ${step.substring(0, config.inputLimits.stepNameMaxLength)}`,
      StepExplainerSchema,
      'step'
    );

    res.json(result);
    writeCloudLog('INFO', 'Step explained', { requestId: req.requestId, step });
  } catch (error) {
    reportError(error, { endpoint: '/api/explain-step', requestId: req.requestId });
    logger.error({ error: error.message, requestId: req.requestId }, 'Step explanation failed');
    writeCloudLog('ERROR', 'Step explanation failed', { error: error.message, requestId: req.requestId });
    res.status(500).json({ error: 'Failed to explain step. Please try again.' });
  }
});

/**
 * GET /api/stats
 * Retrieves aggregate quiz statistics from Google BigQuery.
 * Returns average scores, attempt counts, and popular topics.
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getQuizStatistics();
    writeCloudLog('INFO', 'Stats retrieved from BigQuery', { requestId: req.requestId });
    res.json({ stats, source: 'BigQuery', requestId: req.requestId });
  } catch (error) {
    reportError(error, { endpoint: '/api/stats', requestId: req.requestId });
    res.json({ stats: [], source: 'BigQuery', note: 'BigQuery not configured in this environment' });
  }
});

export default router;

