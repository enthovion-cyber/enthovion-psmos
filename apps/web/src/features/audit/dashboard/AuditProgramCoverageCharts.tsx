import { AuditCard, AuditEmptyState } from '../shared/AuditUi';

export function AuditProgramCoverageCharts({ moduleCoverage = [], statusBySite = [], standardCoverage = [] }: { moduleCoverage?: any[]; statusBySite?: any[]; standardCoverage?: any[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <BarPanel title="Audit program status by site" rows={statusBySite} labelKey="siteName" valueKey="totalPrograms" />
      <BarPanel title="Audit program coverage by module" rows={moduleCoverage} labelKey="moduleName" valueKey="coveredPrograms" />
      <BarPanel title="Audit program coverage by standard/regulation" rows={standardCoverage} labelKey="standardName" valueKey="count" />
    </div>
  );
}

function BarPanel({ title, rows, labelKey, valueKey }: { title: string; rows: any[]; labelKey: string; valueKey: string }) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] ?? 0)), 1);
  return (
    <AuditCard title={title}>
      {rows.length ? <div className="space-y-3">{rows.slice(0, 10).map((row) => <div key={String(row[labelKey])}><div className="flex justify-between gap-3 text-xs"><span className="truncate">{row[labelKey]}</span><b>{row[valueKey] ?? 0}</b></div><div className="mt-1 h-2 rounded-full bg-[var(--psm-surface-3)]"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(4, (Number(row[valueKey] ?? 0) / max) * 100)}%` }} /></div></div>)}</div> : <AuditEmptyState title="No backend coverage data" message="Create audit programs with scope, standards, and modules to populate this chart." />}
    </AuditCard>
  );
}
