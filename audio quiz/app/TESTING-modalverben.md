# Testing Procedure — Modalverben Segment (Present, Past & Alternatives)

## What Was Built

This feature adds **Segment 2 (Modalverben)** as a second, selectable
segment alongside the existing "Tense Overview & Time Concept" prototype:

- **Backend (`server/src/db/seed.js`)** — refactored from seeding a single
  hardcoded segment to seeding a list of segments. Segment 2 seeds 6 draft
  chunks covering modal verbs in the **present tense** (müssen, können),
  **Präteritum / past tense** (müssen, wollen), and **non-modal
  alternatives** that express the same meaning without a modal verb
  (**haben zu + Infinitiv** for müssen, **in der Lage sein zu** for
  können). No schema changes were needed — the existing `segments` /
  `chunks` / `questions` / `question_options` tables already supported
  multiple segments.
- **Frontend (`client/src/pages/QuizSession.jsx`,
  `client/src/pages/SegmentIntro.jsx`, `client/src/App.css`)** — the
  client used to hardcode which segment slug it loaded. It now shows a
  segment picker (a dropdown) on the intro screen so a learner can choose
  between "Tense Overview & Time Concept" and "Modalverben — Present,
  Past & Alternatives" before starting a session. The picker's list is a
  static array for now, since there's no "list all segments" API endpoint
  yet.
- **`server/ROADMAP.md`** — Segment 2 moved to "Prototype built" in the
  status tracker, and the open question about whether "alternatives" get
  their own chunks was resolved (they do). A new open question was logged
  about whether all six modals need coverage, since the prototype only
  uses müssen, können, and wollen.

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or reachable via `DATABASE_URL`)
- A Chromium-based browser (Chrome/Edge) for the best German (`de-DE`)
  speech-synthesis voice, since chunks are spoken via the Web Speech API,
  not real recordings (see `README.md`).

## Setup

```bash
cd server
cp .env.example .env      # if not already done, adjust DATABASE_URL if needed
npm install
npm run seed
```

Expect **two** "Seeded" lines in the console output, one per segment:

```
Seeded "Tense Overview & Time Concept" with 6 chunks.
Seeded "Modalverben — Present, Past & Alternatives" with 6 chunks.
```

Then, in the same terminal:

```bash
npm run dev                 # API on http://localhost:4000
```

In a second terminal:

```bash
cd client
npm install
npm run dev                 # app on http://localhost:5173
```

Open http://localhost:5173.

## Test Steps

1. **Picker appears and defaults correctly**
   - Confirm a dropdown labeled "Segment auswählen" is visible on the
     intro screen with two options: "Tense Overview & Time Concept" and
     "Modalverben — Present, Past & Alternatives".
   - Confirm "Tense Overview & Time Concept" is selected by default.

2. **Segment 1 still works (regression check)**
   - Leave the default selection, click "Quiz starten".
   - Confirm the original 6-chunk flow is unaffected: play → replay →
     answer both questions per chunk → forward-only progression →
     results screen after the final chunk.

3. **Segment 2 (Modalverben) end-to-end**
   - Restart, select "Modalverben — Present, Past & Alternatives", click
     "Quiz starten".
   - Confirm the title/description shown match the Modalverben segment.
   - Step through all 6 chunks, checking each recognition + application
     question resolves as expected (see Content Verification below).
   - Confirm the progress indicator counts "Chunk X of 6" correctly.
   - Confirm **no feedback** is shown after any individual chunk — only
     after the last one.
   - Confirm the results/score screen appears after chunk 6 with the
     correct score out of 12 (2 questions × 6 chunks).

4. **Replay behavior**
   - On any chunk, confirm the current chunk's audio can be replayed
     multiple times before submitting an answer.

5. **Forward-only navigation**
   - Confirm there is no way to jump back to an earlier chunk.

6. **Switching segments across sessions**
   - After finishing one segment, return to the intro screen and pick
     the *other* segment.
   - Confirm it loads cleanly with no leftover state from the previous
     session (chunk index reset to 0, no carried-over answers or score).

7. **Error-path regression**
   - Optionally stop the backend and click "Quiz starten" to confirm the
     existing error message still renders (unrelated to this change, but
     the surrounding code was touched).

## Content Verification Checklist (German correctness)

Since the builder doesn't speak German, verify each seeded sentence
reads and resolves as intended:

- [ ] **müssen, present** — "Ich muss heute Abend noch lernen." →
      recognition: müssen; application blank: `muss`
- [ ] **können, present** — "Sie kann sehr gut Klavier spielen." →
      recognition: können; application blank: `kann`
- [ ] **müssen, Präteritum** — "Ich musste gestern länger arbeiten." →
      recognition (tense): Präteritum; application blank: `musste`
- [ ] **wollen, Präteritum** — "Er wollte gestern ins Kino gehen." →
      recognition (tense): Präteritum; application blank: `wollte`
- [ ] **alternative for müssen** — "Ich habe das Projekt bis Freitag
      abzuschließen." reads naturally as an obligation alternative;
      recognition: müssen; application blank: `muss`
- [ ] **alternative for können** — "Er ist in der Lage, das Problem
      schnell zu lösen." reads naturally as an ability alternative;
      recognition: können; application blank: `kann`

## Known Gaps / Not Covered by This Pass

- Only müssen, können, and wollen are represented — sollen, dürfen, and
  mögen/möchten have no chunks yet (tracked as an open question in
  `server/ROADMAP.md`).
- The segment picker is a static hardcoded list, not backed by a "list
  segments" API endpoint — there's nothing to test there yet.
- This is a manual/exploratory procedure, matching how segment 1 was
  verified — no automated tests are included.
