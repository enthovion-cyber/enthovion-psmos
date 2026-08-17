import { AuditFindingConvertFromFieldPage } from "@/features/audit/findings/AuditFindingConvertFromFieldPage";
export default function Page({ params }: { params: { executionId: string; fieldFindingId: string } }) { return <AuditFindingConvertFromFieldPage executionId={params.executionId} fieldFindingId={params.fieldFindingId} />; }
