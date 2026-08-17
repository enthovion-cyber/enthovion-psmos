import { AuditEvidenceSourcePage } from "@/features/audit/evidence/AuditEvidenceSourcePage";

export default function Page({ params }: { params: { findingId: string } }) { return <AuditEvidenceSourcePage sourcePath={`findings/${params.findingId}`} title="Finding Evidence" />; }
