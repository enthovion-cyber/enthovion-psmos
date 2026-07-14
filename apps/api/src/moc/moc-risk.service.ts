import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchIndexService } from '../search/search-index.service';
import { MocRiskCalculatorService } from './moc-risk-calculator.service';
import { MocRiskHistoryService } from './moc-risk-history.service';
import { MocRiskReviewRequirementService } from './moc-risk-review-requirement.service';
import { MocRiskValidationService } from './moc-risk-validation.service';
import { MocRiskWorkflowImpactService } from './moc-risk-workflow-impact.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

@Injectable()
export class MocRiskService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly searchIndex: SearchIndexService,
    private readonly calculator: MocRiskCalculatorService,
    private readonly validation: MocRiskValidationService,
    private readonly workflowImpact: MocRiskWorkflowImpactService,
    private readonly reviewRequirements: MocRiskReviewRequirementService,
    private readonly historyWriter: MocRiskHistoryService
  ) {}

  async getRisk(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const risk = await this.ensureRisk(tenantId, moc, moc.created_by ?? moc.originator_id);
    const [history, reviewRequirements] = await Promise.all([
      this.historyWriter.list(tenantId, id),
      this.reviewRequirements.list(tenantId, moc, risk)
    ]);
    return { risk, history, reviewRequirements, summary: this.summary(risk, reviewRequirements), readOnly: this.readOnly(moc, risk) };
  }

  async updateRisk(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.ensureRisk(tenantId, moc, actorId);
    this.assertEditable(moc, before);
    const calculation = this.calculator.calculate({
      safetyScore: dto.safetyScore ?? dto.safetyImpact,
      environmentalScore: dto.environmentalScore ?? dto.environmentalImpact,
      productionScore: dto.productionScore ?? dto.productionImpact,
      beforeScore: dto.beforeScore ?? before.before_score ?? before.total_score
    });
    const validation = this.validation.validateForSave(dto, calculation);
    const workflowImpact = this.workflowImpact.build(calculation.riskLevel, calculation.totalScore);
    const patch = this.toRiskPatch(tenantId, actorId, moc, dto, calculation, validation, workflowImpact, 'Draft');
    const row = await this.upsertRisk(id, patch);
    await this.syncMocRisk(tenantId, id, row);
    await this.syncCriticalSideEffects(tenantId, actorId, moc, row, before);
    await this.history(tenantId, moc, actorId, 'MOC_RISK_SAVED', 'Risk ranking saved', before, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_RISK_SAVED', entityType: 'MOC', entityId: id, before: before as JsonValue, after: row as JsonValue });
    await this.indexMoc(tenantId, id);
    return this.getRisk(tenantId, id, scope);
  }

  async recalculate(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.ensureRisk(tenantId, moc, actorId);
    this.assertEditable(moc, before);
    const calculation = this.calculator.calculate({
      safetyScore: dto.safetyScore ?? before.safety_score,
      environmentalScore: dto.environmentalScore ?? before.environmental_score,
      productionScore: dto.productionScore ?? before.production_score,
      beforeScore: dto.beforeScore ?? before.before_score ?? before.total_score
    });
    const validation = this.validation.validateForSave({ ...this.toCamel(before), ...dto }, calculation);
    const workflowImpact = this.workflowImpact.build(calculation.riskLevel, calculation.totalScore);
    const row = await this.upsertRisk(id, this.toRiskPatch(tenantId, actorId, moc, { ...this.toCamel(before), ...dto }, calculation, validation, workflowImpact, before.status ?? 'Draft'));
    await this.syncMocRisk(tenantId, id, row);
    await this.syncCriticalSideEffects(tenantId, actorId, moc, row, before);
    await this.history(tenantId, moc, actorId, 'MOC_RISK_RECALCULATED', 'Risk ranking recalculated', before, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_RISK_RECALCULATED', entityType: 'MOC', entityId: id, before: before as JsonValue, after: row as JsonValue });
    await this.indexMoc(tenantId, id);
    return this.getRisk(tenantId, id, scope);
  }

  async complete(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.ensureRisk(tenantId, moc, actorId);
    this.assertEditable(moc, before);
    const values = this.toCamel(before);
    const calculation = this.calculator.calculate(values);
    const validation = this.validation.validateForComplete(values, calculation);
    const workflowImpact = this.workflowImpact.build(calculation.riskLevel, calculation.totalScore);
    const row = await this.upsertRisk(id, {
      ...this.toRiskPatch(tenantId, actorId, moc, values, calculation, validation, workflowImpact, 'Complete'),
      completed_by: actorId,
      completed_at: new Date().toISOString(),
      assessed_by: before.assessed_by ?? actorId,
      assessed_at: before.assessed_at ?? new Date().toISOString()
    });
    await this.syncMocRisk(tenantId, id, row);
    await this.syncCriticalSideEffects(tenantId, actorId, moc, row, before);
    await this.history(tenantId, moc, actorId, 'MOC_RISK_COMPLETED', 'Risk ranking completed', before, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_RISK_COMPLETED', entityType: 'MOC', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return this.getRisk(tenantId, id, scope);
  }

  async requestReassessment(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.ensureRisk(tenantId, moc, actorId);
    const row = await this.upsertRisk(id, {
      tenant_id: tenantId,
      status: 'Needs Reassessment',
      reassessment_requested_by: actorId,
      reassessment_requested_at: new Date().toISOString(),
      reassessment_reason: dto.reason ?? 'Risk reassessment requested',
      updated_at: new Date().toISOString()
    });
    await this.notifications.notifyUser({ tenantId, userId: moc.originator_id ?? actorId, companyId: moc.company_id, siteId: moc.site_id, type: 'moc.risk.reassessment_required', module: 'moc', title: `${moc.moc_number} risk reassessment required`, message: dto.reason ?? 'Risk reassessment requested', relatedRecordId: id, relatedRecordType: 'MOC', relatedUrl: `/moc/${id}`, priority: 'High' }).catch(() => null);
    await this.history(tenantId, moc, actorId, 'MOC_RISK_REASSESSMENT_REQUESTED', 'Risk reassessment requested', before, row, dto.reason);
    await this.audit.write({ tenantId, actorId, action: 'MOC_RISK_REASSESSMENT_REQUESTED', entityType: 'MOC', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return this.getRisk(tenantId, id, scope);
  }

  async lock(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.ensureRisk(tenantId, moc, actorId);
    const row = await this.upsertRisk(id, { tenant_id: tenantId, status: 'Locked', locked_by: actorId, locked_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    await this.history(tenantId, moc, actorId, 'MOC_RISK_LOCKED', 'Risk ranking locked', before, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_RISK_LOCKED', entityType: 'MOC', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return this.getRisk(tenantId, id, scope);
  }

  async unlock(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.ensureRisk(tenantId, moc, actorId);
    const row = await this.upsertRisk(id, { tenant_id: tenantId, status: before.completed_at ? 'Complete' : 'Draft', locked_by: null, locked_at: null, updated_at: new Date().toISOString() });
    await this.history(tenantId, moc, actorId, 'MOC_RISK_UNLOCKED', 'Risk ranking unlocked', before, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_RISK_UNLOCKED', entityType: 'MOC', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return this.getRisk(tenantId, id, scope);
  }

  async history(tenantId: string, moc: any, actorId: string, eventType: string, title: string, before: any, after: any, description?: string) {
    await this.historyWriter.write(tenantId, moc, actorId, eventType, title, before, after, description);
    await this.db.single(this.db.from('moc_history_events').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: moc.id,
      event_type: eventType,
      title,
      description: description ?? null,
      actor_id: actorId,
      before_value: before ?? null,
      after_value: after ?? null,
      related_record_type: 'MOC Risk',
      related_record_id: moc.id,
      related_url: `/moc/${moc.id}`
    }).select().single()).catch(() => null);
  }

  async historyEvents(tenantId: string, id: string, scope: Scope) {
    await this.getMoc(tenantId, id, scope);
    return this.historyWriter.list(tenantId, id);
  }

  async reviewRequirementList(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const risk = await this.ensureRisk(tenantId, moc, moc.created_by ?? moc.originator_id);
    return this.reviewRequirements.list(tenantId, moc, risk);
  }

  async applyReviewRequirements(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const risk = await this.ensureRisk(tenantId, moc, actorId);
    const rows = await this.reviewRequirements.apply(tenantId, actorId, moc, risk);
    await this.history(tenantId, moc, actorId, 'MOC_RISK_REVIEW_REQUIREMENTS_APPLIED', 'Risk review requirements applied', null, rows);
    await this.audit.write({ tenantId, actorId, action: 'MOC_RISK_REVIEW_REQUIREMENTS_APPLIED', entityType: 'MOC', entityId: id, after: rows as JsonValue });
    return rows;
  }

  async dashboard(tenantId: string, scope: Scope) {
    let query = this.db.from('mocs').select('id,moc_number,title,status,risk_level,risk_score,site_id,updated_at').eq('tenant_id', tenantId);
    query = this.scopeQuery(query, scope);
    const rows = await this.db.many<any>(query.order('updated_at', { ascending: false }).limit(100));
    return {
      total: rows.length,
      critical: rows.filter((row) => row.risk_level === 'Critical').length,
      high: rows.filter((row) => row.risk_level === 'High').length,
      medium: rows.filter((row) => row.risk_level === 'Medium').length,
      low: rows.filter((row) => row.risk_level === 'Low').length,
      records: rows
    };
  }

  summaryForTenant(tenantId: string, scope: Scope) {
    return this.dashboard(tenantId, scope);
  }

  private async getMoc(tenantId: string, id: string, scope: Scope) {
    const moc = await this.db.single<any>(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!moc) throw new NotFoundException('MOC not found');
    if (moc.site_id && !scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(moc.site_id)) throw new BadRequestException('MOC is outside your site access scope');
    return moc;
  }

  private async ensureRisk(tenantId: string, moc: any, actorId?: string | null) {
    const existing = await this.db.single<any>(this.db.from('moc_risk_assessments').select('*').eq('tenant_id', tenantId).eq('moc_id', moc.id).maybeSingle());
    if (existing) return existing;
    return this.db.single<any>(this.db.from('moc_risk_assessments').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: moc.id,
      safety_impact: 0,
      environmental_impact: 0,
      production_impact: 0,
      safety_score: 0,
      environmental_score: 0,
      production_score: 0,
      safety_label: 'None',
      environmental_label: 'None',
      production_label: 'None',
      total_score: moc.risk_score ?? 0,
      risk_level: moc.risk_level ?? 'Low',
      status: 'Draft',
      created_by: actorId ?? null
    }).select().single());
  }

  private async upsertRisk(mocId: string, patch: Record<string, any>) {
    const existing = await this.db.single<any>(this.db.from('moc_risk_assessments').select('*').eq('tenant_id', patch.tenant_id).eq('moc_id', mocId).maybeSingle());
    if (existing) {
      return this.db.single<any>(this.db.from('moc_risk_assessments').update(patch).eq('tenant_id', patch.tenant_id).eq('id', existing.id).select().single());
    }
    return this.db.single<any>(this.db.from('moc_risk_assessments').insert({ id: crypto.randomUUID(), moc_id: mocId, ...patch }).select().single());
  }

  private toRiskPatch(tenantId: string, actorId: string, moc: any, dto: Record<string, any>, calculation: any, validation: any, workflowImpact: any, status: string) {
    return {
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: moc.id,
      status,
      safety_impact: calculation.safetyScore,
      environmental_impact: calculation.environmentalScore,
      production_impact: calculation.productionScore,
      safety_score: calculation.safetyScore,
      environmental_score: calculation.environmentalScore,
      production_score: calculation.productionScore,
      safety_label: calculation.safetyLabel,
      environmental_label: calculation.environmentalLabel,
      production_label: calculation.productionLabel,
      total_score: calculation.totalScore,
      risk_level: calculation.riskLevel,
      rationale: dto.overallRationale ?? dto.rationale ?? null,
      safety_rationale: dto.safetyRationale ?? null,
      safety_consequence: dto.safetyConsequence ?? null,
      personnel_exposure: dto.personnelExposure ?? null,
      process_safety_consequence: dto.processSafetyConsequence ?? null,
      safety_safeguards: dto.safetySafeguards ?? null,
      environmental_rationale: dto.environmentalRationale ?? null,
      emissions_impact: dto.emissionsImpact ?? null,
      regulatory_permit_impact: dto.regulatoryPermitImpact ?? null,
      spill_release_potential: dto.spillReleasePotential ?? null,
      environmental_safeguards: dto.environmentalSafeguards ?? null,
      production_rationale: dto.productionRationale ?? null,
      downtime_impact: dto.downtimeImpact ?? null,
      quality_impact: dto.qualityImpact ?? null,
      throughput_impact: dto.throughputImpact ?? null,
      business_continuity_impact: dto.businessContinuityImpact ?? null,
      production_safeguards: dto.productionSafeguards ?? null,
      overall_rationale: dto.overallRationale ?? null,
      additional_hazards: dto.additionalHazards ?? null,
      existing_safeguards: dto.existingSafeguards ?? null,
      additional_safeguards: dto.additionalSafeguards ?? null,
      additional_safeguards_justification: dto.additionalSafeguardsJustification ?? null,
      assumptions: dto.assumptions ?? null,
      uncertainties: dto.uncertainties ?? null,
      risk_acceptance_statement: dto.riskAcceptanceStatement ?? null,
      management_justification: dto.managementJustification ?? null,
      before_score: calculation.beforeScore,
      before_level: calculation.beforeLevel,
      after_score: calculation.afterScore,
      after_level: calculation.afterLevel,
      before_risk: { score: calculation.beforeScore, level: calculation.beforeLevel },
      after_risk: { score: calculation.afterScore, level: calculation.afterLevel },
      hazop_required: workflowImpact.requiresCriticalAlert || Boolean(dto.hazopRequired),
      pssr_required: workflowImpact.requiresCriticalAlert || Boolean(dto.pssrRequired),
      lopa_required: workflowImpact.requiresCriticalAlert || Boolean(dto.lopaRequired),
      hse_review_required: ['High', 'Critical'].includes(calculation.riskLevel),
      engineering_review_required: ['High', 'Critical'].includes(calculation.riskLevel),
      operations_review_required: ['High', 'Critical'].includes(calculation.riskLevel),
      environmental_review_required: calculation.environmentalScore > 0,
      management_review_required: calculation.riskLevel === 'Critical',
      workflow_impact: workflowImpact,
      validation_result: validation,
      assessed_by: actorId,
      assessed_at: new Date().toISOString(),
      created_by: actorId,
      updated_at: new Date().toISOString()
    };
  }

  private toCamel(row: any) {
    return {
      safetyScore: row.safety_score ?? row.safety_impact ?? 0,
      environmentalScore: row.environmental_score ?? row.environmental_impact ?? 0,
      productionScore: row.production_score ?? row.production_impact ?? 0,
      beforeScore: row.before_score ?? row.total_score ?? 0,
      safetyRationale: row.safety_rationale ?? '',
      safetyConsequence: row.safety_consequence ?? '',
      personnelExposure: row.personnel_exposure ?? '',
      processSafetyConsequence: row.process_safety_consequence ?? '',
      safetySafeguards: row.safety_safeguards ?? '',
      environmentalRationale: row.environmental_rationale ?? '',
      emissionsImpact: row.emissions_impact ?? '',
      regulatoryPermitImpact: row.regulatory_permit_impact ?? '',
      spillReleasePotential: row.spill_release_potential ?? '',
      environmentalSafeguards: row.environmental_safeguards ?? '',
      productionRationale: row.production_rationale ?? '',
      downtimeImpact: row.downtime_impact ?? '',
      qualityImpact: row.quality_impact ?? '',
      throughputImpact: row.throughput_impact ?? '',
      businessContinuityImpact: row.business_continuity_impact ?? '',
      productionSafeguards: row.production_safeguards ?? '',
      overallRationale: row.overall_rationale ?? row.rationale ?? '',
      additionalHazards: row.additional_hazards ?? '',
      existingSafeguards: row.existing_safeguards ?? '',
      additionalSafeguards: row.additional_safeguards ?? '',
      additionalSafeguardsJustification: row.additional_safeguards_justification ?? '',
      assumptions: row.assumptions ?? '',
      uncertainties: row.uncertainties ?? '',
      riskAcceptanceStatement: row.risk_acceptance_statement ?? '',
      managementJustification: row.management_justification ?? ''
    };
  }

  private async syncMocRisk(tenantId: string, id: string, risk: any) {
    await this.db.single(this.db.from('mocs').update({ risk_level: risk.risk_level, risk_score: risk.total_score, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
  }

  private async syncCriticalSideEffects(tenantId: string, actorId: string, moc: any, risk: any, before: any) {
    if (risk.risk_level === 'Critical') {
      await this.db.single(this.db.from('moc_pssr_requirements').upsert({
        id: `${moc.id}_risk_pssr`,
        tenant_id: tenantId,
        company_id: moc.company_id,
        site_id: moc.site_id,
        moc_id: moc.id,
        required: true,
        trigger_reason: 'Critical risk ranking requires PSSR before startup.',
        status: 'Required',
        startup_blockers: ['Critical risk PSSR not completed'],
        readiness_score: 0,
        created_by: actorId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'moc_id' }).select().single()).catch(() => null);
    }
    if (risk.risk_level === 'Critical' && !before.critical_alert_sent) {
      await this.notifications.notifyUser({ tenantId, userId: moc.originator_id ?? actorId, companyId: moc.company_id, siteId: moc.site_id, type: 'moc.risk.critical', module: 'moc', title: `${moc.moc_number} critical risk ranking`, message: `${moc.title} is now Critical risk and requires escalation.`, relatedRecordId: moc.id, relatedRecordType: 'MOC', relatedUrl: `/moc/${moc.id}`, priority: 'Safety-Critical' }).catch(() => null);
      await this.upsertRisk(moc.id, { tenant_id: tenantId, critical_alert_sent: true, updated_at: new Date().toISOString() });
    } else if (risk.risk_level === 'High' && before.risk_level !== 'High') {
      await this.notifications.notifyUser({ tenantId, userId: moc.originator_id ?? actorId, companyId: moc.company_id, siteId: moc.site_id, type: 'moc.risk.high', module: 'moc', title: `${moc.moc_number} high risk ranking`, message: `${moc.title} is now High risk.`, relatedRecordId: moc.id, relatedRecordType: 'MOC', relatedUrl: `/moc/${moc.id}`, priority: 'High' }).catch(() => null);
    }
  }

  private async indexMoc(tenantId: string, id: string) {
    const moc = await this.db.single<any>(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!moc) return;
    await this.searchIndex.indexRecord(tenantId, { module: 'moc', recordType: 'MOC', recordId: moc.id, recordNumber: moc.moc_number, title: moc.title, description: moc.description, status: moc.status, priority: moc.risk_level, siteId: moc.site_id, url: `/moc/${moc.id}`, searchableText: [moc.moc_number, moc.title, moc.change_type, moc.change_category, moc.risk_level, moc.status].join(' '), metadata: { riskScore: moc.risk_score, changeType: moc.change_type } }).catch(() => null);
  }

  private summary(risk: any, reviewRequirements: any[]) {
    return {
      score: risk.total_score,
      level: risk.risk_level,
      status: risk.status,
      requiredReviews: reviewRequirements.filter((row) => row.required).length,
      approvalBlockingReviews: reviewRequirements.filter((row) => row.required_before_approval).length,
      startupBlockingReviews: reviewRequirements.filter((row) => row.required_before_startup).length,
      validationErrors: risk.validation_result?.errors ?? [],
      validationWarnings: risk.validation_result?.warnings ?? []
    };
  }

  private readOnly(moc: any, risk: any) {
    return ['Closed', 'Cancelled'].includes(moc.status) || Boolean(risk.locked_at) || risk.status === 'Locked';
  }

  private assertEditable(moc: any, risk: any) {
    if (this.readOnly(moc, risk)) throw new BadRequestException('Risk ranking is locked or the MOC is closed/cancelled.');
  }

  private scopeQuery(query: any, scope: Scope) {
    if (scope.selectedSiteId) return query.eq('site_id', scope.selectedSiteId);
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in('site_id', scope.allowedSiteIds);
    return query;
  }
}
