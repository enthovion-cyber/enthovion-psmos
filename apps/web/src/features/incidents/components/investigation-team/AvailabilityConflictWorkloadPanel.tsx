import { Badge } from '../shared/IncidentStatusBadge';
import { TabPanel, formatDate } from '../shared/IncidentTabPrimitives';
import { MiniDistribution } from './InvestigationTeamPrimitives';

export function AvailabilityConflictWorkloadPanel({ data }: any) {
  const rows = data?.rows ?? [...(data?.availability ?? []), ...(data?.conflicts ?? []), ...(data?.workload ?? [])];
  return (
    <TabPanel title="Availability / Conflict / Workload">
      <div className="grid gap-3">
        <div className="grid gap-2 md:grid-cols-3">
          <MiniDistribution label="Availability" rows={data?.availabilityDistribution} />
          <MiniDistribution label="Conflicts" rows={data?.conflictDistribution} />
          <MiniDistribution label="Workload" rows={data?.workloadDistribution} />
        </div>
        {!rows?.length ? <p className="text-xs text-slate-500">No availability, conflict, or workload data returned.</p> : (
          <div className="grid gap-2">
            {rows.map((row: any) => (
              <div key={row.id ?? row.display_name} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{row.display_name ?? row.label}</span>
                  <div className="flex flex-wrap gap-1"><Badge value={row.availability_status} /><Badge value={row.conflict_status} /><Badge value={row.workload_status ?? row.capacity_percent} /></div>
                </div>
                <p className="mt-1 text-slate-500">{row.planned_absence ?? row.conflict_notes ?? row.notes ?? row.responsibility}</p>
                <div className="mt-1 text-[11px] text-slate-400">Backup {row.backup_member ?? '-'} · Due {formatDate(row.acceptance_due_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TabPanel>
  );
}
