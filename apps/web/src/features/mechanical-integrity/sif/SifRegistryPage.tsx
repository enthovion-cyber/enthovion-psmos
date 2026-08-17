'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useSifs } from '../hooks/useSifs';
import { SafeguardFilters } from '../safeguards/SafeguardFilters';
import { PrimaryButton, SafeguardMobileCards, SafeguardRegisterTable } from '../safeguards/SafeguardUiPrimitives';

export function SifRegistryPage({ equipmentId }: { equipmentId?: string }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useSifs(filters, equipmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">SIF register could not be loaded.</div>;
  const rows = query.data.rows ?? [];
  const open = (row: any) => router.push(`/mechanical-integrity/sis/sifs/${row.id}`);
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">SIS / SIF Register</p>
          <h1 className="text-2xl font-bold">Safety Instrumented Functions</h1>
          <p className="text-sm text-[var(--psm-muted)]">Identification, protected scenario, SIL basis, architecture, devices, proof testing, bypass readiness, and LOPA/SIL links.</p>
        </div>
        <PrimaryButton onClick={() => router.push(equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/sis-sif-interlocks/new` : '/mechanical-integrity/sis/sifs/new')}>Create SIF</PrimaryButton>
      </header>
      <SafeguardFilters value={filters} onChange={setFilters} />
      <div className="hidden lg:block"><SafeguardRegisterTable rows={rows} kind="SIF" onOpen={open} /></div>
      <SafeguardMobileCards rows={rows} onOpen={open} />
    </div>
  );
}
