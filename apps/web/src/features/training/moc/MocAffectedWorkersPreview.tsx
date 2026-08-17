import { RowsPanel, SimpleTable, valueText } from './MocTrainingPanelPrimitives';

export function MocAffectedWorkersPreview({ rows = [] }: { rows?: any[] }) {
  return <RowsPanel title="Affected Workers Preview" subtitle="Previewed from backend worker/site/unit/area/role scope before assignment generation." rows={rows} emptyTitle="No preview rows" emptyMessage="Run preview or impact check to identify affected workers.">{(items) => <SimpleTable rows={items} columns={[{ key: 'worker', label: 'Worker', render: (row) => valueText(row.worker?.display_name ?? row.display_name ?? row.worker_id) }, { key: 'reason', label: 'Reason', render: (row) => valueText(row.impact_reason ?? row.reason) }, { key: 'assignment_required', label: 'Assignment Required', render: (row) => valueText(row.assignment_required) }]} />}</RowsPanel>;
}
