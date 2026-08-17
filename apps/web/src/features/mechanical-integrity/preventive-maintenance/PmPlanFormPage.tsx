'use client';

import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { usePmMutations } from '../hooks/usePmMutations';
import { usePmPlan } from '../hooks/usePmPlans';
import { PmPlanForm } from './PmPlanForm';

export function PmPlanFormPage({ planId, equipmentId }: { planId?: string; equipmentId?: string }) {
  const router = useRouter();
  const query = usePmPlan(planId);
  const mutations = usePmMutations(planId, undefined, equipmentId);
  if (planId && query.isLoading) return <MiLoadingSkeleton rows={6} />;
  const initial = (query.data as any)?.plan ?? (equipmentId ? { equipmentId } : undefined);
  return <PmPlanForm initial={initial} saving={mutations.createPlan.isPending || mutations.updatePlan.isPending} onSubmit={(input) => (planId ? mutations.updatePlan.mutate(input, { onSuccess: () => router.push(`/mechanical-integrity/preventive-maintenance/plans/${planId}`) }) : mutations.createPlan.mutate(input, { onSuccess: (data) => router.push(`/mechanical-integrity/preventive-maintenance/plans/${String((data as any).plan?.id ?? '')}`) }))} />;
}

