import { TabPanel, TimelineList } from '../shared/IncidentTabPrimitives';

export function SeverityChangeHistoryPanel({ rows }: { rows: any[] }) {
  return (
    <TabPanel title="Severity Change History">
      <TimelineList rows={rows ?? []} empty="No severity/risk changes recorded yet." columns />
    </TabPanel>
  );
}
