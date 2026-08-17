import { AuditCard, AuditEmptyState } from '../shared/AuditUi';
import { AuditProgramStatusBadge } from '../shared/AuditProgramStatusBadge';

export function AuditRecentProgramsPanel({ created = [], updated = [], safety = [], regulatory = [] }: { created?: any[]; updated?: any[]; safety?: any[]; regulatory?: any[] }) {
  return <div className="grid gap-4 xl:grid-cols-2"><List title="Recently created audit programs" rows={created} /><List title="Recently updated audit programs" rows={updated} /><List title="Safety-critical audit program preview" rows={safety} /><List title="Regulatory-critical audit program preview" rows={regulatory} /></div>;
}

function List({ title, rows }: { title: string; rows: any[] }) {
  return <AuditCard title={title}>{rows.length ? <div className="divide-y divide-[var(--psm-line)]">{rows.slice(0, 8).map((row) => <a key={row.id} href={`/audit-compliance/programs/${row.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-primary"><span><b>{row.program_code}</b><br /><span className="text-[var(--psm-muted)]">{row.program_title}</span></span><AuditProgramStatusBadge status={row.program_status} /></a>)}</div> : <AuditEmptyState title="No programs returned" message="No backend audit program rows matched this panel." />}</AuditCard>;
}
