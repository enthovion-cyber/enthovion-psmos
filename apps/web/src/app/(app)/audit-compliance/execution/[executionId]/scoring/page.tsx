import { AuditScoreRunFormPage } from "@/features/audit/scoring/AuditScoreRunFormPage";
export default function Page({ params }: { params: { executionId: string } }) { return <AuditScoreRunFormPage sourceType="execution" sourceId={params.executionId} />; }
