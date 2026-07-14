import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MocClosureBlockerService } from './moc-closure-blocker.service';
import { MocImpactActionGeneratorService } from './moc-impact-action-generator.service';
import { MocImpactValidationService } from './moc-impact-validation.service';
import { MocStartupBlockerService } from './moc-startup-blocker.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

@Injectable()
export class MocImpactAssessmentService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly actions: ActionsService,
    private readonly generator: MocImpactActionGeneratorService,
    private readonly validation: MocImpactValidationService,
    private readonly startupBlockers: MocStartupBlockerService,
    private readonly closureBlockers: MocClosureBlockerService
  ) {}

  async getAssessment(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const assessment = await this.ensureAssessment(tenantId, moc, moc.created_by ?? moc.originator_id);
    const [answers, generatedActions, startupBlockers, closureBlockers] = await Promise.all([
      this.answers(tenantId, id, assessment.id),
      this.generatedActions(tenantId, id, scope),
      this.startupBlockersFor(tenantId, id, scope),
      this.closureBlockersFor(tenantId, id, scope)
    ]);
    return { assessment, answers, generatedActions, startupBlockers, closureBlockers, summary: this.summary(assessment, answers, generatedActions, startupBlockers, closureBlockers) };
  }

  async getAnswers(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const assessment = await this.ensureAssessment(tenantId, moc, moc.created_by ?? moc.originator_id);
    return this.answers(tenantId, id, assessment.id);
  }

  async saveAnswers(tenantId: string, actorId: string, id: string, payload: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    this.assertEditable(moc);
    const { answers, justifications, metadata } = this.validation.normalizeAnswers(payload);
    const validation = this.validation.validateForSave(answers, justifications);
    const flags = this.deriveFlags(answers);
    const assessment = await this.ensureAssessment(tenantId, moc, actorId);
    for (const row of this.validation.toRows(answers, justifications, metadata)) {
      await this.db.single(this.db.from('moc_impact_answers').upsert({
        id: `${id}_${row.questionKey}`,
        tenant_id: tenantId,
        company_id: moc.company_id,
        site_id: moc.site_id,
        moc_id: id,
        assessment_id: assessment.id,
        impact_area: this.impactArea(row.questionKey),
        question_key: row.questionKey,
        answer_value: row.value,
        justification: row.justification,
        metadata: row.metadata,
        created_by: actorId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'moc_id,question_key' }).select().single());
    }
    const generated = await this.generator.generate(tenantId, moc, answers);
    const startupCount = generated.filter((item) => item.requiredBeforeStartup).length;
    const closureCount = generated.filter((item) => item.requiredBeforeClosure).length;
    const updated = await this.db.single<any>(this.db.from('moc_impact_assessments').update({
      answers,
      status: validation.canComplete ? 'Complete' : Object.keys(answers).length ? 'In Progress' : 'Not Started',
      ...flags,
      startup_blockers_count: startupCount,
      closure_blockers_count: closureCount,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('id', assessment.id).select().single());
    await this.generator.upsertPreviewRows(tenantId, actorId, moc, generated);
    await this.syncPssr(tenantId, actorId, moc, flags, answers);
    await this.syncEquipmentLinks(tenantId, actorId, moc, answers);
    await this.history(tenantId, moc, actorId, 'MOC_IMPACT_ASSESSMENT_SAVED', 'Impact assessment saved', assessment, updated);
    await this.audit.write({ tenantId, actorId, action: 'MOC_IMPACT_ASSESSMENT_SAVED', entityType: 'MOC', entityId: id, before: assessment as JsonValue, after: updated as JsonValue });
    if (generated.some((item) => ['HIGH', 'SAFETY_CRITICAL', 'Critical'].includes(item.priority))) {
      await this.notifications.notifyUser({ tenantId, userId: moc.originator_id ?? actorId, companyId: moc.company_id, siteId: moc.site_id, type: 'moc.impact.high_priority_actions', module: 'moc', title: 'High-priority MOC impact requirements', message: `${moc.moc_number} generated high-priority impact requirements`, relatedRecordId: id, relatedRecordType: 'MOC', relatedUrl: `/moc/${id}`, priority: 'High' }).catch(() => null);
    }
    return this.getAssessment(tenantId, id, scope);
  }

  async complete(tenantId: string, actorId: string, id: string, scope: Scope) {
    const current = await this.getAssessment(tenantId, id, scope);
    const answers = this.answersObject(current.answers);
    const justifications = Object.fromEntries(current.answers.map((row: any) => [row.question_key, row.justification]));
    this.validation.validateForComplete(answers, justifications);
    const updated = await this.db.single<any>(this.db.from('moc_impact_assessments').update({
      status: 'Complete',
      completed_by: actorId,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('id', current.assessment.id).select().single());
    await this.history(tenantId, await this.getMoc(tenantId, id, scope), actorId, 'MOC_IMPACT_ASSESSMENT_COMPLETED', 'Impact assessment completed', current.assessment, updated);
    await this.audit.write({ tenantId, actorId, action: 'MOC_IMPACT_ASSESSMENT_COMPLETED', entityType: 'MOC', entityId: id, before: current.assessment as JsonValue, after: updated as JsonValue });
    return this.getAssessment(tenantId, id, scope);
  }

  async regenerateActions(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const assessment = await this.ensureAssessment(tenantId, moc, actorId);
    const answers = await this.getAnswers(tenantId, id, scope);
    const generated = await this.generator.generate(tenantId, moc, this.answersObject(answers));
    await this.generator.upsertPreviewRows(tenantId, actorId, moc, generated);
    await this.history(tenantId, moc, actorId, 'MOC_IMPACT_ACTIONS_REGENERATED', 'Impact generated actions regenerated', assessment, generated);
    await this.audit.write({ tenantId, actorId, action: 'MOC_IMPACT_ACTIONS_REGENERATED', entityType: 'MOC', entityId: id, after: generated as JsonValue });
    return generated;
  }

  async generatedActions(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const assessment = await this.ensureAssessment(tenantId, moc, moc.created_by ?? moc.originator_id);
    const answers = this.answersObject(await this.answers(tenantId, id, assessment.id));
    return this.generator.generate(tenantId, moc, answers);
  }

  async applyGeneratedActions(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const generated = await this.generatedActions(tenantId, id, scope);
    const created = [];
    for (const item of generated) {
      if (item.actionId || item.status === 'Completed' || item.status === 'No Longer Required') continue;
      const action = await this.actions.create(tenantId, actorId, {
        title: item.title,
        description: item.description,
        sourceModule: 'MOC',
        sourceType: 'MOC',
        sourceRecordId: id,
        priority: item.priority === 'SAFETY_CRITICAL' ? 'SAFETY_CRITICAL' : item.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
        ownerId: moc.originator_id ?? actorId,
        equipmentId: moc.equipment?.[0]?.equipment_id,
        siteId: moc.site_id,
        departmentId: moc.department_id,
        dueDate: item.dueDate,
        evidenceRequired: item.evidenceRequired,
        verificationRequired: item.verificationRequired
      } as any);
      const requiredAction = await this.db.single<any>(this.db.from('moc_required_actions').upsert({
        id: `${id}_${item.ruleId}`,
        tenant_id: tenantId,
        company_id: moc.company_id,
        site_id: moc.site_id,
        moc_id: id,
        action_type: item.linkedModule,
        title: item.title,
        description: item.description,
        priority: item.priority,
        required: true,
        system_generated: true,
        action_id: action.id,
        status: 'Existing',
        linked_module: item.linkedModule,
        owner_id: action.assignedToId,
        due_date: item.dueDate,
        evidence_status: 'Not Uploaded',
        verification_status: 'Not Verified',
        required_before_startup: item.requiredBeforeStartup,
        required_before_closure: item.requiredBeforeClosure,
        source_impact_answer: item.questionKey,
        created_by: actorId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }).select().single());
      await this.db.single(this.db.from('moc_generated_action_links').upsert({
        id: `${id}_${item.ruleId}_link`,
        tenant_id: tenantId,
        company_id: moc.company_id,
        site_id: moc.site_id,
        moc_id: id,
        action_id: action.id,
        generated_from_rule_id: item.ruleId,
        status: 'Existing',
        updated_at: new Date().toISOString()
      }, { onConflict: 'moc_id,generated_from_rule_id' }).select().single());
      created.push({ action, requiredAction });
    }
    await this.history(tenantId, moc, actorId, 'MOC_IMPACT_ACTIONS_APPLIED', 'Generated impact actions applied to Action Center', null, created);
    await this.audit.write({ tenantId, actorId, action: 'MOC_IMPACT_ACTIONS_APPLIED', entityType: 'MOC', entityId: id, after: created as JsonValue });
    return this.generatedActions(tenantId, id, scope);
  }

  async startupBlockersFor(tenantId: string, id: string, scope: Scope) {
    return this.startupBlockers.list(await this.getMoc(tenantId, id, scope));
  }

  async closureBlockersFor(tenantId: string, id: string, scope: Scope) {
    return this.closureBlockers.list(await this.getMoc(tenantId, id, scope));
  }

  async rules(tenantId: string) {
    return this.db.many<any>(this.db.from('moc_generated_action_rules').select('*').or(`tenant_id.is.null,tenant_id.eq.${tenantId}`).order('impact_area').order('question_key'));
  }

  async createRule(tenantId: string, dto: Record<string, any>) {
    return this.db.single<any>(this.db.from('moc_generated_action_rules').insert({ id: crypto.randomUUID(), tenant_id: tenantId, ...dto }).select().single());
  }

  async updateRule(tenantId: string, ruleId: string, dto: Record<string, any>) {
    return this.db.single<any>(this.db.from('moc_generated_action_rules').update({ ...dto, updated_at: new Date().toISOString() }).eq('id', ruleId).or(`tenant_id.is.null,tenant_id.eq.${tenantId}`).select().single());
  }

  async deleteRule(tenantId: string, ruleId: string) {
    return this.db.single<any>(this.db.from('moc_generated_action_rules').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', ruleId).or(`tenant_id.is.null,tenant_id.eq.${tenantId}`).select().single());
  }

  private async getMoc(tenantId: string, id: string, scope: Scope) {
    const moc = await this.db.single<any>(this.db.from('mocs').select('*, equipment:moc_affected_equipment(*)').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!moc) throw new NotFoundException('MOC not found');
    if (moc.site_id && !scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(moc.site_id)) throw new BadRequestException('MOC is outside your site access scope');
    const [actions, pssr, training] = await Promise.all([
      this.db.many<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', id)),
      this.db.single<any>(this.db.from('moc_pssr_requirements').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.many<any>(this.db.from('moc_training_requirements').select('*').eq('tenant_id', tenantId).eq('moc_id', id))
    ]);
    return { ...moc, actions, pssr, training };
  }

  private async ensureAssessment(tenantId: string, moc: any, actorId?: string | null) {
    const existing = await this.db.single<any>(this.db.from('moc_impact_assessments').select('*').eq('tenant_id', tenantId).eq('moc_id', moc.id).maybeSingle());
    if (existing) return existing;
    return this.db.single<any>(this.db.from('moc_impact_assessments').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: moc.id,
      status: 'Not Started',
      answers: {},
      created_by: actorId ?? null
    }).select().single());
  }

  private answers(tenantId: string, mocId: string, assessmentId: string) {
    return this.db.many<any>(this.db.from('moc_impact_answers').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId).eq('assessment_id', assessmentId).order('impact_area').order('question_key'));
  }

  private answersObject(rows: any[]) {
    return Object.fromEntries(rows.map((row) => [row.question_key, row.answer_value]));
  }

  private deriveFlags(answers: Record<string, any>) {
    return {
      pssr_required: Boolean(answers.safetyCriticalElementAffected || answers.safetySystemsAffected || answers.commissioningTestRequired || answers.equipmentAffected),
      hazop_required: Boolean(answers.hazopDeviationReviewRequired || answers.safeOperatingEnvelopeChanged || answers.operatingLimitsChanged),
      lopa_required: Boolean(answers.lopaReviewRequired || answers.sisAffected || answers.esdAffected || answers.interlockAffected || answers.fireGasSystemAffected),
      training_required: Boolean(answers.trainingRequired || answers.operatorTrainingRequired),
      document_update_required: Boolean(answers.documentControlUpdateRequired || answers.pidUpdateRequired || answers.sopUpdateRequired || answers.sdsUpdateRequired || answers.psiUpdateRequired),
      environmental_review_required: Boolean(answers.environmentalImpactAffected || answers.permitLicenseAffected || answers.regulatoryNotificationRequired || answers.emissionsAffected || answers.wastewaterAffected || answers.wasteGenerationAffected),
      quality_review_required: Boolean(answers.productionImpactAffected || answers.productQualityAffected || answers.qualityApprovalRequired || answers.laboratoryTestingRequired)
    };
  }

  private summary(assessment: any, answers: any[], generatedActions: any[], startupBlockers: any[], closureBlockers: any[]) {
    const answerValues = answers.map((row) => row.answer_value);
    const yesCount = answerValues.filter((value) => value === true).length;
    const noWithJustification = answers.filter((row) => row.answer_value === false && row.justification).length;
    const required = ['equipmentAffected', 'chemistryAffected', 'proceduresAffected', 'operatingLimitsChanged', 'safetySystemsAffected', 'trainingRequired', 'documentControlUpdateRequired', 'environmentalImpactAffected', 'productionImpactAffected'];
    return {
      status: assessment.status,
      totalAreasReviewed: new Set(answers.map((row) => row.impact_area)).size,
      yesCount,
      noWithJustification,
      missingRequiredAnswers: required.filter((key) => !answers.some((row) => row.question_key === key)),
      generatedActionsCount: generatedActions.length,
      startupBlockingActionsCount: startupBlockers.length,
      closureBlockingActionsCount: closureBlockers.length,
      pssrRequired: assessment.pssr_required,
      hazopRequired: assessment.hazop_required,
      lopaRequired: assessment.lopa_required,
      trainingRequired: assessment.training_required,
      documentUpdateRequired: assessment.document_update_required,
      environmentalReviewRequired: assessment.environmental_review_required,
      qualityReviewRequired: assessment.quality_review_required,
      lastUpdatedBy: assessment.completed_by ?? assessment.created_by,
      lastUpdatedAt: assessment.updated_at
    };
  }

  private impactArea(questionKey: string) {
    if (['equipmentAffected', 'primaryEquipmentAffected', 'additionalEquipmentAffected', 'equipmentSpecificationChanged', 'likeForLikeReplacementConfirmed', 'designRatingChanged', 'materialOfConstructionChanged', 'pressureBoundaryAffected', 'rotatingEquipmentAffected', 'electricalEquipmentAffected', 'instrumentationAffected', 'reliefDeviceAffected', 'equipmentDatasheetUpdateRequired', 'equipmentRegistryUpdateRequired', 'pidUpdateRequired', 'inspectionPlanUpdateRequired', 'maintenancePlanUpdateRequired', 'sparePartsBomUpdateRequired'].includes(questionKey)) return 'equipment';
    if (['chemistryAffected', 'chemicalsAffected', 'newChemicalIntroduced', 'chemicalRemoved', 'compositionChanged', 'concentrationChanged', 'reactionChemistryChanged', 'catalystChanged', 'corrosivityChanged', 'toxicityChanged', 'flammabilityChanged', 'sdsUpdateRequired', 'psiChemicalDataUpdateRequired', 'exposureLimitsAffected', 'environmentalDischargeAffected', 'wasteStreamAffected', 'compatibilityReviewRequired', 'materialSelectionReviewRequired'].includes(questionKey)) return 'chemistry';
    if (questionKey.includes('Procedure') || questionKey.includes('Sop') || questionKey === 'proceduresAffected' || questionKey === 'affectedSops') return 'procedure';
    if (questionKey.includes('Limit') || questionKey.includes('Setpoint') || questionKey.includes('Envelope') || questionKey.includes('Hazop') || questionKey === 'operatingLimitsChanged') return 'operating_limits';
    if (questionKey.includes('Safety') || questionKey.includes('SIS') || questionKey.includes('sis') || questionKey.includes('lopa') || questionKey.includes('Lopa') || questionKey.includes('ESD') || questionKey.includes('esd') || questionKey.includes('Interlock') || questionKey.includes('Fire') || questionKey.includes('cyber')) return 'safety_systems';
    if (questionKey.includes('Training') || questionKey.includes('training') || questionKey.includes('Roles') || questionKey.includes('Departments')) return 'training';
    if (questionKey.includes('Document') || questionKey.includes('document') || questionKey.includes('PSI') || questionKey.includes('psi') || questionKey.includes('Drawing') || questionKey.includes('SDS')) return 'documents';
    if (questionKey.includes('Environmental') || questionKey.includes('environmental') || questionKey.includes('Regulatory') || questionKey.includes('emissions') || questionKey.includes('waste') || questionKey.includes('Permit')) return 'environmental';
    return 'quality';
  }

  private assertEditable(moc: any) {
    if (['Closed', 'Cancelled'].includes(moc.status)) throw new BadRequestException('Closed or cancelled MOCs are read-only');
    if (['Approved'].includes(moc.status)) throw new BadRequestException('Approved MOCs must be returned for revision before editing impact assessment');
  }

  private async syncPssr(tenantId: string, actorId: string, moc: any, flags: Record<string, boolean>, answers: Record<string, any>) {
    if (!flags.pssr_required) return;
    await this.db.single(this.db.from('moc_pssr_requirements').upsert({
      id: `${moc.id}_impact_pssr`,
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: moc.id,
      required: true,
      trigger_reason: answers.safetyCriticalElementAffected ? 'Safety critical element affected by impact assessment.' : 'Impact assessment triggered PSSR.',
      status: 'Required',
      startup_blockers: ['PSSR not completed'],
      readiness_score: 0,
      created_by: actorId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'moc_id' }).select().single());
  }

  private async syncEquipmentLinks(tenantId: string, actorId: string, moc: any, answers: Record<string, any>) {
    if (!answers.equipmentAffected) return;
    for (const item of moc.equipment ?? []) {
      await this.db.single(this.db.from('EquipmentTimelineEvent').insert({
        id: crypto.randomUUID(),
        tenantId,
        equipmentId: item.equipment_id,
        eventType: 'MOC_IMPACT_ASSESSMENT',
        title: `${moc.moc_number} impact assessment updated`,
        actorName: actorId,
        occurredAt: new Date().toISOString(),
        sourceType: 'MOC',
        sourceId: moc.id
      }).select().single()).catch(() => null);
    }
  }

  private history(tenantId: string, moc: any, actorId: string, eventType: string, title: string, before: unknown, after: unknown) {
    return this.db.single(this.db.from('moc_history_events').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: moc.id,
      event_type: eventType,
      title,
      actor_id: actorId,
      before_value: before ?? null,
      after_value: after ?? null,
      related_record_type: 'MOC',
      related_record_id: moc.id,
      related_url: `/moc/${moc.id}`
    }).select().single());
  }
}
