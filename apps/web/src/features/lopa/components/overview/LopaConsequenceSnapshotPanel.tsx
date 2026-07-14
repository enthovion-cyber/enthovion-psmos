import { FieldGrid, LopaPanel, TonePill } from './LopaOverviewShared';

export function LopaConsequenceSnapshotPanel({ consequence }: { consequence: Record<string, any> }) {
  return (
    <LopaPanel title="Consequence Snapshot">
      <div className="mb-3 flex gap-2">
        <TonePill tone={consequence.completionStatus === 'Complete' ? 'success' : 'warning'}>{consequence.completionStatus ?? 'Incomplete'}</TonePill>
        <TonePill tone={['Catastrophic', 'Critical', 'High'].includes(consequence.severity) ? 'danger' : 'warning'}>{consequence.severity ?? 'Severity missing'}</TonePill>
      </div>
      <FieldGrid items={[
        ['Description', consequence.description],
        ['Category', consequence.category],
        ['Impacted receptor', consequence.impactedReceptor],
        ['Endpoint', consequence.endpoint],
        ['Tolerable event frequency', consequence.tolerableEventFrequency],
        ['Risk criteria source', consequence.riskCriteriaSource],
        ['Personnel / environmental', [yesNo(consequence.personnelImpact), yesNo(consequence.environmentalImpact)].join(' / ')],
        ['Asset / community', [yesNo(consequence.assetImpact), yesNo(consequence.communityImpact)].join(' / ')],
        ['Notes', consequence.notes]
      ]} />
    </LopaPanel>
  );
}

function yesNo(value: unknown) {
  return value ? 'Yes' : 'No';
}
