import { RegulatoryCard } from '../shared/RegulatoryUi';
import { RegulatoryApplicabilityStaleBadge } from '../shared/RegulatoryApplicabilityStaleBadge';
export function RegulatoryApplicabilityStaleWarningPanel({ stale, reason }: { stale?: boolean; reason?: string | null }) { if (!stale) return null; return <RegulatoryCard title="Source-Changed Warning" subtitle={reason ?? 'Applicability has been marked stale by backend.'}><RegulatoryApplicabilityStaleBadge stale={true} /></RegulatoryCard>; }
