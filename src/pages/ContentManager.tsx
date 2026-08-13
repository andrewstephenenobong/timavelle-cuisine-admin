/* Timavelle content studio: server-backed drafts with an explicit Save draft → Publish workflow. */
import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../lib/api';
import './content-manager.css';

type ContentKind = 'services' | 'faqs' | 'contact';
type DraftItem = { id: string; title: string; body: string; order: number; serverId?: string };
type ServerItem = { _id: string; title?: string; description?: string; question?: string; answer?: string; key?: string; label?: string; value?: string; order?: number };

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
    { id: 'address', title: 'Address', body: '14 Ilaro Crescent, Lagos', order: 0 },
    { id: 'hours', title: 'Opening hours', body: 'Tue – Sun, 7am – 10pm', order: 1 },
    { id: 'phone', title: 'Phone', body: '+234 908 331 7591', order: 2 },
    { id: 'email', title: 'Email', body: 'hello@timavellecuisine.com', order: 3 },
  ],
};

const contentMeta: Record<ContentKind, { label: string; eyebrow: string; description: string; note: string }> = {
  services: { label: 'Services', eyebrow: 'Public page / 04', description: 'Shape the offers guests see when they are deciding what kind of table they want.', note: 'Drafts are stored on the Timavelle API. Publish makes the saved version public.' },
  faqs: { label: 'FAQs', eyebrow: 'Public page / 05', description: 'Keep answers clear, compact, and ready for the moments before an enquiry.', note: 'Drafts are stored on the Timavelle API. Publish makes the saved version public.' },
  contact: { label: 'Contact', eyebrow: 'Public page / 06', description: 'Keep the house details consistent across the public contact experience.', note: 'Drafts are stored on the Timavelle API. Publish makes the saved version public.' },
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
  return { id: item._id || `${kind}-${index}`, serverId: item._id, title: title || '', body: body || '', order: item.order ?? index };
}

function toPayload(kind: ContentKind, item: DraftItem) {
  if (kind === 'faqs') return { question: item.title, answer: item.body, order: item.order };
  if (kind === 'contact') return { label: item.title, value: item.body };
  return { title: item.title, description: item.body, order: item.order };
}

function cloneItems(items: DraftItem[]) { return items.map((item) => ({ ...item })); }
function apiErrorMessage(error: unknown) { return axios.isAxiosError(error) ? error.response?.data?.error || error.message : 'The request could not be completed.'; }

