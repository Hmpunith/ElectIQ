/**
 * @fileoverview ElectionQuiz component — Interactive AI-generated election knowledge quiz.
 * Addresses the "interactive" portion of the problem statement.
 * Integrates Firebase Firestore for quiz result persistence and Analytics for tracking.
 *
 * @module ElectionQuiz
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { generateQuiz } from '../electiq.js';
import { QUIZ_TOPICS, OPTION_LETTERS } from '../constants.js';
import { saveQuizResult, trackEvent } from '../firebase.js';

/**
 * ElectionQuiz provides a gamified learning experience with
 * AI-generated questions, real-time scoring, explanations, and
 * Firestore-backed result persistence.
 *
 * @returns {JSX.Element} The rendered quiz component
 */
export default function ElectionQuiz() {
  /** @type {[object|null, Function]} Quiz data from Gemini AI */
  const [quizData, setQuizData] = useState(null);
  /** @type {[number, Function]} Current question index */
  const [currentQ, setCurrentQ] = useState(0);
  /** @type {[number|null, Function]} Selected answer index */
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  /** @type {[number, Function]} Running score */
  const [score, setScore] = useState(0);
  /** @type {[boolean, Function]} Whether to show the final results screen */
  const [showResult, setShowResult] = useState(false);
  /** @type {[boolean, Function]} Loading state for quiz generation */
  const [loading, setLoading] = useState(false);
  /** @type {[string|null, Function]} Error message */
  const [error, setError] = useState(null);

  /**
   * Starts a new quiz by requesting AI-generated questions for the given topic.
   *
   * @param {string} topic - The quiz topic to generate questions for
   * @returns {Promise<void>}
   */
  const startQuiz = useCallback(async (topic) => {
    setLoading(true);
    setError(null);
    setQuizData(null);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);

    try {
      const data = await generateQuiz(topic);
      setQuizData(data);
      trackEvent('quiz_started', { topic });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handles answer selection, calculates correctness, and updates score.
   *
   * @param {number} index - The index of the selected answer (0-3)
   * @returns {void}
   */
  const handleAnswer = useCallback((index) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (quizData && index === quizData.questions[currentQ].correctIndex) {
      setScore((prev) => prev + 1);
    }
  }, [selectedAnswer, quizData, currentQ]);

  /**
   * Advances to the next question or triggers the results screen.
   * Saves final results to Firebase Firestore when the quiz ends.
   *
   * @returns {Promise<void>}
   */
  const nextQuestion = useCallback(async () => {
    if (!quizData) return;

    if (currentQ + 1 >= quizData.questions.length) {
      setShowResult(true);
      const finalScore = selectedAnswer !== null && quizData.questions[currentQ].correctIndex === selectedAnswer
        ? score + 1 : score;
      await saveQuizResult({
        topic: quizData.topic,
        score: finalScore,
        total: quizData.questions.length,
        percentage: Math.round((finalScore / quizData.questions.length) * 100),
      });
    } else {
      setCurrentQ((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  }, [quizData, currentQ, score, selectedAnswer]);

  /**
   * Resets the quiz to the topic selection screen.
   * @returns {void}
   */
  const resetQuiz = () => {
    setQuizData(null);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
  };

  return (
    <article className="card" aria-labelledby="quiz-title">
      <div className="card__header">
        <h2 className="card__title" id="quiz-title">🧠 Election Quiz</h2>
        {quizData && <span className="card__badge card__badge--ai">{quizData.topic}</span>}
      </div>

      {/* Topic Selection */}
      {!quizData && !loading && !error && (
        <div className="quiz-start">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Test your knowledge of the election process! Choose a topic:
          </p>
          <div className="quiz-start__grid" role="group" aria-label="Quiz topic options">
            {QUIZ_TOPICS.map((topic, i) => (
              <button
                key={i}
                className="quiz-topic-btn"
                onClick={() => startQuiz(topic)}
                aria-label={`Start quiz on ${topic}`}
                type="button"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }} role="status" aria-label="Generating quiz">
          <div className="skeleton skeleton--text" style={{ margin: '0 auto' }}></div>
          <div className="skeleton skeleton--text-sm" style={{ margin: '0.5rem auto 0' }}></div>
          <span className="sr-only">Generating quiz questions...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div role="alert" aria-live="assertive" style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>⚠️ {error}</p>
          <button className="quiz-btn" onClick={resetQuiz} type="button" style={{ marginTop: '0.5rem' }}>Try Again</button>
        </div>
      )}

      {/* Active Question */}
      {quizData && !showResult && !loading && (
        <div className="quiz-question" aria-live="polite">
          <div className="quiz-question__progress" aria-label={`Question ${currentQ + 1} of ${quizData.questions.length}`}>
            Question {currentQ + 1} of {quizData.questions.length}
          </div>
          <h3 className="quiz-question__text">{quizData.questions[currentQ].question}</h3>

          <ul className="quiz-options" role="radiogroup" aria-label="Answer options">
            {quizData.questions[currentQ].options.map((opt, i) => {
              let className = 'quiz-option';
              if (selectedAnswer !== null) {
                className += ' quiz-option--disabled';
                if (i === quizData.questions[currentQ].correctIndex) className += ' quiz-option--correct';
                else if (i === selectedAnswer) className += ' quiz-option--wrong';
              }
              return (
                <li
                  key={i}
                  className={className}
                  onClick={() => handleAnswer(i)}
                  role="radio"
                  aria-checked={selectedAnswer === i}
                  aria-label={`Option ${OPTION_LETTERS[i]}: ${opt}`}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAnswer(i)}
                >
                  <span className="quiz-option__letter" aria-hidden="true">{OPTION_LETTERS[i]}</span>
                  <span>{opt}</span>
                </li>
              );
            })}
          </ul>

          {selectedAnswer !== null && (
            <>
              <div className="quiz-explanation" role="note" aria-label="Explanation">
                💡 {quizData.questions[currentQ].explanation}
              </div>
              <button className="quiz-btn" onClick={nextQuestion} type="button" aria-label={currentQ + 1 >= quizData.questions.length ? 'See Results' : 'Next Question'}>
                {currentQ + 1 >= quizData.questions.length ? '📊 See Results' : 'Next Question →'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Results */}
      {showResult && (
        <div className="quiz-result" aria-live="polite" role="status">
          <div className="quiz-result__score" aria-label={`Score: ${score} out of ${quizData.questions.length}`}>
            {score}/{quizData.questions.length}
          </div>
          <div className="quiz-result__label">
            {score === quizData.questions.length ? '🎉 Perfect Score! You\'re an election expert!' :
             score >= quizData.questions.length / 2 ? '👏 Great job! You know your elections well!' :
             '📚 Keep learning! Review the steps and try again.'}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Your result has been saved to Firebase Firestore.
          </p>
          <button className="quiz-btn" onClick={resetQuiz} type="button" aria-label="Try another topic">🔄 Try Another Topic</button>
        </div>
      )}
    </article>
  );
}
