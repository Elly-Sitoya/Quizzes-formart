import React from 'react';

export default function ResultsScreen({ results, onRestart }) {
  const { session, breakdown } = results;

  return (
    <div className="results-screen">
      <h2>Ergebnis</h2>
      <p className="score-line">
        {session.score} / {session.total_questions} richtig
      </p>

      <ol className="breakdown-list">
        {breakdown.map((row, idx) => (
          <li key={idx} className={row.is_correct ? 'correct' : 'incorrect'}>
            <div className="breakdown-transcript">Chunk {row.chunk_order}: “{row.transcript}”</div>
            <div className="breakdown-prompt">{row.prompt}</div>
            <div className="breakdown-answer">
              Deine Antwort: <strong>{row.submitted_answer}</strong>
              {!row.is_correct && (
                <>
                  {' '}
                  — Richtige Antwort: <strong>{row.correct_answer}</strong>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>

      <button type="button" className="btn btn-primary" onClick={onRestart}>
        Noch einmal versuchen
      </button>
    </div>
  );
}
