import { Router } from 'express';
import { createStore } from './store/jsonFileStore.js';

// The whole feature's backend, self-contained as one Express Router. A host
// app just mounts this wherever it wants (`app.use('/api/crossword', ...)`)
// - it makes no assumption about its own base path, so it slots in next to
// whatever else the host's API already serves.
//
// Pass `{ store }` to back this with the host's own database instead of the
// default JSON file - see jsonFileStore.js for the method shapes to match.
export function createCrosswordRouter({ store } = {}) {
  const db = store ?? createStore();
  const router = Router();

  router.get('/quizzes', async (req, res, next) => {
    try {
      res.json(await db.getQuizzes());
    } catch (err) {
      next(err);
    }
  });

  router.post('/quizzes', async (req, res, next) => {
    try {
      const title = (req.body?.title ?? '').trim();
      if (!title) return res.status(400).json({ error: 'title is required' });
      res.status(201).json(await db.createQuiz(title));
    } catch (err) {
      next(err);
    }
  });

  router.get('/quizzes/:quizId', async (req, res, next) => {
    try {
      const quiz = await db.getQuiz(req.params.quizId);
      if (!quiz) return res.status(404).json({ error: 'quiz not found' });
      res.json(quiz);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/quizzes/:quizId', async (req, res, next) => {
    try {
      const title = (req.body?.title ?? '').trim();
      if (!title) return res.status(400).json({ error: 'title is required' });
      const quiz = await db.renameQuiz(req.params.quizId, title);
      if (!quiz) return res.status(404).json({ error: 'quiz not found' });
      res.json(quiz);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/quizzes/:quizId', async (req, res, next) => {
    try {
      await db.deleteQuiz(req.params.quizId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  router.post('/quizzes/:quizId/words', async (req, res, next) => {
    try {
      const { clue = '', answer = '' } = req.body ?? {};
      const word = await db.addWord(req.params.quizId, { clue, answer });
      if (!word) return res.status(404).json({ error: 'quiz not found' });
      res.status(201).json(word);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/quizzes/:quizId/words/:wordId', async (req, res, next) => {
    try {
      const updates = {};
      if (typeof req.body?.clue === 'string') updates.clue = req.body.clue;
      if (typeof req.body?.answer === 'string') updates.answer = req.body.answer;
      const word = await db.updateWord(req.params.quizId, req.params.wordId, updates);
      if (!word) return res.status(404).json({ error: 'word not found' });
      res.json(word);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/quizzes/:quizId/words/:wordId', async (req, res, next) => {
    try {
      await db.deleteWord(req.params.quizId, req.params.wordId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  router.get('/settings', async (req, res, next) => {
    try {
      res.json(await db.getSettings());
    } catch (err) {
      next(err);
    }
  });

  router.patch('/settings', async (req, res, next) => {
    try {
      res.json(await db.updateSettings(req.body ?? {}));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
