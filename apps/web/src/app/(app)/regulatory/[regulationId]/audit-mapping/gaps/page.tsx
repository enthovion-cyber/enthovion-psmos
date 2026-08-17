import { RegulatoryAuditMappingGapPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingGapPage';
export default function Page({ params }: { params: { regulationId: string } }) { return <RegulatoryAuditMappingGapPage filters={{ regulatoryItemId: params.regulationId }} />; }
