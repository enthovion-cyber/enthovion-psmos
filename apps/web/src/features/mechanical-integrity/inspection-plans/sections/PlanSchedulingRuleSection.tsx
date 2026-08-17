import type { PlanSectionProps } from '../../types/inspection-plan.types';

export function PlanSchedulingRuleSection({ value, onChange }: PlanSectionProps) {
  const schedule = value.schedule ?? {};
  const patch = (next: Record<string, unknown>) => onChange({ schedule: { ...schedule, ...next } });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-bold text-[var(--psm-text)]">Frequency / Scheduling Rule</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <select value={String(schedule.schedulingMode ?? 'Fixed calendar interval')} onChange={(e) => patch({ schedulingMode: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-[var(--psm-text)]"><option>Fixed calendar interval</option><option>Remaining-life based</option><option>Half-life rule based</option><option>Company/site rule based</option><option>Manual due date override</option><option>One-time inspection</option></select>
        <input type="number" value={String(schedule.frequencyValue ?? '')} onChange={(e) => patch({ frequencyValue: e.target.value })} placeholder="Frequency value" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <select value={String(schedule.frequencyUnit ?? 'Months')} onChange={(e) => patch({ frequencyUnit: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-[var(--psm-text)]"><option>Days</option><option>Weeks</option><option>Months</option><option>Years</option><option>Operating hours foundation</option><option>Cycles foundation</option></select>
        <input type="date" value={String(schedule.lastInspectionDate ?? '')} onChange={(e) => patch({ lastInspectionDate: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <input type="date" value={String(schedule.manualOverrideDueDate ?? '')} onChange={(e) => patch({ manualOverrideDueDate: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <input value={String(schedule.manualOverrideReason ?? '')} onChange={(e) => patch({ manualOverrideReason: e.target.value })} placeholder="Manual override reason" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <label className="flex items-center gap-2 text-sm text-[var(--psm-text)]"><input type="checkbox" checked={schedule.schedulerActive !== false} onChange={(e) => patch({ schedulerActive: e.target.checked })} /> Scheduler active</label>
      </div>
    </section>
  );
}
