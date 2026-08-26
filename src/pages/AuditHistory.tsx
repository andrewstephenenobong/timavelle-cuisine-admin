/* Timavelle audit history: searchable, paginated archive/restore accountability without exposing content values. */
import { useEffect, useState, type FormEvent } from 'react';
import api from '../lib/api';
import '../styles/audit-history.css';

type AuditAction = 'archive' | 'restore';
type AuditResource = 'menu' | 'gallery' | 'testimonial' | 'service' | 'faq' | 'contact' | 'enquiry';
type AuditEvent = { _id: string; action: AuditAction; resourceType: AuditResource; resourceLabel: string; actorEmail: string; createdAt: string };
type AuditResponse = { items: AuditEvent[]; page: number; pages: number; total: number; summary: { archive: number; restore: number } };

const resourceLabels: Record<AuditResource, string> = { menu: 'Menu', gallery: 'Gallery', testimonial: 'Testimonial', service: 'Service', faq: 'FAQ', contact: 'Contact', enquiry: 'Enquiry' };
const actionLabels: Record<AuditAction, string> = { archive: 'Archived', restore: 'Restored' };

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Could not load archive history.';
  }
  return 'Could not load archive history.';
}

export default function AuditHistory() {
  const [items, setItems] = useState<AuditEvent[]>([]);
  const [action, setAction] = useState<'all' | AuditAction>('all');
  const [resource, setResource] = useState<'all' | AuditResource>('all');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ archive: 0, restore: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) { setLoading(true); setError(''); }
      return api.get<AuditResponse>('/api/content-audit', { params: { page, limit: 20, action, resource, ...(query ? { search: query } : {}) } });
    }).then((response) => {
      if (cancelled) return;
      setItems(response.data.items);
      setPages(response.data.pages);
      setTotal(response.data.total);
      setSummary(response.data.summary);
    }).catch((requestError: unknown) => {
      if (!cancelled) setError(getErrorMessage(requestError));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [action, page, query, resource]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  }

  return <div className="admin-page audit-history">
    <div className="admin-page__head">
      <div><div className="admin-page__eyebrow">Workspace operations / archive ledger</div><h2>Archive <em>history.</em></h2><p className="admin-page__intro">A clear record of content and enquiry archive activity, what returned, and who made each change.</p></div>
      <div className="audit-history__stamp"><span>Live audit feed</span><strong>{total}</strong><small>matching events</small></div>
    </div>

    <section className="audit-history__summary" aria-label="Archive history summary">
      <div><span>Archived</span><strong>{summary.archive}</strong><small>recorded in this view</small></div>
      <div><span>Restored</span><strong>{summary.restore}</strong><small>recorded in this view</small></div>
      <div><span>Accountability</span><strong>On</strong><small>actor and timestamp retained</small></div>
    </section>

    <section className="audit-history__toolbar" aria-label="Filter archive history">
      <form className="audit-history__search" onSubmit={submitSearch}><label htmlFor="audit-history-search">Search history</label><div><input id="audit-history-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Content label or admin email" /><button className="admin-action" type="submit">Search</button></div></form>
      <label className="audit-history__filter" htmlFor="audit-history-action">Action<select id="audit-history-action" value={action} onChange={(event) => { setPage(1); setAction(event.target.value as 'all' | AuditAction); }}><option value="all">All actions</option><option value="archive">Archived</option><option value="restore">Restored</option></select></label>
      <label className="audit-history__filter" htmlFor="audit-history-resource">Content<select id="audit-history-resource" value={resource} onChange={(event) => { setPage(1); setResource(event.target.value as 'all' | AuditResource); }}><option value="all">All content</option>{(Object.entries(resourceLabels) as [AuditResource, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </section>

    {error && <div className="audit-history__alert" role="alert">{error}</div>}
    <section className="admin-card audit-history__table" aria-label="Archive and restore event history">
      <div className="audit-history__table-head"><div><div className="admin-card__eyebrow">Immutable event ledger</div><h3>Every archive and return, in order.</h3></div><span>{loading ? 'Loading…' : `${items.length} shown`}</span></div>
      {loading ? <div className="audit-history__empty">Loading the archive ledger…</div> : items.length === 0 ? <div className="audit-history__empty"><strong>No archive activity matches this view.</strong><span>Try another filter, or archive and restore content to begin the record.</span></div> : <div className="audit-history__rows" role="list">{items.map((item) => <article key={item._id} className="audit-history__row" role="listitem"><div className="audit-history__action" data-action={item.action}><span>{actionLabels[item.action]}</span><small>{resourceLabels[item.resourceType]}</small></div><div className="audit-history__content"><strong>{item.resourceLabel}</strong><small>{resourceLabels[item.resourceType]} record</small></div><div className="audit-history__actor"><span>By</span><strong>{item.actorEmail}</strong></div><time className="audit-history__time" dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></article>)}</div>}
      <div className="audit-history__pagination"><button className="admin-topbar__link" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="admin-topbar__link" disabled={page >= pages || loading} onClick={() => setPage((current) => current + 1)}>Next</button></div>
    </section>
  </div>;
}
