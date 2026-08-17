import { AuditScoreRegisterPage } from "@/features/audit/scoring/AuditScoreRegisterPage";
export default function Page({ params }: { params: { findingId: string } }) { return <AuditScoreRegisterPage preset={{ findingId: params.findingId }} />; }
