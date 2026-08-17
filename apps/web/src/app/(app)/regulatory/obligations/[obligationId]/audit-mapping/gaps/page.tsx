import { RegulatoryAuditMappingGapPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingGapPage';
export default function Page({ params }: { params: { obligationId: string } }) { return <RegulatoryAuditMappingGapPage filters={{ obligationId: params.obligationId }} />; }
