import { RegulatoryComplianceAssessmentRegisterPage } from '@/features/regulatory/compliance/RegulatoryComplianceAssessmentRegisterPage';

export default function Page({ params }: { params: { unitId: string } }) {
  return <RegulatoryComplianceAssessmentRegisterPage initialFilters={{ unitId: params.unitId }} />;
}
