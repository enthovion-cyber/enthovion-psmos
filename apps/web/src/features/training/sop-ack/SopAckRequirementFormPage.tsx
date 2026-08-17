'use client';

import { useRouter } from 'next/navigation';
import { useSopAckRequirementDetail } from '../hooks/useSopAckRequirementDetail';
import { useSopAckRequirementMutations } from '../hooks/useSopAckRequirementMutations';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { SopAckHeader } from './SopAckHeader';
import { SopAckRequirementForm } from './SopAckRequirementForm';

export function SopAckRequirementFormPage({ requirementId }: { requirementId?: string }) {
  const router = useRouter();
  const detail = useSopAckRequirementDetail(requirementId ?? '');
  const mutations = useSopAckRequirementMutations(requirementId);
  if (requirementId && detail.isLoading) return <TrainingLoadingState rows={6} />;
  if (requirementId && detail.isError) return <TrainingErrorState message={detail.error} onRetry={() => detail.refetch()} />;
  const saving = mutations.create.isPending || mutations.update.isPending;
  return (
    <div className="space-y-5">
      <SopAckHeader title={requirementId ? 'Edit SOP Acknowledgement Requirement' : 'New SOP Acknowledgement Requirement'} subtitle="Build controlled SOP acknowledgement requirements against current approved procedure versions." actions={false} />
      <SopAckRequirementForm initial={detail.data ?? null} saving={saving} onSubmit={(values) => {
        if (requirementId) mutations.update.mutate(values, { onSuccess: () => router.push(`/training-competency/sop-acknowledgements/requirements/${requirementId}`) });
        else mutations.create.mutate(values, { onSuccess: (created: any) => router.push(`/training-competency/sop-acknowledgements/requirements/${created?.requirement?.id ?? ''}`) });
      }} />
    </div>
  );
}
