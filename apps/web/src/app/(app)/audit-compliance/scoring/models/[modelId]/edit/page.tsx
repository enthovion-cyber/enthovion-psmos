import { AuditScoringModelFormPage } from "@/features/audit/scoring/AuditScoringModelFormPage";
export default function Page({ params }: { params: { modelId: string } }) { return <AuditScoringModelFormPage modelId={params.modelId} />; }
