import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type Row = Record<string, any>;

const equipmentTypes = ['Pressure vessel', 'Reactor', 'Storage tank', 'Heat exchanger', 'Column/tower', 'Pump', 'Compressor', 'Blower/fan', 'Piping system', 'Pipeline', 'Furnace/heater', 'Boiler', 'Filter', 'Separator', 'Drum', 'Mixer/agitator', 'Instrument/analyzer', 'Relief device protected equipment', 'Package unit', 'Other'];
const equipmentCategories = ['Pressure containing', 'Rotating equipment', 'Fixed equipment', 'Relief protected equipment', 'Process piping', 'Storage', 'Utility', 'Instrumented system', 'Package unit', 'Other'];
const fluidPhases = ['Gas', 'Liquid', 'Vapor', 'Solid', 'Slurry', 'Two-phase', 'Multiphase', 'Other'];
const criticalities = ['Low', 'Medium', 'High', 'Critical'];
const designCodes = ['ASME VIII', 'ASME B31.3', 'ASME B31.4', 'ASME B31.8', 'API 650', 'API 620', 'API 510', 'API 570', 'API 653', 'API 520', 'API 521', 'TEMA', 'IEC 61511', 'NFPA', 'ISO', 'Company standard', 'Local regulation', 'Other'];
const materials = ['Carbon steel', 'Stainless steel 304', 'Stainless steel 316', 'Duplex stainless steel', 'Alloy steel', 'Hastelloy', 'Inconel', 'Monel', 'Aluminum', 'FRP', 'HDPE', 'PTFE lined', 'Rubber lined', 'Other'];
const documentTypes = ['Equipment datasheet', 'Nameplate photo', 'Design calculation', 'Vendor drawing', 'GA drawing', 'Mechanical drawing', 'P&ID', 'PFD', 'Material certificate', 'Test certificate', 'Hydrotest certificate', 'Inspection report', 'Fabrication dossier', 'Code certificate', 'Relief calculation', 'Nozzle schedule', 'Line list', 'Instrument datasheet', 'Control narrative', 'Operating manual', 'Maintenance manual', 'MOC package', 'PSSR package', 'HAZOP report', 'LOPA report', 'Fitness-for-service report', 'Engineering study'];
const conflictStatuses = ['No Conflict', 'Warning', 'Major Conflict', 'Critical Conflict', 'Override Approved'];
const pressureEquipmentTypes = new Set(['Pressure vessel', 'Reactor', 'Heat exchanger', 'Column/tower', 'Piping system', 'Pipeline', 'Furnace/heater', 'Boiler', 'Filter', 'Separator', 'Drum', 'Relief device protected equipment']);

