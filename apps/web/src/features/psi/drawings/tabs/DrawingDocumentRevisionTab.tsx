import { DocumentControlLinkDialog } from '../DocumentControlLinkDialog';
import { DocumentStatusBadge } from '../../shared/DocumentStatusBadge';
import { CurrentApprovedBadge } from '../../shared/CurrentApprovedBadge';
import { PsiCard } from '../../shared/PsiUi';
import type { DrawingDetail } from '../../types/drawing.types';

export function DrawingDocumentRevisionTab({ detail }: { detail: DrawingDetail }) {
  return <div className="space-y-5"><DocumentControlLinkDialog drawingId={detail.drawing.id} /><PsiCard title="Document / Revision History" subtitle="Controlled document snapshots linked to this drawing.">{!detail.documents.length ? <p className="text-sm text-[var(--psm-muted)]">No controlled document is linked.</p> : <div className="space-y-3">{detail.documents.map((doc) => <div key={doc.id} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{doc.document_number ?? doc.document_id}</p><div className="flex gap-2"><DocumentStatusBadge value={doc.document_status ?? null} /><CurrentApprovedBadge value={doc.current_approved} /></div></div><p className="text-sm text-[var(--psm-muted)]">{doc.document_title ?? 'No title'} • Revision {doc.revision_number ?? '-'}</p></div>)}</div>}</PsiCard></div>;
}
