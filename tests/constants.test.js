/**
 * @fileoverview Tests for centralized constants module.
 * Validates data integrity and structure of all application constants.
 */

import { describe, it, expect } from 'vitest';
import {
  API_BASE,
  INPUT_MAX_LENGTH,
  ELECTION_STEPS,
  TIMELINE_EVENTS,
  QUIZ_TOPICS,
  CHAT_QUICK_ACTIONS,
  OPTION_LETTERS,
} from '../src/constants';

describe('Constants Module', () => {
  it('API_BASE should be a valid path', () => {
    expect(API_BASE).toBe('/api');
  });

  it('INPUT_MAX_LENGTH should be a positive number', () => {
    expect(INPUT_MAX_LENGTH).toBeGreaterThan(0);
    expect(typeof INPUT_MAX_LENGTH).toBe('number');
  });

  it('ELECTION_STEPS should have exactly 6 steps', () => {
    expect(ELECTION_STEPS).toHaveLength(6);
  });

  it('ELECTION_STEPS should have sequential IDs from 1-6', () => {
    ELECTION_STEPS.forEach((step, i) => {
      expect(step.id).toBe(i + 1);
    });
  });

  it('ELECTION_STEPS should have title, desc, and icon for each step', () => {
    ELECTION_STEPS.forEach((step) => {
      expect(step.title).toBeTruthy();
      expect(step.desc).toBeTruthy();
      expect(step.icon).toBeTruthy();
    });
  });

  it('TIMELINE_EVENTS should have exactly 10 events', () => {
    expect(TIMELINE_EVENTS).toHaveLength(10);
  });

  it('TIMELINE_EVENTS should have phase, title, desc, and date for each', () => {
    TIMELINE_EVENTS.forEach((event) => {
      expect(event.phase).toBeTruthy();
      expect(event.title).toBeTruthy();
      expect(event.desc).toBeTruthy();
      expect(event.date).toBeTruthy();
    });
  });

  it('QUIZ_TOPICS should have at least 4 topics', () => {
    expect(QUIZ_TOPICS.length).toBeGreaterThanOrEqual(4);
  });

  it('CHAT_QUICK_ACTIONS should have at least 2 default actions', () => {
    expect(CHAT_QUICK_ACTIONS.length).toBeGreaterThanOrEqual(2);
  });

  it('OPTION_LETTERS should be A, B, C, D', () => {
    expect(OPTION_LETTERS).toEqual(['A', 'B', 'C', 'D']);
  });
});
