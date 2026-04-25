import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Edge Case & Resilience Tests', () => {
  it('should reject non-string inputs for quiz topic', async () => {
    const res = await request(app).post('/api/quiz').send({ topic: { obj: true } });
    expect(res.status).toBe(400);
  });

  it('should reject empty string inputs', async () => {
    const res = await request(app).post('/api/explain-step').send({ step: '   ' });
    expect(res.status).toBe(400);
  });

  it('should reject non-string chat message', async () => {
    const res = await request(app).post('/api/chat').send({ message: 12345 });
    expect(res.status).toBe(400);
  });

  it('should return error when body has no message field', async () => {
    const res = await request(app).post('/api/chat').send({ wrong: 'field' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });
});
