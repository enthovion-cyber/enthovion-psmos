import { InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';

export function ReporterWitnessSnapshotPanel({ data }: any) {
  return (
    <TabPanel title="Reporter / Witness Snapshot">
      <InfoRows rows={[
        ['Reporter', data.reporterWitnessSnapshot?.anonymousReport ? 'Anonymous report' : data.reporterWitnessSnapshot?.reporter?.displayName ?? '-'],
        ['Email', data.reporterWitnessSnapshot?.reporter?.email ?? '-'],
        ['Department', data.reporterWitnessSnapshot?.reporterDepartment ?? '-'],
        ['Role', data.reporterWitnessSnapshot?.reporterRole ?? '-'],
        ['Contact', data.reporterWitnessSnapshot?.reporterContact ?? '-'],
        ['Witnesses known', data.reporterWitnessSnapshot?.witnessesKnown ? 'Yes' : 'No']
      ]} />
    </TabPanel>
  );
}
