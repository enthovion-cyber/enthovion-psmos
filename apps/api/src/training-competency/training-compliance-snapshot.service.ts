import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { TrainingComplianceEngineService } from './training-compliance-engine.service';

type Row = Record<string, any>;

@Injectable()
export class TrainingComplianceSnapshotService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService, private readonly engine: TrainingComplianceEngineService) {}

  async list(user: RequestUser, query: Row = {}) {
    let req: any = this.db.from('training_compliance_snapshots').select('*').eq('company_id', user.tenantId);
    if (query.siteId) req = req.eq('site_id', query.siteId);
    if (query.workerId) req = req.eq('worker_id', query.workerId);
    if (query.snapshotScope) req = req.eq('snapshot_scope', query.snapshotScope);
    return this.db.many<Row>(req.order('calculated_at', { ascending: false }).limit(Math.min(Number(query.limit ?? 50), 200))).catch(() => []);
  }

  async recalculate(user: RequestUser, dto: Row = {}) {
    const result = dto.workerId ? await this.engine.calculateWorker(user, dto.workerId) : await this.engine.calculateCompany(user, dto);
    const row = await this.db.single<Row>(this.db.from('training_compliance_snapshots').insert({
      id: randomUUID(),
      company_id: user.tenantId,
      site_id: dto.siteId ?? user.selectedSiteId ?? user.activeSiteId ?? null,
      unit_id: dto.unitId ?? null,
      area_id: dto.areaId ?? null,
      worker_id: dto.workerId ?? null,
      snapshot_scope: result.snapshotScope,
      snapshot_scope_id: result.snapshotScopeId,
      compliance_status: result.complianceStatus,
      compliance_score: result.complianceScore,
      matrix_status: this.statusFromWorkers(result.workers, 'matrixStatus'),
      competency_status: this.statusFromWorkers(result.workers, 'competencyStatus'),
      training_record_status: this.statusFromWorkers(result.workers, 'trainingRecordStatus'),
      certification_status: this.statusFromWorkers(result.workers, 'certificationStatus'),
      assessment_status: this.statusFromWorkers(result.workers, 'assessmentStatus'),
      sop_ack_status: this.statusFromWorkers(result.workers, 'sopAckStatus'),
      moc_training_status: this.statusFromWorkers(result.workers, 'mocTrainingStatus'),
      pssr_training_status: this.statusFromWorkers(result.workers, 'pssrTrainingStatus'),
      ptw_authorization_status: this.statusFromWorkers(result.workers, 'ptwAuthorizationStatus'),
      safety_critical_gap_count: result.safetyCriticalGapCount,
      open_gap_count: result.openGapCount,
      overdue_count: result.overdueCount,
      expired_count: result.expiredCount,
      waiver_count: result.waiverCount,
      pending_approval_count: result.pendingApprovalCount,
      calculated_by: user.id,
      result_json: result
    }).select('*').single()).catch(() => null);
    await this.writeHistory(user, 'Compliance Snapshot Created', row ?? result);
    return row ?? result;
  }

  private statusFromWorkers(workers: Row[] = [], key: string) {
    const values = workers.map((row) => row[key]).filter(Boolean);
    if (!values.length) return 'Unknown / Data Missing';
    if (values.some((value) => ['Blocked', 'Expired', 'Overdue', 'Non-Compliant', 'Not Authorized'].includes(String(value)))) return 'Blocked';
    if (values.some((value) => String(value).startsWith('Pending'))) return 'Pending Verification';
    if (values.every((value) => ['Complete', 'Current', 'Competent', 'Authorized', 'Compliant'].includes(String(value)))) return 'Compliant';
    return 'Partially Compliant';
  }

  private async writeHistory(user: RequestUser, title: string, after: Row | null) {
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: 'training.final_integration.compliance_snapshot', entityType: 'TrainingComplianceSnapshot', entityId: after?.id, after: after as JsonValue, metadata: { title } as JsonValue }).catch(() => null);
  }
}
