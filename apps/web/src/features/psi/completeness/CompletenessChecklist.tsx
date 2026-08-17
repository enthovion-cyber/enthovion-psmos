import type { PsiCompletenessEvaluation } from '../types/psi-completeness.types';
import { PsiCard } from '../shared/PsiUi';

export function CompletenessChecklist({ rows = [] }: { rows?: PsiCompletenessEvaluation[] }) {
  return (
    <PsiCard title="Completeness Checklist" subtitle="Category, requirement, severity, status, owner, due date, readiness/PSSR impact, and action foundation.">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase text-[var(--psm-muted)]"><tr>{['Category', 'Requirement', 'Status', 'Severity', 'Missing Reason', 'Source / Link', 'Owner', 'Due Date', 'Readiness/PSSR Impact', 'Action'].map((header) => <th key={header} className="px-3 py-2">{header}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3">{row.category}</td><td className="px-3 py-3 font-semibold">{row.requirement_name}</td><td className="px-3 py-3">{row.status}</td><td className="px-3 py-3">{row.severity}</td><td className="px-3 py-3 text-[var(--psm-muted)]">{row.missing_reason ?? 'Complete'}</td><td className="px-3 py-3">{row.linked_module ?? row.linked_document_id ?? '-'}</td><td className="px-3 py-3">{row.owner_user_id ?? '-'}</td><td className="px-3 py-3">{row.due_date ?? '-'}</td><td className="px-3 py-3">{row.pssr_blocker ? 'PSSR blocker' : row.readiness_impact ?? '-'}</td><td className="px-3 py-3">{row.status === 'Complete' ? 'No action' : 'Create action foundation'}</td></tr>)}</tbody>
        </table>
      </div>
    </PsiCard>
  );
}
