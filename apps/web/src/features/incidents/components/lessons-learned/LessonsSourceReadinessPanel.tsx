import { Badge } from '../shared/IncidentStatusBadge';
import { TabPanel } from '../shared/IncidentTabPrimitives';
export function LessonsSourceReadinessPanel({ items }: { items: any[] }) {
  return <TabPanel title="Lessons Readiness / Source Panel"><div className="grid gap-2">{(items ?? []).map((item) => <div key={item.title} className="rounded-lg border border-slate-200 p-3 text-xs dark:border-cyan-300/10"><div className="flex justify-between gap-2"><b>{item.title}</b><Badge value={item.status} /></div><div className="mt-1 text-slate-500">{item.section}{item.hard ? ' · Blocking' : ''}</div></div>)}{!(items ?? []).length ? <p className="text-xs text-slate-500">No source readiness data returned.</p> : null}</div></TabPanel>;
}
