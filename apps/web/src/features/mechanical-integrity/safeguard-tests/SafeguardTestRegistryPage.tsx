'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeguardTests } from '../hooks/useSafeguardTests';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { SafeguardFilters } from '../safeguards/SafeguardFilters';
import { PrimaryButton, SafeguardMobileCards, SafeguardRegisterTable } from '../safeguards/SafeguardUiPrimitives';

export function SafeguardTestRegistryPage({ equipmentId }: { equipmentId?: string }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useSafeguardTests(filters, equipmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Safeguard test register could not be loaded.</div>;
  const open = (row: any) => router.push(`/mechanical-integrity/safeguard-tests/${row.id}`);
  return <div className="space-y-5"><header className="flex flex-col gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Unified Safeguard Testing</p><h1 className="text-2xl font-bold">Safeguard Tests</h1><p className="text-sm text-[var(--psm-muted)]">Proof tests, functional tests, interlock tests, critical alarm tests, evaluations, review, approval, and history.</p></div><PrimaryButton onClick={() => router.push('/mechanical-integrity/safeguard-tests/new')}>Create Test</PrimaryButton></header><SafeguardFilters value={filters} onChange={setFilters} /><div className="hidden lg:block"><SafeguardRegisterTable rows={query.data.rows} kind="Safeguard test" onOpen={open} /></div><SafeguardMobileCards rows={query.data.rows} onOpen={open} /></div>;
}
