import { AuditFindingFormPage } from "@/features/audit/findings/AuditFindingFormPage";
export default function Page({ params }: { params: { findingId: string } }) { return <AuditFindingFormPage findingId={params.findingId} />; }
