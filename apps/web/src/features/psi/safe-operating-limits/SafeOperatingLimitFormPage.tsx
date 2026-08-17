'use client';

import { useRouter } from 'next/navigation';
import { useSafeOperatingLimitDetail } from '../hooks/useSafeOperatingLimitDetail';
import { useSafeOperatingLimitMutations } from '../hooks/useSafeOperatingLimitMutations';
import { useSafeOperatingLimitLookups } from '../hooks/useSafeOperatingLimits';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { SafeOperatingLimitForm } from './SafeOperatingLimitForm';

export function SafeOperatingLimitFormPage({ limitId, unitId }: { limitId?: string | undefined; unitId?: string | undefined }) {
  const router = useRouter();
  const lookups = useSafeOperatingLimitLookups();
  const detail = useSafeOperatingLimitDetail(limitId ?? '');
  const mutations = useSafeOperatingLimitMutations(limitId, unitId);
  const editing = Boolean(limitId);
  if (lookups.isLoading || (editing && detail.isLoading)) return <PsiLoadingState rows={8} />;
  if (lookups.isError) return <PsiErrorState message={lookups.error.message} onRetry={() => void lookups.refetch()} />;
  if (editing && detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  const initial = editing ? { ...detail.data?.limit, ...(detail.data?.values ?? {}), consequences: detail.data?.consequences, operatorResponses: detail.data?.operatorResponses, controls: detail.data?.controls, documents: detail.data?.documents } : undefined;
  const onSubmit = (input: Record<string, unknown>) => {
    const mutation = editing ? mutations.update : mutations.create;
    mutation.mutate(input, { onSuccess: (result: any) => router.push(`/process-safety-information/safe-operating-limits/${result.limit?.id ?? result.id}`) });
  };
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Safe Operating Limits</p>
        <h1 className="mt-1 text-2xl font-bold">{editing ? 'Edit Safe Operating Limit' : 'Create Safe Operating Limit'}</h1>
        <p className="mt-2 text-sm text-[var(--psm-muted)]">Complete each section so the backend can validate completeness, conflicts, review readiness, MOC impact, and PSSR blockers.</p>
      </div>
      <SafeOperatingLimitForm initial={initial} lookups={lookups.data} forcedUnitId={unitId} onSubmit={onSubmit} isSaving={mutations.create.isPending || mutations.update.isPending} />
    </div>
  );
}
