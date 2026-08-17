import { PsiCard } from '../../shared/PsiUi';
import type { ElectricalDetail } from '../../types/electrical-classification.types';

export function ElectricalReviewApprovalTab({ detail }: { detail: ElectricalDetail }) {
  return <PsiCard title="Review & Approval" subtitle="Submit/approve/reject state is backend-controlled and blocked by required evidence, conflicts, MOC/PSSR blockers, missing release source, missing ventilation basis, and rating mismatches."><div className="grid gap-3 md:grid-cols-3"><p><strong>Review status:</strong> {detail.classification.review_status}</p><p><strong>Classification status:</strong> {detail.classification.classification_status}</p><p><strong>Next review due:</strong> {detail.classification.next_review_due || 'Not set'}</p></div></PsiCard>;
}
