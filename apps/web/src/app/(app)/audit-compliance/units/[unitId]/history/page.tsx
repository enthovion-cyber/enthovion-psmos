import { AuditSourceHistoryPage } from '@/features/audit/history/AuditSourceTrendPage';
export default function Page({ params }: { params: { unitId: string } }) { return <AuditSourceHistoryPage title="Unit Audit History" resource="units" id={params.unitId} />; }
