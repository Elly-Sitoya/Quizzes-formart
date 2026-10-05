const BASE = '/api';

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

const send = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const api = {
  // student portal
  studentSets: (learnerKey) =>
    fetch(`${BASE}/student/sets?learner_key=${encodeURIComponent(learnerKey)}`).then(handle),
  studentSet: (id) => fetch(`${BASE}/student/sets/${id}`).then(handle),
  startAttempt: (setId, learnerKey) =>
    fetch(`${BASE}/attempts`, send('POST', { set_id: setId, learner_key: learnerKey })).then(handle),
  saveAnswer: (attemptId, payload) =>
    fetch(`${BASE}/attempts/${attemptId}/answers`, send('POST', payload)).then(handle),
  finishAttempt: (attemptId) =>
    fetch(`${BASE}/attempts/${attemptId}/finish`, { method: 'POST' }).then(handle),

  // instructor portal
  listSets: () => fetch(`${BASE}/sets`).then(handle),
  getSet: (id) => fetch(`${BASE}/sets/${id}`).then(handle),
  createSet: (data) => fetch(`${BASE}/sets`, send('POST', data)).then(handle),
  updateSet: (id, data) => fetch(`${BASE}/sets/${id}`, send('PUT', data)).then(handle),
  deleteSet: (id) => fetch(`${BASE}/sets/${id}`, { method: 'DELETE' }).then(handle),
  setStats: (id) => fetch(`${BASE}/sets/${id}/stats`).then(handle),
  createCard: (setId, data) => fetch(`${BASE}/sets/${setId}/cards`, send('POST', data)).then(handle),
  updateCard: (id, data) => fetch(`${BASE}/cards/${id}`, send('PUT', data)).then(handle),
  deleteCard: (id) => fetch(`${BASE}/cards/${id}`, { method: 'DELETE' }).then(handle),
  reorderCards: (setId, ids) =>
    fetch(`${BASE}/sets/${setId}/cards/order`, send('PUT', { ids })).then(handle),
  uploadImage: (file) => {
    const form = new FormData();
    form.append('image', file);
    return fetch(`${BASE}/uploads`, { method: 'POST', body: form }).then(handle);
  },
};
