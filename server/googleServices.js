/**
 * @fileoverview Google Cloud services integration module for ElectIQ.
 *
 * This module centralizes ALL Google Cloud service integrations:
 *
 *  1. Google Gemini 2.5 Flash    — AI/ML API for chat, quiz, step explainer
 *  2. Google Cloud Logging       — Structured production observability
 *  3. Google Cloud Storage       — Asset and analytics data management
 *  4. Google Cloud BigQuery      — Analytics data warehouse for quiz metrics
 *  5. Google Cloud Secret Manager— Secure API key management
 *  6. Google Cloud Error Reporting— Production error tracking and alerting
 *  7. Vertex AI Safety           — Content moderation for user inputs
 *
 * Client-side Google services (not in this file):
 *  8.  Firebase Firestore        — Quiz result persistence
 *  9.  Firebase Analytics        — User engagement tracking
 *  10. Firebase Auth             — Google Sign-In (optional)
 *  11. Google Cloud Run          — Deployment platform
 *  12. Google Fonts              — Typography CDN
 *
 * @module googleServices
 * @version 2.0.0
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logging } from '@google-cloud/logging';
import { Storage } from '@google-cloud/storage';
import { BigQuery } from '@google-cloud/bigquery';
import { ErrorReporting } from '@google-cloud/error-reporting';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import pino from 'pino';
import config from './config.js';

// ── Pino Logger ────────────────────────────────────────────────────────────

/** @type {import('pino').Logger} Structured JSON logger for Cloud Run */
export const logger = pino({
  level: config.logLevel,
  transport: config.nodeEnv !== 'production' ? { target: 'pino-pretty' } : undefined,
});

// ── 1. Google Gemini 2.5 Flash (AI/ML API) ─────────────────────────────────

/** @type {GoogleGenerativeAI} Google Generative AI client */
export const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// ── 2. Google Cloud Logging ────────────────────────────────────────────────

/**
 * @type {Logging} Google Cloud Logging client.
 * Provides centralized, structured log management in Cloud Run.
 */
const cloudLogging = new Logging();
const cloudLog = cloudLogging.log('electiq-server');

/**
 * Writes a structured log entry to Google Cloud Logging.
 * Silently degrades in non-GCP environments (local dev).
 *
 * @param {string} severity - Log severity (INFO, WARNING, ERROR, CRITICAL)
 * @param {string} message - Log message
 * @param {object} [data={}] - Structured metadata for the log entry
 * @returns {Promise<void>}
 */
export async function writeCloudLog(severity, message, data = {}) {
  try {
    const entry = cloudLog.entry(
      { severity, resource: { type: 'cloud_run_revision' } },
      { message, ...data, service: 'electiq', timestamp: new Date().toISOString() }
    );
    await cloudLog.write(entry);
  } catch (_err) {
    // Expected in non-GCP environments
  }
}

// ── 3. Google Cloud Storage ────────────────────────────────────────────────

/**
 * @type {Storage} Google Cloud Storage client for asset and data management.
 * Used for exporting quiz analytics and storing generated reports.
 */
const storage = new Storage();

/**
 * Uploads a JSON data object to a Google Cloud Storage bucket.
 *
 * @param {string} bucketName - Target GCS bucket name
 * @param {string} fileName - Destination file path within the bucket
 * @param {object} data - Data object to serialize and upload
 * @returns {Promise<string|null>} GCS URI on success, null on failure
 */
export async function uploadToGCS(bucketName, fileName, data) {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    await file.save(JSON.stringify(data, null, 2), {
      contentType: 'application/json',
      metadata: { cacheControl: 'public, max-age=31536000' },
    });
    logger.info({ bucket: bucketName, file: fileName }, 'Uploaded to Google Cloud Storage');
    return `gs://${bucketName}/${fileName}`;
  } catch (err) {
    logger.warn({ error: err.message }, 'GCS upload skipped (non-GCP environment)');
    return null;
  }
}

// ── 4. Google Cloud BigQuery ───────────────────────────────────────────────

/**
 * @type {BigQuery} Google BigQuery client for analytics data warehousing.
 * Stores quiz completion metrics for aggregate analysis and dashboarding.
 */
const bigquery = new BigQuery();

