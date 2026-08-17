import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type Row = Record<string, any>;

export const classificationSystems = ['IEC Zone', 'NEC Class / Division', 'ATEX / UKEX', 'Dust Hazardous Area', 'Hybrid system', 'Local regulatory standard', 'Company standard'];
export const hazardousAreaStandards = ['IEC 60079 series', 'IEC 60079-10-1', 'IEC 60079-10-2', 'NEC / NFPA 70', 'NFPA 497', 'NFPA 499', 'API RP 500', 'API RP 505', 'ATEX 1999/92/EC', 'Local regulation', 'Company standard', 'Other'];
export const zones = ['Zone 0', 'Zone 1', 'Zone 2', 'Zone 20', 'Zone 21', 'Zone 22', 'Unclassified with justification'];
export const classDivisions = ['Class I Division 1', 'Class I Division 2', 'Class II Division 1', 'Class II Division 2', 'Class III', 'Unclassified with justification'];
export const gasGroups = ['IIA', 'IIB', 'IIC', 'Group A', 'Group B', 'Group C', 'Group D'];
export const dustGroups = ['IIIA', 'IIIB', 'IIIC', 'Group E', 'Group F', 'Group G'];
export const temperatureClasses = ['T1', 'T2', 'T2A', 'T2B', 'T2C', 'T2D', 'T3', 'T3A', 'T3B', 'T3C', 'T4', 'T4A', 'T5', 'T6'];
export const protectionMethods = ['Ex d flameproof / explosion-proof', 'Ex e increased safety', 'Ex i intrinsic safety', 'Ex p pressurization', 'Ex n non-sparking', 'Ex t dust protection', 'Ex m encapsulation', 'Ex o oil immersion', 'Ex q powder filling', 'Purged enclosure', 'General purpose allowed with justification', 'Other'];
export const releaseSourceTypes = ['Flange', 'Pump seal', 'Compressor seal', 'Valve stem', 'Vent', 'Drain', 'Sample point', 'Relief discharge', 'Tank vent', 'Loading/unloading connection', 'Open process', 'Reactor/vessel opening', 'Analyzer vent', 'Instrument tubing', 'Dust handling point', 'Packaging/filling point', 'Other'];
export const releaseGrades = ['Continuous', 'Primary', 'Secondary', 'Abnormal / rare', 'Unknown / needs study'];
export const ventilationTypes = ['Natural', 'Mechanical', 'Dilution ventilation', 'Local exhaust', 'Outdoor open area', 'Enclosed building', 'Partially enclosed', 'Not credited', 'Unknown / needs study'];
export const electricalDocumentTypes = ['Hazardous area classification drawing', 'Electrical area classification study', 'Equipment location drawing', 'Plot plan', 'P&ID', 'PFD', 'Ventilation study', 'Gas dispersion study', 'Dust hazard analysis', 'Ex equipment certificate', 'Instrument datasheet', 'Electrical single line diagram', 'Loop drawing', 'Fire/gas layout', 'Earthing/bonding drawing', 'Inspection report', 'MOC package', 'PSSR package', 'Vendor certificate', 'Regulatory approval', 'Engineering calculation'];
export const electricalConflictStatuses = ['No Conflict', 'Warning', 'Major Conflict', 'Critical Conflict', 'Override Approved'];
const suitabilityResults = ['Suitable', 'Suitable With Conditions', 'Mismatch', 'Missing Rating Data', 'Not Required', 'Needs Review'];
const materialTypes = ['Flammable gas', 'Flammable vapor', 'Combustible liquid', 'Combustible dust', 'Hybrid mixture', 'Mist/spray', 'Fiber/flyings', 'Other'];

