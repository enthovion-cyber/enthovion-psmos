import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type Row = Record<string, any>;

export const materialFamilies = ['Carbon steel', 'Low alloy steel', 'Stainless steel', 'Duplex stainless steel', 'Super duplex stainless steel', 'Nickel alloy', 'Titanium', 'Aluminum', 'Copper alloy', 'Cast iron', 'Plastic / polymer', 'FRP / GRP', 'PTFE', 'PFA', 'PVC', 'CPVC', 'HDPE', 'PP', 'EPDM', 'FKM / Viton', 'NBR', 'FFKM', 'Graphite', 'Ceramic', 'Glass-lined steel', 'Rubber-lined steel', 'Concrete', 'Other'];
export const componentTypes = ['Vessel shell', 'Vessel internals', 'Piping', 'Valve body', 'Valve trim', 'Pump casing', 'Pump seal', 'Compressor seal', 'Heat exchanger shell', 'Heat exchanger tubes', 'Reactor lining', 'Tank shell', 'Gasket', 'O-ring', 'Hose', 'Coating', 'Lining', 'Instrument wetted parts', 'Relief device wetted parts', 'Other'];
export const compatibilityScopes = ['Chemical to equipment material', 'Chemical to piping material', 'Chemical to gasket/seal', 'Chemical to elastomer', 'Chemical to lining/coating', 'Chemical to valve/trim', 'Chemical to pump/compressor seal', 'Chemical to storage tank material', 'Chemical to hose/flexible connection', 'Chemical to instrument wetted parts', 'Mixed chemical compatibility', 'Cleaning/flushing chemical compatibility', 'Temporary chemical/service compatibility', 'Other'];
export const compatibilityRatings = ['Compatible', 'Compatible With Conditions', 'Limited Compatibility', 'Not Recommended', 'Incompatible', 'Unknown / Needs Data', 'Needs Engineering Review', 'Temporary Use Only', 'Approved Exception'];
export const ratingConfidence = ['High', 'Medium', 'Low', 'Unknown'];
export const compatibilityBasis = ['Vendor data', 'Material compatibility chart', 'SDS data', 'Chemical Database', 'Plant experience', 'Lab test', 'Corrosion study', 'Process licensor', 'Engineering judgment', 'Incident history', 'External standard', 'Other'];
export const degradationMechanisms = ['General corrosion', 'Localized corrosion', 'Pitting corrosion', 'Crevice corrosion', 'Stress corrosion cracking', 'Chloride SCC', 'Caustic cracking', 'Sulfide stress cracking', 'Hydrogen embrittlement', 'Hydrogen attack', 'High temperature corrosion', 'Oxidation', 'Sulfidation', 'Carburization', 'Nitridation', 'Erosion-corrosion', 'Cavitation damage', 'Galvanic corrosion', 'Microbiologically influenced corrosion', 'Dezincification', 'Graphitic corrosion', 'Polymer swelling', 'Elastomer swelling', 'Elastomer hardening', 'Seal degradation', 'Coating blistering', 'Lining failure', 'Permeation', 'Leaching', 'Softening', 'Brittle fracture concern', 'Thermal degradation', 'UV/weathering', 'Dust/solids abrasion', 'Unknown mechanism', 'Other'];
export const exposureTypes = ['Continuous', 'Intermittent', 'Batch', 'Temporary', 'Cleaning/flushing', 'Spill/emergency', 'Vapor exposure', 'Immersion', 'Splash/contact', 'Dry service', 'Wet service'];
export const compatibilityDocumentTypes = ['Material compatibility chart', 'Vendor compatibility data', 'SDS', 'Chemical Database reference', 'Corrosion study', 'Metallurgy report', 'Materials selection report', 'Lab test report', 'Coupon/probe report', 'Inspection report', 'Failure analysis report', 'Incident investigation', 'Equipment datasheet', 'Material certificate', 'Coating/lining certificate', 'Gasket/seal datasheet', 'Process licensor document', 'Engineering calculation', 'MOC package', 'PSSR package', 'Standard/code reference', 'Technical note'];
export const materialConflictStatuses = ['No Conflict', 'Warning', 'Major Conflict', 'Critical Conflict', 'Override Approved'];
const chemicalRoles = ['Process fluid', 'Feed', 'Product', 'Intermediate', 'Byproduct', 'Waste', 'Solvent', 'Catalyst', 'Inhibitor', 'Cleaning chemical', 'Utility chemical', 'Contaminant', 'Emergency neutralizer', 'Other'];
const riskLevels = ['Low', 'Medium', 'High', 'Critical', 'Unknown'];

