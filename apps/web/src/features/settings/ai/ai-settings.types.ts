export type AiSettings = {
  enabled: boolean;
  approvedModels: string[];
  retentionDays: number;
  provider: string;
  updatedAt?: string;
};

export type UpdateAiSettingsInput = {
  enabled?: boolean;
  approvedModels?: string[];
  retentionDays?: number;
};

export type AiAuditEvent = {
  id: string;
  tenantId: string;
  siteId: string | null;
  userId: string | null;
  kind: string;
  model: string | null;
  promptVersion: string | null;
  sourceIds: string[];
  prevHash: string | null;
  hash: string;
  createdAt: string;
};

export type AiAuditLogsResponse = {
  items: AiAuditEvent[];
  limit: number;
  offset: number;
};
