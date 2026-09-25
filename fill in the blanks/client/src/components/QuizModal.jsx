import { useEffect, useMemo, useRef, useState } from 'react';
import { parseParagraph, shuffle } from '../utils/parseParagraph.js';
import './QuizModal.css';

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function normalize(text) {
  return text.trim().toLowerCase();
}

export default function QuizModal({ quiz, onClose }) {
  // --- static quiz shape (paragraphs -> segments, and every blank) ---
  const paragraphsData = useMemo(
    () => quiz.paragraphs.map((p) => ({ id: p.id, segments: parseParagraph(p.raw, p.id) })),
    [quiz]
  );
  const allBlanks = useMemo(
    () => paragraphsData.flatMap((p) => p.segments.filter((s) => s.type === 'blank')),
    [paragraphsData]
  );
  const [tiles] = useState(() =>
    shuffle(allBlanks.map((b, i) => ({ tileId: `tile-${i}`, text: b.answer })))
  );
  const tilesById = useMemo(
    () => Object.fromEntries(tiles.map((t) => [t.tileId, t])),
    [tiles]
  );

  // --- attempt state ---
  const [placements, setPlacements] = useState({}); // blankId -> tileId
  const [selectedBlankId, setSelectedBlankId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState({}); // blankId -> boolean
  const [revealAnswers, setRevealAnswers] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.timerSeconds);
  const [timerRunning, setTimerRunning] = useState(true);
  const [closing, setClosing] = useState(false);

  // --- drag state ---
  const [dragging, setDragging] = useState(null); // { tileId, text, source }
  const [hoverBlankId, setHoverBlankId] = useState(null);
  const [hoverBank, setHoverBank] = useState(false);
  const [bounceTokens, setBounceTokens] = useState({});

  const blankRefs = useRef({});
  const bankRef = useRef(null);
  const ghostRef = useRef(null);
  const pointerOffsetRef = useRef({ x: 0, y: 0 });
  const dragStartClientRef = useRef({ x: 0, y: 0 });
  const dragMovedRef = useRef(false);

  const usedTileIds = useMemo(() => new Set(Object.values(placements)), [placements]);

  // ---------- timer ----------
  useEffect(() => {
    if (!timerRunning) return undefined;
    const id = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Reset body cursor/selection if the modal unmounts mid-drag.
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  // ---------- placing / swapping ----------
  function placeTile(tileId, source, targetBlankId) {
    setPlacements((prev) => {
      if (source === targetBlankId) return prev;
      const next = { ...prev };
      const existing = next[targetBlankId] ?? null;
      next[targetBlankId] = tileId;
      if (source !== 'bank') {
        if (existing) {
          next[source] = existing;
        } else {
          delete next[source];
        }
      }
      return next;
    });
    triggerBounce(targetBlankId);
  }

  function removeFromBlank(sourceBlankId) {
    setPlacements((prev) => {
      const next = { ...prev };
      delete next[sourceBlankId];
      return next;
    });
  }

  function triggerBounce(blankId) {
    setBounceTokens((prev) => ({ ...prev, [blankId]: (prev[blankId] || 0) + 1 }));
  }

  // ---------- custom pointer-based drag ----------
  function positionGhost(clientX, clientY) {
    const el = ghostRef.current;
    if (!el) return;
    const { x: offX, y: offY } = pointerOffsetRef.current;
    el.style.left = `${clientX - offX}px`;
    el.style.top = `${clientY - offY}px`;
  }

  useEffect(() => {
    if (dragging) positionGhost(dragStartClientRef.current.x, dragStartClientRef.current.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  function handlePointerDown(e, tileId, text, source) {
    if (submitted) return;
    e.preventDefault();
    dragMovedRef.current = false;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    dragStartClientRef.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = 'pointer';
    document.body.style.userSelect = 'none';
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture can fail in rare cases (e.g. already released) -
      // dragging still works via the window-level move/up we don't need,
      // since this element keeps the events either way in modern browsers.
    }
    setDragging({ tileId, text, source });
    setHoverBlankId(null);
    setHoverBank(false);
  }

  function handlePointerMove(e) {
    if (!dragging) return;
    dragMovedRef.current = true;
    positionGhost(e.clientX, e.clientY);

    let found = null;
    for (const blankId in blankRefs.current) {
      const node = blankRefs.current[blankId];
      if (!node) continue;
      const r = node.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        found = blankId;
        break;
      }
    }
    setHoverBlankId((prev) => (prev === found ? prev : found));

    if (bankRef.current) {
      const br = bankRef.current.getBoundingClientRect();
      const overBank =
        e.clientX >= br.left && e.clientX <= br.right && e.clientY >= br.top && e.clientY <= br.bottom;
      setHoverBank((prev) => (prev === overBank ? prev : overBank));
    }
  }

  function handlePointerUp() {
    if (!dragging) return;
    const { tileId, source } = dragging;
    if (hoverBlankId) {
      placeTile(tileId, source, hoverBlankId);
    } else if (hoverBank && source !== 'bank') {
      removeFromBlank(source);
    }
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    setDragging(null);
    setHoverBlankId(null);
    setHoverBank(false);
  }

  // ---------- tap-to-place ----------
  function handleBlankClick(blankId) {
    if (submitted) return;
    setSelectedBlankId((prev) => (prev === blankId ? null : blankId));
  }

  function handleBankTileClick(tileId) {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }
    if (submitted || !selectedBlankId) return;
    placeTile(tileId, 'bank', selectedBlankId);
    setSelectedBlankId(null);
  }

  // ---------- submit / grading ----------
  function handleSubmit() {
    if (submitted) return;
    const res = {};
    allBlanks.forEach((b) => {
      const tileId = placements[b.blankId];
      const tile = tileId ? tilesById[tileId] : null;
      res[b.blankId] = !!tile && normalize(tile.text) === normalize(b.answer);
    });
    setResults(res);
    setSubmitted(true);
    setTimerRunning(false);
    setSelectedBlankId(null);
  }

  const score = Object.values(results).filter(Boolean).length;

  function handleClose() {
    setClosing(true);
    setTimeout(onClose, 200);
  }

  return (
    <div className={`fitb-overlay ${closing ? 'closing' : ''}`}>
      <div className={`fitb-modal ${closing ? 'closing' : ''}`}>
        <div className="fitb-header">
          <h2 className="fitb-title">{quiz.title}</h2>
          <div className="fitb-timer" title="Time remaining">
            {formatTime(timeLeft)}
          </div>
          <button className="fitb-close-btn" onClick={handleClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="fitb-body">
          <div className="fitb-main-section">
            <div className="fitb-paragraph-scroll">
              {paragraphsData.map((paragraph) => (
                <p className="fitb-paragraph" key={paragraph.id}>
                  {paragraph.segments.map((seg, idx) => {
                    if (seg.type === 'text') {
                      return <span key={idx}>{seg.value}</span>;
                    }
                    const placedTileId = placements[seg.blankId];
                    const isDraggingThisAway = dragging && dragging.source === seg.blankId;
                    const placedTile = placedTileId ? tilesById[placedTileId] : null;
                    const isVisiblyFilled = !!placedTile && !isDraggingThisAway;
                    const isCorrect = submitted ? results[seg.blankId] : null;

                    const blankClassNames = ['fitb-blank'];
                    if (selectedBlankId === seg.blankId) blankClassNames.push('selected');
                    if (hoverBlankId === seg.blankId) blankClassNames.push('drag-hover');
                    if (submitted) blankClassNames.push(isCorrect ? 'correct' : 'wrong');

                    const bounceToken = bounceTokens[seg.blankId] || 0;
                    const wordClassNames = ['fitb-placed-word'];
                    if (isDraggingThisAway) wordClassNames.push('dragging-away');
                    if (bounceToken) wordClassNames.push('landing');

                    // Blank width is the slot size (the answer). A longer placed
                    // word may need a little extra room, but the box never animates.
                    const slotCh = Math.max(seg.answer.length + 2, 4);
                    const wordCh = isVisiblyFilled ? placedTile.text.length + 2 : 0;
                    const blankWidth = `${Math.max(slotCh, wordCh)}ch`;

                    return (
                      <span
                        key={seg.blankId}
                        ref={(el) => {
                          blankRefs.current[seg.blankId] = el;
                        }}
                        className={blankClassNames.join(' ')}
                        style={{ width: blankWidth }}
                        onClick={() => handleBlankClick(seg.blankId)}
                      >
                        <span className="fitb-blank-slot">
                          {placedTile && (
                            <span
                              key={`${placedTile.tileId}-${bounceToken}`}
                              className={wordClassNames.join(' ')}
                              onPointerDown={(e) =>
                                handlePointerDown(e, placedTile.tileId, placedTile.text, seg.blankId)
                              }
                              onPointerMove={handlePointerMove}
                              onPointerUp={handlePointerUp}
                            >
                              {placedTile.text}
                            </span>
                          )}
                        </span>
                        {submitted && isCorrect && <span className="check-mark">✔</span>}
                        {submitted && !isCorrect && <span className="x-mark">✕</span>}
                        {submitted && !isCorrect && revealAnswers && (
                          <span className="reveal-correct-label">{seg.answer}</span>
                        )}
                      </span>
                    );
                  })}
                </p>
              ))}
            </div>

            {!submitted ? (
              <button className="fitb-submit-btn" onClick={handleSubmit}>
                Submit
              </button>
            ) : (
              <div className="fitb-post-submit-row">
                <span className="fitb-score">
                  {score} / {allBlanks.length} correct
                </span>
                <button
                  className="fitb-reveal-btn"
                  onClick={() => setRevealAnswers((v) => !v)}
                >
                  {revealAnswers ? 'Hide Answer' : 'Reveal Answer'}
                </button>
                <button className="fitb-finish-btn" onClick={handleClose}>
                  Finish Quiz
                </button>
              </div>
            )}
          </div>

          <div className="fitb-bank-section" ref={bankRef}>
            {tiles.map((tile) => {
              const isUsed =
                usedTileIds.has(tile.tileId) ||
                (dragging && dragging.source === 'bank' && dragging.tileId === tile.tileId);
              return (
                <span
                  key={tile.tileId}
                  className={`fitb-tile ${isUsed ? 'used' : ''}`}
                  onPointerDown={(e) => !isUsed && handlePointerDown(e, tile.tileId, tile.text, 'bank')}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onClick={() => !isUsed && handleBankTileClick(tile.tileId)}
                >
                  {tile.text}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {dragging && (
        <div ref={ghostRef} className="fitb-drag-ghost">
          {dragging.text}
        </div>
      )}
    </div>
  );
}