export default function ContentManager({ kind }: { kind: ContentKind }) {
  const meta = contentMeta[kind];
  const canAdd = kind !== 'contact';
  const [items, setItems] = useState<DraftItem[]>(() => readLocalFallback(kind));
  const [editingItems, setEditingItems] = useState<DraftItem[]>(() => cloneItems(readLocalFallback(kind)));
  const [removedServerIds, setRemovedServerIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('Connecting to the content API…');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadDrafts() {
      setIsBusy(true);
      setError('');
      try {
        const response = await api.get<{ items: ServerItem[] }>(`${API_ENDPOINTS[kind]}/admin`);
        if (!active) return;
        const nextItems = response.data.items.map((item, index) => mapServerItem(kind, item, index));
        setItems(nextItems);
        setEditingItems(cloneItems(nextItems));
        setApiReady(true);
        setSaved(false);
        setDirty(false);
        setStatus('Server drafts loaded');
      } catch (loadError) {
        if (!active) return;
        setApiReady(false);
        setStatus('Offline preview — publishing unavailable');
        setError(apiErrorMessage(loadError));
      } finally {
        if (active) setIsBusy(false);
      }
    }
    void loadDrafts();
    return () => { active = false; };
  }, [kind]);

  function beginEdit() { setEditingItems(cloneItems(items)); setRemovedServerIds([]); setIsEditing(true); setDirty(false); setSaved(false); setError(''); }
  function cancelEdit() { setEditingItems(cloneItems(items)); setRemovedServerIds([]); setIsEditing(false); setDirty(false); setError(''); }
  function updateItem(id: string, field: 'title' | 'body', value: string) { setEditingItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item)); setDirty(true); setSaved(false); }
  function addItem() { if (!canAdd) return; setEditingItems((current) => [...current, { id: `${kind}-${Date.now()}`, title: 'New content block', body: 'Write the public-facing content here.', order: current.length }]); setDirty(true); setSaved(false); }
  function removeItem(id: string) { if (!canAdd) return; const removed = editingItems.find((item) => item.id === id); if (removed?.serverId) setRemovedServerIds((current) => [...current, removed.serverId as string]); setEditingItems((current) => current.filter((item) => item.id !== id)); setDirty(true); setSaved(false); }

  async function saveDraft() {
    if (!apiReady) { setError('The content API is unavailable. Drafts cannot be saved to the server yet.'); return; }
    setIsBusy(true); setError('');
    try {
      const endpoint = API_ENDPOINTS[kind];
      const savedItems: DraftItem[] = [];
      for (const item of editingItems) {
        const response = item.serverId ? await api.put<{ item: ServerItem }>(`${endpoint}/${item.serverId}`, toPayload(kind, item)) : await api.post<{ item: ServerItem }>(endpoint, toPayload(kind, item));
        savedItems.push(mapServerItem(kind, response.data.item, savedItems.length));
      }
      if (canAdd) for (const serverId of removedServerIds) await api.delete(`${endpoint}/${serverId}`);
      const ordered = savedItems.sort((a, b) => a.order - b.order);
      setItems(ordered); setEditingItems(cloneItems(ordered)); setRemovedServerIds([]); setIsEditing(false); setDirty(false); setSaved(true); setStatus('Draft saved on the server');
    } catch (saveError) {
      setError(apiErrorMessage(saveError));
      setStatus('Draft save failed');
    } finally { setIsBusy(false); }
  }

  async function publish() {
    if (!apiReady || isEditing || dirty || !saved) return;
    setIsBusy(true); setError('');
    try {
      const endpoint = API_ENDPOINTS[kind];
      if (kind === 'contact') await api.post(`${endpoint}/publish`);
      else await api.post(`${endpoint}/publish-batch`, { ids: items.map((item) => item.serverId).filter((id): id is string => Boolean(id)) });
      setSaved(false); setStatus('Published atomically to the public site');
    } catch (publishError) {
      setError(apiErrorMessage(publishError));
      setStatus('Publish failed');
    } finally { setIsBusy(false); }
  }

  const displayedItems = isEditing ? editingItems : items;
  const publishDisabled = !apiReady || isBusy || isEditing || dirty || !saved || displayedItems.some((item) => !item.serverId);
  const publishTitle = !apiReady ? 'Connect the content API first' : isEditing || dirty ? 'Save the draft before publishing' : !saved ? 'Save a draft before publishing' : 'Publish the saved draft to the public site';
  const draftStatus = error || (isBusy ? 'Working…' : status);

  return <div className="content-studio"><div className="content-studio__head"><div><div className="admin-page__eyebrow">{meta.eyebrow}</div><h2>{meta.label} <em>studio.</em></h2><p className="admin-page__intro">{meta.description}</p></div><div className="content-studio__head-actions"><span className="content-studio__draft-status">{draftStatus}</span>{isEditing ? <div className="content-studio__edit-tools"><button className="content-studio__cancel" onClick={cancelEdit} disabled={isBusy}>Cancel</button><button className="content-studio__save" onClick={() => void saveDraft()} disabled={isBusy || !dirty}>Save draft ↗</button></div> : <button className="content-studio__edit" onClick={beginEdit} disabled={isBusy || !apiReady}>Edit content</button>}</div></div><div className="content-studio__notice"><span className="content-studio__notice-mark">i</span><div><strong>{apiReady ? (isEditing ? 'Editing a server draft' : 'Draft and publish mode') : 'Offline preview'}</strong><p>{meta.note} {isEditing ? 'Save your draft or cancel to discard changes.' : 'Select Edit content before changing any field.'}</p></div><button className={`content-studio__publish${publishDisabled ? '' : ' content-studio__publish--ready'}`} onClick={() => void publish()} disabled={publishDisabled} title={publishTitle}>{isBusy ? 'WORKING…' : 'PUBLISH'}</button></div><div className="content-studio__toolbar"><div><span className="admin-page__eyebrow">{displayedItems.length.toString().padStart(2, '0')} blocks in this page</span><h3>Build the public surface.</h3></div>{isEditing && canAdd && <button className="content-studio__add" onClick={addItem}>+ Add block</button>}</div><div className="content-studio__grid">{displayedItems.map((item, index) => <article className="content-studio__card" data-editing={isEditing} key={item.id}><div className="content-studio__card-top"><span>0{index + 1}</span>{isEditing && canAdd && <button className="content-studio__remove" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.title}`}>Remove</button>}</div>{isEditing ? <><label>Title<input value={item.title} onChange={(event) => updateItem(item.id, 'title', event.target.value)} /></label><label>Public copy<textarea value={item.body} onChange={(event) => updateItem(item.id, 'body', event.target.value)} rows={4} /></label></> : <><div className="content-studio__field"><span>Title</span><strong>{item.title}</strong></div><div className="content-studio__field"><span>Public copy</span><p>{item.body}</p></div></>}</article>)}</div><div className="content-studio__footer"><span>API: <code>{API_ENDPOINTS[kind]}/admin</code> · save draft before publish</span>{isEditing && canAdd && <button className="content-studio__add" onClick={addItem}>Add another block</button>}</div></div>;
}
