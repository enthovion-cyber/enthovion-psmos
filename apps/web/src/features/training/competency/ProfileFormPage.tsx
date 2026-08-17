'use client';

import { useRouter } from 'next/navigation';
import { useCompetencyProfileDetail } from '../hooks/useCompetencyProfileDetail';
import { useCompetencyProfileMutations } from '../hooks/useCompetencyProfileMutations';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { CompetencyHeader } from './CompetencyHeader';
import { ProfileForm } from './ProfileForm';

export function ProfileFormPage({ profileId }: { profileId?: string }) {
  const router = useRouter();
  const detail = useCompetencyProfileDetail(profileId ?? '');
  const mutations = useCompetencyProfileMutations(profileId);
  if (profileId && detail.isLoading) return <TrainingLoadingState rows={5} />;
  if (profileId && detail.isError) return <TrainingErrorState message={detail.error.message} onRetry={() => detail.refetch()} />;
  const save = profileId ? mutations.update : mutations.create;
  const formProps = { initial: detail.data?.profile ?? {}, isSaving: save.isPending, onSubmit: (value: Record<string, any>) => save.mutate(value, { onSuccess: (data: any) => router.push(`/training-competency/roles-competency-profiles/profiles/${data.profile?.id ?? data.id ?? profileId}`) }) };
  return <div className="space-y-5"><CompetencyHeader title={profileId ? 'Edit Competency Profile' : 'Create Competency Profile'} subtitle="Step-based profile builder: identity, scope, duties, requirements, evidence, blocking impact, review and save." /><ProfileForm {...formProps} {...(save.error?.message ? { error: save.error.message } : {})} /></div>;
}
