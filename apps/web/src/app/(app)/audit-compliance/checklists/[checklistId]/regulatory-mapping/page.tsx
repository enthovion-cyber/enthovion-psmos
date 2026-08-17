import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { checklistId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'checklists', id: params.checklistId }} />; }
