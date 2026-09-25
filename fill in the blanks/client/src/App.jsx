import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QuizzesProvider } from './context/QuizzesContext.jsx';
import LearnerHome from './pages/LearnerHome.jsx';
import TrainerPortal from './pages/TrainerPortal.jsx';
import QuizEditor from './pages/QuizEditor.jsx';
import './App.css';

function App() {
  return (
    <QuizzesProvider>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route path="/" element={<LearnerHome />} />
            <Route path="/trainer" element={<TrainerPortal />} />
            <Route path="/trainer/quizzes/:quizId" element={<QuizEditor />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QuizzesProvider>
  );
}

export default App;
