'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, CheckCircle, AlertTriangle, Layers, Play } from 'lucide-react';
import { executiveApi } from '../services/executive-api';
import { ExecutiveStatusBadge } from '../components/shared/ExecutiveStatusBadge';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { ExecutiveAlertDonutChart } from '../components/charts';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

const card = 'rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm';
const title = 'text-2xl font-bold text-[var(--psm-text)]';
const buttonPrimary = 'inline-flex items-center gap-2 rounded-lg bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60';
const buttonSecondary = 'inline-flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3.5 py-2 text-sm font-semibold text-[var(--psm-text)] transition hover:bg-[var(--psm-surface-2)] disabled:opacity-60';

function Loading() { return <div className="h-64 animate-pulse rounded-xl bg-[var(--psm-surface-2)]" />; }
function ErrorState({ label, retry }: { label: string; retry?: () => void }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-[var(--psm-text)]">
      <h2 className="font-bold text-base text-rose-700 dark:text-rose-300">{label} unavailable</h2>
      <p className="mt-1 text-sm text-[var(--psm-muted)]">Confirm the Executive Phase 2 migration has been applied and your user role has the required permissions.</p>
      {retry ? <button type="button" onClick={retry} className={`${buttonSecondary} mt-3`}>Retry</button> : null}
    </div>
  );
}

export function ExecutiveAggregationRunPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const query = useQuery({ queryKey: ['executive','aggregation-runs'], queryFn: () => executiveApi.aggregationRuns() });
  const client = useQueryClient();
  const runMutation = useMutation({
    mutationFn: (scope?: Record<string, unknown>) => executiveApi.runAggregation(scope),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['executive'] })
  });

  if (query.isLoading) return <Loading />;
  if (query.isError) return <ErrorState label="Aggregation history" retry={() => void query.refetch()} />;

  return (
    <main className="space-y-5">
      <ExecutiveOverviewNavigation permissions={granted} />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">Phase 2 Aggregation Engine</p>
          <h1 className={title}>Aggregation Runs</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Immutable run records capturing cross-module counts, duration, and data-quality states.</p>
        </div>
        <button
          type="button"
          onClick={() => runMutation.mutate({})}
          disabled={runMutation.isPending}
          className={buttonPrimary}
        >
          <RefreshCw size={15} className={runMutation.isPending ? "animate-spin" : ""} />
          {runMutation.isPending ? "Running..." : "Run Aggregation Now"}
        </button>
      </header>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              <th className="pb-3 font-semibold">Run Code</th>
              <th className="pb-3 font-semibold">Scope</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Sources</th>
              <th className="pb-3 font-semibold">Warnings / Errors</th>
              <th className="pb-3 font-semibold">Completed</th>
            </tr>
          </thead>
          <tbody>
            {(query.data?.rows ?? []).map((run) => (
              <tr key={run.id} className="border-b border-[var(--psm-line)] transition hover:bg-[var(--psm-surface-2)] last:border-0">
                <td className="py-3 font-semibold">
                  <Link className="text-[var(--psm-primary)] hover:underline" href={`/executive/aggregation/runs/${run.id}`}>
                    {run.run_code ?? run.id}
                  </Link>
                </td>
                <td className="py-3 text-[var(--psm-text)]">{run.site_id ?? 'Company Wide'}</td>
                <td className="py-3"><ExecutiveStatusBadge status={run.run_status} /></td>
                <td className="py-3 font-medium text-[var(--psm-text)]">{run.source_count}</td>
                <td className="py-3 text-[var(--psm-muted)]">{run.warning_count + run.error_count}</td>
                <td className="py-3 text-xs text-[var(--psm-muted)]">{run.completed_at ? new Date(run.completed_at).toLocaleString() : 'In progress'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!query.data?.rows.length ? (
          <p className="py-8 text-center text-sm text-[var(--psm-muted)]">No permitted aggregation runs have executed yet for this scope.</p>
        ) : null}
      </div>
    </main>
  );
}

export function ExecutiveAggregationRunDetailPage({ runId }: { runId: string }) {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const query = useQuery({ queryKey: ['executive','aggregation-run',runId], queryFn: () => executiveApi.aggregationRun(runId) });

  if (query.isLoading) return <Loading />;
  if (query.isError || !query.data) return <ErrorState label="Aggregation run detail" />;

  const data = query.data;
  return (
    <main className="space-y-5">
      <ExecutiveOverviewNavigation permissions={granted} />
      <header className="flex flex-col gap-2">
        <Link href="/executive/aggregation/runs" className="text-xs font-semibold text-[var(--psm-primary)] hover:underline">
          &larr; Back to Aggregation Runs
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className={title}>{data.run.run_code ?? 'Aggregation Run'}</h1>
          <ExecutiveStatusBadge status={data.run.run_status} />
        </div>
        <p className="text-sm text-[var(--psm-muted)]">
          {data.run.source_count} normalized source records across connected modules · {data.run.error_count} safe errors · Run duration: {data.run.duration_ms ?? '—'} ms
        </p>
      </header>

      <section className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--psm-line)] pb-3">
          <h2 className="text-base font-bold text-[var(--psm-text)]">Run Execution Diagnostics &amp; Telemetry</h2>
          <span className="text-xs font-semibold text-[var(--psm-muted)]">Scope: {data.run.site_id ?? 'Company Wide'}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <span className="text-[var(--psm-muted)]">Total Sources Ingested</span>
            <p className="mt-1 text-xl font-bold text-[var(--psm-text)]">{data.run.source_count}</p>
          </div>
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <span className="text-[var(--psm-muted)]">Execution Duration</span>
            <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{data.run.duration_ms ?? 0} ms</p>
          </div>
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <span className="text-[var(--psm-muted)]">Diagnostics &amp; Errors</span>
            <p className="mt-1 text-xl font-bold text-amber-500">{data.run.error_count}</p>
          </div>
          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
            <span className="text-[var(--psm-muted)]">Critical Alerts Found</span>
            <p className="mt-1 text-xl font-bold text-rose-500">{data.criticalAlerts.length}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-[var(--psm-text)]">Module Health Snapshots</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.moduleHealth.map((module) => (
            <Link key={module.moduleKey} href={`/executive/module-health/${module.moduleKey}`} className={`${card} transition hover:border-[var(--psm-primary)]`}>
              <div className="flex justify-between gap-2">
                <b className="text-sm font-semibold text-[var(--psm-text)]">{module.moduleName}</b>
                <ExecutiveStatusBadge status={module.healthStatus} />
              </div>
              <p className="mt-3 text-2xl font-bold text-[var(--psm-text)]">{module.healthScoreFoundation ?? '—'}</p>
              <p className="text-xs text-[var(--psm-muted)]">Health score foundation</p>
            </Link>
          ))}
        </div>
      </section>

      <RecordTable title="Critical alerts captured in run" rows={data.criticalAlerts.map((alert) => ({ ...alert }))} />
      <RecordTable title="Aggregation errors & diagnostics" rows={data.errors} />
    </main>
  );
}

