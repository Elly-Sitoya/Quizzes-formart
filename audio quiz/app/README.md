# Audio Quiz — Working Prototype

Prototype for **one segment**: "Tense Overview & Time Concept". See
`server/complete.md` for the full plan and open questions.

## What's real vs. placeholder

- The backend, database schema, and React UI are fully wired and working.
- There are no recorded German audio files yet. Each chunk instead has its
  German `transcript` **spoken aloud in the browser via the Web Speech API**
  (`de-DE`) as a stand-in — this is why the "audio" you hear is a synthesized
  voice, not a real recording. Swapping in real audio later just means
  setting `audio_url` on a chunk; the player already prefers a real file
  over TTS when one is present.
- The 6 example sentences (Präsens → Futur II) are **draft German content**
  flagged for review together — not final.

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or reachable via `DATABASE_URL`)
- A Chromium-based browser (Chrome/Edge) tends to have the best German
  (`de-DE`) speech-synthesis voice available.

## 1. Database

```bash
createdb audio_quiz
```

## 2. Backend

```bash
cd server
cp .env.example .env      # adjust DATABASE_URL if needed
npm install
npm run seed               # creates tables + seeds the segment/chunks/questions
npm run dev                 # starts the API on http://localhost:4000
```

## 3. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev                 # starts the app on http://localhost:5173
```

Open http://localhost:5173 — click "Quiz starten", listen to each chunk,
answer both questions (recognition + application), and continue through
all 6 chunks to see the final score screen.

## Known open items (see `server/complete.md` §8)

- Jump-back to earlier chunks: not implemented (current chunk replay only).
- Answer locking: answers are final once submitted, no edit-after-submit.
- Learn-mode (teaching) vs. test-mode toggle: not implemented — this
  prototype is test-mode only.
