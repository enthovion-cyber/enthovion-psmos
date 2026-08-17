import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { runId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'scoring/runs', id: params.runId }} />; }
