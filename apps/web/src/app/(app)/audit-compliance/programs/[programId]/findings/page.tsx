import { AuditFindingScopedRegisterPage } from "@/features/audit/findings/AuditFindingScopedRegisterPage";
export default function Page({ params }: { params: { programId: string } }) { return <AuditFindingScopedRegisterPage preset={{ programId: params.programId }} />; }
