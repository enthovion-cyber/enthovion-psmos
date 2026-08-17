import { AuditFindingDetailPage } from "@/features/audit/findings/AuditFindingDetailPage";
export default function Page({ params }: { params: { findingId: string } }) { return <AuditFindingDetailPage findingId={params.findingId} />; }
