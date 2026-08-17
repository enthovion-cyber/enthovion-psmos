import { CompatibilityCompletenessPanel } from '../CompatibilityCompletenessPanel';
import { CompatibilityConflictPanel } from '../CompatibilityConflictPanel';
import { Field, FieldGrid } from '../MaterialCompatibilityPrimitives';
import { PsiCard } from '../../shared/PsiUi';
import type { MaterialCompatibilityDetail } from '../../types/material-compatibility.types';

export function CompatibilityReviewApprovalTab({ detail }: { detail: MaterialCompatibilityDetail }) {
  const row = detail.compatibility;
  return <div className="space-y-5"><PsiCard title="Review & Approval" subtitle="Review status, approver ownership, pending blockers, exceptions, and audit-ready review workflow."><FieldGrid><Field label="Review status" value={row.review_status} /><Field label="Submitted at" value={row.submitted_at ? new Date(row.submitted_at).toLocaleString() : null} /><Field label="Approved at" value={row.approved_at ? new Date(row.approved_at).toLocaleString() : null} /><Field label="Rejected at" value={row.rejected_at ? new Date(row.rejected_at).toLocaleString() : null} /><Field label="Approver" value={row.approved_by} /><Field label="Review due" value={row.next_review_due ? new Date(row.next_review_due).toLocaleDateString() : null} /></FieldGrid></PsiCard><CompatibilityCompletenessPanel checks={detail.completeness} score={row.completeness_score} /><CompatibilityConflictPanel conflicts={detail.conflicts} /></div>;
}

