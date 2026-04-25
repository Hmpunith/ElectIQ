/**
 * @fileoverview API endpoint tests with mocked Gemini responses.
 * Tests input validation, error handling, and response structure.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('API Endpoint Tests', () => {
  it('GET /api/health should return healthy status with requestId', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('electiq');
    expect(res.body).toHaveProperty('requestId');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('POST /api/chat should reject empty message', async () => {
    const res = await request(app).post('/api/chat').send({ message: '' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/chat should reject missing message field', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });

  it('POST /api/quiz should reject empty topic', async () => {
    const res = await request(app).post('/api/quiz').send({ topic: '' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/explain-step should reject empty step', async () => {
    const res = await request(app).post('/api/explain-step').send({ step: '' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
