import { useState } from 'react';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import './WordScrambleSettingsModal.css';

// Opened from the gear icon in QuizTypeModal. Configures the *behavior* of
// whichever question type tab is currently active - separate from the
// content (quizzes/words) managed on the main body of that modal. Only
// Word Scramble Puzzle has real settings today; the other types mirror
// their "Coming soon" tab state here too.
export default function WordScrambleSettingsModal({ activeType, activeTypeLabel, onClose }) {
  const { settings, updateSettings } = useQuizzes();
  const [closing, setClosing] = useState(false);
  const [draft, setDraft] = useState(settings);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const handleSave = () => {
    updateSettings(draft);
    handleClose();
  };

  const isWordScramble = activeType === 'word-scramble';

  return (
    <div className={`ws-settings-overlay ${closing ? 'closing' : ''}`}>
      <div className={`ws-settings-modal ${closing ? 'closing' : ''}`}>
        <div className="ws-settings-header">
          <h2 className="ws-settings-title">{activeTypeLabel} Settings</h2>
          <button className="ws-settings-close-btn" onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </div>

        {isWordScramble ? (
          <div className="ws-settings-body">
            <label className="ws-setting-row">
              <span className="ws-setting-label">
                Seconds per word
                <span className="ws-setting-hint">How long a learner gets before it times out.</span>
              </span>
              <input
                type="number"
                min="5"
                className="ws-setting-number"
                value={draft.secondsPerWord}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    secondsPerWord: Math.max(5, Number(e.target.value) || 0),
                  }))
                }
              />
            </label>

            <label className="ws-setting-row ws-setting-toggle-row">
              <span className="ws-setting-label">
                Hints allowed
                <span className="ws-setting-hint">Lets a stuck learner reveal one letter.</span>
              </span>
              <input
                type="checkbox"
                className="ws-setting-toggle"
                checked={draft.hintsAllowed}
                onChange={(e) => setDraft((prev) => ({ ...prev, hintsAllowed: e.target.checked }))}
              />
            </label>

            <label className="ws-setting-row ws-setting-toggle-row">
              <span className="ws-setting-label">
                Case sensitive
                <span className="ws-setting-hint">
                  Match the exact upper/lowercase letters of the answer.
                </span>
              </span>
              <input
                type="checkbox"
                className="ws-setting-toggle"
                checked={draft.caseSensitive}
                onChange={(e) => setDraft((prev) => ({ ...prev, caseSensitive: e.target.checked }))}
              />
            </label>

            <div className="ws-settings-actions">
              <button className="ws-settings-cancel-btn" onClick={handleClose}>
                Cancel
              </button>
              <button className="ws-settings-save-btn" onClick={handleSave}>
                Save settings
              </button>
            </div>
          </div>
        ) : (
          <div className="ws-settings-coming-soon">
            <p className="ws-settings-coming-soon-label">Coming soon</p>
            <p className="ws-settings-coming-soon-hint">
              {activeTypeLabel} settings aren't ready yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
