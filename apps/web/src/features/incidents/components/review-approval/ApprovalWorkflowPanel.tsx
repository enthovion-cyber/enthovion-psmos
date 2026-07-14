import { Badge } from '../shared/IncidentStatusBadge';
import { formatDate, TabPanel } from '../shared/IncidentTabPrimitives';

export function ApprovalWorkflowPanel({ workflow }: { workflow: any }) {
  const steps = workflow?.steps ?? [];
  return (
    <TabPanel title="Approval Workflow">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-bold">Route: {workflow?.routeName ?? 'Backend workflow route'}</span>
        <Badge value={workflow?.status ?? 'Not Started'} />
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {steps.length ? steps.map((step: any) => (
          <div key={step.key ?? step.sequence} className="rounded-lg border border-slate-200 p-3 text-xs dark:border-cyan-300/10">
            <div className="font-bold">{step.sequence ? `${step.sequence}. ` : ''}{step.title ?? step.name}</div>
            <div className="mt-1 text-slate-500">{step.description ?? step.ownerRole ?? '-'}</div>
            <div className="mt-2 flex items-center justify-between"><Badge value={step.status} /><span className="text-slate-400">{formatDate(step.completedAt)}</span></div>
          </div>
        )) : <p className="text-xs text-slate-500">No workflow steps were returned by Workflow Engine.</p>}
      </div>
    </TabPanel>
  );
}
