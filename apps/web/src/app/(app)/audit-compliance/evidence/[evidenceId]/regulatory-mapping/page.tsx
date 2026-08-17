import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { evidenceId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'evidence', id: params.evidenceId }} />; }
