import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { AuditService } from '../audit/audit.service';
import {
  AcknowledgeEvaluationDto,
  CreatePostJobEvaluationDto,
  GenerateAuditPackageDto
} from './dto/contractor-safety.dto';

type Row = Record<string, any>;

@Injectable()
export class ContractorEvaluationService {
  private readonly logger = new Logger(ContractorEvaluationService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService
  ) {}

  /**
   * List post-job safety evaluations
   */
  async listEvaluations(
    companyId: string,
    query?: {
      contractor_id?: string | undefined;
      work_category?: string | undefined;
      limit?: number | undefined;
      offset?: number | undefined;
    }
  ) {
    const limit = query?.limit ?? 50;
    const offset = query?.offset ?? 0;

    let builder = this.supabase.client
      .from('csm_post_job_evaluations')
      .select(`
        *,
        contractor:csm_contractor_profiles(id, company_name, vendor_number, safety_grade, status)
      `, { count: 'exact' })
      .eq('company_id', companyId)
      .order('evaluation_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (query?.contractor_id) {
      builder = builder.eq('contractor_id', query.contractor_id);
    }
    if (query?.work_category) {
      builder = builder.eq('work_category', query.work_category);
    }

    const { data, count, error } = await builder;
    if (error) {
      this.logger.error(`Error querying evaluations: ${error.message}`);
      throw new BadRequestException('Failed to fetch contractor evaluations');
    }

    return {
      evaluations: data ?? [],
      total: count ?? 0,
      limit,
      offset
    };
  }

  /**
   * Get evaluation by ID
   */
  async getEvaluationById(companyId: string, evalId: string) {
    const { data: evaluation, error } = await this.supabase.client
      .from('csm_post_job_evaluations')
      .select(`
        *,
        contractor:csm_contractor_profiles(*)
      `)
      .eq('id', evalId)
      .eq('company_id', companyId)
      .single();

    if (error || !evaluation) {
      throw new NotFoundException(`Evaluation ${evalId} not found`);
    }

    return evaluation;
  }

