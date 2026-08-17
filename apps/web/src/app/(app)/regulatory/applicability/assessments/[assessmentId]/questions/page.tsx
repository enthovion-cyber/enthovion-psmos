import { RegulatoryApplicabilityAssessmentDetailPage } from '@/features/regulatory/applicability/RegulatoryApplicabilityAssessmentDetailPage';
export default function Page({ params }: { params: { assessmentId: string } }) { return <RegulatoryApplicabilityAssessmentDetailPage assessmentId={params.assessmentId} section="questions" />; }
