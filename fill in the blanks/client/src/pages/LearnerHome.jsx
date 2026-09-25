import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import { extractBlanks } from '../utils/parseParagraph.js';
import QuizModal from '../components/QuizModal.jsx';
import './LearnerHome.css';

function countBlanks(quiz) {
  return quiz.paragraphs.reduce((sum, p) => sum + extractBlanks(p.raw, p.id).length, 0);
}

export default function LearnerHome() {
  const { quizzes } = useQuizzes();
  const [activeQuizId, setActiveQuizId] = useState(null);
  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) ?? null;

  return (
    <div className="learner-home">
      <div className="learner-intro">
        <h1 className="learner-title">Fill in the Blanks Quizzes</h1>
        <p className="learner-subtitle">
          Pick a quiz below, drag each word into the right spot, and beat the clock.
        </p>
      </div>

      <div className="quiz-grid">
        {quizzes.length === 0 && (
          <p className="empty-state">No quizzes are available yet. Check back soon.</p>
        )}
        {quizzes.map((quiz) => {
          const blankCount = countBlanks(quiz);
          return (
            <div className="quiz-card" key={quiz.id}>
              <h2 className="quiz-card-title">{quiz.title}</h2>
              <p className="quiz-card-meta">
                {blankCount} blank{blankCount === 1 ? '' : 's'}
              </p>
              <button
                className="attempt-btn"
                onClick={() => setActiveQuizId(quiz.id)}
                disabled={blankCount === 0}
              >
                Attempt
              </button>
            </div>
          );
        })}
      </div>

      {activeQuiz && <QuizModal quiz={activeQuiz} onClose={() => setActiveQuizId(null)} />}

      <Link className="trainer-link" to="/trainer">
        Trainer Portal
      </Link>
    </div>
  );
}
