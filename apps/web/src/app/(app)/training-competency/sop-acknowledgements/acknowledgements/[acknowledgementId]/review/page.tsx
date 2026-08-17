import { TrainingSourceReviewPage } from '@/features/training/review/TrainingSourceReviewPage';
export default function Page({ params }: { params: { acknowledgementId: string } }) { return <TrainingSourceReviewPage sourceModule="SOP Acknowledgements" sourceRecordType="Safety-critical SOP acknowledgement" sourceRecordId={params.acknowledgementId} />; }
