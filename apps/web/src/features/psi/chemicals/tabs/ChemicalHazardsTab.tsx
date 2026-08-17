import { GhsPictogramSet } from '../../shared/GhsPictogramSet';
import { GhsSignalWordBadge } from '../../shared/GhsSignalWordBadge';
import { NfpaDiamondMini } from '../../shared/NfpaDiamondMini';
import { PsiCard } from '../../shared/PsiUi';
import type { PsiChemicalDetail } from '../../types/psi-chemical.types';

export function ChemicalHazardsTab({ detail }: { detail: PsiChemicalDetail }) {
  const h = detail.hazards ?? {};
  return <PsiCard title="Hazard Classification" subtitle="GHS hazards, categories, statements, NFPA/HMIS and high-hazard context."><div className="grid gap-4 md:grid-cols-2"><Info label="GHS hazard classes" value={list(h.ghs_hazard_classes_json)} /><Info label="GHS categories" value={list(h.ghs_categories_json)} /><div><p className="text-sm font-semibold">Pictograms</p><GhsPictogramSet values={h.pictograms_json} /></div><div><p className="text-sm font-semibold">Signal word</p><GhsSignalWordBadge value={h.signal_word} /></div><Info label="Hazard statements" value={list(h.hazard_statements_json)} /><Info label="Precautionary statements" value={list(h.precautionary_statements_json)} /><div><p className="text-sm font-semibold">NFPA</p><NfpaDiamondMini health={h.nfpa_health} fire={h.nfpa_fire} reactivity={h.nfpa_reactivity} special={h.nfpa_special} /></div><Info label="HMIS" value={`${h.hmis_health ?? '-'} / ${h.hmis_flammability ?? '-'} / ${h.hmis_physical_hazard ?? '-'}`} /><Info label="Hazard summary" value={h.hazard_summary ?? 'Missing'} /></div></PsiCard>;
}
function list(v: any) { return Array.isArray(v) ? v.join(', ') : v ?? 'Missing'; }
function Info({ label, value }: { label: string; value: unknown }) { return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">{label}</p><p className="mt-1 text-sm">{String(value)}</p></div>; }
