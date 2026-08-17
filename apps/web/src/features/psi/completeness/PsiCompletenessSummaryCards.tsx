import type { PsiCompletenessDashboard } from '../types/psi-completeness.types';
import { PsiMetricCard } from '../shared/PsiUi';

export function PsiCompletenessSummaryCards({ dashboard }: { dashboard: PsiCompletenessDashboard }) {
  const summary = dashboard.summary ?? {};
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <PsiMetricCard label="Overall Score" value={`${Math.round(Number(summary.overallScore ?? 0))}%`} tone={Number(summary.overallScore ?? 0) >= 90 ? 'good' : Number(summary.overallScore ?? 0) < 50 ? 'danger' : 'warn'} />
      <PsiMetricCard label="Score Status" value={summary.scoreStatus ?? 'Unknown'} />
      <PsiMetricCard label="Complete Units" value={summary.completeUnits ?? 0} tone="good" />
      <PsiMetricCard label="Incomplete Units" value={summary.incompleteUnits ?? 0} tone="warn" />
      <PsiMetricCard label="Critical Gap Units" value={summary.unitsWithCriticalGaps ?? 0} tone="danger" href="/process-safety-information/completeness/critical-gaps" />
      <PsiMetricCard label="PSSR Blockers" value={summary.unitsWithPssrBlockers ?? 0} tone="danger" href="/process-safety-information/completeness/pssr-blockers" />
      <PsiMetricCard label="MOC Required" value={summary.unitsWithMocUpdatesRequired ?? 0} tone="warn" href="/process-safety-information/completeness/moc-required" />
      <PsiMetricCard label="Document Gaps" value={summary.documentGaps ?? 0} tone="warn" href="/process-safety-information/completeness/document-gaps" />
      <PsiMetricCard label="Conflicts" value={summary.conflicts ?? 0} tone="danger" href="/process-safety-information/completeness/conflicts" />
      <PsiMetricCard label="Review Overdue" value={summary.reviewOverdue ?? 0} tone="warn" href="/process-safety-information/completeness/review-overdue" />
      <PsiMetricCard label="Pending Waivers" value={summary.pendingWaivers ?? 0} href="/process-safety-information/completeness/waivers" />
      <PsiMetricCard label="Gap Actions Open" value={summary.openActionsFromPsiGaps ?? 0} href="/process-safety-information/completeness/gaps" />
    </div>
  );
}
