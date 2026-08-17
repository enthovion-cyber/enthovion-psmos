import { PsiCard } from '../../shared/PsiUi';
import type { DrawingDetail } from '../../types/drawing.types';

export function DrawingReviewApprovalTab({ detail }: { detail: DrawingDetail }) {
  return <PsiCard title="Review & Approval" subtitle="PSI review status is separate from Document Control file approval; both are shown so they do not conflict."><div className="grid gap-3 md:grid-cols-3"><div><p className="text-xs text-[var(--psm-muted)]">Review status</p><p className="font-semibold">{detail.drawing.review_status}</p></div><div><p className="text-xs text-[var(--psm-muted)]">Document status</p><p className="font-semibold">{detail.drawing.document_status ?? 'No document'}</p></div><div><p className="text-xs text-[var(--psm-muted)]">Disabled reason</p><p className="font-semibold">{detail.actions.find((action) => action.key === 'submit-review')?.disabledReason ?? 'Ready when checks are clear'}</p></div></div></PsiCard>;
}
