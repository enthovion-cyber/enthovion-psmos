'use client';

import { PsiButton, PsiCard } from '../../shared/PsiUi';
import type { ElectricalDocumentLink, ElectricalLookups } from '../../types/electrical-classification.types';
import { ElectricalFieldGrid } from '../ElectricalFieldGrid';

export function ElectricalClassificationDocumentsSection({ value, lookups, draft, onDraftChange, onAdd, busy }: { value: ElectricalDocumentLink[]; lookups: ElectricalLookups; draft: Record<string, any>; onDraftChange: (patch: Record<string, any>) => void; onAdd?: (() => void) | undefined; busy?: boolean | undefined }) {
  return (
    <PsiCard title="7. Drawings / Documents" subtitle="Link Document Control drawings, area classification plans, calculations, SDS basis, equipment certificates, MOC/PSSR/MI evidence, and snapshot number/status/revision.">
      <ElectricalFieldGrid value={draft} onChange={onDraftChange} fields={[{ key: 'document_id', label: 'Document Control ID' }, { key: 'document_type', label: 'Document type', type: 'select', options: lookups.electricalDocumentTypes }, { key: 'document_number_snapshot', label: 'Document number snapshot' }, { key: 'document_title_snapshot', label: 'Document title snapshot' }, { key: 'revision_number', label: 'Revision' }, { key: 'document_status', label: 'Status' }, { key: 'required', label: 'Required evidence', type: 'checkbox' }]} />
      {onAdd ? <div className="mt-3"><PsiButton onClick={onAdd} disabled={busy} title={busy ? 'Linking document.' : undefined}>Link Document</PsiButton></div> : null}
      <div className="mt-4 grid gap-2">{value.length ? value.map((doc) => <div key={doc.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><p className="font-semibold">{doc.document_number_snapshot || doc.document_id} - {doc.document_title_snapshot || doc.document_type}</p><p className="text-[var(--psm-muted)]">{doc.document_type} / Rev {doc.revision_number || 'N/A'} / {doc.document_status || 'Status missing'} / {doc.required ? 'Required' : 'Optional'}</p></div>) : <p className="text-sm text-[var(--psm-muted)]">No controlled document links yet.</p>}</div>
    </PsiCard>
  );
}
