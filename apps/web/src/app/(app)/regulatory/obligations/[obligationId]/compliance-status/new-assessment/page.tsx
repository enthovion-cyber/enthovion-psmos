import { RegulatoryComplianceAssessmentFormPage } from '@/features/regulatory/compliance/RegulatoryComplianceAssessmentFormPage';

export default function Page({ params }: { params: { obligationId: string } }) {
  return <RegulatoryComplianceAssessmentFormPage initial={{ sourceType: 'Obligation', sourceRecordId: params.obligationId, obligationId: params.obligationId }} />;
}
