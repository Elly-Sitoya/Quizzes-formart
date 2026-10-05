import { pool } from '../db/pool.js';
import { HttpError, toId } from '../utils/http.js';

export async function listPublishedSets(req, res) {
  const learnerKey = String(req.query.learner_key ?? '');
  const { rows } = await pool.query(
    `SELECT s.id, s.title, s.description, s.language,
            (SELECT COUNT(*)::int FROM flashcards f WHERE f.set_id = s.id) AS card_count,
            la.id AS attempt_id, la.status, la.score, la.total,
            COALESCE((SELECT COUNT(*)::int FROM attempt_answers aa
                      WHERE aa.attempt_id = la.id AND aa.round = 1), 0) AS answered
     FROM flashcard_sets s
     LEFT JOIN LATERAL (
       SELECT * FROM attempts a
       WHERE a.set_id = s.id AND a.learner_key = $1
       ORDER BY a.started_at DESC, a.id DESC LIMIT 1
     ) la ON TRUE
     WHERE s.is_published
       AND EXISTS (SELECT 1 FROM flashcards f WHERE f.set_id = s.id)
     ORDER BY s.created_at DESC`,
    [learnerKey]
  );
  res.json(rows.map((r) => ({ ...r, status: r.status ?? 'not_started' })));
}

export async function getPublishedSet(req, res) {
  const id = toId(req.params.id);
  const set = await pool.query(
    `SELECT id, title, description, language, shuffle
     FROM flashcard_sets WHERE id = $1 AND is_published`,
    [id]
  );
  if (!set.rows[0]) throw new HttpError(404, 'Set not found');
  const cards = await pool.query(
    `SELECT id, position, card_type, mode, front_text, front_image_url,
            back_text, back_note, correct_verdict
     FROM flashcards WHERE set_id = $1 ORDER BY position, id`,
    [id]
  );
  res.json({ ...set.rows[0], cards: cards.rows });
}
