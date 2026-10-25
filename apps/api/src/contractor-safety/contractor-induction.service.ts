import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateInductionCourseDto,
  IssueGatePassDto,
  ScanGatePassDto,
  SubmitInductionQuizDto,
  UpdateInductionCourseDto
} from './dto/contractor-safety.dto';

type Row = Record<string, any>;

@Injectable()
export class ContractorInductionService {
  private readonly logger = new Logger(ContractorInductionService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService
  ) {}

  /**
   * List site and unit safety induction courses
   */
  async listCourses(
    companyId: string,
    query?: { site_id?: string | undefined; target_audience?: string | undefined }
  ) {
    let builder = this.supabase.client
      .from('csm_induction_courses')
      .select('*, worker_completions:csm_worker_inductions(count)')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (query?.site_id) {
      builder = builder.eq('site_id', query.site_id);
    }
    if (query?.target_audience) {
      builder = builder.eq('target_audience', query.target_audience);
    }

    const { data, error } = await builder;
    if (error) {
      this.logger.error(`Error querying induction courses: ${error.message}`);
      throw new BadRequestException('Failed to fetch induction courses');
    }

    return (data ?? []).map((c: any) => ({
      ...c,
      total_completions: c.worker_completions?.[0]?.count ?? 0,
      total_slides: Array.isArray(c.slides_content) ? c.slides_content.length : 0,
      total_questions: Array.isArray(c.quiz_questions) ? c.quiz_questions.length : 0
    }));
  }

  /**
   * Get course by ID with slides and quiz
   */
  async getCourseById(companyId: string, courseId: string) {
    const { data: course, error } = await this.supabase.client
      .from('csm_induction_courses')
      .select('*')
      .eq('id', courseId)
      .eq('company_id', companyId)
      .single();

    if (error || !course) {
      throw new NotFoundException(`Induction course ${courseId} not found`);
    }

    return course;
  }

  /**
   * Create a new safety induction course
   */
  async createCourse(companyId: string, userId: string | null, dto: CreateInductionCourseDto) {
    const { data, error } = await this.supabase.client
      .from('csm_induction_courses')
      .insert({
        company_id: companyId,
        course_code: dto.course_code.toUpperCase(),
        title: dto.title,
        description: dto.description,
        site_id: dto.site_id,
        unit_id: dto.unit_id,
        target_audience: dto.target_audience ?? 'ALL_CONTRACTORS',
        passing_score_percent: dto.passing_score_percent ?? 80,
        validity_period_days: dto.validity_period_days ?? 365,
        slides_content: dto.slides_content ?? [],
        quiz_questions: dto.quiz_questions ?? [],
        is_mandatory: dto.is_mandatory ?? true,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create induction course: ${error.message}`);
      throw new BadRequestException(`Failed to create course: ${error.message}`);
    }

    try {
      await this.audit.write({
        tenantId: companyId,
        actorId: userId ?? 'SYSTEM',
        action: 'csm.induction.course_created',
        entityType: 'csm_induction_courses',
        entityId: data.id,
        metadata: { course_code: data.course_code, title: data.title }
      });
    } catch {}

    return data;
  }

  /**
   * Update induction course
   */
  async updateCourse(companyId: string, courseId: string, dto: UpdateInductionCourseDto) {
    const updates: Row = {
      updated_at: new Date().toISOString()
    };

    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.target_audience !== undefined) updates.target_audience = dto.target_audience;
    if (dto.passing_score_percent !== undefined) updates.passing_score_percent = dto.passing_score_percent;
    if (dto.validity_period_days !== undefined) updates.validity_period_days = dto.validity_period_days;
    if (dto.slides_content !== undefined) updates.slides_content = dto.slides_content;
    if (dto.quiz_questions !== undefined) updates.quiz_questions = dto.quiz_questions;
    if (dto.is_mandatory !== undefined) updates.is_mandatory = dto.is_mandatory;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;

    const { data, error } = await this.supabase.client
      .from('csm_induction_courses')
      .update(updates)
      .eq('id', courseId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update induction course: ${error.message}`);
    }

    return data;
  }

  /**
   * Start or get existing induction progress for a worker
   */
  async startOrGetWorkerInduction(companyId: string, workerId: string, courseId: string) {
    const course = await this.getCourseById(companyId, courseId);

    // Look for existing record
    const { data: existing } = await this.supabase.client
      .from('csm_worker_inductions')
      .select('*')
      .eq('company_id', companyId)
      .eq('worker_id', workerId)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return {
        induction: existing,
        course
      };
    }

