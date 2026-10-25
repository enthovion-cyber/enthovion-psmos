'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Layers,
  Link2,
  Lock,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  User,
  UserCheck,
} from 'lucide-react';
import {
  useExecutiveCriticalBarriers,
  useExecutiveCriticalRiskCases,
  useExecutiveCriticalRiskDashboard,
  useExecutiveCriticalRiskDetail,
  useExecutiveCriticalRiskHistory,
  useExecutiveCriticalRiskMutation,
} from '../hooks/useExecutiveCriticalRisk';
import {
  BarrierBadge,
  CaseStatusBadge,
  CriticalRiskSubnav,
  EscalationTable,
  OverdueTable,
  RiskBadge,
  RiskTable,
  State,
  button,
  buttonSecondary,
  panel,
} from './CriticalRiskShared';
import {
  ExecutiveAlertDonutChart,
  ExecutiveBarrierStatusChart,
  ExecutiveEscalationSlaChart,
  ExecutiveOverdueAgingChart,
} from '../components/charts';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import {
  AcknowledgeCriticalRiskDialog,
  AssignExecutiveOwnerDialog,
  CloseCriticalRiskDialog,
  CreateRiskActionDialog,
  CreateRiskEscalationDialog,
  LinkActionDialog,
  RequestVerificationDialog,
} from '../dialogs';
import type { ExecutiveRiskCase } from '../types/executive-critical-risk.types';

