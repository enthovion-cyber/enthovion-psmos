import { buttonPrimary } from '../shared/IncidentTabPrimitives';
import { LinkedRecordDrawerForm } from './LinkedRecordsPrimitives';
export function AddLinkRecordDrawer({ open, form, set, context, saving, onClose, onSave }: any) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-black/40"><aside className="ml-auto h-full w-full overflow-y-auto bg-white p-5 shadow-xl dark:bg-[#071525] md:max-w-4xl">
    <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">{form.id ? 'Edit Linked Record' : 'Add / Link Record'}</h2><button onClick={onClose} className="rounded-lg border px-3 py-1 text-xs">Close</button></div>
    <LinkedRecordDrawerForm form={form} set={set} context={context} />
    <button disabled={saving} onClick={onSave} className={`${buttonPrimary} mt-4`}>Save Link</button>
  </aside></div>;
}
