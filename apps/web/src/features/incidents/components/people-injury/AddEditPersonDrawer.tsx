import { buttonPrimary } from '../shared/IncidentTabPrimitives';
import { DrawerShell, PersonForm } from './PeoplePanelPrimitives';

export function AddEditPersonDrawer({ open, form, set, saving, onClose, onSave }: any) {
  return <DrawerShell open={open} title={form.id ? 'Edit Person / Injury / Exposure' : 'Add Person / Injury / Exposure'} onClose={onClose}><PersonForm form={form} set={set} /><div className="mt-4 flex justify-end"><button disabled={saving} onClick={onSave} className={buttonPrimary}>{saving ? 'Saving...' : 'Save person'}</button></div></DrawerShell>;
}