    // Insert new in-progress record
    const { data: inserted, error } = await this.supabase.client
      .from('csm_worker_inductions')
      .insert({
        company_id: companyId,
        worker_id: workerId,
        course_id: courseId,
        completion_status: 'IN_PROGRESS',
        attempts_count: 1
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to initialize worker induction: ${error.message}`);
    }

    return {
      induction: inserted,
      course
    };
  }

  /**
   * Submit induction quiz and legal hazard acknowledgment signature
   * Implements OSHA 29 CFR 1910.119(h)(3)(iii)
   */
  async submitInductionQuiz(
    companyId: string,
    workerId: string,
    courseId: string,
    dto: SubmitInductionQuizDto
  ) {
    const course = await this.getCourseById(companyId, courseId);
    const questions: any[] = Array.isArray(course.quiz_questions) ? course.quiz_questions : [];

    let correctCount = 0;
    const answerBreakdown: any[] = [];

    questions.forEach((q, idx) => {
      const userChoice = dto.answers[idx];
      const isCorrect = userChoice === q.correct_index;
      if (isCorrect) correctCount++;

      answerBreakdown.push({
        question_index: idx,
        question: q.question,
        user_choice: userChoice,
        correct_choice: q.correct_index,
        is_correct: isCorrect,
        explanation: q.explanation
      });
    });

    const totalQuestions = questions.length;
    const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 100;
    const passed = scorePercent >= course.passing_score_percent && dto.hazard_acknowledgment_signed;

    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(now.getDate() + course.validity_period_days);

    // Update worker induction record
    const { data: updated, error } = await this.supabase.client
      .from('csm_worker_inductions')
      .upsert({
        company_id: companyId,
        worker_id: workerId,
        course_id: courseId,
        completion_status: passed ? 'PASSED' : 'FAILED',
        score_percent: scorePercent,
        completed_at: passed ? now.toISOString() : null,
        expires_at: passed ? expiryDate.toISOString() : null,
        quiz_answers: { answers: dto.answers, breakdown: answerBreakdown },
        hazard_acknowledgment_signed: dto.hazard_acknowledgment_signed,
        hazard_acknowledgment_signature_name: dto.signature_name,
        hazard_acknowledgment_timestamp: now.toISOString(),
        updated_at: now.toISOString()
      }, { onConflict: 'company_id,worker_id,course_id' })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to record induction quiz results: ${error.message}`);
    }

    // If passed, auto-issue or extend Gate Pass if worker is fully cleared
    let gatePass: any = null;
    if (passed) {
      try {
        gatePass = await this.issueGatePass(companyId, {
          worker_id: workerId,
          authorized_sites: course.site_id ? [course.site_id] : ['ALL_SITES'],
          authorized_units: course.unit_id ? [course.unit_id] : ['ALL_UNITS'],
          valid_until: expiryDate.toISOString()
        });
      } catch (err: any) {
        this.logger.warn(`Could not auto-generate gate pass: ${err?.message}`);
      }
    }

