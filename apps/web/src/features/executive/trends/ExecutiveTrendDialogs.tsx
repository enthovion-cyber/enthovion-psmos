'use client';

import React, { useState } from 'react';
import { X, Loader2, Play, CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight, BookmarkPlus, HelpCircle } from 'lucide-react';
import { useExecutiveTrendMutations, useExecutiveTrendLookups } from '../hooks/useExecutiveTrends';
import type { ExecutiveRepeatIssue, ExecutiveRecurringCluster, ExecutiveTrendAlert, ExecutiveTrendInsight } from '../types/executive-trend.types';

const inputCls = 'mt-1 block w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-sm text-[var(--psm-text)] focus:border-[var(--psm-primary)] focus:outline-none';
const labelCls = 'text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]';

export function CreateTrendRunDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const mutations = useExecutiveTrendMutations();
  const lookups = useExecutiveTrendLookups();

  const [runTitle, setRunTitle] = useState('');
  const [source, setSource] = useState('psm-health');
  const [metricKey, setMetricKey] = useState('overall_psm_health_index');
  const [granularity, setGranularity] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Quarterly'>('Monthly');
  const [scopeType, setScopeType] = useState('Company');
  const [siteId, setSiteId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [justification, setJustification] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutations.createRun.mutateAsync({
      runTitle: runTitle.trim() || undefined,
      source,
      metricKey: metricKey || undefined,
      granularity,
      scopeType,
      siteId: siteId || undefined,
      startAt: startAt || undefined,
      endAt: endAt || undefined,
      justification: justification.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <div className="flex items-center gap-2">
            <Play className="text-[var(--psm-primary)]" size={18} />
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Generate Historical Trend Run</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Run Title (Optional)</label>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Q3 2026 Process Safety Health Trend Review"
              value={runTitle}
              onChange={(e) => setRunTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Source Category</label>
              <select
                className={inputCls}
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  if (e.target.value === 'psm-health') setMetricKey('overall_psm_health_index');
                  else if (e.target.value === 'critical-risks') setMetricKey('active_critical_risks');
                  else if (e.target.value === 'overdue-actions') setMetricKey('overdue_actions_count');
                  else if (e.target.value === 'escalations') setMetricKey('sla_breach_rate');
                }}
              >
                <option value="psm-health">Overall PSM Health</option>
                <option value="module-health">Module Health Scoring</option>
                <option value="kpis">Core KPI Aggregate</option>
                <option value="critical-risks">Critical Risk Backlog</option>
                <option value="overdue-actions">Overdue Action Aging</option>
                <option value="escalations">Executive Escalation SLAs</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Granularity</label>
              <select
                className={inputCls}
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as any)}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Scope Level</label>
              <select
                className={inputCls}
                value={scopeType}
                onChange={(e) => setScopeType(e.target.value)}
              >
                <option value="Company">Entire Company (Enterprise)</option>
                <option value="Site">Specific Site</option>
              </select>
            </div>

            {scopeType === 'Site' && (
              <div>
                <label className={labelCls}>Site ID</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Enter Site UUID or Identifier"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date (Optional)</label>
              <input
                type="date"
                className={inputCls}
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>End Date (Optional)</label>
              <input
                type="date"
                className={inputCls}
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Methodological Justification</label>
            <textarea
              className={inputCls}
              rows={2}
              placeholder="State reason for calculation (e.g. quarterly executive review preparation, repeat issue baseline check)."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </div>

          <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-muted)]">
            <span className="font-semibold text-[var(--psm-text)]">Data Quality Guarantee:</span> Trend runs are strictly immutable. No points will be fabricated or backfilled from current records. Periods with missing data are flagged as Insufficient History.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.createRun.isPending}
              className="flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {mutations.createRun.isPending && <Loader2 size={16} className="animate-spin" />}
              {mutations.createRun.isPending ? 'Executing Run...' : 'Execute Trend Run'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ConfirmRepeatIssueDialog({
  isOpen,
  onClose,
  issue,
}: {
  isOpen: boolean;
  onClose: () => void;
  issue: ExecutiveRepeatIssue | null;
}) {
  const mutations = useExecutiveTrendMutations();
  const [rationale, setRationale] = useState('');
  const [severity, setSeverity] = useState('High');

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rationale.trim()) return;
    await mutations.reviewRepeat.mutateAsync({
      candidateId: issue.id,
      dto: {
        reviewStatus: 'Confirmed',
        reviewNotes: rationale.trim(),
        severityClassification: severity,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-rose-500" size={18} />
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Confirm Repeat Safety Weakness</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
          <p className="font-bold">{issue.repeat_title}</p>
          <p className="mt-1">
            Detected {issue.occurrence_count} occurrences across {issue.psm_module_code || 'system'} with similarity score {issue.similarity_score}%.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Reviewer Confirmation Rationale (Required)</label>
            <textarea
              className={inputCls}
              rows={3}
              required
              placeholder="State why this constitutes a recurring process safety failure and what leadership focus is required..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Executive Severity</label>
            <select
              className={inputCls}
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="Critical">Critical (Direct Barrier Failure)</option>
              <option value="High">High (Chronic Degradation)</option>
              <option value="Medium">Medium (Operational Non-conformance)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.reviewRepeat.isPending}
              className="flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
            >
              {mutations.reviewRepeat.isPending && <Loader2 size={16} className="animate-spin" />}
              Confirm Repeat Weakness
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RejectRepeatIssueDialog({
  isOpen,
  onClose,
  issue,
}: {
  isOpen: boolean;
  onClose: () => void;
  issue: ExecutiveRepeatIssue | null;
}) {
  const mutations = useExecutiveTrendMutations();
  const [reason, setReason] = useState('False Positive');
  const [notes, setNotes] = useState('');

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;
    await mutations.reviewRepeat.mutateAsync({
      candidateId: issue.id,
      dto: {
        reviewStatus: 'False Positive',
        reviewNotes: `[${reason}] ${notes.trim()}`,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <h3 className="text-lg font-bold text-[var(--psm-text)]">Dismiss Candidate Repeat Issue</h3>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Dismissal Reason</label>
            <select
              className={inputCls}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="False Positive">False Positive Match (Different Technical Mechanism)</option>
              <option value="Distinct Equipment">Distinct Equipment / Operating Context</option>
              <option value="Resolved Prior to Window">Prior Occurrences Fully Redesigned</option>
              <option value="Acceptable Variance">Acceptable Operational Variance</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Explanation & Evidence (Required)</label>
            <textarea
              className={inputCls}
              rows={3}
              required
              placeholder="Provide engineering justification for why these occurrences do not represent a systemic recurring fault..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.reviewRepeat.isPending}
              className="flex items-center gap-2 rounded-md bg-zinc-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-600 disabled:opacity-50"
            >
              {mutations.reviewRepeat.isPending && <Loader2 size={16} className="animate-spin" />}
              Mark as Dismissed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateRepeatActionDialog({
  isOpen,
  onClose,
  issue,
}: {
  isOpen: boolean;
  onClose: () => void;
  issue: ExecutiveRepeatIssue | null;
}) {
  const mutations = useExecutiveTrendMutations();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('High');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    await mutations.createRepeatAction.mutateAsync({
      candidateId: issue.id,
      dto: {
        actionTitle: title.trim(),
        priority,
        dueDate,
        assignedTo: assignedTo || undefined,
        description: notes.trim() || undefined,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="text-[var(--psm-primary)]" size={18} />
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Link Action in Universal Action Engine</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Corrective Action Title</label>
            <input
              type="text"
              className={inputCls}
              required
              placeholder={`CAPA for ${issue.repeat_title}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Priority</label>
              <select
                className={inputCls}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input
                type="date"
                className={inputCls}
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Scope Context</label>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              This action will link to occurrences across {issue.psm_module_code ?? 'Enterprise'} and establish CAPA tracking to prevent recurrence.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.createRepeatAction.isPending}
              className="flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {mutations.createRepeatAction.isPending && <Loader2 size={16} className="animate-spin" />}
              Create & Link Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateTrendAlertRuleDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const mutations = useExecutiveTrendMutations();
  const [ruleTitle, setRuleTitle] = useState('');
  const [metricKey, setMetricKey] = useState('overall_psm_health_index');
  const [conditionOperator, setConditionOperator] = useState('below_threshold');
  const [thresholdValue, setThresholdValue] = useState(70);
  const [consecutivePeriods, setConsecutivePeriods] = useState(2);
  const [severity, setSeverity] = useState('Warning');
  const [cooldownDays, setCooldownDays] = useState(7);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleTitle.trim()) return;
    await mutations.createAlertRule.mutateAsync({
      ruleTitle: ruleTitle.trim(),
      metricKey,
      conditionOperator,
      thresholdValue: Number(thresholdValue),
      consecutivePeriods: Number(consecutivePeriods),
      severity,
      cooldownDays: Number(cooldownDays),
      isEnabled: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={18} />
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Create Executive Trend Alert Rule</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Rule Title</label>
            <input
              type="text"
              className={inputCls}
              required
              placeholder="e.g. Critical Risk Escalation SLA Breach Rule"
              value={ruleTitle}
              onChange={(e) => setRuleTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Monitored Metric</label>
              <select
                className={inputCls}
                value={metricKey}
                onChange={(e) => setMetricKey(e.target.value)}
              >
                <option value="overall_psm_health_index">Overall PSM Health Index</option>
                <option value="critical_risks">Active Critical Risks</option>
                <option value="overdue_actions">Overdue PSM Actions</option>
                <option value="escalation_sla_breaches">Escalation SLA Breaches</option>
                <option value="repeat_issues_count">Repeat Safety Issues</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Trigger Condition</label>
              <select
                className={inputCls}
                value={conditionOperator}
                onChange={(e) => setConditionOperator(e.target.value)}
              >
                <option value="below_threshold">Drops Below Threshold</option>
                <option value="above_threshold">Exceeds Threshold</option>
                <option value="consecutive_worsening">Consecutive Degradation (N periods)</option>
                <option value="repeat_spike">Sudden Spike (&gt;30%)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Threshold Value</label>
              <input
                type="number"
                className={inputCls}
                value={thresholdValue}
                onChange={(e) => setThresholdValue(Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelCls}>Consecutive Periods</label>
              <input
                type="number"
                className={inputCls}
                min={1}
                max={12}
                value={consecutivePeriods}
                onChange={(e) => setConsecutivePeriods(Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelCls}>Severity</label>
              <select
                className={inputCls}
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="Critical">Critical</option>
                <option value="Warning">Warning</option>
                <option value="Watch">Watch</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Cooldown Period (Days)</label>
            <input
              type="number"
              className={inputCls}
              min={1}
              max={90}
              value={cooldownDays}
              onChange={(e) => setCooldownDays(Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-[var(--psm-muted)]">
              Suppresses duplicate notifications for this rule within the specified timeframe.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.createAlertRule.isPending}
              className="flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {mutations.createAlertRule.isPending && <Loader2 size={16} className="animate-spin" />}
              Save Alert Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AcknowledgeTrendAlertDialog({
  isOpen,
  onClose,
  alert,
}: {
  isOpen: boolean;
  onClose: () => void;
  alert: ExecutiveTrendAlert | null;
}) {
  const mutations = useExecutiveTrendMutations();
  const [notes, setNotes] = useState('');

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutations.acknowledgeAlert.mutateAsync({
      alertId: alert.id,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <h3 className="text-lg font-bold text-[var(--psm-text)]">Acknowledge Trend Alert</h3>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-sm font-semibold text-[var(--psm-text)]">{alert.alert_title}</p>
          <div>
            <label className={labelCls}>Acknowledgment Notes (Optional)</label>
            <textarea
              className={inputCls}
              rows={3}
              placeholder="Record operational awareness or initial containment actions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.acknowledgeAlert.isPending}
              className="flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {mutations.acknowledgeAlert.isPending && <Loader2 size={16} className="animate-spin" />}
              Confirm Acknowledgment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ResolveTrendAlertDialog({
  isOpen,
  onClose,
  alert,
}: {
  isOpen: boolean;
  onClose: () => void;
  alert: ExecutiveTrendAlert | null;
}) {
  const mutations = useExecutiveTrendMutations();
  const [resolutionNotes, setResolutionNotes] = useState('');

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return;
    await mutations.resolveAlert.mutateAsync({
      alertId: alert.id,
      resolutionNotes: resolutionNotes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <h3 className="text-lg font-bold text-[var(--psm-text)]">Resolve Trend Alert</h3>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-sm font-semibold text-[var(--psm-text)]">{alert.alert_title}</p>
          <div>
            <label className={labelCls}>Resolution Summary & Evidence (Required)</label>
            <textarea
              className={inputCls}
              rows={3}
              required
              placeholder="State corrective action, engineering barrier restoration, or SLA compliance proof..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.resolveAlert.isPending}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
            >
              {mutations.resolveAlert.isPending && <Loader2 size={16} className="animate-spin" />}
              Mark as Resolved
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddToManagementReviewDialog({
  isOpen,
  onClose,
  target,
  targetType,
}: {
  isOpen: boolean;
  onClose: () => void;
  target: any;
  targetType: 'repeat' | 'cluster' | 'insight';
}) {
  const mutations = useExecutiveTrendMutations();
  const [agendaTopic, setAgendaTopic] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');

  if (!isOpen || !target) return null;

  const title = target.repeat_title || target.cluster_title || target.insight_title || 'Trend Issue';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetType === 'repeat') {
      await mutations.addToManagementReview.mutateAsync({
        candidateId: target.id,
        notes: executiveSummary || undefined,
      });
    } else if (targetType === 'cluster') {
      await mutations.addClusterToManagementReview.mutateAsync(target.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] pb-3">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="text-[var(--psm-primary)]" size={18} />
            <h3 className="text-lg font-bold text-[var(--psm-text)]">Refer to Management Review Agenda</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelCls}>Item Reference</label>
            <p className="mt-1 text-sm font-semibold text-[var(--psm-text)]">{title}</p>
          </div>

          <div>
            <label className={labelCls}>Executive Governance Rationale</label>
            <textarea
              className={inputCls}
              rows={3}
              placeholder="State why this item warrants senior leadership attention during the upcoming Management Review cycle..."
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--psm-line)] px-4 py-2 text-sm text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutations.addToManagementReview.isPending || mutations.addClusterToManagementReview.isPending}
              className="flex items-center gap-2 rounded-md bg-[var(--psm-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              Add to Leadership Agenda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
