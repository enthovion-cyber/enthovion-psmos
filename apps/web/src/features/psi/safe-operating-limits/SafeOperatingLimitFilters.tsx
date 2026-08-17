'use client';

import { PsiCard } from '../shared/PsiUi';

export function SafeOperatingLimitFilters({ filters, onChange, savedViews }: { filters: Record<string, unknown>; onChange: (filters: Record<string, unknown>) => void; savedViews: string[] }) {
  const patch = (input: Record<string, unknown>) => onChange({ ...filters, page: 1, ...input });
  return (
    <PsiCard title="Filters / Saved Views" subtitle="Server-side search, filtering, sorting, and saved views for SOL records.">
      <div className="grid gap-3 md:grid-cols-4">
        <input value={String(filters.search ?? '')} onChange={(e) => patch({ search: e.target.value })} placeholder="Search parameter or tag" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <select value={String(filters.criticality ?? '')} onChange={(e) => patch({ criticality: e.target.value || undefined })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">Criticality</option>{['Low','Medium','High','Critical'].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={String(filters.reviewStatus ?? '')} onChange={(e) => patch({ reviewStatus: e.target.value || undefined })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">Review status</option>{['Not Reviewed','Submitted','Pending Approval','Approved','Rejected'].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={String(filters.conflictStatus ?? '')} onChange={(e) => patch({ conflictStatus: e.target.value || undefined })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">Conflict status</option>{['No Conflict','Warning','Major Conflict','Critical Conflict','Override Approved','Not Reviewed'].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={String(filters.completenessStatus ?? '')} onChange={(e) => patch({ completenessStatus: e.target.value || undefined })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">Completeness</option>{['Complete','Mostly Complete','Incomplete','Critical Gaps','Not Reviewed'].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={String(filters.mocRequired ?? '')} onChange={(e) => patch({ mocRequired: e.target.value || undefined })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">MOC required</option><option value="true">Yes</option></select>
        <select value={String(filters.pssrBlocker ?? '')} onChange={(e) => patch({ pssrBlocker: e.target.value || undefined })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">PSSR blocker</option><option value="true">Yes</option></select>
        <select value={String(filters.sort ?? 'updated_at.desc')} onChange={(e) => patch({ sort: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="updated_at.desc">Newest updated</option><option value="parameter_name.asc">Parameter A-Z</option><option value="criticality.desc">Criticality</option><option value="review_status.asc">Review status</option></select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{savedViews.map((view) => <button key={view} type="button" onClick={() => patch(view === 'Critical Limits' ? { critical: 'true' } : view === 'Conflicts' ? { conflicts: 'true' } : view === 'MOC Required' ? { mocRequired: 'true' } : view === 'PSSR Blockers' ? { pssrBlocker: 'true' } : view.includes('Missing') ? { missing: 'true' } : {})} className="rounded-full border border-[var(--psm-line)] px-3 py-1 text-xs font-semibold text-[var(--psm-muted)] hover:text-[var(--psm-fg)]">{view}</button>)}</div>
    </PsiCard>
  );
}
