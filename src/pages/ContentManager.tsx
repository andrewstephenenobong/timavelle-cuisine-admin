/* Timavelle content studio: server-backed drafts with explicit Save draft → Publish and archive-first recovery. */
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../lib/api';
import './content-manager.css';

type ContentKind = 'services' | 'faqs' | 'contact';
type ContentScope = 'active' | 'archived';
type ContentAction = 'archive' | 'restore' | 'delete';
type DraftItem = { id: string; title: string; body: string; order: number; serverId?: string; key?: string; archivedAt?: string; hasPublished?: boolean; publishedArchived?: boolean };
type ServerItem = { _id: string; title?: string; description?: string; question?: string; answer?: string; key?: string; label?: string; value?: string; order?: number; archivedAt?: string; published?: { isArchived?: boolean } | null };
type PendingAction = { item: DraftItem; action: ContentAction };

const API_ENDPOINTS: Record<ContentKind, string> = { services: '/api/services', faqs: '/api/faqs', contact: '/api/contact-details' };
const initialContent: Record<ContentKind, DraftItem[]> = {
  services: [
    { id: 'private-dining', title: 'Private Dining', body: 'An intimate, multi-course experience in your own home — menu shaped around your table, not a set menu handed to you.', order: 0 },
    { id: 'corporate-events', title: 'Corporate Events', body: 'From working lunches to milestone celebrations, catering built around your schedule and the impression you want to leave.', order: 1 },
    { id: 'weddings', title: 'Weddings & Celebrations', body: 'Full-service catering for the moments that deserve more than a standard buffet — tastings, planning, and day-of service included.', order: 2 },
    { id: 'personal-chef', title: 'Personal Chef Experience', body: 'Recurring or one-off in-home cooking, tailored to your household’s tastes, dietary needs, and schedule.', order: 3 },
  ],
  faqs: [
    { id: 'booking', title: 'How far in advance should I book?', body: 'For private dinners, two to three weeks is comfortable. For weddings or large events, six to eight weeks lets us plan properly, including a tasting.', order: 0 },
    { id: 'dietary', title: 'Can you accommodate dietary restrictions?', body: 'Yes — vegetarian, vegan, gluten-free, and allergy-specific menus are all things we plan for from the start, not substitute in at the last minute.', order: 1 },
    { id: 'travel', title: 'Do you travel outside Lagos?', body: 'For larger events, yes. Travel and logistics are quoted separately based on distance and event size.', order: 2 },
    { id: 'private-dining', title: 'What’s included in a private dining booking?', body: 'The chef, the full menu (tasted and agreed beforehand), service staff for the evening, and cleanup. Tableware and venue are discussed case by case.', order: 3 },
  ],
  contact: [
    { id: 'address', key: 'address', title: 'Address', body: '14 Ilaro Crescent, Lagos', order: 0 },
    { id: 'hours', key: 'hours', title: 'Opening hours', body: 'Tue – Sun, 7am – 10pm', order: 1 },
    { id: 'phone', key: 'phone', title: 'Phone', body: '+234 908 331 7591', order: 2 },
    { id: 'email', key: 'email', title: 'Email', body: 'hello@timavellecuisine.com', order: 3 },
  ],
};

const contentMeta: Record<ContentKind, { label: string; eyebrow: string; description: string; note: string }> = {
  services: { label: 'Services', eyebrow: 'Public page / 04', description: 'Shape the offers guests see when they are deciding what kind of table they want.', note: 'Archive keeps the server draft recoverable. Publish applies archive or restore changes to the public page.' },
  faqs: { label: 'FAQs', eyebrow: 'Public page / 05', description: 'Keep answers clear, compact, and ready for the moments before an enquiry.', note: 'Archive keeps the server draft recoverable. Publish applies archive or restore changes to the public page.' },
  contact: { label: 'Contact', eyebrow: 'Public page / 06', description: 'Keep the house details consistent across the public contact experience.', note: 'Archive keeps the server draft recoverable. Publish applies archive or restore changes to the public page.' },
};

function readLocalFallback(kind: ContentKind) {
  if (typeof window === 'undefined') return initialContent[kind];
  try {
    const storageKey = kind === 'faqs' ? 'timavelle-draft-faqs-v2' : `timavelle-draft-${kind}`;
    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as DraftItem[]) : initialContent[kind];
  } catch {
    return initialContent[kind];
  }
}

