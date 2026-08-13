import { useEffect, useState } from 'react';
import api from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUploadField from '../components/ImageUploadField';

interface GalleryImage {
  _id: string;
  imageUrl: string;
  caption?: string;
  category: string;
}

const emptyForm = { imageUrl: '', caption: '', category: '' };
type GalleryFormErrors = Partial<Record<'imageUrl' | 'category', string>>;

export default function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [formErrors, setFormErrors] = useState<GalleryFormErrors>({});
  const [pendingDelete, setPendingDelete] = useState<GalleryImage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchImages() {
    setLoading(true);
    setLoadFailed(false);
    try {
      const res = await api.get('/api/gallery');
      setImages(res.data.images);
    } catch {
      setError('Could not load gallery images.');
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchImages(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function openCreateForm() {
    setForm(emptyForm);
    setFormErrors({});
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(image: GalleryImage) {
    setForm({ imageUrl: image.imageUrl, caption: image.caption || '', category: image.category });
    setFormErrors({});
    setEditingId(image._id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: GalleryFormErrors = {};
    if (!form.imageUrl.trim()) nextErrors.imageUrl = 'Upload an image before saving this gallery item.';
    if (!form.category.trim()) nextErrors.category = 'Add a category so the gallery can be filtered.';
    if (Object.keys(nextErrors).length) {
      setFormErrors(nextErrors);
      return;
    }
    setSaving(true);
    setError('');
    setFormErrors({});
    try {
      if (editingId) {
        await api.put(`/api/gallery/${editingId}`, form);
      } else {
        await api.post('/api/gallery', form);
      }
      setShowForm(false);
      await fetchImages();
    } catch {
      setError('Something went wrong saving this image.');
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
      await api.delete(`/api/gallery/${id}`);
      setPendingDelete(null);
      await fetchImages();
    } catch {
      setError('Something went wrong deleting this image.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-emerald-deep">Gallery</h2>
        <button
          onClick={openCreateForm}
          className="rounded-full bg-gold px-5 py-2 font-utility text-sm font-medium text-emerald-deep hover:bg-emerald hover:text-ivory"
        >
          + Add Image
        </button>
      </div>

      {error && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <span>{error}</span>
          {loadFailed && <button type="button" onClick={() => void fetchImages()} className="font-utility text-xs underline">Retry loading</button>}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} noValidate className="mb-8 rounded-3xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">
            {editingId ? 'Edit Image' : 'New Image'}
          </h3>
          <ImageUploadField value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
          {formErrors.imageUrl && <p className="mt-1 text-xs text-red-600" role="alert">{formErrors.imageUrl}</p>}
          <label htmlFor="gallery-category" className="sr-only">Gallery category</label>
          <input
            id="gallery-category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Category (e.g. Plated, Events, Kitchen)"
            aria-invalid={Boolean(formErrors.category)}
            aria-describedby={formErrors.category ? 'gallery-category-error' : undefined}
            className="mt-4 w-full rounded-xl border border-stone/20 px-4 py-2 font-body"
          />
          {formErrors.category && <p id="gallery-category-error" className="mt-1 text-xs text-red-600">{formErrors.category}</p>}
          <label htmlFor="gallery-caption" className="sr-only">Gallery caption</label>
          <input
            id="gallery-caption"
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
            placeholder="Caption (optional)"
            className="mt-4 w-full rounded-xl border border-stone/20 px-4 py-2 font-body"
          />

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
      ) : images.length === 0 ? (
        <p className="font-body text-stone">No images yet. Add your first one above.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <div key={image._id} className="overflow-hidden rounded-2xl bg-white shadow">
              <img src={image.imageUrl} alt={image.caption || image.category} className="h-40 w-full object-cover" />
              <div className="p-4">
                <p className="font-utility text-xs uppercase tracking-wide text-stone">{image.category}</p>
                {image.caption && <p className="mt-1 font-body text-sm text-stone">{image.caption}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openEditForm(image)}
                    className="rounded-full border border-emerald px-3 py-1 font-utility text-xs text-emerald hover:bg-emerald hover:text-ivory"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setPendingDelete(image)}
                    disabled={deletingId === image._id}
                    className="rounded-full border border-red-400 px-3 py-1 font-utility text-xs text-red-500 hover:bg-red-700 hover:text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this gallery image?"
        message="This removes the image from the admin gallery and cannot be undone from this screen."
        busy={Boolean(deletingId)}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
