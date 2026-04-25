import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Security & Middleware Verification', () => {
  it('should apply Helmet security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).toHaveProperty('x-xss-protection');
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
});
