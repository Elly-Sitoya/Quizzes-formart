import { useQuizzes } from '../context/QuizzesContext.jsx';
import './QuestionTypeSettingsModal.css';

const TIMER_OPTIONS = [
  { value: 'off', label: 'No timer', hint: "The clock is hidden - there's no time pressure at all." },
  { value: 'up', label: 'Count up', hint: 'Shows how long an attempt took, purely informational.' },
  { value: 'down', label: 'Count down', hint: 'A real limit - the attempt ends automatically at zero.' },
];

// Settings scoped to whichever question type is active in the quiz builder
// modal. Only Crossword Puzzle has real settings so far; every other type
// shows a "Coming soon" placeholder, same as its content pane does.
export default function QuestionTypeSettingsModal({ activeType, activeTypeLabel, onClose }) {
  const { crosswordSettings, updateCrosswordSettings } = useQuizzes();

  const minutes = Math.round(crosswordSettings.timeLimitSeconds / 60);

  const handleMinutesChange = (value) => {
    const mins = Math.max(1, Math.min(60, Number(value) || 1));
    updateCrosswordSettings({ timeLimitSeconds: mins * 60 });
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">{activeTypeLabel} settings</h2>
          <button className="settings-modal-close-btn" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="settings-modal-body">
          {activeType === 'crossword' ? (
            <div className="settings-field">
              <p className="settings-field-label">Timer</p>
              <div className="timer-option-list">
                {TIMER_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`timer-option ${
                      crosswordSettings.timerMode === opt.value ? 'selected' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="timer-mode"
                      value={opt.value}
                      checked={crosswordSettings.timerMode === opt.value}
                      onChange={() => updateCrosswordSettings({ timerMode: opt.value })}
                    />
                    <span className="timer-option-body">
                      <span className="timer-option-label">{opt.label}</span>
                      <span className="timer-option-hint">{opt.hint}</span>
                    </span>
                  </label>
                ))}
              </div>

              {crosswordSettings.timerMode === 'down' && (
                <div className="settings-field-control-row minutes-row">
                  <label htmlFor="time-limit" className="settings-field-label">
                    Time limit
                  </label>
                  <input
                    id="time-limit"
                    type="number"
                    min="1"
                    max="60"
                    value={minutes}
                    onChange={(e) => handleMinutesChange(e.target.value)}
                  />
                  <span className="minutes-suffix">minutes</span>
                </div>
              )}
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
