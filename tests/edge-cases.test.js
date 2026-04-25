/**
 * @fileoverview Edge case tests for API input handling.
 * Tests invalid types, boundary conditions, and malformed payloads.
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Edge Case Handling', () => {
  it('should reject numeric message in chat', async () => {
    const res = await request(app).post('/api/chat').send({ message: 12345 });
    expect(res.status).toBe(400);
  });

  it('should reject null topic in quiz', async () => {
    const res = await request(app).post('/api/quiz').send({ topic: null });
    expect(res.status).toBe(400);
  });

  it('should reject boolean step in explain-step', async () => {
    const res = await request(app).post('/api/explain-step').send({ step: true });
    expect(res.status).toBe(400);
  });

  it('should reject array as message', async () => {
    const res = await request(app).post('/api/chat').send({ message: ['hello'] });
    expect(res.status).toBe(400);
  });

  it('should handle empty JSON body gracefully', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should handle whitespace-only message', async () => {
    const res = await request(app).post('/api/chat').send({ message: '   ' });
    expect(res.status).toBe(400);
  });
});
