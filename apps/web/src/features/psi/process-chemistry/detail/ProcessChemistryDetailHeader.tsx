import { ChemistryCompletenessBadge } from '../../shared/ChemistryCompletenessBadge';
import { ChemistryTypeBadge } from '../../shared/ChemistryTypeBadge';
import { MocRequiredBadge } from '../../shared/MocRequiredBadge';
import { PssrBlockerBadge } from '../../shared/PssrBlockerBadge';
import { PsiButton } from '../../shared/PsiUi';
import { RunawayPotentialBadge } from '../../shared/RunawayPotentialBadge';
import type { ProcessChemistryDetail } from '../../types/process-chemistry.types';

export function ProcessChemistryDetailHeader({ detail, onRunCompleteness, onSubmitReview, busy }: { detail: ProcessChemistryDetail; onRunCompleteness: () => void; onSubmitReview: () => void; busy?: boolean | undefined }) {
  const row = detail.chemistry;
  const locked = row.review_status === 'Approved';
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Process Chemistry Detail</p>
          <h1 className="mt-1 text-2xl font-bold">{row.chemistry_name}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">{row.process_chemistry_summary ?? 'No chemistry summary recorded.'}</p>
          <div className="mt-3 flex flex-wrap gap-2"><ChemistryTypeBadge value={row.chemistry_type} /><RunawayPotentialBadge value={row.runaway_potential} /><ChemistryCompletenessBadge status={row.completeness_status} score={row.completeness_score} /><MocRequiredBadge value={row.moc_update_required} /><PssrBlockerBadge value={row.pssr_blocker} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PsiButton href={`/process-safety-information/process-chemistry/${row.id}/edit`} disabled={locked} title={locked ? 'Approved chemistry requires controlled edit/MOC.' : undefined} variant="secondary">Edit</PsiButton>
          <PsiButton onClick={onRunCompleteness} disabled={busy} variant="secondary">Run Completeness</PsiButton>
          <PsiButton onClick={onSubmitReview} disabled={busy || locked} title={locked ? 'Record is already approved.' : undefined}>Submit Review</PsiButton>
        </div>
      </div>
    </div>
  );
}
