import { TrainingSourceReviewPage } from '@/features/training/review/TrainingSourceReviewPage';
export default function Page({ params }: { params: { recordId: string } }) { return <TrainingSourceReviewPage sourceModule="Training Records" sourceRecordType="Safety-critical completion record" sourceRecordId={params.recordId} />; }
