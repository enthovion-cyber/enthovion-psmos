import { TrainingSourceEvidencePackagePage } from '@/features/training/reports/source/TrainingSourceEvidencePackagePage';
export default function Page({ params }: { params: { pssrId: string } }) { return <TrainingSourceEvidencePackagePage source="pssr" id={params.pssrId} />; }
