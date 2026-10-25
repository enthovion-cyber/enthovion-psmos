'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  ExternalLink,
  Filter,
  Layers,
  Search,
  ShieldAlert,
  User,
  Building2,
} from 'lucide-react';
import {
  useExecutiveOverdueActionDetail,
  useExecutiveOverdueActions,
  useExecutiveOverdueByModule,
  useExecutiveOverdueByOwner,
  useExecutiveOverdueBySite,
} from '../hooks/useExecutiveCriticalRisk';
import {
  OverdueSubnav,
  OverdueTable,
  RiskBadge,
  State,
  buttonSecondary,
  panel,
} from './CriticalRiskShared';
import { ExecutiveOverdueAgingChart } from '../components/charts';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { useMyPermissions } from '@/features/iam/hooks/useIam';

// ==========================================
// 1. Overdue Actions Overview Cockpit
// ==========================================
export function ExecutiveOverdueActionOverviewPage() {
  const query = useExecutiveOverdueActions();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  if (query.isLoading) return <State title="Loading Overdue Actions" message="Retrieving action snapshots from connected source modules..." />;
  if (query.isError || !query.data) {
    return <State title="Overdue Actions Unavailable" message="Could not retrieve overdue actions." retry={() => void query.refetch()} />;
  }

  const actions = query.data.rows ?? [];
  const criticalCount = actions.filter((a) => /critical|safety-critical/i.test(String(a.action_priority ?? a.severity ?? ''))).length;
  const highCount = actions.filter((a) => /high/i.test(String(a.action_priority ?? a.severity ?? ''))).length;
  const repeatCount = actions.filter((a) => Number(a.extension_count ?? 0) > 0 || a.repeat_overdue_flag).length;
  const staleCount = actions.filter((a) => a.overdue_days > 60).length;

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <OverdueSubnav />

      <header>
        <div className="flex items-center gap-2">
          <Clock className="text-[var(--psm-primary)]" size={24} />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--psm-text)]">
            Overdue Action Cockpit &amp; Aging Distribution
          </h1>
        </div>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">
          Aggregated overdue actions, audit findings, and PHA/MOC recommendations across all operational sites.
        </p>
      </header>

      {/* Summary KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`${panel} border-rose-500/30 bg-rose-500/5`}>
          <p className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-400">Critical Overdue</p>
          <p className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-400">{criticalCount}</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Safety-critical action SLA breaches</p>
        </div>
        <div className={`${panel} border-amber-500/30 bg-amber-500/5`}>
          <p className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">High Priority Overdue</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">{highCount}</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Secondary severity actions</p>
        </div>
        <div className={`${panel} border-orange-500/30 bg-orange-500/5`}>
          <p className="text-xs font-semibold uppercase text-orange-600 dark:text-orange-400">Repeated / Extended</p>
          <p className="mt-2 text-3xl font-extrabold text-orange-600 dark:text-orange-400">{repeatCount}</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Actions with multiple deadline extensions</p>
        </div>
        <div className={panel}>
          <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Stale (&gt; 60 Days)</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--psm-text)]">{staleCount}</p>
          <p className="mt-1 text-[11px] text-rose-500 font-semibold">Immediate intervention needed</p>
        </div>
      </section>

      {/* Interactive Aging Infographic Chart */}
      <ExecutiveOverdueAgingChart actions={actions} />

      {/* Overdue Action Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--psm-text)]">Active Overdue Action Ledger</h2>
          <span className="text-xs text-[var(--psm-muted)]">Showing {actions.length} action records</span>
        </div>
        <OverdueTable rows={actions} />
      </section>
    </main>
  );
}

// ==========================================
// 2. Overdue Action Register (Filterable)
// ==========================================
export function ExecutiveOverdueActionRegisterPage({ view }: { view?: string | undefined }) {
  const [searchTerm, setSearchTerm] = useState('');
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const queryParams: Record<string, unknown> = {};
  if (view && view !== 'register') queryParams.view = view;

  const query = useExecutiveOverdueActions(queryParams);

  if (query.isLoading) return <State title="Loading Overdue Actions" message="Fetching action records..." />;
  if (query.isError) return <State title="Register Unavailable" message="Could not load overdue actions." retry={() => void query.refetch()} />;

  const allRows = query.data?.rows ?? [];
  const filteredRows = searchTerm
    ? allRows.filter((r) =>
        r.action_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.action_code ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.source_module.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allRows;

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <OverdueSubnav />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">
            {view ? view.replace(/-/g, ' ').toUpperCase() : 'OVERDUE ACTION REGISTER'}
          </h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Full inventory of overdue CAPA, recommendations, and regulatory obligations.
          </p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-[var(--psm-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action titles, codes..."
            className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] py-1.5 pl-9 pr-3 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
          />
        </div>
      </header>

      <OverdueTable rows={filteredRows} />
    </main>
  );
}

// ==========================================
// 3. Overdue Actions Grouped by Owner
// ==========================================
export function ExecutiveOverdueByOwnerPage() {
  const query = useExecutiveOverdueByOwner();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  if (query.isLoading) return <State title="Loading Owner Breakdown" message="Aggregating overdue metrics by assignee..." />;
  if (query.isError) return <State title="Breakdown Unavailable" message="Could not load owner breakdown." retry={() => void query.refetch()} />;

  const rows = query.data?.rows ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <OverdueSubnav />

      <header>
        <h1 className="text-2xl font-bold text-[var(--psm-text)]">Overdue Actions by Assignee</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">
          Accountability view of open overdue actions grouped by individual operational owners.
        </p>
      </header>

      <div className={`${panel} overflow-x-auto`}>
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              <th className="pb-3 font-semibold">Owner User ID / Name</th>
              <th className="pb-3 font-semibold">Total Overdue</th>
              <th className="pb-3 font-semibold">Critical Overdue</th>
              <th className="pb-3 font-semibold">Max Days Overdue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.map((row) => (
              <tr key={row.ownerId} className="transition hover:bg-[var(--psm-surface-2)]/30">
                <td className="py-3.5 pr-3">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[var(--psm-text)]">
                    <User size={14} className="text-[var(--psm-muted)]" />
                    {row.ownerName}
                  </span>
                </td>
                <td className="py-3.5 pr-3 font-bold text-[var(--psm-text)]">{row.count}</td>
                <td className="py-3.5 pr-3">
                  {row.criticalCount > 0 ? (
                    <span className="rounded bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                      {row.criticalCount} Critical
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--psm-muted)]">0</span>
                  )}
                </td>
                <td className="py-3.5 pr-3 text-xs font-semibold text-[var(--psm-muted)]">
                  {row.maxOverdueDays} days
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="py-8 text-center text-sm text-[var(--psm-muted)]">No overdue action owner records found.</p>
        )}
      </div>
    </main>
  );
}

// ==========================================
// 4. Overdue Actions Grouped by Site
// ==========================================
export function ExecutiveOverdueBySitePage() {
  const query = useExecutiveOverdueBySite();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  if (query.isLoading) return <State title="Loading Site Breakdown" message="Aggregating overdue actions by site..." />;
  if (query.isError) return <State title="Breakdown Unavailable" message="Could not load site breakdown." retry={() => void query.refetch()} />;

  const rows = query.data?.rows ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <OverdueSubnav />

      <header>
        <h1 className="text-2xl font-bold text-[var(--psm-text)]">Overdue Actions by Operational Site</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">
          Geographic and facility distribution of overdue actions across the enterprise.
        </p>
      </header>

      <div className={`${panel} overflow-x-auto`}>
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              <th className="pb-3 font-semibold">Site Identifier</th>
              <th className="pb-3 font-semibold">Total Overdue</th>
              <th className="pb-3 font-semibold">Critical Overdue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.map((row) => (
              <tr key={row.siteId} className="transition hover:bg-[var(--psm-surface-2)]/30">
                <td className="py-3.5 pr-3">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[var(--psm-text)]">
                    <Building2 size={14} className="text-[var(--psm-muted)]" />
                    {row.siteId}
                  </span>
                </td>
                <td className="py-3.5 pr-3 font-bold text-[var(--psm-text)]">{row.count}</td>
                <td className="py-3.5 pr-3">
                  {row.criticalCount > 0 ? (
                    <span className="rounded bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                      {row.criticalCount} Critical
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--psm-muted)]">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

// ==========================================
// 5. Overdue Actions Grouped by Module
// ==========================================
export function ExecutiveOverdueByModulePage() {
  const query = useExecutiveOverdueByModule();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  if (query.isLoading) return <State title="Loading Module Breakdown" message="Aggregating overdue actions by module..." />;
  if (query.isError) return <State title="Breakdown Unavailable" message="Could not load module breakdown." retry={() => void query.refetch()} />;

  const rows = query.data?.rows ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <OverdueSubnav />

      <header>
        <h1 className="text-2xl font-bold text-[var(--psm-text)]">Overdue Actions by Originating Module</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">
          Functional module sources contributing to action backlogs and delayed commitments.
        </p>
      </header>

      <div className={`${panel} overflow-x-auto`}>
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              <th className="pb-3 font-semibold">Originating PSM Module</th>
              <th className="pb-3 font-semibold">Total Overdue</th>
              <th className="pb-3 font-semibold">Critical Overdue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.map((row) => (
              <tr key={row.module} className="transition hover:bg-[var(--psm-surface-2)]/30">
                <td className="py-3.5 pr-3 font-mono font-medium text-[var(--psm-text)]">
                  {row.module}
                </td>
                <td className="py-3.5 pr-3 font-bold text-[var(--psm-text)]">{row.count}</td>
                <td className="py-3.5 pr-3">
                  {row.criticalCount > 0 ? (
                    <span className="rounded bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                      {row.criticalCount} Critical
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--psm-muted)]">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

// ==========================================
// 6. Overdue Action Snapshot Detail
// ==========================================
export function ExecutiveOverdueActionDetailPage({ id }: { id: string }) {
  const query = useExecutiveOverdueActionDetail(id);
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  if (query.isLoading) return <State title="Loading Action Snapshot" message="Fetching action details..." />;
  if (query.isError || !query.data) return <State title="Snapshot Unavailable" message="Action record not found." retry={() => void query.refetch()} />;

  const action = query.data;

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      <div>
        <Link
          href="/executive/overdue-actions/register"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--psm-primary)] hover:underline"
        >
          <ArrowLeft size={14} /> Back to Overdue Action Register
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">{action.action_title}</h1>
          <RiskBadge value={action.action_priority || action.severity} />
        </div>
        <p className="mt-1 font-mono text-xs text-[var(--psm-muted)]">
          Action Key: {action.canonical_action_key || action.id} · Module: {action.source_module}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={panel}>
          <h3 className="font-bold text-[var(--psm-text)]">SLA &amp; Schedule Details</h3>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-[var(--psm-muted)]">Overdue Aging</dt>
              <dd className="mt-1 font-bold text-rose-600 dark:text-rose-400">{action.overdue_days} Days</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-[var(--psm-muted)]">Extension Count</dt>
              <dd className="mt-1 font-bold text-[var(--psm-text)]">{action.extension_count ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-[var(--psm-muted)]">Original Due Date</dt>
              <dd className="mt-1 font-medium text-[var(--psm-text)]">
                {action.original_due_at ? new Date(action.original_due_at).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-[var(--psm-muted)]">Effective Due Date</dt>
              <dd className="mt-1 font-medium text-[var(--psm-text)]">
                {action.effective_due_at || action.due_at
                  ? new Date(action.effective_due_at || action.due_at || '').toLocaleDateString()
                  : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>

        <div className={panel}>
          <h3 className="font-bold text-[var(--psm-text)]">Assignment &amp; Scope</h3>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-[var(--psm-muted)]">Action Owner</dt>
              <dd className="mt-1 font-semibold text-[var(--psm-text)]">
                {action.action_owner_user_id || action.owner_user_id || 'Unassigned'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-[var(--psm-muted)]">Action Status</dt>
              <dd className="mt-1 font-semibold text-[var(--psm-text)]">{action.action_status || 'Open'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-[var(--psm-muted)]">Site Scope</dt>
              <dd className="mt-1 font-semibold text-[var(--psm-text)]">{action.site_id || 'Corporate / General'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-[var(--psm-muted)]">Calculated At</dt>
              <dd className="mt-1 font-medium text-[var(--psm-text)]">
                {action.calculated_at ? new Date(action.calculated_at).toLocaleString() : 'Current Run'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  );
}
