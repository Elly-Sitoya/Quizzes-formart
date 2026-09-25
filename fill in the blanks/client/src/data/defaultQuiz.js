// The seed quiz used the very first time the app runs, before a trainer has
// created anything of their own. Each paragraph is raw text where the
// correct answers are wrapped in [[double square brackets]] - see
// utils/parseParagraph.js for how that gets turned into blanks + a bank.
const defaultQuiz = {
  id: 'default-quiz',
  title: 'Sample Fill in the Blanks Quiz',
  timerSeconds: 120,
  paragraphs: [
    {
      id: 'p1',
      raw: 'The sun rises in the [[east]] and sets in the [[west]]. Water freezes into [[ice]] when it gets cold enough.',
    },
    {
      id: 'p2',
      raw: 'A group of lions is called a [[pride]], while a group of wolves is called a [[pack]].',
    },
  ],
};

export default defaultQuiz;
