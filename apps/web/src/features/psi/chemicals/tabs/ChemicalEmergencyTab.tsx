import { PsiCard } from '../../shared/PsiUi';
import type { PsiChemicalDetail } from '../../types/psi-chemical.types';

export function ChemicalEmergencyTab({ detail }: { detail: PsiChemicalDetail }) {
  const e = detail.emergencyControls ?? {};
  const fields = ['required_ppe_json','respiratory_protection','glove_requirement','eye_face_protection','protective_clothing','spill_response_summary','fire_response_summary','suitable_extinguishing_media','unsuitable_extinguishing_media','special_firefighting_hazards','emergency_response_notes','waste_disposal_notes'];
  return <PsiCard title="PPE / Emergency Response" subtitle="PPE and response controls used by PTW, HAZOP, training, audit, and PSSR readiness."><div className="grid gap-3 md:grid-cols-3">{fields.map((field) => <Info key={field} label={label(field)} value={Array.isArray(e[field]) ? e[field].join(', ') : e[field] ?? 'Missing'} />)}</div></PsiCard>;
}
function label(name: string) { return name.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()); }
function Info({ label, value }: { label: string; value: unknown }) { return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">{label}</p><p className="mt-1 text-sm">{String(value)}</p></div>; }
