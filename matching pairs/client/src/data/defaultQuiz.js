// The seed quiz used the very first time the app runs, before a trainer
// has created anything of their own. Left items are the prompts; each one
// has exactly one correct right-hand match. Note: "Technical debt" paired
// with "Tests of smallest units" is just a leftover placeholder pairing
// for demo purposes (the other five pairs are proper definitions) -
// a trainer can freely rename or repair any pair from the editor.
const defaultQuiz = {
  id: 'default-quiz',
  title: 'Software Engineering Terms',
  timerEnabled: true,
  timerSeconds: 90,
  pairs: [
    { id: 'pair-1', left: 'Technical debt', right: 'Tests of smallest units' },
    { id: 'pair-2', left: 'Version control', right: 'Git repository' },
    { id: 'pair-3', left: 'Continuous integration', right: 'Automated builds' },
    { id: 'pair-4', left: 'Object-oriented programming', right: 'Encapsulation and inheritance' },
    { id: 'pair-5', left: 'Code refactoring', right: 'Improve structure without changing behavior' },
    { id: 'pair-6', left: 'Design pattern', right: 'Reusable solution to a problem' },
  ],
};

export default defaultQuiz;
