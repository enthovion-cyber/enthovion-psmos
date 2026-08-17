import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { areaId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'areas', id: params.areaId }} />; }
