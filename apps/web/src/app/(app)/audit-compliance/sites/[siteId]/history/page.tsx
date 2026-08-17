import { AuditSourceHistoryPage } from '@/features/audit/history/AuditSourceTrendPage';
export default function Page({ params }: { params: { siteId: string } }) { return <AuditSourceHistoryPage title="Site Audit History" resource="sites" id={params.siteId} />; }
