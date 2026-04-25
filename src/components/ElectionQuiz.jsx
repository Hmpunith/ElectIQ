import React, { useState } from 'react';
import { generateQuiz } from '../electiq.js';

const QUIZ_TOPICS = [
  '🗳️ Voter Registration',
  '📋 Candidate Nominations',
  '🎤 Campaigning Rules',
  '🏛️ Voting Day Process',
  '📊 Vote Counting',
  '⚖️ Voter Rights',
];

/**
 * ElectionQuiz component: Interactive AI-generated election knowledge quiz.
 * Addresses the "interactive" portion of the problem statement.
 * @returns {JSX.Element}
 */
export default function ElectionQuiz() {
  const [quizData, setQuizData] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Starts a new quiz by requesting questions from the AI.
   * @param {string} topic - The quiz topic
   */
  const startQuiz = async (topic) => {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles answer selection and scoring.
   * @param {number} index - The selected answer index
   */
  const handleAnswer = (index) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === quizData.questions[currentQ].correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  /** Moves to the next question or shows results */
  const nextQuestion = () => {
    if (currentQ + 1 >= quizData.questions.length) {
      setShowResult(true);
    } else {
      setCurrentQ((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  };

  /** Resets the quiz to the topic selection screen */
  const resetQuiz = () => {
    setQuizData(null);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
  };

  const letters = ['A', 'B', 'C', 'D'];

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
              <button key={i} className="quiz-topic-btn" onClick={() => startQuiz(topic)} aria-label={`Start quiz on ${topic}`} type="button">
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }} role="status">
          <div className="skeleton skeleton--text" style={{ margin: '0 auto' }}></div>
          <div className="skeleton skeleton--text-sm" style={{ margin: '0.5rem auto 0' }}></div>
          <span className="sr-only">Generating quiz questions...</span>
        </div>
      )}

      {error && <p role="alert" style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>⚠️ {error}</p>}

      {/* Active Question */}
      {quizData && !showResult && !loading && (
        <div className="quiz-question" aria-live="polite">
          <div className="quiz-question__progress">
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
                <li key={i} className={className} onClick={() => handleAnswer(i)}
                  role="radio" aria-checked={selectedAnswer === i} tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnswer(i)}
                >
                  <span className="quiz-option__letter">{letters[i]}</span>
                  <span>{opt}</span>
                </li>
              );
            })}
          </ul>

          {selectedAnswer !== null && (
            <>
              <div className="quiz-explanation">
                💡 {quizData.questions[currentQ].explanation}
              </div>
              <button className="quiz-btn" onClick={nextQuestion} type="button">
                {currentQ + 1 >= quizData.questions.length ? '📊 See Results' : 'Next Question →'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Results */}
      {showResult && (
        <div className="quiz-result" aria-live="polite">
          <div className="quiz-result__score">{score}/{quizData.questions.length}</div>
          <div className="quiz-result__label">
            {score === quizData.questions.length ? '🎉 Perfect Score! You\'re an election expert!' :
             score >= quizData.questions.length / 2 ? '👏 Great job! You know your elections well!' :
             '📚 Keep learning! Review the steps and try again.'}
          </div>
          <button className="quiz-btn" onClick={resetQuiz} type="button">🔄 Try Another Topic</button>
        </div>
      )}
    </article>
  );
}
