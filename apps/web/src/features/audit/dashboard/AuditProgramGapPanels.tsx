import { AuditCard, AuditEmptyState } from '../shared/AuditUi';
import { AuditConfigurationHealthBadge } from '../shared/AuditConfigurationHealthBadge';

export function AuditProgramGapPanels({ configurationGaps = [], siteCoverageGaps = [], moduleCoverageGaps = [], readyForScheduling = [] }: { configurationGaps?: any[]; siteCoverageGaps?: any[]; moduleCoverageGaps?: any[]; readyForScheduling?: any[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Rows title="Programs missing required configuration" rows={configurationGaps} empty="No configuration gaps returned" render={(row) => <><b>{row.program_code}</b><span>{row.program_title}</span><AuditConfigurationHealthBadge value={row.configuration_health} /></>} />
      <Rows title="Site coverage gaps" rows={siteCoverageGaps} empty="All visible sites have coverage" render={(row) => <><b>{row.siteName}</b><span>{row.reason}</span></>} />
      <Rows title="Module coverage gaps" rows={moduleCoverageGaps} empty="All supported modules have coverage" render={(row) => <><b>{row.moduleName}</b><span>{row.reason}</span></>} />
      <Rows title="Next phase readiness" rows={readyForScheduling} empty="No programs ready for planning/scheduling yet" render={(row) => <><b>{row.program_code}</b><span>{row.program_title}</span><AuditConfigurationHealthBadge value={row.configuration_health} /></>} />
    </div>
  );
}

function Rows({ title, rows, empty, render }: { title: string; rows: any[]; empty: string; render: (row: any) => React.ReactNode }) {
  return <AuditCard title={title}>{rows.length ? <div className="space-y-2">{rows.slice(0, 8).map((row, index) => <div key={row.id ?? row.siteId ?? row.moduleKey ?? index} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">{render(row)}</div>)}</div> : <AuditEmptyState title={empty} message="The backend did not return records for your current company/site filters." />}</AuditCard>;
}
