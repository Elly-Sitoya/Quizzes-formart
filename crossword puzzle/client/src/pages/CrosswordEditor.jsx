import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import { generateCrossword } from '../utils/crosswordGenerator.js';
import CrosswordGrid from '../components/CrosswordGrid.jsx';
import './CrosswordEditor.css';

export default function CrosswordEditor() {
  const { quizId } = useParams();
  const { getQuiz, updateWord, deleteWord, addWord } = useQuizzes();
  const quiz = getQuiz(quizId);

  // Recomputed live, every time a clue or answer changes, so the preview on
  // the right always shows exactly what the trainer's current word list
  // would produce for a learner.
  const layout = useMemo(() => generateCrossword(quiz?.questions ?? []), [quiz?.questions]);
  const connectedById = useMemo(() => {
    const map = new Map();
    for (const w of layout.words) map.set(w.id, w.connected);
    return map;
  }, [layout]);

  if (!quiz) {
    return (
      <div className="cwe-editor">
        <p className="empty-state">This crossword doesn't exist any more.</p>
        <Link className="back-link" to="/trainer">
          ← Back to trainer portal
        </Link>
      </div>
    );
  }

  const handleAdd = () => {
    addWord(quiz.id, { clue: '', answer: '' });
  };

  const handleClueChange = (wordId, clue) => updateWord(quiz.id, wordId, { clue });
  const handleAnswerChange = (wordId, answer) =>
    updateWord(quiz.id, wordId, { answer: answer.toUpperCase() });
  const handleDelete = (wordId) => deleteWord(quiz.id, wordId);

  return (
    <div className="cwe-editor">
      <Link className="back-link" to="/trainer">
        ← Back to trainer portal
      </Link>
      <h1 className="cwe-title">{quiz.title}</h1>
      <p className="cwe-subtitle">
        {quiz.questions.length} word{quiz.questions.length === 1 ? '' : 's'} · add a clue and its
        answer, and the grid on the right updates as you type.
      </p>

      <div className="cwe-layout">
        <div className="cwe-word-list">
          {quiz.questions.map((word, idx) => (
            <div className="cwe-word-row" key={word.id}>
              <span className="cwe-word-index">{idx + 1}.</span>
              <div className="cwe-word-fields">
                <input
                  className="cwe-clue-input"
                  type="text"
                  value={word.clue}
                  onChange={(e) => handleClueChange(word.id, e.target.value)}
                  placeholder="Clue text learners will read..."
                />
                <input
                  className="cwe-answer-input"
                  type="text"
                  value={word.answer}
                  onChange={(e) => handleAnswerChange(word.id, e.target.value)}
                  placeholder="ANSWER"
                  maxLength={20}
                />
              </div>
              {word.answer && connectedById.get(word.id) === false && (
                <span className="cwe-warning" title="This word doesn't cross any other word yet">
                  isolated
                </span>
              )}
              <button
                type="button"
                className="cwe-delete-btn"
                onClick={() => handleDelete(word.id)}
                aria-label="Delete word"
                title="Delete word"
              >
                ✕
              </button>
            </div>
          ))}

          <button type="button" className="cwe-add-btn" onClick={handleAdd}>
            + Add word
          </button>
        </div>

        <div className="cwe-preview">
          <p className="cwe-preview-label">Live preview</p>
          <div className="cwe-preview-frame">
            <CrosswordGrid layout={layout} mode="key" />
          </div>
        </div>
      </div>
    </div>
  );
}
