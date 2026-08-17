import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { AuditEmptyState } from './AuditUi';

export function AuditPlaceholderPage({ title }: { title: string }) {
  return <AuditLayout><div className="space-y-5"><AuditHeader title={title} actionHref="/audit-compliance/programs/new" /><AuditEmptyState title="This phase is not implemented yet" message="This route is intentionally a safe placeholder for a future Audit / Compliance Assurance phase. No fake audit plans, checklist execution, findings, CAPA, scoring, evidence, reports, or compliance data is shown." /></div></AuditLayout>;
}
