import { Link, useParams } from 'react-router-dom';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import './QuizEditor.css';

export default function QuizEditor() {
  const { quizId } = useParams();
  const {
    getQuiz,
    setTimerEnabled,
    setTimerSeconds,
    addPair,
    updatePair,
    deletePair,
  } = useQuizzes();
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

  const minutes = Math.floor(quiz.timerSeconds / 60);
  const seconds = quiz.timerSeconds % 60;

  const handleMinutesChange = (value) => {
    const mins = Math.max(0, Number(value) || 0);
    setTimerSeconds(quiz.id, mins * 60 + seconds);
  };

  const handleSecondsChange = (value) => {
    const secs = Math.min(59, Math.max(0, Number(value) || 0));
    setTimerSeconds(quiz.id, minutes * 60 + secs);
  };

  return (
    <div className="quiz-editor">
      <Link className="back-link" to="../..">
        ← Back to trainer portal
      </Link>
      <h1 className="quiz-editor-title">{quiz.title}</h1>
      <p className="quiz-editor-subtitle">
        Each row is one pair: a prompt on the left, its correct match on the right. Learners will
        see the left side in this order, with the right side shuffled.
      </p>

      <div className="timer-setting">
        <label className="timer-toggle">
          <input
            type="checkbox"
            checked={quiz.timerEnabled}
            onChange={(e) => setTimerEnabled(quiz.id, e.target.checked)}
          />
          <span>Timed attempt</span>
        </label>
        {quiz.timerEnabled && (
          <div className="timer-inputs">
            <input
              type="number"
              min="0"
              className="timer-input"
              value={minutes}
              onChange={(e) => handleMinutesChange(e.target.value)}
            />
            <span className="timer-unit">min</span>
            <input
              type="number"
              min="0"
              max="59"
              className="timer-input"
              value={seconds}
              onChange={(e) => handleSecondsChange(e.target.value)}
            />
            <span className="timer-unit">sec</span>
          </div>
        )}
      </div>

      <div className="pair-list">
        {quiz.pairs.length === 0 && (
          <p className="empty-state">No pairs yet. Add the first one below.</p>
        )}
        {quiz.pairs.map((pair, idx) => (
          <div className="pair-row" key={pair.id}>
            <span className="pair-index">{idx + 1}</span>
            <input
              className="pair-input"
              type="text"
              value={pair.left}
              onChange={(e) => updatePair(quiz.id, pair.id, 'left', e.target.value)}
              placeholder="Left side (prompt)..."
            />
            <span className="pair-arrow">↔</span>
            <input
              className="pair-input"
              type="text"
              value={pair.right}
              onChange={(e) => updatePair(quiz.id, pair.id, 'right', e.target.value)}
              placeholder="Right side (match)..."
            />
            <button
              type="button"
              className="delete-pair-btn"
              onClick={() => deletePair(quiz.id, pair.id)}
              aria-label="Delete pair"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="add-pair-btn" onClick={() => addPair(quiz.id)}>
        + Add pair
      </button>
    </div>
  );
}
