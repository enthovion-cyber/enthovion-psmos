'use client';

import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useSafeguardTestDetail, useSafeguardTestMutations } from '../hooks/useSafeguardTests';
import { SafeguardTestForm } from './SafeguardTestForm';

export function SafeguardTestFormPage({ testId }: { testId?: string }) {
  const router = useRouter();
  const detail = useSafeguardTestDetail(testId);
  const mutations = useSafeguardTestMutations();
  if (testId && detail.isLoading) return <MiLoadingSkeleton rows={6} />;
  const record = (detail.data as any)?.test ?? (detail.data as any)?.record;
  return <SafeguardTestForm mode={testId ? 'edit' : 'create'} initial={record} saving={mutations.create.isPending || mutations.update.isPending} onCancel={() => router.back()} onSubmit={async (input) => { const result = testId ? await mutations.update.mutateAsync({ testId, input }) : await mutations.create.mutateAsync(input); const row = (result as any).test ?? (result as any).record; router.push(`/mechanical-integrity/safeguard-tests/${row?.id ?? testId}`); }} />;
}
