import { PsiButton } from '../shared/PsiUi';

export function ProcessChemistryHeader({ unitId, lastUpdated }: { unitId?: string | undefined; lastUpdated?: string | undefined }) {
  const newHref = unitId ? `/process-safety-information/units/${unitId}/process-chemistry/new` : '/process-safety-information/process-chemistry/new';
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase text-primary">PSI Phase 3</p>
        <h1 className="text-2xl font-bold text-[var(--psm-fg)]">Process Chemistry</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Define reaction chemistry, chemical roles, normal conditions, reactive hazards, unwanted scenarios, safeguards, completeness, and review readiness from real PSI data.</p>
        {lastUpdated ? <p className="mt-1 text-xs text-[var(--psm-muted)]">Last updated {new Date(lastUpdated).toLocaleString()}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <PsiButton href="/process-safety-information/process-chemistry/import" variant="secondary">Import</PsiButton>
        <PsiButton href={newHref}>New Chemistry</PsiButton>
      </div>
    </div>
  );
}
