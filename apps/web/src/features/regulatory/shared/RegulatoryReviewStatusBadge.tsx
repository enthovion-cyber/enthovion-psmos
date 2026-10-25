import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryReviewStatusBadge({ status }: { status?: string | null | undefined }) {
  const tone = ['Review Overdue', 'Rejected Foundation', 'Rejected', 'Validation Failed'].includes(String(status)) ? 'danger' : ['Review Due', 'Under Review', 'Returned Foundation', 'Pending Review', 'In Review', 'Returned For Correction', 'Request Info'].includes(String(status)) ? 'warn' : ['Approved Foundation', 'Approved', 'Approved With Conditions', 'Completed'].includes(String(status)) ? 'good' : 'neutral';
  return <RegulatoryBadge tone={tone}>{status ?? 'Not Required'}</RegulatoryBadge>;
}
