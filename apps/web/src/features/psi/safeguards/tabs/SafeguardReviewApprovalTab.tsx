import { PsiButton, PsiCard } from '../../shared/PsiUi';
import type { SafeguardDetail } from '../../types/safeguard.types';

export function SafeguardReviewApprovalTab({ detail, onSubmitReview, busy }: { detail: SafeguardDetail; onSubmitReview: () => void; busy?: boolean | undefined }) {
  const submit = detail.actions.find((action) => action.key === 'submit-review');
  return <PsiCard title="Review & Approval" subtitle="Backend-controlled review readiness. Critical conflicts and critical completeness gaps block review unless controlled override exists."><div className="grid gap-3 md:grid-cols-3"><p><strong>Status:</strong> {detail.safeguard.review_status}</p><p><strong>Completeness:</strong> {detail.safeguard.completeness_status}</p><p><strong>Conflict:</strong> {detail.safeguard.conflict_status}</p></div><div className="mt-4 flex flex-wrap gap-2">{detail.actions.map((action) => <PsiButton key={action.key} variant="secondary" disabled={!action.enabled || busy} title={action.disabledReason ?? undefined} onClick={action.key === 'submit-review' ? onSubmitReview : undefined}>{action.label}</PsiButton>)}</div>{submit?.disabledReason ? <p className="mt-3 text-sm text-warning">{submit.disabledReason}</p> : null}</PsiCard>;
}
