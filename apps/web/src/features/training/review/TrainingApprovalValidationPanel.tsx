import { TrainingCard, TrainingEmptyState } from '../shared/TrainingUi';
import { TrainingValidationStatusBadge } from '../shared/TrainingValidationStatusBadge';
export function TrainingApprovalValidationPanel({ rows }: { rows?: any[] | undefined }) {
  return <TrainingCard title="Validation Results" subtitle="Backend validation before submission and final decision.">{rows?.length ? rows.map((row) => <div key={row.id} className="mb-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex justify-between"><strong>{row.validation_type}</strong><TrainingValidationStatusBadge value={row.validation_status} /></div><pre className="mt-2 max-h-40 overflow-auto text-xs">{JSON.stringify(row.checks_json ?? [], null, 2)}</pre></div>) : <TrainingEmptyState title="Validation not run" message="Run validation from the review decision panel to store backend checks and blockers." />}</TrainingCard>;
}
