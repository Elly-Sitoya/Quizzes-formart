CREATE TABLE IF NOT EXISTS flashcard_sets (
  id           SERIAL PRIMARY KEY,
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  language     TEXT        NOT NULL DEFAULT '',
  shuffle      BOOLEAN     NOT NULL DEFAULT FALSE,
  is_published BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flashcards (
  id               SERIAL PRIMARY KEY,
  set_id           INTEGER     NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  position         INTEGER     NOT NULL DEFAULT 0,
  card_type        TEXT        NOT NULL,
  mode             TEXT        NOT NULL CHECK (mode IN ('self_check', 'judge_first')),
  front_text       TEXT        NOT NULL DEFAULT '',
  front_image_url  TEXT,
  back_text        TEXT        NOT NULL DEFAULT '',
  back_note        TEXT        NOT NULL DEFAULT '',
  correct_verdict  BOOLEAN,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_set ON flashcards (set_id, position);

CREATE TABLE IF NOT EXISTS attempts (
  id           SERIAL PRIMARY KEY,
  set_id       INTEGER     NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  learner_key  TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  score        INTEGER,
  total        INTEGER,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_attempts_learner ON attempts (learner_key, set_id);

CREATE TABLE IF NOT EXISTS attempt_answers (
  id          SERIAL PRIMARY KEY,
  attempt_id  INTEGER     NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  card_id     INTEGER     NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  round       INTEGER     NOT NULL DEFAULT 1,
  correct     BOOLEAN     NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (attempt_id, card_id, round)
);
