import { AuditScoreRunFormPage } from "@/features/audit/scoring/AuditScoreRunFormPage";
export default function Page({ params }: { params: { checklistId: string } }) { return <AuditScoreRunFormPage sourceType="checklist" sourceId={params.checklistId} />; }
