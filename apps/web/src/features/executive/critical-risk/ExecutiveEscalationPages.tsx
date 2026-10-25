'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Play,
  PlusCircle,
  Search,
  ShieldAlert,
  Sliders,
  User,
  UserCheck,
} from 'lucide-react';
import {
  useExecutiveEscalationDetail,
  useExecutiveEscalationMutation,
  useExecutiveEscalationRules,
  useExecutiveEscalations,
} from '../hooks/useExecutiveCriticalRisk';
import {
  EscalationSubnav,
  EscalationTable,
  RiskBadge,
  State,
  button,
  buttonSecondary,
  panel,
} from './CriticalRiskShared';
import { ExecutiveEscalationSlaChart } from '../components/charts';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import {
  AdvanceEscalationDialog,
  CancelEscalationDialog,
  CreateRiskEscalationDialog,
  EscalationRuleDialog,
  ReassignEscalationDialog,
  RecordManagementDecisionDialog,
} from '../dialogs';
import type { ExecutiveEscalation, ExecutiveEscalationRule } from '../types/executive-critical-risk.types';
import { executiveCriticalRiskApi } from '../services/executive-critical-risk.service';

// ==========================================
// 1. Escalations Overview Cockpit
// ==========================================
export function ExecutiveEscalationOverviewPage() {
  const query = useExecutiveEscalations();
  const mutation = useExecutiveEscalationMutation();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  // Quick Action Dialog State
  const [selectedEscForAdvance, setSelectedEscForAdvance] = useState<ExecutiveEscalation | null>(null);
  const [selectedEscForCancel, setSelectedEscForCancel] = useState<ExecutiveEscalation | null>(null);
  const [showCreateEscDialog, setShowCreateEscDialog] = useState(false);

  if (query.isLoading) return <State title="Loading Escalations" message="Retrieving active process risk escalations..." />;
  if (query.isError || !query.data) {
    return <State title="Escalations Unavailable" message="Could not retrieve escalation records." retry={() => void query.refetch()} />;
  }

  const escalations = query.data.rows ?? [];
  const activeEscalations = escalations.filter((e) => !['Closed', 'Cancelled', 'Superseded'].includes(e.escalation_status));
  const breachedCount = activeEscalations.filter((e) => {
    if (!e.response_due_at && !e.due_at) return false;
    return new Date(e.response_due_at || e.due_at || '').getTime() < Date.now();
  }).length;
  const execLevelCount = activeEscalations.filter((e) => Number(e.escalation_level) >= 4).length;
  const unackCount = activeEscalations.filter((e) => !e.acknowledged_at).length;

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <EscalationSubnav />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={24} />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--psm-text)]">
              Process Safety Escalation Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Multi-tier leadership escalation workflows, SLAs, and management decisions for safety-critical events.
          </p>
        </div>

        <button type="button" onClick={() => setShowCreateEscDialog(true)} className={button}>
          <PlusCircle size={16} /> New Escalation
        </button>
      </header>

      {/* Summary KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`${panel} border-amber-500/30 bg-amber-500/5`}>
          <p className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">Active Escalations</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">{activeEscalations.length}</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Open management escalations</p>
        </div>
        <div className={`${panel} border-rose-500/30 bg-rose-500/5`}>
          <p className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-400">SLA Breached</p>
          <p className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-400">{breachedCount}</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Overdue leadership response</p>
        </div>
        <div className={`${panel} border-purple-500/30 bg-purple-500/5`}>
          <p className="text-xs font-semibold uppercase text-purple-600 dark:text-purple-400">Level 4 / 5 Escalations</p>
          <p className="mt-2 text-3xl font-extrabold text-purple-600 dark:text-purple-400">{execLevelCount}</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Corporate &amp; Executive leadership level</p>
        </div>
        <div className={panel}>
          <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Unacknowledged</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--psm-text)]">{unackCount}</p>
          <p className="mt-1 text-[11px] text-amber-500 font-semibold">Awaiting recipient signoff</p>
        </div>
      </section>

      {/* SLA & Velocity Chart */}
      <ExecutiveEscalationSlaChart escalations={escalations} />

      {/* Escalation Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--psm-text)]">Active Escalation Queue</h2>
          <span className="text-xs text-[var(--psm-muted)]">{activeEscalations.length} active escalations</span>
        </div>
        <EscalationTable
          rows={activeEscalations}
          onAcknowledge={async (e) => {
            await mutation.acknowledge.mutateAsync({ id: e.id });
          }}
          onAdvanceLevel={(e) => setSelectedEscForAdvance(e)}
        />
      </section>

      {/* Dialogs */}
      {showCreateEscDialog && (
        <CreateRiskEscalationDialog
          isOpen={showCreateEscDialog}
          onClose={() => setShowCreateEscDialog(false)}
          onConfirm={async (data) => {
            await mutation.create.mutateAsync(data);
          }}
        />
      )}

      {selectedEscForAdvance && (
        <AdvanceEscalationDialog
          isOpen={Boolean(selectedEscForAdvance)}
          onClose={() => setSelectedEscForAdvance(null)}
          escalationCode={selectedEscForAdvance.escalation_code}
          currentLevel={Number(selectedEscForAdvance.escalation_level)}
          isLoading={mutation.advanceLevel.isPending}
          onConfirm={async (reason) => {
            await mutation.advanceLevel.mutateAsync({ id: selectedEscForAdvance.id, reason });
          }}
        />
      )}
    </main>
  );
}

