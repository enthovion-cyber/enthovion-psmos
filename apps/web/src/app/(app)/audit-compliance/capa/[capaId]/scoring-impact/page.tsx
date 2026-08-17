import { AuditScoreRegisterPage } from "@/features/audit/scoring/AuditScoreRegisterPage";
export default function Page({ params }: { params: { capaId: string } }) { return <AuditScoreRegisterPage preset={{ capaId: params.capaId }} />; }
