import { Badge } from '../shared/IncidentStatusBadge';
import { TabPanel, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';

export function TeamCommunicationNotificationsPanel({ data, onNotify, onReminder }: any) {
  const rows = data?.rows ?? [];
  return (
    <TabPanel title="Team Communication / Notifications">
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          <button className={buttonSecondary} onClick={onNotify}>Send assignment notification</button>
          <button className={buttonSecondary} onClick={onReminder}>Send reminder</button>
        </div>
        {!rows.length ? <p className="text-xs text-slate-500">No team notifications sent.</p> : (
          <div className="grid gap-2">
            {rows.map((row: any) => (
              <div key={row.id} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
                <div className="flex items-center justify-between gap-2"><span className="font-bold">{row.recipient_name ?? row.display_name ?? row.email}</span><Badge value={row.status ?? row.notification_status} /></div>
                <p className="mt-1 text-slate-500">{row.message ?? row.subject ?? row.notification_message}</p>
                <div className="mt-1 text-[11px] text-slate-400">Sent {formatDate(row.sent_at ?? row.last_notification_sent_at)} · Reminder {formatDate(row.last_reminder_sent_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TabPanel>
  );
}
