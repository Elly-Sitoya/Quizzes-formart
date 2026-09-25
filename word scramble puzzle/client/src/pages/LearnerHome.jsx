import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import WordScrambleQuizModal from '../components/WordScrambleQuizModal.jsx';
import './LearnerHome.css';

export default function LearnerHome() {
  const { quizzes } = useQuizzes();
  const [activeQuizId, setActiveQuizId] = useState(null);
  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) ?? null;

  return (
    <div className="learner-home">
      <div className="learner-intro">
        <h1 className="learner-title">Word Scramble Quizzes</h1>
        <p className="learner-subtitle">
          Pick a quiz below, read the clue, then drag the letters into the right order.
        </p>
      </div>

      <div className="quiz-grid">
        {quizzes.length === 0 && (
          <p className="empty-state">No quizzes are available yet. Check back soon.</p>
        )}
        {quizzes.map((quiz) => {
          const wordCount = quiz.words.length;
          return (
            <div className="quiz-card" key={quiz.id}>
              <h2 className="quiz-card-title">{quiz.title}</h2>
              <p className="quiz-card-meta">
                {wordCount} word{wordCount === 1 ? '' : 's'}
              </p>
              <button
                className="attempt-btn"
                onClick={() => setActiveQuizId(quiz.id)}
                disabled={wordCount === 0}
              >
                Attempt
              </button>
            </div>
          );
        })}
      </div>

      {activeQuiz && (
        <WordScrambleQuizModal quiz={activeQuiz} onClose={() => setActiveQuizId(null)} />
      )}

      <Link className="trainer-link" to="trainer">
        Trainer Portal
      </Link>
    </div>
  );
}
