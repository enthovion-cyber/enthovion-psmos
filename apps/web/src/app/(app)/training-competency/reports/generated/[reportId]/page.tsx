import { GeneratedReportDetailPage } from '@/features/training/reports/generated/GeneratedReportDetailPage';
export default function Page({ params }: { params: { reportId: string } }) { return <GeneratedReportDetailPage reportId={params.reportId} />; }
