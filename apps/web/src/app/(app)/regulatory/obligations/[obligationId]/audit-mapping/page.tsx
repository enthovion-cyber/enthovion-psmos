import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { obligationId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'obligation', id: params.obligationId }} />; }
