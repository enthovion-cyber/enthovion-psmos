import { TrainingSourceReviewPage } from '@/features/training/review/TrainingSourceReviewPage';
export default function Page({ params }: { params: { resultId: string } }) { return <TrainingSourceReviewPage sourceModule="Assessments" sourceRecordType="Assessment result verification" sourceRecordId={params.resultId} />; }
