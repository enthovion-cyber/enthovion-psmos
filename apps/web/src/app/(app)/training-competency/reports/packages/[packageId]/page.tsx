import { TrainingReportPackageDetailPage } from '@/features/training/reports/packages/TrainingReportPackageDetailPage';
export default function Page({ params }: { params: { packageId: string } }) { return <TrainingReportPackageDetailPage packageId={params.packageId} />; }
