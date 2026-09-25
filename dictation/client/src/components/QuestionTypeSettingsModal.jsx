import { useState } from 'react';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import './QuestionTypeSettingsModal.css';

const PREVIEW_SENTENCE = 'The quick brown fox jumps over the lazy dog.';

// Settings scoped to whichever question type is active in the quiz builder
// modal. Only Dictation has real settings so far; every other type shows a
// "Coming soon" placeholder, same as its content pane does.
export default function QuestionTypeSettingsModal({ activeType, activeTypeLabel, onClose }) {
  const { dictationSettings, updateDictationSettings } = useQuizzes();
  const [previewing, setPreviewing] = useState(false);

  const handlePreview = () => {
    if (previewing) {
      window.speechSynthesis.cancel();
      setPreviewing(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(PREVIEW_SENTENCE);
    utterance.rate = dictationSettings.playbackRate;
    utterance.onend = () => setPreviewing(false);
    window.speechSynthesis.speak(utterance);
    setPreviewing(true);
  };

  const handleClose = () => {
    window.speechSynthesis?.cancel();
    onClose();
  };

  return (
    <div className="settings-modal-overlay" onClick={handleClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">{activeTypeLabel} settings</h2>
          <button className="settings-modal-close-btn" onClick={handleClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="settings-modal-body">
          {activeType === 'dictation' ? (
            <div className="settings-field">
              <div className="settings-field-label-row">
                <label className="settings-field-label" htmlFor="playback-rate">
                  Computer voice speed
                </label>
                <span className="settings-field-value">
                  {dictationSettings.playbackRate.toFixed(1)}x
                </span>
              </div>
              <div className="settings-field-control-row">
                <input
                  id="playback-rate"
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={dictationSettings.playbackRate}
                  onChange={(e) =>
                    updateDictationSettings({ playbackRate: Number(e.target.value) })
                  }
                />
                <button
                  className="settings-preview-btn"
                  onClick={handlePreview}
                  aria-label={previewing ? 'Stop preview' : 'Preview voice speed'}
                  title={previewing ? 'Stop preview' : 'Preview voice speed'}
                >
                  {previewing ? '⏸' : '▶'}
                </button>
              </div>
              <p className="settings-field-hint">
                Controls how fast sentences are read aloud, for both learners taking a
                dictation quiz and your own previews while building one.
              </p>
            </div>
          ) : (
            <div className="settings-coming-soon">
              <p className="settings-coming-soon-label">Coming soon</p>
              <p className="settings-coming-soon-hint">
                {activeTypeLabel} doesn't have settings yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
