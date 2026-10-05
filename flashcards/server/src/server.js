import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 4100;

app.listen(PORT, () => {
  console.log(`Flashcards server listening on http://localhost:${PORT}`);
});
