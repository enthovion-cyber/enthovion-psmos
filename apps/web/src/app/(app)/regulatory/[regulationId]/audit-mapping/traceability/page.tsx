import { RegulatoryAuditTraceabilityPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditTraceabilityPage';
export default function Page({ params }: { params: { regulationId: string } }) { return <RegulatoryAuditTraceabilityPage filters={{ regulatoryItemId: params.regulationId }} />; }
