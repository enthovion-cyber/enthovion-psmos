import { Badge } from '../shared/IncidentStatusBadge';
import { InfoRows, TabPanel } from '../shared/IncidentTabPrimitives';

export function InvestigationPriorityDecisionPanel({ data }: { data: any }) {
  return (
    <TabPanel title="Investigation Priority Decision">
      <InfoRows rows={[
        ['Priority', data?.priority],
        ['Investigation level', data?.levelRequired],
        ['Due date', data?.dueDate ?? '-'],
        ['Formal team required', data?.formalTeamRequired ? 'Yes' : 'No'],
        ['RCA required', data?.rcaRequired ? 'Yes' : 'No']
      ]} />
      <div className="mt-3 flex flex-wrap gap-2">{(data?.followups ?? []).filter((x: any) => x.required).map((x: any) => <Badge key={x.label} value={x.label} />)}</div>
    </TabPanel>
  );
}
