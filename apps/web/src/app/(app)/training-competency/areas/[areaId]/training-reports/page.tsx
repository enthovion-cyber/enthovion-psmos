import { TrainingScopedReportsPage } from '@/features/training/reports/TrainingReportViewPage';
export default function Page({ params }: { params: { areaId: string } }) { return <TrainingScopedReportsPage scope="areas" id={params.areaId} />; }
