import { AuditPlanChecklistPage } from "@/features/audit/checklists/AuditPlanChecklistPage";

export default function Page({ params }: { params: { planId: string } }) {
  return <AuditPlanChecklistPage planId={params.planId} />;
}
