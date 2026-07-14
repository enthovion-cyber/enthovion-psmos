'use client';

import { useEffect, useState } from 'react';
import type { HazopTeamMember } from '../../types/hazop-team.types';

export function AddEditTeamMemberDialog({ open, member, context, saving, onClose, onSave }: { open: boolean; member?: HazopTeamMember | undefined; context?: any; saving?: boolean; onClose: () => void; onSave: (values: Record<string, any>) => void }) {
  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => { if (open) setForm(member ? { userId: member.user_id ?? '', name: member.name ?? '', email: member.email ?? '', companyName: member.company_name ?? '', contractorCompanyId: (member as any).contractor_company_id ?? '', departmentId: member.department_id ?? '', discipline: member.discipline ?? '', studyRole: member.role ?? member.study_role ?? '', permissionLevel: member.permission_level ?? 'Comment', requiredAttendance: Boolean(member.required_attendance || member.required), signoffRequired: Boolean(member.signoff_required), attendanceRequirement: member.attendanceRequirement ?? 'All sessions', status: member.status ?? 'Active', notes: member.notes ?? '' } : { permissionLevel: 'Comment', status: 'Active', requiredAttendance: false, signoffRequired: false, attendanceRequirement: 'All sessions' }); }, [open, member]);
  if (!open) return null;
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--psm-line)] p-5"><div><h3 className="text-xl font-semibold">{member ? 'Edit Team Member' : 'Add Team Member'}</h3><p className="text-sm text-[var(--psm-muted)]">Assign HAZOP role, discipline, attendance, sign-off, and restricted access.</p></div><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-3 py-2">Close</button></div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="User"><select className="input" value={form.userId ?? ''} onChange={(e) => set('userId', e.target.value)}><option value="">External / manual participant</option>{(context?.users ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.displayName} - {u.email}</option>)}</select></Field>
          <Field label="External name"><input className="input" value={form.externalName ?? form.name ?? ''} onChange={(e) => { set('externalName', e.target.value); set('name', e.target.value); }} /></Field>
          <Field label="External email"><input className="input" value={form.externalEmail ?? form.email ?? ''} onChange={(e) => { set('externalEmail', e.target.value); set('email', e.target.value); }} /></Field>
          <Field label="Company / contractor"><input className="input" value={form.companyName ?? ''} onChange={(e) => set('companyName', e.target.value)} /></Field>
          <Field label="Contractor company"><select className="input" value={form.contractorCompanyId ?? ''} onChange={(e) => set('contractorCompanyId', e.target.value)}><option value="">Internal / not applicable</option>{(context?.contractorCompanies ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Department"><select className="input" value={form.departmentId ?? ''} onChange={(e) => set('departmentId', e.target.value)}><option value="">No department assigned</option>{(context?.departments ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
          <Field label="Discipline"><select className="input" value={form.discipline ?? ''} onChange={(e) => set('discipline', e.target.value)}><option value="">Select discipline</option>{(context?.disciplines ?? []).map((d: string) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="Study role"><select className="input" value={form.studyRole ?? ''} onChange={(e) => set('studyRole', e.target.value)}><option value="">Select role</option>{(context?.studyRoles ?? []).map((r: string) => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Permission level"><select className="input" value={form.permissionLevel ?? 'Comment'} onChange={(e) => set('permissionLevel', e.target.value)}>{(context?.permissionLevels ?? ['View only', 'Comment', 'Edit worksheet', 'Approve/sign-off']).map((p: string) => <option key={p}>{p}</option>)}</select></Field>
          <Field label="Session attendance required for"><select className="input" value={form.attendanceRequirement ?? 'All sessions'} onChange={(e) => set('attendanceRequirement', e.target.value)}>{['All sessions', 'Selected sessions', 'Review only'].map((p) => <option key={p}>{p}</option>)}</select></Field>
          <Field label="Status"><select className="input" value={form.status ?? 'Active'} onChange={(e) => set('status', e.target.value)}>{['Invited', 'Active', 'Declined', 'Removed', 'Replaced', 'Inactive'].map((s) => <option key={s}>{s}</option>)}</select></Field>
          <label className="flex items-center gap-3 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><input type="checkbox" checked={Boolean(form.requiredAttendance)} onChange={(e) => set('requiredAttendance', e.target.checked)} /> Required attendance</label>
          <label className="flex items-center gap-3 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><input type="checkbox" checked={Boolean(form.signoffRequired)} onChange={(e) => { set('signoffRequired', e.target.checked); if (e.target.checked && !['Approve/sign-off', 'Edit worksheet'].includes(form.permissionLevel)) set('permissionLevel', 'Approve/sign-off'); }} /> Sign-off required</label>
          <Field label="Notes"><textarea className="input min-h-24" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
        </div>
        <div className="flex justify-end gap-3 border-t border-[var(--psm-line)] p-5"><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-4 py-2">Cancel</button><button disabled={saving} onClick={() => onSave(normalizeTeamMemberPayload(form))} className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save Member'}</button></div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1 text-sm"><span className="text-[var(--psm-muted)]">{label}</span>{children}</label>;
}

function normalizeTeamMemberPayload(form: Record<string, any>) {
  const payload = { ...form };
  if (payload.signoffRequired && !['Approve/sign-off', 'Edit worksheet'].includes(payload.permissionLevel)) payload.permissionLevel = 'Approve/sign-off';
  for (const key of ['userId', 'externalName', 'externalEmail', 'name', 'email', 'companyName', 'contractorCompanyId', 'departmentId', 'notes']) {
    if (payload[key] === '') delete payload[key];
  }
  return payload;
}
