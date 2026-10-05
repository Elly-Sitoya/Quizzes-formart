// The cardboard flashcard. Front = top_card.png, back = Flipped_Card.png.
// `result` (judge-first only): null until the learner has chosen, then true/false.
export default function Flashcard({ card, flipped, onFlip, result = null }) {
  const judge = card.mode === 'judge_first';
  const hasImage = Boolean(card.front_image_url);
  const interactive = typeof onFlip === 'function';

  return (
    <div
      className={`fc ${flipped ? 'is-flipped' : ''} ${interactive ? 'is-clickable' : ''}`}
      onClick={interactive ? onFlip : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onFlip();
              }
            }
          : undefined
      }
      aria-label={interactive ? 'Flip card' : undefined}
    >
      <div className="fc-inner">
        <div className="fc-face fc-front">
          <div className={`fc-content ${hasImage ? 'has-image' : ''}`}>
            {hasImage && (
              <div className="fc-image">
                <img src={card.front_image_url} alt="" draggable="false" />
              </div>
            )}
            {card.front_text && <p className="fc-text">{card.front_text}</p>}
          </div>
        </div>

        <div className="fc-face fc-back">
          <div className="fc-content">
            {judge && (
              <p className={`fc-verdict ${card.correct_verdict ? 'is-yes' : 'is-no'}`}>
                {card.correct_verdict ? '✔ The statement is correct' : '✖ The statement is incorrect'}
              </p>
            )}
            {judge && result !== null && (
              <p className="fc-result">{result ? 'You got it!' : 'Not quite'}</p>
            )}
            <p className="fc-answer">{card.back_text}</p>
            {card.back_note && <p className="fc-note">{card.back_note}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
