import { RegulatoryComplianceAssessmentRegisterPage } from '@/features/regulatory/compliance/RegulatoryComplianceAssessmentRegisterPage';

export default function Page({ params }: { params: { siteId: string } }) {
  return <RegulatoryComplianceAssessmentRegisterPage initialFilters={{ siteId: params.siteId }} />;
}
