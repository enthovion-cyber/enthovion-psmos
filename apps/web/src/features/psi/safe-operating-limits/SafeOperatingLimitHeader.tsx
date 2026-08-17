import { PsiButton } from '../shared/PsiUi';

export function SafeOperatingLimitHeader({ unitId, lastUpdated }: { unitId?: string | undefined; lastUpdated?: string | undefined }) {
  const newHref = unitId ? `/process-safety-information/units/${unitId}/safe-operating-limits/new` : '/process-safety-information/safe-operating-limits/new';
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Process Safety Information</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--psm-fg)]">Safe Operating Limits</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Approved operating envelopes, alarm/trip/design/safe boundaries, deviation consequences, operator responses, safeguards, conflict validation, and PSI completeness impact.</p>
        {lastUpdated ? <p className="mt-1 text-xs text-[var(--psm-muted)]">Last updated {new Date(lastUpdated).toLocaleString()}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <PsiButton href={newHref}>Create SOL</PsiButton>
        <PsiButton href="/process-safety-information/safe-operating-limits/import" variant="secondary">Import</PsiButton>
        <PsiButton href="/process-safety-information/safe-operating-limits/conflicts" variant="secondary">Conflicts</PsiButton>
        <PsiButton href="/process-safety-information/safe-operating-limits/moc-required" variant="secondary">MOC Required</PsiButton>
      </div>
    </div>
  );
}
