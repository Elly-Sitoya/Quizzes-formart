import { createContext, useContext, useEffect, useState } from 'react';
import defaultQuiz from '../data/defaultQuiz.js';

const STORAGE_KEY = 'matching-pairs-quizzes';

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadInitialQuizzes() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Corrupt or inaccessible storage - fall back to the seed quiz below.
  }
  return [defaultQuiz];
}

const QuizzesContext = createContext(null);

// Holds every matching-pairs quiz a trainer has set up, no login required.
// Everything here is persisted to this browser's local storage for now.
// That detail is deliberately sealed inside this one file: every screen
// below talks to the functions this provider exposes, never to
// localStorage directly, so plugging this module into the main school
// system's real backend later is just a matter of rewriting the inside of
// this provider (e.g. to call an API) - no other file needs to change.
export function QuizzesProvider({ children }) {
  const [quizzes, setQuizzes] = useState(loadInitialQuizzes);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
    } catch {
      // Storage might be full or unavailable (e.g. private browsing) -
      // the app keeps working for this session even if it can't persist.
    }
  }, [quizzes]);

  const createQuiz = (title) => {
    const id = generateId();
    setQuizzes((prev) => [
      ...prev,
      { id, title, timerEnabled: false, timerSeconds: 120, pairs: [] },
    ]);
    return id;
  };

  const renameQuiz = (quizId, title) => {
    setQuizzes((prev) => prev.map((q) => (q.id === quizId ? { ...q, title } : q)));
  };

  const deleteQuiz = (quizId) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  };

  const getQuiz = (quizId) => quizzes.find((q) => q.id === quizId) ?? null;

  const setTimerEnabled = (quizId, timerEnabled) => {
    setQuizzes((prev) =>
      prev.map((quiz) => (quiz.id === quizId ? { ...quiz, timerEnabled } : quiz))
    );
  };

  const setTimerSeconds = (quizId, timerSeconds) => {
    setQuizzes((prev) =>
      prev.map((quiz) => (quiz.id === quizId ? { ...quiz, timerSeconds } : quiz))
    );
  };

  const addPair = (quizId) => {
    const newId = generateId();
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? { ...quiz, pairs: [...quiz.pairs, { id: newId, left: '', right: '' }] }
          : quiz
      )
    );
    return newId;
  };

  const updatePair = (quizId, pairId, field, value) => {
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? {
              ...quiz,
              pairs: quiz.pairs.map((p) => (p.id === pairId ? { ...p, [field]: value } : p)),
            }
          : quiz
      )
    );
  };

  const deletePair = (quizId, pairId) => {
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId ? { ...quiz, pairs: quiz.pairs.filter((p) => p.id !== pairId) } : quiz
      )
    );
  };

  const value = {
    quizzes,
    createQuiz,
    renameQuiz,
    deleteQuiz,
    getQuiz,
    setTimerEnabled,
    setTimerSeconds,
    addPair,
    updatePair,
    deletePair,
  };

  return <QuizzesContext.Provider value={value}>{children}</QuizzesContext.Provider>;
}

export function useQuizzes() {
  const ctx = useContext(QuizzesContext);
  if (!ctx) {
    throw new Error('useQuizzes must be used within a QuizzesProvider');
  }
  return ctx;
}
