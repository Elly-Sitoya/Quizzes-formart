// Seeds the "Tense Overview & Time Concept" segment with 6 draft chunks,
// each carrying one recognition (MCQ) question and one application
// (fill-in-the-blank) question. Content is DRAFT — flagged for German
// language review before treating it as final (see server/complete.md).
//
// Run with: npm run seed

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHUNKS = [
  {
    order_index: 1,
    transcript: 'Ich lerne jeden Tag Deutsch.',
    time_concept_label: 'praesens-habitual',
    questions: [
      {
        type: 'recognition',
        prompt: 'Welche Zeitform hast du gehört?',
        correct: 'a',
        options: [
          ['a', 'Präsens'],
          ['b', 'Perfekt'],
          ['c', 'Präteritum'],
          ['d', 'Plusquamperfekt'],
        ],
      },
      {
        type: 'application',
        prompt: "Vervollständige die Lücke: Ich ___ (lernen) jeden Tag Deutsch.",
        correct: 'lerne',
      },
    ],
  },
  {
    order_index: 2,
    transcript: 'Ich habe gestern ein Buch gelesen.',
    time_concept_label: 'perfekt-spoken-past',
    questions: [
      {
        type: 'recognition',
        prompt: 'Welche Zeitform hast du gehört?',
        correct: 'b',
        options: [
          ['a', 'Präsens'],
          ['b', 'Perfekt'],
          ['c', 'Präteritum'],
          ['d', 'Futur I'],
        ],
      },
      {
        type: 'application',
        prompt: "Vervollständige die Lücke: Ich ___ gestern ein Buch gelesen.",
        correct: 'habe',
      },
    ],
  },
  {
    order_index: 3,
    transcript: 'Er ging langsam durch den Park.',
    time_concept_label: 'praeteritum-narrative-past',
    questions: [
      {
        type: 'recognition',
        prompt: 'Welche Zeitform hast du gehört?',
        correct: 'b',
        options: [
          ['a', 'Perfekt'],
          ['b', 'Präteritum'],
          ['c', 'Plusquamperfekt'],
          ['d', 'Futur II'],
        ],
      },
      {
        type: 'application',
        prompt: "Vervollständige die Lücke: Er ___ (gehen) langsam durch den Park.",
        correct: 'ging',
      },
    ],
  },
  {
    order_index: 4,
    transcript: 'Bevor ich ankam, hatte er schon gegessen.',
    time_concept_label: 'plusquamperfekt-precedence',
    questions: [
      {
        type: 'recognition',
        prompt:
          'Welche Zeitform zeigt, dass etwas VOR einem anderen Vergangenheits-Ereignis passierte?',
        correct: 'c',
        options: [
          ['a', 'Perfekt'],
          ['b', 'Präteritum'],
          ['c', 'Plusquamperfekt'],
          ['d', 'Futur I'],
        ],
      },
      {
        type: 'application',
        prompt: 'Vervollständige die Lücke: Bevor ich ankam, ___ er schon gegessen.',
        correct: 'hatte',
      },
    ],
  },
  {
    order_index: 5,
    transcript: 'Ich werde morgen einkaufen gehen.',
    time_concept_label: 'futur-1-intention',
    questions: [
      {
        type: 'recognition',
        prompt: 'Welche Zeitform hast du gehört?',
        correct: 'c',
        options: [
          ['a', 'Präsens'],
          ['b', 'Perfekt'],
          ['c', 'Futur I'],
          ['d', 'Futur II'],
        ],
      },
      {
        type: 'application',
        prompt: 'Vervollständige die Lücke: Ich ___ morgen einkaufen gehen.',
        correct: 'werde',
      },
    ],
  },
  {
    order_index: 6,
    transcript: 'Bis nächste Woche werde ich das Projekt beendet haben.',
    time_concept_label: 'futur-2-completed-by-future-point',
    questions: [
      {
        type: 'recognition',
        prompt:
          'Welche Zeitform zeigt, dass etwas bis zu einem zukünftigen Zeitpunkt ABGESCHLOSSEN sein wird?',
        correct: 'b',
        options: [
          ['a', 'Futur I'],
          ['b', 'Futur II'],
          ['c', 'Perfekt'],
          ['d', 'Plusquamperfekt'],
        ],
      },
      {
        type: 'application',
        prompt: 'Vervollständige die Lücke: Bis nächste Woche ___ ich das Projekt beendet haben.',
        correct: 'werde',
      },
    ],
  },
];

async function main() {
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schemaSql);
  console.log('Schema ensured.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const segmentResult = await client.query(
      `INSERT INTO segments (slug, title, description, order_index)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
       RETURNING id`,
      [
        'tense-overview-time-concept',
        'Tense Overview & Time Concept',
        'How German situates events in time relative to each other, across Präsens, Perfekt, Präteritum, Plusquamperfekt, Futur I and Futur II.',
        1,
      ]
    );
    const segmentId = segmentResult.rows[0].id;

    // Clear any previous chunks for a clean reseed.
    await client.query('DELETE FROM chunks WHERE segment_id = $1', [segmentId]);

    for (const chunk of CHUNKS) {
      const chunkResult = await client.query(
        `INSERT INTO chunks (segment_id, order_index, audio_url, transcript, time_concept_label)
         VALUES ($1, $2, NULL, $3, $4)
         RETURNING id`,
        [segmentId, chunk.order_index, chunk.transcript, chunk.time_concept_label]
      );
      const chunkId = chunkResult.rows[0].id;

      let qOrder = 1;
      for (const q of chunk.questions) {
        const questionResult = await client.query(
          `INSERT INTO questions (chunk_id, question_type, prompt, correct_answer, order_index)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [chunkId, q.type, q.prompt, q.correct, qOrder++]
        );
        const questionId = questionResult.rows[0].id;

        if (q.options) {
          for (const [key, text] of q.options) {
            await client.query(
              `INSERT INTO question_options (question_id, option_text, option_key)
               VALUES ($1, $2, $3)`,
              [questionId, text, key]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('Seeded "Tense Overview & Time Concept" with 6 chunks.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
