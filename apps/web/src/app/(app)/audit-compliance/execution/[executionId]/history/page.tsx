import { AuditExecutionDetailPage } from "@/features/audit/execution/AuditExecutionDetailPage";

export default function Page({ params }: { params: { executionId: string } }) {
  return <AuditExecutionDetailPage id={params.executionId} />;
}
