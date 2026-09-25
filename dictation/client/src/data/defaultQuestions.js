// The seed quiz used the very first time the app runs, before a trainer has
// created anything of their own. Each question already matches the shape a
// trainer-created question uses: a sentence (the answer key), an audioMode
// describing how it's voiced, and audioData holding a recorded/uploaded clip
// when applicable (null here, since these are read aloud by the browser).
const defaultQuestions = [
  {
    id: 'default-q1',
    text: 'The quick brown fox jumps over the lazy dog.',
    audioMode: 'tts',
    audioData: null,
  },
  {
    id: 'default-q2',
    text: 'She sells seashells by the seashore.',
    audioMode: 'tts',
    audioData: null,
  },
  {
    id: 'default-q3',
    text: 'Practice makes perfect every single day.',
    audioMode: 'tts',
    audioData: null,
  },
  {
    id: 'default-q4',
    text: 'Learning new words builds a stronger vocabulary.',
    audioMode: 'tts',
    audioData: null,
  },
  {
    id: 'default-q5',
    text: 'Honesty is always the best policy.',
    audioMode: 'tts',
    audioData: null,
  },
];

export default defaultQuestions;
