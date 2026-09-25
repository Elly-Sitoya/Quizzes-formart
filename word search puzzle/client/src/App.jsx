import { BrowserRouter } from 'react-router-dom';
import { PuzzlesProvider, WordSearchRoutes } from './wordsearch/index.js';
import './App.css';

// This file is only a standalone preview harness for running the word
// search module on its own with `npm run dev`. Everything the existing
// school management system actually needs to reuse lives under
// `src/wordsearch/` - see src/wordsearch/README.md for how to drop that
// folder into the main app instead of running it through this shell.
function App() {
  return (
    <PuzzlesProvider>
      <BrowserRouter>
        <div className="app">
          <WordSearchRoutes />
        </div>
      </BrowserRouter>
    </PuzzlesProvider>
  );
}

export default App;
