'use client';

export function InspectionContextSection({ value, onChange, equipmentId }: { value: Record<string, any>; onChange: (next: Record<string, any>) => void; equipmentId?: string | undefined }) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h2 className="font-bold text-[var(--psm-text)]">Inspection Context</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {!equipmentId ? <label className="text-sm font-semibold text-[var(--psm-text)]">Equipment ID<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.equipmentId ?? ''} onChange={(event) => set('equipmentId', event.target.value)} /></label> : null}
        <label className="text-sm font-semibold text-[var(--psm-text)]">Plan ID<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.planId ?? ''} onChange={(event) => set('planId', event.target.value)} /></label>
        <label className="text-sm font-semibold text-[var(--psm-text)]">Scheduled Occurrence ID<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.occurrenceId ?? ''} onChange={(event) => set('occurrenceId', event.target.value)} /></label>
        <label className="text-sm font-semibold text-[var(--psm-text)]">Inspection Number<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" placeholder="Auto if blank" value={value.inspectionNumber ?? ''} onChange={(event) => set('inspectionNumber', event.target.value)} /></label>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-[var(--psm-text)]"><input type="checkbox" checked={value.planned !== false} onChange={(event) => set('planned', event.target.checked)} /> Planned inspection</label>
      {value.planned === false ? <input className="mt-3 w-full rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-[var(--psm-text)]" placeholder="Unplanned inspection reason is required" value={value.unplannedReason ?? ''} onChange={(event) => set('unplannedReason', event.target.value)} /> : null}
    </section>
  );
}
