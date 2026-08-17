import { TrainingPssrReadinessFormPage } from '@/features/training/pssr/TrainingPssrReadinessFormPage';
export default function Page({ params }: { params: { readinessId: string } }) { return <TrainingPssrReadinessFormPage readinessId={params.readinessId} />; }
