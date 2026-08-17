import { AuditExecutionWorkspacePage } from "@/features/audit/execution/AuditExecutionWorkspacePage";

export default function Page({ params }: { params: { executionId: string } }) {
  return <AuditExecutionWorkspacePage id={params.executionId} />;
}
