import type { PlanSectionProps } from '../../types/inspection-plan.types';

export function PlanCmlScopeSection({ value, onChange }: PlanSectionProps) {
  const cmlScope = value.cmlScope ?? {};
  const patch = (next: Record<string, unknown>) => onChange({ cmlScope: { ...cmlScope, ...next } });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-bold text-[var(--psm-text)]">CML / TML Scope</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <select value={String(cmlScope.scopeMode ?? 'none')} onChange={(e) => patch({ scopeMode: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-[var(--psm-text)]"><option value="none">No CML scope</option><option value="all_active">All active CMLs</option><option value="selected">Selected CMLs</option><option value="component_type">By component type</option><option value="damage_mechanism">By damage mechanism</option><option value="lowest_remaining_life">Lowest remaining life</option></select>
        <label className="flex items-center gap-2 text-sm text-[var(--psm-text)]"><input type="checkbox" checked={!!cmlScope.includeAllActiveCmls} onChange={(e) => patch({ includeAllActiveCmls: e.target.checked })} /> Include future active CML/TML points by policy</label>
        <input value={String(cmlScope.componentTypeFilter ?? '')} onChange={(e) => patch({ componentTypeFilter: e.target.value })} placeholder="Component type filter" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <input value={String(cmlScope.damageMechanismFilter ?? '')} onChange={(e) => patch({ damageMechanismFilter: e.target.value })} placeholder="Damage mechanism filter" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
      </div>
      <p className="mt-3 text-xs text-[var(--psm-muted)]">Selected CML/TML points are backend-validated against the same equipment and stored as a revisioned scope snapshot.</p>
    </section>
  );
}
