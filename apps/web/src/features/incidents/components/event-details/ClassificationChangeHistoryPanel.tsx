import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';

export function ClassificationChangeHistoryPanel({ rows }: { rows: any[] }) {
  return (
    <TabPanel title="Classification Change History">
      <TimelineList rows={rows ?? []} empty="No classification changes recorded yet." />
    </TabPanel>
  );
}
