import { Badge } from '../shared/IncidentStatusBadge';
import { TabPanel } from '../shared/IncidentTabPrimitives';

export function RequiredEvidenceChecklistPanel({ rows }: { rows?: any[] }) {
  return (
    <TabPanel title="Required Evidence Checklist">
      {!rows?.length ? <p className="text-xs text-slate-500">No required evidence rules were returned by the backend.</p> : (
        <div className="grid gap-2">
          {rows.map((row) => (
            <div key={row.title} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
              <div>
                <div className="font-bold">{row.title}</div>
                <div className="text-slate-500">{(row.types ?? []).join(', ')}</div>
              </div>
              <Badge value={row.status} />
            </div>
          ))}
        </div>
      )}
    </TabPanel>
  );
}
