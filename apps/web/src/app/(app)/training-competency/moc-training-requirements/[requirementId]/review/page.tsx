import { TrainingSourceReviewPage } from '@/features/training/review/TrainingSourceReviewPage';
export default function Page({ params }: { params: { requirementId: string } }) { return <TrainingSourceReviewPage sourceModule="MOC Training" sourceRecordType="MOC training requirement" sourceRecordId={params.requirementId} />; }
