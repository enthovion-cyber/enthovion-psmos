import { AuditFindingScopedRegisterPage } from "@/features/audit/findings/AuditFindingScopedRegisterPage";
export default function Page({ params }: { params: { siteId: string } }) { return <AuditFindingScopedRegisterPage preset={{ siteId: params.siteId }} />; }
