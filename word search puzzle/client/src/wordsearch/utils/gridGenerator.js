// Builds a word search grid: places every word in a straight line (one of
// 8 directions) somewhere in the grid, letting words cross if their
// letters agree, then fills every remaining cell with a random letter.

const DIRECTIONS = [
  { dr: 0, dc: 1 }, // East
  { dr: 0, dc: -1 }, // West
  { dr: 1, dc: 0 }, // South
  { dr: -1, dc: 0 }, // North
  { dr: 1, dc: 1 }, // South-east
  { dr: -1, dc: -1 }, // North-west
  { dr: 1, dc: -1 }, // South-west
  { dr: -1, dc: 1 }, // North-east
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MIN_GRID_SIZE = 10;
const MAX_GROW_ATTEMPTS = 6;
const MAX_PLACEMENT_TRIES_PER_WORD = 250;

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function randomLetter() {
  return ALPHABET[randomInt(ALPHABET.length)];
}

function fitsAt(grid, word, row, col, dir, rows, cols) {
  const cells = [];
  for (let i = 0; i < word.length; i += 1) {
    const r = row + dir.dr * i;
    const c = col + dir.dc * i;
    if (r < 0 || r >= rows || c < 0 || c >= cols) return null;
    const existing = grid[r][c];
    if (existing && existing !== word[i]) return null;
    cells.push({ row: r, col: c });
  }
  return cells;
}

function attemptPlacement(words, rows, cols, forceFit) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  const placements = {};
  // Longest words first - easier to pack a big grid that way.
  const ordered = [...words].sort((a, b) => b.length - a.length);

  for (const word of ordered) {
    let placed = false;
    for (let tries = 0; tries < MAX_PLACEMENT_TRIES_PER_WORD && !placed; tries += 1) {
      const dir = DIRECTIONS[randomInt(DIRECTIONS.length)];
      const row = randomInt(rows);
      const col = randomInt(cols);
      const cells = fitsAt(grid, word, row, col, dir, rows, cols);
      if (cells) {
        cells.forEach((cell, i) => {
          grid[cell.row][cell.col] = word[i];
        });
        placements[word] = { cells, direction: dir };
        placed = true;
      }
    }
    if (!placed && !forceFit) return null;
  }

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (!grid[r][c]) grid[r][c] = randomLetter();
    }
  }

  return { grid, placements, size: { rows, cols } };
}

// words: array of strings (already trainer-entered target words)
export function generatePuzzleGrid(words) {
  const cleanWords = (words || []).map((w) => w.trim().toUpperCase()).filter(Boolean);
  const longest = cleanWords.reduce((max, w) => Math.max(max, w.length), 0);
  let rows = Math.max(longest, MIN_GRID_SIZE);
  let cols = rows;

  for (let attempt = 0; attempt < MAX_GROW_ATTEMPTS; attempt += 1) {
    const result = attemptPlacement(cleanWords, rows, cols, false);
    if (result) return result;
    rows += 2;
    cols += 2;
  }

  // Last resort: force-fit, dropping any word that truly cannot fit
  // (only realistic with an unusually long word list).
  return attemptPlacement(cleanWords, rows, cols, true);
}
