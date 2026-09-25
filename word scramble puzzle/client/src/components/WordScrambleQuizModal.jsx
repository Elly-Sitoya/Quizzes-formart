import { useEffect, useRef, useState } from 'react';
import { scrambleLetters } from '../utils/shuffle.js';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import './WordScrambleQuizModal.css';

const GAP = 10;
const MAX_TILE = 64;
const MIN_TILE = 34;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function applyCase(str, caseSensitive) {
  return caseSensitive ? str : str.toUpperCase();
}

// Rebuilds the solved tile order for a "time's up, here's the answer"
// reveal, re-using the same tile ids so the board animates each letter
// sliding into its correct slot instead of just swapping text.
function solveOrder(tiles, target) {
  const pool = [...tiles];
  const result = [];
  for (const ch of target) {
    const idx = pool.findIndex((t) => t.char === ch);
    if (idx === -1) {
      result.push(pool.shift());
      continue;
    }
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}

export default function WordScrambleQuizModal({ quiz, onClose }) {
  const { settings } = useQuizzes();
  const total = quiz.words.length;

  const [phase, setPhase] = useState('play'); // 'play' | 'results'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [order, setOrder] = useState([]);
  const [timeLeft, setTimeLeft] = useState(settings.secondsPerWord);
  const [advancing, setAdvancing] = useState(false);
  const [statusFlash, setStatusFlash] = useState(null); // 'correct' | 'wrong' | 'timeout'
  const [score, setScore] = useState(0);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);
  const [timeoutsCount, setTimeoutsCount] = useState(0);
  const [hintHighlightId, setHintHighlightId] = useState(null);
  const [hintTargetIndex, setHintTargetIndex] = useState(null);
  const [progressTileIds, setProgressTileIds] = useState([]);
  const [closing, setClosing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [dragId, setDragId] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [layout, setLayout] = useState({ tileW: 56, slot: 66, offsetX: 0 });

  const rowRef = useRef(null);
  const modalRef = useRef(null);
  const orderRef = useRef([]);
  const correctIndexSetRef = useRef(new Set());
  const dragStartClientXRef = useRef(0);
  const dragOriginXRef = useRef(0);

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  // ---------- word loading ----------
  function loadWord(idx) {
    const word = quiz.words[idx];
    if (!word) return;
    const target = applyCase(word.answer || '', settings.caseSensitive);
    const freshOrder = scrambleLetters(target);
    const initialCorrect = new Set();
    freshOrder.forEach((t, i) => {
      if (t.char === target[i]) initialCorrect.add(i);
    });
    correctIndexSetRef.current = initialCorrect;
    setCurrentIndex(idx);
    setOrder(freshOrder);
    setTimeLeft(settings.secondsPerWord);
    setStatusFlash(null);
    setHintHighlightId(null);
    setHintTargetIndex(null);
    setProgressTileIds([]);
    setDragId(null);
    setAdvancing(false);
  }

  useEffect(() => {
    loadWord(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- layout measurement ----------
  useEffect(() => {
    function measure() {
      const el = rowRef.current;
      if (!el) return;
      const containerWidth = el.clientWidth;
      const count = Math.max(1, order.length);
      let tileW = Math.floor((containerWidth - GAP * (count - 1)) / count);
      tileW = Math.max(MIN_TILE, Math.min(MAX_TILE, tileW));
      const slot = tileW + GAP;
      const totalWidth = count * tileW + (count - 1) * GAP;
      const offsetX = Math.max(0, (containerWidth - totalWidth) / 2);
      setLayout({ tileW, slot, offsetX });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [order.length, currentIndex]);

  function tilePositionX(idx) {
    return layout.offsetX + idx * layout.slot;
  }

  // ---------- timer ----------
  useEffect(() => {
    if (phase !== 'play' || advancing) return undefined;
    const id = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, advancing, currentIndex]);

  useEffect(() => {
    if (phase === 'play' && !advancing && timeLeft === 0) {
      handleTimeout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  // ---------- outcomes ----------
  function advanceWord() {
    if (currentIndex + 1 < total) {
      loadWord(currentIndex + 1);
    } else {
      setPhase('results');
    }
  }

  function handleCorrect() {
    if (advancing) return;
    setAdvancing(true);
    setStatusFlash('correct');
    setScore((s) => s + 1);
    window.setTimeout(advanceWord, 900);
  }

  function handleWrong() {
    setStatusFlash('wrong');
    window.setTimeout(() => {
      setStatusFlash((f) => (f === 'wrong' ? null : f));
    }, 420);
  }

  function handleProgress(tileIds) {
    setProgressTileIds(tileIds);
    window.setTimeout(() => {
      setProgressTileIds((prev) => prev.filter((id) => !tileIds.includes(id)));
    }, 650);
  }

  function handleTimeout() {
    if (advancing) return;
    setAdvancing(true);
    setStatusFlash('timeout');
    setTimeoutsCount((c) => c + 1);
    const word = quiz.words[currentIndex];
    const target = applyCase(word?.answer || '', settings.caseSensitive);
    setOrder((prev) => solveOrder(prev, target));
    window.setTimeout(advanceWord, 1300);
  }

  function evaluate() {
    if (advancing || phase !== 'play') return;
    const word = quiz.words[currentIndex];
    const target = applyCase(word?.answer || '', settings.caseSensitive);
    const guess = orderRef.current.map((t) => t.char).join('');

    if (guess === target && guess.length > 0) {
      handleCorrect();
      return;
    }

    // Reward the learner for progress even on a wrong overall guess: if
    // dragging that letter into place made a *new* position correct that
    // wasn't correct a moment ago, celebrate just those tiles instead of
    // treating the whole attempt as a miss.
    const newCorrectIndices = new Set();
    orderRef.current.forEach((t, i) => {
      if (t.char === target[i]) newCorrectIndices.add(i);
    });
    const newlyCorrect = [...newCorrectIndices].filter((i) => !correctIndexSetRef.current.has(i));
    correctIndexSetRef.current = newCorrectIndices;

    if (newlyCorrect.length > 0) {
      handleProgress(newlyCorrect.map((i) => orderRef.current[i].id));
    } else {
      handleWrong();
    }
  }

  // ---------- hint ----------
  function handleHint() {
    if (!settings.hintsAllowed || advancing) return;
    const word = quiz.words[currentIndex];
    const target = applyCase(word?.answer || '', settings.caseSensitive);
    const current = orderRef.current;
    const wrongIdx = current.findIndex((t, i) => t.char !== target[i]);
    if (wrongIdx === -1) return;
    const neededChar = target[wrongIdx];
    const candidate =
      current.find((t, i) => t.char === neededChar && i !== wrongIdx) ??
      current.find((t) => t.char === neededChar);
    if (!candidate) return;
    setHintHighlightId(candidate.id);
    setHintTargetIndex(wrongIdx);
    setHintsUsedCount((c) => c + 1);
    window.setTimeout(() => {
      setHintHighlightId(null);
      setHintTargetIndex(null);
    }, 2500);
  }

  // ---------- drag ----------
  function handlePointerDown(tileId, e) {
    if (advancing) return;
    const idx = order.findIndex((t) => t.id === tileId);
    if (idx === -1) return;
    e.preventDefault();
    setHintHighlightId(null);
    setHintTargetIndex(null);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture can fail in rare cases - move/up are still wired to
      // this same element either way, so the drag keeps tracking fine.
    }
    dragStartClientXRef.current = e.clientX;
    dragOriginXRef.current = tilePositionX(idx);
    setDragId(tileId);
    setDragX(dragOriginXRef.current);
  }

  function handlePointerMove(e) {
    if (!dragId) return;
    const dx = e.clientX - dragStartClientXRef.current;
    const newX = dragOriginXRef.current + dx;
    setDragX(newX);

    const { slot, offsetX } = layout;
    let targetIdx = Math.round((newX - offsetX) / slot);
    targetIdx = Math.max(0, Math.min(order.length - 1, targetIdx));

    setOrder((prev) => {
      const curIdx = prev.findIndex((t) => t.id === dragId);
      if (curIdx === -1 || curIdx === targetIdx) return prev;
      const next = [...prev];
      const [moved] = next.splice(curIdx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
  }

  function handlePointerUp(e) {
    if (!dragId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Fine if this wasn't the capturing element any more.
    }
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    setDragId(null);
    evaluate();
  }

  // ---------- fullscreen ----------
  function toggleFullscreen() {
    const el = modalRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  // ---------- close / retry ----------
  function handleClose() {
    setClosing(true);
    window.setTimeout(onClose, 200);
  }

  function handleRetry() {
    setScore(0);
    setHintsUsedCount(0);
    setTimeoutsCount(0);
    setPhase('play');
    loadWord(0);
  }

  const currentWord = quiz.words[currentIndex];
  const urgent = timeLeft <= 10 && phase === 'play';

  return (
    <div className={`ws-overlay ${closing ? 'closing' : ''}`}>
      <div className={`ws-modal ${closing ? 'closing' : ''}`} ref={modalRef}>
        <button className="ws-close-btn" onClick={handleClose} aria-label="Close">
          ✕
        </button>

        <div className="ws-modal-header">
          <h2 className="ws-header-title">{quiz.title}</h2>
          <div className="ws-score-badge">
            <span className="ws-score-icon">★</span>
            <span className="ws-score-label">SCORE</span>
            <span className="ws-score-value" key={score}>
              {score}
            </span>
          </div>
        </div>

        {phase === 'play' && currentWord ? (
          <div key={currentIndex} className="ws-word-frame">
            <div className="ws-clue-banner">{currentWord.clue}</div>

            <div className={`ws-board ${statusFlash ? `flash-${statusFlash}` : ''}`}>
              <div className="ws-tiles-row" ref={rowRef} style={{ height: layout.tileW }}>
                {order.map((tile, idx) => {
                  const isDragging = dragId === tile.id;
                  const x = isDragging ? dragX : tilePositionX(idx);
                  const classNames = ['ws-tile'];
                  if (isDragging) classNames.push('dragging');
                  if (hintHighlightId === tile.id) classNames.push('hint-glow');
                  if (progressTileIds.includes(tile.id)) classNames.push('progress-pop');
                  return (
                    <div
                      key={tile.id}
                      className={classNames.join(' ')}
                      style={{
                        width: layout.tileW,
                        height: layout.tileW,
                        fontSize: Math.round(layout.tileW * 0.42),
                        transform: `translateX(${x}px)`,
                        zIndex: isDragging ? 5 : 2,
                      }}
                      onPointerDown={(e) => handlePointerDown(tile.id, e)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                    >
                      {tile.char}
                    </div>
                  );
                })}
                {hintTargetIndex !== null && (
                  <div
                    className="ws-hint-slot"
                    style={{
                      width: layout.tileW,
                      height: layout.tileW,
                      transform: `translateX(${tilePositionX(hintTargetIndex)}px)`,
                    }}
                  />
                )}
              </div>

              <div className="ws-board-footer">
                <div className={`ws-timer-pill ${urgent ? 'urgent' : ''}`} title="Time remaining">
                  {formatTime(timeLeft)}
                </div>
                <div className="ws-board-footer-right">
                  {settings.hintsAllowed && (
                    <button
                      className="ws-hint-btn"
                      onClick={handleHint}
                      disabled={advancing}
                      aria-label="Get a hint"
                      title="Get a hint"
                    >
                      <HintIcon />
                    </button>
                  )}
                  <button
                    className="ws-fullscreen-btn"
                    onClick={toggleFullscreen}
                    aria-label="Toggle fullscreen"
                    title="Toggle fullscreen"
                  >
                    <FullscreenIcon expanded={isFullscreen} />
                  </button>
                </div>
              </div>
            </div>

            <p className="ws-progress-label">
              Word {currentIndex + 1} of {total}
            </p>
          </div>
        ) : (
          <div className="ws-results">
            <p className="ws-results-score">
              {score}/{total}
            </p>
            <p className="ws-results-label">
              {score === total ? 'Perfect run!' : 'Nice effort!'}
            </p>
            <div className="ws-results-breakdown">
              <span className="ws-breakdown-item solved">{score} solved</span>
              {hintsUsedCount > 0 && (
                <span className="ws-breakdown-item hints">
                  {hintsUsedCount} hint{hintsUsedCount === 1 ? '' : 's'} used
                </span>
              )}
              {timeoutsCount > 0 && (
                <span className="ws-breakdown-item timeouts">{timeoutsCount} timed out</span>
              )}
            </div>
            <div className="ws-results-actions">
              <button className="ws-retry-btn" onClick={handleRetry}>
                Try again
              </button>
              <button className="ws-finish-btn" onClick={handleClose}>
                Finish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline icons so this module carries no icon-library dependency.
function HintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .8 1.7V16h5.6v-.5c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FullscreenIcon({ expanded }) {
  if (expanded) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 3v4a2 2 0 0 1-2 2H3M15 3v4a2 2 0 0 0 2 2h4M9 21v-4a2 2 0 0 0-2-2H3M15 21v-4a2 2 0 0 1 2-2h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 9V5a2 2 0 0 1 2-2h4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
