import { Injectable } from '@nestjs/common';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

export type AuditInput = {
  tenantId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: JsonValue;
  after?: JsonValue;
  metadata?: JsonValue;
};

@Injectable()
export class AuditService {
  constructor(private readonly db: SupabaseService) {}

  write(input: AuditInput) {
    return this.db.single(
      this.db.from('AuditLog').insert({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: input.before ?? null,
        after: input.after ?? null,
        metadata: input.metadata ?? null
      }).select().single()
    );
  }
}
