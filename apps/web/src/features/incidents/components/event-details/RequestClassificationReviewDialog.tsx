import { buttonPrimary, buttonSecondary, TextArea } from '../shared/IncidentTabPrimitives';

export function RequestClassificationReviewDialog({ open, reason, setReason, saving, onCancel, onConfirm }: any) {
  if (!open) return null;
  return <Dialog title="Request Classification Review" reason={reason} setReason={setReason} saving={saving} onCancel={onCancel} onConfirm={onConfirm} confirmLabel="Request Review" />;
}

function Dialog({ title, reason, setReason, saving, onCancel, onConfirm, confirmLabel }: any) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-cyan-300/10 dark:bg-[#071525]">
        <h2 className="text-base font-black">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">A reason/comment is stored in audit and incident history.</p>
        <div className="mt-4"><TextArea label="Reason / comment" value={reason} onChange={setReason} /></div>
        <div className="mt-4 flex justify-end gap-2">
          <button className={buttonSecondary} disabled={saving} onClick={onCancel}>Cancel</button>
          <button className={buttonPrimary} disabled={saving} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
