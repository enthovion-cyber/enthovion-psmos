import { TrainingSourceReviewPage } from '@/features/training/review/TrainingSourceReviewPage';
export default function Page({ params }: { params: { trainingId: string } }) { return <TrainingSourceReviewPage sourceModule="Required Training" sourceRecordType="Training library item" sourceRecordId={params.trainingId} />; }
