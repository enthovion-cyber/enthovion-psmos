import { AuditClauseFormPage } from "@/features/audit/standards/AuditClauseFormPage";
export default function Page({ params }: { params: { clauseId: string } }) { return <AuditClauseFormPage clauseId={params.clauseId} />; }
