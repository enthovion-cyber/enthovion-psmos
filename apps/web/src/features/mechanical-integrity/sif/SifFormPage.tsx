'use client';

import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useSifDetail, useSifMutations } from '../hooks/useSifs';
import { SifForm } from './SifForm';

export function SifFormPage({ sifId, equipmentId }: { sifId?: string; equipmentId?: string }) {
  const router = useRouter();
  const detail = useSifDetail(sifId);
  const mutations = useSifMutations();
  if (sifId && detail.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (sifId && (detail.isError || !detail.data)) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">SIF could not be loaded for editing.</div>;
  const record = (detail.data as any)?.sif ?? (detail.data as any)?.record;
  return (
    <SifForm
      mode={sifId ? 'edit' : 'create'}
      initial={record}
      saving={mutations.create.isPending || mutations.update.isPending}
      onCancel={() => router.back()}
      onSubmit={async (input) => {
        const result = sifId ? await mutations.update.mutateAsync({ sifId, input }) : await mutations.create.mutateAsync(equipmentId ? { input, equipmentId } : { input });
        const row = (result as any).sif ?? (result as any).record;
        router.push(`/mechanical-integrity/sis/sifs/${row?.id ?? sifId}`);
      }}
    />
  );
}
