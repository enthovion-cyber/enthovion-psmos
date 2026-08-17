import type { ChangeEvent } from 'react';
import { PsiCard } from '../../shared/PsiUi';

export function ChemicalHazardClassificationSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  const change = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange({ [event.target.name]: event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value });
  return (
    <PsiCard title="4. Hazard Classification" subtitle="GHS, NFPA, HMIS, high-hazard and PSM/RMP threshold foundation.">
      <div className="grid gap-3 md:grid-cols-2">
        <Text name="ghs_hazard_classes_json" label="GHS hazard classes" value={value.ghs_hazard_classes_json} onChange={change} />
        <Text name="ghs_categories_json" label="GHS categories" value={value.ghs_categories_json} onChange={change} />
        <Text name="pictograms_json" label="Pictograms" value={value.pictograms_json} onChange={change} />
        <Select name="signal_word" label="Signal word" value={value.signal_word} options={['Danger', 'Warning', 'None']} onChange={change} />
        <Text name="hazard_statements_json" label="Hazard statements" value={value.hazard_statements_json} onChange={change} />
        <Text name="precautionary_statements_json" label="Precautionary statements" value={value.precautionary_statements_json} onChange={change} />
        <Field name="nfpa_health" label="NFPA health" type="number" value={value.nfpa_health} onChange={change} />
        <Field name="nfpa_fire" label="NFPA fire" type="number" value={value.nfpa_fire} onChange={change} />
        <Field name="nfpa_reactivity" label="NFPA reactivity" type="number" value={value.nfpa_reactivity} onChange={change} />
        <Field name="nfpa_special" label="NFPA special" value={value.nfpa_special} onChange={change} />
        <Field name="hmis_health" label="HMIS health" type="number" value={value.hmis_health} onChange={change} />
        <Field name="hmis_flammability" label="HMIS flammability" type="number" value={value.hmis_flammability} onChange={change} />
        <Field name="hmis_physical_hazard" label="HMIS physical hazard" type="number" value={value.hmis_physical_hazard} onChange={change} />
        <Text name="hazard_summary" label="Hazard summary" value={value.hazard_summary} onChange={change} />
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="high_hazard" checked={Boolean(value.high_hazard)} onChange={change} /> High hazard</label>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="psm_threshold_flag" checked={Boolean(value.psm_threshold_flag)} onChange={change} /> PSM threshold flag</label>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="rmp_threshold_flag" checked={Boolean(value.rmp_threshold_flag)} onChange={change} /> RMP threshold flag</label>
      </div>
    </PsiCard>
  );
}

function Field({ label, ...props }: any) { return <label className="space-y-1 text-sm font-semibold">{label}<input {...props} value={props.value ?? ''} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>; }
function Text({ label, ...props }: any) { return <label className="space-y-1 text-sm font-semibold">{label}<textarea {...props} value={Array.isArray(props.value) ? props.value.join(', ') : props.value ?? ''} rows={2} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>; }
function Select({ label, options, ...props }: any) { return <label className="space-y-1 text-sm font-semibold">{label}<select {...props} value={props.value ?? ''} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><option value="">Select</option>{options.map((option: string) => <option key={option}>{option}</option>)}</select></label>; }
