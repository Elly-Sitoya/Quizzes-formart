// Public entry point for consumers embedding this feature inside the main
// school management system. Import from here rather than reaching into
// individual files, so internal reshuffles don't break the host app.
export { default as WordScrambleModule } from './WordScrambleModule.jsx';
export { default as LearnerHome } from './pages/LearnerHome.jsx';
export { default as TrainerPortal } from './pages/TrainerPortal.jsx';
export { default as QuizEditor } from './pages/QuizEditor.jsx';
export { default as WordScrambleQuizModal } from './components/WordScrambleQuizModal.jsx';
export { QuizzesProvider, useQuizzes } from './context/QuizzesContext.jsx';
