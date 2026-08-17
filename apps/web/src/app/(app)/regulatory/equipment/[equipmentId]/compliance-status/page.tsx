import { RegulatoryComplianceAssessmentRegisterPage } from '@/features/regulatory/compliance/RegulatoryComplianceAssessmentRegisterPage';

export default function Page({ params }: { params: { equipmentId: string } }) {
  return <RegulatoryComplianceAssessmentRegisterPage initialFilters={{ equipmentId: params.equipmentId }} />;
}
