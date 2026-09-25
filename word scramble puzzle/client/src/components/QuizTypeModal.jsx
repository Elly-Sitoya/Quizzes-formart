import { useState } from 'react';
import WordScrambleManager from './WordScrambleManager.jsx';
import WordScrambleSettingsModal from './WordScrambleSettingsModal.jsx';
import './QuizTypeModal.css';

// Every question type the quiz builder knows about. Word Scramble Puzzle is
// the only one with real content behind it so far - the rest are visible
// tabs that simply say "Coming soon" until they're built out.
const QUESTION_TYPES = [
  { key: 'pronunciation', label: 'Pronunciation' },
  { key: 'dictation', label: 'Dictation' },
  { key: 'word-scramble', label: 'Word Scramble Puzzle' },
];

export default function QuizTypeModal({ onClose }) {
  const [activeType, setActiveType] = useState('pronunciation');
  const [closing, setClosing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const activeTypeLabel = QUESTION_TYPES.find((t) => t.key === activeType)?.label ?? '';

  return (
    <div className={`type-modal-overlay ${closing ? 'closing' : ''}`}>
      <div className={`type-modal ${closing ? 'closing' : ''}`}>
        <div className="type-modal-header">
          <div className="type-tabs">
            {QUESTION_TYPES.map((type) => (
              <button
                key={type.key}
                className={`type-tab-btn ${activeType === type.key ? 'active' : ''}`}
                onClick={() => setActiveType(type.key)}
              >
                {type.label}
              </button>
            ))}
          </div>
          <div className="type-modal-header-actions">
            <button
              className="type-settings-btn"
              onClick={() => setSettingsOpen(true)}
              aria-label={`${activeTypeLabel} settings`}
              title={`${activeTypeLabel} settings`}
            >
              <SettingsIcon />
            </button>
            <button className="type-modal-close-btn" onClick={handleClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="type-modal-body">
          {activeType === 'word-scramble' ? (
            <WordScrambleManager />
          ) : (
            <div className="type-coming-soon">
              <p className="type-coming-soon-label">Coming soon</p>
              <p className="type-coming-soon-hint">
                {activeTypeLabel} quizzes aren't ready to build yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {settingsOpen && (
        <WordScrambleSettingsModal
          activeType={activeType}
          activeTypeLabel={activeTypeLabel}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

// Small inline sliders/gear glyph so this component has no icon-library
// dependency - keeps the module easy to drop into a host app that may not
// have one installed.
function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2.2" fill="currentColor" />
      <circle cx="16" cy="12" r="2.2" fill="currentColor" />
      <circle cx="10" cy="18" r="2.2" fill="currentColor" />
    </svg>
  );
}
