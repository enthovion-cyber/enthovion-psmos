import { TrainingSourceReviewPage } from '@/features/training/review/TrainingSourceReviewPage';
export default function Page({ params }: { params: { readinessId: string } }) { return <TrainingSourceReviewPage sourceModule="PSSR Training" sourceRecordType="PSSR training readiness record" sourceRecordId={params.readinessId} />; }
