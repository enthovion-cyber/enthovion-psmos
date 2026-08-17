import { PsiButton, PsiCard } from '../shared/PsiUi';

export function DrawingHeader({ unitId, lastUpdated }: { unitId?: string | undefined; lastUpdated?: string | null | undefined }) {
  const newHref = unitId ? `/process-safety-information/units/${unitId}/drawings/new` : '/process-safety-information/drawings/new';
  return (
    <PsiCard title="Drawings / P&IDs" subtitle="Current approved drawing truth layer for PFDs, P&IDs, plot plans, loop drawings, C&E matrices, control narratives, tag index, MOC updates, as-built verification, and PSSR readiness.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--psm-muted)]">Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Not available'}</p>
        <div className="flex flex-wrap gap-2">
          <PsiButton href={newHref}>New Drawing</PsiButton>
          <PsiButton href="/process-safety-information/drawings/import" variant="secondary">Import</PsiButton>
          <PsiButton href="/process-safety-information/drawings/missing" variant="secondary">Missing</PsiButton>
          <PsiButton href="/process-safety-information/drawings/tag-index" variant="secondary">Tag Index</PsiButton>
          <PsiButton href="/process-safety-information/drawings/export" variant="secondary">Export</PsiButton>
        </div>
      </div>
    </PsiCard>
  );
}
