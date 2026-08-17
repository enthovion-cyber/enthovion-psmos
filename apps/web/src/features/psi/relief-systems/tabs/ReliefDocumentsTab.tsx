import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import type { ReliefSystemDetail } from '../../types/relief-system.types';
import { ReliefSystemFieldGrid, valueOf } from '../ReliefSystemFieldGrid';

export function ReliefDocumentsTab({ detail }: { detail: ReliefSystemDetail }) {
  return (
    <PsiCard title="Documents" subtitle="Controlled document snapshots for relief calculation, P&ID, datasheet, flare study, MOC/PSSR, MI certificates, procedures, and reviews.">
      {!detail.documents.length ? <PsiEmptyState title="No controlled documents linked" message="Link the relief calculation, P&ID, datasheet, and supporting basis documents before review." /> : (
        <div className="space-y-4">{detail.documents.map((row) => <ReliefSystemFieldGrid key={String(row.id ?? row.document_id)} items={[
          { label: 'Document ID', value: valueOf(row, 'document_id') },
          { label: 'Document type', value: valueOf(row, 'document_type') },
          { label: 'Document number', value: valueOf(row, 'document_number') },
          { label: 'Title', value: valueOf(row, 'document_title') },
          { label: 'Revision', value: valueOf(row, 'document_revision') },
          { label: 'Status', value: valueOf(row, 'document_status') },
          { label: 'Snapshot at', value: valueOf(row, 'snapshot_at') }
        ]} />)}</div>
      )}
    </PsiCard>
  );
}
