import { pool } from '../db/pool.js';

// GET /api/segments/:slug
// Returns the segment plus its ordered chunks, each with its questions and
// options — correct_answer is withheld so the client can never read it
// off the network response.
export async function getSegmentBySlug(req, res) {
  const { slug } = req.params;

  try {
    const segmentResult = await pool.query('SELECT * FROM segments WHERE slug = $1', [slug]);
    if (segmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    const segment = segmentResult.rows[0];

    const chunksResult = await pool.query(
      'SELECT * FROM chunks WHERE segment_id = $1 ORDER BY order_index ASC',
      [segment.id]
    );

    const chunks = [];
    for (const chunk of chunksResult.rows) {
      const questionsResult = await pool.query(
        'SELECT id, question_type, prompt, order_index FROM questions WHERE chunk_id = $1 ORDER BY order_index ASC',
        [chunk.id]
      );

      const questions = [];
      for (const question of questionsResult.rows) {
        const optionsResult = await pool.query(
          'SELECT option_key, option_text FROM question_options WHERE question_id = $1 ORDER BY option_key ASC',
          [question.id]
        );
        questions.push({
          ...question,
          options: optionsResult.rows,
        });
      }

      chunks.push({
        id: chunk.id,
        order_index: chunk.order_index,
        audio_url: chunk.audio_url,
        transcript: chunk.transcript,
        time_concept_label: chunk.time_concept_label,
        questions,
      });
    }

    res.json({ segment, chunks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load segment' });
  }
}
