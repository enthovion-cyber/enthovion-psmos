export type AuditRecord = {
  tenantId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  createdAt: string;
};

export function createAuditRecord(input: Omit<AuditRecord, 'createdAt'>): AuditRecord {
  return { ...input, createdAt: new Date().toISOString() };
}
