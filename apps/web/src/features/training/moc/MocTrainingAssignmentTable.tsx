import { MocTrainingAssignmentStatusBadge } from '../shared/MocTrainingAssignmentStatusBadge';
import { SimpleTable, valueText } from './MocTrainingPanelPrimitives';

export function MocTrainingAssignmentTable({ rows = [] }: { rows?: any[] }) {
  return <SimpleTable rows={rows} columns={[{ key: 'worker', label: 'Worker', render: (row) => valueText(row.worker?.display_name ?? row.worker_id) }, { key: 'moc', label: 'MOC', render: (row) => valueText(row.moc?.moc_number ?? row.requirement?.moc?.moc_number ?? row.moc_id) }, { key: 'runtime_status', label: 'Status', render: (row) => <MocTrainingAssignmentStatusBadge status={row.runtime_status ?? row.assignment_status} /> }, { key: 'due_date', label: 'Due Date' }, { key: 'evidence_status', label: 'Evidence' }, { key: 'verification_status', label: 'Verification' }, { key: 'implementation_blocker', label: 'Impl Blocker', render: (row) => valueText(row.implementation_blocker) }, { key: 'startup_blocker', label: 'Startup Blocker', render: (row) => valueText(row.startup_blocker) }]} />;
}
