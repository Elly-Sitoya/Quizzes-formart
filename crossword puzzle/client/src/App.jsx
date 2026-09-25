import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QuizzesProvider } from './context/QuizzesContext.jsx';
import LearnerHome from './pages/LearnerHome.jsx';
import TrainerPortal from './pages/TrainerPortal.jsx';
import CrosswordEditor from './pages/CrosswordEditor.jsx';
import './App.css';

// This is the whole feature, self-contained. Everything it needs
// (quiz data, settings) is provided by QuizzesProvider right here, so a
// host application just has to render <App /> somewhere in its tree -
// no global setup, no providers to wire up beforehand.
//
// `basename` is exposed so this can live under a sub-path inside a larger
// app's own router (e.g. <App basename="/quizzes/crossword" />) instead of
// assuming it owns the whole URL space.
function App({ basename = '/' }) {
  return (
    <QuizzesProvider>
      <BrowserRouter basename={basename}>
        <div className="crossword-app">
          <Routes>
            <Route path="/" element={<LearnerHome />} />
            <Route path="/trainer" element={<TrainerPortal />} />
            <Route path="/trainer/quizzes/:quizId" element={<CrosswordEditor />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QuizzesProvider>
  );
}

export default App;
