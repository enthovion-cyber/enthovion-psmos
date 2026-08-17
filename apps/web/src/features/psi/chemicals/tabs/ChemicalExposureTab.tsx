import { PsiCard } from '../../shared/PsiUi';
import type { PsiChemicalDetail } from '../../types/psi-chemical.types';

export function ChemicalExposureTab({ detail }: { detail: PsiChemicalDetail }) {
  const e = detail.exposureHealth ?? {};
  const fields = ['oel_value','oel_unit','oel_source','oel_not_available_reason','twa_value','stel_value','ceiling_value','idlh_value','exposure_routes_json','acute_toxicity_summary','chronic_toxicity_summary','carcinogen_flag','mutagen_flag','reproductive_toxicity_flag','sensitizer_flag','first_aid_summary'];
  return <PsiCard title="Exposure / Health" subtitle="Exposure limits, toxicity, routes of exposure, CMR flags, sensitizer, and first aid summary."><div className="grid gap-3 md:grid-cols-3">{fields.map((field) => <Info key={field} label={label(field)} value={Array.isArray(e[field]) ? e[field].join(', ') : e[field] ?? 'Missing'} />)}</div></PsiCard>;
}
function label(name: string) { return name.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()); }
function Info({ label, value }: { label: string; value: unknown }) { return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">{label}</p><p className="mt-1 text-sm">{String(value)}</p></div>; }
