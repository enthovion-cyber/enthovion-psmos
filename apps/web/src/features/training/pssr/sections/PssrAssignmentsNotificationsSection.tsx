import { RowsPanel, SimpleTable, valueText } from '../PssrTrainingPanelPrimitives';
import { PssrTrainingAssignmentStatusBadge } from '../../shared/PssrTrainingAssignmentStatusBadge';

export function PssrAssignmentsNotificationsSection({ rows = [] }: { rows?: any[] }) {
  return <RowsPanel title="Assignments and Notifications" subtitle="Generated assignments, due dates, evidence and Notification Center status." rows={rows} emptyTitle="No assignments generated" emptyMessage="Assignments will appear after required workers are selected and generation is run.">{(items) => <SimpleTable rows={items} columns={[{ key: 'worker', label: 'Worker', render: (row) => valueText(row.worker?.display_name ?? row.worker_id) }, { key: 'runtime_status', label: 'Status', render: (row) => <PssrTrainingAssignmentStatusBadge status={row.runtime_status ?? row.assignment_status} /> }, { key: 'due_date', label: 'Due' }, { key: 'evidence_status', label: 'Evidence' }, { key: 'verification_status', label: 'Verification' }, { key: 'last_notification_sent_at', label: 'Last Notification' }]} />}</RowsPanel>;
}

