import { CompatibilityRiskBadge } from '../../shared/CompatibilityRiskBadge';
import { GhsPictogramSet } from '../../shared/GhsPictogramSet';
import { NfpaDiamondMini } from '../../shared/NfpaDiamondMini';
import { PsiCard, PsiMetricCard } from '../../shared/PsiUi';
import type { PsiChemicalDetail } from '../../types/psi-chemical.types';
import { CompatibilityWarningPanel } from '../CompatibilityWarningPanel';
import { SdsStatusPanel } from '../SdsStatusPanel';

export function ChemicalOverviewTab({ detail }: { detail: PsiChemicalDetail }) {
  const h = detail.hazards ?? {};
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">{detail.overview.cards.map((card) => <PsiMetricCard key={card.label} label={card.label} value={card.value} tone={card.tone ?? 'neutral'} />)}</div>
      <div className="grid gap-5 xl:grid-cols-3">
        <SdsStatusPanel detail={detail} />
        <CompatibilityWarningPanel checks={detail.compatibilityChecks} />
        <PsiCard title="GHS / NFPA Snapshot" subtitle="Hazard classification source of truth for HAZOP, PTW, training, and emergency response."><div className="space-y-3"><GhsPictogramSet values={h.pictograms_json} /><p className="text-sm"><span className="text-[var(--psm-muted)]">Signal word:</span> {h.signal_word ?? 'Missing'}</p><NfpaDiamondMini health={h.nfpa_health} fire={h.nfpa_fire} reactivity={h.nfpa_reactivity} special={h.nfpa_special} /><CompatibilityRiskBadge risk={detail.chemical.compatibility_risk_level} /></div></PsiCard>
      </div>
    </div>
  );
}
