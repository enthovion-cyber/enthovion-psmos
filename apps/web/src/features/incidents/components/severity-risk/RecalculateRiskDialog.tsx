import { buttonPrimary, buttonSecondary } from '../shared/IncidentTabPrimitives';

export function RecalculateRiskDialog({ open, saving, onCancel, onConfirm }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-cyan-300/10 dark:bg-[#071525]">
        <h2 className="text-base font-black">Recalculate Potential Risk</h2>
        <p className="mt-2 text-sm text-slate-500">The backend will recalculate risk score, priority, level, and follow-up recommendations from current incident values and company/site risk configuration.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className={buttonSecondary} disabled={saving} onClick={onCancel}>Cancel</button>
          <button className={buttonPrimary} disabled={saving} onClick={onConfirm}>Recalculate</button>
        </div>
      </div>
    </div>
  );
}
