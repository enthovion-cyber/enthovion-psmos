import { RowsPanel, SimpleTable, valueText } from '../MocTrainingPanelPrimitives';

export function MocAffectedWorkersSection({ rows = [] }: { rows?: any[] }) {
  return <RowsPanel title="Affected Workers" subtitle="Backend-selected workers from site/unit/area/role/task scope." rows={rows} emptyTitle="No affected workers" emptyMessage="Run an impact check or add affected workers to generate assignments.">{(items) => <SimpleTable rows={items} columns={[{ key: 'worker', label: 'Worker', render: (row) => valueText(row.worker?.display_name ?? row.worker_id) }, { key: 'impact_reason', label: 'Reason' }, { key: 'assignment_required', label: 'Assignment Required', render: (row) => valueText(row.assignment_required) }, { key: 'status', label: 'Status', render: (row) => valueText(row.affected_worker_status ?? row.status) }]} />}</RowsPanel>;
}
