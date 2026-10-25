// apps/api/src/contractor-safety/contractor-prequal.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../database/supabase.service';
import { CsmScope } from './contractor-safety.service';
import {
  ApproveVarianceDto,
  CreateVarianceRequestDto,
  EvaluateContractorPrequalDto,
  UpsertContractorMetricsDto
} from './dto/contractor-safety.dto';

type Row = Record<string, any>;

export interface ScoringResult {
  overallScore: number;
  safetyGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendedStatus: 'ACTIVE' | 'CONDITIONAL' | 'DISQUALIFIED';
  threeYearAvgTrir: number;
  threeYearAvgDart: number;
  currentEmr: number;
  fatalitiesInThreeYears: number;
  citationsInThreeYears: number;
  scoreBreakdown: {
    emrScore: number;
    trirScore: number;
    fatalityScore: number;
    dartScore: number;
    programScore: number;
  };
}

@Injectable()
export class ContractorPrequalService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService
  ) {}

  // ---------------------------------------------------------------- Rules & Scoring Benchmarks
  getScoringRules() {
    return {
      weights: {
        emrMax: 30,
        trirMax: 30,
        fatalityMax: 20,
        dartMax: 10,
        complianceProgramMax: 10
      },
      gradeThresholds: {
        A: { min: 90.0, label: 'Grade A - Preferred Partner' },
        B: { min: 80.0, label: 'Grade B - Approved Contractor' },
        C: { min: 70.0, label: 'Grade C - Conditional / Variance Required' },
        D: { min: 0.0, label: 'Grade D/F - Disqualified / High Risk' }
      },
      benchmarks: {
        industryAvgTrir: 2.10,
        industryAvgDart: 1.10,
        standardEmr: 1.00
      }
    };
  }

  // ---------------------------------------------------------------- Contractor Prequal Summary
  async getContractorPrequal(scope: CsmScope, contractorId: string) {
    const tenantId = scope.tenantId;

    const [contractor, metrics, evaluations, variances] = await Promise.all([
      this.db.single<Row>(
        this.db
          .from('csm_contractor_profiles')
          .select('*')
          .eq('id', contractorId)
          .eq('tenant_id', tenantId)
      ),
      this.db.many<Row>(
        this.db
          .from('csm_contractor_metrics')
          .select('*')
          .eq('contractor_id', contractorId)
          .order('year', { ascending: false })
      ).catch(() => []),
      this.db.many<Row>(
        this.db
          .from('csm_prequal_evaluations')
          .select('*')
          .eq('contractor_id', contractorId)
          .order('evaluation_date', { ascending: false })
          .limit(10)
      ).catch(() => []),
      this.db.many<Row>(
        this.db
          .from('csm_contractor_variances')
          .select('*')
          .eq('contractor_id', contractorId)
          .order('created_at', { ascending: false })
      ).catch(() => [])
    ]);

    if (!contractor) {
      throw new NotFoundException(`Contractor ${contractorId} not found.`);
    }

    const currentEval = evaluations.find((e) => e.is_current) ?? evaluations[0] ?? null;
    const activeVariance = variances.find((v) => {
      if (v.status !== 'APPROVED') return false;
      const exp = new Date(v.expires_at);
      return exp >= new Date();
    }) ?? null;

    return {
      contractor: {
        id: contractor.id,
        company_name: contractor.company_name,
        company_code: contractor.company_code,
        tier: contractor.tier,
        status: contractor.status,
        safety_grade: contractor.safety_grade,
        prequal_score: contractor.prequal_score,
        prequal_valid_until: contractor.prequal_valid_until
      },
      currentEvaluation: currentEval,
      evaluationHistory: evaluations,
      metricsHistory: metrics,
      variances,
      activeVariance
    };
  }

  // ---------------------------------------------------------------- Upsert Annual Safety Metrics
  async upsertMetrics(scope: CsmScope, contractorId: string, dto: UpsertContractorMetricsDto, actorId: string) {
    const tenantId = scope.tenantId;

    // Auto-calculate rates if not passed: (cases * 200,000) / hours
    const hours = Number(dto.total_hours_worked ?? 0);
    const trir = hours > 0
      ? Math.round(((Number(dto.recordable_cases_count ?? 0) * 200000) / hours) * 1000) / 1000
      : 0.0;
    const dartRate = hours > 0
      ? Math.round(((Number(dto.dart_cases_count ?? 0) * 200000) / hours) * 1000) / 1000
      : 0.0;

    const payload = {
      tenant_id: tenantId,
      contractor_id: contractorId,
      year: dto.year,
      total_hours_worked: hours,
      fatalities_count: Number(dto.fatalities_count ?? 0),
      recordable_cases_count: Number(dto.recordable_cases_count ?? 0),
      dart_cases_count: Number(dto.dart_cases_count ?? 0),
      trir,
      dart_rate: dartRate,
      emr: Number(dto.emr ?? 1.0),
      emr_carrier: dto.emr_carrier ?? null,
      osha_citations_count: Number(dto.osha_citations_count ?? 0),
      osha_citations_penalties_usd: Number(dto.osha_citations_penalties_usd ?? 0),
      has_written_safety_program: dto.has_written_safety_program ?? true,
      has_subcontractor_management_plan: dto.has_subcontractor_management_plan ?? true,
      recorded_by_user_id: actorId,
      updated_at: new Date().toISOString()
    };

    const inserted = await this.db.single<Row>(
      this.db
        .from('csm_contractor_metrics')
        .upsert(payload, { onConflict: 'contractor_id,year' })
        .select('*')
    );

    // Auto-run evaluation to keep contractor grade fresh
    await this.evaluate(scope, contractorId, { evaluation_notes: `Auto-evaluated after ${dto.year} metrics update.` }, actorId);

    return inserted ?? payload;
  }

  // ---------------------------------------------------------------- Scoring Engine Calculation
  calculatePrequalScore(metrics: Row[]): ScoringResult {
    // Sort latest first
    const sorted = [...metrics].sort((a, b) => b.year - a.year);
    const last3Years = sorted.slice(0, 3);

    if (last3Years.length === 0) {
      return {
        overallScore: 70.0,
        safetyGrade: 'C',
        recommendedStatus: 'CONDITIONAL',
        threeYearAvgTrir: 0,
        threeYearAvgDart: 0,
        currentEmr: 1.0,
        fatalitiesInThreeYears: 0,
        citationsInThreeYears: 0,
        scoreBreakdown: {
          emrScore: 20,
          trirScore: 20,
          fatalityScore: 20,
          dartScore: 5,
          programScore: 5
        }
      };
    }

    // 1. EMR Score (Max 30 pts)
    const latestEmr = Number(last3Years[0]?.emr ?? 1.0);
    let emrScore = 0;
    if (latestEmr <= 0.80) emrScore = 30;
    else if (latestEmr <= 0.90) emrScore = 25;
    else if (latestEmr <= 1.00) emrScore = 20;
    else if (latestEmr <= 1.20) emrScore = 10;
    else emrScore = 0;

    // 2. 3-Year Weighted TRIR (Max 30 pts)
    const totalHours = last3Years.reduce((acc, m) => acc + Number(m.total_hours_worked ?? 0), 0);
    const totalRecordables = last3Years.reduce((acc, m) => acc + Number(m.recordable_cases_count ?? 0), 0);
    const avgTrir = totalHours > 0
      ? Math.round(((totalRecordables * 200000) / totalHours) * 1000) / 1000
      : Number(last3Years[0]?.trir ?? 0);

    let trirScore = 0;
    if (avgTrir <= 0.75) trirScore = 30;
    else if (avgTrir <= 1.50) trirScore = 24;
    else if (avgTrir <= 2.50) trirScore = 16;
    else if (avgTrir <= 3.50) trirScore = 8;
    else trirScore = 0;

    // 3. Fatality Penalty (Max 20 pts)
    const fatalities = last3Years.reduce((acc, m) => acc + Number(m.fatalities_count ?? 0), 0);
    const fatalityScore = fatalities === 0 ? 20 : 0;

    // 4. DART Rate Score (Max 10 pts)
    const totalDartCases = last3Years.reduce((acc, m) => acc + Number(m.dart_cases_count ?? 0), 0);
    const avgDart = totalHours > 0
      ? Math.round(((totalDartCases * 200000) / totalHours) * 1000) / 1000
      : Number(last3Years[0]?.dart_rate ?? 0);

    let dartScore = 0;
    if (avgDart <= 0.50) dartScore = 10;
    else if (avgDart <= 1.20) dartScore = 6;
    else dartScore = 0;

    // 5. Compliance & Regulatory History (Max 10 pts)
    const citations = last3Years.reduce((acc, m) => acc + Number(m.osha_citations_count ?? 0), 0);
    const hasPrograms = Boolean(last3Years[0]?.has_written_safety_program ?? true);

    let programScore = 0;
    if (hasPrograms && citations === 0) programScore = 10;
    else if (hasPrograms && citations === 1) programScore = 5;
    else programScore = 0;

    let overallScore = emrScore + trirScore + fatalityScore + dartScore + programScore;
    let safetyGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
    let recommendedStatus: 'ACTIVE' | 'CONDITIONAL' | 'DISQUALIFIED' = 'CONDITIONAL';

    if (fatalities > 0) {
      safetyGrade = 'F';
      recommendedStatus = 'DISQUALIFIED';
      overallScore = Math.min(overallScore, 50);
    } else if (overallScore >= 90) {
      safetyGrade = 'A';
      recommendedStatus = 'ACTIVE';
    } else if (overallScore >= 80) {
      safetyGrade = 'B';
      recommendedStatus = 'ACTIVE';
    } else if (overallScore >= 70) {
      safetyGrade = 'C';
      recommendedStatus = 'CONDITIONAL';
    } else {
      safetyGrade = 'D';
      recommendedStatus = 'DISQUALIFIED';
    }

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      safetyGrade,
      recommendedStatus,
      threeYearAvgTrir: avgTrir,
      threeYearAvgDart: avgDart,
      currentEmr: latestEmr,
      fatalitiesInThreeYears: fatalities,
      citationsInThreeYears: citations,
      scoreBreakdown: {
        emrScore,
        trirScore,
        fatalityScore,
        dartScore,
        programScore
      }
    };
  }

  // ---------------------------------------------------------------- Evaluate Contractor Prequalification
  async evaluate(scope: CsmScope, contractorId: string, dto: EvaluateContractorPrequalDto, actorId: string) {
    const tenantId = scope.tenantId;

    const metrics = await this.db.many<Row>(
      this.db
        .from('csm_contractor_metrics')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('year', { ascending: false })
    ).catch(() => []);

    const result = this.calculatePrequalScore(metrics);

    // Reset previous evaluations is_current to false
    try {
      await this.db
        .from('csm_prequal_evaluations')
        .update({ is_current: false })
        .eq('contractor_id', contractorId);
    } catch {}

    const evalPayload = {
      tenant_id: tenantId,
      contractor_id: contractorId,
      evaluation_date: new Date().toISOString(),
      evaluator_user_id: actorId,
      overall_score: result.overallScore,
      safety_grade: result.safetyGrade,
      three_year_avg_trir: result.threeYearAvgTrir,
      three_year_avg_dart: result.threeYearAvgDart,
      current_emr: result.currentEmr,
      fatalities_in_three_years: result.fatalitiesInThreeYears,
      citations_in_three_years: result.citationsInThreeYears,
      score_breakdown: result.scoreBreakdown,
      evaluation_notes: dto.evaluation_notes ?? 'Automated evaluation generated by Prequalification Scoring Engine.',
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      is_current: true
    };

    const insertedEval = await this.db.single<Row>(
      this.db.from('csm_prequal_evaluations').insert(evalPayload).select('*')
    );

    // Update contractor profile with newly computed score and grade
    try {
      await this.db
        .from('csm_contractor_profiles')
        .update({
          prequal_score: result.overallScore,
          safety_grade: result.safetyGrade,
          status: result.recommendedStatus,
          prequal_valid_until: evalPayload.valid_until,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractorId)
        .eq('tenant_id', tenantId);
    } catch {}

    try {
      await this.audit.write({
        tenantId,
        actorId,
        action: 'contractor.prequal.evaluated',
        entityType: 'csm_prequal_evaluations',
        entityId: insertedEval?.id ?? 'eval',
        metadata: {
          contractor_id: contractorId,
          score: result.overallScore,
          grade: result.safetyGrade,
          status: result.recommendedStatus
        }
      });
    } catch {}

    return {
      evaluation: insertedEval ?? evalPayload,
      scoringResult: result
    };
  }

  // ---------------------------------------------------------------- Variances Management
  async listVariances(scope: CsmScope, status?: string) {
    const tenantId = scope.tenantId;
    let query = this.db
      .from('csm_contractor_variances')
      .select('*, contractor:csm_contractor_profiles(company_name, company_code, tier, safety_grade)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    try {
      return await this.db.many<Row>(query);
    } catch {
      return [];
    }
  }

  async createVariance(scope: CsmScope, contractorId: string, dto: CreateVarianceRequestDto, actorId: string) {
    const tenantId = scope.tenantId;
    const varianceNumber = `VAR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = {
      tenant_id: tenantId,
      contractor_id: contractorId,
      variance_number: varianceNumber,
      title: dto.title,
      reason_category: dto.reason_category ?? 'GRADE_C_CONDITIONAL',
      justification: dto.justification,
      work_scope: dto.work_scope,
      target_unit_id: dto.target_unit_id ?? null,
      target_site_id: dto.target_site_id ?? null,
      required_mitigations: dto.required_mitigations ?? [],
      starts_at: dto.starts_at || new Date().toISOString().split('T')[0],
      expires_at: dto.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'PENDING_APPROVAL',
      requested_by_user_id: actorId
    };

    const inserted = await this.db.single<Row>(
      this.db.from('csm_contractor_variances').insert(payload).select('*')
    );

    try {
      await this.audit.write({
        tenantId,
        actorId,
        action: 'contractor.variance.requested',
        entityType: 'csm_contractor_variances',
        entityId: inserted?.id ?? 'var',
        metadata: { contractor_id: contractorId, variance_number: varianceNumber, title: dto.title }
      });
    } catch {}

    return inserted ?? payload;
  }

  async approveVariance(scope: CsmScope, varianceId: string, dto: ApproveVarianceDto, actorId: string) {
    const tenantId = scope.tenantId;

    const existing = await this.db.single<Row>(
      this.db
        .from('csm_contractor_variances')
        .select('*')
        .eq('id', varianceId)
        .eq('tenant_id', tenantId)
    );

    if (!existing) {
      throw new NotFoundException(`Variance request ${varianceId} not found.`);
    }

    const payload: Row = {
      status: dto.decision,
      approver_user_id: actorId,
      approved_at: new Date().toISOString(),
      approval_notes: dto.approval_notes ?? null,
      updated_at: new Date().toISOString()
    };

    const updated = await this.db.single<Row>(
      this.db.from('csm_contractor_variances').update(payload).eq('id', varianceId).select('*')
    );

    // If approved, update contractor profile status to 'CONDITIONAL' if it was suspended or disqualified
    if (dto.decision === 'APPROVED') {
      try {
        await this.db
          .from('csm_contractor_profiles')
          .update({ status: 'CONDITIONAL' })
          .eq('id', existing.contractor_id);
      } catch {}
    }

    try {
      await this.audit.write({
        tenantId,
        actorId,
        action: `contractor.variance.${dto.decision.toLowerCase()}`,
        entityType: 'csm_contractor_variances',
        entityId: varianceId,
        metadata: { contractor_id: existing.contractor_id, decision: dto.decision }
      });
    } catch {}

    return updated ?? { ...existing, ...payload };
  }
}
