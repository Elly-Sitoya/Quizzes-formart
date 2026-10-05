import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const UPLOAD_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'uploads'
);

export const CARD_TYPES = [
  'translation',
  'picture_word',
  'fill_blank',
  'correct_incorrect',
  'conjugation',
  'odd_one_out',
  'idiom',
  'synonym_antonym',
  'word_order',
  'say_aloud',
  'article_gender',
];

export const MODES = ['self_check', 'judge_first'];
