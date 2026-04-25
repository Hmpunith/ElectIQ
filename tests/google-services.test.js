/**
 * @fileoverview Google Cloud services integration tests.
 * Validates that all Google service modules are properly configured.
 */

import { describe, it, expect } from 'vitest';
import { genAI, logger, writeCloudLog, uploadToGCS, assessContentSafety } from '../server/googleServices';
import config from '../server/config';

describe('Google Services Integration', () => {
  it('should export a configured GoogleGenerativeAI client', () => {
    expect(genAI).toBeDefined();
    expect(typeof genAI.getGenerativeModel).toBe('function');
  });

  it('should export a configured pino logger', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });

  it('writeCloudLog should not throw in non-GCP environments', async () => {
    await expect(writeCloudLog('INFO', 'Test log')).resolves.not.toThrow();
  });

  it('uploadToGCS should gracefully fail in non-GCP environments', async () => {
    const result = await uploadToGCS('test-bucket', 'test.json', { test: true });
    expect(result).toBeNull();
  });

  it('config should have valid Gemini model configuration', () => {
    expect(config.gemini.model).toBe('gemini-2.5-flash');
    expect(config.gemini.temperature).toBeLessThanOrEqual(1);
    expect(config.gemini.maxOutputTokens).toBeGreaterThan(0);
  });

  it('config should have valid rate limit settings', () => {
    expect(config.rateLimit.windowMs).toBe(60000);
    expect(config.rateLimit.max).toBeGreaterThan(0);
  });

  it('config should have valid input limits', () => {
    expect(config.inputLimits.chatMaxLength).toBeGreaterThan(0);
    expect(config.inputLimits.quizTopicMaxLength).toBeGreaterThan(0);
  });
});
