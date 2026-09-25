import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePuzzles } from '../context/PuzzlesContext.jsx';
import './WordSearchManager.css';

// The actual content of the "Word Search" question type inside the quiz
// builder modal: create a new puzzle, then rename, delete, or jump into
// editing the word list of any existing one.
export default function WordSearchManager() {
  const { puzzles, createPuzzle, renamePuzzle, deletePuzzle } = usePuzzles();
  const [newTitle, setNewTitle] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    createPuzzle(title);
    setNewTitle('');
  };

  const startRename = (puzzle) => {
    setRenamingId(puzzle.id);
    setRenameValue(puzzle.title);
  };

  const submitRename = (puzzleId) => {
    const title = renameValue.trim();
    if (title) renamePuzzle(puzzleId, title);
    setRenamingId(null);
  };

  const handleDelete = (puzzle) => {
    if (window.confirm(`Delete "${puzzle.title}"? This cannot be undone.`)) {
      deletePuzzle(puzzle.id);
    }
  };

  return (
    <div className="ws-manager">
      <form className="ws-create-row" onSubmit={handleCreate}>
        <input
          className="ws-create-input"
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New puzzle title..."
        />
        <button className="ws-create-btn" type="submit" disabled={!newTitle.trim()}>
          + Create puzzle
        </button>
      </form>

      <div className="ws-manager-list">
        {puzzles.length === 0 && (
          <p className="ws-empty-state">No puzzles yet. Create your first one above.</p>
        )}
        {puzzles.map((puzzle) => {
          const screenCount = Math.max(
            1,
            Math.ceil(puzzle.words.length / (puzzle.wordsPerScreen || 8))
          );
          return (
            <div className="ws-manager-card" key={puzzle.id}>
              <div className="ws-manager-info">
                {renamingId === puzzle.id ? (
                  <input
                    className="ws-rename-input"
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => submitRename(puzzle.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitRename(puzzle.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                  />
                ) : (
                  <h2
                    className="ws-manager-title"
                    onClick={() => startRename(puzzle)}
                    title="Click to rename"
                  >
                    {puzzle.title}
                  </h2>
                )}
                <p className="ws-manager-meta">
                  {puzzle.words.length} word{puzzle.words.length === 1 ? '' : 's'} · {screenCount}{' '}
                  screen{screenCount === 1 ? '' : 's'} · {Math.round(puzzle.timerSeconds / 60)} min
                </p>
              </div>
              <div className="ws-manager-actions">
                <Link className="ws-edit-btn" to={`puzzles/${puzzle.id}`}>
                  Edit words
                </Link>
                <button className="ws-delete-btn" onClick={() => handleDelete(puzzle)}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
