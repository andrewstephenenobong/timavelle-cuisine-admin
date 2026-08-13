/* Timavelle enquiry inbox: operational lead workflow with explicit status and note actions. */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import api, { enquiryStatuses, type EnquiryRecord, type EnquiryStatus } from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/enquiries.css';

const statusLabels: Record<EnquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quoted',
  won: 'Won',
  closed: 'Closed',
};

function formatDate(value?: string) {
  if (!value) return 'Not provided';
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error || fallback;
  }
  return fallback;
}

export default function Enquiries() {
  const [items, setItems] = useState<EnquiryRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'all' | EnquiryStatus>('all');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<EnquiryRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selected = useMemo(() => items.find((item) => item._id === selectedId) ?? null, [items, selectedId]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        setLoading(true);
        setError('');
      }
      return api.get('/api/enquiries', { params: { page, limit: 12, ...(status !== 'all' ? { status } : {}), ...(query ? { search: query } : {}) } });
    })
      .then((response) => {
        if (cancelled) return;
        const data = response.data as { items: EnquiryRecord[]; pages: number; total: number };
        setItems(data.items);
        setPages(data.pages);
        setTotal(data.total);
        setSelectedId(data.items[0]?._id ?? null);
        setNotes(data.items[0]?.internalNotes ?? '');
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.response?.data?.error || 'Could not load enquiries.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, query, status]);

  function selectEnquiry(item: EnquiryRecord) {
    setSelectedId(item._id);
    setNotes(item.internalNotes || '');
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  }

  async function updateStatus(nextStatus: EnquiryStatus) {
    if (!selected) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await api.patch(`/api/enquiries/${selected._id}/status`, { status: nextStatus });
      const updated = response.data.enquiry as EnquiryRecord;
      setItems((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Could not update the enquiry status.'));
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    if (!selected) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await api.patch(`/api/enquiries/${selected._id}/notes`, { internalNotes: notes });
      const updated = response.data.enquiry as EnquiryRecord;
      setItems((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Could not save internal notes.'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteEnquiry() {
    if (!pendingDelete) return;
    setDeleting(true);
    setError('');
    setNotice('');
    try {
      await api.delete(`/api/enquiries/${pendingDelete._id}`);
      const remaining = items.filter((item) => item._id !== pendingDelete._id);
      setItems(remaining);
      setTotal((current) => Math.max(0, current - 1));
      setSelectedId(remaining[0]?._id ?? null);
      setNotes(remaining[0]?.internalNotes ?? '');
      setPendingDelete(null);
      setNotice('Enquiry deleted permanently.');
      if (remaining.length === 0 && page > 1) setPage((current) => current - 1);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Could not delete the enquiry.'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="admin-page admin-enquiries">
      <div className="admin-page__head">
        <div>
          <div className="admin-page__eyebrow">Lead inbox / live</div>
          <h2>Enquiries <em>in motion.</em></h2>
          <p className="admin-page__intro">A clear next step for every request that reaches the Timavelle table.</p>
        </div>
        <a className="admin-action" href="https://timavelle-cuisine.vercel.app/#reserve" target="_blank" rel="noreferrer">View enquiry form ↗</a>
      </div>

      <section className="admin-enquiries__toolbar" aria-label="Filter enquiries">
        <form className="admin-enquiries__search" onSubmit={submitSearch}>
          <label htmlFor="enquiry-search">Search leads</label>
          <div><input id="enquiry-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Name, email, or message" /><button className="admin-action" type="submit">Search</button></div>
        </form>
        <label className="admin-enquiries__filter" htmlFor="enquiry-status">Status<select id="enquiry-status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as 'all' | EnquiryStatus); }}><option value="all">All statuses</option>{enquiryStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></label>
        <div className="admin-enquiries__count"><strong>{total}</strong><span>total requests</span></div>
      </section>

      {error && <div className="admin-enquiries__alert" role="alert">{error}</div>}
      {notice && <div className="admin-enquiries__notice" role="status">{notice}</div>}

      <div className="admin-enquiries__layout">
        <section className="admin-card admin-enquiries__list" aria-label="Enquiry list">
          <div className="admin-enquiries__section-head"><div><div className="admin-card__eyebrow">Incoming requests</div><h3>Keep the conversation moving.</h3></div><span>{loading ? 'Loading…' : `${items.length} shown`}</span></div>
          {loading ? <div className="admin-enquiries__empty">Loading the lead inbox…</div> : items.length === 0 ? <div className="admin-enquiries__empty"><strong>No enquiries match this view.</strong><span>Try another status or search term, then check again.</span></div> : <div className="admin-enquiries__rows">{items.map((item) => <button key={item._id} className="admin-enquiries__row" data-selected={item._id === selectedId} onClick={() => selectEnquiry(item)}><span className="admin-enquiries__row-main"><strong>{item.name}</strong><small>{item.email}</small></span><span className="admin-enquiries__row-meta"><b data-status={item.status}>{statusLabels[item.status]}</b><small>{formatDate(item.createdAt)}</small></span></button>)}</div>}
          <div className="admin-enquiries__pagination"><button className="admin-topbar__link" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="admin-topbar__link" disabled={page >= pages || loading} onClick={() => setPage((current) => current + 1)}>Next</button></div>
        </section>

        <aside className="admin-card admin-enquiries__detail" aria-label="Selected enquiry">
          {!selected ? <div className="admin-enquiries__empty"><strong>Select a request.</strong><span>Its event details, message, and follow-up notes will appear here.</span></div> : <>
            <div className="admin-enquiries__detail-head"><div><div className="admin-card__eyebrow">Request detail</div><h3>{selected.name}</h3><span>Received {formatDate(selected.createdAt)}</span></div><div className="admin-enquiries__detail-actions"><b data-status={selected.status}>{statusLabels[selected.status]}</b><button type="button" className="admin-enquiries__delete" onClick={() => setPendingDelete(selected)} disabled={saving || deleting}>Delete enquiry</button></div></div>
            <dl className="admin-enquiries__facts"><div><dt>Email</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd></div><div><dt>Phone</dt><dd>{selected.phone ? <a href={`tel:${selected.phone}`}>{selected.phone}</a> : 'Not provided'}</dd></div><div><dt>Event date</dt><dd>{selected.eventDate || 'Not provided'}</dd></div><div><dt>Guests</dt><dd>{selected.partySize || 'Not provided'}</dd></div></dl>
            <div className="admin-enquiries__message"><div className="admin-card__eyebrow">Message</div><p>{selected.message}</p></div>
            <label className="admin-enquiries__notes" htmlFor="internal-notes"><span className="admin-card__eyebrow">Internal notes</span><textarea id="internal-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add context for the next person on this lead…" rows={5} /><button className="admin-action" onClick={saveNotes} disabled={saving}> {saving ? 'Saving…' : 'Save notes'} ↗</button></label>
            <div className="admin-enquiries__status"><label htmlFor="selected-status">Move lead forward</label><select id="selected-status" value={selected.status} onChange={(event) => updateStatus(event.target.value as EnquiryStatus)} disabled={saving}>{enquiryStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></div>
          </>}
        </aside>
      </div>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this enquiry?"
        message={pendingDelete ? `“${pendingDelete.name}” will be permanently removed from the inbox. This action cannot be undone.` : ''}
        confirmLabel="Delete enquiry"
        busy={deleting}
        onCancel={() => { if (!deleting) setPendingDelete(null); }}
        onConfirm={() => void deleteEnquiry()}
      />
    </div>
  );
}
