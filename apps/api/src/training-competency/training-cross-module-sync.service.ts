import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;

@Injectable()
export class TrainingCrossModuleSyncService {
  constructor(private readonly db: SupabaseService) {}

  async events(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_module_sync_events').select('*').eq('company_id', user.tenantId);
    if (query.sourceModule) req = req.eq('source_module', query.sourceModule);
    if (query.targetModule) req = req.eq('target_module', query.targetModule);
    return this.db.many<Row>(req.order('triggered_at', { ascending: false }).limit(Math.min(Number(query.limit ?? 100), 300))).catch(() => []);
  }

  async record(user: RequestUser, dto: Row) {
    const row = {
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? user.activeSiteId ?? null,
      source_module: dto.sourceModule ?? dto.source_module ?? 'Training & Competency',
      source_record_id: dto.sourceRecordId ?? dto.source_record_id ?? null,
      target_module: dto.targetModule ?? dto.target_module ?? 'Training & Competency',
      target_record_id: dto.targetRecordId ?? dto.target_record_id ?? null,
      sync_type: dto.syncType ?? dto.sync_type ?? 'Manual Reconciliation',
      sync_status: dto.syncStatus ?? dto.sync_status ?? 'Completed',
      sync_message: dto.syncMessage ?? dto.sync_message ?? null,
      before_value_json: dto.before ?? dto.before_value_json ?? null,
      after_value_json: dto.after ?? dto.after_value_json ?? null,
      triggered_by: user.id,
      completed_at: new Date().toISOString()
    };
    return this.db.single<Row>(this.db.from('training_module_sync_events').insert(row).select('*').single()).catch(() => row);
  }
}
