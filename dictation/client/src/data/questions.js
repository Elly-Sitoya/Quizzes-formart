// Each dictation question is a pairing of an audio source and the exact
// text a learner should type after listening.
//
// - If "audioUrl" is set (e.g. "/audio/sentence-1.mp3"), the player uses
//   that real audio file.
// - If "audioUrl" is null, the player falls back to the browser's built-in
//   speech synthesis, reading "text" aloud. This means the quiz works out
//   of the box with no audio assets, and can be upgraded to real narrated
//   clips later just by filling in audioUrl.
const questions = [
  {
    id: 1,
    audioUrl: null,
    text: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    id: 2,
    audioUrl: null,
    text: 'She sells seashells by the seashore.',
  },
  {
    id: 3,
    audioUrl: null,
    text: 'Practice makes perfect every single day.',
  },
  {
    id: 4,
    audioUrl: null,
    text: 'Learning new words builds a stronger vocabulary.',
  },
  {
    id: 5,
    audioUrl: null,
    text: 'Honesty is always the best policy.',
  },
];

export default questions;
