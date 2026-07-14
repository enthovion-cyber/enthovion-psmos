import type { PermissionUiItem, PermissionUiModule } from '../types/permission-ui.types';
import { filterAllowedPermissions } from './filterAllowedPermissions';
import { getModuleDisplayName, normalizeModuleKey } from './getModuleDisplayName';

export function groupPermissionsByModule(permissions: PermissionUiItem[], options: { showDenied?: boolean; hideEmptyModules?: boolean } = {}): PermissionUiModule[] {
  const grouped = new Map<string, PermissionUiItem[]>();
  for (const permission of filterAllowedPermissions(permissions, options.showDenied)) {
    const moduleKey = normalizeModuleKey(permission.moduleKey ?? permission.key.split('.')[0]);
    grouped.set(moduleKey, [...(grouped.get(moduleKey) ?? []), { ...permission, moduleKey }]);
  }

  return [...grouped.entries()]
    .map(([moduleKey, rows]) => ({
      moduleKey,
      moduleLabel: getModuleDisplayName(moduleKey),
      allowedCount: rows.filter((row) => !row.denied && row.allowed !== false).length,
      deniedCount: rows.filter((row) => row.denied || row.allowed === false).length,
      permissions: rows.sort((a, b) => a.key.localeCompare(b.key))
    }))
    .filter((module) => !options.hideEmptyModules || module.allowedCount > 0 || (options.showDenied && (module.deniedCount ?? 0) > 0))
    .sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel));
}

