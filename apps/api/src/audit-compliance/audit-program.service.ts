import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';
import { auditableModules } from './audit-compliance.constants';
import { AuditProgramHealthService } from './audit-program-health.service';
import { AuditProgramHistoryService } from './audit-program-history.service';
import { AuditProgramStatusService } from './audit-program-status.service';
import { AuditSettingsService } from './audit-settings.service';

type Row = Record<string, any>;
type Scope = { allowedSiteIds: string[]; selectedSiteId?: string | null; corporateView?: boolean };

@Injectable()
export class AuditProgramService {
  constructor(
    private readonly db: SupabaseService,
    private readonly health: AuditProgramHealthService,
    private readonly status: AuditProgramStatusService,
    private readonly settings: AuditSettingsService,
    private readonly history: AuditProgramHistoryService
  ) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    const [programs, sites, units] = await Promise.all([this.filteredPrograms(user, query), this.lookupSites(user), this.lookupUnits(user)]);
    const included = programs.filter((row) => !row.archived_at);
    const siteIdsWithPrograms = new Set(included.flatMap((row) => [row.site_id, ...(row.scopes ?? []).map((scope: Row) => scope.site_scope_id)].filter(Boolean)));
    const moduleKeys = new Set(included.flatMap((row) => (row.modules ?? []).map((module: Row) => module.module_key)));
    return {
      header: { title: 'Audit / Compliance Assurance', subtitle: 'Audit program coverage, configuration health, and readiness foundation', lastUpdated: new Date().toISOString() },
      summary: this.summaryFromRows(programs, sites, units),
      statusBySite: sites.map((site) => ({
        siteId: site.id,
        siteName: site.name,
        totalPrograms: included.filter((row) => row.site_id === site.id || (row.scopes ?? []).some((scope: Row) => scope.site_scope_id === site.id)).length,
        activePrograms: included.filter((row) => row.program_status === 'Active' && (row.site_id === site.id || (row.scopes ?? []).some((scope: Row) => scope.site_scope_id === site.id))).length,
        reviewOverdue: included.filter((row) => row.program_status === 'Review Overdue' && (row.site_id === site.id || (row.scopes ?? []).some((scope: Row) => scope.site_scope_id === site.id))).length
      })),
      moduleCoverage: auditableModules.map(([moduleKey, moduleName]) => ({
        moduleKey,
        moduleName,
        coveredPrograms: included.filter((row) => (row.modules ?? []).some((module: Row) => module.module_key === moduleKey)).length,
        covered: moduleKeys.has(moduleKey)
      })),
      standardCoverage: Object.entries(this.countBy(included.flatMap((row) => row.standards ?? []), 'standard_name')).map(([standardName, count]) => ({ standardName, count })),
      programsRequiringReview: included.filter((row) => ['Pending Review', 'Review Overdue'].includes(row.program_status)).slice(0, 12),
      configurationGaps: included.filter((row) => row.configuration_health !== 'Complete').slice(0, 12),
      siteCoverageGaps: sites.filter((site) => !siteIdsWithPrograms.has(site.id)).map((site) => ({ siteId: site.id, siteName: site.name, reason: 'No audit program in current scope' })),
      moduleCoverageGaps: auditableModules.filter(([moduleKey]) => !moduleKeys.has(moduleKey)).map(([moduleKey, moduleName]) => ({ moduleKey, moduleName, reason: 'No audit coverage configured' })),
      recentlyCreatedPrograms: [...programs].sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? '')).slice(0, 8),
      recentlyUpdatedPrograms: [...programs].sort((a, b) => Date.parse(b.updated_at ?? '') - Date.parse(a.updated_at ?? '')).slice(0, 8),
      safetyCriticalPreview: included.filter((row) => ['Safety-Critical', 'Critical', 'PSM-Critical'].includes(row.criticality)).slice(0, 8),
      regulatoryCriticalPreview: included.filter((row) => row.criticality === 'Regulatory-Critical').slice(0, 8),
      readyForScheduling: included.filter((row) => row.ready_for_scheduling)
    };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    return this.summaryFromRows(await this.filteredPrograms(user, query), await this.lookupSites(user), await this.lookupUnits(user));
  }

  async register(user: RequestUser, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const allRows = await this.filteredPrograms(user, query);
    const sorted = this.sortRows(allRows, String(query.sort ?? 'updated_at.desc'));
    return {
      rows: sorted.slice((page - 1) * limit, page * limit),
      page,
      limit,
      total: sorted.length,
      summary: this.summaryFromRows(sorted, await this.lookupSites(user), await this.lookupUnits(user)),
      savedViews: ['All Programs', 'Active', 'Draft', 'Review Overdue', 'Missing Configuration', 'Safety-Critical', 'Regulatory-Critical', 'Ready For Scheduling', 'Archived'],
      lastUpdated: new Date().toISOString()
    };
  }

  async create(user: RequestUser, dto: Row) {
    const payload = await this.programPayload(user, dto, true);
    const inserted = await this.db.single<Row>(this.db.from('audit_programs').insert(payload).select().single());
    await this.applyChildPayloads(user, inserted.id, dto);
    await this.recalculateHealth(user, inserted.id);
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId: inserted.id, siteId: inserted.site_id, type: 'Created', title: 'Audit program created', before: null, after: inserted });
    return this.detail(user, inserted.id);
  }

  async update(user: RequestUser, programId: string, dto: Row) {
    const before = await this.assertProgram(user, programId);
    if (before.archived_at) throw new BadRequestException('Archived audit programs are read-only until reactivated.');
    const payload = await this.programPayload(user, dto, false);
    const updated = await this.db.single<Row>(this.db.from('audit_programs').update(payload).eq('company_id', user.tenantId).eq('id', programId).select().single());
    await this.applyChildPayloads(user, programId, dto);
    await this.recalculateHealth(user, programId);
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId, siteId: updated.site_id, type: 'Updated', title: 'Audit program updated', before, after: updated });
    return this.detail(user, programId);
  }

  async activate(user: RequestUser, programId: string) {
    const before = await this.assertProgram(user, programId);
    const health = await this.recalculateHealth(user, programId);
    if (health.missing.length) throw new BadRequestException(`Program cannot be activated: ${health.missing.join(', ')}`);
    const after = await this.db.single<Row>(this.db.from('audit_programs').update({ program_status: 'Active', configuration_health: 'Complete', ready_for_scheduling: true, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', programId).select().single());
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId, siteId: after.site_id, type: 'Activated', title: 'Audit program activated', before, after });
    return this.detail(user, programId);
  }

  async archive(user: RequestUser, programId: string, dto: Row) {
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive reason is required.');
    const before = await this.assertProgram(user, programId);
    const after = await this.db.single<Row>(this.db.from('audit_programs').update({ program_status: 'Archived', archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason, ready_for_scheduling: false, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', programId).select().single());
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId, siteId: after.site_id, type: 'Archived', title: 'Audit program archived', before, after });
    return this.detail(user, programId);
  }

  async reactivate(user: RequestUser, programId: string) {
    const before = await this.assertProgram(user, programId);
    const health = await this.recalculateHealth(user, programId);
    if (health.missing.length) throw new BadRequestException(`Program cannot be reactivated: ${health.missing.join(', ')}`);
    const after = await this.db.single<Row>(this.db.from('audit_programs').update({ program_status: 'Active', archived_at: null, archived_by: null, archive_reason: null, ready_for_scheduling: true, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', programId).select().single());
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId, siteId: after.site_id, type: 'Reactivated', title: 'Audit program reactivated', before, after });
    return this.detail(user, programId);
  }

  async submitReview(user: RequestUser, programId: string) {
    const before = await this.assertProgram(user, programId);
    const record = await this.db.single<Row>(this.db.from('audit_program_review_records').insert({
      id: crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: before.site_id ?? null,
      program_id: programId,
      review_status: 'Pending Review',
      submitted_by: user.id,
      submitted_at: new Date().toISOString()
    }).select().single());
    await this.db.single(this.db.from('audit_programs').update({ program_status: 'Pending Review', updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', programId).select('id').single());
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId, siteId: before.site_id, type: 'Submitted', title: 'Audit program submitted for review', before, after: record });
    return this.detail(user, programId);
  }

  async detail(user: RequestUser, programId: string) {
    const program = await this.assertProgram(user, programId);
    const [scopes, standards, modules, frequency, integrationSettings, reviews, history] = await Promise.all([
      this.scopeRows(user, programId),
      this.standardRows(user, programId),
      this.moduleRows(user, programId),
      this.frequency(user, programId),
      this.integrationSettings(user, programId),
      this.safeMany(this.db.from('audit_program_review_records').select('*').eq('company_id', user.tenantId).eq('program_id', programId).order('created_at', { ascending: false })),
      this.historyRows(user, { programId, limit: 50 })
    ]);
    return {
      program,
      header: { title: program.program_title, code: program.program_code, status: program.program_status, criticality: program.criticality, health: program.configuration_health, readOnly: Boolean(program.archived_at) },
      overview: this.overviewCards(program, scopes, standards, modules, frequency),
      scopes,
      standards,
      modules,
      frequency,
      integrationSettings,
      reviews,
      history: history.rows,
      tabs: ['Overview', 'Scope', 'Standards / Regulations', 'Modules Covered', 'Frequency / Review Cycle', 'Ownership / Governance', 'Integration Settings', 'Future Audit Plans', 'Future Findings', 'History']
    };
  }

  async scopeRows(user: RequestUser, programId: string) {
    await this.assertProgram(user, programId);
    return this.safeMany<Row>(this.db.from('audit_program_scopes').select('*').eq('company_id', user.tenantId).eq('program_id', programId).is('removed_at', null).order('created_at'));
  }

  async saveScope(user: RequestUser, programId: string, dto: Row, scopeId?: string) {
    const program = await this.assertEditableProgram(user, programId);
    const row = {
      id: scopeId ?? crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: program.site_id ?? dto.siteId ?? dto.site_id ?? null,
      program_id: programId,
      scope_type: dto.scopeType ?? dto.scope_type ?? 'Site-wide',
      site_scope_id: this.allowedSite(user, dto.siteScopeId ?? dto.site_scope_id ?? program.site_id ?? null),
      unit_id: dto.unitId ?? dto.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? null,
      department_id: dto.departmentId ?? dto.department_id ?? null,
      equipment_id: dto.equipmentId ?? dto.equipment_id ?? null,
      process_system: dto.processSystem ?? dto.process_system ?? null,
      worker_role_scope: dto.workerRoleScope ?? dto.worker_role_scope ?? null,
      contractor_company_id: dto.contractorCompanyId ?? dto.contractor_company_id ?? null,
      scope_description: dto.scopeDescription ?? dto.scope_description ?? null,
      exclusions: dto.exclusions ?? null,
      scope_justification: dto.scopeJustification ?? dto.scope_justification ?? null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const saved = await this.db.single<Row>(this.db.from('audit_program_scopes').upsert(row).select().single());
    await this.recalculateHealth(user, programId);
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId, siteId: row.site_id, unitId: row.unit_id, areaId: row.area_id, type: scopeId ? 'Scope Updated' : 'Scope Added', title: 'Audit program scope changed', after: saved });
    return this.scopeRows(user, programId);
  }

  async removeScope(user: RequestUser, programId: string, scopeId: string, dto: Row = {}) {
    await this.assertEditableProgram(user, programId);
    const before = await this.db.single<Row>(this.db.from('audit_program_scopes').select('*').eq('company_id', user.tenantId).eq('program_id', programId).eq('id', scopeId).single());
    await this.db.single(this.db.from('audit_program_scopes').update({ removed_at: new Date().toISOString(), removed_by: user.id, remove_reason: dto.reason ?? 'Removed from audit program scope' }).eq('company_id', user.tenantId).eq('id', scopeId).select('id').single());
    await this.recalculateHealth(user, programId);
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId, siteId: before.site_id, type: 'Scope Removed', title: 'Audit program scope removed', before });
    return this.scopeRows(user, programId);
  }

  async standardRows(user: RequestUser, programId: string) {
    await this.assertProgram(user, programId);
    return this.safeMany<Row>(this.db.from('audit_program_standards').select('*').eq('company_id', user.tenantId).eq('program_id', programId).is('removed_at', null).order('created_at'));
  }

  async saveStandard(user: RequestUser, programId: string, dto: Row, standardId?: string) {
    const program = await this.assertEditableProgram(user, programId);
    const row = {
      id: standardId ?? crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: program.site_id ?? null,
      program_id: programId,
      standard_name: dto.standardName ?? dto.standard_name,
      jurisdiction: dto.jurisdiction ?? null,
      clause_reference: dto.clauseReference ?? dto.clause_reference ?? null,
      requirement_category: dto.requirementCategory ?? dto.requirement_category ?? null,
      applicability: dto.applicability ?? null,
      mandatory: dto.mandatory ?? true,
      evidence_expectation: dto.evidenceExpectation ?? dto.evidence_expectation ?? null,
      regulatory_register_id: dto.regulatoryRegisterId ?? dto.regulatory_register_id ?? null,
      notes: dto.notes ?? null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (!row.standard_name) throw new BadRequestException('Standard/regulation name is required.');
    const saved = await this.db.single<Row>(this.db.from('audit_program_standards').upsert(row).select().single());
    await this.recalculateHealth(user, programId);
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId, siteId: row.site_id, type: standardId ? 'Standard Updated' : 'Standard Added', title: 'Audit standard/regulation reference changed', after: saved });
    return this.standardRows(user, programId);
  }

  async removeStandard(user: RequestUser, programId: string, standardId: string, dto: Row = {}) {
    const program = await this.assertEditableProgram(user, programId);
    await this.db.single(this.db.from('audit_program_standards').update({ removed_at: new Date().toISOString(), removed_by: user.id, remove_reason: dto.reason ?? 'Removed from audit program standards' }).eq('company_id', user.tenantId).eq('program_id', programId).eq('id', standardId).select('id').single());
    await this.recalculateHealth(user, programId);
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId, siteId: program.site_id, type: 'Standard Removed', title: 'Audit standard/regulation reference removed' });
    return this.standardRows(user, programId);
  }

  async moduleRows(user: RequestUser, programId: string) {
    await this.assertProgram(user, programId);
    return this.safeMany<Row>(this.db.from('audit_program_modules').select('*').eq('company_id', user.tenantId).eq('program_id', programId).is('removed_at', null).order('created_at'));
  }

  async saveModule(user: RequestUser, programId: string, dto: Row, moduleId?: string) {
    const program = await this.assertEditableProgram(user, programId);
    const moduleKey = dto.moduleKey ?? dto.module_key;
    const knownModule = auditableModules.find(([key]) => key === moduleKey);
    const row = {
      id: moduleId ?? crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: program.site_id ?? null,
      program_id: programId,
      module_key: moduleKey,
      module_name: dto.moduleName ?? dto.module_name ?? knownModule?.[1] ?? moduleKey,
      coverage_level: dto.coverageLevel ?? dto.coverage_level ?? 'Full',
      coverage_reason: dto.coverageReason ?? dto.coverage_reason ?? null,
      evidence_source: dto.evidenceSource ?? dto.evidence_source ?? null,
      required: dto.required ?? true,
      integration_enabled: dto.integrationEnabled ?? dto.integration_enabled ?? true,
      notes: dto.notes ?? null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (!row.module_key) throw new BadRequestException('Module covered is required.');
    const saved = await this.db.single<Row>(this.db.from('audit_program_modules').upsert(row).select().single());
    await this.recalculateHealth(user, programId);
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId, siteId: row.site_id, type: moduleId ? 'Module Coverage Updated' : 'Module Coverage Added', title: 'Audit module coverage changed', after: saved });
    return this.moduleRows(user, programId);
  }

  async removeModule(user: RequestUser, programId: string, moduleId: string, dto: Row = {}) {
    const program = await this.assertEditableProgram(user, programId);
    await this.db.single(this.db.from('audit_program_modules').update({ removed_at: new Date().toISOString(), removed_by: user.id, remove_reason: dto.reason ?? 'Removed from covered modules' }).eq('company_id', user.tenantId).eq('program_id', programId).eq('id', moduleId).select('id').single());
    await this.recalculateHealth(user, programId);
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId, siteId: program.site_id, type: 'Module Coverage Removed', title: 'Audit module coverage removed' });
    return this.moduleRows(user, programId);
  }

  async frequency(user: RequestUser, programId: string) {
    await this.assertProgram(user, programId);
    return this.db.single<Row>(this.db.from('audit_program_frequency_rules').select('*').eq('company_id', user.tenantId).eq('program_id', programId).maybeSingle()).catch(() => null);
  }

  async saveFrequency(user: RequestUser, programId: string, dto: Row) {
    const program = await this.assertEditableProgram(user, programId);
    const before = await this.frequency(user, programId);
    const row = {
      id: before?.id ?? crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: program.site_id ?? null,
      program_id: programId,
      audit_frequency: dto.auditFrequency ?? dto.audit_frequency,
      frequency_interval: dto.frequencyInterval ?? dto.frequency_interval ?? null,
      planned_start_month: dto.plannedStartMonth ?? dto.planned_start_month ?? null,
      next_planned_audit_date: dto.nextPlannedAuditDate ?? dto.next_planned_audit_date ?? null,
      review_frequency: dto.reviewFrequency ?? dto.review_frequency ?? null,
      next_program_review_due: dto.nextProgramReviewDue ?? dto.next_program_review_due ?? null,
      audit_duration_estimate_days: dto.auditDurationEstimateDays ?? dto.audit_duration_estimate_days ?? null,
      grace_period_days: dto.gracePeriodDays ?? dto.grace_period_days ?? null,
      overdue_escalation_rule_json: dto.overdueEscalationRuleJson ?? dto.overdue_escalation_rule_json ?? null,
      notes: dto.notes ?? null,
      created_at: before?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (!row.audit_frequency) throw new BadRequestException('Audit frequency is required.');
    const saved = await this.db.single<Row>(this.db.from('audit_program_frequency_rules').upsert(row).select().single());
    await this.db.single(this.db.from('audit_programs').update({ next_review_due: row.next_program_review_due, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', programId).select('id').single());
    await this.recalculateHealth(user, programId);
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId, siteId: program.site_id, type: 'Frequency Updated', title: 'Audit frequency/review cycle changed', before, after: saved });
    return saved;
  }

  async integrationSettings(user: RequestUser, programId: string) {
    await this.assertProgram(user, programId);
    return this.db.single<Row>(this.db.from('audit_program_integration_settings').select('*').eq('company_id', user.tenantId).eq('program_id', programId).maybeSingle()).catch(() => null);
  }

  async saveIntegrationSettings(user: RequestUser, programId: string, dto: Row) {
    const program = await this.assertEditableProgram(user, programId);
    const before = await this.integrationSettings(user, programId);
    const row = {
      id: before?.id ?? crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: program.site_id ?? null,
      program_id: programId,
      create_audit_plans_enabled: dto.createAuditPlansEnabled ?? dto.create_audit_plans_enabled ?? true,
      checklist_builder_enabled: dto.checklistBuilderEnabled ?? dto.checklist_builder_enabled ?? true,
      generate_findings_enabled: dto.generateFindingsEnabled ?? dto.generate_findings_enabled ?? true,
      create_actions_for_findings_enabled: dto.createActionsForFindingsEnabled ?? dto.create_actions_for_findings_enabled ?? true,
      link_evidence_from_document_control_enabled: dto.linkEvidenceFromDocumentControlEnabled ?? dto.link_evidence_from_document_control_enabled ?? true,
      link_findings_to_modules_enabled: dto.linkFindingsToModulesEnabled ?? dto.link_findings_to_modules_enabled ?? true,
      include_in_executive_kpi: dto.includeInExecutiveKpi ?? dto.include_in_executive_kpi ?? true,
      include_in_compliance_scoring: dto.includeInComplianceScoring ?? dto.include_in_compliance_scoring ?? true,
      notification_settings_json: dto.notificationSettingsJson ?? dto.notification_settings_json ?? null,
      report_settings_json: dto.reportSettingsJson ?? dto.report_settings_json ?? null,
      settings_json: dto.settingsJson ?? dto.settings_json ?? null,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
    const saved = await this.db.single<Row>(this.db.from('audit_program_integration_settings').upsert(row).select().single());
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, programId, siteId: program.site_id, type: 'Integration Settings Updated', title: 'Audit integration settings changed', before, after: saved });
    return saved;
  }

  async calculateHealth(user: RequestUser, programId: string) {
    return this.recalculateHealth(user, programId);
  }

  async historyRows(user: RequestUser, query: Row = {}) {
    let request: any = this.db.from('audit_program_history_events').select('*').eq('company_id', user.tenantId).order('created_at', { ascending: false });
    if (query.programId) request = request.eq('program_id', query.programId);
    if (query.siteId) request = request.eq('site_id', query.siteId);
    const limit = Math.min(Math.max(Number(query.limit ?? 100), 1), 500);
    const rows = await this.safeMany<Row>(request.limit(limit));
    return { rows, total: rows.length, lastUpdated: new Date().toISOString() };
  }

  async context(user: RequestUser) {
    const [sites, units, areas, departments, users, settings] = await Promise.all([
      this.lookupSites(user),
      this.lookupUnits(user),
      this.safeMany<Row>(this.db.from('Area').select('id,name,code,siteId,unitId').eq('tenantId', user.tenantId).order('name')),
      this.safeMany<Row>(this.db.from('Department').select('id,name,code,siteId').eq('tenantId', user.tenantId).order('name')),
      this.safeMany<Row>(this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', user.tenantId).order('displayName').limit(200)),
      this.settings.get(user)
    ]);
    return { sites, units, areas, departments, users, settings };
  }

  async scopedProgramsForRoute(user: RequestUser, query: Row) {
    return this.register(user, query);
  }

  private async filteredPrograms(user: RequestUser, query: Row = {}): Promise<Row[]> {
    let request: any = this.baseProgramQuery(user);
    const siteFilter = query.siteId ?? user.selectedSiteId ?? null;
    if (siteFilter) request = request.or(`site_id.eq.${siteFilter},site_id.is.null`);
    if (query.auditType) request = request.eq('audit_type', query.auditType);
    if (query.programCategory) request = request.eq('program_category', query.programCategory);
    if (query.programStatus) request = request.eq('program_status', query.programStatus);
    if (query.criticality) request = request.eq('criticality', query.criticality);
    if (query.owner) request = request.eq('owner_user_id', query.owner);
    if (query.reviewer) request = request.eq('reviewer_user_id', query.reviewer);
    if (query.search) request = request.or(`program_title.ilike.%${query.search}%,program_code.ilike.%${query.search}%`);
    const rows = await this.safeMany<Row>(request);
    const enriched = await Promise.all(rows.map((row) => this.enrichProgram(user, row)));
    return enriched.filter((row) => this.matchesDerivedFilters(row, query));
  }

  private async enrichProgram(user: RequestUser, program: Row): Promise<Row> {
    const [scopes, standards, modules, frequency, owner, reviewer] = await Promise.all([
      this.safeMany<Row>(this.db.from('audit_program_scopes').select('*').eq('company_id', user.tenantId).eq('program_id', program.id).is('removed_at', null)),
      this.safeMany<Row>(this.db.from('audit_program_standards').select('*').eq('company_id', user.tenantId).eq('program_id', program.id).is('removed_at', null)),
      this.safeMany<Row>(this.db.from('audit_program_modules').select('*').eq('company_id', user.tenantId).eq('program_id', program.id).is('removed_at', null)),
      this.db.single<Row>(this.db.from('audit_program_frequency_rules').select('*').eq('company_id', user.tenantId).eq('program_id', program.id).maybeSingle()).catch(() => null),
      program.owner_user_id ? this.db.single<Row>(this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', user.tenantId).eq('id', program.owner_user_id).maybeSingle()).catch(() => null) : null,
      program.reviewer_user_id ? this.db.single<Row>(this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', user.tenantId).eq('id', program.reviewer_user_id).maybeSingle()).catch(() => null) : null
    ]);
    return { ...program, scopes, standards, modules, frequency, owner, reviewer };
  }

  private baseProgramQuery(user: RequestUser) {
    const request: any = this.db.from('audit_programs').select('*').eq('company_id', user.tenantId);
    if (!user.corporateView && user.siteIds.length) return request.or(`site_id.in.(${user.siteIds.join(',')}),site_id.is.null`);
    return request;
  }

  private async programPayload(user: RequestUser, dto: Row, create: boolean) {
    const siteId = this.allowedSite(user, dto.siteId ?? dto.site_id ?? null);
    const code = String(dto.programCode ?? dto.program_code ?? '').trim();
    const title = String(dto.programTitle ?? dto.program_title ?? '').trim();
    if (!title) throw new BadRequestException('Program title is required.');
    if (!code) throw new BadRequestException('Program code is required.');
    if (!dto.auditType && !dto.audit_type) throw new BadRequestException('Audit type is required.');
    if (!dto.programCategory && !dto.program_category) throw new BadRequestException('Program category is required.');
    if (!dto.criticality) throw new BadRequestException('Criticality is required.');
    if (!siteId && !user.corporateView && !user.isCompanyAdmin && !user.isSuperAdmin) throw new ForbiddenException('Company-wide audit program creation requires elevated permission.');
    await this.ensureUniqueCode(user, code, siteId, create ? null : dto.id ?? null);
    return this.compact({
      ...(create ? { id: crypto.randomUUID(), created_by: user.id, created_at: new Date().toISOString() } : {}),
      company_id: user.tenantId,
      site_id: siteId,
      program_code: code,
      program_title: title,
      description: dto.description ?? null,
      audit_type: dto.auditType ?? dto.audit_type,
      program_category: dto.programCategory ?? dto.program_category,
      criticality: dto.criticality,
      program_status: dto.programStatus ?? dto.program_status ?? (create ? 'Draft' : undefined),
      effective_date: dto.effectiveDate ?? dto.effective_date ?? null,
      program_objective: dto.programObjective ?? dto.program_objective ?? null,
      notes: dto.notes ?? null,
      owner_user_id: await this.validateUser(user, dto.ownerUserId ?? dto.owner_user_id ?? null, 'Owner'),
      reviewer_user_id: await this.validateUser(user, dto.reviewerUserId ?? dto.reviewer_user_id ?? null, 'Reviewer'),
      approval_owner_user_id: await this.validateUser(user, dto.approvalOwnerUserId ?? dto.approval_owner_user_id ?? null, 'Approval owner'),
      audit_lead_role: dto.auditLeadRole ?? dto.audit_lead_role ?? null,
      responsible_department_id: dto.responsibleDepartmentId ?? dto.responsible_department_id ?? null,
      escalation_owner_user_id: await this.validateUser(user, dto.escalationOwnerUserId ?? dto.escalation_owner_user_id ?? null, 'Escalation owner'),
      next_review_due: dto.nextReviewDue ?? dto.next_review_due ?? null,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    });
  }

  private async applyChildPayloads(user: RequestUser, programId: string, dto: Row) {
    if (Array.isArray(dto.scopes)) for (const scope of dto.scopes) await this.saveScope(user, programId, scope, scope.id);
    if (Array.isArray(dto.standards)) for (const standard of dto.standards) await this.saveStandard(user, programId, standard, standard.id);
    if (Array.isArray(dto.modules)) for (const module of dto.modules) await this.saveModule(user, programId, module, module.id);
    if (dto.frequency) await this.saveFrequency(user, programId, dto.frequency);
    if (dto.integrationSettings) await this.saveIntegrationSettings(user, programId, dto.integrationSettings);
  }

  private async recalculateHealth(user: RequestUser, programId: string) {
    const program = await this.assertProgram(user, programId);
    const settings = await this.settings.get(user, program.site_id);
    const result = this.health.calculate({
      program,
      scopes: await this.scopeRows(user, programId),
      standards: await this.standardRows(user, programId),
      modules: await this.moduleRows(user, programId),
      frequency: await this.frequency(user, programId),
      settings
    });
    const nextStatus = this.status.nextStatus({ current: program.program_status, health: result.health, archivedAt: program.archived_at, nextReviewDue: program.next_review_due });
    await this.db.single(this.db.from('audit_programs').update({ configuration_health: result.health, ready_for_scheduling: result.readyForScheduling, program_status: nextStatus, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', programId).select('id').single()).catch(() => null);
    return result;
  }

  private async assertProgram(user: RequestUser, programId: string) {
    const program = await this.db.single<Row>(this.baseProgramQuery(user).eq('id', programId).maybeSingle()).catch(() => null);
    if (!program) throw new NotFoundException('Audit program was not found in your company/site scope.');
    return program;
  }

  private async assertEditableProgram(user: RequestUser, programId: string) {
    const program = await this.assertProgram(user, programId);
    if (program.archived_at || program.program_status === 'Archived') throw new BadRequestException('Archived audit programs are read-only until reactivated.');
    return program;
  }

  private allowedSite(user: RequestUser, siteId?: string | null) {
    if (!siteId) return null;
    if (user.corporateView || user.isCompanyAdmin || user.isSuperAdmin || user.siteIds.includes(siteId)) return siteId;
    throw new ForbiddenException('Selected site is outside your allowed site scope.');
  }

  private async validateUser(user: RequestUser, userId: string | null, label: string) {
    if (!userId) return null;
    const found = await this.db.single<Row>(this.db.from('User').select('id,status,tenantId').eq('tenantId', user.tenantId).eq('id', userId).maybeSingle()).catch(() => null);
    if (!found) throw new BadRequestException(`${label} must be a valid user in this company.`);
    if (String(found.status).toUpperCase() !== 'ACTIVE') throw new BadRequestException(`${label} must be active.`);
    return userId;
  }

  private async ensureUniqueCode(user: RequestUser, code: string, siteId: string | null, excludeId: string | null) {
    let request: any = this.db.from('audit_programs').select('id').eq('company_id', user.tenantId).eq('program_code', code);
    request = siteId ? request.eq('site_id', siteId) : request.is('site_id', null);
    const existing = await this.db.single<Row>(request.limit(1).maybeSingle()).catch(() => null);
    if (existing?.id && existing.id !== excludeId) throw new BadRequestException('Program code must be unique within the company/site scope.');
  }

  private summaryFromRows(rows: Row[], sites: Row[], units: Row[]) {
    const activeRows = rows.filter((row) => !row.archived_at);
    const coveredSiteIds = new Set(activeRows.flatMap((row) => [row.site_id, ...(row.scopes ?? []).map((scope: Row) => scope.site_scope_id)].filter(Boolean)));
    const coveredUnitIds = new Set(activeRows.flatMap((row) => (row.scopes ?? []).map((scope: Row) => scope.unit_id).filter(Boolean)));
    const moduleKeys = new Set(activeRows.flatMap((row) => (row.modules ?? []).map((module: Row) => module.module_key)));
    return {
      totalPrograms: rows.length,
      totalAuditPrograms: rows.length,
      activePrograms: rows.filter((row) => row.program_status === 'Active').length,
      draftPrograms: rows.filter((row) => row.program_status === 'Draft').length,
      inactivePrograms: rows.filter((row) => row.program_status === 'Inactive').length,
      archivedPrograms: rows.filter((row) => row.program_status === 'Archived' || row.archived_at).length,
      programsPendingReview: rows.filter((row) => row.program_status === 'Pending Review').length,
      programsReviewOverdue: rows.filter((row) => row.program_status === 'Review Overdue').length,
      programsMissingOwner: rows.filter((row) => !row.owner_user_id).length,
      programsMissingScope: rows.filter((row) => !(row.scopes ?? []).length).length,
      programsMissingStandards: rows.filter((row) => !(row.standards ?? []).length).length,
      programsMissingFrequency: rows.filter((row) => !row.frequency?.audit_frequency).length,
      sitesCovered: coveredSiteIds.size,
      sitesWithoutAuditProgram: sites.filter((site) => !coveredSiteIds.has(site.id)).length,
      unitsCovered: coveredUnitIds.size,
      unitsWithoutAuditProgram: units.filter((unit) => !coveredUnitIds.has(unit.id)).length,
      psmModulesCovered: moduleKeys.size,
      psmModulesWithoutAuditCoverage: auditableModules.length - moduleKeys.size,
      safetyCriticalPrograms: rows.filter((row) => ['Safety-Critical', 'Critical'].includes(row.criticality)).length,
      regulatoryCriticalPrograms: rows.filter((row) => row.criticality === 'Regulatory-Critical').length,
      psmCriticalPrograms: rows.filter((row) => row.criticality === 'PSM-Critical').length,
      readyForScheduling: rows.filter((row) => row.ready_for_scheduling).length
    };
  }

  private overviewCards(program: Row, scopes: Row[], standards: Row[], modules: Row[], frequency: Row | null) {
    return [
      ['Program title/code', `${program.program_title} / ${program.program_code}`],
      ['Audit type', program.audit_type],
      ['Program category', program.program_category],
      ['Status', program.program_status],
      ['Criticality', program.criticality],
      ['Configuration health', program.configuration_health],
      ['Scope', scopes.length],
      ['Standards count', standards.length],
      ['Modules covered count', modules.length],
      ['Frequency', frequency?.audit_frequency ?? 'Missing'],
      ['Owner', program.owner_user_id ?? 'Missing'],
      ['Reviewer', program.reviewer_user_id ?? 'Missing'],
      ['Effective date', program.effective_date ?? 'Missing'],
      ['Next review due', program.next_review_due ?? frequency?.next_program_review_due ?? 'Missing'],
      ['Ready for scheduling', program.ready_for_scheduling ? 'Yes' : 'No']
    ].map(([label, value]) => ({ label, value }));
  }

  private countBy(rows: Row[], key: string) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      const value = String(row[key] ?? 'Missing');
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {});
  }

  private sortRows(rows: Row[], sort: string) {
    const [rawKey, direction] = sort.split('.');
    const key = rawKey || 'updated_at';
    return [...rows].sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * (direction === 'asc' ? 1 : -1));
  }

  private matchesDerivedFilters(row: Row, query: Row) {
    const scopes = (row.scopes ?? []) as Row[];
    const standards = (row.standards ?? []) as Row[];
    const modules = (row.modules ?? []) as Row[];
    if (query.unitId && !scopes.some((scope) => scope.unit_id === query.unitId)) return false;
    if (query.areaId && !scopes.some((scope) => scope.area_id === query.areaId)) return false;
    if (query.department && !scopes.some((scope) => scope.department_id === query.department)) return false;
    if (query.standard && !standards.some((standard) => standard.standard_name === query.standard)) return false;
    if (query.moduleCovered && !modules.some((module) => module.module_key === query.moduleCovered || module.module_name === query.moduleCovered)) return false;
    if (query.frequency && row.frequency?.audit_frequency !== query.frequency) return false;
    if (query.health && row.configuration_health !== query.health) return false;
    if (query.readyForScheduling && String(row.ready_for_scheduling) !== String(query.readyForScheduling)) return false;
    return true;
  }

  private compact(row: Row) {
    return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
  }

  private async lookupSites(user: RequestUser) {
    let request: any = this.db.from('Site').select('id,name,code,companyId').eq('tenantId', user.tenantId).order('name');
    if (!user.corporateView && user.siteIds.length) request = request.in('id', user.siteIds);
    return this.safeMany<Row>(request);
  }

  private lookupUnits(user: RequestUser) {
    return this.safeMany<Row>(this.db.from('Unit').select('id,name,code,siteId').eq('tenantId', user.tenantId).order('name'));
  }

  private safeMany<T>(query: PromiseLike<any>) {
    return this.db.many<T>(query).catch(() => [] as T[]);
  }
}
