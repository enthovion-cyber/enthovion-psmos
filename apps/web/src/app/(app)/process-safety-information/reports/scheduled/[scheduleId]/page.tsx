import { PsiScheduledReportFormPage } from '@/features/psi/reports/PsiScheduledReportFormPage';
export default function Page({ params }: { params: { scheduleId: string } }) { return <PsiScheduledReportFormPage scheduleId={params.scheduleId} />; }
