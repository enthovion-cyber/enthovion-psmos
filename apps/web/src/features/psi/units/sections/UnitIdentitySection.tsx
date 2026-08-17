import type { ChangeEvent } from 'react';
import { PsiCard } from '../../shared/PsiUi';

type Props = { 
  value: Record<string, any>; 
  lookups?: Record<string, string[]> | undefined; 
  onChange: (patch: Record<string, any>) => void 
};

export function UnitIdentitySection({ value, lookups, onChange }: Props) {
  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
    onChange({ [event.target.name]: event.target.value });

  // Safely extract arrays with strong fallbacks
  const unitTypes = Array.isArray(lookups?.unitTypes) && lookups.unitTypes.length ? lookups.unitTypes : [
    'Reaction unit',
    'Distillation unit',
    'Storage unit',
    'Utility unit',
    'Waste treatment unit',
    'Loading/unloading unit',
    'Compression unit',
    'Refrigeration unit',
    'Boiler/steam unit',
    'Custom'
  ];
  const unitStatuses = Array.isArray(lookups?.unitStatuses) ? lookups.unitStatuses : ['Draft'];

  return (
    <PsiCard title="1. Unit Identity" subtitle="Core identity for the PSI process unit profile.">
      <div className="grid gap-3 md:grid-cols-2">
        <Field name="unit_name" label="Unit name" value={value.unit_name} onChange={change} required />
        <Field name="unit_code" label="Unit code" value={value.unit_code} onChange={change} required />
        
        <label className="space-y-1 text-sm font-semibold">
          Unit type
          <select name="unit_type" value={value.unit_type ?? 'Custom'} onChange={change} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2">
            <option value="">Select unit type</option>
            {unitTypes.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        
        <label className="space-y-1 text-sm font-semibold md:col-span-2">
          Description
          <textarea name="description" value={value.description ?? ''} onChange={change} rows={3} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" />
        </label>
        
        <label className="space-y-1 text-sm font-semibold">
          Status
          <select name="operating_status" value={value.operating_status ?? 'Draft'} onChange={change} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2">
            {unitStatuses.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        
        <Field name="commissioning_date" label="Commissioning date" type="date" value={value.commissioning_date} onChange={change} />
      </div>
    </PsiCard>
  );
}

function Field({ label, required, ...props }: any) {
  return (
    <label className="space-y-1 text-sm font-semibold">
      {label}{required ? ' *' : ''}
      <input {...props} value={props.value ?? ''} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" />
    </label>
  );
}
