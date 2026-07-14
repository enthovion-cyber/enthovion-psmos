import { OverviewEmptyState } from './OverviewEmptyState';
import { formatDate, OverviewPanelShell } from './OverviewPanelShell';
export function RecentActivityTimeline({ items = [] }: { items?: any[] }) {
  return <OverviewPanelShell title="Recent Activity Timeline" subtitle="Real immutable incident history events."><div className="grid gap-3">{items.length ? items.map((item) => <div key={item.id ?? item.event_number} className="border-l-2 border-blue-500 pl-3 text-xs"><div className="font-bold text-slate-900 dark:text-white">{item.event_title ?? item.title}</div><div className="text-slate-500">{item.event_type} · {formatDate(item.created_at)}</div><div className="text-slate-500">{item.event_description}</div></div>) : <OverviewEmptyState message="No recent activity yet."/>}</div></OverviewPanelShell>;
}
