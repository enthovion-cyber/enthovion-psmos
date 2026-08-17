import { PsiReportPreview } from '@/features/psi/reports/PsiReportPreview';
export default function Page({ params }: { params: { reportId: string } }) { return <PsiReportPreview reportId={params.reportId} />; }
