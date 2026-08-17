import { CompatibilityRiskBadge } from '../../shared/CompatibilityRiskBadge';
import { PsiCard } from '../../shared/PsiUi';
import type { PsiChemicalDetail } from '../../types/psi-chemical.types';
import { CompatibilityWarningPanel } from '../CompatibilityWarningPanel';

export function ChemicalCompatibilityTab({ detail }: { detail: PsiChemicalDetail }) {
  const s = detail.storageCompatibility ?? {};
  const fields = ['storage_class','compatible_storage_group','incompatible_chemicals_json','incompatible_materials_json','water_reactive','air_reactive','oxidizer','organic_peroxide','acid_base_notes','metal_compatibility_notes','elastomer_compatibility_notes','segregation_requirement','ventilation_requirement'];
  return <div className="space-y-5"><PsiCard title="Storage / Compatibility" subtitle="Structured compatibility foundation. Warnings include evidence/source and do not claim AI certainty."><div className="mb-3"><CompatibilityRiskBadge risk={s.compatibility_risk_level} /></div><div className="grid gap-3 md:grid-cols-3">{fields.map((field) => <Info key={field} label={label(field)} value={Array.isArray(s[field]) ? s[field].join(', ') : s[field] ?? 'Missing'} />)}</div></PsiCard><CompatibilityWarningPanel checks={detail.compatibilityChecks} /></div>;
}
function label(name: string) { return name.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()); }
function Info({ label, value }: { label: string; value: unknown }) { return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">{label}</p><p className="mt-1 text-sm">{String(value)}</p></div>; }
