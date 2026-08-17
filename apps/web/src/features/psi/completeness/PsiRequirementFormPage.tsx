'use client';

import { useRouter } from 'next/navigation';
import { usePsiRequirement, usePsiRequirementMutations } from '../hooks/usePsiRequirements';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiRequirementForm } from './PsiRequirementForm';

export function PsiRequirementFormPage({ requirementId }: { requirementId?: string }) {
  const router = useRouter();
  const mutations = usePsiRequirementMutations();
  const requirement = usePsiRequirement(requirementId);
  if (requirementId && requirement.isLoading) return <PsiLoadingState rows={3} />;
  if (requirementId && requirement.isError) return <PsiErrorState message="The completeness requirement could not be loaded." onRetry={() => requirement.refetch()} />;
  const saving = requirementId ? mutations.updateRequirement.isPending : mutations.createRequirement.isPending;
  const onSubmit = (values: Record<string, unknown>) => {
    if (requirementId) {
      mutations.updateRequirement.mutate({ requirementId, input: values }, { onSuccess: () => router.push('/process-safety-information/completeness/requirements') });
      return;
    }
    mutations.createRequirement.mutate(values, { onSuccess: () => router.push('/process-safety-information/completeness/requirements') });
  };
  return <PsiRequirementForm initial={requirement.data} saving={saving} onSubmit={onSubmit} />;
}
