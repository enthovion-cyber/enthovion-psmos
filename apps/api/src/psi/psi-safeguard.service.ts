import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type Row = Record<string, any>;

export const safeguardCategories = ['Prevention', 'Detection', 'Control', 'Mitigation', 'Emergency response', 'Administrative', 'Passive protection', 'Active protection', 'Independent Protection Layer foundation', 'Other'];
export const safeguardTypes = ['Basic process control system', 'Alarm with operator response', 'Critical alarm', 'Interlock', 'SIF / SIS', 'PSV / PRV / rupture disk', 'Relief / vent / flare system', 'Fire and gas detection', 'Emergency shutdown', 'Emergency isolation valve', 'Mechanical design margin', 'Containment / bund / dike', 'Inerting / nitrogen blanketing', 'Ventilation', 'Scrubber / absorber', 'Cooling system', 'Quench system', 'Feed cutoff', 'Procedure / SOP', 'Operator round / monitoring', 'Training / competency', 'PTW / LOTO control', 'PPE', 'Emergency response plan', 'Inspection / testing program', 'Material compatibility control', 'Other'];
export const safeguardFunctionTypes = ['Prevent initiation', 'Detect deviation', 'Control deviation', 'Isolate source', 'Depressurize', 'Relieve pressure', 'Contain release', 'Reduce consequence', 'Warn operator', 'Shutdown process', 'Prevent ignition', 'Prevent exposure', 'Emergency response', 'Verify readiness', 'Other'];
export const safeguardCriticalities = ['Low', 'Medium', 'High', 'Critical'];
export const safeguardSourceModules = ['MI SIS/SIF', 'MI Interlock', 'MI Critical Alarm', 'MI PSV / Relief Device', 'PSI Relief System', 'PSI Safe Operating Limit', 'PSI Drawing / P&ID', 'Document Control procedure/SOP', 'PTW', 'LOTO', 'Fire & Gas', 'Emergency Response', 'Equipment Registry', 'Mechanical Integrity equipment', 'HAZOP', 'LOPA/SIL', 'MOC', 'PSSR', 'Training', 'Manual / Not Yet Implemented'];
export const safeguardEffectivenessStatuses = ['Effective', 'Effective With Conditions', 'Partially Effective', 'Not Effective', 'Unknown / Needs Review', 'Not Creditable', 'Manual Claim Only', 'Approved Exception'];
export const iplQualificationStatuses = ['Not IPL', 'Candidate', 'Claimed', 'Qualified', 'Qualified With Conditions', 'Not Qualified', 'Needs LOPA Review'];
export const safeguardTestingStatuses = ['Current', 'Due Soon', 'Overdue', 'Failed', 'Not Required', 'Unknown', 'Source Module Required', 'Bypassed', 'Impaired', 'Out of Service'];
export const safeguardConflictStatuses = ['No Conflict', 'Warning', 'Major Conflict', 'Critical Conflict', 'Override Approved'];
export const safeguardDocumentTypes = ['Safeguard design basis', 'Cause & effect matrix', 'SRS / SIS requirement specification', 'Control narrative', 'Alarm response procedure', 'Operating procedure', 'Emergency procedure', 'Proof test procedure', 'Inspection procedure', 'PSV datasheet', 'Relief calculation', 'Fire and gas layout', 'P&ID', 'HAZOP worksheet', 'LOPA worksheet', 'MOC package', 'PSSR checklist', 'Training record foundation', 'Maintenance/test record reference', 'Vendor document', 'Engineering calculation', 'Approval note'];
const hazardTypes = ['Overpressure', 'High temperature', 'Low temperature', 'Loss of containment', 'Toxic release', 'Flammable release', 'Fire', 'Explosion', 'Runaway reaction', 'Decomposition', 'Polymerization', 'Wrong chemical addition', 'Loss of cooling', 'Loss of agitation', 'Loss of inerting', 'Corrosion/material failure', 'Electrical ignition', 'Mechanical failure', 'Human error', 'Environmental release', 'Other'];

