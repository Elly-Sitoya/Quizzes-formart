import { useEffect, useRef, useState } from 'react';
import { shuffle } from '../utils/shuffle.js';
import './MatchingPairsQuizModal.css';

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Generous hit-test padding around each dot so a drop doesn't have to land
// pixel-perfectly on the dot itself - mainly matters on touch.
const HIT_PADDING = 14;

function pointInRect(x, y, rect, pad = 0) {
  return (
    x >= rect.left - pad &&
    x <= rect.right + pad &&
    y >= rect.top - pad &&
    y <= rect.bottom + pad
  );
}

export default function MatchingPairsQuizModal({ quiz, onClose }) {
  const total = quiz.pairs.length;

  const [rightOrder, setRightOrder] = useState(() => shuffle(quiz.pairs));
  const [matchedIds, setMatchedIds] = useState(() => new Set());
  const [mistakeCounts, setMistakeCounts] = useState({});
  const [selectedLeftId, setSelectedLeftId] = useState(null);
  const [wrongFlash, setWrongFlash] = useState(null); // { leftId, rightId }
  const [justMatched, setJustMatched] = useState(null);

  const [dragFrom, setDragFrom] = useState(null); // { pairId, side }
  const [pointerPos, setPointerPos] = useState(null); // {x,y} relative to board
  const [hoverTargetId, setHoverTargetId] = useState(null);

  const [phase, setPhase] = useState('attempt'); // 'attempt' | 'results'
  const [timeLeft, setTimeLeft] = useState(quiz.timerEnabled ? quiz.timerSeconds : null);
  const [timerRunning, setTimerRunning] = useState(!!quiz.timerEnabled);
  const [closing, setClosing] = useState(false);
  const [lines, setLines] = useState([]);
  const [displayScore, setDisplayScore] = useState(0);

  const boardRef = useRef(null);
  const svgRef = useRef(null);
  const leftDotRefs = useRef({});
  const rightDotRefs = useRef({});
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const recomputeRef = useRef(() => {});

  // ---------- timer ----------
  useEffect(() => {
    if (!timerRunning) return undefined;
    const id = setInterval(() => {
      setTimeLeft((prev) => (prev === null ? null : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (timeLeft === 0 && phase === 'attempt') {
      setTimerRunning(false);
      setPhase('results');
    }
  }, [timeLeft, phase]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  // ---------- line geometry ----------
  function dotCenter(node) {
    const svg = svgRef.current;
    if (!svg || !node) return null;
    const s = svg.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top };
  }

  function recomputeLines() {
    const next = [];
    matchedIds.forEach((id) => {
      const a = dotCenter(leftDotRefs.current[id]);
      const b = dotCenter(rightDotRefs.current[id]);
      if (a && b) next.push({ id, x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    });
    setLines(next);
  }
  recomputeRef.current = recomputeLines;

  useEffect(() => {
    recomputeLines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedIds]);

  useEffect(() => {
    function onResize() {
      recomputeRef.current();
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ---------- matching ----------
  function attemptMatch(leftPairId, rightPairId) {
    if (matchedIds.has(leftPairId) || matchedIds.has(rightPairId)) return;

    if (leftPairId === rightPairId) {
      const willComplete = matchedIds.size + 1 >= total;
      setMatchedIds((prev) => new Set(prev).add(leftPairId));
      setJustMatched(leftPairId);
      window.setTimeout(() => setJustMatched(null), 500);
      if (willComplete) {
        setTimerRunning(false);
        window.setTimeout(() => setPhase('results'), 550);
      }
    } else {
      setMistakeCounts((prev) => ({ ...prev, [leftPairId]: (prev[leftPairId] || 0) + 1 }));
      setWrongFlash({ leftId: leftPairId, rightId: rightPairId });
      window.setTimeout(() => setWrongFlash(null), 420);
    }
  }

  // ---------- pointer drag (mouse + touch share one code path) ----------
  function handleDotPointerDown(e, pairId, side) {
    if (matchedIds.has(pairId)) return;
    e.preventDefault();
    dragMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture can fail in rare cases - the drag still tracks fine
      // since move/up are wired to this same element either way.
    }
    setDragFrom({ pairId, side });
    setSelectedLeftId(null);
    const svg = svgRef.current;
    if (svg) {
      const s = svg.getBoundingClientRect();
      setPointerPos({ x: e.clientX - s.left, y: e.clientY - s.top });
    }
  }

  function handleDragMove(e) {
    if (!dragFrom) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMovedRef.current = true;

    const svg = svgRef.current;
    if (!svg) return;
    const s = svg.getBoundingClientRect();
    setPointerPos({ x: e.clientX - s.left, y: e.clientY - s.top });

    const targetRefs = dragFrom.side === 'left' ? rightDotRefs.current : leftDotRefs.current;
    let found = null;
    for (const id in targetRefs) {
      const node = targetRefs[id];
      if (!node || matchedIds.has(id)) continue;
      const r = node.getBoundingClientRect();
      if (pointInRect(e.clientX, e.clientY, r, HIT_PADDING)) {
        found = id;
        break;
      }
    }
    setHoverTargetId((prev) => (prev === found ? prev : found));
  }

  function handleDragEnd() {
    if (!dragFrom) return;
    if (hoverTargetId) {
      const leftId = dragFrom.side === 'left' ? dragFrom.pairId : hoverTargetId;
      const rightId = dragFrom.side === 'left' ? hoverTargetId : dragFrom.pairId;
      attemptMatch(leftId, rightId);
    } else if (dragMovedRef.current) {
      // A real drag that ended over nothing valid - snap back with a
      // small "that wasn't it" shake on the item that was being dragged.
      setWrongFlash({
        leftId: dragFrom.side === 'left' ? dragFrom.pairId : null,
        rightId: dragFrom.side === 'right' ? dragFrom.pairId : null,
      });
      window.setTimeout(() => setWrongFlash(null), 420);
    }
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    setDragFrom(null);
    setHoverTargetId(null);
    setPointerPos(null);
  }

  // ---------- tap-to-select fallback (tap left, then tap right) ----------
  function handleLeftDotClick(pairId) {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    if (matchedIds.has(pairId)) return;
    setSelectedLeftId((prev) => (prev === pairId ? null : pairId));
  }

  function handleRightDotClick(pairId) {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    if (matchedIds.has(pairId) || !selectedLeftId) return;
    attemptMatch(selectedLeftId, pairId);
    setSelectedLeftId(null);
  }

  // ---------- results ----------
  const perfectCount = quiz.pairs.filter((p) => matchedIds.has(p.id) && !mistakeCounts[p.id]).length;
  const mistakeMatchCount = quiz.pairs.filter(
    (p) => matchedIds.has(p.id) && mistakeCounts[p.id]
  ).length;
  const unmatchedCount = total - matchedIds.size;
  const scorePercent =
    total === 0 ? 0 : Math.round(((perfectCount + mistakeMatchCount * 0.5) / total) * 100);

  useEffect(() => {
    if (phase !== 'results') return undefined;
    setDisplayScore(0);
    const start = performance.now();
    const duration = 700;
    let raf;
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      setDisplayScore(Math.round(progress * scorePercent));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function handleRetry() {
    setRightOrder(shuffle(quiz.pairs));
    setMatchedIds(new Set());
    setMistakeCounts({});
    setSelectedLeftId(null);
    setDragFrom(null);
    setPointerPos(null);
    setHoverTargetId(null);
    setLines([]);
    setPhase('attempt');
    setTimeLeft(quiz.timerEnabled ? quiz.timerSeconds : null);
    setTimerRunning(!!quiz.timerEnabled);
  }

  function handleClose() {
    setClosing(true);
    window.setTimeout(onClose, 200);
  }

  const urgent = quiz.timerEnabled && timeLeft !== null && timeLeft <= 10 && phase === 'attempt';

  return (
    <div className={`mp-overlay ${closing ? 'closing' : ''}`}>
      <div className={`mp-modal ${closing ? 'closing' : ''}`}>
        <div className="mp-header">
          <h2 className="mp-title">{quiz.title}</h2>
          {quiz.timerEnabled && timeLeft !== null && (
            <div className={`mp-timer ${urgent ? 'urgent' : ''}`} title="Time remaining">
              {formatTime(timeLeft)}
            </div>
          )}
          <button className="mp-close-btn" onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </div>

        {phase === 'attempt' ? (
          <div className="mp-board" ref={boardRef}>
            <svg className="mp-lines-svg" ref={svgRef}>
              {lines.map((line) => (
                <g key={line.id}>
                  <line
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    className="mp-match-line"
                  />
                  <circle cx={line.x1} cy={line.y1} r="5.5" className="mp-line-endpoint" />
                  <circle cx={line.x2} cy={line.y2} r="5.5" className="mp-line-endpoint" />
                </g>
              ))}
              {dragFrom &&
                pointerPos &&
                (() => {
                  const originRefs = dragFrom.side === 'left' ? leftDotRefs : rightDotRefs;
                  const origin = dotCenter(originRefs.current[dragFrom.pairId]);
                  if (!origin) return null;
                  return (
                    <g>
                      <line
                        x1={origin.x}
                        y1={origin.y}
                        x2={pointerPos.x}
                        y2={pointerPos.y}
                        className="mp-drag-line"
                      />
                      <circle cx={origin.x} cy={origin.y} r="5.5" className="mp-drag-line-endpoint" />
                      <circle
                        cx={pointerPos.x}
                        cy={pointerPos.y}
                        r="6.5"
                        className="mp-drag-line-endpoint"
                      />
                    </g>
                  );
                })()}
            </svg>

            <div className="mp-columns" onScroll={recomputeLines}>
              <div className="mp-column mp-column-left">
                {quiz.pairs.map((pair) => {
                  const isMatched = matchedIds.has(pair.id);
                  const classNames = ['mp-pill'];
                  if (isMatched) classNames.push('matched');
                  if (selectedLeftId === pair.id) classNames.push('selected');
                  if (justMatched === pair.id) classNames.push('just-matched');
                  if (hoverTargetId === pair.id && dragFrom?.side === 'right')
                    classNames.push('hover-target');
                  if (wrongFlash && wrongFlash.leftId === pair.id) classNames.push('wrong-flash');
                  return (
                    <div className={classNames.join(' ')} key={pair.id}>
                      <span className="mp-pill-text">{pair.left}</span>
                      <span
                        className="mp-dot"
                        ref={(el) => {
                          leftDotRefs.current[pair.id] = el;
                        }}
                        onPointerDown={(e) => handleDotPointerDown(e, pair.id, 'left')}
                        onPointerMove={handleDragMove}
                        onPointerUp={handleDragEnd}
                        onClick={() => handleLeftDotClick(pair.id)}
                      >
                        <span className="mp-dot-center" />
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mp-column mp-column-right">
                {rightOrder.map((pair) => {
                  const isMatched = matchedIds.has(pair.id);
                  const classNames = ['mp-pill', 'mp-pill-right'];
                  if (isMatched) classNames.push('matched');
                  if (justMatched === pair.id) classNames.push('just-matched');
                  if (hoverTargetId === pair.id && dragFrom?.side === 'left')
                    classNames.push('hover-target');
                  if (selectedLeftId && !isMatched) classNames.push('awaiting');
                  if (wrongFlash && wrongFlash.rightId === pair.id) classNames.push('wrong-flash');
                  return (
                    <div className={classNames.join(' ')} key={pair.id}>
                      <span
                        className="mp-dot"
                        ref={(el) => {
                          rightDotRefs.current[pair.id] = el;
                        }}
                        onPointerDown={(e) => handleDotPointerDown(e, pair.id, 'right')}
                        onPointerMove={handleDragMove}
                        onPointerUp={handleDragEnd}
                        onClick={() => handleRightDotClick(pair.id)}
                      >
                        <span className="mp-dot-center" />
                      </span>
                      <span className="mp-pill-text">{pair.right}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mp-results">
            <p className="mp-results-score">{displayScore}%</p>
            <p className="mp-results-label">{unmatchedCount > 0 ? "Time's up" : 'All matched!'}</p>
            <div className="mp-results-breakdown">
              <span className="mp-breakdown-item perfect">{perfectCount} perfect</span>
              {mistakeMatchCount > 0 && (
                <span className="mp-breakdown-item retries">{mistakeMatchCount} with retries</span>
              )}
              {unmatchedCount > 0 && (
                <span className="mp-breakdown-item unmatched">{unmatchedCount} unmatched</span>
              )}
            </div>
            <div className="mp-results-actions">
              <button className="mp-retry-btn" onClick={handleRetry}>
                Try again
              </button>
              <button className="mp-finish-btn" onClick={handleClose}>
                Finish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
