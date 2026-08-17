import { RowsPanel, SimpleTable, valueText } from '../PssrTrainingPanelPrimitives';

export function PssrRequiredWorkersSection({ rows = [] }: { rows?: any[] }) {
  return <RowsPanel title="Required Workers" subtitle="Backend-selected workers from site/unit/area/role/task scope." rows={rows} emptyTitle="No required workers" emptyMessage="Run an impact check or add required workers to generate assignments.">{(items) => <SimpleTable rows={items} columns={[{ key: 'worker', label: 'Worker', render: (row) => valueText(row.worker?.display_name ?? row.worker_id) }, { key: 'impact_reason', label: 'Reason' }, { key: 'assignment_required', label: 'Assignment Required', render: (row) => valueText(row.assignment_required) }, { key: 'status', label: 'Status', render: (row) => valueText(row.affected_worker_status ?? row.status) }]} />}</RowsPanel>;
}

