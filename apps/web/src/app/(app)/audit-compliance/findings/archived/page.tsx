import { AuditFindingScopedRegisterPage } from "@/features/audit/findings/AuditFindingScopedRegisterPage";
export default function Page() { return <AuditFindingScopedRegisterPage preset={{ includeArchived: true, status: "Archived" }} />; }
