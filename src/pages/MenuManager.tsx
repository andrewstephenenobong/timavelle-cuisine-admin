import { useEffect, useState } from 'react';
import api from '../lib/api';
import ImageUploadField from '../components/ImageUploadField';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  image?: string;
  featured: boolean;
}

const emptyForm = { name: '', description: '', category: '', image: '', featured: false };

export default function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchItems() {
    setLoading(true);
    try {
      const res = await api.get('/api/menu');
      setItems(res.data.items);
    } catch {
      setError('Could not load menu items.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchItems(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(item: MenuItem) {
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      image: item.image || '',
      featured: item.featured,
    });
    setEditingId(item._id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/api/menu/${editingId}`, form);
      } else {
        await api.post('/api/menu', form);
      }
      setShowForm(false);
      await fetchItems();
    } catch {
      setError('Something went wrong saving this item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this menu item? This cannot be undone.')) return;
    try {
      await api.delete(`/api/menu/${id}`);
      await fetchItems();
    } catch {
      setError('Something went wrong deleting this item.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-emerald-deep">Menu Items</h2>
        <button
          onClick={openCreateForm}
          className="rounded-full bg-gold px-5 py-2 font-utility text-sm font-medium text-emerald-deep hover:bg-emerald hover:text-ivory"
        >
          + Add Item
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-3xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">
            {editingId ? 'Edit Item' : 'New Item'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
              required
              className="rounded-xl border border-stone/20 px-4 py-2 font-body"
            />
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Category"
              required
              className="rounded-xl border border-stone/20 px-4 py-2 font-body"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            required
            rows={3}
            className="mt-4 w-full rounded-xl border border-stone/20 px-4 py-2 font-body"
          />
          <div className="mt-4">
            <ImageUploadField value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
          </div>
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
      ) : items.length === 0 ? (
        <p className="font-body text-stone">No menu items yet. Add your first one above.</p>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item._id} className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-lg font-semibold text-ink">{item.name}</h4>
                  {item.featured && (
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 font-utility text-xs text-emerald-deep">
                      Featured
                    </span>
                  )}
                </div>
                <p className="font-utility text-xs uppercase tracking-wide text-stone/70">{item.category}</p>
                <p className="mt-1 font-body text-sm text-stone">{item.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => openEditForm(item)}
                  className="rounded-full border border-emerald px-4 py-1.5 font-utility text-xs text-emerald hover:bg-emerald hover:text-ivory"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
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
