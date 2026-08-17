'use client';

import { useRouter } from 'next/navigation';
import { useCmlDetail } from '../hooks/useCmlDetail';
import { useCmlMutations } from '../hooks/useCmlMutations';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { CmlCalculationCard } from './CmlCalculationCard';
import { CmlForm } from './CmlForm';
import { CmlReadingHistoryTable } from './CmlReadingHistoryTable';
import { CmlReadingTrendCard } from './CmlReadingTrendCard';

export function CmlDetailPage({ equipmentId, cmlId }: { equipmentId: string; cmlId?: string }) {
  const router = useRouter();
  const isNew = !cmlId || cmlId === 'new';
  const query = useCmlDetail(equipmentId, isNew ? undefined : cmlId);
  const mutations = useCmlMutations(equipmentId, cmlId);
  if (!isNew && query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (!isNew && (query.isError || !query.data)) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">CML/TML could not be loaded.</div>;
  const save = (input: Record<string, unknown>) => {
    if (isNew) mutations.create.mutate(input, { onSuccess: (row) => router.push(`/mechanical-integrity/equipment/${equipmentId}/cmls/${row.id}`) });
    else mutations.update.mutate(input);
  };
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
        <p className="text-xs font-bold uppercase text-[var(--psm-muted)]">CML / TML</p>
        <h2 className="text-2xl font-bold text-[var(--psm-text)]">{isNew ? 'Create CML/TML' : query.data?.cmlNumber ?? query.data?.cml_number}</h2>
      </div>
      <CmlForm value={query.data} saving={mutations.create.isPending || mutations.update.isPending} onSubmit={save} />
      {!isNew ? <CmlCalculationCard calculation={query.data?.calculation} onRecalculate={() => mutations.recalculate.mutate()} recalculating={mutations.recalculate.isPending} /> : null}
      {!isNew ? <CmlReadingTrendCard readings={query.data?.readings ?? []} /> : null}
      {!isNew ? <CmlReadingHistoryTable rows={query.data?.readings ?? []} saving={mutations.addReading.isPending} onAdd={(input) => mutations.addReading.mutate(input)} onApprove={(readingId) => mutations.approveReading.mutate({ readingId })} /> : null}
    </div>
  );
}
