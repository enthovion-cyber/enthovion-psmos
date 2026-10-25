import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../database/supabase.service';
import type { OpScope } from './operating-procedures.service';

type Row = Record<string, any>;

@Injectable()
export class OpSwpService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  // ---------------------------------------------------------------- SWP Programs Library
  async getSwpPrograms(scope: OpScope, query: Row = {}) {
    let q = this.db.from('op_swp_programs')
      .select('*')
      .eq('company_id', scope.companyId);

    if (query.activeOnly !== undefined) {
      q = q.eq('is_active', true);
    }

    q = q.order('program_code', { ascending: true });
    return this.db.many<Row>(q);
  }

  async getSwpProgram(scope: OpScope, programId: string) {
    const program = await this.db.single<Row>(
      this.db.from('op_swp_programs')
        .select('*')
        .eq('id', programId)
        .eq('company_id', scope.companyId)
        .single()
    );
    if (!program) throw new NotFoundException(`SWP program ${programId} not found.`);
    return program;
  }

  async saveSwpProgram(userId: string, scope: OpScope, dto: Row) {
    if (!dto.programCode || !dto.programName || !dto.description) {
      throw new BadRequestException('programCode, programName, and description are required.');
    }

    const id = dto.id ?? crypto.randomUUID();
    const data = {
      id,
      company_id: scope.companyId,
      site_id: scope.selectedSiteId,
      program_code: dto.programCode,
      program_name: dto.programName,
      regulatory_reference: dto.regulatoryReference ?? '29 CFR 1910.119(f)(4)',
      description: dto.description,
      mandatory_ppe: dto.mandatoryPpe ?? [],
      gas_testing_required: Boolean(dto.gasTestingRequired),
      permit_required: Boolean(dto.permitRequired),
      permit_type: dto.permitType ?? null,
      training_qualification_code: dto.trainingQualificationCode ?? null,
      standard_operating_procedure_id: dto.standardOperatingProcedureId ?? null,
      checklist_items: dto.checklistItems ?? [],
      is_active: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
      updated_at: new Date().toISOString()
    };

    const saved = await this.db.single<Row>(
      this.db.from('op_swp_programs').upsert(data).select('*').single()
    );

    return saved;
  }

  // ---------------------------------------------------------------- Job Safety Analysis (JSA)
  async getJsas(scope: OpScope, query: Row = {}) {
    let q = this.db.from('op_jsas').select('*').eq('company_id', scope.companyId);

    if (scope.selectedSiteId) {
      q = q.eq('site_id', scope.selectedSiteId);
    }
    if (query.status) {
      q = q.eq('status', query.status);
    }
    if (query.procedureId) {
      q = q.eq('procedure_id', query.procedureId);
    }
    if (query.swpProgramId) {
      q = q.eq('swp_program_id', query.swpProgramId);
    }

    q = q.order('created_at', { ascending: false });
    return this.db.many<Row>(q);
  }

  async getJsa(scope: OpScope, jsaId: string) {
    const jsa = await this.db.single<Row>(
      this.db.from('op_jsas')
        .select('*')
        .eq('id', jsaId)
        .eq('company_id', scope.companyId)
        .single()
    );
    if (!jsa) throw new NotFoundException(`JSA ${jsaId} not found.`);

    const [steps, roster, swp] = await Promise.all([
      this.db.many<Row>(
        this.db.from('op_jsa_steps').select('*').eq('jsa_id', jsaId).order('step_number', { ascending: true })
      ),
      this.db.many<Row>(
        this.db.from('op_jsa_roster').select('*').eq('jsa_id', jsaId).order('acknowledged_at', { ascending: true })
      ),
      jsa.swp_program_id
        ? this.db.single<Row>(
            this.db.from('op_swp_programs').select('*').eq('id', jsa.swp_program_id).maybeSingle()
          )
        : Promise.resolve(null)
    ]);

    return {
      ...jsa,
      steps,
      roster,
      swp_program: swp
    };
  }

  async createJsa(userId: string, scope: OpScope, dto: Row) {
    if (!dto.title || !dto.jobLocation) {
      throw new BadRequestException('title and jobLocation are required for a JSA.');
    }

    const year = new Date().getUTCFullYear();
    const countRes = await this.db.many<Row>(
      this.db.from('op_jsas').select('id').eq('company_id', scope.companyId)
    );
    const jsaNumber = `JSA-${year}-${String((countRes?.length ?? 0) + 1).padStart(4, '0')}`;
    const jsaId = crypto.randomUUID();

    const jsa = await this.db.single<Row>(
      this.db.from('op_jsas').insert({
        id: jsaId,
        company_id: scope.companyId,
        site_id: scope.selectedSiteId,
        jsa_number: jsaNumber,
        title: dto.title,
        unit_id: dto.unitId ?? null,
        equipment_id: dto.equipmentId ?? null,
        swp_program_id: dto.swpProgramId ?? null,
        procedure_id: dto.procedureId ?? null,
        work_order_id: dto.workOrderId ?? null,
        linked_ptw_id: dto.linkedPtwId ?? null,
        job_location: dto.jobLocation,
        prepared_by_user_id: userId,
        status: 'Draft',
        initial_risk_level: dto.initialRiskLevel ?? 'Medium',
        residual_risk_level: dto.residualRiskLevel ?? 'Low',
        required_ppe: dto.requiredPpe ?? ['Safety Glasses', 'Steel-toe Boots', 'Hard Hat', 'Gloves'],
        special_tools_equipment: dto.specialTools ?? null,
        emergency_rescue_plan: dto.emergencyRescuePlan ?? null
      }).select('*').single()
    );

    // If steps provided, insert them
    if (dto.steps && Array.isArray(dto.steps) && dto.steps.length > 0) {
      const stepInserts = dto.steps.map((st: Row, idx: number) => ({
        id: crypto.randomUUID(),
        company_id: scope.companyId,
        jsa_id: jsaId,
        step_number: idx + 1,
        job_step_description: st.description ?? `Step ${idx + 1}`,
        potential_hazards: st.hazards ?? 'Hazard identified',
        consequence: st.consequence ?? null,
        hazard_category: st.hazardCategory ?? 'Mechanical',
        preventative_controls: st.controls ?? 'Follow safe operating practices',
        initial_severity: st.initialSeverity ?? 'Medium',
        initial_likelihood: st.initialLikelihood ?? 'Medium',
        residual_severity: st.residualSeverity ?? 'Low',
        residual_likelihood: st.residualLikelihood ?? 'Low',
        responsible_role: st.responsibleRole ?? 'Technician'
      }));

      await this.db.from('op_jsa_steps').insert(stepInserts);
    }

    return jsa;
  }

  async signJsaBriefing(userId: string, scope: OpScope, jsaId: string, dto: Row) {
    const jsa = await this.db.single<Row>(
      this.db.from('op_jsas').select('*').eq('id', jsaId).eq('company_id', scope.companyId).single()
    );
    if (!jsa) throw new NotFoundException(`JSA ${jsaId} not found.`);

    const user = await this.db.single<Row>(
      this.db.from('User').select('id, name, email').eq('id', userId).single()
    );

    const sigHash = crypto.createHash('sha256')
      .update(`${userId}|${jsaId}|${Date.now()}`)
      .digest('hex');

    const entry = await this.db.single<Row>(
      this.db.from('op_jsa_roster').insert({
        id: crypto.randomUUID(),
        company_id: scope.companyId,
        jsa_id: jsaId,
        worker_user_id: userId,
        worker_name: user?.name || dto.workerName || 'Operating Worker',
        contractor_company: dto.contractorCompany ?? null,
        role: dto.role ?? 'Craft Technician',
        attended_briefing: true,
        acknowledged_at: new Date().toISOString(),
        signature_hash: sigHash
      }).select('*').single()
    );

    return entry;
  }

  async approveJsa(userId: string, scope: OpScope, jsaId: string, dto: Row) {
    const jsa = await this.db.single<Row>(
      this.db.from('op_jsas').select('*').eq('id', jsaId).eq('company_id', scope.companyId).single()
    );
    if (!jsa) throw new NotFoundException(`JSA ${jsaId} not found.`);

    const updated = await this.db.single<Row>(
      this.db.from('op_jsas').update({
        status: 'Approved',
        approved_at: new Date().toISOString(),
        supervisor_user_id: userId,
        hse_reviewer_user_id: dto.hseReviewerUserId ?? null,
        updated_at: new Date().toISOString()
      }).eq('id', jsaId).select('*').single()
    );

    await this.audit.write({
      tenantId: scope.companyId,
      actorId: userId,
      action: 'op.jsa.approve',
      entityType: 'op_jsa',
      entityId: jsaId,
      metadata: { jsaNumber: jsa.jsa_number, status: 'Approved' }
    } as any).catch(() => null);

    return updated;
  }
}
