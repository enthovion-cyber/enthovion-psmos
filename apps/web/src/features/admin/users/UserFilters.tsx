'use client';

export type UserFiltersValue = {
  search?: string;
  roleId?: string;
  siteId?: string;
  department?: string;
  status?: string;
  invitationStatus?: string;
};

export function UserFilters({ value, onChange }: { value: UserFiltersValue; onChange: (value: UserFiltersValue) => void }) {
  return (
    <div className="grid gap-3 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 md:grid-cols-3 xl:grid-cols-6">
      <input className="psm-input px-3 text-sm" placeholder="Search name/email" value={value.search ?? ''} onChange={(event) => onChange({ ...value, search: event.target.value })} />
      <input className="psm-input px-3 text-sm" placeholder="Role" value={value.roleId ?? ''} onChange={(event) => onChange({ ...value, roleId: event.target.value })} />
      <input className="psm-input px-3 text-sm" placeholder="Site" value={value.siteId ?? ''} onChange={(event) => onChange({ ...value, siteId: event.target.value })} />
      <input className="psm-input px-3 text-sm" placeholder="Department" value={value.department ?? ''} onChange={(event) => onChange({ ...value, department: event.target.value })} />
      <select className="psm-input px-3 text-sm" value={value.status ?? ''} onChange={(event) => onChange({ ...value, status: event.target.value })}>
        <option value="">Any status</option>
        <option value="ACTIVE">Active</option>
        <option value="SUSPENDED">Suspended</option>
        <option value="DEACTIVATED">Deactivated</option>
      </select>
      <select className="psm-input px-3 text-sm" value={value.invitationStatus ?? ''} onChange={(event) => onChange({ ...value, invitationStatus: event.target.value })}>
        <option value="">Any invitation</option>
        <option value="PENDING">Pending</option>
        <option value="ACCEPTED">Accepted</option>
        <option value="EXPIRED">Expired</option>
      </select>
    </div>
  );
}
