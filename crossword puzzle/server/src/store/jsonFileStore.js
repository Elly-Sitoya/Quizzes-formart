import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

// Matches the shape `QuizzesContext.jsx` seeds on the client, so a fresh
// server and a fresh browser agree on the same starter quiz before the two
// are ever wired together.
const DEFAULT_SETTINGS = {
  timerMode: 'up',
  timeLimitSeconds: 300,
};

function seedDb() {
  return {
    quizzes: [
      {
        id: 'default-quiz',
        title: 'Core Terms in Software Engineering',
        questions: [
          { id: 'default-w1', clue: 'A step-by-step procedure for solving a problem', answer: 'ALGORITHM' },
          { id: 'default-w2', clue: 'A named storage location that holds a value', answer: 'VARIABLE' },
          { id: 'default-w3', clue: 'A reusable block of code that performs a task', answer: 'FUNCTION' },
          { id: 'default-w4', clue: 'An ordered collection of elements accessed by index', answer: 'ARRAY' },
          { id: 'default-w5', clue: 'Repeats a block of code while a condition holds', answer: 'LOOP' },
          { id: 'default-w6', clue: 'The process of finding and fixing errors in code', answer: 'DEBUG' },
          { id: 'default-w7', clue: 'Translates source code into machine code', answer: 'COMPILER' },
          { id: 'default-w8', clue: 'The set of rules that define valid code structure', answer: 'SYNTAX' },
        ],
      },
    ],
    settings: { ...DEFAULT_SETTINGS },
  };
}

// A tiny JSON-file-backed store. This is intentionally the *only* place
// that touches disk, mirroring how `QuizzesContext.jsx` is the single seam
// for storage on the client. Writing a different adapter with these same
// method names and return shapes - backed by a real database instead of a
// flat file - and passing it into `createCrosswordRouter({ store })` is the
// only change needed to integrate this with the host system's own data
// layer; nothing in router.js has to change.
export function createStore({ dbPath = DEFAULT_DB_PATH } = {}) {
  let cache = null;
  let writeQueue = Promise.resolve();

  async function persist() {
    await mkdir(path.dirname(dbPath), { recursive: true });
    await writeFile(dbPath, JSON.stringify(cache, null, 2), 'utf-8');
  }

  async function ensureLoaded() {
    if (cache) return cache;
    if (existsSync(dbPath)) {
      try {
        const raw = await readFile(dbPath, 'utf-8');
        const parsed = JSON.parse(raw);
        cache = {
          quizzes: Array.isArray(parsed.quizzes) ? parsed.quizzes : [],
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
        };
        return cache;
      } catch {
        // Corrupt or unreadable file - fall through and reseed below.
      }
    }
    cache = seedDb();
    await persist();
    return cache;
  }

  // Every mutation is funneled through this queue so two requests arriving
  // close together can't interleave reads/writes of the same file and
  // clobber each other's changes.
  function mutate(fn) {
    writeQueue = writeQueue.then(async () => {
      await ensureLoaded();
      const result = await fn(cache);
      await persist();
      return result;
    });
    return writeQueue;
  }

  return {
    async getQuizzes() {
      const db = await ensureLoaded();
      return db.quizzes;
    },

    async getQuiz(quizId) {
      const db = await ensureLoaded();
      return db.quizzes.find((q) => q.id === quizId) ?? null;
    },

    createQuiz(title) {
      return mutate((db) => {
        const quiz = { id: randomUUID(), title, questions: [] };
        db.quizzes.push(quiz);
        return quiz;
      });
    },

    renameQuiz(quizId, title) {
      return mutate((db) => {
        const quiz = db.quizzes.find((q) => q.id === quizId);
        if (!quiz) return null;
        quiz.title = title;
        return quiz;
      });
    },

    deleteQuiz(quizId) {
      return mutate((db) => {
        db.quizzes = db.quizzes.filter((q) => q.id !== quizId);
        return true;
      });
    },

    addWord(quizId, word) {
      return mutate((db) => {
        const quiz = db.quizzes.find((q) => q.id === quizId);
        if (!quiz) return null;
        const entry = { id: randomUUID(), clue: '', answer: '', ...word };
        quiz.questions.push(entry);
        return entry;
      });
    },

    updateWord(quizId, wordId, updates) {
      return mutate((db) => {
        const quiz = db.quizzes.find((q) => q.id === quizId);
        if (!quiz) return null;
        const word = quiz.questions.find((w) => w.id === wordId);
        if (!word) return null;
        Object.assign(word, updates);
        return word;
      });
    },

    deleteWord(quizId, wordId) {
      return mutate((db) => {
        const quiz = db.quizzes.find((q) => q.id === quizId);
        if (!quiz) return null;
        quiz.questions = quiz.questions.filter((w) => w.id !== wordId);
        return true;
      });
    },

    async getSettings() {
      const db = await ensureLoaded();
      return db.settings;
    },

    updateSettings(updates) {
      return mutate((db) => {
        db.settings = { ...db.settings, ...updates };
        return db.settings;
      });
    },
  };
}
