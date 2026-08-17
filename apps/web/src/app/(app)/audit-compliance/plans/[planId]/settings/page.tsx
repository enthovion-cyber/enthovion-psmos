import { AuditPlanSettingsPage } from '@/features/audit/plans/AuditPlanSettingsPage';

export default function Page({ params }: { params: { planId: string } }) {
  return <AuditPlanSettingsPage planId={params.planId} />;
}
