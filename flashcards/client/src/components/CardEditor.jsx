import { useState } from 'react';
import { api } from '../api/client.js';
import { CARD_TYPES, typeMeta } from '../utils/cardTypes.js';
import Flashcard from './Flashcard.jsx';

export default function CardEditor({ setId, card, onSaved, onCancel }) {
  const [f, setF] = useState(() => ({
    card_type: card?.card_type ?? 'translation',
    mode: card?.mode ?? 'self_check',
    front_text: card?.front_text ?? '',
    front_image_url: card?.front_image_url ?? '',
    back_text: card?.back_text ?? '',
    back_note: card?.back_note ?? '',
    correct_verdict: card?.correct_verdict ?? true,
  }));
  const [previewFlipped, setPreviewFlipped] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const meta = typeMeta(f.card_type);
  const set = (patch) => setF((prev) => ({ ...prev, ...patch }));

  function changeType(e) {
    const next = typeMeta(e.target.value);
    set({ card_type: next.value, mode: next.mode });
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await api.uploadImage(file);
      set({ front_image_url: url });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!f.front_text.trim() && !f.front_image_url) {
      return setError('The front needs text or an image.');
    }
    if (!f.back_text.trim()) return setError('The back needs an answer.');

    const payload = {
      ...f,
      front_image_url: f.front_image_url || null,
      correct_verdict: f.mode === 'judge_first' ? f.correct_verdict : null,
    };
    setSaving(true);
    try {
      if (card) await api.updateCard(card.id, payload);
      else await api.createCard(setId, payload);
      await onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const previewCard = { ...f, front_image_url: f.front_image_url || null };

  return (
    <section>
      <button className="link-btn" onClick={onCancel}>
        ← Back to set
      </button>
      <div className="page-head">
        <h1>{card ? 'Edit card' : 'New card'}</h1>
      </div>

      <div className="editor-split">
        <form className="card-panel stack" onSubmit={submit}>
          <label>
            Question type
            <select value={f.card_type} onChange={changeType}>
              {CARD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="radio-row">
            <legend>How does the student answer?</legend>
            <label>
              <input
                type="radio"
                checked={f.mode === 'self_check'}
                onChange={() => set({ mode: 'self_check' })}
              />
              Self-check — flip, then mark ✔ / ✖
            </label>
            <label>
              <input
                type="radio"
                checked={f.mode === 'judge_first'}
                onChange={() => set({ mode: 'judge_first' })}
              />
              Judge first — choose ✔ / ✖, then flip to see
            </label>
          </fieldset>

          <label>
            Front — {meta.front}
            <textarea
              rows={3}
              value={f.front_text}
              onChange={(e) => set({ front_text: e.target.value })}
              placeholder={meta.frontHint}
            />
          </label>

          <div className="image-field">
            <span>Front image (optional)</span>
            {f.front_image_url ? (
              <div className="row">
                <img className="thumb" src={f.front_image_url} alt="" />
                <button type="button" className="btn" onClick={() => set({ front_image_url: '' })}>
                  Remove image
                </button>
              </div>
            ) : (
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={onFile} />
            )}
            {uploading && <small className="muted">Uploading…</small>}
          </div>

          <label>
            Back — {meta.back}
            <textarea
              rows={2}
              value={f.back_text}
              onChange={(e) => set({ back_text: e.target.value })}
              placeholder={meta.backHint}
            />
          </label>

          <label>
            Note on the back (optional)
            <input
              value={f.back_note}
              onChange={(e) => set({ back_note: e.target.value })}
              placeholder="A hint, example, or common mistake"
            />
          </label>

          {f.mode === 'judge_first' && (
            <fieldset className="radio-row">
              <legend>The statement on the front is…</legend>
              <label>
                <input
                  type="radio"
                  checked={f.correct_verdict === true}
                  onChange={() => set({ correct_verdict: true })}
                />
                ✔ Correct
              </label>
              <label>
                <input
                  type="radio"
                  checked={f.correct_verdict === false}
                  onChange={() => set({ correct_verdict: false })}
                />
                ✖ Incorrect
              </label>
            </fieldset>
          )}

          {error && <p className="error">{error}</p>}
          <div className="row">
            <button className="btn primary" type="submit" disabled={saving || uploading}>
              {saving ? 'Saving…' : card ? 'Save card' : 'Add card'}
            </button>
            <button className="btn" type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>

        <div className="preview">
          <p className="muted">Live preview — click the card to flip</p>
          <Flashcard
            card={previewCard}
            flipped={previewFlipped}
            onFlip={() => setPreviewFlipped((v) => !v)}
          />
        </div>
      </div>
    </section>
  );
}
