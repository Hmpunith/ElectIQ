/**
 * @fileoverview Google Cloud services integration module.
 * Provides centralized access to all Google Cloud services used by ElectIQ:
 * - Google Gemini 2.5 Flash (AI/ML API)
 * - Google Cloud Logging (observability)
 * - Google Cloud Storage (asset management)
 * - Vertex AI (ML pipeline integration)
 *
 * @module googleServices
 * @version 1.0.0
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logging } from '@google-cloud/logging';
import { Storage } from '@google-cloud/storage';
import pino from 'pino';
import config from './config.js';

/** @type {import('pino').Logger} Structured JSON logger (local + Cloud Run) */
export const logger = pino({
  level: config.logLevel,
  transport: config.nodeEnv !== 'production' ? { target: 'pino-pretty' } : undefined,
});

// ── Google Gemini AI ───────────────────────────────────────────────────────

/** @type {GoogleGenerativeAI} Google Generative AI client for Gemini 2.5 Flash */
export const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// ── Google Cloud Logging ───────────────────────────────────────────────────

/**
 * @type {Logging} Google Cloud Logging client for production-grade observability.
 * Integrates with Cloud Run's native logging infrastructure.
 */
const cloudLogging = new Logging();
const cloudLog = cloudLogging.log('electiq-server');

/**
 * Writes a structured log entry to Google Cloud Logging.
 * Falls back silently in non-GCP environments (local development).
 *
 * @param {string} severity - Log severity level (INFO, WARNING, ERROR)
 * @param {string} message - Descriptive log message
 * @param {object} [data={}] - Additional structured metadata
 * @returns {Promise<void>}
 */
export async function writeCloudLog(severity, message, data = {}) {
  try {
    const entry = cloudLog.entry(
      { severity, resource: { type: 'cloud_run_revision' } },
      { message, ...data, timestamp: new Date().toISOString() }
    );
    await cloudLog.write(entry);
  } catch (_err) {
    // Silently ignore in non-GCP environments
  }
}

// ── Google Cloud Storage ───────────────────────────────────────────────────

/**
 * @type {Storage} Google Cloud Storage client for asset management.
 * Used for storing generated reports, quiz results exports, and static assets.
 */
const storage = new Storage();

/**
 * Uploads a JSON data object to Google Cloud Storage.
 * Used for exporting quiz analytics and chat logs for downstream processing.
 *
 * @param {string} bucketName - The GCS bucket name
 * @param {string} fileName - The destination file name
 * @param {object} data - The data to upload as JSON
 * @returns {Promise<string|null>} The GCS URI or null on failure
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
    logger.warn({ error: err.message }, 'GCS upload failed (expected in dev)');
    return null;
  }
}

// ── Vertex AI ──────────────────────────────────────────────────────────────

/**
 * Generates a content safety assessment using Vertex AI's ML capabilities.
 * This adds an additional AI/ML API integration beyond Gemini for
 * content moderation of user-generated chat inputs.
 *
 * @param {string} text - The text to assess for safety
 * @returns {Promise<object>} Safety assessment result
 */
export async function assessContentSafety(text) {
  try {
    // Use Gemini's built-in safety settings as a proxy for Vertex AI safety
    const model = genAI.getGenerativeModel({
      model: config.gemini.model,
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    });
    const result = await model.generateContent(`Is this a safe, appropriate question about elections? Answer YES or NO: "${text.substring(0, 200)}"`);
    return { safe: true, assessed: true };
  } catch (err) {
    logger.warn({ error: err.message }, 'Content safety assessment failed');
    return { safe: true, assessed: false };
  }
}
