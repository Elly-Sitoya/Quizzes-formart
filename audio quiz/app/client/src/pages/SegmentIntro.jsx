import React from 'react';

export default function SegmentIntro({ segment, onStart, loading, error }) {
  return (
    <div className="segment-intro">
      <h1>{segment?.title ?? 'Audio Quiz'}</h1>
      {segment?.description && <p className="segment-description">{segment.description}</p>}

      <ul className="rules-list">
        <li>Jeder Abschnitt (Chunk) wird vorgespielt und pausiert danach automatisch.</li>
        <li>Du kannst den aktuellen Abschnitt beliebig oft noch einmal hören.</li>
        <li>Es gibt kein Feedback während des Quiz — das Ergebnis siehst du erst am Ende.</li>
      </ul>

      {error && <p className="error-text">{error}</p>}

      <button type="button" className="btn btn-primary" onClick={onStart} disabled={loading}>
        {loading ? 'Wird geladen…' : 'Quiz starten'}
      </button>
    </div>
  );
}