    return {
      passed,
      score_percent: scorePercent,
      passing_score_percent: course.passing_score_percent,
      correct_answers: correctCount,
      total_questions: totalQuestions,
      answer_breakdown: answerBreakdown,
      induction_record: updated,
      gate_pass: gatePass
    };
  }

  /**
   * Get all induction records for a specific worker
   */
  async getWorkerInductions(companyId: string, workerId: string) {
    const { data, error } = await this.supabase.client
      .from('csm_worker_inductions')
      .select('*, course:csm_induction_courses(*)')
      .eq('company_id', companyId)
      .eq('worker_id', workerId)
      .order('completed_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to query worker inductions: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * List digital gate passes
   */
  async listGatePasses(
    companyId: string,
    query?: { status?: string | undefined; search?: string | undefined }
  ) {
    let builder = this.supabase.client
      .from('csm_gate_passes')
      .select(`
        *,
        worker:csm_contractor_workers(
          id, worker_code, first_name, last_name, craft_trade, badge_status, badge_number,
          contractor:csm_contractor_profiles(id, company_name, vendor_number, safety_grade)
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (query?.status) {
      builder = builder.eq('status', query.status);
    }
    if (query?.search) {
      builder = builder.or(`pass_code.ilike.%${query.search}%`);
    }

    const { data, error } = await builder;
    if (error) {
      throw new BadRequestException(`Failed to query gate passes: ${error.message}`);
    }

    const now = new Date();
    return (data ?? []).map((p: any) => {
      const isExpired = p.valid_until ? new Date(p.valid_until) < now : false;
      return {
        ...p,
        is_expired: isExpired,
        effective_status: isExpired ? 'EXPIRED' : p.status
      };
    });
  }

  /**
   * Issue or refresh a Digital QR Gate Pass for a worker
   */
  async issueGatePass(companyId: string, dto: IssueGatePassDto) {
    // 1. Fetch worker
    const { data: worker, error: workerErr } = await this.supabase.client
      .from('csm_contractor_workers')
      .select('*, contractor:csm_contractor_profiles(*)')
      .eq('id', dto.worker_id)
      .eq('company_id', companyId)
      .single();

    if (workerErr || !worker) {
      throw new NotFoundException(`Worker ${dto.worker_id} not found`);
    }

    // 2. Generate pass code & validity
    const passCode = `GP-${worker.worker_code.replace('WRK-', '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const validUntil = dto.valid_until ?? new Date(Date.now() + 365 * 86400000).toISOString();

    const qrPayload = JSON.stringify({
      pass_code: passCode,
      worker_id: worker.id,
      worker_code: worker.worker_code,
      name: `${worker.first_name} ${worker.last_name}`,
      trade: worker.craft_trade,
      contractor: worker.contractor?.company_name,
      badge_number: worker.badge_number,
      valid_until: validUntil,
      cleared: true,
      issued_at: new Date().toISOString()
    });

    const { data, error } = await this.supabase.client
      .from('csm_gate_passes')
      .insert({
        company_id: companyId,
        worker_id: dto.worker_id,
        pass_code: passCode,
        qr_data: qrPayload,
        status: 'ACTIVE',
        valid_until: validUntil,
        authorized_sites: dto.authorized_sites ?? ['ALL_SITES'],
        authorized_units: dto.authorized_units ?? ['ALL_UNITS']
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Error generating gate pass: ${error.message}`);
      throw new BadRequestException(`Failed to issue gate pass: ${error.message}`);
    }

    return data;
  }

  /**
   * Real-Time Gate Pass Scan / Turnstile Validator (OSHA 1910.119 Security Gate)
   */
  async scanGatePass(companyId: string, dto: ScanGatePassDto) {
    const { data: pass, error } = await this.supabase.client
      .from('csm_gate_passes')
      .select(`
        *,
        worker:csm_contractor_workers(
          id, worker_code, first_name, last_name, craft_trade, badge_status, badge_number,
          contractor:csm_contractor_profiles(id, company_name, vendor_number, safety_grade),
          certifications:csm_worker_certifications(certification_name, verification_status, expiration_date, is_ptw_blocking)
        )
      `)
      .eq('pass_code', dto.pass_code.trim())
      .eq('company_id', companyId)
      .maybeSingle();

    if (error || !pass) {
      return {
        access_granted: false,
        rejection_reason: 'INVALID_GATE_PASS_CODE',
        message: `No gate pass record found for code ${dto.pass_code}`
      };
    }

    const now = new Date();
    const worker = pass.worker;

    // Check 1: Pass status
    if (pass.status !== 'ACTIVE') {
      return {
        access_granted: false,
        rejection_reason: 'PASS_NOT_ACTIVE',
        message: `Gate pass status is ${pass.status}`,
        pass
      };
    }

    // Check 2: Pass expiration
    if (new Date(pass.valid_until) < now) {
      return {
        access_granted: false,
        rejection_reason: 'PASS_EXPIRED',
        message: `Gate pass expired on ${pass.valid_until.slice(0, 10)}. Re-induction required.`,
        pass
      };
    }

    // Check 3: Worker badge status
    if (worker.badge_status !== 'ACTIVE') {
      return {
        access_granted: false,
        rejection_reason: 'WORKER_BADGE_SUSPENDED',
        message: `Worker badge is ${worker.badge_status}`,
        pass
      };
    }

    // Check 4: Check if any mandatory PTW blocking certifications have expired
    const certs: any[] = worker.certifications ?? [];
    const expiredBlocking = certs.filter(
      (c) => c.is_ptw_blocking && c.expiration_date && new Date(c.expiration_date) < now
    );

    if (expiredBlocking.length > 0) {
      return {
        access_granted: false,
        rejection_reason: 'MANDATORY_QUALIFICATION_EXPIRED',
        message: `${expiredBlocking.length} mandatory certification(s) expired (${expiredBlocking.map(c => c.certification_name).join(', ')})`,
        pass
      };
    }

    // Access Granted! Record scan history
    const gateLocation = dto.gate_location ?? 'MAIN_GATE_TURNSTILE_1';
    const scanEvent = {
      timestamp: now.toISOString(),
      gate: gateLocation,
      decision: 'GRANTED'
    };

    const existingScans = Array.isArray(pass.scan_history) ? pass.scan_history : [];
    const updatedHistory = [scanEvent, ...existingScans].slice(0, 20);

    try {
      await this.supabase.client
        .from('csm_gate_passes')
        .update({
          last_scanned_at: now.toISOString(),
          last_scanned_gate: gateLocation,
          scan_history: updatedHistory
        })
        .eq('id', pass.id);
    } catch {}

    return {
      access_granted: true,
      message: `Access granted for ${worker.first_name} ${worker.last_name}`,
      worker: {
        id: worker.id,
        worker_code: worker.worker_code,
        name: `${worker.first_name} ${worker.last_name}`,
        craft_trade: worker.craft_trade,
        badge_number: worker.badge_number,
        contractor: worker.contractor?.company_name,
        safety_grade: worker.contractor?.safety_grade
      },
      gate_pass: {
        pass_code: pass.pass_code,
        valid_until: pass.valid_until,
        authorized_units: pass.authorized_units,
        last_scanned_at: now.toISOString(),
        scanned_gate: gateLocation
      }
    };
  }
}
