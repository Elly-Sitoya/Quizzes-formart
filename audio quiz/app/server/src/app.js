import express from 'express';
import cors from 'cors';
import segmentsRouter from './routes/segments.js';
import sessionsRouter from './routes/sessions.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/segments', segmentsRouter);
app.use('/api/sessions', sessionsRouter);

export default app;
