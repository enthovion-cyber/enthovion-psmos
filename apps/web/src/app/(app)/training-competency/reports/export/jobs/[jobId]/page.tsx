import { TrainingExportJobDetailPage } from '@/features/training/reports/jobs/TrainingExportJobDetailPage';
export default function Page({ params }: { params: { jobId: string } }) { return <TrainingExportJobDetailPage jobId={params.jobId} />; }
