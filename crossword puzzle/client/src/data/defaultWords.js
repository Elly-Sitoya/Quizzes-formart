// The seed quiz used the first time the app runs, before a trainer has
// created anything. Each entry already matches the shape a trainer-created
// word uses: a clue and the answer it unlocks in the grid.
const defaultWords = [
  { id: 'default-w1', clue: 'A step-by-step procedure for solving a problem', answer: 'ALGORITHM' },
  { id: 'default-w2', clue: 'A named storage location that holds a value', answer: 'VARIABLE' },
  { id: 'default-w3', clue: 'A reusable block of code that performs a task', answer: 'FUNCTION' },
  { id: 'default-w4', clue: 'An ordered collection of elements accessed by index', answer: 'ARRAY' },
  { id: 'default-w5', clue: 'Repeats a block of code while a condition holds', answer: 'LOOP' },
  { id: 'default-w6', clue: 'The process of finding and fixing errors in code', answer: 'DEBUG' },
  { id: 'default-w7', clue: 'Translates source code into machine code', answer: 'COMPILER' },
  { id: 'default-w8', clue: 'The set of rules that define valid code structure', answer: 'SYNTAX' },
];

export default defaultWords;
