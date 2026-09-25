// Global behavior for the Word Scramble Puzzle question type, as opposed to
// the content (quizzes/words) a trainer writes. Configured from the gear
// icon in the trainer's quiz-type builder and applied to every word-scramble
// quiz a learner attempts.
const defaultSettings = {
  // How long a learner gets on each word before it's marked as timed out.
  secondsPerWord: 45,
  // Whether learners can request a hint while stuck on a word.
  hintsAllowed: true,
  // Whether the puzzle cares about uppercase vs lowercase when checking an
  // arrangement against the answer. Off means tiles always display and
  // compare as uppercase, regardless of how the trainer typed the answer.
  caseSensitive: false,
};

export default defaultSettings;
