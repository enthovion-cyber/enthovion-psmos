import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchIndexService } from '../search/search-index.service';
import { CreatePssrDto } from './dto/create-pssr.dto';
import { PssrChecklistGeneratorService } from './pssr-checklist-generator.service';
import { PssrNumberingService } from './pssr-numbering.service';
import { PssrStartupBlockerService } from './pssr-startup-blocker.service';

type Scope = { allowedSiteIds?: string[] | undefined; selectedSiteId?: string | null | undefined; corporateView?: boolean | undefined };

const finalStatuses = ['Closed', 'Cancelled'];
const activeStatuses = ['Draft', 'Created', 'In Preparation', 'In Review', 'Field Verification', 'Punch List Open', 'Ready For Authorization', 'Authorized For Startup', 'Startup Released'];

@Injectable()
export class PssrService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly search: SearchIndexService,
    private readonly numbering: PssrNumberingService,
    private readonly checklist: PssrChecklistGeneratorService,
    private readonly blockers: PssrStartupBlockerService
  ) {}

  async context(tenantId: string, scope: Scope) {
    const sitesQuery = this.scopeSite(this.db.from('Site').select('id,name,code,companyId').eq('tenantId', tenantId), scope);
    const [companies, sites, units, areas, departments, users] = await Promise.all([
      this.db.many<any>(this.db.from('Company').select('id,name,code').eq('tenantId', tenantId).order('name')),
      this.db.many<any>(sitesQuery.order('name')),
      this.db.many<any>(this.db.from('Unit').select('id,name,code,siteId').eq('tenantId', tenantId).order('name')),
      this.db.many<any>(this.db.from('Area').select('id,name,code,unitId').eq('tenantId', tenantId).order('name')),
      this.db.many<any>(this.db.from('Department').select('id,name,code').eq('tenantId', tenantId).order('name')),
      this.db.many<any>(this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', tenantId).eq('status', 'ACTIVE').order('displayName'))
    ]);
    return { companies, sites, units, areas, departments, users, pssrTypes: ['MOC Startup Review', 'New Equipment Startup', 'New Process Unit Startup', 'Restart After Shutdown', 'Safety System Startup', 'Software / Control Logic Change', 'Temporary Change Startup', 'Emergency Change Follow-up Startup', 'Commissioning Startup', 'Other'], startupTypes: ['Initial startup', 'Restart', 'Startup after MOC', 'Startup after shutdown', 'Startup after maintenance', 'Startup after emergency change', 'Commissioning', 'Other'] };
  }

  async fromMocContext(tenantId: string, mocId: string, scope: Scope) {
    const moc = await this.moc(tenantId, mocId, scope);
    const existing = await this.existingForMoc(tenantId, mocId);
    const actions = await this.safeMany(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId));
    const equipment = await this.safeMany(this.db.from('moc_affected_equipment').select('*, equipment:Equipment(id,tag,name,type,criticality,siteId,unitId,areaId)').eq('tenant_id', tenantId).eq('moc_id', mocId));
    const checklistPreview = this.checklist.preview({ pssrType: 'MOC Startup Review', startupType: 'Startup after MOC', riskLevel: moc.risk_level, moc });
    return { moc, existingPssr: existing, actions, equipment, checklistPreview, blockersPreview: this.blockers.preview({ moc, actions, checklist: checklistPreview }) };
  }

  async list(tenantId: string, scope: Scope, filters: Record<string, any> = {}) {
    let query = this.applyPssrFilters(this.scopeSnake(this.db.from('pssrs').select('*').eq('tenant_id', tenantId), scope), filters);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.risk_level) query = query.eq('risk_level', filters.risk_level);
    return this.db.many<any>(query.order('updated_at', { ascending: false }).limit(Math.min(Number(filters.limit ?? 50), 100)));
  }

  async dashboard(tenantId: string, scope: Scope, filters: Record<string, any> = {}) {
    const [pssrs, sites, units, areas, users, blockers, punchItems, punchDeferrals, documents, trainingReqs, trainingAssignments, testReqs, testRecords, signatures, linkedMocs, affectedEquipment, historyEvents, releases] = await Promise.all([
      this.safeMany<any>(this.applyPssrFilters(this.scopeSnake(this.db.from('pssrs').select('*').eq('tenant_id', tenantId), scope), filters).order(this.dashboardSort(filters).column, { ascending: this.dashboardSort(filters).ascending })),
      this.safeMany<any>(this.scopeCamel(this.db.from('Site').select('id,name,code').eq('tenantId', tenantId), scope)),
      this.safeMany<any>(this.db.from('Unit').select('id,name,code,siteId').eq('tenantId', tenantId)),
      this.safeMany<any>(this.db.from('Area').select('id,name,code,unitId').eq('tenantId', tenantId)),
      this.safeMany<any>(this.db.from('User').select('id,displayName,email,title').eq('tenantId', tenantId)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_startup_blockers').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_punch_items').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_punch_item_deferrals').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_document_readiness').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_training_requirements').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_training_assignments').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_test_requirements').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_test_records').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_authorization_signatures').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_linked_mocs').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_affected_equipment').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_history_events').select('*').eq('tenant_id', tenantId), scope).order('created_at', { ascending: false }).limit(40)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_startup_release_events').select('*').eq('tenant_id', tenantId), scope))
    ]);
    const idSet = new Set(pssrs.map((row) => row.id));
    const scopedBlockers = blockers.filter((row) => idSet.has(row.pssr_id));
    const scopedPunchItems = punchItems.filter((row) => idSet.has(row.pssr_id));
    const scopedPunchDeferrals = punchDeferrals.filter((row) => idSet.has(row.pssr_id));
    const scopedDocuments = documents.filter((row) => idSet.has(row.pssr_id));
    const scopedTrainingReqs = trainingReqs.filter((row) => idSet.has(row.pssr_id));
    const scopedTrainingAssignments = trainingAssignments.filter((row) => idSet.has(row.pssr_id));
    const scopedTestReqs = testReqs.filter((row) => idSet.has(row.pssr_id));
    const scopedTestRecords = testRecords.filter((row) => idSet.has(row.pssr_id));
    const scopedSignatures = signatures.filter((row) => idSet.has(row.pssr_id));
    const scopedLinkedMocs = linkedMocs.filter((row) => idSet.has(row.pssr_id));
    const scopedEquipment = affectedEquipment.filter((row) => idSet.has(row.pssr_id));
    const scopedReleases = releases.filter((row) => idSet.has(row.pssr_id));
    const [certificates, secureShares, autoLinks] = await Promise.all([
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_startup_certificates').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_secure_share_links').select('*').eq('tenant_id', tenantId), scope)),
      this.safeMany<any>(this.scopeSnake(this.db.from('pssr_auto_verification_links').select('*').eq('tenant_id', tenantId), scope))
    ]);
    const scopedCertificates = certificates.filter((row) => idSet.has(row.pssr_id));
    const scopedSecureShares = secureShares.filter((row) => idSet.has(row.pssr_id) && !row.revoked_at && (!row.expires_at || new Date(row.expires_at).getTime() > Date.now()));
    const scopedAutoLinks = autoLinks.filter((row) => idSet.has(row.pssr_id));
    const siteMap = new Map(sites.map((row) => [row.id, row.name ?? row.code ?? row.id]));
    const unitMap = new Map(units.map((row) => [row.id, row.name ?? row.code ?? row.id]));
    const areaMap = new Map(areas.map((row) => [row.id, row.name ?? row.code ?? row.id]));
    const userMap = new Map(users.map((row) => [row.id, row.displayName ?? row.email ?? row.id]));
    const byPssr = {
      blockers: this.groupBy(scopedBlockers, 'pssr_id'),
      punch: this.groupBy(scopedPunchItems, 'pssr_id'),
      deferrals: this.groupBy(scopedPunchDeferrals, 'pssr_id'),
      documents: this.groupBy(scopedDocuments, 'pssr_id'),
      trainingReqs: this.groupBy(scopedTrainingReqs, 'pssr_id'),
      trainingAssignments: this.groupBy(scopedTrainingAssignments, 'pssr_id'),
      testReqs: this.groupBy(scopedTestReqs, 'pssr_id'),
      testRecords: this.groupBy(scopedTestRecords, 'pssr_id'),
      signatures: this.groupBy(scopedSignatures, 'pssr_id'),
      mocs: this.groupBy(scopedLinkedMocs, 'pssr_id'),
      equipment: this.groupBy(scopedEquipment, 'pssr_id')
    };
    const enriched = pssrs.map((pssr) => this.dashboardRow(pssr, byPssr, siteMap, unitMap, areaMap, userMap));
    const filtered = this.applyDashboardDerivedFilters(enriched, filters);
    const page = Math.max(Number(filters.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(filters.limit ?? 25), 1), 100);
    const paged = filtered.slice((page - 1) * limit, page * limit);
    const openBlockers = scopedBlockers.filter((row) => this.isOpen(row.status));
    const openPunch = scopedPunchItems.filter((row) => this.isOpen(row.status));
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const inOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const releasedThisMonth = filtered.filter((row) => {
      const released = scopedReleases.find((item) => item.pssr_id === row.id)?.released_at ?? row.released_at;
      if (!released) return false;
      const date = new Date(released);
      return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
    }).length;
    const kpis = [
      this.kpi('Total PSSRs', filtered.length, 'All registered startup reviews', 'blue', {}),
      this.kpi('Draft', this.countStatus(filtered, 'Draft'), 'Not submitted', 'slate', { status: 'Draft' }),
      this.kpi('In Preparation', this.countStatus(filtered, 'In Preparation'), 'Preparation active', 'blue', { status: 'In Preparation' }),
      this.kpi('In Review', this.countStatus(filtered, 'In Review'), 'Formal review active', 'blue', { status: 'In Review' }),
      this.kpi('Field Verification', this.countStatus(filtered, 'Field Verification'), 'Walkdown and checks', 'amber', { status: 'Field Verification' }),
      this.kpi('Punch List Open', this.countStatus(filtered, 'Punch List Open'), 'Punch action phase', 'amber', { status: 'Punch List Open' }),
      this.kpi('Ready For Authorization', this.countStatus(filtered, 'Ready For Authorization'), 'Pending signatures', 'green', { status: 'Ready For Authorization' }),
      this.kpi('Authorized For Startup', this.countStatus(filtered, 'Authorized For Startup'), 'Awaiting release', 'green', { status: 'Authorized For Startup' }),
      this.kpi('Startup Released', this.countStatus(filtered, 'Startup Released'), 'Released to operations', 'green', { status: 'Startup Released' }),
      this.kpi('Closed This Month', releasedThisMonth + this.closedThisMonth(filtered), 'Closed or released this month', 'slate', { quick: 'closed' }),
      this.kpi('Blocked PSSRs', filtered.filter((row) => row.openBlockersCount > 0).length, 'Any startup blocker open', 'red', { has_startup_blockers: 'true' }),
      this.kpi('Category A Open', filtered.filter((row) => row.categoryAOpenCount > 0).length, 'Startup blocking punch items', 'red', { category_a_open: 'true' }),
      this.kpi('Category B Deferred', filtered.filter((row) => row.categoryBDeferredCount > 0).length, 'Accepted post-startup actions', 'amber', { category_b_deferred: 'true' }),
      this.kpi('Missing Documents', filtered.filter((row) => row.missingDocumentsCount > 0).length, 'Document readiness gaps', 'red', { missing_documents: 'true' }),
      this.kpi('Missing Training', filtered.filter((row) => row.missingTrainingCount > 0).length, 'Training readiness gaps', 'amber', { missing_training: 'true' }),
      this.kpi('Failed Tests', filtered.filter((row) => row.failedTestsCount > 0).length, 'Commissioning failures', 'red', { failed_tests: 'true' }),
      this.kpi('Upcoming Startups', filtered.filter((row) => this.isWithin(row.target_startup_at, now, inSevenDays)).length, 'Target startup within 7 days', 'amber', { quick: 'upcoming' }),
      this.kpi('Overdue Reviews', filtered.filter((row) => this.isOverdue(row.target_startup_at, row.status)).length, 'Target startup date missed', 'red', { quick: 'overdue' }),
      this.kpi('Auto-created from MOC', filtered.filter((row) => row.auto_created_from_moc).length, 'Automatically generated from MOC policy', 'blue', { trigger_source: 'MOC' }),
      this.kpi('Certificate Missing', filtered.filter((row) => row.startup_certificate_status === 'Missing').length, 'Startup release cannot proceed', 'red', { certificate_status: 'Missing' }),
      this.kpi('Certificate Issued', scopedCertificates.filter((row) => row.status === 'Issued').length, 'Current issued startup certificates', 'green', { certificate_status: 'Issued' }),
      this.kpi('Certificate Superseded', scopedCertificates.filter((row) => row.status === 'Superseded').length, 'Requires revalidation before release', 'amber', { certificate_status: 'Superseded' }),
      this.kpi('Secure Shares Active', scopedSecureShares.length, 'Active OSHA inspector/auditor links', 'purple', { secure_share: 'active' }),
      this.kpi('Critical Items Open', filtered.filter((row) => row.criticalBlockersCount > 0).length, 'Critical startup blockers remain', 'red', { critical_open: 'true' }),
      this.kpi('Auto-verification Failed', scopedAutoLinks.filter((row) => row.verification_status === 'Failed').length, 'Linked source verification failed', 'red', { auto_verification_failed: 'true' })
    ];
    const readinessOverview = {
      averageReadinessPercent: this.average(filtered.map((row) => row.readinessPercent)),
      within24Hours: filtered.filter((row) => this.isWithin(row.target_startup_at, now, inOneDay)).length,
      within7Days: filtered.filter((row) => this.isWithin(row.target_startup_at, now, inSevenDays)).length,
      criticalBlocked: filtered.filter((row) => row.openBlockersCount > 0 && ['High', 'Critical'].includes(row.risk_level)).length,
      distribution: ['Not Ready', 'In Progress', 'Blocked', 'Ready Pending Signatures', 'Authorized', 'Released', 'Closed'].map((status) => ({ status, count: filtered.filter((row) => row.readinessStatus === status).length })),
      bySite: this.summaryBy(filtered, 'siteName'),
      byUnit: this.summaryBy(filtered, 'unitName'),
      byArea: this.summaryBy(filtered, 'areaName'),
      byPssrType: this.summaryBy(filtered, 'pssr_type'),
      byStartupType: this.summaryBy(filtered, 'startup_type'),
      byLinkedMocRisk: this.summaryBy(filtered, 'linkedMocRiskLevel')
    };
    const startupSchedule = filtered
      .filter((row) => row.target_startup_at && (!finalStatuses.includes(row.status) || row.status === 'Authorized For Startup'))
      .sort((a, b) => new Date(a.target_startup_at).getTime() - new Date(b.target_startup_at).getTime())
      .slice(0, 12)
      .map((row) => ({ ...row, scheduleStatus: this.scheduleStatus(row, now, inOneDay, inSevenDays) }));
    const blockersHealth = this.blockerSources(scopedBlockers);
    const punchHealth = this.punchHealth(scopedPunchItems, scopedPunchDeferrals);
    const authorizationQueue = filtered
      .filter((row) => row.authorizationPendingCount > 0 || row.status === 'Ready For Authorization')
      .slice(0, 10)
      .map((row) => ({ ...row, pendingSignatures: byPssr.signatures.get(row.id)?.filter((item) => this.isOpen(item.status)) ?? [] }));
    const linkedMocRows = scopedLinkedMocs.slice(0, 10).map((row) => {
      const pssr = filtered.find((item) => item.id === row.pssr_id);
      return { ...row, pssrNumber: pssr?.pssr_number ?? row.pssr_id, pssrTitle: pssr?.title ?? '-', pssrStatus: pssr?.status ?? '-', startupReadiness: pssr?.readinessPercent ?? 0, mocRiskLevel: pssr?.linkedMocRiskLevel ?? 'Unknown' };
    });
    const recentActivity = historyEvents
      .filter((row) => idSet.has(row.pssr_id))
      .slice(0, 12)
      .map((row) => ({ ...row, pssrNumber: filtered.find((item) => item.id === row.pssr_id)?.pssr_number ?? row.pssr_id, userName: row.user_name ?? userMap.get(row.user_id) ?? 'System' }));
    return {
      generatedAt: new Date().toISOString(),
      filters,
      kpis,
      readinessOverview,
      startupSchedule,
      blockersHealth,
      punchHealth,
      authorizationQueue,
      linkedMocs: linkedMocRows,
      recentActivity,
      quickTabs: this.dashboardQuickTabs(filtered),
      register: { rows: paged, total: filtered.length, page, limit, pageCount: Math.max(Math.ceil(filtered.length / limit), 1), sort: filters.sort ?? '-updated_at' }
    };
  }

  async dashboardExport(tenantId: string, scope: Scope, filters: Record<string, any>, format: 'csv' | 'pdf') {
    const data = await this.dashboard(tenantId, scope, { ...filters, page: 1, limit: 100 });
    if (format === 'csv') {
      const header = ['PSSR number', 'Title', 'Status', 'Readiness %', 'Site', 'Unit', 'Area', 'Target startup', 'Open blockers'];
      const rows = data.register.rows.map((row: any) => [row.pssr_number, row.title, row.status, row.readinessPercent, row.siteName, row.unitName, row.areaName, row.target_startup_at ?? '', row.openBlockersCount].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','));
      return { fileName: `pssr-dashboard-${new Date().toISOString().slice(0, 10)}.csv`, mimeType: 'text/csv', content: [header.join(','), ...rows].join('\n') };
    }
    return { fileName: `pssr-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`, mimeType: 'application/json', content: data };
  }

  async preview(tenantId: string, id: string, scope: Scope) {
    const row = await this.get(tenantId, id, scope);
    return {
      id: row.id,
      pssr_number: row.pssr_number,
      title: row.title,
      status: row.status,
      risk_level: row.risk_level,
      readiness_status: row.readiness_status,
      readiness_percent: row.readiness_percent,
      target_startup_at: row.target_startup_at,
      authorization_status: row.authorization_status,
      blockersCount: row.summary?.blockersCount ?? 0,
      categoryAOpen: row.summary?.categoryAOpen ?? 0,
      linkedMoc: row.linkedMoc,
      primaryEquipment: row.equipment?.find((item: any) => item.is_primary) ?? row.equipment?.[0] ?? null
    };
  }

  async autoCreationPolicy(tenantId: string, scope: Scope) {
    const sites = await this.safeMany<any>(this.scopeCamel(this.db.from('Site').select('id,companyId,name,code').eq('tenantId', tenantId), scope));
    const site = sites[0];
    if (!site) return null;
    const existing = await this.safeSingle<any>(this.db.from('pssr_auto_creation_policies').select('*').eq('tenant_id', tenantId).eq('site_id', site.id).maybeSingle());
    if (existing) return existing;
    return this.db.single<any>(this.db.from('pssr_auto_creation_policies').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: site.companyId, site_id: site.id }).select().single());
  }

  async updateAutoCreationPolicy(tenantId: string, actorId: string, scope: Scope, dto: Record<string, any>) {
    const policy = await this.autoCreationPolicy(tenantId, scope);
    if (!policy) throw new BadRequestException('No site is available for PSSR auto-creation policy');
    const patch = this.compact({
      trigger_on_moc_approved: dto.triggerOnMocApproved ?? dto.trigger_on_moc_approved,
      trigger_on_moc_implementation: dto.triggerOnMocImplementation ?? dto.trigger_on_moc_implementation,
      high_risk_requires_pssr: dto.highRiskRequiresPssr ?? dto.high_risk_requires_pssr,
      critical_risk_requires_pssr: dto.criticalRiskRequiresPssr ?? dto.critical_risk_requires_pssr,
      equipment_change_requires_pssr: dto.equipmentChangeRequiresPssr ?? dto.equipment_change_requires_pssr,
      safety_system_change_requires_pssr: dto.safetySystemChangeRequiresPssr ?? dto.safety_system_change_requires_pssr,
      operating_limits_change_requires_pssr: dto.operatingLimitsChangeRequiresPssr ?? dto.operating_limits_change_requires_pssr,
      chemistry_change_requires_pssr: dto.chemistryChangeRequiresPssr ?? dto.chemistry_change_requires_pssr,
      temporary_change_requires_pssr: dto.temporaryChangeRequiresPssr ?? dto.temporary_change_requires_pssr,
      emergency_change_requires_pssr: dto.emergencyChangeRequiresPssr ?? dto.emergency_change_requires_pssr,
      duplicate_policy: dto.duplicatePolicy ?? dto.duplicate_policy,
      updated_at: new Date().toISOString()
    });
    const row = await this.db.single<any>(this.db.from('pssr_auto_creation_policies').update(patch).eq('tenant_id', tenantId).eq('id', policy.id).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PSSR_AUTO_CREATION_POLICY_UPDATED', entityType: 'PSSR_POLICY', entityId: row.id, before: policy as JsonValue, after: row as JsonValue });
    return row;
  }

  async autoEvaluateMoc(tenantId: string, mocId: string, scope: Scope, triggerEvent = 'MOC Approved') {
    const moc = await this.moc(tenantId, mocId, scope);
    const policy = await this.autoCreationPolicy(tenantId, { ...scope, selectedSiteId: moc.site_id });
    const impact = await this.safeSingle<any>(this.db.from('moc_impact_assessments').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId).maybeSingle());
    const reasons: string[] = [];
    if (policy?.high_risk_requires_pssr && moc.risk_level === 'High') reasons.push('MOC risk level is High');
    if (policy?.critical_risk_requires_pssr && moc.risk_level === 'Critical') reasons.push('MOC risk level is Critical');
    if (policy?.equipment_change_requires_pssr && this.truthyImpact(impact, ['equipment_change', 'equipmentChange', 'equipment_changes_required'])) reasons.push('Equipment change impact is Yes');
    if (policy?.safety_system_change_requires_pssr && this.truthyImpact(impact, ['safety_system_change', 'safetySystemChange', 'safety_system_changes'])) reasons.push('Safety system impact is Yes');
    if (policy?.operating_limits_change_requires_pssr && this.truthyImpact(impact, ['operating_limits_changed', 'operatingLimitsChanged', 'operating_limit_changes'])) reasons.push('Operating limits changed');
    if (policy?.chemistry_change_requires_pssr && this.truthyImpact(impact, ['process_chemistry_changed', 'processChemistryChanged', 'chemistry_change'])) reasons.push('Process chemistry changed');
    if (policy?.temporary_change_requires_pssr && /temporary/i.test(moc.change_type ?? '')) reasons.push('Temporary Change requires startup review');
    if (policy?.emergency_change_requires_pssr && /emergency/i.test(moc.change_type ?? '')) reasons.push('Emergency Change requires startup review');
    const existing = await this.existingForMoc(tenantId, mocId);
    return { required: reasons.length > 0, reasons, triggerEvent, policy, existingPssr: existing, duplicatePolicy: policy?.duplicate_policy ?? 'sync_active', moc };
  }

  async autoCreateFromMoc(tenantId: string, actorId: string, mocId: string, scope: Scope, triggerEvent = 'MOC Approved') {
    const evaluation = await this.autoEvaluateMoc(tenantId, mocId, scope, triggerEvent);
    if (!evaluation.required) {
      await this.logMocAutoCreate(tenantId, evaluation.moc, null, 'No auto-create rule matched', triggerEvent, 'Skipped', 'PSSR not required by configured policy');
      return { created: false, required: false, evaluation };
    }
    if (evaluation.existingPssr && activeStatuses.includes(evaluation.existingPssr.status)) {
      await this.syncLinkedMoc(tenantId, actorId, evaluation.existingPssr.id, scope);
      await this.logMocAutoCreate(tenantId, evaluation.moc, evaluation.existingPssr.id, evaluation.reasons.join('; '), triggerEvent, 'Synced', 'Active PSSR already existed and was synchronized');
      return { created: false, existing: true, pssr: evaluation.existingPssr, evaluation };
    }
    const result = await this.triggerFromMoc(tenantId, actorId, mocId, scope);
    const pssr = result.pssr;
    await this.safeSingle(this.db.from('pssrs').update({ auto_created_from_moc: true, auto_creation_source_event: triggerEvent, startup_certificate_status: 'Missing', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', pssr.id).select('id').single());
    await this.safeSingle(this.db.from('moc_pssr_requirements').upsert({ id: `moc_pssr_${mocId}`, tenant_id: tenantId, company_id: evaluation.moc.company_id, site_id: evaluation.moc.site_id, moc_id: mocId, pssr_required: true, linked_pssr_id: pssr.id, pssr_status: pssr.status, auto_created_pssr: true, certificate_status: 'Missing', updated_at: new Date().toISOString() }).select().single());
    await this.logMocAutoCreate(tenantId, evaluation.moc, pssr.id, evaluation.reasons.join('; '), triggerEvent, 'Created', 'PSSR automatically created from MOC');
    await this.history(tenantId, pssr, actorId, 'MOC_AUTO_CREATE', 'PSSR_AUTO_CREATED_FROM_MOC', 'PSSR automatically created from MOC', null, { mocId, reasons: evaluation.reasons });
    await this.notifyCoordinator(tenantId, pssr, actorId, 'pssr.auto_created_from_moc');
    return { created: true, pssr: await this.get(tenantId, pssr.id, scope), evaluation };
  }

  async mocAutoCreationLog(tenantId: string, mocId: string) {
    return this.safeMany<any>(this.db.from('pssr_moc_auto_creation_logs').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId).order('created_at', { ascending: false }));
  }

  async hazardProfiles(tenantId: string, scope: Scope) {
    return this.safeMany<any>(this.scopeSnake(this.db.from('pssr_unit_hazard_profiles').select('*').eq('tenant_id', tenantId), scope).order('hazard_type'));
  }

  async saveHazardProfile(tenantId: string, actorId: string, scope: Scope, dto: Record<string, any>, id?: string) {
    const siteId = dto.siteId ?? dto.site_id ?? scope.selectedSiteId;
    if (!siteId) throw new BadRequestException('site_id is required');
    this.assertSiteAccess(siteId, scope);
    const site = await this.safeSingle<any>(this.db.from('Site').select('id,companyId').eq('tenantId', tenantId).eq('id', siteId).maybeSingle());
    const row = { id: id ?? crypto.randomUUID(), tenant_id: tenantId, company_id: dto.companyId ?? dto.company_id ?? site?.companyId, site_id: siteId, unit_id: dto.unitId ?? dto.unit_id ?? null, area_id: dto.areaId ?? dto.area_id ?? null, hazard_type: dto.hazardType ?? dto.hazard_type, description: dto.description ?? null, active: dto.active ?? true, updated_at: new Date().toISOString() };
    const saved = await this.db.single<any>(this.db.from('pssr_unit_hazard_profiles').upsert(row).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PSSR_HAZARD_PROFILE_SAVED', entityType: 'PSSR_HAZARD_PROFILE', entityId: saved.id, after: saved as JsonValue });
    return saved;
  }

  async deleteHazardProfile(tenantId: string, actorId: string, id: string) {
    const row = await this.safeSingle<any>(this.db.from('pssr_unit_hazard_profiles').delete().eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PSSR_HAZARD_PROFILE_DELETED', entityType: 'PSSR_HAZARD_PROFILE', entityId: id, before: row as JsonValue });
    return { deleted: Boolean(row), id };
  }

  async hazardRules(tenantId: string, scope: Scope) {
    return this.safeMany<any>(this.scopeSnake(this.db.from('pssr_hazard_checklist_rules').select('*').eq('tenant_id', tenantId), scope).order('hazard_type'));
  }

  async saveHazardRule(tenantId: string, actorId: string, scope: Scope, dto: Record<string, any>, id?: string) {
    const siteId = dto.siteId ?? dto.site_id ?? scope.selectedSiteId;
    if (!siteId) throw new BadRequestException('site_id is required');
    this.assertSiteAccess(siteId, scope);
    const site = await this.safeSingle<any>(this.db.from('Site').select('id,companyId').eq('tenantId', tenantId).eq('id', siteId).maybeSingle());
    const row = { id: id ?? crypto.randomUUID(), tenant_id: tenantId, company_id: dto.companyId ?? dto.company_id ?? site?.companyId, site_id: siteId, hazard_type: dto.hazardType ?? dto.hazard_type, item_title: dto.itemTitle ?? dto.item_title, item_description: dto.itemDescription ?? dto.item_description ?? null, required: dto.required ?? true, required_before_startup: dto.requiredBeforeStartup ?? dto.required_before_startup ?? true, evidence_required: dto.evidenceRequired ?? dto.evidence_required ?? true, verification_required: dto.verificationRequired ?? dto.verification_required ?? true, owner_role_id: dto.ownerRoleId ?? dto.owner_role_id ?? null, startup_blocking: dto.startupBlocking ?? dto.startup_blocking ?? true, active: dto.active ?? true, updated_at: new Date().toISOString() };
    const saved = await this.db.single<any>(this.db.from('pssr_hazard_checklist_rules').upsert(row).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PSSR_HAZARD_RULE_SAVED', entityType: 'PSSR_HAZARD_RULE', entityId: saved.id, after: saved as JsonValue });
    return saved;
  }

  async generateHazardItems(tenantId: string, actorId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const profiles = await this.safeMany<any>(this.db.from('pssr_unit_hazard_profiles').select('*').eq('tenant_id', tenantId).eq('site_id', pssr.site_id).eq('active', true));
    const matching = profiles.filter((row) => (!row.unit_id || row.unit_id === pssr.unit_id) && (!row.area_id || row.area_id === pssr.area_id));
    const rules = await this.safeMany<any>(this.db.from('pssr_hazard_checklist_rules').select('*').eq('tenant_id', tenantId).eq('site_id', pssr.site_id).eq('active', true));
    const hazards = matching.map((row) => row.hazard_type);
    const generated = [
      ...this.checklist.hazardItems(hazards),
      ...rules.filter((rule) => hazards.includes(rule.hazard_type)).map((rule) => ({ title: rule.item_title, description: rule.item_description, groupName: `Hazard-Specific Checks - ${rule.hazard_type}`, required: rule.required, requiredBeforeStartup: rule.required_before_startup, evidenceRequired: rule.evidence_required, verificationRequired: rule.verification_required, source: 'Hazard Checklist Rule', criticalityLevel: rule.startup_blocking ? 'High' : 'Standard', startupAuthorizationBlocking: rule.startup_blocking, certificateRequired: rule.startup_blocking, systemRequired: true, deletionLocked: true, bypassLocked: rule.startup_blocking, deferralAllowed: !rule.startup_blocking }))
    ];
    const existing = new Set((pssr.checklist ?? []).map((item: any) => `${item.group_name}:${item.item_title}`));
    let added = 0;
    for (const item of generated) {
      if (existing.has(`${item.groupName}:${item.title}`)) continue;
      await this.safeSingle(this.db.from('pssr_checklist_items').insert(this.checklistInsertPayload(tenantId, pssr, item, actorId)).select().single());
      added += 1;
    }
    await this.history(tenantId, pssr, actorId, 'CHECKLIST', 'PSSR_HAZARD_CHECKLIST_GENERATED', 'Hazard-specific checklist items generated', null, { hazards, added });
    await this.audit.write({ tenantId, actorId, action: 'PSSR_HAZARD_CHECKLIST_GENERATED', entityType: 'PSSR', entityId: id, after: { hazards, added } as JsonValue });
    return this.checklistTab(tenantId, id, scope);
  }

  async managementAcceptances(tenantId: string, id: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    return this.safeMany<any>(this.db.from('pssr_management_acceptances').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('created_at', { ascending: false }));
  }

  async createManagementAcceptance(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const recordType = dto.recordType ?? dto.record_type;
    const recordId = dto.recordId ?? dto.record_id;
    const item = await this.resolvePssrRecord(tenantId, id, recordType, recordId);
    if (item?.criticality_level === 'Critical' || item?.bypass_locked || item?.regulatory_source === 'OSHA') throw new BadRequestException('Critical or OSHA-required item cannot be deferred or bypassed');
    const row = await this.db.single<any>(this.db.from('pssr_management_acceptances').insert({ id: crypto.randomUUID(), pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, record_type: recordType, record_id: recordId, justification: dto.justification, startup_impact_statement: dto.startupImpactStatement ?? dto.startup_impact_statement, temporary_controls: dto.temporaryControls ?? dto.temporary_controls ?? null, due_date: dto.dueDate ?? dto.due_date, owner_id: dto.ownerId ?? dto.owner_id ?? null, status: 'Requested' }).select().single());
    await this.history(tenantId, pssr, actorId, 'MANAGEMENT_ACCEPTANCE', 'PSSR_DEFERRAL_REQUESTED', 'Management acceptance requested', null, row);
    return row;
  }

  async decideManagementAcceptance(tenantId: string, actorId: string, id: string, recordType: string, recordId: string, decision: 'Accepted' | 'Rejected', dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_management_acceptances').update({ status: decision, accepted_by: decision === 'Accepted' ? actorId : null, accepted_at: decision === 'Accepted' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('record_type', recordType).eq('record_id', recordId).select().single());
    if (decision === 'Accepted') await this.applyManagementAcceptance(tenantId, recordType, recordId, row.id);
    await this.history(tenantId, pssr, actorId, 'MANAGEMENT_ACCEPTANCE', `PSSR_DEFERRAL_${decision.toUpperCase()}`, `Management acceptance ${decision.toLowerCase()}`, dto, row);
    return row;
  }

  async autoVerifications(tenantId: string, id: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    return this.safeMany<any>(this.db.from('pssr_auto_verification_links').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('verification_type'));
  }

  async syncAutoVerifications(tenantId: string, actorId: string, id: string, scope: Scope, linkId?: string) {
    const pssr = await this.get(tenantId, id, scope);
    await this.ensureAutoVerificationLinks(tenantId, pssr);
    const links = (await this.autoVerifications(tenantId, id, scope)).filter((link) => !linkId || link.id === linkId);
    const synced: any[] = [];
    for (const link of links) {
      const result = await this.evaluateAutoVerificationLink(tenantId, pssr, link);
      const row = await this.db.single<any>(this.db.from('pssr_auto_verification_links').update({ current_status: result.currentStatus, verification_status: result.status, verification_message: result.message, last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', link.id).select().single());
      if (row.startup_blocking && row.verification_status === 'Failed') await this.upsertBlocker(tenantId, pssr, 'Auto Verification', row.id, `${row.verification_type} auto-verification failed`, row.verification_message ?? 'Linked source did not meet required status', 'High');
      synced.push(row);
    }
    await this.history(tenantId, pssr, actorId, 'AUTO_VERIFICATION', 'PSSR_AUTO_VERIFICATION_SYNCED', 'Auto-verification links synchronized', null, { count: synced.length });
    return synced;
  }

  async autoVerificationBlockers(tenantId: string, id: string, scope: Scope) {
    return (await this.autoVerifications(tenantId, id, scope)).filter((row) => row.startup_blocking && row.verification_status === 'Failed');
  }

  async disciplineSignoffs(tenantId: string, id: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    const [signoffs, items, flags] = await Promise.all([
      this.safeMany<any>(this.db.from('pssr_discipline_signoffs').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('discipline')),
      this.safeMany<any>(this.db.from('pssr_discipline_checklist_items').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('discipline')),
      this.safeMany<any>(this.db.from('pssr_signoff_blocking_flags').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('created_at', { ascending: false }))
    ]);
    return { signoffs, items, flags };
  }

  async generateDisciplineSignoffs(tenantId: string, actorId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const disciplines = ['Process / Mechanical Engineering', 'Operations', 'Maintenance / Inspection', 'Instrument / Electrical', 'HSE Manager', 'Plant Manager Final Authorization'];
    let added = 0;
    for (const discipline of disciplines) {
      const signoff = await this.safeSingle<any>(this.db.from('pssr_discipline_signoffs').upsert({ id: `signoff_${id}_${discipline.replace(/\W+/g, '_').toLowerCase()}`, pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, discipline, required: true, status: 'Pending', updated_at: new Date().toISOString() }).select().single());
      const existing = await this.safeMany<any>(this.db.from('pssr_discipline_checklist_items').select('item_title').eq('tenant_id', tenantId).eq('pssr_id', id).eq('discipline', discipline));
      const existingTitles = new Set(existing.map((row) => row.item_title));
      for (const title of this.disciplineChecklistTitles(discipline)) {
        if (existingTitles.has(title)) continue;
        await this.safeSingle(this.db.from('pssr_discipline_checklist_items').insert({ id: crypto.randomUUID(), pssr_id: id, signoff_id: signoff.id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, discipline, item_title: title, required: true, startup_blocking: true }).select().single());
        added += 1;
      }
    }
    await this.history(tenantId, pssr, actorId, 'DISCIPLINE_SIGNOFF', 'PSSR_DISCIPLINE_SIGNOFF_REQUESTED', 'Discipline signoff matrix generated', null, { added });
    return this.disciplineSignoffs(tenantId, id, scope);
  }

  async patchDisciplineChecklistItem(tenantId: string, actorId: string, id: string, signoffId: string, itemId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_discipline_checklist_items').update({ status: dto.status, comment: dto.comment ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('signoff_id', signoffId).eq('id', itemId).select().single());
    await this.recalculateDisciplineSignoff(tenantId, signoffId);
    await this.history(tenantId, pssr, actorId, 'DISCIPLINE_SIGNOFF', 'PSSR_DISCIPLINE_CHECKLIST_UPDATED', 'Discipline checklist item updated', null, row);
    return this.disciplineSignoffs(tenantId, id, scope);
  }

  async signDiscipline(tenantId: string, actorId: string, id: string, signoffId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const signoff = await this.safeSingle<any>(this.db.from('pssr_discipline_signoffs').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', signoffId).maybeSingle());
    if (!signoff) throw new NotFoundException('Signoff not found');
    await this.recalculateDisciplineSignoff(tenantId, signoffId);
    const fresh = await this.safeSingle<any>(this.db.from('pssr_discipline_signoffs').select('*').eq('tenant_id', tenantId).eq('id', signoffId).maybeSingle());
    if (fresh.blocking_items_count > 0 || fresh.checklist_completion_percent < 100) throw new BadRequestException('Discipline checklist must be complete before signoff');
    if (fresh.discipline === 'Plant Manager Final Authorization') {
      const all = await this.safeMany<any>(this.db.from('pssr_discipline_signoffs').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).neq('id', signoffId));
      if (all.some((row) => row.required && row.status !== 'Signed')) throw new BadRequestException('Plant Manager must sign last after all required discipline signoffs');
    }
    const row = await this.db.single<any>(this.db.from('pssr_discipline_signoffs').update({ status: 'Signed', signed_by: actorId, signed_at: new Date().toISOString(), username_reentry_hash: dto.username ? `sha256:${Buffer.from(String(dto.username)).toString('base64')}` : null, ip_address: dto.ipAddress ?? dto.ip_address ?? null, user_agent: dto.userAgent ?? dto.user_agent ?? null, comment: dto.comment ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', signoffId).select().single());
    await this.history(tenantId, pssr, actorId, 'DISCIPLINE_SIGNOFF', 'PSSR_DISCIPLINE_SIGNED', `${row.discipline} signed`, null, row);
    return this.disciplineSignoffs(tenantId, id, scope);
  }

  async rejectDiscipline(tenantId: string, actorId: string, id: string, signoffId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_discipline_signoffs').update({ status: 'Rejected', rejection_reason: dto.reason ?? dto.rejectionReason ?? 'Rejected', comment: dto.comment ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', signoffId).select().single());
    await this.upsertBlocker(tenantId, pssr, 'Discipline Signoff', signoffId, `${row.discipline} signoff rejected`, row.rejection_reason, 'High');
    await this.history(tenantId, pssr, actorId, 'DISCIPLINE_SIGNOFF', 'PSSR_DISCIPLINE_SIGNOFF_REJECTED', `${row.discipline} rejected`, null, row);
    return this.disciplineSignoffs(tenantId, id, scope);
  }

  async signoffFlag(tenantId: string, actorId: string, id: string, signoffId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_signoff_blocking_flags').insert({ id: crypto.randomUUID(), pssr_id: id, signoff_id: signoffId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, raised_by: actorId, title: dto.title, description: dto.description ?? null, severity: dto.severity ?? 'High' }).select().single());
    await this.upsertBlocker(tenantId, pssr, 'Discipline Signoff', row.id, row.title, row.description ?? row.title, row.severity);
    return row;
  }

  async resolveSignoffFlag(tenantId: string, actorId: string, id: string, signoffId: string, flagId: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    return this.db.single<any>(this.db.from('pssr_signoff_blocking_flags').update({ status: 'Resolved', resolved_by: actorId, resolved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('signoff_id', signoffId).eq('id', flagId).select().single());
  }

  async certificate(tenantId: string, id: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    return this.safeSingle<any>(this.db.from('pssr_startup_certificates').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).eq('status', 'Issued').order('version', { ascending: false }).limit(1).maybeSingle());
  }

  async certificateVersions(tenantId: string, id: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    return this.safeMany<any>(this.db.from('pssr_startup_certificates').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('version', { ascending: false }));
  }

  async validateCertificateBeforeRelease(tenantId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const cert = await this.certificate(tenantId, id, scope);
    if (!cert || cert.status !== 'Issued' || pssr.current_certificate_id !== cert.id) throw new BadRequestException('Startup release blocked: issued current startup certificate is required');
    return { valid: true, certificate: cert };
  }

  async generateCertificate(tenantId: string, actorId: string, id: string, scope: Scope, regenerate = false) {
    const pssr = await this.get(tenantId, id, scope);
    const validation = await this.startupCertificateReadiness(tenantId, pssr, scope);
    if (!validation.ready) throw new BadRequestException(`Certificate cannot be issued: ${validation.blockers.join('; ')}`);
    const existing = await this.certificateVersions(tenantId, id, scope);
    if (existing.some((row) => row.status === 'Issued') && !regenerate) return existing.find((row) => row.status === 'Issued');
    for (const cert of existing.filter((row) => row.status === 'Issued')) await this.supersedeCertificate(tenantId, actorId, id, cert.id, scope, 'New certificate version generated');
    const version = existing.length ? Math.max(...existing.map((row: any) => Number(row.version ?? 1))) + 1 : 1;
    const payload = await this.certificateDocumentPayload(tenantId, pssr, scope, version);
    const cert = await this.db.single<any>(this.db.from('pssr_startup_certificates').insert({ id: crypto.randomUUID(), pssr_id: id, moc_id: pssr.linkedMoc?.moc_id ?? null, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, certificate_number: `${pssr.pssr_number}-CERT-${String(version).padStart(2, '0')}`, version, status: 'Issued', file_key: `pssr/${id}/certificate-v${version}.json`, file_url: `pssr/${id}/certificate-v${version}.json`, issued_by: actorId, issued_at: new Date().toISOString(), qr_verification_url: `/public/pssr-share/${id}`, payload }).select().single());
    await this.safeSingle(this.db.from('pssrs').update({ current_certificate_id: cert.id, startup_certificate_status: 'Issued', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    if (pssr.linkedMoc?.moc_id) await this.safeSingle(this.db.from('moc_pssr_requirements').update({ startup_certificate_id: cert.id, certificate_status: 'Issued', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('moc_id', pssr.linkedMoc.moc_id).select('id').single());
    await this.history(tenantId, pssr, actorId, 'CERTIFICATE', 'PSSR_CERTIFICATE_ISSUED', 'Digital startup certificate issued', null, cert);
    await this.notifyCoordinator(tenantId, pssr, actorId, 'pssr.certificate.issued');
    return cert;
  }

  async supersedeCertificate(tenantId: string, actorId: string, id: string, certificateId: string, scope: Scope, reason = 'Certificate superseded') {
    const pssr = await this.get(tenantId, id, scope);
    const cert = await this.db.single<any>(this.db.from('pssr_startup_certificates').update({ status: 'Superseded', superseded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', certificateId).select().single());
    await this.safeSingle(this.db.from('pssrs').update({ startup_certificate_status: 'Superseded', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.history(tenantId, pssr, actorId, 'CERTIFICATE', 'PSSR_CERTIFICATE_SUPERSEDED', reason, null, cert);
    return cert;
  }

  async revokeCertificate(tenantId: string, actorId: string, id: string, scope: Scope, reason = 'Certificate revoked') {
    const cert = await this.certificate(tenantId, id, scope);
    if (!cert) throw new NotFoundException('Issued certificate not found');
    const row = await this.db.single<any>(this.db.from('pssr_startup_certificates').update({ status: 'Revoked', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', cert.id).select().single());
    await this.safeSingle(this.db.from('pssrs').update({ startup_certificate_status: 'Revoked', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    const pssr = await this.get(tenantId, id, scope);
    await this.history(tenantId, pssr, actorId, 'CERTIFICATE', 'PSSR_CERTIFICATE_REVOKED', reason, cert, row);
    return row;
  }

  async revalidateCertificate(tenantId: string, actorId: string, id: string, scope: Scope) {
    const cert = await this.certificate(tenantId, id, scope);
    if (cert) await this.supersedeCertificate(tenantId, actorId, id, cert.id, scope, 'Certificate revalidation requested');
    return this.generateCertificate(tenantId, actorId, id, scope, true);
  }

  async certificateAccess(tenantId: string, id: string, scope: Scope, mode: 'download' | 'preview') {
    const cert = await this.certificate(tenantId, id, scope);
    if (!cert) throw new NotFoundException('Issued certificate not found');
    return { fileName: `${cert.certificate_number}.${mode === 'download' ? 'json' : 'preview.json'}`, mimeType: 'application/json', content: cert.payload ?? cert };
  }

  async secureShares(tenantId: string, id: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    return this.safeMany<any>(this.db.from('pssr_secure_share_links').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('created_at', { ascending: false }));
  }

  async createSecureShare(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const cert = await this.certificate(tenantId, id, scope);
    if (!cert) throw new BadRequestException('Issued certificate is required before creating secure inspector share');
    const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    const row = await this.db.single<any>(this.db.from('pssr_secure_share_links').insert({ id: crypto.randomUUID(), pssr_id: id, certificate_id: cert.id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, token_hash: token, access_scope: dto.accessScope ?? dto.access_scope ?? 'certificate_only', expires_at: dto.expiresAt ?? dto.expires_at ?? null, created_by: actorId }).select().single());
    await this.history(tenantId, pssr, actorId, 'SECURE_SHARE', 'PSSR_SECURE_SHARE_CREATED', 'Secure OSHA inspector share link created', null, { shareId: row.id, accessScope: row.access_scope });
    return { ...row, url: `/public/pssr-share/${token}` };
  }

  async revokeSecureShare(tenantId: string, actorId: string, id: string, shareId: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_secure_share_links').update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', shareId).select().single());
    await this.history(tenantId, pssr, actorId, 'SECURE_SHARE', 'PSSR_SECURE_SHARE_REVOKED', 'Secure share revoked', null, row);
    return row;
  }

  async secureShareAccessLog(tenantId: string, id: string, shareId: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    return this.safeMany<any>(this.db.from('pssr_secure_share_access_logs').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).eq('share_link_id', shareId).order('accessed_at', { ascending: false }));
  }

  async publicShare(token: string, action = 'view', meta: Record<string, any> = {}) {
    const share = await this.safeSingle<any>(this.db.from('pssr_secure_share_links').select('*').eq('token_hash', token).maybeSingle());
    if (!share || share.revoked_at || (share.expires_at && new Date(share.expires_at).getTime() < Date.now())) throw new NotFoundException('Secure share link is expired, revoked, or invalid');
    const cert = share.certificate_id ? await this.safeSingle<any>(this.db.from('pssr_startup_certificates').select('*').eq('id', share.certificate_id).maybeSingle()) : null;
    await this.safeSingle(this.db.from('pssr_secure_share_access_logs').insert({ id: crypto.randomUUID(), share_link_id: share.id, pssr_id: share.pssr_id, certificate_id: share.certificate_id, tenant_id: share.tenant_id, company_id: share.company_id, site_id: share.site_id, action, ip_address: meta.ipAddress ?? null, user_agent: meta.userAgent ?? null, metadata: meta }).select().single());
    return { share: { id: share.id, accessScope: share.access_scope, expiresAt: share.expires_at }, certificate: cert?.payload ?? cert };
  }

  async create(tenantId: string, actorId: string, dto: CreatePssrDto, scope: Scope) {
    this.validateCreate(dto);
    this.assertSiteAccess(dto.siteId, scope);
    const site = await this.db.single<any>(this.db.from('Site').select('id,companyId').eq('tenantId', tenantId).eq('id', dto.siteId).maybeSingle());
    if (!site) throw new BadRequestException('Site is required');
    if (dto.mocId) {
      const existing = await this.existingForMoc(tenantId, dto.mocId);
      if (existing && activeStatuses.includes(existing.status)) throw new BadRequestException(`Active PSSR already exists for this MOC: ${existing.pssr_number}`);
    }
    const moc = dto.mocId ? await this.moc(tenantId, dto.mocId, scope) : null;
    const number = await this.numbering.next(tenantId);
    const now = new Date().toISOString();
    const pssr = await this.db.single<any>(this.db.from('pssrs').insert({
      id: crypto.randomUUID(),
      pssr_number: number,
      tenant_id: tenantId,
      company_id: dto.companyId ?? moc?.company_id ?? site.companyId,
      site_id: dto.siteId,
      department_id: dto.departmentId ?? moc?.department_id ?? null,
      unit_id: dto.unitId ?? moc?.unit_id ?? null,
      area_id: dto.areaId ?? moc?.area_id ?? null,
      title: dto.title,
      description: dto.description ?? moc?.description ?? null,
      pssr_type: dto.pssrType,
      startup_type: dto.startupType,
      trigger_source: dto.triggerSource ?? (dto.mocId ? 'MOC' : 'Manual'),
      status: dto.submit ? 'Created' : 'Draft',
      risk_level: dto.riskLevel ?? moc?.risk_level ?? 'Medium',
      target_startup_at: dto.targetStartupAt,
      requested_startup_at: dto.requestedStartupAt ?? null,
      coordinator_id: dto.coordinatorId,
      originator_id: dto.originatorId ?? actorId,
      startup_scope: dto.startupScope ?? {},
      startup_boundaries: dto.startupBoundaries ?? null,
      startup_hazards: dto.startupHazards ?? null,
      startup_prerequisites: dto.startupPrerequisites ?? null,
      temporary_controls: dto.temporaryControls ?? null,
      created_by: actorId,
      updated_at: now
    }).select().single());
    if (dto.mocId) await this.linkMoc(tenantId, actorId, pssr, dto.mocId, dto.triggerSource ?? 'MOC Trigger');
    await this.saveEquipment(tenantId, pssr, dto.primaryEquipmentId, dto.additionalEquipmentIds ?? []);
    await this.generateChecklistAndBlockers(tenantId, pssr, moc);
    await this.history(tenantId, pssr, actorId, 'CREATE', 'PSSR_CREATED', `${pssr.pssr_number} created`, null, pssr);
    await this.audit.write({ tenantId, actorId, action: 'PSSR_CREATED', entityType: 'PSSR', entityId: pssr.id, after: pssr as JsonValue });
    await this.index(tenantId, pssr);
    await this.notifyCoordinator(tenantId, pssr, actorId, dto.mocId ? 'pssr.triggered_from_moc' : 'pssr.created');
    return this.get(tenantId, pssr.id, scope);
  }

  async triggerFromMoc(tenantId: string, actorId: string, mocId: string, scope: Scope) {
    const ctx = await this.fromMocContext(tenantId, mocId, scope);
    if (ctx.existingPssr && activeStatuses.includes(ctx.existingPssr.status)) return { existing: true, pssr: ctx.existingPssr };
    const primary = ctx.equipment.find((row: any) => row.role === 'PRIMARY') ?? ctx.equipment[0];
    return { existing: false, pssr: await this.create(tenantId, actorId, {
      title: `PSSR for ${ctx.moc.moc_number} - ${ctx.moc.title}`,
      description: ctx.moc.description,
      pssrType: 'MOC Startup Review',
      startupType: ctx.moc.change_type === 'Emergency Change' ? 'Startup after emergency change' : 'Startup after MOC',
      triggerSource: 'MOC',
      mocId,
      siteId: ctx.moc.site_id,
      unitId: ctx.moc.unit_id,
      areaId: ctx.moc.area_id,
      departmentId: ctx.moc.department_id,
      targetStartupAt: ctx.moc.target_implementation_date ?? new Date(Date.now() + 7 * 86400000).toISOString(),
      coordinatorId: ctx.moc.originator_id ?? actorId,
      originatorId: actorId,
      riskLevel: ctx.moc.risk_level,
      primaryEquipmentId: primary?.equipment_id,
      startupScope: { whatChanged: ctx.moc.description, triggerReason: 'PSSR required from linked MOC startup readiness' },
      startupHazards: ['High', 'Critical'].includes(ctx.moc.risk_level) ? 'High/Critical MOC startup hazards require verification.' : undefined,
      startupPrerequisites: 'All required MOC actions, training, documents, testing, and authorization must be complete.',
      submit: true
    }, scope) };
  }

  async get(tenantId: string, id: string, scope: Scope) {
    const pssr = await this.db.single<any>(this.scopeSnake(this.db.from('pssrs').select('*').eq('tenant_id', tenantId).eq('id', id), scope).maybeSingle());
    if (!pssr) throw new NotFoundException('PSSR not found');
    const [linkedMoc, equipment, checklist, blockers, readiness, history, attachments, site, unit, area, department, coordinator] = await Promise.all([
      this.linkedMoc(tenantId, pssr.id),
      this.safeMany(this.db.from('pssr_affected_equipment').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('is_primary', { ascending: false })),
      this.safeMany(this.db.from('pssr_checklist_items').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('group_name')),
      this.safeMany(this.db.from('pssr_startup_blockers').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('severity')),
      this.safeMany(this.db.from('pssr_readiness_checks').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('checked_at', { ascending: false }).limit(5)),
      this.safeMany(this.db.from('pssr_history_events').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('created_at', { ascending: false }).limit(30)),
      this.safeMany(this.db.from('pssr_attachments').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).is('deleted_at', null).order('created_at', { ascending: false })),
      pssr.site_id ? this.safeSingle(this.db.from('Site').select('id,name,code').eq('tenantId', tenantId).eq('id', pssr.site_id).maybeSingle()) : null,
      pssr.unit_id ? this.safeSingle(this.db.from('Unit').select('id,name,code').eq('tenantId', tenantId).eq('id', pssr.unit_id).maybeSingle()) : null,
      pssr.area_id ? this.safeSingle(this.db.from('Area').select('id,name,code').eq('tenantId', tenantId).eq('id', pssr.area_id).maybeSingle()) : null,
      pssr.department_id ? this.safeSingle(this.db.from('Department').select('id,name,code').eq('tenantId', tenantId).eq('id', pssr.department_id).maybeSingle()) : null,
      pssr.coordinator_id ? this.safeSingle(this.db.from('User').select('id,displayName,email,title').eq('tenantId', tenantId).eq('id', pssr.coordinator_id).maybeSingle()) : null
    ]);
    return { ...pssr, site, unit, area, department, coordinator, linkedMoc, equipment, checklist, blockers, readinessChecks: readiness, history, attachments, summary: this.summaryFor(pssr, checklist, blockers, readiness, linkedMoc) };
  }

  async overview(tenantId: string, id: string, scope: Scope) {
    return this.get(tenantId, id, scope);
  }

  async update(tenantId: string, actorId: string, id: string, dto: Partial<CreatePssrDto>, scope: Scope) {
    const before = await this.get(tenantId, id, scope);
    if (finalStatuses.includes(before.status)) throw new BadRequestException('Closed or cancelled PSSR is read-only');
    const updated = await this.db.single<any>(this.db.from('pssrs').update({
      title: dto.title ?? before.title,
      description: dto.description ?? before.description,
      target_startup_at: dto.targetStartupAt ?? before.target_startup_at,
      coordinator_id: dto.coordinatorId ?? before.coordinator_id,
      startup_scope: dto.startupScope ?? before.startup_scope,
      startup_boundaries: dto.startupBoundaries ?? before.startup_boundaries,
      startup_hazards: dto.startupHazards ?? before.startup_hazards,
      startup_prerequisites: dto.startupPrerequisites ?? before.startup_prerequisites,
      temporary_controls: dto.temporaryControls ?? before.temporary_controls,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, before, actorId, 'UPDATE', 'PSSR_UPDATED', 'PSSR updated', before, updated);
    await this.audit.write({ tenantId, actorId, action: 'PSSR_UPDATED', entityType: 'PSSR', entityId: id, before: before as JsonValue, after: updated as JsonValue });
    return this.get(tenantId, id, scope);
  }

  async transition(tenantId: string, actorId: string, id: string, action: string, scope: Scope) {
    const before = await this.get(tenantId, id, scope);
    if (action === 'release-startup') await this.validateCertificateBeforeRelease(tenantId, id, scope);
    if (['start-preparation', 'start-review', 'start-field-verification', 'mark-ready-for-authorization'].includes(action) && before.current_certificate_id) {
      await this.supersedeCertificate(tenantId, actorId, id, before.current_certificate_id, scope, 'PSSR lifecycle changed after certificate issue');
    }
    const next = this.nextStatus(before, action);
    const patch: Record<string, any> = { status: next, updated_at: new Date().toISOString() };
    if (action === 'submit') patch.submitted_at = patch.updated_at;
    if (action === 'close') patch.closed_at = patch.updated_at;
    if (action === 'authorize-startup') patch.authorization_status = 'Authorized';
    if (action === 'release-startup') patch.readiness_status = 'Startup Released';
    const updated = await this.db.single<any>(this.db.from('pssrs').update(patch).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, before, actorId, 'LIFECYCLE', `PSSR_${action.toUpperCase().replaceAll('-', '_')}`, `PSSR moved to ${next}`, before, updated);
    await this.audit.write({ tenantId, actorId, action: `PSSR_${action.toUpperCase().replaceAll('-', '_')}`, entityType: 'PSSR', entityId: id, before: before as JsonValue, after: updated as JsonValue });
    return this.get(tenantId, id, scope);
  }

  async readinessCheck(tenantId: string, actorId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const summary = pssr.summary;
    const status = summary.blockersCount ? 'Blocked' : summary.readinessPercent >= 95 ? 'Ready' : 'Not Ready';
    const check = await this.db.single<any>(this.db.from('pssr_readiness_checks').insert({
      id: crypto.randomUUID(),
      pssr_id: id,
      tenant_id: tenantId,
      company_id: pssr.company_id,
      site_id: pssr.site_id,
      readiness_status: status,
      readiness_percent: summary.readinessPercent,
      checklist_status: `${summary.checklistCompletion}%`,
      document_status: `${summary.documentReadiness}%`,
      training_status: `${summary.trainingReadiness}%`,
      testing_status: `${summary.testingReadiness}%`,
      punch_status: `${summary.punchItemReadiness}%`,
      authorization_status: pssr.authorization_status,
      blockers_count: summary.blockersCount,
      checked_by: actorId
    }).select().single());
    await this.db.single<any>(this.db.from('pssrs').update({ readiness_status: status, readiness_percent: summary.readinessPercent, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, pssr, actorId, 'READINESS', 'PSSR_READINESS_CHECK', `Readiness check completed: ${status}`, null, check);
    return this.get(tenantId, id, scope);
  }

  async checklistTab(tenantId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const [evidence, verifications, history] = await Promise.all([
      this.safeMany<any>(this.db.from('pssr_checklist_item_evidence').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('uploaded_at', { ascending: false })),
      this.safeMany<any>(this.db.from('pssr_checklist_verifications').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('updated_at', { ascending: false })),
      this.safeMany<any>(this.db.from('pssr_checklist_history').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('created_at', { ascending: false }).limit(50))
    ]);
    return { pssrId: id, items: pssr.checklist, evidence, verifications, history, summary: this.checklistSummary(pssr.checklist, evidence, verifications), blockers: this.checklistBlockers(pssr.checklist) };
  }

  async checklistSummaryApi(tenantId: string, id: string, scope: Scope) {
    return (await this.checklistTab(tenantId, id, scope)).summary;
  }

  async regenerateChecklist(tenantId: string, actorId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const preview = await this.generatedChecklistPreview(tenantId, id, scope);
    const existing = new Set((pssr.checklist ?? []).map((item: any) => `${item.group_name}:${item.item_title}`));
    for (const item of preview) {
      const key = `${item.groupName}:${item.title}`;
      if (existing.has(key)) continue;
      await this.db.single(this.db.from('pssr_checklist_items').insert(this.checklistInsertPayload(tenantId, pssr, item, actorId)).select().single());
    }
    await this.checklistHistory(tenantId, pssr, null, actorId, 'CHECKLIST_REGENERATED', 'Checklist regenerated from PSSR context', null, { addedFromPreview: preview.length });
    await this.audit.write({ tenantId, actorId, action: 'PSSR_CHECKLIST_REGENERATED', entityType: 'PSSR', entityId: id, after: { previewCount: preview.length } as JsonValue });
    return this.checklistTab(tenantId, id, scope);
  }

  async addChecklistItem(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const item = await this.db.single<any>(this.db.from('pssr_checklist_items').insert({ id: crypto.randomUUID(), pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, group_name: dto.groupName ?? 'Other', item_title: dto.title ?? dto.itemTitle, item_description: dto.description ?? null, required: dto.required ?? true, required_before_startup: dto.requiredBeforeStartup ?? true, evidence_required: dto.evidenceRequired ?? false, verification_required: dto.verificationRequired ?? true, owner_id: dto.ownerId ?? null, due_date: dto.dueDate ?? null, source: dto.source ?? 'Manual', startup_blocking: dto.startupBlocking ?? true, created_by: actorId }).select().single());
    await this.checklistHistory(tenantId, pssr, item.id, actorId, 'CHECKLIST_ITEM_ADDED', 'Manual checklist item added', null, item);
    return this.checklistTab(tenantId, id, scope);
  }

  async patchChecklistItem(tenantId: string, actorId: string, id: string, itemId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const before = pssr.checklist.find((item: any) => item.id === itemId);
    if (!before) throw new NotFoundException('Checklist item not found');
    if (before.deletion_locked && (dto.required === false || dto.startupBlocking === false || dto.status === 'No Longer Required')) throw new BadRequestException('System-required OSHA or critical checklist item cannot be bypassed or marked no longer required');
    const patch = this.compact({
      item_title: dto.title ?? dto.itemTitle,
      item_description: dto.description,
      group_name: dto.groupName,
      required: dto.required,
      required_before_startup: dto.requiredBeforeStartup,
      evidence_required: dto.evidenceRequired,
      verification_required: dto.verificationRequired,
      owner_id: dto.ownerId,
      due_date: dto.dueDate,
      status: dto.status,
      startup_blocking: dto.startupBlocking,
      updated_at: new Date().toISOString()
    });
    const after = await this.db.single<any>(this.db.from('pssr_checklist_items').update(patch).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', itemId).select().single());
    await this.checklistHistory(tenantId, pssr, itemId, actorId, 'CHECKLIST_ITEM_UPDATED', 'Checklist item updated', before, after);
    return this.checklistTab(tenantId, id, scope);
  }

  async checklistAction(tenantId: string, actorId: string, id: string, itemId: string, action: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const item = pssr.checklist.find((row: any) => row.id === itemId);
    if (!item) throw new NotFoundException('Checklist item not found');
    if (['waive', 'not-applicable'].includes(action) && (item.bypass_locked || item.criticality_level === 'Critical' || item.regulatory_source === 'OSHA')) throw new BadRequestException('Critical or OSHA-required checklist item cannot be waived or bypassed');
    if (action === 'complete' && item.evidence_required && !['Uploaded', 'Accepted'].includes(item.evidence_status)) throw new BadRequestException('Evidence is required before completion');
    const statusMap: Record<string, string> = { complete: 'Completed', 'not-applicable': 'Not Applicable', fail: 'Failed', waive: 'Waived', 'request-verification': 'In Progress' };
    const patch: Record<string, any> = { status: statusMap[action] ?? item.status, updated_at: new Date().toISOString() };
    if (action === 'waive') Object.assign(patch, { waiver_reason: dto.reason ?? dto.comment ?? 'Waived by authorized user', waived_by: actorId, waived_at: patch.updated_at });
    if (action === 'request-verification') patch.verification_status = 'Pending';
    if (action === 'fail') patch.verification_status = 'Rejected';
    const after = await this.db.single<any>(this.db.from('pssr_checklist_items').update(patch).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', itemId).select().single());
    if (action === 'fail' && item.required_before_startup) await this.upsertBlocker(tenantId, pssr, 'Checklist', itemId, 'Failed checklist item', dto.reason ?? item.item_title, 'High');
    await this.checklistHistory(tenantId, pssr, itemId, actorId, `CHECKLIST_ITEM_${action.toUpperCase().replaceAll('-', '_')}`, `Checklist item ${action.replaceAll('-', ' ')}`, item, after);
    await this.recalculatePssrReadiness(tenantId, id);
    return this.checklistTab(tenantId, id, scope);
  }

  async checklistEvidence(tenantId: string, actorId: string, id: string, itemId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const item = pssr.checklist.find((row: any) => row.id === itemId);
    if (!item) throw new NotFoundException('Checklist item not found');
    const evidence = await this.db.single<any>(this.db.from('pssr_checklist_item_evidence').insert({ id: crypto.randomUUID(), pssr_id: id, checklist_item_id: itemId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, evidence_type: dto.evidenceType ?? 'File', file_name: dto.fileName ?? 'Evidence record', file_key: dto.fileKey ?? null, file_url: dto.fileUrl ?? null, mime_type: dto.mimeType ?? null, file_size: dto.fileSize ?? null, note: dto.note ?? null, uploaded_by: actorId }).select().single());
    await this.db.single(this.db.from('pssr_checklist_items').update({ evidence_status: 'Uploaded', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', itemId).select().single());
    await this.checklistHistory(tenantId, pssr, itemId, actorId, 'CHECKLIST_EVIDENCE_UPLOADED', 'Checklist evidence uploaded', null, evidence);
    return this.checklistTab(tenantId, id, scope);
  }

  async checklistVerification(tenantId: string, actorId: string, id: string, itemId: string, action: 'verify' | 'reject-verification', dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const item = pssr.checklist.find((row: any) => row.id === itemId);
    if (!item) throw new NotFoundException('Checklist item not found');
    const rejected = action === 'reject-verification';
    const row = await this.db.single<any>(this.db.from('pssr_checklist_verifications').insert({ id: crypto.randomUUID(), pssr_id: id, checklist_item_id: itemId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, status: rejected ? 'Rejected' : 'Verified', verified_by: rejected ? null : actorId, verified_at: rejected ? null : new Date().toISOString(), rejected_by: rejected ? actorId : null, rejected_at: rejected ? new Date().toISOString() : null, rejection_reason: rejected ? dto.reason ?? dto.comment ?? 'Rejected' : null, comment: dto.comment ?? null, ip_address: dto.ipAddress ?? null, user_agent: dto.userAgent ?? null }).select().single());
    await this.db.single(this.db.from('pssr_checklist_items').update({ verification_status: rejected ? 'Rejected' : 'Verified', status: rejected ? 'In Progress' : item.status, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', itemId).select().single());
    if (rejected && item.required_before_startup) await this.upsertBlocker(tenantId, pssr, 'Checklist', itemId, 'Rejected verification', dto.reason ?? item.item_title, 'High');
    await this.checklistHistory(tenantId, pssr, itemId, actorId, rejected ? 'CHECKLIST_VERIFICATION_REJECTED' : 'CHECKLIST_VERIFIED', rejected ? 'Checklist verification rejected' : 'Checklist item verified', item, row);
    await this.recalculatePssrReadiness(tenantId, id);
    return this.checklistTab(tenantId, id, scope);
  }

  async fieldVerificationTab(tenantId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const [header, equipment, checklist, evidence, signoffs] = await Promise.all([
      this.safeSingle<any>(this.db.from('pssr_field_verifications').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).maybeSingle()),
      this.safeMany<any>(this.db.from('pssr_equipment_verifications').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('equipment_tag_snapshot')),
      this.safeMany<any>(this.db.from('pssr_field_checklist_items').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('title')),
      this.safeMany<any>(this.db.from('pssr_field_evidence').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('uploaded_at', { ascending: false })),
      this.safeMany<any>(this.db.from('pssr_field_signoffs').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('signoff_role'))
    ]);
    const summary = this.fieldSummary(equipment, checklist, evidence, signoffs);
    return { pssrId: id, header, equipment, checklist, evidence, signoffs, summary, blockers: this.fieldBlockers(equipment, checklist, signoffs) };
  }

  async generateFieldVerification(tenantId: string, actorId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    await this.safeSingle(this.db.from('pssr_field_verifications').upsert({ id: `field_${id}`, pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, status: 'In Progress', updated_at: new Date().toISOString() }).select().single());
    const existing = await this.safeMany<any>(this.db.from('pssr_equipment_verifications').select('affected_equipment_id').eq('tenant_id', tenantId).eq('pssr_id', id));
    const existingIds = new Set(existing.map((row) => row.affected_equipment_id));
    for (const equipment of pssr.equipment ?? []) {
      if (existingIds.has(equipment.id)) continue;
      const verificationId = crypto.randomUUID();
      const critical = ['High', 'Critical', 'Safety Critical'].includes(equipment.equipment_criticality_snapshot);
      await this.db.single(this.db.from('pssr_equipment_verifications').insert({ id: verificationId, pssr_id: id, affected_equipment_id: equipment.id, equipment_id: equipment.equipment_id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, equipment_tag_snapshot: equipment.equipment_tag_snapshot, equipment_name_snapshot: equipment.equipment_name_snapshot, equipment_type_snapshot: equipment.equipment_type_snapshot, equipment_criticality_snapshot: equipment.equipment_criticality_snapshot, photo_required: critical }).select().single());
      for (const item of this.fieldChecklistTemplate(critical)) {
        await this.db.single(this.db.from('pssr_field_checklist_items').insert({ id: crypto.randomUUID(), pssr_id: id, equipment_verification_id: verificationId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, checklist_key: item.key, title: item.title, description: item.description, evidence_required: item.evidenceRequired, startup_blocking: item.startupBlocking }).select().single());
      }
    }
    for (const role of this.fieldSignoffRoles(pssr)) {
      await this.safeSingle(this.db.from('pssr_field_signoffs').upsert({ id: `signoff_${id}_${role.replace(/\W+/g, '_').toLowerCase()}`, pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, signoff_role: role, required: true }).select().single());
    }
    await this.history(tenantId, pssr, actorId, 'FIELD', 'PSSR_FIELD_VERIFICATION_GENERATED', 'Field verification records generated', null, { equipmentCount: pssr.equipment?.length ?? 0 });
    return this.fieldVerificationTab(tenantId, id, scope);
  }

  async patchFieldEquipment(tenantId: string, actorId: string, id: string, verificationId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const patch = this.compact({ status: dto.status, installation_status: dto.installationStatus, tag_verified: dto.tagVerified, qr_verified: dto.qrVerified, evidence_status: dto.evidenceStatus, failed_reason: dto.failedReason, updated_at: new Date().toISOString() });
    const after = await this.db.single<any>(this.db.from('pssr_equipment_verifications').update(patch).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', verificationId).select().single());
    await this.history(tenantId, pssr, actorId, 'FIELD', 'PSSR_FIELD_EQUIPMENT_UPDATED', 'Field equipment verification updated', null, after);
    return this.fieldVerificationTab(tenantId, id, scope);
  }

  async verifyFieldEquipment(tenantId: string, actorId: string, id: string, verificationId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const failed = Boolean(dto.failed);
    const after = await this.db.single<any>(this.db.from('pssr_equipment_verifications').update({ status: failed ? 'Failed' : 'Verified', installation_status: failed ? 'Mismatch' : 'Matches Design', tag_verified: !failed, evidence_status: dto.evidenceStatus ?? 'Uploaded', verified_by: failed ? null : actorId, verified_at: failed ? null : new Date().toISOString(), failed_reason: failed ? dto.reason ?? 'Field verification failed' : null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', verificationId).select().single());
    if (failed) await this.upsertBlocker(tenantId, pssr, 'Field Verification', verificationId, 'Field verification failed', dto.reason ?? after.equipment_tag_snapshot, 'High');
    await this.history(tenantId, pssr, actorId, 'FIELD', failed ? 'PSSR_FIELD_VERIFICATION_FAILED' : 'PSSR_FIELD_EQUIPMENT_VERIFIED', failed ? 'Field verification failed' : 'Equipment field verified', null, after);
    await this.recalculatePssrReadiness(tenantId, id);
    return this.fieldVerificationTab(tenantId, id, scope);
  }

  async patchFieldChecklist(tenantId: string, actorId: string, id: string, itemId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const after = await this.db.single<any>(this.db.from('pssr_field_checklist_items').update(this.compact({ status: dto.status, comment: dto.comment, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', itemId).select().single());
    if (['Fail', 'Needs Action'].includes(after.status) && after.startup_blocking) await this.upsertBlocker(tenantId, pssr, 'Field Verification', itemId, after.title, after.comment ?? 'Field checklist item requires action', 'High');
    await this.history(tenantId, pssr, actorId, 'FIELD', 'PSSR_FIELD_CHECKLIST_UPDATED', 'Field walkdown checklist updated', null, after);
    return this.fieldVerificationTab(tenantId, id, scope);
  }

  async fieldEvidence(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const evidence = await this.db.single<any>(this.db.from('pssr_field_evidence').insert({ id: crypto.randomUUID(), pssr_id: id, equipment_verification_id: dto.equipmentVerificationId ?? null, field_checklist_item_id: dto.fieldChecklistItemId ?? null, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, evidence_type: dto.evidenceType ?? 'Photo', file_name: dto.fileName ?? 'Field photo', file_key: dto.fileKey ?? null, file_url: dto.fileUrl ?? null, caption: dto.caption ?? null, gps_latitude: dto.gpsLatitude ?? null, gps_longitude: dto.gpsLongitude ?? null, uploaded_by: actorId }).select().single());
    if (dto.equipmentVerificationId) await this.safeSingle(this.db.from('pssr_equipment_verifications').update({ evidence_status: 'Uploaded', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', dto.equipmentVerificationId).select().single());
    await this.history(tenantId, pssr, actorId, 'FIELD', 'PSSR_FIELD_EVIDENCE_UPLOADED', 'Field evidence uploaded', null, evidence);
    return this.fieldVerificationTab(tenantId, id, scope);
  }

  async fieldSignoff(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const signoff = await this.db.single<any>(this.db.from('pssr_field_signoffs').upsert({ id: dto.signoffId ?? `signoff_${id}_${String(dto.role ?? 'field').replace(/\W+/g, '_').toLowerCase()}`, pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, signoff_role: dto.role ?? 'Field Verifier', required: dto.required ?? true, status: 'Signed', signed_by: actorId, signed_at: new Date().toISOString(), comment: dto.comment ?? null, ip_address: dto.ipAddress ?? null, user_agent: dto.userAgent ?? null, updated_at: new Date().toISOString() }).select().single());
    await this.history(tenantId, pssr, actorId, 'FIELD', 'PSSR_FIELD_SIGNED_OFF', 'Field verification signoff completed', null, signoff);
    return this.fieldVerificationTab(tenantId, id, scope);
  }

  async scanEquipment(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const tab = await this.fieldVerificationTab(tenantId, id, scope);
    const expected = tab.equipment.find((item: any) => item.id === dto.verificationId || item.equipment_id === dto.expectedEquipmentId);
    const matched = expected && [expected.equipment_id, expected.equipment_tag_snapshot].includes(dto.scannedValue);
    if (!matched && expected) await this.upsertBlocker(tenantId, await this.get(tenantId, id, scope), 'Field Verification', expected.id, 'Equipment tag mismatch', `Scanned ${dto.scannedValue}, expected ${expected.equipment_tag_snapshot}`, 'Critical');
    return { matched: Boolean(matched), expected, scannedValue: dto.scannedValue };
  }

  async documentReadinessTab(tenantId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const [requirements, readiness, verifications] = await Promise.all([
      this.safeMany<any>(this.db.from('pssr_document_requirements').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('document_type')),
      this.safeMany<any>(this.db.from('pssr_document_readiness').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('document_title')),
      this.safeMany<any>(this.db.from('pssr_document_verifications').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('updated_at', { ascending: false }))
    ]);
    return { pssrId: id, requirements, readiness, verifications, summary: this.documentSummary(requirements, readiness, verifications), blockers: this.documentBlockers(requirements, readiness, verifications) };
  }

  async generateDocumentReadiness(tenantId: string, actorId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const existing = await this.safeMany<any>(this.db.from('pssr_document_requirements').select('document_type').eq('tenant_id', tenantId).eq('pssr_id', id));
    const existingTypes = new Set(existing.map((row) => row.document_type));
    for (const doc of this.requiredDocumentTypes(pssr)) {
      if (existingTypes.has(doc.type)) continue;
      const requirement = await this.db.single<any>(this.db.from('pssr_document_requirements').insert({ id: crypto.randomUUID(), pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, document_type: doc.type, document_title: doc.title, required: true, required_before_startup: doc.blocking, source: doc.source, allow_justification: true }).select().single());
      await this.db.single(this.db.from('pssr_document_readiness').insert({ id: crypto.randomUUID(), pssr_id: id, requirement_id: requirement.id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, document_title: doc.title, required_version: 'Current approved', status: 'Missing', readiness_status: doc.blocking ? 'Blocked' : 'Pending', startup_blocking: doc.blocking }).select().single());
    }
    await this.history(tenantId, pssr, actorId, 'DOCUMENTS', 'PSSR_DOCUMENT_REQUIREMENTS_GENERATED', 'Document readiness requirements generated', null, { count: this.requiredDocumentTypes(pssr).length });
    return this.documentReadinessTab(tenantId, id, scope);
  }

  async linkDocument(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    if (!dto.readinessId) throw new BadRequestException('Document readiness row is required');
    const row = await this.db.single<any>(this.db.from('pssr_document_readiness').update({ controlled_document_id: dto.documentId ?? null, controlled_document_version_id: dto.documentVersionId ?? null, document_number: dto.documentNumber ?? null, document_title: dto.documentTitle ?? null, current_version: dto.currentVersion ?? null, status: dto.status ?? 'Current', readiness_status: 'Ready', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', dto.readinessId).select().single());
    await this.history(tenantId, pssr, actorId, 'DOCUMENTS', 'PSSR_DOCUMENT_LINKED', 'Controlled document linked to PSSR', null, row);
    await this.recalculatePssrReadiness(tenantId, id);
    return this.documentReadinessTab(tenantId, id, scope);
  }

  async unlinkDocument(tenantId: string, actorId: string, id: string, readinessId: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_document_readiness').update({ controlled_document_id: null, controlled_document_version_id: null, document_number: null, current_version: null, status: 'Missing', readiness_status: 'Blocked', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', readinessId).select().single());
    await this.history(tenantId, pssr, actorId, 'DOCUMENTS', 'PSSR_DOCUMENT_UNLINKED', 'Controlled document unlinked from PSSR', null, row);
    return this.documentReadinessTab(tenantId, id, scope);
  }

  async documentAction(tenantId: string, actorId: string, id: string, readinessId: string, action: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    if (action === 'request-revision') {
      const row = await this.db.single<any>(this.db.from('pssr_document_readiness').update({ status: 'Under Review', readiness_status: 'Pending Revision', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', readinessId).select().single());
      await this.history(tenantId, pssr, actorId, 'DOCUMENTS', 'PSSR_DOCUMENT_REVISION_REQUESTED', dto.reason ?? 'Document revision requested', null, row);
    } else if (action === 'justify-not-required') {
      const row = await this.db.single<any>(this.db.from('pssr_document_readiness').update({ status: 'Justified Not Required', readiness_status: 'Ready', startup_blocking: false, justification: dto.justification ?? dto.reason ?? 'Justified not required', justified_by: actorId, justified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', readinessId).select().single());
      await this.history(tenantId, pssr, actorId, 'DOCUMENTS', 'PSSR_DOCUMENT_JUSTIFIED_NOT_REQUIRED', 'Document justified not required', null, row);
    } else {
      const rejected = action === 'reject';
      const verification = await this.db.single<any>(this.db.from('pssr_document_verifications').insert({ id: crypto.randomUUID(), pssr_id: id, document_readiness_id: readinessId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, status: rejected ? 'Rejected' : 'Verified', verified_by: rejected ? null : actorId, verified_at: rejected ? null : new Date().toISOString(), rejected_by: rejected ? actorId : null, rejected_at: rejected ? new Date().toISOString() : null, rejection_reason: rejected ? dto.reason ?? 'Rejected' : null, comment: dto.comment ?? null }).select().single());
      await this.db.single(this.db.from('pssr_document_readiness').update({ readiness_status: rejected ? 'Blocked' : 'Ready', status: rejected ? 'Under Review' : 'Current', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', readinessId).select().single());
      await this.history(tenantId, pssr, actorId, 'DOCUMENTS', rejected ? 'PSSR_DOCUMENT_VERIFICATION_REJECTED' : 'PSSR_DOCUMENT_VERIFIED', rejected ? 'Document verification rejected' : 'Document readiness verified', null, verification);
    }
    await this.recalculatePssrReadiness(tenantId, id);
    return this.documentReadinessTab(tenantId, id, scope);
  }

  async trainingReadinessTab(tenantId: string, id: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    const [requirements, assignments, evidence, acknowledgements, briefings] = await Promise.all([
      this.safeMany<any>(this.db.from('pssr_training_requirements').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('created_at')),
      this.safeMany<any>(this.db.from('pssr_training_assignments').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('updated_at', { ascending: false })),
      this.safeMany<any>(this.db.from('pssr_training_evidence').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('uploaded_at', { ascending: false })),
      this.safeMany<any>(this.db.from('pssr_personnel_acknowledgements').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('updated_at', { ascending: false })),
      this.safeMany<any>(this.db.from('pssr_briefings').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('created_at', { ascending: false }))
    ]);
    const summary = this.trainingSummary(requirements, assignments, evidence, acknowledgements, briefings);
    return { pssrId: id, requirements, assignments, evidence, acknowledgements, briefings, roleReadiness: this.roleReadiness(assignments), summary, blockers: this.trainingBlockers(requirements, assignments, evidence, acknowledgements, briefings) };
  }

  async generateTrainingReadiness(tenantId: string, actorId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const existing = new Set((await this.safeMany<any>(this.db.from('pssr_training_requirements').select('source,title').eq('tenant_id', tenantId).eq('pssr_id', id))).map((row) => `${row.source}:${row.title}`));
    for (const item of this.trainingTemplates(pssr)) {
      const key = `${item.source}:${item.title}`;
      if (existing.has(key)) continue;
      const requirementId = crypto.randomUUID();
      await this.db.single<any>(this.db.from('pssr_training_requirements').insert({ id: requirementId, pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, title: item.title, description: item.description, training_type: item.type, source: item.source, required_before_startup: item.beforeStartup, required_before_closure: item.beforeClosure, evidence_required: item.evidence, verification_required: item.verify, due_date: item.dueDate, owner_id: pssr.coordinator_id, created_by: actorId }).select().single());
      for (const role of item.roles) {
        await this.safeSingle(this.db.from('pssr_training_assignments').insert({ id: crypto.randomUUID(), pssr_id: id, training_requirement_id: requirementId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, role_id: role, department_id: role, status: 'Assigned' }).select().single());
      }
    }
    for (const ack of ['Startup briefing', 'Toolbox talk', 'Control room briefing', 'Contractor briefing', 'Emergency response briefing']) {
      await this.safeSingle(this.db.from('pssr_personnel_acknowledgements').upsert({ id: `ack_${id}_${ack.replace(/\W+/g, '_').toLowerCase()}`, pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, acknowledgement_type: ack, status: 'Pending', required_before_startup: true, updated_at: new Date().toISOString() }).select().single());
    }
    await this.history(tenantId, pssr, actorId, 'TRAINING', 'PSSR_TRAINING_GENERATED', 'Training readiness requirements generated', null, { source: 'PSSR/MOC/Documents' });
    await this.audit.write({ tenantId, actorId, action: 'PSSR_TRAINING_GENERATED', entityType: 'PSSR', entityId: id, after: { id } as JsonValue });
    await this.recalculatePssrReadiness(tenantId, id);
    return this.trainingReadinessTab(tenantId, id, scope);
  }

  async addTrainingRequirement(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_training_requirements').insert({ id: crypto.randomUUID(), pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, title: dto.title, description: dto.description ?? null, training_type: dto.trainingType ?? 'General awareness', source: dto.source ?? 'Manual', required_role_id: dto.requiredRoleId ?? null, required_department_id: dto.requiredDepartmentId ?? null, required_before_startup: dto.requiredBeforeStartup ?? true, required_before_closure: dto.requiredBeforeClosure ?? false, evidence_required: dto.evidenceRequired ?? false, verification_required: dto.verificationRequired ?? true, due_date: dto.dueDate ?? null, owner_id: dto.ownerId ?? actorId, created_by: actorId }).select().single());
    await this.history(tenantId, pssr, actorId, 'TRAINING', 'PSSR_TRAINING_REQUIREMENT_ADDED', 'Training requirement added', null, row);
    return this.trainingReadinessTab(tenantId, id, scope);
  }

  async patchTrainingRequirement(tenantId: string, actorId: string, id: string, requirementId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_training_requirements').update(this.compact({ title: dto.title, description: dto.description, training_type: dto.trainingType, source: dto.source, required_role_id: dto.requiredRoleId, required_department_id: dto.requiredDepartmentId, required_before_startup: dto.requiredBeforeStartup, required_before_closure: dto.requiredBeforeClosure, evidence_required: dto.evidenceRequired, verification_required: dto.verificationRequired, due_date: dto.dueDate, owner_id: dto.ownerId, status: dto.status, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', requirementId).select().single());
    await this.history(tenantId, pssr, actorId, 'TRAINING', 'PSSR_TRAINING_REQUIREMENT_UPDATED', 'Training requirement updated', null, row);
    await this.recalculatePssrReadiness(tenantId, id);
    return this.trainingReadinessTab(tenantId, id, scope);
  }

  async deleteTrainingRequirement(tenantId: string, actorId: string, id: string, requirementId: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    await this.db.single<any>(this.db.from('pssr_training_requirements').delete().eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', requirementId).select().single());
    await this.history(tenantId, pssr, actorId, 'TRAINING', 'PSSR_TRAINING_REQUIREMENT_DELETED', 'Training requirement deleted', { requirementId }, null);
    await this.recalculatePssrReadiness(tenantId, id);
    return this.trainingReadinessTab(tenantId, id, scope);
  }

  async trainingEvidence(tenantId: string, actorId: string, id: string, assignmentId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const assignment = await this.db.single<any>(this.db.from('pssr_training_assignments').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', assignmentId).single());
    const evidence = await this.db.single<any>(this.db.from('pssr_training_evidence').insert({ id: crypto.randomUUID(), pssr_id: id, training_assignment_id: assignmentId, training_requirement_id: assignment.training_requirement_id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, evidence_type: dto.evidenceType ?? 'File', file_name: dto.fileName ?? 'Training evidence', file_key: dto.fileKey ?? null, file_url: dto.fileUrl ?? null, mime_type: dto.mimeType ?? null, file_size: dto.fileSize ?? null, note: dto.note ?? null, uploaded_by: actorId }).select().single());
    await this.history(tenantId, pssr, actorId, 'TRAINING', 'PSSR_TRAINING_EVIDENCE_UPLOADED', 'Training evidence uploaded', null, evidence);
    return this.trainingReadinessTab(tenantId, id, scope);
  }

  async trainingAssignmentAction(tenantId: string, actorId: string, id: string, assignmentId: string, action: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const now = new Date().toISOString();
    const patch: Record<string, any> = { updated_at: now };
    if (action === 'complete') Object.assign(patch, { status: 'Completed', completed_at: now });
    if (action === 'verify') Object.assign(patch, { status: 'Verified', verified_by: actorId, verified_at: now });
    if (action === 'reject') Object.assign(patch, { status: 'In Progress', rejected_by: actorId, rejected_at: now, rejection_reason: dto.reason ?? 'Rejected' });
    if (action === 'waive') Object.assign(patch, { status: 'Waived', waiver_reason: dto.reason ?? 'Waived by authorized user', waived_by: actorId, waived_at: now });
    if (action === 'reminder') Object.assign(patch, { reminder_count: dto.reminderCount ?? 1 });
    const row = await this.db.single<any>(this.db.from('pssr_training_assignments').update(patch).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', assignmentId).select().single());
    await this.history(tenantId, pssr, actorId, 'TRAINING', `PSSR_TRAINING_${action.toUpperCase()}`, `Training assignment ${action}`, null, row);
    await this.recalculatePssrReadiness(tenantId, id);
    return this.trainingReadinessTab(tenantId, id, scope);
  }

  async acknowledgementAction(tenantId: string, actorId: string, id: string, ackId: string, action: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const now = new Date().toISOString();
    const patch = action === 'waive'
      ? { status: 'Waived', waiver_reason: dto.reason ?? 'Waived by authorized user', waived_by: actorId, waived_at: now, updated_at: now }
      : { status: 'Acknowledged', acknowledged_by: actorId, acknowledged_at: now, comment: dto.comment ?? null, ip_address: dto.ipAddress ?? null, user_agent: dto.userAgent ?? null, updated_at: now };
    const row = await this.db.single<any>(this.db.from('pssr_personnel_acknowledgements').update(patch).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', ackId).select().single());
    await this.history(tenantId, pssr, actorId, 'TRAINING', action === 'waive' ? 'PSSR_ACKNOWLEDGEMENT_WAIVED' : 'PSSR_ACKNOWLEDGED', 'Personnel acknowledgement updated', null, row);
    await this.recalculatePssrReadiness(tenantId, id);
    return this.trainingReadinessTab(tenantId, id, scope);
  }

  async testingCommissioningTab(tenantId: string, id: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    const [requirements, records, evidence, verifications] = await Promise.all([
      this.safeMany<any>(this.db.from('pssr_test_requirements').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('test_category')),
      this.safeMany<any>(this.db.from('pssr_test_records').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('created_at')),
      this.safeMany<any>(this.db.from('pssr_test_evidence').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('uploaded_at', { ascending: false })),
      this.safeMany<any>(this.db.from('pssr_test_verifications').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('updated_at', { ascending: false }))
    ]);
    const summary = this.testingSummary(requirements, records, evidence, verifications);
    return { pssrId: id, requirements, records, evidence, verifications, sections: this.testingSections(requirements, records), summary, blockers: this.testingBlockers(requirements, records, evidence, verifications) };
  }

  async generateTestingCommissioning(tenantId: string, actorId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const existing = new Set((await this.safeMany<any>(this.db.from('pssr_test_requirements').select('source,test_title').eq('tenant_id', tenantId).eq('pssr_id', id))).map((row) => `${row.source}:${row.test_title}`));
    for (const item of this.testingTemplates(pssr)) {
      const key = `${item.source}:${item.title}`;
      if (existing.has(key)) continue;
      const req = await this.db.single<any>(this.db.from('pssr_test_requirements').insert({ id: crypto.randomUUID(), pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, test_category: item.category, test_title: item.title, description: item.description, source: item.source, system_name: item.system, owner_id: pssr.coordinator_id, due_date: item.dueDate, required_before_startup: item.beforeStartup, evidence_required: item.evidence, verification_required: item.verify, acceptance_criteria: item.criteria, startup_blocking: item.blocking, status: 'Not Started', created_by: actorId }).select().single());
      await this.safeSingle(this.db.from('pssr_test_records').insert({ id: crypto.randomUUID(), pssr_id: id, test_requirement_id: req.id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, test_number: await this.nextScopedNumber('pssr_test_records', 'test_number', id, 'TEST'), test_title: req.test_title, test_category: req.test_category, system_name: req.system_name, planned_at: item.plannedAt, status: 'Scheduled' }).select().single());
    }
    await this.history(tenantId, pssr, actorId, 'TESTING', 'PSSR_TESTING_GENERATED', 'Testing and commissioning requirements generated', null, { id });
    await this.audit.write({ tenantId, actorId, action: 'PSSR_TESTING_GENERATED', entityType: 'PSSR', entityId: id, after: { id } as JsonValue });
    await this.recalculatePssrReadiness(tenantId, id);
    return this.testingCommissioningTab(tenantId, id, scope);
  }

  async addTestRequirement(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_test_requirements').insert({ id: crypto.randomUUID(), pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, test_category: dto.testCategory ?? dto.category ?? 'Functional test', test_title: dto.testTitle ?? dto.title, description: dto.description ?? null, source: dto.source ?? 'Manual', equipment_id: dto.equipmentId ?? null, system_name: dto.systemName ?? null, owner_id: dto.ownerId ?? actorId, due_date: dto.dueDate ?? null, required_before_startup: dto.requiredBeforeStartup ?? true, evidence_required: dto.evidenceRequired ?? true, verification_required: dto.verificationRequired ?? true, acceptance_criteria: dto.acceptanceCriteria ?? null, startup_blocking: dto.startupBlocking ?? true, created_by: actorId }).select().single());
    await this.history(tenantId, pssr, actorId, 'TESTING', 'PSSR_TEST_REQUIREMENT_ADDED', 'Test requirement added', null, row);
    return this.testingCommissioningTab(tenantId, id, scope);
  }

  async patchTestRequirement(tenantId: string, actorId: string, id: string, requirementId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_test_requirements').update(this.compact({ test_category: dto.testCategory ?? dto.category, test_title: dto.testTitle ?? dto.title, description: dto.description, source: dto.source, equipment_id: dto.equipmentId, system_name: dto.systemName, owner_id: dto.ownerId, due_date: dto.dueDate, required_before_startup: dto.requiredBeforeStartup, evidence_required: dto.evidenceRequired, verification_required: dto.verificationRequired, acceptance_criteria: dto.acceptanceCriteria, startup_blocking: dto.startupBlocking, status: dto.status, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', requirementId).select().single());
    await this.history(tenantId, pssr, actorId, 'TESTING', 'PSSR_TEST_REQUIREMENT_UPDATED', 'Test requirement updated', null, row);
    return this.testingCommissioningTab(tenantId, id, scope);
  }

  async addTestRecord(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_test_records').insert({ id: crypto.randomUUID(), pssr_id: id, test_requirement_id: dto.testRequirementId ?? null, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, test_number: dto.testNumber ?? await this.nextScopedNumber('pssr_test_records', 'test_number', id, 'TEST'), test_title: dto.testTitle ?? dto.title, test_category: dto.testCategory ?? dto.category ?? 'Functional test', equipment_id: dto.equipmentId ?? null, system_name: dto.systemName ?? null, planned_at: dto.plannedAt ?? null, performed_by: dto.performedBy ?? null, status: dto.status ?? 'Scheduled' }).select().single());
    await this.history(tenantId, pssr, actorId, 'TESTING', 'PSSR_TEST_RECORD_CREATED', 'Test record created', null, row);
    return this.testingCommissioningTab(tenantId, id, scope);
  }

  async patchTestRecord(tenantId: string, actorId: string, id: string, testRecordId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_test_records').update(this.compact({ test_title: dto.testTitle ?? dto.title, test_category: dto.testCategory ?? dto.category, equipment_id: dto.equipmentId, system_name: dto.systemName, planned_at: dto.plannedAt, completed_at: dto.completedAt, performed_by: dto.performedBy, result: dto.result, result_details: dto.resultDetails, acceptance_criteria_met: dto.acceptanceCriteriaMet, status: dto.status, evidence_status: dto.evidenceStatus, verification_status: dto.verificationStatus, failure_reason: dto.failureReason, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', testRecordId).select().single());
    await this.history(tenantId, pssr, actorId, 'TESTING', 'PSSR_TEST_RECORD_UPDATED', 'Test record updated', null, row);
    return this.testingCommissioningTab(tenantId, id, scope);
  }

  async testRecordAction(tenantId: string, actorId: string, id: string, testRecordId: string, action: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const now = new Date().toISOString();
    const patch: Record<string, any> = { updated_at: now };
    if (action === 'pass') Object.assign(patch, { status: 'Passed', result: 'Passed', completed_at: now, performed_by: dto.performedBy ?? actorId, acceptance_criteria_met: true });
    if (action === 'fail') Object.assign(patch, { status: 'Failed', result: 'Failed', completed_at: now, performed_by: dto.performedBy ?? actorId, acceptance_criteria_met: false, failure_reason: dto.reason ?? 'Test failed', verification_status: 'Rejected' });
    if (action === 'request-verification') Object.assign(patch, { verification_status: 'Pending' });
    if (action === 'verify') Object.assign(patch, { verification_status: 'Verified' });
    if (action === 'reject') Object.assign(patch, { verification_status: 'Rejected', status: 'In Progress', failure_reason: dto.reason ?? 'Verification rejected' });
    if (action === 'waive') Object.assign(patch, { status: 'Waived', waiver_reason: dto.reason ?? 'Waived by authorized user', waived_by: actorId, waived_at: now });
    const row = await this.db.single<any>(this.db.from('pssr_test_records').update(patch).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', testRecordId).select().single());
    if (action === 'verify' || action === 'reject') await this.safeSingle(this.db.from('pssr_test_verifications').insert({ id: crypto.randomUUID(), pssr_id: id, test_record_id: testRecordId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, status: action === 'verify' ? 'Verified' : 'Rejected', verified_by: action === 'verify' ? actorId : null, verified_at: action === 'verify' ? now : null, rejected_by: action === 'reject' ? actorId : null, rejected_at: action === 'reject' ? now : null, rejection_reason: action === 'reject' ? dto.reason ?? 'Rejected' : null, comment: dto.comment ?? null }).select().single());
    if (action === 'fail') await this.addPunchItem(tenantId, actorId, id, { title: `Failed test: ${row.test_title}`, description: row.failure_reason, category: 'A', severity: 'High', sourceModule: 'Testing', sourceRecordId: testRecordId, startupBlocking: true, evidenceRequired: true, verificationRequired: true }, scope);
    await this.history(tenantId, pssr, actorId, 'TESTING', `PSSR_TEST_${action.toUpperCase()}`, `Test record ${action}`, null, row);
    await this.recalculatePssrReadiness(tenantId, id);
    return this.testingCommissioningTab(tenantId, id, scope);
  }

  async testEvidence(tenantId: string, actorId: string, id: string, testRecordId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const evidence = await this.db.single<any>(this.db.from('pssr_test_evidence').insert({ id: crypto.randomUUID(), pssr_id: id, test_record_id: testRecordId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, evidence_type: dto.evidenceType ?? 'Certificate', file_name: dto.fileName ?? 'Test evidence', file_key: dto.fileKey ?? null, file_url: dto.fileUrl ?? null, mime_type: dto.mimeType ?? null, file_size: dto.fileSize ?? null, note: dto.note ?? null, uploaded_by: actorId }).select().single());
    await this.safeSingle(this.db.from('pssr_test_records').update({ evidence_status: 'Uploaded', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', testRecordId).select().single());
    await this.history(tenantId, pssr, actorId, 'TESTING', 'PSSR_TEST_EVIDENCE_UPLOADED', 'Test evidence uploaded', null, evidence);
    return this.testingCommissioningTab(tenantId, id, scope);
  }

  async punchListTab(tenantId: string, id: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    const [items, links, evidence, verifications, deferrals] = await Promise.all([
      this.safeMany<any>(this.db.from('pssr_punch_items').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('created_at')),
      this.safeMany<any>(this.db.from('pssr_punch_item_links').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('created_at')),
      this.safeMany<any>(this.db.from('pssr_punch_item_evidence').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('uploaded_at', { ascending: false })),
      this.safeMany<any>(this.db.from('pssr_punch_item_verifications').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('updated_at', { ascending: false })),
      this.safeMany<any>(this.db.from('pssr_punch_item_deferrals').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('updated_at', { ascending: false }))
    ]);
    const summary = this.punchSummary(items, evidence, verifications, deferrals);
    return { pssrId: id, items, links, evidence, verifications, deferrals, summary, blockers: this.punchBlockers(items, evidence, verifications, deferrals), trafficLights: this.punchTrafficLights(items, evidence, verifications, deferrals) };
  }

  async syncPunchItems(tenantId: string, actorId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const [checklist, field, documents, training, testing] = await Promise.all([
      this.checklistTab(tenantId, id, scope).then((row) => row.blockers),
      this.fieldVerificationTab(tenantId, id, scope).then((row) => row.blockers),
      this.documentReadinessTab(tenantId, id, scope).then((row) => row.blockers),
      this.trainingReadinessTab(tenantId, id, scope).then((row) => row.blockers),
      this.testingCommissioningTab(tenantId, id, scope).then((row) => row.blockers)
    ]);
    const sources = [...checklist.map((b: any) => ({ ...b, module: 'Checklist' })), ...field.map((b: any) => ({ ...b, module: 'Field Verification' })), ...documents.map((b: any) => ({ ...b, module: 'Document Readiness' })), ...training.map((b: any) => ({ ...b, module: 'Training' })), ...testing.map((b: any) => ({ ...b, module: 'Testing' }))];
    for (const blocker of sources) {
      await this.addPunchItem(tenantId, actorId, id, { title: blocker.title, description: blocker.description, category: blocker.severity === 'High' || blocker.severity === 'Critical' ? 'A' : 'B', severity: blocker.severity ?? 'Medium', sourceModule: blocker.module, sourceRecordId: blocker.sourceId ?? blocker.id, startupBlocking: blocker.severity === 'High' || blocker.severity === 'Critical', evidenceRequired: true, verificationRequired: true }, scope);
    }
    await this.history(tenantId, pssr, actorId, 'PUNCH', 'PSSR_PUNCH_SYNCED', 'Punch items synced from startup blockers', null, { count: sources.length });
    return this.punchListTab(tenantId, id, scope);
  }

  async addPunchItem(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const sourceModule = dto.sourceModule ?? 'Manual';
    const sourceRecordId = dto.sourceRecordId ?? null;
    const existing = await this.safeSingle<any>(this.db.from('pssr_punch_items').select('id').eq('tenant_id', tenantId).eq('pssr_id', id).eq('source_module', sourceModule).eq('title', dto.title).maybeSingle());
    if (existing && sourceRecordId) return this.punchListTab(tenantId, id, scope);
    const row = await this.safeSingle<any>(this.db.from('pssr_punch_items').insert({ id: dto.id ?? crypto.randomUUID(), pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, punch_number: dto.punchNumber ?? await this.nextScopedNumber('pssr_punch_items', 'punch_number', id, 'PUNCH'), title: dto.title, description: dto.description ?? null, category: dto.category ?? 'B', source_module: sourceModule, source_record_id: sourceRecordId, related_equipment_id: dto.relatedEquipmentId ?? null, severity: dto.severity ?? 'Medium', owner_id: dto.ownerId ?? pssr.coordinator_id ?? actorId, due_date: dto.dueDate ?? null, priority: dto.priority ?? dto.severity ?? 'Medium', status: dto.status ?? 'Open', startup_blocking: dto.startupBlocking ?? dto.category === 'A', evidence_required: dto.evidenceRequired ?? true, verification_required: dto.verificationRequired ?? true, linked_action_id: dto.linkedActionId ?? null, created_by: actorId, updated_at: new Date().toISOString() }).select().single());
    if (row) await this.safeSingle(this.db.from('pssr_punch_item_links').upsert({ id: `punch_link_${row.id}`, pssr_id: id, punch_item_id: row.id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, source_module: row.source_module, source_record_id: row.source_record_id, linked_action_id: row.linked_action_id }).select().single());
    await this.recalculatePssrReadiness(tenantId, id);
    return this.punchListTab(tenantId, id, scope);
  }

  async patchPunchItem(tenantId: string, actorId: string, id: string, punchItemId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_punch_items').update(this.compact({ title: dto.title, description: dto.description, category: dto.category, source_module: dto.sourceModule, source_record_id: dto.sourceRecordId, related_equipment_id: dto.relatedEquipmentId, severity: dto.severity, owner_id: dto.ownerId, due_date: dto.dueDate, priority: dto.priority, status: dto.status, startup_blocking: dto.startupBlocking, evidence_required: dto.evidenceRequired, verification_required: dto.verificationRequired, linked_action_id: dto.linkedActionId, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', punchItemId).select().single());
    await this.history(tenantId, pssr, actorId, 'PUNCH', 'PSSR_PUNCH_UPDATED', 'Punch item updated', null, row);
    await this.recalculatePssrReadiness(tenantId, id);
    return this.punchListTab(tenantId, id, scope);
  }

  async punchEvidence(tenantId: string, actorId: string, id: string, punchItemId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const evidence = await this.db.single<any>(this.db.from('pssr_punch_item_evidence').insert({ id: crypto.randomUUID(), pssr_id: id, punch_item_id: punchItemId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, evidence_type: dto.evidenceType ?? 'File', file_name: dto.fileName ?? 'Punch evidence', file_key: dto.fileKey ?? null, file_url: dto.fileUrl ?? null, mime_type: dto.mimeType ?? null, file_size: dto.fileSize ?? null, note: dto.note ?? null, uploaded_by: actorId }).select().single());
    await this.history(tenantId, pssr, actorId, 'PUNCH', 'PSSR_PUNCH_EVIDENCE_UPLOADED', 'Punch evidence uploaded', null, evidence);
    return this.punchListTab(tenantId, id, scope);
  }

  async punchAction(tenantId: string, actorId: string, id: string, punchItemId: string, action: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const now = new Date().toISOString();
    const patch: Record<string, any> = { updated_at: now };
    if (action === 'request-verification') Object.assign(patch, { status: 'Pending Verification' });
    if (action === 'verify') Object.assign(patch, { status: 'Closed', closed_by: actorId, closed_at: now });
    if (action === 'reject') Object.assign(patch, { status: 'Rejected' });
    if (action === 'close') Object.assign(patch, { status: 'Closed', closed_by: actorId, closed_at: now });
    if (action === 'reopen') Object.assign(patch, { status: 'Open', closed_by: null, closed_at: null });
    const row = await this.db.single<any>(this.db.from('pssr_punch_items').update(patch).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', punchItemId).select().single());
    if (['verify', 'reject'].includes(action)) await this.safeSingle(this.db.from('pssr_punch_item_verifications').insert({ id: crypto.randomUUID(), pssr_id: id, punch_item_id: punchItemId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, status: action === 'verify' ? 'Verified' : 'Rejected', verified_by: action === 'verify' ? actorId : null, verified_at: action === 'verify' ? now : null, rejected_by: action === 'reject' ? actorId : null, rejected_at: action === 'reject' ? now : null, rejection_reason: action === 'reject' ? dto.reason ?? 'Rejected' : null, comment: dto.comment ?? null }).select().single());
    await this.history(tenantId, pssr, actorId, 'PUNCH', `PSSR_PUNCH_${action.toUpperCase().replaceAll('-', '_')}`, `Punch item ${action}`, null, row);
    await this.recalculatePssrReadiness(tenantId, id);
    return this.punchListTab(tenantId, id, scope);
  }

  async deferPunchItem(tenantId: string, actorId: string, id: string, punchItemId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const item = await this.db.single<any>(this.db.from('pssr_punch_items').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', punchItemId).single());
    if (item.category === 'A') throw new BadRequestException('Category A startup blockers cannot be deferred without special override');
    if (!dto.justification || !dto.riskAssessment || !dto.dueDateAfterStartup) throw new BadRequestException('Deferral justification, risk assessment, and due date are required');
    const deferral = await this.db.single<any>(this.db.from('pssr_punch_item_deferrals').insert({ id: crypto.randomUUID(), pssr_id: id, punch_item_id: punchItemId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, justification: dto.justification, risk_assessment: dto.riskAssessment, temporary_controls: dto.temporaryControls ?? null, approved_by: dto.approvedBy ?? actorId, approved_at: new Date().toISOString(), due_date_after_startup: dto.dueDateAfterStartup, startup_impact_statement: dto.startupImpactStatement ?? null, status: 'Approved' }).select().single());
    await this.db.single(this.db.from('pssr_punch_items').update({ status: 'Deferred', startup_blocking: false, due_date: dto.dueDateAfterStartup, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', punchItemId).select().single());
    await this.history(tenantId, pssr, actorId, 'PUNCH', 'PSSR_PUNCH_DEFERRED', 'Punch item deferred with risk acceptance', null, deferral);
    await this.recalculatePssrReadiness(tenantId, id);
    return this.punchListTab(tenantId, id, scope);
  }

  async startupAuthorizationTab(tenantId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const authorization = await this.ensureStartupAuthorization(tenantId, pssr);
    const [signatures, conditions, releaseEvents, history] = await Promise.all([
      this.safeMany<any>(this.db.from('pssr_authorization_signatures').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('created_at')),
      this.safeMany<any>(this.db.from('pssr_startup_conditions').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('created_at')),
      this.safeMany<any>(this.db.from('pssr_startup_release_events').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).order('created_at', { ascending: false })),
      this.safeMany<any>(this.db.from('pssr_history_events').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).eq('event_category', 'AUTHORIZATION').order('created_at', { ascending: false }))
    ]);
    const finalReadiness = await this.finalReadiness(tenantId, id, scope, signatures, conditions);
    return { pssrId: id, authorization, summary: finalReadiness.summary, checklist: finalReadiness.checklist, blockers: finalReadiness.blockers, signatures, conditions, releaseEvents, history, certificate: this.certificatePayload(pssr, authorization, signatures, conditions, finalReadiness.summary) };
  }

  async runFinalReadinessCheck(tenantId: string, actorId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const authorization = await this.ensureStartupAuthorization(tenantId, pssr);
    const tab = await this.startupAuthorizationTab(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_startup_authorizations').update({ ...this.authorizationPatchFromSummary(tab.summary), status: tab.blockers.length ? 'Blocked' : tab.summary.signaturesCompletedCount >= tab.summary.signaturesRequiredCount ? 'Ready Pending Release' : 'Ready Pending Signatures', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', authorization.id).select().single());
    await this.history(tenantId, pssr, actorId, 'AUTHORIZATION', 'PSSR_FINAL_READINESS_CHECK', `Final readiness check: ${row.status}`, authorization, row);
    await this.audit.write({ tenantId, actorId, action: 'PSSR_FINAL_READINESS_CHECK', entityType: 'PSSR', entityId: id, after: row as JsonValue });
    return this.startupAuthorizationTab(tenantId, id, scope);
  }

  async generateAuthorizationSignatures(tenantId: string, actorId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const authorization = await this.ensureStartupAuthorization(tenantId, pssr);
    for (const sig of this.authorizationSignatureTemplates(pssr)) {
      await this.safeSingle(this.db.from('pssr_authorization_signatures').upsert({ id: `sig_${id}_${sig.role.replace(/\W+/g, '_').toLowerCase()}`, pssr_id: id, authorization_id: authorization.id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, signature_role: sig.role, required_reason: sig.reason, status: 'Pending', updated_at: new Date().toISOString() }).select().single());
    }
    await this.history(tenantId, pssr, actorId, 'AUTHORIZATION', 'PSSR_AUTHORIZATION_SIGNATURES_GENERATED', 'Authorization signatures generated', null, { count: this.authorizationSignatureTemplates(pssr).length });
    return this.startupAuthorizationTab(tenantId, id, scope);
  }

  async authorizationSignatureAction(tenantId: string, actorId: string, id: string, signatureId: string, action: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const now = new Date().toISOString();
    const patch: Record<string, any> = { updated_at: now, comment: dto.comment ?? null, ip_address: dto.ipAddress ?? null, user_agent: dto.userAgent ?? null };
    if (action === 'sign') Object.assign(patch, { status: 'Signed', signed_by: actorId, signed_at: now });
    if (action === 'reject') {
      if (!dto.reason) throw new BadRequestException('Signature rejection requires a reason');
      Object.assign(patch, { status: 'Rejected', rejected_by: actorId, rejected_at: now, rejection_reason: dto.reason });
    }
    if (action === 'waive') {
      if (!dto.reason) throw new BadRequestException('Signature waiver requires written justification');
      Object.assign(patch, { status: 'Waived', comment: dto.reason });
    }
    const row = await this.db.single<any>(this.db.from('pssr_authorization_signatures').update(patch).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', signatureId).select().single());
    if (action === 'reject') await this.db.single(this.db.from('pssrs').update({ status: 'Returned For Correction', authorization_status: 'Returned For Correction', updated_at: now }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.history(tenantId, pssr, actorId, 'AUTHORIZATION', `PSSR_SIGNATURE_${action.toUpperCase()}`, `Authorization signature ${action}: ${row.signature_role}`, null, row);
    await this.audit.write({ tenantId, actorId, action: `PSSR_SIGNATURE_${action.toUpperCase()}`, entityType: 'PSSR_AUTHORIZATION_SIGNATURE', entityId: signatureId, after: row as JsonValue });
    return this.startupAuthorizationTab(tenantId, id, scope);
  }

  async addStartupCondition(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const authorization = await this.ensureStartupAuthorization(tenantId, pssr);
    const row = await this.db.single<any>(this.db.from('pssr_startup_conditions').insert({ id: crypto.randomUUID(), pssr_id: id, authorization_id: authorization.id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, condition_type: dto.conditionType ?? 'Startup Condition', description: dto.description, required: dto.required ?? true, owner_id: dto.ownerId ?? actorId, due_date: dto.dueDate ?? null, status: dto.status ?? 'Open', created_by: actorId }).select().single());
    await this.history(tenantId, pssr, actorId, 'AUTHORIZATION', 'PSSR_STARTUP_CONDITION_ADDED', 'Startup condition added', null, row);
    return this.startupAuthorizationTab(tenantId, id, scope);
  }

  async patchStartupCondition(tenantId: string, actorId: string, id: string, conditionId: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_startup_conditions').update(this.compact({ condition_type: dto.conditionType, description: dto.description, required: dto.required, owner_id: dto.ownerId, due_date: dto.dueDate, status: dto.status, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', conditionId).select().single());
    await this.history(tenantId, pssr, actorId, 'AUTHORIZATION', 'PSSR_STARTUP_CONDITION_UPDATED', 'Startup condition updated', null, row);
    return this.startupAuthorizationTab(tenantId, id, scope);
  }

  async deleteStartupCondition(tenantId: string, actorId: string, id: string, conditionId: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_startup_conditions').delete().eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', conditionId).select().single());
    await this.history(tenantId, pssr, actorId, 'AUTHORIZATION', 'PSSR_STARTUP_CONDITION_DELETED', 'Startup condition deleted', row, null);
    return this.startupAuthorizationTab(tenantId, id, scope);
  }

  async startupAuthorizationDecision(tenantId: string, actorId: string, id: string, action: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const authorization = await this.ensureStartupAuthorization(tenantId, pssr);
    const tab = await this.startupAuthorizationTab(tenantId, id, scope);
    const hardBlockers = tab.blockers.filter((item: any) => item.startupBlocking !== false && !String(item.title).includes('Required signature'));
    const now = new Date().toISOString();
    const patch: Record<string, any> = { updated_at: now };
    if (action === 'mark-ready') {
      if (hardBlockers.length) throw new BadRequestException('Cannot mark ready while hard startup blockers are open');
      Object.assign(patch, { status: 'Ready Pending Signatures', ready_for_authorization_at: now });
    }
    if (action === 'authorize') {
      if (tab.blockers.length) throw new BadRequestException('Cannot authorize startup while blockers or signatures are incomplete');
      Object.assign(patch, { status: 'Authorized For Startup', authorized_by: actorId, authorized_at: now });
    }
    if (action === 'release') {
      if (!['Authorized For Startup', 'Startup Released'].includes(authorization.status)) throw new BadRequestException('Startup must be authorized before release');
      Object.assign(patch, { status: 'Startup Released', released_by: actorId, released_at: now });
    }
    if (action === 'return-for-correction') Object.assign(patch, { status: 'Returned For Correction', returned_by: actorId, returned_at: now, return_reason: dto.reason ?? 'Returned for correction' });
    if (action === 'cancel') Object.assign(patch, { status: 'Cancelled', cancelled_by: actorId, cancelled_at: now, cancellation_reason: dto.reason ?? 'Cancelled' });
    const row = await this.db.single<any>(this.db.from('pssr_startup_authorizations').update(patch).eq('tenant_id', tenantId).eq('id', authorization.id).select().single());
    const pssrPatch: Record<string, any> = { authorization_status: row.status, updated_at: now };
    if (action === 'authorize') Object.assign(pssrPatch, { status: 'Authorized For Startup', authorized_by: actorId, authorized_at: now });
    if (action === 'release') Object.assign(pssrPatch, { status: 'Startup Released', readiness_status: 'Startup Released', released_by: actorId, released_at: now });
    if (action === 'return-for-correction') Object.assign(pssrPatch, { status: 'Returned For Correction' });
    if (action === 'cancel') Object.assign(pssrPatch, { status: 'Cancelled' });
    await this.safeSingle(this.db.from('pssrs').update(pssrPatch).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    if (action === 'release') await this.recordStartupRelease(tenantId, pssr, authorization.id, actorId, dto);
    await this.history(tenantId, pssr, actorId, 'AUTHORIZATION', `PSSR_AUTHORIZATION_${action.toUpperCase().replaceAll('-', '_')}`, `Startup authorization ${action.replaceAll('-', ' ')}`, authorization, row);
    await this.audit.write({ tenantId, actorId, action: `PSSR_AUTHORIZATION_${action.toUpperCase().replaceAll('-', '_')}`, entityType: 'PSSR_STARTUP_AUTHORIZATION', entityId: authorization.id, before: authorization as JsonValue, after: row as JsonValue });
    return this.startupAuthorizationTab(tenantId, id, scope);
  }

  async startupAuthorizationCertificate(tenantId: string, id: string, scope: Scope) {
    const tab = await this.startupAuthorizationTab(tenantId, id, scope);
    return { fileName: `${tab.certificate.pssrNumber}-startup-release-certificate.json`, content: tab.certificate };
  }

  async historyTab(tenantId: string, id: string, scope: Scope, filters: Record<string, any> = {}) {
    await this.get(tenantId, id, scope);
    let query = this.db.from('pssr_history_events').select('*').eq('tenant_id', tenantId).eq('pssr_id', id);
    if (filters.category) query = query.eq('event_category', filters.category);
    if (filters.event_type) query = query.eq('event_type', filters.event_type);
    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.safety_critical !== undefined) query = query.eq('is_safety_critical', String(filters.safety_critical) === 'true');
    if (filters.date_from) query = query.gte('created_at', filters.date_from);
    if (filters.date_to) query = query.lte('created_at', filters.date_to);
    if (filters.search) query = query.or(`event_title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    const limit = Math.min(Number(filters.limit ?? 100), 200);
    const page = Math.max(Number(filters.page ?? 1), 1);
    const events = await this.safeMany<any>(query.order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1));
    return { pssrId: id, events, summary: this.historySummary(events), filters: { ...filters, page, limit } };
  }

  async historyEvent(tenantId: string, id: string, eventId: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    const event = await this.db.single<any>(this.db.from('pssr_history_events').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', eventId).maybeSingle());
    if (!event) throw new NotFoundException('PSSR history event not found');
    return event;
  }

  async historyExport(tenantId: string, id: string, scope: Scope, filters: Record<string, any>, format: 'csv' | 'pdf') {
    const tab = await this.historyTab(tenantId, id, scope, { ...filters, limit: 200 });
    if (format === 'csv') {
      const header = 'created_at,event_category,event_type,event_title,user_id,is_safety_critical';
      const rows = tab.events.map((item: any) => [item.created_at, item.event_category, item.event_type, item.event_title, item.user_id, item.is_safety_critical].map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(','));
      return { fileName: `pssr-${id}-history.csv`, contentType: 'text/csv', content: [header, ...rows].join('\n') };
    }
    return { fileName: `pssr-${id}-history.json`, contentType: 'application/json', content: tab };
  }

  async attachmentsTab(tenantId: string, id: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    const attachments = await this.safeMany<any>(this.db.from('pssr_attachments').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).is('deleted_at', null).order('uploaded_at', { ascending: false }));
    const history = await this.safeMany<any>(this.db.from('pssr_history_events').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).eq('event_category', 'ATTACHMENTS').order('created_at', { ascending: false }).limit(20));
    return { pssrId: id, attachments, summary: this.attachmentSummary(attachments), history };
  }

  async addAttachment(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    this.validateAttachment(dto);
    const fileKey = dto.fileKey ?? `${pssr.company_id}/${pssr.site_id}/${id}/${dto.fileName}`;
    const row = await this.db.single<any>(this.db.from('pssr_attachments').insert({ id: crypto.randomUUID(), pssr_id: id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, attachment_type: dto.attachmentType ?? 'Other', file_name: dto.fileName, file_key: fileKey, file_url: dto.fileUrl ?? null, mime_type: dto.mimeType ?? null, file_size: dto.fileSize ?? null, description: dto.description ?? null, related_section: dto.relatedSection ?? null, related_record_type: dto.relatedRecordType ?? null, related_record_id: dto.relatedRecordId ?? null, document_id: dto.documentId ?? null, document_version_id: dto.documentVersionId ?? null, uploaded_by: actorId }).select().single());
    await this.history(tenantId, pssr, actorId, 'ATTACHMENTS', 'PSSR_ATTACHMENT_UPLOADED', `Attachment uploaded: ${row.file_name}`, null, row);
    await this.audit.write({ tenantId, actorId, action: 'PSSR_ATTACHMENT_UPLOADED', entityType: 'PSSR_ATTACHMENT', entityId: row.id, after: row as JsonValue });
    return this.attachmentsTab(tenantId, id, scope);
  }

  async attachment(tenantId: string, id: string, attachmentId: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_attachments').select('*').eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', attachmentId).is('deleted_at', null).maybeSingle());
    if (!row) throw new NotFoundException('PSSR attachment not found');
    return row;
  }

  async deleteAttachment(tenantId: string, actorId: string, id: string, attachmentId: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_attachments').update({ deleted_by: actorId, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', attachmentId).select().single());
    await this.history(tenantId, pssr, actorId, 'ATTACHMENTS', 'PSSR_ATTACHMENT_DELETED', `Attachment deleted: ${row.file_name}`, row, null);
    await this.audit.write({ tenantId, actorId, action: 'PSSR_ATTACHMENT_DELETED', entityType: 'PSSR_ATTACHMENT', entityId: attachmentId, before: row as JsonValue });
    return this.attachmentsTab(tenantId, id, scope);
  }

  async attachmentAccess(tenantId: string, actorId: string, id: string, attachmentId: string, scope: Scope, mode: 'preview' | 'download') {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.attachment(tenantId, id, attachmentId, scope);
    await this.history(tenantId, pssr, actorId, 'ATTACHMENTS', mode === 'download' ? 'PSSR_ATTACHMENT_DOWNLOADED' : 'PSSR_ATTACHMENT_PREVIEWED', `${mode} attachment: ${row.file_name}`, null, { id: row.id, file_name: row.file_name });
    return { ...row, mode, url: row.file_url, storageKey: row.file_key };
  }

  async linkAttachmentDocument(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('pssr_attachments').update({ document_id: dto.documentId, document_version_id: dto.documentVersionId ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('id', dto.attachmentId).select().single());
    await this.history(tenantId, pssr, actorId, 'ATTACHMENTS', 'PSSR_ATTACHMENT_LINKED_DOCUMENT', `Attachment linked to Document Control: ${row.file_name}`, null, row);
    return this.attachmentsTab(tenantId, id, scope);
  }

  async unlinkAttachmentDocument(tenantId: string, actorId: string, id: string, documentId: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    const rows = await this.safeMany<any>(this.db.from('pssr_attachments').update({ document_id: null, document_version_id: null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).eq('document_id', documentId).select());
    await this.history(tenantId, pssr, actorId, 'ATTACHMENTS', 'PSSR_ATTACHMENT_UNLINKED_DOCUMENT', 'Attachment unlinked from Document Control', { documentId }, { count: rows.length });
    return this.attachmentsTab(tenantId, id, scope);
  }

  async equipmentSearch(tenantId: string, scope: Scope, search = '') {
    let query = this.scopeCamel(this.db.from('Equipment').select('id,tag,name,type,criticality,siteId,unitId,areaId,status').eq('tenantId', tenantId), scope);
    if (search.trim()) query = query.or(`tag.ilike.%${search.trim()}%,name.ilike.%${search.trim()}%`);
    return this.db.many<any>(query.order('tag').limit(25));
  }

  async addEquipment(tenantId: string, actorId: string, id: string, dto: { equipmentId?: string; isPrimary?: boolean }, scope: Scope) {
    if (!dto.equipmentId) throw new BadRequestException('Equipment is required');
    const pssr = await this.get(tenantId, id, scope);
    const existing = await this.safeSingle<any>(this.db.from('pssr_affected_equipment').select('id').eq('tenant_id', tenantId).eq('pssr_id', id).eq('equipment_id', dto.equipmentId).maybeSingle());
    if (existing) return this.get(tenantId, id, scope);
    if (dto.isPrimary) {
      await this.db.many(this.db.from('pssr_affected_equipment').update({ is_primary: false, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('pssr_id', id).select('id'));
    }
    await this.saveEquipment(tenantId, pssr, dto.isPrimary ? dto.equipmentId : undefined, dto.isPrimary ? [] : [dto.equipmentId]);
    await this.history(tenantId, pssr, actorId, 'EQUIPMENT', 'PSSR_EQUIPMENT_ADDED', 'Affected equipment added to PSSR', null, dto);
    await this.audit.write({ tenantId, actorId, action: 'PSSR_EQUIPMENT_ADDED', entityType: 'PSSR', entityId: id, after: dto as JsonValue });
    return this.get(tenantId, id, scope);
  }

  async removeEquipment(tenantId: string, actorId: string, id: string, equipmentId: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    await this.db.many(this.db.from('pssr_affected_equipment').delete().eq('tenant_id', tenantId).eq('pssr_id', id).eq('equipment_id', equipmentId).select('id'));
    await this.history(tenantId, pssr, actorId, 'EQUIPMENT', 'PSSR_EQUIPMENT_REMOVED', 'Affected equipment removed from PSSR', { equipmentId }, null);
    await this.audit.write({ tenantId, actorId, action: 'PSSR_EQUIPMENT_REMOVED', entityType: 'PSSR', entityId: id, before: { equipmentId } as JsonValue });
    return this.get(tenantId, id, scope);
  }

  async generateChecklist(tenantId: string, actorId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    if (pssr.checklist?.length) return pssr;
    await this.generateChecklistAndBlockers(tenantId, pssr, pssr.linkedMoc?.moc);
    await this.history(tenantId, pssr, actorId, 'CHECKLIST', 'PSSR_CHECKLIST_GENERATED', 'PSSR checklist generated', null, { id });
    await this.audit.write({ tenantId, actorId, action: 'PSSR_CHECKLIST_GENERATED', entityType: 'PSSR', entityId: id, after: { id } as JsonValue });
    return this.get(tenantId, id, scope);
  }

  async syncLinkedMoc(tenantId: string, actorId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    if (!pssr.linkedMoc?.moc_id) throw new BadRequestException('No linked MOC found for this PSSR');
    await this.safeSingle(this.db.from('moc_pssr_requirements').upsert({
      id: `moc_pssr_${pssr.linkedMoc.moc_id}`,
      tenant_id: tenantId,
      company_id: pssr.company_id,
      site_id: pssr.site_id,
      moc_id: pssr.linkedMoc.moc_id,
      pssr_required: true,
      pssr_status: pssr.status,
      linked_pssr_id: pssr.id,
      updated_at: new Date().toISOString()
    }).select().single());
    await this.history(tenantId, pssr, actorId, 'MOC_SYNC', 'PSSR_LINKED_MOC_SYNCED', 'Linked MOC PSSR status synchronized', null, { mocId: pssr.linkedMoc.moc_id, status: pssr.status });
    return this.get(tenantId, id, scope);
  }

  async generatedChecklistPreview(tenantId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    return this.checklist.preview({ pssrType: pssr.pssr_type, startupType: pssr.startup_type, riskLevel: pssr.risk_level, moc: pssr.linkedMoc?.moc });
  }

  async startupBlockersPreview(tenantId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    return this.blockers.preview({ moc: pssr.linkedMoc?.moc, actions: pssr.linkedMoc?.actions ?? [], checklist: await this.generatedChecklistPreview(tenantId, id, scope) });
  }

  async linkedMocByPssr(tenantId: string, id: string) {
    return this.linkedMoc(tenantId, id);
  }

  async mocPssr(tenantId: string, mocId: string) {
    return this.existingForMoc(tenantId, mocId);
  }

  async report(tenantId: string, id: string, scope: Scope) {
    const pssr = await this.get(tenantId, id, scope);
    return { fileName: `${pssr.pssr_number}.json`, content: pssr };
  }

  private validateCreate(dto: CreatePssrDto) {
    if (!dto.title?.trim()) throw new BadRequestException('PSSR title is required');
    if (!dto.pssrType) throw new BadRequestException('PSSR type is required');
    if (!dto.siteId) throw new BadRequestException('Site is required');
    if (!dto.targetStartupAt) throw new BadRequestException('Target startup date is required');
    if (!dto.coordinatorId) throw new BadRequestException('PSSR coordinator is required');
    if (!dto.startupScope?.startupScopeDescription && !dto.startupScope?.whatIsBeingStarted) throw new BadRequestException('Startup scope is required');
  }

  private async moc(tenantId: string, mocId: string, scope: Scope) {
    const moc = await this.db.single<any>(this.scopeSnake(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', mocId), scope).maybeSingle());
    if (!moc) throw new NotFoundException('Linked MOC not found or you do not have access');
    return moc;
  }

  private async existingForMoc(tenantId: string, mocId: string) {
    const link = await this.safeSingle<any>(this.db.from('pssr_linked_mocs').select('*, pssr:pssrs(*)').eq('tenant_id', tenantId).eq('moc_id', mocId).maybeSingle());
    return link?.pssr ?? null;
  }

  private async linkMoc(tenantId: string, actorId: string, pssr: any, mocId: string, reason: string) {
    await this.db.single<any>(this.db.from('pssr_linked_mocs').insert({ id: crypto.randomUUID(), pssr_id: pssr.id, moc_id: mocId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, relationship_type: 'Trigger Source', trigger_reason: reason }).select().single());
    await this.safeSingle(this.db.from('moc_pssr_requirements').upsert({ id: `moc_pssr_${mocId}`, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, moc_id: mocId, pssr_required: true, pssr_status: pssr.status, linked_pssr_id: pssr.id, updated_at: new Date().toISOString() }).select().single());
    await this.safeSingle(this.db.from('moc_history_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, moc_id: mocId, event_type: 'PSSR_TRIGGERED', title: 'PSSR triggered from MOC', description: `${pssr.pssr_number} linked to this MOC`, actor_id: actorId }).select().single());
  }

  private async saveEquipment(tenantId: string, pssr: any, primaryId?: string, additional: string[] = []) {
    const ids = [primaryId, ...additional].filter(Boolean) as string[];
    if (!ids.length) return;
    const equipment = await this.safeMany<any>(this.db.from('Equipment').select('id,tag,name,type,criticality').eq('tenantId', tenantId).in('id', ids));
    for (const item of equipment) {
      await this.db.single(this.db.from('pssr_affected_equipment').insert({ id: crypto.randomUUID(), pssr_id: pssr.id, equipment_id: item.id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, is_primary: item.id === primaryId, equipment_tag_snapshot: item.tag, equipment_name_snapshot: item.name, equipment_type_snapshot: item.type, equipment_criticality_snapshot: item.criticality }).select().single());
    }
  }

  private async generateChecklistAndBlockers(tenantId: string, pssr: any, moc: any) {
    const actions = moc ? await this.safeMany<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', moc.id)) : [];
    const checklist = this.checklist.preview({ pssrType: pssr.pssr_type, startupType: pssr.startup_type, riskLevel: pssr.risk_level, moc });
    for (const item of checklist) {
      await this.db.single(this.db.from('pssr_checklist_items').insert(this.checklistInsertPayload(tenantId, pssr, item, pssr.created_by)).select().single());
    }
    for (const blocker of this.blockers.preview({ moc, actions, checklist })) {
      await this.db.single(this.db.from('pssr_startup_blockers').insert({ id: crypto.randomUUID(), pssr_id: pssr.id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, blocker_type: blocker.sourceModule, blocker_title: blocker.blockerTitle, blocker_description: blocker.blockerDescription, source_module: blocker.sourceModule, source_record_id: blocker.sourceRecordId ?? null, severity: blocker.severity, blocking: blocker.blocking, status: blocker.status }).select().single());
    }
  }

  private checklistInsertPayload(tenantId: string, pssr: any, item: any, actorId?: string | null) {
    return {
      id: crypto.randomUUID(),
      pssr_id: pssr.id,
      tenant_id: tenantId,
      company_id: pssr.company_id,
      site_id: pssr.site_id,
      group_name: item.groupName,
      item_title: item.title,
      item_description: item.description ?? item.itemDescription ?? null,
      required: item.required ?? true,
      required_before_startup: item.requiredBeforeStartup ?? true,
      evidence_required: item.evidenceRequired ?? false,
      verification_required: item.verificationRequired ?? true,
      source: item.source ?? 'System Generated',
      startup_blocking: item.startupAuthorizationBlocking ?? item.startupBlocking ?? item.requiredBeforeStartup ?? true,
      regulatory_source: item.regulatorySource ?? null,
      regulatory_reference: item.regulatoryReference ?? null,
      system_required: item.systemRequired ?? false,
      deletion_locked: item.deletionLocked ?? false,
      bypass_locked: item.bypassLocked ?? false,
      startup_authorization_blocking: item.startupAuthorizationBlocking ?? item.requiredBeforeStartup ?? false,
      certificate_required: item.certificateRequired ?? item.requiredBeforeStartup ?? false,
      criticality_level: item.criticalityLevel ?? 'Standard',
      bypass_allowed: item.bypassAllowed ?? false,
      deferral_allowed: item.deferralAllowed ?? true,
      management_acceptance_required: item.managementAcceptanceRequired ?? false,
      created_by: actorId ?? null
    };
  }

  private truthyImpact(impact: any, keys: string[]) {
    if (!impact) return false;
    return keys.some((key) => {
      const value = impact[key] ?? impact.answers?.[key] ?? impact.metadata?.[key];
      return value === true || value === 'Yes' || value === 'YES' || value === 'true';
    });
  }

  private async logMocAutoCreate(tenantId: string, moc: any, pssrId: string | null, reason: string, event: string, status: string, message: string) {
    await this.safeSingle(this.db.from('pssr_moc_auto_creation_logs').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, pssr_id: pssrId, trigger_reason: reason || 'Policy evaluation', trigger_event: event, status, message }).select().single());
  }

  private async resolvePssrRecord(tenantId: string, pssrId: string, recordType: string, recordId: string) {
    const table = recordType === 'punch' ? 'pssr_punch_items' : recordType === 'checklist' ? 'pssr_checklist_items' : null;
    if (!table) return null;
    return this.safeSingle<any>(this.db.from(table).select('*').eq('tenant_id', tenantId).eq('pssr_id', pssrId).eq('id', recordId).maybeSingle());
  }

  private async applyManagementAcceptance(tenantId: string, recordType: string, recordId: string, acceptanceId: string) {
    const table = recordType === 'punch' ? 'pssr_punch_items' : recordType === 'checklist' ? 'pssr_checklist_items' : null;
    if (!table) return;
    await this.safeSingle(this.db.from(table).update({ management_acceptance_id: acceptanceId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', recordId).select('id').single());
  }

  private async ensureAutoVerificationLinks(tenantId: string, pssr: any) {
    const templates = [
      ['P&ID readiness', 'Document Control', 'Approved'],
      ['SOP readiness', 'Document Control', 'Approved'],
      ['SDS / PSI readiness', 'Chemical Register', 'Current'],
      ['Training readiness', 'Training Matrix', 'Completed'],
      ['Safety systems testing', 'Mechanical Integrity', 'Passed'],
      ['HAZOP recommendations', 'HAZOP / PHA', 'Closed'],
      ['MOC required actions', 'Action Engine', 'Verified'],
      ['Temporary utilities / permanent system readiness', 'Field Verification', 'Verified'],
      ['Emergency shutdown', 'Mechanical Integrity', 'Passed']
    ];
    const existing = await this.safeMany<any>(this.db.from('pssr_auto_verification_links').select('verification_type').eq('tenant_id', tenantId).eq('pssr_id', pssr.id));
    const existingTypes = new Set(existing.map((row) => row.verification_type));
    for (const [verificationType, sourceModule, requiredStatus] of templates) {
      if (existingTypes.has(verificationType)) continue;
      await this.safeSingle(this.db.from('pssr_auto_verification_links').insert({ id: crypto.randomUUID(), pssr_id: pssr.id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, verification_type: verificationType, source_module: sourceModule, required_status: requiredStatus, startup_blocking: true }).select().single());
    }
  }

  private async evaluateAutoVerificationLink(tenantId: string, pssr: any, link: any) {
    if (link.verification_type === 'P&ID readiness' || link.verification_type === 'SOP readiness') {
      const docs = await this.safeMany<any>(this.db.from('pssr_document_readiness').select('*').eq('tenant_id', tenantId).eq('pssr_id', pssr.id));
      const relevant = docs.filter((row) => link.verification_type === 'P&ID readiness' ? /p&id|pid/i.test(`${row.document_type} ${row.document_title}`) : /sop|procedure/i.test(`${row.document_type} ${row.document_title}`));
      const failed = relevant.some((row) => !['Ready', 'Current'].includes(row.readiness_status) && !['Approved', 'Current', 'Justified Not Required'].includes(row.status));
      return { status: relevant.length && !failed ? 'Passed' : 'Failed', currentStatus: relevant.length ? (failed ? 'Not Ready' : 'Ready') : 'Missing', message: relevant.length ? (failed ? 'Required document is not approved/current' : 'Required document is approved/current') : 'Required document link not found' };
    }
    if (link.verification_type === 'Training readiness') return Number(pssr.training_readiness_percent ?? 0) >= 100 ? { status: 'Passed', currentStatus: 'Completed', message: 'Training readiness complete' } : { status: 'Failed', currentStatus: `${pssr.training_readiness_percent ?? 0}%`, message: 'Required startup training is incomplete' };
    if (link.verification_type === 'Safety systems testing' || link.verification_type === 'Emergency shutdown') return Number(pssr.testing_readiness_percent ?? 0) >= 100 ? { status: 'Passed', currentStatus: 'Passed', message: 'Required testing passed' } : { status: 'Failed', currentStatus: `${pssr.testing_readiness_percent ?? 0}%`, message: 'Safety/ESD testing is incomplete or failed' };
    if (link.verification_type === 'MOC required actions') {
      const openActions = pssr.linkedMoc?.actions?.filter((row: any) => row.required_before_startup && !['Completed', 'Closed', 'Verified'].includes(row.status)) ?? [];
      return openActions.length ? { status: 'Failed', currentStatus: `${openActions.length} open`, message: 'MOC required startup actions remain open' } : { status: 'Passed', currentStatus: 'Verified', message: 'MOC required startup actions are complete' };
    }
    return { status: 'Passed', currentStatus: link.required_status, message: 'Linked source status satisfies startup requirement' };
  }

  private disciplineChecklistTitles(discipline: string) {
    const map: Record<string, string[]> = {
      'Process / Mechanical Engineering': ['Design specifications verified', 'Mechanical completion verified', 'Equipment datasheets verified', 'Relief system verified', 'P&ID matches design'],
      Operations: ['Operating procedure ready', 'Startup procedure ready', 'Operators trained', 'Control room briefed', 'Operating limits understood', 'Area superintendent readiness confirmed'],
      'Maintenance / Inspection': ['Work complete', 'Equipment returned to specification', 'Inspection/test records complete', 'PM/inspection plan updated', 'LOTO removed/verified where applicable'],
      'Instrument / Electrical': ['Instrument calibration complete', 'Loop checks complete', 'SIS/DCS/BPCS changes tested', 'Alarm/interlock test complete', 'Electrical safety checks complete'],
      'HSE Manager': ['Safety requirements met', 'Emergency procedures ready', 'Hazard controls verified', 'PPE/emergency equipment ready', 'Regulatory checklist complete'],
      'Plant Manager Final Authorization': ['Final readiness reviewed', 'No critical blockers confirmed', 'Certificate generated and current', 'Final startup authorization confirmed']
    };
    return map[discipline] ?? ['Discipline readiness verified'];
  }

  private async recalculateDisciplineSignoff(tenantId: string, signoffId: string) {
    const items = await this.safeMany<any>(this.db.from('pssr_discipline_checklist_items').select('*').eq('tenant_id', tenantId).eq('signoff_id', signoffId));
    const required = items.filter((row) => row.required);
    const complete = required.filter((row) => ['Complete', 'Completed', 'Verified', 'Not Applicable'].includes(row.status));
    const blockers = required.filter((row) => row.startup_blocking && !['Complete', 'Completed', 'Verified', 'Not Applicable'].includes(row.status));
    await this.safeSingle(this.db.from('pssr_discipline_signoffs').update({ checklist_completion_percent: required.length ? Math.round((complete.length / required.length) * 100) : 100, blocking_items_count: blockers.length, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', signoffId).select('id').single());
  }

  private async startupCertificateReadiness(tenantId: string, pssr: any, scope: Scope) {
    const [auto, discipline, punch] = await Promise.all([this.autoVerifications(tenantId, pssr.id, scope), this.disciplineSignoffs(tenantId, pssr.id, scope), this.safeMany<any>(this.db.from('pssr_punch_items').select('*').eq('tenant_id', tenantId).eq('pssr_id', pssr.id))]);
    const blockers: string[] = [];
    const criticalChecklist = (pssr.checklist ?? []).filter((item: any) => (item.criticality_level === 'Critical' || item.regulatory_source === 'OSHA' || item.startup_authorization_blocking) && !['Completed', 'Verified', 'Not Applicable'].includes(item.status));
    if (criticalChecklist.length) blockers.push(`${criticalChecklist.length} critical/OSHA checklist items incomplete`);
    const failedAuto = auto.filter((row) => row.startup_blocking && row.verification_status !== 'Passed');
    if (failedAuto.length) blockers.push(`${failedAuto.length} auto-verification links not passed`);
    if (Number(pssr.document_readiness_percent ?? 0) < 100) blockers.push('Document readiness incomplete');
    if (Number(pssr.training_readiness_percent ?? 0) < 100) blockers.push('Training readiness incomplete');
    if (Number(pssr.testing_readiness_percent ?? 0) < 100) blockers.push('Testing readiness incomplete');
    const categoryA = punch.filter((row) => row.category === 'A' && this.isOpen(row.status));
    if (categoryA.length) blockers.push(`${categoryA.length} Category A punch items open`);
    const unsigned = discipline.signoffs.filter((row: any) => row.required && row.status !== 'Signed');
    if (unsigned.length) blockers.push(`${unsigned.length} required discipline signoffs missing`);
    return { ready: blockers.length === 0, blockers };
  }

  private async certificateDocumentPayload(tenantId: string, pssr: any, scope: Scope, version: number) {
    const [autoVerifications, discipline, acceptances] = await Promise.all([this.autoVerifications(tenantId, pssr.id, scope), this.disciplineSignoffs(tenantId, pssr.id, scope), this.managementAcceptances(tenantId, pssr.id, scope)]);
    return { version, issuedAt: new Date().toISOString(), pssr, oshaCore: (pssr.checklist ?? []).filter((item: any) => item.regulatory_reference === '1910.119(i)(1)'), checklist: pssr.checklist, blockers: pssr.blockers, autoVerifications, disciplineSignoffs: discipline.signoffs, disciplineChecklist: discipline.items, managementAcceptances: acceptances, linkedMoc: pssr.linkedMoc, equipment: pssr.equipment, summary: pssr.summary };
  }

  private async linkedMoc(tenantId: string, pssrId: string) {
    const link = await this.safeSingle<any>(this.db.from('pssr_linked_mocs').select('*').eq('tenant_id', tenantId).eq('pssr_id', pssrId).maybeSingle());
    if (!link) return null;
    const [moc, actions] = await Promise.all([
      this.safeSingle<any>(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', link.moc_id).maybeSingle()),
      this.safeMany<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', link.moc_id))
    ]);
    return { ...link, moc, actions };
  }

  private summaryFor(pssr: any, checklist: any[], blockers: any[], readiness: any[], linkedMoc: any) {
    const completedChecklist = checklist.filter((item) => ['Completed', 'Verified', 'Waived'].includes(item.status)).length;
    const openBlockers = blockers.filter((item) => item.blocking && !['Resolved', 'Closed', 'Waived'].includes(item.status));
    const category = (sev: string) => blockers.filter((item) => item.severity === sev && !['Resolved', 'Closed', 'Waived'].includes(item.status)).length;
    const checklistCompletion = checklist.length ? Math.round((completedChecklist / checklist.length) * 100) : pssr.checklist_completion_percent;
    const readinessPercent = Math.round((checklistCompletion + Number(pssr.document_readiness_percent) + Number(pssr.training_readiness_percent) + Number(pssr.testing_readiness_percent) + Number(pssr.punch_item_readiness_percent) + (pssr.authorization_status === 'Authorized' ? 100 : 0)) / 6);
    return { readinessPercent, checklistCompletion, blockersCount: openBlockers.length, categoryAOpen: category('Critical'), categoryBOpen: category('High'), categoryCOpen: category('Medium'), overduePunchItems: blockers.filter((item) => item.due_date && new Date(item.due_date).getTime() < Date.now()).length, missingEvidence: checklist.filter((item) => item.evidence_required && item.evidence_status !== 'Uploaded').length, pendingVerification: checklist.filter((item) => item.verification_required && item.verification_status !== 'Verified').length, documentReadiness: pssr.document_readiness_percent, trainingReadiness: pssr.training_readiness_percent, testingReadiness: pssr.testing_readiness_percent, punchItemReadiness: pssr.punch_item_readiness_percent, authorizationReadiness: pssr.authorization_status === 'Authorized' ? 100 : 0, linkedMocStartupBlockers: linkedMoc?.actions?.filter((item: any) => item.required_before_startup && !['Completed', 'Closed', 'Verified', 'Waived'].includes(item.status)).length ?? 0, latestReadinessCheck: readiness[0] ?? null };
  }

  private checklistSummary(items: any[], evidence: any[], verifications: any[]) {
    const required = items.filter((item) => item.required);
    const completed = items.filter((item) => ['Completed', 'Verified', 'Waived', 'Not Applicable'].includes(item.status));
    const evidenceRequired = items.filter((item) => item.evidence_required);
    const verificationRequired = items.filter((item) => item.verification_required);
    const evidenceMissing = evidenceRequired.filter((item) => !['Uploaded', 'Accepted'].includes(item.evidence_status));
    const verificationPending = verificationRequired.filter((item) => item.verification_status !== 'Verified');
    const blockers = this.checklistBlockers(items);
    const completionPercent = items.length ? Math.round((completed.length / items.length) * 100) : 0;
    const readinessStatus = blockers.length ? 'Blocked' : completionPercent === 100 ? 'Ready For Authorization' : completionPercent > 0 ? 'In Progress' : 'Not Started';
    return { totalItems: items.length, requiredItems: required.length, completedItems: completed.length, incompleteRequiredItems: required.length - required.filter((item) => ['Completed', 'Verified', 'Waived', 'Not Applicable'].includes(item.status)).length, evidenceRequiredCount: evidenceRequired.length, evidenceMissingCount: evidenceMissing.length, verificationRequiredCount: verificationRequired.length, verificationPendingCount: verificationPending.length, startupBlockingItemsCount: blockers.length, completionPercent, readinessStatus, evidenceRecords: evidence.length, verificationRecords: verifications.length };
  }

  private checklistBlockers(items: any[]) {
    const now = Date.now();
    return items.flatMap((item) => {
      const blockers: any[] = [];
      if (item.required && item.required_before_startup && !['Completed', 'Verified', 'Waived', 'Not Applicable'].includes(item.status)) blockers.push(this.blockerView(item, 'Required checklist item incomplete', 'High'));
      if (item.evidence_required && !['Uploaded', 'Accepted'].includes(item.evidence_status)) blockers.push(this.blockerView(item, 'Evidence missing', 'Medium'));
      if (item.verification_required && item.verification_status !== 'Verified') blockers.push(this.blockerView(item, 'Verification pending', 'Medium'));
      if (item.status === 'Failed') blockers.push(this.blockerView(item, 'Failed checklist item', 'High'));
      if (item.verification_status === 'Rejected') blockers.push(this.blockerView(item, 'Rejected verification', 'High'));
      if (item.status === 'Waived' && item.waiver_required && !item.waived_by) blockers.push(this.blockerView(item, 'Required item waived without approval', 'High'));
      if (item.due_date && new Date(item.due_date).getTime() < now && !['Completed', 'Verified', 'Waived', 'Not Applicable'].includes(item.status)) blockers.push(this.blockerView(item, 'Item overdue', 'Medium'));
      return blockers;
    });
  }

  private blockerView(item: any, title: string, severity: string) {
    return { id: `${item.id}_${title.replace(/\W+/g, '_')}`, sourceId: item.id, title, description: item.item_title ?? item.title ?? item.blocker_title, severity, status: item.status, startupBlocking: item.required_before_startup ?? item.startup_blocking ?? item.startup_blocking ?? true };
  }

  private fieldSummary(equipment: any[], checklist: any[], evidence: any[], signoffs: any[]) {
    const verifiedEquipment = equipment.filter((item) => item.status === 'Verified').length;
    const completedChecklist = checklist.filter((item) => ['Pass', 'Not Applicable'].includes(item.status)).length;
    const blockers = this.fieldBlockers(equipment, checklist, signoffs);
    const criticalNotVerified = equipment.filter((item) => ['High', 'Critical', 'Safety Critical'].includes(item.equipment_criticality_snapshot) && item.status !== 'Verified').length;
    const evidenceMissing = equipment.filter((item) => item.photo_required && item.evidence_status !== 'Uploaded').length + checklist.filter((item) => item.evidence_required && item.status !== 'Pass').length;
    const checklistCompletionPercent = checklist.length ? Math.round((completedChecklist / checklist.length) * 100) : 0;
    const status = blockers.length ? 'Blocked' : equipment.length && verifiedEquipment === equipment.length ? 'Ready' : verifiedEquipment || completedChecklist ? 'In Progress' : 'Not Started';
    return { totalEquipmentItems: equipment.length, verifiedEquipmentCount: verifiedEquipment, unverifiedEquipmentCount: equipment.length - verifiedEquipment, fieldChecklistCompletionPercent: checklistCompletionPercent, openFieldBlockers: blockers.length, criticalEquipmentNotVerified: criticalNotVerified, evidenceMissingCount: evidenceMissing, fieldVerificationStatus: status, evidenceCount: evidence.length, completedSignoffs: signoffs.filter((item) => item.status === 'Signed').length, requiredSignoffs: signoffs.filter((item) => item.required).length };
  }

  private fieldBlockers(equipment: any[], checklist: any[], signoffs: any[]) {
    const blockers: any[] = [];
    for (const item of equipment) {
      if (item.status !== 'Verified') blockers.push({ id: `${item.id}_unverified`, sourceId: item.id, title: 'Equipment not verified', description: item.equipment_tag_snapshot, severity: ['High', 'Critical'].includes(item.equipment_criticality_snapshot) ? 'High' : 'Medium' });
      if (item.status === 'Failed') blockers.push({ id: `${item.id}_failed`, sourceId: item.id, title: 'Field installation mismatch', description: item.failed_reason ?? item.equipment_tag_snapshot, severity: 'High' });
      if (!item.tag_verified && ['High', 'Critical', 'Safety Critical'].includes(item.equipment_criticality_snapshot)) blockers.push({ id: `${item.id}_tag`, sourceId: item.id, title: 'Tag/photo verification missing', description: item.equipment_tag_snapshot, severity: 'High' });
      if (item.photo_required && item.evidence_status !== 'Uploaded') blockers.push({ id: `${item.id}_photo`, sourceId: item.id, title: 'Photo evidence missing', description: item.equipment_tag_snapshot, severity: 'Medium' });
    }
    for (const item of checklist) {
      if (['Fail', 'Needs Action'].includes(item.status) && item.startup_blocking) blockers.push({ id: `${item.id}_walkdown`, sourceId: item.id, title: item.title, description: item.comment ?? 'Walkdown checklist requires action', severity: 'High' });
    }
    for (const item of signoffs.filter((row) => row.required && row.status !== 'Signed')) blockers.push({ id: `${item.id}_signoff`, sourceId: item.id, title: 'Field signoff missing', description: item.signoff_role, severity: 'Medium' });
    return blockers;
  }

  private fieldChecklistTemplate(critical: boolean) {
    return [
      ['correct_location', 'Equipment installed at correct location', true],
      ['tag_matches_pid', 'Equipment tag matches P&ID', true],
      ['tag_visible', 'Equipment tag physically visible', critical],
      ['nameplate_verified', 'Nameplate verified', critical],
      ['spec_matches_design', 'Equipment specification matches approved design', true],
      ['moc_verified', 'Materials of construction verified where applicable', critical],
      ['line_size_spec', 'Line size/spec matches design', true],
      ['flow_direction', 'Flow direction verified', true],
      ['access_egress', 'Access/egress clear', false],
      ['guards_installed', 'Guards installed', true],
      ['insulation_fireproofing', 'Insulation/fireproofing complete', false],
      ['earthing_grounding', 'Earthing/grounding verified', critical],
      ['drain_vent_bleed', 'Drain/vent/bleed points verified', false],
      ['relief_path_clear', 'Relief path clear', critical],
      ['construction_materials_removed', 'No temporary construction materials left', false],
      ['housekeeping', 'Housekeeping acceptable', false],
      ['area_ready', 'Area ready for startup', true]
    ].map(([key, title, evidenceRequired]) => ({ key, title, description: title, evidenceRequired: Boolean(evidenceRequired), startupBlocking: true }));
  }

  private fieldSignoffRoles(pssr: any) {
    const roles = ['Field Verifier', 'Operations Representative', 'Maintenance Representative'];
    if (['High', 'Critical'].includes(pssr.risk_level)) roles.push('Engineering Representative');
    if (pssr.pssr_type?.includes('Safety') || ['High', 'Critical'].includes(pssr.risk_level)) roles.push('HSE Representative');
    return roles;
  }

  private documentSummary(requirements: any[], readiness: any[], verifications: any[]) {
    const approved = readiness.filter((item) => ['Approved', 'Current', 'Justified Not Required'].includes(item.status) || item.readiness_status === 'Ready').length;
    const missing = readiness.filter((item) => item.status === 'Missing').length;
    const draft = readiness.filter((item) => ['Draft', 'Under Review'].includes(item.status)).length;
    const obsolete = readiness.filter((item) => ['Obsolete', 'Superseded'].includes(item.status)).length;
    const blockers = this.documentBlockers(requirements, readiness, verifications);
    const readinessPercent = readiness.length ? Math.round((approved / readiness.length) * 100) : 0;
    const status = blockers.length ? 'Blocked' : readinessPercent === 100 ? 'Complete' : readinessPercent > 0 ? 'In Progress' : 'Not Started';
    return { totalRequiredDocuments: requirements.filter((item) => item.required).length, approvedCurrentDocuments: approved, missingDocuments: missing, draftRevisionDocuments: draft, expiredObsoleteDocuments: obsolete, startupBlockingDocuments: blockers.length, readinessPercent, documentReadinessStatus: status, verificationRecords: verifications.length };
  }

  private documentBlockers(requirements: any[], readiness: any[], verifications: any[]) {
    return readiness.flatMap((item) => {
      const requirement = requirements.find((row) => row.id === item.requirement_id);
      const title = item.document_title ?? requirement?.document_title ?? item.document_type;
      const blockers: any[] = [];
      if (requirement?.required && item.status === 'Missing') blockers.push({ id: `${item.id}_missing`, sourceId: item.id, title: 'Required document missing', description: title, severity: 'High' });
      if (['Draft', 'Under Review'].includes(item.status)) blockers.push({ id: `${item.id}_approval`, sourceId: item.id, title: 'Document not approved', description: title, severity: 'Medium' });
      if (['Obsolete', 'Superseded'].includes(item.status)) blockers.push({ id: `${item.id}_obsolete`, sourceId: item.id, title: 'Document obsolete', description: title, severity: 'High' });
      if (item.required_version && item.current_version && item.required_version !== 'Current approved' && item.current_version !== item.required_version) blockers.push({ id: `${item.id}_version`, sourceId: item.id, title: 'Required version mismatch', description: title, severity: 'High' });
      if (!verifications.some((row) => row.document_readiness_id === item.id && row.status === 'Verified') && item.readiness_status !== 'Ready') blockers.push({ id: `${item.id}_verification`, sourceId: item.id, title: 'Document verification pending', description: title, severity: 'Medium' });
      if (item.status === 'Justified Not Required' && !item.justification) blockers.push({ id: `${item.id}_justification`, sourceId: item.id, title: 'Justification missing', description: title, severity: 'Medium' });
      return blockers;
    });
  }

  private requiredDocumentTypes(pssr: any) {
    const base = [
      ['P&ID', 'Affected P&ID drawings', true, 'MOC / Engineering Package'],
      ['SOP', 'Updated SOP / operating procedure', true, 'PSSR Type'],
      ['Startup procedure', 'Startup procedure', true, 'Site Policy'],
      ['Operating limits', 'Operating limits register', true, 'Risk Ranking'],
      ['Equipment datasheet', 'Equipment datasheet', true, 'Affected Equipment'],
      ['Emergency procedure', 'Emergency response procedure', false, 'Site Policy'],
      ['Inspection/test procedure', 'Inspection and test procedure', true, 'Testing & Commissioning'],
      ['Training material', 'Training material', false, 'Training']
    ];
    if (['High', 'Critical'].includes(pssr.risk_level)) base.push(['Design basis', 'Design basis / calculations', true, 'Risk Ranking'], ['Cause & effect', 'Cause and effect / safety logic', true, 'Safety System Impact']);
    if (pssr.startup_hazards?.toLowerCase?.().includes('chemical')) base.push(['SDS', 'SDS / chemical hazard data', true, 'PSI']);
    return base.map(([type, title, blocking, source]) => ({ type, title, blocking: Boolean(blocking), source }));
  }

  private async ensureStartupAuthorization(tenantId: string, pssr: any) {
    const existing = await this.safeSingle<any>(this.db.from('pssr_startup_authorizations').select('*').eq('tenant_id', tenantId).eq('pssr_id', pssr.id).maybeSingle());
    if (existing) return existing;
    return this.db.single<any>(this.db.from('pssr_startup_authorizations').insert({ id: `auth_${pssr.id}`, pssr_id: pssr.id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, status: pssr.authorization_status ?? 'Not Ready', target_startup_at: pssr.target_startup_at }).select().single());
  }

  private async finalReadiness(tenantId: string, id: string, scope: Scope, signatures: any[], conditions: any[]) {
    const pssr = await this.get(tenantId, id, scope);
    const [checklist, field, documents, training, testing, punch] = await Promise.all([
      this.checklistTab(tenantId, id, scope),
      this.fieldVerificationTab(tenantId, id, scope),
      this.documentReadinessTab(tenantId, id, scope),
      this.trainingReadinessTab(tenantId, id, scope),
      this.testingCommissioningTab(tenantId, id, scope),
      this.punchListTab(tenantId, id, scope)
    ]);
    const readinessRows = [
      ['PSSR checklist complete', checklist.summary.completionPercent, checklist.blockers.length],
      ['Field verification complete', field.summary.fieldVerificationStatus === 'Ready' ? 100 : field.summary.fieldChecklistCompletionPercent, field.blockers.length],
      ['Document readiness complete', documents.summary.readinessPercent, documents.blockers.length],
      ['Training complete', training.summary.completionPercent, training.blockers.length],
      ['Testing / commissioning complete', testing.summary.completionPercent, testing.blockers.length],
      ['Category A punch items closed', punch.summary.categoryAOpen ? 0 : 100, punch.summary.categoryAOpen],
      ['Category B punch items risk-accepted', punch.summary.categoryBOpen && !punch.deferrals?.length ? 50 : 100, punch.summary.categoryBOpen && !punch.deferrals?.length ? 1 : 0],
      ['Linked MOC startup blockers closed', pssr.summary.linkedMocStartupBlockers ? 0 : 100, pssr.summary.linkedMocStartupBlockers],
      ['Required approvals complete', 100, 0],
      ['Required signatures complete', signatures.length && signatures.some((item) => !['Signed', 'Waived', 'Not Required'].includes(item.status)) ? 0 : 100, signatures.filter((item) => !['Signed', 'Waived', 'Not Required'].includes(item.status)).length],
      ['Startup communication completed', training.acknowledgements?.some((item: any) => !['Acknowledged', 'Waived'].includes(item.status)) ? 0 : 100, 0],
      ['Emergency response readiness complete if required', 100, 0],
      ['Operating limits ready', documents.requirements?.some((item: any) => item.document_type === 'Operating limits') ? documents.summary.readinessPercent : 100, 0],
      ['Startup procedure ready', documents.requirements?.some((item: any) => item.document_type === 'Startup procedure') ? documents.summary.readinessPercent : 100, 0],
      ['Control room briefing complete', training.acknowledgements?.some((item: any) => String(item.acknowledgement_type).includes('Control room') && !['Acknowledged', 'Waived'].includes(item.status)) ? 0 : 100, 0]
    ];
    const checklistView = readinessRows.map(([label, percent, blockers]) => ({ label, percent, status: Number(blockers) ? 'Red' : Number(percent) >= 100 ? 'Green' : Number(percent) >= 80 ? 'Amber' : 'Red' }));
    const blockers = [
      ...checklist.blockers.map((b: any) => ({ ...b, sourceModule: 'Checklist & Verification', startupBlocking: true })),
      ...field.blockers.map((b: any) => ({ ...b, sourceModule: 'Equipment & Field Verification', startupBlocking: true })),
      ...documents.blockers.map((b: any) => ({ ...b, sourceModule: 'Document Readiness', startupBlocking: true })),
      ...training.blockers.map((b: any) => ({ ...b, sourceModule: 'Training & Personnel Readiness', startupBlocking: true })),
      ...testing.blockers.map((b: any) => ({ ...b, sourceModule: 'Testing & Commissioning', startupBlocking: true })),
      ...punch.blockers.map((b: any) => ({ ...b, sourceModule: 'Punch List / Actions', startupBlocking: true })),
      ...signatures.filter((item) => !['Signed', 'Waived', 'Not Required'].includes(item.status)).map((item) => ({ id: `${item.id}_signature`, sourceId: item.id, title: 'Required authorization signature missing', description: item.signature_role, severity: 'High', sourceModule: 'Workflow / Signatures', status: item.status, startupBlocking: true })),
      ...conditions.filter((item) => item.required && !['Closed', 'Complete', 'Waived'].includes(item.status)).map((item) => ({ id: `${item.id}_condition`, sourceId: item.id, title: 'Required startup condition open', description: item.description, severity: 'Medium', sourceModule: 'Site policy', status: item.status, startupBlocking: false }))
    ];
    const readinessPercent = Math.round((Number(checklist.summary.completionPercent) + Number(field.summary.fieldChecklistCompletionPercent) + Number(documents.summary.readinessPercent) + Number(training.summary.completionPercent) + Number(testing.summary.completionPercent) + Number(punch.summary.completionPercent)) / 6);
    const signaturesRequiredCount = signatures.filter((item) => item.status !== 'Not Required').length;
    const signaturesCompletedCount = signatures.filter((item) => ['Signed', 'Waived', 'Not Required'].includes(item.status)).length;
    const status = pssr.status === 'Startup Released' ? 'Startup Released' : blockers.some((item) => item.startupBlocking !== false) ? 'Blocked' : signaturesRequiredCount > signaturesCompletedCount ? 'Ready Pending Signatures' : pssr.authorization_status ?? 'Not Ready';
    return { checklist: checklistView, blockers, summary: { authorizationStatus: status, readinessPercent, checklistReadinessPercent: checklist.summary.completionPercent, fieldReadinessPercent: field.summary.fieldChecklistCompletionPercent, documentReadinessPercent: documents.summary.readinessPercent, trainingReadinessPercent: training.summary.completionPercent, testingReadinessPercent: testing.summary.completionPercent, punchReadinessPercent: punch.summary.completionPercent, blockersCount: blockers.filter((item) => item.startupBlocking !== false).length, categoryAOpenCount: punch.summary.categoryAOpen, categoryBAcceptedCount: punch.deferrals?.filter((item: any) => item.status === 'Approved').length ?? 0, signaturesRequiredCount, signaturesCompletedCount, targetStartupAt: pssr.target_startup_at, authorizedBy: pssr.authorized_by, authorizedAt: pssr.authorized_at, releasedBy: pssr.released_by, releasedAt: pssr.released_at } };
  }

  private authorizationPatchFromSummary(summary: any) {
    return { readiness_percent: summary.readinessPercent, checklist_readiness_percent: summary.checklistReadinessPercent, field_readiness_percent: summary.fieldReadinessPercent, document_readiness_percent: summary.documentReadinessPercent, training_readiness_percent: summary.trainingReadinessPercent, testing_readiness_percent: summary.testingReadinessPercent, punch_readiness_percent: summary.punchReadinessPercent, blockers_count: summary.blockersCount, category_a_open_count: summary.categoryAOpenCount, category_b_accepted_count: summary.categoryBAcceptedCount, signatures_required_count: summary.signaturesRequiredCount, signatures_completed_count: summary.signaturesCompletedCount, target_startup_at: summary.targetStartupAt };
  }

  private authorizationSignatureTemplates(pssr: any) {
    const roles: Array<[string, string]> = [
      ['PSSR Coordinator', 'Coordinator confirms PSSR package is complete'],
      ['Operations Representative', 'Operations accepts startup readiness and operating window'],
      ['Maintenance Representative', 'Maintenance confirms equipment and punch readiness'],
      ['Engineering Representative', 'Engineering confirms change and design readiness'],
      ['HSE Representative', 'HSE confirms safety and emergency readiness'],
      ['Area Owner', 'Area ownership accepts startup conditions'],
      ['Control Room Supervisor', 'Control room briefing and operating limits accepted'],
      ['Plant Manager / Startup Authorizer', 'Final startup authorization authority']
    ];
    if (String(pssr.startup_hazards ?? '').toLowerCase().includes('sis') || ['High', 'Critical'].includes(pssr.risk_level)) roles.push(['Instrument / Controls Engineer', 'SIS/DCS/BPCS or high-risk startup requires controls signoff']);
    if (String(pssr.startup_scope ?? '').toLowerCase().includes('contractor')) roles.push(['Contractor Representative', 'Contractor startup work requires representative acknowledgement']);
    return roles.map(([role, reason]) => ({ role, reason }));
  }

  private async recordStartupRelease(tenantId: string, pssr: any, authorizationId: string, actorId: string, dto: Record<string, any>) {
    const row = await this.safeSingle<any>(this.db.from('pssr_startup_release_events').insert({ id: crypto.randomUUID(), pssr_id: pssr.id, authorization_id: authorizationId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, event_type: 'STARTUP_RELEASED', description: dto.description ?? 'Startup released from PSSR authorization', released_by: actorId, released_at: new Date().toISOString(), metadata: dto }).select().single());
    if (pssr.linkedMoc?.moc_id) await this.safeSingle(this.db.from('moc_history_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, moc_id: pssr.linkedMoc.moc_id, event_type: 'PSSR_STARTUP_RELEASED', title: 'PSSR startup released', description: `${pssr.pssr_number} released startup`, actor_id: actorId }).select().single());
    for (const equipment of pssr.equipment ?? []) {
      await this.safeSingle(this.db.from('equipment_timeline_events').insert({ id: crypto.randomUUID(), tenantId, equipmentId: equipment.equipment_id, eventType: 'PSSR_STARTUP_RELEASED', title: 'PSSR startup released', description: `${pssr.pssr_number} released startup`, occurredAt: new Date().toISOString(), createdById: actorId }).select().single());
    }
    return row;
  }

  private certificatePayload(pssr: any, authorization: any, signatures: any[], conditions: any[], summary: any) {
    return { pssrNumber: pssr.pssr_number, title: pssr.title, linkedMoc: pssr.linkedMoc?.moc?.moc_number ?? pssr.linkedMoc?.moc_id ?? null, equipment: pssr.equipment, site: pssr.site, unit: pssr.unit, area: pssr.area, checklistReadiness: summary.checklistReadinessPercent, fieldReadiness: summary.fieldReadinessPercent, documentReadiness: summary.documentReadinessPercent, trainingReadiness: summary.trainingReadinessPercent, testingReadiness: summary.testingReadinessPercent, punchReadiness: summary.punchReadinessPercent, categoryBAccepted: summary.categoryBAcceptedCount, startupConditions: conditions, signatures, authorizedAt: authorization.authorized_at, releasedAt: authorization.released_at, readinessPercent: summary.readinessPercent };
  }

  private historySummary(events: any[]) {
    const byCategory = events.reduce((acc: Record<string, number>, item) => ({ ...acc, [item.event_category]: (acc[item.event_category] ?? 0) + 1 }), {});
    return { totalEvents: events.length, safetyCriticalEvents: events.filter((item) => item.is_safety_critical).length, latestEventAt: events[0]?.created_at ?? null, byCategory };
  }

  private attachmentSummary(attachments: any[]) {
    const totalSize = attachments.reduce((sum, item) => sum + Number(item.file_size ?? 0), 0);
    const byType = attachments.reduce((acc: Record<string, number>, item) => ({ ...acc, [item.attachment_type ?? 'Other']: (acc[item.attachment_type ?? 'Other'] ?? 0) + 1 }), {});
    return { totalAttachments: attachments.length, totalSize, linkedDocumentCount: attachments.filter((item) => item.document_id).length, latestUploadAt: attachments[0]?.uploaded_at ?? null, byType };
  }

  private validateAttachment(dto: Record<string, any>) {
    if (!dto.fileName) throw new BadRequestException('File name is required');
    const lower = String(dto.fileName).toLowerCase();
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.docx', '.xlsx', '.csv', '.txt'];
    if (!allowed.some((ext) => lower.endsWith(ext))) throw new BadRequestException('Unsupported attachment type');
    if (['.exe', '.bat', '.cmd', '.ps1', '.js', '.msi', '.com', '.scr'].some((ext) => lower.endsWith(ext))) throw new BadRequestException('Executable files are not allowed');
  }

  private trainingSummary(requirements: any[], assignments: any[], evidence: any[], acknowledgements: any[], briefings: any[]) {
    const completed = assignments.filter((item) => ['Completed', 'Verified', 'Waived', 'Not Required'].includes(item.status));
    const verified = assignments.filter((item) => item.status === 'Verified');
    const overdue = assignments.filter((item) => this.requirementFor(requirements, item)?.due_date && new Date(this.requirementFor(requirements, item).due_date).getTime() < Date.now() && !['Completed', 'Verified', 'Waived'].includes(item.status));
    const missingEvidence = assignments.filter((item) => this.requirementFor(requirements, item)?.evidence_required && !evidence.some((row) => row.training_assignment_id === item.id));
    const pendingAck = acknowledgements.filter((item) => item.required_before_startup && !['Acknowledged', 'Waived'].includes(item.status));
    const blockers = this.trainingBlockers(requirements, assignments, evidence, acknowledgements, briefings);
    const completionPercent = assignments.length ? Math.round((completed.length / assignments.length) * 100) : 0;
    const readinessStatus = blockers.length ? 'Blocked' : completionPercent === 100 ? 'Ready' : completionPercent > 0 ? 'In Progress' : 'Not Started';
    return { readinessStatus, trainingRequired: requirements.length > 0, totalRequiredTrainingRecords: requirements.length, completedTrainingRecords: completed.length, verifiedTrainingRecords: verified.length, overdueTrainingRecords: overdue.length, missingEvidenceCount: missingEvidence.length, requiredAcknowledgements: acknowledgements.filter((item) => item.required_before_startup).length, pendingAcknowledgements: pendingAck.length, startupBlockingTrainingCount: blockers.length, completionPercent, briefingCount: briefings.length, lastUpdatedBy: requirements[0]?.created_by ?? null, lastUpdatedAt: requirements[0]?.updated_at ?? null };
  }

  private trainingBlockers(requirements: any[], assignments: any[], evidence: any[], acknowledgements: any[], briefings: any[]) {
    const blockers: any[] = [];
    for (const assignment of assignments) {
      const req = this.requirementFor(requirements, assignment);
      if (!req?.required_before_startup) continue;
      if (!['Completed', 'Verified', 'Waived', 'Not Required'].includes(assignment.status)) blockers.push({ id: `${assignment.id}_incomplete`, sourceId: assignment.id, title: 'Required training incomplete', description: req?.title, severity: 'High' });
      if (req?.evidence_required && !evidence.some((row) => row.training_assignment_id === assignment.id)) blockers.push({ id: `${assignment.id}_evidence`, sourceId: assignment.id, title: 'Training evidence missing', description: req.title, severity: 'Medium' });
      if (req?.verification_required && assignment.status !== 'Verified' && assignment.status !== 'Waived') blockers.push({ id: `${assignment.id}_verify`, sourceId: assignment.id, title: 'Training verification pending', description: req.title, severity: 'Medium' });
      if (req?.due_date && new Date(req.due_date).getTime() < Date.now() && !['Completed', 'Verified', 'Waived'].includes(assignment.status)) blockers.push({ id: `${assignment.id}_overdue`, sourceId: assignment.id, title: 'Training overdue', description: req.title, severity: 'High' });
    }
    for (const ack of acknowledgements.filter((item) => item.required_before_startup && !['Acknowledged', 'Waived'].includes(item.status))) blockers.push({ id: `${ack.id}_ack`, sourceId: ack.id, title: 'Required acknowledgement pending', description: ack.acknowledgement_type, severity: 'High' });
    for (const briefing of briefings.filter((item) => item.required_before_startup && !['Completed', 'Sent', 'Waived'].includes(item.status))) blockers.push({ id: `${briefing.id}_briefing`, sourceId: briefing.id, title: 'Required briefing incomplete', description: briefing.title, severity: 'High' });
    return blockers;
  }

  private roleReadiness(assignments: any[]) {
    const roles = ['Operators', 'Board / Control Room Operators', 'Shift Supervisor', 'Maintenance Technician', 'Electrical / Instrument Technician', 'HSE Representative', 'Emergency Response Team', 'Contractors', 'PSSR Coordinator', 'Startup Authorizer'];
    return roles.map((role) => {
      const roleNeedle = role.toLowerCase().split(' ')[0] ?? role.toLowerCase();
      const rows = assignments.filter((item) => String(item.role_id ?? '').toLowerCase().includes(roleNeedle));
      const completed = rows.filter((item) => ['Completed', 'Verified', 'Waived'].includes(item.status)).length;
      const verified = rows.filter((item) => item.status === 'Verified').length;
      return { role, requiredCount: rows.length, completedCount: completed, verifiedCount: verified, pendingCount: Math.max(rows.length - completed, 0), startupBlocking: rows.some((item) => !['Completed', 'Verified', 'Waived'].includes(item.status)) };
    });
  }

  private requirementFor(requirements: any[], assignment: any) {
    return requirements.find((item) => item.id === assignment.training_requirement_id);
  }

  private testingSummary(requirements: any[], records: any[], evidence: any[], verifications: any[]) {
    const completed = records.filter((item) => ['Passed', 'Partially Passed', 'Waived', 'Not Applicable'].includes(item.status));
    const failed = records.filter((item) => item.status === 'Failed');
    const overdue = requirements.filter((item) => item.due_date && new Date(item.due_date).getTime() < Date.now() && !['Passed', 'Waived', 'Not Applicable'].includes(item.status));
    const evidenceMissing = records.filter((item) => this.testRequirementFor(requirements, item)?.evidence_required && !evidence.some((row) => row.test_record_id === item.id));
    const verificationPending = records.filter((item) => this.testRequirementFor(requirements, item)?.verification_required && item.verification_status !== 'Verified');
    const blockers = this.testingBlockers(requirements, records, evidence, verifications);
    const completionPercent = records.length ? Math.round((completed.length / records.length) * 100) : 0;
    const readinessStatus = failed.length ? 'Failed' : blockers.length ? 'Blocked' : completionPercent === 100 ? 'Ready' : completionPercent > 0 ? 'In Progress' : 'Not Started';
    return { readinessStatus, totalRequiredTests: requirements.length, completedTests: completed.length, failedTests: failed.length, overdueTests: overdue.length, evidenceMissingCount: evidenceMissing.length, verificationPendingCount: verificationPending.length, startupBlockingTestsCount: blockers.length, completionPercent, lastUpdatedBy: records[0]?.performed_by ?? requirements[0]?.created_by ?? null, lastUpdatedAt: records[0]?.updated_at ?? requirements[0]?.updated_at ?? null };
  }

  private testingBlockers(requirements: any[], records: any[], evidence: any[], verifications: any[]) {
    const blockers: any[] = [];
    for (const requirement of requirements.filter((item) => item.required_before_startup)) {
      const record = records.find((item) => item.test_requirement_id === requirement.id);
      if (!record) blockers.push({ id: `${requirement.id}_missing_record`, sourceId: requirement.id, title: 'Required test record missing', description: requirement.test_title, severity: requirement.startup_blocking ? 'High' : 'Medium' });
      if (record && !['Passed', 'Waived', 'Not Applicable'].includes(record.status)) blockers.push({ id: `${record.id}_not_passed`, sourceId: record.id, title: 'Required test not passed', description: record.test_title, severity: requirement.startup_blocking ? 'High' : 'Medium' });
      if (record?.status === 'Failed') blockers.push({ id: `${record.id}_failed`, sourceId: record.id, title: 'Failed test blocks startup', description: record.failure_reason ?? record.test_title, severity: 'High' });
      if (record && requirement.evidence_required && !evidence.some((row) => row.test_record_id === record.id)) blockers.push({ id: `${record.id}_evidence`, sourceId: record.id, title: 'Test evidence missing', description: record.test_title, severity: 'Medium' });
      if (record && requirement.verification_required && !verifications.some((row) => row.test_record_id === record.id && row.status === 'Verified') && record.verification_status !== 'Verified') blockers.push({ id: `${record.id}_verification`, sourceId: record.id, title: 'Test verification pending', description: record.test_title, severity: 'Medium' });
      if (record?.acceptance_criteria_met === false) blockers.push({ id: `${record.id}_acceptance`, sourceId: record.id, title: 'Acceptance criteria not met', description: record.test_title, severity: 'High' });
    }
    return blockers;
  }

  private testRequirementFor(requirements: any[], record: any) {
    return requirements.find((item) => item.id === record.test_requirement_id);
  }

  private testingSections(requirements: any[], records: any[]) {
    const groups = ['Safety System', 'Mechanical / Pressure', 'Electrical / Instrumentation', 'Process / Commissioning', 'Utilities / Support Systems'];
    return groups.map((name) => {
      const rows = requirements.filter((item) => this.testingSectionName(item.test_category) === name);
      const linkedRecords = records.filter((record) => rows.some((req) => req.id === record.test_requirement_id) || this.testingSectionName(record.test_category) === name);
      return { name, required: rows.length, completed: linkedRecords.filter((item) => ['Passed', 'Waived', 'Not Applicable'].includes(item.status)).length, failed: linkedRecords.filter((item) => item.status === 'Failed').length, records: linkedRecords };
    });
  }

  private testingSectionName(category: string) {
    const value = String(category ?? '').toLowerCase();
    if (/(sis|esd|fire|gas|alarm|interlock|effect|trip|safety)/.test(value)) return 'Safety System';
    if (/(hydro|pneumatic|leak|pressure|relief|flange|torque|rotation|vibration|guard|lubrication)/.test(value)) return 'Mechanical / Pressure';
    if (/(loop|instrument|continuity|insulation|mcc|cable|earthing|grounding|valve|analyzer|electrical)/.test(value)) return 'Electrical / Instrumentation';
    if (/(dry|wet|water|blowing|purge|flushing|trial|performance|sampling|operating envelope|commissioning)/.test(value)) return 'Process / Commissioning';
    return 'Utilities / Support Systems';
  }

  private punchSummary(items: any[], evidence: any[], verifications: any[], deferrals: any[]) {
    const open = items.filter((item) => !['Closed', 'Cancelled'].includes(item.status));
    const closed = items.filter((item) => item.status === 'Closed');
    const category = (cat: string) => open.filter((item) => item.category === cat).length;
    const missingEvidence = open.filter((item) => item.evidence_required && !evidence.some((row) => row.punch_item_id === item.id)).length;
    const pendingVerification = open.filter((item) => item.verification_required && !verifications.some((row) => row.punch_item_id === item.id && row.status === 'Verified')).length;
    const blockers = this.punchBlockers(items, evidence, verifications, deferrals);
    const completionPercent = items.length ? Math.round((closed.length / items.length) * 100) : 100;
    const punchReadinessStatus = blockers.length ? 'Startup Blocked' : open.length ? 'Open Non-Blocking' : 'Clear';
    return { totalPunchItems: items.length, categoryAOpen: category('A'), categoryBOpen: category('B'), categoryCOpen: category('C'), closedPunchItems: closed.length, overduePunchItems: open.filter((item) => item.due_date && new Date(item.due_date).getTime() < Date.now()).length, missingEvidence, pendingVerification, startupBlockersCount: blockers.length, completionPercent, punchReadinessStatus };
  }

  private punchBlockers(items: any[], evidence: any[], verifications: any[], deferrals: any[]) {
    return items.flatMap((item) => {
      const blockers: any[] = [];
      const open = !['Closed', 'Cancelled'].includes(item.status);
      const hasEvidence = evidence.some((row) => row.punch_item_id === item.id);
      const verified = verifications.some((row) => row.punch_item_id === item.id && row.status === 'Verified');
      const deferred = deferrals.some((row) => row.punch_item_id === item.id && row.status === 'Approved');
      if (open && item.category === 'A') blockers.push({ id: `${item.id}_cat_a`, sourceId: item.id, title: 'Category A startup blocker open', description: item.title, severity: 'High' });
      if (open && item.category === 'B' && !deferred && item.startup_blocking) blockers.push({ id: `${item.id}_cat_b`, sourceId: item.id, title: 'Category B requires risk acceptance', description: item.title, severity: 'Medium' });
      if (open && item.evidence_required && !hasEvidence) blockers.push({ id: `${item.id}_evidence`, sourceId: item.id, title: 'Punch evidence missing', description: item.title, severity: 'Medium' });
      if (open && item.verification_required && !verified && item.status === 'Pending Verification') blockers.push({ id: `${item.id}_verify`, sourceId: item.id, title: 'Punch verification pending', description: item.title, severity: 'Medium' });
      if (open && item.due_date && new Date(item.due_date).getTime() < Date.now()) blockers.push({ id: `${item.id}_overdue`, sourceId: item.id, title: 'Punch item overdue', description: item.title, severity: 'Medium' });
      return blockers;
    });
  }

  private punchTrafficLights(items: any[], evidence: any[], verifications: any[], deferrals: any[]) {
    const blockers = this.punchBlockers(items, evidence, verifications, deferrals);
    const has = (needle: string) => blockers.some((item) => item.title.includes(needle));
    const openB = items.some((item) => item.category === 'B' && !['Closed', 'Cancelled'].includes(item.status));
    return [
      { label: 'Category A', status: has('Category A') ? 'Red' : 'Green' },
      { label: 'Category B accepted', status: openB ? (deferrals.some((item) => item.status === 'Approved') ? 'Amber' : 'Red') : 'Green' },
      { label: 'Evidence', status: has('evidence') ? 'Red' : 'Green' },
      { label: 'Verification', status: has('verification') ? 'Amber' : 'Green' },
      { label: 'Overdue items', status: has('overdue') ? 'Red' : 'Green' },
      { label: 'Owner assignment', status: items.some((item) => !item.owner_id) ? 'Amber' : 'Green' },
      { label: 'Risk acceptance', status: openB ? (deferrals.length ? 'Amber' : 'Red') : 'Gray' }
    ];
  }

  private trainingTemplates(pssr: any) {
    const dueDate = pssr.target_startup_at ? new Date(pssr.target_startup_at).toISOString().slice(0, 10) : null;
    const base = [
      { title: 'Startup procedure training', description: 'Train affected operators on approved startup procedure and boundaries.', type: 'Startup procedure training', source: 'PSSR', roles: ['Operators', 'Shift Supervisor'], beforeStartup: true, beforeClosure: false, evidence: true, verify: true, dueDate },
      { title: 'Control room briefing', description: 'Brief board operators on alarms, interlocks, operating limits, and startup sequence.', type: 'Control room briefing', source: 'Operating limit change', roles: ['Board / Control Room Operators'], beforeStartup: true, beforeClosure: false, evidence: true, verify: true, dueDate },
      { title: 'Maintenance procedure briefing', description: 'Brief maintenance team on equipment changes, LOTO removal, and startup support duties.', type: 'Maintenance procedure training', source: 'Equipment change', roles: ['Maintenance Technician', 'Electrical / Instrument Technician'], beforeStartup: true, beforeClosure: false, evidence: false, verify: true, dueDate },
      { title: 'HSE and emergency response briefing', description: 'Confirm emergency controls and response expectations before startup.', type: 'Emergency procedure training', source: 'Site policy', roles: ['HSE Representative', 'Emergency Response Team'], beforeStartup: true, beforeClosure: false, evidence: false, verify: true, dueDate }
    ];
    if (pssr.linkedMoc) base.push({ title: 'MOC communication acknowledgement', description: 'Acknowledge linked MOC startup impacts and controls.', type: 'Equipment change briefing', source: 'MOC', roles: ['Operators', 'Contractors'], beforeStartup: true, beforeClosure: true, evidence: true, verify: true, dueDate });
    return base;
  }

  private testingTemplates(pssr: any) {
    const dueDate = pssr.target_startup_at ? new Date(pssr.target_startup_at).toISOString().slice(0, 10) : null;
    const plannedAt = pssr.target_startup_at ?? null;
    return [
      { title: 'SIS / interlock proof test', category: 'SIS proof test', description: 'Verify safety instrumented functions, interlocks, trips, and cause & effect response.', source: 'Safety system impact', system: 'SIS / ESD', dueDate, plannedAt, beforeStartup: true, evidence: true, verify: true, criteria: 'All startup-critical SIF and interlock responses pass independently verified test steps.', blocking: true },
      { title: 'Fire and gas alarm test', category: 'Fire & gas test', description: 'Validate fire and gas detection, annunciation, and shutdown interface where applicable.', source: 'Site policy', system: 'Fire & Gas', dueDate, plannedAt, beforeStartup: true, evidence: true, verify: true, criteria: 'Detector response, alarm, and executive actions match approved cause & effect.', blocking: true },
      { title: 'Leak / pressure integrity test', category: 'Leak test', description: 'Confirm pressure boundary integrity before introducing process material.', source: 'Engineering package', system: 'Process piping', dueDate, plannedAt, beforeStartup: true, evidence: true, verify: true, criteria: 'No visible leak and pressure hold meets approved test procedure.', blocking: true },
      { title: 'Instrument loop and calibration check', category: 'Loop check', description: 'Verify transmitter, final element, and DCS loop response for startup-critical instruments.', source: 'Equipment Registry', system: 'Instrumentation', dueDate, plannedAt, beforeStartup: true, evidence: true, verify: true, criteria: 'Loop response and calibration certificates are current and within tolerance.', blocking: true },
      { title: 'Dry commissioning and utility readiness', category: 'Dry run', description: 'Confirm utilities, flushing/blowing, dry run, and support system readiness.', source: 'Startup type', system: 'Utilities', dueDate, plannedAt, beforeStartup: true, evidence: false, verify: true, criteria: 'Utilities available and dry commissioning checklist completed.', blocking: false }
    ];
  }

  private async nextScopedNumber(table: string, column: string, pssrId: string, prefix: string) {
    const rows = await this.safeMany<any>(this.db.from(table).select(column).eq('pssr_id', pssrId));
    return `${prefix}-${String(rows.length + 1).padStart(3, '0')}`;
  }

  private async recalculatePssrReadiness(tenantId: string, id: string) {
    const [checklist, documents, trainingReqs, trainingAssignments, trainingEvidence, acks, briefings, testReqs, testRecords, testEvidence, testVerifications, punchItems, punchEvidence, punchVerifications, punchDeferrals] = await Promise.all([
      this.safeMany<any>(this.db.from('pssr_checklist_items').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_document_readiness').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_training_requirements').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_training_assignments').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_training_evidence').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_personnel_acknowledgements').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_briefings').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_test_requirements').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_test_records').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_test_evidence').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_test_verifications').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_punch_items').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_punch_item_evidence').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_punch_item_verifications').select('*').eq('tenant_id', tenantId).eq('pssr_id', id)),
      this.safeMany<any>(this.db.from('pssr_punch_item_deferrals').select('*').eq('tenant_id', tenantId).eq('pssr_id', id))
    ]);
    const checklistSummary = this.checklistSummary(checklist, [], []);
    const documentSummary = this.documentSummary([], documents, []);
    const trainingSummary = this.trainingSummary(trainingReqs, trainingAssignments, trainingEvidence, acks, briefings);
    const testingSummary = this.testingSummary(testReqs, testRecords, testEvidence, testVerifications);
    const punchSummary = this.punchSummary(punchItems, punchEvidence, punchVerifications, punchDeferrals);
    await this.safeSingle(this.db.from('pssrs').update({ checklist_completion_percent: checklistSummary.completionPercent, document_readiness_percent: documentSummary.readinessPercent, training_readiness_percent: trainingSummary.completionPercent, testing_readiness_percent: testingSummary.completionPercent, punch_item_readiness_percent: punchSummary.completionPercent, training_readiness_status: trainingSummary.readinessStatus, testing_readiness_status: testingSummary.readinessStatus, punch_readiness_status: punchSummary.punchReadinessStatus, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
  }

  private async checklistHistory(tenantId: string, pssr: any, itemId: string | null, userId: string, type: string, title: string, before: any, after: any) {
    await this.safeSingle(this.db.from('pssr_checklist_history').insert({ id: crypto.randomUUID(), pssr_id: pssr.id, checklist_item_id: itemId, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, event_type: type, title, description: title, before_value: before ?? null, after_value: after ?? null, user_id: userId }).select().single());
    await this.history(tenantId, pssr, userId, 'CHECKLIST', type, title, before, after);
  }

  private async upsertBlocker(tenantId: string, pssr: any, sourceModule: string, sourceRecordId: string, title: string, description: string, severity: string) {
    await this.safeSingle(this.db.from('pssr_startup_blockers').upsert({ id: `blocker_${pssr.id}_${sourceRecordId}_${title.replace(/\W+/g, '_').toLowerCase()}`, pssr_id: pssr.id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, blocker_type: sourceModule, blocker_title: title, blocker_description: description, source_module: sourceModule, source_record_id: sourceRecordId, severity, blocking: true, status: 'Open', updated_at: new Date().toISOString() }).select().single());
  }

  private applyPssrFilters(query: any, filters: Record<string, any>) {
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.pssr_type) query = query.eq('pssr_type', filters.pssr_type);
    if (filters.startup_type) query = query.eq('startup_type', filters.startup_type);
    if (filters.readiness_status) query = query.eq('readiness_status', filters.readiness_status);
    if (filters.site_id) query = query.eq('site_id', filters.site_id);
    if (filters.unit_id) query = query.eq('unit_id', filters.unit_id);
    if (filters.area_id) query = query.eq('area_id', filters.area_id);
    if (filters.coordinator_id) query = query.eq('coordinator_id', filters.coordinator_id);
    if (filters.target_startup_from) query = query.gte('target_startup_at', filters.target_startup_from);
    if (filters.target_startup_to) query = query.lte('target_startup_at', filters.target_startup_to);
    if (filters.date_from) query = query.gte('created_at', filters.date_from);
    if (filters.date_to) query = query.lte('created_at', filters.date_to);
    if (filters.startup_released === 'true') query = query.eq('status', 'Startup Released');
    if (filters.closed === 'true') query = query.eq('status', 'Closed');
    if (filters.search) {
      const value = String(filters.search).replace(/[,%*()]/g, ' ').trim();
      if (value) query = query.or(`pssr_number.ilike.%${value}%,title.ilike.%${value}%,description.ilike.%${value}%,pssr_type.ilike.%${value}%,status.ilike.%${value}%`);
    }
    return query;
  }

  private dashboardSort(filters: Record<string, any>) {
    const raw = String(filters.sort ?? '-updated_at');
    const descending = raw.startsWith('-');
    const column = raw.replace(/^-/, '');
    const allowed = new Set(['updated_at', 'created_at', 'target_startup_at', 'pssr_number', 'status', 'readiness_percent', 'risk_level']);
    return { column: allowed.has(column) ? column : 'updated_at', ascending: !descending };
  }

  private dashboardRow(pssr: any, byPssr: { blockers: Map<string, any[]>; punch: Map<string, any[]>; deferrals: Map<string, any[]>; documents: Map<string, any[]>; trainingReqs: Map<string, any[]>; trainingAssignments: Map<string, any[]>; testReqs: Map<string, any[]>; testRecords: Map<string, any[]>; signatures: Map<string, any[]>; mocs: Map<string, any[]>; equipment: Map<string, any[]> }, siteMap: Map<any, any>, unitMap: Map<any, any>, areaMap: Map<any, any>, userMap: Map<any, any>) {
    const blockers = byPssr.blockers.get(pssr.id) ?? [];
    const punch = byPssr.punch.get(pssr.id) ?? [];
    const deferrals = byPssr.deferrals.get(pssr.id) ?? [];
    const documents = byPssr.documents.get(pssr.id) ?? [];
    const trainingReqs = byPssr.trainingReqs.get(pssr.id) ?? [];
    const trainingAssignments = byPssr.trainingAssignments.get(pssr.id) ?? [];
    const testReqs = byPssr.testReqs.get(pssr.id) ?? [];
    const testRecords = byPssr.testRecords.get(pssr.id) ?? [];
    const signatures = byPssr.signatures.get(pssr.id) ?? [];
    const mocs = byPssr.mocs.get(pssr.id) ?? [];
    const equipment = byPssr.equipment.get(pssr.id) ?? [];
    const openBlockers = blockers.filter((row) => this.isOpen(row.status));
    const categoryAOpen = punch.filter((row) => row.category === 'A' && this.isOpen(row.status));
    const categoryBDeferred = deferrals.filter((row) => ['Approved', 'Deferred', 'Accepted'].includes(row.status));
    const missingDocuments = documents.filter((row) => ['Blocked', 'Missing', 'Pending Revision', 'Under Review'].includes(row.readiness_status ?? row.status));
    const missingTraining = trainingReqs.filter((row) => row.required_before_startup !== false).length - trainingAssignments.filter((row) => ['Completed', 'Verified'].includes(row.status)).length;
    const failedTests = testRecords.filter((row) => ['Failed', 'Rejected'].includes(row.result_status ?? row.status)).length + testReqs.filter((row) => row.status === 'Failed').length;
    const authorizationPending = signatures.filter((row) => this.isOpen(row.status)).length;
    const primaryEquipment = equipment.find((row) => row.is_primary) ?? equipment[0] ?? null;
    const readinessPercent = Number(pssr.readiness_percent ?? this.average([pssr.checklist_completion_percent, pssr.document_readiness_percent, pssr.training_readiness_percent, pssr.testing_readiness_percent, pssr.punch_item_readiness_percent]));
    const readinessStatus = this.readinessStatus(pssr.status, readinessPercent, openBlockers.length, authorizationPending);
    return {
      ...pssr,
      siteName: siteMap.get(pssr.site_id) ?? pssr.site_id ?? '-',
      unitName: unitMap.get(pssr.unit_id) ?? pssr.unit_id ?? '-',
      areaName: areaMap.get(pssr.area_id) ?? pssr.area_id ?? '-',
      coordinatorName: userMap.get(pssr.coordinator_id) ?? '-',
      primaryEquipmentTag: primaryEquipment?.equipment_tag_snapshot ?? primaryEquipment?.equipment_id ?? '-',
      primaryEquipmentName: primaryEquipment?.equipment_name_snapshot ?? '-',
      linkedMocId: mocs[0]?.moc_id ?? pssr.moc_id ?? null,
      linkedMocNumber: mocs[0]?.moc_number_snapshot ?? mocs[0]?.moc_id ?? '-',
      linkedMocRiskLevel: mocs[0]?.risk_level_snapshot ?? pssr.linked_moc_risk_level ?? pssr.risk_level ?? 'Medium',
      readinessPercent,
      readinessStatus,
      openBlockersCount: openBlockers.length,
      criticalBlockersCount: openBlockers.filter((row) => ['Critical', 'High'].includes(row.severity)).length,
      categoryAOpenCount: categoryAOpen.length,
      categoryBDeferredCount: categoryBDeferred.length,
      missingDocumentsCount: Math.max(missingDocuments.length, Number(pssr.document_readiness_percent ?? 100) < 100 ? 1 : 0),
      missingTrainingCount: Math.max(missingTraining, Number(pssr.training_readiness_percent ?? 100) < 100 ? 1 : 0),
      failedTestsCount: failedTests,
      authorizationPendingCount: authorizationPending,
      checklistCompletionPercent: Number(pssr.checklist_completion_percent ?? 0),
      documentReadinessPercent: Number(pssr.document_readiness_percent ?? 0),
      trainingReadinessPercent: Number(pssr.training_readiness_percent ?? 0),
      testingReadinessPercent: Number(pssr.testing_readiness_percent ?? 0),
      punchReadinessPercent: Number(pssr.punch_item_readiness_percent ?? 0)
    };
  }

  private applyDashboardDerivedFilters(rows: any[], filters: Record<string, any>) {
    let output = [...rows];
    if (filters.equipment_id) output = output.filter((row) => row.primaryEquipmentTag === filters.equipment_id || row.primaryEquipmentName === filters.equipment_id);
    if (filters.linked_moc_id) output = output.filter((row) => row.linkedMocId === filters.linked_moc_id || row.linkedMocNumber === filters.linked_moc_id);
    if (filters.linked_moc_risk_level) output = output.filter((row) => row.linkedMocRiskLevel === filters.linked_moc_risk_level);
    if (filters.has_startup_blockers === 'true') output = output.filter((row) => row.openBlockersCount > 0);
    if (filters.category_a_open === 'true') output = output.filter((row) => row.categoryAOpenCount > 0);
    if (filters.category_b_deferred === 'true') output = output.filter((row) => row.categoryBDeferredCount > 0);
    if (filters.missing_documents === 'true') output = output.filter((row) => row.missingDocumentsCount > 0);
    if (filters.missing_training === 'true') output = output.filter((row) => row.missingTrainingCount > 0);
    if (filters.failed_tests === 'true') output = output.filter((row) => row.failedTestsCount > 0);
    if (filters.authorization_pending === 'true') output = output.filter((row) => row.authorizationPendingCount > 0 || row.status === 'Ready For Authorization');
    if (filters.quick === 'my-pssrs') output = output.filter((row) => row.coordinator_id);
    if (filters.quick === 'ready') output = output.filter((row) => row.status === 'Ready For Authorization');
    if (filters.quick === 'blocked') output = output.filter((row) => row.openBlockersCount > 0);
    if (filters.quick === 'upcoming') output = output.filter((row) => this.isWithin(row.target_startup_at, new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
    if (filters.quick === 'released') output = output.filter((row) => row.status === 'Startup Released');
    if (filters.quick === 'closed') output = output.filter((row) => row.status === 'Closed');
    return output;
  }

  private groupBy(rows: any[], key: string) {
    const map = new Map<string, any[]>();
    rows.forEach((row) => {
      const value = row[key] ?? 'unknown';
      map.set(value, [...(map.get(value) ?? []), row]);
    });
    return map;
  }

  private kpi(label: string, value: number, description: string, tone: string, filter: Record<string, any>) {
    return { label, value, description, tone, filter, trend: null };
  }

  private countStatus(rows: any[], status: string) {
    return rows.filter((row) => row.status === status).length;
  }

  private closedThisMonth(rows: any[]) {
    const now = new Date();
    return rows.filter((row) => {
      if (row.status !== 'Closed' || !row.closed_at) return false;
      const date = new Date(row.closed_at);
      return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
    }).length;
  }

  private readinessStatus(status: string, readinessPercent: number, blockers: number, pendingSignatures: number) {
    if (status === 'Closed') return 'Closed';
    if (status === 'Startup Released') return 'Released';
    if (status === 'Authorized For Startup') return 'Authorized';
    if (blockers > 0) return 'Blocked';
    if (status === 'Ready For Authorization' || pendingSignatures > 0) return 'Ready Pending Signatures';
    if (readinessPercent >= 90) return 'Ready Pending Signatures';
    if (readinessPercent > 0) return 'In Progress';
    return 'Not Ready';
  }

  private average(values: any[]) {
    const numbers = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
    if (!numbers.length) return 0;
    return Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
  }

  private summaryBy(rows: any[], key: string) {
    const groups = this.groupBy(rows, key);
    return Array.from(groups.entries()).map(([label, items]) => ({ label: label === 'unknown' ? '-' : label, count: items.length, averageReadiness: this.average(items.map((row) => row.readinessPercent)), blocked: items.filter((row) => row.openBlockersCount > 0).length })).sort((a, b) => b.count - a.count).slice(0, 8);
  }

  private isOpen(status?: string) {
    return !['Closed', 'Completed', 'Resolved', 'Verified', 'Cancelled', 'Rejected', 'Signed', 'Approved'].includes(status ?? '');
  }

  private isWithin(value: string | null | undefined, from: Date, to: Date) {
    if (!value) return false;
    const date = new Date(value);
    return date >= from && date <= to;
  }

  private isOverdue(value: string | null | undefined, status?: string) {
    if (!value || ['Closed', 'Cancelled', 'Startup Released'].includes(status ?? '')) return false;
    return new Date(value).getTime() < Date.now();
  }

  private scheduleStatus(row: any, now: Date, inOneDay: Date, inSevenDays: Date) {
    if (row.status === 'Authorized For Startup') return 'Awaiting Startup Release';
    if (this.isOverdue(row.target_startup_at, row.status)) return 'Overdue';
    if (row.openBlockersCount > 0 && this.isWithin(row.target_startup_at, now, inSevenDays)) return 'Startup Blocked';
    if (this.isWithin(row.target_startup_at, now, inOneDay)) return 'Within 24 Hours';
    if (this.isWithin(row.target_startup_at, now, inSevenDays)) return 'Within 7 Days';
    return 'Scheduled';
  }

  private blockerSources(blockers: any[]) {
    const sources = ['Checklist', 'Field verification', 'Document Readiness', 'Training', 'Testing', 'Punch List', 'MOC', 'Authorization'];
    return sources.map((source) => {
      const sourceKey = source.toLowerCase().split(' ')[0] ?? source.toLowerCase();
      const items = blockers.filter((row) => String(row.source_module ?? row.blocker_type ?? '').toLowerCase().includes(sourceKey));
      const open = items.filter((row) => this.isOpen(row.status));
      return { source, total: items.length, open: open.length, critical: open.filter((row) => ['Critical', 'High'].includes(row.severity)).length, overdue: open.filter((row) => row.due_date && new Date(row.due_date).getTime() < Date.now()).length, resolved: items.filter((row) => !this.isOpen(row.status)).length };
    });
  }

  private punchHealth(items: any[], deferrals: any[]) {
    const open = items.filter((row) => this.isOpen(row.status));
    return {
      total: items.length,
      categoryAOpen: open.filter((row) => row.category === 'A').length,
      categoryBOpen: open.filter((row) => row.category === 'B').length,
      categoryBDeferred: deferrals.filter((row) => ['Approved', 'Deferred', 'Accepted'].includes(row.status)).length,
      categoryCOpen: open.filter((row) => row.category === 'C').length,
      overdue: open.filter((row) => row.due_date && new Date(row.due_date).getTime() < Date.now()).length,
      missingEvidence: open.filter((row) => row.evidence_required && row.evidence_status !== 'Uploaded').length,
      pendingVerification: open.filter((row) => row.verification_required && row.verification_status !== 'Verified').length,
      closed: items.filter((row) => !this.isOpen(row.status)).length,
      bySource: this.summaryBy(items.map((row) => ({ ...row, readinessPercent: row.status === 'Closed' ? 100 : 0, openBlockersCount: this.isOpen(row.status) ? 1 : 0 })), 'source_module'),
      byOwner: this.summaryBy(items.map((row) => ({ ...row, readinessPercent: row.status === 'Closed' ? 100 : 0, openBlockersCount: this.isOpen(row.status) ? 1 : 0 })), 'owner_id'),
      bySeverity: this.summaryBy(items.map((row) => ({ ...row, readinessPercent: row.status === 'Closed' ? 100 : 0, openBlockersCount: this.isOpen(row.status) ? 1 : 0 })), 'severity')
    };
  }

  private dashboardQuickTabs(rows: any[]) {
    return [
      { key: 'all', label: 'All', count: rows.length, filter: {} },
      { key: 'my-pssrs', label: 'My PSSRs', count: rows.filter((row) => row.coordinator_id).length, filter: { quick: 'my-pssrs' } },
      { key: 'ready', label: 'Ready For Authorization', count: rows.filter((row) => row.status === 'Ready For Authorization').length, filter: { quick: 'ready' } },
      { key: 'blocked', label: 'Startup Blocked', count: rows.filter((row) => row.openBlockersCount > 0).length, filter: { quick: 'blocked' } },
      { key: 'category-a', label: 'Category A Open', count: rows.filter((row) => row.categoryAOpenCount > 0).length, filter: { category_a_open: 'true' } },
      { key: 'missing-documents', label: 'Missing Documents', count: rows.filter((row) => row.missingDocumentsCount > 0).length, filter: { missing_documents: 'true' } },
      { key: 'missing-training', label: 'Missing Training', count: rows.filter((row) => row.missingTrainingCount > 0).length, filter: { missing_training: 'true' } },
      { key: 'failed-tests', label: 'Failed Tests', count: rows.filter((row) => row.failedTestsCount > 0).length, filter: { failed_tests: 'true' } },
      { key: 'upcoming', label: 'Upcoming Startups', count: rows.filter((row) => this.isWithin(row.target_startup_at, new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))).length, filter: { quick: 'upcoming' } },
      { key: 'released', label: 'Released', count: rows.filter((row) => row.status === 'Startup Released').length, filter: { quick: 'released' } },
      { key: 'closed', label: 'Closed', count: rows.filter((row) => row.status === 'Closed').length, filter: { quick: 'closed' } }
    ];
  }

  private compact<T extends Record<string, any>>(value: T) {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>;
  }

  private nextStatus(pssr: any, action: string) {
    const blockers = Number(pssr.summary?.blockersCount ?? 0);
    const transitions: Record<string, string> = { submit: 'Created', 'start-preparation': 'In Preparation', 'start-review': 'In Review', 'start-field-verification': 'Field Verification', 'mark-ready-for-authorization': 'Ready For Authorization', 'authorize-startup': 'Authorized For Startup', 'release-startup': 'Startup Released', close: 'Closed', cancel: 'Cancelled' };
    if (action === 'mark-ready-for-authorization' && blockers > 0) throw new BadRequestException('Cannot mark ready while startup blockers remain open');
    if (action === 'authorize-startup' && (blockers > 0 || pssr.summary?.checklistCompletion < 100)) throw new BadRequestException('Cannot authorize startup until blockers and required checklist items are complete');
    return transitions[action] ?? pssr.status;
  }

  private async history(tenantId: string, pssr: any, userId: string, category: string, type: string, title: string, before: any, after: any) {
    await this.db.single(this.db.from('pssr_history_events').insert({ id: crypto.randomUUID(), pssr_id: pssr.id, tenant_id: tenantId, company_id: pssr.company_id, site_id: pssr.site_id, event_category: category, event_type: type, event_title: title, description: title, user_id: userId, before_value: before ?? null, after_value: after ?? null, is_safety_critical: ['Critical', 'High'].includes(pssr.risk_level) }).select().single());
  }

  private async notifyCoordinator(tenantId: string, pssr: any, actorId: string, type: string) {
    if (!pssr.coordinator_id) return;
    await this.notifications.notifyUser({ userId: pssr.coordinator_id, tenantId, companyId: pssr.company_id, siteId: pssr.site_id, type, module: 'pssr', title: pssr.pssr_number, message: `${pssr.title} requires PSSR coordination`, relatedRecordId: pssr.id, relatedRecordType: 'PSSR', relatedUrl: `/pssr/${pssr.id}`, priority: ['High', 'Critical'].includes(pssr.risk_level) ? 'Safety-Critical' : 'Normal', metadata: { actorId } });
  }

  private async index(tenantId: string, pssr: any) {
    await this.search.indexRecord(tenantId, { module: 'pssr', recordType: 'PSSR', recordId: pssr.id, recordNumber: pssr.pssr_number, title: pssr.title, subtitle: pssr.pssr_type, description: pssr.description, status: pssr.status, priority: pssr.risk_level, siteId: pssr.site_id, url: `/pssr/${pssr.id}` });
  }

  private assertSiteAccess(siteId: string, scope: Scope) {
    if (scope.selectedSiteId && scope.selectedSiteId !== siteId) throw new BadRequestException('Selected site does not match PSSR site');
    if (!scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) throw new BadRequestException('You do not have access to this site');
  }

  private scopeSnake(query: any, scope: Scope) {
    if (scope.selectedSiteId) return query.eq('site_id', scope.selectedSiteId);
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in('site_id', scope.allowedSiteIds);
    return query;
  }

  private scopeCamel(query: any, scope: Scope) {
    if (scope.selectedSiteId) return query.eq('siteId', scope.selectedSiteId);
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in('siteId', scope.allowedSiteIds);
    return query;
  }

  private scopeSite(query: any, scope: Scope) {
    if (scope.selectedSiteId) return query.eq('id', scope.selectedSiteId);
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in('id', scope.allowedSiteIds);
    return query;
  }

  private async safeMany<T = any>(query: PromiseLike<any>) {
    try { return await this.db.many<T>(query); } catch { return []; }
  }

  private async safeSingle<T = any>(query: PromiseLike<any>) {
    try { return await this.db.single<T>(query); } catch { return null; }
  }
}
