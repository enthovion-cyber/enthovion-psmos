import { Badge } from '../shared/IncidentStatusBadge';
import { formatDate, TabPanel } from '../shared/IncidentTabPrimitives';

export function SectionCompletionChecklistPanel({ items }: { items: any[] }) {
  return (
    <TabPanel title="Section Completion Checklist">
      <div className="grid gap-2">
        {(items ?? []).length ? items.map((item) => (
          <div key={item.key ?? item.sectionName} className="rounded-lg border border-slate-200 p-3 text-xs dark:border-cyan-300/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold">{item.sectionName ?? item.title}</div>
                <div className="mt-1 text-slate-500">Owner: {item.owner ?? '-'} · Last updated: {formatDate(item.lastUpdated)}</div>
                {(item.blockers ?? []).length ? <div className="mt-1 text-amber-600 dark:text-amber-200">Blockers: {(item.blockers ?? []).join(', ')}</div> : null}
              </div>
              <Badge value={item.status ?? (item.complete ? 'Complete' : 'Incomplete')} />
            </div>
          </div>
        )) : <p className="text-xs text-slate-500">No section checklist data was returned.</p>}
      </div>
    </TabPanel>
  );
}