@Injectable()
export class PsiEquipmentDesignBasisService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async summary(tenantId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    const count = (predicate: (row: Row) => boolean) => rows.filter(predicate).length;
    return {
      totalEquipmentDesignBasisRecords: rows.length,
      equipmentWithCompleteDesignBasis: count((r) => r.completeness_status === 'Complete'),
      equipmentMissingDesignBasis: count((r) => ['Incomplete', 'Critical Gaps', 'Not Reviewed'].includes(r.completeness_status)),
      safetyCriticalEquipmentMissingDesignBasis: count((r) => r.safety_critical && ['Incomplete', 'Critical Gaps', 'Not Reviewed'].includes(r.completeness_status)),
      criticalEquipmentWithConflicts: count((r) => r.equipment_criticality === 'Critical' && ['Warning', 'Major Conflict', 'Critical Conflict'].includes(r.conflict_status)),
      designBasisPendingApproval: count((r) => ['Submitted', 'Pending Approval', 'In Review'].includes(r.review_status)),
      reviewOverdue: count((r) => this.isReviewOverdue(r)),
      mocRequired: count((r) => r.moc_update_required),
      missingDatasheets: count((r) => r.missingDatasheet),
      missingDesignCode: count((r) => !r.codes?.design_code),
      missingMaterialOfConstruction: count((r) => !r.material?.material_of_construction),
      missingDesignPressureTemperature: count((r) => r.missingDesignPressureTemperature),
      solConflicts: count((r) => r.conflicts?.some((c: Row) => c.compared_module === 'Safe Operating Limits')),
      reliefBasisConflicts: count((r) => r.conflicts?.some((c: Row) => c.compared_module === 'Relief Systems')),
      miReadinessImpact: count((r) => r.mi_readiness_impact),
      pssrBlockers: count((r) => r.pssr_blocker),
      lastUpdated: new Date().toISOString()
    };
  }

  async registry(tenantId: string, scope: Scope, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const rows = await this.registryRows(tenantId, scope, query, true, page, limit);
    const all = await this.registryRows(tenantId, scope, query, false);
    return {
      rows,
      page,
      limit,
      total: all.length,
      summary: await this.summary(tenantId, scope, query),
      savedViews: ['All Design Basis', 'Missing Design Basis', 'Critical Equipment', 'Safety-Critical Missing Data', 'Conflicts', 'Review Overdue', 'Pending Approval', 'MOC Required', 'PSSR Blockers', 'MI Readiness Impact', 'My Unit Equipment'],
      lastUpdated: new Date().toISOString()
    };
  }

  async unitDesignBasis(tenantId: string, scope: Scope, unitId: string, query: Row = {}) {
    await this.unitRecord(tenantId, scope, unitId);
    return this.registry(tenantId, scope, { ...query, unitId });
  }

  async equipmentDesignBasis(tenantId: string, scope: Scope, equipmentId: string, query: Row = {}) {
    return this.registry(tenantId, scope, { ...query, equipmentId });
  }

  async create(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const unit = await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId ?? ''));
    const equipment = await this.equipmentRecord(tenantId, scope, unit, String(dto.equipment_id ?? dto.equipmentId ?? ''), dto);
    this.validateIdentity(dto, false);
    await this.ensureNoActiveDuplicate(tenantId, unit.id, equipment.id ?? equipment.equipment_id);
    const payload = this.identityPayload(tenantId, actorId, unit, equipment, dto, { created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_equipment_design_basis').insert(payload).select().single()), 'Unable to create equipment design basis.');
    await this.upsertSection(tenantId, actorId, scope, row.id, 'ratings', dto, false);
    await this.upsertSection(tenantId, actorId, scope, row.id, 'service-basis', dto, false);
    await this.upsertSection(tenantId, actorId, scope, row.id, 'material-basis', dto, false);
    await this.upsertSection(tenantId, actorId, scope, row.id, 'capacity-basis', dto, false);
    await this.upsertSection(tenantId, actorId, scope, row.id, 'codes', dto, false);
    await this.upsertSection(tenantId, actorId, scope, row.id, 'assumptions', dto, false);
    const documents = Array.isArray(dto.documents) ? dto.documents : [];
    for (const document of documents) await this.linkDocument(tenantId, actorId, scope, row.id, document);
    await this.runConflictCheck(tenantId, actorId, scope, row.id);
    await this.runCompleteness(tenantId, actorId, scope, row.id);
    await this.writeHistory(tenantId, actorId, 'psi.equipment_design.created', row, null, row, 'Equipment design basis created', `${row.equipment_tag} design basis created.`);
    return this.detail(tenantId, scope, row.id);
  }

  async update(tenantId: string, actorId: string, scope: Scope, designBasisId: string, dto: Row, permissions: string[] = []) {
    const before = await this.record(tenantId, scope, designBasisId);
    if (before.review_status === 'Approved' && !permissions.includes('psi.equipment_design.approve')) throw new ForbiddenException('Approved equipment design basis is read-only unless controlled edit/MOC is available.');
    const unit = await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId ?? before.unit_id));
    const equipment = await this.equipmentRecord(tenantId, scope, unit, String(dto.equipment_id ?? dto.equipmentId ?? before.equipment_id), dto);
    this.validateIdentity({ ...before, ...dto }, true);
    const safetyKeys = ['equipment_type', 'equipment_criticality', 'safety_critical', 'psm_critical', 'service_fluid', 'fluid_phase', 'design_pressure', 'mawp', 'mop', 'min_design_temperature', 'max_design_temperature', 'material_of_construction', 'corrosion_allowance', 'design_capacity', 'design_flow', 'design_inventory_volume', 'design_code'];
    const safetyChanged = safetyKeys.some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined);
    const payload: Row = this.identityPayload(tenantId, actorId, unit, equipment, dto, { updated_at: new Date().toISOString(), moc_update_required: safetyChanged ? true : before.moc_update_required });
    delete payload.created_by;
    delete payload.created_at;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_equipment_design_basis').update(payload).eq('company_id', tenantId).eq('id', designBasisId).select().single()), 'Unable to update equipment design basis.');
    for (const section of ['ratings', 'service-basis', 'material-basis', 'capacity-basis', 'codes', 'assumptions']) {
      if (this.hasSectionFields(section, dto)) await this.upsertSection(tenantId, actorId, scope, designBasisId, section, dto, false);
    }
    await this.runConflictCheck(tenantId, actorId, scope, designBasisId);
    await this.runCompleteness(tenantId, actorId, scope, designBasisId);
    await this.writeHistory(tenantId, actorId, 'psi.equipment_design.updated', row, before, row, 'Equipment design basis updated', safetyChanged ? 'Safety-sensitive design basis change may require MOC.' : 'Equipment design basis updated.');
    return this.detail(tenantId, scope, designBasisId);
  }

  async detail(tenantId: string, scope: Scope, designBasisId: string) {
    const designBasis = await this.record(tenantId, scope, designBasisId, true);
    const [unit, ratings, serviceBasis, materialBasis, capacityBasis, codes, assumptions, documents, conflicts, completeness, syncEvents, history] = await Promise.all([
      this.unitRecord(tenantId, scope, designBasis.unit_id),
      this.section(tenantId, scope, designBasisId, 'ratings'),
      this.section(tenantId, scope, designBasisId, 'service-basis'),
      this.section(tenantId, scope, designBasisId, 'material-basis'),
      this.section(tenantId, scope, designBasisId, 'capacity-basis'),
      this.section(tenantId, scope, designBasisId, 'codes'),
      this.section(tenantId, scope, designBasisId, 'assumptions'),
      this.documents(tenantId, scope, designBasisId),
      this.conflicts(tenantId, scope, designBasisId),
      this.completeness(tenantId, scope, designBasisId),
      this.syncEvents(tenantId, scope, designBasisId),
      this.history(tenantId, scope, designBasisId)
    ]);
    return {
      designBasis,
      unit,
      ratings,
      serviceBasis,
      materialBasis,
      capacityBasis,
      codes,
      assumptions,
      documents,
      conflicts,
      completeness,
      syncEvents,
      history,
      overview: this.overview(designBasis, ratings, serviceBasis, materialBasis, capacityBasis, codes, documents, conflicts, completeness),
      tabs: this.tabs(designBasisId),
      actions: this.actions(designBasis, conflicts, completeness)
    };
  }

  async clone(tenantId: string, actorId: string, scope: Scope, designBasisId: string, dto: Row) {
    const detail = await this.detail(tenantId, scope, designBasisId);
    return this.create(tenantId, actorId, scope, {
      ...detail.designBasis,
      ...detail.ratings,
      ...detail.serviceBasis,
      ...detail.materialBasis,
      ...detail.capacityBasis,
      ...detail.codes,
      ...detail.assumptions,
      equipment_id: dto.equipment_id ?? dto.equipmentId ?? `${detail.designBasis.equipment_id}-clone`,
      equipment_tag: dto.equipment_tag ?? dto.equipmentTag ?? `${detail.designBasis.equipment_tag}-CLONE`,
      equipment_name: dto.equipment_name ?? dto.equipmentName ?? `${detail.designBasis.equipment_name} clone`,
      status: 'Draft',
      review_status: 'Not Reviewed',
      archived_at: null,
      archived_by: null
    });
  }

  async archive(tenantId: string, actorId: string, scope: Scope, designBasisId: string, dto: Row) {
    const before = await this.record(tenantId, scope, designBasisId);
    if (!dto.reason) throw new BadRequestException('Archive requires a reason.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_equipment_design_basis').update({ archived_at: new Date().toISOString(), archived_by: actorId, archive_reason: dto.reason, status: 'Archived', moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', designBasisId).select().single()), 'Unable to archive equipment design basis.');
    await this.writeHistory(tenantId, actorId, 'psi.equipment_design.archived', row, before, row, 'Equipment design basis archived', dto.reason);
    return row;
  }

  async reactivate(tenantId: string, actorId: string, scope: Scope, designBasisId: string, dto: Row) {
    const before = await this.record(tenantId, scope, designBasisId, true);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_equipment_design_basis').update({ archived_at: null, archived_by: null, archive_reason: null, status: dto.status ?? 'Draft', moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', designBasisId).select().single()), 'Unable to reactivate equipment design basis.');
    await this.writeHistory(tenantId, actorId, 'psi.equipment_design.reactivated', row, before, row, 'Equipment design basis reactivated', dto.reason ?? 'Equipment design basis reactivated.');
    return row;
  }

  async section(tenantId: string, scope: Scope, designBasisId: string, section: string) {
    await this.record(tenantId, scope, designBasisId, true);
    const table = this.sectionTable(section);
    return this.safeSingle<Row>(this.db.from(table).select('*').eq('company_id', tenantId).eq('design_basis_id', designBasisId).maybeSingle());
  }

  async upsertSection(tenantId: string, actorId: string, scope: Scope, designBasisId: string, section: string, dto: Row, writeEvent = true) {
    const designBasis = await this.record(tenantId, scope, designBasisId);
    const before = await this.section(tenantId, scope, designBasisId, section);
    const table = this.sectionTable(section);
    const payload = this.sectionPayload(tenantId, designBasis, section, dto);
    const row = this.requireRow(await this.db.single<Row>(this.db.from(table).upsert(payload, { onConflict: 'company_id,design_basis_id' }).select().single()), `Unable to save ${section}.`);
    await this.db.single(this.db.from('psi_equipment_design_basis').update(this.sectionIdentityPatch(section, row, actorId)).eq('company_id', tenantId).eq('id', designBasisId).select('id').single()).catch(() => null);
    await this.runConflictCheck(tenantId, actorId, scope, designBasisId);
    await this.runCompleteness(tenantId, actorId, scope, designBasisId);
    if (writeEvent) await this.writeHistory(tenantId, actorId, `psi.equipment_design.${section}.updated`, designBasis, before, row, `${this.sectionTitle(section)} updated`, `${this.sectionTitle(section)} saved.`);
    return row;
  }

  async documents(tenantId: string, scope: Scope, designBasisId: string) {
    await this.record(tenantId, scope, designBasisId, true);
    return this.safeMany<Row>(this.db.from('psi_equipment_design_document_links').select('*').eq('company_id', tenantId).eq('design_basis_id', designBasisId).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async linkDocument(tenantId: string, actorId: string, scope: Scope, designBasisId: string, dto: Row) {
    const designBasis = await this.record(tenantId, scope, designBasisId);
    if (!dto.document_id && !dto.documentId) throw new BadRequestException('Document Control record is required.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_equipment_design_document_links').upsert({
      id: dto.id ?? randomUUID(),
      company_id: tenantId,
      site_id: designBasis.site_id,
      design_basis_id: designBasisId,
      document_id: dto.document_id ?? dto.documentId,
      document_number: dto.document_number ?? dto.documentNumber ?? null,
      document_title: dto.document_title ?? dto.documentTitle ?? null,
      document_status: dto.document_status ?? dto.documentStatus ?? null,
      document_revision: dto.document_revision ?? dto.documentRevision ?? null,
      document_type: dto.document_type ?? dto.documentType ?? 'Equipment datasheet',
      relationship_type: dto.relationship_type ?? dto.relationshipType ?? 'Reference',
      required: Boolean(dto.required),
      readiness_impact: Boolean(dto.readiness_impact ?? dto.readinessImpact),
      linked_by: actorId,
      linked_at: new Date().toISOString(),
      removed_by: null,
      removed_at: null,
      remove_reason: null
    }, { onConflict: 'company_id,design_basis_id,document_id' }).select().single()), 'Unable to link Document Control record.');
    await this.runCompleteness(tenantId, actorId, scope, designBasisId);
    await this.writeHistory(tenantId, actorId, 'psi.equipment_design.document.linked', designBasis, null, row, 'Design basis document linked', `${row.document_type}: ${row.document_number ?? row.document_id}.`);
    return this.documents(tenantId, scope, designBasisId);
  }

  async unlinkDocument(tenantId: string, actorId: string, scope: Scope, designBasisId: string, documentLinkId: string, dto: Row) {
    const designBasis = await this.record(tenantId, scope, designBasisId);
    const before = await this.safeSingle<Row>(this.db.from('psi_equipment_design_document_links').select('*').eq('company_id', tenantId).eq('design_basis_id', designBasisId).eq('id', documentLinkId).maybeSingle());
    if (!before) throw new NotFoundException('Design basis document link not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_equipment_design_document_links').update({ removed_by: actorId, removed_at: new Date().toISOString(), remove_reason: dto.reason ?? null }).eq('company_id', tenantId).eq('id', documentLinkId).select().single()), 'Unable to remove document link.');
    await this.runCompleteness(tenantId, actorId, scope, designBasisId);
    await this.writeHistory(tenantId, actorId, 'psi.equipment_design.document.unlinked', designBasis, before, row, 'Design basis document unlinked', dto.reason ?? row.document_id);
    return this.documents(tenantId, scope, designBasisId);
  }

  async completeness(tenantId: string, scope: Scope, designBasisId: string) {
    await this.record(tenantId, scope, designBasisId, true);
    return this.safeMany<Row>(this.db.from('psi_equipment_design_completeness_evaluations').select('*').eq('company_id', tenantId).eq('design_basis_id', designBasisId).order('severity'));
  }

  async runCompleteness(tenantId: string, actorId: string, scope: Scope, designBasisId: string) {
    const detail = await this.detailForChecks(tenantId, scope, designBasisId);
    const { designBasis, ratings, serviceBasis, materialBasis, capacityBasis, codes, documents, conflicts } = detail;
    const critical = designBasis.equipment_criticality === 'Critical' || designBasis.safety_critical || designBasis.psm_critical;
    const pressureEquipment = pressureEquipmentTypes.has(designBasis.equipment_type);
    const corrosive = Boolean(serviceBasis?.corrosive_service);
    const currentDocs = documents.filter((doc) => !doc.removed_at);
    const hasDatasheet = currentDocs.some((doc) => /datasheet/i.test(doc.document_type));
    const highConflict = conflicts.some((c) => ['Major Conflict', 'Critical Conflict'].includes(c.conflict_status) && !c.override_approved);
    const checks = [
      this.check('equipment_selected', 'Equipment selected', Boolean(designBasis.equipment_id), 'Critical'),
      this.check('equipment_scope', 'Equipment belongs to valid company/site/unit', Boolean(designBasis.unit_id && designBasis.site_id), 'Critical'),
      this.check('equipment_type', 'Equipment type exists', Boolean(designBasis.equipment_type), 'Critical'),
      this.check('service_fluid', 'Service fluid defined', Boolean(designBasis.service_fluid), 'High'),
      this.check('design_pressure', 'Design pressure exists where required', !pressureEquipment || ratings?.design_pressure !== null && ratings?.design_pressure !== undefined, pressureEquipment ? 'Critical' : 'Medium'),
      this.check('design_temperature', 'Design temperature exists where required', !pressureEquipment || ratings?.max_design_temperature !== null && ratings?.max_design_temperature !== undefined, pressureEquipment ? 'Critical' : 'Medium'),
      this.check('mawp_mop', 'MAWP/MOP exists or reason unavailable', !pressureEquipment || ratings?.mawp !== null && ratings?.mawp !== undefined || ratings?.mop !== null && ratings?.mop !== undefined || Boolean(ratings?.pressure_rating_basis), 'High'),
      this.check('material', 'Material of construction exists', !critical || Boolean(materialBasis?.material_of_construction), critical ? 'Critical' : 'Medium'),
      this.check('corrosion_allowance', 'Corrosion allowance exists for corrosive/pressure service', !(corrosive || pressureEquipment) || materialBasis?.corrosion_allowance !== null && materialBasis?.corrosion_allowance !== undefined || Boolean(materialBasis?.material_compatibility_notes), corrosive ? 'Critical' : 'High'),
      this.check('capacity', 'Capacity/volume/duty exists where required', Boolean(capacityBasis?.design_capacity ?? capacityBasis?.design_flow ?? capacityBasis?.design_inventory_volume ?? capacityBasis?.duty), critical ? 'High' : 'Medium'),
      this.check('design_code', 'Design code exists', !critical || Boolean(codes?.design_code), critical ? 'Critical' : 'Medium'),
      this.check('datasheet', 'Datasheet linked', !critical || hasDatasheet, critical ? 'Critical' : 'High'),
      this.check('required_drawings', 'Required drawings linked', !critical || currentDocs.some((doc) => ['P&ID', 'PFD', 'Mechanical drawing', 'GA drawing'].includes(doc.document_type)), 'High'),
      this.check('design_calculation', 'Design calculation linked if required', !critical || currentDocs.some((doc) => /calculation|certificate|dossier/i.test(doc.document_type)), 'Medium'),
      this.check('owner', 'Owner assigned', Boolean(designBasis.owner_user_id), 'Medium'),
      this.check('review_date', 'Review date exists', Boolean(designBasis.last_review_date || designBasis.next_review_due), 'Medium'),
      this.check('review_not_overdue', 'Review not overdue', !this.isReviewOverdue(designBasis), 'High'),
      this.check('conflicts_checked', 'Conflicts checked', conflicts.length > 0 || designBasis.conflict_status !== 'Not Reviewed', 'Medium'),
      this.check('conflicts_resolved', 'No unapproved major/critical conflicts', !highConflict, highConflict ? 'Critical' : 'High'),
      this.check('related_sol', 'Related SOL exists where required', !critical || await this.hasRelatedSol(tenantId, designBasis), 'Medium'),
      this.check('related_mi', 'Related MI technical data sync status checked', true, 'Medium')
    ];
    await this.db.many(this.db.from('psi_equipment_design_completeness_evaluations').delete().eq('company_id', tenantId).eq('design_basis_id', designBasisId).select('id')).catch(() => null);
    let complete = 0;
    let criticalGaps = 0;
    for (const item of checks) {
      if (item.complete) complete += 1;
      if (!item.complete && item.severity === 'Critical') criticalGaps += 1;
      await this.db.single(this.db.from('psi_equipment_design_completeness_evaluations').upsert({
        id: randomUUID(),
        company_id: tenantId,
        site_id: designBasis.site_id,
        design_basis_id: designBasisId,
        unit_id: designBasis.unit_id,
        equipment_id: designBasis.equipment_id,
        check_key: item.key,
        check_title: item.title,
        status: item.complete ? 'Complete' : 'Missing',
        severity: item.severity,
        message: item.complete ? 'Complete' : item.message,
        missing_reason: item.complete ? null : item.message,
        pssr_blocker: !item.complete && item.severity === 'Critical',
        mi_readiness_impact: !item.complete && ['material', 'corrosion_allowance', 'design_pressure', 'design_temperature', 'conflicts_resolved'].includes(item.key),
        action_required: !item.complete,
        owner_user_id: designBasis.owner_user_id ?? null,
        evaluated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'company_id,design_basis_id,check_key' }).select('id').single()).catch(() => null);
    }
    const score = Math.round((complete / checks.length) * 100);
    const status = criticalGaps ? 'Critical Gaps' : score === 100 ? 'Complete' : score >= 70 ? 'Mostly Complete' : 'Incomplete';
    const pssr = criticalGaps > 0 || conflicts.some((c) => c.conflict_status === 'Critical Conflict' && !c.override_approved);
    const miImpact = checks.some((c) => !c.complete && ['material', 'corrosion_allowance', 'design_pressure', 'design_temperature', 'conflicts_resolved'].includes(c.key));
    await this.db.single(this.db.from('psi_equipment_design_basis').update({ completeness_score: score, completeness_status: status, pssr_blocker: pssr, mi_readiness_impact: miImpact, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', designBasisId).select('id').single()).catch(() => null);
    await this.upsertUnitCompleteness(tenantId, designBasis, status, criticalGaps, pssr);
    await this.writeHistory(tenantId, actorId, 'psi.equipment_design.completeness.run', designBasis, null, { score, status, criticalGaps }, 'Equipment design completeness checked', `${status} (${score}%).`);
    return this.completeness(tenantId, scope, designBasisId);
  }

  async conflicts(tenantId: string, scope: Scope, designBasisId: string) {
    await this.record(tenantId, scope, designBasisId, true);
    return this.safeMany<Row>(this.db.from('psi_equipment_design_conflict_results').select('*').eq('company_id', tenantId).eq('design_basis_id', designBasisId).order('created_at', { ascending: false }));
  }

  async runConflictCheck(tenantId: string, actorId: string, scope: Scope, designBasisId: string) {
    const detail = await this.detailForChecks(tenantId, scope, designBasisId);
    const { designBasis, ratings, serviceBasis, materialBasis, capacityBasis, codes, documents } = detail;
    const results: Row[] = [];
    const currentDocs = documents.filter((doc) => !doc.removed_at);
    const maxDesignPressure = this.num(ratings?.design_pressure);
    const mawp = this.num(ratings?.mawp);
    const mop = this.num(ratings?.mop);
    const maxDesignTemp = this.num(ratings?.max_design_temperature);
    const maxInventory = this.num(capacityBasis?.maximum_intended_inventory);
    const designInventory = this.num(capacityBasis?.design_inventory_volume);
    if (pressureEquipmentTypes.has(designBasis.equipment_type) && maxDesignPressure === null) results.push(this.conflict(designBasis, 'Missing Design Pressure', 'Critical Conflict', 'Critical', 'Pressure equipment is missing design pressure.', 'Equipment Design Basis', null, {}, ratings ?? {}));
    if (pressureEquipmentTypes.has(designBasis.equipment_type) && maxDesignTemp === null) results.push(this.conflict(designBasis, 'Missing Design Temperature', 'Critical Conflict', 'Critical', 'Pressure equipment is missing maximum design temperature.', 'Equipment Design Basis', null, {}, ratings ?? {}));
    if (serviceBasis?.corrosive_service && (materialBasis?.corrosion_allowance === null || materialBasis?.corrosion_allowance === undefined)) results.push(this.conflict(designBasis, 'Corrosion Allowance Missing', 'Major Conflict', 'High', 'Corrosive service requires corrosion allowance or approved basis.', 'Process Chemistry / Material Compatibility', null, serviceBasis ?? {}, materialBasis ?? {}));
    if (maxInventory !== null && designInventory !== null && maxInventory > designInventory) results.push(this.conflict(designBasis, 'Inventory Exceeds Design Volume', 'Major Conflict', 'High', 'Maximum intended inventory exceeds design inventory/volume.', 'Safe Operating Limits', null, { maximum_intended_inventory: maxInventory }, { design_inventory_volume: designInventory }));
    if (ratings?.relief_set_pressure_reference && mawp === null) results.push(this.conflict(designBasis, 'Relief Setpoint Missing MAWP', 'Warning', 'Medium', 'Relief set pressure reference exists but MAWP is missing.', 'Relief Systems', null, { relief_set_pressure_reference: ratings.relief_set_pressure_reference }, ratings ?? {}));
    if (maxDesignPressure !== null && mawp !== null && maxDesignPressure > mawp) results.push(this.conflict(designBasis, 'Design Pressure Above MAWP', 'Critical Conflict', 'Critical', 'Design pressure exceeds MAWP.', 'Mechanical Integrity', null, { design_pressure: maxDesignPressure }, { mawp }));
    if (mop !== null && mawp !== null && mop > mawp) results.push(this.conflict(designBasis, 'MOP Above MAWP', 'Critical Conflict', 'Critical', 'Maximum operating pressure exceeds MAWP.', 'Mechanical Integrity', null, { mop }, { mawp }));
    if (!materialBasis?.material_of_construction && (designBasis.equipment_criticality === 'Critical' || designBasis.safety_critical)) results.push(this.conflict(designBasis, 'Missing Material', 'Major Conflict', 'High', 'Critical/safety-critical equipment is missing material of construction.', 'Material Compatibility', null, {}, materialBasis ?? {}));
    if (!codes?.design_code && (designBasis.equipment_criticality === 'Critical' || designBasis.psm_critical)) results.push(this.conflict(designBasis, 'Missing Design Code', 'Major Conflict', 'High', 'Critical/PSM-critical equipment is missing design code.', 'Code / Standard', null, {}, codes ?? {}));
    if (!currentDocs.some((doc) => /datasheet/i.test(doc.document_type))) results.push(this.conflict(designBasis, 'Missing Datasheet', designBasis.safety_critical ? 'Major Conflict' : 'Warning', designBasis.safety_critical ? 'High' : 'Medium', 'No current equipment datasheet is linked.', 'Document Control', null, {}, { document_count: currentDocs.length }));
    if (currentDocs.some((doc) => /superseded|expired/i.test(String(doc.document_status ?? '')))) results.push(this.conflict(designBasis, 'Expired/Superseded Document', 'Warning', 'Medium', 'A linked design basis document is expired or superseded.', 'Document Control', null, {}, currentDocs));
    const solRows = await this.safeMany<Row>(this.db.from('psi_safe_operating_limits').select('id,parameter_name,parameter_type,parameter_tag,psi_safe_operating_limit_values(max_safe_limit,max_design_limit,unit_of_measure)').eq('company_id', tenantId).eq('unit_id', designBasis.unit_id).eq('equipment_id', designBasis.equipment_id).is('archived_at', null));
    for (const sol of solRows) {
      const values = Array.isArray(sol.psi_safe_operating_limit_values) ? sol.psi_safe_operating_limit_values[0] : sol.psi_safe_operating_limit_values;
      const solMax = this.num(values?.max_safe_limit ?? values?.max_design_limit);
      if (/pressure/i.test(sol.parameter_type ?? sol.parameter_name ?? '') && solMax !== null && maxDesignPressure !== null && solMax > maxDesignPressure) results.push(this.conflict(designBasis, 'SOL Pressure Exceeds Design Pressure', 'Critical Conflict', 'Critical', `${sol.parameter_name} safe/design pressure exceeds equipment design pressure.`, 'Safe Operating Limits', sol.id, { solMax }, { design_pressure: maxDesignPressure }));
      if (/temperature/i.test(sol.parameter_type ?? sol.parameter_name ?? '') && solMax !== null && maxDesignTemp !== null && solMax > maxDesignTemp) results.push(this.conflict(designBasis, 'SOL Temperature Exceeds Design Temperature', 'Critical Conflict', 'Critical', `${sol.parameter_name} safe/design temperature exceeds equipment design temperature.`, 'Safe Operating Limits', sol.id, { solMax }, { max_design_temperature: maxDesignTemp }));
    }
    if (!results.length) results.push(this.conflict(designBasis, 'No Conflict', 'No Conflict', 'Info', 'No Equipment Design Basis conflicts detected against available SOL, MI, relief, chemistry, material, and document data.', 'PSI', null, {}, {}));
    await this.db.many(this.db.from('psi_equipment_design_conflict_results').delete().eq('company_id', tenantId).eq('design_basis_id', designBasisId).select('id')).catch(() => null);
    for (const item of results) await this.db.single(this.db.from('psi_equipment_design_conflict_results').insert(item).select('id').single()).catch(() => null);
    const status = this.worstConflict(results);
    await this.db.single(this.db.from('psi_equipment_design_basis').update({ conflict_status: status, pssr_blocker: status === 'Critical Conflict' ? true : designBasis.pssr_blocker, moc_update_required: status !== 'No Conflict' ? true : designBasis.moc_update_required, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', designBasisId).select('id').single()).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.equipment_design.conflict_check.run', designBasis, null, { status, count: results.length }, 'Equipment design conflict check run', `${status}: ${results.length} result(s).`);
    return this.conflicts(tenantId, scope, designBasisId);
  }

  async overrideConflict(tenantId: string, actorId: string, scope: Scope, designBasisId: string, conflictId: string, dto: Row) {
    const designBasis = await this.record(tenantId, scope, designBasisId);
    if (!dto.reason) throw new BadRequestException('Conflict override requires a reason.');
    const before = await this.safeSingle<Row>(this.db.from('psi_equipment_design_conflict_results').select('*').eq('company_id', tenantId).eq('design_basis_id', designBasisId).eq('id', conflictId).maybeSingle());
    if (!before) throw new NotFoundException('Conflict result not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_equipment_design_conflict_results').update({ conflict_status: 'Override Approved', override_approved: true, override_reason: dto.reason, override_approved_by: actorId, override_approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', conflictId).select().single()), 'Unable to override conflict.');
    await this.runCompleteness(tenantId, actorId, scope, designBasisId);
    await this.writeHistory(tenantId, actorId, 'psi.equipment_design.conflict.override', designBasis, before, row, 'Equipment design conflict override approved', dto.reason);
    return this.conflicts(tenantId, scope, designBasisId);
  }

  async miDiff(tenantId: string, scope: Scope, designBasisId: string) {
    const detail = await this.detail(tenantId, scope, designBasisId);
    const mi = await this.safeSingle<Row>(this.db.from('mi_equipment_technical_data').select('*').eq('company_id', tenantId).eq('equipment_id', detail.designBasis.equipment_id).maybeSingle());
    const fields = ['design_pressure', 'mawp', 'mop', 'max_design_temperature', 'material_of_construction', 'corrosion_allowance', 'design_code', 'design_capacity'];
    const current = { ...detail.designBasis, ...detail.ratings, ...detail.materialBasis, ...detail.capacityBasis, ...detail.codes };
    const differences = fields.map((field) => ({ field, psiValue: current[field] ?? null, miValue: mi?.[field] ?? mi?.[this.camel(field)] ?? null, different: (current[field] ?? null) !== (mi?.[field] ?? mi?.[this.camel(field)] ?? null) }));
    return { sourceModule: 'Mechanical Integrity', targetModule: 'PSI Equipment Design Basis', miAvailable: Boolean(mi), differences, policy: 'Compare only by default; approved MI data is never overwritten silently.' };
  }

  async syncFromMi(tenantId: string, actorId: string, scope: Scope, designBasisId: string, dto: Row) {
    const designBasis = await this.record(tenantId, scope, designBasisId);
    const diff = await this.miDiff(tenantId, scope, designBasisId);
    const event = this.requireRow(await this.db.single<Row>(this.db.from('psi_equipment_design_sync_events').insert({ id: randomUUID(), company_id: tenantId, site_id: designBasis.site_id, design_basis_id: designBasisId, equipment_id: designBasis.equipment_id, sync_direction: 'Pull from MI Technical Data', source_module: 'Mechanical Integrity', target_module: 'PSI Equipment Design Basis', status: dto.apply === true ? 'Applied with confirmation' : 'Compare Only', field_diff_json: diff.differences, applied_changes_json: dto.apply === true ? dto.appliedChanges ?? {} : null, skipped_changes_json: dto.skippedChanges ?? {}, sync_reason: dto.reason ?? 'MI sync/compare requested.', synced_by: actorId }).select().single()), 'Unable to create MI sync event.');
    await this.writeHistory(tenantId, actorId, 'psi.equipment_design.mi_sync', designBasis, null, event, 'MI sync/compare recorded', event.status);
    return { ...diff, syncEvent: event };
  }

  async syncToMi(tenantId: string, actorId: string, scope: Scope, designBasisId: string, dto: Row) {
    const designBasis = await this.record(tenantId, scope, designBasisId);
    const event = this.requireRow(await this.db.single<Row>(this.db.from('psi_equipment_design_sync_events').insert({ id: randomUUID(), company_id: tenantId, site_id: designBasis.site_id, design_basis_id: designBasisId, equipment_id: designBasis.equipment_id, sync_direction: 'Push approved PSI design basis to MI technical data', source_module: 'PSI Equipment Design Basis', target_module: 'Mechanical Integrity', status: 'Pending policy approval', field_diff_json: dto.fieldDiff ?? null, applied_changes_json: null, skipped_changes_json: dto.skippedChanges ?? {}, sync_reason: dto.reason ?? 'Push requested. Existing MI data was not overwritten.', synced_by: actorId }).select().single()), 'Unable to create MI sync event.');
    await this.writeHistory(tenantId, actorId, 'psi.equipment_design.mi_push_requested', designBasis, null, event, 'MI push requested', 'Policy-controlled MI update event recorded.');
    return event;
  }

  async compareOnly(tenantId: string, actorId: string, scope: Scope, designBasisId: string) {
    return this.syncFromMi(tenantId, actorId, scope, designBasisId, { reason: 'Compare only requested.' });
  }

  async submitReview(tenantId: string, actorId: string, scope: Scope, designBasisId: string, dto: Row) {
    const before = await this.record(tenantId, scope, designBasisId);
    const conflicts = await this.conflicts(tenantId, scope, designBasisId);
    if (conflicts.some((c) => c.conflict_status === 'Critical Conflict' && !c.override_approved)) throw new BadRequestException('Critical conflicts block review submission unless an override is approved.');
    const completeness = await this.completeness(tenantId, scope, designBasisId);
    if (completeness.some((c) => c.status !== 'Complete' && c.severity === 'Critical')) throw new BadRequestException('Critical completeness gaps block review submission.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_equipment_design_basis').update({ review_status: 'Submitted', status: 'Under Review', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', designBasisId).select().single()), 'Unable to submit equipment design basis review.');
    await this.writeHistory(tenantId, actorId, 'psi.equipment_design.review.submitted', row, before, row, 'Equipment design basis submitted for review', dto.reason ?? 'Review requested.');
    return row;
  }

  async history(tenantId: string, scope: Scope, designBasisId: string) {
    await this.record(tenantId, scope, designBasisId, true);
    return this.safeMany<Row>(this.db.from('psi_equipment_design_history_events').select('*').eq('company_id', tenantId).eq('design_basis_id', designBasisId).order('created_at', { ascending: false }).limit(150));
  }

  async syncEvents(tenantId: string, scope: Scope, designBasisId: string) {
    await this.record(tenantId, scope, designBasisId, true);
    return this.safeMany<Row>(this.db.from('psi_equipment_design_sync_events').select('*').eq('company_id', tenantId).eq('design_basis_id', designBasisId).order('synced_at', { ascending: false }).limit(50));
  }

  importTemplate() {
    return { supportedFormats: ['.xlsx', '.csv'], columns: ['unit_code', 'equipment_tag', 'equipment_name', 'equipment_type', 'equipment_category', 'system_service', 'service_fluid', 'fluid_phase', 'design_pressure', 'design_pressure_unit', 'mawp', 'mawp_unit', 'mop', 'mop_unit', 'min_design_temperature', 'max_design_temperature', 'temperature_unit', 'material_of_construction', 'corrosion_allowance', 'corrosion_allowance_unit', 'design_capacity', 'capacity_unit', 'design_flow', 'flow_unit', 'design_inventory_volume', 'volume_unit', 'design_code', 'code_edition', 'construction_code', 'design_life_years', 'owner_email', 'source_document_reference'] };
  }

  async importPreview(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const preview = rows.map((row: Row, index: number) => ({
      rowNumber: index + 1,
      row,
      errors: [!row.unit_code && !row.unitId && !row.unit_id ? 'unit_code or unit_id is required.' : null, !row.equipment_tag && !row.equipmentTag ? 'equipment_tag is required.' : null, !row.equipment_name && !row.equipmentName ? 'equipment_name is required.' : null, !row.equipment_type && !row.equipmentType ? 'equipment_type is required.' : null].filter(Boolean),
      warnings: [!row.design_pressure ? 'Design pressure is missing.' : null, !row.max_design_temperature ? 'Design temperature is missing.' : null, !row.material_of_construction ? 'Material of construction is missing.' : null, !row.design_code ? 'Design code is missing.' : null, !row.source_document_reference ? 'Datasheet/design source document reference is missing.' : null].filter(Boolean)
    }));
    return this.db.single<Row>(this.db.from('psi_equipment_design_import_jobs').insert({ id: randomUUID(), company_id: tenantId, site_id: this.selectedSite(scope), uploaded_by: actorId, file_name: dto.fileName ?? 'equipment-design-basis-import.csv', file_key: dto.fileKey ?? null, status: preview.some((r: Row) => r.errors.length) ? 'Errors' : 'Preview Ready', total_rows: preview.length, valid_rows: preview.filter((r: Row) => !r.errors.length).length, error_rows: preview.filter((r: Row) => r.errors.length).length, preview_json: preview }).select().single());
  }

  async exportRows(tenantId: string, actorId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    if (rows[0]) await this.writeHistory(tenantId, actorId, 'psi.equipment_design.exported', rows[0], null, { count: rows.length, query }, 'Equipment design basis exported', `${rows.length} rows exported.`);
    return { rows, format: query.format ?? 'json', generatedAt: new Date().toISOString() };
  }

  lookups(kind: string) {
    const map: Record<string, string[]> = {
      'equipment-types': equipmentTypes,
      'equipment-categories': equipmentCategories,
      'design-codes': designCodes,
      'fluid-phases': fluidPhases,
      materials,
      'equipment-criticalities': criticalities,
      'design-basis-conflict-statuses': conflictStatuses,
      'design-basis-document-types': documentTypes
    };
    return map[kind] ?? [];
  }

  private async registryRows(tenantId: string, scope: Scope, query: Row, paginated: boolean, page = 1, limit = 25) {
    let request: any = this.applyScope(this.db.from('psi_equipment_design_basis').select('*, psi_equipment_design_ratings(*), psi_equipment_service_basis(*), psi_equipment_material_basis(*), psi_equipment_capacity_basis(*), psi_equipment_design_codes(*), psi_equipment_design_document_links(id,document_type,document_status,removed_at), psi_equipment_design_conflict_results(conflict_status,compared_module)').eq('company_id', tenantId), scope);
    if (query.includeArchived !== 'true') request = request.is('archived_at', null);
    if (query.unitId || query.unit_id) request = request.eq('unit_id', query.unitId ?? query.unit_id);
    if (query.equipmentId || query.equipment_id) request = request.eq('equipment_id', query.equipmentId ?? query.equipment_id);
    if (query.search) request = request.or(`equipment_tag.ilike.%${query.search}%,equipment_name.ilike.%${query.search}%,service_fluid.ilike.%${query.search}%`);
    if (query.equipmentType) request = request.eq('equipment_type', query.equipmentType);
    if (query.equipmentCategory) request = request.eq('equipment_category', query.equipmentCategory);
    if (query.serviceFluid) request = request.ilike('service_fluid', `%${query.serviceFluid}%`);
    if (query.equipmentCriticality) request = request.eq('equipment_criticality', query.equipmentCriticality);
    if (query.status) request = request.eq('status', query.status);
    if (query.reviewStatus) request = request.eq('review_status', query.reviewStatus);
    if (query.completenessStatus) request = request.eq('completeness_status', query.completenessStatus);
    if (query.conflictStatus) request = request.eq('conflict_status', query.conflictStatus);
    if (query.safetyCritical === 'true') request = request.eq('safety_critical', true);
    if (query.psmCritical === 'true') request = request.eq('psm_critical', true);
    if (query.mocRequired === 'true') request = request.eq('moc_update_required', true);
    if (query.pssrBlocker === 'true') request = request.eq('pssr_blocker', true);
    if (query.miReadinessImpact === 'true') request = request.eq('mi_readiness_impact', true);
    if (query.missing === 'true') request = request.in('completeness_status', ['Incomplete', 'Critical Gaps', 'Not Reviewed']);
    if (query.reviewOverdue === 'true') request = request.lt('next_review_due', new Date().toISOString().slice(0, 10));
    if (query.conflicts === 'true') request = request.in('conflict_status', ['Warning', 'Major Conflict', 'Critical Conflict']);
    const [column, direction] = String(query.sort ?? 'updated_at.desc').split('.');
    request = request.order(this.safeSortColumn(column ?? 'updated_at'), { ascending: direction !== 'desc' });
    if (paginated) request = request.range((page - 1) * limit, page * limit - 1);
    const rows = await this.safeMany<Row>(request);
    return rows.map((row) => this.normalizeRegistryRow(row)).filter((row) => {
      if (query.missingDatasheet === 'true' && !row.missingDatasheet) return false;
      if (query.missingDesignPressureTemperature === 'true' && !row.missingDesignPressureTemperature) return false;
      return true;
    });
  }

  private normalizeRegistryRow(row: Row) {
    const ratings = Array.isArray(row.psi_equipment_design_ratings) ? row.psi_equipment_design_ratings[0] : row.psi_equipment_design_ratings;
    const service = Array.isArray(row.psi_equipment_service_basis) ? row.psi_equipment_service_basis[0] : row.psi_equipment_service_basis;
    const material = Array.isArray(row.psi_equipment_material_basis) ? row.psi_equipment_material_basis[0] : row.psi_equipment_material_basis;
    const capacity = Array.isArray(row.psi_equipment_capacity_basis) ? row.psi_equipment_capacity_basis[0] : row.psi_equipment_capacity_basis;
    const codes = Array.isArray(row.psi_equipment_design_codes) ? row.psi_equipment_design_codes[0] : row.psi_equipment_design_codes;
    const documents = Array.isArray(row.psi_equipment_design_document_links) ? row.psi_equipment_design_document_links.filter((d: Row) => !d.removed_at) : [];
    const conflicts = Array.isArray(row.psi_equipment_design_conflict_results) ? row.psi_equipment_design_conflict_results : [];
    const pressureEquipment = pressureEquipmentTypes.has(row.equipment_type);
    return {
      ...row,
      ratings,
      serviceBasis: service,
      material,
      capacity,
      codes,
      documents,
      conflicts,
      missingDatasheet: !documents.some((d: Row) => /datasheet/i.test(d.document_type)),
      missingDesignPressureTemperature: pressureEquipment && (ratings?.design_pressure === null || ratings?.design_pressure === undefined || ratings?.max_design_temperature === null || ratings?.max_design_temperature === undefined)
    };
  }

  private validateIdentity(dto: Row, partial: boolean) {
    if (!partial || dto.unit_id !== undefined || dto.unitId !== undefined) this.requireText(dto.unit_id ?? dto.unitId, 'Process unit is required.');
    if (!partial || dto.equipment_id !== undefined || dto.equipmentId !== undefined) this.requireText(dto.equipment_id ?? dto.equipmentId, 'Equipment is required.');
    if (!partial || dto.equipment_tag !== undefined || dto.equipmentTag !== undefined) this.requireText(dto.equipment_tag ?? dto.equipmentTag, 'Equipment tag is required.');
    if (!partial || dto.equipment_name !== undefined || dto.equipmentName !== undefined) this.requireText(dto.equipment_name ?? dto.equipmentName, 'Equipment name is required.');
    if (!partial || dto.equipment_type !== undefined || dto.equipmentType !== undefined) this.requireText(dto.equipment_type ?? dto.equipmentType, 'Equipment type is required.');
    if (!partial || dto.equipment_criticality !== undefined || dto.equipmentCriticality !== undefined) this.requireText(dto.equipment_criticality ?? dto.equipmentCriticality, 'Equipment criticality is required.');
  }

  private identityPayload(tenantId: string, actorId: string, unit: Row, equipment: Row, dto: Row, extras: Row) {
    return this.clean({
      company_id: tenantId,
      site_id: unit.site_id,
      unit_id: unit.id,
      area_id: dto.area_id ?? dto.areaId ?? equipment.areaId ?? equipment.area_id ?? unit.area_id ?? null,
      equipment_id: dto.equipment_id ?? dto.equipmentId ?? equipment.id ?? equipment.equipment_id,
      equipment_tag: dto.equipment_tag ?? dto.equipmentTag ?? equipment.tag ?? equipment.equipment_tag,
      equipment_name: dto.equipment_name ?? dto.equipmentName ?? equipment.name ?? equipment.equipment_name,
      equipment_type: dto.equipment_type ?? dto.equipmentType ?? equipment.type ?? equipment.equipment_type ?? 'Other',
      equipment_category: dto.equipment_category ?? dto.equipmentCategory ?? null,
      system_service: dto.system_service ?? dto.systemService ?? null,
      equipment_criticality: dto.equipment_criticality ?? dto.equipmentCriticality ?? equipment.criticality ?? 'Medium',
      safety_critical: Boolean(dto.safety_critical ?? dto.safetyCritical ?? equipment.safetyCritical),
      psm_critical: Boolean(dto.psm_critical ?? dto.psmCritical ?? equipment.psmCritical),
      status: dto.status ?? 'Draft',
      service_fluid: dto.service_fluid ?? dto.serviceFluid ?? null,
      fluid_phase: dto.fluid_phase ?? dto.fluidPhase ?? null,
      owner_user_id: dto.owner_user_id ?? dto.ownerUserId ?? null,
      process_engineer_id: dto.process_engineer_id ?? dto.processEngineerId ?? null,
      mechanical_engineer_id: dto.mechanical_engineer_id ?? dto.mechanicalEngineerId ?? null,
      mi_owner_id: dto.mi_owner_id ?? dto.miOwnerId ?? null,
      operations_owner_id: dto.operations_owner_id ?? dto.operationsOwnerId ?? null,
      hse_reviewer_id: dto.hse_reviewer_id ?? dto.hseReviewerId ?? null,
      last_review_date: this.dateOrNull(dto.last_review_date ?? dto.lastReviewDate),
      next_review_due: this.dateOrNull(dto.next_review_due ?? dto.nextReviewDue),
      notes: dto.notes ?? null,
      review_status: dto.review_status ?? dto.reviewStatus ?? 'Not Reviewed',
      created_by: actorId,
      updated_by: actorId,
      ...extras
    });
  }

  private sectionTable(section: string) {
    const map: Record<string, string> = {
      ratings: 'psi_equipment_design_ratings',
      'service-basis': 'psi_equipment_service_basis',
      'material-basis': 'psi_equipment_material_basis',
      'capacity-basis': 'psi_equipment_capacity_basis',
      codes: 'psi_equipment_design_codes',
      assumptions: 'psi_equipment_design_assumptions'
    };
    const table = map[section];
    if (!table) throw new BadRequestException('Unknown equipment design basis section.');
    return table;
  }

  private sectionTitle(section: string) {
    return section.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  private sectionPayload(tenantId: string, designBasis: Row, section: string, dto: Row) {
    const fields: Record<string, string[]> = {
      ratings: ['design_pressure','design_pressure_unit','mawp','mawp_unit','mop','mop_unit','vacuum_design_pressure','hydrotest_pressure','pneumatic_test_pressure','relief_set_pressure_reference','pressure_rating_basis','min_design_temperature','max_design_temperature','min_normal_operating_temperature','max_normal_operating_temperature','maximum_allowable_temperature','minimum_design_metal_temperature','temperature_unit','temperature_rating_basis','design_life_years','commissioning_date','remaining_design_life_foundation','design_margin_safety_factor','external_design_conditions','internal_design_conditions','cyclic_service','fatigue_consideration'],
      'service-basis': ['chemical_service','corrosive_service','toxic_service','flammable_service','reactive_service','two_phase_service','slurry_solids_service','fouling_service','erosive_service','hydrogen_service','sour_service_h2s','oxygen_service','cryogenic_service','high_temperature_service','normal_operating_pressure','normal_operating_temperature','normal_flow','operating_envelope_summary','startup_shutdown_service_notes','cleaning_flushing_service_notes','abnormal_service_conditions'],
      'material-basis': ['material_of_construction','shell_material','head_material','tube_material','internal_material','lining_coating','cladding','gasket_material','seal_material','elastomer_material','corrosion_allowance','corrosion_allowance_unit','nominal_thickness','minimum_required_thickness','thickness_unit','joint_efficiency','weld_category','insulation_type','fireproofing_requirement','external_coating','internal_coating','cathodic_protection','cui_susceptibility','corrosion_mechanism','material_compatibility_notes','nde_requirement','inspection_requirement','special_metallurgy_notes'],
      'capacity-basis': ['design_capacity','capacity_unit','normal_capacity','turndown_limit','design_flow','normal_flow','minimum_flow','maximum_flow','flow_unit','pressure_drop','duty','duty_unit','efficiency','design_inventory_volume','normal_inventory_volume','maximum_intended_inventory','volume_unit','residence_time','performance_basis_notes','equipment_specific_json'],
      codes: ['design_code','code_edition','construction_code','inspection_code','relief_design_code_reference','electrical_instrument_standard_reference','company_standard','licensor_standard','vendor_standard','regulatory_requirement','certification_requirement','third_party_inspection_requirement','code_stamp_certification_number','design_registration_number','notes'],
      assumptions: ['original_design_assumptions','process_assumptions','mechanical_assumptions','utility_assumptions','environmental_assumptions','chemical_assumptions','corrosion_assumptions','operating_limitations','known_restrictions','temporary_restrictions','exclusions','design_basis_uncertainty','required_verification','required_future_study','engineering_notes','moc_required_on_change']
    };
    const row: Row = { id: dto[`${section}_id`] ?? randomUUID(), company_id: tenantId, site_id: designBasis.site_id, design_basis_id: designBasis.id, updated_at: new Date().toISOString() };
    for (const field of fields[section] ?? []) {
      const value = dto[field] ?? dto[this.camel(field)];
      if (value !== undefined) row[field] = typeof value === 'boolean' ? value : value === '' ? null : value;
      else row[field] = null;
    }
    return this.clean(row);
  }

  private sectionIdentityPatch(section: string, row: Row, actorId: string) {
    const patch: Row = { updated_by: actorId, updated_at: new Date().toISOString() };
    if (section === 'service-basis') {
      if (row.chemical_service !== undefined) patch.service_fluid = row.chemical_service;
    }
    return patch;
  }

  private hasSectionFields(section: string, dto: Row) {
    const tableFields = this.sectionPayload('x', { id: 'x', site_id: 'x' }, section, dto);
    return Object.keys(tableFields).some((key) => !['id', 'company_id', 'site_id', 'design_basis_id', 'updated_at'].includes(key) && tableFields[key] !== null && tableFields[key] !== undefined);
  }

  private async detailForChecks(tenantId: string, scope: Scope, designBasisId: string) {
    const designBasis = await this.record(tenantId, scope, designBasisId, true);
    const [ratings, serviceBasis, materialBasis, capacityBasis, codes, assumptions, documents, conflicts] = await Promise.all([
      this.section(tenantId, scope, designBasisId, 'ratings'),
      this.section(tenantId, scope, designBasisId, 'service-basis'),
      this.section(tenantId, scope, designBasisId, 'material-basis'),
      this.section(tenantId, scope, designBasisId, 'capacity-basis'),
      this.section(tenantId, scope, designBasisId, 'codes'),
      this.section(tenantId, scope, designBasisId, 'assumptions'),
      this.documents(tenantId, scope, designBasisId),
      this.conflicts(tenantId, scope, designBasisId)
    ]);
    return { designBasis, ratings, serviceBasis, materialBasis, capacityBasis, codes, assumptions, documents, conflicts };
  }

  private async equipmentRecord(tenantId: string, scope: Scope, unit: Row, equipmentId: string, dto: Row) {
    if (!equipmentId) throw new BadRequestException('Equipment is required.');
    const link = await this.safeSingle<Row>(this.db.from('psi_unit_equipment_links').select('*').eq('company_id', tenantId).eq('unit_id', unit.id).eq('equipment_id', equipmentId).maybeSingle());
    const equipment = await this.safeSingle<Row>(this.db.from('Equipment').select('id,tag,name,type,status,criticality,safetyCritical,psmCritical,siteId,unitId,areaId').eq('tenantId', tenantId).eq('id', equipmentId).maybeSingle());
    if (equipment && equipment.siteId !== unit.site_id) throw new BadRequestException('Equipment must belong to the same company/site/unit as the PSI unit.');
    if (equipment && equipment.unitId && equipment.unitId !== unit.id) throw new BadRequestException('Equipment must belong to the selected PSI unit.');
    if (!equipment && !link && !dto.equipment_tag && !dto.equipmentTag) throw new BadRequestException('Equipment must exist in Equipment Registry/PSI unit links or include a verified equipment tag snapshot.');
    return equipment ?? { id: equipmentId, equipment_id: equipmentId, tag: dto.equipment_tag ?? dto.equipmentTag ?? equipmentId, name: dto.equipment_name ?? dto.equipmentName ?? equipmentId, type: dto.equipment_type ?? dto.equipmentType ?? 'Other', criticality: dto.equipment_criticality ?? dto.equipmentCriticality ?? 'Medium', siteId: unit.site_id, unitId: unit.id, areaId: unit.area_id };
  }

  private async ensureNoActiveDuplicate(tenantId: string, unitId: string, equipmentId: string) {
    const existing = await this.safeSingle<Row>(this.db.from('psi_equipment_design_basis').select('id').eq('company_id', tenantId).eq('unit_id', unitId).eq('equipment_id', equipmentId).is('archived_at', null).maybeSingle());
    if (existing) throw new BadRequestException('This equipment already has an active PSI Equipment Design Basis record.');
  }

  private async record(tenantId: string, scope: Scope, designBasisId: string, includeArchived = false) {
    let request: any = this.applyScope(this.db.from('psi_equipment_design_basis').select('*').eq('company_id', tenantId).eq('id', designBasisId), scope);
    if (!includeArchived) request = request.is('archived_at', null);
    const row = await this.safeSingle<Row>(request.maybeSingle());
    if (!row) throw new NotFoundException('Equipment design basis not found or outside your company/site access.');
    return row;
  }

  private async unitRecord(tenantId: string, scope: Scope, unitId: string) {
    if (!unitId) throw new BadRequestException('Process unit is required.');
    const row = await this.safeSingle<Row>(this.applyScope(this.db.from('psi_units').select('*').eq('company_id', tenantId).eq('id', unitId), scope).maybeSingle());
    if (!row) throw new NotFoundException('Process unit not found or outside your company/site access.');
    return row;
  }

  private async hasRelatedSol(tenantId: string, designBasis: Row) {
    const row = await this.safeSingle<Row>(this.db.from('psi_safe_operating_limits').select('id').eq('company_id', tenantId).eq('unit_id', designBasis.unit_id).eq('equipment_id', designBasis.equipment_id).is('archived_at', null).limit(1).maybeSingle());
    return Boolean(row);
  }

  private async upsertUnitCompleteness(tenantId: string, designBasis: Row, status: string, critical: number, pssr: boolean) {
    await this.db.single(this.db.from('psi_completeness_evaluations').upsert({ id: randomUUID(), company_id: tenantId, site_id: designBasis.site_id, unit_id: designBasis.unit_id, category: 'Equipment design basis', requirement_name: `Equipment design basis - ${designBasis.equipment_tag}`, status: status === 'Complete' ? 'Complete' : 'Missing', severity: critical ? 'Critical' : 'High', missing_reason: status === 'Complete' ? null : `Equipment design basis completeness is ${status}.`, linked_module: 'PSI Equipment Design Basis', linked_record_id: designBasis.id, readiness_impact: pssr ? 'PSSR blocker' : 'Mechanical integrity readiness', pssr_blocker: pssr, evaluated_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'company_id,unit_id,category,requirement_name' }).select('id').single()).catch(() => null);
  }

  private overview(designBasis: Row, ratings: Row | null, serviceBasis: Row | null, materialBasis: Row | null, capacityBasis: Row | null, codes: Row | null, documents: Row[], conflicts: Row[], completeness: Row[]) {
    const docStatus = documents.some((d) => /datasheet/i.test(d.document_type)) ? 'Datasheet linked' : 'Missing datasheet';
    return { cards: [
      { label: 'Equipment tag/name', value: `${designBasis.equipment_tag} / ${designBasis.equipment_name}`, tone: 'neutral' },
      { label: 'Unit/area', value: `${designBasis.unit_id}${designBasis.area_id ? ` / ${designBasis.area_id}` : ''}`, tone: 'neutral' },
      { label: 'Equipment type', value: designBasis.equipment_type, tone: 'neutral' },
      { label: 'Criticality', value: designBasis.equipment_criticality, tone: designBasis.equipment_criticality === 'Critical' ? 'danger' : designBasis.equipment_criticality === 'High' ? 'warn' : 'neutral' },
      { label: 'Design pressure', value: this.withUnit(ratings?.design_pressure, ratings?.design_pressure_unit), tone: ratings?.design_pressure ? 'neutral' : 'warn' },
      { label: 'Design temperature', value: this.tempRange(ratings), tone: ratings?.max_design_temperature ? 'neutral' : 'warn' },
      { label: 'MAWP/MOP', value: `${this.withUnit(ratings?.mawp, ratings?.mawp_unit)} / ${this.withUnit(ratings?.mop, ratings?.mop_unit)}`, tone: ratings?.mawp || ratings?.mop ? 'neutral' : 'warn' },
      { label: 'Material of construction', value: materialBasis?.material_of_construction ?? 'Missing', tone: materialBasis?.material_of_construction ? 'neutral' : 'warn' },
      { label: 'Service fluid', value: designBasis.service_fluid ?? serviceBasis?.chemical_service ?? 'Missing', tone: designBasis.service_fluid || serviceBasis?.chemical_service ? 'neutral' : 'warn' },
      { label: 'Design code', value: codes?.design_code ?? 'Missing', tone: codes?.design_code ? 'neutral' : 'warn' },
      { label: 'Capacity/volume/duty', value: capacityBasis?.design_capacity ?? capacityBasis?.design_inventory_volume ?? capacityBasis?.duty ?? 'Missing', tone: capacityBasis ? 'neutral' : 'warn' },
      { label: 'Datasheet status', value: docStatus, tone: docStatus === 'Datasheet linked' ? 'good' : 'warn' },
      { label: 'Completeness status', value: `${designBasis.completeness_status}${designBasis.completeness_score !== null ? ` (${designBasis.completeness_score}%)` : ''}`, tone: designBasis.completeness_status === 'Complete' ? 'good' : 'warn' },
      { label: 'Conflict status', value: designBasis.conflict_status, tone: designBasis.conflict_status === 'Critical Conflict' ? 'danger' : designBasis.conflict_status === 'No Conflict' ? 'good' : 'warn' },
      { label: 'Review status', value: designBasis.review_status, tone: 'neutral' },
      { label: 'MOC required', value: designBasis.moc_update_required ? 'Yes' : 'No', tone: designBasis.moc_update_required ? 'warn' : 'neutral' },
      { label: 'PSSR blocker', value: designBasis.pssr_blocker ? 'Yes' : 'No', tone: designBasis.pssr_blocker ? 'danger' : 'good' },
      { label: 'MI readiness impact', value: designBasis.mi_readiness_impact ? 'Yes' : 'No', tone: designBasis.mi_readiness_impact ? 'warn' : 'good' },
      { label: 'PSI completeness impact', value: completeness.some((c) => c.status !== 'Complete') ? 'Open gaps' : 'No open gaps', tone: completeness.some((c) => c.status !== 'Complete') ? 'warn' : 'good' }
    ], ratings, serviceBasis, materialBasis, capacityBasis, codes, documents, conflicts, completeness };
  }

  private actions(designBasis: Row, conflicts: Row[], completeness: Row[]) {
    const locked = designBasis.review_status === 'Approved';
    const criticalConflict = conflicts.some((c) => c.conflict_status === 'Critical Conflict' && !c.override_approved);
    const missingCritical = completeness.some((c) => c.status !== 'Complete' && c.severity === 'Critical');
    return [
      { key: 'edit', label: 'Edit', enabled: !locked, disabledReason: locked ? 'Approved Equipment Design Basis requires controlled edit/MOC.' : null },
      { key: 'sync-mi', label: 'Compare / Sync MI', enabled: !locked, disabledReason: locked ? 'Approved basis cannot sync without controlled edit.' : null },
      { key: 'run-completeness', label: 'Run Completeness Check', enabled: true },
      { key: 'run-conflict-check', label: 'Run Conflict Check', enabled: true },
      { key: 'submit-review', label: 'Submit for Review', enabled: !locked && !criticalConflict && !missingCritical, disabledReason: criticalConflict ? 'Critical conflicts must be resolved or overridden first.' : missingCritical ? 'Critical completeness gaps must be resolved before review.' : null }
    ];
  }

  private tabs(id: string) {
    const base = `/process-safety-information/equipment-design/${id}`;
    return ['Overview', 'Design Ratings', 'Service / Operating Basis', 'Mechanical / Material Basis', 'Capacity / Performance', 'Codes / Standards', 'Assumptions / Limitations', 'Conflicts / Completeness', 'Linked Records', 'Documents', 'Review & Approval', 'Change History'].map((label) => ({ label, href: base, enabled: true }));
  }

  private conflict(designBasis: Row, type: string, status: string, severity: string, message: string, comparedModule: string, comparedRecordId: string | null, compared: Row, current: Row) {
    return {
      id: randomUUID(),
      company_id: designBasis.company_id,
      site_id: designBasis.site_id,
      design_basis_id: designBasis.id,
      equipment_id: designBasis.equipment_id,
      conflict_type: type,
      conflict_status: status,
      severity,
      message,
      compared_module: comparedModule,
      compared_record_id: comparedRecordId,
      compared_value_json: compared,
      current_value_json: current,
      override_required: ['Major Conflict', 'Critical Conflict'].includes(status),
      override_approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private check(key: string, title: string, complete: boolean | Promise<boolean>, severity: string) {
    return { key, title, complete: Boolean(complete), severity, message: `${title} is missing or incomplete.` };
  }

  private async writeHistory(tenantId: string, actorId: string, action: string, designBasis: Row, before: any, after: any, title: string, description?: string | null) {
    await this.audit.write({ tenantId, actorId, action, entityType: 'PSI_EQUIPMENT_DESIGN_BASIS', entityId: designBasis.id, before: before as JsonValue, after: after as JsonValue }).catch(() => null);
    await this.db.single(this.db.from('psi_equipment_design_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: designBasis.site_id, unit_id: designBasis.unit_id, equipment_id: designBasis.equipment_id, design_basis_id: designBasis.id, event_type: action, event_title: title, event_description: description ?? null, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId, source_record_id: designBasis.id }).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('psi_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: designBasis.site_id, unit_id: designBasis.unit_id, event_type: action, event_title: title, event_description: description ?? null, source_module: 'PSI Equipment Design Basis', source_record_id: designBasis.id, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId }).select('id').single()).catch(() => null);
  }

  private applyScope(query: any, scope: Scope, column = 'site_id') { if (scope.corporateView) return query; if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId); if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds); return query; }
  private selectedSite(scope: Scope) { return scope.selectedSiteId ?? scope.allowedSiteIds?.[0] ?? null; }
  private isReviewOverdue(row: Row) { if (!row.next_review_due) return false; return new Date(row.next_review_due).getTime() < Date.now(); }
  private worstConflict(results: Row[]) { if (results.some((r) => r.conflict_status === 'Critical Conflict' && !r.override_approved)) return 'Critical Conflict'; if (results.some((r) => r.conflict_status === 'Major Conflict' && !r.override_approved)) return 'Major Conflict'; if (results.some((r) => r.conflict_status === 'Warning')) return 'Warning'; if (results.some((r) => r.conflict_status === 'Override Approved')) return 'Override Approved'; return 'No Conflict'; }
  private safeSortColumn(column: string) { return new Set(['updated_at', 'created_at', 'equipment_tag', 'equipment_name', 'equipment_type', 'equipment_criticality', 'review_status', 'conflict_status', 'completeness_status']).has(column) ? column : 'updated_at'; }
  private num(value: unknown) { if (value === null || value === undefined || value === '') return null; const n = Number(value); return Number.isFinite(n) ? n : null; }
  private requireText(value: unknown, message: string) { if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(message); return value.trim(); }
  private requireRow<T>(row: T | null | undefined, message: string): T { if (!row) throw new BadRequestException(message); return row; }
  private async safeSingle<T>(query: PromiseLike<any>) { try { return await this.db.single<T>(query); } catch { return null; } }
  private async safeMany<T>(query: PromiseLike<any>) { try { return await this.db.many<T>(query); } catch { return []; } }
  private dateOrNull(value: unknown) { if (!value) return null; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10); }
  private camel(value: string) { return value.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }
  private clean<T extends Row>(value: T): T { return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T; }
  private withUnit(value: unknown, unit: unknown) { return value === null || value === undefined || value === '' ? 'Not defined' : `${value}${unit ? ` ${unit}` : ''}`; }
  private tempRange(ratings: Row | null) { if (!ratings) return 'Not defined'; const min = ratings.min_design_temperature; const max = ratings.max_design_temperature; const unit = ratings.temperature_unit ?? ''; if (min !== null && min !== undefined && max !== null && max !== undefined) return `${min} - ${max} ${unit}`; if (max !== null && max !== undefined) return `${max} ${unit}`; return 'Not defined'; }
}
