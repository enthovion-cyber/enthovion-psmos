import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";
import { auditableModules, auditTypes, standardOptions } from "./audit-compliance.constants";
import { AuditScoringHistoryService } from "./audit-scoring-history.service";

type Row = Record<string, any>;

const MODEL_TYPES = ["Weighted Compliance", "Pass/Fail Critical Control", "Evidence Verified Compliance", "Finding Deduction", "CAPA Recovery", "Hybrid PSM Assurance", "Regulatory Clause Score", "Custom"];
const MODEL_STATUSES = ["Draft", "Active", "Pending Review", "Approved", "Archived", "Superseded"];
const RULE_TYPES = ["Checklist Response", "Evidence Verification", "Finding Severity Impact", "CAPA Closure Impact", "Manual Bonus/Penalty", "Critical Cap", "Fail Condition", "Aggregation", "Staleness", "Custom"];
const SCORE_STATUSES = ["Draft", "Calculated", "Input Missing", "Needs Recalculation", "Pending Verification", "Verified", "Adjusted", "Locked", "Failed", "Archived"];
const READINESS_STATUSES = ["Ready", "Warning", "Blocked", "Input Missing", "Review Required"];
const STALE_STATUSES = ["Current", "Stale", "Potentially Stale", "Superseded"];
const SCORE_GRADES = ["A", "B", "C", "D", "F", "Not Determined"];
const ADJUSTMENT_TYPES = ["Override Final Score", "Add Penalty", "Remove Penalty", "Cap Score", "Exclude Item", "Include Item", "Correct Input Mapping"];
const LOCKED_STATUSES = ["Locked", "Archived"];

@Injectable()
export class AuditScoringService {
  constructor(
    private readonly db: SupabaseService,
    private readonly history: AuditScoringHistoryService,
  ) {}

  lookups() {
    return {
      scoringModelTypes: MODEL_TYPES,
      scoringModelStatuses: MODEL_STATUSES,
      scoringRuleTypes: RULE_TYPES,
      scoreStatuses: SCORE_STATUSES,
      scoreReadinessStatuses: READINESS_STATUSES,
      scoreStaleStatuses: STALE_STATUSES,
      scoreGrades: SCORE_GRADES,
      scoreAdjustmentTypes: ADJUSTMENT_TYPES,
      auditTypes,
      auditableModules: auditableModules.map(([key, label]) => ({ key, label })),
      standardOptions,
    };
  }

  async context(user: RequestUser) {
    const [sites, units, areas, users, programs, plans, executions, models, settings] = await Promise.all([
      this.safeRows(this.db.from("Site").select("id,name,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Unit").select("id,name,siteId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Area").select("id,name,siteId,unitId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("User").select("id,name,email,role,department,isActive,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("audit_programs").select("id,program_code,program_title,site_id").eq("company_id", user.tenantId).order("program_title")),
      this.safeRows(this.db.from("audit_plans").select("id,plan_code,plan_title,program_id,site_id").eq("company_id", user.tenantId).order("plan_title")),
      this.safeRows(this.db.from("audit_executions").select("id,execution_code,execution_title,program_id,plan_id,site_id,unit_id,area_id").eq("company_id", user.tenantId).order("updated_at", { ascending: false })),
      this.models(user, { limit: 250 }),
      this.settings(user, user.selectedSiteId ?? null),
    ]);
    return {
      sites: sites.filter((site: Row) => this.canSeeSite(user, site.id)),
      units,
      areas,
      users: users.filter((person: Row) => person.isActive !== false),
      programs: programs.filter((row: Row) => this.canSeeSite(user, row.site_id)),
      plans: plans.filter((row: Row) => this.canSeeSite(user, row.site_id)),
      executions: executions.filter((row: Row) => this.canSeeSite(user, row.site_id)),
      models: models.rows,
      settings,
      lookups: this.lookups(),
    };
  }

  async dashboard(user: RequestUser, query: Row = {}) {
    const register = await this.register(user, { ...query, page: 1, limit: 1000 });
    const rows = register.rows;
    return {
      summary: this.summary(rows),
      bySite: this.group(rows, "site_id"),
      byModule: this.groupFromArray(rows, "score_result_json", "modules"),
      byStandard: this.groupFromArray(rows, "score_result_json", "standards"),
      stale: rows.filter((row: Row) => row.stale_status !== "Current"),
      criticalBlockers: rows.filter((row: Row) => this.arrayValue(row.critical_blockers_json).length > 0),
      recent: rows.slice(0, 12),
      pendingVerification: rows.filter((row: Row) => row.score_status === "Pending Verification"),
      adjusted: rows.filter((row: Row) => row.adjusted_score !== null && row.adjusted_score !== undefined),
      locked: rows.filter((row: Row) => row.score_status === "Locked"),
      lowest: [...rows].filter((row: Row) => row.final_score !== null && row.final_score !== undefined).sort((a: Row, b: Row) => Number(a.final_score) - Number(b.final_score)).slice(0, 8),
      highest: [...rows].filter((row: Row) => row.final_score !== null && row.final_score !== undefined).sort((a: Row, b: Row) => Number(b.final_score) - Number(a.final_score)).slice(0, 8),
      trend: rows.map((row: Row) => ({ date: row.calculated_at ?? row.created_at, score: row.final_score, code: row.score_code })).filter((row: Row) => row.score !== null && row.score !== undefined).reverse(),
    };
  }

  async register(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from("audit_score_runs").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    if (!this.truthy(query.includeArchived)) request = request.is("archived_at", null);
    const scopedSite = query.siteId ?? user.selectedSiteId;
    if (scopedSite) {
      this.assertSite(user, String(scopedSite));
      request = request.eq("site_id", scopedSite);
    } else if (user.selectedSiteId && !user.corporateView) request = request.eq("site_id", user.selectedSiteId);
    for (const [input, column] of Object.entries({
      status: "score_status",
      scoreStatus: "score_status",
      readinessStatus: "readiness_status",
      staleStatus: "stale_status",
      grade: "score_grade",
      sourceObjectType: "source_object_type",
      sourceObjectId: "source_object_id",
      programId: "program_id",
      planId: "plan_id",
      executionId: "execution_id",
      checklistId: "checklist_id",
      findingId: "finding_id",
      capaId: "capa_id",
      unitId: "unit_id",
      areaId: "area_id",
      modelId: "model_id",
    })) if (query[input]) request = request.eq(column, query[input]);
    if (query.search) {
      const search = String(query.search).replace(/[,%()]/g, " ").trim();
      if (search) request = request.or(`score_code.ilike.%${search}%,score_title.ilike.%${search}%,source_object_type.ilike.%${search}%`);
    }
    const sort = String(query.sort ?? "updated_at.desc");
    const [sortColumn, direction] = sort.split(".");
    const { data, count, error } = await request.order(sortColumn || "updated_at", { ascending: direction === "asc" }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const rows = (data ?? []).filter((row: Row) => this.canSeeSite(user, row.site_id));
    return { rows, total: count ?? rows.length, page, limit, summary: this.summary(rows) };
  }

  async detail(user: RequestUser, runId: string) {
    const scoreRun = await this.run(user, runId);
    const [components, ruleResults, inputs, adjustments, verifications, staleness, snapshots, history] = await Promise.all([
      this.childRows("audit_score_components", user, "score_run_id", runId),
      this.childRows("audit_score_rule_results", user, "score_run_id", runId),
      this.childRows("audit_score_input_records", user, "score_run_id", runId),
      this.childRows("audit_score_adjustments", user, "score_run_id", runId),
      this.childRows("audit_score_verification_records", user, "score_run_id", runId),
      this.childRows("audit_score_staleness_events", user, "score_run_id", runId, "detected_at"),
      this.childRows("audit_score_snapshots", user, "score_run_id", runId),
      this.childRows("audit_score_history_events", user, "score_run_id", runId),
    ]);
    return {
      scoreRun,
      components,
      ruleResults,
      inputs,
      adjustments,
      verifications,
      staleness,
      snapshots,
      history,
      readiness: this.readiness(scoreRun, inputs, components, adjustments),
      explainability: this.explainabilityPayload(scoreRun, components, ruleResults),
      traceability: this.traceabilityPayload(scoreRun, inputs, components, ruleResults),
    };
  }

  async createRun(user: RequestUser, dto: Row) {
    const scoped = await this.resolveRunScope(user, dto);
    const model = dto.modelId ? await this.model(user, dto.modelId) : await this.ensureDefaultModel(user, scoped.site_id);
    const code = dto.scoreCode ?? await this.nextCode(user);
    const source = await this.sourceSnapshot(user, scoped.source_object_type, scoped.source_object_id, scoped);
    const settings = await this.settings(user, scoped.site_id);
    const calculated = this.calculateScore(source, model, settings);
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: scoped.site_id,
      unit_id: scoped.unit_id,
      area_id: scoped.area_id,
      program_id: scoped.program_id,
      plan_id: scoped.plan_id,
      execution_id: scoped.execution_id,
      checklist_id: scoped.checklist_id,
      finding_id: scoped.finding_id,
      capa_id: scoped.capa_id,
      model_id: model.id,
      score_code: code,
      score_title: dto.scoreTitle ?? source.title ?? `${this.title(scoped.source_object_type)} compliance score`,
      source_object_type: scoped.source_object_type,
      source_object_id: scoped.source_object_id,
      score_status: calculated.blocked ? "Input Missing" : "Calculated",
      readiness_status: calculated.blocked ? "Input Missing" : calculated.blockers.length ? "Warning" : "Ready",
      stale_status: "Current",
      methodology_version: model.methodology_version,
      methodology_snapshot_json: this.methodologySnapshot(model, settings),
      input_snapshot_json: source,
      calculation_trace_json: calculated.trace,
      score_result_json: calculated.result,
      final_score: calculated.finalScore,
      original_calculated_score: calculated.originalScore,
      score_grade: calculated.grade,
      score_percent: calculated.finalScore,
      max_possible_score: settings.score_scale_max ?? 100,
      points_earned: calculated.pointsEarned,
      points_lost: calculated.pointsLost,
      penalties_total: calculated.penaltiesTotal,
      caps_applied_json: calculated.caps,
      critical_blockers_json: calculated.blockers,
      evidence_impact_json: calculated.evidenceImpact,
      finding_impact_json: calculated.findingImpact,
      capa_impact_json: calculated.capaImpact,
      calculated_by: user.id,
      calculated_at: new Date().toISOString(),
      created_by: user.id,
      updated_at: new Date().toISOString(),
    });
    const run = await this.db.single<Row>(this.db.from("audit_score_runs").insert(payload).select().single());
    await this.replaceCalculationChildren(user, run, model, source, calculated);
    await this.snapshot(user, run, "Calculation", { run, calculated, source, model: this.methodologySnapshot(model, settings) });
    await this.event(user, run, "Score Run Created", "Audit compliance score calculated from backend source records.", null, run);
    return this.detail(user, run.id);
  }

