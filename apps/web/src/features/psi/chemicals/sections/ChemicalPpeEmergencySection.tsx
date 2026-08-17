import type { ChangeEvent } from 'react';
import { PsiCard } from '../../shared/PsiUi';

export function ChemicalPpeEmergencySection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ [event.target.name]: event.target.value });
  const fields = ['required_ppe_json','respiratory_protection','glove_requirement','eye_face_protection','protective_clothing','spill_response_summary','fire_response_summary','suitable_extinguishing_media','unsuitable_extinguishing_media','special_firefighting_hazards','emergency_response_notes','waste_disposal_notes'];
  return <PsiCard title="7. PPE / Emergency Response" subtitle="PPE, spill/fire response, firefighting media, emergency notes, and waste/disposal controls for PTW, HAZOP, training, audit, and PSSR readiness."><div className="grid gap-3 md:grid-cols-2">{fields.map((name) => <Field key={name} name={name} label={label(name)} value={value[name]} onChange={change} />)}</div></PsiCard>;
}
function label(name: string) { return name.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()); }
function Field({ label, ...props }: any) { return <label className="space-y-1 text-sm font-semibold">{label}<textarea {...props} value={Array.isArray(props.value) ? props.value.join(', ') : props.value ?? ''} rows={2} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>; }
