import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { programId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'programs', id: params.programId }} />; }
