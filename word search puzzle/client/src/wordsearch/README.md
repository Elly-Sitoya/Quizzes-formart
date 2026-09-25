# Word Search module

Everything in this folder is the actual, portable feature. It only depends
on `react`, `react-dom`, and `react-router-dom` - nothing in here knows it's
running inside a Vite project, and nothing assumes it owns the whole app or
the whole URL space.

## Integrating into the existing school management system

1. Copy this whole `wordsearch/` folder into the host app's `src/`
   (or publish it as a workspace package later if the system moves to a
   monorepo - the import paths inside won't need to change either way).
2. Wrap the part of the host app that should offer word search puzzles
   with `<PuzzlesProvider>`.
3. Mount the routes anywhere in the host's own router:

   ```jsx
   import { PuzzlesProvider, WordSearchRoutes } from './wordsearch';

   <Route
     path="/quizzes/word-search/*"
     element={
       <PuzzlesProvider>
         <WordSearchRoutes />
       </PuzzlesProvider>
     }
   />
   ```

   Every link inside the module is relative ("trainer", "puzzles/:id", ".."),
   so it works correctly no matter what base path it's mounted under.

4. Alternatively, skip the router entirely and use the pieces directly -
   `LearnerHome` and `TrainerPortal` are plain components and can be placed
   on the host's own pages/tabs instead of at dedicated routes.

## Swapping local storage for the real backend

`context/PuzzlesContext.jsx` is the only file that knows puzzles are
currently persisted to `window.localStorage`. To wire this into the school
system's real API, replace the body of `loadInitialPuzzles` and the
`useEffect` that saves `puzzles` with calls to that API - every component
in this module talks to `usePuzzles()`, never to storage directly, so no
other file needs to change.

## CSS scoping

All class names in this module are prefixed `ws-` so they won't collide
with the sibling quiz apps (`fitb-`, etc.) if their styles ever end up
loaded on the same page inside the host system.
