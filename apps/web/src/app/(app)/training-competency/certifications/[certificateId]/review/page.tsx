import { TrainingSourceReviewPage } from '@/features/training/review/TrainingSourceReviewPage';
export default function Page({ params }: { params: { certificateId: string } }) { return <TrainingSourceReviewPage sourceModule="Certifications" sourceRecordType="Certificate verification" sourceRecordId={params.certificateId} />; }
