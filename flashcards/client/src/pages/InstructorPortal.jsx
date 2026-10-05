import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import SetEditor from './SetEditor.jsx';

export default function InstructorPortal() {
  const [sets, setSets] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | set id

  const load = useCallback(() => {
    api
      .listSets()
      .then((data) => {
        setSets(data);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (editing !== null) {
    return (
      <SetEditor
        setId={editing}
        onBack={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <section>
      <div className="page-head row between">
        <div>
          <h1>Flashcard sets</h1>
          <p className="muted">Create tasks for your students and see which cards trip them up.</p>
        </div>
        <button className="btn primary" onClick={() => setEditing('new')}>
          + New set
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {!sets && !error && <p className="muted">Loading…</p>}
      {sets && sets.length === 0 && <p className="empty">No sets yet — create your first one.</p>}

      <div className="set-list">
        {sets?.map((s) => (
          <article key={s.id} className="set-row">
            <div>
              <h3>
                {s.title}{' '}
                <span className={`pill ${s.is_published ? 'pill-on' : ''}`}>
                  {s.is_published ? 'Published' : 'Draft'}
                </span>
              </h3>
              <p className="muted">
                {s.language || 'No language'} · {s.card_count} card{s.card_count === 1 ? '' : 's'} ·{' '}
                {s.attempt_count} attempt{s.attempt_count === 1 ? '' : 's'}
              </p>
            </div>
            <button className="btn" onClick={() => setEditing(s.id)}>
              Open
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
