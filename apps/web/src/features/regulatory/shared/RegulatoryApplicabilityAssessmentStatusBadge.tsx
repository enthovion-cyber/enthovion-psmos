import { RegulatoryBadge } from './RegulatoryUi';
export function RegulatoryApplicabilityAssessmentStatusBadge({ status }: { status?: string | null }) { return <RegulatoryBadge tone={status === 'Completed Foundation' ? 'good' : status === 'Archived' ? 'danger' : status === 'Under Review' ? 'warn' : 'info'}>{status ?? 'Draft'}</RegulatoryBadge>; }
