import { TrainingSourceEvidencePackagePage } from '@/features/training/reports/source/TrainingSourceEvidencePackagePage';
export default function Page({ params }: { params: { permitId: string } }) { return <TrainingSourceEvidencePackagePage source="ptw" id={params.permitId} />; }
