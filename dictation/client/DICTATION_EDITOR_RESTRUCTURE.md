# Dictation Sentence Editor Restructure — Progress Tracker

Tracks the rebuild of the sentence list inside `QuizEditor` (trainer-facing) from a flat, always-expanded row into a collapsible row system with richer per-sentence and per-quiz audio tooling.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Step 1 — The collapsed row
- [x] Each sentence renders as a single compact line: number, sentence text, and three icons only
- [x] Icons: duplicate 📋, delete 🗑️, expand/collapse toggle (➕ closed / ➖ open)
- [x] Remove the audio-mode badge from this collapsed view entirely

## Step 2 — Opening a row
- [x] Clicking the row toggles expanded state (➕ ↔ ➖)
- [x] Expanded content branches on sentence state: brand-new/empty vs. already-existing
- [x] Only one row can be expanded at a time (opening a new one collapses the previous) — resolved open question 3 this way

## Step 3a — Expanded state: brand-new, empty sentence
- [x] Left side: note glyph `♬ˎˊ˗` in a green outline
- [x] Right side: text field (green-outlined) where the trainer types the sentence
- [x] Tapping the glyph opens the multimedia modal (Step 4)

## Step 3b — Expanded state: existing sentence
- [x] Left side: `▶` button, green outline with soft green fill, plays current audio
- [x] Right side: text field pre-filled with the existing sentence, editable in place
- [x] Resolved open question 1: a sentence is "fresh" (shows the attach-audio glyph) purely based on whether its text field is empty. As soon as any text is typed, it switches to the ▶ play-button state, even before audio has been explicitly attached — pressing play at that point falls back to the default computer voice.
- [ ] Open question 2 (editing text after audio exists flags it as possibly stale) — left out of scope, as noted before

## Step 4 — Multimedia modal
- [x] Triggered only from `♬ˎˊ˗` on a fresh sentence
- [x] Large modal, title top-left, ✕ close button top-right
- [x] Row of five quick-attach options directly under the title, split into two weight classes:
  - Left, lighter (thinner outline, smaller): 🎶 audio, 📂 my library
  - Right, heavier (thicker outline, larger): 🢁 upload file, 🎤 record, 🔊 Computer voice
  - Both hover to a smooth green-fill background
  - [~] 🎶 audio — stub "coming soon" (its exact intended behavior wasn't specified, so it's parked like "my library" rather than guessed at)
  - [x] 📂 my library — stub, "coming soon" mini-modal
  - [x] 🢁 upload file — real, attaches immediately on file choice
  - [x] 🎤 record — real, attaches immediately on stopping the recording
  - [x] 🔊 Computer voice — instant attach, no extra screen
- [x] AI route, separate from the five buttons:
  - [x] Green-outlined text area, placeholder "convert text to speech"
  - [x] Settings icon bottom-left (speed only for now — see note)
  - [x] "🔊 generate" button bottom-right
- [x] "Generate for all empty fields" toggle
  - [x] Grayed out / inactive until the first generation succeeds
  - [~] Applies the chosen **speed** to every sentence quiz-wide (the app's existing playback-rate setting). Voice selection isn't wired since the app has no voice-picking or real distinct AI-TTS service yet — it currently reuses the same browser voice everywhere, so there's no separate "voice" to propagate.
- [x] Centered green "Cancel" button, closes the modal

## Step 5 — Adding sentences
- [x] "+ add text" link above the list
- [x] "+ add text" link below the list
- [x] Both insert a new blank sentence and open it immediately, ready to type

## Step 6 — mtti assistant
- [x] Section below the list: "add more content with mtti, your ai assistant"
- [x] Soft grey outer background, white inner panel
- [x] Input placeholder: "Enter a topic, instructions and references to generate sentences from the dictation."
- [x] Two round green-outlined icons bottom-right: settings, "✨ generate"
- [x] Both dormant (disabled) — no behavior wired yet, as specified

---

## Known simplifications / things to revisit
- The "AI generate" box currently uses the browser's built-in speech voice under the hood (same engine as "🔊 Computer voice"), since there's no separate AI text-to-speech backend in this project yet. It's wired so swapping in a real service later is a small change, not a rebuild.
- 🎶 "audio" in the multimedia modal is a stub pending clarification of what it's meant to do differently from the other four options.
- `QuestionForm.jsx` / `QuestionForm.css` are no longer used by the editor (replaced by the inline row + multimedia modal) but haven't been deleted, in case you want to repurpose or confirm before removing.
- Open question 2 from Step 3b (stale-audio signal after a text edit) is still unresolved and not built.

## Notes
- Scoped to the trainer-facing quiz editor screen only; the learner-facing quiz-taking flow (`QuizModal`) is untouched and unaffected.
- Files touched: `QuizzesContext.jsx`, `QuizEditor.jsx`, `QuizEditor.css`, `defaultQuestions.js`, and new `MultimediaModal.jsx` / `MultimediaModal.css`.
