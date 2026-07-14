import type { PermissionUiItem } from '../types/permission-ui.types';

export function filterAllowedPermissions(permissions: PermissionUiItem[], showDenied = false) {
  return permissions.filter((permission) => {
    if (permission.denied || permission.allowed === false) return showDenied;
    return true;
  });
}

