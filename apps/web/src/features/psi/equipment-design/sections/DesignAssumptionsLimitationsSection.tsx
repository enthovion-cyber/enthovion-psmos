import { PsiCard } from '../../shared/PsiUi';

const c = 'rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm';
const fields = ['original_design_assumptions','process_assumptions','mechanical_assumptions','utility_assumptions','environmental_assumptions','chemical_assumptions','corrosion_assumptions','operating_limitations','known_restrictions','temporary_restrictions','exclusions','design_basis_uncertainty','required_verification','required_future_study','engineering_notes'];

export function DesignAssumptionsLimitationsSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="7. Design Assumptions / Limitations" subtitle="Assumptions, limitations, restrictions, uncertainties, verification needs, future studies, engineering notes, and MOC-on-change policy.">
    <div className="grid gap-3 md:grid-cols-2">
      {fields.map((field) => <textarea key={field} value={value[field] ?? ''} onChange={(e) => onChange({ [field]: e.target.value })} placeholder={field.replace(/_/g, ' ')} className={`${c} min-h-20`} />)}
      <label className={`${c} flex items-center gap-2`}><input type="checkbox" checked={value.moc_required_on_change !== false} onChange={(e) => onChange({ moc_required_on_change: e.target.checked })} /> MOC required on change</label>
    </div>
  </PsiCard>;
}
