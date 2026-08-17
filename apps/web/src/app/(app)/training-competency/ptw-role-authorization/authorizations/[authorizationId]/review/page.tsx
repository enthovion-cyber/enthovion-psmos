import { TrainingSourceReviewPage } from '@/features/training/review/TrainingSourceReviewPage';
export default function Page({ params }: { params: { authorizationId: string } }) { return <TrainingSourceReviewPage sourceModule="PTW Authorization" sourceRecordType="PTW authorization record" sourceRecordId={params.authorizationId} />; }
