import { Field, buttonSecondary, formatDate, InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';

export function SeverityReviewApprovalPanel({ data, permissions, reason, setReason, saving, onApprove, onReject }: any) {
  return (
    <TabPanel title="Severity Review / Approval Panel">
      <InfoRows rows={[
        ['Status', data?.status],
        ['Review required', data?.severityReviewRequired ? 'Yes' : 'No'],
        ['Requested at', formatDate(data?.requestedAt)],
        ['Decision', data?.decision ?? '-'],
        ['Decided at', formatDate(data?.decidedAt)],
        ['Reason', data?.reason ?? '-']
      ]} />
      <div className="mt-3"><Field label="Review/action reason" value={reason} onChange={setReason} /></div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={buttonSecondary} disabled={saving || !permissions?.canApproveReview || permissions?.readOnly} title={!permissions?.canApproveReview ? 'Missing incidents.severity.review.approve permission' : permissions?.readOnly ? 'Closed/approved incidents are read-only.' : 'Approve severity review'} onClick={onApprove}>Approve</button>
        <button className={buttonSecondary} disabled={saving || !permissions?.canRejectReview || permissions?.readOnly} title={!permissions?.canRejectReview ? 'Missing incidents.severity.review.reject permission' : permissions?.readOnly ? 'Closed/approved incidents are read-only.' : 'Reject severity review'} onClick={onReject}>Reject</button>
      </div>
    </TabPanel>
  );
}