function mapServerItem(kind: ContentKind, item: ServerItem, index: number): DraftItem {
  const title = kind === 'faqs' ? item.question : kind === 'contact' ? item.label : item.title;
  const body = kind === 'faqs' ? item.answer : kind === 'contact' ? item.value : item.description;
  return { id: item._id || `${kind}-${index}`, serverId: item._id, key: kind === 'contact' ? item.key : undefined, title: title || '', body: body || '', order: item.order ?? index, archivedAt: item.archivedAt, hasPublished: Boolean(item.published), publishedArchived: item.published?.isArchived === true };
}

function toPayload(kind: ContentKind, item: DraftItem) {
  if (kind === 'faqs') return { question: item.title, answer: item.body, order: item.order };
  if (kind === 'contact') return { key: item.key?.trim(), label: item.title, value: item.body };
  return { title: item.title, description: item.body, order: item.order };
}

function cloneItems(items: DraftItem[]) { return items.map((item) => ({ ...item })); }
function apiErrorMessage(error: unknown) { return axios.isAxiosError(error) ? error.response?.data?.error || error.message : 'The request could not be completed.'; }

function actionCopy(action: ContentAction, itemLabel: string) {
  if (action === 'archive') return { title: `Archive ${itemLabel}?`, message: `This ${itemLabel} will move to the archive and can be restored later. The public site stays unchanged until you publish this saved archive change.`, confirm: 'Archive', busy: 'Archiving…' };
  if (action === 'restore') return { title: `Restore ${itemLabel}?`, message: `This ${itemLabel} will return to active drafts. Publish from the Active view when you are ready for it to return to the public site.`, confirm: 'Restore', busy: 'Restoring…' };
  return { title: `Permanently delete ${itemLabel}?`, message: `This archived ${itemLabel} will be permanently removed and cannot be restored. Continue only if it is no longer needed.`, confirm: 'Delete permanently', busy: 'Deleting…' };
}

