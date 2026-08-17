import { AuditEvidenceSourcePage } from "@/features/audit/evidence/AuditEvidenceSourcePage";

export default function Page({ params }: { params: { capaId: string; actionId: string } }) { return <AuditEvidenceSourcePage sourcePath={`capa/${params.capaId}/actions/${params.actionId}`} title="CAPA Action Evidence" />; }
