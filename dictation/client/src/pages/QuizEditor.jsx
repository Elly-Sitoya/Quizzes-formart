import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import MultimediaModal from '../components/MultimediaModal.jsx';
import './QuizEditor.css';

export default function QuizEditor() {
  const { quizId } = useParams();
  const {
    getQuiz,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    addBlankQuestion,
    reorderQuestions,
    dictationSettings,
    updateDictationSettings,
  } = useQuizzes();
  const quiz = getQuiz(quizId);

  const [expandedId, setExpandedId] = useState(null);
  const [modalQuestionId, setModalQuestionId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const audioRef = useRef(null);
  const dragHandleActiveRef = useRef(false);

  // Stop any speech or audio playback if the editor unmounts mid-play.
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
    };
  }, []);

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

  const stopPlayback = () => {
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    setPlayingId(null);
  };

  const toggleExpanded = (questionId) => {
    setExpandedId((prev) => (prev === questionId ? null : questionId));
  };

  const handleDuplicate = (questionId) => {
    duplicateQuestion(quiz.id, questionId);
  };

  const handleDelete = (questionId) => {
    if (playingId === questionId) stopPlayback();
    deleteQuestion(quiz.id, questionId);
    if (expandedId === questionId) setExpandedId(null);
  };

  const handleAddText = (position) => {
    const newId = addBlankQuestion(quiz.id, position);
    setExpandedId(newId);
  };

  const handleDragStart = (e, questionId) => {
    if (!dragHandleActiveRef.current) {
      e.preventDefault();
      return;
    }
    setDraggedId(questionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', questionId);
  };

  const handleDragOver = (e, questionId) => {
    if (!draggedId || draggedId === questionId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(questionId);
  };

  const handleDrop = (e, questionId) => {
    e.preventDefault();
    if (draggedId && draggedId !== questionId) {
      const fromIndex = quiz.questions.findIndex((q) => q.id === draggedId);
      const toIndex = quiz.questions.findIndex((q) => q.id === questionId);
      if (fromIndex !== -1 && toIndex !== -1) {
        reorderQuestions(quiz.id, fromIndex, toIndex);
      }
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    dragHandleActiveRef.current = false;
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleTextChange = (questionId, text) => {
    updateQuestion(quiz.id, questionId, { text });
  };

  const handlePlayToggle = (question) => {
    if (playingId === question.id) {
      stopPlayback();
      return;
    }
    stopPlayback();
    if (question.audioMode === 'tts') {
      const utterance = new SpeechSynthesisUtterance(question.text);
      utterance.rate = dictationSettings.playbackRate;
      utterance.onend = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
      setPlayingId(question.id);
    } else if (question.audioData) {
      const audio = new Audio(question.audioData);
      audioRef.current = audio;
      audio.onended = () => setPlayingId(null);
      audio.play();
      setPlayingId(question.id);
    }
  };

  const handleAttach = (questionId, audioMode, audioData) => {
    updateQuestion(quiz.id, questionId, { audioMode, audioData });
  };

  const handleGenerateForAll = ({ rate }) => {
    updateDictationSettings({ playbackRate: rate });
  };

  const modalQuestion = quiz.questions.find((q) => q.id === modalQuestionId) ?? null;

  return (
    <div className="quiz-editor">
      <Link className="back-link" to="/trainer">
        ← Back to trainer portal
      </Link>
      <h1 className="quiz-editor-title">{quiz.title}</h1>
      <p className="quiz-editor-subtitle">
        {quiz.questions.length} sentence{quiz.questions.length === 1 ? '' : 's'}
      </p>

      <button type="button" className="add-text-link" onClick={() => handleAddText('start')}>
        + add text
      </button>

      <div className="question-list">
        {quiz.questions.length === 0 && (
          <p className="empty-state">No sentences yet. Add the first one above.</p>
        )}
        {quiz.questions.map((question, idx) => {
          const isOpen = expandedId === question.id;
          const isFresh = !question.text.trim();

          return (
            <div
              className={`question-row ${isOpen ? 'open' : ''} ${draggedId === question.id ? 'dragging' : ''} ${dragOverId === question.id && draggedId !== question.id ? 'drag-over' : ''}`}
              key={question.id}
              draggable
              onDragStart={(e) => handleDragStart(e, question.id)}
              onDragOver={(e) => handleDragOver(e, question.id)}
              onDrop={(e) => handleDrop(e, question.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="question-row-header" onClick={() => toggleExpanded(question.id)}>
                <span
                  className="drag-handle"
                  title="Drag to reorder"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={() => {
                    dragHandleActiveRef.current = true;
                  }}
                  onMouseUp={() => {
                    dragHandleActiveRef.current = false;
                  }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="8" cy="5" r="1.8" />
                    <circle cx="16" cy="5" r="1.8" />
                    <circle cx="8" cy="12" r="1.8" />
                    <circle cx="16" cy="12" r="1.8" />
                    <circle cx="8" cy="19" r="1.8" />
                    <circle cx="16" cy="19" r="1.8" />
                  </svg>
                </span>
                <span className="question-index">{idx + 1}.</span>
                <span className="question-text">{question.text || 'Untitled sentence'}</span>
                <span className="question-row-icons">
                  <button
                    type="button"
                    className="icon-btn"
                    title="Duplicate"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(question.id);
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M8 8V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3" />
                      <rect x="3" y="8" width="13" height="13" rx="2" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(question.id);
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <rect x="9" y="1" width="6" height="3" rx="1.5" />
                      <rect x="3" y="4" width="18" height="3" rx="1.5" />
                      <path d="M4.5 8h15l-1.2 12.5A2 2 0 0 1 16.3 22H7.7a2 2 0 0 1-2-1.9L4.5 8z" />
                      <rect x="8" y="10.5" width="1.6" height="8" rx="0.8" fill="#ffffff" />
                      <rect x="11.2" y="10.5" width="1.6" height="8" rx="0.8" fill="#ffffff" />
                      <rect x="14.4" y="10.5" width="1.6" height="8" rx="0.8" fill="#ffffff" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="icon-btn toggle-btn"
                    title={isOpen ? 'Collapse' : 'Expand'}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(question.id);
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <rect x="1" y="1" width="22" height="22" rx="7" fill="currentColor" />
                      {isOpen ? (
                        <path d="M7 12h10" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
                      ) : (
                        <path d="M12 7v10M7 12h10" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
                      )}
                    </svg>
                  </button>
                </span>
              </div>

              {isOpen && (
                <div className="question-row-expanded">
                  {isFresh ? (
                    <>
                      <button
                        type="button"
                        className="glyph-btn"
                        title="Attach audio"
                        onClick={() => setModalQuestionId(question.id)}
                      >
                        ♬ˎˊ˗
                      </button>
                      <input
                        type="text"
                        className="sentence-input fresh"
                        autoFocus
                        value={question.text}
                        onChange={(e) => handleTextChange(question.id, e.target.value)}
                        placeholder="Type the sentence learners should hear and type..."
                      />
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="qe-play-btn"
                        title="Play"
                        onClick={() => handlePlayToggle(question)}
                      >
                        {playingId === question.id ? '⏸' : '▶'}
                      </button>
                      <input
                        type="text"
                        className="sentence-input"
                        value={question.text}
                        onChange={(e) => handleTextChange(question.id, e.target.value)}
                        placeholder="Type the sentence learners should hear and type..."
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className="add-text-link" onClick={() => handleAddText('end')}>
        + add text
      </button>

      <div className="mtti-section">
        <p className="mtti-intro">add more content with mtti, your ai assistant</p>
        <div className="mtti-panel">
          <textarea
            className="mtti-input"
            placeholder="Enter a topic, instructions and references to generate sentences from the dictation."
            rows={3}
            disabled
          />
          <div className="mtti-panel-footer">
            <button type="button" className="mm-icon-round" disabled title="Coming soon">
              ⚙️
            </button>
            <button type="button" className="mm-icon-round" disabled title="Coming soon">
              ✨
            </button>
          </div>
        </div>
      </div>

      {modalQuestion && (
        <MultimediaModal
          questionText={modalQuestion.text}
          playbackRate={dictationSettings.playbackRate}
          onAttach={(audioMode, audioData) => handleAttach(modalQuestion.id, audioMode, audioData)}
          onGenerateForAll={handleGenerateForAll}
          onClose={() => setModalQuestionId(null)}
        />
      )}
    </div>
  );
}
