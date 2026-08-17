import type { ChangeEvent } from 'react';
import { PsiCard } from '../../shared/PsiUi';

export function ChemicalIdentitySection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: Record<string, string[]> | undefined; onChange: (patch: Record<string, any>) => void }) {
  const change = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange({ [event.target.name]: event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value });
  return (
    <PsiCard title="1. Chemical Identity" subtitle="Canonical chemical data can be linked, but PSI stores the unit-specific chemical use snapshot.">
      <div className="grid gap-3 md:grid-cols-2">
        <Field name="chemical_name" label="Chemical name" value={value.chemical_name} onChange={change} required />
        <Field name="common_name" label="Common name / synonym" value={value.common_name} onChange={change} />
        <Field name="cas_number" label="CAS number" value={value.cas_number} onChange={change} />
        <Field name="cas_unknown_reason" label="CAS unknown reason" value={value.cas_unknown_reason} onChange={change} />
        <Field name="formula" label="Formula" value={value.formula} onChange={change} />
        <Field name="molecular_weight" label="Molecular weight" value={value.molecular_weight} onChange={change} />
        <Select name="physical_state" label="Physical state" value={value.physical_state} options={lookups?.physicalStates ?? []} onChange={change} />
        <Select name="chemical_category" label="Chemical category" value={value.chemical_category} options={lookups?.chemicalCategories ?? []} onChange={change} />
        <Field name="purity_concentration" label="Purity / concentration" value={value.purity_concentration} onChange={change} />
        <Field name="chemical_database_id" label="Chemical Database record ID" value={value.chemical_database_id} onChange={change} />
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="is_mixture" checked={Boolean(value.is_mixture)} onChange={change} /> Mixture</label>
        <Field name="mixture_description" label="Mixture description" value={value.mixture_description} onChange={change} />
      </div>
    </PsiCard>
  );
}

function Field({ label, required, ...props }: any) { return <label className="space-y-1 text-sm font-semibold">{label}{required ? ' *' : ''}<input {...props} value={props.value ?? ''} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>; }
function Select({ label, options, ...props }: any) { return <label className="space-y-1 text-sm font-semibold">{label}<select {...props} value={props.value ?? ''} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><option value="">Select</option>{options.map((option: string) => <option key={option}>{option}</option>)}</select></label>; }