  async recalculate(user: RequestUser, runId: string) {
    const before = await this.run(user, runId);
    this.assertNotLocked(before);
    return this.createRun(user, {
      modelId: before.model_id,
      scoreTitle: before.score_title,
      sourceObjectType: before.source_object_type,
      sourceObjectId: before.source_object_id,
      siteId: before.site_id,
      unitId: before.unit_id,
      areaId: before.area_id,
      programId: before.program_id,
      planId: before.plan_id,
      executionId: before.execution_id,
      checklistId: before.checklist_id,
      findingId: before.finding_id,
      capaId: before.capa_id,
    });
  }

  async transition(user: RequestUser, runId: string, action: string, dto: Row = {}) {
    const before = await this.run(user, runId);
    const now = new Date().toISOString();
    const patch: Row = { updated_at: now };
    let title = "Score Updated";
    if (action === "verify") {
      if (before.score_status === "Input Missing") throw new BadRequestException("Input-missing scores cannot be verified.");
      patch.score_status = "Verified"; patch.verified_by = user.id; patch.verified_at = now; title = "Score Verified";
      await this.db.single(this.db.from("audit_score_verification_records").insert({ company_id: user.tenantId, site_id: before.site_id, score_run_id: runId, verification_status: "Verified", verification_comment: dto.comment ?? null, verified_by: user.id, verified_at: now }).select("id").single());
    } else if (action === "lock") {
      if (before.stale_status !== "Current") throw new BadRequestException("Stale scores cannot be locked as current.");
      if (!["Calculated", "Verified", "Adjusted"].includes(before.score_status)) throw new BadRequestException("Only calculated, verified, or adjusted scores can be locked.");
      patch.score_status = "Locked"; patch.locked_by = user.id; patch.locked_at = now; patch.lock_reason = dto.reason ?? null; title = "Score Locked";
      await this.snapshot(user, before, "Locked", { ...before, lock_reason: patch.lock_reason });
    } else if (action === "unlock") {
      if (!dto.reason) throw new BadRequestException("Unlock requires reason.");
      patch.score_status = "Verified"; patch.locked_by = null; patch.locked_at = null; patch.lock_reason = null; title = "Score Unlocked";
    } else if (action === "archive") {
      patch.score_status = "Archived"; patch.archived_by = user.id; patch.archived_at = now; patch.archive_reason = dto.reason ?? null; title = "Score Archived";
    } else throw new BadRequestException("Unsupported score transition.");
    const after = await this.db.single<Row>(this.db.from("audit_score_runs").update(patch).eq("company_id", user.tenantId).eq("id", runId).select().single());
    await this.event(user, after, title, dto.reason ?? title, before, after);
    return this.detail(user, runId);
  }

