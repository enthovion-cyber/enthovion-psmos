import { Badge } from '../shared/IncidentStatusBadge';
import { TabPanel } from '../shared/IncidentTabPrimitives';
import { MiniDistribution } from './InvestigationTeamPrimitives';

export function RolesResponsibilitiesRaciPanel({ rows }: { rows?: any }) {
  const raciRows = Array.isArray(rows) ? rows : rows?.rows;
  return (
    <TabPanel title="Roles, Responsibilities & RACI">
      <div className="grid gap-3">
        <MiniDistribution label="RACI distribution" rows={(Array.isArray(rows) ? [] : rows?.distribution)?.map((item: any) => ({ label: item.raci_role ?? item.label, count: item.count }))} />
        {!raciRows?.length ? <p className="text-xs text-slate-500">No RACI assignments returned.</p> : (
          <div className="grid gap-2">
            {raciRows.map((row: any) => (
              <div key={row.id ?? `${row.member_id}-${row.activity}`} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{row.activity ?? row.responsibility ?? row.display_name}</span>
                  <Badge value={row.raci_role ?? row.role} />
                </div>
                <p className="mt-1 text-slate-500">{row.responsibility ?? row.notes ?? row.member_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </TabPanel>
  );
}
