import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePuzzles } from '../context/PuzzlesContext.jsx';
import QuizModal from '../components/QuizModal.jsx';
import './LearnerHome.css';

export default function LearnerHome() {
  const { puzzles } = usePuzzles();
  const [activePuzzleId, setActivePuzzleId] = useState(null);
  const activePuzzle = puzzles.find((p) => p.id === activePuzzleId) ?? null;

  return (
    <div className="ws-learner-home">
      <div className="ws-learner-intro">
        <h1 className="ws-learner-title">Word Search Puzzles</h1>
        <p className="ws-learner-subtitle">
          Pick a puzzle below, trace the hidden words, and beat the clock.
        </p>
      </div>

      <div className="ws-puzzle-grid">
        {puzzles.length === 0 && (
          <p className="ws-empty-state">No puzzles are available yet. Check back soon.</p>
        )}
        {puzzles.map((puzzle) => (
          <div className="ws-puzzle-card" key={puzzle.id}>
            <h2 className="ws-puzzle-card-title">{puzzle.title}</h2>
            <p className="ws-puzzle-card-meta">
              {puzzle.words.length} word{puzzle.words.length === 1 ? '' : 's'}
            </p>
            <button
              className="ws-attempt-btn"
              onClick={() => setActivePuzzleId(puzzle.id)}
              disabled={puzzle.words.length === 0}
            >
              Attempt
            </button>
          </div>
        ))}
      </div>

      {activePuzzle && (
        <QuizModal puzzle={activePuzzle} onClose={() => setActivePuzzleId(null)} />
      )}

      <Link className="ws-trainer-link" to="trainer">
        Trainer Portal
      </Link>
    </div>
  );
}
