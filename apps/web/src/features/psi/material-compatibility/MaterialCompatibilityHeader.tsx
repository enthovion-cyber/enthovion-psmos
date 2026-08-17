import { PsiButton, PsiCard } from '../shared/PsiUi';

export function MaterialCompatibilityHeader({ lastUpdated, unitId }: { lastUpdated?: string | undefined; unitId?: string | undefined }) {
  const createHref = unitId ? `/process-safety-information/units/${unitId}/material-compatibility/new` : '/process-safety-information/material-compatibility/new';
  return (
    <PsiCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Process Safety Information</p>
          <h1 className="mt-1 text-2xl font-bold">Material Compatibility</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Chemical-to-material, gasket, lining, elastomer, seal, equipment, and service-condition compatibility with backend conflict checks, MOC/PSSR blockers, MI readiness impact, and document evidence.</p>
          <p className="mt-2 text-xs text-[var(--psm-muted)]">Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Not available'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PsiButton href={createHref}>Create Record</PsiButton>
          <PsiButton href="/process-safety-information/material-compatibility/import" variant="secondary">Import</PsiButton>
          <PsiButton href="/process-safety-information/material-compatibility/conflicts" variant="secondary">Conflicts</PsiButton>
          <PsiButton href="/process-safety-information/material-compatibility/pssr-blockers" variant="secondary">PSSR Blockers</PsiButton>
          <PsiButton href="/process-safety-information/material-compatibility/mi-readiness-impact" variant="secondary">MI Impact</PsiButton>
        </div>
      </div>
    </PsiCard>
  );
}
