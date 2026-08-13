import { useEffect, useState } from 'react';
import api from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';

interface Testimonial {
  _id: string;
  clientName: string;
  quote: string;
  eventType?: string;
  featured: boolean;
}

const emptyForm = { clientName: '', quote: '', eventType: '', featured: false };
type TestimonialFormErrors = Partial<Record<'clientName' | 'quote', string>>;

export default function TestimonialsManager() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [formErrors, setFormErrors] = useState<TestimonialFormErrors>({});
  const [pendingDelete, setPendingDelete] = useState<Testimonial | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchTestimonials() {
    setLoading(true);
    setLoadFailed(false);
    try {
      const res = await api.get('/api/testimonials');
      setTestimonials(res.data.testimonials);
    } catch {
      setError('Could not load testimonials.');
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchTestimonials(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function openCreateForm() {
    setForm(emptyForm);
    setFormErrors({});
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(t: Testimonial) {
    setForm({ clientName: t.clientName, quote: t.quote, eventType: t.eventType || '', featured: t.featured });
    setFormErrors({});
    setEditingId(t._id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: TestimonialFormErrors = {};
    if (!form.clientName.trim()) nextErrors.clientName = 'Add the client name for this testimonial.';
    if (!form.quote.trim()) nextErrors.quote = 'Add the approved testimonial copy before saving.';
    if (Object.keys(nextErrors).length) {
      setFormErrors(nextErrors);
      return;
    }
    setSaving(true);
    setError('');
    setFormErrors({});
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

  async function handleDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete._id;
    setDeletingId(id);
    setError('');
    try {
      await api.delete(`/api/testimonials/${id}`);
      setPendingDelete(null);
      await fetchTestimonials();
    } catch {
      setError('Something went wrong deleting this testimonial.');
    } finally {
      setDeletingId(null);
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

      {error && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <span>{error}</span>
          {loadFailed && <button type="button" onClick={() => void fetchTestimonials()} className="font-utility text-xs underline">Retry loading</button>}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} noValidate className="mb-8 rounded-3xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">
            {editingId ? 'Edit Testimonial' : 'New Testimonial'}
          </h3>
          <input
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            placeholder="Client name"
            aria-invalid={Boolean(formErrors.clientName)}
            aria-describedby={formErrors.clientName ? 'testimonial-client-error' : undefined}
            className="w-full rounded-xl border border-stone/20 px-4 py-2 font-body"
          />
          {formErrors.clientName && <p id="testimonial-client-error" className="mt-1 text-xs text-red-600">{formErrors.clientName}</p>}
          <textarea
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
            placeholder="Quote"
            aria-invalid={Boolean(formErrors.quote)}
            aria-describedby={formErrors.quote ? 'testimonial-quote-error' : undefined}
            rows={3}
            className="mt-4 w-full rounded-xl border border-stone/20 px-4 py-2 font-body"
          />
          {formErrors.quote && <p id="testimonial-quote-error" className="mt-1 text-xs text-red-600">{formErrors.quote}</p>}
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
                  onClick={() => setPendingDelete(t)}
                  disabled={deletingId === t._id}
                  className="rounded-full border border-red-400 px-4 py-1.5 font-utility text-xs text-red-500 hover:bg-red-500 hover:text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.clientName || 'this testimonial'}?`}
        message="This removes the testimonial from the admin catalog and cannot be undone from this screen."
        busy={Boolean(deletingId)}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
