import { useEffect, useRef, useState } from 'react';
import { useQuizzes } from '../context/QuizzesContext.jsx';
import './QuizModal.css';

// Strips punctuation and case so marking judges the word itself,
// not incidental typing differences like a missing full stop.
function normalizeWord(word) {
  return word.toLowerCase().replace(/[^a-z0-9']/gi, '');
}

// Finds the best overall alignment between the typed words and the expected
// words (the same idea a diff tool uses to line up two versions of text),
// rather than comparing strictly position-by-position. That way, a single
// split word ("seashells" -> "sea shells"), merged word, or skipped word
// doesn't shift everything after it out of sync and mark it wrong too.
function alignWords(expectedWords, typedWords) {
  const n = expectedWords.length;
  const m = typedWords.length;

  // dp[i][j] = minimum number of edits to align the first i expected words
  // with the first j typed words.
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const isMatch = normalizeWord(expectedWords[i - 1]) === normalizeWord(typedWords[j - 1]);
      const substitutionCost = isMatch ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + substitutionCost, // match or wrong word in the right slot
        dp[i - 1][j] + 1, // an expected word that never got typed
        dp[i][j - 1] + 1 // an extra typed word that wasn't expected
      );
    }
  }

  // Walk the table backwards to recover which choice was made at each step.
  const aligned = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    const isMatch =
      i > 0 && j > 0 && normalizeWord(expectedWords[i - 1]) === normalizeWord(typedWords[j - 1]);
    const substitutionCost = isMatch ? 0 : 1;

    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + substitutionCost) {
      aligned.push({
        type: isMatch ? 'correct' : 'incorrect',
        display: typedWords[j - 1],
        expected: expectedWords[i - 1],
      });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      aligned.push({ type: 'missing', display: '—', expected: expectedWords[i - 1] });
      i--;
    } else {
      aligned.push({ type: 'extra', display: typedWords[j - 1], expected: null });
      j--;
    }
  }

  aligned.reverse();
  return aligned;
}

// Compares the typed answer against the expected sentence using the best
// available alignment, so a learner can see exactly which words landed and
// which didn't, even when a slip has shifted the word count.
function markAnswer(expectedText, typedText) {
  const expectedWords = expectedText.trim().split(/\s+/);
  const typedWords = typedText.trim().length ? typedText.trim().split(/\s+/) : [];
  const aligned = alignWords(expectedWords, typedWords);

  const words = aligned.map((entry, idx) => ({
    key: idx,
    display: entry.display,
    expected: entry.expected,
    type: entry.type,
    isCorrect: entry.type === 'correct',
  }));

  const correctCount = aligned.filter((entry) => entry.type === 'correct').length;

  return { words, correctCount, total: expectedWords.length };
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function QuizModal({ quiz, onClose }) {
  const { dictationSettings } = useQuizzes();
  const questions = quiz.questions;
  const [closing, setClosing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [markResult, setMarkResult] = useState(null);
  const [scores, setScores] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const audioRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Elapsed-time timer, running for the duration of the attempt.
  useEffect(() => {
    if (finished) return undefined;
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, [finished]);

  // Make sure nothing keeps talking/playing after the component goes away.
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
    };
  }, []);

  const handlePlayToggle = () => {
    if (currentQuestion.audioMode !== 'tts' && currentQuestion.audioData) {
      const audioEl = audioRef.current;
      if (!audioEl) return;
      if (isPlaying) {
        audioEl.pause();
        setIsPlaying(false);
      } else {
        audioEl.play();
        setIsPlaying(true);
      }
    } else {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(currentQuestion.text);
        utterance.rate = dictationSettings.playbackRate;
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  const handleSubmit = () => {
    if (submitted || !answer.trim()) return;
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    setIsPlaying(false);

    const result = markAnswer(currentQuestion.text, answer);
    setMarkResult(result);
    setSubmitted(true);
    setScores((prev) => [...prev, { correctCount: result.correctCount, total: result.total }]);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      clearInterval(timerIntervalRef.current);
      setFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setAnswer('');
    setSubmitted(false);
    setMarkResult(null);
    setIsPlaying(false);
    setShowAnswers(false);
  };

  const handleClose = () => {
    setClosing(true);
    window.speechSynthesis?.cancel();
    clearInterval(timerIntervalRef.current);
    setTimeout(onClose, 200);
  };

  const totalCorrect = scores.reduce((sum, s) => sum + s.correctCount, 0);
  const totalWords = scores.reduce((sum, s) => sum + s.total, 0);
  const percent = totalWords ? Math.round((totalCorrect / totalWords) * 100) : 0;

  return (
    <div className={`quiz-overlay ${closing ? 'closing' : ''}`}>
      <div className={`quiz-modal ${closing ? 'closing' : ''}`}>
        <div className="quiz-modal-header">
          {!finished && (
            <span className="quiz-progress">
              Question {currentIndex + 1} of {questions.length}
            </span>
          )}
          <span className="quiz-timer">⏱ {formatTime(elapsedSeconds)}</span>
          <button className="quiz-close-btn" onClick={handleClose} aria-label="Close quiz">
            ✕
          </button>
        </div>

        {!finished ? (
          <>
            <div className="audio-section">
              <button
                className={`play-btn ${isPlaying ? 'playing' : ''}`}
                onClick={handlePlayToggle}
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              {currentQuestion.audioMode !== 'tts' && currentQuestion.audioData && (
                <audio
                  ref={audioRef}
                  src={currentQuestion.audioData}
                  onEnded={() => setIsPlaying(false)}
                />
              )}
            </div>

            <div className="notebook-wrapper">
              {!submitted ? (
                <textarea
                  className="notebook"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type what you hear..."
                  autoFocus
                />
              ) : (
                <div className="notebook notebook-result">
                  {markResult.words.map((w, idx) => {
                    const revealCorrection =
                      showAnswers && !w.isCorrect && w.type !== 'extra' && w.expected;
                    const strikeThrough = showAnswers && (w.type === 'incorrect' || w.type === 'extra');

                    return (
                      <span key={w.key} className="word-group" style={{ animationDelay: `${idx * 80}ms` }}>
                        <span className={`marked-word ${w.isCorrect ? 'correct' : 'incorrect'}`}>
                          <span className={strikeThrough ? 'struck' : ''}>{w.display}</span>{' '}
                          {w.isCorrect ? '✔' : '✖'}
                        </span>
                        {revealCorrection && <span className="correction-word">{w.expected}</span>}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {submitted && (
              <div className="reveal-row">
                <button
                  className="reveal-toggle-btn"
                  onClick={() => setShowAnswers((s) => !s)}
                >
                  {showAnswers ? 'Hide Answers' : 'Show Answers'}
                </button>
              </div>
            )}

            <div className="quiz-actions">
              {!submitted ? (
                <button className="submit-btn" onClick={handleSubmit} disabled={!answer.trim()}>
                  Submit
                </button>
              ) : (
                <button className="submit-btn" onClick={handleNext}>
                  {isLastQuestion ? 'Finish' : 'Next'}
                </button>
              )}
            </div>

            {submitted && (
              <div className="question-score">
                {markResult.correctCount} / {markResult.total} words correct
              </div>
            )}
          </>
        ) : (
          <div className="quiz-summary">
            <h2>Quiz Complete!</h2>
            <p className="summary-score">
              {totalCorrect} / {totalWords} words correct
            </p>
            <p className="summary-percent">{percent}%</p>
            <p className="summary-time">Time taken: {formatTime(elapsedSeconds)}</p>
            <button className="submit-btn" onClick={handleClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
