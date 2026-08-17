import { RowsPanel, SimpleTable, valueText } from '../PssrTrainingPanelPrimitives';

export function PssrTrainingImpactTab({ rows = [] }: { rows?: any[] | undefined }) {
  return <RowsPanel title="Training Impact Checks" subtitle="Backend-generated impact decisions and reasons from PSSR scope, risk, SOP/PSI/PTW/PSSR changes." rows={rows} emptyTitle="No impact checks" emptyMessage="Run an impact check from the detail header or PSSR page.">{(items) => <SimpleTable rows={items} columns={[{ key: 'check_status', label: 'Status' }, { key: 'training_required', label: 'Training Required', render: (row) => valueText(row.training_required) }, { key: 'impact_level', label: 'Impact' }, { key: 'check_basis', label: 'Basis' }, { key: 'evaluated_at', label: 'Evaluated' }, { key: 'manual_review_required', label: 'Manual Review', render: (row) => valueText(row.manual_review_required) }]} />}</RowsPanel>;
}

