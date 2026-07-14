import { InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';

export function RiskMatrixConfigurationSnapshotPanel({ data }: { data: any }) {
  return (
    <TabPanel title="Risk Matrix Configuration Snapshot">
      <InfoRows rows={[
        ['Configured', data?.configured ? 'Yes' : 'No'],
        ['Source', data?.source],
        ['Version', data?.version],
        ['Missing reason', data?.missingReason ?? '-']
      ]} />
    </TabPanel>
  );
}
