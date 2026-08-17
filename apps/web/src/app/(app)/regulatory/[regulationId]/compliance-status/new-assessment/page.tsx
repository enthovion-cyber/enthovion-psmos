import { RegulatoryComplianceAssessmentFormPage } from '@/features/regulatory/compliance/RegulatoryComplianceAssessmentFormPage';

export default function Page({ params }: { params: { regulationId: string } }) {
  return <RegulatoryComplianceAssessmentFormPage initial={{ sourceType: 'Regulatory Item', sourceRecordId: params.regulationId, regulatoryItemId: params.regulationId }} />;
}