// ==========================================
// 2. Filterable Escalations Register Page
// ==========================================
export function ExecutiveEscalationRegisterPage({ view }: { view?: string | undefined }) {
  const [searchTerm, setSearchTerm] = useState('');
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const queryParams: Record<string, unknown> = {};
  if (view && view !== 'register') queryParams.view = view;

  const query = useExecutiveEscalations(queryParams);

  if (query.isLoading) return <State title="Loading Escalations" message="Fetching escalations..." />;
  if (query.isError) return <State title="Register Unavailable" message="Could not retrieve escalations." retry={() => void query.refetch()} />;

  const allRows = query.data?.rows ?? [];
  const filteredRows = searchTerm
    ? allRows.filter((r) =>
        r.escalation_reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.escalation_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.recipient_user_id ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allRows;

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <EscalationSubnav />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">
            {view ? view.replace(/-/g, ' ').toUpperCase() : 'ESCALATION REGISTER'}
          </h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Complete record of leadership escalations, status transitions, and response timers.
          </p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-[var(--psm-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search escalations, codes..."
            className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] py-1.5 pl-9 pr-3 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none"
          />
        </div>
      </header>

      <EscalationTable rows={filteredRows} />
    </main>
  );
}

// ==========================================
// 3. Escalation Rules & Policy Configuration
// ==========================================
export function ExecutiveEscalationRulesPage() {
  const query = useExecutiveEscalationRules();
  const mutation = useExecutiveEscalationMutation();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const [selectedRuleForEdit, setSelectedRuleForEdit] = useState<ExecutiveEscalationRule | null>(null);
  const [showCreateRuleDialog, setShowCreateRuleDialog] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [isDryRunning, setIsDryRunning] = useState(false);

  if (query.isLoading) return <State title="Loading Escalation Rules" message="Fetching policy rules..." />;
  if (query.isError) return <State title="Rules Unavailable" message="Could not retrieve escalation rules." retry={() => void query.refetch()} />;

  const rules = query.data ?? [];

  const handleDryRun = async (rule: ExecutiveEscalationRule) => {
    setIsDryRunning(true);
    try {
      const res = await executiveCriticalRiskApi.dryRunRule({
        triggerConfiguration: { priority: rule.priority_level },
        siteId: rule.site_id,
      });
      setDryRunResult({ ruleTitle: rule.rule_title, ...res });
    } finally {
      setIsDryRunning(false);
    }
  };

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <EscalationSubnav />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Escalation Policy Rules &amp; Automation</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Define automated rules that trigger multi-tier leadership escalations when safety barriers fail or actions breach SLAs.
          </p>
        </div>

        <button type="button" onClick={() => setShowCreateRuleDialog(true)} className={button}>
          <PlusCircle size={16} /> New Policy Rule
        </button>
      </header>

      {/* Dry Run Simulation Output Banner if active */}
      {dryRunResult && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sky-600 dark:text-sky-400">
              Rule Simulation Result: "{dryRunResult.ruleTitle}"
            </h4>
            <button
              type="button"
              onClick={() => setDryRunResult(null)}
              className="text-xs text-[var(--psm-muted)] hover:underline"
            >
              Dismiss
            </button>
          </div>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Simulated at {new Date(dryRunResult.evaluatedAt).toLocaleTimeString()}. Matched{' '}
            <strong>{dryRunResult.matchedCases?.length ?? 0} active risk cases</strong> that would trigger an escalation under current parameters.
          </p>
        </div>
      )}

      {/* Rules Table */}
      <div className={`${panel} overflow-x-auto`}>
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]">
            <tr>
              <th className="pb-3 font-semibold">Rule Code &amp; Title</th>
              <th className="pb-3 font-semibold">Trigger Event</th>
              <th className="pb-3 font-semibold">Priority</th>
              <th className="pb-3 font-semibold">Level</th>
              <th className="pb-3 font-semibold">Recipient Role / User</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rules.map((rule) => (
              <tr key={rule.id} className="transition hover:bg-[var(--psm-surface-2)]/30">
                <td className="py-3.5 pr-3">
                  <div className="font-mono text-xs font-bold text-[var(--psm-muted)]">{rule.rule_code}</div>
                  <div className="mt-0.5 font-medium text-[var(--psm-text)]">{rule.rule_title}</div>
                </td>
                <td className="py-3.5 pr-3 text-xs text-[var(--psm-text)]">{rule.trigger_type}</td>
                <td className="py-3.5 pr-3">
                  <RiskBadge value={rule.priority_level} />
                </td>
                <td className="py-3.5 pr-3">
                  <span className="rounded bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs font-bold text-[var(--psm-text)]">
                    Level {rule.escalation_level}
                  </span>
                </td>
                <td className="py-3.5 pr-3 text-xs">
                  {rule.recipient_role || rule.recipient_user_id || 'System Default'}
                </td>
                <td className="py-3.5 pr-3">
                  {rule.active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--psm-muted)]">Archived</span>
                  )}
                </td>
                <td className="py-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      disabled={isDryRunning}
                      onClick={() => handleDryRun(rule)}
                      className={buttonSecondary}
                      title="Simulate rule against current live risks"
                    >
                      <Play size={12} /> Dry Run
                    </button>
                    {!rule.approved_at && (
                      <button
                        type="button"
                        onClick={async () => {
                          await mutation.approveRule.mutateAsync(rule.id);
                        }}
                        className={buttonSecondary}
                        title="Approve Policy Rule"
                      >
                        Approve
                      </button>
                    )}
                    {rule.active && (
                      <button
                        type="button"
                        onClick={async () => {
                          await mutation.archiveRule.mutateAsync({ id: rule.id, reason: 'Archived by administrator' });
                        }}
                        className={buttonSecondary}
                        title="Archive Rule"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rules.length && (
          <p className="py-8 text-center text-sm text-[var(--psm-muted)]">No escalation rules configured yet.</p>
        )}
      </div>

      {showCreateRuleDialog && (
        <EscalationRuleDialog
          isOpen={showCreateRuleDialog}
          onClose={() => setShowCreateRuleDialog(false)}
          isLoading={mutation.saveRule.isPending}
          onConfirm={async (data) => {
            await mutation.saveRule.mutateAsync({ body: data });
          }}
        />
      )}
    </main>
  );
}

