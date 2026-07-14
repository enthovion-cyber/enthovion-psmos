import { buttonPrimary, buttonSecondary, TextArea } from '../shared/IncidentTabPrimitives';

export function RejectSeverityDialog({ open, reason, setReason, saving, onCancel, onConfirm }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-cyan-300/10 dark:bg-[#071525]">
        <h2 className="text-base font-black">Reject Severity Review</h2>
        <p className="mt-1 text-xs text-slate-500">Rejection requires a reason and keeps severity readiness open.</p>
        <div className="mt-4"><TextArea label="Rejection reason" value={reason} onChange={setReason} /></div>
        <div className="mt-4 flex justify-end gap-2">
          <button className={buttonSecondary} disabled={saving} onClick={onCancel}>Cancel</button>
          <button className={buttonPrimary} disabled={saving || !reason.trim()} onClick={onConfirm}>Reject</button>
        </div>
      </div>
    </div>
  );
}
