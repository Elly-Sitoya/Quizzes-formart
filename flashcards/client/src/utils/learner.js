const KEY = 'flashcards_learner_key';

// No authentication yet: each browser gets an anonymous id so progress is remembered.
export function getLearnerKey() {
  try {
    let key = localStorage.getItem(KEY);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(KEY, key);
    }
    return key;
  } catch {
    return 'anonymous';
  }
}
