import cors from 'cors';
import express from 'express';
import { createCrosswordRouter } from './router.js';

// Standalone entry point, used only when this service runs on its own
// (npm run dev). When it's dropped into the existing school management
// system's backend, the host app can skip this file entirely and just
// mount createCrosswordRouter() (see src/router.js) under whatever path
// and port its own API already runs on.
const PORT = process.env.PORT || 4001;

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/crossword', createCrosswordRouter());

app.listen(PORT, () => {
  console.log(`Crossword quiz API listening on http://localhost:${PORT}/api/crossword`);
});
