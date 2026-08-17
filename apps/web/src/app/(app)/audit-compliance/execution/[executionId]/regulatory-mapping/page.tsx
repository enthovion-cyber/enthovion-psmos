import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { executionId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'execution', id: params.executionId }} />; }
