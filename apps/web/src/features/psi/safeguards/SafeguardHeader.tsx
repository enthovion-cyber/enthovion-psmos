import { PsiButton, PsiCard } from '../shared/PsiUi';

export function SafeguardHeader({ lastUpdated, unitId }: { lastUpdated?: string | undefined; unitId?: string | undefined }) {
  const createHref = unitId ? `/process-safety-information/units/${unitId}/safeguards/new` : '/process-safety-information/safeguards/new';
  return (
    <PsiCard title="Safeguards / Controls" subtitle="Structured PSI safeguard truth layer for prevention, detection, control, mitigation, emergency response, IPL foundation, evidence, completeness, conflicts, MOC, PSSR, and MI readiness.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--psm-muted)]">Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Not available'}</p>
        <div className="flex flex-wrap gap-2">
          <PsiButton href={createHref}>Create Safeguard</PsiButton>
          <PsiButton variant="secondary" href="/process-safety-information/safeguards/import">Import</PsiButton>
          <PsiButton variant="secondary" href="/process-safety-information/safeguards/critical">Critical View</PsiButton>
        </div>
      </div>
    </PsiCard>
  );
}
