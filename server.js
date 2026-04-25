/**
 * @fileoverview ElectIQ Backend Server — Entry Point
 * Enterprise-grade Express server powering an AI election assistant.
 *
 * Architecture:
 * - server/config.js      → Centralized configuration
 * - server/middleware.js   → Security & utility middleware
 * - server/googleServices.js → Google Cloud Logging, Cloud Storage, Vertex AI
 * - server/schemas.js      → Zod data validation schemas
 * - server/prompts.js      → AI system instructions with few-shot examples
 * - server/routes.js       → API route handlers
 *
 * Google Cloud Services:
 * 1. Google Gemini 2.5 Flash — AI/ML API for chat, quiz, and step explainer
 * 2. Google Cloud Run — Deployment and auto-scaling
 * 3. Google Cloud Logging — Production observability via @google-cloud/logging
 * 4. Google Cloud Storage — Asset management via @google-cloud/storage
 * 5. Firebase Firestore — Quiz result persistence (client-side)
 * 6. Firebase Analytics — User engagement tracking (client-side)
 * 7. Google Fonts — Typography (Inter, JetBrains Mono)
 *
 * @author ElectIQ Team
 * @version 3.0.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './server/config.js';
import { logger } from './server/googleServices.js';
import {
  securityHeaders,
  corsMiddleware,
  apiRateLimiter,
  requestIdMiddleware,
  inputSanitizer,
  compression,
} from './server/middleware.js';
import apiRoutes from './server/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Middleware Stack ────────────────────────────────────────────────────────

app.use(securityHeaders());
app.use(compression());
app.use(corsMiddleware());
app.use(express.json({ limit: config.inputLimits.bodyMaxSize }));
app.use(requestIdMiddleware);
app.use(inputSanitizer);

// ── API Routes (rate-limited) ──────────────────────────────────────────────

app.use('/api', apiRateLimiter(), apiRoutes);

// ── Static Files (Production) ──────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')));

/** SPA fallback — serves index.html for all non-API routes */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ── Start Server ───────────────────────────────────────────────────────────

if (config.nodeEnv !== 'test') {
  app.listen(config.port, () => {
    logger.info({ port: config.port }, 'ElectIQ server is live');
  });
}

export default app;
