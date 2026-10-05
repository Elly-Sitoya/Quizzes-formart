import { pool } from '../db/pool.js';
import { HttpError, toId } from '../utils/http.js';

const ATTEMPT_COLS = 'id, set_id, status, score, total, started_at, completed_at';

async function loadAnswers(attemptId) {
  const { rows } = await pool.query(
    'SELECT card_id, round, correct FROM attempt_answers WHERE attempt_id = $1 ORDER BY round, id',
    [attemptId]
  );
  return rows;
}

export async function startAttempt(req, res) {
  const setId = toId(req.body.set_id);
  const learnerKey = String(req.body.learner_key ?? '').trim();
  if (!learnerKey) throw new HttpError(400, 'learner_key is required');

  const set = await pool.query(
    'SELECT id FROM flashcard_sets WHERE id = $1 AND is_published',
    [setId]
  );
  if (!set.rows[0]) throw new HttpError(404, 'Set not found');

  const existing = await pool.query(
    `SELECT ${ATTEMPT_COLS} FROM attempts
     WHERE set_id = $1 AND learner_key = $2 AND status = 'in_progress'
     ORDER BY id DESC LIMIT 1`,
    [setId, learnerKey]
  );

  let attempt = existing.rows[0];
  if (!attempt) {
    const created = await pool.query(
      `INSERT INTO attempts (set_id, learner_key) VALUES ($1, $2) RETURNING ${ATTEMPT_COLS}`,
      [setId, learnerKey]
    );
    attempt = created.rows[0];
  }

  res.json({ attempt, answers: await loadAnswers(attempt.id) });
}

export async function saveAnswer(req, res) {
  const attemptId = toId(req.params.id);
  const cardId = toId(req.body.card_id);
  const round = Number(req.body.round);
  if (!Number.isInteger(round) || round < 1) throw new HttpError(400, 'Invalid round');
  if (typeof req.body.correct !== 'boolean') throw new HttpError(400, 'correct must be a boolean');

  const attempt = await pool.query('SELECT set_id, status FROM attempts WHERE id = $1', [attemptId]);
  if (!attempt.rows[0]) throw new HttpError(404, 'Attempt not found');
  if (attempt.rows[0].status !== 'in_progress') throw new HttpError(409, 'Attempt already finished');

  const card = await pool.query('SELECT id FROM flashcards WHERE id = $1 AND set_id = $2', [
    cardId,
    attempt.rows[0].set_id,
  ]);
  if (!card.rows[0]) throw new HttpError(400, 'Card does not belong to this set');

  await pool.query(
    `INSERT INTO attempt_answers (attempt_id, card_id, round, correct)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (attempt_id, card_id, round)
     DO UPDATE SET correct = EXCLUDED.correct, answered_at = NOW()`,
    [attemptId, cardId, round, req.body.correct]
  );
  res.json({ ok: true });
}

export async function finishAttempt(req, res) {
  const attemptId = toId(req.params.id);
  const found = await pool.query(`SELECT ${ATTEMPT_COLS} FROM attempts WHERE id = $1`, [attemptId]);
  const current = found.rows[0];
  if (!current) throw new HttpError(404, 'Attempt not found');
  if (current.status === 'completed') return res.json({ attempt: current });

  const { rows } = await pool.query(
    `UPDATE attempts SET
       status = 'completed',
       completed_at = NOW(),
       total = (SELECT COUNT(*)::int FROM flashcards WHERE set_id = attempts.set_id),
       score = (SELECT COUNT(*)::int FROM attempt_answers
                WHERE attempt_id = attempts.id AND round = 1 AND correct)
     WHERE id = $1 RETURNING ${ATTEMPT_COLS}`,
    [attemptId]
  );
  res.json({ attempt: rows[0] });
}
