import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { assessmentId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'assessment', id: params.assessmentId }} />; }
