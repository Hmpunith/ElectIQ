/**
 * @fileoverview ElectionStepper component — Interactive step-by-step election process guide.
 * Directly addresses the "steps" and "easy-to-follow" requirements from the problem statement.
 * Integrates Firebase Analytics for step exploration tracking.
 *
 * @module ElectionStepper
 * @version 2.0.0
 */

import React, { useState, useCallback } from 'react';
import { explainStep } from '../electiq.js';
import { ELECTION_STEPS } from '../constants.js';
import { trackStepExplored } from '../firebase.js';

/**
 * ElectionStepper component provides a clickable, keyboard-accessible
 * step-by-step wizard that breaks down each phase of the election.
 *
 * @returns {JSX.Element} The rendered stepper component
 */
export default function ElectionStepper() {
  /** @type {[number|null, Function]} Currently active step ID */
  const [activeStep, setActiveStep] = useState(null);
  /** @type {[object|null, Function]} AI-generated step detail data */
  const [stepDetail, setStepDetail] = useState(null);
  /** @type {[boolean, Function]} Loading state for AI requests */
  const [loading, setLoading] = useState(false);
  /** @type {[string|null, Function]} Error message from failed requests */
  const [error, setError] = useState(null);

  /**
   * Handles clicking on a step to fetch AI-powered details.
   * Toggles the step if already active, otherwise fetches new data.
   *
   * @param {object} step - The step object to explain
   * @param {number} step.id - The unique step identifier
   * @param {string} step.title - The step title to send to AI
   * @returns {Promise<void>}
   */
  const handleStepClick = useCallback(async (step) => {
    if (activeStep === step.id && stepDetail) {
      setActiveStep(null);
      setStepDetail(null);
      return;
    }

    setActiveStep(step.id);
    setLoading(true);
    setError(null);

    try {
      const data = await explainStep(step.title);
      setStepDetail(data);
      trackStepExplored(step.title);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeStep, stepDetail]);

  return (
    <article className="card" aria-labelledby="stepper-title">
      <div className="card__header">
        <h2 className="card__title" id="stepper-title">📋 Election Process Steps</h2>
        <span className="card__badge card__badge--ai">CLICK TO EXPLORE</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Click on any step below to get an AI-powered detailed explanation of that phase of the election.
      </p>

      <div className="stepper" role="list" aria-label="Election process steps">
        {ELECTION_STEPS.map((step) => (
          <div key={step.id}>
            <div
              className={`step ${activeStep === step.id ? 'step--active' : ''} ${activeStep && step.id < activeStep ? 'step--completed' : ''}`}
              role="listitem"
              tabIndex={0}
              onClick={() => handleStepClick(step)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleStepClick(step)}
              aria-expanded={activeStep === step.id}
              aria-label={`Step ${step.id}: ${step.title}. ${step.desc}. Press Enter to ${activeStep === step.id ? 'collapse' : 'expand'} details.`}
            >
              <div className="step__connector">
                <div className="step__number" aria-hidden="true">{activeStep && step.id < activeStep ? '✓' : step.id}</div>
                <div className="step__line" aria-hidden="true"></div>
              </div>
              <div className="step__content">
                <div className="step__title">{step.icon} {step.title}</div>
                <div className="step__desc">{step.desc}</div>
              </div>
            </div>

            {activeStep === step.id && (
              <div className="step-detail" aria-live="polite" role="region" aria-label={`Details for ${step.title}`}>
                {loading && (
                  <div className="step-detail__section" role="status">
                    <div className="skeleton skeleton--text"></div>
                    <div className="skeleton skeleton--text-sm"></div>
                    <div className="skeleton skeleton--text"></div>
                    <span className="sr-only">Loading step details...</span>
                  </div>
                )}
                {error && <p role="alert" style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', padding: '0.5rem' }}>⚠️ {error}</p>}
                {stepDetail && !loading && (
                  <>
                    <div className="step-detail__section">
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{stepDetail.explanation}</p>
                    </div>
                    <div className="step-detail__section">
                      <h3 className="step-detail__section-title step-detail__section-title--key">✅ Key Points</h3>
                      <ul className="step-detail__list" aria-label="Key points for this step">
                        {stepDetail.keyPoints.map((point, i) => <li key={i}>{point}</li>)}
                      </ul>
                    </div>
                    <div className="step-detail__section">
                      <h3 className="step-detail__section-title step-detail__section-title--mistakes">⚠️ Common Mistakes</h3>
                      <ul className="step-detail__list step-detail__list--mistakes" aria-label="Common mistakes to avoid">
                        {stepDetail.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                    <div className="step-detail__tip" role="note" aria-label="Helpful tip">💡 {stepDetail.tip}</div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
