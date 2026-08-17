import Link from 'next/link';
import type { PsiUnit } from '../types/psi-unit.types';
import { PsiCompletenessBadge } from '../shared/PsiCompletenessBadge';
import { PsiCriticalGapBadge } from '../shared/PsiCriticalGapBadge';
import { PsiReviewStatusBadge } from '../shared/PsiReviewStatusBadge';
import { PsiButton } from '../shared/PsiUi';

export function PsiUnitDetailHeader({ unit, onRunCompleteness, onSubmitReview, isBusy }: { unit: PsiUnit; onRunCompleteness?: () => void; onSubmitReview?: () => void; isBusy?: boolean }) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">{unit.unit_code}</p>
          <h1 className="text-2xl font-bold">{unit.unit_name}</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">{unit.site?.name ?? unit.site_id}{unit.area ? ` / ${unit.area.name}` : ''} - {unit.unit_type}</p>
          <div className="mt-3 flex flex-wrap gap-2"><PsiCompletenessBadge status={unit.completeness_status} score={Number(unit.completeness_score ?? 0)} /><PsiCriticalGapBadge count={unit.critical_gap_count} blocker={unit.pssr_blocker} /><PsiReviewStatusBadge status={unit.review_status} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PsiButton href={`/process-safety-information/units/${unit.id}/edit`} variant="secondary">Edit profile</PsiButton>
          <PsiButton onClick={onRunCompleteness ?? (() => undefined)} disabled={Boolean(isBusy)} title="Requires psi.completeness.run permission">Run completeness check</PsiButton>
          <PsiButton href={`/process-safety-information/units/${unit.id}/documents`} variant="secondary">Link document</PsiButton>
          <PsiButton onClick={onSubmitReview ?? (() => undefined)} disabled={Boolean(isBusy)} title="Requires process purpose, PSI owner, and review frequency">Submit for review</PsiButton>
          <Link className="inline-flex min-h-10 items-center rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-4 text-sm font-semibold" href="/moc/new">Create MOC update request</Link>
        </div>
      </div>
    </header>
  );
}
