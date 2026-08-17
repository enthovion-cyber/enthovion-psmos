import { TrainingWorkerReportsPage } from '@/features/training/reports/TrainingReportViewPage';
export default function Page({ params }: { params: { workerId: string } }) { return <TrainingWorkerReportsPage workerId={params.workerId} />; }
