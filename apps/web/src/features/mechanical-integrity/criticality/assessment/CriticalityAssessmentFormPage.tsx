'use client';

import { useRouter } from 'next/navigation';
import { useCriticalityMutations } from '../../hooks/useCriticalityMutations';
import { useEquipmentCriticality } from '../../hooks/useEquipmentCriticality';
import { CriticalityAssessmentForm } from './CriticalityAssessmentForm';

export function CriticalityAssessmentFormPage({ equipmentId }: { equipmentId?: string }) {
  const router = useRouter();
  const equipment = useEquipmentCriticality(equipmentId ?? '');
  const mutations = useCriticalityMutations(undefined, equipmentId);
  const save = (form: Record<string, any>) => {
    const mutation = equipmentId ? mutations.createForEquipment : mutations.create;
    mutation.mutate(form as any, { onSuccess: (detail: any) => router.push(`/mechanical-integrity/criticality/assessments/${detail.assessment.id}`) });
  };
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5"><h1 className="text-xl font-semibold">New Criticality Assessment</h1><p className="text-sm text-muted-foreground">The backend creates score dimensions from the active company/site criticality configuration.</p></div>
      <CriticalityAssessmentForm equipmentId={equipmentId} snapshot={equipment.data?.snapshot ?? null} saving={mutations.create.isPending || mutations.createForEquipment.isPending} onSave={save} />
    </div>
  );
}
