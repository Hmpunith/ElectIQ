/**
 * @fileoverview Zod schema validation tests.
 * Verifies that AI response schemas accept valid data and reject invalid data.
 */

import { describe, it, expect } from 'vitest';
import { ChatResponseSchema, QuizSchema, StepExplainerSchema } from '../server/schemas';

describe('Zod Schema Validation', () => {
  it('ChatResponseSchema should accept valid chat response', () => {
    const valid = {
      answer: 'Test answer about elections',
      category: 'registration',
      followUpQuestions: ['Q1?', 'Q2?'],
    };
    expect(ChatResponseSchema.safeParse(valid).success).toBe(true);
  });

  it('ChatResponseSchema should reject invalid category', () => {
    const invalid = {
      answer: 'Test',
      category: 'invalid_category',
      followUpQuestions: [],
    };
    expect(ChatResponseSchema.safeParse(invalid).success).toBe(false);
  });

  it('QuizSchema should accept valid quiz with 4 options per question', () => {
    const valid = {
      questions: [
        { id: 1, question: 'Q?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'Exp' },
        { id: 2, question: 'Q?', options: ['A', 'B', 'C', 'D'], correctIndex: 1, explanation: 'Exp' },
        { id: 3, question: 'Q?', options: ['A', 'B', 'C', 'D'], correctIndex: 2, explanation: 'Exp' },
      ],
      topic: 'Test Topic',
    };
    expect(QuizSchema.safeParse(valid).success).toBe(true);
  });

  it('QuizSchema should reject quiz with fewer than 4 options', () => {
    const invalid = {
      questions: [
        { id: 1, question: 'Q?', options: ['A', 'B'], correctIndex: 0, explanation: 'Exp' },
      ],
      topic: 'Test',
    };
    expect(QuizSchema.safeParse(invalid).success).toBe(false);
  });

  it('StepExplainerSchema should accept valid step explanation', () => {
    const valid = {
      stepTitle: 'Test Step',
      explanation: 'Explanation text',
      keyPoints: ['Point 1', 'Point 2'],
      commonMistakes: ['Mistake 1'],
      tip: 'A helpful tip',
    };
    expect(StepExplainerSchema.safeParse(valid).success).toBe(true);
  });

  it('StepExplainerSchema should reject missing tip field', () => {
    const invalid = {
      stepTitle: 'Test Step',
      explanation: 'Explanation text',
      keyPoints: ['Point 1'],
      commonMistakes: ['Mistake 1'],
    };
    expect(StepExplainerSchema.safeParse(invalid).success).toBe(false);
  });
});
