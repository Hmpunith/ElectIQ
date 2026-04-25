/**
 * @fileoverview Middleware module — Centralizes all Express middleware configuration.
 * Security, compression, CORS, rate limiting, request tracking, and input sanitization.
 *
 * @module middleware
 * @version 1.0.0
 */

import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import crypto from 'crypto';
import xss from 'xss';
import config from './config.js';

/**
 * Configures Helmet security headers with a custom Content-Security-Policy
 * that whitelists Firebase, Firestore, Google APIs, and Google Fonts.
 *
 * @returns {import('express').RequestHandler} Helmet middleware
 */
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "https://apis.google.com", "https://www.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://www.gstatic.com"],
        connectSrc: [
          "'self'",
          "https://firestore.googleapis.com",
          "https://firebase.googleapis.com",
          "https://www.googleapis.com",
          "https://identitytoolkit.googleapis.com",
          "https://storage.googleapis.com",
        ],
        frameSrc: ["https://accounts.google.com"],
      },
    },
  });
}

/**
 * Configures CORS middleware with the allowed origin from config.
 *
 * @returns {import('express').RequestHandler} CORS middleware
 */
export function corsMiddleware() {
  return cors({ origin: config.corsOrigin });
}

/**
 * Configures API rate limiting per IP address.
 *
 * @returns {import('express').RequestHandler} Rate limiter middleware
 */
export function apiRateLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { error: 'Too many requests. Please wait a moment before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Attaches a unique request ID (UUID v4) to every incoming request
 * for distributed tracing and security audit trails.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
export function requestIdMiddleware(req, res, next) {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

/**
 * Sanitizes user input to prevent XSS attacks.
 * Strips dangerous HTML/JS from all string values in the request body.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
export function inputSanitizer(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
}

export { compression };
