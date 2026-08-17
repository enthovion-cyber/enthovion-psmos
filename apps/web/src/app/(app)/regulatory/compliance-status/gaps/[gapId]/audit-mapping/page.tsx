import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { gapId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'gap', id: params.gapId }} />; }
