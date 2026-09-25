import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import './CrosswordManager.css';

// The content of the "Crossword Puzzle" question type inside the quiz
// builder modal: create a new crossword, then rename, delete, or jump into
// editing the clue/answer pairs of any existing one.
export default function CrosswordManager() {
  const { quizzes, createQuiz, renameQuiz, deleteQuiz } = useQuizzes();
  const [newTitle, setNewTitle] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    createQuiz(title);
    setNewTitle('');
  };

  const startRename = (quiz) => {
    setRenamingId(quiz.id);
    setRenameValue(quiz.title);
  };

  const submitRename = (quizId) => {
    const title = renameValue.trim();
    if (title) renameQuiz(quizId, title);
    setRenamingId(null);
  };

  const handleDelete = (quiz) => {
    if (window.confirm(`Delete "${quiz.title}"? This cannot be undone.`)) {
      deleteQuiz(quiz.id);
    }
  };

  return (
    <div className="crossword-manager">
      <form className="create-quiz-row" onSubmit={handleCreate}>
        <input
          className="create-quiz-input"
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New crossword title..."
        />
        <button className="create-quiz-btn" type="submit" disabled={!newTitle.trim()}>
          + Create crossword
        </button>
      </form>

      <div className="trainer-quiz-list">
        {quizzes.length === 0 && (
          <p className="empty-state">No crosswords yet. Create your first one above.</p>
        )}
        {quizzes.map((quiz) => (
          <div className="trainer-quiz-card" key={quiz.id}>
            <div className="trainer-quiz-info">
              {renamingId === quiz.id ? (
                <input
                  className="rename-input"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => submitRename(quiz.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitRename(quiz.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                />
              ) : (
                <h2
                  className="trainer-quiz-title"
                  onClick={() => startRename(quiz)}
                  title="Click to rename"
                >
                  {quiz.title}
                </h2>
              )}
              <p className="trainer-quiz-meta">
                {quiz.questions.length} word{quiz.questions.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="trainer-quiz-actions">
              <Link className="edit-quiz-btn" to={`/trainer/quizzes/${quiz.id}`}>
                Edit words
              </Link>
              <button className="delete-quiz-btn" onClick={() => handleDelete(quiz)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
