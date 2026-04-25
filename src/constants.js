/**
 * @fileoverview Application-wide constants for ElectIQ.
 * Centralizes configuration values, reducing magic strings and improving maintainability.
 *
 * @module constants
 * @version 1.0.0
 */

/** @constant {string} API_BASE - Base URL for all API endpoints */
export const API_BASE = '/api';

/** @constant {number} INPUT_MAX_LENGTH - Maximum allowed input length for chat messages */
export const INPUT_MAX_LENGTH = 1000;

/** @constant {number} QUIZ_TOPIC_MAX_LENGTH - Maximum allowed quiz topic length */
export const QUIZ_TOPIC_MAX_LENGTH = 500;

/** @constant {number} STEP_NAME_MAX_LENGTH - Maximum allowed step name length */
export const STEP_NAME_MAX_LENGTH = 500;

/**
 * @constant {Array<object>} ELECTION_STEPS - The 6 core steps in the election process.
 * Each step maps directly to the problem statement requirement for "steps".
 */
export const ELECTION_STEPS = [
  { id: 1, title: 'Voter Registration', desc: 'Ensure you are eligible and registered to vote before the deadline.', icon: '📝' },
  { id: 2, title: 'Candidate Nomination', desc: 'Candidates file nominations and are officially listed for the election.', icon: '📋' },
  { id: 3, title: 'Campaign Period', desc: 'Candidates present their platforms and engage with voters.', icon: '📢' },
  { id: 4, title: 'Voting Day', desc: 'Registered voters cast their ballots at designated polling stations.', icon: '🗳️' },
  { id: 5, title: 'Vote Counting', desc: 'Ballots are collected, verified, and counted under official observation.', icon: '📊' },
  { id: 6, title: 'Results Declaration', desc: 'Official results are announced and certified by the Election Commission.', icon: '🏛️' },
];

/**
 * @constant {Array<object>} TIMELINE_EVENTS - Complete election timeline from announcement to government formation.
 * Each event maps directly to the problem statement requirement for "timelines".
 */
export const TIMELINE_EVENTS = [
  { phase: 'Pre-Election', title: 'Election Announcement', desc: 'The Election Commission officially announces the election schedule, including key dates and constituencies.', date: 'Day 0' },
  { phase: 'Pre-Election', title: 'Voter Registration Deadline', desc: 'Last day for eligible citizens to register or update their voter information.', date: 'Day 1 — Day 30' },
  { phase: 'Nomination', title: 'Candidate Filing Opens', desc: 'Aspiring candidates submit their nomination papers along with required documents and deposits.', date: 'Day 31 — Day 45' },
  { phase: 'Nomination', title: 'Scrutiny of Nominations', desc: 'Election officials review and verify all filed nominations for eligibility compliance.', date: 'Day 46 — Day 50' },
  { phase: 'Campaign', title: 'Official Campaign Period', desc: 'Candidates conduct rallies, debates, and outreach. Media coverage intensifies.', date: 'Day 51 — Day 75' },
  { phase: 'Campaign', title: 'Campaign Silence Period', desc: 'All campaigning must stop 48 hours before polling to allow voters to reflect.', date: 'Day 76 — Day 77' },
  { phase: 'Voting', title: 'Polling Day', desc: 'Registered voters cast their ballots at designated polling stations across the country.', date: 'Day 78' },
  { phase: 'Post-Election', title: 'Vote Counting', desc: 'Sealed ballot boxes are opened and counted under strict supervision of officials and observers.', date: 'Day 79 — Day 80' },
  { phase: 'Post-Election', title: 'Results Declaration', desc: 'Official results are announced constituency by constituency by the Election Commission.', date: 'Day 81' },
  { phase: 'Post-Election', title: 'Government Formation', desc: 'The winning party or coalition is invited to form the government and take office.', date: 'Day 82+' },
];

/**
 * @constant {Array<string>} QUIZ_TOPICS - Available quiz topics for the election knowledge quiz.
 */
export const QUIZ_TOPICS = [
  '🗳️ Voter Registration',
  '📋 Candidate Nominations',
  '🎤 Campaigning Rules',
  '🏛️ Voting Day Process',
  '📊 Vote Counting',
  '⚖️ Voter Rights',
];

/**
 * @constant {Array<object>} CHAT_QUICK_ACTIONS - Default quick action buttons for the chat assistant.
 */
export const CHAT_QUICK_ACTIONS = [
  'How do I register to vote?',
  'What happens on voting day?',
  'How are votes counted?',
];

/**
 * @constant {Array<string>} OPTION_LETTERS - Letters used for quiz option labeling.
 */
export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
