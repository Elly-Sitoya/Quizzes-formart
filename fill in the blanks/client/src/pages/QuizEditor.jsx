import { Link, useParams } from 'react-router-dom';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import { parseParagraph } from '../utils/parseParagraph.js';
import './QuizEditor.css';

// Renders a paragraph's live preview: plain text runs stay as text, and
// each [[bracketed]] answer shows as the little blank box the learner will
// eventually see, with the answer underneath so the trainer can check it.
function ParagraphPreview({ raw, paragraphId }) {
  const segments = parseParagraph(raw, paragraphId);
  if (!raw.trim()) {
    return <p className="paragraph-preview-empty">Nothing to preview yet.</p>;
  }
  return (
    <p className="paragraph-preview">
      {segments.map((seg, idx) =>
        seg.type === 'text' ? (
          <span key={idx}>{seg.value}</span>
        ) : (
          <span className="preview-blank" key={seg.blankId} title={`Answer: ${seg.answer}`}>
            {seg.answer || '?'}
          </span>
        )
      )}
    </p>
  );
}

export default function QuizEditor() {
  const { quizId } = useParams();
  const { getQuiz, setTimerSeconds, addParagraph, updateParagraph, deleteParagraph } =
    useQuizzes();
  const quiz = getQuiz(quizId);

  if (!quiz) {
    return (
      <div className="quiz-editor">
        <p className="empty-state">This quiz doesn't exist any more.</p>
        <Link className="back-link" to="/trainer">
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
      <Link className="back-link" to="/trainer">
        ← Back to trainer portal
      </Link>
      <h1 className="quiz-editor-title">{quiz.title}</h1>
      <p className="quiz-editor-subtitle">
        Wrap the correct word or phrase in double square brackets, e.g.{' '}
        <code>The sky is [[blue]].</code> Everything wrapped becomes a blank the learner fills
        in, and all the blanks across every paragraph share one answer bank.
      </p>

      <div className="timer-setting">
        <span className="timer-setting-label">Time allowed</span>
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

      <div className="paragraph-list">
        {quiz.paragraphs.length === 0 && (
          <p className="empty-state">No paragraphs yet. Add the first one below.</p>
        )}
        {quiz.paragraphs.map((paragraph, idx) => (
          <div className="paragraph-block" key={paragraph.id}>
            <div className="paragraph-block-header">
              <span className="paragraph-index">Paragraph {idx + 1}</span>
              <button
                type="button"
                className="delete-paragraph-btn"
                onClick={() => deleteParagraph(quiz.id, paragraph.id)}
              >
                Delete
              </button>
            </div>
            <textarea
              className="paragraph-input"
              rows={4}
              value={paragraph.raw}
              onChange={(e) => updateParagraph(quiz.id, paragraph.id, e.target.value)}
              placeholder="Type the paragraph, wrapping correct answers in [[double brackets]]..."
            />
            <ParagraphPreview raw={paragraph.raw} paragraphId={paragraph.id} />
          </div>
        ))}
      </div>

      <button type="button" className="add-paragraph-btn" onClick={() => addParagraph(quiz.id)}>
        + Add paragraph
      </button>
    </div>
  );
}
