import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;

const compliantStatuses = new Set(['Complete', 'Current', 'Competent', 'Authorized', 'Approved', 'Verified', 'Compliant']);
const pendingStatuses = new Set(['Pending Evidence', 'Pending Verification', 'Pending Approval', 'Pending Review', 'Not Assessed']);
const blockedStatuses = new Set(['Blocked', 'Not Authorized', 'Non-Compliant', 'Failed']);
const expiredStatuses = new Set(['Expired', 'Overdue']);

@Injectable()
export class TrainingComplianceEngineService {
  constructor(private readonly db: SupabaseService) {}

  async calculateCompany(user: RequestUser, query: Row = {}) {
    const workers = await this.scopedWorkers(user, query);
    return this.calculateScope(workers, 'Company', query.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null);
  }

  async calculateWorker(user: RequestUser, workerId: string) {
    const workers = await this.scopedWorkers(user, { workerId });
    return this.calculateScope(workers, 'Worker', workerId);
  }

  calculateScope(workers: Row[], snapshotScope: string, snapshotScopeId?: string | null) {
    const workerResults = workers.map((worker) => this.calculateWorkerFromRow(worker));
    const total = workerResults.length;
    const compliant = workerResults.filter((row) => row.complianceStatus === 'Compliant').length;
    const partial = workerResults.filter((row) => row.complianceStatus === 'Partially Compliant').length;
    const blocked = workerResults.filter((row) => ['Blocked', 'Non-Compliant'].includes(row.complianceStatus)).length;
    const pending = workerResults.filter((row) => String(row.complianceStatus).startsWith('Pending')).length;
    const score = total ? Math.round(((compliant + partial * 0.5) / total) * 100) : null;
    return {
      snapshotScope,
      snapshotScopeId: snapshotScopeId ?? null,
      complianceStatus: total === 0 ? 'Unknown / Data Missing' : blocked ? 'Blocked' : pending ? 'Pending Verification' : compliant === total ? 'Compliant' : 'Partially Compliant',
      complianceScore: score,
      totalWorkers: total,
      compliantWorkers: compliant,
      partiallyCompliantWorkers: partial,
      blockedWorkers: blocked,
      pendingWorkers: pending,
      safetyCriticalGapCount: workerResults.reduce((sum, row) => sum + row.safetyCriticalGapCount, 0),
      openGapCount: workerResults.reduce((sum, row) => sum + row.openGapCount, 0),
      overdueCount: workerResults.reduce((sum, row) => sum + row.overdueCount, 0),
      expiredCount: workerResults.reduce((sum, row) => sum + row.expiredCount, 0),
      waiverCount: workerResults.reduce((sum, row) => sum + row.waiverCount, 0),
      pendingApprovalCount: workerResults.reduce((sum, row) => sum + row.pendingApprovalCount, 0),
      workers: workerResults
    };
  }

  calculateWorkerFromRow(worker: Row) {
    const statuses = {
      matrixStatus: worker.matrix_status ?? worker.training_status ?? 'Unknown / Data Missing',
      competencyStatus: worker.competency_status ?? 'Unknown / Data Missing',
      trainingRecordStatus: worker.training_record_status ?? worker.training_status ?? 'Unknown / Data Missing',
      certificationStatus: worker.certification_status ?? 'Unknown / Data Missing',
      assessmentStatus: worker.assessment_status ?? 'Unknown / Data Missing',
      sopAckStatus: worker.sop_acknowledgement_status ?? 'Unknown / Data Missing',
      mocTrainingStatus: worker.moc_training_status ?? 'Unknown / Data Missing',
      pssrTrainingStatus: worker.pssr_training_readiness_status ?? 'Unknown / Data Missing',
      ptwAuthorizationStatus: worker.ptw_authorization_status ?? 'Unknown / Data Missing'
    };
    const values = Object.values(statuses).map((value) => String(value ?? 'Unknown / Data Missing'));
    const openGapCount = values.filter((value) => blockedStatuses.has(value) || value.includes('Missing') || value.includes('Incomplete')).length;
    const overdueCount = values.filter((value) => value === 'Overdue').length;
    const expiredCount = values.filter((value) => expiredStatuses.has(value)).length;
    const pendingApprovalCount = values.filter((value) => pendingStatuses.has(value)).length;
    const safetyCriticalGapCount = worker.safety_critical_role && openGapCount ? 1 : 0;
    const completeCount = values.filter((value) => compliantStatuses.has(value)).length;
    const complianceStatus = values.some((value) => blockedStatuses.has(value)) ? 'Blocked'
      : expiredCount ? 'Expired'
        : overdueCount ? 'Overdue'
          : pendingApprovalCount ? 'Pending Verification'
            : completeCount === values.length ? 'Compliant'
              : completeCount > 0 ? 'Partially Compliant'
                : 'Unknown / Data Missing';
    return {
      workerId: worker.id,
      workerName: worker.display_name,
      siteId: worker.primary_site_id,
      complianceStatus,
      complianceScore: Math.round((completeCount / values.length) * 100),
      safetyCriticalGapCount,
      openGapCount,
      overdueCount,
      expiredCount,
      waiverCount: Number(worker.active_waiver_count ?? 0),
      pendingApprovalCount,
      ...statuses
    };
  }

  async scopedWorkers(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_workers').select('*').eq('company_id', user.tenantId);
    if (query.workerId) req = req.eq('id', query.workerId);
    if (query.siteId) req = req.eq('primary_site_id', this.assertSiteAccess(user, query.siteId));
    else if (user.selectedSiteId ?? user.activeSiteId) req = req.eq('primary_site_id', this.assertSiteAccess(user, user.selectedSiteId ?? user.activeSiteId));
    else if (!this.corporateView(user) && (user.siteIds ?? []).length) req = req.in('primary_site_id', user.siteIds ?? []);
    else if (!this.corporateView(user)) req = req.eq('primary_site_id', '__no_site_access__');
    return this.db.many<Row>(req.limit(Math.min(Number(query.limit ?? 500), 1000))).catch(() => []);
  }

  private corporateView(user: RequestUser) {
    return Boolean(user.corporateView || user.isSuperAdmin || user.isCompanyAdmin);
  }

  private assertSiteAccess(user: RequestUser, siteId?: string | null) {
    if (!siteId) return siteId;
    if (!this.corporateView(user) && (user.siteIds ?? []).length && !(user.siteIds ?? []).includes(siteId)) throw new Error('You do not have access to the selected site.');
    return siteId;
  }
}
