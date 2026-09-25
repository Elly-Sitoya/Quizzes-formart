// Turns a flat list of { id, clue, answer } pairs into an actual crossword
// layout: a bounding grid of cells, each either blocked (part of no word) or
// holding a letter, plus every word's row/col/direction/number.
//
// This is intentionally dependency-free (no React, no DOM) so it can be
// unit-tested or reused anywhere - the grid is recomputed any time the
// trainer's word list changes, so the puzzle always reflects what's
// currently in the editor.

const WORKING_GRID_SIZE = 44;

function cleanAnswer(raw) {
  return (raw || '').toUpperCase().replace(/[^A-Z]/g, '');
}

function canPlace(grid, size, word, row, col, direction) {
  const len = word.length;

  for (let i = 0; i < len; i++) {
    const r = direction === 'across' ? row : row + i;
    const c = direction === 'across' ? col + i : col;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;

    const existing = grid[r][c];
    const letter = word[i];
    if (existing !== null && existing !== letter) return false;

    // A brand-new letter here must not touch an unrelated word running
    // perpendicular to this one, or the two would visually merge into a
    // false intersection that was never actually asked for.
    if (existing === null) {
      if (direction === 'across') {
        const above = r > 0 ? grid[r - 1][c] : null;
        const below = r < size - 1 ? grid[r + 1][c] : null;
        if (above !== null || below !== null) return false;
      } else {
        const left = c > 0 ? grid[r][c - 1] : null;
        const right = c < size - 1 ? grid[r][c + 1] : null;
        if (left !== null || right !== null) return false;
      }
    }
  }

  // The cell right before the start and right after the end (in the word's
  // own direction) must be empty too, so this word doesn't run straight
  // into another one end-to-end.
  if (direction === 'across') {
    const before = col - 1;
    const after = col + len;
    if (before >= 0 && grid[row][before] !== null) return false;
    if (after < size && grid[row][after] !== null) return false;
  } else {
    const before = row - 1;
    const after = row + len;
    if (before >= 0 && grid[before][col] !== null) return false;
    if (after < size && grid[after][col] !== null) return false;
  }

  return true;
}

function place(grid, word, row, col, direction) {
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? row : row + i;
    const c = direction === 'across' ? col + i : col;
    grid[r][c] = word[i];
  }
}

