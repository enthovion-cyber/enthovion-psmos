import { LimitCompletenessBadge } from '../shared/LimitCompletenessBadge';
import { LimitConflictBadge } from '../shared/LimitConflictBadge';
import { LimitCriticalityBadge } from '../shared/LimitCriticalityBadge';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PsiButton } from '../shared/PsiUi';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';
import { SafeLimitStatusBadge } from '../shared/SafeLimitStatusBadge';
import type { SafeOperatingLimitDetail } from '../types/safe-operating-limit.types';

export function SafeOperatingLimitDetailHeader({ detail, onRunCompleteness, onRunConflict, onSubmitReview, busy }: { detail: SafeOperatingLimitDetail; onRunCompleteness: () => void; onRunConflict: () => void; onSubmitReview: () => void; busy?: boolean }) {
  const row = detail.limit;
  const locked = row.review_status === 'Approved';
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Safe Operating Limit</p>
          <h1 className="mt-1 text-2xl font-bold">{row.limit_title}</h1>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">{row.parameter_name}{row.parameter_tag ? ` / ${row.parameter_tag}` : ''} | {row.unit_of_measure}</p>
          <div className="mt-3 flex flex-wrap gap-2"><SafeLimitStatusBadge status={row.status} /><LimitCriticalityBadge value={row.criticality} /><LimitConflictBadge status={row.conflict_status} /><LimitCompletenessBadge status={row.completeness_status} score={row.completeness_score} /><MocRequiredBadge value={row.moc_update_required} /><PssrBlockerBadge value={row.pssr_blocker} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PsiButton href={`/process-safety-information/safe-operating-limits/${row.id}/edit`} disabled={locked} title={locked ? 'Approved SOL requires controlled edit/MOC.' : undefined} variant="secondary">Edit</PsiButton>
          <PsiButton onClick={onRunCompleteness} disabled={busy} variant="secondary">Run Completeness</PsiButton>
          <PsiButton onClick={onRunConflict} disabled={busy} variant="secondary">Run Conflict Check</PsiButton>
          <PsiButton onClick={onSubmitReview} disabled={busy || locked} title={locked ? 'Already approved/read-only.' : undefined}>Submit Review</PsiButton>
        </div>
      </div>
    </div>
  );
}
