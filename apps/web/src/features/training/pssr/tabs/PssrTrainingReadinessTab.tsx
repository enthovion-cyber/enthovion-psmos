import { PssrTrainingReadinessStatusBadge } from '../../shared/PssrTrainingReadinessStatusBadge';
import { RowsPanel, SimpleTable, valueText } from '../PssrTrainingPanelPrimitives';

export function PssrTrainingReadinessTab({ rows = [] }: { rows?: any[] | undefined }) {
  return <RowsPanel title="Readiness Checks" subtitle="Backend readiness for PSSR approval, startup and handover blocking." rows={rows} emptyTitle="No readiness checks" emptyMessage="Run readiness to generate approval, handover and startup blocker state.">{(items) => <SimpleTable rows={items} columns={[{ key: 'readiness_status', label: 'Readiness', render: (row) => <PssrTrainingReadinessStatusBadge status={row.readiness_status} /> }, { key: 'approval_ready', label: 'Approval Ready', render: (row) => valueText(row.approval_ready) }, { key: 'handover_ready', label: 'Handover Ready', render: (row) => valueText(row.handover_ready) }, { key: 'startup_ready', label: 'Startup Ready', render: (row) => valueText(row.startup_ready) }, { key: 'blockers_json', label: 'Blockers', render: (row) => Array.isArray(row.blockers_json) ? row.blockers_json.length : valueText(row.blockers_json) }, { key: 'evaluated_at', label: 'Evaluated' }]} />}</RowsPanel>;
}

