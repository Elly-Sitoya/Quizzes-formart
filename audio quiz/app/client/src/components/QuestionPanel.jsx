import React, { useEffect, useState } from 'react';

// Renders every question attached to the current chunk (recognition MCQ +
// application fill-in-the-blank) and collects one answer per question
// before allowing submission. Disabled until the chunk has finished
// playing at least once.
export default function QuestionPanel({ questions, disabled, onSubmit }) {
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    setAnswers({});
  }, [questions]);

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const allAnswered = questions.every((q) => (answers[q.id] ?? '').toString().trim() !== '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!allAnswered) return;
    onSubmit(answers);
  };

  return (
    <form className="question-panel" onSubmit={handleSubmit}>
      {questions.map((q) => (
        <fieldset key={q.id} className="question-block" disabled={disabled}>
          <legend>{q.question_type === 'recognition' ? 'Erkennen' : 'Anwenden'}</legend>
          <p className="question-prompt">{q.prompt}</p>

          {q.options && q.options.length > 0 ? (
            <div className="options-list">
              {q.options.map((opt) => (
                <label key={opt.option_key} className="option-row">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt.option_key}
                    checked={answers[q.id] === opt.option_key}
                    onChange={() => setAnswer(q.id, opt.option_key)}
                  />
                  {opt.option_text}
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              className="text-answer"
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="Deine Antwort…"
            />
          )}
        </fieldset>
      ))}

      <button type="submit" className="btn btn-primary btn-submit" disabled={disabled || !allAnswered}>
        Antworten abschicken
      </button>
      {disabled && (
        <p className="hint">Höre dir das Audio erst vollständig an, bevor du antwortest.</p>
      )}
    </form>
  );
}
