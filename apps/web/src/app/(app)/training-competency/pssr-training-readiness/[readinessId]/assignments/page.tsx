import { TrainingPssrReadinessDetailPage } from '@/features/training/pssr/TrainingPssrReadinessDetailPage';
export default function Page({ params }: { params: { readinessId: string } }) { return <TrainingPssrReadinessDetailPage readinessId={params.readinessId} />; }
