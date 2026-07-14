import { Field, SelectField, TextArea, ToggleGrid, buttonPrimary, buttonSecondary } from '../shared/IncidentTabPrimitives';
import { DrawerShell, profileStatuses } from './InvestigationTeamPrimitives';

export function ChangeReplaceTeamMemberDrawer({ open, currentMember, form, set, saving, onClose, onSave }: any) {
  return (
    <DrawerShell open={open} title="Change / Replace Team Member" onClose={onClose}>
      <div className="grid gap-4">
        <section className="rounded-xl border border-slate-200 p-3 text-xs dark:border-cyan-300/10">
          <div className="font-black">Current member</div>
          <div className="mt-1 text-slate-500">{currentMember?.display_name ?? currentMember?.email ?? 'No member selected'} · {currentMember?.team_role ?? '-'}</div>
        </section>

        <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-cyan-300/10 md:grid-cols-2">
          <div className="md:col-span-2"><h3 className="text-xs font-black uppercase text-slate-500">Replacement User / Profile</h3></div>
          <Field label="Replacement user/person search" value={form.replacementSearch ?? form.replacementDisplayName} onChange={(value) => set('replacementSearch', value)} />
          <Field label="Replacement user ID" value={form.replacementUserId} onChange={(value) => set('replacementUserId', value)} />
          <Field label="Replacement name" value={form.replacementDisplayName} onChange={(value) => set('replacementDisplayName', value)} />
          <Field label="Replacement email" value={form.replacementEmail} onChange={(value) => set('replacementEmail', value)} />
          <SelectField label="Detected replacement profile" value={form.replacementProfileStatus} options={profileStatuses} onChange={(value) => set('replacementProfileStatus', value)} />
          <Field label="Effective date" type="datetime-local" value={form.effectiveAt} onChange={(value) => set('effectiveAt', value)} />
        </section>

        <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-cyan-300/10">
          <ToggleGrid form={form} set={set} keys={[['transferResponsibilities', 'Transfer responsibilities'], ['transferRaciAssignments', 'Transfer RACI assignments'], ['notifyOldMember', 'Notify old member'], ['notifyNewMember', 'Notify new member'], ['newMemberAcceptanceRequired', 'New member acceptance required']]} />
          <TextArea label="Replacement reason" value={form.replacementReason} onChange={(value) => set('replacementReason', value)} />
          <TextArea label="Notes" value={form.notes} onChange={(value) => set('notes', value)} />
        </section>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button className={buttonSecondary} onClick={onClose}>Cancel</button>
        <button className={buttonPrimary} disabled={saving || !form.replacementReason} title={!form.replacementReason ? 'Replacement reason is required.' : ''} onClick={onSave}>{saving ? 'Saving...' : 'Save Replacement'}</button>
      </div>
    </DrawerShell>
  );
}
