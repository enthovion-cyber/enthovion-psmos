'use client';

import { useRouter } from 'next/navigation';
import { useMatrixRule } from '../hooks/useMatrixRules';
import { useMatrixRuleMutations } from '../hooks/useMatrixRuleMutations';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { MatrixRuleForm } from './MatrixRuleForm';
import { TrainingMatrixHeader } from './TrainingMatrixHeader';

export function MatrixRuleFormPage({ ruleId }: { ruleId?: string }) {
  const router = useRouter();
  const detail = useMatrixRule(ruleId ?? '');
  const mutations = useMatrixRuleMutations(ruleId);
  const mutation = ruleId ? mutations.update : mutations.create;
  if (ruleId && detail.isLoading) return <TrainingLoadingState rows={5} />;
  if (ruleId && detail.isError) return <TrainingErrorState message={detail.error.message} onRetry={() => detail.refetch()} />;
  return <div className="space-y-5"><TrainingMatrixHeader title={ruleId ? 'Edit Matrix Rule' : 'Create Matrix Rule'} subtitle="Guided rule fields from the Training Matrix Development Plan." />{mutation.isError ? <TrainingErrorState message={mutation.error.message} /> : null}<MatrixRuleForm initial={detail.data?.rule ?? {}} isSaving={mutation.isPending} onSubmit={(value) => mutation.mutate(value, { onSuccess: (data: any) => router.push(`/training-competency/training-matrix/rules/${data.rule?.id ?? ruleId ?? ''}`) })} /></div>;
}
