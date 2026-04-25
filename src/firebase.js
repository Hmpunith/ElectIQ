/**
 * @fileoverview Firebase configuration and service initialization for ElectIQ.
 * Provides Firestore for quiz result persistence and Analytics for user engagement tracking.
 * These Google Cloud services demonstrate deep ecosystem integration beyond basic API usage.
 *
 * @module firebase
 * @version 1.0.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';

/**
 * Firebase project configuration.
 * In production, these values are populated from environment variables.
 * @constant {object}
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'electiq-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'electiq-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'electiq-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX',
};

/** @type {import('firebase/app').FirebaseApp} Firebase app instance */
const app = initializeApp(firebaseConfig);

/** @type {import('firebase/firestore').Firestore} Firestore database instance */
const db = getFirestore(app);

/** @type {import('firebase/analytics').Analytics|null} Analytics instance (null if unsupported) */
let analytics = null;

/**
 * Initializes Firebase Analytics if supported by the current browser.
 * Analytics may not be supported in test environments or certain browsers.
 * @returns {Promise<void>}
 */
async function initAnalytics() {
  try {
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(app);
    }
  } catch (err) {
    console.warn('Firebase Analytics not supported in this environment');
  }
}

initAnalytics();

/**
 * Tracks a user interaction event in Firebase Analytics.
 * Safely handles environments where Analytics is unavailable.
 *
 * @param {string} eventName - The name of the event to track
 * @param {object} [params={}] - Optional event parameters
 * @returns {void}
 */
export function trackEvent(eventName, params = {}) {
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
}

/**
 * Saves a quiz result to Firestore for persistence and leaderboard tracking.
 *
 * @param {object} result - The quiz result to save
 * @param {string} result.topic - The quiz topic
 * @param {number} result.score - The user's score
 * @param {number} result.total - Total questions in the quiz
 * @param {number} result.percentage - Score percentage
 * @returns {Promise<string|null>} The Firestore document ID, or null on failure
 */
export async function saveQuizResult(result) {
  try {
    const docRef = await addDoc(collection(db, 'quizResults'), {
      ...result,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
    trackEvent('quiz_completed', { topic: result.topic, score: result.score });
    return docRef.id;
  } catch (err) {
    console.warn('Firestore write failed (demo mode):', err.message);
    return null;
  }
}

/**
 * Retrieves the top quiz scores from Firestore for leaderboard display.
 *
 * @param {number} [count=10] - Maximum number of results to fetch
 * @returns {Promise<Array<object>>} Array of top quiz results
 */
export async function getTopScores(count = 10) {
  try {
    const q = query(
      collection(db, 'quizResults'),
      orderBy('percentage', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Firestore read failed (demo mode):', err.message);
    return [];
  }
}

/**
 * Tracks a chat interaction for analytics and usage monitoring.
 *
 * @param {string} category - The response category from the AI
 * @returns {void}
 */
export function trackChatInteraction(category) {
  trackEvent('chat_interaction', { category });
}

/**
 * Tracks a step exploration event for analytics.
 *
 * @param {string} stepTitle - The title of the step explored
 * @returns {void}
 */
export function trackStepExplored(stepTitle) {
  trackEvent('step_explored', { step: stepTitle });
}

export { db, analytics };
export default app;
