import { RegulatoryAuditMappingFormPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingFormPage';
export default function Page({ params }: { params: { obligationId: string } }) { return <RegulatoryAuditMappingFormPage initialValues={{ regulatorySourceType: 'Regulatory Obligation', obligationId: params.obligationId }} />; }
