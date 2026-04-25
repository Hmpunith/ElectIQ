/**
 * @fileoverview Application configuration module.
 * Centralizes all server-side configuration values with environment variable fallbacks.
 * Improves code quality by eliminating scattered inline constants.
 *
 * @module config
 * @version 1.0.0
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * @constant {object} config - Server configuration object
 * @property {number} port - Server port (default: 8080 for Cloud Run)
 * @property {string} nodeEnv - Current environment
 * @property {string} logLevel - Logging verbosity
 * @property {string} corsOrigin - Allowed CORS origin
 * @property {object} rateLimit - Rate limiting configuration
 * @property {object} cache - Caching configuration
 * @property {object} gemini - Google Gemini AI configuration
 */
const config = {
  port: parseInt(process.env.PORT, 10) || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  rateLimit: {
    windowMs: 60 * 1000,
    max: 20,
  },

  cache: {
    stdTTL: 600,
    checkperiod: 120,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.5-flash',
    temperature: 0.2,
    topP: 0.8,
    maxOutputTokens: 2048,
  },

  inputLimits: {
    chatMaxLength: 1000,
    quizTopicMaxLength: 500,
    stepNameMaxLength: 500,
    bodyMaxSize: '500kb',
  },
};

export default config;
