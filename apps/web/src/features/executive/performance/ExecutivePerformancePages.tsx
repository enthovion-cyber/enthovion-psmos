'use client';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';
import type { ExecutiveScopePerformance, ExecutiveScopeType } from '../types/executive-performance.types';
import { ExecutivePerformanceStatusBadge } from '../components/shared/ExecutivePerformanceStatusBadge';
import { ScopeTypeBadge } from '../components/shared/ScopeTypeBadge';
import { HeatmapCellStatusBadge } from '../components/shared/HeatmapCellStatusBadge';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveTrendAreaChart } from '../components/charts';
import { ExecutiveThemeToggle } from '../components/shared/ExecutiveThemeToggle';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

const card = 'rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4';
const button = 'rounded-md bg-[var(--psm-primary)] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60';
function Loading() { return <div className="h-72 animate-pulse rounded-lg bg-[var(--psm-surface-2)]" />; }
function ErrorState({ label }: { label: string }) { return <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-5 text-sm text-[var(--psm-text)]">{label} could not be loaded. Verify your Executive Performance permission and apply the Phase 3 migration.</div>; }
function NoRun({ scope }: { scope: ExecutiveScopePerformance }) { return !scope.aggregation_run_id ? <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-[var(--psm-text)]">{scope.reason ?? 'No completed aggregation is available for this scope.'} Results stay unavailable until a permitted recalculation completes.</div> : null; }
function ScopeCards({ scope }: { scope: ExecutiveScopePerformance }) { return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{[['Performance score',scope.performance_score_foundation != null ? `${scope.performance_score_foundation}/100` : '—'],['Critical alerts',scope.critical_alert_count],['Overdue actions',scope.overdue_action_count],['Pending approvals',scope.pending_approval_count],['Stale records',scope.stale_record_count],['Unavailable modules',scope.unavailable_module_count]].map(([label,value]) => <div key={String(label)} className={card}><p className="text-xs text-[var(--psm-muted)]">{label}</p><p className="mt-2 text-2xl font-bold text-[var(--psm-text)]">{String(value)}</p></div>)}</section>; }
function ScopeTable({ rows, type }: { rows: ExecutiveScopePerformance[]; type: Exclude<ExecutiveScopeType, 'company'> }) { const collection = type === 'equipment' ? 'equipment' : `${type}s`; return <div className={`${card} overflow-x-auto`}><table className="w-full min-w-[800px] text-left text-sm"><thead className="text-[var(--psm-muted)]"><tr><th className="pb-2">Scope</th><th>Score</th><th>Status</th><th>Quality</th><th>Critical</th><th>Overdue</th><th>Pending</th><th>Updated</th></tr></thead><tbody>{rows.map((row) => <tr key={row.scope_record_id ?? row.id} className="border-t border-[var(--psm-line)]"><td className="py-3"><Link className="font-semibold text-[var(--psm-primary)]" href={`/executive/performance/${collection}/${row.scope_record_id}`}><span className="mr-2">{row.scope_label}</span><ScopeTypeBadge type={type} /></Link></td><td>{row.performance_score_foundation ?? '—'}</td><td><ExecutivePerformanceStatusBadge status={row.performance_status} /></td><td>{row.data_quality_status}</td><td>{row.critical_alert_count}</td><td>{row.overdue_action_count}</td><td>{row.pending_approval_count}</td><td>{row.aggregation_run_id ? 'Aggregated' : 'Not aggregated'}</td></tr>)}</tbody></table>{!rows.length ? <p className="py-8 text-sm text-[var(--psm-muted)]">No permitted {type} records are available for this workspace.</p> : null}</div>; }
function ScopeDetailPanels({ scope }: { scope: ExecutiveScopePerformance }) { return <><section className="grid gap-4 lg:grid-cols-2"><div className={card}><h2 className="font-semibold text-[var(--psm-text)]">Module scorecards</h2><div className="mt-3 space-y-2">{scope.moduleScorecards.map((row: any) => <div key={row.id ?? row.module_key} className="flex items-center justify-between gap-3 border-b border-[var(--psm-line)] py-2 last:border-0"><span>{row.module_label ?? row.module_key}</span><span className="flex items-center gap-2"><b>{row.health_score_foundation ?? '—'}</b><ExecutivePerformanceStatusBadge status={row.module_health_status} /></span></div>)}{!scope.moduleScorecards.length ? <p className="text-sm text-[var(--psm-muted)]">No module scorecards were produced for this scope.</p> : null}</div></div><div className={card}><h2 className="font-semibold text-[var(--psm-text)]">Data quality and readiness</h2><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-[var(--psm-muted)]">Status</dt><dd><ExecutivePerformanceStatusBadge status={scope.performance_status} /></dd></div><div><dt className="text-[var(--psm-muted)]">Quality</dt><dd className="font-medium">{scope.data_quality_status}</dd></div><div><dt className="text-[var(--psm-muted)]">Insufficient data</dt><dd>{scope.insufficient_data_count}</dd></div><div><dt className="text-[var(--psm-muted)]">Aggregation run</dt><dd className="truncate">{scope.aggregation_run_id ?? 'Not available'}</dd></div></dl></div></section><section className={card}><h2 className="font-semibold text-[var(--psm-text)]">Permitted source trace</h2><p className="mt-1 text-sm text-[var(--psm-muted)]">Restricted source identity is masked unless the user has elevated trace access.</p><div className="mt-3 max-h-64 overflow-auto text-xs"><pre className="whitespace-pre-wrap">{scope.sourceTrace.length ? JSON.stringify(scope.sourceTrace, null, 2) : 'No permitted source records are available for this scope.'}</pre></div></section></>; }
export function ExecutivePerformanceDashboardPage() {
  const query = useQuery({ queryKey: ['executive','performance','dashboard'], queryFn: () => executiveApi.performanceDashboard() });
  const client = useQueryClient();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const canRecalculate = granted.has('executive.performance.recalculate');
  const recalc = useMutation({
    mutationFn: () => executiveApi.performanceRecalculate(),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['executive','performance'] })
  });

  if (query.isLoading) return <Loading />;
  if (query.isError || !query.data) return <ErrorState label="Performance dashboard" />;
  const data = query.data;

  return (
    <main className="space-y-5">
      <ExecutiveOverviewNavigation permissions={granted} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">Executive KPI · Phase 3</p>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Scope Performance Cockpit</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Company, site, unit, and lower-scope views are calculated from completed, permitted aggregation runs.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExecutiveThemeToggle />
          {canRecalculate ? (
            <button
              type="button"
              className={button}
              disabled={recalc.isPending}
              title="Run a new permission-filtered Executive aggregation."
              onClick={() => recalc.mutate()}
            >
              {recalc.isPending ? 'Recalculating…' : 'Recalculate performance'}
            </button>
          ) : null}
        </div>
      </header>

      {/* Historical Performance Trajectory Area Chart */}
      <ExecutiveTrendAreaChart
        currentScore={data.company.performance_score_foundation}
        currentActions={data.company.overdue_action_count}
        currentIncidents={data.company.critical_alert_count}
      />

      <NoRun scope={data.company} />
      <ScopeCards scope={data.company} />
      <section className="grid gap-4 lg:grid-cols-3">
        <Link href="/executive/performance/sites" className={card}>
          <h2 className="font-semibold">Site performance</h2>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Compare only sites within your assigned scope.</p>
        </Link>
        <Link href="/executive/performance/heatmap" className={card}>
          <h2 className="font-semibold">Module heatmap</h2>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Health status cells from the latest results.</p>
        </Link>
        <Link href="/executive/performance/rankings" className={card}>
          <h2 className="font-semibold">Performance rankings</h2>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Backend-ranked permitted scopes.</p>
        </Link>
      </section>
      <ScopeTable rows={data.sites} type="site" />
    </main>
  );
}
export function ExecutivePerformanceRegisterPage({ type }: { type: Exclude<ExecutiveScopeType, 'company'> }) { const query = useQuery({ queryKey: ['executive','performance',type], queryFn: () => executiveApi.performanceScopes(type) }); if (query.isLoading) return <Loading />; if (query.isError || !query.data) return <ErrorState label={`${type} performance`} />; return <main className="space-y-5"><header><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">Executive performance</p><h1 className="text-2xl font-bold capitalize">{type} performance</h1><p className="mt-1 text-sm text-[var(--psm-muted)]">Only assigned scopes are returned. Missing lower-scope aggregation is shown as unavailable.</p></header><ScopeTable rows={query.data.rows} type={type} /></main>; }
export function ExecutivePerformanceScopePage({ type, id }: { type: Exclude<ExecutiveScopeType, 'company'>; id: string }) { const query = useQuery({ queryKey: ['executive','performance',type,id], queryFn: () => executiveApi.performanceScope(type, id) }); const client = useQueryClient(); const recalc = useMutation({ mutationFn: () => executiveApi.performanceRecalculate({ [`${type}Id`]: id }), onSuccess: () => void client.invalidateQueries({ queryKey: ['executive','performance'] }) }); const snapshot = useMutation({ mutationFn: () => executiveApi.createPerformanceSnapshot({ scopeType: type, scopeId: id }), onSuccess: () => void client.invalidateQueries({ queryKey: ['executive','performance'] }) }); if (query.isLoading) return <Loading />; if (query.isError || !query.data) return <ErrorState label={`${type} performance`} />; const scope = query.data; return <main className="space-y-5"><header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">{type} performance</p><h1 className="text-2xl font-bold">{scope.scope_label}</h1><p className="mt-1 text-sm text-[var(--psm-muted)]">Scope-specific performance, quality, alerts, and permitted source trace.</p></div><div className="flex gap-2"><button className={button} disabled={recalc.isPending} title="Run a new scoped aggregation." onClick={() => recalc.mutate()}>{recalc.isPending ? 'Working…' : 'Recalculate'}</button><button className="rounded-md border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold disabled:opacity-60" disabled={snapshot.isPending || !scope.aggregation_run_id} title={scope.aggregation_run_id ? 'Create immutable performance snapshot.' : 'A completed aggregation is required before a snapshot can be created.'} onClick={() => snapshot.mutate()}>Create snapshot</button></div></header><NoRun scope={scope} /><ScopeCards scope={scope} /><ScopeDetailPanels scope={scope} /></main>; }
export function ExecutivePerformanceAnalysisPage({ mode }: { mode: 'heatmap' | 'rankings' | 'compare' | 'snapshots' }) { const query = useQuery({ queryKey: ['executive','performance',mode], queryFn: () => mode === 'heatmap' ? executiveApi.performanceHeatmap({ scopeType: 'site' }) : mode === 'snapshots' ? executiveApi.performanceSnapshots() : mode === 'rankings' ? executiveApi.performanceRankings({ scopeType: 'site' }) : executiveApi.performanceCompare({ scopeType: 'site' }) }); if (query.isLoading) return <Loading />; if (query.isError || !query.data) return <ErrorState label={`Performance ${mode}`} />; const raw: any = query.data; const rows: any[] = mode === 'heatmap' ? raw.cells : mode === 'snapshots' ? raw.rows : raw.rankings ?? raw.rows ?? []; return <main className="space-y-5"><header><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">Executive performance</p><h1 className="text-2xl font-bold capitalize">{mode}</h1><p className="mt-1 text-sm text-[var(--psm-muted)]">Generated from permitted Phase 2 results. Empty output means the source data is not yet available for this scope.</p></header><div className={`${card} overflow-x-auto`}><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-[var(--psm-muted)]"><tr>{['Scope','Module / Type','Value','Status','Reason'].map((head) => <th key={head} className="pb-2">{head}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id ?? index} className="border-t border-[var(--psm-line)]"><td className="py-3">{row.row_label ?? row.scope_label ?? row.snapshot_title ?? '—'}</td><td>{row.column_label ?? row.ranking_type ?? row.snapshot_type ?? '—'}</td><td>{row.cell_value ?? row.ranking_value ?? row.performance_score_foundation ?? '—'}</td><td><HeatmapCellStatusBadge status={row.cell_status ?? row.ranking_status ?? row.performance_status ?? 'Unavailable'} /></td><td>{row.ranking_reason ?? row.data_quality_status ?? '—'}</td></tr>)}</tbody></table>{!rows.length ? <p className="py-8 text-sm text-[var(--psm-muted)]">No permitted {mode} results are available.</p> : null}</div></main>; }
