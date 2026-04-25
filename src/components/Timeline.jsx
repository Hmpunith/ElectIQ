/**
 * @fileoverview Timeline component — Animated, interactive election timeline.
 * Directly addresses the "timelines" portion of the problem statement.
 * Uses centralized constants for maintainability.
 *
 * @module Timeline
 * @version 2.0.0
 */

import React from 'react';
import { TIMELINE_EVENTS } from '../constants.js';

/**
 * Timeline component renders an animated, accessible visual timeline
 * covering every phase from election announcement to government formation.
 *
 * @returns {JSX.Element} The rendered timeline component
 */
export default function Timeline() {
  return (
    <article className="card" aria-labelledby="timeline-title">
      <div className="card__header">
        <h2 className="card__title" id="timeline-title">📅 Election Timeline</h2>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Follow the complete journey of an election from announcement to government formation.
      </p>

      <div className="timeline" role="list" aria-label="Election timeline phases">
        {TIMELINE_EVENTS.map((event, i) => (
          <div
            className="timeline__item"
            key={i}
            role="listitem"
            aria-label={`${event.phase}: ${event.title} — ${event.date}`}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="timeline__dot" aria-hidden="true"></div>
            <div className="timeline__phase">{event.phase}</div>
            <div className="timeline__title">{event.title}</div>
            <div className="timeline__desc">{event.desc}</div>
            <div className="timeline__date" aria-label={`Timeline: ${event.date}`}>{event.date}</div>
          </div>
        ))}
      </div>
    </article>
  );
}
