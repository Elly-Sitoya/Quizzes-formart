// The two cardboard answer tiles. `value` true = ✔ tile, false = ✖ tile.
export default function VerdictTiles({
  onChoose,
  chosen = null,
  entering = false,
  labels = { wrong: 'Missed it', right: 'Got it' },
}) {
  const locked = chosen !== null;

  const tile = (value, src, label, cls, alt) => (
    <div className="tile-wrap">
      <button
        type="button"
        className={`tile ${cls} ${chosen === value ? 'is-chosen' : ''} ${
          locked && chosen !== value ? 'is-faded' : ''
        }`}
        onClick={() => onChoose(value)}
        disabled={locked}
        aria-label={alt}
      >
        <img src={src} alt="" draggable="false" />
      </button>
      <span className="tile-label">{label}</span>
    </div>
  );

  return (
    <div className={`tiles ${entering ? 'tiles-enter' : ''}`}>
      {tile(false, '/cards/wrong.png', labels.wrong, 'tile-wrong', labels.wrong)}
      {tile(true, '/cards/correct.png', labels.right, 'tile-right', labels.right)}
    </div>
  );
}
