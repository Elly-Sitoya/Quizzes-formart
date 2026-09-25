// Trainers write a paragraph as plain text and mark the word(s) that should
// become a blank by wrapping them in double square brackets, e.g.
// "The sky is [[blue]] and the grass is [[green]]."
// This turns that raw text into an ordered list of segments the quiz-taking
// UI can render: plain text runs, and blanks (each with a unique id and the
// correct answer that was wrapped).
export function parseParagraph(raw, paragraphId) {
  const segments = [];
  const regex = /\[\[(.+?)\]\]/g;
  let lastIndex = 0;
  let blankIndex = 0;
  let match;

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: raw.slice(lastIndex, match.index) });
    }
    blankIndex += 1;
    const answer = match[1].trim();
    segments.push({
      type: 'blank',
      blankId: `${paragraphId}-b${blankIndex}`,
      answer,
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < raw.length) {
    segments.push({ type: 'text', value: raw.slice(lastIndex) });
  }

  return segments;
}

// Convenience helper: just the blanks (id + answer) for a paragraph,
// without the surrounding text segments.
export function extractBlanks(raw, paragraphId) {
  return parseParagraph(raw, paragraphId).filter((s) => s.type === 'blank');
}

// Fisher-Yates shuffle, returns a new array.
export function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
