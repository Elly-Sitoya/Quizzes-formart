import { pool } from '../db/pool.js';
import { isCorrect } from '../services/scoring.js';

// POST /api/sessions  { segment_id }
export async function startSession(req, res) {
  const { segment_id } = req.body;
  if (!segment_id) return res.status(400).json({ error: 'segment_id is required' });

  try {
    const totalResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM questions q
       JOIN chunks c ON c.id = q.chunk_id
       WHERE c.segment_id = $1`,
      [segment_id]
    );
    const total_questions = totalResult.rows[0].total;

    const sessionResult = await pool.query(
      `INSERT INTO quiz_sessions (segment_id, total_questions)
       VALUES ($1, $2)
       RETURNING id, segment_id, started_at, total_questions`,
      [segment_id, total_questions]
    );

    res.status(201).json(sessionResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start session' });
  }
}

// POST /api/sessions/:id/answers  { question_id, submitted_answer }
// Stores the answer only. Correctness is intentionally NOT computed or
// returned here — no mid-session feedback, per the product spec.
export async function submitAnswer(req, res) {
  const { id } = req.params;
  const { question_id, submitted_answer } = req.body;

  if (!question_id || submitted_answer === undefined) {
    return res.status(400).json({ error: 'question_id and submitted_answer are required' });
  }

  try {
    await pool.query(
      `INSERT INTO session_answers (session_id, question_id, submitted_answer)
       VALUES ($1, $2, $3)`,
      [id, question_id, submitted_answer]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
}

// POST /api/sessions/:id/finish
// Scores every stored answer for this session, then closes it out.
export async function finishSession(req, res) {
  const { id } = req.params;

  try {
    const answersResult = await pool.query(
      `SELECT sa.id AS session_answer_id, sa.submitted_answer, q.id AS question_id,
              q.question_type, q.correct_answer
       FROM session_answers sa
       JOIN questions q ON q.id = sa.question_id
       WHERE sa.session_id = $1`,
      [id]
    );

    let score = 0;
    for (const row of answersResult.rows) {
      const correct = isCorrect(row, row.submitted_answer);
      if (correct) score += 1;
      await pool.query('UPDATE session_answers SET is_correct = $1 WHERE id = $2', [
        correct,
        row.session_answer_id,
      ]);
    }

    const updated = await pool.query(
      `UPDATE quiz_sessions
       SET finished_at = now(), score = $1
       WHERE id = $2
       RETURNING id, score, total_questions, started_at, finished_at`,
      [score, id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to finish session' });
  }
}

// GET /api/sessions/:id/results
// Only meaningful after finishSession has run — reveals correct answers.
export async function getResults(req, res) {
  const { id } = req.params;

  try {
    const sessionResult = await pool.query('SELECT * FROM quiz_sessions WHERE id = $1', [id]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const session = sessionResult.rows[0];

    const breakdownResult = await pool.query(
      `SELECT sa.submitted_answer, sa.is_correct, q.prompt, q.question_type,
              q.correct_answer, c.transcript, c.order_index AS chunk_order
       FROM session_answers sa
       JOIN questions q ON q.id = sa.question_id
       JOIN chunks c ON c.id = q.chunk_id
       WHERE sa.session_id = $1
       ORDER BY c.order_index ASC, q.order_index ASC`,
      [id]
    );

    res.json({ session, breakdown: breakdownResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load results' });
  }
}
