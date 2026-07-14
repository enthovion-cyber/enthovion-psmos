import { FieldGrid, LopaPanel } from '../overview/LopaOverviewShared';
import { FrequencyDisplay } from '../shared/FrequencyDisplay';

export function SensitivityUncertaintyPreviewPanel({ calculation }: { calculation: any }) {
  return <LopaPanel title="Sensitivity / Uncertainty Preview"><FieldGrid items={[
    ['Low mitigated frequency', <FrequencyDisplay key="low" value={calculation?.low_mitigated_frequency} />],
    ['High mitigated frequency', <FrequencyDisplay key="high" value={calculation?.high_mitigated_frequency} />],
    ['Confidence summary', calculation?.confidence_level_summary ?? 'No uncertainty model configured for this calculation.']
  ]} /></LopaPanel>;
}
