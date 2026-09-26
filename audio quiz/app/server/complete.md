# Implementation Plan — Audio Quiz App (Working Prototype)
## Segment: "Tense Overview & Time Concept"

> Status: DRAFT for implementation, to be verified/refined after prototype review.
> Stack: React (client) · Node/Express (server) · PostgreSQL (db)
> Scope: ONE segment only, end-to-end, to validate the core audio-quiz mechanic before scaling to the other six segments (Modalverben, Passiv, Nomen-Verb-Verbindungen, Adjective mastery, Konjunktionen & Satzverbindungen, Nominalisierung).

---

## 1. Core Mechanic (locked assumptions for this prototype)

1. One audio-quiz session = one grammar segment.
2. The segment's audio is split into **meaningful chunks** (not fixed time intervals) — each chunk is one demonstrated instance of a time/tense concept.
3. Audio **auto-pauses** at the end of each chunk.
4. A question appears per chunk, combining:
   - **Recognition** — "what did you just hear?" (identify tense/time relation)
   - **Application** — "produce/complete the correct form"
5. Student may **replay only the current chunk** before answering (not earlier chunks — flagged as open question, see §8).
6. Once submitted, an answer is **locked immediately** (flagged as open question, see §8).
7. **No right/wrong feedback** is shown per chunk — only a progress indicator (e.g. "Chunk 3 of 6").
8. Full **results/score screen** appears only after the final chunk.
9. Progression is **forward-only**; no skipping chunks.

For this prototype, we default to **Mode B (test-style)**: no in-audio teaching explanation, just spoken examples + questions. Mode A (teaching pass) is deferred (see §8).

---

## 2. Content Model — "Tense Overview & Time Concept"

Unlike a single-tense segment, this one is about **how German situates events in time relative to each other**, not the mechanics of one tense. Each chunk should isolate one time-relation idea:

| Chunk | Time concept illustrated | Tense used |
|---|---|---|
| 1 | Ongoing/habitual present | Präsens |
| 2 | Completed past action (spoken register) | Perfekt |
| 3 | Narrated past action (written/story register) | Präteritum |
| 4 | An action completed *before* another past action | Plusquamperfekt |
| 5 | A future action/intention | Futur I |
| 6 | An action that *will have been completed* by a future point | Futur II |

### Draft placeholder script (FOR REVIEW — not final German content)
This is seed content only so the prototype has something real to play/test with. Flagged for language review together before it's treated as final:

1. Präsens: *"Ich lerne jeden Tag Deutsch."*
2. Perfekt: *"Ich habe gestern ein Buch gelesen."*
3. Präteritum: *"Er ging langsam durch den Park."*
4. Plusquamperfekt: *"Bevor ich ankam, hatte er schon gegessen."*
5. Futur I: *"Ich werde morgen einkaufen gehen."*
6. Futur II: *"Bis nächste Woche werde ich das Projekt beendet haben."*

Each needs: a short recorded/TTS audio clip, one recognition question (multiple choice of tense/time-relation), one application question (e.g. transform a given Präsens sentence into the target form).

---

## 3. Database Schema (PostgreSQL)

```sql
-- A grammar segment (one per topic in the syllabus)
CREATE TABLE segments (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,       -- e.g. 'tense-overview-time-concept'
  title VARCHAR(200) NOT NULL,
  description TEXT,
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- One meaningful audio chunk within a segment
CREATE TABLE chunks (
  id SERIAL PRIMARY KEY,
  segment_id INT REFERENCES segments(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  audio_url TEXT NOT NULL,
  transcript TEXT,                          -- German text, for later reference/review
  time_concept_label VARCHAR(100),          -- e.g. 'plusquamperfekt-precedence'
  created_at TIMESTAMP DEFAULT now()
);

-- A question tied to a chunk (recognition OR application)
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  chunk_id INT REFERENCES chunks(id) ON DELETE CASCADE,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('recognition','application')),
  prompt TEXT NOT NULL,
  correct_answer TEXT NOT NULL,             -- for MCQ: matches an option id; for text: exact/normalized string
  order_index INT NOT NULL
);

-- Multiple-choice options (nullable-use: only for MCQ questions)
CREATE TABLE question_options (
  id SERIAL PRIMARY KEY,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_key VARCHAR(10) NOT NULL           -- 'a','b','c','d'
);

-- One student attempt at a segment
CREATE TABLE quiz_sessions (
  id SERIAL PRIMARY KEY,
  segment_id INT REFERENCES segments(id),
  started_at TIMESTAMP DEFAULT now(),
  finished_at TIMESTAMP,
  score INT,                                -- computed at finish
  total_questions INT
);

-- Each answer submitted during a session
CREATE TABLE session_answers (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id INT REFERENCES questions(id),
  submitted_answer TEXT NOT NULL,
  is_correct BOOLEAN,                       -- computed at finish, not shown live
  submitted_at TIMESTAMP DEFAULT now()
);
```

