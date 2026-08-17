import { AuditEvidenceSourcePage } from "@/features/audit/evidence/AuditEvidenceSourcePage";

export default function Page({ params }: { params: { capaId: string } }) { return <AuditEvidenceSourcePage sourcePath={`capa/${params.capaId}`} title="CAPA Evidence" />; }
