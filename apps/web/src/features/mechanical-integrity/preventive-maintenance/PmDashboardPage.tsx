'use client';

import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { usePmDashboard } from '../hooks/usePmPlans';
import { PmPlanTable } from './PmPlanTable';
import { PmSummaryCards } from './PmSummaryCards';

export function PmDashboardPage() {
  const router = useRouter();
  const query = usePmDashboard();
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Preventive maintenance dashboard could not be loaded.</div>;
  const data = query.data as any;
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <h1 className="text-2xl font-bold">Preventive Maintenance</h1>
        <p className="text-sm text-[var(--psm-muted)]">PM readiness, due tasks, overdue work, execution records, findings, and schedule health.</p>
      </header>
      <PmSummaryCards summary={data.summary as Record<string, unknown>} />
      <section className="grid gap-5 xl:grid-cols-2">
        <div><h2 className="mb-3 font-semibold">Due / Overdue PM</h2><PmPlanTable rows={(data.due ?? []) as any[]} onOpen={(row) => router.push(`/mechanical-integrity/preventive-maintenance/plans/${row.id}`)} /></div>
        <div><h2 className="mb-3 font-semibold">Active Plans</h2><PmPlanTable rows={(data.plans ?? []) as any[]} onOpen={(row) => router.push(`/mechanical-integrity/preventive-maintenance/plans/${row.id}`)} /></div>
      </section>
    </div>
  );
}

