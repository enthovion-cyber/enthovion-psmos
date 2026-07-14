export type PermissionCheck = {
  permission: string;
  allowed: boolean;
};

export type EffectivePermissions = {
  permissions: string[];
  deniedPermissions?: string[];
};
