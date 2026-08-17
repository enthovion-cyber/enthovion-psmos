'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useCalibrationMutations } from '../hooks/useCalibrationMutations';
import { useCalibrationPlans } from '../hooks/useCalibrationPlans';
import { CalibrationPlanFilters } from './CalibrationPlanFilters';
import { CalibrationPlanTable } from './CalibrationPlanTable';
import { CalibrationSummaryCards } from './CalibrationSummaryCards';

export function CalibrationPlanRegistryPage({ equipmentId }: { equipmentId?: string }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useCalibrationPlans(filters, equipmentId);
  const mutations = useCalibrationMutations(undefined, undefined, equipmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Calibration plans could not be loaded.</div>;
  const base = equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/calibration` : '/mechanical-integrity/calibration/plans';
  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 md:flex-row md:items-center">
        <div><h1 className="text-xl font-bold">Calibration Plans</h1><p className="text-sm text-[var(--psm-muted)]">Instrument calibration/testing plans, official tolerances, certificates, and due status.</p></div>
        <div className="flex flex-wrap gap-2"><button className="rounded-lg bg-info px-3 py-2 text-sm font-semibold text-white" onClick={() => router.push(`${base}/new`)}>New Calibration Plan</button><button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" onClick={() => mutations.runScheduler.mutate()} disabled={mutations.runScheduler.isPending}>Run Scheduler</button><button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" onClick={() => window.open('/api/v1/mechanical-integrity/calibration/export', '_blank')}>Export</button></div>
      </header>
      <CalibrationSummaryCards summary={query.data.summary} />
      <CalibrationPlanFilters filters={filters} onChange={setFilters} />
      <CalibrationPlanTable rows={query.data.rows} onOpen={(row) => router.push(`/mechanical-integrity/calibration/plans/${row.id}`)} onEdit={(row) => router.push(`/mechanical-integrity/calibration/plans/${row.id}/edit`)} />
    </div>
  );
}

