'use client';

import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useCalibrationMutations } from '../hooks/useCalibrationMutations';
import { useCalibrationPlan } from '../hooks/useCalibrationPlans';
import { CalibrationPlanForm } from './CalibrationPlanForm';

export function CalibrationPlanFormPage({ planId, equipmentId }: { planId?: string; equipmentId?: string }) {
  const router = useRouter();
  const query = useCalibrationPlan(planId);
  const mutations = useCalibrationMutations(planId, undefined, equipmentId);
  if (planId && query.isLoading) return <MiLoadingSkeleton rows={6} />;
  const initial = (query.data as any)?.plan ?? (equipmentId ? { equipmentId } : undefined);
  return <CalibrationPlanForm initial={initial} saving={mutations.createPlan.isPending || mutations.updatePlan.isPending} onSubmit={(input) => (planId ? mutations.updatePlan.mutate(input, { onSuccess: () => router.push(`/mechanical-integrity/calibration/plans/${planId}`) }) : mutations.createPlan.mutate(input, { onSuccess: (data) => router.push(`/mechanical-integrity/calibration/plans/${String((data as any).plan?.id ?? '')}`) }))} />;
}

