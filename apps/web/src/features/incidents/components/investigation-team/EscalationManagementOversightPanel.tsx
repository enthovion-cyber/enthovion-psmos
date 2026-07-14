import { Badge } from '../shared/IncidentStatusBadge';
import { InfoRows, TabPanel, formatDate } from '../shared/IncidentTabPrimitives';
import { TeamCards } from './InvestigationTeamPrimitives';

export function EscalationManagementOversightPanel({ data }: any) {
  const rows = (data?.reasons ?? []).map((reason: string) => ({ id: reason, label: reason, notes: data?.required ? 'Escalation required' : 'For awareness' }));
  return (
    <TabPanel title="Escalation / Management Oversight">
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold">Status</span><Badge value={data?.status ?? (data?.required ? 'Required' : 'Not Required')} /></div>
        <InfoRows rows={[
          ['Management oversight required', data?.required ? 'Yes' : 'No'],
          ['Escalation level', data?.level],
          ['Escalation owner', data?.owner],
          ['Due date', formatDate(data?.dueAt)],
          ['Last escalated', formatDate(data?.lastEscalatedAt)],
        ]} />
        <TeamCards rows={rows} empty="No escalation reasons returned." />
      </div>
    </TabPanel>
  );
}
