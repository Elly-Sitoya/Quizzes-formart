import { useState } from 'react';
import { Link } from 'react-router-dom';
import QuizTypeModal from '../components/QuizTypeModal.jsx';
import './TrainerPortal.css';

export default function TrainerPortal() {
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  return (
    <div className="ws-trainer-portal">
      <div className="ws-trainer-header">
        <h1 className="ws-trainer-title">Trainer Portal</h1>
        <p className="ws-trainer-subtitle">Build quizzes for your learners, by question type.</p>
      </div>

      <button className="ws-open-quiz-modal-btn" onClick={() => setQuizModalOpen(true)}>
        + Quiz
      </button>

      {quizModalOpen && <QuizTypeModal onClose={() => setQuizModalOpen(false)} />}

      <Link className="ws-back-link" to="..">
        ← Back to learner view
      </Link>
    </div>
  );
}
