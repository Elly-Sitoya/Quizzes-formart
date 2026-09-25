import { createContext, useContext, useEffect, useState } from 'react';
import defaultPuzzle from '../data/defaultPuzzle.js';

const STORAGE_KEY = 'word-search-puzzles';
const DEFAULTS_STORAGE_KEY = 'word-search-defaults';
const DEFAULT_SETTINGS = { timerSeconds: 360, wordsPerScreen: 8 };

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadInitialPuzzles() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Corrupt or inaccessible storage - fall back to the seed puzzle below.
  }
  return [defaultPuzzle];
}

// Trainer-configurable defaults for new Word Search puzzles, set from the
// gear icon on the quiz-type modal. Existing puzzles are unaffected - each
// one already carries its own timerSeconds/wordsPerScreen once created.
function loadInitialDefaults() {
  try {
    const raw = window.localStorage.getItem(DEFAULTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // Corrupt or inaccessible storage - fall back to the defaults below.
  }
  return DEFAULT_SETTINGS;
}

const PuzzlesContext = createContext(null);

// Holds every word search puzzle a trainer has set up, no login required.
// Persisted to this browser's local storage today. When this module is
// wired into the school system's real backend, only the body of these
// functions needs to change (e.g. swap for fetch calls to the existing
// API) - every component below calls usePuzzles() and never touches
// storage directly, so that swap is isolated to this one file.
export function PuzzlesProvider({ children }) {
  const [puzzles, setPuzzles] = useState(loadInitialPuzzles);
  const [wordSearchDefaults, setWordSearchDefaults] = useState(loadInitialDefaults);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
    } catch {
      // Storage might be full or unavailable (e.g. private browsing) -
      // the app keeps working for this session even if it can't persist.
    }
  }, [puzzles]);

  useEffect(() => {
    try {
      window.localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(wordSearchDefaults));
    } catch {
      // Same as above - defaults just won't persist for this session.
    }
  }, [wordSearchDefaults]);

  const createPuzzle = (title) => {
    const id = generateId();
    setPuzzles((prev) => [
      ...prev,
      {
        id,
        title,
        timerSeconds: wordSearchDefaults.timerSeconds,
        wordsPerScreen: wordSearchDefaults.wordsPerScreen,
        words: [],
      },
    ]);
    return id;
  };

  const updateWordSearchDefaults = (patch) => {
    setWordSearchDefaults((prev) => ({ ...prev, ...patch }));
  };

  const renamePuzzle = (puzzleId, title) => {
    setPuzzles((prev) => prev.map((p) => (p.id === puzzleId ? { ...p, title } : p)));
  };

  const deletePuzzle = (puzzleId) => {
    setPuzzles((prev) => prev.filter((p) => p.id !== puzzleId));
  };

  const getPuzzle = (puzzleId) => puzzles.find((p) => p.id === puzzleId) ?? null;

  const updatePuzzle = (puzzleId, patch) => {
    setPuzzles((prev) => prev.map((p) => (p.id === puzzleId ? { ...p, ...patch } : p)));
  };

  const addWord = (puzzleId, word) => {
    const clean = word.trim().toUpperCase();
    if (!clean) return;
    setPuzzles((prev) =>
      prev.map((p) =>
        p.id === puzzleId && !p.words.includes(clean) ? { ...p, words: [...p.words, clean] } : p
      )
    );
  };

  const removeWord = (puzzleId, word) => {
    setPuzzles((prev) =>
      prev.map((p) => (p.id === puzzleId ? { ...p, words: p.words.filter((w) => w !== word) } : p))
    );
  };

  const value = {
    puzzles,
    createPuzzle,
    renamePuzzle,
    deletePuzzle,
    getPuzzle,
    updatePuzzle,
    addWord,
    removeWord,
    wordSearchDefaults,
    updateWordSearchDefaults,
  };

  return <PuzzlesContext.Provider value={value}>{children}</PuzzlesContext.Provider>;
}

export function usePuzzles() {
  const ctx = useContext(PuzzlesContext);
  if (!ctx) {
    throw new Error('usePuzzles must be used within a PuzzlesProvider');
  }
  return ctx;
}
