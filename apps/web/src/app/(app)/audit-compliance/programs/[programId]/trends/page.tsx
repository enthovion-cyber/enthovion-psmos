import { AuditSourceTrendPage } from '@/features/audit/history/AuditSourceTrendPage';
export default function Page({ params }: { params: { programId: string } }) { return <AuditSourceTrendPage title="Program Trend Analysis" resource="programs" id={params.programId} />; }
