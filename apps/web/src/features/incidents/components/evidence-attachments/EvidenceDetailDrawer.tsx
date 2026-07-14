import { InfoRows, formatDate } from '../shared/IncidentTabPrimitives';
import { DrawerShell } from './EvidencePrimitives';

export function EvidenceDetailDrawer({ open, row, onClose }: any) {
  return (
    <DrawerShell open={open} title="Evidence Detail" onClose={onClose}>
      <InfoRows rows={[
        ['File name', row?.file_name],
        ['Evidence type', row?.evidence_type],
        ['Classification', row?.classification],
        ['Restricted', row?.restricted ? 'Yes' : 'No'],
        ['Confidential', row?.confidential ? 'Yes' : 'No'],
        ['Medical confidential', row?.medical_confidential ? 'Yes' : 'No'],
        ['Storage provider', row?.storage_provider],
        ['Storage key', row?.storage_key],
        ['Related tab', row?.related_tab],
        ['Related record', row?.related_record_type],
        ['Review status', row?.review_status],
        ['Uploaded at', formatDate(row?.created_at ?? row?.uploaded_at)]
      ]} />
      <p className="mt-3 text-xs text-slate-500">{row?.description ?? row?.notes}</p>
    </DrawerShell>
  );
}
