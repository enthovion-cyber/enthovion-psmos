import { AuditSourceHistoryPage } from '@/features/audit/history/AuditSourceTrendPage';
export default function Page({ params }: { params: { areaId: string } }) { return <AuditSourceHistoryPage title="Area Audit History" resource="areas" id={params.areaId} />; }
