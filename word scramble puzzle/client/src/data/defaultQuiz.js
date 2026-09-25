// The seed quiz used the very first time the app runs, before a trainer
// has created anything of their own. Each word has one clue and one
// answer; the answer is what gets split into letter tiles and scrambled
// for the learner. A trainer can freely rename, edit, or remove any of
// these from the editor.
const defaultQuiz = {
  id: 'default-quiz',
  title: 'Kitchen Scramble',
  words: [
    { id: 'word-1', clue: 'Relating to the art and science of preparing meals.', answer: 'CULINARY' },
    { id: 'word-2', clue: 'A hot dish of meat, vegetables, and liquid, cooked slowly.', answer: 'STEW' },
    { id: 'word-3', clue: 'The green herb used to add fresh flavor just before serving.', answer: 'PARSLEY' },
    { id: 'word-4', clue: 'To cook food in hot oil or fat.', answer: 'FRY' },
    { id: 'word-5', clue: 'A set of instructions for preparing a dish.', answer: 'RECIPE' },
  ],
};

export default defaultQuiz;
