import { AuditExecutionStartFromPlanPage } from "@/features/audit/execution/AuditExecutionStartFromPlanPage";

export default function Page({ params }: { params: { planId: string } }) {
  return <AuditExecutionStartFromPlanPage planId={params.planId} />;
}
