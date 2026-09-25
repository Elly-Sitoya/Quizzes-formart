import React from 'react';

export default function ProgressIndicator({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="progress-indicator">
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">
        Chunk {current} von {total}
      </span>
    </div>
  );
}
