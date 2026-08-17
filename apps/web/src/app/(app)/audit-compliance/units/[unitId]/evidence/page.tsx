import { AuditEvidenceSourcePage } from "@/features/audit/evidence/AuditEvidenceSourcePage";

export default function Page({ params }: { params: { unitId: string } }) { return <AuditEvidenceSourcePage sourcePath={`units/${params.unitId}`} title="Unit Evidence" />; }