export default function ContentManager({ kind }: { kind: ContentKind }) {
  const meta = contentMeta[kind];
  const [scope, setScope] = useState<ContentScope>('active');
  const [items, setItems] = useState<DraftItem[]>(() => readLocalFallback(kind));
  const [editingItems, setEditingItems] = useState<DraftItem[]>(() => cloneItems(readLocalFallback(kind)));
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [publicationPending, setPublicationPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('Connecting to the content API…');
  const [error, setError] = useState('');

  const loadDrafts = useCallback(async () => {
    setIsBusy(true);
    setError('');
    try {
      const response = await api.get<{ items: ServerItem[] }>(`${API_ENDPOINTS[kind]}/admin`, { params: { scope } });
      const nextItems = response.data.items.map((item, index) => mapServerItem(kind, item, index));
      setItems(nextItems);
      setEditingItems(cloneItems(nextItems));
      setApiReady(true);
      setDirty(false);
      setStatus(scope === 'archived' ? 'Archived drafts loaded' : 'Active server drafts loaded');
    } catch (loadError) {
      setApiReady(false);
      setStatus('Offline preview — publishing unavailable');
      setError(apiErrorMessage(loadError));
    } finally {
      setIsBusy(false);
    }
  }, [kind, scope]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadDrafts(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDrafts]);

  function beginEdit() { setEditingItems(cloneItems(items)); setPendingAction(null); setIsEditing(true); setDirty(false); setError(''); }
  function cancelEdit() { setEditingItems(cloneItems(items)); setPendingAction(null); setIsEditing(false); setDirty(false); setError(''); }
  function updateItem(id: string, field: 'title' | 'body' | 'key', value: string) { setEditingItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item)); setDirty(true); }
  function addItem() {
    const id = `${kind}-${Date.now()}`;
    const contactItem = { id, key: 'new-contact-detail', title: 'New contact detail', body: 'Add the public-facing value here.', order: editingItems.length };
    const genericItem = { id, title: 'New content block', body: 'Write the public-facing content here.', order: editingItems.length };
    setEditingItems((current) => [...current, kind === 'contact' ? contactItem : genericItem]);
    setDirty(true);
  }
  function requestAction(item: DraftItem, action: ContentAction) {
    if (!item.serverId) { setError('Save this new draft before managing its archive state.'); return; }
    if (dirty) { setError('Save or cancel your other changes before managing archive state.'); return; }
    setPendingAction({ item, action });
  }
  async function confirmAction() {
    if (!pendingAction?.item.serverId) return;
    const { item, action } = pendingAction;
    setIsBusy(true);
    setError('');
    try {
      const endpoint = `${API_ENDPOINTS[kind]}/${item.serverId}`;
      if (action === 'delete') await api.delete(endpoint);
      else await api.post(`${endpoint}/${action}`);
      setPendingAction(null);
      setIsEditing(false);
      setDirty(false);
      if (action !== 'delete') setPublicationPending(true);
      setStatus(action === 'archive' ? 'Draft archived. Publish to update the public site.' : action === 'restore' ? 'Draft restored. Publish to update the public site.' : 'Archived draft permanently deleted.');
      await loadDrafts();
    } catch (actionError) {
      setError(apiErrorMessage(actionError));
      setStatus(`${action === 'delete' ? 'Permanent deletion' : action[0].toUpperCase() + action.slice(1)} failed`);
    } finally {
      setIsBusy(false);
    }
  }

  async function saveDraft() {
    if (!apiReady || scope !== 'active') { setError('Switch to Active drafts before saving content.'); return; }
    setIsBusy(true);
    setError('');
    try {
      const endpoint = API_ENDPOINTS[kind];
      const savedItems: DraftItem[] = [];
      for (const item of editingItems) {
        const response = item.serverId
          ? await api.put<{ item: ServerItem }>(`${endpoint}/${item.serverId}`, toPayload(kind, item))
          : await api.post<{ item: ServerItem }>(endpoint, toPayload(kind, item));
        savedItems.push(mapServerItem(kind, response.data.item, savedItems.length));
      }
      const ordered = savedItems.sort((a, b) => a.order - b.order);
      setItems(ordered);
      setEditingItems(cloneItems(ordered));
      setIsEditing(false);
      setDirty(false);
      setPublicationPending(true);
      setStatus('Draft saved on the server. Publish when ready.');
    } catch (saveError) {
      setError(apiErrorMessage(saveError));
      setStatus('Draft save failed');
    } finally {
      setIsBusy(false);
    }
  }

  async function publish() {
    if (!apiReady || scope !== 'active' || isEditing || dirty || !publicationPending) return;
    setIsBusy(true);
    setError('');
    try {
      const endpoint = API_ENDPOINTS[kind];
      if (kind === 'contact') await api.post(`${endpoint}/publish`);
      else await api.post(`${endpoint}/publish-batch`, { ids: items.map((item) => item.serverId).filter((id): id is string => Boolean(id)) });
      setPublicationPending(false);
      setStatus('Published atomically to the public site');
    } catch (publishError) {
      setError(apiErrorMessage(publishError));
      setStatus('Publish failed');
    } finally {
      setIsBusy(false);
    }
  }

  const displayedItems = isEditing ? editingItems : items;
  const publishDisabled = !apiReady || isBusy || scope !== 'active' || isEditing || dirty || !publicationPending || displayedItems.length === 0 || displayedItems.some((item) => !item.serverId);
  const publishTitle = scope === 'archived' ? 'Switch to Active drafts before publishing' : !apiReady ? 'Connect the content API first' : displayedItems.length === 0 ? 'Restore or create active content before publishing' : isEditing || dirty ? 'Save the draft before publishing' : !publicationPending ? 'Save, archive, or restore a draft before publishing' : 'Publish the saved draft to the public site';
  const draftStatus = error || (isBusy ? 'Working…' : status);
  const itemLabel = kind === 'contact' ? 'contact detail' : 'content block';
  const dialog = pendingAction ? actionCopy(pendingAction.action, pendingAction.item.title || itemLabel) : null;

  return <>
    <div className="content-studio">
      <div className="content-studio__head">
        <div><div className="admin-page__eyebrow">{meta.eyebrow}</div><h2>{meta.label} <em>studio.</em></h2><p className="admin-page__intro">{meta.description}</p></div>
        <div className="content-studio__head-actions"><span className="content-studio__draft-status">{draftStatus}</span>{isEditing ? <div className="content-studio__edit-tools"><button className="content-studio__cancel" onClick={cancelEdit} disabled={isBusy}>Cancel</button><button className="content-studio__save" onClick={() => void saveDraft()} disabled={isBusy || !dirty}>Save draft ↗</button></div> : scope === 'active' ? <button className="content-studio__edit" onClick={beginEdit} disabled={isBusy || !apiReady}>Edit content</button> : null}</div>
      </div>
      <div className="content-studio__notice"><span className="content-studio__notice-mark">i</span><div><strong>{scope === 'archived' ? 'Archive and recovery view' : isEditing ? 'Editing active server drafts' : 'Draft and publish mode'}</strong><p>{meta.note} {scope === 'archived' ? 'Restore an item to move it back into active drafts, or permanently delete it only when it is no longer needed.' : isEditing ? 'Save or cancel other changes before archiving an item.' : 'Archive keeps a recoverable server draft; select Edit content before changing fields.'}</p></div><button className={`content-studio__publish${publishDisabled ? '' : ' content-studio__publish--ready'}`} onClick={() => void publish()} disabled={publishDisabled} title={publishTitle}>{isBusy ? 'WORKING…' : 'PUBLISH'}</button></div>
      <div className="content-studio__toolbar"><div><span className="admin-page__eyebrow">{displayedItems.length.toString().padStart(2, '0')} {scope} blocks</span><h3>{scope === 'archived' ? 'Recover or retire stored drafts.' : 'Build the public surface.'}</h3></div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => { setScope('active'); setIsEditing(false); }} disabled={isBusy} className={`rounded-full px-3 py-1.5 font-utility text-xs ${scope === 'active' ? 'bg-emerald text-ivory' : 'border border-stone/30 text-stone'}`}>Active</button><button type="button" onClick={() => { setScope('archived'); setIsEditing(false); }} disabled={isBusy} className={`rounded-full px-3 py-1.5 font-utility text-xs ${scope === 'archived' ? 'bg-emerald text-ivory' : 'border border-stone/30 text-stone'}`}>Archive</button>{isEditing && <button className="content-studio__add" onClick={addItem}>+ Add {itemLabel}</button>}</div></div>
      <div className="content-studio__grid">{displayedItems.map((item, index) => { const canPermanentlyDelete = !item.hasPublished || item.publishedArchived; return <article className="content-studio__card" data-editing={isEditing} key={item.id}><div className="content-studio__card-top"><span>0{index + 1}</span>{item.serverId && (scope === 'archived' ? <div className="flex gap-2"><button className="content-studio__remove" onClick={() => requestAction(item, 'restore')} disabled={isBusy}>Restore</button><button className="content-studio__remove" onClick={() => requestAction(item, 'delete')} disabled={isBusy || !canPermanentlyDelete} title={canPermanentlyDelete ? 'Permanently delete this archived draft' : 'Publish this archive change before permanent deletion'} aria-label={`Permanently delete ${item.title}`}>Delete</button></div> : <button className="content-studio__remove" onClick={() => requestAction(item, 'archive')} disabled={isBusy || isEditing} aria-label={`Archive ${item.title}`}>Archive</button>)}</div>{isEditing ? <>{kind === 'contact' && <label>Public key<input value={item.key || ''} onChange={(event) => updateItem(item.id, 'key', event.target.value)} disabled={Boolean(item.serverId)} aria-describedby={item.serverId ? `contact-key-${item.id}` : undefined} />{item.serverId && <small id={`contact-key-${item.id}`}>The public key cannot be changed after creation.</small>}</label>}<label>Title<input value={item.title} onChange={(event) => updateItem(item.id, 'title', event.target.value)} /></label><label>Public copy<textarea value={item.body} onChange={(event) => updateItem(item.id, 'body', event.target.value)} rows={4} /></label></> : <><div className="content-studio__field"><span>Title</span><strong>{item.title}</strong></div><div className="content-studio__field"><span>Public copy</span><p>{item.body}</p></div>{item.archivedAt && <div className="content-studio__field"><span>Archived</span><p>{new Date(item.archivedAt).toLocaleString()}</p></div>}</>}</article>; })}</div>
      <div className="content-studio__footer"><span>API: <code>{API_ENDPOINTS[kind]}/admin?scope={scope}</code> · archive before permanent deletion</span>{isEditing && <button className="content-studio__add" onClick={addItem}>Add another {itemLabel}</button>}</div>
    </div>
    <ConfirmDialog open={Boolean(pendingAction)} title={dialog?.title || ''} message={dialog?.message || ''} confirmLabel={dialog?.confirm} busy={isBusy} busyLabel={dialog?.busy} onCancel={() => setPendingAction(null)} onConfirm={() => void confirmAction()} />
  </>;
}
