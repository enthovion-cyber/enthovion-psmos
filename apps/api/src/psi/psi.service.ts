import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type SiteScope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type PsiUnit = Record<string, any>;

const unitTypes = [
  'Reaction unit',
  'Distillation unit',
  'Storage unit',
  'Utility unit',
  'Waste treatment unit',
  'Loading/unloading unit',
  'Compression unit',
  'Refrigeration unit',
  'Boiler/steam unit',
  'Custom'
];

const unitStatuses = ['Draft', 'Active', 'Inactive', 'Archived', 'Under Review', 'Approved'];
const psiStatuses = ['Draft', 'In Progress', 'Submitted', 'Approved', 'Returned', 'Rejected', 'Archived'];
const completenessCategories = [
  'Chemical hazards / SDS',
  'Process chemistry',
  'Safe operating limits',
  'Consequences of deviation',
  'Maximum intended inventory',
  'PFD / P&ID',
  'Equipment design basis',
  'Relief system design basis',
  'Electrical classification',
  'Material compatibility',
  'Safeguards / controls',
  'SOP / operating procedures',
  'Emergency response info',
  'Required approvals',
  'Required documents'
];

@Injectable()
export class PsiService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(tenantId: string, actorId: string, scope: SiteScope, query: Record<string, any>, permissions: string[] = []) {
    const [summary, registry, missingCritical, reviewOverdue, mocUpdatesRequired, pssrBlockers, recent] = await Promise.all([
      this.summary(tenantId, scope),
      this.units(tenantId, scope, { ...query, limit: query.limit ?? 10 }),
      this.dashboardList(tenantId, scope, { criticalGaps: 'true', limit: 8 }),
      this.dashboardList(tenantId, scope, { reviewOverdue: 'true', limit: 8 }),
      this.dashboardList(tenantId, scope, { mocUpdateRequired: 'true', limit: 8 }),
      this.dashboardList(tenantId, scope, { pssrBlocker: 'true', limit: 8 }),
      this.dashboardList(tenantId, scope, { sort: 'updated_at.desc', limit: 8 })
    ]);
    return {
      header: {
        title: 'Process Safety Information',
        subtitle: 'Technical truth source for process hazards, safe limits, design basis, drawings, safeguards, and readiness',
        activeSiteId: this.selectedSite(scope),
        canCreate: permissions.some((permission) => ['psi.unit.create', 'psi.unit.edit', 'psi:manage'].includes(permission)),
        lastUpdated: new Date().toISOString()
      },
      summary,
      completenessPanel: this.completenessPanel(summary),
      missingCritical,
      reviewOverdue,
      mocUpdatesRequired,
      pssrBlockers,
      recent,
      registry,
      savedViews: ['All Units', 'Complete PSI', 'Incomplete PSI', 'Critical Gaps', 'Review Overdue', 'MOC Update Required', 'PSSR Blockers', 'My Units']
    };
  }

  async summary(tenantId: string, scope: SiteScope) {
    const rows = await this.safeMany<PsiUnit>(this.applyScope(this.db.from('psi_units').select('*').eq('company_id', tenantId), scope).is('archived_at', null));
    const now = new Date();
    const complete = rows.filter((row) => row.completeness_status === 'Complete').length;
    const incomplete = rows.filter((row) => row.completeness_status !== 'Complete').length;
    const reviewOverdue = rows.filter((row) => row.next_review_due && new Date(row.next_review_due) < now && row.review_status !== 'Approved').length;
    return {
      totalProcessUnits: rows.length,
      psiCompleteUnits: complete,
      psiIncompleteUnits: incomplete,
      unitsWithCriticalPsiGaps: rows.filter((row) => Number(row.critical_gap_count ?? 0) > 0).length,
      unitsReviewOverdue: reviewOverdue,
      mocUpdatesRequired: rows.filter((row) => row.moc_update_required).length,
      pssrBlockersFromPsi: rows.filter((row) => row.pssr_blocker).length,
      unitsMissingChemicalsSds: rows.filter((row) => !row.major_chemical_hazards).length,
      unitsMissingProcessChemistry: rows.filter((row) => !row.process_purpose || !row.process_flow_summary).length,
      unitsMissingSafeOperatingLimits: rows.filter((row) => !row.normal_operation_summary).length,
      unitsMissingEquipmentDesignBasis: rows.filter((row) => !row.critical_safeguards_summary).length,
      unitsMissingReliefBasis: rows.filter((row) => !row.pressure_temperature_hazards).length,
      unitsMissingDrawings: rows.filter((row) => row.completeness_status !== 'Complete').length,
      unitsMissingSafeguardBasis: rows.filter((row) => !row.critical_safeguards_summary).length,
      documentsPendingApproval: 0,
      recentlyUpdatedPsi: rows.filter((row) => row.updated_at).sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))).slice(0, 5).length
    };
  }

  async dashboardList(tenantId: string, scope: SiteScope, query: Record<string, any>) {
    const result = await this.units(tenantId, scope, { ...query, page: 1, limit: query.limit ?? 10 });
    return result.rows;
  }

  async units(tenantId: string, scope: SiteScope, query: Record<string, any>) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const sort = String(query.sort ?? 'updated_at.desc');
    const [sortColumn, sortDirection] = sort.split('.');
    let request: any = this.applyScope(this.db.from('psi_units').select('*', { count: 'exact' }).eq('company_id', tenantId), scope);
    if (query.includeArchived !== 'true') request = request.is('archived_at', null);
    if (query.search) request = request.or(`unit_name.ilike.%${query.search}%,unit_code.ilike.%${query.search}%,description.ilike.%${query.search}%`);
    if (query.siteId) request = request.eq('site_id', query.siteId);
    if (query.departmentId) request = request.eq('department_id', query.departmentId);
    if (query.areaId) request = request.eq('area_id', query.areaId);
    if (query.unitType) request = request.eq('unit_type', query.unitType);
    if (query.psiStatus) request = request.eq('psi_status', query.psiStatus);
    if (query.completenessStatus) request = request.eq('completeness_status', query.completenessStatus);
    if (query.ownerId) request = request.eq('psi_owner_id', query.ownerId);
    if (query.reviewStatus) request = request.eq('review_status', query.reviewStatus);
    if (query.mocUpdateRequired === 'true') request = request.eq('moc_update_required', true);
    if (query.pssrBlocker === 'true') request = request.eq('pssr_blocker', true);
    if (query.criticalGaps === 'true') request = request.gt('critical_gap_count', 0);
    if (query.reviewOverdue === 'true') request = request.lt('next_review_due', new Date().toISOString().slice(0, 10)).neq('review_status', 'Approved');
    const { data, error, count } = await request.order(this.safeSortColumn(sortColumn ?? 'updated_at'), { ascending: sortDirection !== 'desc' }).range(from, to);
    if (error) throw new Error(error.message);
    const rows = await this.hydrateUnits(tenantId, data ?? []);
    return { rows, page, limit, total: count ?? rows.length, lastUpdated: new Date().toISOString(), savedViews: ['All Units', 'Complete PSI', 'Incomplete PSI', 'Critical Gaps', 'Review Overdue', 'MOC Update Required', 'PSSR Blockers', 'My Units'], summary: await this.summary(tenantId, scope) };
  }

  async createUnit(tenantId: string, actorId: string, scope: SiteScope, dto: Record<string, any>) {
    const siteId = this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? this.selectedSite(scope) ?? ''));
    this.requireText(dto.unit_name ?? dto.unitName, 'Unit name is required');
    this.requireText(dto.unit_code ?? dto.unitCode, 'Unit code is required');
    await this.validateUnitReferences(tenantId, siteId, dto);
    const duplicate = await this.safeSingle<any>(this.db.from('psi_units').select('id').eq('company_id', tenantId).eq('site_id', siteId).eq('unit_code', dto.unit_code ?? dto.unitCode).maybeSingle());
    if (duplicate) throw new BadRequestException('Unit code must be unique per company/site.');
    const now = new Date().toISOString();
    const row = this.requireDbRow(await this.db.single<PsiUnit>(this.db.from('psi_units').insert(this.unitPayload(tenantId, siteId, actorId, dto, { created_at: now, updated_at: now })).select().single()), 'Unable to create PSI unit.');
    await this.syncLinkedEquipmentFromPayload(tenantId, actorId, scope, row.id, dto);
    await this.writeMutation(tenantId, actorId, 'psi.unit.created', 'PSI_UNIT', row.id, null, row, row.site_id, row.id, 'Unit created', `${row.unit_code} - ${row.unit_name} created.`);
    await this.runCompleteness(tenantId, actorId, scope, row.id);
    return this.unitDetail(tenantId, scope, row.id);
  }

  async updateUnit(tenantId: string, actorId: string, scope: SiteScope, unitId: string, dto: Record<string, any>, permissions: string[] = []) {
    const before = await this.unitRecord(tenantId, scope, unitId);
    if (before.review_status === 'Approved' && !permissions.includes('psi.unit.approve')) {
      throw new ForbiddenException('Approved PSI profiles are read-only unless a controlled edit permission is available.');
    }
    const siteId = this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? before.site_id));
    await this.validateUnitReferences(tenantId, siteId, dto);
    if ((dto.unit_code ?? dto.unitCode) && (dto.unit_code ?? dto.unitCode) !== before.unit_code) {
      const duplicate = await this.safeSingle<any>(this.db.from('psi_units').select('id').eq('company_id', tenantId).eq('site_id', siteId).eq('unit_code', dto.unit_code ?? dto.unitCode).neq('id', unitId).maybeSingle());
      if (duplicate) throw new BadRequestException('Unit code must be unique per company/site.');
    }
    const hazardChanged = ['major_process_hazards', 'major_chemical_hazards', 'critical_safeguards_summary', 'pressure_temperature_hazards'].some((key) => dto[key] !== undefined && dto[key] !== before[key]);
    const patch = this.unitPayload(tenantId, siteId, actorId, dto, { updated_at: new Date().toISOString(), moc_update_required: hazardChanged ? true : before.moc_update_required });
    delete patch.created_by;
    delete patch.created_at;
    const row = this.requireDbRow(await this.db.single<PsiUnit>(this.db.from('psi_units').update(patch).eq('company_id', tenantId).eq('id', unitId).select().single()), 'Unable to update PSI unit.');
    await this.syncLinkedEquipmentFromPayload(tenantId, actorId, scope, row.id, dto);
    await this.writeMutation(tenantId, actorId, 'psi.unit.updated', 'PSI_UNIT', row.id, before, row, row.site_id, row.id, 'Unit profile updated', `${row.unit_code} profile updated.`);
    await this.runCompleteness(tenantId, actorId, scope, row.id);
    return this.unitDetail(tenantId, scope, row.id);
  }

  async archiveUnit(tenantId: string, actorId: string, scope: SiteScope, unitId: string, dto: Record<string, any>) {
    const before = await this.unitRecord(tenantId, scope, unitId);
    if (!dto.reason) throw new BadRequestException('Archive requires a reason.');
    const row = this.requireDbRow(await this.db.single<PsiUnit>(this.db.from('psi_units').update({ archived_at: new Date().toISOString(), archived_by: actorId, archive_reason: dto.reason, psi_status: 'Archived', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', unitId).select().single()), 'Unable to archive PSI unit.');
    await this.writeMutation(tenantId, actorId, 'psi.unit.archived', 'PSI_UNIT', row.id, before, row, row.site_id, row.id, 'Unit archived', dto.reason);
    return row;
  }

  async reactivateUnit(tenantId: string, actorId: string, scope: SiteScope, unitId: string, dto: Record<string, any>) {
    const before = await this.unitRecord(tenantId, scope, unitId);
    const row = this.requireDbRow(await this.db.single<PsiUnit>(this.db.from('psi_units').update({ archived_at: null, archived_by: null, archive_reason: null, psi_status: dto.psi_status ?? 'In Progress', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', unitId).select().single()), 'Unable to reactivate PSI unit.');
    await this.writeMutation(tenantId, actorId, 'psi.unit.reactivated', 'PSI_UNIT', row.id, before, row, row.site_id, row.id, 'Unit reactivated', dto.reason ?? 'PSI unit reactivated.');
    return row;
  }

  async unitDetail(tenantId: string, scope: SiteScope, unitId: string) {
    const unit = await this.unitRecord(tenantId, scope, unitId);
    const [equipment, completeness, linkedRecords, documents, reviews, history] = await Promise.all([
      this.equipmentLinks(tenantId, scope, unitId),
      this.completeness(tenantId, scope, unitId),
      this.linkedRecords(tenantId, scope, unitId),
      this.documents(tenantId, scope, unitId),
      this.safeMany<any>(this.db.from('psi_review_records').select('*').eq('company_id', tenantId).eq('unit_id', unitId).order('created_at', { ascending: false })),
      this.changeHistory(tenantId, scope, { unitId, limit: 20 })
    ]);
    return {
      unit: (await this.hydrateUnits(tenantId, [unit]))[0],
      overview: this.unitOverview(unit, equipment, completeness, linkedRecords, documents),
      equipment,
      completeness,
      linkedRecords,
      documents,
      reviews,
      history: history.rows,
      tabs: this.unitTabs(unit.id)
    };
  }

  async equipmentLinks(tenantId: string, scope: SiteScope, unitId: string) {
    await this.unitRecord(tenantId, scope, unitId);
    const links = await this.safeMany<any>(this.db.from('psi_unit_equipment_links').select('*').eq('company_id', tenantId).eq('unit_id', unitId).order('created_at', { ascending: false }));
    const equipmentIds = links.map((link) => link.equipment_id).filter(Boolean);
    const equipment = equipmentIds.length ? await this.safeMany<any>(this.db.from('Equipment').select('id,tag,name,type,status,criticality,safetyCritical,psmCritical,siteId,unitId,areaId').eq('tenantId', tenantId).in('id', equipmentIds)) : [];
    const byId = new Map(equipment.map((row) => [row.id, row]));
    return links.map((link) => ({ ...link, equipment: byId.get(link.equipment_id) ?? null }));
  }

  async linkEquipment(tenantId: string, actorId: string, scope: SiteScope, unitId: string, dto: Record<string, any>) {
    const unit = await this.unitRecord(tenantId, scope, unitId);
    const equipmentId = this.requireText(dto.equipment_id ?? dto.equipmentId, 'Equipment is required.');
    const equipment = await this.safeSingle<any>(this.db.from('Equipment').select('id,tag,name,siteId,unitId,areaId,criticality,safetyCritical,psmCritical').eq('tenantId', tenantId).eq('id', equipmentId).maybeSingle());
    if (!equipment) throw new NotFoundException('Equipment was not found.');
    if (equipment.siteId !== unit.site_id) throw new BadRequestException('Linked equipment must belong to the same site as the PSI unit.');
    const row = await this.db.single<any>(this.db.from('psi_unit_equipment_links').upsert(this.clean({
      id: dto.id ?? randomUUID(),
      company_id: tenantId,
      site_id: unit.site_id,
      unit_id: unitId,
      equipment_id: equipmentId,
      relationship_type: dto.relationship_type ?? dto.relationshipType ?? dto.link_type ?? dto.linkType ?? 'Unit Equipment',
      critical_to_unit: Boolean(dto.critical_to_unit ?? dto.criticalToUnit ?? dto.safety_critical ?? dto.safetyCritical),
      primary_equipment: Boolean(dto.primary_equipment ?? dto.primaryEquipment),
      relationship_note: dto.relationship_note ?? dto.relationshipNote ?? dto.notes ?? null,
      updated_by: actorId,
      updated_at: new Date().toISOString(),
      created_by: actorId
    }), { onConflict: 'company_id,unit_id,equipment_id' }).select().single());
    await this.writeMutation(tenantId, actorId, 'psi.equipment.linked', 'PSI_UNIT_EQUIPMENT_LINK', row.id, null, row, unit.site_id, unitId, 'Equipment linked', `${equipment.tag ?? equipment.name ?? equipment.id} linked to ${unit.unit_code}.`);
    await this.runCompleteness(tenantId, actorId, scope, unitId);
    return row;
  }

  async updateEquipmentLink(tenantId: string, actorId: string, scope: SiteScope, unitId: string, linkId: string, dto: Record<string, any>) {
    const unit = await this.unitRecord(tenantId, scope, unitId);
    const before = await this.safeSingle<any>(this.db.from('psi_unit_equipment_links').select('*').eq('company_id', tenantId).eq('unit_id', unitId).eq('id', linkId).maybeSingle());
    if (!before) throw new NotFoundException('Equipment link was not found.');
    const patch = this.clean({
      relationship_type: dto.relationship_type ?? dto.relationshipType ?? dto.link_type ?? dto.linkType,
      critical_to_unit: dto.critical_to_unit ?? dto.criticalToUnit ?? dto.safety_critical ?? dto.safetyCritical,
      primary_equipment: dto.primary_equipment ?? dto.primaryEquipment,
      relationship_note: dto.relationship_note ?? dto.relationshipNote ?? dto.notes,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    const row = await this.db.single<any>(this.db.from('psi_unit_equipment_links').update(patch).eq('company_id', tenantId).eq('unit_id', unitId).eq('id', linkId).select().single());
    await this.writeMutation(tenantId, actorId, 'psi.equipment.link.updated', 'PSI_UNIT_EQUIPMENT_LINK', row.id, before, row, unit.site_id, unitId, 'Equipment link updated', `${before.equipment_id} link updated for ${unit.unit_code}.`);
    await this.runCompleteness(tenantId, actorId, scope, unitId);
    return row;
  }

  async unlinkEquipment(tenantId: string, actorId: string, scope: SiteScope, unitId: string, linkId: string) {
    const unit = await this.unitRecord(tenantId, scope, unitId);
    const before = await this.safeSingle<any>(this.db.from('psi_unit_equipment_links').select('*').eq('company_id', tenantId).eq('unit_id', unitId).eq('id', linkId).maybeSingle());
    if (!before) throw new NotFoundException('Equipment link was not found.');
    const row = await this.db.single<any>(this.db.from('psi_unit_equipment_links').delete().eq('company_id', tenantId).eq('id', linkId).select().single());
    await this.writeMutation(tenantId, actorId, 'psi.equipment.unlinked', 'PSI_UNIT_EQUIPMENT_LINK', linkId, before, null, unit.site_id, unitId, 'Equipment unlinked', `${before.equipment_id} unlinked from ${unit.unit_code}.`);
    await this.runCompleteness(tenantId, actorId, scope, unitId);
    return row;
  }

  async completeness(tenantId: string, scope: SiteScope, unitId: string) {
    const unit = await this.unitRecord(tenantId, scope, unitId);
    const evaluations = await this.safeMany<any>(this.db.from('psi_completeness_evaluations').select('*').eq('company_id', tenantId).eq('unit_id', unitId).order('category'));
    return { unitId, score: Number(unit.completeness_score ?? 0), status: unit.completeness_status, criticalGapCount: Number(unit.critical_gap_count ?? 0), pssrBlocker: Boolean(unit.pssr_blocker), mocUpdateRequired: Boolean(unit.moc_update_required), evaluations, missingItems: evaluations.filter((row) => !['Complete', 'Mostly Complete'].includes(row.status)) };
  }

  async runCompleteness(tenantId: string, actorId: string, scope: SiteScope, unitId: string) {
    const unit = await this.unitRecord(tenantId, scope, unitId);
    const requirements = await this.ensureRequirements(tenantId);
    const links = await this.safeMany<any>(this.db.from('psi_unit_equipment_links').select('id,critical_to_unit').eq('company_id', tenantId).eq('unit_id', unitId));
    const docs = await this.safeMany<any>(this.db.from('psi_unit_document_links').select('*').eq('company_id', tenantId).eq('unit_id', unitId).is('removed_at', null));
    const evaluations = requirements.map((req) => this.evaluateRequirement(unit, req, links, docs));
    const completeCount = evaluations.filter((row) => ['Complete', 'Mostly Complete'].includes(row.status)).length;
    const score = requirements.length ? Math.round((completeCount / requirements.length) * 10000) / 100 : 0;
    const criticalGapCount = evaluations.filter((row) => row.status === 'Critical Gaps').length;
    const status = criticalGapCount > 0 ? 'Critical Gaps' : score === 100 ? 'Complete' : score >= 70 ? 'Mostly Complete' : score > 0 ? 'Incomplete' : 'Not Reviewed';
    const pssrBlocker = evaluations.some((row) => row.pssr_blocker && row.status === 'Critical Gaps');
    for (const evaluation of evaluations) {
      await this.safeSingle(this.db.from('psi_completeness_evaluations').upsert(evaluation, { onConflict: 'company_id,unit_id,category,requirement_name' }).select().single());
    }
    const before = unit;
    const updated = await this.db.single<PsiUnit>(this.db.from('psi_units').update({ completeness_score: score, completeness_status: status, critical_gap_count: criticalGapCount, pssr_blocker: pssrBlocker, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', unitId).select().single());
    await this.writeMutation(tenantId, actorId, 'psi.completeness.run', 'PSI_COMPLETENESS', unitId, before, { score, status, criticalGapCount, evaluations }, unit.site_id, unitId, 'Completeness check run', `${unit.unit_code} completeness evaluated at ${score}%.`);
    return this.completeness(tenantId, scope, unitId);
  }

  requirements(tenantId: string, scope: SiteScope) {
    let request: any = this.db.from('psi_completeness_requirements').select('*').eq('company_id', tenantId).eq('active', true);
    const siteId = this.selectedSite(scope);
    if (siteId) request = request.or(`site_id.is.null,site_id.eq.${siteId}`);
    return this.safeMany<any>(request.order('category').order('requirement_name'));
  }

  async saveRequirement(tenantId: string, actorId: string, scope: SiteScope, dto: Record<string, any>) {
    const siteId = dto.site_id ?? dto.siteId ?? null;
    if (siteId) this.assertSiteAccess(scope, String(siteId));
    const payload = {
      id: dto.id ?? randomUUID(),
      company_id: tenantId,
      site_id: siteId,
      requirement_name: this.requireText(dto.requirement_name ?? dto.requirementName, 'Requirement name is required.'),
      category: this.requireText(dto.category, 'Category is required.'),
      scope_type: dto.scope_type ?? dto.scopeType ?? 'unit',
      unit_type: dto.unit_type ?? dto.unitType ?? null,
      required_condition_json: dto.required_condition_json ?? dto.requiredConditionJson ?? null,
      severity: dto.severity ?? 'Medium',
      readiness_impact: dto.readiness_impact ?? dto.readinessImpact ?? null,
      pssr_blocker_if_missing: Boolean(dto.pssr_blocker_if_missing ?? dto.pssrBlockerIfMissing),
      action_required_if_missing: Boolean(dto.action_required_if_missing ?? dto.actionRequiredIfMissing),
      active: dto.active ?? true,
      updated_by: actorId,
      updated_at: new Date().toISOString(),
      created_by: dto.created_by ?? actorId
    };
    const row = await this.db.single<any>(this.db.from('psi_completeness_requirements').upsert(payload).select().single());
    await this.writeMutation(tenantId, actorId, 'psi.completeness.requirement.saved', 'PSI_COMPLETENESS_REQUIREMENT', row.id, null, row, siteId ?? this.selectedSite(scope) ?? '', null, 'Completeness requirement saved', row.requirement_name);
    return row;
  }

  async linkedRecords(tenantId: string, scope: SiteScope, unitId: string) {
    await this.unitRecord(tenantId, scope, unitId);
    return this.safeMany<any>(this.db.from('psi_unit_linked_records').select('*').eq('company_id', tenantId).eq('unit_id', unitId).is('removed_at', null).order('created_at', { ascending: false }));
  }

  async linkRecord(tenantId: string, actorId: string, scope: SiteScope, unitId: string, dto: Record<string, any>) {
    const unit = await this.unitRecord(tenantId, scope, unitId);
    const linkedModule = this.requireText(dto.linked_module ?? dto.linkedModule, 'Linked module is required.');
    const linkedRecordId = this.requireText(dto.linked_record_id ?? dto.linkedRecordId, 'Linked record is required.');
    const row = await this.db.single<any>(this.db.from('psi_unit_linked_records').upsert({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: unit.site_id, unit_id: unitId, linked_module: linkedModule, linked_record_id: linkedRecordId, linked_record_number: dto.linked_record_number ?? dto.linkedRecordNumber ?? null, relationship_type: dto.relationship_type ?? dto.relationshipType ?? 'Reference', readiness_impact: dto.readiness_impact ?? dto.readinessImpact ?? null, created_by: actorId, removed_at: null, removed_by: null, remove_reason: null }, { onConflict: 'company_id,unit_id,linked_module,linked_record_id' }).select().single());
    await this.writeMutation(tenantId, actorId, 'psi.linked_record.linked', 'PSI_LINKED_RECORD', row.id, null, row, unit.site_id, unitId, 'Linked record added', `${linkedModule} record linked to ${unit.unit_code}.`);
    return row;
  }

  async removeLinkedRecord(tenantId: string, actorId: string, scope: SiteScope, unitId: string, linkId: string, dto: Record<string, any>) {
    const unit = await this.unitRecord(tenantId, scope, unitId);
    const before = await this.safeSingle<any>(this.db.from('psi_unit_linked_records').select('*').eq('company_id', tenantId).eq('unit_id', unitId).eq('id', linkId).maybeSingle());
    if (!before) throw new NotFoundException('Linked record was not found.');
    const row = await this.db.single<any>(this.db.from('psi_unit_linked_records').update({ removed_at: new Date().toISOString(), removed_by: actorId, remove_reason: dto.reason ?? 'Removed from PSI unit.' }).eq('company_id', tenantId).eq('id', linkId).select().single());
    await this.writeMutation(tenantId, actorId, 'psi.linked_record.removed', 'PSI_LINKED_RECORD', row.id, before, row, unit.site_id, unitId, 'Linked record removed', row.remove_reason);
    return row;
  }

  async documents(tenantId: string, scope: SiteScope, unitId: string) {
    await this.unitRecord(tenantId, scope, unitId);
    return this.safeMany<any>(this.db.from('psi_unit_document_links').select('*').eq('company_id', tenantId).eq('unit_id', unitId).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async linkDocument(tenantId: string, actorId: string, scope: SiteScope, unitId: string, dto: Record<string, any>) {
    const unit = await this.unitRecord(tenantId, scope, unitId);
    const documentId = this.requireText(dto.document_id ?? dto.documentId, 'Document is required.');
    const document = await this.safeSingle<any>(this.db.from('documents').select('id,document_number,title,document_type,status,revision,site_id').eq('tenant_id', tenantId).eq('id', documentId).maybeSingle());
    if (!document) throw new NotFoundException('Document was not found.');
    if (document.site_id && document.site_id !== unit.site_id) throw new BadRequestException('Linked documents must belong to the same site as the PSI unit.');
    const row = await this.db.single<any>(this.db.from('psi_unit_document_links').upsert({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: unit.site_id, unit_id: unitId, document_id: documentId, document_number: document.document_number ?? null, document_title: document.title ?? null, document_status: document.status ?? null, document_revision: document.revision ?? null, document_type: dto.document_type ?? dto.documentType ?? document.document_type ?? 'Document', relationship_type: dto.relationship_type ?? dto.relationshipType ?? 'Reference', required: Boolean(dto.required), readiness_impact: dto.readiness_impact ?? dto.readinessImpact ?? null, linked_by: actorId, linked_at: new Date().toISOString(), removed_at: null, removed_by: null, remove_reason: null }, { onConflict: 'company_id,unit_id,document_id' }).select().single());
    await this.writeMutation(tenantId, actorId, 'psi.document.linked', 'PSI_DOCUMENT_LINK', row.id, null, row, unit.site_id, unitId, 'Document linked', `${document.document_number ?? document.title ?? document.id} linked to ${unit.unit_code}.`);
    await this.runCompleteness(tenantId, actorId, scope, unitId);
    return row;
  }

  async unlinkDocument(tenantId: string, actorId: string, scope: SiteScope, unitId: string, linkId: string, dto: Record<string, any>) {
    const unit = await this.unitRecord(tenantId, scope, unitId);
    const before = await this.safeSingle<any>(this.db.from('psi_unit_document_links').select('*').eq('company_id', tenantId).eq('unit_id', unitId).eq('id', linkId).maybeSingle());
    if (!before) throw new NotFoundException('Document link was not found.');
    const row = await this.db.single<any>(this.db.from('psi_unit_document_links').update({ removed_at: new Date().toISOString(), removed_by: actorId, remove_reason: dto.reason ?? 'Removed from PSI unit.' }).eq('company_id', tenantId).eq('id', linkId).select().single());
    await this.writeMutation(tenantId, actorId, 'psi.document.removed', 'PSI_DOCUMENT_LINK', row.id, before, row, unit.site_id, unitId, 'Document unlinked', row.remove_reason);
    await this.runCompleteness(tenantId, actorId, scope, unitId);
    return row;
  }

  async submitReview(tenantId: string, actorId: string, scope: SiteScope, unitId: string, dto: Record<string, any>) {
    const unit = await this.unitRecord(tenantId, scope, unitId);
    const missing: string[] = [];
    if (!unit.process_purpose) missing.push('Process purpose');
    if (!unit.psi_owner_id) missing.push('PSI owner');
    if (!unit.review_frequency_value || !unit.review_frequency_unit) missing.push('Review frequency');
    if (missing.length) throw new BadRequestException(`Cannot submit for review. Missing: ${missing.join(', ')}.`);
    const count = await this.safeMany<any>(this.db.from('psi_review_records').select('id').eq('company_id', tenantId).eq('unit_id', unitId));
    const review = await this.db.single<any>(this.db.from('psi_review_records').insert({ id: randomUUID(), company_id: tenantId, site_id: unit.site_id, unit_id: unitId, review_number: `PSI-REV-${String(count.length + 1).padStart(4, '0')}`, review_type: dto.review_type ?? dto.reviewType ?? 'PSI Profile Review', status: 'Submitted', submitted_by: actorId, submitted_at: new Date().toISOString(), created_by: actorId, updated_by: actorId }).select().single());
    const updated = await this.db.single<PsiUnit>(this.db.from('psi_units').update({ review_status: 'Submitted', psi_status: 'Submitted', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', unitId).select().single());
    await this.writeMutation(tenantId, actorId, 'psi.review.submitted', 'PSI_REVIEW', review.id, unit, { review, unit: updated }, unit.site_id, unitId, 'PSI submitted for review', dto.reason ?? `${unit.unit_code} submitted for review.`);
    return { review, unit: updated };
  }

  async decideReview(tenantId: string, actorId: string, scope: SiteScope, reviewId: string, decision: 'Approved' | 'Rejected', dto: Record<string, any>) {
    const review = await this.safeSingle<any>(this.db.from('psi_review_records').select('*').eq('company_id', tenantId).eq('id', reviewId).maybeSingle());
    if (!review) throw new NotFoundException('Review record was not found.');
    const unit = await this.unitRecord(tenantId, scope, review.unit_id);
    if (decision === 'Rejected' && !dto.reason) throw new BadRequestException('Rejected/returned PSI review requires a reason.');
    const patch = decision === 'Approved'
      ? { status: 'Approved', approved_by: actorId, approved_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }
      : { status: 'Rejected', rejected_by: actorId, rejected_at: new Date().toISOString(), rejection_reason: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() };
    const row = await this.db.single<any>(this.db.from('psi_review_records').update(patch).eq('company_id', tenantId).eq('id', reviewId).select().single());
    const unitPatch = decision === 'Approved'
      ? { review_status: 'Approved', psi_status: 'Approved', last_review_date: new Date().toISOString().slice(0, 10), updated_by: actorId, updated_at: new Date().toISOString() }
      : { review_status: 'Rejected', psi_status: 'Returned', updated_by: actorId, updated_at: new Date().toISOString() };
    const updatedUnit = await this.db.single<PsiUnit>(this.db.from('psi_units').update(unitPatch).eq('company_id', tenantId).eq('id', unit.id).select().single());
    await this.writeMutation(tenantId, actorId, `psi.review.${decision.toLowerCase()}`, 'PSI_REVIEW', reviewId, review, row, unit.site_id, unit.id, `PSI review ${decision.toLowerCase()}`, dto.reason ?? `${unit.unit_code} review ${decision.toLowerCase()}.`);
    return { review: row, unit: updatedUnit };
  }

  async changeHistory(tenantId: string, scope: SiteScope, query: Record<string, any>) {
    const limit = Math.min(Number(query.limit ?? 100), 250);
    let request: any = this.applyScope(this.db.from('psi_history_events').select('*').eq('company_id', tenantId), scope);
    if (query.unitId) request = request.eq('unit_id', query.unitId);
    if (query.eventType) request = request.eq('event_type', query.eventType);
    const rows = await this.safeMany<any>(request.order('created_at', { ascending: false }).limit(limit));
    return {
      rows,
      summary: {
        totalEvents: rows.length,
        profileUpdates: rows.filter((row) => String(row.event_type).includes('unit')).length,
        completenessChecks: rows.filter((row) => row.event_type === 'psi.completeness.run').length,
        reviewEvents: rows.filter((row) => String(row.event_type).includes('review')).length
      }
    };
  }

  async equipmentLookup(tenantId: string, scope: SiteScope, search = '') {
    let request: any = this.applyCamelScope(this.db.from('Equipment').select('id,tag,name,type,status,criticality,siteId,unitId,areaId').eq('tenantId', tenantId), scope);
    if (search) request = request.or(`tag.ilike.%${search}%,name.ilike.%${search}%,type.ilike.%${search}%`);
    return this.safeMany<any>(request.order('tag').limit(50));
  }

  async documentLookup(tenantId: string, scope: SiteScope, search = '') {
    let request: any = this.db.from('documents').select('id,document_number,title,document_type,status,revision,site_id').eq('tenant_id', tenantId);
    const siteId = this.selectedSite(scope);
    if (siteId && !scope.corporateView) request = request.eq('site_id', siteId);
    if (search) request = request.or(`document_number.ilike.%${search}%,title.ilike.%${search}%,document_type.ilike.%${search}%`);
    return this.safeMany<any>(request.order('updated_at', { ascending: false }).limit(50));
  }

  async unitFormSites(tenantId: string, scope: SiteScope) {
    let request: any = this.db.from('Site').select('id,name,code').eq('tenantId', tenantId);
    if (!scope.corporateView && scope.allowedSiteIds?.length) request = request.in('id', scope.allowedSiteIds);
    else if (!scope.corporateView && scope.selectedSiteId) request = request.eq('id', scope.selectedSiteId);
    const rows = await this.safeMany<any>(request.order('name'));
    return rows.map((site) => ({ id: site.id, name: site.name, code: site.code ?? site.siteCode ?? null, status: site.status ?? null, label: [site.code, site.name].filter(Boolean).join(' - ') || site.id }));
  }

  async unitFormDepartments(tenantId: string, scope: SiteScope, query: Record<string, any>) {
    const siteId = query.siteId ? this.assertSiteAccess(scope, String(query.siteId)) : null;
    let request: any = this.db.from('Department').select('id,name,code,siteId').eq('tenantId', tenantId);
    if (siteId) request = request.eq('siteId', siteId);
    else if (!scope.corporateView && scope.allowedSiteIds?.length) request = request.in('siteId', scope.allowedSiteIds);
    else if (!scope.corporateView && scope.selectedSiteId) request = request.eq('siteId', scope.selectedSiteId);
    let rows = await this.safeMany<any>(request.order('name').limit(100));
    if (!rows.length) rows = await this.safeMany<any>(this.db.from('Department').select('id,name,code').eq('tenantId', tenantId).order('name').limit(100));
    return rows.map((department) => ({ id: department.id, name: department.name, code: department.code ?? null, siteId: department.siteId ?? null, status: department.status ?? null, label: [department.code, department.name].filter(Boolean).join(' - ') || department.id }));
  }

  async unitFormAreas(tenantId: string, scope: SiteScope, query: Record<string, any>) {
    const siteId = query.siteId ? this.assertSiteAccess(scope, String(query.siteId)) : null;
    let request: any = this.db.from('Area').select('id,name,code,siteId,unitId,departmentId,status').eq('tenantId', tenantId);
    if (siteId) request = request.eq('siteId', siteId);
    else if (!scope.corporateView && scope.allowedSiteIds?.length) request = request.in('siteId', scope.allowedSiteIds);
    else if (!scope.corporateView && scope.selectedSiteId) request = request.eq('siteId', scope.selectedSiteId);
    if (query.departmentId) request = request.eq('departmentId', String(query.departmentId));
    let rows = await this.safeMany<any>(request.order('name').limit(150));
    if (!rows.length) {
      rows = await this.safeMany<any>(this.db.from('Area').select('id,name,code,unitId').eq('tenantId', tenantId).order('name').limit(150));
      const unitIds = [...new Set(rows.map((area) => area.unitId).filter(Boolean))];
      const units = unitIds.length ? await this.safeMany<any>(this.db.from('Unit').select('id,siteId').eq('tenantId', tenantId).in('id', unitIds)) : [];
      const siteByUnit = new Map(units.map((unit) => [unit.id, unit.siteId]));
      rows = rows.map((area) => ({ ...area, siteId: siteByUnit.get(area.unitId) ?? null }));
      if (siteId) rows = rows.filter((area) => area.siteId === siteId);
      else if (!scope.corporateView && scope.allowedSiteIds?.length) rows = rows.filter((area) => area.siteId && scope.allowedSiteIds?.includes(area.siteId));
      else if (!scope.corporateView && scope.selectedSiteId) rows = rows.filter((area) => area.siteId === scope.selectedSiteId);
    }
    return rows.map((area) => ({ id: area.id, name: area.name, code: area.code ?? area.areaCode ?? null, siteId: area.siteId ?? null, departmentId: area.departmentId ?? null, unitId: area.unitId ?? null, status: area.status ?? null, label: [area.code ?? area.areaCode, area.name].filter(Boolean).join(' - ') || area.id }));
  }

  async unitFormUsers(tenantId: string, scope: SiteScope, query: Record<string, any>) {
    const siteId = query.siteId ? this.assertSiteAccess(scope, String(query.siteId)) : null;
    let request: any = this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', tenantId);
    if (siteId) {
      const accessRows = await this.safeMany<any>(this.db.from('UserSite').select('userId').eq('siteId', siteId));
      const userIds = [...new Set(accessRows.map((access) => access.userId).filter(Boolean))];
      if (userIds.length) request = request.in('id', userIds);
    }
    const search = String(query.search ?? '').trim();
    if (search) request = request.or(`displayName.ilike.%${search}%,email.ilike.%${search}%,title.ilike.%${search}%,department.ilike.%${search}%`);
    const rows = await this.safeMany<any>(request.order('displayName').limit(75));
    return rows.map((user) => ({
      id: user.id,
      name: user.displayName ?? user.email ?? user.id,
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      title: user.title ?? null,
      department: user.department ?? null,
      status: user.status ?? null,
      active: ['ACTIVE', 'Active', 'active'].includes(String(user.status ?? '')),
      label: `${user.displayName ?? user.email ?? user.id}${user.email ? ` - ${user.email}` : ''}`
    }));
  }

  async unitFormEquipment(tenantId: string, scope: SiteScope, query: Record<string, any>) {
    const siteId = query.siteId ? this.assertSiteAccess(scope, String(query.siteId)) : this.selectedSite(scope);
    let request: any = this.db.from('Equipment').select('id,tag,name,type,status,criticality,safetyCritical,psmCritical,siteId,unitId,areaId,service,miStatus').eq('tenantId', tenantId);
    if (siteId) request = request.eq('siteId', siteId);
    if (query.areaId) request = request.eq('areaId', String(query.areaId));
    const search = String(query.search ?? '').trim();
    if (search) request = request.or(`tag.ilike.%${search}%,name.ilike.%${search}%,type.ilike.%${search}%,service.ilike.%${search}%`);
    const rows = await this.safeMany<any>(request.order('tag').limit(75));
    return rows.map((equipment) => ({ ...equipment, label: [equipment.tag, equipment.name, equipment.type].filter(Boolean).join(' - ') || equipment.id }));
  }

  unitTypes() { return unitTypes; }
  unitStatuses() { return unitStatuses; }
  psiStatuses() { return psiStatuses; }
  completenessCategories() { return completenessCategories; }

  private async unitRecord(tenantId: string, scope: SiteScope, unitId: string) {
    const row = await this.safeSingle<PsiUnit>(this.applyScope(this.db.from('psi_units').select('*').eq('company_id', tenantId).eq('id', unitId), scope).maybeSingle());
    if (!row) throw new NotFoundException('PSI unit was not found or is outside your site access.');
    return row;
  }

  private async hydrateUnits(tenantId: string, rows: PsiUnit[]) {
    const userIds = [...new Set(rows.flatMap((row) => [row.psi_owner_id, row.process_engineer_id, row.operations_owner_id, row.hse_owner_id, row.document_controller_id, row.mechanical_mi_contact_id, row.electrical_instrument_contact_id, row.relief_specialist_id]).filter(Boolean))];
    const siteIds = [...new Set(rows.map((row) => row.site_id).filter(Boolean))];
    const areaIds = [...new Set(rows.map((row) => row.area_id).filter(Boolean))];
    const [users, sites, areas] = await Promise.all([
      userIds.length ? this.safeMany<any>(this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', tenantId).in('id', userIds)) : [],
      siteIds.length ? this.safeMany<any>(this.db.from('Site').select('id,name,code').eq('tenantId', tenantId).in('id', siteIds)) : [],
      areaIds.length ? this.safeMany<any>(this.db.from('Area').select('id,name,code').eq('tenantId', tenantId).in('id', areaIds)) : []
    ]);
    const userById = new Map(users.map((user) => [user.id, user]));
    const siteById = new Map(sites.map((site) => [site.id, site]));
    const areaById = new Map(areas.map((area) => [area.id, area]));
    return rows.map((row) => ({ ...row, site: siteById.get(row.site_id) ?? null, area: areaById.get(row.area_id) ?? null, owner: userById.get(row.psi_owner_id) ?? null, processEngineer: userById.get(row.process_engineer_id) ?? null, operationsOwner: userById.get(row.operations_owner_id) ?? null, hseOwner: userById.get(row.hse_owner_id) ?? null, documentController: userById.get(row.document_controller_id) ?? null, mechanicalMiContact: userById.get(row.mechanical_mi_contact_id) ?? null, electricalInstrumentContact: userById.get(row.electrical_instrument_contact_id) ?? null, reliefSpecialist: userById.get(row.relief_specialist_id) ?? null }));
  }

  private async ensureRequirements(tenantId: string) {
    const rows = await this.safeMany<any>(this.db.from('psi_completeness_requirements').select('*').eq('company_id', tenantId).eq('active', true));
    if (rows.length) return rows;
    const payload = completenessCategories.map((category) => ({ id: randomUUID(), company_id: tenantId, site_id: null, requirement_name: category, category, severity: ['Chemical hazards / SDS', 'Safe operating limits', 'PFD / P&ID', 'Equipment design basis', 'Relief system design basis', 'Safeguards / controls', 'Required approvals', 'Required documents'].includes(category) ? 'High' : 'Medium', pssr_blocker_if_missing: ['Chemical hazards / SDS', 'Safe operating limits', 'PFD / P&ID', 'Equipment design basis', 'Relief system design basis', 'Safeguards / controls', 'Required approvals', 'Required documents'].includes(category), action_required_if_missing: true, active: true }));
    return this.safeMany<any>(this.db.from('psi_completeness_requirements').insert(payload).select());
  }

  private evaluateRequirement(unit: PsiUnit, req: any, equipmentLinks: any[], documentLinks: any[]) {
    const category = req.category;
    const completed = this.categoryComplete(category, unit, equipmentLinks, documentLinks);
    const critical = !completed && req.severity === 'High';
    return {
      id: randomUUID(),
      company_id: unit.company_id,
      site_id: unit.site_id,
      unit_id: unit.id,
      requirement_id: req.id,
      category,
      requirement_name: req.requirement_name,
      status: completed ? 'Complete' : critical ? 'Critical Gaps' : 'Incomplete',
      severity: req.severity ?? 'Medium',
      missing_reason: completed ? null : this.missingReason(category),
      linked_module: null,
      linked_record_id: null,
      linked_document_id: this.documentForCategory(category, documentLinks)?.document_id ?? null,
      owner_user_id: unit.psi_owner_id ?? null,
      due_date: unit.next_review_due ?? null,
      readiness_impact: req.readiness_impact ?? null,
      pssr_blocker: Boolean(req.pssr_blocker_if_missing && !completed),
      evaluated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private categoryComplete(category: string, unit: PsiUnit, equipmentLinks: any[], documentLinks: any[]) {
    const docTypes = documentLinks.map((doc) => `${doc.document_type ?? ''} ${doc.document_title ?? ''}`.toLowerCase());
    if (category === 'Chemical hazards / SDS') return Boolean(unit.major_chemical_hazards);
    if (category === 'Process chemistry') return Boolean(unit.process_purpose && unit.process_flow_summary);
    if (category === 'Safe operating limits') return Boolean(unit.normal_operation_summary);
    if (category === 'Consequences of deviation') return Boolean(unit.major_process_hazards);
    if (category === 'Maximum intended inventory') return Boolean(unit.main_feed_streams_json || unit.main_product_streams_json);
    if (category === 'PFD / P&ID') return docTypes.some((item) => item.includes('p&id') || item.includes('pid') || item.includes('pfd') || item.includes('drawing'));
    if (category === 'Equipment design basis') return equipmentLinks.length > 0;
    if (category === 'Relief system design basis') return Boolean(unit.pressure_temperature_hazards);
    if (category === 'Electrical classification') return docTypes.some((item) => item.includes('electrical') || item.includes('hazardous area'));
    if (category === 'Material compatibility') return docTypes.some((item) => item.includes('material') || item.includes('compatibility'));
    if (category === 'Safeguards / controls') return Boolean(unit.critical_safeguards_summary);
    if (category === 'SOP / operating procedures') return docTypes.some((item) => item.includes('sop') || item.includes('operating'));
    if (category === 'Emergency response info') return Boolean(unit.emergency_response_notes);
    if (category === 'Required approvals') return unit.review_status === 'Approved';
    if (category === 'Required documents') return documentLinks.length > 0;
    return false;
  }

  private documentForCategory(category: string, documentLinks: any[]) {
    const categoryKey = category.toLowerCase();
    return documentLinks.find((doc) => `${doc.document_type ?? ''} ${doc.document_title ?? ''}`.toLowerCase().includes(categoryKey.split(' ')[0] ?? ''));
  }

  private missingReason(category: string) {
    return `${category} is missing or not linked for this process unit.`;
  }

  private unitOverview(unit: PsiUnit, equipment: any[], completeness: any, linkedRecords: any[], documents: any[]) {
    return {
      cards: {
        completenessScore: completeness.score,
        criticalGaps: completeness.criticalGapCount,
        unitStatus: unit.operating_status,
        reviewStatus: unit.review_status,
        nextReviewDue: unit.next_review_due,
        linkedEquipmentCount: equipment.length,
        criticalEquipmentCount: equipment.filter((link) => link.critical_to_unit || link.equipment?.safetyCritical || link.equipment?.psmCritical).length,
        missingChemicalSdsCount: completeness.evaluations.filter((row: any) => row.category === 'Chemical hazards / SDS' && row.status !== 'Complete').length,
        missingSolCount: completeness.evaluations.filter((row: any) => row.category === 'Safe operating limits' && row.status !== 'Complete').length,
        missingDrawingCount: completeness.evaluations.filter((row: any) => row.category === 'PFD / P&ID' && row.status !== 'Complete').length,
        mocUpdateRequiredCount: unit.moc_update_required ? 1 : 0,
        pssrBlockerCount: unit.pssr_blocker ? 1 : 0,
        linkedRecordsCount: linkedRecords.length,
        documentsCount: documents.length
      },
      blockers: completeness.missingItems,
      readOnly: unit.review_status === 'Approved' || Boolean(unit.archived_at)
    };
  }

  private unitTabs(unitId: string) {
    return [
      { label: 'Overview', href: `/process-safety-information/units/${unitId}`, enabled: true },
      { label: 'PSI Profile', href: `/process-safety-information/units/${unitId}/profile`, enabled: true },
      { label: 'Chemicals & SDS', href: `/process-safety-information/units/${unitId}/chemicals`, enabled: true },
      { label: 'Process Chemistry', href: `/process-safety-information/units/${unitId}/process-chemistry`, enabled: true },
      { label: 'Safe Operating Limits', href: `/process-safety-information/units/${unitId}/safe-operating-limits`, enabled: true },
      { label: 'Equipment Design Basis', href: `/process-safety-information/units/${unitId}/equipment-design`, enabled: true },
      { label: 'Relief Systems', href: `/process-safety-information/units/${unitId}/relief-systems`, enabled: true },
      { label: 'Drawings / P&IDs', href: `/process-safety-information/units/${unitId}/drawings`, enabled: true },
      { label: 'Electrical Classification', href: `/process-safety-information/units/${unitId}/electrical-classification`, enabled: true },
      { label: 'Material Compatibility', href: `/process-safety-information/units/${unitId}/material-compatibility`, enabled: true },
      { label: 'Safeguards / Controls', href: `/process-safety-information/units/${unitId}/safeguards`, enabled: true },
      { label: 'Completeness', href: `/process-safety-information/units/${unitId}/completeness`, enabled: true },
      { label: 'Linked Records', href: `/process-safety-information/units/${unitId}/linked-records`, enabled: true },
      { label: 'Documents', href: `/process-safety-information/units/${unitId}/documents`, enabled: true },
      { label: 'Review & Approval', href: '/process-safety-information/review-approval', enabled: true },
      { label: 'Change History', href: `/process-safety-information/units/${unitId}/change-history`, enabled: true }
    ];
  }

  private completenessPanel(summary: any) {
    const total = summary.totalProcessUnits || 0;
    const score = total ? Math.round((summary.psiCompleteUnits / total) * 100) : 0;
    return { score, status: score === 100 ? 'Complete' : summary.unitsWithCriticalPsiGaps ? 'Critical Gaps' : score >= 70 ? 'Mostly Complete' : 'Incomplete', totalUnits: total };
  }

  private unitPayload(tenantId: string, siteId: string, actorId: string, dto: Record<string, any>, extras: Record<string, any>): Record<string, any> {
    return this.clean({
      company_id: tenantId,
      site_id: siteId,
      department_id: dto.department_id ?? dto.departmentId ?? null,
      area_id: dto.area_id ?? dto.areaId ?? null,
      unit_name: dto.unit_name ?? dto.unitName,
      unit_code: dto.unit_code ?? dto.unitCode,
      unit_type: dto.unit_type ?? dto.unitType ?? 'Custom',
      description: dto.description ?? null,
      operating_status: dto.operating_status ?? dto.operatingStatus ?? 'Draft',
      commissioning_date: this.dateOrNull(dto.commissioning_date ?? dto.commissioningDate),
      building_location: dto.building_location ?? dto.buildingLocation ?? null,
      battery_limits: dto.battery_limits ?? dto.batteryLimits ?? null,
      upstream_units_json: this.arrayJson(dto.upstream_units_json ?? dto.upstreamUnits),
      downstream_units_json: this.arrayJson(dto.downstream_units_json ?? dto.downstreamUnits),
      utilities_connected_json: this.arrayJson(dto.utilities_connected_json ?? dto.utilitiesConnected),
      interfaces_json: this.arrayJson(dto.interfaces_json ?? dto.interfaces),
      process_purpose: dto.process_purpose ?? dto.processPurpose ?? null,
      normal_operation_summary: dto.normal_operation_summary ?? dto.normalOperationSummary ?? null,
      process_flow_summary: dto.process_flow_summary ?? dto.processFlowSummary ?? null,
      main_feed_streams_json: this.arrayJson(dto.main_feed_streams_json ?? dto.mainFeedStreams),
      main_product_streams_json: this.arrayJson(dto.main_product_streams_json ?? dto.mainProductStreams),
      waste_streams_json: this.arrayJson(dto.waste_streams_json ?? dto.wasteStreams),
      utilities_used_json: this.arrayJson(dto.utilities_used_json ?? dto.utilitiesUsed),
      operating_mode: dto.operating_mode ?? dto.operatingMode ?? null,
      startup_shutdown_notes: dto.startup_shutdown_notes ?? dto.startupShutdownNotes ?? null,
      major_process_hazards: dto.major_process_hazards ?? dto.majorProcessHazards ?? null,
      major_chemical_hazards: dto.major_chemical_hazards ?? dto.majorChemicalHazards ?? null,
      fire_explosion_hazards: dto.fire_explosion_hazards ?? dto.fireExplosionHazards ?? null,
      toxicity_hazards: dto.toxicity_hazards ?? dto.toxicityHazards ?? null,
      reactivity_hazards: dto.reactivity_hazards ?? dto.reactivityHazards ?? null,
      pressure_temperature_hazards: dto.pressure_temperature_hazards ?? dto.pressureTemperatureHazards ?? null,
      environmental_hazards: dto.environmental_hazards ?? dto.environmentalHazards ?? null,
      critical_safeguards_summary: dto.critical_safeguards_summary ?? dto.criticalSafeguardsSummary ?? null,
      emergency_response_notes: dto.emergency_response_notes ?? dto.emergencyResponseNotes ?? null,
      psi_owner_id: dto.psi_owner_id ?? dto.psiOwnerId ?? null,
      process_engineer_id: dto.process_engineer_id ?? dto.processEngineerId ?? null,
      operations_owner_id: dto.operations_owner_id ?? dto.operationsOwnerId ?? null,
      hse_owner_id: dto.hse_owner_id ?? dto.hseOwnerId ?? null,
      document_controller_id: dto.document_controller_id ?? dto.documentControllerId ?? null,
      mechanical_mi_contact_id: dto.mechanical_mi_contact_id ?? dto.mechanicalMiContactId ?? null,
      electrical_instrument_contact_id: dto.electrical_instrument_contact_id ?? dto.electricalInstrumentContactId ?? null,
      relief_specialist_id: dto.relief_specialist_id ?? dto.reliefSpecialistId ?? null,
      review_frequency_value: dto.review_frequency_value ?? dto.reviewFrequencyValue ?? null,
      review_frequency_unit: dto.review_frequency_unit ?? dto.reviewFrequencyUnit ?? null,
      last_review_date: this.dateOrNull(dto.last_review_date ?? dto.lastReviewDate),
      next_review_due: this.dateOrNull(dto.next_review_due ?? dto.nextReviewDue),
      review_status: dto.review_status ?? dto.reviewStatus ?? 'Not Reviewed',
      psi_status: dto.psi_status ?? dto.psiStatus ?? 'Draft',
      created_by: actorId,
      updated_by: actorId,
      ...extras
    });
  }

  private async validateUnitReferences(tenantId: string, siteId: string, dto: Record<string, any>) {
    const departmentId = dto.department_id ?? dto.departmentId;
    const areaId = dto.area_id ?? dto.areaId;
    if (departmentId) {
      const department = await this.safeSingle<any>(this.db.from('Department').select('id,siteId').eq('tenantId', tenantId).eq('id', departmentId).maybeSingle())
        ?? await this.safeSingle<any>(this.db.from('Department').select('id').eq('tenantId', tenantId).eq('id', departmentId).maybeSingle());
      if (!department) throw new BadRequestException('Selected department was not found for this company.');
      if (department.siteId && department.siteId !== siteId) throw new BadRequestException('Selected department is outside the selected site.');
    }
    if (areaId) {
      const area = await this.safeSingle<any>(this.db.from('Area').select('id,siteId,departmentId,unitId').eq('tenantId', tenantId).eq('id', areaId).maybeSingle())
        ?? await this.safeSingle<any>(this.db.from('Area').select('id,unitId').eq('tenantId', tenantId).eq('id', areaId).maybeSingle());
      if (!area) throw new BadRequestException('Selected area was not found for this company.');
      if (area.siteId && area.siteId !== siteId) throw new BadRequestException('Selected area is outside the selected site.');
      if (!area.siteId && area.unitId) {
        const unit = await this.safeSingle<any>(this.db.from('Unit').select('id,siteId').eq('tenantId', tenantId).eq('id', area.unitId).maybeSingle());
        if (unit?.siteId && unit.siteId !== siteId) throw new BadRequestException('Selected area is outside the selected site.');
      }
      if (departmentId && area.departmentId && area.departmentId !== departmentId) throw new BadRequestException('Selected area is outside the selected department.');
    }
    const userFields: Array<[string, string, string]> = [
      ['psi_owner_id', 'psiOwnerId', 'PSI owner'],
      ['process_engineer_id', 'processEngineerId', 'Process engineer'],
      ['operations_owner_id', 'operationsOwnerId', 'Operations owner'],
      ['hse_owner_id', 'hseOwnerId', 'HSE/process safety owner'],
      ['document_controller_id', 'documentControllerId', 'Document controller'],
      ['mechanical_mi_contact_id', 'mechanicalMiContactId', 'Mechanical/MI contact'],
      ['electrical_instrument_contact_id', 'electricalInstrumentContactId', 'Electrical/instrument contact'],
      ['relief_specialist_id', 'reliefSpecialistId', 'Relief specialist']
    ];
    for (const [snake, camel, label] of userFields) {
      const userId = dto[snake] ?? dto[camel];
      if (!userId) continue;
      const user = await this.safeSingle<any>(this.db.from('User').select('id,status').eq('tenantId', tenantId).eq('id', userId).maybeSingle());
      if (!user) throw new BadRequestException(`${label} must be an existing IAM/RBAC user in this company.`);
      if (['DISABLED', 'Disabled', 'disabled', 'INACTIVE', 'Inactive', 'inactive'].includes(String(user.status ?? ''))) {
        throw new BadRequestException(`${label} is inactive or disabled and cannot be assigned.`);
      }
    }
  }

  private async syncLinkedEquipmentFromPayload(tenantId: string, actorId: string, scope: SiteScope, unitId: string, dto: Record<string, any>) {
    const links = dto.linkedEquipment ?? dto.linked_equipment ?? dto.equipmentLinks ?? dto.equipment_links;
    if (!Array.isArray(links)) return;
    const seen = new Set<string>();
    for (const link of links) {
      const equipmentId = link?.equipment_id ?? link?.equipmentId ?? link?.id;
      if (!equipmentId || seen.has(String(equipmentId))) continue;
      seen.add(String(equipmentId));
      await this.linkEquipment(tenantId, actorId, scope, unitId, { ...link, equipment_id: equipmentId });
    }
  }

  private applyScope(query: any, scope: SiteScope, column = 'site_id') {
    if (scope.corporateView) return query;
    if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId);
    if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds);
    return query;
  }

  private applyCamelScope(query: any, scope: SiteScope, column = 'siteId') {
    if (scope.corporateView) return query;
    if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId);
    if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds);
    return query;
  }

  private assertSiteAccess(scope: SiteScope, siteId: string) {
    if (!siteId) throw new BadRequestException('Site is required.');
    if (!scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('Selected site is outside your site access.');
    return siteId;
  }

  private selectedSite(scope: SiteScope) {
    return scope.selectedSiteId ?? scope.allowedSiteIds?.[0] ?? null;
  }

  private safeSortColumn(column: string) {
    const allowed = new Set(['updated_at', 'created_at', 'unit_name', 'unit_code', 'next_review_due', 'completeness_score', 'critical_gap_count']);
    return allowed.has(column) ? column : 'updated_at';
  }

  private requireText(value: unknown, message: string) {
    if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(message);
    return value.trim();
  }

  private requireDbRow<T>(row: T | null | undefined, message: string): T {
    if (!row) throw new BadRequestException(message);
    return row;
  }

  private dateOrNull(value: unknown) {
    if (!value) return null;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  }

  private arrayJson(value: unknown) {
    if (value === undefined || value === null || value === '') return null;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
    return value;
  }

  private clean<T extends Record<string, any>>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
  }

  private async safeSingle<T>(query: PromiseLike<any>) {
    try { return await this.db.single<T>(query); } catch { return null; }
  }

  private async safeMany<T>(query: PromiseLike<any>) {
    try { return await this.db.many<T>(query); } catch { return []; }
  }

  private async writeMutation(tenantId: string, actorId: string, action: string, entityType: string, entityId: string | null, before: any, after: any, siteId: string, unitId: string | null, title: string, description?: string | null) {
    const auditInput: { tenantId: string; actorId: string; action: string; entityType: string; entityId?: string; before: JsonValue; after: JsonValue } = {
      tenantId,
      actorId,
      action,
      entityType,
      before: before as JsonValue,
      after: after as JsonValue
    };
    if (entityId) auditInput.entityId = entityId;
    await this.audit.write(auditInput).catch(() => null);
    await this.safeSingle(this.db.from('psi_history_events').insert({
      id: randomUUID(),
      company_id: tenantId,
      site_id: siteId,
      unit_id: unitId,
      event_type: action,
      event_title: title,
      event_description: description ?? null,
      before_value_json: before ?? null,
      after_value_json: after ?? null,
      actor_user_id: actorId,
      source_module: 'PSI',
      source_record_id: entityId,
      created_at: new Date().toISOString()
    }).select().single());
  }
}
