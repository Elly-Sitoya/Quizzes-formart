import { Link, useParams } from 'react-router-dom';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import './QuizEditor.css';

export default function QuizEditor() {
  const { quizId } = useParams();
  const { getQuiz, addWord, updateWord, deleteWord } = useQuizzes();
  const quiz = getQuiz(quizId);

  if (!quiz) {
    return (
      <div className="quiz-editor">
        <p className="empty-state">This quiz doesn't exist any more.</p>
        <Link className="back-link" to="../..">
          ← Back to trainer portal
        </Link>
      </div>
    );
  }

  return (
    <div className="quiz-editor">
      <Link className="back-link" to="../..">
        ← Back to trainer portal
      </Link>
      <h1 className="quiz-editor-title">{quiz.title}</h1>
      <p className="quiz-editor-subtitle">
        Each row is one word: a clue on the left, the answer it unlocks on the right. Learners
        will see the clue, then drag the answer's letters - scrambled - into the right order.
        Keep each answer to a single word with no spaces.
      </p>

      <div className="word-list">
        {quiz.words.length === 0 && (
          <p className="empty-state">No words yet. Add the first one below.</p>
        )}
        {quiz.words.map((word, idx) => (
          <div className="word-row" key={word.id}>
            <span className="word-index">{idx + 1}</span>
            <input
              className="word-input clue-input"
              type="text"
              value={word.clue}
              onChange={(e) => updateWord(quiz.id, word.id, 'clue', e.target.value)}
              placeholder="Clue (definition or hint)..."
            />
            <span className="word-arrow">→</span>
            <input
              className="word-input answer-input"
              type="text"
              value={word.answer}
              onChange={(e) =>
                updateWord(quiz.id, word.id, 'answer', e.target.value.replace(/\s/g, ''))
              }
              placeholder="Answer (one word)..."
            />
            <button
              type="button"
              className="delete-word-btn"
              onClick={() => deleteWord(quiz.id, word.id)}
              aria-label="Delete word"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="add-word-btn" onClick={() => addWord(quiz.id)}>
        + Add word
      </button>
    </div>
  );
}
