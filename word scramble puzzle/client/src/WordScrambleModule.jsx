import { Routes, Route } from 'react-router-dom';
import { QuizzesProvider } from './context/QuizzesContext.jsx';
import LearnerHome from './pages/LearnerHome.jsx';
import TrainerPortal from './pages/TrainerPortal.jsx';
import QuizEditor from './pages/QuizEditor.jsx';
import './App.css';

// This is the integration point for the wider school management system.
// It deliberately does NOT render its own <BrowserRouter> - it assumes it
// is being mounted somewhere inside a router the host application already
// owns, e.g.:
//
//   <Route path="/quizzes/word-scramble/*" element={<WordScrambleModule />} />
//
// That keeps this module from fighting the host over who owns routing.
// The only other thing it needs from its environment is nothing at all:
// quiz data and settings live behind QuizzesProvider, so swapping local
// storage for a real API later only means changing the inside of that
// provider, never any of the screens below.
export default function WordScrambleModule() {
  return (
    <QuizzesProvider>
      <div className="app">
        <Routes>
          <Route path="" element={<LearnerHome />} />
          <Route path="trainer" element={<TrainerPortal />} />
          <Route path="trainer/quizzes/:quizId" element={<QuizEditor />} />
        </Routes>
      </div>
    </QuizzesProvider>
  );
}
