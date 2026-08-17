import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;

const integrations = ['Workforce', 'Training Matrix', 'Competency Profiles', 'Required Training', 'Training Records', 'Certifications', 'Assessments', 'SOP Acknowledgements', 'MOC Training', 'PSSR Training', 'PTW Authorization', 'Reports', 'Review & Approval', 'Audit Log', 'IAM / RBAC'];

@Injectable()
export class TrainingIntegrationHealthService {
  constructor(private readonly db: SupabaseService) {}

  async list(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_integration_health_checks').select('*').eq('company_id', user.tenantId);
    if (query.siteId) req = req.eq('site_id', query.siteId);
    return this.db.many<Row>(req.order('last_checked_at', { ascending: false }).limit(Math.min(Number(query.limit ?? 100), 300))).catch(() => []);
  }

  async run(user: RequestUser, dto: Row = {}) {
    const siteId = dto.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null;
    const rows = await Promise.all(integrations.map(async (name) => {
      const status = await this.integrationStatus(user, name);
      const row = {
        id: randomUUID(),
        company_id: user.tenantId,
        site_id: siteId,
        health_scope: siteId ? 'Site' : 'Company',
        module_name: 'Training & Competency',
        integration_name: name,
        status: status.status,
        last_checked_at: new Date().toISOString(),
        issue_count: status.issueCount,
        warning_count: status.warningCount,
        error_count: status.errorCount,
        result_json: status
      };
      return this.db.single<Row>(this.db.from('training_integration_health_checks').insert(row).select('*').single()).catch(() => row);
    }));
    return { rows, summary: this.summary(rows), checkedAt: new Date().toISOString() };
  }

  summary(rows: Row[]) {
    return {
      totalIntegrations: rows.length,
      healthy: rows.filter((row) => row.status === 'Healthy').length,
      warnings: rows.filter((row) => row.status === 'Warning').length,
      errors: rows.filter((row) => row.status === 'Error').length,
      unavailable: rows.filter((row) => row.status === 'Unavailable').length
    };
  }

  private async integrationStatus(user: RequestUser, name: string) {
    const tableByName: Record<string, string> = {
      'Workforce': 'training_workers',
      'Training Matrix': 'training_matrix_rules',
      'Competency Profiles': 'training_competency_profiles',
      'Required Training': 'training_required_items',
      'Training Records': 'training_completion_records',
      'Certifications': 'training_certificates',
      'Assessments': 'training_assessments',
      'SOP Acknowledgements': 'training_sop_acknowledgement_requirements',
      'MOC Training': 'training_moc_requirements',
      'PSSR Training': 'training_pssr_readiness',
      'PTW Authorization': 'training_ptw_authorizations',
      'Reports': 'training_generated_reports',
      'Review & Approval': 'training_approval_requests'
    };
    const table = tableByName[name];
    if (!table) return { integration: name, status: 'Healthy', issueCount: 0, warningCount: 0, errorCount: 0, message: 'Foundation adapter available.' };
    const rows = await this.db.many<Row>(this.db.from(table).select('id').eq('company_id', user.tenantId).limit(1)).catch(() => null);
    if (rows === null) return { integration: name, status: 'Unavailable', issueCount: 1, warningCount: 0, errorCount: 1, message: `${table} is unavailable or not migrated.` };
    return { integration: name, status: rows.length ? 'Healthy' : 'Warning', issueCount: 0, warningCount: rows.length ? 0 : 1, errorCount: 0, message: rows.length ? 'Real backend data reachable.' : 'Backend table is reachable but no records exist in current scope.' };
  }
}
