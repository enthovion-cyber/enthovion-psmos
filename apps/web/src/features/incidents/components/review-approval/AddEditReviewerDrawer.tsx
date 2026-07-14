import { buttonPrimary, buttonSecondary, Field, SelectField, TextArea } from '../shared/IncidentTabPrimitives';

const ROLES = ['Investigation Owner Reviewer', 'HSE Reviewer', 'Operations Reviewer', 'Maintenance Reviewer', 'Process Safety Reviewer', 'Management Approver', 'Final Approver', 'Witness', 'Other'];
const STATUS = ['Pending assignment', 'Requested', 'In Review', 'Approved', 'Rejected', 'Changes Requested', 'Delegated', 'Escalated'];

export function AddEditReviewerDrawer({ open, form, set, saving, onClose, onSave }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40">
      <aside className="ml-auto h-full w-full max-w-2xl overflow-y-auto bg-white p-4 shadow-xl dark:bg-[#071525]">
        <div className="mb-4 flex items-center justify-between">
          <div><h3 className="text-lg font-black">{form?.id ? 'Edit Reviewer / Approver' : 'Add Reviewer / Approver'}</h3><p className="text-xs text-slate-500">Uses IAM/RBAC user identifiers and backend workflow validation.</p></div>
          <button className={buttonSecondary} onClick={onClose}>Close</button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Reviewer user ID" value={form.reviewerUserId} onChange={(value) => set('reviewerUserId', value)} />
          <Field label="Reviewer name" value={form.reviewerName} onChange={(value) => set('reviewerName', value)} />
          <Field label="Email" value={form.reviewerEmail} onChange={(value) => set('reviewerEmail', value)} />
          <Field label="Department / discipline" value={form.department} onChange={(value) => set('department', value)} />
          <SelectField label="Review role" value={form.role} options={ROLES} onChange={(value) => set('role', value)} />
          <Field label="Approval sequence / level" type="number" value={form.approvalLevel} onChange={(value) => set('approvalLevel', value)} />
          <SelectField label="Status" value={form.status} options={STATUS} onChange={(value) => set('status', value)} />
          <Field label="Due date" type="date" value={form.dueDate} onChange={(value) => set('dueDate', value)} />
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10"><input type="checkbox" checked={!!form.required} onChange={(event) => set('required', event.target.checked)} /> Required reviewer</label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10"><input type="checkbox" checked={!!form.eSignatureRequired} onChange={(event) => set('eSignatureRequired', event.target.checked)} /> E-signature required</label>
          <TextArea label="Comments / conditions" value={form.comments} onChange={(value) => set('comments', value)} className="md:col-span-2" />
          <TextArea label="Change reason" value={form.reason} onChange={(value) => set('reason', value)} className="md:col-span-2" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className={buttonSecondary} onClick={onClose}>Cancel</button>
          <button className={buttonPrimary} disabled={saving} onClick={onSave}>Save Reviewer</button>
        </div>
      </aside>
    </div>
  );
}
