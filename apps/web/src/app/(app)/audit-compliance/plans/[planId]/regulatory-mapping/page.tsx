import { RegulatoryAuditMappingRegisterPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingRegisterPage';
export default function Page({ params }: { params: { planId: string } }) { return <RegulatoryAuditMappingRegisterPage source={{ kind: 'plans', id: params.planId }} />; }
