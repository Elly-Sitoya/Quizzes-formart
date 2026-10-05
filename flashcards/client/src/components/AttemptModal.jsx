import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client.js';
import { getLearnerKey } from '../utils/learner.js';
import { computeDeck, orderCards } from '../utils/deck.js';
import Flashcard from './Flashcard.jsx';
import VerdictTiles from './VerdictTiles.jsx';

const NEXT_DELAY_MS = 550;

export default function AttemptModal({ setId, onClose }) {
  const [shown, setShown] = useState(false);
  const [load, setLoad] = useState({ status: 'loading', message: '' });
  const [set, setSet] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [acked, setAcked] = useState(() => new Set());
  const [stopped, setStopped] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [pending, setPending] = useState(null);
  const [saveError, setSaveError] = useState('');
  const timer = useRef(null);
  const finishing = useRef(false);

  const begin = useCallback(async () => {
    clearTimeout(timer.current);
    setLoad({ status: 'loading', message: '' });
    try {
      const [s, a] = await Promise.all([
        api.studentSet(setId),
        api.startAttempt(setId, getLearnerKey()),
      ]);
      setSet(s);
      setAttempt(a.attempt);
      setAnswers(a.answers);
      setAcked(new Set());
      setStopped(false);
      setFlipped(false);
      setChosen(null);
      setPending(null);
      setSaveError('');
      setLoad({ status: 'ready', message: '' });
    } catch (err) {
      setLoad({ status: 'error', message: err.message });
    }
  }, [setId]);

  useEffect(() => {
    begin();
    const raf = requestAnimationFrame(() => setShown(true));
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer.current);
    };
  }, [begin]);

  const close = useCallback(() => {
    setShown(false);
    setTimeout(onClose, 260);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const ordered = useMemo(
    () => (set && attempt ? orderCards(set.cards, attempt.id, set.shuffle) : []),
    [set, attempt?.id] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const deck = useMemo(() => computeDeck(ordered, answers, acked), [ordered, answers, acked]);
  const phase = stopped ? 'done' : deck.phase;
  const card = phase === 'card' ? deck.remaining[0] : null;

  // Close out the attempt on the server once the learner is finished.
  useEffect(() => {
    if (load.status !== 'ready' || phase !== 'done' || !attempt) return;
    if (attempt.status === 'completed' || finishing.current) return;
    finishing.current = true;
    api
      .finishAttempt(attempt.id)
      .then((r) => setAttempt(r.attempt))
      .catch(() => {})
      .finally(() => {
        finishing.current = false;
      });
  }, [load.status, phase, attempt]);

  function commit(cardId, round, correct) {
    setAnswers((prev) => [
      ...prev.filter((a) => !(a.card_id === cardId && a.round === round)),
      { card_id: cardId, round, correct },
    ]);
    setChosen(null);
    setFlipped(false);
    setPending(null);
  }

  function handleChoose(value) {
    if (!card || chosen !== null) return;
    const judge = card.mode === 'judge_first';
    const correct = judge ? value === card.correct_verdict : value;
    const round = deck.round;

    setChosen(value);
    api
      .saveAnswer(attempt.id, { card_id: card.id, round, correct })
      .catch((err) => setSaveError(err.message));

    if (judge) {
      setFlipped(true);
      setPending({ cardId: card.id, round, correct });
    } else {
      timer.current = setTimeout(() => commit(card.id, round, correct), NEXT_DELAY_MS);
    }
  }

  const judge = card?.mode === 'judge_first';
  const firstRound = answers.filter((a) => a.round === 1);
  const firstScore = firstRound.filter((a) => a.correct).length;
  const missedFirst = ordered.filter((c) => firstRound.some((a) => a.card_id === c.id && !a.correct));

  return (
    <div
      className={`modal-backdrop ${shown ? 'is-open' : ''}`}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={set?.title ?? 'Flashcards'}>
        <header className="modal-head">
          <div>
            <h2>{set?.title ?? 'Loading…'}</h2>
            {phase === 'card' && (
              <p className="muted">
                {deck.round > 1 ? `Round ${deck.round} · ` : ''}
                Card {deck.answeredInRound + 1} of {deck.total}
              </p>
            )}
          </div>
          <button className="icon-btn" onClick={close} aria-label="Close">
            ×
          </button>
        </header>

        {phase === 'card' && (
          <div className="progress">
            <span style={{ width: `${(deck.answeredInRound / deck.total) * 100}%` }} />
          </div>
        )}

        {load.status === 'loading' && <p className="center muted pad">Getting your cards ready…</p>}
        {load.status === 'error' && (
          <div className="center pad">
            <p className="error">{load.message}</p>
            <button className="btn" onClick={begin}>
              Try again
            </button>
          </div>
        )}

        {load.status === 'ready' && phase === 'card' && card && (
          <div className="stage" key={`${card.id}-${deck.round}`}>
            <Flashcard
              card={card}
              flipped={flipped}
              result={pending ? pending.correct : null}
              onFlip={
                judge
                  ? pending
                    ? () => setFlipped((f) => !f)
                    : undefined
                  : chosen === null
                    ? () => setFlipped((f) => !f)
                    : undefined
              }
            />

            <div className="controls">
              {judge ? (
                <>
                  <p className="prompt">
                    {pending
                      ? pending.correct
                        ? 'Well spotted!'
                        : 'Not quite — the answer is on the card.'
                      : 'Is the statement on the card correct?'}
                  </p>
                  <VerdictTiles
                    chosen={chosen}
                    onChoose={handleChoose}
                    labels={{ wrong: 'Incorrect', right: 'Correct' }}
                  />
                  {pending && (
                    <button
                      className="btn primary"
                      onClick={() => commit(pending.cardId, pending.round, pending.correct)}
                    >
                      Next card →
                    </button>
                  )}
                </>
              ) : !flipped ? (
                <>
                  <p className="prompt">Think of the answer, then flip the card.</p>
                  <button className="btn primary" onClick={() => setFlipped(true)}>
                    Flip card
                  </button>
                </>
              ) : (
                <>
                  <p className="prompt">Did you get it right?</p>
                  <VerdictTiles entering chosen={chosen} onChoose={handleChoose} />
                </>
              )}
              {saveError && <p className="error small">Couldn’t save that answer: {saveError}</p>}
            </div>
          </div>
        )}

        {load.status === 'ready' && phase === 'round_break' && (
          <div className="panel center">
            <h3>{deck.round === 1 ? 'First pass complete' : `Round ${deck.round} complete`}</h3>
            {deck.round === 1 && (
              <p className="big-score">
                {firstScore} <span>of {ordered.length} first time</span>
              </p>
            )}
            <p>
              {deck.missed.length} card{deck.missed.length === 1 ? '' : 's'} to revisit. Run through
              them again until they stick?
            </p>
            <div className="row center-row">
              <button
                className="btn primary"
                onClick={() => setAcked((prev) => new Set(prev).add(deck.round + 1))}
              >
                Revisit missed cards
              </button>
              <button className="btn" onClick={() => setStopped(true)}>
                Stop here
              </button>
            </div>
          </div>
        )}

        {load.status === 'ready' && phase === 'done' && (
          <div className="panel center">
            <h3>{missedFirst.length === 0 ? 'Perfect run!' : 'Nice work'}</h3>
            <p className="big-score">
              {firstScore} <span>of {ordered.length} first time</span>
            </p>
            {missedFirst.length > 0 && (
              <div className="review">
                <h4>Worth another look</h4>
                <ul>
                  {missedFirst.map((c) => (
                    <li key={c.id}>
                      <strong>{c.front_text || '(picture card)'}</strong>
                      <span>{c.back_text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="row center-row">
              <button
                className="btn primary"
                onClick={begin}
                disabled={attempt?.status !== 'completed'}
              >
                {attempt?.status === 'completed' ? 'Practise again' : 'Saving…'}
              </button>
              <button className="btn" onClick={close}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
