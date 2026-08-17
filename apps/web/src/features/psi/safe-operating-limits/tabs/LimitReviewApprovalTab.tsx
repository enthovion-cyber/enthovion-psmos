import { LimitCompletenessBadge } from '../../shared/LimitCompletenessBadge';
import { LimitConflictBadge } from '../../shared/LimitConflictBadge';
import { PsiCard } from '../../shared/PsiUi';
import { SafeLimitStatusBadge } from '../../shared/SafeLimitStatusBadge';
import type { SafeOperatingLimitDetail } from '../../types/safe-operating-limit.types';

export function LimitReviewApprovalTab({ detail }: { detail: SafeOperatingLimitDetail }) {
  return <PsiCard title="Review & Approval" subtitle="SOL review state with blockers from completeness, conflict validation, MOC, and PSSR readiness."><div className="grid gap-3 md:grid-cols-3"><div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase text-[var(--psm-muted)]">Status</dt><dd className="mt-2"><SafeLimitStatusBadge status={detail.limit.status} /></dd></div><div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase text-[var(--psm-muted)]">Completeness</dt><dd className="mt-2"><LimitCompletenessBadge status={detail.limit.completeness_status} score={detail.limit.completeness_score} /></dd></div><div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase text-[var(--psm-muted)]">Conflict</dt><dd className="mt-2"><LimitConflictBadge status={detail.limit.conflict_status} /></dd></div></div></PsiCard>;
}
