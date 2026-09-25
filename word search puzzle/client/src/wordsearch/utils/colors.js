// One highlight color per word, cycled if there are more words than colors.
// Matches the multi-colored found-word traces in the reference design.
export const WORD_COLORS = [
  '#60a5fa', // blue
  '#4ade80', // green
  '#facc15', // yellow
  '#c084fc', // purple
  '#fb923c', // orange
  '#f87171', // red
  '#2dd4bf', // teal
  '#f472b6', // pink
];

export function colorForIndex(index) {
  if (index < 0) return WORD_COLORS[0];
  return WORD_COLORS[index % WORD_COLORS.length];
}
