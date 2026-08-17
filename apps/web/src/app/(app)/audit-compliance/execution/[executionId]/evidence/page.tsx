import { AuditEvidenceSourcePage } from "@/features/audit/evidence/AuditEvidenceSourcePage";

export default function Page({ params }: { params: { executionId: string } }) { return <AuditEvidenceSourcePage sourcePath={`execution/${params.executionId}`} title="Audit Execution Evidence" />; }
