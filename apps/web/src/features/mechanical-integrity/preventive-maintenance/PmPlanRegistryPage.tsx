'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { usePmMutations } from '../hooks/usePmMutations';
import { usePmPlans } from '../hooks/usePmPlans';
import { PmPlanFilters } from './PmPlanFilters';
import { PmPlanTable } from './PmPlanTable';
import { PmSummaryCards } from './PmSummaryCards';

export function PmPlanRegistryPage({ equipmentId }: { equipmentId?: string }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = usePmPlans(filters, equipmentId);
  const mutations = usePmMutations(undefined, undefined, equipmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Preventive maintenance plans could not be loaded.</div>;
  const base = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/preventive-maintenance` : '/mechanical-integrity/preventive-maintenance/plans';
  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 md:flex-row md:items-center">
        <div><h1 className="text-xl font-bold">Preventive Maintenance Plans</h1><p className="text-sm text-[var(--psm-muted)]">Approved PM plans, schedule status, due work, and controlled revisions.</p></div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg bg-info px-3 py-2 text-sm font-semibold text-white" onClick={() => router.push(`${base}/new`)}>New PM Plan</button>
          <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" onClick={() => mutations.runScheduler.mutate()} disabled={mutations.runScheduler.isPending} title={mutations.runScheduler.isPending ? 'Scheduler is running' : 'Generate or refresh due occurrences'}>Run Scheduler</button>
          <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" onClick={() => window.open('/api/v1/mechanical-integrity/preventive-maintenance/export', '_blank')}>Export</button>
        </div>
      </header>
      <PmSummaryCards summary={query.data.summary} />
      <PmPlanFilters filters={filters} onChange={setFilters} />
      <PmPlanTable rows={query.data.rows} onOpen={(row) => router.push(`/mechanical-integrity/preventive-maintenance/plans/${row.id}`)} onEdit={(row) => router.push(`/mechanical-integrity/preventive-maintenance/plans/${row.id}/edit`)} />
    </div>
  );
}