@Injectable()
export class PsiSafeguardService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async summary(tenantId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    const count = (predicate: (row: Row) => boolean) => rows.filter(predicate).length;
    return {
      totalSafeguardsControls: rows.length,
      criticalSafeguards: count((row) => row.criticality === 'Critical' || row.safety_critical),
      preventiveSafeguards: count((row) => row.safeguard_category === 'Prevention'),
      detectiveSafeguards: count((row) => row.safeguard_category === 'Detection'),
      mitigativeSafeguards: count((row) => row.safeguard_category === 'Mitigation'),
      administrativeControls: count((row) => row.safeguard_category === 'Administrative' || row.safeguard_type === 'Procedure / SOP'),
      instrumentedSafeguards: count((row) => ['SIF / SIS', 'Interlock', 'Critical alarm', 'Alarm with operator response', 'Basic process control system'].includes(row.safeguard_type)),
      mechanicalSafeguards: count((row) => ['PSV / PRV / rupture disk', 'Relief / vent / flare system', 'Mechanical design margin', 'Containment / bund / dike'].includes(row.safeguard_type)),
      proceduralControls: count((row) => ['Procedure / SOP', 'Operator round / monitoring', 'Training / competency', 'PTW / LOTO control'].includes(row.safeguard_type)),
      emergencyResponseControls: count((row) => row.safeguard_category === 'Emergency response' || row.safeguard_type === 'Emergency response plan'),
      safeguardsLinkedToHazop: count((row) => row.hazardLinks?.some((link: Row) => link.source_module === 'HAZOP')),
      safeguardsLinkedToLopa: count((row) => row.hazardLinks?.some((link: Row) => link.source_module === 'LOPA/SIL') || row.effectiveness?.ipl_claimed_in_lopa),
      safeguardsLinkedToSol: count((row) => row.hazardLinks?.some((link: Row) => link.source_module === 'PSI Safe Operating Limit') || row.sourceLinks?.some((link: Row) => link.linked_module === 'PSI Safe Operating Limit')),
      safeguardsLinkedToSifSis: count((row) => row.sourceLinks?.some((link: Row) => link.linked_module === 'MI SIS/SIF')),
      safeguardsLinkedToPsvRelief: count((row) => row.sourceLinks?.some((link: Row) => ['MI PSV / Relief Device', 'PSI Relief System'].includes(link.linked_module))),
      missingSafeguards: count((row) => row.completeness_status === 'Critical Gaps' || row.completeness_status === 'Incomplete'),
      unverifiedSafeguards: count((row) => ['Unknown / Needs Review', 'Manual Claim Only'].includes(row.effectiveness_status ?? row.effectiveness?.effectiveness_status)),
      bypassedImpairedSafeguards: count((row) => ['Bypassed', 'Impaired', 'Out of Service'].includes(row.impairment_status ?? row.testing?.bypass_impairment_status)),
      overdueTestingProofTest: count((row) => ['Overdue', 'Failed'].includes(row.testing_status ?? row.testing?.test_status)),
      missingEvidenceDocuments: count((row) => row.evidence_status === 'Missing'),
      conflicts: count((row) => !['No Conflict', 'Not Checked'].includes(row.conflict_status)),
      reviewOverdue: count((row) => this.isReviewOverdue(row)),
      pendingApproval: count((row) => ['Submitted', 'Pending Review', 'In Review'].includes(row.review_status)),
      mocRequired: count((row) => row.moc_update_required),
      pssrBlockers: count((row) => row.pssr_blocker),
      miReadinessImpact: count((row) => row.mi_readiness_impact),
      lastUpdated: new Date().toISOString()
    };
  }

  async registry(tenantId: string, scope: Scope, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const [rows, all] = await Promise.all([this.registryRows(tenantId, scope, query, true, page, limit), this.registryRows(tenantId, scope, query, false)]);
    return {
      rows,
      page,
      limit,
      total: all.length,
      summary: await this.summary(tenantId, scope, query),
      savedViews: ['All Safeguards', 'Critical Safeguards', 'Instrumented Safeguards', 'Mechanical Safeguards', 'Procedural Controls', 'Missing Safeguards', 'Unverified', 'Bypassed / Impaired', 'Overdue Testing', 'Conflicts', 'PSSR Blockers', 'MOC Required', 'Review Overdue', 'My Unit Safeguards'],
      lastUpdated: new Date().toISOString()
    };
  }

  async unitRegistry(tenantId: string, scope: Scope, unitId: string, query: Row = {}) {
    await this.unitRecord(tenantId, scope, unitId);
    return this.registry(tenantId, scope, { ...query, unitId });
  }

  async equipmentRegistry(tenantId: string, scope: Scope, equipmentId: string, query: Row = {}) {
    return this.registry(tenantId, scope, { ...query, equipmentId });
  }

  async create(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    this.validateIdentity(dto);
    const unit = await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId));
    const siteId = this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? unit.site_id));
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguards').insert(this.safeguardPayload(tenantId, actorId, siteId, unit, dto, { created_at: new Date().toISOString(), updated_at: new Date().toISOString() })).select().single()), 'Unable to create safeguard/control.');
    for (const item of this.array(dto.hazardLinks ?? dto.hazards)) await this.addHazard(tenantId, actorId, scope, row.id, item, false);
    if (this.hasFunctionFields(dto)) await this.upsertFunctionRequirements(tenantId, actorId, scope, row.id, dto, false);
    for (const item of this.array(dto.sourceLinks ?? dto.sources)) await this.addSourceLink(tenantId, actorId, scope, row.id, item, false);
    if (this.hasEffectivenessFields(dto)) await this.upsertEffectiveness(tenantId, actorId, scope, row.id, dto, false);
    if (this.hasTestingFields(dto)) await this.upsertTestingStatus(tenantId, actorId, scope, row.id, dto, false);
    if (dto.document_id ?? dto.documentId) await this.linkDocument(tenantId, actorId, scope, row.id, dto, false);
    await this.runSourceStatusCheck(tenantId, actorId, scope, row.id);
    await this.runConflictCheck(tenantId, actorId, scope, row.id);
    await this.runCompleteness(tenantId, actorId, scope, row.id);
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.created', row, null, row, 'Safeguard / control created', `${row.safeguard_title} created.`);
    return this.detail(tenantId, scope, row.id);
  }

  async update(tenantId: string, actorId: string, scope: Scope, safeguardId: string, dto: Row, permissions: string[] = []) {
    const before = await this.record(tenantId, scope, safeguardId);
    if (before.review_status === 'Approved' && !permissions.includes('psi.safeguard.approve')) throw new ForbiddenException('Approved safeguard/control is read-only unless controlled edit/MOC permission exists.');
    const unit = dto.unit_id ?? dto.unitId ? await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId)) : await this.unitRecord(tenantId, scope, before.unit_id);
    const siteId = this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? unit.site_id));
    const safetyChanged = ['safeguard_type', 'function_type', 'criticality', 'source_status', 'testing_status', 'impairment_status', 'safety_critical', 'ipl_candidate'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined);
    const payload: Row = this.safeguardPayload(tenantId, actorId, siteId, unit, { ...before, ...dto }, { updated_at: new Date().toISOString(), moc_update_required: safetyChanged ? true : before.moc_update_required });
    delete payload.created_at;
    delete payload.created_by;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguards').update(payload).eq('company_id', tenantId).eq('id', safeguardId).select().single()), 'Unable to update safeguard/control.');
    if (this.hasFunctionFields(dto)) await this.upsertFunctionRequirements(tenantId, actorId, scope, safeguardId, dto, false);
    if (this.hasEffectivenessFields(dto)) await this.upsertEffectiveness(tenantId, actorId, scope, safeguardId, dto, false);
    if (this.hasTestingFields(dto)) await this.upsertTestingStatus(tenantId, actorId, scope, safeguardId, dto, false);
    await this.runSourceStatusCheck(tenantId, actorId, scope, safeguardId);
    await this.runConflictCheck(tenantId, actorId, scope, safeguardId);
    await this.runCompleteness(tenantId, actorId, scope, safeguardId);
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.updated', row, before, row, 'Safeguard / control updated', safetyChanged ? 'Safety-sensitive safeguard change may require MOC.' : 'Safeguard metadata updated.');
    return this.detail(tenantId, scope, safeguardId);
  }

  async detail(tenantId: string, scope: Scope, safeguardId: string) {
    const safeguard = await this.record(tenantId, scope, safeguardId, true);
    const [unit, hazardLinks, functionRequirements, sourceLinks, effectiveness, testing, documents, completeness, conflicts, history, syncEvents] = await Promise.all([
      safeguard.unit_id ? this.unitRecord(tenantId, scope, safeguard.unit_id).catch(() => null) : Promise.resolve(null),
      this.hazards(tenantId, scope, safeguardId),
      this.functionRequirements(tenantId, scope, safeguardId),
      this.sourceLinks(tenantId, scope, safeguardId),
      this.effectiveness(tenantId, scope, safeguardId),
      this.testingStatus(tenantId, scope, safeguardId),
      this.documents(tenantId, scope, safeguardId),
      this.completeness(tenantId, scope, safeguardId),
      this.conflicts(tenantId, scope, safeguardId),
      this.history(tenantId, scope, safeguardId),
      this.syncEvents(tenantId, scope, safeguardId)
    ]);
    return { safeguard, unit, hazardLinks, functionRequirements, sourceLinks, effectiveness, testingStatus: testing, documents, completeness, conflicts, history, syncEvents, overview: this.overview(safeguard, hazardLinks, functionRequirements, sourceLinks, effectiveness, testing, documents, completeness, conflicts), tabs: this.tabs(safeguardId), actions: this.actions(safeguard, hazardLinks, functionRequirements, sourceLinks, effectiveness, testing, documents, completeness, conflicts) };
  }

  async archive(tenantId: string, actorId: string, scope: Scope, safeguardId: string, dto: Row) {
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive reason is required.');
    const before = await this.record(tenantId, scope, safeguardId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguards').update({ archived_at: new Date().toISOString(), archived_by: actorId, status: 'Archived', updated_by: actorId, updated_at: new Date().toISOString(), moc_update_required: before.safety_critical || before.criticality === 'Critical' }).eq('company_id', tenantId).eq('id', safeguardId).select().single()), 'Unable to archive safeguard/control.');
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.archived', row, before, row, 'Safeguard / control archived', String(dto.reason));
    return row;
  }

  async reactivate(tenantId: string, actorId: string, scope: Scope, safeguardId: string, dto: Row) {
    const before = await this.record(tenantId, scope, safeguardId, true);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguards').update({ archived_at: null, archived_by: null, status: 'Draft', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', safeguardId).select().single()), 'Unable to reactivate safeguard/control.');
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.reactivated', row, before, row, 'Safeguard / control reactivated', dto.reason ?? null);
    return row;
  }

  async clone(tenantId: string, actorId: string, scope: Scope, safeguardId: string, dto: Row) {
    const source = await this.record(tenantId, scope, safeguardId);
    return this.create(tenantId, actorId, scope, { ...source, id: randomUUID(), safeguard_title: dto.safeguard_title ?? `${source.safeguard_title} Copy`, safeguard_tag: dto.safeguard_tag ?? null, status: 'Draft', review_status: 'Draft' });
  }

  async hazards(tenantId: string, scope: Scope, safeguardId: string) {
    await this.record(tenantId, scope, safeguardId);
    return this.safeMany<Row>(this.db.from('psi_safeguard_hazard_links').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).is('removed_at', null).order('created_at', { ascending: true }));
  }

  async addHazard(tenantId: string, actorId: string, scope: Scope, safeguardId: string, dto: Row, writeEvent = true) {
    const safeguard = await this.record(tenantId, scope, safeguardId);
    this.requireText(dto.scenario_title ?? dto.scenarioTitle, 'Scenario title is required.');
    this.requireText(dto.hazard_type ?? dto.hazardType, 'Hazard type is required.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguard_hazard_links').insert(this.hazardPayload(tenantId, actorId, safeguard, dto)).select().single()), 'Unable to link hazard/scenario.');
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.safeguard.hazard.linked', safeguard, null, row, 'Hazard / scenario linked', row.scenario_title);
    return row;
  }

  async updateHazard(tenantId: string, actorId: string, scope: Scope, safeguardId: string, hazardLinkId: string, dto: Row) {
    const safeguard = await this.record(tenantId, scope, safeguardId);
    const before = this.requireRow(await this.safeSingle<Row>(this.db.from('psi_safeguard_hazard_links').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).eq('id', hazardLinkId).maybeSingle()), 'Hazard link not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguard_hazard_links').update(this.hazardPayload(tenantId, actorId, safeguard, { ...before, ...dto })).eq('company_id', tenantId).eq('id', hazardLinkId).select().single()), 'Unable to update hazard/scenario link.');
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.hazard.updated', safeguard, before, row, 'Hazard / scenario link updated', row.scenario_title);
    await this.runCompleteness(tenantId, actorId, scope, safeguardId);
    return row;
  }

  async removeHazard(tenantId: string, actorId: string, scope: Scope, safeguardId: string, hazardLinkId: string, dto: Row) {
    const safeguard = await this.record(tenantId, scope, safeguardId);
    const before = this.requireRow(await this.safeSingle<Row>(this.db.from('psi_safeguard_hazard_links').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).eq('id', hazardLinkId).maybeSingle()), 'Hazard link not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguard_hazard_links').update({ removed_at: new Date().toISOString(), removed_by: actorId, remove_reason: dto.reason ?? null }).eq('company_id', tenantId).eq('id', hazardLinkId).select().single()), 'Unable to remove hazard/scenario link.');
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.hazard.removed', safeguard, before, row, 'Hazard / scenario link removed', dto.reason ?? before.scenario_title);
    await this.runCompleteness(tenantId, actorId, scope, safeguardId);
    return row;
  }

  async functionRequirements(tenantId: string, scope: Scope, safeguardId: string) {
    await this.record(tenantId, scope, safeguardId);
    return this.safeSingle<Row>(this.db.from('psi_safeguard_function_requirements').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).maybeSingle());
  }

  async upsertFunctionRequirements(tenantId: string, actorId: string, scope: Scope, safeguardId: string, dto: Row, writeEvent = true) {
    const safeguard = await this.record(tenantId, scope, safeguardId);
    const before = await this.functionRequirements(tenantId, scope, safeguardId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguard_function_requirements').upsert(this.functionPayload(tenantId, safeguard, dto), { onConflict: 'safeguard_id' }).select().single()), 'Unable to save function requirements.');
    await this.markMocIfChanged(tenantId, actorId, safeguard, before, row, ['required_response_time', 'trip_action_setpoint', 'safe_state', 'required_action']);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.safeguard.function.updated', safeguard, before, row, 'Function / requirements updated');
    await this.runCompleteness(tenantId, actorId, scope, safeguardId);
    return row;
  }

  async sourceLinks(tenantId: string, scope: Scope, safeguardId: string) {
    await this.record(tenantId, scope, safeguardId);
    return this.safeMany<Row>(this.db.from('psi_safeguard_source_links').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async addSourceLink(tenantId: string, actorId: string, scope: Scope, safeguardId: string, dto: Row, writeEvent = true) {
    const safeguard = await this.record(tenantId, scope, safeguardId);
    this.requireText(dto.linked_module ?? dto.linkedModule, 'Linked module is required.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguard_source_links').insert(this.sourcePayload(tenantId, actorId, safeguard, dto)).select().single()), 'Unable to link source module record.');
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.safeguard.source.linked', safeguard, null, row, 'Source module linked', row.linked_record_tag_title ?? row.linked_module);
    await this.runSourceStatusCheck(tenantId, actorId, scope, safeguardId);
    return row;
  }

  async updateSourceLink(tenantId: string, actorId: string, scope: Scope, safeguardId: string, sourceLinkId: string, dto: Row) {
    const safeguard = await this.record(tenantId, scope, safeguardId);
    const before = this.requireRow(await this.safeSingle<Row>(this.db.from('psi_safeguard_source_links').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).eq('id', sourceLinkId).maybeSingle()), 'Source link not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguard_source_links').update(this.sourcePayload(tenantId, actorId, safeguard, { ...before, ...dto })).eq('company_id', tenantId).eq('id', sourceLinkId).select().single()), 'Unable to update source module link.');
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.source.updated', safeguard, before, row, 'Source module link updated');
    await this.runSourceStatusCheck(tenantId, actorId, scope, safeguardId);
    return row;
  }

  async removeSourceLink(tenantId: string, actorId: string, scope: Scope, safeguardId: string, sourceLinkId: string, dto: Row) {
    const safeguard = await this.record(tenantId, scope, safeguardId);
    const before = this.requireRow(await this.safeSingle<Row>(this.db.from('psi_safeguard_source_links').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).eq('id', sourceLinkId).maybeSingle()), 'Source link not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguard_source_links').update({ removed_at: new Date().toISOString(), removed_by: actorId, remove_reason: dto.reason ?? null }).eq('company_id', tenantId).eq('id', sourceLinkId).select().single()), 'Unable to remove source module link.');
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.source.removed', safeguard, before, row, 'Source module link removed', dto.reason ?? before.linked_module);
    await this.runSourceStatusCheck(tenantId, actorId, scope, safeguardId);
    return row;
  }

  async runSourceStatusCheck(tenantId: string, actorId: string, scope: Scope, safeguardId: string) {
    const safeguard = await this.record(tenantId, scope, safeguardId);
    const links = await this.sourceLinks(tenantId, scope, safeguardId);
    const worstSource = links.some((link) => ['Failed', 'Overdue', 'Impaired', 'Bypassed', 'Out of Service'].includes(link.source_status ?? link.source_test_status ?? link.source_bypass_impairment_status)) ? 'Failed / Impaired' : links.length ? 'Linked / Checked' : 'Missing Source Link';
    const worstTesting = links.find((link) => link.source_test_status)?.source_test_status ?? safeguard.testing_status ?? null;
    const worstImpairment = links.find((link) => link.source_bypass_impairment_status)?.source_bypass_impairment_status ?? safeguard.impairment_status ?? null;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguards').update({ source_status: worstSource, testing_status: worstTesting, impairment_status: worstImpairment, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', safeguardId).select().single()), 'Unable to update source status.');
    const event = { id: randomUUID(), company_id: tenantId, site_id: row.site_id, safeguard_id: row.id, linked_module: links[0]?.linked_module ?? null, linked_record_id: links[0]?.linked_record_id ?? null, sync_direction: 'compare-only', source_module: links[0]?.linked_module ?? 'Manual / Not Yet Implemented', target_module: 'PSI Safeguards / Controls', status: worstSource, field_diff_json: { links }, synced_by: actorId };
    await this.db.single(this.db.from('psi_safeguard_source_sync_events').insert(event).select('id').single()).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.source_status.checked', row, safeguard, { row, links }, 'Safeguard source status checked');
    return { safeguard: row, links, status: worstSource, event };
  }

  sourceDiff(tenantId: string, scope: Scope, safeguardId: string) {
    return this.detail(tenantId, scope, safeguardId).then((detail) => ({ mode: 'compare-only', fieldDiff: detail.sourceLinks.map((link: Row) => ({ linkedModule: link.linked_module, linkedRecordId: link.linked_record_id, sourceStatus: link.source_status, currentSourceStatus: detail.safeguard.source_status, sourceTestStatus: link.source_test_status, currentTestingStatus: detail.safeguard.testing_status, sourceBypassImpairmentStatus: link.source_bypass_impairment_status, currentImpairmentStatus: detail.safeguard.impairment_status })) }));
  }

  async compareSource(tenantId: string, actorId: string, scope: Scope, safeguardId: string) {
    const diff = await this.sourceDiff(tenantId, scope, safeguardId);
    const safeguard = await this.record(tenantId, scope, safeguardId);
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.source_sync.compare', safeguard, null, diff, 'Safeguard source sync compared');
    return diff;
  }

  async pullSource(tenantId: string, actorId: string, scope: Scope, safeguardId: string) {
    return this.runSourceStatusCheck(tenantId, actorId, scope, safeguardId);
  }

  async effectiveness(tenantId: string, scope: Scope, safeguardId: string) {
    await this.record(tenantId, scope, safeguardId);
    return this.safeSingle<Row>(this.db.from('psi_safeguard_effectiveness_basis').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).maybeSingle());
  }

  async upsertEffectiveness(tenantId: string, actorId: string, scope: Scope, safeguardId: string, dto: Row, writeEvent = true) {
    const safeguard = await this.record(tenantId, scope, safeguardId);
    const before = await this.effectiveness(tenantId, scope, safeguardId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguard_effectiveness_basis').upsert(this.effectivenessPayload(tenantId, safeguard, dto), { onConflict: 'safeguard_id' }).select().single()), 'Unable to save effectiveness/independence basis.');
    await this.db.single(this.db.from('psi_safeguards').update({ effectiveness_status: row.effectiveness_status, ipl_candidate: Boolean(row.ipl_candidate), updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', safeguardId).select('id').single()).catch(() => null);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.safeguard.effectiveness.updated', safeguard, before, row, 'Effectiveness / independence basis updated');
    await this.runConflictCheck(tenantId, actorId, scope, safeguardId);
    await this.runCompleteness(tenantId, actorId, scope, safeguardId);
    return row;
  }

  async testingStatus(tenantId: string, scope: Scope, safeguardId: string) {
    await this.record(tenantId, scope, safeguardId);
    return this.safeSingle<Row>(this.db.from('psi_safeguard_testing_status').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).maybeSingle());
  }

  async upsertTestingStatus(tenantId: string, actorId: string, scope: Scope, safeguardId: string, dto: Row, writeEvent = true) {
    const safeguard = await this.record(tenantId, scope, safeguardId);
    const before = await this.testingStatus(tenantId, scope, safeguardId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguard_testing_status').upsert(this.testingPayload(tenantId, safeguard, dto), { onConflict: 'safeguard_id' }).select().single()), 'Unable to save testing/impairment status.');
    await this.db.single(this.db.from('psi_safeguards').update({ testing_status: row.test_status, impairment_status: row.bypass_impairment_status, mi_readiness_impact: Boolean(row.readiness_impact) || safeguard.mi_readiness_impact, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', safeguardId).select('id').single()).catch(() => null);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.safeguard.testing.updated', safeguard, before, row, 'Testing / monitoring / impairment status updated');
    await this.runConflictCheck(tenantId, actorId, scope, safeguardId);
    await this.runCompleteness(tenantId, actorId, scope, safeguardId);
    return row;
  }

  async documents(tenantId: string, scope: Scope, safeguardId: string) {
    await this.record(tenantId, scope, safeguardId);
    return this.safeMany<Row>(this.db.from('psi_safeguard_document_links').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async linkDocument(tenantId: string, actorId: string, scope: Scope, safeguardId: string, dto: Row, writeEvent = true) {
    const safeguard = await this.record(tenantId, scope, safeguardId);
    this.requireText(dto.document_id ?? dto.documentId, 'Document Control document ID is required.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguard_document_links').insert(this.documentPayload(tenantId, actorId, safeguard, dto)).select().single()), 'Unable to link document/evidence.');
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.safeguard.document.linked', safeguard, null, row, 'Safeguard evidence document linked', row.document_type);
    await this.runCompleteness(tenantId, actorId, scope, safeguardId);
    return row;
  }

  async unlinkDocument(tenantId: string, actorId: string, scope: Scope, safeguardId: string, documentLinkId: string, dto: Row) {
    const safeguard = await this.record(tenantId, scope, safeguardId);
    const before = this.requireRow(await this.safeSingle<Row>(this.db.from('psi_safeguard_document_links').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).eq('id', documentLinkId).maybeSingle()), 'Document link not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguard_document_links').update({ removed_at: new Date().toISOString(), removed_by: actorId, remove_reason: dto.reason ?? null }).eq('company_id', tenantId).eq('id', documentLinkId).select().single()), 'Unable to unlink document/evidence.');
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.document.unlinked', safeguard, before, row, 'Safeguard evidence document unlinked', dto.reason ?? before.document_type);
    await this.runCompleteness(tenantId, actorId, scope, safeguardId);
    return row;
  }

  async runCompleteness(tenantId: string, actorId: string, scope: Scope, safeguardId: string) {
    const safeguard = await this.record(tenantId, scope, safeguardId, true);
    const [hazards, fn, sources, effectiveness, testing, documents, conflicts] = await Promise.all([this.hazards(tenantId, scope, safeguardId), this.functionRequirements(tenantId, scope, safeguardId), this.sourceLinks(tenantId, scope, safeguardId), this.effectiveness(tenantId, scope, safeguardId), this.testingStatus(tenantId, scope, safeguardId), this.documents(tenantId, scope, safeguardId), this.conflicts(tenantId, scope, safeguardId)]);
    const critical = this.isCritical(safeguard);
    const alarm = ['Alarm with operator response', 'Critical alarm'].includes(safeguard.safeguard_type);
    const instrumented = ['SIF / SIS', 'Interlock', 'Emergency shutdown', 'Basic process control system'].includes(safeguard.safeguard_type);
    const psv = ['PSV / PRV / rupture disk', 'Relief / vent / flare system'].includes(safeguard.safeguard_type);
    const procedure = ['Procedure / SOP', 'Operator round / monitoring', 'Training / competency', 'PTW / LOTO control'].includes(safeguard.safeguard_type);
    const checks = [
      this.check('unit', 'Unit selected', Boolean(safeguard.unit_id), 'Critical', 'Process unit is required.'),
      this.check('title', 'Safeguard title exists', Boolean(safeguard.safeguard_title), 'Critical', 'Safeguard title is required.'),
      this.check('type', 'Safeguard type exists', Boolean(safeguard.safeguard_type), 'Critical', 'Safeguard type is required.'),
      this.check('function_type', 'Function type exists', Boolean(safeguard.function_type), 'Critical', 'Function type is required.'),
      this.check('criticality', 'Criticality assigned', Boolean(safeguard.criticality), 'High', 'Criticality is required.'),
      this.check('critical_owner', 'Critical safeguard has owner', !critical || Boolean(safeguard.owner_user_id), 'Critical', 'Critical safeguards require an owner.'),
      this.check('hazard_link', 'Critical safeguard links hazard/scenario', !critical || hazards.length > 0, 'Critical', 'Critical safeguards require a hazard/scenario link.'),
      this.check('function_description', 'Function description exists', !critical || Boolean(fn?.function_description), 'Critical', 'Critical safeguards require function description.'),
      this.check('required_action', 'Required response/action defined', !critical || Boolean(fn?.required_action), 'High', 'Required action/response is missing.'),
      this.check('source_link', 'Source module link exists where required', !critical || sources.length > 0, 'Critical', 'Critical safeguards require a source link or approved manual reason.'),
      this.check('effectiveness_basis', 'Effectiveness basis defined for critical safeguard', !critical || Boolean(effectiveness?.effectiveness_basis), 'High', 'Effectiveness basis is missing.'),
      this.check('ipl_independence', 'IPL candidate has independence basis', !safeguard.ipl_candidate || Boolean(effectiveness?.independence_basis), 'High', 'IPL candidate requires independence basis.'),
      this.check('alarm_response', 'Alarm/operator response has response time and SOP/procedure', !alarm || (Boolean(fn?.required_response_time) && documents.some((d) => ['Alarm response procedure', 'Operating procedure'].includes(d.document_type))), 'High', 'Alarm/operator response safeguard needs response time and procedure evidence.'),
      this.check('instrumented_setpoint', 'Instrumented safeguard has setpoint/safe state', !instrumented || Boolean(fn?.trip_action_setpoint || fn?.safe_state), 'High', 'Instrumented safeguard needs setpoint or safe state.'),
      this.check('psv_relief_link', 'PSV/relief safeguard links relief basis or MI device', !psv || sources.some((s) => ['MI PSV / Relief Device', 'PSI Relief System'].includes(s.linked_module)), 'High', 'PSV/relief safeguard should link relief basis or MI relief device.'),
      this.check('procedure_training', 'Procedure/admin safeguard shows human dependency/training', !procedure || Boolean(fn?.human_factor_dependency || fn?.required_competence_training), 'Medium', 'Procedure/admin safeguards need human factor and training basis.'),
      this.check('testing_basis', 'Test/proof/inspection requirement defined where required', !(testing?.testing_required || critical) || Boolean(testing?.test_proof_inspection_requirement), 'High', 'Testing/proof/inspection requirement is missing.'),
      this.check('bypass_rule', 'Bypass/impairment rule defined for critical safeguard', !critical || Boolean(fn?.temporary_impairment_controls || testing?.bypass_authorization_requirement), 'High', 'Critical safeguard needs bypass/impairment controls.'),
      this.check('evidence', 'Evidence document linked where required', !critical || documents.length > 0, 'High', 'Critical safeguard needs current evidence from Document Control.'),
      this.check('review_date', 'Review date exists and not overdue', Boolean(safeguard.next_review_due) && !this.isReviewOverdue(safeguard), 'Medium', 'Next review due date is missing or overdue.'),
      this.check('source_status', 'Source status checked', Boolean(safeguard.source_status), 'Medium', 'Run source status check.'),
      this.check('conflicts_checked', 'Conflicts checked', conflicts.length > 0 || safeguard.conflict_status === 'No Conflict', 'Medium', 'Run conflict check.')
    ];
    await this.db.from('psi_safeguard_completeness_evaluations').delete().eq('company_id', tenantId).eq('safeguard_id', safeguardId);
    const rows = checks.map((check) => this.clean({ id: randomUUID(), company_id: tenantId, site_id: safeguard.site_id, safeguard_id: safeguard.id, unit_id: safeguard.unit_id, equipment_id: safeguard.equipment_id ?? null, ...check, owner_user_id: safeguard.owner_user_id ?? null, evaluated_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
    if (rows.length) await this.db.many<Row>(this.db.from('psi_safeguard_completeness_evaluations').insert(rows).select()).catch(() => []);
    const open = checks.filter((check) => check.status !== 'Complete');
    const score = Math.round((checks.length - open.length) / checks.length * 100);
    const status = open.some((check) => check.status === 'Critical Gaps') ? 'Critical Gaps' : open.length > checks.length / 2 ? 'Incomplete' : open.length ? 'Mostly Complete' : 'Complete';
    const pssrBlocker = open.some((check) => check.pssr_blocker);
    const miImpact = open.some((check) => check.mi_readiness_impact);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguards').update({ completeness_status: status, completeness_score: score, pssr_blocker: pssrBlocker || safeguard.pssr_blocker, mi_readiness_impact: miImpact || safeguard.mi_readiness_impact, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', safeguardId).select().single()), 'Unable to update completeness.');
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.completeness.run', row, safeguard, { status, score, checks }, 'Safeguard completeness evaluated');
    return { status, score, checks };
  }

  async completeness(tenantId: string, scope: Scope, safeguardId: string) {
    await this.record(tenantId, scope, safeguardId);
    return this.safeMany<Row>(this.db.from('psi_safeguard_completeness_evaluations').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).order('created_at', { ascending: true }));
  }

  async runConflictCheck(tenantId: string, actorId: string, scope: Scope, safeguardId: string) {
    const safeguard = await this.record(tenantId, scope, safeguardId, true);
    const [hazards, sources, effectiveness, testing, documents] = await Promise.all([this.hazards(tenantId, scope, safeguardId), this.sourceLinks(tenantId, scope, safeguardId), this.effectiveness(tenantId, scope, safeguardId), this.testingStatus(tenantId, scope, safeguardId), this.documents(tenantId, scope, safeguardId)]);
    const conflicts: Row[] = [];
    if (this.isCritical(safeguard) && !hazards.length) conflicts.push(this.conflict(tenantId, safeguard, 'Critical hazard/scenario has no linked safeguard scenario', 'Critical Conflict', 'Critical', 'Critical safeguard must explicitly link at least one hazard/scenario.'));
    if (safeguard.ipl_candidate && !(effectiveness?.ipl_claimed_in_lopa || sources.some((s) => s.linked_module === 'LOPA/SIL'))) conflicts.push(this.conflict(tenantId, safeguard, 'IPL claimed without LOPA link', 'Warning', 'High', 'IPL candidate/claim should link to LOPA/SIL for credit validation.'));
    if (effectiveness?.ipl_claimed_in_lopa && ['Unknown / Needs Review', 'Not Effective', 'Not Creditable'].includes(effectiveness.effectiveness_status)) conflicts.push(this.conflict(tenantId, safeguard, 'IPL claimed with weak effectiveness basis', 'Major Conflict', 'High', 'LOPA IPL claim has unknown/not effective PSI foundation.'));
    if (this.isCritical(safeguard) && !sources.length) conflicts.push(this.conflict(tenantId, safeguard, 'Critical safeguard source module record missing', 'Critical Conflict', 'Critical', 'Critical safeguard requires a source link or approved manual placeholder.'));
    if (sources.some((s) => ['Failed', 'Overdue'].includes(s.source_test_status ?? s.source_status))) conflicts.push(this.conflict(tenantId, safeguard, 'Source status failed or overdue', 'Critical Conflict', 'Critical', 'Source module reports failed/overdue status.', 'Source Module', sources[0]?.linked_record_id ?? null, sources[0] ?? null, safeguard));
    if (['Bypassed', 'Impaired', 'Out of Service'].includes(testing?.bypass_impairment_status ?? safeguard.impairment_status)) conflicts.push(this.conflict(tenantId, safeguard, 'Critical safeguard actively bypassed/impaired', this.isCritical(safeguard) ? 'Critical Conflict' : 'Major Conflict', 'Critical', 'Safeguard bypass/impairment affects readiness.'));
    if (['Overdue', 'Failed'].includes(testing?.test_status ?? safeguard.testing_status)) conflicts.push(this.conflict(tenantId, safeguard, 'Safeguard test/proof inspection overdue or failed', 'Major Conflict', 'High', 'Testing/proof/inspection is overdue or failed.'));
    if (['Alarm with operator response', 'Critical alarm'].includes(safeguard.safeguard_type) && !documents.some((d) => ['Alarm response procedure', 'Operating procedure'].includes(d.document_type))) conflicts.push(this.conflict(tenantId, safeguard, 'Alarm safeguard missing operator response or SOP', 'Major Conflict', 'High', 'Alarm/operator response safeguard requires procedure evidence.'));
    if (this.isCritical(safeguard) && !documents.length) conflicts.push(this.conflict(tenantId, safeguard, 'Safeguard missing current approved document', 'Warning', 'High', 'Critical safeguard evidence is missing.'));
    await this.db.from('psi_safeguard_conflict_results').delete().eq('company_id', tenantId).eq('safeguard_id', safeguardId);
    if (conflicts.length) await this.db.many<Row>(this.db.from('psi_safeguard_conflict_results').insert(conflicts).select()).catch(() => []);
    const status = this.worstConflict(conflicts);
    const pssrBlocker = conflicts.some((c) => c.conflict_status === 'Critical Conflict');
    const miImpact = conflicts.some((c) => String(c.conflict_type).toLowerCase().includes('test') || String(c.conflict_type).toLowerCase().includes('bypass') || String(c.conflict_type).toLowerCase().includes('impaired'));
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguards').update({ conflict_status: status, pssr_blocker: pssrBlocker || safeguard.pssr_blocker, mi_readiness_impact: miImpact || safeguard.mi_readiness_impact, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', safeguardId).select().single()), 'Unable to update conflict status.');
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.conflict_check.run', row, safeguard, { status, conflicts }, 'Safeguard conflict validation run');
    return { status, conflicts };
  }

  async conflicts(tenantId: string, scope: Scope, safeguardId: string) {
    await this.record(tenantId, scope, safeguardId);
    return this.safeMany<Row>(this.db.from('psi_safeguard_conflict_results').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).order('created_at', { ascending: false }));
  }

  async overrideConflict(tenantId: string, actorId: string, scope: Scope, safeguardId: string, conflictId: string, dto: Row) {
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Conflict override reason is required.');
    const safeguard = await this.record(tenantId, scope, safeguardId);
    const before = this.requireRow(await this.safeSingle<Row>(this.db.from('psi_safeguard_conflict_results').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).eq('id', conflictId).maybeSingle()), 'Conflict not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguard_conflict_results').update({ override_approved: true, override_reason: dto.reason, override_approved_by: actorId, override_approved_at: new Date().toISOString(), conflict_status: 'Override Approved', updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', conflictId).select().single()), 'Unable to override conflict.');
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.conflict.override', safeguard, before, row, 'Safeguard conflict override approved', String(dto.reason));
    return row;
  }

  async submitReview(tenantId: string, actorId: string, scope: Scope, safeguardId: string, dto: Row) {
    const safeguard = await this.record(tenantId, scope, safeguardId);
    const [completeness, conflicts] = await Promise.all([this.runCompleteness(tenantId, actorId, scope, safeguardId), this.runConflictCheck(tenantId, actorId, scope, safeguardId)]);
    if (conflicts.conflicts.some((c) => c.conflict_status === 'Critical Conflict' && !c.override_approved)) throw new BadRequestException('Critical conflicts block safeguard review.');
    if (completeness.checks.some((c) => c.status === 'Critical Gaps')) throw new BadRequestException('Critical completeness gaps block safeguard review.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_safeguards').update({ review_status: 'Submitted', status: 'Pending Review', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', safeguardId).select().single()), 'Unable to submit safeguard for review.');
    await this.writeHistory(tenantId, actorId, 'psi.safeguard.review.submitted', row, safeguard, { completeness, conflicts }, 'Safeguard submitted for review', dto.reason ?? null);
    return row;
  }

  async history(tenantId: string, scope: Scope, safeguardId: string) {
    await this.record(tenantId, scope, safeguardId, true);
    return this.safeMany<Row>(this.db.from('psi_safeguard_history_events').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).order('created_at', { ascending: false }));
  }

  async syncEvents(tenantId: string, scope: Scope, safeguardId: string) {
    await this.record(tenantId, scope, safeguardId, true);
    return this.safeMany<Row>(this.db.from('psi_safeguard_source_sync_events').select('*').eq('company_id', tenantId).eq('safeguard_id', safeguardId).order('synced_at', { ascending: false }));
  }

  importTemplate() {
    return { columns: ['unit_code', 'area', 'equipment_tag', 'safeguard_title', 'safeguard_tag', 'safeguard_category', 'safeguard_type', 'function_type', 'criticality', 'safety_critical', 'psm_critical', 'ipl_candidate', 'source_module', 'source_record_reference', 'hazard_type', 'scenario_reference', 'function_description', 'required_action', 'required_response_time', 'safe_state', 'trip_action_setpoint', 'effectiveness_status', 'independence_required', 'testing_required', 'evidence_document_reference', 'owner_email', 'next_review_due'] };
  }

  async importPreview(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const rows = this.array(dto.rows);
    const preview = rows.map((row, index) => ({ index: index + 1, row, errors: this.validateImportRow(row), warnings: this.importWarnings(row) }));
    const job = { id: randomUUID(), company_id: tenantId, site_id: this.selectedSite(scope), uploaded_by: actorId, file_name: dto.fileName ?? 'safeguards-import.csv', file_key: dto.fileKey ?? null, status: 'Preview', total_rows: rows.length, valid_rows: preview.filter((row) => !row.errors.length).length, error_rows: preview.filter((row) => row.errors.length).length, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    await this.db.single(this.db.from('psi_safeguard_import_jobs').insert(job).select('id').single()).catch(() => null);
    await this.audit.write({ tenantId, actorId, action: 'psi.safeguard.import.preview', entityType: 'PSI_SAFEGUARD_IMPORT', entityId: job.id, after: { job, preview } as JsonValue }).catch(() => null);
    return { job, preview, template: this.importTemplate() };
  }

  async exportRows(tenantId: string, actorId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    await this.audit.write({ tenantId, actorId, action: 'psi.safeguard.export', entityType: 'PSI_SAFEGUARD', entityId: 'export', after: { count: rows.length } as JsonValue }).catch(() => null);
    await this.db.single(this.db.from('psi_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: this.selectedSite(scope), event_type: 'psi.safeguard.export', event_title: 'Safeguards / Controls exported', event_description: `${rows.length} safeguard rows exported.`, source_module: 'PSI Safeguards / Controls', actor_user_id: actorId, after_value_json: { count: rows.length } }).select('id').single()).catch(() => null);
    return { rows, count: rows.length, exportedAt: new Date().toISOString(), formats: ['CSV', 'Excel', 'Unit safeguards report', 'Critical safeguards report', 'PSSR blocker report', 'MOC required report', 'Audit-ready safeguard package'] };
  }

  async registryRows(tenantId: string, scope: Scope, query: Row, paginate: boolean, page = 1, limit = 25) {
    let request = this.db.from('psi_safeguards').select('*').eq('company_id', tenantId);
    request = this.applyScope(request, scope);
    if (query.unitId ?? query.unit_id) request = request.eq('unit_id', String(query.unitId ?? query.unit_id));
    if (query.equipmentId ?? query.equipment_id) request = request.eq('equipment_id', String(query.equipmentId ?? query.equipment_id));
    if (query.critical === 'true') request = request.or('criticality.eq.Critical,safety_critical.eq.true');
    if (query.missing === 'true') request = request.in('completeness_status', ['Incomplete', 'Critical Gaps']);
    if (query.conflicts === 'true') request = request.not('conflict_status', 'in', '("No Conflict","Not Checked")');
    if (query.bypassedImpaired === 'true') request = request.in('impairment_status', ['Bypassed', 'Impaired', 'Out of Service']);
    if (query.overdueTesting === 'true') request = request.in('testing_status', ['Overdue', 'Failed']);
    if (query.unverified === 'true') request = request.in('effectiveness_status', ['Unknown / Needs Review', 'Manual Claim Only']);
    if (query.reviewOverdue === 'true') request = request.lt('next_review_due', new Date().toISOString()).neq('review_status', 'Approved');
    if (query.mocRequired === 'true') request = request.eq('moc_update_required', true);
    if (query.pssrBlockers === 'true') request = request.eq('pssr_blocker', true);
    if (query.safeguardType) request = request.eq('safeguard_type', String(query.safeguardType));
    if (query.functionType) request = request.eq('function_type', String(query.functionType));
    if (query.criticality) request = request.eq('criticality', String(query.criticality));
    if (query.status) request = request.eq('status', String(query.status));
    if (query.search) {
      const search = String(query.search).replaceAll('%', '');
      request = request.or(`safeguard_title.ilike.%${search}%,safeguard_tag.ilike.%${search}%,system_service.ilike.%${search}%`);
    }
    const sort = String(query.sort ?? 'updated_at.desc').split('.');
    request = request.order(this.safeSortColumn(sort[0] ?? 'updated_at'), { ascending: sort[1] === 'asc' });
    if (paginate) request = request.range((page - 1) * limit, page * limit - 1);
    const rows = await this.safeMany<Row>(request);
    const ids = rows.map((row) => row.id);
    if (!ids.length) return [];
    const [hazards, sources, docs, completeness, conflicts, effectiveness, testing] = await Promise.all([
      this.safeMany<Row>(this.db.from('psi_safeguard_hazard_links').select('*').eq('company_id', tenantId).in('safeguard_id', ids).is('removed_at', null)),
      this.safeMany<Row>(this.db.from('psi_safeguard_source_links').select('*').eq('company_id', tenantId).in('safeguard_id', ids).is('removed_at', null)),
      this.safeMany<Row>(this.db.from('psi_safeguard_document_links').select('*').eq('company_id', tenantId).in('safeguard_id', ids).is('removed_at', null)),
      this.safeMany<Row>(this.db.from('psi_safeguard_completeness_evaluations').select('*').eq('company_id', tenantId).in('safeguard_id', ids)),
      this.safeMany<Row>(this.db.from('psi_safeguard_conflict_results').select('*').eq('company_id', tenantId).in('safeguard_id', ids)),
      this.safeMany<Row>(this.db.from('psi_safeguard_effectiveness_basis').select('*').eq('company_id', tenantId).in('safeguard_id', ids)),
      this.safeMany<Row>(this.db.from('psi_safeguard_testing_status').select('*').eq('company_id', tenantId).in('safeguard_id', ids))
    ]);
    const merged = rows.map((row) => {
      const hazardLinks = hazards.filter((item) => item.safeguard_id === row.id);
      const sourceLinks = sources.filter((item) => item.safeguard_id === row.id);
      const documents = docs.filter((item) => item.safeguard_id === row.id);
      return { ...row, hazardLinks, sourceLinks, documents, completenessChecks: completeness.filter((item) => item.safeguard_id === row.id), conflicts: conflicts.filter((item) => item.safeguard_id === row.id), effectiveness: effectiveness.find((item) => item.safeguard_id === row.id) ?? null, testing: testing.find((item) => item.safeguard_id === row.id) ?? null, evidence_status: documents.length ? 'Linked' : 'Missing' };
    });
    const sourceRecordId = query.sourceRecordId ?? query.source_record_id;
    const sourceModule = query.sourceModule ?? query.source_module ?? query.linkedModule ?? query.linked_module;
    if (!sourceRecordId && !sourceModule) return merged;
    return merged.filter((row) => {
      const hazardMatch = row.hazardLinks.some((item: Row) =>
        (!sourceRecordId || item.source_record_id === sourceRecordId) &&
        (!sourceModule || item.source_module === sourceModule)
      );
      const sourceMatch = row.sourceLinks.some((item: Row) =>
        (!sourceRecordId || item.linked_record_id === sourceRecordId) &&
        (!sourceModule || item.linked_module === sourceModule)
      );
      return hazardMatch || sourceMatch;
    });
  }

  private safeguardPayload(tenantId: string, actorId: string, siteId: string, unit: Row, dto: Row, extra: Row = {}) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: siteId, unit_id: unit.id, area_id: dto.area_id ?? dto.areaId ?? null, equipment_id: dto.equipment_id ?? dto.equipmentId ?? null, safeguard_title: dto.safeguard_title ?? dto.safeguardTitle, safeguard_tag: dto.safeguard_tag ?? dto.safeguardTag ?? null, system_service: dto.system_service ?? dto.systemService ?? null, safeguard_category: dto.safeguard_category ?? dto.safeguardCategory ?? 'Prevention', safeguard_type: dto.safeguard_type ?? dto.safeguardType, function_type: dto.function_type ?? dto.functionType, criticality: dto.criticality ?? 'Medium', safety_critical: Boolean(dto.safety_critical ?? dto.safetyCritical), psm_critical: Boolean(dto.psm_critical ?? dto.psmCritical), ipl_candidate: Boolean(dto.ipl_candidate ?? dto.iplCandidate), status: dto.status ?? 'Draft', effectiveness_status: dto.effectiveness_status ?? dto.effectivenessStatus ?? null, source_status: dto.source_status ?? dto.sourceStatus ?? null, testing_status: dto.testing_status ?? dto.testingStatus ?? null, impairment_status: dto.impairment_status ?? dto.impairmentStatus ?? null, completeness_status: dto.completeness_status ?? dto.completenessStatus ?? 'Not Reviewed', conflict_status: dto.conflict_status ?? dto.conflictStatus ?? 'Not Checked', review_status: dto.review_status ?? dto.reviewStatus ?? 'Draft', moc_update_required: Boolean(dto.moc_update_required ?? dto.mocUpdateRequired), pssr_blocker: Boolean(dto.pssr_blocker ?? dto.pssrBlocker), mi_readiness_impact: Boolean(dto.mi_readiness_impact ?? dto.miReadinessImpact), owner_user_id: dto.owner_user_id ?? dto.ownerUserId ?? null, process_engineer_id: dto.process_engineer_id ?? dto.processEngineerId ?? null, controls_engineer_id: dto.controls_engineer_id ?? dto.controlsEngineerId ?? null, mechanical_mi_owner_id: dto.mechanical_mi_owner_id ?? dto.mechanicalMiOwnerId ?? null, operations_owner_id: dto.operations_owner_id ?? dto.operationsOwnerId ?? null, hse_reviewer_id: dto.hse_reviewer_id ?? dto.hseReviewerId ?? null, last_review_date: this.dateOrNull(dto.last_review_date ?? dto.lastReviewDate), next_review_due: this.dateOrNull(dto.next_review_due ?? dto.nextReviewDue), notes: dto.notes ?? null, created_by: dto.created_by ?? actorId, updated_by: actorId, ...extra });
  }

  private hazardPayload(tenantId: string, actorId: string, safeguard: Row, dto: Row) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: safeguard.site_id, safeguard_id: safeguard.id, unit_id: safeguard.unit_id, source_module: dto.source_module ?? dto.sourceModule ?? 'Manual hazard scenario', source_record_id: dto.source_record_id ?? dto.sourceRecordId ?? null, source_record_label: dto.source_record_label ?? dto.sourceRecordLabel ?? dto.scenario_reference ?? null, scenario_title: dto.scenario_title ?? dto.scenarioTitle, hazard_type: dto.hazard_type ?? dto.hazardType, cause_controlled: dto.cause_controlled ?? dto.causeControlled ?? null, consequence_reduced: dto.consequence_reduced ?? dto.consequenceReduced ?? null, deviation_direction: dto.deviation_direction ?? dto.deviationDirection ?? null, severity: dto.severity ?? null, safeguard_role: dto.safeguard_role ?? dto.safeguardRole ?? null, required_performance: dto.required_performance ?? dto.requiredPerformance ?? null, related_consequence: dto.related_consequence ?? dto.relatedConsequence ?? null, link_confidence: dto.link_confidence ?? dto.linkConfidence ?? null, notes: dto.notes ?? null, created_by: dto.created_by ?? actorId });
  }

  private functionPayload(tenantId: string, safeguard: Row, dto: Row) {
    return this.clean({ id: dto.function_requirements_id ?? dto.functionRequirementsId ?? randomUUID(), company_id: tenantId, site_id: safeguard.site_id, safeguard_id: safeguard.id, function_description: dto.function_description ?? dto.functionDescription ?? null, design_intent: dto.design_intent ?? dto.designIntent ?? null, required_action: dto.required_action ?? dto.requiredAction ?? null, required_response_time: dto.required_response_time ?? dto.requiredResponseTime ?? null, activation_condition: dto.activation_condition ?? dto.required_activation_condition ?? dto.activationCondition ?? null, safe_state: dto.safe_state ?? dto.safeState ?? null, trip_action_setpoint: dto.trip_action_setpoint ?? dto.tripActionSetpoint ?? null, alarm_priority_foundation: dto.alarm_priority_foundation ?? dto.alarmPriorityFoundation ?? null, operator_response_requirement: dto.operator_response_requirement ?? dto.operatorResponseRequirement ?? null, required_availability: dto.required_availability ?? dto.requiredAvailability ?? null, required_reliability_foundation: dto.required_reliability_foundation ?? dto.requiredReliabilityFoundation ?? null, required_proof_test_interval: dto.required_proof_test_interval ?? dto.requiredProofTestInterval ?? null, required_inspection_frequency: dto.required_inspection_frequency ?? dto.requiredInspectionFrequency ?? null, required_maintenance_requirement: dto.required_maintenance_requirement ?? dto.requiredMaintenanceRequirement ?? null, required_competence_training: dto.required_competence_training ?? dto.requiredCompetenceTraining ?? null, failure_mode: dto.failure_mode ?? dto.failureMode ?? null, failure_consequence: dto.failure_consequence ?? dto.failureConsequence ?? null, common_cause_concern: dto.common_cause_concern ?? dto.commonCauseConcern ?? null, human_factor_dependency: dto.human_factor_dependency ?? dto.humanFactorDependency ?? null, bypass_override_allowed: Boolean(dto.bypass_override_allowed ?? dto.bypassOverrideAllowed), maximum_allowed_bypass_duration: dto.maximum_allowed_bypass_duration ?? dto.maximumAllowedBypassDuration ?? null, temporary_impairment_controls: dto.temporary_impairment_controls ?? dto.temporaryImpairmentControls ?? null, notes: dto.function_notes ?? dto.notes ?? null, updated_at: new Date().toISOString() });
  }

  private sourcePayload(tenantId: string, actorId: string, safeguard: Row, dto: Row) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: safeguard.site_id, safeguard_id: safeguard.id, linked_module: dto.linked_module ?? dto.linkedModule, linked_record_id: dto.linked_record_id ?? dto.linkedRecordId ?? null, linked_record_tag_title: dto.linked_record_tag_title ?? dto.linkedRecordTagTitle ?? dto.source_record_reference ?? null, source_status: dto.source_status ?? dto.sourceStatus ?? null, source_readiness_status: dto.source_readiness_status ?? dto.sourceReadinessStatus ?? null, source_test_status: dto.source_test_status ?? dto.sourceTestStatus ?? null, source_bypass_impairment_status: dto.source_bypass_impairment_status ?? dto.sourceBypassImpairmentStatus ?? null, source_document_status: dto.source_document_status ?? dto.sourceDocumentStatus ?? null, source_last_verified_date: this.dateOrNull(dto.source_last_verified_date ?? dto.sourceLastVerifiedDate), source_next_due_date: this.dateOrNull(dto.source_next_due_date ?? dto.sourceNextDueDate), sync_mode: dto.sync_mode ?? dto.syncMode ?? 'Compare only', sync_notes: dto.sync_notes ?? dto.syncNotes ?? null, linked_by: dto.linked_by ?? actorId, linked_at: dto.linked_at ?? new Date().toISOString() });
  }

  private effectivenessPayload(tenantId: string, safeguard: Row, dto: Row) {
    return this.clean({ id: dto.effectiveness_id ?? dto.effectivenessId ?? randomUUID(), company_id: tenantId, site_id: safeguard.site_id, safeguard_id: safeguard.id, effectiveness_status: dto.effectiveness_status ?? dto.effectivenessStatus ?? 'Unknown / Needs Review', effectiveness_basis: dto.effectiveness_basis ?? dto.effectivenessBasis ?? null, independence_required: Boolean(dto.independence_required ?? dto.independenceRequired), independence_basis: dto.independence_basis ?? dto.independenceBasis ?? null, ipl_candidate: Boolean(dto.ipl_candidate ?? dto.iplCandidate ?? safeguard.ipl_candidate), ipl_claimed_in_lopa: Boolean(dto.ipl_claimed_in_lopa ?? dto.iplClaimedInLopa), ipl_qualification_status: dto.ipl_qualification_status ?? dto.iplQualificationStatus ?? (safeguard.ipl_candidate ? 'Candidate' : 'Not IPL'), demand_mode_foundation: dto.demand_mode_foundation ?? dto.demandModeFoundation ?? null, human_response_dependency: dto.human_response_dependency ?? dto.humanResponseDependency ?? null, shared_component_common_cause_note: dto.shared_component_common_cause_note ?? dto.sharedComponentCommonCauseNote ?? null, diagnostic_monitoring_basis: dto.diagnostic_monitoring_basis ?? dto.diagnosticMonitoringBasis ?? null, failure_data_source_foundation: dto.failure_data_source_foundation ?? dto.failureDataSourceFoundation ?? null, reliability_note: dto.reliability_note ?? dto.reliabilityNote ?? null, limitations_assumptions: dto.limitations_assumptions ?? dto.limitationsAssumptions ?? null, conditions_for_credit: dto.conditions_for_credit ?? dto.conditionsForCredit ?? null, not_creditable_reason: dto.not_creditable_reason ?? dto.notCreditableReason ?? null, engineering_review_required: Boolean(dto.engineering_review_required ?? dto.engineeringReviewRequired), approved_exception: Boolean(dto.approved_exception ?? dto.approvedException), exception_reason: dto.exception_reason ?? dto.exceptionReason ?? null, exception_approved_by: dto.exception_approved_by ?? dto.exceptionApprovedBy ?? null, exception_approved_at: this.dateOrNull(dto.exception_approved_at ?? dto.exceptionApprovedAt), updated_at: new Date().toISOString() });
  }

  private testingPayload(tenantId: string, safeguard: Row, dto: Row) {
    return this.clean({ id: dto.testing_status_id ?? dto.testingStatusId ?? randomUUID(), company_id: tenantId, site_id: safeguard.site_id, safeguard_id: safeguard.id, testing_required: Boolean(dto.testing_required ?? dto.testingRequired), testing_source_module: dto.testing_source_module ?? dto.testingSourceModule ?? null, test_proof_inspection_requirement: dto.test_proof_inspection_requirement ?? dto.testProofInspectionRequirement ?? null, last_test_date: this.dateOrNull(dto.last_test_date ?? dto.lastTestDate), next_test_due: this.dateOrNull(dto.next_test_due ?? dto.nextTestDue), test_status: dto.test_status ?? dto.testStatus ?? 'Unknown', monitoring_method: dto.monitoring_method ?? dto.monitoringMethod ?? null, inspection_requirement: dto.inspection_requirement ?? dto.inspectionRequirement ?? null, maintenance_requirement: dto.maintenance_requirement ?? dto.maintenanceRequirement ?? null, bypass_impairment_status: dto.bypass_impairment_status ?? dto.bypassImpairmentStatus ?? null, active_bypass_impairment_link: dto.active_bypass_impairment_link ?? dto.activeBypassImpairmentLink ?? null, bypass_authorization_requirement: dto.bypass_authorization_requirement ?? dto.bypassAuthorizationRequirement ?? null, impairment_mitigation_required: dto.impairment_mitigation_required ?? dto.impairmentMitigationRequired ?? null, temporary_control_requirement: dto.temporary_control_requirement ?? dto.temporaryControlRequirement ?? null, readiness_impact: Boolean(dto.readiness_impact ?? dto.readinessImpact), notes: dto.testing_notes ?? dto.notes ?? null, updated_at: new Date().toISOString() });
  }

  private documentPayload(tenantId: string, actorId: string, safeguard: Row, dto: Row) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: safeguard.site_id, safeguard_id: safeguard.id, document_id: dto.document_id ?? dto.documentId, document_type: dto.document_type ?? dto.documentType ?? 'Safeguard design basis', relationship_type: dto.relationship_type ?? dto.relationshipType ?? 'Evidence', required: Boolean(dto.required ?? dto.required_evidence ?? dto.requiredEvidence), readiness_impact: Boolean(dto.readiness_impact ?? dto.required_evidence ?? dto.readinessImpact), document_number: dto.document_number ?? dto.documentNumber ?? null, document_title: dto.document_title ?? dto.documentTitle ?? null, document_status: dto.document_status ?? dto.documentStatus ?? null, revision_number: dto.revision_number ?? dto.revisionNumber ?? null, linked_by: actorId, linked_at: new Date().toISOString() });
  }

  private validateIdentity(dto: Row) {
    this.requireText(dto.safeguard_title ?? dto.safeguardTitle, 'Safeguard title is required.');
    this.requireText(dto.unit_id ?? dto.unitId, 'Process unit is required.');
    this.requireText(dto.safeguard_type ?? dto.safeguardType, 'Safeguard type is required.');
    this.requireText(dto.function_type ?? dto.functionType, 'Function type is required.');
    this.requireText(dto.criticality ?? 'Medium', 'Criticality is required.');
    if ((dto.safety_critical ?? dto.safetyCritical ?? dto.criticality === 'Critical') && !(dto.owner_user_id ?? dto.ownerUserId)) throw new BadRequestException('Critical safeguard requires an owner.');
  }

  private validateImportRow(row: Row) {
    const errors: string[] = [];
    if (!row.unit_code && !row.unit_id) errors.push('unit_code or unit_id is required');
    if (!row.safeguard_title) errors.push('safeguard_title is required');
    if (!row.safeguard_type || !safeguardTypes.includes(String(row.safeguard_type))) errors.push('safeguard_type is invalid');
    if (!row.function_type || !safeguardFunctionTypes.includes(String(row.function_type))) errors.push('function_type is invalid');
    if (!row.criticality || !safeguardCriticalities.includes(String(row.criticality))) errors.push('criticality is invalid');
    return errors;
  }

  private importWarnings(row: Row) {
    const warnings: string[] = [];
    if (row.criticality === 'Critical' && !row.owner_email) warnings.push('Critical safeguard owner is missing.');
    if (row.ipl_candidate && !row.independence_required) warnings.push('IPL candidate requires independence/effectiveness basis.');
    if (!row.evidence_document_reference) warnings.push('Evidence document reference is missing.');
    if (!row.source_module) warnings.push('Source module link is missing.');
    return warnings;
  }

  private async record(tenantId: string, scope: Scope, safeguardId: string, includeArchived = false) {
    let request = this.db.from('psi_safeguards').select('*').eq('company_id', tenantId).eq('id', safeguardId);
    request = this.applyScope(request, scope);
    if (!includeArchived) request = request.is('archived_at', null);
    return this.requireRow(await this.safeSingle<Row>(request.maybeSingle()), 'Safeguard/control not found or outside your permitted site scope.');
  }

  private async unitRecord(tenantId: string, scope: Scope, unitId: string) {
    const unit = this.requireRow(await this.safeSingle<Row>(this.db.from('psi_units').select('*').eq('company_id', tenantId).eq('id', unitId).maybeSingle()), 'Process unit not found.');
    this.assertSiteAccess(scope, unit.site_id);
    return unit;
  }

  private hasFunctionFields(dto: Row) { return ['function_description', 'required_action', 'required_response_time', 'safe_state', 'trip_action_setpoint', 'operator_response_requirement', 'bypass_override_allowed'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private hasEffectivenessFields(dto: Row) { return ['effectiveness_status', 'effectiveness_basis', 'independence_required', 'independence_basis', 'ipl_claimed_in_lopa', 'ipl_qualification_status'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private hasTestingFields(dto: Row) { return ['testing_required', 'test_proof_inspection_requirement', 'test_status', 'bypass_impairment_status', 'next_test_due'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private isCritical(row: Row) { return row.criticality === 'Critical' || row.safety_critical || row.psm_critical; }
  private isReviewOverdue(row: Row) { if (!row.next_review_due) return false; return new Date(row.next_review_due).getTime() < Date.now() && row.review_status !== 'Approved'; }
  private worstConflict(results: Row[]) { if (results.some((row) => row.conflict_status === 'Critical Conflict' && !row.override_approved)) return 'Critical Conflict'; if (results.some((row) => row.conflict_status === 'Major Conflict' && !row.override_approved)) return 'Major Conflict'; if (results.some((row) => row.conflict_status === 'Warning')) return 'Warning'; if (results.some((row) => row.conflict_status === 'Override Approved')) return 'Override Approved'; return 'No Conflict'; }
  private conflict(tenantId: string, safeguard: Row, type: string, status: string, severity: string, message: string, comparedModule?: string | null, comparedRecordId?: string | null, comparedValue?: Row | null, currentValue?: Row | null) { return { id: randomUUID(), company_id: tenantId, site_id: safeguard.site_id, safeguard_id: safeguard.id, conflict_type: type, conflict_status: status, severity, message, compared_module: comparedModule ?? null, compared_record_id: comparedRecordId ?? null, compared_value_json: comparedValue ?? null, current_value_json: currentValue ?? null, override_required: status === 'Critical Conflict', override_approved: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; }
  private check(key: string, title: string, ok: boolean, severity: string, message: string) { return { check_key: key, check_title: title, status: ok ? 'Complete' : severity === 'Critical' ? 'Critical Gaps' : 'Incomplete', severity, message: ok ? null : message, missing_reason: ok ? null : message, pssr_blocker: severity === 'Critical' && !ok, mi_readiness_impact: ['testing_basis', 'source_status'].includes(key) && !ok, action_required: !ok }; }
  private overview(safeguard: Row, hazardLinks: Row[], functionRequirements: Row | null, sourceLinks: Row[], effectiveness: Row | null, testing: Row | null, documents: Row[], completeness: Row[], conflicts: Row[]) {
    return { cards: [
      { label: 'Safeguard title/tag', value: safeguard.safeguard_tag ?? safeguard.safeguard_title },
      { label: 'Unit / Equipment', value: safeguard.equipment_id ?? safeguard.unit_id },
      { label: 'Safeguard type', value: safeguard.safeguard_type },
      { label: 'Function type', value: safeguard.function_type },
      { label: 'Criticality', value: safeguard.criticality, tone: this.isCritical(safeguard) ? 'danger' : 'neutral' },
      { label: 'Hazard/scenario controlled', value: hazardLinks.length, tone: hazardLinks.length ? 'good' : 'warn' },
      { label: 'Source module link', value: sourceLinks.length ? sourceLinks.map((link) => link.linked_module).join(', ') : 'Missing', tone: sourceLinks.length ? 'good' : 'danger' },
      { label: 'Effectiveness status', value: safeguard.effectiveness_status ?? effectiveness?.effectiveness_status ?? 'Unknown / Needs Review' },
      { label: 'IPL qualification status', value: effectiveness?.ipl_qualification_status ?? (safeguard.ipl_candidate ? 'Candidate' : 'Not IPL') },
      { label: 'Testing/readiness status', value: safeguard.testing_status ?? testing?.test_status ?? 'Unknown' },
      { label: 'Bypass/impairment status', value: safeguard.impairment_status ?? testing?.bypass_impairment_status ?? 'Unknown' },
      { label: 'Evidence status', value: documents.length ? 'Linked' : 'Missing', tone: documents.length ? 'good' : 'danger' },
      { label: 'Completeness status', value: safeguard.completeness_status },
      { label: 'Conflict status', value: safeguard.conflict_status },
      { label: 'Review status', value: safeguard.review_status },
      { label: 'MOC required', value: safeguard.moc_update_required ? 'Yes' : 'No', tone: safeguard.moc_update_required ? 'warn' : 'good' },
      { label: 'PSSR blocker', value: safeguard.pssr_blocker ? 'Yes' : 'No', tone: safeguard.pssr_blocker ? 'danger' : 'good' },
      { label: 'MI readiness impact', value: safeguard.mi_readiness_impact ? 'Yes' : 'No', tone: safeguard.mi_readiness_impact ? 'warn' : 'good' },
      { label: 'PSI completeness impact', value: completeness.filter((row) => row.status !== 'Complete').length ? 'Open gaps' : 'No gaps' }
    ], blockers: [...completeness.filter((row) => row.status !== 'Complete'), ...conflicts.filter((row) => row.conflict_status !== 'No Conflict')], functionRequirements };
  }
  private tabs(safeguardId: string) { return ['Overview', 'Hazard / Scenario Controlled', 'Function & Requirements', 'Source Module Link', 'Effectiveness / Independence', 'Testing / Monitoring / Impairment', 'Documents / Evidence', 'Completeness / Conflicts', 'Linked Records', 'Review & Approval', 'Change History'].map((label) => ({ label, href: `/process-safety-information/safeguards/${safeguardId}`, enabled: true })); }
  private actions(safeguard: Row, hazardLinks: Row[], functionRequirements: Row | null, sourceLinks: Row[], effectiveness: Row | null, testing: Row | null, documents: Row[], completeness: Row[], conflicts: Row[]) {
    const criticalConflict = conflicts.some((item) => item.conflict_status === 'Critical Conflict' && !item.override_approved);
    const criticalGap = completeness.some((item) => item.status === 'Critical Gaps');
    return [
      { key: 'edit', label: 'Edit Safeguard', enabled: safeguard.review_status !== 'Approved', disabledReason: safeguard.review_status === 'Approved' ? 'Approved safeguard requires controlled edit/MOC.' : null },
      { key: 'link-hazard', label: 'Link Hazard / Scenario', enabled: true, disabledReason: null },
      { key: 'link-source', label: 'Link Source Record', enabled: true, disabledReason: null },
      { key: 'source-status', label: 'Check Source Status', enabled: sourceLinks.length > 0, disabledReason: sourceLinks.length ? null : 'Add a source link before checking source status.' },
      { key: 'completeness', label: 'Run Completeness Check', enabled: true, disabledReason: null },
      { key: 'conflicts', label: 'Run Conflict Check', enabled: true, disabledReason: null },
      { key: 'submit-review', label: 'Submit for Review', enabled: !criticalConflict && !criticalGap, disabledReason: criticalConflict ? 'Critical conflicts block review.' : criticalGap ? 'Critical completeness gaps remain.' : null },
      { key: 'create-action', label: 'Create Action', enabled: criticalConflict || criticalGap || !hazardLinks.length || !functionRequirements || !effectiveness || !testing || !documents.length, disabledReason: 'No open safeguard gap requiring action.' }
    ];
  }
  private applyScope(query: any, scope: Scope, column = 'site_id') { if (scope.corporateView) return query; if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId); if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds); return query; }
  private assertSiteAccess(scope: Scope, siteId: string) { if (!siteId) throw new BadRequestException('Site is required.'); if (scope.corporateView) return siteId; if (scope.selectedSiteId && scope.selectedSiteId !== siteId) throw new ForbiddenException('Selected site is outside your active site scope.'); if (scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('Site is outside your permitted scope.'); return siteId; }
  private selectedSite(scope: Scope) { return scope.selectedSiteId ?? scope.allowedSiteIds?.[0] ?? null; }
  private safeSortColumn(column: string) { return new Set(['updated_at', 'created_at', 'safeguard_title', 'safeguard_type', 'function_type', 'criticality', 'status', 'review_status', 'conflict_status', 'completeness_status', 'next_review_due']).has(column) ? column : 'updated_at'; }
  private requireText(value: unknown, message: string) { const text = String(value ?? '').trim(); if (!text) throw new BadRequestException(message); return text; }
  private requireRow<T>(row: T | null | undefined, message: string): T { if (!row) throw new BadRequestException(message); return row; }
  private async safeSingle<T>(query: PromiseLike<any>) { try { return await this.db.single<T>(query); } catch { return null; } }
  private async safeMany<T>(query: PromiseLike<any>) { try { return await this.db.many<T>(query); } catch { return []; } }
  private dateOrNull(value: unknown) { if (!value) return null; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? null : date.toISOString(); }
  private camel(value: string) { return value.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }
  private clean<T extends Row>(value: T): T { return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T; }
  private array(value: unknown): Row[] { return Array.isArray(value) ? value.filter((item): item is Row => Boolean(item) && typeof item === 'object') : []; }

  private async markMocIfChanged(tenantId: string, actorId: string, safeguard: Row, before: Row | null, after: Row, keys: string[]) {
    if (!before) return;
    const changed = keys.some((key) => String(before[key] ?? '') !== String(after[key] ?? ''));
    if (changed) await this.db.single(this.db.from('psi_safeguards').update({ moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', safeguard.id).select('id').single()).catch(() => null);
  }

  private async writeHistory(tenantId: string, actorId: string, action: string, safeguard: Row, before: any, after: any, title: string, description?: string | null) {
    await this.audit.write({ tenantId, actorId, action, entityType: 'PSI_SAFEGUARD', entityId: safeguard.id, before: before as JsonValue, after: after as JsonValue }).catch(() => null);
    await this.db.single(this.db.from('psi_safeguard_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: safeguard.site_id, unit_id: safeguard.unit_id ?? null, area_id: safeguard.area_id ?? null, equipment_id: safeguard.equipment_id ?? null, safeguard_id: safeguard.id, event_type: action, event_title: title, event_description: description ?? null, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId, source_module: 'PSI Safeguards / Controls', source_record_id: safeguard.id }).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('psi_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: safeguard.site_id, unit_id: safeguard.unit_id ?? null, event_type: action, event_title: title, event_description: description ?? null, source_module: 'PSI Safeguards / Controls', source_record_id: safeguard.id, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId }).select('id').single()).catch(() => null);
  }
}
