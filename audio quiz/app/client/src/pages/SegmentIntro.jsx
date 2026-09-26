import React from 'react';

export default function SegmentIntro({
  segment,
  onStart,
  loading,
  error,
  availableSegments,
  selectedSlug,
  onSelectSlug,
}) {
  return (
    <div className="segment-intro">
      <h1>{segment?.title ?? 'Audio Quiz'}</h1>
      {segment?.description && <p className="segment-description">{segment.description}</p>}

      {availableSegments && availableSegments.length > 1 && (
        <div className="segment-picker">
          <label htmlFor="segment-select">Segment auswählen</label>
          <select
            id="segment-select"
            value={selectedSlug}
            onChange={(e) => onSelectSlug(e.target.value)}
            disabled={loading}
          >
            {availableSegments.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

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
