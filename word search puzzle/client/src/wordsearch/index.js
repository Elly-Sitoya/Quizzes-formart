// Public surface of this module. A host app should only ever import from
// this file, not reach into wordsearch/pages or wordsearch/components
// directly - that keeps the internal file layout free to change later
// without breaking whatever integrates it.
export { PuzzlesProvider, usePuzzles } from './context/PuzzlesContext.jsx';
export { default as LearnerHome } from './pages/LearnerHome.jsx';
export { default as TrainerPortal } from './pages/TrainerPortal.jsx';
export { default as PuzzleEditor } from './pages/PuzzleEditor.jsx';
export { default as WordSearchRoutes } from './WordSearchRoutes.jsx';
