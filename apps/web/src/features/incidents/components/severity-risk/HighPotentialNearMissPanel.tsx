import { InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';

export function HighPotentialNearMissPanel({ data }: { data: any }) {
  return (
    <TabPanel title="High-Potential Near Miss Panel">
      <InfoRows rows={[
        ['High-potential near miss', data?.highPotentialNearMiss ? 'Yes' : 'No'],
        ['Fatality potential', data?.fatalityPotential ? 'Yes' : 'No'],
        ['Major process safety potential', data?.majorProcessSafetyPotential ? 'Yes' : 'No'],
        ['Attention required', data?.attentionRequired ? 'Yes' : 'No']
      ]} />
    </TabPanel>
  );
}
