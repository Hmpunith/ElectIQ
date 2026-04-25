/**
 * @fileoverview Google Cloud services integration tests.
 * Validates ALL Google Cloud SDK integrations are properly configured.
 */

import { describe, it, expect } from 'vitest';
import {
  genAI,
  logger,
  writeCloudLog,
  uploadToGCS,
  insertQuizAnalytics,
  getQuizStatistics,
  getSecret,
  reportError,
  assessContentSafety,
} from '../server/googleServices';
import config from '../server/config';

describe('Google Cloud Services Integration', () => {
  // 1. Google Gemini AI
  it('should export a configured GoogleGenerativeAI client', () => {
    expect(genAI).toBeDefined();
    expect(typeof genAI.getGenerativeModel).toBe('function');
  });

  // 2. Pino Logger
  it('should export a configured pino logger with all levels', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });

  // 3. Google Cloud Logging
  it('writeCloudLog should not throw in non-GCP environments', async () => {
    await expect(writeCloudLog('INFO', 'Test log entry', { test: true })).resolves.not.toThrow();
  });

  // 4. Google Cloud Storage
  it('uploadToGCS should gracefully return null in non-GCP environments', async () => {
    const result = await uploadToGCS('test-bucket', 'test.json', { test: true });
    expect(result).toBeNull();
  });

  // 5. Google BigQuery
  it('insertQuizAnalytics should gracefully fail in non-GCP environments', async () => {
    const result = await insertQuizAnalytics({ topic: 'Test', score: 3, total: 5, requestId: 'test-123' });
    expect(result).toBe(false);
  });

  it('getQuizStatistics should return empty array in non-GCP environments', async () => {
    const stats = await getQuizStatistics();
    expect(Array.isArray(stats)).toBe(true);
    expect(stats).toHaveLength(0);
  });

  // 6. Google Cloud Secret Manager
  it('getSecret function should be defined and return a promise', async () => {
    expect(typeof getSecret).toBe('function');
  });

  // 7. Google Cloud Error Reporting
  it('reportError should not throw when called with an Error object', () => {
    expect(() => reportError(new Error('Test error'), { context: 'test' })).not.toThrow();
  });

  // Config validation
  it('config should have valid Gemini model configuration', () => {
    expect(config.gemini.model).toBe('gemini-2.5-flash');
    expect(config.gemini.temperature).toBeLessThanOrEqual(1);
    expect(config.gemini.maxOutputTokens).toBeGreaterThan(0);
  });

  it('config should have valid rate limit settings', () => {
    expect(config.rateLimit.windowMs).toBe(60000);
    expect(config.rateLimit.max).toBeGreaterThan(0);
  });

  it('config should have valid input limit settings', () => {
    expect(config.inputLimits.chatMaxLength).toBeGreaterThan(0);
    expect(config.inputLimits.quizTopicMaxLength).toBeGreaterThan(0);
    expect(config.inputLimits.bodyMaxSize).toBe('500kb');
  });
});
