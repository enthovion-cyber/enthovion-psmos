import { KeyValueList, ReviewCard } from './ReviewApprovalPrimitives';
import type { MiApprovalDetailResponse } from '../types/review-approval.types';

export function SourceRecordSummaryCard({ detail }: { detail: MiApprovalDetailResponse }) {
  const source = detail.source ?? {};
  return (
    <ReviewCard title="Source Record Summary" description="Safe source snapshot from the originating MI module.">
      {'restricted' in source ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Source record is restricted or unavailable for this user.</div>
      ) : (
        <KeyValueList items={[
          ['Source module', detail.approval.source_module],
          ['Source record', detail.approval.source_record_number ?? detail.approval.source_record_id],
          ['Equipment', detail.approval.equipment_id],
          ['Approval type', detail.approval.approval_type],
          ['Site', detail.approval.site_id],
          ['Submitted by', detail.approval.submitted_by],
          ['Submitted at', detail.approval.submitted_at],
          ['Due at', detail.approval.due_at],
          ['Source status', (source as Record<string, unknown>).status],
          ['Record number', (source as Record<string, unknown>).record_number]
        ]} />
      )}
    </ReviewCard>
  );
}