@Injectable()
export class PsiElectricalClassificationService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async summary(tenantId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    const count = (predicate: (row: Row) => boolean) => rows.filter(predicate).length;
    return {
      totalClassifiedAreas: rows.length,
      zoneAreas: count((row) => ['Zone 0', 'Zone 1', 'Zone 2'].includes(row.zone_classification)),
      classDivisionAreas: count((row) => ['Class I Division 1', 'Class I Division 2'].includes(row.nec_class_division)),
      dustClassifiedAreas: count((row) => ['Zone 20', 'Zone 21', 'Zone 22', 'Class II Division 1', 'Class II Division 2'].includes(row.zone_classification) || ['IIIA', 'IIIB', 'IIIC', 'Group E', 'Group F', 'Group G'].includes(row.dust_group)),
      unclassifiedAreasWithReview: count((row) => String(row.zone_classification ?? row.nec_class_division ?? '').includes('Unclassified') && row.review_status !== 'Approved'),
      missingClassificationStudies: count((row) => !row.documents?.some((doc: Row) => doc.document_type === 'Electrical area classification study')),
      missingAreaDrawings: count((row) => !row.documents?.some((doc: Row) => doc.document_type === 'Hazardous area classification drawing')),
      equipmentRatingMismatches: count((row) => row.rating_compliance_status === 'Mismatch' || row.conflict_status === 'Critical Conflict' || row.conflict_status === 'Major Conflict'),
      instrumentsMissingExRating: count((row) => row.installedEquipment?.some((item: Row) => item.item_type === 'Instruments' && !item.installed_ex_marking)),
      hotWorkRestrictedAreas: count((row) => row.hot_work_restricted || row.ptwControls?.hot_work_restricted),
      ventilationBasisMissing: count((row) => !row.ventilationBasis?.ventilation_type),
      releaseSourceMissing: count((row) => !row.hazardSource?.source_of_release),
      reviewOverdue: count((row) => this.isReviewOverdue(row)),
      pendingApproval: count((row) => ['Submitted', 'Pending Review', 'In Review'].includes(row.review_status)),
      mocRequired: count((row) => row.moc_update_required),
      pssrBlockers: count((row) => row.pssr_blocker),
      auditGaps: count((row) => ['Incomplete', 'Critical Gaps', 'Review Overdue', 'Not Reviewed'].includes(row.completeness_status)),
      lastUpdated: new Date().toISOString()
    };
  }

  async registry(tenantId: string, scope: Scope, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const [rows, all] = await Promise.all([
      this.registryRows(tenantId, scope, query, true, page, limit),
      this.registryRows(tenantId, scope, query, false)
    ]);
    return {
      rows,
      page,
      limit,
      total: all.length,
      summary: await this.summary(tenantId, scope, query),
      savedViews: ['All Classifications', 'Zone 0 / Zone 1 / Zone 2', 'Class I Div 1 / Div 2', 'Dust Areas', 'Missing Studies', 'Missing Drawings', 'Rating Mismatches', 'Hot Work Restricted', 'Review Overdue', 'Pending Approval', 'MOC Required', 'PSSR Blockers', 'My Unit Areas'],
      lastUpdated: new Date().toISOString()
    };
  }

  async unitRegistry(tenantId: string, scope: Scope, unitId: string, query: Row = {}) {
    await this.unitRecord(tenantId, scope, unitId);
    return this.registry(tenantId, scope, { ...query, unitId });
  }

  async areaRegistry(tenantId: string, scope: Scope, areaId: string, query: Row = {}) {
    return this.registry(tenantId, scope, { ...query, areaId });
  }

  async equipmentRegistry(tenantId: string, scope: Scope, equipmentId: string, query: Row = {}) {
    return this.registry(tenantId, scope, { ...query, equipmentId });
  }

  async create(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    this.validateIdentity(dto);
    const unit = await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId));
    const siteId = unit.site_id ?? this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? this.selectedSite(scope) ?? ''));
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_classifications').insert(this.classificationPayload(tenantId, actorId, siteId, unit, dto, { created_at: new Date().toISOString(), updated_at: new Date().toISOString() })).select().single()), 'Unable to create electrical classification record.');
    if (this.hasHazardSourceFields(dto)) await this.upsertHazardSources(tenantId, actorId, scope, row.id, dto, false);
    if (this.hasAreaFields(dto)) await this.upsertAreaDetails(tenantId, actorId, scope, row.id, dto, false);
    if (this.hasVentilationFields(dto)) await this.upsertVentilationBasis(tenantId, actorId, scope, row.id, dto, false);
    if (this.hasProtectionFields(dto)) await this.upsertProtectionRequirements(tenantId, actorId, scope, row.id, dto, false);
    if (this.hasPtwFields(dto)) await this.upsertPtwControls(tenantId, actorId, scope, row.id, dto, false);
    if (dto.document_id ?? dto.documentId) await this.linkDocument(tenantId, actorId, scope, row.id, dto, false);
    for (const item of Array.isArray(dto.installedEquipment) ? dto.installedEquipment : []) await this.addInstalledEquipment(tenantId, actorId, scope, row.id, item, false);
    await this.runRatingCheck(tenantId, actorId, scope, row.id);
    await this.runConflictCheck(tenantId, actorId, scope, row.id);
    await this.runCompleteness(tenantId, actorId, scope, row.id);
    await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.created', row, null, row, 'Electrical classification created', `${row.classification_title} created.`);
    return this.detail(tenantId, scope, row.id);
  }

  async update(tenantId: string, actorId: string, scope: Scope, classificationId: string, dto: Row, permissions: string[] = []) {
    const before = await this.record(tenantId, scope, classificationId);
    if (before.review_status === 'Approved' && !permissions.includes('psi.electrical_classification.approve')) throw new ForbiddenException('Approved electrical classification is read-only unless controlled edit/MOC permission exists.');
    const unit = dto.unit_id ?? dto.unitId ? await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId)) : await this.unitRecord(tenantId, scope, before.unit_id);
    const siteId = unit.site_id ?? this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? before.site_id));
    const safetyKeys = ['classification_system', 'applicable_standard', 'critical_area', 'psm_critical', 'hot_work_restricted', 'unit_id', 'area_id'];
    const safetyChanged = safetyKeys.some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined);
    const payload = this.classificationPayload(tenantId, actorId, siteId, unit, { ...before, ...dto }, { updated_at: new Date().toISOString(), moc_update_required: safetyChanged ? true : before.moc_update_required });
    delete payload.created_by;
    delete payload.created_at;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_classifications').update(payload).eq('company_id', tenantId).eq('id', classificationId).select().single()), 'Unable to update electrical classification record.');
    if (this.hasHazardSourceFields(dto)) await this.upsertHazardSources(tenantId, actorId, scope, classificationId, dto, false);
    if (this.hasAreaFields(dto)) await this.upsertAreaDetails(tenantId, actorId, scope, classificationId, dto, false);
    if (this.hasVentilationFields(dto)) await this.upsertVentilationBasis(tenantId, actorId, scope, classificationId, dto, false);
    if (this.hasProtectionFields(dto)) await this.upsertProtectionRequirements(tenantId, actorId, scope, classificationId, dto, false);
    if (this.hasPtwFields(dto)) await this.upsertPtwControls(tenantId, actorId, scope, classificationId, dto, false);
    await this.runRatingCheck(tenantId, actorId, scope, classificationId);
    await this.runConflictCheck(tenantId, actorId, scope, classificationId);
    await this.runCompleteness(tenantId, actorId, scope, classificationId);
    await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.updated', row, before, row, 'Electrical classification updated', safetyChanged ? 'Safety-sensitive electrical classification change may require MOC.' : 'Electrical classification metadata updated.');
    return this.detail(tenantId, scope, classificationId);
  }

  async detail(tenantId: string, scope: Scope, classificationId: string) {
    const classification = await this.record(tenantId, scope, classificationId, true);
    const [unit, hazardSource, areaDetails, ventilationBasis, protectionRequirements, installedEquipment, documents, ptwControls, completeness, conflicts, history] = await Promise.all([
      classification.unit_id ? this.unitRecord(tenantId, scope, classification.unit_id).catch(() => null) : Promise.resolve(null),
      this.hazardSources(tenantId, scope, classificationId),
      this.areaDetails(tenantId, scope, classificationId),
      this.ventilationBasis(tenantId, scope, classificationId),
      this.protectionRequirements(tenantId, scope, classificationId),
      this.installedEquipment(tenantId, scope, classificationId),
      this.documents(tenantId, scope, classificationId),
      this.ptwControls(tenantId, scope, classificationId),
      this.completeness(tenantId, scope, classificationId),
      this.conflicts(tenantId, scope, classificationId),
      this.history(tenantId, scope, classificationId)
    ]);
    return {
      classification,
      unit,
      hazardSource,
      areaDetails,
      ventilationBasis,
      protectionRequirements,
      installedEquipment,
      documents,
      ptwControls,
      completeness,
      conflicts,
      history,
      overview: this.overview(classification, hazardSource, areaDetails, ventilationBasis, protectionRequirements, installedEquipment, documents, ptwControls, completeness, conflicts),
      tabs: this.tabs(classificationId),
      actions: this.actions(classification, documents, installedEquipment, completeness, conflicts)
    };
  }

  async archive(tenantId: string, actorId: string, scope: Scope, classificationId: string, dto: Row) {
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive reason is required.');
    const before = await this.record(tenantId, scope, classificationId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_classifications').update({ archived_at: new Date().toISOString(), archived_by: actorId, classification_status: 'Archived', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', classificationId).select().single()), 'Unable to archive electrical classification.');
    await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.archived', row, before, row, 'Electrical classification archived', String(dto.reason));
    return row;
  }

  async reactivate(tenantId: string, actorId: string, scope: Scope, classificationId: string, dto: Row) {
    const before = await this.record(tenantId, scope, classificationId, true);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_classifications').update({ archived_at: null, archived_by: null, classification_status: 'Draft', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', classificationId).select().single()), 'Unable to reactivate electrical classification.');
    await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.reactivated', row, before, row, 'Electrical classification reactivated', dto.reason ?? null);
    return row;
  }

  async clone(tenantId: string, actorId: string, scope: Scope, classificationId: string, dto: Row) {
    const source = await this.record(tenantId, scope, classificationId);
    return this.create(tenantId, actorId, scope, { ...source, id: randomUUID(), classification_title: dto.classification_title ?? `${source.classification_title} Copy`, classification_record_number: dto.classification_record_number ?? null, review_status: 'Draft', classification_status: 'Draft' });
  }

  async hazardSources(tenantId: string, scope: Scope, classificationId: string) {
    await this.record(tenantId, scope, classificationId);
    return this.safeSingle<Row>(this.db.from('psi_electrical_hazard_sources').select('*').eq('company_id', tenantId).eq('classification_id', classificationId).maybeSingle());
  }

  async upsertHazardSources(tenantId: string, actorId: string, scope: Scope, classificationId: string, dto: Row, writeEvent = true) {
    const classification = await this.record(tenantId, scope, classificationId);
    const before = await this.hazardSources(tenantId, scope, classificationId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_hazard_sources').upsert(this.hazardPayload(tenantId, classification, dto), { onConflict: 'classification_id' }).select().single()), 'Unable to save hazardous material/release source.');
    await this.markMocIfChanged(tenantId, actorId, classification, before, row, ['chemical_id', 'hazardous_material_name', 'release_source_type', 'release_grade']);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.hazard_source.updated', classification, before, row, 'Hazardous material / release source updated');
    return row;
  }

  async areaDetails(tenantId: string, scope: Scope, classificationId: string) {
    await this.record(tenantId, scope, classificationId);
    return this.safeSingle<Row>(this.db.from('psi_area_classification_details').select('*').eq('company_id', tenantId).eq('classification_id', classificationId).maybeSingle());
  }

  async upsertAreaDetails(tenantId: string, actorId: string, scope: Scope, classificationId: string, dto: Row, writeEvent = true) {
    const classification = await this.record(tenantId, scope, classificationId);
    const before = await this.areaDetails(tenantId, scope, classificationId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_area_classification_details').upsert(this.areaPayload(tenantId, classification, dto), { onConflict: 'classification_id' }).select().single()), 'Unable to save area classification details.');
    await this.markMocIfChanged(tenantId, actorId, classification, before, row, ['zone_classification', 'nec_class_division', 'gas_group', 'dust_group', 'temperature_class']);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.area_details.updated', classification, before, row, 'Area classification updated');
    return row;
  }

  async ventilationBasis(tenantId: string, scope: Scope, classificationId: string) {
    await this.record(tenantId, scope, classificationId);
    return this.safeSingle<Row>(this.db.from('psi_electrical_ventilation_basis').select('*').eq('company_id', tenantId).eq('classification_id', classificationId).maybeSingle());
  }

  async upsertVentilationBasis(tenantId: string, actorId: string, scope: Scope, classificationId: string, dto: Row, writeEvent = true) {
    const classification = await this.record(tenantId, scope, classificationId);
    const before = await this.ventilationBasis(tenantId, scope, classificationId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_ventilation_basis').upsert(this.ventilationPayload(tenantId, classification, dto), { onConflict: 'classification_id' }).select().single()), 'Unable to save ventilation / extent basis.');
    await this.markMocIfChanged(tenantId, actorId, classification, before, row, ['ventilation_type', 'ventilation_availability', 'mechanical_ventilation_basis']);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.ventilation.updated', classification, before, row, 'Ventilation / extent basis updated');
    return row;
  }

  async protectionRequirements(tenantId: string, scope: Scope, classificationId: string) {
    await this.record(tenantId, scope, classificationId);
    return this.safeSingle<Row>(this.db.from('psi_electrical_protection_requirements').select('*').eq('company_id', tenantId).eq('classification_id', classificationId).maybeSingle());
  }

  async upsertProtectionRequirements(tenantId: string, actorId: string, scope: Scope, classificationId: string, dto: Row, writeEvent = true) {
    const classification = await this.record(tenantId, scope, classificationId);
    const before = await this.protectionRequirements(tenantId, scope, classificationId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_protection_requirements').upsert(this.protectionPayload(tenantId, classification, dto), { onConflict: 'classification_id' }).select().single()), 'Unable to save equipment protection requirements.');
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.protection.updated', classification, before, row, 'Equipment protection requirements updated');
    return row;
  }

  async installedEquipment(tenantId: string, scope: Scope, classificationId: string, query: Row = {}) {
    await this.record(tenantId, scope, classificationId);
    let request: any = this.db.from('psi_electrical_installed_equipment').select('*').eq('company_id', tenantId).eq('classification_id', classificationId).is('removed_at', null);
    if (query.search) request = request.or(`tag_number.ilike.%${query.search}%,item_type.ilike.%${query.search}%,installed_ex_marking.ilike.%${query.search}%`);
    return this.safeMany<Row>(request.order('tag_number'));
  }

  async addInstalledEquipment(tenantId: string, actorId: string, scope: Scope, classificationId: string, dto: Row, writeEvent = true) {
    const classification = await this.record(tenantId, scope, classificationId);
    this.requireText(dto.tag_number ?? dto.tagNumber, 'Equipment/instrument tag is required.');
    const payload = this.equipmentPayload(tenantId, actorId, classification, dto);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_installed_equipment').insert(payload).select().single()), 'Unable to add installed equipment.');
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.installed_equipment.added', classification, null, row, 'Installed equipment added', row.tag_number);
    return row;
  }

  async updateInstalledEquipment(tenantId: string, actorId: string, scope: Scope, classificationId: string, itemId: string, dto: Row) {
    const classification = await this.record(tenantId, scope, classificationId);
    const before = await this.safeSingle<Row>(this.db.from('psi_electrical_installed_equipment').select('*').eq('company_id', tenantId).eq('classification_id', classificationId).eq('id', itemId).maybeSingle());
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_installed_equipment').update(this.equipmentPayload(tenantId, actorId, classification, { ...(before ?? {}), ...dto })).eq('company_id', tenantId).eq('classification_id', classificationId).eq('id', itemId).select().single()), 'Unable to update installed equipment.');
    await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.installed_equipment.updated', classification, before, row, 'Installed equipment updated', row.tag_number);
    return row;
  }

  async removeInstalledEquipment(tenantId: string, actorId: string, scope: Scope, classificationId: string, itemId: string, dto: Row) {
    const classification = await this.record(tenantId, scope, classificationId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_installed_equipment').update({ removed_at: new Date().toISOString(), removed_by: actorId, notes: dto.reason ?? dto.notes ?? null }).eq('company_id', tenantId).eq('classification_id', classificationId).eq('id', itemId).select().single()), 'Unable to remove installed equipment.');
    await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.installed_equipment.removed', classification, row, row, 'Installed equipment removed', dto.reason ?? row.tag_number);
    return row;
  }

  async runRatingCheck(tenantId: string, actorId: string, scope: Scope, classificationId: string) {
    const classification = await this.record(tenantId, scope, classificationId);
    const [area, protection, items] = await Promise.all([this.areaDetails(tenantId, scope, classificationId), this.protectionRequirements(tenantId, scope, classificationId), this.installedEquipment(tenantId, scope, classificationId)]);
    let mismatch = 0;
    let missing = 0;
    for (const item of items) {
      const result = this.ratingResult(area, protection, item);
      if (result.suitability_result === 'Mismatch') mismatch++;
      if (result.suitability_result === 'Missing Rating Data') missing++;
      await this.safeSingle(this.db.from('psi_electrical_installed_equipment').update({ ...result, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', item.id).select('id').single());
    }
    const status = mismatch ? 'Mismatch' : missing ? 'Missing Rating Data' : items.length ? 'Suitable' : 'Not Checked';
    await this.db.single(this.db.from('psi_electrical_classifications').update({ rating_compliance_status: status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', classificationId).select('id').single()).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.rating_check.run', classification, null, { status, mismatch, missing }, 'Electrical equipment rating check run');
    return { status, mismatch, missing, checked: items.length };
  }

  async documents(tenantId: string, scope: Scope, classificationId: string) {
    await this.record(tenantId, scope, classificationId);
    return this.safeMany<Row>(this.db.from('psi_electrical_document_links').select('*').eq('company_id', tenantId).eq('classification_id', classificationId).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async linkDocument(tenantId: string, actorId: string, scope: Scope, classificationId: string, dto: Row, writeEvent = true) {
    const classification = await this.record(tenantId, scope, classificationId);
    this.requireText(dto.document_id ?? dto.documentId, 'Document ID is required.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_document_links').insert(this.documentPayload(tenantId, actorId, classification, dto)).select().single()), 'Unable to link electrical classification document.');
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.document.linked', classification, null, row, 'Document linked', row.document_type);
    return row;
  }

  async unlinkDocument(tenantId: string, actorId: string, scope: Scope, classificationId: string, documentLinkId: string, dto: Row) {
    const classification = await this.record(tenantId, scope, classificationId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_document_links').update({ removed_at: new Date().toISOString(), removed_by: actorId, remove_reason: dto.reason ?? null }).eq('company_id', tenantId).eq('classification_id', classificationId).eq('id', documentLinkId).select().single()), 'Unable to unlink document.');
    await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.document.unlinked', classification, row, row, 'Document unlinked', dto.reason ?? row.document_type);
    return row;
  }

  async ptwControls(tenantId: string, scope: Scope, classificationId: string) {
    await this.record(tenantId, scope, classificationId);
    return this.safeSingle<Row>(this.db.from('psi_electrical_ptw_controls').select('*').eq('company_id', tenantId).eq('classification_id', classificationId).maybeSingle());
  }

  async upsertPtwControls(tenantId: string, actorId: string, scope: Scope, classificationId: string, dto: Row, writeEvent = true) {
    const classification = await this.record(tenantId, scope, classificationId);
    const before = await this.ptwControls(tenantId, scope, classificationId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_ptw_controls').upsert(this.ptwPayload(tenantId, classification, dto), { onConflict: 'classification_id' }).select().single()), 'Unable to save PTW / ignition source controls.');
    await this.db.single(this.db.from('psi_electrical_classifications').update({ hot_work_restricted: row.hot_work_restricted, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', classificationId).select('id').single()).catch(() => null);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.ptw_controls.updated', classification, before, row, 'PTW / ignition controls updated');
    return row;
  }

  async runCompleteness(tenantId: string, actorId: string, scope: Scope, classificationId: string) {
    const classification = await this.record(tenantId, scope, classificationId);
    const [hazard, area, ventilation, protection, items, documents, ptw, conflicts] = await Promise.all([this.hazardSources(tenantId, scope, classificationId), this.areaDetails(tenantId, scope, classificationId), this.ventilationBasis(tenantId, scope, classificationId), this.protectionRequirements(tenantId, scope, classificationId), this.installedEquipment(tenantId, scope, classificationId), this.documents(tenantId, scope, classificationId), this.ptwControls(tenantId, scope, classificationId), this.conflicts(tenantId, scope, classificationId)]);
    const checks = [
      this.check('unit', 'Unit selected', Boolean(classification.unit_id), 'Critical', 'Unit is required.'),
      this.check('area', 'Area/location selected', Boolean(classification.area_id || classification.building_location), 'Critical', 'Area or building/location is required.'),
      this.check('system', 'Classification system selected', Boolean(classification.classification_system), 'Critical', 'Classification system is required.'),
      this.check('standard', 'Applicable standard selected', Boolean(classification.applicable_standard), 'Major', 'Applicable standard is required before approval.'),
      this.check('hazardous-material', 'Hazardous material identified', Boolean(hazard?.hazardous_material_name), 'Critical', 'Hazardous material is required before approval.'),
      this.check('release-source', 'Release source identified', Boolean(hazard?.source_of_release && hazard?.release_source_type), 'Critical', 'Release source is required before approval.'),
      this.check('zone-class-division', 'Zone/Class/Division defined', Boolean(area?.zone_classification || area?.nec_class_division), 'Critical', 'Zone/Class/Division is required before approval.'),
      this.check('group', 'Gas/dust group defined where applicable', Boolean(area?.gas_group || area?.dust_group || String(area?.zone_classification ?? area?.nec_class_division ?? '').includes('Unclassified')), 'Major', 'Gas/dust group is required where applicable.'),
      this.check('temperature-class', 'Temperature class defined where applicable', Boolean(area?.temperature_class || String(area?.zone_classification ?? area?.nec_class_division ?? '').includes('Unclassified')), 'Major', 'Temperature class is required where applicable.'),
      this.check('ventilation', 'Ventilation basis documented', Boolean(ventilation?.ventilation_type), 'Critical', 'Ventilation basis is required before approval.'),
      this.check('extent', 'Area boundary/extent documented', Boolean(area?.classified_area_boundary_description || area?.hazard_radius || area?.horizontal_extent), 'Major', 'Classified area boundary/extent is required.'),
      this.check('protection', 'Required equipment protection defined', Boolean(protection?.required_protection_method), 'Critical', 'Required Ex protection method is required.'),
      this.check('drawing', 'Current approved classification drawing linked', documents.some((doc) => doc.document_type === 'Hazardous area classification drawing' && !['Superseded', 'Expired'].includes(String(doc.document_status ?? ''))), 'Critical', 'Current approved hazardous area classification drawing is required unless waived.'),
      this.check('study', 'Classification study linked where required', documents.some((doc) => doc.document_type === 'Electrical area classification study'), 'Major', 'Electrical classification study is missing.'),
      this.check('rating', 'Installed equipment rating checked', Boolean(items.length) && !items.some((item) => ['Mismatch', 'Missing Rating Data', 'Needs Review'].includes(item.suitability_result)), 'Critical', 'Installed equipment rating mismatches or missing data must be resolved/actioned.'),
      this.check('ptw', 'Hot work/PTW controls defined where classified', !classification.hot_work_restricted || Boolean(ptw?.hot_work_permit_required || ptw?.gas_test_required), 'Major', 'Hot work restricted area requires PTW controls.'),
      this.check('owner', 'Owner assigned', Boolean(classification.owner_user_id), 'Major', 'Classification owner is required.'),
      this.check('review-date', 'Review date exists', Boolean(classification.next_review_due), 'Major', 'Next review due date is required.'),
      this.check('review-overdue', 'Review not overdue', !this.isReviewOverdue(classification), 'Major', 'Electrical classification review is overdue.'),
      this.check('moc', 'MOC update status checked', !classification.moc_update_required, 'Major', 'Safety-sensitive changes require MOC review/update.'),
      this.check('conflicts', 'Conflicts checked', !conflicts.some((conflict) => ['Critical Conflict', 'Major Conflict'].includes(conflict.conflict_status) && !conflict.override_approved), 'Critical', 'Open major/critical conflicts must be resolved or overridden.')
    ];
    await this.safeMany(this.db.from('psi_electrical_completeness_evaluations').delete().eq('company_id', tenantId).eq('classification_id', classificationId).select('id'));
    for (const result of checks) await this.safeSingle(this.db.from('psi_electrical_completeness_evaluations').insert({ id: randomUUID(), company_id: tenantId, site_id: classification.site_id, classification_id: classificationId, unit_id: classification.unit_id, area_id: classification.area_id ?? null, owner_user_id: classification.owner_user_id ?? null, evaluated_at: new Date().toISOString(), ...result }).select('id').single());
    const complete = checks.filter((item) => item.status === 'Complete').length;
    const score = Math.round((complete / checks.length) * 100);
    const status = checks.some((item) => item.status === 'Critical Gaps') ? 'Critical Gaps' : score === 100 ? 'Complete' : score >= 80 ? 'Mostly Complete' : 'Incomplete';
    const pssrBlocker = checks.some((item) => item.pssr_blocker);
    await this.db.single(this.db.from('psi_electrical_classifications').update({ completeness_status: status, completeness_score: score, pssr_blocker: pssrBlocker, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', classificationId).select('id').single()).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.completeness.run', classification, null, { status, score, checks }, 'Electrical classification completeness evaluated');
    return { status, score, pssrBlocker, checks };
  }

  async completeness(tenantId: string, scope: Scope, classificationId: string) {
    await this.record(tenantId, scope, classificationId);
    return this.safeMany<Row>(this.db.from('psi_electrical_completeness_evaluations').select('*').eq('company_id', tenantId).eq('classification_id', classificationId).order('created_at'));
  }

  async runConflictCheck(tenantId: string, actorId: string, scope: Scope, classificationId: string) {
    const classification = await this.record(tenantId, scope, classificationId);
    const [hazard, area, ventilation, protection, items, documents, ptw] = await Promise.all([this.hazardSources(tenantId, scope, classificationId), this.areaDetails(tenantId, scope, classificationId), this.ventilationBasis(tenantId, scope, classificationId), this.protectionRequirements(tenantId, scope, classificationId), this.installedEquipment(tenantId, scope, classificationId), this.documents(tenantId, scope, classificationId), this.ptwControls(tenantId, scope, classificationId)]);
    const conflicts: Row[] = [];
    if (items.some((item) => item.suitability_result === 'Mismatch')) conflicts.push(this.conflict(tenantId, classification, 'Equipment Rating Mismatch', 'Critical Conflict', 'Critical', 'Installed equipment Ex rating does not match required hazardous area classification.', 'Equipment Registry', null, { items: items.filter((item) => item.suitability_result === 'Mismatch') }, { area, protection }));
    if (items.some((item) => item.suitability_result === 'Missing Rating Data')) conflicts.push(this.conflict(tenantId, classification, 'Missing Ex Rating', 'Major Conflict', 'High', 'Installed equipment in classified area is missing Ex rating/certificate data.', 'Mechanical Integrity'));
    if (documents.some((doc) => ['Superseded', 'Expired'].includes(String(doc.document_status ?? '')))) conflicts.push(this.conflict(tenantId, classification, 'Superseded Drawing', 'Major Conflict', 'High', 'Classification drawing/document is superseded or expired.', 'Document Control'));
    if (classification.hot_work_restricted && !ptw?.hot_work_permit_required && !ptw?.gas_test_required) conflicts.push(this.conflict(tenantId, classification, 'PTW Controls Missing', 'Warning', 'Medium', 'Hot work restricted area is missing PTW/gas test controls.', 'PTW'));
    if (ventilation?.ventilation_type === 'Mechanical' && !ventilation?.ventilation_reliability) conflicts.push(this.conflict(tenantId, classification, 'Mechanical Ventilation Reliability Missing', 'Warning', 'Medium', 'Mechanical ventilation credited without reliability basis.', 'PSI'));
    if (hazard?.material_type && ['Flammable gas', 'Flammable vapor', 'Combustible dust'].includes(hazard.material_type) && !area?.zone_classification && !area?.nec_class_division) conflicts.push(this.conflict(tenantId, classification, 'Hazardous Material Without Classification', 'Critical Conflict', 'Critical', 'Hazardous material/release source exists but Zone/Class/Division is not defined.', 'Chemicals & SDS'));
    await this.safeMany(this.db.from('psi_electrical_conflict_results').delete().eq('company_id', tenantId).eq('classification_id', classificationId).eq('override_approved', false).select('id'));
    for (const result of conflicts) await this.safeSingle(this.db.from('psi_electrical_conflict_results').insert(result).select('id').single());
    const merged = await this.conflicts(tenantId, scope, classificationId);
    const status = this.worstConflict(merged);
    await this.db.single(this.db.from('psi_electrical_classifications').update({ conflict_status: status, pssr_blocker: status === 'Critical Conflict' ? true : classification.pssr_blocker, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', classificationId).select('id').single()).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.conflict_check.run', classification, null, { status, conflicts }, 'Electrical classification conflict/rating validation run');
    return { status, conflicts: merged };
  }

  async conflicts(tenantId: string, scope: Scope, classificationId: string) {
    await this.record(tenantId, scope, classificationId);
    return this.safeMany<Row>(this.db.from('psi_electrical_conflict_results').select('*').eq('company_id', tenantId).eq('classification_id', classificationId).order('created_at', { ascending: false }));
  }

  async overrideConflict(tenantId: string, actorId: string, scope: Scope, classificationId: string, conflictId: string, dto: Row) {
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Conflict override reason is required.');
    const classification = await this.record(tenantId, scope, classificationId);
    const before = await this.safeSingle<Row>(this.db.from('psi_electrical_conflict_results').select('*').eq('company_id', tenantId).eq('classification_id', classificationId).eq('id', conflictId).maybeSingle());
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_conflict_results').update({ override_approved: true, override_reason: String(dto.reason), override_approved_by: actorId, override_approved_at: new Date().toISOString(), conflict_status: 'Override Approved', updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('classification_id', classificationId).eq('id', conflictId).select().single()), 'Unable to override conflict.');
    await this.runConflictCheck(tenantId, actorId, scope, classificationId);
    await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.conflict.override', classification, before, row, 'Electrical conflict override approved', String(dto.reason));
    return row;
  }

  async submitReview(tenantId: string, actorId: string, scope: Scope, classificationId: string, dto: Row) {
    const classification = await this.record(tenantId, scope, classificationId);
    const completeness = await this.runCompleteness(tenantId, actorId, scope, classificationId);
    const conflicts = await this.runConflictCheck(tenantId, actorId, scope, classificationId);
    if (conflicts.status === 'Critical Conflict') throw new BadRequestException('Critical electrical classification conflicts block review submission until resolved or overridden.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_electrical_classifications').update({ review_status: 'Submitted', classification_status: 'Pending Review', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', classificationId).select().single()), 'Unable to submit electrical classification review.');
    await this.writeHistory(tenantId, actorId, 'psi.electrical_classification.review.submitted', row, classification, { completeness, conflicts }, 'Electrical classification submitted for review', dto.reason ?? null);
    return row;
  }

  async history(tenantId: string, scope: Scope, classificationId: string) {
    await this.record(tenantId, scope, classificationId, true);
    return this.safeMany<Row>(this.db.from('psi_electrical_history_events').select('*').eq('company_id', tenantId).eq('classification_id', classificationId).order('created_at', { ascending: false }));
  }

  async importTemplate() {
    return {
      classificationColumns: ['unit_code', 'area', 'classification_title', 'classification_system', 'applicable_standard', 'zone_classification', 'nec_class_division', 'gas_group', 'dust_group', 'temperature_class', 'hazardous_material_name', 'cas_number', 'chemical_reference', 'release_source_type', 'release_grade', 'ventilation_type', 'required_protection_method', 'required_ex_marking', 'hot_work_restricted', 'gas_test_required', 'drawing_reference', 'owner_email', 'next_review_due'],
      installedEquipmentColumns: ['classification_record_number', 'area', 'tag_number', 'item_type', 'equipment_reference', 'installed_ex_marking', 'installed_epl', 'installed_gas_dust_group', 'installed_temperature_class', 'ip_rating', 'certificate_reference', 'manufacturer', 'model']
    };
  }

  async importPreview(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const preview = rows.map((row: Row, index: number) => ({ rowNumber: index + 1, row, errors: this.validateImportRow(row) }));
    const job = await this.safeSingle<Row>(this.db.from('psi_electrical_import_jobs').insert({ id: randomUUID(), company_id: tenantId, site_id: this.selectedSite(scope), uploaded_by: actorId, file_name: dto.fileName ?? 'electrical-classification-import', file_key: dto.fileKey ?? null, status: 'Preview', total_rows: rows.length, valid_rows: preview.filter((row) => !row.errors.length).length, error_rows: preview.filter((row) => row.errors.length).length }).select().single());
    return { job, preview };
  }

  async exportRows(tenantId: string, actorId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    await this.audit.write({ tenantId, actorId, action: 'psi.electrical_classification.export', entityType: 'PSI_ELECTRICAL_CLASSIFICATION', entityId: 'export', after: { count: rows.length } as JsonValue }).catch(() => null);
    return { exportedAt: new Date().toISOString(), count: rows.length, rows };
  }

  lookups() {
    return { classificationSystems, hazardousAreaStandards, zones, classDivisions, gasGroups, dustGroups, temperatureClasses, protectionMethods, releaseSourceTypes, releaseGrades, ventilationTypes, electricalDocumentTypes, electricalConflictStatuses, suitabilityResults, materialTypes };
  }

  private async registryRows(tenantId: string, scope: Scope, query: Row, paged: boolean, page = 1, limit = 25) {
    const sort = String(query.sort ?? 'updated_at.desc');
    const [sortColumn, sortDirection] = sort.split('.');
    let request: any = this.applyScope(this.db.from('psi_electrical_classifications').select('*, psi_electrical_hazard_sources(*), psi_area_classification_details(*), psi_electrical_ventilation_basis(*), psi_electrical_protection_requirements(*), psi_electrical_installed_equipment(*), psi_electrical_document_links(*), psi_electrical_ptw_controls(*)').eq('company_id', tenantId), scope);
    if (query.includeArchived !== 'true') request = request.is('archived_at', null);
    if (query.search) request = request.or(`classification_title.ilike.%${query.search}%,classification_record_number.ilike.%${query.search}%,building_location.ilike.%${query.search}%,system_service.ilike.%${query.search}%`);
    if (query.unitId ?? query.unit_id) request = request.eq('unit_id', query.unitId ?? query.unit_id);
    if (query.areaId ?? query.area_id) request = request.eq('area_id', query.areaId ?? query.area_id);
    if (query.classificationSystem ?? query.classification_system) request = request.eq('classification_system', query.classificationSystem ?? query.classification_system);
    if (query.reviewStatus ?? query.review_status) request = request.eq('review_status', query.reviewStatus ?? query.review_status);
    if (query.completenessStatus ?? query.completeness_status) request = request.eq('completeness_status', query.completenessStatus ?? query.completeness_status);
    if (query.mocRequired === 'true' || query.moc_required === 'true') request = request.eq('moc_update_required', true);
    if (query.pssrBlocker === 'true' || query.pssr_blocker === 'true') request = request.eq('pssr_blocker', true);
    const rows = await this.safeMany<Row>(request.order(this.safeSortColumn(sortColumn ?? 'updated_at'), { ascending: sortDirection !== 'desc' }));
    const normalized = rows.map((row) => this.normalize(row)).filter((row) => {
      if (query.hazardousAreas) return Boolean(row.zone_classification || row.nec_class_division) && !String(row.zone_classification ?? row.nec_class_division).includes('Unclassified');
      if (query.equipmentRatings) return row.installedEquipment?.length;
      if (query.ratingMismatches) return row.rating_compliance_status === 'Mismatch' || row.installedEquipment?.some((item: Row) => item.suitability_result === 'Mismatch');
      if (query.missing) return ['Incomplete', 'Critical Gaps', 'Not Reviewed'].includes(row.completeness_status);
      if (query.reviewOverdue) return this.isReviewOverdue(row);
      if (query.equipmentId ?? query.equipment_id) return row.installedEquipment?.some((item: Row) => item.equipment_id === (query.equipmentId ?? query.equipment_id));
      return true;
    });
    if (!paged) return normalized;
    return normalized.slice((page - 1) * limit, page * limit);
  }

  private normalize(row: Row): Row {
    const hazardRows = row.psi_electrical_hazard_sources ?? [];
    const areaRows = row.psi_area_classification_details ?? [];
    const ventilationRows = row.psi_electrical_ventilation_basis ?? [];
    const protectionRows = row.psi_electrical_protection_requirements ?? [];
    const ptwRows = row.psi_electrical_ptw_controls ?? [];
    const installedEquipment = (row.psi_electrical_installed_equipment ?? []).filter((item: Row) => !item.removed_at);
    const documents = (row.psi_electrical_document_links ?? []).filter((doc: Row) => !doc.removed_at);
    const hazardSource = Array.isArray(hazardRows) ? hazardRows[0] : hazardRows;
    const areaDetails = Array.isArray(areaRows) ? areaRows[0] : areaRows;
    const ventilationBasis = Array.isArray(ventilationRows) ? ventilationRows[0] : ventilationRows;
    const protectionRequirements = Array.isArray(protectionRows) ? protectionRows[0] : protectionRows;
    const ptwControls = Array.isArray(ptwRows) ? ptwRows[0] : ptwRows;
    return { ...row, hazardSource: hazardSource ?? null, areaDetails: areaDetails ?? null, ventilationBasis: ventilationBasis ?? null, protectionRequirements: protectionRequirements ?? null, installedEquipment, documents, ptwControls: ptwControls ?? null, hazardous_material_name: hazardSource?.hazardous_material_name ?? null, release_source_type: hazardSource?.release_source_type ?? null, zone_classification: areaDetails?.zone_classification ?? null, nec_class_division: areaDetails?.nec_class_division ?? null, gas_group: areaDetails?.gas_group ?? null, dust_group: areaDetails?.dust_group ?? null, temperature_class: areaDetails?.temperature_class ?? null, required_protection_method: protectionRequirements?.required_protection_method ?? null, drawing_status: documents.find((doc: Row) => doc.document_type === 'Hazardous area classification drawing')?.document_status ?? null };
  }

  private async record(tenantId: string, scope: Scope, classificationId: string, includeArchived = false) {
    let request: any = this.applyScope(this.db.from('psi_electrical_classifications').select('*').eq('company_id', tenantId).eq('id', classificationId), scope);
    if (!includeArchived) request = request.is('archived_at', null);
    const row = await this.db.single<Row>(request.maybeSingle()).catch(() => null);
    if (!row) throw new NotFoundException('Electrical classification record not found or outside your site scope.');
    return row;
  }

  private async unitRecord(tenantId: string, scope: Scope, unitId: string) {
    const row = await this.db.single<Row>(this.applyScope(this.db.from('psi_units').select('*').eq('company_id', tenantId).eq('id', unitId), scope).maybeSingle()).catch(() => null);
    if (!row) throw new BadRequestException('Process unit is required and must be in your company/site scope.');
    return row;
  }

  private classificationPayload(tenantId: string, actorId: string, siteId: string, unit: Row, dto: Row, extra: Row = {}): Row {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: siteId, unit_id: unit.id ?? dto.unit_id ?? dto.unitId, area_id: dto.area_id ?? dto.areaId ?? null, classification_title: dto.classification_title ?? dto.classificationTitle, classification_record_number: dto.classification_record_number ?? dto.classificationRecordNumber ?? null, building_location: dto.building_location ?? dto.buildingLocation ?? null, system_service: dto.system_service ?? dto.systemService ?? null, classification_system: dto.classification_system ?? dto.classificationSystem, applicable_standard: dto.applicable_standard ?? dto.applicableStandard ?? null, classification_status: dto.classification_status ?? dto.classificationStatus ?? 'Draft', critical_area: Boolean(dto.critical_area ?? dto.criticalArea), psm_critical: Boolean(dto.psm_critical ?? dto.psmCritical), hot_work_restricted: Boolean(dto.hot_work_restricted ?? dto.hotWorkRestricted), owner_user_id: dto.owner_user_id ?? dto.ownerUserId ?? null, electrical_engineer_id: dto.electrical_engineer_id ?? dto.electricalEngineerId ?? null, instrument_engineer_id: dto.instrument_engineer_id ?? dto.instrumentEngineerId ?? null, process_engineer_id: dto.process_engineer_id ?? dto.processEngineerId ?? null, operations_owner_id: dto.operations_owner_id ?? dto.operationsOwnerId ?? null, hse_reviewer_id: dto.hse_reviewer_id ?? dto.hseReviewerId ?? null, last_review_date: this.dateOrNull(dto.last_review_date ?? dto.lastReviewDate), next_review_due: this.dateOrNull(dto.next_review_due ?? dto.nextReviewDue), notes: dto.notes ?? null, created_by: actorId, updated_by: actorId, ...extra });
  }

  private hazardPayload(tenantId: string, classification: Row, dto: Row) {
    return this.clean({ id: dto.hazard_source_id ?? dto.hazardSourceId ?? randomUUID(), company_id: tenantId, site_id: classification.site_id, classification_id: classification.id, chemical_id: dto.chemical_id ?? dto.chemicalId ?? null, hazardous_material_name: dto.hazardous_material_name ?? dto.hazardousMaterialName, cas_number: dto.cas_number ?? dto.casNumber ?? null, material_type: dto.material_type ?? dto.materialType ?? 'Other', flash_point: dto.flash_point ?? dto.flashPoint ?? null, autoignition_temperature: dto.autoignition_temperature ?? dto.autoignitionTemperature ?? null, lel: dto.lel ?? null, uel: dto.uel ?? null, vapor_density: dto.vapor_density ?? dto.vaporDensity ?? null, dust_explosibility_data: dto.dust_explosibility_data ?? dto.dustExplosibilityData ?? null, minimum_ignition_energy: dto.minimum_ignition_energy ?? dto.minimumIgnitionEnergy ?? null, temperature_class_basis: dto.temperature_class_basis ?? dto.temperatureClassBasis ?? null, gas_group_basis: dto.gas_group_basis ?? dto.gasGroupBasis ?? null, source_of_release: dto.source_of_release ?? dto.sourceOfRelease, release_source_type: dto.release_source_type ?? dto.releaseSourceType, release_grade: dto.release_grade ?? dto.releaseGrade ?? 'Unknown / needs study', release_frequency: dto.release_frequency ?? dto.releaseFrequency ?? null, release_duration: dto.release_duration ?? dto.releaseDuration ?? null, release_pressure: dto.release_pressure ?? dto.releasePressure ?? null, release_temperature: dto.release_temperature ?? dto.releaseTemperature ?? null, release_rate_basis: dto.release_rate_basis ?? dto.releaseRateBasis ?? null, process_condition_causing_release: dto.process_condition_causing_release ?? dto.processConditionCausingRelease ?? null, normal_or_abnormal_release: dto.normal_or_abnormal_release ?? dto.normalOrAbnormalRelease ?? null, related_process_chemistry_id: dto.related_process_chemistry_id ?? dto.relatedProcessChemistryId ?? null, related_relief_system_id: dto.related_relief_system_id ?? dto.relatedReliefSystemId ?? null, related_equipment_id: dto.related_equipment_id ?? dto.relatedEquipmentId ?? null, related_drawing_id: dto.related_drawing_id ?? dto.relatedDrawingId ?? null, notes: dto.hazard_notes ?? dto.hazardNotes ?? dto.notes ?? null, updated_at: new Date().toISOString() });
  }

  private areaPayload(tenantId: string, classification: Row, dto: Row) {
    return this.clean({ id: dto.area_detail_id ?? dto.areaDetailId ?? randomUUID(), company_id: tenantId, site_id: classification.site_id, classification_id: classification.id, zone_classification: dto.zone_classification ?? dto.zoneClassification ?? null, nec_class_division: dto.nec_class_division ?? dto.necClassDivision ?? null, gas_group: dto.gas_group ?? dto.gasGroup ?? null, dust_group: dto.dust_group ?? dto.dustGroup ?? null, temperature_class: dto.temperature_class ?? dto.temperatureClass ?? null, equipment_protection_level: dto.equipment_protection_level ?? dto.equipmentProtectionLevel ?? null, epl_required: dto.epl_required ?? dto.eplRequired ?? null, ex_marking_requirement: dto.ex_marking_requirement ?? dto.exMarkingRequirement ?? null, zone_basis: dto.zone_basis ?? dto.zoneBasis ?? null, class_division_basis: dto.class_division_basis ?? dto.classDivisionBasis ?? null, classified_area_boundary_description: dto.classified_area_boundary_description ?? dto.classifiedAreaBoundaryDescription ?? null, hazard_radius: dto.hazard_radius ?? dto.hazardRadius ?? null, vertical_extent: dto.vertical_extent ?? dto.verticalExtent ?? null, horizontal_extent: dto.horizontal_extent ?? dto.horizontalExtent ?? null, nearby_openings_impact: dto.nearby_openings_impact ?? dto.nearbyOpeningsImpact ?? null, drain_low_point_impact: dto.drain_low_point_impact ?? dto.drainLowPointImpact ?? null, ventilation_effect: dto.ventilation_effect ?? dto.ventilationEffect ?? null, weather_outdoor_effect: dto.weather_outdoor_effect ?? dto.weatherOutdoorEffect ?? null, adjacent_area_classification: dto.adjacent_area_classification ?? dto.adjacentAreaClassification ?? null, unclassified_area_justification: dto.unclassified_area_justification ?? dto.unclassifiedAreaJustification ?? null, classification_assumptions: dto.classification_assumptions ?? dto.classificationAssumptions ?? null, notes: dto.area_notes ?? dto.areaNotes ?? null, updated_at: new Date().toISOString() });
  }

  private ventilationPayload(tenantId: string, classification: Row, dto: Row) {
    return this.clean({ id: dto.ventilation_basis_id ?? dto.ventilationBasisId ?? randomUUID(), company_id: tenantId, site_id: classification.site_id, classification_id: classification.id, ventilation_type: dto.ventilation_type ?? dto.ventilationType ?? 'Unknown / needs study', ventilation_availability: dto.ventilation_availability ?? dto.ventilationAvailability ?? null, ventilation_effectiveness: dto.ventilation_effectiveness ?? dto.ventilationEffectiveness ?? null, indoor_outdoor: dto.indoor_outdoor ?? dto.indoorOutdoor ?? null, natural_ventilation_basis: dto.natural_ventilation_basis ?? dto.naturalVentilationBasis ?? null, mechanical_ventilation_basis: dto.mechanical_ventilation_basis ?? dto.mechanicalVentilationBasis ?? null, air_changes_per_hour: dto.air_changes_per_hour ?? dto.airChangesPerHour ?? null, ventilation_reliability: dto.ventilation_reliability ?? dto.ventilationReliability ?? null, ventilation_failure_impact: dto.ventilation_failure_impact ?? dto.ventilationFailureImpact ?? null, enclosure_building_details: dto.enclosure_building_details ?? dto.enclosureBuildingDetails ?? null, gas_detector_coverage_foundation: dto.gas_detector_coverage_foundation ?? dto.gasDetectorCoverageFoundation ?? null, drainage_low_point_accumulation_concern: Boolean(dto.drainage_low_point_accumulation_concern ?? dto.drainageLowPointAccumulationConcern), release_dispersion_assumption: dto.release_dispersion_assumption ?? dto.releaseDispersionAssumption ?? null, extent_calculation_method: dto.extent_calculation_method ?? dto.extentCalculationMethod ?? null, extent_drawing_document_id: dto.extent_drawing_document_id ?? dto.extentDrawingDocumentId ?? null, ventilation_study_document_id: dto.ventilation_study_document_id ?? dto.ventilationStudyDocumentId ?? null, notes: dto.ventilation_notes ?? dto.ventilationNotes ?? null, updated_at: new Date().toISOString() });
  }

  private protectionPayload(tenantId: string, classification: Row, dto: Row) {
    return this.clean({ id: dto.protection_requirement_id ?? dto.protectionRequirementId ?? randomUUID(), company_id: tenantId, site_id: classification.site_id, classification_id: classification.id, required_protection_method: dto.required_protection_method ?? dto.requiredProtectionMethod ?? 'Other', required_ex_marking: dto.required_ex_marking ?? dto.requiredExMarking ?? null, required_epl: dto.required_epl ?? dto.requiredEpl ?? null, required_ip_rating: dto.required_ip_rating ?? dto.requiredIpRating ?? null, required_temperature_class: dto.required_temperature_class ?? dto.requiredTemperatureClass ?? null, required_gas_dust_group: dto.required_gas_dust_group ?? dto.requiredGasDustGroup ?? null, intrinsic_safety_required: Boolean(dto.intrinsic_safety_required ?? dto.intrinsicSafetyRequired), explosion_proof_required: Boolean(dto.explosion_proof_required ?? dto.explosionProofRequired), increased_safety_required: Boolean(dto.increased_safety_required ?? dto.increasedSafetyRequired), pressurization_purging_required: Boolean(dto.pressurization_purging_required ?? dto.pressurizationPurgingRequired), non_sparking_required: Boolean(dto.non_sparking_required ?? dto.nonSparkingRequired), dust_protection_required: Boolean(dto.dust_protection_required ?? dto.dustProtectionRequired), cable_gland_requirement: dto.cable_gland_requirement ?? dto.cableGlandRequirement ?? null, earthing_bonding_requirement: dto.earthing_bonding_requirement ?? dto.earthingBondingRequirement ?? null, static_control_requirement: dto.static_control_requirement ?? dto.staticControlRequirement ?? null, hot_surface_temperature_control: dto.hot_surface_temperature_control ?? dto.hotSurfaceTemperatureControl ?? null, portable_equipment_restrictions: dto.portable_equipment_restrictions ?? dto.portableEquipmentRestrictions ?? null, temporary_equipment_restrictions: dto.temporary_equipment_restrictions ?? dto.temporaryEquipmentRestrictions ?? null, inspection_frequency_foundation: dto.inspection_frequency_foundation ?? dto.inspectionFrequencyFoundation ?? null, maintenance_requirements_foundation: dto.maintenance_requirements_foundation ?? dto.maintenanceRequirementsFoundation ?? null, notes: dto.protection_notes ?? dto.protectionNotes ?? null, updated_at: new Date().toISOString() });
  }

  private equipmentPayload(tenantId: string, actorId: string, classification: Row, dto: Row) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: classification.site_id, classification_id: classification.id, equipment_id: dto.equipment_id ?? dto.equipmentId ?? null, instrument_id: dto.instrument_id ?? dto.instrumentId ?? null, tag_number: dto.tag_number ?? dto.tagNumber, item_type: dto.item_type ?? dto.itemType ?? 'Other', location: dto.location ?? null, installed_ex_marking: dto.installed_ex_marking ?? dto.installedExMarking ?? null, installed_epl: dto.installed_epl ?? dto.installedEpl ?? null, installed_gas_dust_group: dto.installed_gas_dust_group ?? dto.installedGasDustGroup ?? null, installed_temperature_class: dto.installed_temperature_class ?? dto.installedTemperatureClass ?? null, ip_rating: dto.ip_rating ?? dto.ipRating ?? null, certification_document_id: dto.certification_document_id ?? dto.certificationDocumentId ?? null, certificate_number: dto.certificate_number ?? dto.certificateNumber ?? null, manufacturer: dto.manufacturer ?? null, model: dto.model ?? null, inspection_status_foundation: dto.inspection_status_foundation ?? dto.inspectionStatusFoundation ?? null, suitability_result: dto.suitability_result ?? dto.suitabilityResult ?? 'Needs Review', mismatch_reason: dto.mismatch_reason ?? dto.mismatchReason ?? null, action_required: Boolean(dto.action_required ?? dto.actionRequired), notes: dto.notes ?? null, created_by: dto.created_by ?? actorId, updated_by: actorId, updated_at: new Date().toISOString() });
  }

  private documentPayload(tenantId: string, actorId: string, classification: Row, dto: Row) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: classification.site_id, classification_id: classification.id, document_id: dto.document_id ?? dto.documentId, document_type: dto.document_type ?? dto.documentType ?? 'Hazardous area classification drawing', relationship_type: dto.relationship_type ?? dto.relationshipType ?? 'Evidence', required: Boolean(dto.required), readiness_impact: Boolean(dto.readiness_impact ?? dto.readinessImpact), document_number: dto.document_number ?? dto.documentNumber ?? null, document_title: dto.document_title ?? dto.documentTitle ?? null, document_status: dto.document_status ?? dto.documentStatus ?? null, revision_number: dto.revision_number ?? dto.revisionNumber ?? null, linked_by: actorId, linked_at: new Date().toISOString() });
  }

  private ptwPayload(tenantId: string, classification: Row, dto: Row) {
    return this.clean({ id: dto.ptw_control_id ?? dto.ptwControlId ?? randomUUID(), company_id: tenantId, site_id: classification.site_id, classification_id: classification.id, hot_work_restricted: Boolean(dto.hot_work_restricted ?? dto.hotWorkRestricted), hot_work_permit_required: Boolean(dto.hot_work_permit_required ?? dto.hotWorkPermitRequired), gas_test_required: Boolean(dto.gas_test_required ?? dto.gasTestRequired), continuous_gas_monitoring_required: Boolean(dto.continuous_gas_monitoring_required ?? dto.continuousGasMonitoringRequired), isolation_required: Boolean(dto.isolation_required ?? dto.isolationRequired), temporary_electrical_equipment_restriction: dto.temporary_electrical_equipment_restriction ?? dto.temporaryElectricalEquipmentRestriction ?? null, portable_device_restriction: dto.portable_device_restriction ?? dto.portableDeviceRestriction ?? null, non_ex_equipment_prohibited: Boolean(dto.non_ex_equipment_prohibited ?? dto.nonExEquipmentProhibited), bonding_earthing_requirement: dto.bonding_earthing_requirement ?? dto.bondingEarthingRequirement ?? null, static_control_requirement: dto.static_control_requirement ?? dto.staticControlRequirement ?? null, vehicle_mobile_equipment_restriction: dto.vehicle_mobile_equipment_restriction ?? dto.vehicleMobileEquipmentRestriction ?? null, opening_drain_vent_restriction: dto.opening_drain_vent_restriction ?? dto.openingDrainVentRestriction ?? null, required_ppe: dto.required_ppe ?? dto.requiredPpe ?? null, emergency_response_note: dto.emergency_response_note ?? dto.emergencyResponseNote ?? null, ptw_hazard_note: dto.ptw_hazard_note ?? dto.ptwHazardNote ?? null, loto_electrical_isolation_note: dto.loto_electrical_isolation_note ?? dto.lotoElectricalIsolationNote ?? null, notes: dto.ptw_notes ?? dto.ptwNotes ?? dto.notes ?? null, updated_at: new Date().toISOString() });
  }

  private ratingResult(area: Row | null, protection: Row | null, item: Row) {
    if (!item.installed_ex_marking && !item.installed_epl && !item.installed_temperature_class) return { suitability_result: 'Missing Rating Data', mismatch_reason: 'Installed Ex rating/certificate data is missing.', action_required: true };
    const requiredGroup = protection?.required_gas_dust_group ?? area?.gas_group ?? area?.dust_group;
    const requiredTemp = protection?.required_temperature_class ?? area?.temperature_class;
    if (requiredGroup && item.installed_gas_dust_group && String(item.installed_gas_dust_group) !== String(requiredGroup)) return { suitability_result: 'Mismatch', mismatch_reason: `Installed group ${item.installed_gas_dust_group} does not match required ${requiredGroup}.`, action_required: true };
    if (requiredTemp && item.installed_temperature_class && String(item.installed_temperature_class) !== String(requiredTemp)) return { suitability_result: 'Suitable With Conditions', mismatch_reason: `Confirm installed T-class ${item.installed_temperature_class} against required ${requiredTemp}.`, action_required: true };
    return { suitability_result: 'Suitable', mismatch_reason: null, action_required: false };
  }

  private validateIdentity(dto: Row) {
    this.requireText(dto.classification_title ?? dto.classificationTitle, 'Classification title is required.');
    this.requireText(dto.unit_id ?? dto.unitId, 'Process unit is required.');
    this.requireText(dto.classification_system ?? dto.classificationSystem, 'Classification system is required.');
    if (!classificationSystems.includes(String(dto.classification_system ?? dto.classificationSystem))) throw new BadRequestException('Classification system is not supported.');
    if ((dto.critical_area ?? dto.criticalArea) && !(dto.owner_user_id ?? dto.ownerUserId)) throw new BadRequestException('Critical area requires an owner.');
  }

  private validateImportRow(row: Row) {
    const errors: string[] = [];
    if (!row.unit_code && !row.unit_id) errors.push('unit_code or unit_id is required');
    if (!row.classification_title) errors.push('classification_title is required');
    if (!row.classification_system || !classificationSystems.includes(String(row.classification_system))) errors.push('classification_system is invalid');
    if (!row.area && !row.building_location) errors.push('area or building_location is required');
    return errors;
  }

  private hasHazardSourceFields(dto: Row) { return ['hazardous_material_name', 'chemical_id', 'release_source_type', 'source_of_release', 'release_grade'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private hasAreaFields(dto: Row) { return ['zone_classification', 'nec_class_division', 'gas_group', 'dust_group', 'temperature_class', 'hazard_radius', 'classified_area_boundary_description'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private hasVentilationFields(dto: Row) { return ['ventilation_type', 'ventilation_availability', 'ventilation_effectiveness', 'mechanical_ventilation_basis', 'air_changes_per_hour'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private hasProtectionFields(dto: Row) { return ['required_protection_method', 'required_ex_marking', 'required_epl', 'required_temperature_class', 'required_gas_dust_group'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private hasPtwFields(dto: Row) { return ['hot_work_restricted', 'hot_work_permit_required', 'gas_test_required', 'continuous_gas_monitoring_required', 'isolation_required', 'non_ex_equipment_prohibited'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }

  private async markMocIfChanged(tenantId: string, actorId: string, classification: Row, before: Row | null, after: Row, keys: string[]) {
    if (!before) return;
    const changed = keys.some((key) => String(before[key] ?? '') !== String(after[key] ?? ''));
    if (changed) await this.db.single(this.db.from('psi_electrical_classifications').update({ moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', classification.id).select('id').single()).catch(() => null);
  }

  private conflict(tenantId: string, classification: Row, type: string, status: string, severity: string, message: string, comparedModule?: string | null, comparedRecordId?: string | null, comparedValue?: Row | null, currentValue?: Row | null) {
    return { id: randomUUID(), company_id: tenantId, site_id: classification.site_id, classification_id: classification.id, conflict_type: type, conflict_status: status, severity, message, compared_module: comparedModule ?? null, compared_record_id: comparedRecordId ?? null, compared_value_json: comparedValue ?? null, current_value_json: currentValue ?? null, override_required: status === 'Critical Conflict', override_approved: false };
  }

  private check(key: string, title: string, ok: boolean, severity: string, message: string) {
    return { check_key: key, check_title: title, status: ok ? 'Complete' : severity === 'Critical' ? 'Critical Gaps' : 'Incomplete', severity, message: ok ? null : message, missing_reason: ok ? null : message, pssr_blocker: severity === 'Critical' && !ok, action_required: !ok };
  }

  private overview(classification: Row, hazard: Row | null, area: Row | null, ventilation: Row | null, protection: Row | null, items: Row[], documents: Row[], ptw: Row | null, completeness: Row[], conflicts: Row[]) {
    return {
      cards: [
        { label: 'Area / Location', value: classification.building_location ?? classification.area_id ?? 'Missing', tone: classification.building_location || classification.area_id ? 'neutral' : 'danger' },
        { label: 'Unit', value: classification.unit_id },
        { label: 'Classification System', value: classification.classification_system },
        { label: 'Zone / Class / Division', value: area?.zone_classification ?? area?.nec_class_division ?? 'Missing', tone: area?.zone_classification || area?.nec_class_division ? 'warn' : 'danger' },
        { label: 'Gas / Dust Group', value: area?.gas_group ?? area?.dust_group ?? 'Missing' },
        { label: 'Temperature Class', value: area?.temperature_class ?? 'Missing' },
        { label: 'Hazardous Material', value: hazard?.hazardous_material_name ?? 'Missing' },
        { label: 'Release Source', value: hazard?.release_source_type ?? 'Missing' },
        { label: 'Ventilation Basis', value: ventilation?.ventilation_type ?? 'Missing' },
        { label: 'Required Ex Protection', value: protection?.required_protection_method ?? 'Missing' },
        { label: 'Installed Equipment Rating', value: classification.rating_compliance_status ?? 'Not Checked' },
        { label: 'Drawing Status', value: documents.find((doc) => doc.document_type === 'Hazardous area classification drawing')?.document_status ?? 'Missing' },
        { label: 'Completeness', value: `${classification.completeness_status} ${classification.completeness_score ?? 0}%` },
        { label: 'Conflict Status', value: classification.conflict_status },
        { label: 'Review Status', value: classification.review_status },
        { label: 'MOC Required', value: classification.moc_update_required ? 'Yes' : 'No', tone: classification.moc_update_required ? 'warn' : 'good' },
        { label: 'PSSR Blocker', value: classification.pssr_blocker ? 'Yes' : 'No', tone: classification.pssr_blocker ? 'danger' : 'good' },
        { label: 'PSI Completeness Impact', value: completeness.filter((row) => row.status !== 'Complete').length ? 'Open gaps' : 'No gaps' },
        { label: 'Hot Work Restricted', value: classification.hot_work_restricted || ptw?.hot_work_restricted ? 'Yes' : 'No', tone: classification.hot_work_restricted || ptw?.hot_work_restricted ? 'danger' : 'good' },
        { label: 'Installed Items', value: items.length }
      ],
      blockers: [...completeness.filter((row) => row.status !== 'Complete'), ...conflicts.filter((row) => row.conflict_status !== 'No Conflict')]
    };
  }

  private tabs(classificationId: string) {
    return ['Overview', 'Hazardous Material / Release Source', 'Area Classification', 'Ventilation / Extent Basis', 'Equipment Protection Requirements', 'Installed Equipment / Rating Check', 'Drawings / Documents', 'PTW / Ignition Controls', 'Completeness / Conflicts', 'Linked Records', 'Review & Approval', 'Change History'].map((label) => ({ label, href: `/process-safety-information/electrical-classification/${classificationId}`, enabled: true }));
  }

  private actions(classification: Row, documents: Row[], items: Row[], completeness: Row[], conflicts: Row[]) {
    const criticalConflict = conflicts.some((item) => item.conflict_status === 'Critical Conflict' && !item.override_approved);
    const missingDoc = !documents.some((doc) => doc.document_type === 'Hazardous area classification drawing');
    const incomplete = completeness.some((item) => item.status !== 'Complete');
    return [
      { key: 'edit', label: 'Edit Classification', enabled: classification.review_status !== 'Approved', disabledReason: classification.review_status === 'Approved' ? 'Approved classification requires controlled edit/MOC.' : null },
      { key: 'rating-check', label: 'Run Rating Check', enabled: items.length > 0, disabledReason: items.length ? null : 'Add installed equipment before running rating check.' },
      { key: 'completeness', label: 'Run Completeness Check', enabled: true, disabledReason: null },
      { key: 'conflicts', label: 'Run Conflict Check', enabled: true, disabledReason: null },
      { key: 'submit-review', label: 'Submit for Review', enabled: !criticalConflict && !missingDoc && !incomplete, disabledReason: criticalConflict ? 'Critical conflicts block review.' : missingDoc ? 'Current approved classification drawing is missing.' : incomplete ? 'Completeness gaps remain.' : null }
    ];
  }

  private isReviewOverdue(row: Row) { if (!row.next_review_due) return false; return new Date(row.next_review_due).getTime() < Date.now() && row.review_status !== 'Approved'; }
  private worstConflict(results: Row[]) { if (results.some((row) => row.conflict_status === 'Critical Conflict' && !row.override_approved)) return 'Critical Conflict'; if (results.some((row) => row.conflict_status === 'Major Conflict' && !row.override_approved)) return 'Major Conflict'; if (results.some((row) => row.conflict_status === 'Warning')) return 'Warning'; if (results.some((row) => row.conflict_status === 'Override Approved')) return 'Override Approved'; return 'No Conflict'; }
  private applyScope(query: any, scope: Scope, column = 'site_id') { if (scope.corporateView) return query; if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId); if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds); return query; }
  private assertSiteAccess(scope: Scope, siteId: string) { if (!siteId) throw new BadRequestException('Site is required.'); if (scope.corporateView) return siteId; if (scope.selectedSiteId && scope.selectedSiteId !== siteId) throw new ForbiddenException('Selected site is outside your active site scope.'); if (scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('Site is outside your permitted scope.'); return siteId; }
  private selectedSite(scope: Scope) { return scope.selectedSiteId ?? scope.allowedSiteIds?.[0] ?? null; }
  private safeSortColumn(column: string) { return new Set(['updated_at', 'created_at', 'classification_title', 'classification_record_number', 'classification_system', 'classification_status', 'review_status', 'conflict_status', 'completeness_status', 'next_review_due']).has(column) ? column : 'updated_at'; }
  private requireText(value: unknown, message: string) { const text = String(value ?? '').trim(); if (!text) throw new BadRequestException(message); return text; }
  private requireRow<T>(row: T | null | undefined, message: string): T { if (!row) throw new BadRequestException(message); return row; }
  private async safeSingle<T>(query: PromiseLike<any>) { try { return await this.db.single<T>(query); } catch { return null; } }
  private async safeMany<T>(query: PromiseLike<any>) { try { return await this.db.many<T>(query); } catch { return []; } }
  private dateOrNull(value: unknown) { if (!value) return null; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? null : date.toISOString(); }
  private camel(value: string) { return value.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }
  private clean<T extends Row>(value: T): T { return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T; }

  private async writeHistory(tenantId: string, actorId: string, action: string, classification: Row, before: any, after: any, title: string, description?: string | null) {
    await this.audit.write({ tenantId, actorId, action, entityType: 'PSI_ELECTRICAL_CLASSIFICATION', entityId: classification.id, before: before as JsonValue, after: after as JsonValue }).catch(() => null);
    await this.db.single(this.db.from('psi_electrical_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: classification.site_id, unit_id: classification.unit_id ?? null, area_id: classification.area_id ?? null, classification_id: classification.id, event_type: action, event_title: title, event_description: description ?? null, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId, source_record_id: classification.id }).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('psi_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: classification.site_id, unit_id: classification.unit_id ?? null, event_type: action, event_title: title, event_description: description ?? null, source_module: 'PSI Electrical Classification', source_record_id: classification.id, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId }).select('id').single()).catch(() => null);
  }
}
