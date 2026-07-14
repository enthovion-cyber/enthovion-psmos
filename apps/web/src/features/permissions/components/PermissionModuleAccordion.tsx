'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { PermissionUiItem, PermissionUiMode, PermissionUiModule } from '../types/permission-ui.types';
import { groupPermissionsByModule } from '../utils/groupPermissionsByModule';
import { PermissionBadge } from './PermissionBadge';
import { NoAllowedPermissionsState } from './NoAllowedPermissionsState';

type PermissionModuleAccordionProps = {
  permissions?: PermissionUiItem[] | undefined;
  modules?: PermissionUiModule[] | undefined;
  mode?: PermissionUiMode;
  showDenied?: boolean;
  readOnly?: boolean;
  showSearch?: boolean;
  showCounts?: boolean;
  hideEmptyModules?: boolean;
};

export function PermissionModuleAccordion({
  permissions = [],
  modules,
  mode = 'profile',
  showDenied = false,
  readOnly = true,
  showSearch = true,
  showCounts = true,
  hideEmptyModules = true
}: PermissionModuleAccordionProps) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const sourceModules = useMemo(() => modules ?? groupPermissionsByModule(permissions, { showDenied, hideEmptyModules }), [hideEmptyModules, modules, permissions, showDenied]);
  const filteredModules = useMemo(() => {
    if (!normalizedQuery) return sourceModules;
    return sourceModules
      .map((module) => ({
        ...module,
        permissions: module.permissions.filter((permission) => `${permission.key} ${permission.label ?? ''} ${module.moduleLabel}`.toLowerCase().includes(normalizedQuery))
      }))
      .filter((module) => module.permissions.length > 0);
  }, [normalizedQuery, sourceModules]);

  const allowedCount = sourceModules.reduce((total, module) => total + module.allowedCount, 0);
  const moduleCount = sourceModules.length;

  if (!moduleCount) return <NoAllowedPermissionsState />;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Allowed Permissions" value={allowedCount} />
        <Summary label="Visible Modules" value={moduleCount} />
        <Summary label="View Mode" value={mode === 'profile' ? 'My access' : mode === 'admin-view' ? 'Admin review' : 'Role editor'} />
      </div>
      {showSearch ? (
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]" />
          <input className="psm-input w-full py-2 pl-9 pr-3 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search allowed permissions or modules" />
        </label>
      ) : null}
      <div className="space-y-3">
        {filteredModules.map((module, index) => (
          <details key={module.moduleKey} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]" open={index === 0 && moduleCount <= 2}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-sm font-semibold">{module.moduleLabel}</div>
                <div className="mt-1 text-xs text-[var(--psm-muted)]">{module.moduleKey}</div>
              </div>
              <div className="flex items-center gap-2">
                {showCounts ? <span className="psm-badge psm-badge-info">{module.allowedCount} allowed</span> : null}
                <ChevronDown size={16} className="text-[var(--psm-muted)]" />
              </div>
            </summary>
            <div className="grid gap-2 border-t border-[var(--psm-line)] p-4 md:grid-cols-2 xl:grid-cols-3">
              {module.permissions.map((permission) => <PermissionBadge key={permission.key} permission={{ ...permission, moduleKey: module.moduleKey, moduleLabel: module.moduleLabel }} readOnly={readOnly} />)}
            </div>
          </details>
        ))}
        {!filteredModules.length ? <NoAllowedPermissionsState message="No allowed permissions match your search." /> : null}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
      <div className="text-xs text-[var(--psm-muted)]">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
