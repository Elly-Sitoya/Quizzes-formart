import { createContext, useContext, useEffect, useState } from 'react';
import defaultQuiz from '../data/defaultQuiz.js';

const STORAGE_KEY = 'fitb-quizzes';

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

// Holds every fill-in-the-blanks quiz a trainer has set up, no login
// required. Everything is persisted to this browser's local storage, so a
// trainer's quizzes are still there next time they open the portal on the
// same device/browser.
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
    setQuizzes((prev) => [...prev, { id, title, timerSeconds: 120, paragraphs: [] }]);
    return id;
  };

  const renameQuiz = (quizId, title) => {
    setQuizzes((prev) => prev.map((q) => (q.id === quizId ? { ...q, title } : q)));
  };

  const deleteQuiz = (quizId) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  };

  const getQuiz = (quizId) => quizzes.find((q) => q.id === quizId) ?? null;

  const setTimerSeconds = (quizId, timerSeconds) => {
    setQuizzes((prev) =>
      prev.map((quiz) => (quiz.id === quizId ? { ...quiz, timerSeconds } : quiz))
    );
  };

  const addParagraph = (quizId) => {
    const newId = generateId();
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? { ...quiz, paragraphs: [...quiz.paragraphs, { id: newId, raw: '' }] }
          : quiz
      )
    );
    return newId;
  };

  const updateParagraph = (quizId, paragraphId, raw) => {
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? {
              ...quiz,
              paragraphs: quiz.paragraphs.map((p) => (p.id === paragraphId ? { ...p, raw } : p)),
            }
          : quiz
      )
    );
  };

  const deleteParagraph = (quizId, paragraphId) => {
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? { ...quiz, paragraphs: quiz.paragraphs.filter((p) => p.id !== paragraphId) }
          : quiz
      )
    );
  };

  const value = {
    quizzes,
    createQuiz,
    renameQuiz,
    deleteQuiz,
    getQuiz,
    setTimerSeconds,
    addParagraph,
    updateParagraph,
    deleteParagraph,
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
