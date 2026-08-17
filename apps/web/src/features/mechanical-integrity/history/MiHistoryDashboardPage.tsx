'use client';

import { useMemo, useState } from 'react';
import { useMiHistory, useMiHistoryTimeline } from '../hooks/useMiHistory';
import { MiHistoryFilters } from './MiHistoryFilters';
import { MiHistoryHeader } from './MiHistoryHeader';
import { MiHistorySummaryCards } from './MiHistorySummaryCards';
import { MiHistoryTable } from './MiHistoryTable';
import { MiHistoryTimeline } from './MiHistoryTimeline';
import { HistoryEventDetailDrawer } from './HistoryEventDetailDrawer';
import type { MiHistoryEvent } from '../types/mi-history.types';

type Props = {
  mode?: 'dashboard' | 'timeline' | 'audit' | 'changes';
  title?: string;
};

export function MiHistoryDashboardPage({ mode = 'dashboard', title }: Props) {
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [module, setModule] = useState('');
  const [selected, setSelected] = useState<MiHistoryEvent | null>(null);
  const params = useMemo(() => ({ search, eventType, module, limit: 50 }), [search, eventType, module]);
  const dashboardQuery = useMiHistory(params);
  const timelineQuery = useMiHistoryTimeline(params);
  const data = dashboardQuery.data;
  const loading = dashboardQuery.isLoading || (mode === 'timeline' && timelineQuery.isLoading);
  const error = dashboardQuery.error || timelineQuery.error;

  if (loading) {
    return <div className="space-y-4 p-4"><Skeleton /><Skeleton /><Skeleton /></div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-200">Unable to load MI history. Check permissions, tenant/site access, and backend availability.</div>;
  }

  return (
    <main className="space-y-5 p-4 lg:p-6">
      <MiHistoryHeader title={title} lastUpdated={data?.lastUpdated} onRefresh={() => { void dashboardQuery.refetch(); void timelineQuery.refetch(); }} />
      <MiHistorySummaryCards summary={data?.summary} />
      <MiHistoryFilters search={search} eventType={eventType} module={module} onSearchChange={setSearch} onEventTypeChange={setEventType} onModuleChange={setModule} />
      {mode === 'timeline' ? <MiHistoryTimeline rows={timelineQuery.data?.rows} groups={timelineQuery.data?.groups} /> : <MiHistoryTable rows={data?.rows} onSelect={setSelected} />}
      {mode === 'dashboard' ? (
        <section className="grid gap-4 xl:grid-cols-3">
          <Snapshot title="Recent critical events" rows={data?.recentCriticalEvents} />
          <Snapshot title="Approval history" rows={data?.approvalHistory} />
          <Snapshot title="Export history" rows={data?.exportHistory} />
        </section>
      ) : null}
      <HistoryEventDetailDrawer event={selected} onClose={() => setSelected(null)} />
    </main>
  );
}

function Snapshot({ title, rows = [] }: { title: string; rows?: MiHistoryEvent[] | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">
        {rows.length ? rows.slice(0, 5).map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm">{row.eventTitle}<div className="text-xs text-[var(--psm-muted)]">{new Date(row.eventAt).toLocaleString()}</div></div>) : <p className="text-sm text-[var(--psm-muted)]">No records in this category.</p>}
      </div>
    </section>
  );
}

function Skeleton() {
  return <div className="h-28 animate-pulse rounded-xl border border-[var(--psm-line)] bg-[var(--psm-muted-bg)]" />;
}