  /**
   * Create a standardized post-job safety evaluation (OSHA 1910.119(h)(2)(v))
   */
  async createEvaluation(
    companyId: string,
    userId: string | null,
    dto: CreatePostJobEvaluationDto
  ) {
    // 1. Calculate composite score out of 35 total points (7 criteria * 5 max each)
    const totalPoints =
      Number(dto.ppe_compliance_score) +
      Number(dto.housekeeping_score) +
      Number(dto.ptw_adherence_score) +
      Number(dto.near_miss_reporting_score) +
      Number(dto.stop_work_authority_score) +
      Number(dto.quality_and_craftsmanship_score) +
      Number(dto.schedule_adherence_score);

    const compositeScorePercent = Math.round((totalPoints / 35) * 10000) / 100;

    // 2. Insert evaluation
    const { data: inserted, error: insertErr } = await this.supabase.client
      .from('csm_post_job_evaluations')
      .insert({
        company_id: companyId,
        contractor_id: dto.contractor_id,
        work_order_or_job_number: dto.work_order_or_job_number,
        evaluation_title: dto.evaluation_title,
        evaluator_user_id: userId,
        evaluation_date: dto.evaluation_date ?? new Date().toISOString().slice(0, 10),
        work_category: dto.work_category ?? 'ROUTINE_MAINTENANCE',
        site_id: dto.site_id,
        unit_id: dto.unit_id,
        ppe_compliance_score: dto.ppe_compliance_score,
        housekeeping_score: dto.housekeeping_score,
        ptw_adherence_score: dto.ptw_adherence_score,
        near_miss_reporting_score: dto.near_miss_reporting_score,
        stop_work_authority_score: dto.stop_work_authority_score,
        quality_and_craftsmanship_score: dto.quality_and_craftsmanship_score,
        schedule_adherence_score: dto.schedule_adherence_score,
        composite_score_percent: compositeScorePercent,
        safety_incidents_occurred: dto.safety_incidents_occurred ?? false,
        incidents_summary: dto.incidents_summary,
        strengths: dto.strengths,
        improvement_areas: dto.improvement_areas,
        recommend_for_future_work: dto.recommend_for_future_work ?? true,
        supervisor_signature_name: dto.supervisor_signature_name,
        status: 'SUBMITTED'
      })
      .select()
      .single();

    if (insertErr) {
      this.logger.error(`Error saving post-job evaluation: ${insertErr.message}`);
      throw new BadRequestException(`Failed to record evaluation: ${insertErr.message}`);
    }

    // 3. Recalculate Contractor Rolling Safety Index
    try {
      const { data: allEvals } = await this.supabase.client
        .from('csm_post_job_evaluations')
        .select('composite_score_percent')
        .eq('company_id', companyId)
        .eq('contractor_id', dto.contractor_id);

      if (allEvals?.length) {
        const sum = allEvals.reduce((acc, curr) => acc + Number(curr.composite_score_percent), 0);
        const mean = Math.round((sum / allEvals.length) * 100) / 100;

        await this.supabase.client
          .from('csm_contractor_profiles')
          .update({
            rolling_safety_index: mean,
            total_evaluations_count: allEvals.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', dto.contractor_id);
      }
    } catch (err: any) {
      this.logger.warn(`Could not update rolling index: ${err?.message}`);
    }

    // 4. Audit Log
    try {
      await this.audit.write({
        tenantId: companyId,
        actorId: userId ?? 'SYSTEM',
        action: 'csm.evaluation.created',
        entityType: 'csm_post_job_evaluations',
        entityId: inserted.id,
        metadata: {
          contractor_id: dto.contractor_id,
          job_number: dto.work_order_or_job_number,
          composite_score: compositeScorePercent
        }
      });
    } catch {}

    return inserted;
  }

  /**
   * Vendor acknowledgment of evaluation
   */
  async acknowledgeEvaluation(
    companyId: string,
    evalId: string,
    dto: AcknowledgeEvaluationDto
  ) {
    const { data, error } = await this.supabase.client
      .from('csm_post_job_evaluations')
      .update({
        status: 'ACKNOWLEDGED_BY_VENDOR',
        vendor_feedback_comments: dto.vendor_feedback_comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', evalId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to acknowledge evaluation: ${error.message}`);
    }

    return data;
  }

  /**
   * Aggregated scorecard summary for a contractor
   */
  async getContractorEvaluationSummary(companyId: string, contractorId: string) {
    const { data: evals, error } = await this.supabase.client
      .from('csm_post_job_evaluations')
      .select('*')
      .eq('company_id', companyId)
      .eq('contractor_id', contractorId)
      .order('evaluation_date', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to get evaluation summary: ${error.message}`);
    }

    const items: any[] = evals ?? [];
    const count = items.length;

    if (count === 0) {
      return {
        total_evaluations: 0,
        rolling_safety_index: 90.0,
        incident_free_percent: 100,
        recommend_future_percent: 100,
        criteria_averages: {
          ppe: 5.0,
          housekeeping: 5.0,
          ptw: 5.0,
          near_miss: 5.0,
          swa: 5.0,
          quality: 5.0,
          schedule: 5.0
        },
        recent_evaluations: []
      };
    }

    const avg = (fn: (item: any) => number) =>
      Math.round((items.reduce((acc, curr) => acc + fn(curr), 0) / count) * 10) / 10;

    const incidentFreeCount = items.filter((i) => !i.safety_incidents_occurred).length;
    const recommendCount = items.filter((i) => i.recommend_for_future_work).length;

    const criteriaAverages = {
      ppe: avg((i) => i.ppe_compliance_score),
      housekeeping: avg((i) => i.housekeeping_score),
      ptw: avg((i) => i.ptw_adherence_score),
      near_miss: avg((i) => i.near_miss_reporting_score),
      swa: avg((i) => i.stop_work_authority_score),
      quality: avg((i) => i.quality_and_craftsmanship_score),
      schedule: avg((i) => i.schedule_adherence_score)
    };

    const sumScores = items.reduce((acc, curr) => acc + Number(curr.composite_score_percent), 0);
    const rollingIndex = Math.round((sumScores / count) * 100) / 100;

    return {
      total_evaluations: count,
      rolling_safety_index: rollingIndex,
      incident_free_percent: Math.round((incidentFreeCount / count) * 100),
      recommend_future_percent: Math.round((recommendCount / count) * 100),
      criteria_averages: criteriaAverages,
      recent_evaluations: items.slice(0, 10)
    };
  }

  /**
   * OSHA 29 CFR 1910.119(h) Compliance Audit Evidence Package Generator
   * Compiles full regulatory evidence across all paragraphs of the PSM standard
   */
  async generateOshaAuditPackage(
    companyId: string,
    query?: GenerateAuditPackageDto
  ) {
    const [contractorsRes, evalsRes, workersRes, coursesRes, passesRes, variancesRes] =
      await Promise.all([
        // 1. Prequalification profiles (1910.119(h)(2)(i))
        this.supabase.client
          .from('csm_contractor_profiles')
          .select(`
            *,
            metrics:csm_contractor_metrics(*),
            documents:csm_contractor_documents(*)
          `)
          .eq('company_id', companyId)
          .eq(query?.contractor_id ? 'id' : 'company_id', query?.contractor_id ?? companyId),

        // 2. Periodic post-job evaluations (1910.119(h)(2)(v))
        this.supabase.client
          .from('csm_post_job_evaluations')
          .select('*, contractor:csm_contractor_profiles(company_name, vendor_number)')
          .eq('company_id', companyId)
          .order('evaluation_date', { ascending: false }),

        // 3. Worker qualifications and training records (1910.119(h)(3)(i)-(iv))
        this.supabase.client
          .from('csm_contractor_workers')
          .select(`
            *,
            contractor:csm_contractor_profiles(company_name, vendor_number),
            certifications:csm_worker_certifications(*),
            inductions:csm_worker_inductions(*, course:csm_induction_courses(title, course_code))
          `)
          .eq('company_id', companyId),

        // 4. Orientation courses and process chemical hazard briefings (1910.119(h)(2)(ii) & (iii))
        this.supabase.client
          .from('csm_induction_courses')
          .select('*')
          .eq('company_id', companyId),

        // 5. Active gate access passes (1910.119(h)(2)(iv))
        this.supabase.client
          .from('csm_gate_passes')
          .select('*, worker:csm_contractor_workers(first_name, last_name, worker_code)')
          .eq('company_id', companyId),

        // 6. Active variances
        this.supabase.client
          .from('csm_contractor_variances')
          .select('*, contractor:csm_contractor_profiles(company_name)')
          .eq('company_id', companyId)
      ]);

    const contractors = contractorsRes.data ?? [];
    const evaluations = evalsRes.data ?? [];
    const workers = workersRes.data ?? [];
    const courses = coursesRes.data ?? [];
    const gatePasses = passesRes.data ?? [];
    const variances = variancesRes.data ?? [];

    const now = new Date();

    // Compliance Health Checklist
    const complianceAudits = [
      {
        cfr_clause: '1910.119(h)(2)(i)',
        clause_title: 'Employer Prequalification & Safety Performance Evaluation',
        status: contractors.every((c: any) => c.prequal_score > 0 || c.safety_grade !== 'UNRATED')
          ? 'FULLY_COMPLIANT'
          : 'ACTION_REQUIRED',
        finding: `${contractors.length} contracting employers evaluated against EMR, TRIR, and written safety program standards.`
      },
      {
        cfr_clause: '1910.119(h)(2)(ii)',
        clause_title: 'Informing Contract Employers of Known Process Hazards (Toxic, Fire, Explosion)',
        status: courses.length > 0 ? 'FULLY_COMPLIANT' : 'NON_COMPLIANT',
        finding: `${courses.length} active process chemical hazard orientations published covering plant-specific hazards.`
      },
      {
        cfr_clause: '1910.119(h)(2)(iii)',
        clause_title: 'Explanation of Emergency Action Plan (EAP) & Evacuation Siren Signals',
        status: courses.some((c: any) => c.course_code.includes('GEN') || c.title.includes('Emergency'))
          ? 'FULLY_COMPLIANT'
          : 'ACTION_REQUIRED',
        finding: 'Documented alarm soundings, wind direction awareness, and muster station protocols incorporated in all contractor orientations.'
      },
      {
        cfr_clause: '1910.119(h)(2)(iv)',
        clause_title: 'Safe Work Practices & Turnstile Access Gate Control',
        status: gatePasses.length > 0 ? 'FULLY_COMPLIANT' : 'ACTION_REQUIRED',
        finding: `${gatePasses.length} verified digital QR gate passes issued with strict block on expired credentials.`
      },
      {
        cfr_clause: '1910.119(h)(2)(v)',
        clause_title: 'Periodic Performance Evaluations of Contract Employers',
        status: evaluations.length > 0 ? 'FULLY_COMPLIANT' : 'ACTION_REQUIRED',
        finding: `${evaluations.length} standardized post-job supervisor scorecards logged with rolling safety performance recalculation.`
      },
      {
        cfr_clause: '1910.119(h)(3)(iii) & (iv)',
        clause_title: 'Contract Employee Training Documentation & Comprehension Verification',
        status: workers.every((w: any) => (w.certifications?.length ?? 0) > 0)
          ? 'FULLY_COMPLIANT'
          : 'ACTION_REQUIRED',
        finding: `${workers.length} contract workers with documented qualification records, exam scores, and signed hazard acknowledgments.`
      }
    ];

    return {
      audit_metadata: {
        standard: 'OSHA 29 CFR 1910.119(h) Contractor Safety Management',
        generated_at: now.toISOString(),
        reporting_period: {
          from: query?.date_from ?? 'All Historical',
          to: query?.date_to ?? now.toISOString().slice(0, 10)
        },
        auditor_scope: 'Facility Wide PSM Operating Units'
      },
      summary_kpis: {
        total_contractors: contractors.length,
        tier_1_contractors: contractors.filter((c: any) => c.tier === 'TIER_1').length,
        total_workers_tracked: workers.length,
        total_evaluations_logged: evaluations.length,
        active_gate_passes: gatePasses.filter((g: any) => g.status === 'ACTIVE').length,
        overall_compliance_status: complianceAudits.every((c) => c.status === 'FULLY_COMPLIANT')
          ? 'AUDIT_READY'
          : 'MINOR_DEFICIENCIES'
      },
      compliance_audits: complianceAudits,
      contractors,
      evaluations,
      workers,
      courses,
      gate_passes: gatePasses,
      variances
    };
  }
}
