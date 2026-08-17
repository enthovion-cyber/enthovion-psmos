import { RegulatoryComplianceAssessmentDetailPage } from '@/features/regulatory/compliance/RegulatoryComplianceAssessmentDetailPage';
export default function Page({ params }: { params: { assessmentId: string } }) { return <RegulatoryComplianceAssessmentDetailPage assessmentId={params.assessmentId} />; }
