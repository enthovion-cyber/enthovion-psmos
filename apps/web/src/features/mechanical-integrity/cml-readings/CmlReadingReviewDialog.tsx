'use client';

export function CmlReadingReviewDialog({ open, title = 'Review Reading', onClose, onSubmit }: { open: boolean; title?: string; onClose: () => void; onSubmit: (comment: string) => void }) {
  if (!open) return null;
  let comment = '';
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-xl"><h3 className="font-bold text-[var(--psm-text)]">{title}</h3><textarea className="mt-3 min-h-24 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm text-[var(--psm-text)]" onChange={(event) => { comment = event.target.value; }} /><div className="mt-4 flex justify-end gap-2"><button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)]" onClick={onClose}>Cancel</button><button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white" onClick={() => onSubmit(comment)}>Submit</button></div></div></div>;
}
