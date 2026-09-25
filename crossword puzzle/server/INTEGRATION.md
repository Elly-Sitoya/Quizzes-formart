# Integrating into the school management system

This service is built so the host backend can mount it as a feature, not
run it only as its own standalone server.

- The real piece of the feature is `src/router.js`'s `createCrosswordRouter()`
  - a plain Express `Router` that makes no assumption about what it's
  mounted under. `src/index.js` is only the standalone dev harness
  (`npm run dev`) used to run this service on its own; the host backend
  doesn't need it.
- To embed it, mount the router wherever it should live in the host's own
  Express app, e.g.:

  ```js
  import { createCrosswordRouter } from './crossword-puzzle/server/src/router.js';
  app.use('/api/crossword', createCrosswordRouter());
  ```

- Data currently persists to a flat JSON file (`src/data/db.json`) via
  `src/store/jsonFileStore.js`, so it works with zero database setup. That
  file is the single place that reads/writes storage - passing a different
  store into `createCrosswordRouter({ store })` (same method names:
  `getQuizzes`, `createQuiz`, `renameQuiz`, `deleteQuiz`, `getQuiz`,
  `addWord`, `updateWord`, `deleteWord`, `getSettings`, `updateSettings`) is
  the only change needed to back this with the host's real database instead.
- Endpoints (all relative to wherever the router gets mounted):
  - `GET /quizzes`, `POST /quizzes`
  - `GET /quizzes/:id`, `PATCH /quizzes/:id`, `DELETE /quizzes/:id`
  - `POST /quizzes/:id/words`
  - `PATCH /quizzes/:id/words/:wordId`, `DELETE /quizzes/:id/words/:wordId`
  - `GET /settings`, `PATCH /settings`
- The seed quiz (`Core Terms in Software Engineering`) matches the one
  already baked into the client's `QuizzesContext`, so a fresh client and a
  fresh server agree out of the box even before the two are wired together.
- The client currently talks to `localStorage`, not this API - see the
  client's own `INTEGRATION.md` for the one place (`QuizzesContext.jsx`) to
  point at these endpoints instead, once both sides are ready to connect.
