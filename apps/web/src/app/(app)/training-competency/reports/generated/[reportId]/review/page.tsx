import { TrainingSourceReviewPage } from '@/features/training/review/TrainingSourceReviewPage';
export default function Page({ params }: { params: { reportId: string } }) { return <TrainingSourceReviewPage sourceModule="Reports / Export" sourceRecordType="Restricted report export" sourceRecordId={params.reportId} />; }
