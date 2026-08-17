import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { findingId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'findings', id: params.findingId }} />; }
