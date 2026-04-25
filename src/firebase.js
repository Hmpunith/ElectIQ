/**
 * @fileoverview Firebase configuration and service initialization for ElectIQ.
 *
 * Client-side Google services:
 *  8.  Firebase Firestore        — Quiz result persistence and leaderboard
 *  9.  Firebase Analytics        — User engagement tracking
 *  10. Firebase Auth             — Google Sign-In for user identification
 *  11. Firebase Performance      — Real User Monitoring (RUM) metrics
 *
 * @module firebase
 * @version 2.0.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { getPerformance } from 'firebase/performance';

/**
 * Firebase project configuration.
 * Values come from environment variables in production.
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

// ── Firebase App ───────────────────────────────────────────────────────────

/** @type {import('firebase/app').FirebaseApp} Firebase app instance */
const app = initializeApp(firebaseConfig);

// ── 8. Firebase Firestore ──────────────────────────────────────────────────

/** @type {import('firebase/firestore').Firestore} Firestore database */
const db = getFirestore(app);

// ── 9. Firebase Analytics ──────────────────────────────────────────────────

/** @type {import('firebase/analytics').Analytics|null} */
let analytics = null;

/**
 * Initializes Firebase Analytics if supported.
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
 *
 * @param {string} eventName - Event name to track
 * @param {object} [params={}] - Event parameters
 * @returns {void}
 */
export function trackEvent(eventName, params = {}) {
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
}

// ── 10. Firebase Auth (Google Sign-In) ─────────────────────────────────────

/** @type {import('firebase/auth').Auth} Firebase Auth instance */
const auth = getAuth(app);

/** @type {GoogleAuthProvider} Google OAuth provider */
const googleProvider = new GoogleAuthProvider();

/**
 * Signs in a user with Google using a popup window.
 * Enables personalized quiz tracking and leaderboard identity.
 *
 * @returns {Promise<import('firebase/auth').UserCredential|null>} User credential or null
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    trackEvent('login', { method: 'google' });
    return result;
  } catch (err) {
    console.warn('Google Sign-In failed:', err.message);
    return null;
  }
}

/**
 * Signs out the current user.
 * @returns {Promise<void>}
 */
export async function signOutUser() {
  try {
    await signOut(auth);
    trackEvent('logout');
  } catch (err) {
    console.warn('Sign-out failed:', err.message);
  }
}

/**
 * Subscribes to authentication state changes.
 *
 * @param {Function} callback - Called with the user object (or null) on auth state change
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── 11. Firebase Performance Monitoring ────────────────────────────────────

/**
 * Firebase Performance Monitoring for Real User Monitoring (RUM).
 * Automatically tracks page load times, network requests, and custom traces.
 */
let perf = null;
try {
  perf = getPerformance(app);
} catch (err) {
  console.warn('Firebase Performance not available in this environment');
}

// ── Firestore Operations ───────────────────────────────────────────────────

/**
 * Saves a quiz result to Firestore with user attribution.
 *
 * @param {object} result - Quiz result data
 * @param {string} result.topic - Quiz topic
 * @param {number} result.score - User's score
 * @param {number} result.total - Total questions
 * @param {number} result.percentage - Score percentage
 * @returns {Promise<string|null>} Firestore document ID or null
 */
export async function saveQuizResult(result) {
  try {
    const user = auth.currentUser;
    const docRef = await addDoc(collection(db, 'quizResults'), {
      ...result,
      userId: user?.uid || 'anonymous',
      displayName: user?.displayName || 'Anonymous Learner',
      timestamp: new Date().toISOString(),
    });
    trackEvent('quiz_completed', { topic: result.topic, score: result.score });
    return docRef.id;
  } catch (err) {
    console.warn('Firestore write failed (demo mode):', err.message);
    return null;
  }
}

/**
 * Retrieves top quiz scores from Firestore for leaderboard.
 *
 * @param {number} [count=10] - Maximum results to return
 * @returns {Promise<Array<object>>} Top quiz results
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
 * Tracks a chat interaction event.
 * @param {string} category - AI response category
 */
export function trackChatInteraction(category) {
  trackEvent('chat_interaction', { category });
}

/**
 * Tracks a step exploration event.
 * @param {string} stepTitle - The explored step title
 */
export function trackStepExplored(stepTitle) {
  trackEvent('step_explored', { step: stepTitle });
}

export { db, auth, analytics, perf };
export default app;
