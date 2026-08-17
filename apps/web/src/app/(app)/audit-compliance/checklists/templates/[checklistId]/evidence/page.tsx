import { AuditEvidenceSourcePage } from "@/features/audit/evidence/AuditEvidenceSourcePage";

export default function Page({ params }: { params: { checklistId: string } }) { return <AuditEvidenceSourcePage sourcePath={`checklists/templates/${params.checklistId}`} title="Checklist Evidence" />; }
