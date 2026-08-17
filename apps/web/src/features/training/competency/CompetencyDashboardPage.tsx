'use client';

import { useCompetencyDashboard } from '../hooks/useCompetencyDashboard';
import { TrainingCard, TrainingErrorState, TrainingLoadingState, TrainingProgress } from '../shared/TrainingUi';
import { CompetencyHeader } from './CompetencyHeader';
import { CompetencySummaryCards } from './CompetencySummaryCards';
import { CompetencyGapTable } from './CompetencyGapTable';
import { ProfileTable } from './ProfileTable';

export function CompetencyDashboardPage() {
  const query = useCompetencyDashboard();
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error.message} onRetry={() => query.refetch()} />;
  const data = query.data ?? {};
  return <div className="space-y-6"><CompetencyHeader title="Roles & Competency Profiles Dashboard" /><CompetencySummaryCards summary={data.summary ?? {}} /><div className="grid gap-4 xl:grid-cols-3"><Breakdown title="Competency status by site" rows={data.bySite ?? []} /><Breakdown title="Competency status by unit" rows={data.byUnit ?? []} /><Breakdown title="Competency status by job role" rows={data.byRole ?? []} /></div><div className="grid gap-4 xl:grid-cols-2"><TrainingCard title="Safety-critical competency gaps preview" subtitle="Backend-generated missing evidence, blocker, and verification gaps."><CompetencyGapTable rows={data.safetyCriticalGapsPreview ?? []} compact /></TrainingCard><TrainingCard title="Profiles pending approval" subtitle="Safety-critical profiles can require approval and lock on approval."><ProfileTable rows={data.profilesPendingApproval ?? []} compact /></TrainingCard></div><TrainingCard title="Recent profile changes and evaluations"><div className="grid gap-3 md:grid-cols-2">{[...(data.recentProfileChanges ?? []), ...(data.recentCompetencyEvaluations ?? [])].slice(0, 10).map((row: Record<string, any>) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><p className="font-semibold">{row.event_title ?? row.triggered_by_type ?? row.status}</p><p className="text-xs text-[var(--psm-muted)]">{row.created_at ?? row.started_at}</p></div>)}</div></TrainingCard></div>;
}

function Breakdown({ title, rows }: { title: string; rows: Record<string, any>[] }) {
  return <TrainingCard title={title}>{rows.length ? <div className="space-y-3">{rows.slice(0, 8).map((row) => <div key={row.label}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{row.label}</span><span>{row.completionPercent ?? 0}%</span></div><TrainingProgress value={row.completionPercent ?? 0} /><p className="mt-1 text-xs text-[var(--psm-muted)]">{row.total ?? 0} evaluated / {row.missingEvidence ?? 0} missing evidence / {row.blockers ?? 0} blockers</p></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No backend competency evaluation data yet.</p>}</TrainingCard>;
}