@Injectable()
export class PsiMaterialCompatibilityService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async summary(tenantId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    const count = (predicate: (row: Row) => boolean) => rows.filter(predicate).length;
    return {
      totalCompatibilityRecords: rows.length,
      compatibleRecords: count((row) => row.compatibility_rating === 'Compatible'),
      compatibleWithConditions: count((row) => row.compatibility_rating === 'Compatible With Conditions'),
      incompatibleRecords: count((row) => row.compatibility_rating === 'Incompatible'),
      needsEngineeringReview: count((row) => row.compatibility_rating === 'Needs Engineering Review' || row.rating?.engineering_review_required),
      unknownMissingData: count((row) => row.compatibility_rating === 'Unknown / Needs Data'),
      criticalIncompatibilities: count((row) => row.conflict_status === 'Critical Conflict' || row.compatibility_rating === 'Incompatible'),
      equipmentWithCompatibilityGaps: count((row) => row.equipment_id && row.completeness_status !== 'Complete'),
      chemicalsWithCompatibilityGaps: count((row) => row.chemical_id && row.completeness_status !== 'Complete'),
      corrosiveServiceRecords: count((row) => row.serviceConditions?.acid_service || row.serviceConditions?.caustic_service || row.serviceConditions?.h2s_sour_service || row.degradationMechanisms?.some((item: Row) => String(item.mechanism_type).includes('corrosion'))),
      elastomerSealRisks: count((row) => ['Gasket', 'O-ring', 'Pump seal', 'Compressor seal'].includes(row.component_type) || row.materialDetails?.gasket_seal_elastomer_type || row.degradationMechanisms?.some((item: Row) => String(item.mechanism_type).includes('Elastomer'))),
      liningCoatingRisks: count((row) => row.materialDetails?.lining_coating_type || row.degradationMechanisms?.some((item: Row) => String(item.mechanism_type).includes('Coating') || String(item.mechanism_type).includes('Lining'))),
      sccEmbrittlementRisks: count((row) => row.degradationMechanisms?.some((item: Row) => ['Stress corrosion cracking', 'Chloride SCC', 'Hydrogen embrittlement', 'Sulfide stress cracking'].includes(item.mechanism_type))),
      highTemperatureCompatibilityRisks: count((row) => Number(row.serviceConditions?.max_temperature ?? 0) > Number(row.rating?.suitable_temperature_max ?? Number.POSITIVE_INFINITY)),
      concentrationLimitRisks: count((row) => Number(row.serviceConditions?.max_concentration ?? 0) > Number(row.rating?.suitable_concentration_max ?? Number.POSITIVE_INFINITY)),
      phLimitRisks: count((row) => this.phConflict(row.serviceConditions, row.rating)),
      miReadinessImpact: count((row) => row.mi_readiness_impact),
      pssrBlockers: count((row) => row.pssr_blocker),
      mocRequired: count((row) => row.moc_update_required),
      reviewOverdue: count((row) => this.isReviewOverdue(row)),
      pendingApproval: count((row) => ['Submitted', 'Pending Review', 'In Review'].includes(row.review_status)),
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
      savedViews: ['All Compatibility Records', 'Incompatible', 'Compatible With Conditions', 'Needs Review', 'Unknown / Missing Data', 'Critical Conflicts', 'Corrosive Service', 'Elastomer Risks', 'Lining / Coating Risks', 'PSSR Blockers', 'MI Readiness Impact', 'MOC Required', 'Review Overdue', 'My Unit Records'],
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

  async chemicalRegistry(tenantId: string, scope: Scope, chemicalId: string, query: Row = {}) {
    return this.registry(tenantId, scope, { ...query, chemicalId });
  }

  async create(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    this.validateIdentity(dto);
    const unit = await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId));
    const siteId = unit.site_id ?? this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? this.selectedSite(scope) ?? ''));
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_compatibility').insert(this.compatibilityPayload(tenantId, actorId, siteId, unit, dto, { created_at: new Date().toISOString(), updated_at: new Date().toISOString() })).select().single()), 'Unable to create material compatibility record.');
    if (this.hasServiceFields(dto)) await this.upsertServiceConditions(tenantId, actorId, scope, row.id, dto, false);
    if (this.hasMaterialFields(dto)) await this.upsertMaterialDetails(tenantId, actorId, scope, row.id, dto, false);
    if (this.hasRatingFields(dto)) await this.upsertRating(tenantId, actorId, scope, row.id, dto, false);
    if (this.hasControlFields(dto)) await this.upsertControls(tenantId, actorId, scope, row.id, dto, false);
    if (dto.document_id ?? dto.documentId) await this.linkDocument(tenantId, actorId, scope, row.id, dto, false);
    for (const item of Array.isArray(dto.degradationMechanisms) ? dto.degradationMechanisms : []) await this.addDegradationMechanism(tenantId, actorId, scope, row.id, item, false);
    await this.runCompatibilityCheck(tenantId, actorId, scope, row.id);
    await this.runConflictCheck(tenantId, actorId, scope, row.id);
    await this.runCompleteness(tenantId, actorId, scope, row.id);
    await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.created', row, null, row, 'Material compatibility record created', `${row.compatibility_title} created.`);
    return this.detail(tenantId, scope, row.id);
  }

  async update(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, dto: Row, permissions: string[] = []) {
    const before = await this.record(tenantId, scope, compatibilityId);
    if (before.review_status === 'Approved' && !permissions.includes('psi.material_compatibility.approve')) throw new ForbiddenException('Approved compatibility record is read-only unless controlled edit/MOC permission exists.');
    const unit = dto.unit_id ?? dto.unitId ? await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId)) : await this.unitRecord(tenantId, scope, before.unit_id);
    const siteId = unit.site_id ?? this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? before.site_id));
    const safetyKeys = ['chemical_id', 'equipment_id', 'component_type', 'compatibility_scope', 'criticality', 'safety_critical', 'psm_critical', 'compatibility_rating'];
    const safetyChanged = safetyKeys.some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined);
    const payload: Row = this.compatibilityPayload(tenantId, actorId, siteId, unit, { ...before, ...dto }, { updated_at: new Date().toISOString(), moc_update_required: safetyChanged ? true : before.moc_update_required });
    delete payload.created_by;
    delete payload.created_at;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_compatibility').update(payload).eq('company_id', tenantId).eq('id', compatibilityId).select().single()), 'Unable to update material compatibility record.');
    if (this.hasServiceFields(dto)) await this.upsertServiceConditions(tenantId, actorId, scope, compatibilityId, dto, false);
    if (this.hasMaterialFields(dto)) await this.upsertMaterialDetails(tenantId, actorId, scope, compatibilityId, dto, false);
    if (this.hasRatingFields(dto)) await this.upsertRating(tenantId, actorId, scope, compatibilityId, dto, false);
    if (this.hasControlFields(dto)) await this.upsertControls(tenantId, actorId, scope, compatibilityId, dto, false);
    await this.runCompatibilityCheck(tenantId, actorId, scope, compatibilityId);
    await this.runConflictCheck(tenantId, actorId, scope, compatibilityId);
    await this.runCompleteness(tenantId, actorId, scope, compatibilityId);
    await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.updated', row, before, row, 'Material compatibility updated', safetyChanged ? 'Safety-sensitive compatibility change may require MOC.' : 'Material compatibility metadata updated.');
    return this.detail(tenantId, scope, compatibilityId);
  }

  async detail(tenantId: string, scope: Scope, compatibilityId: string) {
    const compatibility = await this.record(tenantId, scope, compatibilityId, true);
    const [unit, serviceConditions, materialDetails, rating, degradation, controls, documents, completeness, conflicts, history] = await Promise.all([
      compatibility.unit_id ? this.unitRecord(tenantId, scope, compatibility.unit_id).catch(() => null) : Promise.resolve(null),
      this.serviceConditions(tenantId, scope, compatibilityId),
      this.materialDetails(tenantId, scope, compatibilityId),
      this.rating(tenantId, scope, compatibilityId),
      this.degradationMechanisms(tenantId, scope, compatibilityId),
      this.controls(tenantId, scope, compatibilityId),
      this.documents(tenantId, scope, compatibilityId),
      this.completeness(tenantId, scope, compatibilityId),
      this.conflicts(tenantId, scope, compatibilityId),
      this.history(tenantId, scope, compatibilityId)
    ]);
    return { compatibility, unit, serviceConditions, materialDetails, rating, degradationMechanisms: degradation, controls, documents, completeness, conflicts, history, overview: this.overview(compatibility, serviceConditions, materialDetails, rating, degradation, controls, documents, completeness, conflicts), tabs: this.tabs(compatibilityId), actions: this.actions(compatibility, rating, degradation, documents, completeness, conflicts) };
  }

  async archive(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, dto: Row) {
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Archive reason is required.');
    const before = await this.record(tenantId, scope, compatibilityId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_compatibility').update({ archived_at: new Date().toISOString(), archived_by: actorId, compatibility_status: 'Archived', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', compatibilityId).select().single()), 'Unable to archive material compatibility record.');
    await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.archived', row, before, row, 'Material compatibility archived', String(dto.reason));
    return row;
  }

  async reactivate(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, dto: Row) {
    const before = await this.record(tenantId, scope, compatibilityId, true);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_compatibility').update({ archived_at: null, archived_by: null, compatibility_status: 'Draft', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', compatibilityId).select().single()), 'Unable to reactivate material compatibility record.');
    await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.reactivated', row, before, row, 'Material compatibility reactivated', dto.reason ?? null);
    return row;
  }

  async clone(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, dto: Row) {
    const source = await this.record(tenantId, scope, compatibilityId);
    return this.create(tenantId, actorId, scope, { ...source, id: randomUUID(), compatibility_title: dto.compatibility_title ?? `${source.compatibility_title} Copy`, review_status: 'Draft', compatibility_status: 'Draft' });
  }

  async serviceConditions(tenantId: string, scope: Scope, compatibilityId: string) {
    await this.record(tenantId, scope, compatibilityId);
    return this.safeSingle<Row>(this.db.from('psi_material_compatibility_service_conditions').select('*').eq('company_id', tenantId).eq('compatibility_id', compatibilityId).maybeSingle());
  }

  async upsertServiceConditions(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, dto: Row, writeEvent = true) {
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const before = await this.serviceConditions(tenantId, scope, compatibilityId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_compatibility_service_conditions').upsert(this.servicePayload(tenantId, compatibility, dto), { onConflict: 'compatibility_id' }).select().single()), 'Unable to save chemical/service conditions.');
    await this.markMocIfChanged(tenantId, actorId, compatibility, before, row, ['chemical_name', 'cas_number', 'max_concentration', 'max_temperature', 'ph_min', 'ph_max', 'temporary_service', 'cleaning_flushing_chemical']);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.service_conditions.updated', compatibility, before, row, 'Chemical / service conditions updated');
    return row;
  }

  async materialDetails(tenantId: string, scope: Scope, compatibilityId: string) {
    await this.record(tenantId, scope, compatibilityId);
    return this.safeSingle<Row>(this.db.from('psi_material_compatibility_material_details').select('*').eq('company_id', tenantId).eq('compatibility_id', compatibilityId).maybeSingle());
  }

  async upsertMaterialDetails(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, dto: Row, writeEvent = true) {
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const before = await this.materialDetails(tenantId, scope, compatibilityId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_compatibility_material_details').upsert(this.materialPayload(tenantId, compatibility, dto), { onConflict: 'compatibility_id' }).select().single()), 'Unable to save material/component details.');
    await this.markMocIfChanged(tenantId, actorId, compatibility, before, row, ['material_family', 'material_grade', 'component_type', 'gasket_seal_elastomer_type', 'lining_coating_type']);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.material_details.updated', compatibility, before, row, 'Material / component details updated');
    return row;
  }

  async rating(tenantId: string, scope: Scope, compatibilityId: string) {
    await this.record(tenantId, scope, compatibilityId);
    return this.safeSingle<Row>(this.db.from('psi_material_compatibility_ratings').select('*').eq('company_id', tenantId).eq('compatibility_id', compatibilityId).maybeSingle());
  }

  async upsertRating(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, dto: Row, writeEvent = true) {
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const before = await this.rating(tenantId, scope, compatibilityId);
    const payload = this.ratingPayload(tenantId, compatibility, dto);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_compatibility_ratings').upsert(payload, { onConflict: 'compatibility_id' }).select().single()), 'Unable to save compatibility rating.');
    await this.db.single(this.db.from('psi_material_compatibility').update({ compatibility_rating: row.compatibility_rating, rating_confidence: row.rating_confidence, moc_update_required: this.ratingNeedsMoc(row) || this.ratingChanged(before, row), pssr_blocker: row.compatibility_rating === 'Incompatible' && compatibility.safety_critical, mi_readiness_impact: this.ratingHasMiImpact(row, compatibility), updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', compatibilityId).select('id').single()).catch(() => null);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.rating.updated', compatibility, before, row, 'Compatibility rating updated');
    return row;
  }

  async degradationMechanisms(tenantId: string, scope: Scope, compatibilityId: string) {
    await this.record(tenantId, scope, compatibilityId);
    return this.safeMany<Row>(this.db.from('psi_material_degradation_mechanisms').select('*').eq('company_id', tenantId).eq('compatibility_id', compatibilityId).order('created_at', { ascending: false }));
  }

  async addDegradationMechanism(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, dto: Row, writeEvent = true) {
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_degradation_mechanisms').insert(this.degradationPayload(tenantId, actorId, compatibility, dto)).select().single()), 'Unable to add degradation mechanism.');
    if (['High', 'Critical'].includes(row.risk_level)) await this.db.single(this.db.from('psi_material_compatibility').update({ mi_readiness_impact: true, pssr_blocker: row.risk_level === 'Critical' && compatibility.safety_critical, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', compatibilityId).select('id').single()).catch(() => null);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.degradation.added', compatibility, null, row, 'Degradation mechanism added', row.mechanism_type);
    return row;
  }

  async updateDegradationMechanism(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, mechanismId: string, dto: Row) {
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const before = await this.degradationRecord(tenantId, compatibilityId, mechanismId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_degradation_mechanisms').update({ ...this.degradationPayload(tenantId, actorId, compatibility, { ...before, ...dto }), id: mechanismId }).eq('company_id', tenantId).eq('compatibility_id', compatibilityId).eq('id', mechanismId).select().single()), 'Unable to update degradation mechanism.');
    await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.degradation.updated', compatibility, before, row, 'Degradation mechanism updated', row.mechanism_type);
    return row;
  }

  async removeDegradationMechanism(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, mechanismId: string, dto: Row) {
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const before = await this.degradationRecord(tenantId, compatibilityId, mechanismId);
    await this.db.single(this.db.from('psi_material_degradation_mechanisms').delete().eq('company_id', tenantId).eq('compatibility_id', compatibilityId).eq('id', mechanismId).select('id').single());
    await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.degradation.removed', compatibility, before, dto, 'Degradation mechanism removed', dto.reason ?? before.mechanism_type);
    return { id: mechanismId, removed: true };
  }

  async controls(tenantId: string, scope: Scope, compatibilityId: string) {
    await this.record(tenantId, scope, compatibilityId);
    return this.safeSingle<Row>(this.db.from('psi_material_compatibility_controls').select('*').eq('company_id', tenantId).eq('compatibility_id', compatibilityId).maybeSingle());
  }

  async upsertControls(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, dto: Row, writeEvent = true) {
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const before = await this.controls(tenantId, scope, compatibilityId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_compatibility_controls').upsert(this.controlsPayload(tenantId, compatibility, dto), { onConflict: 'compatibility_id' }).select().single()), 'Unable to save controls/restrictions.');
    if (row.material_upgrade_required || row.required_action) await this.db.single(this.db.from('psi_material_compatibility').update({ moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', compatibilityId).select('id').single()).catch(() => null);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.controls.updated', compatibility, before, row, 'Controls / restrictions updated');
    return row;
  }

  async documents(tenantId: string, scope: Scope, compatibilityId: string) {
    await this.record(tenantId, scope, compatibilityId);
    return this.safeMany<Row>(this.db.from('psi_material_compatibility_document_links').select('*').eq('company_id', tenantId).eq('compatibility_id', compatibilityId).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async linkDocument(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, dto: Row, writeEvent = true) {
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_compatibility_document_links').insert(this.documentPayload(tenantId, actorId, compatibility, dto)).select().single()), 'Unable to link material compatibility document.');
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.document.linked', compatibility, null, row, 'Evidence document linked', row.document_type);
    return row;
  }

  async unlinkDocument(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, documentLinkId: string, dto: Row) {
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const before = this.requireRow(await this.safeSingle<Row>(this.db.from('psi_material_compatibility_document_links').select('*').eq('company_id', tenantId).eq('compatibility_id', compatibilityId).eq('id', documentLinkId).maybeSingle()), 'Document link not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_compatibility_document_links').update({ removed_by: actorId, removed_at: new Date().toISOString(), remove_reason: dto.reason ?? null }).eq('company_id', tenantId).eq('id', documentLinkId).select().single()), 'Unable to unlink document.');
    await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.document.unlinked', compatibility, before, row, 'Evidence document unlinked', dto.reason ?? row.document_type);
    return row;
  }

  async runCompatibilityCheck(tenantId: string, actorId: string, scope: Scope, compatibilityId: string) {
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const [service, material, rating, controls] = await Promise.all([this.serviceConditions(tenantId, scope, compatibilityId), this.materialDetails(tenantId, scope, compatibilityId), this.rating(tenantId, scope, compatibilityId), this.controls(tenantId, scope, compatibilityId)]);
    const updates: Row = {};
    if (rating?.compatibility_rating) updates.compatibility_rating = rating.compatibility_rating;
    if (rating?.compatibility_rating === 'Incompatible') updates.pssr_blocker = Boolean(compatibility.safety_critical || compatibility.psm_critical);
    if (this.phConflict(service, rating) || this.temperatureConflict(service, rating) || this.concentrationConflict(service, rating)) updates.moc_update_required = true;
    if (controls?.inspection_frequency_requirement || controls?.cml_tml_monitoring_requirement || ['Incompatible', 'Limited Compatibility', 'Not Recommended'].includes(rating?.compatibility_rating)) updates.mi_readiness_impact = true;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_compatibility').update({ ...updates, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', compatibilityId).select().single()), 'Unable to run compatibility check.');
    await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.compatibility_check.run', row, compatibility, { service, material, rating, controls, updates }, 'Material compatibility check run');
    return { compatibility: row, updates, service, material, rating, controls };
  }

  async runCompleteness(tenantId: string, actorId: string, scope: Scope, compatibilityId: string) {
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const [service, material, rating, mechanisms, controls, documents, conflicts] = await Promise.all([this.serviceConditions(tenantId, scope, compatibilityId), this.materialDetails(tenantId, scope, compatibilityId), this.rating(tenantId, scope, compatibilityId), this.degradationMechanisms(tenantId, scope, compatibilityId), this.controls(tenantId, scope, compatibilityId), this.documents(tenantId, scope, compatibilityId), this.conflicts(tenantId, scope, compatibilityId)]);
    const conditional = ['Compatible With Conditions', 'Limited Compatibility', 'Temporary Use Only'].includes(rating?.compatibility_rating);
    const checks = [
      this.check('unit', 'Unit selected', Boolean(compatibility.unit_id), 'Critical', 'Process unit is required.'),
      this.check('chemical_service', 'Chemical/service selected', Boolean(service?.chemical_name || compatibility.chemical_id), 'Critical', 'Chemical or service condition is missing.'),
      this.check('material_component', 'Material/component selected', Boolean(material?.material_family && material?.component_type), 'Critical', 'Material family and component type are required.'),
      this.check('equipment_link', 'Equipment link where equipment-specific', !compatibility.equipment_id || Boolean(compatibility.equipment_id), 'Warning', 'Equipment-specific compatibility should link valid equipment.'),
      this.check('material_grade', 'Material family and grade defined', Boolean(material?.material_family && (material?.material_grade || !compatibility.safety_critical)), compatibility.safety_critical ? 'Critical' : 'Warning', 'Critical service requires material grade or reason unavailable.'),
      this.check('service_conditions', 'Temperature/concentration/pH conditions defined', Boolean(service?.normal_temperature ?? service?.max_temperature ?? service?.normal_concentration ?? service?.ph_normal), 'Warning', 'Operating condition envelope is missing.'),
      this.check('rating', 'Compatibility rating assigned', Boolean(rating?.compatibility_rating && rating.compatibility_rating !== 'Unknown / Needs Data'), rating?.compatibility_rating === 'Unknown / Needs Data' ? 'Critical' : 'Warning', 'Compatibility rating is unknown or missing.'),
      this.check('basis', 'Rating basis defined', Boolean(rating?.compatibility_basis), 'Warning', 'Compatibility basis/reference is required.'),
      this.check('evidence', 'Evidence document linked where required', !compatibility.safety_critical || documents.some((doc) => doc.required || doc.readiness_impact), 'Critical', 'Critical compatibility needs evidence document or approved waiver.'),
      this.check('degradation', 'Degradation mechanisms assessed', !(service?.acid_service || service?.caustic_service || service?.h2s_sour_service || compatibility.safety_critical) || mechanisms.length > 0, 'Warning', 'High-risk/corrosive services require degradation mechanism assessment.'),
      this.check('controls', 'Controls/restrictions defined where conditional', !conditional || Boolean(controls?.operating_restriction || controls?.temperature_restriction || controls?.required_action || rating?.required_operating_restriction), 'Critical', 'Conditional compatibility requires restrictions/conditions.'),
      this.check('owner', 'Owner assigned', Boolean(compatibility.owner_user_id || !compatibility.safety_critical), compatibility.safety_critical ? 'Critical' : 'Warning', 'Critical compatibility requires an owner.'),
      this.check('review_date', 'Review date exists and not overdue', Boolean(compatibility.next_review_due) && !this.isReviewOverdue(compatibility), this.isReviewOverdue(compatibility) ? 'Critical' : 'Warning', 'Next review due date is missing or overdue.'),
      this.check('conflict_check', 'Conflict check completed', Boolean(conflicts.length || compatibility.conflict_status === 'No Conflict'), 'Warning', 'Run conflict validation.'),
      this.check('mi_impact', 'MI impact checked where equipment-specific', !compatibility.equipment_id || compatibility.mi_readiness_impact !== null, 'Warning', 'Equipment-specific MI readiness impact has not been evaluated.'),
      this.check('moc_impact', 'MOC impact checked where changed', compatibility.moc_update_required !== null, 'Warning', 'MOC impact has not been evaluated.')
    ].map((check) => ({ id: randomUUID(), company_id: tenantId, site_id: compatibility.site_id, compatibility_id: compatibility.id, unit_id: compatibility.unit_id, equipment_id: compatibility.equipment_id ?? null, chemical_id: compatibility.chemical_id ?? null, ...check, owner_user_id: compatibility.owner_user_id ?? null, evaluated_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
    await this.db.from('psi_material_compatibility_completeness_evaluations').delete().eq('company_id', tenantId).eq('compatibility_id', compatibilityId);
    await this.db.from('psi_material_compatibility_completeness_evaluations').insert(checks);
    const completeCount = checks.filter((row) => row.status === 'Complete').length;
    const score = Math.round((completeCount / checks.length) * 100);
    const status = checks.some((row) => row.severity === 'Critical' && row.status !== 'Complete') ? 'Critical Gaps' : score === 100 ? 'Complete' : score >= 75 ? 'Mostly Complete' : score > 0 ? 'Incomplete' : 'Not Reviewed';
    const pssr = checks.some((row) => row.pssr_blocker);
    const mi = checks.some((row) => row.mi_readiness_impact) || compatibility.mi_readiness_impact;
    await this.db.single(this.db.from('psi_material_compatibility').update({ completeness_status: status, completeness_score: score, pssr_blocker: pssr || compatibility.pssr_blocker, mi_readiness_impact: mi, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', compatibilityId).select('id').single()).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.completeness.run', compatibility, null, { status, score, checks }, 'Material compatibility completeness evaluated');
    return { status, score, checks };
  }

  async completeness(tenantId: string, scope: Scope, compatibilityId: string) {
    await this.record(tenantId, scope, compatibilityId);
    return this.safeMany<Row>(this.db.from('psi_material_compatibility_completeness_evaluations').select('*').eq('company_id', tenantId).eq('compatibility_id', compatibilityId).order('created_at', { ascending: false }));
  }

  async runConflictCheck(tenantId: string, actorId: string, scope: Scope, compatibilityId: string) {
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const [service, material, rating, mechanisms, controls, documents] = await Promise.all([this.serviceConditions(tenantId, scope, compatibilityId), this.materialDetails(tenantId, scope, compatibilityId), this.rating(tenantId, scope, compatibilityId), this.degradationMechanisms(tenantId, scope, compatibilityId), this.controls(tenantId, scope, compatibilityId), this.documents(tenantId, scope, compatibilityId)]);
    const conflicts: Row[] = [];
    if (rating?.compatibility_rating === 'Incompatible') conflicts.push(this.conflict(tenantId, compatibility, 'Incompatible material/chemical combination', 'Critical Conflict', 'Critical', 'Compatibility rating is Incompatible.', 'Material Compatibility', compatibility.id, rating, { material, service }));
    if (rating?.compatibility_rating === 'Unknown / Needs Data') conflicts.push(this.conflict(tenantId, compatibility, 'Unknown compatibility', 'Major Conflict', 'Major', 'Compatibility is unknown and requires engineering review.', 'Material Compatibility', compatibility.id, rating, { material, service }));
    if (this.temperatureConflict(service, rating)) conflicts.push(this.conflict(tenantId, compatibility, 'Temperature outside compatible range', 'Major Conflict', 'Major', 'Service temperature exceeds compatible temperature range.', 'Safe Operating Limits', null, rating, service));
    if (this.concentrationConflict(service, rating)) conflicts.push(this.conflict(tenantId, compatibility, 'Concentration outside compatible range', 'Major Conflict', 'Major', 'Service concentration exceeds compatible concentration range.', 'Chemicals & SDS', null, rating, service));
    if (this.phConflict(service, rating)) conflicts.push(this.conflict(tenantId, compatibility, 'pH outside compatible range', 'Major Conflict', 'Major', 'Service pH is outside compatible range.', 'Process Chemistry', null, rating, service));
    if (service?.h2s_sour_service && !mechanisms.some((item) => ['Sulfide stress cracking', 'Hydrogen embrittlement'].includes(item.mechanism_type))) conflicts.push(this.conflict(tenantId, compatibility, 'Sour service mechanism review missing', 'Warning', 'Warning', 'H2S/sour service should assess sulfide stress cracking and hydrogen embrittlement.', 'Mechanical Integrity', null, null, service));
    if (service?.chlorides_present && Number(service?.max_temperature ?? 0) > 60 && String(material?.material_family ?? '').includes('Stainless') && !mechanisms.some((item) => item.mechanism_type === 'Chloride SCC')) conflicts.push(this.conflict(tenantId, compatibility, 'Chloride SCC review missing', 'Warning', 'Warning', 'Chloride service at elevated temperature should assess chloride SCC.', 'Mechanical Integrity', null, material, service));
    if (rating?.compatibility_rating === 'Compatible With Conditions' && !(controls?.operating_restriction || controls?.temperature_restriction || rating?.required_operating_restriction)) conflicts.push(this.conflict(tenantId, compatibility, 'Conditional compatibility missing restrictions', 'Major Conflict', 'Major', 'Compatible With Conditions requires documented restrictions.', 'Safe Operating Limits', null, rating, controls));
    if (rating?.compatibility_rating === 'Temporary Use Only' && !compatibility.next_review_due) conflicts.push(this.conflict(tenantId, compatibility, 'Temporary use expiry missing', 'Major Conflict', 'Major', 'Temporary compatibility requires expiry/review due date.', 'MOC', null, rating, compatibility));
    if (compatibility.safety_critical && !documents.some((doc) => doc.required || doc.readiness_impact)) conflicts.push(this.conflict(tenantId, compatibility, 'Critical compatibility evidence missing', 'Major Conflict', 'Major', 'Critical compatibility requires linked evidence document.', 'Document Control', null, null, documents));
    await this.db.from('psi_material_compatibility_conflict_results').delete().eq('company_id', tenantId).eq('compatibility_id', compatibilityId);
    if (conflicts.length) await this.db.from('psi_material_compatibility_conflict_results').insert(conflicts);
    const status = this.worstConflict(conflicts);
    await this.db.single(this.db.from('psi_material_compatibility').update({ conflict_status: status, pssr_blocker: status === 'Critical Conflict' || compatibility.pssr_blocker, mi_readiness_impact: compatibility.mi_readiness_impact || conflicts.some((row) => row.compared_module === 'Mechanical Integrity'), updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', compatibilityId).select('id').single()).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.conflict_check.run', compatibility, null, { status, conflicts }, 'Material compatibility conflict validation run');
    return { status, conflicts };
  }

  async conflicts(tenantId: string, scope: Scope, compatibilityId: string) {
    await this.record(tenantId, scope, compatibilityId);
    return this.safeMany<Row>(this.db.from('psi_material_compatibility_conflict_results').select('*').eq('company_id', tenantId).eq('compatibility_id', compatibilityId).order('created_at', { ascending: false }));
  }

  async overrideConflict(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, conflictId: string, dto: Row) {
    if (!String(dto.reason ?? '').trim()) throw new BadRequestException('Conflict override reason is required.');
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const before = this.requireRow(await this.safeSingle<Row>(this.db.from('psi_material_compatibility_conflict_results').select('*').eq('company_id', tenantId).eq('compatibility_id', compatibilityId).eq('id', conflictId).maybeSingle()), 'Conflict not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_compatibility_conflict_results').update({ conflict_status: 'Override Approved', override_approved: true, override_reason: dto.reason, override_approved_by: actorId, override_approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', conflictId).select().single()), 'Unable to approve conflict override.');
    await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.conflict.override', compatibility, before, row, 'Material compatibility conflict override approved', String(dto.reason));
    return row;
  }

  async submitReview(tenantId: string, actorId: string, scope: Scope, compatibilityId: string, dto: Row) {
    const compatibility = await this.record(tenantId, scope, compatibilityId);
    const [completeness, conflicts] = await Promise.all([this.runCompleteness(tenantId, actorId, scope, compatibilityId), this.runConflictCheck(tenantId, actorId, scope, compatibilityId)]);
    if (conflicts.conflicts.some((row: Row) => row.conflict_status === 'Critical Conflict' && !row.override_approved)) throw new BadRequestException('Critical material compatibility conflicts block review submission.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_material_compatibility').update({ review_status: 'Submitted', compatibility_status: 'Pending Review', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', compatibilityId).select().single()), 'Unable to submit material compatibility review.');
    await this.writeHistory(tenantId, actorId, 'psi.material_compatibility.review.submitted', row, compatibility, { completeness, conflicts }, 'Material compatibility submitted for review', dto.reason ?? null);
    return row;
  }

  async history(tenantId: string, scope: Scope, compatibilityId: string) {
    await this.record(tenantId, scope, compatibilityId, true);
    return this.safeMany<Row>(this.db.from('psi_material_compatibility_history_events').select('*').eq('company_id', tenantId).eq('compatibility_id', compatibilityId).order('created_at', { ascending: false }));
  }

  importTemplate() {
    return { columns: ['unit_code', 'equipment_tag', 'chemical_name', 'cas_number', 'chemical_reference', 'component_type', 'material_family', 'material_grade', 'material_specification', 'normal_concentration', 'max_concentration', 'concentration_unit', 'normal_temperature', 'max_temperature', 'temperature_unit', 'ph_min', 'ph_max', 'exposure_type', 'compatibility_rating', 'rating_confidence', 'compatibility_basis', 'degradation_mechanisms', 'restrictions', 'evidence_document_reference', 'owner_email', 'next_review_due'] };
  }

  async importPreview(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const preview = rows.map((row: Row, index: number) => ({ rowNumber: index + 1, row, errors: this.validateImportRow(row), warnings: this.importWarnings(row) }));
    const job = await this.safeSingle<Row>(this.db.from('psi_material_compatibility_import_jobs').insert({ id: randomUUID(), company_id: tenantId, site_id: this.selectedSite(scope), uploaded_by: actorId, file_name: dto.fileName ?? 'material-compatibility-import', file_key: dto.fileKey ?? null, status: 'Preview', total_rows: rows.length, valid_rows: preview.filter((row) => !row.errors.length).length, error_rows: preview.filter((row) => row.errors.length).length }).select().single());
    return { job, preview };
  }

  async exportRows(tenantId: string, actorId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    await this.audit.write({ tenantId, actorId, action: 'psi.material_compatibility.export', entityType: 'PSI_MATERIAL_COMPATIBILITY', entityId: 'export', after: { count: rows.length } as JsonValue }).catch(() => null);
    return { rows, exportedAt: new Date().toISOString(), format: query.format ?? 'json' };
  }

  lookups() {
    return { materialFamilies, materialGrades: [], componentTypes, compatibilityScopes, compatibilityRatings, ratingConfidence, compatibilityBasis, degradationMechanisms, exposureTypes, compatibilityDocumentTypes, materialConflictStatuses, chemicalRoles, riskLevels };
  }

  private async registryRows(tenantId: string, scope: Scope, query: Row = {}, paginate = false, page = 1, limit = 25) {
    let request: any = this.applyScope(this.db.from('psi_material_compatibility').select('*, psi_material_compatibility_service_conditions(*), psi_material_compatibility_material_details(*), psi_material_compatibility_ratings(*), psi_material_degradation_mechanisms(*), psi_material_compatibility_controls(*), psi_material_compatibility_document_links(*), psi_material_compatibility_conflict_results(*)').eq('company_id', tenantId), scope);
    if (!query.includeArchived) request = request.is('archived_at', null);
    if (query.unitId ?? query.unit_id) request = request.eq('unit_id', query.unitId ?? query.unit_id);
    if (query.equipmentId ?? query.equipment_id) request = request.eq('equipment_id', query.equipmentId ?? query.equipment_id);
    if (query.chemicalId ?? query.chemical_id) request = request.eq('chemical_id', query.chemicalId ?? query.chemical_id);
    if (query.rating) request = request.eq('compatibility_rating', query.rating);
    if (query.mocRequired) request = request.eq('moc_update_required', true);
    if (query.pssrBlockers ?? query.pssrBlocker) request = request.eq('pssr_blocker', true);
    if (query.miReadinessImpact) request = request.eq('mi_readiness_impact', true);
    if (query.reviewOverdue) request = request.lt('next_review_due', new Date().toISOString()).neq('review_status', 'Approved');
    const [sortColumnRaw, directionRaw] = String(query.sort ?? 'updated_at.desc').split('.');
    request = request.order(this.safeSortColumn(sortColumnRaw ?? 'updated_at'), { ascending: directionRaw === 'asc' });
    if (paginate) request = request.range((page - 1) * limit, page * limit - 1);
    const rows = (await this.db.many<Row>(request)).map((row) => this.normalizeRegistryRow(row));
    return rows.filter((row) => {
      const q = String(query.search ?? '').toLowerCase();
      if (q && ![row.compatibility_title, row.serviceConditions?.chemical_name, row.serviceConditions?.cas_number, row.materialDetails?.material_family, row.materialDetails?.material_grade, row.equipment_id, row.chemical_id, row.component_type].some((value) => String(value ?? '').toLowerCase().includes(q))) return false;
      if (query.incompatible && row.compatibility_rating !== 'Incompatible') return false;
      if (query.conflicts && !['Major Conflict', 'Critical Conflict', 'Warning'].includes(row.conflict_status)) return false;
      if (query.missing && row.completeness_status === 'Complete') return false;
      if (query.corrosiveService && !(row.serviceConditions?.acid_service || row.serviceConditions?.caustic_service || row.serviceConditions?.h2s_sour_service)) return false;
      return true;
    });
  }

  private normalizeRegistryRow(row: Row): Row {
    const serviceConditions = row.psi_material_compatibility_service_conditions?.[0] ?? null;
    const materialDetails = row.psi_material_compatibility_material_details?.[0] ?? null;
    const rating = row.psi_material_compatibility_ratings?.[0] ?? null;
    const degradationMechanisms = row.psi_material_degradation_mechanisms ?? [];
    const controls = row.psi_material_compatibility_controls?.[0] ?? null;
    const documents = (row.psi_material_compatibility_document_links ?? []).filter((doc: Row) => !doc.removed_at);
    const conflicts = row.psi_material_compatibility_conflict_results ?? [];
    return { ...row, serviceConditions, materialDetails, rating, degradationMechanisms, controls, documents, conflicts, chemical_name: serviceConditions?.chemical_name ?? null, cas_number: serviceConditions?.cas_number ?? null, material_family: materialDetails?.material_family ?? null, material_grade: materialDetails?.material_grade ?? null, degradation_mechanism_summary: degradationMechanisms.map((item: Row) => item.mechanism_type).join(', '), evidence_status: documents.length ? 'Linked' : 'Missing' };
  }

  private async record(tenantId: string, scope: Scope, compatibilityId: string, includeArchived = false) {
    let request: any = this.applyScope(this.db.from('psi_material_compatibility').select('*').eq('company_id', tenantId).eq('id', compatibilityId), scope);
    if (!includeArchived) request = request.is('archived_at', null);
    const row = await this.safeSingle<Row>(request.maybeSingle());
    if (!row) throw new BadRequestException('Material compatibility record not found or not accessible.');
    return row;
  }

  private async degradationRecord(tenantId: string, compatibilityId: string, mechanismId: string) {
    return this.requireRow(await this.safeSingle<Row>(this.db.from('psi_material_degradation_mechanisms').select('*').eq('company_id', tenantId).eq('compatibility_id', compatibilityId).eq('id', mechanismId).maybeSingle()), 'Degradation mechanism not found.');
  }

  private async unitRecord(tenantId: string, scope: Scope, unitId: string) {
    const row = await this.safeSingle<Row>(this.applyScope(this.db.from('psi_units').select('*').eq('company_id', tenantId).eq('id', unitId), scope).maybeSingle());
    if (!row) throw new BadRequestException('Process unit is required and must be inside your company/site scope.');
    return row;
  }

  private compatibilityPayload(tenantId: string, actorId: string, siteId: string, unit: Row, dto: Row, extra: Row = {}) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: siteId, unit_id: dto.unit_id ?? dto.unitId ?? unit.id, area_id: dto.area_id ?? dto.areaId ?? null, equipment_id: dto.equipment_id ?? dto.equipmentId ?? null, chemical_id: dto.chemical_id ?? dto.chemicalId ?? null, compatibility_title: dto.compatibility_title ?? dto.compatibilityTitle, component_type: dto.component_type ?? dto.componentType, system_service: dto.system_service ?? dto.systemService ?? null, compatibility_scope: dto.compatibility_scope ?? dto.compatibilityScope ?? 'Chemical to equipment material', criticality: dto.criticality ?? 'Medium', safety_critical: Boolean(dto.safety_critical ?? dto.safetyCritical), psm_critical: Boolean(dto.psm_critical ?? dto.psmCritical), compatibility_status: dto.compatibility_status ?? dto.compatibilityStatus ?? 'Draft', compatibility_rating: dto.compatibility_rating ?? dto.compatibilityRating ?? 'Unknown / Needs Data', rating_confidence: dto.rating_confidence ?? dto.ratingConfidence ?? null, completeness_status: dto.completeness_status ?? 'Not Reviewed', conflict_status: dto.conflict_status ?? 'Not Checked', review_status: dto.review_status ?? 'Draft', moc_update_required: Boolean(dto.moc_update_required ?? dto.mocUpdateRequired), pssr_blocker: Boolean(dto.pssr_blocker ?? dto.pssrBlocker), mi_readiness_impact: Boolean(dto.mi_readiness_impact ?? dto.miReadinessImpact), owner_user_id: dto.owner_user_id ?? dto.ownerUserId ?? null, process_engineer_id: dto.process_engineer_id ?? dto.processEngineerId ?? null, materials_engineer_id: dto.materials_engineer_id ?? dto.materialsEngineerId ?? null, mechanical_mi_engineer_id: dto.mechanical_mi_engineer_id ?? dto.mechanicalMiEngineerId ?? null, operations_owner_id: dto.operations_owner_id ?? dto.operationsOwnerId ?? null, hse_reviewer_id: dto.hse_reviewer_id ?? dto.hseReviewerId ?? null, last_review_date: this.dateOrNull(dto.last_review_date ?? dto.lastReviewDate), next_review_due: this.dateOrNull(dto.next_review_due ?? dto.nextReviewDue), notes: dto.notes ?? null, created_by: dto.created_by ?? actorId, updated_by: actorId, ...extra });
  }

  private servicePayload(tenantId: string, compatibility: Row, dto: Row) {
    return this.clean({ id: dto.service_condition_id ?? dto.serviceConditionId ?? randomUUID(), company_id: tenantId, site_id: compatibility.site_id, compatibility_id: compatibility.id, chemical_name: dto.chemical_name ?? dto.chemicalName ?? 'Unspecified service', cas_number: dto.cas_number ?? dto.casNumber ?? null, is_mixture: Boolean(dto.is_mixture ?? dto.isMixture), mixture_composition_summary: dto.mixture_composition_summary ?? dto.mixtureCompositionSummary ?? null, chemical_role: dto.chemical_role ?? dto.chemicalRole ?? null, service_type: dto.service_type ?? dto.serviceType ?? dto.system_service ?? null, normal_concentration: dto.normal_concentration ?? dto.normalConcentration ?? null, min_concentration: dto.min_concentration ?? dto.concentration_min ?? dto.minConcentration ?? null, max_concentration: dto.max_concentration ?? dto.concentration_max ?? dto.maxConcentration ?? null, concentration_unit: dto.concentration_unit ?? dto.concentrationUnit ?? null, normal_temperature: dto.normal_temperature ?? dto.normalTemperature ?? null, min_temperature: dto.min_temperature ?? dto.temperature_min ?? dto.minTemperature ?? null, max_temperature: dto.max_temperature ?? dto.temperature_max ?? dto.maxTemperature ?? null, temperature_unit: dto.temperature_unit ?? dto.temperatureUnit ?? null, normal_pressure: dto.normal_pressure ?? dto.normalPressure ?? null, min_pressure: dto.min_pressure ?? dto.pressure_min ?? dto.minPressure ?? null, max_pressure: dto.max_pressure ?? dto.pressure_max ?? dto.maxPressure ?? null, pressure_unit: dto.pressure_unit ?? dto.pressureUnit ?? null, ph_normal: dto.ph_normal ?? dto.phNormal ?? null, ph_min: dto.ph_min ?? dto.phMin ?? null, ph_max: dto.ph_max ?? dto.phMax ?? null, exposure_type: dto.exposure_type ?? dto.exposureType ?? null, exposure_duration: dto.exposure_duration ?? dto.exposureDuration ?? null, flow_condition: dto.flow_condition ?? dto.flowCondition ?? null, velocity: dto.velocity ?? null, solids_slurry_present: Boolean(dto.solids_slurry_present ?? dto.solidsSlurryPresent), water_moisture_present: Boolean(dto.water_moisture_present ?? dto.water_present ?? dto.waterMoisturePresent), oxygen_air_present: Boolean(dto.oxygen_air_present ?? dto.oxygen_present ?? dto.oxygenAirPresent), chlorides_present: Boolean(dto.chlorides_present ?? dto.chloride_present ?? dto.chloridesPresent), h2s_sour_service: Boolean(dto.h2s_sour_service ?? dto.h2sSourService), co2_service: Boolean(dto.co2_service ?? dto.co2Service), caustic_service: Boolean(dto.caustic_service ?? dto.causticService), acid_service: Boolean(dto.acid_service ?? dto.acidService), oxidizer_service: Boolean(dto.oxidizer_service ?? dto.oxidizerService), cleaning_flushing_chemical: Boolean(dto.cleaning_flushing_chemical ?? dto.cleaning_flushing_service ?? dto.cleaningFlushingChemical), temporary_service: Boolean(dto.temporary_service ?? dto.temporaryService), abnormal_emergency_service: Boolean(dto.abnormal_emergency_service ?? dto.abnormalEmergencyService), notes: dto.service_notes ?? dto.upset_conditions ?? dto.serviceNotes ?? dto.notes ?? null, updated_at: new Date().toISOString() });
  }

  private materialPayload(tenantId: string, compatibility: Row, dto: Row) {
    return this.clean({ id: dto.material_detail_id ?? dto.materialDetailId ?? randomUUID(), company_id: tenantId, site_id: compatibility.site_id, compatibility_id: compatibility.id, material_family: dto.material_family ?? dto.materialFamily ?? 'Other', material_grade: dto.material_grade ?? dto.materialGrade ?? null, material_specification: dto.material_specification ?? dto.material_standard ?? dto.materialSpecification ?? null, material_code: dto.material_code ?? dto.materialCode ?? null, material_source: dto.material_source ?? dto.materialSource ?? null, equipment_design_basis_id: dto.equipment_design_basis_id ?? dto.design_basis_reference ?? dto.equipmentDesignBasisId ?? null, mi_technical_data_id: dto.mi_technical_data_id ?? dto.mi_inspection_reference ?? dto.miTechnicalDataId ?? null, component_type: dto.component_type ?? dto.componentType ?? compatibility.component_type, component_description: dto.component_description ?? dto.component_tag ?? dto.componentDescription ?? null, wetted_part: Boolean(dto.wetted_part ?? dto.wettedPart ?? true), gasket_seal_elastomer_type: dto.gasket_seal_elastomer_type ?? dto.gasket_material ?? dto.seal_material ?? dto.elastomer_material ?? dto.gasketSealElastomerType ?? null, lining_coating_type: dto.lining_coating_type ?? dto.lining_coating ?? dto.liningCoatingType ?? null, coating_thickness: dto.coating_thickness ?? dto.coatingThickness ?? null, lining_thickness: dto.lining_thickness ?? dto.liningThickness ?? null, material_thickness: dto.material_thickness ?? dto.minimum_thickness ?? dto.materialThickness ?? null, corrosion_allowance: dto.corrosion_allowance ?? dto.corrosionAllowance ?? null, heat_treatment_condition: dto.heat_treatment_condition ?? dto.heatTreatmentCondition ?? null, surface_finish: dto.surface_finish ?? dto.surfaceFinish ?? null, weld_material_filler: dto.weld_material_filler ?? dto.weldMaterialFiller ?? null, cladding_overlay: dto.cladding_overlay ?? dto.claddingOverlay ?? null, manufacturer_vendor: dto.manufacturer_vendor ?? dto.manufacturerVendor ?? null, certificate_document_id: dto.certificate_document_id ?? dto.certificateDocumentId ?? null, notes: dto.material_notes ?? dto.wetted_part_description ?? dto.materialNotes ?? dto.notes ?? null, updated_at: new Date().toISOString() });
  }

  private ratingPayload(tenantId: string, compatibility: Row, dto: Row) {
    return this.clean({ id: dto.rating_id ?? dto.ratingId ?? randomUUID(), company_id: tenantId, site_id: compatibility.site_id, compatibility_id: compatibility.id, compatibility_rating: dto.compatibility_rating ?? dto.compatibilityRating ?? compatibility.compatibility_rating ?? 'Unknown / Needs Data', rating_confidence: dto.rating_confidence ?? dto.ratingConfidence ?? 'Unknown', compatibility_basis: dto.compatibility_basis ?? dto.rating_basis ?? dto.compatibilityBasis ?? 'Engineering judgment', suitable_temperature_min: dto.suitable_temperature_min ?? dto.temperature_min ?? dto.suitableTemperatureMin ?? null, suitable_temperature_max: dto.suitable_temperature_max ?? dto.temperature_max ?? dto.suitableTemperatureMax ?? null, suitable_temperature_unit: dto.suitable_temperature_unit ?? dto.temperature_unit ?? dto.suitableTemperatureUnit ?? null, suitable_concentration_min: dto.suitable_concentration_min ?? dto.concentration_min ?? dto.suitableConcentrationMin ?? null, suitable_concentration_max: dto.suitable_concentration_max ?? dto.concentration_max ?? dto.suitableConcentrationMax ?? null, suitable_concentration_unit: dto.suitable_concentration_unit ?? dto.concentration_unit ?? dto.suitableConcentrationUnit ?? null, suitable_ph_min: dto.suitable_ph_min ?? dto.ph_min ?? dto.suitablePhMin ?? null, suitable_ph_max: dto.suitable_ph_max ?? dto.ph_max ?? dto.suitablePhMax ?? null, suitable_pressure_min: dto.suitable_pressure_min ?? dto.pressure_min ?? dto.suitablePressureMin ?? null, suitable_pressure_max: dto.suitable_pressure_max ?? dto.pressure_max ?? dto.suitablePressureMax ?? null, suitable_pressure_unit: dto.suitable_pressure_unit ?? dto.pressure_unit ?? dto.suitablePressureUnit ?? null, maximum_velocity: dto.maximum_velocity ?? dto.maximumVelocity ?? null, exposure_duration_limitation: dto.exposure_duration_limitation ?? dto.allowed_duration ?? dto.exposureDurationLimitation ?? null, required_inhibitor: dto.required_inhibitor ?? dto.requiredInhibitor ?? null, required_lining_coating: dto.required_lining_coating ?? dto.requiredLiningCoating ?? null, required_inspection_frequency: dto.required_inspection_frequency ?? dto.requiredInspectionFrequency ?? null, required_operating_restriction: dto.required_operating_restriction ?? dto.conditions_for_use ?? dto.requiredOperatingRestriction ?? null, engineering_review_required: Boolean(dto.engineering_review_required ?? dto.engineeringReviewRequired), approved_exception: Boolean(dto.approved_exception ?? dto.exception_approved ?? dto.approvedException), exception_reason: dto.exception_reason ?? dto.basis_reference ?? dto.exceptionReason ?? null, notes: dto.rating_notes ?? dto.ratingNotes ?? dto.notes ?? null, updated_at: new Date().toISOString() });
  }

  private degradationPayload(tenantId: string, actorId: string, compatibility: Row, dto: Row) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: compatibility.site_id, compatibility_id: compatibility.id, mechanism_type: dto.mechanism_type ?? dto.mechanismType ?? 'Unknown mechanism', risk_level: dto.risk_level ?? dto.riskLevel ?? 'Unknown', trigger_conditions: dto.trigger_conditions ?? dto.triggerConditions ?? null, affected_component: dto.affected_component ?? dto.affectedComponent ?? null, expected_damage_mode: dto.expected_damage_mode ?? dto.expectedDamageMode ?? null, consequence: dto.consequence ?? null, detection_method: dto.detection_method ?? dto.detectionMethod ?? null, monitoring_requirement: dto.monitoring_requirement ?? dto.monitoringRequirement ?? null, inspection_requirement: dto.inspection_requirement ?? dto.inspectionRequirement ?? null, mitigation: dto.mitigation ?? null, related_mi_damage_mechanism_id: dto.related_mi_damage_mechanism_id ?? dto.relatedMiDamageMechanismId ?? null, related_cml_tml_foundation: dto.related_cml_tml_foundation ?? dto.relatedCmlTmlFoundation ?? null, notes: dto.notes ?? null, created_by: dto.created_by ?? actorId, updated_by: actorId, updated_at: new Date().toISOString() });
  }

  private controlsPayload(tenantId: string, compatibility: Row, dto: Row) {
    return this.clean({ id: dto.controls_id ?? dto.controlsId ?? randomUUID(), company_id: tenantId, site_id: compatibility.site_id, compatibility_id: compatibility.id, operating_restriction: dto.operating_restriction ?? dto.operating_restrictions ?? dto.operatingRestriction ?? null, temperature_restriction: dto.temperature_restriction ?? dto.max_temperature_allowed ?? dto.temperatureRestriction ?? null, concentration_restriction: dto.concentration_restriction ?? dto.max_concentration_allowed ?? dto.concentrationRestriction ?? null, ph_restriction: dto.ph_restriction ?? dto.ph_range_allowed ?? dto.phRestriction ?? null, pressure_restriction: dto.pressure_restriction ?? dto.pressureRestriction ?? null, exposure_duration_restriction: dto.exposure_duration_restriction ?? dto.exposureDurationRestriction ?? null, inhibitor_requirement: dto.inhibitor_requirement ?? dto.inhibitorRequirement ?? null, coating_lining_requirement: dto.coating_lining_requirement ?? dto.coatingLiningRequirement ?? null, material_upgrade_required: Boolean(dto.material_upgrade_required ?? dto.materialUpgradeRequired), inspection_frequency_requirement: dto.inspection_frequency_requirement ?? dto.required_inspection_control ?? dto.inspectionFrequencyRequirement ?? null, cml_tml_monitoring_requirement: dto.cml_tml_monitoring_requirement ?? dto.cmlTmlMonitoringRequirement ?? null, corrosion_coupon_probe_requirement: dto.corrosion_coupon_probe_requirement ?? dto.corrosionCouponProbeRequirement ?? null, sampling_analysis_requirement: dto.sampling_analysis_requirement ?? dto.samplingAnalysisRequirement ?? null, cleaning_flushing_control: dto.cleaning_flushing_control ?? dto.cleaningFlushingControl ?? null, storage_segregation_requirement: dto.storage_segregation_requirement ?? dto.storageSegregationRequirement ?? null, ptw_restriction: dto.ptw_restriction ?? dto.ptwRestriction ?? null, ppe_note: dto.ppe_note ?? dto.ppeNote ?? null, emergency_response_note: dto.emergency_response_note ?? dto.emergencyResponseNote ?? null, training_requirement_foundation: dto.training_requirement_foundation ?? dto.trainingRequirementFoundation ?? null, required_action: dto.required_action ?? dto.requiredAction ?? null, notes: dto.control_notes ?? dto.alternate_material ?? dto.restriction_basis ?? dto.controlNotes ?? dto.notes ?? null, updated_at: new Date().toISOString() });
  }

  private documentPayload(tenantId: string, actorId: string, compatibility: Row, dto: Row) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: compatibility.site_id, compatibility_id: compatibility.id, document_id: dto.document_id ?? dto.documentId, document_type: dto.document_type ?? dto.documentType ?? 'Material compatibility chart', relationship_type: dto.relationship_type ?? dto.relationshipType ?? 'Evidence', required: Boolean(dto.required ?? dto.required_evidence), readiness_impact: Boolean(dto.readiness_impact ?? dto.required_evidence ?? dto.readinessImpact), document_number: dto.document_number ?? dto.documentNumber ?? null, document_title: dto.document_title ?? dto.documentTitle ?? null, document_status: dto.document_status ?? dto.documentStatus ?? null, revision_number: dto.revision_number ?? dto.document_revision ?? dto.revisionNumber ?? null, linked_by: actorId, linked_at: new Date().toISOString() });
  }

  private validateIdentity(dto: Row) {
    this.requireText(dto.compatibility_title ?? dto.compatibilityTitle, 'Compatibility record title is required.');
    this.requireText(dto.unit_id ?? dto.unitId, 'Process unit is required.');
    this.requireText(dto.component_type ?? dto.componentType, 'Component type is required.');
    this.requireText(dto.compatibility_scope ?? dto.compatibilityScope, 'Compatibility scope is required.');
    if ((dto.safety_critical ?? dto.safetyCritical ?? dto.criticality === 'Critical') && !(dto.owner_user_id ?? dto.ownerUserId)) throw new BadRequestException('Critical compatibility record requires an owner.');
  }

  private validateImportRow(row: Row) {
    const errors: string[] = [];
    if (!row.unit_code && !row.unit_id) errors.push('unit_code or unit_id is required');
    if (!row.chemical_name) errors.push('chemical_name is required');
    if (!row.component_type) errors.push('component_type is required');
    if (!row.material_family) errors.push('material_family is required');
    if (!row.compatibility_rating || !compatibilityRatings.includes(String(row.compatibility_rating))) errors.push('compatibility_rating is invalid');
    return errors;
  }

  private importWarnings(row: Row) {
    const warnings: string[] = [];
    if (['Unknown / Needs Data', 'Needs Engineering Review'].includes(row.compatibility_rating)) warnings.push('Unknown/needs review rating creates completeness gap.');
    if (row.compatibility_rating === 'Incompatible') warnings.push('Incompatible rating creates critical conflict.');
    if (!row.evidence_document_reference) warnings.push('Evidence document reference is missing.');
    return warnings;
  }

  private hasServiceFields(dto: Row) { return ['chemical_name', 'cas_number', 'normal_concentration', 'max_concentration', 'normal_temperature', 'max_temperature', 'ph_normal', 'ph_min', 'ph_max', 'exposure_type'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private hasMaterialFields(dto: Row) { return ['material_family', 'material_grade', 'material_specification', 'component_type', 'gasket_seal_elastomer_type', 'lining_coating_type'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private hasRatingFields(dto: Row) { return ['compatibility_rating', 'rating_confidence', 'compatibility_basis', 'suitable_temperature_max', 'suitable_concentration_max', 'suitable_ph_min', 'suitable_ph_max'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private hasControlFields(dto: Row) { return ['operating_restriction', 'temperature_restriction', 'concentration_restriction', 'ph_restriction', 'material_upgrade_required', 'required_action'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private ratingNeedsMoc(row: Row) { return ['Incompatible', 'Not Recommended', 'Limited Compatibility', 'Temporary Use Only', 'Compatible With Conditions'].includes(row.compatibility_rating); }
  private ratingChanged(before: Row | null, after: Row) { return Boolean(before && before.compatibility_rating !== after.compatibility_rating); }
  private ratingHasMiImpact(row: Row, compatibility: Row) { return compatibility.equipment_id && ['Incompatible', 'Not Recommended', 'Limited Compatibility'].includes(row.compatibility_rating); }
  private temperatureConflict(service: Row | null, rating: Row | null) { return service?.max_temperature != null && rating?.suitable_temperature_max != null && Number(service.max_temperature) > Number(rating.suitable_temperature_max); }
  private concentrationConflict(service: Row | null, rating: Row | null) { return service?.max_concentration != null && rating?.suitable_concentration_max != null && Number(service.max_concentration) > Number(rating.suitable_concentration_max); }
  private phConflict(service: Row | null, rating: Row | null) { return (service?.ph_min != null && rating?.suitable_ph_min != null && Number(service.ph_min) < Number(rating.suitable_ph_min)) || (service?.ph_max != null && rating?.suitable_ph_max != null && Number(service.ph_max) > Number(rating.suitable_ph_max)); }

  private async markMocIfChanged(tenantId: string, actorId: string, compatibility: Row, before: Row | null, after: Row, keys: string[]) {
    if (!before) return;
    const changed = keys.some((key) => String(before[key] ?? '') !== String(after[key] ?? ''));
    if (changed) await this.db.single(this.db.from('psi_material_compatibility').update({ moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', compatibility.id).select('id').single()).catch(() => null);
  }

  private conflict(tenantId: string, compatibility: Row, type: string, status: string, severity: string, message: string, comparedModule?: string | null, comparedRecordId?: string | null, comparedValue?: Row | null, currentValue?: Row | null) {
    return { id: randomUUID(), company_id: tenantId, site_id: compatibility.site_id, compatibility_id: compatibility.id, equipment_id: compatibility.equipment_id ?? null, chemical_id: compatibility.chemical_id ?? null, conflict_type: type, conflict_status: status, severity, message, compared_module: comparedModule ?? null, compared_record_id: comparedRecordId ?? null, compared_value_json: comparedValue ?? null, current_value_json: currentValue ?? null, override_required: status === 'Critical Conflict', override_approved: false };
  }

  private check(key: string, title: string, ok: boolean, severity: string, message: string) {
    return { check_key: key, check_title: title, status: ok ? 'Complete' : severity === 'Critical' ? 'Critical Gaps' : 'Incomplete', severity, message: ok ? null : message, missing_reason: ok ? null : message, pssr_blocker: severity === 'Critical' && !ok, mi_readiness_impact: key.includes('mi') && !ok, action_required: !ok };
  }

  private overview(compatibility: Row, service: Row | null, material: Row | null, rating: Row | null, degradation: Row[], controls: Row | null, documents: Row[], completeness: Row[], conflicts: Row[]) {
    return {
      cards: [
        { label: 'Chemical / Service', value: service?.chemical_name ?? compatibility.chemical_id ?? 'Missing', tone: service?.chemical_name || compatibility.chemical_id ? 'neutral' : 'danger' },
        { label: 'Material / Component', value: `${material?.material_family ?? 'Missing'} / ${compatibility.component_type}`, tone: material?.material_family ? 'neutral' : 'danger' },
        { label: 'Equipment / Unit', value: compatibility.equipment_id ?? compatibility.unit_id },
        { label: 'Compatibility Rating', value: rating?.compatibility_rating ?? compatibility.compatibility_rating },
        { label: 'Risk Level', value: degradation.some((item) => item.risk_level === 'Critical') ? 'Critical' : degradation.some((item) => item.risk_level === 'High') ? 'High' : compatibility.criticality },
        { label: 'Criticality', value: compatibility.criticality },
        { label: 'Degradation Mechanisms', value: degradation.length },
        { label: 'Restrictions Count', value: controls ? Object.values(controls).filter(Boolean).length : 0 },
        { label: 'Evidence Status', value: documents.length ? 'Linked' : 'Missing', tone: documents.length ? 'good' : 'danger' },
        { label: 'Conflict Status', value: compatibility.conflict_status },
        { label: 'Review Status', value: compatibility.review_status },
        { label: 'MOC Required', value: compatibility.moc_update_required ? 'Yes' : 'No', tone: compatibility.moc_update_required ? 'warn' : 'good' },
        { label: 'PSSR Blocker', value: compatibility.pssr_blocker ? 'Yes' : 'No', tone: compatibility.pssr_blocker ? 'danger' : 'good' },
        { label: 'MI Readiness Impact', value: compatibility.mi_readiness_impact ? 'Yes' : 'No', tone: compatibility.mi_readiness_impact ? 'warn' : 'good' },
        { label: 'PSI Completeness Impact', value: completeness.filter((row) => row.status !== 'Complete').length ? 'Open gaps' : 'No gaps' }
      ],
      blockers: [...completeness.filter((row) => row.status !== 'Complete'), ...conflicts.filter((row) => row.conflict_status !== 'No Conflict')]
    };
  }

  private tabs(compatibilityId: string) {
    return ['Overview', 'Chemical / Service Conditions', 'Material / Component Details', 'Compatibility Rating', 'Degradation Mechanisms', 'Controls / Restrictions', 'Evidence / Documents', 'Completeness / Conflicts', 'Linked Records', 'Review & Approval', 'Change History'].map((label) => ({ label, href: `/process-safety-information/material-compatibility/${compatibilityId}`, enabled: true }));
  }

  private actions(compatibility: Row, rating: Row | null, degradation: Row[], documents: Row[], completeness: Row[], conflicts: Row[]) {
    const criticalConflict = conflicts.some((item) => item.conflict_status === 'Critical Conflict' && !item.override_approved);
    const missingDoc = compatibility.safety_critical && !documents.length;
    const incomplete = completeness.some((item) => item.status !== 'Complete');
    return [
      { key: 'edit', label: 'Edit Compatibility', enabled: compatibility.review_status !== 'Approved', disabledReason: compatibility.review_status === 'Approved' ? 'Approved compatibility requires controlled edit/MOC.' : null },
      { key: 'compatibility-check', label: 'Run Compatibility Check', enabled: Boolean(rating), disabledReason: rating ? null : 'Add compatibility rating before running the check.' },
      { key: 'degradation', label: 'Review Degradation Mechanisms', enabled: degradation.length > 0, disabledReason: degradation.length ? null : 'Add degradation mechanisms for corrosive/high-risk service.' },
      { key: 'completeness', label: 'Run Completeness Check', enabled: true, disabledReason: null },
      { key: 'conflicts', label: 'Run Conflict Check', enabled: true, disabledReason: null },
      { key: 'submit-review', label: 'Submit for Review', enabled: !criticalConflict && !missingDoc && !incomplete, disabledReason: criticalConflict ? 'Critical conflicts block review.' : missingDoc ? 'Critical compatibility evidence is missing.' : incomplete ? 'Completeness gaps remain.' : null }
    ];
  }

  private isReviewOverdue(row: Row) { if (!row.next_review_due) return false; return new Date(row.next_review_due).getTime() < Date.now() && row.review_status !== 'Approved'; }
  private worstConflict(results: Row[]) { if (results.some((row) => row.conflict_status === 'Critical Conflict' && !row.override_approved)) return 'Critical Conflict'; if (results.some((row) => row.conflict_status === 'Major Conflict' && !row.override_approved)) return 'Major Conflict'; if (results.some((row) => row.conflict_status === 'Warning')) return 'Warning'; if (results.some((row) => row.conflict_status === 'Override Approved')) return 'Override Approved'; return 'No Conflict'; }
  private applyScope(query: any, scope: Scope, column = 'site_id') { if (scope.corporateView) return query; if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId); if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds); return query; }
  private assertSiteAccess(scope: Scope, siteId: string) { if (!siteId) throw new BadRequestException('Site is required.'); if (scope.corporateView) return siteId; if (scope.selectedSiteId && scope.selectedSiteId !== siteId) throw new ForbiddenException('Selected site is outside your active site scope.'); if (scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('Site is outside your permitted scope.'); return siteId; }
  private selectedSite(scope: Scope) { return scope.selectedSiteId ?? scope.allowedSiteIds?.[0] ?? null; }
  private safeSortColumn(column: string) { return new Set(['updated_at', 'created_at', 'compatibility_title', 'component_type', 'compatibility_rating', 'compatibility_status', 'review_status', 'conflict_status', 'completeness_status', 'next_review_due']).has(column) ? column : 'updated_at'; }
  private requireText(value: unknown, message: string) { const text = String(value ?? '').trim(); if (!text) throw new BadRequestException(message); return text; }
  private requireRow<T>(row: T | null | undefined, message: string): T { if (!row) throw new BadRequestException(message); return row; }
  private async safeSingle<T>(query: PromiseLike<any>) { try { return await this.db.single<T>(query); } catch { return null; } }
  private async safeMany<T>(query: PromiseLike<any>) { try { return await this.db.many<T>(query); } catch { return []; } }
  private dateOrNull(value: unknown) { if (!value) return null; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? null : date.toISOString(); }
  private camel(value: string) { return value.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }
  private clean<T extends Row>(value: T): T { return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T; }

  private async writeHistory(tenantId: string, actorId: string, action: string, compatibility: Row, before: any, after: any, title: string, description?: string | null) {
    await this.audit.write({ tenantId, actorId, action, entityType: 'PSI_MATERIAL_COMPATIBILITY', entityId: compatibility.id, before: before as JsonValue, after: after as JsonValue }).catch(() => null);
    await this.db.single(this.db.from('psi_material_compatibility_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: compatibility.site_id, unit_id: compatibility.unit_id ?? null, equipment_id: compatibility.equipment_id ?? null, chemical_id: compatibility.chemical_id ?? null, compatibility_id: compatibility.id, event_type: action, event_title: title, event_description: description ?? null, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId, source_record_id: compatibility.id }).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('psi_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: compatibility.site_id, unit_id: compatibility.unit_id ?? null, event_type: action, event_title: title, event_description: description ?? null, source_module: 'PSI Material Compatibility', source_record_id: compatibility.id, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId }).select('id').single()).catch(() => null);
  }
}
