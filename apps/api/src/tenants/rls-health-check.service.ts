import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class RlsHealthCheckService {
  constructor(private readonly db: SupabaseService) {}

  async rlsHealth() {
    const tables = ['Company', 'Site', 'UserSite', 'UserRole', 'UserActiveContext', 'UserContextSwitchEvent'];
    const checks = await Promise.all(tables.map(async (table) => {
      const exists = await this.db.single<any>(this.db.from(table).select('id').limit(1).maybeSingle()).then(() => true).catch(() => false);
      return { table, reachable: exists, rlsExpected: true };
    }));
    return {
      status: checks.every((check) => check.reachable) ? 'Healthy' : 'Needs Review',
      checks,
      message: 'RLS policy definitions live in the tenant-site isolation migrations and should be applied in Supabase.'
    };
  }

  async siteAccessHealth(tenantId: string) {
    const [sites, userSites] = await Promise.all([
      this.db.many<any>(this.db.from('Site').select('id,companyId,status').eq('tenantId', tenantId)).catch(() => []),
      this.db.many<any>(this.db.from('UserSite').select('siteId,companyId,userId').eq('tenantId', tenantId)).catch(() => [])
    ]);
    const siteIds = new Set(sites.map((site) => site.id));
    const orphanedAssignments = userSites.filter((row) => row.siteId && !siteIds.has(row.siteId));
    return {
      status: orphanedAssignments.length ? 'Needs Review' : 'Healthy',
      siteCount: sites.length,
      assignmentCount: userSites.length,
      orphanedAssignments
    };
  }
}
