import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

const finalTables = ['training_compliance_snapshots', 'training_integration_health_checks', 'training_data_quality_issues', 'training_module_sync_events', 'training_final_hardening_checks', 'training_production_hardening_settings'];

@Injectable()
export class TrainingRlsAuditService {
  constructor(private readonly db: SupabaseService) {}
  async audit() {
    const rows = await Promise.all(finalTables.map(async (table) => {
      const reachable = await this.db.many(this.db.from(table).select('id').limit(1)).then(() => true).catch(() => false);
      return { table, rlsExpected: true, grantExpected: true, dataApiReachable: reachable, status: reachable ? 'Reachable' : 'Unavailable / Migration Required' };
    }));
    return rows;
  }
}
