const moduleLabels: Record<string, string> = {
  ptw: 'Permit to Work',
  moc: 'Management of Change',
  pssr: 'Pre-Startup Safety Review',
  hazop: 'HAZOP / PHA',
  lopa: 'LOPA / SIL',
  incidents: 'Incident Investigation',
  equipment: 'Equipment Registry',
  documents: 'Document Control',
  actions: 'Action Center',
  notifications: 'Notifications',
  search: 'Global Search',
  users: 'User Management',
  roles: 'Roles & Permissions',
  permissions: 'Permission Engine',
  settings: 'Settings',
  company: 'Company',
  site: 'Sites / Plants',
  unit: 'Process Units',
  area: 'Areas',
  department: 'Departments',
  billing: 'Billing',
  entitlements: 'Entitlements',
  signature: 'E-Signature',
  audit: 'Audit'
};

export function getModuleDisplayName(moduleKey?: string | null) {
  const key = normalizeModuleKey(moduleKey);
  return moduleLabels[key] ?? key.split(/[_-]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function normalizeModuleKey(moduleKey?: string | null) {
  return (moduleKey || 'general').replace(/^module\./, '').toLowerCase();
}

