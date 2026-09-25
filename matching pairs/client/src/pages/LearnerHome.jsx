import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import MatchingPairsQuizModal from '../components/MatchingPairsQuizModal.jsx';
import './LearnerHome.css';

export default function LearnerHome() {
  const { quizzes } = useQuizzes();
  const [activeQuizId, setActiveQuizId] = useState(null);
  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) ?? null;

  return (
    <div className="learner-home">
      <div className="learner-intro">
        <h1 className="learner-title">Matching Pairs Quizzes</h1>
        <p className="learner-subtitle">
          Pick a quiz below, then drag from a dot on one side to its match on the other.
        </p>
      </div>

      <div className="quiz-grid">
        {quizzes.length === 0 && (
          <p className="empty-state">No quizzes are available yet. Check back soon.</p>
        )}
        {quizzes.map((quiz) => {
          const pairCount = quiz.pairs.length;
          return (
            <div className="quiz-card" key={quiz.id}>
              <h2 className="quiz-card-title">{quiz.title}</h2>
              <p className="quiz-card-meta">
                {pairCount} pair{pairCount === 1 ? '' : 's'}
                {quiz.timerEnabled ? ` · ${Math.round(quiz.timerSeconds / 60)} min` : ''}
              </p>
              <button
                className="attempt-btn"
                onClick={() => setActiveQuizId(quiz.id)}
                disabled={pairCount === 0}
              >
                Attempt
              </button>
            </div>
          );
        })}
      </div>

      {activeQuiz && (
        <MatchingPairsQuizModal quiz={activeQuiz} onClose={() => setActiveQuizId(null)} />
      )}

      <Link className="trainer-link" to="trainer">
        Trainer Portal
      </Link>
    </div>
  );
}
