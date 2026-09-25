import { useState } from 'react';
import { usePuzzles } from '../context/PuzzlesContext.jsx';
import './QuizSettingsModal.css';

// Opened from the gear icon on the quiz-type modal. Shows configuration
// for whichever question type tab is currently active. Today that's real
// settings for Word Search (defaults applied to newly created puzzles -
// existing puzzles keep their own settings, editable from "Edit words")
// and a "coming soon" placeholder for every other type, matching the same
// placeholder pattern used in the main builder body.
const TYPE_LABELS = {
  pronunciation: 'Pronunciation',
  dictation: 'Dictation',
  'word-search': 'Word Search',
};

export default function QuizSettingsModal({ activeType, onClose }) {
  const { wordSearchDefaults, updateWordSearchDefaults } = usePuzzles();
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const label = TYPE_LABELS[activeType] ?? 'Quiz';
  const minutes = Math.round((wordSearchDefaults?.timerSeconds ?? 360) / 60);

  return (
    <div className={`ws-settings-overlay ${closing ? 'closing' : ''}`}>
      <div className={`ws-settings-modal ${closing ? 'closing' : ''}`}>
        <div className="ws-settings-header">
          <h3 className="ws-settings-title">{label} settings</h3>
          <button className="ws-settings-close-btn" onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="ws-settings-body">
          {activeType === 'word-search' ? (
            <>
              <p className="ws-settings-hint">
                These defaults apply to every new word search puzzle a trainer creates. Existing
                puzzles keep their own settings and can still be adjusted from "Edit words".
              </p>

              <div className="ws-settings-field">
                <label className="ws-settings-label" htmlFor="ws-default-timer">
                  Default time limit (minutes)
                </label>
                <input
                  id="ws-default-timer"
                  className="ws-settings-input"
                  type="number"
                  min="1"
                  max="30"
                  value={minutes}
                  onChange={(e) =>
                    updateWordSearchDefaults({
                      timerSeconds: Math.max(1, Number(e.target.value) || 1) * 60,
                    })
                  }
                />
              </div>

              <div className="ws-settings-field">
                <label className="ws-settings-label" htmlFor="ws-default-per-screen">
                  Default words per screen
                </label>
                <input
                  id="ws-default-per-screen"
                  className="ws-settings-input"
                  type="number"
                  min="1"
                  max="20"
                  value={wordSearchDefaults?.wordsPerScreen ?? 8}
                  onChange={(e) =>
                    updateWordSearchDefaults({
                      wordsPerScreen: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                />
              </div>
            </>
          ) : (
            <div className="ws-settings-coming-soon">
              <p className="ws-settings-coming-soon-label">Coming soon</p>
              <p className="ws-settings-coming-soon-hint">
                {label} settings aren't ready to configure yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
