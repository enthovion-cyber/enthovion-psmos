import { Badge } from '../shared/IncidentStatusBadge';
import { buttonSecondary, formatDate, TabPanel } from '../shared/IncidentTabPrimitives';

export function ChangeRequestReworkPanel({ requests, onCreate, onResolve }: any) {
  return (
    <TabPanel title="Change Requests / Rework">
      <div className="mb-3 flex justify-end"><button className={buttonSecondary} onClick={onCreate}>Add Change Request</button></div>
      <div className="grid gap-2">
        {(requests ?? []).length ? requests.map((request: any) => (
          <div key={request.id} className="rounded-lg border border-slate-200 p-3 text-xs dark:border-cyan-300/10">
            <div className="flex items-start justify-between gap-3"><b>{request.request_number ?? request.source_section ?? 'Change request'}</b><Badge value={request.status ?? 'Open'} /></div>
            <p className="mt-1 text-slate-500">{request.description}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-slate-500"><span>Owner: {request.owner_id ?? '-'} · Due: {formatDate(request.due_date)}</span><button className={buttonSecondary} onClick={() => onResolve(request)}>Resolve</button></div>
          </div>
        )) : <p className="text-xs text-slate-500">No change requests are open.</p>}
      </div>
    </TabPanel>
  );
}
