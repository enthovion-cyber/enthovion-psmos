import { AuditEvidenceSourcePage } from "@/features/audit/evidence/AuditEvidenceSourcePage";

export default function Page({ params }: { params: { executionId: string; responseId: string } }) { return <AuditEvidenceSourcePage sourcePath={`execution/${params.executionId}/responses/${params.responseId}`} title="Checklist Response Evidence" />; }
