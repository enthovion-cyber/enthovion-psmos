import { buttonPrimary } from '../shared/IncidentTabPrimitives';
import { DrawerShell, TimelineEventForm } from './TimelinePrimitives';
export function AddEditTimelineEventDrawer({ open, form, set, saving, onClose, onSave }: any) { return <DrawerShell open={open} title={form.id ? 'Edit Timeline Event' : 'Add Timeline Event'} onClose={onClose}><TimelineEventForm form={form} set={set} /><div className="mt-4 flex justify-end"><button disabled={saving} onClick={onSave} className={buttonPrimary}>{saving ? 'Saving...' : 'Save event'}</button></div></DrawerShell>; }
