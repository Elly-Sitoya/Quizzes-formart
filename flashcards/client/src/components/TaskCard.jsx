export default function TaskCard({ set, onAttempt }) {
  const { status, answered, card_count, score, total } = set;

  const statusText =
    status === 'completed'
      ? `Scored ${score} of ${total}`
      : status === 'in_progress'
        ? `${answered} of ${card_count} done`
        : 'Not started';

  const action = status === 'in_progress' ? 'Continue' : status === 'completed' ? 'Try again' : 'Attempt';
  const pct = status === 'in_progress' && card_count ? (answered / card_count) * 100 : 0;

  return (
    <article className={`task is-${status}`}>
      <div className="task-content">
        {set.language && <span className="badge">{set.language}</span>}
        <h3>{set.title}</h3>
        {set.description && <p className="task-desc">{set.description}</p>}
        <p className="task-meta">
          {card_count} card{card_count === 1 ? '' : 's'} · {statusText}
        </p>
        {status === 'in_progress' && (
          <div className="progress small">
            <span style={{ width: `${pct}%` }} />
          </div>
        )}
        <button className="btn primary attempt" onClick={() => onAttempt(set.id)}>
          {action}
        </button>
      </div>
    </article>
  );
}
