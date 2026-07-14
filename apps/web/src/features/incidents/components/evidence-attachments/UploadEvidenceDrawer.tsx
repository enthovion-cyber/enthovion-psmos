import { buttonPrimary, buttonSecondary } from '../shared/IncidentTabPrimitives';
import { DrawerShell, EvidenceForm } from './EvidencePrimitives';

export function UploadEvidenceDrawer({ open, form, set, saving, onClose, onSave }: any) {
  return (
    <DrawerShell open={open} title={form.id ? 'Edit Evidence / Attachment' : 'Upload Evidence / Attachment'} onClose={onClose}>
      <div className="mb-3 rounded-lg border border-slate-200 p-3 text-xs text-slate-500 dark:border-cyan-300/10">
        File content must be stored through the configured storage service. This drawer captures controlled metadata, storage key, classification, mappings, and review state.
      </div>
      <EvidenceForm form={form} set={set} />
      <div className="mt-4 flex justify-end gap-2">
        <button className={buttonSecondary} onClick={onClose}>Cancel</button>
        <button className={buttonPrimary} disabled={saving} onClick={onSave}>{saving ? 'Saving...' : 'Save Evidence'}</button>
      </div>
    </DrawerShell>
  );
}
