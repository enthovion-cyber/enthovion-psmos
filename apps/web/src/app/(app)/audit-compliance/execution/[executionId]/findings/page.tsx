import { AuditFindingScopedRegisterPage } from "@/features/audit/findings/AuditFindingScopedRegisterPage";
export default function Page({ params }: { params: { executionId: string } }) { return <AuditFindingScopedRegisterPage preset={{ executionId: params.executionId }} />; }
