import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { mappingId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'standards-mapping', id: params.mappingId }} />; }
