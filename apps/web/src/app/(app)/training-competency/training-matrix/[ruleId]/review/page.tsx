import { TrainingSourceReviewPage } from '@/features/training/review/TrainingSourceReviewPage';
export default function Page({ params }: { params: { ruleId: string } }) { return <TrainingSourceReviewPage sourceModule="Training Matrix" sourceRecordType="Matrix rule" sourceRecordId={params.ruleId} />; }
