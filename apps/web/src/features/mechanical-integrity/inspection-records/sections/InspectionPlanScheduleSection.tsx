'use client';

export function InspectionPlanScheduleSection({ value, onChange }: { value: Record<string, any>; onChange: (next: Record<string, any>) => void }) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h2 className="font-bold text-[var(--psm-text)]">Plan / Schedule Snapshot</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="text-sm font-semibold text-[var(--psm-text)]">Inspection Type<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.inspectionType ?? ''} onChange={(event) => set('inspectionType', event.target.value)} /></label>
        <label className="text-sm font-semibold text-[var(--psm-text)]">Method<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.inspectionMethod ?? ''} onChange={(event) => set('inspectionMethod', event.target.value)} /></label>
        <label className="text-sm font-semibold text-[var(--psm-text)]">Inspection Date<input type="date" className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.inspectionDate ?? ''} onChange={(event) => set('inspectionDate', event.target.value)} /></label>
        <label className="text-sm font-semibold text-[var(--psm-text)]">Result<select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.result ?? 'Not Evaluated'} onChange={(event) => set('result', event.target.value)}>{['Not Evaluated','Pass','Pass with Recommendations','Conditional Acceptance','Fail','Engineering Review Required'].map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
    </section>
  );
}
