'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInterlocks } from '../hooks/useInterlocks';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { SafeguardFilters } from '../safeguards/SafeguardFilters';
import { PrimaryButton, SafeguardMobileCards, SafeguardRegisterTable } from '../safeguards/SafeguardUiPrimitives';

export function InterlockRegistryPage({ equipmentId }: { equipmentId?: string }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useInterlocks(filters, equipmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Interlock register could not be loaded.</div>;
  const open = (row: any) => router.push(`/mechanical-integrity/interlocks/${row.id}`);
  return <div className="space-y-5"><header className="flex flex-col gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Safeguards</p><h1 className="text-2xl font-bold">Interlocks</h1><p className="text-sm text-[var(--psm-muted)]">Interlock identification, cause/effect, proof-test schedule, bypass foundation, equipment link, and readiness.</p></div><PrimaryButton onClick={() => router.push('/mechanical-integrity/interlocks/new')}>Create Interlock</PrimaryButton></header><SafeguardFilters value={filters} onChange={setFilters} /><div className="hidden lg:block"><SafeguardRegisterTable rows={query.data.rows} kind="Interlock" onOpen={open} /></div><SafeguardMobileCards rows={query.data.rows} onOpen={open} /></div>;
}
