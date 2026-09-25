// Seed puzzle used the first time the app runs, before a trainer has set
// up anything of their own.
const defaultPuzzle = {
  id: 'default-puzzle',
  title: 'Tech Vocabulary Word Search',
  timerSeconds: 360,
  wordsPerScreen: 8,
  words: [
    'ALGORITHM',
    'DEBUGGING',
    'ARCHITECTURE',
    'REPOSITORY',
    'FRAMEWORK',
    'INTERFACE',
    'COMPILER',
    'TESTING',
  ],
};

export default defaultPuzzle;
