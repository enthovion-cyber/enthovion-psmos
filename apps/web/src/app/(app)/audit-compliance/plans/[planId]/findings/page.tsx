import { AuditFindingScopedRegisterPage } from "@/features/audit/findings/AuditFindingScopedRegisterPage";
export default function Page({ params }: { params: { planId: string } }) { return <AuditFindingScopedRegisterPage preset={{ planId: params.planId }} />; }