// ==========================================
// 1. Critical Risk & Overdue Cockpit Dashboard
// ==========================================
export function ExecutiveCriticalRiskDashboardPage() {
  const query = useExecutiveCriticalRiskDashboard();
  const mutation = useExecutiveCriticalRiskMutation();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  // Dialog State
  const [selectedCaseForAck, setSelectedCaseForAck] = useState<ExecutiveRiskCase | null>(null);
  const [selectedCaseForOwner, setSelectedCaseForOwner] = useState<ExecutiveRiskCase | null>(null);
  const [selectedCaseForEscalate, setSelectedCaseForEscalate] = useState<ExecutiveRiskCase | null>(null);

  if (query.isLoading) {
    return <State title="Loading Critical Risk Cockpit" message="Retrieving real-time multi-module risk and overdue action data." />;
  }
  if (query.isError || !query.data) {
    return (
      <State
        title="Critical Risk Cockpit Unavailable"
        message="Could not load the executive risk cockpit. Verify Phase 5 migrations are applied."
        retry={() => void query.refetch()}
      />
    );
  }

  const data = query.data;
  const chartAlerts = (data.attention ?? []).map((a) => ({
    severity: a.risk_priority ?? a.executive_priority ?? 'Critical',
    title: a.risk_title,
    due_date: a.source_due_at || null,
  }));

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <CriticalRiskSubnav />

      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-rose-500" size={24} />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--psm-text)]">
              Critical Risk &amp; Overdue Action Cockpit
            </h1>
          </div>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Enterprise process risk aggregation and leadership oversight across connected PSM operational modules.
          </p>
        </div>

        <button
          className={button}
          type="button"
          disabled={mutation.recalculate.isPending}
          onClick={() => mutation.recalculate.mutate(undefined)}
        >
          <RefreshCw size={16} className={mutation.recalculate.isPending ? 'animate-spin' : ''} />
          {mutation.recalculate.isPending ? 'Recalculating...' : 'Recalculate Cockpit'}
        </button>
      </header>

      {/* Summary KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <div className={`${panel} border-rose-500/30 bg-rose-500/5`}>
          <p className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-400">Open Critical Risks</p>
          <p className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-400">{data.summary.openCriticalRisks}</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Unresolved high-severity events</p>
        </div>
        <div className={`${panel} border-amber-500/30 bg-amber-500/5`}>
          <p className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">High Priority Risks</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">{data.summary.highPriorityRisks}</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Secondary severity cases</p>
        </div>
        <div className={panel}>
          <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Unacknowledged</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--psm-text)]">{data.summary.unacknowledgedRisks}</p>
          <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Requires leadership signoff</p>
        </div>
        <div className={panel}>
          <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Awaiting Verification</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--psm-text)]">{data.summary.awaitingVerification}</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Pending field signoff</p>
        </div>
        <div className={`${panel} border-purple-500/30 bg-purple-500/5`}>
          <p className="text-xs font-semibold uppercase text-purple-600 dark:text-purple-400">Active Escalations</p>
          <p className="mt-2 text-3xl font-extrabold text-purple-600 dark:text-purple-400">{data.summary.activeEscalations}</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Under leadership review</p>
        </div>
        <div className={panel}>
          <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Overdue Actions</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--psm-text)]">{data.summary.overdueActions}</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Unresolved action snapshots</p>
        </div>
        <div className={`${panel} border-orange-500/30 bg-orange-500/5`}>
          <p className="text-xs font-semibold uppercase text-orange-600 dark:text-orange-400">Repeated Overdue</p>
          <p className="mt-2 text-3xl font-extrabold text-orange-600 dark:text-orange-400">{data.summary.repeatedOverdueActions}</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Multiple extensions requested</p>
        </div>
      </section>

      {/* Visual Infographics & Charts */}
      <section className="space-y-6">
        <ExecutiveBarrierStatusChart cases={data.criticalRisks} />
        <div className="grid gap-6 lg:grid-cols-2">
          {chartAlerts.length > 0 && <ExecutiveAlertDonutChart alerts={chartAlerts} />}
          <ExecutiveEscalationSlaChart escalations={data.activeEscalations} />
        </div>
        <ExecutiveOverdueAgingChart actions={data.overdueActions} />
      </section>

      {/* Immediate Attention & Active Escalations Tables */}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--psm-text)]">Immediate Leadership Attention</h2>
            <Link className="text-xs font-semibold text-[var(--psm-primary)] hover:underline" href="/executive/critical-risks/register">
              View All Risks →
            </Link>
          </div>
          <RiskTable
            rows={data.attention}
            onAcknowledge={(c) => setSelectedCaseForAck(c)}
            onAssignOwner={(c) => setSelectedCaseForOwner(c)}
            onEscalate={(c) => setSelectedCaseForEscalate(c)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--psm-text)]">Active Multi-Tier Escalations</h2>
            <Link className="text-xs font-semibold text-[var(--psm-primary)] hover:underline" href="/executive/escalations">
              View All Escalations →
            </Link>
          </div>
          <EscalationTable rows={data.activeEscalations} />
        </div>
      </section>

      {/* Overdue Action Attention */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--psm-text)]">High-Priority Overdue Actions</h2>
          <Link className="text-xs font-semibold text-[var(--psm-primary)] hover:underline" href="/executive/overdue-actions">
            View All Overdue Actions →
          </Link>
        </div>
        <OverdueTable rows={data.overdueActions} />
      </section>

      {/* Action Dialogs */}
      {selectedCaseForAck && (
        <AcknowledgeCriticalRiskDialog
          isOpen={Boolean(selectedCaseForAck)}
          onClose={() => setSelectedCaseForAck(null)}
          riskTitle={selectedCaseForAck.risk_title}
          isLoading={mutation.acknowledge.isPending}
          onConfirm={async (note) => {
            await mutation.acknowledge.mutateAsync({ id: selectedCaseForAck.id, note });
          }}
        />
      )}

      {selectedCaseForOwner && (
        <AssignExecutiveOwnerDialog
          isOpen={Boolean(selectedCaseForOwner)}
          onClose={() => setSelectedCaseForOwner(null)}
          riskTitle={selectedCaseForOwner.risk_title}
          isLoading={mutation.assignOwner.isPending}
          onConfirm={async (ownerId, reason) => {
            await mutation.assignOwner.mutateAsync({ id: selectedCaseForOwner.id, ownerId, reason });
          }}
        />
      )}

      {selectedCaseForEscalate && (
        <CreateRiskEscalationDialog
          isOpen={Boolean(selectedCaseForEscalate)}
          onClose={() => setSelectedCaseForEscalate(null)}
          riskCaseId={selectedCaseForEscalate.id}
          riskTitle={selectedCaseForEscalate.risk_title}
          onConfirm={async (data) => {
            await mutation.recalculate.mutateAsync();
          }}
        />
      )}
    </main>
  );
}

