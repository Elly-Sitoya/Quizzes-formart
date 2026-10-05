import express from 'express';
import cors from 'cors';
import { UPLOAD_DIR } from './config.js';
import setsRouter from './routes/sets.js';
import cardsRouter from './routes/cards.js';
import studentRouter from './routes/student.js';
import attemptsRouter from './routes/attempts.js';
import uploadsRouter from './routes/uploads.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/sets', setsRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/student', studentRouter);
app.use('/api/attempts', attemptsRouter);
app.use('/api/uploads', uploadsRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status >= 500) console.error(err);
  const message =
    err.code === 'LIMIT_FILE_SIZE'
      ? 'Image is too large (max 5 MB)'
      : status >= 500
        ? 'Internal server error'
        : err.message;
  res.status(status).json({ error: message });
});

export default app;
