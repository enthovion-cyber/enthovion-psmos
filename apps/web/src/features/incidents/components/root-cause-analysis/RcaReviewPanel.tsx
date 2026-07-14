import { ReviewStatusBadge } from '../shared/ReviewStatusBadge';
import { RcaActionButton, RcaPanel, RcaRows } from './RcaPrimitives';

export function RcaReviewPanel({ review, onApprove, onReject, onRequest, onComplete, onReopen }: any) {
  return <RcaPanel title="RCA Review Panel"><div className="mb-3"><ReviewStatusBadge value={review?.status ?? 'Not Requested'} /></div><RcaRows rows={[['Reviewer', review?.reviewer_id], ['Due date', review?.due_date], ['Approved by', review?.approved_by], ['Approved at', review?.approved_at], ['Rejected by', review?.rejected_by], ['Rejected at', review?.rejected_at], ['Rework required', review?.rework_required ? 'Yes' : 'No'], ['Comments', review?.comments ?? review?.rejection_reason]]} /><div className="mt-3 flex flex-wrap gap-2"><RcaActionButton label="Request Review" onClick={onRequest} /><RcaActionButton label="Approve" onClick={onApprove} /><RcaActionButton label="Reject" danger onClick={onReject} /><RcaActionButton label="Complete RCA" onClick={onComplete} /><RcaActionButton label="Reopen RCA" onClick={onReopen} /></div></RcaPanel>;
}
