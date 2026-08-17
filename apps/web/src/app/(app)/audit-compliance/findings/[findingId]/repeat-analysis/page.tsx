import { AuditSourceRepeatAnalysisPage } from '@/features/audit/history/AuditSourceTrendPage';
export default function Page({ params }: { params: { findingId: string } }) { return <AuditSourceRepeatAnalysisPage findingId={params.findingId} />; }
