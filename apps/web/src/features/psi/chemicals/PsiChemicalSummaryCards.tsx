import { PsiMetricCard } from '../shared/PsiUi';
import type { PsiChemicalSummary } from '../types/psi-chemical.types';

export function PsiChemicalSummaryCards({ summary }: { summary: PsiChemicalSummary }) {
  const cards = [
    ['Total chemicals', summary.totalChemicals, 'neutral'],
    ['Current SDS', summary.currentSds, 'good'],
    ['Missing SDS', summary.missingSds, summary.missingSds ? 'danger' : 'good'],
    ['Expired SDS', summary.expiredSds, summary.expiredSds ? 'danger' : 'good'],
    ['High hazard', summary.highHazardChemicals, summary.highHazardChemicals ? 'warn' : 'neutral'],
    ['Flammable', summary.flammableChemicals, 'warn'],
    ['Toxic', summary.toxicChemicals, 'warn'],
    ['Reactive', summary.reactiveChemicals, 'warn'],
    ['Corrosive', summary.corrosiveChemicals, 'warn'],
    ['CMR flagged', summary.carcinogenCmrFlagged, summary.carcinogenCmrFlagged ? 'danger' : 'neutral'],
    ['Incompatible storage', summary.incompatibleStorageRisks, summary.incompatibleStorageRisks ? 'danger' : 'good'],
    ['Missing exposure limits', summary.missingExposureLimits, summary.missingExposureLimits ? 'warn' : 'good'],
    ['Missing emergency info', summary.missingEmergencyResponseInfo, summary.missingEmergencyResponseInfo ? 'warn' : 'good'],
    ['MOC required', summary.mocUpdateRequired, summary.mocUpdateRequired ? 'warn' : 'neutral']
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{cards.map(([label, value, tone]) => <PsiMetricCard key={label} label={label} value={value} tone={tone} />)}</div>;
}
