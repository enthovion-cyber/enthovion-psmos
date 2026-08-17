import { TrainingScopedReportsPage } from '@/features/training/reports/TrainingReportViewPage';
export default function Page({ params }: { params: { siteId: string } }) { return <TrainingScopedReportsPage scope="sites" id={params.siteId} />; }
