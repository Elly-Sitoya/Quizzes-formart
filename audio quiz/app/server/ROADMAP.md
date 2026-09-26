# Grammar Mastery — Roadmap & Guidance

> Purpose: a living reference for how the audio-quiz mechanic works and
> where we are across all Part 1 (B-level Grammar Mastery) segments.
> For the detailed technical spec of segment 1 (schema, API, components),
> see `complete.md` in this same folder — this file stays at the
> concept/roadmap level so the two don't duplicate each other.

## 1. Core Mechanic (applies to every segment)

- One audio-quiz session = one grammar rule/segment.
- Audio is split into **meaningful content chunks**, not fixed time
  intervals — each chunk is one demonstrated instance of the rule.
- Audio **auto-pauses** at the end of each chunk.
- The student can **replay the current chunk** as many times as needed
  before answering.
- Each chunk's question combines:
  - **Recognition** — "what did you just hear?"
  - **Application** — "produce/complete the correct form"
- **No right/wrong feedback** is shown live — the full results/score
  only appear after the last chunk.
- Progression is **forward-only**.

## 2. Two Modes Per Grammar Rule

- **Mode A — Learning/teaching pass**: the audio explains the rule first,
  then walks through examples; questions are more scaffolded.
- **Mode B — Test/assessment pass**: no teaching — just spoken examples
  and purely evaluative questions, built for class-test conditions.
  *(The segment 1 prototype implements Mode B only.)*
- **Still open**: does the student choose the mode, or does the app pick
  based on prior performance?

## 3. Course Context

- This app is Part 1 of a German course: **B-level Grammar Mastery**.
- The builder (you) doesn't speak German — Claude helps interpret and
  verify all German content (transcripts, questions, correct answers)
  as each segment is built.

## 4. Segment List — Build Order

1. **Tense overview and time concept** — prototype built
2. **Modalverben** — present, past, and alternatives — prototype built
3. **Passiv** — Vorgangspassiv and Zustandspassiv — prototype built
4. **Nomen-Verb-Verbindungen** — prototype built
5. **Adjective mastery**
6. **Konjunktionen & Satzverbindungen**
7. **Nominalisierung**

## 5. Status Tracker

| # | Segment | Status |
|---|---|---|
| 1 | Tense overview and time concept | Prototype built |
| 2 | Modalverben | Prototype built |
| 3 | Passiv | Prototype built |
| 4 | Nomen-Verb-Verbindungen | Prototype built |
| 5 | Adjective mastery | Not started |
| 6 | Konjunktionen & Satzverbindungen | Not started |
| 7 | Nominalisierung | Not started |

*(Update this table as each segment moves from Not started → In progress →
Built → Reviewed.)*

## 6. Open Questions Carried Forward

1. Can a student jump back to **earlier** chunks, or only replay the
   current one?
2. Can a submitted answer be **edited later**, once locked in?
3. Is **Mode A vs. Mode B** a student-facing choice, or app-driven?
4. ~~*(Segment 2 — Modalverben)* Do "alternatives" get their own dedicated
   chunks?~~ **Resolved:** yes — alternatives (e.g. **haben zu + Infinitiv**,
   **in der Lage sein zu**) get their own dedicated chunks, same weight as
   present/past chunks, not woven into them.
5. *(Segment 2 — Modalverben)* The prototype's 6 chunks cover **müssen**
   (present, past, alternative) and **können** (present, alternative), plus
   **wollen** (past only) — not all six modals get present/past/alternative
   coverage. Is one or two illustrative modals per idea enough for this
   segment, or do **sollen, dürfen** and **mögen/möchten** need their own
   chunks too?
6. *(Segment 3 — Passiv)* The prototype uses 3 matched pairs (Tür öffnen,
   Haus bauen, Fenster schließen) — each shown once as Vorgangspassiv and
   once as Zustandspassiv, in adjacent chunks. Is 3 verb pairs enough
   coverage, and should a later pass add pairs with **modal + Passiv**
   combinations (e.g. "muss geschlossen werden") or is that a separate
   segment's concern?
7. ~~*(Segment 4 — Nomen-Verb-Verbindungen)* Should a chunk also test the
   single-verb paraphrase, or does that overload one chunk with two
   skills?~~ **Resolved:** matched pairs, same pattern as Passiv — the
   fixed phrase (e.g. **eine Entscheidung treffen**) and its single-verb
   paraphrase (**entscheiden**) each get their own chunk, back to back.
8. *(Segment 4 — Nomen-Verb-Verbindungen)* The prototype covers 3 phrases
   (eine Entscheidung treffen, eine Frage stellen, Kritik üben) — a small
   sample of a genuinely large, closed-but-long list of Funktionsverbgefüge.
   Is 3 enough for the prototype, or does this segment need more coverage
   than the others before it's considered done?

## 7. Related Files

- `complete.md` — technical implementation plan for segment 1 (DB schema,
  API routes, React component/state flow, draft seed content).
- `../README.md` — how to run the prototype locally.
