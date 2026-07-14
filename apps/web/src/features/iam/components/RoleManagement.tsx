'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Search, ShieldPlus } from 'lucide-react';
import { useMutationToast } from '@/providers/ToastProvider';
import { getModuleDisplayName } from '@/features/permissions/utils/getModuleDisplayName';
import { type IamPermission, type IamRole } from '@/services/iam.service';
import { useIamMutations, useIamPermissions, useIamRoles } from '../hooks/useIam';

export function RoleManagement() {
  const rolesQuery = useIamRoles();
  const permissionsQuery = useIamPermissions();
  const mutations = useIamMutations();
  const toast = useMutationToast();
  const [form, setForm] = useState({ key: '', name: '' });
  const [selectedRole, setSelectedRole] = useState<IamRole | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [permissionSearch, setPermissionSearch] = useState('');

  const grouped = useMemo(() => {
    return (permissionsQuery.data ?? []).reduce<Record<string, IamPermission[]>>((acc, permission) => {
      const key = permission.moduleKey || permission.key.split('.')[0] || 'general';
      acc[key] = [...(acc[key] ?? []), permission];
      return acc;
    }, {});
  }, [permissionsQuery.data]);
  const filteredGrouped = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    if (!query) return grouped;
    return Object.fromEntries(
      Object.entries(grouped)
        .map(([moduleKey, permissions]) => [
          moduleKey,
          (permissions ?? []).filter((permission) => `${permission.key} ${permission.label} ${getModuleDisplayName(moduleKey)}`.toLowerCase().includes(query))
        ])
        .filter((entry): entry is [string, IamPermission[]] => Array.isArray(entry[1]) && entry[1].length > 0)
    ) as Record<string, IamPermission[]>;
  }, [grouped, permissionSearch]);

  function selectRole(role: IamRole) {
    setSelectedRole(role);
    setSelectedPermissions(new Set((role.rolePermissions ?? []).map((grant) => grant.permission?.id).filter(Boolean) as string[]));
  }

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      toast.success(message);
    } catch (error) {
      toast.error('Role action failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Roles & Permissions</h1>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Manage industrial roles and module-level permission grants.</p>
      </header>

      <section className="psm-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <ShieldPlus size={18} className="text-info" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Create Role</h2>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await mutations.createRole.mutateAsync(form);
              setForm({ key: '', name: '' });
            }, 'Role created');
          }}
          className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
        >
          <input required className="psm-input px-3 text-sm" placeholder="Role key, e.g. site_admin" value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} />
          <input required className="psm-input px-3 text-sm" placeholder="Role name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <button className="psm-button psm-button-primary">Create Role</button>
        </form>
      </section>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="psm-card overflow-hidden">
          <div className="border-b border-[var(--psm-line)] p-4 text-sm font-semibold uppercase tracking-wide">Roles</div>
          <div className="max-h-[calc(100vh-260px)] overflow-auto p-3">
            {(rolesQuery.data ?? []).map((role) => (
              <button key={role.id} onClick={() => selectRole(role)} className={`mb-2 w-full rounded-lg border p-3 text-left text-sm ${selectedRole?.id === role.id ? 'border-primary bg-primary/10' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]'}`}>
                <div className="font-semibold">{role.name}</div>
                <div className="text-xs text-[var(--psm-muted)]">{role.key} · {role.rolePermissions?.length ?? 0} permissions</div>
              </button>
            ))}
          </div>
        </section>

        <section className="psm-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--psm-line)] p-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide">Permission Matrix</div>
              <div className="mt-1 text-xs text-[var(--psm-muted)]">{selectedRole ? selectedRole.name : 'Select a role to edit permissions'}</div>
            </div>
            <button
              disabled={!selectedRole}
              onClick={() => selectedRole && run(() => mutations.setRolePermissions.mutateAsync({ roleId: selectedRole.id, permissionIds: [...selectedPermissions] }), 'Role permissions updated')}
              className="psm-button psm-button-primary"
            >
              Save Permissions
            </button>
          </div>
          <div className="max-h-[calc(100vh-260px)] overflow-auto p-4">
            {!selectedRole ? <div className="text-sm text-[var(--psm-muted)]">Choose a role from the left panel.</div> : null}
            <label className="relative mb-4 block">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]" />
              <input className="psm-input w-full py-2 pl-9 pr-3 text-sm" value={permissionSearch} onChange={(event) => setPermissionSearch(event.target.value)} placeholder="Search permissions or modules" />
            </label>
            <div className="space-y-3">
              {Object.entries(filteredGrouped).map(([moduleKey, permissions]) => (
                <details key={moduleKey} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <h3 className="text-sm font-semibold">{getModuleDisplayName(moduleKey)}</h3>
                      <div className="mt-1 text-xs text-[var(--psm-muted)]">{moduleKey}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="psm-badge psm-badge-info">{permissions.length} permissions</span>
                      <ChevronDown size={16} className="text-[var(--psm-muted)]" />
                    </div>
                  </summary>
                  <div className="grid gap-2 border-t border-[var(--psm-line)] p-4 md:grid-cols-2 xl:grid-cols-3">
                    {(permissions ?? []).map((permission) => (
                      <label key={permission.id} className="flex cursor-pointer items-start gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.has(permission.id)}
                          disabled={!selectedRole}
                          onChange={(event) => {
                            setSelectedPermissions((current) => {
                              const next = new Set(current);
                              if (event.target.checked) next.add(permission.id);
                              else next.delete(permission.id);
                              return next;
                            });
                          }}
                        />
                        <span>
                          <span className="block font-semibold">{permission.label}</span>
                          <span className="text-xs text-[var(--psm-muted)]">{permission.key}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </details>
              ))}
              {permissionSearch && !Object.keys(filteredGrouped).length ? <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4 text-sm text-[var(--psm-muted)]">No permissions match your search.</div> : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
