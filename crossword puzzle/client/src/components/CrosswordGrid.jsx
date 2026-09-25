import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import './CrosswordGrid.css';

// Builds a lookup so any cell can answer "which word(s) pass through me,
// and in which direction". A cell has two entries only where an across and
// a down word cross.
function buildWordsAtCell(words) {
  const map = new Map();
  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const r = word.direction === 'across' ? word.row : word.row + i;
      const c = word.direction === 'across' ? word.col + i : word.col;
      const key = `${r},${c}`;
      const list = map.get(key) || [];
      list.push({ wordId: word.id, direction: word.direction });
      map.set(key, list);
    }
  }
  return map;
}

function pickWord(candidates, currentActiveId) {
  if (candidates.length === 1) return candidates[0].wordId;
  if (currentActiveId && candidates.some((w) => w.wordId === currentActiveId)) {
    return currentActiveId;
  }
  const across = candidates.find((w) => w.direction === 'across');
  return across ? across.wordId : candidates[0].wordId;
}

// Renders the crossword itself and, in "solve" mode, owns every bit of the
// letter-by-letter typing interaction: focus movement, per-word marking the
// instant a word is filled in, and locking a word's cells once it's right.
// In "key" mode it's a plain read-only rendering used for the trainer's
// live preview while building a puzzle.
const CrosswordGrid = forwardRef(function CrosswordGrid(
  { layout, mode = 'solve', activeWordId, onActiveWordChange, onWordStatusChange },
  ref
) {
  const [entries, setEntries] = useState({});
  const [correctWordIds, setCorrectWordIds] = useState(() => new Set());
  const [flashWordId, setFlashWordId] = useState(null); // transient "wrong" shake
  const [focusedCell, setFocusedCell] = useState(null);
  const inputRefs = useRef({});
  const flashTimeoutRef = useRef(null);

  const wordsAtCell = useMemo(() => buildWordsAtCell(layout.words), [layout]);
  const wordsById = useMemo(() => {
    const map = new Map();
    for (const word of layout.words) map.set(word.id, word);
    return map;
  }, [layout]);

  // A fresh puzzle (new quiz opened, or the word list changed) starts clean.
  useEffect(() => {
    setEntries({});
    setCorrectWordIds(new Set());
    setFlashWordId(null);
    setFocusedCell(null);
    inputRefs.current = {};
  }, [layout]);

  const isCellLocked = (r, c) => {
    const candidates = wordsAtCell.get(`${r},${c}`) || [];
    return candidates.some((w) => correctWordIds.has(w.wordId));
  };

  const focusCellInput = (r, c) => {
    const el = inputRefs.current[`${r},${c}`];
    if (el) el.focus();
  };

  // Keep the visible focus in sync whenever the parent changes the active
  // word from outside (e.g. the learner clicked a clue in the side panel).
  useEffect(() => {
    if (mode !== 'solve' || !activeWordId) return;
    const word = wordsById.get(activeWordId);
    if (!word) return;
    const alreadyOnWord =
      focusedCell &&
      (wordsAtCell.get(`${focusedCell.r},${focusedCell.c}`) || []).some(
        (w) => w.wordId === activeWordId
      );
    if (alreadyOnWord) return;
    setFocusedCell({ r: word.row, c: word.col });
    focusCellInput(word.row, word.col);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWordId, mode]);

  const checkWordsAtCell = (r, c, snapshot) => {
    const candidates = wordsAtCell.get(`${r},${c}`) || [];
    for (const { wordId } of candidates) {
      const word = wordsById.get(wordId);
      if (!word || correctWordIds.has(wordId)) continue;

      let filled = '';
      for (let i = 0; i < word.length; i++) {
        const wr = word.direction === 'across' ? word.row : word.row + i;
        const wc = word.direction === 'across' ? word.col + i : word.col;
        const val = snapshot[`${wr},${wc}`];
        if (!val) {
          filled = null;
          break;
        }
        filled += val;
      }
      if (filled === null) continue;

      if (filled === word.answer) {
        setCorrectWordIds((prev) => new Set(prev).add(wordId));
        onWordStatusChange?.(word, 'correct');
      } else {
        setFlashWordId(wordId);
        clearTimeout(flashTimeoutRef.current);
        flashTimeoutRef.current = setTimeout(() => setFlashWordId(null), 500);
        onWordStatusChange?.(word, 'wrong');
      }
    }
  };

  const moveToNextCell = (word, index, dir = 1) => {
    const nextIndex = index + dir;
    if (nextIndex < 0 || nextIndex >= word.length) return false;
    const r = word.direction === 'across' ? word.row : word.row + nextIndex;
    const c = word.direction === 'across' ? word.col + nextIndex : word.col;
    setFocusedCell({ r, c });
    focusCellInput(r, c);
    return true;
  };

  const handleSelectCell = (r, c) => {
    const key = `${r},${c}`;
    const candidates = wordsAtCell.get(key) || [];
    if (candidates.length === 0) return;

    let nextWordId;
    if (focusedCell && focusedCell.r === r && focusedCell.c === c && candidates.length > 1) {
      const currentIdx = candidates.findIndex((w) => w.wordId === activeWordId);
      nextWordId = candidates[(currentIdx + 1) % candidates.length].wordId;
    } else {
      nextWordId = pickWord(candidates, activeWordId);
    }
    setFocusedCell({ r, c });
    onActiveWordChange?.(nextWordId);
    focusCellInput(r, c);
  };

  const handleChange = (r, c, rawValue) => {
    if (isCellLocked(r, c)) return;
    const letter = rawValue.slice(-1).toUpperCase().replace(/[^A-Z]/, '');
    const key = `${r},${c}`;
    const next = { ...entries };
    if (letter) next[key] = letter;
    else delete next[key];
    setEntries(next);

    if (letter) {
      checkWordsAtCell(r, c, next);
      const word = activeWordId ? wordsById.get(activeWordId) : null;
      if (word) {
        const index = word.direction === 'across' ? c - word.col : r - word.row;
        moveToNextCell(word, index, 1);
      }
    }
  };

  const handleKeyDown = (r, c, e) => {
    const key = `${r},${c}`;
    const word = activeWordId ? wordsById.get(activeWordId) : null;

    if (e.key === 'Backspace') {
      if (isCellLocked(r, c)) return;
      if (entries[key]) {
        const next = { ...entries };
        delete next[key];
        setEntries(next);
        return;
      }
      if (word) {
        const index = word.direction === 'across' ? c - word.col : r - word.row;
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          const pr = word.direction === 'across' ? word.row : word.row + prevIndex;
          const pc = word.direction === 'across' ? word.col + prevIndex : word.col;
          if (!isCellLocked(pr, pc)) {
            const next = { ...entries };
            delete next[`${pr},${pc}`];
            setEntries(next);
          }
          setFocusedCell({ r: pr, c: pc });
          focusCellInput(pr, pc);
        }
      }
      return;
    }

    const arrowMap = {
      ArrowRight: { dr: 0, dc: 1 },
      ArrowLeft: { dr: 0, dc: -1 },
      ArrowUp: { dr: -1, dc: 0 },
      ArrowDown: { dr: 1, dc: 0 },
    };
    if (arrowMap[e.key]) {
      e.preventDefault();
      const { dr, dc } = arrowMap[e.key];
      const nr = r + dr;
      const nc = c + dc;
      const candidates = wordsAtCell.get(`${nr},${nc}`) || [];
      if (candidates.length === 0) return;
      const preferredDir = dr !== 0 ? 'down' : 'across';
      const match = candidates.find((w) => w.direction === preferredDir) || candidates[0];
      setFocusedCell({ r: nr, c: nc });
      onActiveWordChange?.(match.wordId);
      focusCellInput(nr, nc);
    }
  };

  // Lets the parent (the quiz modal, for its hint button) reveal the
  // correct letter in whichever cell currently has focus.
  useImperativeHandle(ref, () => ({
    revealFocusedCell: () => {
      if (mode !== 'solve' || !focusedCell) return;
      const { r, c } = focusedCell;
      if (isCellLocked(r, c)) return;
      const cell = layout.cells[r]?.[c];
      if (!cell) return;
      const key = `${r},${c}`;
      const next = { ...entries, [key]: cell.letter };
      setEntries(next);
      checkWordsAtCell(r, c, next);
    },
  }));

  if (layout.rows === 0) {
    return (
      <div className="cw-grid-empty">
        <p>No words yet - add clues and answers to see the puzzle take shape.</p>
      </div>
    );
  }

  return (
    <div className="cw-grid" style={{ '--cw-rows': layout.rows, '--cw-cols': layout.cols }}>
      {layout.cells.map((row, r) =>
        row.map((cell, c) => {
          if (!cell) {
            return <div key={`${r}-${c}`} className="cw-cell cw-cell-blocked" />;
          }

          const key = `${r},${c}`;
          const candidates = wordsAtCell.get(key) || [];
          const isActive = candidates.some((w) => w.wordId === activeWordId);
          const isFocused = focusedCell && focusedCell.r === r && focusedCell.c === c;
          const isCorrect = candidates.some((w) => correctWordIds.has(w.wordId));
          const isFlashing = candidates.some((w) => w.wordId === flashWordId);

          if (mode === 'key') {
            return (
              <div key={key} className="cw-cell cw-cell-key">
                {cell.number && <span className="cw-cell-number">{cell.number}</span>}
                <span className="cw-cell-key-letter">{cell.letter}</span>
              </div>
            );
          }

          return (
            <div
              key={key}
              className={`cw-cell cw-cell-input-wrap ${isActive ? 'active-word' : ''} ${
                isFocused ? 'focused' : ''
              } ${isCorrect ? 'correct' : ''} ${isFlashing ? 'wrong-shake' : ''}`}
            >
              {cell.number && <span className="cw-cell-number">{cell.number}</span>}
              <input
                ref={(el) => {
                  if (el) inputRefs.current[key] = el;
                }}
                className="cw-cell-input"
                value={entries[key] || ''}
                maxLength={1}
                disabled={isCorrect}
                autoComplete="off"
                inputMode="text"
                aria-label={`Row ${r + 1}, column ${c + 1}`}
                onFocus={() => handleSelectCell(r, c)}
                onClick={() => handleSelectCell(r, c)}
                onChange={(e) => handleChange(r, c, e.target.value)}
                onKeyDown={(e) => handleKeyDown(r, c, e)}
              />
              {isCorrect && <span className="cw-cell-check">✔</span>}
            </div>
          );
        })
      )}
    </div>
  );
});

export default CrosswordGrid;