// ==========================================
// 2. Critical Risk Register / Filtered Views
// ==========================================
export function ExecutiveCriticalRiskRegisterPage({ view }: { view?: string | undefined }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const queryParams: Record<string, unknown> = {};
  if (view && view !== 'register') queryParams.view = view;
  if (selectedModule) queryParams.module = selectedModule;

  const query = useExecutiveCriticalRiskCases(queryParams);
  const mutation = useExecutiveCriticalRiskMutation();

  const [selectedCaseForAck, setSelectedCaseForAck] = useState<ExecutiveRiskCase | null>(null);
  const [selectedCaseForOwner, setSelectedCaseForOwner] = useState<ExecutiveRiskCase | null>(null);

  if (query.isLoading) {
    return <State title="Loading Critical Risk Register" message="Fetching filtered process risk cases." />;
  }
  if (query.isError) {
    return (
      <State
        title="Critical Risk Register Unavailable"
        message="Could not load critical risks for your current role or site context."
        retry={() => void query.refetch()}
      />
    );
  }

  const allRows = query.data?.rows ?? [];
  const filteredRows = searchTerm
    ? allRows.filter((r) =>
        r.risk_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.case_code ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.source_module.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allRows;

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <CriticalRiskSubnav />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">
            {view ? view.replace(/-/g, ' ').toUpperCase() : 'CRITICAL RISK REGISTER'}
          </h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Detailed ledger of all detected high-consequence process safety risks across connected modules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-[var(--psm-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search risks, codes, modules..."
              className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] py-1.5 pl-9 pr-3 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
            />
          </div>

          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-1.5 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
          >
            <option value="">All Source Modules</option>
            <option value="mechanical-integrity">Mechanical Integrity</option>
            <option value="incident">Incident Investigation</option>
            <option value="pha">HAZOP / PHA</option>
            <option value="lopa">LOPA / SIL</option>
            <option value="ptw">PTW / LOTO</option>
            <option value="moc">MOC</option>
            <option value="pssr">PSSR</option>
            <option value="regulatory">Regulatory Register</option>
            <option value="audit">Audit &amp; Assurance</option>
          </select>
        </div>
      </header>

      <RiskTable
        rows={filteredRows}
        onAcknowledge={(c) => setSelectedCaseForAck(c)}
        onAssignOwner={(c) => setSelectedCaseForOwner(c)}
      />

      {selectedCaseForAck && (
        <AcknowledgeCriticalRiskDialog
          isOpen={Boolean(selectedCaseForAck)}
          onClose={() => setSelectedCaseForAck(null)}
          riskTitle={selectedCaseForAck.risk_title}
          isLoading={mutation.acknowledge.isPending}
          onConfirm={async (note) => {
            await mutation.acknowledge.mutateAsync({ id: selectedCaseForAck.id, note });
          }}
        />
      )}

      {selectedCaseForOwner && (
        <AssignExecutiveOwnerDialog
          isOpen={Boolean(selectedCaseForOwner)}
          onClose={() => setSelectedCaseForOwner(null)}
          riskTitle={selectedCaseForOwner.risk_title}
          isLoading={mutation.assignOwner.isPending}
          onConfirm={async (ownerId, reason) => {
            await mutation.assignOwner.mutateAsync({ id: selectedCaseForOwner.id, ownerId, reason });
          }}
        />
      )}
    </main>
  );
}

// ==========================================
// 3. Critical Barriers Page
// ==========================================
export function ExecutiveRiskBarriersPage() {
  const query = useExecutiveCriticalBarriers();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  if (query.isLoading) return <State title="Loading Safety Barriers" message="Auditing safety-critical element health..." />;
  if (query.isError) return <State title="Barriers Unavailable" message="Could not retrieve barrier records." retry={() => void query.refetch()} />;

  const cases = query.data?.rows ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <CriticalRiskSubnav />

      <header>
        <h1 className="text-2xl font-bold text-[var(--psm-text)]">Process Safety Barrier Impairments</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">
          Safety-Critical Elements (SCEs), independent protection layers (IPLs), and interlock overrides currently impaired or overdue.
        </p>
      </header>

      <ExecutiveBarrierStatusChart cases={cases} />
      <RiskTable rows={cases} />
    </main>
  );
}

