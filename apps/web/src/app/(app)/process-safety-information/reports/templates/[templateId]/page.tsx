import { PsiReportTemplateFormPage } from '@/features/psi/reports/PsiReportTemplateFormPage';
export default function Page({ params }: { params: { templateId: string } }) { return <PsiReportTemplateFormPage templateId={params.templateId} />; }
