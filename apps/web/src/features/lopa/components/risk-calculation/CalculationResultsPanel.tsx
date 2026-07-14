import { FieldGrid, LopaPanel } from '../overview/LopaOverviewShared';
import { FrequencyDisplay } from '../shared/FrequencyDisplay';
import { RiskGapBadge } from '../shared/RiskGapBadge';

export function CalculationResultsPanel({ summary }: { summary: any }) {
  return <LopaPanel title="Calculation Results"><FieldGrid items={[
    ['Frequency after modifiers', <FrequencyDisplay key="fam" value={summary.frequencyAfterModifiers} />],
    ['Combined IPL PFDavg', <FrequencyDisplay key="pfd" value={summary.combinedIplPfdavg} unit="" />],
    ['Combined IPL RRF', summary.combinedIplRrf ? Number(summary.combinedIplRrf).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '-'],
    ['Mitigated event frequency', <FrequencyDisplay key="mef" value={summary.mitigatedEventFrequency} />],
    ['Tolerable frequency', <FrequencyDisplay key="tol" value={summary.tolerableFrequency} />],
    ['Pass / fail', <RiskGapBadge key="gap" value={summary.riskGapFactor} meets={summary.meetsRiskCriteria} />]
  ]} /></LopaPanel>;
}
