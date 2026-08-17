'use client';

import { useSchedulerRules } from '../hooks/useSchedulerRules';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { SchedulerRuleForm } from './SchedulerRuleForm';

export function SchedulerRulesPage() {
  const { rules, create } = useSchedulerRules();
  if (rules.isLoading) return <MiLoadingSkeleton rows={6} />;
  return <div className="space-y-5"><div><h1 className="text-2xl font-bold text-[var(--psm-text)]">Inspection Scheduler Rules</h1><p className="text-sm text-[var(--psm-muted)]">Company/site configurable maximum intervals, half-life, due-soon, and critical-overdue thresholds.</p></div><SchedulerRuleForm onSubmit={(input) => create.mutate(input)} saving={create.isPending} /><div className="grid gap-3">{rules.data?.map((rule) => <div key={rule.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="font-bold text-[var(--psm-text)]">{rule.rule_name}</div><div className="text-sm text-[var(--psm-muted)]">Max interval: {rule.maximum_interval_value} {rule.maximum_interval_unit} - Version {rule.version}</div></div>)}</div></div>;
}
