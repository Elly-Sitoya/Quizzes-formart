import { useState } from 'react';
import WordSearchManager from './WordSearchManager.jsx';
import QuizSettingsModal from './QuizSettingsModal.jsx';
import './QuizTypeModal.css';

// Every question type the trainer's quiz builder knows about. Word Search
// is the only one with real content behind it in this app - the rest are
// visible tabs that say "Coming soon" until their own app is built.
const QUESTION_TYPES = [
  { key: 'pronunciation', label: 'Pronunciation' },
  { key: 'dictation', label: 'Dictation' },
  { key: 'word-search', label: 'Word Search' },
];

export default function QuizTypeModal({ onClose }) {
  const [activeType, setActiveType] = useState('pronunciation');
  const [closing, setClosing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const activeLabel = QUESTION_TYPES.find((t) => t.key === activeType)?.label ?? '';

  return (
    <div className={`ws-type-modal-overlay ${closing ? 'closing' : ''}`}>
      <div className={`ws-type-modal ${closing ? 'closing' : ''}`}>
        <div className="ws-type-modal-header">
          <div className="ws-type-tabs">
            {QUESTION_TYPES.map((type) => (
              <button
                key={type.key}
                className={`ws-type-tab-btn ${activeType === type.key ? 'active' : ''}`}
                onClick={() => setActiveType(type.key)}
              >
                {type.label}
              </button>
            ))}
          </div>
          <div className="ws-type-modal-header-actions">
            <button
              className="ws-type-modal-gear-btn"
              onClick={() => setSettingsOpen(true)}
              aria-label={`${activeLabel} settings`}
              title={`${activeLabel} settings`}
            >
              ⚙
            </button>
            <button className="ws-type-modal-close-btn" onClick={handleClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="ws-type-modal-body">
          {activeType === 'word-search' ? (
            <WordSearchManager />
          ) : (
            <div className="ws-type-coming-soon">
              <p className="ws-type-coming-soon-label">Coming soon</p>
              <p className="ws-type-coming-soon-hint">
                {activeLabel} quizzes aren't ready to build yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {settingsOpen && (
        <QuizSettingsModal activeType={activeType} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
