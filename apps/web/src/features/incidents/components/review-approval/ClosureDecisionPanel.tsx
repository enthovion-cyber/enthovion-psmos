import { ClosureStatusBadge } from '../shared/ClosureStatusBadge';
import { InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';

export function ClosureDecisionPanel({ closure }: { closure: any }) {
  return (
    <TabPanel title="Closure Decision">
      <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold">Backend closure gate</span><ClosureStatusBadge value={closure?.closureStatus ?? closure?.closureDecision} /></div>
      <InfoRows rows={[
        ['Ready for closure', closure?.readyForClosure ? 'Yes' : 'No'],
        ['Closure type', closure?.closureType],
        ['Closure reason', closure?.closureReason],
        ['Closure summary', closure?.closureSummary],
        ['Closed by', closure?.closedBy],
        ['Closed at', closure?.closedAt],
        ['Exception reason', closure?.exceptionReason],
        ['Exception approver', closure?.exceptionApprover]
      ]} />
    </TabPanel>
  );
}
