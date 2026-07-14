import type { ReactNode } from 'react';
import { Badge } from '../shared/IncidentStatusBadge';
import { Field, InfoRows, SelectField, TabPanel, TextArea, ToggleGrid, buttonSecondary, formatDate } from '../shared/IncidentTabPrimitives';
import { AcceptanceStatusBadge } from '../shared/AcceptanceStatusBadge';
import { CompetencyStatusBadge } from '../shared/CompetencyStatusBadge';
import { TeamRoleBadge } from '../shared/TeamRoleBadge';

export const teamRoles = [
  'Investigation Owner',
  'Investigation Lead',
  'RCA Facilitator',
  'Process Engineer',
  'Operations Representative',
  'Maintenance Representative',
  'HSE / EHS Representative',
  'Process Safety Reviewer',
  'Instrument / Controls Engineer',
  'Mechanical Engineer',
  'Electrical Engineer',
  'Reliability / MI Representative',
  'Chemical / SDS Reviewer',
  'Medical / Occupational Health Reviewer',
  'Area Owner',
  'Regulatory / Compliance Reviewer',
  'Management Reviewer',
  'External Consultant',
  'Contractor Representative',
  'Observer',
  'Other'
];

export const profileStatuses = ['Active', 'Pending Invitation', 'Pending Acceptance', 'Disabled', 'External / manual participant', 'External / Contractor'];
export const acceptanceStatuses = ['Pending Acceptance', 'Pending', 'Invited', 'Accepted', 'Declined', 'Tentative', 'Expired', 'Cancelled'];
export const activeStatuses = ['Pending Acceptance', 'Active', 'Declined', 'Removed', 'Replaced', 'Disabled'];
export const approvalStatuses = ['Not Required', 'Pending Approval', 'Approved', 'Rejected'];
export const availabilityStatuses = ['Available', 'Limited', 'Unavailable', 'Overloaded', 'Pending Review'];
export const competencyStatuses = ['Verified', 'Needs Review', 'Gap', 'Expired', 'Not Reviewed'];
export const conflictStatuses = ['None', 'Declared', 'Conflict Review Required', 'Independence Review Required'];
export const raciRoles = ['Responsible', 'Accountable', 'Consulted', 'Informed', 'Observer'];

