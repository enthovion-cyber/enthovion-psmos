import { SummaryGrid } from '../safeguards/SafeguardUiPrimitives';

export function ReviewApprovalSummaryCards({ summary }: { summary?: Record<string, number> | undefined }) {
  const value = (key: string) => summary?.[key] ?? 0;
  return (
    <SummaryGrid cards={[
      ['My Pending', value('myPendingApprovals'), 'Assigned to me or delegated to me'],
      ['Total Pending', value('totalPendingApprovals'), 'Submitted and in workflow'],
      ['Overdue', value('overdueApprovals'), 'Due date exceeded'],
      ['Escalated', value('escalatedApprovals'), 'Management attention required'],
      ['Returned', value('returnedForCorrection'), 'Back with originator'],
      ['Rejected This Month', value('rejectedThisMonth'), 'Rejected in current month'],
      ['Approved This Month', value('approvedThisMonth'), 'Approved or completed'],
      ['Safety-Critical Pending', value('safetyCriticalPending'), 'PSM/safety critical records'],
      ['Startup/Readiness Pending', value('startupReadinessPending'), 'Readiness or startup blockers'],
      ['Bypass/Impairment Pending', value('bypassImpairmentPending'), 'Safeguard impairment reviews'],
      ['Critical Deficiency Pending', value('criticalDeficiencyPending'), 'Critical deficiencies'],
      ['Work Orders Pending', value('workOrdersPendingApproval'), 'MI work orders'],
      ['Readiness Pending', value('readinessAssessmentsPending'), 'Startup/readiness assessments'],
      ['Document Waivers Pending', value('documentWaiversPending'), 'Document waiver approvals'],
      ['E-Signature Required', value('eSignatureRequired'), 'Universal E-Signature route'],
      ['Delegated to Me', value('delegatedToMe'), 'Delegated approvals'],
      ['Near Due', value('approvalsNearDue'), 'Due within 24 hours']
    ]} />
  );
}
