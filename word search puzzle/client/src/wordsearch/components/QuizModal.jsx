import { useEffect, useMemo, useRef, useState } from 'react';
import WordSearchGrid from './WordSearchGrid.jsx';
import { formatTime } from '../utils/time.js';
import { colorForIndex } from '../utils/colors.js';
import './QuizModal.css';

const DEFAULT_WORDS_PER_SCREEN = 8;

function chunkWords(words, size) {
  const chunks = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size));
  }
  return chunks.length ? chunks : [[]];
}

export default function QuizModal({ puzzle, onClose }) {
  const screens = useMemo(
    () => chunkWords(puzzle.words, puzzle.wordsPerScreen || DEFAULT_WORDS_PER_SCREEN),
    [puzzle]
  );
  const totalWords = puzzle.words.length;

  const [screenIndex, setScreenIndex] = useState(0);
  const [foundWords, setFoundWords] = useState([]); // across the whole attempt
  const [timeLeft, setTimeLeft] = useState(puzzle.timerSeconds);
  const [timerRunning, setTimerRunning] = useState(true);
  const [finished, setFinished] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [revealAnswers, setRevealAnswers] = useState(false);
  const [poppedWord, setPoppedWord] = useState(null);

  const popTimeoutRef = useRef(null);

  const currentScreenWords = screens[screenIndex] || [];
  // A screen only ever advances once every word on it has been found, so
  // the only place a "missed" word can exist is on the screen the learner
  // was on when the clock ran out.
  const missedWords = finished ? currentScreenWords.filter((w) => !foundWords.includes(w)) : [];

  useEffect(() => {
    if (!timerRunning) return undefined;
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (timeLeft === 0 && !finished) {
      setTimerRunning(false);
      setFinished(true);
    }
  }, [timeLeft, finished]);

  useEffect(() => () => window.clearTimeout(popTimeoutRef.current), []);

  function handleWordFound(word) {
    setFoundWords((prev) => (prev.includes(word) ? prev : [...prev, word]));
    setPoppedWord(word);
    window.clearTimeout(popTimeoutRef.current);
    popTimeoutRef.current = window.setTimeout(() => setPoppedWord(null), 500);
  }

  function handleScreenComplete() {
    setAdvancing(true);
    setTimeout(() => {
      setAdvancing(false);
      if (screenIndex < screens.length - 1) {
        setScreenIndex((i) => i + 1);
      } else {
        setTimerRunning(false);
        setFinished(true);
      }
    }, 900);
  }

  function handleClose() {
    setClosing(true);
    setTimeout(onClose, 200);
  }

  function toggleReveal() {
    setRevealAnswers((r) => !r);
  }

  return (
    <div className={`ws-overlay ${closing ? 'closing' : ''}`}>
      <div className={`ws-modal ${closing ? 'closing' : ''}`}>
        <div className="ws-header">
          <h2 className="ws-title">{puzzle.title}</h2>
          <button className="ws-close-btn" onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="ws-topbar">
          <span className="ws-badge">
            Words: {foundWords.length} / {totalWords}
          </span>

          <div className="ws-word-list">
            {currentScreenWords.map((word, i) => {
              const isFound = foundWords.includes(word);
              const isMissed = finished && revealAnswers && !isFound;
              return (
                <span
                  key={word}
                  className={`ws-word-chip ${isFound ? 'found' : ''} ${
                    word === poppedWord ? 'pop' : ''
                  } ${isMissed ? 'missed' : ''}`}
                  style={isFound ? { color: colorForIndex(i), borderColor: colorForIndex(i) } : undefined}
                >
                  {word}
                </span>
              );
            })}
          </div>

          <span className="ws-badge">
            Screen: {screenIndex + 1} / {screens.length}
          </span>
        </div>

        <div className="ws-board">
          {!advancing && (
            <WordSearchGrid
              key={screenIndex}
              words={currentScreenWords}
              onWordFound={handleWordFound}
              onAllFound={handleScreenComplete}
              interactive={!finished}
              revealWords={finished && revealAnswers ? missedWords : []}
            />
          )}

          {advancing && (
            <div className="ws-screen-complete">
              {screenIndex < screens.length - 1
                ? 'Screen complete! Loading next screen…'
                : 'Last word found! Finishing up…'}
            </div>
          )}
        </div>

        <div className="ws-footer">
          {!finished ? (
            <>
              <div className="ws-footer-left">
                <div className="ws-timer">{formatTime(timeLeft)}</div>
                <button className="ws-tool-btn" disabled title="Coming soon">
                  💡
                </button>
              </div>
              <button className="ws-tool-btn" disabled title="Coming soon">
                🔀
              </button>
            </>
          ) : (
            <div className="ws-finished-bar">
              <p className="ws-finished-score">
                {foundWords.length} / {totalWords} words found
              </p>
              <div className="ws-finished-actions">
                {missedWords.length > 0 && (
                  <button className="ws-reveal-btn" onClick={toggleReveal}>
                    {revealAnswers ? 'Hide answers' : 'Show answers'}
                  </button>
                )}
                <button className="ws-finish-btn" onClick={handleClose}>
                  Finish
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