export function DrawerShell({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-2 sm:p-3">
      <div className="ml-auto flex h-full w-full max-w-5xl flex-col overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-cyan-300/10 dark:bg-[#071525]">
        <div className="sticky top-0 z-10 mb-4 flex items-center justify-between border-b border-slate-200 bg-white pb-3 dark:border-cyan-300/10 dark:bg-[#071525]">
          <h2 className="text-sm font-black">{title}</h2>
          <button onClick={onClose} className={buttonSecondary}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function TeamMemberForm({ form, set }: { form: any; set: (key: string, value: any) => void }) {
  return (
    <div className="grid gap-4">
      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-cyan-300/10 md:grid-cols-2">
        <div className="md:col-span-2">
          <h3 className="text-xs font-black uppercase text-slate-500">Participant Contact</h3>
        </div>
        <Field label="Display name" value={form.displayName} onChange={(value) => set('displayName', value)} />
        <Field label="Email" value={form.email} onChange={(value) => set('email', value)} />
        <Field label="Phone/contact if allowed" value={form.phone} onChange={(value) => set('phone', value)} />
      </section>

      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-cyan-300/10 md:grid-cols-2">
        <div className="md:col-span-2">
          <h3 className="text-xs font-black uppercase text-slate-500">Assignment Details</h3>
        </div>
        <SelectField label="Role" value={form.teamRole} options={teamRoles} onChange={(value) => set('teamRole', value)} />
        <Field label="Discipline" value={form.discipline} onChange={(value) => set('discipline', value)} />
        <Field label="Department" value={form.department} onChange={(value) => set('department', value)} />
        <Field label="Company / organization" value={form.organization ?? form.companyName} onChange={(value) => set('organization', value)} />
        <Field label="Contractor company" value={form.contractorCompany} onChange={(value) => set('contractorCompany', value)} />
        <SelectField label="RACI role" value={form.raciRole} options={raciRoles} onChange={(value) => set('raciRole', value)} />
        <TextArea label="Responsibility" value={form.responsibility} onChange={(value) => set('responsibility', value)} className="md:col-span-2" />
        <div className="md:col-span-2">
          <ToggleGrid form={form} set={set} keys={[['requiredMember','Required role'], ['leadInvestigator','Lead investigator'], ['reviewer','Reviewer'], ['approver','Approver'], ['acceptanceRequired','Acceptance required'], ['approvalRequired','Approval required']]} />
        </div>
      </section>

      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-cyan-300/10 md:grid-cols-2">
        <div className="md:col-span-2">
          <h3 className="text-xs font-black uppercase text-slate-500">Acceptance / Approval</h3>
        </div>
        <SelectField label="Acceptance status" value={form.acceptanceStatus} options={acceptanceStatuses} onChange={(value) => set('acceptanceStatus', value)} />
        <SelectField label="Active status" value={form.activeStatus} options={activeStatuses} onChange={(value) => set('activeStatus', value)} />
        <SelectField label="Approval status" value={form.approvalStatus} options={approvalStatuses} onChange={(value) => set('approvalStatus', value)} />
        <Field label="Acceptance due date" value={form.acceptanceDueAt} type="datetime-local" onChange={(value) => set('acceptanceDueAt', value)} />
        <TextArea label="Notification message" value={form.notificationMessage} onChange={(value) => set('notificationMessage', value)} className="md:col-span-2" />
      </section>

      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-cyan-300/10 md:grid-cols-2">
        <div className="md:col-span-2">
          <h3 className="text-xs font-black uppercase text-slate-500">Competency / Availability / Conflict</h3>
        </div>
        <SelectField label="Availability status" value={form.availabilityStatus} options={availabilityStatuses} onChange={(value) => set('availabilityStatus', value)} />
        <Field label="Capacity / workload %" value={form.capacityPercent} type="number" onChange={(value) => set('capacityPercent', value)} />
        <SelectField label="Competency status" value={form.competencyStatus} options={competencyStatuses} onChange={(value) => set('competencyStatus', value)} />
        <Field label="Training records if available" value={form.trainingRecords} onChange={(value) => set('trainingRecords', value)} />
        <SelectField label="Conflict / independence status" value={form.conflictStatus} options={conflictStatuses} onChange={(value) => set('conflictStatus', value)} />
        <Field label="Backup / alternate member" value={form.backupMember} onChange={(value) => set('backupMember', value)} />
        <div className="md:col-span-2">
          <ToggleGrid form={form} set={set} keys={[['conflictCheckRequired','Conflict/independence check required'], ['conflictDeclared','Conflict declared'], ['competencyCheckRequired','Competency check required']]} />
        </div>
        <TextArea label="Conflict notes" value={form.conflictNotes} onChange={(value) => set('conflictNotes', value)} className="md:col-span-2" />
      </section>

      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-cyan-300/10">
        <TextArea label="Notes" value={form.notes} onChange={(value) => set('notes', value)} />
        <TextArea label="Change reason" value={form.changeReason} onChange={(value) => set('changeReason', value)} />
      </section>
    </div>
  );
}

export function TeamCards({ rows, empty }: { rows?: any[] | undefined; empty: string }) {
  if (!rows?.length) return <p className="text-xs text-slate-500">{empty}</p>;
  return (
    <div className="grid gap-2">
      {rows.map((row, index) => (
        <div key={row.id ?? row.role_name ?? row.display_name ?? row.label ?? index} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">{row.display_name ?? row.memberName ?? row.role_name ?? row.label ?? row.title}</span>
            {row.team_role || row.role_name ? <TeamRoleBadge value={row.team_role ?? row.role_name} /> : null}
            {row.acceptance_status || row.status ? <AcceptanceStatusBadge value={row.acceptance_status ?? row.status} /> : null}
            {row.competency_status ? <CompetencyStatusBadge value={row.competency_status} /> : null}
          </div>
          <p className="mt-1 text-slate-500">{row.responsibility ?? row.generated_reason ?? row.notes ?? row.description}</p>
          <div className="mt-1 text-[11px] text-slate-400">{row.email ?? row.discipline ?? row.category ?? ''} · {formatDate(row.created_at ?? row.lastNotificationSentAt)}</div>
        </div>
      ))}
    </div>
  );
}

export function TeamInfoPanel({ title, rows, empty }: { title: string; rows?: any[] | undefined; empty: string }) {
  return <TabPanel title={title}><TeamCards rows={rows} empty={empty} /></TabPanel>;
}

export function ReviewBox({ review, onApprove, onReject, onRequest }: any) {
  return (
    <div className="grid gap-3">
      <InfoRows rows={[['Status', review?.status], ['Requested at', formatDate(review?.requestedAt)], ['Decision', review?.decision], ['Decided at', formatDate(review?.decidedAt)], ['Reason', review?.reason]]} />
      <div className="flex flex-wrap gap-2">
        {onRequest ? <button onClick={onRequest} className={buttonSecondary}>Request Approval</button> : null}
        <button onClick={onApprove} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white">Approve Team</button>
        <button onClick={onReject} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-black text-red-600">Reject Team</button>
      </div>
    </div>
  );
}

export function MiniDistribution({ label, rows }: { label: string; rows?: any[] }) {
  if (!rows?.length) return null;
  const total = rows.reduce((sum, row) => sum + Number(row.count ?? row.value ?? 0), 0) || 1;
  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
      <div className="font-bold">{label}</div>
      {rows.map((row) => {
        const value = Number(row.count ?? row.value ?? 0);
        return (
          <div key={row.label ?? row.status ?? row.name} className="grid gap-1">
            <div className="flex justify-between gap-2"><span className="text-slate-500">{row.label ?? row.status ?? row.name}</span><span className="font-bold">{value}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (value / total) * 100)}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

export function ProfileBadge({ value }: { value?: string }) {
  return <Badge value={value ?? 'External / manual participant'} map={{ Active: 'green', Disabled: 'red', 'Pending Invitation': 'amber', 'Pending Acceptance': 'amber', 'External / manual participant': 'slate', 'External / Contractor': 'purple' }} />;
}
