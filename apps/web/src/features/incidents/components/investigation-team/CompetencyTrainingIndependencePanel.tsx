import { Badge } from '../shared/IncidentStatusBadge';
import { TabPanel } from '../shared/IncidentTabPrimitives';
import { CompetencyStatusBadge } from '../shared/CompetencyStatusBadge';
import { MiniDistribution } from './InvestigationTeamPrimitives';

export function CompetencyTrainingIndependencePanel({ data }: any) {
  const rows = data?.rows ?? [...(data?.competency ?? []), ...(data?.training ?? []), ...(data?.independence ?? [])];
  return (
    <TabPanel title="Competency / Training / Independence">
      <div className="grid gap-3">
        <div className="grid gap-2 md:grid-cols-3">
          <MiniDistribution label="Competency" rows={data?.competencyDistribution} />
          <MiniDistribution label="Training" rows={data?.trainingDistribution} />
          <MiniDistribution label="Independence" rows={data?.independenceDistribution} />
        </div>
        {!rows?.length ? <p className="text-xs text-slate-500">No competency, training, or independence data returned.</p> : (
          <div className="grid gap-2">
            {rows.map((row: any) => (
              <div key={row.id ?? row.display_name} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{row.display_name ?? row.label}</span>
                  <div className="flex flex-wrap gap-1"><CompetencyStatusBadge value={row.competency_status} /><Badge value={row.training_status} /><Badge value={row.independence_status ?? row.conflict_status} /></div>
                </div>
                <p className="mt-1 text-slate-500">{row.training_records ?? row.conflict_notes ?? row.notes ?? row.responsibility}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </TabPanel>
  );
}
