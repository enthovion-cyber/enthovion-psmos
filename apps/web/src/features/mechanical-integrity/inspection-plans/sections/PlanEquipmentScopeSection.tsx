import type { PlanSectionProps } from '../../types/inspection-plan.types';

export function PlanEquipmentScopeSection({ value, onChange }: PlanSectionProps) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-bold text-[var(--psm-text)]">Equipment Scope</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input value={value.equipmentId ?? ''} onChange={(e) => onChange({ equipmentId: e.target.value })} placeholder="Equipment ID or selected equipment" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <input value={value.criticalityBasis ?? ''} onChange={(e) => onChange({ criticalityBasis: e.target.value })} placeholder="Criticality basis" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
      </div>
      <p className="mt-3 text-xs text-[var(--psm-muted)]">Backend validates company/site/equipment access, technical-data completeness, active CML count, and critical equipment plan blockers.</p>
    </section>
  );
}
