import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class UsageCounterService {
  constructor(private readonly db: SupabaseService) {}

  list(companyId: string) {
    return this.db.many<any>(this.db.from('company_usage_counters').select('*').eq('company_id', companyId).order('usage_key'));
  }

  async recalculate(companyId: string) {
    const [activeUsers, pendingInvites, activeSites] = await Promise.all([
      this.db.many<any>(this.db.from('UserSite').select('userId').eq('companyId', companyId)).catch(() => []),
      this.db.many<any>(this.db.from('Invitation').select('id').eq('companyId', companyId).eq('status', 'PENDING')).catch(() => []),
      this.db.many<any>(this.db.from('Site').select('id').eq('companyId', companyId).eq('status', 'ACTIVE')).catch(() => [])
    ]);
    const counters = [
      { usage_key: 'seats.active', usage_value: new Set(activeUsers.map((row) => row.userId)).size, usage_unit: 'users' },
      { usage_key: 'seats.pending_invites', usage_value: pendingInvites.length, usage_unit: 'users' },
      { usage_key: 'sites.active', usage_value: activeSites.length, usage_unit: 'sites' },
      { usage_key: 'storage.used_gb', usage_value: 0, usage_unit: 'GB' },
      { usage_key: 'exports.monthly', usage_value: 0, usage_unit: 'exports' }
    ];
    for (const counter of counters) {
      await this.db.single(
        this.db.from('company_usage_counters').upsert({
          id: crypto.randomUUID(),
          company_id: companyId,
          site_id: null,
          ...counter,
          period_start: null,
          period_end: null,
          last_calculated_at: new Date().toISOString(),
          metadata_json: {}
        }, { onConflict: 'company_id,site_id,usage_key,period_start,period_end' }).select().single()
      ).catch(async () => {
        await this.db.single(this.db.from('company_usage_counters').insert({
          id: crypto.randomUUID(),
          company_id: companyId,
          site_id: null,
          ...counter,
          last_calculated_at: new Date().toISOString(),
          metadata_json: {}
        }).select().single()).catch(() => null);
      });
    }
    return this.list(companyId);
  }
}
