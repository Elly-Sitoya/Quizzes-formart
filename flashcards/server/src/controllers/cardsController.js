import { pool } from '../db/pool.js';
import { CARD_TYPES, MODES } from '../config.js';
import { HttpError, toId } from '../utils/http.js';

function cleanCard(body) {
  if (!CARD_TYPES.includes(body.card_type)) throw new HttpError(400, 'Invalid card type');
  if (!MODES.includes(body.mode)) throw new HttpError(400, 'Invalid card mode');

  const front_text = String(body.front_text ?? '').trim();
  const back_text = String(body.back_text ?? '').trim();
  const back_note = String(body.back_note ?? '').trim();

  let front_image_url = body.front_image_url ? String(body.front_image_url).trim() : null;
  if (front_image_url && !/^(\/uploads\/|https?:\/\/)/.test(front_image_url)) {
    throw new HttpError(400, 'Invalid image URL');
  }

  if (!front_text && !front_image_url) {
    throw new HttpError(400, 'The front of the card needs text or an image');
  }
  if (!back_text) throw new HttpError(400, 'The back of the card needs an answer');

  let correct_verdict = null;
  if (body.mode === 'judge_first') {
    if (typeof body.correct_verdict !== 'boolean') {
      throw new HttpError(400, 'Judge-first cards need a correct/incorrect verdict');
    }
    correct_verdict = body.correct_verdict;
  }

  return {
    card_type: body.card_type,
    mode: body.mode,
    front_text,
    front_image_url,
    back_text,
    back_note,
    correct_verdict,
  };
}

export async function createCard(req, res) {
  const setId = toId(req.params.id);
  const c = cleanCard(req.body);

  const set = await pool.query('SELECT id FROM flashcard_sets WHERE id = $1', [setId]);
  if (!set.rows[0]) throw new HttpError(404, 'Set not found');

  const { rows } = await pool.query(
    `INSERT INTO flashcards
       (set_id, position, card_type, mode, front_text, front_image_url, back_text, back_note, correct_verdict)
     VALUES ($1,
       (SELECT COALESCE(MAX(position), -1) + 1 FROM flashcards WHERE set_id = $1),
       $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [setId, c.card_type, c.mode, c.front_text, c.front_image_url, c.back_text, c.back_note, c.correct_verdict]
  );
  res.status(201).json(rows[0]);
}

export async function updateCard(req, res) {
  const id = toId(req.params.id);
  const c = cleanCard(req.body);
  const { rows } = await pool.query(
    `UPDATE flashcards
     SET card_type = $2, mode = $3, front_text = $4, front_image_url = $5,
         back_text = $6, back_note = $7, correct_verdict = $8
     WHERE id = $1 RETURNING *`,
    [id, c.card_type, c.mode, c.front_text, c.front_image_url, c.back_text, c.back_note, c.correct_verdict]
  );
  if (!rows[0]) throw new HttpError(404, 'Card not found');
  res.json(rows[0]);
}

export async function deleteCard(req, res) {
  const id = toId(req.params.id);
  const { rowCount } = await pool.query('DELETE FROM flashcards WHERE id = $1', [id]);
  if (!rowCount) throw new HttpError(404, 'Card not found');
  res.json({ ok: true });
}
