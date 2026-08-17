import { RegulatoryEvidenceRegisterPage } from '@/features/regulatory/evidence/RegulatoryEvidenceRegisterPage';

export default function ComplianceAssessmentEvidencePage({ params }: { params: { assessmentId: string } }) {
  return <RegulatoryEvidenceRegisterPage initialFilters={{ complianceAssessmentId: params.assessmentId }} />;
}
