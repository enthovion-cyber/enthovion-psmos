import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { capaId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'capa', id: params.capaId }} />; }
