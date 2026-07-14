import { AcceptanceStatusBadge } from '../shared/AcceptanceStatusBadge';
import { InfoRows, TabPanel, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';

export function InvestigationOwnerLeadPanel({ data, onAssignOwner, onAssignLead }: any) {
  return (
    <TabPanel title="Investigation Owner / Lead">
      <div className="grid gap-3">
        <InfoRows rows={[
          ['Owner', data?.owner?.displayName ?? data?.owner?.email],
          ['Owner ID', data?.investigationOwnerId],
          ['Lead investigator', data?.lead?.display_name ?? data?.leadInvestigatorId],
          ['HSE / EHS lead', data?.hseLeadId],
          ['Process safety lead', data?.processSafetyLeadId],
          ['Operations lead', data?.operationsLeadId],
          ['Engineering lead', data?.engineeringLeadId],
          ['Formal team required', data?.formalTeamRequired ? 'Yes' : 'No'],
          ['RCA required', data?.rcaRequired ? 'Yes' : 'No'],
          ['Assignment due', formatDate(data?.assignmentDueAt)],
          ['Assignment reason', data?.assignmentReason],
        ]} />
        <div className="flex flex-wrap gap-2 text-xs">
          <span>Owner acceptance <AcceptanceStatusBadge value={data?.ownerAcceptanceStatus} /></span>
          <span>Lead acceptance <AcceptanceStatusBadge value={data?.leadAcceptanceStatus} /></span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={buttonSecondary} onClick={onAssignOwner}>Assign / Change Owner</button>
          <button className={buttonSecondary} onClick={onAssignLead}>Assign / Change Lead</button>
        </div>
      </div>
    </TabPanel>
  );
}
