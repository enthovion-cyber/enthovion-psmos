import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../database/supabase.service';
import {
  regulatoryApplicabilityStatuses,
  regulatoryApplicabilityAssessmentMethods,
  regulatoryApplicabilityAssessmentStatuses,
  regulatoryApplicabilityDecisions,
  regulatoryApplicabilityEffects,
  regulatoryApplicabilityGapTypes,
  regulatoryApplicabilityProfileStatuses,
  regulatoryApplicabilityProfileTypes,
  regulatoryApplicabilityQuestionTypes,
  regulatoryAuditCoverageStatuses,
  regulatoryAuditMappingGapTypes,
  regulatoryAuditMappingSourceTypes,
  regulatoryAuditMappingStaleStatuses,
  regulatoryAuditMappingStatuses,
  regulatoryAuditMappingTypes,
  regulatoryAuditTargetTypes,
  regulatoryAuditVerificationStatuses,
  regulatoryActionClosureReadinessStatuses,
  regulatoryActionEffectivenessStatuses,
  regulatoryActionModes,
  regulatoryActionPriorities,
  regulatoryActionSourceTypes,
  regulatoryActionStatuses,
  regulatoryActionSyncStatuses,
  regulatoryActionTypes,
  regulatoryActionVerificationStatuses,
  regulatoryAuthorityStatuses,
  regulatoryAuthorityTypes,
  regulatoryCapaPackageStatuses,
  regulatoryCapaPackageTypes,
  regulatoryCategories,
  regulatoryComplianceAssessmentStatuses,
  regulatoryComplianceCriteriaStatuses,
  regulatoryComplianceEvidenceReadinessStatuses,
  regulatoryComplianceGapSeverities,
  regulatoryComplianceGapStatuses,
  regulatoryComplianceGapTypes,
  regulatoryComplianceSourceTypes,
  regulatoryComplianceStaleStatuses,
  regulatoryComplianceStatuses,
  regulatoryCriticalityLevels,
  regulatoryEvidenceConfidentialityLevels,
  regulatoryEvidenceGapTypes,
  regulatoryEvidenceExpectationStatuses,
  regulatoryEvidencePackageStatuses,
  regulatoryEvidencePackageTypes,
  regulatoryEvidenceReadinessStatuses,
  regulatoryEvidenceRequirementStatuses,
  regulatoryEvidenceReviewStatuses,
  regulatoryEvidenceSourceModules,
  regulatoryEvidenceSourceTypes,
  regulatoryEvidenceStaleStatuses,
  regulatoryEvidenceStatuses,
  regulatoryEvidenceTypes,
  regulatoryJurisdictionLevels,
  regulatoryLinkModules,
  regulatoryModuleMappingStatuses,
  regulatoryObligationApplicabilityStatuses,
  regulatoryObligationCategories,
  regulatoryObligationFrequencies,
  regulatoryObligationGapTypes,
  regulatoryObligationStaleStatuses,
  regulatoryObligationStatuses,
  regulatoryObligationTriggerEvents,
  regulatoryObligationTypes,
  regulatoryRegisterStatuses,
  regulatoryReviewFrequencies,
  regulatoryReviewStatuses,
  regulatorySourceTypes
} from './regulatory.constants';

type Scope = {
  companyId: string;
  selectedSiteId?: string | null | undefined;
  siteIds?: string[] | undefined;
  corporateView?: boolean | undefined;
  isCompanyAdmin?: boolean | undefined;
  isSiteAdmin?: boolean | undefined;
};

type Row = Record<string, any>;

const readOnlyStatuses = new Set(['Archived', 'Superseded', 'Cancelled', 'Approved Foundation']);
const criticalRiskBasisStatuses = new Set(['Critical', 'Safety-Critical', 'Environmental-Critical', 'PSM-Critical', 'Regulatory-Critical']);
const obligationReadOnlyStatuses = new Set(['Archived', 'Superseded', 'Cancelled', 'Approved Foundation']);

@Injectable()
export class RegulatoryService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService, private readonly actions: ActionsService) {}

  async dashboard(userId: string, scope: Scope, query: Row = {}) {
    const register = await this.register(scope, { ...query, limit: 5000 });
    const rows = register.allRows ?? register.rows ?? [];
    const summary = this.summaryFromRows(rows);
    return {
      header: {
        title: 'Regulatory Register',
        subtitle: 'Company and site legal, standard, permit, code, and compliance requirement foundation.',
        generatedAt: new Date().toISOString()
      },
      summary,
      complianceStatusOverview: this.groupRows(rows, 'compliance_status'),
      byJurisdiction: this.groupRows(rows, 'jurisdiction_level'),
      bySite: this.groupRows(rows, 'site_id'),
      byUnit: this.groupRows(rows, 'unit_id'),
      byCategory: this.groupRows(rows, 'category'),
      bySourceType: this.groupRows(rows, 'source_type'),
      byCriticality: this.groupRows(rows, 'criticality'),
      reviewDueSoon: this.reviewDueSoon(rows),
      effectiveSoon: this.effectiveSoon(rows),
      missingOwnerPreview: rows.filter((row) => !row.owner_user_id).slice(0, 8),
      missingApplicabilityPreview: rows.filter((row) => row.applicability_status === 'Not Assessed' || !row.applicability_rationale).slice(0, 8),
      missingEvidencePreview: rows.filter((row) => Number(row.linked_evidence_count ?? 0) === 0).slice(0, 8),
      highRiskPreview: rows.filter((row) => ['High', 'Critical', 'Regulatory-Critical'].includes(row.criticality)).slice(0, 8),
      psmCriticalPreview: rows.filter((row) => row.criticality === 'PSM-Critical' || row.category === 'Process Safety Management').slice(0, 8),
      environmentalCriticalPreview: rows.filter((row) => row.criticality === 'Environmental-Critical' || row.category === 'Environmental Compliance').slice(0, 8),
      auditLinkedPreview: rows.filter((row) => Number(row.linked_audit_count ?? 0) > 0).slice(0, 8),
      recentChanges: rows.slice().sort((a, b) => String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? ''))).slice(0, 10),
      recentlyAdded: rows.slice().sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''))).slice(0, 8),
      recentlyUpdated: rows.slice().sort((a, b) => String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? ''))).slice(0, 8),
      readinessSummary: this.readinessSummary(rows),
      permissions: this.permissionSummary(userId)
    };
  }

  dashboardSummary(scope: Scope, query: Row = {}) {
    return this.register(scope, { ...query, limit: 5000 }).then((data) => this.summaryFromRows(data.allRows ?? data.rows ?? []));
  }

  async dashboardGroup(scope: Scope, field: string, query: Row = {}) {
    const data = await this.register(scope, { ...query, limit: 5000 });
    return { rows: this.groupRows(data.allRows ?? data.rows ?? [], field) };
  }

  async register(scope: Scope, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const allRows = await this.loadItems(scope, query);
    const sorted = this.sortRows(allRows, String(query.sort ?? 'updated_at.desc'));
    const rows = sorted.slice((page - 1) * limit, page * limit);
    return {
      rows,
      allRows: sorted,
      total: sorted.length,
      page,
      limit,
      hasMore: page * limit < sorted.length,
      summary: this.summaryFromRows(sorted)
    };
  }

  summary(scope: Scope, query: Row = {}) {
    return this.dashboardSummary(scope, query);
  }

  async getItem(scope: Scope, id: string): Promise<Row> {
    const row = await this.db.single<Row>(this.db.from('regulatory_register_items').select('*').eq('company_id', scope.companyId).eq('id', id).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Regulatory register item was not found or is outside your company/site scope.');
    return this.enrichItem(row);
  }

  async overview(scope: Scope, id: string) {
    const item = await this.getItem(scope, id);
    const [links, history, jurisdictions, scopes, review] = await Promise.all([
      this.links(scope, id),
      this.itemHistory(scope, id),
      this.itemJurisdictions(scope, id),
      this.itemScopes(scope, id),
      this.reviewFoundation(scope, id)
    ]);
    return {
      item,
      overviewCards: this.overviewCards(item),
      jurisdictions,
      scopes,
      links,
      review,
      historyPreview: history.rows.slice(0, 8),
      readOnly: this.isReadOnly(item),
      readOnlyReason: this.readOnlyReason(item)
    };
  }

  async create(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.item.create');
    const settings = await this.settings(scope);
    const normalized = await this.normalizeInput(scope, dto, 'create');
    this.validateForStatus(normalized, settings);
    const id = crypto.randomUUID();
    const code = normalized.requirement_code || await this.generateCode(scope);
    const now = new Date().toISOString();
    const row = await this.db.single<Row>(this.db.from('regulatory_register_items').insert({
      id,
      company_id: scope.companyId,
      site_id: normalized.site_id ?? scope.selectedSiteId ?? null,
      ...normalized,
      requirement_code: code,
      review_status: this.reviewStatus(normalized),
      created_by: userId,
      updated_by: userId,
      created_at: now,
      updated_at: now
    }).select().single());
    await this.writeMutation(scope, userId, 'Requirement created', row.id, null, row, 'Requirement created');
    return this.overview(scope, row.id);
  }

  async update(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.item.edit');
    const before = await this.getItem(scope, id);
    if (this.isReadOnly(before) && !permissions.includes('regulatory.item.unlock')) throw new ForbiddenException(this.readOnlyReason(before));
    const settings = await this.settings(scope);
    const normalized = await this.normalizeInput(scope, dto, 'update');
    this.validateForStatus({ ...before, ...normalized }, settings);
    const patch = { ...normalized, review_status: this.reviewStatus({ ...before, ...normalized }), updated_by: userId, updated_at: new Date().toISOString() };
    const row = await this.db.single<Row>(this.db.from('regulatory_register_items').update(patch).eq('company_id', scope.companyId).eq('id', id).select().single());
    await this.writeMutation(scope, userId, 'Requirement updated', id, before, row, String(dto.reason ?? 'Requirement updated'));
    return this.overview(scope, id);
  }

  async archive(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.item.archive');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive requires a reason.');
    const before = await this.getItem(scope, id);
    const row = await this.db.single<Row>(this.db.from('regulatory_register_items').update({
      register_status: 'Archived',
      archived_at: new Date().toISOString(),
      archived_by: userId,
      archive_reason: dto.reason,
      updated_by: userId,
      updated_at: new Date().toISOString()
    }).eq('company_id', scope.companyId).eq('id', id).select().single());
    await this.writeMutation(scope, userId, 'Requirement archived', id, before, row, dto.reason);
    return this.overview(scope, id);
  }

  async reactivate(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.item.reactivate');
    const before = await this.getItem(scope, id);
    const row = await this.db.single<Row>(this.db.from('regulatory_register_items').update({
      register_status: dto.registerStatus ?? 'Active',
      archived_at: null,
      archived_by: null,
      archive_reason: null,
      updated_by: userId,
      updated_at: new Date().toISOString()
    }).eq('company_id', scope.companyId).eq('id', id).select().single());
    await this.writeMutation(scope, userId, 'Requirement reactivated', id, before, row, String(dto.reason ?? 'Requirement reactivated'));
    return this.overview(scope, id);
  }

  async lock(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.item.lock');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Lock requires a reason.');
    return this.lockState(userId, scope, id, true, dto.reason);
  }

  async unlock(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.item.unlock');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Unlock requires a reason.');
    return this.lockState(userId, scope, id, false, dto.reason);
  }

  async assignOwner(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.item.assign_owner');
    const ownerId = String(dto.ownerUserId ?? dto.owner_user_id ?? '');
    await this.assertUserInScope(scope, ownerId);
    const before = await this.getItem(scope, id);
    const row = await this.db.single<Row>(this.db.from('regulatory_register_items').update({ owner_user_id: ownerId, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', id).select().single());
    await this.writeMutation(scope, userId, 'Owner changed', id, before, row, String(dto.reason ?? 'Owner assigned'));
    return this.overview(scope, id);
  }

  async changeStatus(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.item.change_status');
    return this.statusPatch(userId, scope, id, { register_status: dto.registerStatus ?? dto.register_status }, dto.reason, 'Register status changed');
  }

  async changeApplicability(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.item.change_applicability');
    const status = dto.applicabilityStatus ?? dto.applicability_status;
    if (status !== 'Not Assessed' && !String(dto.rationale ?? dto.applicabilityRationale ?? '').trim()) throw new BadRequestException('Applicability decision requires a rationale.');
    return this.statusPatch(userId, scope, id, { applicability_status: status, applicability_rationale: dto.rationale ?? dto.applicabilityRationale }, dto.rationale, 'Applicability changed');
  }

  async changeComplianceStatus(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.item.change_compliance_status');
    if (!String(dto.rationale ?? dto.statusRationale ?? '').trim()) throw new BadRequestException('Compliance status change requires a rationale.');
    return this.statusPatch(userId, scope, id, { compliance_status: dto.complianceStatus ?? dto.compliance_status, status_rationale: dto.rationale ?? dto.statusRationale }, dto.rationale, 'Compliance status changed');
  }

  async itemSection(scope: Scope, id: string, section: string) {
    const overview = await this.overview(scope, id);
    return { ...overview, section, placeholder: this.foundationMessage(section) };
  }

  async updateScope(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.scope.manage');
    const before = await this.getItem(scope, id);
    const patch = await this.normalizeInput(scope, dto, 'update');
    const row = await this.db.single<Row>(this.db.from('regulatory_register_items').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', id).select().single());
    await this.writeMutation(scope, userId, 'Scope changed', id, before, row, String(dto.reason ?? 'Scope updated'));
    const settings = await this.settings(scope);
    if (settings.auto_mark_applicability_stale_on_scope_change !== false) {
      await this.markAssessmentsStaleForItem(userId, scope, id, 'Regulatory item scope changed').catch(() => null);
    }
    return this.itemSection(scope, id, 'scope');
  }

  async jurisdictions(scope: Scope, query: Row = {}) {
    let q = this.db.from('regulatory_jurisdictions').select('*').eq('company_id', scope.companyId);
    if (query.includeArchived !== true && query.includeArchived !== 'true') q = q.is('archived_at', null);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.jurisdictionLevel) q = q.eq('jurisdiction_level', query.jurisdictionLevel);
    if (query.country) q = q.eq('country', query.country);
    if (query.stateProvince) q = q.eq('state_province', query.stateProvince);
    if (query.cityMunicipality) q = q.eq('city_municipality', query.cityMunicipality);
    if (query.industrialZone) q = q.eq('industrial_zone', query.industrialZone);
    if (query.jurisdictionStatus) q = q.eq('jurisdiction_status', query.jurisdictionStatus);
    if (query.ownerUserId) q = q.eq('owner_user_id', query.ownerUserId);
    if (query.search) q = q.ilike('jurisdiction_name', `%${query.search}%`);
    return { rows: await this.db.many<Row>(q.order('jurisdiction_name')) };
  }

  async createJurisdiction(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.jurisdiction.create');
    if (!String(dto.jurisdictionName ?? dto.jurisdiction_name ?? '').trim()) throw new BadRequestException('Jurisdiction name is required.');
    if (!String(dto.jurisdictionLevel ?? dto.jurisdiction_level ?? '').trim()) throw new BadRequestException('Jurisdiction level is required.');
    const row = await this.db.single<Row>(this.db.from('regulatory_jurisdictions').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: dto.siteId ?? dto.site_id ?? null,
      jurisdiction_code: dto.jurisdictionCode ?? dto.jurisdiction_code ?? null,
      jurisdiction_name: dto.jurisdictionName ?? dto.jurisdiction_name,
      jurisdiction_level: dto.jurisdictionLevel ?? dto.jurisdiction_level,
      country: dto.country ?? null,
      state_province: dto.stateProvince ?? dto.state_province ?? null,
      city_municipality: dto.cityMunicipality ?? dto.city_municipality ?? null,
      industrial_zone: dto.industrialZone ?? dto.industrial_zone ?? null,
      authority_name: dto.authorityName ?? dto.authority_name ?? null,
      authority_contact_foundation: dto.authorityContactFoundation ?? dto.authority_contact_foundation ?? null,
      language: dto.language ?? null,
      jurisdiction_description: dto.jurisdictionDescription ?? dto.jurisdiction_description ?? null,
      parent_jurisdiction_id: dto.parentJurisdictionId ?? dto.parent_jurisdiction_id ?? null,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? null,
      effective_date: dto.effectiveDate ?? dto.effective_date ?? null,
      review_frequency: dto.reviewFrequency ?? dto.review_frequency ?? null,
      next_review_date: dto.nextReviewDate ?? dto.next_review_date ?? null,
      notes: dto.notes ?? null,
      jurisdiction_status: dto.jurisdictionStatus ?? dto.jurisdiction_status ?? 'Active',
      created_by: userId,
      updated_by: userId
    }).select().single());
    await this.writeMutation(scope, userId, 'Jurisdiction created', null, null, row, 'Jurisdiction created');
    return row;
  }

  async jurisdictionDashboard(scope: Scope, query: Row = {}) {
    const jurisdictions = (await this.jurisdictions(scope, { ...query, includeArchived: true })).rows;
    const authorities = await this.authorities(scope, { limit: 5000 });
    const items = await this.register(scope, { ...query, limit: 5000 });
    return {
      summary: this.jurisdictionSummaryFromRows(jurisdictions, authorities.rows, items.allRows ?? []),
      byLevel: this.groupRows(jurisdictions, 'jurisdiction_level'),
      byCountry: this.groupRows(jurisdictions, 'country'),
      byStatus: this.groupRows(jurisdictions, 'jurisdiction_status'),
      recentlyAdded: jurisdictions.filter((row) => this.withinDays(row.created_at, 30)).slice(0, 8),
      recentlyUpdated: jurisdictions.filter((row) => this.withinDays(row.updated_at, 30)).slice(0, 8)
    };
  }

  async jurisdictionRegister(scope: Scope, query: Row = {}) {
    return this.jurisdictions(scope, query);
  }

  async getJurisdiction(scope: Scope, jurisdictionId: string) {
    const row = await this.db.single<Row>(this.db.from('regulatory_jurisdictions').select('*').eq('company_id', scope.companyId).eq('id', jurisdictionId).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Jurisdiction was not found or is outside your company/site scope.');
    return row;
  }

  async updateJurisdiction(userId: string, scope: Scope, jurisdictionId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.jurisdiction.edit');
    const before = await this.getJurisdiction(scope, jurisdictionId);
    const patch = this.pickMapped(dto, {
      jurisdictionCode: 'jurisdiction_code',
      jurisdiction_code: 'jurisdiction_code',
      jurisdictionName: 'jurisdiction_name',
      jurisdiction_name: 'jurisdiction_name',
      jurisdictionLevel: 'jurisdiction_level',
      jurisdiction_level: 'jurisdiction_level',
      country: 'country',
      stateProvince: 'state_province',
      state_province: 'state_province',
      cityMunicipality: 'city_municipality',
      city_municipality: 'city_municipality',
      industrialZone: 'industrial_zone',
      industrial_zone: 'industrial_zone',
      authorityName: 'authority_name',
      authority_name: 'authority_name',
      jurisdictionDescription: 'jurisdiction_description',
      jurisdiction_description: 'jurisdiction_description',
      ownerUserId: 'owner_user_id',
      owner_user_id: 'owner_user_id',
      jurisdictionStatus: 'jurisdiction_status',
      jurisdiction_status: 'jurisdiction_status',
      notes: 'notes'
    });
    const row = await this.db.single<Row>(this.db.from('regulatory_jurisdictions').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', jurisdictionId).select().single());
    await this.writeMutation(scope, userId, 'Jurisdiction updated', null, before, row, String(dto.reason ?? 'Jurisdiction updated'));
    return row;
  }

  async archiveJurisdiction(userId: string, scope: Scope, jurisdictionId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.jurisdiction.archive');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive requires a reason.');
    const before = await this.getJurisdiction(scope, jurisdictionId);
    const row = await this.db.single<Row>(this.db.from('regulatory_jurisdictions').update({ jurisdiction_status: 'Archived', archived_at: new Date().toISOString(), archived_by: userId, archive_reason: dto.reason, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', jurisdictionId).select().single());
    await this.writeMutation(scope, userId, 'Jurisdiction archived', null, before, row, dto.reason);
    return row;
  }

  async reactivateJurisdiction(userId: string, scope: Scope, jurisdictionId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.jurisdiction.reactivate');
    const before = await this.getJurisdiction(scope, jurisdictionId);
    const row = await this.db.single<Row>(this.db.from('regulatory_jurisdictions').update({ jurisdiction_status: 'Active', archived_at: null, archived_by: null, archive_reason: null, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', jurisdictionId).select().single());
    await this.writeMutation(scope, userId, 'Jurisdiction reactivated', null, before, row, String(dto.reason ?? 'Jurisdiction reactivated'));
    return row;
  }

  async jurisdictionAuthorities(scope: Scope, jurisdictionId: string) {
    await this.getJurisdiction(scope, jurisdictionId);
    const rows = await this.db.many<Row>(this.db.from('regulatory_jurisdiction_authorities').select('*,authority:regulatory_authorities(*)').eq('company_id', scope.companyId).eq('jurisdiction_id', jurisdictionId).is('removed_at', null).order('linked_at', { ascending: false }));
    return { rows };
  }

  async jurisdictionSites(scope: Scope, jurisdictionId: string) {
    await this.getJurisdiction(scope, jurisdictionId);
    const rows = await this.db.many<Row>(this.db.from('regulatory_jurisdiction_site_links').select('*').eq('company_id', scope.companyId).eq('jurisdiction_id', jurisdictionId).is('removed_at', null));
    return { rows };
  }

  async jurisdictionRegisterItems(scope: Scope, jurisdictionId: string) {
    await this.getJurisdiction(scope, jurisdictionId);
    const rows = await this.db.many<Row>(this.db.from('regulatory_item_jurisdictions').select('*,item:regulatory_register_items(*)').eq('company_id', scope.companyId).eq('jurisdiction_id', jurisdictionId).is('removed_at', null));
    return { rows: rows.map((row) => row.item ?? row).filter((row) => row && this.canAccessSite(scope, row.site_id)) };
  }

  async jurisdictionApplicability(scope: Scope, jurisdictionId: string) {
    await this.getJurisdiction(scope, jurisdictionId);
    return this.applicabilityAssessments(scope, { jurisdictionId });
  }

  async jurisdictionHistory(scope: Scope, jurisdictionId: string) {
    await this.getJurisdiction(scope, jurisdictionId);
    const rows = await this.db.many<Row>(this.db.from('regulatory_history_events').select('*').eq('company_id', scope.companyId).contains('after_value_json', { id: jurisdictionId }).order('created_at', { ascending: false }).limit(100)).catch(() => []);
    return { rows };
  }

  async authorities(scope: Scope, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    let q = this.db.from('regulatory_authorities').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.authorityType) q = q.eq('authority_type', query.authorityType);
    if (query.authorityStatus) q = q.eq('authority_status', query.authorityStatus);
    if (query.search) q = q.or(`authority_name.ilike.%${query.search}%,authority_code.ilike.%${query.search}%`);
    const allRows = await this.db.many<Row>(q.order('updated_at', { ascending: false }));
    const rows = allRows.slice((page - 1) * limit, page * limit);
    return { rows, allRows, total: allRows.length, page, limit, summary: { total: allRows.length, active: allRows.filter((row) => row.authority_status === 'Active').length, archived: allRows.filter((row) => row.authority_status === 'Archived').length } };
  }

  async createAuthority(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.authority.create');
    if (!String(dto.authorityName ?? dto.authority_name ?? '').trim()) throw new BadRequestException('Authority name is required.');
    if (!String(dto.authorityType ?? dto.authority_type ?? '').trim()) throw new BadRequestException('Authority type is required.');
    const row = await this.db.single<Row>(this.db.from('regulatory_authorities').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: dto.siteId ?? dto.site_id ?? null,
      authority_code: dto.authorityCode ?? dto.authority_code ?? null,
      authority_name: dto.authorityName ?? dto.authority_name,
      authority_type: dto.authorityType ?? dto.authority_type,
      jurisdiction_level: dto.jurisdictionLevel ?? dto.jurisdiction_level ?? null,
      country: dto.country ?? null,
      state_province: dto.stateProvince ?? dto.state_province ?? null,
      city_municipality: dto.cityMunicipality ?? dto.city_municipality ?? null,
      website_url: dto.websiteUrl ?? dto.website_url ?? null,
      contact_foundation_json: dto.contactFoundationJson ?? dto.contact_foundation_json ?? null,
      inspection_authority: Boolean(dto.inspectionAuthority ?? dto.inspection_authority),
      permit_authority: Boolean(dto.permitAuthority ?? dto.permit_authority),
      enforcement_authority: Boolean(dto.enforcementAuthority ?? dto.enforcement_authority),
      notes: dto.notes ?? null,
      authority_status: dto.authorityStatus ?? dto.authority_status ?? 'Active',
      created_by: userId,
      updated_by: userId
    }).select().single());
    await this.writeMutation(scope, userId, 'Authority created', null, null, row, 'Authority created');
    return row;
  }

  async getAuthority(scope: Scope, authorityId: string) {
    const row = await this.db.single<Row>(this.db.from('regulatory_authorities').select('*').eq('company_id', scope.companyId).eq('id', authorityId).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Authority was not found or is outside your company/site scope.');
    return row;
  }

  async updateAuthority(userId: string, scope: Scope, authorityId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.authority.edit');
    const before = await this.getAuthority(scope, authorityId);
    const patch = this.pickMapped(dto, {
      authorityCode: 'authority_code', authority_code: 'authority_code',
      authorityName: 'authority_name', authority_name: 'authority_name',
      authorityType: 'authority_type', authority_type: 'authority_type',
      jurisdictionLevel: 'jurisdiction_level', jurisdiction_level: 'jurisdiction_level',
      country: 'country', stateProvince: 'state_province', state_province: 'state_province',
      cityMunicipality: 'city_municipality', city_municipality: 'city_municipality',
      websiteUrl: 'website_url', website_url: 'website_url',
      contactFoundationJson: 'contact_foundation_json', contact_foundation_json: 'contact_foundation_json',
      inspectionAuthority: 'inspection_authority', inspection_authority: 'inspection_authority',
      permitAuthority: 'permit_authority', permit_authority: 'permit_authority',
      enforcementAuthority: 'enforcement_authority', enforcement_authority: 'enforcement_authority',
      notes: 'notes', authorityStatus: 'authority_status', authority_status: 'authority_status'
    });
    const row = await this.db.single<Row>(this.db.from('regulatory_authorities').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', authorityId).select().single());
    await this.writeMutation(scope, userId, 'Authority updated', null, before, row, String(dto.reason ?? 'Authority updated'));
    return row;
  }

  async archiveAuthority(userId: string, scope: Scope, authorityId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.authority.archive');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive requires a reason.');
    const before = await this.getAuthority(scope, authorityId);
    const row = await this.db.single<Row>(this.db.from('regulatory_authorities').update({ authority_status: 'Archived', archived_at: new Date().toISOString(), archived_by: userId, archive_reason: dto.reason, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', authorityId).select().single());
    await this.writeMutation(scope, userId, 'Authority archived', null, before, row, dto.reason);
    return row;
  }

  async reactivateAuthority(userId: string, scope: Scope, authorityId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.authority.edit');
    const before = await this.getAuthority(scope, authorityId);
    const row = await this.db.single<Row>(this.db.from('regulatory_authorities').update({ authority_status: 'Active', archived_at: null, archived_by: null, archive_reason: null, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', authorityId).select().single());
    await this.writeMutation(scope, userId, 'Authority reactivated', null, before, row, String(dto.reason ?? 'Authority reactivated'));
    return row;
  }

  async linkAuthorityToJurisdiction(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.authority.link');
    const jurisdiction = await this.getJurisdiction(scope, String(dto.jurisdictionId ?? dto.jurisdiction_id ?? ''));
    const authority = await this.getAuthority(scope, String(dto.authorityId ?? dto.authority_id ?? ''));
    const existing = await this.db.single<Row>(this.db.from('regulatory_jurisdiction_authorities').select('id').eq('company_id', scope.companyId).eq('jurisdiction_id', jurisdiction.id).eq('authority_id', authority.id).is('removed_at', null).maybeSingle()).catch(() => null);
    if (existing) throw new BadRequestException('This authority is already linked to the jurisdiction.');
    const row = await this.db.single<Row>(this.db.from('regulatory_jurisdiction_authorities').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: jurisdiction.site_id ?? authority.site_id ?? null, jurisdiction_id: jurisdiction.id, authority_id: authority.id, primary_authority: Boolean(dto.primaryAuthority ?? dto.primary_authority), link_reason: dto.linkReason ?? dto.link_reason ?? null, linked_by: userId }).select().single());
    await this.writeMutation(scope, userId, 'Authority linked to jurisdiction', null, null, row, String(dto.linkReason ?? 'Authority linked'));
    return row;
  }

  async unlinkAuthorityFromJurisdiction(userId: string, scope: Scope, linkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.authority.link');
    const row = await this.db.single<Row>(this.db.from('regulatory_jurisdiction_authorities').update({ removed_at: new Date().toISOString(), removed_by: userId, remove_reason: dto.reason ?? null }).eq('company_id', scope.companyId).eq('id', linkId).select().single());
    await this.writeMutation(scope, userId, 'Authority unlinked from jurisdiction', null, null, row, String(dto.reason ?? 'Authority unlinked'));
    return row;
  }

  async authorityRegisterItems(scope: Scope, authorityId: string) {
    const authority = await this.getAuthority(scope, authorityId);
    const items = await this.register(scope, { limit: 5000 });
    const rows = (items.allRows ?? items.rows).filter((row: Row) => row.authority_name === authority.authority_name);
    return { rows, total: rows.length };
  }

  async authorityHistory(scope: Scope, authorityId: string) {
    const authority = await this.getAuthority(scope, authorityId);
    const rows = await this.db.many<Row>(this.db.from('regulatory_history_events').select('*').eq('company_id', scope.companyId).contains('after_value_json', { id: authority.id }).order('created_at', { ascending: false }).limit(100)).catch(() => []);
    return { rows, authority };
  }

  async linkJurisdiction(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.jurisdiction.edit');
    await this.getItem(scope, id);
    const jurisdictionId = String(dto.jurisdictionId ?? dto.jurisdiction_id ?? '');
    const jurisdiction = await this.db.single<Row>(this.db.from('regulatory_jurisdictions').select('*').eq('company_id', scope.companyId).eq('id', jurisdictionId).maybeSingle());
    if (!jurisdiction) throw new NotFoundException('Jurisdiction was not found.');
    const existing = await this.db.single<Row>(this.db.from('regulatory_item_jurisdictions').select('id').eq('company_id', scope.companyId).eq('regulatory_item_id', id).eq('jurisdiction_id', jurisdictionId).is('removed_at', null).maybeSingle()).catch(() => null);
    if (existing) throw new BadRequestException('This jurisdiction is already linked.');
    const row = await this.db.single<Row>(this.db.from('regulatory_item_jurisdictions').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: jurisdiction.site_id ?? null, regulatory_item_id: id, jurisdiction_id: jurisdictionId, primary_jurisdiction: Boolean(dto.primaryJurisdiction ?? dto.primary_jurisdiction), linked_by: userId }).select().single());
    await this.writeMutation(scope, userId, 'Jurisdiction linked', id, null, row, 'Jurisdiction linked');
    return row;
  }

  async unlinkJurisdiction(userId: string, scope: Scope, id: string, linkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.jurisdiction.edit');
    await this.getItem(scope, id);
    const row = await this.db.single<Row>(this.db.from('regulatory_item_jurisdictions').update({ removed_at: new Date().toISOString(), removed_by: userId, remove_reason: dto.reason ?? null }).eq('company_id', scope.companyId).eq('id', linkId).eq('regulatory_item_id', id).select().single());
    await this.writeMutation(scope, userId, 'Jurisdiction unlinked', id, null, row, String(dto.reason ?? 'Jurisdiction unlinked'));
    return row;
  }

  async links(scope: Scope, id: string) {
    await this.getItem(scope, id);
    const rows = await this.db.many<Row>(this.db.from('regulatory_item_links').select('*').eq('company_id', scope.companyId).eq('regulatory_item_id', id).is('removed_at', null).order('linked_at', { ascending: false }));
    return { rows, summary: this.linkSummary(rows) };
  }

  async createLink(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.link.manage');
    await this.getItem(scope, id);
    const linkedModule = dto.linkedModule ?? dto.linked_module;
    const linkedRecordId = dto.linkedRecordId ?? dto.linked_record_id;
    if (!linkedModule || !linkedRecordId) throw new BadRequestException('Linked module and linked record ID are required.');
    const existing = await this.db.single<Row>(this.db.from('regulatory_item_links').select('id').eq('company_id', scope.companyId).eq('regulatory_item_id', id).eq('linked_module', linkedModule).eq('linked_record_id', linkedRecordId).is('removed_at', null).maybeSingle()).catch(() => null);
    if (existing) throw new BadRequestException('This linked record is already attached to the regulatory item.');
    const row = await this.db.single<Row>(this.db.from('regulatory_item_links').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: dto.siteId ?? dto.site_id ?? null,
      regulatory_item_id: id,
      linked_module: linkedModule,
      linked_object_type: dto.linkedObjectType ?? dto.linked_object_type ?? linkedModule,
      linked_record_id: linkedRecordId,
      link_role: dto.linkRole ?? dto.link_role ?? 'Foundation Link',
      link_status: dto.linkStatus ?? dto.link_status ?? 'Linked Foundation',
      source_snapshot_json: dto.sourceSnapshotJson ?? dto.source_snapshot_json ?? null,
      link_reason: dto.linkReason ?? dto.link_reason ?? null,
      linked_by: userId
    }).select().single());
    await this.refreshLinkCounts(scope, id);
    await this.writeMutation(scope, userId, `${linkedModule} linked`, id, null, row, String(dto.linkReason ?? 'Foundation link created'));
    return row;
  }

  removeLink(userId: string, scope: Scope, id: string, linkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.link.manage');
    return this.db.single<Row>(this.db.from('regulatory_item_links').update({ removed_at: new Date().toISOString(), removed_by: userId, remove_reason: dto.reason ?? null }).eq('company_id', scope.companyId).eq('regulatory_item_id', id).eq('id', linkId).select().single())
      .then(async (row) => {
        await this.refreshLinkCounts(scope, id);
        await this.writeMutation(scope, userId, 'Link removed', id, null, row, String(dto.reason ?? 'Foundation link removed'));
        return row;
      });
  }

  linkAudit(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.link');
    return this.createLink(userId, scope, id, { ...dto, linkedModule: 'Audit Standards / Regulatory Mapping' }, [...permissions, 'regulatory.link.manage']);
  }

  linkEvidence(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.link');
    return this.createLink(userId, scope, id, { ...dto, linkedModule: 'Audit Evidence' }, [...permissions, 'regulatory.link.manage']);
  }

  linkAction(userId: string, scope: Scope, id: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.link');
    return this.createLink(userId, scope, id, { ...dto, linkedModule: 'Action Engine' }, [...permissions, 'regulatory.link.manage']);
  }

  async history(scope: Scope, query: Row = {}) {
    let q = this.db.from('regulatory_history_events').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.regulatoryItemId) q = q.eq('regulatory_item_id', query.regulatoryItemId);
    const rows = await this.db.many<Row>(q.order('created_at', { ascending: false }).limit(Number(query.limit ?? 100)));
    return { rows, summary: { totalEvents: rows.length, byType: this.groupRows(rows, 'event_type'), bySource: this.groupRows(rows, 'source_module') } };
  }

  itemHistory(scope: Scope, id: string) {
    return this.history(scope, { regulatoryItemId: id });
  }

  async settings(scope: Scope) {
    const siteQuery = this.db.from('regulatory_settings').select('*').eq('company_id', scope.companyId);
    const row = await this.db.single<Row>((scope.selectedSiteId ? siteQuery.eq('site_id', scope.selectedSiteId) : siteQuery.is('site_id', null)).maybeSingle()).catch(() => null);
    if (row) return row;
    const companyRow = await this.db.single<Row>(this.db.from('regulatory_settings').select('*').eq('company_id', scope.companyId).is('site_id', null).maybeSingle()).catch(() => null);
    return companyRow ?? {
      require_owner_for_active_item: true,
      require_review_date_for_active_item: true,
      require_rationale_for_applicability: true,
      require_rationale_for_not_applicable: true,
      require_rationale_for_applicable: true,
      require_rationale_for_partially_applicable: true,
      require_review_for_critical_applicability: true,
      require_review_for_not_applicable_critical_item: true,
      require_risk_basis_for_critical_item: true,
      review_due_soon_days: 30,
      effective_soon_days: 60,
      applicability_review_due_soon_days: 30,
      default_applicability_review_frequency: 'Annual',
      auto_create_gap_for_missing_applicability: true,
      auto_create_gap_for_missing_rationale: true,
      auto_mark_applicability_stale_on_scope_change: true,
      allow_compliance_status_foundation_edit: true,
      require_obligation_breakdown_for_applicable_item: false,
      require_owner_for_active_obligation: true,
      require_scope_for_active_obligation: true,
      require_frequency_for_active_obligation: false,
      require_due_date_or_trigger_for_active_obligation: false,
      require_evidence_expectation_for_critical_obligation: true,
      require_module_mapping_for_psm_critical_obligation: true,
      require_risk_basis_for_critical_obligation: true,
      require_rationale_for_obligation_not_applicable: true,
      auto_create_gap_for_missing_obligation_owner: true,
      auto_create_gap_for_missing_evidence_expectation: true,
      auto_create_gap_for_missing_module_mapping: true,
      auto_mark_obligation_stale_on_parent_change: true,
      auto_notify_owner_obligation_due_soon: true,
      auto_notify_owner_obligation_overdue: true,
      obligation_due_soon_days: 30,
      require_rationale_for_compliant_status: true,
      require_gap_for_partially_compliant_status: true,
      require_gap_or_action_for_non_compliant_status: true,
      require_evidence_readiness_for_compliant_status: false,
      require_review_for_critical_compliance_status: true,
      require_review_for_manual_compliance_declaration: true,
      allow_manual_compliance_declaration: true,
      manual_declaration_expiry_days: null,
      auto_create_gap_for_non_compliance: true,
      auto_create_gap_for_evidence_missing: true,
      auto_create_action_foundation_for_critical_gap: false,
      auto_rollup_obligation_status_to_parent: true,
      rollup_non_compliance_overrides_all: true,
      auto_mark_compliance_stale_on_source_change: true,
      auto_notify_owner_on_non_compliance: true,
      auto_notify_owner_on_evidence_missing: true,
      auto_notify_owner_on_gap_overdue: true,
      compliance_review_due_soon_days: 30,
      require_evidence_for_compliant_status: false,
      require_review_for_critical_evidence: true,
      require_reviewer_for_restricted_evidence: true,
      allow_manual_external_evidence_reference: true,
      allow_evidence_placeholder_foundation: false,
      exclude_restricted_evidence_from_packages_by_default: true,
      allow_restricted_evidence_package_include: false,
      require_reason_for_restricted_evidence: true,
      require_reason_for_evidence_rejection: true,
      require_reason_for_evidence_waiver: true,
      auto_create_gap_for_rejected_evidence: true,
      auto_create_gap_for_expired_evidence: true,
      auto_create_gap_for_stale_evidence: true,
      auto_mark_evidence_stale_on_source_change: true,
      auto_update_compliance_readiness_on_evidence_change: true,
      auto_notify_owner_on_evidence_rejected: true,
      auto_notify_reviewer_on_evidence_submitted: true,
      evidence_due_soon_days: 30,
      evidence_expiry_warning_days: 60,
      require_audit_mapping_for_psm_critical_obligation: true,
      require_audit_mapping_for_safety_critical_obligation: true,
      require_audit_mapping_for_environmental_critical_obligation: false,
      require_owner_for_active_audit_mapping: true,
      allow_manual_audit_mapping: true,
      allow_historical_audit_mapping: true,
      auto_create_gap_for_missing_audit_mapping: true,
      auto_create_gap_for_missing_audit_evidence_mapping: true,
      auto_create_gap_for_stale_audit_mapping: true,
      auto_mark_audit_mapping_stale_on_regulatory_change: true,
      auto_mark_audit_mapping_stale_on_audit_change: true,
      auto_update_compliance_readiness_on_audit_mapping_change: true,
      auto_notify_owner_on_audit_mapping_gap: true,
      auto_notify_owner_on_stale_audit_mapping: true,
      require_action_for_non_compliance: true,
      require_action_for_critical_gap: true,
      require_action_for_evidence_gap: true,
      require_action_for_audit_mapping_gap: false,
      require_owner_for_regulatory_action: true,
      require_due_date_for_regulatory_action: true,
      require_verification_for_critical_action: true,
      require_effectiveness_for_critical_action: false,
      allow_link_existing_action: true,
      allow_link_audit_capa: true,
      allow_manual_action_placeholder_foundation: false,
      allow_gap_closure_without_action: false,
      allow_gap_closure_with_waiver: true,
      require_reason_for_action_waiver: true,
      auto_create_action_for_critical_non_compliance: false,
      auto_sync_universal_action_status: true,
      auto_sync_audit_capa_status: true,
      auto_update_gap_readiness_on_action_change: true,
      auto_update_compliance_readiness_on_action_change: true,
      auto_notify_owner_on_action_due_soon: true,
      auto_notify_owner_on_action_overdue: true,
      auto_notify_owner_on_verification_failed: true,
      action_due_soon_days: 14,
      action_overdue_escalation_days: 7
    };
  }

  async updateSettings(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.settings.edit');
    const before = await this.settings(scope);
    const patch = this.pick(dto, [
      'require_owner_for_active_item',
      'require_review_date_for_active_item',
      'require_rationale_for_applicability',
      'require_rationale_for_not_applicable',
      'require_applicability_assessment_for_active_item',
      'require_rationale_for_applicable',
      'require_rationale_for_partially_applicable',
      'require_review_for_critical_applicability',
      'require_review_for_not_applicable_critical_item',
      'require_risk_basis_for_critical_item',
      'default_review_frequency',
      'default_applicability_review_frequency',
      'review_due_soon_days',
      'applicability_review_due_soon_days',
      'effective_soon_days',
      'auto_create_gap_for_missing_applicability',
      'auto_create_gap_for_missing_rationale',
      'auto_mark_applicability_stale_on_scope_change',
      'auto_notify_owner_applicability_review_due',
      'auto_notify_owner_applicability_stale',
      'allow_compliance_status_foundation_edit',
      'require_review_for_compliance_status_change',
      'allow_audit_mapping_links',
      'allow_evidence_links',
      'allow_action_links',
      'auto_notify_owner_review_due',
      'auto_notify_owner_review_overdue',
      'auto_notify_owner_effective_soon',
      'require_obligation_breakdown_for_applicable_item',
      'require_owner_for_active_obligation',
      'require_scope_for_active_obligation',
      'require_frequency_for_active_obligation',
      'require_due_date_or_trigger_for_active_obligation',
      'require_evidence_expectation_for_critical_obligation',
      'require_module_mapping_for_psm_critical_obligation',
      'require_risk_basis_for_critical_obligation',
      'require_rationale_for_obligation_not_applicable',
      'auto_create_gap_for_missing_obligation_owner',
      'auto_create_gap_for_missing_evidence_expectation',
      'auto_create_gap_for_missing_module_mapping',
      'auto_mark_obligation_stale_on_parent_change',
      'auto_notify_owner_obligation_due_soon',
      'auto_notify_owner_obligation_overdue',
      'obligation_due_soon_days',
      'require_rationale_for_compliant_status',
      'require_gap_for_partially_compliant_status',
      'require_gap_or_action_for_non_compliant_status',
      'require_evidence_readiness_for_compliant_status',
      'require_review_for_critical_compliance_status',
      'require_review_for_manual_compliance_declaration',
      'allow_manual_compliance_declaration',
      'manual_declaration_expiry_days',
      'auto_create_gap_for_non_compliance',
      'auto_create_gap_for_evidence_missing',
      'auto_create_action_foundation_for_critical_gap',
      'auto_rollup_obligation_status_to_parent',
      'rollup_non_compliance_overrides_all',
      'auto_mark_compliance_stale_on_source_change',
      'auto_notify_owner_on_non_compliance',
      'auto_notify_owner_on_evidence_missing',
      'auto_notify_owner_on_gap_overdue',
      'compliance_review_due_soon_days',
      'require_evidence_for_compliant_status',
      'require_review_for_critical_evidence',
      'require_reviewer_for_restricted_evidence',
      'allow_manual_external_evidence_reference',
      'allow_evidence_placeholder_foundation',
      'exclude_restricted_evidence_from_packages_by_default',
      'allow_restricted_evidence_package_include',
      'require_reason_for_restricted_evidence',
      'require_reason_for_evidence_rejection',
      'require_reason_for_evidence_waiver',
      'auto_create_gap_for_rejected_evidence',
      'auto_create_gap_for_expired_evidence',
      'auto_create_gap_for_stale_evidence',
      'auto_mark_evidence_stale_on_source_change',
      'auto_update_compliance_readiness_on_evidence_change',
      'auto_notify_owner_on_evidence_rejected',
      'auto_notify_reviewer_on_evidence_submitted',
      'evidence_due_soon_days',
      'evidence_expiry_warning_days',
      'require_audit_mapping_for_psm_critical_obligation',
      'require_audit_mapping_for_safety_critical_obligation',
      'require_audit_mapping_for_environmental_critical_obligation',
      'require_owner_for_active_audit_mapping',
      'allow_manual_audit_mapping',
      'allow_historical_audit_mapping',
      'auto_create_gap_for_missing_audit_mapping',
      'auto_create_gap_for_missing_audit_evidence_mapping',
      'auto_create_gap_for_stale_audit_mapping',
      'auto_mark_audit_mapping_stale_on_regulatory_change',
      'auto_mark_audit_mapping_stale_on_audit_change',
      'auto_update_compliance_readiness_on_audit_mapping_change',
      'auto_notify_owner_on_audit_mapping_gap',
      'auto_notify_owner_on_stale_audit_mapping',
      'require_action_for_non_compliance',
      'require_action_for_critical_gap',
      'require_action_for_evidence_gap',
      'require_action_for_audit_mapping_gap',
      'require_owner_for_regulatory_action',
      'require_due_date_for_regulatory_action',
      'require_verification_for_critical_action',
      'require_effectiveness_for_critical_action',
      'allow_link_existing_action',
      'allow_link_audit_capa',
      'allow_manual_action_placeholder_foundation',
      'allow_gap_closure_without_action',
      'allow_gap_closure_with_waiver',
      'require_reason_for_action_waiver',
      'auto_create_action_for_critical_non_compliance',
      'auto_sync_universal_action_status',
      'auto_sync_audit_capa_status',
      'auto_update_gap_readiness_on_action_change',
      'auto_update_compliance_readiness_on_action_change',
      'auto_notify_owner_on_action_due_soon',
      'auto_notify_owner_on_action_overdue',
      'auto_notify_owner_on_verification_failed',
      'action_due_soon_days',
      'action_overdue_escalation_days',
      'settings_json'
    ]);
    const existing = before.id;
    const row = existing
      ? await this.db.single<Row>(this.db.from('regulatory_settings').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', existing).select().single())
      : await this.db.single<Row>(this.db.from('regulatory_settings').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: scope.selectedSiteId ?? null, ...patch, updated_by: userId }).select().single());
    await this.writeMutation(scope, userId, 'Settings changed', null, before, row, 'Regulatory settings changed');
    return row;
  }

  lookups() {
    return {
      sourceTypes: regulatorySourceTypes,
      categories: regulatoryCategories,
      jurisdictionLevels: regulatoryJurisdictionLevels,
      criticalityLevels: regulatoryCriticalityLevels,
      registerStatuses: regulatoryRegisterStatuses,
      applicabilityStatuses: regulatoryApplicabilityStatuses,
      complianceStatuses: regulatoryComplianceStatuses,
      reviewStatuses: regulatoryReviewStatuses,
      reviewFrequencies: regulatoryReviewFrequencies,
      linkModules: regulatoryLinkModules,
      authorityTypes: regulatoryAuthorityTypes,
      authorityStatuses: regulatoryAuthorityStatuses,
      applicabilityProfileTypes: regulatoryApplicabilityProfileTypes,
      applicabilityProfileStatuses: regulatoryApplicabilityProfileStatuses,
      applicabilityQuestionTypes: regulatoryApplicabilityQuestionTypes,
      applicabilityEffects: regulatoryApplicabilityEffects,
      applicabilityAssessmentMethods: regulatoryApplicabilityAssessmentMethods,
      applicabilityAssessmentStatuses: regulatoryApplicabilityAssessmentStatuses,
      applicabilityGapTypes: regulatoryApplicabilityGapTypes,
      applicabilityDecisions: regulatoryApplicabilityDecisions,
      obligationTypes: regulatoryObligationTypes,
      obligationCategories: regulatoryObligationCategories,
      obligationStatuses: regulatoryObligationStatuses,
      obligationApplicabilityStatuses: regulatoryObligationApplicabilityStatuses,
      obligationFrequencies: regulatoryObligationFrequencies,
      obligationTriggerEvents: regulatoryObligationTriggerEvents,
      evidenceExpectationStatuses: regulatoryEvidenceExpectationStatuses,
      moduleMappingStatuses: regulatoryModuleMappingStatuses,
      obligationGapTypes: regulatoryObligationGapTypes,
      obligationStaleStatuses: regulatoryObligationStaleStatuses,
      complianceAssessmentStatuses: regulatoryComplianceAssessmentStatuses,
      complianceEvidenceReadinessStatuses: regulatoryComplianceEvidenceReadinessStatuses,
      complianceCriteriaStatuses: regulatoryComplianceCriteriaStatuses,
      complianceGapTypes: regulatoryComplianceGapTypes,
      complianceGapStatuses: regulatoryComplianceGapStatuses,
      complianceGapSeverities: regulatoryComplianceGapSeverities,
      complianceStaleStatuses: regulatoryComplianceStaleStatuses,
      complianceSourceTypes: regulatoryComplianceSourceTypes,
      evidenceSourceTypes: regulatoryEvidenceSourceTypes,
      evidenceTypes: regulatoryEvidenceTypes,
      evidenceStatuses: regulatoryEvidenceStatuses,
      evidenceReviewStatuses: regulatoryEvidenceReviewStatuses,
      evidenceReadinessStatuses: regulatoryEvidenceReadinessStatuses,
      evidenceSourceModules: regulatoryEvidenceSourceModules,
      evidenceRequirementStatuses: regulatoryEvidenceRequirementStatuses,
      evidenceGapTypes: regulatoryEvidenceGapTypes,
      evidencePackageTypes: regulatoryEvidencePackageTypes,
      evidencePackageStatuses: regulatoryEvidencePackageStatuses,
      evidenceConfidentialityLevels: regulatoryEvidenceConfidentialityLevels,
      evidenceStaleStatuses: regulatoryEvidenceStaleStatuses,
      auditMappingTypes: regulatoryAuditMappingTypes,
      auditMappingSourceTypes: regulatoryAuditMappingSourceTypes,
      auditTargetTypes: regulatoryAuditTargetTypes,
      auditMappingStatuses: regulatoryAuditMappingStatuses,
      auditCoverageStatuses: regulatoryAuditCoverageStatuses,
      auditVerificationStatuses: regulatoryAuditVerificationStatuses,
      auditMappingGapTypes: regulatoryAuditMappingGapTypes,
      auditMappingStaleStatuses: regulatoryAuditMappingStaleStatuses,
      regulatoryActionSourceTypes,
      regulatoryActionTypes,
      regulatoryActionModes,
      regulatoryActionPriorities,
      regulatoryActionStatuses,
      regulatoryActionSyncStatuses,
      regulatoryActionClosureReadinessStatuses,
      regulatoryActionVerificationStatuses,
      regulatoryActionEffectivenessStatuses,
      regulatoryCapaPackageTypes,
      regulatoryCapaPackageStatuses
    };
  }

  lookup(key: string) {
    const lookups = this.lookups() as Row;
    return { rows: lookups[key] ?? [] };
  }

  async evidenceDashboard(scope: Scope, query: Row = {}, permissions: string[] = []) {
    const [requirements, links, gaps, requests, packages, access] = await Promise.all([
      this.evidenceRequirements(scope, { ...query, limit: 5000 }, permissions),
      this.evidenceLinks(scope, { ...query, limit: 5000 }, permissions),
      this.evidenceGaps(scope, { ...query, limit: 5000 }, permissions),
      this.evidenceRequests(scope, { ...query, limit: 5000 }, permissions),
      this.evidencePackages(scope, { ...query, limit: 5000 }, permissions),
      this.evidenceAccessLog(scope, { ...query, limit: 200 }, permissions).catch(() => ({ rows: [] }))
    ]);
    const requirementRows = requirements.allRows ?? requirements.rows ?? [];
    const linkRows = links.allRows ?? links.rows ?? [];
    const gapRows = gaps.rows ?? [];
    const requestRows = requests.rows ?? [];
    const packageRows = packages.rows ?? [];
    return {
      header: { title: 'Regulatory Evidence', subtitle: 'Evidence requirements, links, review, gaps, access, custody, and package foundation.', generatedAt: new Date().toISOString() },
      summary: this.evidenceSummaryFromRows(requirementRows, linkRows, gapRows, requestRows, packageRows, access.rows ?? []),
      bySite: this.groupRows(linkRows, 'site_id'),
      byUnit: this.groupRows(linkRows, 'unit_id'),
      byObligation: this.groupRows(linkRows, 'obligation_id'),
      byStatus: this.groupRows(linkRows, 'evidence_status'),
      bySourceModule: this.groupRows(linkRows, 'source_module'),
      byEvidenceType: this.groupRows(linkRows, 'evidence_type'),
      byReviewStatus: this.groupRows(linkRows, 'review_status'),
      byReadiness: this.groupRows(linkRows, 'readiness_status'),
      missingPreview: linkRows.filter((row) => row.readiness_status === 'Evidence Missing' || row.evidence_status === 'Missing Source').slice(0, 8),
      pendingReviewPreview: linkRows.filter((row) => row.review_status === 'Pending Review').slice(0, 8),
      stalePreview: linkRows.filter((row) => row.stale_status && row.stale_status !== 'Current').slice(0, 8),
      openGapPreview: gapRows.filter((row) => !['Resolved', 'Archived'].includes(row.gap_status)).slice(0, 8),
      openRequestPreview: requestRows.filter((row) => !['Fulfilled', 'Cancelled', 'Archived'].includes(row.request_status)).slice(0, 8),
      packagePreview: packageRows.slice(0, 8),
      recentEvidence: linkRows.slice().sort((a, b) => String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? ''))).slice(0, 10),
      recentAccess: (access.rows ?? []).slice(0, 10)
    };
  }

  async evidenceDashboardSummary(scope: Scope, query: Row = {}, permissions: string[] = []) {
    return (await this.evidenceDashboard(scope, query, permissions)).summary;
  }

  async evidenceDashboardGroup(scope: Scope, field: string, query: Row = {}, permissions: string[] = []) {
    const links = await this.evidenceLinks(scope, { ...query, limit: 5000 }, permissions);
    return { rows: this.groupRows(links.allRows ?? links.rows ?? [], field) };
  }

  async evidenceRegister(scope: Scope, query: Row = {}, permissions: string[] = []) {
    return this.evidenceLinks(scope, query, permissions);
  }

  async evidenceSummary(scope: Scope, query: Row = {}, permissions: string[] = []) {
    return this.evidenceDashboardSummary(scope, query, permissions);
  }

  async evidenceRequirements(scope: Scope, query: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.evidence.requirement.view');
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    let q = this.db.from('regulatory_evidence_requirements').select('*,item:regulatory_register_items(*),obligation:regulatory_obligations(*)').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    q = this.applyEvidenceScopeFilters(q, query);
    if (query.requirementStatus) q = q.eq('requirement_status', query.requirementStatus);
    if (query.evidenceType) q = q.eq('evidence_type_expected', query.evidenceType);
    if (query.sourceType) q = q.eq('source_type', query.sourceType);
    if (query.search) q = q.or(`requirement_code.ilike.%${query.search}%,requirement_title.ilike.%${query.search}%,evidence_description.ilike.%${query.search}%`);
    const allRows = await this.db.many<Row>(q.order('updated_at', { ascending: false })).catch(() => []);
    const filtered = allRows.filter((row) => this.canAccessSite(scope, row.site_id));
    const rows = filtered.slice((page - 1) * limit, page * limit);
    return { rows, allRows: filtered, total: filtered.length, page, limit, summary: this.groupRows(filtered, 'requirement_status') };
  }

  async getEvidenceRequirement(scope: Scope, requirementId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.requirement.view');
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_requirements').select('*,item:regulatory_register_items(*),obligation:regulatory_obligations(*)').eq('company_id', scope.companyId).eq('id', requirementId).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Evidence requirement was not found or is outside your company/site scope.');
    return row;
  }

  async createEvidenceRequirement(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.requirement.create');
    const source = await this.resolveEvidenceSource(scope, dto);
    const patch = await this.normalizeEvidenceRequirementInput(scope, dto, source);
    if (!String(patch.requirement_title ?? '').trim()) throw new BadRequestException('Evidence requirement title is required.');
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_requirements').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      requirement_code: patch.requirement_code ?? await this.generateEvidenceCode(scope, 'REQ'),
      ...patch,
      created_by: userId,
      updated_by: userId
    }).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence requirement created', null, row, row.requirement_title, { requirementId: row.id });
    await this.detectEvidenceGaps(userId, scope, { requirementId: row.id }, [...permissions, 'regulatory.evidence.gap.create']).catch(() => null);
    return row;
  }

  async updateEvidenceRequirement(userId: string, scope: Scope, requirementId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.requirement.edit');
    const before = await this.getEvidenceRequirement(scope, requirementId, [...permissions, 'regulatory.evidence.requirement.view']);
    if (before.archived_at) throw new BadRequestException('Archived evidence requirements are read-only until reactivated.');
    const patch = await this.normalizeEvidenceRequirementInput(scope, dto, before);
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_requirements').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', requirementId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence requirement updated', before, row, String(dto.reason ?? 'Evidence requirement updated'), { requirementId });
    await this.markEvidenceLinksStaleForRequirement(userId, scope, requirementId, String(dto.reason ?? 'Evidence requirement changed')).catch(() => null);
    return row;
  }

  async archiveEvidenceRequirement(userId: string, scope: Scope, requirementId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.requirement.archive');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive requires a reason.');
    const before = await this.getEvidenceRequirement(scope, requirementId, [...permissions, 'regulatory.evidence.requirement.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_requirements').update({ requirement_status: 'Archived', archived_at: new Date().toISOString(), archived_by: userId, archive_reason: dto.reason, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', requirementId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence requirement archived', before, row, dto.reason, { requirementId });
    return row;
  }

  async reactivateEvidenceRequirement(userId: string, scope: Scope, requirementId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.requirement.edit');
    const before = await this.getEvidenceRequirement(scope, requirementId, [...permissions, 'regulatory.evidence.requirement.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_requirements').update({ requirement_status: dto.requirementStatus ?? 'Active', archived_at: null, archived_by: null, archive_reason: null, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', requirementId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence requirement reactivated', before, row, String(dto.reason ?? 'Evidence requirement reactivated'), { requirementId });
    return row;
  }

  async evidenceLinks(scope: Scope, query: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.evidence.link.view');
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    let q = this.db.from('regulatory_evidence_links').select('*,requirement:regulatory_evidence_requirements(*),item:regulatory_register_items(*),obligation:regulatory_obligations(*)').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    q = this.applyEvidenceScopeFilters(q, query);
    if (query.evidenceStatus) q = q.eq('evidence_status', query.evidenceStatus);
    if (query.reviewStatus) q = q.eq('review_status', query.reviewStatus);
    if (query.readinessStatus) q = q.eq('readiness_status', query.readinessStatus);
    if (query.staleStatus) q = q.eq('stale_status', query.staleStatus);
    if (query.evidenceType) q = q.eq('evidence_type', query.evidenceType);
    if (query.sourceModule) q = q.eq('source_module', query.sourceModule);
    if (query.restricted !== undefined) q = q.eq('restricted', query.restricted === true || query.restricted === 'true');
    if (query.search) q = q.or(`evidence_code.ilike.%${query.search}%,evidence_title.ilike.%${query.search}%,source_record_id.ilike.%${query.search}%`);
    const allRows = await this.db.many<Row>(q.order(...this.evidenceSort(String(query.sort ?? 'updated_at.desc')))).catch(() => []);
    const visible = allRows.filter((row) => this.canAccessSite(scope, row.site_id)).map((row) => this.redactEvidenceLink(row, permissions));
    const filtered = visible.filter((row) => this.matchesEvidenceView(row, query.view));
    const rows = filtered.slice((page - 1) * limit, page * limit);
    return { rows, allRows: filtered, total: filtered.length, page, limit, hasMore: page * limit < filtered.length, summary: this.evidenceLinkSummary(filtered) };
  }

  async evidenceFilteredView(scope: Scope, view: string, query: Row = {}, permissions: string[] = []) {
    return this.evidenceLinks(scope, { ...query, view }, permissions);
  }

  async getEvidenceLink(scope: Scope, evidenceLinkId: string, permissions: string[], logAccess = false, accessType = 'View') {
    this.requirePermission(permissions, 'regulatory.evidence.link.view');
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_links').select('*,requirement:regulatory_evidence_requirements(*),item:regulatory_register_items(*),obligation:regulatory_obligations(*)').eq('company_id', scope.companyId).eq('id', evidenceLinkId).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Evidence link was not found or is outside your company/site scope.');
    if (row.restricted && !permissions.includes('regulatory.evidence.restricted.view') && !permissions.includes('regulatory.manage')) {
      if (logAccess) await this.writeEvidenceAccess(scope, evidenceLinkId, accessType, 'Denied', null, 'Restricted evidence permission is required.').catch(() => null);
      return this.redactEvidenceLink(row, permissions);
    }
    if (logAccess) await this.writeEvidenceAccess(scope, evidenceLinkId, accessType, 'Allowed', null, null).catch(() => null);
    return row;
  }

  async createEvidenceLink(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.link.create');
    const source = await this.resolveEvidenceSource(scope, dto);
    const patch = await this.normalizeEvidenceLinkInput(scope, dto, source);
    const settings = await this.settings(scope);
    this.validateEvidenceLink(patch, settings, permissions);
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_links').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      evidence_code: patch.evidence_code ?? await this.generateEvidenceCode(scope, 'EVD'),
      source_snapshot_json: patch.source_snapshot_json ?? this.evidenceSourceSnapshot(source),
      linked_by: userId,
      ...patch
    }).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence linked', null, row, row.evidence_title, { evidenceLinkId: row.id });
    await this.writeEvidenceChain(scope, userId, row.id, row.evidence_requirement_id ?? null, 'Evidence Linked', 'Evidence linked', row.evidence_title, null, row).catch(() => null);
    await this.refreshEvidenceReadinessForSource(userId, scope, row).catch(() => null);
    return row;
  }

  async updateEvidenceLink(userId: string, scope: Scope, evidenceLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.link.edit');
    const before = await this.getEvidenceLink(scope, evidenceLinkId, [...permissions, 'regulatory.evidence.link.view']);
    if (before.archived_at || ['Archived', 'Superseded'].includes(before.evidence_status)) throw new BadRequestException('Archived or superseded evidence is read-only. Use controlled replacement/new-version flow.');
    const patch = await this.normalizeEvidenceLinkInput(scope, dto, before);
    if (patch.restricted && !permissions.includes('regulatory.evidence.restricted.manage') && !permissions.includes('regulatory.manage')) throw new ForbiddenException('Missing permission: regulatory.evidence.restricted.manage');
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_links').update({ ...patch, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', evidenceLinkId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence link updated', before, row, String(dto.reason ?? 'Evidence metadata updated'), { evidenceLinkId });
    await this.writeEvidenceChain(scope, userId, evidenceLinkId, row.evidence_requirement_id ?? null, 'Evidence Updated', 'Evidence metadata updated', String(dto.reason ?? 'Evidence metadata updated'), before, row).catch(() => null);
    await this.refreshEvidenceReadinessForSource(userId, scope, row).catch(() => null);
    return row;
  }

  async replaceEvidenceLink(userId: string, scope: Scope, evidenceLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.link.replace');
    const before = await this.getEvidenceLink(scope, evidenceLinkId, [...permissions, 'regulatory.evidence.link.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_links').update({
      ...this.pickMapped(dto, {
        documentId: 'document_id', document_id: 'document_id',
        documentVersion: 'document_version', document_version: 'document_version',
        storageFileId: 'storage_file_id', storage_file_id: 'storage_file_id',
        auditEvidenceId: 'audit_evidence_id', audit_evidence_id: 'audit_evidence_id',
        sourceRecordId: 'source_record_id', source_record_id: 'source_record_id',
        sourceSnapshotJson: 'source_snapshot_json', source_snapshot_json: 'source_snapshot_json',
        externalReferenceUrl: 'external_reference_url', external_reference_url: 'external_reference_url',
        externalReferenceDescription: 'external_reference_description', external_reference_description: 'external_reference_description',
        version: 'version',
        fileHash: 'file_hash', file_hash: 'file_hash',
        fileSizeBytes: 'file_size_bytes', file_size_bytes: 'file_size_bytes'
      }),
      evidence_status: 'Linked',
      readiness_status: 'Evidence Linked',
      stale_status: 'Current',
      stale_reason: null,
      updated_at: new Date().toISOString()
    }).eq('company_id', scope.companyId).eq('id', evidenceLinkId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence replaced', before, row, String(dto.reason ?? 'Evidence replaced through controlled replacement flow'), { evidenceLinkId });
    await this.writeEvidenceChain(scope, userId, evidenceLinkId, row.evidence_requirement_id ?? null, 'Evidence Replaced', 'Evidence replaced', String(dto.reason ?? 'Evidence replaced'), before, row).catch(() => null);
    return row;
  }

  async removeEvidenceLink(userId: string, scope: Scope, evidenceLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.link.remove');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Remove requires a reason.');
    const before = await this.getEvidenceLink(scope, evidenceLinkId, [...permissions, 'regulatory.evidence.link.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_links').update({ evidence_status: 'Missing Source', readiness_status: 'Evidence Missing', source_record_id: null, document_id: null, storage_file_id: null, audit_evidence_id: null, external_reference_url: null, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', evidenceLinkId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence removed', before, row, dto.reason, { evidenceLinkId });
    await this.detectEvidenceGaps(userId, scope, { evidenceLinkId }, [...permissions, 'regulatory.evidence.gap.create']).catch(() => null);
    return row;
  }

  async archiveEvidenceLink(userId: string, scope: Scope, evidenceLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.link.archive');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive requires a reason.');
    const before = await this.getEvidenceLink(scope, evidenceLinkId, [...permissions, 'regulatory.evidence.link.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_links').update({ evidence_status: 'Archived', archived_at: new Date().toISOString(), archived_by: userId, archive_reason: dto.reason, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', evidenceLinkId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence archived', before, row, dto.reason, { evidenceLinkId });
    return row;
  }

  async markEvidenceLinkStale(userId: string, scope: Scope, evidenceLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.stale.view');
    const reason = String(dto.reason ?? dto.staleReason ?? 'Evidence marked stale');
    const before = await this.getEvidenceLink(scope, evidenceLinkId, [...permissions, 'regulatory.evidence.link.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_links').update({ evidence_status: 'Stale', readiness_status: 'Evidence Stale', stale_status: dto.staleStatus ?? 'Needs Replacement', stale_reason: reason, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', evidenceLinkId).select().single());
    await this.db.single(this.db.from('regulatory_evidence_staleness_events').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, evidence_link_id: evidenceLinkId, evidence_requirement_id: row.evidence_requirement_id ?? null, stale_trigger_type: dto.staleTriggerType ?? 'Manual Stale Mark', source_module: dto.sourceModule ?? 'Regulatory Evidence', source_record_id: dto.sourceRecordId ?? evidenceLinkId, stale_reason: reason }).select('id').single()).catch(() => null);
    await this.writeEvidenceMutation(scope, userId, 'Evidence marked stale', before, row, reason, { evidenceLinkId });
    return row;
  }

  async markEvidenceLinkRestricted(userId: string, scope: Scope, evidenceLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.restricted.manage');
    const settings = await this.settings(scope);
    if (settings.require_reason_for_restricted_evidence !== false && !String(dto.reason ?? dto.restrictedReason ?? '').trim()) throw new BadRequestException('Restricted evidence requires a reason.');
    const before = await this.getEvidenceLink(scope, evidenceLinkId, [...permissions, 'regulatory.evidence.link.view', 'regulatory.evidence.restricted.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_links').update({ restricted: dto.restricted ?? true, confidentiality_level: dto.confidentialityLevel ?? dto.confidentiality_level ?? before.confidentiality_level ?? 'Restricted', restricted_reason: dto.reason ?? dto.restrictedReason ?? before.restricted_reason, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', evidenceLinkId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence restriction changed', before, row, String(dto.reason ?? 'Evidence restriction changed'), { evidenceLinkId });
    return row;
  }

  async evidenceLinkPreview(userId: string, scope: Scope, evidenceLinkId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.preview');
    const row = await this.getEvidenceLink(scope, evidenceLinkId, permissions, true, 'Preview');
    if (row.restricted && row.restrictedRedacted) throw new ForbiddenException('Restricted evidence preview requires regulatory.evidence.restricted.view.');
    return { evidence: row, preview: this.safeEvidenceAccessReference(row, 'preview'), message: 'Preview is served through Document Control/Storage adapter when available. Raw private storage paths are never exposed.' };
  }

  async evidenceLinkDownload(userId: string, scope: Scope, evidenceLinkId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.download');
    const row = await this.getEvidenceLink(scope, evidenceLinkId, permissions, true, 'Download');
    if (row.restricted && row.restrictedRedacted) throw new ForbiddenException('Restricted evidence download requires regulatory.evidence.restricted.view.');
    return { evidence: row, download: this.safeEvidenceAccessReference(row, 'download'), message: 'Download URL/reference is delegated to Document Control/Storage adapter when available. Raw private storage paths are never exposed.' };
  }

  async submitEvidenceReview(userId: string, scope: Scope, evidenceLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.review.submit');
    const before = await this.getEvidenceLink(scope, evidenceLinkId, [...permissions, 'regulatory.evidence.link.view']);
    if (!before.reviewer_user_id && !dto.reviewerUserId && !dto.reviewer_user_id) throw new BadRequestException('Submit for review requires a reviewer.');
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_links').update({ review_status: 'Pending Review', evidence_status: 'Pending Review', readiness_status: 'Ready For Review', reviewed_by: dto.reviewerUserId ?? dto.reviewer_user_id ?? before.reviewer_user_id ?? null, review_date: dto.reviewDate ?? dto.review_date ?? before.review_date ?? null, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', evidenceLinkId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence submitted for review', before, row, String(dto.reason ?? 'Evidence submitted for review'), { evidenceLinkId });
    return row;
  }

  async reviewEvidenceLink(userId: string, scope: Scope, evidenceLinkId: string, decision: 'Verified Foundation' | 'Rejected' | 'Rework Required' | 'Waived Foundation', dto: Row, permissions: string[]) {
    const permission = decision === 'Verified Foundation' ? 'regulatory.evidence.review.verify' : decision === 'Rejected' ? 'regulatory.evidence.review.reject' : decision === 'Rework Required' ? 'regulatory.evidence.review.request_rework' : 'regulatory.evidence.review.verify';
    this.requirePermission(permissions, permission);
    const settings = await this.settings(scope);
    if (['Rejected', 'Rework Required'].includes(decision) && settings.require_reason_for_evidence_rejection !== false && !String(dto.reason ?? dto.rejectionReason ?? dto.reworkInstructions ?? '').trim()) throw new BadRequestException(`${decision} requires a reason.`);
    if (decision === 'Waived Foundation' && settings.require_reason_for_evidence_waiver !== false && !String(dto.reason ?? '').trim()) throw new BadRequestException('Waive foundation requires a reason.');
    const before = await this.getEvidenceLink(scope, evidenceLinkId, [...permissions, 'regulatory.evidence.link.view']);
    const patch = this.reviewPatch(decision, userId, dto);
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_links').update(patch).eq('company_id', scope.companyId).eq('id', evidenceLinkId).select().single());
    const review = await this.db.single<Row>(this.db.from('regulatory_evidence_reviews').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, evidence_link_id: evidenceLinkId, review_decision: decision, review_status: row.review_status, review_comment: dto.reviewComment ?? dto.review_comment ?? dto.reason ?? null, verification_basis_foundation: dto.verificationBasisFoundation ?? dto.verification_basis_foundation ?? null, rejection_reason: dto.rejectionReason ?? dto.rejection_reason ?? (decision === 'Rejected' ? dto.reason : null), rework_instructions: dto.reworkInstructions ?? dto.rework_instructions ?? (decision === 'Rework Required' ? dto.reason : null), reviewer_user_id: userId, next_review_date: dto.nextReviewDate ?? dto.next_review_date ?? null, e_signature_id: dto.eSignatureId ?? dto.e_signature_id ?? null }).select().single());
    await this.writeEvidenceMutation(scope, userId, `Evidence ${decision.toLowerCase()}`, before, row, String(dto.reason ?? decision), { evidenceLinkId });
    await this.writeEvidenceChain(scope, userId, evidenceLinkId, row.evidence_requirement_id ?? null, `Evidence ${decision}`, `Evidence ${decision}`, String(dto.reason ?? decision), before, row).catch(() => null);
    if (['Rejected', 'Rework Required'].includes(decision) && settings.auto_create_gap_for_rejected_evidence !== false) await this.detectEvidenceGaps(userId, scope, { evidenceLinkId }, [...permissions, 'regulatory.evidence.gap.create']).catch(() => null);
    return { evidence: row, review };
  }

  async evidenceReviews(scope: Scope, query: Row = {}, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.review.view');
    return this.evidenceLinks(scope, { ...query, view: query.view ?? 'pending-review', limit: query.limit ?? 100 }, permissions);
  }

  async evidenceRequests(scope: Scope, query: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.evidence.request.view');
    let q = this.db.from('regulatory_evidence_requests').select('*,requirement:regulatory_evidence_requirements(*),item:regulatory_register_items(*),obligation:regulatory_obligations(*)').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    q = this.applyEvidenceScopeFilters(q, query);
    if (query.requestStatus) q = q.eq('request_status', query.requestStatus);
    if (query.search) q = q.or(`request_code.ilike.%${query.search}%,request_title.ilike.%${query.search}%,request_message.ilike.%${query.search}%`);
    const rows = await this.db.many<Row>(q.order('updated_at', { ascending: false }).limit(Number(query.limit ?? 100))).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)), total: rows.length, summary: this.groupRows(rows, 'request_status') };
  }

  async createEvidenceRequest(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.request.create');
    const source = await this.resolveEvidenceSource(scope, dto);
    if (!String(dto.requestTitle ?? dto.request_title ?? '').trim()) throw new BadRequestException('Evidence request title is required.');
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_requests').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: dto.siteId ?? dto.site_id ?? source.site_id ?? scope.selectedSiteId ?? null,
      request_code: dto.requestCode ?? dto.request_code ?? await this.generateEvidenceCode(scope, 'EVR'),
      request_title: dto.requestTitle ?? dto.request_title,
      source_type: dto.sourceType ?? dto.source_type ?? source.source_type ?? 'Regulatory Item',
      regulatory_item_id: dto.regulatoryItemId ?? dto.regulatory_item_id ?? source.regulatory_item_id ?? (source.source_type === 'Regulatory Item' ? source.id : null),
      obligation_id: dto.obligationId ?? dto.obligation_id ?? source.obligation_id ?? (source.source_type === 'Regulatory Obligation' ? source.id : null),
      evidence_requirement_id: dto.evidenceRequirementId ?? dto.evidence_requirement_id ?? null,
      compliance_assessment_id: dto.complianceAssessmentId ?? dto.compliance_assessment_id ?? null,
      compliance_gap_id: dto.complianceGapId ?? dto.compliance_gap_id ?? null,
      request_status: dto.requestStatus ?? dto.request_status ?? 'Open',
      requested_from_user_id: dto.requestedFromUserId ?? dto.requested_from_user_id ?? null,
      requested_by: userId,
      due_date: dto.dueDate ?? dto.due_date ?? null,
      priority: dto.priority ?? null,
      request_message: dto.requestMessage ?? dto.request_message ?? null
    }).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence request created', null, row, row.request_title, { requestId: row.id });
    return row;
  }

  async getEvidenceRequest(scope: Scope, requestId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.request.view');
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_requests').select('*').eq('company_id', scope.companyId).eq('id', requestId).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Evidence request was not found or is outside your company/site scope.');
    return row;
  }

  async updateEvidenceRequest(userId: string, scope: Scope, requestId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.request.create');
    const before = await this.getEvidenceRequest(scope, requestId, [...permissions, 'regulatory.evidence.request.view']);
    const patch = this.pickMapped(dto, { requestTitle: 'request_title', request_title: 'request_title', requestStatus: 'request_status', request_status: 'request_status', requestedFromUserId: 'requested_from_user_id', requested_from_user_id: 'requested_from_user_id', dueDate: 'due_date', due_date: 'due_date', priority: 'priority', requestMessage: 'request_message', request_message: 'request_message', responseNote: 'response_note', response_note: 'response_note' });
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_requests').update({ ...patch, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', requestId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence request updated', before, row, String(dto.reason ?? 'Evidence request updated'), { requestId });
    return row;
  }

  async fulfillEvidenceRequest(userId: string, scope: Scope, requestId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.request.fulfill');
    const before = await this.getEvidenceRequest(scope, requestId, [...permissions, 'regulatory.evidence.request.view']);
    const evidenceLinkId = dto.evidenceLinkId ?? dto.evidence_link_id ?? before.fulfilled_evidence_link_id;
    if (!evidenceLinkId) throw new BadRequestException('Fulfill requires an evidence link.');
    await this.getEvidenceLink(scope, evidenceLinkId, [...permissions, 'regulatory.evidence.link.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_requests').update({ request_status: 'Fulfilled', fulfilled_evidence_link_id: evidenceLinkId, fulfilled_by: userId, fulfilled_at: new Date().toISOString(), response_note: dto.responseNote ?? dto.response_note ?? null, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', requestId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence request fulfilled', before, row, String(dto.reason ?? 'Evidence request fulfilled'), { requestId, evidenceLinkId });
    return row;
  }

  async cancelEvidenceRequest(userId: string, scope: Scope, requestId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.request.cancel');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Cancel requires a reason.');
    const before = await this.getEvidenceRequest(scope, requestId, [...permissions, 'regulatory.evidence.request.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_requests').update({ request_status: 'Cancelled', cancelled_by: userId, cancelled_at: new Date().toISOString(), cancel_reason: dto.reason, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', requestId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence request cancelled', before, row, dto.reason, { requestId });
    return row;
  }

  async evidenceGaps(scope: Scope, query: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.evidence.gap.view');
    let q = this.db.from('regulatory_evidence_gaps').select('*,requirement:regulatory_evidence_requirements(*),evidence:regulatory_evidence_links(*)').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    q = this.applyEvidenceScopeFilters(q, query);
    if (query.gapStatus) q = q.eq('gap_status', query.gapStatus);
    if (query.gapType) q = q.eq('gap_type', query.gapType);
    if (query.gapSeverity) q = q.eq('gap_severity', query.gapSeverity);
    if (query.search) q = q.or(`gap_code.ilike.%${query.search}%,gap_title.ilike.%${query.search}%,gap_description.ilike.%${query.search}%`);
    const rows = await this.db.many<Row>(q.order('updated_at', { ascending: false }).limit(Number(query.limit ?? 100))).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)), total: rows.length, summary: this.groupRows(rows, 'gap_status') };
  }

  async detectEvidenceGaps(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.gap.create');
    const requirements = dto.requirementId ? [await this.getEvidenceRequirement(scope, dto.requirementId, [...permissions, 'regulatory.evidence.requirement.view'])] : (await this.evidenceRequirements(scope, { ...dto, limit: 5000 }, [...permissions, 'regulatory.evidence.requirement.view'])).allRows ?? [];
    const links = dto.evidenceLinkId ? [await this.getEvidenceLink(scope, dto.evidenceLinkId, [...permissions, 'regulatory.evidence.link.view'])] : (await this.evidenceLinks(scope, { ...dto, limit: 5000 }, [...permissions, 'regulatory.evidence.link.view'])).allRows ?? [];
    const created: Row[] = [];
    for (const gap of this.detectEvidenceGapRows(requirements, links)) {
      const existing = await this.db.single<Row>(this.db.from('regulatory_evidence_gaps').select('id').eq('company_id', scope.companyId).eq('gap_type', gap.gap_type).eq('evidence_requirement_id', gap.evidence_requirement_id ?? '').eq('evidence_link_id', gap.evidence_link_id ?? '').neq('gap_status', 'Resolved').maybeSingle()).catch(() => null);
      if (existing) continue;
      const row = await this.db.single<Row>(this.db.from('regulatory_evidence_gaps').insert({ ...gap, id: gap.id ?? crypto.randomUUID(), company_id: scope.companyId, gap_code: gap.gap_code ?? await this.generateEvidenceCode(scope, 'EVG'), detected_by: userId, created_by: userId }).select().single());
      await this.writeEvidenceMutation(scope, userId, 'Evidence gap detected', null, row, row.gap_title, { gapId: row.id });
      created.push(row);
    }
    return { rows: created, total: created.length };
  }

  async createEvidenceGap(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.gap.create');
    if (!String(dto.gapTitle ?? dto.gap_title ?? '').trim()) throw new BadRequestException('Evidence gap title is required.');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Manual evidence gap creation requires a reason.');
    const source = await this.resolveEvidenceSource(scope, dto).catch(() => ({} as Row));
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_gaps').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: dto.siteId ?? dto.site_id ?? source.site_id ?? scope.selectedSiteId ?? null,
      unit_id: dto.unitId ?? dto.unit_id ?? source.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? source.area_id ?? null,
      equipment_id: dto.equipmentId ?? dto.equipment_id ?? source.equipment_id ?? null,
      gap_code: dto.gapCode ?? dto.gap_code ?? await this.generateEvidenceCode(scope, 'EVG'),
      gap_title: dto.gapTitle ?? dto.gap_title,
      gap_type: dto.gapType ?? dto.gap_type ?? 'Manual Gap',
      gap_description: dto.gapDescription ?? dto.gap_description ?? null,
      regulatory_item_id: dto.regulatoryItemId ?? dto.regulatory_item_id ?? source.regulatory_item_id ?? null,
      obligation_id: dto.obligationId ?? dto.obligation_id ?? source.obligation_id ?? null,
      evidence_requirement_id: dto.evidenceRequirementId ?? dto.evidence_requirement_id ?? null,
      evidence_link_id: dto.evidenceLinkId ?? dto.evidence_link_id ?? null,
      compliance_assessment_id: dto.complianceAssessmentId ?? dto.compliance_assessment_id ?? null,
      compliance_gap_id: dto.complianceGapId ?? dto.compliance_gap_id ?? null,
      gap_status: dto.gapStatus ?? dto.gap_status ?? 'Open',
      gap_severity: dto.gapSeverity ?? dto.gap_severity ?? dto.severity ?? 'Medium',
      criticality: dto.criticality ?? source.criticality ?? null,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? null,
      due_date: dto.dueDate ?? dto.due_date ?? null,
      recommended_fix: dto.recommendedFix ?? dto.recommended_fix ?? null,
      detected_by: userId,
      created_by: userId
    }).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence gap created', null, row, String(dto.reason ?? row.gap_title), { gapId: row.id });
    return row;
  }

  async getEvidenceGap(scope: Scope, gapId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.gap.view');
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_gaps').select('*').eq('company_id', scope.companyId).eq('id', gapId).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Evidence gap was not found or is outside your company/site scope.');
    return row;
  }

  async updateEvidenceGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.gap.edit');
    const before = await this.getEvidenceGap(scope, gapId, [...permissions, 'regulatory.evidence.gap.view']);
    const patch = this.pickMapped(dto, { gapTitle: 'gap_title', gap_title: 'gap_title', gapType: 'gap_type', gap_type: 'gap_type', gapDescription: 'gap_description', gap_description: 'gap_description', gapStatus: 'gap_status', gap_status: 'gap_status', gapSeverity: 'gap_severity', gap_severity: 'gap_severity', criticality: 'criticality', ownerUserId: 'owner_user_id', owner_user_id: 'owner_user_id', dueDate: 'due_date', due_date: 'due_date', recommendedFix: 'recommended_fix', recommended_fix: 'recommended_fix', actionId: 'action_id', action_id: 'action_id', waiverReason: 'waiver_reason', waiver_reason: 'waiver_reason', resolutionNote: 'resolution_note', resolution_note: 'resolution_note' });
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_gaps').update({ ...patch, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', gapId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence gap updated', before, row, String(dto.reason ?? 'Evidence gap updated'), { gapId });
    return row;
  }

  async resolveEvidenceGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.gap.resolve');
    if (!String(dto.reason ?? dto.resolutionNote ?? '').trim()) throw new BadRequestException('Gap closure requires a resolution note or reason.');
    return this.updateEvidenceGap(userId, scope, gapId, { gap_status: 'Resolved', resolved_by: userId, resolved_at: new Date().toISOString(), resolution_note: dto.reason ?? dto.resolutionNote, reason: dto.reason ?? dto.resolutionNote }, [...permissions, 'regulatory.evidence.gap.edit']);
  }

  async archiveEvidenceGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.gap.edit');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive requires a reason.');
    const before = await this.getEvidenceGap(scope, gapId, [...permissions, 'regulatory.evidence.gap.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_gaps').update({ gap_status: 'Archived', archived_by: userId, archived_at: new Date().toISOString(), archive_reason: dto.reason, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', gapId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence gap archived', before, row, dto.reason, { gapId });
    return row;
  }

  async createActionFoundationForEvidenceGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.gap.create_action_foundation');
    return this.updateEvidenceGap(userId, scope, gapId, { action_id: dto.actionId ?? dto.action_id ?? `action-foundation-${crypto.randomUUID()}`, gap_status: 'Action Foundation Created', reason: dto.reason ?? 'Action foundation created for evidence gap' }, [...permissions, 'regulatory.evidence.gap.edit']);
  }

  async evidencePackages(scope: Scope, query: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.evidence.package.view');
    let q = this.db.from('regulatory_evidence_package_foundations').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.packageStatus) q = q.eq('package_status', query.packageStatus);
    if (query.packageType) q = q.eq('package_type', query.packageType);
    if (query.search) q = q.or(`package_code.ilike.%${query.search}%,package_title.ilike.%${query.search}%`);
    const rows = await this.db.many<Row>(q.order('updated_at', { ascending: false }).limit(Number(query.limit ?? 100))).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)), total: rows.length, summary: this.groupRows(rows, 'package_status') };
  }

  async createEvidencePackage(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.package.prepare');
    if (!String(dto.packageTitle ?? dto.package_title ?? '').trim()) throw new BadRequestException('Evidence package title is required.');
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_package_foundations').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: dto.siteId ?? dto.site_id ?? scope.selectedSiteId ?? null, package_code: dto.packageCode ?? dto.package_code ?? await this.generateEvidenceCode(scope, 'EVP'), package_title: dto.packageTitle ?? dto.package_title, package_type: dto.packageType ?? dto.package_type ?? 'Regulatory Item Evidence Package', package_status: dto.packageStatus ?? dto.package_status ?? 'Draft', scope_json: dto.scopeJson ?? dto.scope_json ?? null, owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? null, notes: dto.notes ?? null, created_by: userId, updated_by: userId }).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence package created', null, row, row.package_title, { packageId: row.id });
    return row;
  }

  async getEvidencePackage(scope: Scope, packageId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.package.view');
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_package_foundations').select('*').eq('company_id', scope.companyId).eq('id', packageId).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Evidence package was not found or is outside your company/site scope.');
    const items = await this.db.many<Row>(this.db.from('regulatory_evidence_package_items').select('*,evidence:regulatory_evidence_links(*)').eq('company_id', scope.companyId).eq('package_id', packageId).is('removed_at', null).order('added_at', { ascending: false })).catch(() => []);
    return { package: row, items };
  }

  async updateEvidencePackage(userId: string, scope: Scope, packageId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.package.prepare');
    const before = (await this.getEvidencePackage(scope, packageId, [...permissions, 'regulatory.evidence.package.view'])).package;
    const patch = this.pickMapped(dto, { packageTitle: 'package_title', package_title: 'package_title', packageType: 'package_type', package_type: 'package_type', packageStatus: 'package_status', package_status: 'package_status', scopeJson: 'scope_json', scope_json: 'scope_json', ownerUserId: 'owner_user_id', owner_user_id: 'owner_user_id', notes: 'notes' });
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_package_foundations').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', packageId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence package updated', before, row, String(dto.reason ?? 'Evidence package updated'), { packageId });
    return row;
  }

  async prepareEvidencePackage(userId: string, scope: Scope, packageId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.package.prepare');
    const detail = await this.getEvidencePackage(scope, packageId, [...permissions, 'regulatory.evidence.package.view']);
    const includeRestricted = dto.includeRestricted === true || dto.include_restricted === true;
    if (includeRestricted && !permissions.includes('regulatory.evidence.package.include_restricted') && !permissions.includes('regulatory.manage')) throw new ForbiddenException('Missing permission: regulatory.evidence.package.include_restricted');
    const evidence = await this.evidenceLinks(scope, { ...(detail.package.scope_json ?? {}), limit: 5000 }, [...permissions, 'regulatory.evidence.link.view']);
    const settings = await this.settings(scope);
    const rows = (evidence.allRows ?? []).filter((row) => includeRestricted || !row.restricted || settings.exclude_restricted_evidence_from_packages_by_default === false);
    const manifest = rows.map((row) => ({ evidence_link_id: row.id, evidence_code: row.evidence_code, title: row.evidence_title, status: row.evidence_status, review_status: row.review_status, restricted: row.restricted, stale_status: row.stale_status }));
    const before = detail.package;
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_package_foundations').update({ package_status: rows.length ? 'Prepared' : 'Missing Evidence', manifest_json: manifest, included_evidence_count: rows.length, excluded_evidence_count: (evidence.allRows ?? []).length - rows.length, restricted_evidence_count: rows.filter((row) => row.restricted).length, prepared_by: userId, prepared_at: new Date().toISOString(), updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', packageId).select().single());
    for (const evidenceRow of rows) {
      await this.db.single(this.db.from('regulatory_evidence_package_items').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: evidenceRow.site_id ?? null, package_id: packageId, evidence_link_id: evidenceRow.id, evidence_requirement_id: evidenceRow.evidence_requirement_id ?? null, regulatory_item_id: evidenceRow.regulatory_item_id ?? null, obligation_id: evidenceRow.obligation_id ?? null, restricted: Boolean(evidenceRow.restricted), added_by: userId }).select('id').single()).catch(() => null);
    }
    await this.writeEvidenceMutation(scope, userId, 'Evidence package prepared', before, row, 'Package manifest prepared by backend', { packageId });
    return this.getEvidencePackage(scope, packageId, permissions);
  }

  async addEvidenceToPackage(userId: string, scope: Scope, packageId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.package.prepare');
    const evidenceLinkId = dto.evidenceLinkId ?? dto.evidence_link_id;
    if (!evidenceLinkId) throw new BadRequestException('Evidence link is required.');
    const evidence = await this.getEvidenceLink(scope, evidenceLinkId, [...permissions, 'regulatory.evidence.link.view']);
    if (evidence.restricted && !permissions.includes('regulatory.evidence.package.include_restricted') && !permissions.includes('regulatory.manage')) throw new ForbiddenException('Missing permission: regulatory.evidence.package.include_restricted');
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_package_items').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: evidence.site_id ?? null, package_id: packageId, evidence_link_id: evidenceLinkId, evidence_requirement_id: evidence.evidence_requirement_id ?? null, regulatory_item_id: evidence.regulatory_item_id ?? null, obligation_id: evidence.obligation_id ?? null, restricted: Boolean(evidence.restricted), added_by: userId }).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence added to package', null, row, String(dto.reason ?? 'Evidence added to package'), { packageId, evidenceLinkId });
    return row;
  }

  async removeEvidencePackageItem(userId: string, scope: Scope, packageId: string, itemId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.package.prepare');
    const before = await this.db.single<Row>(this.db.from('regulatory_evidence_package_items').select('*').eq('company_id', scope.companyId).eq('package_id', packageId).eq('id', itemId).maybeSingle());
    if (!before || !this.canAccessSite(scope, before.site_id)) throw new NotFoundException('Evidence package item was not found or is outside your company/site scope.');
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_package_items').update({ included: false, removed_by: userId, removed_at: new Date().toISOString(), remove_reason: dto.reason ?? 'Removed from package' }).eq('company_id', scope.companyId).eq('id', itemId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence removed from package', before, row, String(dto.reason ?? 'Evidence removed from package'), { packageId });
    return row;
  }

  async archiveEvidencePackage(userId: string, scope: Scope, packageId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.package.prepare');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive requires a reason.');
    const before = (await this.getEvidencePackage(scope, packageId, [...permissions, 'regulatory.evidence.package.view'])).package;
    const row = await this.db.single<Row>(this.db.from('regulatory_evidence_package_foundations').update({ package_status: 'Archived', archived_by: userId, archived_at: new Date().toISOString(), archive_reason: dto.reason, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', packageId).select().single());
    await this.writeEvidenceMutation(scope, userId, 'Evidence package archived', before, row, dto.reason, { packageId });
    return row;
  }

  async evidenceAccessLog(scope: Scope, query: Row = {}, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.access_log.view');
    let q = this.db.from('regulatory_evidence_access_events').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.evidenceLinkId) q = q.eq('evidence_link_id', query.evidenceLinkId);
    if (query.accessStatus) q = q.eq('access_status', query.accessStatus);
    const rows = await this.db.many<Row>(q.order('accessed_at', { ascending: false }).limit(Number(query.limit ?? 100))).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)), total: rows.length, summary: this.groupRows(rows, 'access_status') };
  }

  async evidenceChain(scope: Scope, evidenceLinkId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.chain.view');
    await this.getEvidenceLink(scope, evidenceLinkId, [...permissions, 'regulatory.evidence.link.view']);
    const rows = await this.db.many<Row>(this.db.from('regulatory_evidence_chain_events').select('*').eq('company_id', scope.companyId).eq('evidence_link_id', evidenceLinkId).order('created_at', { ascending: false })).catch(() => []);
    return { rows };
  }

  async evidenceHistory(scope: Scope, query: Row = {}, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.history.view');
    let q = this.db.from('regulatory_evidence_history_events').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    q = this.applyEvidenceScopeFilters(q, query);
    if (query.evidenceLinkId) q = q.eq('evidence_link_id', query.evidenceLinkId);
    if (query.requirementId) q = q.eq('evidence_requirement_id', query.requirementId);
    if (query.requestId) q = q.eq('evidence_request_id', query.requestId);
    if (query.gapId) q = q.eq('gap_id', query.gapId);
    if (query.packageId) q = q.eq('package_id', query.packageId);
    const rows = await this.db.many<Row>(q.order('created_at', { ascending: false }).limit(Number(query.limit ?? 100))).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)), summary: { totalEvents: rows.length, byType: this.groupRows(rows, 'event_type') } };
  }

  evidenceSettings(scope: Scope) {
    return this.settings(scope);
  }

  updateEvidenceSettings(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.evidence.settings.edit');
    return this.updateSettings(userId, scope, dto, [...permissions, 'regulatory.settings.edit']);
  }

  sourceEvidence(scope: Scope, sourceType: 'item' | 'obligation' | 'complianceAssessment' | 'complianceGap', sourceId: string, query: Row, permissions: string[]) {
    const map: Row = { item: 'regulatoryItemId', obligation: 'obligationId', complianceAssessment: 'complianceAssessmentId', complianceGap: 'complianceGapId' };
    return this.evidenceLinks(scope, { ...query, [map[sourceType]]: sourceId }, permissions);
  }

  sourceEvidenceRequirements(scope: Scope, sourceType: 'item' | 'obligation', sourceId: string, query: Row, permissions: string[]) {
    return this.evidenceRequirements(scope, { ...query, [sourceType === 'item' ? 'regulatoryItemId' : 'obligationId']: sourceId }, permissions);
  }

  sourceEvidenceGaps(scope: Scope, sourceType: 'item' | 'obligation', sourceId: string, query: Row, permissions: string[]) {
    return this.evidenceGaps(scope, { ...query, [sourceType === 'item' ? 'regulatoryItemId' : 'obligationId']: sourceId }, permissions);
  }

  sourceEvidencePackage(scope: Scope, sourceType: 'item' | 'obligation', sourceId: string, query: Row, permissions: string[]) {
    return this.evidencePackages(scope, { ...query, scopeSourceType: sourceType, scopeSourceId: sourceId }, permissions);
  }

  scopedEvidence(scope: Scope, kind: 'siteId' | 'unitId' | 'areaId' | 'equipmentId', id: string, query: Row, permissions: string[]) {
    return this.evidenceLinks(scope, { ...query, [kind]: id }, permissions);
  }

  async auditMappingDashboard(scope: Scope, query: Row = {}, permissions: string[] = []) {
    const [register, gaps, history] = await Promise.all([
      this.auditMappings(scope, { ...query, limit: 5000 }, permissions),
      this.auditMappingGaps(scope, { ...query, limit: 5000 }, permissions),
      this.auditMappingHistory(scope, { ...query, limit: 10 }, permissions).catch(() => ({ rows: [] }))
    ]);
    const rows = register.allRows ?? register.rows ?? [];
    const openGaps = gaps.rows.filter((gap: Row) => !['Resolved', 'Archived'].includes(gap.gap_status));
    return {
      summary: this.auditMappingSummaryFromRows(rows, gaps.rows),
      bySite: this.groupRows(rows, 'site_id'),
      byObligation: this.groupRows(rows, 'obligation_id'),
      byAuditProgram: this.groupRows(rows, 'audit_program_id'),
      byCoverage: this.groupRows(rows, 'coverage_status'),
      byVerification: this.groupRows(rows, 'verification_status'),
      byTargetType: this.groupRows(rows, 'audit_target_type'),
      byMappingType: this.groupRows(rows, 'mapping_type'),
      gapsPreview: openGaps.slice(0, 10),
      stalePreview: rows.filter((row) => row.stale_status !== 'Current' || row.mapping_status === 'Stale').slice(0, 10),
      recentMappings: rows.slice(0, 10),
      recentHistory: history.rows,
      readiness: {
        readyForAudit: rows.filter((row) => row.audit_readiness_status === 'Ready For Audit' || row.coverage_status === 'Ready For Audit').length,
        notReadyForAudit: rows.filter((row) => row.audit_readiness_status !== 'Ready For Audit' && row.coverage_status !== 'Ready For Audit').length,
        missingCoverage: openGaps.length
      }
    };
  }

  async auditMappingDashboardSummary(scope: Scope, query: Row = {}, permissions: string[] = []) {
    return (await this.auditMappingDashboard(scope, query, permissions)).summary;
  }

  async auditMappingDashboardGroup(scope: Scope, field: string, query: Row = {}, permissions: string[] = []) {
    const register = await this.auditMappings(scope, { ...query, limit: 5000 }, permissions);
    return { rows: this.groupRows(register.allRows ?? register.rows ?? [], field) };
  }

  async auditMappingRegister(scope: Scope, query: Row = {}, permissions: string[] = []) {
    return this.auditMappings(scope, query, permissions);
  }

  async auditMappings(scope: Scope, query: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, query.viewPermission ?? 'regulatory.audit_mapping.register.view');
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 25), 5000);
    let q = this.db.from('regulatory_audit_mappings').select('*').eq('company_id', scope.companyId);
    const selectedSiteId = scope.selectedSiteId;
    if (selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${selectedSiteId}`);
    q = this.applyAuditMappingScopeFilters(q, query);
    if (query.search) {
      const term = String(query.search).replace(/[%(),]/g, '');
      q = q.or(`mapping_code.ilike.%${term}%,mapping_title.ilike.%${term}%,mapping_rationale.ilike.%${term}%`);
    }
    const sort = this.auditMappingSort(query.sort);
    const allRows = (await this.db.many<Row>(q.order(sort.field, { ascending: sort.ascending }))).filter((row) => this.canAccessSite(scope, row.site_id));
    const view = String(query.view ?? '');
    const filtered = view ? allRows.filter((row) => this.matchesAuditMappingView(row, view)) : allRows;
    const rows = filtered.slice((page - 1) * limit, page * limit).map((row) => this.redactAuditMapping(row, permissions));
    return { rows, allRows: filtered, total: filtered.length, page, limit, summary: this.auditMappingSummaryFromRows(filtered) };
  }

  async auditMappingFilteredView(scope: Scope, view: string, query: Row = {}, permissions: string[] = []) {
    return this.auditMappings(scope, { ...query, view }, permissions);
  }

  async auditMappingSummary(scope: Scope, query: Row = {}, permissions: string[] = []) {
    const register = await this.auditMappings(scope, { ...query, limit: 5000 }, permissions);
    return register.summary;
  }

  async getAuditMapping(scope: Scope, mappingId: string, permissions: string[], includeDetail = false) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.view');
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mappings').select('*').eq('company_id', scope.companyId).eq('id', mappingId).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Regulatory audit mapping was not found or is outside your company/site scope.');
    const mapping = this.redactAuditMapping(row, permissions);
    if (!includeDetail) return mapping;
    const [links, coverage, traceability, gaps, reviews, history] = await Promise.all([
      this.auditMappingLinks(scope, mappingId, permissions),
      this.auditMappingCoverage(scope, { mappingId }, permissions),
      this.auditMappingTraceability(scope, { mappingId }, permissions),
      this.auditMappingGaps(scope, { mappingId, limit: 100 }, permissions),
      this.auditMappingReviews(scope, mappingId, permissions),
      this.auditMappingHistory(scope, { mappingId, limit: 100 }, permissions)
    ]);
    return { mapping, links, coverage, traceability, gaps, reviews, history, readOnly: this.isAuditMappingReadOnly(row), readOnlyReason: this.auditMappingReadOnlyReason(row) };
  }

  auditMappingOverview(scope: Scope, mappingId: string, permissions: string[]) { return this.getAuditMapping(scope, mappingId, permissions, true); }
  auditMappingSource(scope: Scope, mappingId: string, permissions: string[]) { return this.getAuditMapping(scope, mappingId, permissions, true).then((detail: Row) => ({ mapping: detail.mapping, sourceSnapshot: detail.mapping.source_snapshot_json, auditTargetSnapshot: detail.mapping.audit_target_snapshot_json })); }
  auditMappingAuditLinks(scope: Scope, mappingId: string, permissions: string[]) { return this.auditMappingLinks(scope, mappingId, permissions); }
  auditMappingEvidence(scope: Scope, mappingId: string, permissions: string[]) { return this.auditMappingDetailRelated(scope, mappingId, permissions, 'evidence'); }
  auditMappingFindings(scope: Scope, mappingId: string, permissions: string[]) { return this.auditMappingDetailRelated(scope, mappingId, permissions, 'findings'); }
  auditMappingCapa(scope: Scope, mappingId: string, permissions: string[]) { return this.auditMappingDetailRelated(scope, mappingId, permissions, 'capa'); }
  auditMappingScoring(scope: Scope, mappingId: string, permissions: string[]) { return this.auditMappingDetailRelated(scope, mappingId, permissions, 'scoring'); }
  auditMappingReports(scope: Scope, mappingId: string, permissions: string[]) { return this.auditMappingDetailRelated(scope, mappingId, permissions, 'reports'); }

  async createAuditMapping(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.create');
    const settings = await this.settings(scope);
    const source = await this.resolveAuditMappingSource(scope, dto);
    const auditTarget = await this.resolveAuditTarget(scope, dto, permissions);
    const patch = this.normalizeAuditMappingInput(scope, dto, source, auditTarget);
    this.validateAuditMapping(patch, settings, permissions);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mappings').insert({
      id,
      company_id: scope.companyId,
      ...patch,
      mapping_code: patch.mapping_code ?? await this.generateAuditMappingCode(scope),
      created_by: userId,
      updated_by: userId,
      created_at: now,
      updated_at: now
    }).select().single());
    await this.recalculateAuditMappingCoverage(userId, scope, row.id, { reason: 'Initial coverage calculation' }, [...permissions, 'regulatory.audit_mapping.coverage.recalculate']);
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping created', null, row, String(dto.reason ?? 'Audit mapping created'), { mappingId: row.id, auditTargetType: row.audit_target_type });
    return this.getAuditMapping(scope, row.id, [...permissions, 'regulatory.audit_mapping.view'], true);
  }

  async updateAuditMapping(userId: string, scope: Scope, mappingId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.edit');
    const before = await this.getAuditMapping(scope, mappingId, [...permissions, 'regulatory.audit_mapping.view']);
    if (this.isAuditMappingReadOnly(before) && !permissions.includes('regulatory.audit_mapping.refresh_snapshot')) throw new ForbiddenException(this.auditMappingReadOnlyReason(before) ?? 'Mapping is read-only.');
    const source = await this.resolveAuditMappingSource(scope, { ...before, ...dto });
    const auditTarget = await this.resolveAuditTarget(scope, { ...before, ...dto }, permissions);
    const patch = this.normalizeAuditMappingInput(scope, dto, source, auditTarget, before);
    this.validateAuditMapping({ ...before, ...patch }, await this.settings(scope), permissions);
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mappings').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', mappingId).select().single());
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping updated', before, row, String(dto.reason ?? 'Audit mapping updated'), { mappingId: row.id, auditTargetType: row.audit_target_type });
    if (row.stale_status !== 'Current') await this.markAuditMappingStale(userId, scope, row.id, { reason: 'Mapping edited and requires review', staleStatus: 'Needs Review' }, [...permissions, 'regulatory.audit_mapping.mark_stale']).catch(() => null);
    return this.getAuditMapping(scope, row.id, [...permissions, 'regulatory.audit_mapping.view'], true);
  }

  async verifyAuditMapping(userId: string, scope: Scope, mappingId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.verify');
    const before = await this.getAuditMapping(scope, mappingId, [...permissions, 'regulatory.audit_mapping.view']);
    const blockers = this.auditMappingBlockers(before);
    if (blockers.length && !permissions.includes('regulatory.audit_mapping.recalculate')) throw new BadRequestException(`Cannot verify mapping: ${blockers.map((b) => b.title).join(', ')}`);
    const now = new Date().toISOString();
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mappings').update({ mapping_status: 'Verified', verification_status: 'Verified', audit_readiness_status: 'Ready For Audit', reviewed_by: userId, reviewed_at: now, review_comment: dto.reviewComment ?? dto.comment ?? null, updated_by: userId, updated_at: now }).eq('company_id', scope.companyId).eq('id', mappingId).select().single());
    await this.writeAuditMappingReview(scope, userId, row, 'Verified', dto);
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping verified', before, row, String(dto.reason ?? 'Mapping verified'), { mappingId: row.id });
    return this.getAuditMapping(scope, row.id, [...permissions, 'regulatory.audit_mapping.view'], true);
  }

  async rejectAuditMapping(userId: string, scope: Scope, mappingId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.reject');
    const reason = String(dto.reason ?? dto.rejectionReason ?? '').trim();
    if (!reason) throw new BadRequestException('Rejecting an audit mapping requires a reason.');
    const before = await this.getAuditMapping(scope, mappingId, [...permissions, 'regulatory.audit_mapping.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mappings').update({ mapping_status: 'Rejected', verification_status: 'Rejected', audit_readiness_status: 'Not Ready For Audit', rejection_reason: reason, reviewed_by: userId, reviewed_at: new Date().toISOString(), updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', mappingId).select().single());
    await this.writeAuditMappingReview(scope, userId, row, 'Rejected', { ...dto, reason });
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping rejected', before, row, reason, { mappingId: row.id });
    return this.getAuditMapping(scope, row.id, [...permissions, 'regulatory.audit_mapping.view'], true);
  }

  async submitAuditMappingReview(userId: string, scope: Scope, mappingId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.review.submit');
    const before = await this.getAuditMapping(scope, mappingId, [...permissions, 'regulatory.audit_mapping.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mappings').update({ mapping_status: 'Pending Review', verification_status: 'Pending Review', reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id ?? before.reviewer_user_id ?? null, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', mappingId).select().single());
    await this.writeAuditMappingReview(scope, userId, row, 'Pending Review', dto);
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping submitted for review', before, row, String(dto.reason ?? 'Submitted for audit mapping review'), { mappingId: row.id });
    return this.getAuditMapping(scope, row.id, [...permissions, 'regulatory.audit_mapping.view'], true);
  }

  async recalculateAuditMappingCoverage(userId: string, scope: Scope, mappingId: string, dto: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.coverage.recalculate');
    const before = await this.getAuditMapping(scope, mappingId, [...permissions, 'regulatory.audit_mapping.view']);
    const status = this.deriveAuditCoverageStatus(before);
    const readiness = status === 'Covered' && before.verification_status === 'Verified' && before.stale_status === 'Current' ? 'Ready For Audit' : status === 'Coverage Gap' ? 'Not Ready For Audit' : before.audit_readiness_status ?? 'Not Ready For Audit';
    const trace = this.buildAuditCoverageTrace({ ...before, coverage_status: status, audit_readiness_status: readiness });
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mappings').update({ coverage_status: status, audit_readiness_status: readiness, coverage_score: this.auditCoverageScore(status), coverage_trace_json: trace, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', mappingId).select().single());
    await this.upsertAuditCoverageRecord(scope, userId, row);
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping coverage recalculated', before, row, String(dto.reason ?? 'Coverage recalculated'), { mappingId: row.id });
    return { mapping: row, coverage: await this.auditMappingCoverage(scope, { mappingId }, [...permissions, 'regulatory.audit_mapping.coverage.view']), blockers: this.auditMappingBlockers(row) };
  }

  async refreshAuditMappingSnapshot(userId: string, scope: Scope, mappingId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.refresh_snapshot');
    const before = await this.getAuditMapping(scope, mappingId, [...permissions, 'regulatory.audit_mapping.view']);
    const source = await this.resolveAuditMappingSource(scope, before);
    const auditTarget = await this.resolveAuditTarget(scope, before, permissions);
    const traceability = this.buildAuditTraceability(before, source, auditTarget);
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mappings').update({ source_snapshot_json: this.auditMappingSourceSnapshot(source), audit_target_snapshot_json: this.auditTargetSnapshot(auditTarget), traceability_snapshot_json: traceability, stale_status: 'Current', stale_reason: null, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', mappingId).select().single());
    await this.createAuditTraceabilitySnapshot(userId, scope, { mappingId, reason: dto.reason ?? 'Snapshot refreshed' }, [...permissions, 'regulatory.audit_mapping.traceability.view']).catch(() => null);
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping snapshot refreshed', before, row, String(dto.reason ?? 'Snapshot refreshed'), { mappingId: row.id });
    return this.getAuditMapping(scope, row.id, [...permissions, 'regulatory.audit_mapping.view'], true);
  }

  async markAuditMappingStale(userId: string, scope: Scope, mappingId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.mark_stale');
    const reason = String(dto.reason ?? dto.staleReason ?? '').trim();
    if (!reason) throw new BadRequestException('Marking audit mapping stale requires a reason.');
    const before = await this.getAuditMapping(scope, mappingId, [...permissions, 'regulatory.audit_mapping.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mappings').update({ stale_status: dto.staleStatus ?? dto.stale_status ?? 'Stale', stale_reason: reason, mapping_status: before.mapping_status === 'Verified' ? 'Stale' : before.mapping_status, audit_readiness_status: 'Not Ready For Audit', updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', mappingId).select().single());
    await this.db.single(this.db.from('regulatory_audit_mapping_staleness_events').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, mapping_id: row.id, stale_trigger_type: dto.staleTriggerType ?? dto.stale_trigger_type ?? 'Manual', source_module: dto.sourceModule ?? 'Regulatory Audit Mapping', source_record_id: dto.sourceRecordId ?? row.id, stale_reason: reason, created_by: userId }).select('id').single()).catch(() => null);
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping marked stale', before, row, reason, { mappingId: row.id });
    return this.getAuditMapping(scope, row.id, [...permissions, 'regulatory.audit_mapping.view'], true);
  }

  async archiveAuditMapping(userId: string, scope: Scope, mappingId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.archive');
    const reason = String(dto.reason ?? '').trim();
    if (!reason) throw new BadRequestException('Archiving audit mapping requires a reason.');
    const before = await this.getAuditMapping(scope, mappingId, [...permissions, 'regulatory.audit_mapping.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mappings').update({ mapping_status: 'Archived', archived_at: new Date().toISOString(), archived_by: userId, archive_reason: reason, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', mappingId).select().single());
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping archived', before, row, reason, { mappingId: row.id });
    return this.getAuditMapping(scope, row.id, [...permissions, 'regulatory.audit_mapping.view'], true);
  }

  async linkAuditMappingTarget(userId: string, scope: Scope, mappingId: string, linkType: string, dto: Row, permissions: string[]) {
    const permissionByType: Row = { 'Audit Program': 'regulatory.audit_mapping.link_audit_program', 'Audit Plan': 'regulatory.audit_mapping.link_audit_plan', 'Audit Checklist': 'regulatory.audit_mapping.link_checklist', 'Audit Execution': 'regulatory.audit_mapping.link_execution', 'Audit Finding': 'regulatory.audit_mapping.link_finding', 'Audit CAPA': 'regulatory.audit_mapping.link_capa', 'Audit Evidence': 'regulatory.audit_mapping.link_evidence', 'Audit Score': 'regulatory.audit_mapping.link_score' };
    this.requirePermission(permissions, permissionByType[linkType] ?? 'regulatory.audit_mapping.edit');
    const mapping = await this.getAuditMapping(scope, mappingId, [...permissions, 'regulatory.audit_mapping.view']);
    const targetType = dto.auditTargetType ?? dto.audit_target_type ?? linkType;
    const targetId = dto.auditTargetId ?? dto.audit_target_id ?? this.auditTargetIdFromDto({ ...dto, auditTargetType: targetType });
    if (!targetId) throw new BadRequestException('Audit target ID is required.');
    const target = await this.resolveAuditTarget(scope, { ...dto, auditTargetType: targetType, auditTargetId: targetId }, permissions);
    const now = new Date().toISOString();
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mapping_links').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: mapping.site_id ?? scope.selectedSiteId ?? null, mapping_id: mappingId, link_type: linkType, source_object_type: mapping.regulatory_source_type, source_object_id: this.auditMappingSourceId(mapping) ?? mappingId, target_object_type: targetType, target_object_id: target.id, link_status: 'Active', link_rationale: dto.linkRationale ?? dto.reason ?? null, source_snapshot_json: mapping.source_snapshot_json ?? null, target_snapshot_json: this.auditTargetSnapshot(target), created_by: userId, created_at: now }).select().single());
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping target linked', null, row, String(dto.reason ?? `${linkType} linked`), { mappingId, linkId: row.id, auditTargetType: targetType });
    await this.recalculateAuditMappingCoverage(userId, scope, mappingId, { reason: 'Linked audit target changed' }, [...permissions, 'regulatory.audit_mapping.coverage.recalculate']).catch(() => null);
    return row;
  }

  async removeAuditMappingLink(userId: string, scope: Scope, mappingId: string, linkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.edit');
    const before = await this.db.single<Row>(this.db.from('regulatory_audit_mapping_links').select('*').eq('company_id', scope.companyId).eq('mapping_id', mappingId).eq('id', linkId).maybeSingle());
    if (!before || !this.canAccessSite(scope, before.site_id)) throw new NotFoundException('Audit mapping link was not found.');
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mapping_links').update({ link_status: 'Removed', removed_at: new Date().toISOString(), removed_by: userId, remove_reason: dto.reason ?? 'Audit mapping link removed' }).eq('company_id', scope.companyId).eq('id', linkId).select().single());
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping target unlinked', before, row, String(dto.reason ?? 'Audit mapping link removed'), { mappingId, linkId });
    return row;
  }

  async auditMappingLinks(scope: Scope, mappingId: string, permissions: string[]) {
    await this.getAuditMapping(scope, mappingId, [...permissions, 'regulatory.audit_mapping.view']);
    const rows = (await this.db.many<Row>(this.db.from('regulatory_audit_mapping_links').select('*').eq('company_id', scope.companyId).eq('mapping_id', mappingId).is('removed_at', null).order('created_at', { ascending: false })).catch(() => [])).filter((row) => this.canAccessSite(scope, row.site_id));
    return { rows: rows.map((row) => this.redactAuditMappingLink(row, permissions)), summary: { totalLinks: rows.length, byType: this.groupRows(rows, 'link_type') } };
  }

  async auditMappingMatrix(scope: Scope, query: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.matrix.view');
    const [items, obligations, mappings, gaps] = await Promise.all([
      this.register(scope, { ...query, limit: 5000 }),
      this.obligationRegister(scope, { ...query, limit: 5000 }),
      this.auditMappings(scope, { ...query, limit: 5000 }, [...permissions, 'regulatory.audit_mapping.register.view']),
      this.auditMappingGaps(scope, { ...query, limit: 5000 }, [...permissions, 'regulatory.audit_mapping.gap.view'])
    ]);
    const mappingRows: Row[] = mappings.allRows ?? mappings.rows ?? [];
    const gapRows: Row[] = gaps.rows ?? [];
    const rows = (obligations.allRows ?? obligations.rows ?? []).map((obligation: Row) => {
      const rowMappings = mappingRows.filter((mapping: Row) => mapping.obligation_id === obligation.id || mapping.regulatory_item_id === obligation.regulatory_item_id);
      const rowGaps = gapRows.filter((gap: Row) => gap.obligation_id === obligation.id || gap.regulatory_item_id === obligation.regulatory_item_id);
      return { obligation, regulatoryItem: (items.allRows ?? items.rows ?? []).find((item: Row) => item.id === obligation.regulatory_item_id) ?? null, mappingCount: rowMappings.length, verifiedCount: rowMappings.filter((mapping: Row) => mapping.verification_status === 'Verified').length, coverageStatus: this.matrixCoverageStatus(rowMappings, rowGaps), readinessStatus: rowMappings.some((mapping: Row) => mapping.audit_readiness_status === 'Ready For Audit') ? 'Ready For Audit' : 'Not Ready For Audit', gapCount: rowGaps.filter((gap: Row) => gap.gap_status !== 'Resolved').length, mappings: rowMappings.map((mapping: Row) => this.redactAuditMapping(mapping, permissions)) };
    });
    return { rows, summary: { rows: rows.length, covered: rows.filter((row: Row) => row.coverageStatus === 'Covered').length, gaps: rows.reduce((sum: number, row: Row) => sum + row.gapCount, 0) } };
  }

  async auditMappingCoverage(scope: Scope, query: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.coverage.view');
    let q = this.db.from('regulatory_audit_coverage_records').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    q = this.applyAuditMappingScopeFilters(q, query);
    if (query.mappingId) q = q.eq('mapping_id', query.mappingId);
    const rows = (await this.db.many<Row>(q.order('calculated_at', { ascending: false }).limit(Number(query.limit ?? 500))).catch(() => [])).filter((row) => this.canAccessSite(scope, row.site_id));
    return { rows, summary: { total: rows.length, byCoverage: this.groupRows(rows, 'coverage_status'), byReadiness: this.groupRows(rows, 'audit_readiness_status') } };
  }

  async auditMappingTraceability(scope: Scope, query: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.traceability.view');
    let q = this.db.from('regulatory_audit_traceability_snapshots').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    q = this.applyAuditMappingScopeFilters(q, query);
    if (query.mappingId) q = q.eq('mapping_id', query.mappingId);
    const rows = (await this.db.many<Row>(q.order('created_at', { ascending: false }).limit(Number(query.limit ?? 100))).catch(() => [])).filter((row) => this.canAccessSite(scope, row.site_id));
    return { rows, summary: { totalSnapshots: rows.length, byStatus: this.groupRows(rows, 'snapshot_status') } };
  }

  async createAuditTraceabilitySnapshot(userId: string, scope: Scope, dto: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.traceability.view');
    const mapping = dto.mappingId ? await this.getAuditMapping(scope, String(dto.mappingId), [...permissions, 'regulatory.audit_mapping.view']) : null;
    const traceability = mapping ? this.buildAuditTraceability(mapping, mapping.source_snapshot_json ?? {}, mapping.audit_target_snapshot_json ?? {}) : { scope: dto, generatedAt: new Date().toISOString() };
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_traceability_snapshots').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: mapping?.site_id ?? scope.selectedSiteId ?? null, mapping_id: mapping?.id ?? null, regulatory_item_id: mapping?.regulatory_item_id ?? dto.regulatoryItemId ?? null, obligation_id: mapping?.obligation_id ?? dto.obligationId ?? null, snapshot_title: dto.snapshotTitle ?? mapping?.mapping_title ?? 'Regulatory audit traceability snapshot', snapshot_status: 'Current', traceability_json: traceability, snapshot_hash: this.simpleHash(JSON.stringify(traceability)), created_by: userId }).select().single());
    await this.writeAuditMappingMutation(scope, userId, 'Audit traceability snapshot created', null, row, String(dto.reason ?? 'Traceability snapshot created'), { mappingId: mapping?.id ?? null, snapshotId: row.id });
    return row;
  }

  async auditMappingGaps(scope: Scope, query: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.gap.view');
    let q = this.db.from('regulatory_audit_mapping_gaps').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    q = this.applyAuditMappingScopeFilters(q, query);
    if (query.mappingId) q = q.eq('mapping_id', query.mappingId);
    if (query.search) {
      const term = String(query.search).replace(/[%(),]/g, '');
      q = q.or(`gap_code.ilike.%${term}%,gap_title.ilike.%${term}%,gap_description.ilike.%${term}%`);
    }
    const rows = (await this.db.many<Row>(q.order('updated_at', { ascending: false }).limit(Number(query.limit ?? 500))).catch(() => [])).filter((row) => this.canAccessSite(scope, row.site_id));
    return { rows, summary: { total: rows.length, open: rows.filter((row) => row.gap_status === 'Open').length, resolved: rows.filter((row) => row.gap_status === 'Resolved').length, byType: this.groupRows(rows, 'gap_type'), bySeverity: this.groupRows(rows, 'gap_severity') } };
  }

  async detectAuditMappingGaps(userId: string, scope: Scope, dto: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.gap.create');
    const settings = await this.settings(scope);
    const [obligations, mappings] = await Promise.all([
      this.obligationRegister(scope, { ...dto, limit: 5000 }),
      this.auditMappings(scope, { ...dto, limit: 5000 }, [...permissions, 'regulatory.audit_mapping.register.view'])
    ]);
    const rows = this.detectAuditMappingGapRows(obligations.allRows ?? obligations.rows ?? [], mappings.allRows ?? mappings.rows ?? [], settings);
    const inserted: Row[] = [];
    for (const gap of rows) {
      const exists = await this.db.single<Row>(this.db.from('regulatory_audit_mapping_gaps').select('id').eq('company_id', scope.companyId).eq('gap_type', gap.gap_type).eq('obligation_id', gap.obligation_id).neq('gap_status', 'Resolved').maybeSingle()).catch(() => null);
      if (exists) continue;
      const row = await this.db.single<Row>(this.db.from('regulatory_audit_mapping_gaps').insert({ ...gap, gap_code: await this.generateAuditMappingCode(scope, 'RAM-GAP'), created_by: userId, updated_by: userId }).select().single());
      inserted.push(row);
      await this.writeAuditMappingMutation(scope, userId, 'Audit mapping gap detected', null, row, 'Backend detected missing audit mapping coverage', { gapId: row.id });
    }
    return { created: inserted.length, rows: inserted };
  }

  async createAuditMappingGap(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.gap.create');
    if (!String(dto.gapTitle ?? dto.gap_title ?? '').trim()) throw new BadRequestException('Gap title is required.');
    const source: Row = await this.resolveAuditMappingSource(scope, dto).catch(() => ({} as Row));
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mapping_gaps').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: source.site_id ?? dto.siteId ?? dto.site_id ?? scope.selectedSiteId ?? null,
      regulatory_item_id: source.regulatory_item_id ?? dto.regulatoryItemId ?? dto.regulatory_item_id ?? null,
      obligation_id: source.obligation_id ?? dto.obligationId ?? dto.obligation_id ?? null,
      compliance_assessment_id: source.compliance_assessment_id ?? dto.complianceAssessmentId ?? dto.compliance_assessment_id ?? null,
      compliance_gap_id: source.compliance_gap_id ?? dto.complianceGapId ?? dto.compliance_gap_id ?? null,
      mapping_id: dto.mappingId ?? dto.mapping_id ?? null,
      audit_target_type: dto.auditTargetType ?? dto.audit_target_type ?? null,
      audit_target_id: dto.auditTargetId ?? dto.audit_target_id ?? null,
      gap_code: dto.gapCode ?? dto.gap_code ?? await this.generateAuditMappingCode(scope, 'RAM-GAP'),
      gap_type: dto.gapType ?? dto.gap_type ?? 'Other',
      gap_title: dto.gapTitle ?? dto.gap_title,
      gap_description: dto.gapDescription ?? dto.gap_description ?? null,
      gap_status: dto.gapStatus ?? dto.gap_status ?? 'Open',
      gap_severity: dto.gapSeverity ?? dto.gap_severity ?? 'Medium',
      recommended_fix: dto.recommendedFix ?? dto.recommended_fix ?? null,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? null,
      due_date: dto.dueDate ?? dto.due_date ?? null,
      created_by: userId,
      updated_by: userId
    }).select().single());
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping gap created', null, row, String(dto.reason ?? 'Audit mapping gap created'), { gapId: row.id });
    return row;
  }

  async getAuditMappingGap(scope: Scope, gapId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.gap.view');
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mapping_gaps').select('*').eq('company_id', scope.companyId).eq('id', gapId).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Audit mapping gap was not found.');
    return row;
  }

  async updateAuditMappingGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.gap.edit');
    const before = await this.getAuditMappingGap(scope, gapId, [...permissions, 'regulatory.audit_mapping.gap.view']);
    const patch = this.pickMapped(dto, { gapTitle: 'gap_title', gap_title: 'gap_title', gapType: 'gap_type', gap_type: 'gap_type', gapDescription: 'gap_description', gap_description: 'gap_description', gapStatus: 'gap_status', gap_status: 'gap_status', gapSeverity: 'gap_severity', gap_severity: 'gap_severity', recommendedFix: 'recommended_fix', recommended_fix: 'recommended_fix', ownerUserId: 'owner_user_id', owner_user_id: 'owner_user_id', dueDate: 'due_date', due_date: 'due_date' });
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mapping_gaps').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', gapId).select().single());
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping gap updated', before, row, String(dto.reason ?? 'Audit mapping gap updated'), { gapId: row.id });
    return row;
  }

  async resolveAuditMappingGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.gap.resolve');
    const reason = String(dto.reason ?? dto.resolutionNotes ?? dto.resolution_notes ?? '').trim();
    if (!reason) throw new BadRequestException('Resolving an audit mapping gap requires notes.');
    const before = await this.getAuditMappingGap(scope, gapId, [...permissions, 'regulatory.audit_mapping.gap.view']);
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mapping_gaps').update({ gap_status: 'Resolved', resolved_by: userId, resolved_at: new Date().toISOString(), resolution_notes: reason, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', gapId).select().single());
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping gap resolved', before, row, reason, { gapId: row.id });
    return row;
  }

  async archiveAuditMappingGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.gap.edit');
    return this.updateAuditMappingGap(userId, scope, gapId, { ...dto, gapStatus: 'Archived', reason: dto.reason ?? 'Gap archived' }, permissions);
  }

  async createActionFoundationForAuditMappingGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.gap.create_action_foundation');
    const before = await this.getAuditMappingGap(scope, gapId, [...permissions, 'regulatory.audit_mapping.gap.view']);
    const actionFoundationId = dto.actionFoundationId ?? dto.action_foundation_id ?? crypto.randomUUID();
    const row = await this.db.single<Row>(this.db.from('regulatory_audit_mapping_gaps').update({ action_foundation_id: actionFoundationId, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', gapId).select().single());
    await this.writeAuditMappingMutation(scope, userId, 'Audit mapping gap action foundation created', before, row, String(dto.reason ?? 'Action foundation created for audit mapping gap'), { gapId: row.id, actionFoundationId });
    return { gap: row, actionFoundation: { id: actionFoundationId, source: 'Universal Action Engine foundation adapter', status: 'Linked Foundation' } };
  }

  async auditMappingHistory(scope: Scope, query: Row = {}, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.history.view');
    let q = this.db.from('regulatory_audit_mapping_history_events').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    q = this.applyAuditMappingScopeFilters(q, query);
    if (query.mappingId) q = q.eq('mapping_id', query.mappingId);
    const rows = (await this.db.many<Row>(q.order('created_at', { ascending: false }).limit(Number(query.limit ?? 100))).catch(() => [])).filter((row) => this.canAccessSite(scope, row.site_id));
    return { rows, summary: { totalEvents: rows.length, byType: this.groupRows(rows, 'event_type') } };
  }

  auditMappingSettings(scope: Scope) {
    return this.settings(scope);
  }

  updateAuditMappingSettings(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.settings.edit');
    return this.updateSettings(userId, scope, dto, [...permissions, 'regulatory.settings.edit']);
  }

  sourceAuditMappings(scope: Scope, sourceType: 'item' | 'obligation' | 'complianceAssessment' | 'complianceGap' | 'evidenceLink' | 'evidencePackage', sourceId: string, query: Row, permissions: string[]) {
    const map: Row = { item: 'regulatoryItemId', obligation: 'obligationId', complianceAssessment: 'complianceAssessmentId', complianceGap: 'complianceGapId', evidenceLink: 'evidenceLinkId', evidencePackage: 'evidencePackageId' };
    return this.auditMappings(scope, { ...query, [map[sourceType]]: sourceId }, permissions);
  }

  createSourceAuditMapping(userId: string, scope: Scope, sourceType: 'item' | 'obligation', sourceId: string, dto: Row, permissions: string[]) {
    return this.createAuditMapping(userId, scope, { ...dto, [sourceType === 'item' ? 'regulatoryItemId' : 'obligationId']: sourceId, regulatorySourceType: sourceType === 'item' ? 'Regulatory Item' : 'Regulatory Obligation' }, permissions);
  }

  sourceAuditCoverage(scope: Scope, sourceType: 'item' | 'obligation', sourceId: string, query: Row, permissions: string[]) {
    return this.auditMappingCoverage(scope, { ...query, [sourceType === 'item' ? 'regulatoryItemId' : 'obligationId']: sourceId }, permissions);
  }

  sourceAuditTraceability(scope: Scope, sourceType: 'item' | 'obligation', sourceId: string, query: Row, permissions: string[]) {
    return this.auditMappingTraceability(scope, { ...query, [sourceType === 'item' ? 'regulatoryItemId' : 'obligationId']: sourceId }, permissions);
  }

  sourceAuditGaps(scope: Scope, sourceType: 'item' | 'obligation', sourceId: string, query: Row, permissions: string[]) {
    return this.auditMappingGaps(scope, { ...query, [sourceType === 'item' ? 'regulatoryItemId' : 'obligationId']: sourceId }, permissions);
  }

  auditSourceRegulatoryMapping(scope: Scope, kind: string, id: string, query: Row, permissions: string[]) {
    return this.auditMappings(scope, { ...query, [kind]: id }, permissions);
  }

  scopedAuditMappings(scope: Scope, kind: 'siteId' | 'unitId' | 'areaId' | 'equipmentId', id: string, query: Row, permissions: string[]) {
    return this.auditMappings(scope, { ...query, [kind]: id }, permissions);
  }

  async applicabilityDashboard(scope: Scope, query: Row = {}) {
    const assessments = await this.applicabilityAssessments(scope, { ...query, limit: 5000 });
    const rows = assessments.allRows ?? assessments.rows;
    const gaps = await this.applicabilityGaps(scope, { limit: 5000 });
    return {
      summary: this.applicabilitySummaryFromRows(rows, gaps.rows),
      byStatus: this.groupRows(rows, 'applicability_status'),
      byAssessmentStatus: this.groupRows(rows, 'assessment_status'),
      byJurisdiction: this.groupRows(rows, 'jurisdiction_id'),
      staleAssessments: rows.filter((row) => row.stale || row.applicability_status === 'Stale Applicability').slice(0, 10),
      missingRationale: rows.filter((row) => this.decisionNeedsRationale(row.applicability_status) && !row.rationale).slice(0, 10),
      openGaps: gaps.rows.filter((gap) => gap.gap_status !== 'Resolved').slice(0, 10)
    };
  }

  async applicabilitySummary(scope: Scope, query: Row = {}) {
    const dashboard = await this.applicabilityDashboard(scope, query);
    return dashboard.summary;
  }

  async applicabilityMatrix(scope: Scope, query: Row = {}) {
    const [items, assessments] = await Promise.all([
      this.register(scope, { ...query, limit: 5000 }),
      this.applicabilityAssessments(scope, { ...query, limit: 5000 })
    ]);
    const assessmentByItem = new Map((assessments.allRows ?? assessments.rows).map((row: Row) => [row.regulatory_item_id, row]));
    const rows = (items.allRows ?? items.rows).map((item: Row) => {
      const assessment = assessmentByItem.get(item.id) ?? null;
      return {
        regulatoryItem: item,
        jurisdiction: assessment?.jurisdiction ?? null,
        site_id: item.site_id,
        unit_id: item.unit_id,
        area_id: item.area_id,
        equipment_id: item.equipment_id,
        process_system: item.process_system,
        chemical_substance: item.chemical_substance,
        activity_operation: item.activity_operation,
        applicability_status: assessment?.applicability_status ?? item.applicability_status ?? 'Not Assessed',
        rationale: assessment?.rationale ?? item.applicability_rationale ?? null,
        last_assessed_at: assessment?.last_assessed_at ?? null,
        next_review_date: assessment?.next_review_date ?? item.next_review_date ?? null,
        stale: Boolean(assessment?.stale),
        gap_count: assessment?.gap_count ?? 0
      };
    });
    return { rows, total: rows.length, views: ['Requirement vs Site / Unit / Equipment', 'Jurisdiction vs Site', 'Category vs Site', 'Criticality vs Site', 'PSM Element vs Unit'] };
  }

  async applicabilityFiltered(scope: Scope, view: string, query: Row = {}) {
    const map: Row = {
      'not-assessed': { applicabilityStatus: 'Not Assessed' },
      applicable: { applicabilityStatus: 'Applicable' },
      'partially-applicable': { applicabilityStatus: 'Partially Applicable' },
      'not-applicable': { applicabilityStatus: 'Not Applicable' },
      'under-review': { applicabilityStatus: 'Applicability Under Review' },
      stale: { stale: 'true' },
      'missing-rationale': { missingRationale: 'true' }
    };
    return this.applicabilityAssessments(scope, { ...query, ...(map[view] ?? {}) });
  }

  async applicabilityProfiles(scope: Scope, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    let q = this.db.from('regulatory_applicability_profiles').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.profileStatus) q = q.eq('profile_status', query.profileStatus);
    if (query.profileType) q = q.eq('profile_type', query.profileType);
    if (query.search) q = q.or(`profile_name.ilike.%${query.search}%,profile_code.ilike.%${query.search}%`);
    const allRows = await this.db.many<Row>(q.order('updated_at', { ascending: false }));
    const rows = allRows.slice((page - 1) * limit, page * limit);
    return { rows, allRows, total: allRows.length, page, limit };
  }

  async createApplicabilityProfile(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.profile.create');
    if (!String(dto.profileName ?? dto.profile_name ?? '').trim()) throw new BadRequestException('Applicability profile name is required.');
    if (!String(dto.profileType ?? dto.profile_type ?? '').trim()) throw new BadRequestException('Applicability profile type is required.');
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_profiles').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: dto.siteId ?? dto.site_id ?? null,
      profile_code: dto.profileCode ?? dto.profile_code ?? null,
      profile_name: dto.profileName ?? dto.profile_name,
      profile_type: dto.profileType ?? dto.profile_type,
      profile_description: dto.profileDescription ?? dto.profile_description ?? null,
      category: dto.category ?? null,
      criticality: dto.criticality ?? null,
      jurisdiction_id: dto.jurisdictionId ?? dto.jurisdiction_id ?? null,
      authority_id: dto.authorityId ?? dto.authority_id ?? null,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? null,
      profile_status: dto.profileStatus ?? dto.profile_status ?? 'Draft',
      review_frequency: dto.reviewFrequency ?? dto.review_frequency ?? null,
      next_review_date: dto.nextReviewDate ?? dto.next_review_date ?? null,
      created_by: userId,
      updated_by: userId
    }).select().single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability profile created', null, null, row, 'Applicability profile created');
    return row;
  }

  async getApplicabilityProfile(scope: Scope, profileId: string) {
    const profile = await this.db.single<Row>(this.db.from('regulatory_applicability_profiles').select('*').eq('company_id', scope.companyId).eq('id', profileId).maybeSingle());
    if (!profile || !this.canAccessSite(scope, profile.site_id)) throw new NotFoundException('Applicability profile was not found or is outside your company/site scope.');
    const criteria = await this.profileCriteria(scope, profileId);
    return { profile, criteria: criteria.rows };
  }

  async updateApplicabilityProfile(userId: string, scope: Scope, profileId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.profile.edit');
    const before = await this.getApplicabilityProfile(scope, profileId);
    const patch = this.pickMapped(dto, {
      profileCode: 'profile_code', profile_code: 'profile_code',
      profileName: 'profile_name', profile_name: 'profile_name',
      profileType: 'profile_type', profile_type: 'profile_type',
      profileDescription: 'profile_description', profile_description: 'profile_description',
      category: 'category', criticality: 'criticality',
      jurisdictionId: 'jurisdiction_id', jurisdiction_id: 'jurisdiction_id',
      authorityId: 'authority_id', authority_id: 'authority_id',
      ownerUserId: 'owner_user_id', owner_user_id: 'owner_user_id',
      profileStatus: 'profile_status', profile_status: 'profile_status',
      reviewFrequency: 'review_frequency', review_frequency: 'review_frequency',
      nextReviewDate: 'next_review_date', next_review_date: 'next_review_date'
    });
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_profiles').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', profileId).select().single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability profile updated', null, before.profile, row, String(dto.reason ?? 'Profile updated'));
    return this.getApplicabilityProfile(scope, profileId);
  }

  async archiveApplicabilityProfile(userId: string, scope: Scope, profileId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.profile.archive');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive requires a reason.');
    const before = await this.getApplicabilityProfile(scope, profileId);
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_profiles').update({ profile_status: 'Archived', archived_at: new Date().toISOString(), archived_by: userId, archive_reason: dto.reason, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', profileId).select().single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability profile archived', null, before.profile, row, dto.reason);
    return row;
  }

  async reactivateApplicabilityProfile(userId: string, scope: Scope, profileId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.profile.edit');
    const before = await this.getApplicabilityProfile(scope, profileId);
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_profiles').update({ profile_status: 'Active', archived_at: null, archived_by: null, archive_reason: null, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', profileId).select().single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability profile reactivated', null, before.profile, row, String(dto.reason ?? 'Profile reactivated'));
    return row;
  }

  async profileCriteria(scope: Scope, profileId: string) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_applicability_criteria').select('*').eq('company_id', scope.companyId).eq('profile_id', profileId).order('sequence_no'));
    return { rows };
  }

  async createProfileCriterion(userId: string, scope: Scope, profileId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.criteria.manage');
    await this.getApplicabilityProfile(scope, profileId);
    if (!String(dto.questionText ?? dto.question_text ?? '').trim()) throw new BadRequestException('Criterion question text is required.');
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_criteria').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: dto.siteId ?? dto.site_id ?? null, profile_id: profileId, sequence_no: Number(dto.sequenceNo ?? dto.sequence_no ?? 1), question_text: dto.questionText ?? dto.question_text, question_type: dto.questionType ?? dto.question_type ?? 'Yes / No', help_text: dto.helpText ?? dto.help_text ?? null, required: Boolean(dto.required), effect: dto.effect ?? 'No Decision Effect', options_json: dto.optionsJson ?? dto.options_json ?? null, created_by: userId, updated_by: userId }).select().single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability criterion created', null, null, row, 'Criterion created');
    return row;
  }

  async updateProfileCriterion(userId: string, scope: Scope, criterionId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.criteria.manage');
    const before = await this.db.single<Row>(this.db.from('regulatory_applicability_criteria').select('*').eq('company_id', scope.companyId).eq('id', criterionId).maybeSingle());
    if (!before || !this.canAccessSite(scope, before.site_id)) throw new NotFoundException('Applicability criterion was not found.');
    const patch = this.pickMapped(dto, { sequenceNo: 'sequence_no', sequence_no: 'sequence_no', questionText: 'question_text', question_text: 'question_text', questionType: 'question_type', question_type: 'question_type', helpText: 'help_text', help_text: 'help_text', required: 'required', effect: 'effect', optionsJson: 'options_json', options_json: 'options_json' });
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_criteria').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', criterionId).select().single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability criterion updated', null, before, row, String(dto.reason ?? 'Criterion updated'));
    return row;
  }

  async deleteProfileCriterion(userId: string, scope: Scope, criterionId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.criteria.manage');
    const before = await this.db.single<Row>(this.db.from('regulatory_applicability_criteria').select('*').eq('company_id', scope.companyId).eq('id', criterionId).maybeSingle());
    if (!before || !this.canAccessSite(scope, before.site_id)) throw new NotFoundException('Applicability criterion was not found.');
    await this.db.single<Row>(this.db.from('regulatory_applicability_criteria').delete().eq('company_id', scope.companyId).eq('id', criterionId).select('id').single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability criterion deleted', null, before, null, 'Criterion deleted');
    return { ok: true };
  }

  async reorderProfileCriteria(userId: string, scope: Scope, profileId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.criteria.manage');
    await this.getApplicabilityProfile(scope, profileId);
    const ordered = Array.isArray(dto.criteria) ? dto.criteria : [];
    for (const [index, criterion] of ordered.entries()) {
      await this.db.single(this.db.from('regulatory_applicability_criteria').update({ sequence_no: index + 1, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('profile_id', profileId).eq('id', criterion.id).select('id').single()).catch(() => null);
    }
    await this.writeApplicabilityMutation(scope, userId, 'Applicability criteria reordered', null, null, { profileId, ordered }, 'Criteria reordered');
    return this.profileCriteria(scope, profileId);
  }

  async applicabilityAssessments(scope: Scope, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    let q = this.db.from('regulatory_applicability_assessments').select('*,item:regulatory_register_items(*),jurisdiction:regulatory_jurisdictions(*),profile:regulatory_applicability_profiles(*)').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.regulatoryItemId) q = q.eq('regulatory_item_id', query.regulatoryItemId);
    if (query.jurisdictionId) q = q.eq('jurisdiction_id', query.jurisdictionId);
    if (query.applicabilityStatus) q = q.eq('applicability_status', query.applicabilityStatus);
    if (query.assessmentStatus) q = q.eq('assessment_status', query.assessmentStatus);
    if (query.stale === 'true') q = q.eq('stale', true);
    if (query.search) q = q.or(`assessment_title.ilike.%${query.search}%,assessment_number.ilike.%${query.search}%`);
    const allRowsRaw = await this.db.many<Row>(q.order('updated_at', { ascending: false }));
    const allRows = allRowsRaw.filter((row) => this.matchesApplicabilityDerivedFilters(row, query));
    const rows = allRows.slice((page - 1) * limit, page * limit);
    return { rows, allRows, total: allRows.length, page, limit, summary: this.applicabilitySummaryFromRows(allRows, []) };
  }

  async createApplicabilityAssessment(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.assessment.create');
    const itemId = String(dto.regulatoryItemId ?? dto.regulatory_item_id ?? '');
    if (!itemId) throw new BadRequestException('Regulatory item is required.');
    const item = await this.getItem(scope, itemId) as Row;
    const now = new Date().toISOString();
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_assessments').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: dto.siteId ?? dto.site_id ?? item.site_id ?? scope.selectedSiteId ?? null,
      regulatory_item_id: itemId,
      jurisdiction_id: dto.jurisdictionId ?? dto.jurisdiction_id ?? null,
      profile_id: dto.profileId ?? dto.profile_id ?? null,
      assessment_number: dto.assessmentNumber ?? dto.assessment_number ?? await this.generateAssessmentNumber(scope),
      assessment_title: dto.assessmentTitle ?? dto.assessment_title ?? `Applicability assessment - ${item.requirement_code ?? item.requirement_title}`,
      assessment_method: dto.assessmentMethod ?? dto.assessment_method ?? 'Manual Assessment',
      assessment_status: dto.assessmentStatus ?? dto.assessment_status ?? 'Draft',
      applicability_status: dto.applicabilityStatus ?? dto.applicability_status ?? 'Not Assessed',
      rationale: dto.rationale ?? null,
      included_scope: dto.includedScope ?? dto.included_scope ?? null,
      excluded_scope: dto.excludedScope ?? dto.excluded_scope ?? null,
      scope_summary_json: dto.scopeSummaryJson ?? dto.scope_summary_json ?? this.itemScopeSnapshot(item),
      criteria_snapshot_json: dto.criteriaSnapshotJson ?? dto.criteria_snapshot_json ?? null,
      source_snapshot_json: { item },
      review_required: Boolean(dto.reviewRequired ?? dto.review_required),
      next_review_date: dto.nextReviewDate ?? dto.next_review_date ?? null,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? item.owner_user_id ?? null,
      created_by: userId,
      updated_by: userId,
      created_at: now,
      updated_at: now
    }).select().single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability assessment created', itemId, null, row, 'Assessment created');
    await this.detectApplicabilityGaps(userId, scope, { assessmentId: row.id, regulatoryItemId: itemId }, [...permissions, 'regulatory.applicability.gap.manage']).catch(() => null);
    return this.getApplicabilityAssessment(scope, row.id);
  }

  async getApplicabilityAssessment(scope: Scope, assessmentId: string) {
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_assessments').select('*,item:regulatory_register_items(*),jurisdiction:regulatory_jurisdictions(*),profile:regulatory_applicability_profiles(*)').eq('company_id', scope.companyId).eq('id', assessmentId).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Applicability assessment was not found or is outside your company/site scope.');
    const [answers, scopeLinks, decisions, gaps, history] = await Promise.all([
      this.db.many<Row>(this.db.from('regulatory_applicability_answers').select('*').eq('company_id', scope.companyId).eq('assessment_id', assessmentId).order('answered_at', { ascending: false })).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_applicability_scope_links').select('*').eq('company_id', scope.companyId).eq('assessment_id', assessmentId).is('removed_at', null)).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_applicability_decisions').select('*').eq('company_id', scope.companyId).eq('assessment_id', assessmentId).order('decided_at', { ascending: false })).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_applicability_gaps').select('*').eq('company_id', scope.companyId).eq('assessment_id', assessmentId).order('created_at', { ascending: false })).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_applicability_history_events').select('*').eq('company_id', scope.companyId).eq('assessment_id', assessmentId).order('created_at', { ascending: false }).limit(100)).catch(() => [])
    ]);
    return { assessment: row, answers, scopeLinks, decisions, gaps, history, readiness: this.assessmentReadiness(row, gaps) };
  }

  async updateApplicabilityAssessment(userId: string, scope: Scope, assessmentId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.assessment.edit');
    const before = await this.getApplicabilityAssessment(scope, assessmentId);
    const patch = this.pickMapped(dto, {
      jurisdictionId: 'jurisdiction_id', jurisdiction_id: 'jurisdiction_id',
      profileId: 'profile_id', profile_id: 'profile_id',
      assessmentTitle: 'assessment_title', assessment_title: 'assessment_title',
      assessmentMethod: 'assessment_method', assessment_method: 'assessment_method',
      assessmentStatus: 'assessment_status', assessment_status: 'assessment_status',
      rationale: 'rationale', includedScope: 'included_scope', included_scope: 'included_scope',
      excludedScope: 'excluded_scope', excluded_scope: 'excluded_scope',
      scopeSummaryJson: 'scope_summary_json', scope_summary_json: 'scope_summary_json',
      reviewRequired: 'review_required', review_required: 'review_required',
      nextReviewDate: 'next_review_date', next_review_date: 'next_review_date',
      ownerUserId: 'owner_user_id', owner_user_id: 'owner_user_id'
    });
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_assessments').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', assessmentId).select().single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability assessment updated', row.regulatory_item_id, before.assessment, row, String(dto.reason ?? 'Assessment updated'));
    return this.getApplicabilityAssessment(scope, assessmentId);
  }

  async answerApplicabilityAssessment(userId: string, scope: Scope, assessmentId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.assessment.edit');
    const detail = await this.getApplicabilityAssessment(scope, assessmentId);
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_answers').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: detail.assessment.site_id ?? null, assessment_id: assessmentId, criterion_id: dto.criterionId ?? dto.criterion_id ?? null, question_text: dto.questionText ?? dto.question_text ?? null, answer_value: dto.answerValue ?? dto.answer_value ?? null, answer_json: dto.answerJson ?? dto.answer_json ?? null, rationale: dto.rationale ?? null, answered_by: userId }).select().single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability answer saved', detail.assessment.regulatory_item_id, null, row, 'Assessment answer saved');
    return row;
  }

  async runApplicabilityGapCheck(userId: string, scope: Scope, assessmentId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.gap.manage');
    const detail = await this.getApplicabilityAssessment(scope, assessmentId);
    return this.detectApplicabilityGaps(userId, scope, { assessmentId, regulatoryItemId: detail.assessment.regulatory_item_id }, permissions);
  }

  async saveApplicabilityDecision(userId: string, scope: Scope, assessmentId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.decision.make');
    const detail = await this.getApplicabilityAssessment(scope, assessmentId);
    const decision = String(dto.decision ?? dto.applicabilityStatus ?? dto.applicability_status ?? '');
    if (!decision) throw new BadRequestException('Applicability decision is required.');
    const settings = await this.settings(scope);
    const rationale = String(dto.rationale ?? '').trim();
    if (this.decisionNeedsRationale(decision, settings) && !rationale) throw new BadRequestException(`${decision} requires a rationale.`);
    if (decision === 'Partially Applicable' && (!String(dto.includedScope ?? dto.included_scope ?? '').trim() || !String(dto.excludedScope ?? dto.excluded_scope ?? '').trim())) throw new BadRequestException('Partially Applicable requires included and excluded scope.');
    const snapshot = { assessment: detail.assessment, answers: detail.answers, scopeLinks: detail.scopeLinks, gaps: detail.gaps, decision, rationale };
    await this.db.many<Row>(this.db.from('regulatory_applicability_decisions').update({ superseded_at: new Date().toISOString(), superseded_by: userId }).eq('company_id', scope.companyId).eq('assessment_id', assessmentId).is('superseded_at', null)).catch(() => []);
    const decisionRow = await this.db.single<Row>(this.db.from('regulatory_applicability_decisions').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: detail.assessment.site_id ?? null, assessment_id: assessmentId, regulatory_item_id: detail.assessment.regulatory_item_id, decision, rationale, included_scope: dto.includedScope ?? dto.included_scope ?? null, excluded_scope: dto.excludedScope ?? dto.excluded_scope ?? null, decision_snapshot_json: snapshot, decided_by: userId, review_required: this.criticalDecisionNeedsReview(detail.assessment.item, decision, settings) }).select().single());
    const assessmentPatch = { applicability_status: decision, rationale, included_scope: dto.includedScope ?? dto.included_scope ?? null, excluded_scope: dto.excludedScope ?? dto.excluded_scope ?? null, assessment_status: dto.submit ? 'Under Review' : 'Completed Foundation', review_required: decisionRow.review_required, stale: false, stale_reason: null, last_assessed_at: new Date().toISOString(), updated_by: userId, updated_at: new Date().toISOString() };
    await this.db.single<Row>(this.db.from('regulatory_applicability_assessments').update(assessmentPatch).eq('company_id', scope.companyId).eq('id', assessmentId).select().single());
    if (detail.assessment.regulatory_item_id) {
      await this.statusPatch(userId, scope, detail.assessment.regulatory_item_id, { applicability_status: decision, applicability_rationale: rationale }, rationale || decision, 'Applicability decision saved').catch(() => null);
    }
    await this.writeApplicabilityMutation(scope, userId, 'Applicability decision saved', detail.assessment.regulatory_item_id, detail.assessment, { ...assessmentPatch, decisionRow }, rationale || decision);
    await this.detectApplicabilityGaps(userId, scope, { assessmentId, regulatoryItemId: detail.assessment.regulatory_item_id }, [...permissions, 'regulatory.applicability.gap.manage']).catch(() => null);
    return this.getApplicabilityAssessment(scope, assessmentId);
  }

  async submitApplicabilityReview(userId: string, scope: Scope, assessmentId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.assessment.submit');
    const detail = await this.getApplicabilityAssessment(scope, assessmentId);
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_assessments').update({ assessment_status: 'Under Review', submitted_by: userId, submitted_at: new Date().toISOString(), updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', assessmentId).select().single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability assessment submitted', detail.assessment.regulatory_item_id, detail.assessment, row, String(dto.reason ?? 'Assessment submitted for review'));
    return this.getApplicabilityAssessment(scope, assessmentId);
  }

  async markApplicabilityStale(userId: string, scope: Scope, assessmentId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.assessment.edit');
    const detail = await this.getApplicabilityAssessment(scope, assessmentId);
    const reason = String(dto.reason ?? dto.staleReason ?? 'Source data changed');
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_assessments').update({ stale: true, stale_reason: reason, stale_at: new Date().toISOString(), applicability_status: 'Stale Applicability', updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', assessmentId).select().single());
    await this.db.single(this.db.from('regulatory_applicability_staleness_events').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, assessment_id: assessmentId, regulatory_item_id: row.regulatory_item_id ?? null, stale_reason: reason, source_change_type: dto.sourceChangeType ?? dto.source_change_type ?? null, source_record_id: dto.sourceRecordId ?? dto.source_record_id ?? null }).select('id').single()).catch(() => null);
    await this.writeApplicabilityMutation(scope, userId, 'Applicability marked stale', detail.assessment.regulatory_item_id, detail.assessment, row, reason);
    return this.getApplicabilityAssessment(scope, assessmentId);
  }

  async archiveApplicabilityAssessment(userId: string, scope: Scope, assessmentId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.assessment.archive');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive requires a reason.');
    const detail = await this.getApplicabilityAssessment(scope, assessmentId);
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_assessments').update({ assessment_status: 'Archived', archived_at: new Date().toISOString(), archived_by: userId, archive_reason: dto.reason, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', assessmentId).select().single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability assessment archived', detail.assessment.regulatory_item_id, detail.assessment, row, dto.reason);
    return row;
  }

  assessmentQuestions(scope: Scope, assessmentId: string) {
    return this.getApplicabilityAssessment(scope, assessmentId).then(async (detail) => {
      const criteria = detail.assessment.profile_id ? await this.profileCriteria(scope, detail.assessment.profile_id) : { rows: [] };
      return { rows: criteria.rows, answers: detail.answers };
    });
  }

  assessmentScope(scope: Scope, assessmentId: string) {
    return this.getApplicabilityAssessment(scope, assessmentId).then((detail) => ({ assessment: detail.assessment, rows: detail.scopeLinks, snapshot: detail.assessment.scope_summary_json }));
  }

  assessmentDecision(scope: Scope, assessmentId: string) {
    return this.getApplicabilityAssessment(scope, assessmentId).then((detail) => ({ assessment: detail.assessment, rows: detail.decisions }));
  }

  assessmentGaps(scope: Scope, assessmentId: string) {
    return this.getApplicabilityAssessment(scope, assessmentId).then((detail) => ({ assessment: detail.assessment, rows: detail.gaps }));
  }

  assessmentHistory(scope: Scope, assessmentId: string) {
    return this.getApplicabilityAssessment(scope, assessmentId).then((detail) => ({ assessment: detail.assessment, rows: detail.history }));
  }

  async itemApplicability(scope: Scope, regulationId: string) {
    const overview = await this.overview(scope, regulationId);
    const assessments = await this.applicabilityAssessments(scope, { regulatoryItemId: regulationId, limit: 100 });
    const gaps = await this.applicabilityGaps(scope, { regulatoryItemId: regulationId, limit: 100 });
    return { ...overview, assessments: assessments.rows, gaps: gaps.rows, section: 'applicability' };
  }

  createItemApplicabilityAssessment(userId: string, scope: Scope, regulationId: string, dto: Row, permissions: string[]) {
    return this.createApplicabilityAssessment(userId, scope, { ...dto, regulatoryItemId: regulationId }, permissions);
  }

  saveItemApplicabilityDecision(userId: string, scope: Scope, regulationId: string, dto: Row, permissions: string[]) {
    return this.createApplicabilityAssessment(userId, scope, { regulatoryItemId: regulationId, assessmentTitle: dto.assessmentTitle ?? 'Direct applicability decision' }, [...permissions, 'regulatory.applicability.assessment.create'])
      .then((detail) => this.saveApplicabilityDecision(userId, scope, detail.assessment.id, dto, permissions));
  }

  itemApplicabilityJurisdictions(scope: Scope, regulationId: string) {
    return this.itemJurisdictions(scope, regulationId);
  }

  scopedApplicability(scope: Scope, field: 'siteId' | 'unitId' | 'areaId' | 'equipmentId', id: string, query: Row = {}) {
    const map: Row = { siteId: 'site_id', unitId: 'unit_id', areaId: 'area_id', equipmentId: 'equipment_id' };
    return this.applicabilityMatrix(scope, { ...query, [field]: id }).then((matrix) => ({
      ...matrix,
      rows: matrix.rows.filter((row: Row) => row[map[field]] === id || row.regulatoryItem?.[map[field]] === id)
    }));
  }

  async applicabilityGaps(scope: Scope, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    let q = this.db.from('regulatory_applicability_gaps').select('*,item:regulatory_register_items(*),assessment:regulatory_applicability_assessments(*)').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.regulatoryItemId) q = q.eq('regulatory_item_id', query.regulatoryItemId);
    if (query.assessmentId) q = q.eq('assessment_id', query.assessmentId);
    if (query.gapStatus) q = q.eq('gap_status', query.gapStatus);
    if (query.gapType) q = q.eq('gap_type', query.gapType);
    const allRows = await this.db.many<Row>(q.order('created_at', { ascending: false }));
    const rows = allRows.slice((page - 1) * limit, page * limit);
    return { rows, allRows, total: allRows.length, page, limit };
  }

  async detectApplicabilityGaps(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.gap.manage');
    const assessmentId = dto.assessmentId ?? dto.assessment_id;
    const regulatoryItemId = dto.regulatoryItemId ?? dto.regulatory_item_id;
    const detail = assessmentId ? await this.getApplicabilityAssessment(scope, assessmentId) : null;
    const item = regulatoryItemId ? await this.getItem(scope, regulatoryItemId) : detail?.assessment.item;
    const target = detail?.assessment ?? item;
    const toCreate: Row[] = [];
    if (target && (target.applicability_status === 'Not Assessed' || !target.applicability_status)) toCreate.push({ gap_type: 'Missing Applicability Assessment', gap_title: 'Applicability has not been assessed', blocking: criticalRiskBasisStatuses.has(item?.criticality) });
    if (target && this.decisionNeedsRationale(target.applicability_status) && !String(target.rationale ?? target.applicability_rationale ?? '').trim()) toCreate.push({ gap_type: 'Missing Applicability Rationale', gap_title: 'Applicability rationale is missing', blocking: criticalRiskBasisStatuses.has(item?.criticality) });
    if (target && !target.scope_summary_json && !item?.site_id && !item?.unit_id && !item?.area_id && !item?.equipment_id) toCreate.push({ gap_type: 'Missing Scope', gap_title: 'Applicability scope is missing', blocking: false });
    if (detail?.assessment.stale) toCreate.push({ gap_type: 'Stale Applicability', gap_title: 'Applicability decision is stale', gap_description: detail.assessment.stale_reason, blocking: true });
    const created: Row[] = [];
    for (const gap of toCreate) {
      const existing = await this.db.single<Row>(this.db.from('regulatory_applicability_gaps').select('id').eq('company_id', scope.companyId).eq('gap_type', gap.gap_type).eq('regulatory_item_id', regulatoryItemId ?? item?.id ?? '').eq('assessment_id', assessmentId ?? '').neq('gap_status', 'Resolved').maybeSingle()).catch(() => null);
      if (existing) continue;
      const row = await this.db.single<Row>(this.db.from('regulatory_applicability_gaps').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: target?.site_id ?? item?.site_id ?? scope.selectedSiteId ?? null, regulatory_item_id: regulatoryItemId ?? item?.id ?? null, assessment_id: assessmentId ?? null, severity: gap.blocking ? 'High' : 'Medium', gap_status: 'Open', created_by: userId, ...gap }).select().single());
      created.push(row);
    }
    if (created.length) await this.writeApplicabilityMutation(scope, userId, 'Applicability gaps detected', regulatoryItemId ?? item?.id ?? null, null, { created }, 'Backend applicability gap check');
    return { rows: created, totalCreated: created.length };
  }

  async createApplicabilityGap(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.gap.manage');
    if (!String(dto.gapType ?? dto.gap_type ?? '').trim()) throw new BadRequestException('Gap type is required.');
    if (!String(dto.gapTitle ?? dto.gap_title ?? '').trim()) throw new BadRequestException('Gap title is required.');
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_gaps').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: dto.siteId ?? dto.site_id ?? scope.selectedSiteId ?? null, regulatory_item_id: dto.regulatoryItemId ?? dto.regulatory_item_id ?? null, assessment_id: dto.assessmentId ?? dto.assessment_id ?? null, gap_type: dto.gapType ?? dto.gap_type, gap_title: dto.gapTitle ?? dto.gap_title, gap_description: dto.gapDescription ?? dto.gap_description ?? null, severity: dto.severity ?? 'Medium', blocking: Boolean(dto.blocking), gap_status: dto.gapStatus ?? dto.gap_status ?? 'Open', owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? null, due_date: dto.dueDate ?? dto.due_date ?? null, related_scope_json: dto.relatedScopeJson ?? dto.related_scope_json ?? null, created_by: userId }).select().single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability gap created', row.regulatory_item_id, null, row, 'Gap created');
    return row;
  }

  async updateApplicabilityGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.gap.manage');
    const before = await this.db.single<Row>(this.db.from('regulatory_applicability_gaps').select('*').eq('company_id', scope.companyId).eq('id', gapId).maybeSingle());
    if (!before || !this.canAccessSite(scope, before.site_id)) throw new NotFoundException('Applicability gap was not found.');
    const patch = this.pickMapped(dto, { gapType: 'gap_type', gap_type: 'gap_type', gapTitle: 'gap_title', gap_title: 'gap_title', gapDescription: 'gap_description', gap_description: 'gap_description', severity: 'severity', blocking: 'blocking', gapStatus: 'gap_status', gap_status: 'gap_status', ownerUserId: 'owner_user_id', owner_user_id: 'owner_user_id', dueDate: 'due_date', due_date: 'due_date', relatedScopeJson: 'related_scope_json', related_scope_json: 'related_scope_json' });
    const row = await this.db.single<Row>(this.db.from('regulatory_applicability_gaps').update({ ...patch, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', gapId).select().single());
    await this.writeApplicabilityMutation(scope, userId, 'Applicability gap updated', row.regulatory_item_id, before, row, String(dto.reason ?? 'Gap updated'));
    return row;
  }

  async resolveApplicabilityGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.gap.manage');
    if (!String(dto.reason ?? dto.resolutionNote ?? '').trim()) throw new BadRequestException('Resolving an applicability gap requires a reason.');
    return this.updateApplicabilityGap(userId, scope, gapId, { gapStatus: 'Resolved', resolved_by: userId, resolved_at: new Date().toISOString(), resolution_note: dto.reason ?? dto.resolutionNote, reason: dto.reason ?? dto.resolutionNote }, permissions);
  }

  async createActionFoundationForGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.gap.manage');
    const gap = await this.updateApplicabilityGap(userId, scope, gapId, { linked_action_id: dto.actionId ?? dto.action_id ?? `action-foundation-${crypto.randomUUID()}`, reason: dto.reason ?? 'Action foundation link created' }, permissions);
    await this.writeApplicabilityMutation(scope, userId, 'Applicability gap action foundation linked', gap.regulatory_item_id, null, gap, String(dto.reason ?? 'Action foundation link created'));
    return gap;
  }

  applicabilityHistory(scope: Scope, query: Row = {}) {
    return this.db.many<Row>(this.db.from('regulatory_applicability_history_events').select('*').eq('company_id', scope.companyId).order('created_at', { ascending: false }).limit(Number(query.limit ?? 100))).then((rows) => ({ rows }));
  }

  applicabilitySettings(scope: Scope) {
    return this.settings(scope);
  }

  updateApplicabilitySettings(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.applicability.settings.edit');
    return this.updateSettings(userId, scope, dto, [...permissions, 'regulatory.settings.edit']);
  }

  async obligationDashboard(scope: Scope, query: Row = {}) {
    const register = await this.obligationRegister(scope, { ...query, limit: 5000 });
    const rows = register.allRows ?? register.rows ?? [];
    const gaps = await this.obligationGaps(scope, { limit: 5000 });
    return {
      header: {
        title: 'Regulatory Obligations',
        subtitle: 'Requirement breakdown, owners, evidence expectations, module mappings, due cycles, and foundation gaps.',
        generatedAt: new Date().toISOString()
      },
      summary: this.obligationSummaryFromRows(rows, gaps.rows),
      byParentRequirement: this.groupRows(rows, 'parent_requirement_label'),
      byJurisdiction: this.groupRows(rows, 'jurisdiction_id'),
      bySite: this.groupRows(rows, 'site_id'),
      byUnit: this.groupRows(rows, 'unit_id'),
      byCategory: this.groupRows(rows, 'category'),
      byPsmElement: this.groupRows(rows, 'related_psm_element'),
      byRelatedModule: this.groupRows(rows, 'related_module'),
      byCriticality: this.groupRows(rows, 'criticality'),
      byOwner: this.groupRows(rows, 'owner_label'),
      dueSoonPreview: rows.filter((row) => row.due_status === 'Due Soon').slice(0, 10),
      overduePreview: rows.filter((row) => row.due_status === 'Overdue').slice(0, 10),
      missingOwnerPreview: rows.filter((row) => !row.owner_user_id).slice(0, 10),
      missingEvidenceExpectationPreview: rows.filter((row) => row.evidence_expectation_status === 'Evidence Expectation Missing').slice(0, 10),
      missingModuleMappingPreview: rows.filter((row) => row.module_mapping_status === 'Mapping Required' || row.module_mapping_status === 'Not Mapped').slice(0, 10),
      highRiskPreview: rows.filter((row) => ['High', 'Critical', 'Regulatory-Critical'].includes(row.criticality)).slice(0, 10),
      psmCriticalPreview: rows.filter((row) => row.criticality === 'PSM-Critical').slice(0, 10),
      stalePreview: rows.filter((row) => row.stale_status && row.stale_status !== 'Current').slice(0, 10),
      recentChanges: rows.slice().sort((a, b) => String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? ''))).slice(0, 10),
      readinessSummary: this.obligationReadinessSummary(rows, gaps.rows),
      openGaps: gaps.rows.filter((gap) => gap.gap_status !== 'Resolved').slice(0, 10)
    };
  }

  async obligationDashboardSummary(scope: Scope, query: Row = {}) {
    return this.obligationDashboard(scope, query).then((dashboard) => dashboard.summary);
  }

  async obligationDashboardGroup(scope: Scope, field: string, query: Row = {}) {
    const data = await this.obligationRegister(scope, { ...query, limit: 5000 });
    return { rows: this.groupRows(data.allRows ?? data.rows ?? [], field) };
  }

  async obligationFilteredView(scope: Scope, view: string, query: Row = {}) {
    return this.obligationRegister(scope, { ...query, view });
  }

  async obligationRegister(scope: Scope, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const allRows = await this.loadObligations(scope, query);
    const sorted = this.sortRows(allRows, String(query.sort ?? 'updated_at.desc'));
    const rows = sorted.slice((page - 1) * limit, page * limit);
    return {
      rows,
      allRows: sorted,
      total: sorted.length,
      page,
      limit,
      hasMore: page * limit < sorted.length,
      summary: this.obligationSummaryFromRows(sorted)
    };
  }

  obligationSummary(scope: Scope, query: Row = {}) {
    return this.obligationRegister(scope, { ...query, limit: 5000 }).then((data) => this.obligationSummaryFromRows(data.allRows ?? data.rows ?? []));
  }

  async obligationMatrix(scope: Scope, query: Row = {}) {
    const register = await this.obligationRegister(scope, query);
    return {
      ...register,
      view: query.matrixView ?? 'Regulation -> Obligation -> Site',
      columns: [
        'Parent Requirement',
        'Obligation',
        'Jurisdiction',
        'Scope',
        'Category',
        'PSM Element',
        'Related Module',
        'Applicability',
        'Compliance Status',
        'Criticality',
        'Owner',
        'Frequency',
        'Due Date',
        'Evidence Expected',
        'Module Mapping',
        'Audit Link',
        'Action Link',
        'Gaps',
        'Stale Status',
        'Actions'
      ],
      rows: register.rows.map((row) => this.obligationMatrixRow(row))
    };
  }

  async getObligation(scope: Scope, obligationId: string): Promise<Row> {
    const row = await this.db.single<Row>(this.db.from('regulatory_obligations').select('*,parent:regulatory_register_items(*)').eq('company_id', scope.companyId).eq('id', obligationId).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Regulatory obligation was not found or is outside your company/site scope.');
    return this.enrichObligation(row);
  }

  async obligationOverview(scope: Scope, obligationId: string) {
    const obligation = await this.getObligation(scope, obligationId);
    const [scopes, evidenceExpectations, moduleMappings, links, gaps, history] = await Promise.all([
      this.obligationScopes(scope, obligationId),
      this.obligationEvidenceExpectations(scope, obligationId),
      this.obligationModuleMappings(scope, obligationId),
      this.obligationLinks(scope, obligationId),
      this.obligationGaps(scope, { obligationId, limit: 100 }),
      this.obligationHistory(scope, { obligationId, limit: 100 })
    ]);
    return {
      obligation,
      overviewCards: this.obligationOverviewCards(obligation),
      parentRequirement: obligation.parent ?? null,
      scopes,
      evidenceExpectations,
      moduleMappings,
      links,
      gaps,
      historyPreview: history.rows.slice(0, 10),
      readiness: this.singleObligationReadiness(obligation, gaps.rows),
      readOnly: this.isObligationReadOnly(obligation),
      readOnlyReason: this.obligationReadOnlyReason(obligation)
    };
  }

  async createObligation(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.create');
    const settings = await this.settings(scope);
    const normalized = await this.normalizeObligationInput(scope, dto, 'create');
    this.validateObligationForStatus(normalized, settings);
    const parent = await this.getItem(scope, normalized.regulatory_item_id);
    if (this.isReadOnly(parent) && normalized.obligation_status !== 'Draft') throw new BadRequestException('Archived, superseded, locked, or approved parent requirements cannot create active obligations without a controlled new-version flow.');
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const code = normalized.obligation_code || await this.generateObligationCode(scope);
    const row = await this.db.single<Row>(this.db.from('regulatory_obligations').insert({
      id,
      company_id: scope.companyId,
      site_id: normalized.site_id ?? parent.site_id ?? scope.selectedSiteId ?? null,
      regulatory_item_id: normalized.regulatory_item_id,
      jurisdiction_id: normalized.jurisdiction_id ?? parent.jurisdiction_id ?? null,
      authority_id: normalized.authority_id ?? parent.authority_id ?? null,
      ...normalized,
      obligation_code: code,
      applicability_status: this.normalizeObligationApplicability(normalized.applicability_status, parent.applicability_status),
      evidence_expectation_status: this.evidenceExpectationStatus(normalized),
      module_mapping_status: this.moduleMappingStatus(normalized),
      stale_status: normalized.stale_status ?? 'Current',
      created_by: userId,
      updated_by: userId,
      created_at: now,
      updated_at: now
    }).select('*,parent:regulatory_register_items(*)').single());
    await this.createInheritedObligationScope(scope, userId, row, parent).catch(() => null);
    await this.writeObligationMutation(scope, userId, 'Obligation created', row.id, null, row, 'Regulatory obligation created');
    await this.detectObligationGaps(userId, scope, { obligationId: row.id }, [...permissions, 'regulatory.obligation.gap.manage']).catch(() => null);
    return this.obligationOverview(scope, row.id);
  }

  async updateObligation(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.edit');
    const before = await this.getObligation(scope, obligationId);
    if (this.isObligationReadOnly(before) && !permissions.includes('regulatory.obligation.unlock')) throw new ForbiddenException(this.obligationReadOnlyReason(before));
    const settings = await this.settings(scope);
    const normalized = await this.normalizeObligationInput(scope, dto, 'update');
    this.validateObligationForStatus({ ...before, ...normalized }, settings);
    const patch = {
      ...normalized,
      evidence_expectation_status: this.evidenceExpectationStatus({ ...before, ...normalized }),
      module_mapping_status: this.moduleMappingStatus({ ...before, ...normalized }),
      updated_by: userId,
      updated_at: new Date().toISOString()
    };
    const row = await this.db.single<Row>(this.db.from('regulatory_obligations').update(patch).eq('company_id', scope.companyId).eq('id', obligationId).select('*,parent:regulatory_register_items(*)').single());
    await this.writeObligationMutation(scope, userId, 'Obligation updated', obligationId, before, row, String(dto.reason ?? 'Regulatory obligation updated'));
    await this.detectObligationGaps(userId, scope, { obligationId }, [...permissions, 'regulatory.obligation.gap.manage']).catch(() => null);
    return this.obligationOverview(scope, obligationId);
  }

  archiveObligation(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.archive');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive requires a reason.');
    return this.patchObligationStatus(userId, scope, obligationId, { obligation_status: 'Archived', archived_at: new Date().toISOString(), archived_by: userId, archive_reason: dto.reason }, dto.reason, 'Obligation archived');
  }

  reactivateObligation(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.reactivate');
    return this.patchObligationStatus(userId, scope, obligationId, { obligation_status: dto.obligationStatus ?? dto.obligation_status ?? 'Active', archived_at: null, archived_by: null, archive_reason: null }, dto.reason ?? 'Obligation reactivated', 'Obligation reactivated');
  }

  lockObligation(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.lock');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Lock requires a reason.');
    return this.patchObligationStatus(userId, scope, obligationId, { locked: true, locked_by: userId, locked_at: new Date().toISOString(), lock_reason: dto.reason }, dto.reason, 'Obligation locked');
  }

  unlockObligation(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.unlock');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Unlock requires a reason.');
    return this.patchObligationStatus(userId, scope, obligationId, { locked: false, locked_by: null, locked_at: null, lock_reason: null }, dto.reason, 'Obligation unlocked');
  }

  async assignObligationOwner(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.assign_owner');
    const ownerId = String(dto.ownerUserId ?? dto.owner_user_id ?? '');
    await this.assertUserInScope(scope, ownerId);
    return this.patchObligationStatus(userId, scope, obligationId, { owner_user_id: ownerId, stale_status: 'Owner Changed', stale_reason: dto.reason ?? 'Owner changed' }, dto.reason ?? 'Owner assigned', 'Obligation owner changed');
  }

  changeObligationStatus(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.change_status');
    return this.patchObligationStatus(userId, scope, obligationId, { obligation_status: dto.obligationStatus ?? dto.obligation_status }, dto.reason, 'Obligation status changed');
  }

  changeObligationApplicability(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.change_applicability');
    const status = dto.applicabilityStatus ?? dto.applicability_status;
    if (['Applicable', 'Partially Applicable', 'Not Applicable'].includes(status) && !String(dto.rationale ?? dto.applicabilityRationale ?? '').trim()) throw new BadRequestException('Obligation applicability decision requires a rationale or inherited source.');
    return this.patchObligationStatus(userId, scope, obligationId, { applicability_status: status, applicability_rationale: dto.rationale ?? dto.applicabilityRationale, stale_status: 'Applicability Changed', stale_reason: dto.rationale ?? 'Applicability changed' }, dto.rationale, 'Obligation applicability changed');
  }

  changeObligationComplianceStatus(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.change_compliance_status');
    const status = dto.complianceStatus ?? dto.compliance_status;
    if (['Compliant Foundation', 'Partially Compliant Foundation', 'Non-Compliant Foundation'].includes(status) && !String(dto.rationale ?? dto.statusRationale ?? '').trim()) throw new BadRequestException('Compliance status foundation requires a rationale.');
    return this.patchObligationStatus(userId, scope, obligationId, { compliance_status: status, status_rationale: dto.rationale ?? dto.statusRationale, stale_status: 'Compliance Status Changed', stale_reason: dto.rationale ?? 'Compliance status changed' }, dto.rationale, 'Obligation compliance status changed');
  }

  markObligationStale(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.stale.view');
    const status = dto.staleStatus ?? dto.stale_status ?? 'Reassessment Required';
    const reason = dto.reason ?? dto.staleReason ?? status;
    return this.patchObligationStatus(userId, scope, obligationId, { stale_status: status, stale_reason: reason }, reason, 'Obligation marked stale');
  }

  async obligationSection(scope: Scope, obligationId: string, section: string) {
    const overview = await this.obligationOverview(scope, obligationId);
    return { ...overview, section, placeholder: this.foundationMessage(`obligation ${section}`) };
  }

  async obligationScopes(scope: Scope, obligationId: string) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_obligation_scopes').select('*').eq('company_id', scope.companyId).eq('obligation_id', obligationId).is('removed_at', null)).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)) };
  }

  async updateObligationScope(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.scope.manage');
    const obligation = await this.getObligation(scope, obligationId);
    if (!dto.inheritParentScope && !String(dto.scopeChangeReason ?? dto.scope_change_reason ?? '').trim()) throw new BadRequestException('Narrowing or changing inherited parent scope requires a reason.');
    const scopeRows = Array.isArray(dto.scopes) ? dto.scopes : [{
      scope_type: dto.scopeType ?? dto.scope_type ?? 'Site',
      scope_record_id: dto.scopeRecordId ?? dto.scope_record_id ?? obligation.site_id ?? scope.selectedSiteId ?? scope.companyId,
      scope_label: dto.scopeLabel ?? dto.scope_label ?? null,
      included: dto.included ?? true
    }];
    const rows: Row[] = [];
    for (const item of scopeRows) {
      const row = await this.db.single<Row>(this.db.from('regulatory_obligation_scopes').insert({
        id: crypto.randomUUID(),
        company_id: scope.companyId,
        site_id: obligation.site_id ?? scope.selectedSiteId ?? null,
        obligation_id: obligationId,
        regulatory_item_id: obligation.regulatory_item_id,
        scope_type: item.scope_type ?? item.scopeType,
        scope_record_id: item.scope_record_id ?? item.scopeRecordId,
        scope_label: item.scope_label ?? item.scopeLabel ?? null,
        inherited_from_parent: Boolean(dto.inheritParentScope ?? dto.inherit_parent_scope ?? false),
        included: item.included ?? true,
        applicability_status: item.applicability_status ?? obligation.applicability_status,
        applicability_rationale: item.applicability_rationale ?? dto.applicabilityRationale ?? null,
        exclusion_reason: item.exclusion_reason ?? null,
        linked_by: userId
      }).select().single());
      rows.push(row);
    }
    await this.patchObligationStatus(userId, scope, obligationId, { stale_status: 'Scope Changed', stale_reason: dto.scopeChangeReason ?? dto.reason ?? 'Scope changed' }, dto.scopeChangeReason ?? dto.reason, 'Obligation scope changed');
    return { rows };
  }

  async obligationEvidenceExpectations(scope: Scope, obligationId: string) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_obligation_evidence_expectations').select('*').eq('company_id', scope.companyId).eq('obligation_id', obligationId).is('archived_at', null).order('updated_at', { ascending: false })).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)) };
  }

  async upsertObligationEvidenceExpectation(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.evidence_expectation.manage');
    const obligation = await this.getObligation(scope, obligationId);
    const id = dto.id ?? crypto.randomUUID();
    const existing = dto.id ? await this.db.single<Row>(this.db.from('regulatory_obligation_evidence_expectations').select('*').eq('company_id', scope.companyId).eq('id', dto.id).maybeSingle()).catch(() => null) : null;
    const patch = {
      company_id: scope.companyId,
      site_id: obligation.site_id ?? scope.selectedSiteId ?? null,
      obligation_id: obligationId,
      evidence_required: dto.evidenceRequired ?? dto.evidence_required ?? obligation.evidence_required ?? true,
      evidence_type_expected: dto.evidenceTypeExpected ?? dto.evidence_type_expected ?? null,
      evidence_description: dto.evidenceDescription ?? dto.evidence_description ?? null,
      evidence_frequency: dto.evidenceFrequency ?? dto.evidence_frequency ?? null,
      evidence_owner_user_id: dto.evidenceOwnerUserId ?? dto.evidence_owner_user_id ?? null,
      required_document_type: dto.requiredDocumentType ?? dto.required_document_type ?? null,
      required_record_type: dto.requiredRecordType ?? dto.required_record_type ?? null,
      evidence_source_module: dto.evidenceSourceModule ?? dto.evidence_source_module ?? null,
      acceptance_criteria_foundation: dto.acceptanceCriteriaFoundation ?? dto.acceptance_criteria_foundation ?? null,
      retention_requirement_foundation: dto.retentionRequirementFoundation ?? dto.retention_requirement_foundation ?? null,
      expectation_status: dto.expectationStatus ?? dto.expectation_status ?? 'Evidence Required',
      updated_by: userId,
      updated_at: new Date().toISOString()
    };
    const row = existing
      ? await this.db.single<Row>(this.db.from('regulatory_obligation_evidence_expectations').update(patch).eq('company_id', scope.companyId).eq('id', dto.id).select().single())
      : await this.db.single<Row>(this.db.from('regulatory_obligation_evidence_expectations').insert({ id, ...patch, created_by: userId }).select().single());
    await this.patchObligationStatus(userId, scope, obligationId, { evidence_required: patch.evidence_required, evidence_expectation_status: patch.expectation_status, stale_status: 'Evidence Expectation Changed', stale_reason: dto.reason ?? 'Evidence expectation changed' }, dto.reason, 'Obligation evidence expectation changed');
    return row;
  }

  async obligationModuleMappings(scope: Scope, obligationId: string) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_obligation_module_mappings').select('*').eq('company_id', scope.companyId).eq('obligation_id', obligationId).is('removed_at', null).order('linked_at', { ascending: false })).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)) };
  }

  async upsertObligationModuleMapping(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.module_mapping.manage');
    const obligation = await this.getObligation(scope, obligationId);
    const row = await this.db.single<Row>(this.db.from('regulatory_obligation_module_mappings').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: obligation.site_id ?? scope.selectedSiteId ?? null,
      obligation_id: obligationId,
      module_key: dto.moduleKey ?? dto.module_key ?? dto.relatedModule ?? obligation.related_module,
      module_record_id: dto.moduleRecordId ?? dto.module_record_id ?? null,
      mapping_status: dto.mappingStatus ?? dto.mapping_status ?? 'Mapped To Module',
      mapping_rationale: dto.mappingRationale ?? dto.mapping_rationale ?? null,
      control_safeguard_mapping_foundation: dto.controlSafeguardMappingFoundation ?? dto.control_safeguard_mapping_foundation ?? null,
      responsible_module_owner_user_id: dto.responsibleModuleOwnerUserId ?? dto.responsible_module_owner_user_id ?? null,
      source_snapshot_json: dto.sourceSnapshot ?? dto.source_snapshot_json ?? null,
      linked_by: userId
    }).select().single());
    await this.patchObligationStatus(userId, scope, obligationId, { related_module: row.module_key, module_mapping_status: row.mapping_status, stale_status: 'Module Mapping Changed', stale_reason: dto.reason ?? 'Module mapping changed' }, dto.reason, 'Obligation module mapping changed');
    return row;
  }

  async obligationLinks(scope: Scope, obligationId: string) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_obligation_links').select('*').eq('company_id', scope.companyId).eq('obligation_id', obligationId).is('removed_at', null).order('linked_at', { ascending: false })).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)), summary: this.groupRows(rows, 'linked_module') };
  }

  async createObligationLink(userId: string, scope: Scope, obligationId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.link.manage');
    const obligation = await this.getObligation(scope, obligationId);
    const row = await this.db.single<Row>(this.db.from('regulatory_obligation_links').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: obligation.site_id ?? scope.selectedSiteId ?? null,
      obligation_id: obligationId,
      regulatory_item_id: obligation.regulatory_item_id,
      linked_module: dto.linkedModule ?? dto.linked_module,
      linked_object_type: dto.linkedObjectType ?? dto.linked_object_type ?? 'Foundation Record',
      linked_record_id: dto.linkedRecordId ?? dto.linked_record_id,
      link_role: dto.linkRole ?? dto.link_role ?? 'Foundation Link',
      link_status: dto.linkStatus ?? dto.link_status ?? 'Active',
      source_snapshot_json: dto.sourceSnapshot ?? dto.source_snapshot_json ?? null,
      link_reason: dto.linkReason ?? dto.link_reason ?? null,
      linked_by: userId
    }).select().single());
    await this.writeObligationMutation(scope, userId, 'Obligation link created', obligationId, null, row, String(dto.linkReason ?? 'Obligation foundation link created'));
    return this.obligationLinks(scope, obligationId);
  }

  async removeObligationLink(userId: string, scope: Scope, obligationId: string, linkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.link.manage');
    const row = await this.db.single<Row>(this.db.from('regulatory_obligation_links').update({ removed_by: userId, removed_at: new Date().toISOString(), remove_reason: dto.reason ?? 'Link removed' }).eq('company_id', scope.companyId).eq('id', linkId).eq('obligation_id', obligationId).select().single());
    await this.writeObligationMutation(scope, userId, 'Obligation link removed', obligationId, null, row, String(dto.reason ?? 'Obligation link removed'));
    return this.obligationLinks(scope, obligationId);
  }

  async obligationGaps(scope: Scope, query: Row = {}) {
    let q = this.db.from('regulatory_obligation_gaps').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.obligationId) q = q.eq('obligation_id', query.obligationId);
    if (query.regulatoryItemId) q = q.eq('regulatory_item_id', query.regulatoryItemId);
    if (query.gapStatus) q = q.eq('gap_status', query.gapStatus);
    if (query.gapType) q = q.eq('gap_type', query.gapType);
    const rows = await this.db.many<Row>(q.order('updated_at', { ascending: false }).limit(Number(query.limit ?? 100))).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)), total: rows.length };
  }

  async detectObligationGaps(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.gap.manage');
    const obligations = dto.obligationId ? [await this.getObligation(scope, dto.obligationId)] : (await this.obligationRegister(scope, { ...dto, limit: 5000 })).allRows ?? [];
    const created: Row[] = [];
    for (const obligation of obligations) {
      const settings = await this.settings(scope);
      const gaps = this.detectGapsForObligation(obligation, settings);
      for (const gap of gaps) {
        const existing = await this.db.single<Row>(this.db.from('regulatory_obligation_gaps').select('*').eq('company_id', scope.companyId).eq('obligation_id', obligation.id).eq('gap_type', gap.gap_type).neq('gap_status', 'Resolved').maybeSingle()).catch(() => null);
        if (existing) continue;
        const row = await this.db.single<Row>(this.db.from('regulatory_obligation_gaps').insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: obligation.site_id ?? null,
          regulatory_item_id: obligation.regulatory_item_id,
          obligation_id: obligation.id,
          jurisdiction_id: obligation.jurisdiction_id ?? null,
          gap_status: 'Open',
          detected_at: new Date().toISOString(),
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...gap
        }).select().single());
        await this.writeObligationMutation(scope, userId, 'Obligation gap detected', obligation.id, null, row, row.gap_title);
        created.push(row);
      }
    }
    return { rows: created, total: created.length };
  }

  async createObligationGap(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.gap.manage');
    const obligation = dto.obligationId || dto.obligation_id ? await this.getObligation(scope, dto.obligationId ?? dto.obligation_id) : null;
    const row = await this.db.single<Row>(this.db.from('regulatory_obligation_gaps').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: obligation?.site_id ?? scope.selectedSiteId ?? dto.site_id ?? null,
      regulatory_item_id: dto.regulatoryItemId ?? dto.regulatory_item_id ?? obligation?.regulatory_item_id ?? null,
      obligation_id: obligation?.id ?? null,
      jurisdiction_id: dto.jurisdictionId ?? dto.jurisdiction_id ?? obligation?.jurisdiction_id ?? null,
      gap_type: dto.gapType ?? dto.gap_type ?? 'Custom',
      gap_title: dto.gapTitle ?? dto.gap_title,
      gap_description: dto.gapDescription ?? dto.gap_description ?? null,
      gap_status: dto.gapStatus ?? dto.gap_status ?? 'Open',
      severity: dto.severity ?? 'Medium',
      criticality: dto.criticality ?? obligation?.criticality ?? null,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? obligation?.owner_user_id ?? null,
      due_date: dto.dueDate ?? dto.due_date ?? null,
      recommended_fix: dto.recommendedFix ?? dto.recommended_fix ?? null,
      action_id: dto.actionId ?? dto.action_id ?? null,
      waiver_reason: dto.waiverReason ?? dto.waiver_reason ?? null,
      detected_at: new Date().toISOString(),
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select().single());
    await this.writeObligationMutation(scope, userId, 'Obligation gap created', row.obligation_id, null, row, String(dto.reason ?? 'Obligation gap created'));
    return row;
  }

  async updateObligationGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.gap.manage');
    const before = await this.db.single<Row>(this.db.from('regulatory_obligation_gaps').select('*').eq('company_id', scope.companyId).eq('id', gapId).maybeSingle()).catch(() => null);
    if (!before || !this.canAccessSite(scope, before.site_id)) throw new NotFoundException('Obligation gap was not found.');
    const row = await this.db.single<Row>(this.db.from('regulatory_obligation_gaps').update({ ...this.pick(dto, ['gap_type', 'gap_title', 'gap_description', 'gap_status', 'severity', 'criticality', 'owner_user_id', 'due_date', 'recommended_fix', 'action_id', 'waiver_reason', 'resolution_note']), updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', gapId).select().single());
    await this.writeObligationMutation(scope, userId, 'Obligation gap updated', row.obligation_id, before, row, String(dto.reason ?? 'Obligation gap updated'));
    return row;
  }

  resolveObligationGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.gap.manage');
    if (!String(dto.reason ?? dto.resolutionNote ?? '').trim()) throw new BadRequestException('Gap closure requires a fix note or waiver foundation reason.');
    return this.updateObligationGap(userId, scope, gapId, { gap_status: 'Resolved', resolved_by: userId, resolved_at: new Date().toISOString(), resolution_note: dto.reason ?? dto.resolutionNote, reason: dto.reason ?? dto.resolutionNote }, permissions);
  }

  async createActionFoundationForObligationGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.gap.manage');
    return this.updateObligationGap(userId, scope, gapId, { action_id: dto.actionId ?? dto.action_id ?? `action-foundation-${crypto.randomUUID()}`, reason: dto.reason ?? 'Action foundation link created' }, permissions);
  }

  async obligationHistory(scope: Scope, query: Row = {}) {
    let q = this.db.from('regulatory_obligation_history_events').select('*').eq('company_id', scope.companyId);
    if (query.obligationId) q = q.eq('obligation_id', query.obligationId);
    if (query.regulatoryItemId) q = q.eq('regulatory_item_id', query.regulatoryItemId);
    const rows = await this.db.many<Row>(q.order('created_at', { ascending: false }).limit(Number(query.limit ?? 100))).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)) };
  }

  obligationSettings(scope: Scope) {
    return this.settings(scope);
  }

  updateObligationSettings(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.obligation.settings.edit');
    return this.updateSettings(userId, scope, dto, [...permissions, 'regulatory.settings.edit']);
  }

  itemObligations(scope: Scope, regulationId: string, query: Row = {}) {
    return this.obligationRegister(scope, { ...query, regulatoryItemId: regulationId });
  }

  itemObligationMatrix(scope: Scope, regulationId: string, query: Row = {}) {
    return this.obligationMatrix(scope, { ...query, regulatoryItemId: regulationId });
  }

  itemObligationGaps(scope: Scope, regulationId: string, query: Row = {}) {
    return this.obligationGaps(scope, { ...query, regulatoryItemId: regulationId });
  }

  scopedObligations(scope: Scope, kind: string, id: string, query: Row = {}) {
    return this.obligationRegister(scope, { ...query, [kind]: id });
  }

  async complianceDashboard(scope: Scope, query: Row = {}) {
    const assessments = await this.complianceRegister(scope, { ...query, limit: 5000 });
    const rows = assessments.allRows ?? assessments.rows ?? [];
    const gaps = await this.complianceGaps(scope, { limit: 5000 });
    const openGaps = gaps.rows.filter((gap) => !['Resolved', 'Archived'].includes(gap.gap_status));
    return {
      header: {
        title: 'Regulatory Compliance Status',
        subtitle: 'Backend-controlled compliance assessments, evidence readiness, gaps, rollups, staleness, and action foundation.',
        generatedAt: new Date().toISOString()
      },
      summary: this.complianceSummaryFromRows(rows, gaps.rows),
      bySite: this.groupRows(rows, 'site_id'),
      byUnit: this.groupRows(rows, 'unit_id'),
      byCategory: this.groupRows(rows, 'category'),
      byJurisdiction: this.groupRows(rows, 'jurisdiction_id'),
      byOwner: this.groupRows(rows, 'owner_label'),
      byStatus: this.groupRows(rows, 'compliance_status'),
      byEvidenceReadiness: this.groupRows(rows, 'evidence_readiness_status'),
      byAssessmentStatus: this.groupRows(rows, 'assessment_status'),
      byCriticality: this.groupRows(rows, 'criticality'),
      criticalNonCompliantPreview: rows.filter((row) => row.compliance_status === 'Non-Compliant Foundation' && this.isCritical(row.criticality)).slice(0, 10),
      evidenceMissingPreview: rows.filter((row) => row.evidence_readiness_status === 'Evidence Missing' || row.compliance_status === 'Evidence Missing').slice(0, 10),
      actionRequiredPreview: rows.filter((row) => row.compliance_status === 'Action Required' || Number(row.action_count ?? 0) > 0).slice(0, 10),
      openGapPreview: openGaps.slice(0, 10),
      stalePreview: rows.filter((row) => row.stale_status && row.stale_status !== 'Current').slice(0, 10),
      recentAssessments: rows.slice().sort((a, b) => String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? ''))).slice(0, 10),
      readinessSummary: this.complianceReadinessSummary(rows, gaps.rows)
    };
  }

  async complianceDashboardSummary(scope: Scope, query: Row = {}) {
    const dashboard = await this.complianceDashboard(scope, query);
    return dashboard.summary;
  }

  async complianceDashboardGroup(scope: Scope, field: string, query: Row = {}) {
    const data = await this.complianceRegister(scope, { ...query, limit: 5000 });
    return { rows: this.groupRows(data.allRows ?? data.rows ?? [], field) };
  }

  async complianceFilteredView(scope: Scope, view: string, query: Row = {}) {
    return this.complianceRegister(scope, { ...query, view });
  }

  async complianceRegister(scope: Scope, query: Row = {}) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 25), 1), 100);
    const allRows = await this.loadComplianceAssessments(scope, query);
    const sorted = this.sortRows(allRows, String(query.sort ?? 'updated_at.desc'));
    const rows = sorted.slice((page - 1) * limit, page * limit);
    const gaps = await this.complianceGaps(scope, { limit: 5000 });
    return {
      rows,
      allRows: sorted,
      total: sorted.length,
      page,
      limit,
      hasMore: page * limit < sorted.length,
      summary: this.complianceSummaryFromRows(sorted, gaps.rows)
    };
  }

  async complianceSummary(scope: Scope, query: Row = {}) {
    const data = await this.complianceRegister(scope, { ...query, limit: 5000 });
    return data.summary;
  }

  async complianceMatrix(scope: Scope, query: Row = {}) {
    const register = await this.complianceRegister(scope, { ...query, limit: 5000 });
    const view = String(query.matrixView ?? 'Regulatory Item -> Obligation -> Compliance Status');
    const columns = [
      'Source',
      'Obligation',
      'Jurisdiction',
      'Scope',
      'Category',
      'PSM Element',
      'Applicability',
      'Compliance Status',
      'Evidence Readiness',
      'Gap Status',
      'Criticality',
      'Owner',
      'Assessor',
      'Reviewer',
      'Next Review',
      'Stale Status',
      'Actions'
    ];
    return { ...register, view, columns, rows: register.rows.map((row) => this.complianceMatrixRow(row)) };
  }

  async getComplianceAssessment(scope: Scope, assessmentId: string) {
    const row = await this.db.single<Row>(this.db.from('regulatory_compliance_assessments').select('*,item:regulatory_register_items(*),obligation:regulatory_obligations(*)').eq('company_id', scope.companyId).eq('id', assessmentId).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Compliance assessment was not found or is outside your company/site scope.');
    const [criteria, evidenceReadiness, gaps, history] = await Promise.all([
      this.complianceCriteria(scope, assessmentId),
      this.complianceEvidenceReadiness(scope, assessmentId),
      this.complianceGaps(scope, { assessmentId, limit: 100 }),
      this.complianceHistory(scope, { assessmentId, limit: 100 })
    ]);
    const enriched = (await this.enrichComplianceAssessments([row]))[0] ?? row;
    return {
      assessment: enriched,
      source: enriched.obligation ?? enriched.item ?? null,
      overview: this.complianceAssessmentOverview(enriched, criteria.rows, evidenceReadiness.rows, gaps.rows),
      criteria,
      evidenceReadiness,
      gaps,
      actions: { rows: gaps.rows.filter((gap) => gap.action_id || gap.action_required), total: gaps.rows.filter((gap) => gap.action_id || gap.action_required).length },
      decision: this.complianceDecision(enriched, criteria.rows, evidenceReadiness.rows, gaps.rows),
      history,
      readiness: this.complianceReadiness(enriched, criteria.rows, evidenceReadiness.rows, gaps.rows),
      readOnly: this.isComplianceReadOnly(enriched),
      readOnlyReason: this.complianceReadOnlyReason(enriched)
    };
  }

  async createComplianceAssessment(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.assessment.create');
    const source = await this.resolveComplianceSource(scope, dto);
    const normalized = this.normalizeComplianceAssessmentInput(dto, source);
    this.validateComplianceAssessment(normalized, await this.settings(scope));
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const { site_id: normalizedSiteId, ...normalizedInsert } = normalized;
    const row = await this.db.single<Row>(this.db.from('regulatory_compliance_assessments').insert({
      id,
      company_id: scope.companyId,
      site_id: normalizedSiteId ?? source.site_id ?? scope.selectedSiteId ?? null,
      ...normalizedInsert,
      assessment_number: normalized.assessment_number || await this.generateComplianceAssessmentCode(scope),
      source_snapshot_json: source,
      created_by: userId,
      updated_by: userId,
      created_at: now,
      updated_at: now
    }).select('*,item:regulatory_register_items(*),obligation:regulatory_obligations(*)').single());
    await this.writeComplianceMutation(scope, userId, 'Compliance assessment created', row.id, null, row, String(dto.reason ?? 'Compliance assessment created'));
    await this.detectComplianceGaps(userId, scope, { assessmentId: row.id }, [...permissions, 'regulatory.compliance.gap.create']).catch(() => null);
    return this.getComplianceAssessment(scope, row.id);
  }

  async updateComplianceAssessment(userId: string, scope: Scope, assessmentId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.assessment.edit');
    const beforeDetail = await this.getComplianceAssessment(scope, assessmentId);
    const before = beforeDetail.assessment;
    if (this.isComplianceReadOnly(before) && !permissions.includes('regulatory.compliance.status.override')) throw new ForbiddenException(this.complianceReadOnlyReason(before));
    const normalized = this.normalizeComplianceAssessmentInput(dto, before);
    this.validateComplianceAssessment({ ...before, ...normalized }, await this.settings(scope));
    const row = await this.db.single<Row>(this.db.from('regulatory_compliance_assessments').update({
      ...normalized,
      updated_by: userId,
      updated_at: new Date().toISOString()
    }).eq('company_id', scope.companyId).eq('id', assessmentId).select('*,item:regulatory_register_items(*),obligation:regulatory_obligations(*)').single());
    await this.writeComplianceMutation(scope, userId, 'Compliance assessment updated', assessmentId, before, row, String(dto.reason ?? 'Compliance assessment updated'));
    return this.getComplianceAssessment(scope, assessmentId);
  }

  async runComplianceReadinessCheck(userId: string, scope: Scope, assessmentId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.assessment.view');
    const detail = await this.getComplianceAssessment(scope, assessmentId);
    const row = await this.db.single<Row>(this.db.from('regulatory_compliance_assessments').update({
      readiness_json: detail.readiness,
      blockers_json: detail.readiness.blockers,
      updated_by: userId,
      updated_at: new Date().toISOString()
    }).eq('company_id', scope.companyId).eq('id', assessmentId).select().single());
    await this.writeComplianceMutation(scope, userId, 'Compliance readiness checked', assessmentId, detail.assessment, row, 'Compliance readiness recalculated by backend');
    return this.getComplianceAssessment(scope, assessmentId);
  }

  async changeComplianceAssessmentStatus(userId: string, scope: Scope, assessmentId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.status.change');
    const detail = await this.getComplianceAssessment(scope, assessmentId);
    const before = detail.assessment;
    const settings = await this.settings(scope);
    const status = String(dto.complianceStatus ?? dto.compliance_status ?? before.compliance_status ?? 'Not Assessed');
    const patch = this.complianceDecisionPatch(before, status, dto, settings);
    const row = await this.patchComplianceAssessment(scope, assessmentId, { ...patch, updated_by: userId }, '*,item:regulatory_register_items(*),obligation:regulatory_obligations(*)');
    await this.writeComplianceStatusHistory(scope, userId, assessmentId, before, row, String(dto.rationale ?? dto.statusRationale ?? dto.reason ?? 'Compliance status changed'));
    await this.writeComplianceMutation(scope, userId, 'Compliance status changed', assessmentId, before, row, String(dto.reason ?? dto.rationale ?? 'Compliance status changed'));
    await this.propagateComplianceStatus(scope, userId, row).catch(() => null);
    if (settings.auto_create_gap_for_non_compliance || settings.auto_create_gap_for_evidence_missing) await this.detectComplianceGaps(userId, scope, { assessmentId }, [...permissions, 'regulatory.compliance.gap.create']).catch(() => null);
    return this.getComplianceAssessment(scope, assessmentId);
  }

  async completeComplianceAssessment(userId: string, scope: Scope, assessmentId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.assessment.complete');
    const detail = await this.getComplianceAssessment(scope, assessmentId);
    const blockers = detail.readiness.blockers.filter((blocker: Row) => blocker.blocking);
    if (blockers.length && !permissions.includes('regulatory.compliance.status.override')) throw new BadRequestException(`Compliance assessment cannot be completed: ${blockers.map((b: Row) => b.label).join(', ')}`);
    const row = await this.patchComplianceAssessment(scope, assessmentId, {
      assessment_status: 'Completed',
      completed_by: userId,
      completed_at: new Date().toISOString(),
      readiness_json: detail.readiness,
      blockers_json: detail.readiness.blockers,
      updated_by: userId
    });
    await this.writeComplianceMutation(scope, userId, 'Compliance assessment completed', assessmentId, detail.assessment, row, String(dto.reason ?? 'Compliance assessment completed'));
    return this.getComplianceAssessment(scope, assessmentId);
  }

  async submitComplianceReview(userId: string, scope: Scope, assessmentId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.assessment.complete');
    const detail = await this.getComplianceAssessment(scope, assessmentId);
    const row = await this.patchComplianceAssessment(scope, assessmentId, {
      assessment_status: 'Submitted For Review Foundation',
      review_status: 'Under Review',
      review_required: true,
      submitted_for_review_by: userId,
      submitted_for_review_at: new Date().toISOString(),
      updated_by: userId
    });
    await this.writeComplianceMutation(scope, userId, 'Compliance assessment submitted for review', assessmentId, detail.assessment, row, String(dto.reason ?? 'Compliance review foundation submitted'));
    return this.getComplianceAssessment(scope, assessmentId);
  }

  async markComplianceAssessmentStale(userId: string, scope: Scope, assessmentId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.stale.reassess');
    const before = (await this.getComplianceAssessment(scope, assessmentId)).assessment;
    const reason = String(dto.reason ?? dto.staleReason ?? 'Compliance status requires reassessment.');
    const row = await this.patchComplianceAssessment(scope, assessmentId, {
      assessment_status: 'Stale',
      stale_status: dto.staleStatus ?? dto.stale_status ?? 'Reassessment Required',
      stale_reason: reason,
      stale_at: new Date().toISOString(),
      updated_by: userId
    });
    await this.db.single(this.db.from('regulatory_compliance_staleness_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: row.site_id ?? null,
      assessment_id: assessmentId,
      regulatory_item_id: row.regulatory_item_id ?? null,
      obligation_id: row.obligation_id ?? null,
      stale_trigger_type: row.stale_status,
      source_module: dto.sourceModule ?? 'Regulatory Compliance Status',
      source_record_id: dto.sourceRecordId ?? row.source_record_id ?? null,
      stale_reason: reason
    }).select('id').single()).catch(() => null);
    await this.writeComplianceMutation(scope, userId, 'Compliance assessment marked stale', assessmentId, before, row, reason);
    return this.getComplianceAssessment(scope, assessmentId);
  }

  async archiveComplianceAssessment(userId: string, scope: Scope, assessmentId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.assessment.archive');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive requires a reason.');
    const before = (await this.getComplianceAssessment(scope, assessmentId)).assessment;
    const row = await this.patchComplianceAssessment(scope, assessmentId, { assessment_status: 'Archived', archived_by: userId, archived_at: new Date().toISOString(), archive_reason: dto.reason, updated_by: userId });
    await this.writeComplianceMutation(scope, userId, 'Compliance assessment archived', assessmentId, before, row, String(dto.reason));
    return this.getComplianceAssessment(scope, assessmentId);
  }

  async complianceAssessmentSection(scope: Scope, assessmentId: string, section: string) {
    const detail = await this.getComplianceAssessment(scope, assessmentId);
    return { ...detail, section };
  }

  async complianceCriteria(scope: Scope, assessmentId: string) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_compliance_criteria').select('*').eq('company_id', scope.companyId).eq('assessment_id', assessmentId).order('criterion_number', { ascending: true })).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)), total: rows.length };
  }

  async upsertComplianceCriterion(userId: string, scope: Scope, assessmentId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.criteria.manage');
    const assessment = (await this.getComplianceAssessment(scope, assessmentId)).assessment;
    const id = dto.id ?? crypto.randomUUID();
    const existing = dto.id ? await this.db.single<Row>(this.db.from('regulatory_compliance_criteria').select('*').eq('company_id', scope.companyId).eq('id', dto.id).maybeSingle()).catch(() => null) : null;
    const patch = {
      company_id: scope.companyId,
      site_id: assessment.site_id ?? scope.selectedSiteId ?? null,
      assessment_id: assessmentId,
      regulatory_item_id: assessment.regulatory_item_id ?? null,
      obligation_id: assessment.obligation_id ?? null,
      criterion_number: Number(dto.criterionNumber ?? dto.criterion_number ?? 1),
      criterion_title: dto.criterionTitle ?? dto.criterion_title ?? 'Compliance criterion',
      criterion_description: dto.criterionDescription ?? dto.criterion_description ?? null,
      expected_condition: dto.expectedCondition ?? dto.expected_condition ?? null,
      evaluation_method: dto.evaluationMethod ?? dto.evaluation_method ?? null,
      result_status: dto.resultStatus ?? dto.result_status ?? 'Not Checked',
      rationale: dto.rationale ?? null,
      evidence_required: Boolean(dto.evidenceRequired ?? dto.evidence_required ?? false),
      evidence_reference: dto.evidenceReference ?? dto.evidence_reference ?? null,
      blocking: Boolean(dto.blocking ?? false),
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? assessment.owner_user_id ?? null,
      due_date: dto.dueDate ?? dto.due_date ?? null,
      updated_by: userId,
      updated_at: new Date().toISOString()
    };
    const row = existing
      ? await this.db.single<Row>(this.db.from('regulatory_compliance_criteria').update(patch).eq('company_id', scope.companyId).eq('id', dto.id).select().single())
      : await this.db.single<Row>(this.db.from('regulatory_compliance_criteria').insert({ id, ...patch, created_by: userId }).select().single());
    await this.writeComplianceMutation(scope, userId, existing ? 'Compliance criterion updated' : 'Compliance criterion created', assessmentId, existing, row, String(dto.reason ?? 'Compliance criterion changed'));
    return row;
  }

  async complianceEvidenceReadiness(scope: Scope, assessmentId: string) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_compliance_evidence_readiness').select('*').eq('company_id', scope.companyId).eq('assessment_id', assessmentId).order('updated_at', { ascending: false })).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)), total: rows.length, summary: this.groupRows(rows, 'readiness_status') };
  }

  async recalculateComplianceEvidenceReadiness(userId: string, scope: Scope, assessmentId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.evidence_readiness.manage');
    const detail = await this.getComplianceAssessment(scope, assessmentId);
    const status = this.evidenceReadinessStatus(detail.evidenceReadiness.rows, detail.criteria.rows);
    const row = await this.patchComplianceAssessment(scope, assessmentId, { evidence_readiness_status: status, updated_by: userId });
    await this.writeComplianceMutation(scope, userId, 'Compliance evidence readiness recalculated', assessmentId, detail.assessment, row, 'Evidence readiness recalculated by backend');
    return this.getComplianceAssessment(scope, assessmentId);
  }

  async complianceGaps(scope: Scope, query: Row = {}) {
    let q = this.db.from('regulatory_compliance_gaps').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.siteId) q = q.eq('site_id', query.siteId);
    if (query.unitId) q = q.eq('unit_id', query.unitId);
    if (query.areaId) q = q.eq('area_id', query.areaId);
    if (query.equipmentId) q = q.eq('equipment_id', query.equipmentId);
    if (query.assessmentId) q = q.eq('assessment_id', query.assessmentId);
    if (query.regulatoryItemId) q = q.eq('regulatory_item_id', query.regulatoryItemId);
    if (query.obligationId) q = q.eq('obligation_id', query.obligationId);
    if (query.gapStatus) q = q.eq('gap_status', query.gapStatus);
    if (query.gapType) q = q.eq('gap_type', query.gapType);
    if (query.severity) q = q.eq('severity', query.severity);
    const rows = await this.db.many<Row>(q.order('updated_at', { ascending: false }).limit(Number(query.limit ?? 100))).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)), total: rows.length, summary: this.groupRows(rows, 'gap_status') };
  }

  async detectComplianceGaps(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.gap.create');
    const assessments = dto.assessmentId ? [(await this.getComplianceAssessment(scope, dto.assessmentId)).assessment] : (await this.complianceRegister(scope, { ...dto, limit: 5000 })).allRows ?? [];
    const settings = await this.settings(scope);
    const created: Row[] = [];
    for (const assessment of assessments) {
      const gaps = this.detectComplianceGapsForAssessment(assessment, settings);
      for (const gap of gaps) {
        const existing = await this.db.single<Row>(this.db.from('regulatory_compliance_gaps').select('id').eq('company_id', scope.companyId).eq('assessment_id', assessment.id).eq('gap_type', gap.gap_type).neq('gap_status', 'Resolved').maybeSingle()).catch(() => null);
        if (existing) continue;
        const row = await this.db.single<Row>(this.db.from('regulatory_compliance_gaps').insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: assessment.site_id ?? null,
          unit_id: assessment.unit_id ?? null,
          area_id: assessment.area_id ?? null,
          equipment_id: assessment.equipment_id ?? null,
          assessment_id: assessment.id,
          regulatory_item_id: assessment.regulatory_item_id ?? null,
          obligation_id: assessment.obligation_id ?? null,
          jurisdiction_id: assessment.jurisdiction_id ?? null,
          gap_number: await this.generateComplianceGapCode(scope),
          gap_status: 'Open',
          detected_by: userId,
          created_by: userId,
          updated_by: userId,
          ...gap
        }).select().single());
        await this.writeComplianceMutation(scope, userId, 'Compliance gap detected', assessment.id, null, row, row.gap_title);
        created.push(row);
      }
    }
    return { rows: created, total: created.length };
  }

  async createComplianceGap(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.gap.create');
    const assessment = dto.assessmentId || dto.assessment_id ? (await this.getComplianceAssessment(scope, dto.assessmentId ?? dto.assessment_id)).assessment : null;
    const source: Row = assessment ?? await this.resolveComplianceSource(scope, dto).catch(() => ({} as Row));
    const row = await this.db.single<Row>(this.db.from('regulatory_compliance_gaps').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: dto.siteId ?? dto.site_id ?? source.site_id ?? scope.selectedSiteId ?? null,
      unit_id: dto.unitId ?? dto.unit_id ?? source.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? source.area_id ?? null,
      equipment_id: dto.equipmentId ?? dto.equipment_id ?? source.equipment_id ?? null,
      assessment_id: assessment?.id ?? null,
      regulatory_item_id: dto.regulatoryItemId ?? dto.regulatory_item_id ?? source.regulatory_item_id ?? source.id ?? null,
      obligation_id: dto.obligationId ?? dto.obligation_id ?? source.obligation_id ?? null,
      jurisdiction_id: dto.jurisdictionId ?? dto.jurisdiction_id ?? source.jurisdiction_id ?? null,
      gap_number: dto.gapNumber ?? dto.gap_number ?? await this.generateComplianceGapCode(scope),
      gap_type: dto.gapType ?? dto.gap_type ?? 'Manual Gap',
      gap_title: dto.gapTitle ?? dto.gap_title ?? 'Compliance gap',
      gap_description: dto.gapDescription ?? dto.gap_description ?? null,
      gap_status: dto.gapStatus ?? dto.gap_status ?? 'Open',
      severity: dto.severity ?? 'Medium',
      criticality: dto.criticality ?? source.criticality ?? null,
      impact_type: dto.impactType ?? dto.impact_type ?? null,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? source.owner_user_id ?? null,
      due_date: dto.dueDate ?? dto.due_date ?? null,
      recommended_fix: dto.recommendedFix ?? dto.recommended_fix ?? null,
      action_required: Boolean(dto.actionRequired ?? dto.action_required ?? false),
      action_id: dto.actionId ?? dto.action_id ?? null,
      capa_required: Boolean(dto.capaRequired ?? dto.capa_required ?? false),
      capa_id: dto.capaId ?? dto.capa_id ?? null,
      evidence_required: Boolean(dto.evidenceRequired ?? dto.evidence_required ?? false),
      evidence_reference: dto.evidenceReference ?? dto.evidence_reference ?? null,
      review_required: Boolean(dto.reviewRequired ?? dto.review_required ?? false),
      notes: dto.notes ?? null,
      detected_by: userId,
      created_by: userId,
      updated_by: userId
    }).select().single());
    await this.writeComplianceMutation(scope, userId, 'Compliance gap created', assessment?.id ?? null, null, row, String(dto.reason ?? 'Compliance gap created'));
    return row;
  }

  async getComplianceGap(scope: Scope, gapId: string) {
    const row = await this.db.single<Row>(this.db.from('regulatory_compliance_gaps').select('*').eq('company_id', scope.companyId).eq('id', gapId).maybeSingle());
    if (!row || !this.canAccessSite(scope, row.site_id)) throw new NotFoundException('Compliance gap was not found or is outside your company/site scope.');
    return row;
  }

  async updateComplianceGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.gap.edit');
    const before = await this.getComplianceGap(scope, gapId);
    const row = await this.db.single<Row>(this.db.from('regulatory_compliance_gaps').update({
      ...this.pickMapped(dto, {
        gapType: 'gap_type',
        gap_type: 'gap_type',
        gapTitle: 'gap_title',
        gap_title: 'gap_title',
        gapDescription: 'gap_description',
        gap_description: 'gap_description',
        gapStatus: 'gap_status',
        gap_status: 'gap_status',
        severity: 'severity',
        criticality: 'criticality',
        impactType: 'impact_type',
        impact_type: 'impact_type',
        ownerUserId: 'owner_user_id',
        owner_user_id: 'owner_user_id',
        dueDate: 'due_date',
        due_date: 'due_date',
        recommendedFix: 'recommended_fix',
        recommended_fix: 'recommended_fix',
        actionRequired: 'action_required',
        action_required: 'action_required',
        actionId: 'action_id',
        action_id: 'action_id',
        capaRequired: 'capa_required',
        capa_required: 'capa_required',
        capaId: 'capa_id',
        capa_id: 'capa_id',
        evidenceRequired: 'evidence_required',
        evidence_required: 'evidence_required',
        evidenceReference: 'evidence_reference',
        evidence_reference: 'evidence_reference',
        reviewRequired: 'review_required',
        review_required: 'review_required',
        resolvedBy: 'resolved_by',
        resolved_by: 'resolved_by',
        resolvedAt: 'resolved_at',
        resolved_at: 'resolved_at',
        resolutionNote: 'resolution_note',
        resolution_note: 'resolution_note',
        archivedBy: 'archived_by',
        archived_by: 'archived_by',
        archivedAt: 'archived_at',
        archived_at: 'archived_at',
        archiveReason: 'archive_reason',
        archive_reason: 'archive_reason',
        notes: 'notes'
      }),
      updated_by: userId,
      updated_at: new Date().toISOString()
    }).eq('company_id', scope.companyId).eq('id', gapId).select().single());
    await this.writeComplianceMutation(scope, userId, 'Compliance gap updated', row.assessment_id ?? null, before, row, String(dto.reason ?? 'Compliance gap updated'));
    return row;
  }

  async resolveComplianceGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.gap.resolve');
    if (!String(dto.reason ?? dto.resolutionNote ?? '').trim()) throw new BadRequestException('Gap resolution requires a reason or fix note.');
    return this.updateComplianceGap(userId, scope, gapId, { gap_status: 'Resolved', resolved_by: userId, resolved_at: new Date().toISOString(), resolution_note: dto.reason ?? dto.resolutionNote, reason: dto.reason ?? dto.resolutionNote }, [...permissions, 'regulatory.compliance.gap.edit']);
  }

  async archiveComplianceGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.gap.archive');
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive requires a reason.');
    return this.updateComplianceGap(userId, scope, gapId, { gap_status: 'Archived', archived_by: userId, archived_at: new Date().toISOString(), archive_reason: dto.reason, reason: dto.reason }, [...permissions, 'regulatory.compliance.gap.edit']);
  }

  async createActionFoundationForComplianceGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.gap.create_action_foundation');
    return this.updateComplianceGap(userId, scope, gapId, { action_required: true, action_id: dto.actionId ?? dto.action_id ?? `action-foundation-${crypto.randomUUID()}`, gap_status: 'Action Foundation Created', reason: dto.reason ?? 'Action foundation linked to compliance gap' }, [...permissions, 'regulatory.compliance.gap.edit']);
  }

  async linkCapaFoundationForComplianceGap(userId: string, scope: Scope, gapId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.gap.create_action_foundation');
    return this.updateComplianceGap(userId, scope, gapId, { capa_required: true, capa_id: dto.capaId ?? dto.capa_id ?? `capa-foundation-${crypto.randomUUID()}`, gap_status: 'CAPA Open', reason: dto.reason ?? 'CAPA foundation linked to compliance gap' }, [...permissions, 'regulatory.compliance.gap.edit']);
  }

  async complianceRollup(scope: Scope, regulatoryItemId: string) {
    await this.getItem(scope, regulatoryItemId);
    const row = await this.db.single<Row>(this.db.from('regulatory_compliance_status_rollups').select('*').eq('company_id', scope.companyId).eq('regulatory_item_id', regulatoryItemId).maybeSingle()).catch(() => null);
    return row ?? { regulatory_item_id: regulatoryItemId, rollup_status: 'Not Assessed', obligation_count: 0 };
  }

  async recalculateComplianceRollup(userId: string, scope: Scope, regulatoryItemId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.rollup.recalculate');
    const item = await this.getItem(scope, regulatoryItemId);
    const obligations = (await this.obligationRegister(scope, { regulatoryItemId, limit: 5000 })).allRows ?? [];
    const gaps = (await this.complianceGaps(scope, { regulatoryItemId, limit: 5000 })).rows;
    const counts = {
      obligation_count: obligations.length,
      compliant_count: obligations.filter((row) => row.compliance_status === 'Compliant Foundation').length,
      partial_count: obligations.filter((row) => row.compliance_status === 'Partially Compliant Foundation').length,
      non_compliant_count: obligations.filter((row) => row.compliance_status === 'Non-Compliant Foundation').length,
      evidence_missing_count: obligations.filter((row) => row.compliance_status === 'Evidence Missing' || row.evidence_expectation_status === 'Evidence Missing Foundation').length,
      action_required_count: obligations.filter((row) => row.compliance_status === 'Action Required' || row.action_required_foundation).length,
      capa_open_count: obligations.filter((row) => row.compliance_status === 'CAPA Open' || row.capa_required_foundation).length,
      not_applicable_count: obligations.filter((row) => row.applicability_status === 'Not Applicable' || row.compliance_status === 'Not Applicable').length,
      stale_count: obligations.filter((row) => row.stale_status && row.stale_status !== 'Current').length,
      open_gap_count: gaps.filter((gap) => !['Resolved', 'Archived'].includes(gap.gap_status)).length,
      blocking_gap_count: gaps.filter((gap) => ['Critical', 'Immediate Action Required'].includes(gap.severity) && !['Resolved', 'Archived'].includes(gap.gap_status)).length
    };
    const rollupStatus = this.rollupStatusFromObligations(item, obligations, counts);
    const patch = {
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: item.site_id ?? scope.selectedSiteId ?? null,
      regulatory_item_id: regulatoryItemId,
      rollup_status: rollupStatus,
      ...counts,
      calculated_by: userId,
      calculated_at: new Date().toISOString(),
      calculation_basis_json: { source: 'Backend obligation compliance rollup', obligationIds: obligations.map((row) => row.id) },
      updated_at: new Date().toISOString()
    };
    const existing = await this.db.single<Row>(this.db.from('regulatory_compliance_status_rollups').select('*').eq('company_id', scope.companyId).eq('regulatory_item_id', regulatoryItemId).maybeSingle()).catch(() => null);
    const row = existing
      ? await this.db.single<Row>(this.db.from('regulatory_compliance_status_rollups').update({ ...patch, id: existing.id }).eq('company_id', scope.companyId).eq('id', existing.id).select().single())
      : await this.db.single<Row>(this.db.from('regulatory_compliance_status_rollups').insert(patch).select().single());
    const updatedItem = await this.db.single<Row>(this.db.from('regulatory_register_items').update({ compliance_status: rollupStatus, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', regulatoryItemId).select().single()).catch(() => null);
    await this.writeComplianceMutation(scope, userId, 'Compliance rollup recalculated', null, existing, row, `Parent requirement rollup recalculated as ${rollupStatus}`);
    if (updatedItem) await this.writeMutation(scope, userId, 'Compliance rollup applied', regulatoryItemId, item, updatedItem, `Compliance status rolled up from obligations as ${rollupStatus}`).catch(() => null);
    return row;
  }

  async complianceHistory(scope: Scope, query: Row = {}) {
    let q = this.db.from('regulatory_compliance_history_events').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.assessmentId) q = q.eq('assessment_id', query.assessmentId);
    if (query.gapId) q = q.eq('gap_id', query.gapId);
    if (query.regulatoryItemId) q = q.eq('regulatory_item_id', query.regulatoryItemId);
    if (query.obligationId) q = q.eq('obligation_id', query.obligationId);
    const rows = await this.db.many<Row>(q.order('created_at', { ascending: false }).limit(Number(query.limit ?? 100))).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)), summary: { totalEvents: rows.length, byType: this.groupRows(rows, 'event_type') } };
  }

  complianceSettings(scope: Scope) {
    return this.settings(scope);
  }

  updateComplianceSettings(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.compliance.settings.edit');
    return this.updateSettings(userId, scope, dto, [...permissions, 'regulatory.settings.edit']);
  }

  sourceCompliance(scope: Scope, sourceType: 'item' | 'obligation', sourceId: string, query: Row = {}) {
    return sourceType === 'obligation'
      ? this.complianceRegister(scope, { ...query, obligationId: sourceId })
      : this.complianceRegister(scope, { ...query, regulatoryItemId: sourceId });
  }

  createSourceComplianceAssessment(userId: string, scope: Scope, sourceType: 'item' | 'obligation', sourceId: string, dto: Row, permissions: string[]) {
    return this.createComplianceAssessment(userId, scope, sourceType === 'obligation' ? { ...dto, obligationId: sourceId, sourceType: 'Obligation' } : { ...dto, regulatoryItemId: sourceId, sourceType: 'Regulatory Item' }, permissions);
  }

  sourceComplianceGaps(scope: Scope, sourceType: 'item' | 'obligation', sourceId: string, query: Row = {}) {
    return sourceType === 'obligation'
      ? this.complianceGaps(scope, { ...query, obligationId: sourceId })
      : this.complianceGaps(scope, { ...query, regulatoryItemId: sourceId });
  }

  sourceComplianceHistory(scope: Scope, sourceType: 'item' | 'obligation', sourceId: string, query: Row = {}) {
    return sourceType === 'obligation'
      ? this.complianceHistory(scope, { ...query, obligationId: sourceId })
      : this.complianceHistory(scope, { ...query, regulatoryItemId: sourceId });
  }

  scopedCompliance(scope: Scope, kind: string, id: string, query: Row = {}) {
    return this.complianceRegister(scope, { ...query, [kind]: id });
  }

  private async loadComplianceAssessments(scope: Scope, query: Row) {
    let q = this.db.from('regulatory_compliance_assessments').select('*,item:regulatory_register_items(*),obligation:regulatory_obligations(*)').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.siteId) q = q.eq('site_id', query.siteId);
    if (query.unitId) q = q.eq('unit_id', query.unitId);
    if (query.areaId) q = q.eq('area_id', query.areaId);
    if (query.equipmentId) q = q.eq('equipment_id', query.equipmentId);
    if (query.regulatoryItemId) q = q.eq('regulatory_item_id', query.regulatoryItemId);
    if (query.obligationId) q = q.eq('obligation_id', query.obligationId);
    if (query.jurisdictionId) q = q.eq('jurisdiction_id', query.jurisdictionId);
    if (query.sourceType) q = q.eq('source_type', query.sourceType);
    if (query.complianceStatus) q = q.eq('compliance_status', query.complianceStatus);
    if (query.assessmentStatus) q = q.eq('assessment_status', query.assessmentStatus);
    if (query.evidenceReadinessStatus) q = q.eq('evidence_readiness_status', query.evidenceReadinessStatus);
    if (query.criticality) q = q.eq('criticality', query.criticality);
    if (query.ownerUserId) q = q.eq('owner_user_id', query.ownerUserId);
    if (query.search) q = q.or(`assessment_number.ilike.%${query.search}%,assessment_title.ilike.%${query.search}%,source_title.ilike.%${query.search}%`);
    const rows = await this.db.many<Row>(q.order('updated_at', { ascending: false })).catch(() => []);
    const enriched = await this.enrichComplianceAssessments(rows);
    return enriched.filter((row) => this.matchesComplianceFilters(row, query));
  }

  private async enrichComplianceAssessments(rows: Row[]): Promise<Row[]> {
    const userIds = [...new Set(rows.flatMap((row) => [row.owner_user_id, row.assessor_user_id, row.reviewer_user_id, row.completed_by, row.submitted_for_review_by]).filter(Boolean))];
    const users = userIds.length ? await this.db.many<Row>(this.db.from('User').select('id,email,displayName,title,department,status,tenantId').in('id', userIds)).catch(() => []) : [];
    const byId = new Map(users.map((user) => [user.id, user]));
    const countPairs = rows.map((row) => ({ assessmentId: row.id, itemId: row.regulatory_item_id, obligationId: row.obligation_id }));
    const assessmentIds = countPairs.map((row) => row.assessmentId).filter(Boolean);
    const gaps = assessmentIds.length ? await this.db.many<Row>(this.db.from('regulatory_compliance_gaps').select('assessment_id,gap_status,severity,action_id,capa_id').in('assessment_id', assessmentIds)).catch(() => []) : [];
    return rows.map((row) => {
      const owner = row.owner_user_id ? byId.get(row.owner_user_id) ?? null : null;
      const assessor = row.assessor_user_id ? byId.get(row.assessor_user_id) ?? null : null;
      const reviewer = row.reviewer_user_id ? byId.get(row.reviewer_user_id) ?? null : null;
      const rowGaps = gaps.filter((gap) => gap.assessment_id === row.id);
      return {
        ...row,
        owner,
        assessor,
        reviewer,
        owner_label: owner?.displayName ?? row.owner_user_id ?? 'Unassigned',
        assessor_label: assessor?.displayName ?? row.assessor_user_id ?? 'Unassigned',
        reviewer_label: reviewer?.displayName ?? row.reviewer_user_id ?? 'Unassigned',
        source_label: row.source_title ?? row.obligation?.obligation_title ?? row.item?.requirement_title ?? row.source_record_id ?? 'Unlinked source',
        gap_count: rowGaps.filter((gap) => !['Resolved', 'Archived'].includes(gap.gap_status)).length,
        critical_gap_count: rowGaps.filter((gap) => ['Critical', 'Immediate Action Required'].includes(gap.severity) && !['Resolved', 'Archived'].includes(gap.gap_status)).length,
        action_count: rowGaps.filter((gap) => gap.action_id).length,
        capa_count: rowGaps.filter((gap) => gap.capa_id).length,
        readOnly: this.isComplianceReadOnly(row),
        readOnlyReason: this.complianceReadOnlyReason(row)
      };
    });
  }

  private matchesComplianceFilters(row: Row, query: Row) {
    const view = String(query.view ?? '');
    if (view === 'not-assessed') return row.compliance_status === 'Not Assessed';
    if (view === 'compliant') return row.compliance_status === 'Compliant Foundation';
    if (view === 'partially-compliant') return row.compliance_status === 'Partially Compliant Foundation';
    if (view === 'non-compliant') return row.compliance_status === 'Non-Compliant Foundation';
    if (view === 'evidence-missing') return row.compliance_status === 'Evidence Missing' || row.evidence_readiness_status === 'Evidence Missing';
    if (view === 'action-required') return row.compliance_status === 'Action Required' || Number(row.action_count ?? 0) > 0;
    if (view === 'capa-open') return row.compliance_status === 'CAPA Open' || Number(row.capa_count ?? 0) > 0;
    if (view === 'review-required') return Boolean(row.review_required) || row.review_status === 'Review Due' || row.review_status === 'Under Review';
    if (view === 'stale') return row.stale_status && row.stale_status !== 'Current';
    if (view === 'high-risk') return ['High', 'Critical', 'Regulatory-Critical'].includes(row.criticality);
    if (view === 'psm-critical') return row.criticality === 'PSM-Critical' || row.related_psm_element;
    if (view === 'environmental-critical') return row.criticality === 'Environmental-Critical';
    if (view === 'safety-critical') return row.criticality === 'Safety-Critical';
    return true;
  }

  private async resolveComplianceSource(scope: Scope, dto: Row): Promise<Row> {
    const obligationId = dto.obligationId ?? dto.obligation_id;
    if (obligationId) {
      const obligation = await this.getObligation(scope, obligationId);
      return { ...obligation, source_type: 'Obligation', source_record_id: obligation.id, source_title: obligation.obligation_title };
    }
    const itemId = dto.regulatoryItemId ?? dto.regulatory_item_id ?? dto.sourceRecordId ?? dto.source_record_id;
    if (itemId) {
      const item = await this.getItem(scope, itemId);
      return { ...item, regulatory_item_id: item.id, source_type: 'Regulatory Item', source_record_id: item.id, source_title: item.requirement_title };
    }
    throw new BadRequestException('Compliance assessment requires a regulatory item or obligation source.');
  }

  private normalizeComplianceAssessmentInput(dto: Row, source: Row) {
    const sourceType = dto.sourceType ?? dto.source_type ?? source.source_type ?? (source.obligation_code ? 'Obligation' : 'Regulatory Item');
    const sourceTitle = dto.sourceTitle ?? dto.source_title ?? source.source_title ?? source.obligation_title ?? source.requirement_title ?? null;
    return {
      site_id: dto.siteId ?? dto.site_id ?? source.site_id ?? null,
      department_id: dto.departmentId ?? dto.department_id ?? source.department_id ?? null,
      unit_id: dto.unitId ?? dto.unit_id ?? source.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? source.area_id ?? null,
      equipment_id: dto.equipmentId ?? dto.equipment_id ?? source.equipment_id ?? null,
      regulatory_item_id: dto.regulatoryItemId ?? dto.regulatory_item_id ?? source.regulatory_item_id ?? (sourceType === 'Regulatory Item' ? source.id : null),
      obligation_id: dto.obligationId ?? dto.obligation_id ?? (sourceType === 'Obligation' ? source.id : null),
      jurisdiction_id: dto.jurisdictionId ?? dto.jurisdiction_id ?? source.jurisdiction_id ?? null,
      authority_id: dto.authorityId ?? dto.authority_id ?? source.authority_id ?? null,
      assessment_number: dto.assessmentNumber ?? dto.assessment_number ?? null,
      assessment_title: dto.assessmentTitle ?? dto.assessment_title ?? sourceTitle ?? 'Compliance assessment',
      source_type: sourceType,
      source_record_id: dto.sourceRecordId ?? dto.source_record_id ?? source.id ?? null,
      source_title: sourceTitle,
      assessment_status: dto.assessmentStatus ?? dto.assessment_status ?? 'Draft',
      compliance_status: dto.complianceStatus ?? dto.compliance_status ?? source.compliance_status ?? 'Not Assessed',
      previous_compliance_status: dto.previousComplianceStatus ?? dto.previous_compliance_status ?? source.compliance_status ?? null,
      gap_status: dto.gapStatus ?? dto.gap_status ?? 'Not Assessed',
      evidence_readiness_status: dto.evidenceReadinessStatus ?? dto.evidence_readiness_status ?? 'Not Assessed',
      criteria_status: dto.criteriaStatus ?? dto.criteria_status ?? 'Not Checked',
      stale_status: dto.staleStatus ?? dto.stale_status ?? 'Current',
      applicability_status_snapshot: dto.applicabilityStatusSnapshot ?? dto.applicability_status_snapshot ?? source.applicability_status ?? null,
      criticality: dto.criticality ?? source.criticality ?? 'Medium',
      category: dto.category ?? source.category ?? null,
      related_psm_element: dto.relatedPsmElement ?? dto.related_psm_element ?? source.related_psm_element ?? null,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? source.owner_user_id ?? null,
      assessor_user_id: dto.assessorUserId ?? dto.assessor_user_id ?? null,
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id ?? source.reviewer_user_id ?? null,
      review_required: Boolean(dto.reviewRequired ?? dto.review_required ?? false),
      review_status: dto.reviewStatus ?? dto.review_status ?? 'Not Required',
      manual_declaration: Boolean(dto.manualDeclaration ?? dto.manual_declaration ?? false),
      manual_declaration_reason: dto.manualDeclarationReason ?? dto.manual_declaration_reason ?? null,
      status_rationale: dto.statusRationale ?? dto.status_rationale ?? dto.rationale ?? null,
      decision_basis: dto.decisionBasis ?? dto.decision_basis ?? null,
      next_review_date: dto.nextReviewDate ?? dto.next_review_date ?? source.next_review_date ?? null
    };
  }

  private validateComplianceAssessment(row: Row, settings: Row) {
    if (row.site_id && !String(row.site_id).trim()) throw new BadRequestException('Invalid site scope.');
    if (row.compliance_status === 'Compliant Foundation' && settings.require_rationale_for_compliant_status && !String(row.status_rationale ?? '').trim()) throw new BadRequestException('Compliant Foundation requires a status rationale.');
    if (row.compliance_status === 'Partially Compliant Foundation' && !String(row.status_rationale ?? '').trim()) throw new BadRequestException('Partially Compliant Foundation requires rationale and gap explanation.');
    if (row.manual_declaration && !settings.allow_manual_compliance_declaration) throw new BadRequestException('Manual compliance declaration is not allowed by company/site policy.');
    if (row.manual_declaration && !String(row.manual_declaration_reason ?? '').trim()) throw new BadRequestException('Manual compliance declaration requires a reason.');
  }

  private complianceDecisionPatch(before: Row, status: string, dto: Row, settings: Row) {
    const rationale = dto.rationale ?? dto.statusRationale ?? dto.status_rationale ?? before.status_rationale;
    const manual = Boolean(dto.manualDeclaration ?? dto.manual_declaration ?? before.manual_declaration ?? false);
    const patch: Row = {
      compliance_status: status,
      previous_compliance_status: before.compliance_status ?? null,
      status_rationale: rationale ?? null,
      decision_basis: dto.decisionBasis ?? dto.decision_basis ?? before.decision_basis ?? null,
      manual_declaration: manual,
      manual_declaration_reason: dto.manualDeclarationReason ?? dto.manual_declaration_reason ?? before.manual_declaration_reason ?? null,
      review_required: Boolean(before.review_required || (manual && settings.require_review_for_manual_compliance_declaration) || (this.isCritical(before.criticality) && settings.require_review_for_critical_compliance_status)),
      review_status: before.review_status === 'Not Required' && (manual || this.isCritical(before.criticality)) ? 'Review Due' : before.review_status ?? 'Not Required',
      last_assessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (manual && settings.manual_declaration_expiry_days) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + Number(settings.manual_declaration_expiry_days));
      patch.manual_declaration_expires_at = expiry.toISOString();
    }
    this.validateComplianceAssessment({ ...before, ...patch }, settings);
    return patch;
  }

  private async patchComplianceAssessment(scope: Scope, assessmentId: string, patch: Row, select = '*') {
    return this.db.single<Row>(this.db.from('regulatory_compliance_assessments').update({ ...patch, updated_at: patch.updated_at ?? new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', assessmentId).select(select).single());
  }

  private complianceReadiness(assessment: Row, criteria: Row[] = [], evidence: Row[] = [], gaps: Row[] = []) {
    const blockers: Row[] = [];
    const add = (key: string, label: string, blocking = true) => blockers.push({ key, label, blocking });
    if (!assessment.status_rationale && ['Compliant Foundation', 'Partially Compliant Foundation', 'Non-Compliant Foundation', 'Not Applicable'].includes(assessment.compliance_status)) add('rationale', 'Status rationale is missing.');
    if (criteria.some((row) => row.blocking && !['Pass Foundation', 'Not Applicable'].includes(row.result_status))) add('criteria', 'Blocking compliance criteria are not passed.');
    if (evidence.some((row) => row.required && row.readiness_status === 'Evidence Missing')) add('evidence', 'Required evidence readiness is missing.');
    if (gaps.some((gap) => !['Resolved', 'Archived'].includes(gap.gap_status) && ['Critical', 'Immediate Action Required'].includes(gap.severity))) add('critical-gap', 'Critical compliance gaps remain open.');
    if (assessment.stale_status && assessment.stale_status !== 'Current') add('stale', `Compliance status is stale: ${assessment.stale_status}.`);
    if (!assessment.owner_user_id) add('owner', 'Compliance owner is missing.', false);
    const status = blockers.some((row) => row.blocking) ? 'Blocked' : blockers.length ? 'Ready With Warnings' : 'Ready';
    return { status, blockers, ready: status === 'Ready', generatedAt: new Date().toISOString() };
  }

  private complianceReadinessSummary(rows: Row[], gaps: Row[]) {
    const blockers = [
      { key: 'notAssessed', label: 'Not assessed', count: rows.filter((row) => row.compliance_status === 'Not Assessed').length },
      { key: 'evidenceMissing', label: 'Evidence missing', count: rows.filter((row) => row.evidence_readiness_status === 'Evidence Missing' || row.compliance_status === 'Evidence Missing').length },
      { key: 'openGaps', label: 'Open gaps', count: gaps.filter((gap) => !['Resolved', 'Archived'].includes(gap.gap_status)).length },
      { key: 'stale', label: 'Stale compliance status', count: rows.filter((row) => row.stale_status && row.stale_status !== 'Current').length }
    ];
    return { status: blockers.some((row) => row.count > 0) ? 'Attention Required' : 'Ready', blockers };
  }

  private complianceSummaryFromRows(rows: Row[], gaps: Row[] = []) {
    const openGaps = gaps.filter((gap) => !['Resolved', 'Archived'].includes(gap.gap_status));
    return {
      totalComplianceAssessments: rows.length,
      draft: rows.filter((row) => row.assessment_status === 'Draft').length,
      completed: rows.filter((row) => row.assessment_status === 'Completed').length,
      submittedReviewFoundation: rows.filter((row) => row.assessment_status === 'Submitted For Review Foundation').length,
      compliantFoundation: rows.filter((row) => row.compliance_status === 'Compliant Foundation').length,
      partiallyCompliantFoundation: rows.filter((row) => row.compliance_status === 'Partially Compliant Foundation').length,
      nonCompliantFoundation: rows.filter((row) => row.compliance_status === 'Non-Compliant Foundation').length,
      evidenceMissing: rows.filter((row) => row.compliance_status === 'Evidence Missing' || row.evidence_readiness_status === 'Evidence Missing').length,
      actionRequired: rows.filter((row) => row.compliance_status === 'Action Required' || Number(row.action_count ?? 0) > 0).length,
      capaOpen: rows.filter((row) => row.compliance_status === 'CAPA Open' || Number(row.capa_count ?? 0) > 0).length,
      reviewRequired: rows.filter((row) => row.review_required || row.review_status === 'Review Due').length,
      notApplicable: rows.filter((row) => row.compliance_status === 'Not Applicable').length,
      unknown: rows.filter((row) => row.compliance_status === 'Unknown').length,
      staleComplianceStatus: rows.filter((row) => row.stale_status && row.stale_status !== 'Current').length,
      manualDeclarations: rows.filter((row) => row.manual_declaration).length,
      openGaps: openGaps.length,
      criticalGaps: openGaps.filter((gap) => ['Critical', 'Immediate Action Required'].includes(gap.severity)).length,
      overdueGaps: openGaps.filter((gap) => gap.due_date && new Date(gap.due_date) < new Date()).length,
      gapsWithActions: openGaps.filter((gap) => gap.action_id || gap.capa_id).length,
      gapsWithoutActions: openGaps.filter((gap) => !gap.action_id && !gap.capa_id).length
    };
  }

  private complianceMatrixRow(row: Row) {
    return {
      id: row.id,
      source: row.source_label,
      obligation: row.obligation?.obligation_title ?? null,
      jurisdiction: row.jurisdiction_id ?? row.item?.jurisdiction_level ?? null,
      scope: [row.site_id, row.unit_id, row.area_id, row.equipment_id].filter(Boolean).join(' / ') || 'Company',
      category: row.category,
      psmElement: row.related_psm_element,
      applicability: row.applicability_status_snapshot,
      complianceStatus: row.compliance_status,
      evidenceReadiness: row.evidence_readiness_status,
      gapStatus: row.gap_status,
      criticality: row.criticality,
      owner: row.owner_label,
      assessor: row.assessor_label,
      reviewer: row.reviewer_label,
      nextReview: row.next_review_date,
      staleStatus: row.stale_status,
      href: `/regulatory/compliance-status/assessments/${row.id}`
    };
  }

  private complianceAssessmentOverview(assessment: Row, criteria: Row[], evidence: Row[], gaps: Row[]) {
    return {
      cards: {
        complianceStatus: assessment.compliance_status,
        assessmentStatus: assessment.assessment_status,
        evidenceReadiness: assessment.evidence_readiness_status,
        criteriaStatus: assessment.criteria_status,
        gapStatus: assessment.gap_status,
        openGaps: gaps.filter((gap) => !['Resolved', 'Archived'].includes(gap.gap_status)).length,
        criticalGaps: gaps.filter((gap) => ['Critical', 'Immediate Action Required'].includes(gap.severity) && !['Resolved', 'Archived'].includes(gap.gap_status)).length,
        criteriaCount: criteria.length,
        evidenceExpectations: evidence.length,
        reviewRequired: assessment.review_required,
        staleStatus: assessment.stale_status
      }
    };
  }

  private complianceDecision(assessment: Row, criteria: Row[], evidence: Row[], gaps: Row[]) {
    return {
      currentStatus: assessment.compliance_status,
      rationale: assessment.status_rationale,
      manualDeclaration: assessment.manual_declaration,
      reviewRequired: assessment.review_required,
      readiness: this.complianceReadiness(assessment, criteria, evidence, gaps),
      disabledReasons: this.complianceDecisionDisabledReasons(assessment, criteria, evidence, gaps)
    };
  }

  private complianceDecisionDisabledReasons(assessment: Row, criteria: Row[], evidence: Row[], gaps: Row[]) {
    const reasons: string[] = [];
    if (this.isComplianceReadOnly(assessment)) reasons.push(this.complianceReadOnlyReason(assessment) ?? 'Assessment is read-only.');
    if (criteria.some((row) => row.blocking && row.result_status === 'Fail Foundation')) reasons.push('Blocking criteria failed.');
    if (evidence.some((row) => row.required && row.readiness_status === 'Evidence Missing')) reasons.push('Required evidence readiness is missing.');
    if (gaps.some((gap) => ['Critical', 'Immediate Action Required'].includes(gap.severity) && !['Resolved', 'Archived'].includes(gap.gap_status))) reasons.push('Critical gaps are open.');
    return reasons;
  }

  private evidenceReadinessStatus(evidence: Row[], criteria: Row[]) {
    if (!evidence.length && !criteria.some((row) => row.evidence_required)) return 'Evidence Not Required';
    if (evidence.some((row) => row.required && row.readiness_status === 'Evidence Missing')) return 'Evidence Missing';
    if (evidence.some((row) => row.readiness_status === 'Evidence Restricted')) return 'Evidence Restricted';
    if (evidence.length && evidence.every((row) => !row.required || row.readiness_status === 'Evidence Ready Foundation')) return 'Evidence Ready Foundation';
    return 'Evidence Expected';
  }

  private detectComplianceGapsForAssessment(assessment: Row, settings: Row) {
    const gaps: Row[] = [];
    const push = (gap_type: string, gap_title: string, severity = 'Medium', extra: Row = {}) => gaps.push({
      gap_type,
      gap_title,
      gap_description: extra.gap_description ?? gap_title,
      severity,
      criticality: assessment.criticality ?? null,
      owner_user_id: assessment.owner_user_id ?? null,
      recommended_fix: extra.recommended_fix ?? 'Review compliance foundation status, rationale, evidence readiness, and action/CAPA linkage.',
      action_required: Boolean(extra.action_required ?? false),
      capa_required: Boolean(extra.capa_required ?? false),
      evidence_required: Boolean(extra.evidence_required ?? false),
      review_required: Boolean(extra.review_required ?? assessment.review_required ?? false)
    });
    if (assessment.compliance_status === 'Not Assessed') push('Missing Compliance Assessment', 'Compliance status has not been assessed.', 'High', { review_required: true });
    if (assessment.evidence_readiness_status === 'Evidence Missing' && settings.auto_create_gap_for_evidence_missing) push('Missing Evidence', 'Compliance evidence readiness is missing.', 'High', { evidence_required: true });
    if (!assessment.owner_user_id) push('Missing Owner', 'Compliance owner is missing.');
    if (!assessment.applicability_status_snapshot || assessment.applicability_status_snapshot === 'Not Assessed') push('Missing Applicability', 'Applicability status is missing or not assessed.');
    if (assessment.compliance_status === 'Partially Compliant Foundation' && settings.require_gap_for_partially_compliant_status) push('Manual Gap', 'Partially compliant status requires a compliance gap.', 'High', { action_required: true });
    if (assessment.compliance_status === 'Non-Compliant Foundation' && settings.auto_create_gap_for_non_compliance) push(this.isCritical(assessment.criticality) ? 'Critical Requirement Non-Compliant' : 'Manual Gap', 'Non-compliant requirement requires action/CAPA foundation.', this.isCritical(assessment.criticality) ? 'Critical' : 'High', { action_required: true, capa_required: true, review_required: true });
    if (assessment.stale_status && assessment.stale_status !== 'Current') push('Stale Compliance Status', `Compliance status is stale: ${assessment.stale_status}.`, 'High', { review_required: true });
    return gaps;
  }

  private rollupStatusFromObligations(item: Row, obligations: Row[], counts: Row) {
    if (item.applicability_status === 'Not Applicable') return 'Not Applicable';
    if (!obligations.length) return item.compliance_status ?? 'Not Assessed';
    if (counts.stale_count > 0) return 'Review Required';
    if (counts.non_compliant_count > 0) return 'Non-Compliant Foundation';
    if (counts.evidence_missing_count > 0) return 'Evidence Missing';
    if (counts.action_required_count > 0) return 'Action Required';
    if (counts.capa_open_count > 0) return 'CAPA Open';
    if (counts.partial_count > 0) return 'Partially Compliant Foundation';
    if (counts.not_applicable_count === obligations.length) return 'Not Applicable';
    if (counts.compliant_count === obligations.length - counts.not_applicable_count) return 'Compliant Foundation';
    return 'Not Assessed';
  }

  private async propagateComplianceStatus(scope: Scope, userId: string, assessment: Row) {
    if (assessment.obligation_id) {
      const before = await this.getObligation(scope, assessment.obligation_id);
      const row = await this.db.single<Row>(this.db.from('regulatory_obligations').update({
        compliance_status: assessment.compliance_status,
        status_rationale: assessment.status_rationale,
        stale_status: assessment.stale_status ?? 'Current',
        updated_by: userId,
        updated_at: new Date().toISOString()
      }).eq('company_id', scope.companyId).eq('id', assessment.obligation_id).select('*,parent:regulatory_register_items(*)').single());
      await this.writeObligationMutation(scope, userId, 'Obligation compliance status updated from assessment', assessment.obligation_id, before, row, assessment.status_rationale ?? 'Compliance assessment applied to obligation');
      if (assessment.regulatory_item_id) await this.recalculateComplianceRollup(userId, scope, assessment.regulatory_item_id, ['regulatory.compliance.rollup.recalculate', 'regulatory.manage']).catch(() => null);
      return;
    }
    if (assessment.regulatory_item_id) {
      const before = await this.getItem(scope, assessment.regulatory_item_id);
      const row = await this.db.single<Row>(this.db.from('regulatory_register_items').update({
        compliance_status: assessment.compliance_status,
        status_rationale: assessment.status_rationale,
        updated_by: userId,
        updated_at: new Date().toISOString()
      }).eq('company_id', scope.companyId).eq('id', assessment.regulatory_item_id).select().single());
      await this.writeMutation(scope, userId, 'Requirement compliance status updated from assessment', assessment.regulatory_item_id, before, row, assessment.status_rationale ?? 'Compliance assessment applied to requirement');
    }
  }

  private isCritical(value?: string | null) {
    return Boolean(value && criticalRiskBasisStatuses.has(value));
  }

  private async generateComplianceAssessmentCode(scope: Scope) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_compliance_assessments').select('id').eq('company_id', scope.companyId)).catch(() => []);
    return `REG-COMP-${new Date().getFullYear()}-${String(rows.length + 1).padStart(6, '0')}`;
  }

  private async generateComplianceGapCode(scope: Scope) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_compliance_gaps').select('id').eq('company_id', scope.companyId)).catch(() => []);
    return `REG-GAP-${new Date().getFullYear()}-${String(rows.length + 1).padStart(6, '0')}`;
  }

  private isComplianceReadOnly(row: Row) {
    return ['Archived', 'Superseded'].includes(row.assessment_status);
  }

  private complianceReadOnlyReason(row: Row) {
    if (row.assessment_status === 'Archived') return 'Archived compliance assessments are read-only unless restored through a controlled workflow.';
    if (row.assessment_status === 'Superseded') return 'Superseded compliance assessments are immutable; create a new assessment version.';
    return null;
  }

  private async writeComplianceStatusHistory(scope: Scope, userId: string, assessmentId: string, before: Row, after: Row, reason: string) {
    await this.db.single(this.db.from('regulatory_compliance_status_history').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: after.site_id ?? before.site_id ?? null,
      assessment_id: assessmentId,
      regulatory_item_id: after.regulatory_item_id ?? before.regulatory_item_id ?? null,
      obligation_id: after.obligation_id ?? before.obligation_id ?? null,
      source_type: after.source_type ?? before.source_type ?? null,
      old_status: before.compliance_status ?? null,
      new_status: after.compliance_status,
      status_reason: reason,
      manual_declaration: Boolean(after.manual_declaration),
      changed_by: userId
    }).select('id').single()).catch(() => null);
  }

  private async writeComplianceMutation(scope: Scope, userId: string, title: string, assessmentId: string | null, before: Row | null, after: Row | null, reason: string) {
    const entityId = after?.id ?? before?.id ?? assessmentId ?? after?.gap_id ?? before?.gap_id ?? null;
    const auditInput: Parameters<AuditService['write']>[0] = { tenantId: scope.companyId, actorId: userId, action: title, entityType: 'RegulatoryComplianceStatus', before: before ?? null, after: after ?? null, metadata: { reason, sourceModule: 'Regulatory Compliance Status' } };
    if (entityId) auditInput.entityId = entityId;
    const audit = await this.audit.write(auditInput).catch(() => null);
    await this.db.single(this.db.from('regulatory_compliance_history_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: after?.site_id ?? before?.site_id ?? scope.selectedSiteId ?? null,
      unit_id: after?.unit_id ?? before?.unit_id ?? null,
      area_id: after?.area_id ?? before?.area_id ?? null,
      equipment_id: after?.equipment_id ?? before?.equipment_id ?? null,
      assessment_id: assessmentId ?? after?.assessment_id ?? before?.assessment_id ?? null,
      gap_id: after?.gap_id ?? before?.gap_id ?? (after?.gap_number ? after?.id : null),
      regulatory_item_id: after?.regulatory_item_id ?? before?.regulatory_item_id ?? null,
      obligation_id: after?.obligation_id ?? before?.obligation_id ?? null,
      event_type: title.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      event_title: title,
      event_description: reason,
      before_value_json: before ?? null,
      after_value_json: after ?? null,
      metadata_json: { sourceModule: 'Regulatory Compliance Status' },
      actor_user_id: userId,
      source_module: 'Regulatory Compliance Status',
      source_record_id: entityId,
      audit_log_id: (audit as { id?: string } | null)?.id ?? null
    }).select('id').single()).catch(() => null);
  }

  private async loadObligations(scope: Scope, query: Row) {
    let q = this.db.from('regulatory_obligations').select('*,parent:regulatory_register_items(*)').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.siteId) q = q.eq('site_id', query.siteId);
    if (query.unitId) q = q.eq('unit_id', query.unitId);
    if (query.areaId) q = q.eq('area_id', query.areaId);
    if (query.equipmentId) q = q.eq('equipment_id', query.equipmentId);
    if (query.regulatoryItemId) q = q.eq('regulatory_item_id', query.regulatoryItemId);
    if (query.jurisdictionId) q = q.eq('jurisdiction_id', query.jurisdictionId);
    if (query.authorityId) q = q.eq('authority_id', query.authorityId);
    if (query.category) q = q.eq('category', query.category);
    if (query.relatedModule) q = q.eq('related_module', query.relatedModule);
    if (query.relatedPsmElement) q = q.eq('related_psm_element', query.relatedPsmElement);
    if (query.applicabilityStatus) q = q.eq('applicability_status', query.applicabilityStatus);
    if (query.complianceStatus) q = q.eq('compliance_status', query.complianceStatus);
    if (query.obligationStatus) q = q.eq('obligation_status', query.obligationStatus);
    if (query.criticality) q = q.eq('criticality', query.criticality);
    if (query.ownerUserId) q = q.eq('owner_user_id', query.ownerUserId);
    if (query.frequency) q = q.eq('frequency', query.frequency);
    if (query.search) q = q.or(`obligation_title.ilike.%${query.search}%,obligation_code.ilike.%${query.search}%,obligation_reference.ilike.%${query.search}%`);
    const rows = await this.db.many<Row>(q.order('updated_at', { ascending: false })).catch(() => []);
    const enriched = await this.enrichObligations(rows);
    return enriched.filter((row) => this.matchesObligationFilters(row, query));
  }

  private async enrichObligations(rows: Row[]): Promise<Row[]> {
    const userIds = [...new Set(rows.flatMap((row) => [row.owner_user_id, row.compliance_owner_user_id, row.site_owner_user_id, row.reviewer_user_id, row.evidence_owner_user_id, row.responsible_module_owner_user_id]).filter(Boolean))];
    const users = userIds.length ? await this.db.many<Row>(this.db.from('User').select('id,email,displayName,title,department,status,tenantId').in('id', userIds)).catch(() => []) : [];
    const byId = new Map(users.map((user) => [user.id, user]));
    return rows.map((row) => this.enrichObligation(row, byId));
  }

  private enrichObligation(row: Row, users = new Map<string, Row>()): Row {
    const dueStatus = this.obligationDueStatus(row);
    const stale = this.obligationStaleStatus(row);
    const parent = row.parent ?? null;
    const owner = row.owner_user_id ? users.get(row.owner_user_id) ?? null : null;
    return {
      ...row,
      parent,
      parent_requirement_label: parent?.requirement_code ? `${parent.requirement_code} - ${parent.requirement_title ?? 'Untitled'}` : row.regulatory_item_id,
      owner,
      complianceOwner: row.compliance_owner_user_id ? users.get(row.compliance_owner_user_id) ?? null : null,
      siteOwner: row.site_owner_user_id ? users.get(row.site_owner_user_id) ?? null : null,
      reviewer: row.reviewer_user_id ? users.get(row.reviewer_user_id) ?? null : null,
      owner_label: owner?.displayName ?? row.owner_user_id ?? 'Unassigned',
      due_status: dueStatus,
      obligation_status_calculated: dueStatus === 'Overdue' || dueStatus === 'Due Soon' ? dueStatus : row.obligation_status,
      stale_status: stale.status,
      stale_reason: stale.reason,
      evidence_expectation_status: this.evidenceExpectationStatus(row),
      module_mapping_status: this.moduleMappingStatus(row),
      readOnly: this.isObligationReadOnly(row),
      readOnlyReason: this.obligationReadOnlyReason(row)
    };
  }

  private async normalizeObligationInput(scope: Scope, dto: Row, mode: 'create' | 'update') {
    const normalized: Row = {};
    const map: Record<string, string> = {
      regulatoryItemId: 'regulatory_item_id',
      parentObligationId: 'parent_obligation_id',
      obligationCode: 'obligation_code',
      obligationTitle: 'obligation_title',
      obligationType: 'obligation_type',
      obligationReference: 'obligation_reference',
      shortSummary: 'short_summary',
      requirementSummary: 'requirement_summary',
      effectiveDate: 'effective_date',
      expiryDate: 'expiry_date',
      supersedesObligationId: 'supersedes_obligation_id',
      supersededByObligationId: 'superseded_by_obligation_id',
      obligationStatus: 'obligation_status',
      applicabilityStatus: 'applicability_status',
      complianceStatus: 'compliance_status',
      evidenceExpectationStatus: 'evidence_expectation_status',
      moduleMappingStatus: 'module_mapping_status',
      staleStatus: 'stale_status',
      staleReason: 'stale_reason',
      relatedPsmElement: 'related_psm_element',
      relatedModule: 'related_module',
      riskBasis: 'risk_basis',
      regulatoryImpact: 'regulatory_impact',
      safetyImpact: 'safety_impact',
      environmentalImpact: 'environmental_impact',
      businessImpact: 'business_impact',
      dueDate: 'due_date',
      startDate: 'start_date',
      nextDueDate: 'next_due_date',
      lastCompletedDate: 'last_completed_date',
      triggerEvent: 'trigger_event',
      recurrenceRuleJson: 'recurrence_rule_json',
      gracePeriodDays: 'grace_period_days',
      ownerUserId: 'owner_user_id',
      complianceOwnerUserId: 'compliance_owner_user_id',
      siteOwnerUserId: 'site_owner_user_id',
      reviewerUserId: 'reviewer_user_id',
      responsibleDepartmentId: 'responsible_department_id',
      reviewFrequency: 'review_frequency',
      nextReviewDate: 'next_review_date',
      lastReviewDate: 'last_review_date',
      evidenceRequired: 'evidence_required',
      actionRequiredFoundation: 'action_required_foundation',
      capaRequiredFoundation: 'capa_required_foundation',
      statusRationale: 'status_rationale',
      applicabilityRationale: 'applicability_rationale',
      scopeChangeReason: 'scope_change_reason'
    };
    Object.entries(map).forEach(([camel, snake]) => {
      if (dto[camel] !== undefined) normalized[snake] = dto[camel];
      if (dto[snake] !== undefined) normalized[snake] = dto[snake];
    });
    ['site_id', 'department_id', 'unit_id', 'area_id', 'equipment_id', 'jurisdiction_id', 'authority_id', 'obligation_title', 'obligation_type', 'obligation_reference', 'short_summary', 'requirement_summary', 'version', 'category', 'topic', 'criticality', 'frequency', 'notes'].forEach((key) => {
      if (dto[key] !== undefined) normalized[key] = dto[key];
    });
    if (dto.siteId !== undefined) normalized.site_id = dto.siteId;
    if (dto.departmentId !== undefined) normalized.department_id = dto.departmentId;
    if (dto.unitId !== undefined) normalized.unit_id = dto.unitId;
    if (dto.areaId !== undefined) normalized.area_id = dto.areaId;
    if (dto.equipmentId !== undefined) normalized.equipment_id = dto.equipmentId;
    if (dto.jurisdictionId !== undefined) normalized.jurisdiction_id = dto.jurisdictionId;
    if (dto.authorityId !== undefined) normalized.authority_id = dto.authorityId;
    if (mode === 'create' && !normalized.obligation_status) normalized.obligation_status = dto.saveAsActive ? 'Active' : 'Draft';
    if (mode === 'create' && !normalized.applicability_status) normalized.applicability_status = 'Inherited From Parent';
    if (mode === 'create' && !normalized.compliance_status) normalized.compliance_status = 'Not Assessed';
    if (normalized.site_id && !this.canAccessSite(scope, normalized.site_id)) throw new ForbiddenException('Selected site is outside your allowed company/site scope.');
    for (const key of ['owner_user_id', 'compliance_owner_user_id', 'site_owner_user_id', 'reviewer_user_id']) {
      if (normalized[key]) await this.assertUserInScope(scope, normalized[key]);
    }
    return normalized;
  }

  private validateObligationForStatus(row: Row, settings: Row) {
    const isActive = row.obligation_status && row.obligation_status !== 'Draft';
    if (!row.regulatory_item_id) throw new BadRequestException('Parent regulatory register item is required.');
    if (isActive && !row.obligation_title) throw new BadRequestException('Active obligation requires a title.');
    if (isActive && !row.obligation_type) throw new BadRequestException('Active obligation requires an obligation type.');
    if (isActive && !row.category) throw new BadRequestException('Active obligation requires a category.');
    if (isActive && !row.criticality) throw new BadRequestException('Active obligation requires criticality.');
    if (isActive && settings.require_owner_for_active_obligation !== false && !row.owner_user_id) throw new BadRequestException('Active obligation requires an owner under company/site settings.');
    if (isActive && settings.require_scope_for_active_obligation !== false && !row.site_id && !row.unit_id && !row.area_id && !row.equipment_id) throw new BadRequestException('Active obligation requires scope under company/site settings.');
    if (isActive && settings.require_frequency_for_active_obligation && !row.frequency) throw new BadRequestException('Active obligation requires frequency under company/site settings.');
    if (isActive && settings.require_due_date_or_trigger_for_active_obligation && !row.due_date && !row.next_due_date && !row.trigger_event) throw new BadRequestException('Active obligation requires a due date or trigger event under company/site settings.');
    if (row.applicability_status === 'Not Applicable' && settings.require_rationale_for_obligation_not_applicable !== false && !row.applicability_rationale) throw new BadRequestException('Not Applicable obligation requires rationale.');
    if (row.applicability_status === 'Partially Applicable' && !row.applicability_rationale) throw new BadRequestException('Partially Applicable obligation requires included/excluded scope rationale.');
    if (criticalRiskBasisStatuses.has(row.criticality) && settings.require_risk_basis_for_critical_obligation !== false && !row.risk_basis) throw new BadRequestException('Critical obligation requires risk basis under company/site settings.');
    if (['Compliant Foundation', 'Partially Compliant Foundation', 'Non-Compliant Foundation'].includes(row.compliance_status) && !row.status_rationale) throw new BadRequestException('Compliance status foundation requires rationale.');
  }

  private normalizeObligationApplicability(status: string | undefined, parentStatus: string | undefined) {
    if (!status || status === 'Inherited From Parent') return parentStatus ?? 'Inherited From Parent';
    return status;
  }

  private evidenceExpectationStatus(row: Row) {
    if (row.evidence_expectation_status) return row.evidence_expectation_status;
    if (row.evidence_required === false) return 'No Evidence Required';
    if (row.evidence_required && (row.evidence_type_expected || row.evidence_description)) return 'Evidence Required';
    if (row.evidence_required || ['Critical', 'Safety-Critical', 'Environmental-Critical', 'PSM-Critical', 'Regulatory-Critical'].includes(row.criticality)) return 'Evidence Expectation Missing';
    return 'No Evidence Required';
  }

  private moduleMappingStatus(row: Row) {
    if (row.module_mapping_status && row.module_mapping_status !== 'Not Mapped') return row.module_mapping_status;
    if (row.related_module) return 'Mapped To Module';
    if (row.criticality === 'PSM-Critical' || row.related_psm_element) return 'Mapping Required';
    return row.module_mapping_status ?? 'Not Mapped';
  }

  private obligationDueStatus(row: Row) {
    const date = row.next_due_date ?? row.due_date;
    if (!date) return 'No Due Date';
    const today = this.startOfToday();
    const due = new Date(date);
    if (due < today) return 'Overdue';
    const soon = new Date(today);
    soon.setDate(soon.getDate() + Number(row.due_soon_days ?? 30));
    return due <= soon ? 'Due Soon' : 'Scheduled';
  }

  private obligationStaleStatus(row: Row) {
    if (row.stale_status && row.stale_status !== 'Current') return { status: row.stale_status, reason: row.stale_reason ?? row.stale_status };
    if (row.obligation_status === 'Superseded') return { status: 'Superseded', reason: 'Obligation was superseded.' };
    if ((row.parent?.register_status ?? row.parent_register_status) === 'Superseded') return { status: 'Parent Requirement Superseded', reason: 'Parent regulatory requirement was superseded.' };
    if (row.next_review_date && new Date(row.next_review_date) < this.startOfToday()) return { status: 'Review Overdue', reason: 'Next review date has passed.' };
    return { status: 'Current', reason: null };
  }

  private obligationSummaryFromRows(rows: Row[], gaps: Row[] = []) {
    return {
      totalObligations: rows.length,
      total: rows.length,
      activeObligations: rows.filter((row) => row.obligation_status === 'Active').length,
      draftObligations: rows.filter((row) => row.obligation_status === 'Draft').length,
      applicableObligations: rows.filter((row) => row.applicability_status === 'Applicable').length,
      partiallyApplicableObligations: rows.filter((row) => row.applicability_status === 'Partially Applicable').length,
      notApplicableObligations: rows.filter((row) => row.applicability_status === 'Not Applicable').length,
      notAssessedObligations: rows.filter((row) => row.applicability_status === 'Not Assessed').length,
      obligationsUnderReview: rows.filter((row) => row.obligation_status === 'Under Review').length,
      missingOwner: rows.filter((row) => !row.owner_user_id).length,
      missingEvidenceExpectation: rows.filter((row) => row.evidence_expectation_status === 'Evidence Expectation Missing').length,
      missingModuleMapping: rows.filter((row) => row.module_mapping_status === 'Mapping Required' || row.module_mapping_status === 'Not Mapped').length,
      missingFrequency: rows.filter((row) => !row.frequency).length,
      missingDueDate: rows.filter((row) => !row.due_date && !row.next_due_date && !row.trigger_event).length,
      dueSoon: rows.filter((row) => row.due_status === 'Due Soon').length,
      overdue: rows.filter((row) => row.due_status === 'Overdue').length,
      highRisk: rows.filter((row) => ['High', 'Critical', 'Regulatory-Critical'].includes(row.criticality)).length,
      safetyCritical: rows.filter((row) => row.criticality === 'Safety-Critical').length,
      environmentalCritical: rows.filter((row) => row.criticality === 'Environmental-Critical').length,
      psmCritical: rows.filter((row) => row.criticality === 'PSM-Critical').length,
      regulatoryCritical: rows.filter((row) => row.criticality === 'Regulatory-Critical').length,
      evidenceRequired: rows.filter((row) => row.evidence_required || row.evidence_expectation_status === 'Evidence Required').length,
      actionRequiredFoundation: rows.filter((row) => row.action_required_foundation).length,
      linkedToAudit: rows.filter((row) => Number(row.linked_audit_count ?? 0) > 0).length,
      linkedToEvidence: rows.filter((row) => Number(row.linked_evidence_count ?? 0) > 0).length,
      linkedToActionsCapa: rows.filter((row) => Number(row.linked_action_count ?? 0) > 0 || row.capa_required_foundation).length,
      staleObligations: rows.filter((row) => row.stale_status && row.stale_status !== 'Current').length,
      recentlyAdded: rows.filter((row) => this.withinDays(row.created_at, 30)).length,
      recentlyUpdated: rows.filter((row) => this.withinDays(row.updated_at, 30)).length,
      openGaps: gaps.filter((gap) => gap.gap_status !== 'Resolved').length
    };
  }

  private obligationReadinessSummary(rows: Row[], gaps: Row[]) {
    const blockers = [
      { key: 'missing_owner', label: 'Missing owner', count: rows.filter((row) => !row.owner_user_id).length },
      { key: 'missing_evidence_expectation', label: 'Missing evidence expectation', count: rows.filter((row) => row.evidence_expectation_status === 'Evidence Expectation Missing').length },
      { key: 'missing_module_mapping', label: 'Missing module mapping', count: rows.filter((row) => row.module_mapping_status === 'Mapping Required' || row.module_mapping_status === 'Not Mapped').length },
      { key: 'overdue', label: 'Overdue obligations', count: rows.filter((row) => row.due_status === 'Overdue').length },
      { key: 'open_gaps', label: 'Open obligation gaps', count: gaps.filter((gap) => gap.gap_status !== 'Resolved').length }
    ];
    return { status: blockers.some((blocker) => blocker.count > 0) ? 'Attention Required' : 'Ready Foundation', blockers };
  }

  private singleObligationReadiness(obligation: Row, gaps: Row[]) {
    const blockers = this.detectGapsForObligation(obligation, {});
    return {
      status: blockers.length || gaps.some((gap) => gap.gap_status !== 'Resolved') ? 'Attention Required' : 'Ready Foundation',
      blockers: blockers.map((gap) => ({ key: gap.gap_type, label: gap.gap_title, severity: gap.severity })),
      openGaps: gaps.filter((gap) => gap.gap_status !== 'Resolved').length
    };
  }

  private detectGapsForObligation(row: Row, settings: Row) {
    const gaps: Row[] = [];
    const add = (gap_type: string, gap_title: string, recommended_fix: string, severity = 'Medium') => gaps.push({ gap_type, gap_title, gap_description: recommended_fix, severity, criticality: row.criticality, owner_user_id: row.owner_user_id, due_date: row.next_due_date ?? row.due_date ?? null, recommended_fix });
    if (!row.owner_user_id && settings.auto_create_gap_for_missing_obligation_owner !== false) add('Missing Owner', 'Obligation owner is missing', 'Assign an owner from IAM/RBAC with access to the company/site scope.', 'High');
    if (!row.site_id && !row.unit_id && !row.area_id && !row.equipment_id) add('Missing Scope', 'Obligation scope is missing', 'Define company, site, unit, area, equipment, process, chemical, or activity scope.');
    if (['Applicable', 'Partially Applicable', 'Not Applicable'].includes(row.applicability_status) && !row.applicability_rationale) add('Missing Applicability Rationale', 'Applicability rationale is missing', 'Add inherited applicability source or decision rationale.');
    if (row.evidence_expectation_status === 'Evidence Expectation Missing' && settings.auto_create_gap_for_missing_evidence_expectation !== false) add('Missing Evidence Expectation', 'Evidence expectation is missing', 'Define evidence type, owner, source module, and acceptance criteria foundation.', 'High');
    if (!row.frequency && settings.require_frequency_for_active_obligation) add('Missing Frequency', 'Obligation frequency is missing', 'Set the check/review/performance frequency or trigger event.');
    if (!row.due_date && !row.next_due_date && !row.trigger_event && settings.require_due_date_or_trigger_for_active_obligation) add('Missing Due Date', 'Due date or trigger event is missing', 'Set due date, next due date, or trigger event.');
    if ((row.module_mapping_status === 'Mapping Required' || row.module_mapping_status === 'Not Mapped') && settings.auto_create_gap_for_missing_module_mapping !== false) add('Missing Module Mapping', 'Module mapping is missing', 'Map the obligation to a PSM module or foundation record.');
    if (row.compliance_status === 'Not Assessed') add('Compliance Status Not Assessed', 'Compliance status foundation is not assessed', 'Set foundation status with rationale when ready.');
    if (criticalRiskBasisStatuses.has(row.criticality) && settings.require_risk_basis_for_critical_obligation !== false && !row.risk_basis) add('Critical Obligation Missing Risk Basis', 'Critical obligation risk basis is missing', 'Add risk basis for criticality selection.', 'High');
    if (row.criticality === 'PSM-Critical' && row.module_mapping_status !== 'Mapped To Module' && settings.require_module_mapping_for_psm_critical_obligation !== false) add('PSM-Critical Obligation Missing Module Mapping', 'PSM-critical obligation is not mapped', 'Map the obligation to the accountable PSM module.', 'High');
    if (row.due_status === 'Overdue') add('Overdue Obligation', 'Obligation is overdue', 'Review, complete, or create action foundation for the overdue obligation.', 'High');
    if (row.stale_status && row.stale_status !== 'Current') add('Stale Obligation', 'Obligation is stale', row.stale_reason ?? 'Review/reassess stale obligation.');
    return gaps;
  }

  private obligationOverviewCards(item: Row) {
    return {
      title: item.obligation_title,
      code: item.obligation_code,
      parentRequirement: item.parent_requirement_label,
      jurisdiction: item.jurisdiction_id,
      category: item.category,
      relatedPsmElement: item.related_psm_element,
      relatedModule: item.related_module,
      criticality: item.criticality,
      applicabilityStatus: item.applicability_status,
      complianceStatus: item.compliance_status,
      obligationStatus: item.obligation_status_calculated ?? item.obligation_status,
      frequency: item.frequency,
      dueDate: item.next_due_date ?? item.due_date,
      owner: item.owner?.displayName ?? item.owner_user_id,
      evidenceRequired: item.evidence_required,
      evidenceExpectationStatus: item.evidence_expectation_status,
      moduleMappingStatus: item.module_mapping_status,
      linkedAuditCount: item.linked_audit_count ?? 0,
      linkedEvidenceCount: item.linked_evidence_count ?? 0,
      linkedActionCount: item.linked_action_count ?? 0,
      staleStatus: item.stale_status,
      lastUpdated: item.updated_at,
      locked: item.locked,
      archived: item.obligation_status === 'Archived'
    };
  }

  private obligationMatrixRow(row: Row) {
    return {
      ...row,
      parentRequirement: row.parent_requirement_label,
      obligation: `${row.obligation_code ?? 'No Code'} - ${row.obligation_title ?? 'Untitled obligation'}`,
      scope: [row.site_id, row.unit_id, row.area_id, row.equipment_id].filter(Boolean).join(' / ') || 'Company-wide',
      evidenceExpected: row.evidence_expectation_status,
      moduleMapping: row.module_mapping_status,
      auditLink: Number(row.linked_audit_count ?? 0) > 0 ? 'Linked' : 'Not Linked',
      actionLink: Number(row.linked_action_count ?? 0) > 0 ? 'Linked' : 'Not Linked',
      gaps: row.readiness?.openGaps ?? null
    };
  }

  private matchesObligationFilters(row: Row, query: Row) {
    const view = query.view;
    if (view === 'due-soon' && row.due_status !== 'Due Soon') return false;
    if (view === 'overdue' && row.due_status !== 'Overdue') return false;
    if (view === 'missing-owner' && row.owner_user_id) return false;
    if (view === 'missing-evidence' && row.evidence_expectation_status !== 'Evidence Expectation Missing') return false;
    if (view === 'missing-module-mapping' && row.module_mapping_status !== 'Mapping Required' && row.module_mapping_status !== 'Not Mapped') return false;
    if (view === 'stale' && (!row.stale_status || row.stale_status === 'Current')) return false;
    if (view === 'applicable' && row.applicability_status !== 'Applicable') return false;
    if (view === 'not-applicable' && row.applicability_status !== 'Not Applicable') return false;
    if (view === 'high-risk' && !['High', 'Critical', 'Regulatory-Critical'].includes(row.criticality)) return false;
    if (view === 'psm-critical' && row.criticality !== 'PSM-Critical') return false;
    if (view === 'environmental-critical' && row.criticality !== 'Environmental-Critical') return false;
    if (view === 'safety-critical' && row.criticality !== 'Safety-Critical') return false;
    if (query.evidenceRequired === 'true' && !row.evidence_required) return false;
    if (query.actionRequired === 'true' && !row.action_required_foundation) return false;
    if (query.stale === 'true' && (!row.stale_status || row.stale_status === 'Current')) return false;
    return true;
  }

  private async generateObligationCode(scope: Scope) {
    const prefix = `OBL-${new Date().getFullYear()}`;
    const rows = await this.db.many<Row>(this.db.from('regulatory_obligations').select('id').eq('company_id', scope.companyId)).catch(() => []);
    return `${prefix}-${String(rows.length + 1).padStart(5, '0')}`;
  }

  private async createInheritedObligationScope(scope: Scope, userId: string, obligation: Row, parent: Row) {
    const scopeRecordId = obligation.equipment_id ?? obligation.area_id ?? obligation.unit_id ?? obligation.site_id ?? parent.equipment_id ?? parent.area_id ?? parent.unit_id ?? parent.site_id ?? scope.companyId;
    const scopeType = obligation.equipment_id ?? parent.equipment_id ? 'Equipment' : obligation.area_id ?? parent.area_id ? 'Area' : obligation.unit_id ?? parent.unit_id ? 'Unit' : obligation.site_id ?? parent.site_id ? 'Site' : 'Company';
    return this.db.single(this.db.from('regulatory_obligation_scopes').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: obligation.site_id ?? parent.site_id ?? scope.selectedSiteId ?? null,
      obligation_id: obligation.id,
      regulatory_item_id: obligation.regulatory_item_id,
      scope_type: scopeType,
      scope_record_id: scopeRecordId,
      scope_label: 'Inherited from parent requirement',
      inherited_from_parent: true,
      included: true,
      applicability_status: obligation.applicability_status,
      applicability_rationale: obligation.applicability_rationale ?? 'Inherited from parent regulatory item',
      linked_by: userId
    }).select().single());
  }

  private async patchObligationStatus(userId: string, scope: Scope, obligationId: string, patch: Row, reason: string | undefined, title: string) {
    const before = await this.getObligation(scope, obligationId);
    const row = await this.db.single<Row>(this.db.from('regulatory_obligations').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', obligationId).select('*,parent:regulatory_register_items(*)').single());
    await this.writeObligationMutation(scope, userId, title, obligationId, before, row, String(reason ?? title));
    const statusKeys = ['obligation_status', 'applicability_status', 'compliance_status', 'evidence_expectation_status', 'module_mapping_status', 'stale_status'];
    for (const key of statusKeys) {
      if (patch[key] !== undefined && before[key] !== patch[key]) {
        await this.db.single(this.db.from('regulatory_obligation_status_history').insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: row.site_id ?? null,
          obligation_id: obligationId,
          status_type: key,
          old_status: before[key] ?? null,
          new_status: patch[key],
          status_reason: reason ?? title,
          changed_by: userId,
          changed_at: new Date().toISOString()
        }).select().single()).catch(() => null);
      }
    }
    return this.obligationOverview(scope, obligationId);
  }

  private isObligationReadOnly(row: Row) {
    return Boolean(row.locked || obligationReadOnlyStatuses.has(row.obligation_status));
  }

  private obligationReadOnlyReason(row: Row) {
    if (row.locked) return row.lock_reason ?? 'Obligation is locked.';
    if (obligationReadOnlyStatuses.has(row.obligation_status)) return `Obligation is ${row.obligation_status} and read-only.`;
    return null;
  }

  private async writeObligationMutation(scope: Scope, userId: string, title: string, obligationId: string | null, before: Row | null, after: Row | null, reason: string) {
    const auditInput: Parameters<AuditService['write']>[0] = {
      tenantId: scope.companyId,
      actorId: userId,
      action: title,
      entityType: 'RegulatoryObligation',
      entityId: obligationId ?? after?.id ?? before?.id,
      before: before ?? null,
      after: after ?? null,
      metadata: { reason, siteId: after?.site_id ?? before?.site_id ?? scope.selectedSiteId ?? null }
    };
    const audit = await this.audit.write(auditInput).catch(() => null);
    await this.db.single(this.db.from('regulatory_obligation_history_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: after?.site_id ?? before?.site_id ?? scope.selectedSiteId ?? null,
      unit_id: after?.unit_id ?? before?.unit_id ?? null,
      area_id: after?.area_id ?? before?.area_id ?? null,
      equipment_id: after?.equipment_id ?? before?.equipment_id ?? null,
      regulatory_item_id: after?.regulatory_item_id ?? before?.regulatory_item_id ?? null,
      obligation_id: obligationId ?? after?.id ?? before?.id ?? null,
      jurisdiction_id: after?.jurisdiction_id ?? before?.jurisdiction_id ?? null,
      event_type: title,
      event_title: title,
      event_description: reason,
      before_value_json: before,
      after_value_json: after,
      actor_user_id: userId,
      source_module: 'Regulatory Register',
      source_record_id: obligationId ?? after?.id ?? before?.id ?? null,
      audit_log_id: (audit as { id?: string } | null)?.id ?? null
    }).select().single()).catch(() => null);
    if (after?.regulatory_item_id || before?.regulatory_item_id) await this.writeMutation(scope, userId, title, after?.regulatory_item_id ?? before?.regulatory_item_id, before, after, reason).catch(() => null);
  }

  filteredView(scope: Scope, view: string, query: Row = {}) {
    const map: Row = {
      active: { registerStatus: 'Active' },
      draft: { registerStatus: 'Draft' },
      'under-review': { registerStatus: 'Under Review' },
      'not-applicable': { applicabilityStatus: 'Not Applicable' },
      superseded: { registerStatus: 'Superseded' },
      archived: { registerStatus: 'Archived' },
      'overdue-review': { reviewStatus: 'Review Overdue' },
      'effective-soon': { effectiveSoon: 'true' },
      'missing-owner': { missingOwner: 'true' },
      'missing-applicability': { missingApplicability: 'true' },
      'missing-evidence': { missingEvidence: 'true' },
      'non-compliant': { complianceStatus: 'Non-Compliant Foundation' },
      'high-risk': { criticality: 'High' },
      'psm-critical': { criticality: 'PSM-Critical' },
      'environmental-critical': { criticality: 'Environmental-Critical' },
      'safety-critical': { criticality: 'Safety-Critical' }
    };
    return this.register(scope, { ...query, ...(map[view] ?? {}) });
  }

  scoped(scope: Scope, field: 'siteId' | 'unitId' | 'areaId' | 'equipmentId', id: string, query: Row = {}) {
    return this.register(scope, { ...query, [field]: id });
  }

  private async loadItems(scope: Scope, query: Row) {
    let q = this.db.from('regulatory_register_items').select('*').eq('company_id', scope.companyId);
    if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (query.siteId) q = q.eq('site_id', query.siteId);
    if (query.unitId) q = q.eq('unit_id', query.unitId);
    if (query.areaId) q = q.eq('area_id', query.areaId);
    if (query.equipmentId) q = q.eq('equipment_id', query.equipmentId);
    if (query.registerStatus) q = q.eq('register_status', query.registerStatus);
    if (query.applicabilityStatus) q = q.eq('applicability_status', query.applicabilityStatus);
    if (query.complianceStatus) q = q.eq('compliance_status', query.complianceStatus);
    if (query.criticality) q = q.eq('criticality', query.criticality);
    if (query.category) q = q.eq('category', query.category);
    if (query.sourceType) q = q.eq('source_type', query.sourceType);
    if (query.ownerUserId) q = q.eq('owner_user_id', query.ownerUserId);
    if (query.search) q = q.or(`requirement_title.ilike.%${query.search}%,requirement_code.ilike.%${query.search}%,source_reference_number.ilike.%${query.search}%`);
    const rows = await this.db.many<Row>(q.order('updated_at', { ascending: false }));
    const enriched = await this.enrichItems(rows);
    return enriched.filter((row) => this.matchesDerivedFilters(row, query));
  }

  private async enrichItems(rows: Row[]) {
    const userIds = [...new Set(rows.flatMap((row) => [row.owner_user_id, row.compliance_owner_user_id, row.site_owner_user_id, row.reviewer_user_id, row.checked_by_user_id]).filter(Boolean))];
    const users = userIds.length ? await this.db.many<Row>(this.db.from('User').select('id,email,displayName,title,department,status,tenantId').in('id', userIds)).catch(() => []) : [];
    const byId = new Map(users.map((user) => [user.id, user]));
    return rows.map((row) => this.enrichItem(row, byId));
  }

  private enrichItem(row: Row, users = new Map<string, Row>()): Row {
    const reviewStatus = this.reviewStatus(row);
    const registerStatus = this.registerStatus(row);
    return {
      ...row,
      register_status: registerStatus,
      review_status: reviewStatus,
      owner: row.owner_user_id ? users.get(row.owner_user_id) ?? null : null,
      complianceOwner: row.compliance_owner_user_id ? users.get(row.compliance_owner_user_id) ?? null : null,
      siteOwner: row.site_owner_user_id ? users.get(row.site_owner_user_id) ?? null : null,
      reviewer: row.reviewer_user_id ? users.get(row.reviewer_user_id) ?? null : null,
      linked_audit_count: Number(row.linked_audit_count ?? 0),
      linked_evidence_count: Number(row.linked_evidence_count ?? 0),
      linked_action_count: Number(row.linked_action_count ?? 0),
      readOnly: this.isReadOnly(row),
      readOnlyReason: this.readOnlyReason(row)
    };
  }

  private async itemJurisdictions(scope: Scope, id: string) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_item_jurisdictions').select('*,jurisdiction:regulatory_jurisdictions(*)').eq('company_id', scope.companyId).eq('regulatory_item_id', id).is('removed_at', null));
    return { rows };
  }

  private async itemScopes(scope: Scope, id: string) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_item_scopes').select('*').eq('company_id', scope.companyId).eq('regulatory_item_id', id).is('removed_at', null));
    return { rows };
  }

  private async reviewFoundation(scope: Scope, id: string) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_item_review_foundation').select('*').eq('company_id', scope.companyId).eq('regulatory_item_id', id).order('updated_at', { ascending: false }).limit(10)).catch(() => []);
    return { rows, placeholder: this.foundationMessage('review') };
  }

  private summaryFromRows(rows: Row[]) {
    const today = this.startOfToday();
    return {
      totalRegisterItems: rows.length,
      total: rows.length,
      activeRequirements: rows.filter((row) => row.register_status === 'Active').length,
      draftRequirements: rows.filter((row) => row.register_status === 'Draft').length,
      underReview: rows.filter((row) => row.register_status === 'Under Review').length,
      notApplicable: rows.filter((row) => row.applicability_status === 'Not Applicable').length,
      superseded: rows.filter((row) => row.register_status === 'Superseded').length,
      archived: rows.filter((row) => row.register_status === 'Archived').length,
      highRisk: rows.filter((row) => ['High', 'Critical', 'Regulatory-Critical'].includes(row.criticality)).length,
      safetyCritical: rows.filter((row) => row.criticality === 'Safety-Critical').length,
      environmentalCritical: rows.filter((row) => row.criticality === 'Environmental-Critical').length,
      psmCritical: rows.filter((row) => row.criticality === 'PSM-Critical').length,
      missingOwner: rows.filter((row) => !row.owner_user_id).length,
      missingApplicability: rows.filter((row) => row.applicability_status === 'Not Assessed' || !row.applicability_rationale).length,
      missingEvidence: rows.filter((row) => Number(row.linked_evidence_count ?? 0) === 0).length,
      nonCompliantFoundation: rows.filter((row) => row.compliance_status === 'Non-Compliant Foundation').length,
      partiallyCompliantFoundation: rows.filter((row) => row.compliance_status === 'Partially Compliant Foundation').length,
      compliantFoundation: rows.filter((row) => row.compliance_status === 'Compliant Foundation').length,
      reviewOverdue: rows.filter((row) => row.next_review_date && new Date(row.next_review_date) < today).length,
      reviewDueSoon: this.reviewDueSoon(rows).length,
      effectiveSoon: this.effectiveSoon(rows).length,
      recentlyAdded: rows.filter((row) => this.withinDays(row.created_at, 30)).length,
      recentlyUpdated: rows.filter((row) => this.withinDays(row.updated_at, 30)).length,
      linkedToAudit: rows.filter((row) => Number(row.linked_audit_count ?? 0) > 0).length,
      linkedToEvidence: rows.filter((row) => Number(row.linked_evidence_count ?? 0) > 0).length,
      linkedToActionsCapa: rows.filter((row) => Number(row.linked_action_count ?? 0) > 0).length,
      pendingReviewApprovalFoundation: rows.filter((row) => row.review_status === 'Under Review' || row.register_status === 'Under Review').length
    };
  }

  private overviewCards(item: Row) {
    return {
      title: item.requirement_title,
      code: item.requirement_code,
      sourceType: item.source_type,
      jurisdiction: item.jurisdiction_level,
      authority: item.authority_name,
      category: item.category,
      criticality: item.criticality,
      applicabilityStatus: item.applicability_status,
      complianceStatus: item.compliance_status,
      registerStatus: item.register_status,
      owner: item.owner?.displayName ?? item.owner_user_id,
      effectiveDate: item.effective_date,
      reviewDueDate: item.next_review_date,
      linkedAuditCount: item.linked_audit_count,
      linkedEvidenceCount: item.linked_evidence_count,
      linkedActionCount: item.linked_action_count,
      lastUpdated: item.updated_at,
      locked: item.locked,
      archived: item.register_status === 'Archived'
    };
  }

  private reviewDueSoon(rows: Row[]) {
    const today = this.startOfToday();
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 30);
    return rows.filter((row) => row.next_review_date && new Date(row.next_review_date) >= today && new Date(row.next_review_date) <= soon);
  }

  private effectiveSoon(rows: Row[]) {
    const today = this.startOfToday();
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 60);
    return rows.filter((row) => row.effective_date && new Date(row.effective_date) >= today && new Date(row.effective_date) <= soon);
  }

  private readinessSummary(rows: Row[]) {
    const blockers = [
      { key: 'missing_owner', label: 'Missing owners', count: rows.filter((row) => !row.owner_user_id).length },
      { key: 'missing_applicability', label: 'Missing applicability rationale', count: rows.filter((row) => row.applicability_status !== 'Not Assessed' && !row.applicability_rationale).length },
      { key: 'missing_evidence', label: 'Missing evidence links', count: rows.filter((row) => Number(row.linked_evidence_count ?? 0) === 0).length },
      { key: 'review_overdue', label: 'Review overdue', count: this.summaryFromRowsNoReadiness(rows).reviewOverdue }
    ];
    return { status: blockers.some((blocker) => blocker.count > 0) ? 'Attention Required' : 'Ready Foundation', blockers };
  }

  private summaryFromRowsNoReadiness(rows: Row[]) {
    const today = this.startOfToday();
    return { reviewOverdue: rows.filter((row) => row.next_review_date && new Date(row.next_review_date) < today).length };
  }

  private groupRows(rows: Row[], field: string) {
    const counts = new Map<string, number>();
    rows.forEach((row) => counts.set(String(row[field] ?? 'Not Set'), (counts.get(String(row[field] ?? 'Not Set')) ?? 0) + 1));
    return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }

  private sortRows(rows: Row[], sort: string) {
    const [rawField, direction] = sort.split('.');
    const field = rawField || 'updated_at';
    const dir = direction === 'asc' ? 1 : -1;
    return rows.slice().sort((a, b) => String(a[field] ?? '').localeCompare(String(b[field] ?? '')) * dir);
  }

  private matchesDerivedFilters(row: Row, query: Row) {
    if (query.missingOwner === 'true' && row.owner_user_id) return false;
    if (query.missingApplicability === 'true' && row.applicability_status !== 'Not Assessed' && row.applicability_rationale) return false;
    if (query.missingEvidence === 'true' && Number(row.linked_evidence_count ?? 0) > 0) return false;
    if (query.effectiveSoon === 'true' && !this.effectiveSoon([row]).length) return false;
    if (query.reviewStatus && row.review_status !== query.reviewStatus) return false;
    return true;
  }

  private matchesApplicabilityDerivedFilters(row: Row, query: Row) {
    if (query.missingRationale === 'true' && (!this.decisionNeedsRationale(row.applicability_status) || row.rationale)) return false;
    return true;
  }

  private jurisdictionSummaryFromRows(jurisdictions: Row[], authorities: Row[], items: Row[]) {
    return {
      total: jurisdictions.length,
      active: jurisdictions.filter((row) => row.jurisdiction_status === 'Active').length,
      draft: jurisdictions.filter((row) => row.jurisdiction_status === 'Draft').length,
      archived: jurisdictions.filter((row) => row.jurisdiction_status === 'Archived' || row.archived_at).length,
      countriesCovered: new Set(jurisdictions.map((row) => row.country).filter(Boolean)).size,
      stateProvince: jurisdictions.filter((row) => row.jurisdiction_level === 'State / Province').length,
      cityMunicipality: jurisdictions.filter((row) => row.jurisdiction_level === 'City / Municipality').length,
      industrialZone: jurisdictions.filter((row) => row.jurisdiction_level === 'Free Zone / Industrial Zone').length,
      corporate: jurisdictions.filter((row) => row.jurisdiction_level === 'Corporate').length,
      siteSpecific: jurisdictions.filter((row) => row.jurisdiction_level === 'Site-Specific' || row.site_id).length,
      authorities: authorities.length,
      jurisdictionsWithRegisterItems: new Set(items.map((row) => row.jurisdiction_level).filter(Boolean)).size,
      jurisdictionsWithoutRegisterItems: jurisdictions.filter((row) => !items.some((item) => item.jurisdiction_level === row.jurisdiction_level || item.country === row.country)).length,
      missingAuthority: jurisdictions.filter((row) => !row.authority_name).length,
      missingOwner: jurisdictions.filter((row) => !row.owner_user_id).length,
      recentlyAdded: jurisdictions.filter((row) => this.withinDays(row.created_at, 30)).length,
      recentlyUpdated: jurisdictions.filter((row) => this.withinDays(row.updated_at, 30)).length
    };
  }

  private applicabilitySummaryFromRows(rows: Row[], gaps: Row[]) {
    const dueSoon = this.startOfToday();
    const soon = new Date(dueSoon);
    soon.setDate(soon.getDate() + 30);
    return {
      totalApplicabilityAssessments: rows.length,
      notAssessed: rows.filter((row) => row.applicability_status === 'Not Assessed').length,
      applicable: rows.filter((row) => row.applicability_status === 'Applicable').length,
      partiallyApplicable: rows.filter((row) => row.applicability_status === 'Partially Applicable').length,
      notApplicable: rows.filter((row) => row.applicability_status === 'Not Applicable').length,
      underReview: rows.filter((row) => row.applicability_status === 'Applicability Under Review' || row.assessment_status === 'Under Review').length,
      reviewRequired: rows.filter((row) => row.review_required).length,
      staleApplicability: rows.filter((row) => row.stale || row.applicability_status === 'Stale Applicability').length,
      missingRationale: rows.filter((row) => this.decisionNeedsRationale(row.applicability_status) && !row.rationale).length,
      missingScope: rows.filter((row) => !row.scope_summary_json).length,
      highRiskNotAssessed: rows.filter((row) => row.applicability_status === 'Not Assessed' && ['High', 'Critical'].includes(row.item?.criticality)).length,
      psmCriticalNotAssessed: rows.filter((row) => row.applicability_status === 'Not Assessed' && row.item?.criticality === 'PSM-Critical').length,
      environmentalCriticalNotAssessed: rows.filter((row) => row.applicability_status === 'Not Assessed' && row.item?.criticality === 'Environmental-Critical').length,
      safetyCriticalNotAssessed: rows.filter((row) => row.applicability_status === 'Not Assessed' && row.item?.criticality === 'Safety-Critical').length,
      reviewOverdue: rows.filter((row) => row.next_review_date && new Date(row.next_review_date) < dueSoon).length,
      reviewDueSoon: rows.filter((row) => row.next_review_date && new Date(row.next_review_date) >= dueSoon && new Date(row.next_review_date) <= soon).length,
      assessmentsWithGaps: new Set(gaps.map((gap) => gap.assessment_id).filter(Boolean)).size,
      linkedToAudit: rows.filter((row) => Number(row.item?.linked_audit_count ?? 0) > 0).length,
      linkedToEvidence: rows.filter((row) => Number(row.item?.linked_evidence_count ?? 0) > 0).length,
      recentlyCompletedAssessments: rows.filter((row) => row.assessment_status === 'Completed Foundation' && this.withinDays(row.last_assessed_at, 30)).length
    };
  }

  private decisionNeedsRationale(decision: string | null | undefined, settings: Row = {}) {
    if (!decision || decision === 'Not Assessed') return false;
    if (decision === 'Applicable') return settings.require_rationale_for_applicable !== false;
    if (decision === 'Partially Applicable') return settings.require_rationale_for_partially_applicable !== false;
    if (decision === 'Not Applicable') return settings.require_rationale_for_not_applicable !== false;
    return true;
  }

  private criticalDecisionNeedsReview(item: Row | null | undefined, decision: string, settings: Row) {
    const isCritical = criticalRiskBasisStatuses.has(item?.criticality);
    if (!isCritical) return false;
    if (decision === 'Not Applicable') return settings.require_review_for_not_applicable_critical_item !== false;
    return settings.require_review_for_critical_applicability !== false;
  }

  private itemScopeSnapshot(item: Row) {
    return {
      company_id: item.company_id,
      site_id: item.site_id,
      department_id: item.department_id,
      unit_id: item.unit_id,
      area_id: item.area_id,
      equipment_id: item.equipment_id,
      process_system: item.process_system,
      chemical_substance: item.chemical_substance,
      activity_operation: item.activity_operation
    };
  }

  private assessmentReadiness(assessment: Row, gaps: Row[]) {
    const blockers = [
      ...gaps.filter((gap) => gap.gap_status !== 'Resolved').map((gap) => ({ key: gap.gap_type, label: gap.gap_title, blocking: gap.blocking })),
      ...(assessment.stale ? [{ key: 'stale', label: assessment.stale_reason ?? 'Applicability is stale', blocking: true }] : []),
      ...(this.decisionNeedsRationale(assessment.applicability_status) && !assessment.rationale ? [{ key: 'missing_rationale', label: 'Decision rationale is missing', blocking: true }] : [])
    ];
    return { status: blockers.some((blocker) => blocker.blocking) ? 'Blocked' : blockers.length ? 'Attention Required' : 'Ready Foundation', blockers };
  }

  private async generateAssessmentNumber(scope: Scope) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_applicability_assessments').select('id').eq('company_id', scope.companyId));
    return `REG-APP-${new Date().getFullYear()}-${String(rows.length + 1).padStart(6, '0')}`;
  }

  private async normalizeInput(scope: Scope, dto: Row, mode: 'create' | 'update') {
    const normalized: Row = {
      requirement_title: dto.requirementTitle ?? dto.requirement_title,
      requirement_code: dto.requirementCode ?? dto.requirement_code,
      source_type: dto.sourceType ?? dto.source_type,
      source_reference_number: dto.sourceReferenceNumber ?? dto.source_reference_number,
      short_summary: dto.shortSummary ?? dto.short_summary,
      full_reference_url: dto.fullReferenceUrl ?? dto.full_reference_url,
      version: dto.version,
      effective_date: dto.effectiveDate ?? dto.effective_date,
      expiry_date: dto.expiryDate ?? dto.expiry_date,
      supersedes_item_id: dto.supersedesItemId ?? dto.supersedes_item_id,
      superseded_by_item_id: dto.supersededByItemId ?? dto.superseded_by_item_id,
      register_status: dto.registerStatus ?? dto.register_status ?? (mode === 'create' ? 'Draft' : undefined),
      applicability_status: dto.applicabilityStatus ?? dto.applicability_status ?? (mode === 'create' ? 'Not Assessed' : undefined),
      compliance_status: dto.complianceStatus ?? dto.compliance_status ?? (mode === 'create' ? 'Not Assessed' : undefined),
      criticality: dto.criticality,
      category: dto.category,
      topic: dto.topic,
      related_psm_element: dto.relatedPsmElement ?? dto.related_psm_element,
      related_module: dto.relatedModule ?? dto.related_module,
      risk_basis: dto.riskBasis ?? dto.risk_basis,
      regulatory_impact: dto.regulatoryImpact ?? dto.regulatory_impact,
      safety_impact: dto.safetyImpact ?? dto.safety_impact,
      environmental_impact: dto.environmentalImpact ?? dto.environmental_impact,
      business_impact: dto.businessImpact ?? dto.business_impact,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id,
      compliance_owner_user_id: dto.complianceOwnerUserId ?? dto.compliance_owner_user_id,
      site_owner_user_id: dto.siteOwnerUserId ?? dto.site_owner_user_id,
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id,
      review_frequency: dto.reviewFrequency ?? dto.review_frequency,
      next_review_date: dto.nextReviewDate ?? dto.next_review_date,
      last_review_date: dto.lastReviewDate ?? dto.last_review_date,
      last_compliance_check_date: dto.lastComplianceCheckDate ?? dto.last_compliance_check_date,
      checked_by_user_id: dto.checkedByUserId ?? dto.checked_by_user_id,
      status_rationale: dto.statusRationale ?? dto.status_rationale,
      applicability_rationale: dto.applicabilityRationale ?? dto.applicability_rationale,
      notes: dto.notes,
      department_id: dto.departmentId ?? dto.department_id,
      unit_id: dto.unitId ?? dto.unit_id,
      area_id: dto.areaId ?? dto.area_id,
      equipment_id: dto.equipmentId ?? dto.equipment_id,
      process_system: dto.processSystem ?? dto.process_system,
      chemical_substance: dto.chemicalSubstance ?? dto.chemical_substance,
      activity_operation: dto.activityOperation ?? dto.activity_operation,
      jurisdiction_level: dto.jurisdictionLevel ?? dto.jurisdiction_level,
      country: dto.country,
      state_province: dto.stateProvince ?? dto.state_province,
      city_municipality: dto.cityMunicipality ?? dto.city_municipality,
      industrial_zone: dto.industrialZone ?? dto.industrial_zone,
      authority_name: dto.authorityName ?? dto.authority_name,
      authority_contact_foundation: dto.authorityContactFoundation ?? dto.authority_contact_foundation,
      language: dto.language,
      legal_owner_regulator_contact_foundation: dto.legalOwnerRegulatorContactFoundation ?? dto.legal_owner_regulator_contact_foundation,
      evidence_summary_foundation: dto.evidenceSummaryFoundation ?? dto.evidence_summary_foundation,
      gap_summary_foundation: dto.gapSummaryFoundation ?? dto.gap_summary_foundation,
      action_required: dto.actionRequired ?? dto.action_required,
      reminder_settings_foundation: dto.reminderSettingsFoundation ?? dto.reminder_settings_foundation,
      escalation_owner_user_id: dto.escalationOwnerUserId ?? dto.escalation_owner_user_id,
      site_id: dto.siteId ?? dto.site_id ?? undefined
    };
    Object.keys(normalized).forEach((key) => normalized[key] === undefined && delete normalized[key]);
    if (normalized.site_id && !this.canAccessSite(scope, normalized.site_id)) throw new ForbiddenException('Selected site is outside your allowed company/site scope.');
    for (const key of ['owner_user_id', 'compliance_owner_user_id', 'site_owner_user_id', 'reviewer_user_id', 'checked_by_user_id', 'escalation_owner_user_id']) {
      if (normalized[key]) await this.assertUserInScope(scope, normalized[key]);
    }
    if (normalized.full_reference_url) this.validateUrl(normalized.full_reference_url);
    return normalized;
  }

  private validateForStatus(row: Row, settings: Row) {
    const status = row.register_status ?? 'Draft';
    if (status !== 'Draft') {
      if (!String(row.requirement_title ?? '').trim()) throw new BadRequestException('Requirement title is required.');
      if (!String(row.source_type ?? '').trim()) throw new BadRequestException('Source type is required.');
      if (!String(row.jurisdiction_level ?? '').trim()) throw new BadRequestException('Jurisdiction level is required.');
      if (!String(row.category ?? '').trim()) throw new BadRequestException('Category is required.');
      if (!String(row.criticality ?? '').trim()) throw new BadRequestException('Criticality is required.');
    }
    if (status === 'Active') {
      if (settings.require_owner_for_active_item !== false && !row.owner_user_id) throw new BadRequestException('Active requirement requires an owner.');
      if (settings.require_review_date_for_active_item !== false && row.review_frequency !== 'On Change' && !row.next_review_date) throw new BadRequestException('Active requirement requires a next review date.');
    }
    if (settings.require_risk_basis_for_critical_item !== false && criticalRiskBasisStatuses.has(row.criticality) && !String(row.risk_basis ?? '').trim()) throw new BadRequestException('Critical requirements require a risk basis.');
    if (settings.require_rationale_for_not_applicable !== false && row.applicability_status === 'Not Applicable' && !String(row.applicability_rationale ?? '').trim()) throw new BadRequestException('Not Applicable requires an applicability rationale.');
    if (['Compliant Foundation', 'Partially Compliant Foundation', 'Non-Compliant Foundation'].includes(row.compliance_status) && !String(row.status_rationale ?? '').trim()) throw new BadRequestException('Compliance status foundation requires a rationale.');
  }

  private reviewStatus(row: Row) {
    if (row.register_status === 'Under Review') return 'Under Review';
    if (!row.next_review_date) return row.review_status ?? 'Not Required';
    const due = new Date(row.next_review_date);
    const today = this.startOfToday();
    if (due < today) return 'Review Overdue';
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 30);
    if (due <= soon) return 'Review Due';
    return row.review_status ?? 'Not Required';
  }

  private registerStatus(row: Row) {
    if (row.register_status !== 'Active') return row.register_status ?? 'Draft';
    if (!row.effective_date) return 'Active';
    const effective = new Date(row.effective_date);
    const today = this.startOfToday();
    if (effective <= today) return 'Effective';
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 60);
    if (effective <= soon) return 'Effective Soon';
    return 'Active';
  }

  private async statusPatch(userId: string, scope: Scope, id: string, patch: Row, reason: unknown, title: string) {
    if (!Object.values(patch).some((value) => value !== undefined && value !== null && value !== '')) throw new BadRequestException(`${title} requires a target status.`);
    const before = await this.getItem(scope, id);
    const row = await this.db.single<Row>(this.db.from('regulatory_register_items').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', id).select().single());
    await this.writeStatusHistory(scope, userId, id, title, before, row, String(reason ?? title));
    await this.writeMutation(scope, userId, title, id, before, row, String(reason ?? title));
    return this.overview(scope, id);
  }

  private async lockState(userId: string, scope: Scope, id: string, locked: boolean, reason: string) {
    const before = await this.getItem(scope, id);
    const row = await this.db.single<Row>(this.db.from('regulatory_register_items').update({
      locked,
      locked_by: locked ? userId : null,
      locked_at: locked ? new Date().toISOString() : null,
      lock_reason: locked ? reason : null,
      updated_by: userId,
      updated_at: new Date().toISOString()
    }).eq('company_id', scope.companyId).eq('id', id).select().single());
    await this.writeMutation(scope, userId, locked ? 'Requirement locked' : 'Requirement unlocked', id, before, row, reason);
    return this.overview(scope, id);
  }

  private async generateCode(scope: Scope) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_register_items').select('id').eq('company_id', scope.companyId));
    return `REG-${new Date().getFullYear()}-${String(rows.length + 1).padStart(6, '0')}`;
  }

  private applyEvidenceScopeFilters(q: any, query: Row) {
    const map: Record<string, string> = {
      siteId: 'site_id', site_id: 'site_id',
      unitId: 'unit_id', unit_id: 'unit_id',
      areaId: 'area_id', area_id: 'area_id',
      equipmentId: 'equipment_id', equipment_id: 'equipment_id',
      regulatoryItemId: 'regulatory_item_id', regulatory_item_id: 'regulatory_item_id',
      obligationId: 'obligation_id', obligation_id: 'obligation_id',
      evidenceRequirementId: 'evidence_requirement_id', evidence_requirement_id: 'evidence_requirement_id',
      requirementId: 'evidence_requirement_id', requirement_id: 'evidence_requirement_id',
      complianceAssessmentId: 'compliance_assessment_id', compliance_assessment_id: 'compliance_assessment_id',
      complianceGapId: 'compliance_gap_id', compliance_gap_id: 'compliance_gap_id',
      applicabilityAssessmentId: 'applicability_assessment_id', applicability_assessment_id: 'applicability_assessment_id',
      sourceModule: 'source_module', source_module: 'source_module',
      sourceRecordId: 'source_record_id', source_record_id: 'source_record_id'
    };
    for (const [inputKey, column] of Object.entries(map)) {
      if (query[inputKey] !== undefined && query[inputKey] !== null && query[inputKey] !== '') q = q.eq(column, query[inputKey]);
    }
    return q;
  }

  private evidenceSort(sort: string): [string, { ascending: boolean }] {
    const [columnPart, directionPart] = sort.split('.');
    const rawColumn = columnPart ?? 'updated_at';
    const rawDirection = directionPart ?? 'desc';
    const allowed = new Set(['created_at', 'updated_at', 'evidence_status', 'review_status', 'readiness_status', 'expiry_date', 'due_date', 'evidence_title']);
    const column = allowed.has(rawColumn) ? rawColumn : 'updated_at';
    return [column, { ascending: rawDirection === 'asc' }];
  }

  private redactEvidenceLink(row: Row, permissions: string[]) {
    const allowed = !row.restricted || permissions.includes('regulatory.evidence.restricted.view') || permissions.includes('regulatory.manage') || permissions.includes('regulatory:manage');
    if (allowed) return row;
    return {
      id: row.id,
      company_id: row.company_id,
      site_id: row.site_id,
      evidence_code: row.evidence_code,
      evidence_title: 'Restricted evidence',
      evidence_type: row.evidence_type,
      evidence_status: row.evidence_status,
      review_status: row.review_status,
      readiness_status: row.readiness_status,
      stale_status: row.stale_status,
      restricted: true,
      redacted: true,
      restricted_reason: 'Restricted evidence permission is required.',
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private matchesEvidenceView(row: Row, view?: string) {
    if (!view || view === 'all') return true;
    const expired = row.expiry_date ? new Date(row.expiry_date) < new Date() : false;
    const stale = row.stale_status && row.stale_status !== 'Current';
    const missing = row.readiness_status === 'Evidence Missing' || row.evidence_status === 'Missing Source';
    const views: Record<string, boolean> = {
      'pending-review': row.review_status === 'Pending Review',
      verified: row.review_status === 'Verified' || row.evidence_status === 'Verified',
      rejected: row.review_status === 'Rejected' || row.evidence_status === 'Rejected',
      'rework-required': row.review_status === 'Rework Required',
      missing,
      restricted: Boolean(row.restricted),
      stale: Boolean(stale),
      expired
    };
    return views[view] ?? true;
  }

  private evidenceSummaryFromRows(requirements: Row[], links: Row[], gaps: Row[], requests: Row[], packages: Row[], access: Row[]) {
    const openGaps = gaps.filter((row) => !['Resolved', 'Archived'].includes(row.gap_status));
    const missing = links.filter((row) => row.readiness_status === 'Evidence Missing' || row.evidence_status === 'Missing Source');
    const stale = links.filter((row) => row.stale_status && row.stale_status !== 'Current');
    return {
      requirementsTotal: requirements.length,
      requirementsActive: requirements.filter((row) => row.requirement_status === 'Active').length,
      evidenceTotal: links.length,
      evidenceVerified: links.filter((row) => row.review_status === 'Verified' || row.evidence_status === 'Verified').length,
      evidencePendingReview: links.filter((row) => row.review_status === 'Pending Review').length,
      evidenceRejected: links.filter((row) => row.review_status === 'Rejected' || row.evidence_status === 'Rejected').length,
      evidenceMissing: missing.length,
      evidenceRestricted: links.filter((row) => row.restricted).length,
      staleEvidence: stale.length,
      openRequests: requests.filter((row) => !['Fulfilled', 'Cancelled', 'Archived'].includes(row.request_status)).length,
      openGaps: openGaps.length,
      packagesPrepared: packages.filter((row) => row.package_status === 'Prepared').length,
      recentAccessEvents: access.length,
      readinessPercent: requirements.length ? Math.round(((requirements.length - missing.length - openGaps.length) / requirements.length) * 100) : 0,
      byEvidenceStatus: this.groupRows(links, 'evidence_status'),
      byReviewStatus: this.groupRows(links, 'review_status'),
      byReadiness: this.groupRows(links, 'readiness_status')
    };
  }

  private evidenceLinkSummary(rows: Row[]) {
    return {
      total: rows.length,
      verified: rows.filter((row) => row.review_status === 'Verified' || row.evidence_status === 'Verified').length,
      pendingReview: rows.filter((row) => row.review_status === 'Pending Review').length,
      rejected: rows.filter((row) => row.review_status === 'Rejected' || row.evidence_status === 'Rejected').length,
      reworkRequired: rows.filter((row) => row.review_status === 'Rework Required').length,
      missing: rows.filter((row) => row.readiness_status === 'Evidence Missing' || row.evidence_status === 'Missing Source').length,
      restricted: rows.filter((row) => row.restricted).length,
      stale: rows.filter((row) => row.stale_status && row.stale_status !== 'Current').length
    };
  }

  private async resolveEvidenceSource(scope: Scope, dto: Row): Promise<Row> {
    const requirementId = dto.evidenceRequirementId ?? dto.evidence_requirement_id ?? dto.requirementId ?? dto.requirement_id;
    if (requirementId) {
      const requirement = await this.db.single<Row>(this.db.from('regulatory_evidence_requirements').select('*').eq('company_id', scope.companyId).eq('id', requirementId).maybeSingle());
      if (!requirement || !this.canAccessSite(scope, requirement.site_id)) throw new BadRequestException('Selected evidence requirement was not found or is outside your company/site scope.');
      return requirement;
    }
    const itemId = dto.regulatoryItemId ?? dto.regulatory_item_id;
    if (itemId) {
      const item = await this.db.single<Row>(this.db.from('regulatory_register_items').select('*').eq('company_id', scope.companyId).eq('id', itemId).maybeSingle());
      if (!item || !this.canAccessSite(scope, item.site_id)) throw new BadRequestException('Selected regulatory item was not found or is outside your company/site scope.');
      return { ...item, regulatory_item_id: item.id, source_type: 'Regulatory Item' };
    }
    const obligationId = dto.obligationId ?? dto.obligation_id;
    if (obligationId) {
      const obligation = await this.db.single<Row>(this.db.from('regulatory_obligations').select('*').eq('company_id', scope.companyId).eq('id', obligationId).maybeSingle());
      if (!obligation || !this.canAccessSite(scope, obligation.site_id)) throw new BadRequestException('Selected obligation was not found or is outside your company/site scope.');
      return { ...obligation, obligation_id: obligation.id, source_type: 'Obligation' };
    }
    return {};
  }

  private async normalizeEvidenceRequirementInput(scope: Scope, dto: Row, source: Row) {
    const patch = this.pickMapped(dto, {
      requirementCode: 'requirement_code', requirement_code: 'requirement_code',
      requirementTitle: 'requirement_title', requirement_title: 'requirement_title',
      sourceType: 'source_type', source_type: 'source_type',
      regulatoryItemId: 'regulatory_item_id', regulatory_item_id: 'regulatory_item_id',
      obligationId: 'obligation_id', obligation_id: 'obligation_id',
      complianceAssessmentId: 'compliance_assessment_id', compliance_assessment_id: 'compliance_assessment_id',
      complianceGapId: 'compliance_gap_id', compliance_gap_id: 'compliance_gap_id',
      applicabilityAssessmentId: 'applicability_assessment_id', applicability_assessment_id: 'applicability_assessment_id',
      siteId: 'site_id', site_id: 'site_id',
      departmentId: 'department_id', department_id: 'department_id',
      unitId: 'unit_id', unit_id: 'unit_id',
      areaId: 'area_id', area_id: 'area_id',
      equipmentId: 'equipment_id', equipment_id: 'equipment_id',
      evidenceTypeExpected: 'evidence_type_expected', evidence_type_expected: 'evidence_type_expected',
      evidenceDescription: 'evidence_description', evidence_description: 'evidence_description',
      evidenceFrequency: 'evidence_frequency', evidence_frequency: 'evidence_frequency',
      evidenceOwnerUserId: 'evidence_owner_user_id', evidence_owner_user_id: 'evidence_owner_user_id',
      reviewerUserId: 'reviewer_user_id', reviewer_user_id: 'reviewer_user_id',
      dueDate: 'due_date', due_date: 'due_date',
      recurrenceRuleJson: 'recurrence_rule_json', recurrence_rule_json: 'recurrence_rule_json',
      requiredDocumentType: 'required_document_type', required_document_type: 'required_document_type',
      requiredRecordType: 'required_record_type', required_record_type: 'required_record_type',
      evidenceSourceModule: 'evidence_source_module', evidence_source_module: 'evidence_source_module',
      acceptanceCriteriaFoundation: 'acceptance_criteria_foundation', acceptance_criteria_foundation: 'acceptance_criteria_foundation',
      retentionRequirementFoundation: 'retention_requirement_foundation', retention_requirement_foundation: 'retention_requirement_foundation',
      confidentialityLevel: 'confidentiality_level', confidentiality_level: 'confidentiality_level',
      restrictedByDefault: 'restricted_by_default', restricted_by_default: 'restricted_by_default',
      requirementStatus: 'requirement_status', requirement_status: 'requirement_status',
      criticality: 'criticality',
      notes: 'notes'
    });
    patch.source_type ??= source.source_type ?? 'Manual Requirement';
    patch.site_id ??= source.site_id ?? scope.selectedSiteId ?? null;
    patch.unit_id ??= source.unit_id ?? null;
    patch.area_id ??= source.area_id ?? null;
    patch.equipment_id ??= source.equipment_id ?? null;
    patch.regulatory_item_id ??= source.regulatory_item_id ?? source.id ?? null;
    patch.obligation_id ??= source.obligation_id ?? null;
    if (patch.evidence_owner_user_id) await this.assertUserInScope(scope, patch.evidence_owner_user_id);
    if (patch.reviewer_user_id) await this.assertUserInScope(scope, patch.reviewer_user_id);
    if (!this.canAccessSite(scope, patch.site_id)) throw new BadRequestException('Evidence requirement site is outside your accessible site scope.');
    return patch;
  }

  private async normalizeEvidenceLinkInput(scope: Scope, dto: Row, source: Row) {
    const patch = this.pickMapped(dto, {
      evidenceCode: 'evidence_code', evidence_code: 'evidence_code',
      evidenceTitle: 'evidence_title', evidence_title: 'evidence_title',
      evidenceType: 'evidence_type', evidence_type: 'evidence_type',
      evidenceStatus: 'evidence_status', evidence_status: 'evidence_status',
      reviewStatus: 'review_status', review_status: 'review_status',
      readinessStatus: 'readiness_status', readiness_status: 'readiness_status',
      staleStatus: 'stale_status', stale_status: 'stale_status',
      staleReason: 'stale_reason', stale_reason: 'stale_reason',
      sourceType: 'source_type', source_type: 'source_type',
      regulatoryItemId: 'regulatory_item_id', regulatory_item_id: 'regulatory_item_id',
      obligationId: 'obligation_id', obligation_id: 'obligation_id',
      evidenceRequirementId: 'evidence_requirement_id', evidence_requirement_id: 'evidence_requirement_id',
      requirementId: 'evidence_requirement_id', requirement_id: 'evidence_requirement_id',
      complianceAssessmentId: 'compliance_assessment_id', compliance_assessment_id: 'compliance_assessment_id',
      complianceGapId: 'compliance_gap_id', compliance_gap_id: 'compliance_gap_id',
      applicabilityAssessmentId: 'applicability_assessment_id', applicability_assessment_id: 'applicability_assessment_id',
      siteId: 'site_id', site_id: 'site_id',
      departmentId: 'department_id', department_id: 'department_id',
      unitId: 'unit_id', unit_id: 'unit_id',
      areaId: 'area_id', area_id: 'area_id',
      equipmentId: 'equipment_id', equipment_id: 'equipment_id',
      sourceModule: 'source_module', source_module: 'source_module',
      sourceObjectType: 'source_object_type', source_object_type: 'source_object_type',
      sourceRecordId: 'source_record_id', source_record_id: 'source_record_id',
      sourceSnapshotJson: 'source_snapshot_json', source_snapshot_json: 'source_snapshot_json',
      documentId: 'document_id', document_id: 'document_id',
      documentVersion: 'document_version', document_version: 'document_version',
      storageFileId: 'storage_file_id', storage_file_id: 'storage_file_id',
      auditEvidenceId: 'audit_evidence_id', audit_evidence_id: 'audit_evidence_id',
      externalReferenceUrl: 'external_reference_url', external_reference_url: 'external_reference_url',
      externalReferenceDescription: 'external_reference_description', external_reference_description: 'external_reference_description',
      version: 'version',
      effectiveDate: 'effective_date', effective_date: 'effective_date',
      expiryDate: 'expiry_date', expiry_date: 'expiry_date',
      reviewDate: 'review_date', review_date: 'review_date',
      confidentialityLevel: 'confidentiality_level', confidentiality_level: 'confidentiality_level',
      restricted: 'restricted',
      restrictedReason: 'restricted_reason', restricted_reason: 'restricted_reason',
      personalDataFlagFoundation: 'personal_data_flag_foundation', personal_data_flag_foundation: 'personal_data_flag_foundation',
      legalSensitiveFlagFoundation: 'legal_sensitive_flag_foundation', legal_sensitive_flag_foundation: 'legal_sensitive_flag_foundation',
      duplicateCheckHash: 'duplicate_check_hash', duplicate_check_hash: 'duplicate_check_hash',
      fileHash: 'file_hash', file_hash: 'file_hash',
      fileSizeBytes: 'file_size_bytes', file_size_bytes: 'file_size_bytes',
      notes: 'notes'
    });
    patch.evidence_title ??= source.evidence_description ?? source.requirement_title ?? source.title ?? source.name ?? 'Regulatory evidence';
    patch.evidence_type ??= source.evidence_type_expected ?? dto.evidenceTypeExpected ?? 'Document';
    patch.source_type ??= source.source_type ?? 'Manual External Reference';
    patch.source_module ??= source.evidence_source_module ?? dto.sourceModule ?? dto.source_module ?? 'Regulatory Evidence';
    patch.site_id ??= source.site_id ?? scope.selectedSiteId ?? null;
    patch.unit_id ??= source.unit_id ?? null;
    patch.area_id ??= source.area_id ?? null;
    patch.equipment_id ??= source.equipment_id ?? null;
    patch.regulatory_item_id ??= source.regulatory_item_id ?? null;
    patch.obligation_id ??= source.obligation_id ?? null;
    patch.evidence_requirement_id ??= source.id && source.requirement_title ? source.id : null;
    patch.readiness_status ??= this.safeEvidenceAccessReference(patch, 'reference') ? 'Evidence Linked' : 'Evidence Missing';
    if (!this.canAccessSite(scope, patch.site_id)) throw new BadRequestException('Evidence link site is outside your accessible site scope.');
    return patch;
  }

  private validateEvidenceLink(patch: Row, settings: Row, permissions: string[]) {
    if (!String(patch.evidence_title ?? '').trim()) throw new BadRequestException('Evidence title is required.');
    if (!String(patch.evidence_type ?? '').trim()) throw new BadRequestException('Evidence type is required.');
    if (patch.external_reference_url) this.validateUrl(String(patch.external_reference_url));
    if (patch.restricted && !String(patch.restricted_reason ?? '').trim() && settings.require_reason_for_restricted_evidence !== false) throw new BadRequestException('Restricted evidence requires a reason.');
    if (patch.restricted && !permissions.includes('regulatory.evidence.restricted.manage') && !permissions.includes('regulatory.manage') && !permissions.includes('regulatory:manage')) throw new ForbiddenException('Missing permission: regulatory.evidence.restricted.manage');
    if (!this.safeEvidenceAccessReference(patch, 'reference') && patch.evidence_status !== 'Draft') throw new BadRequestException('Evidence requires a controlled document, storage file, module record, audit evidence, or allowed external reference.');
    if (patch.external_reference_url && settings.allow_manual_external_evidence_reference === false) throw new BadRequestException('Company/site policy does not allow manual external evidence references.');
  }

  private evidenceSourceSnapshot(source: Row) {
    if (!source || !Object.keys(source).length) return null;
    return {
      id: source.id,
      sourceType: source.source_type ?? null,
      code: source.requirement_code ?? source.obligation_code ?? source.item_number ?? source.regulatory_number ?? null,
      title: source.requirement_title ?? source.obligation_title ?? source.title ?? source.name ?? null,
      status: source.requirement_status ?? source.obligation_status ?? source.register_status ?? null,
      capturedAt: new Date().toISOString()
    };
  }

  private async refreshEvidenceReadinessForSource(userId: string, scope: Scope, row: Row) {
    const itemId = row.regulatory_item_id ?? row.requirement?.regulatory_item_id ?? null;
    if (itemId) await this.refreshLinkCounts(scope, itemId).catch(() => null);
    if (row.compliance_assessment_id) {
      await this.db.single(this.db.from('regulatory_compliance_assessments').update({ evidence_readiness_status: row.readiness_status, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', row.compliance_assessment_id).select('id').single()).catch(() => null);
      await this.writeComplianceMutation(scope, userId, 'Compliance evidence readiness refreshed', itemId, null, row, 'Evidence readiness refreshed from Phase 5 evidence link').catch(() => null);
    }
  }

  private async generateEvidenceCode(scope: Scope, prefix: string) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_evidence_history_events').select('id').eq('company_id', scope.companyId)).catch(() => []);
    return `${prefix}-${new Date().getFullYear()}-${String(rows.length + 1).padStart(6, '0')}`;
  }

  private async writeEvidenceMutation(scope: Scope, userId: string, title: string, before: Row | null, after: Row | null, reason: string, metadata: Row = {}) {
    const sourceId = metadata.evidenceLinkId ?? metadata.requirementId ?? metadata.requestId ?? metadata.gapId ?? metadata.packageId ?? after?.id ?? before?.id ?? null;
    const auditInput: Parameters<AuditService['write']>[0] = { tenantId: scope.companyId, actorId: userId, action: title, entityType: 'RegulatoryEvidence', before: before ?? null, after: after ?? null, metadata: { reason, ...metadata, sourceModule: 'Regulatory Evidence' } };
    if (sourceId) auditInput.entityId = sourceId;
    const audit = await this.audit.write(auditInput).catch(() => null);
    await this.db.single(this.db.from('regulatory_evidence_history_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: after?.site_id ?? before?.site_id ?? scope.selectedSiteId ?? null,
      unit_id: after?.unit_id ?? before?.unit_id ?? null,
      area_id: after?.area_id ?? before?.area_id ?? null,
      equipment_id: after?.equipment_id ?? before?.equipment_id ?? null,
      regulatory_item_id: after?.regulatory_item_id ?? before?.regulatory_item_id ?? null,
      obligation_id: after?.obligation_id ?? before?.obligation_id ?? null,
      evidence_requirement_id: metadata.requirementId ?? after?.evidence_requirement_id ?? before?.evidence_requirement_id ?? ((after?.id && after?.requirement_title) ? after.id : null),
      evidence_link_id: metadata.evidenceLinkId ?? after?.evidence_link_id ?? before?.evidence_link_id ?? null,
      evidence_request_id: metadata.requestId ?? null,
      package_id: metadata.packageId ?? null,
      gap_id: metadata.gapId ?? null,
      event_type: title.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      event_title: title,
      event_description: reason,
      before_value_json: before ?? null,
      after_value_json: after ?? null,
      actor_user_id: userId,
      source_module: 'Regulatory Evidence',
      source_record_id: sourceId,
      audit_log_id: (audit as { id?: string } | null)?.id ?? null
    }).select('id').single()).catch(() => null);
  }

  private async writeEvidenceChain(scope: Scope, userId: string, evidenceLinkId: string | null, requirementId: string | null, eventType: string, title: string, description: string, before: Row | null, after: Row | null) {
    await this.db.single(this.db.from('regulatory_evidence_chain_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: after?.site_id ?? before?.site_id ?? scope.selectedSiteId ?? null,
      evidence_link_id: evidenceLinkId,
      evidence_requirement_id: requirementId,
      event_type: eventType,
      event_title: title,
      event_description: description,
      actor_user_id: userId,
      source_module: 'Regulatory Evidence',
      source_record_id: evidenceLinkId ?? requirementId,
      before_value_json: before ?? null,
      after_value_json: after ?? null
    }).select('id').single());
  }

  private async writeEvidenceAccess(scope: Scope, evidenceLinkId: string, accessType: string, accessStatus: string, accessedBy?: string | null, deniedReason?: string | null) {
    await this.db.single(this.db.from('regulatory_evidence_access_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: scope.selectedSiteId ?? null,
      evidence_link_id: evidenceLinkId,
      access_type: accessType,
      access_status: accessStatus,
      accessed_by: accessedBy ?? null,
      denied_reason: deniedReason ?? null
    }).select('id').single());
  }

  private safeEvidenceAccessReference(row: Row, _kind: string) {
    return Boolean(row.document_id || row.storage_file_id || row.audit_evidence_id || row.source_record_id || row.external_reference_url);
  }

  private reviewPatch(decision: string, userId: string, dto: Row) {
    const now = new Date().toISOString();
    if (decision === 'Rejected' && !String(dto.reason ?? dto.rejectionReason ?? '').trim()) throw new BadRequestException('Evidence rejection requires a reason.');
    if (decision === 'Rework Required' && !String(dto.reworkInstructions ?? dto.rework_instructions ?? dto.reason ?? '').trim()) throw new BadRequestException('Rework request requires instructions.');
    return {
      review_status: decision,
      evidence_status: decision === 'Verified' ? 'Verified' : decision === 'Rejected' ? 'Rejected' : 'Submitted',
      readiness_status: decision === 'Verified' ? 'Evidence Verified' : decision === 'Rejected' ? 'Evidence Rejected' : 'Evidence Linked',
      reviewed_by: userId,
      reviewed_at: now,
      review_comment: dto.reviewComment ?? dto.review_comment ?? dto.comment ?? null,
      rejection_reason: dto.rejectionReason ?? dto.rejection_reason ?? (decision === 'Rejected' ? dto.reason : null),
      rework_instructions: dto.reworkInstructions ?? dto.rework_instructions ?? (decision === 'Rework Required' ? dto.reason : null),
      verified_by: decision === 'Verified' ? userId : null,
      verified_at: decision === 'Verified' ? now : null,
      review_date: now
    };
  }

  private detectEvidenceGapRows(requirements: Row[], links: Row[]): Row[] {
    const linkByRequirement = new Map(links.filter((row) => row.evidence_requirement_id).map((row) => [row.evidence_requirement_id, row]));
    return requirements
      .filter((requirement) => requirement.requirement_status !== 'Archived' && !linkByRequirement.has(requirement.id))
      .map((requirement) => ({
        id: crypto.randomUUID(),
        company_id: requirement.company_id,
        site_id: requirement.site_id ?? null,
        unit_id: requirement.unit_id ?? null,
        area_id: requirement.area_id ?? null,
        equipment_id: requirement.equipment_id ?? null,
        gap_title: `Missing evidence: ${requirement.requirement_title}`,
        gap_type: 'Missing Required Evidence',
        gap_description: requirement.evidence_description ?? 'Required regulatory evidence has not been linked.',
        regulatory_item_id: requirement.regulatory_item_id ?? null,
        obligation_id: requirement.obligation_id ?? null,
        evidence_requirement_id: requirement.id,
        evidence_link_id: null,
        gap_status: 'Open',
        gap_severity: requirement.criticality === 'Critical' || requirement.criticality === 'PSM-Critical' ? 'High' : 'Medium',
        criticality: requirement.criticality ?? null,
        owner_user_id: requirement.evidence_owner_user_id ?? null,
        due_date: requirement.due_date ?? null,
        recommended_fix: 'Link acceptable evidence or document a controlled waiver/exception.'
      }));
  }

  private async markEvidenceLinksStaleForRequirement(userId: string, scope: Scope, requirementId: string, reason: string) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_evidence_links').select('*').eq('company_id', scope.companyId).eq('evidence_requirement_id', requirementId).neq('stale_status', 'Stale')).catch(() => []);
    for (const before of rows) {
      if (!this.canAccessSite(scope, before.site_id)) continue;
      const row = await this.db.single<Row>(this.db.from('regulatory_evidence_links').update({ stale_status: 'Stale', stale_reason: reason, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', before.id).select().single());
      await this.db.single(this.db.from('regulatory_evidence_staleness_events').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, evidence_link_id: row.id, evidence_requirement_id: requirementId, stale_trigger_type: 'Requirement Changed', source_module: 'Regulatory Evidence', source_record_id: requirementId, stale_reason: reason }).select('id').single()).catch(() => null);
      await this.writeEvidenceMutation(scope, userId, 'Evidence marked stale', before, row, reason, { evidenceLinkId: row.id, requirementId });
    }
  }

  private applyAuditMappingScopeFilters(q: any, query: Row) {
    const map: Row = {
      siteId: 'site_id', site_id: 'site_id',
      unitId: 'unit_id', unit_id: 'unit_id',
      areaId: 'area_id', area_id: 'area_id',
      equipmentId: 'equipment_id', equipment_id: 'equipment_id',
      regulatoryItemId: 'regulatory_item_id', regulatory_item_id: 'regulatory_item_id',
      obligationId: 'obligation_id', obligation_id: 'obligation_id',
      complianceAssessmentId: 'compliance_assessment_id', compliance_assessment_id: 'compliance_assessment_id',
      complianceGapId: 'compliance_gap_id', compliance_gap_id: 'compliance_gap_id',
      evidenceLinkId: 'evidence_link_id', evidence_link_id: 'evidence_link_id',
      evidencePackageId: 'evidence_package_id', evidence_package_id: 'evidence_package_id',
      auditProgramId: 'audit_program_id', audit_program_id: 'audit_program_id',
      auditPlanId: 'audit_plan_id', audit_plan_id: 'audit_plan_id',
      auditChecklistId: 'audit_checklist_id', audit_checklist_id: 'audit_checklist_id',
      auditExecutionId: 'audit_execution_id', audit_execution_id: 'audit_execution_id',
      auditFindingId: 'audit_finding_id', audit_finding_id: 'audit_finding_id',
      auditCapaId: 'audit_capa_id', audit_capa_id: 'audit_capa_id',
      auditEvidenceId: 'audit_evidence_id', audit_evidence_id: 'audit_evidence_id',
      auditScoreRunId: 'audit_score_run_id', audit_score_run_id: 'audit_score_run_id',
      auditStandardsMappingId: 'audit_standards_mapping_id', audit_standards_mapping_id: 'audit_standards_mapping_id',
      mappingStatus: 'mapping_status', mapping_status: 'mapping_status',
      coverageStatus: 'coverage_status', coverage_status: 'coverage_status',
      verificationStatus: 'verification_status', verification_status: 'verification_status',
      auditReadinessStatus: 'audit_readiness_status', audit_readiness_status: 'audit_readiness_status',
      staleStatus: 'stale_status', stale_status: 'stale_status',
      mappingType: 'mapping_type', mapping_type: 'mapping_type',
      auditTargetType: 'audit_target_type', audit_target_type: 'audit_target_type',
      regulatorySourceType: 'regulatory_source_type', regulatory_source_type: 'regulatory_source_type'
    };
    for (const [input, output] of Object.entries(map)) if (query[input] !== undefined && query[input] !== '') q = q.eq(output, query[input]);
    return q;
  }

  private auditMappingSort(sort?: string) {
    const [rawField, rawDir] = String(sort ?? 'updated_at.desc').split('.');
    const allowed = new Set(['updated_at', 'created_at', 'mapping_code', 'mapping_title', 'coverage_status', 'verification_status', 'audit_readiness_status', 'stale_status', 'due_date']);
    const field = rawField ?? 'updated_at';
    return { field: allowed.has(field) ? field : 'updated_at', ascending: rawDir === 'asc' };
  }

  private matchesAuditMappingView(row: Row, view: string) {
    if (view === 'ready-for-audit') return row.audit_readiness_status === 'Ready For Audit' || row.coverage_status === 'Ready For Audit';
    if (view === 'not-ready-for-audit') return row.audit_readiness_status !== 'Ready For Audit' && row.coverage_status !== 'Ready For Audit';
    if (view === 'unmapped') return row.coverage_status === 'Not Mapped' || !this.auditTargetIdFromDto(row);
    if (view === 'stale') return row.stale_status !== 'Current' || row.mapping_status === 'Stale';
    if (view === 'missing-checklist') return row.coverage_status === 'Missing Checklist' || row.required_audit_checks?.length;
    if (view === 'missing-evidence') return row.coverage_status === 'Missing Evidence' || !row.audit_evidence_id;
    if (view === 'missing-finding-link') return row.coverage_status === 'Missing Finding Link' || (row.required_findings_review && !row.audit_finding_id);
    if (view === 'missing-capa-link') return row.coverage_status === 'Missing CAPA Link' || (row.required_capa_closure && !row.audit_capa_id);
    if (view === 'missing-score-link') return row.coverage_status === 'Missing Score Link' || (row.required_score && !row.audit_score_run_id);
    return true;
  }

  private redactAuditMapping(row: Row, permissions: string[]) {
    if (row.restricted_audit_evidence && !permissions.includes('regulatory.evidence.restricted.view') && !permissions.includes('regulatory.manage')) {
      return { id: row.id, mapping_code: row.mapping_code, mapping_title: 'Restricted audit mapping', restricted: true, restrictedReason: 'Missing permission: regulatory.evidence.restricted.view', mapping_status: row.mapping_status, coverage_status: row.coverage_status, verification_status: row.verification_status };
    }
    return row;
  }

  private redactAuditMappingLink(row: Row, permissions: string[]) {
    if (String(row.target_object_type).includes('Evidence') && !permissions.includes('regulatory.evidence.restricted.view') && row.target_snapshot_json?.restricted) return { id: row.id, link_type: row.link_type, target_object_type: row.target_object_type, restricted: true, restrictedReason: 'Restricted audit evidence is hidden.' };
    return row;
  }

  private auditMappingSummaryFromRows(rows: Row[], gaps: Row[] = []) {
    const openGaps = gaps.filter((gap) => !['Resolved', 'Archived'].includes(gap.gap_status));
    return {
      totalMappings: rows.length,
      activeMappings: rows.filter((row) => row.mapping_status === 'Active').length,
      verifiedMappings: rows.filter((row) => row.verification_status === 'Verified').length,
      rejectedMappings: rows.filter((row) => row.verification_status === 'Rejected').length,
      staleMappings: rows.filter((row) => row.stale_status !== 'Current' || row.mapping_status === 'Stale').length,
      unmappedRequirements: rows.filter((row) => row.coverage_status === 'Not Mapped').length,
      readyForAudit: rows.filter((row) => row.audit_readiness_status === 'Ready For Audit' || row.coverage_status === 'Ready For Audit').length,
      notReadyForAudit: rows.filter((row) => row.audit_readiness_status !== 'Ready For Audit' && row.coverage_status !== 'Ready For Audit').length,
      openGaps: openGaps.length,
      missingChecklist: openGaps.filter((gap) => gap.gap_type === 'Missing Checklist').length,
      missingEvidence: openGaps.filter((gap) => gap.gap_type === 'Missing Evidence').length,
      missingFindingLink: openGaps.filter((gap) => gap.gap_type === 'Missing Finding Link').length,
      missingCapaLink: openGaps.filter((gap) => gap.gap_type === 'Missing CAPA Link').length,
      missingScoreLink: openGaps.filter((gap) => gap.gap_type === 'Missing Score Link').length,
      byCoverage: this.groupRows(rows, 'coverage_status'),
      byVerification: this.groupRows(rows, 'verification_status'),
      byTargetType: this.groupRows(rows, 'audit_target_type')
    };
  }

  private normalizeAuditMappingInput(scope: Scope, dto: Row, source: Row, auditTarget: Row, before: Row | null = null) {
    const patch = this.pickMapped(dto, {
      siteId: 'site_id', site_id: 'site_id',
      unitId: 'unit_id', unit_id: 'unit_id',
      areaId: 'area_id', area_id: 'area_id',
      equipmentId: 'equipment_id', equipment_id: 'equipment_id',
      regulatorySourceType: 'regulatory_source_type', regulatory_source_type: 'regulatory_source_type',
      regulatoryItemId: 'regulatory_item_id', regulatory_item_id: 'regulatory_item_id',
      obligationId: 'obligation_id', obligation_id: 'obligation_id',
      complianceAssessmentId: 'compliance_assessment_id', compliance_assessment_id: 'compliance_assessment_id',
      complianceGapId: 'compliance_gap_id', compliance_gap_id: 'compliance_gap_id',
      evidenceLinkId: 'evidence_link_id', evidence_link_id: 'evidence_link_id',
      evidencePackageId: 'evidence_package_id', evidence_package_id: 'evidence_package_id',
      auditTargetType: 'audit_target_type', audit_target_type: 'audit_target_type',
      auditProgramId: 'audit_program_id', audit_program_id: 'audit_program_id',
      auditPlanId: 'audit_plan_id', audit_plan_id: 'audit_plan_id',
      auditChecklistId: 'audit_checklist_id', audit_checklist_id: 'audit_checklist_id',
      auditChecklistSectionId: 'audit_checklist_section_id', audit_checklist_section_id: 'audit_checklist_section_id',
      auditChecklistItemId: 'audit_checklist_item_id', audit_checklist_item_id: 'audit_checklist_item_id',
      auditExecutionId: 'audit_execution_id', audit_execution_id: 'audit_execution_id',
      auditExecutionResponseId: 'audit_execution_response_id', audit_execution_response_id: 'audit_execution_response_id',
      auditFieldFindingId: 'audit_field_finding_id', audit_field_finding_id: 'audit_field_finding_id',
      auditFindingId: 'audit_finding_id', audit_finding_id: 'audit_finding_id',
      auditCapaId: 'audit_capa_id', audit_capa_id: 'audit_capa_id',
      auditCapaActionId: 'audit_capa_action_id', audit_capa_action_id: 'audit_capa_action_id',
      auditEvidenceId: 'audit_evidence_id', audit_evidence_id: 'audit_evidence_id',
      auditScoreRunId: 'audit_score_run_id', audit_score_run_id: 'audit_score_run_id',
      auditScoreComponentId: 'audit_score_component_id', audit_score_component_id: 'audit_score_component_id',
      auditStandardsMappingId: 'audit_standards_mapping_id', audit_standards_mapping_id: 'audit_standards_mapping_id',
      auditReviewPackageId: 'audit_review_package_id', audit_review_package_id: 'audit_review_package_id',
      auditReportId: 'audit_report_id', audit_report_id: 'audit_report_id',
      mappingCode: 'mapping_code', mapping_code: 'mapping_code',
      mappingTitle: 'mapping_title', mapping_title: 'mapping_title',
      mappingType: 'mapping_type', mapping_type: 'mapping_type',
      mappingSource: 'mapping_source', mapping_source: 'mapping_source',
      mappingRationale: 'mapping_rationale', mapping_rationale: 'mapping_rationale',
      mappingStatus: 'mapping_status', mapping_status: 'mapping_status',
      coverageStatus: 'coverage_status', coverage_status: 'coverage_status',
      verificationStatus: 'verification_status', verification_status: 'verification_status',
      auditReadinessStatus: 'audit_readiness_status', audit_readiness_status: 'audit_readiness_status',
      staleStatus: 'stale_status', stale_status: 'stale_status',
      staleReason: 'stale_reason', stale_reason: 'stale_reason',
      requiredFindingsReview: 'required_findings_review', required_findings_review: 'required_findings_review',
      requiredCapaClosure: 'required_capa_closure', required_capa_closure: 'required_capa_closure',
      requiredScore: 'required_score', required_score: 'required_score',
      requiredReview: 'required_review', required_review: 'required_review',
      ownerUserId: 'owner_user_id', owner_user_id: 'owner_user_id',
      reviewerUserId: 'reviewer_user_id', reviewer_user_id: 'reviewer_user_id',
      dueDate: 'due_date', due_date: 'due_date',
      manualCoverageOverride: 'manual_coverage_override', manual_coverage_override: 'manual_coverage_override',
      overrideReason: 'override_reason', override_reason: 'override_reason',
      restrictedAuditEvidence: 'restricted_audit_evidence', restricted_audit_evidence: 'restricted_audit_evidence',
      restrictedReason: 'restricted_reason', restricted_reason: 'restricted_reason'
    });
    patch.site_id ??= source.site_id ?? auditTarget.site_id ?? scope.selectedSiteId ?? before?.site_id ?? null;
    patch.unit_id ??= source.unit_id ?? before?.unit_id ?? null;
    patch.area_id ??= source.area_id ?? before?.area_id ?? null;
    patch.equipment_id ??= source.equipment_id ?? before?.equipment_id ?? null;
    patch.regulatory_source_type ??= source.regulatory_source_type ?? before?.regulatory_source_type ?? 'Manual Foundation';
    patch.regulatory_item_id ??= source.regulatory_item_id ?? source.id ?? before?.regulatory_item_id ?? null;
    patch.obligation_id ??= source.obligation_id ?? before?.obligation_id ?? null;
    patch.audit_target_type ??= auditTarget.audit_target_type ?? dto.auditTargetType ?? before?.audit_target_type ?? 'Foundation Placeholder';
    patch[this.auditTargetColumn(patch.audit_target_type)] ??= auditTarget.id ?? this.auditTargetIdFromDto(dto) ?? before?.[this.auditTargetColumn(patch.audit_target_type)] ?? null;
    patch.mapping_title ??= dto.title ?? before?.mapping_title ?? `${patch.regulatory_source_type} to ${patch.audit_target_type}`;
    patch.mapping_type ??= before?.mapping_type ?? 'Manual Foundation Mapping';
    patch.mapping_source ??= before?.mapping_source ?? 'Manual';
    patch.mapping_rationale ??= dto.rationale ?? before?.mapping_rationale ?? '';
    patch.mapping_status ??= before?.mapping_status ?? 'Draft';
    patch.coverage_status ??= before?.coverage_status ?? this.deriveAuditCoverageStatus(patch);
    patch.verification_status ??= before?.verification_status ?? 'Not Submitted';
    patch.audit_readiness_status ??= patch.coverage_status === 'Covered' ? 'Ready For Audit' : 'Not Ready For Audit';
    patch.stale_status ??= before?.stale_status ?? 'Current';
    patch.required_audit_checks = dto.requiredAuditChecks ?? dto.required_audit_checks ?? before?.required_audit_checks ?? [];
    patch.required_evidence = dto.requiredEvidence ?? dto.required_evidence ?? before?.required_evidence ?? [];
    patch.source_snapshot_json = this.auditMappingSourceSnapshot(source) ?? before?.source_snapshot_json ?? null;
    patch.audit_target_snapshot_json = this.auditTargetSnapshot(auditTarget) ?? before?.audit_target_snapshot_json ?? null;
    patch.traceability_snapshot_json = this.buildAuditTraceability(patch, source, auditTarget);
    patch.coverage_trace_json = this.buildAuditCoverageTrace(patch);
    patch.metadata_json = dto.metadata ?? dto.metadata_json ?? before?.metadata_json ?? {};
    if (!this.canAccessSite(scope, patch.site_id)) throw new BadRequestException('Audit mapping site is outside your accessible site scope.');
    return patch;
  }

  private validateAuditMapping(patch: Row, settings: Row, permissions: string[]) {
    if (!String(patch.regulatory_source_type ?? '').trim()) throw new BadRequestException('Regulatory source type is required.');
    if (!String(patch.audit_target_type ?? '').trim()) throw new BadRequestException('Audit target type is required.');
    if (!String(patch.mapping_type ?? '').trim()) throw new BadRequestException('Mapping type is required.');
    if (!String(patch.mapping_rationale ?? '').trim()) throw new BadRequestException('Mapping rationale is required.');
    if (patch.mapping_status === 'Active' && !this.auditTargetIdFromDto(patch) && patch.audit_target_type !== 'Foundation Placeholder') throw new BadRequestException('Active mapping requires an audit target.');
    if (patch.mapping_status === 'Active' && settings.require_owner_for_active_audit_mapping !== false && !patch.owner_user_id) throw new BadRequestException('Active audit mapping requires an owner.');
    if (patch.manual_coverage_override && !String(patch.override_reason ?? '').trim()) throw new BadRequestException('Coverage override requires a reason.');
    if (patch.manual_coverage_override && !permissions.includes('regulatory.audit_mapping.recalculate')) throw new ForbiddenException('Missing permission: regulatory.audit_mapping.recalculate');
    if (patch.restricted_audit_evidence && !permissions.includes('regulatory.evidence.restricted.view') && !permissions.includes('regulatory.manage')) throw new ForbiddenException('Missing permission: regulatory.evidence.restricted.view');
    if (!settings.allow_manual_audit_mapping && patch.audit_target_type === 'Foundation Placeholder') throw new BadRequestException('Company/site policy does not allow manual audit mapping placeholders.');
  }

  private async resolveAuditMappingSource(scope: Scope, dto: Row) {
    if (dto.regulatoryItemId ?? dto.regulatory_item_id) {
      const row = await this.getItem(scope, String(dto.regulatoryItemId ?? dto.regulatory_item_id));
      return { ...row, regulatory_source_type: 'Regulatory Item', regulatory_item_id: row.id };
    }
    if (dto.obligationId ?? dto.obligation_id) {
      const row = await this.getObligation(scope, String(dto.obligationId ?? dto.obligation_id));
      return { ...row, regulatory_source_type: 'Regulatory Obligation', regulatory_item_id: row.regulatory_item_id ?? null, obligation_id: row.id };
    }
    if (dto.complianceAssessmentId ?? dto.compliance_assessment_id) {
      const detail = await this.getComplianceAssessment(scope, String(dto.complianceAssessmentId ?? dto.compliance_assessment_id));
      const row: Row = detail.assessment ?? detail;
      return { ...row, regulatory_source_type: 'Compliance Assessment', regulatory_item_id: row.regulatory_item_id ?? null, obligation_id: row.obligation_id ?? null, compliance_assessment_id: row.id };
    }
    if (dto.complianceGapId ?? dto.compliance_gap_id) {
      const row = await this.getComplianceGap(scope, String(dto.complianceGapId ?? dto.compliance_gap_id));
      return { ...row, regulatory_source_type: 'Compliance Gap', regulatory_item_id: row.regulatory_item_id ?? null, obligation_id: row.obligation_id ?? null, compliance_gap_id: row.id };
    }
    if (dto.evidenceLinkId ?? dto.evidence_link_id) {
      const row = await this.getEvidenceLink(scope, String(dto.evidenceLinkId ?? dto.evidence_link_id), ['regulatory.evidence.link.view'], false);
      return { ...row, regulatory_source_type: 'Evidence Link', regulatory_item_id: row.regulatory_item_id ?? null, obligation_id: row.obligation_id ?? null, evidence_link_id: row.id };
    }
    if (dto.evidencePackageId ?? dto.evidence_package_id) {
      const detail = await this.getEvidencePackage(scope, String(dto.evidencePackageId ?? dto.evidence_package_id), ['regulatory.evidence.package.view']);
      const row = detail.package ?? detail;
      return { ...row, regulatory_source_type: 'Evidence Package', evidence_package_id: row.id };
    }
    return { id: dto.sourceRecordId ?? null, regulatory_source_type: dto.regulatorySourceType ?? dto.regulatory_source_type ?? 'Manual Foundation', site_id: dto.siteId ?? dto.site_id ?? scope.selectedSiteId ?? null, unit_id: dto.unitId ?? dto.unit_id ?? null, area_id: dto.areaId ?? dto.area_id ?? null, equipment_id: dto.equipmentId ?? dto.equipment_id ?? null };
  }

  private async resolveAuditTarget(scope: Scope, dto: Row, permissions: string[]) {
    const targetType = String(dto.auditTargetType ?? dto.audit_target_type ?? '');
    const targetId = this.auditTargetIdFromDto({ ...dto, audit_target_type: targetType });
    if (!targetId || targetType === 'Foundation Placeholder') return { id: targetId ?? null, audit_target_type: targetType || 'Foundation Placeholder', title: dto.auditTargetTitle ?? dto.audit_target_title ?? 'Foundation placeholder', site_id: dto.siteId ?? dto.site_id ?? scope.selectedSiteId ?? null };
    const table = this.auditTargetTable(targetType);
    if (!table) throw new BadRequestException(`Unsupported audit target type: ${targetType}`);
    const row = await this.db.single<Row>(this.db.from(table).select('*').eq('company_id', scope.companyId).eq('id', targetId).maybeSingle()).catch(() => null);
    if (!row) throw new BadRequestException(`Audit target was not found or is outside this company: ${targetType}`);
    if (!this.canAccessSite(scope, row.site_id)) throw new BadRequestException('Audit target site is outside your accessible site scope.');
    if (targetType.includes('Evidence') && row.restricted && !permissions.includes('regulatory.evidence.restricted.view') && !permissions.includes('regulatory.manage')) throw new ForbiddenException('Missing permission for restricted audit evidence.');
    return { ...row, audit_target_type: targetType };
  }

  private auditTargetTable(targetType: string) {
    const normalized = targetType.toLowerCase();
    if (normalized.includes('standards mapping')) return 'audit_standard_mappings';
    if (normalized.includes('program')) return 'audit_programs';
    if (normalized.includes('plan')) return 'audit_plans';
    if (normalized.includes('checklist item')) return 'audit_checklist_items';
    if (normalized.includes('checklist section')) return 'audit_checklist_sections';
    if (normalized.includes('checklist')) return 'audit_checklist_templates';
    if (normalized.includes('execution response')) return 'audit_execution_responses';
    if (normalized.includes('execution')) return 'audit_executions';
    if (normalized.includes('field finding')) return 'audit_field_findings';
    if (normalized.includes('finding')) return 'audit_findings';
    if (normalized.includes('capa action')) return 'audit_capa_actions';
    if (normalized.includes('capa')) return 'audit_capa_packages';
    if (normalized.includes('evidence')) return 'audit_evidence_records';
    if (normalized.includes('score component')) return 'audit_score_components';
    if (normalized.includes('score')) return 'audit_score_runs';
    return null;
  }

  private auditTargetColumn(targetType: string) {
    const normalized = String(targetType ?? '').toLowerCase();
    if (normalized.includes('standards mapping')) return 'audit_standards_mapping_id';
    if (normalized.includes('program')) return 'audit_program_id';
    if (normalized.includes('plan')) return 'audit_plan_id';
    if (normalized.includes('checklist item')) return 'audit_checklist_item_id';
    if (normalized.includes('checklist section')) return 'audit_checklist_section_id';
    if (normalized.includes('checklist')) return 'audit_checklist_id';
    if (normalized.includes('execution response')) return 'audit_execution_response_id';
    if (normalized.includes('execution')) return 'audit_execution_id';
    if (normalized.includes('field finding')) return 'audit_field_finding_id';
    if (normalized.includes('finding')) return 'audit_finding_id';
    if (normalized.includes('capa action')) return 'audit_capa_action_id';
    if (normalized.includes('capa')) return 'audit_capa_id';
    if (normalized.includes('evidence')) return 'audit_evidence_id';
    if (normalized.includes('score component')) return 'audit_score_component_id';
    if (normalized.includes('score')) return 'audit_score_run_id';
    if (normalized.includes('review package')) return 'audit_review_package_id';
    if (normalized.includes('report')) return 'audit_report_id';
    return 'audit_standards_mapping_id';
  }

  private auditTargetIdFromDto(dto: Row) {
    const column = this.auditTargetColumn(String(dto.auditTargetType ?? dto.audit_target_type ?? ''));
    return dto.auditTargetId ?? dto.audit_target_id ?? dto[column] ?? dto.auditProgramId ?? dto.audit_program_id ?? dto.auditPlanId ?? dto.audit_plan_id ?? dto.auditChecklistId ?? dto.audit_checklist_id ?? dto.auditFindingId ?? dto.audit_finding_id ?? dto.auditCapaId ?? dto.audit_capa_id ?? dto.auditEvidenceId ?? dto.audit_evidence_id ?? dto.auditScoreRunId ?? dto.audit_score_run_id ?? dto.auditStandardsMappingId ?? dto.audit_standards_mapping_id ?? null;
  }

  private auditMappingSourceId(row: Row) {
    return row.regulatory_item_id ?? row.obligation_id ?? row.compliance_assessment_id ?? row.compliance_gap_id ?? row.evidence_link_id ?? row.evidence_package_id ?? null;
  }

  private auditMappingSourceSnapshot(source: Row) {
    if (!source || !Object.keys(source).length) return null;
    return { id: source.id ?? null, sourceType: source.regulatory_source_type ?? null, code: source.requirement_code ?? source.obligation_code ?? source.assessment_code ?? source.gap_code ?? source.evidence_code ?? source.package_code ?? null, title: source.requirement_title ?? source.obligation_title ?? source.assessment_title ?? source.gap_title ?? source.evidence_title ?? source.package_title ?? source.title ?? null, status: source.register_status ?? source.obligation_status ?? source.assessment_status ?? source.gap_status ?? source.evidence_status ?? source.package_status ?? null, siteId: source.site_id ?? null, capturedAt: new Date().toISOString() };
  }

  private auditTargetSnapshot(target: Row) {
    if (!target || !Object.keys(target).length) return null;
    return { id: target.id ?? null, targetType: target.audit_target_type ?? null, code: target.program_code ?? target.plan_code ?? target.checklist_code ?? target.execution_code ?? target.finding_code ?? target.capa_code ?? target.evidence_code ?? target.score_code ?? target.mapping_code ?? null, title: target.program_title ?? target.plan_title ?? target.checklist_title ?? target.finding_title ?? target.capa_title ?? target.evidence_title ?? target.score_title ?? target.mapping_title ?? target.title ?? target.name ?? null, status: target.program_status ?? target.plan_status ?? target.checklist_status ?? target.execution_status ?? target.finding_status ?? target.capa_status ?? target.evidence_status ?? target.score_status ?? target.mapping_status ?? null, siteId: target.site_id ?? null, restricted: Boolean(target.restricted), capturedAt: new Date().toISOString() };
  }

  private deriveAuditCoverageStatus(row: Row) {
    if (row.manual_coverage_override) return row.coverage_status ?? 'Override Accepted';
    if (!this.auditTargetIdFromDto(row) && row.audit_target_type !== 'Foundation Placeholder') return 'Not Mapped';
    if (row.audit_target_type === 'Audit Checklist' || row.audit_target_type === 'Audit Checklist Item' || row.audit_checklist_id || row.audit_checklist_item_id) return row.audit_evidence_id || row.evidence_link_id ? 'Covered' : 'Partially Covered';
    if (row.required_evidence?.length && !row.audit_evidence_id && !row.evidence_link_id) return 'Missing Evidence';
    if (row.required_findings_review && !row.audit_finding_id) return 'Missing Finding Link';
    if (row.required_capa_closure && !row.audit_capa_id) return 'Missing CAPA Link';
    if (row.required_score && !row.audit_score_run_id) return 'Missing Score Link';
    return this.auditTargetIdFromDto(row) || row.audit_target_type === 'Foundation Placeholder' ? 'Covered' : 'Coverage Gap';
  }

  private auditCoverageScore(status: string) {
    const scores: Row = { Covered: 100, 'Ready For Audit': 100, 'Partially Covered': 50, Mapped: 40, 'Not Applicable': null, 'Override Accepted': 100 };
    return scores[status] ?? 0;
  }

  private auditMappingBlockers(row: Row) {
    const blockers: Row[] = [];
    if (!String(row.mapping_rationale ?? '').trim()) blockers.push({ title: 'Missing mapping rationale', severity: 'High' });
    if (!this.auditTargetIdFromDto(row) && row.audit_target_type !== 'Foundation Placeholder') blockers.push({ title: 'No audit target linked', severity: 'High' });
    if (row.stale_status !== 'Current') blockers.push({ title: 'Mapping is stale', severity: 'High' });
    if (['Missing Evidence', 'Missing Checklist', 'Missing Finding Link', 'Missing CAPA Link', 'Missing Score Link', 'Coverage Gap', 'Not Mapped'].includes(row.coverage_status)) blockers.push({ title: row.coverage_status, severity: 'High' });
    if (row.restricted_audit_evidence && !row.restricted_reason) blockers.push({ title: 'Restricted audit evidence reason missing', severity: 'Medium' });
    return blockers;
  }

  private buildAuditCoverageTrace(row: Row) {
    return { mappingId: row.id ?? null, sourceType: row.regulatory_source_type, targetType: row.audit_target_type, targetId: this.auditTargetIdFromDto(row), coverageStatus: row.coverage_status, verificationStatus: row.verification_status, requiredAuditChecks: row.required_audit_checks ?? [], requiredEvidence: row.required_evidence ?? [], blockers: this.auditMappingBlockers(row), calculatedAt: new Date().toISOString() };
  }

  private buildAuditTraceability(row: Row, source: Row, auditTarget: Row) {
    return { nodes: [{ type: 'Regulatory Source', id: this.auditMappingSourceId(row) ?? source.id ?? null, label: source.requirement_title ?? source.obligation_title ?? source.gap_title ?? row.regulatory_source_type }, { type: 'Audit Target', id: this.auditTargetIdFromDto(row) ?? auditTarget.id ?? null, label: auditTarget.mapping_title ?? auditTarget.program_title ?? auditTarget.finding_title ?? auditTarget.evidence_title ?? row.audit_target_type }], edges: [{ from: this.auditMappingSourceId(row) ?? source.id ?? null, to: this.auditTargetIdFromDto(row) ?? auditTarget.id ?? null, type: row.mapping_type ?? 'Audit Mapping' }], permissionState: row.restricted_audit_evidence ? 'Restricted audit evidence protected' : 'Visible', generatedAt: new Date().toISOString() };
  }

  private async upsertAuditCoverageRecord(scope: Scope, userId: string, row: Row) {
    const existing = await this.db.single<Row>(this.db.from('regulatory_audit_coverage_records').select('id').eq('company_id', scope.companyId).eq('mapping_id', row.id).maybeSingle()).catch(() => null);
    const payload = { company_id: scope.companyId, site_id: row.site_id ?? null, regulatory_item_id: row.regulatory_item_id ?? null, obligation_id: row.obligation_id ?? null, mapping_id: row.id, coverage_status: row.coverage_status, verification_status: row.verification_status, audit_readiness_status: row.audit_readiness_status, mapped_count: this.auditTargetIdFromDto(row) ? 1 : 0, required_count: Number(Boolean(row.required_audit_checks?.length)) + Number(Boolean(row.required_evidence?.length)) + Number(row.required_findings_review) + Number(row.required_capa_closure) + Number(row.required_score), verified_count: row.verification_status === 'Verified' ? 1 : 0, gap_count: this.auditMappingBlockers(row).length, stale_count: row.stale_status === 'Current' ? 0 : 1, coverage_score: row.coverage_score ?? this.auditCoverageScore(row.coverage_status), coverage_trace_json: row.coverage_trace_json ?? this.buildAuditCoverageTrace(row), calculated_at: new Date().toISOString(), calculated_by: userId };
    if (existing?.id) return this.db.single(this.db.from('regulatory_audit_coverage_records').update(payload).eq('company_id', scope.companyId).eq('id', existing.id).select('id').single()).catch(() => null);
    return this.db.single(this.db.from('regulatory_audit_coverage_records').insert({ id: crypto.randomUUID(), ...payload }).select('id').single()).catch(() => null);
  }

  private async auditMappingReviews(scope: Scope, mappingId: string, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.audit_mapping.review.view');
    const rows = await this.db.many<Row>(this.db.from('regulatory_audit_mapping_reviews').select('*').eq('company_id', scope.companyId).eq('mapping_id', mappingId).order('created_at', { ascending: false })).catch(() => []);
    return { rows: rows.filter((row) => this.canAccessSite(scope, row.site_id)) };
  }

  private async writeAuditMappingReview(scope: Scope, userId: string, mapping: Row, status: string, dto: Row) {
    await this.db.single(this.db.from('regulatory_audit_mapping_reviews').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: mapping.site_id ?? null, mapping_id: mapping.id, review_status: status, review_decision: status, reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id ?? userId, review_comment: dto.reviewComment ?? dto.comment ?? null, rejection_reason: dto.rejectionReason ?? dto.reason ?? null, requested_by: status === 'Pending Review' ? userId : null, requested_at: status === 'Pending Review' ? new Date().toISOString() : null, completed_by: status !== 'Pending Review' ? userId : null, completed_at: status !== 'Pending Review' ? new Date().toISOString() : null }).select('id').single()).catch(() => null);
  }

  private async auditMappingDetailRelated(scope: Scope, mappingId: string, permissions: string[], tab: string) {
    const detail = await this.getAuditMapping(scope, mappingId, permissions, true) as Row;
    return { mapping: detail.mapping, tab, links: detail.links?.rows ?? [], coverage: detail.coverage, traceability: detail.traceability, message: `${tab} data is resolved from Regulatory-side links and existing Audit module records; restricted audit evidence is redacted by permission.` };
  }

  private detectAuditMappingGapRows(obligations: Row[], mappings: Row[], settings: Row) {
    if (settings.auto_create_gap_for_missing_audit_mapping === false) return [];
    return obligations.filter((obligation) => {
      const mapped = mappings.some((mapping) => mapping.obligation_id === obligation.id || mapping.regulatory_item_id === obligation.regulatory_item_id);
      const critical = ['PSM-Critical', 'Safety-Critical', 'Regulatory-Critical', 'Critical'].includes(obligation.criticality);
      return !mapped && (critical || obligation.audit_required || obligation.compliance_status === 'Non-Compliant');
    }).map((obligation) => ({ id: crypto.randomUUID(), company_id: obligation.company_id, site_id: obligation.site_id ?? null, regulatory_item_id: obligation.regulatory_item_id ?? null, obligation_id: obligation.id, gap_type: 'Missing Audit Mapping', gap_title: `Missing audit mapping: ${obligation.obligation_title ?? obligation.obligation_code ?? obligation.id}`, gap_description: 'Backend detected no active audit mapping for this regulatory obligation.', gap_status: 'Open', gap_severity: ['PSM-Critical', 'Safety-Critical', 'Critical'].includes(obligation.criticality) ? 'High' : 'Medium', recommended_fix: 'Map the obligation to an audit standard, checklist item, audit evidence, finding, CAPA, or score.', owner_user_id: obligation.owner_user_id ?? null, due_date: obligation.due_date ?? null }));
  }

  private matrixCoverageStatus(mappings: Row[], gaps: Row[]) {
    if (gaps.some((gap) => gap.gap_status !== 'Resolved')) return 'Coverage Gap';
    if (!mappings.length) return 'Not Mapped';
    if (mappings.some((mapping) => mapping.coverage_status === 'Covered' || mapping.audit_readiness_status === 'Ready For Audit')) return 'Covered';
    return 'Partially Covered';
  }

  private isAuditMappingReadOnly(row: Row) {
    return Boolean(row.locked) || ['Archived', 'Superseded', 'Locked', 'Verified'].includes(row.mapping_status);
  }

  private auditMappingReadOnlyReason(row: Row) {
    if (row.locked) return 'Audit mapping is locked.';
    if (['Archived', 'Superseded', 'Locked', 'Verified'].includes(row.mapping_status)) return `${row.mapping_status} mappings are read-only unless controlled refresh/new-version flow is used.`;
    return null;
  }

  private async generateAuditMappingCode(scope: Scope, prefix = 'RAM') {
    const rows = await this.db.many<Row>(this.db.from('regulatory_audit_mapping_history_events').select('id').eq('company_id', scope.companyId)).catch(() => []);
    return `${prefix}-${new Date().getFullYear()}-${String(rows.length + 1).padStart(6, '0')}`;
  }

  private simpleHash(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    return String(Math.abs(hash));
  }

  private async writeAuditMappingMutation(scope: Scope, userId: string, title: string, before: Row | null, after: Row | null, reason: string, metadata: Row = {}) {
    const sourceId = metadata.mappingId ?? metadata.gapId ?? metadata.linkId ?? after?.id ?? before?.id ?? null;
    const auditInput: Parameters<AuditService['write']>[0] = { tenantId: scope.companyId, actorId: userId, action: title, entityType: 'RegulatoryAuditMapping', before: before ?? null, after: after ?? null, metadata: { reason, ...metadata, sourceModule: 'Regulatory Audit Mapping' } };
    if (sourceId) auditInput.entityId = sourceId;
    const audit = await this.audit.write(auditInput).catch(() => null);
    await this.db.single(this.db.from('regulatory_audit_mapping_history_events').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: after?.site_id ?? before?.site_id ?? scope.selectedSiteId ?? null, regulatory_item_id: after?.regulatory_item_id ?? before?.regulatory_item_id ?? null, obligation_id: after?.obligation_id ?? before?.obligation_id ?? null, mapping_id: metadata.mappingId ?? after?.mapping_id ?? before?.mapping_id ?? after?.id ?? before?.id ?? null, audit_target_type: metadata.auditTargetType ?? after?.audit_target_type ?? before?.audit_target_type ?? null, audit_target_id: this.auditTargetIdFromDto(after ?? before ?? {}), event_type: title.toUpperCase().replace(/[^A-Z0-9]+/g, '_'), event_title: title, event_description: reason, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: userId, source_module: 'Regulatory Audit Mapping', source_record_id: sourceId, audit_log_id: (audit as { id?: string } | null)?.id ?? null }).select('id').single()).catch(() => null);
  }

  private async assertUserInScope(scope: Scope, userId: string) {
    if (!userId) throw new BadRequestException('Owner/user is required.');
    const user = await this.db.single<Row>(this.db.from('User').select('id,tenantId,status').eq('tenantId', scope.companyId).eq('id', userId).maybeSingle());
    if (!user) throw new BadRequestException('Selected owner/user was not found in this company.');
    if (String(user.status ?? '').toLowerCase() !== 'active') throw new BadRequestException('Selected owner/user is inactive or disabled.');
    return user;
  }

  async regulatoryActionDashboard(scope: Scope, query: Row = {}, permissions: string[] = []) {
    const register = await this.regulatoryActionLinks(scope, { ...query, limit: 5000 }, permissions);
    const packages = await this.regulatoryCapaPackages(scope, { ...query, limit: 5000 }, permissions).catch(() => ({ rows: [] as Row[] }));
    const rows = register.allRows ?? register.rows ?? [];
    const packageRows = packages.rows ?? [];
    const gaps = await this.regulatoryActionSourceGapRows(scope);
    return {
      header: { title: 'Regulatory Actions / CAPA', subtitle: 'Backend-controlled action links, CAPA packages, sync, readiness, verification, and escalation.', generatedAt: new Date().toISOString() },
      summary: this.regulatoryActionSummaryFromRows(rows, packageRows, gaps),
      sections: {
        byStatus: this.groupRows(rows, 'action_status'),
        bySourceType: this.groupRows(rows, 'source_type'),
        bySite: this.groupRows(rows, 'site_id'),
        byUnit: this.groupRows(rows, 'unit_id'),
        byRegulatoryItem: this.groupRows(rows, 'regulatory_item_id'),
        byObligation: this.groupRows(rows, 'obligation_id'),
        byGapType: this.groupRows(rows, 'source_type'),
        byOwner: this.groupRows(rows, 'owner_user_id'),
        byDueDate: this.groupRows(rows.map((row) => ({ ...row, due_bucket: this.dueBucket(row.due_date, row.action_status) })), 'due_bucket'),
        byCriticality: this.groupRows(rows, 'criticality'),
        overduePreview: rows.filter((row) => this.isRegulatoryActionOverdue(row)).slice(0, 10),
        blockingCompliancePreview: rows.filter((row) => row.closure_readiness_status === 'Blocking Compliance').slice(0, 10),
        readyForClosurePreview: rows.filter((row) => row.closure_readiness_status === 'Ready for Gap Closure').slice(0, 10),
        linkedAuditCapaPreview: rows.filter((row) => row.audit_capa_id || row.audit_capa_action_id).slice(0, 10),
        recent: rows.slice(0, 10)
      },
      rows: rows.slice(0, Number(query.limit ?? 25)),
      capaPackages: packageRows.slice(0, 10),
      permissions: this.regulatoryActionPermissionSummary(permissions)
    };
  }

  regulatoryActionDashboardSummary(scope: Scope, query: Row = {}, permissions: string[] = []) {
    return this.regulatoryActionDashboard(scope, query, permissions).then((data) => data.summary);
  }

  async regulatoryActionDashboardGroup(scope: Scope, group: string, query: Row = {}, permissions: string[] = []) {
    const dashboard = await this.regulatoryActionDashboard(scope, query, permissions);
    const key = group === 'by-source' ? 'bySourceType' : group === 'by-status' ? 'byStatus' : group === 'by-owner' ? 'byOwner' : group === 'by-site' ? 'bySite' : group;
    if (group === 'overdue') return { rows: dashboard.sections.overduePreview, summary: { total: dashboard.sections.overduePreview.length } };
    if (group === 'blocking-compliance') return { rows: dashboard.sections.blockingCompliancePreview, summary: { total: dashboard.sections.blockingCompliancePreview.length } };
    if (group === 'ready-for-closure') return { rows: dashboard.sections.readyForClosurePreview, summary: { total: dashboard.sections.readyForClosurePreview.length } };
    return { rows: Object.entries((dashboard.sections as Row)[key] ?? {}).map(([label, total]) => ({ label, total })), summary: dashboard.summary };
  }

  regulatoryActionRegister(scope: Scope, query: Row = {}, permissions: string[] = []) {
    return this.regulatoryActionLinks(scope, query, permissions);
  }

  async regulatoryActionLinks(scope: Scope, query: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, query.viewPermission ?? 'regulatory.action.register.view');
    let q = this.db.from('regulatory_action_links').select('*').eq('company_id', scope.companyId).is('archived_at', null);
    q = this.applyRegulatoryActionScopeFilters(q, scope, query);
    if (query.search) q = q.or(`action_link_title.ilike.%${query.search}%,action_link_code.ilike.%${query.search}%,source_type.ilike.%${query.search}%`);
    if (query.sourceType) q = q.eq('source_type', query.sourceType);
    if (query.actionStatus) q = q.eq('action_status', query.actionStatus);
    if (query.syncStatus) q = q.eq('sync_status', query.syncStatus);
    if (query.closureReadinessStatus) q = q.eq('closure_readiness_status', query.closureReadinessStatus);
    if (query.ownerUserId) q = q.eq('owner_user_id', query.ownerUserId);
    const rows = await this.db.many<Row>(q.order('updated_at', { ascending: false }).limit(Math.min(Number(query.limit ?? 500), 5000)));
    const filtered = rows.filter((row) => this.matchesRegulatoryActionView(row, query.view ?? query.statusView));
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Number(query.limit ?? 25), 100);
    return { rows: filtered.slice((page - 1) * limit, page * limit), allRows: filtered, total: filtered.length, page, limit, summary: this.regulatoryActionSummaryFromRows(filtered, [], []) };
  }

  regulatoryActionSummary(scope: Scope, query: Row = {}, permissions: string[] = []) {
    return this.regulatoryActionLinks(scope, { ...query, limit: 5000 }, permissions).then((data) => data.summary);
  }

  regulatoryActionFilteredView(scope: Scope, view: string, query: Row = {}, permissions: string[] = []) {
    return this.regulatoryActionLinks(scope, { ...query, view, viewPermission: 'regulatory.action.view' }, permissions);
  }

  async createRegulatoryAction(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.create');
    const settings = await this.settings(scope);
    const normalized = await this.normalizeRegulatoryActionInput(userId, scope, dto, settings);
    if (normalized.action_mode === 'Create New Universal Action') {
      const created = await this.actions.create(scope.companyId, userId, {
        title: normalized.action_link_title,
        description: normalized.action_reason ?? normalized.expected_outcome ?? normalized.action_link_title,
        sourceModule: 'REGULATORY',
        sourceRecordId: normalized.source_record_id,
        sourceType: normalized.source_type,
        siteId: normalized.site_id ?? undefined,
        departmentId: normalized.department_id ?? undefined,
        ownerId: normalized.owner_user_id,
        priority: this.toActionEnginePriority(normalized.action_priority),
        dueDate: normalized.due_date,
        evidenceRequired: normalized.evidence_required,
        verificationRequired: normalized.verification_required
      });
      normalized.universal_action_id = created.id;
      normalized.action_status = this.mapUniversalActionStatus(created.status, created.dueDate ?? normalized.due_date);
      normalized.sync_status = 'Synced';
      normalized.source_snapshot_json = { ...(normalized.source_snapshot_json ?? {}), universalAction: this.actionSnapshot(created) };
    }
    if (normalized.action_mode === 'Link Existing Universal Action') await this.assertUniversalActionAccessible(scope, normalized.universal_action_id);
    if (normalized.action_mode === 'Link Existing Audit CAPA') await this.assertAuditCapaAccessible(scope, normalized.audit_capa_id);
    if (normalized.action_mode === 'Create Regulatory CAPA Package Foundation') {
      const pkg = await this.createRegulatoryCapaPackage(userId, scope, {
        capaPackageTitle: dto.capaPackageTitle ?? normalized.action_link_title,
        capaPackageType: dto.capaPackageType ?? 'Regulatory Compliance CAPA',
        ownerUserId: normalized.owner_user_id,
        dueDate: normalized.due_date,
        source: normalized,
        reason: dto.reason ?? 'CAPA package foundation created from regulatory action wizard'
      }, [...permissions, 'regulatory.capa.create']);
      normalized.capa_package_id = pkg.package.id;
    }
    normalized.closure_readiness_status = this.calculateActionClosureReadiness(normalized, settings).status;
    const insertRow = { ...normalized };
    delete insertRow.source_record_id;
    const row = await this.db.single<Row>(this.db.from('regulatory_action_links').insert(insertRow).select().single());
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory action link created', null, row, String(dto.reason ?? 'Regulatory action link created'), { actionLinkId: row.id });
    await this.checkRegulatoryActionClosureReadiness(userId, scope, row.id, { reason: 'Initial closure readiness check' }, [...permissions, 'regulatory.action.closure_readiness.check']).catch(() => null);
    return this.getRegulatoryActionLink(scope, row.id, permissions, true);
  }

  linkExistingRegulatoryAction(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, dto.auditCapaId || dto.audit_capa_id ? 'regulatory.action.link_audit_capa' : 'regulatory.action.link_existing');
    return this.createRegulatoryAction(userId, scope, { ...dto, actionMode: dto.auditCapaId || dto.audit_capa_id ? 'Link Existing Audit CAPA' : 'Link Existing Universal Action' }, [...permissions, 'regulatory.action.create']);
  }

  async getRegulatoryActionLink(scope: Scope, actionLinkId: string, permissions: string[] = [], includeRelated = false) {
    this.requirePermission(permissions, 'regulatory.action.view');
    const row = await this.db.single<Row>(this.db.from('regulatory_action_links').select('*').eq('company_id', scope.companyId).eq('id', actionLinkId).maybeSingle());
    if (!row) throw new NotFoundException('Regulatory action link not found.');
    if (!this.canAccessSite(scope, row.site_id)) throw new ForbiddenException('Regulatory action link is outside selected site access.');
    if (!includeRelated) return row;
    const [readiness, verification, effectiveness, syncLog, history, packageRow] = await Promise.all([
      this.db.many<Row>(this.db.from('regulatory_action_closure_readiness').select('*').eq('company_id', scope.companyId).eq('action_link_id', actionLinkId).order('checked_at', { ascending: false }).limit(20)).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_action_verification_foundation').select('*').eq('company_id', scope.companyId).eq('action_link_id', actionLinkId).order('created_at', { ascending: false }).limit(20)).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_action_effectiveness_foundation').select('*').eq('company_id', scope.companyId).eq('action_link_id', actionLinkId).order('created_at', { ascending: false }).limit(20)).catch(() => []),
      this.regulatoryActionSyncLog(scope, actionLinkId, permissions).catch(() => ({ rows: [] })),
      this.regulatoryActionHistory(scope, { actionLinkId }, permissions).catch(() => ({ rows: [] })),
      row.capa_package_id ? this.db.single<Row>(this.db.from('regulatory_capa_packages').select('*').eq('company_id', scope.companyId).eq('id', row.capa_package_id).maybeSingle()).catch(() => null) : Promise.resolve(null)
    ]);
    return { row, readiness, verification, effectiveness, syncLog: syncLog.rows ?? [], history: history.rows ?? [], capaPackage: packageRow, permissions: this.regulatoryActionPermissionSummary(permissions) };
  }

  async updateRegulatoryActionLink(userId: string, scope: Scope, actionLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.edit_link');
    const before = await this.getRegulatoryActionLink(scope, actionLinkId, permissions) as Row;
    if (before.archived_at) throw new BadRequestException('Archived regulatory action links are read-only.');
    const patch = this.pickMapped(dto, {
      actionLinkTitle: 'action_link_title', action_link_title: 'action_link_title',
      regulatoryActionType: 'regulatory_action_type', regulatory_action_type: 'regulatory_action_type',
      actionClassification: 'action_classification', action_classification: 'action_classification',
      actionPriority: 'action_priority', action_priority: 'action_priority',
      ownerUserId: 'owner_user_id', owner_user_id: 'owner_user_id',
      responsibleDepartmentId: 'responsible_department_id', responsible_department_id: 'responsible_department_id',
      reviewerUserId: 'reviewer_user_id', reviewer_user_id: 'reviewer_user_id',
      verifierUserId: 'verifier_user_id', verifier_user_id: 'verifier_user_id',
      dueDate: 'due_date', due_date: 'due_date',
      effectivenessDueDate: 'effectiveness_due_date', effectiveness_due_date: 'effectiveness_due_date',
      evidenceRequired: 'evidence_required', evidence_required: 'evidence_required',
      verificationRequired: 'verification_required', verification_required: 'verification_required',
      effectivenessRequired: 'effectiveness_required', effectiveness_required: 'effectiveness_required',
      acceptanceCriteriaFoundation: 'acceptance_criteria_foundation', acceptance_criteria_foundation: 'acceptance_criteria_foundation',
      rootCauseFoundation: 'root_cause_foundation', root_cause_foundation: 'root_cause_foundation',
      expectedOutcome: 'expected_outcome', expected_outcome: 'expected_outcome',
      actionReason: 'action_reason', action_reason: 'action_reason',
      complianceImpact: 'compliance_impact', compliance_impact: 'compliance_impact',
      criticality: 'criticality'
    });
    const readiness = this.calculateActionClosureReadiness({ ...before, ...patch }, await this.settings(scope));
    const row = await this.db.single<Row>(this.db.from('regulatory_action_links').update({ ...patch, closure_readiness_status: readiness.status, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', actionLinkId).select().single());
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory action link updated', before, row, String(dto.reason ?? 'Regulatory action link updated'), { actionLinkId });
    return this.getRegulatoryActionLink(scope, actionLinkId, permissions, true);
  }

  async syncRegulatoryActionLink(userId: string, scope: Scope, actionLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.sync');
    const before = await this.getRegulatoryActionLink(scope, actionLinkId, permissions) as Row;
    const oldReadiness = before.closure_readiness_status;
    let newStatus = before.action_status;
    let syncStatus = 'Synced';
    let snapshot: Row = {};
    let error: string | null = null;
    try {
      if (before.universal_action_id) {
        const action = await this.assertUniversalActionAccessible(scope, before.universal_action_id);
        newStatus = this.mapUniversalActionStatus(action.status, action.dueDate ?? before.due_date);
        snapshot.universalAction = this.actionSnapshot(action);
      }
      if (before.audit_capa_id) {
        const capa = await this.assertAuditCapaAccessible(scope, before.audit_capa_id);
        snapshot.auditCapa = this.auditCapaSnapshot(capa);
        if (!before.universal_action_id) newStatus = this.mapAuditCapaStatus(capa.capa_status ?? capa.package_status ?? capa.status);
      }
      if (!before.universal_action_id && !before.audit_capa_id) syncStatus = 'Not Synced';
    } catch (err) {
      syncStatus = before.universal_action_id ? 'Action Engine Unavailable' : 'Audit CAPA Unavailable';
      error = err instanceof Error ? err.message : 'Sync failed.';
    }
    const readiness = this.calculateActionClosureReadiness({ ...before, action_status: newStatus, sync_status: syncStatus }, await this.settings(scope));
    const row = await this.db.single<Row>(this.db.from('regulatory_action_links').update({ action_status: newStatus, sync_status: syncStatus, closure_readiness_status: readiness.status, source_snapshot_json: { ...(before.source_snapshot_json ?? {}), ...snapshot }, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', actionLinkId).select().single());
    await this.db.single(this.db.from('regulatory_action_sync_events').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, action_link_id: actionLinkId, sync_source: before.universal_action_id ? 'Universal Action Engine' : before.audit_capa_id ? 'Audit CAPA' : 'Regulatory Foundation', sync_event_type: dto.syncEventType ?? 'Manual Sync', sync_status: syncStatus, old_action_status: before.action_status, new_action_status: newStatus, old_readiness_status: oldReadiness, new_readiness_status: readiness.status, source_snapshot_json: snapshot, error_message: error, synced_by: userId }).select('id').single()).catch(() => null);
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory action status synced', before, row, String(dto.reason ?? 'Action/CAPA status synchronized'), { actionLinkId, syncStatus });
    return this.getRegulatoryActionLink(scope, actionLinkId, permissions, true);
  }

  refreshRegulatoryActionSnapshot(userId: string, scope: Scope, actionLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.refresh_snapshot');
    return this.syncRegulatoryActionLink(userId, scope, actionLinkId, { ...dto, syncEventType: 'Snapshot Refreshed' }, [...permissions, 'regulatory.action.sync']);
  }

  async checkRegulatoryActionClosureReadiness(userId: string, scope: Scope, actionLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.closure_readiness.check');
    const before = await this.getRegulatoryActionLink(scope, actionLinkId, [...permissions, 'regulatory.action.view']) as Row;
    const readiness = this.calculateActionClosureReadiness(before, await this.settings(scope));
    const row = await this.db.single<Row>(this.db.from('regulatory_action_links').update({ closure_readiness_status: readiness.status, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', actionLinkId).select().single());
    await this.db.single(this.db.from('regulatory_action_closure_readiness').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, action_link_id: actionLinkId, source_type: row.source_type, source_record_id: this.regulatoryActionSourceRecordId(row), readiness_status: readiness.status, readiness_trace_json: readiness.trace, blocking_reasons_json: readiness.blockers, checked_by: userId }).select('id').single()).catch(() => null);
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory action closure readiness checked', before, row, String(dto.reason ?? 'Closure readiness checked'), { actionLinkId, readinessStatus: readiness.status });
    return { row, readiness };
  }

  async submitRegulatoryActionVerification(userId: string, scope: Scope, actionLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.verification.submit');
    const before = await this.getRegulatoryActionLink(scope, actionLinkId, permissions) as Row;
    const row = await this.db.single<Row>(this.db.from('regulatory_action_links').update({ verification_status: 'Verification Passed', verified_at: new Date().toISOString(), verifier_user_id: dto.verifierUserId ?? dto.verifier_user_id ?? userId, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', actionLinkId).select().single());
    await this.db.single(this.db.from('regulatory_action_verification_foundation').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, action_link_id: actionLinkId, verification_status: 'Verification Passed', verification_comment: dto.comment ?? dto.verificationComment ?? null, verification_basis_foundation: dto.basis ?? dto.verificationBasisFoundation ?? null, verified_by: userId, verified_at: new Date().toISOString(), evidence_link_id: dto.evidenceLinkId ?? dto.evidence_link_id ?? null, e_signature_id: dto.eSignatureId ?? dto.e_signature_id ?? null }).select('id').single()).catch(() => null);
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory action verification passed', before, row, String(dto.reason ?? 'Verification submitted'), { actionLinkId });
    return this.checkRegulatoryActionClosureReadiness(userId, scope, actionLinkId, { reason: 'Verification updated readiness' }, [...permissions, 'regulatory.action.closure_readiness.check']);
  }

  async failRegulatoryActionVerification(userId: string, scope: Scope, actionLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.verification.fail');
    const reason = String(dto.reason ?? dto.failedReason ?? '').trim();
    if (!reason) throw new BadRequestException('Verification failure requires a reason.');
    const before = await this.getRegulatoryActionLink(scope, actionLinkId, permissions) as Row;
    const row = await this.db.single<Row>(this.db.from('regulatory_action_links').update({ verification_status: 'Verification Failed', closure_readiness_status: 'Verification Required', updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', actionLinkId).select().single());
    await this.db.single(this.db.from('regulatory_action_verification_foundation').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, action_link_id: actionLinkId, verification_status: 'Verification Failed', verification_comment: dto.comment ?? null, failed_reason: reason, verified_by: userId, verified_at: new Date().toISOString(), evidence_link_id: dto.evidenceLinkId ?? dto.evidence_link_id ?? null }).select('id').single()).catch(() => null);
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory action verification failed', before, row, reason, { actionLinkId });
    return this.getRegulatoryActionLink(scope, actionLinkId, permissions, true);
  }

  async submitRegulatoryActionEffectiveness(userId: string, scope: Scope, actionLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.effectiveness.submit');
    const before = await this.getRegulatoryActionLink(scope, actionLinkId, permissions) as Row;
    const status = dto.decision === 'fail' || dto.effectivenessStatus === 'Effectiveness Failed' ? 'Effectiveness Failed' : 'Effectiveness Passed';
    if (status === 'Effectiveness Failed' && !String(dto.reason ?? dto.failedReason ?? '').trim()) throw new BadRequestException('Effectiveness failure requires a reason.');
    const row = await this.db.single<Row>(this.db.from('regulatory_action_links').update({ effectiveness_status: status, closure_readiness_status: status === 'Effectiveness Failed' ? 'Effectiveness Required' : before.closure_readiness_status, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', actionLinkId).select().single());
    await this.db.single(this.db.from('regulatory_action_effectiveness_foundation').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, action_link_id: actionLinkId, effectiveness_status: status, effectiveness_due_date: dto.effectivenessDueDate ?? dto.effectiveness_due_date ?? row.effectiveness_due_date ?? null, effectiveness_comment: dto.comment ?? null, effectiveness_basis_foundation: dto.basis ?? null, checked_by: userId, checked_at: new Date().toISOString(), failed_reason: dto.failedReason ?? dto.reason ?? null, next_check_date: dto.nextCheckDate ?? dto.next_check_date ?? null }).select('id').single()).catch(() => null);
    await this.writeRegulatoryActionMutation(scope, userId, `Regulatory action ${status.toLowerCase()}`, before, row, String(dto.reason ?? status), { actionLinkId });
    return this.checkRegulatoryActionClosureReadiness(userId, scope, actionLinkId, { reason: 'Effectiveness updated readiness' }, [...permissions, 'regulatory.action.closure_readiness.check']);
  }

  async escalateRegulatoryAction(userId: string, scope: Scope, actionLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.escalate');
    const link = await this.getRegulatoryActionLink(scope, actionLinkId, permissions) as Row;
    const reason = String(dto.reason ?? dto.escalationReason ?? '').trim();
    if (!reason) throw new BadRequestException('Escalation reason is required.');
    const row = await this.db.single<Row>(this.db.from('regulatory_action_escalations').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: link.site_id ?? null, action_link_id: actionLinkId, escalation_type: dto.escalationType ?? 'Overdue Escalation', escalation_status: 'Open', escalation_reason: reason, escalated_to_user_id: dto.escalatedToUserId ?? dto.escalated_to_user_id ?? null, escalated_by: userId }).select().single());
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory action escalated', link, row, reason, { actionLinkId, escalationId: row.id });
    return row;
  }

  async archiveRegulatoryActionLink(userId: string, scope: Scope, actionLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.archive_link');
    const reason = String(dto.reason ?? '').trim();
    if (!reason) throw new BadRequestException('Archive reason is required.');
    const before = await this.getRegulatoryActionLink(scope, actionLinkId, permissions) as Row;
    const row = await this.db.single<Row>(this.db.from('regulatory_action_links').update({ action_status: 'Action Archived', archived_at: new Date().toISOString(), archived_by: userId, archive_reason: reason, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', actionLinkId).select().single());
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory action link archived', before, row, reason, { actionLinkId });
    return row;
  }

  async regulatoryActionLinkSection(scope: Scope, actionLinkId: string, section: string, permissions: string[] = []) {
    const detail = await this.getRegulatoryActionLink(scope, actionLinkId, permissions, true) as Row;
    if (section === 'source') return { row: detail.row, source: detail.row?.source_snapshot_json, sourceRecordId: this.regulatoryActionSourceRecordId(detail.row) };
    if (section === 'action-status') return { row: detail.row, status: detail.row?.action_status, universalActionId: detail.row?.universal_action_id, auditCapaId: detail.row?.audit_capa_id, syncStatus: detail.row?.sync_status };
    if (section === 'evidence') return { row: detail.row, evidenceRequired: detail.row?.evidence_required, sourceSnapshot: detail.row?.source_snapshot_json?.evidence ?? null };
    if (section === 'verification') return { row: detail.row, verification: detail.verification };
    if (section === 'closure-readiness') return { row: detail.row, readiness: detail.readiness };
    if (section === 'sync-log') return { rows: detail.syncLog };
    if (section === 'history') return { rows: detail.history };
    return detail;
  }

  regulatoryActionSyncLog(scope: Scope, actionLinkId: string, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.action.sync_log.view');
    return this.db.many<Row>(this.db.from('regulatory_action_sync_events').select('*').eq('company_id', scope.companyId).eq('action_link_id', actionLinkId).order('synced_at', { ascending: false }).limit(100)).then((rows) => ({ rows, summary: { total: rows.length, byStatus: this.groupRows(rows, 'sync_status') } }));
  }

  async regulatoryCapaPackages(scope: Scope, query: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, query.viewPermission ?? 'regulatory.capa.view');
    let q = this.db.from('regulatory_capa_packages').select('*').eq('company_id', scope.companyId).is('archived_at', null);
    q = this.applyRegulatoryActionScopeFilters(q, scope, query);
    if (query.search) q = q.or(`capa_package_title.ilike.%${query.search}%,capa_package_code.ilike.%${query.search}%`);
    if (query.packageStatus) q = q.eq('package_status', query.packageStatus);
    const rows = await this.db.many<Row>(q.order('updated_at', { ascending: false }).limit(Math.min(Number(query.limit ?? 100), 1000)));
    return { rows, total: rows.length, summary: { totalPackages: rows.length, byStatus: this.groupRows(rows, 'package_status'), byType: this.groupRows(rows, 'capa_package_type'), readyForClosure: rows.filter((row) => row.closure_readiness_status === 'Ready for Gap Closure').length } };
  }

  async createRegulatoryCapaPackage(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.capa.create');
    const payload = {
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: dto.siteId ?? dto.site_id ?? scope.selectedSiteId ?? null,
      department_id: dto.departmentId ?? dto.department_id ?? null,
      unit_id: dto.unitId ?? dto.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? null,
      equipment_id: dto.equipmentId ?? dto.equipment_id ?? null,
      capa_package_code: dto.capaPackageCode ?? dto.capa_package_code ?? await this.nextRegulatoryCode(scope, 'regulatory_capa_packages', 'capa_package_code', 'RCAPA'),
      capa_package_title: dto.capaPackageTitle ?? dto.capa_package_title ?? dto.title ?? 'Regulatory CAPA package',
      capa_package_type: dto.capaPackageType ?? dto.capa_package_type ?? 'Regulatory Compliance CAPA',
      package_status: dto.packageStatus ?? dto.package_status ?? 'Open',
      closure_readiness_status: 'Not Ready',
      verification_status: dto.verificationRequired ?? dto.verification_required ? 'Required' : 'Not Required',
      effectiveness_status: dto.effectivenessRequired ?? dto.effectiveness_required ? 'Required' : 'Not Required',
      criticality: dto.criticality ?? null,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? null,
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id ?? null,
      verifier_user_id: dto.verifierUserId ?? dto.verifier_user_id ?? null,
      linked_audit_capa_id: dto.linkedAuditCapaId ?? dto.linked_audit_capa_id ?? dto.auditCapaId ?? dto.audit_capa_id ?? null,
      evidence_required: Boolean(dto.evidenceRequired ?? dto.evidence_required ?? false),
      verification_required: Boolean(dto.verificationRequired ?? dto.verification_required ?? false),
      effectiveness_required: Boolean(dto.effectivenessRequired ?? dto.effectiveness_required ?? false),
      due_date: dto.dueDate ?? dto.due_date ?? null,
      effectiveness_due_date: dto.effectivenessDueDate ?? dto.effectiveness_due_date ?? null,
      notes: dto.notes ?? null,
      created_by: userId,
      updated_by: userId
    };
    const row = await this.db.single<Row>(this.db.from('regulatory_capa_packages').insert(payload).select().single());
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory CAPA package created', null, row, String(dto.reason ?? 'Regulatory CAPA package foundation created'), { capaPackageId: row.id });
    if (dto.source) await this.addRegulatoryCapaPackageSource(userId, scope, row.id, dto.source, [...permissions, 'regulatory.capa.add_source']).catch(() => null);
    return this.getRegulatoryCapaPackage(scope, row.id, permissions, true);
  }

  async getRegulatoryCapaPackage(scope: Scope, capaPackageId: string, permissions: string[] = [], includeRelated = false) {
    this.requirePermission(permissions, 'regulatory.capa.view');
    const row = await this.db.single<Row>(this.db.from('regulatory_capa_packages').select('*').eq('company_id', scope.companyId).eq('id', capaPackageId).maybeSingle());
    if (!row) throw new NotFoundException('Regulatory CAPA package not found.');
    if (!this.canAccessSite(scope, row.site_id)) throw new ForbiddenException('Regulatory CAPA package is outside selected site access.');
    if (!includeRelated) return row;
    const [sources, actions, readiness, verification, effectiveness, history] = await Promise.all([
      this.db.many<Row>(this.db.from('regulatory_capa_package_sources').select('*').eq('company_id', scope.companyId).eq('capa_package_id', capaPackageId).is('removed_at', null).order('linked_at', { ascending: false })).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_capa_package_actions').select('*').eq('company_id', scope.companyId).eq('capa_package_id', capaPackageId).is('removed_at', null).order('linked_at', { ascending: false })).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_action_closure_readiness').select('*').eq('company_id', scope.companyId).eq('capa_package_id', capaPackageId).order('checked_at', { ascending: false }).limit(20)).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_action_verification_foundation').select('*').eq('company_id', scope.companyId).eq('capa_package_id', capaPackageId).order('created_at', { ascending: false }).limit(20)).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_action_effectiveness_foundation').select('*').eq('company_id', scope.companyId).eq('capa_package_id', capaPackageId).order('created_at', { ascending: false }).limit(20)).catch(() => []),
      this.regulatoryActionHistory(scope, { capaPackageId }, permissions).catch(() => ({ rows: [] }))
    ]);
    return { package: row, sources, actions, readiness, verification, effectiveness, history: history.rows ?? [], permissions: this.regulatoryActionPermissionSummary(permissions) };
  }

  async updateRegulatoryCapaPackage(userId: string, scope: Scope, capaPackageId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.capa.edit');
    const before = await this.getRegulatoryCapaPackage(scope, capaPackageId, permissions) as Row;
    if (before.archived_at || before.package_status === 'Closed Foundation') throw new BadRequestException('Closed or archived CAPA packages are read-only unless reopened.');
    const patch = this.pickMapped(dto, { capaPackageTitle: 'capa_package_title', capa_package_title: 'capa_package_title', capaPackageType: 'capa_package_type', capa_package_type: 'capa_package_type', packageStatus: 'package_status', package_status: 'package_status', ownerUserId: 'owner_user_id', owner_user_id: 'owner_user_id', reviewerUserId: 'reviewer_user_id', reviewer_user_id: 'reviewer_user_id', verifierUserId: 'verifier_user_id', verifier_user_id: 'verifier_user_id', dueDate: 'due_date', due_date: 'due_date', effectivenessDueDate: 'effectiveness_due_date', effectiveness_due_date: 'effectiveness_due_date', notes: 'notes', criticality: 'criticality' });
    const row = await this.db.single<Row>(this.db.from('regulatory_capa_packages').update({ ...patch, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', capaPackageId).select().single());
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory CAPA package updated', before, row, String(dto.reason ?? 'Regulatory CAPA package updated'), { capaPackageId });
    return this.getRegulatoryCapaPackage(scope, capaPackageId, permissions, true);
  }

  async addRegulatoryCapaPackageSource(userId: string, scope: Scope, capaPackageId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.capa.add_source');
    const pkg = await this.getRegulatoryCapaPackage(scope, capaPackageId, [...permissions, 'regulatory.capa.view']) as Row;
    const source: Row = await this.resolveRegulatoryActionSource(scope, dto.sourceType ?? dto.source_type ?? 'Manual Regulatory Action Source', dto);
    const row = await this.db.single<Row>(this.db.from('regulatory_capa_package_sources').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: source.site_id ?? pkg.site_id ?? null, capa_package_id: capaPackageId, source_type: source.source_type, regulatory_item_id: source.regulatory_item_id ?? null, obligation_id: source.obligation_id ?? null, applicability_gap_id: source.applicability_gap_id ?? null, obligation_gap_id: source.obligation_gap_id ?? null, compliance_gap_id: source.compliance_gap_id ?? null, evidence_gap_id: source.evidence_gap_id ?? null, audit_mapping_gap_id: source.audit_mapping_gap_id ?? null, source_snapshot_json: source.source_snapshot_json, linked_by: userId }).select().single());
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory CAPA package source added', pkg, row, String(dto.reason ?? 'Source added to CAPA package'), { capaPackageId, sourceId: row.id });
    return row;
  }

  async addRegulatoryCapaPackageAction(userId: string, scope: Scope, capaPackageId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.capa.add_action');
    const pkg = await this.getRegulatoryCapaPackage(scope, capaPackageId, [...permissions, 'regulatory.capa.view']) as Row;
    const link = await this.getRegulatoryActionLink(scope, dto.actionLinkId ?? dto.action_link_id, [...permissions, 'regulatory.action.view']) as Row;
    const row = await this.db.single<Row>(this.db.from('regulatory_capa_package_actions').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: link.site_id ?? pkg.site_id ?? null, capa_package_id: capaPackageId, action_link_id: link.id, universal_action_id: link.universal_action_id ?? null, audit_capa_action_id: link.audit_capa_action_id ?? null, action_role: dto.actionRole ?? dto.action_role ?? link.regulatory_action_type ?? 'Corrective Action', action_status: link.action_status, linked_by: userId }).select().single());
    await this.db.single(this.db.from('regulatory_action_links').update({ capa_package_id: capaPackageId, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', link.id).select('id').single()).catch(() => null);
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory CAPA package action added', pkg, row, String(dto.reason ?? 'Action linked to CAPA package'), { capaPackageId, actionLinkId: link.id });
    return row;
  }

  async removeRegulatoryCapaPackageAction(userId: string, scope: Scope, capaPackageId: string, actionLinkId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.capa.add_action');
    const reason = String(dto.reason ?? '').trim();
    if (!reason) throw new BadRequestException('Remove reason is required.');
    const before = await this.db.single<Row>(this.db.from('regulatory_capa_package_actions').select('*').eq('company_id', scope.companyId).eq('capa_package_id', capaPackageId).eq('action_link_id', actionLinkId).maybeSingle());
    if (!before) throw new NotFoundException('CAPA package action link not found.');
    const row = await this.db.single<Row>(this.db.from('regulatory_capa_package_actions').update({ removed_by: userId, removed_at: new Date().toISOString(), remove_reason: reason }).eq('company_id', scope.companyId).eq('id', before.id).select().single());
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory CAPA package action removed', before, row, reason, { capaPackageId, actionLinkId });
    return row;
  }

  async checkRegulatoryCapaPackageClosureReadiness(userId: string, scope: Scope, capaPackageId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.closure_readiness.check');
    const detail = await this.getRegulatoryCapaPackage(scope, capaPackageId, [...permissions, 'regulatory.capa.view'], true) as Row;
    const readiness = this.calculateCapaClosureReadiness(detail.package, detail.actions ?? [], await this.settings(scope));
    const row = await this.db.single<Row>(this.db.from('regulatory_capa_packages').update({ closure_readiness_status: readiness.status, readiness_trace_json: readiness.trace, action_summary_json: readiness.actionSummary, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', capaPackageId).select().single());
    await this.db.single(this.db.from('regulatory_action_closure_readiness').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, capa_package_id: capaPackageId, source_type: 'Regulatory CAPA Package', source_record_id: capaPackageId, readiness_status: readiness.status, readiness_trace_json: readiness.trace, blocking_reasons_json: readiness.blockers, checked_by: userId }).select('id').single()).catch(() => null);
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory CAPA package closure readiness checked', detail.package, row, String(dto.reason ?? 'CAPA closure readiness checked'), { capaPackageId });
    return { package: row, readiness };
  }

  async submitRegulatoryCapaPackageVerification(userId: string, scope: Scope, capaPackageId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.verification.submit');
    const before = await this.getRegulatoryCapaPackage(scope, capaPackageId, permissions) as Row;
    const row = await this.db.single<Row>(this.db.from('regulatory_capa_packages').update({ verification_status: 'Verification Passed', verifier_user_id: userId, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', capaPackageId).select().single());
    await this.db.single(this.db.from('regulatory_action_verification_foundation').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, capa_package_id: capaPackageId, verification_status: 'Verification Passed', verification_comment: dto.comment ?? null, verification_basis_foundation: dto.basis ?? null, verified_by: userId, verified_at: new Date().toISOString(), evidence_link_id: dto.evidenceLinkId ?? dto.evidence_link_id ?? null }).select('id').single()).catch(() => null);
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory CAPA package verification submitted', before, row, String(dto.reason ?? 'CAPA verification submitted'), { capaPackageId });
    return this.checkRegulatoryCapaPackageClosureReadiness(userId, scope, capaPackageId, { reason: 'Verification updated package readiness' }, [...permissions, 'regulatory.action.closure_readiness.check']);
  }

  async submitRegulatoryCapaPackageEffectiveness(userId: string, scope: Scope, capaPackageId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.effectiveness.submit');
    const before = await this.getRegulatoryCapaPackage(scope, capaPackageId, permissions) as Row;
    const status = dto.decision === 'fail' || dto.effectivenessStatus === 'Effectiveness Failed' ? 'Effectiveness Failed' : 'Effectiveness Passed';
    if (status === 'Effectiveness Failed' && !String(dto.reason ?? dto.failedReason ?? '').trim()) throw new BadRequestException('Effectiveness failure requires a reason.');
    const row = await this.db.single<Row>(this.db.from('regulatory_capa_packages').update({ effectiveness_status: status, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', capaPackageId).select().single());
    await this.db.single(this.db.from('regulatory_action_effectiveness_foundation').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, capa_package_id: capaPackageId, effectiveness_status: status, effectiveness_due_date: dto.effectivenessDueDate ?? dto.effectiveness_due_date ?? row.effectiveness_due_date ?? null, effectiveness_comment: dto.comment ?? null, effectiveness_basis_foundation: dto.basis ?? null, checked_by: userId, checked_at: new Date().toISOString(), failed_reason: dto.failedReason ?? dto.reason ?? null, next_check_date: dto.nextCheckDate ?? dto.next_check_date ?? null }).select('id').single()).catch(() => null);
    await this.writeRegulatoryActionMutation(scope, userId, `Regulatory CAPA package ${status.toLowerCase()}`, before, row, String(dto.reason ?? status), { capaPackageId });
    return this.checkRegulatoryCapaPackageClosureReadiness(userId, scope, capaPackageId, { reason: 'Effectiveness updated package readiness' }, [...permissions, 'regulatory.action.closure_readiness.check']);
  }

  async closeRegulatoryCapaPackageFoundation(userId: string, scope: Scope, capaPackageId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.capa.close_foundation');
    const readiness = await this.checkRegulatoryCapaPackageClosureReadiness(userId, scope, capaPackageId, { reason: 'Closure gate check' }, [...permissions, 'regulatory.action.closure_readiness.check']) as Row;
    if (readiness.readiness?.status !== 'Ready for Gap Closure' && !dto.waiverReason) throw new BadRequestException('CAPA package is not ready for closure. Provide an authorized waiver reason if policy allows.');
    const before = await this.getRegulatoryCapaPackage(scope, capaPackageId, permissions) as Row;
    const row = await this.db.single<Row>(this.db.from('regulatory_capa_packages').update({ package_status: 'Closed Foundation', closure_readiness_status: readiness.readiness?.status ?? 'Ready with Waiver', closed_by: userId, closed_at: new Date().toISOString(), closure_note: dto.closureNote ?? dto.waiverReason ?? null, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', capaPackageId).select().single());
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory CAPA package closed foundation', before, row, String(dto.reason ?? dto.closureNote ?? 'CAPA package foundation closed'), { capaPackageId });
    return row;
  }

  async reopenRegulatoryCapaPackage(userId: string, scope: Scope, capaPackageId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.capa.reopen');
    const reason = String(dto.reason ?? '').trim();
    if (!reason) throw new BadRequestException('Reopen reason is required.');
    const before = await this.getRegulatoryCapaPackage(scope, capaPackageId, permissions) as Row;
    const row = await this.db.single<Row>(this.db.from('regulatory_capa_packages').update({ package_status: 'Reopened', closed_by: null, closed_at: null, closure_note: reason, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', capaPackageId).select().single());
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory CAPA package reopened', before, row, reason, { capaPackageId });
    return row;
  }

  async archiveRegulatoryCapaPackage(userId: string, scope: Scope, capaPackageId: string, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.capa.archive');
    const reason = String(dto.reason ?? '').trim();
    if (!reason) throw new BadRequestException('Archive reason is required.');
    const before = await this.getRegulatoryCapaPackage(scope, capaPackageId, permissions) as Row;
    const row = await this.db.single<Row>(this.db.from('regulatory_capa_packages').update({ package_status: 'Archived', archived_at: new Date().toISOString(), archived_by: userId, archive_reason: reason, updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', capaPackageId).select().single());
    await this.writeRegulatoryActionMutation(scope, userId, 'Regulatory CAPA package archived', before, row, reason, { capaPackageId });
    return row;
  }

  async regulatoryCapaPackageSection(scope: Scope, capaPackageId: string, section: string, permissions: string[] = []) {
    const detail = await this.getRegulatoryCapaPackage(scope, capaPackageId, permissions, true) as Row;
    if (section === 'sources') return { package: detail.package, rows: detail.sources };
    if (section === 'actions') return { package: detail.package, rows: detail.actions };
    if (section === 'evidence') return { package: detail.package, evidenceRequired: detail.package?.evidence_required, rows: [] };
    if (section === 'verification') return { package: detail.package, rows: detail.verification };
    if (section === 'effectiveness') return { package: detail.package, rows: detail.effectiveness };
    if (section === 'closure-readiness') return { package: detail.package, rows: detail.readiness };
    if (section === 'history') return { package: detail.package, rows: detail.history };
    return detail;
  }

  regulatoryActionHistory(scope: Scope, query: Row = {}, permissions: string[] = []) {
    this.requirePermission(permissions, 'regulatory.action.history.view');
    let q = this.db.from('regulatory_action_history_events').select('*').eq('company_id', scope.companyId);
    q = this.applyRegulatoryActionScopeFilters(q, scope, query);
    if (query.actionLinkId) q = q.eq('action_link_id', query.actionLinkId);
    if (query.capaPackageId) q = q.eq('capa_package_id', query.capaPackageId);
    if (query.sourceType) q = q.eq('source_type', query.sourceType);
    return this.db.many<Row>(q.order('created_at', { ascending: false }).limit(Math.min(Number(query.limit ?? 100), 500))).then((rows) => ({ rows, summary: { totalEvents: rows.length, byType: this.groupRows(rows, 'event_type'), bySource: this.groupRows(rows, 'source_type') } }));
  }

  regulatoryActionSettings(scope: Scope) {
    return this.settings(scope);
  }

  updateRegulatoryActionSettings(userId: string, scope: Scope, dto: Row, permissions: string[]) {
    this.requirePermission(permissions, 'regulatory.action.settings.edit');
    return this.updateSettings(userId, scope, dto, [...permissions, 'regulatory.settings.edit']);
  }

  sourceRegulatoryActions(scope: Scope, sourceType: string, sourceId: string, query: Row = {}, permissions: string[] = []) {
    return this.regulatoryActionLinks(scope, { ...query, ...this.sourceInputForRegulatoryAction(sourceType, sourceId), viewPermission: 'regulatory.action.view' }, permissions);
  }

  createSourceRegulatoryAction(userId: string, scope: Scope, sourceType: string, sourceId: string, dto: Row, permissions: string[]) {
    return this.createRegulatoryAction(userId, scope, { ...dto, sourceType, sourceRecordId: sourceId, ...this.sourceInputForRegulatoryAction(sourceType, sourceId) }, permissions);
  }

  sourceRegulatoryActionClosureReadiness(scope: Scope, sourceType: string, sourceId: string, query: Row = {}, permissions: string[] = []) {
    return this.sourceRegulatoryActions(scope, sourceType, sourceId, query, permissions).then((data) => ({ sourceType, sourceId, summary: data.summary, rows: data.rows?.map((row: Row) => ({ id: row.id, title: row.action_link_title, closureReadinessStatus: row.closure_readiness_status, blockers: this.calculateActionClosureReadiness(row, {}).blockers })) ?? [] }));
  }

  actionEngineRegulatoryLinks(scope: Scope, actionId: string, permissions: string[] = []) {
    return this.regulatoryActionLinks(scope, { universalActionId: actionId, viewPermission: 'regulatory.action.view', limit: 500 }, permissions);
  }

  actionEngineRegulatorySource(scope: Scope, actionId: string, permissions: string[] = []) {
    return this.actionEngineRegulatoryLinks(scope, actionId, permissions).then((data) => ({ actionId, sources: data.rows?.map((row: Row) => row.source_snapshot_json) ?? [], rows: data.rows }));
  }

  actionEngineRegulatoryReadiness(scope: Scope, actionId: string, permissions: string[] = []) {
    return this.actionEngineRegulatoryLinks(scope, actionId, permissions).then((data) => ({ actionId, summary: data.summary, ready: (data.rows ?? []).every((row: Row) => row.closure_readiness_status === 'Ready for Gap Closure') }));
  }

  auditCapaRegulatoryLinks(scope: Scope, capaId: string, permissions: string[] = []) {
    return this.regulatoryActionLinks(scope, { auditCapaId: capaId, viewPermission: 'regulatory.action.view', limit: 500 }, permissions);
  }

  auditCapaRegulatoryReadiness(scope: Scope, capaId: string, permissions: string[] = []) {
    return this.auditCapaRegulatoryLinks(scope, capaId, permissions).then((data) => ({ auditCapaId: capaId, summary: data.summary, ready: (data.rows ?? []).every((row: Row) => row.closure_readiness_status === 'Ready for Gap Closure') }));
  }

  private applyRegulatoryActionScopeFilters(q: any, scope: Scope, query: Row = {}) {
    if (query.siteId) q = q.eq('site_id', query.siteId);
    else if (scope.selectedSiteId && !scope.corporateView) q = q.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    else if (!scope.corporateView && scope.siteIds?.length) q = q.or(`site_id.is.null,site_id.in.(${scope.siteIds.join(',')})`);
    if (query.unitId) q = q.eq('unit_id', query.unitId);
    if (query.areaId) q = q.eq('area_id', query.areaId);
    if (query.equipmentId) q = q.eq('equipment_id', query.equipmentId);
    if (query.regulatoryItemId) q = q.eq('regulatory_item_id', query.regulatoryItemId);
    if (query.obligationId) q = q.eq('obligation_id', query.obligationId);
    if (query.applicabilityGapId) q = q.eq('applicability_gap_id', query.applicabilityGapId);
    if (query.obligationGapId) q = q.eq('obligation_gap_id', query.obligationGapId);
    if (query.complianceGapId) q = q.eq('compliance_gap_id', query.complianceGapId);
    if (query.evidenceGapId) q = q.eq('evidence_gap_id', query.evidenceGapId);
    if (query.auditMappingGapId) q = q.eq('audit_mapping_gap_id', query.auditMappingGapId);
    if (query.universalActionId) q = q.eq('universal_action_id', query.universalActionId);
    if (query.auditCapaId) q = q.eq('audit_capa_id', query.auditCapaId);
    return q;
  }

  private matchesRegulatoryActionView(row: Row, view?: string) {
    if (!view) return true;
    if (view === 'open') return !['Action Completed', 'Action Verified', 'Action Archived', 'Action Cancelled'].includes(row.action_status);
    if (view === 'overdue') return this.isRegulatoryActionOverdue(row);
    if (view === 'completed') return ['Action Completed', 'Action Verified'].includes(row.action_status);
    if (view === 'pending-verification') return row.verification_status === 'Pending Verification' || row.action_status === 'Action Pending Verification' || row.verification_status === 'Required';
    if (view === 'verification-failed') return row.verification_status === 'Verification Failed';
    if (view === 'effectiveness-pending') return row.effectiveness_status === 'Effectiveness Pending' || row.effectiveness_status === 'Required';
    if (view === 'ineffective') return row.effectiveness_status === 'Effectiveness Failed' || row.action_status === 'Action Ineffective';
    if (view === 'ready-for-gap-closure') return row.closure_readiness_status === 'Ready for Gap Closure';
    if (view === 'blocking-compliance') return row.closure_readiness_status === 'Blocking Compliance';
    if (view === 'stale-sync') return row.sync_status === 'Stale Sync' || row.stale_status === 'Stale';
    if (view === 'escalated') return row.closure_readiness_status === 'Blocking Compliance';
    return true;
  }

  private async normalizeRegulatoryActionInput(userId: string, scope: Scope, dto: Row, settings: Row) {
    const sourceType = dto.sourceType ?? dto.source_type ?? 'Manual Regulatory Action Source';
    const source: Row = await this.resolveRegulatoryActionSource(scope, sourceType, dto);
    const actionMode = dto.actionMode ?? dto.action_mode ?? 'Manual Action Placeholder Foundation';
    if (!regulatoryActionModes.includes(actionMode)) throw new BadRequestException('Action mode is not valid.');
    if (actionMode === 'Manual Action Placeholder Foundation' && settings.allow_manual_action_placeholder_foundation === false) throw new BadRequestException('Manual regulatory action placeholder foundation is disabled by policy.');
    const title = String(dto.actionTitle ?? dto.action_link_title ?? dto.title ?? source.source_snapshot_json?.title ?? '').trim();
    if (!title) throw new BadRequestException('Action title is required.');
    const actionType = dto.regulatoryActionType ?? dto.regulatory_action_type ?? dto.actionType ?? 'Corrective Action';
    if (!regulatoryActionTypes.includes(actionType)) throw new BadRequestException('Regulatory action type is not valid.');
    const owner = dto.ownerUserId ?? dto.owner_user_id ?? dto.ownerId ?? null;
    if (settings.require_owner_for_regulatory_action !== false && !owner) throw new BadRequestException('Owner is required for regulatory action links by policy.');
    const dueDate = dto.dueDate ?? dto.due_date ?? null;
    if (settings.require_due_date_for_regulatory_action !== false && !dueDate) throw new BadRequestException('Due date is required for regulatory action links by policy.');
    const criticality = dto.criticality ?? source.source_snapshot_json?.criticality ?? source.source_snapshot_json?.severity ?? null;
    const critical = this.isCritical(criticality) || this.isCritical(dto.actionPriority ?? dto.action_priority);
    const verificationRequired = Boolean(dto.verificationRequired ?? dto.verification_required ?? (critical && settings.require_verification_for_critical_action !== false));
    const effectivenessRequired = Boolean(dto.effectivenessRequired ?? dto.effectiveness_required ?? (critical && settings.require_effectiveness_for_critical_action === true));
    return {
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: dto.siteId ?? dto.site_id ?? source.site_id ?? scope.selectedSiteId ?? null,
      department_id: dto.departmentId ?? dto.department_id ?? null,
      unit_id: dto.unitId ?? dto.unit_id ?? source.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? source.area_id ?? null,
      equipment_id: dto.equipmentId ?? dto.equipment_id ?? source.equipment_id ?? null,
      action_link_code: dto.actionLinkCode ?? dto.action_link_code ?? await this.nextRegulatoryCode(scope, 'regulatory_action_links', 'action_link_code', 'RACT'),
      action_link_title: title,
      source_type: source.source_type,
      regulatory_item_id: source.regulatory_item_id ?? null,
      obligation_id: source.obligation_id ?? null,
      applicability_gap_id: source.applicability_gap_id ?? null,
      obligation_gap_id: source.obligation_gap_id ?? null,
      compliance_gap_id: source.compliance_gap_id ?? null,
      evidence_gap_id: source.evidence_gap_id ?? null,
      audit_mapping_gap_id: source.audit_mapping_gap_id ?? null,
      compliance_assessment_id: source.compliance_assessment_id ?? null,
      evidence_link_id: source.evidence_link_id ?? null,
      audit_mapping_id: source.audit_mapping_id ?? null,
      source_snapshot_json: source.source_snapshot_json,
      action_mode: actionMode,
      regulatory_action_type: actionType,
      action_classification: dto.actionClassification ?? dto.action_classification ?? null,
      universal_action_id: dto.universalActionId ?? dto.universal_action_id ?? null,
      audit_capa_id: dto.auditCapaId ?? dto.audit_capa_id ?? null,
      audit_capa_action_id: dto.auditCapaActionId ?? dto.audit_capa_action_id ?? null,
      capa_package_id: dto.capaPackageId ?? dto.capa_package_id ?? null,
      action_status: dto.actionStatus ?? dto.action_status ?? 'Action Not Started',
      action_priority: dto.actionPriority ?? dto.action_priority ?? (critical ? 'Critical' : 'Medium'),
      sync_status: 'Not Synced',
      closure_readiness_status: 'Not Ready',
      verification_status: verificationRequired ? 'Required' : 'Not Required',
      effectiveness_status: effectivenessRequired ? 'Required' : 'Not Required',
      stale_status: 'Current',
      compliance_impact: dto.complianceImpact ?? dto.compliance_impact ?? null,
      criticality,
      owner_user_id: owner,
      responsible_department_id: dto.responsibleDepartmentId ?? dto.responsible_department_id ?? null,
      reviewer_user_id: dto.reviewerUserId ?? dto.reviewer_user_id ?? null,
      verifier_user_id: dto.verifierUserId ?? dto.verifier_user_id ?? null,
      due_date: dueDate,
      effectiveness_due_date: dto.effectivenessDueDate ?? dto.effectiveness_due_date ?? null,
      evidence_required: Boolean(dto.evidenceRequired ?? dto.evidence_required ?? verificationRequired),
      verification_required: verificationRequired,
      effectiveness_required: effectivenessRequired,
      acceptance_criteria_foundation: dto.acceptanceCriteriaFoundation ?? dto.acceptance_criteria_foundation ?? null,
      root_cause_foundation: dto.rootCauseFoundation ?? dto.root_cause_foundation ?? null,
      expected_outcome: dto.expectedOutcome ?? dto.expected_outcome ?? null,
      action_reason: dto.actionReason ?? dto.action_reason ?? dto.reason ?? null,
      linked_by: userId,
      created_by: userId,
      updated_by: userId,
      source_record_id: this.sourceInputRecordId(sourceType, dto)
    };
  }

  private async resolveRegulatoryActionSource(scope: Scope, sourceType: string, dto: Row): Promise<Row> {
    const id = this.sourceInputRecordId(sourceType, dto);
    if (!id && sourceType !== 'Manual Regulatory Action Source') throw new BadRequestException('Action source record is required.');
    const read = async (table: string, idValue: string, label: string) => {
      const row = await this.db.single<Row>(this.db.from(table).select('*').eq('company_id', scope.companyId).eq('id', idValue).maybeSingle());
      if (!row) throw new NotFoundException(`${label} source was not found.`);
      if (!this.canAccessSite(scope, row.site_id)) throw new ForbiddenException(`${label} source is outside selected site access.`);
      return row;
    };
    if (sourceType === 'Regulatory Item') {
      const row = await read('regulatory_register_items', id, 'Regulatory item');
      return { source_type: sourceType, regulatory_item_id: row.id, site_id: row.site_id, unit_id: row.unit_id, area_id: row.area_id, equipment_id: row.equipment_id, source_snapshot_json: this.regulatoryActionSourceSnapshot(row, 'Regulatory Item') };
    }
    if (sourceType === 'Obligation') {
      const row = await read('regulatory_obligations', id, 'Obligation');
      return { source_type: sourceType, regulatory_item_id: row.regulatory_item_id, obligation_id: row.id, site_id: row.site_id, unit_id: row.unit_id, area_id: row.area_id, equipment_id: row.equipment_id, source_snapshot_json: this.regulatoryActionSourceSnapshot(row, 'Obligation') };
    }
    const gapMap: Row = {
      'Applicability Gap': ['regulatory_applicability_gaps', 'applicability_gap_id'],
      'Obligation Gap': ['regulatory_obligation_gaps', 'obligation_gap_id'],
      'Compliance Gap': ['regulatory_compliance_gaps', 'compliance_gap_id'],
      'Evidence Gap': ['regulatory_evidence_gaps', 'evidence_gap_id'],
      'Audit Mapping Gap': ['regulatory_audit_mapping_gaps', 'audit_mapping_gap_id']
    };
    if (gapMap[sourceType]) {
      const [table, key] = gapMap[sourceType];
      const row = await read(table, id, sourceType);
      return { source_type: sourceType, [key]: row.id, regulatory_item_id: row.regulatory_item_id ?? null, obligation_id: row.obligation_id ?? null, site_id: row.site_id, unit_id: row.unit_id, area_id: row.area_id, equipment_id: row.equipment_id, source_snapshot_json: this.regulatoryActionSourceSnapshot(row, sourceType) };
    }
    if (sourceType === 'Compliance Assessment') {
      const row = await read('regulatory_compliance_assessments', id, 'Compliance assessment');
      return { source_type: sourceType, compliance_assessment_id: row.id, regulatory_item_id: row.regulatory_item_id ?? null, obligation_id: row.obligation_id ?? null, site_id: row.site_id, unit_id: row.unit_id, area_id: row.area_id, equipment_id: row.equipment_id, source_snapshot_json: this.regulatoryActionSourceSnapshot(row, sourceType) };
    }
    if (sourceType === 'Evidence Link') {
      const row = await read('regulatory_evidence_links', id, 'Evidence link');
      return { source_type: sourceType, evidence_link_id: row.id, regulatory_item_id: row.regulatory_item_id ?? null, obligation_id: row.obligation_id ?? null, site_id: row.site_id, source_snapshot_json: this.regulatoryActionSourceSnapshot(row, sourceType) };
    }
    if (sourceType === 'Audit Mapping') {
      const row = await read('regulatory_audit_mappings', id, 'Audit mapping');
      return { source_type: sourceType, audit_mapping_id: row.id, regulatory_item_id: row.regulatory_item_id ?? null, obligation_id: row.obligation_id ?? null, site_id: row.site_id, source_snapshot_json: this.regulatoryActionSourceSnapshot(row, sourceType) };
    }
    return { source_type: 'Manual Regulatory Action Source', site_id: dto.siteId ?? dto.site_id ?? scope.selectedSiteId ?? null, source_snapshot_json: { title: dto.sourceTitle ?? dto.actionTitle ?? 'Manual regulatory action source', sourceType: 'Manual Regulatory Action Source', createdAt: new Date().toISOString() } };
  }

  private sourceInputRecordId(sourceType: string, dto: Row) {
    return dto.sourceRecordId ?? dto.source_record_id ?? dto.regulatoryItemId ?? dto.regulatory_item_id ?? dto.obligationId ?? dto.obligation_id ?? dto.gapId ?? dto.gap_id ?? dto.applicabilityGapId ?? dto.applicability_gap_id ?? dto.obligationGapId ?? dto.obligation_gap_id ?? dto.complianceGapId ?? dto.compliance_gap_id ?? dto.evidenceGapId ?? dto.evidence_gap_id ?? dto.auditMappingGapId ?? dto.audit_mapping_gap_id ?? dto.complianceAssessmentId ?? dto.compliance_assessment_id ?? dto.evidenceLinkId ?? dto.evidence_link_id ?? dto.auditMappingId ?? dto.audit_mapping_id ?? null;
  }

  private sourceInputForRegulatoryAction(sourceType: string, sourceId: string) {
    if (sourceType === 'Regulatory Item') return { regulatoryItemId: sourceId };
    if (sourceType === 'Obligation') return { obligationId: sourceId };
    if (sourceType === 'Applicability Gap') return { applicabilityGapId: sourceId };
    if (sourceType === 'Obligation Gap') return { obligationGapId: sourceId };
    if (sourceType === 'Compliance Gap') return { complianceGapId: sourceId };
    if (sourceType === 'Evidence Gap') return { evidenceGapId: sourceId };
    if (sourceType === 'Audit Mapping Gap') return { auditMappingGapId: sourceId };
    return { sourceRecordId: sourceId };
  }

  private regulatoryActionSourceRecordId(row: Row) {
    return row.regulatory_item_id ?? row.obligation_id ?? row.applicability_gap_id ?? row.obligation_gap_id ?? row.compliance_gap_id ?? row.evidence_gap_id ?? row.audit_mapping_gap_id ?? row.compliance_assessment_id ?? row.evidence_link_id ?? row.audit_mapping_id ?? row.id;
  }

  private regulatoryActionSourceSnapshot(row: Row, type: string): Row {
    return { id: row.id, type, title: row.title ?? row.requirement_title ?? row.obligation_title ?? row.gap_title ?? row.evidence_title ?? row.mapping_title ?? row.assessment_title ?? null, code: row.requirement_code ?? row.obligation_code ?? row.gap_code ?? row.evidence_code ?? row.mapping_code ?? null, status: row.register_status ?? row.obligation_status ?? row.gap_status ?? row.evidence_status ?? row.mapping_status ?? row.compliance_status ?? null, criticality: row.criticality ?? row.severity ?? row.gap_severity ?? null, siteId: row.site_id ?? null, snapshotAt: new Date().toISOString() };
  }

  private async assertUniversalActionAccessible(scope: Scope, actionId: string | null | undefined) {
    if (!actionId) throw new BadRequestException('Universal Action ID is required.');
    const row = await this.db.single<Row>(this.db.from('Action').select('*').eq('tenantId', scope.companyId).eq('id', actionId).maybeSingle());
    if (!row) throw new NotFoundException('Universal Action Engine record was not found.');
    if (!this.canAccessSite(scope, row.siteId)) throw new ForbiddenException('Universal Action is outside selected site access.');
    return row;
  }

  private async assertAuditCapaAccessible(scope: Scope, capaId: string | null | undefined) {
    if (!capaId) throw new BadRequestException('Audit CAPA ID is required.');
    const row = await this.db.single<Row>(this.db.from('audit_capa_packages').select('*').eq('company_id', scope.companyId).eq('id', capaId).maybeSingle()).catch(() => null);
    if (!row) throw new NotFoundException('Audit CAPA package was not found.');
    if (!this.canAccessSite(scope, row.site_id)) throw new ForbiddenException('Audit CAPA is outside selected site access.');
    return row;
  }

  private actionSnapshot(row: Row) {
    return { id: row.id, actionNumber: row.actionNumber, title: row.title, status: row.status, priority: row.priority, ownerUserId: row.assignedToId, dueDate: row.dueDate, evidenceRequired: row.evidenceRequired, verificationRequired: row.verificationRequired, updatedAt: row.updatedAt };
  }

  private auditCapaSnapshot(row: Row) {
    return { id: row.id, code: row.capa_code, title: row.capa_title, status: row.capa_status ?? row.package_status, ownerUserId: row.owner_user_id, dueDate: row.due_date ?? row.target_due_date, updatedAt: row.updated_at };
  }

  private mapUniversalActionStatus(status: string, dueDate?: string | null) {
    if (['CLOSED', 'COMPLETED'].includes(status)) return 'Action Completed';
    if (status === 'PENDING_VERIFICATION') return 'Action Pending Verification';
    if (status === 'IN_PROGRESS') return this.isPastDue(dueDate) ? 'Action Overdue' : 'Action In Progress';
    if (status === 'CANCELLED') return 'Action Cancelled';
    return this.isPastDue(dueDate) ? 'Action Overdue' : 'Action Not Started';
  }

  private mapAuditCapaStatus(status: string | undefined) {
    const value = String(status ?? '').toLowerCase();
    if (value.includes('closed') || value.includes('complete') || value.includes('verified')) return 'Action Completed';
    if (value.includes('progress')) return 'Action In Progress';
    if (value.includes('reopen')) return 'Action Reopened';
    if (value.includes('archive') || value.includes('cancel')) return 'Action Cancelled';
    return 'Action Not Started';
  }

  private toActionEnginePriority(priority: string) {
    if (['Critical', 'Safety-Critical', 'Environmental-Critical', 'PSM-Critical', 'Regulatory-Critical'].includes(priority)) return 'SAFETY_CRITICAL';
    if (priority === 'High') return 'HIGH';
    if (priority === 'Low') return 'LOW';
    return 'MEDIUM';
  }

  private calculateActionClosureReadiness(row: Row, settings: Row) {
    const blockers: string[] = [];
    if (['Stale Sync', 'Sync Failed', 'Action Engine Unavailable', 'Audit CAPA Unavailable'].includes(row.sync_status)) blockers.push('Current action/CAPA sync is stale or failed.');
    if (settings.require_owner_for_regulatory_action !== false && !row.owner_user_id) blockers.push('Action owner is missing.');
    if (settings.require_due_date_for_regulatory_action !== false && !row.due_date) blockers.push('Action due date is missing.');
    if (this.isRegulatoryActionOverdue(row)) blockers.push('Action is overdue.');
    if (!['Action Completed', 'Action Verified'].includes(row.action_status) && row.action_status !== 'Not Required') blockers.push('Action is not complete.');
    if (row.evidence_required && !row.source_snapshot_json?.evidence) blockers.push('Required evidence is not linked or synced.');
    if (row.verification_required && row.verification_status !== 'Verification Passed') blockers.push('Verification has not passed.');
    if (row.effectiveness_required && row.effectiveness_status !== 'Effectiveness Passed') blockers.push('Effectiveness has not passed.');
    const status = blockers.length ? blockers.some((item) => item.includes('overdue') || item.includes('failed') || item.includes('stale')) ? 'Blocking Compliance' : 'Not Ready' : 'Ready for Gap Closure';
    return { status, blockers, trace: { actionStatus: row.action_status, syncStatus: row.sync_status, verificationStatus: row.verification_status, effectivenessStatus: row.effectiveness_status, checkedAt: new Date().toISOString() } };
  }

  private calculateCapaClosureReadiness(pkg: Row, actions: Row[], settings: Row) {
    const blockers: string[] = [];
    if (!actions.length) blockers.push('CAPA package has no linked actions.');
    for (const action of actions) {
      if (!['Action Completed', 'Action Verified'].includes(action.action_status)) blockers.push(`Action ${action.action_link_id ?? action.id} is not complete.`);
    }
    if (pkg.verification_required && pkg.verification_status !== 'Verification Passed') blockers.push('CAPA package verification has not passed.');
    if (pkg.effectiveness_required && pkg.effectiveness_status !== 'Effectiveness Passed') blockers.push('CAPA package effectiveness has not passed.');
    const status = blockers.length ? 'Not Ready' : 'Ready for Gap Closure';
    return { status, blockers, trace: { actionCount: actions.length, settingsApplied: { requireAction: settings.require_action_for_non_compliance !== false }, checkedAt: new Date().toISOString() }, actionSummary: { total: actions.length, complete: actions.filter((row) => ['Action Completed', 'Action Verified'].includes(row.action_status)).length } };
  }

  private async regulatoryActionSourceGapRows(scope: Scope) {
    const [applicability, obligations, compliance, evidence, auditMapping] = await Promise.all([
      this.db.many<Row>(this.db.from('regulatory_applicability_gaps').select('*').eq('company_id', scope.companyId)).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_obligation_gaps').select('*').eq('company_id', scope.companyId)).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_compliance_gaps').select('*').eq('company_id', scope.companyId)).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_evidence_gaps').select('*').eq('company_id', scope.companyId)).catch(() => []),
      this.db.many<Row>(this.db.from('regulatory_audit_mapping_gaps').select('*').eq('company_id', scope.companyId)).catch(() => [])
    ]);
    return [...applicability, ...obligations, ...compliance, ...evidence, ...auditMapping].filter((row) => this.canAccessSite(scope, row.site_id));
  }

  private regulatoryActionSummaryFromRows(rows: Row[], packages: Row[] = [], gaps: Row[] = []) {
    const open = rows.filter((row) => this.matchesRegulatoryActionView(row, 'open'));
    return {
      totalRegulatoryActionLinks: rows.length,
      openActions: open.length,
      inProgressActions: rows.filter((row) => row.action_status === 'Action In Progress').length,
      overdueActions: rows.filter((row) => this.isRegulatoryActionOverdue(row)).length,
      completedActions: rows.filter((row) => ['Action Completed', 'Action Verified'].includes(row.action_status)).length,
      pendingVerification: rows.filter((row) => row.verification_status === 'Pending Verification' || row.verification_status === 'Required').length,
      verificationFailed: rows.filter((row) => row.verification_status === 'Verification Failed').length,
      effectivenessPending: rows.filter((row) => row.effectiveness_status === 'Effectiveness Pending' || row.effectiveness_status === 'Required').length,
      ineffectiveActions: rows.filter((row) => row.effectiveness_status === 'Effectiveness Failed').length,
      actionsWithoutOwner: rows.filter((row) => !row.owner_user_id).length,
      actionsWithoutDueDate: rows.filter((row) => !row.due_date).length,
      criticalActions: rows.filter((row) => this.isCritical(row.criticality) || this.isCritical(row.action_priority)).length,
      safetyCriticalActions: rows.filter((row) => row.action_priority === 'Safety-Critical').length,
      environmentalCriticalActions: rows.filter((row) => row.action_priority === 'Environmental-Critical').length,
      psmCriticalActions: rows.filter((row) => row.action_priority === 'PSM-Critical').length,
      regulatoryCriticalActions: rows.filter((row) => row.action_priority === 'Regulatory-Critical').length,
      complianceGapsWithActions: rows.filter((row) => row.compliance_gap_id).length,
      complianceGapsWithoutActions: gaps.filter((row) => row.assessment_id && !row.action_id && !rows.some((link) => link.compliance_gap_id === row.id)).length,
      evidenceGapsWithActions: rows.filter((row) => row.evidence_gap_id).length,
      evidenceGapsWithoutActions: gaps.filter((row) => row.requirement_id && !row.action_id && !rows.some((link) => link.evidence_gap_id === row.id)).length,
      auditMappingGapsWithActions: rows.filter((row) => row.audit_mapping_gap_id).length,
      auditMappingGapsWithoutActions: gaps.filter((row) => row.mapping_id && !row.action_foundation_id && !rows.some((link) => link.audit_mapping_gap_id === row.id)).length,
      applicabilityGapsWithActions: rows.filter((row) => row.applicability_gap_id).length,
      obligationGapsWithActions: rows.filter((row) => row.obligation_gap_id).length,
      capaPackagesFoundation: packages.length,
      linkedAuditCapa: rows.filter((row) => row.audit_capa_id || row.audit_capa_action_id).length,
      staleActionSync: rows.filter((row) => row.sync_status === 'Stale Sync' || row.stale_status === 'Stale').length,
      escalatedActions: rows.filter((row) => row.closure_readiness_status === 'Blocking Compliance').length,
      recentlyUpdatedActions: rows.filter((row) => this.withinDays(row.updated_at, 14)).length
    };
  }

  private isRegulatoryActionOverdue(row: Row) {
    return this.isPastDue(row.due_date) && !['Action Completed', 'Action Verified', 'Action Archived', 'Action Cancelled'].includes(row.action_status);
  }

  private isPastDue(value?: string | null) {
    if (!value) return false;
    return new Date(value).getTime() < Date.now();
  }

  private dueBucket(value: string | null | undefined, status: string) {
    if (['Action Completed', 'Action Verified'].includes(status)) return 'Completed';
    if (!value) return 'No Due Date';
    if (this.isPastDue(value)) return 'Overdue';
    if (this.withinFutureDays(value, 14)) return 'Due Soon';
    return 'Future';
  }

  private withinFutureDays(value: string | null | undefined, days: number) {
    if (!value) return false;
    const date = new Date(value).getTime();
    const max = Date.now() + days * 24 * 60 * 60 * 1000;
    return date <= max && date >= Date.now();
  }

  private async nextRegulatoryCode(scope: Scope, table: string, column: string, prefix: string) {
    const rows = await this.db.many<Row>(this.db.from(table).select(column).eq('company_id', scope.companyId).order('created_at', { ascending: false }).limit(1)).catch(() => []);
    const current = String(rows[0]?.[column] ?? '');
    const next = Number(current.match(/(\d+)$/)?.[1] ?? 0) + 1;
    return `${prefix}-${new Date().getFullYear()}-${String(next).padStart(6, '0')}`;
  }

  private regulatoryActionPermissionSummary(permissions: string[]) {
    return {
      canCreate: permissions.includes('regulatory.action.create') || permissions.includes('regulatory.manage'),
      canLinkExisting: permissions.includes('regulatory.action.link_existing') || permissions.includes('regulatory.manage'),
      canLinkAuditCapa: permissions.includes('regulatory.action.link_audit_capa') || permissions.includes('regulatory.manage'),
      canVerify: permissions.includes('regulatory.action.verification.submit') || permissions.includes('regulatory.manage'),
      disabledReasons: {
        create: 'Missing permission: regulatory.action.create',
        linkExisting: 'Missing permission: regulatory.action.link_existing',
        linkAuditCapa: 'Missing permission: regulatory.action.link_audit_capa',
        verify: 'Missing permission: regulatory.action.verification.submit'
      }
    };
  }

  private async writeRegulatoryActionMutation(scope: Scope, userId: string, title: string, before: Row | null, after: Row | null, reason: string, metadata: Row = {}) {
    const entityId = after?.id ?? before?.id ?? metadata.actionLinkId ?? metadata.capaPackageId ?? null;
    const audit = await this.audit.write({ tenantId: scope.companyId, actorId: userId, action: title, entityType: 'RegulatoryActionsCapa', ...(entityId ? { entityId } : {}), before: before ?? null, after: after ?? null, metadata: { reason, ...metadata, sourceModule: 'Regulatory Actions / CAPA' } }).catch(() => null);
    await this.db.single(this.db.from('regulatory_action_history_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: after?.site_id ?? before?.site_id ?? scope.selectedSiteId ?? null,
      unit_id: after?.unit_id ?? before?.unit_id ?? null,
      area_id: after?.area_id ?? before?.area_id ?? null,
      equipment_id: after?.equipment_id ?? before?.equipment_id ?? null,
      action_link_id: metadata.actionLinkId ?? after?.action_link_id ?? after?.id ?? before?.id ?? null,
      capa_package_id: metadata.capaPackageId ?? after?.capa_package_id ?? before?.capa_package_id ?? null,
      regulatory_item_id: after?.regulatory_item_id ?? before?.regulatory_item_id ?? null,
      obligation_id: after?.obligation_id ?? before?.obligation_id ?? null,
      source_type: after?.source_type ?? before?.source_type ?? null,
      source_record_id: after ? this.regulatoryActionSourceRecordId(after) : before ? this.regulatoryActionSourceRecordId(before) : null,
      event_type: title.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      event_title: title,
      event_description: reason,
      before_value_json: before ?? null,
      after_value_json: after ? { ...after, auditLogId: (audit as { id?: string } | null)?.id ?? null } : null,
      actor_user_id: userId,
      source_module: 'Regulatory Actions / CAPA'
    }).select('id').single()).catch(() => null);
  }

  private canAccessSite(scope: Scope, siteId?: string | null) {
    if (!siteId) return true;
    if (scope.corporateView || scope.isCompanyAdmin) return true;
    return (scope.siteIds ?? []).includes(siteId);
  }

  private requirePermission(permissions: string[], permission: string) {
    if (!permissions.includes(permission) && !permissions.includes('regulatory.manage') && !permissions.includes('regulatory:manage')) throw new ForbiddenException(`Missing permission: ${permission}`);
  }

  private isReadOnly(row: Row) {
    return Boolean(row.locked) || readOnlyStatuses.has(row.register_status);
  }

  private readOnlyReason(row: Row) {
    if (row.locked) return `Record is locked${row.lock_reason ? `: ${row.lock_reason}` : '.'}`;
    if (readOnlyStatuses.has(row.register_status)) return `${row.register_status} records are read-only unless controlled reopen/new-version permission is used.`;
    return null;
  }

  private async writeMutation(scope: Scope, userId: string, title: string, itemId: string | null, before: Row | null, after: Row | null, reason: string) {
    const auditInput: Parameters<AuditService['write']>[0] = { tenantId: scope.companyId, actorId: userId, action: title, entityType: 'RegulatoryRegister', before: before ?? null, after: after ?? null, metadata: { reason, sourceModule: 'Regulatory Register' } };
    if (itemId) auditInput.entityId = itemId;
    const audit = await this.audit.write(auditInput).catch(() => null);
    await this.db.single(this.db.from('regulatory_history_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: after?.site_id ?? before?.site_id ?? scope.selectedSiteId ?? null,
      unit_id: after?.unit_id ?? before?.unit_id ?? null,
      area_id: after?.area_id ?? before?.area_id ?? null,
      equipment_id: after?.equipment_id ?? before?.equipment_id ?? null,
      regulatory_item_id: itemId,
      event_type: title.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      event_title: title,
      event_description: reason,
      before_value_json: before ?? null,
      after_value_json: after ?? null,
      actor_user_id: userId,
      source_module: 'Regulatory Register',
      source_record_id: itemId,
      audit_log_id: (audit as { id?: string } | null)?.id ?? null
    }).select('id').single()).catch(() => null);
  }

  private async writeStatusHistory(scope: Scope, userId: string, id: string, statusType: string, before: Row, after: Row, reason: string) {
    await this.db.single(this.db.from('regulatory_item_status_history').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: after.site_id ?? before.site_id ?? null,
      regulatory_item_id: id,
      status_type: statusType,
      old_status: before.register_status ?? before.applicability_status ?? before.compliance_status ?? null,
      new_status: after.register_status ?? after.applicability_status ?? after.compliance_status ?? null,
      status_reason: reason,
      changed_by: userId
    }).select('id').single()).catch(() => null);
  }

  private linkSummary(rows: Row[]) {
    return {
      audit: rows.filter((row) => String(row.linked_module ?? '').includes('Audit')).length,
      evidence: rows.filter((row) => String(row.linked_module ?? '').includes('Evidence')).length,
      actions: rows.filter((row) => String(row.linked_module ?? '').includes('Action') || String(row.linked_module ?? '').includes('CAPA')).length,
      total: rows.length
    };
  }

  private async refreshLinkCounts(scope: Scope, id: string) {
    const links = await this.db.many<Row>(this.db.from('regulatory_item_links').select('linked_module').eq('company_id', scope.companyId).eq('regulatory_item_id', id).is('removed_at', null)).catch(() => []);
    await this.db.single(this.db.from('regulatory_register_items').update({
      linked_audit_count: links.filter((row) => String(row.linked_module ?? '').includes('Audit')).length,
      linked_evidence_count: links.filter((row) => String(row.linked_module ?? '').includes('Evidence')).length,
      linked_action_count: links.filter((row) => String(row.linked_module ?? '').includes('Action') || String(row.linked_module ?? '').includes('CAPA')).length,
      updated_at: new Date().toISOString()
    }).eq('company_id', scope.companyId).eq('id', id).select('id').single()).catch(() => null);
  }

  private pick(dto: Row, keys: string[]) {
    return keys.reduce<Row>((acc, key) => {
      if (dto[key] !== undefined) acc[key] = dto[key];
      return acc;
    }, {});
  }

  private pickMapped(dto: Row, map: Record<string, string>) {
    return Object.entries(map).reduce<Row>((acc, [inputKey, outputKey]) => {
      if (dto[inputKey] !== undefined) acc[outputKey] = dto[inputKey];
      return acc;
    }, {});
  }

  private async markAssessmentsStaleForItem(userId: string, scope: Scope, regulatoryItemId: string, reason: string) {
    const rows = await this.db.many<Row>(this.db.from('regulatory_applicability_assessments').select('*').eq('company_id', scope.companyId).eq('regulatory_item_id', regulatoryItemId).neq('assessment_status', 'Archived'));
    for (const before of rows) {
      if (!this.canAccessSite(scope, before.site_id)) continue;
      const row = await this.db.single<Row>(this.db.from('regulatory_applicability_assessments').update({ stale: true, stale_reason: reason, stale_at: new Date().toISOString(), applicability_status: 'Stale Applicability', updated_by: userId, updated_at: new Date().toISOString() }).eq('company_id', scope.companyId).eq('id', before.id).select().single());
      await this.db.single(this.db.from('regulatory_applicability_staleness_events').insert({ id: crypto.randomUUID(), company_id: scope.companyId, site_id: row.site_id ?? null, assessment_id: row.id, regulatory_item_id: regulatoryItemId, stale_reason: reason, source_change_type: 'Scope Changed', source_record_id: regulatoryItemId }).select('id').single()).catch(() => null);
      await this.writeApplicabilityMutation(scope, userId, 'Applicability marked stale', regulatoryItemId, before, row, reason);
    }
  }

  private async writeApplicabilityMutation(scope: Scope, userId: string, title: string, itemId: string | null, before: Row | null, after: Row | null, reason: string) {
    const auditInput: Parameters<AuditService['write']>[0] = { tenantId: scope.companyId, actorId: userId, action: title, entityType: 'RegulatoryApplicability', before: before ?? null, after: after ?? null, metadata: { reason, sourceModule: 'Regulatory Applicability' } };
    if (after?.id ?? before?.id) auditInput.entityId = after?.id ?? before?.id;
    const audit = await this.audit.write(auditInput).catch(() => null);
    await this.db.single(this.db.from('regulatory_applicability_history_events').insert({
      id: crypto.randomUUID(),
      company_id: scope.companyId,
      site_id: after?.site_id ?? before?.site_id ?? scope.selectedSiteId ?? null,
      regulatory_item_id: itemId,
      assessment_id: after?.assessment_id ?? before?.assessment_id ?? after?.id ?? before?.id ?? null,
      event_type: title.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      event_title: title,
      event_description: reason,
      before_value_json: before ?? null,
      after_value_json: after ?? null,
      actor_user_id: userId,
      source_module: 'Regulatory Applicability',
      source_record_id: after?.id ?? before?.id ?? itemId,
      audit_log_id: (audit as { id?: string } | null)?.id ?? null
    }).select('id').single()).catch(() => null);
    await this.writeMutation(scope, userId, title, itemId, before, after, reason).catch(() => null);
  }

  private validateUrl(value: string) {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
    } catch {
      throw new BadRequestException('Full reference URL must be a valid http(s) URL.');
    }
  }

  private startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private withinDays(value: string | null | undefined, days: number) {
    if (!value) return false;
    const date = new Date(value);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return date >= cutoff;
  }

  private permissionSummary(userId: string) {
    return {
      userId,
      disabledReasons: {
        create: 'Missing permission: regulatory.item.create',
        edit: 'Missing permission: regulatory.item.edit',
        archive: 'Missing permission: regulatory.item.archive',
        link: 'Missing permission: regulatory.link.manage'
      }
    };
  }

  private foundationMessage(section: string) {
    return `This ${section} foundation is connected for Phase 1. Full workflow automation comes in a later Regulatory Register phase; no fake legal content or compliance claims are shown.`;
  }
}