// ==========================================
// 4. Escalation Detail Page
// ==========================================
export function ExecutiveEscalationDetailPage({ id }: { id: string }) {
  const query = useExecutiveEscalationDetail(id);
  const mutation = useExecutiveEscalationMutation();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  // Action Dialogs
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCloseReason, setShowCloseReason] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  if (query.isLoading) return <State title="Loading Escalation" message="Retrieving escalation timeline and decisions..." />;
  if (query.isError || !query.data) return <State title="Escalation Unavailable" message="Escalation record not found." retry={() => void query.refetch()} />;

  const { escalation, events, managementDecisions } = query.data;

  const handleClose = async () => {
    if (!closeReason.trim()) return;
    await mutation.close.mutateAsync({ id: escalation.id, reason: closeReason.trim() });
    setShowCloseReason(false);
    await query.refetch();
  };

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/executive/escalations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--psm-primary)] hover:underline"
          >
            <ArrowLeft size={14} /> Back to Escalation Management
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--psm-text)]">{escalation.escalation_reason}</h1>
            <span className="rounded-md bg-purple-500/15 px-2.5 py-0.5 text-xs font-bold text-purple-700 dark:text-purple-400">
              Level {escalation.escalation_level}
            </span>
            <RiskBadge value={escalation.priority} />
            <span className="rounded-full bg-[var(--psm-surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--psm-text)]">
              {escalation.escalation_status}
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-[var(--psm-muted)]">
            Code: {escalation.escalation_code} · Created: {new Date(escalation.created_at).toLocaleString()}
          </p>
        </div>

        {/* Command Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!escalation.acknowledged_at && (
            <button
              type="button"
              onClick={async () => {
                await mutation.acknowledge.mutateAsync({ id: escalation.id });
                await query.refetch();
              }}
              className={button}
            >
              <CheckCircle2 size={16} /> Acknowledge
            </button>
          )}
          <button type="button" onClick={() => setShowDecisionDialog(true)} className={buttonSecondary}>
            <FileText size={14} /> Record Decision
          </button>
          <button type="button" onClick={() => setShowAdvanceDialog(true)} className={buttonSecondary}>
            <ArrowUpRight size={14} /> Advance Level
          </button>
          <button type="button" onClick={() => setShowReassignDialog(true)} className={buttonSecondary}>
            <UserCheck size={14} /> Reassign
          </button>
          <button type="button" onClick={() => setShowCancelDialog(true)} className={buttonSecondary}>
            <Ban size={14} /> Cancel
          </button>
          {escalation.escalation_status !== 'Closed' && (
            <button
              type="button"
              onClick={() => setShowCloseReason(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <CheckCircle2 size={14} /> Close Escalation
            </button>
          )}
        </div>
      </div>

      {/* Inline Close Prompt if active */}
      {showCloseReason && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
          <h4 className="font-bold text-sm text-[var(--psm-text)]">Close Escalation Confirmation</h4>
          <p className="text-xs text-[var(--psm-muted)]">
            Confirm that the underlying source condition or critical risk case has been adequately resolved or managed.
          </p>
          <textarea
            rows={2}
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
            placeholder="Closure rationale..."
            className="w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2 text-xs text-[var(--psm-text)]"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCloseReason(false)} className={buttonSecondary}>
              Cancel
            </button>
            <button type="button" onClick={handleClose} className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
              Confirm Close
            </button>
          </div>
        </div>
      )}

      {/* Escalation Meta */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={panel}>
          <h3 className="font-bold text-[var(--psm-text)]">Assignment &amp; Response SLA</h3>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-[var(--psm-muted)]">Escalated To</dt>
              <dd className="mt-1 font-semibold text-[var(--psm-text)]">
                {escalation.escalated_to_user_id || escalation.recipient_user_id || 'Unassigned'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-[var(--psm-muted)]">Escalation Role</dt>
              <dd className="mt-1 font-semibold text-[var(--psm-text)]">
                {escalation.escalated_to_role || 'Designated Safety Lead'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-[var(--psm-muted)]">Response Due</dt>
              <dd className="mt-1 font-semibold text-[var(--psm-text)]">
                {escalation.response_due_at || escalation.due_at
                  ? new Date(escalation.response_due_at || escalation.due_at || '').toLocaleString()
                  : 'No SLA specified'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-[var(--psm-muted)]">Trigger Event</dt>
              <dd className="mt-1 font-semibold text-[var(--psm-text)]">{escalation.trigger_type || 'Manual'}</dd>
            </div>
          </dl>
        </div>

        <div className={panel}>
          <h3 className="font-bold text-[var(--psm-text)]">Management Decisions Recorded</h3>
          <div className="mt-4 space-y-3">
            {managementDecisions?.map((dec) => (
              <div key={dec.id} className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{dec.decision_code}</span>
                  <span className="text-[var(--psm-muted)]">{new Date(dec.created_at).toLocaleString()}</span>
                </div>
                <h4 className="mt-1 font-bold text-[var(--psm-text)]">{dec.decision_summary}</h4>
                <p className="mt-1 text-[var(--psm-muted)]">{dec.decision_rationale}</p>
              </div>
            ))}
            {!managementDecisions?.length && (
              <p className="py-6 text-center text-xs text-[var(--psm-muted)]">No management decisions recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Audit Timeline */}
      <section className={panel}>
        <h3 className="font-bold text-[var(--psm-text)]">Escalation Audit Trail</h3>
        <div className="mt-4 space-y-4">
          {events?.map((evt) => (
            <div key={evt.id} className="flex items-start gap-3 border-b border-[var(--psm-line)] pb-3 last:border-0 last:pb-0">
              <div className="mt-1 rounded-full bg-[var(--psm-primary)]/10 p-1 text-[var(--psm-primary)]">
                <Clock size={14} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[var(--psm-text)]">{evt.event_title || evt.event_type}</h4>
                  <span className="text-[11px] text-[var(--psm-muted)]">{new Date(evt.created_at).toLocaleString()}</span>
                </div>
                {evt.event_description && <p className="mt-1 text-xs text-[var(--psm-muted)]">{evt.event_description}</p>}
                <p className="mt-0.5 text-[10px] font-mono text-[var(--psm-muted)]">Actor: {evt.actor_user_id}</p>
              </div>
            </div>
          ))}
          {!events?.length && (
            <p className="py-6 text-center text-xs text-[var(--psm-muted)]">No timeline events recorded.</p>
          )}
        </div>
      </section>

      {/* Dialog Modals */}
      {showDecisionDialog && (
        <RecordManagementDecisionDialog
          isOpen={showDecisionDialog}
          onClose={() => setShowDecisionDialog(false)}
          escalationReason={escalation.escalation_reason}
          isLoading={mutation.recordDecision.isPending}
          onConfirm={async (data) => {
            await mutation.recordDecision.mutateAsync({ id: escalation.id, body: data });
            await query.refetch();
          }}
        />
      )}

      {showAdvanceDialog && (
        <AdvanceEscalationDialog
          isOpen={showAdvanceDialog}
          onClose={() => setShowAdvanceDialog(false)}
          escalationCode={escalation.escalation_code}
          currentLevel={Number(escalation.escalation_level)}
          isLoading={mutation.advanceLevel.isPending}
          onConfirm={async (reason) => {
            await mutation.advanceLevel.mutateAsync({ id: escalation.id, reason });
            await query.refetch();
          }}
        />
      )}

      {showReassignDialog && (
        <ReassignEscalationDialog
          isOpen={showReassignDialog}
          onClose={() => setShowReassignDialog(false)}
          escalationCode={escalation.escalation_code}
          currentRecipient={escalation.escalated_to_user_id || escalation.recipient_user_id || null}
          isLoading={mutation.reassign.isPending}
          onConfirm={async (recipientUserId) => {
            await mutation.reassign.mutateAsync({ id: escalation.id, recipientUserId });
            await query.refetch();
          }}
        />
      )}

      {showCancelDialog && (
        <CancelEscalationDialog
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          escalationCode={escalation.escalation_code}
          isLoading={mutation.cancel.isPending}
          onConfirm={async (reason) => {
            await mutation.cancel.mutateAsync({ id: escalation.id, reason });
            await query.refetch();
          }}
        />
      )}
    </main>
  );
}
