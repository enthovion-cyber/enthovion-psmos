import { RegulatoryAuditTraceabilityPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditTraceabilityPage';
export default function Page({ params }: { params: { obligationId: string } }) { return <RegulatoryAuditTraceabilityPage filters={{ obligationId: params.obligationId }} />; }
