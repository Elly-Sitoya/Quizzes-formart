import { useState } from 'react';
import { Link } from 'react-router-dom';
import QuizTypeModal from '../components/QuizTypeModal.jsx';
import './TrainerPortal.css';

export default function TrainerPortal() {
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  return (
    <div className="trainer-portal">
      <div className="trainer-header">
        <h1 className="trainer-title">Trainer Portal</h1>
        <p className="trainer-subtitle">Build quizzes for your learners, by question type.</p>
      </div>

      <button className="open-quiz-modal-btn" onClick={() => setQuizModalOpen(true)}>
        + Quiz
      </button>

      {quizModalOpen && <QuizTypeModal onClose={() => setQuizModalOpen(false)} />}

      <Link className="back-link" to="/">
        ← Back to learner view
      </Link>
    </div>
  );
}
