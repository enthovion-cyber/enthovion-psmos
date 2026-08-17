import { AuditEvidenceSourcePage } from "@/features/audit/evidence/AuditEvidenceSourcePage";

export default function Page({ params }: { params: { siteId: string } }) { return <AuditEvidenceSourcePage sourcePath={`sites/${params.siteId}`} title="Site Evidence" />; }
