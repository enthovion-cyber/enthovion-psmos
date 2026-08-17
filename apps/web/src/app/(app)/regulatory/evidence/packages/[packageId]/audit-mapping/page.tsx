import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { packageId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'evidencePackage', id: params.packageId }} />; }
