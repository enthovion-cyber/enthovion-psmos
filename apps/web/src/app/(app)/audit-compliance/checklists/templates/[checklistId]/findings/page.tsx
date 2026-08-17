import { AuditFindingScopedRegisterPage } from "@/features/audit/findings/AuditFindingScopedRegisterPage";
export default function Page({ params }: { params: { checklistId: string } }) { return <AuditFindingScopedRegisterPage preset={{ checklistId: params.checklistId }} />; }
