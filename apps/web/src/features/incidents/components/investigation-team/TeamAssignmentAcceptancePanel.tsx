import { AcceptanceStatusBadge } from '../shared/AcceptanceStatusBadge';
import { InfoRows, TabPanel, formatDate } from '../shared/IncidentTabPrimitives';

function AcceptanceList({ title, rows }: { title: string; rows?: any[] }) {
  if (!rows?.length) return null;
  return (
    <div>
      <div className="mb-1 text-xs font-black">{title}</div>
      <div className="grid gap-1">
        {rows.map((row: any) => (
          <div key={row.id} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
            <div className="flex items-center justify-between gap-2"><span className="font-bold">{row.display_name ?? row.email}</span><AcceptanceStatusBadge value={row.acceptance_status} /></div>
            <div className="text-slate-500">Due {formatDate(row.acceptance_due_at)} · Last notice {formatDate(row.last_notification_sent_at)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamAssignmentAcceptancePanel({ rows }: { rows?: any }) {
  const data = Array.isArray(rows) ? { pending: rows } : rows;
  return (
    <TabPanel title="Team Assignment & Acceptance">
      <div className="grid gap-3">
        <InfoRows rows={[
          ['Status', data?.status],
          ['Acceptance required', data?.acceptanceRequired ? 'Yes' : 'No'],
          ['Assignment notification sent', data?.notificationSent ? 'Yes' : 'No'],
          ['Reminder sent', data?.reminderSent ? 'Yes' : 'No'],
        ]} />
        <AcceptanceList title="Pending acceptance" rows={data?.pending} />
        <AcceptanceList title="Accepted members" rows={data?.accepted} />
        <AcceptanceList title="Declined members" rows={data?.declined} />
        <AcceptanceList title="Overdue assignments" rows={data?.overdue} />
        {!data?.pending?.length && !data?.accepted?.length && !data?.declined?.length && !data?.overdue?.length ? <p className="text-xs text-slate-500">No acceptance statuses returned.</p> : null}
      </div>
    </TabPanel>
  );
}
