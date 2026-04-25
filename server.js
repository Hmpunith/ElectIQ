/**
 * @fileoverview ElectIQ Backend Server
 * Enterprise-grade Express server powering an AI election assistant
 * using Google Gemini 2.5 Flash for interactive civic education.
 *
 * @author ElectIQ Team
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import pino from 'pino';
import compression from 'compression';
import { z } from 'zod';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// ── Enterprise Infrastructure ──────────────────────────────────────────────

/** @type {import('pino').Logger} Structured JSON logger for Cloud Run observability */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
});

/** @type {NodeCache} In-memory cache with 10-minute TTL for AI response deduplication */
const responseCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// ── Zod Schemas ────────────────────────────────────────────────────────────

/** Schema for election assistant chatbot API responses */
const ChatResponseSchema = z.object({
  answer: z.string(),
  category: z.enum(['registration', 'voting', 'timeline', 'candidates', 'results', 'general', 'rights']),
  sources: z.array(z.string()).optional(),
  followUpQuestions: z.array(z.string()),
});

/** Schema for election quiz generation API responses */
const QuizSchema = z.object({
  questions: z.array(z.object({
    id: z.number(),
    question: z.string(),
    options: z.array(z.string()).min(4).max(4),
    correctIndex: z.number().min(0).max(3),
    explanation: z.string(),
  })).min(3).max(5),
  topic: z.string(),
});

/** Schema for election step explanation API responses */
const StepExplainerSchema = z.object({
  stepTitle: z.string(),
  explanation: z.string(),
  keyPoints: z.array(z.string()),
  commonMistakes: z.array(z.string()),
  tip: z.string(),
});

// ── Middleware Stack ────────────────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '500kb' }));

/** Rate limiter: 20 requests per minute per IP */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// ── Google Gemini Configuration ────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/** System instruction: Election Assistant AI persona with few-shot examples */
const ELECTION_ASSISTANT_INSTRUCTION = `You are ElectIQ, an expert AI assistant designed to help citizens understand the election process, timelines, and steps in an interactive and easy-to-follow way. You provide accurate, non-partisan, and educational information about democratic elections.

When given a question about elections, you MUST respond with ONLY valid JSON.

### FEW-SHOT EXAMPLES:

User: "How do I register to vote?"
Assistant: {
  "answer": "Voter registration is the first and most important step in participating in an election. Here's how to register:\\n\\n1. **Check Eligibility:** You must be a citizen of your country and meet the minimum age requirement (usually 18 years old).\\n2. **Gather Documents:** You'll need a government-issued photo ID (like a driver's license or passport) and proof of address.\\n3. **Choose Your Method:** You can register online through your country's or state's official election website, by mail using a registration form, or in person at your local election office.\\n4. **Verify Registration:** After submitting, check your registration status online before election day to make sure everything is confirmed.",
  "category": "registration",
  "sources": ["National Election Commission", "Official Voter Registration Portal"],
  "followUpQuestions": ["What documents do I need to register?", "When is the registration deadline?", "Can I register on election day?"]
}

User: "What happens after voting closes?"
Assistant: {
  "answer": "After polling stations close, a carefully monitored counting process begins:\\n\\n1. **Ballot Collection:** Sealed ballot boxes are transported to counting centers under security escort.\\n2. **Counting Process:** Authorized officials count votes in the presence of party representatives (agents/observers) to ensure transparency.\\n3. **Verification:** Each ballot is checked for validity. Spoiled or unclear ballots are set aside for review.\\n4. **Result Declaration:** Results are typically announced constituency by constituency, starting a few hours after polls close.\\n5. **Certification:** The Election Commission officially certifies the results after verifying all counts and addressing any disputes.",
  "category": "results",
  "sources": ["Election Commission Guidelines"],
  "followUpQuestions": ["How long does counting take?", "What happens if there's a tie?", "How are disputed ballots handled?"]
}

### RULES:
- category MUST be one of: "registration", "voting", "timeline", "candidates", "results", "general", "rights"
- Always provide 2-3 followUpQuestions to keep the conversation going
- Be non-partisan and factual
- Use numbered lists and bold text for clarity
- Keep language simple and accessible for first-time voters`;

/** System instruction: Quiz Generator AI */
const QUIZ_GENERATOR_INSTRUCTION = `You are ElectIQ Quiz Master, an AI that generates interactive, educational quiz questions about the election process to test and reinforce user understanding.

Respond with ONLY valid JSON.

### FEW-SHOT EXAMPLES:

User: "Generate a quiz about voter registration"
Assistant: {
  "questions": [
    {
      "id": 1,
      "question": "What is typically the minimum age requirement to vote in most democracies?",
      "options": ["16 years old", "18 years old", "21 years old", "25 years old"],
      "correctIndex": 1,
      "explanation": "In most democratic countries, citizens can vote once they turn 18 years old, though some countries like Austria allow voting at 16."
    },
    {
      "id": 2,
      "question": "Which of these is NOT typically required for voter registration?",
      "options": ["Proof of citizenship", "Proof of address", "University degree", "Government-issued ID"],
      "correctIndex": 2,
      "explanation": "A university degree is never required to vote. Voting is a fundamental right for all eligible citizens regardless of education level."
    },
    {
      "id": 3,
      "question": "What should you do BEFORE election day to ensure you can vote?",
      "options": ["Buy a new outfit", "Verify your voter registration status", "Memorize all candidates' speeches", "Book a flight"],
      "correctIndex": 1,
      "explanation": "Always verify your registration status before election day to avoid any issues at the polling station."
    }
  ],
  "topic": "Voter Registration Essentials"
}

### RULES:
- Generate exactly 3-5 questions per quiz
- Each question MUST have exactly 4 options
- correctIndex MUST be 0-3 (zero-indexed)
- Explanations should be educational and encouraging
- Questions should be accessible to first-time voters
- Be non-partisan and factual`;

