import { useState } from 'react';
import MatchingPairsManager from './MatchingPairsManager.jsx';
import './QuizTypeModal.css';

// Every question type the quiz builder knows about. Matching Pairs is the
// only one with real content behind it so far - the rest are visible tabs
// that simply say "Coming soon" until they're built out.
const QUESTION_TYPES = [
  { key: 'pronunciation', label: 'Pronunciation' },
  { key: 'dictation', label: 'Dictation' },
  { key: 'matching-pairs', label: 'Matching Pairs' },
];

export default function QuizTypeModal({ onClose }) {
  const [activeType, setActiveType] = useState('pronunciation');
  const [closing, setClosing] = useState(false);

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
          <button className="type-modal-close-btn" onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="type-modal-body">
          {activeType === 'matching-pairs' ? (
            <MatchingPairsManager />
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
    </div>
  );
}
