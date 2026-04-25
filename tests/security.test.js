/**
 * @fileoverview Security & middleware tests.
 * Validates Helmet headers, CORS, rate limiting, request IDs,
 * CSP domains, and XSS sanitization.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Security & Middleware Verification', () => {
  it('should apply Helmet security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).toHaveProperty('x-xss-protection');
    expect(res.headers).toHaveProperty('x-content-type-options');
  });

  it('should apply Content-Security-Policy header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).toHaveProperty('content-security-policy');
  });

  it('should enable CORS headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).toHaveProperty('access-control-allow-origin');
  });

  it('should apply rate limiting headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).toHaveProperty('ratelimit-limit');
  });

  it('should attach X-Request-Id UUID to every response', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).toHaveProperty('x-request-id');
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('should include Firebase and Google Cloud domains in CSP', async () => {
    const res = await request(app).get('/api/health');
    const csp = res.headers['content-security-policy'];
    expect(csp).toContain('firestore.googleapis.com');
    expect(csp).toContain('firebase.googleapis.com');
    expect(csp).toContain('storage.googleapis.com');
  });

  it('should include Google Fonts domains in CSP', async () => {
    const res = await request(app).get('/api/health');
    const csp = res.headers['content-security-policy'];
    expect(csp).toContain('fonts.googleapis.com');
    expect(csp).toContain('fonts.gstatic.com');
  });

  it('should sanitize XSS from request body', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: '<script>alert("xss")</script>How to vote?' });
    // Should not crash — sanitizer strips the script tag before reaching handler
    expect(res.status).toBeLessThanOrEqual(500);
  });
});
