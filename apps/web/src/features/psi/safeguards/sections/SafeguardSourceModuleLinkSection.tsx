import { PsiButton, PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import type { SafeguardLookups } from '../../types/safeguard.types';
import { FieldGrid, SelectInput, TextArea, TextInput } from '../SafeguardPrimitives';

export function SafeguardSourceModuleLinkSection({ existing, draft, lookups, onDraftChange, onAdd, busy }: { existing: Array<Record<string, any>>; draft: Record<string, any>; lookups: SafeguardLookups; onDraftChange: (patch: Record<string, any>) => void; onAdd?: (() => void) | undefined; busy?: boolean | undefined }) {
  return <PsiCard title="4. Source Module Link" subtitle="Link real SIS/SIF, interlock, alarm, PSV, relief, drawing, procedure, PTW/LOTO, F&G, equipment, MI, HAZOP, LOPA, MOC, PSSR, training, or clearly labeled manual placeholders.">
    {!existing.length ? <PsiEmptyState title="No source module linked" message="Critical safeguards require source link or approved manual reason. Source status is compared without silently overwriting source module lifecycle." /> : <div className="mb-4 grid gap-3 md:grid-cols-2">{existing.map((item) => <article key={item.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="font-semibold">{item.linked_record_tag_title ?? item.linked_module}</p><p className="text-sm text-[var(--psm-muted)]">{item.source_status ?? 'Source status not checked'} / {item.source_test_status ?? 'Test status missing'} / {item.source_bypass_impairment_status ?? 'No impairment returned'}</p></article>)}</div>}
    <FieldGrid>
      <SelectInput label="Linked module" value={draft.linked_module} options={lookups.sourceModules} onChange={(linked_module) => onDraftChange({ linked_module })} />
      <TextInput label="Linked record ID" value={draft.linked_record_id} onChange={(linked_record_id) => onDraftChange({ linked_record_id })} />
      <TextInput label="Linked record tag/title" value={draft.linked_record_tag_title} onChange={(linked_record_tag_title) => onDraftChange({ linked_record_tag_title })} />
      <TextInput label="Source status" value={draft.source_status} onChange={(source_status) => onDraftChange({ source_status })} />
      <TextInput label="Source readiness status" value={draft.source_readiness_status} onChange={(source_readiness_status) => onDraftChange({ source_readiness_status })} />
      <TextInput label="Source test/proof/inspection status" value={draft.source_test_status} onChange={(source_test_status) => onDraftChange({ source_test_status })} />
      <TextInput label="Source bypass/impairment status" value={draft.source_bypass_impairment_status} onChange={(source_bypass_impairment_status) => onDraftChange({ source_bypass_impairment_status })} />
      <TextInput label="Source document status" value={draft.source_document_status} onChange={(source_document_status) => onDraftChange({ source_document_status })} />
      <TextInput label="Source last verified date" type="date" value={draft.source_last_verified_date} onChange={(source_last_verified_date) => onDraftChange({ source_last_verified_date })} />
      <TextInput label="Source next due date" type="date" value={draft.source_next_due_date} onChange={(source_next_due_date) => onDraftChange({ source_next_due_date })} />
      <SelectInput label="Sync mode" value={draft.sync_mode} options={['Compare only', 'Pull source status', 'Manual / Needs Source Link']} onChange={(sync_mode) => onDraftChange({ sync_mode })} />
      <TextArea label="Sync notes" value={draft.sync_notes} onChange={(sync_notes) => onDraftChange({ sync_notes })} />
    </FieldGrid>
    {onAdd ? <div className="mt-4"><PsiButton onClick={onAdd} disabled={busy || !draft.linked_module} title={!draft.linked_module ? 'Linked module is required.' : undefined}>{busy ? 'Saving...' : 'Add Source Link'}</PsiButton></div> : null}
  </PsiCard>;
}
