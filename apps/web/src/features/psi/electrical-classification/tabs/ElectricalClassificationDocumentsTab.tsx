import { PsiCard } from '../../shared/PsiUi';
import type { ElectricalDetail } from '../../types/electrical-classification.types';

export function ElectricalClassificationDocumentsTab({ detail }: { detail: ElectricalDetail }) {
  return <PsiCard title="Drawings / Documents" subtitle="Controlled Document links with document number, title, status, revision snapshot, required evidence flags, and refresh needs."><div className="grid gap-2">{detail.documents.length ? detail.documents.map((doc) => <div key={doc.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{doc.document_number_snapshot || doc.document_id} - {doc.document_title_snapshot || doc.document_type}</p><p className="text-sm text-[var(--psm-muted)]">{doc.document_type} / Rev {doc.revision_number || 'N/A'} / {doc.document_status || 'Status missing'} / {doc.required ? 'Required' : 'Optional'}</p></div>) : <p className="text-sm text-[var(--psm-muted)]">No controlled documents linked yet.</p>}</div></PsiCard>;
}
