import { PsiExportJobDetailPage } from '@/features/psi/reports/PsiExportJobDetailPage';
export default function Page({ params }: { params: { exportJobId: string } }) { return <PsiExportJobDetailPage jobId={params.exportJobId} />; }
