import { FieldGrid, LopaPanel, TonePill } from '../overview/LopaOverviewShared';

export function RiskGapRequiredRrfPanel({ summary }: { summary: any }) {
  return <LopaPanel title="Risk Gap / Required Additional RRF"><FieldGrid items={[
    ['Risk gap factor', summary.riskGapFactor ? Number(summary.riskGapFactor).toFixed(2) : '-'],
    ['Required additional RRF', summary.requiredAdditionalRrf ? Number(summary.requiredAdditionalRrf).toFixed(2) : '-'],
    ['Additional IPL required', <TonePill key="ipl" tone={summary.additionalIplRequired ? 'danger' : 'success'}>{summary.additionalIplRequired ? 'Yes' : 'No'}</TonePill>],
    ['SIF / SIL evaluation required', <TonePill key="sil" tone={summary.sifSilEvaluationRequired ? 'warning' : 'success'}>{summary.sifSilEvaluationRequired ? 'Yes' : 'No'}</TonePill>]
  ]} /></LopaPanel>;
}
