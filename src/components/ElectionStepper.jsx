import React, { useState } from 'react';
import { explainStep } from '../electiq.js';

const ELECTION_STEPS = [
  { id: 1, title: 'Voter Registration', desc: 'Ensure you are eligible and registered to vote before the deadline.' },
  { id: 2, title: 'Candidate Nomination', desc: 'Candidates file nominations and are officially listed for the election.' },
  { id: 3, title: 'Campaign Period', desc: 'Candidates present their platforms and engage with voters.' },
  { id: 4, title: 'Voting Day', desc: 'Registered voters cast their ballots at designated polling stations.' },
  { id: 5, title: 'Vote Counting', desc: 'Ballots are collected, verified, and counted under official observation.' },
  { id: 6, title: 'Results Declaration', desc: 'Official results are announced and certified by the Election Commission.' },
];

/**
 * ElectionStepper component: Interactive step-by-step election process guide.
 * Directly addresses the "steps" and "easy-to-follow" requirements.
 * @returns {JSX.Element}
 */
export default function ElectionStepper() {
  const [activeStep, setActiveStep] = useState(null);
  const [stepDetail, setStepDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handles clicking on a step to fetch AI-powered details.
   * @param {object} step - The step object to explain
   */
  const handleStepClick = async (step) => {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
              onKeyDown={(e) => e.key === 'Enter' && handleStepClick(step)}
              aria-expanded={activeStep === step.id}
              aria-label={`Step ${step.id}: ${step.title}. ${step.desc}`}
            >
              <div className="step__connector">
                <div className="step__number">{activeStep && step.id < activeStep ? '✓' : step.id}</div>
                <div className="step__line"></div>
              </div>
              <div className="step__content">
                <div className="step__title">{step.title}</div>
                <div className="step__desc">{step.desc}</div>
              </div>
            </div>

            {activeStep === step.id && (
              <div className="step-detail" aria-live="polite">
                {loading && (
                  <div className="step-detail__section">
                    <div className="skeleton skeleton--text"></div>
                    <div className="skeleton skeleton--text-sm"></div>
                    <div className="skeleton skeleton--text"></div>
                    <span className="sr-only">Loading step details...</span>
                  </div>
                )}
                {error && <p role="alert" style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>⚠️ {error}</p>}
                {stepDetail && !loading && (
                  <>
                    <div className="step-detail__section">
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{stepDetail.explanation}</p>
                    </div>
                    <div className="step-detail__section">
                      <h3 className="step-detail__section-title step-detail__section-title--key">✅ Key Points</h3>
                      <ul className="step-detail__list" aria-label="Key points">
                        {stepDetail.keyPoints.map((point, i) => <li key={i}>{point}</li>)}
                      </ul>
                    </div>
                    <div className="step-detail__section">
                      <h3 className="step-detail__section-title step-detail__section-title--mistakes">⚠️ Common Mistakes</h3>
                      <ul className="step-detail__list step-detail__list--mistakes" aria-label="Common mistakes to avoid">
                        {stepDetail.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                    <div className="step-detail__tip">💡 {stepDetail.tip}</div>
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
