import { AuditTrendRunDetailPage } from '@/features/audit/history/AuditTrendRunDetailPage';
export default function Page({ params }: { params: { trendRunId: string } }) { return <AuditTrendRunDetailPage trendRunId={params.trendRunId} activeTab="source-records" />; }
