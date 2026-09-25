import { createContext, useContext, useEffect, useState } from 'react';
import defaultQuestions from '../data/defaultQuestions.js';

const STORAGE_KEY = 'dictation-quizzes';
const SETTINGS_STORAGE_KEY = 'dictation-settings';

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
      title: 'Sample Dictation Quiz',
      questions: defaultQuestions,
    },
  ];
}

// Type-level settings for the dictation question type (as opposed to
// per-question data). Currently just the computer-voice playback speed,
// used everywhere a dictation sentence is read aloud with TTS.
const DEFAULT_DICTATION_SETTINGS = { playbackRate: 0.9 };

function loadInitialDictationSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_DICTATION_SETTINGS, ...parsed };
      }
    }
  } catch {
    // Corrupt or inaccessible storage - fall back to the defaults below.
  }
  return { ...DEFAULT_DICTATION_SETTINGS };
}

const QuizzesContext = createContext(null);

// Holds every quiz a trainer has set up, no login required. Everything is
// persisted to this browser's local storage, so a trainer's quizzes are
// still there next time they open the portal on the same device/browser.
export function QuizzesProvider({ children }) {
  const [quizzes, setQuizzes] = useState(loadInitialQuizzes);
  const [dictationSettings, setDictationSettings] = useState(loadInitialDictationSettings);

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
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(dictationSettings));
    } catch {
      // Storage might be full or unavailable - keep working for this session.
    }
  }, [dictationSettings]);

  const updateDictationSettings = (updates) => {
    setDictationSettings((prev) => ({ ...prev, ...updates }));
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

  const addQuestion = (quizId, question) => {
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? { ...quiz, questions: [...quiz.questions, { ...question, id: generateId() }] }
          : quiz
      )
    );
  };

  const updateQuestion = (quizId, questionId, updates) => {
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? {
              ...quiz,
              questions: quiz.questions.map((q) =>
                q.id === questionId ? { ...q, ...updates } : q
              ),
            }
          : quiz
      )
    );
  };

  const deleteQuestion = (quizId, questionId) => {
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? { ...quiz, questions: quiz.questions.filter((q) => q.id !== questionId) }
          : quiz
      )
    );
  };

  // Clones a question (text + audio) and inserts the copy immediately after
  // the original, so a trainer can spin off a variant without retyping it.
  const duplicateQuestion = (quizId, questionId) => {
    let newId = null;
    setQuizzes((prev) =>
      prev.map((quiz) => {
        if (quiz.id !== quizId) return quiz;
        const idx = quiz.questions.findIndex((q) => q.id === questionId);
        if (idx === -1) return quiz;
        newId = generateId();
        const copy = { ...quiz.questions[idx], id: newId };
        const questions = [...quiz.questions];
        questions.splice(idx + 1, 0, copy);
        return { ...quiz, questions };
      })
    );
    return newId;
  };

  // Inserts a brand-new, empty sentence (no text, no audio yet) at either
  // end of the list. Used by the "+ add text" links.
  const addBlankQuestion = (quizId, position = 'end') => {
    const newId = generateId();
    const blank = { id: newId, text: '', audioMode: 'tts', audioData: null };
    setQuizzes((prev) =>
      prev.map((quiz) =>
        quiz.id === quizId
          ? {
              ...quiz,
              questions:
                position === 'start' ? [blank, ...quiz.questions] : [...quiz.questions, blank],
            }
          : quiz
      )
    );
    return newId;
  };

  // direction: -1 to move a question up, +1 to move it down.
  const moveQuestion = (quizId, questionId, direction) => {
    setQuizzes((prev) =>
      prev.map((quiz) => {
        if (quiz.id !== quizId) return quiz;
        const idx = quiz.questions.findIndex((q) => q.id === questionId);
        const newIdx = idx + direction;
        if (idx === -1 || newIdx < 0 || newIdx >= quiz.questions.length) return quiz;
        const reordered = [...quiz.questions];
        [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
        return { ...quiz, questions: reordered };
      })
    );
  };

  // Moves a question to an arbitrary position in the list (used for drag
  // reordering), rather than only swapping with its immediate neighbour.
  const reorderQuestions = (quizId, fromIndex, toIndex) => {
    setQuizzes((prev) =>
      prev.map((quiz) => {
        if (quiz.id !== quizId) return quiz;
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= quiz.questions.length ||
          toIndex >= quiz.questions.length
        ) {
          return quiz;
        }
        const reordered = [...quiz.questions];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        return { ...quiz, questions: reordered };
      })
    );
  };

  const value = {
    quizzes,
    createQuiz,
    renameQuiz,
    deleteQuiz,
    getQuiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    addBlankQuestion,
    moveQuestion,
    reorderQuestions,
    dictationSettings,
    updateDictationSettings,
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
