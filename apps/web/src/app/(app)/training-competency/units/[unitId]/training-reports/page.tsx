import { TrainingScopedReportsPage } from '@/features/training/reports/TrainingReportViewPage';
export default function Page({ params }: { params: { unitId: string } }) { return <TrainingScopedReportsPage scope="units" id={params.unitId} />; }
