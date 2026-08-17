import type { MiInspectionPlanDetail } from '../../types/inspection-plan.types';

export function InspectionPlanScopeTab({ detail }: { detail: MiInspectionPlanDetail }) {
  const scope = detail.scope ?? {};
  const cml = detail.cmlScope ?? {};
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Inspection Scope" items={[['Scope statement', scope.scope_statement], ['Boundaries', scope.inspection_boundaries], ['Special precautions', scope.special_safety_precautions], ['PTW required', scope.ptw_required ? 'Yes' : 'No'], ['Shutdown required', scope.shutdown_required ? 'Yes' : 'No'], ['Entry required', scope.entry_required ? 'Yes' : 'No']]} />
      <Panel title="CML / TML Scope" items={[['Scope mode', cml.scope_mode], ['All active CMLs', cml.include_all_active_cmls ? 'Yes' : 'No'], ['Component filter', cml.component_type_filter], ['Damage mechanism', cml.damage_mechanism_filter], ['Selected CMLs', Array.isArray(cml.selected_cml_ids_json) ? cml.selected_cml_ids_json.length : 0]]} />
    </div>
  );
}

function Panel({ title, items }: { title: string; items: Array<[string, unknown]> }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h2 className="font-bold text-[var(--psm-text)]">{title}</h2><dl className="mt-3 space-y-2">{items.map(([label, value]) => <div key={label} className="flex justify-between gap-3 text-sm"><dt className="text-[var(--psm-muted)]">{label}</dt><dd className="text-right font-semibold text-[var(--psm-text)]">{String(value ?? 'Not set')}</dd></div>)}</dl></div>;
}
