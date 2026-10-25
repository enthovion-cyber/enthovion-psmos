'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Search,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import {
  useExecutiveCriticalRiskMutation,
  useExecutiveLeadershipAttention,
} from '../hooks/useExecutiveCriticalRisk';
import {
  LeadershipSubnav,
  RiskTable,
  State,
  button,
  panel,
} from './CriticalRiskShared';
import {
  ExecutiveAlertDonutChart,
  ExecutiveBarrierStatusChart,
  ExecutiveEscalationSlaChart,
} from '../components/charts';
import { ExecutiveOverviewNavigation } from '../components/ExecutiveOverview';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import {
  AcknowledgeCriticalRiskDialog,
  AssignExecutiveOwnerDialog,
  CreateRiskEscalationDialog,
} from '../dialogs';
import type { ExecutiveRiskCase } from '../types/executive-critical-risk.types';

// ==========================================
// 1. Leadership Attention Unified Cockpit
// ==========================================
export function ExecutiveLeadershipAttentionPage() {
  const query = useExecutiveLeadershipAttention();
  const mutation = useExecutiveCriticalRiskMutation();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const [selectedCaseForAck, setSelectedCaseForAck] = useState<ExecutiveRiskCase | null>(null);
  const [selectedCaseForOwner, setSelectedCaseForOwner] = useState<ExecutiveRiskCase | null>(null);
  const [selectedCaseForEscalate, setSelectedCaseForEscalate] = useState<ExecutiveRiskCase | null>(null);

  if (query.isLoading) return <State title="Loading Leadership Cockpit" message="Evaluating high-priority leadership attention items..." />;
  if (query.isError || !query.data) {
    return <State title="Leadership Attention Unavailable" message="Could not compile leadership review data." retry={() => void query.refetch()} />;
  }

  const data = query.data;
  const items = data.attention ?? [];

  const chartAlerts = items.map((a) => ({
    severity: a.risk_priority ?? a.executive_priority ?? 'Critical',
    title: a.risk_title,
    due_date: a.source_due_at || null,
  }));

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <LeadershipSubnav />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500" size={24} />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--psm-text)]">
              Executive Leadership Decision Cockpit
            </h1>
          </div>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">
            Prioritized operational risks and safeguards demanding leadership decisions, resource allocation, or escalation.
          </p>
        </div>
      </header>

      {/* Summary Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`${panel} border-rose-500/30 bg-rose-500/5`}>
          <p className="text-xs font-semibold uppercase text-rose-600 dark:text-rose-400">Total Attention Items</p>
          <p className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-400">{items.length}</p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Active high-consequence items</p>
        </div>
        <div className={`${panel} border-amber-500/30 bg-amber-500/5`}>
          <p className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">Unacknowledged</p>
          <p className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {items.filter((i) => !i.acknowledged_at).length}
          </p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Awaiting executive acknowledgment</p>
        </div>
        <div className={`${panel} border-purple-500/30 bg-purple-500/5`}>
          <p className="text-xs font-semibold uppercase text-purple-600 dark:text-purple-400">Awaiting Verification</p>
          <p className="mt-2 text-3xl font-extrabold text-purple-600 dark:text-purple-400">
            {items.filter((i) => Number(i.pending_verification_count ?? 0) > 0).length}
          </p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Field verification signoffs needed</p>
        </div>
        <div className={panel}>
          <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Safeguards Impaired</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--psm-text)]">
            {items.filter((i) => i.barrier_impaired).length}
          </p>
          <p className="mt-1 text-[11px] text-[var(--psm-muted)]">Impaired SCE barriers</p>
        </div>
      </section>

      {/* Visual Risk Charts */}
      {chartAlerts.length > 0 && (
        <section className="grid gap-6 lg:grid-cols-2">
          <ExecutiveAlertDonutChart alerts={chartAlerts} />
          <ExecutiveBarrierStatusChart cases={items} />
        </section>
      )}

      {/* Action Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--psm-text)]">Priority Leadership Review Queue</h2>
          <span className="text-xs text-[var(--psm-muted)]">{items.length} items requiring review</span>
        </div>
        <RiskTable
          rows={items}
          onAcknowledge={(c) => setSelectedCaseForAck(c)}
          onAssignOwner={(c) => setSelectedCaseForOwner(c)}
          onEscalate={(c) => setSelectedCaseForEscalate(c)}
        />
      </section>

      {/* Dialogs */}
      {selectedCaseForAck && (
        <AcknowledgeCriticalRiskDialog
          isOpen={Boolean(selectedCaseForAck)}
          onClose={() => setSelectedCaseForAck(null)}
          riskTitle={selectedCaseForAck.risk_title}
          isLoading={mutation.acknowledge.isPending}
          onConfirm={async (note) => {
            await mutation.acknowledge.mutateAsync({ id: selectedCaseForAck.id, note });
            await query.refetch();
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
            await query.refetch();
          }}
        />
      )}

      {selectedCaseForEscalate && (
        <CreateRiskEscalationDialog
          isOpen={Boolean(selectedCaseForEscalate)}
          onClose={() => setSelectedCaseForEscalate(null)}
          riskCaseId={selectedCaseForEscalate.id}
          riskTitle={selectedCaseForEscalate.risk_title}
          onConfirm={async () => {
            await query.refetch();
          }}
        />
      )}
    </main>
  );
}