  async models(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 50)));
    let request: any = this.db.from("audit_scoring_models").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    if (!this.truthy(query.includeArchived)) request = request.is("archived_at", null);
    if (query.status) request = request.eq("model_status", query.status);
    const scopedSite = query.siteId ?? user.selectedSiteId;
    if (scopedSite) {
      this.assertSite(user, String(scopedSite));
      request = request.or(`site_id.eq.${scopedSite},site_id.is.null`);
    }
    if (query.search) {
      const search = String(query.search).replace(/[,%()]/g, " ").trim();
      if (search) request = request.or(`model_code.ilike.%${search}%,model_title.ilike.%${search}%,model_type.ilike.%${search}%`);
    }
    const { data, count, error } = await request.order("updated_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const rows = (data ?? []).filter((row: Row) => this.canSeeSite(user, row.site_id));
    return { rows, total: count ?? rows.length, page, limit, summary: { total: rows.length, active: rows.filter((r: Row) => r.model_status === "Active").length, draft: rows.filter((r: Row) => r.model_status === "Draft").length } };
  }

  async saveModel(user: RequestUser, dto: Row, modelId?: string) {
    const before = modelId ? await this.model(user, modelId) : null;
    if (!dto.modelTitle && !before) throw new BadRequestException("Scoring model title is required.");
    const siteId = dto.siteId ?? dto.site_id ?? before?.site_id ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      model_code: dto.modelCode ?? dto.model_code ?? before?.model_code ?? await this.nextModelCode(user),
      model_title: dto.modelTitle ?? dto.model_title ?? before?.model_title,
      model_type: dto.modelType ?? dto.model_type ?? before?.model_type ?? "Weighted Compliance",
      description: dto.description ?? before?.description ?? null,
      methodology_version: dto.methodologyVersion ?? dto.methodology_version ?? before?.methodology_version ?? "1.0",
      model_status: dto.modelStatus ?? dto.model_status ?? before?.model_status ?? "Draft",
      effective_date: dto.effectiveDate ?? dto.effective_date ?? before?.effective_date ?? null,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? before?.owner_user_id ?? null,
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id ?? before?.reviewer_user_id ?? null,
      applicable_scope_json: dto.applicableScope ?? dto.applicable_scope_json ?? before?.applicable_scope_json ?? null,
      applicable_audit_types_json: dto.applicableAuditTypes ?? dto.applicable_audit_types_json ?? before?.applicable_audit_types_json ?? null,
      applicable_modules_json: dto.applicableModules ?? dto.applicable_modules_json ?? before?.applicable_modules_json ?? null,
      applicable_standards_json: dto.applicableStandards ?? dto.applicable_standards_json ?? before?.applicable_standards_json ?? null,
      default_model: dto.defaultModel ?? dto.default_model ?? before?.default_model ?? false,
      created_by: before ? before.created_by : user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    const after = modelId
      ? await this.db.single<Row>(this.db.from("audit_scoring_models").update(payload).eq("company_id", user.tenantId).eq("id", modelId).select().single())
      : await this.db.single<Row>(this.db.from("audit_scoring_models").insert(payload).select().single());
    await this.event(user, after, before ? "Scoring Model Updated" : "Scoring Model Created", "Audit scoring model saved.", before, after);
    return this.modelDetail(user, after.id);
  }

  async modelDetail(user: RequestUser, modelId: string) {
    const model = await this.model(user, modelId);
    const rules = await this.rules(user, modelId);
    return { model, rules: rules.rows, history: await this.childRows("audit_score_history_events", user, "model_id", modelId) };
  }

  async modelTransition(user: RequestUser, modelId: string, action: string, dto: Row = {}) {
    const before = await this.model(user, modelId);
    const now = new Date().toISOString();
    const patch: Row = { updated_by: user.id, updated_at: now };
    let title = "Scoring Model Updated";
    if (action === "activate") {
      const rules = await this.rules(user, modelId);
      if (!rules.rows.length) throw new BadRequestException("Active/current scoring model requires at least one scoring rule.");
      patch.model_status = "Active"; patch.approved_by = user.id; patch.approved_at = now; title = "Scoring Model Activated";
    } else if (action === "archive") {
      patch.model_status = "Archived"; patch.archived_by = user.id; patch.archived_at = now; patch.archive_reason = dto.reason ?? null; title = "Scoring Model Archived";
    } else if (action === "create-version") {
      return this.saveModel(user, {
        ...before,
        modelCode: await this.nextModelCode(user),
        modelTitle: `${before.model_title} v${Number.parseInt(String(before.methodology_version ?? "1"), 10) + 1}`,
        methodologyVersion: String(Number(before.methodology_version ?? 1) + 1),
        modelStatus: "Draft",
        defaultModel: false,
      });
    } else throw new BadRequestException("Unsupported scoring model transition.");
    const after = await this.db.single<Row>(this.db.from("audit_scoring_models").update(patch).eq("company_id", user.tenantId).eq("id", modelId).select().single());
    await this.event(user, after, title, dto.reason ?? title, before, after);
    return this.modelDetail(user, modelId);
  }

  async rules(user: RequestUser, modelId: string) {
    const model = await this.model(user, modelId);
    const rows = await this.safeRows(this.db.from("audit_scoring_rules").select("*").eq("company_id", user.tenantId).eq("model_id", model.id).is("archived_at", null).order("rule_order", { ascending: true }));
    return { rows, total: rows.length, page: 1, limit: rows.length, summary: { total: rows.length, active: rows.filter((r: Row) => r.active).length } };
  }

  async saveRule(user: RequestUser, modelId: string, dto: Row, ruleId?: string) {
    const model = await this.model(user, modelId);
    const before = ruleId ? await this.rule(user, modelId, ruleId) : null;
    if (!dto.ruleTitle && !before) throw new BadRequestException("Scoring rule title is required.");
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: model.site_id,
      model_id: model.id,
      rule_code: dto.ruleCode ?? dto.rule_code ?? before?.rule_code ?? `RULE-${Date.now()}`,
      rule_title: dto.ruleTitle ?? dto.rule_title ?? before?.rule_title,
      rule_type: dto.ruleType ?? dto.rule_type ?? before?.rule_type ?? "Checklist Response",
      rule_category: dto.ruleCategory ?? dto.rule_category ?? before?.rule_category ?? "Scoring",
      applies_to: dto.appliesTo ?? dto.applies_to ?? before?.applies_to ?? "Execution",
      rule_order: Number(dto.ruleOrder ?? dto.rule_order ?? before?.rule_order ?? 1),
      weight: dto.weight ?? before?.weight ?? null,
      points: dto.points ?? before?.points ?? null,
      penalty: dto.penalty ?? before?.penalty ?? null,
      multiplier: dto.multiplier ?? before?.multiplier ?? null,
      cap_score: dto.capScore ?? dto.cap_score ?? before?.cap_score ?? null,
      fail_condition: dto.failCondition ?? dto.fail_condition ?? before?.fail_condition ?? false,
      condition_json: dto.condition ?? dto.condition_json ?? before?.condition_json ?? null,
      calculation_json: dto.calculation ?? dto.calculation_json ?? before?.calculation_json ?? {},
      explanation_template: dto.explanationTemplate ?? dto.explanation_template ?? before?.explanation_template ?? null,
      active: dto.active ?? before?.active ?? true,
      created_by: before ? before.created_by : user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    const after = ruleId
      ? await this.db.single<Row>(this.db.from("audit_scoring_rules").update(payload).eq("company_id", user.tenantId).eq("id", ruleId).select().single())
      : await this.db.single<Row>(this.db.from("audit_scoring_rules").insert(payload).select().single());
    await this.event(user, model, before ? "Scoring Rule Updated" : "Scoring Rule Created", "Audit scoring rule saved.", before, after);
    return this.rules(user, modelId);
  }

  async removeRule(user: RequestUser, modelId: string, ruleId: string, dto: Row = {}) {
    const before = await this.rule(user, modelId, ruleId);
    const after = await this.db.single<Row>(this.db.from("audit_scoring_rules").update({ archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason ?? null, active: false }).eq("company_id", user.tenantId).eq("id", ruleId).select().single());
    await this.event(user, after, "Scoring Rule Archived", dto.reason ?? "Scoring rule archived.", before, after);
    return this.rules(user, modelId);
  }

  async reorderRules(user: RequestUser, modelId: string, dto: Row = {}) {
    const ids = Array.isArray(dto.ruleIds) ? dto.ruleIds : [];
    if (!ids.length) throw new BadRequestException("ruleIds array is required.");
    for (let index = 0; index < ids.length; index += 1) {
      await this.db.single(this.db.from("audit_scoring_rules").update({ rule_order: index + 1, updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("model_id", modelId).eq("id", ids[index]).select("id").single());
    }
    await this.event(user, { id: modelId, model_id: modelId }, "Scoring Rules Reordered", "Scoring rule order updated.", null, { ruleIds: ids });
    return this.rules(user, modelId);
  }

  async adjustments(user: RequestUser, runId: string) {
    await this.run(user, runId);
    const rows = await this.childRows("audit_score_adjustments", user, "score_run_id", runId);
    return { rows, total: rows.length, page: 1, limit: rows.length, summary: { total: rows.length, pending: rows.filter((r: Row) => r.adjustment_status === "Pending Approval").length, approved: rows.filter((r: Row) => r.adjustment_status === "Approved").length } };
  }

  async createAdjustment(user: RequestUser, runId: string, dto: Row) {
    const before = await this.run(user, runId);
    this.assertNotLocked(before);
    if (!dto.adjustmentReason && !dto.adjustment_reason) throw new BadRequestException("Manual score adjustment requires reason.");
    const settings = await this.settings(user, before.site_id);
    if (!settings.allow_manual_score_adjustment) throw new ForbiddenException("Manual score adjustment is disabled by scoring settings.");
    const adjusted = Number(dto.adjustedValue ?? dto.adjusted_value ?? dto.adjustmentValue ?? dto.adjustment_value);
    if (Number.isNaN(adjusted)) throw new BadRequestException("Adjusted score value is required.");
    const bounded = Math.min(Number(settings.score_scale_max ?? 100), Math.max(Number(settings.score_scale_min ?? 0), adjusted));
    const adjustment = await this.db.single<Row>(this.db.from("audit_score_adjustments").insert({
      company_id: user.tenantId,
      site_id: before.site_id,
      score_run_id: runId,
      adjustment_type: dto.adjustmentType ?? dto.adjustment_type ?? "Override Final Score",
      adjustment_value: bounded,
      original_value: before.final_score,
      adjusted_value: bounded,
      related_source_module: dto.relatedSourceModule ?? null,
      related_source_record_id: dto.relatedSourceRecordId ?? null,
      adjustment_reason: dto.adjustmentReason ?? dto.adjustment_reason,
      risk_compliance_justification: dto.riskComplianceJustification ?? dto.risk_compliance_justification ?? null,
      approval_required: settings.require_approval_for_manual_adjustment,
      adjustment_status: settings.require_approval_for_manual_adjustment ? "Pending Approval" : "Approved",
      created_by: user.id,
    }).select().single());
    if (!settings.require_approval_for_manual_adjustment) await this.applyAdjustment(user, before, adjustment);
    await this.event(user, before, "Score Adjustment Created", "Manual score adjustment captured with reason.", before, adjustment);
    return this.detail(user, runId);
  }

  async adjustmentTransition(user: RequestUser, runId: string, adjustmentId: string, action: string, dto: Row = {}) {
    const run = await this.run(user, runId);
    const before = await this.adjustment(user, runId, adjustmentId);
    const now = new Date().toISOString();
    let patch: Row;
    let title: string;
    if (action === "approve") {
      patch = { adjustment_status: "Approved", approved_by: user.id, approved_at: now };
      title = "Score Adjustment Approved";
    } else if (action === "reject") {
      if (!dto.reason) throw new BadRequestException("Adjustment rejection requires reason.");
      patch = { adjustment_status: "Rejected", rejected_by: user.id, rejected_at: now, rejection_reason: dto.reason };
      title = "Score Adjustment Rejected";
    } else if (action === "remove") {
      if (!dto.reason) throw new BadRequestException("Adjustment removal requires reason.");
      patch = { adjustment_status: "Removed", removed_by: user.id, removed_at: now, remove_reason: dto.reason };
      title = "Score Adjustment Removed";
    } else throw new BadRequestException("Unsupported score adjustment transition.");
    const after = await this.db.single<Row>(this.db.from("audit_score_adjustments").update(patch).eq("company_id", user.tenantId).eq("score_run_id", runId).eq("id", adjustmentId).select().single());
    if (action === "approve") await this.applyAdjustment(user, run, after);
    await this.event(user, run, title, dto.reason ?? title, before, after);
    return this.detail(user, runId);
  }

  async sourceScopedRegister(user: RequestUser, sourceType: string, sourceId: string, query: Row = {}) {
    const normalized = this.sourceColumn(sourceType);
    if (!normalized) return this.register(user, { ...query, sourceObjectType: sourceType, sourceObjectId: sourceId });
    return this.register(user, { ...query, [normalized.input]: sourceId });
  }

  async sourceRun(user: RequestUser, sourceType: string, sourceId: string, dto: Row = {}) {
    const normalized = this.sourceColumn(sourceType);
    return this.createRun(user, { ...dto, sourceObjectType: sourceType, sourceObjectId: sourceId, ...(normalized ? { [normalized.input]: sourceId } : {}) });
  }

  async scoringImpact(user: RequestUser, sourceType: string, sourceId: string) {
    const related = await this.sourceScopedRegister(user, sourceType, sourceId, { page: 1, limit: 100 });
    const latest = related.rows[0] ?? null;
    return {
      sourceType,
      sourceId,
      latestScore: latest,
      scoreRuns: related.rows,
      impact: latest ? {
        finalScore: latest.final_score,
        grade: latest.score_grade,
        evidenceImpact: latest.evidence_impact_json,
        findingImpact: latest.finding_impact_json,
        capaImpact: latest.capa_impact_json,
        blockers: latest.critical_blockers_json,
      } : null,
      message: latest ? "Score impact is based on backend score runs linked to this source record." : "No backend score run is linked to this source record yet.",
    };
  }

  async settings(user: RequestUser, siteId: string | null = null) {
    if (siteId) this.assertSite(user, siteId);
    const scoped = siteId ?? user.selectedSiteId ?? null;
    let row = scoped ? await this.safeSingle(this.db.from("audit_scoring_settings").select("*").eq("company_id", user.tenantId).eq("site_id", scoped).single()) : null;
    if (!row) row = await this.safeSingle(this.db.from("audit_scoring_settings").select("*").eq("company_id", user.tenantId).is("site_id", null).single());
    if (row) return row;
    return this.db.single<Row>(this.db.from("audit_scoring_settings").insert({ company_id: user.tenantId, site_id: scoped, updated_by: user.id }).select().single());
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? null;
    const before = await this.settings(user, siteId);
    const patch = this.withoutUndefined({
      default_model_id: dto.defaultModelId ?? dto.default_model_id ?? before.default_model_id ?? null,
      score_scale_min: dto.scoreScaleMin ?? dto.score_scale_min ?? before.score_scale_min,
      score_scale_max: dto.scoreScaleMax ?? dto.score_scale_max ?? before.score_scale_max,
      grade_a_min: dto.gradeAMin ?? dto.grade_a_min ?? before.grade_a_min,
      grade_b_min: dto.gradeBMin ?? dto.grade_b_min ?? before.grade_b_min,
      grade_c_min: dto.gradeCMin ?? dto.grade_c_min ?? before.grade_c_min,
      grade_d_min: dto.gradeDMin ?? dto.grade_d_min ?? before.grade_d_min,
      critical_failure_below: dto.criticalFailureBelow ?? dto.critical_failure_below ?? before.critical_failure_below,
      require_evidence_for_full_credit: dto.requireEvidenceForFullCredit ?? dto.require_evidence_for_full_credit ?? before.require_evidence_for_full_credit,
      require_verified_evidence_for_full_credit: dto.requireVerifiedEvidenceForFullCredit ?? dto.require_verified_evidence_for_full_credit ?? before.require_verified_evidence_for_full_credit,
      cap_score_for_open_safety_critical_finding: dto.capScoreForOpenSafetyCriticalFinding ?? dto.cap_score_for_open_safety_critical_finding ?? before.cap_score_for_open_safety_critical_finding,
      safety_critical_cap_score: dto.safetyCriticalCapScore ?? dto.safety_critical_cap_score ?? before.safety_critical_cap_score,
      cap_score_for_open_regulatory_critical_finding: dto.capScoreForOpenRegulatoryCriticalFinding ?? dto.cap_score_for_open_regulatory_critical_finding ?? before.cap_score_for_open_regulatory_critical_finding,
      regulatory_critical_cap_score: dto.regulatoryCriticalCapScore ?? dto.regulatory_critical_cap_score ?? before.regulatory_critical_cap_score,
      require_verified_capa_for_full_recovery: dto.requireVerifiedCapaForFullRecovery ?? dto.require_verified_capa_for_full_recovery ?? before.require_verified_capa_for_full_recovery,
      allow_manual_score_adjustment: dto.allowManualScoreAdjustment ?? dto.allow_manual_score_adjustment ?? before.allow_manual_score_adjustment,
      require_approval_for_manual_adjustment: dto.requireApprovalForManualAdjustment ?? dto.require_approval_for_manual_adjustment ?? before.require_approval_for_manual_adjustment,
      auto_mark_scores_stale_on_source_change: dto.autoMarkScoresStaleOnSourceChange ?? dto.auto_mark_scores_stale_on_source_change ?? before.auto_mark_scores_stale_on_source_change,
      auto_recalculate_on_execution_complete: dto.autoRecalculateOnExecutionComplete ?? dto.auto_recalculate_on_execution_complete ?? before.auto_recalculate_on_execution_complete,
      auto_recalculate_on_evidence_verified: dto.autoRecalculateOnEvidenceVerified ?? dto.auto_recalculate_on_evidence_verified ?? before.auto_recalculate_on_evidence_verified,
      auto_recalculate_on_capa_verified: dto.autoRecalculateOnCapaVerified ?? dto.auto_recalculate_on_capa_verified ?? before.auto_recalculate_on_capa_verified,
      settings_json: dto.settings ?? dto.settings_json ?? before.settings_json ?? null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    const after = await this.db.single<Row>(this.db.from("audit_scoring_settings").update(patch).eq("company_id", user.tenantId).eq("id", before.id).select().single());
    await this.event(user, { id: after.id, site_id: after.site_id }, "Scoring Settings Updated", "Audit scoring settings changed.", before, after);
    return after;
  }

  async globalHistory(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 50)));
    let request: any = this.db.from("audit_score_history_events").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    const scopedSite = query.siteId ?? user.selectedSiteId;
    if (scopedSite) request = request.eq("site_id", scopedSite);
    const { data, count, error } = await request.order("created_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const rows = (data ?? []).filter((row: Row) => this.canSeeSite(user, row.site_id));
    return { rows, total: count ?? rows.length, page, limit, summary: { total: rows.length } };
  }

  async viewFilter(user: RequestUser, view: string, query: Row = {}) {
    const filters: Row = { ...query };
    if (["stale", "pending-verification", "adjusted", "locked"].includes(view)) {
      if (view === "stale") filters.staleStatus = "Stale";
      if (view === "pending-verification") filters.status = "Pending Verification";
      if (view === "locked") filters.status = "Locked";
      if (view === "adjusted") {
        const result = await this.register(user, filters);
        result.rows = result.rows.filter((row: Row) => row.adjusted_score !== null && row.adjusted_score !== undefined);
        return result;
      }
    } else if (view.startsWith("by-")) {
      filters.groupBy = view.replace("by-", "");
    }
    return this.register(user, filters);
  }

  private async replaceCalculationChildren(user: RequestUser, run: Row, model: Row, source: Row, calculated: Row) {
    const componentRows = calculated.components.map((component: Row) => ({ ...component, company_id: user.tenantId, site_id: run.site_id, score_run_id: run.id }));
    const ruleRows = calculated.ruleResults.map((result: Row) => ({ ...result, company_id: user.tenantId, site_id: run.site_id, score_run_id: run.id }));
    const inputRows = source.inputs.map((input: Row) => ({ ...input, company_id: user.tenantId, site_id: input.site_id ?? run.site_id, score_run_id: run.id }));
    if (componentRows.length) await this.db.single(this.db.from("audit_score_components").insert(componentRows).select("id").limit(1).single());
    if (ruleRows.length) await this.db.single(this.db.from("audit_score_rule_results").insert(ruleRows).select("id").limit(1).single());
    if (inputRows.length) await this.db.single(this.db.from("audit_score_input_records").insert(inputRows).select("id").limit(1).single());
    if (!calculated.blockers.length) return;
    for (const blocker of calculated.blockers) {
      await this.db.single(this.db.from("audit_score_staleness_events").insert({ company_id: user.tenantId, site_id: run.site_id, score_run_id: run.id, stale_trigger_type: "Input Readiness", source_module: blocker.sourceModule ?? "Audit Scoring", source_record_id: blocker.sourceRecordId ?? run.source_object_id, stale_reason: blocker.reason ?? blocker.title }).select("id").single());
    }
  }

  private calculateScore(source: Row, model: Row, settings: Row) {
    const maxScore = Number(settings.score_scale_max ?? 100);
    let score = maxScore;
    const trace: Row[] = [];
    const components: Row[] = [];
    const ruleResults: Row[] = [];
    const blockers: Row[] = [];
    const evidenceRows = source.evidence ?? [];
    const findingRows = source.findings ?? [];
    const capaRows = source.capas ?? [];
    const executionRows = source.executions ?? [];
    const missingEvidence = evidenceRows.filter((row: Row) => ["Missing", "Rejected", "Rework Required"].includes(row.evidence_status) || ["Rejected", "Rework Required"].includes(row.review_status));
    const unverifiedEvidence = evidenceRows.filter((row: Row) => !["Verified"].includes(row.review_status) && !["Verified"].includes(row.evidence_status));
    const openFindings = findingRows.filter((row: Row) => !["Closed", "Rejected", "Archived", "Cancelled"].includes(row.finding_status));
    const safetyCritical = openFindings.filter((row: Row) => row.safety_critical || row.criticality === "Safety-Critical");
    const regulatoryCritical = openFindings.filter((row: Row) => row.regulatory_critical || row.criticality === "Regulatory-Critical");
    const openCapas = capaRows.filter((row: Row) => !["Closed", "Completed", "Verified", "Archived", "Cancelled"].includes(row.capa_status ?? row.closure_status));
    const overdueCapas = capaRows.filter((row: Row) => this.isOverdue(row.due_date ?? row.target_due_date) && !["Closed", "Completed", "Verified", "Archived", "Cancelled"].includes(row.capa_status ?? row.closure_status));
    if (!source.inputs.length) blockers.push({ title: "No source inputs", reason: "No execution, evidence, finding, or CAPA source records were found for this score scope.", sourceModule: "Audit Scoring" });
    const evidencePenalty = missingEvidence.length * 8 + (settings.require_verified_evidence_for_full_credit ? unverifiedEvidence.length * 2 : 0);
    const findingPenalty = openFindings.length * 5 + safetyCritical.length * 15 + regulatoryCritical.length * 12;
    const capaPenalty = openCapas.length * 4 + overdueCapas.length * 8;
    const executionPenalty = executionRows.some((row: Row) => !["Completed", "Closed"].includes(row.execution_status)) ? 10 : 0;
    const deductions = [
      ["Evidence impact", evidencePenalty, "Evidence records are missing, rejected, stale, or not verified.", "Evidence"],
      ["Finding impact", findingPenalty, "Open findings reduce compliance score; critical findings add configured impact.", "Finding"],
      ["CAPA impact", capaPenalty, "Open, overdue, or unverified CAPA reduces recovery credit.", "CAPA"],
      ["Execution completion", executionPenalty, "Incomplete audit execution prevents full compliance credit.", "Execution"],
    ];
    for (const [title, penalty, explanation, key] of deductions) {
      score -= Number(penalty);
      trace.push({ title, penalty, explanation, key });
      components.push({
        component_type: "Score Component",
        component_key: key,
        component_title: title,
        max_points: maxScore,
        earned_points: Math.max(0, maxScore - Number(penalty)),
        lost_points: Number(penalty),
        penalty: Number(penalty),
        component_score: Math.max(0, maxScore - Number(penalty)),
        component_grade: this.grade(Math.max(0, maxScore - Number(penalty)), settings),
        component_status: Number(penalty) > 0 ? "Deduction Applied" : "Full Credit",
        explanation,
        trace_json: { penalty, sourceSummary: source.summary },
      });
      ruleResults.push({
        rule_code: String(key).toUpperCase(),
        rule_title: title,
        rule_type: `${key} Scoring`,
        source_module: `Audit ${key}`,
        applied: Number(penalty) > 0,
        penalty_delta: Number(penalty),
        result_status: Number(penalty) > 0 ? "Applied" : "No Impact",
        explanation,
        result_json: { penalty, sourceSummary: source.summary },
      });
    }
    const caps: Row[] = [];
    if (settings.cap_score_for_open_safety_critical_finding && safetyCritical.length) {
      const cap = Number(settings.safety_critical_cap_score ?? 60);
      if (score > cap) { score = cap; caps.push({ type: "Safety-Critical Finding Cap", cap }); }
      blockers.push({ title: "Open safety-critical finding", reason: "Safety-critical finding caps or blocks the score according to scoring settings.", sourceModule: "Audit Finding" });
    }
    if (settings.cap_score_for_open_regulatory_critical_finding && regulatoryCritical.length) {
      const cap = Number(settings.regulatory_critical_cap_score ?? 70);
      if (score > cap) { score = cap; caps.push({ type: "Regulatory-Critical Finding Cap", cap }); }
      blockers.push({ title: "Open regulatory-critical finding", reason: "Regulatory-critical finding caps or blocks the score according to scoring settings.", sourceModule: "Audit Finding" });
    }
    const finalScore = Math.min(maxScore, Math.max(Number(settings.score_scale_min ?? 0), Math.round(score * 100) / 100));
    const blocked = !source.inputs.length;
    return {
      blocked,
      originalScore: blocked ? null : finalScore,
      finalScore: blocked ? null : finalScore,
      grade: blocked ? "Not Determined" : this.grade(finalScore, settings),
      pointsEarned: blocked ? null : finalScore,
      pointsLost: blocked ? null : maxScore - finalScore,
      penaltiesTotal: evidencePenalty + findingPenalty + capaPenalty + executionPenalty,
      caps,
      blockers,
      evidenceImpact: { total: evidenceRows.length, missing: missingEvidence.length, unverified: unverifiedEvidence.length, penalty: evidencePenalty },
      findingImpact: { total: findingRows.length, open: openFindings.length, safetyCritical: safetyCritical.length, regulatoryCritical: regulatoryCritical.length, penalty: findingPenalty },
      capaImpact: { total: capaRows.length, open: openCapas.length, overdue: overdueCapas.length, penalty: capaPenalty },
      trace,
      components,
      ruleResults,
      result: { modules: source.modules, standards: source.standards, summary: source.summary, finalScore, grade: blocked ? "Not Determined" : this.grade(finalScore, settings), caps, blockers },
    };
  }

  private async sourceSnapshot(user: RequestUser, type: string, id: string, scoped: Row) {
    const inputs: Row[] = [];
    const read = async (table: string, filter: Row, module: string, inputType: string) => {
      let request: any = this.db.from(table).select("*").eq("company_id", user.tenantId);
      for (const [column, value] of Object.entries(filter)) if (value) request = request.eq(column, value);
      const rows = await this.safeRows(request.order("updated_at", { ascending: false }).limit(1000));
      for (const row of rows.filter((row: Row) => this.canSeeSite(user, row.site_id))) {
        inputs.push({ input_type: inputType, source_module: module, source_record_id: row.id, source_snapshot_json: row, included: true, restricted: Boolean(row.restricted || row.confidentiality_level === "Restricted"), site_id: row.site_id });
      }
      return rows;
    };
    const exactSource = this.sourceColumn(type);
    const filter = exactSource?.column ? { [exactSource.column]: id } : {};
    const executions = type === "execution" ? await read("audit_executions", { id }, "Audit Execution", "Execution") : await read("audit_executions", filter, "Audit Execution", "Execution");
    const evidence = type === "evidence" ? await read("audit_evidence_records", { id }, "Audit Evidence", "Evidence") : await read("audit_evidence_records", this.linkedFilter(type, id, scoped), "Audit Evidence", "Evidence");
    const findings = type === "finding" ? await read("audit_findings", { id }, "Audit Finding", "Finding") : await read("audit_findings", filter, "Audit Finding", "Finding");
    const capas = type === "capa" ? await read("audit_capa_packages", { id }, "Audit CAPA", "CAPA") : await read("audit_capa_packages", filter, "Audit CAPA", "CAPA");
    const title = executions[0]?.execution_title ?? findings[0]?.finding_title ?? capas[0]?.capa_title ?? evidence[0]?.evidence_title ?? `${this.title(type)} scoring scope`;
    const modules = [...new Set([...executions, ...findings, ...evidence].flatMap((row: Row) => [row.module_key, row.linked_module, row.audit_module]).filter(Boolean))];
    const standards = [...new Set([...executions, ...findings, ...evidence].flatMap((row: Row) => [row.standard_name, row.related_standard, row.primary_standard]).filter(Boolean))];
    return {
      type,
      id,
      title,
      site_id: scoped.site_id ?? executions[0]?.site_id ?? findings[0]?.site_id ?? capas[0]?.site_id ?? evidence[0]?.site_id ?? null,
      inputs,
      executions,
      evidence,
      findings,
      capas,
      modules,
      standards,
      summary: { executions: executions.length, evidence: evidence.length, findings: findings.length, capas: capas.length },
    };
  }

  private linkedFilter(type: string, id: string, scoped: Row) {
    if (type === "site") return { site_id: id };
    if (type === "unit") return { unit_id: id };
    if (type === "area") return { area_id: id };
    if (type === "program") return { program_id: id };
    if (type === "plan") return { plan_id: id };
    if (type === "execution") return { execution_id: id };
    if (type === "checklist") return { checklist_id: id };
    return {
      ...(scoped.site_id ? { site_id: scoped.site_id } : {}),
      ...(scoped.program_id ? { program_id: scoped.program_id } : {}),
      ...(scoped.plan_id ? { plan_id: scoped.plan_id } : {}),
      ...(scoped.execution_id ? { execution_id: scoped.execution_id } : {}),
    };
  }

  private async ensureDefaultModel(user: RequestUser, siteId: string | null) {
    const settings = await this.settings(user, siteId);
    if (settings.default_model_id) return this.model(user, settings.default_model_id);
    let model = await this.safeSingle(this.db.from("audit_scoring_models").select("*").eq("company_id", user.tenantId).eq("model_status", "Active").order("updated_at", { ascending: false }).limit(1).single());
    if (model && this.canSeeSite(user, model.site_id)) return model;
    model = await this.db.single<Row>(this.db.from("audit_scoring_models").insert({
      company_id: user.tenantId,
      site_id: siteId,
      model_code: await this.nextModelCode(user),
      model_title: "Default Evidence-Based Compliance Scoring",
      model_type: "Hybrid PSM Assurance",
      methodology_version: "1.0",
      model_status: "Active",
      default_model: true,
      created_by: user.id,
      updated_by: user.id,
    }).select().single());
    const rules = [
      ["CHECKLIST", "Checklist completion scoring", "Checklist Response", "Checklist"],
      ["EVIDENCE", "Evidence verification scoring", "Evidence Verification", "Evidence"],
      ["FINDING", "Finding severity impact scoring", "Finding Severity Impact", "Finding"],
      ["CAPA", "CAPA closure recovery scoring", "CAPA Closure Impact", "CAPA"],
      ["CRITICAL_CAP", "Critical finding cap rule", "Critical Cap", "Criticality"],
    ];
    await this.db.single(this.db.from("audit_scoring_rules").insert(rules.map(([code, title, type, category], index) => ({
      company_id: user.tenantId,
      site_id: siteId,
      model_id: model.id,
      rule_code: code,
      rule_title: title,
      rule_type: type,
      rule_category: category,
      applies_to: "Audit Score Run",
      rule_order: index + 1,
      weight: 1,
      calculation_json: { backendGenerated: true },
      created_by: user.id,
      updated_by: user.id,
    }))).select("id").limit(1).single());
    return model;
  }

  private async run(user: RequestUser, runId: string) {
    const row = await this.safeSingle(this.db.from("audit_score_runs").select("*").eq("company_id", user.tenantId).eq("id", runId).single());
    if (!row) throw new NotFoundException("Score run not found.");
    if (!this.canSeeSite(user, row.site_id)) throw new ForbiddenException("Score run is outside your site scope.");
    return row;
  }

  private async model(user: RequestUser, modelId: string) {
    const row = await this.safeSingle(this.db.from("audit_scoring_models").select("*").eq("company_id", user.tenantId).eq("id", modelId).single());
    if (!row) throw new NotFoundException("Scoring model not found.");
    if (!this.canSeeSite(user, row.site_id)) throw new ForbiddenException("Scoring model is outside your site scope.");
    return row;
  }

  private async rule(user: RequestUser, modelId: string, ruleId: string) {
    const row = await this.safeSingle(this.db.from("audit_scoring_rules").select("*").eq("company_id", user.tenantId).eq("model_id", modelId).eq("id", ruleId).single());
    if (!row) throw new NotFoundException("Scoring rule not found.");
    if (!this.canSeeSite(user, row.site_id)) throw new ForbiddenException("Scoring rule is outside your site scope.");
    return row;
  }

  private async adjustment(user: RequestUser, runId: string, adjustmentId: string) {
    const row = await this.safeSingle(this.db.from("audit_score_adjustments").select("*").eq("company_id", user.tenantId).eq("score_run_id", runId).eq("id", adjustmentId).single());
    if (!row) throw new NotFoundException("Score adjustment not found.");
    if (!this.canSeeSite(user, row.site_id)) throw new ForbiddenException("Score adjustment is outside your site scope.");
    return row;
  }

  private async applyAdjustment(user: RequestUser, run: Row, adjustment: Row) {
    const settings = await this.settings(user, run.site_id);
    const adjusted = Math.min(Number(settings.score_scale_max ?? 100), Math.max(Number(settings.score_scale_min ?? 0), Number(adjustment.adjusted_value)));
    return this.db.single<Row>(this.db.from("audit_score_runs").update({ adjusted_score: adjusted, final_score: adjusted, score_grade: this.grade(adjusted, settings), score_status: "Adjusted", updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", run.id).select().single());
  }

  private async snapshot(user: RequestUser, run: Row, type: string, snapshot: Row) {
    const hash = Buffer.from(JSON.stringify(snapshot)).toString("base64").slice(0, 48);
    return this.db.single(this.db.from("audit_score_snapshots").insert({ company_id: user.tenantId, site_id: run.site_id, score_run_id: run.id, snapshot_type: type, snapshot_json: snapshot, snapshot_hash: hash, created_by: user.id }).select("id").single());
  }

  private async event(user: RequestUser, row: Row, title: string, description: string, before: Row | null, after: Row | null) {
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      type: title,
      title,
      description,
      siteId: row.site_id,
      unitId: row.unit_id,
      areaId: row.area_id,
      programId: row.program_id,
      planId: row.plan_id,
      executionId: row.execution_id,
      scoreRunId: row.score_run_id ?? row.id,
      modelId: row.model_id ?? row.id,
      before,
      after,
    });
  }

  private async childRows(table: string, user: RequestUser, column: string, value: string, order = "created_at") {
    const rows = await this.safeRows(this.db.from(table).select("*").eq("company_id", user.tenantId).eq(column, value).order(order, { ascending: false }));
    return rows.filter((row: Row) => this.canSeeSite(user, row.site_id));
  }

  private readiness(run: Row, inputs: Row[], components: Row[], adjustments: Row[]) {
    const blockers = this.arrayValue(run.critical_blockers_json);
    return {
      status: run.readiness_status,
      staleStatus: run.stale_status,
      readyToVerify: run.score_status === "Calculated" && run.stale_status === "Current" && !blockers.length,
      readyToLock: ["Calculated", "Verified", "Adjusted"].includes(run.score_status) && run.stale_status === "Current" && !blockers.length,
      blockers,
      warnings: [
        ...(run.stale_status !== "Current" ? [{ title: "Score is stale", reason: run.stale_reason ?? "Source data changed or requires recalculation." }] : []),
        ...(adjustments.some((row) => row.adjustment_status === "Pending Approval") ? [{ title: "Pending adjustment approval", reason: "Manual adjustment requires approval before final lock." }] : []),
      ],
      inputs: inputs.length,
      components: components.length,
    };
  }

  private explainabilityPayload(run: Row, components: Row[], ruleResults: Row[]) {
    return {
      finalScore: run.final_score,
      originalCalculatedScore: run.original_calculated_score,
      adjustedScore: run.adjusted_score,
      grade: run.score_grade,
      topDeductions: components.filter((component) => Number(component.lost_points ?? 0) > 0).sort((a, b) => Number(b.lost_points) - Number(a.lost_points)).slice(0, 10),
      appliedRules: ruleResults.filter((rule) => rule.applied),
      criticalBlockers: this.arrayValue(run.critical_blockers_json),
      capsApplied: this.arrayValue(run.caps_applied_json),
      trace: this.arrayValue(run.calculation_trace_json),
    };
  }

  private traceabilityPayload(run: Row, inputs: Row[], components: Row[], ruleResults: Row[]) {
    return {
      scoreRunId: run.id,
      source: { type: run.source_object_type, id: run.source_object_id },
      methodologyVersion: run.methodology_version,
      inputs,
      components,
      ruleResults,
      snapshots: { methodology: run.methodology_snapshot_json, input: run.input_snapshot_json },
    };
  }

  private summary(rows: Row[]) {
    const scored = rows.filter((row) => row.final_score !== null && row.final_score !== undefined);
    const avg = scored.length ? Math.round(scored.reduce((sum, row) => sum + Number(row.final_score), 0) / scored.length) : null;
    return {
      total: rows.length,
      calculated: rows.filter((row) => row.score_status === "Calculated").length,
      pendingVerification: rows.filter((row) => row.score_status === "Pending Verification").length,
      verified: rows.filter((row) => row.score_status === "Verified").length,
      adjusted: rows.filter((row) => row.adjusted_score !== null && row.adjusted_score !== undefined).length,
      locked: rows.filter((row) => row.score_status === "Locked").length,
      stale: rows.filter((row) => row.stale_status !== "Current").length,
      inputMissing: rows.filter((row) => row.readiness_status === "Input Missing").length,
      blockers: rows.reduce((sum, row) => sum + this.arrayValue(row.critical_blockers_json).length, 0),
      averageScore: avg,
      gradeA: rows.filter((row) => row.score_grade === "A").length,
      gradeB: rows.filter((row) => row.score_grade === "B").length,
      gradeC: rows.filter((row) => row.score_grade === "C").length,
      gradeD: rows.filter((row) => row.score_grade === "D").length,
      gradeF: rows.filter((row) => row.score_grade === "F").length,
    };
  }

  private group(rows: Row[], key: string) {
    const map = new Map<string, Row>();
    for (const row of rows) {
      const value = String(row[key] ?? "Unassigned");
      const current = map.get(value) ?? { key: value, label: value, count: 0, scores: [] };
      current.count += 1;
      if (row.final_score !== null && row.final_score !== undefined) current.scores.push(Number(row.final_score));
      map.set(value, current);
    }
    return [...map.values()].map((row) => ({ ...row, averageScore: row.scores.length ? Math.round(row.scores.reduce((a: number, b: number) => a + b, 0) / row.scores.length) : null, scores: undefined }));
  }

  private groupFromArray(rows: Row[], parent: string, field: string) {
    const expanded: Row[] = [];
    for (const row of rows) for (const value of this.arrayValue(row[parent]?.[field])) expanded.push({ key: value, final_score: row.final_score });
    return this.group(expanded, "key");
  }

  private async resolveRunScope(user: RequestUser, dto: Row) {
    const source_object_type = dto.sourceObjectType ?? dto.source_object_type ?? this.inferSourceType(dto);
    const source_object_id = dto.sourceObjectId ?? dto.source_object_id ?? dto.executionId ?? dto.execution_id ?? dto.planId ?? dto.plan_id ?? dto.programId ?? dto.program_id ?? dto.findingId ?? dto.finding_id ?? dto.capaId ?? dto.capa_id ?? dto.evidenceId ?? dto.evidence_id ?? dto.siteId ?? dto.site_id;
    if (!source_object_type || !source_object_id) throw new BadRequestException("Score run requires source object type and source object id.");
    const site_id = dto.siteId ?? dto.site_id ?? (source_object_type === "site" ? source_object_id : user.selectedSiteId ?? null);
    if (site_id) this.assertSite(user, String(site_id));
    return this.withoutUndefined({
      source_object_type,
      source_object_id,
      site_id,
      unit_id: dto.unitId ?? dto.unit_id ?? (source_object_type === "unit" ? source_object_id : null),
      area_id: dto.areaId ?? dto.area_id ?? (source_object_type === "area" ? source_object_id : null),
      program_id: dto.programId ?? dto.program_id ?? (source_object_type === "program" ? source_object_id : null),
      plan_id: dto.planId ?? dto.plan_id ?? (source_object_type === "plan" ? source_object_id : null),
      execution_id: dto.executionId ?? dto.execution_id ?? (source_object_type === "execution" ? source_object_id : null),
      checklist_id: dto.checklistId ?? dto.checklist_id ?? (source_object_type === "checklist" ? source_object_id : null),
      finding_id: dto.findingId ?? dto.finding_id ?? (source_object_type === "finding" ? source_object_id : null),
      capa_id: dto.capaId ?? dto.capa_id ?? (source_object_type === "capa" ? source_object_id : null),
    });
  }

  private inferSourceType(dto: Row) {
    if (dto.executionId ?? dto.execution_id) return "execution";
    if (dto.planId ?? dto.plan_id) return "plan";
    if (dto.programId ?? dto.program_id) return "program";
    if (dto.checklistId ?? dto.checklist_id) return "checklist";
    if (dto.findingId ?? dto.finding_id) return "finding";
    if (dto.capaId ?? dto.capa_id) return "capa";
    if (dto.evidenceId ?? dto.evidence_id) return "evidence";
    if (dto.unitId ?? dto.unit_id) return "unit";
    if (dto.areaId ?? dto.area_id) return "area";
    if (dto.siteId ?? dto.site_id) return "site";
    return null;
  }

  private sourceColumn(type: string) {
    const map: Record<string, { column: string; input: string }> = {
      site: { column: "site_id", input: "siteId" },
      unit: { column: "unit_id", input: "unitId" },
      area: { column: "area_id", input: "areaId" },
      program: { column: "program_id", input: "programId" },
      plan: { column: "plan_id", input: "planId" },
      execution: { column: "execution_id", input: "executionId" },
      checklist: { column: "checklist_id", input: "checklistId" },
      finding: { column: "finding_id", input: "findingId" },
      capa: { column: "capa_id", input: "capaId" },
    };
    return map[type];
  }

  private methodologySnapshot(model: Row, settings: Row) {
    return {
      modelId: model.id,
      modelCode: model.model_code,
      modelTitle: model.model_title,
      modelType: model.model_type,
      methodologyVersion: model.methodology_version,
      settings,
    };
  }

  private grade(score: number, settings: Row) {
    if (score >= Number(settings.grade_a_min ?? 90)) return "A";
    if (score >= Number(settings.grade_b_min ?? 80)) return "B";
    if (score >= Number(settings.grade_c_min ?? 70)) return "C";
    if (score >= Number(settings.grade_d_min ?? 60)) return "D";
    return "F";
  }

  private assertNotLocked(row: Row) {
    if (LOCKED_STATUSES.includes(row.score_status)) throw new ForbiddenException("Locked/archived score runs are read-only unless unlocked through controlled workflow.");
  }

  private assertSite(user: RequestUser, siteId: string) {
    if (!this.canSeeSite(user, siteId)) throw new ForbiddenException("Selected site is outside your audit scoring scope.");
  }

  private canSeeSite(user: RequestUser, siteId?: string | null) {
    return !siteId || user.isSuperAdmin || user.isCompanyAdmin || user.corporateView || user.siteIds?.includes(siteId) || user.selectedSiteId === siteId || !user.selectedSiteId;
  }

  private async nextCode(user: RequestUser) {
    const count = await this.countRows(user, "audit_score_runs");
    return `AUD-SCORE-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;
  }

  private async nextModelCode(user: RequestUser) {
    const count = await this.countRows(user, "audit_scoring_models");
    return `AUD-SM-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
  }

  private async countRows(user: RequestUser, table: string) {
    const { count } = await this.db.from(table).select("id", { count: "exact", head: true }).eq("company_id", user.tenantId);
    return count ?? 0;
  }

  private title(value: string) {
    return value.split(/[-_ ]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }

  private isOverdue(date?: string | null) {
    return Boolean(date && new Date(date).getTime() < Date.now());
  }

  private truthy(value: unknown) {
    return value === true || value === "true" || value === "1" || value === 1;
  }

  private arrayValue(value: unknown): any[] {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === "object") return Object.values(value as Row).flatMap((item) => Array.isArray(item) ? item : [item]).filter(Boolean);
    return [value];
  }

  private withoutUndefined(row: Row) {
    return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
  }

  private async safeRows(query: any) {
    const { data, error } = await query;
    if (error) return [];
    return data ?? [];
  }

  private async safeSingle(query: any) {
    const { data, error } = await query;
    if (error) return null;
    return data ?? null;
  }
}
