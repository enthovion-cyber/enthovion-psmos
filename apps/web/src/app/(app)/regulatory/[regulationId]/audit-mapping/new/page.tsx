import { RegulatoryAuditMappingFormPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingFormPage';
export default function Page({ params }: { params: { regulationId: string } }) { return <RegulatoryAuditMappingFormPage initialValues={{ regulatorySourceType: 'Regulatory Item', regulatoryItemId: params.regulationId }} />; }
