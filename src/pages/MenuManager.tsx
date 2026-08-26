import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUploadField from '../components/ImageUploadField';

interface MenuItem { _id: string; name: string; description: string; category: string; image?: string; featured: boolean; archivedAt?: string; }
type Scope = 'active' | 'archived';
type ArchiveAction = 'archive' | 'restore' | 'delete';
type PendingAction = { item: MenuItem; action: ArchiveAction };
const emptyForm = { name: '', description: '', category: '', image: '', featured: false };
type MenuFormErrors = Partial<Record<'name' | 'description' | 'category', string>>;

function dialogCopy(action: ArchiveAction, name: string) {
  if (action === 'archive') return { title: `Archive ${name}?`, message: 'This item will be hidden from the public menu and kept in the archive until you restore it.', label: 'Archive', busy: 'Archiving…' };
  if (action === 'restore') return { title: `Restore ${name}?`, message: 'This item will return to the active menu catalog and become visible publicly again.', label: 'Restore', busy: 'Restoring…' };
  return { title: `Permanently delete ${name}?`, message: 'This archived menu item will be permanently deleted and cannot be restored.', label: 'Delete permanently', busy: 'Deleting…' };
}

export default function MenuManager() {
  const [scope, setScope] = useState<Scope>('active');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [formErrors, setFormErrors] = useState<MenuFormErrors>({});
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true); setLoadFailed(false);
    try { const res = await api.get('/api/menu/admin', { params: { scope } }); setItems(res.data.items); }
    catch { setError('Could not load menu items.'); setLoadFailed(true); }
    finally { setLoading(false); }
  }, [scope]);
  useEffect(() => { const timer = window.setTimeout(() => { void fetchItems(); }, 0); return () => window.clearTimeout(timer); }, [fetchItems]);
  function openCreateForm() { setForm(emptyForm); setFormErrors({}); setEditingId(null); setShowForm(true); }
  function openEditForm(item: MenuItem) { setForm({ name: item.name, description: item.description, category: item.category, image: item.image || '', featured: item.featured }); setFormErrors({}); setEditingId(item._id); setShowForm(true); }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); const nextErrors: MenuFormErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Add a name so visitors can identify this dish.';
    if (!form.category.trim()) nextErrors.category = 'Add a category for menu navigation.';
    if (!form.description.trim()) nextErrors.description = 'Add a short description for the menu card.';
    if (Object.keys(nextErrors).length) { setFormErrors(nextErrors); return; }
    setSaving(true); setError(''); setFormErrors({});
    try { if (editingId) await api.put(`/api/menu/${editingId}`, form); else await api.post('/api/menu', form); setShowForm(false); await fetchItems(); }
    catch { setError('Something went wrong saving this item.'); } finally { setSaving(false); }
  }
  async function confirmAction() {
    if (!pendingAction) return;
    const { item, action } = pendingAction; setActionId(item._id); setError('');
    try { if (action === 'delete') await api.delete(`/api/menu/${item._id}`); else await api.post(`/api/menu/${item._id}/${action}`); setPendingAction(null); await fetchItems(); }
    catch { setError(`Something went wrong ${action === 'delete' ? 'permanently deleting' : `${action}ing`} this menu item.`); } finally { setActionId(null); }
  }
  const dialog = pendingAction ? dialogCopy(pendingAction.action, pendingAction.item.name) : null;
  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold text-emerald-deep">Menu Items</h2><p className="mt-1 font-body text-sm text-stone">Archive items first to keep a recoverable catalog.</p></div>{scope === 'active' && <button onClick={openCreateForm} className="rounded-full bg-gold px-5 py-2 font-utility text-sm font-medium text-emerald-deep hover:bg-emerald hover:text-ivory">+ Add Item</button>}</div>
    <div className="mb-5 flex gap-2" aria-label="Menu catalog view"><button onClick={() => { setScope('active'); setShowForm(false); }} className={`rounded-full px-4 py-2 font-utility text-xs ${scope === 'active' ? 'bg-emerald text-ivory' : 'border border-stone/30 text-stone'}`}>Active menu</button><button onClick={() => { setScope('archived'); setShowForm(false); }} className={`rounded-full px-4 py-2 font-utility text-xs ${scope === 'archived' ? 'bg-emerald text-ivory' : 'border border-stone/30 text-stone'}`}>Archive</button></div>
    {error && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert"><span>{error}</span>{loadFailed && <button type="button" onClick={() => void fetchItems()} className="font-utility text-xs underline">Retry loading</button>}</div>}
    {showForm && <form onSubmit={handleSubmit} noValidate className="mb-8 rounded-3xl bg-white p-6 shadow-lg"><h3 className="mb-4 font-display text-lg font-semibold text-ink">{editingId ? 'Edit Item' : 'New Item'}</h3><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-1"><label htmlFor="menu-name" className="sr-only">Dish name</label><input id="menu-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" aria-invalid={Boolean(formErrors.name)} aria-describedby={formErrors.name ? 'menu-name-error' : undefined} className="rounded-xl border border-stone/20 px-4 py-2 font-body" />{formErrors.name && <p id="menu-name-error" className="text-xs text-red-600">{formErrors.name}</p>}</div><div className="grid gap-1"><label htmlFor="menu-category" className="sr-only">Dish category</label><input id="menu-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" aria-invalid={Boolean(formErrors.category)} aria-describedby={formErrors.category ? 'menu-category-error' : undefined} className="rounded-xl border border-stone/20 px-4 py-2 font-body" />{formErrors.category && <p id="menu-category-error" className="text-xs text-red-600">{formErrors.category}</p>}</div></div><label htmlFor="menu-description" className="sr-only">Dish description</label><textarea id="menu-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" aria-invalid={Boolean(formErrors.description)} aria-describedby={formErrors.description ? 'menu-description-error' : undefined} rows={3} className="mt-4 w-full rounded-xl border border-stone/20 px-4 py-2 font-body" />{formErrors.description && <p id="menu-description-error" className="mt-1 text-xs text-red-600">{formErrors.description}</p>}<div className="mt-4"><ImageUploadField value={form.image} onChange={(url) => setForm({ ...form, image: url })} /></div><label className="mt-4 flex items-center gap-2 font-body text-sm text-stone"><input id="menu-featured" type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />Featured on homepage</label><div className="mt-6 flex gap-3"><button type="submit" disabled={saving} className="rounded-full bg-emerald px-6 py-2 font-utility text-sm text-ivory hover:bg-emerald-deep disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-stone/30 px-6 py-2 font-utility text-sm text-stone hover:bg-stone/10">Cancel</button></div></form>}
    {loading ? <p className="font-body text-stone">Loading…</p> : items.length === 0 ? <p className="font-body text-stone">{scope === 'archived' ? 'No archived menu items.' : 'No menu items yet. Add your first one above.'}</p> : <div className="grid gap-4">{items.map((item) => <div key={item._id} className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow"><div><div className="flex items-center gap-2"><h3 className="font-display text-lg font-semibold text-ink">{item.name}</h3>{item.featured && <span className="rounded-full bg-gold/20 px-2 py-0.5 font-utility text-xs text-emerald-deep">Featured</span>}</div><p className="font-utility text-xs uppercase tracking-wide text-stone">{item.category}</p><p className="mt-1 font-body text-sm text-stone">{item.description}</p>{item.archivedAt && <p className="mt-2 font-utility text-xs text-stone">Archived {new Date(item.archivedAt).toLocaleString()}</p>}</div><div className="flex shrink-0 flex-wrap gap-2">{scope === 'active' ? <><button onClick={() => openEditForm(item)} className="rounded-full border border-emerald px-4 py-1.5 font-utility text-xs text-emerald hover:bg-emerald hover:text-ivory">Edit</button><button onClick={() => setPendingAction({ item, action: 'archive' })} disabled={actionId === item._id} className="rounded-full border border-stone/40 px-4 py-1.5 font-utility text-xs text-stone hover:bg-stone/10">Archive</button></> : <><button onClick={() => setPendingAction({ item, action: 'restore' })} disabled={actionId === item._id} className="rounded-full border border-emerald px-4 py-1.5 font-utility text-xs text-emerald hover:bg-emerald hover:text-ivory">Restore</button><button onClick={() => setPendingAction({ item, action: 'delete' })} disabled={actionId === item._id} className="rounded-full border border-red-400 px-4 py-1.5 font-utility text-xs text-red-500 hover:bg-red-700 hover:text-white">Delete</button></>}</div></div>)}</div>}
    <ConfirmDialog open={Boolean(pendingAction)} title={dialog?.title || ''} message={dialog?.message || ''} confirmLabel={dialog?.label} busy={Boolean(actionId)} busyLabel={dialog?.busy} onCancel={() => setPendingAction(null)} onConfirm={() => void confirmAction()} />
  </div>;
}