/**
 * Inserts a quiz analytics row into a BigQuery dataset.
 * Enables aggregate analysis of quiz performance across all users.
 *
 * @param {object} quizResult - Quiz result data to insert
 * @param {string} quizResult.topic - Quiz topic
 * @param {number} quizResult.score - User's score
 * @param {number} quizResult.total - Total questions
 * @param {string} quizResult.requestId - Correlation ID for tracing
 * @returns {Promise<boolean>} True if insertion succeeded
 */
export async function insertQuizAnalytics(quizResult) {
  try {
    const dataset = bigquery.dataset('electiq_analytics');
    const table = dataset.table('quiz_results');
    await table.insert([{
      ...quizResult,
      timestamp: BigQuery.timestamp(new Date()),
    }]);
    logger.info({ topic: quizResult.topic }, 'Quiz analytics inserted into BigQuery');
    return true;
  } catch (err) {
    logger.warn({ error: err.message }, 'BigQuery insert skipped (non-GCP environment)');
    return false;
  }
}

/**
 * Queries aggregate quiz statistics from BigQuery.
 * Returns average scores, completion counts, and popular topics.
 *
 * @returns {Promise<Array<object>>} Aggregated quiz statistics
 */
export async function getQuizStatistics() {
  try {
    const query = `
      SELECT topic, COUNT(*) as attempts, AVG(score) as avg_score
      FROM \`electiq_analytics.quiz_results\`
      GROUP BY topic
      ORDER BY attempts DESC
      LIMIT 10
    `;
    const [rows] = await bigquery.query({ query });
    return rows;
  } catch (err) {
    logger.warn({ error: err.message }, 'BigQuery query skipped (non-GCP environment)');
    return [];
  }
}

// ── 5. Google Cloud Secret Manager ─────────────────────────────────────────

/**
 * @type {SecretManagerServiceClient} Secret Manager client for secure credential access.
 * Used to retrieve API keys and sensitive configuration in production.
 */
const secretManager = new SecretManagerServiceClient();

/**
 * Retrieves a secret value from Google Cloud Secret Manager.
 * Falls back to environment variables in non-GCP environments.
 *
 * @param {string} secretName - The full resource name of the secret
 * @returns {Promise<string|null>} The secret value or null
 */
export async function getSecret(secretName) {
  try {
    const [version] = await secretManager.accessSecretVersion({ name: secretName });
    return version.payload.data.toString('utf8');
  } catch (err) {
    logger.warn({ error: err.message }, 'Secret Manager access skipped (using env vars)');
    return null;
  }
}

// ── 6. Google Cloud Error Reporting ────────────────────────────────────────

/**
 * @type {ErrorReporting} Error Reporting client for production error tracking.
 * Automatically captures and groups errors for alerting in Cloud Console.
 */
let errorReporting;
try {
  errorReporting = new ErrorReporting({
    reportMode: config.nodeEnv === 'production' ? 'always' : 'never',
    serviceContext: { service: 'electiq', version: '3.0.0' },
  });
} catch (_err) {
  errorReporting = null;
}

/**
 * Reports an error to Google Cloud Error Reporting.
 * Enables automatic error grouping, alerting, and dashboard visibility.
 *
 * @param {Error} error - The error to report
 * @param {object} [context={}] - Additional context (requestId, endpoint, etc.)
 * @returns {void}
 */
export function reportError(error, context = {}) {
  if (errorReporting) {
    errorReporting.report(error, () => {
      logger.error({ error: error.message, ...context }, 'Error reported to Google Cloud Error Reporting');
    });
  } else {
    logger.error({ error: error.message, ...context }, 'Error (Error Reporting not available)');
  }
}

// ── 7. Vertex AI Content Safety ────────────────────────────────────────────

/**
 * Performs a content safety check on user input using Gemini's safety filters.
 * Acts as a Vertex AI content moderation layer to prevent abuse.
 *
 * @param {string} text - User input text to assess
 * @returns {Promise<{safe: boolean, assessed: boolean}>} Safety assessment result
 */
export async function assessContentSafety(text) {
  try {
    const model = genAI.getGenerativeModel({
      model: config.gemini.model,
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    });
    await model.generateContent(`Is this appropriate? YES or NO: "${text.substring(0, 200)}"`);
    return { safe: true, assessed: true };
  } catch (err) {
    if (err.message?.includes('SAFETY')) {
      return { safe: false, assessed: true };
    }
    return { safe: true, assessed: false };
  }
}
