import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { equipmentId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'equipment', id: params.equipmentId }} />; }
