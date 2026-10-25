'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Plus,
  ShieldAlert,
  Kanban,
  Table as TableIcon,
  Lock,
  User,
  ArrowRight
} from 'lucide-react';
import { useIamUsers } from '@/features/iam/hooks/useIam';
import { useActionAging, useActionDashboard, useActions } from '../hooks/useActions';
import { ActionCreateModal } from './ActionCreateModal';
import { PriorityBadge, StatusBadge, daysUntil } from './ActionBadges';

export function ActionDashboard() {
  const [createOpen, setCreateOpen] = useState(false);
  const [layout, setLayout] = useState<'table' | 'kanban'>('table');
  const [filters, setFilters] = useState({ view: 'all', status: '', priority: '', moduleKey: '', timingGate: '' });

  const params = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
    [filters]
  );

  const actionsQuery = useActions(params);
  const dashboardQuery = useActionDashboard();
  const agingQuery = useActionAging();
  const usersQuery = useIamUsers();

  const totals = dashboardQuery.data?.totals;
  const actions = actionsQuery.data ?? [];

  // Group actions for Kanban
  const kanbanColumns = useMemo(() => {
    return {
      OPEN: actions.filter((a: any) => a.status === 'OPEN' || a.status === 'DRAFT'),
      IN_PROGRESS: actions.filter((a: any) => a.status === 'IN_PROGRESS'),
      PENDING_VERIFICATION: actions.filter((a: any) => a.status === 'PENDING_VERIFICATION'),
      CLOSED: actions.filter((a: any) => a.status === 'CLOSED' || a.status === 'VERIFIED')
    };
  }, [actions]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Action Center (Unified CAPA)</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Single universal engine fed by PHA/HAZOP, MOC, PSSR, Audits, Incidents, and Mechanical Integrity with 4-eyes verification gates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-0.5">
            <button
              type="button"
              onClick={() => setLayout('table')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                layout === 'table' ? 'bg-primary text-white shadow-sm' : 'text-[var(--psm-muted)] hover:text-white'
              }`}
            >
              <TableIcon size={14} /> Table
            </button>
            <button
              type="button"
              onClick={() => setLayout('kanban')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                layout === 'kanban' ? 'bg-primary text-white shadow-sm' : 'text-[var(--psm-muted)] hover:text-white'
              }`}
            >
              <Kanban size={14} /> Kanban
            </button>
          </div>

          <button className="psm-button psm-button-secondary text-xs">
            <Download size={14} /> Export CSV
          </button>
          <button className="psm-button psm-button-primary text-xs" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> New Action
          </button>
        </div>
      </header>

      {/* KPI Counters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric icon={<Clock size={18} />} label="Open Actions" value={totals?.open ?? 0} tone="info" />
        <Metric icon={<AlertTriangle size={18} />} label="Overdue" value={totals?.overdue ?? 0} tone="danger" />
        <Metric icon={<ShieldAlert size={18} />} label="Safety Critical" value={totals?.safetyCritical ?? 0} tone="warning" />
        <Metric
          icon={<Lock size={18} />}
          label="Pre-Startup Blockers"
          value={(totals as any)?.preStartupBlockers ?? actions.filter((a: any) => a.timingGate === 'PRE_STARTUP' && a.status !== 'CLOSED' && a.status !== 'VERIFIED').length}
          tone="danger"
          highlight
        />
        <Metric icon={<CheckCircle2 size={18} />} label="Pending Verification" value={totals?.pendingVerification ?? 0} tone="success" />
      </div>

      {/* Filters Bar */}
      <section className="psm-card p-4">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Action Register</h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-5">
            <Select
              value={filters.view}
              onChange={(view) => setFilters({ ...filters, view })}
              options={[
                ['all', 'All Actions'],
                ['assigned-to-me', 'Assigned to Me'],
                ['mine', 'Created by Me']
              ]}
            />
            <Select
              value={filters.status}
              onChange={(status) => setFilters({ ...filters, status })}
              options={[
                ['', 'All Statuses'],
                ['OPEN', 'Open'],
                ['IN_PROGRESS', 'In Progress'],
                ['PENDING_VERIFICATION', 'Pending Verification'],
                ['VERIFIED', 'Verified'],
                ['CLOSED', 'Closed']
              ]}
            />
            <Select
              value={filters.priority}
              onChange={(priority) => setFilters({ ...filters, priority })}
              options={[
                ['', 'All Priorities'],
                ['SAFETY_CRITICAL', 'Safety Critical'],
                ['HIGH', 'High'],
                ['MEDIUM', 'Medium'],
                ['LOW', 'Low']
              ]}
            />
            <Select
              value={filters.timingGate}
              onChange={(timingGate) => setFilters({ ...filters, timingGate })}
              options={[
                ['', 'All Timing Gates'],
                ['PRE_STARTUP', 'Pre-Startup Only'],
                ['POST_STARTUP', 'Post-Startup Only']
              ]}
            />
            <input
              className="psm-input px-3 text-xs"
              placeholder="Filter by Module..."
              value={filters.moduleKey}
              onChange={(event) => setFilters({ ...filters, moduleKey: event.target.value })}
            />
          </div>
        </div>

        {actionsQuery.isLoading ? <div className="p-8 text-center text-sm text-[var(--psm-muted)]">Loading actions...</div> : null}
        {actionsQuery.isError ? <div className="p-8 text-center text-sm text-danger">Unable to load actions. Check connection.</div> : null}

        {/* View Mode 1: Table */}
        {layout === 'table' && (
          <div className="overflow-x-auto">
            <table className="psm-table w-full min-w-[1050px] text-left text-sm">
              <thead className="sticky top-0 bg-[var(--psm-surface)] text-xs uppercase tracking-wide text-[var(--psm-muted)] border-b border-[var(--psm-line)]">
                <tr>
                  <th className="px-4 py-3">Action ID & Title</th>
                  <th className="px-4 py-3">Timing Gate</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Requirements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {actions.map((action: any) => {
                  const days = daysUntil(action.dueDate);
                  const isPreStartup = action.timingGate === 'PRE_STARTUP' || action.timing_gate === 'PRE_STARTUP';

                  return (
                    <tr key={action.id} className="hover:bg-[var(--psm-surface-2)] transition">
                      <td className="px-4 py-3">
                        <a href={`/actions/${action.id}`} className="font-semibold text-primary hover:underline">
                          {action.actionNumber ?? action.id.slice(0, 8)}
                        </a>
                        <div className="mt-0.5 max-w-sm truncate text-xs text-[var(--psm-muted)]">{action.title}</div>
                      </td>

                      <td className="px-4 py-3">
                        {isPreStartup ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-400">
                            <Lock size={11} /> Pre-Startup
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--psm-muted)]">Post / Standard</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <span className="font-medium text-white/90">{action.moduleKey}</span>
                        {action.sourceId && (
                          <div className="text-[11px] text-[var(--psm-muted)] truncate max-w-[120px]">{action.sourceId}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-1.5 text-white/90">
                          <User size={13} className="text-[var(--psm-muted)]" />
                          <span>{action.owner?.displayName ?? action.assignedToId?.slice(0, 8) ?? 'Unassigned'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <PriorityBadge priority={action.priority} />
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={action.status} />
                      </td>

                      <td className={`px-4 py-3 text-xs ${days < 0 ? 'text-danger font-semibold' : days <= 7 ? 'text-warning' : ''}`}>
                        {new Date(action.dueDate).toLocaleDateString()}
                        <div className="text-[10px] opacity-80">
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-[var(--psm-muted)]">
                        {action.evidenceRequired ? 'Evidence · ' : ''}
                        {action.verificationRequired ? '4-Eyes Verification' : 'Standard'}
                      </td>
                    </tr>
                  );
                })}

                {!actions.length && !actionsQuery.isLoading && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-sm text-[var(--psm-muted)]">
                      No actions match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* View Mode 2: Kanban Board */}
        {layout === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
            {[
              { key: 'OPEN', label: 'Open', items: kanbanColumns.OPEN, tone: 'border-info/30 bg-info/5' },
              { key: 'IN_PROGRESS', label: 'In Progress', items: kanbanColumns.IN_PROGRESS, tone: 'border-primary/30 bg-primary/5' },
              { key: 'PENDING_VERIFICATION', label: 'Pending Verification', items: kanbanColumns.PENDING_VERIFICATION, tone: 'border-amber-500/30 bg-amber-500/5' },
              { key: 'CLOSED', label: 'Verified / Closed', items: kanbanColumns.CLOSED, tone: 'border-success/30 bg-success/5' }
            ].map((col) => (
              <div key={col.key} className={`rounded-xl border p-3 ${col.tone} flex flex-col min-h-[480px]`}>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--psm-line)]">
                  <span className="font-bold text-xs uppercase tracking-wider">{col.label}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-mono font-bold">
                    {col.items.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {col.items.map((act: any) => {
                    const days = daysUntil(act.dueDate);
                    const isPreStartup = act.timingGate === 'PRE_STARTUP' || act.timing_gate === 'PRE_STARTUP';

                    return (
                      <div
                        key={act.id}
                        className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-sm hover:border-info/50 transition cursor-pointer"
                        onClick={() => window.location.href = `/actions/${act.id}`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="font-mono text-xs font-bold text-primary">
                            {act.actionNumber ?? act.id.slice(0, 8)}
                          </span>
                          <PriorityBadge priority={act.priority} />
                        </div>

                        <h4 className="text-xs font-semibold line-clamp-2 mb-2 text-white/90">{act.title}</h4>

                        {isPreStartup && (
                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                              <Lock size={10} /> Pre-Startup Gate
                            </span>
                          </div>
                        )}

                        <div className="border-t border-[var(--psm-line)] pt-2 mt-2 flex items-center justify-between text-[11px] text-[var(--psm-muted)]">
                          <span className="truncate max-w-[120px]">
                            {act.owner?.displayName ?? 'Unassigned'}
                          </span>
                          <span className={days < 0 ? 'text-danger font-semibold' : ''}>
                            {days < 0 ? `${Math.abs(days)}d late` : `${days}d left`}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {!col.items.length && (
                    <div className="p-6 text-center text-xs text-[var(--psm-muted)]">No actions in this stage</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Analytics Panels */}
      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Aging Buckets (Days Open)" data={agingQuery.data ?? {}} />
        <Panel title="CAPA Ingestion by PSM Module" data={dashboardQuery.data?.byModule ?? {}} />
      </section>

      {createOpen && <ActionCreateModal users={usersQuery.data ?? []} onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
  highlight
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'info' | 'danger' | 'warning' | 'success' | 'muted';
  highlight?: boolean;
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-danger'
      : tone === 'warning'
      ? 'text-warning'
      : tone === 'success'
      ? 'text-success'
      : tone === 'info'
      ? 'text-info'
      : 'text-[var(--psm-muted)]';

  return (
    <div className={`psm-card p-4 transition ${highlight && value > 0 ? 'border-amber-500/50 bg-amber-500/5 shadow-md' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">{label}</span>
        <span className={toneClass}>{icon}</span>
      </div>
      <div className={`mt-2 text-2xl font-extrabold ${toneClass}`}>{value}</div>
    </div>
  );
}

function Select({
  value,
  options,
  onChange
}: {
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      className="psm-input h-9 px-2 text-xs"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map(([val, label]) => (
        <option key={val} value={val}>
          {label}
        </option>
      ))}
    </select>
  );
}

function Panel({ title, data }: { title: string; data: Record<string, number> }) {
  return (
    <section className="psm-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(data).map(([key, count]) => (
          <div key={key} className="rounded-lg bg-[var(--psm-surface-2)] p-3 text-center border border-[var(--psm-line)]">
            <div className="text-xs text-[var(--psm-muted)] truncate">{key}</div>
            <div className="mt-1 text-lg font-bold text-white/90">{count}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
