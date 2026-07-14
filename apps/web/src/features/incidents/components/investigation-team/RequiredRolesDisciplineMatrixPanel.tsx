import { Badge } from '../shared/IncidentStatusBadge';
import { TabPanel } from '../shared/IncidentTabPrimitives';
import { TeamRoleBadge } from '../shared/TeamRoleBadge';

export function RequiredRolesDisciplineMatrixPanel({ rows }: { rows?: any[] }) {
  return (
    <TabPanel title="Required Roles / Discipline Matrix">
      {!rows?.length ? <p className="text-xs text-slate-500">No required roles generated yet.</p> : (
        <div className="grid gap-2">
          {rows.map((row: any) => (
            <div key={row.id ?? row.role_name} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2"><TeamRoleBadge value={row.role_name} /><span className="text-slate-500">{row.discipline ?? '-'}</span></div>
                <Badge value={row.status ?? (row.missing ? 'Missing' : 'Covered')} />
              </div>
              <p className="mt-1 text-slate-500">{row.source_rule ?? row.generated_reason ?? row.notes}</p>
              <div className="mt-1 text-[11px] text-slate-400">Required count {row.required_count ?? 1} · Assigned {row.assigned_count ?? 0}</div>
            </div>
          ))}
        </div>
      )}
    </TabPanel>
  );
}
