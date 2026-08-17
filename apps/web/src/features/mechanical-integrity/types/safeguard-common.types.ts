export type MiSafeguardKind = 'SIF' | 'Interlock' | 'Critical Alarm';

export type MiSafeguardRow = Record<string, any> & {
  id: string;
  status?: string;
  dueStatus?: string;
  due_status?: string;
  tag?: string;
  name?: string;
  description?: string;
};

export type MiSafeguardRegistryResponse<T = MiSafeguardRow> = {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  summary?: Record<string, any>;
  permissions?: Record<string, boolean>;
  filters?: Record<string, any>;
};

export type MiSafeguardDetailResponse<T = MiSafeguardRow> = {
  record?: T;
  row?: T;
  sif?: T;
  interlock?: T;
  alarm?: T;
  devices?: MiSafeguardRow[];
  lopaSil?: MiSafeguardRow | null;
  causeEffect?: MiSafeguardRow | null;
  silData?: MiSafeguardRow | null;
  testRequirements?: MiSafeguardRow[];
  readiness?: MiSafeguardRow | null;
  history?: MiSafeguardRow[];
  permissions?: Record<string, boolean>;
};

export type MiSafeguardDashboardResponse = MiSafeguardRegistryResponse & {
  header?: Record<string, any>;
  health?: Record<string, any>;
  due?: MiSafeguardRow[];
  overdue?: MiSafeguardRow[];
  failed?: MiSafeguardRow[];
  bypassed?: MiSafeguardRow[];
};
