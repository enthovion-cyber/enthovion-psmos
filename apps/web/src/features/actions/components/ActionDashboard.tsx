'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Download, Filter, Plus, ShieldAlert } from 'lucide-react';
import { useIamUsers } from '@/features/iam/hooks/useIam';
import { useActionAging, useActionDashboard, useActions } from '../hooks/useActions';
import { ActionCreateModal } from './ActionCreateModal';
import { PriorityBadge, StatusBadge, daysUntil } from './ActionBadges';

export function ActionDashboard() {
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState({ view: 'all', status: '', priority: '', moduleKey: '' });
  const params = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), [filters]);
  const actionsQuery = useActions(params);
  const dashboardQuery = useActionDashboard();
  const agingQuery = useActionAging();
  const usersQuery = useIamUsers();
  const totals = dashboardQuery.data?.totals;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Action Center</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Universal action engine for HAZOP, MOC, PTW, PSSR, equipment, audits, incidents, and training.</p>
        </div>
        <div className="flex gap-2">
          <button className="psm-button psm-button-secondary"><Download size={16} /> Export</button>
          <button className="psm-button psm-button-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> New Action</button>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Metric icon={<Clock size={18} />} label="Open Actions" value={totals?.open ?? 0} tone="info" />
        <Metric icon={<AlertTriangle size={18} />} label="Overdue" value={totals?.overdue ?? 0} tone="danger" />
        <Metric icon={<ShieldAlert size={18} />} label="Safety Critical" value={totals?.safetyCritical ?? 0} tone="warning" />
        <Metric icon={<CheckCircle2 size={18} />} label="Pending Verification" value={totals?.pendingVerification ?? 0} tone="success" />
        <Metric icon={<Filter size={18} />} label="All Actions" value={totals?.all ?? 0} tone="muted" />
      </div>

      <section className="psm-card p-4">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Action Register</h2>
          <div className="grid gap-2 md:grid-cols-4">
            <Select value={filters.view} onChange={(view) => setFilters({ ...filters, view })} options={[['all', 'All Actions'], ['assigned-to-me', 'Assigned to Me'], ['mine', 'My Actions']]} />
            <Select value={filters.status} onChange={(status) => setFilters({ ...filters, status })} options={[['', 'All Status'], ['OPEN', 'Open'], ['IN_PROGRESS', 'In Progress'], ['PENDING_VERIFICATION', 'Pending Verification'], ['CLOSED', 'Closed']]} />
            <Select value={filters.priority} onChange={(priority) => setFilters({ ...filters, priority })} options={[['', 'All Priority'], ['SAFETY_CRITICAL', 'Safety Critical'], ['HIGH', 'High'], ['MEDIUM', 'Medium'], ['LOW', 'Low']]} />
            <input className="psm-input px-3 text-sm" placeholder="Module" value={filters.moduleKey} onChange={(event) => setFilters({ ...filters, moduleKey: event.target.value })} />
          </div>
        </div>
        {actionsQuery.isLoading ? <div className="p-4 text-sm text-[var(--psm-muted)]">Loading actions...</div> : null}
        {actionsQuery.isError ? <div className="p-4 text-sm text-danger">Unable to load actions.</div> : null}
        <div className="overflow-auto">
          <table className="psm-table w-full min-w-[1050px] text-left text-sm">
            <thead className="sticky top-0 bg-[var(--psm-surface)] text-xs uppercase tracking-wide text-[var(--psm-muted)]">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Requirements</th>
              </tr>
            </thead>
            <tbody>
              {(actionsQuery.data ?? []).map((action) => {
                const days = daysUntil(action.dueDate);
                return (
                  <tr key={action.id} className="border-t border-[var(--psm-line)] hover:bg-[var(--psm-surface-2)]">
                    <td className="px-4 py-3">
                      <a href={`/actions/${action.id}`} className="font-semibold text-primary">{action.actionNumber ?? action.id}</a>
                      <div className="mt-1 max-w-md truncate text-[var(--psm-muted)]">{action.title}</div>
                    </td>
                    <td className="px-4 py-3">{action.moduleKey}<div className="text-xs text-[var(--psm-muted)]">{action.sourceId}</div></td>
                    <td className="px-4 py-3">{action.owner?.displayName ?? action.assignedToId}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={action.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={action.status} /></td>
                    <td className={`px-4 py-3 ${days < 0 ? 'text-danger' : days <= 7 ? 'text-warning' : ''}`}>{new Date(action.dueDate).toLocaleDateString()}<div className="text-xs">{days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}</div></td>
                    <td className="px-4 py-3 text-xs text-[var(--psm-muted)]">{action.evidenceRequired ? 'Evidence ' : ''}{action.verificationRequired ? 'Verification' : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Aging Buckets" data={agingQuery.data ?? {}} />
        <Panel title="By Module" data={dashboardQuery.data?.byModule ?? {}} />
      </section>

      {createOpen ? <ActionCreateModal users={usersQuery.data ?? []} onClose={() => setCreateOpen(false)} /> : null}
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'info' | 'danger' | 'warning' | 'success' | 'muted' }) {
  const toneClass = tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : tone === 'success' ? 'text-success' : tone === 'info' ? 'text-info' : 'text-[var(--psm-muted)]';
  return (
    <div className="psm-card p-4">
      <div className={`mb-3 ${toneClass}`}>{icon}</div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-[var(--psm-muted)]">{label}</div>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <select className="psm-input px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>;
}

function Panel({ title, data }: { title: string; data: Record<string, number> }) {
  return (
    <div className="psm-card p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">{title}</h3>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between rounded-lg bg-[var(--psm-surface-2)] px-3 py-2 text-sm">
            <span>{key}</span><span className="font-semibold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
