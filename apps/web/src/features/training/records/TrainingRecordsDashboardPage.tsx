'use client';

import Link from 'next/link';
import { useTrainingRecordsDashboard } from '../hooks/useTrainingRecordsDashboard';
import { TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState, TrainingProgress } from '../shared/TrainingUi';
import { TrainingRecordsFilters } from './TrainingRecordsFilters';
import { TrainingRecordsHeader } from './TrainingRecordsHeader';
import { TrainingRecordsSummaryCards } from './TrainingRecordsSummaryCards';
import { TrainingSessionTable } from './sessions/TrainingSessionTable';
import { CompletionRecordTable } from './completions/CompletionRecordTable';

export function TrainingRecordsDashboardPage({ params = {} }: { params?: Record<string, unknown> }) {
  const query = useTrainingRecordsDashboard(params);
  if (query.isLoading) return <TrainingLoadingState />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  if (!data) return <TrainingEmptyState title="No Training Records data" message="The backend did not return Phase 5 dashboard data for this scope." />;
  return (
    <div className="space-y-5">
      <TrainingRecordsHeader title={data.header?.title} subtitle={data.header?.subtitle} />
      <TrainingRecordsSummaryCards summary={data.summary} />
      <TrainingRecordsFilters lookups={data.settings?.lookups} />
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartList title="Attendance by site" rows={data.attendanceBySite ?? []} />
        <ChartList title="Attendance by unit" rows={data.attendanceByUnit ?? []} />
        <ChartList title="Completion by training category" rows={data.completionByCategory ?? []} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Preview title="Pending verification preview" rows={data.pendingVerificationPreview ?? []} href="/training-competency/training-records/pending-verification" />
        <Preview title="Missing evidence preview" rows={data.missingEvidencePreview ?? []} href="/training-competency/training-records/records?evidenceStatus=Missing" />
        <Preview title="Failed / incomplete preview" rows={data.failedIncompletePreview ?? []} href="/training-competency/training-records/failed-incomplete" />
        <Preview title="Recent manual corrections" rows={data.recentManualCorrections ?? []} href="/training-competency/training-records/manual-corrections" />
      </div>
      <TrainingCard title="Sessions requiring attendance entry"><TrainingSessionTable rows={data.sessionsRequiringAttendance ?? []} /></TrainingCard>
      <TrainingCard title="Recent completion records"><CompletionRecordTable rows={data.records?.rows ?? []} /></TrainingCard>
    </div>
  );
}

function ChartList({ title, rows = [] }: { title: string; rows?: Array<{ label: string; count: number }> }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <TrainingCard title={title}>
      {!rows.length ? <TrainingEmptyState title="No data yet" message="The backend returned no rows for this breakdown." /> : <div className="space-y-3">{rows.map((row) => <div key={row.label}><div className="mb-1 flex justify-between text-sm"><span>{row.label}</span><b>{row.count}</b></div><TrainingProgress value={total ? (row.count / total) * 100 : 0} /></div>)}</div>}
    </TrainingCard>
  );
}

function Preview({ title, rows = [], href }: { title: string; rows?: Array<Record<string, any>>; href: string }) {
  return (
    <TrainingCard title={title} action={<Link className="text-sm font-semibold text-primary" href={href}>View all</Link>}>
      {!rows.length ? <TrainingEmptyState title="Nothing pending" message="No backend records matched this preview in the current scope." /> : <div className="divide-y divide-[var(--psm-line)]">{rows.map((row) => <div key={row.id} className="py-3 text-sm"><p className="font-semibold">{row.training_title ?? row.session_title ?? row.event_title ?? row.id}</p><p className="text-[var(--psm-muted)]">{row.completion_status ?? row.attendance_status ?? row.verification_status ?? row.created_at}</p></div>)}</div>}
    </TrainingCard>
  );
}
