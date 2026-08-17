import { TrainingSourceReviewPage } from '@/features/training/review/TrainingSourceReviewPage';
export default function Page({ params }: { params: { profileId: string } }) { return <TrainingSourceReviewPage sourceModule="Roles & Competency" sourceRecordType="Competency profile" sourceRecordId={params.profileId} />; }
