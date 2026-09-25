import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePuzzles } from '../context/PuzzlesContext.jsx';
import './PuzzleEditor.css';

export default function PuzzleEditor() {
  const { puzzleId } = useParams();
  const { getPuzzle, addWord, removeWord, updatePuzzle } = usePuzzles();
  const puzzle = getPuzzle(puzzleId);
  const [newWord, setNewWord] = useState('');

  if (!puzzle) {
    return (
      <div className="ws-editor">
        <p>This puzzle no longer exists.</p>
        <Link to="..">← Back to word search puzzles</Link>
      </div>
    );
  }

  const handleAddWord = (e) => {
    e.preventDefault();
    const word = newWord.trim();
    if (!word) return;
    addWord(puzzle.id, word);
    setNewWord('');
  };

  const minutes = Math.round(puzzle.timerSeconds / 60);

  return (
    <div className="ws-editor">
      <Link className="ws-editor-back" to="..">
        ← Back to word search puzzles
      </Link>
      <h1 className="ws-editor-title">{puzzle.title}</h1>

      <div className="ws-editor-settings">
        <div className="ws-editor-field">
          <label className="ws-editor-label" htmlFor="ws-timer-input">
            Time limit (minutes)
          </label>
          <input
            id="ws-timer-input"
            className="ws-editor-number-input"
            type="number"
            min="1"
            max="30"
            value={minutes}
            onChange={(e) =>
              updatePuzzle(puzzle.id, {
                timerSeconds: Math.max(1, Number(e.target.value) || 1) * 60,
              })
            }
          />
        </div>

        <div className="ws-editor-field">
          <label className="ws-editor-label" htmlFor="ws-per-screen-input">
            Words per screen
          </label>
          <input
            id="ws-per-screen-input"
            className="ws-editor-number-input"
            type="number"
            min="1"
            max="20"
            value={puzzle.wordsPerScreen || 8}
            onChange={(e) =>
              updatePuzzle(puzzle.id, {
                wordsPerScreen: Math.max(1, Number(e.target.value) || 1),
              })
            }
          />
        </div>
      </div>

      <div className="ws-editor-section">
        <span className="ws-editor-label">Words ({puzzle.words.length})</span>
        <form className="ws-add-word-row" onSubmit={handleAddWord}>
          <input
            className="ws-add-word-input"
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Add a word..."
          />
          <button className="ws-add-word-btn" type="submit" disabled={!newWord.trim()}>
            + Add
          </button>
        </form>

        <div className="ws-word-chips">
          {puzzle.words.length === 0 && (
            <p className="ws-empty-state">No words yet. Add some above.</p>
          )}
          {puzzle.words.map((word) => (
            <span className="ws-editor-chip" key={word}>
              {word}
              <button
                className="ws-editor-chip-remove"
                onClick={() => removeWord(puzzle.id, word)}
                aria-label={`Remove ${word}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
