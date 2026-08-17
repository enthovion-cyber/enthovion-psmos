import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { evidenceLinkId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'evidenceLink', id: params.evidenceLinkId }} />; }
