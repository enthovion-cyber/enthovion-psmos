import { Badge } from '../shared/IncidentStatusBadge';
import { TabPanel } from '../shared/IncidentTabPrimitives';

export function InvestigationReadinessGatePanel({ items }: { items: any[] }) {
  return (
    <TabPanel title="Investigation Readiness Gate">
      <div className="grid gap-2">
        {(items ?? []).length ? items.map((item) => (
          <div key={item.key ?? item.title} className="rounded-lg border border-slate-200 p-3 text-xs dark:border-cyan-300/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold">{item.title}</div>
                <p className="mt-1 text-slate-500">{item.description ?? item.reason}</p>
              </div>
              <Badge value={item.status ?? (item.complete ? 'Complete' : 'Blocked')} />
            </div>
          </div>
        )) : <p className="text-xs text-slate-500">No readiness gate items were returned by the backend.</p>}
      </div>
    </TabPanel>
  );
}
