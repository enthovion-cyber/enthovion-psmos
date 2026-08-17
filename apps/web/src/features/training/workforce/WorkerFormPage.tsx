'use client';

import { useWorkerDetail } from '../hooks/useWorkerDetail';
import { useWorkerMutations } from '../hooks/useWorkerMutations';
import { TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';
import { WorkerForm } from './WorkerForm';

function mutationMessage(error: unknown) {
  const response = error as { response?: { data?: { message?: string | string[]; error?: string } }; message?: string };
  const message = response.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message ?? response.response?.data?.error ?? response.message ?? 'Unable to save worker profile.';
}

export function WorkerFormPage({ workerId }: { workerId?: string }) {
  const detail = useWorkerDetail(workerId ?? '');
  const mutations = useWorkerMutations(workerId);
  if (workerId && detail.isLoading) return <TrainingLoadingState rows={5} />;
  if (workerId && detail.isError) return <TrainingErrorState message={detail.error.message} onRetry={() => detail.refetch()} />;
  const mutation = workerId ? mutations.update : mutations.create;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-primary">Worker Profile Foundation</p>
        <h1 className="mt-2 text-3xl font-bold">{workerId ? 'Edit Worker' : 'Create Worker'}</h1>
        <p className="mt-2 text-sm text-[var(--psm-muted)]">Use real workforce, IAM, site/unit/area, and Document Control data. No auth user is created unless account linking/invitation is chosen.</p>
      </div>
      {mutation.isError ? <TrainingErrorState message={mutationMessage(mutation.error)} /> : null}
      <WorkerForm initial={detail.data?.worker ?? {}} onSubmit={(value) => mutation.mutate(value)} isSaving={mutation.isPending} />
    </div>
  );
}
