import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('API Integration Tests', () => {
  it('GET /api/health should return healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('electiq');
  });

  it('POST /api/chat should require message', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });

  it('POST /api/quiz should require topic', async () => {
    const res = await request(app).post('/api/quiz').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });

  it('POST /api/explain-step should require step', async () => {
    const res = await request(app).post('/api/explain-step').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });

  it('POST /api/chat should reject non-string message', async () => {
    const res = await request(app).post('/api/chat').send({ message: 123 });
    expect(res.status).toBe(400);
  });
});
