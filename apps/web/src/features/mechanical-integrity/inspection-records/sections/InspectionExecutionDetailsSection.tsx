'use client';

export function InspectionExecutionDetailsSection({ value, onChange }: { value: Record<string, any>; onChange: (next: Record<string, any>) => void }) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h2 className="font-bold text-[var(--psm-text)]">Execution Details</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm font-semibold text-[var(--psm-text)]">Inspector Name<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.inspectorName ?? ''} onChange={(event) => set('inspectorName', event.target.value)} /></label>
        <label className="text-sm font-semibold text-[var(--psm-text)]">Qualification<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.inspectorQualification ?? ''} onChange={(event) => set('inspectorQualification', event.target.value)} /></label>
        <label className="text-sm font-semibold text-[var(--psm-text)]">Vendor<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.inspectionVendor ?? ''} onChange={(event) => set('inspectionVendor', event.target.value)} /></label>
        <label className="text-sm font-semibold text-[var(--psm-text)]">Start Time<input type="time" className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.startTime ?? ''} onChange={(event) => set('startTime', event.target.value)} /></label>
        <label className="text-sm font-semibold text-[var(--psm-text)]">End Time<input type="time" className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.endTime ?? ''} onChange={(event) => set('endTime', event.target.value)} /></label>
        <label className="text-sm font-semibold text-[var(--psm-text)]">Online / Offline<select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.onlineOfflineStatus ?? ''} onChange={(event) => set('onlineOfflineStatus', event.target.value)}><option value="">Select</option><option>Online</option><option>Offline</option><option>Shutdown</option></select></label>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {['shutdownRequired','entryRequired'].map((key) => <label key={key} className="flex items-center gap-2 text-sm text-[var(--psm-text)]"><input type="checkbox" checked={!!value[key]} onChange={(event) => set(key, event.target.checked)} /> {key === 'shutdownRequired' ? 'Shutdown required' : 'Entry required'}</label>)}
      </div>
      <textarea className="mt-4 min-h-24 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" placeholder="Inspection notes, conditions, limitations" value={value.notes ?? ''} onChange={(event) => set('notes', event.target.value)} />
    </section>
  );
}
