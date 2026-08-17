'use client';

import { useRouter } from 'next/navigation';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useCalibrationDashboard } from '../hooks/useCalibrationPlans';
import { CalibrationPlanTable } from './CalibrationPlanTable';
import { CalibrationSummaryCards } from './CalibrationSummaryCards';

export function CalibrationDashboardPage() {
  const router = useRouter();
  const query = useCalibrationDashboard();
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Calibration dashboard could not be loaded.</div>;
  const data = query.data as any;
  return <div className="space-y-5"><header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><h1 className="text-2xl font-bold">Calibration / Testing</h1><p className="text-sm text-[var(--psm-muted)]">Calibration due status, out-of-tolerance results, certificate readiness, and testing records.</p></header><CalibrationSummaryCards summary={data.summary as Record<string, unknown>} /><section className="grid gap-5 xl:grid-cols-2"><div><h2 className="mb-3 font-semibold">Due / Overdue Calibrations</h2><CalibrationPlanTable rows={(data.due ?? []) as any[]} onOpen={(row) => router.push(`/mechanical-integrity/calibration/plans/${row.id}`)} /></div><div><h2 className="mb-3 font-semibold">Active Calibration Plans</h2><CalibrationPlanTable rows={(data.plans ?? []) as any[]} onOpen={(row) => router.push(`/mechanical-integrity/calibration/plans/${row.id}`)} /></div></section></div>;
}

