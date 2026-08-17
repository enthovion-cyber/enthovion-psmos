import type { ChangeEvent } from 'react';
import { PsiCard } from '../../shared/PsiUi';

export function ChemicalExposureHealthSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ [event.target.name]: event.target.type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value });
  return <PsiCard title="5. Exposure / Health" subtitle="OEL, STEL, TWA, IDLH, exposure routes, toxicity, CMR flags, sensitizer, and first aid."><div className="grid gap-3 md:grid-cols-2">{['oel_value','oel_unit','oel_source','oel_not_available_reason','twa_value','stel_value','ceiling_value','idlh_value','exposure_routes_json','acute_toxicity_summary','chronic_toxicity_summary','first_aid_summary'].map((name) => <Field key={name} name={name} label={label(name)} value={value[name]} onChange={change} />)}{['carcinogen_flag','mutagen_flag','reproductive_toxicity_flag','sensitizer_flag'].map((name) => <label key={name} className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name={name} checked={Boolean(value[name])} onChange={change} /> {label(name)}</label>)}</div></PsiCard>;
}
function label(name: string) { return name.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()); }
function Field({ label, ...props }: any) { return <label className="space-y-1 text-sm font-semibold">{label}<input {...props} value={props.value ?? ''} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>; }
