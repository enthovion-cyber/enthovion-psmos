import { useEffect, useState, type ReactNode } from 'react';
import type { LopaReviewParticipantInput } from '../../types/lopa-review-signoff.types';

const fresh = (): LopaReviewParticipantInput => ({ userId: '', reviewRole: 'Technical Reviewer', discipline: '', requiredReviewer: true, approver: false, signatureRequired: false, reviewSequence: 10, dueDate: '' });

export function AddEditReviewerDialog({ open, initial, context, onClose, onSave, saving }: { open: boolean; initial?: Partial<LopaReviewParticipantInput> | undefined; context: any; onClose: () => void; onSave: (input: LopaReviewParticipantInput) => void; saving?: boolean | undefined }) {
  const [form, setForm] = useState<LopaReviewParticipantInput>(fresh());
  useEffect(() => { if (open) setForm({ ...fresh(), ...initial }); }, [open, initial]);
  if (!open) return null;
  const set = <K extends keyof LopaReviewParticipantInput>(key: K, value: LopaReviewParticipantInput[K]) => setForm((previous) => ({ ...previous, [key]: value }));
  const members = context?.teamMembers ?? [];
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"><form onSubmit={(event) => { event.preventDefault(); onSave(form); }} className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-xl border border-cyan-300/20 bg-[#071525] p-5">
    <h2 className="text-lg font-black text-white">{initial?.userId ? 'Edit Review Assignment' : 'Add Reviewer / Approver'}</h2>
    <p className="mt-1 text-sm text-slate-400">Only active LOPA team members are offered. The backend revalidates IAM eligibility and assignment scope.</p>
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <Field label="Team member"><select required value={form.userId} onChange={(event) => { const member = members.find((row: any) => row.user_id === event.target.value); set('userId', event.target.value); if (member?.discipline && !form.discipline) set('discipline', member.discipline); }}><option value="">Select active team member</option>{members.filter((member: any) => member.user_id && member.participation_status !== 'Removed').map((member: any) => <option key={member.id} value={member.user_id}>{member.full_name} - {member.study_role}</option>)}</select></Field>
      <Field label="Review role"><select value={form.reviewRole} onChange={(event) => set('reviewRole', event.target.value)}>{(context?.reviewRoles ?? []).map((role: string) => <option key={role}>{role}</option>)}</select></Field>
      <Field label="Discipline"><input value={form.discipline ?? ''} onChange={(event) => set('discipline', event.target.value)} /></Field>
      <Field label="Review sequence"><input type="number" min="1" value={form.reviewSequence ?? 10} onChange={(event) => set('reviewSequence', Number(event.target.value))} /></Field>
      <Field label="Due date"><input type="datetime-local" value={form.dueDate ?? ''} onChange={(event) => set('dueDate', event.target.value)} /></Field>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">{([['requiredReviewer', 'Required reviewer'], ['approver', 'Approver'], ['signatureRequired', 'E-signature required']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-lg border border-cyan-300/10 p-3 text-sm text-slate-200"><input type="checkbox" checked={!!form[key]} onChange={(event) => set(key, event.target.checked)} />{label}</label>)}</div>
    {!members.length ? <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-100">No eligible LOPA team members are available. Add active members in Team & Sessions before assigning review roles.</div> : null}
    <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="lopa-button-secondary">Cancel</button><button disabled={saving || !form.userId} className="lopa-button-primary">{saving ? 'Saving...' : 'Save Assignment'}</button></div>
  </form></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-1 text-sm text-slate-300"><span>{label}</span>{children}</label>; }
