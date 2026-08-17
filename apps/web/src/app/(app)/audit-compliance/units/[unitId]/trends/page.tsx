import { AuditSourceTrendPage } from '@/features/audit/history/AuditSourceTrendPage';
export default function Page({ params }: { params: { unitId: string } }) { return <AuditSourceTrendPage title="Unit Trend Analysis" resource="units" id={params.unitId} />; }
