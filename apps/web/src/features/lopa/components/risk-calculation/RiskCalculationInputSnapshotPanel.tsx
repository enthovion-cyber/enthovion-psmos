import { FieldGrid, LopaPanel } from '../overview/LopaOverviewShared';
import { FrequencyDisplay } from '../shared/FrequencyDisplay';

export function RiskCalculationInputSnapshotPanel({ inputs }: { inputs: any }) {
  return (
    <LopaPanel title="Input Snapshot">
      <FieldGrid items={[
        ['Consequence', inputs?.consequence?.description ?? inputs?.consequence?.consequence_description ?? 'Missing'],
        ['Severity', inputs?.consequence?.severity ?? inputs?.consequence?.consequence_severity ?? '-'],
        ['Tolerable frequency', <FrequencyDisplay key="tf" value={inputs?.tolerableFrequency} />],
        ['Input hash', inputs?.inputHash ?? '-']
      ]} />
    </LopaPanel>
  );
}
