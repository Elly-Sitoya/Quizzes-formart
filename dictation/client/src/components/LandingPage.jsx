import './LandingPage.css';

export default function LandingPage({ onAttempt }) {
  return (
    <div className="landing-page">
      <div className="landing-card">
        <h1 className="landing-title">Dictation Quiz</h1>
        <p className="landing-subtitle">
          Listen carefully to each sentence and type exactly what you hear.
        </p>
        <button className="attempt-btn" onClick={onAttempt}>
          Attempt
        </button>
      </div>
    </div>
  );
}
