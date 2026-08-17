import { PsiCard } from '../../shared/PsiUi';
import type { ReliefSystemDetail } from '../../types/relief-system.types';
import { ReliefSystemFieldGrid, valueOf } from '../ReliefSystemFieldGrid';

export function ReliefReviewApprovalTab({ detail }: { detail: ReliefSystemDetail }) {
  const basis = detail.reliefBasis;
  return (
    <PsiCard title="Review & Approval" subtitle="Review route, approval state, readiness blockers, MOC/PSSR blockers, conflict overrides, immutable audit/history, and closed/read-only controls.">
      <ReliefSystemFieldGrid items={[
        { label: 'Review status', value: valueOf(basis, 'review_status') },
        { label: 'Status', value: valueOf(basis, 'status') },
        { label: 'Completeness status', value: valueOf(basis, 'completeness_status') },
        { label: 'Conflict status', value: valueOf(basis, 'conflict_status') },
        { label: 'MOC update required', value: valueOf(basis, 'moc_update_required') },
        { label: 'PSSR blocker', value: valueOf(basis, 'pssr_blocker') },
        { label: 'MI readiness impact', value: valueOf(basis, 'mi_readiness_impact') },
        { label: 'Last review date', value: valueOf(basis, 'last_review_date') },
        { label: 'Next review due', value: valueOf(basis, 'next_review_due') }
      ]} />
    </PsiCard>
  );
}