export function generateCrossword(rawWords) {
  const prepared = (rawWords || [])
    .map((w) => ({ id: w.id, clue: (w.clue || '').trim(), clean: cleanAnswer(w.answer) }))
    .filter((w) => w.clean.length >= 2 && w.clue.length > 0);

  if (prepared.length === 0) {
    return { rows: 0, cols: 0, cells: [], words: [] };
  }

  const size = WORKING_GRID_SIZE;
  const center = Math.floor(size / 2);
  const grid = Array.from({ length: size }, () => new Array(size).fill(null));

  // Longest words anchor the grid and give shorter words the best chance
  // of finding a shared letter to cross later.
  const sorted = [...prepared].sort((a, b) => b.clean.length - a.clean.length);
  const placements = [];

  const first = sorted[0];
  const firstRow = center;
  const firstCol = center - Math.floor(first.clean.length / 2);
  place(grid, first.clean, firstRow, firstCol, 'across');
  placements.push({
    id: first.id,
    clue: first.clue,
    answer: first.clean,
    row: firstRow,
    col: firstCol,
    direction: 'across',
    length: first.clean.length,
    connected: true,
  });

  const unplaced = [];

  for (let idx = 1; idx < sorted.length; idx++) {
    const word = sorted[idx];
    let best = null;

    for (const placed of placements) {
      for (let pi = 0; pi < placed.length; pi++) {
        const placedChar = placed.answer[pi];
        const placedRow = placed.direction === 'across' ? placed.row : placed.row + pi;
        const placedCol = placed.direction === 'across' ? placed.col + pi : placed.col;

        for (let wi = 0; wi < word.clean.length; wi++) {
          if (word.clean[wi] !== placedChar) continue;

          const newDirection = placed.direction === 'across' ? 'down' : 'across';
          const row = newDirection === 'across' ? placedRow : placedRow - wi;
          const col = newDirection === 'across' ? placedCol - wi : placedCol;

          if (canPlace(grid, size, word.clean, row, col, newDirection)) {
            // Favour placements that stay close to the board's centre, so
            // the puzzle grows in a compact block rather than sprawling.
            const score = -(Math.abs(row - center) + Math.abs(col - center));
            if (!best || score > best.score) {
              best = { row, col, direction: newDirection, score };
            }
          }
        }
      }
    }

    if (best) {
      place(grid, word.clean, best.row, best.col, best.direction);
      placements.push({
        id: word.id,
        clue: word.clue,
        answer: word.clean,
        row: best.row,
        col: best.col,
        direction: best.direction,
        length: word.clean.length,
        connected: true,
      });
    } else {
      unplaced.push(word);
    }
  }

  // A word that shares nothing with the rest of the puzzle still gets a
  // spot of its own, so nothing a trainer typed in ever silently vanishes.
  let overflowRow =
    Math.max(
      ...placements.map((p) => (p.direction === 'across' ? p.row : p.row + p.length - 1))
    ) + 2;

  for (const word of unplaced) {
    const col = Math.max(0, center - Math.floor(word.clean.length / 2));
    while (overflowRow < size && !canPlace(grid, size, word.clean, overflowRow, col, 'across')) {
      overflowRow += 2;
    }
    if (overflowRow >= size) continue;
    place(grid, word.clean, overflowRow, col, 'across');
    placements.push({
      id: word.id,
      clue: word.clue,
      answer: word.clean,
      row: overflowRow,
      col,
      direction: 'across',
      length: word.clean.length,
      connected: false,
    });
    overflowRow += 2;
  }

  // Trim the working grid down to just the cells actually in use.
  let minRow = size;
  let maxRow = 0;
  let minCol = size;
  let maxCol = 0;
  for (const p of placements) {
    const endRow = p.direction === 'across' ? p.row : p.row + p.length - 1;
    const endCol = p.direction === 'across' ? p.col + p.length - 1 : p.col;
    minRow = Math.min(minRow, p.row);
    maxRow = Math.max(maxRow, endRow);
    minCol = Math.min(minCol, p.col);
    maxCol = Math.max(maxCol, endCol);
  }

  const rows = maxRow - minRow + 1;
  const cols = maxCol - minCol + 1;
  const cells = Array.from({ length: rows }, () => new Array(cols).fill(null));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const letter = grid[minRow + r][minCol + c];
      if (letter) cells[r][c] = { letter, number: null };
    }
  }

  // Number every cell that starts an across and/or down entry, the same
  // way a printed crossword does.
  let num = 1;
  const numberMap = new Map();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!cells[r][c]) continue;
      const hasLeft = c > 0 && cells[r][c - 1];
      const hasRight = c < cols - 1 && cells[r][c + 1];
      const hasAbove = r > 0 && cells[r - 1][c];
      const hasBelow = r < rows - 1 && cells[r + 1][c];
      const startsAcross = !hasLeft && hasRight;
      const startsDown = !hasAbove && hasBelow;
      if (startsAcross || startsDown) {
        numberMap.set(`${r},${c}`, num);
        cells[r][c].number = num;
        num++;
      }
    }
  }

  const words = placements
    .map((p) => {
      const row = p.row - minRow;
      const col = p.col - minCol;
      return {
        id: p.id,
        clue: p.clue,
        answer: p.answer,
        direction: p.direction,
        row,
        col,
        length: p.length,
        number: numberMap.get(`${row},${col}`) ?? null,
        connected: p.connected,
      };
    })
    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

  return { rows, cols, cells, words };
}
