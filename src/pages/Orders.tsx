/* Timavelle order queue: operational order workflow mirroring the Enquiries inbox pattern. */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import api, { orderStatuses, type OrderRecord, type OrderStatus } from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/enquiries.css';
import './orders.css';

const statusLabels: Record<OrderStatus, string> = {
  new: 'New',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

type OrderScope = 'active' | 'archived' | 'all';
type BulkAction = 'archive' | 'restore' | 'delete';

const bulkActionCopy: Record<BulkAction, { title: string; message: string; confirmLabel: string; busyLabel: string; notice: string }> = {
  archive: {
    title: 'Archive selected orders?',
    message: 'The selected orders will leave the active queue but remain available in Archived for restoration.',
    confirmLabel: 'Archive orders',
    busyLabel: 'Archiving…',
    notice: 'Selected orders archived.',
  },
  restore: {
    title: 'Restore selected orders?',
    message: 'The selected orders will return to the active queue and keep their existing notes and statuses.',
    confirmLabel: 'Restore orders',
    busyLabel: 'Restoring…',
    notice: 'Selected orders restored.',
  },
  delete: {
    title: 'Delete selected orders permanently?',
    message: 'This permanently removes the selected orders, including archived records. This action cannot be undone.',
    confirmLabel: 'Delete orders',
    busyLabel: 'Deleting…',
    notice: 'Selected orders deleted permanently.',
  },
};

function formatDate(value?: string) {
  if (!value) return 'Not provided';
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' }).format(new Date(value));
}

function formatNaira(value: number) {
  return `₦${value.toLocaleString('en-NG')}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error || fallback;
  }
  return fallback;
}

export default function Orders() {
  const [items, setItems] = useState<OrderRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'all' | OrderStatus>('all');
  const [scope, setScope] = useState<OrderScope>('active');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<OrderRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingBulk, setPendingBulk] = useState<{ action: BulkAction; ids: string[] } | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const selected = useMemo(() => items.find((item) => item._id === selectedId) ?? null, [items, selectedId]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        setLoading(true);
        setError('');
      }
      return api.get('/api/orders', { params: { page, limit: 12, scope, ...(status !== 'all' ? { status } : {}), ...(query ? { search: query } : {}) } });
    })
      .then((response) => {
        if (cancelled) return;
        const data = response.data as { items: OrderRecord[]; pages: number; total: number };
        setItems(data.items);
        setPages(data.pages);
        setTotal(data.total);
        setSelectedId(data.items[0]?._id ?? null);
        setNotes(data.items[0]?.internalNotes ?? '');
        setSelectedIds([]);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError?.response?.data?.error || 'Could not load orders.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page, query, scope, status]);

  function selectOrder(item: OrderRecord) {
    setSelectedId(item._id);
    setNotes(item.internalNotes || '');
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  }

  async function updateStatus(nextStatus: OrderStatus) {
    if (!selected) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await api.patch(`/api/orders/${selected._id}/status`, { status: nextStatus });
      const updated = response.data.order as OrderRecord;
      setItems((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Could not update the order status.'));
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
      const response = await api.patch(`/api/orders/${selected._id}/notes`, { internalNotes: notes });
      const updated = response.data.order as OrderRecord;
      setItems((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Could not save internal notes.'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteOrder() {
    if (!pendingDelete) return;
    setDeleting(true);
    setError('');
    setNotice('');
    try {
      await api.delete(`/api/orders/${pendingDelete._id}`);
      const remaining = items.filter((item) => item._id !== pendingDelete._id);
      setItems(remaining);
      setSelectedIds((current) => current.filter((id) => id !== pendingDelete._id));
      setTotal((current) => Math.max(0, current - 1));
      setSelectedId(remaining[0]?._id ?? null);
      setNotes(remaining[0]?.internalNotes ?? '');
      setPendingDelete(null);
      setNotice('Order deleted permanently.');
      if (remaining.length === 0 && page > 1) setPage((current) => current - 1);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Could not delete the order.'));
    } finally {
      setDeleting(false);
    }
  }

  async function changeArchiveState(action: 'archive' | 'restore') {
    if (!selected) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await api.post(`/api/orders/${selected._id}/${action}`);
      const updated = response.data.order as OrderRecord;
      setItems((current) => current.filter((item) => item._id !== updated._id));
      setSelectedId(null);
      setNotes('');
      setTotal((current) => Math.max(0, current - 1));
      setNotice(action === 'archive' ? 'Order archived. You can restore it from Archived.' : 'Order restored to the active queue.');
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, `Could not ${action} the order.`));
    } finally {
      setSaving(false);
    }
  }

  function requestBulkAction(action: BulkAction) {
    if (selectedIds.length === 0) return;
    setPendingBulk({ action, ids: selectedIds });
  }

  async function applyBulkAction() {
    if (!pendingBulk) return;
    const copy = bulkActionCopy[pendingBulk.action];
    setBulkBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await api.post('/api/orders/bulk-action', pendingBulk);
      const result = response.data as { affectedCount: number; skippedCount: number };
      setPendingBulk(null);
      setSelectedIds([]);
      setSelectedId(null);
      setNotes('');
      setNotice(result.skippedCount > 0 ? `${copy.notice} ${result.skippedCount} item${result.skippedCount === 1 ? '' : 's'} were already in the requested state.` : copy.notice);
      if (items.length === pendingBulk.ids.length && page > 1) setPage((current) => current - 1);
      else {
        setLoading(true);
        const refresh = await api.get('/api/orders', { params: { page, limit: 12, scope, ...(status !== 'all' ? { status } : {}), ...(query ? { search: query } : {}) } });
        const data = refresh.data as { items: OrderRecord[]; pages: number; total: number };
        setItems(data.items);
        setPages(data.pages);
        setTotal(data.total);
        setSelectedId(data.items[0]?._id ?? null);
        setNotes(data.items[0]?.internalNotes ?? '');
        setLoading(false);
      }
    } catch (requestError: unknown) {
      setLoading(false);
      setError(getErrorMessage(requestError, 'Could not apply the bulk order action.'));
    } finally {
      setBulkBusy(false);
    }
  }

  const allVisibleSelected = items.length > 0 && items.every((item) => selectedIds.includes(item._id));
  const selectedCount = selectedIds.length;
  const scopeLabel = scope === 'active' ? 'Active queue' : scope === 'archived' ? 'Archived' : 'All orders';

  return (
    <div className="admin-page admin-enquiries admin-orders">
      <div className="admin-page__head">
        <div>
          <div className="admin-page__eyebrow">Order queue / live</div>
          <h2>Orders <em>coming in.</em></h2>
          <p className="admin-page__intro">Every order placed on the public menu lands here, whether or not the customer sends it on through WhatsApp.</p>
        </div>
      </div>

      <section className="admin-enquiries__toolbar" aria-label="Filter orders">
        <form className="admin-enquiries__search" onSubmit={submitSearch}>
          <label htmlFor="order-search">Search orders</label>
          <div><input id="order-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Customer name or phone" /><button className="admin-action" type="submit">Search</button></div>
        </form>
        <label className="admin-enquiries__filter" htmlFor="order-status">Status<select id="order-status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as 'all' | OrderStatus); }}><option value="all">All statuses</option>{orderStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></label>
        <label className="admin-enquiries__filter" htmlFor="order-scope">View<select id="order-scope" value={scope} onChange={(event) => { setPage(1); setScope(event.target.value as OrderScope); setSelectedIds([]); }}><option value="active">Active queue</option><option value="archived">Archived</option><option value="all">All orders</option></select></label>
        <div className="admin-enquiries__count"><strong>{total}</strong><span>total orders</span></div>
      </section>

      {error && <div className="admin-enquiries__alert" role="alert">{error}</div>}
      {notice && <div className="admin-enquiries__notice" role="status">{notice}</div>}

      <div className="admin-enquiries__layout">
        <section className="admin-card admin-enquiries__list" aria-label="Order list">
          <div className="admin-enquiries__section-head"><div><div className="admin-card__eyebrow">{scopeLabel}</div><h3>Keep orders moving.</h3></div><span>{loading ? 'Loading…' : `${items.length} shown`}</span></div>
          {items.length > 0 && <div className="admin-enquiries__bulk-toolbar"><label><input type="checkbox" checked={allVisibleSelected} onChange={() => setSelectedIds(allVisibleSelected ? [] : items.map((item) => item._id))} aria-label="Select all visible orders" /> Select all visible</label><span>{selectedCount > 0 ? `${selectedCount} selected` : 'Select orders for bulk actions'}</span>{selectedCount > 0 && <div className="admin-enquiries__bulk-actions">{scope !== 'archived' && <button type="button" className="admin-action" onClick={() => requestBulkAction('archive')}>Archive selected</button>}{scope !== 'active' && <button type="button" className="admin-action" onClick={() => requestBulkAction('restore')}>Restore selected</button>}<button type="button" className="admin-enquiries__delete" onClick={() => requestBulkAction('delete')}>Delete selected</button></div>}</div>}
          {loading ? <div className="admin-enquiries__empty">Loading the order queue…</div> : items.length === 0 ? <div className="admin-enquiries__empty"><strong>No orders match this view.</strong><span>Try another status or search term, then check again.</span></div> : <div className="admin-enquiries__rows">{items.map((item) => <div key={item._id} className="admin-enquiries__row" data-selected={item._id === selectedId}><label className="admin-enquiries__row-check"><input type="checkbox" checked={selectedIds.includes(item._id)} onChange={() => setSelectedIds((current) => current.includes(item._id) ? current.filter((id) => id !== item._id) : [...current, item._id])} aria-label={`Select order from ${item.customerName}`} /></label><button type="button" className="admin-enquiries__row-select" onClick={() => selectOrder(item)}><span className="admin-enquiries__row-main"><strong>{item.customerName}</strong><small>{item.items.length} item{item.items.length === 1 ? '' : 's'} · {formatNaira(item.total)}</small></span><span className="admin-enquiries__row-meta"><b data-status={item.status}>{statusLabels[item.status]}</b><small>{formatDate(item.createdAt)}</small></span></button></div>)}</div>}
          <div className="admin-enquiries__pagination"><button className="admin-topbar__link" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="admin-topbar__link" disabled={page >= pages || loading} onClick={() => setPage((current) => current + 1)}>Next</button></div>
        </section>

        <aside className="admin-card admin-enquiries__detail" aria-label="Selected order">
          {!selected ? <div className="admin-enquiries__empty"><strong>Select an order.</strong><span>Its items, totals, and follow-up notes will appear here.</span></div> : <>
            <div className="admin-enquiries__detail-head"><div><div className="admin-card__eyebrow">Order detail</div><h3>{selected.customerName}</h3><span>Received {formatDate(selected.createdAt)}</span></div><div className="admin-enquiries__detail-actions"><b data-status={selected.status}>{statusLabels[selected.status]}</b><button type="button" className="admin-action admin-enquiries__archive" onClick={() => void changeArchiveState(selected.archivedAt ? 'restore' : 'archive')} disabled={saving || deleting || bulkBusy}>{selected.archivedAt ? 'Restore order' : 'Archive order'}</button><button type="button" className="admin-enquiries__delete" onClick={() => setPendingDelete(selected)} disabled={saving || deleting || bulkBusy}>Delete order</button></div></div>
            <dl className="admin-enquiries__facts"><div><dt>Phone</dt><dd><a href={`tel:${selected.customerPhone}`}>{selected.customerPhone}</a></dd></div><div><dt>Order type</dt><dd className="admin-orders__type">{selected.orderType === 'delivery' ? 'Delivery' : 'Pickup'}</dd></div>{selected.orderType === 'delivery' && <div><dt>Delivery address</dt><dd>{selected.deliveryAddress || 'Not provided'}</dd></div>}<div><dt>Channel</dt><dd>{selected.channel === 'whatsapp' ? 'WhatsApp' : 'Admin'}</dd></div></dl>
            <div className="admin-orders__items"><div className="admin-card__eyebrow">Items</div><ul>{selected.items.map((line, index) => <li key={index}><div><strong>{line.quantity}× {line.name}</strong>{line.addOns.length > 0 && <small>{line.addOns.map((addOn) => addOn.name).join(', ')}</small>}</div><span>{formatNaira(line.lineTotal)}</span></li>)}</ul><div className="admin-orders__totals"><div><span>Subtotal</span><strong>{formatNaira(selected.subtotal)}</strong></div><div className="admin-orders__total-row"><span>Total</span><strong>{formatNaira(selected.total)}</strong></div></div>{selected.notes && <p className="admin-orders__notes-from-customer"><span>Customer notes</span>{selected.notes}</p>}</div>
            <label className="admin-enquiries__notes" htmlFor="internal-notes"><span className="admin-card__eyebrow">Internal notes</span><textarea id="internal-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add context for the next person on this order…" rows={4} /><button className="admin-action" onClick={saveNotes} disabled={saving}> {saving ? 'Saving…' : 'Save notes'} ↗</button></label>
            <div className="admin-enquiries__status"><label htmlFor="selected-status">Move order forward</label><select id="selected-status" value={selected.status} onChange={(event) => updateStatus(event.target.value as OrderStatus)} disabled={saving}>{orderStatuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></div>
          </>}
        </aside>
      </div>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this order?"
        message={pendingDelete ? `This order from "${pendingDelete.customerName}" will be permanently removed. This action cannot be undone.` : ''}
        confirmLabel="Delete order"
        busyLabel="Deleting…"
        busy={deleting}
        onCancel={() => { if (!deleting) setPendingDelete(null); }}
        onConfirm={() => void deleteOrder()}
      />
      <ConfirmDialog
        open={Boolean(pendingBulk)}
        title={pendingBulk ? bulkActionCopy[pendingBulk.action].title : ''}
        message={pendingBulk ? bulkActionCopy[pendingBulk.action].message : ''}
        confirmLabel={pendingBulk ? bulkActionCopy[pendingBulk.action].confirmLabel : 'Confirm'}
        busyLabel={pendingBulk ? bulkActionCopy[pendingBulk.action].busyLabel : 'Working…'}
        busy={bulkBusy}
        onCancel={() => { if (!bulkBusy) setPendingBulk(null); }}
        onConfirm={() => void applyBulkAction()}
      />
    </div>
  );
}
