import { MocTrainingWaiverStatusBadge } from '../../shared/MocTrainingWaiverStatusBadge';
import { RowsPanel, SimpleTable, valueText } from '../MocTrainingPanelPrimitives';

export function MocTrainingWaiversTab({ rows = [] }: { rows?: any[] | undefined }) {
  return <RowsPanel title="Waivers" subtitle="Controlled risk-accepted waivers that preserve blocker history and readiness state." rows={rows} emptyTitle="No waivers" emptyMessage="Waiver requests linked to MOC training blockers will appear here.">{(items) => <SimpleTable rows={items} columns={[{ key: 'waiver_reason', label: 'Reason' }, { key: 'approval_status', label: 'Approval', render: (row) => <MocTrainingWaiverStatusBadge status={row.approval_status ?? row.waiver_status} /> }, { key: 'risk_acceptance_basis', label: 'Risk Basis' }, { key: 'requested_by', label: 'Requested By' }, { key: 'approved_by', label: 'Approved By' }, { key: 'expires_at', label: 'Expires' }, { key: 'blocker', label: 'Blocker', render: (row) => valueText(row.blocker?.blocker_title ?? row.blocker_id) }]} />}</RowsPanel>;
}
