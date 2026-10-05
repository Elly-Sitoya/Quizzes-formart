import { pool } from '../db/pool.js';
import { HttpError, toId } from '../utils/http.js';

function cleanSet(body) {
  const title = String(body.title ?? '').trim();
  if (!title) throw new HttpError(400, 'Title is required');
  return {
    title,
    description: String(body.description ?? '').trim(),
    language: String(body.language ?? '').trim(),
    shuffle: Boolean(body.shuffle),
    is_published: Boolean(body.is_published),
  };
}

export async function listSets(req, res) {
  const { rows } = await pool.query(`
    SELECT s.*,
      (SELECT COUNT(*)::int FROM flashcards f WHERE f.set_id = s.id) AS card_count,
      (SELECT COUNT(*)::int FROM attempts a WHERE a.set_id = s.id) AS attempt_count
    FROM flashcard_sets s
    ORDER BY s.created_at DESC
  `);
  res.json(rows);
}

export async function getSet(req, res) {
  const id = toId(req.params.id);
  const set = await pool.query('SELECT * FROM flashcard_sets WHERE id = $1', [id]);
  if (!set.rows[0]) throw new HttpError(404, 'Set not found');
  const cards = await pool.query(
    'SELECT * FROM flashcards WHERE set_id = $1 ORDER BY position, id',
    [id]
  );
  res.json({ ...set.rows[0], cards: cards.rows });
}

export async function createSet(req, res) {
  const s = cleanSet(req.body);
  const { rows } = await pool.query(
    `INSERT INTO flashcard_sets (title, description, language, shuffle, is_published)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [s.title, s.description, s.language, s.shuffle, s.is_published]
  );
  res.status(201).json(rows[0]);
}

export async function updateSet(req, res) {
  const id = toId(req.params.id);
  const s = cleanSet(req.body);
  const { rows } = await pool.query(
    `UPDATE flashcard_sets
     SET title = $2, description = $3, language = $4, shuffle = $5, is_published = $6, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, s.title, s.description, s.language, s.shuffle, s.is_published]
  );
  if (!rows[0]) throw new HttpError(404, 'Set not found');
  res.json(rows[0]);
}

export async function deleteSet(req, res) {
  const id = toId(req.params.id);
  const { rowCount } = await pool.query('DELETE FROM flashcard_sets WHERE id = $1', [id]);
  if (!rowCount) throw new HttpError(404, 'Set not found');
  res.json({ ok: true });
}

export async function reorderCards(req, res) {
  const setId = toId(req.params.id);
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(toId) : null;
  if (!ids) throw new HttpError(400, 'ids array is required');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < ids.length; i++) {
      await client.query('UPDATE flashcards SET position = $1 WHERE id = $2 AND set_id = $3', [
        i,
        ids[i],
        setId,
      ]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  res.json({ ok: true });
}

export async function getSetStats(req, res) {
  const id = toId(req.params.id);
  const summary = await pool.query(
    `SELECT COUNT(*)::int AS started,
            COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
            ROUND(AVG(score::numeric / NULLIF(total, 0)) * 100)::int AS avg_pct
     FROM attempts WHERE set_id = $1`,
    [id]
  );
  const cards = await pool.query(
    `SELECT f.id, f.position, f.card_type, f.front_text,
            COUNT(aa.id)::int AS seen,
            COUNT(aa.id) FILTER (WHERE NOT aa.correct)::int AS missed
     FROM flashcards f
     LEFT JOIN attempt_answers aa ON aa.card_id = f.id AND aa.round = 1
     WHERE f.set_id = $1
     GROUP BY f.id
     ORDER BY missed DESC, f.position`,
    [id]
  );
  res.json({ summary: summary.rows[0], cards: cards.rows });
}
