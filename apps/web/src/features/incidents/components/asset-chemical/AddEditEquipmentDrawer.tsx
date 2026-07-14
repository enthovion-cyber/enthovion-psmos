import { buttonPrimary } from '../shared/IncidentTabPrimitives';
import { DrawerShell, EquipmentForm } from './AssetPanelPrimitives';
export function AddEditEquipmentDrawer({ open, form, set, saving, onClose, onSave }: any) { return <DrawerShell open={open} title={form.id ? 'Edit Equipment' : 'Add Equipment'} onClose={onClose}><EquipmentForm form={form} set={set} /><div className="mt-4 flex justify-end"><button disabled={saving} onClick={onSave} className={buttonPrimary}>{saving ? 'Saving...' : 'Save equipment'}</button></div></DrawerShell>; }
