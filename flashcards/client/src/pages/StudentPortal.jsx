import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { getLearnerKey } from '../utils/learner.js';
import TaskCard from '../components/TaskCard.jsx';
import AttemptModal from '../components/AttemptModal.jsx';

export default function StudentPortal() {
  const [sets, setSets] = useState(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  const load = useCallback(() => {
    api
      .studentSets(getLearnerKey())
      .then((data) => {
        setSets(data);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <div className="page-head">
        <h1>Your practice</h1>
        <p className="muted">Pick a task and flip through the cards at your own pace.</p>
      </div>

      {error && <p className="error">{error}</p>}
      {!sets && !error && <p className="muted">Loading tasks…</p>}
      {sets && sets.length === 0 && (
        <p className="empty">No flashcard tasks yet. Check back soon!</p>
      )}

      <div className="task-grid">
        {sets?.map((s) => (
          <TaskCard key={s.id} set={s} onAttempt={setOpenId} />
        ))}
      </div>

      {openId !== null && (
        <AttemptModal
          key={openId}
          setId={openId}
          onClose={() => {
            setOpenId(null);
            load();
          }}
        />
      )}
    </section>
  );
}
