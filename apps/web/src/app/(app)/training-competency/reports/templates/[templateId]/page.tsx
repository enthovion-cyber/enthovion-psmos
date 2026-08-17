import { ReportTemplateDetailPage } from '@/features/training/reports/templates/ReportTemplateDetailPage';
export default function Page({ params }: { params: { templateId: string } }) { return <ReportTemplateDetailPage templateId={params.templateId} />; }
