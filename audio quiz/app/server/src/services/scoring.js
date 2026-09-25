// Scoring helpers. Correctness is only ever computed at finish-time
// (see sessionsController.finishSession) — never revealed while a
// session is still in progress.

function normalize(str) {
  return String(str ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]/g, '');
}

export function isCorrect(question, submittedAnswer) {
  if (question.question_type === 'recognition') {
    // Recognition questions are MCQ: compare option_key values directly.
    return normalize(submittedAnswer) === normalize(question.correct_answer);
  }
  // Application questions are short free-text: normalize before comparing.
  return normalize(submittedAnswer) === normalize(question.correct_answer);
}

export { normalize };
