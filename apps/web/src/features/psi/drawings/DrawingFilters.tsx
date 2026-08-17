import { PsiButton, PsiCard } from '../shared/PsiUi';

export function DrawingFilters({ filters, onChange, savedViews }: { filters: Record<string, unknown>; onChange: (filters: Record<string, unknown>) => void; savedViews: string[] }) {
  const update = (patch: Record<string, unknown>) => onChange({ ...filters, ...patch, page: 1 });
  return (
    <PsiCard title="Filters / Search" subtitle="Server-side search, filtering, sorting, saved views, and PDF-required register states.">
      <div className="grid gap-3 md:grid-cols-4">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search drawing number/title" value={String(filters.search ?? '')} onChange={(event) => update({ search: event.target.value })} />
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.drawingType ?? '')} onChange={(event) => update({ drawingType: event.target.value || undefined })}>
          <option value="">All drawing types</option>
          {['P&ID', 'PFD', 'Plot plan', 'Equipment layout', 'Instrument loop drawing', 'Cause & effect matrix', 'Control narrative', 'Logic diagram', 'Relief system drawing'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.reviewStatus ?? '')} onChange={(event) => update({ reviewStatus: event.target.value || undefined })}>
          <option value="">All review statuses</option>
          {['Not Reviewed', 'Submitted', 'Pending Review', 'Approved', 'Rejected'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.sort ?? 'updated_at.desc')} onChange={(event) => onChange({ ...filters, sort: event.target.value })}>
          <option value="updated_at.desc">Newest updated</option>
          <option value="drawing_number.asc">Drawing number</option>
          <option value="next_review_due.asc">Next review due</option>
          <option value="completeness_status.asc">Completeness</option>
        </select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {savedViews.map((view) => <PsiButton key={view} variant="secondary" onClick={() => update(view === 'P&IDs' ? { drawingType: 'P&ID' } : view === 'PFDs' ? { drawingType: 'PFD' } : view === 'MOC Updates Required' ? { mocRequired: 'true' } : view === 'PSSR Blockers' ? { pssrBlocker: 'true' } : view === 'Current Approved' ? { currentApproved: 'true' } : {})}>{view}</PsiButton>)}
      </div>
    </PsiCard>
  );
}
