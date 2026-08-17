import { TrainingSourceEvidencePackagePage } from '@/features/training/reports/source/TrainingSourceEvidencePackagePage';
export default function Page({ params }: { params: { workerId: string } }) { return <TrainingSourceEvidencePackagePage source="worker" id={params.workerId} />; }
