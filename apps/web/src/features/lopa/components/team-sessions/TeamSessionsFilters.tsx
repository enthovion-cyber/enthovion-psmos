import { fieldClass } from './TeamSessionsUi';

export function TeamSessionsFilters({ filters, setFilters, context }: any) {
  const update = (key: string, value: string) => setFilters((current: any) => ({ ...current, [key]: value || undefined }));
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
        <input className={fieldClass} placeholder="Search members, email, role, session..." value={filters.q ?? ''} onChange={(event) => update('q', event.target.value)} />
        <select className={fieldClass} value={filters.role ?? ''} onChange={(event) => update('role', event.target.value)}>
          <option value="">All roles</option>
          {(context.studyRoles ?? []).map((role: string) => <option key={role}>{role}</option>)}
        </select>
        <select className={fieldClass} value={filters.discipline ?? ''} onChange={(event) => update('discipline', event.target.value)}>
          <option value="">All disciplines</option>
          {(context.disciplines ?? []).map((discipline: string) => <option key={discipline}>{discipline}</option>)}
        </select>
        <select className={fieldClass} value={filters.invitationStatus ?? ''} onChange={(event) => update('invitationStatus', event.target.value)}>
          <option value="">Invitation status</option>
          <option>Pending</option>
          <option>Accepted</option>
          <option>Declined</option>
          <option>Expired</option>
          <option>Not Required</option>
        </select>
        <select className={fieldClass} value={filters.participationStatus ?? ''} onChange={(event) => update('participationStatus', event.target.value)}>
          <option value="">Participation</option>
          <option>Invited</option>
          <option>Active</option>
          <option>Declined</option>
          <option>Removed</option>
          <option>Replaced</option>
          <option>Inactive</option>
        </select>
        <select className={fieldClass} value={filters.sessionStatus ?? ''} onChange={(event) => update('sessionStatus', event.target.value)}>
          <option value="">Session status</option>
          <option>Planned</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Cancelled</option>
          <option>Rescheduled</option>
          <option>Missed</option>
        </select>
        <button className="lopa-button-secondary justify-center" onClick={() => setFilters({})}>Clear All</button>
      </div>
    </section>
  );
}
