import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Security & Middleware Verification', () => {
  it('should apply Helmet X-XSS-Protection header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).toHaveProperty('x-xss-protection');
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

  it('should attach X-Request-Id to every response', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).toHaveProperty('x-request-id');
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('should include Firebase/Firestore domains in CSP connect-src', async () => {
    const res = await request(app).get('/api/health');
    const csp = res.headers['content-security-policy'];
    expect(csp).toContain('firestore.googleapis.com');
    expect(csp).toContain('firebase.googleapis.com');
  });
});
