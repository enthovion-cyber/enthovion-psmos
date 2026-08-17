'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useSafeguardDashboard, useSafeguardSchedulerRun } from '../hooks/useSafeguardDashboard';
import { SafeguardBypassPanel } from './SafeguardBypassPanel';
import { SafeguardDuePanel } from './SafeguardDuePanel';
import { SafeguardFailedPanel } from './SafeguardFailedPanel';
import { SafeguardFilters } from './SafeguardFilters';
import { SafeguardHeader } from './SafeguardHeader';
import { SafeguardHealthPanel } from './SafeguardHealthPanel';
import { SafeguardMobileCards, SafeguardRegisterTable } from './SafeguardUiPrimitives';
import { SafeguardSavedViews } from './SafeguardSavedViews';
import { SafeguardSummaryCards } from './SafeguardSummaryCards';

export function SafeguardDashboardPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useSafeguardDashboard(filters);
  const scheduler = useSafeguardSchedulerRun();
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">SIS / SIF / safeguard dashboard could not be loaded.</div>;
  const data = query.data as any;
  const open = (row: any) => {
    if (row.sif_id || row.sifTag || row.sif_tag) router.push(`/mechanical-integrity/sis/sifs/${row.sif_id ?? row.id}`);
    else if (row.interlock_id || row.interlockTag || row.interlock_tag) router.push(`/mechanical-integrity/interlocks/${row.interlock_id ?? row.id}`);
    else if (row.alarm_id || row.alarmTag || row.alarm_tag) router.push(`/mechanical-integrity/critical-alarms/${row.alarm_id ?? row.id}`);
    else router.push(`/mechanical-integrity/safeguard-tests/${row.test_id ?? row.id}`);
  };
  return (
    <div className="space-y-5">
      <SafeguardHeader lastUpdated={data.header?.lastUpdated} onRunScheduler={() => scheduler.mutate()} schedulerRunning={scheduler.isPending} />
      <SafeguardSummaryCards summary={data.summary} />
      <SafeguardSavedViews />
      <SafeguardFilters value={filters} onChange={setFilters} />
      <SafeguardHealthPanel health={data.health} />
      <section className="grid gap-5 2xl:grid-cols-2">
        <SafeguardDuePanel rows={data.due} onOpen={open} />
        <SafeguardFailedPanel rows={data.failed} onOpen={open} />
      </section>
      <SafeguardBypassPanel rows={data.bypassed} onOpen={open} />
      <div className="hidden lg:block"><SafeguardRegisterTable rows={data.rows} kind="Safeguard" onOpen={open} /></div>
      <SafeguardMobileCards rows={data.rows} onOpen={open} />
    </div>
  );
}
