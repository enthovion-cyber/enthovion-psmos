export function getPermissionDisplayName(permissionKey: string, label?: string | null) {
  if (label && label.trim()) return label;
  const [, ...parts] = permissionKey.split('.');
  const source = parts.length ? parts.join(' ') : permissionKey.replace(/[:._-]/g, ' ');
  return source
    .replace(/[_:-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

