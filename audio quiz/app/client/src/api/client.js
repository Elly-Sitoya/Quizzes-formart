const BASE = '/api';

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function getSegment(slug) {
  return fetch(`${BASE}/segments/${slug}`).then(handle);
}

export function startSession(segmentId) {
  return fetch(`${BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ segment_id: segmentId }),
  }).then(handle);
}

export function submitAnswer(sessionId, questionId, submittedAnswer) {
  return fetch(`${BASE}/sessions/${sessionId}/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_id: questionId, submitted_answer: submittedAnswer }),
  }).then(handle);
}

export function finishSession(sessionId) {
  return fetch(`${BASE}/sessions/${sessionId}/finish`, { method: 'POST' }).then(handle);
}

export function getResults(sessionId) {
  return fetch(`${BASE}/sessions/${sessionId}/results`).then(handle);
}
