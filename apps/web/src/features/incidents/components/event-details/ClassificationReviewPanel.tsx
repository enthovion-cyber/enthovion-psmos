import { Field, buttonSecondary, formatDate, InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';

export function ClassificationReviewPanel({ data, reason, setReason, saving, onApprove, onReject }: any) {
  return (
    <TabPanel title="Classification Review Panel">
      <InfoRows rows={[
        ['Status', data.classificationReview?.status],
        ['Requested at', formatDate(data.classificationReview?.requestedAt)],
        ['Decision', data.classificationReview?.decision ?? '-'],
        ['Decided at', formatDate(data.classificationReview?.decidedAt)],
        ['Reason', data.classificationReview?.reason ?? '-']
      ]} />
      <div className="mt-3"><Field label="Review/action reason" value={reason} onChange={setReason} /></div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={buttonSecondary} disabled={saving || !data.permissions?.canApproveReview || data.permissions?.readOnly} title={!data.permissions?.canApproveReview ? 'Missing incidents.classification.review.approve permission' : data.permissions?.readOnly ? 'Closed/approved incidents are read-only.' : 'Approve classification'} onClick={onApprove}>Approve</button>
        <button className={buttonSecondary} disabled={saving || !data.permissions?.canRejectReview || data.permissions?.readOnly} title={!data.permissions?.canRejectReview ? 'Missing incidents.classification.review.reject permission' : data.permissions?.readOnly ? 'Closed/approved incidents are read-only.' : 'Reject classification'} onClick={onReject}>Reject</button>
      </div>
    </TabPanel>
  );
}
