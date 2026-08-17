import { AuditEvidenceSourcePage } from "@/features/audit/evidence/AuditEvidenceSourcePage";

export default function Page({ params }: { params: { areaId: string } }) { return <AuditEvidenceSourcePage sourcePath={`areas/${params.areaId}`} title="Area Evidence" />; }
