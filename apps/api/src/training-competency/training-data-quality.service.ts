import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;

@Injectable()
export class TrainingDataQualityService {
  constructor(private readonly db: SupabaseService) {}

  async list(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_data_quality_issues').select('*').eq('company_id', user.tenantId);
    if (query.siteId) req = req.eq('site_id', query.siteId);
    if (query.issueStatus) req = req.eq('issue_status', query.issueStatus);
    return this.db.many<Row>(req.order('detected_at', { ascending: false }).limit(Math.min(Number(query.limit ?? 100), 300))).catch(() => []);
  }

  async run(user: RequestUser, query: Row = {}) {
    const [workers, records, approvals] = await Promise.all([
      this.rows(user, 'training_workers', query),
      this.rows(user, 'training_completion_records', query),
      this.rows(user, 'training_approval_requests', query)
    ]);
    const issues: Row[] = [];
    for (const worker of workers) {
      if (!worker.primary_site_id) issues.push(this.issue(user, worker, 'Workforce', 'Worker without site assignment', 'Worker profile has no primary site assignment.', 'High', 'Assign a valid site or archive the worker.'));
      if (!worker.job_title && !worker.current_role_assignment) issues.push(this.issue(user, worker, 'Workforce', 'Worker without role', 'Worker profile has no current role or job title.', 'Medium', 'Assign role or competency profile.'));
    }
    for (const record of records) {
      if (!record.worker_id) issues.push(this.issue(user, record, 'Training Records', 'Training record without worker', 'Completion record is not linked to a worker.', 'Critical', 'Link a valid worker or void the record.'));
      if (!record.training_item_id && !record.training_id) issues.push(this.issue(user, record, 'Training Records', 'Training record without training item/version', 'Completion record lacks required training source.', 'High', 'Link the required training item and version.'));
    }
    for (const approval of approvals) {
      if (approval.stale_status === 'Stale' && !['Returned', 'Cancelled', 'Rejected'].includes(approval.approval_status)) issues.push(this.issue(user, approval, 'Review & Approval', 'Approval package stale but still approvable', 'Approval package is stale and must be revalidated before decision.', 'High', 'Run validation or resubmit package.'));
    }
    const saved = await Promise.all(issues.map((issue) => this.db.single<Row>(this.db.from('training_data_quality_issues').insert(issue).select('*').single()).catch(() => issue)));
    return { rows: saved, summary: this.summary(saved), detectedAt: new Date().toISOString() };
  }

  summary(rows: Row[]) {
    return {
      totalIssues: rows.length,
      critical: rows.filter((row) => row.severity === 'Critical').length,
      high: rows.filter((row) => row.severity === 'High').length,
      medium: rows.filter((row) => row.severity === 'Medium').length,
      open: rows.filter((row) => row.issue_status !== 'Resolved').length
    };
  }

  private async rows(user: RequestUser, table: string, query: Row) {
    let req: any = this.db.from(table).select('*').eq('company_id', user.tenantId).limit(500);
    const siteId = query.siteId ?? user.selectedSiteId ?? user.activeSiteId;
    if (siteId) req = req.or(`site_id.eq.${siteId},primary_site_id.eq.${siteId}`);
    return this.db.many<Row>(req).catch(() => []);
  }

  private issue(user: RequestUser, source: Row, module: string, title: string, description: string, severity: string, recommendedFix: string) {
    return {
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: source.site_id ?? source.primary_site_id ?? null,
      unit_id: source.unit_id ?? null,
      area_id: source.area_id ?? null,
      worker_id: source.worker_id ?? source.id ?? null,
      source_module: module,
      source_record_id: source.id ?? null,
      issue_type: title,
      issue_title: title,
      issue_description: description,
      severity,
      issue_status: 'Open',
      recommended_fix: recommendedFix,
      detected_at: new Date().toISOString()
    };
  }
}
