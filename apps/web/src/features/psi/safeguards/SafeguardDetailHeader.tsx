import { PsiButton, PsiCard } from '../shared/PsiUi';
import { MocRequiredBadge, PssrBlockerBadge, SafeguardCompletenessBadge, SafeguardConflictBadge, SafeguardCriticalityBadge, SafeguardImpairmentBadge, SafeguardSourceStatusBadge, SafeguardTestingStatusBadge } from '../shared/SafeguardBadges';
import type { SafeguardDetail } from '../types/safeguard.types';

export function SafeguardDetailHeader({ detail, busy, onRunSourceStatus, onRunCompleteness, onRunConflict, onSubmitReview }: { detail: SafeguardDetail; busy?: boolean | undefined; onRunSourceStatus: () => void; onRunCompleteness: () => void; onRunConflict: () => void; onSubmitReview: () => void }) {
  const s = detail.safeguard;
  const submit = detail.actions.find((action) => action.key === 'submit-review');
  return <PsiCard title={s.safeguard_title} subtitle={`${s.safeguard_tag ?? 'No tag'} / ${s.unit_id} / ${s.equipment_id ?? 'Unit-level safeguard'}`}>
    <div className="flex flex-wrap gap-2"><SafeguardCriticalityBadge value={s.criticality} /><SafeguardSourceStatusBadge value={s.source_status} /><SafeguardTestingStatusBadge value={s.testing_status} /><SafeguardImpairmentBadge value={s.impairment_status} /><SafeguardCompletenessBadge value={s.completeness_status} score={s.completeness_score} /><SafeguardConflictBadge value={s.conflict_status} /><MocRequiredBadge value={s.moc_update_required} /><PssrBlockerBadge value={s.pssr_blocker} /></div>
    <div className="mt-4 flex flex-wrap gap-2">
      <PsiButton href={`/process-safety-information/safeguards/${s.id}/edit`} disabled={s.review_status === 'Approved'} title={s.review_status === 'Approved' ? 'Approved safeguard requires controlled edit/MOC.' : undefined}>Edit</PsiButton>
      <PsiButton variant="secondary" onClick={onRunSourceStatus} disabled={busy || !detail.sourceLinks.length} title={!detail.sourceLinks.length ? 'Add a source link before checking source status.' : undefined}>Check Source Status</PsiButton>
      <PsiButton variant="secondary" onClick={onRunCompleteness} disabled={busy}>Run Completeness</PsiButton>
      <PsiButton variant="secondary" onClick={onRunConflict} disabled={busy}>Run Conflict Check</PsiButton>
      <PsiButton variant="secondary" onClick={onSubmitReview} disabled={busy || !submit?.enabled} title={submit?.disabledReason ?? undefined}>Submit Review</PsiButton>
    </div>
  </PsiCard>;
}
