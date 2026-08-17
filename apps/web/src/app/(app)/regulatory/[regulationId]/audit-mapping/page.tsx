import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { regulationId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'item', id: params.regulationId }} />; }
