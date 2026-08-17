import type { AuditDetail } from '../../types/audit.types';
import { AuditCard } from '../../shared/AuditUi';

export function ProgramOwnershipTab({ detail }: { detail: AuditDetail }) {
  const program = detail.program;
  const items = [['Program owner', program.owner?.displayName ?? program.owner_user_id ?? 'Missing'], ['Program reviewer', program.reviewer?.displayName ?? program.reviewer_user_id ?? 'Missing'], ['Approval owner foundation', program.approval_owner_user_id ?? 'Missing'], ['Audit lead role', program.audit_lead_role ?? 'Missing'], ['Responsible department', program.responsible_department_id ?? 'Missing'], ['Escalation owner foundation', program.escalation_owner_user_id ?? 'Missing'], ['Governance notes', (program as any).governance_notes ?? 'No governance notes']];
  return <AuditCard title="Ownership / Governance" subtitle="Owner/reviewer must be valid users inside allowed company/site scope.">{<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{items.map(([label, value]) => <div key={label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div>}</AuditCard>;
}
