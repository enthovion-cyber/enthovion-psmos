import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type Row = Record<string, any>;

export const integrationTypes = ['MOC PSI Impact', 'MOC Required PSI Update', 'PSSR PSI Readiness', 'PSSR Startup Blocker', 'HAZOP PSI Basis', 'HAZOP PSI Action', 'MI PSI Readiness', 'MI Data Dependency', 'PSI Source Evidence', 'Cross-module Conflict', 'Out-of-sync Record'];
export const relationshipTypes = ['Uses PSI as evidence', 'Requires PSI update', 'Changed by MOC', 'Blocks startup', 'Supports HAZOP node', 'Supports HAZOP deviation', 'Supports MI readiness', 'Supports equipment technical data', 'Provides design basis', 'Provides material basis', 'Provides relief basis', 'Provides safeguard basis', 'Requires review', 'Creates action', 'Creates notification'];
export const impactTypes = ['Design basis impact', 'Operating limit impact', 'Chemical/SDS impact', 'Process chemistry impact', 'Relief basis impact', 'P&ID/PFD impact', 'Electrical classification impact', 'Material compatibility impact', 'Safeguard/control impact', 'Document/evidence impact', 'Completeness impact', 'Startup readiness impact', 'MI readiness impact', 'HAZOP revalidation impact', 'Action required'];
export const impactSeverities = ['Info', 'Low', 'Medium', 'High', 'Critical', 'Startup Blocker'];
export const integrationStatuses = ['Linked', 'Pending Link', 'Update Required', 'Waiting Review', 'Waiting Approval', 'Waiting MOC', 'Waiting PSSR', 'Out of Sync', 'Blocked', 'Resolved', 'Verified', 'Closed', 'Waived', 'Cancelled'];
export const syncStatuses = ['In Sync', 'Out of Sync', 'Source Changed', 'PSI Changed', 'Needs Review', 'Not Checked', 'Not Applicable', 'Manual Link Only'];
export const sourceModules = ['MOC', 'PSSR', 'HAZOP', 'Mechanical Integrity', 'Document Control', 'Equipment Registry', 'Chemical/SDS', 'PTW', 'LOPA/SIL', 'PSI'];
export const mocImpactStatuses = ['Not Assessed', 'No PSI Impact', 'PSI Update Required', 'PSI Update In Progress', 'PSI Pending Review', 'PSI Approved', 'PSI Completeness Run Required', 'Blocked by PSI Gap', 'Ready for MOC Closure', 'Waived With Approval'];
export const pssrReadinessStatuses = ['Not Checked', 'Ready', 'Ready With Conditions', 'Blocked', 'Blocked by Critical PSI Gap', 'Blocked by Document Approval', 'Blocked by MOC Update', 'Waived With Approval', 'Recheck Required'];
export const outOfSyncStatuses = ['New', 'Confirmed', 'Review Required', 'Action Created', 'Resolved', 'Verified', 'Waived'];

const mocChecklist = [
  ['Chemicals & SDS', 'New or changed chemical, concentration, SDS, or inventory requires PSI review.'],
  ['Process Chemistry', 'Reaction route, chemistry hazard, runaway, incompatibility, or decomposition basis changed.'],
  ['Safe Operating Limits', 'Operating condition, alarm, trip, interlock, or safe limit changed.'],
  ['Equipment Design Basis', 'Equipment design, service, pressure, temperature, capacity, or material changed.'],
  ['Relief Systems', 'Relief scenario, PSV, vent path, sizing basis, or protected equipment changed.'],
  ['Drawings / P&IDs', 'P&ID, PFD, line list, equipment tag, or control narrative changed.'],
  ['Electrical Classification', 'Classified area, ventilation, ignition source, or hazardous source changed.'],
  ['Material Compatibility', 'Material of construction, corrosion, degradation mechanism, or service changed.'],
  ['Safeguards / Controls', 'Safeguard, SIS, alarm, interlock, PSV, bypass, or impairment status changed.'],
  ['Completeness Engine', 'Completeness rerun required after MOC implementation.'],
  ['PSSR', 'PSSR startup readiness depends on updated and approved PSI.'],
  ['HAZOP', 'HAZOP/PHA revalidation may be required after PSI change.'],
  ['Mechanical Integrity', 'MI readiness and inspection basis may need synchronization.'],
  ['Documents / Training / PTW / LOTO', 'Controlled documents, training, PTW, LOTO, and evidence packages may need updates.']
];

const pssrBlockerTypes = ['Missing SDS', 'Missing Process Chemistry', 'Missing Safe Operating Limit', 'Missing Equipment Design Basis', 'Missing Relief Basis', 'Missing Current P&ID/PFD', 'Missing Electrical Classification', 'Material Incompatibility', 'Missing Critical Safeguard', 'Failed/Bypassed/Impaired Critical Safeguard', 'Open Critical PSI Conflict', 'PSI Review Overdue', 'Required PSI Document Pending Approval', 'MOC PSI Update Incomplete', 'Completeness Score Below Threshold'];
const hazopBasisTypes = ['PFD/P&ID', 'Process Chemistry', 'Chemical/SDS Hazards', 'Safe Operating Limits', 'Equipment Design Basis', 'Relief Systems', 'Electrical Classification', 'Material Compatibility', 'Safeguards / Controls', 'Incidents', 'MOC History', 'MI Readiness / Deficiency Summary'];
const miImpactTypes = ['Missing Equipment Design Basis', 'Design Limit Conflict', 'Relief Basis Conflict', 'PSV Link Missing', 'Material Compatibility Conflict', 'Corrosion Allowance Conflict', 'Degradation Mechanism Conflict', 'P&ID/Data Sheet Missing', 'Safeguard Failure', 'Electrical Classification Missing', 'Document Evidence Missing', 'Review Overdue', 'MOC Changed Equipment Unsynced'];

