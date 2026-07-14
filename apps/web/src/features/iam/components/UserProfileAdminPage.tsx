'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Archive, CheckCircle2, KeyRound, ShieldCheck, Trash2, UserCog } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { PermissionModuleAccordion } from '@/features/permissions/components/PermissionModuleAccordion';
import { useEffectivePermissions, useIamMutations, useIamUser, useMyPermissions, useRemovalImpact, useUserAudit } from '../hooks/useIam';

const tabs = ['Overview', 'Access Scope', 'Roles', 'Module Permissions', 'Effective Permissions', 'Assigned Records', 'Security', 'E-Signature', 'Training', 'Activity', 'Audit History'] as const;
const modulePresets = [
  { moduleKey: 'ptw', label: 'Permit to Work', presets: ['No Access', 'Read Only PTW', 'Allow All PTW'] },
  { moduleKey: 'moc', label: 'Management of Change', presets: ['No Access', 'Read Only MOC', 'Allow All MOC'] },
  { moduleKey: 'pssr', label: 'Pre-Startup Safety Review', presets: ['No Access', 'Read Only PSSR', 'Allow All PSSR'] }
];

export function UserProfileAdminPage({ userId }: { userId: string }) {
  const userQuery = useIamUser(userId);
  const effectiveQuery = useEffectivePermissions(userId);
  const impactQuery = useRemovalImpact(userId);
  const auditQuery = useUserAudit(userId);
  const myPermissionsQuery = useMyPermissions();
  const mutations = useIamMutations();
  const toast = useMutationToast();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const [credential, setCredential] = useState<string | null>(null);
  const [testPermission, setTestPermission] = useState('ptw.view');
  const [testResult, setTestResult] = useState<string | null>(null);

  const user = userQuery.data;
  const effective = effectiveQuery.data;
  const myPermissions = myPermissionsQuery.data ?? [];
  const canAny = (permissions: string[]) => permissions.some((permission) => myPermissions.includes(permission));
  const canResetPassword = canAny(['users.reset_password', 'users.manage']);
  const canForceLogout = canAny(['users.edit', 'users.manage']);
  const canArchive = canAny(['users.delete', 'users.manage']);
  const canDelete = canAny(['users.delete']);
  const canManageModulePermissions = canAny(['permissions.edit', 'roles.assign', 'roles.manage']);

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      toast.success(message);
    } catch (error) {
      toast.error('Admin action failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  if (userQuery.isLoading) return <div className="psm-card p-6 text-sm text-[var(--psm-muted)]">Loading user profile...</div>;
  if (!user) return <div className="psm-card p-6 text-sm text-danger">User not found.</div>;

  return (
    <div className="space-y-5">
      <header className="psm-card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-info/30 bg-info/10 text-xl font-semibold text-info">
              {initials(user.displayName)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{user.displayName}</h1>
                <span className={user.status === 'ACTIVE' ? 'psm-badge psm-badge-success' : user.status === 'SUSPENDED' ? 'psm-badge psm-badge-warning' : 'psm-badge psm-badge-muted'}>{user.status}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--psm-muted)]">{user.email} · {user.title ?? 'No title'} · {user.department ?? 'No department'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(user.userRoles ?? []).map((assignment) => assignment.role ? <span key={assignment.role.id} className="psm-badge psm-badge-info">{assignment.role.name}</span> : null)}
                {(user.userSites ?? []).map((assignment) => assignment.site ? <span key={assignment.site.id} className="psm-badge psm-badge-muted">{assignment.site.name}</span> : null)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/users" className="psm-button psm-button-secondary">Back to Users</Link>
            {canResetPassword ? (
              <button className="psm-button psm-button-secondary" onClick={() => run(async () => {
                const result = await mutations.resetPassword.mutateAsync({ id: user.id, generateTemporaryPassword: true });
                if (result.temporaryPassword) setCredential(result.temporaryPassword);
              }, 'Temporary password generated')}>
                <KeyRound size={16} /> Reset Password
              </button>
            ) : null}
            {canForceLogout ? <button className="psm-button psm-button-secondary" onClick={() => run(() => mutations.forceLogout.mutateAsync({ id: user.id, reason: 'Admin changed access profile' }), 'Sessions forced to refresh')}>Force Logout</button> : null}
            {canArchive ? (
              <button className="psm-button psm-button-secondary" onClick={() => {
                const reason = window.prompt('Archive user? Enter audit reason.');
                if (reason) void run(() => mutations.archiveUser.mutateAsync({ id: user.id, reason }), 'User archived');
              }}>
                <Archive size={16} /> Archive
              </button>
            ) : null}
            {canDelete ? (
              <button className="psm-button psm-button-danger" onClick={() => {
                const reason = window.prompt('Hard delete is irreversible. Type DELETE to continue.');
                if (reason === 'DELETE') void run(() => mutations.deleteUser.mutateAsync({ id: user.id, reason: 'Admin confirmed irreversible delete' }), 'User deleted');
              }}>
                <Trash2 size={16} /> Delete
              </button>
            ) : null}
          </div>
        </div>
        {credential ? (
          <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-4">
            <div className="text-sm font-semibold text-warning">Temporary password. Copy now; it is shown once.</div>
            <code className="mt-2 block rounded-md border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2">{credential}</code>
          </div>
        ) : null}
      </header>

      <nav className="flex gap-2 overflow-auto border-b border-[var(--psm-line)] pb-2">
        {tabs.map((tab) => (
          <button key={tab} className={`rounded-md px-3 py-2 text-sm transition ${activeTab === tab ? 'bg-info text-white' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-text)]'}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'Overview' ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <InfoCard title="Identity" rows={[['Work email', user.email], ['Personal email', user.profile?.metadata?.personalEmail as string || 'Not set'], ['Job title', user.title ?? 'Not set'], ['Department', user.department ?? 'Not set']]} />
          <InfoCard title="Status & Security" rows={[['Account status', user.status], ['MFA status', user.profile?.metadata?.mfaEnabled ? 'Enabled' : 'Not enabled'], ['Force password change', user.profile?.metadata?.forcePasswordChange ? 'Yes' : 'No'], ['Last login', user.profile?.metadata?.lastLoginAt as string || 'Not available']]} />
          <InfoCard title="Access Summary" rows={[['Roles', String(user.userRoles?.length ?? 0)], ['Sites', String(user.userSites?.length ?? 0)], ['Effective permissions', String(effective?.permissions.length ?? 0)], ['Denied permissions', String(effective?.deniedPermissions?.length ?? 0)]]} />
        </div>
      ) : null}

      {activeTab === 'Access Scope' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ScopeCard title="Assigned Sites" values={(user.userSites ?? []).map((item) => item.site?.name).filter(Boolean) as string[]} />
          <ScopeCard title="Effective Scope IDs" values={[...(effective?.scopes.companyIds ?? []), ...(effective?.scopes.siteIds ?? []), ...(effective?.scopes.unitIds ?? []), ...(effective?.scopes.areaIds ?? [])]} />
        </div>
      ) : null}

      {activeTab === 'Roles' ? (
        <section className="psm-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Assigned Roles</h2>
          <div className="mt-3 grid gap-2">
            {(user.userRoles ?? []).map((assignment) => assignment.role ? <div key={assignment.role.id} className="rounded-lg border border-[var(--psm-line)] p-3">{assignment.role.name}<div className="text-xs text-[var(--psm-muted)]">{assignment.role.key}</div></div> : null)}
          </div>
        </section>
      ) : null}

      {activeTab === 'Module Permissions' ? (
        canManageModulePermissions ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {modulePresets.map((module) => (
              <section key={module.moduleKey} className="psm-card p-4">
                <div className="flex items-center gap-2">
                  <UserCog size={18} className="text-info" />
                  <h2 className="font-semibold">{module.label}</h2>
                </div>
                <p className="mt-2 text-sm text-[var(--psm-muted)]">Apply a controlled preset. Backend permission guards enforce the result immediately.</p>
                <div className="mt-4 grid gap-2">
                  {module.presets.map((preset) => (
                    <button key={preset} className="psm-button psm-button-secondary justify-start" onClick={() => run(() => mutations.applyModulePreset.mutateAsync({ userId: user.id, input: { moduleKey: module.moduleKey, presetName: preset } }), `${preset} applied`)}>
                      <ShieldCheck size={16} /> {preset}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="psm-card p-4 text-sm text-[var(--psm-muted)]">You can view this user but cannot change permission overrides. Required permission: permissions.edit or roles.assign.</section>
        )
      ) : null}

      {activeTab === 'Effective Permissions' ? (
        <section className="psm-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide">Effective Permission Viewer</h2>
              <p className="mt-1 text-sm text-[var(--psm-muted)]">Merged role grants, user overrides, denies, and scope-aware access.</p>
            </div>
            <div className="flex gap-2">
              <input className="psm-input px-3 text-sm" value={testPermission} onChange={(event) => setTestPermission(event.target.value)} />
              <button className="psm-button psm-button-secondary" onClick={() => run(async () => {
                const result = await mutations.testPermission.mutateAsync({ id: user.id, permission: testPermission });
                setTestResult(result.allowed ? 'Allowed' : 'Denied');
              }, 'Permission tested')}>Test</button>
            </div>
          </div>
          {testResult ? <div className="mt-3 text-sm"><CheckCircle2 size={16} className="mr-2 inline text-success" />{testPermission}: {testResult}</div> : null}
          <div className="mt-4">
            {effectiveQuery.isLoading ? (
              <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">Loading effective permissions...</div>
            ) : (
              <PermissionModuleAccordion modules={effective?.permissionModules ?? effective?.modules} mode="admin-view" readOnly showSearch showCounts hideEmptyModules />
            )}
          </div>
        </section>
      ) : null}

      {activeTab === 'Assigned Records' ? (
        <section className="psm-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Removal Impact & Assigned Records</h2>
          <div className="mt-3 text-sm text-[var(--psm-muted)]">{impactQuery.data?.canRemove ? 'No active blockers found.' : 'Active blockers must be reassigned before deactivation, archive, or hard delete.'}</div>
          <div className="mt-3 grid gap-2">
            {(impactQuery.data?.blockers ?? []).map((blocker) => <div key={blocker.type} className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm">{blocker.message}</div>)}
            {(impactQuery.data?.records ?? []).map((record) => <div key={`${record.module}-${record.id}`} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm">{record.module}: {record.title}<span className="ml-2 text-[var(--psm-muted)]">{record.status}</span></div>)}
          </div>
        </section>
      ) : null}

      {activeTab === 'Audit History' ? (
        <section className="psm-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Audit History</h2>
          {auditQuery.isLoading ? <p className="mt-3 text-sm text-[var(--psm-muted)]">Loading audit events...</p> : null}
          {auditQuery.isError ? <p className="mt-3 text-sm text-danger">Unable to load audit events.</p> : null}
          <div className="mt-3 space-y-2">
            {(auditQuery.data ?? []).map((event) => (
              <div key={event.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold">{event.action}</span>
                  <span className="text-xs text-[var(--psm-muted)]">{event.createdAt ? new Date(event.createdAt).toLocaleString() : 'Time unavailable'}</span>
                </div>
                <div className="mt-1 text-xs text-[var(--psm-muted)]">{event.entityType ?? 'User'} · {event.entityId ?? user.id}</div>
              </div>
            ))}
            {!auditQuery.isLoading && !(auditQuery.data ?? []).length ? <p className="text-sm text-[var(--psm-muted)]">No audit events found for this user.</p> : null}
          </div>
        </section>
      ) : null}

      {['Security', 'E-Signature', 'Training', 'Activity'].includes(activeTab) ? (
        <section className="psm-card p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">{activeTab}</h2>
          <p className="mt-3 text-sm text-[var(--psm-muted)]">No live records are available for this user in this tab yet. Backend access control and audit hooks are active for related mutations.</p>
        </section>
      ) : null}
    </div>
  );
}

function InfoCard({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section className="psm-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
      <div className="mt-3 divide-y divide-[var(--psm-line)]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="text-[var(--psm-muted)]">{label}</span>
            <span className="text-right font-medium">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScopeCard({ title, values }: { title: string; values: string[] }) {
  return (
    <section className="psm-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.length ? values.map((value) => <span key={value} className="psm-badge psm-badge-muted">{value}</span>) : <span className="text-sm text-[var(--psm-muted)]">No access assigned.</span>}
      </div>
    </section>
  );
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
