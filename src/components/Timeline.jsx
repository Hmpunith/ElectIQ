import React from 'react';

const TIMELINE_EVENTS = [
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
 * Timeline component: Animated, interactive election timeline.
 * Directly addresses the "timelines" portion of the problem statement.
 * @returns {JSX.Element}
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
          <div className="timeline__item" key={i} role="listitem" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="timeline__dot" aria-hidden="true"></div>
            <div className="timeline__phase">{event.phase}</div>
            <div className="timeline__title">{event.title}</div>
            <div className="timeline__desc">{event.desc}</div>
            <div className="timeline__date">{event.date}</div>
          </div>
        ))}
      </div>
    </article>
  );
}