Note: no `users` table yet — prototype runs anonymous/single-user sessions. Auth is deferred (see §8).

---

## 4. Backend API (Node + Express)

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/segments/:slug` | Fetch segment + ordered chunks + questions + options (correct_answer withheld) |
| POST | `/api/sessions` | Start a session for a segment → returns `session_id` |
| POST | `/api/sessions/:id/chunks/:chunkId/replay` | (Optional/log-only) records that the student replayed a chunk |
| POST | `/api/sessions/:id/answers` | Submit one answer `{ question_id, submitted_answer }` → stores it, no correctness returned |
| POST | `/api/sessions/:id/finish` | Marks session finished, scores all `session_answers`, updates `quiz_sessions.score` |
| GET | `/api/sessions/:id/results` | Returns final score + per-question breakdown (correct answers revealed here, post-finish only) |

Suggested folder structure:
```
server/
  src/
    db/            -- pg client/pool, migrations
    routes/
      segments.js
      sessions.js
    controllers/
      segmentsController.js
      sessionsController.js
    services/
      scoring.js   -- compares submitted_answer vs correct_answer, handles MCQ + text
    app.js
    server.js
  complete.md       -- this document
  package.json
```

---

## 5. Frontend Flow (React)

State machine per session:
```
idle → loading_segment → playing_chunk → paused_awaiting_answer
     → (optional: replaying_chunk → paused_awaiting_answer)
     → answer_submitted → playing_chunk (next) → ... → finished → results
```

Suggested components:
```
client/
  src/
    api/
      client.js
    components/
      AudioChunkPlayer.jsx   -- plays current chunk, auto-pauses at end
      ReplayButton.jsx        -- replays current chunk only
      QuestionPanel.jsx       -- renders recognition or application question
      ProgressIndicator.jsx   -- "Chunk 3 of 6"
      ResultsScreen.jsx       -- final score + breakdown
    pages/
      SegmentIntro.jsx
      QuizSession.jsx         -- orchestrates the state machine above
    App.jsx
```

`QuestionPanel` should render two question sub-types:
- **Recognition (MCQ)** — radio-style options from `question_options`.
- **Application (short text or MCQ)** — free-text input normalized (trim/lowercase/strip punctuation) before comparison, OR MCQ if the prototype prefers simpler grading first.

---

## 6. Scoring Logic

- Computed only in `POST /sessions/:id/finish`, never mid-session.
- For MCQ questions: `submitted_answer === correct_answer` (option key match).
- For free-text application questions: normalize both strings (trim, lowercase, collapse whitespace) before comparing — flag near-misses for manual review later (e.g. missing umlaut).
- `score = count(is_correct = true)`, `total_questions = count(session_answers)`.

---

## 7. Explicitly Out of Scope for This Prototype

- Learn-mode (Mode A, in-audio teaching) vs Test-mode (Mode B) toggle — only Mode B is built now.
- The other six grammar segments.
- User accounts/authentication — anonymous sessions only.
- Cross-segment progress tracking/analytics.
- Jump-back to earlier chunks after moving forward.
- Changing an answer after it's locked in.

---

## 8. Open Questions Carried Into Refinement

1. Should a student be able to jump back to **earlier** chunks (not just replay the current one)?
2. Once an answer is submitted, should it ever be editable later (e.g., if a later chunk jogs their memory)?
3. Should Mode A (teaching) vs Mode B (test) be a student-facing choice, or app-driven based on prior performance?
4. Is the draft German seed script (§2) acceptable as-is, or does it need correction/expansion before recording audio?

---

## 9. Build Order for the Prototype

1. Postgres schema + seed script for segment "Tense Overview & Time Concept" with the 6 draft chunks/questions.
2. Backend routes: segment fetch → session start → answer submit → finish → results.
3. Frontend: intro screen → chunk player + question panel loop → results screen.
4. Wire audio playback with real or placeholder TTS audio for the 6 chunks.
5. Manual end-to-end run-through together for refinement.
