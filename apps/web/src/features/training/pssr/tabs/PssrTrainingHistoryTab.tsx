import { RowsPanel, SimpleTable, valueText } from '../PssrTrainingPanelPrimitives';

export function PssrTrainingHistoryTab({ rows = [] }: { rows?: any[] | undefined }) {
  return <RowsPanel title="History" subtitle="Immutable PSSR training history events from backend audit/history integration." rows={rows} emptyTitle="No history events" emptyMessage="History events are written when readiness records, assignments, blockers, waivers and readiness checks change.">{(items) => <SimpleTable rows={items} columns={[{ key: 'event_type', label: 'Event' }, { key: 'event_title', label: 'Title' }, { key: 'actor_user_id', label: 'Actor' }, { key: 'created_at', label: 'Created' }, { key: 'source_record_id', label: 'Record', render: (row) => valueText(row.source_record_id) }]} />}</RowsPanel>;
}