export function ExecutiveModuleHealthDetailPage({ moduleKey }: { moduleKey: string }) {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const query = useQuery({ queryKey: ['executive','module-health',moduleKey], queryFn: () => executiveApi.phase2Module(moduleKey) });
  const client = useQueryClient();
  const recalculate = useMutation({
    mutationFn: () => executiveApi.recalculateModule(moduleKey),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['executive'] })
  });

  if (query.isLoading) return <Loading />;
  if (query.isError || !query.data) return <ErrorState label="Module health detail" retry={() => void query.refetch()} />;

  const data = query.data;
  return (
    <main className="space-y-5">
      <ExecutiveOverviewNavigation permissions={granted} />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/executive/modules" className="text-xs font-semibold text-[var(--psm-primary)] hover:underline">
            &larr; Back to Module Health Overview
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className={title}>{data.module.moduleName}</h1>
            <ExecutiveStatusBadge status={data.module.healthStatus} />
          </div>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Health scoring is calculated server-side from connected plant adapters. Zero fake scores.
          </p>
        </div>
        <button
          type="button"
          onClick={() => recalculate.mutate()}
          disabled={recalculate.isPending}
          className={buttonPrimary}
        >
          <RefreshCw size={15} className={recalculate.isPending ? "animate-spin" : ""} />
          {recalculate.isPending ? "Recalculating..." : "Recalculate Module"}
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Health Score', data.module.healthScoreFoundation ?? 'Incomplete Data'],
          ['Critical Items', data.module.criticalOpenItems],
          ['Overdue Items', data.module.overdueItems],
          ['Stale Records', data.module.staleRecords],
        ].map(([label, value]) => (
          <div key={String(label)} className={card}>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">{label}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--psm-text)]">{String(value)}</p>
          </div>
        ))}
      </div>

      {typeof data.module.healthScoreFoundation === 'number' ? (
        <section className={`${card} space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--psm-line)] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--psm-text)]">Health Score Foundation &amp; Deduction Model</h3>
              <p className="text-xs text-[var(--psm-muted)]">Explainable calculation breakdown based on real source records.</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Score: {data.module.healthScoreFoundation} / 100
            </span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--psm-surface-2)]">
            <div
              style={{ width: `${Math.max(0, Math.min(100, data.module.healthScoreFoundation))}%` }}
              className={`h-full rounded-full transition-all duration-700 ${
                data.module.healthScoreFoundation >= 85
                  ? 'bg-emerald-500'
                  : data.module.healthScoreFoundation >= 70
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
          </div>

          <div className="grid gap-3 pt-1 sm:grid-cols-4 text-xs">
            <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5">
              <span className="text-[var(--psm-muted)]">Base Score</span>
              <p className="mt-1 font-bold text-[var(--psm-text)]">100 pts</p>
            </div>
            <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5">
              <span className="text-[var(--psm-muted)]">Critical Items (-20 ea)</span>
              <p className="mt-1 font-bold text-rose-500">
                -{data.module.criticalOpenItems * 20} pts
              </p>
            </div>
            <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5">
              <span className="text-[var(--psm-muted)]">Overdue Items (-8 ea)</span>
              <p className="mt-1 font-bold text-amber-500">
                -{data.module.overdueItems * 8} pts
              </p>
            </div>
            <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-2.5">
              <span className="text-[var(--psm-muted)]">Stale Records (-4 ea)</span>
              <p className="mt-1 font-bold text-slate-500">
                -{data.module.staleRecords * 4} pts
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <RecordTable title="Critical source items" rows={data.criticalItems} />
      <RecordTable title="Overdue source items" rows={data.overdueItems} />
      <RecordTable title="Pending approvals" rows={data.pendingApprovals} />
      <RecordTable title="Stale source records" rows={data.staleRecords} />
      <RecordTable title="Normalized source trace" rows={data.sourceTrace} />
    </main>
  );
}

export function ExecutiveCriticalAlertPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const query = useQuery({ queryKey: ['executive','critical-alerts'], queryFn: () => executiveApi.phase2Alerts() });
  const client = useQueryClient();
  const resolve = useMutation({
    mutationFn: ({ id, resolutionNote }: { id: string; resolutionNote: string }) =>
      executiveApi.resolveAlert(id, resolutionNote),
    onSuccess: () => {
      setResolvingId(null);
      setReason('');
      void client.invalidateQueries({ queryKey: ['executive'] });
    }
  });

  if (query.isLoading) return <Loading />;
  if (query.isError) return <ErrorState label="Critical alerts" retry={() => void query.refetch()} />;

  return (
    <main className="space-y-5">
      <ExecutiveOverviewNavigation permissions={granted} />
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">Phase 2 Risk Aggregation</p>
        <h1 className={title}>Critical Alerts</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Ranked cross-module alerts extracted directly from operational modules. Restricted records are safely masked.</p>
      </header>

      <ExecutiveAlertDonutChart alerts={query.data ?? []} />

      <div className={`${card} space-y-3`}>
        {(query.data ?? []).map((alert) => (
          <article key={alert.id} className="flex flex-col justify-between gap-3 border-b border-[var(--psm-line)] pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-sm font-semibold text-[var(--psm-text)]">
                  {alert.restricted ? 'Restricted source record' : alert.alert_title}
                </b>
                <ExecutiveStatusBadge status={alert.severity} />
              </div>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                {alert.source_module} · {alert.alert_reason} {alert.due_date ? `· Due: ${new Date(alert.due_date).toLocaleDateString()}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {alert.drilldown_route && !alert.restricted ? (
                <Link href={alert.drilldown_route} className={buttonSecondary}>
                  Open Source
                </Link>
              ) : null}
              {alert.alert_status === 'Resolved' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={14} /> Resolved
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setResolvingId(alert.id);
                    setReason('Resolved following executive review and verification.');
                  }}
                  className={buttonSecondary}
                >
                  Resolve Alert
                </button>
              )}
            </div>
          </article>
        ))}
        {!query.data?.length ? (
          <p className="py-6 text-center text-sm text-[var(--psm-muted)]">No open critical alerts exist from the latest aggregation run.</p>
        ) : null}
      </div>

      {resolvingId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Resolve Executive Alert</h3>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Enter the rationale or mitigation reference for closing this alert. This action will be audited.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Resolution reason..."
              className="mt-3 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm text-[var(--psm-text)] focus:outline-none focus:ring-2 focus:ring-[var(--psm-primary)]"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResolvingId(null)}
                className={buttonSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reason.trim() || resolve.isPending}
                onClick={() => resolve.mutate({ id: resolvingId, resolutionNote: reason.trim() })}
                className={buttonPrimary}
              >
                {resolve.isPending ? "Resolving..." : "Confirm Resolution"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export function ExecutiveSourceConfigPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const query = useQuery({ queryKey: ['executive','source-configs'], queryFn: executiveApi.sourceConfigs });
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => executiveApi.updateSourceConfig(id, { active }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['executive','source-configs'] })
  });

  if (query.isLoading) return <Loading />;
  if (query.isError) return <ErrorState label="Source configuration" retry={() => void query.refetch()} />;

  return (
    <main className="space-y-5">
      <ExecutiveOverviewNavigation permissions={granted} />
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">Phase 2 Source Management</p>
        <h1 className={title}>Source Configurations</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Per-company adapter eligibility, required permissions, and health calculation weighting.</p>
      </header>

      <div className={`${card} space-y-3`}>
        {(query.data ?? []).map((config) => (
          <div key={String(config.id)} className="flex flex-col justify-between gap-3 border-b border-[var(--psm-line)] pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center">
            <div>
              <b className="text-sm font-semibold text-[var(--psm-text)]">{String(config.module_label)}</b>
              <p className="text-xs text-[var(--psm-muted)]">
                Required permission: {String(config.required_permission ?? 'Public for tenant')} · Adapter: {config.adapter_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => mutation.mutate({ id: String(config.id), active: !Boolean(config.active) })}
              className={buttonSecondary}
            >
              {config.active ? 'Disable in Aggregation' : 'Enable in Aggregation'}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

export function ExecutiveErrorsPage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const query = useQuery({ queryKey: ['executive','aggregation-errors'], queryFn: executiveApi.aggregationErrors });
  const client = useQueryClient();
  const resolve = useMutation({
    mutationFn: ({ id, resolutionNote }: { id: string; resolutionNote: string }) =>
      executiveApi.resolveAggregationError(id, resolutionNote),
    onSuccess: () => {
      setResolvingId(null);
      setReason('');
      void client.invalidateQueries({ queryKey: ['executive'] });
    }
  });

  if (query.isLoading) return <Loading />;
  if (query.isError) return <ErrorState label="Aggregation errors" retry={() => void query.refetch()} />;

  const errors = query.data ?? [];
  return (
    <main className="space-y-5">
      <ExecutiveOverviewNavigation permissions={granted} />
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">Diagnostics & Health</p>
        <h1 className={title}>Aggregation Errors</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Safe adapter error summaries. Sensitive stack traces and raw DB errors are sanitized.</p>
      </header>

      <div className={`${card} space-y-3`}>
        {errors.map((err) => (
          <article key={String(err.id)} className="flex flex-col justify-between gap-3 border-b border-[var(--psm-line)] pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-rose-700 dark:text-rose-400">{String(err.error_code)}</span>
                <span className="rounded bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-300">
                  {String(err.source_module)}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--psm-text)]">{String(err.safe_error_message)}</p>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                Occurred: {err.occurred_at ? new Date(String(err.occurred_at)).toLocaleString() : 'Unknown'}
              </p>
            </div>
            {err.resolved_at ? (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Resolved</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setResolvingId(String(err.id));
                  setReason('Verified adapter configuration and acknowledged error.');
                }}
                className={buttonSecondary}
              >
                Acknowledge / Resolve
              </button>
            )}
          </article>
        ))}
        {!errors.length ? (
          <p className="py-6 text-center text-sm text-[var(--psm-muted)]">Zero aggregation errors recorded.</p>
        ) : null}
      </div>

      {resolvingId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Resolve Aggregation Error</h3>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Enter reason for resolving this error record:
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Resolution note..."
              className="mt-3 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm text-[var(--psm-text)] focus:outline-none focus:ring-2 focus:ring-[var(--psm-primary)]"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResolvingId(null)}
                className={buttonSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reason.trim() || resolve.isPending}
                onClick={() => resolve.mutate({ id: resolvingId, resolutionNote: reason.trim() })}
                className={buttonPrimary}
              >
                {resolve.isPending ? "Resolving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export function ExecutiveUnitPerformancePage() {
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);
  const query = useQuery({ queryKey: ['executive','unit-performance'], queryFn: () => executiveApi.units() });

  if (query.isLoading) return <Loading />;
  if (query.isError) return <ErrorState label="Unit performance" retry={() => void query.refetch()} />;

  return (
    <main className="space-y-5">
      <ExecutiveOverviewNavigation permissions={granted} />
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-primary)]">Phase 2 Granular Scope</p>
        <h1 className={title}>Unit Performance Foundation</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Process unit and area aggregation foundation across permitted equipment circuits.</p>
      </header>
      <RecordTable title="Unit-level aggregate matrix" rows={query.data ?? []} />
    </main>
  );
}

function RecordTable({ title: heading, rows }: { title: string; rows: Array<Record<string, unknown>> }) {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).filter((key) => !key.includes('json')).slice(0, 7);

  return (
    <section className={card}>
      <h2 className="font-semibold text-base text-[var(--psm-text)]">{heading}</h2>
      {rows.length ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="pb-2 pr-4 font-semibold">{column.replaceAll('_',' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={String(row.id ?? index)} className="border-b border-[var(--psm-line)] transition hover:bg-[var(--psm-surface-2)] last:border-0">
                  {columns.map((column) => (
                    <td key={column} className="py-2.5 pr-4 align-top text-[var(--psm-text)]">
                      {typeof row[column] === 'object' ? 'Available' : String(row[column] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--psm-muted)]">No permitted records are available.</p>
      )}
    </section>
  );
}

