import { inputClass, LibraryDialog, LibraryField, selectClass } from '../libraries/LibraryShared';

export function AddLinkedRecordDialog({ open, onClose, form, setForm, context, onSave, saving }: any) {
  const update = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));
  return (
    <LibraryDialog title="Add Linked Record" subtitle="Stores relationship metadata and a safe snapshot. Source module data is not duplicated." open={open} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LibraryField label="Source module"><select className={selectClass} value={form.sourceModule ?? ''} onChange={(e) => update('sourceModule', e.target.value)}><option value="">Select</option>{(context.modules ?? ['HAZOP', 'MOC', 'PSSR', 'Equipment', 'Document', 'Action', 'Incident', 'Audit', 'IPL Registry']).map((x: string) => <option key={x}>{x}</option>)}</select></LibraryField>
        <LibraryField label="Record type"><input className={inputClass} value={form.recordType ?? ''} onChange={(e) => update('recordType', e.target.value)} /></LibraryField>
        <LibraryField label="Source record ID"><input className={inputClass} value={form.sourceRecordId ?? ''} onChange={(e) => update('sourceRecordId', e.target.value)} /></LibraryField>
        <LibraryField label="Record number"><input className={inputClass} value={form.recordNumber ?? ''} onChange={(e) => update('recordNumber', e.target.value)} /></LibraryField>
        <LibraryField label="Record title"><input className={inputClass} value={form.recordTitle ?? ''} onChange={(e) => update('recordTitle', e.target.value)} /></LibraryField>
        <LibraryField label="Relationship type"><select className={selectClass} value={form.relationshipType ?? ''} onChange={(e) => update('relationshipType', e.target.value)}><option value="">Select</option>{(context.relationshipTypes ?? ['Source', 'Dependency', 'Evidence', 'Blocking', 'Reference']).map((x: string) => <option key={x}>{x}</option>)}</select></LibraryField>
        <LibraryField label="Impact level"><select className={selectClass} value={form.impactLevel ?? 'Medium'} onChange={(e) => update('impactLevel', e.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></LibraryField>
        <LibraryField label="Link reason"><input className={inputClass} value={form.linkReason ?? ''} onChange={(e) => update('linkReason', e.target.value)} /></LibraryField>
        <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={!!form.required} onChange={(e) => update('required', e.target.checked)} />Required link</label>
        <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={!!form.blocking} onChange={(e) => update('blocking', e.target.checked)} />Blocks review/closure</label>
        <LibraryField label="Notes"><textarea className={inputClass} rows={4} value={form.notes ?? ''} onChange={(e) => update('notes', e.target.value)} /></LibraryField>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="lopa-button-secondary" onClick={onClose}>Cancel</button><button className="lopa-button-primary" disabled={saving} onClick={onSave}>{saving ? 'Saving...' : 'Save Link'}</button></div>
    </LibraryDialog>
  );
}
