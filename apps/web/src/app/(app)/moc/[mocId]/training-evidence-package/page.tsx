import { TrainingSourceEvidencePackagePage } from '@/features/training/reports/source/TrainingSourceEvidencePackagePage';
export default function Page({ params }: { params: { mocId: string } }) { return <TrainingSourceEvidencePackagePage source="moc" id={params.mocId} />; }
