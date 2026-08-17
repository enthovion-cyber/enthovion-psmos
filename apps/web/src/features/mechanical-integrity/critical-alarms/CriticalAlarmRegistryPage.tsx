'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCriticalAlarms } from '../hooks/useCriticalAlarms';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { SafeguardFilters } from '../safeguards/SafeguardFilters';
import { PrimaryButton, SafeguardMobileCards, SafeguardRegisterTable } from '../safeguards/SafeguardUiPrimitives';

export function CriticalAlarmRegistryPage({ equipmentId }: { equipmentId?: string }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useCriticalAlarms(filters, equipmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Critical alarm register could not be loaded.</div>;
  const open = (row: any) => router.push(`/mechanical-integrity/critical-alarms/${row.id}`);
  return <div className="space-y-5"><header className="flex flex-col gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Safeguards</p><h1 className="text-2xl font-bold">Critical Alarms</h1><p className="text-sm text-[var(--psm-muted)]">Critical alarm priority, response requirements, proof-test schedule, bypass foundation, and readiness.</p></div><PrimaryButton onClick={() => router.push('/mechanical-integrity/critical-alarms/new')}>Create Critical Alarm</PrimaryButton></header><SafeguardFilters value={filters} onChange={setFilters} /><div className="hidden lg:block"><SafeguardRegisterTable rows={query.data.rows} kind="Critical alarm" onOpen={open} /></div><SafeguardMobileCards rows={query.data.rows} onOpen={open} /></div>;
}
