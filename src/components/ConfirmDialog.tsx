interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-ivory p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <p className="font-utility text-xs uppercase tracking-[0.16em] text-[#A9623E]">Needs confirmation</p>
        <h2 id="confirm-dialog-title" className="mt-3 font-display text-2xl font-semibold text-emerald-deep">
          {title}
        </h2>
        <p id="confirm-dialog-message" className="mt-3 font-body text-sm leading-6 text-stone">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-stone/30 px-5 py-2 font-utility text-xs text-stone hover:bg-stone/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            disabled={busy}
            className="rounded-full bg-red-600 px-5 py-2 font-utility text-xs text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
