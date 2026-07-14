import { TimelineList, TabPanel } from '../shared/IncidentTabPrimitives';

export function ReviewApprovalChangeHistoryPanel({ rows }: { rows: any[] }) {
  return (
    <TabPanel title="Review Approval Change History">
      <TimelineList rows={rows ?? []} empty="No review approval history events were returned." />
    </TabPanel>
  );
}
