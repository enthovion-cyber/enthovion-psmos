'use client';

import { useRouter } from 'next/navigation';
import { useInspectionPlanDetail } from '../hooks/useInspectionPlanDetail';
import { useInspectionPlanMutations } from '../hooks/useInspectionPlanMutations';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { InspectionPlanForm } from './InspectionPlanForm';

export function InspectionPlanFormPage({ equipmentId, planId }: { equipmentId?: string; planId?: string }) {
  const router = useRouter();
  const detail = useInspectionPlanDetail(planId);
  const mutations = useInspectionPlanMutations(planId, equipmentId);
  if (planId && detail.isLoading) return <MiLoadingSkeleton rows={8} />;
  const initial = detail.data ? {
    equipmentId: detail.data.plan.equipmentId ?? detail.data.plan.equipment_id,
    planTitle: detail.data.plan.planTitle ?? detail.data.plan.plan_title ?? '',
    planDescription: detail.data.plan.plan_description ?? '',
    planType: detail.data.plan.planType ?? detail.data.plan.plan_type ?? '',
    inspectionMethod: detail.data.plan.inspectionMethod ?? detail.data.plan.inspection_method ?? '',
    priority: detail.data.plan.priority ?? 'Normal',
    scope: detail.data.scope ?? {},
    cmlScope: detail.data.cmlScope ?? {},
    schedule: detail.data.schedule ?? {},
    checklistItems: detail.data.checklist ?? [],
    acceptanceCriteria: detail.data.acceptanceCriteria ?? [],
    documents: detail.data.documents ?? []
  } : equipmentId ? { equipmentId } : undefined;
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-[var(--psm-text)]">{planId ? 'Edit Inspection Plan' : 'Create Inspection Plan'}</h1><p className="text-sm text-[var(--psm-muted)]">Backend-generated schedule preview, validation, approval, and revision controls are applied after save.</p></div>
      <InspectionPlanForm initial={initial as any} evaluation={detail.data?.latestEvaluation ?? null} saving={mutations.create.isPending || mutations.update.isPending} onSubmit={(value) => {
        const action = planId ? mutations.update.mutateAsync(value as any) : mutations.create.mutateAsync(value as any);
        action.then((result) => router.push(`/mechanical-integrity/inspection-plans/${result.plan.id}`));
      }} />
    </div>
  );
}
