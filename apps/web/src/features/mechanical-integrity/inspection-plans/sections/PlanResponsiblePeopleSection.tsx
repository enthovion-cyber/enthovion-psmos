import type { PlanSectionProps } from '../../types/inspection-plan.types';

export function PlanResponsiblePeopleSection({ value, onChange }: PlanSectionProps) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-bold text-[var(--psm-text)]">Responsible People</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <input value={value.responsibleDepartmentId ?? ''} onChange={(e) => onChange({ responsibleDepartmentId: e.target.value })} placeholder="Responsible department" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <input value={value.responsibleTeamId ?? ''} onChange={(e) => onChange({ responsibleTeamId: e.target.value })} placeholder="Responsible team" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <input value={value.responsibleUserId ?? ''} onChange={(e) => onChange({ responsibleUserId: e.target.value })} placeholder="Responsible inspector / engineer" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <label className="flex items-center gap-2 text-sm text-[var(--psm-text)]"><input type="checkbox" checked={!!value.vendorRequired} onChange={(e) => onChange({ vendorRequired: e.target.checked })} /> External vendor required</label>
        <input value={value.vendorName ?? ''} onChange={(e) => onChange({ vendorName: e.target.value })} placeholder="Vendor name" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
      </div>
    </section>
  );
}