/** System instruction: Step Explainer AI */
const STEP_EXPLAINER_INSTRUCTION = `You are ElectIQ Step Guide, an AI that provides detailed, easy-to-follow explanations of individual election process steps. You break down complex election procedures into simple, actionable information.

Respond with ONLY valid JSON.

### FEW-SHOT EXAMPLE:

User: "Explain the Voting Day step"
Assistant: {
  "stepTitle": "Voting Day — Casting Your Ballot",
  "explanation": "Voting Day is when eligible, registered voters go to their designated polling station to cast their vote. This is the core act of democratic participation where your voice directly shapes the future of your community and country.",
  "keyPoints": [
    "Polling stations are usually open from early morning (7-8 AM) until evening (6-8 PM)",
    "You must bring a valid photo ID that matches your voter registration",
    "Your vote is completely secret — no one can see who you voted for",
    "Poll workers are there to help you if you have any questions",
    "You can only vote once, at your designated polling station"
  ],
  "commonMistakes": [
    "Forgetting to bring your voter ID",
    "Going to the wrong polling station",
    "Not checking your registration status before election day",
    "Taking photos of your ballot (this is illegal in many places)"
  ],
  "tip": "Arrive early in the morning or during mid-afternoon to avoid long queues. Check your polling station location the night before!"
}

### RULES:
- Provide 4-6 keyPoints
- Provide 3-5 commonMistakes
- Keep language simple and encouraging
- Be non-partisan and factual`;

// ── Helper Functions ───────────────────────────────────────────────────────

/**
 * Generates an MD5 hash of the input string for cache key generation.
 * @param {string} input - The string to hash
 * @returns {string} The MD5 hex digest
 */
function generateCacheKey(input) {
  return crypto.createHash('md5').update(input.trim().toLowerCase()).digest('hex');
}

/**
 * Calls Google Gemini with the given system instruction and user prompt.
 * Handles JSON parsing, schema validation, and caching.
 * @param {string} systemInstruction - The AI persona instruction
 * @param {string} userPrompt - The user's input
 * @param {z.ZodSchema} schema - The Zod schema to validate the response
 * @param {string} cachePrefix - Prefix for cache key namespacing
 * @returns {Promise<object>} The validated AI response
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
    model: 'gemini-2.5-flash',
    systemInstruction,
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 2048,
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

// ── API Routes ─────────────────────────────────────────────────────────────

/** Health check endpoint for Cloud Run load balancer */
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'electiq', timestamp: new Date().toISOString() });
});

/**
 * POST /api/chat
 * Election assistant chatbot for natural language election queries.
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'A message is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini service is not configured.' });
    }

    const result = await callGemini(
      ELECTION_ASSISTANT_INSTRUCTION,
      message.substring(0, 1000),
      ChatResponseSchema,
      'chat'
    );

    res.json(result);
  } catch (error) {
    logger.error({ error: error.message }, 'Chat failed');
    res.status(500).json({ error: 'Failed to process your question. Please try again.' });
  }
});

/**
 * POST /api/quiz
 * Generates an interactive election knowledge quiz.
 */
app.post('/api/quiz', async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ error: 'A quiz topic is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini service is not configured.' });
    }

    const result = await callGemini(
      QUIZ_GENERATOR_INSTRUCTION,
      `Generate a quiz about: ${topic.substring(0, 500)}`,
      QuizSchema,
      'quiz'
    );

    res.json(result);
  } catch (error) {
    logger.error({ error: error.message }, 'Quiz generation failed');
    res.status(500).json({ error: 'Failed to generate quiz. Please try again.' });
  }
});

/**
 * POST /api/explain-step
 * Provides a detailed explanation of a specific election process step.
 */
app.post('/api/explain-step', async (req, res) => {
  try {
    const { step } = req.body;

    if (!step || typeof step !== 'string' || step.trim().length === 0) {
      return res.status(400).json({ error: 'An election step name is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini service is not configured.' });
    }

    const result = await callGemini(
      STEP_EXPLAINER_INSTRUCTION,
      `Explain this election step in detail: ${step.substring(0, 500)}`,
      StepExplainerSchema,
      'step'
    );

    res.json(result);
  } catch (error) {
    logger.error({ error: error.message }, 'Step explanation failed');
    res.status(500).json({ error: 'Failed to explain step. Please try again.' });
  }
});

// ── Static Files (Production) ──────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')));

/** SPA fallback — serves index.html for all non-API routes */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ── Start Server ───────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'ElectIQ server is live');
  });
}

export default app;
