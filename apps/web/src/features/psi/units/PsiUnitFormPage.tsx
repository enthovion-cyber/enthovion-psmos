'use client';

import { useRouter } from 'next/navigation';
import { usePsiUnitDetail } from '../hooks/usePsiUnitDetail';
import { usePsiUnitMutations } from '../hooks/usePsiUnitMutations';
import { usePsiUnitLookups } from '../hooks/usePsiUnits';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiUnitForm } from './PsiUnitForm';

export function PsiUnitFormPage({ unitId }: { unitId?: string }) {
  const router = useRouter();
  const detail = usePsiUnitDetail(unitId);
  const lookups = usePsiUnitLookups();
  const mutations = usePsiUnitMutations(unitId);
  const loading = Boolean(unitId) && detail.isLoading;
  if (loading || lookups.isLoading) return <PsiLoadingState rows={7} />;
  if (detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  const initial = detail.data?.unit ?? {};
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{unitId ? 'Edit Process Unit' : 'Create Process Unit'}</h1>
        <p className="text-sm text-[var(--psm-muted)]">Structured PSI profile foundation with backend completeness, links, review, and history.</p>
      </div>
      <PsiUnitForm
        initial={initial}
        lookups={lookups.data ?? undefined}
        equipment={detail.data?.equipment ?? []}
        isSaving={mutations.create.isPending || mutations.update.isPending}
        onSubmit={(value) => {
          const mutation = unitId ? mutations.update : mutations.create;
          mutation.mutate(value, { onSuccess: (data: any) => router.push(`/process-safety-information/units/${data.unit?.id ?? data.id ?? unitId}`) });
        }}
      />
    </div>
  );
}
