import { RowsPanel, SimpleTable, valueText } from '../PssrTrainingPanelPrimitives';

export function PssrTrainingEvidenceTab({ rows = [] }: { rows?: any[] | undefined }) {
  return <RowsPanel title="Evidence and Verification" subtitle="Attendance, SOP acknowledgement, assessment, certificate and uploaded evidence status per worker." rows={rows} emptyTitle="No evidence records" emptyMessage="Evidence appears after assignments are generated and completions are submitted.">{(items) => <SimpleTable rows={items} columns={[{ key: 'worker', label: 'Worker', render: (row) => valueText(row.worker?.display_name ?? row.worker_id) }, { key: 'attendance_status', label: 'Attendance' }, { key: 'sop_ack_status', label: 'SOP Ack' }, { key: 'assessment_status', label: 'Assessment' }, { key: 'certificate_status', label: 'Certificate' }, { key: 'evidence_status', label: 'Evidence' }, { key: 'verification_status', label: 'Verification' }]} />}</RowsPanel>;
}

