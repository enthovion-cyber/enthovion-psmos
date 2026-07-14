import { LibraryDialog, LibraryField } from '../libraries/LibraryShared';
import { fieldClass } from './TeamSessionsUi';

export function CreateEditSessionDialog({ open, onClose, form, setForm, context, members, onSave, saving }: any) {
  const update = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));
  return (
    <LibraryDialog title="Create / Edit Session" subtitle="Schedule LOPA workshops with agenda, attendance, quorum, and minutes tracking." open={open} onClose={onClose}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LibraryField label="Session title"><input className={fieldClass} value={form.title ?? ''} onChange={(event) => update('title', event.target.value)} /></LibraryField>
        <LibraryField label="Session type"><select className={fieldClass} value={form.sessionType ?? ''} onChange={(event) => update('sessionType', event.target.value)}><option value="">Select</option>{(context.sessionTypes ?? []).map((type: string) => <option key={type}>{type}</option>)}</select></LibraryField>
        <LibraryField label="Start time"><input type="datetime-local" className={fieldClass} value={form.startTime ?? ''} onChange={(event) => update('startTime', event.target.value)} /></LibraryField>
        <LibraryField label="End time"><input type="datetime-local" className={fieldClass} value={form.endTime ?? ''} onChange={(event) => update('endTime', event.target.value)} /></LibraryField>
        <LibraryField label="Location"><input className={fieldClass} value={form.location ?? ''} onChange={(event) => update('location', event.target.value)} /></LibraryField>
        <LibraryField label="Meeting link"><input className={fieldClass} value={form.meetingLink ?? ''} onChange={(event) => update('meetingLink', event.target.value)} /></LibraryField>
        <LibraryField label="Facilitator"><select className={fieldClass} value={form.facilitatorMemberId ?? ''} onChange={(event) => update('facilitatorMemberId', event.target.value)}><option value="">Select</option>{(members ?? []).map((member: any) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select></LibraryField>
        <LibraryField label="Scribe"><select className={fieldClass} value={form.scribeMemberId ?? ''} onChange={(event) => update('scribeMemberId', event.target.value)}><option value="">Select</option>{(members ?? []).map((member: any) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select></LibraryField>
        <LibraryField label="Description"><textarea className={fieldClass} rows={3} value={form.description ?? ''} onChange={(event) => update('description', event.target.value)} /></LibraryField>
        <LibraryField label="Agenda template"><textarea className={fieldClass} rows={3} value={form.agendaTemplate ?? ''} onChange={(event) => update('agendaTemplate', event.target.value)} /></LibraryField>
        <label className="flex gap-2 text-sm text-slate-200"><input type="checkbox" checked={!!form.sendCalendarInvite} onChange={(event) => update('sendCalendarInvite', event.target.checked)} />Send calendar invite if configured</label>
        <label className="flex gap-2 text-sm text-slate-200"><input type="checkbox" checked={!!form.sendNotification} onChange={(event) => update('sendNotification', event.target.checked)} />Send notification</label>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button className="lopa-button-secondary" onClick={onClose}>Cancel</button><button className="lopa-button-primary" disabled={saving} onClick={onSave}>{saving ? 'Saving...' : 'Save Session'}</button></div>
    </LibraryDialog>
  );
}
