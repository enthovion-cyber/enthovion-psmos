import { Badge } from '../shared/IncidentStatusBadge';
import { InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';

export function ReopenReapprovalControlPanel({ data }: { data: any }) {
  return (
    <TabPanel title="Reopen / Reapproval Control">
      <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold">Controlled reopen/reapproval</span><Badge value={data?.status ?? (data?.reapprovalRequired ? 'Reapproval Required' : 'No Reapproval Required')} /></div>
      <InfoRows rows={[
        ['Reapproval required', data?.reapprovalRequired ? 'Yes' : 'No'],
        ['Reason', data?.reason],
        ['Reopened by', data?.reopenedBy],
        ['Reopened at', data?.reopenedAt],
        ['Previous approval snapshot', data?.previousApprovalSnapshotId],
        ['Workflow restart required', data?.workflowRestartRequired ? 'Yes' : 'No']
      ]} />
    </TabPanel>
  );
}
