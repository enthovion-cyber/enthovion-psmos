import { AuditCapaCreateFromFindingPage } from "@/features/audit/capa/AuditCapaCreateFromFindingPage";

export default function Page({ params }: { params: { findingId: string } }) {
  return <AuditCapaCreateFromFindingPage findingId={params.findingId} />;
}
