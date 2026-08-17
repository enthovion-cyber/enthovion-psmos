import { PsiGeneratedReportDetailPage } from '@/features/psi/reports/PsiGeneratedReportDetailPage';
export default function Page({ params }: { params: { reportId: string } }) { return <PsiGeneratedReportDetailPage reportId={params.reportId} />; }
