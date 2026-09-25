import { createContext, useContext, useEffect, useState } from 'react';
import defaultWords from '../data/defaultWords.js';

const STORAGE_KEY = 'crossword-quizzes';
const SETTINGS_STORAGE_KEY = 'crossword-settings';

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
  return [
    {
      id: 'default-quiz',
      title: 'Core Terms in Software Engineering',
      questions: defaultWords,
    },
  ];
}

// Type-level settings for the crossword question type. `timerMode` controls
// whether the on-screen clock during play counts up (informational only),
// counts down against `timeLimitSeconds` (a real limit that ends the
// attempt), or is hidden entirely.
const DEFAULT_CROSSWORD_SETTINGS = {
  timerMode: 'up',
  timeLimitSeconds: 300,
};

function loadInitialSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_CROSSWORD_SETTINGS, ...parsed };
      }
    }
  } catch {
    // Corrupt or inaccessible storage - fall back to the defaults below.
  }
  return { ...DEFAULT_CROSSWORD_SETTINGS };
}

const QuizzesContext = createContext(null);

// Holds every crossword a trainer has set up, no login required. Everything
// persists to this browser's local storage so a trainer's quizzes are still
// there next time they open the portal on the same device/browser. A host
// application integrating this feature can swap the two effects below for
// real API calls without touching anything else that reads from this
// context - every consumer only ever talks to the functions this provides.
export function QuizzesProvider({ children }) {
  const [quizzes, setQuizzes] = useState(loadInitialQuizzes);
  const [crosswordSettings, setCrosswordSettings] = useState(loadInitialSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
    } catch {
      // Storage might be full or unavailable (e.g. private browsing) -
      // the app keeps working for this session even if it can't persist.
    }
  }, [quizzes]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(crosswordSettings));
    } catch {
      // Storage might be full or unavailable - keep working for this session.
    }
  }, [crosswordSettings]);

  const updateCrosswordSettings = (updates) => {
    setCrosswordSettings((prev) => ({ ...prev, ...updates }));
  };

  const createQuiz = (title) => {
    const id = generateId();
    setQuizzes((prev) => [...prev, { id, title, questions: [] }]);
    return id;
  };

  const renameQuiz = (quizId, title) => {
    setQuizzes((prev) => prev.map((q) => (q.id === quizId ? { ...q, title } : q)));
  };

  const deleteQuiz = (quizId) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  };

  const getQuiz = (quizId) => quizzes.find((q) => q.id === quizId) ?? null;

  const addWord = (quizId, word) => {
    const id = generateId();
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? { ...quiz, questions: [...quiz.questions, { id, clue: '', answer: '', ...word }] }
          : quiz
      )
    );
    return id;
  };

  const updateWord = (quizId, wordId, updates) => {
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? {
              ...quiz,
              questions: quiz.questions.map((q) => (q.id === wordId ? { ...q, ...updates } : q)),
            }
          : quiz
      )
    );
  };

  const deleteWord = (quizId, wordId) => {
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? { ...quiz, questions: quiz.questions.filter((q) => q.id !== wordId) }
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
    addWord,
    updateWord,
    deleteWord,
    crosswordSettings,
    updateCrosswordSettings,
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
