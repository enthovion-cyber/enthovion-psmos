import { RegulatoryComplianceAssessmentRegisterPage } from '@/features/regulatory/compliance/RegulatoryComplianceAssessmentRegisterPage';

export default function Page({ params }: { params: { areaId: string } }) {
  return <RegulatoryComplianceAssessmentRegisterPage initialFilters={{ areaId: params.areaId }} />;
}
