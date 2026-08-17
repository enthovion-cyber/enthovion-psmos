'use client';

import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useInterlockDetail, useInterlockMutations } from '../hooks/useInterlocks';
import { SafeguardSimpleForm } from '../safeguards/SafeguardSimpleForm';

export function InterlockFormPage({ interlockId }: { interlockId?: string }) {
  const router = useRouter();
  const detail = useInterlockDetail(interlockId);
  const mutations = useInterlockMutations();
  if (interlockId && detail.isLoading) return <MiLoadingSkeleton rows={6} />;
  const record = (detail.data as any)?.interlock ?? (detail.data as any)?.record;
  return <SafeguardSimpleForm kind="Interlock" mode={interlockId ? 'edit' : 'create'} initial={record} saving={mutations.create.isPending || mutations.update.isPending} onCancel={() => router.back()} onSubmit={async (input) => { const result = interlockId ? await mutations.update.mutateAsync({ interlockId, input }) : await mutations.create.mutateAsync(input); const row = (result as any).interlock ?? (result as any).record; router.push(`/mechanical-integrity/interlocks/${row?.id ?? interlockId}`); }} />;
}
