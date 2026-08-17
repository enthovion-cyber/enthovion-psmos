import { AuditFindingScopedRegisterPage } from "@/features/audit/findings/AuditFindingScopedRegisterPage";
export default function Page({ params }: { params: { unitId: string } }) { return <AuditFindingScopedRegisterPage preset={{ unitId: params.unitId }} />; }
