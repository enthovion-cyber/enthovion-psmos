import type { AuditDetail } from '../../types/audit.types';
import { AuditCard, AuditEmptyState } from '../../shared/AuditUi';

export function ProgramScopeTab({ detail }: { detail: AuditDetail }) {
  return <AuditCard title="Scope" subtitle="Company/site/unit/area/department/equipment/process/worker/contractor scope foundation.">{detail.scopes.length ? <Rows rows={detail.scopes} columns={['scope_type','site_scope_id','unit_id','area_id','department_id','equipment_id','process_system','worker_role_scope','contractor_company_id','scope_description','exclusions','scope_justification']} /> : <AuditEmptyState title="Missing scope" message="At least one scope is required before activation." />}</AuditCard>;
}

function Rows({ rows, columns }: { rows: any[]; columns: string[] }) { return <div className="overflow-x-auto"><table className="min-w-full text-sm"><tbody>{rows.map((row, i) => <tr key={row.id ?? i} className="border-b border-[var(--psm-line)]">{columns.map((column) => <td key={column} className="px-3 py-2"><span className="text-xs uppercase text-[var(--psm-muted)]">{column.replaceAll('_', ' ')}</span><br />{String(row[column] ?? 'Missing')}</td>)}</tr>)}</tbody></table></div>; }
