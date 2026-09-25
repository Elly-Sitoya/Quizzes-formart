-- Audio Quiz prototype schema
-- Segment: "Tense Overview & Time Concept"

CREATE TABLE IF NOT EXISTS segments (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- One meaningful chunk within a segment.
-- audio_url is nullable for the prototype: when NULL, the client falls back
-- to speaking `transcript` aloud via the browser's speech synthesis (de-DE),
-- as a stand-in for a real recorded/produced audio clip.
CREATE TABLE IF NOT EXISTS chunks (
  id SERIAL PRIMARY KEY,
  segment_id INT REFERENCES segments(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  audio_url TEXT,
  transcript TEXT NOT NULL,
  time_concept_label VARCHAR(100),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  chunk_id INT REFERENCES chunks(id) ON DELETE CASCADE,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('recognition', 'application')),
  prompt TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  order_index INT NOT NULL
);

CREATE TABLE IF NOT EXISTS question_options (
  id SERIAL PRIMARY KEY,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_key VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id SERIAL PRIMARY KEY,
  segment_id INT REFERENCES segments(id),
  started_at TIMESTAMP DEFAULT now(),
  finished_at TIMESTAMP,
  score INT,
  total_questions INT
);

CREATE TABLE IF NOT EXISTS session_answers (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id INT REFERENCES questions(id),
  submitted_answer TEXT NOT NULL,
  is_correct BOOLEAN,
  submitted_at TIMESTAMP DEFAULT now()
);
