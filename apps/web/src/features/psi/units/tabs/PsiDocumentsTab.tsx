import type { PsiUnitDetailResponse } from '../../types/psi-unit.types';
import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';

export function PsiDocumentsTab({ detail }: { detail: PsiUnitDetailResponse }) {
  return <PsiCard title="Documents Foundation" subtitle="Document Control links only. PSI snapshots document number, title, status, and revision; no raw files are stored here.">{detail.documents.length ? <div className="space-y-2">{detail.documents.map((doc) => <div key={String(doc.id)} className="rounded-lg border border-[var(--psm-line)] p-3"><p className="font-semibold">{String(doc.document_number ?? doc.document_id)} - {String(doc.document_title ?? 'Untitled document')}</p><p className="text-sm text-[var(--psm-muted)]">{String(doc.document_type ?? 'Document')} / {String(doc.document_status ?? 'Unknown')} / Rev {String(doc.document_revision ?? '-')}</p></div>)}</div> : <PsiEmptyState title="No documents linked" message="Link PFD, P&ID, process descriptions, SOPs, relief basis, HAZOP/LOPA reports, MOC packages, and other required PSI documents through Document Control." />}</PsiCard>;
}
