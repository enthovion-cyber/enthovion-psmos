import { AuditScoreRegisterPage } from "@/features/audit/scoring/AuditScoreRegisterPage";
export default function Page({ params }: { params: { evidenceId: string } }) { return <AuditScoreRegisterPage preset={{ evidenceId: params.evidenceId }} />; }
