import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../database/supabase.service';
import type { OpScope } from './operating-procedures.service';

type Row = Record<string, any>;

@Injectable()
export class OpExecutionService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  // ---------------------------------------------------------------- List Executions
  async getExecutions(scope: OpScope, query: Row) {
    let q = this.db.from('op_executions').select(`
      id, company_id, site_id, procedure_id, revision_id, execution_number, title,
      execution_mode, unit_id, equipment_id, shift, crew, status, started_at, completed_at,
      executed_by_user_id, supervisor_user_id, total_steps, completed_steps, skipped_steps,
      deviated_steps, offline_cached, created_at, updated_at
    `).eq('company_id', scope.companyId);

    if (scope.selectedSiteId) {
      q = q.eq('site_id', scope.selectedSiteId);
    }
    if (query.procedureId) {
      q = q.eq('procedure_id', query.procedureId);
    }
    if (query.status) {
      q = q.eq('status', query.status);
    }
    if (query.executionMode) {
      q = q.eq('execution_mode', query.executionMode);
    }
    if (query.shift) {
      q = q.eq('shift', query.shift);
    }

    q = q.order('created_at', { ascending: false });

    const rows = await this.db.many<Row>(q);

    // Enrich with procedure metadata
    const procedureIds = Array.from(new Set(rows.map(r => r.procedure_id).filter(Boolean)));
    const proceduresMap = new Map<string, Row>();
    if (procedureIds.length > 0) {
      const procs = await this.db.many<Row>(
        this.db.from('op_procedures').select('id, procedure_number, title, category_id, criticality, operating_mode').in('id', procedureIds)
      );
      procs.forEach(p => proceduresMap.set(p.id, p));
    }

    return rows.map(r => ({
      ...r,
      procedure: proceduresMap.get(r.procedure_id) || null,
      progress_pct: r.total_steps > 0 ? Math.round((r.completed_steps / r.total_steps) * 100) : 0
    }));
  }

  // ---------------------------------------------------------------- Single Execution Detail
  async getExecution(scope: OpScope, executionId: string) {
    const exec = await this.assertExecution(scope, executionId);

    const [proc, rev, steps, holds, deviations, handovers] = await Promise.all([
      this.db.single<Row>(
        this.db.from('op_procedures').select('*').eq('id', exec.procedure_id).single()
      ),
      this.db.single<Row>(
        this.db.from('op_revisions').select('*').eq('id', exec.revision_id).single()
      ),
      this.db.many<Row>(
        this.db.from('op_execution_steps').select('*').eq('execution_id', executionId).order('step_order', { ascending: true })
      ),
      this.db.many<Row>(
        this.db.from('op_execution_holds').select('*').eq('execution_id', executionId).order('created_at', { ascending: true })
      ),
      this.db.many<Row>(
        this.db.from('op_execution_deviations').select('*').eq('execution_id', executionId).order('created_at', { ascending: false })
      ),
      this.db.many<Row>(
        this.db.from('op_execution_handovers').select('*').eq('execution_id', executionId).order('created_at', { ascending: false })
      )
    ]);

    return {
      ...exec,
      procedure: proc,
      revision: rev,
      steps,
      holds,
      deviations,
      handovers,
      progress_pct: exec.total_steps > 0 ? Math.round((exec.completed_steps / exec.total_steps) * 100) : 0
    };
  }

  // ---------------------------------------------------------------- Create / Start Execution Run
  async createExecution(userId: string, scope: OpScope, procedureId: string, dto: Row) {
    const proc = await this.assertProcedure(scope, procedureId);

    // Pick revision: explicitly specified, or latest published revision
    let revisionId = dto.revisionId;
    if (!revisionId) {
      const pubRev = await this.db.single<Row>(
        this.db.from('op_revisions')
          .select('id, revision_number, revision_label, status')
          .eq('procedure_id', procedureId)
          .eq('status', 'Published')
          .order('revision_number', { ascending: false })
          .limit(1)
          .maybeSingle()
      );
      if (pubRev) {
        revisionId = pubRev.id;
      } else {
        // Fallback to latest revision if dry run or training
        const anyRev = await this.db.single<Row>(
          this.db.from('op_revisions')
            .select('id, revision_number, revision_label, status')
            .eq('procedure_id', procedureId)
            .order('revision_number', { ascending: false })
            .limit(1)
            .single()
        );
        if (!anyRev) {
          throw new BadRequestException('Cannot start execution: this procedure has no revisions created yet.');
        }
        revisionId = anyRev.id;
      }
    }

    // OSHA 1910.119(f)(4) Execution Gating Check
    const settings = await this.db.single<Row>(
      this.db.from('op_settings').select('execution_ack_gate').eq('company_id', scope.companyId).maybeSingle()
    );
    const ackGate = settings?.execution_ack_gate ?? 'Warn';
    if (ackGate === 'Block' && !dto.overrideAckGate) {
      const ack = await this.db.single<Row>(
        this.db.from('op_acknowledgment_records')
          .select('id, status')
          .eq('company_id', scope.companyId)
          .eq('procedure_id', procedureId)
          .eq('revision_id', revisionId)
          .eq('worker_user_id', userId)
          .maybeSingle()
      );
      if (ack?.status !== 'Acknowledged') {
        throw new ForbiddenException(
          `Execution Gate Blocked: You must read and acknowledge this procedure revision before executing in the field (OSHA 1910.119(f)(4)).`
        );
      }
    }

    // Fetch all steps for this revision
    const [sections, steps] = await Promise.all([
      this.db.many<Row>(
        this.db.from('op_sections').select('*').eq('revision_id', revisionId).order('section_order', { ascending: true })
      ),
      this.db.many<Row>(
        this.db.from('op_steps').select('*').eq('revision_id', revisionId).order('step_order', { ascending: true })
      )
    ]);

    if (!steps.length) {
      throw new BadRequestException('Procedure revision has no steps defined. Author steps first before executing.');
    }

    const sectionMap = new Map<string, string>();
    sections.forEach(s => sectionMap.set(s.id, s.section_title));

    // Generate execution number
    const year = new Date().getUTCFullYear();
    const countRes = await this.db.many<Row>(
      this.db.from('op_executions').select('id').eq('company_id', scope.companyId)
    );
    const executionNumber = `RUN-${proc.procedure_number}-${year}-${String((countRes?.length ?? 0) + 1).padStart(4, '0')}`;

    const executionId = crypto.randomUUID();
    const executionMode = dto.executionMode ?? proc.operating_mode ?? 'Normal';

    // 1. Insert Execution Header
    const execution = await this.db.single<Row>(
      this.db.from('op_executions').insert({
        id: executionId,
        company_id: scope.companyId,
        site_id: proc.site_id ?? scope.selectedSiteId,
        procedure_id: procedureId,
        revision_id: revisionId,
        execution_number: executionNumber,
        title: dto.title ?? `Run: ${proc.procedure_number} - ${proc.title}`,
        execution_mode: executionMode,
        unit_id: dto.unitId ?? proc.unit_id,
        equipment_id: dto.equipmentId ?? proc.equipment_id,
        shift: dto.shift ?? 'Day Shift',
        crew: dto.crew ?? null,
        linked_ptw_id: dto.linkedPtwId ?? null,
        linked_pssr_id: dto.linkedPssrId ?? null,
        linked_moc_id: dto.linkedMocId ?? null,
        status: 'In Progress',
        started_at: new Date().toISOString(),
        executed_by_user_id: userId,
        supervisor_user_id: dto.supervisorUserId ?? null,
        total_steps: steps.length,
        completed_steps: 0,
        skipped_steps: 0,
        deviated_steps: 0,
        offline_cached: Boolean(dto.offlineCached),
        device_info: dto.deviceInfo ?? {},
        metadata: dto.metadata ?? {}
      }).select('*').single()
    );

    // 2. Snapshot Steps into op_execution_steps
    const execStepsToInsert = steps.map((s, idx) => ({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: proc.site_id ?? scope.selectedSiteId,
      execution_id: executionId,
      step_id: s.id,
      section_id: s.section_id,
      section_title: sectionMap.get(s.section_id) || 'General Steps',
      step_number: s.step_number || String(idx + 1),
      step_title: s.step_title,
      step_text: s.step_text,
      step_type: s.step_type || 'action',
      step_order: s.step_order ?? idx * 10,
      is_critical: Boolean(s.is_critical),
      requires_signoff: Boolean(s.requires_signoff),
      requires_witness: Boolean(s.requires_witness),
      is_hold_point: s.step_type === 'hold_point' || Boolean(s.is_hold_point),
      expected_limits: s.expected_value || (s.min_value !== null && s.max_value !== null ? `${s.min_value} - ${s.max_value} ${s.uom || ''}`.trim() : null),
      min_value: s.min_value,
      max_value: s.max_value,
      uom: s.uom,
      status: 'Pending',
      metadata: {}
    }));

    await this.db.from('op_execution_steps').insert(execStepsToInsert);

    // 3. For any Hold Point steps, insert hold tracking records
    const holdSteps = execStepsToInsert.filter(s => s.is_hold_point);
    if (holdSteps.length > 0) {
      const holdInserts = holdSteps.map(hs => ({
        id: crypto.randomUUID(),
        company_id: scope.companyId,
        site_id: proc.site_id ?? scope.selectedSiteId,
        execution_id: executionId,
        step_id: hs.id,
        step_number: hs.step_number,
        hold_reason: `Mandatory verification hold point at Step ${hs.step_number}: ${hs.step_title || hs.step_text.slice(0, 50)}`,
        required_role: 'Operations Supervisor',
        status: 'Holding'
      }));
      await this.db.from('op_execution_holds').insert(holdInserts);
    }

    // 4. Record access log and history event
    await Promise.all([
      this.db.from('op_access_logs').insert({
        id: crypto.randomUUID(),
        company_id: scope.companyId,
        site_id: proc.site_id ?? scope.selectedSiteId,
        procedure_id: procedureId,
        user_id: userId,
        access_type: 'Execute',
        revision_id: revisionId,
        notes: `Started Execution Run ${executionNumber} (${executionMode})`
      }),
      this.db.from('op_history_events').insert({
        id: crypto.randomUUID(),
        company_id: scope.companyId,
        site_id: proc.site_id ?? scope.selectedSiteId,
        procedure_id: procedureId,
        event_type: 'EXECUTION_STARTED',
        summary: `Digital Execution Run ${executionNumber} started in ${executionMode} mode`,
        actor_user_id: userId,
        metadata: { executionId, executionNumber, revisionId }
      })
    ]);

    await this.audit.write({
      tenantId: scope.companyId,
      actorId: userId,
      action: 'op.execution.start',
      entityType: 'op_execution',
      entityId: executionId,
      metadata: { executionNumber, procedureId, revisionId }
    } as any).catch(() => null);

    return execution;
  }

  // ---------------------------------------------------------------- Record Step Execution
  async recordStepExecution(userId: string, scope: OpScope, executionId: string, stepId: string, dto: Row) {
    const exec = await this.assertExecution(scope, executionId);
    if (exec.status === 'Completed' || exec.status === 'Aborted') {
      throw new BadRequestException(`Cannot record step on an execution that is already '${exec.status}'.`);
    }

    const step = await this.db.single<Row>(
      this.db.from('op_execution_steps').select('*').eq('id', stepId).eq('execution_id', executionId).single()
    );
    if (!step) {
      throw new NotFoundException(`Execution step ${stepId} not found.`);
    }

    // Verify hold point hasn't blocked this step if step is a hold point or following a hold
    if (step.is_hold_point && (dto.status === 'Completed' || !dto.status)) {
      const activeHold = await this.db.single<Row>(
        this.db.from('op_execution_holds')
          .select('id, status')
          .eq('execution_id', executionId)
          .eq('step_id', stepId)
          .eq('status', 'Holding')
          .maybeSingle()
      );
      if (activeHold) {
        throw new BadRequestException(`Step ${step.step_number} is an active Hold Point. It must be formally released by an authorized supervisor before marking complete.`);
      }
    }

    const newStatus = dto.status ?? 'Completed';
    const recordedVal = dto.recordedValue !== undefined ? String(dto.recordedValue) : step.recorded_value;
    const recordedNum = dto.recordedNumeric !== undefined ? (dto.recordedNumeric !== null ? Number(dto.recordedNumeric) : null) : (recordedVal && !isNaN(Number(recordedVal)) ? Number(recordedVal) : null);

    // SOL Live Verification
    let isInLimits: boolean | null = null;
    let autoDeviationLogged = false;

    if (recordedNum !== null && (step.min_value !== null || step.max_value !== null)) {
      const belowMin = step.min_value !== null && recordedNum < Number(step.min_value);
      const aboveMax = step.max_value !== null && recordedNum > Number(step.max_value);

      if (belowMin || aboveMax) {
        isInLimits = false;
        // Auto-create deviation record if out of limits!
        const devId = crypto.randomUUID();
        const expectedRange = `${step.min_value ?? '-inf'} to ${step.max_value ?? '+inf'} ${step.uom || ''}`.trim();
        await this.db.from('op_execution_deviations').insert({
          id: devId,
          company_id: scope.companyId,
          site_id: exec.site_id,
          execution_id: executionId,
          execution_step_id: stepId,
          step_number: step.step_number,
          parameter_name: step.step_title || `Step ${step.step_number} Parameter`,
          expected_limits: expectedRange,
          actual_value: `${recordedNum} ${step.uom || ''}`.trim(),
          deviation_severity: step.is_critical ? 'High' : 'Medium',
          deviation_description: `Automated SOL Exceedance: Recorded value ${recordedNum} is outside safe operating limits (${expectedRange}).`,
          immediate_corrective_action: dto.immediateCorrectiveAction || 'Parameter flagged as out of limits. Verify instrument reading and notify supervisor.',
          logged_by_user_id: userId,
          is_resolved: false
        });
        autoDeviationLogged = true;
      } else {
        isInLimits = true;
      }
    }

    // Determine final status
    const resolvedStatus = (isInLimits === false && newStatus === 'Completed') ? 'Deviated' : newStatus;

    // Witness signoff
    let witnessBy = step.witness_by_user_id;
    let witnessAt = step.witness_at;
    if (dto.isWitnessing) {
      if (userId === exec.executed_by_user_id && step.performed_by_user_id === userId) {
        throw new BadRequestException('Two-Person Witness Rule (OSHA): The witness must be an independent individual, not the primary executor.');
      }
      witnessBy = userId;
      witnessAt = new Date().toISOString();
    }

    // Update execution step
    const updatedStep = await this.db.single<Row>(
      this.db.from('op_execution_steps').update({
        status: resolvedStatus,
        recorded_value: recordedVal,
        recorded_numeric: recordedNum,
        is_in_limits: isInLimits,
        skip_reason: dto.skipReason ?? step.skip_reason,
        deviation_reason: dto.deviationReason ?? (autoDeviationLogged ? 'Recorded value outside safe limits' : step.deviation_reason),
        performed_by_user_id: userId,
        performed_at: new Date().toISOString(),
        witness_by_user_id: witnessBy,
        witness_at: witnessAt,
        photo_url: dto.photoUrl ?? step.photo_url,
        notes: dto.notes ?? step.notes,
        updated_at: new Date().toISOString()
      }).eq('id', stepId).select('*').single()
    );

    // Refresh Execution Progress Counters
    await this.refreshExecutionCounters(executionId);

    return {
      step: updatedStep,
      solDeviationLogged: autoDeviationLogged
    };
  }

  // ---------------------------------------------------------------- Release Hold Point
  async releaseHoldPoint(userId: string, scope: OpScope, executionId: string, holdId: string, dto: Row) {
    const exec = await this.assertExecution(scope, executionId);

    const hold = await this.db.single<Row>(
      this.db.from('op_execution_holds').select('*').eq('id', holdId).eq('execution_id', executionId).single()
    );
    if (!hold) {
      throw new NotFoundException(`Hold point ${holdId} not found.`);
    }

    if (hold.status !== 'Holding') {
      throw new BadRequestException(`Hold point is already '${hold.status}'.`);
    }

    const action = dto.action === 'Bypassed' ? 'Bypassed' : 'Released';
    const sigHash = crypto.createHash('sha256')
      .update(`${userId}|${executionId}|${holdId}|${action}|${Date.now()}`)
      .digest('hex');

    const updatedHold = await this.db.single<Row>(
      this.db.from('op_execution_holds').update({
        status: action,
        released_by_user_id: userId,
        released_at: new Date().toISOString(),
        release_notes: dto.releaseNotes || `${action} by authorized personnel`,
        signature_hash: sigHash
      }).eq('id', holdId).select('*').single()
    );

    // Also mark step as In Progress or Completed if requested
    if (hold.step_id && dto.markStepCompleted) {
      await this.db.from('op_execution_steps').update({
        status: 'Completed',
        performed_by_user_id: userId,
        performed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', hold.step_id);

      await this.refreshExecutionCounters(executionId);
    }

    await this.audit.write({
      tenantId: scope.companyId,
      actorId: userId,
      action: 'op.execution.release_hold',
      entityType: 'op_execution_hold',
      entityId: holdId,
      metadata: { executionId, holdId, action, notes: dto.releaseNotes }
    } as any).catch(() => null);

    return updatedHold;
  }

  // ---------------------------------------------------------------- Shift Handover mid-run
  async recordHandover(userId: string, scope: OpScope, executionId: string, dto: Row) {
    const exec = await this.assertExecution(scope, executionId);

    if (!dto.shiftTo || !dto.incomingSupervisorId || !dto.handoverNotes) {
      throw new BadRequestException('Handover requires shiftTo, incomingSupervisorId, and handoverNotes.');
    }

    const handover = await this.db.single<Row>(
      this.db.from('op_execution_handovers').insert({
        id: crypto.randomUUID(),
        company_id: scope.companyId,
        site_id: exec.site_id,
        execution_id: executionId,
        shift_from: exec.shift || 'Outgoing Shift',
        shift_to: dto.shiftTo,
        outgoing_supervisor_id: userId,
        incoming_supervisor_id: dto.incomingSupervisorId,
        current_step_number: dto.currentStepNumber ?? null,
        handover_notes: dto.handoverNotes,
        equipment_status: dto.equipmentStatus ?? 'Operational / Isolated as per procedure',
        hazards_or_deviations_noted: dto.hazardsOrDeviations ?? null,
        signed_at: new Date().toISOString()
      }).select('*').single()
    );

    // Update execution active shift & crew
    await this.db.from('op_executions').update({
      shift: dto.shiftTo,
      crew: dto.crewTo ?? exec.crew,
      updated_at: new Date().toISOString()
    }).eq('id', executionId);

    return handover;
  }

  // ---------------------------------------------------------------- Manual Deviation Log
  async logDeviation(userId: string, scope: OpScope, executionId: string, dto: Row) {
    const exec = await this.assertExecution(scope, executionId);

    if (!dto.parameterName || !dto.actualValue || !dto.deviationDescription) {
      throw new BadRequestException('Deviation requires parameterName, actualValue, and deviationDescription.');
    }

    const dev = await this.db.single<Row>(
      this.db.from('op_execution_deviations').insert({
        id: crypto.randomUUID(),
        company_id: scope.companyId,
        site_id: exec.site_id,
        execution_id: executionId,
        execution_step_id: dto.executionStepId ?? null,
        step_number: dto.stepNumber ?? null,
        parameter_name: dto.parameterName,
        expected_limits: dto.expectedLimits ?? null,
        actual_value: dto.actualValue,
        deviation_severity: dto.deviationSeverity ?? 'Medium',
        deviation_description: dto.deviationDescription,
        immediate_corrective_action: dto.immediateCorrectiveAction || 'Flagged for review and correction.',
        logged_by_user_id: userId,
        action_id: dto.actionId ?? null,
        incident_id: dto.incidentId ?? null,
        is_resolved: false
      }).select('*').single()
    );

    await this.refreshExecutionCounters(executionId);

    return dev;
  }

  // ---------------------------------------------------------------- Complete Execution Run
  async completeExecution(userId: string, scope: OpScope, executionId: string, dto: Row) {
    const exec = await this.assertExecution(scope, executionId);

    // Check for open hold points
    const openHolds = await this.db.many<Row>(
      this.db.from('op_execution_holds')
        .select('id, step_number')
        .eq('execution_id', executionId)
        .eq('status', 'Holding')
    );
    if (openHolds.length > 0) {
      const stepNums = openHolds.map(h => h.step_number).join(', ');
      throw new BadRequestException(`Cannot complete execution: Hold point(s) at Step(s) ${stepNums} remain active and must be released first.`);
    }

    // Refresh step counters
    await this.refreshExecutionCounters(executionId);

    const updated = await this.db.single<Row>(
      this.db.from('op_executions').update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
        supervisor_user_id: userId,
        supervisor_signed_at: new Date().toISOString(),
        supervisor_notes: dto.supervisorNotes ?? 'Procedure executed and verified in accordance with safe operating limits.',
        updated_at: new Date().toISOString()
      }).eq('id', executionId).select('*').single()
    );

    // Record history event
    await this.db.from('op_history_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: exec.site_id,
      procedure_id: exec.procedure_id,
      event_type: 'EXECUTION_COMPLETED',
      summary: `Digital Execution Run ${exec.execution_number} marked Complete by supervisor`,
      actor_user_id: userId,
      metadata: { executionId, totalSteps: exec.total_steps, completedSteps: updated.completed_steps }
    });

    await this.audit.write({
      tenantId: scope.companyId,
      actorId: userId,
      action: 'op.execution.review',
      entityType: 'op_execution',
      entityId: executionId,
      metadata: { executionId, executionNumber: exec.execution_number, status: 'Completed' }
    } as any).catch(() => null);

    return updated;
  }

  // ---------------------------------------------------------------- Abort Execution Run
  async abortExecution(userId: string, scope: OpScope, executionId: string, dto: Row) {
    const exec = await this.assertExecution(scope, executionId);

    if (exec.status === 'Completed') {
      throw new BadRequestException('Cannot abort an execution that is already completed.');
    }

    const updated = await this.db.single<Row>(
      this.db.from('op_executions').update({
        status: 'Aborted',
        completed_at: new Date().toISOString(),
        supervisor_user_id: userId,
        supervisor_notes: dto.abortReason ?? 'Execution aborted by supervisor/operator.',
        updated_at: new Date().toISOString()
      }).eq('id', executionId).select('*').single()
    );

    await this.db.from('op_history_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: exec.site_id,
      procedure_id: exec.procedure_id,
      event_type: 'EXECUTION_ABORTED',
      summary: `Digital Execution Run ${exec.execution_number} aborted. Reason: ${dto.abortReason ?? 'None provided'}`,
      actor_user_id: userId,
      metadata: { executionId, abortReason: dto.abortReason }
    });

    return updated;
  }

  // ---------------------------------------------------------------- Helpers
  private async refreshExecutionCounters(executionId: string): Promise<void> {
    const steps = await this.db.many<Row>(
      this.db.from('op_execution_steps').select('status').eq('execution_id', executionId)
    );
    const total = steps.length;
    const completed = steps.filter(s => s.status === 'Completed').length;
    const skipped = steps.filter(s => s.status === 'Skipped').length;
    const deviated = steps.filter(s => s.status === 'Deviated').length;

    await this.db.from('op_executions').update({
      total_steps: total,
      completed_steps: completed,
      skipped_steps: skipped,
      deviated_steps: deviated,
      updated_at: new Date().toISOString()
    }).eq('id', executionId);
  }

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

  private async assertExecution(scope: OpScope, executionId: string): Promise<Row> {
    let q = this.db.from('op_executions').select('*').eq('id', executionId).eq('company_id', scope.companyId);
    if (scope.selectedSiteId) {
      q = q.eq('site_id', scope.selectedSiteId);
    }
    const exec = await this.db.single<Row>(q.single());
    if (!exec) {
      throw new NotFoundException(`Execution run ${executionId} not found.`);
    }
    return exec;
  }
}
