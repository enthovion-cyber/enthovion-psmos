import { AuditEvidenceDetailPage } from "@/features/audit/evidence/AuditEvidenceDetailPage";

export default function Page({ params }: { params: { evidenceId: string } }) { return <AuditEvidenceDetailPage evidenceId={params.evidenceId} tab="links" />; }
