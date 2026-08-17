import { PsiButton, PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import type { SafeguardLookups } from '../../types/safeguard.types';
import { FieldGrid, SelectInput, TextInput, Toggle } from '../SafeguardPrimitives';

export function SafeguardDocumentsEvidenceSection({ existing, draft, lookups, onDraftChange, onAdd, busy }: { existing: Array<Record<string, any>>; draft: Record<string, any>; lookups: SafeguardLookups; onDraftChange: (patch: Record<string, any>) => void; onAdd?: (() => void) | undefined; busy?: boolean | undefined }) {
  return <PsiCard title="7. Documents / Evidence" subtitle="Document Control links only. No raw files are stored in Safeguards tables. Critical safeguards need current evidence or configured waiver.">
    {!existing.length ? <PsiEmptyState title="No evidence linked" message="Link approved Document Control evidence such as design basis, cause/effect matrix, SRS, SOP, proof test procedure, PSV datasheet, HAZOP/LOPA worksheet, MOC/PSSR package, or approval note." /> : <div className="mb-4 grid gap-3 md:grid-cols-2">{existing.map((doc) => <article key={doc.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{doc.document_title ?? doc.document_id}</p><p className="text-sm text-[var(--psm-muted)]">{doc.document_type} / {doc.document_status ?? 'Status from Document Control not returned'} / Rev {doc.revision_number ?? '-'}</p></article>)}</div>}
    <FieldGrid>
      <TextInput label="Document Control document ID" value={draft.document_id} onChange={(document_id) => onDraftChange({ document_id })} />
      <SelectInput label="Document type" value={draft.document_type} options={lookups.documentTypes} onChange={(document_type) => onDraftChange({ document_type })} />
      <TextInput label="Relationship type" value={draft.relationship_type} onChange={(relationship_type) => onDraftChange({ relationship_type })} />
      <TextInput label="Document number" value={draft.document_number} onChange={(document_number) => onDraftChange({ document_number })} />
      <TextInput label="Document title" value={draft.document_title} onChange={(document_title) => onDraftChange({ document_title })} />
      <TextInput label="Document status" value={draft.document_status} onChange={(document_status) => onDraftChange({ document_status })} />
      <TextInput label="Revision number" value={draft.revision_number} onChange={(revision_number) => onDraftChange({ revision_number })} />
      <Toggle label="Required evidence" checked={draft.required} onChange={(required) => onDraftChange({ required })} />
      <Toggle label="Readiness impact" checked={draft.readiness_impact} onChange={(readiness_impact) => onDraftChange({ readiness_impact })} />
    </FieldGrid>
    {onAdd ? <div className="mt-4"><PsiButton onClick={onAdd} disabled={busy || !draft.document_id} title={!draft.document_id ? 'Document ID is required.' : undefined}>{busy ? 'Saving...' : 'Link Document Evidence'}</PsiButton></div> : null}
  </PsiCard>;
}
