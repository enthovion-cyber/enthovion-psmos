'use client';

import { PsiCard } from '../shared/PsiUi';

export function ReliefSystemFilters({ filters, onChange, savedViews }: { filters: Record<string, unknown>; onChange: (filters: Record<string, unknown>) => void; savedViews: string[] }) {
  const patch = (input: Record<string, unknown>) => onChange({ ...filters, ...input, page: 1 });
  return (
    <PsiCard title="Filters / Search" subtitle="Server-side search, filter, saved views, and preset relief-system work queues.">
      <div className="grid gap-3 md:grid-cols-4">
        <input value={String(filters.search ?? '')} onChange={(e) => patch({ search: e.target.value })} placeholder="Search equipment, device, scenario" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <select value={String(filters.reliefSystemType ?? '')} onChange={(e) => patch({ reliefSystemType: e.target.value || undefined })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">Relief type</option>{['PSV','Rupture Disc','Conservation Vent','Thermal Relief','Atmospheric Vent','Flare Header','Scrubber','Emergency Vent','Other'].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={String(filters.calculationStatus ?? '')} onChange={(e) => patch({ calculationStatus: e.target.value || undefined })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">Calculation</option>{['Complete','Missing','Needs Update','Not Required','Not Reviewed'].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={String(filters.conflictStatus ?? '')} onChange={(e) => patch({ conflictStatus: e.target.value || undefined })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">Conflict status</option>{['No Conflict','Warning','Major Conflict','Critical Conflict','Override Approved','Not Reviewed'].map((item) => <option key={item}>{item}</option>)}</select>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={filters.safetyCritical === 'true'} onChange={(e) => patch({ safetyCritical: e.target.checked ? 'true' : undefined })} /> Safety-critical</label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={filters.mocRequired === 'true'} onChange={(e) => patch({ mocRequired: e.target.checked ? 'true' : undefined })} /> MOC required</label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={filters.pssrBlocker === 'true'} onChange={(e) => patch({ pssrBlocker: e.target.checked ? 'true' : undefined })} /> PSSR blocker</label>
        <select value={String(filters.savedView ?? '')} onChange={(e) => patch({ savedView: e.target.value || undefined })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">Saved view</option>{savedViews.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
    </PsiCard>
  );
}
