/**
 * @fileoverview ElectIQ Backend Server — Entry Point
 * Enterprise-grade Express server powering an AI election assistant.
 *
 * Architecture:
 * - server/config.js        → Centralized configuration
 * - server/middleware.js     → Security & utility middleware (Helmet, XSS, CORS)
 * - server/googleServices.js → ALL Google Cloud service integrations
 * - server/schemas.js        → Zod data validation schemas
 * - server/prompts.js        → AI system instructions with few-shot examples
 * - server/routes.js         → API route handlers with BigQuery and Error Reporting
 *
 * Google Cloud Services (12 total):
 *  Server-side:
 *   1. Google Gemini 2.5 Flash     — AI/ML API (@google/generative-ai)
 *   2. Google Cloud Run            — Deployment platform
 *   3. Google Cloud BigQuery       — Analytics warehouse (@google-cloud/bigquery)
 *   4. Google Cloud Logging        — Observability (@google-cloud/logging)
 *   5. Google Cloud Storage        — Asset management (@google-cloud/storage)
 *   6. Google Cloud Secret Manager — Credential management (@google-cloud/secret-manager)
 *   7. Google Cloud Error Reporting— Error tracking (@google-cloud/error-reporting)
 *  Client-side:
 *   8.  Firebase Firestore         — Quiz persistence (firebase/firestore)
 *   9.  Firebase Analytics         — Engagement tracking (firebase/analytics)
 *   10. Firebase Auth              — Google Sign-In (firebase/auth)
 *   11. Firebase Performance       — RUM metrics (firebase/performance)
 *   12. Google Fonts               — Typography CDN
 *
 * @author ElectIQ Team
 * @version 4.0.0
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
