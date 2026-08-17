import { PsiCard } from '../../shared/PsiUi';

export function ChemistryDocumentsSection({ documents }: { documents?: Record<string, any>[] | undefined }) {
  return (
    <PsiCard title="Documents / Linked Records" subtitle="Document Control references, reaction test reports, thermal screening, calorimetry, procedures, P&IDs, HAZOP/LOPA links, MOC/PSSR blockers, and evidence readiness.">
      {!documents?.length ? <p className="text-sm text-[var(--psm-muted)]">No controlled documents are linked yet.</p> : <ul className="space-y-2">{documents.map((doc) => <li key={String(doc.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">{doc.document_type ?? 'Document'} - {doc.document_id}</li>)}</ul>}
    </PsiCard>
  );
}
