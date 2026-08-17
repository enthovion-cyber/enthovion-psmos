import { AuditScoreRunFormPage } from "@/features/audit/scoring/AuditScoreRunFormPage";
export default function Page({ params }: { params: { programId: string } }) { return <AuditScoreRunFormPage sourceType="program" sourceId={params.programId} />; }
