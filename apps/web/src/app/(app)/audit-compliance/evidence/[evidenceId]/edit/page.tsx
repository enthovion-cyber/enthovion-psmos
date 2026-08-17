import { AuditEvidenceFormPage } from "@/features/audit/evidence/AuditEvidenceFormPage";

export default function Page({ params }: { params: { evidenceId: string } }) { return <AuditEvidenceFormPage evidenceId={params.evidenceId} />; }
