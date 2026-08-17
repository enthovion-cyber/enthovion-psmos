import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { unitId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'units', id: params.unitId }} />; }
