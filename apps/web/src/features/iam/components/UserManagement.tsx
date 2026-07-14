'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Archive, Download, Eye, FileUp, KeyRound, LogOut, MailPlus, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { iamService, type CreateUserInput } from '@/services/iam.service';
import { UserFilters, type UserFiltersValue } from '@/features/admin/users/UserFilters';
import { useIamAccessReference, useIamMutations, useIamRoles, useIamUsers } from '../hooks/useIam';

export function UserManagement() {
  const usersQuery = useIamUsers();
  const rolesQuery = useIamRoles();
  const referenceQuery = useIamAccessReference();
  const mutations = useIamMutations();
  const toast = useMutationToast();
  const [form, setForm] = useState({ email: '', personalEmail: '', displayName: '', title: '', department: '', employeeId: '', phone: '', employerType: 'Employee', roleId: '', companyId: '', siteId: '', password: '', authMethod: 'invite', sendTo: 'work' });
  const [invite, setInvite] = useState({ email: '', roleId: '', siteId: '', companyId: '' });
  const [bulkCsv, setBulkCsv] = useState('email,displayName,title,department,roleId,siteId\n');
  const [delegation, setDelegation] = useState({ delegateId: '', moduleKey: 'equipment', startsAt: '', endsAt: '' });
  const [generatedCredential, setGeneratedCredential] = useState<{ email: string; password: string } | null>(null);
  const [filters, setFilters] = useState<UserFiltersValue>({});

  const filteredUsers = (usersQuery.data ?? []).filter((user) => {
    const search = filters.search?.trim().toLowerCase();
    const matchesSearch = !search || [user.displayName, user.email, user.title, user.department].some((value) => String(value ?? '').toLowerCase().includes(search));
    const matchesRole = !filters.roleId || (user.userRoles ?? []).some((assignment) => assignment.role?.id === filters.roleId || assignment.role?.name?.toLowerCase().includes(filters.roleId!.toLowerCase()));
    const matchesSite = !filters.siteId || (user.userSites ?? []).some((access) => access.site?.id === filters.siteId || access.site?.name?.toLowerCase().includes(filters.siteId!.toLowerCase()));
    const matchesDepartment = !filters.department || String(user.department ?? '').toLowerCase().includes(filters.department.toLowerCase());
    const matchesStatus = !filters.status || user.status === filters.status;
    return matchesSearch && matchesRole && matchesSite && matchesDepartment && matchesStatus;
  });

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      toast.success(message);
    } catch (error) {
      toast.error('IAM action failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users & Access</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Create users, assign industrial roles, and control account status.</p>
        </div>
        <button
          className="psm-button psm-button-secondary"
          type="button"
          onClick={() => void run(async () => {
            const exported = await iamService.exportUsers();
            const blob = new Blob([exported.csv], { type: exported.contentType });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = exported.fileName;
            anchor.click();
            URL.revokeObjectURL(url);
          }, 'User export prepared')}
        >
          <Download size={16} /> Export Users
        </button>
      </header>

      <section className="psm-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-info" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Add User</h2>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              const input: CreateUserInput = {
                email: form.email,
                displayName: form.displayName,
                employerType: form.employerType,
                roleIds: form.roleId ? [form.roleId] : [],
                companyIds: form.companyId ? [form.companyId] : [],
                siteIds: form.siteId ? [form.siteId] : [],
                authMethod: form.authMethod as 'invite' | 'generated_password',
                sendTo: form.sendTo as 'work' | 'personal' | 'both' | 'none',
                forcePasswordChange: true
              };
              if (form.personalEmail) input.personalEmail = form.personalEmail;
              if (form.title) input.title = form.title;
              if (form.department) input.department = form.department;
              if (form.employeeId) input.employeeId = form.employeeId;
              if (form.phone) input.phone = form.phone;
              if (form.password) input.password = form.password;
              if (!input.roleIds?.length) throw new Error('Select at least one role before creating the user.');
              if (!input.companyIds?.length && !input.siteIds?.length) throw new Error('Select company or site access before creating the user.');
              if ((input.sendTo === 'personal' || input.sendTo === 'both') && !input.personalEmail) throw new Error('Personal email is required for this delivery option.');
              const created = await mutations.createUser.mutateAsync(input);
              if (created.temporaryPassword) setGeneratedCredential({ email: created.email, password: created.temporaryPassword });
              setForm({ email: '', personalEmail: '', displayName: '', title: '', department: '', employeeId: '', phone: '', employerType: 'Employee', roleId: '', companyId: '', siteId: '', password: '', authMethod: 'invite', sendTo: 'work' });
            }, 'User created');
          }}
          className="grid gap-3 md:grid-cols-4"
        >
          <input required className="psm-input px-3 text-sm" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input className="psm-input px-3 text-sm" placeholder="Personal email" value={form.personalEmail} onChange={(event) => setForm({ ...form, personalEmail: event.target.value })} />
          <input required className="psm-input px-3 text-sm" placeholder="Display name" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} />
          <input className="psm-input px-3 text-sm" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <input className="psm-input px-3 text-sm" placeholder="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
          <input className="psm-input px-3 text-sm" placeholder="Employee ID" value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} />
          <input className="psm-input px-3 text-sm" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <Select value={form.employerType} onChange={(employerType) => setForm({ ...form, employerType })} placeholder="Employer type" items={['Employee', 'Contractor', 'Vendor', 'Auditor'].map((value) => ({ id: value, label: value }))} />
          <Select value={form.roleId} onChange={(roleId) => setForm({ ...form, roleId })} placeholder="Required role" items={(rolesQuery.data ?? []).map((role) => ({ id: role.id, label: role.name }))} />
          <Select value={form.companyId} onChange={(companyId) => setForm({ ...form, companyId })} placeholder="Required company" items={(referenceQuery.data?.companies ?? []).map((company) => ({ id: company.id, label: company.name }))} />
          <Select value={form.siteId} onChange={(siteId) => setForm({ ...form, siteId })} placeholder="Site access" items={(referenceQuery.data?.sites ?? []).map((site) => ({ id: site.id, label: site.name }))} />
          <Select value={form.authMethod} onChange={(authMethod) => setForm({ ...form, authMethod })} placeholder="Authentication method" items={[{ id: 'invite', label: 'Invitation link' }, { id: 'generated_password', label: 'Auto-generated password' }]} />
          <Select value={form.sendTo} onChange={(sendTo) => setForm({ ...form, sendTo })} placeholder="Send to" items={[{ id: 'work', label: 'Work email' }, { id: 'personal', label: 'Personal email' }, { id: 'both', label: 'Both' }, { id: 'none', label: 'Do not send now' }]} />
          <input className="psm-input px-3 text-sm" placeholder="Temp password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <button className="psm-button psm-button-primary md:col-span-4" disabled={mutations.createUser.isPending}>Create User</button>
        </form>
        {generatedCredential ? (
          <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-warning">Temporary password generated. Show this once to the admin.</div>
                <div className="mt-1 text-xs text-[var(--psm-muted)]">{generatedCredential.email}</div>
                <code className="mt-2 block rounded-md border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2 text-base font-semibold">{generatedCredential.password}</code>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="psm-button psm-button-secondary" type="button" onClick={() => void navigator.clipboard?.writeText(generatedCredential.password)}>Copy Password</button>
                <button className="psm-button psm-button-ghost" type="button" onClick={() => setGeneratedCredential(null)}>Hide</button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="psm-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <MailPlus size={18} className="text-info" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Invite User By Email</h2>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await mutations.inviteUser.mutateAsync({
                  email: invite.email,
                  ...(invite.roleId ? { roleId: invite.roleId } : {}),
                  ...(invite.siteId ? { siteId: invite.siteId } : {}),
                  ...(invite.companyId ? { companyId: invite.companyId } : {})
                });
                setInvite({ email: '', roleId: '', siteId: '', companyId: '' });
              }, 'Invitation created');
            }}
            className="grid gap-3 md:grid-cols-2"
          >
            <input required className="psm-input px-3 text-sm" placeholder="Email" value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} />
            <Select value={invite.roleId} onChange={(roleId) => setInvite({ ...invite, roleId })} placeholder="Default role" items={(rolesQuery.data ?? []).map((role) => ({ id: role.id, label: role.name }))} />
            <Select value={invite.companyId} onChange={(companyId) => setInvite({ ...invite, companyId })} placeholder="Company access" items={(referenceQuery.data?.companies ?? []).map((company) => ({ id: company.id, label: company.name }))} />
            <Select value={invite.siteId} onChange={(siteId) => setInvite({ ...invite, siteId })} placeholder="Site access" items={(referenceQuery.data?.sites ?? []).map((site) => ({ id: site.id, label: site.name }))} />
            <button className="psm-button psm-button-primary md:col-span-2" disabled={mutations.inviteUser.isPending}>Send Invite</button>
          </form>
        </section>

        <section className="psm-card p-4">
          <div className="mb-4 flex items-center gap-2">
            <FileUp size={18} className="text-info" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">Bulk Import Users CSV</h2>
          </div>
          <textarea className="psm-input min-h-28 w-full p-3 font-mono text-xs" value={bulkCsv} onChange={(event) => setBulkCsv(event.target.value)} />
          <button
            className="psm-button psm-button-secondary mt-3 w-full"
            disabled={mutations.bulkImportUsers.isPending}
            onClick={() => run(() => mutations.bulkImportUsers.mutateAsync(parseUsersCsv(bulkCsv)), 'Bulk import completed')}
          >
            Import CSV
          </button>
        </section>
      </div>

      <section className="psm-card overflow-hidden">
        <div className="border-b border-[var(--psm-line)] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">User Directory</h2>
          <div className="mt-3">
            <UserFilters value={filters} onChange={setFilters} />
          </div>
        </div>
        {usersQuery.isLoading ? <div className="p-4 text-sm text-[var(--psm-muted)]">Loading users...</div> : null}
        {usersQuery.isError ? <div className="p-4 text-sm text-danger">Unable to load users.</div> : null}
        <div className="overflow-auto">
          <table className="psm-table w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Assign Role</th>
                <th className="px-4 py-3">Access</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-[var(--psm-line)]">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{user.displayName}</div>
                    <div className="text-xs text-[var(--psm-muted)]">{user.email} · {user.title ?? 'No title'}</div>
                  </td>
                  <td className="px-4 py-3">{user.department ?? 'Not assigned'}</td>
                  <td className="px-4 py-3"><span className={user.status === 'ACTIVE' ? 'psm-badge psm-badge-success' : user.status === 'SUSPENDED' ? 'psm-badge psm-badge-warning' : 'psm-badge psm-badge-muted'}>{user.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(user.userRoles ?? []).map((assignment) => assignment.role ? (
                        <button key={assignment.role.id} onClick={() => run(() => mutations.removeRole.mutateAsync({ userId: user.id, roleId: assignment.role!.id }), 'Role removed')} className="psm-badge psm-badge-muted">
                          {assignment.role.name} ×
                        </button>
                      ) : null)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select className="psm-input px-2 text-xs" defaultValue="" onChange={(event) => event.target.value && run(() => mutations.assignRole.mutateAsync({ userId: user.id, roleId: event.target.value }), 'Role assigned')}>
                      <option value="">Select role</option>
                      {(rolesQuery.data ?? []).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="grid min-w-48 gap-2">
                      <select className="psm-input px-2 text-xs" defaultValue="" onChange={(event) => event.target.value && run(() => mutations.assignDepartment.mutateAsync({ userId: user.id, departmentId: event.target.value }), 'Department assigned')}>
                        <option value="">Assign department</option>
                        {(referenceQuery.data?.departments ?? []).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                      </select>
                      <select className="psm-input px-2 text-xs" defaultValue="" onChange={(event) => event.target.value && run(() => mutations.assignSiteAccess.mutateAsync({ userId: user.id, siteId: event.target.value }), 'Site access assigned')}>
                        <option value="">Assign site access</option>
                        {(referenceQuery.data?.sites ?? []).map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                      </select>
                      <select className="psm-input px-2 text-xs" defaultValue="" onChange={(event) => event.target.value && run(() => mutations.assignContractorAccess.mutateAsync({ userId: user.id, contractorCompanyId: event.target.value }), 'Contractor access assigned')}>
                        <option value="">Contractor portal access</option>
                        {(referenceQuery.data?.contractorCompanies ?? []).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link className="psm-button psm-button-secondary min-h-8 px-2" href={`/admin/users/${user.id}`}>
                        <Eye size={14} /> Profile
                      </Link>
                      <button className="psm-button psm-button-secondary min-h-8 px-2" onClick={() => run(() => mutations.setUserStatus.mutateAsync({ id: user.id, action: 'suspend' }), 'User suspended')}>Suspend</button>
                      <button className="psm-button psm-button-secondary min-h-8 px-2" onClick={() => run(() => mutations.setUserStatus.mutateAsync({ id: user.id, action: 'deactivate' }), 'User deactivated')}>Deactivate</button>
                      <button className="psm-button psm-button-secondary min-h-8 px-2" onClick={() => run(() => mutations.setUserStatus.mutateAsync({ id: user.id, action: 'reactivate' }), 'User reactivated')}>Reactivate</button>
                      <button className="psm-button psm-button-secondary min-h-8 px-2" onClick={() => run(async () => {
                        const result = await mutations.resetPassword.mutateAsync({ id: user.id, generateTemporaryPassword: true });
                        if (result.temporaryPassword) setGeneratedCredential({ email: user.email, password: result.temporaryPassword });
                      }, 'Temporary password generated')}>
                        <KeyRound size={14} /> Reset
                      </button>
                      <button className="psm-button psm-button-secondary min-h-8 px-2" onClick={() => run(() => mutations.resendInvite.mutateAsync(user.id), 'Invitation resent')}>
                        <MailPlus size={14} /> Invite
                      </button>
                      <button className="psm-button psm-button-secondary min-h-8 px-2" onClick={() => run(() => mutations.forceLogout.mutateAsync({ id: user.id, reason: 'Admin forced session refresh after access change' }), 'User sessions forced to refresh')}>
                        <LogOut size={14} /> Logout
                      </button>
                      <button className="psm-button psm-button-secondary min-h-8 px-2" onClick={() => {
                        const reason = window.prompt('Archive this user? Enter an audit reason.');
                        if (reason) void run(() => mutations.archiveUser.mutateAsync({ id: user.id, reason }), 'User archived');
                      }}>
                        <Archive size={14} /> Archive
                      </button>
                      <button className="psm-button psm-button-danger min-h-8 px-2" onClick={() => {
                        const reason = window.prompt('Hard delete is irreversible and blocked when safety records exist. Type DELETE to continue.');
                        if (reason === 'DELETE') void run(() => mutations.deleteUser.mutateAsync({ id: user.id, reason: 'Admin confirmed irreversible delete' }), 'User deleted');
                      }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                    <div className="mt-2 grid gap-2">
                      <select className="psm-input px-2 text-xs" value={delegation.delegateId} onChange={(event) => setDelegation({ ...delegation, delegateId: event.target.value })}>
                        <option value="">Delegate approvals to...</option>
                        {(usersQuery.data ?? []).filter((candidate) => candidate.id !== user.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.displayName}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-1">
                        <input className="psm-input px-2 text-xs" type="date" value={delegation.startsAt} onChange={(event) => setDelegation({ ...delegation, startsAt: event.target.value })} />
                        <input className="psm-input px-2 text-xs" type="date" value={delegation.endsAt} onChange={(event) => setDelegation({ ...delegation, endsAt: event.target.value })} />
                      </div>
                      <button className="psm-button psm-button-secondary min-h-8 px-2" onClick={() => run(() => mutations.assignDelegation.mutateAsync({ userId: user.id, input: { ...delegation, startsAt: `${delegation.startsAt}T00:00:00.000Z`, endsAt: `${delegation.endsAt}T23:59:59.000Z` } }), 'Approval delegation assigned')}>Assign Delegation</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="psm-card p-4 text-sm text-[var(--psm-muted)]">
        <ShieldCheck size={16} className="mr-2 inline text-success" />
        Backend permission guards enforce these actions; frontend controls are convenience only.
      </div>
    </div>
  );
}

function Select({ value, onChange, placeholder, items }: { value: string; onChange: (value: string) => void; placeholder: string; items: Array<{ id: string; label: string }> }) {
  return (
    <select className="psm-input px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select>
  );
}

function parseUsersCsv(csv: string): Array<CreateUserInput & { roleId?: string; siteId?: string }> {
  const [headerLine = '', ...rows] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((header) => header.trim());
  return rows
    .map((row) => {
      const values = row.split(',').map((value) => value.trim());
      const raw = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
      const parsed: CreateUserInput & { roleId?: string; siteId?: string } = {
        email: raw.email ?? raw.work_email ?? '',
        displayName: raw.displayName ?? raw.full_name ?? ''
      };
      const title = raw.title || raw.job_title;
      const roleId = raw.roleId || raw.roles;
      const siteId = raw.siteId || raw.sites;
      if (title) parsed.title = title;
      if (raw.department) parsed.department = raw.department;
      if (roleId) parsed.roleId = roleId;
      if (siteId) parsed.siteId = siteId;
      return parsed;
    })
    .filter((row) => Boolean(row.email && row.displayName));
}
