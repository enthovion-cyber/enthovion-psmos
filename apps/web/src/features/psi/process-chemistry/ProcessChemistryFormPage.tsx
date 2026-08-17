'use client';

import { useRouter } from 'next/navigation';
import { useProcessChemistryDetail } from '../hooks/useProcessChemistryDetail';
import { useProcessChemistryLookups } from '../hooks/useProcessChemistry';
import { useProcessChemistryMutations } from '../hooks/useProcessChemistryMutations';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { ProcessChemistryForm } from './ProcessChemistryForm';

export function ProcessChemistryFormPage({ chemistryId, unitId }: { chemistryId?: string | undefined; unitId?: string | undefined }) {
  const router = useRouter();
  const isEdit = Boolean(chemistryId);
  const detail = useProcessChemistryDetail(chemistryId ?? '');
  const lookups = useProcessChemistryLookups();
  const mutations = useProcessChemistryMutations(chemistryId, unitId);
  if (isEdit && detail.isLoading) return <PsiLoadingState rows={8} />;
  if (isEdit && detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  if (lookups.isLoading) return <PsiLoadingState rows={5} />;
  const initial = detail.data ? { ...detail.data.chemistry, ...(detail.data.conditions ?? {}), ...(detail.data.hazards ?? {}), roles: detail.data.roles, scenarios: detail.data.scenarios, controls: detail.data.controls, documents: detail.data.documents } : undefined;
  const save = (input: Record<string, any>) => {
    const mutation = isEdit ? mutations.update : mutations.create;
    mutation.mutate(input, { onSuccess: (result: any) => router.push(`/process-safety-information/process-chemistry/${result.chemistry?.id ?? result.id}`) });
  };
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-primary">PSI Phase 3</p>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Process Chemistry' : 'Create Process Chemistry'}</h1>
        <p className="mt-2 text-sm text-[var(--psm-muted)]">Capture the PDF-required chemistry identity, reaction description, normal conditions, reactive hazards, scenarios, safeguards, document links, and readiness basis.</p>
      </div>
      <ProcessChemistryForm initial={initial} lookups={lookups.data} forcedUnitId={unitId} onSubmit={save} isSaving={mutations.create.isPending || mutations.update.isPending} />
    </div>
  );
}