// ==========================================
// 4. Critical Risk History Page
// ==========================================
export function ExecutiveRiskHistoryPage() {
  const query = useExecutiveCriticalRiskHistory();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  if (query.isLoading) return <State title="Loading Audit History" message="Loading timeline audit log..." />;
  if (query.isError) return <State title="History Unavailable" message="Could not retrieve audit history." retry={() => void query.refetch()} />;

  const events = query.data?.rows ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <CriticalRiskSubnav />

      <header>
        <h1 className="text-2xl font-bold text-[var(--psm-text)]">Critical Risk Decision &amp; Audit Log</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">
          Immutable event log of all executive acknowledgments, ownership changes, verification approvals, and closures.
        </p>
      </header>

      <div className={panel}>
        <div className="space-y-4">
          {events.map((evt, idx) => (
            <div key={String(evt.id ?? idx)} className="flex items-start gap-3 border-b border-[var(--psm-line)] pb-4 last:border-0 last:pb-0">
              <div className="mt-1 rounded-full bg-[var(--psm-primary)]/10 p-1.5 text-[var(--psm-primary)]">
                <Clock size={16} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-[var(--psm-text)]">{String(evt.event_title || evt.event_type)}</h4>
                  <span className="text-xs text-[var(--psm-muted)]">
                    {evt.created_at ? new Date(String(evt.created_at)).toLocaleString() : ''}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-mono text-[var(--psm-muted)]">
                  Event: {String(evt.event_type)} · Actor: {String(evt.actor_user_id ?? 'System')}
                </p>
                {Boolean(evt.after_value_json) && (
                  <pre className="mt-2 overflow-x-auto rounded bg-[var(--psm-surface-2)] p-2 text-[11px] text-[var(--psm-muted)]">
                    {JSON.stringify(evt.after_value_json, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
          {!events.length && (
            <p className="py-8 text-center text-sm text-[var(--psm-muted)]">No historical risk events recorded.</p>
          )}
        </div>
      </div>
    </main>
  );
}

// ==========================================
// 5. 10-Tab Comprehensive Risk Detail View
// ==========================================
export function ExecutiveRiskDetailPage({ id }: { id: string }) {
  const query = useExecutiveCriticalRiskDetail(id);
  const mutation = useExecutiveCriticalRiskMutation();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'source'
    | 'priority'
    | 'actions'
    | 'barriers'
    | 'escalations'
    | 'acknowledgments'
    | 'decisions'
    | 'verification'
    | 'history'
  >('overview');

  // Dialog Controls
  const [showAckDialog, setShowAckDialog] = useState(false);
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);
  const [showCreateActionDialog, setShowCreateActionDialog] = useState(false);
  const [showLinkActionDialog, setShowLinkActionDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);

  if (query.isLoading) return <State title="Loading Risk Case Detail" message="Aggregating source evidence and audit trails..." />;
  if (query.isError || !query.data) {
    return <State title="Risk Case Unavailable" message="This case does not exist or access is restricted." retry={() => void query.refetch()} />;
  }

  const { case: risk, sourceLinks, actionLinks, escalations, acknowledgments, managementDecisions, verification, history } = query.data;

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'source', label: `Sources (${sourceLinks?.length ?? 0})` },
    { key: 'priority', label: 'Prioritization Rationale' },
    { key: 'actions', label: `Linked Actions (${actionLinks?.length ?? 0})` },
    { key: 'barriers', label: 'Safeguards / Barriers' },
    { key: 'escalations', label: `Escalations (${escalations?.length ?? 0})` },
    { key: 'acknowledgments', label: `Acknowledgments (${acknowledgments?.length ?? 0})` },
    { key: 'decisions', label: `Decisions (${managementDecisions?.length ?? 0})` },
    { key: 'verification', label: `Verification (${verification?.length ?? 0})` },
    { key: 'history', label: `Audit Log (${history?.length ?? 0})` },
  ];

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      {/* Back button and case header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/executive/critical-risks/register"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--psm-primary)] hover:underline"
          >
            <ArrowLeft size={14} /> Back to Critical Risk Register
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--psm-text)]">{risk.risk_title}</h1>
            <RiskBadge value={risk.risk_priority || risk.executive_priority || null} />
            <CaseStatusBadge status={risk.case_status} />
            {risk.barrier_impaired && <BarrierBadge impaired={true} />}
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)] font-mono">
            Case Code: {risk.case_code || risk.id} · Module: {risk.source_module} · Detected:{' '}
            {risk.first_detected_at ? new Date(risk.first_detected_at).toLocaleString() : 'N/A'}
          </p>
        </div>

        {/* Action Command Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!risk.acknowledged_at && (
            <button type="button" onClick={() => setShowAckDialog(true)} className={button}>
              <CheckCircle2 size={16} /> Acknowledge
            </button>
          )}
          <button type="button" onClick={() => setShowOwnerDialog(true)} className={buttonSecondary}>
            <UserCheck size={14} /> {risk.executive_owner_user_id ? 'Reassign Owner' : 'Assign Owner'}
          </button>
          <button type="button" onClick={() => setShowCreateActionDialog(true)} className={buttonSecondary}>
            <PlusCircle size={14} /> Create Action
          </button>
          <button type="button" onClick={() => setShowLinkActionDialog(true)} className={buttonSecondary}>
            <Link2 size={14} /> Link Action
          </button>
          <button type="button" onClick={() => setShowVerifyDialog(true)} className={buttonSecondary}>
            <ShieldCheck size={14} /> Request Verification
          </button>
          <button type="button" onClick={() => setShowEscalateDialog(true)} className={buttonSecondary}>
            <AlertTriangle size={14} /> Escalate
          </button>
          {risk.case_status !== 'Closed' && (
            <button
              type="button"
              onClick={() => setShowCloseDialog(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <CheckCircle2 size={14} /> Close Case
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--psm-line)] pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[var(--psm-primary)] text-white shadow-xs'
                : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className={panel}>
            <h3 className="font-bold text-[var(--psm-text)]">Governance &amp; Ownership Summary</h3>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-[var(--psm-muted)]">Executive Owner</dt>
                <dd className="mt-1 font-semibold text-[var(--psm-text)]">
                  {risk.executive_owner_user_id || 'Unassigned'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-[var(--psm-muted)]">Operational Owner</dt>
                <dd className="mt-1 font-semibold text-[var(--psm-text)]">
                  {risk.operational_owner_user_id || 'Not assigned in source module'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-[var(--psm-muted)]">Acknowledgment Status</dt>
                <dd className="mt-1 font-semibold text-[var(--psm-text)]">
                  {risk.acknowledged_at ? `Acknowledged on ${new Date(risk.acknowledged_at).toLocaleDateString()}` : 'Unacknowledged'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-[var(--psm-muted)]">Pending Verifications</dt>
                <dd className="mt-1 font-semibold text-[var(--psm-text)]">
                  {risk.pending_verification_count ?? 0}
                </dd>
              </div>
            </dl>
          </div>

          <div className={panel}>
            <h3 className="font-bold text-[var(--psm-text)]">Operational Source Status</h3>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-[var(--psm-muted)]">Source Module</dt>
                <dd className="mt-1 font-mono font-semibold text-[var(--psm-text)]">{risk.source_module}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-[var(--psm-muted)]">Source Status</dt>
                <dd className="mt-1 font-semibold text-[var(--psm-text)]">{risk.source_status || 'Active'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-[var(--psm-muted)]">Source Severity</dt>
                <dd className="mt-1 font-semibold text-[var(--psm-text)]">{risk.source_severity || 'Critical'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-[var(--psm-muted)]">Source Resolution</dt>
                <dd className="mt-1 font-semibold text-[var(--psm-text)]">
                  {risk.source_resolved_at ? (
                    <span className="text-emerald-500 font-bold">Resolved ({new Date(risk.source_resolved_at).toLocaleDateString()})</span>
                  ) : (
                    <span className="text-rose-500 font-bold">Unresolved in Operational Source</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {/* Tab 2: Sources */}
      {activeTab === 'source' && (
        <section className={panel}>
          <h3 className="font-bold text-[var(--psm-text)]">Connected Source Records &amp; Drilldowns</h3>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Traceability links back to the originating process safety domain record.
          </p>
          <div className="mt-4 space-y-3">
            {sourceLinks?.map((src, i) => (
              <div key={src.id || i} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--psm-primary)]">{src.source_module}</span>
                    <span className="text-xs font-semibold text-[var(--psm-text)]">({src.source_record_type})</span>
                    {src.restricted && <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-500">Restricted</span>}
                  </div>
                  <p className="mt-1 text-sm font-medium text-[var(--psm-text)]">{src.source_title || risk.risk_title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--psm-muted)]">Link ID: {src.source_record_id || 'Masked'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 3: Priority */}
      {activeTab === 'priority' && (
        <section className={panel}>
          <h3 className="font-bold text-[var(--psm-text)]">Executive Prioritization &amp; Severity Assessment</h3>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Deterministic scoring rules applied during source module aggregation.
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg border border-[var(--psm-line)] p-3">
              <span className="font-semibold text-[var(--psm-text)]">Prioritization Score: </span>
              <span className="font-bold text-[var(--psm-primary)]">{risk.prioritization_score ?? 100} / 100</span>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">
                Assigned based on potential for catastrophic loss of primary containment (LOPC) or critical safety barrier failure.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Tab 4: Actions */}
      {activeTab === 'actions' && (
        <section className={panel}>
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <h3 className="font-bold text-[var(--psm-text)]">Universal Corrective &amp; Preventative Actions (CAPA)</h3>
            <button type="button" onClick={() => setShowCreateActionDialog(true)} className={buttonSecondary}>
              <PlusCircle size={14} /> New Action
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {actionLinks?.map((act, i) => (
              <div key={act.id || i} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--psm-muted)]">{act.universal_action_id}</span>
                    {act.required_for_case_closure && (
                      <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                        Required for Closure
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-[var(--psm-text)]">Relationship: {act.relationship_type}</p>
                </div>
              </div>
            ))}
            {!actionLinks?.length && (
              <p className="py-8 text-center text-sm text-[var(--psm-muted)]">No Universal Actions currently linked.</p>
            )}
          </div>
        </section>
      )}

      {/* Tab 5: Safeguards / Barriers */}
      {activeTab === 'barriers' && (
        <section className={panel}>
          <h3 className="font-bold text-[var(--psm-text)]">Process Safety Barrier &amp; Safeguard Health</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] p-4">
              <div>
                <h4 className="font-semibold text-[var(--psm-text)]">Safety Critical Element (SCE) Status</h4>
                <p className="mt-1 text-xs text-[var(--psm-muted)]">
                  {risk.barrier_name || 'Associated Instrument Loop / Relief Device'}
                </p>
              </div>
              <BarrierBadge impaired={Boolean(risk.barrier_impaired)} />
            </div>
          </div>
        </section>
      )}

      {/* Tab 6: Escalations */}
      {activeTab === 'escalations' && (
        <section className={panel}>
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <h3 className="font-bold text-[var(--psm-text)]">Escalations for this Risk Case</h3>
            <button type="button" onClick={() => setShowEscalateDialog(true)} className={buttonSecondary}>
              <AlertTriangle size={14} /> Escalate
            </button>
          </div>
          <div className="mt-4">
            <EscalationTable rows={escalations || []} />
          </div>
        </section>
      )}

      {/* Tab 7: Acknowledgments */}
      {activeTab === 'acknowledgments' && (
        <section className={panel}>
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <h3 className="font-bold text-[var(--psm-text)]">Leadership Acknowledgment Log</h3>
            {!risk.acknowledged_at && (
              <button type="button" onClick={() => setShowAckDialog(true)} className={buttonSecondary}>
                <CheckCircle2 size={14} /> Acknowledge
              </button>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {acknowledgments?.map((ack, i) => (
              <div key={ack.id || i} className="rounded-lg border border-[var(--psm-line)] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[var(--psm-text)]">
                    Acknowledged by: {ack.recipient_user_id}
                  </span>
                  <span className="text-xs text-[var(--psm-muted)]">
                    {new Date(ack.acknowledged_at).toLocaleString()}
                  </span>
                </div>
                {ack.acknowledgment_note && (
                  <p className="mt-2 text-xs italic text-[var(--psm-muted)]">"{ack.acknowledgment_note}"</p>
                )}
              </div>
            ))}
            {!acknowledgments?.length && (
              <p className="py-8 text-center text-sm text-[var(--psm-muted)]">No acknowledgments recorded yet.</p>
            )}
          </div>
        </section>
      )}

      {/* Tab 8: Decisions */}
      {activeTab === 'decisions' && (
        <section className={panel}>
          <h3 className="font-bold text-[var(--psm-text)]">Recorded Management Decisions</h3>
          <div className="mt-4 space-y-3">
            {managementDecisions?.map((dec, i) => (
              <div key={dec.id || i} className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                    {dec.decision_code} · {dec.decision_type}
                  </span>
                  <span className="text-xs text-[var(--psm-muted)]">
                    {new Date(dec.created_at).toLocaleString()}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-bold text-[var(--psm-text)]">{dec.decision_summary}</h4>
                <p className="mt-1 text-xs text-[var(--psm-muted)] leading-relaxed">{dec.decision_rationale}</p>
              </div>
            ))}
            {!managementDecisions?.length && (
              <p className="py-8 text-center text-sm text-[var(--psm-muted)]">No management decisions recorded.</p>
            )}
          </div>
        </section>
      )}

      {/* Tab 9: Verification */}
      {activeTab === 'verification' && (
        <section className={panel}>
          <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
            <h3 className="font-bold text-[var(--psm-text)]">Independent Field Verification</h3>
            <button type="button" onClick={() => setShowVerifyDialog(true)} className={buttonSecondary}>
              <ShieldCheck size={14} /> Request Verification
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {verification?.map((ver, i) => (
              <div key={ver.id || i} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] p-3">
                <div>
                  <span className="rounded bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    {ver.verification_status}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-[var(--psm-text)]">Verifier: {ver.verifier_user_id}</p>
                  {ver.verification_note && (
                    <p className="mt-1 text-xs text-[var(--psm-muted)]">{ver.verification_note}</p>
                  )}
                </div>
                <span className="text-xs text-[var(--psm-muted)]">
                  Requested: {new Date(ver.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
            {!verification?.length && (
              <p className="py-8 text-center text-sm text-[var(--psm-muted)]">No verification records required or requested.</p>
            )}
          </div>
        </section>
      )}

      {/* Tab 10: History */}
      {activeTab === 'history' && (
        <section className={panel}>
          <h3 className="font-bold text-[var(--psm-text)]">Case History &amp; Audit Trail</h3>
          <div className="mt-4 space-y-3">
            {history?.map((h: any, i) => (
              <div key={String(h.id ?? i)} className="border-b border-[var(--psm-line)] pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--psm-text)]">{String(h.event_title || h.event_type || '')}</span>
                  <span className="text-xs text-[var(--psm-muted)]">
                    {h.created_at ? new Date(String(h.created_at)).toLocaleString() : ''}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--psm-muted)]">Actor: {String(h.actor_user_id ?? 'System')}</p>
              </div>
            ))}
            {!history?.length && (
              <p className="py-8 text-center text-sm text-[var(--psm-muted)]">No event history found.</p>
            )}
          </div>
        </section>
      )}

      {/* Dialog Modals */}
      {showAckDialog && (
        <AcknowledgeCriticalRiskDialog
          isOpen={showAckDialog}
          onClose={() => setShowAckDialog(false)}
          riskTitle={risk.risk_title}
          isLoading={mutation.acknowledge.isPending}
          onConfirm={async (note) => {
            await mutation.acknowledge.mutateAsync({ id: risk.id, note });
            await query.refetch();
          }}
        />
      )}

      {showOwnerDialog && (
        <AssignExecutiveOwnerDialog
          isOpen={showOwnerDialog}
          onClose={() => setShowOwnerDialog(false)}
          riskTitle={risk.risk_title}
          isLoading={mutation.assignOwner.isPending}
          onConfirm={async (ownerId, reason) => {
            await mutation.assignOwner.mutateAsync({ id: risk.id, ownerId, reason });
            await query.refetch();
          }}
        />
      )}

      {showCreateActionDialog && (
        <CreateRiskActionDialog
          isOpen={showCreateActionDialog}
          onClose={() => setShowCreateActionDialog(false)}
          riskTitle={risk.risk_title}
          defaultOwnerId={risk.executive_owner_user_id ?? null}
          isLoading={mutation.createAction.isPending}
          onConfirm={async (data) => {
            await mutation.createAction.mutateAsync({ id: risk.id, body: data });
            await query.refetch();
          }}
        />
      )}

      {showLinkActionDialog && (
        <LinkActionDialog
          isOpen={showLinkActionDialog}
          onClose={() => setShowLinkActionDialog(false)}
          riskTitle={risk.risk_title}
          isLoading={mutation.linkAction.isPending}
          onConfirm={async (actionId) => {
            await mutation.linkAction.mutateAsync({ id: risk.id, actionId });
            await query.refetch();
          }}
        />
      )}

      {showVerifyDialog && (
        <RequestVerificationDialog
          isOpen={showVerifyDialog}
          onClose={() => setShowVerifyDialog(false)}
          riskTitle={risk.risk_title}
          isLoading={mutation.requestVerification.isPending}
          onConfirm={async (verifierId, criteria) => {
            await mutation.requestVerification.mutateAsync({ id: risk.id, verifierId, criteria });
            await query.refetch();
          }}
        />
      )}

      {showCloseDialog && (
        <CloseCriticalRiskDialog
          isOpen={showCloseDialog}
          onClose={() => setShowCloseDialog(false)}
          riskTitle={risk.risk_title}
          sourceResolved={Boolean(risk.source_resolved_at)}
          pendingVerifications={Number(risk.pending_verification_count ?? 0)}
          isLoading={mutation.closeCase.isPending}
          onConfirm={async (reason) => {
            await mutation.closeCase.mutateAsync({ id: risk.id, reason });
            await query.refetch();
          }}
        />
      )}

      {showEscalateDialog && (
        <CreateRiskEscalationDialog
          isOpen={showEscalateDialog}
          onClose={() => setShowEscalateDialog(false)}
          riskCaseId={risk.id}
          riskTitle={risk.risk_title}
          onConfirm={async (data) => {
            await query.refetch();
          }}
        />
      )}
    </main>
  );
}
