import { PsiButton, PsiCard } from '../shared/PsiUi';

export function ElectricalClassificationHeader({ lastUpdated, unitId }: { lastUpdated?: string | null | undefined; unitId?: string | null | undefined }) {
  const createHref = unitId ? `/process-safety-information/units/${unitId}/electrical-classification/new` : '/process-safety-information/electrical-classification/new';
  return (
    <PsiCard title="Electrical Classification" subtitle="Hazardous area classification, Ex protection requirements, installed equipment rating checks, ignition controls, drawings, completeness, and approval readiness.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--psm-muted)]">Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Not available'}</p>
        <div className="flex flex-wrap gap-2">
          <PsiButton href={createHref}>New Classification</PsiButton>
          <PsiButton href="/process-safety-information/electrical-classification/import" variant="secondary">Import</PsiButton>
          <PsiButton href="/process-safety-information/electrical-classification/rating-mismatches" variant="secondary">Rating Mismatches</PsiButton>
          <PsiButton href="/process-safety-information/electrical-classification/pssr-blockers" variant="secondary">PSSR Blockers</PsiButton>
        </div>
      </div>
    </PsiCard>
  );
}
