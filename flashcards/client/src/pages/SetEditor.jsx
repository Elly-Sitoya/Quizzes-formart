import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { typeMeta } from '../utils/cardTypes.js';
import CardEditor from '../components/CardEditor.jsx';
import SetStats from '../components/SetStats.jsx';

const BLANK = { title: '', description: '', language: '', shuffle: false, is_published: false };

export default function SetEditor({ setId, onBack }) {
  const [id, setId_] = useState(setId === 'new' ? null : setId);
  const [form, setForm] = useState(BLANK);
  const [cards, setCards] = useState([]);
  const [editingCard, setEditingCard] = useState(null); // null | {} (new) | card
  const [tab, setTab] = useState('cards');
  const [loading, setLoading] = useState(setId !== 'new');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let alive = true;
    api
      .getSet(id)
      .then((d) => {
        if (!alive) return;
        setForm({
          title: d.title,
          description: d.description,
          language: d.language,
          shuffle: d.shuffle,
          is_published: d.is_published,
        });
        setCards(d.cards);
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const field = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function saveSet(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      if (id) {
        await api.updateSet(id, form);
        setMsg('Saved.');
      } else {
        const created = await api.createSet(form);
        setId_(created.id);
        setMsg('Set created — now add some cards.');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeSet() {
    if (!id || !window.confirm('Delete this whole set, its cards and all attempts?')) return;
    try {
      await api.deleteSet(id);
      onBack();
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshCards() {
    const d = await api.getSet(id);
    setCards(d.cards);
  }

  async function removeCard(card) {
    if (!window.confirm('Delete this card?')) return;
    try {
      await api.deleteCard(card.id);
      setCards((list) => list.filter((c) => c.id !== card.id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= cards.length) return;
    const next = [...cards];
    [next[index], next[target]] = [next[target], next[index]];
    setCards(next);
    try {
      await api.reorderCards(id, next.map((c) => c.id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;

  if (editingCard) {
    return (
      <CardEditor
        setId={id}
        card={editingCard.id ? editingCard : null}
        onCancel={() => setEditingCard(null)}
        onSaved={async () => {
          await refreshCards();
          setEditingCard(null);
        }}
      />
    );
  }

  return (
    <section>
      <button className="link-btn" onClick={onBack}>
        ← All sets
      </button>
      <div className="page-head">
        <h1>{id ? form.title || 'Untitled set' : 'New flashcard set'}</h1>
      </div>

      <form className="card-panel form-grid" onSubmit={saveSet}>
        <label>
          Title
          <input value={form.title} onChange={field('title')} placeholder="Everyday German" required />
        </label>
        <label>
          Language
          <input value={form.language} onChange={field('language')} placeholder="German" />
        </label>
        <label className="span-2">
          Description
          <textarea
            rows={2}
            value={form.description}
            onChange={field('description')}
            placeholder="What will students practise?"
          />
        </label>
        <label className="check">
          <input type="checkbox" checked={form.shuffle} onChange={field('shuffle')} />
          Shuffle card order for each attempt
        </label>
        <label className="check">
          <input type="checkbox" checked={form.is_published} onChange={field('is_published')} />
          Published (visible to students)
        </label>
        <div className="span-2 row">
          <button className="btn primary" type="submit">
            {id ? 'Save changes' : 'Create set'}
          </button>
          {id && (
            <button className="btn danger" type="button" onClick={removeSet}>
              Delete set
            </button>
          )}
          {msg && <span className="ok">{msg}</span>}
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {id && (
        <>
          <div className="tabs">
            <button className={tab === 'cards' ? 'active' : ''} onClick={() => setTab('cards')}>
              Cards ({cards.length})
            </button>
            <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>
              Results
            </button>
          </div>

          {tab === 'cards' && (
            <div>
              <div className="row between pad-y">
                <p className="muted">Students see cards in this order{form.shuffle ? ' (unless shuffled)' : ''}.</p>
                <button className="btn primary" onClick={() => setEditingCard({})}>
                  + Add card
                </button>
              </div>
              {cards.length === 0 && <p className="empty">No cards yet.</p>}
              <ol className="card-list">
                {cards.map((c, i) => (
                  <li key={c.id} className="card-row">
                    <div className="card-row-main">
                      <span className="pill">{typeMeta(c.card_type).label}</span>
                      <span className={`pill ${c.mode === 'judge_first' ? 'pill-on' : ''}`}>
                        {c.mode === 'judge_first' ? 'Judge first' : 'Self-check'}
                      </span>
                      <p>{c.front_text || '(picture card)'}</p>
                      <small className="muted">→ {c.back_text}</small>
                    </div>
                    <div className="row">
                      <button className="icon-btn sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                        ↑
                      </button>
                      <button
                        className="icon-btn sm"
                        onClick={() => move(i, 1)}
                        disabled={i === cards.length - 1}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <button className="btn" onClick={() => setEditingCard(c)}>
                        Edit
                      </button>
                      <button className="btn danger" onClick={() => removeCard(c)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {tab === 'stats' && <SetStats setId={id} />}
        </>
      )}
    </section>
  );
}
