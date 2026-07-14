import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { ActionsService } from '../actions/actions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchIndexService } from '../search/search-index.service';
import {
  BulkGenerateHazopScenariosDto,
  CreateHazopNodeDto,
  CreateHazopRecommendationDto,
  CreateHazopScenarioDto,
  CreateHazopStudyDto,
  HazopCommentDto,
  HazopFilterDto,
  HazopIplValidationDto,
  HazopRecommendationActionDto,
  HazopRecommendationDeferralDto,
  HazopRecommendationEvidenceDto,
  HazopRecommendationVerificationDto,
  HazopRiskAcceptanceDto,
  HazopRiskBulkLopaDto,
  HazopRiskBulkOwnerDto,
  HazopRiskUpdateDto,
  HazopAttendanceDto,
  HazopBulkAttendanceDto,
  HazopSessionActionDto,
  HazopSessionDecisionDto,
  HazopSessionDto,
  HazopSessionMinutesDto,
  HazopSessionRescheduleDto,
  HazopSafeguardActionDto,
  HazopSafeguardGapDto,
  HazopSafeguardLinkDto,
  HazopSafeguardTestStatusDto,
  HazopSafeguardDto,
  HazopTeamMemberDto,
  HazopTeamReplaceDto,
  UpdateHazopStudyDto
} from './dto/hazop.dto';

export type Scope = { allowedSiteIds: string[]; selectedSiteId?: string | null; corporateView?: boolean };

const readonlyStatuses = ['Approved', 'Closed', 'Cancelled'];

@Injectable()
export class HazopService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly actions: ActionsService,
    private readonly notifications: NotificationsService,
    private readonly searchIndex: SearchIndexService
  ) {}

  async list(tenantId: string, filters: HazopFilterDto, scope: Scope, actorId?: string) {
    let query = this.db.from('hazop_studies').select('*').eq('tenant_id', tenantId);
    query = this.applyScope(query, scope);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.studyType) query = query.eq('study_type', filters.studyType);
    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    if (filters.unitId) query = query.eq('unit_id', filters.unitId);
    if (filters.areaId) query = query.eq('area_id', filters.areaId);
    if (filters.leaderId) query = query.eq('study_leader_id', filters.leaderId);
    if (filters.linkedMocId) query = query.eq('linked_moc_id', filters.linkedMocId);
    if (filters.lopaRequired !== undefined) query = query.eq('lopa_required', filters.lopaRequired);
    if (filters.dateFrom) query = query.gte('target_completion_date', filters.dateFrom);
    if (filters.dateTo) query = query.lte('target_completion_date', filters.dateTo);
    if (filters.myStudies === 'true' && actorId) query = query.or(`study_leader_id.eq.${actorId},facilitator_id.eq.${actorId},scribe_id.eq.${actorId}`);
    if (filters.search) query = query.or(`study_number.ilike.%${filters.search}%,title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    const studies = await this.db.many<any>(query.order('updated_at', { ascending: false }));
    return Promise.all(studies.map((study) => this.withRegisterCounts(tenantId, study)));
  }

  async dashboard(tenantId: string, scope: Scope) {
    const [kpis, highRiskScenarios, recommendationHealth, revalidation, recentActivity, charts, studies] = await Promise.all([
      this.dashboardKpis(tenantId, scope),
      this.dashboardHighRisk(tenantId, scope),
      this.dashboardRecommendationHealth(tenantId, scope),
      this.dashboardRevalidation(tenantId, scope),
      this.recentActivity(tenantId, scope),
      this.dashboardCharts(tenantId, scope),
      this.list(tenantId, {}, scope)
    ]);
    return { kpis, highRiskScenarios, recommendationHealth, revalidation, recentActivity, charts, studies };
  }

  async dashboardKpis(tenantId: string, scope: Scope) {
    const studies = await this.list(tenantId, {}, scope);
    const studyIds = studies.map((s) => s.id);
    const scenarios = studyIds.length ? await this.db.many<any>(this.db.from('hazop_scenarios').select('*').eq('tenant_id', tenantId).in('study_id', studyIds)) : [];
    const recommendations = studyIds.length ? await this.db.many<any>(this.db.from('hazop_recommendations').select('*').eq('tenant_id', tenantId).in('study_id', studyIds)) : [];
    const signoffs = studyIds.length ? await this.safeMany<any>(this.db.from('hazop_signoffs').select('id,status').eq('tenant_id', tenantId).in('study_id', studyIds)) : [];
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: studies.length,
      draft: studies.filter((s) => s.status === 'Draft').length,
      inProgress: studies.filter((s) => ['In Preparation', 'In Progress', 'Review'].includes(s.status)).length,
      pendingApproval: studies.filter((s) => s.status === 'Pending Approval').length,
      closed: studies.filter((s) => s.status === 'Closed').length,
      overdue: studies.filter((s) => s.target_completion_date && s.target_completion_date < today && !['Closed', 'Cancelled'].includes(s.status)).length,
      revalidationDue: studies.filter((s) => s.revalidation_due_date && s.revalidation_due_date <= this.plusDays(180)).length,
      highRiskOpenScenarios: scenarios.filter((s) => ['High', 'Critical'].includes(s.risk_level) && s.status !== 'Closed').length,
      recommendationsOpen: recommendations.filter((r) => !['Closed', 'Cancelled'].includes(r.status)).length,
      recommendationsOverdue: recommendations.filter((r) => r.due_date && r.due_date < today && !['Closed', 'Cancelled'].includes(r.status)).length,
      openActions: recommendations.filter((r) => r.action_id && !['Closed', 'Cancelled', 'Verified Closed'].includes(r.status)).length,
      pendingSignoffs: signoffs.filter((signoff) => !['Signed', 'Rejected', 'Not Required'].includes(signoff.status)).length,
      lopaRequired: scenarios.filter((s) => s.lopa_required && s.status !== 'Closed').length,
      mocLinked: studies.filter((s) => s.linked_moc_id || s.linked_pssr_id).length
    };
  }

  async dashboardHighRisk(tenantId: string, scope: Scope) {
    const studies = await this.list(tenantId, {}, scope);
    const ids = studies.map((s) => s.id);
    if (!ids.length) return [];
    const scenarios = await this.db.many<any>(this.db.from('hazop_scenarios').select('*').eq('tenant_id', tenantId).in('study_id', ids).in('risk_level', ['High', 'Critical']).neq('status', 'Closed').order('risk_score', { ascending: false }).limit(10));
    return scenarios.map((scenario) => ({ ...scenario, study: studies.find((study) => study.id === scenario.study_id) }));
  }

  async dashboardRecommendationHealth(tenantId: string, scope: Scope) {
    const studies = await this.list(tenantId, {}, scope);
    const ids = studies.map((s) => s.id);
    const recommendations = ids.length ? await this.db.many<any>(this.db.from('hazop_recommendations').select('*').eq('tenant_id', tenantId).in('study_id', ids)) : [];
    const today = new Date().toISOString().slice(0, 10);
    return {
      open: recommendations.filter((r) => r.status === 'Open').length,
      inProgress: recommendations.filter((r) => r.status === 'In Progress').length,
      overdue: recommendations.filter((r) => r.due_date && r.due_date < today && !['Closed', 'Cancelled'].includes(r.status)).length,
      closed: recommendations.filter((r) => r.status === 'Closed').length,
      safetyCritical: recommendations.filter((r) => r.priority === 'Safety Critical').length
    };
  }

  async dashboardRevalidation(tenantId: string, scope: Scope) {
    const studies = await this.list(tenantId, {}, scope);
    return studies
      .filter((s) => s.revalidation_due_date)
      .sort((a, b) => String(a.revalidation_due_date).localeCompare(String(b.revalidation_due_date)))
      .slice(0, 8);
  }

  async dashboardCharts(tenantId: string, scope: Scope) {
    const studies = await this.list(tenantId, {}, scope);
    const ids = studies.map((s) => s.id);
    const scenarios = ids.length ? await this.db.many<any>(this.db.from('hazop_scenarios').select('*').eq('tenant_id', tenantId).in('study_id', ids)) : [];
    const recommendations = ids.length ? await this.db.many<any>(this.db.from('hazop_recommendations').select('*').eq('tenant_id', tenantId).in('study_id', ids)) : [];
    const today = new Date().toISOString().slice(0, 10);
    return {
      statusDistribution: this.countBy(studies, 'status'),
      recommendationHealth: this.countBy(recommendations, 'status'),
      riskDistribution: this.countBy(scenarios, 'risk_level'),
      riskMatrix: this.riskMatrixCells(scenarios),
      studiesCreatedTrend: this.monthTrend(studies),
      studiesClosedTrend: this.monthTrend(studies.filter((study) => study.status === 'Closed' || study.completed_at)),
      openRecommendationsTrend: this.monthTrend(recommendations.filter((rec) => !['Closed', 'Cancelled'].includes(rec.status))),
      highRiskTrend: this.monthTrend(scenarios.filter((s) => ['High', 'Critical'].includes(s.risk_level))),
      overdueActionsTrend: this.monthTrend(recommendations.filter((rec) => rec.due_date && rec.due_date < today && !['Closed', 'Cancelled'].includes(rec.status))),
      revalidationDueTrend: this.monthTrend(studies.filter((study) => study.revalidation_due_date))
    };
  }

  async dashboardStudies(tenantId: string, filters: HazopFilterDto, scope: Scope, actorId?: string) {
    return this.list(tenantId, filters, scope, actorId);
  }

  async dashboardRiskOverview(tenantId: string, scope: Scope) {
    const charts = await this.dashboardCharts(tenantId, scope);
    const kpis = await this.dashboardKpis(tenantId, scope);
    return { matrix: charts.riskMatrix, distribution: charts.riskDistribution, highCritical: kpis.highRiskOpenScenarios, unranked: charts.riskDistribution.find((item: any) => item.name === 'Unknown')?.value ?? 0 };
  }

  async dashboardStatusDistribution(tenantId: string, scope: Scope) {
    return (await this.dashboardCharts(tenantId, scope)).statusDistribution;
  }

  async dashboardOverdue(tenantId: string, scope: Scope) {
    const today = new Date().toISOString().slice(0, 10);
    return (await this.list(tenantId, {}, scope)).filter((study) => study.target_completion_date && study.target_completion_date < today && !['Closed', 'Cancelled'].includes(study.status));
  }

  async dashboardLopaRequired(tenantId: string, scope: Scope) {
    const studies = await this.list(tenantId, {}, scope);
    return studies.filter((study) => Number(study.lopaRequiredCount ?? 0) > 0 || study.lopa_required);
  }

  async dashboardTeamSignoff(tenantId: string, scope: Scope) {
    const studies = await this.list(tenantId, {}, scope);
    const ids = studies.map((study) => study.id);
    const signoffs = ids.length ? await this.safeMany<any>(this.db.from('hazop_signoffs').select('*').eq('tenant_id', tenantId).in('study_id', ids)) : [];
    return {
      pending: signoffs.filter((signoff) => !['Signed', 'Rejected', 'Not Required'].includes(signoff.status)).length,
      rows: signoffs.slice(0, 12).map((signoff) => ({ ...signoff, study: studies.find((study) => study.id === signoff.study_id) }))
    };
  }

  async dashboardTrends(tenantId: string, scope: Scope) {
    return this.dashboardCharts(tenantId, scope);
  }

  async dashboardExport(tenantId: string, scope: Scope) {
    const studies = await this.list(tenantId, {}, scope);
    return {
      filename: `hazop-dashboard-${new Date().toISOString().slice(0, 10)}.csv`,
      contentType: 'text/csv',
      content: this.csv([
        ['Study Number', 'Title', 'Type', 'Status', 'Progress', 'Nodes', 'Scenarios', 'High/Critical', 'Open Recommendations', 'LOPA Required', 'Target Completion', 'Revalidation Due'],
        ...studies.map((study) => [study.study_number, study.title, study.study_type, study.status, study.progress_percent, study.nodeCount, study.scenarioCount, study.highRiskCount, study.openRecommendationCount, study.lopaRequiredCount, study.target_completion_date, study.revalidation_due_date])
      ])
    };
  }

  async recentActivity(tenantId: string, scope: Scope) {
    const studies = await this.list(tenantId, {}, scope);
    const ids = studies.map((s) => s.id);
    if (!ids.length) return [];
    return this.db.many(this.db.from('hazop_history_events').select('*').eq('tenant_id', tenantId).in('study_id', ids).order('created_at', { ascending: false }).limit(15));
  }

  async newContext(tenantId: string, scope: Scope) {
    const [companies, sites, units, areas, users, guidewords, parameters, matrices, templates, equipment, documents, mocs, pssrs, ptws, incidents, previousStudies] = await Promise.all([
      this.db.many(this.db.from('Company').select('id,name,code').eq('tenantId', tenantId).order('name')),
      this.db.many(this.applyScope(this.db.from('Site').select('id,name,code,companyId').eq('tenantId', tenantId), scope, 'id').order('name')),
      this.db.many(this.db.from('Unit').select('id,name,code,siteId').eq('tenantId', tenantId).order('name')),
      this.db.many(this.db.from('Area').select('*').order('name')),
      this.db.many(this.db.from('User').select('id,displayName,email,title,status').eq('tenantId', tenantId).order('displayName')),
      this.configGuidewords(tenantId),
      this.configParameters(tenantId),
      this.configRiskMatrices(tenantId),
      this.configTemplates(tenantId),
      this.safeMany(this.applyScope(this.db.from('Equipment').select('id,tag,name,type,siteId,unitId,areaId,status').eq('tenantId', tenantId), scope, 'siteId').order('tag').limit(500)),
      this.safeMany(this.db.from('documents').select('id,document_number,title,document_type,status').eq('tenant_id', tenantId).order('title').limit(300)),
      this.safeMany(this.applyScope(this.db.from('mocs').select('id,moc_number,title,status,site_id').eq('tenant_id', tenantId), scope).order('updated_at', { ascending: false }).limit(200)),
      this.safeMany(this.applyScope(this.db.from('pssrs').select('id,pssr_number,title,status,site_id').eq('tenant_id', tenantId), scope).order('updated_at', { ascending: false }).limit(200)),
      this.safeMany(this.applyScope(this.db.from('permits').select('id,permit_number,work_description,status,site_id,equipment_id').eq('tenant_id', tenantId), scope).order('updated_at', { ascending: false }).limit(200)),
      this.safeMany(this.applyScope(this.db.from('incidents').select('id,incident_number,title,status,site_id').eq('tenant_id', tenantId), scope).order('created_at', { ascending: false }).limit(100)),
      this.safeMany(this.applyScope(this.db.from('hazop_studies').select('id,study_number,title,status,site_id').eq('tenant_id', tenantId), scope).order('updated_at', { ascending: false }).limit(200))
    ]);
    return {
      companies,
      sites,
      units,
      areas,
      users,
      guidewords,
      parameters,
      riskMatrices: matrices,
      templates,
      equipment,
      documents,
      mocs,
      pssrs,
      ptws,
      incidents,
      previousStudies,
      studyTypes: ['HAZOP', 'What-If', 'Checklist PHA', 'FMEA', 'Revalidation PHA', 'MOC-triggered PHA', 'Incident-triggered PHA', 'PSSR-triggered PHA'],
      priorities: ['Low', 'Medium', 'High', 'Critical'],
      teamRoles: ['HAZOP Leader / Facilitator', 'Scribe', 'Process Engineer', 'Operations', 'Maintenance', 'Instrument/Control', 'HSE', 'Mechanical', 'Electrical', 'Chemistry/Process specialist', 'Contractor/Vendor', 'Approver']
    };
  }

  async create(tenantId: string, actorId: string, dto: CreateHazopStudyDto, scope: Scope) {
    this.assertSiteAccess(dto.siteId, scope);
    if (!dto.companyId) {
      const site = await this.db.single<any>(this.db.from('Site').select('companyId').eq('tenantId', tenantId).eq('id', dto.siteId).maybeSingle());
      dto.companyId = site?.companyId ?? dto.companyId;
    }
    if (!dto.companyId) throw new BadRequestException('Company is required for HAZOP/PHA studies');
    const now = new Date().toISOString();
    const studyNumber = await this.nextStudyNumber(tenantId, dto.siteId);
    const status = dto.createMode === 'create' ? 'Planned' : dto.createMode === 'start-preparation' ? 'In Preparation' : 'Draft';
    const revalidationInterval = dto.revalidationIntervalMonths ?? 60;
    const study = await this.db.single<any>(this.db.from('hazop_studies').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: dto.companyId ?? null,
      site_id: dto.siteId,
      unit_id: dto.unitId ?? null,
      area_id: dto.areaId ?? null,
      study_number: studyNumber,
      title: dto.title,
      description: dto.description ?? null,
      study_type: dto.studyType,
      study_reason: dto.studyReason ?? null,
      priority: dto.priority ?? 'Medium',
      status,
      study_leader_id: dto.studyLeaderId ?? actorId,
      facilitator_id: dto.facilitatorId ?? null,
      scribe_id: dto.scribeId ?? null,
      risk_matrix_id: dto.riskMatrixId ?? null,
      target_start_date: dto.targetStartDate ?? null,
      target_completion_date: dto.targetCompletionDate ?? null,
      revalidation_interval_months: revalidationInterval,
      scope_summary: dto.scopeSummary ?? null,
      process_section: dto.processSection ?? null,
      equipment_tags: dto.equipmentTags ?? [],
      pid_references: dto.pidReferences ?? [],
      related_chemicals: dto.relatedChemicals ?? [],
      scope_description: dto.scopeDescription ?? dto.scopeSummary ?? null,
      out_of_scope_description: dto.outOfScopeDescription ?? null,
      boundaries: dto.boundaries ?? null,
      assumptions: dto.assumptions ?? null,
      exclusions: dto.exclusions ?? null,
      linked_moc_id: dto.linkedMocId ?? null,
      linked_pssr_id: dto.linkedPssrId ?? null,
      previous_hazop_id: dto.previousHazopId ?? null,
      revalidation_due_date: this.revalidationDate(revalidationInterval),
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now
    }).select().single());
    await this.db.single(this.db.from('hazop_study_settings').insert(this.settingsInsertPayload(tenantId, study.id, dto.settings ?? {})).select().single());
    for (const member of dto.teamMembers ?? []) await this.addTeamMember(tenantId, actorId, study.id, member, scope, false);
    for (const link of this.normalizedLinkedRecords(dto)) await this.addLinkedRecord(tenantId, actorId, study.id, link, scope, false);
    for (const node of dto.initialNodes ?? []) await this.addInitialNode(tenantId, actorId, study.id, node, scope);
    await this.history(tenantId, study.id, actorId, 'STUDY_CREATED', 'HAZOP study created', `${study.study_number} created`);
    if (dto.createMode === 'start-preparation') await this.history(tenantId, study.id, actorId, 'STUDY_START_PREPARATION', 'Study moved to preparation', 'Created and started preparation from wizard');
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_STUDY_CREATED', entityType: 'hazop_studies', entityId: study.id, after: study as JsonValue });
    await this.indexStudy(tenantId, study);
    return this.get(tenantId, study.id, scope);
  }

  async get(tenantId: string, id: string, scope: Scope) {
    const study = await this.study(tenantId, id, scope);
    const [settings, team, sessions, nodes, deviations, scenarios, safeguards, recommendations, linkedRecords, attachments, history, signoffs] = await Promise.all([
      this.db.single<any>(this.db.from('hazop_study_settings').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).maybeSingle()),
      this.db.many(this.db.from('hazop_study_team_members').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('added_at')),
      this.db.many(this.db.from('hazop_study_sessions').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('planned_start')),
      this.db.many(this.db.from('hazop_nodes').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('sort_order')),
      this.db.many(this.db.from('hazop_deviations').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('sort_order')),
      this.db.many(this.db.from('hazop_scenarios').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('scenario_number')),
      this.db.many(this.db.from('hazop_safeguards').select('*').eq('tenant_id', tenantId).in('scenario_id', await this.scenarioIds(tenantId, study.id)).order('created_at')),
      this.db.many(this.db.from('hazop_recommendations').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('created_at', { ascending: false })),
      this.db.many(this.db.from('hazop_linked_records').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('created_at', { ascending: false })),
      this.db.many(this.db.from('hazop_attachments').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('uploaded_at', { ascending: false })),
      this.db.many(this.db.from('hazop_history_events').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('created_at', { ascending: false })),
      this.db.many(this.db.from('hazop_signoffs').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('created_at'))
    ]);
    return { ...study, settings, team, sessions, nodes, deviations, scenarios, safeguards, recommendations, linkedRecords, attachments, history, signoffs, summary: this.summaryFrom({ nodes, scenarios, recommendations, linkedRecords, attachments }) };
  }

  async overview(tenantId: string, id: string, scope: Scope, permissions: string[] = []) {
    const study = await this.study(tenantId, id, scope);
    const can = (permission: string, aliases: string[] = []) => this.hasAnyPermission(permissions, [permission, ...aliases, 'hazop.edit']);
    const [
      settings,
      site,
      unit,
      area,
      users,
      nodes,
      scenarios,
      riskMatrix,
      safeguardsSummary,
      recommendationsSummary,
      recommendationsRegister,
      linkedRecordsSummary,
      linkedRecordsRegister,
      linkedBlockers,
      teamSummary,
      teamRegister,
      teamCoverage,
      teamReadiness,
      sessions,
      readiness,
      attachmentSummary,
      attachments,
      history,
      actions,
      equipment
    ] = await Promise.all([
      this.safeSingle<any>(this.db.from('hazop_study_settings').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).maybeSingle()),
      this.safeSingle<any>(this.db.from('Site').select('id,name,code,companyId').eq('tenantId', tenantId).eq('id', study.site_id).maybeSingle()),
      study.unit_id ? this.safeSingle<any>(this.db.from('Unit').select('id,name,code,siteId').eq('tenantId', tenantId).eq('id', study.unit_id).maybeSingle()) : Promise.resolve(null),
      study.area_id ? this.safeSingle<any>(this.db.from('Area').select('id,name,code,unitId,siteId').eq('id', study.area_id).maybeSingle()) : Promise.resolve(null),
      this.safeMany<any>(this.db.from('User').select('id,displayName,email,title,status').eq('tenantId', tenantId)),
      this.safeMany<any>(this.db.from('hazop_nodes').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('sort_order')),
      this.safeMany<any>(this.db.from('hazop_scenarios').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('row_number')),
      can('hazop.risk.view') ? this.riskMatrix(tenantId, study.id, scope) : Promise.resolve({ restricted: true }),
      can('hazop.safeguards.view') ? this.safeguardsSummary(tenantId, study.id, scope) : Promise.resolve({ restricted: true }),
      can('hazop.recommendations.view', ['hazop.recommendation.view']) ? this.recommendationsSummary(tenantId, study.id, scope) : Promise.resolve({ restricted: true }),
      can('hazop.recommendations.view', ['hazop.recommendation.view']) ? this.recommendationsRegister(tenantId, study.id, { limit: 100 }, scope) : Promise.resolve({ rows: [], total: 0, restricted: true }),
      can('hazop.linked_records.view') ? this.linkedRecordsSummary(tenantId, study.id, scope) : Promise.resolve({ restricted: true }),
      can('hazop.linked_records.view') ? this.linkedRecordsRegister(tenantId, study.id, {}, scope) : Promise.resolve([]),
      can('hazop.linked_records.view') ? this.linkedRecordBlockers(tenantId, study.id, scope) : Promise.resolve([]),
      can('hazop.team.view') ? this.teamSessionsSummary(tenantId, study.id, scope) : Promise.resolve({ restricted: true }),
      can('hazop.team.view') ? this.teamRegister(tenantId, study.id, {}, scope) : Promise.resolve([]),
      can('hazop.team.coverage.view') ? this.teamCoverage(tenantId, study.id, scope) : Promise.resolve([]),
      can('hazop.team.view') ? this.teamSignoffReadiness(tenantId, study.id, scope) : Promise.resolve({ restricted: true }),
      can('hazop.sessions.view') ? this.sessionsRegister(tenantId, study.id, {}, scope) : Promise.resolve([]),
      can('hazop.review.view') ? this.reviewReadiness(tenantId, study.id, scope, false) : Promise.resolve({ restricted: true }),
      can('hazop.attachments.view') ? this.attachmentSummary(tenantId, study.id, scope) : Promise.resolve({ restricted: true }),
      can('hazop.attachments.view') ? this.attachmentsRegister(tenantId, study.id, { limit: 8 }, scope) : Promise.resolve([]),
      can('hazop.history.view') ? this.historyRegister(tenantId, study.id, { limit: 8 }, scope, can('hazop.history.view_sensitive')) : Promise.resolve([]),
      this.safeMany<any>(this.db.from('Action').select('id,actionNumber,title,status,assignedToId,dueDate,priority,sourceId,moduleKey,sourceModule').eq('tenantId', tenantId)),
      this.overviewEquipment(tenantId, study, scope)
    ]);
    const safeguardsOverview = safeguardsSummary as any;
    const recommendationsOverview = recommendationsSummary as any;
    const recommendationsOverviewRegister = recommendationsRegister as any;
    const linkedOverview = linkedRecordsSummary as any;
    const attachmentOverview = attachmentSummary as any;
    const readinessOverview = readiness as any;
    const teamOverview = teamSummary as any;
    const teamReadinessOverview = teamReadiness as any;
    const userById = new Map(users.map((user) => [user.id, user]));
    const actionRows = actions.filter((action) => action.moduleKey === 'HAZOP' || action.sourceModule === 'HAZOP' || action.sourceId === study.id);
    const openActions = actionRows.filter((action) => !['Closed', 'Completed', 'Verified', 'Cancelled', 'CLOSED', 'COMPLETED', 'VERIFIED'].includes(action.status));
    const closedActions = actionRows.length - openActions.length;
    const rankedScenarios = scenarios.filter((scenario) => scenario.risk_level);
    const highCritical = scenarios.filter((scenario) => ['High', 'Critical'].includes(scenario.risk_level));
    const lopaGaps = Number(safeguardsOverview?.safeguardGaps ?? 0) + scenarios.filter((scenario) => scenario.lopa_required && !['Completed', 'Not Required', 'Accepted'].includes(scenario.lopa_status ?? '')).length;
    const completedSessions = sessions.filter((session) => session.status === 'Completed').length;
    const pendingSignoffs = Number(readinessOverview?.signoffsPending ?? teamOverview?.pendingTeamSignoffs ?? 0);
    const linkedTotal = Number(linkedOverview?.totalLinkedRecords ?? linkedRecordsRegister.length);
    const attachmentTotal = Number(attachmentOverview?.totalAttachments ?? attachments.length);
    const completion = (done: number, total: number) => total ? Math.round((done / total) * 100) : 0;
    const progressMetrics = [
      { key: 'node_completion', label: 'Node Completion', done: nodes.filter((node) => ['Completed', 'Closed', 'Approved'].includes(node.status)).length, total: nodes.length, tab: 'Nodes & Deviations' },
      { key: 'scenario_completion', label: 'Scenario Completion', done: scenarios.filter((scenario) => ['Closed', 'Completed', 'Accepted'].includes(scenario.status)).length, total: scenarios.length, tab: 'Nodes & Deviations' },
      { key: 'risk_ranking', label: 'Risk Ranking Complete', done: rankedScenarios.length, total: scenarios.length, tab: 'Risk Ranking' },
      { key: 'safeguards_reviewed', label: 'Safeguards Reviewed', done: Number(safeguardsOverview?.creditedSafeguards ?? 0) + Number(safeguardsOverview?.nonCreditedSafeguards ?? 0), total: scenarios.length, tab: 'Safeguards / IPL' },
      { key: 'recommendations_closed', label: 'Recommendations Closed', done: Number(recommendationsOverview?.closed ?? 0), total: Number(recommendationsOverview?.total ?? 0), tab: 'Recommendations / Actions' },
      { key: 'actions_closed', label: 'Actions Closed', done: closedActions, total: actionRows.length, tab: 'Recommendations / Actions' },
      { key: 'sessions_completed', label: 'Sessions Completed', done: completedSessions, total: sessions.length, tab: 'Team & Sessions' },
      { key: 'team_signoff_readiness', label: 'Team Sign-Off Readiness', done: teamReadinessOverview?.status === 'Ready' ? 1 : 0, total: 1, tab: 'Team & Sessions' },
      { key: 'linked_blockers_resolved', label: 'Linked Record Blockers Resolved', done: linkedBlockers.filter((blocker) => blocker.status !== 'Open').length, total: linkedBlockers.length, tab: 'Linked Records' },
      { key: 'overall_readiness', label: 'Overall Readiness', percent: Number(readinessOverview?.progress ?? 0), tab: 'Review & Sign-Off' }
    ].map((metric) => ({ ...metric, percent: metric.percent ?? completion(metric.done ?? 0, metric.total ?? 0) }));
    const leader = userById.get(study.study_leader_id) ?? teamRegister.find((member) => member.role === 'HAZOP Leader / Facilitator');
    const scribe = userById.get(study.scribe_id) ?? teamRegister.find((member) => member.role === 'Scribe');
    const facilitator = userById.get(study.facilitator_id) ?? teamRegister.find((member) => member.role === 'HAZOP Leader / Facilitator');
    const hse = teamRegister.find((member) => String(member.discipline ?? member.role ?? '').toLowerCase().includes('hse'));
    const operations = teamRegister.find((member) => String(member.discipline ?? member.role ?? '').toLowerCase().includes('operation'));
    const nextSession = sessions.filter((session) => ['Planned', 'Rescheduled'].includes(session.status)).sort((a, b) => String(a.session_date ?? a.planned_start ?? '').localeCompare(String(b.session_date ?? b.planned_start ?? '')))[0] ?? null;
    const recommendationRows = (recommendationsRegister.rows ?? []).slice().sort((a: any, b: any) => this.recommendationPreviewRank(b) - this.recommendationPreviewRank(a)).slice(0, 6);
    const riskSnapshot = this.overviewRiskSnapshot(riskMatrix, scenarios);
    const readinessCounts = this.overviewReadinessCounts(readiness);
    const data = {
      study: { ...study, site, unit, area, settings },
      header: {
        studyNumber: study.study_number,
        title: study.title,
        subtitle: [unit?.name, area?.name, study.process_section].filter(Boolean).join(' / '),
        studyType: study.study_type,
        status: study.status,
        priority: study.priority ?? (riskSnapshot.highCriticalTotal ? 'High' : 'Medium'),
        site: site?.name ?? study.site_id,
        updatedAt: study.updated_at,
        readOnly: readonlyStatuses.includes(study.status)
      },
      permissions: {
        canEdit: this.hasAnyPermission(permissions, ['hazop.edit']),
        canExport: this.hasAnyPermission(permissions, ['hazop.export']),
        canStartReview: this.hasAnyPermission(permissions, ['hazop.review.start', 'hazop.edit']),
        canCreateRecommendation: this.hasAnyPermission(permissions, ['hazop.recommendations.create', 'hazop.recommendation.create']),
        canDownloadAttachment: this.hasAnyPermission(permissions, ['hazop.attachments.download', 'hazop.attachments.view']),
        canViewRestrictedHistory: this.hasAnyPermission(permissions, ['hazop.history.view_sensitive'])
      },
      kpis: [
        { key: 'nodes', label: 'Total Nodes', value: nodes.length, helper: `${nodes.filter((node) => ['Completed', 'Closed', 'Approved'].includes(node.status)).length} completed`, tone: 'blue', tab: 'Nodes & Deviations' },
        { key: 'scenarios', label: 'Total Scenarios', value: scenarios.length, helper: `${rankedScenarios.length} ranked`, tone: 'teal', tab: 'Nodes & Deviations' },
        { key: 'highCritical', label: 'High / Critical Risks', value: highCritical.length, helper: `${scenarios.filter((scenario) => scenario.risk_level === 'Critical').length} critical`, tone: 'red', tab: 'Risk Ranking' },
        { key: 'openRecommendations', label: 'Open Recommendations', value: Number(recommendationsOverview?.open ?? 0) + Number(recommendationsOverview?.inProgress ?? 0) + Number(recommendationsOverview?.pendingVerification ?? 0), helper: `${recommendationsOverview?.overdue ?? 0} overdue`, tone: 'amber', tab: 'Recommendations / Actions' },
        { key: 'iplGaps', label: 'IPL Gaps', value: lopaGaps, helper: `${safeguardsOverview?.iplCandidates ?? 0} candidates`, tone: lopaGaps ? 'purple' : 'green', tab: 'Safeguards / IPL' },
        { key: 'sessionsCompleted', label: 'Sessions Completed', value: `${completedSessions} / ${sessions.length}`, helper: nextSession ? `Next: ${nextSession.title}` : 'No upcoming session', tone: 'cyan', tab: 'Team & Sessions' },
        { key: 'pendingSignoffs', label: 'Pending Sign-Offs', value: pendingSignoffs, helper: readinessOverview?.status ?? 'Not generated', tone: pendingSignoffs ? 'amber' : 'green', tab: 'Review & Sign-Off' },
        { key: 'linkedRecords', label: 'Linked Records', value: linkedTotal, helper: `${linkedBlockers.filter((blocker) => blocker.status === 'Open').length} blockers`, tone: 'blue', tab: 'Linked Records' },
        { key: 'attachments', label: 'Attachments', value: attachmentTotal, helper: `${attachmentOverview?.filesNeedingReview ?? 0} need review`, tone: 'slate', tab: 'Attachments' },
        { key: 'openActions', label: 'Open Actions', value: openActions.length, helper: `${closedActions} closed`, tone: 'orange', tab: 'Recommendations / Actions' }
      ],
      overview: {
        studyType: study.study_type,
        studyNumber: study.study_number,
        title: study.title,
        site: site?.name ?? null,
        processUnit: unit?.name ?? null,
        area: area?.name ?? null,
        location: [site?.name, unit?.name, area?.name].filter(Boolean).join(' / '),
        leader: this.profile(leader),
        scribe: this.profile(scribe),
        facilitator: this.profile(facilitator),
        startDate: study.target_start_date,
        targetEndDate: study.target_completion_date,
        completionDate: study.completed_at ?? study.closed_at,
        revalidationDueDate: study.revalidation_due_date,
        pidReferences: this.uniqueStrings([...(study.pid_references ?? []), ...nodes.flatMap((node) => node.pid_references ?? [])]),
        linkedMocId: study.linked_moc_id,
        linkedPssrId: study.linked_pssr_id,
        objective: study.objective ?? study.description,
        scopeSummary: study.scope_summary,
        boundaries: study.boundaries,
        assumptions: study.assumptions,
        exclusions: study.exclusions
      },
      progress: { metrics: progressMetrics, overallPercent: Number(readinessOverview?.progress ?? this.average(progressMetrics.map((metric) => metric.percent))), status: readinessOverview?.status ?? 'Not Ready' },
      riskSnapshot,
      teamSnapshot: {
        leader: this.profile(leader),
        scribe: this.profile(scribe),
        facilitator: this.profile(facilitator),
        hseRepresentative: this.profile(hse),
        operationsRepresentative: this.profile(operations),
        totalTeamMembers: teamRegister.length,
        requiredMembers: Number(teamOverview?.requiredMembers ?? 0),
        optionalMembers: Number(teamOverview?.optionalMembers ?? 0),
        missingDisciplines: teamCoverage.filter((row) => row.required && row.coverage_status === 'Missing'),
        coverage: teamCoverage,
        attendanceCompletion: sessions.length ? completion(sessions.filter((session) => session.attendance_status === 'Complete').length, sessions.length) : 0,
        pendingSignoffs,
        nextSession
      },
      recommendationsPreview: { restricted: Boolean(recommendationsOverviewRegister.restricted), total: recommendationsOverviewRegister.total ?? recommendationRows.length, rows: recommendationRows },
      linkedRecordsPreview: {
        restricted: Boolean(linkedOverview?.restricted),
        total: linkedTotal,
        openBlockers: linkedBlockers.filter((blocker) => blocker.status === 'Open').length,
        outdatedDocuments: Number(linkedOverview?.outdatedDocuments ?? 0),
        lopaPending: Number(linkedOverview?.lopaRequiredPending ?? 0),
        counts: this.overviewLinkedCounts(linkedOverview, linkedRecordsRegister)
      },
      recentActivity: history.slice(0, 8).map((event) => ({ ...event, actor: this.profile(userById.get(event.actor_user_id)) })),
      attachmentsPreview: { restricted: Boolean(attachmentOverview?.restricted), total: attachmentTotal, rows: attachments.slice(0, 6).map((attachment) => ({ ...attachment, uploadedBy: this.profile(attachment.uploadedBy ?? userById.get(attachment.uploaded_by)) })) },
      readiness: { ...readinessOverview, counts: readinessCounts, blockers: (readinessOverview?.blockers ?? []).slice(0, 6), checks: readinessOverview?.checks ?? [], overallPercent: Number(readinessOverview?.progress ?? 0) },
      equipmentContext: this.overviewEquipmentContext(study, nodes, scenarios, equipment),
      quickActions: [
        { key: 'edit', label: 'Edit Study', tab: null, enabled: this.hasAnyPermission(permissions, ['hazop.edit']) && !readonlyStatuses.includes(study.status) },
        { key: 'risk', label: 'Open Risk Ranking', tab: 'Risk Ranking', enabled: can('hazop.risk.view') },
        { key: 'recommendation', label: 'Create Recommendation', tab: 'Recommendations / Actions', enabled: this.hasAnyPermission(permissions, ['hazop.recommendations.create', 'hazop.recommendation.create']) && !readonlyStatuses.includes(study.status) },
        { key: 'signoff', label: 'Open Review & Sign-Off', tab: 'Review & Sign-Off', enabled: can('hazop.review.view') },
        { key: 'history', label: 'View Full History', tab: 'History', enabled: can('hazop.history.view') },
        { key: 'export', label: 'Export Overview', tab: null, enabled: this.hasAnyPermission(permissions, ['hazop.export']) }
      ]
    };
    return data;
  }

  async overviewSection(tenantId: string, id: string, section: string, scope: Scope, permissions: string[] = []) {
    const data = await this.overview(tenantId, id, scope, permissions);
    const normalized = section.replace(/-/g, '_');
    const map: Record<string, any> = {
      kpis: data.kpis,
      progress: data.progress,
      risk_snapshot: data.riskSnapshot,
      team_snapshot: data.teamSnapshot,
      recommendations_preview: data.recommendationsPreview,
      linked_records_preview: data.linkedRecordsPreview,
      recent_activity: data.recentActivity,
      attachments_preview: data.attachmentsPreview,
      readiness: data.readiness,
      equipment_context: data.equipmentContext
    };
    return map[normalized] ?? data;
  }

  async exportOverview(tenantId: string, actorId: string, id: string, scope: Scope, permissions: string[] = []) {
    const overview = await this.overview(tenantId, id, scope, permissions);
    const rows: unknown[][] = [
      ['Section', 'Metric', 'Value'],
      ['Study', 'Number', overview.study.study_number],
      ['Study', 'Title', overview.study.title],
      ['Study', 'Status', overview.study.status],
      ...overview.kpis.map((kpi: any) => ['KPI', kpi.label, kpi.value]),
      ...overview.progress.metrics.map((metric: any) => ['Progress', metric.label, `${metric.percent}%`]),
      ['Risk', 'High / Critical', overview.riskSnapshot.highCriticalTotal],
      ['Readiness', 'Status', overview.readiness.status],
      ['Readiness', 'Progress', `${overview.readiness.overallPercent}%`]
    ];
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_OVERVIEW_EXPORTED', entityType: 'hazop_studies', entityId: id, after: { rows: rows.length } as JsonValue });
    return { fileName: `${overview.study.study_number}-overview.csv`, contentType: 'text/csv', content: this.csv(rows) };
  }

  async update(tenantId: string, actorId: string, id: string, dto: UpdateHazopStudyDto, scope: Scope) {
    const before = await this.study(tenantId, id, scope);
    this.assertEditable(before);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: actorId };
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.studyLeaderId !== undefined) patch.study_leader_id = dto.studyLeaderId;
    if (dto.facilitatorId !== undefined) patch.facilitator_id = dto.facilitatorId;
    if (dto.scribeId !== undefined) patch.scribe_id = dto.scribeId;
    if (dto.targetStartDate !== undefined) patch.target_start_date = dto.targetStartDate;
    if (dto.targetCompletionDate !== undefined) patch.target_completion_date = dto.targetCompletionDate;
    if (dto.scopeSummary !== undefined) patch.scope_summary = dto.scopeSummary;
    if (dto.exclusions !== undefined) patch.exclusions = dto.exclusions;
    const updated = await this.db.single<any>(this.db.from('hazop_studies').update(patch).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, id, actorId, 'STUDY_UPDATED', 'Study updated', 'Study header or scope changed', { before, patch });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_STUDY_UPDATED', entityType: 'hazop_studies', entityId: id, before: before as JsonValue, after: updated as JsonValue });
    return this.get(tenantId, id, scope);
  }

  async transition(tenantId: string, actorId: string, id: string, action: string, scope: Scope, comment?: string) {
    const study = await this.study(tenantId, id, scope);
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { updated_at: now, updated_by: actorId };
    const map: Record<string, string> = { submit: 'Pending Approval', 'start-preparation': 'In Preparation', 'start-study': 'In Progress', 'request-approval': 'Pending Approval', approve: 'Approved', close: 'Closed', reopen: 'In Progress', cancel: 'Cancelled' };
    const next = map[action];
    if (!next) throw new BadRequestException('Unsupported HAZOP lifecycle action');
    if (action !== 'reopen' && (study.status === 'Closed' || study.status === 'Cancelled')) throw new BadRequestException('Closed or cancelled studies cannot be transitioned');
    if (study.status === next) return this.get(tenantId, id, scope);
    this.assertLifecycleTransition(study.status, action);
    if (action === 'approve') {
      const highOpen = await this.db.many<any>(this.db.from('hazop_scenarios').select('id').eq('tenant_id', tenantId).eq('study_id', id).in('risk_level', ['High', 'Critical']).neq('status', 'Closed'));
      const recs = await this.db.many<any>(this.db.from('hazop_recommendations').select('id').eq('tenant_id', tenantId).eq('study_id', id));
      if (highOpen.length && !recs.length) throw new BadRequestException('High/Critical scenarios require recommendations or formal acceptance before approval');
      patch.approved_at = now;
      patch.approved_by = actorId;
    }
    if (action === 'close') {
      const openRecommendations = await this.recommendationClosureBlockers(tenantId, id, scope);
      if (openRecommendations.length) throw new BadRequestException('HAZOP cannot close while recommendation/action closure blockers remain open');
      patch.closed_at = now;
      patch.closed_by = actorId;
    }
    if (action === 'cancel') {
      patch.cancelled_at = now;
      patch.cancelled_by = actorId;
      patch.cancellation_reason = comment ?? 'Cancelled by authorized user';
    }
    patch.status = next;
    const updated = await this.db.single<any>(this.db.from('hazop_studies').update(patch).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, id, actorId, `STUDY_${action.toUpperCase().replace('-', '_')}`, `Study ${next}`, comment ?? `Status changed to ${next}`);
    await this.audit.write({ tenantId, actorId, action: `HAZOP_${action.toUpperCase().replace('-', '_')}`, entityType: 'hazop_studies', entityId: id, before: study as JsonValue, after: updated as JsonValue });
    return this.get(tenantId, id, scope);
  }

  async delete(tenantId: string, actorId: string, id: string, scope: Scope) {
    const study = await this.study(tenantId, id, scope);
    if (study.status !== 'Draft') throw new BadRequestException('Only draft HAZOP studies can be deleted');
    await this.db.single(this.db.from('hazop_studies').delete().eq('tenant_id', tenantId).eq('id', id));
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_STUDY_DELETED', entityType: 'hazop_studies', entityId: id, before: study as JsonValue });
    return { deleted: true };
  }

  async addNode(tenantId: string, actorId: string, studyId: string, dto: CreateHazopNodeDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    if (!dto.designIntent?.trim()) throw new BadRequestException('Design intent is required for a HAZOP node');
    if (!dto.boundaryLimits?.trim() && !dto.boundaries?.trim()) throw new BadRequestException('Boundary / battery limits are required for a HAZOP node');
    const count = await this.count('hazop_nodes', tenantId, 'study_id', studyId);
    const nodeNumber = await this.nextNodeNumber(tenantId, studyId, dto);
    await this.assertNodeNumberUnique(tenantId, studyId, nodeNumber, undefined, dto.unitId ?? study.unit_id ?? null, dto.areaId ?? study.area_id ?? null);
    const node = await this.db.single<any>(this.db.from('hazop_nodes').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: studyId,
      owner_id: dto.ownerId ?? null,
      complex_id: dto.complexId ?? (study as any).complex_id ?? null,
      unit_id: dto.unitId ?? study.unit_id ?? null,
      area_id: dto.areaId ?? study.area_id ?? null,
      parent_node_id: dto.parentNodeId ?? null,
      node_number: nodeNumber,
      title: dto.title,
      description: dto.description ?? null,
      design_intent: dto.designIntent ?? null,
      equipment_ids: dto.equipmentIds ?? [],
      document_ids: dto.documentIds ?? [],
      pid_references: dto.pidReferences ?? [],
      equipment_link_snapshots: dto.equipmentLinks ?? [],
      document_version_snapshots: dto.documentLinks ?? [],
      selected_parameters: dto.selectedParameters ?? [],
      parameter_configurations: dto.parameterConfigurations ?? [],
      normal_operating_conditions: dto.normalOperatingConditions ?? null,
      process_conditions_json: dto.processConditionsJson ?? {},
      process_conditions: dto.processConditions ?? null,
      related_chemical_ids: dto.relatedChemicalIds ?? [],
      boundaries: dto.boundaryLimits ?? dto.boundaries ?? null,
      boundary_limits: dto.boundaryLimits ?? dto.boundaries ?? null,
      assumptions: dto.assumptions ?? null,
      exclusions: dto.exclusions ?? null,
      sort_order: dto.sortOrder ?? count + 1,
      status: dto.status ?? 'Draft',
      created_by: actorId,
      updated_by: actorId
    }).select().single());
    await this.syncNodeRegistryAndParameters(tenantId, actorId, study, node, dto);
    await this.history(tenantId, studyId, actorId, 'NODE_CREATED', `Node ${node.node_number} created`, node.title);
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_NODE_CREATED', entityType: 'hazop_nodes', entityId: node.id, after: node as JsonValue });
    await this.indexHazopNode(tenantId, study, node);
    return this.getNodeDetail(tenantId, studyId, node.id, scope);
  }

  async addScenario(tenantId: string, actorId: string, studyId: string, dto: CreateHazopScenarioDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const node = await this.node(tenantId, studyId, dto.nodeId);
    if (!dto.cause?.trim() || !dto.consequence?.trim()) throw new BadRequestException('Cause and consequence are required before risk ranking');
    let deviationId = dto.deviationId ?? null;
    const deviationText = dto.deviationText ?? dto.deviation ?? this.deviationText(dto.guideword, dto.parameter);
    if (!deviationId && dto.guideword && dto.parameter && deviationText) {
      const deviation = await this.db.single<any>(this.db.from('hazop_deviations').insert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: study.company_id ?? null,
        site_id: study.site_id ?? null,
        study_id: studyId,
        node_id: dto.nodeId,
        guideword: dto.guideword,
        parameter: dto.parameter,
        deviation: deviationText,
        created_by: actorId,
        updated_by: actorId
      }).select().single());
      deviationId = deviation.id;
    }
    const risk = this.calculateRisk(dto.severity, dto.likelihood);
    const residualRisk = dto.residualSeverity && dto.residualLikelihood ? this.calculateRisk(dto.residualSeverity, dto.residualLikelihood) : null;
    const count = await this.count('hazop_scenarios', tenantId, 'study_id', studyId);
    const scenario = await this.db.single<any>(this.db.from('hazop_scenarios').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: studyId,
      node_id: dto.nodeId,
      deviation_id: deviationId,
      scenario_number: `SCN-${String(count + 1).padStart(3, '0')}`,
      row_number: count + 1,
      guideword: dto.guideword ?? null,
      parameter: dto.parameter ?? null,
      deviation_text: deviationText ?? null,
      cause: dto.cause,
      consequence: dto.consequence,
      existing_safeguards: dto.existingSafeguards ?? null,
      severity: dto.severity,
      likelihood: dto.likelihood,
      risk_score: risk.score,
      risk_level: risk.level,
      risk_color: risk.color,
      residual_severity: dto.residualSeverity ?? null,
      residual_likelihood: dto.residualLikelihood ?? null,
      residual_risk_score: residualRisk?.score ?? null,
      residual_risk_level: residualRisk?.level ?? null,
      lopa_required: dto.lopaRequired ?? risk.lopaRequired,
      lopa_trigger_reason: dto.lopaRequired || risk.lopaRequired ? (dto.lopaTriggerReason ?? risk.lopaReason) : null,
      recommendation_required: dto.recommendationRequired ?? risk.recommendationRequired,
      acceptance_required: ['High', 'Critical'].includes(risk.level),
      status: dto.status ?? (risk.lopaRequired ? 'LOPA Required' : risk.recommendationRequired ? 'Recommendation Required' : 'Open'),
      owner_id: dto.ownerId ?? null,
      notes: dto.notes ?? null,
      created_by: actorId,
      updated_by: actorId
    }).select().single());
    await this.db.single(this.db.from('hazop_risk_assessments').insert({ id: crypto.randomUUID(), tenant_id: tenantId, scenario_id: scenario.id, severity: dto.severity, likelihood: dto.likelihood, risk_score: risk.score, risk_level: risk.level, assessed_by: actorId }).select().single());
    await this.refreshStudyProgress(tenantId, studyId);
    await this.history(tenantId, studyId, actorId, 'SCENARIO_CREATED', `${scenario.scenario_number} created`, `${risk.level} risk scenario added`, { risk });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SCENARIO_CREATED', entityType: 'hazop_scenarios', entityId: scenario.id, after: scenario as JsonValue });
    await this.indexHazopScenario(tenantId, study, node, scenario);
    return scenario;
  }

  async nodesContext(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [equipment, documents, guidewords, parameters, matrices, users, team, masterParameters] = await Promise.all([
      this.safeMany(this.applyScope(this.db.from('Equipment').select('id,tag,name,type,criticality,siteId,unitId,areaId,status').eq('tenantId', tenantId), scope, 'siteId').eq('siteId', study.site_id ?? '').order('tag').limit(500)),
      this.safeMany(this.db.from('documents').select('id,document_number,title,document_type,status,revision,effective_date,site_id,unit_id,area_id').eq('tenant_id', tenantId).eq('site_id', study.site_id ?? '').order('title').limit(300)),
      this.configGuidewords(tenantId),
      this.configParameters(tenantId),
      this.configRiskMatrices(tenantId),
      this.db.many(this.db.from('User').select('id,displayName,email,title,status').eq('tenantId', tenantId).order('displayName')),
      this.db.many(this.db.from('hazop_study_team_members').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('added_at')),
      this.masterParameters(tenantId, study)
    ]);
    const owners = this.teamOwnerOptions(team, users);
    const nextNodeNumber = await this.nextNodeNumber(tenantId, studyId, { unitId: study.unit_id, areaId: study.area_id });
    return { study, hierarchy: await this.studyHierarchy(tenantId, study), equipment, documents, guidewords, parameters, masterParameters, riskMatrices: matrices, users: owners, team, nextNodeNumber };
  }

  async getNodeDetail(tenantId: string, studyId: string, nodeId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    const node = await this.node(tenantId, studyId, nodeId);
    const [scenarios, history, equipmentLinks, documentLinks, parameterRows] = await Promise.all([
      this.getNodeScenarios(tenantId, studyId, nodeId, scope),
      this.db.many(this.db.from('hazop_history_events').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).contains('metadata', { nodeId }).order('created_at', { ascending: false })),
      this.safeMany(this.db.from('hazop_node_equipment_links').select('*').eq('tenant_id', tenantId).eq('node_id', nodeId).order('created_at')),
      this.safeMany(this.db.from('hazop_node_document_links').select('*').eq('tenant_id', tenantId).eq('node_id', nodeId).order('created_at')),
      this.safeMany(this.db.from('hazop_node_parameters').select('*').eq('tenant_id', tenantId).eq('node_id', nodeId).order('parameter_name'))
    ]);
    return { ...node, scenarios, history, equipmentLinks, documentLinks, parameterRows };
  }

  async updateNode(tenantId: string, actorId: string, studyId: string, nodeId: string, dto: CreateHazopNodeDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.node(tenantId, studyId, nodeId);
    if (dto.designIntent !== undefined && !dto.designIntent.trim()) throw new BadRequestException('Design intent is required for a HAZOP node');
    if (dto.boundaryLimits !== undefined && !dto.boundaryLimits.trim()) throw new BadRequestException('Boundary / battery limits are required for a HAZOP node');
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: actorId };
    if (dto.nodeNumber !== undefined) {
      await this.assertNodeNumberUnique(tenantId, studyId, dto.nodeNumber, nodeId, dto.unitId ?? before.unit_id ?? null, dto.areaId ?? before.area_id ?? null);
      patch.node_number = dto.nodeNumber;
    }
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.designIntent !== undefined) patch.design_intent = dto.designIntent;
    if (dto.ownerId !== undefined) patch.owner_id = dto.ownerId || null;
    if (dto.complexId !== undefined) patch.complex_id = dto.complexId || null;
    if (dto.unitId !== undefined) patch.unit_id = dto.unitId || null;
    if (dto.areaId !== undefined) patch.area_id = dto.areaId || null;
    if (dto.equipmentIds !== undefined) patch.equipment_ids = dto.equipmentIds;
    if (dto.documentIds !== undefined) patch.document_ids = dto.documentIds;
    if (dto.pidReferences !== undefined) patch.pid_references = dto.pidReferences;
    if (dto.equipmentLinks !== undefined) patch.equipment_link_snapshots = dto.equipmentLinks;
    if (dto.documentLinks !== undefined) patch.document_version_snapshots = dto.documentLinks;
    if (dto.selectedParameters !== undefined) patch.selected_parameters = dto.selectedParameters;
    if (dto.parameterConfigurations !== undefined) patch.parameter_configurations = dto.parameterConfigurations;
    if (dto.relatedChemicalIds !== undefined) patch.related_chemical_ids = dto.relatedChemicalIds;
    if (dto.normalOperatingConditions !== undefined) patch.normal_operating_conditions = dto.normalOperatingConditions;
    if (dto.processConditionsJson !== undefined) patch.process_conditions_json = dto.processConditionsJson;
    if (dto.processConditions !== undefined) patch.process_conditions = dto.processConditions;
    if (dto.boundaries !== undefined) patch.boundaries = dto.boundaries;
    if (dto.boundaryLimits !== undefined) {
      patch.boundaries = dto.boundaryLimits;
      patch.boundary_limits = dto.boundaryLimits;
    }
    if (dto.assumptions !== undefined) patch.assumptions = dto.assumptions;
    if (dto.exclusions !== undefined) patch.exclusions = dto.exclusions;
    if (dto.sortOrder !== undefined) patch.sort_order = dto.sortOrder;
    if (dto.status !== undefined) patch.status = dto.status;
    const updated = await this.db.single<any>(this.db.from('hazop_nodes').update(patch).eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', nodeId).select().single());
    await this.syncNodeRegistryAndParameters(tenantId, actorId, study, updated, dto);
    await this.history(tenantId, studyId, actorId, 'NODE_UPDATED', `Node ${updated.node_number} updated`, updated.title, { nodeId, before, patch });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_NODE_UPDATED', entityType: 'hazop_nodes', entityId: nodeId, before: before as JsonValue, after: updated as JsonValue });
    await this.indexHazopNode(tenantId, study, updated);
    return this.getNodeDetail(tenantId, studyId, nodeId, scope);
  }

  async nodeEquipment(tenantId: string, studyId: string, nodeId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    await this.node(tenantId, studyId, nodeId);
    return this.safeMany(this.db.from('hazop_node_equipment_links').select('*').eq('tenant_id', tenantId).eq('node_id', nodeId).order('equipment_tag'));
  }

  async nodeDocuments(tenantId: string, studyId: string, nodeId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    await this.node(tenantId, studyId, nodeId);
    return this.safeMany(this.db.from('hazop_node_document_links').select('*').eq('tenant_id', tenantId).eq('node_id', nodeId).order('document_number'));
  }

  async nodeParameters(tenantId: string, studyId: string, nodeId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    await this.node(tenantId, studyId, nodeId);
    return this.safeMany(this.db.from('hazop_node_parameters').select('*').eq('tenant_id', tenantId).eq('node_id', nodeId).order('parameter_name'));
  }

  async replaceNodeParameters(tenantId: string, actorId: string, studyId: string, nodeId: string, parameters: Record<string, unknown>[], scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const node = await this.node(tenantId, studyId, nodeId);
    await this.writeNodeParameters(tenantId, actorId, study, node, parameters ?? []);
    await this.db.single(this.db.from('hazop_nodes').update({
      selected_parameters: (parameters ?? []).map((item: any) => item.parameterName ?? item.parameter_name ?? item.name).filter(Boolean),
      parameter_configurations: parameters ?? [],
      updated_at: new Date().toISOString(),
      updated_by: actorId
    }).eq('tenant_id', tenantId).eq('id', nodeId).select().single());
    await this.history(tenantId, studyId, actorId, 'NODE_PARAMETERS_UPDATED', `Node ${node.node_number} parameters updated`, node.title, { nodeId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_NODE_PARAMETERS_UPDATED', entityType: 'hazop_nodes', entityId: nodeId, after: parameters as JsonValue });
    return this.nodeParameters(tenantId, studyId, nodeId, scope);
  }

  async masterParametersForStudy(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    return this.masterParameters(tenantId, study);
  }

  async createCustomParameter(tenantId: string, actorId: string, studyId: string, body: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    if (!String(body.name ?? '').trim()) throw new BadRequestException('Custom parameter name is required');
    const existing = await this.safeSingle<any>(
      this.db.from('hazop_master_parameters')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('site_id', study.site_id ?? '')
        .ilike('name', String(body.name).trim())
        .single()
    );
    const payload = {
      id: body.id ?? crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      name: String(body.name).trim(),
      category: body.category ?? 'Custom',
      unit_hint: body.unitHint ?? body.unit_hint ?? null,
      is_custom: true,
      active: true,
      created_by: actorId
    };
    const parameter = existing
      ? await this.db.single<any>(this.db.from('hazop_master_parameters').update({ category: payload.category, unit_hint: payload.unit_hint, active: true }).eq('id', existing.id).select().single())
      : await this.db.single<any>(this.db.from('hazop_master_parameters').insert(payload).select().single());
    await this.history(tenantId, studyId, actorId, 'NODE_CUSTOM_PARAMETER_CREATED', `Custom parameter ${parameter.name} created`, parameter.category);
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_CUSTOM_PARAMETER_CREATED', entityType: 'hazop_master_parameters', entityId: parameter.id, after: parameter as JsonValue });
    return parameter;
  }

  private async nextNodeNumber(tenantId: string, studyId: string, dto: Partial<CreateHazopNodeDto>) {
    if (dto.nodeNumber?.trim()) return dto.nodeNumber.trim();
    const rows = await this.safeMany<any>(this.db.from('hazop_nodes').select('node_number,unit_id,area_id').eq('tenant_id', tenantId).eq('study_id', studyId));
    const scoped = rows.filter((row) => (dto.unitId ? row.unit_id === dto.unitId : true) && (dto.areaId ? row.area_id === dto.areaId : true));
    const max = scoped.reduce((value, row) => {
      const first = Number.parseInt(String(row.node_number ?? '').split(/[.-]/)[0] ?? '0', 10);
      return Number.isFinite(first) ? Math.max(value, first) : value;
    }, 0);
    return String(max + 1).padStart(2, '0');
  }

  private async assertNodeNumberUnique(tenantId: string, studyId: string, nodeNumber: string, excludeNodeId?: string, unitId?: string | null, areaId?: string | null) {
    let query = this.db.from('hazop_nodes').select('id,node_number,unit_id,area_id').eq('tenant_id', tenantId).eq('study_id', studyId).eq('node_number', nodeNumber);
    if (excludeNodeId) query = query.neq('id', excludeNodeId);
    const matches = await this.safeMany<any>(query);
    const duplicate = matches.find((row) => (!unitId || row.unit_id === unitId) && (!areaId || row.area_id === areaId));
    if (duplicate) throw new BadRequestException(`Node number ${nodeNumber} already exists in this study scope`);
  }

  private async syncNodeRegistryAndParameters(tenantId: string, actorId: string, study: any, node: any, dto: CreateHazopNodeDto) {
    if (dto.equipmentLinks !== undefined || dto.equipmentIds !== undefined) {
      await this.writeNodeEquipmentLinks(tenantId, actorId, study, node, dto.equipmentLinks ?? []);
      await this.history(tenantId, study.id, actorId, 'NODE_EQUIPMENT_LINKS_UPDATED', `Node ${node.node_number} equipment links updated`, node.title, { nodeId: node.id });
    }
    if (dto.documentLinks !== undefined || dto.documentIds !== undefined || dto.pidReferences !== undefined) {
      await this.writeNodeDocumentLinks(tenantId, actorId, study, node, dto.documentLinks ?? []);
      await this.history(tenantId, study.id, actorId, 'NODE_DOCUMENT_LINKS_UPDATED', `Node ${node.node_number} document links updated`, node.title, { nodeId: node.id });
    }
    if (dto.parameterConfigurations !== undefined) {
      await this.writeNodeParameters(tenantId, actorId, study, node, dto.parameterConfigurations ?? []);
      await this.history(tenantId, study.id, actorId, 'NODE_PARAMETERS_UPDATED', `Node ${node.node_number} parameters updated`, node.title, { nodeId: node.id });
    }
  }

  private async writeNodeEquipmentLinks(tenantId: string, actorId: string, study: any, node: any, links: Record<string, any>[]) {
    await this.safeMany(this.db.from('hazop_node_equipment_links').delete().eq('tenant_id', tenantId).eq('node_id', node.id).select());
    if (!links.length) return;
    await this.safeMany(this.db.from('hazop_node_equipment_links').insert(links.map((link) => ({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      node_id: node.id,
      equipment_id: link.id ?? link.equipmentId ?? link.equipment_id,
      equipment_tag: link.tag ?? link.equipmentTag ?? link.equipment_tag ?? null,
      equipment_name: link.name ?? link.equipmentName ?? link.equipment_name ?? null,
      equipment_type: link.type ?? link.equipmentType ?? link.equipment_type ?? null,
      criticality: link.criticality ?? null,
      status: link.status ?? null,
      created_by: actorId
    }))).select());
  }

  private async writeNodeDocumentLinks(tenantId: string, actorId: string, study: any, node: any, links: Record<string, any>[]) {
    await this.safeMany(this.db.from('hazop_node_document_links').delete().eq('tenant_id', tenantId).eq('node_id', node.id).select());
    if (!links.length) return;
    await this.safeMany(this.db.from('hazop_node_document_links').insert(links.map((link) => ({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      node_id: node.id,
      document_id: link.id ?? link.documentId ?? link.document_id,
      document_number: link.document_number ?? link.documentNumber ?? null,
      document_title: link.title ?? link.documentTitle ?? null,
      document_type: link.document_type ?? link.documentType ?? null,
      revision: link.revision ?? link.version ?? null,
      status: link.status ?? null,
      effective_date: link.effective_date ?? link.effectiveDate ?? null,
      pinned_version: link.pinnedVersion ?? link.revision ?? link.version ?? null,
      created_by: actorId
    }))).select());
  }

  private async writeNodeParameters(tenantId: string, actorId: string, study: any, node: any, parameters: Record<string, any>[]) {
    await this.safeMany(this.db.from('hazop_node_parameters').delete().eq('tenant_id', tenantId).eq('node_id', node.id).select());
    if (!parameters.length) return;
    await this.safeMany(this.db.from('hazop_node_parameters').insert(parameters.map((parameter) => ({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      node_id: node.id,
      parameter_name: parameter.parameterName ?? parameter.parameter_name ?? parameter.name,
      parameter_category: parameter.category ?? parameter.parameterCategory ?? parameter.parameter_category ?? null,
      normal_operating_range: parameter.normalOperatingRange ?? parameter.normal_operating_range ?? null,
      design_range: parameter.designRange ?? parameter.design_range ?? null,
      unit_of_measurement: parameter.unitOfMeasurement ?? parameter.unit_of_measurement ?? null,
      high_limit: parameter.highLimit ?? parameter.high_limit ?? null,
      low_limit: parameter.lowLimit ?? parameter.low_limit ?? null,
      related_equipment_id: parameter.relatedEquipmentId ?? parameter.related_equipment_id ?? null,
      related_document_id: parameter.relatedDocumentId ?? parameter.related_document_id ?? null,
      safety_concern: parameter.safetyConcern ?? parameter.safety_concern ?? null,
      notes: parameter.notes ?? null,
      is_custom: Boolean(parameter.isCustom ?? parameter.is_custom),
      created_by: actorId,
      updated_by: actorId
    }))).select());
  }

  private async masterParameters(tenantId: string, study: any) {
    const rows = await this.safeMany<any>(this.db.from('hazop_master_parameters').select('*').or(`tenant_id.is.null,tenant_id.eq.${tenantId}`).eq('active', true).order('name'));
    return rows.filter((row) => !row.site_id || row.site_id === study.site_id);
  }

  private teamOwnerOptions(team: any[], users: any[]) {
    if (!team.length) return users;
    const byId = new Map(users.map((user) => [user.id, user]));
    return team.map((member) => {
      const user = byId.get(member.user_id) ?? {};
      return {
        ...user,
        id: member.user_id ?? user.id,
        displayName: member.member_name ?? user.displayName ?? user.email,
        email: member.email ?? user.email,
        title: member.study_role ?? user.title,
        discipline: member.discipline,
        memberStatus: member.status
      };
    }).filter((user) => user.id);
  }

  private async studyHierarchy(tenantId: string, study: any) {
    const [site, unit, area] = await Promise.all([
      study.site_id ? this.safeSingle(this.db.from('Site').select('id,name,siteCode').eq('tenantId', tenantId).eq('id', study.site_id).single()) : null,
      study.unit_id ? this.safeSingle(this.db.from('Unit').select('id,name,unitCode,siteId').eq('tenantId', tenantId).eq('id', study.unit_id).single()) : null,
      study.area_id ? this.safeSingle(this.db.from('Area').select('id,name,areaCode,unitId').eq('tenantId', tenantId).eq('id', study.area_id).single()) : null
    ]);
    return {
      site: site ?? { id: study.site_id, name: study.site_name ?? study.site_id },
      complex: { id: study.complex_id ?? study.site_id, name: study.complex_name ?? study.site_name ?? 'Study Complex' },
      unit: unit ?? { id: study.unit_id, name: study.unit_name ?? study.process_unit ?? study.unit_id },
      area: area ?? { id: study.area_id, name: study.area_name ?? study.area ?? study.area_id }
    };
  }

  async deleteNode(tenantId: string, actorId: string, studyId: string, nodeId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const node = await this.node(tenantId, studyId, nodeId);
    const scenarios = await this.getNodeScenarios(tenantId, studyId, nodeId, scope);
    if (scenarios.length) throw new BadRequestException('Node has scenarios. Delete or move scenarios before deleting the node.');
    await this.db.single(this.db.from('hazop_nodes').delete().eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', nodeId));
    await this.history(tenantId, studyId, actorId, 'NODE_DELETED', `Node ${node.node_number} deleted`, node.title, { nodeId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_NODE_DELETED', entityType: 'hazop_nodes', entityId: nodeId, before: node as JsonValue });
    await this.searchIndex.removeRecord(tenantId, 'hazop', nodeId);
    return { deleted: true };
  }

  async duplicateNode(tenantId: string, actorId: string, studyId: string, nodeId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const source = await this.node(tenantId, studyId, nodeId);
    const node = await this.addNode(tenantId, actorId, studyId, {
      title: `${source.title} Copy`,
      description: source.description,
      designIntent: source.design_intent,
      unitId: source.unit_id,
      areaId: source.area_id,
      equipmentIds: source.equipment_ids ?? [],
      documentIds: source.document_ids ?? [],
      pidReferences: source.pid_references ?? [],
      normalOperatingConditions: source.normal_operating_conditions,
      processConditionsJson: source.process_conditions_json ?? {},
      processConditions: source.process_conditions,
      relatedChemicalIds: source.related_chemical_ids ?? [],
      boundaries: source.boundaries,
      assumptions: source.assumptions,
      exclusions: source.exclusions
    }, scope);
    await this.history(tenantId, studyId, actorId, 'NODE_DUPLICATED', `Node ${source.node_number} duplicated`, `${node.node_number} created from ${source.node_number}`, { nodeId: node.id, sourceNodeId: source.id });
    return node;
  }

  async reorderNodes(tenantId: string, actorId: string, studyId: string, nodeIds: string[], scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const existing = await this.db.many<any>(this.db.from('hazop_nodes').select('id').eq('tenant_id', tenantId).eq('study_id', studyId));
    const existingIds = new Set(existing.map((node) => node.id));
    if (nodeIds.some((id) => !existingIds.has(id))) throw new BadRequestException('Node reorder includes an unknown node');
    for (const [index, id] of nodeIds.entries()) {
      await this.db.single(this.db.from('hazop_nodes').update({ sort_order: index + 1, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', id).select().single());
    }
    await this.history(tenantId, studyId, actorId, 'NODES_REORDERED', 'Node order updated', `${nodeIds.length} nodes reordered`, { nodeIds });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_NODES_REORDERED', entityType: 'hazop_nodes', entityId: studyId, after: { nodeIds } as JsonValue });
    return this.get(tenantId, studyId, scope).then((result) => result.nodes);
  }

  async setNodeStatus(tenantId: string, actorId: string, studyId: string, nodeId: string, status: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.node(tenantId, studyId, nodeId);
    const node = await this.db.single<any>(this.db.from('hazop_nodes').update({ status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', nodeId).select().single());
    await this.history(tenantId, studyId, actorId, status === 'Completed' ? 'NODE_COMPLETED' : 'NODE_REOPENED', `Node ${node.node_number} ${status}`, node.title, { nodeId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_NODE_STATUS_UPDATED', entityType: 'hazop_nodes', entityId: nodeId, before: before as JsonValue, after: node as JsonValue });
    await this.indexHazopNode(tenantId, study, node);
    return node;
  }

  async getNodeScenarios(tenantId: string, studyId: string, nodeId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    await this.node(tenantId, studyId, nodeId);
    return this.db.many<any>(this.db.from('hazop_scenarios').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('node_id', nodeId).order('row_number'));
  }

  async riskSummary(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [scenarios, recommendations, acceptances] = await Promise.all([
      this.db.many<any>(this.db.from('hazop_scenarios').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.db.many<any>(this.db.from('hazop_recommendations').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_risk_acceptances').select('*').eq('tenant_id', tenantId).eq('study_id', study.id))
    ]);
    const openAcceptanceStatuses = new Set(['Requested', 'Pending Approval', 'Approved']);
    return {
      studyId: study.id,
      totalScenarios: scenarios.length,
      low: scenarios.filter((s) => s.risk_level === 'Low').length,
      medium: scenarios.filter((s) => s.risk_level === 'Medium').length,
      high: scenarios.filter((s) => s.risk_level === 'High').length,
      critical: scenarios.filter((s) => s.risk_level === 'Critical').length,
      highCriticalOpen: scenarios.filter((s) => ['High', 'Critical'].includes(s.risk_level) && s.status !== 'Closed').length,
      lopaRequired: scenarios.filter((s) => s.lopa_required).length,
      recommendationRequired: scenarios.filter((s) => s.recommendation_required).length,
      recommendationsOpen: recommendations.filter((r) => !['Closed', 'Cancelled'].includes(r.status)).length,
      acceptanceRequired: scenarios.filter((s) => s.acceptance_required).length,
      activeAcceptances: acceptances.filter((a) => openAcceptanceStatuses.has(a.status)).length,
      residualHighCritical: scenarios.filter((s) => ['High', 'Critical'].includes(s.residual_risk_level)).length
    };
  }

  async riskMatrix(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const settings = await this.db.single<any>(this.db.from('hazop_study_settings').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).maybeSingle());
    let matrices: any[] = await this.configRiskMatrices(tenantId) as any[];
    matrices = matrices.filter((matrix: any) => !matrix.site_id || !study.site_id || matrix.site_id === study.site_id);
    const selected: any = matrices.find((matrix: any) => matrix.id === study.risk_matrix_id)
      ?? matrices.find((matrix: any) => matrix.is_default_site && matrix.site_id === study.site_id)
      ?? matrices.find((matrix: any) => matrix.is_default_company && (!matrix.company_id || matrix.company_id === study.company_id))
      ?? matrices[0]
      ?? null;
    return {
      matrix: selected,
      source: selected?.id === study.risk_matrix_id ? 'Study custom/selected matrix' : settings?.risk_matrix_source ?? 'Company/Site default',
      residualEnabled: Boolean(settings?.residual_risk_enabled ?? settings?.require_acceptance_for_no_action ?? true),
      acceptanceCriteria: settings?.acceptance_criteria ?? null,
      lopaTriggerPolicy: settings?.lopa_trigger_policy ?? null,
      lopaTriggerThreshold: settings?.lopa_trigger_threshold ?? 'Critical'
    };
  }

  async riskRegister(tenantId: string, studyId: string, query: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [nodes, scenarios, recommendations, acceptances] = await Promise.all([
      this.db.many<any>(this.db.from('hazop_nodes').select('id,node_number,title,equipment_ids,pid_references').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.db.many<any>(this.db.from('hazop_scenarios').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('risk_score', { ascending: false })),
      this.db.many<any>(this.db.from('hazop_recommendations').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_risk_acceptances').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('created_at', { ascending: false }))
    ]);
    const search = String(query.search ?? '').trim().toLowerCase();
    const riskLevel = String(query.riskLevel ?? query.risk_level ?? '');
    const status = String(query.status ?? '');
    const lopa = String(query.lopaRequired ?? query.lopa_required ?? '');
    let rows = scenarios.map((scenario) => {
      const node = nodes.find((n) => n.id === scenario.node_id);
      const recs = recommendations.filter((r) => r.scenario_id === scenario.id);
      const acceptance = acceptances.find((a) => a.scenario_id === scenario.id);
      return {
        ...scenario,
        node,
        recommendationCount: recs.length,
        recommendations: recs,
        acceptance,
        acceptanceStatus: acceptance?.status ?? scenario.acceptance_status ?? 'Not Required'
      };
    });
    if (riskLevel && riskLevel !== 'All') rows = rows.filter((row) => row.risk_level === riskLevel || row.residual_risk_level === riskLevel);
    if (status && status !== 'All') rows = rows.filter((row) => row.status === status);
    if (lopa && lopa !== 'All') rows = rows.filter((row) => row.lopa_required === (lopa === 'true' || lopa === 'Yes'));
    if (search) {
      rows = rows.filter((row) => [
        row.scenario_number,
        row.guideword,
        row.parameter,
        row.deviation_text,
        row.cause,
        row.consequence,
        row.existing_safeguards,
        row.node?.node_number,
        row.node?.title
      ].filter(Boolean).join(' ').toLowerCase().includes(search));
    }
    return { rows, total: rows.length };
  }

  async highCriticalRisk(tenantId: string, studyId: string, scope: Scope) {
    const register = await this.riskRegister(tenantId, studyId, { riskLevel: 'All' }, scope);
    return register.rows
      .filter((row: any) => ['High', 'Critical'].includes(row.risk_level) || ['High', 'Critical'].includes(row.residual_risk_level))
      .sort((a: any, b: any) => (b.risk_score ?? 0) - (a.risk_score ?? 0));
  }

  async lopaTriggers(tenantId: string, studyId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    return this.db.many<any>(this.db.from('hazop_scenarios').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('lopa_required', true).order('risk_score', { ascending: false }));
  }

  async riskHistory(tenantId: string, studyId: string, query: Record<string, any>, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    let q = this.db.from('hazop_risk_history').select('*').eq('tenant_id', tenantId).eq('study_id', studyId);
    if (query.scenarioId) q = q.eq('scenario_id', query.scenarioId);
    return this.safeMany<any>(q.order('created_at', { ascending: false }).limit(Number(query.limit ?? 100)));
  }

  async riskAcceptances(tenantId: string, studyId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    return this.safeMany<any>(this.db.from('hazop_risk_acceptances').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).order('created_at', { ascending: false }));
  }

  async updateScenarioRisk(tenantId: string, actorId: string, studyId: string, scenarioId: string, dto: HazopRiskUpdateDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.scenario(tenantId, study.id, scenarioId);
    const node = await this.node(tenantId, study.id, before.node_id);
    if (!before.cause?.trim() || !before.consequence?.trim()) throw new BadRequestException('Cause and consequence are required before risk ranking');
    const matrix = await this.riskMatrixForStudy(tenantId, study);
    const risk = this.calculateRiskWithMatrix(matrix, dto.severity, dto.likelihood);
    const residualRisk = dto.residualSeverity && dto.residualLikelihood ? this.calculateRiskWithMatrix(matrix, dto.residualSeverity, dto.residualLikelihood) : null;
    const acceptanceRequired = ['High', 'Critical'].includes(risk.level) || (residualRisk ? ['High', 'Critical'].includes(residualRisk.level) : false);
    const lopaRequired = before.lopa_required || risk.lopaRequired || Boolean(residualRisk?.lopaRequired);
    const lopaReason = lopaRequired
      ? before.lopa_trigger_reason ?? risk.lopaReason ?? residualRisk?.lopaReason ?? 'Risk ranking meets configured LOPA trigger threshold'
      : null;
    const patch: Record<string, unknown> = {
      severity: dto.severity,
      likelihood: dto.likelihood,
      risk_score: risk.score,
      risk_level: risk.level,
      risk_color: risk.color,
      residual_severity: dto.residualSeverity ?? null,
      residual_likelihood: dto.residualLikelihood ?? null,
      residual_risk_score: residualRisk?.score ?? null,
      residual_risk_level: residualRisk?.level ?? null,
      residual_risk_color: residualRisk?.color ?? null,
      recommendation_required: risk.recommendationRequired || acceptanceRequired,
      acceptance_required: acceptanceRequired,
      acceptance_status: acceptanceRequired ? before.acceptance_status ?? 'Required' : 'Not Required',
      lopa_required: lopaRequired,
      lopa_trigger_reason: lopaReason,
      lopa_trigger_source: lopaRequired ? before.lopa_trigger_source ?? 'Risk Matrix' : null,
      lopa_triggered_by: lopaRequired ? before.lopa_triggered_by ?? actorId : null,
      lopa_triggered_at: lopaRequired ? before.lopa_triggered_at ?? new Date().toISOString() : null,
      status: lopaRequired ? 'LOPA Required' : risk.recommendationRequired ? 'Recommendation Required' : before.status,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    };
    const updated = await this.db.single<any>(this.db.from('hazop_scenarios').update(patch).eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', scenarioId).select().single());
    await this.recordRiskAssessment(tenantId, actorId, study, updated, risk, residualRisk, matrix?.id, dto.comment ?? 'Risk ranking updated');
    await this.writeRiskHistory(tenantId, study.id, scenarioId, actorId, 'Risk Updated', before, updated, dto.comment);
    await this.refreshStudyProgress(tenantId, study.id);
    await this.history(tenantId, study.id, actorId, 'RISK_UPDATED', `${updated.scenario_number} risk ranked ${updated.risk_level}`, dto.comment ?? 'Risk ranking recalculated by backend', { scenarioId, risk });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_RISK_UPDATED', entityType: 'hazop_scenarios', entityId: scenarioId, before: before as JsonValue, after: updated as JsonValue });
    await this.indexHazopScenario(tenantId, study, node, updated);
    return updated;
  }

  async recalculateScenarioRisk(tenantId: string, actorId: string, studyId: string, scenarioId: string, scope: Scope) {
    const scenario = await this.scenario(tenantId, studyId, scenarioId);
    const dto: HazopRiskUpdateDto = {
      severity: scenario.severity,
      likelihood: scenario.likelihood,
      comment: 'Manual recalculation'
    };
    if (scenario.residual_severity) dto.residualSeverity = scenario.residual_severity;
    if (scenario.residual_likelihood) dto.residualLikelihood = scenario.residual_likelihood;
    return this.updateScenarioRisk(tenantId, actorId, studyId, scenarioId, dto, scope);
  }

  async clearScenarioLopaRequired(tenantId: string, actorId: string, studyId: string, scenarioId: string, reason: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.scenario(tenantId, study.id, scenarioId);
    if (before.risk_level === 'Critical') throw new BadRequestException('Critical risk scenarios cannot clear LOPA until risk is reduced or policy changes');
    const updated = await this.db.single<any>(this.db.from('hazop_scenarios').update({
      lopa_required: false,
      lopa_trigger_reason: null,
      lopa_trigger_source: null,
      lopa_triggered_by: null,
      lopa_triggered_at: null,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', scenarioId).select().single());
    await this.writeRiskHistory(tenantId, study.id, scenarioId, actorId, 'LOPA Cleared', before, updated, reason);
    await this.refreshStudyProgress(tenantId, study.id);
    await this.history(tenantId, study.id, actorId, 'LOPA_CLEARED', `${updated.scenario_number} LOPA cleared`, reason, { scenarioId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_LOPA_CLEARED', entityType: 'hazop_scenarios', entityId: scenarioId, before: before as JsonValue, after: updated as JsonValue });
    return updated;
  }

  async requestRiskAcceptance(tenantId: string, actorId: string, studyId: string, scenarioId: string, dto: HazopRiskAcceptanceDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const scenario = await this.scenario(tenantId, study.id, scenarioId);
    if (!scenario.acceptance_required && !['High', 'Critical'].includes(scenario.risk_level)) throw new BadRequestException('Risk acceptance is only required for high/critical or configured acceptance scenarios');
    if (dto.acceptanceType === 'Temporary acceptance' && !dto.expiryDate) throw new BadRequestException('Temporary risk acceptance requires an expiry date');
    const acceptance = await this.db.single<any>(this.db.from('hazop_risk_acceptances').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      scenario_id: scenario.id,
      acceptance_type: dto.acceptanceType,
      justification: dto.justification,
      conditions: dto.conditions ?? null,
      expiry_date: dto.expiryDate ?? null,
      review_date: dto.reviewDate ?? null,
      approver_id: dto.approverId ?? null,
      attachment_id: dto.attachmentId ?? null,
      status: dto.approverId ? 'Pending Approval' : 'Requested',
      requested_by: actorId,
      created_by: actorId,
      updated_by: actorId
    }).select().single());
    await this.db.single(this.db.from('hazop_scenarios').update({ acceptance_status: acceptance.status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', scenario.id).select().single());
    await this.writeRiskHistory(tenantId, study.id, scenario.id, actorId, 'Risk Acceptance Requested', null, acceptance, dto.justification);
    await this.history(tenantId, study.id, actorId, 'RISK_ACCEPTANCE_REQUESTED', `${scenario.scenario_number} risk acceptance requested`, dto.justification, { scenarioId, acceptanceId: acceptance.id });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_RISK_ACCEPTANCE_REQUESTED', entityType: 'hazop_risk_acceptances', entityId: acceptance.id, after: acceptance as JsonValue });
    return acceptance;
  }

  async updateRiskAcceptance(tenantId: string, actorId: string, studyId: string, acceptanceId: string, dto: HazopRiskAcceptanceDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.riskAcceptance(tenantId, study.id, acceptanceId);
    if (!['Requested', 'Pending Approval'].includes(before.status)) throw new BadRequestException('Only requested or pending risk acceptances can be edited');
    const patch = {
      acceptance_type: dto.acceptanceType,
      justification: dto.justification,
      conditions: dto.conditions ?? null,
      expiry_date: dto.expiryDate ?? null,
      review_date: dto.reviewDate ?? null,
      approver_id: dto.approverId ?? null,
      attachment_id: dto.attachmentId ?? null,
      status: dto.approverId ? 'Pending Approval' : 'Requested',
      updated_by: actorId,
      updated_at: new Date().toISOString()
    };
    const updated = await this.db.single<any>(this.db.from('hazop_risk_acceptances').update(patch).eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', acceptanceId).select().single());
    await this.db.single(this.db.from('hazop_scenarios').update({ acceptance_status: updated.status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', updated.scenario_id).select().single());
    await this.writeRiskHistory(tenantId, study.id, updated.scenario_id, actorId, 'Risk Acceptance Updated', before, updated, dto.justification);
    await this.history(tenantId, study.id, actorId, 'RISK_ACCEPTANCE_UPDATED', 'Risk acceptance updated', dto.justification, { scenarioId: updated.scenario_id, acceptanceId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_RISK_ACCEPTANCE_UPDATED', entityType: 'hazop_risk_acceptances', entityId: acceptanceId, before: before as JsonValue, after: updated as JsonValue });
    return updated;
  }

  async decideRiskAcceptance(tenantId: string, actorId: string, studyId: string, acceptanceId: string, status: 'Approved' | 'Rejected' | 'Expired', comment: string | undefined, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const before = await this.riskAcceptance(tenantId, study.id, acceptanceId);
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status, updated_by: actorId, updated_at: now };
    if (status === 'Approved') {
      patch.approved_by = actorId;
      patch.approved_at = now;
      patch.approval_comment = comment ?? null;
    } else {
      patch.rejected_by = actorId;
      patch.rejected_at = now;
      patch.rejection_reason = comment ?? null;
    }
    const updated = await this.db.single<any>(this.db.from('hazop_risk_acceptances').update(patch).eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', acceptanceId).select().single());
    await this.db.single(this.db.from('hazop_scenarios').update({ acceptance_status: status, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', updated.scenario_id).select().single());
    await this.writeRiskHistory(tenantId, study.id, updated.scenario_id, actorId, `Risk Acceptance ${status}`, before, updated, comment);
    await this.history(tenantId, study.id, actorId, `RISK_ACCEPTANCE_${status.toUpperCase()}`, `Risk acceptance ${status.toLowerCase()}`, comment, { scenarioId: updated.scenario_id, acceptanceId });
    await this.audit.write({ tenantId, actorId, action: `HAZOP_RISK_ACCEPTANCE_${status.toUpperCase()}`, entityType: 'hazop_risk_acceptances', entityId: acceptanceId, before: before as JsonValue, after: updated as JsonValue });
    return updated;
  }

  async bulkRiskOwner(tenantId: string, actorId: string, studyId: string, dto: HazopRiskBulkOwnerDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const scenarioIds = (dto.scenarioIds ?? []).filter(Boolean);
    if (!scenarioIds.length) throw new BadRequestException('Select at least one scenario');
    await this.db.single(this.db.from('hazop_scenarios').update({ owner_id: dto.ownerId, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('study_id', study.id).in('id', scenarioIds).select().limit(1).single());
    await this.history(tenantId, study.id, actorId, 'RISK_OWNER_BULK_UPDATED', 'Risk owners updated', `${scenarioIds.length} scenarios assigned`, { scenarioIds, ownerId: dto.ownerId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_RISK_OWNER_BULK_UPDATED', entityType: 'hazop_scenarios', entityId: study.id, after: { scenarioIds, ownerId: dto.ownerId } as JsonValue });
    return this.riskRegister(tenantId, study.id, {}, scope);
  }

  async bulkMarkLopa(tenantId: string, actorId: string, studyId: string, dto: HazopRiskBulkLopaDto, scope: Scope) {
    const scenarioIds = (dto.scenarioIds ?? []).filter(Boolean);
    if (!scenarioIds.length) throw new BadRequestException('Select at least one scenario');
    const updated = [];
    for (const scenarioId of scenarioIds) updated.push(await this.markScenarioLopaRequired(tenantId, actorId, studyId, scenarioId, dto.reason, scope));
    return updated;
  }

  async exportRiskRegister(tenantId: string, actorId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const register = await this.riskRegister(tenantId, study.id, {}, scope);
    const headers = ['Scenario', 'Node', 'Guideword', 'Parameter', 'Deviation', 'Cause', 'Consequence', 'Severity', 'Likelihood', 'Risk Score', 'Risk Level', 'Residual Risk', 'LOPA Required', 'Acceptance Status', 'Status'];
    const rows = register.rows.map((row: any) => [
      row.scenario_number,
      row.node?.node_number ?? '',
      row.guideword ?? '',
      row.parameter ?? '',
      row.deviation_text ?? '',
      row.cause ?? '',
      row.consequence ?? '',
      row.severity,
      row.likelihood,
      row.risk_score,
      row.risk_level,
      row.residual_risk_level ?? '',
      row.lopa_required ? 'Yes' : 'No',
      row.acceptanceStatus,
      row.status
    ]);
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_RISK_REGISTER_EXPORTED', entityType: 'hazop_studies', entityId: study.id, after: { rows: rows.length } as JsonValue });
    return { fileName: `${study.study_number}-risk-register.csv`, contentType: 'text/csv', content: [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n') };
  }

  async updateScenario(tenantId: string, actorId: string, studyId: string, scenarioId: string, dto: CreateHazopScenarioDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.scenario(tenantId, studyId, scenarioId);
    const node = await this.node(tenantId, studyId, before.node_id);
    const risk = dto.severity && dto.likelihood ? this.calculateRisk(dto.severity, dto.likelihood) : null;
    const residualRisk = dto.residualSeverity && dto.residualLikelihood ? this.calculateRisk(dto.residualSeverity, dto.residualLikelihood) : null;
    const patch: Record<string, unknown> = { updated_by: actorId, updated_at: new Date().toISOString() };
    if (dto.guideword !== undefined) patch.guideword = dto.guideword;
    if (dto.parameter !== undefined) patch.parameter = dto.parameter;
    if (dto.deviation !== undefined || dto.deviationText !== undefined) patch.deviation_text = dto.deviationText ?? dto.deviation;
    if (dto.cause !== undefined) patch.cause = dto.cause;
    if (dto.consequence !== undefined) patch.consequence = dto.consequence;
    if (dto.existingSafeguards !== undefined) patch.existing_safeguards = dto.existingSafeguards;
    if (dto.severity !== undefined) patch.severity = dto.severity;
    if (dto.likelihood !== undefined) patch.likelihood = dto.likelihood;
    if (risk) {
      patch.risk_score = risk.score;
      patch.risk_level = risk.level;
      patch.risk_color = risk.color;
      patch.recommendation_required = dto.recommendationRequired ?? risk.recommendationRequired;
      patch.lopa_required = dto.lopaRequired ?? risk.lopaRequired;
      patch.lopa_trigger_reason = dto.lopaRequired || risk.lopaRequired ? (dto.lopaTriggerReason ?? risk.lopaReason) : null;
      patch.acceptance_required = ['High', 'Critical'].includes(risk.level);
    }
    if (dto.residualSeverity !== undefined) patch.residual_severity = dto.residualSeverity;
    if (dto.residualLikelihood !== undefined) patch.residual_likelihood = dto.residualLikelihood;
    if (residualRisk) {
      patch.residual_risk_score = residualRisk.score;
      patch.residual_risk_level = residualRisk.level;
    }
    if (dto.recommendationRequired !== undefined && !risk) patch.recommendation_required = dto.recommendationRequired;
    if (dto.lopaRequired !== undefined && !risk) patch.lopa_required = dto.lopaRequired;
    if (dto.lopaTriggerReason !== undefined && !risk) patch.lopa_trigger_reason = dto.lopaTriggerReason;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.ownerId !== undefined) patch.owner_id = dto.ownerId || null;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    const updated = await this.db.single<any>(this.db.from('hazop_scenarios').update(patch).eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', scenarioId).select().single());
    if (risk) await this.db.single(this.db.from('hazop_risk_assessments').insert({ id: crypto.randomUUID(), tenant_id: tenantId, scenario_id: scenarioId, severity: updated.severity, likelihood: updated.likelihood, risk_score: updated.risk_score, risk_level: updated.risk_level, assessed_by: actorId }).select().single());
    await this.refreshStudyProgress(tenantId, studyId);
    await this.history(tenantId, studyId, actorId, 'SCENARIO_UPDATED', `${updated.scenario_number} updated`, updated.deviation_text ?? updated.cause, { scenarioId, before, patch });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SCENARIO_UPDATED', entityType: 'hazop_scenarios', entityId: scenarioId, before: before as JsonValue, after: updated as JsonValue });
    await this.indexHazopScenario(tenantId, study, node, updated);
    return updated;
  }

  async deleteScenario(tenantId: string, actorId: string, studyId: string, scenarioId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const scenario = await this.scenario(tenantId, studyId, scenarioId);
    await this.db.single(this.db.from('hazop_scenarios').delete().eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', scenarioId));
    await this.refreshStudyProgress(tenantId, studyId);
    await this.history(tenantId, studyId, actorId, 'SCENARIO_DELETED', `${scenario.scenario_number} deleted`, scenario.deviation_text ?? scenario.cause, { scenarioId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SCENARIO_DELETED', entityType: 'hazop_scenarios', entityId: scenarioId, before: scenario as JsonValue });
    await this.searchIndex.removeRecord(tenantId, 'hazop', scenarioId);
    return { deleted: true };
  }

  async duplicateScenario(tenantId: string, actorId: string, studyId: string, scenarioId: string, scope: Scope) {
    const source = await this.scenario(tenantId, studyId, scenarioId);
    const scenario = await this.addScenario(tenantId, actorId, studyId, {
      nodeId: source.node_id,
      guideword: source.guideword,
      parameter: source.parameter,
      deviationText: source.deviation_text,
      cause: source.cause,
      consequence: source.consequence,
      existingSafeguards: source.existing_safeguards,
      severity: source.severity,
      likelihood: source.likelihood,
      residualSeverity: source.residual_severity,
      residualLikelihood: source.residual_likelihood,
      ownerId: source.owner_id,
      notes: source.notes,
      status: 'Draft'
    }, scope);
    await this.history(tenantId, studyId, actorId, 'SCENARIO_DUPLICATED', `${source.scenario_number} duplicated`, `${scenario.scenario_number} created`, { scenarioId: scenario.id, sourceScenarioId: source.id });
    return scenario;
  }

  async bulkGenerateScenarios(tenantId: string, actorId: string, studyId: string, dto: BulkGenerateHazopScenariosDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const node = await this.node(tenantId, studyId, dto.nodeId);
    const existing = await this.db.many<any>(this.db.from('hazop_scenarios').select('guideword,parameter').eq('tenant_id', tenantId).eq('study_id', studyId).eq('node_id', dto.nodeId));
    const existingKeys = new Set(existing.map((row) => `${row.guideword}::${row.parameter}`.toLowerCase()));
    const pairs = this.generateDeviationPairs(dto.guidewords, dto.parameters, dto.mode ?? 'all').filter((pair) => !existingKeys.has(`${pair.guideword}::${pair.parameter}`.toLowerCase()));
    const created = [];
    for (const pair of pairs) {
      created.push(await this.addScenario(tenantId, actorId, studyId, {
        nodeId: dto.nodeId,
        guideword: pair.guideword,
        parameter: pair.parameter,
        deviationText: this.deviationText(pair.guideword, pair.parameter) ?? `${pair.guideword} ${pair.parameter}`,
        cause: 'To be defined',
        consequence: 'To be defined',
        severity: 1,
        likelihood: 1,
        status: 'Draft'
      }, scope));
    }
    await this.history(tenantId, studyId, actorId, 'SCENARIOS_BULK_GENERATED', `${created.length} deviations generated`, `Bulk generated for ${node.node_number}`, { nodeId: node.id, mode: dto.mode, count: created.length });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SCENARIOS_BULK_GENERATED', entityType: 'hazop_scenarios', entityId: studyId, after: { nodeId: node.id, count: created.length } as JsonValue });
    return created;
  }

  async markScenarioLopaRequired(tenantId: string, actorId: string, studyId: string, scenarioId: string, reason: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.scenario(tenantId, study.id, scenarioId);
    const scenario = await this.db.single<any>(this.db.from('hazop_scenarios').update({
      lopa_required: true,
      lopa_trigger_reason: reason,
      lopa_trigger_source: 'Manual Review',
      lopa_triggered_by: actorId,
      lopa_triggered_at: new Date().toISOString(),
      status: 'LOPA Required',
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', scenarioId).select().single());
    await this.writeRiskHistory(tenantId, study.id, scenarioId, actorId, 'LOPA Required', before, scenario, reason);
    await this.refreshStudyProgress(tenantId, study.id);
    await this.history(tenantId, studyId, actorId, 'LOPA_REQUIRED', `${scenario.scenario_number} marked LOPA required`, reason, { scenarioId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_LOPA_REQUIRED', entityType: 'hazop_scenarios', entityId: scenarioId, before: before as JsonValue, after: scenario as JsonValue });
    return scenario;
  }

  async setScenarioStatus(tenantId: string, actorId: string, studyId: string, scenarioId: string, status: string, scope: Scope) {
    const scenario = await this.updateScenario(tenantId, actorId, studyId, scenarioId, { status } as CreateHazopScenarioDto, scope);
    await this.history(tenantId, studyId, actorId, `SCENARIO_${status.toUpperCase().replace(/\s+/g, '_')}`, `${scenario.scenario_number} ${status}`, scenario.deviation_text ?? scenario.cause, { scenarioId });
    return scenario;
  }

  async safeguardsContext(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [nodes, scenarios, equipment, documents, users] = await Promise.all([
      this.db.many<any>(this.db.from('hazop_nodes').select('id,node_number,title').eq('tenant_id', tenantId).eq('study_id', study.id).order('sort_order')),
      this.db.many<any>(this.db.from('hazop_scenarios').select('id,scenario_number,row_number,node_id,guideword,parameter,deviation_text,cause,consequence,risk_level').eq('tenant_id', tenantId).eq('study_id', study.id).order('row_number')),
      this.safeMany<any>(this.applyScope(this.db.from('Equipment').select('id,tag,name,type,status,criticality,siteId,unitId,areaId').eq('tenantId', tenantId), scope, 'siteId').order('tag').limit(500)),
      this.safeMany<any>(this.db.from('documents').select('id,document_number,title,document_type,status,current_version_id,revision').eq('tenant_id', tenantId).order('title').limit(500)),
      this.db.many<any>(this.db.from('User').select('id,displayName,email,title,status').eq('tenantId', tenantId).order('displayName'))
    ]);
    return { study, nodes, scenarios, equipment, documents, users, safeguardTypes: this.safeguardTypes(), iplCriteria: this.iplCriteria(), sitePolicies: { triggerLopaForIpl: true, allowAdministrativeIpl: false } };
  }

  async safeguardsSummary(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [safeguards, gaps, tests, scenarios] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_scenario_safeguards').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_safeguard_gaps').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_safeguard_test_status').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.db.many<any>(this.db.from('hazop_scenarios').select('id,lopa_required').eq('tenant_id', tenantId).eq('study_id', study.id))
    ]);
    return {
      totalSafeguards: safeguards.length,
      creditedSafeguards: safeguards.filter((s) => s.credited_for_risk_reduction).length,
      nonCreditedSafeguards: safeguards.filter((s) => !s.credited_for_risk_reduction).length,
      iplCandidates: safeguards.filter((s) => s.ipl_candidate).length,
      iplValidated: safeguards.filter((s) => s.ipl_validation_status === 'Passed').length,
      iplFailed: safeguards.filter((s) => ['Failed', 'Not eligible as IPL'].includes(s.ipl_validation_status)).length,
      safeguardGaps: gaps.filter((g) => g.status !== 'Closed').length,
      actionsOpen: gaps.filter((g) => g.linked_action_id && g.status !== 'Closed').length,
      proofTestsOverdue: tests.filter((t) => t.status === 'Overdue').length,
      lopaRequiredScenarios: scenarios.filter((s) => s.lopa_required).length
    };
  }

  async safeguardsRegister(tenantId: string, studyId: string, query: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [safeguards, scenarios, nodes, gaps, tests, equipment, documents] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_scenario_safeguards').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('updated_at', { ascending: false })),
      this.db.many<any>(this.db.from('hazop_scenarios').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.db.many<any>(this.db.from('hazop_nodes').select('id,node_number,title').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_safeguard_gaps').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_safeguard_test_status').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('Equipment').select('id,tag,name,type,status,criticality,siteId,unitId,areaId').eq('tenantId', tenantId)),
      this.safeMany<any>(this.db.from('documents').select('id,document_number,title,document_type,status,current_version_id,revision').eq('tenant_id', tenantId))
    ]);
    const search = String(query.search ?? '').trim().toLowerCase();
    let rows = safeguards.map((s) => {
      const scenario = scenarios.find((r) => r.id === s.scenario_id);
      const node = nodes.find((n) => n.id === s.node_id || n.id === scenario?.node_id);
      const openGaps = gaps.filter((g) => g.safeguard_id === s.id && g.status !== 'Closed');
      const testStatus = tests.find((t) => t.safeguard_id === s.id);
      return {
        ...s,
        scenario,
        node,
        gapCount: openGaps.length,
        gapStatus: openGaps.length ? 'Open' : 'None',
        testStatus,
        equipment: equipment.find((e) => e.id === s.equipment_id),
        document: documents.find((d) => d.id === s.document_id)
      };
    });
    if (query.nodeId) rows = rows.filter((r) => r.node_id === query.nodeId || r.scenario?.node_id === query.nodeId);
    if (query.scenarioId) rows = rows.filter((r) => r.scenario_id === query.scenarioId);
    if (query.safeguardType) rows = rows.filter((r) => r.safeguard_type === query.safeguardType);
    if (query.riskLevel) rows = rows.filter((r) => r.scenario?.risk_level === query.riskLevel);
    if (query.iplCandidate !== undefined && query.iplCandidate !== 'All') rows = rows.filter((r) => r.ipl_candidate === (query.iplCandidate === 'true' || query.iplCandidate === 'Yes'));
    if (query.credited !== undefined && query.credited !== 'All') rows = rows.filter((r) => r.credited_for_risk_reduction === (query.credited === 'true' || query.credited === 'Yes'));
    if (query.validationStatus) rows = rows.filter((r) => r.ipl_validation_status === query.validationStatus);
    if (query.proofTestStatus) rows = rows.filter((r) => r.testStatus?.status === query.proofTestStatus || r.proof_test_status === query.proofTestStatus);
    if (query.gapStatus) rows = rows.filter((r) => r.gapStatus === query.gapStatus);
    if (search) rows = rows.filter((r) => [r.safeguard_number, r.safeguard_name, r.safeguard_type, r.description, r.equipment?.tag, r.document?.document_number, r.scenario?.deviation_text, r.scenario?.cause, r.scenario?.consequence].filter(Boolean).join(' ').toLowerCase().includes(search));
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit };
  }

  async safeguardsIplCandidates(tenantId: string, studyId: string, scope: Scope) {
    const register = await this.safeguardsRegister(tenantId, studyId, { iplCandidate: 'true', limit: 100 }, scope);
    return register.rows;
  }

  async safeguardGaps(tenantId: string, studyId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    return this.safeMany<any>(this.db.from('hazop_safeguard_gaps').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).order('updated_at', { ascending: false }));
  }

  async safeguardProofTests(tenantId: string, studyId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    return this.safeMany<any>(this.db.from('hazop_safeguard_test_status').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).order('next_test_due_date'));
  }

  async safeguardDetail(tenantId: string, studyId: string, safeguardId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    const safeguard = await this.enhancedSafeguard(tenantId, studyId, safeguardId);
    const [validation, equipmentLinks, documentLinks, testStatus, gaps, history] = await Promise.all([
      this.safeguardIplValidation(tenantId, studyId, safeguardId, scope),
      this.safeMany<any>(this.db.from('hazop_safeguard_equipment_links').select('*').eq('tenant_id', tenantId).eq('safeguard_id', safeguardId)),
      this.safeMany<any>(this.db.from('hazop_safeguard_document_links').select('*').eq('tenant_id', tenantId).eq('safeguard_id', safeguardId)),
      this.safeguardTestStatus(tenantId, studyId, safeguardId, scope),
      this.safeMany<any>(this.db.from('hazop_safeguard_gaps').select('*').eq('tenant_id', tenantId).eq('safeguard_id', safeguardId).order('created_at', { ascending: false })),
      this.db.many<any>(this.db.from('hazop_history_events').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).contains('metadata', { safeguardId }).order('created_at', { ascending: false }))
    ]);
    return { ...safeguard, validation, equipmentLinks, documentLinks, testStatus, gaps, history };
  }

  async addScenarioSafeguard(tenantId: string, actorId: string, studyId: string, scenarioId: string, dto: HazopSafeguardDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const scenario = await this.scenario(tenantId, study.id, scenarioId);
    const count = await this.count('hazop_scenario_safeguards', tenantId, 'study_id', study.id);
    const safeguard = await this.db.single<any>(this.db.from('hazop_scenario_safeguards').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      node_id: scenario.node_id,
      scenario_id: scenario.id,
      safeguard_number: `SG-${String(count + 1).padStart(3, '0')}`,
      safeguard_name: dto.safeguardName ?? dto.description.slice(0, 80),
      safeguard_type: dto.safeguardType ?? 'Other',
      safeguard_category: dto.safeguardCategory ?? 'Prevention',
      description: dto.description,
      existing_or_proposed: dto.existingOrProposed ?? 'Existing',
      credited_for_risk_reduction: dto.creditedForRiskReduction ?? false,
      ipl_candidate: dto.iplCandidate ?? false,
      ipl_validation_status: dto.iplCandidate ? 'Needs evidence' : 'Not validated',
      equipment_id: dto.equipmentId ?? null,
      document_id: dto.documentId ?? null,
      document_version_id: dto.documentVersionId ?? null,
      owner_id: dto.ownerId ?? null,
      proof_test_required: dto.proofTestRequired ?? false,
      inspection_required: dto.inspectionRequired ?? false,
      evidence_required: dto.evidenceRequired ?? false,
      proof_test_status: dto.proofTestRequired || dto.inspectionRequired ? 'Needs Schedule' : 'Not Required',
      safety_system_type: dto.safetySystemType ?? null,
      sif_tag: dto.sifTag ?? null,
      interlock_id: dto.interlockId ?? null,
      trip_setpoint: dto.tripSetpoint ?? null,
      final_element: dto.finalElement ?? null,
      sensor_transmitter: dto.sensorTransmitter ?? null,
      logic_solver: dto.logicSolver ?? null,
      target_sil: dto.targetSil ?? null,
      proof_test_interval: dto.proofTestInterval ?? null,
      notes: dto.notes ?? null,
      created_by: actorId,
      updated_by: actorId
    }).select().single());
    await this.upsertSafeguardTestStatus(tenantId, study, safeguard, actorId, dto);
    if (safeguard.equipment_id) await this.linkSafeguardEquipment(tenantId, actorId, study.id, safeguard.id, { id: safeguard.equipment_id, linkType: 'Protected equipment' }, scope);
      if (safeguard.document_id) {
        const documentLink: HazopSafeguardLinkDto = { id: safeguard.document_id, documentType: 'Evidence' };
        if (safeguard.document_version_id) documentLink.documentVersionId = safeguard.document_version_id;
        await this.linkSafeguardDocument(tenantId, actorId, study.id, safeguard.id, documentLink, scope);
      }
    if (safeguard.ipl_candidate || safeguard.credited_for_risk_reduction || this.isSafetyInstrumentedSafeguard(safeguard)) await this.markScenarioLopaRequired(tenantId, actorId, study.id, scenario.id, 'IPL candidate / credited safeguard requires LOPA/SIL review', scope);
    await this.syncScenarioSafeguardCounters(tenantId, study.id, scenario.id);
    await this.history(tenantId, study.id, actorId, 'SAFEGUARD_CREATED', `${safeguard.safeguard_number} created`, safeguard.safeguard_name, { scenarioId, safeguardId: safeguard.id });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SAFEGUARD_CREATED', entityType: 'hazop_scenario_safeguards', entityId: safeguard.id, after: safeguard as JsonValue });
    await this.indexHazopSafeguard(tenantId, study, scenario, safeguard);
    return safeguard;
  }

  async getScenarioSafeguards(tenantId: string, studyId: string, scenarioId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    await this.scenario(tenantId, studyId, scenarioId);
    return this.safeMany<any>(this.db.from('hazop_scenario_safeguards').select('*').eq('tenant_id', tenantId).eq('scenario_id', scenarioId).order('created_at'));
  }

  async updateScenarioSafeguard(tenantId: string, actorId: string, studyId: string, scenarioId: string, safeguardId: string, dto: HazopSafeguardDto, scope: Scope) {
    return this.updateEnhancedSafeguard(tenantId, actorId, studyId, safeguardId, dto, scope);
  }

  async deleteScenarioSafeguard(tenantId: string, actorId: string, studyId: string, scenarioId: string, safeguardId: string, scope: Scope) {
    return this.deleteEnhancedSafeguard(tenantId, actorId, studyId, safeguardId, scope);
  }

  async updateEnhancedSafeguard(tenantId: string, actorId: string, studyId: string, safeguardId: string, dto: HazopSafeguardDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.enhancedSafeguard(tenantId, study.id, safeguardId);
    const patch: Record<string, unknown> = { updated_by: actorId, updated_at: new Date().toISOString() };
    if (dto.safeguardName !== undefined) patch.safeguard_name = dto.safeguardName;
    if (dto.safeguardType !== undefined) patch.safeguard_type = dto.safeguardType;
    if (dto.safeguardCategory !== undefined) patch.safeguard_category = dto.safeguardCategory;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.existingOrProposed !== undefined) patch.existing_or_proposed = dto.existingOrProposed;
    if (dto.creditedForRiskReduction !== undefined) patch.credited_for_risk_reduction = dto.creditedForRiskReduction;
    if (dto.iplCandidate !== undefined) patch.ipl_candidate = dto.iplCandidate;
    if (dto.equipmentId !== undefined) patch.equipment_id = dto.equipmentId || null;
    if (dto.documentId !== undefined) patch.document_id = dto.documentId || null;
    if (dto.documentVersionId !== undefined) patch.document_version_id = dto.documentVersionId || null;
    if (dto.ownerId !== undefined) patch.owner_id = dto.ownerId || null;
    if (dto.proofTestRequired !== undefined) patch.proof_test_required = dto.proofTestRequired;
    if (dto.inspectionRequired !== undefined) patch.inspection_required = dto.inspectionRequired;
    if (dto.evidenceRequired !== undefined) patch.evidence_required = dto.evidenceRequired;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    for (const [dtoKey, dbKey] of Object.entries({ safetySystemType: 'safety_system_type', sifTag: 'sif_tag', interlockId: 'interlock_id', tripSetpoint: 'trip_setpoint', finalElement: 'final_element', sensorTransmitter: 'sensor_transmitter', logicSolver: 'logic_solver', targetSil: 'target_sil', proofTestInterval: 'proof_test_interval' })) {
      if ((dto as any)[dtoKey] !== undefined) patch[dbKey] = (dto as any)[dtoKey] || null;
    }
    if (dto.iplCandidate) patch.ipl_validation_status = before.ipl_validation_status === 'Not validated' ? 'Needs evidence' : before.ipl_validation_status;
    const updated = await this.db.single<any>(this.db.from('hazop_scenario_safeguards').update(patch).eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', safeguardId).select().single());
    await this.upsertSafeguardTestStatus(tenantId, study, updated, actorId, dto);
    if (updated.ipl_candidate || updated.credited_for_risk_reduction || this.isSafetyInstrumentedSafeguard(updated)) await this.markScenarioLopaRequired(tenantId, actorId, study.id, updated.scenario_id, 'Credited/IPL safeguard update requires LOPA/SIL review', scope);
    await this.syncScenarioSafeguardCounters(tenantId, study.id, updated.scenario_id);
    await this.history(tenantId, study.id, actorId, 'SAFEGUARD_UPDATED', `${updated.safeguard_number} updated`, updated.safeguard_name, { safeguardId, before, patch });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SAFEGUARD_UPDATED', entityType: 'hazop_scenario_safeguards', entityId: safeguardId, before: before as JsonValue, after: updated as JsonValue });
    await this.indexHazopSafeguard(tenantId, study, await this.scenario(tenantId, study.id, updated.scenario_id), updated);
    return updated;
  }

  async deleteEnhancedSafeguard(tenantId: string, actorId: string, studyId: string, safeguardId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const safeguard = await this.enhancedSafeguard(tenantId, study.id, safeguardId);
    await this.db.single(this.db.from('hazop_scenario_safeguards').delete().eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', safeguardId).select().single());
    await this.syncScenarioSafeguardCounters(tenantId, study.id, safeguard.scenario_id);
    await this.history(tenantId, study.id, actorId, 'SAFEGUARD_DELETED', `${safeguard.safeguard_number} deleted`, safeguard.safeguard_name, { safeguardId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SAFEGUARD_DELETED', entityType: 'hazop_scenario_safeguards', entityId: safeguardId, before: safeguard as JsonValue });
    await this.searchIndex.removeRecord(tenantId, 'hazop', safeguardId);
    return { deleted: true };
  }

  async markSafeguardIplCandidate(tenantId: string, actorId: string, studyId: string, safeguardId: string, scope: Scope) {
    const updated = await this.updateEnhancedSafeguard(tenantId, actorId, studyId, safeguardId, { iplCandidate: true, creditedForRiskReduction: true } as HazopSafeguardDto, scope);
    await this.history(tenantId, studyId, actorId, 'IPL_CANDIDATE_MARKED', `${updated.safeguard_number} marked IPL candidate`, updated.safeguard_name, { safeguardId });
    return updated;
  }

  async setSafeguardCredited(tenantId: string, actorId: string, studyId: string, safeguardId: string, credited: boolean, scope: Scope) {
    return this.updateEnhancedSafeguard(tenantId, actorId, studyId, safeguardId, { creditedForRiskReduction: credited } as HazopSafeguardDto, scope);
  }

  async safeguardIplValidation(tenantId: string, studyId: string, safeguardId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    const validation = await this.db.single<any>(this.db.from('hazop_ipl_validations').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('safeguard_id', safeguardId).order('created_at', { ascending: false }).limit(1).maybeSingle());
    const items = validation ? await this.safeMany<any>(this.db.from('hazop_ipl_validation_items').select('*').eq('tenant_id', tenantId).eq('validation_id', validation.id).order('created_at')) : [];
    return validation ? { ...validation, items } : { validation_status: 'Not validated', items: this.iplCriteria().map((c) => ({ ...c, result: 'Not Applicable' })) };
  }

  async createIplValidation(tenantId: string, actorId: string, studyId: string, safeguardId: string, dto: HazopIplValidationDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const safeguard = await this.enhancedSafeguard(tenantId, study.id, safeguardId);
    const result = this.evaluateIpl(dto.items ?? [], safeguard);
    const validation = await this.db.single<any>(this.db.from('hazop_ipl_validations').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      scenario_id: safeguard.scenario_id,
      safeguard_id: safeguard.id,
      validation_status: result.status,
      validation_summary: dto.validationSummary ?? result.summary,
      validated_by: actorId,
      validated_at: new Date().toISOString(),
      failed_criteria_count: result.failed,
      passed_criteria_count: result.passed,
      lopa_required_triggered: result.lopaRequired,
      lopa_trigger_reason: result.lopaReason
    }).select().single());
    for (const item of this.normalizedIplItems(dto.items ?? [])) {
      await this.db.single(this.db.from('hazop_ipl_validation_items').insert({ ...item, id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, validation_id: validation.id, verified_by: actorId, verified_at: new Date().toISOString() }).select().single());
    }
    await this.db.single(this.db.from('hazop_scenario_safeguards').update({ ipl_validation_status: result.status, credited_for_risk_reduction: result.status === 'Passed' ? true : safeguard.credited_for_risk_reduction, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', safeguard.id).select().single());
    if (result.status !== 'Passed') await this.createSafeguardGap(tenantId, actorId, study.id, safeguard.id, { gapType: 'IPL failed validation', gapDescription: result.summary, severity: result.status === 'Not eligible as IPL' ? 'High' : 'Medium', ownerId: safeguard.owner_id ?? undefined } as HazopSafeguardGapDto, scope);
    if (result.lopaRequired) await this.markScenarioLopaRequired(tenantId, actorId, study.id, safeguard.scenario_id, result.lopaReason, scope);
    await this.syncScenarioSafeguardCounters(tenantId, study.id, safeguard.scenario_id);
    await this.history(tenantId, study.id, actorId, 'IPL_VALIDATED', `${safeguard.safeguard_number} IPL ${result.status}`, result.summary, { safeguardId, validationId: validation.id });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_IPL_VALIDATED', entityType: 'hazop_ipl_validations', entityId: validation.id, after: validation as JsonValue });
    return this.safeguardIplValidation(tenantId, study.id, safeguard.id, scope);
  }

  async updateIplValidation(tenantId: string, actorId: string, studyId: string, safeguardId: string, validationId: string, dto: HazopIplValidationDto, scope: Scope) {
    return this.createIplValidation(tenantId, actorId, studyId, safeguardId, dto, scope);
  }

  async finalizeIplValidation(tenantId: string, actorId: string, studyId: string, safeguardId: string, validationId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    const validation = await this.db.single<any>(this.db.from('hazop_ipl_validations').select('*').eq('tenant_id', tenantId).eq('id', validationId).eq('safeguard_id', safeguardId).maybeSingle());
    if (!validation) throw new NotFoundException('IPL validation not found');
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_IPL_VALIDATION_FINALIZED', entityType: 'hazop_ipl_validations', entityId: validationId, after: validation as JsonValue });
    await this.history(tenantId, studyId, actorId, 'IPL_VALIDATION_FINALIZED', 'IPL validation finalized', validation.validation_status, { safeguardId, validationId });
    return validation;
  }

  async linkSafeguardEquipment(tenantId: string, actorId: string, studyId: string, safeguardId: string, dto: HazopSafeguardLinkDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const safeguard = await this.enhancedSafeguard(tenantId, study.id, safeguardId);
    const link = await this.db.single<any>(this.db.from('hazop_safeguard_equipment_links').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, safeguard_id: safeguard.id, equipment_id: dto.id, link_type: dto.linkType ?? 'Protected equipment' }).select().single());
    await this.db.single(this.db.from('hazop_scenario_safeguards').update({ equipment_id: dto.id, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', safeguard.id).select().single());
    await this.history(tenantId, study.id, actorId, 'SAFEGUARD_EQUIPMENT_LINKED', 'Equipment linked to safeguard', dto.id, { safeguardId, linkId: link.id });
    return link;
  }

  async linkSafeguardDocument(tenantId: string, actorId: string, studyId: string, safeguardId: string, dto: HazopSafeguardLinkDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const safeguard = await this.enhancedSafeguard(tenantId, study.id, safeguardId);
    const link = await this.db.single<any>(this.db.from('hazop_safeguard_document_links').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, safeguard_id: safeguard.id, document_id: dto.id, document_version_id: dto.documentVersionId ?? null, document_type: dto.documentType ?? 'Evidence' }).select().single());
    await this.db.single(this.db.from('hazop_scenario_safeguards').update({ document_id: dto.id, document_version_id: dto.documentVersionId ?? null, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', safeguard.id).select().single());
    await this.history(tenantId, study.id, actorId, 'SAFEGUARD_DOCUMENT_LINKED', 'Document linked to safeguard', dto.id, { safeguardId, linkId: link.id });
    return link;
  }

  async unlinkSafeguardLink(tenantId: string, actorId: string, studyId: string, safeguardId: string, linkId: string, type: 'equipment' | 'document', scope: Scope) {
    await this.study(tenantId, studyId, scope);
    const table = type === 'equipment' ? 'hazop_safeguard_equipment_links' : 'hazop_safeguard_document_links';
    await this.db.single(this.db.from(table).delete().eq('tenant_id', tenantId).eq('safeguard_id', safeguardId).eq('id', linkId).select().single());
    await this.history(tenantId, studyId, actorId, `SAFEGUARD_${type.toUpperCase()}_UNLINKED`, `${type} link removed`, linkId, { safeguardId, linkId });
    return { deleted: true };
  }

  async safeguardTestStatus(tenantId: string, studyId: string, safeguardId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    return this.db.single<any>(this.db.from('hazop_safeguard_test_status').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('safeguard_id', safeguardId).maybeSingle());
  }

  async updateSafeguardTestStatus(tenantId: string, actorId: string, studyId: string, safeguardId: string, dto: HazopSafeguardTestStatusDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const safeguard = await this.enhancedSafeguard(tenantId, study.id, safeguardId);
    const status = dto.status ?? this.testStatusFromDueDate(dto.nextTestDueDate, Boolean(dto.proofTestRequired || dto.inspectionRequired));
    await this.upsertSafeguardTestStatus(tenantId, study, { ...safeguard, proof_test_required: dto.proofTestRequired ?? safeguard.proof_test_required, inspection_required: dto.inspectionRequired ?? safeguard.inspection_required }, actorId, { ...dto, status } as any);
    if (status === 'Overdue') {
      const gapDto: HazopSafeguardGapDto = { gapType: 'Proof test overdue', gapDescription: `${safeguard.safeguard_name} proof test or inspection is overdue`, severity: safeguard.ipl_candidate ? 'High' : 'Medium' };
      const ownerId = dto.ownerId ?? safeguard.owner_id;
      if (ownerId) gapDto.ownerId = ownerId;
      await this.createSafeguardGap(tenantId, actorId, study.id, safeguard.id, gapDto, scope);
    }
    await this.history(tenantId, study.id, actorId, 'SAFEGUARD_TEST_STATUS_UPDATED', 'Proof test / inspection updated', status, { safeguardId });
    return this.safeguardTestStatus(tenantId, study.id, safeguard.id, scope);
  }

  async createSafeguardGap(tenantId: string, actorId: string, studyId: string, safeguardId: string, dto: HazopSafeguardGapDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const safeguard = await this.enhancedSafeguard(tenantId, study.id, safeguardId);
    const gap = await this.db.single<any>(this.db.from('hazop_safeguard_gaps').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, node_id: safeguard.node_id, scenario_id: safeguard.scenario_id, safeguard_id: safeguard.id, gap_type: dto.gapType, gap_description: dto.gapDescription, severity: dto.severity ?? 'Medium', owner_id: dto.ownerId ?? safeguard.owner_id ?? null, due_date: dto.dueDate ?? null, created_by: actorId }).select().single());
    await this.db.single(this.db.from('hazop_scenario_safeguards').update({ gap_status: 'Open', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', safeguard.id).select().single());
    await this.syncScenarioSafeguardCounters(tenantId, study.id, safeguard.scenario_id);
    await this.history(tenantId, study.id, actorId, 'SAFEGUARD_GAP_CREATED', `${gap.gap_type} gap created`, gap.gap_description, { safeguardId, gapId: gap.id });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SAFEGUARD_GAP_CREATED', entityType: 'hazop_safeguard_gaps', entityId: gap.id, after: gap as JsonValue });
    return gap;
  }

  async updateSafeguardGap(tenantId: string, actorId: string, studyId: string, gapId: string, dto: HazopSafeguardGapDto, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    const updated = await this.db.single<any>(this.db.from('hazop_safeguard_gaps').update({ gap_type: dto.gapType, gap_description: dto.gapDescription, severity: dto.severity ?? 'Medium', owner_id: dto.ownerId ?? null, due_date: dto.dueDate ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', gapId).select().single());
    await this.history(tenantId, studyId, actorId, 'SAFEGUARD_GAP_UPDATED', 'Safeguard gap updated', updated.gap_description, { gapId });
    return updated;
  }

  async createSafeguardGapAction(tenantId: string, actorId: string, studyId: string, gapId: string, dto: HazopSafeguardActionDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const gap = await this.db.single<any>(this.db.from('hazop_safeguard_gaps').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', gapId).maybeSingle());
    if (!gap) throw new NotFoundException('Safeguard gap not found');
    if (!dto.ownerId && !gap.owner_id) throw new BadRequestException('Owner is required before creating an action');
    const action = await this.actions.create(tenantId, actorId, { title: `${gap.gap_type}: HAZOP safeguard gap`, description: gap.gap_description, sourceModule: 'HAZOP', sourceType: 'hazop_safeguard_gap', sourceRecordId: gap.id, ownerId: dto.ownerId ?? gap.owner_id, priority: gap.severity === 'Critical' ? 'SAFETY_CRITICAL' : gap.severity === 'High' ? 'HIGH' : gap.severity === 'Low' ? 'LOW' : 'MEDIUM', dueDate: dto.dueDate ?? gap.due_date ?? this.plusDays(14), siteId: study.site_id ?? undefined, evidenceRequired: true, verificationRequired: true });
    await this.linkSafeguardGapAction(tenantId, actorId, study.id, gap.id, { actionId: action.id }, scope);
    return action;
  }

  async linkSafeguardGapAction(tenantId: string, actorId: string, studyId: string, gapId: string, dto: HazopSafeguardActionDto, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    if (!dto.actionId) throw new BadRequestException('Action ID is required');
    const gap = await this.db.single<any>(this.db.from('hazop_safeguard_gaps').update({ linked_action_id: dto.actionId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', gapId).select().single());
    await this.db.single(this.db.from('hazop_scenario_safeguards').update({ action_status: 'Linked', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', gap.safeguard_id).select().single());
    await this.history(tenantId, studyId, actorId, 'SAFEGUARD_GAP_ACTION_LINKED', 'Action linked to safeguard gap', dto.actionId, { gapId, actionId: dto.actionId });
    return gap;
  }

  async closeSafeguardGap(tenantId: string, actorId: string, studyId: string, gapId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    const gap = await this.db.single<any>(this.db.from('hazop_safeguard_gaps').update({ status: 'Closed', closed_by: actorId, closed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', gapId).select().single());
    await this.syncScenarioSafeguardCounters(tenantId, studyId, gap.scenario_id);
    await this.history(tenantId, studyId, actorId, 'SAFEGUARD_GAP_CLOSED', 'Safeguard gap closed', gap.gap_description, { gapId });
    return gap;
  }

  async exportSafeguards(tenantId: string, actorId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const register = await this.safeguardsRegister(tenantId, study.id, { limit: 1000 }, scope);
    const headers = ['Study', 'Scenario', 'Node', 'Safeguard', 'Type', 'Description', 'Credited', 'IPL Candidate', 'IPL Status', 'Equipment', 'Document', 'Proof Test', 'Gap Status', 'Owner', 'Updated'];
    const rows = register.rows.map((row: any) => [study.study_number, row.scenario?.scenario_number, row.node?.node_number, row.safeguard_name, row.safeguard_type, row.description, row.credited_for_risk_reduction ? 'Yes' : 'No', row.ipl_candidate ? 'Yes' : 'No', row.ipl_validation_status, row.equipment?.tag ?? row.equipment_id ?? '', row.document?.document_number ?? row.document_id ?? '', row.testStatus?.status ?? row.proof_test_status, row.gapStatus, row.owner_id ?? '', row.updated_at]);
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SAFEGUARDS_EXPORTED', entityType: 'hazop_studies', entityId: study.id, after: { rows: rows.length } as JsonValue });
    return { fileName: `${study.study_number}-safeguards-register.csv`, contentType: 'text/csv', content: [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n') };
  }

  async recommendationsContext(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [nodes, scenarios, safeguards, users, departments, actions] = await Promise.all([
      this.db.many<any>(this.db.from('hazop_nodes').select('id,node_number,title').eq('tenant_id', tenantId).eq('study_id', study.id).order('sort_order')),
      this.db.many<any>(this.db.from('hazop_scenarios').select('id,scenario_number,node_id,guideword,parameter,deviation_text,cause,consequence,risk_level,lopa_required,recommendation_required').eq('tenant_id', tenantId).eq('study_id', study.id).order('scenario_number')),
      this.safeMany<any>(this.db.from('hazop_scenario_safeguards').select('id,safeguard_number,safeguard_name,scenario_id,ipl_validation_status').eq('tenant_id', tenantId).eq('study_id', study.id).order('safeguard_number')),
      this.db.many<any>(this.db.from('User').select('id,displayName,email,title,status').eq('tenantId', tenantId).order('displayName')),
      this.safeMany<any>(this.db.from('Department').select('id,name,siteId').eq('tenantId', tenantId).order('name')),
      this.safeMany<any>(this.db.from('Action').select('id,actionNumber,title,status,assignedToId,dueDate,priority,sourceId').eq('tenantId', tenantId).eq('moduleKey', 'HAZOP').order('dueDate').limit(500))
    ]);
    return { study, nodes, scenarios, safeguards, users, departments, actions, sitePolicies: { independentVerifier: true, closureBlockHighCritical: true, evidenceRequiredForCritical: true } };
  }

  async recommendationsSummary(tenantId: string, studyId: string, scope: Scope) {
    const rows = await this.recommendationRows(tenantId, studyId, {}, scope);
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: rows.length,
      draft: rows.filter((r) => r.status === 'Draft').length,
      open: rows.filter((r) => ['Open', 'Assigned'].includes(r.status)).length,
      inProgress: rows.filter((r) => r.status === 'In Progress').length,
      pendingVerification: rows.filter((r) => r.status === 'Pending Verification').length,
      closed: rows.filter((r) => r.status === 'Verified Closed').length,
      overdue: rows.filter((r) => this.isRecommendationOverdue(r, today)).length,
      highPriority: rows.filter((r) => ['High', 'Critical', 'Safety Critical'].includes(r.priority)).length,
      criticalRiskLinked: rows.filter((r) => ['High', 'Critical'].includes(r.scenario?.risk_level)).length,
      lopaRelated: rows.filter((r) => r.lopa_related).length,
      actionsCreated: rows.filter((r) => r.linked_action_id || r.action_id).length,
      closureBlockers: rows.filter((r) => this.isRecommendationClosureBlocker(r, today)).length
    };
  }

  async recommendationsRegister(tenantId: string, studyId: string, query: Record<string, any>, scope: Scope) {
    const rows = await this.recommendationRows(tenantId, studyId, query, scope);
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit };
  }

  async overdueRecommendations(tenantId: string, studyId: string, scope: Scope) {
    const today = new Date().toISOString().slice(0, 10);
    return (await this.recommendationRows(tenantId, studyId, {}, scope)).filter((r) => this.isRecommendationOverdue(r, today));
  }

  async recommendationClosureBlockers(tenantId: string, studyId: string, scope: Scope) {
    const today = new Date().toISOString().slice(0, 10);
    return (await this.recommendationRows(tenantId, studyId, {}, scope)).filter((r) => this.isRecommendationClosureBlocker(r, today));
  }

  async addRecommendation(tenantId: string, actorId: string, studyId: string, dto: CreateHazopRecommendationDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    this.validateRecommendationDto(dto);
    const scenario = dto.scenarioId ? await this.scenario(tenantId, study.id, dto.scenarioId) : null;
    const count = await this.count('hazop_recommendations', tenantId, 'study_id', study.id);
    const priority = dto.priority;
    const text = dto.recommendationText ?? dto.description ?? dto.title ?? 'Recommendation';
    const status = dto.status ?? (dto.ownerId ? 'Assigned' : 'Open');
    const closureBlocker = dto.closureBlocker ?? (['High', 'Critical', 'Safety Critical'].includes(priority) || ['High', 'Critical'].includes(scenario?.risk_level));
    const verificationRequired = dto.verificationRequired ?? ['High', 'Critical', 'Safety Critical'].includes(priority);
    const evidenceRequired = dto.evidenceRequired ?? ['Critical', 'Safety Critical'].includes(priority);
    const recommendation = await this.db.single<any>(this.db.from('hazop_recommendations').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      node_id: dto.nodeId ?? scenario?.node_id ?? null,
      scenario_id: dto.scenarioId ?? null,
      safeguard_id: dto.safeguardId ?? null,
      risk_assessment_id: dto.riskAssessmentId ?? null,
      lopa_trigger_id: dto.lopaTriggerId ?? null,
      recommendation_number: `REC-${String(count + 1).padStart(3, '0')}`,
      source_type: dto.sourceType ?? (scenario ? 'Scenario' : 'Manual'),
      title: dto.title ?? text.slice(0, 90),
      description: text,
      recommendation_text: text,
      rationale: dto.rationale ?? null,
      priority,
      owner_id: dto.ownerId ?? null,
      department_id: dto.departmentId ?? null,
      due_date: dto.dueDate ?? null,
      status,
      verification_required: verificationRequired,
      evidence_required: evidenceRequired,
      closure_blocker: closureBlocker,
      linked_action_id: dto.linkedActionId ?? null,
      action_id: dto.linkedActionId ?? null,
      lopa_related: dto.lopaRelated ?? Boolean(scenario?.lopa_required || dto.lopaTriggerId),
      evidence_status: evidenceRequired ? 'Missing' : 'Not Required',
      verification_status: verificationRequired ? 'Pending' : 'Not Required',
      notes: dto.notes ?? null,
      created_by: actorId,
      updated_by: actorId
    }).select().single());
    if (dto.linkedActionId) await this.syncRecommendationAction(tenantId, actorId, study.id, recommendation.id, scope);
    if (dto.actionCreationMode === 'create') await this.createActionFromRecommendation(tenantId, actorId, study.id, recommendation.id, scope);
    await this.afterRecommendationMutation(tenantId, actorId, study, recommendation, 'HAZOP_RECOMMENDATION_CREATED', 'RECOMMENDATION_CREATED', `${recommendation.recommendation_number} created`);
    return this.recommendationDetail(tenantId, study.id, recommendation.id, scope);
  }

  async recommendationDetail(tenantId: string, studyId: string, recommendationId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    const [rows, evidence, verifications, deferrals, history] = await Promise.all([
      this.recommendationRows(tenantId, studyId, { recommendationId }, scope),
      this.recommendationEvidence(tenantId, studyId, recommendationId, scope),
      this.safeMany<any>(this.db.from('hazop_recommendation_verifications').select('*').eq('tenant_id', tenantId).eq('recommendation_id', recommendationId).order('created_at', { ascending: false })),
      this.safeMany<any>(this.db.from('hazop_recommendation_deferrals').select('*').eq('tenant_id', tenantId).eq('recommendation_id', recommendationId).order('created_at', { ascending: false })),
      this.safeMany<any>(this.db.from('hazop_history_events').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).contains('metadata', { recommendationId }).order('created_at', { ascending: false }))
    ]);
    if (!rows[0]) throw new NotFoundException('Recommendation not found');
    return { ...rows[0], evidence, verifications, deferrals, history };
  }

  async updateRecommendation(tenantId: string, actorId: string, studyId: string, recommendationId: string, dto: CreateHazopRecommendationDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.recommendation(tenantId, study.id, recommendationId);
    const patch: Record<string, unknown> = { updated_by: actorId, updated_at: new Date().toISOString() };
    if (dto.nodeId !== undefined) patch.node_id = dto.nodeId || null;
    if (dto.scenarioId !== undefined) patch.scenario_id = dto.scenarioId || null;
    if (dto.safeguardId !== undefined) patch.safeguard_id = dto.safeguardId || null;
    if (dto.sourceType !== undefined) patch.source_type = dto.sourceType;
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.recommendationText !== undefined || dto.description !== undefined) {
      const text = dto.recommendationText ?? dto.description ?? '';
      patch.recommendation_text = text;
      patch.description = text;
    }
    if (dto.rationale !== undefined) patch.rationale = dto.rationale || null;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.ownerId !== undefined) patch.owner_id = dto.ownerId || null;
    if (dto.departmentId !== undefined) patch.department_id = dto.departmentId || null;
    if (dto.dueDate !== undefined) patch.due_date = dto.dueDate || null;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.verificationRequired !== undefined) patch.verification_required = dto.verificationRequired;
    if (dto.evidenceRequired !== undefined) patch.evidence_required = dto.evidenceRequired;
    if (dto.closureBlocker !== undefined) patch.closure_blocker = dto.closureBlocker;
    if (dto.lopaRelated !== undefined) patch.lopa_related = dto.lopaRelated;
    if (dto.notes !== undefined) patch.notes = dto.notes || null;
    const updated = await this.db.single<any>(this.db.from('hazop_recommendations').update(patch).eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', recommendationId).select().single());
    await this.afterRecommendationMutation(tenantId, actorId, study, updated, 'HAZOP_RECOMMENDATION_UPDATED', 'RECOMMENDATION_UPDATED', `${updated.recommendation_number} updated`, before);
    return this.recommendationDetail(tenantId, study.id, recommendationId, scope);
  }

  async deleteRecommendation(tenantId: string, actorId: string, studyId: string, recommendationId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.recommendation(tenantId, study.id, recommendationId);
    if (before.linked_action_id || before.action_id) throw new BadRequestException('Unlink or close the Universal Action before deleting this recommendation');
    await this.db.single(this.db.from('hazop_recommendations').delete().eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', recommendationId).select().single());
    await this.history(tenantId, study.id, actorId, 'RECOMMENDATION_DELETED', `${before.recommendation_number} deleted`, before.title, { recommendationId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_RECOMMENDATION_DELETED', entityType: 'hazop_recommendations', entityId: recommendationId, before: before as JsonValue });
    await this.refreshStudyProgress(tenantId, study.id);
    return { deleted: true };
  }

  async cancelRecommendation(tenantId: string, actorId: string, studyId: string, recommendationId: string, dto: HazopCommentDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.recommendation(tenantId, study.id, recommendationId);
    const updated = await this.db.single<any>(this.db.from('hazop_recommendations').update({ status: 'Cancelled', cancellation_reason: dto.reason ?? dto.comment ?? null, cancelled_by: actorId, cancelled_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', recommendationId).select().single());
    await this.afterRecommendationMutation(tenantId, actorId, study, updated, 'HAZOP_RECOMMENDATION_CANCELLED', 'RECOMMENDATION_CANCELLED', `${updated.recommendation_number} cancelled`, before);
    return updated;
  }

  async deferRecommendation(tenantId: string, actorId: string, studyId: string, recommendationId: string, dto: HazopRecommendationDeferralDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.recommendation(tenantId, study.id, recommendationId);
    const deferral = await this.db.single<any>(this.db.from('hazop_recommendation_deferrals').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, recommendation_id: recommendationId, deferral_reason: dto.deferralReason, new_due_date: dto.newDueDate, approved_by: dto.approvedBy ?? actorId, approved_at: new Date().toISOString(), status: 'Approved', created_by: actorId }).select().single());
    const updated = await this.db.single<any>(this.db.from('hazop_recommendations').update({ status: 'Deferred', due_date: dto.newDueDate, deferred_until: dto.newDueDate, deferral_status: 'Approved', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', recommendationId).select().single());
    await this.afterRecommendationMutation(tenantId, actorId, study, updated, 'HAZOP_RECOMMENDATION_DEFERRED', 'RECOMMENDATION_DEFERRED', `${updated.recommendation_number} deferred`, before);
    return { recommendation: updated, deferral };
  }

  async requestRecommendationVerification(tenantId: string, actorId: string, studyId: string, recommendationId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const rec = await this.recommendation(tenantId, study.id, recommendationId);
    if (rec.evidence_required) {
      const evidence = await this.recommendationEvidence(tenantId, study.id, recommendationId, scope);
      if (!evidence.length) throw new BadRequestException('Evidence is required before requesting verification');
    }
    const updated = await this.db.single<any>(this.db.from('hazop_recommendations').update({ status: 'Pending Verification', verification_status: 'Pending', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', recommendationId).select().single());
    await this.afterRecommendationMutation(tenantId, actorId, study, updated, 'HAZOP_RECOMMENDATION_VERIFICATION_REQUESTED', 'RECOMMENDATION_VERIFICATION_REQUESTED', `${updated.recommendation_number} verification requested`, rec);
    return updated;
  }

  async verifyRecommendation(tenantId: string, actorId: string, studyId: string, recommendationId: string, dto: HazopRecommendationVerificationDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const before = await this.recommendation(tenantId, study.id, recommendationId);
    if (before.owner_id === actorId) throw new BadRequestException('Independent verification policy prevents owner self-verification');
    if (before.evidence_required) {
      const evidence = await this.recommendationEvidence(tenantId, study.id, recommendationId, scope);
      if (!evidence.length) throw new BadRequestException('Evidence is required before verification');
    }
    const decision = dto.decision ?? 'Accepted';
    if (decision !== 'Accepted' && !(dto.reason ?? dto.verificationComment)) throw new BadRequestException('Verification rejection requires a reason');
    const verification = await this.db.single<any>(this.db.from('hazop_recommendation_verifications').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, recommendation_id: recommendationId, verifier_id: actorId, decision, verification_comment: dto.verificationComment ?? dto.reason ?? null, verified_at: new Date().toISOString() }).select().single());
    const status = decision === 'Accepted' ? 'Verified Closed' : 'Rejected';
    const updated = await this.db.single<any>(this.db.from('hazop_recommendations').update({ status, verification_status: decision, verified_by: actorId, verified_at: verification.verified_at, closed_by: decision === 'Accepted' ? actorId : null, closed_at: decision === 'Accepted' ? verification.verified_at : null, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', recommendationId).select().single());
    await this.afterRecommendationMutation(tenantId, actorId, study, updated, `HAZOP_RECOMMENDATION_${decision === 'Accepted' ? 'VERIFIED' : 'REJECTED'}`, `RECOMMENDATION_${decision === 'Accepted' ? 'VERIFIED_CLOSED' : 'REJECTED'}`, `${updated.recommendation_number} ${decision === 'Accepted' ? 'verified closed' : 'rejected'}`, before);
    return { recommendation: updated, verification };
  }

  async rejectRecommendationVerification(tenantId: string, actorId: string, studyId: string, recommendationId: string, dto: HazopRecommendationVerificationDto, scope: Scope) {
    return this.verifyRecommendation(tenantId, actorId, studyId, recommendationId, { ...dto, decision: 'Rejected' }, scope);
  }

  async recommendationEvidence(tenantId: string, studyId: string, recommendationId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    return this.safeMany<any>(this.db.from('hazop_recommendation_evidence').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('recommendation_id', recommendationId).order('uploaded_at', { ascending: false }));
  }

  async addRecommendationEvidence(tenantId: string, actorId: string, studyId: string, recommendationId: string, dto: HazopRecommendationEvidenceDto, scope: Scope, file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    const study = await this.study(tenantId, studyId, scope);
    const before = await this.recommendation(tenantId, study.id, recommendationId);
    const evidence = await this.db.single<any>(this.db.from('hazop_recommendation_evidence').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, recommendation_id: recommendationId, evidence_type: dto.evidenceType, attachment_id: dto.attachmentId ?? null, document_id: dto.documentId ?? null, document_version_id: dto.documentVersionId ?? null, file_name: file?.originalname ?? dto.fileName ?? null, storage_path: dto.storagePath ?? null, comment: dto.comment ?? null, uploaded_by: actorId, status: 'Submitted' }).select().single());
    const updated = await this.db.single<any>(this.db.from('hazop_recommendations').update({ evidence_status: 'Submitted', status: before.status === 'Pending Evidence' ? 'Pending Verification' : before.status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', recommendationId).select().single());
    await this.afterRecommendationMutation(tenantId, actorId, study, updated, 'HAZOP_RECOMMENDATION_EVIDENCE_UPLOADED', 'RECOMMENDATION_EVIDENCE_UPLOADED', `Evidence uploaded for ${updated.recommendation_number}`, before);
    return evidence;
  }

  async deleteRecommendationEvidence(tenantId: string, actorId: string, studyId: string, recommendationId: string, evidenceId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const evidence = await this.db.single<any>(this.db.from('hazop_recommendation_evidence').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).eq('recommendation_id', recommendationId).eq('id', evidenceId).maybeSingle());
    if (!evidence) throw new NotFoundException('Evidence not found');
    await this.db.single(this.db.from('hazop_recommendation_evidence').delete().eq('tenant_id', tenantId).eq('id', evidenceId).select().single());
    await this.history(tenantId, study.id, actorId, 'RECOMMENDATION_EVIDENCE_DELETED', 'Recommendation evidence deleted', evidence.file_name ?? evidence.evidence_type, { recommendationId, evidenceId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_RECOMMENDATION_EVIDENCE_DELETED', entityType: 'hazop_recommendation_evidence', entityId: evidenceId, before: evidence as JsonValue });
    return { deleted: true };
  }

  async createActionFromRecommendation(tenantId: string, actorId: string, studyId: string, recommendationId: string, scope: Scope, dto: HazopRecommendationActionDto = {}) {
    const study = await this.study(tenantId, studyId, scope);
    const rec = await this.recommendation(tenantId, study.id, recommendationId);
    if (rec.linked_action_id || rec.action_id) return this.syncRecommendationAction(tenantId, actorId, study.id, recommendationId, scope);
    const ownerId = dto.ownerId ?? rec.owner_id;
    const dueDate = dto.dueDate ?? rec.due_date;
    if (!ownerId || !dueDate) throw new BadRequestException('Recommendation owner and due date are required before action creation');
    const action = await this.actions.create(tenantId, actorId, {
      title: rec.title ?? rec.recommendation_number,
      description: rec.recommendation_text ?? rec.description,
      sourceModule: 'HAZOP',
      sourceType: 'recommendation',
      sourceRecordId: rec.id,
      ownerId,
      priority: this.actionPriority(rec.priority),
      dueDate,
      siteId: study.site_id ?? undefined,
      departmentId: rec.department_id ?? undefined,
      evidenceRequired: rec.evidence_required,
      verificationRequired: rec.verification_required
    });
    const updated = await this.db.single<any>(this.db.from('hazop_recommendations').update({ action_id: action.id, linked_action_id: action.id, action_status_snapshot: action.status, status: 'In Progress', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', rec.id).select().single());
    await this.afterRecommendationMutation(tenantId, actorId, study, updated, 'HAZOP_RECOMMENDATION_ACTION_CREATED', 'ACTION_CREATED', `Action created for ${rec.recommendation_number}`, rec);
    return action;
  }

  async linkRecommendationAction(tenantId: string, actorId: string, studyId: string, recommendationId: string, dto: HazopRecommendationActionDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const before = await this.recommendation(tenantId, study.id, recommendationId);
    if (!dto.actionId) throw new BadRequestException('actionId is required');
    const action = await this.db.single<any>(this.db.from('Action').select('*').eq('tenantId', tenantId).eq('id', dto.actionId).maybeSingle());
    if (!action) throw new NotFoundException('Universal Action not found');
    const updated = await this.db.single<any>(this.db.from('hazop_recommendations').update({ action_id: action.id, linked_action_id: action.id, action_status_snapshot: action.status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', recommendationId).select().single());
    await this.afterRecommendationMutation(tenantId, actorId, study, updated, 'HAZOP_RECOMMENDATION_ACTION_LINKED', 'ACTION_LINKED', `${updated.recommendation_number} linked to ${action.actionNumber ?? action.id}`, before);
    return { recommendation: updated, action };
  }

  async unlinkRecommendationAction(tenantId: string, actorId: string, studyId: string, recommendationId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const before = await this.recommendation(tenantId, study.id, recommendationId);
    const updated = await this.db.single<any>(this.db.from('hazop_recommendations').update({ action_id: null, linked_action_id: null, action_status_snapshot: null, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', recommendationId).select().single());
    await this.afterRecommendationMutation(tenantId, actorId, study, updated, 'HAZOP_RECOMMENDATION_ACTION_UNLINKED', 'ACTION_UNLINKED', `${updated.recommendation_number} action unlinked`, before);
    return updated;
  }

  async syncRecommendationAction(tenantId: string, actorId: string, studyId: string, recommendationId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const before = await this.recommendation(tenantId, study.id, recommendationId);
    const actionId = before.linked_action_id ?? before.action_id;
    if (!actionId) throw new BadRequestException('Recommendation has no linked Universal Action');
    const action = await this.db.single<any>(this.db.from('Action').select('*').eq('tenantId', tenantId).eq('id', actionId).maybeSingle());
    if (!action) throw new NotFoundException('Linked Universal Action not found');
    const status = this.recommendationStatusFromAction(action.status, before);
    const updated = await this.db.single<any>(this.db.from('hazop_recommendations').update({ action_status_snapshot: action.status, status, owner_id: action.assignedToId ?? before.owner_id, due_date: action.dueDate ?? before.due_date, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', recommendationId).select().single());
    await this.afterRecommendationMutation(tenantId, actorId, study, updated, 'HAZOP_RECOMMENDATION_ACTION_SYNCED', 'ACTION_SYNCED', `${updated.recommendation_number} synced from Universal Action`, before);
    return { recommendation: updated, action };
  }

  async exportRecommendations(tenantId: string, actorId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const rows = await this.recommendationRows(tenantId, study.id, { limit: 5000 }, scope);
    const headers = ['Study', 'Recommendation No.', 'Source', 'Node', 'Scenario', 'Risk', 'Recommendation', 'Priority', 'Owner', 'Due Date', 'Status', 'Linked Action', 'Action Status', 'Evidence', 'Verification', 'Closure Blocker', 'Updated'];
    const csvRows = rows.map((row) => [study.study_number, row.recommendation_number, row.source_type, row.node?.node_number ?? '', row.scenario?.scenario_number ?? '', row.scenario?.risk_level ?? '', row.recommendation_text ?? row.description, row.priority, row.owner?.displayName ?? row.owner_id ?? '', row.due_date ?? '', row.status, row.action?.actionNumber ?? row.linked_action_id ?? '', row.action_status_snapshot ?? row.action?.status ?? '', row.evidence_status, row.verification_status, row.closure_blocker ? 'Yes' : 'No', row.updated_at]);
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_RECOMMENDATIONS_EXPORTED', entityType: 'hazop_studies', entityId: study.id, after: { rows: csvRows.length } as JsonValue });
    return { fileName: `${study.study_number}-recommendations-register.csv`, contentType: 'text/csv', content: [headers, ...csvRows].map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n') };
  }

  async teamSessionsContext(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [users, departments, contractorCompanies, nodes, scenarios, recommendations, actions] = await Promise.all([
      this.safeMany<any>(this.db.from('User').select('id,displayName,email,title,status').eq('tenantId', tenantId).order('displayName')),
      this.safeMany<any>(this.db.from('departments').select('*').eq('tenant_id', tenantId).order('name')),
      this.safeMany<any>(this.db.from('contractor_companies').select('*').eq('tenant_id', tenantId).order('name')),
      this.safeMany<any>(this.db.from('hazop_nodes').select('id,node_number,title,status').eq('tenant_id', tenantId).eq('study_id', study.id).order('sort_order')),
      this.safeMany<any>(this.db.from('hazop_scenarios').select('id,scenario_number,node_id,deviation_text,risk_level,status').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_recommendations').select('id,recommendation_number,title,recommendation_text,status').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('Action').select('id,actionNumber,title,status,assignedToId,dueDate,priority').eq('tenantId', tenantId).eq('sourceModule', 'HAZOP'))
    ]);
    return {
      users,
      departments,
      contractorCompanies,
      nodes,
      scenarios,
      recommendations,
      actions,
      disciplines: this.hazopDisciplines(),
      studyRoles: this.hazopStudyRoles(),
      permissionLevels: ['View only', 'Comment', 'Edit worksheet', 'Approve/sign-off'],
      attendanceStatuses: ['Present', 'Absent', 'Partial', 'Excused', 'Substitute Attended', 'Not Required'],
      sessionTypes: ['Kickoff', 'Node review', 'HAZOP worksheet session', 'Risk review', 'Recommendation review', 'Closeout review', 'Approval review', 'Revalidation session', 'Other'],
      sitePolicies: { requireCoverageForApproval: true, requireAttendanceForCompletion: true, requireMinutesForCompletion: true, requireActionsClosedForCompletion: false }
    };
  }

  async teamSessionsSummary(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [team, sessions, coverage, attendance, actions] = await Promise.all([
      this.teamRegister(tenantId, study.id, {}, scope),
      this.sessionsRegister(tenantId, study.id, {}, scope),
      this.teamCoverage(tenantId, study.id, scope),
      this.safeMany<any>(this.db.from('hazop_session_attendance').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_session_action_links').select('*, action:Action(*)').eq('tenant_id', tenantId).eq('study_id', study.id))
    ]);
    const required = team.filter((m) => m.required_attendance || m.required);
    const incompleteAttendance = sessions.filter((s) => s.attendance_status !== 'Complete').length;
    return {
      totalTeamMembers: team.length,
      requiredMembers: required.length,
      optionalMembers: team.length - required.length,
      missingRequiredDisciplines: coverage.filter((row) => row.required && row.coverage_status === 'Missing').length,
      sessionsPlanned: sessions.length,
      sessionsCompleted: sessions.filter((s) => s.status === 'Completed').length,
      attendanceIncomplete: incompleteAttendance,
      attendanceRecords: attendance.length,
      openSessionActions: actions.filter((link) => !['CLOSED', 'VERIFIED', 'COMPLETED'].includes(link.action?.status)).length,
      pendingTeamSignoffs: team.filter((m) => m.signoff_required && m.signoff_status !== 'Signed').length,
      studyLeader: team.find((m) => (m.study_role ?? m.role) === 'HAZOP Leader / Facilitator')?.display_name ?? study.study_leader_id ?? null,
      scribeAssigned: Boolean(team.find((m) => (m.study_role ?? m.role) === 'Scribe')),
      nextSessionDate: sessions.filter((s) => ['Planned', 'Rescheduled'].includes(s.status)).sort((a, b) => String(a.session_date ?? '').localeCompare(String(b.session_date ?? '')))[0]?.session_date ?? null
    };
  }

  async teamCoverage(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    await this.ensureCoverageRequirements(tenantId, study);
    const [requirements, team] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_team_coverage_requirements').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('discipline')),
      this.teamRegister(tenantId, study.id, {}, scope)
    ]);
    return requirements.map((requirement) => {
      const assigned = team.find((member) => member.id === requirement.assigned_member_id) ?? team.find((member) => member.discipline === requirement.discipline && !['Removed', 'Inactive', 'Declined'].includes(member.status));
      const status = requirement.required ? (assigned ? 'Covered' : 'Missing') : (assigned ? 'Covered' : 'Optional');
      return { ...requirement, assigned_member_id: assigned?.id ?? null, assignedMember: assigned ?? null, coverage_status: status, missing_reason: status === 'Missing' ? `${requirement.discipline} participant is required by site policy` : null };
    });
  }

  async teamSignoffReadiness(tenantId: string, studyId: string, scope: Scope) {
    const [coverage, team, sessions] = await Promise.all([
      this.teamCoverage(tenantId, studyId, scope),
      this.teamRegister(tenantId, studyId, {}, scope),
      this.sessionsRegister(tenantId, studyId, {}, scope)
    ]);
    const blockers: string[] = [];
    const warnings: string[] = [];
    const missing = coverage.filter((row) => row.required && row.coverage_status === 'Missing');
    if (missing.length) blockers.push(`${missing.length} required discipline(s) missing`);
    if (team.some((m) => (m.required_attendance || m.required) && ['Removed', 'Inactive', 'Declined'].includes(m.status))) blockers.push('Required team members are not active');
    if (sessions.some((s) => s.status !== 'Completed')) warnings.push('Not all planned sessions are complete');
    if (sessions.some((s) => s.attendance_status !== 'Complete')) blockers.push('Required attendance is incomplete');
    if (sessions.some((s) => s.minutes_status !== 'Complete' && s.status === 'Completed')) blockers.push('Completed sessions have missing minutes');
    if (sessions.some((s) => s.actions_status === 'Open Actions')) warnings.push('Session follow-up actions remain open');
    const reviewCommentsResolved = true;
    const status = blockers.length ? 'Blocked' : warnings.length ? 'Warning' : 'Ready';
    return {
      status,
      blockers,
      warnings,
      checks: {
        requiredDisciplinesAssigned: !missing.length,
        requiredSessionsCompleted: sessions.every((s) => s.status === 'Completed') || !sessions.length,
        requiredAttendanceComplete: sessions.every((s) => s.attendance_status === 'Complete') || !sessions.length,
        minutesCompleted: sessions.every((s) => s.minutes_status === 'Complete') || !sessions.length,
        requiredSessionActionsClosed: !sessions.some((s) => s.actions_status === 'Open Actions'),
        requiredTeamMembersActive: !team.some((m) => (m.required_attendance || m.required) && ['Removed', 'Inactive', 'Declined'].includes(m.status)),
        requiredReviewCommentsResolved: reviewCommentsResolved,
        sessionsCompleted: sessions.every((s) => s.status === 'Completed') || !sessions.length,
        attendanceComplete: sessions.every((s) => s.attendance_status === 'Complete') || !sessions.length,
        minutesComplete: sessions.every((s) => s.minutes_status === 'Complete') || !sessions.length
      }
    };
  }

  async teamRegister(tenantId: string, studyId: string, query: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [members, users, departments, contractorCompanies, attendance, actionLinks, actions, sessions, signoffs] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_study_team_members').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('created_at')),
      this.safeMany<any>(this.db.from('User').select('id,displayName,email,title').eq('tenantId', tenantId)),
      this.safeMany<any>(this.db.from('departments').select('*').eq('tenant_id', tenantId)),
      this.safeMany<any>(this.db.from('contractor_companies').select('*').eq('tenant_id', tenantId)),
      this.safeMany<any>(this.db.from('hazop_session_attendance').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_session_action_links').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('Action').select('id,status,assignedToId').eq('tenantId', tenantId)),
      this.safeMany<any>(this.db.from('hazop_study_sessions').select('id,session_number,title,session_date').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_signoffs').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).neq('status', 'Superseded'))
    ]);
    let rows = members.map((member) => {
      const user = users.find((u) => u.id === member.user_id);
      const records = attendance.filter((a) => a.team_member_id === member.id);
      const present = records.filter((a) => ['Present', 'Partial', 'Substitute Attended'].includes(a.attendance_status)).length;
      const linkedActionIds = new Set(actionLinks.map((link) => link.linked_action_id).filter(Boolean));
      const openActions = actions.filter((action) => (action.assignedToId === member.user_id || linkedActionIds.has(action.id)) && !['CLOSED', 'VERIFIED', 'COMPLETED'].includes(action.status)).length;
      const departmentId = member.department_id ?? user?.departmentId ?? null;
      const department = departments.find((departmentRow) => departmentRow.id === departmentId);
      const contractorCompany = contractorCompanies.find((company) => company.id === member.contractor_company_id);
      const lastAttendance = records.filter((a) => ['Present', 'Partial', 'Substitute Attended'].includes(a.attendance_status)).sort((a, b) => String(b.marked_at ?? '').localeCompare(String(a.marked_at ?? '')))[0];
      const lastSession = sessions.find((session) => session.id === lastAttendance?.session_id);
      const signed = signoffs.some((signature) => signature.status === 'Signed' && (signature.signer_user_id === member.user_id || signature.assigned_user_id === member.user_id || this.roleMatches(signature.signature_role ?? signature.signoff_role, member.study_role ?? member.role)));
      return {
        ...member,
        role: member.study_role ?? member.role,
        name: member.name ?? member.external_name ?? user?.displayName ?? 'Team Member',
        display_name: member.name ?? member.external_name ?? user?.displayName ?? 'Team Member',
        email: member.email ?? member.external_email ?? user?.email ?? null,
        department_id: departmentId,
        department,
        departmentName: department?.name ?? departmentId ?? null,
        contractorCompany,
        contractorCompanyName: contractorCompany?.name ?? null,
        companyOrContractor: contractorCompany?.name ?? member.company_name ?? 'Internal',
        attendanceRequirement: member.attendance_requirement ?? 'All sessions',
        attendancePercentage: records.length ? Math.round((present / records.length) * 100) : 0,
        lastAttendedSession: lastSession ? { id: lastSession.id, session_number: lastSession.session_number, title: lastSession.title, session_date: lastSession.session_date } : null,
        lastAttendedSessionLabel: lastSession ? `S${lastSession.session_number} - ${lastSession.title}` : null,
        openActions,
        signoff_status: member.signoff_required ? (signed ? 'Signed' : 'Pending') : 'Not Required'
      };
    });
    const search = String(query.search ?? '').toLowerCase();
    if (search) rows = rows.filter((row) => [row.name, row.email, row.discipline, row.role, row.company_name].filter(Boolean).join(' ').toLowerCase().includes(search));
    const filter = (key: string, column = key) => {
      const value = query[key];
      if (value && value !== 'All') rows = rows.filter((row) => String(row[column] ?? '') === String(value));
    };
    filter('discipline'); filter('status'); filter('studyRole', 'role');
    if (query.requiredAttendance && query.requiredAttendance !== 'All') rows = rows.filter((row) => Boolean(row.required_attendance || row.required) === (query.requiredAttendance === 'Yes' || query.requiredAttendance === 'true'));
    if (query.signoffRequired && query.signoffRequired !== 'All') rows = rows.filter((row) => Boolean(row.signoff_required) === (query.signoffRequired === 'Yes' || query.signoffRequired === 'true'));
    if (query.attendanceMissing === 'true') rows = rows.filter((row) => (row.required_attendance || row.required) && row.attendancePercentage < 100);
    if (query.openActions === 'true') rows = rows.filter((row) => row.openActions > 0);
    return rows;
  }

  async teamMemberDetail(tenantId: string, studyId: string, memberId: string, scope: Scope) {
    const rows = await this.teamRegister(tenantId, studyId, { memberId }, scope);
    const member = rows.find((row) => row.id === memberId);
    if (!member) throw new NotFoundException('HAZOP team member not found');
    return member;
  }

  async addTeamMember(tenantId: string, actorId: string, studyId: string, dto: HazopTeamMemberDto | Record<string, any>, scope: Scope, emit = true) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const payload = this.normalizeTeamMemberDto(dto as Record<string, any>);
    this.validateTeamMember(payload);
    const user = payload.userId ? await this.safeUser(tenantId, payload.userId) : null;
    const inviteRequired = Boolean(payload.userId || payload.externalEmail || payload.email);
    const member = await this.db.single<any>(this.db.from('hazop_study_team_members').insert({
      id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id,
      user_id: payload.userId ?? null, external_name: payload.externalName ?? null, external_email: payload.externalEmail ?? null,
      name: payload.name ?? user?.displayName ?? payload.externalName ?? 'Team Member', email: payload.email ?? user?.email ?? payload.externalEmail ?? null,
      company_name: payload.companyName ?? null, contractor_company_id: payload.contractorCompanyId ?? null, department_id: payload.departmentId ?? user?.departmentId ?? null,
      discipline: payload.discipline, role: payload.studyRole ?? payload.role, study_role: payload.studyRole ?? payload.role, permission_level: payload.permissionLevel ?? 'Comment',
      required: Boolean(payload.requiredAttendance ?? payload.required), required_attendance: Boolean(payload.requiredAttendance ?? payload.required),
      attendance_requirement: payload.attendanceRequirement ?? 'All sessions',
      signoff_required: Boolean(payload.signoffRequired ?? payload.signoff_required), status: inviteRequired ? 'Invited' : (payload.status ?? 'Active'),
      invited_at: inviteRequired ? new Date().toISOString() : null,
      notes: payload.notes ?? null, added_by: actorId, created_by: actorId, updated_by: actorId
    }).select().single());
    const invitation = inviteRequired ? await this.createHazopTeamInvitation(tenantId, actorId, study, member) : null;
    await this.syncTeamCoverage(tenantId, study.id);
    if (emit) await this.afterTeamSessionMutation(tenantId, actorId, study, member, 'HAZOP_TEAM_MEMBER_ADDED', 'TEAM_MEMBER_ADDED', `Team member added: ${member.name}`, undefined, 'hazop_study_team_members');
    return invitation ? { ...member, invitation } : member;
  }

  async updateTeamMember(tenantId: string, actorId: string, studyId: string, memberId: string, dto: HazopTeamMemberDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.teamMember(tenantId, study.id, memberId);
    const payload = this.normalizeTeamMemberDto({ ...before, ...dto });
    this.validateTeamMember(payload);
    const user = payload.userId ? await this.safeUser(tenantId, payload.userId) : null;
    const patch = this.teamMemberPatchForExistingSchema(before, {
      user_id: payload.userId ?? before.user_id, external_name: payload.externalName ?? before.external_name, external_email: payload.externalEmail ?? before.external_email,
      name: payload.name ?? user?.displayName ?? payload.externalName ?? before.name, email: payload.email ?? user?.email ?? payload.externalEmail ?? before.email,
      company_name: payload.companyName ?? before.company_name, contractor_company_id: payload.contractorCompanyId ?? before.contractor_company_id, department_id: payload.departmentId ?? user?.departmentId ?? before.department_id,
      discipline: payload.discipline ?? before.discipline, role: payload.studyRole ?? before.study_role ?? before.role, study_role: payload.studyRole ?? before.study_role ?? before.role,
      permission_level: payload.permissionLevel ?? before.permission_level, required: payload.requiredAttendance ?? before.required, required_attendance: payload.requiredAttendance ?? before.required_attendance,
      attendance_requirement: payload.attendanceRequirement ?? before.attendance_requirement ?? 'All sessions',
      signoff_required: payload.signoffRequired ?? before.signoff_required,
      status: payload.status ?? before.status,
      attendance_status: payload.status ?? before.attendance_status,
      notes: payload.notes ?? before.notes,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    const updated = await this.db.single<any>(this.db.from('hazop_study_team_members').update(patch).eq('tenant_id', tenantId).eq('id', memberId).select().single());
    await this.syncTeamCoverage(tenantId, study.id);
    await this.afterTeamSessionMutation(tenantId, actorId, study, updated, 'HAZOP_TEAM_MEMBER_UPDATED', 'TEAM_MEMBER_UPDATED', `Team member updated: ${updated.name}`, before, 'hazop_study_team_members');
    return updated;
  }

  async removeTeamMember(tenantId: string, actorId: string, studyId: string, memberId: string, scope: Scope, hardDelete = false, reason?: string) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.teamMember(tenantId, study.id, memberId);
    const required = before.required_attendance || before.required;
    if (required && !hardDelete) {
      const coverage = await this.teamCoverage(tenantId, study.id, scope);
      const coveredByOthers = coverage.some((c) => c.discipline === before.discipline && c.assigned_member_id && c.assigned_member_id !== before.id);
      if (!coveredByOthers) throw new BadRequestException('Cannot remove required discipline member without replacement');
    }
    let result: any;
    if (hardDelete) result = await this.db.single<any>(this.db.from('hazop_study_team_members').delete().eq('tenant_id', tenantId).eq('id', memberId).select().single());
    else result = await this.db.single<any>(this.db.from('hazop_study_team_members').update({ status: 'Removed', removed_at: new Date().toISOString(), notes: [before.notes, reason].filter(Boolean).join('\n'), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', memberId).select().single());
    await this.syncTeamCoverage(tenantId, study.id);
    await this.afterTeamSessionMutation(tenantId, actorId, study, result, 'HAZOP_TEAM_MEMBER_REMOVED', 'TEAM_MEMBER_REMOVED', `Team member removed: ${before.name}`, before, 'hazop_study_team_members');
    return result;
  }

  async replaceTeamMember(tenantId: string, actorId: string, studyId: string, memberId: string, dto: HazopTeamReplaceDto, scope: Scope) {
    const before = await this.teamMember(tenantId, studyId, memberId);
    const replacement = dto.replacementMemberId ? await this.teamMember(tenantId, studyId, dto.replacementMemberId) : await this.addTeamMember(tenantId, actorId, studyId, { ...(dto.replacement ?? {}), discipline: before.discipline, studyRole: before.study_role ?? before.role, requiredAttendance: before.required_attendance, signoffRequired: before.signoff_required }, scope, false);
    await this.updateTeamMember(tenantId, actorId, studyId, memberId, { ...before, status: 'Replaced' } as HazopTeamMemberDto, scope);
    await this.db.single(this.db.from('hazop_study_team_members').update({ replaced_by_member_id: replacement.id, removed_at: new Date().toISOString(), notes: [before.notes, dto.reason].filter(Boolean).join('\n') }).eq('tenant_id', tenantId).eq('id', memberId).select().single());
    return { replaced: memberId, replacement };
  }

  async resendTeamInvite(tenantId: string, actorId: string, studyId: string, memberId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const member = await this.teamMember(tenantId, study.id, memberId);
    const updated = await this.db.single<any>(this.db.from('hazop_study_team_members').update({ status: 'Invited', invited_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', memberId).select().single());
    const invitation = await this.createHazopTeamInvitation(tenantId, actorId, study, updated, true);
    await this.afterTeamSessionMutation(tenantId, actorId, study, updated, 'HAZOP_TEAM_INVITE_SENT', 'TEAM_INVITE_SENT', `Invitation sent to ${member.email ?? member.name}`, member, 'hazop_study_team_members');
    return { ...updated, invitation };
  }

  private async createHazopTeamInvitation(tenantId: string, actorId: string, study: any, member: any, resend = false) {
    const invitedEmail = String(member.email ?? member.external_email ?? '').trim().toLowerCase() || null;
    let invitedUserId = member.user_id ?? null;
    if (!invitedUserId && invitedEmail) {
      const user = await this.db.single<any>(this.db.from('User').select('id').eq('tenantId', tenantId).eq('email', invitedEmail).maybeSingle()).catch(() => null);
      invitedUserId = user?.id ?? null;
    }
    if (!invitedUserId && !invitedEmail) return null;
    const existing = await this.db.single<any>(this.db.from('hazop_team_invitations').select('*').eq('tenant_id', tenantId).eq('team_member_id', member.id).maybeSingle()).catch(() => null);
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const invitation = await this.db.single<any>(this.db.from('hazop_team_invitations').upsert({
      id: existing?.id ?? crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      team_member_id: member.id,
      invited_user_id: invitedUserId,
      invited_email: invitedEmail,
      invited_by: actorId,
      study_role: member.study_role ?? member.role ?? null,
      discipline: member.discipline ?? null,
      permission_level: member.permission_level ?? 'Comment',
      required_attendance: Boolean(member.required_attendance ?? member.required),
      signoff_required: Boolean(member.signoff_required),
      status: 'Pending',
      expires_at: expiresAt,
      responded_at: null,
      decline_reason: null,
      metadata: { resend, studyNumber: study.study_number, studyTitle: study.title },
      updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id,team_member_id' }).select().single());

    if (invitedUserId) {
      await this.notifications.notifyUser({
        tenantId,
        companyId: study.company_id ?? null,
        siteId: study.site_id ?? null,
        userId: invitedUserId,
        type: 'hazop.team.invited',
        module: 'hazop',
        title: `HAZOP team invitation: ${study.study_number}`,
        message: `You were invited as ${invitation.study_role ?? 'team member'} for ${study.title}.`,
        relatedRecordId: invitation.id,
        relatedRecordType: 'hazop_team_invitations',
        relatedUrl: '/profile',
        priority: 'Info',
        metadata: { studyId: study.id, teamMemberId: member.id }
      }).catch(() => null);
    }
    return invitation;
  }

  async sessionsRegister(tenantId: string, studyId: string, query: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [sessions, attendance, minutes, decisions, links, actions, users, teamMembers, nodes, scenarios, recommendations, historyEvents] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_study_sessions').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('session_number')),
      this.safeMany<any>(this.db.from('hazop_session_attendance').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_session_minutes').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_session_decisions').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_session_action_links').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('Action').select('id,actionNumber,title,status,assignedToId,dueDate,priority').eq('tenantId', tenantId)),
      this.safeMany<any>(this.db.from('User').select('id,displayName,email').eq('tenantId', tenantId)),
      this.safeMany<any>(this.db.from('hazop_study_team_members').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_nodes').select('id,node_number,title').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_scenarios').select('id,scenario_number,deviation_text,node_id').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_recommendations').select('id,recommendation_number,title,recommendation_text,status').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_history_events').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('created_at', { ascending: false }).limit(200))
    ]);
    let rows = sessions.map((session) => {
      const records = attendance.filter((a) => a.session_id === session.id).map((record) => {
        const member = teamMembers.find((teamMember) => teamMember.id === record.team_member_id);
        return {
          ...record,
          teamMember: member ?? null,
          memberName: member?.name ?? member?.external_name ?? users.find((u) => u.id === record.user_id)?.displayName ?? 'Team member',
          user: users.find((u) => u.id === record.user_id) ?? null,
          substituteUser: users.find((u) => u.id === record.substitute_user_id) ?? null,
          markedBy: users.find((u) => u.id === record.marked_by) ?? null,
          sessionTitle: session.title
        };
      });
      const sessionMinutes = minutes.filter((m) => m.session_id === session.id).map((minute) => ({
        ...minute,
        preparedBy: users.find((u) => u.id === minute.prepared_by) ?? null,
        reviewedBy: users.find((u) => u.id === minute.reviewed_by) ?? null,
        approvedBy: users.find((u) => u.id === minute.approved_by) ?? null
      }));
      const sessionLinks = links.filter((l) => l.session_id === session.id).map((link) => {
        const action = actions.find((a) => a.id === link.linked_action_id);
        return { ...link, action, node: nodes.find((n) => n.id === link.node_id) ?? null, scenario: scenarios.find((s) => s.id === link.scenario_id) ?? null };
      });
      const openActions = sessionLinks.map((l) => actions.find((a) => a.id === l.linked_action_id)).filter((a) => a && !['CLOSED', 'VERIFIED', 'COMPLETED'].includes(a.status));
      const sessionDecisions = decisions.filter((d) => d.session_id === session.id).map((decision) => ({
        ...decision,
        owner: users.find((u) => u.id === decision.owner_id) ?? null,
        node: nodes.find((n) => n.id === decision.node_id) ?? null,
        scenario: scenarios.find((s) => s.id === decision.scenario_id) ?? null,
        recommendation: recommendations.find((r) => r.id === decision.recommendation_id) ?? null
      }));
      const sessionHistory = historyEvents.filter((event) => event.metadata?.entityId === session.id || event.entity_id === session.id);
      return { ...session, facilitator: users.find((u) => u.id === session.facilitator_id), scribe: users.find((u) => u.id === session.scribe_id), plannedNodes: nodes.filter((n) => (session.planned_node_ids ?? []).includes(n.id)), attendance: records, attendanceCount: records.length, presentCount: records.filter((a) => ['Present', 'Partial', 'Substitute Attended'].includes(a.attendance_status)).length, minutes: sessionMinutes, decisions: sessionDecisions, actionLinks: sessionLinks, history: sessionHistory, openActions: openActions.length };
    });
    const search = String(query.search ?? '').toLowerCase();
    if (search) rows = rows.filter((row) => [row.title, row.agenda, row.description, row.minutes?.map((m: any) => m.summary).join(' '), row.decisions?.map((d: any) => d.decision_title).join(' ')].filter(Boolean).join(' ').toLowerCase().includes(search));
    for (const key of ['status', 'sessionType']) {
      const value = query[key];
      if (value && value !== 'All') rows = rows.filter((row) => String(row[key === 'sessionType' ? 'session_type' : key] ?? '') === String(value));
    }
    if (query.facilitatorId && query.facilitatorId !== 'All') rows = rows.filter((row) => row.facilitator_id === query.facilitatorId);
    if (query.nodeId && query.nodeId !== 'All') rows = rows.filter((row) => (row.planned_node_ids ?? []).includes(query.nodeId));
    if (query.attendanceIncomplete === 'true') rows = rows.filter((row) => row.attendance_status !== 'Complete');
    if (query.minutesMissing === 'true') rows = rows.filter((row) => row.minutes_status !== 'Complete');
    if (query.openActions === 'true') rows = rows.filter((row) => row.openActions > 0);
    if (query.dateFrom) rows = rows.filter((row) => !row.session_date || row.session_date >= query.dateFrom);
    if (query.dateTo) rows = rows.filter((row) => !row.session_date || row.session_date <= query.dateTo);
    return rows;
  }

  async sessionDetail(tenantId: string, studyId: string, sessionId: string, scope: Scope) {
    const sessions = await this.sessionsRegister(tenantId, studyId, {}, scope);
    const session = sessions.find((row) => row.id === sessionId);
    if (!session) throw new NotFoundException('HAZOP session not found');
    return session;
  }

  async createSession(tenantId: string, actorId: string, studyId: string, dto: HazopSessionDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const next = await this.nextSessionNumber(tenantId, study.id);
    const session = await this.db.single<any>(this.db.from('hazop_study_sessions').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, session_number: next, title: dto.title, session_type: dto.sessionType ?? 'HAZOP worksheet session', description: dto.description ?? null, session_date: dto.sessionDate ?? null, start_time: dto.startTime ?? null, end_time: dto.endTime ?? null, location: dto.location ?? null, meeting_link: dto.meetingLink ?? null, facilitator_id: dto.facilitatorId ?? study.facilitator_id ?? null, scribe_id: dto.scribeId ?? study.scribe_id ?? null, planned_node_ids: dto.plannedNodeIds ?? [], agenda: dto.agenda ?? null, status: dto.status ?? 'Planned', created_by: actorId, updated_by: actorId }).select().single());
    await this.seedSessionAttendance(tenantId, actorId, study, session);
    await this.afterTeamSessionMutation(tenantId, actorId, study, session, 'HAZOP_SESSION_CREATED', 'SESSION_CREATED', `Session created: ${session.title}`, undefined, 'hazop_study_sessions');
    return session;
  }

  async updateSession(tenantId: string, actorId: string, studyId: string, sessionId: string, dto: HazopSessionDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.session(tenantId, study.id, sessionId);
    const updated = await this.db.single<any>(this.db.from('hazop_study_sessions').update({ title: dto.title ?? before.title, session_type: dto.sessionType ?? before.session_type, description: dto.description ?? before.description, session_date: dto.sessionDate ?? before.session_date, start_time: dto.startTime ?? before.start_time, end_time: dto.endTime ?? before.end_time, location: dto.location ?? before.location, meeting_link: dto.meetingLink ?? before.meeting_link, facilitator_id: dto.facilitatorId ?? before.facilitator_id, scribe_id: dto.scribeId ?? before.scribe_id, planned_node_ids: dto.plannedNodeIds ?? before.planned_node_ids, agenda: dto.agenda ?? before.agenda, status: dto.status ?? before.status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', sessionId).select().single());
    await this.afterTeamSessionMutation(tenantId, actorId, study, updated, 'HAZOP_SESSION_UPDATED', 'SESSION_UPDATED', `Session updated: ${updated.title}`, before, 'hazop_study_sessions');
    return updated;
  }

  async startSession(tenantId: string, actorId: string, studyId: string, sessionId: string, scope: Scope) {
    return this.updateSessionStatus(tenantId, actorId, studyId, sessionId, 'In Progress', scope, { actual_start: new Date().toISOString() }, 'SESSION_STARTED');
  }

  async completeSession(tenantId: string, actorId: string, studyId: string, sessionId: string, scope: Scope) {
    const detail = await this.sessionDetail(tenantId, studyId, sessionId, scope);
    if (detail.attendance_status !== 'Complete') throw new BadRequestException('Attendance must be complete before completing the session');
    if (detail.minutes_status !== 'Complete') throw new BadRequestException('Meeting minutes must be complete before completing the session');
    return this.updateSessionStatus(tenantId, actorId, studyId, sessionId, 'Completed', scope, { actual_end: new Date().toISOString() }, 'SESSION_COMPLETED');
  }

  async rescheduleSession(tenantId: string, actorId: string, studyId: string, sessionId: string, dto: HazopSessionRescheduleDto, scope: Scope) {
    const updated = await this.updateSessionStatus(tenantId, actorId, studyId, sessionId, 'Rescheduled', scope, { session_date: dto.sessionDate, start_time: dto.startTime ?? null, end_time: dto.endTime ?? null }, 'SESSION_RESCHEDULED');
    return { ...updated, reason: dto.reason ?? null };
  }

  async cancelSession(tenantId: string, actorId: string, studyId: string, sessionId: string, reason: string | undefined, scope: Scope) {
    const updated = await this.updateSessionStatus(tenantId, actorId, studyId, sessionId, 'Cancelled', scope, { notes: reason ?? null }, 'SESSION_CANCELLED');
    return updated;
  }

  async sessionAttendance(tenantId: string, studyId: string, sessionId: string, scope: Scope) {
    await this.sessionDetail(tenantId, studyId, sessionId, scope);
    return this.safeMany<any>(this.db.from('hazop_session_attendance').select('*').eq('tenant_id', tenantId).eq('session_id', sessionId).order('created_at'));
  }

  async upsertAttendance(tenantId: string, actorId: string, studyId: string, sessionId: string, dto: HazopAttendanceDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    await this.session(tenantId, study.id, sessionId);
    if (!dto.teamMemberId && !dto.userId) throw new BadRequestException('teamMemberId or userId is required');
    const member = dto.teamMemberId ? await this.teamMember(tenantId, study.id, dto.teamMemberId) : null;
    const record = await this.db.single<any>(this.db.from('hazop_session_attendance').upsert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, session_id: sessionId, team_member_id: dto.teamMemberId ?? null, user_id: dto.userId ?? member?.user_id ?? null, required: dto.required ?? member?.required_attendance ?? member?.required ?? false, attendance_status: dto.attendanceStatus, join_time: dto.joinTime ?? null, leave_time: dto.leaveTime ?? null, duration_minutes: dto.durationMinutes ?? this.durationMinutes(dto.joinTime, dto.leaveTime), substitute_name: dto.substituteName ?? null, substitute_user_id: dto.substituteUserId ?? null, comment: dto.comment ?? null, marked_by: actorId, marked_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,session_id,team_member_id' }).select().single());
    await this.refreshSessionStatuses(tenantId, study.id, sessionId);
    await this.afterTeamSessionMutation(tenantId, actorId, study, record, 'HAZOP_ATTENDANCE_MARKED', 'ATTENDANCE_MARKED', 'Session attendance marked', undefined, 'hazop_session_attendance');
    return record;
  }

  async updateAttendance(tenantId: string, actorId: string, studyId: string, sessionId: string, attendanceId: string, dto: HazopAttendanceDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.db.single<any>(this.db.from('hazop_session_attendance').select('*').eq('tenant_id', tenantId).eq('id', attendanceId).maybeSingle());
    if (!before) throw new NotFoundException('Attendance record not found');
    const updated = await this.db.single<any>(this.db.from('hazop_session_attendance').update({ required: dto.required ?? before.required, attendance_status: dto.attendanceStatus ?? before.attendance_status, join_time: dto.joinTime ?? before.join_time, leave_time: dto.leaveTime ?? before.leave_time, duration_minutes: dto.durationMinutes ?? this.durationMinutes(dto.joinTime ?? before.join_time, dto.leaveTime ?? before.leave_time), substitute_name: dto.substituteName ?? before.substitute_name, substitute_user_id: dto.substituteUserId ?? before.substitute_user_id, comment: dto.comment ?? before.comment, marked_by: actorId, marked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', attendanceId).select().single());
    await this.refreshSessionStatuses(tenantId, study.id, sessionId);
    await this.afterTeamSessionMutation(tenantId, actorId, study, updated, 'HAZOP_ATTENDANCE_UPDATED', 'ATTENDANCE_UPDATED', 'Session attendance updated', before, 'hazop_session_attendance');
    return updated;
  }

  async bulkMarkAttendance(tenantId: string, actorId: string, studyId: string, sessionId: string, dto: HazopBulkAttendanceDto, scope: Scope) {
    const rows = [];
    for (const record of dto.records) rows.push(await this.upsertAttendance(tenantId, actorId, studyId, sessionId, record, scope));
    return rows;
  }

  async sessionMinutes(tenantId: string, studyId: string, sessionId: string, scope: Scope) {
    await this.sessionDetail(tenantId, studyId, sessionId, scope);
    return this.safeMany<any>(this.db.from('hazop_session_minutes').select('*').eq('tenant_id', tenantId).eq('session_id', sessionId).order('created_at', { ascending: false }));
  }

  async upsertMinutes(tenantId: string, actorId: string, studyId: string, sessionId: string, dto: HazopSessionMinutesDto, scope: Scope) {
    const existing = await this.sessionMinutes(tenantId, studyId, sessionId, scope).then((rows) => rows[0]);
    if (existing) return this.updateMinutes(tenantId, actorId, studyId, sessionId, existing.id, dto, scope);
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const minutes = await this.db.single<any>(this.db.from('hazop_session_minutes').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, session_id: sessionId, summary: dto.summary ?? null, discussion_notes: dto.discussionNotes ?? null, nodes_reviewed: dto.nodesReviewed ?? [], key_deviations_discussed: dto.keyDeviationsDiscussed ?? null, risks_escalated: dto.risksEscalated ?? null, recommendations_created: dto.recommendationsCreated ?? null, decisions_made: dto.decisionsMade ?? null, open_questions: dto.openQuestions ?? null, next_session_plan: dto.nextSessionPlan ?? null, prepared_by: actorId, reviewed_by: dto.reviewedBy ?? null, approved_by: dto.approvedBy ?? null, status: dto.status ?? 'Draft' }).select().single());
    await this.refreshSessionStatuses(tenantId, study.id, sessionId);
    await this.afterTeamSessionMutation(tenantId, actorId, study, minutes, 'HAZOP_MINUTES_CREATED', 'MINUTES_CREATED', 'Session minutes created', undefined, 'hazop_session_minutes');
    return minutes;
  }

  async updateMinutes(tenantId: string, actorId: string, studyId: string, sessionId: string, minutesId: string, dto: HazopSessionMinutesDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.db.single<any>(this.db.from('hazop_session_minutes').select('*').eq('tenant_id', tenantId).eq('id', minutesId).maybeSingle());
    if (!before) throw new NotFoundException('Session minutes not found');
    const minutes = await this.db.single<any>(this.db.from('hazop_session_minutes').update({ summary: dto.summary ?? before.summary, discussion_notes: dto.discussionNotes ?? before.discussion_notes, nodes_reviewed: dto.nodesReviewed ?? before.nodes_reviewed, key_deviations_discussed: dto.keyDeviationsDiscussed ?? before.key_deviations_discussed, risks_escalated: dto.risksEscalated ?? before.risks_escalated, recommendations_created: dto.recommendationsCreated ?? before.recommendations_created, decisions_made: dto.decisionsMade ?? before.decisions_made, open_questions: dto.openQuestions ?? before.open_questions, next_session_plan: dto.nextSessionPlan ?? before.next_session_plan, reviewed_by: dto.reviewedBy ?? before.reviewed_by, approved_by: dto.approvedBy ?? before.approved_by, status: dto.status ?? before.status, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', minutesId).select().single());
    await this.refreshSessionStatuses(tenantId, study.id, sessionId);
    await this.afterTeamSessionMutation(tenantId, actorId, study, minutes, 'HAZOP_MINUTES_UPDATED', 'MINUTES_UPDATED', 'Session minutes updated', before, 'hazop_session_minutes');
    return minutes;
  }

  async approveMinutes(tenantId: string, actorId: string, studyId: string, sessionId: string, minutesId: string, scope: Scope) {
    return this.updateMinutes(tenantId, actorId, studyId, sessionId, minutesId, { status: 'Approved', approvedBy: actorId }, scope);
  }

  async sessionDecisions(tenantId: string, studyId: string, sessionId: string, scope: Scope) {
    await this.sessionDetail(tenantId, studyId, sessionId, scope);
    return this.safeMany<any>(this.db.from('hazop_session_decisions').select('*').eq('tenant_id', tenantId).eq('session_id', sessionId).order('decision_date', { ascending: false }));
  }

  async addDecision(tenantId: string, actorId: string, studyId: string, sessionId: string, dto: HazopSessionDecisionDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const decision = await this.db.single<any>(this.db.from('hazop_session_decisions').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, session_id: sessionId, decision_title: dto.decisionTitle, decision_description: dto.decisionDescription ?? null, decision_type: dto.decisionType, node_id: dto.nodeId ?? null, scenario_id: dto.scenarioId ?? null, recommendation_id: dto.recommendationId ?? null, owner_id: dto.ownerId ?? null, decision_date: dto.decisionDate ?? new Date().toISOString().slice(0, 10), created_by: actorId }).select().single());
    await this.afterTeamSessionMutation(tenantId, actorId, study, decision, 'HAZOP_DECISION_CREATED', 'DECISION_CREATED', `Decision recorded: ${decision.decision_title}`, undefined, 'hazop_session_decisions');
    return decision;
  }

  async updateDecision(tenantId: string, actorId: string, studyId: string, sessionId: string, decisionId: string, dto: HazopSessionDecisionDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.db.single<any>(this.db.from('hazop_session_decisions').select('*').eq('tenant_id', tenantId).eq('id', decisionId).maybeSingle());
    if (!before) throw new NotFoundException('Session decision not found');
    const decision = await this.db.single<any>(this.db.from('hazop_session_decisions').update({ decision_title: dto.decisionTitle ?? before.decision_title, decision_description: dto.decisionDescription ?? before.decision_description, decision_type: dto.decisionType ?? before.decision_type, node_id: dto.nodeId ?? before.node_id, scenario_id: dto.scenarioId ?? before.scenario_id, recommendation_id: dto.recommendationId ?? before.recommendation_id, owner_id: dto.ownerId ?? before.owner_id, decision_date: dto.decisionDate ?? before.decision_date, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', decisionId).select().single());
    await this.afterTeamSessionMutation(tenantId, actorId, study, decision, 'HAZOP_DECISION_UPDATED', 'DECISION_UPDATED', `Decision updated: ${decision.decision_title}`, before, 'hazop_session_decisions');
    return decision;
  }

  async deleteDecision(tenantId: string, actorId: string, studyId: string, sessionId: string, decisionId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.db.single<any>(this.db.from('hazop_session_decisions').delete().eq('tenant_id', tenantId).eq('id', decisionId).select().single());
    await this.afterTeamSessionMutation(tenantId, actorId, study, before, 'HAZOP_DECISION_DELETED', 'DECISION_DELETED', `Decision deleted: ${before.decision_title}`, before, 'hazop_session_decisions');
    return { deleted: true };
  }

  async createSessionAction(tenantId: string, actorId: string, studyId: string, sessionId: string, dto: HazopSessionActionDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const session = await this.session(tenantId, study.id, sessionId);
    if (!dto.title || !dto.ownerId || !dto.dueDate) throw new BadRequestException('Action title, owner, and due date are required');
    const action = await this.actions.create(tenantId, actorId, { title: dto.title, description: dto.description ?? `HAZOP session follow-up for ${session.title}`, sourceModule: 'HAZOP', sourceType: 'session-follow-up', sourceRecordId: session.id, ownerId: dto.ownerId, priority: this.actionPriority(dto.priority ?? 'Medium'), dueDate: dto.dueDate, siteId: study.site_id ?? undefined });
    return this.linkSessionAction(tenantId, actorId, study.id, session.id, { ...dto, actionId: action.id }, scope);
  }

  async linkSessionAction(tenantId: string, actorId: string, studyId: string, sessionId: string, dto: HazopSessionActionDto, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    if (!dto.actionId) throw new BadRequestException('actionId is required');
    const link = await this.db.single<any>(this.db.from('hazop_session_action_links').upsert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, session_id: sessionId, linked_action_id: dto.actionId, node_id: dto.nodeId ?? null, scenario_id: dto.scenarioId ?? null, required_before_session_completion: dto.requiredBeforeSessionCompletion ?? false, verification_required: dto.verificationRequired ?? false, evidence_required: dto.evidenceRequired ?? false, updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,session_id,linked_action_id' }).select().single());
    await this.refreshSessionStatuses(tenantId, study.id, sessionId);
    await this.afterTeamSessionMutation(tenantId, actorId, study, link, 'HAZOP_SESSION_ACTION_LINKED', 'SESSION_ACTION_LINKED', 'Session action linked', undefined, 'hazop_session_action_links');
    return link;
  }

  async unlinkSessionAction(tenantId: string, actorId: string, studyId: string, sessionId: string, linkId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const link = await this.db.single<any>(this.db.from('hazop_session_action_links').delete().eq('tenant_id', tenantId).eq('id', linkId).select().single());
    await this.refreshSessionStatuses(tenantId, study.id, sessionId);
    await this.afterTeamSessionMutation(tenantId, actorId, study, link, 'HAZOP_SESSION_ACTION_UNLINKED', 'SESSION_ACTION_UNLINKED', 'Session action unlinked', link, 'hazop_session_action_links');
    return { deleted: true };
  }

  async syncSessionActions(tenantId: string, actorId: string, studyId: string, sessionId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const session = await this.sessionDetail(tenantId, study.id, sessionId, scope);
    await this.refreshSessionStatuses(tenantId, study.id, sessionId);
    await this.history(tenantId, study.id, actorId, 'SESSION_ACTIONS_SYNCED', 'Session actions synced', session.title);
    return this.sessionDetail(tenantId, study.id, sessionId, scope);
  }

  async exportTeamSessions(tenantId: string, actorId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [summary, team, sessions, coverage, readiness] = await Promise.all([this.teamSessionsSummary(tenantId, study.id, scope), this.teamRegister(tenantId, study.id, {}, scope), this.sessionsRegister(tenantId, study.id, {}, scope), this.teamCoverage(tenantId, study.id, scope), this.teamSignoffReadiness(tenantId, study.id, scope)]);
    const lines: unknown[][] = [
      ['Section', 'Field', 'Value'],
      ['Study', 'Study Number', study.study_number],
      ['Study', 'Title', study.title],
      ['Study', 'Status', study.status],
      ['Study', 'Site', study.site_id ?? ''],
      ['Summary', 'Total Team Members', summary.totalTeamMembers],
      ['Summary', 'Required Members', summary.requiredMembers],
      ['Summary', 'Optional Members', summary.optionalMembers],
      ['Summary', 'Missing Required Disciplines', summary.missingRequiredDisciplines],
      ['Summary', 'Sessions Planned', summary.sessionsPlanned],
      ['Summary', 'Sessions Completed', summary.sessionsCompleted],
      ['Summary', 'Attendance Incomplete', summary.attendanceIncomplete],
      ['Summary', 'Open Session Actions', summary.openSessionActions],
      ['Summary', 'Pending Team Sign-offs', summary.pendingTeamSignoffs],
      ['Summary', 'Sign-off Readiness', readiness.status],
      ...team.map((m) => ['Team Member', m.name, `${m.email ?? ''} / ${m.departmentName ?? ''} / ${m.companyOrContractor ?? ''} / ${m.discipline} / ${m.role} / required:${m.required_attendance ? 'Yes' : 'No'} / sign-off:${m.signoff_required ? 'Yes' : 'No'} / attendance:${m.attendancePercentage ?? 0}% / actions:${m.openActions ?? 0} / ${m.status}`]),
      ...coverage.map((c) => ['Coverage', c.discipline, `${c.required ? 'Required' : 'Optional'} / ${c.coverage_status} / ${c.assignedMember?.display_name ?? c.assignedMember?.name ?? ''} / ${c.missing_reason ?? ''}`]),
      ...sessions.map((s) => ['Session Schedule', `${s.session_number} ${s.title}`, `${s.session_type} / ${s.status} / ${s.session_date ?? ''} ${s.start_time ?? ''}-${s.end_time ?? ''} / ${s.location ?? ''} / attendance:${s.attendance_status} / minutes:${s.minutes_status} / actions:${s.actions_status}`]),
      ...sessions.flatMap((s) => (s.attendance ?? []).map((a: any) => ['Attendance', `${s.session_number} ${s.title}`, `${a.memberName ?? a.team_member_id} / ${a.required ? 'Required' : 'Optional'} / ${a.attendance_status} / ${a.join_time ?? ''}-${a.leave_time ?? ''} / ${a.duration_minutes ?? ''} min / ${a.comment ?? ''}`])),
      ...sessions.flatMap((s) => (s.minutes ?? []).map((m: any) => ['Minutes', `${s.session_number} ${s.title}`, `${m.status} / ${m.summary ?? ''} / Nodes:${(m.nodes_reviewed ?? []).join('; ')} / Decisions:${m.decisions_made ?? ''} / Next:${m.next_session_plan ?? ''}`])),
      ...sessions.flatMap((s) => (s.decisions ?? []).map((d: any) => ['Decision', `${s.session_number} ${s.title}`, `${d.decision_type} / ${d.decision_title} / Owner:${d.owner?.displayName ?? d.owner_id ?? ''} / ${d.decision_date ?? ''}`])),
      ...sessions.flatMap((s) => (s.actionLinks ?? []).map((link: any) => ['Follow-up Action', `${s.session_number} ${s.title}`, `${link.action?.actionNumber ?? link.linked_action_id} / ${link.action?.title ?? ''} / ${link.action?.status ?? ''} / required:${link.required_before_session_completion ? 'Yes' : 'No'} / evidence:${link.evidence_required ? 'Yes' : 'No'} / verification:${link.verification_required ? 'Yes' : 'No'}`])),
      ...Object.entries(readiness.checks ?? {}).map(([key, value]) => ['Readiness Check', key, value ? 'Pass' : 'Blocked'])
    ];
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_TEAM_SESSIONS_EXPORTED', entityType: 'hazop_studies', entityId: study.id, after: { team: team.length, sessions: sessions.length } as JsonValue });
    return { fileName: `${study.study_number}-team-sessions.csv`, contentType: 'text/csv', content: lines.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n') };
  }

  async addLinkedRecord(tenantId: string, actorId: string, studyId: string, dto: Record<string, any>, scope: Scope, emit = true) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const module = dto.linkedModule ?? dto.module ?? dto.recordType ?? dto.type ?? 'Document';
    const recordId = dto.linkedRecordId ?? dto.recordId ?? dto.id;
    if (!module || !recordId) throw new BadRequestException('Linked module and record are required');
    const duplicate = await this.db.single<any>(this.db.from('hazop_linked_records').select('id').eq('tenant_id', tenantId).eq('study_id', study.id).eq('linked_module', module).eq('linked_record_id', recordId).maybeSingle()).catch(() => null);
    if (duplicate) throw new BadRequestException('This record is already linked to the study');
    const link = await this.db.single<any>(this.db.from('hazop_linked_records').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      record_type: module,
      record_id: recordId,
      record_number: dto.linkedRecordNumber ?? dto.recordNumber ?? null,
      title: dto.linkedRecordTitle ?? dto.title ?? null,
      linked_module: module,
      linked_record_type: dto.linkedRecordType ?? module,
      linked_record_id: recordId,
      linked_record_number: dto.linkedRecordNumber ?? dto.recordNumber ?? null,
      linked_record_title: dto.linkedRecordTitle ?? dto.title ?? null,
      relationship_type: dto.relationshipType ?? 'Related',
      dependency_direction: dto.dependencyDirection ?? 'Reference only',
      blocking_rule: dto.blockingRule ?? 'Not blocking',
      blocking_status: dto.blockingRule && dto.blockingRule !== 'Not blocking' ? 'Blocking' : 'Not Blocking',
      link_reason: dto.linkReason ?? dto.reason ?? null,
      notes: dto.notes ?? null,
      owner_id: dto.ownerId ?? null,
      equipment_tag: dto.equipmentTag ?? null,
      document_version: dto.documentVersion ?? null,
      record_status: dto.status ?? dto.recordStatus ?? null,
      created_by: actorId,
      updated_by: actorId,
      last_synced_at: new Date().toISOString()
    }).select().single());
    await this.calculateLinkedRecordBlockers(tenantId, study, link);
    if (emit) await this.history(tenantId, study.id, actorId, 'LINKED_RECORD_ADDED', 'Linked record added', link.linked_record_title ?? link.linked_record_id, { linkedRecordId: link.id });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_LINKED_RECORD_ADDED', entityType: 'hazop_linked_records', entityId: link.id, after: link as JsonValue });
    await this.indexHazopLinkedRecord(tenantId, study, link);
    return link;
  }

  async linkedRecordsSummary(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [links, blockers, scenarios] = await Promise.all([
      this.linkedRecordsRegister(tenantId, study.id, {}, scope),
      this.linkedRecordBlockers(tenantId, study.id, scope),
      this.safeMany<any>(this.db.from('hazop_scenarios').select('id,lopa_required').eq('tenant_id', tenantId).eq('study_id', study.id))
    ]);
    const by = (module: string[]) => links.filter((link) => module.includes(String(link.linked_module ?? link.record_type))).length;
    return {
      totalLinkedRecords: links.length,
      linkedMocs: by(['MOC']),
      linkedPssrs: by(['PSSR']),
      linkedEquipment: by(['Equipment']),
      linkedDocuments: by(['Document', 'P&ID', 'SOP']),
      linkedActions: by(['Universal Action', 'Action']),
      linkedIncidentsAudits: by(['Incident', 'Audit']),
      openBlockers: blockers.filter((blocker) => blocker.status === 'Open').length,
      outdatedDocuments: blockers.filter((blocker) => blocker.blocker_type === 'Outdated Document' && blocker.status === 'Open').length,
      lopaRequiredPending: scenarios.filter((scenario) => scenario.lopa_required).length + by(['LOPA/SIL']),
      recordsNeedingReview: links.filter((link) => ['Needs Review', 'Blocking'].includes(link.blocking_status)).length
    };
  }

  async linkedRecordsRegister(tenantId: string, studyId: string, query: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    let rows = await this.safeMany<any>(this.db.from('hazop_linked_records').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('updated_at', { ascending: false }));
    const blockers = await this.safeMany<any>(this.db.from('hazop_linked_record_blockers').select('*').eq('tenant_id', tenantId).eq('study_id', study.id));
    rows = rows.map((row) => ({ ...row, blockers: blockers.filter((blocker) => blocker.linked_record_id === row.id), restricted: false, url: this.linkedRecordUrl(row) }));
    if (query.module && query.module !== 'All') rows = rows.filter((row) => String(row.linked_module ?? row.record_type) === String(query.module));
    if (query.relationshipType && query.relationshipType !== 'All') rows = rows.filter((row) => String(row.relationship_type) === String(query.relationshipType));
    if (query.blockingStatus && query.blockingStatus !== 'All') rows = rows.filter((row) => String(row.blocking_status) === String(query.blockingStatus));
    const search = String(query.search ?? '').toLowerCase();
    if (search) rows = rows.filter((row) => [row.linked_record_number, row.linked_record_title, row.record_number, row.title, row.link_reason, row.notes].filter(Boolean).join(' ').toLowerCase().includes(search));
    return rows;
  }

  async linkedRecordDetail(tenantId: string, studyId: string, linkId: string, scope: Scope) {
    const rows = await this.linkedRecordsRegister(tenantId, studyId, {}, scope);
    const link = rows.find((row) => row.id === linkId);
    if (!link) throw new NotFoundException('Linked record not found');
    const history = await this.safeMany<any>(this.db.from('hazop_history_events').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).contains('metadata', { linkedRecordId: linkId }).order('created_at', { ascending: false })).catch(() => []);
    return { ...link, history };
  }

  async updateLinkedRecord(tenantId: string, actorId: string, studyId: string, linkId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.linkedRecordRaw(tenantId, study.id, linkId);
    const patch = {
      relationship_type: dto.relationshipType ?? before.relationship_type,
      dependency_direction: dto.dependencyDirection ?? before.dependency_direction,
      blocking_rule: dto.blockingRule ?? before.blocking_rule,
      blocking_status: dto.blockingStatus ?? (dto.blockingRule && dto.blockingRule !== 'Not blocking' ? 'Blocking' : before.blocking_status),
      link_reason: dto.linkReason ?? before.link_reason,
      notes: dto.notes ?? before.notes,
      owner_id: dto.ownerId ?? before.owner_id,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    };
    const updated = await this.db.single<any>(this.db.from('hazop_linked_records').update(patch).eq('tenant_id', tenantId).eq('id', linkId).select().single());
    await this.calculateLinkedRecordBlockers(tenantId, study, updated);
    await this.history(tenantId, study.id, actorId, 'LINKED_RECORD_UPDATED', 'Linked record updated', updated.linked_record_title ?? updated.linked_record_id, { linkedRecordId: linkId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_LINKED_RECORD_UPDATED', entityType: 'hazop_linked_records', entityId: linkId, before: before as JsonValue, after: updated as JsonValue });
    return updated;
  }

  async removeLinkedRecord(tenantId: string, actorId: string, studyId: string, linkId: string, reason: string | undefined, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.db.single<any>(this.db.from('hazop_linked_records').delete().eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', linkId).select().single());
    await this.history(tenantId, study.id, actorId, 'LINKED_RECORD_REMOVED', 'Linked record removed', reason ?? before.linked_record_title ?? before.linked_record_id, { linkedRecordId: linkId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_LINKED_RECORD_REMOVED', entityType: 'hazop_linked_records', entityId: linkId, before: before as JsonValue, metadata: { reason: reason ?? null } as JsonValue });
    return { deleted: true };
  }

  async syncLinkedRecord(tenantId: string, actorId: string, studyId: string, linkId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const link = await this.linkedRecordRaw(tenantId, study.id, linkId);
    const resolved = await this.resolveLinkedRecordStatus(tenantId, link);
    const updated = await this.db.single<any>(this.db.from('hazop_linked_records').update({ record_status: resolved.status ?? link.record_status, linked_record_title: resolved.title ?? link.linked_record_title, linked_record_number: resolved.number ?? link.linked_record_number, last_synced_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', linkId).select().single());
    await this.calculateLinkedRecordBlockers(tenantId, study, updated);
    await this.history(tenantId, study.id, actorId, 'LINKED_RECORD_SYNCED', 'Linked record synced', updated.linked_record_title ?? updated.linked_record_id, { linkedRecordId: linkId });
    return updated;
  }

  async markLinkedRecordBlocking(tenantId: string, actorId: string, studyId: string, linkId: string, dto: Record<string, any>, scope: Scope) {
    return this.updateLinkedRecord(tenantId, actorId, studyId, linkId, { ...dto, blockingStatus: 'Blocking', blockingRule: dto.blockingRule ?? 'Blocks HAZOP closure' }, scope);
  }

  async resolveLinkedRecordBlocker(tenantId: string, actorId: string, studyId: string, blockerId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const blocker = await this.db.single<any>(this.db.from('hazop_linked_record_blockers').update({ status: 'Resolved', resolved_by: actorId, resolved_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', blockerId).select().single());
    await this.history(tenantId, study.id, actorId, 'LINKED_RECORD_BLOCKER_RESOLVED', 'Linked record blocker resolved', dto.reason ?? blocker.blocker_description, { blockerId });
    return blocker;
  }

  async linkedRecordBlockers(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    return this.safeMany<any>(this.db.from('hazop_linked_record_blockers').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('created_at', { ascending: false }));
  }

  async linkedRecordsContext(tenantId: string, studyId: string, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    return {
      modules: ['MOC', 'PSSR', 'PTW', 'Equipment', 'Document', 'Incident', 'Audit', 'Training', 'Mechanical Integrity', 'Universal Action', 'LOPA/SIL', 'Previous HAZOP', 'Chemical / SDS / PSI', 'Other'],
      relationshipTypes: ['Source / Trigger', 'Related', 'Dependency', 'Blocking', 'Output / Generated From HAZOP', 'Required For Closure', 'Required For Approval', 'Required For Startup', 'Reference Only'],
      dependencyDirections: ['HAZOP depends on record', 'Record depends on HAZOP', 'Bi-directional', 'Reference only'],
      blockingRules: ['Not blocking', 'Blocks HAZOP approval', 'Blocks HAZOP closure', 'Blocks MOC closure', 'Blocks PSSR startup', 'Blocks future LOPA completion']
    };
  }

  async searchLinkedRecords(tenantId: string, studyId: string, query: Record<string, any>, scope: Scope) {
    await this.study(tenantId, studyId, scope);
    const module = query.module ?? 'Other';
    const q = String(query.q ?? '').toLowerCase();
    const map: Record<string, any[]> = await this.linkedSearchSources(tenantId);
    const rows = map[module] ?? [];
    return rows.filter((row: any) => !q || [row.number, row.title, row.subtitle].filter(Boolean).join(' ').toLowerCase().includes(q)).slice(0, 25);
  }

  async exportLinkedRecords(tenantId: string, actorId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const rows = await this.linkedRecordsRegister(tenantId, study.id, {}, scope);
    const csvRows: unknown[][] = [
      ['Module', 'Record Number', 'Title', 'Status', 'Relationship', 'Dependency', 'Blocking Rule', 'Blocking Status', 'Owner', 'Last Synced'],
      ...rows.map((row) => [row.linked_module, row.linked_record_number, row.linked_record_title, row.record_status, row.relationship_type, row.dependency_direction, row.blocking_rule, row.blocking_status, row.owner_id, row.last_synced_at])
    ];
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_LINKED_RECORDS_EXPORTED', entityType: 'hazop_studies', entityId: study.id, after: { rows: rows.length } as JsonValue });
    return { fileName: `${study.study_number}-linked-records.csv`, contentType: 'text/csv', content: this.csv(csvRows) };
  }

  async reviewReadiness(tenantId: string, studyId: string, scope: Scope, persist = true) {
    const study = await this.study(tenantId, studyId, scope);
    const [nodes, scenarios, recommendations, actions, safeguards, sessions, team, signoffs, linkedBlockers] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_nodes').select('id,status').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_scenarios').select('id,status,risk_level,lopa_required,lopa_status,recommendation_required,acceptance_required').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_recommendations').select('id,status,linked_action_id,action_id,closure_blocker').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('Action').select('id,status').eq('tenantId', tenantId)),
      this.safeMany<any>(this.db.from('hazop_scenario_safeguards').select('id,gap_status,ipl_candidate,ipl_validation_status').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_study_sessions').select('id,status,minutes_status').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_study_team_members').select('id,status,required_attendance,signoff_required').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_signoffs').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.linkedRecordBlockers(tenantId, study.id, scope)
    ]);
    const actionById = new Map(actions.map((action) => [action.id, action]));
    const openRecommendations = recommendations.filter((rec) => !['Verified Closed', 'Closed', 'Cancelled', 'Accepted Risk / No Action'].includes(rec.status));
    const openActions = recommendations.filter((rec) => {
      const action = actionById.get(rec.linked_action_id ?? rec.action_id);
      return action && !['Closed', 'Completed', 'Verified', 'Cancelled'].includes(action.status);
    });
    const missingSignoffAssignees = signoffs.filter((signoff) => signoff.required !== false && !(signoff.assigned_user_id ?? signoff.signer_user_id) && signoff.status !== 'Not Required');
    const checks = [
      { key: 'study_basic_info_complete', label: 'Study basic info complete', category: 'Study', hard_blocker: true, status: study.study_number && study.title && study.study_type ? 'Pass' : 'Blocked', value: study.study_number && study.title && study.study_type ? 1 : 0, required_value: 1, message: 'Study number, title, and study type are required before review.' },
      { key: 'scope_defined', label: 'Scope defined', category: 'Study', hard_blocker: false, status: study.scope_description || study.scope_summary || study.objective ? 'Pass' : 'Warning', value: study.scope_description || study.scope_summary || study.objective ? 1 : 0, required_value: 1, message: 'Scope, objective, and boundaries should be defined before sign-off.' },
      { key: 'nodes_completed', label: 'Nodes completed', category: 'Worksheet', hard_blocker: true, status: nodes.length === 0 || nodes.every((node) => ['Completed', 'Closed', 'Approved'].includes(node.status)) ? 'Pass' : 'Blocked', value: nodes.filter((node) => ['Completed', 'Closed', 'Approved'].includes(node.status)).length, required_value: nodes.length, message: 'All HAZOP nodes must be completed or accepted.' },
      { key: 'scenarios_ranked', label: 'Scenarios ranked', category: 'Risk', hard_blocker: true, status: scenarios.every((scenario) => scenario.risk_level) ? 'Pass' : 'Blocked', value: scenarios.filter((scenario) => scenario.risk_level).length, required_value: scenarios.length, message: 'Every scenario must have backend-calculated risk ranking.' },
      { key: 'high_critical_resolved', label: 'High/Critical scenarios resolved', category: 'Risk', hard_blocker: true, status: scenarios.filter((scenario) => ['High', 'Critical'].includes(scenario.risk_level)).every((scenario) => scenario.status === 'Closed' || !scenario.recommendation_required || scenario.acceptance_required) ? 'Pass' : 'Blocked', value: scenarios.filter((scenario) => ['High', 'Critical'].includes(scenario.risk_level)).length, required_value: 0, message: 'High and critical scenarios need recommendations or documented acceptance.' },
      { key: 'recommendations_closed', label: 'Required recommendations closed', category: 'Actions', hard_blocker: true, status: openRecommendations.length === 0 ? 'Pass' : 'Blocked', value: openRecommendations.length, required_value: 0, message: 'Closure-blocking recommendations must be closed or accepted.' },
      { key: 'actions_closed', label: 'Linked actions closed', category: 'Actions', hard_blocker: true, status: openActions.length === 0 ? 'Pass' : 'Blocked', value: openActions.length, required_value: 0, message: 'Universal actions linked to required recommendations must be closed.' },
      { key: 'lopa_completed', label: 'LOPA triggers completed', category: 'LOPA', hard_blocker: true, status: scenarios.filter((scenario) => scenario.lopa_required).every((scenario) => ['Completed', 'Not Required', 'Accepted'].includes(scenario.lopa_status ?? '')) ? 'Pass' : 'Blocked', value: scenarios.filter((scenario) => scenario.lopa_required).length, required_value: 0, message: 'Required LOPA/SIL reviews must be completed or dispositioned.' },
      { key: 'safeguard_gaps_closed', label: 'Safeguard gaps closed', category: 'Safeguards', hard_blocker: true, status: safeguards.filter((safeguard) => ['Open', 'Action Required', 'Failed'].includes(safeguard.gap_status ?? '') || (safeguard.ipl_candidate && safeguard.ipl_validation_status === 'Failed')).length === 0 ? 'Pass' : 'Blocked', value: safeguards.length, required_value: 0, message: 'Open safeguard and IPL validation gaps must be resolved.' },
      { key: 'sessions_completed', label: 'Required sessions completed', category: 'Team', hard_blocker: false, status: sessions.every((session) => ['Completed', 'Cancelled'].includes(session.status)) ? 'Pass' : 'Warning', value: sessions.filter((session) => session.status === 'Completed').length, required_value: sessions.length, message: 'All required review sessions should be completed.' },
      { key: 'minutes_completed', label: 'Meeting minutes completed', category: 'Team', hard_blocker: false, status: sessions.every((session) => ['Completed', 'Approved', 'Not Required'].includes(session.minutes_status ?? '')) ? 'Pass' : 'Warning', value: sessions.filter((session) => ['Completed', 'Approved'].includes(session.minutes_status ?? '')).length, required_value: sessions.length, message: 'Meeting minutes should be completed before sign-off.' },
      { key: 'team_active', label: 'Required team members active', category: 'Team', hard_blocker: true, status: team.filter((member) => member.signoff_required || member.required_attendance).every((member) => member.status === 'Active') ? 'Pass' : 'Blocked', value: team.filter((member) => member.status === 'Active').length, required_value: team.length, message: 'Required team members must be active.' },
      { key: 'signoff_assignees_complete', label: 'Required sign-off assignees assigned', category: 'Sign-off', hard_blocker: true, status: missingSignoffAssignees.length === 0 ? 'Pass' : 'Blocked', value: signoffs.length - missingSignoffAssignees.length, required_value: signoffs.length, message: 'Required sign-off roles must have an assigned team member before request, approval, or closure.' },
      { key: 'signoffs_completed', label: 'Required sign-offs completed', category: 'Sign-off', hard_blocker: true, status: signoffs.filter((signoff) => signoff.required !== false).every((signoff) => signoff.status === 'Signed') ? 'Pass' : 'Blocked', value: signoffs.filter((signoff) => signoff.status === 'Signed').length, required_value: signoffs.filter((signoff) => signoff.required !== false).length, message: 'All required HAZOP sign-offs must be complete.' },
      { key: 'linked_blockers_resolved', label: 'Linked record blockers resolved', category: 'Linked Records', hard_blocker: true, status: linkedBlockers.filter((blocker) => blocker.status === 'Open').length === 0 ? 'Pass' : 'Blocked', value: linkedBlockers.filter((blocker) => blocker.status === 'Open').length, required_value: 0, message: 'Linked record hard blockers must be resolved.' }
    ];
    const hardBlockers = checks.filter((check) => check.hard_blocker && check.status === 'Blocked');
    const warnings = checks.filter((check) => check.status === 'Warning');
    const blockers = hardBlockers.map((check) => ({ blocker_type: check.category, blocker_key: check.key, blocker_title: check.label, blocker_description: check.message, severity: 'Hard', status: 'Open' }));
    if (persist) {
      await this.upsertReadinessChecks(tenantId, study.id, checks);
      await this.refreshClosureBlockers(tenantId, study, blockers);
    }
    return {
      ready: hardBlockers.length === 0,
      status: hardBlockers.length ? 'Blocked' : warnings.length ? 'Warning' : 'Ready',
      progress: checks.length ? Math.round((checks.filter((check) => check.status === 'Pass').length / checks.length) * 100) : 0,
      nodesCompleted: checks.find((check) => check.key === 'nodes_completed')?.value ?? 0,
      scenariosRanked: checks.find((check) => check.key === 'scenarios_ranked')?.value ?? 0,
      highCriticalResolved: checks.find((check) => check.key === 'high_critical_resolved')?.status === 'Pass',
      recommendationsOpen: openRecommendations.length,
      actionsOpen: openActions.length,
      lopaPending: scenarios.filter((scenario) => scenario.lopa_required && !['Completed', 'Not Required', 'Accepted'].includes(scenario.lopa_status ?? '')).length,
      safeguardGapsOpen: checks.find((check) => check.key === 'safeguard_gaps_closed')?.status === 'Blocked' ? safeguards.length : 0,
      sessionsCompleted: sessions.filter((session) => session.status === 'Completed').length,
      signoffsPending: signoffs.filter((signoff) => signoff.required !== false && signoff.status !== 'Signed').length,
      linkedBlockers: linkedBlockers.filter((blocker) => blocker.status === 'Open').length,
      checks,
      blockers,
      warnings
    };
  }

  async recalculateReviewReadiness(tenantId: string, actorId: string, studyId: string, scope: Scope) {
    const readiness = await this.reviewReadiness(tenantId, studyId, scope, true);
    await this.history(tenantId, studyId, actorId, 'REVIEW_READINESS_RECALCULATED', 'Review readiness recalculated', readiness.status, { progress: readiness.progress });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_REVIEW_READINESS_RECALCULATED', entityType: 'hazop_studies', entityId: studyId, after: readiness as JsonValue });
    return readiness;
  }

  async reviewBlockers(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    await this.reviewReadiness(tenantId, study.id, scope, true);
    return this.safeMany<any>(this.db.from('hazop_closure_blockers').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('severity', { ascending: true }));
  }

  async signoffs(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [signoffs, users] = await Promise.all([
      this.signoffRows(tenantId, study.id),
      this.safeMany<any>(this.db.from('User').select('id,displayName,email,title,department').eq('tenantId', tenantId))
    ]);
    return signoffs.map((signoff) => ({
      ...signoff,
      role: signoff.signoff_role ?? signoff.signature_role,
      assignedUser: this.signoffUser(users.find((user) => user.id === (signoff.assigned_user_id ?? signoff.signer_user_id))),
      signedByUser: this.signoffUser(users.find((user) => user.id === (signoff.signed_by ?? signoff.signer_user_id))),
      rejectedByUser: this.signoffUser(users.find((user) => user.id === signoff.rejected_by))
    }));
  }

  async generateSignoffs(tenantId: string, actorId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    await this.ensureSignoffMatrix(tenantId, study, actorId, false);
    await this.safeHistory(tenantId, study.id, actorId, 'SIGNOFF_MATRIX_GENERATED', 'Required sign-off matrix generated');
    await this.safeAudit({ tenantId, actorId, action: 'HAZOP_SIGNOFF_MATRIX_GENERATED', entityType: 'hazop_studies', entityId: study.id, after: { studyId: study.id } as JsonValue });
    return this.signoffs(tenantId, study.id, scope);
  }

  async requestSignoff(tenantId: string, actorId: string, studyId: string, signoffId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const signoff = await this.signoffRaw(tenantId, study.id, signoffId);
    if (['Signed', 'Superseded', 'Not Required'].includes(signoff.status)) throw new BadRequestException('This sign-off cannot be requested');
    const readiness = await this.reviewReadiness(tenantId, study.id, scope, true);
    const hardBlockers = readiness.checks.filter((check: any) => check.hard_blocker && check.status === 'Blocked' && check.key !== 'signoffs_completed');
    if (hardBlockers.length && !dto.overrideBlockers) throw new BadRequestException('Sign-off cannot be requested while hard readiness blockers are open');
    const updated = await this.db.single<any>(this.db.from('hazop_signoffs').update({ status: 'Requested', requested_by: actorId, requested_at: new Date().toISOString(), comment: dto.message ?? signoff.comment, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', signoffId).select().single());
    if (updated.assigned_user_id ?? updated.signer_user_id) await this.notifications.notifyUser({
      tenantId,
      companyId: study.company_id ?? null,
      siteId: study.site_id ?? null,
      userId: updated.assigned_user_id ?? updated.signer_user_id,
      type: 'hazop.signoff.requested',
      module: 'hazop',
      title: 'HAZOP sign-off requested',
      message: `${study.study_number} requires your ${updated.signoff_role ?? updated.signature_role} sign-off`,
      relatedRecordId: updated.id,
      relatedRecordType: 'hazop_signoffs',
      relatedUrl: `/hazop/${study.id}?tab=review`,
      priority: 'Action Required',
      metadata: { studyId: study.id, signoffId: updated.id }
    });
    await this.history(tenantId, study.id, actorId, 'SIGNOFF_REQUESTED', 'Sign-off requested', updated.signoff_role ?? updated.signature_role, { signoffId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SIGNOFF_REQUESTED', entityType: 'hazop_signoffs', entityId: signoffId, before: signoff as JsonValue, after: updated as JsonValue });
    return updated;
  }

  async signHazopSignoff(tenantId: string, actorId: string, studyId: string, signoffId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const signoff = await this.signoffRaw(tenantId, study.id, signoffId);
    if (signoff.status === 'Signed') throw new BadRequestException('Signed sign-off records are immutable');
    if (signoff.status === 'Superseded') throw new BadRequestException('Superseded sign-off records cannot be signed');
    const assignedUserId = signoff.assigned_user_id ?? signoff.signer_user_id;
    if (!assignedUserId) throw new BadRequestException('Sign-off must be assigned before signing');
    if (assignedUserId && assignedUserId !== actorId) throw new ForbiddenException('You cannot sign for another user');
    if (!dto.confirmation && !dto.eSignatureId && !dto.signatureId) throw new BadRequestException('Electronic signature confirmation is required');
    const updated = await this.db.single<any>(this.db.from('hazop_signoffs').update({
      status: 'Signed',
      signed_by: actorId,
      signer_user_id: actorId,
      signed_at: new Date().toISOString(),
      comment: dto.comment ?? signoff.comment,
      e_signature_id: dto.eSignatureId ?? dto.signatureId ?? null,
      signature_snapshot: dto.signatureSnapshot ?? signoff.signature_snapshot ?? null,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('id', signoffId).select().single());
    await this.history(tenantId, study.id, actorId, 'SIGNOFF_COMPLETED', 'HAZOP sign-off completed', updated.signoff_role ?? updated.signature_role, { signoffId, eSignatureId: updated.e_signature_id });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SIGNOFF_SIGNED', entityType: 'hazop_signoffs', entityId: signoffId, before: signoff as JsonValue, after: updated as JsonValue });
    await this.reviewReadiness(tenantId, study.id, scope, true);
    return updated;
  }

  async rejectHazopSignoff(tenantId: string, actorId: string, studyId: string, signoffId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const signoff = await this.signoffRaw(tenantId, study.id, signoffId);
    if (signoff.status === 'Signed') throw new BadRequestException('Signed sign-off records are immutable');
    if (signoff.status === 'Superseded') throw new BadRequestException('Superseded sign-off records cannot be rejected');
    const assignedUserId = signoff.assigned_user_id ?? signoff.signer_user_id;
    if (assignedUserId && assignedUserId !== actorId) throw new ForbiddenException('You cannot reject another user sign-off');
    const reason = dto.reason ?? dto.comment;
    if (!reason) throw new BadRequestException('Rejection reason is required');
    const updated = await this.db.single<any>(this.db.from('hazop_signoffs').update({ status: 'Rejected', rejected_by: actorId, rejected_at: new Date().toISOString(), rejection_reason: reason, comment: reason, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', signoffId).select().single());
    await this.history(tenantId, study.id, actorId, 'SIGNOFF_REJECTED', 'HAZOP sign-off rejected', reason, { signoffId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SIGNOFF_REJECTED', entityType: 'hazop_signoffs', entityId: signoffId, before: signoff as JsonValue, after: updated as JsonValue });
    return updated;
  }

  async delegateHazopSignoff(tenantId: string, actorId: string, studyId: string, signoffId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const signoff = await this.signoffRaw(tenantId, study.id, signoffId);
    if (!dto.assignedUserId && !dto.userId) throw new BadRequestException('Delegate user is required');
    const updated = await this.db.single<any>(this.db.from('hazop_signoffs').update({ assigned_user_id: dto.assignedUserId ?? dto.userId, signer_user_id: dto.assignedUserId ?? dto.userId, status: 'Requested', comment: dto.reason ?? signoff.comment, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', signoffId).select().single());
    await this.history(tenantId, study.id, actorId, 'SIGNOFF_DELEGATED', 'HAZOP sign-off delegated', dto.reason ?? null, { signoffId, delegatedTo: updated.assigned_user_id });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SIGNOFF_DELEGATED', entityType: 'hazop_signoffs', entityId: signoffId, before: signoff as JsonValue, after: updated as JsonValue });
    return updated;
  }

  async supersedeHazopSignoff(tenantId: string, actorId: string, studyId: string, signoffId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const signoff = await this.signoffRaw(tenantId, study.id, signoffId);
    const updated = await this.db.single<any>(this.db.from('hazop_signoffs').update({ status: 'Superseded', superseded_at: new Date().toISOString(), superseded_by_change_id: dto.changeId ?? null, comment: dto.reason ?? signoff.comment, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', signoffId).select().single());
    await this.history(tenantId, study.id, actorId, 'SIGNOFF_SUPERSEDED', 'HAZOP sign-off superseded', dto.reason ?? null, { signoffId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_SIGNOFF_SUPERSEDED', entityType: 'hazop_signoffs', entityId: signoffId, before: signoff as JsonValue, after: updated as JsonValue });
    return updated;
  }

  async reviewWorkflow(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    return this.ensureApprovalWorkflow(tenantId, study);
  }

  async startReview(tenantId: string, actorId: string, studyId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const workflow = await this.ensureApprovalWorkflow(tenantId, study);
    const updatedWorkflow = await this.updateApprovalWorkflow(tenantId, workflow.id, { status: 'In Review', current_step: 'Review', started_by: workflow.started_by ?? actorId, started_at: workflow.started_at ?? new Date().toISOString(), updated_at: new Date().toISOString() });
    await this.updateStudyStatus(tenantId, study.id, 'In Review');
    await this.safeHistory(tenantId, study.id, actorId, 'REVIEW_STARTED', 'HAZOP review started', dto.comment ?? null);
    await this.safeAudit({ tenantId, actorId, action: 'HAZOP_REVIEW_STARTED', entityType: 'hazop_approval_workflows', entityId: workflow.id, before: workflow as JsonValue, after: updatedWorkflow as JsonValue });
    return updatedWorkflow;
  }

  async requestReviewApproval(tenantId: string, actorId: string, studyId: string, dto: Record<string, any>, scope: Scope) {
    const readiness = await this.reviewReadiness(tenantId, studyId, scope, true);
    if (!readiness.ready) throw new BadRequestException('Approval cannot proceed while hard readiness blockers are open');
    const study = await this.study(tenantId, studyId, scope);
    const workflow = await this.ensureApprovalWorkflow(tenantId, study);
    const updatedWorkflow = await this.updateApprovalWorkflow(tenantId, workflow.id, { status: 'Pending Approval', current_step: 'Approval', requested_by: actorId, requested_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    await this.updateStudyStatus(tenantId, study.id, 'Pending Approval');
    await this.safeHistory(tenantId, study.id, actorId, 'APPROVAL_REQUESTED', 'HAZOP approval requested', dto.comment ?? null);
    await this.safeAudit({ tenantId, actorId, action: 'HAZOP_REVIEW_APPROVAL_REQUESTED', entityType: 'hazop_approval_workflows', entityId: workflow.id, before: workflow as JsonValue, after: updatedWorkflow as JsonValue });
    return updatedWorkflow;
  }

  async approveReview(tenantId: string, actorId: string, studyId: string, dto: Record<string, any>, scope: Scope) {
    const readiness = await this.reviewReadiness(tenantId, studyId, scope, true);
    if (!readiness.ready) throw new BadRequestException('Approval cannot proceed while hard readiness blockers are open');
    const study = await this.study(tenantId, studyId, scope);
    const workflow = await this.ensureApprovalWorkflow(tenantId, study);
    const updatedWorkflow = await this.updateApprovalWorkflow(tenantId, workflow.id, { status: 'Approved', current_step: 'Approved', approved_by: actorId, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    await this.updateStudyStatus(tenantId, study.id, 'Approved');
    await this.safeHistory(tenantId, study.id, actorId, 'REVIEW_APPROVED', 'HAZOP review approved', dto.comment ?? null);
    await this.safeAudit({ tenantId, actorId, action: 'HAZOP_REVIEW_APPROVED', entityType: 'hazop_approval_workflows', entityId: workflow.id, before: workflow as JsonValue, after: updatedWorkflow as JsonValue });
    return updatedWorkflow;
  }

  async rejectReview(tenantId: string, actorId: string, studyId: string, dto: Record<string, any>, scope: Scope) {
    const reason = dto.reason ?? dto.comment;
    if (!reason) throw new BadRequestException('Rejection reason is required');
    const study = await this.study(tenantId, studyId, scope);
    const workflow = await this.ensureApprovalWorkflow(tenantId, study);
    const updatedWorkflow = await this.updateApprovalWorkflow(tenantId, workflow.id, { status: 'Rejected', current_step: 'Rework', rejected_by: actorId, rejected_at: new Date().toISOString(), rejection_reason: reason, updated_at: new Date().toISOString() });
    await this.updateStudyStatus(tenantId, study.id, 'In Review');
    await this.safeHistory(tenantId, study.id, actorId, 'REVIEW_REJECTED', 'HAZOP review rejected', reason);
    await this.safeAudit({ tenantId, actorId, action: 'HAZOP_REVIEW_REJECTED', entityType: 'hazop_approval_workflows', entityId: workflow.id, before: workflow as JsonValue, after: updatedWorkflow as JsonValue });
    return updatedWorkflow;
  }

  async returnForRework(tenantId: string, actorId: string, studyId: string, dto: Record<string, any>, scope: Scope) {
    const reason = dto.reason ?? dto.comment;
    if (!reason) throw new BadRequestException('Return-for-rework reason is required');
    const study = await this.study(tenantId, studyId, scope);
    const workflow = await this.ensureApprovalWorkflow(tenantId, study);
    const updatedWorkflow = await this.updateApprovalWorkflow(tenantId, workflow.id, { status: 'Returned for Rework', current_step: 'Rework', returned_by: actorId, returned_at: new Date().toISOString(), return_reason: reason, updated_at: new Date().toISOString() });
    await this.updateStudyStatus(tenantId, study.id, 'In Progress');
    await this.safeHistory(tenantId, study.id, actorId, 'RETURNED_FOR_REWORK', 'HAZOP returned for rework', reason);
    await this.safeAudit({ tenantId, actorId, action: 'HAZOP_REVIEW_RETURNED_FOR_REWORK', entityType: 'hazop_approval_workflows', entityId: workflow.id, before: workflow as JsonValue, after: updatedWorkflow as JsonValue });
    return updatedWorkflow;
  }

  async closeReview(tenantId: string, actorId: string, studyId: string, dto: Record<string, any>, scope: Scope) {
    const readiness = await this.reviewReadiness(tenantId, studyId, scope, true);
    if (!readiness.ready) throw new BadRequestException('Study cannot close while hard closure blockers are open');
    const study = await this.study(tenantId, studyId, scope);
    const workflow = await this.ensureApprovalWorkflow(tenantId, study);
    const updatedWorkflow = await this.updateApprovalWorkflow(tenantId, workflow.id, { status: 'Closed', current_step: 'Closed', closed_by: actorId, closed_at: new Date().toISOString(), closure_comment: dto.comment ?? null, updated_at: new Date().toISOString() });
    await this.updateStudyStatus(tenantId, study.id, 'Closed');
    await this.safeHistory(tenantId, study.id, actorId, 'STUDY_CLOSED', 'HAZOP study closed', dto.comment ?? null);
    await this.safeAudit({ tenantId, actorId, action: 'HAZOP_STUDY_CLOSED', entityType: 'hazop_studies', entityId: study.id, before: { status: study.status } as JsonValue, after: { status: 'Closed' } as JsonValue });
    return updatedWorkflow;
  }

  async reopenReview(tenantId: string, actorId: string, studyId: string, dto: Record<string, any>, scope: Scope) {
    const reason = dto.reason ?? dto.comment;
    if (!reason) throw new BadRequestException('Reopen reason is required');
    const study = await this.study(tenantId, studyId, scope);
    const workflow = await this.ensureApprovalWorkflow(tenantId, study);
    const updatedWorkflow = await this.updateApprovalWorkflow(tenantId, workflow.id, { status: 'Reopened', current_step: 'Rework', reopened_by: actorId, reopened_at: new Date().toISOString(), reopen_reason: reason, updated_at: new Date().toISOString() });
    await this.updateStudyStatus(tenantId, study.id, 'In Progress');
    await this.safeHistory(tenantId, study.id, actorId, 'STUDY_REOPENED', 'HAZOP study reopened', reason);
    await this.safeAudit({ tenantId, actorId, action: 'HAZOP_STUDY_REOPENED', entityType: 'hazop_studies', entityId: study.id, before: { status: study.status } as JsonValue, after: { status: 'In Progress', reason } as JsonValue });
    return updatedWorkflow;
  }

  async reviewComments(tenantId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [comments, users] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_review_comments').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('created_at', { ascending: false })),
      this.safeMany<any>(this.db.from('User').select('id,displayName,email,title').eq('tenantId', tenantId))
    ]);
    return comments.map((comment) => ({ ...comment, author: users.find((user) => user.id === comment.author_id), resolver: users.find((user) => user.id === comment.resolved_by) }));
  }

  async addReviewComment(tenantId: string, actorId: string, studyId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    if (!dto.comment && !dto.commentText) throw new BadRequestException('Review comment is required');
    const comment = await this.db.single<any>(this.db.from('hazop_review_comments').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      comment_type: dto.commentType ?? dto.type ?? 'General',
      comment_text: dto.comment ?? dto.commentText,
      severity: dto.severity ?? 'Info',
      related_section: dto.relatedSection ?? null,
      related_record_id: dto.relatedRecordId ?? null,
      status: 'Open',
      requires_resolution: Boolean(dto.requiresResolution ?? false),
      author_id: actorId
    }).select().single());
    await this.history(tenantId, study.id, actorId, 'REVIEW_COMMENT_ADDED', 'Review comment added', comment.comment_text, { commentId: comment.id });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_REVIEW_COMMENT_ADDED', entityType: 'hazop_review_comments', entityId: comment.id, after: comment as JsonValue });
    return comment;
  }

  async updateReviewComment(tenantId: string, actorId: string, studyId: string, commentId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const before = await this.db.single<any>(this.db.from('hazop_review_comments').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', commentId).maybeSingle());
    if (!before) throw new NotFoundException('Review comment not found');
    if (before.author_id !== actorId) throw new ForbiddenException('Only the author can edit this review comment');
    const updated = await this.db.single<any>(this.db.from('hazop_review_comments').update({ comment_text: dto.comment ?? dto.commentText ?? before.comment_text, severity: dto.severity ?? before.severity, related_section: dto.relatedSection ?? before.related_section, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', commentId).select().single());
    await this.history(tenantId, study.id, actorId, 'REVIEW_COMMENT_UPDATED', 'Review comment updated', updated.comment_text, { commentId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_REVIEW_COMMENT_UPDATED', entityType: 'hazop_review_comments', entityId: commentId, before: before as JsonValue, after: updated as JsonValue });
    return updated;
  }

  async resolveReviewComment(tenantId: string, actorId: string, studyId: string, commentId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const before = await this.db.single<any>(this.db.from('hazop_review_comments').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', commentId).maybeSingle());
    if (!before) throw new NotFoundException('Review comment not found');
    const updated = await this.db.single<any>(this.db.from('hazop_review_comments').update({ status: 'Resolved', resolution_comment: dto.resolution ?? dto.comment ?? null, resolved_by: actorId, resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', commentId).select().single());
    await this.history(tenantId, study.id, actorId, 'REVIEW_COMMENT_RESOLVED', 'Review comment resolved', updated.resolution_comment, { commentId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_REVIEW_COMMENT_RESOLVED', entityType: 'hazop_review_comments', entityId: commentId, before: before as JsonValue, after: updated as JsonValue });
    return updated;
  }

  async createReviewCommentAction(tenantId: string, actorId: string, studyId: string, commentId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const comment = await this.db.single<any>(this.db.from('hazop_review_comments').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).eq('id', commentId).maybeSingle());
    if (!comment) throw new NotFoundException('Review comment not found');
    const action = await this.actions.create(tenantId, actorId, {
      title: dto.title ?? `Resolve HAZOP review comment: ${study.study_number}`,
      description: dto.description ?? comment.comment_text,
      sourceModule: 'HAZOP',
      sourceType: 'review-comment',
      sourceRecordId: comment.id,
      ownerId: dto.ownerId ?? dto.assignedToId ?? null,
      dueDate: dto.dueDate ?? this.plusDays(14),
      priority: this.actionPriority(dto.priority ?? (comment.severity === 'Critical' ? 'High' : 'Medium')),
      siteId: study.site_id ?? undefined,
      evidenceRequired: dto.evidenceRequired ?? true,
      verificationRequired: dto.verificationRequired ?? true
    } as any);
    await this.db.single<any>(this.db.from('hazop_review_comments').update({ linked_action_id: action.id, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', commentId).select().single());
    await this.history(tenantId, study.id, actorId, 'REVIEW_COMMENT_ACTION_CREATED', 'Review comment action created', action.title, { commentId, actionId: action.id });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_REVIEW_COMMENT_ACTION_CREATED', entityType: 'hazop_review_comments', entityId: commentId, before: comment as JsonValue, after: { actionId: action.id, title: action.title } as JsonValue });
    return action;
  }

  async exportReviewPackage(tenantId: string, actorId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [readiness, signoffs, blockers, comments, workflow] = await Promise.all([
      this.reviewReadiness(tenantId, study.id, scope, true),
      this.signoffs(tenantId, study.id, scope),
      this.reviewBlockers(tenantId, study.id, scope),
      this.reviewComments(tenantId, study.id, scope),
      this.reviewWorkflow(tenantId, study.id, scope)
    ]);
    const rows: unknown[][] = [
      ['Section', 'Field', 'Value'],
      ['Study', 'Study Number', study.study_number],
      ['Study', 'Title', study.title],
      ['Study', 'Status', study.status],
      ['Readiness', 'Status', readiness.status],
      ['Readiness', 'Progress', `${readiness.progress}%`],
      ...readiness.checks.map((check: any) => ['Readiness Check', check.label, `${check.status} / ${check.value ?? ''}/${check.required_value ?? ''}`]),
      ...blockers.map((blocker: any) => ['Closure Blocker', blocker.blocker_title, `${blocker.severity} / ${blocker.status} / ${blocker.blocker_description ?? ''}`]),
      ...signoffs.map((signoff: any) => ['Sign-off', signoff.role ?? signoff.signoff_role, `${signoff.status} / ${signoff.assignedUser?.displayName ?? signoff.assigned_user_id ?? ''} / ${signoff.signed_at ?? ''}`]),
      ...comments.map((comment: any) => ['Review Comment', comment.comment_type, `${comment.status} / ${comment.severity} / ${comment.comment_text}`]),
      ['Workflow', 'Status', workflow.status],
      ['Workflow', 'Current Step', workflow.current_step]
    ];
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_REVIEW_PACKAGE_EXPORTED', entityType: 'hazop_studies', entityId: study.id, after: { readiness: readiness.status, signoffs: signoffs.length } as JsonValue });
    return { fileName: `${study.study_number}-review-package.csv`, contentType: 'text/csv', content: this.csv(rows) };
  }

  async attachmentSummary(tenantId: string, studyId: string, scope: Scope) {
    const rows = await this.attachmentRows(tenantId, studyId, {}, scope);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const is = (row: any, predicate: (row: any) => boolean) => rows.filter(predicate).length;
    return {
      totalAttachments: rows.length,
      images: is(rows, (row) => String(row.mime_type ?? row.file_type ?? '').startsWith('image/')),
      pdfs: is(rows, (row) => String(row.mime_type ?? row.file_type ?? '').includes('pdf')),
      spreadsheets: is(rows, (row) => ['xlsx', 'csv', 'spreadsheet'].some((word) => String(row.file_name ?? row.mime_type ?? '').toLowerCase().includes(word))),
      engineeringFiles: is(rows, (row) => ['dwg', 'dxf', 'calculation', 'engineering'].some((word) => [row.file_name, row.category].filter(Boolean).join(' ').toLowerCase().includes(word))),
      evidenceFiles: is(rows, (row) => String(row.category ?? '').toLowerCase().includes('evidence')),
      meetingMinutes: is(rows, (row) => String(row.category ?? '').toLowerCase().includes('meeting minutes')),
      vendorDocuments: is(rows, (row) => String(row.category ?? '').toLowerCase().includes('vendor')),
      filesNeedingReview: is(rows, (row) => row.review_required && !['Approved', 'Accepted', 'Not Required'].includes(row.review_status)),
      filesUploadedThisWeek: is(rows, (row) => new Date(row.uploaded_at ?? row.created_at ?? 0).getTime() >= weekAgo),
      largeFiles: is(rows, (row) => Number(row.file_size ?? 0) > 20 * 1024 * 1024),
      restrictedFiles: is(rows, (row) => ['Restricted', 'Confidential'].includes(row.visibility))
    };
  }

  async attachmentsRegister(tenantId: string, studyId: string, query: Record<string, any>, scope: Scope) {
    return this.attachmentRows(tenantId, studyId, query, scope);
  }

  async attachmentDetail(tenantId: string, actorId: string, studyId: string, attachmentId: string, scope: Scope, mode: 'preview' | 'metadata' = 'metadata') {
    const study = await this.study(tenantId, studyId, scope);
    const attachment = await this.attachmentRaw(tenantId, study.id, attachmentId);
    if (mode === 'preview') await this.logAttachmentAccess(tenantId, study, attachment, actorId, 'preview');
    const [versions, accessLogs, history] = await Promise.all([
      this.attachmentVersions(tenantId, study.id, attachmentId, scope),
      this.attachmentAccessLogs(tenantId, study.id, attachmentId, scope),
      this.safeMany<any>(this.db.from('hazop_history_events').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).eq('attachment_id', attachmentId).order('created_at', { ascending: false }))
    ]);
    return { ...attachment, versions, accessLogs, history, previewUrl: attachment.storage_url ?? null };
  }

  async addAttachment(tenantId: string, actorId: string, studyId: string, dto: Record<string, any>, scope: Scope, file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const upload = await this.storeHazopAttachment(study, dto, file);
    const attachment = await this.db.single<any>(this.db.from('hazop_attachments').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      file_name: file?.originalname ?? dto.fileName ?? dto.title ?? 'Attachment',
      original_file_name: file?.originalname ?? dto.originalFileName ?? dto.fileName ?? dto.title ?? 'Attachment',
      file_type: upload.extension,
      mime_type: file?.mimetype ?? dto.mimeType ?? dto.fileType ?? 'application/octet-stream',
      file_size: file?.size ?? dto.fileSize ?? null,
      storage_provider: upload.provider,
      storage_key: upload.key,
      storage_url: upload.url,
      storage_path: upload.key,
      category: dto.category ?? 'General',
      description: dto.description ?? null,
      linked_section: dto.linkedSection ?? 'General',
      linked_node_id: dto.linkedNodeId ?? null,
      linked_scenario_id: dto.linkedScenarioId ?? null,
      linked_recommendation_id: dto.linkedRecommendationId ?? null,
      linked_safeguard_id: dto.linkedSafeguardId ?? null,
      linked_session_id: dto.linkedSessionId ?? null,
      linked_record_id: dto.linkedRecordId ?? null,
      visibility: dto.visibility ?? 'Study Team',
      review_required: Boolean(dto.reviewRequired ?? false),
      review_status: dto.reviewRequired ? 'Pending Review' : 'Not Required',
      version: 1,
      tags: this.parseTags(dto.tags),
      checksum: upload.checksum,
      scan_status: upload.scanStatus,
      uploaded_by: actorId
    }).select().single());
    await this.db.single<any>(this.db.from('hazop_attachment_versions').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, attachment_id: attachment.id, version: 1, file_name: attachment.file_name, storage_key: attachment.storage_key, file_size: attachment.file_size, checksum: attachment.checksum, uploaded_by: actorId, change_reason: 'Initial upload' }).select().single());
    await this.logAttachmentAccess(tenantId, study, attachment, actorId, 'upload');
    await this.history(tenantId, study.id, actorId, 'ATTACHMENT_UPLOADED', 'Attachment uploaded', attachment.file_name, { attachmentId: attachment.id, category: attachment.category });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_ATTACHMENT_UPLOADED', entityType: 'hazop_attachments', entityId: attachment.id, after: attachment as JsonValue });
    await this.indexHazopAttachment(tenantId, study, attachment);
    return attachment;
  }

  async updateAttachment(tenantId: string, actorId: string, studyId: string, attachmentId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.attachmentRaw(tenantId, study.id, attachmentId);
    const patch = {
      category: dto.category ?? before.category,
      description: dto.description ?? before.description,
      linked_section: dto.linkedSection ?? before.linked_section,
      linked_node_id: dto.linkedNodeId ?? before.linked_node_id,
      linked_scenario_id: dto.linkedScenarioId ?? before.linked_scenario_id,
      linked_recommendation_id: dto.linkedRecommendationId ?? before.linked_recommendation_id,
      linked_safeguard_id: dto.linkedSafeguardId ?? before.linked_safeguard_id,
      linked_session_id: dto.linkedSessionId ?? before.linked_session_id,
      linked_record_id: dto.linkedRecordId ?? before.linked_record_id,
      visibility: dto.visibility ?? before.visibility,
      review_required: dto.reviewRequired ?? before.review_required,
      review_status: dto.reviewStatus ?? before.review_status,
      tags: dto.tags !== undefined ? this.parseTags(dto.tags) : before.tags,
      updated_at: new Date().toISOString()
    };
    const updated = await this.db.single<any>(this.db.from('hazop_attachments').update(patch).eq('tenant_id', tenantId).eq('id', attachmentId).select().single());
    await this.history(tenantId, study.id, actorId, 'ATTACHMENT_UPDATED', 'Attachment metadata updated', updated.file_name, { attachmentId, before, after: updated });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_ATTACHMENT_UPDATED', entityType: 'hazop_attachments', entityId: attachmentId, before: before as JsonValue, after: updated as JsonValue });
    await this.indexHazopAttachment(tenantId, study, updated);
    return updated;
  }

  async downloadAttachment(tenantId: string, actorId: string, studyId: string, attachmentId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const attachment = await this.attachmentRaw(tenantId, study.id, attachmentId);
    await this.logAttachmentAccess(tenantId, study, attachment, actorId, 'download');
    await this.history(tenantId, study.id, actorId, 'ATTACHMENT_DOWNLOADED', 'Attachment downloaded', attachment.file_name, { attachmentId });
    return { fileName: attachment.file_name, mimeType: attachment.mime_type ?? attachment.file_type ?? 'application/octet-stream', storageKey: attachment.storage_key, url: attachment.storage_url, content: await this.readStoredAttachment(attachment) };
  }

  async replaceAttachment(tenantId: string, actorId: string, studyId: string, attachmentId: string, dto: Record<string, any>, scope: Scope, file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.attachmentRaw(tenantId, study.id, attachmentId);
    const upload = await this.storeHazopAttachment(study, dto, file, Number(before.version ?? 1) + 1);
    const updated = await this.db.single<any>(this.db.from('hazop_attachments').update({
      file_name: file?.originalname ?? dto.fileName ?? before.file_name,
      original_file_name: file?.originalname ?? before.original_file_name,
      file_type: upload.extension,
      mime_type: file?.mimetype ?? dto.mimeType ?? before.mime_type,
      file_size: file?.size ?? dto.fileSize ?? before.file_size,
      storage_key: upload.key,
      storage_path: upload.key,
      storage_url: upload.url,
      checksum: upload.checksum,
      scan_status: upload.scanStatus,
      version: Number(before.version ?? 1) + 1,
      review_status: before.review_required ? 'Pending Review' : before.review_status,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('id', attachmentId).select().single());
    await this.db.single<any>(this.db.from('hazop_attachment_versions').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, attachment_id: attachmentId, version: updated.version, file_name: updated.file_name, storage_key: updated.storage_key, file_size: updated.file_size, checksum: updated.checksum, uploaded_by: actorId, change_reason: dto.changeReason ?? dto.reason ?? 'File replaced' }).select().single());
    await this.logAttachmentAccess(tenantId, study, updated, actorId, 'replace');
    await this.history(tenantId, study.id, actorId, 'ATTACHMENT_REPLACED', 'Attachment replaced', updated.file_name, { attachmentId, before, after: updated });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_ATTACHMENT_REPLACED', entityType: 'hazop_attachments', entityId: attachmentId, before: before as JsonValue, after: updated as JsonValue });
    await this.indexHazopAttachment(tenantId, study, updated);
    return updated;
  }

  async archiveAttachment(tenantId: string, actorId: string, studyId: string, attachmentId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.attachmentRaw(tenantId, study.id, attachmentId);
    const updated = await this.db.single<any>(this.db.from('hazop_attachments').update({ archived_by: actorId, archived_at: new Date().toISOString(), review_status: 'Archived', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', attachmentId).select().single());
    await this.logAttachmentAccess(tenantId, study, updated, actorId, 'archive');
    await this.history(tenantId, study.id, actorId, 'ATTACHMENT_ARCHIVED', 'Attachment archived', dto.reason ?? updated.file_name, { attachmentId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_ATTACHMENT_ARCHIVED', entityType: 'hazop_attachments', entityId: attachmentId, before: before as JsonValue, after: updated as JsonValue });
    return updated;
  }

  async deleteAttachment(tenantId: string, actorId: string, studyId: string, attachmentId: string, dto: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.attachmentRaw(tenantId, study.id, attachmentId);
    const updated = await this.db.single<any>(this.db.from('hazop_attachments').update({ deleted_by: actorId, deleted_at: new Date().toISOString(), review_status: 'Deleted', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', attachmentId).select().single());
    await this.logAttachmentAccess(tenantId, study, updated, actorId, 'delete');
    await this.history(tenantId, study.id, actorId, 'ATTACHMENT_DELETED', 'Attachment deleted', dto.reason ?? updated.file_name, { attachmentId });
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_ATTACHMENT_DELETED', entityType: 'hazop_attachments', entityId: attachmentId, before: before as JsonValue, after: updated as JsonValue });
    return updated;
  }

  async attachmentVersions(tenantId: string, studyId: string, attachmentId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    await this.attachmentRaw(tenantId, study.id, attachmentId);
    return this.safeMany<any>(this.db.from('hazop_attachment_versions').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).eq('attachment_id', attachmentId).order('version', { ascending: false }));
  }

  async attachmentAccessLogs(tenantId: string, studyId: string, attachmentId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    await this.attachmentRaw(tenantId, study.id, attachmentId);
    return this.safeMany<any>(this.db.from('hazop_attachment_access_logs').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).eq('attachment_id', attachmentId).order('created_at', { ascending: false }));
  }

  async exportAttachments(tenantId: string, actorId: string, studyId: string, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const rows = await this.attachmentRows(tenantId, study.id, {}, scope);
    await this.history(tenantId, study.id, actorId, 'ATTACHMENT_REGISTER_EXPORTED', 'Attachment register exported', `${rows.length} rows`);
    return { fileName: `${study.study_number}-attachments.csv`, contentType: 'text/csv', content: this.csv([['File Name', 'Type', 'Category', 'Linked Section', 'Uploaded By', 'Uploaded At', 'Size', 'Review Status', 'Visibility', 'Version', 'Storage Status', 'Scan Status', 'Tags'], ...rows.map((row) => [row.file_name, row.file_type, row.category, row.linked_section, row.uploadedBy?.displayName ?? row.uploaded_by, row.uploaded_at, row.file_size, row.review_status, row.visibility, row.version, row.storage_key ? 'Stored' : 'Metadata Only', row.scan_status, (row.tags ?? []).join('; ')])]) };
  }

  async historySummary(tenantId: string, studyId: string, scope: Scope) {
    const rows = await this.historyRows(tenantId, studyId, {}, scope, true);
    const today = new Date().toISOString().slice(0, 10);
    const count = (predicate: (row: any) => boolean) => rows.filter(predicate).length;
    return {
      totalEvents: rows.length,
      eventsToday: count((row) => String(row.created_at ?? '').startsWith(today)),
      safetyCriticalEvents: count((row) => Boolean(row.safety_critical)),
      riskChanges: count((row) => row.event_category === 'Risk'),
      recommendationEvents: count((row) => row.event_category === 'Recommendation/Action'),
      signoffEvents: count((row) => row.event_category === 'Review/Sign-Off'),
      attachmentEvents: count((row) => row.event_category === 'Attachment'),
      linkedRecordEvents: count((row) => row.event_category === 'Linked Record'),
      workflowEvents: count((row) => row.event_category === 'Workflow'),
      userActions: count((row) => !row.system_generated),
      systemActions: count((row) => Boolean(row.system_generated))
    };
  }

  async historyRegister(tenantId: string, studyId: string, query: Record<string, any>, scope: Scope, sensitive = false) {
    return this.historyRows(tenantId, studyId, query, scope, sensitive);
  }

  async historyEventDetail(tenantId: string, studyId: string, eventId: string, scope: Scope, sensitive = false) {
    const rows = await this.historyRows(tenantId, studyId, {}, scope, sensitive);
    const event = rows.find((row) => row.id === eventId);
    if (!event) throw new NotFoundException('HAZOP history event not found');
    return event;
  }

  async safetyCriticalHistory(tenantId: string, studyId: string, scope: Scope, sensitive = false) {
    const rows = await this.historyRows(tenantId, studyId, { safetyCritical: 'true' }, scope, sensitive);
    return rows.slice(0, 50);
  }

  async exportHistory(tenantId: string, actorId: string, studyId: string, query: Record<string, any>, scope: Scope, sensitive = false) {
    const study = await this.study(tenantId, studyId, scope);
    const rows = await this.historyRows(tenantId, study.id, query, scope, sensitive);
    await this.history(tenantId, study.id, actorId, 'HISTORY_EXPORTED', 'HAZOP history exported', `${rows.length} rows`);
    return { fileName: `${study.study_number}-history.csv`, contentType: 'text/csv', content: this.csv([['Timestamp', 'Event Type', 'Category', 'Actor', 'Section', 'Related Record', 'Description', 'Severity', 'Safety Critical', 'Before', 'After'], ...rows.map((row) => [row.created_at, row.event_type, row.event_category, row.actor?.displayName ?? row.actor_name_snapshot ?? row.actor_user_id, row.related_section, row.related_record_number ?? row.related_record_id, row.event_description ?? row.description, row.severity, row.safety_critical ? 'Yes' : 'No', JSON.stringify(row.before_values_json ?? {}), JSON.stringify(row.after_values_json ?? {})])]) };
  }

  configGuidewords(tenantId: string) {
    return this.db.many(this.db.from('hazop_guidewords').select('*').or(`tenant_id.is.null,tenant_id.eq.${tenantId}`).eq('active', true).order('sort_order'));
  }

  configParameters(tenantId: string) {
    return this.db.many(this.db.from('hazop_parameters').select('*').or(`tenant_id.is.null,tenant_id.eq.${tenantId}`).eq('active', true).order('sort_order'));
  }

  configRiskMatrices(tenantId: string) {
    return this.db.many(this.db.from('hazop_risk_matrices').select('*, levels:hazop_risk_matrix_levels(*)').or(`tenant_id.is.null,tenant_id.eq.${tenantId}`).eq('active', true));
  }

  configTemplates(tenantId: string) {
    return this.db.many(this.db.from('hazop_node_templates').select('*').or(`tenant_id.is.null,tenant_id.eq.${tenantId}`).eq('active', true).order('name'));
  }

  private async recommendationRows(tenantId: string, studyId: string, query: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [recommendations, nodes, scenarios, safeguards, evidence, actions, users] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_recommendations').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('updated_at', { ascending: false })),
      this.safeMany<any>(this.db.from('hazop_nodes').select('id,node_number,title').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_scenarios').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_scenario_safeguards').select('id,safeguard_number,safeguard_name,scenario_id,ipl_validation_status').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_recommendation_evidence').select('*').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('Action').select('id,actionNumber,title,status,assignedToId,dueDate,priority,evidenceRequired,verificationRequired').eq('tenantId', tenantId)),
      this.safeMany<any>(this.db.from('User').select('id,displayName,email,title').eq('tenantId', tenantId))
    ]);
    const today = new Date().toISOString().slice(0, 10);
    let rows = recommendations.map((rec) => {
      const scenario = scenarios.find((s) => s.id === rec.scenario_id);
      const node = nodes.find((n) => n.id === (rec.node_id ?? scenario?.node_id));
      const safeguard = safeguards.find((s) => s.id === rec.safeguard_id);
      const action = actions.find((a) => a.id === (rec.linked_action_id ?? rec.action_id));
      const recEvidence = evidence.filter((e) => e.recommendation_id === rec.id);
      const owner = users.find((u) => u.id === rec.owner_id);
      const row = {
        ...rec,
        recommendation_text: rec.recommendation_text ?? rec.description,
        linked_action_id: rec.linked_action_id ?? rec.action_id ?? null,
        node,
        scenario,
        safeguard,
        action,
        owner,
        evidence: recEvidence,
        evidenceCount: recEvidence.length,
        overdue: this.isRecommendationOverdue(rec, today),
        closureBlockerActive: this.isRecommendationClosureBlocker({ ...rec, action }, today)
      };
      return row;
    });
    if (query.recommendationId) rows = rows.filter((r) => r.id === query.recommendationId);
    if (query.search) {
      const search = String(query.search).toLowerCase();
      rows = rows.filter((r) => [r.recommendation_number, r.recommendation_text, r.description, r.owner?.displayName, r.scenario?.deviation_text, r.scenario?.cause, r.scenario?.consequence, r.action?.actionNumber].filter(Boolean).join(' ').toLowerCase().includes(search));
    }
    const equals = (key: string, value: any) => value !== undefined && value !== '' && value !== 'All' && value !== 'all' ? String(value) : '';
    const sourceType = equals('sourceType', query.sourceType ?? query.source_type);
    if (sourceType) rows = rows.filter((r) => r.source_type === sourceType);
    const nodeId = equals('nodeId', query.nodeId ?? query.node_id);
    if (nodeId) rows = rows.filter((r) => r.node_id === nodeId || r.node?.id === nodeId);
    const scenarioId = equals('scenarioId', query.scenarioId ?? query.scenario_id);
    if (scenarioId) rows = rows.filter((r) => r.scenario_id === scenarioId);
    const riskLevel = equals('riskLevel', query.riskLevel ?? query.risk_level);
    if (riskLevel) rows = rows.filter((r) => r.scenario?.risk_level === riskLevel);
    const priority = equals('priority', query.priority);
    if (priority) rows = rows.filter((r) => r.priority === priority);
    const ownerId = equals('ownerId', query.ownerId ?? query.owner_id);
    if (ownerId) rows = rows.filter((r) => r.owner_id === ownerId);
    const status = equals('status', query.status);
    if (status) rows = rows.filter((r) => r.status === status);
    const overdue = equals('overdue', query.overdue);
    if (overdue) rows = rows.filter((r) => r.overdue === (overdue === 'true' || overdue === 'Yes'));
    const verificationRequired = equals('verificationRequired', query.verificationRequired ?? query.verification_required);
    if (verificationRequired) rows = rows.filter((r) => r.verification_required === (verificationRequired === 'true' || verificationRequired === 'Yes'));
    const actionLinked = equals('actionLinked', query.actionLinked ?? query.action_linked);
    if (actionLinked) rows = rows.filter((r) => Boolean(r.linked_action_id) === (actionLinked === 'true' || actionLinked === 'Yes'));
    const closureBlocker = equals('closureBlocker', query.closureBlocker ?? query.closure_blocker);
    if (closureBlocker) rows = rows.filter((r) => r.closureBlockerActive === (closureBlocker === 'true' || closureBlocker === 'Yes'));
    const lopaRelated = equals('lopaRelated', query.lopaRelated ?? query.lopa_related);
    if (lopaRelated) rows = rows.filter((r) => r.lopa_related === (lopaRelated === 'true' || lopaRelated === 'Yes'));
    return rows;
  }

  private async recommendation(tenantId: string, studyId: string, recommendationId: string) {
    const rec = await this.db.single<any>(this.db.from('hazop_recommendations').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', recommendationId).maybeSingle());
    if (!rec) throw new NotFoundException('Recommendation not found');
    return rec;
  }

  private validateRecommendationDto(dto: CreateHazopRecommendationDto) {
    const text = dto.recommendationText ?? dto.description ?? dto.title;
    if (!text || text.trim().length < 3) throw new BadRequestException('Recommendation text is required');
    const activeStatus = ['Open', 'Assigned', 'In Progress', 'Pending Evidence', 'Pending Verification'].includes(dto.status ?? 'Open');
    if (activeStatus && !dto.ownerId && dto.status === 'Assigned') throw new BadRequestException('Owner is required for assigned recommendations');
    if (activeStatus && !dto.dueDate && dto.status === 'Assigned') throw new BadRequestException('Due date is required for assigned recommendations');
    if (['High', 'Critical', 'Safety Critical'].includes(dto.priority) && dto.verificationRequired === false) throw new BadRequestException('High/Critical recommendations require verification');
  }

  private isRecommendationOverdue(rec: any, today: string) {
    return Boolean(rec.due_date && rec.due_date < today && !['Verified Closed', 'Cancelled', 'Accepted Risk / No Action'].includes(rec.status));
  }

  private isRecommendationClosureBlocker(rec: any, today: string) {
    if (!rec.closure_blocker) return false;
    if (['Verified Closed', 'Cancelled', 'Accepted Risk / No Action'].includes(rec.status)) return false;
    if (this.isRecommendationOverdue(rec, today)) return true;
    if (rec.evidence_required && !['Submitted', 'Accepted', 'Not Required'].includes(rec.evidence_status)) return true;
    if (rec.verification_required && rec.verification_status !== 'Accepted') return true;
    if (rec.action && !['CLOSED', 'CANCELLED'].includes(rec.action.status)) return true;
    return true;
  }

  private recommendationStatusFromAction(actionStatus: string, rec: any) {
    if (actionStatus === 'CLOSED') return rec.verification_required ? 'Pending Verification' : 'Verified Closed';
    if (actionStatus === 'PENDING_VERIFICATION') return 'Pending Verification';
    if (actionStatus === 'IN_PROGRESS') return 'In Progress';
    if (actionStatus === 'CANCELLED') return 'Cancelled';
    return rec.owner_id ? 'Assigned' : 'Open';
  }

  private actionPriority(priority: string) {
    if (priority === 'Safety Critical' || priority === 'Critical') return 'SAFETY_CRITICAL';
    if (priority === 'High') return 'HIGH';
    if (priority === 'Low') return 'LOW';
    return 'MEDIUM';
  }

  private async afterRecommendationMutation(tenantId: string, actorId: string, study: any, recommendation: any, auditAction: string, historyType: string, title: string, before?: any) {
    await this.history(tenantId, study.id, actorId, historyType, title, recommendation.recommendation_text ?? recommendation.description ?? recommendation.title, { recommendationId: recommendation.id, scenarioId: recommendation.scenario_id, actionId: recommendation.linked_action_id ?? recommendation.action_id });
    await this.audit.write({ tenantId, actorId, action: auditAction, entityType: 'hazop_recommendations', entityId: recommendation.id, before: before as JsonValue, after: recommendation as JsonValue });
    await this.refreshStudyProgress(tenantId, study.id);
    await this.indexHazopRecommendation(tenantId, study, recommendation);
  }

  private async indexHazopRecommendation(tenantId: string, study: any, recommendation: any) {
    await this.searchIndex.indexRecord(tenantId, {
      module: 'hazop',
      recordType: 'HAZOP Recommendation',
      recordId: recommendation.id,
      recordNumber: recommendation.recommendation_number,
      title: recommendation.title,
      subtitle: [study.study_number, recommendation.source_type, recommendation.priority].filter(Boolean).join(' / '),
      description: recommendation.recommendation_text ?? recommendation.description,
      status: recommendation.status,
      priority: recommendation.priority,
      siteId: study.site_id,
      url: `/hazop/${study.id}`,
      searchableText: [recommendation.recommendation_number, recommendation.recommendation_text, recommendation.description, recommendation.rationale, recommendation.owner_id, recommendation.linked_action_id].filter(Boolean).join(' '),
      metadata: { studyId: study.id, scenarioId: recommendation.scenario_id, nodeId: recommendation.node_id, actionId: recommendation.linked_action_id ?? recommendation.action_id }
    });
  }

  private hazopDisciplines() {
    return ['Process Engineering', 'Operations', 'Maintenance', 'HSE', 'Instrument / Controls', 'Mechanical', 'Electrical', 'Chemistry / Process Specialist', 'Project / Construction', 'Contractor / Vendor', 'Management', 'Other'];
  }

  private hazopStudyRoles() {
    return ['HAZOP Leader / Facilitator', 'Scribe', 'Process Engineer', 'Operations Representative', 'Maintenance Representative', 'Instrument / Control Engineer', 'HSE Representative', 'Mechanical Engineer', 'Electrical Engineer', 'Chemistry / Process Specialist', 'Project Engineer', 'Area Owner', 'Plant Manager / Approver', 'Contractor / Vendor', 'Observer', 'External Auditor', 'Other'];
  }

  private validateTeamMember(dto: Record<string, any>) {
    if (!dto.userId && !dto.externalName && !dto.name) throw new BadRequestException('User or external participant is required');
    if (!dto.studyRole && !dto.role) throw new BadRequestException('Study role is required');
    if (!dto.discipline) throw new BadRequestException('Discipline is required');
    if ((dto.signoffRequired ?? dto.signoff_required) && !['Approve/sign-off', 'Edit worksheet'].includes(dto.permissionLevel ?? dto.permission_level ?? '')) throw new BadRequestException('Sign-off required members need approve/sign-off permission');
  }

  private normalizeTeamMemberDto(dto: Record<string, any>) {
    const normalized = { ...dto };
    for (const key of ['userId', 'externalName', 'externalEmail', 'name', 'email', 'companyName', 'contractorCompanyId', 'departmentId', 'notes']) {
      if (normalized[key] === '') normalized[key] = undefined;
    }
    normalized.studyRole = normalized.studyRole ?? normalized.study_role ?? normalized.role;
    normalized.permissionLevel = normalized.permissionLevel ?? normalized.permission_level ?? 'Comment';
    normalized.requiredAttendance = normalized.requiredAttendance ?? normalized.required_attendance ?? normalized.required;
    normalized.signoffRequired = normalized.signoffRequired ?? normalized.signoff_required;
    normalized.attendanceRequirement = normalized.attendanceRequirement ?? normalized.attendance_requirement ?? 'All sessions';
    if (normalized.signoffRequired && !['Approve/sign-off', 'Edit worksheet'].includes(normalized.permissionLevel)) normalized.permissionLevel = 'Approve/sign-off';
    return normalized;
  }

  private teamMemberPatchForExistingSchema(before: Record<string, any>, patch: Record<string, any>) {
    const coreColumns = new Set(['user_id', 'name', 'role', 'discipline', 'required', 'attendance_status']);
    return Object.fromEntries(
      Object.entries(patch).filter(([key, value]) => value !== undefined && (coreColumns.has(key) || Object.prototype.hasOwnProperty.call(before, key)))
    );
  }

  private async safeUser(tenantId: string, userId: string) {
    return this.db.single<any>(this.db.from('User').select('id,displayName,email,title').eq('tenantId', tenantId).eq('id', userId).maybeSingle());
  }

  private async teamMember(tenantId: string, studyId: string, memberId: string) {
    const member = await this.db.single<any>(this.db.from('hazop_study_team_members').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', memberId).maybeSingle());
    if (!member) throw new NotFoundException('HAZOP team member not found');
    return member;
  }

  private async session(tenantId: string, studyId: string, sessionId: string) {
    const session = await this.db.single<any>(this.db.from('hazop_study_sessions').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', sessionId).maybeSingle());
    if (!session) throw new NotFoundException('HAZOP session not found');
    return session;
  }

  private async nextSessionNumber(tenantId: string, studyId: string) {
    const rows = await this.safeMany<any>(this.db.from('hazop_study_sessions').select('session_number').eq('tenant_id', tenantId).eq('study_id', studyId).order('session_number', { ascending: false }).limit(1));
    return Number(rows[0]?.session_number ?? 0) + 1;
  }

  private async ensureCoverageRequirements(tenantId: string, study: any) {
    const base = ['Process Engineering', 'Operations', 'Maintenance', 'HSE', 'Instrument / Controls', 'Mechanical', 'Electrical', 'Chemistry / Process Specialist'];
    if (study.linked_moc_id) base.push('Project / Construction');
    const hasVendorScope = [study.scope_description, study.description, study.boundaries, study.assumptions].filter(Boolean).join(' ').toLowerCase().includes('vendor');
    if (hasVendorScope) base.push('Contractor/Vendor');
    const existing = await this.safeMany<any>(this.db.from('hazop_team_coverage_requirements').select('discipline').eq('tenant_id', tenantId).eq('study_id', study.id));
    const existingSet = new Set(existing.map((row) => row.discipline));
    for (const discipline of [...new Set(base)]) {
      if (existingSet.has(discipline)) continue;
      await this.db.single(this.db.from('hazop_team_coverage_requirements').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, discipline, required: true, requirement_source: 'Site policy', coverage_status: 'Missing', missing_reason: `${discipline} participant is required by site policy` }).select().single());
    }
    await this.syncTeamCoverage(tenantId, study.id);
  }

  private async syncTeamCoverage(tenantId: string, studyId: string) {
    const [requirements, members] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_team_coverage_requirements').select('*').eq('tenant_id', tenantId).eq('study_id', studyId)),
      this.safeMany<any>(this.db.from('hazop_study_team_members').select('*').eq('tenant_id', tenantId).eq('study_id', studyId))
    ]);
    for (const req of requirements) {
      const assigned = members.find((m) => m.discipline === req.discipline && !['Removed', 'Inactive', 'Declined'].includes(m.status));
      const coverageStatus = req.required ? (assigned ? 'Covered' : 'Missing') : (assigned ? 'Covered' : 'Optional');
      await this.db.single(this.db.from('hazop_team_coverage_requirements').update({ assigned_member_id: assigned?.id ?? null, coverage_status: coverageStatus, missing_reason: coverageStatus === 'Missing' ? (req.missing_reason ?? `${req.discipline} participant is required by site policy`) : null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', req.id).select().single());
    }
  }

  private async seedSessionAttendance(tenantId: string, actorId: string, study: any, session: any) {
    const members = await this.safeMany<any>(this.db.from('hazop_study_team_members').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).neq('status', 'Removed'));
    for (const member of members) {
      await this.db.single(this.db.from('hazop_session_attendance').upsert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, session_id: session.id, team_member_id: member.id, user_id: member.user_id ?? null, required: member.required_attendance ?? member.required ?? false, attendance_status: member.required_attendance || member.required ? 'Absent' : 'Not Required', marked_by: actorId, marked_at: new Date().toISOString() }, { onConflict: 'tenant_id,session_id,team_member_id' }).select().single());
    }
    await this.refreshSessionStatuses(tenantId, study.id, session.id);
  }

  private async refreshSessionStatuses(tenantId: string, studyId: string, sessionId: string) {
    const [attendance, minutes, links, actions] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_session_attendance').select('*').eq('tenant_id', tenantId).eq('session_id', sessionId)),
      this.safeMany<any>(this.db.from('hazop_session_minutes').select('*').eq('tenant_id', tenantId).eq('session_id', sessionId)),
      this.safeMany<any>(this.db.from('hazop_session_action_links').select('*').eq('tenant_id', tenantId).eq('session_id', sessionId)),
      this.safeMany<any>(this.db.from('Action').select('id,status').eq('tenantId', tenantId))
    ]);
    const required = attendance.filter((a) => a.required);
    const attendanceStatus = required.length && required.every((a) => ['Present', 'Partial', 'Excused', 'Substitute Attended', 'Not Required'].includes(a.attendance_status)) ? 'Complete' : required.length ? 'Incomplete' : 'Not Required';
    const minutesStatus = minutes.some((m) => ['Complete', 'Approved'].includes(m.status)) || minutes.some((m) => m.summary || m.discussion_notes) ? 'Complete' : 'Missing';
    const openActions = links.map((l) => actions.find((a) => a.id === l.linked_action_id)).filter((a) => a && !['CLOSED', 'VERIFIED', 'COMPLETED'].includes(a.status));
    const actionsStatus = links.length ? (openActions.length ? 'Open Actions' : 'Closed') : 'No Actions';
    await this.db.single(this.db.from('hazop_study_sessions').update({ attendance_status: attendanceStatus, minutes_status: minutesStatus, actions_status: actionsStatus, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', sessionId).select().single());
  }

  private async updateSessionStatus(tenantId: string, actorId: string, studyId: string, sessionId: string, status: string, scope: Scope, extra: Record<string, any>, historyType: string) {
    const study = await this.study(tenantId, studyId, scope);
    this.assertEditable(study);
    const before = await this.session(tenantId, study.id, sessionId);
    const updated = await this.db.single<any>(this.db.from('hazop_study_sessions').update({ status, ...extra, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', sessionId).select().single());
    await this.afterTeamSessionMutation(tenantId, actorId, study, updated, `HAZOP_${historyType}`, historyType, `Session ${status.toLowerCase()}: ${updated.title}`, before, 'hazop_study_sessions');
    return updated;
  }

  private durationMinutes(joinTime?: string | null, leaveTime?: string | null) {
    if (!joinTime || !leaveTime) return null;
    const duration = Math.round((new Date(leaveTime).getTime() - new Date(joinTime).getTime()) / 60000);
    return Number.isFinite(duration) && duration >= 0 ? duration : null;
  }

  private async afterTeamSessionMutation(tenantId: string, actorId: string, study: any, entity: any, auditAction: string, historyType: string, title: string, before: any, entityType: string) {
    await this.history(tenantId, study.id, actorId, historyType, title, undefined, { entityId: entity?.id, entityType });
    await this.audit.write({ tenantId, actorId, action: auditAction, entityType, entityId: entity?.id ?? study.id, before: before as JsonValue, after: entity as JsonValue });
    await this.refreshStudyProgress(tenantId, study.id);
    await this.indexHazopTeamSession(tenantId, study, entity, entityType);
  }

  private async indexHazopTeamSession(tenantId: string, study: any, entity: any, entityType: string) {
    const isSession = entityType === 'hazop_study_sessions';
    const isMember = entityType === 'hazop_study_team_members';
    if (!isSession && !isMember && entityType !== 'hazop_session_minutes' && entityType !== 'hazop_session_decisions') return;
    await this.searchIndex.indexRecord(tenantId, {
      module: 'hazop',
      recordType: isSession ? 'HAZOP Session' : isMember ? 'HAZOP Team Member' : 'HAZOP Team Session Record',
      recordId: entity.id,
      recordNumber: isSession ? `${study.study_number}-S${entity.session_number}` : study.study_number,
      title: entity.title ?? entity.name ?? entity.decision_title ?? 'HAZOP Team/Sessions',
      subtitle: [study.study_number, entity.discipline, entity.study_role, entity.status].filter(Boolean).join(' / '),
      description: entity.description ?? entity.summary ?? entity.decision_description ?? entity.notes,
      status: entity.status,
      siteId: study.site_id,
      url: `/hazop/${study.id}`,
      searchableText: [entity.title, entity.name, entity.email, entity.discipline, entity.study_role, entity.agenda, entity.summary, entity.discussion_notes, entity.decision_title, entity.decision_description].filter(Boolean).join(' '),
      metadata: { studyId: study.id, entityType }
    });
  }

  private async study(tenantId: string, id: string, scope: Scope) {
    const study = await this.db.single<any>(this.db.from('hazop_studies').select('*').eq('tenant_id', tenantId).or(`id.eq.${id},study_number.eq.${id}`).maybeSingle());
    if (!study) throw new NotFoundException('HAZOP study not found');
    this.assertSiteAccess(study.site_id, scope);
    return study;
  }

  private async node(tenantId: string, studyId: string, nodeId: string) {
    const node = await this.db.single<any>(this.db.from('hazop_nodes').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', nodeId).maybeSingle());
    if (!node) throw new NotFoundException('HAZOP node not found');
    return node;
  }

  private async scenario(tenantId: string, studyId: string, scenarioId: string) {
    const scenario = await this.db.single<any>(this.db.from('hazop_scenarios').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', scenarioId).maybeSingle());
    if (!scenario) throw new NotFoundException('HAZOP scenario not found');
    return scenario;
  }

  private async safeguard(tenantId: string, scenarioId: string, safeguardId: string) {
    const safeguard = await this.db.single<any>(this.db.from('hazop_safeguards').select('*').eq('tenant_id', tenantId).eq('scenario_id', scenarioId).eq('id', safeguardId).maybeSingle());
    if (!safeguard) throw new NotFoundException('HAZOP safeguard not found');
    return safeguard;
  }

  private async enhancedSafeguard(tenantId: string, studyId: string, safeguardId: string) {
    const safeguard = await this.db.single<any>(this.db.from('hazop_scenario_safeguards').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', safeguardId).maybeSingle());
    if (!safeguard) throw new NotFoundException('HAZOP safeguard not found');
    return safeguard;
  }

  private safeguardTypes() {
    return ['BPCS', 'Alarm with operator response', 'PSV / relief valve', 'Rupture disc', 'Mechanical protection', 'Interlock', 'SIS / SIF', 'SIF', 'ESD', 'Fire and gas system', 'Physical containment', 'Check valve', 'Flame arrestor', 'Pressure/vacuum protection', 'Ventilation', 'Drain/containment system', 'Operating procedure', 'Maintenance/inspection program', 'Training/competency', 'Emergency response', 'Administrative control', 'Operator round/check', 'PTW control', 'LOTO / isolation control', 'Other'];
  }

  private iplCriteria() {
    return [
      { criterion_key: 'independent_initiating_cause', criterion_label: 'Independent from initiating cause', required: true },
      { criterion_key: 'independent_other_safeguards', criterion_label: 'Independent from other credited safeguards', required: true },
      { criterion_key: 'effective_specific_scenario', criterion_label: 'Effective for the specific scenario', required: true },
      { criterion_key: 'specific_consequence', criterion_label: 'Specific to the consequence being prevented/mitigated', required: true },
      { criterion_key: 'auditable_testable', criterion_label: 'Auditable / testable', required: true },
      { criterion_key: 'available_on_demand', criterion_label: 'Available when demanded', required: true },
      { criterion_key: 'reliable_enough', criterion_label: 'Reliable enough for claimed risk reduction', required: true },
      { criterion_key: 'proof_test_frequency', criterion_label: 'Has defined proof test / inspection frequency', required: true },
      { criterion_key: 'assigned_owner', criterion_label: 'Has assigned owner', required: true },
      { criterion_key: 'design_basis', criterion_label: 'Has documented design basis', required: true },
      { criterion_key: 'evidence_reference', criterion_label: 'Has evidence/document reference', required: true },
      { criterion_key: 'not_pure_admin', criterion_label: 'Not purely administrative unless site policy allows', required: true },
      { criterion_key: 'no_shared_human_response', criterion_label: 'Not dependent on same human response as another credited safeguard', required: true },
      { criterion_key: 'bypass_controlled', criterion_label: 'Not defeated/bypassed without management control', required: true },
      { criterion_key: 'maintained_under_mi', criterion_label: 'Maintained under MI / proof test program if applicable', required: false }
    ];
  }

  private normalizedIplItems(items: Array<Record<string, any>>) {
    const submitted = new Map(items.map((item) => [item.criterion_key ?? item.criterionKey, item]));
    return this.iplCriteria().map((criterion) => {
      const item = submitted.get(criterion.criterion_key) ?? {};
      return {
        criterion_key: criterion.criterion_key,
        criterion_label: criterion.criterion_label,
        required: item.required ?? criterion.required,
        result: item.result ?? 'Not Applicable',
        comment: item.comment ?? null,
        evidence_attachment_id: item.evidenceAttachmentId ?? item.evidence_attachment_id ?? null
      };
    });
  }

  private evaluateIpl(items: Array<Record<string, any>>, safeguard: any) {
    const normalized = this.normalizedIplItems(items);
    const failedRequired = normalized.filter((item) => item.required && item.result === 'Fail');
    const missingRequired = normalized.filter((item) => item.required && !['Pass', 'Not Applicable'].includes(item.result));
    const passed = normalized.filter((item) => item.result === 'Pass').length;
    const adminType = ['Administrative control', 'Operating procedure', 'Training/competency', 'PTW control', 'LOTO / isolation control', 'Operator round/check'].includes(safeguard.safeguard_type);
    const notEligible = adminType && !normalized.find((item) => item.criterion_key === 'not_pure_admin' && item.result === 'Pass');
    const status = notEligible ? 'Not eligible as IPL' : failedRequired.length ? 'Failed' : missingRequired.length ? 'Needs evidence' : 'Passed';
    const summary = status === 'Passed'
      ? 'All mandatory IPL criteria passed'
      : notEligible
        ? 'Administrative or human-response safeguard is not eligible as IPL under default policy'
        : failedRequired.length
          ? `${failedRequired.length} mandatory IPL criteria failed`
          : `${missingRequired.length} mandatory IPL criteria need evidence`;
    return {
      status,
      summary,
      failed: failedRequired.length + (notEligible ? 1 : 0),
      passed,
      lopaRequired: status === 'Passed' || safeguard.ipl_candidate || this.isSafetyInstrumentedSafeguard(safeguard),
      lopaReason: this.isSafetyInstrumentedSafeguard(safeguard) ? 'Safety instrumented safeguard credited as IPL' : 'IPL candidate identified / validated'
    };
  }

  private async upsertSafeguardTestStatus(tenantId: string, study: any, safeguard: any, actorId: string, dto: Partial<HazopSafeguardTestStatusDto & HazopSafeguardDto & { status?: string }>) {
    const existing = await this.db.single<any>(this.db.from('hazop_safeguard_test_status').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).eq('safeguard_id', safeguard.id).maybeSingle());
    const required = Boolean((dto.proofTestRequired ?? safeguard.proof_test_required) || (dto.inspectionRequired ?? safeguard.inspection_required));
    const status = dto.status ?? this.testStatusFromDueDate(dto.nextTestDueDate, required);
    const payload = {
      proof_test_required: dto.proofTestRequired ?? safeguard.proof_test_required ?? false,
      inspection_required: dto.inspectionRequired ?? safeguard.inspection_required ?? false,
      test_frequency: dto.testFrequency ?? safeguard.proof_test_interval ?? null,
      last_test_date: dto.lastTestDate ?? null,
      next_test_due_date: dto.nextTestDueDate ?? null,
      status,
      evidence_attachment_id: dto.evidenceAttachmentId ?? null,
      linked_mi_record_id: dto.linkedMiRecordId ?? null,
      owner_id: dto.ownerId ?? safeguard.owner_id ?? null,
      updated_at: new Date().toISOString()
    };
    if (existing) return this.db.single(this.db.from('hazop_safeguard_test_status').update(payload).eq('tenant_id', tenantId).eq('id', existing.id).select().single());
    return this.db.single(this.db.from('hazop_safeguard_test_status').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id ?? null, study_id: study.id, safeguard_id: safeguard.id, ...payload }).select().single());
  }

  private testStatusFromDueDate(nextTestDueDate?: string, required?: boolean) {
    if (!required) return 'Not Required';
    if (!nextTestDueDate) return 'Needs Schedule';
    const today = new Date().toISOString().slice(0, 10);
    if (nextTestDueDate < today) return 'Overdue';
    if (nextTestDueDate <= this.plusDays(30)) return 'Due Soon';
    return 'Current';
  }

  private isSafetyInstrumentedSafeguard(safeguard: any) {
    return ['SIS / SIF', 'SIF', 'ESD', 'Interlock', 'Fire and gas system'].includes(safeguard.safeguard_type);
  }

  private async syncScenarioSafeguardCounters(tenantId: string, studyId: string, scenarioId: string) {
    const [safeguards, gaps] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_scenario_safeguards').select('id,credited_for_risk_reduction,ipl_candidate').eq('tenant_id', tenantId).eq('study_id', studyId).eq('scenario_id', scenarioId)),
      this.safeMany<any>(this.db.from('hazop_safeguard_gaps').select('id').eq('tenant_id', tenantId).eq('study_id', studyId).eq('scenario_id', scenarioId).neq('status', 'Closed'))
    ]);
    await this.db.single(this.db.from('hazop_scenarios').update({
      safeguard_count: safeguards.length,
      credited_safeguard_count: safeguards.filter((s) => s.credited_for_risk_reduction).length,
      ipl_candidate_count: safeguards.filter((s) => s.ipl_candidate).length,
      safeguard_gap_count: gaps.length,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', scenarioId).select().single());
    await this.refreshStudyProgress(tenantId, studyId);
  }

  private async indexHazopSafeguard(tenantId: string, study: any, scenario: any, safeguard: any) {
    await this.searchIndex.indexRecord(tenantId, {
      module: 'hazop',
      recordType: 'HAZOP Safeguard',
      recordId: safeguard.id,
      recordNumber: safeguard.safeguard_number,
      title: safeguard.safeguard_name,
      subtitle: [study.study_number, scenario.scenario_number, safeguard.safeguard_type].filter(Boolean).join(' / '),
      description: safeguard.description,
      status: safeguard.ipl_validation_status,
      priority: scenario.risk_level,
      siteId: study.site_id,
      url: `/hazop/${study.id}`,
      searchableText: [safeguard.safeguard_name, safeguard.description, safeguard.safeguard_type, safeguard.equipment_id, safeguard.document_id, scenario.deviation_text, scenario.cause, scenario.consequence].filter(Boolean).join(' '),
      metadata: { studyId: study.id, scenarioId: scenario.id, safeguardId: safeguard.id, iplCandidate: safeguard.ipl_candidate }
    });
  }

  private async scenarioIds(tenantId: string, studyId: string) {
    const scenarios = await this.db.many<any>(this.db.from('hazop_scenarios').select('id').eq('tenant_id', tenantId).eq('study_id', studyId));
    return scenarios.map((s) => s.id);
  }

  private applyScope(query: any, scope: Scope, siteColumn = 'site_id') {
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in(siteColumn, scope.allowedSiteIds);
    if (scope.selectedSiteId && !scope.corporateView) return query.eq(siteColumn, scope.selectedSiteId);
    return query;
  }

  private assertSiteAccess(siteId: string | null | undefined, scope: Scope) {
    if (!scope.corporateView && scope.allowedSiteIds?.length && siteId && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('Site access denied');
  }

  private assertEditable(study: any) {
    if (readonlyStatuses.includes(study.status)) throw new BadRequestException('Approved, closed, or cancelled HAZOP studies are read-only');
  }

  private assertLifecycleTransition(status: string, action: string) {
    const allowed: Record<string, string[]> = {
      'start-preparation': ['Draft', 'Planned'],
      'start-study': ['Draft', 'Planned', 'In Preparation'],
      submit: ['Draft', 'Planned', 'In Preparation', 'In Progress', 'Review'],
      'request-approval': ['In Preparation', 'In Progress', 'Review', 'Recommendations Open'],
      approve: ['Pending Approval'],
      close: ['Approved', 'In Progress', 'Recommendations Open'],
      reopen: ['Approved', 'Closed'],
      cancel: ['Draft', 'Planned', 'In Preparation', 'In Progress', 'Review', 'Pending Approval']
    };
    if (!(allowed[action] ?? []).includes(status)) throw new BadRequestException(`Cannot ${action.replace(/-/g, ' ')} while HAZOP study is ${status}`);
  }

  private async count(table: string, tenantId: string, column: string, value: string) {
    const rows = await this.db.many<any>(this.db.from(table).select('id').eq('tenant_id', tenantId).eq(column, value));
    return rows.length;
  }

  private async nextStudyNumber(tenantId: string, siteId?: string) {
    const year = new Date().getFullYear();
    let siteCode = 'SITE';
    if (siteId) {
      const site = await this.db.single<any>(this.db.from('Site').select('code,name').eq('id', siteId).maybeSingle());
      siteCode = String(site?.code ?? site?.name ?? 'SITE').replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || 'SITE';
    }
    const existing = await this.db.many<any>(this.db.from('hazop_studies').select('study_number').eq('tenant_id', tenantId).like('study_number', `HAZOP-${siteCode}-${year}-%`));
    return `HAZOP-${siteCode}-${year}-${String(existing.length + 1).padStart(6, '0')}`;
  }

  private async riskMatrixForStudy(tenantId: string, study: any) {
    const response = await this.riskMatrix(tenantId, study.id, { allowedSiteIds: [], corporateView: true });
    return response.matrix;
  }

  private calculateRiskWithMatrix(matrix: any, severity: number, likelihood: number) {
    const score = severity * likelihood;
    const levels = Array.isArray(matrix?.levels) ? matrix.levels : [];
    const exact = levels.find((level: any) => Number(level.severity_level) === severity && Number(level.likelihood_level) === likelihood);
    if (exact) {
      return {
        score: Number(exact.risk_score ?? score),
        level: exact.risk_level ?? exact.level ?? 'Low',
        color: exact.risk_color ?? exact.color ?? '#22c55e',
        recommendationRequired: Boolean(exact.recommendation_required ?? exact.requires_recommendation),
        lopaRequired: Boolean(exact.lopa_required ?? exact.requires_lopa),
        lopaReason: Boolean(exact.lopa_required ?? exact.requires_lopa) ? `Risk matrix ${matrix?.name ?? 'policy'} marks ${severity}x${likelihood} as LOPA required` : null
      };
    }
    const range = levels.find((level: any) => Number(level.min_score) <= score && Number(level.max_score) >= score);
    if (range) {
      return {
        score,
        level: range.risk_level ?? range.level ?? 'Low',
        color: range.risk_color ?? range.color ?? '#22c55e',
        recommendationRequired: Boolean(range.recommendation_required ?? range.requires_recommendation ?? ['High', 'Critical'].includes(range.risk_level ?? range.level)),
        lopaRequired: Boolean(range.lopa_required ?? range.requires_lopa ?? (range.risk_level ?? range.level) === 'Critical'),
        lopaReason: Boolean(range.lopa_required ?? range.requires_lopa ?? (range.risk_level ?? range.level) === 'Critical') ? `Risk matrix ${matrix?.name ?? 'policy'} marks ${range.risk_level ?? range.level} as LOPA required` : null
      };
    }
    return this.calculateRisk(severity, likelihood);
  }

  private async recordRiskAssessment(tenantId: string, actorId: string, study: any, scenario: any, risk: any, residualRisk: any, matrixId?: string, comment?: string) {
    const payload = {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      scenario_id: scenario.id,
      matrix_id: matrixId ?? null,
      severity: scenario.severity,
      likelihood: scenario.likelihood,
      risk_score: risk.score,
      risk_level: risk.level,
      risk_color: risk.color,
      residual_severity: scenario.residual_severity ?? null,
      residual_likelihood: scenario.residual_likelihood ?? null,
      residual_risk_score: residualRisk?.score ?? null,
      residual_risk_level: residualRisk?.level ?? null,
      residual_risk_color: residualRisk?.color ?? null,
      recommendation_required: scenario.recommendation_required,
      acceptance_required: scenario.acceptance_required,
      lopa_required: scenario.lopa_required,
      lopa_trigger_reason: scenario.lopa_trigger_reason ?? null,
      assessment_comment: comment ?? null,
      assessed_by: actorId
    };
    await this.safeMany(this.db.from('hazop_scenario_risk_assessments').insert(payload).select());
    await this.db.single(this.db.from('hazop_risk_assessments').insert({ id: crypto.randomUUID(), tenant_id: tenantId, scenario_id: scenario.id, severity: scenario.severity, likelihood: scenario.likelihood, risk_score: risk.score, risk_level: risk.level, assessed_by: actorId }).select().single());
  }

  private async writeRiskHistory(tenantId: string, studyId: string, scenarioId: string, actorId: string, changeType: string, before: any, after: any, reason?: string) {
    await this.safeMany(this.db.from('hazop_risk_history').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      study_id: studyId,
      scenario_id: scenarioId,
      change_type: changeType,
      old_values: before ?? null,
      new_values: after ?? null,
      reason: reason ?? null,
      changed_by: actorId
    }).select());
  }

  private async riskAcceptance(tenantId: string, studyId: string, acceptanceId: string) {
    const acceptance = await this.db.single<any>(this.db.from('hazop_risk_acceptances').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', acceptanceId).maybeSingle());
    if (!acceptance) throw new NotFoundException('Risk acceptance not found');
    return acceptance;
  }

  private calculateRisk(severity: number, likelihood: number) {
    const score = severity * likelihood;
    const level = score >= 17 ? 'Critical' : score >= 10 ? 'High' : score >= 5 ? 'Medium' : 'Low';
    const color = level === 'Critical' ? '#ef4444' : level === 'High' ? '#f97316' : level === 'Medium' ? '#f59e0b' : '#22c55e';
    return { score, level, color, recommendationRequired: ['High', 'Critical'].includes(level), lopaRequired: level === 'Critical', lopaReason: level === 'Critical' ? 'Critical initial risk meets site LOPA trigger policy' : null };
  }

  private deviationText(guideword?: string, parameter?: string) {
    if (!guideword || !parameter) return null;
    const exact: Record<string, string> = {
      'No::Flow': 'No Flow',
      'More::Pressure': 'More Pressure / High Pressure',
      'Less::Pressure': 'Less Pressure / Low Pressure',
      'More::Temperature': 'More Temperature / High Temperature',
      'Less::Temperature': 'Less Temperature / Low Temperature',
      'More::Level': 'More Level / High Level',
      'Less::Level': 'Less Level / Low Level'
    };
    return exact[`${guideword}::${parameter}`] ?? `${guideword} ${parameter}`;
  }

  private generateDeviationPairs(guidewords: string[], parameters: string[], mode: string) {
    const normalizedGuidewords = guidewords.filter(Boolean);
    const normalizedParameters = parameters.filter(Boolean);
    const common = new Set(['No::Flow', 'More::Flow', 'Less::Flow', 'Reverse::Flow', 'More::Pressure', 'Less::Pressure', 'More::Temperature', 'Less::Temperature', 'More::Level', 'Less::Level']);
    const pairs = [];
    for (const guideword of normalizedGuidewords) {
      for (const parameter of normalizedParameters) {
        if (mode === 'common' && !common.has(`${guideword}::${parameter}`)) continue;
        pairs.push({ guideword, parameter });
      }
    }
    return pairs;
  }

  private async indexHazopNode(tenantId: string, study: any, node: any) {
    await this.searchIndex.indexRecord(tenantId, {
      module: 'hazop',
      recordType: 'HAZOP Node',
      recordId: node.id,
      recordNumber: node.node_number,
      title: node.title,
      subtitle: [study.study_number, node.status].filter(Boolean).join(' / '),
      description: node.design_intent ?? node.description,
      status: node.status,
      siteId: study.site_id,
      url: `/hazop/${study.id}`,
      searchableText: [node.description, node.design_intent, node.process_conditions, node.boundaries, node.assumptions, node.exclusions, ...(node.equipment_ids ?? []), ...(node.pid_references ?? [])].filter(Boolean).join(' '),
      metadata: { studyId: study.id, studyNumber: study.study_number, unitId: node.unit_id, areaId: node.area_id }
    });
  }

  private async indexHazopScenario(tenantId: string, study: any, node: any, scenario: any) {
    await this.searchIndex.indexRecord(tenantId, {
      module: 'hazop',
      recordType: 'HAZOP Scenario',
      recordId: scenario.id,
      recordNumber: scenario.scenario_number,
      title: (scenario.deviation_text ?? `${scenario.guideword ?? ''} ${scenario.parameter ?? ''}`.trim()) || scenario.scenario_number,
      subtitle: [study.study_number, node.node_number, scenario.risk_level].filter(Boolean).join(' / '),
      description: [scenario.cause, scenario.consequence].filter(Boolean).join(' | '),
      status: scenario.status,
      priority: scenario.risk_level,
      siteId: study.site_id,
      url: `/hazop/${study.id}`,
      searchableText: [scenario.guideword, scenario.parameter, scenario.deviation_text, scenario.cause, scenario.consequence, scenario.existing_safeguards, ...(node.equipment_ids ?? [])].filter(Boolean).join(' '),
      metadata: { studyId: study.id, nodeId: node.id, lopaRequired: scenario.lopa_required }
    });
  }

  private async withRegisterCounts(tenantId: string, study: any) {
    const [nodes, scenarios, recommendations] = await Promise.all([
      this.db.many<any>(this.db.from('hazop_nodes').select('id').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.db.many<any>(this.db.from('hazop_scenarios').select('id,risk_level,lopa_required').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.db.many<any>(this.db.from('hazop_recommendations').select('id,status').eq('tenant_id', tenantId).eq('study_id', study.id))
    ]);
    return {
      ...study,
      nodeCount: nodes.length,
      scenarioCount: scenarios.length,
      highRiskCount: scenarios.filter((s) => ['High', 'Critical'].includes(s.risk_level)).length,
      lopaRequiredCount: scenarios.filter((s) => s.lopa_required).length,
      openRecommendationCount: recommendations.filter((r) => !['Closed', 'Cancelled'].includes(r.status)).length
    };
  }

  private summaryFrom(data: { nodes: any[]; scenarios: any[]; recommendations: any[]; linkedRecords: any[]; attachments: any[] }) {
    return {
      nodeCount: data.nodes.length,
      scenarioCount: data.scenarios.length,
      highRiskCount: data.scenarios.filter((s) => ['High', 'Critical'].includes(s.risk_level)).length,
      lopaRequiredCount: data.scenarios.filter((s) => s.lopa_required).length,
      openRecommendationCount: data.recommendations.filter((r) => !['Closed', 'Cancelled'].includes(r.status)).length,
      linkedRecordCount: data.linkedRecords.length,
      attachmentCount: data.attachments.length,
      progress: data.scenarios.length ? Math.round((data.scenarios.filter((s) => s.status === 'Closed').length / data.scenarios.length) * 100) : 0
    };
  }

  private async refreshStudyProgress(tenantId: string, studyId: string) {
    const scenarios = await this.db.many<any>(this.db.from('hazop_scenarios').select('status,lopa_required').eq('tenant_id', tenantId).eq('study_id', studyId));
    const progress = scenarios.length ? Math.round((scenarios.filter((s) => s.status === 'Closed').length / scenarios.length) * 100) : 0;
    const lopaRequired = scenarios.some((s) => s.lopa_required);
    await this.db.single(this.db.from('hazop_studies').update({ progress_percent: progress, lopa_required: lopaRequired, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', studyId).select().single());
  }

  private async history(tenantId: string, studyId: string, actorId: string, eventType: string, title: string, description?: string, metadata: Record<string, unknown> = {}) {
    const study = await this.db.single<any>(this.db.from('hazop_studies').select('id,company_id,site_id').eq('tenant_id', tenantId).eq('id', studyId).maybeSingle()).catch(() => null);
    const actor = actorId ? await this.db.single<any>(this.db.from('User').select('displayName,email').eq('tenantId', tenantId).eq('id', actorId).maybeSingle()).catch(() => null) : null;
    const category = this.historyCategory(eventType);
    const severity = this.historySeverity(eventType, metadata);
    const payload = {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study?.company_id ?? null,
      site_id: study?.site_id ?? null,
      study_id: studyId,
      event_type: eventType,
      event_category: category,
      event_title: title,
      event_description: description ?? null,
      title,
      description: description ?? null,
      severity,
      actor_id: actorId,
      actor_user_id: actorId,
      actor_name_snapshot: actor?.displayName ?? actor?.email ?? null,
      related_section: this.historySection(category),
      related_record_id: (metadata.entityId ?? metadata.nodeId ?? metadata.scenarioId ?? metadata.recommendationId ?? metadata.safeguardId ?? metadata.sessionId ?? metadata.attachmentId ?? metadata.linkedRecordId ?? metadata.signoffId) as string | null,
      node_id: metadata.nodeId as string | null,
      scenario_id: metadata.scenarioId as string | null,
      recommendation_id: metadata.recommendationId as string | null,
      safeguard_id: metadata.safeguardId as string | null,
      session_id: metadata.sessionId as string | null,
      attachment_id: metadata.attachmentId as string | null,
      linked_record_id: metadata.linkedRecordId as string | null,
      signoff_id: metadata.signoffId as string | null,
      before_values_json: (metadata.before as JsonValue) ?? null,
      after_values_json: ((metadata.after ?? metadata.patch) as JsonValue) ?? null,
      metadata,
      metadata_json: metadata,
      safety_critical: this.isSafetyCriticalHistory(eventType, metadata, severity),
      system_generated: actorId === 'system'
    };
    return this.db.single(this.db.from('hazop_history_events').insert(payload).select().single());
  }

  private async safeHistory(tenantId: string, studyId: string, actorId: string, eventType: string, title: string, description?: string, metadata: Record<string, unknown> = {}) {
    try {
      return await this.history(tenantId, studyId, actorId, eventType, title, description, metadata);
    } catch {
      return null;
    }
  }

  private async safeAudit(payload: Parameters<typeof this.audit.write>[0]) {
    try {
      return await this.audit.write(payload);
    } catch {
      return null;
    }
  }

  private async updateApprovalWorkflow(tenantId: string, workflowId: string, patch: Record<string, any>) {
    try {
      return await this.db.single<any>(this.db.from('hazop_approval_workflows').update(patch).eq('tenant_id', tenantId).eq('id', workflowId).select().single());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/column .* does not exist|schema cache|could not find .* column/i.test(message)) throw error;
      const legacyPatch = Object.fromEntries(Object.entries(patch).filter(([key]) => ['status', 'updated_at'].includes(key)));
      return this.db.single<any>(this.db.from('hazop_approval_workflows').update(legacyPatch).eq('tenant_id', tenantId).eq('id', workflowId).select().single());
    }
  }

  private async updateStudyStatus(tenantId: string, studyId: string, status: string) {
    return this.db.single(this.db.from('hazop_studies').update({ status, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', studyId).select().single());
  }

  private revalidationDate(months: number) {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().slice(0, 10);
  }

  private settingsInsertPayload(tenantId: string, studyId: string, settings: Record<string, any>) {
    return {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      study_id: studyId,
      guideword_set: settings.guidewordSet ?? settings.guideword_set ?? 'Standard HAZOP',
      risk_method: settings.riskMethod ?? settings.risk_method ?? '5x5 Matrix',
      require_recommendation_for_high: settings.requireRecommendationForHigh ?? settings.require_recommendation_for_high ?? true,
      require_acceptance_for_no_action: settings.requireAcceptanceForNoAction ?? settings.require_acceptance_for_no_action ?? true,
      lopa_trigger_policy: settings.lopaTriggerPolicy ?? settings.lopa_trigger_policy ?? { critical: true, high_safety_critical: true },
      session_settings: settings.sessionSettings ?? settings.session_settings ?? {},
      risk_matrix_source: settings.riskMatrixSource ?? 'Company Default',
      severity_levels: settings.severityLevels ?? [],
      likelihood_levels: settings.likelihoodLevels ?? [],
      risk_colors: settings.riskColors ?? {},
      acceptance_criteria: settings.acceptanceCriteria ?? null,
      lopa_trigger_threshold: settings.lopaTriggerThreshold ?? null,
      parameter_set: settings.parameterSet ?? null,
      node_template: settings.nodeTemplate ?? null,
      recommendation_workflow: settings.recommendationWorkflow ?? null,
      approval_workflow: settings.approvalWorkflow ?? null,
      study_session_plan: settings.studySessionPlan ?? null,
      report_template: settings.reportTemplate ?? null,
      revalidation_policy: settings.revalidationPolicy ?? null
    };
  }

  private normalizedLinkedRecords(dto: CreateHazopStudyDto) {
    const links = [...(dto.linkedRecords ?? [])];
    const add = (recordType: string, recordId?: string, title?: string) => {
      if (recordId && !links.some((link: any) => link.recordType === recordType && link.recordId === recordId)) links.push({ recordType, recordId, title });
    };
    add('MOC', dto.linkedMocId, 'Linked MOC');
    add('PSSR', dto.linkedPssrId, 'Linked PSSR');
    add('PTW', dto.linkedPtwId, 'Linked PTW');
    add('Incident', dto.linkedIncidentId, 'Linked Incident');
    add('Previous HAZOP', dto.previousHazopId, 'Previous HAZOP/PHA study');
    for (const equipmentId of dto.equipmentTags ?? []) add('Equipment', equipmentId, 'Scoped equipment');
    for (const documentId of dto.pidReferences ?? []) add('Document', documentId, 'P&ID / document reference');
    return links;
  }

  private async addInitialNode(tenantId: string, actorId: string, studyId: string, node: Record<string, any>, scope: Scope) {
    if (!node.title) return null;
    return this.addNode(tenantId, actorId, studyId, {
      title: node.title,
      description: node.description,
      designIntent: node.designIntent,
      equipmentIds: node.equipmentIds ?? node.equipmentTags ?? [],
      documentIds: node.documentIds ?? [],
      pidReferences: node.pidReferences ?? [],
      processConditions: node.processConditions,
      boundaries: node.boundaries
    }, scope);
  }

  private async indexStudy(tenantId: string, study: any) {
    await this.searchIndex.indexRecord(tenantId, {
      module: 'hazop',
      recordType: 'HAZOP Study',
      recordId: study.id,
      recordNumber: study.study_number,
      title: study.title,
      subtitle: [study.study_type, study.process_section].filter(Boolean).join(' / '),
      description: study.description ?? study.scope_summary,
      status: study.status,
      priority: study.priority,
      siteId: study.site_id,
      url: `/hazop/${study.id}`,
      searchableText: [study.study_reason, study.scope_description, study.boundaries, ...(study.equipment_tags ?? []), ...(study.pid_references ?? []), ...(study.related_chemicals ?? [])].filter(Boolean).join(' '),
      metadata: { studyType: study.study_type, companyId: study.company_id, unitId: study.unit_id, areaId: study.area_id }
    });
  }

  private async linkedRecordRaw(tenantId: string, studyId: string, linkId: string) {
    const link = await this.db.single<any>(this.db.from('hazop_linked_records').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', linkId).maybeSingle());
    if (!link) throw new NotFoundException('Linked record not found');
    return link;
  }

  private async calculateLinkedRecordBlockers(tenantId: string, study: any, link: any) {
    await this.safeMany(this.db.from('hazop_linked_record_blockers').delete().eq('tenant_id', tenantId).eq('linked_record_id', link.id).neq('status', 'Resolved').select());
    const blockers: any[] = [];
    const module = String(link.linked_module ?? link.record_type ?? '');
    const status = String(link.record_status ?? '').toLowerCase();
    if (link.blocking_rule && link.blocking_rule !== 'Not blocking') {
      blockers.push({ blocker_type: link.blocking_rule, blocker_description: link.link_reason ?? `${module} dependency is configured as blocking`, severity: 'Hard', source_status: link.record_status ?? null });
    }
    if (module.includes('Document') && ['obsolete', 'expired', 'superseded', 'outdated'].some((word) => status.includes(word))) {
      blockers.push({ blocker_type: 'Outdated Document', blocker_description: 'Linked document is outdated, expired, or superseded.', severity: 'Hard', source_status: link.record_status });
    }
    if (module.includes('Equipment') && ['inactive', 'archived', 'decommissioned'].some((word) => status.includes(word))) {
      blockers.push({ blocker_type: 'Inactive Equipment', blocker_description: 'Linked equipment is inactive or unavailable.', severity: 'Hard', source_status: link.record_status });
    }
    if (module.includes('Action') && !['closed', 'completed', 'verified'].some((word) => status.includes(word))) {
      blockers.push({ blocker_type: 'Open Action', blocker_description: 'Linked action remains open.', severity: 'Hard', source_status: link.record_status });
    }
    if (module === 'MOC' && link.blocking_rule === 'Blocks MOC closure' && !['closed', 'completed'].some((word) => status.includes(word))) {
      blockers.push({ blocker_type: 'MOC Closure Dependency', blocker_description: 'Linked MOC must be completed before HAZOP closure.', severity: 'Hard', source_status: link.record_status });
    }
    if (module === 'PSSR' && link.blocking_rule === 'Blocks PSSR startup' && !['startup authorized', 'completed', 'closed'].some((word) => status.includes(word))) {
      blockers.push({ blocker_type: 'PSSR Startup Dependency', blocker_description: 'Linked PSSR startup dependency is not satisfied.', severity: 'Hard', source_status: link.record_status });
    }
    if (module.includes('LOPA') && !['completed', 'accepted', 'not required'].some((word) => status.includes(word))) {
      blockers.push({ blocker_type: 'LOPA Required Pending', blocker_description: 'LOPA/SIL follow-up is required and still pending.', severity: 'Hard', source_status: link.record_status });
    }
    if (!blockers.length) {
      await this.safeMany(this.db.from('hazop_linked_records').update({ blocking_status: 'Not Blocking', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', link.id).select());
      return [];
    }
    const inserted = await this.safeMany<any>(this.db.from('hazop_linked_record_blockers').insert(blockers.map((blocker) => ({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      linked_record_id: link.id,
      blocker_type: blocker.blocker_type,
      blocker_description: blocker.blocker_description,
      severity: blocker.severity,
      status: 'Open',
      source_status: blocker.source_status ?? null
    }))).select());
    await this.safeMany(this.db.from('hazop_linked_records').update({ blocking_status: 'Blocking', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', link.id).select());
    return inserted;
  }

  private async resolveLinkedRecordStatus(tenantId: string, link: any) {
    const module = String(link.linked_module ?? link.record_type ?? '');
    const id = link.linked_record_id ?? link.record_id;
    const pick = (row: any, statusKeys: string[], numberKeys: string[], titleKeys: string[]) => ({
      status: statusKeys.map((key) => row?.[key]).find(Boolean) ?? link.record_status,
      number: numberKeys.map((key) => row?.[key]).find(Boolean) ?? link.linked_record_number,
      title: titleKeys.map((key) => row?.[key]).find(Boolean) ?? link.linked_record_title
    });
    try {
      if (module === 'MOC') {
        const row = await this.db.single<any>(this.db.from('moc_requests').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
        return pick(row, ['status'], ['moc_number', 'change_number'], ['title', 'description']);
      }
      if (module === 'PSSR') {
        const row = await this.db.single<any>(this.db.from('pssr_reviews').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
        return pick(row, ['status'], ['pssr_number'], ['title', 'description']);
      }
      if (module === 'PTW') {
        const row = await this.db.single<any>(this.db.from('permits').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
        return pick(row, ['status'], ['permit_number'], ['work_description', 'title']);
      }
      if (module === 'Equipment') {
        const row = await this.db.single<any>(this.db.from('equipment').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
        return pick(row, ['status', 'operational_status'], ['tag', 'equipment_tag'], ['name', 'description']);
      }
      if (module.includes('Document')) {
        const row = await this.db.single<any>(this.db.from('documents').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
        return pick(row, ['status'], ['document_number', 'number'], ['title', 'name']);
      }
      if (module.includes('Action')) {
        const row = await this.db.single<any>(this.db.from('Action').select('*').eq('tenantId', tenantId).eq('id', id).maybeSingle());
        return pick(row, ['status'], ['actionNumber'], ['title']);
      }
    } catch {
      return { status: link.record_status, title: link.linked_record_title, number: link.linked_record_number };
    }
    return { status: link.record_status, title: link.linked_record_title, number: link.linked_record_number };
  }

  private async linkedSearchSources(tenantId: string) {
    const [mocs, pssrs, permits, equipment, documents, actions, studies] = await Promise.all([
      this.safeMany<any>(this.db.from('moc_requests').select('id,moc_number,title,description,status').eq('tenant_id', tenantId).limit(100)),
      this.safeMany<any>(this.db.from('pssr_reviews').select('id,pssr_number,title,description,status').eq('tenant_id', tenantId).limit(100)),
      this.safeMany<any>(this.db.from('permits').select('id,permit_number,work_description,status').eq('tenant_id', tenantId).limit(100)),
      this.safeMany<any>(this.db.from('equipment').select('id,tag,name,status,operational_status').eq('tenant_id', tenantId).limit(100)),
      this.safeMany<any>(this.db.from('documents').select('id,document_number,title,status').eq('tenant_id', tenantId).limit(100)),
      this.safeMany<any>(this.db.from('Action').select('id,actionNumber,title,status').eq('tenantId', tenantId).limit(100)),
      this.safeMany<any>(this.db.from('hazop_studies').select('id,study_number,title,status').eq('tenant_id', tenantId).limit(100))
    ]);
    return {
      MOC: mocs.map((row) => ({ id: row.id, number: row.moc_number, title: row.title ?? row.description, status: row.status })),
      PSSR: pssrs.map((row) => ({ id: row.id, number: row.pssr_number, title: row.title ?? row.description, status: row.status })),
      PTW: permits.map((row) => ({ id: row.id, number: row.permit_number, title: row.work_description, status: row.status })),
      Equipment: equipment.map((row) => ({ id: row.id, number: row.tag, title: row.name, status: row.status ?? row.operational_status })),
      Document: documents.map((row) => ({ id: row.id, number: row.document_number, title: row.title, status: row.status })),
      'Universal Action': actions.map((row) => ({ id: row.id, number: row.actionNumber, title: row.title, status: row.status })),
      'Previous HAZOP': studies.map((row) => ({ id: row.id, number: row.study_number, title: row.title, status: row.status }))
    };
  }

  private linkedRecordUrl(link: any) {
    const module = String(link.linked_module ?? link.record_type ?? '');
    const id = link.linked_record_id ?? link.record_id;
    if (module === 'MOC') return `/moc/${id}`;
    if (module === 'PSSR') return `/pssr/${id}`;
    if (module === 'PTW') return `/ptw/${id}`;
    if (module === 'Equipment') return `/equipment/${id}`;
    if (module.includes('Document')) return `/documents/${id}`;
    if (module.includes('Action')) return `/actions/${id}`;
    if (module.includes('HAZOP')) return `/hazop/${id}`;
    return null;
  }

  private async indexHazopLinkedRecord(tenantId: string, study: any, link: any) {
    await this.searchIndex.indexRecord(tenantId, {
      module: 'hazop',
      recordType: 'HAZOP Linked Record',
      recordId: link.id,
      recordNumber: link.linked_record_number ?? link.record_number,
      title: link.linked_record_title ?? link.title ?? link.linked_record_id,
      subtitle: [study.study_number, link.linked_module, link.relationship_type].filter(Boolean).join(' / '),
      description: link.link_reason ?? link.notes,
      status: link.blocking_status,
      siteId: study.site_id,
      url: `/hazop/${study.id}?tab=linked-records`,
      searchableText: [link.linked_module, link.linked_record_number, link.linked_record_title, link.equipment_tag, link.notes, link.link_reason].filter(Boolean).join(' '),
      metadata: { studyId: study.id, linkedRecordId: link.id, linkedModule: link.linked_module }
    });
  }

  private async attachmentRows(tenantId: string, studyId: string, query: Record<string, any>, scope: Scope) {
    const study = await this.study(tenantId, studyId, scope);
    const [attachments, users] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_attachments').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).is('deleted_at', null).is('archived_at', null).order('uploaded_at', { ascending: false })),
      this.safeMany<any>(this.db.from('User').select('id,displayName,email,title').eq('tenantId', tenantId))
    ]);
    let rows = attachments.map((row) => ({ ...row, uploadedBy: users.find((user) => user.id === row.uploaded_by), storage_status: row.storage_key ? 'Stored' : 'Metadata Only' }));
    const search = String(query.search ?? '').toLowerCase();
    if (search) rows = rows.filter((row) => [row.file_name, row.description, row.category, row.linked_section, ...(row.tags ?? [])].filter(Boolean).join(' ').toLowerCase().includes(search));
    if (query.category && query.category !== 'All') rows = rows.filter((row) => row.category === query.category);
    if (query.linkedSection && query.linkedSection !== 'All') rows = rows.filter((row) => row.linked_section === query.linkedSection);
    if (query.reviewStatus && query.reviewStatus !== 'All') rows = rows.filter((row) => row.review_status === query.reviewStatus);
    if (query.visibility && query.visibility !== 'All') rows = rows.filter((row) => row.visibility === query.visibility);
    if (query.fileType && query.fileType !== 'All') rows = rows.filter((row) => String(row.file_type ?? row.mime_type ?? '').toLowerCase().includes(String(query.fileType).toLowerCase()));
    return rows;
  }

  private async attachmentRaw(tenantId: string, studyId: string, attachmentId: string) {
    const attachment = await this.db.single<any>(this.db.from('hazop_attachments').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', attachmentId).maybeSingle());
    if (!attachment || attachment.deleted_at) throw new NotFoundException('Attachment not found');
    return attachment;
  }

  private async storeHazopAttachment(study: any, dto: Record<string, any>, file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }, version = 1) {
    const name = file?.originalname ?? dto.fileName ?? dto.title ?? 'attachment.txt';
    const extension = name.includes('.') ? name.split('.').pop()?.toLowerCase() ?? 'file' : 'file';
    this.validateHazopFile(extension, file?.mimetype ?? dto.mimeType ?? dto.fileType);
    const key = dto.storageKey ?? `companies/${study.company_id ?? 'company'}/sites/${study.site_id ?? 'site'}/hazop/${study.id}/v${version}/${crypto.randomUUID()}-${name.replace(/[^A-Za-z0-9_.-]/g, '_')}`;
    const checksum = file?.buffer ? createHash('sha256').update(file.buffer).digest('hex') : dto.checksum ?? null;
    if (file?.buffer) {
      const bucket = process.env.HAZOP_STORAGE_BUCKET ?? process.env.SUPABASE_STORAGE_BUCKET ?? 'hazop-attachments';
      let result = await this.db.client.storage.from(bucket).upload(key, file.buffer, { contentType: file.mimetype || 'application/octet-stream', upsert: false });
      if (result.error && /bucket/i.test(result.error.message)) {
        await this.db.client.storage.createBucket(bucket, { public: false }).catch(() => null);
        result = await this.db.client.storage.from(bucket).upload(key, file.buffer, { contentType: file.mimetype || 'application/octet-stream', upsert: false });
      }
      if (result.error) throw new BadRequestException(`Attachment storage failed: ${result.error.message}`);
      return { provider: 'supabase', key, url: dto.storageUrl ?? null, extension, checksum, scanStatus: 'Pending Scan' };
    }
    return { provider: dto.storageProvider ?? 'external', key, url: dto.storageUrl ?? dto.url ?? null, extension, checksum, scanStatus: dto.scanStatus ?? 'Not Scanned' };
  }

  private async readStoredAttachment(attachment: any) {
    if (attachment.storage_url) return null;
    if (!attachment.storage_key || attachment.storage_provider !== 'supabase') return null;
    const bucket = process.env.HAZOP_STORAGE_BUCKET ?? process.env.SUPABASE_STORAGE_BUCKET ?? 'hazop-attachments';
    const result = await this.db.client.storage.from(bucket).createSignedUrl(attachment.storage_key, 60 * 5);
    if (result.error) return null;
    return result.data?.signedUrl ?? null;
  }

  private validateHazopFile(extension: string, mimeType?: string) {
    const blocked = new Set(['exe', 'bat', 'cmd', 'js', 'msi', 'ps1', 'vbs', 'scr', 'com']);
    const allowed = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp', 'docx', 'xlsx', 'csv', 'txt', 'pptx', 'dwg', 'dxf']);
    if (blocked.has(extension)) throw new BadRequestException('Unsafe executable attachment type is blocked');
    if (!allowed.has(extension) && !String(mimeType ?? '').startsWith('image/')) throw new BadRequestException('Attachment file type is not allowed by HAZOP policy');
  }

  private parseTags(value: any) {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (!value) return [];
    return String(value).split(',').map((tag) => tag.trim()).filter(Boolean);
  }

  private async logAttachmentAccess(tenantId: string, study: any, attachment: any, actorId: string, action: string) {
    return this.safeMany(this.db.from('hazop_attachment_access_logs').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      attachment_id: attachment.id,
      action,
      user_id: actorId
    }).select());
  }

  private async indexHazopAttachment(tenantId: string, study: any, attachment: any) {
    await this.searchIndex.indexRecord(tenantId, {
      module: 'hazop',
      recordType: 'HAZOP Attachment',
      recordId: attachment.id,
      recordNumber: attachment.file_name,
      title: attachment.file_name,
      subtitle: [study.study_number, attachment.category, attachment.linked_section].filter(Boolean).join(' / '),
      description: attachment.description,
      status: attachment.review_status,
      siteId: study.site_id,
      url: `/hazop/${study.id}?tab=attachments`,
      searchableText: [attachment.file_name, attachment.category, attachment.description, attachment.linked_section, ...(attachment.tags ?? [])].filter(Boolean).join(' '),
      metadata: { studyId: study.id, attachmentId: attachment.id, visibility: attachment.visibility }
    });
  }

  private async historyRows(tenantId: string, studyId: string, query: Record<string, any>, scope: Scope, sensitive = false) {
    const study = await this.study(tenantId, studyId, scope);
    const [events, users] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_history_events').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('created_at', { ascending: false }).limit(Number(query.limit ?? 500))),
      this.safeMany<any>(this.db.from('User').select('id,displayName,email,title').eq('tenantId', tenantId))
    ]);
    let rows = events.map((event) => {
      const metadata = event.metadata_json ?? event.metadata ?? {};
      const category = event.event_category ?? this.historyCategory(event.event_type);
      const severity = event.severity ?? this.historySeverity(event.event_type, metadata);
      const safetyCritical = Boolean(event.safety_critical ?? this.isSafetyCriticalHistory(event.event_type, metadata, severity));
      const before = event.before_values_json ?? metadata.before ?? null;
      const after = event.after_values_json ?? metadata.after ?? metadata.patch ?? null;
      return {
        ...event,
        event_title: event.event_title ?? event.title,
        event_description: event.event_description ?? event.description,
        actor_user_id: event.actor_user_id ?? event.actor_id,
        actor: users.find((user) => user.id === (event.actor_user_id ?? event.actor_id)),
        event_category: category,
        severity,
        safety_critical: safetyCritical,
        related_section: event.related_section ?? this.historySection(category),
        related_record_id: event.related_record_id ?? metadata.entityId ?? metadata.nodeId ?? metadata.scenarioId ?? metadata.recommendationId ?? metadata.attachmentId ?? metadata.linkedRecordId,
        before_values_json: sensitive ? before : this.maskHistoryValues(before),
        after_values_json: sensitive ? after : this.maskHistoryValues(after),
        metadata_json: sensitive ? metadata : this.maskHistoryValues(metadata)
      };
    });
    const search = String(query.search ?? '').toLowerCase();
    if (search) rows = rows.filter((row) => [row.event_title, row.event_description, row.event_type, row.actor?.displayName, row.related_record_number, row.related_record_id].filter(Boolean).join(' ').toLowerCase().includes(search));
    if (query.category && query.category !== 'All') rows = rows.filter((row) => row.event_category === query.category);
    if (query.eventType && query.eventType !== 'All') rows = rows.filter((row) => row.event_type === query.eventType);
    if (query.severity && query.severity !== 'All') rows = rows.filter((row) => row.severity === query.severity);
    if (query.actorId && query.actorId !== 'All') rows = rows.filter((row) => row.actor_user_id === query.actorId);
    if (query.safetyCritical === 'true' || query.safetyCritical === true) rows = rows.filter((row) => row.safety_critical);
    if (query.systemEvents === 'true' || query.systemEvents === true) rows = rows.filter((row) => row.system_generated);
    if (query.userActions === 'true' || query.userActions === true) rows = rows.filter((row) => !row.system_generated);
    if (query.dateFrom) rows = rows.filter((row) => String(row.created_at) >= String(query.dateFrom));
    if (query.dateTo) rows = rows.filter((row) => String(row.created_at) <= String(query.dateTo));
    return rows;
  }

  private historyCategory(eventType: string) {
    const type = String(eventType ?? '');
    if (type.includes('ATTACHMENT')) return 'Attachment';
    if (type.includes('RISK') || type.includes('LOPA')) return 'Risk';
    if (type.includes('SAFEGUARD') || type.includes('IPL')) return 'Safeguard/IPL';
    if (type.includes('RECOMMENDATION') || type.includes('ACTION')) return 'Recommendation/Action';
    if (type.includes('SESSION') || type.includes('TEAM') || type.includes('ATTENDANCE') || type.includes('MINUTES')) return 'Team/Session';
    if (type.includes('LINKED_RECORD')) return 'Linked Record';
    if (type.includes('SIGNOFF') || type.includes('REVIEW') || type.includes('APPROVAL')) return 'Review/Sign-Off';
    if (type.includes('WORKFLOW')) return 'Workflow';
    if (type.includes('NOTIFICATION')) return 'Notification';
    if (type.includes('PERMISSION') || type.includes('UNAUTHORIZED')) return 'Security';
    return 'Study';
  }

  private historySection(category: string) {
    const map: Record<string, string> = { Risk: 'Risk Ranking', 'Safeguard/IPL': 'Safeguards / IPL', 'Recommendation/Action': 'Recommendations / Actions', 'Team/Session': 'Team & Sessions', 'Linked Record': 'Linked Records', 'Review/Sign-Off': 'Review & Sign-Off', Attachment: 'Attachments' };
    return map[category] ?? 'Overview';
  }

  private historySeverity(eventType: string, metadata: any) {
    const text = [eventType, JSON.stringify(metadata ?? {})].join(' ').toUpperCase();
    if (text.includes('CRITICAL') || text.includes('REJECTED') || text.includes('UNAUTHORIZED') || text.includes('DELETED')) return 'High';
    if (text.includes('LOPA') || text.includes('BLOCK') || text.includes('FAILED')) return 'Medium';
    return 'Info';
  }

  private isSafetyCriticalHistory(eventType: string, metadata: any, severity: string) {
    const text = [eventType, severity, JSON.stringify(metadata ?? {})].join(' ').toUpperCase();
    return ['CRITICAL', 'LOPA', 'IPL_VALIDATION_FAILED', 'CLOSURE_BLOCKED', 'SIGNOFF_REJECTED', 'ATTACHMENT_DELETED', 'ATTACHMENT_ARCHIVED', 'UNAUTHORIZED', 'REOPENED'].some((token) => text.includes(token));
  }

  private maskHistoryValues(value: any): any {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((item) => this.maskHistoryValues(item));
    const sensitive = new Set(['password', 'pin', 'token', 'secret', 'signatureSnapshot', 'signature_snapshot']);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sensitive.has(key) ? '***MASKED***' : this.maskHistoryValues(item)]));
  }

  private async upsertReadinessChecks(tenantId: string, studyId: string, checks: any[]) {
    await this.safeMany(this.db.from('hazop_readiness_checks').delete().eq('tenant_id', tenantId).eq('study_id', studyId).select());
    if (!checks.length) return [];
    return this.safeMany<any>(this.db.from('hazop_readiness_checks').insert(checks.map((check) => ({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      study_id: studyId,
      check_key: check.key,
      check_label: check.label,
      category: check.category,
      status: check.status,
      hard_blocker: check.hard_blocker,
      value: check.value ?? null,
      required_value: check.required_value ?? null,
      message: check.message ?? null,
      calculated_at: new Date().toISOString()
    }))).select());
  }

  private async refreshClosureBlockers(tenantId: string, study: any, blockers: any[]) {
    await this.safeMany(this.db.from('hazop_closure_blockers').delete().eq('tenant_id', tenantId).eq('study_id', study.id).neq('status', 'Resolved').select());
    if (!blockers.length) return [];
    return this.safeMany<any>(this.db.from('hazop_closure_blockers').insert(blockers.map((blocker) => ({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      blocker_type: blocker.blocker_type,
      blocker_key: blocker.blocker_key,
      blocker_title: blocker.blocker_title,
      blocker_description: blocker.blocker_description,
      severity: blocker.severity,
      status: blocker.status ?? 'Open'
    }))).select());
  }

  private async ensureApprovalWorkflow(tenantId: string, study: any) {
    const existing = await this.db.single<any>(this.db.from('hazop_approval_workflows').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).maybeSingle()).catch(() => null);
    if (existing) return existing;
    return this.db.single<any>(this.db.from('hazop_approval_workflows').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      study_id: study.id,
      workflow_name: 'HAZOP Review & Sign-Off',
      workflow_engine_id: study.workflow_id ?? null,
      status: 'Not Started',
      current_step: 'Preparation',
      required_final_approver_role: 'Plant Manager'
    }).select().single());
  }

  private async ensureSignoffMatrix(tenantId: string, study: any, actorId: string, force = false) {
    const existing = await this.safeMany<any>(this.db.from('hazop_signoffs').select('*').eq('tenant_id', tenantId).eq('study_id', study.id));
    if (force && existing.length) await this.supersedeSignoffRows(tenantId, study.id);
    const activeExisting = force ? existing.filter((row) => row.status === 'Signed') : existing.filter((row) => row.status !== 'Superseded');
    const team = await this.safeMany<any>(this.db.from('hazop_study_team_members').select('*').eq('tenant_id', tenantId).eq('study_id', study.id).order('created_at'));
    const requiredRoles = [
      'HAZOP Leader / Facilitator',
      'Scribe',
      'Process Engineer',
      'Operations Representative',
      'Maintenance Representative',
      'Instrument / Controls Engineer',
      'Mechanical Engineer',
      'Electrical Engineer',
      'HSE Representative',
      'Area Owner',
      'Plant Manager / Approver'
    ];
    if (study.linked_moc_id || study.moc_id) requiredRoles.push('MOC Owner');
    if (study.linked_pssr_id || study.pssr_id) requiredRoles.push('PSSR Coordinator');
    const activeTeam = team.filter((member) => !['Removed', 'Replaced', 'Inactive', 'Declined'].includes(String(member.status ?? 'Active')));
    const sourceRows = requiredRoles.map((role) => {
      const member = this.findTeamMemberForSignoffRole(activeTeam, role);
      const fallbackUserId = this.fallbackStudySignoffUserId(study, role);
      const memberUserId = member ? this.teamMemberUserId(member) : null;
      return {
        role,
        member,
        userId: memberUserId ?? fallbackUserId,
        discipline: member?.discipline ?? role,
        required: true
      };
    });
    for (const member of activeTeam.filter((row) => row.signoff_required)) {
      const role = member.study_role ?? member.role ?? member.discipline;
      if (!sourceRows.some((row) => this.roleMatches(row.role, role) && row.userId === this.teamMemberUserId(member))) {
        sourceRows.push({ role, member, userId: this.teamMemberUserId(member), discipline: member.discipline ?? role, required: true });
      }
    }

    const createdOrUpdated: any[] = [];
    for (const [index, source] of sourceRows.entries()) {
      const existingForRole = activeExisting.find((row) => this.roleMatches(row.signoff_role ?? row.signature_role ?? row.role, source.role) && this.signoffCanBeRepaired(row, source.userId));
      const existingExact = activeExisting.find((row) => this.roleMatches(row.signoff_role ?? row.signature_role ?? row.role, source.role) && this.signoffKey(row.signoff_role ?? row.signature_role ?? row.role, row.assigned_user_id ?? row.signer_user_id) === this.signoffKey(source.role, source.userId));
      if (existingExact && !this.signoffNeedsRepair(existingExact, source)) {
        createdOrUpdated.push(existingExact);
        continue;
      }
      const target = existingExact ?? existingForRole;
      if (target) {
        const patch = {
          signoff_role: source.role,
          signature_role: source.role,
          discipline: source.discipline ?? target.discipline ?? null,
          required: source.required,
          assigned_user_id: source.userId,
          signer_user_id: source.userId,
          status: ['Pending Assignment', 'Not Generated'].includes(target.status) ? 'Pending Request' : target.status,
          sequence_order: target.sequence_order ?? index + 1,
          updated_at: new Date().toISOString()
        };
        const updated = await this.writeSignoffRow(tenantId, study.id, target.id, patch);
        createdOrUpdated.push(updated);
        continue;
      }
      const inserted = await this.writeSignoffRow(tenantId, study.id, null, {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: study.company_id ?? null,
        site_id: study.site_id ?? null,
        study_id: study.id,
        signoff_role: source.role,
        signature_role: source.role,
        discipline: source.discipline ?? null,
        required: source.required,
        assigned_user_id: source.userId,
        signer_user_id: source.userId,
        status: 'Pending Request',
        sequence_order: index + 1,
        requested_by: null,
        requested_at: null
      });
      createdOrUpdated.push(inserted);
    }
    const activeIds = new Set(createdOrUpdated.map((row) => row.id).filter(Boolean));
    const generatedRoles = new Set(sourceRows.map((row) => this.normalizedRole(row.role)));
    for (const stale of activeExisting) {
      const staleRole = this.normalizedRole(stale.signoff_role ?? stale.signature_role ?? stale.role);
      if (activeIds.has(stale.id) || !generatedRoles.has(staleRole) || stale.status === 'Signed') continue;
      await this.writeSignoffRow(tenantId, study.id, stale.id, { status: 'Superseded', superseded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).catch(() => null);
    }
    return createdOrUpdated.length ? createdOrUpdated : activeExisting;
  }

  private async signoffRows(tenantId: string, studyId: string) {
    try {
      return await this.db.many<any>(this.db.from('hazop_signoffs').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).neq('status', 'Superseded').order('sequence_order', { ascending: true }));
    } catch {
      return this.safeMany<any>(this.db.from('hazop_signoffs').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).neq('status', 'Superseded').order('created_at', { ascending: true }));
    }
  }

  private async writeSignoffRow(tenantId: string, studyId: string, id: string | null, values: Record<string, any>) {
    try {
      const query = id
        ? this.db.from('hazop_signoffs').update(values).eq('tenant_id', tenantId).eq('id', id).select().single()
        : this.db.from('hazop_signoffs').insert(values).select().single();
      return await this.db.single<any>(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (this.isDuplicateSignoffError(message)) {
        const existing = await this.findExistingSignoffRow(tenantId, studyId, values);
        if (existing) return existing;
      }
      if (!this.isSignoffSchemaCompatibilityError(message)) throw error;
      const legacy = this.legacySignoffPayload(values, tenantId, studyId, id);
      try {
        const query = id
          ? this.db.from('hazop_signoffs').update(legacy).eq('tenant_id', tenantId).eq('id', id).select().single()
          : this.db.from('hazop_signoffs').insert(legacy).select().single();
        const row = await this.db.single<any>(query);
        return this.normalizeSignoffRow(row, values);
      } catch (fallbackError) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        if (this.isDuplicateSignoffError(fallbackMessage)) {
          const existing = await this.findExistingSignoffRow(tenantId, studyId, values);
          if (existing) return existing;
        }
        throw fallbackError;
      }
    }
  }

  private async findExistingSignoffRow(tenantId: string, studyId: string, values: Record<string, any>) {
    const rows = await this.signoffRows(tenantId, studyId);
    return rows.find((row) => this.roleMatches(row.signoff_role ?? row.signature_role ?? row.role, values.signoff_role ?? values.signature_role ?? values.role)
      && this.signoffKey(row.signoff_role ?? row.signature_role ?? row.role, row.assigned_user_id ?? row.signer_user_id) === this.signoffKey(values.signoff_role ?? values.signature_role ?? values.role, values.assigned_user_id ?? values.signer_user_id))
      ?? rows.find((row) => this.roleMatches(row.signoff_role ?? row.signature_role ?? row.role, values.signoff_role ?? values.signature_role ?? values.role) && this.signoffCanBeRepaired(row, values.assigned_user_id ?? values.signer_user_id))
      ?? null;
  }

  private async supersedeSignoffRows(tenantId: string, studyId: string) {
    try {
      await this.db.many(this.db.from('hazop_signoffs').update({ status: 'Superseded', superseded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('study_id', studyId).neq('status', 'Signed').select());
    } catch {
      await this.safeMany(this.db.from('hazop_signoffs').update({ status: 'Superseded' }).eq('tenant_id', tenantId).eq('study_id', studyId).neq('status', 'Signed').select());
    }
  }

  private legacySignoffPayload(values: Record<string, any>, tenantId: string, studyId: string, id: string | null) {
    const payload: Record<string, any> = {
      tenant_id: tenantId,
      study_id: studyId,
      role: values.role ?? values.signoff_role ?? values.signature_role ?? 'HAZOP Sign-off',
      required: values.required ?? true,
      status: values.status ?? 'Pending Request',
      assigned_user_id: values.assigned_user_id ?? values.signer_user_id ?? null,
      signed_by: values.signed_by ?? null,
      signed_at: values.signed_at ?? null,
      signature_id: values.e_signature_id ?? values.signature_id ?? null,
      comment: values.comment ?? null
    };
    if (!id) payload.id = values.id ?? crypto.randomUUID();
    return payload;
  }

  private normalizeSignoffRow(row: any, source: Record<string, any>) {
    if (!row) return row;
    return {
      ...row,
      signoff_role: row.signoff_role ?? row.role ?? source.signoff_role,
      signature_role: row.signature_role ?? row.role ?? source.signature_role,
      signer_user_id: row.signer_user_id ?? row.assigned_user_id ?? source.signer_user_id,
      sequence_order: row.sequence_order ?? source.sequence_order,
      discipline: row.discipline ?? source.discipline
    };
  }

  private isSignoffSchemaCompatibilityError(message: string) {
    return /column .* does not exist|schema cache|could not find .* column/i.test(message);
  }

  private isDuplicateSignoffError(message: string) {
    return /duplicate key value|violates unique constraint/i.test(message);
  }

  private signoffKey(role: any, userId: any) {
    return `${String(role ?? '').trim().toLowerCase()}::${String(userId ?? 'unassigned')}`;
  }

  private teamMemberUserId(member: any) {
    return member.user_id ?? member.userId ?? member.member_user_id ?? member.memberUserId ?? member.assigned_user_id ?? member.signer_user_id ?? null;
  }

  private signoffRoleMatches(requiredRoles: string[], role: any) {
    const normalized = this.normalizedRole(role);
    return requiredRoles.some((requiredRole) => this.roleMatches(requiredRole, normalized));
  }

  private normalizedRole(role: any) {
    return String(role ?? '').toLowerCase().replace(/^hazop\s+/, '').replace(/\bcontrols\b/g, 'control').replace(/and/g, '').replace(/[^a-z0-9]+/g, '');
  }

  private roleMatches(actual: any, required: any) {
    const a = this.normalizedRole(actual);
    const r = this.normalizedRole(required);
    if (!a || !r) return false;
    if (a === r || a.includes(r) || r.includes(a)) return true;
    return this.roleAliases(r).some((alias) => a.includes(alias) || alias.includes(a));
  }

  private roleAliases(normalizedRequiredRole: string) {
    const aliases: Record<string, string[]> = {
      hazopleaderfacilitator: ['leader', 'facilitator', 'hazopleader', 'hazopfacilitator', 'studyleader'],
      processengineer: ['processsafetyengineer', 'processengineering', 'processrepresentative', 'process'],
      operationsrepresentative: ['operations', 'operationssupervisor', 'operator', 'areaoperator'],
      maintenancerepresentative: ['maintenance', 'maintenancesupervisor', 'maintenanceengineer'],
      instrumentcontrolengineer: ['instrumentengineer', 'controlengineer', 'instrumentcontrols', 'instrumentation', 'instrumentcontrol'],
      hserepresentative: ['hse', 'hsemanager', 'safety', 'processsafety'],
      areaowner: ['unitowner', 'plantareaowner'],
      plantmanagerapprover: ['plantmanager', 'approver', 'sitemanager']
    };
    return aliases[normalizedRequiredRole] ?? [];
  }

  private findTeamMemberForSignoffRole(team: any[], role: string) {
    return team.find((member) => this.roleMatches(member.study_role ?? member.role, role))
      ?? team.find((member) => this.roleMatches(member.discipline, role))
      ?? null;
  }

  private fallbackStudySignoffUserId(study: any, role: string) {
    if (this.roleMatches(role, 'HAZOP Leader / Facilitator')) return study.study_leader_id ?? study.facilitator_id ?? null;
    if (this.roleMatches(role, 'Scribe')) return study.scribe_id ?? null;
    if (this.roleMatches(role, 'Plant Manager / Approver')) return study.plant_manager_id ?? study.approver_id ?? null;
    return null;
  }

  private signoffUser(user: any) {
    if (!user) return null;
    const department = user.department;
    return {
      ...user,
      department: typeof department === 'string' ? department : department?.name ?? department?.title ?? null
    };
  }

  private signoffCanBeRepaired(signoff: any, userId: string | null) {
    if (['Signed', 'Rejected', 'Superseded'].includes(String(signoff.status))) return false;
    const assigned = signoff.assigned_user_id ?? signoff.signer_user_id ?? null;
    return !assigned || assigned === userId;
  }

  private signoffNeedsRepair(signoff: any, source: { role: any; userId: any; discipline: any; required: boolean }) {
    return (signoff.signoff_role ?? signoff.signature_role) !== source.role
      || (signoff.assigned_user_id ?? null) !== (source.userId ?? null)
      || (signoff.signer_user_id ?? null) !== (source.userId ?? null)
      || (signoff.discipline ?? null) !== (source.discipline ?? null)
      || signoff.required !== source.required;
  }

  private async signoffRaw(tenantId: string, studyId: string, signoffId: string) {
    const signoff = await this.db.single<any>(this.db.from('hazop_signoffs').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', signoffId).maybeSingle());
    if (!signoff) throw new NotFoundException('Sign-off not found');
    return signoff;
  }

  private csv(rows: unknown[][]) {
    return rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  private hasAnyPermission(permissions: string[], keys: string[]) {
    const granted = new Set(permissions ?? []);
    return keys.some((key) => granted.has(key) || granted.has(key.replace(/\./g, ':')) || granted.has('hazop:manage'));
  }

  private profile(value: any) {
    if (!value) return null;
    const name = value.displayName ?? value.display_name ?? value.name ?? value.external_name ?? value.email ?? 'Unassigned';
    return {
      id: value.id ?? value.user_id ?? null,
      name,
      email: value.email ?? value.external_email ?? null,
      title: value.title ?? value.study_role ?? value.role ?? null,
      initials: String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U'
    };
  }

  private uniqueStrings(values: any[]) {
    return Array.from(new Set(values.flatMap((value) => Array.isArray(value) ? value : [value]).filter(Boolean).map((value) => String(value))));
  }

  private average(values: number[]) {
    const filtered = values.filter((value) => Number.isFinite(value));
    return filtered.length ? Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length) : 0;
  }

  private recommendationPreviewRank(row: any) {
    const riskRank = { Critical: 80, 'Safety Critical': 80, High: 60, Medium: 30, Low: 10 } as Record<string, number>;
    const statusRank = row.overdue ? 50 : ['Open', 'Assigned', 'In Progress', 'Pending Evidence', 'Pending Verification'].includes(row.status) ? 20 : 0;
    return (riskRank[row.priority] ?? 0) + statusRank + (row.closureBlockerActive ? 20 : 0);
  }

  private overviewRiskSnapshot(riskMatrix: any, scenarios: any[]) {
    const levels = Array.isArray(riskMatrix?.matrix?.levels) ? riskMatrix.matrix.levels : [];
    const severityLevels = this.matrixAxis(levels, 'severity_level');
    const likelihoodLevels = this.matrixAxis(levels, 'likelihood_level');
    const cells = likelihoodLevels.flatMap((likelihood) => severityLevels.map((severity) => {
      const level = levels.find((item: any) => Number(item.severity_level) === severity && Number(item.likelihood_level) === likelihood);
      const count = scenarios.filter((scenario) => Number(scenario.severity) === severity && Number(scenario.likelihood) === likelihood).length;
      const fallback = this.calculateRisk(severity, likelihood);
      return {
        severity,
        likelihood,
        count,
        level: level?.risk_level ?? level?.level ?? fallback.level,
        color: level?.risk_color ?? level?.color ?? fallback.color
      };
    }));
    const byLevel: Record<string, number> = this.countBy(scenarios, 'risk_level').reduce((map: Record<string, number>, item: any) => ({ ...map, [item.name]: item.value }), {});
    const residualByLevel: Record<string, number> = this.countBy(scenarios.filter((scenario) => scenario.residual_risk_level), 'residual_risk_level').reduce((map: Record<string, number>, item: any) => ({ ...map, [item.name]: item.value }), {});
    return {
      matrix: riskMatrix?.matrix ?? null,
      source: riskMatrix?.source ?? null,
      residualEnabled: Boolean(riskMatrix?.residualEnabled),
      severityLevels,
      likelihoodLevels,
      cells,
      legend: ['Critical', 'High', 'Medium', 'Low'].map((level) => ({ level, count: Number(byLevel[level] ?? 0), color: this.riskColor(level) })),
      totals: byLevel,
      totalScenarios: scenarios.length,
      highCriticalTotal: Number(byLevel.High ?? 0) + Number(byLevel.Critical ?? 0),
      unrankedScenarios: scenarios.filter((scenario) => !scenario.risk_level).length,
      residualRiskSummary: residualByLevel
    };
  }

  private overviewReadinessCounts(readiness: any) {
    const checks = readiness?.checks ?? [];
    return {
      ready: checks.filter((check: any) => check.status === 'Pass').length,
      atRisk: checks.filter((check: any) => check.status === 'Warning').length,
      blocked: checks.filter((check: any) => check.status === 'Blocked').length,
      notReady: checks.filter((check: any) => !['Pass', 'Warning', 'Blocked'].includes(check.status)).length
    };
  }

  private overviewLinkedCounts(summary: any, rows: any[]) {
    const by = (modules: string[]) => rows.filter((link) => modules.includes(String(link.linked_module ?? link.record_type))).length;
    return [
      { key: 'moc', label: 'MOC', count: Number(summary?.linkedMocs ?? by(['MOC'])), status: 'Linked' },
      { key: 'pssr', label: 'PSSR', count: Number(summary?.linkedPssrs ?? by(['PSSR'])), status: 'Linked' },
      { key: 'ptw', label: 'PTW', count: by(['PTW', 'Permit To Work']), status: 'Linked' },
      { key: 'equipment', label: 'Equipment', count: Number(summary?.linkedEquipment ?? by(['Equipment'])), status: 'Linked' },
      { key: 'documents', label: 'Documents', count: Number(summary?.linkedDocuments ?? by(['Document', 'P&ID', 'SOP'])), status: 'Linked' },
      { key: 'actions', label: 'Actions', count: Number(summary?.linkedActions ?? by(['Universal Action', 'Action'])), status: 'Linked' },
      { key: 'incidents', label: 'Incidents', count: by(['Incident']), status: 'Linked' },
      { key: 'audits', label: 'Audits', count: by(['Audit']), status: 'Linked' },
      { key: 'lopa', label: 'LOPA Pending', count: Number(summary?.lopaRequiredPending ?? by(['LOPA/SIL'])), status: 'Pending' },
      { key: 'previousHazop', label: 'Previous HAZOP', count: by(['Previous HAZOP']), status: 'Linked' },
      { key: 'chemicals', label: 'Chemicals / SDS / PSI', count: by(['Chemical / SDS / PSI']), status: 'Linked' }
    ];
  }

  private async overviewEquipment(tenantId: string, study: any, scope: Scope) {
    const [nodes, linked] = await Promise.all([
      this.safeMany<any>(this.db.from('hazop_nodes').select('equipment_ids').eq('tenant_id', tenantId).eq('study_id', study.id)),
      this.safeMany<any>(this.db.from('hazop_linked_records').select('linked_record_id,equipment_tag,linked_module,record_type').eq('tenant_id', tenantId).eq('study_id', study.id))
    ]);
    const ids = this.uniqueStrings(nodes.flatMap((node) => node.equipment_ids ?? []).concat(linked.filter((row) => ['Equipment'].includes(String(row.linked_module ?? row.record_type))).map((row) => row.linked_record_id)));
    const tags = this.uniqueStrings([...(study.equipment_tags ?? []), ...linked.map((row) => row.equipment_tag)]);
    let rows: any[] = [];
    if (ids.length) rows = rows.concat(await this.safeMany<any>(this.applyScope(this.db.from('Equipment').select('id,tag,name,type,status,criticality,siteId,unitId,areaId').eq('tenantId', tenantId).in('id', ids), scope, 'siteId')));
    if (tags.length) rows = rows.concat(await this.safeMany<any>(this.applyScope(this.db.from('Equipment').select('id,tag,name,type,status,criticality,siteId,unitId,areaId').eq('tenantId', tenantId).in('tag', tags), scope, 'siteId')));
    return Array.from(new Map(rows.map((row) => [row.id, row])).values());
  }

  private overviewEquipmentContext(study: any, nodes: any[], scenarios: any[], equipment: any[]) {
    const nodeCountForEquipment = (equipmentId: string) => nodes.filter((node) => (node.equipment_ids ?? []).includes(equipmentId) || (node.equipment_ids ?? []).includes(equipment.find((item) => item.id === equipmentId)?.tag)).length;
    const scenarioCountForEquipment = (equipmentId: string) => {
      const nodeIds = nodes.filter((node) => (node.equipment_ids ?? []).includes(equipmentId) || (node.equipment_ids ?? []).includes(equipment.find((item) => item.id === equipmentId)?.tag)).map((node) => node.id);
      return scenarios.filter((scenario) => nodeIds.includes(scenario.node_id)).length;
    };
    const rows = equipment.map((item) => ({
      ...item,
      nodeCount: nodeCountForEquipment(item.id),
      scenarioCount: scenarioCountForEquipment(item.id)
    }));
    return {
      processSection: study.process_section ?? null,
      pidReferences: this.uniqueStrings([...(study.pid_references ?? []), ...nodes.flatMap((node) => node.pid_references ?? [])]),
      equipment: rows,
      diagramNodes: rows.slice(0, 8)
    };
  }

  private matrixAxis(levels: any[], key: string) {
    const values = Array.from(new Set(levels.map((level) => Number(level[key])).filter(Boolean))).sort((a, b) => a - b);
    return values.length ? values : [1, 2, 3, 4, 5];
  }

  private riskColor(level: string) {
    if (level === 'Critical') return '#ef4444';
    if (level === 'High') return '#f97316';
    if (level === 'Medium') return '#facc15';
    if (level === 'Low') return '#22c55e';
    return '#64748b';
  }

  private async safeSingle<T>(query: PromiseLike<any>): Promise<T | null> {
    try {
      return await this.db.single<T>(query);
    } catch {
      return null;
    }
  }

  private async safeMany<T>(query: PromiseLike<any>): Promise<T[]> {
    try {
      return await this.db.many<T>(query);
    } catch {
      return [];
    }
  }

  private plusDays(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private countBy(rows: any[], key: string) {
    const map = new Map<string, number>();
    for (const row of rows) map.set(row[key] ?? 'Unknown', (map.get(row[key] ?? 'Unknown') ?? 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }

  private monthTrend(rows: any[]) {
    const map = new Map<string, number>();
    for (const row of rows) {
      const month = String(row.created_at ?? new Date().toISOString()).slice(0, 7);
      map.set(month, (map.get(month) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
  }

  private riskMatrixCells(scenarios: any[]) {
    const cells = new Map<string, { severity: number; likelihood: number; count: number; critical: number; high: number; medium: number; low: number }>();
    for (const scenario of scenarios) {
      const severity = Number(scenario.severity ?? scenario.initial_severity ?? 0);
      const likelihood = Number(scenario.likelihood ?? scenario.initial_likelihood ?? 0);
      if (!severity || !likelihood) continue;
      const key = `${severity}:${likelihood}`;
      const current = cells.get(key) ?? { severity, likelihood, count: 0, critical: 0, high: 0, medium: 0, low: 0 };
      current.count += 1;
      const level = String(scenario.risk_level ?? '').toLowerCase();
      if (level === 'critical') current.critical += 1;
      else if (level === 'high') current.high += 1;
      else if (level === 'medium') current.medium += 1;
      else current.low += 1;
      cells.set(key, current);
    }
    return Array.from(cells.values());
  }
}