// ==========================================
// 2. Decisions Required Queue
// ==========================================
export function ExecutiveLeadershipDecisionsRequiredPage() {
  const query = useExecutiveLeadershipAttention();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  if (query.isLoading) return <State title="Loading Decision Queue" message="Compiling items requiring leadership decision..." />;
  if (query.isError || !query.data) {
    return <State title="Decisions Queue Unavailable" message="Could not compile decision items." retry={() => void query.refetch()} />;
  }

  const items = (query.data.attention ?? []).filter(
    (i) => i.case_status === 'Management Decision Pending' || Number(i.pending_verification_count ?? 0) > 0
  );

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <LeadershipSubnav />

      <header>
        <h1 className="text-2xl font-bold text-[var(--psm-text)]">Management Decisions Required</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">
          Open process risks requiring formal executive signoff, resource authorization, or variance approval.
        </p>
      </header>

      <RiskTable rows={items} />
    </main>
  );
}

// ==========================================
// 3. Unacknowledged Items Queue
// ==========================================
export function ExecutiveLeadershipUnacknowledgedPage() {
  const query = useExecutiveLeadershipAttention();
  const mutation = useExecutiveCriticalRiskMutation();
  const permissions = useMyPermissions();
  const granted = new Set(permissions.data ?? []);

  const [selectedCaseForAck, setSelectedCaseForAck] = useState<ExecutiveRiskCase | null>(null);

  if (query.isLoading) return <State title="Loading Unacknowledged Items" message="Fetching unacknowledged risk cases..." />;
  if (query.isError || !query.data) {
    return <State title="Unacknowledged Items Unavailable" message="Could not compile items." retry={() => void query.refetch()} />;
  }

  const items = (query.data.attention ?? []).filter((i) => !i.acknowledged_at);

  return (
    <main className="space-y-6">
      <ExecutiveOverviewNavigation permissions={granted} />
      <LeadershipSubnav />

      <header>
        <h1 className="text-2xl font-bold text-[var(--psm-text)]">Unacknowledged Critical Risks</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">
          Newly detected critical risks and safeguard impairments awaiting formal leadership acknowledgment.
        </p>
      </header>

      <RiskTable rows={items} onAcknowledge={(c) => setSelectedCaseForAck(c)} />

      {selectedCaseForAck && (
        <AcknowledgeCriticalRiskDialog
          isOpen={Boolean(selectedCaseForAck)}
          onClose={() => setSelectedCaseForAck(null)}
          riskTitle={selectedCaseForAck.risk_title}
          isLoading={mutation.acknowledge.isPending}
          onConfirm={async (note) => {
            await mutation.acknowledge.mutateAsync({ id: selectedCaseForAck.id, note });
            await query.refetch();
          }}
        />
      )}
    </main>
  );
}
