# Integrating into the school management system

This app is built so it can be dropped into the existing system as a
feature, not run only as its own standalone site.

- Every real piece of the feature - components, the crossword generator,
  the quiz/settings context - lives under `src/` and never imports anything
  Vite-specific. `vite.config.js`, `index.html`, and `src/main.jsx` are only
  the standalone dev/build harness used for working on this app in
  isolation; the host app doesn't need any of them.
- To embed it, render `<App />` (from `src/App.jsx`) anywhere in the host
  app's tree. It brings its own `QuizzesProvider` and its own routes
  (`/`, `/trainer`, `/trainer/quizzes/:quizId`), so nothing else needs to be
  wired up first.
- If the host app already owns the browser's router, pass a `basename`
  (e.g. `<App basename="/quizzes/crossword" />`) so this feature's routes
  live under a sub-path instead of assuming they own the whole URL.
- Data currently persists to `localStorage` (`crossword-quizzes` and
  `crossword-settings`) so it works with zero backend setup. `src/context/QuizzesContext.jsx`
  is the single place that reads/writes that data - swapping those calls for
  real API requests is the only change needed to back this with a shared
  database instead of the browser's local storage.
