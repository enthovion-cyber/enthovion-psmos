import type { ChangeEvent } from 'react';
import { PsiCard } from '../../shared/PsiUi';

export function OwnershipReviewSection({ value, onChange, users = [], userSearch = '', onUserSearch, loading }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void; users?: Array<Record<string, any>>; userSearch?: string; onUserSearch?: (value: string) => void; loading?: boolean }) {
  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange({ [event.target.name]: event.target.value });
  return (
    <PsiCard title="5. Ownership / Review" subtitle="Review requirements are validated before submit for review.">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold md:col-span-2">User search<input value={userSearch} onChange={(event) => onUserSearch?.(event.target.value)} placeholder="Search IAM users by name, email, title, or department" className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>
        {loading ? <p className="md:col-span-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-xs text-[var(--psm-muted)]">Loading scoped IAM/RBAC users...</p> : null}
        <UserSelect name="psi_owner_id" label="PSI owner" value={value.psi_owner_id} onChange={change} users={users} />
        <UserSelect name="process_engineer_id" label="Process engineer" value={value.process_engineer_id} onChange={change} users={users} />
        <UserSelect name="operations_owner_id" label="Operations owner" value={value.operations_owner_id} onChange={change} users={users} />
        <UserSelect name="hse_owner_id" label="HSE/process safety owner" value={value.hse_owner_id} onChange={change} users={users} />
        <UserSelect name="document_controller_id" label="Document controller" value={value.document_controller_id} onChange={change} users={users} />
        <UserSelect name="mechanical_mi_contact_id" label="Mechanical / MI contact" value={value.mechanical_mi_contact_id} onChange={change} users={users} />
        <UserSelect name="electrical_instrument_contact_id" label="Electrical / instrument contact" value={value.electrical_instrument_contact_id} onChange={change} users={users} />
        <UserSelect name="relief_specialist_id" label="Relief specialist" value={value.relief_specialist_id} onChange={change} users={users} />
        <Field name="review_frequency_value" label="Review frequency value" type="number" value={value.review_frequency_value} onChange={change} />
        <label className="space-y-1 text-sm font-semibold">Review frequency unit<select name="review_frequency_unit" value={value.review_frequency_unit ?? ''} onChange={change} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><option value="">Select</option><option>Months</option><option>Years</option></select></label>
        <Field name="last_review_date" label="Last review date" type="date" value={value.last_review_date} onChange={change} />
        <Field name="next_review_due" label="Next review due" type="date" value={value.next_review_due} onChange={change} />
        <label className="space-y-1 text-sm font-semibold">Review status<select name="review_status" value={value.review_status ?? 'Not Reviewed'} onChange={change} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><option>Not Reviewed</option><option>Submitted</option><option>Approved</option><option>Rejected</option><option>Returned</option></select></label>
        <label className="space-y-1 text-sm font-semibold md:col-span-2">Notes<textarea name="notes" value={value.notes ?? ''} onChange={change} rows={3} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>
      </div>
    </PsiCard>
  );
}

function UserSelect({ label, users, ...props }: any) {
  const list = Array.isArray(users) ? users : [];
  const selected = list.find((user: any) => String(user.id) === String(props.value ?? ''));
  return (
    <label className="space-y-1 text-sm font-semibold">
      {label}
      <select {...props} value={props.value ?? ''} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2">
        <option value="">Select user</option>
        {list.map((user: any) => <option key={user.id} value={user.id}>{user.label ?? `${user.displayName ?? user.email ?? user.id}`}{user.status ? ` (${user.status})` : ''}</option>)}
      </select>
      {props.value && selected ? (
        <span className="block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs font-normal text-[var(--psm-muted)]">
          <span className="block font-semibold text-[var(--psm-text)]">{selected.displayName ?? selected.name ?? selected.email ?? selected.id}</span>
          <span className="block">{[selected.email, selected.title, selected.department].filter(Boolean).join(' | ') || 'Profile details available from IAM/RBAC'}</span>
          {selected.status ? <span className="mt-1 inline-block rounded-full border border-[var(--psm-line)] px-2 py-0.5">{selected.status}</span> : null}
        </span>
      ) : props.value ? (
        <span className="block rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs font-normal text-warning">
          Selected profile is not in the current lookup result. Search the user name/email or refresh scoped IAM users.
        </span>
      ) : null}
    </label>
  );
}

function Field({ label, ...props }: any) {
  return <label className="space-y-1 text-sm font-semibold">{label}<input {...props} value={props.value ?? ''} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" /></label>;
}
