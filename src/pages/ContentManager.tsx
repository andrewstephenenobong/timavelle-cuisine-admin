/* Timavelle content studio: editorial local drafts for static pages until matching backend resources exist. FAQ copy mirrors the public Next.js accordion. */
import { useState } from 'react';
import './content-manager.css';

type ContentKind = 'services' | 'faqs' | 'contact';
type DraftItem = { id: string; title: string; body: string };

const initialContent: Record<ContentKind, DraftItem[]> = {
  services: [
    { id: 'private-dining', title: 'Private Dining', body: 'An intimate, multi-course experience in your own home.' },
    { id: 'corporate-events', title: 'Corporate Events', body: 'Catering shaped around your schedule and the impression you want to leave.' },
    { id: 'weddings', title: 'Weddings & Celebrations', body: 'Full-service catering for moments that deserve more than a standard buffet.' },
    { id: 'personal-chef', title: 'Personal Chef Experience', body: 'Recurring or one-off in-home cooking shaped around your household.' },
  ],
  faqs: [
    { id: 'booking', title: 'How far in advance should I book?', body: 'For private dinners, two to three weeks is comfortable. For weddings or large events, six to eight weeks lets us plan properly, including a tasting.' },
    { id: 'dietary', title: 'Can you accommodate dietary restrictions?', body: 'Yes — vegetarian, vegan, gluten-free, and allergy-specific menus are all things we plan for from the start, not substitute in at the last minute.' },
    { id: 'travel', title: 'Do you travel outside Lagos?', body: 'For larger events, yes. Travel and logistics are quoted separately based on distance and event size.' },
    { id: 'private-dining', title: 'What’s included in a private dining booking?', body: 'The chef, the full menu (tasted and agreed beforehand), service staff for the evening, and cleanup. Tableware and venue are discussed case by case.' },
  ],
  contact: [
    { id: 'address', title: 'Address', body: '14 Ilaro Crescent, Lagos' },
    { id: 'hours', title: 'Opening hours', body: 'Tue – Sun, 7am – 10pm' },
    { id: 'phone', title: 'Phone', body: '+234 908 331 7591' },
    { id: 'email', title: 'Email', body: 'hello@timavellecuisine.com' },
  ],
};

const contentMeta: Record<ContentKind, { label: string; eyebrow: string; description: string; note: string }> = {
  services: { label: 'Services', eyebrow: 'Public page / 04', description: 'Shape the offers guests see when they are deciding what kind of table they want.', note: 'The public Services page is currently static in Next.js.' },
  faqs: { label: 'FAQs', eyebrow: 'Public page / 05', description: 'Keep answers clear, compact, and ready for the moments before an enquiry.', note: 'This editor mirrors the four records currently shown by the public FAQ accordion.' },
  contact: { label: 'Contact', eyebrow: 'Public page / 06', description: 'Keep the house details consistent across the public contact experience.', note: 'Contact details are currently static; enquiries are submitted through the existing form.' },
};

function readDraft(kind: ContentKind) {
  if (typeof window === 'undefined') return initialContent[kind];
  try {
    // The FAQ editor previously stored a three-item draft with different copy.
    // Versioning this local key prevents stale browser data from masking the public content.
    const storageKey = kind === 'faqs' ? 'timavelle-draft-faqs-v2' : `timavelle-draft-${kind}`;
    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as DraftItem[]) : initialContent[kind];
  } catch {
    return initialContent[kind];
  }
}

export default function ContentManager({ kind }: { kind: ContentKind }) {
  const meta = contentMeta[kind];
  const [items, setItems] = useState<DraftItem[]>(() => readDraft(kind));
  const [saved, setSaved] = useState(false);

  function updateItem(id: string, field: 'title' | 'body', value: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item));
    setSaved(false);
  }

  function addItem() {
    setItems((current) => [...current, { id: `${kind}-${Date.now()}`, title: 'New content block', body: 'Write the public-facing content here.' }]);
    setSaved(false);
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    setSaved(false);
  }

  function saveDraft() {
    const storageKey = kind === 'faqs' ? 'timavelle-draft-faqs-v2' : `timavelle-draft-${kind}`;
    window.localStorage.setItem(storageKey, JSON.stringify(items));
    setSaved(true);
  }

  return <div className="content-studio"><div className="content-studio__head"><div><div className="admin-page__eyebrow">{meta.eyebrow}</div><h2>{meta.label} <em>studio.</em></h2><p className="admin-page__intro">{meta.description}</p></div><div className="content-studio__head-actions"><span className="content-studio__draft-status">{saved ? 'Draft saved in this browser' : 'Local preview draft'}</span><button className="admin-action" onClick={saveDraft}>Save draft ↗</button></div></div><div className="content-studio__notice"><span className="content-studio__notice-mark">i</span><div><strong>Editorial draft mode</strong><p>{meta.note} These edits are saved in this browser only until the backend exposes a matching content resource.</p></div><button className="content-studio__publish" disabled title="Requires a backend content endpoint">Publish locked</button></div><div className="content-studio__toolbar"><div><span className="admin-page__eyebrow">{items.length.toString().padStart(2, '0')} blocks in this page</span><h3>Build the public surface.</h3></div><button className="content-studio__add" onClick={addItem}>+ Add block</button></div><div className="content-studio__grid">{items.map((item, index) => <article className="content-studio__card" key={item.id}><div className="content-studio__card-top"><span>0{index + 1}</span><button className="content-studio__remove" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.title}`}>Remove</button></div><label>Title<input value={item.title} onChange={(event) => updateItem(item.id, 'title', event.target.value)} /></label><label>Public copy<textarea value={item.body} onChange={(event) => updateItem(item.id, 'body', event.target.value)} rows={4} /></label></article>)}</div><div className="content-studio__footer"><span>Next step: expose <code>/api/{kind}</code> in the backend to make this page publishable.</span><button className="content-studio__add" onClick={addItem}>Add another block</button></div></div>;
}
