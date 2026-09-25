// Fisher-Yates shuffle, returns a new array without touching the original.
export function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Shuffles a word's letters into tile objects ({ id, char }) and guarantees
// the scrambled order isn't identical to the solved order (a 1-letter or
// all-identical-letter word is the only case that can't avoid it, and
// that's fine - there's nothing to scramble there anyway).
export function scrambleLetters(word) {
  const letters = word.split('').map((char, i) => ({ id: `t-${i}-${char}-${Math.random().toString(16).slice(2)}`, char }));
  if (letters.length <= 1) return letters;

  let attempt = shuffle(letters);
  let tries = 0;
  const solvedOrder = letters.map((l) => l.char).join('');
  while (attempt.map((l) => l.char).join('') === solvedOrder && tries < 10) {
    attempt = shuffle(letters);
    tries += 1;
  }
  return attempt;
}
