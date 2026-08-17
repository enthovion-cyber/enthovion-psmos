import { MocTrainingBlockerBadge } from '../shared/MOCTrainingBlockerBadge';
import { SimpleTable, valueText } from './MocTrainingPanelPrimitives';

export function MocTrainingBlockerTable({ rows = [] }: { rows?: any[] }) {
  return <SimpleTable rows={rows} columns={[{ key: 'blocker_title', label: 'Blocker', render: (row) => <div><p className="font-semibold">{valueText(row.blocker_title)}</p><p className="text-xs text-[var(--psm-muted)]">{valueText(row.blocker_description)}</p></div> }, { key: 'blocker_type', label: 'Type' }, { key: 'blocker_status', label: 'Status', render: (row) => <MocTrainingBlockerBadge status={row.blocker_status} /> }, { key: 'severity', label: 'Severity' }, { key: 'due_date', label: 'Due' }, { key: 'waiver_status', label: 'Waiver' }]} />;
}
