import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class UsageEventService {
  constructor(private readonly db: SupabaseService) {}

  record(input: { companyId: string; siteId?: string | null; userId?: string | null; usageKey: string; deltaValue: number; usageUnit?: string; sourceModule?: string; sourceRecordId?: string | null; eventType?: string; metadata?: Record<string, unknown> }) {
    return this.db.single(this.db.from('company_usage_events').insert({
      id: crypto.randomUUID(),
      company_id: input.companyId,
      site_id: input.siteId ?? null,
      user_id: input.userId ?? null,
      usage_key: input.usageKey,
      delta_value: input.deltaValue,
      usage_unit: input.usageUnit ?? 'count',
      source_module: input.sourceModule ?? null,
      source_record_id: input.sourceRecordId ?? null,
      event_type: input.eventType ?? 'usage_recorded',
      metadata_json: input.metadata ?? {}
    }).select().single());
  }
}
