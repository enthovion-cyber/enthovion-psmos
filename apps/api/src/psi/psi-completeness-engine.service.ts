import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type Row = Record<string, any>;

export const completenessStatuses = ['Complete', 'Partially Complete', 'Missing', 'Not Applicable', 'Waived', 'Pending Approval', 'Expired', 'Superseded', 'Review Overdue', 'Conflict', 'Critical Gap', 'PSSR Blocker', 'MOC Required', 'Unknown / Needs Review'];
export const gapTypes = ['Missing Data', 'Missing Document', 'Expired Document', 'Superseded Document', 'Pending Approval', 'Review Overdue', 'Conflict', 'Missing Owner', 'Missing Evidence', 'Missing Safeguard', 'Missing SDS', 'Missing P&ID/PFD', 'Missing Relief Basis', 'Missing SOL', 'Missing Equipment Design Basis', 'Missing Electrical Classification', 'Missing Material Compatibility', 'Source Status Failed', 'Source Status Overdue', 'Bypassed / Impaired', 'MOC Update Required', 'PSSR Blocker', 'Unknown / Needs Review'];
export const gapSeverities = ['Info', 'Low', 'Medium', 'High', 'Critical', 'Startup Blocker'];
export const gapStatuses = ['Open', 'Assigned', 'Action Created', 'In Progress', 'Waiting Review', 'Waiting Document Approval', 'Waiting MOC', 'Waiting PSSR', 'Waiver Requested', 'Waived', 'Resolved', 'Verified', 'Closed', 'Reopened', 'Cancelled'];
export const requirementCategories = ['Unit Profile', 'Chemicals & SDS', 'Process Chemistry', 'Safe Operating Limits', 'Equipment Design Basis', 'Relief Systems', 'Drawings / P&IDs', 'Electrical Classification', 'Material Compatibility', 'Safeguards / Controls', 'Documents', 'Reviews', 'Conflicts', 'MOC Updates', 'PSSR Readiness', 'Audit Evidence'];
export const requirementApplicabilityScopes = ['Company', 'Site', 'Unit', 'Area', 'Equipment', 'Chemical', 'Relief system', 'Drawing', 'Safeguard', 'Material compatibility record', 'Electrical classified area', 'Custom'];
export const waiverStatuses = ['Requested', 'Under Review', 'Approved', 'Rejected', 'Expired', 'Revoked', 'Closed'];
export const runStatuses = ['Queued', 'Running', 'Completed', 'Completed With Warnings', 'Failed', 'Cancelled'];

const moduleDefinitions = [
  { module: 'Unit Profile', category: 'Unit Profile', table: 'psi_units', unitColumn: 'id', title: 'unit_name', number: 'unit_code', requiredTitle: 'Unit profile current and owned', severity: 'High', blocker: true },
  { module: 'Chemicals & SDS', category: 'Chemicals & SDS', table: 'psi_chemicals', unitColumn: 'unit_id', title: 'chemical_name', number: 'chemical_identifier', requiredTitle: 'Chemicals and current SDS linked', severity: 'Critical', blocker: true, documentField: 'sds_status' },
  { module: 'Process Chemistry', category: 'Process Chemistry', table: 'psi_process_chemistry', unitColumn: 'unit_id', title: 'chemistry_title', number: 'chemistry_number', requiredTitle: 'Process chemistry and hazards documented', severity: 'High', blocker: false },
  { module: 'Safe Operating Limits', category: 'Safe Operating Limits', table: 'psi_safe_operating_limits', unitColumn: 'unit_id', title: 'limit_title', number: 'parameter_tag', requiredTitle: 'Safe operating limits documented', severity: 'Critical', blocker: true },
  { module: 'Equipment Design Basis', category: 'Equipment Design Basis', table: 'psi_equipment_design_basis', unitColumn: 'unit_id', title: 'design_basis_title', number: 'equipment_tag', requiredTitle: 'Equipment design basis documented', severity: 'High', blocker: true },
  { module: 'Relief Systems', category: 'Relief Systems', table: 'psi_relief_systems', unitColumn: 'unit_id', title: 'relief_system_title', number: 'relief_system_number', requiredTitle: 'Relief system basis documented', severity: 'Critical', blocker: true },
  { module: 'Drawings / P&IDs', category: 'Drawings / P&IDs', table: 'psi_drawings', unitColumn: 'unit_id', title: 'drawing_title', number: 'drawing_number', requiredTitle: 'Current approved P&IDs/PFDs available', severity: 'Critical', blocker: true },
  { module: 'Electrical Classification', category: 'Electrical Classification', table: 'psi_electrical_classifications', unitColumn: 'unit_id', title: 'classification_title', number: 'classification_record_number', requiredTitle: 'Electrical classification current', severity: 'High', blocker: false },
  { module: 'Material Compatibility', category: 'Material Compatibility', table: 'psi_material_compatibility', unitColumn: 'unit_id', title: 'compatibility_title', number: 'component_type', requiredTitle: 'Material compatibility reviewed', severity: 'High', blocker: false },
  { module: 'Safeguards / Controls', category: 'Safeguards / Controls', table: 'psi_safeguards', unitColumn: 'unit_id', title: 'safeguard_title', number: 'safeguard_tag', requiredTitle: 'Safeguards and controls verified', severity: 'Critical', blocker: true }
];

