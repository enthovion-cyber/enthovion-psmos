import { AuditSourceTrendPage } from '@/features/audit/history/AuditSourceTrendPage';
export default function Page({ params }: { params: { siteId: string } }) { return <AuditSourceTrendPage title="Site Trend Analysis" resource="sites" id={params.siteId} />; }
