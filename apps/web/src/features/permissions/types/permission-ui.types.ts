export type PermissionUiMode = 'profile' | 'admin-view' | 'role-editor';

export type PermissionUiScope = {
  companyIds?: string[];
  siteIds?: string[];
  unitIds?: string[];
  areaIds?: string[];
};

export type PermissionUiItem = {
  id?: string;
  key: string;
  label?: string | null;
  moduleKey?: string | null;
  moduleLabel?: string | null;
  scope?: string | PermissionUiScope | null;
  source?: string | null;
  allowed?: boolean;
  denied?: boolean;
};

export type PermissionUiModule = {
  moduleKey: string;
  moduleLabel: string;
  allowedCount: number;
  deniedCount?: number;
  permissions: PermissionUiItem[];
};

export type EffectivePermissionUiSummary = {
  permissions: string[];
  deniedPermissions?: string[];
  permissionModules?: PermissionUiModule[];
  modules?: PermissionUiModule[];
  scopes?: PermissionUiScope;
};

