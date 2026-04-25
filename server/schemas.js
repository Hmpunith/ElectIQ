/**
 * @fileoverview Zod schema definitions for all API data contracts.
 * Ensures type safety and prevents AI hallucinations by validating
 * every response from Google Gemini before serving to clients.
 *
 * @module schemas
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Schema for election assistant chatbot API responses.
 * Validates answer text, category classification, and follow-up suggestions.
 *
 * @type {z.ZodObject}
 */
export const ChatResponseSchema = z.object({
  answer: z.string(),
  category: z.enum(['registration', 'voting', 'timeline', 'candidates', 'results', 'general', 'rights']),
  sources: z.array(z.string()).optional(),
  followUpQuestions: z.array(z.string()),
});

/**
 * Schema for election quiz generation API responses.
 * Ensures exactly 4 options per question with valid correctIndex.
 *
 * @type {z.ZodObject}
 */
export const QuizSchema = z.object({
  questions: z.array(z.object({
    id: z.number(),
    question: z.string(),
    options: z.array(z.string()).min(4).max(4),
    correctIndex: z.number().min(0).max(3),
    explanation: z.string(),
  })).min(3).max(5),
  topic: z.string(),
});

/**
 * Schema for election step explanation API responses.
 * Validates structured step breakdowns with key points and tips.
 *
 * @type {z.ZodObject}
 */
export const StepExplainerSchema = z.object({
  stepTitle: z.string(),
  explanation: z.string(),
  keyPoints: z.array(z.string()),
  commonMistakes: z.array(z.string()),
  tip: z.string(),
});
