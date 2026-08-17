import { FieldGrid, SelectInput, TextArea, TextInput, Toggle } from '../MaterialCompatibilityPrimitives';
import { PsiButton, PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import type { MaterialCompatibilityLookups } from '../../types/material-compatibility.types';

export function CompatibilityEvidenceSection({ documents, draft, lookups, busy, onDraftChange, onAdd }: { documents: Array<Record<string, any>>; draft: Record<string, any>; lookups: MaterialCompatibilityLookups; busy?: boolean | undefined; onDraftChange: (patch: Record<string, any>) => void; onAdd?: (() => void) | undefined }) {
  return (
    <PsiCard title="7. Evidence / References" subtitle="Link Document Control records and snapshot document number, title, status, revision, evidence type, requirement flag, and compatibility basis.">
      {!documents.length ? <PsiEmptyState title="No evidence linked" message="Material compatibility requires SDS, vendor data, compatibility charts, corrosion studies, metallurgy reports, inspection reports, MOC/PSSR records, or equivalent evidence where configured." /> : <div className="mb-4 grid gap-3 md:grid-cols-2">{documents.map((doc) => <div key={doc.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{doc.document_number ?? doc.document_id}</p><p className="text-sm text-[var(--psm-muted)]">{doc.document_title ?? doc.document_type}</p><p className="text-xs text-[var(--psm-muted)]">Revision {doc.document_revision ?? 'N/A'} - {doc.document_status ?? 'Status missing'}</p></div>)}</div>}
      <FieldGrid>
        <TextInput label="Document ID" value={draft.document_id} onChange={(document_id) => onDraftChange({ document_id })} />
        <SelectInput label="Document type" value={draft.document_type} options={lookups.compatibilityDocumentTypes} onChange={(document_type) => onDraftChange({ document_type })} />
        <TextInput label="Document number" value={draft.document_number} onChange={(document_number) => onDraftChange({ document_number })} />
        <TextInput label="Document title" value={draft.document_title} onChange={(document_title) => onDraftChange({ document_title })} />
        <TextInput label="Document revision" value={draft.document_revision} onChange={(document_revision) => onDraftChange({ document_revision })} />
        <TextInput label="Document status" value={draft.document_status} onChange={(document_status) => onDraftChange({ document_status })} />
        <Toggle label="Required evidence" checked={draft.required_evidence} onChange={(required_evidence) => onDraftChange({ required_evidence })} />
        <Toggle label="Restricted / controlled evidence" checked={draft.restricted} onChange={(restricted) => onDraftChange({ restricted })} />
        <TextArea label="Evidence notes" value={draft.notes} onChange={(notes) => onDraftChange({ notes })} />
      </FieldGrid>
      {onAdd ? <div className="mt-4 flex justify-end"><PsiButton onClick={onAdd} disabled={busy || !draft.document_id} title={busy ? 'Linking document.' : !draft.document_id ? 'Document ID is required.' : undefined}>Link Evidence</PsiButton></div> : null}
    </PsiCard>
  );
}
