import type { PlanSectionProps } from '../../types/inspection-plan.types';

const bools = ['internalInspectionRequired','externalInspectionRequired','onlineInspectionAllowed','shutdownRequired','entryRequired','confinedSpaceRequired','isolationRequired','ptwRequired','lotoRequired','ndtRequired','scaffoldingRequired','insulationRemovalRequired','cleaningRequired'];

export function PlanInspectionScopeSection({ value, onChange }: PlanSectionProps) {
  const scope = value.scope ?? {};
  const patch = (next: Record<string, unknown>) => onChange({ scope: { ...scope, ...next } });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-bold text-[var(--psm-text)]">Inspection Scope</h2>
      <div className="mt-3 grid gap-3">
        <textarea value={String(scope.scopeStatement ?? '')} onChange={(e) => patch({ scopeStatement: e.target.value })} placeholder="Inspection scope statement" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <textarea value={String(scope.inspectionBoundaries ?? '')} onChange={(e) => patch({ inspectionBoundaries: e.target.value })} placeholder="Boundaries, included/excluded components, coverage" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{bools.map((field) => <label key={field} className="flex items-center gap-2 text-sm text-[var(--psm-text)]"><input type="checkbox" checked={!!scope[field]} onChange={(e) => patch({ [field]: e.target.checked })} /> {field.replace(/[A-Z]/g, (m) => ` ${m}`).trim()}</label>)}</div>
        <textarea value={String(scope.specialSafetyPrecautions ?? '')} onChange={(e) => patch({ specialSafetyPrecautions: e.target.value })} placeholder="Special safety precautions" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-[var(--psm-text)]" />
      </div>
    </section>
  );
}
