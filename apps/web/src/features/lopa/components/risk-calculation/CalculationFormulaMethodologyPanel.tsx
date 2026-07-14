import { FieldGrid, LopaPanel } from '../overview/LopaOverviewShared';

export function CalculationFormulaMethodologyPanel({ methodology }: { methodology: any }) {
  return <LopaPanel title="Formula / Methodology"><FieldGrid items={[
    ['Methodology', `${methodology?.methodologyName ?? '-'} v${methodology?.methodologyVersion ?? '-'}`],
    ['Formula', methodology?.formula ?? '-'],
    ['Rounding', methodology?.roundingRule ?? '-'],
    ['Risk gap rule', methodology?.riskGapPolicy ?? '-'],
    ['SIL trigger rule', methodology?.silTriggerPolicy ?? '-'],
    ['Uncertainty policy', methodology?.uncertaintyPolicy ?? '-']
  ]} /></LopaPanel>;
}
