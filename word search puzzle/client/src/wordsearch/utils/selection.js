// Turns a drag from one grid cell to another into the straight line of
// cells between them - horizontal, vertical, or an exact diagonal only.
// Anything else (a bent/invalid drag) returns null so the caller can just
// ignore that pointer-move and keep the last valid line.
export function getLinePath(start, end) {
  const dr = end.row - start.row;
  const dc = end.col - start.col;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));

  if (steps === 0) return [start];

  const isStraightLine = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
  if (!isStraightLine) return null;

  const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

  const path = [];
  for (let i = 0; i <= steps; i += 1) {
    path.push({ row: start.row + stepR * i, col: start.col + stepC * i });
  }
  return path;
}

export function cellsToWord(grid, cells) {
  return cells.map((cell) => grid[cell.row][cell.col]).join('');
}
