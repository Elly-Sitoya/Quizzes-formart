import { useEffect, useMemo, useRef, useState } from 'react';
import { generateCrossword } from '../utils/crosswordGenerator.js';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import CrosswordGrid from './CrosswordGrid.jsx';
import './CrosswordQuizModal.css';

function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60).toString().padStart(2, '0');
  const s = Math.floor(safe % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function CrosswordQuizModal({ quiz, onClose }) {
  const { crosswordSettings } = useQuizzes();
  const layout = useMemo(() => generateCrossword(quiz.questions), [quiz.questions]);

  const [closing, setClosing] = useState(false);
  const [activeWordId, setActiveWordId] = useState(layout.words[0]?.id ?? null);
  const [score, setScore] = useState(0);
  const [solvedIds, setSolvedIds] = useState(() => new Set());
  const [finished, setFinished] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(crosswordSettings.timeLimitSeconds);

  const gridRef = useRef(null);
  const fullscreenTargetRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const finishTimeoutRef = useRef(null);

  const totalWords = layout.words.length;
  const acrossWords = layout.words.filter((w) => w.direction === 'across');
  const downWords = layout.words.filter((w) => w.direction === 'down');

  // A brand-new attempt (new quiz opened) resets the whole session.
  useEffect(() => {
    setActiveWordId(layout.words[0]?.id ?? null);
    setScore(0);
    setSolvedIds(new Set());
    setFinished(false);
    setElapsedSeconds(0);
    setRemainingSeconds(crosswordSettings.timeLimitSeconds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  const handleFinish = () => {
    clearInterval(timerIntervalRef.current);
    setFinished(true);
  };

  // Timer behaviour is entirely driven by the trainer's crossword settings:
  // off (no clock at all), count-up (informational), or count-down (a real
  // limit that ends the attempt when it hits zero).
  useEffect(() => {
    if (finished || crosswordSettings.timerMode === 'off') return undefined;

    timerIntervalRef.current = setInterval(() => {
      if (crosswordSettings.timerMode === 'down') {
        setRemainingSeconds((s) => {
          if (s <= 1) {
            clearInterval(timerIntervalRef.current);
            handleFinish();
            return 0;
          }
          return s - 1;
        });
      } else {
        setElapsedSeconds((s) => s + 1);
      }
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, crosswordSettings.timerMode, layout]);

  // Once every word in the puzzle is correct, wrap up the attempt shortly
  // after so the learner sees the last cell's "correct" animation land.
  useEffect(() => {
    if (totalWords > 0 && solvedIds.size === totalWords && !finished) {
      finishTimeoutRef.current = setTimeout(handleFinish, 500);
    }
    return () => clearTimeout(finishTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solvedIds, totalWords, finished]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleWordStatusChange = (word, status) => {
    if (status === 'correct' && !solvedIds.has(word.id)) {
      setSolvedIds((prev) => new Set(prev).add(word.id));
      setScore((s) => s + word.length * 10);
    }
  };

  const handleClose = () => {
    setClosing(true);
    clearInterval(timerIntervalRef.current);
    clearTimeout(finishTimeoutRef.current);
    setTimeout(onClose, 200);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      fullscreenTargetRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleReveal = () => {
    gridRef.current?.revealFocusedCell();
    setHintOpen(false);
  };

  const displaySeconds = crosswordSettings.timerMode === 'down' ? remainingSeconds : elapsedSeconds;

  const renderClueList = (words, label) => (
    <div className="cwq-clue-group">
      <h3 className="cwq-clue-heading">{label}</h3>
      <ul className="cwq-clue-list">
        {words.map((w) => (
          <li
            key={w.id}
            className={`cwq-clue-item ${w.id === activeWordId ? 'active' : ''} ${
              solvedIds.has(w.id) ? 'solved' : ''
            }`}
            onClick={() => setActiveWordId(w.id)}
          >
            <span className="cwq-clue-number">{w.number}.</span>
            <span className="cwq-clue-text">{w.clue}</span>
            {solvedIds.has(w.id) && <span className="cwq-clue-check">✔</span>}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={`cwq-overlay ${closing ? 'closing' : ''}`}>
      <div className={`cwq-modal ${closing ? 'closing' : ''}`}>
        <div className="cwq-header">
          <button className="cwq-close-btn" onClick={handleClose} aria-label="Close quiz">
            ✕
          </button>
          <h2 className="cwq-title">{quiz.title}</h2>
          <div className="cwq-score-badge">
            <span className="cwq-score-label">Score</span>
            <span className="cwq-score-value">🪙 {score}</span>
          </div>
        </div>

        {!finished ? (
          <>
            <div className="cwq-body">
              <div className="cwq-grid-pane" ref={fullscreenTargetRef}>
                <div className="cwq-grid-controls">
                  <button className="cwq-round-btn" onClick={handleZoomIn} aria-label="Zoom in">
                    +
                  </button>
                  <button className="cwq-round-btn" onClick={handleZoomOut} aria-label="Zoom out">
                    −
                  </button>
                  <button
                    className="cwq-round-btn"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? '⤡' : '⤢'}
                  </button>
                </div>
                <div className="cwq-grid-scroll">
                  <div className="cwq-grid-scale-wrap" style={{ transform: `scale(${zoom})` }}>
                    <CrosswordGrid
                      ref={gridRef}
                      layout={layout}
                      mode="solve"
                      activeWordId={activeWordId}
                      onActiveWordChange={setActiveWordId}
                      onWordStatusChange={handleWordStatusChange}
                    />
                  </div>
                </div>
              </div>

              <div className="cwq-clue-pane">
                {renderClueList(acrossWords, 'Across')}
                {renderClueList(downWords, 'Down')}
              </div>
            </div>

            <div className="cwq-footer">
              <div className="cwq-timer-cluster">
                {crosswordSettings.timerMode !== 'off' && (
                  <span className="cwq-timer-pill">⏱ {formatTime(displaySeconds)}</span>
                )}
                <div className="cwq-hint-wrap">
                  <button
                    className="cwq-round-btn"
                    onClick={() => setHintOpen((o) => !o)}
                    aria-label="Puzzle options"
                    title="Puzzle options"
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <line x1="4" y1="6" x2="20" y2="6" />
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <line x1="4" y1="18" x2="20" y2="18" />
                      <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
                      <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
                      <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" />
                    </svg>
                  </button>
                  {hintOpen && (
                    <div className="cwq-hint-popover">
                      <button className="cwq-hint-action" onClick={handleReveal}>
                        Reveal letter
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button className="cwq-finish-early-btn" onClick={handleFinish}>
                Finish
              </button>
            </div>
          </>
        ) : (
          <div className="cwq-summary">
            <p className="cwq-summary-emoji">🎉</p>
            <h2>Puzzle Complete!</h2>
            <p className="cwq-summary-score">{score} points</p>
            <p className="cwq-summary-meta">
              {solvedIds.size} / {totalWords} words solved
            </p>
            {crosswordSettings.timerMode !== 'off' && (
              <p className="cwq-summary-meta">
                Time: {formatTime(crosswordSettings.timerMode === 'down' ? crosswordSettings.timeLimitSeconds - remainingSeconds : elapsedSeconds)}
              </p>
            )}
            <button className="cwq-close-summary-btn" onClick={handleClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
