import { useEffect, useRef } from 'react';

export type AuditDetail = Record<string, unknown>;

interface AuditDetailDialogProps {
  open: boolean;
  title: string;
  eventLabel: string;
  details?: AuditDetail;
  loading: boolean;
  error: string;
  onClose: () => void;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function labelForKey(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase());
}

export default function AuditDetailDialog({ open, title, eventLabel, details, loading, error, onClose }: AuditDetailDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); return; }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKeyDown); };
  }, [onClose, open]);

  if (!open) return null;
  const entries = Object.entries(details || {});
  return <div className="audit-detail-dialog__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className="audit-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="audit-detail-title" aria-describedby="audit-detail-description">
      <div className="audit-detail-dialog__head"><div><span>Immutable event snapshot</span><h2 id="audit-detail-title">{title}</h2><p id="audit-detail-description">{eventLabel}</p></div><button ref={closeRef} type="button" className="audit-detail-dialog__close" onClick={onClose} aria-label="Close audit item details">Close</button></div>
      {loading ? <div className="audit-detail-dialog__state">Loading the recorded item snapshot…</div> : error ? <div className="audit-detail-dialog__state audit-detail-dialog__state--error" role="alert">{error}</div> : entries.length === 0 ? <div className="audit-detail-dialog__state"><strong>Snapshot unavailable for this earlier event.</strong><span>Exact content details are retained for archive and restore events recorded after this reporting enhancement was deployed.</span></div> : <dl className="audit-detail-dialog__facts">{entries.map(([key, value]) => <div key={key}><dt>{labelForKey(key)}</dt><dd>{formatValue(value)}</dd></div>)}</dl>}
      <div className="audit-detail-dialog__foot"><p>Enquiry values are intentionally excluded from the audit ledger.</p><button type="button" className="admin-action" onClick={onClose}>Done</button></div>
    </section>
  </div>;
}