@Injectable()
export class PsiIntegrationService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async dashboard(tenantId: string, scope: Scope, query: Row = {}) {
    const [links, moc, pssrChecks, pssrBlockers, hazopLinks, hazopActions, miImpacts, syncChecks, actions] = await Promise.all([
      this.linkRows(tenantId, scope, query, false),
      this.safeMany<Row>(this.applyScope(this.db.from('psi_moc_impact_assessments').select('*').eq('company_id', tenantId), scope)),
      this.safeMany<Row>(this.applyScope(this.db.from('psi_pssr_readiness_checks').select('*').eq('company_id', tenantId), scope)),
      this.safeMany<Row>(this.applyScope(this.db.from('psi_pssr_blockers').select('*').eq('company_id', tenantId), scope)),
      this.safeMany<Row>(this.applyScope(this.db.from('psi_hazop_basis_links').select('*').eq('company_id', tenantId).is('unlinked_at', null), scope)),
      this.safeMany<Row>(this.applyScope(this.db.from('psi_hazop_psi_actions').select('*').eq('company_id', tenantId), scope)),
      this.safeMany<Row>(this.applyScope(this.db.from('psi_mi_readiness_impacts').select('*').eq('company_id', tenantId), scope)),
      this.safeMany<Row>(this.applyScope(this.db.from('psi_sync_checks').select('*').eq('company_id', tenantId), scope)),
      this.safeMany<Row>(this.applyScope(this.db.from('psi_integration_actions').select('*').eq('company_id', tenantId), scope))
    ]);
    const linkRows = links as Row[];
    const openActions = actions.filter((row) => !['Closed', 'Verified', 'Cancelled'].includes(row.action_status));
    const overdueActions = openActions.filter((row) => row.due_date && new Date(row.due_date) < new Date());
    const outOfSync = syncChecks.filter((row) => ['Out of Sync', 'Source Changed', 'PSI Changed', 'Needs Review'].includes(row.sync_status) && !['Resolved', 'Verified', 'Waived'].includes(row.check_status));
    return {
      summary: {
        psiRecordsLinkedToMoc: linkRows.filter((row) => row.source_module === 'MOC').length,
        openMocsWithPsiImpact: moc.filter((row) => !['Ready for MOC Closure', 'PSI Approved', 'Waived With Approval'].includes(row.assessment_status)).length,
        mocsBlockedByPsiUpdates: moc.filter((row) => row.closure_blocked).length,
        closedMocsWithPendingPsiUpdates: moc.filter((row) => row.assessment_status === 'PSI Update Required' || row.psi_update_required).length,
        pssrsWithPsiReadinessChecks: pssrChecks.length,
        pssrBlockersFromPsi: pssrBlockers.filter((row) => !['Closed', 'Cleared', 'Waived'].includes(row.blocker_status)).length,
        hazopStudiesUsingPsi: new Set(hazopLinks.map((row) => row.hazop_id)).size,
        hazopActionsRequiringPsiUpdates: hazopActions.filter((row) => !['Closed', 'Verified', 'Cancelled'].includes(row.action_status)).length,
        miEquipmentWithPsiReadinessImpact: new Set(miImpacts.map((row) => row.equipment_id)).size,
        equipmentMissingPsiForMi: miImpacts.filter((row) => row.impact_status !== 'Verified').length,
        psiRecordsOutOfSync: outOfSync.length,
        criticalIntegrationBlockers: [...linkRows, ...pssrBlockers, ...miImpacts, ...syncChecks].filter((row) => ['Critical', 'Startup Blocker'].includes(row.impact_severity ?? row.severity)).length,
        integrationActionsOpen: openActions.length,
        integrationReviewsOverdue: overdueActions.length,
        lastSyncCheck: syncChecks.sort((a, b) => String(b.checked_at ?? b.created_at).localeCompare(String(a.checked_at ?? a.created_at)))[0]?.checked_at ?? null
      },
      charts: {
        byIntegrationType: this.countBy(linkRows, 'integration_type'),
        byStatus: this.countBy(linkRows, 'integration_status'),
        bySyncStatus: this.countBy(linkRows, 'sync_status'),
        bySeverity: this.countBy([...linkRows, ...syncChecks], 'impact_severity'),
        bySourceModule: this.countBy(linkRows, 'source_module'),
        blockersByModule: this.countBy(pssrBlockers, 'psi_module')
      },
      recentLinks: linkRows.slice(0, 10),
      outOfSync: outOfSync.slice(0, 10),
      blockers: pssrBlockers.filter((row) => !['Closed', 'Cleared', 'Waived'].includes(row.blocker_status)).slice(0, 10),
      actions: openActions.slice(0, 10),
      filters: query,
      lastUpdated: new Date().toISOString()
    };
  }

  summary(tenantId: string, scope: Scope, query: Row = {}) {
    return this.dashboard(tenantId, scope, query).then((data) => data.summary);
  }

  async impactRegister(tenantId: string, scope: Scope, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(10, Number(query.limit ?? 25)));
    const rows = await this.linkRows(tenantId, scope, query, true);
    return { rows, page, limit, summary: this.registerSummary(rows), lastUpdated: new Date().toISOString() };
  }

  async linkDetail(tenantId: string, scope: Scope, integrationLinkId: string) {
    const link = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_integration_links').select('*').eq('company_id', tenantId).eq('id', integrationLinkId), scope).maybeSingle()), 'PSI integration link not found.');
    const [actions, sync, history] = await Promise.all([
      this.safeMany<Row>(this.db.from('psi_integration_actions').select('*').eq('company_id', tenantId).eq('integration_link_id', integrationLinkId).order('created_at', { ascending: false })),
      this.safeMany<Row>(this.db.from('psi_sync_checks').select('*').eq('company_id', tenantId).eq('integration_link_id', integrationLinkId).order('created_at', { ascending: false })),
      this.safeMany<Row>(this.db.from('psi_integration_history_events').select('*').eq('company_id', tenantId).eq('integration_link_id', integrationLinkId).order('created_at', { ascending: false }))
    ]);
    return { link, actions, syncChecks: sync, history };
  }

  async updateLink(tenantId: string, actorId: string, scope: Scope, integrationLinkId: string, dto: Row) {
    const before = (await this.linkDetail(tenantId, scope, integrationLinkId)).link;
    const patch = this.clean({
      integration_title: dto.integration_title ?? dto.integrationTitle,
      integration_type: dto.integration_type ?? dto.integrationType,
      psi_module: dto.psi_module ?? dto.psiModule,
      psi_record_id: dto.psi_record_id ?? dto.psiRecordId,
      psi_record_title: dto.psi_record_title ?? dto.psiRecordTitle,
      relationship_type: dto.relationship_type ?? dto.relationshipType,
      impact_type: dto.impact_type ?? dto.impactType,
      impact_severity: dto.impact_severity ?? dto.impactSeverity,
      integration_status: dto.integration_status ?? dto.integrationStatus,
      sync_status: dto.sync_status ?? dto.syncStatus,
      blocking_status: dto.blocking_status ?? dto.blockingStatus,
      required_update: dto.required_update ?? dto.requiredUpdate,
      required_action: dto.required_action ?? dto.requiredAction,
      owner_user_id: dto.owner_user_id ?? dto.ownerUserId,
      due_date: this.dateOrNull(dto.due_date ?? dto.dueDate),
      evidence_status: dto.evidence_status ?? dto.evidenceStatus,
      notes: dto.notes,
      metadata_json: dto.metadata_json ?? dto.metadata,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_integration_links').update(patch).eq('company_id', tenantId).eq('id', integrationLinkId).select().single()), 'Unable to update PSI integration link.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.link.updated', row, before, row, 'PSI integration link updated', dto.reason ?? null);
    return row;
  }

  async verifyLink(tenantId: string, actorId: string, scope: Scope, integrationLinkId: string, dto: Row = {}) {
    const before = (await this.linkDetail(tenantId, scope, integrationLinkId)).link;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_integration_links').update({
      integration_status: 'Verified',
      sync_status: dto.sync_status ?? 'In Sync',
      verified_by: actorId,
      verified_at: new Date().toISOString(),
      last_checked_at: new Date().toISOString(),
      notes: dto.notes ?? before.notes,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('company_id', tenantId).eq('id', integrationLinkId).select().single()), 'Unable to verify PSI integration link.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.link.verified', row, before, row, 'PSI integration link verified', dto.reason ?? dto.notes ?? null);
    return row;
  }

  async closeLink(tenantId: string, actorId: string, scope: Scope, integrationLinkId: string, dto: Row = {}) {
    if (!String(dto.reason ?? dto.close_reason ?? '').trim()) throw new BadRequestException('Close reason is required.');
    const before = (await this.linkDetail(tenantId, scope, integrationLinkId)).link;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_integration_links').update({
      integration_status: 'Closed',
      blocking_status: 'Not Blocking',
      closed_by: actorId,
      closed_at: new Date().toISOString(),
      close_reason: dto.reason ?? dto.close_reason,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('company_id', tenantId).eq('id', integrationLinkId).select().single()), 'Unable to close PSI integration link.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.link.closed', row, before, row, 'PSI integration link closed', row.close_reason);
    return row;
  }

  async reopenLink(tenantId: string, actorId: string, scope: Scope, integrationLinkId: string, dto: Row = {}) {
    if (!String(dto.reason ?? dto.reopen_reason ?? '').trim()) throw new BadRequestException('Reopen reason is required.');
    const before = (await this.linkDetail(tenantId, scope, integrationLinkId)).link;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_integration_links').update({
      integration_status: 'Waiting Review',
      reopened_by: actorId,
      reopened_at: new Date().toISOString(),
      reopen_reason: dto.reason ?? dto.reopen_reason,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    }).eq('company_id', tenantId).eq('id', integrationLinkId).select().single()), 'Unable to reopen PSI integration link.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.link.reopened', row, before, row, 'PSI integration link reopened', row.reopen_reason);
    return row;
  }

  mocOverview(tenantId: string, scope: Scope, query: Row = {}) {
    return this.safeMany<Row>(this.applyScope(this.db.from('psi_moc_impact_assessments').select('*').eq('company_id', tenantId), scope).order('updated_at', { ascending: false }).limit(Math.min(100, Number(query.limit ?? 50))));
  }

  async mocImpact(tenantId: string, scope: Scope, mocId: string) {
    const assessment = await this.safeSingle<Row>(this.applyScope(this.db.from('psi_moc_impact_assessments').select('*').eq('company_id', tenantId).eq('moc_id', mocId), scope).maybeSingle());
    const items = assessment ? await this.safeMany<Row>(this.db.from('psi_moc_impact_items').select('*').eq('company_id', tenantId).eq('moc_impact_assessment_id', assessment.id).order('created_at')) : [];
    const links = await this.safeMany<Row>(this.applyScope(this.db.from('psi_integration_links').select('*').eq('company_id', tenantId).eq('source_module', 'MOC').eq('source_record_id', mocId), scope).order('created_at', { ascending: false }));
    return { assessment, items, links, readiness: this.mocReadiness(assessment, items), lastUpdated: new Date().toISOString() };
  }

  async runMocImpact(tenantId: string, actorId: string, scope: Scope, mocId: string, dto: Row = {}) {
    const siteId = this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? this.selectedSite(scope) ?? ''));
    const source = await this.sourceRecord('moc', tenantId, mocId);
    const before = await this.safeSingle<Row>(this.db.from('psi_moc_impact_assessments').select('*').eq('company_id', tenantId).eq('moc_id', mocId).maybeSingle());
    const assessmentPayload = {
      company_id: tenantId,
      site_id: source?.site_id ?? siteId,
      unit_id: source?.unit_id ?? dto.unit_id ?? dto.unitId ?? null,
      area_id: source?.area_id ?? dto.area_id ?? dto.areaId ?? null,
      equipment_id: source?.equipment_id ?? dto.equipment_id ?? dto.equipmentId ?? null,
      moc_id: mocId,
      moc_number: source?.moc_number ?? source?.number ?? dto.moc_number ?? dto.mocNumber ?? null,
      moc_title: source?.title ?? source?.moc_title ?? dto.moc_title ?? dto.mocTitle ?? `MOC ${mocId}`,
      assessment_status: 'PSI Update Required',
      impact_summary: 'PSI impact assessment generated from MOC and PSI completeness state.',
      psi_update_required: true,
      completeness_run_required: true,
      pssr_required: true,
      hazop_revalidation_required: true,
      mi_readiness_required: true,
      closure_blocked: true,
      closure_blocker_reason: 'PSI impact items require review before MOC closure.',
      assessed_by: actorId,
      assessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const assessment = before
      ? this.requireRow(await this.db.single<Row>(this.db.from('psi_moc_impact_assessments').update(assessmentPayload).eq('company_id', tenantId).eq('id', before.id).select().single()), 'Unable to update MOC PSI impact.')
      : this.requireRow(await this.db.single<Row>(this.db.from('psi_moc_impact_assessments').insert({ id: randomUUID(), ...assessmentPayload }).select().single()), 'Unable to create MOC PSI impact.');

    const gaps = await this.psiGaps(tenantId, scope, { unitId: assessment.unit_id, equipmentId: assessment.equipment_id, mocRequired: 'true' });
    const existingItems = await this.safeMany<Row>(this.db.from('psi_moc_impact_items').select('*').eq('company_id', tenantId).eq('moc_impact_assessment_id', assessment.id));
    const createdItems: Row[] = [];
    for (const [module, checklistItem] of mocChecklist) {
      const gapCount = gaps.filter((gap) => gap.psi_module === module || module === 'Completeness Engine').length;
      const existing = existingItems.find((item) => item.psi_module === module);
      const payload = {
        company_id: tenantId,
        site_id: assessment.site_id,
        moc_impact_assessment_id: assessment.id,
        moc_id: mocId,
        checklist_item: checklistItem,
        psi_module: module,
        impact_status: gapCount > 0 ? 'PSI Update Required' : 'No PSI Impact',
        impact_required: gapCount > 0 || ['PSSR', 'HAZOP', 'Mechanical Integrity', 'Completeness Engine'].includes(String(module)),
        update_required: gapCount > 0,
        blocking: gapCount > 0,
        blocker_reason: gapCount > 0 ? `${gapCount} PSI completeness gap(s) require review.` : null,
        evidence_status: gapCount > 0 ? 'Missing evidence' : 'Not applicable',
        updated_at: new Date().toISOString()
      };
      const item = existing
        ? await this.db.single<Row>(this.db.from('psi_moc_impact_items').update(payload).eq('company_id', tenantId).eq('id', existing.id).select().single())
        : await this.db.single<Row>(this.db.from('psi_moc_impact_items').insert({ id: randomUUID(), ...payload }).select().single());
      if (item) createdItems.push(item);
    }
    const link = await this.ensureLink(tenantId, actorId, {
      site_id: assessment.site_id,
      unit_id: assessment.unit_id,
      area_id: assessment.area_id,
      equipment_id: assessment.equipment_id,
      integration_title: `MOC PSI impact - ${assessment.moc_title}`,
      integration_type: 'MOC PSI Impact',
      source_module: 'MOC',
      source_record_id: mocId,
      source_record_title: assessment.moc_title,
      relationship_type: 'Changed by MOC',
      impact_type: 'Completeness impact',
      impact_severity: createdItems.some((item) => item.blocking) ? 'Critical' : 'Medium',
      integration_status: createdItems.some((item) => item.blocking) ? 'Blocked' : 'Waiting Review',
      sync_status: 'Needs Review',
      blocking_status: createdItems.some((item) => item.blocking) ? 'Blocking' : 'Not Blocking',
      required_update: 'Review and complete PSI updates required by MOC.',
      source_snapshot_json: source ?? dto
    });
    await this.writeHistory(tenantId, actorId, 'psi.integration.moc.assessed', { ...assessment, integration_link_id: link.id }, before, { assessment, items: createdItems }, 'MOC PSI impact assessed', assessment.impact_summary);
    return { assessment, items: createdItems, link, readiness: this.mocReadiness(assessment, createdItems) };
  }

  async updateMocImpactItem(tenantId: string, actorId: string, scope: Scope, mocId: string, itemId: string, dto: Row) {
    const before = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_moc_impact_items').select('*').eq('company_id', tenantId).eq('moc_id', mocId).eq('id', itemId), scope).maybeSingle()), 'MOC PSI impact item not found.');
    const patch = this.clean({
      impact_status: dto.impact_status ?? dto.impactStatus,
      impact_required: dto.impact_required ?? dto.impactRequired,
      update_required: dto.update_required ?? dto.updateRequired,
      blocking: dto.blocking,
      blocker_reason: dto.blocker_reason ?? dto.blockerReason,
      owner_user_id: dto.owner_user_id ?? dto.ownerUserId,
      due_date: this.dateOrNull(dto.due_date ?? dto.dueDate),
      evidence_status: dto.evidence_status ?? dto.evidenceStatus,
      notes: dto.notes,
      updated_at: new Date().toISOString()
    });
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_moc_impact_items').update(patch).eq('company_id', tenantId).eq('id', itemId).select().single()), 'Unable to update MOC PSI impact item.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.moc.item.updated', { ...row, integration_link_id: row.moc_impact_assessment_id }, before, row, 'MOC PSI impact item updated', dto.reason ?? null);
    return row;
  }

  async createMocItemAction(tenantId: string, actorId: string, scope: Scope, mocId: string, itemId: string, dto: Row) {
    const item = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_moc_impact_items').select('*').eq('company_id', tenantId).eq('moc_id', mocId).eq('id', itemId), scope).maybeSingle()), 'MOC PSI impact item not found.');
    const action = await this.createStandaloneAction(tenantId, actorId, item, {
      title: dto.title ?? item.checklist_item,
      sourceModule: 'MOC',
      sourceRecordId: mocId,
      ownerUserId: dto.owner_user_id ?? dto.ownerUserId ?? item.owner_user_id,
      dueDate: dto.due_date ?? dto.dueDate,
      priority: dto.priority ?? (item.blocking ? 'High' : 'Medium')
    });
    await this.db.single(this.db.from('psi_moc_impact_items').update({ action_id: action.action_id, impact_status: 'Action Created', updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', itemId).select('id').single()).catch(() => null);
    return action;
  }

  async verifyMocImpactItem(tenantId: string, actorId: string, scope: Scope, mocId: string, itemId: string, dto: Row) {
    return this.updateMocImpactItem(tenantId, actorId, scope, mocId, itemId, { ...dto, impactStatus: 'PSI Approved', blocking: false, evidenceStatus: dto.evidenceStatus ?? 'Verified' });
  }

  async overrideMocClosureBlocker(tenantId: string, actorId: string, scope: Scope, mocId: string, dto: Row) {
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Override reason is required.');
    const before = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_moc_impact_assessments').select('*').eq('company_id', tenantId).eq('moc_id', mocId), scope).maybeSingle()), 'MOC PSI impact assessment not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_moc_impact_assessments').update({ closure_blocked: false, assessment_status: 'Waived With Approval', overridden_by: actorId, overridden_at: new Date().toISOString(), override_reason: dto.reason, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', before.id).select().single()), 'Unable to override MOC closure blocker.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.moc.blocker.overridden', row, before, row, 'MOC PSI blocker overridden', dto.reason);
    return row;
  }

  pssrOverview(tenantId: string, scope: Scope, query: Row = {}) {
    return this.safeMany<Row>(this.applyScope(this.db.from('psi_pssr_readiness_checks').select('*').eq('company_id', tenantId), scope).order('updated_at', { ascending: false }).limit(Math.min(100, Number(query.limit ?? 50))));
  }

  async pssrReadiness(tenantId: string, scope: Scope, pssrId: string) {
    const check = await this.safeSingle<Row>(this.applyScope(this.db.from('psi_pssr_readiness_checks').select('*').eq('company_id', tenantId).eq('pssr_id', pssrId), scope).maybeSingle());
    const blockers = check ? await this.safeMany<Row>(this.db.from('psi_pssr_blockers').select('*').eq('company_id', tenantId).eq('pssr_readiness_check_id', check.id).order('created_at')) : [];
    return { check, blockers, readiness: this.pssrReadinessSummary(check, blockers), lastUpdated: new Date().toISOString() };
  }

  async runPssrReadiness(tenantId: string, actorId: string, scope: Scope, pssrId: string, dto: Row = {}) {
    const siteId = this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? this.selectedSite(scope) ?? ''));
    const settings = await this.settings(tenantId, { ...scope, selectedSiteId: siteId });
    const source = await this.sourceRecord('pssr', tenantId, pssrId);
    const scores = await this.completenessScores(tenantId, scope, { unitId: dto.unit_id ?? dto.unitId ?? source?.unit_id, equipmentId: dto.equipment_id ?? dto.equipmentId ?? source?.equipment_id });
    const gaps = await this.psiGaps(tenantId, scope, { unitId: dto.unit_id ?? dto.unitId ?? source?.unit_id, equipmentId: dto.equipment_id ?? dto.equipmentId ?? source?.equipment_id, pssrBlockers: 'true' });
    const score = this.aggregateScore(scores);
    const critical = gaps.filter((gap) => ['Critical', 'Startup Blocker'].includes(gap.gap_severity) || gap.pssr_blocker);
    const status = critical.length ? 'Blocked by Critical PSI Gap' : score >= Number(settings.pssr_min_completeness_score ?? 90) ? 'Ready' : 'Ready With Conditions';
    const before = await this.safeSingle<Row>(this.db.from('psi_pssr_readiness_checks').select('*').eq('company_id', tenantId).eq('pssr_id', pssrId).maybeSingle());
    const payload = {
      company_id: tenantId,
      site_id: source?.site_id ?? siteId,
      unit_id: source?.unit_id ?? dto.unit_id ?? dto.unitId ?? null,
      area_id: source?.area_id ?? dto.area_id ?? dto.areaId ?? null,
      equipment_id: source?.equipment_id ?? dto.equipment_id ?? dto.equipmentId ?? null,
      pssr_id: pssrId,
      pssr_number: source?.pssr_number ?? source?.number ?? dto.pssr_number ?? dto.pssrNumber ?? null,
      pssr_title: source?.title ?? source?.pssr_title ?? dto.pssr_title ?? dto.pssrTitle ?? `PSSR ${pssrId}`,
      readiness_status: status,
      completeness_score: score,
      threshold_score: Number(settings.pssr_min_completeness_score ?? 90),
      blockers_count: critical.length,
      critical_blockers_count: critical.filter((gap) => ['Critical', 'Startup Blocker'].includes(gap.gap_severity)).length,
      ready_with_conditions: status === 'Ready With Conditions',
      startup_blocked: status.startsWith('Blocked'),
      snapshot_json: { scores, gaps: critical, settings },
      checked_by: actorId,
      checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const check = before
      ? this.requireRow(await this.db.single<Row>(this.db.from('psi_pssr_readiness_checks').update(payload).eq('company_id', tenantId).eq('id', before.id).select().single()), 'Unable to update PSSR PSI readiness.')
      : this.requireRow(await this.db.single<Row>(this.db.from('psi_pssr_readiness_checks').insert({ id: randomUUID(), ...payload }).select().single()), 'Unable to create PSSR PSI readiness.');
    await this.db.single(this.db.from('psi_pssr_blockers').delete().eq('company_id', tenantId).eq('pssr_readiness_check_id', check.id).select('id')).catch(() => null);
    const blockers: Row[] = [];
    for (const gap of critical) {
      const blockerType = pssrBlockerTypes.find((type) => gap.gap_type?.includes(type.replace('Missing ', ''))) ?? (gap.gap_type === 'Conflict' ? 'Open Critical PSI Conflict' : 'MOC PSI Update Incomplete');
      const row = await this.db.single<Row>(this.db.from('psi_pssr_blockers').insert({
        id: randomUUID(),
        company_id: tenantId,
        site_id: check.site_id,
        pssr_readiness_check_id: check.id,
        pssr_id: pssrId,
        blocker_type: blockerType,
        blocker_title: gap.gap_title ?? gap.missing_item ?? blockerType,
        blocker_description: gap.message ?? gap.recommended_action ?? null,
        psi_module: gap.psi_module,
        psi_record_id: gap.source_record_id,
        severity: gap.gap_severity ?? 'High',
        startup_blocker: true,
        owner_user_id: gap.owner_user_id ?? null,
        due_date: gap.due_date ?? null,
        evidence_status: gap.evidence_found ? 'Evidence linked' : 'Missing evidence'
      }).select().single());
      if (row) blockers.push(row);
    }
    await this.ensureLink(tenantId, actorId, { site_id: check.site_id, unit_id: check.unit_id, equipment_id: check.equipment_id, integration_title: `PSSR PSI readiness - ${check.pssr_title}`, integration_type: 'PSSR PSI Readiness', source_module: 'PSSR', source_record_id: pssrId, source_record_title: check.pssr_title, relationship_type: 'Blocks startup', impact_type: 'Startup readiness impact', impact_severity: check.startup_blocked ? 'Startup Blocker' : 'Medium', integration_status: check.startup_blocked ? 'Blocked' : 'Waiting Review', sync_status: 'Needs Review', blocking_status: check.startup_blocked ? 'Blocking' : 'Not Blocking', source_snapshot_json: source ?? dto, psi_snapshot_json: payload.snapshot_json });
    await this.writeHistory(tenantId, actorId, 'psi.integration.pssr.readiness_run', check, before, { check, blockers }, 'PSSR PSI readiness checked', status);
    return { check, blockers, readiness: this.pssrReadinessSummary(check, blockers) };
  }

  pssrBlockers(tenantId: string, scope: Scope, pssrId: string) {
    return this.safeMany<Row>(this.applyScope(this.db.from('psi_pssr_blockers').select('*').eq('company_id', tenantId).eq('pssr_id', pssrId), scope).order('created_at'));
  }

  async clearPssrBlocker(tenantId: string, actorId: string, scope: Scope, pssrId: string, blockerId: string, dto: Row) {
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Clear reason is required.');
    const before = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_pssr_blockers').select('*').eq('company_id', tenantId).eq('pssr_id', pssrId).eq('id', blockerId), scope).maybeSingle()), 'PSSR PSI blocker not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_pssr_blockers').update({ blocker_status: 'Cleared', cleared_by: actorId, cleared_at: new Date().toISOString(), clear_reason: dto.reason, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', blockerId).select().single()), 'Unable to clear PSSR PSI blocker.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.pssr.blocker.cleared', row, before, row, 'PSSR PSI blocker cleared', dto.reason);
    return row;
  }

  async createPssrBlockerAction(tenantId: string, actorId: string, scope: Scope, pssrId: string, blockerId: string, dto: Row) {
    const blocker = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_pssr_blockers').select('*').eq('company_id', tenantId).eq('pssr_id', pssrId).eq('id', blockerId), scope).maybeSingle()), 'PSSR PSI blocker not found.');
    const action = await this.createStandaloneAction(tenantId, actorId, blocker, { title: dto.title ?? blocker.blocker_title, sourceModule: 'PSSR', sourceRecordId: pssrId, ownerUserId: dto.owner_user_id ?? dto.ownerUserId ?? blocker.owner_user_id, dueDate: dto.due_date ?? dto.dueDate, priority: dto.priority ?? 'High' });
    await this.db.single(this.db.from('psi_pssr_blockers').update({ action_id: action.action_id, blocker_status: 'Action Created', updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', blockerId).select('id').single()).catch(() => null);
    return action;
  }

  async overridePssrBlocker(tenantId: string, actorId: string, scope: Scope, pssrId: string, blockerId: string, dto: Row) {
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Override reason is required.');
    const before = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_pssr_blockers').select('*').eq('company_id', tenantId).eq('pssr_id', pssrId).eq('id', blockerId), scope).maybeSingle()), 'PSSR PSI blocker not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_pssr_blockers').update({ blocker_status: 'Waived', override_by: actorId, override_at: new Date().toISOString(), override_reason: dto.reason, startup_blocker: false, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', blockerId).select().single()), 'Unable to override PSSR PSI blocker.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.pssr.blocker.overridden', row, before, row, 'PSSR PSI blocker overridden', dto.reason);
    return row;
  }

  hazopOverview(tenantId: string, scope: Scope, query: Row = {}) {
    return this.safeMany<Row>(this.applyScope(this.db.from('psi_hazop_basis_links').select('*').eq('company_id', tenantId).is('unlinked_at', null), scope).order('updated_at', { ascending: false }).limit(Math.min(100, Number(query.limit ?? 50))));
  }

  async hazopBasis(tenantId: string, scope: Scope, hazopId: string) {
    const [basisLinks, actions] = await Promise.all([
      this.safeMany<Row>(this.applyScope(this.db.from('psi_hazop_basis_links').select('*').eq('company_id', tenantId).eq('hazop_id', hazopId).is('unlinked_at', null), scope).order('linked_at', { ascending: false })),
      this.safeMany<Row>(this.applyScope(this.db.from('psi_hazop_psi_actions').select('*').eq('company_id', tenantId).eq('hazop_id', hazopId), scope).order('created_at', { ascending: false }))
    ]);
    return { basisLinks, actions, basisPackage: this.hazopBasisPackage(basisLinks), revalidation: this.hazopRevalidation(basisLinks), lastUpdated: new Date().toISOString() };
  }

  async linkHazopBasis(tenantId: string, actorId: string, scope: Scope, hazopId: string, dto: Row) {
    const siteId = this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? this.selectedSite(scope) ?? ''));
    const psiModule = this.requireText(dto.psi_module ?? dto.psiModule, 'PSI module is required.');
    const basisType = String(dto.basis_type ?? dto.basisType ?? psiModule);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_hazop_basis_links').insert({
      id: randomUUID(),
      company_id: tenantId,
      site_id: siteId,
      unit_id: dto.unit_id ?? dto.unitId ?? null,
      area_id: dto.area_id ?? dto.areaId ?? null,
      equipment_id: dto.equipment_id ?? dto.equipmentId ?? null,
      hazop_id: hazopId,
      hazop_node_id: dto.hazop_node_id ?? dto.hazopNodeId ?? null,
      hazop_deviation_id: dto.hazop_deviation_id ?? dto.hazopDeviationId ?? null,
      psi_module: psiModule,
      psi_record_id: dto.psi_record_id ?? dto.psiRecordId ?? null,
      psi_record_title: dto.psi_record_title ?? dto.psiRecordTitle ?? null,
      basis_type: basisType,
      basis_status: 'Linked',
      source_revision: dto.source_revision ?? dto.sourceRevision ?? null,
      source_snapshot_json: dto.source_snapshot_json ?? dto.sourceSnapshot ?? dto,
      evidence_used: dto.evidence_used ?? dto.evidenceUsed ?? true,
      linked_by: actorId
    }).select().single()), 'Unable to link HAZOP PSI basis.');
    const link = await this.ensureLink(tenantId, actorId, { site_id: row.site_id, unit_id: row.unit_id, area_id: row.area_id, equipment_id: row.equipment_id, integration_title: `HAZOP PSI basis - ${row.psi_record_title ?? row.psi_module}`, integration_type: 'HAZOP PSI Basis', psi_module: row.psi_module, psi_record_id: row.psi_record_id, psi_record_title: row.psi_record_title, source_module: 'HAZOP', source_record_id: hazopId, source_record_title: dto.hazop_title ?? dto.hazopTitle ?? `HAZOP ${hazopId}`, relationship_type: row.hazop_deviation_id ? 'Supports HAZOP deviation' : 'Supports HAZOP node', impact_type: 'Document/evidence impact', impact_severity: 'Medium', integration_status: 'Linked', sync_status: 'Not Checked', blocking_status: 'Not Blocking', psi_snapshot_json: row.source_snapshot_json });
    await this.writeHistory(tenantId, actorId, 'psi.integration.hazop.basis.linked', { ...row, integration_link_id: link.id }, null, row, 'HAZOP PSI basis linked', row.basis_type);
    return { basisLink: row, integrationLink: link };
  }

  async unlinkHazopBasis(tenantId: string, actorId: string, scope: Scope, hazopId: string, linkId: string, dto: Row = {}) {
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Unlink reason is required.');
    const before = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_hazop_basis_links').select('*').eq('company_id', tenantId).eq('hazop_id', hazopId).eq('id', linkId), scope).maybeSingle()), 'HAZOP PSI basis link not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_hazop_basis_links').update({ basis_status: 'Unlinked', unlinked_by: actorId, unlinked_at: new Date().toISOString(), unlink_reason: dto.reason, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', linkId).select().single()), 'Unable to unlink HAZOP PSI basis.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.hazop.basis.unlinked', row, before, row, 'HAZOP PSI basis unlinked', dto.reason);
    return row;
  }

  async checkHazopCurrent(tenantId: string, actorId: string, scope: Scope, hazopId: string) {
    const basis = await this.safeMany<Row>(this.applyScope(this.db.from('psi_hazop_basis_links').select('*').eq('company_id', tenantId).eq('hazop_id', hazopId).is('unlinked_at', null), scope));
    const updated: Row[] = [];
    for (const link of basis) {
      const changed = Boolean(link.changed_after_study || link.source_revision === 'Superseded');
      const row = await this.db.single<Row>(this.db.from('psi_hazop_basis_links').update({ basis_status: changed ? 'Revalidation Required' : 'Current', revalidation_required: changed, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', link.id).select().single());
      if (row) updated.push(row);
      if (changed) await this.writeHistory(tenantId, actorId, 'psi.integration.hazop.revalidation_required', row ?? link, link, row ?? link, 'HAZOP PSI basis revalidation required');
    }
    return { rows: updated, revalidation: this.hazopRevalidation(updated), checkedAt: new Date().toISOString() };
  }

  async createHazopPsiAction(tenantId: string, actorId: string, scope: Scope, hazopId: string, dto: Row) {
    const siteId = this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? this.selectedSite(scope) ?? ''));
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_hazop_psi_actions').insert({
      id: randomUUID(),
      company_id: tenantId,
      site_id: siteId,
      unit_id: dto.unit_id ?? dto.unitId ?? null,
      area_id: dto.area_id ?? dto.areaId ?? null,
      equipment_id: dto.equipment_id ?? dto.equipmentId ?? null,
      hazop_id: hazopId,
      hazop_recommendation_id: dto.hazop_recommendation_id ?? dto.hazopRecommendationId ?? null,
      psi_module: dto.psi_module ?? dto.psiModule ?? null,
      psi_record_id: dto.psi_record_id ?? dto.psiRecordId ?? null,
      action_title: this.requireText(dto.action_title ?? dto.actionTitle ?? dto.title, 'Action title is required.'),
      action_description: dto.action_description ?? dto.actionDescription ?? null,
      action_id: dto.action_id ?? dto.actionId ?? randomUUID(),
      owner_user_id: dto.owner_user_id ?? dto.ownerUserId ?? null,
      due_date: this.dateOrNull(dto.due_date ?? dto.dueDate),
      priority: dto.priority ?? 'Medium',
      created_by: actorId
    }).select().single()), 'Unable to create HAZOP PSI action.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.hazop.action.created', row, null, row, 'HAZOP PSI action created', row.action_title);
    return row;
  }

  hazopPsiActions(tenantId: string, scope: Scope, hazopId: string) {
    return this.safeMany<Row>(this.applyScope(this.db.from('psi_hazop_psi_actions').select('*').eq('company_id', tenantId).eq('hazop_id', hazopId), scope).order('created_at', { ascending: false }));
  }

  async updateHazopPsiAction(tenantId: string, actorId: string, scope: Scope, hazopId: string, actionId: string, dto: Row) {
    const before = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_hazop_psi_actions').select('*').eq('company_id', tenantId).eq('hazop_id', hazopId).eq('id', actionId), scope).maybeSingle()), 'HAZOP PSI action not found.');
    const patch = this.clean({ action_status: dto.action_status ?? dto.actionStatus, owner_user_id: dto.owner_user_id ?? dto.ownerUserId, due_date: this.dateOrNull(dto.due_date ?? dto.dueDate), priority: dto.priority, close_reason: dto.reason ?? dto.closeReason, closed_by: dto.action_status === 'Closed' || dto.actionStatus === 'Closed' ? actorId : undefined, closed_at: dto.action_status === 'Closed' || dto.actionStatus === 'Closed' ? new Date().toISOString() : undefined, updated_at: new Date().toISOString() });
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_hazop_psi_actions').update(patch).eq('company_id', tenantId).eq('id', actionId).select().single()), 'Unable to update HAZOP PSI action.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.hazop.action.updated', row, before, row, 'HAZOP PSI action updated', dto.reason ?? null);
    return row;
  }

  miOverview(tenantId: string, scope: Scope, query: Row = {}) {
    return this.safeMany<Row>(this.applyScope(this.db.from('psi_mi_readiness_impacts').select('*').eq('company_id', tenantId), scope).order('updated_at', { ascending: false }).limit(Math.min(100, Number(query.limit ?? 50))));
  }

  async miReadiness(tenantId: string, scope: Scope, equipmentId: string) {
    const impacts = await this.miImpacts(tenantId, scope, equipmentId);
    const checks = await this.safeMany<Row>(this.applyScope(this.db.from('psi_sync_checks').select('*').eq('company_id', tenantId).eq('source_module', 'Mechanical Integrity').eq('equipment_id', equipmentId), scope).order('created_at', { ascending: false }));
    return { equipmentId, impacts, syncChecks: checks, readiness: this.miReadinessSummary(impacts), lastUpdated: new Date().toISOString() };
  }

  async runMiReadiness(tenantId: string, actorId: string, scope: Scope, equipmentId: string, dto: Row = {}) {
    const siteId = this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? this.selectedSite(scope) ?? ''));
    const gaps = await this.psiGaps(tenantId, scope, { equipmentId });
    const impactRows: Row[] = [];
    for (const type of miImpactTypes) {
      const matchingGap = gaps.find((gap) => String(gap.gap_title ?? gap.gap_type ?? '').toLowerCase().includes(type.toLowerCase().split(' ')[1] ?? '') || gap.equipment_id === equipmentId);
      if (!matchingGap && !['Missing Equipment Design Basis', 'Document Evidence Missing'].includes(type)) continue;
      const payload = {
        id: randomUUID(),
        company_id: tenantId,
        site_id: matchingGap?.site_id ?? siteId,
        unit_id: matchingGap?.unit_id ?? dto.unit_id ?? dto.unitId ?? null,
        area_id: matchingGap?.area_id ?? dto.area_id ?? dto.areaId ?? null,
        equipment_id: equipmentId,
        mi_record_id: dto.mi_record_id ?? dto.miRecordId ?? null,
        psi_module: matchingGap?.psi_module ?? this.psiModuleFromMiImpact(type),
        psi_record_id: matchingGap?.source_record_id ?? null,
        impact_type: type,
        impact_title: matchingGap?.gap_title ?? type,
        impact_description: matchingGap?.message ?? matchingGap?.recommended_action ?? null,
        impact_status: matchingGap ? 'MI Readiness Impact' : 'Waiting PSI Update',
        severity: matchingGap?.gap_severity ?? (type.includes('Missing') ? 'High' : 'Medium'),
        sync_status: matchingGap ? 'Needs Review' : 'Not Checked',
        owner_user_id: matchingGap?.owner_user_id ?? null,
        due_date: matchingGap?.due_date ?? null
      };
      const row = await this.db.single<Row>(this.db.from('psi_mi_readiness_impacts').insert(payload).select().single());
      if (row) impactRows.push(row);
    }
    await this.ensureLink(tenantId, actorId, { site_id: siteId, unit_id: dto.unit_id ?? dto.unitId ?? null, equipment_id: equipmentId, integration_title: `MI PSI readiness - ${equipmentId}`, integration_type: 'MI PSI Readiness', source_module: 'Mechanical Integrity', source_record_id: equipmentId, source_record_title: dto.equipment_title ?? dto.equipmentTitle ?? equipmentId, relationship_type: 'Supports MI readiness', impact_type: 'MI readiness impact', impact_severity: impactRows.some((row) => ['Critical', 'Startup Blocker'].includes(row.severity)) ? 'Critical' : 'High', integration_status: impactRows.length ? 'Waiting PSI Update' : 'Verified', sync_status: impactRows.length ? 'Needs Review' : 'In Sync', blocking_status: impactRows.length ? 'Blocking' : 'Not Blocking', source_snapshot_json: dto });
    await this.writeHistory(tenantId, actorId, 'psi.integration.mi.readiness_run', { site_id: siteId, equipment_id: equipmentId, id: equipmentId }, null, { impacts: impactRows }, 'MI PSI readiness checked', `${impactRows.length} impacts detected.`);
    return this.miReadiness(tenantId, scope, equipmentId);
  }

  miImpacts(tenantId: string, scope: Scope, equipmentId: string) {
    return this.safeMany<Row>(this.applyScope(this.db.from('psi_mi_readiness_impacts').select('*').eq('company_id', tenantId).eq('equipment_id', equipmentId), scope).order('created_at', { ascending: false }));
  }

  async resolveMiImpact(tenantId: string, actorId: string, scope: Scope, equipmentId: string, impactId: string, dto: Row) {
    if (!String(dto.reason ?? dto.resolution_note ?? '').trim()) throw new BadRequestException('Resolution note is required.');
    const before = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_mi_readiness_impacts').select('*').eq('company_id', tenantId).eq('equipment_id', equipmentId).eq('id', impactId), scope).maybeSingle()), 'MI PSI readiness impact not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_mi_readiness_impacts').update({ impact_status: 'Verified', sync_status: 'In Sync', resolved_by: actorId, resolved_at: new Date().toISOString(), resolution_note: dto.reason ?? dto.resolution_note, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', impactId).select().single()), 'Unable to resolve MI PSI impact.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.mi.impact.resolved', row, before, row, 'MI PSI readiness impact resolved', row.resolution_note);
    return row;
  }

  async runMiSyncCheck(tenantId: string, actorId: string, scope: Scope, equipmentId: string, dto: Row = {}) {
    const impacts = await this.miImpacts(tenantId, scope, equipmentId);
    const rows: Row[] = [];
    for (const impact of impacts) {
      const row = await this.createSyncCheck(tenantId, actorId, { ...impact, source_module: 'Mechanical Integrity', source_record_id: equipmentId, psi_module: impact.psi_module, psi_record_id: impact.psi_record_id, check_type: 'MI PSI design basis comparison', sync_status: impact.sync_status ?? 'Needs Review', impact_severity: impact.severity, diff_summary: impact.impact_description ?? impact.impact_title, diff_json: impact.diff_json ?? { psiValue: impact.psi_value, miValue: impact.mi_value } });
      rows.push(row);
    }
    return { rows, checkedAt: new Date().toISOString() };
  }

  async outOfSync(tenantId: string, scope: Scope, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(10, Number(query.limit ?? 25)));
    let request = this.applyScope(this.db.from('psi_sync_checks').select('*').eq('company_id', tenantId), scope);
    if (query.status) request = request.eq('check_status', String(query.status));
    if (query.syncStatus) request = request.eq('sync_status', String(query.syncStatus));
    request = request.order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    const rows = await this.safeMany<Row>(request);
    return { rows, page, limit, summary: this.syncSummary(rows), lastUpdated: new Date().toISOString() };
  }

  async runSyncCheck(tenantId: string, actorId: string, scope: Scope, dto: Row = {}) {
    const links = await this.linkRows(tenantId, scope, dto, false);
    const rows: Row[] = [];
    for (const link of links as Row[]) {
      if (['Closed', 'Verified', 'Waived', 'Cancelled'].includes(link.integration_status)) continue;
      const status = link.sync_status === 'In Sync' ? 'In Sync' : link.sync_status === 'Not Checked' ? 'Needs Review' : link.sync_status;
      const row = await this.createSyncCheck(tenantId, actorId, { ...link, integration_link_id: link.id, check_type: `${link.source_module} to PSI sync check`, check_status: status === 'In Sync' ? 'Verified' : 'Review Required', sync_status: status, diff_summary: link.required_update ?? link.required_action ?? 'Integration requires current-state review.', diff_json: { sourceSnapshot: link.source_snapshot_json, psiSnapshot: link.psi_snapshot_json } });
      rows.push(row);
      await this.db.single(this.db.from('psi_integration_links').update({ sync_status: status, last_checked_at: row.checked_at, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', link.id).select('id').single()).catch(() => null);
    }
    await this.writeHistory(tenantId, actorId, 'psi.integration.sync.run', { site_id: this.selectedSite(scope), id: 'sync-run' }, null, { count: rows.length }, 'PSI integration sync check run');
    return { rows, checkedAt: new Date().toISOString() };
  }

  async resolveSyncCheck(tenantId: string, actorId: string, scope: Scope, syncCheckId: string, dto: Row) {
    if (!String(dto.reason ?? dto.resolution_note ?? '').trim()) throw new BadRequestException('Resolution note is required.');
    const before = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_sync_checks').select('*').eq('company_id', tenantId).eq('id', syncCheckId), scope).maybeSingle()), 'PSI sync check not found.');
    const status = dto.status ?? dto.check_status ?? 'Resolved';
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_sync_checks').update({ check_status: status, sync_status: status === 'Verified' ? 'In Sync' : before.sync_status, resolved_by: actorId, resolved_at: new Date().toISOString(), resolution_note: dto.reason ?? dto.resolution_note, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', syncCheckId).select().single()), 'Unable to resolve PSI sync check.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.sync.resolved', row, before, row, 'PSI sync check resolved', row.resolution_note);
    return row;
  }

  async createSyncAction(tenantId: string, actorId: string, scope: Scope, syncCheckId: string, dto: Row) {
    const sync = this.requireRow(await this.safeSingle<Row>(this.applyScope(this.db.from('psi_sync_checks').select('*').eq('company_id', tenantId).eq('id', syncCheckId), scope).maybeSingle()), 'PSI sync check not found.');
    const action = await this.createStandaloneAction(tenantId, actorId, sync, { title: dto.title ?? sync.diff_summary ?? sync.check_type, sourceModule: sync.source_module, sourceRecordId: sync.source_record_id, ownerUserId: dto.owner_user_id ?? dto.ownerUserId ?? sync.owner_user_id, dueDate: dto.due_date ?? dto.dueDate, priority: dto.priority ?? (['Critical', 'Startup Blocker'].includes(sync.impact_severity) ? 'High' : 'Medium') });
    await this.db.single(this.db.from('psi_sync_checks').update({ action_id: action.action_id, check_status: 'Action Created', updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', syncCheckId).select('id').single()).catch(() => null);
    return action;
  }

  async createIntegrationAction(tenantId: string, actorId: string, scope: Scope, integrationLinkId: string, dto: Row) {
    const link = (await this.linkDetail(tenantId, scope, integrationLinkId)).link;
    return this.createStandaloneAction(tenantId, actorId, link, { title: dto.title ?? link.required_action ?? link.integration_title, sourceModule: link.source_module, sourceRecordId: link.source_record_id, ownerUserId: dto.owner_user_id ?? dto.ownerUserId ?? link.owner_user_id, dueDate: dto.due_date ?? dto.dueDate, priority: dto.priority ?? (['Critical', 'Startup Blocker'].includes(link.impact_severity) ? 'High' : 'Medium'), integrationLinkId });
  }

  history(tenantId: string, scope: Scope, query: Row = {}) {
    let request = this.applyScope(this.db.from('psi_integration_history_events').select('*').eq('company_id', tenantId), scope);
    if (query.sourceModule) request = request.eq('source_module', String(query.sourceModule));
    if (query.integrationLinkId) request = request.eq('integration_link_id', String(query.integrationLinkId));
    return this.safeMany<Row>(request.order('created_at', { ascending: false }).limit(Math.min(200, Number(query.limit ?? 100))));
  }

  async settings(tenantId: string, scope: Scope) {
    const siteId = this.selectedSite(scope);
    let request = this.db.from('psi_integration_settings').select('*').eq('company_id', tenantId);
    request = siteId ? request.eq('site_id', siteId) : request.is('site_id', null);
    const existing = await this.safeSingle<Row>(request.maybeSingle());
    if (existing) return existing;
    return {
      pssr_min_completeness_score: 90,
      block_moc_closure_on_critical_gap: true,
      block_pssr_startup_on_critical_gap: true,
      require_hazop_revalidation_on_psi_change: true,
      require_mi_sync_on_equipment_basis_change: true,
      allow_waiver_with_approval: true,
      auto_create_actions_for_startup_blockers: false,
      site_id: siteId
    };
  }

  async updateSettings(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const siteId = this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? this.selectedSite(scope) ?? ''));
    const before = await this.safeSingle<Row>(this.db.from('psi_integration_settings').select('*').eq('company_id', tenantId).eq('site_id', siteId).maybeSingle());
    const payload = this.clean({
      company_id: tenantId,
      site_id: siteId,
      pssr_min_completeness_score: this.numberOrNull(dto.pssr_min_completeness_score ?? dto.pssrMinCompletenessScore) ?? 90,
      block_moc_closure_on_critical_gap: dto.block_moc_closure_on_critical_gap ?? dto.blockMocClosureOnCriticalGap,
      block_pssr_startup_on_critical_gap: dto.block_pssr_startup_on_critical_gap ?? dto.blockPssrStartupOnCriticalGap,
      require_hazop_revalidation_on_psi_change: dto.require_hazop_revalidation_on_psi_change ?? dto.requireHazopRevalidationOnPsiChange,
      require_mi_sync_on_equipment_basis_change: dto.require_mi_sync_on_equipment_basis_change ?? dto.requireMiSyncOnEquipmentBasisChange,
      allow_waiver_with_approval: dto.allow_waiver_with_approval ?? dto.allowWaiverWithApproval,
      auto_create_actions_for_startup_blockers: dto.auto_create_actions_for_startup_blockers ?? dto.autoCreateActionsForStartupBlockers,
      notification_policy_json: dto.notification_policy_json ?? dto.notificationPolicy,
      settings_json: dto.settings_json ?? dto.settings,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    const row = before
      ? this.requireRow(await this.db.single<Row>(this.db.from('psi_integration_settings').update(payload).eq('company_id', tenantId).eq('id', before.id).select().single()), 'Unable to update PSI integration settings.')
      : this.requireRow(await this.db.single<Row>(this.db.from('psi_integration_settings').insert({ id: randomUUID(), ...payload }).select().single()), 'Unable to create PSI integration settings.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.settings.updated', row, before, row, 'PSI integration settings updated');
    return row;
  }

  async export(tenantId: string, actorId: string, scope: Scope, query: Row = {}) {
    const [dashboard, impactRegister, outOfSyncRows, history] = await Promise.all([this.dashboard(tenantId, scope, query), this.impactRegister(tenantId, scope, { ...query, limit: 100 }), this.outOfSync(tenantId, scope, { ...query, limit: 100 }), this.history(tenantId, scope, { limit: 100 })]);
    const payload = { exportedAt: new Date().toISOString(), dashboard, impactRegister, outOfSync: outOfSyncRows, history };
    await this.audit.write({ tenantId, actorId, action: 'psi.integration.export', entityType: 'PSI_INTEGRATION', entityId: 'export', after: { rows: impactRegister.rows.length } as JsonValue }).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.integration.export', { site_id: this.selectedSite(scope), id: 'export' }, null, payload as Row, 'PSI integration export generated');
    return payload;
  }

  lookups(kind: string) {
    const values: Record<string, string[]> = { integrationTypes, relationshipTypes, impactTypes, impactSeverities, integrationStatuses, syncStatuses, sourceModules, mocImpactStatuses, pssrReadinessStatuses, outOfSyncStatuses, pssrBlockerTypes, hazopBasisTypes, miImpactTypes };
    return values[kind] ?? [];
  }

  unitIntegrations(tenantId: string, scope: Scope, unitId: string, sourceModule?: string) {
    const query: Row = { unitId };
    if (sourceModule) query.sourceModule = sourceModule;
    return this.impactRegister(tenantId, scope, query);
  }

  equipmentIntegrations(tenantId: string, scope: Scope, equipmentId: string) {
    return this.impactRegister(tenantId, scope, { equipmentId });
  }

  private async linkRows(tenantId: string, scope: Scope, query: Row = {}, paginate = true) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(10, Number(query.limit ?? 25)));
    let request = this.applyScope(this.db.from('psi_integration_links').select('*').eq('company_id', tenantId), scope);
    if (query.unitId ?? query.unit_id) request = request.eq('unit_id', String(query.unitId ?? query.unit_id));
    if (query.equipmentId ?? query.equipment_id) request = request.eq('equipment_id', String(query.equipmentId ?? query.equipment_id));
    if (query.sourceModule) request = request.eq('source_module', String(query.sourceModule));
    if (query.integrationType) request = request.eq('integration_type', String(query.integrationType));
    if (query.status) request = request.eq('integration_status', String(query.status));
    if (query.syncStatus) request = request.eq('sync_status', String(query.syncStatus));
    if (query.blocking === 'true') request = request.eq('blocking_status', 'Blocking');
    if (query.search) {
      const search = String(query.search).replaceAll('%', '');
      request = request.or(`integration_title.ilike.%${search}%,source_record_title.ilike.%${search}%,psi_record_title.ilike.%${search}%`);
    }
    request = request.order('updated_at', { ascending: false });
    if (paginate) request = request.range((page - 1) * limit, page * limit - 1);
    return this.safeMany<Row>(request);
  }

  private async ensureLink(tenantId: string, actorId: string, payload: Row) {
    const before = await this.safeSingle<Row>(this.db.from('psi_integration_links').select('*').eq('company_id', tenantId).eq('source_module', payload.source_module).eq('source_record_id', payload.source_record_id).eq('integration_type', payload.integration_type).maybeSingle());
    const rowPayload = this.clean({ id: before?.id ?? randomUUID(), company_id: tenantId, created_by: before?.created_by ?? actorId, updated_by: actorId, updated_at: new Date().toISOString(), ...payload });
    const row = before
      ? this.requireRow(await this.db.single<Row>(this.db.from('psi_integration_links').update(rowPayload).eq('company_id', tenantId).eq('id', before.id).select().single()), 'Unable to update PSI integration link.')
      : this.requireRow(await this.db.single<Row>(this.db.from('psi_integration_links').insert(rowPayload).select().single()), 'Unable to create PSI integration link.');
    await this.writeHistory(tenantId, actorId, before ? 'psi.integration.link.updated' : 'psi.integration.link.created', row, before, row, before ? 'PSI integration link updated' : 'PSI integration link created', row.integration_title);
    return row;
  }

  private async createStandaloneAction(tenantId: string, actorId: string, scopeRow: Row, dto: Row) {
    const actionId = dto.actionId ?? dto.action_id ?? randomUUID();
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_integration_actions').insert({
      id: randomUUID(),
      company_id: tenantId,
      site_id: scopeRow.site_id ?? null,
      unit_id: scopeRow.unit_id ?? null,
      area_id: scopeRow.area_id ?? null,
      equipment_id: scopeRow.equipment_id ?? null,
      integration_link_id: dto.integrationLinkId ?? scopeRow.integration_link_id ?? scopeRow.id ?? null,
      source_module: dto.sourceModule ?? scopeRow.source_module ?? null,
      source_record_id: dto.sourceRecordId ?? scopeRow.source_record_id ?? null,
      action_id: actionId,
      action_title: this.requireText(dto.title ?? dto.actionTitle ?? scopeRow.required_action ?? scopeRow.impact_title, 'Action title is required.'),
      action_status: 'Open',
      action_owner_id: dto.ownerUserId ?? dto.owner_user_id ?? null,
      due_date: this.dateOrNull(dto.dueDate ?? dto.due_date),
      priority: dto.priority ?? 'Medium',
      created_by: actorId
    }).select().single()), 'Unable to create PSI integration action.');
    await this.audit.write({ tenantId, actorId, action: 'psi.integration.action.created', entityType: 'PSI_INTEGRATION_ACTION', entityId: row.id, after: row as JsonValue }).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.integration.action.created', row, null, row, 'PSI integration action created', row.action_title);
    return row;
  }

  private async createSyncCheck(tenantId: string, actorId: string, payload: Row) {
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_sync_checks').insert({
      id: randomUUID(),
      company_id: tenantId,
      site_id: payload.site_id ?? null,
      unit_id: payload.unit_id ?? null,
      area_id: payload.area_id ?? null,
      equipment_id: payload.equipment_id ?? null,
      integration_link_id: payload.integration_link_id ?? null,
      source_module: payload.source_module,
      source_record_id: payload.source_record_id,
      psi_module: payload.psi_module ?? null,
      psi_record_id: payload.psi_record_id ?? null,
      check_type: payload.check_type,
      check_status: payload.check_status ?? 'Review Required',
      sync_status: payload.sync_status ?? 'Needs Review',
      diff_summary: payload.diff_summary ?? null,
      diff_json: payload.diff_json ?? null,
      impact_severity: payload.impact_severity ?? payload.severity ?? 'Medium',
      checked_by: actorId,
      checked_at: new Date().toISOString()
    }).select().single()), 'Unable to create PSI sync check.');
    await this.writeHistory(tenantId, actorId, 'psi.integration.sync.check_created', row, null, row, 'PSI sync check created', row.diff_summary);
    return row;
  }

  private async sourceRecord(tableKey: string, tenantId: string, id: string) {
    const candidates: Record<string, string[]> = {
      moc: ['moc_requests', 'mocs', 'moc'],
      pssr: ['pssr_reviews', 'pssr', 'pssr_records'],
      hazop: ['hazop_studies', 'hazop'],
      mi: ['mi_equipment', 'equipment']
    };
    for (const table of candidates[tableKey] ?? []) {
      const row = await this.safeSingle<Row>(this.db.from(table).select('*').eq('company_id', tenantId).eq('id', id).maybeSingle());
      if (row) return row;
      const tenantRow = await this.safeSingle<Row>(this.db.from(table).select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
      if (tenantRow) return tenantRow;
    }
    return null;
  }

  private async psiGaps(tenantId: string, scope: Scope, query: Row = {}) {
    let request = this.applyScope(this.db.from('psi_completeness_gaps').select('*').eq('company_id', tenantId), scope);
    if (query.unitId ?? query.unit_id) request = request.eq('unit_id', String(query.unitId ?? query.unit_id));
    if (query.equipmentId ?? query.equipment_id) request = request.eq('equipment_id', String(query.equipmentId ?? query.equipment_id));
    if (query.mocRequired === 'true') request = request.eq('moc_required', true);
    if (query.pssrBlockers === 'true') request = request.eq('pssr_blocker', true);
    return this.safeMany<Row>(request);
  }

  private async completenessScores(tenantId: string, scope: Scope, query: Row = {}) {
    let request = this.applyScope(this.db.from('psi_completeness_scores').select('*').eq('company_id', tenantId), scope);
    if (query.unitId ?? query.unit_id) request = request.eq('unit_id', String(query.unitId ?? query.unit_id));
    if (query.equipmentId ?? query.equipment_id) request = request.eq('equipment_id', String(query.equipmentId ?? query.equipment_id));
    return this.safeMany<Row>(request);
  }

  private mocReadiness(assessment: Row | null, items: Row[]) {
    if (!assessment) return { status: 'Not Assessed', blockers: ['MOC PSI impact has not been assessed.'] };
    const blocking = items.filter((item) => item.blocking);
    return { status: blocking.length ? 'Blocked' : 'Ready for MOC Closure', blockers: blocking.map((item) => item.blocker_reason ?? item.checklist_item), completion: items.length ? Math.round(((items.length - blocking.length) / items.length) * 100) : 0 };
  }

  private pssrReadinessSummary(check: Row | null, blockers: Row[]) {
    if (!check) return { status: 'Not Checked', blockers: ['PSSR PSI readiness has not been checked.'] };
    const open = blockers.filter((item) => !['Closed', 'Cleared', 'Waived'].includes(item.blocker_status));
    return { status: check.readiness_status, blockers: open.map((item) => item.blocker_title), completion: blockers.length ? Math.round(((blockers.length - open.length) / blockers.length) * 100) : 100 };
  }

  private hazopBasisPackage(rows: Row[]) {
    return hazopBasisTypes.map((basisType) => ({ basisType, linked: rows.some((row) => row.basis_type === basisType || row.psi_module === basisType), records: rows.filter((row) => row.basis_type === basisType || row.psi_module === basisType) }));
  }

  private hazopRevalidation(rows: Row[]) {
    const changed = rows.filter((row) => row.revalidation_required || row.changed_after_study);
    return { required: changed.length > 0, count: changed.length, reasons: changed.map((row) => `${row.psi_module}: source changed after study`) };
  }

  private miReadinessSummary(impacts: Row[]) {
    const open = impacts.filter((item) => !['Verified', 'Resolved', 'Waived'].includes(item.impact_status));
    return { status: open.length ? 'PSI Incomplete' : 'PSI Ready for MI', blockers: open.map((item) => item.impact_title), completion: impacts.length ? Math.round(((impacts.length - open.length) / impacts.length) * 100) : 100 };
  }

  private registerSummary(rows: Row[]) {
    return { total: rows.length, blocking: rows.filter((row) => row.blocking_status === 'Blocking').length, outOfSync: rows.filter((row) => ['Out of Sync', 'Source Changed', 'PSI Changed', 'Needs Review'].includes(row.sync_status)).length, critical: rows.filter((row) => ['Critical', 'Startup Blocker'].includes(row.impact_severity)).length, closed: rows.filter((row) => ['Closed', 'Verified'].includes(row.integration_status)).length };
  }

  private syncSummary(rows: Row[]) {
    return { total: rows.length, open: rows.filter((row) => !['Resolved', 'Verified', 'Waived'].includes(row.check_status)).length, outOfSync: rows.filter((row) => ['Out of Sync', 'Source Changed', 'PSI Changed', 'Needs Review'].includes(row.sync_status)).length, actionsCreated: rows.filter((row) => row.action_id).length };
  }

  private psiModuleFromMiImpact(type: string) {
    if (type.includes('Relief') || type.includes('PSV')) return 'Relief Systems';
    if (type.includes('Material') || type.includes('Corrosion') || type.includes('Degradation')) return 'Material Compatibility';
    if (type.includes('Safeguard')) return 'Safeguards / Controls';
    if (type.includes('Electrical')) return 'Electrical Classification';
    if (type.includes('P&ID')) return 'Drawings / P&IDs';
    return 'Equipment Design Basis';
  }

  private aggregateScore(scores: Row[]) { if (!scores.length) return 0; return Math.round(scores.reduce((sum, item) => sum + Number(item.score ?? 0), 0) / scores.length * 100) / 100; }
  private countBy(rows: Row[], key: string) { return rows.reduce((acc, row) => ({ ...acc, [row[key] ?? 'Unknown']: (acc[row[key] ?? 'Unknown'] ?? 0) + 1 }), {} as Record<string, number>); }
  private dateOrNull(value: unknown) { if (!value) return null; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10); }
  private numberOrNull(value: unknown) { if (value === null || value === undefined || value === '') return null; const number = Number(value); return Number.isFinite(number) ? number : null; }
  private clean(row: Row) { return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined)); }
  private requireText(value: unknown, message: string) { const text = String(value ?? '').trim(); if (!text) throw new BadRequestException(message); return text; }
  private requireRow<T>(row: T | null | undefined, message: string): T { if (!row) throw new NotFoundException(message); return row; }
  private selectedSite(scope: Scope) { return scope.selectedSiteId ?? scope.allowedSiteIds?.[0] ?? null; }
  private assertSiteAccess(scope: Scope, siteId: string) { if (!siteId) throw new BadRequestException('Site is required.'); if (scope.corporateView || !scope.allowedSiteIds?.length || scope.allowedSiteIds.includes(siteId)) return siteId; throw new ForbiddenException('Selected site is outside your authorized scope.'); }
  private applyScope(query: any, scope: Scope, column = 'site_id') { if (scope.corporateView) return query; if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId); if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds); return query; }
  private async safeMany<T>(query: PromiseLike<any>) { try { return await this.db.many<T>(query); } catch { return []; } }
  private async safeSingle<T>(query: PromiseLike<any>) { try { return await this.db.single<T>(query); } catch { return null; } }

  private async writeHistory(tenantId: string, actorId: string | null, eventType: string, scopeRow: Row, before: Row | null, after: Row | null, title: string, description?: string | null) {
    await this.audit.write({ tenantId, actorId: actorId ?? 'system', action: eventType, entityType: 'PSI_INTEGRATION', entityId: String(scopeRow.integration_link_id ?? scopeRow.id ?? scopeRow.source_record_id ?? 'integration'), before: before as JsonValue, after: after as JsonValue }).catch(() => null);
    const event = { id: randomUUID(), company_id: tenantId, site_id: scopeRow.site_id ?? null, unit_id: scopeRow.unit_id ?? null, area_id: scopeRow.area_id ?? null, equipment_id: scopeRow.equipment_id ?? null, integration_link_id: scopeRow.integration_link_id ?? (scopeRow.integration_title ? scopeRow.id : null), source_module: scopeRow.source_module ?? null, source_record_id: scopeRow.source_record_id ?? null, psi_module: scopeRow.psi_module ?? null, psi_record_id: scopeRow.psi_record_id ?? null, event_type: eventType, event_title: title, event_description: description ?? null, severity: scopeRow.impact_severity ?? scopeRow.severity ?? null, actor_user_id: actorId, reason: description ?? null, before_value_json: before ?? null, after_value_json: after ?? null, metadata_json: scopeRow.metadata_json ?? null };
    await this.db.single(this.db.from('psi_integration_history_events').insert(event).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('psi_history_events').insert({ ...event, source_module: event.source_module ?? 'PSI Integration' }).select('id').single()).catch(() => null);
  }
}
