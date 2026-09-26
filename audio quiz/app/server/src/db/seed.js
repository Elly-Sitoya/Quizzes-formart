// Seeds all built segments with their draft chunks, each carrying one
// recognition (MCQ) question and one application (fill-in-the-blank)
// question. Content is DRAFT — flagged for German language review before
// treating it as final (see server/ROADMAP.md and server/complete.md).
//
// Run with: npm run seed

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Segment 1: Tense Overview & Time Concept -----------------------------

const TENSE_OVERVIEW_CHUNKS = [
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

// --- Segment 2: Modalverben — Present, Past & Alternatives ----------------
// Two chunks per idea: present tense, Präteritum, and a non-modal
// "alternative" construction expressing the same meaning (see the
// alternatives-chunking question logged in ROADMAP.md §6). Alternatives
// get their own dedicated chunks here, same weight as present/past.

const MODALVERBEN_CHUNKS = [
  {
    order_index: 1,
    transcript: 'Ich muss heute Abend noch lernen.',
    time_concept_label: 'modalverb-muessen-praesens',
    questions: [
      {
        type: 'recognition',
        prompt: 'Welches Modalverb hast du gehört?',
        correct: 'a',
        options: [
          ['a', 'müssen'],
          ['b', 'können'],
          ['c', 'wollen'],
          ['d', 'dürfen'],
        ],
      },
      {
        type: 'application',
        prompt: 'Vervollständige die Lücke: Ich ___ heute Abend noch lernen.',
        correct: 'muss',
      },
    ],
  },
  {
    order_index: 2,
    transcript: 'Sie kann sehr gut Klavier spielen.',
    time_concept_label: 'modalverb-koennen-praesens',
    questions: [
      {
        type: 'recognition',
        prompt: 'Welches Modalverb hast du gehört?',
        correct: 'a',
        options: [
          ['a', 'können'],
          ['b', 'müssen'],
          ['c', 'sollen'],
          ['d', 'dürfen'],
        ],
      },
      {
        type: 'application',
        prompt: 'Vervollständige die Lücke: Sie ___ sehr gut Klavier spielen.',
        correct: 'kann',
      },
    ],
  },
  {
    order_index: 3,
    transcript: 'Ich musste gestern länger arbeiten.',
    time_concept_label: 'modalverb-muessen-praeteritum',
    questions: [
      {
        type: 'recognition',
        prompt: "In welcher Zeitform hast du das Modalverb 'müssen' gehört?",
        correct: 'b',
        options: [
          ['a', 'Präsens'],
          ['b', 'Präteritum'],
          ['c', 'Perfekt'],
          ['d', 'Futur I'],
        ],
      },
      {
        type: 'application',
        prompt: 'Vervollständige die Lücke: Ich ___ gestern länger arbeiten.',
        correct: 'musste',
      },
    ],
  },
  {
    order_index: 4,
    transcript: 'Er wollte gestern ins Kino gehen.',
    time_concept_label: 'modalverb-wollen-praeteritum',
    questions: [
      {
        type: 'recognition',
        prompt: "In welcher Zeitform hast du das Modalverb 'wollen' gehört?",
        correct: 'c',
        options: [
          ['a', 'Präsens'],
          ['b', 'Perfekt'],
          ['c', 'Präteritum'],
          ['d', 'Futur II'],
        ],
      },
      {
        type: 'application',
        prompt: 'Vervollständige die Lücke: Er ___ gestern ins Kino gehen.',
        correct: 'wollte',
      },
    ],
  },
  {
    order_index: 5,
    transcript: 'Ich habe das Projekt bis Freitag abzuschließen.',
    time_concept_label: 'modalverb-alternative-haben-zu',
    questions: [
      {
        type: 'recognition',
        prompt:
          "Welches Modalverb könnte den Satz ersetzen: 'Ich habe das Projekt bis Freitag abzuschließen.'?",
        correct: 'a',
        options: [
          ['a', 'müssen'],
          ['b', 'können'],
          ['c', 'dürfen'],
          ['d', 'wollen'],
        ],
      },
      {
        type: 'application',
        prompt:
          'Forme den Satz mit einem Modalverb um: Ich habe das Projekt bis Freitag abzuschließen. → Ich ___ das Projekt bis Freitag abschließen.',
        correct: 'muss',
      },
    ],
  },
  {
    order_index: 6,
    transcript: 'Er ist in der Lage, das Problem schnell zu lösen.',
    time_concept_label: 'modalverb-alternative-in-der-lage-sein',
    questions: [
      {
        type: 'recognition',
        prompt:
          "Welches Modalverb könnte den Satz ersetzen: 'Er ist in der Lage, das Problem schnell zu lösen.'?",
        correct: 'a',
        options: [
          ['a', 'können'],
          ['b', 'müssen'],
          ['c', 'dürfen'],
          ['d', 'sollen'],
        ],
      },
      {
        type: 'application',
        prompt:
          'Forme den Satz mit einem Modalverb um: Er ist in der Lage, das Problem schnell zu lösen. → Er ___ das Problem schnell lösen.',
        correct: 'kann',
      },
    ],
  },
];

const SEGMENTS = [
  {
    slug: 'tense-overview-time-concept',
    title: 'Tense Overview & Time Concept',
    description:
      'How German situates events in time relative to each other, across Präsens, Perfekt, Präteritum, Plusquamperfekt, Futur I and Futur II.',
    order_index: 1,
    chunks: TENSE_OVERVIEW_CHUNKS,
  },
  {
    slug: 'modalverben',
    title: 'Modalverben — Present, Past & Alternatives',
    description:
      'How German modal verbs work in the present and in Präteritum, and how the same meaning can be expressed without a modal verb at all.',
    order_index: 2,
    chunks: MODALVERBEN_CHUNKS,
  },
];

async function seedSegment(client, segment) {
  const segmentResult = await client.query(
    `INSERT INTO segments (slug, title, description, order_index)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
     RETURNING id`,
    [segment.slug, segment.title, segment.description, segment.order_index]
  );
  const segmentId = segmentResult.rows[0].id;

  // Upsert chunks/questions in place instead of delete-and-reinsert. A
  // question that already has answers recorded in session_answers can't be
  // deleted (see the FK in schema.sql) — and shouldn't be, since that would
  // invalidate a learner's quiz history. Reseeding should refresh content,
  // not erase history, so each chunk/question keeps its identity (matched
  // by segment/chunk + order_index) across runs and only its fields change.
  for (const chunk of segment.chunks) {
    const chunkResult = await client.query(
      `INSERT INTO chunks (segment_id, order_index, audio_url, transcript, time_concept_label)
       VALUES ($1, $2, NULL, $3, $4)
       ON CONFLICT (segment_id, order_index) DO UPDATE
         SET transcript = EXCLUDED.transcript,
             time_concept_label = EXCLUDED.time_concept_label
       RETURNING id`,
      [segmentId, chunk.order_index, chunk.transcript, chunk.time_concept_label]
    );
    const chunkId = chunkResult.rows[0].id;

    let qOrder = 1;
    for (const q of chunk.questions) {
      const questionResult = await client.query(
        `INSERT INTO questions (chunk_id, question_type, prompt, correct_answer, order_index)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (chunk_id, order_index) DO UPDATE
           SET question_type = EXCLUDED.question_type,
               prompt = EXCLUDED.prompt,
               correct_answer = EXCLUDED.correct_answer
         RETURNING id`,
        [chunkId, q.type, q.prompt, q.correct, qOrder++]
      );
      const questionId = questionResult.rows[0].id;

      // Options carry no history of their own (session_answers stores the
      // submitted text/key, not an option id), so they're safe to replace
      // outright on every run.
      await client.query('DELETE FROM question_options WHERE question_id = $1', [questionId]);

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

  return segment.chunks.length;
}

async function main() {
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schemaSql);
  console.log('Schema ensured.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const segment of SEGMENTS) {
      const count = await seedSegment(client, segment);
      console.log(`Seeded "${segment.title}" with ${count} chunks.`);
    }

    await client.query('COMMIT');
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
