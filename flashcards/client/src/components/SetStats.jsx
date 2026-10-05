import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { typeMeta } from '../utils/cardTypes.js';

export default function SetStats({ setId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .setStats(setId)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [setId]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading results…</p>;

  const { summary, cards } = data;

  return (
    <div>
      <div className="stat-row">
        <div className="stat">
          <strong>{summary.started}</strong>
          <span>attempts started</span>
        </div>
        <div className="stat">
          <strong>{summary.completed}</strong>
          <span>completed</span>
        </div>
        <div className="stat">
          <strong>{summary.avg_pct === null ? '—' : `${summary.avg_pct}%`}</strong>
          <span>average first-time score</span>
        </div>
      </div>

      <h3>Cards students miss most</h3>
      <p className="muted">Based on each student’s first pass through the set.</p>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Card</th>
            <th>Type</th>
            <th>Seen</th>
            <th>Missed</th>
            <th>Miss rate</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((c) => {
            const rate = c.seen ? Math.round((c.missed / c.seen) * 100) : 0;
            return (
              <tr key={c.id}>
                <td>{c.front_text || '(picture card)'}</td>
                <td>{typeMeta(c.card_type).label}</td>
                <td>{c.seen}</td>
                <td>{c.missed}</td>
                <td>
                  <div className="bar">
                    <span style={{ width: `${rate}%` }} />
                  </div>
                  <small>{c.seen ? `${rate}%` : '—'}</small>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
