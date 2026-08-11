import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Testimonial {
  _id: string;
  clientName: string;
  quote: string;
  eventType?: string;
  featured: boolean;
}

const emptyForm = { clientName: '', quote: '', eventType: '', featured: false };

export default function TestimonialsManager() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchTestimonials() {
    setLoading(true);
    try {
      const res = await api.get('/api/testimonials');
      setTestimonials(res.data.testimonials);
    } catch {
      setError('Could not load testimonials.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTestimonials();
  }, []);

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(t: Testimonial) {
    setForm({ clientName: t.clientName, quote: t.quote, eventType: t.eventType || '', featured: t.featured });
    setEditingId(t._id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/api/testimonials/${editingId}`, form);
      } else {
        await api.post('/api/testimonials', form);
      }
      setShowForm(false);
      await fetchTestimonials();
    } catch {
      setError('Something went wrong saving this testimonial.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this testimonial? This cannot be undone.')) return;
    try {
      await api.delete(`/api/testimonials/${id}`);
      await fetchTestimonials();
    } catch {
      setError('Something went wrong deleting this testimonial.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-emerald-deep">Testimonials</h2>
        <button
          onClick={openCreateForm}
          className="rounded-full bg-gold px-5 py-2 font-utility text-sm font-medium text-emerald-deep hover:bg-emerald hover:text-ivory"
        >
          + Add Testimonial
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-3xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">
            {editingId ? 'Edit Testimonial' : 'New Testimonial'}
          </h3>
          <input
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            placeholder="Client name"
            required
            className="w-full rounded-xl border border-stone/20 px-4 py-2 font-body"
          />
          <textarea
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
            placeholder="Quote"
            required
            rows={3}
            className="mt-4 w-full rounded-xl border border-stone/20 px-4 py-2 font-body"
          />
          <input
            value={form.eventType}
            onChange={(e) => setForm({ ...form, eventType: e.target.value })}
            placeholder="Event type (optional, e.g. Private dinner)"
            className="mt-4 w-full rounded-xl border border-stone/20 px-4 py-2 font-body"
          />
          <label className="mt-4 flex items-center gap-2 font-body text-sm text-stone">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Featured on homepage
          </label>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-emerald px-6 py-2 font-utility text-sm text-ivory hover:bg-emerald-deep disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-stone/30 px-6 py-2 font-utility text-sm text-stone hover:bg-stone/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="font-body text-stone">Loading…</p>
      ) : testimonials.length === 0 ? (
        <p className="font-body text-stone">No testimonials yet. Add your first one above.</p>
      ) : (
        <div className="grid gap-4">
          {testimonials.map((t) => (
            <div key={t._id} className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-lg font-semibold text-ink">{t.clientName}</h4>
                  {t.featured && (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 font-utility text-xs text-emerald-deep">
                      Featured
                    </span>
                  )}
                </div>
                {t.eventType && <p className="font-utility text-xs uppercase tracking-wide text-stone/70">{t.eventType}</p>}
                <p className="mt-1 font-body text-sm italic text-stone">&ldquo;{t.quote}&rdquo;</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => openEditForm(t)}
                  className="rounded-full border border-emerald px-4 py-1.5 font-utility text-xs text-emerald hover:bg-emerald hover:text-ivory"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(t._id)}
                  className="rounded-full border border-red-400 px-4 py-1.5 font-utility text-xs text-red-500 hover:bg-red-500 hover:text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}