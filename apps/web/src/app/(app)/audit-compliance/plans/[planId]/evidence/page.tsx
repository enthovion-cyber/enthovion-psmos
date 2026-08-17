import { AuditEvidenceSourcePage } from "@/features/audit/evidence/AuditEvidenceSourcePage";

export default function Page({ params }: { params: { planId: string } }) { return <AuditEvidenceSourcePage sourcePath={`plans/${params.planId}`} title="Audit Plan Evidence" />; }
