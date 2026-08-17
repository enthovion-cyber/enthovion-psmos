import { AuditSourceTrendPage } from '@/features/audit/history/AuditSourceTrendPage';
export default function Page({ params }: { params: { areaId: string } }) { return <AuditSourceTrendPage title="Area Trend Analysis" resource="areas" id={params.areaId} />; }
