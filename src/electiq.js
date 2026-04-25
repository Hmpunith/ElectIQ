/**
 * @fileoverview ElectIQ API connector
 * Handles all frontend-to-backend communication for the election assistant,
 * quiz generator, and step explainer.
 */

const API_BASE = '/api';

/**
 * Sends a question to the AI election assistant chatbot.
 * @param {string} message - The user's question about elections
 * @returns {Promise<object>} AI response with answer and follow-up questions
 */
export async function chatWithAssistant(message) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Generates an interactive election knowledge quiz.
 * @param {string} topic - The quiz topic (e.g., "Voter Registration")
 * @returns {Promise<object>} Quiz data with questions, options, and explanations
 */
export async function generateQuiz(topic) {
  const res = await fetch(`${API_BASE}/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * Requests a detailed AI explanation of a specific election process step.
 * @param {string} step - The election step to explain
 * @returns {Promise<object>} Detailed step explanation with key points and tips
 */
export async function explainStep(step) {
  const res = await fetch(`${API_BASE}/explain-step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}
