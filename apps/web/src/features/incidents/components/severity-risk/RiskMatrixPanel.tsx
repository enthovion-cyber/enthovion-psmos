import { RiskMatrixVisual, TabPanel } from '../shared/IncidentTabPrimitives';

export function RiskMatrixPanel({ data }: { data: any }) {
  return (
    <TabPanel title="Risk Matrix Panel">
      <RiskMatrixVisual data={data} />
    </TabPanel>
  );
}
