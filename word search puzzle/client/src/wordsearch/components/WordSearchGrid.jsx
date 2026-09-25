import { useEffect, useMemo, useRef, useState } from 'react';
import { generatePuzzleGrid } from '../utils/gridGenerator.js';
import { getLinePath, cellsToWord } from '../utils/selection.js';
import { colorForIndex } from '../utils/colors.js';
import './WordSearchGrid.css';

const DEFAULT_CELL_SIZE = 32;
const MIN_CELL_SIZE = 18;
const MAX_CELL_SIZE = 42;
const FRAME_CHROME = 28; // must track .ws-grid-frame-inner's border + padding (both sides combined)

// words: the target words for the current screen only.
// onWordFound(word): called once per newly-found word.
// onAllFound(): called once every word on this screen has been found.
// interactive: false once the attempt has ended - dragging is disabled but
// the board (and any revealed answers) stays visible and readable.
// revealWords: words from this screen the learner didn't find, traced on
// the board once the attempt is over and the reveal toggle is switched on.
export default function WordSearchGrid({
  words,
  onWordFound,
  onAllFound,
  interactive = true,
  revealWords = [],
}) {
  const { grid, size, placements } = useMemo(() => generatePuzzleGrid(words), [words]);

  const [foundMap, setFoundMap] = useState({}); // word -> { start, end, color }
  const [selection, setSelection] = useState(null); // { start, cells }
  const [wrongPath, setWrongPath] = useState(null); // cells of a just-failed attempt
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const frameRef = useRef(null);
  const gridRef = useRef(null);
  const wrongTimeoutRef = useRef(null);

  // Measure the space actually available for the board so the grid can be
  // sized to fit inside it exactly, instead of relying on scrolling.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(wrongTimeoutRef.current), []);

  const cellSize = useMemo(() => {
    const availW = containerSize.width - FRAME_CHROME;
    const availH = containerSize.height - FRAME_CHROME;
    if (availW <= 0 || availH <= 0) return DEFAULT_CELL_SIZE;
    const raw = Math.floor(Math.min(availW / size.cols, availH / size.rows));
    if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_CELL_SIZE;
    return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, raw));
  }, [containerSize, size]);

  function cellFromPoint(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY);
    const cellEl = el?.closest?.('[data-row]');
    if (!cellEl || !gridRef.current?.contains(cellEl)) return null;
    return { row: Number(cellEl.dataset.row), col: Number(cellEl.dataset.col) };
  }

  function handlePointerDown(e) {
    if (!interactive) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    e.preventDefault();
    try {
      gridRef.current.setPointerCapture(e.pointerId);
    } catch {
      // Capture can harmlessly fail if it was already released elsewhere.
    }
    setWrongPath(null);
    setSelection({ start: cell, cells: [cell] });
  }

  function handlePointerMove(e) {
    if (!interactive || !selection) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    const path = getLinePath(selection.start, cell);
    if (!path) return; // not a straight line yet - keep the last valid one
    setSelection((prev) => ({ ...prev, cells: path }));
  }

  function finishSelection() {
    if (!interactive || !selection) return;
    if (selection.cells.length > 1) {
      const word = cellsToWord(grid, selection.cells);
      const reversed = word.split('').reverse().join('');
      const match = words.find((w) => !foundMap[w] && (w === word || w === reversed));
      if (match) {
        const first = selection.cells[0];
        const last = selection.cells[selection.cells.length - 1];
        const color = colorForIndex(words.indexOf(match));
        const nextFound = { ...foundMap, [match]: { start: first, end: last, color } };
        setFoundMap(nextFound);
        setSelection(null);
        onWordFound?.(match);
        if (Object.keys(nextFound).length === words.length) {
          onAllFound?.();
        }
        return;
      }
      // A full line was dragged but it isn't one of the target words -
      // flash it red instead of just silently dropping the selection.
      const failedCells = selection.cells;
      setSelection(null);
      setWrongPath(failedCells);
      window.clearTimeout(wrongTimeoutRef.current);
      wrongTimeoutRef.current = window.setTimeout(() => setWrongPath(null), 420);
      return;
    }
    setSelection(null);
  }

  const selectedKeys = useMemo(() => {
    if (!selection) return new Set();
    return new Set(selection.cells.map((c) => `${c.row}-${c.col}`));
  }, [selection]);

  const missedPaths = useMemo(
    () =>
      revealWords
        .map((word) => {
          const placement = placements[word];
          if (!placement) return null;
          const cells = placement.cells;
          return { word, start: cells[0], end: cells[cells.length - 1] };
        })
        .filter(Boolean),
    [revealWords, placements]
  );

  const width = size.cols * cellSize;
  const height = size.rows * cellSize;

  function centerOf(cell) {
    return { x: cell.col * cellSize + cellSize / 2, y: cell.row * cellSize + cellSize / 2 };
  }

  return (
    <div className="ws-grid-frame" ref={frameRef}>
      <div className="ws-grid-frame-inner">
        <div
          className={`ws-grid ${wrongPath ? 'shake' : ''}`}
          ref={gridRef}
          style={{ width, height, gridTemplateColumns: `repeat(${size.cols}, ${cellSize}px)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishSelection}
          onPointerCancel={finishSelection}
        >
          {grid.map((row, r) =>
            row.map((letter, c) => {
              const key = `${r}-${c}`;
              const inPath = selectedKeys.has(key);
              return (
                <div
                  key={key}
                  data-row={r}
                  data-col={c}
                  className={`ws-cell ${inPath ? 'in-path' : ''}`}
                  style={{ width: cellSize, height: cellSize, fontSize: Math.max(11, cellSize * 0.45) }}
                >
                  {letter}
                </div>
              );
            })
          )}

          <svg
            className="ws-found-overlay"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
          >
            {missedPaths.map(({ word, start, end }) => {
              const p1 = centerOf(start);
              const p2 = centerOf(end);
              return (
                <line
                  key={`missed-${word}`}
                  className="ws-missed-line"
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  strokeWidth={cellSize * 0.72}
                  strokeLinecap="round"
                />
              );
            })}

            {Object.entries(foundMap).map(([word, path]) => {
              const p1 = centerOf(path.start);
              const p2 = centerOf(path.end);
              return (
                <line
                  key={word}
                  className="ws-found-line"
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={path.color}
                  strokeWidth={cellSize * 0.72}
                  strokeLinecap="round"
                  opacity={0.6}
                />
              );
            })}

            {wrongPath && wrongPath.length > 1 && (
              <line
                className="ws-wrong-line"
                x1={centerOf(wrongPath[0]).x}
                y1={centerOf(wrongPath[0]).y}
                x2={centerOf(wrongPath[wrongPath.length - 1]).x}
                y2={centerOf(wrongPath[wrongPath.length - 1]).y}
                strokeWidth={cellSize * 0.8}
                strokeLinecap="round"
              />
            )}

            {selection && (
              <>
                <line
                  className="ws-selecting-outline"
                  x1={centerOf(selection.cells[0]).x}
                  y1={centerOf(selection.cells[0]).y}
                  x2={centerOf(selection.cells[selection.cells.length - 1]).x}
                  y2={centerOf(selection.cells[selection.cells.length - 1]).y}
                  strokeWidth={cellSize * 0.86}
                  strokeLinecap="round"
                />
                <line
                  className="ws-selecting-fill"
                  x1={centerOf(selection.cells[0]).x}
                  y1={centerOf(selection.cells[0]).y}
                  x2={centerOf(selection.cells[selection.cells.length - 1]).x}
                  y2={centerOf(selection.cells[selection.cells.length - 1]).y}
                  strokeWidth={cellSize * 0.68}
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
