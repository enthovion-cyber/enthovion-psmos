import { AuditScoreRunDetailPage } from "@/features/audit/scoring/AuditScoreRunDetailPage";
export default function Page({ params }: { params: { runId: string } }) { return <AuditScoreRunDetailPage runId={params.runId} activeTab="traceability" />; }
