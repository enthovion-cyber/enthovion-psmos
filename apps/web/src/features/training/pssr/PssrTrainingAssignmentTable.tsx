import { PssrTrainingAssignmentStatusBadge } from '../shared/PssrTrainingAssignmentStatusBadge';
import { SimpleTable, valueText } from './PssrTrainingPanelPrimitives';

export function PssrTrainingAssignmentTable({ rows = [] }: { rows?: any[] }) {
  return <SimpleTable rows={rows} columns={[{ key: 'worker', label: 'Worker', render: (row) => valueText(row.worker?.display_name ?? row.worker_id) }, { key: 'pssr', label: 'PSSR', render: (row) => valueText(row.pssr?.pssr_number ?? row.readiness?.pssr?.pssr_number ?? row.pssr_id) }, { key: 'runtime_status', label: 'Status', render: (row) => <PssrTrainingAssignmentStatusBadge status={row.runtime_status ?? row.assignment_status} /> }, { key: 'due_date', label: 'Due Date' }, { key: 'evidence_status', label: 'Evidence' }, { key: 'verification_status', label: 'Verification' }, { key: 'approval_blocker', label: 'Impl Blocker', render: (row) => valueText(row.approval_blocker) }, { key: 'startup_blocker', label: 'Startup Blocker', render: (row) => valueText(row.startup_blocker) }]} />;
}

