import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const ChatResponseSchema = z.object({
  answer: z.string(),
  category: z.enum(['registration', 'voting', 'timeline', 'candidates', 'results', 'general', 'rights']),
  sources: z.array(z.string()).optional(),
  followUpQuestions: z.array(z.string()),
});

const QuizSchema = z.object({
  questions: z.array(z.object({
    id: z.number(),
    question: z.string(),
    options: z.array(z.string()).min(4).max(4),
    correctIndex: z.number().min(0).max(3),
    explanation: z.string(),
  })).min(3).max(5),
  topic: z.string(),
});

describe('Schema Validation Tests', () => {
  it('ChatResponseSchema should accept valid election response', () => {
    const result = ChatResponseSchema.safeParse({
      answer: 'You can register online.',
      category: 'registration',
      followUpQuestions: ['What ID do I need?'],
    });
    expect(result.success).toBe(true);
  });

  it('ChatResponseSchema should reject invalid category', () => {
    const result = ChatResponseSchema.safeParse({
      answer: 'Test', category: 'invalid', followUpQuestions: [],
    });
    expect(result.success).toBe(false);
  });

  it('QuizSchema should accept valid quiz with 3+ questions', () => {
    const result = QuizSchema.safeParse({
      questions: [
        { id: 1, question: 'Q1?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'E1' },
        { id: 2, question: 'Q2?', options: ['A', 'B', 'C', 'D'], correctIndex: 1, explanation: 'E2' },
        { id: 3, question: 'Q3?', options: ['A', 'B', 'C', 'D'], correctIndex: 2, explanation: 'E3' },
      ],
      topic: 'Voter Registration',
    });
    expect(result.success).toBe(true);
  });

  it('QuizSchema should reject quiz with fewer than 3 questions', () => {
    const result = QuizSchema.safeParse({
      questions: [
        { id: 1, question: 'Q1?', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'E1' },
      ],
      topic: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('QuizSchema should reject questions with fewer than 4 options', () => {
    const result = QuizSchema.safeParse({
      questions: [
        { id: 1, question: 'Q1?', options: ['A', 'B'], correctIndex: 0, explanation: 'E1' },
        { id: 2, question: 'Q2?', options: ['A', 'B', 'C', 'D'], correctIndex: 1, explanation: 'E2' },
        { id: 3, question: 'Q3?', options: ['A', 'B', 'C', 'D'], correctIndex: 2, explanation: 'E3' },
      ],
      topic: 'Test',
    });
    expect(result.success).toBe(false);
  });
});
