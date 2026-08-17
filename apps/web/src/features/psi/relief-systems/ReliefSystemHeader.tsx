import { PsiButton, PsiCard } from '../shared/PsiUi';
import { ReliefSystemExportButton } from './ReliefSystemExportButton';

export function ReliefSystemHeader({ unitId, lastUpdated }: { unitId?: string | undefined; lastUpdated?: string | null | undefined }) {
  const newHref = unitId ? `/process-safety-information/units/${unitId}/relief-systems/new` : '/process-safety-information/relief-systems/new';
  return (
    <PsiCard title="Relief Systems Design Basis" subtitle="Pressure relief design basis registry, protected equipment coverage, governing cases, sizing capacity, discharge destination, MI sync, and PSI readiness.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--psm-muted)]">Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Not available'}</p>
        <div className="flex flex-wrap gap-2">
          <PsiButton href={newHref}>New Relief Basis</PsiButton>
          <PsiButton href="/process-safety-information/relief-systems/import" variant="secondary">Import</PsiButton>
          <PsiButton href="/process-safety-information/relief-systems/missing" variant="secondary">Missing Basis</PsiButton>
          <PsiButton href="/process-safety-information/relief-systems/conflicts" variant="secondary">Conflicts</PsiButton>
          <ReliefSystemExportButton />
        </div>
      </div>
    </PsiCard>
  );
}
