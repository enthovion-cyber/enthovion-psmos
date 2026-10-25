'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Sliders,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Play,
  RotateCcw,
  Plus,
} from 'lucide-react';
import {
  useExecutiveTrendAlerts,
  useExecutiveTrendAlertRules,
  useExecutiveTrendMutations,
} from '../hooks/useExecutiveTrends';
import {
  ExecutiveTrendsNav,
  ExecutiveTrendsHeader,
  ExecutiveDataQualityNotice,
} from './ExecutiveTrendsShared';
import {
  TrendAlertSeverityBadge,
  TrendAlertStatusBadge,
} from './ExecutiveTrendBadges';
import {
  CreateTrendAlertRuleDialog,
  AcknowledgeTrendAlertDialog,
  ResolveTrendAlertDialog,
} from './ExecutiveTrendDialogs';
import type { ExecutiveTrendAlert } from '../types/executive-trend.types';

export function ExecutiveTrendAlertsPage({ isRulesView = false }: { isRulesView?: boolean }) {
  const [tab, setTab] = useState<'alerts' | 'rules'>(isRulesView ? 'rules' : 'alerts');
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [selectedAlertForAck, setSelectedAlertForAck] = useState<ExecutiveTrendAlert | null>(null);
  const [selectedAlertForResolve, setSelectedAlertForResolve] = useState<ExecutiveTrendAlert | null>(null);

  const alertsQuery = useExecutiveTrendAlerts();
  const rulesQuery = useExecutiveTrendAlertRules();
  const mutations = useExecutiveTrendMutations();

  const alerts = alertsQuery.data?.rows ?? [];
  const rules = rulesQuery.data?.rows ?? [];

  return (
    <main className="space-y-6">
      <ExecutiveTrendsHeader
        title={tab === 'alerts' ? 'Active Trend Degradation Alerts' : 'Executive Trend Alert Rules'}
        subtitle="Automated statistical threshold alerts and worsening trend notifications with SLA cooldown periods."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab(tab === 'alerts' ? 'rules' : 'alerts')}
              className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-xs font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]"
            >
              {tab === 'alerts' ? 'Manage Rules' : 'View Active Alerts'}
            </button>
            <button
              onClick={() => setIsCreateRuleOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--psm-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"
            >
              <Plus size={14} />
              <span>New Alert Rule</span>
            </button>
          </div>
        }
      />

      <ExecutiveTrendsNav />
      <ExecutiveDataQualityNotice />

      {tab === 'alerts' ? (
        /* Alerts List */
        <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--psm-text)] border-b border-[var(--psm-line)] pb-3">
            Triggered Trend Alerts ({alerts.length})
          </h3>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--psm-line)] text-[var(--psm-muted)]">
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Alert Title</th>
                  <th className="py-2.5 px-3">Triggered Metric</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Triggered At</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {alerts.length > 0 ? (
                  alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-[var(--psm-surface-2)]">
                      <td className="py-3 px-3">
                        <TrendAlertSeverityBadge severity={a.severity} />
                      </td>
                      <td className="py-3 px-3 font-semibold text-[var(--psm-text)]">
                        {a.alert_title}
                        {a.alert_message && (
                          <p className="text-[11px] font-normal text-[var(--psm-muted)]">{a.alert_message}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[var(--psm-muted)]">{a.metric_key}</td>
                      <td className="py-3 px-3">
                        <TrendAlertStatusBadge status={a.alert_status} />
                      </td>
                      <td className="py-3 px-3 text-[var(--psm-muted)]">
                        {new Date(a.triggered_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.alert_status === 'Triggered' && (
                            <button
                              onClick={() => setSelectedAlertForAck(a)}
                              className="rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[11px] font-semibold text-blue-400 hover:bg-blue-500/20"
                            >
                              Acknowledge
                            </button>
                          )}
                          {a.alert_status === 'Acknowledged' && (
                            <button
                              onClick={() => setSelectedAlertForResolve(a)}
                              className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-500 hover:bg-emerald-500/20"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[var(--psm-muted)]">
                      No active alerts triggered. All metrics are currently performing within normal parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        /* Rules List */
        <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--psm-text)] border-b border-[var(--psm-line)] pb-3">
            Configured Executive Alert Rules ({rules.length})
          </h3>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--psm-line)] text-[var(--psm-muted)]">
                  <th className="py-2.5 px-3">Rule Name</th>
                  <th className="py-2.5 px-3">Metric Key</th>
                  <th className="py-2.5 px-3">Condition & Threshold</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Cooldown</th>
                  <th className="py-2.5 px-3 text-right">Test Dry-Run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--psm-line)]">
                {rules.length > 0 ? (
                  rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-[var(--psm-surface-2)]">
                      <td className="py-3 px-3 font-semibold text-[var(--psm-text)]">{rule.rule_title}</td>
                      <td className="py-3 px-3 text-[var(--psm-muted)]">{rule.metric_key}</td>
                      <td className="py-3 px-3 text-[var(--psm-text)]">
                        {rule.condition_operator} {rule.threshold_value} ({rule.consecutive_periods} periods)
                      </td>
                      <td className="py-3 px-3">
                        <TrendAlertSeverityBadge severity={rule.severity} />
                      </td>
                      <td className="py-3 px-3 text-[var(--psm-muted)]">{rule.cooldown_days} days</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => mutations.testAlertRule.mutate(rule.id)}
                          disabled={mutations.testAlertRule.isPending}
                          className="rounded border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--psm-text)] hover:opacity-80 disabled:opacity-50"
                        >
                          Dry Run
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[var(--psm-muted)]">
                      No alert rules configured yet. Click "New Alert Rule" to define monitoring criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Dialogs */}
      <CreateTrendAlertRuleDialog
        isOpen={isCreateRuleOpen}
        onClose={() => setIsCreateRuleOpen(false)}
      />
      <AcknowledgeTrendAlertDialog
        isOpen={Boolean(selectedAlertForAck)}
        onClose={() => setSelectedAlertForAck(null)}
        alert={selectedAlertForAck}
      />
      <ResolveTrendAlertDialog
        isOpen={Boolean(selectedAlertForResolve)}
        onClose={() => setSelectedAlertForResolve(null)}
        alert={selectedAlertForResolve}
      />
    </main>
  );
}
