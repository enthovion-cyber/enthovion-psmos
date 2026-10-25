import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../database/supabase.service';
import type { OpScope } from './operating-procedures.service';

type Row = Record<string, any>;

@Injectable()
export class OpAcknowledgmentService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  // ---------------------------------------------------------------- Auto-Seed on Publication
  async generateAssignmentsForPublication(userId: string, scope: OpScope, procedureId: string, revisionId: string, dto: Row = {}) {
    const proc = await this.assertProcedure(scope, procedureId);
    const rev = await this.assertRevision(scope, revisionId);

    const graceDays = dto.gracePeriodDays ?? 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + graceDays);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    const requirementId = crypto.randomUUID();
    const req = await this.db.single<Row>(
      this.db.from('op_acknowledgment_requirements').insert({
        id: requirementId,
        company_id: scope.companyId,
        site_id: proc.site_id ?? scope.selectedSiteId,
        procedure_id: procedureId,
        revision_id: revisionId,
        requirement_title: `Read & Understand: ${proc.procedure_number} (${rev.revision_label})`,
        target_audience: dto.targetAudience ?? 'Operating Crew',
        target_role_ids: dto.targetRoleIds ?? [],
        target_unit_ids: dto.targetUnitIds ?? (proc.unit_id ? [proc.unit_id] : []),
        target_user_ids: dto.targetUserIds ?? [],
        grace_period_days: graceDays,
        due_date: dueDateStr,
        requires_quiz: Boolean(dto.requiresQuiz),
        min_quiz_score: dto.minQuizScore ?? 80,
        status: 'Active'
      }).select('*').single()
    );

    // Identify target workers to assign
    // In PSM OS, fetch active users in same site / company
    let targetUsers: Row[] = [];
    if (dto.targetUserIds?.length) {
      targetUsers = await this.db.many<Row>(
        this.db.from('User').select('id, name, email').in('id', dto.targetUserIds)
      );
    } else {
      // Default: fetch operators / active personnel for this site/unit
      let userQ = this.db.from('User').select('id, name, email').eq('company_id', scope.companyId).limit(50);
      targetUsers = await this.db.many<Row>(userQ);
    }

    if (targetUsers.length > 0) {
      const recordsToInsert = targetUsers.map(u => ({
        id: crypto.randomUUID(),
        company_id: scope.companyId,
        site_id: proc.site_id ?? scope.selectedSiteId,
        requirement_id: requirementId,
        procedure_id: procedureId,
        revision_id: revisionId,
        worker_user_id: u.id,
        status: 'Pending',
        due_date: dueDateStr
      }));

      // Use upsert or ignore conflict
      await this.db.from('op_acknowledgment_records').insert(recordsToInsert);
    }

    // Also link with training_sop_ack_requirements if training-competency module tables exist
    try {
      await this.db.from('training_sop_ack_requirements').insert({
        id: crypto.randomUUID(),
        company_id: scope.companyId,
        site_id: proc.site_id ?? scope.selectedSiteId,
        procedure_id: procedureId,
        sop_title: `${proc.procedure_number}: ${proc.title}`,
        sop_number: proc.procedure_number,
        current_version: rev.revision_label,
        requirement_title: `SOP Acknowledgment: ${proc.procedure_number} (${rev.revision_label})`,
        requirement_status: 'Active',
        grace_period_days: graceDays
      } as any);
    } catch {}

    return {
      requirement: req,
      assignedCount: targetUsers.length
    };
  }

  // ---------------------------------------------------------------- List Acknowledgments
  async getAcknowledgments(scope: OpScope, query: Row) {
    let q = this.db.from('op_acknowledgment_records').select(`
      id, company_id, site_id, requirement_id, procedure_id, revision_id, worker_user_id,
      status, due_date, acknowledged_at, signature_hash, attestation_statement, quiz_score,
      quiz_passed, created_at, updated_at
    `).eq('company_id', scope.companyId);

    if (scope.selectedSiteId) {
      q = q.eq('site_id', scope.selectedSiteId);
    }
    if (query.procedureId) {
      q = q.eq('procedure_id', query.procedureId);
    }
    if (query.revisionId) {
      q = q.eq('revision_id', query.revisionId);
    }
    if (query.workerUserId) {
      q = q.eq('worker_user_id', query.workerUserId);
    }
    if (query.status) {
      q = q.eq('status', query.status);
    }

    q = q.order('due_date', { ascending: true });

    const rows = await this.db.many<Row>(q);

    // Enrich worker names
    const workerIds = Array.from(new Set(rows.map(r => r.worker_user_id).filter(Boolean)));
    const userMap = new Map<string, Row>();
    if (workerIds.length > 0) {
      const users = await this.db.many<Row>(
        this.db.from('User').select('id, name, email').in('id', workerIds)
      );
      users.forEach(u => userMap.set(u.id, u));
    }

    return rows.map(r => ({
      ...r,
      worker: userMap.get(r.worker_user_id) || null
    }));
  }

  // ---------------------------------------------------------------- Procedure Ack Stats
  async getProcedureAckStats(scope: OpScope, procedureId: string, revisionId?: string) {
    let q = this.db.from('op_acknowledgment_records')
      .select('status, revision_id')
      .eq('company_id', scope.companyId)
      .eq('procedure_id', procedureId);

    if (revisionId) {
      q = q.eq('revision_id', revisionId);
    }

    const records = await this.db.many<Row>(q);
    const total = records.length;
    const acknowledged = records.filter(r => r.status === 'Acknowledged').length;
    const pending = records.filter(r => r.status === 'Pending').length;
    const overdue = records.filter(r => r.status === 'Overdue').length;
    const compliancePct = total > 0 ? Math.round((acknowledged / total) * 100) : 100;

    return {
      totalAssigned: total,
      acknowledgedCount: acknowledged,
      pendingCount: pending,
      overdueCount: overdue,
      compliancePercentage: compliancePct
    };
  }

  // ---------------------------------------------------------------- Sign / Submit Acknowledgment
  async signAcknowledgment(userId: string, scope: OpScope, recordId: string, dto: Row) {
    const record = await this.db.single<Row>(
      this.db.from('op_acknowledgment_records')
        .select('*')
        .eq('id', recordId)
        .eq('company_id', scope.companyId)
        .single()
    );
    if (!record) {
      throw new NotFoundException(`Acknowledgment record ${recordId} not found.`);
    }

    if (record.worker_user_id !== userId && !scope.isCompanyAdmin) {
      throw new ForbiddenException('You can only sign your own Read-and-Understand acknowledgment.');
    }

    const attestation = dto.attestationStatement || 'I confirm that I have read, understood, and will strictly adhere to this operating procedure during all field execution activities (OSHA 1910.119(f)(4)).';
    const sigHash = crypto.createHash('sha256')
      .update(`${userId}|${record.procedure_id}|${record.revision_id}|${Date.now()}|${attestation}`)
      .digest('hex');

    const updated = await this.db.single<Row>(
      this.db.from('op_acknowledgment_records').update({
        status: 'Acknowledged',
        acknowledged_at: new Date().toISOString(),
        signature_hash: sigHash,
        attestation_statement: attestation,
        quiz_score: dto.quizScore ?? null,
        quiz_passed: dto.quizScore !== undefined ? dto.quizScore >= 80 : null,
        device_info: dto.deviceInfo ?? {},
        updated_at: new Date().toISOString()
      }).eq('id', recordId).select('*').single()
    );

    // Also update training module if present
    try {
      await this.db.from('training_sop_ack_assignments').update({
        acknowledgement_status: 'Acknowledged',
        acknowledged_at: new Date().toISOString(),
        e_signature_hash: sigHash
      } as any).eq('procedure_id', record.procedure_id).eq('worker_id', userId);
    } catch {}

    await this.audit.write({
      tenantId: scope.companyId,
      actorId: userId,
      action: 'op.ack.sign',
      entityType: 'op_acknowledgment_record',
      entityId: recordId,
      metadata: { procedureId: record.procedure_id, revisionId: record.revision_id, signatureHash: sigHash }
    } as any).catch(() => null);

    return updated;
  }

  // ---------------------------------------------------------------- Execution Gate Check (OSHA Safe Practice)
  async checkExecutionGate(userId: string, scope: OpScope, procedureId: string, revisionId: string) {
    // Read gate setting from op_settings
    const settings = await this.db.single<Row>(
      this.db.from('op_settings')
        .select('execution_ack_gate')
        .eq('company_id', scope.companyId)
        .maybeSingle()
    );

    const gatePolicy = settings?.execution_ack_gate ?? 'Warn'; // Block, Warn, Allow

    if (gatePolicy === 'Allow') {
      return { allowed: true, policy: 'Allow', acknowledged: true };
    }

    const ack = await this.db.single<Row>(
      this.db.from('op_acknowledgment_records')
        .select('id, status, acknowledged_at')
        .eq('company_id', scope.companyId)
        .eq('procedure_id', procedureId)
        .eq('revision_id', revisionId)
        .eq('worker_user_id', userId)
        .maybeSingle()
    );

    const isAcknowledged = ack?.status === 'Acknowledged';

    if (!isAcknowledged) {
      if (gatePolicy === 'Block') {
        throw new ForbiddenException(
          `Execution Gate Blocked: You must sign the Read-and-Understand acknowledgment for this revision before executing in the field (OSHA 1910.119(f)(4)).`
        );
      } else {
        // Warn
        return {
          allowed: true,
          policy: 'Warn',
          acknowledged: false,
          recordId: ack?.id ?? null,
          warning: 'Operator has not completed Read-and-Understand acknowledgment for this procedure revision.'
        };
      }
    }

    return {
      allowed: true,
      policy: gatePolicy,
      acknowledged: true,
      recordId: ack.id,
      acknowledgedAt: ack.acknowledged_at
    };
  }

  // ---------------------------------------------------------------- Helpers
  private async assertProcedure(scope: OpScope, procedureId: string): Promise<Row> {
    let q = this.db.from('op_procedures').select('*').eq('id', procedureId).eq('company_id', scope.companyId);
    if (scope.selectedSiteId) {
      q = q.eq('site_id', scope.selectedSiteId);
    }
    const proc = await this.db.single<Row>(q.single());
    if (!proc) {
      throw new NotFoundException(`Procedure ${procedureId} not found.`);
    }
    return proc;
  }

  private async assertRevision(scope: OpScope, revisionId: string): Promise<Row> {
    const rev = await this.db.single<Row>(
      this.db.from('op_revisions').select('*').eq('id', revisionId).eq('company_id', scope.companyId).single()
    );
    if (!rev) {
      throw new NotFoundException(`Revision ${revisionId} not found.`);
    }
    return rev;
  }
}