@Injectable()
export class PsiCompletenessEngineService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(tenantId: string, scope: Scope, query: Row = {}) {
    const [scores, gaps, runs, units, waivers] = await Promise.all([
      this.scores(tenantId, scope, query),
      this.gaps(tenantId, scope, query, false),
      this.safeMany<Row>(this.applyScope(this.db.from('psi_completeness_runs').select('*').eq('company_id', tenantId), scope).order('created_at', { ascending: false }).limit(10)),
      this.safeMany<Row>(this.applyScope(this.db.from('psi_units').select('id,site_id,unit_code,unit_name,completeness_score,completeness_status,pssr_blocker,moc_update_required').eq('company_id', tenantId), scope)),
      this.waivers(tenantId, scope, { status: 'Requested' })
    ]);
    const gapRows = gaps as Row[];
    const latest = runs[0] ?? null;
    const overallScore = this.aggregateScore(scores);
    const moduleSummary = this.moduleDefinitions().map((definition) => {
      const moduleScores = scores.filter((score) => score.score_module === definition.module);
      const moduleGaps = gapRows.filter((gap) => gap.psi_module === definition.module);
      return { module: definition.module, score: this.aggregateScore(moduleScores), gaps: moduleGaps.length, critical: moduleGaps.filter((gap) => ['Critical', 'Startup Blocker'].includes(gap.gap_severity)).length };
    });
    return {
      summary: {
        overallScore,
        scoreStatus: this.scoreStatus(overallScore, gapRows),
        completeUnits: units.filter((unit) => Number(unit.completeness_score ?? 0) >= 90).length,
        incompleteUnits: units.filter((unit) => Number(unit.completeness_score ?? 0) < 90).length,
        unitsWithCriticalGaps: new Set(gapRows.filter((gap) => ['Critical', 'Startup Blocker'].includes(gap.gap_severity)).map((gap) => gap.unit_id).filter(Boolean)).size,
        unitsWithPssrBlockers: new Set(gapRows.filter((gap) => gap.pssr_blocker).map((gap) => gap.unit_id).filter(Boolean)).size,
        unitsWithMocUpdatesRequired: new Set(gapRows.filter((gap) => gap.moc_required).map((gap) => gap.unit_id).filter(Boolean)).size,
        documentGaps: gapRows.filter((gap) => gap.gap_type.includes('Document') || gap.gap_type === 'Missing Evidence').length,
        conflicts: gapRows.filter((gap) => gap.gap_type === 'Conflict').length,
        reviewOverdue: gapRows.filter((gap) => gap.gap_type === 'Review Overdue').length,
        pendingWaivers: waivers.length,
        openActionsFromPsiGaps: gapRows.filter((gap) => gap.action_id && !['Closed', 'Verified'].includes(gap.gap_status)).length,
        lastCompletenessRun: latest?.completed_at ?? latest?.created_at ?? null
      },
      charts: {
        bySite: this.groupScores(scores, 'site_id'),
        byUnit: units.map((unit) => ({ id: unit.id, label: `${unit.unit_code ?? ''} ${unit.unit_name ?? ''}`.trim(), score: Number(unit.completeness_score ?? 0), status: unit.completeness_status })),
        byModule: moduleSummary,
        severityDistribution: this.countBy(gapRows, 'gap_severity'),
        statusDistribution: this.countBy(gapRows, 'gap_status'),
        criticalGapTrend: this.runTrend(runs, 'gaps_created'),
        pssrBlockerTrend: this.runTrend(runs, 'warnings_count'),
        documentGapTrend: this.runTrend(runs, 'errors_count')
      },
      topIncompleteUnits: units.sort((a, b) => Number(a.completeness_score ?? 0) - Number(b.completeness_score ?? 0)).slice(0, 10),
      recurringGapTypes: Object.entries(this.countBy(gapRows, 'gap_type')).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      upcomingReviewDue: gapRows.filter((gap) => gap.gap_type === 'Review Overdue').slice(0, 10),
      waiversExpiringSoon: waivers.filter((waiver) => waiver.expiry_date).slice(0, 10),
      filters: query,
      lastUpdated: new Date().toISOString()
    };
  }

  async matrix(tenantId: string, scope: Scope, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(10, Number(query.limit ?? 50)));
    let request = this.applyScope(this.db.from('psi_completeness_evaluations').select('*').eq('company_id', tenantId), scope);
    if (query.unitId ?? query.unit_id) request = request.eq('unit_id', String(query.unitId ?? query.unit_id));
    if (query.equipmentId ?? query.equipment_id) request = request.eq('equipment_id', String(query.equipmentId ?? query.equipment_id));
    if (query.psiModule) request = request.eq('psi_module', String(query.psiModule));
    if (query.status) request = request.eq('evaluation_status', String(query.status));
    request = request.order('evaluated_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    const rows = await this.safeMany<Row>(request);
    return { rows: rows.map((row) => this.matrixRow(row)), page, limit, lastUpdated: new Date().toISOString() };
  }

  async gaps(tenantId: string, scope: Scope, query: Row = {}, paginate = true) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(10, Number(query.limit ?? 25)));
    let request = this.applyScope(this.db.from('psi_completeness_gaps').select('*').eq('company_id', tenantId), scope);
    if (query.unitId ?? query.unit_id) request = request.eq('unit_id', String(query.unitId ?? query.unit_id));
    if (query.equipmentId ?? query.equipment_id) request = request.eq('equipment_id', String(query.equipmentId ?? query.equipment_id));
    if (query.psiModule) request = request.eq('psi_module', String(query.psiModule));
    if (query.status) request = request.eq('gap_status', String(query.status));
    if (query.severity) request = request.eq('gap_severity', String(query.severity));
    if (query.critical === 'true') request = request.in('gap_severity', ['Critical', 'Startup Blocker']);
    if (query.pssrBlockers === 'true') request = request.eq('pssr_blocker', true);
    if (query.mocRequired === 'true') request = request.eq('moc_required', true);
    if (query.reviewOverdue === 'true') request = request.eq('gap_type', 'Review Overdue');
    if (query.documentGaps === 'true') request = request.in('gap_type', ['Missing Document', 'Expired Document', 'Superseded Document', 'Pending Approval', 'Missing Evidence']);
    if (query.conflicts === 'true') request = request.eq('gap_type', 'Conflict');
    if (query.search) {
      const search = String(query.search).replaceAll('%', '');
      request = request.or(`gap_title.ilike.%${search}%,missing_item.ilike.%${search}%,source_record_title.ilike.%${search}%`);
    }
    request = request.order('last_detected_at', { ascending: false });
    if (paginate) request = request.range((page - 1) * limit, page * limit - 1);
    const rows = await this.safeMany<Row>(request);
    return paginate ? { rows, page, limit, summary: this.gapSummary(rows), lastUpdated: new Date().toISOString() } : rows;
  }

  async gapDetail(tenantId: string, scope: Scope, gapId: string) {
    const gap = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_completeness_gaps').select('*').eq('company_id', tenantId).eq('id', gapId), scope).maybeSingle()), 'PSI completeness gap not found.');
    const [waivers, actions, history] = await Promise.all([
      this.safeMany<Row>(this.db.from('psi_completeness_waivers').select('*').eq('company_id', tenantId).eq('gap_id', gapId).order('created_at', { ascending: false })),
      this.safeMany<Row>(this.db.from('psi_completeness_gap_actions').select('*').eq('company_id', tenantId).eq('gap_id', gapId).order('linked_at', { ascending: false })),
      this.safeMany<Row>(this.db.from('psi_completeness_history_events').select('*').eq('company_id', tenantId).eq('gap_id', gapId).order('created_at', { ascending: false }))
    ]);
    return { gap, waivers, actions, history, evidence: this.evidenceDrilldown(gap) };
  }

  async updateGap(tenantId: string, actorId: string, scope: Scope, gapId: string, dto: Row, eventType = 'psi.completeness.gap.updated') {
    const before = (await this.gapDetail(tenantId, scope, gapId)).gap;
    const patch = this.clean({
      gap_status: dto.gap_status ?? dto.status,
      owner_user_id: dto.owner_user_id ?? dto.ownerUserId,
      due_date: this.dateOrNull(dto.due_date ?? dto.dueDate),
      closure_note: dto.closure_note ?? dto.closureNote ?? dto.reason,
      updated_at: new Date().toISOString()
    });
    if (patch.gap_status === 'Closed' && ['Critical', 'Startup Blocker'].includes(before.gap_severity) && !before.evidence_found && !before.waiver_id) throw new BadRequestException('Critical gaps cannot be closed without evidence or approved waiver.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_completeness_gaps').update(patch).eq('company_id', tenantId).eq('id', gapId).select().single()), 'Unable to update PSI gap.');
    await this.writeHistory(tenantId, actorId, eventType, row, before, row, 'PSI completeness gap updated', dto.reason ?? null);
    return row;
  }

  assignGap(tenantId: string, actorId: string, scope: Scope, gapId: string, dto: Row) {
    return this.updateGap(tenantId, actorId, scope, gapId, { ...dto, status: 'Assigned' }, 'psi.completeness.gap.assigned');
  }

  async createAction(tenantId: string, actorId: string, scope: Scope, gapId: string, dto: Row) {
    const gap = (await this.gapDetail(tenantId, scope, gapId)).gap;
    const actionId = dto.action_id ?? dto.actionId ?? randomUUID();
    const link = this.requireRow(await this.db.single<Row>(this.db.from('psi_completeness_gap_actions').insert({ id: randomUUID(), company_id: tenantId, site_id: gap.site_id, gap_id: gapId, action_id: actionId, action_status: 'Open', action_owner_id: dto.owner_user_id ?? dto.ownerUserId ?? gap.owner_user_id ?? null, linked_by: actorId }).select().single()), 'Unable to link PSI gap action.');
    const row = await this.updateGap(tenantId, actorId, scope, gapId, { status: 'Action Created' }, 'psi.completeness.gap.action_created');
    await this.audit.write({ tenantId, actorId, action: 'psi.completeness.action.created', entityType: 'PSI_COMPLETENESS_GAP', entityId: gapId, after: { actionId, link } as JsonValue }).catch(() => null);
    return { gap: row, action: link };
  }

  markResolved(tenantId: string, actorId: string, scope: Scope, gapId: string, dto: Row) {
    return this.updateGap(tenantId, actorId, scope, gapId, { ...dto, status: 'Resolved' }, 'psi.completeness.gap.resolved');
  }

  async verifyGap(tenantId: string, actorId: string, scope: Scope, gapId: string, dto: Row) {
    const before = (await this.gapDetail(tenantId, scope, gapId)).gap;
    if (!before.evidence_found && !before.waiver_id) throw new BadRequestException('Gap verification requires evidence or approved waiver.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_completeness_gaps').update({ gap_status: 'Verified', verified_at: new Date().toISOString(), verified_by: actorId, closure_note: dto.reason ?? dto.note ?? before.closure_note, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', gapId).select().single()), 'Unable to verify PSI gap.');
    await this.writeHistory(tenantId, actorId, 'psi.completeness.gap.verified', row, before, row, 'PSI completeness gap verified', dto.reason ?? null);
    return row;
  }

  reopenGap(tenantId: string, actorId: string, scope: Scope, gapId: string, dto: Row) {
    return this.updateGap(tenantId, actorId, scope, gapId, { ...dto, status: 'Reopened' }, 'psi.completeness.gap.reopened');
  }

  async requirements(tenantId: string, scope: Scope, query: Row = {}) {
    await this.ensureDefaultRequirements(tenantId, null);
    let request = this.db.from('psi_completeness_requirements').select('*').eq('company_id', tenantId);
    const siteId = query.siteId ?? query.site_id ?? this.selectedSite(scope);
    if (siteId) request = request.or(`site_id.is.null,site_id.eq.${siteId}`);
    if (query.active !== undefined) request = request.eq('active', query.active === 'true' || query.active === true);
    return this.safeMany<Row>(request.order('psi_module').order('requirement_code'));
  }

  async saveRequirement(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const siteId = dto.site_id ?? dto.siteId ?? null;
    if (siteId) this.assertSiteAccess(scope, String(siteId));
    const title = this.requireText(dto.requirement_title ?? dto.requirementTitle ?? dto.requirement_name ?? dto.requirementName, 'Requirement title is required.');
    const code = this.requireText(dto.requirement_code ?? dto.requirementCode ?? this.slug(title), 'Requirement code is required.');
    const payload = this.clean({
      id: dto.id ?? randomUUID(),
      company_id: tenantId,
      site_id: siteId,
      requirement_code: code,
      requirement_title: title,
      requirement_name: title,
      psi_module: this.requireText(dto.psi_module ?? dto.psiModule ?? dto.category, 'PSI module is required.'),
      requirement_category: this.requireText(dto.requirement_category ?? dto.requirementCategory ?? dto.category, 'Requirement category is required.'),
      category: dto.requirement_category ?? dto.requirementCategory ?? dto.category,
      requirement_description: dto.requirement_description ?? dto.requirementDescription ?? null,
      applicability_scope: dto.applicability_scope ?? dto.applicabilityScope ?? dto.scope_type ?? 'Unit',
      scope_type: dto.applicability_scope ?? dto.applicabilityScope ?? dto.scope_type ?? 'Unit',
      applicability_rule_json: dto.applicability_rule_json ?? dto.applicabilityRuleJson ?? dto.required_condition_json ?? null,
      required_condition_json: dto.applicability_rule_json ?? dto.applicabilityRuleJson ?? dto.required_condition_json ?? null,
      required_evidence_type: dto.required_evidence_type ?? dto.requiredEvidenceType ?? null,
      required_source_module: dto.required_source_module ?? dto.requiredSourceModule ?? null,
      required_source_field: dto.required_source_field ?? dto.requiredSourceField ?? null,
      required_document_type: dto.required_document_type ?? dto.requiredDocumentType ?? null,
      required_approval_status: dto.required_approval_status ?? dto.requiredApprovalStatus ?? null,
      required_review_frequency_days: this.numberOrNull(dto.required_review_frequency_days ?? dto.requiredReviewFrequencyDays),
      weight: Math.max(0, Number(dto.weight ?? 1)),
      severity_if_missing: dto.severity_if_missing ?? dto.severityIfMissing ?? dto.severity ?? 'Medium',
      severity: dto.severity_if_missing ?? dto.severityIfMissing ?? dto.severity ?? 'Medium',
      pssr_blocker_if_missing: Boolean(dto.pssr_blocker_if_missing ?? dto.pssrBlockerIfMissing),
      moc_required_if_changed: Boolean(dto.moc_required_if_changed ?? dto.mocRequiredIfChanged),
      action_required_if_missing: Boolean(dto.action_required_if_missing ?? dto.actionRequiredIfMissing),
      waiver_allowed: dto.waiver_allowed ?? dto.waiverAllowed ?? true,
      owner_role: dto.owner_role ?? dto.ownerRole ?? null,
      due_date_rule_json: dto.due_date_rule_json ?? dto.dueDateRuleJson ?? null,
      active: dto.active ?? true,
      is_default_template: Boolean(dto.is_default_template ?? dto.isDefaultTemplate),
      updated_by: actorId,
      updated_at: new Date().toISOString(),
      created_by: dto.created_by ?? actorId
    });
    const before = dto.id ? await this.safeSingle<Row>(this.db.from('psi_completeness_requirements').select('*').eq('company_id', tenantId).eq('id', dto.id).maybeSingle()) : null;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_completeness_requirements').upsert(payload).select().single()), 'Unable to save PSI completeness requirement.');
    await this.writeHistory(tenantId, actorId, 'psi.completeness.requirement.saved', { ...row, site_id: row.site_id }, before, row, 'PSI completeness requirement saved', row.requirement_title);
    return row;
  }

  async requirement(tenantId: string, scope: Scope, requirementId: string) {
    return this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_completeness_requirements').select('*').eq('company_id', tenantId).eq('id', requirementId), scope).maybeSingle()), 'Requirement not found.');
  }

  async archiveRequirement(tenantId: string, actorId: string, scope: Scope, requirementId: string, dto: Row = {}) {
    const before = await this.requirement(tenantId, scope, requirementId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_completeness_requirements').update({ active: false, archived_at: new Date().toISOString(), archived_by: actorId, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', requirementId).select().single()), 'Unable to archive requirement.');
    await this.writeHistory(tenantId, actorId, 'psi.completeness.requirement.archived', row, before, row, 'PSI completeness requirement archived', dto.reason ?? null);
    return row;
  }

  async templates(tenantId: string, scope: Scope) {
    return this.safeMany<Row>(this.db.from('psi_completeness_requirements').select('*').eq('company_id', tenantId).eq('is_default_template', true).order('psi_module'));
  }

  async applyTemplates(tenantId: string, actorId: string, scope: Scope, dto: Row = {}) {
    await this.ensureDefaultRequirements(tenantId, dto.site_id ?? dto.siteId ?? null);
    await this.writeHistory(tenantId, actorId, 'psi.completeness.templates.applied', { site_id: dto.site_id ?? dto.siteId ?? this.selectedSite(scope) }, null, dto, 'PSI completeness templates applied');
    return this.requirements(tenantId, scope, {});
  }

  async run(tenantId: string, actorId: string, scope: Scope, dto: Row = {}) {
    const siteId = dto.siteId ?? dto.site_id ?? this.selectedSite(scope);
    if (siteId) this.assertSiteAccess(scope, String(siteId));
    const run = this.requireRow(await this.db.single<Row>(this.db.from('psi_completeness_runs').insert({ id: randomUUID(), company_id: tenantId, site_id: siteId ?? null, run_scope: dto.runScope ?? dto.run_scope ?? 'Site', scope_record_id: dto.scopeRecordId ?? dto.scope_record_id ?? null, module_filter: dto.moduleFilter ?? dto.module_filter ?? null, requirement_category_filter: dto.requirementCategoryFilter ?? dto.requirement_category_filter ?? null, triggered_by_type: dto.triggeredByType ?? dto.triggered_by_type ?? 'Manual run', triggered_by_user_id: actorId, triggered_by_module: dto.triggeredByModule ?? dto.triggered_by_module ?? null, triggered_by_record_id: dto.triggeredByRecordId ?? dto.triggered_by_record_id ?? null, status: 'Running', started_at: new Date().toISOString() }).select().single()), 'Unable to start PSI completeness run.');
    try {
      await this.ensureDefaultRequirements(tenantId, siteId ?? null);
      const rows = await this.evaluateRun(tenantId, actorId, scope, run, dto);
      const scores = await this.scoreEvaluations(tenantId, actorId, scope, run, rows);
      const gaps = await this.syncGaps(tenantId, actorId, run, rows);
      const completed = this.requireRow(await this.db.single<Row>(this.db.from('psi_completeness_runs').update({ status: gaps.some((gap) => gap.gap_severity === 'Startup Blocker') ? 'Completed With Warnings' : 'Completed', completed_at: new Date().toISOString(), total_requirements: rows.length, evaluated_requirements: rows.length, gaps_created: gaps.filter((gap) => gap.createdInRun).length, gaps_resolved: 0, warnings_count: gaps.filter((gap) => gap.pssr_blocker).length, errors_count: gaps.filter((gap) => gap.gap_severity === 'Critical').length, result_summary_json: { scoreCount: scores.length, gapCount: gaps.length }, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', run.id).select().single()), 'Unable to complete PSI run.');
      await this.writeHistory(tenantId, actorId, 'psi.completeness.run.completed', { ...completed, site_id: completed.site_id }, run, { run: completed, scores, gaps }, 'PSI completeness run completed', `${rows.length} requirements evaluated.`);
      return { run: completed, scores, gaps, dashboard: await this.dashboard(tenantId, scope, {}) };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown PSI completeness run failure.';
      const failed = await this.db.single<Row>(this.db.from('psi_completeness_runs').update({ status: 'Failed', completed_at: new Date().toISOString(), error_message: message, errors_count: 1, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', run.id).select().single()).catch(() => run);
      await this.writeHistory(tenantId, actorId, 'psi.completeness.run.failed', { ...run, site_id: run.site_id }, run, { message }, 'PSI completeness run failed', message);
      return { run: failed, error: message };
    }
  }

  unitCompleteness(tenantId: string, scope: Scope, unitId: string) {
    return this.scopedCompleteness(tenantId, scope, { unitId });
  }

  equipmentCompleteness(tenantId: string, scope: Scope, equipmentId: string) {
    return this.scopedCompleteness(tenantId, scope, { equipmentId });
  }

  async scopedCompleteness(tenantId: string, scope: Scope, target: { unitId?: string; equipmentId?: string }) {
    const query = target.unitId ? { unitId: target.unitId } : { equipmentId: target.equipmentId };
    const [scores, matrix, gaps] = await Promise.all([
      this.scores(tenantId, scope, query),
      this.matrix(tenantId, scope, query),
      this.gaps(tenantId, scope, query, false)
    ]);
    const score = this.aggregateScore(scores);
    return { unitId: target.unitId, equipmentId: target.equipmentId, score, status: this.scoreStatus(score, gaps as Row[]), criticalGapCount: (gaps as Row[]).filter((gap) => ['Critical', 'Startup Blocker'].includes(gap.gap_severity)).length, pssrBlocker: (gaps as Row[]).some((gap) => gap.pssr_blocker), mocUpdateRequired: (gaps as Row[]).some((gap) => gap.moc_required), evaluations: matrix.rows, missingItems: (gaps as Row[]), gaps, scores };
  }

  runUnit(tenantId: string, actorId: string, scope: Scope, unitId: string) {
    return this.run(tenantId, actorId, scope, { runScope: 'Unit', scopeRecordId: unitId, unitId });
  }

  runEquipment(tenantId: string, actorId: string, scope: Scope, equipmentId: string) {
    return this.run(tenantId, actorId, scope, { runScope: 'Equipment', scopeRecordId: equipmentId, equipmentId });
  }

  async runHistory(tenantId: string, scope: Scope, query: Row = {}) {
    let request = this.applyScope(this.db.from('psi_completeness_runs').select('*').eq('company_id', tenantId), scope);
    if (query.status) request = request.eq('status', query.status);
    return this.safeMany<Row>(request.order('created_at', { ascending: false }).limit(100));
  }

  async runDetail(tenantId: string, scope: Scope, runId: string) {
    const run = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_completeness_runs').select('*').eq('company_id', tenantId).eq('id', runId), scope).maybeSingle()), 'PSI completeness run not found.');
    const [evaluations, gaps, scores, history] = await Promise.all([
      this.safeMany<Row>(this.db.from('psi_completeness_evaluations').select('*').eq('company_id', tenantId).eq('run_id', runId)),
      this.safeMany<Row>(this.db.from('psi_completeness_gaps').select('*').eq('company_id', tenantId).eq('run_id', runId)),
      this.safeMany<Row>(this.db.from('psi_completeness_scores').select('*').eq('company_id', tenantId).eq('last_run_id', runId)),
      this.safeMany<Row>(this.db.from('psi_completeness_history_events').select('*').eq('company_id', tenantId).eq('run_id', runId).order('created_at', { ascending: false }))
    ]);
    return { run, evaluations, gaps, scores, history };
  }

  async cancelRun(tenantId: string, actorId: string, scope: Scope, runId: string, dto: Row = {}) {
    const before = (await this.runDetail(tenantId, scope, runId)).run;
    const run = this.requireRow(await this.db.single<Row>(this.db.from('psi_completeness_runs').update({ status: 'Cancelled', completed_at: new Date().toISOString(), error_message: dto.reason ?? null, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', runId).select().single()), 'Unable to cancel run.');
    await this.writeHistory(tenantId, actorId, 'psi.completeness.run.cancelled', { ...run, site_id: run.site_id }, before, run, 'PSI completeness run cancelled', dto.reason ?? null);
    return run;
  }

  retryRun(tenantId: string, actorId: string, scope: Scope, runId: string) {
    return this.runDetail(tenantId, scope, runId).then(({ run }) => this.run(tenantId, actorId, scope, { runScope: run.run_scope, scopeRecordId: run.scope_record_id, siteId: run.site_id, moduleFilter: run.module_filter, requirementCategoryFilter: run.requirement_category_filter, triggeredByType: 'Retry' }));
  }

  async waivers(tenantId: string, scope: Scope, query: Row = {}) {
    let request = this.applyScope(this.db.from('psi_completeness_waivers').select('*').eq('company_id', tenantId), scope);
    if (query.status) request = request.eq('approval_status', String(query.status));
    return this.safeMany<Row>(request.order('created_at', { ascending: false }));
  }

  async requestWaiver(tenantId: string, actorId: string, scope: Scope, gapId: string, dto: Row) {
    const gap = (await this.gapDetail(tenantId, scope, gapId)).gap;
    if (gap.pssr_blocker && !dto.confirmStartupBlockerWaiver) throw new ForbiddenException('PSSR blocker waiver requires special confirmation and permission.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_completeness_waivers').insert({ id: randomUUID(), company_id: tenantId, site_id: gap.site_id, gap_id: gapId, requirement_id: gap.requirement_id ?? null, waiver_type: dto.waiver_type ?? dto.waiverType ?? 'Temporary', waiver_reason: this.requireText(dto.waiver_reason ?? dto.waiverReason ?? dto.reason, 'Waiver reason is required.'), risk_justification: dto.risk_justification ?? dto.riskJustification ?? null, compensating_control: dto.compensating_control ?? dto.compensatingControl ?? null, expiry_date: this.dateOrNull(dto.expiry_date ?? dto.expiryDate), review_date: this.dateOrNull(dto.review_date ?? dto.reviewDate), linked_moc_id: dto.linked_moc_id ?? dto.linkedMocId ?? null, linked_action_id: dto.linked_action_id ?? dto.linkedActionId ?? null, evidence_document_id: dto.evidence_document_id ?? dto.evidenceDocumentId ?? null, approval_status: 'Requested', e_signature_status: dto.e_signature_status ?? dto.eSignatureStatus ?? null, created_by: actorId }).select().single()), 'Unable to request PSI waiver.');
    await this.updateGap(tenantId, actorId, scope, gapId, { status: 'Waiver Requested' }, 'psi.completeness.waiver.requested');
    await this.writeHistory(tenantId, actorId, 'psi.completeness.waiver.requested', { ...gap, site_id: gap.site_id }, null, row, 'PSI completeness waiver requested', row.waiver_reason);
    return row;
  }

  async decideWaiver(tenantId: string, actorId: string, scope: Scope, waiverId: string, decision: 'Approved' | 'Rejected' | 'Revoked', dto: Row = {}) {
    const before = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_completeness_waivers').select('*').eq('company_id', tenantId).eq('id', waiverId), scope).maybeSingle()), 'Waiver not found.');
    const patch = decision === 'Approved'
      ? { approval_status: 'Approved', approved_by: actorId, approved_at: new Date().toISOString() }
      : decision === 'Rejected'
        ? { approval_status: 'Rejected', rejected_by: actorId, rejected_at: new Date().toISOString(), rejection_reason: this.requireText(dto.reason, 'Rejection reason is required.') }
        : { approval_status: 'Revoked', revoked_by: actorId, revoked_at: new Date().toISOString(), revoke_reason: this.requireText(dto.reason, 'Revocation reason is required.') };
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_completeness_waivers').update({ ...patch, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', waiverId).select().single()), 'Unable to update waiver.');
    if (decision === 'Approved') await this.db.single(this.db.from('psi_completeness_gaps').update({ gap_status: 'Waived', waiver_id: waiverId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', row.gap_id).select('id').single()).catch(() => null);
    await this.writeHistory(tenantId, actorId, `psi.completeness.waiver.${decision.toLowerCase()}`, { ...row, site_id: row.site_id }, before, row, `PSI completeness waiver ${decision.toLowerCase()}`, dto.reason ?? null);
    return row;
  }

  async settings(tenantId: string, scope: Scope) {
    const siteId = this.selectedSite(scope);
    let request = this.db.from('psi_completeness_settings').select('*').eq('company_id', tenantId);
    request = siteId ? request.eq('site_id', siteId) : request.is('site_id', null);
    let row = await this.safeSingle<Row>(request.maybeSingle());
    if (!row) row = await this.db.single<Row>(this.db.from('psi_completeness_settings').insert({ id: randomUUID(), company_id: tenantId, site_id: siteId ?? null }).select().single()).catch(() => null);
    return row ?? { company_id: tenantId, site_id: siteId ?? null, scoring_method: 'Weighted requirements', auto_notify_owners: true, auto_create_pssr_blockers: true };
  }

  async updateSettings(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const siteId = dto.site_id ?? dto.siteId ?? this.selectedSite(scope) ?? null;
    if (siteId) this.assertSiteAccess(scope, String(siteId));
    const before = await this.settings(tenantId, { ...scope, selectedSiteId: siteId });
    const payload = this.clean({ id: before.id ?? randomUUID(), company_id: tenantId, site_id: siteId, scoring_method: dto.scoring_method ?? dto.scoringMethod ?? before.scoring_method ?? 'Weighted requirements', critical_gap_score_cap: this.numberOrNull(dto.critical_gap_score_cap ?? dto.criticalGapScoreCap), pssr_blocker_score_cap: this.numberOrNull(dto.pssr_blocker_score_cap ?? dto.pssrBlockerScoreCap), auto_create_actions: Boolean(dto.auto_create_actions ?? dto.autoCreateActions ?? before.auto_create_actions), auto_notify_owners: dto.auto_notify_owners ?? dto.autoNotifyOwners ?? before.auto_notify_owners ?? true, auto_create_pssr_blockers: dto.auto_create_pssr_blockers ?? dto.autoCreatePssrBlockers ?? before.auto_create_pssr_blockers ?? true, allow_critical_waivers: Boolean(dto.allow_critical_waivers ?? dto.allowCriticalWaivers ?? before.allow_critical_waivers), require_esign_for_waiver: dto.require_esign_for_waiver ?? dto.requireEsignForWaiver ?? before.require_esign_for_waiver ?? true, scheduled_run_enabled: Boolean(dto.scheduled_run_enabled ?? dto.scheduledRunEnabled ?? before.scheduled_run_enabled), scheduled_run_frequency: dto.scheduled_run_frequency ?? dto.scheduledRunFrequency ?? before.scheduled_run_frequency ?? null, default_review_frequency_days: this.numberOrNull(dto.default_review_frequency_days ?? dto.defaultReviewFrequencyDays ?? before.default_review_frequency_days), settings_json: dto.settings_json ?? dto.settingsJson ?? before.settings_json ?? null, updated_by: actorId, updated_at: new Date().toISOString() });
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_completeness_settings').upsert(payload, { onConflict: 'company_id,site_id' }).select().single()), 'Unable to save PSI completeness settings.');
    await this.writeHistory(tenantId, actorId, 'psi.completeness.settings.updated', { ...row, site_id: row.site_id }, before, row, 'PSI completeness settings updated');
    return row;
  }

  async export(tenantId: string, actorId: string, scope: Scope, query: Row = {}) {
    const [dashboard, matrix, gaps, waivers, runs] = await Promise.all([this.dashboard(tenantId, scope, query), this.matrix(tenantId, scope, query), this.gaps(tenantId, scope, query), this.waivers(tenantId, scope, query), this.runHistory(tenantId, scope, query)]);
    await this.audit.write({ tenantId, actorId, action: 'psi.completeness.export', entityType: 'PSI_COMPLETENESS', entityId: 'export', after: { rows: matrix.rows.length, gaps: (gaps as any).rows?.length ?? 0 } as JsonValue }).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.completeness.export', { site_id: this.selectedSite(scope) }, null, { matrixRows: matrix.rows.length }, 'PSI completeness exported');
    return { dashboard, matrix, gaps, waivers, runs, formats: ['CSV', 'Excel', 'Critical gap report', 'PSSR blocker report', 'MOC-required PSI gap report', 'Audit-ready PSI completeness package'], exportedAt: new Date().toISOString() };
  }

  reports(tenantId: string, scope: Scope) {
    return this.export(tenantId, 'system', scope, {}).then((data) => ({ reports: [], availableReports: ['PSI completeness report', 'Unit PSI readiness report', 'PSSR PSI readiness package', 'Audit gap report', 'Management summary'], ...data }));
  }

  generateReport(tenantId: string, actorId: string, scope: Scope, dto: Row = {}) {
    return this.export(tenantId, actorId, scope, dto).then((data) => ({ reportId: randomUUID(), status: 'Generated', ...data }));
  }

  async scores(tenantId: string, scope: Scope, query: Row = {}) {
    let request = this.applyScope(this.db.from('psi_completeness_scores').select('*').eq('company_id', tenantId), scope);
    if (query.scoreScope ?? query.score_scope) request = request.eq('score_scope', String(query.scoreScope ?? query.score_scope));
    if (query.unitId ?? query.unit_id) request = request.eq('unit_id', String(query.unitId ?? query.unit_id));
    if (query.equipmentId ?? query.equipment_id) request = request.eq('equipment_id', String(query.equipmentId ?? query.equipment_id));
    if (query.moduleFilter ?? query.psiModule) request = request.eq('score_module', String(query.moduleFilter ?? query.psiModule));
    return this.safeMany<Row>(request.order('evaluated_at', { ascending: false }));
  }

  private async evaluateRun(tenantId: string, actorId: string, scope: Scope, run: Row, dto: Row) {
    const units = await this.targetUnits(tenantId, scope, dto);
    const requirements = await this.requirements(tenantId, scope, { active: true });
    const evaluations: Row[] = [];
    for (const unit of units) {
      for (const requirement of requirements) {
        if (dto.moduleFilter && requirement.psi_module !== dto.moduleFilter) continue;
        const evaluation = await this.evaluateRequirement(tenantId, scope, run, unit, requirement, dto);
        evaluations.push(evaluation);
        await this.db.single<Row>(this.db.from('psi_completeness_evaluations').upsert(evaluation, { onConflict: 'company_id,unit_id,category,requirement_name' }).select().single()).catch(() => null);
      }
    }
    return evaluations;
  }

  private async evaluateRequirement(tenantId: string, scope: Scope, run: Row, unit: Row, requirement: Row, dto: Row) {
    const definition = this.moduleDefinitions().find((item) => item.module === requirement.psi_module) ?? this.moduleDefinitions().find((item) => item.category === requirement.requirement_category);
    const expected = requirement.required_evidence_type ?? requirement.required_document_type ?? requirement.required_source_field ?? requirement.requirement_title;
    let found: Row[] = [];
    if (definition) {
      found = await this.moduleRows(tenantId, scope, definition, unit.id, dto.equipmentId ?? dto.equipment_id);
    }
    const missing = !found.length;
    const bad = found.filter((row) => this.isBadModuleRow(row));
    const status = missing ? 'Missing' : bad.length ? (bad.some((row) => row.pssr_blocker || row.conflict_status === 'Critical Conflict') ? 'Critical Gap' : 'Partially Complete') : 'Complete';
    const severity = status === 'Complete' ? 'Info' : requirement.severity_if_missing ?? requirement.severity ?? definition?.severity ?? 'Medium';
    return this.clean({
      id: randomUUID(),
      company_id: tenantId,
      site_id: unit.site_id,
      unit_id: unit.id,
      area_id: unit.area_id ?? null,
      equipment_id: dto.equipmentId ?? dto.equipment_id ?? null,
      requirement_id: requirement.id,
      run_id: run.id,
      category: requirement.requirement_category ?? requirement.category,
      requirement_name: requirement.requirement_title ?? requirement.requirement_name,
      psi_module: requirement.psi_module ?? requirement.category,
      source_module: definition?.module ?? requirement.required_source_module ?? null,
      source_record_id: found[0]?.id ?? null,
      source_record_title: this.recordTitle(definition, found[0]),
      evaluation_scope: dto.equipmentId ? 'Equipment' : 'Unit',
      evaluation_status: status,
      status,
      severity,
      pssr_blocker: Boolean((requirement.pssr_blocker_if_missing || definition?.blocker) && status !== 'Complete'),
      moc_required: Boolean(requirement.moc_required_if_changed && status !== 'Complete'),
      mi_readiness_impact: Boolean(found.some((row) => row.mi_readiness_impact) || (status !== 'Complete' && ['Equipment Design Basis', 'Relief Systems', 'Safeguards / Controls'].includes(requirement.psi_module))),
      evidence_expected: expected,
      evidence_found: missing ? null : `${found.length} source record(s); ${bad.length} warning(s)`,
      evidence_record_json: found.slice(0, 5),
      message: status === 'Complete' ? 'Requirement complete with source evidence.' : missing ? `${requirement.requirement_title ?? requirement.requirement_name} is missing.` : `${bad.length} source record(s) are incomplete, conflicted, overdue, pending, expired, superseded, bypassed, or impaired.`,
      missing_reason: status === 'Complete' ? null : missing ? 'Required PSI source record is missing.' : 'Source record has completeness, conflict, review, document, or impairment gaps.',
      recommended_action: status === 'Complete' ? null : requirement.action_required_if_missing ? `Create/update ${requirement.psi_module} record and link current approved evidence.` : `Review ${requirement.psi_module} completeness evidence.`,
      owner_user_id: unit.owner_user_id ?? unit.process_owner_id ?? null,
      due_date: this.dueDate(requirement),
      readiness_impact: status === 'Complete' ? null : 'PSI completeness',
      evaluated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  private async syncGaps(tenantId: string, actorId: string, run: Row, evaluations: Row[]) {
    const gaps: Row[] = [];
    for (const evaluation of evaluations) {
      if (['Complete', 'Not Applicable', 'Waived'].includes(evaluation.evaluation_status)) continue;
      const key = { company_id: tenantId, site_id: evaluation.site_id, unit_id: evaluation.unit_id, requirement_id: evaluation.requirement_id, psi_module: evaluation.psi_module };
      const before = await this.safeSingle<Row>(this.db.from('psi_completeness_gaps').select('*').eq('company_id', tenantId).eq('unit_id', evaluation.unit_id).eq('requirement_id', evaluation.requirement_id).eq('psi_module', evaluation.psi_module).neq('gap_status', 'Closed').maybeSingle());
      const gapType = this.gapType(evaluation);
      const payload = this.clean({
        id: before?.id ?? randomUUID(),
        ...key,
        area_id: evaluation.area_id ?? null,
        equipment_id: evaluation.equipment_id ?? null,
        evaluation_id: evaluation.id,
        run_id: run.id,
        gap_title: `${evaluation.psi_module}: ${evaluation.requirement_name}`,
        gap_type: gapType,
        gap_severity: evaluation.pssr_blocker ? 'Startup Blocker' : evaluation.severity === 'Critical' ? 'Critical' : evaluation.severity,
        gap_status: before?.gap_status ?? 'Open',
        source_module: evaluation.source_module ?? null,
        source_record_id: evaluation.source_record_id ?? null,
        source_record_title: evaluation.source_record_title ?? null,
        missing_item: evaluation.requirement_name,
        evidence_expected: evaluation.evidence_expected ?? null,
        evidence_found: evaluation.evidence_found ?? null,
        reason: evaluation.message ?? evaluation.missing_reason ?? null,
        recommended_action: evaluation.recommended_action ?? null,
        pssr_blocker: Boolean(evaluation.pssr_blocker),
        moc_required: Boolean(evaluation.moc_required),
        mi_readiness_impact: Boolean(evaluation.mi_readiness_impact),
        owner_user_id: evaluation.owner_user_id ?? null,
        due_date: evaluation.due_date ?? null,
        first_detected_at: before?.first_detected_at ?? new Date().toISOString(),
        last_detected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_completeness_gaps').upsert(payload).select().single()), 'Unable to save PSI completeness gap.');
      row.createdInRun = !before;
      gaps.push(row);
      await this.writeHistory(tenantId, actorId, before ? 'psi.completeness.gap.updated' : 'psi.completeness.gap.created', row, before, row, before ? 'PSI completeness gap updated' : 'PSI completeness gap created', row.reason);
    }
    return gaps;
  }

  private async scoreEvaluations(tenantId: string, actorId: string, scope: Scope, run: Row, evaluations: Row[]) {
    const groups = new Map<string, Row[]>();
    for (const evaluation of evaluations) {
      const unitKey = `Unit:${evaluation.site_id}:${evaluation.unit_id ?? ''}:all`;
      groups.set(unitKey, [...(groups.get(unitKey) ?? []), evaluation]);
      const moduleKey = `Module:${evaluation.site_id}:${evaluation.unit_id ?? ''}:${evaluation.psi_module}`;
      groups.set(moduleKey, [...(groups.get(moduleKey) ?? []), evaluation]);
    }
    const saved: Row[] = [];
    for (const [key, rows] of groups.entries()) {
      const [scopeName, siteId, unitId, module] = key.split(':');
      const score = this.computeScore(rows);
      const payload = this.clean({ id: randomUUID(), company_id: tenantId, site_id: siteId || null, unit_id: unitId || null, score_scope: scopeName, score_module: module === 'all' ? null : module, total_applicable_requirements: rows.length, complete_count: rows.filter((row) => row.evaluation_status === 'Complete').length, partial_count: rows.filter((row) => row.evaluation_status === 'Partially Complete').length, missing_count: rows.filter((row) => ['Missing', 'Critical Gap', 'PSSR Blocker', 'MOC Required', 'Unknown / Needs Review'].includes(row.evaluation_status)).length, waived_count: rows.filter((row) => row.evaluation_status === 'Waived').length, critical_gap_count: rows.filter((row) => ['Critical', 'Startup Blocker'].includes(row.severity) || row.evaluation_status === 'Critical Gap').length, pssr_blocker_count: rows.filter((row) => row.pssr_blocker).length, conflict_count: rows.filter((row) => this.gapType(row) === 'Conflict').length, review_overdue_count: rows.filter((row) => this.gapType(row) === 'Review Overdue').length, document_gap_count: rows.filter((row) => this.gapType(row).includes('Document')).length, score, score_status: this.scoreStatus(score, rows), blocking_reasons_json: rows.filter((row) => row.evaluation_status !== 'Complete').map((row) => row.message), last_run_id: run.id, evaluated_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      const existing = await this.safeSingle<Row>(this.db.from('psi_completeness_scores').select('id').eq('company_id', tenantId).eq('score_scope', payload.score_scope).eq('site_id', payload.site_id).eq('unit_id', payload.unit_id).eq('score_module', payload.score_module).maybeSingle());
      const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_completeness_scores').upsert({ ...payload, id: existing?.id ?? payload.id }).select().single()), 'Unable to save completeness score.');
      saved.push(row);
      if (payload.score_scope === 'Unit' && payload.unit_id) await this.db.single(this.db.from('psi_units').update({ completeness_score: Number(row.score ?? 0), completeness_status: row.score_status, critical_gap_count: row.critical_gap_count, pssr_blocker: row.pssr_blocker_count > 0, moc_update_required: row.blocking_reasons_json?.some?.((reason: string) => reason.includes('MOC')) ?? false, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', payload.unit_id).select('id').single()).catch(() => null);
    }
    return saved;
  }

  private async targetUnits(tenantId: string, scope: Scope, dto: Row) {
    if (dto.unitId ?? dto.unit_id) return [await this.unitRecord(tenantId, scope, String(dto.unitId ?? dto.unit_id))];
    if (dto.equipmentId ?? dto.equipment_id) {
      const equipmentId = String(dto.equipmentId ?? dto.equipment_id);
      const link = await this.safeSingle<Row>(this.db.from('psi_unit_equipment_links').select('unit_id').eq('company_id', tenantId).eq('equipment_id', equipmentId).maybeSingle());
      if (link?.unit_id) return [await this.unitRecord(tenantId, scope, link.unit_id)];
    }
    let request = this.applyScope(this.db.from('psi_units').select('*').eq('company_id', tenantId).neq('status', 'Archived'), scope);
    return this.safeMany<Row>(request.order('unit_code'));
  }

  private async moduleRows(tenantId: string, scope: Scope, definition: Row, unitId: string, equipmentId?: string) {
    let request = this.applyScope(this.db.from(definition.table).select('*').eq('company_id', tenantId), scope);
    request = request.eq(definition.unitColumn, unitId);
    if (equipmentId) request = request.eq('equipment_id', String(equipmentId));
    return this.safeMany<Row>(request.limit(250));
  }

  private async ensureDefaultRequirements(tenantId: string, siteId: string | null) {
    for (const definition of this.moduleDefinitions()) {
      const exists = await this.safeSingle<Row>(this.db.from('psi_completeness_requirements').select('id').eq('company_id', tenantId).eq('requirement_code', this.slug(definition.requiredTitle)).maybeSingle());
      if (exists) continue;
      await this.db.single(this.db.from('psi_completeness_requirements').insert({ id: randomUUID(), company_id: tenantId, site_id: siteId, requirement_code: this.slug(definition.requiredTitle), requirement_title: definition.requiredTitle, requirement_name: definition.requiredTitle, psi_module: definition.module, requirement_category: definition.category, category: definition.category, requirement_description: `Default completeness requirement for ${definition.module}.`, applicability_scope: 'Unit', scope_type: 'Unit', applicability_rule_json: { appliesTo: 'PSM units' }, required_evidence_type: 'Source record and current evidence', required_source_module: definition.module, weight: definition.blocker ? 2 : 1, severity_if_missing: definition.severity, severity: definition.severity, pssr_blocker_if_missing: definition.blocker, moc_required_if_changed: ['Drawings / P&IDs', 'Safe Operating Limits', 'Safeguards / Controls'].includes(definition.module), action_required_if_missing: true, waiver_allowed: !definition.blocker, owner_role: 'PSI Owner', active: true, is_default_template: true, created_by: 'system', updated_by: 'system' }).select('id').single()).catch(() => null);
    }
  }

  private moduleDefinitions() { return moduleDefinitions; }
  private computeScore(rows: Row[]) { const total = rows.reduce((sum, row) => sum + Number(row.weight ?? 1), 0) || rows.length || 1; const complete = rows.reduce((sum, row) => sum + (row.evaluation_status === 'Complete' ? Number(row.weight ?? 1) : row.evaluation_status === 'Partially Complete' ? Number(row.weight ?? 1) * 0.5 : row.evaluation_status === 'Waived' ? Number(row.weight ?? 1) * 0.8 : 0), 0); let score = Math.round((complete / total) * 10000) / 100; if (rows.some((row) => row.pssr_blocker && row.evaluation_status !== 'Complete')) score = Math.min(score, 74); if (rows.some((row) => row.severity === 'Critical' && row.evaluation_status !== 'Complete')) score = Math.min(score, 89); return score; }
  private scoreStatus(score: number, blockers: Row[]) { if (blockers.some((row) => row.pssr_blocker || row.gap_severity === 'Startup Blocker')) return 'Critical Gaps'; if (score >= 90) return 'Complete / Audit Ready'; if (score >= 75) return 'Mostly Complete'; if (score >= 50) return 'Incomplete'; if (score > 0) return 'Critical Gaps'; return 'No PSI / Not Started'; }
  private isBadModuleRow(row: Row) { return ['Incomplete', 'Critical Gaps', 'Not Reviewed', 'Review Overdue', 'Expired', 'Superseded', 'Pending Approval', 'Conflict', 'Critical Conflict', 'Failed', 'Bypassed', 'Impaired', 'Unknown / Needs Data', 'Unknown / Needs Review'].some((status) => Object.values(row).includes(status)) || Boolean(row.pssr_blocker || row.moc_update_required); }
  private gapType(evaluation: Row) { const text = `${evaluation.message ?? ''} ${evaluation.missing_reason ?? ''} ${evaluation.evaluation_status ?? ''}`; if (text.includes('Document')) return 'Missing Document'; if (text.includes('Review Overdue')) return 'Review Overdue'; if (text.includes('Conflict')) return 'Conflict'; if (text.includes('MOC')) return 'MOC Update Required'; if (evaluation.pssr_blocker) return 'PSSR Blocker'; if (text.includes('SDS')) return 'Missing SDS'; if (text.includes('Safeguard')) return 'Missing Safeguard'; return evaluation.source_record_id ? 'Unknown / Needs Review' : 'Missing Data'; }
  private recordTitle(definition: Row | undefined, row: Row | undefined) { if (!row || !definition) return null; return row[definition.title] ?? row[definition.number] ?? row.id ?? null; }
  private matrixRow(row: Row) { return { ...row, required: true, applicabilityReason: row.evaluation_scope ?? 'Configured requirement applies', status: row.evaluation_status ?? row.status, evidence: { expected: row.evidence_expected, found: row.evidence_found, record: row.evidence_record_json }, sourceModule: row.source_module, sourceRecord: row.source_record_title ?? row.source_record_id, documentStatus: row.evidence_found ? 'Evidence linked/found' : 'Missing evidence', reviewStatus: row.gap_type === 'Review Overdue' ? 'Review Overdue' : 'Current/unknown', conflictStatus: row.evaluation_status === 'Conflict' ? 'Conflict' : 'No conflict detected', mocRequired: row.moc_required, pssrBlocker: row.pssr_blocker, actionStatus: row.action_id ? 'Action Created' : null, waiverStatus: row.waiver_id ? 'Waived' : null, lastEvaluated: row.evaluated_at }; }
  private evidenceDrilldown(gap: Row) { return { expected: gap.evidence_expected, found: gap.evidence_found, sourceModule: gap.source_module, sourceRecordId: gap.source_record_id, sourceRecordTitle: gap.source_record_title, recommendedAction: gap.recommended_action }; }
  private gapSummary(rows: Row[]) { return { total: rows.length, open: rows.filter((row) => ['Open', 'Assigned', 'Action Created', 'In Progress', 'Reopened'].includes(row.gap_status)).length, critical: rows.filter((row) => ['Critical', 'Startup Blocker'].includes(row.gap_severity)).length, pssrBlockers: rows.filter((row) => row.pssr_blocker).length, mocRequired: rows.filter((row) => row.moc_required).length, documentGaps: rows.filter((row) => row.gap_type.includes('Document') || row.gap_type === 'Missing Evidence').length }; }
  private aggregateScore(scores: Row[]) { if (!scores.length) return 0; return Math.round(scores.reduce((sum, item) => sum + Number(item.score ?? 0), 0) / scores.length * 100) / 100; }
  private groupScores(scores: Row[], key: string) { return Object.entries(scores.reduce((acc, score) => ({ ...acc, [score[key] ?? 'Unscoped']: [...(acc[score[key] ?? 'Unscoped'] ?? []), score] }), {} as Record<string, Row[]>)).map(([label, rows]) => ({ label, score: this.aggregateScore(rows), count: rows.length })); }
  private countBy(rows: Row[], key: string) { return rows.reduce((acc, row) => ({ ...acc, [row[key] ?? 'Unknown']: (acc[row[key] ?? 'Unknown'] ?? 0) + 1 }), {} as Record<string, number>); }
  private runTrend(runs: Row[], key: string) { return runs.slice().reverse().map((run) => ({ date: run.completed_at ?? run.created_at, value: Number(run[key] ?? 0), status: run.status })); }
  private dueDate(requirement: Row) { const days = this.numberOrNull(requirement.required_review_frequency_days); if (!days) return null; const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
  private dateOrNull(value: unknown) { if (!value) return null; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10); }
  private numberOrNull(value: unknown) { if (value === null || value === undefined || value === '') return null; const number = Number(value); return Number.isFinite(number) ? number : null; }
  private slug(value: string) { return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, ''); }
  private clean(row: Row) { return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined)); }
  private requireText(value: unknown, message: string) { const text = String(value ?? '').trim(); if (!text) throw new BadRequestException(message); return text; }
  private requireRow<T>(row: T | null | undefined, message: string): T { if (!row) throw new NotFoundException(message); return row; }
  private selectedSite(scope: Scope) { return scope.selectedSiteId ?? scope.allowedSiteIds?.[0] ?? null; }
  private assertSiteAccess(scope: Scope, siteId: string) { if (!siteId) throw new BadRequestException('Site is required.'); if (scope.corporateView || !scope.allowedSiteIds?.length || scope.allowedSiteIds.includes(siteId)) return siteId; throw new ForbiddenException('Selected site is outside your authorized scope.'); }
  private applyScope(query: any, scope: Scope, column = 'site_id') { if (scope.corporateView) return query; if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId); if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds); return query; }
  private async unitRecord(tenantId: string, scope: Scope, unitId: string) { const row = await this.safeSingle<Row>(this.applyScope(this.db.from('psi_units').select('*').eq('company_id', tenantId).eq('id', unitId), scope).maybeSingle()); return this.requireRow(row, 'PSI unit not found or outside your site scope.'); }
  private async safeMany<T>(query: PromiseLike<any>) { try { return await this.db.many<T>(query); } catch { return []; } }
  private async safeSingle<T>(query: PromiseLike<any>) { try { return await this.db.single<T>(query); } catch { return null; } }
  private async writeHistory(tenantId: string, actorId: string | null, eventType: string, scopeRow: Row, before: Row | null, after: Row | null, title: string, description?: string | null) {
    await this.audit.write({ tenantId, actorId: actorId ?? 'system', action: eventType, entityType: 'PSI_COMPLETENESS', entityId: String(scopeRow.id ?? scopeRow.gap_id ?? scopeRow.run_id ?? 'engine'), before: before as JsonValue, after: after as JsonValue }).catch(() => null);
    const event = { id: randomUUID(), company_id: tenantId, site_id: scopeRow.site_id ?? null, unit_id: scopeRow.unit_id ?? null, area_id: scopeRow.area_id ?? null, equipment_id: scopeRow.equipment_id ?? null, gap_id: scopeRow.gap_id ?? (scopeRow.gap_title ? scopeRow.id : null), requirement_id: scopeRow.requirement_id ?? (scopeRow.requirement_title || scopeRow.requirement_name ? scopeRow.id : null), run_id: scopeRow.run_id ?? (scopeRow.run_type ? scopeRow.id : null), event_type: eventType, event_title: title, event_description: description ?? null, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId, source_module: 'PSI Completeness Engine', source_record_id: scopeRow.id ?? null };
    await this.db.single(this.db.from('psi_completeness_history_events').insert(event).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('psi_history_events').insert({ ...event, source_module: 'PSI Completeness Engine' }).select('id').single()).catch(() => null);
  }
}
