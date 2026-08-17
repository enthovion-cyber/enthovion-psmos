'use client';

import { useRouter } from 'next/navigation';
import { usePsiChemicalDetail } from '../hooks/usePsiChemicalDetail';
import { usePsiChemicalLookups } from '../hooks/usePsiChemicals';
import { usePsiChemicalMutations } from '../hooks/usePsiChemicalMutations';
import { PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiChemicalForm } from './PsiChemicalForm';

export function PsiChemicalFormPage({ chemicalId, unitId }: { chemicalId?: string | undefined; unitId?: string | undefined }) {
  const router = useRouter();
  const detail = usePsiChemicalDetail(chemicalId ?? '');
  const lookups = usePsiChemicalLookups();
  const mutations = usePsiChemicalMutations(chemicalId);
  const isEdit = Boolean(chemicalId);
  if (isEdit && detail.isLoading) return <PsiLoadingState rows={8} />;
  if (isEdit && detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  const initial = detail.data ? {
    ...detail.data.chemical,
    ...(detail.data.hazards ?? {}),
    ...(detail.data.exposureHealth ?? {}),
    ...(detail.data.storageCompatibility ?? {}),
    ...(detail.data.emergencyControls ?? {}),
    ...(detail.data.sdsLinks?.[0] ?? {})
  } : undefined;
  const save = (input: Record<string, any>) => {
    const mutation = isEdit ? mutations.update : mutations.create;
    mutation.mutate({ ...input, unit_id: unitId ?? input.unit_id }, {
      onSuccess: (result: any) => router.push(`/process-safety-information/chemicals/${result.chemical?.id ?? result.id}`)
    });
  };
  const pending = mutations.create.isPending || mutations.update.isPending;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-primary">Chemicals & SDS</p>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Chemical' : 'Create Chemical'}</h1>
        <p className="mt-2 text-sm text-[var(--psm-muted)]">Complete the unit-specific chemical, SDS, hazard, exposure, compatibility, PPE, and emergency response record.</p>
      </div>
      {lookups.isLoading ? <PsiLoadingState rows={3} /> : <PsiChemicalForm initial={initial} lookups={lookups.data} forcedUnitId={unitId} onSubmit={save} isSaving={pending} />}
    </div>
  );
}
