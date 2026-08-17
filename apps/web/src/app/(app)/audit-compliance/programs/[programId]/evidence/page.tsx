import { AuditEvidenceSourcePage } from "@/features/audit/evidence/AuditEvidenceSourcePage";

export default function Page({ params }: { params: { programId: string } }) { return <AuditEvidenceSourcePage sourcePath={`programs/${params.programId}`} title="Audit Program Evidence" />; }
