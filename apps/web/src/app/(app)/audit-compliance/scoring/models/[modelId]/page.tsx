import { AuditScoringModelDetailPage } from "@/features/audit/scoring/AuditScoringModelDetailPage";
export default function Page({ params }: { params: { modelId: string } }) { return <AuditScoringModelDetailPage modelId={params.modelId} />; }
