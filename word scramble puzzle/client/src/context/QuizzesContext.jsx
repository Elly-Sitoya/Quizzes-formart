import { createContext, useContext, useEffect, useState } from 'react';
import defaultQuiz from '../data/defaultQuiz.js';
import defaultSettings from '../data/defaultSettings.js';

const QUIZZES_STORAGE_KEY = 'word-scramble-quizzes';
const SETTINGS_STORAGE_KEY = 'word-scramble-settings';

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadInitialQuizzes() {
  try {
    const raw = window.localStorage.getItem(QUIZZES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Corrupt or inaccessible storage - fall back to the seed quiz below.
  }
  return [defaultQuiz];
}

function loadInitialSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return { ...defaultSettings, ...parsed };
    }
  } catch {
    // Corrupt or inaccessible storage - fall back to the defaults below.
  }
  return { ...defaultSettings };
}

const QuizzesContext = createContext(null);

// Holds every word-scramble quiz a trainer has set up, plus the one shared
// settings object that governs how the word-scramble question type behaves
// (time per word, hints, case sensitivity) - no login required for any of
// it. Everything here is persisted to this browser's local storage for now.
// That detail is deliberately sealed inside this one file: every screen
// below talks to the functions this provider exposes, never to
// localStorage directly, so plugging this module into the main school
// system's real backend later is just a matter of rewriting the inside of
// this provider (e.g. to call an API) - no other file needs to change.
export function QuizzesProvider({ children }) {
  const [quizzes, setQuizzes] = useState(loadInitialQuizzes);
  const [settings, setSettings] = useState(loadInitialSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(quizzes));
    } catch {
      // Storage might be full or unavailable (e.g. private browsing) -
      // the app keeps working for this session even if it can't persist.
    }
  }, [quizzes]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Same as above - keep working even if this can't be saved.
    }
  }, [settings]);

  const createQuiz = (title) => {
    const id = generateId();
    setQuizzes((prev) => [...prev, { id, title, words: [] }]);
    return id;
  };

  const renameQuiz = (quizId, title) => {
    setQuizzes((prev) => prev.map((q) => (q.id === quizId ? { ...q, title } : q)));
  };

  const deleteQuiz = (quizId) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  };

  const getQuiz = (quizId) => quizzes.find((q) => q.id === quizId) ?? null;

  const addWord = (quizId) => {
    const newId = generateId();
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? { ...quiz, words: [...quiz.words, { id: newId, clue: '', answer: '' }] }
          : quiz
      )
    );
    return newId;
  };

  const updateWord = (quizId, wordId, field, value) => {
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? {
              ...quiz,
              words: quiz.words.map((w) => (w.id === wordId ? { ...w, [field]: value } : w)),
            }
          : quiz
      )
    );
  };

  const deleteWord = (quizId, wordId) => {
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId ? { ...quiz, words: quiz.words.filter((w) => w.id !== wordId) } : quiz
      )
    );
  };

  const updateSettings = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const value = {
    quizzes,
    createQuiz,
    renameQuiz,
    deleteQuiz,
    getQuiz,
    addWord,
    updateWord,
    deleteWord,
    settings,
    updateSettings,
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
