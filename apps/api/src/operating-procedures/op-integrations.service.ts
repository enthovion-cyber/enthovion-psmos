import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../database/supabase.service';
import type { OpScope } from './operating-procedures.service';

type Row = Record<string, any>;

@Injectable()
export class OpIntegrationsService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  // ---------------------------------------------------------------- Change Flags
  async getChangeFlags(scope: OpScope, query: Row) {
    let q = this.db.from('op_change_flags').select('*').eq('company_id', scope.companyId);

    if (scope.selectedSiteId) {
      q = q.eq('site_id', scope.selectedSiteId);
    }
    if (query.procedureId) {
      q = q.eq('procedure_id', query.procedureId);
    }
    if (query.status) {
      q = q.eq('status', query.status);
    }
    if (query.sourceType) {
      q = q.eq('source_type', query.sourceType);
    }
    if (query.priority) {
      q = q.eq('priority', query.priority);
    }

    q = q.order('created_at', { ascending: false });

    const rows = await this.db.many<Row>(q);

    // Enrich with procedure numbers if needed
    const procedureIds = Array.from(new Set(rows.map(r => r.procedure_id).filter(Boolean)));
    const procMap = new Map<string, Row>();
    if (procedureIds.length > 0) {
      const procs = await this.db.many<Row>(
        this.db.from('op_procedures').select('id, procedure_number, title, criticality, operating_mode').in('id', procedureIds)
      );
      procs.forEach(p => procMap.set(p.id, p));
    }

    return rows.map(r => ({
      ...r,
      procedure: procMap.get(r.procedure_id) || null
    }));
  }

  async createChangeFlag(userId: string, scope: OpScope, procedureId: string, dto: Row) {
    const proc = await this.assertProcedure(scope, procedureId);

    if (!dto.sourceType || !dto.sourceId || !dto.sourceReference || !dto.reason) {
      throw new BadRequestException('sourceType, sourceId, sourceReference, and reason are required.');
    }

    const flagId = crypto.randomUUID();
    const flag = await this.db.single<Row>(
      this.db.from('op_change_flags').insert({
        id: flagId,
        company_id: scope.companyId,
        site_id: proc.site_id ?? scope.selectedSiteId,
        procedure_id: procedureId,
        source_type: dto.sourceType,
        source_id: dto.sourceId,
        source_reference: dto.sourceReference,
        source_title: dto.sourceTitle ?? null,
        priority: dto.priority ?? 'Medium',
        reason: dto.reason,
        description: dto.description ?? null,
        suggested_changes: dto.suggestedChanges ?? null,
        status: 'Open',
        blocks_moc_closure: dto.blocksMocClosure !== undefined ? Boolean(dto.blocksMocClosure) : true,
        target_revision_id: dto.targetRevisionId ?? null,
        flagged_by_user_id: userId
      }).select('*').single()
    );

    // Record history event
    await this.db.from('op_history_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: proc.site_id ?? scope.selectedSiteId,
      procedure_id: procedureId,
      event_type: 'CHANGE_FLAG_CREATED',
      summary: `Change flag raised from ${dto.sourceType} (${dto.sourceReference}): ${dto.reason}`,
      actor_user_id: userId,
      metadata: { flagId, sourceType: dto.sourceType, sourceReference: dto.sourceReference }
    });

    await this.audit.write({
      tenantId: scope.companyId,
      actorId: userId,
      action: 'op.change_flag.create',
      entityType: 'op_change_flag',
      entityId: flagId,
      metadata: { procedureId, sourceType: dto.sourceType, sourceReference: dto.sourceReference }
    } as any).catch(() => null);

    return flag;
  }

  async resolveChangeFlag(userId: string, scope: OpScope, flagId: string, dto: Row) {
    const flag = await this.assertChangeFlag(scope, flagId);

    if (flag.status === 'Resolved' || flag.status === 'Dismissed') {
      throw new BadRequestException(`Change flag is already ${flag.status}.`);
    }

    const updated = await this.db.single<Row>(
      this.db.from('op_change_flags').update({
        status: 'Resolved',
        target_revision_id: dto.targetRevisionId ?? flag.target_revision_id,
        resolved_by_user_id: userId,
        resolved_at: new Date().toISOString(),
        resolution_notes: dto.resolutionNotes || 'Procedure updated and verified against source requirement.',
        updated_at: new Date().toISOString()
      }).eq('id', flagId).select('*').single()
    );

    await this.db.from('op_history_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: flag.site_id,
      procedure_id: flag.procedure_id,
      event_type: 'CHANGE_FLAG_RESOLVED',
      summary: `Change flag for ${flag.source_reference} marked Resolved`,
      actor_user_id: userId,
      metadata: { flagId, targetRevisionId: dto.targetRevisionId }
    });

    return updated;
  }

  async dismissChangeFlag(userId: string, scope: OpScope, flagId: string, dto: Row) {
    const flag = await this.assertChangeFlag(scope, flagId);

    if (!dto.dismissalReason) {
      throw new BadRequestException('A documented dismissalReason is required to dismiss a procedure change flag.');
    }

    const updated = await this.db.single<Row>(
      this.db.from('op_change_flags').update({
        status: 'Dismissed',
        resolved_by_user_id: userId,
        resolved_at: new Date().toISOString(),
        dismissal_reason: dto.dismissalReason,
        updated_at: new Date().toISOString()
      }).eq('id', flagId).select('*').single()
    );

    await this.db.from('op_history_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: flag.site_id,
      procedure_id: flag.procedure_id,
      event_type: 'CHANGE_FLAG_DISMISSED',
      summary: `Change flag for ${flag.source_reference} dismissed: ${dto.dismissalReason}`,
      actor_user_id: userId,
      metadata: { flagId, dismissalReason: dto.dismissalReason }
    });

    return updated;
  }

  // ---------------------------------------------------------------- MOC Blocker Integration
  async checkMocBlockers(scope: OpScope, mocId: string) {
    const openFlags = await this.db.many<Row>(
      this.db.from('op_change_flags')
        .select('id, procedure_id, source_reference, reason, priority, status')
        .eq('company_id', scope.companyId)
        .eq('source_type', 'MOC')
        .eq('source_id', mocId)
        .eq('blocks_moc_closure', true)
        .in('status', ['Open', 'In Progress'])
    );

    if (!openFlags.length) {
      return {
        canCloseMoc: true,
        openBlockerCount: 0,
        unresolvedProcedures: []
      };
    }

    const procedureIds = openFlags.map(f => f.procedure_id);
    const procedures = await this.db.many<Row>(
      this.db.from('op_procedures').select('id, procedure_number, title').in('id', procedureIds)
    );
    const procMap = new Map<string, Row>();
    procedures.forEach(p => procMap.set(p.id, p));

    return {
      canCloseMoc: false,
      openBlockerCount: openFlags.length,
      unresolvedProcedures: openFlags.map(f => ({
        flagId: f.id,
        procedureId: f.procedure_id,
        procedureNumber: procMap.get(f.procedure_id)?.procedure_number || 'Unknown',
        procedureTitle: procMap.get(f.procedure_id)?.title || 'Unknown',
        reason: f.reason,
        priority: f.priority
      }))
    };
  }

  // ---------------------------------------------------------------- Linked Records (PSI, Equipment, MOC, HAZOP)
  async getLinkedRecords(scope: OpScope, procedureId: string, recordType?: string) {
    let q = this.db.from('op_linked_records')
      .select('*')
      .eq('company_id', scope.companyId)
      .eq('procedure_id', procedureId);

    if (recordType) {
      q = q.eq('record_type', recordType);
    }

    q = q.order('created_at', { ascending: false });
    return this.db.many<Row>(q);
  }

  async linkRecord(userId: string, scope: OpScope, procedureId: string, dto: Row) {
    const proc = await this.assertProcedure(scope, procedureId);

    if (!dto.recordType || !dto.recordId || !dto.recordReference || !dto.recordTitle) {
      throw new BadRequestException('recordType, recordId, recordReference, and recordTitle are required.');
    }

    const linkId = crypto.randomUUID();
    const link = await this.db.single<Row>(
      this.db.from('op_linked_records').insert({
        id: linkId,
        company_id: scope.companyId,
        site_id: proc.site_id ?? scope.selectedSiteId,
        procedure_id: procedureId,
        revision_id: dto.revisionId ?? null,
        step_id: dto.stepId ?? null,
        record_type: dto.recordType,
        record_id: dto.recordId,
        record_reference: dto.recordReference,
        record_title: dto.recordTitle,
        sync_status: 'In Sync',
        metadata: dto.metadata ?? {},
        created_by: userId
      }).select('*').single()
    );

    // If linking a PSI Safe Operating Limit, pull SOL values directly
    if (dto.recordType === 'PSI_SOL') {
      await this.syncPsiSolLimits(userId, scope, procedureId, dto.recordId, dto.stepId);
    }

    return link;
  }

  async unlinkRecord(userId: string, scope: OpScope, linkId: string) {
    const link = await this.db.single<Row>(
      this.db.from('op_linked_records').select('*').eq('id', linkId).eq('company_id', scope.companyId).single()
    );
    if (!link) {
      throw new NotFoundException(`Linked record ${linkId} not found.`);
    }

    await this.db.from('op_linked_records').delete().eq('id', linkId);
    return { success: true };
  }

  // Synchronize live limits & consequence of deviation from PSI SOL to Procedure Step
  async syncPsiSolLimits(userId: string, scope: OpScope, procedureId: string, psiSolId: string, stepId?: string) {
    const sol = await this.db.single<Row>(
      this.db.from('psi_safe_operating_limits').select('*').eq('id', psiSolId).maybeSingle()
    );
    if (!sol) return null;

    // Consequence and corrective steps
    const consequences = await this.db.many<Row>(
      this.db.from('psi_limit_deviation_consequences').select('*').eq('limit_id', psiSolId)
    );

    const consequenceText = consequences.map(c => c.process_consequence || c.safety_consequence).filter(Boolean).join('; ');

    if (stepId) {
      await this.db.from('op_steps').update({
        psi_sol_id: psiSolId,
        min_value: sol.lower_operating_limit ?? sol.lower_safe_limit ?? null,
        max_value: sol.upper_operating_limit ?? sol.upper_safe_limit ?? null,
        uom: sol.unit_of_measure ?? null,
        updated_at: new Date().toISOString()
      }).eq('id', stepId);

      // Also create or update hazard entry for this step
      if (consequenceText) {
        await this.db.from('op_step_hazards').insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: scope.selectedSiteId,
          step_id: stepId,
          hazard_level: sol.safety_critical ? 'DANGER' : 'WARNING',
          hazard_text: `Safe Operating Limit Parameter: ${sol.parameter_name} (${sol.unit_of_measure})`,
          consequence_of_deviation: consequenceText,
          corrective_steps: sol.corrective_action_steps || 'Return parameter to designated safe range or execute emergency shutdown.',
          ppe_required: []
        });
      }
    }

    return { sol, consequences };
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

  private async assertChangeFlag(scope: OpScope, flagId: string): Promise<Row> {
    let q = this.db.from('op_change_flags').select('*').eq('id', flagId).eq('company_id', scope.companyId);
    if (scope.selectedSiteId) {
      q = q.eq('site_id', scope.selectedSiteId);
    }
    const flag = await this.db.single<Row>(q.single());
    if (!flag) {
      throw new NotFoundException(`Change flag ${flagId} not found.`);
    }
    return flag;
  }
}
