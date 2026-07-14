import { buttonPrimary } from '../shared/IncidentTabPrimitives';
import { ChemicalForm, DrawerShell } from './AssetPanelPrimitives';
export function AddEditChemicalDrawer({ open, form, set, saving, onClose, onSave }: any) { return <DrawerShell open={open} title={form.id ? 'Edit Chemical / Material' : 'Add Chemical / Material'} onClose={onClose}><ChemicalForm form={form} set={set} /><div className="mt-4 flex justify-end"><button disabled={saving} onClick={onSave} className={buttonPrimary}>{saving ? 'Saving...' : 'Save chemical'}</button></div></DrawerShell>; }
