import { pool } from './pool.js';

const CARDS = [
  { type: 'translation', mode: 'self_check', front: 'der Apfel', back: 'the apple', note: 'Plural: die Äpfel' },
  { type: 'translation', mode: 'self_check', front: 'Guten Morgen', back: 'Good morning', note: 'Used until about 10–11 am.' },
  { type: 'fill_blank', mode: 'self_check', front: 'Ich ___ aus Kenia. (kommen)', back: 'komme', note: 'ich → verb stem + -e' },
  {
    type: 'correct_incorrect',
    mode: 'judge_first',
    front: 'Ich habe gestern ins Kino gegangen.',
    back: 'Ich bin gestern ins Kino gegangen.',
    note: 'Verbs of movement like gehen use sein in the Perfekt.',
    verdict: false,
  },
  {
    type: 'correct_incorrect',
    mode: 'judge_first',
    front: 'Wir sind nach Hause gefahren.',
    back: 'Wir sind nach Hause gefahren.',
    note: 'fahren (movement) takes sein — well spotted.',
    verdict: true,
  },
  { type: 'article_gender', mode: 'self_check', front: 'Mädchen', back: 'das Mädchen', note: 'Words ending in -chen are always neuter.' },
  { type: 'odd_one_out', mode: 'self_check', front: 'Montag · Dienstag · Mai · Freitag', back: 'Mai', note: 'It is a month; the others are weekdays.' },
  { type: 'word_order', mode: 'self_check', front: 'gern / Ich / Fußball / spiele', back: 'Ich spiele gern Fußball.', note: 'Verb in second position.' },
  { type: 'say_aloud', mode: 'self_check', front: 'Entschuldigung', back: 'ent-SHUL-dee-goong', note: 'Means "excuse me" / "sorry". Say it aloud first, then flip.' },
];

try {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM flashcard_sets');
  if (rows[0].n > 0) {
    console.log('Sets already exist — seed skipped.');
  } else {
    const set = await pool.query(
      `INSERT INTO flashcard_sets (title, description, language, shuffle, is_published)
       VALUES ($1, $2, $3, $4, TRUE) RETURNING id`,
      ['Everyday German', 'Warm-up cards: words, sentences and a little grammar.', 'German', false]
    );
    const setId = set.rows[0].id;
    for (let i = 0; i < CARDS.length; i++) {
      const c = CARDS[i];
      await pool.query(
        `INSERT INTO flashcards (set_id, position, card_type, mode, front_text, back_text, back_note, correct_verdict)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [setId, i, c.type, c.mode, c.front, c.back, c.note, c.mode === 'judge_first' ? c.verdict : null]
      );
    }
    console.log(`Seeded "Everyday German" with ${CARDS.length} cards.`);
  }
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
