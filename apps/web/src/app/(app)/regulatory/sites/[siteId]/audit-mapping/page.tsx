import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { siteId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'sites', id: params.siteId }} />; }
