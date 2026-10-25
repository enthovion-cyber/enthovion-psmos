import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../database/supabase.service';
import type { OpScope } from './operating-procedures.service';

type Row = Record<string, any>;

@Injectable()
export class OpLifecycleService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  // ---------------------------------------------------------------- Submission
  async submitForReview(userId: string, scope: OpScope, procedureId: string, revisionId: string, dto: Row) {
    const [proc, rev] = await Promise.all([
      this.assertProcedure(scope, procedureId),
      this.assertRevision(scope, revisionId)
    ]);

    if (rev.status !== 'Draft' && rev.status !== 'Returned') {
      throw new BadRequestException(`Cannot submit revision with status '${rev.status}'.`);
    }

    // Verify revision has at least one step
    const stepsCount = await this.db.many<Row>(
      this.db.from('op_steps').select('id').eq('revision_id', revisionId).limit(1)
    );
    if (!stepsCount.length) {
      throw new BadRequestException('Cannot submit procedure without any steps. Add at least one step in the Step Editor.');
    }

    const countRes = await this.db.many<Row>(
      this.db.from('op_approval_requests').select('id').eq('company_id', scope.companyId)
    );
    const requestNumber = `APR-OP-${String((countRes?.length ?? 0) + 1).padStart(4, '0')}`;

    // Create approval request
    const request = await this.db.single<Row>(
      this.db
        .from('op_approval_requests')
        .insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: proc.site_id,
          procedure_id: procedureId,
          revision_id: revisionId,
          request_number: requestNumber,
          title: `Approval Request: ${proc.procedure_number} (${rev.revision_label})`,
          status: 'In Review',
          current_stage_order: 1,
          priority: dto.priority ?? (proc.criticality === 'High' ? 'High' : 'Normal'),
          submitted_by: userId,
          submission_notes: dto.notes ?? null,
          effective_date: dto.effectiveDate ?? null
        })
        .select('*')
        .single()
    );

    // Build multi-stage review route
    const stages = [
      {
        order: 1,
        name: 'Stage 1: Technical SME Review',
        role: 'SME',
        status: 'Active'
      },
      {
        order: 2,
        name: 'Stage 2: Operations Supervisor Review',
        role: 'Operations Supervisor',
        status: 'Pending'
      },
      {
        order: 3,
        name: 'Stage 3: PSM & Safety Compliance Approval',
        role: 'HSE / PSM Coordinator',
        status: 'Pending'
      }
    ];

    if (proc.criticality === 'High') {
      stages.push({
        order: 4,
        name: 'Stage 4: Plant Operations Manager Sign-off',
        role: 'Site Manager',
        status: 'Pending'
      });
    }

    for (const s of stages) {
      await this.db.single(
        this.db.from('op_approval_stages').insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: proc.site_id,
          request_id: request!.id,
          stage_order: s.order,
          stage_name: s.name,
          reviewer_role: s.role,
          assigned_user_ids: s.order === 1 && proc.sme_user_ids?.length ? proc.sme_user_ids : [],
          status: s.status,
          esign_required: true,
          due_at: new Date(Date.now() + s.order * 2 * 86_400_000).toISOString()
        })
      );
    }

    // Update revision & procedure status
    await Promise.all([
      this.db
        .from('op_revisions')
        .update({ status: 'In Review', updated_at: new Date().toISOString(), updated_by: userId })
        .eq('id', revisionId),
      this.db
        .from('op_procedures')
        .update({ procedure_status: 'In Review', updated_at: new Date().toISOString(), updated_by: userId })
        .eq('id', procedureId)
    ]);

    await this.logEvent(scope, userId, 'Procedure Submitted For Review', proc, rev, `Submitted under ${requestNumber}`, procedureId);

    return this.getApprovalRequest(scope, request!.id);
  }

  // ---------------------------------------------------------------- Decisions
  async recordDecision(userId: string, scope: OpScope, requestId: string, stageId: string, dto: Row) {
    const request = await this.db.single<Row>(
      this.db.from('op_approval_requests').select('*').eq('id', requestId).eq('company_id', scope.companyId).maybeSingle()
    );
    if (!request) throw new NotFoundException('Approval request not found.');

    const stage = await this.db.single<Row>(
      this.db.from('op_approval_stages').select('*').eq('id', stageId).eq('request_id', requestId).maybeSingle()
    );
    if (!stage) throw new NotFoundException('Approval stage not found.');
    if (stage.status !== 'Active') throw new BadRequestException(`Cannot decide stage in '${stage.status}' status.`);

    const decision = dto.decision;
    if (!['Approved', 'Approved with Comments', 'Returned for Revision', 'Rejected'].includes(decision)) {
      throw new BadRequestException('Invalid decision value.');
    }

    // Record decision with electronic signature certification
    const decisionRecord = await this.db.single<Row>(
      this.db
        .from('op_approval_decisions')
        .insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: request.site_id,
          request_id: requestId,
          stage_id: stageId,
          decision,
          decision_comments: dto.comments ?? null,
          decided_by: userId,
          meaning_of_signature: dto.meaningOfSignature ?? 'I certify that this operating procedure is technically accurate, safe, and complies with OSHA 1910.119(f).',
          signature_hash: dto.signatureHash ?? crypto.randomUUID(),
          esignature_id: dto.esignatureId ?? null
        })
        .select('*')
        .single()
    );

    if (decision === 'Returned for Revision' || decision === 'Rejected') {
      // Return workflow to author
      await Promise.all([
        this.db.from('op_approval_stages').update({ status: 'Returned', completed_at: new Date().toISOString() }).eq('id', stageId),
        this.db.from('op_approval_requests').update({ status: decision === 'Rejected' ? 'Rejected' : 'Returned', completed_at: new Date().toISOString() }).eq('id', requestId),
        this.db.from('op_revisions').update({ status: 'Draft' }).eq('id', request.revision_id),
        this.db.from('op_procedures').update({ procedure_status: 'Draft' }).eq('id', request.procedure_id)
      ]);

      await this.logEvent(scope, userId, `Review Stage ${decision}`, null, decisionRecord, dto.comments ?? '', request.procedure_id);
      return this.getApprovalRequest(scope, requestId);
    }

    // Mark current stage Approved
    await this.db.from('op_approval_stages').update({ status: 'Approved', completed_at: new Date().toISOString() }).eq('id', stageId);

    // Check for next stage
    const nextStage = await this.db.single<Row>(
      this.db
        .from('op_approval_stages')
        .select('*')
        .eq('request_id', requestId)
        .eq('stage_order', stage.stage_order + 1)
        .maybeSingle()
    );

    if (nextStage) {
      // Advance to next stage
      await Promise.all([
        this.db.from('op_approval_stages').update({ status: 'Active' }).eq('id', nextStage.id),
        this.db.from('op_approval_requests').update({ current_stage_order: nextStage.stage_order }).eq('id', requestId)
      ]);
    } else {
      // All stages completed -> Approved!
      await Promise.all([
        this.db.from('op_approval_requests').update({ status: 'Approved', completed_at: new Date().toISOString() }).eq('id', requestId),
        this.db.from('op_revisions').update({ status: 'Approved' }).eq('id', request.revision_id),
        this.db.from('op_procedures').update({ procedure_status: 'Approved' }).eq('id', request.procedure_id)
      ]);
    }

    await this.logEvent(scope, userId, 'Procedure Review Stage Approved', null, decisionRecord, dto.comments ?? 'Approved', request.procedure_id);
    return this.getApprovalRequest(scope, requestId);
  }

  // ---------------------------------------------------------------- Publication
  async publishProcedure(userId: string, scope: OpScope, procedureId: string, revisionId: string, dto: Row) {
    const [proc, rev] = await Promise.all([
      this.assertProcedure(scope, procedureId),
      this.assertRevision(scope, revisionId)
    ]);

    if (rev.status !== 'Approved') {
      throw new BadRequestException('Procedure revision must be in Approved status before publishing.');
    }

    const effectiveDate = dto.effectiveDate ?? new Date().toISOString().slice(0, 10);
    const reviewFrequencyMonths = proc.review_frequency_months ?? 12;

    const nextDueDate = new Date(`${effectiveDate}T00:00:00Z`);
    nextDueDate.setUTCMonth(nextDueDate.getUTCMonth() + reviewFrequencyMonths);
    const nextDueStr = nextDueDate.toISOString().slice(0, 10);

    // Supersede previously active revisions for this procedure
    await this.db
      .from('op_revisions')
      .update({ status: 'Superseded', superseded_at: new Date().toISOString() })
      .eq('procedure_id', procedureId)
      .eq('status', 'Published');

    // Freeze & publish current revision
    await this.db
      .from('op_revisions')
      .update({
        status: 'Published',
        effective_date: effectiveDate,
        locked: true,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', revisionId);

    // Record publication record
    await this.db.single(
      this.db.from('op_publication_records').insert({
        id: crypto.randomUUID(),
        company_id: scope.companyId,
        site_id: proc.site_id,
        procedure_id: procedureId,
        revision_id: revisionId,
        published_by: userId,
        effective_date: effectiveDate,
        distribution_summary: dto.distributionSummary ?? 'Published plant-wide to operators',
        acknowledgment_required: dto.acknowledgmentRequired ?? true
      })
    );

    // Update procedure master record
    await this.db
      .from('op_procedures')
      .update({
        procedure_status: 'Published',
        current_revision_id: revisionId,
        current_revision_label: rev.revision_label,
        effective_date: effectiveDate,
        last_certified_at: effectiveDate,
        next_certification_due: nextDueStr,
        certification_status: 'Certified',
        locked: true,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', procedureId);

    // If temporary procedure, register expiry record
    if (proc.is_temporary && proc.temporary_expires_at) {
      await this.db.single(
        this.db.from('op_temporary_procedures').insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: proc.site_id,
          procedure_id: procedureId,
          revision_id: revisionId,
          start_date: effectiveDate,
          expires_at: proc.temporary_expires_at,
          auto_expire: true
        })
      );
    }

    // Auto-resolve any change flags targeted at this revision
    await this.db
      .from('op_change_flags')
      .update({
        status: 'Resolved',
        resolved_by_user_id: userId,
        resolved_at: new Date().toISOString(),
        resolution_notes: `Automatically resolved upon publication of ${rev.revision_label}.`
      })
      .eq('procedure_id', procedureId)
      .eq('target_revision_id', revisionId)
      .eq('status', 'Open');

    // Auto-seed Read-and-Understand acknowledgment if required
    if (dto.acknowledgmentRequired ?? true) {
      const graceDays = 14;
      const ackDue = new Date();
      ackDue.setDate(ackDue.getDate() + graceDays);
      const ackDueStr = ackDue.toISOString().slice(0, 10);
      const reqId = crypto.randomUUID();

      await this.db.from('op_acknowledgment_requirements').insert({
        id: reqId,
        company_id: scope.companyId,
        site_id: proc.site_id ?? scope.selectedSiteId,
        procedure_id: procedureId,
        revision_id: revisionId,
        requirement_title: `Read & Understand: ${proc.procedure_number} (${rev.revision_label})`,
        target_audience: 'Operating Crew',
        grace_period_days: graceDays,
        due_date: ackDueStr,
        status: 'Active'
      });

      const users = await this.db.many<Row>(
        this.db.from('User').select('id').eq('company_id', scope.companyId).limit(50)
      );
      if (users.length > 0) {
        const records = users.map(u => ({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: proc.site_id ?? scope.selectedSiteId,
          requirement_id: reqId,
          procedure_id: procedureId,
          revision_id: revisionId,
          worker_user_id: u.id,
          status: 'Pending',
          due_date: ackDueStr
        }));
        await this.db.from('op_acknowledgment_records').insert(records);
      }
    }

    await this.logEvent(scope, userId, 'Procedure Published', null, rev, `Published ${rev.revision_label} effective ${effectiveDate}`, procedureId);

    return this.assertProcedure(scope, procedureId);
  }

  // ---------------------------------------------------------------- Queries
  async getApprovalRequests(scope: OpScope, procedureId: string) {
    return this.db.many<Row>(
      this.db
        .from('op_approval_requests')
        .select('*')
        .eq('company_id', scope.companyId)
        .eq('procedure_id', procedureId)
        .order('submitted_at', { ascending: false })
    );
  }

  async getApprovalRequest(scope: OpScope, requestId: string) {
    const request = await this.db.single<Row>(
      this.db.from('op_approval_requests').select('*').eq('id', requestId).eq('company_id', scope.companyId).maybeSingle()
    );
    if (!request) throw new NotFoundException('Approval request not found.');

    const [stages, decisions] = await Promise.all([
      this.db.many<Row>(
        this.db.from('op_approval_stages').select('*').eq('request_id', requestId).order('stage_order', { ascending: true })
      ),
      this.db.many<Row>(
        this.db.from('op_approval_decisions').select('*').eq('request_id', requestId).order('decided_at', { ascending: false })
      )
    ]);

    return { ...request, stages, decisions };
  }

  async getPendingReviews(scope: OpScope, userId: string) {
    // Find active stages across the tenant/site
    const activeStages = await this.db.many<Row>(
      this.db
        .from('op_approval_stages')
        .select('*, op_approval_requests!inner(*)')
        .eq('company_id', scope.companyId)
        .eq('status', 'Active')
        .order('created_at', { ascending: false })
    );

    return activeStages;
  }

  // ---------------------------------------------------------------- Private
  private async assertProcedure(scope: OpScope, id: string) {
    const row = await this.db.single<Row>(
      this.db.from('op_procedures').select('*').eq('company_id', scope.companyId).eq('id', id).maybeSingle()
    );
    if (!row) throw new NotFoundException('Procedure not found.');
    return row;
  }

  private async assertRevision(scope: OpScope, id: string) {
    const row = await this.db.single<Row>(
      this.db.from('op_revisions').select('*').eq('company_id', scope.companyId).eq('id', id).maybeSingle()
    );
    if (!row) throw new NotFoundException('Revision not found.');
    return row;
  }

  private async logEvent(scope: OpScope, userId: string, title: string, before: Row | null, after: Row | null, reason: string, procedureId: string) {
    await this.audit.write({
      tenantId: scope.companyId,
      actorId: userId,
      action: title,
      entityType: 'OperatingProcedureLifecycle',
      entityId: procedureId,
      before: before ?? null,
      after: after ?? null,
      metadata: { reason, sourceModule: 'Operating Procedures Lifecycle' }
    } as any).catch(() => null);

    await this.db.single(
      this.db.from('op_history_events').insert({
        id: crypto.randomUUID(),
        company_id: scope.companyId,
        site_id: after?.site_id ?? before?.site_id ?? scope.selectedSiteId ?? null,
        procedure_id: procedureId,
        revision_id: after?.id ?? before?.id ?? null,
        event_type: title.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
        event_title: title,
        event_description: reason,
        before_value_json: before ?? null,
        after_value_json: after ?? null,
        actor_user_id: userId
      }).select('id').single()
    ).catch(() => null);
  }
}
