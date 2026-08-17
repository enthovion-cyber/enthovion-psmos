'use client';

import { useRouter } from 'next/navigation';
import { DataPanel } from '../equipment-detail/overview/panel-utils';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { useCalibrationMutations } from '../hooks/useCalibrationMutations';
import { useCalibrationPlan } from '../hooks/useCalibrationPlans';

export function CalibrationPlanDetailPage({ planId }: { planId: string }) {
  const router = useRouter();
  const query = useCalibrationPlan(planId);
  const mutations = useCalibrationMutations(planId);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Calibration plan could not be loaded.</div>;
  const data = query.data as any;
  return <div className="space-y-5"><header className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 md:flex-row"><div><h1 className="text-xl font-bold">{data.plan?.planTitle ?? data.plan?.plan_title}</h1><p className="text-sm text-[var(--psm-muted)]">{data.plan?.planNumber ?? data.plan?.plan_number}</p></div><div className="flex flex-wrap gap-2"><button className="rounded border border-[var(--psm-line)] px-3 py-2 text-sm" onClick={() => router.push(`/mechanical-integrity/calibration/plans/${planId}/edit`)}>Edit</button><button className="rounded border border-[var(--psm-line)] px-3 py-2 text-sm" onClick={() => mutations.submitPlan.mutate('Submitted from detail page')}>Submit</button><button className="rounded bg-success px-3 py-2 text-sm font-semibold text-white" onClick={() => mutations.approvePlan.mutate('Approved from detail page')}>Approve</button></div></header><DataPanel title="Calibration Basis" data={data.plan ?? {}} /><DataPanel title="Schedule" data={data.schedule ?? {}} /><DataPanel title="Calibration Points" data={{ points: data.points?.length ?? 0, toleranceMethod: data.plan?.toleranceType ?? data.plan?.tolerance_type }} /></div>;
}

