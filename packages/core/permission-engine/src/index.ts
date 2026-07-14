export function canDo(userPermissions: string[], permission: string): boolean {
  return userPermissions.includes(permission);
}

export function canDoAll(userPermissions: string[], permissions: string[]): boolean {
  return permissions.every((permission) => canDo(userPermissions, permission));
}
