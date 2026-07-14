export type TenantScoped = {
  tenantId: string;
};

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ModuleKey = 'foundation' | 'equipment' | 'ptw' | 'moc' | 'hazop' | 'pssr' | 'hazard-reporting';

export type UserSummary = TenantScoped & {
  id: string;
  email: string;
  displayName: string;
  title?: string;
  permissions: string[];
};

export type ActionSummary = TenantScoped & {
  id: string;
  moduleKey: ModuleKey;
  sourceType: string;
  sourceId: string;
  title: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'SAFETY_CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'CLOSED' | 'CANCELLED';
  dueDate: string;
};
