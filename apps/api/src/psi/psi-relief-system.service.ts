import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type Row = Record<string, any>;

const reliefSystemTypes = ['PSV / PRV', 'Rupture disk', 'PSV + rupture disk combination', 'Conservation vent', 'Emergency vent', 'Thermal relief valve', 'Vacuum relief', 'Flame arrestor / vent protection', 'Open vent', 'Flare system', 'Scrubber relief', 'Blowdown / depressurization', 'Safety valve on utility system', 'Other'];
const reliefDeviceTypes = ['PSV', 'PRV', 'Safety valve', 'Rupture disk', 'Conservation vent', 'Emergency vent', 'Thermal relief valve', 'Vacuum relief valve', 'Open vent', 'Other'];
const scenarioTypes = ['External fire', 'Blocked outlet', 'Thermal expansion', 'Control valve failure', 'Utility failure', 'Cooling failure', 'Power failure', 'Instrument air failure', 'Tube rupture', 'Heat exchanger failure', 'Reflux failure', 'Condenser failure', 'Pump deadhead', 'Compressor surge/discharge blockage', 'Overfilling', 'Gas blowby', 'Liquid overpressure', 'Vapor generation', 'Runaway reaction', 'Decomposition', 'Polymerization', 'Wrong chemical addition', 'Excess feed', 'Loss of agitation', 'Loss of inerting', 'Air ingress', 'Water ingress', 'Vacuum case', 'Two-phase relief', 'Hydraulic expansion', 'Fire case for storage', 'Other'];
const destinationTypes = ['Flare', 'Vent to atmosphere', 'Scrubber', 'Closed drain', 'Blowdown drum', 'Containment', 'Process recycle', 'Safe outdoor location', 'Other'];
const calculationStatuses = ['Not Started', 'Draft', 'Calculated', 'Verified', 'Approved', 'Superseded', 'Missing', 'Waived With Approval'];
const conflictStatuses = ['No Conflict', 'Warning', 'Major Conflict', 'Critical Conflict', 'Override Approved'];
const documentTypes = ['Relief calculation', 'PSV datasheet', 'Protected equipment datasheet', 'P&ID', 'PFD', 'Cause & effect', 'Flare study', 'Scrubber design basis', 'Vent study', 'Blowdown study', 'Fire case calculation', 'Tube rupture calculation', 'Thermal relief calculation', 'Two-phase relief study', 'Process chemistry hazard study', 'HAZOP report', 'LOPA report', 'Equipment design basis', 'PSV certificate', 'Inspection/test certificate', 'Vendor manual', 'MOC package', 'PSSR package', 'Environmental permit', 'Engineering approval note'];

@Injectable()
export class PsiReliefSystemService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async summary(tenantId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    const count = (predicate: (row: Row) => boolean) => rows.filter(predicate).length;
    return {
      totalReliefBasisRecords: rows.length,
      protectedEquipmentCount: new Set(rows.map((r) => r.protected_equipment_id).filter(Boolean)).size,
      equipmentMissingReliefBasis: count((r) => ['Incomplete', 'Critical Gaps', 'Not Reviewed'].includes(r.completeness_status)),
      safetyCriticalEquipmentMissingReliefBasis: count((r) => r.safety_critical && ['Incomplete', 'Critical Gaps', 'Not Reviewed'].includes(r.completeness_status)),
      reliefDevicesLinked: count((r) => r.devices?.some((d: Row) => !d.removed_at)),
      reliefDevicesNotLinked: count((r) => !r.devices?.some((d: Row) => !d.removed_at)),
      governingCasesDefined: count((r) => r.scenarios?.some((s: Row) => s.governing_case)),
      missingGoverningCase: count((r) => !r.scenarios?.some((s: Row) => s.governing_case)),
      missingReliefCalculation: count((r) => !r.documents?.some((d: Row) => /calculation/i.test(d.document_type))),
      missingReliefDestination: count((r) => !r.discharge?.relief_destination_type),
      missingPidDatasheet: count((r) => !r.documents?.some((d: Row) => /P&ID|datasheet/i.test(d.document_type))),
      reliefBasisConflicts: count((r) => ['Warning', 'Major Conflict', 'Critical Conflict'].includes(r.conflict_status)),
      solConflicts: count((r) => r.conflicts?.some((c: Row) => c.compared_module === 'Safe Operating Limits')),
      equipmentDesignBasisConflicts: count((r) => r.conflicts?.some((c: Row) => c.compared_module === 'Equipment Design Basis')),
      miReliefDeviceConflicts: count((r) => r.conflicts?.some((c: Row) => c.compared_module === 'Mechanical Integrity Relief Device')),
      reviewOverdue: count((r) => this.isReviewOverdue(r)),
      pendingApproval: count((r) => ['Submitted', 'Pending Approval', 'In Review'].includes(r.review_status)),
      mocRequired: count((r) => r.moc_update_required),
      pssrBlockers: count((r) => r.pssr_blocker),
      miReadinessImpact: count((r) => r.mi_readiness_impact),
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
      savedViews: ['All Relief Systems', 'Missing Relief Basis', 'Governing Cases', 'Missing Calculations', 'Relief Conflicts', 'Review Overdue', 'Pending Approval', 'MOC Required', 'PSSR Blockers', 'MI Readiness Impact', 'My Unit Relief Systems'],
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
    const unit = await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId ?? ''));
    const equipment = await this.equipmentRecord(tenantId, scope, unit, String(dto.protected_equipment_id ?? dto.protectedEquipmentId ?? dto.equipment_id ?? dto.equipmentId ?? ''), dto);
    this.validateIdentity(dto);
    await this.ensureNoActiveDuplicate(tenantId, unit.id, equipment.id ?? equipment.equipment_id);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_systems').insert(this.identityPayload(tenantId, actorId, unit, equipment, dto, { created_at: new Date().toISOString(), updated_at: new Date().toISOString() })).select().single()), 'Unable to create relief system.');
    await this.upsertProtectedEquipment(tenantId, actorId, scope, row.id, dto, false);
    if (dto.relief_device_tag ?? dto.reliefDeviceTag ?? dto.mi_relief_device_id ?? dto.miReliefDeviceId) await this.linkDevice(tenantId, actorId, scope, row.id, dto, false);
    const scenarios = Array.isArray(dto.scenarios) ? dto.scenarios : dto.scenario_title || dto.scenarioTitle ? [dto] : [];
    for (const scenario of scenarios) await this.createScenario(tenantId, actorId, scope, row.id, scenario, false);
    await this.upsertSizing(tenantId, actorId, scope, row.id, dto, false);
    await this.upsertDischarge(tenantId, actorId, scope, row.id, dto, false);
    for (const document of Array.isArray(dto.documents) ? dto.documents : []) await this.linkDocument(tenantId, actorId, scope, row.id, document);
    await this.runConflictCheck(tenantId, actorId, scope, row.id);
    await this.runCompleteness(tenantId, actorId, scope, row.id);
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.created', row, null, row, 'Relief system created', `${row.protected_equipment_tag} relief basis created.`);
    return this.detail(tenantId, scope, row.id);
  }

  async update(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, dto: Row, permissions: string[] = []) {
    const before = await this.record(tenantId, scope, reliefSystemId);
    if (before.review_status === 'Approved' && !permissions.includes('psi.relief_system.approve')) throw new ForbiddenException('Approved relief basis is read-only unless controlled edit/MOC is available.');
    const unit = await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId ?? before.unit_id));
    const equipment = await this.equipmentRecord(tenantId, scope, unit, String(dto.protected_equipment_id ?? dto.protectedEquipmentId ?? before.protected_equipment_id), dto);
    this.validateIdentity({ ...before, ...dto });
    const safetyKeys = ['relief_system_type', 'protected_equipment_id', 'relief_device_tag', 'set_pressure', 'rated_capacity', 'required_relief_rate', 'governing_case', 'relief_destination_type', 'destination_system', 'calculation_status'];
    const safetyChanged = safetyKeys.some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined);
    const payload: Row = this.identityPayload(tenantId, actorId, unit, equipment, dto, { updated_at: new Date().toISOString(), moc_update_required: safetyChanged ? true : before.moc_update_required });
    delete payload.created_by;
    delete payload.created_at;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_systems').update(payload).eq('company_id', tenantId).eq('id', reliefSystemId).select().single()), 'Unable to update relief system.');
    if (this.hasProtectedEquipmentFields(dto)) await this.upsertProtectedEquipment(tenantId, actorId, scope, reliefSystemId, dto, false);
    if (this.hasSizingFields(dto)) await this.upsertSizing(tenantId, actorId, scope, reliefSystemId, dto, false);
    if (this.hasDischargeFields(dto)) await this.upsertDischarge(tenantId, actorId, scope, reliefSystemId, dto, false);
    await this.runConflictCheck(tenantId, actorId, scope, reliefSystemId);
    await this.runCompleteness(tenantId, actorId, scope, reliefSystemId);
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.updated', row, before, row, 'Relief system updated', safetyChanged ? 'Safety-sensitive relief basis change may require MOC.' : 'Relief system updated.');
    return this.detail(tenantId, scope, reliefSystemId);
  }

  async detail(tenantId: string, scope: Scope, reliefSystemId: string) {
    const reliefSystem = await this.record(tenantId, scope, reliefSystemId, true);
    const [unit, protectedEquipment, devices, scenarios, sizing, discharge, documents, conflicts, completeness, syncEvents, history] = await Promise.all([
      this.unitRecord(tenantId, scope, reliefSystem.unit_id),
      this.protectedEquipment(tenantId, scope, reliefSystemId),
      this.devices(tenantId, scope, reliefSystemId),
      this.scenarios(tenantId, scope, reliefSystemId),
      this.sizing(tenantId, scope, reliefSystemId),
      this.discharge(tenantId, scope, reliefSystemId),
      this.documents(tenantId, scope, reliefSystemId),
      this.conflicts(tenantId, scope, reliefSystemId),
      this.completeness(tenantId, scope, reliefSystemId),
      this.syncEvents(tenantId, scope, reliefSystemId),
      this.history(tenantId, scope, reliefSystemId)
    ]);
    return {
      reliefSystem,
      unit,
      protectedEquipment,
      devices,
      scenarios,
      sizing,
      discharge,
      documents,
      conflicts,
      completeness,
      syncEvents,
      history,
      overview: this.overview(reliefSystem, protectedEquipment, devices, scenarios, sizing, discharge, documents, conflicts, completeness),
      tabs: this.tabs(reliefSystemId),
      actions: this.actions(reliefSystem, conflicts, completeness)
    };
  }

  async clone(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, dto: Row) {
    const detail = await this.detail(tenantId, scope, reliefSystemId);
    return this.create(tenantId, actorId, scope, {
      ...detail.reliefSystem,
      ...detail.protectedEquipment,
      ...detail.devices[0],
      ...detail.sizing,
      ...detail.discharge,
      protected_equipment_id: dto.protected_equipment_id ?? dto.protectedEquipmentId ?? `${detail.reliefSystem.protected_equipment_id}-clone`,
      protected_equipment_tag: dto.protected_equipment_tag ?? dto.protectedEquipmentTag ?? `${detail.reliefSystem.protected_equipment_tag}-CLONE`,
      relief_basis_title: dto.relief_basis_title ?? dto.reliefBasisTitle ?? `${detail.reliefSystem.relief_basis_title} clone`,
      status: 'Draft',
      review_status: 'Not Reviewed'
    });
  }

  async archive(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, dto: Row) {
    const before = await this.record(tenantId, scope, reliefSystemId);
    if (!dto.reason) throw new BadRequestException('Archive requires a reason.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_systems').update({ archived_at: new Date().toISOString(), archived_by: actorId, archive_reason: dto.reason, status: 'Archived', moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', reliefSystemId).select().single()), 'Unable to archive relief system.');
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.archived', row, before, row, 'Relief system archived', dto.reason);
    return row;
  }

  async reactivate(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, dto: Row) {
    const before = await this.record(tenantId, scope, reliefSystemId, true);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_systems').update({ archived_at: null, archived_by: null, archive_reason: null, status: dto.status ?? 'Draft', moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', reliefSystemId).select().single()), 'Unable to reactivate relief system.');
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.reactivated', row, before, row, 'Relief system reactivated', dto.reason ?? 'Relief system reactivated.');
    return row;
  }

  async protectedEquipment(tenantId: string, scope: Scope, reliefSystemId: string) {
    await this.record(tenantId, scope, reliefSystemId, true);
    return this.safeSingle<Row>(this.db.from('psi_relief_protected_equipment').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).maybeSingle());
  }

  async upsertProtectedEquipment(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, dto: Row, writeEvent = true) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    const before = await this.protectedEquipment(tenantId, scope, reliefSystemId);
    const payload = this.protectedEquipmentPayload(tenantId, system, dto);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_protected_equipment').upsert(payload, { onConflict: 'company_id,relief_system_id' }).select().single()), 'Unable to save protected equipment.');
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.relief_system.protected_equipment.updated', system, before, row, 'Protected equipment basis updated', 'Protected equipment relief basis saved.');
    return row;
  }

  async devices(tenantId: string, scope: Scope, reliefSystemId: string) {
    await this.record(tenantId, scope, reliefSystemId, true);
    return this.safeMany<Row>(this.db.from('psi_relief_device_links').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async linkDevice(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, dto: Row, writeEvent = true) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    const miDevice = await this.miReliefDevice(tenantId, scope, String(dto.mi_relief_device_id ?? dto.miReliefDeviceId ?? ''));
    const payload = this.devicePayload(tenantId, actorId, system, dto, miDevice);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_device_links').insert(payload).select().single()), 'Unable to link relief device.');
    await this.runConflictCheck(tenantId, actorId, scope, reliefSystemId);
    await this.runCompleteness(tenantId, actorId, scope, reliefSystemId);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.relief_system.device.linked', system, null, row, 'Relief device linked', `${row.relief_device_tag} linked.`);
    return row;
  }

  async updateDevice(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, deviceLinkId: string, dto: Row) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    const before = await this.safeSingle<Row>(this.db.from('psi_relief_device_links').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).eq('id', deviceLinkId).maybeSingle());
    if (!before) throw new NotFoundException('Relief device link not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_device_links').update(this.clean({ relief_device_tag: dto.relief_device_tag ?? dto.reliefDeviceTag ?? before.relief_device_tag, relief_device_type: dto.relief_device_type ?? dto.reliefDeviceType ?? before.relief_device_type, set_pressure: this.num(dto.set_pressure ?? dto.setPressure) ?? before.set_pressure, set_pressure_unit: dto.set_pressure_unit ?? dto.setPressureUnit ?? before.set_pressure_unit, rated_capacity: this.num(dto.rated_capacity ?? dto.ratedCapacity) ?? before.rated_capacity, rated_capacity_unit: dto.rated_capacity_unit ?? dto.ratedCapacityUnit ?? before.rated_capacity_unit, orifice_designation: dto.orifice_designation ?? dto.orificeDesignation ?? before.orifice_designation, device_notes: dto.device_notes ?? dto.deviceNotes ?? before.device_notes })).eq('company_id', tenantId).eq('id', deviceLinkId).select().single()), 'Unable to update relief device link.');
    await this.runConflictCheck(tenantId, actorId, scope, reliefSystemId);
    await this.runCompleteness(tenantId, actorId, scope, reliefSystemId);
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.device.updated', system, before, row, 'Relief device link updated', 'Relief device protection data saved.');
    return row;
  }

  async removeDevice(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, deviceLinkId: string, dto: Row) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    const before = await this.safeSingle<Row>(this.db.from('psi_relief_device_links').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).eq('id', deviceLinkId).maybeSingle());
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_device_links').update({ removed_by: actorId, removed_at: new Date().toISOString(), remove_reason: dto.reason ?? null }).eq('company_id', tenantId).eq('id', deviceLinkId).select().single()), 'Unable to remove relief device link.');
    await this.runConflictCheck(tenantId, actorId, scope, reliefSystemId);
    await this.runCompleteness(tenantId, actorId, scope, reliefSystemId);
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.device.removed', system, before, row, 'Relief device link removed', dto.reason ?? 'Device link removed.');
    return row;
  }

  async scenarios(tenantId: string, scope: Scope, reliefSystemId: string) {
    await this.record(tenantId, scope, reliefSystemId, true);
    return this.safeMany<Row>(this.db.from('psi_relief_scenarios').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).order('governing_case', { ascending: false }).order('created_at', { ascending: true }));
  }

  async scenario(tenantId: string, scope: Scope, reliefSystemId: string, scenarioId: string) {
    await this.record(tenantId, scope, reliefSystemId, true);
    const row = await this.safeSingle<Row>(this.db.from('psi_relief_scenarios').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).eq('id', scenarioId).maybeSingle());
    if (!row) throw new NotFoundException('Relief scenario not found.');
    return row;
  }

  async createScenario(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, dto: Row, writeEvent = true) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    if (!dto.scenario_title && !dto.scenarioTitle) throw new BadRequestException('Scenario title is required.');
    if (!dto.scenario_type && !dto.scenarioType) throw new BadRequestException('Scenario type is required.');
    if (dto.governing_case || dto.governingCase) await this.clearGoverning(tenantId, reliefSystemId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_scenarios').insert(this.scenarioPayload(tenantId, actorId, system, dto)).select().single()), 'Unable to create relief scenario.');
    await this.runConflictCheck(tenantId, actorId, scope, reliefSystemId);
    await this.runCompleteness(tenantId, actorId, scope, reliefSystemId);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.relief_system.scenario.created', system, null, row, 'Relief scenario created', row.scenario_title);
    return row;
  }

  async updateScenario(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, scenarioId: string, dto: Row) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    const before = await this.scenario(tenantId, scope, reliefSystemId, scenarioId);
    if (dto.governing_case || dto.governingCase) await this.clearGoverning(tenantId, reliefSystemId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_scenarios').update(this.scenarioPayload(tenantId, actorId, system, { ...before, ...dto }, scenarioId)).eq('company_id', tenantId).eq('id', scenarioId).select().single()), 'Unable to update relief scenario.');
    await this.runConflictCheck(tenantId, actorId, scope, reliefSystemId);
    await this.runCompleteness(tenantId, actorId, scope, reliefSystemId);
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.scenario.updated', system, before, row, 'Relief scenario updated', row.scenario_title);
    return row;
  }

  async deleteScenario(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, scenarioId: string, dto: Row) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    const before = await this.scenario(tenantId, scope, reliefSystemId, scenarioId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_scenarios').delete().eq('company_id', tenantId).eq('id', scenarioId).select().single()), 'Unable to delete relief scenario.');
    await this.runConflictCheck(tenantId, actorId, scope, reliefSystemId);
    await this.runCompleteness(tenantId, actorId, scope, reliefSystemId);
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.scenario.deleted', system, before, row, 'Relief scenario deleted', dto.reason ?? before.scenario_title);
    return row;
  }

  async markGoverning(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, scenarioId: string, dto: Row) {
    const before = await this.scenario(tenantId, scope, reliefSystemId, scenarioId);
    return this.updateScenario(tenantId, actorId, scope, reliefSystemId, scenarioId, { ...before, ...dto, governing_case: true });
  }

  async sizing(tenantId: string, scope: Scope, reliefSystemId: string) {
    await this.record(tenantId, scope, reliefSystemId, true);
    return this.safeSingle<Row>(this.db.from('psi_relief_sizing_capacity_basis').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).maybeSingle());
  }

  async upsertSizing(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, dto: Row, writeEvent = true) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    const before = await this.sizing(tenantId, scope, reliefSystemId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_sizing_capacity_basis').upsert(this.sizingPayload(tenantId, system, dto), { onConflict: 'company_id,relief_system_id' }).select().single()), 'Unable to save sizing/capacity basis.');
    await this.runConflictCheck(tenantId, actorId, scope, reliefSystemId);
    await this.runCompleteness(tenantId, actorId, scope, reliefSystemId);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.relief_system.sizing.updated', system, before, row, 'Sizing / capacity basis updated', 'Relief sizing basis saved.');
    return row;
  }

  async discharge(tenantId: string, scope: Scope, reliefSystemId: string) {
    await this.record(tenantId, scope, reliefSystemId, true);
    return this.safeSingle<Row>(this.db.from('psi_relief_discharge_destinations').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).maybeSingle());
  }

  async upsertDischarge(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, dto: Row, writeEvent = true) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    const before = await this.discharge(tenantId, scope, reliefSystemId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_discharge_destinations').upsert(this.dischargePayload(tenantId, system, dto), { onConflict: 'company_id,relief_system_id' }).select().single()), 'Unable to save discharge/destination basis.');
    await this.runConflictCheck(tenantId, actorId, scope, reliefSystemId);
    await this.runCompleteness(tenantId, actorId, scope, reliefSystemId);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.relief_system.discharge.updated', system, before, row, 'Discharge / destination basis updated', 'Relief destination basis saved.');
    return row;
  }

  async documents(tenantId: string, scope: Scope, reliefSystemId: string) {
    await this.record(tenantId, scope, reliefSystemId, true);
    return this.safeMany<Row>(this.db.from('psi_relief_document_links').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async linkDocument(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, dto: Row) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    if (!dto.document_id && !dto.documentId) throw new BadRequestException('Document Control record is required.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_document_links').upsert({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: system.site_id, relief_system_id: reliefSystemId, document_id: dto.document_id ?? dto.documentId, document_number: dto.document_number ?? dto.documentNumber ?? null, document_title: dto.document_title ?? dto.documentTitle ?? null, document_status: dto.document_status ?? dto.documentStatus ?? null, document_revision: dto.document_revision ?? dto.documentRevision ?? null, document_type: dto.document_type ?? dto.documentType ?? 'Relief calculation', relationship_type: dto.relationship_type ?? dto.relationshipType ?? 'Reference', required: Boolean(dto.required), readiness_impact: Boolean(dto.readiness_impact ?? dto.readinessImpact), linked_by: actorId, linked_at: new Date().toISOString(), removed_at: null, removed_by: null, remove_reason: null }, { onConflict: 'id' }).select().single()), 'Unable to link relief document.');
    await this.runCompleteness(tenantId, actorId, scope, reliefSystemId);
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.document.linked', system, null, row, 'Relief document linked', `${row.document_type}: ${row.document_number ?? row.document_id}.`);
    return row;
  }

  async unlinkDocument(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, documentLinkId: string, dto: Row) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    const before = await this.safeSingle<Row>(this.db.from('psi_relief_document_links').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).eq('id', documentLinkId).maybeSingle());
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_document_links').update({ removed_by: actorId, removed_at: new Date().toISOString(), remove_reason: dto.reason ?? null }).eq('company_id', tenantId).eq('id', documentLinkId).select().single()), 'Unable to remove relief document.');
    await this.runCompleteness(tenantId, actorId, scope, reliefSystemId);
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.document.unlinked', system, before, row, 'Relief document unlinked', dto.reason ?? row.document_id);
    return row;
  }

  async completeness(tenantId: string, scope: Scope, reliefSystemId: string) {
    await this.record(tenantId, scope, reliefSystemId, true);
    return this.safeMany<Row>(this.db.from('psi_relief_completeness_evaluations').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).order('severity'));
  }

  async runCompleteness(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string) {
    const detail = await this.detailForChecks(tenantId, scope, reliefSystemId);
    const system = detail.reliefSystem;
    const governing = detail.scenarios.find((s) => s.governing_case);
    const calculationLinked = detail.documents.some((d) => /calculation/i.test(d.document_type));
    const pidLinked = detail.documents.some((d) => /P&ID/i.test(d.document_type));
    const datasheetLinked = detail.documents.some((d) => /datasheet/i.test(d.document_type));
    const checks = [
      this.check('protected_equipment', 'Protected equipment selected', Boolean(system.protected_equipment_id), 'Critical'),
      this.check('equipment_design_basis', 'Equipment Design Basis exists where required', Boolean(detail.protectedEquipment?.equipment_design_basis_id), system.safety_critical ? 'High' : 'Medium'),
      this.check('relief_type', 'Relief protection type defined', Boolean(system.relief_system_type), 'Critical'),
      this.check('relief_device', 'Relief device linked where required', detail.devices.length > 0, system.safety_critical ? 'Critical' : 'High'),
      this.check('scenario_exists', 'At least one relief scenario exists', detail.scenarios.length > 0, 'Critical'),
      this.check('governing_case', 'Governing case selected', Boolean(governing), 'Critical'),
      this.check('required_rate', 'Required relief rate exists for governing case', !governing || Boolean(governing.required_relief_rate ?? detail.sizing?.required_relief_rate), 'Critical'),
      this.check('rated_capacity', 'Rated capacity exists', Boolean(detail.sizing?.rated_relief_capacity ?? detail.devices[0]?.rated_capacity), 'High'),
      this.check('capacity_margin', 'Rated capacity is greater than or equal to required relief rate', this.capacityOk(detail), 'Critical'),
      this.check('set_pressure', 'Set pressure exists', Boolean(detail.sizing?.set_pressure ?? detail.devices[0]?.set_pressure), 'High'),
      this.check('mawp_design_pressure', 'MAWP/design pressure exists', Boolean(detail.protectedEquipment?.mawp ?? detail.protectedEquipment?.design_pressure), 'Critical'),
      this.check('destination', 'Relief destination defined', Boolean(detail.discharge?.relief_destination_type), 'Critical'),
      this.check('calculation_document', 'Relief calculation linked', calculationLinked || detail.sizing?.calculation_status === 'Waived With Approval', system.safety_critical ? 'Critical' : 'High'),
      this.check('pid_document', 'P&ID linked', pidLinked, 'Medium'),
      this.check('device_datasheet', 'Device datasheet linked', datasheetLinked, 'Medium'),
      this.check('owner', 'Owner assigned', Boolean(system.owner_user_id), system.safety_critical ? 'Critical' : 'Medium'),
      this.check('review_date', 'Review date exists and is not overdue', Boolean(system.next_review_due) && !this.isReviewOverdue(system), 'Medium'),
      this.check('mi_status', 'MI relief device status checked if linked', !detail.devices[0]?.mi_relief_device_id || Boolean(detail.devices[0]?.mi_device_status), 'High'),
      this.check('conflicts_checked', 'Conflicts checked', detail.conflicts.length > 0 || system.conflict_status === 'No Conflict', 'Medium')
    ];
    await this.db.many(this.db.from('psi_relief_completeness_evaluations').delete().eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).select('id')).catch(() => null);
    for (const item of checks) {
      await this.db.single(this.db.from('psi_relief_completeness_evaluations').insert({ id: randomUUID(), company_id: tenantId, site_id: system.site_id, relief_system_id: system.id, unit_id: system.unit_id, protected_equipment_id: system.protected_equipment_id, check_key: item.key, check_title: item.title, status: item.complete ? 'Complete' : 'Missing', severity: item.severity, message: item.complete ? null : item.message, pssr_blocker: !item.complete && item.severity === 'Critical', mi_readiness_impact: !item.complete && ['relief_device', 'mi_status', 'capacity_margin'].includes(item.key), action_required: !item.complete, owner_user_id: system.owner_user_id, evaluated_at: new Date().toISOString() }).select('id').single()).catch(() => null);
    }
    const critical = checks.filter((c) => !c.complete && c.severity === 'Critical').length;
    const missing = checks.filter((c) => !c.complete).length;
    const score = Math.round((checks.filter((c) => c.complete).length / checks.length) * 100);
    const status = critical ? 'Critical Gaps' : missing > 4 ? 'Incomplete' : missing ? 'Mostly Complete' : 'Complete';
    const pssr = critical > 0 && Boolean(system.safety_critical || system.psm_critical);
    const miImpact = checks.some((c) => !c.complete && ['relief_device', 'mi_status', 'capacity_margin'].includes(c.key));
    await this.db.single(this.db.from('psi_relief_systems').update({ completeness_score: score, completeness_status: status, pssr_blocker: pssr, mi_readiness_impact: miImpact, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', reliefSystemId).select('id').single()).catch(() => null);
    await this.upsertUnitCompleteness(tenantId, system, status, critical, pssr);
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.completeness.run', system, null, { score, status, critical }, 'Relief completeness checked', `${status} (${score}%).`);
    return this.completeness(tenantId, scope, reliefSystemId);
  }

  async conflicts(tenantId: string, scope: Scope, reliefSystemId: string) {
    await this.record(tenantId, scope, reliefSystemId, true);
    return this.safeMany<Row>(this.db.from('psi_relief_conflict_results').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).order('created_at', { ascending: false }));
  }

  async runConflictCheck(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string) {
    const detail = await this.detailForChecks(tenantId, scope, reliefSystemId);
    const system = detail.reliefSystem;
    const results: Row[] = [];
    const required = this.num(detail.sizing?.required_relief_rate ?? detail.scenarios.find((s) => s.governing_case)?.required_relief_rate);
    const rated = this.num(detail.sizing?.rated_relief_capacity ?? detail.devices[0]?.rated_capacity);
    const setPressure = this.num(detail.sizing?.set_pressure ?? detail.devices[0]?.set_pressure);
    const mawp = this.num(detail.protectedEquipment?.mawp ?? detail.protectedEquipment?.design_pressure);
    if (required !== null && rated !== null && rated < required) results.push(this.conflict(system, 'Capacity shortfall', 'Critical Conflict', 'Critical', 'Rated relief capacity is lower than required relief rate.', 'Relief Systems', null, { rated }, { required }));
    if (setPressure !== null && mawp !== null && setPressure > mawp) results.push(this.conflict(system, 'Set pressure exceeds MAWP', 'Critical Conflict', 'Critical', 'Relief set pressure exceeds protected equipment MAWP/design pressure.', 'Equipment Design Basis', detail.protectedEquipment?.equipment_design_basis_id ?? null, { mawp }, { setPressure }));
    if (!detail.scenarios.some((s) => s.governing_case)) results.push(this.conflict(system, 'Missing governing case', 'Major Conflict', 'High', 'No relief scenario is marked as governing case.', 'Relief Systems', null, {}, {}));
    if (!detail.documents.some((d) => /calculation/i.test(d.document_type))) results.push(this.conflict(system, 'Missing relief calculation', system.safety_critical ? 'Critical Conflict' : 'Warning', system.safety_critical ? 'Critical' : 'Medium', 'No current relief calculation is linked.', 'Document Control', null, {}, {}));
    if (!detail.discharge?.relief_destination_type) results.push(this.conflict(system, 'Missing relief destination', 'Major Conflict', 'High', 'Relief discharge destination is missing.', 'Relief Systems', null, {}, {}));
    if (/atmosphere/i.test(String(detail.discharge?.relief_destination_type ?? '')) && (detail.discharge?.toxic_release_concern || detail.discharge?.flammable_release_concern)) results.push(this.conflict(system, 'Atmospheric discharge concern', 'Major Conflict', 'High', 'Toxic/flammable relief to atmosphere requires approved basis.', 'Relief Systems', null, {}, detail.discharge));
    if (detail.devices.some((d) => /failed|overdue|impaired|bypass/i.test(`${d.mi_device_status} ${d.mi_impairment_status}`))) results.push(this.conflict(system, 'MI relief device readiness', 'Major Conflict', 'High', 'Linked MI relief device is failed, overdue, impaired, or bypassed.', 'Mechanical Integrity Relief Device', detail.devices[0]?.mi_relief_device_id ?? null, {}, detail.devices[0] ?? {}));
    await this.db.many(this.db.from('psi_relief_conflict_results').delete().eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).select('id')).catch(() => null);
    for (const item of results) await this.db.single(this.db.from('psi_relief_conflict_results').insert(item).select('id').single()).catch(() => null);
    const status = this.worstConflict(results);
    await this.db.single(this.db.from('psi_relief_systems').update({ conflict_status: status, pssr_blocker: status === 'Critical Conflict' ? true : system.pssr_blocker, moc_update_required: status !== 'No Conflict' ? true : system.moc_update_required, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', reliefSystemId).select('id').single()).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.conflict_check.run', system, null, { status, count: results.length }, 'Relief conflict check run', `${status}: ${results.length} result(s).`);
    return this.conflicts(tenantId, scope, reliefSystemId);
  }

  async overrideConflict(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, conflictId: string, dto: Row) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    if (!dto.reason) throw new BadRequestException('Conflict override requires a reason.');
    const before = await this.safeSingle<Row>(this.db.from('psi_relief_conflict_results').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).eq('id', conflictId).maybeSingle());
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_conflict_results').update({ conflict_status: 'Override Approved', override_approved: true, override_reason: dto.reason, override_approved_by: actorId, override_approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', conflictId).select().single()), 'Unable to override relief conflict.');
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.conflict.override', system, before, row, 'Relief conflict override approved', dto.reason);
    return this.conflicts(tenantId, scope, reliefSystemId);
  }

  async miDiff(tenantId: string, scope: Scope, reliefSystemId: string) {
    const detail = await this.detailForChecks(tenantId, scope, reliefSystemId);
    const device = detail.devices[0];
    const mi = await this.miReliefDevice(tenantId, scope, String(device?.mi_relief_device_id ?? ''));
    const technical = mi ? await this.safeSingle<Row>(this.db.from('mi_relief_device_technical_data').select('*').eq('relief_device_id', mi.id).maybeSingle()) : null;
    const basis = mi ? await this.safeSingle<Row>(this.db.from('mi_relief_device_basis').select('*').eq('relief_device_id', mi.id).maybeSingle()) : null;
    const pairs = [
      ['relief_device_tag', device?.relief_device_tag, mi?.device_tag],
      ['relief_device_type', device?.relief_device_type, mi?.device_type],
      ['set_pressure', device?.set_pressure ?? detail.sizing?.set_pressure, technical?.set_pressure],
      ['rated_capacity', device?.rated_capacity ?? detail.sizing?.rated_relief_capacity, technical?.rated_capacity],
      ['orifice_designation', device?.orifice_designation, technical?.orifice_designation],
      ['relief_basis', detail.sizing?.calculation_reference, basis?.relief_basis]
    ];
    return { miReliefDevice: mi, miTechnicalData: technical, miBasis: basis, differences: pairs.filter(([, psi, miValue]) => String(psi ?? '') !== String(miValue ?? '')).map(([field, psi, miValue]) => ({ field, psi, mi: miValue })) };
  }

  async syncFromMi(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, dto: Row) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    const diff = await this.miDiff(tenantId, scope, reliefSystemId);
    const event = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_mi_sync_events').insert({ id: randomUUID(), company_id: tenantId, site_id: system.site_id, relief_system_id: reliefSystemId, mi_relief_device_id: diff.miReliefDevice?.id ?? null, sync_direction: 'Pull from MI Relief Device', source_module: 'Mechanical Integrity Relief Device', target_module: 'PSI Relief Systems', status: dto.apply === true ? 'Applied with confirmation' : 'Compare Only', field_diff_json: diff.differences, applied_changes_json: dto.apply === true ? dto.appliedChanges ?? {} : null, skipped_changes_json: dto.skippedChanges ?? {}, sync_reason: dto.reason ?? 'MI relief device sync/compare requested.', synced_by: actorId }).select().single()), 'Unable to create MI sync event.');
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.mi_sync', system, null, event, 'MI relief device sync/compare recorded', event.status);
    return { event, diff };
  }

  async syncToMi(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, dto: Row) {
    const system = await this.record(tenantId, scope, reliefSystemId);
    const event = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_mi_sync_events').insert({ id: randomUUID(), company_id: tenantId, site_id: system.site_id, relief_system_id: reliefSystemId, mi_relief_device_id: dto.mi_relief_device_id ?? dto.miReliefDeviceId ?? null, sync_direction: 'Push approved PSI relief basis to MI', source_module: 'PSI Relief Systems', target_module: 'Mechanical Integrity Relief Device', status: 'Pending policy approval', field_diff_json: dto.fieldDiff ?? null, applied_changes_json: null, skipped_changes_json: dto.skippedChanges ?? {}, sync_reason: dto.reason ?? 'Push requested. Existing MI relief data was not overwritten.', synced_by: actorId }).select().single()), 'Unable to create MI sync event.');
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.mi_push_requested', system, null, event, 'MI relief push requested', 'Policy-controlled MI update event recorded.');
    return event;
  }

  compareOnly(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string) {
    return this.syncFromMi(tenantId, actorId, scope, reliefSystemId, { apply: false, reason: 'Compare only.' });
  }

  async submitReview(tenantId: string, actorId: string, scope: Scope, reliefSystemId: string, dto: Row) {
    const before = await this.record(tenantId, scope, reliefSystemId);
    await this.runConflictCheck(tenantId, actorId, scope, reliefSystemId);
    await this.runCompleteness(tenantId, actorId, scope, reliefSystemId);
    const current = await this.record(tenantId, scope, reliefSystemId);
    if (current.conflict_status === 'Critical Conflict') throw new BadRequestException('Critical relief conflicts must be resolved or overridden before review.');
    if (current.completeness_status === 'Critical Gaps') throw new BadRequestException('Critical relief completeness gaps must be resolved before review.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_relief_systems').update({ review_status: 'Submitted', status: 'Under Review', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', reliefSystemId).select().single()), 'Unable to submit relief basis review.');
    await this.writeHistory(tenantId, actorId, 'psi.relief_system.review.submitted', row, before, row, 'Relief basis submitted for review', dto.reason ?? 'Review requested.');
    return row;
  }

  async history(tenantId: string, scope: Scope, reliefSystemId: string) {
    await this.record(tenantId, scope, reliefSystemId, true);
    return this.safeMany<Row>(this.db.from('psi_relief_history_events').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).order('created_at', { ascending: false }).limit(150));
  }

  async syncEvents(tenantId: string, scope: Scope, reliefSystemId: string) {
    await this.record(tenantId, scope, reliefSystemId, true);
    return this.safeMany<Row>(this.db.from('psi_relief_mi_sync_events').select('*').eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).order('synced_at', { ascending: false }).limit(50));
  }

  importTemplate() {
    return { columns: ['unit_code', 'protected_equipment_tag', 'relief_basis_title', 'relief_system_type', 'relief_device_tag', 'relief_device_type', 'set_pressure', 'set_pressure_unit', 'rated_capacity', 'rated_capacity_unit', 'scenario_title', 'scenario_type', 'governing_case', 'required_relief_rate', 'required_relief_rate_unit', 'relieving_pressure', 'relieving_temperature', 'relief_destination_type', 'destination_system', 'calculation_reference', 'calculation_status', 'owner_email', 'source_document_reference'], reliefSystemTypes, reliefDeviceTypes, scenarioTypes, destinationTypes, calculationStatuses };
  }

  async importPreview(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const preview = rows.map((row: Row, index: number) => ({ rowNumber: index + 1, raw: row, errors: [!row.unit_id && !row.unit_code ? 'unit_code/unit_id is required' : null, !row.protected_equipment_tag && !row.protected_equipment_id ? 'protected_equipment_tag/protected_equipment_id is required' : null, !row.relief_basis_title ? 'relief_basis_title is required' : null, !row.relief_system_type ? 'relief_system_type is required' : null].filter(Boolean), warnings: [!row.scenario_title ? 'No relief scenario in row' : null, !row.calculation_reference ? 'No calculation reference in row' : null].filter(Boolean) }));
    return this.db.single<Row>(this.db.from('psi_relief_import_jobs').insert({ id: randomUUID(), company_id: tenantId, site_id: this.selectedSite(scope), uploaded_by: actorId, file_name: dto.fileName ?? 'relief-systems-import.csv', file_key: dto.fileKey ?? null, status: preview.some((r: Row) => r.errors.length) ? 'Errors' : 'Preview Ready', total_rows: preview.length, valid_rows: preview.filter((r: Row) => !r.errors.length).length, error_rows: preview.filter((r: Row) => r.errors.length).length, preview_json: preview }).select().single());
  }

  async exportRows(tenantId: string, actorId: string, scope: Scope, query: Row) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    if (rows[0]) await this.writeHistory(tenantId, actorId, 'psi.relief_system.exported', rows[0], null, { count: rows.length, query }, 'Relief systems exported', `${rows.length} rows exported.`);
    return { rows, exportedAt: new Date().toISOString(), format: query.format ?? 'json' };
  }

  lookups(key: string) {
    const map: Record<string, string[]> = {
      'relief-system-types': reliefSystemTypes,
      'relief-device-types': reliefDeviceTypes,
      'relief-scenario-types': scenarioTypes,
      'relief-destination-types': destinationTypes,
      'calculation-statuses': calculationStatuses,
      'relief-conflict-statuses': conflictStatuses,
      'relief-document-types': documentTypes
    };
    return map[key] ?? [];
  }

  private async registryRows(tenantId: string, scope: Scope, query: Row = {}, paginate = false, page = 1, limit = 25) {
    let request: any = this.applyScope(this.db.from('psi_relief_systems').select('*, psi_relief_device_links(*), psi_relief_scenarios(*), psi_relief_sizing_capacity_basis(*), psi_relief_discharge_destinations(*), psi_relief_document_links(*), psi_relief_conflict_results(conflict_status,compared_module)').eq('company_id', tenantId), scope);
    if (query.unitId ?? query.unit_id) request = request.eq('unit_id', query.unitId ?? query.unit_id);
    if (query.equipmentId ?? query.equipment_id) request = request.eq('protected_equipment_id', query.equipmentId ?? query.equipment_id);
    if (query.conflictStatus ?? query.conflict_status) request = request.eq('conflict_status', query.conflictStatus ?? query.conflict_status);
    if (query.completenessStatus ?? query.completeness_status) request = request.eq('completeness_status', query.completenessStatus ?? query.completeness_status);
    if (query.reviewStatus ?? query.review_status) request = request.eq('review_status', query.reviewStatus ?? query.review_status);
    if (query.mocRequired ?? query.moc_required) request = request.eq('moc_update_required', true);
    if (query.pssrBlocker ?? query.pssr_blocker) request = request.eq('pssr_blocker', true);
    if (query.miReadinessImpact ?? query.mi_readiness_impact) request = request.eq('mi_readiness_impact', true);
    if (query.governingCases ?? query.governing_cases) request = request.eq('psi_relief_scenarios.governing_case', true);
    if (query.search) request = request.or(`protected_equipment_tag.ilike.%${query.search}%,relief_basis_title.ilike.%${query.search}%`);
    if (!query.includeArchived) request = request.is('archived_at', null);
    const sort = String(query.sort ?? 'updated_at.desc').split('.');
    request = request.order(this.safeSortColumn(sort[0] ?? 'updated_at'), { ascending: sort[1] === 'asc' });
    if (paginate) request = request.range((page - 1) * limit, page * limit - 1);
    const rows = await this.safeMany<Row>(request);
    return rows.map((row) => this.normalize(row)).filter((row) => {
      if (query.missing) return ['Incomplete', 'Critical Gaps', 'Not Reviewed'].includes(row.completeness_status);
      if (query.reviewOverdue) return this.isReviewOverdue(row);
      if (query.mocRequired) return row.moc_update_required;
      if (query.pssrBlockers) return row.pssr_blocker;
      return true;
    });
  }

  private normalize(row: Row): Row {
    const devices = Array.isArray(row.psi_relief_device_links) ? row.psi_relief_device_links.filter((d: Row) => !d.removed_at) : [];
    const scenarios = Array.isArray(row.psi_relief_scenarios) ? row.psi_relief_scenarios : [];
    const sizing = Array.isArray(row.psi_relief_sizing_capacity_basis) ? row.psi_relief_sizing_capacity_basis[0] : row.psi_relief_sizing_capacity_basis;
    const discharge = Array.isArray(row.psi_relief_discharge_destinations) ? row.psi_relief_discharge_destinations[0] : row.psi_relief_discharge_destinations;
    const documents = Array.isArray(row.psi_relief_document_links) ? row.psi_relief_document_links.filter((d: Row) => !d.removed_at) : [];
    const conflicts = Array.isArray(row.psi_relief_conflict_results) ? row.psi_relief_conflict_results : [];
    return { ...row, devices, scenarios, sizing, discharge, documents, conflicts };
  }

  private async detailForChecks(tenantId: string, scope: Scope, reliefSystemId: string) {
    const reliefSystem = await this.record(tenantId, scope, reliefSystemId, true);
    const [protectedEquipment, devices, scenarios, sizing, discharge, documents, conflicts] = await Promise.all([this.protectedEquipment(tenantId, scope, reliefSystemId), this.devices(tenantId, scope, reliefSystemId), this.scenarios(tenantId, scope, reliefSystemId), this.sizing(tenantId, scope, reliefSystemId), this.discharge(tenantId, scope, reliefSystemId), this.documents(tenantId, scope, reliefSystemId), this.conflicts(tenantId, scope, reliefSystemId)]);
    return { reliefSystem, protectedEquipment, devices, scenarios, sizing, discharge, documents, conflicts };
  }

  private identityPayload(tenantId: string, actorId: string, unit: Row, equipment: Row, dto: Row, extras: Row = {}) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: unit.site_id, unit_id: unit.id, area_id: dto.area_id ?? dto.areaId ?? unit.area_id ?? equipment.areaId ?? null, protected_equipment_id: equipment.id ?? equipment.equipment_id, protected_equipment_tag: dto.protected_equipment_tag ?? dto.protectedEquipmentTag ?? equipment.tag ?? equipment.equipment_tag, relief_basis_title: dto.relief_basis_title ?? dto.reliefBasisTitle, relief_system_type: dto.relief_system_type ?? dto.reliefSystemType, system_service: dto.system_service ?? dto.systemService ?? null, criticality: dto.criticality ?? equipment.criticality ?? 'Medium', safety_critical: Boolean(dto.safety_critical ?? dto.safetyCritical ?? equipment.safetyCritical), psm_critical: Boolean(dto.psm_critical ?? dto.psmCritical ?? equipment.psmCritical), status: dto.status ?? 'Draft', owner_user_id: dto.owner_user_id ?? dto.ownerUserId ?? null, process_engineer_id: dto.process_engineer_id ?? dto.processEngineerId ?? null, mechanical_engineer_id: dto.mechanical_engineer_id ?? dto.mechanicalEngineerId ?? null, relief_engineer_id: dto.relief_engineer_id ?? dto.reliefEngineerId ?? null, mi_owner_id: dto.mi_owner_id ?? dto.miOwnerId ?? null, operations_owner_id: dto.operations_owner_id ?? dto.operationsOwnerId ?? null, hse_reviewer_id: dto.hse_reviewer_id ?? dto.hseReviewerId ?? null, last_review_date: this.dateOrNull(dto.last_review_date ?? dto.lastReviewDate), next_review_due: this.dateOrNull(dto.next_review_due ?? dto.nextReviewDue), review_status: dto.review_status ?? dto.reviewStatus ?? 'Not Reviewed', created_by: actorId, updated_by: actorId, ...extras });
  }

  private protectedEquipmentPayload(tenantId: string, system: Row, dto: Row) {
    const fields = ['equipment_design_basis_id','mawp','mop','design_pressure','design_temperature','normal_operating_pressure','normal_operating_temperature','max_safe_operating_pressure','max_safe_operating_temperature','service_fluid','fluid_phase','maximum_intended_inventory','volume_capacity','material_of_construction','corrosive_service','toxic_service','flammable_service','reactive_service','equipment_isolation_note','protected_system_boundary','connected_equipment_json','pid_document_id','design_basis_document_id'];
    const row: Row = { id: dto.protected_equipment_section_id ?? randomUUID(), company_id: tenantId, site_id: system.site_id, relief_system_id: system.id, equipment_id: system.protected_equipment_id, equipment_tag: system.protected_equipment_tag, equipment_name: dto.equipment_name ?? dto.equipmentName ?? null, equipment_type: dto.equipment_type ?? dto.equipmentType ?? null, updated_at: new Date().toISOString() };
    for (const field of fields) row[field] = this.field(dto, field);
    return this.clean(row);
  }

  private devicePayload(tenantId: string, actorId: string, system: Row, dto: Row, mi: Row | null) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: system.site_id, relief_system_id: system.id, mi_relief_device_id: dto.mi_relief_device_id ?? dto.miReliefDeviceId ?? mi?.id ?? null, relief_device_tag: dto.relief_device_tag ?? dto.reliefDeviceTag ?? mi?.device_tag, relief_device_type: dto.relief_device_type ?? dto.reliefDeviceType ?? mi?.device_type ?? 'PSV', set_pressure: this.num(dto.set_pressure ?? dto.setPressure ?? mi?.set_pressure), set_pressure_unit: dto.set_pressure_unit ?? dto.setPressureUnit ?? mi?.set_pressure_unit ?? null, rated_capacity: this.num(dto.rated_capacity ?? dto.ratedCapacity ?? mi?.rated_capacity), rated_capacity_unit: dto.rated_capacity_unit ?? dto.ratedCapacityUnit ?? mi?.rated_capacity_unit ?? null, orifice_designation: dto.orifice_designation ?? dto.orificeDesignation ?? mi?.orifice_designation ?? null, inlet_size: dto.inlet_size ?? dto.inletSize ?? null, outlet_size: dto.outlet_size ?? dto.outletSize ?? null, manufacturer: dto.manufacturer ?? mi?.manufacturer ?? null, model: dto.model ?? mi?.model ?? null, serial_number: dto.serial_number ?? dto.serialNumber ?? mi?.serial_number ?? null, installation_location: dto.installation_location ?? dto.installationLocation ?? mi?.installation_location ?? null, protected_equipment_relationship: dto.protected_equipment_relationship ?? dto.protectedEquipmentRelationship ?? null, mi_device_status: dto.mi_device_status ?? dto.miDeviceStatus ?? mi?.status ?? null, mi_last_test_date: this.dateOrNull(dto.mi_last_test_date ?? dto.miLastTestDate ?? mi?.last_test_date), mi_next_test_due: this.dateOrNull(dto.mi_next_test_due ?? dto.miNextTestDue ?? mi?.next_test_due_date), mi_certificate_status: dto.mi_certificate_status ?? dto.miCertificateStatus ?? mi?.certificate_status ?? null, mi_seal_status: dto.mi_seal_status ?? dto.miSealStatus ?? mi?.seal_status ?? null, mi_impairment_status: dto.mi_impairment_status ?? dto.miImpairmentStatus ?? mi?.impairment_status ?? null, device_notes: dto.device_notes ?? dto.deviceNotes ?? null, linked_by: actorId, linked_at: new Date().toISOString() });
  }

  private scenarioPayload(tenantId: string, actorId: string, system: Row, dto: Row, id?: string) {
    const fields = ['scenario_description','cause_initiating_event','involved_chemicals_json','fluid_phase','relieving_fluid','relieving_temperature','relieving_pressure','required_relief_rate','required_relief_rate_unit','required_vapor_rate','required_liquid_rate','two_phase_flow','governing_case','calculation_method_basis','assumptions','existing_safeguards','related_process_chemistry_scenario_id','related_safe_operating_limit_id','related_hazop_deviation_id','related_lopa_scenario_id','related_moc_id','consequence_if_not_relieved','scenario_severity','calculation_document_id','notes'];
    const row: Row = { id: id ?? dto.id ?? randomUUID(), company_id: tenantId, site_id: system.site_id, relief_system_id: system.id, unit_id: system.unit_id, protected_equipment_id: system.protected_equipment_id, scenario_title: dto.scenario_title ?? dto.scenarioTitle, scenario_type: dto.scenario_type ?? dto.scenarioType, created_by: actorId, updated_by: actorId, updated_at: new Date().toISOString() };
    for (const field of fields) row[field] = this.field(dto, field);
    return this.clean(row);
  }

  private sizingPayload(tenantId: string, system: Row, dto: Row) {
    const fields = ['governing_scenario_id','required_relief_rate','required_relief_rate_unit','rated_relief_capacity','rated_capacity_unit','capacity_margin','relieving_pressure','relieving_temperature','set_pressure','accumulation_basis','backpressure_basis','inlet_pressure_drop_basis','outlet_pressure_drop_basis','relief_fluid_phase','molecular_weight_density_note','compressibility_vapor_liquid_note','two_phase_flow_basis','fire_wetted_area_basis','heat_input_basis','orifice_vent_area','sizing_method','calculation_reference','calculation_status','independent_verification_status','notes'];
    const row: Row = { id: dto.sizing_id ?? randomUUID(), company_id: tenantId, site_id: system.site_id, relief_system_id: system.id, updated_at: new Date().toISOString(), calculation_status: dto.calculation_status ?? dto.calculationStatus ?? 'Not Started' };
    for (const field of fields) if (this.field(dto, field) !== undefined) row[field] = this.field(dto, field);
    return this.clean(row);
  }

  private dischargePayload(tenantId: string, system: Row, dto: Row) {
    const fields = ['relief_destination_type','destination_system','flare_header','scrubber','vent_stack','atmosphere_location','closed_drain','blowdown_system','containment','safe_location_assessment','toxic_release_concern','flammable_release_concern','environmental_release_concern','noise_concern','thermal_radiation_concern','backpressure_source','disposal_treatment_basis','downstream_system_capacity','isolation_car_seal_requirements','discharge_piping_notes','discharge_pid_document_id','flare_study_document_id','environmental_permit_document_id','emergency_response_note'];
    const row: Row = { id: dto.discharge_id ?? randomUUID(), company_id: tenantId, site_id: system.site_id, relief_system_id: system.id, updated_at: new Date().toISOString() };
    for (const field of fields) row[field] = this.field(dto, field);
    return this.clean(row);
  }

  private async record(tenantId: string, scope: Scope, reliefSystemId: string, includeArchived = false) {
    let request: any = this.applyScope(this.db.from('psi_relief_systems').select('*').eq('company_id', tenantId).eq('id', reliefSystemId), scope);
    if (!includeArchived) request = request.is('archived_at', null);
    const row = await this.safeSingle<Row>(request.maybeSingle());
    if (!row) throw new NotFoundException('Relief system not found or outside your company/site access.');
    return row;
  }

  private async unitRecord(tenantId: string, scope: Scope, unitId: string) {
    if (!unitId) throw new BadRequestException('Process unit is required.');
    const row = await this.safeSingle<Row>(this.applyScope(this.db.from('psi_units').select('*').eq('company_id', tenantId).eq('id', unitId), scope).maybeSingle());
    if (!row) throw new NotFoundException('Process unit not found or outside your company/site access.');
    return row;
  }

  private async equipmentRecord(tenantId: string, scope: Scope, unit: Row, equipmentId: string, dto: Row) {
    if (!equipmentId) throw new BadRequestException('Protected equipment is required.');
    const link = await this.safeSingle<Row>(this.db.from('psi_unit_equipment_links').select('*').eq('company_id', tenantId).eq('unit_id', unit.id).eq('equipment_id', equipmentId).maybeSingle());
    const equipment = await this.safeSingle<Row>(this.db.from('Equipment').select('id,tag,name,type,status,criticality,safetyCritical,psmCritical,siteId,unitId,areaId').eq('tenantId', tenantId).eq('id', equipmentId).maybeSingle());
    if (equipment && equipment.siteId !== unit.site_id) throw new BadRequestException('Protected equipment must belong to the same company/site/unit as the PSI unit.');
    if (equipment && equipment.unitId && equipment.unitId !== unit.id) throw new BadRequestException('Protected equipment must belong to the selected PSI unit.');
    if (!equipment && !link && !dto.protected_equipment_tag && !dto.protectedEquipmentTag) throw new BadRequestException('Protected equipment must exist in Equipment Registry/PSI unit links or include a verified equipment tag snapshot.');
    return equipment ?? { id: equipmentId, equipment_id: equipmentId, tag: dto.protected_equipment_tag ?? dto.protectedEquipmentTag ?? equipmentId, name: dto.equipment_name ?? dto.equipmentName ?? equipmentId, type: dto.equipment_type ?? dto.equipmentType ?? 'Other', criticality: dto.criticality ?? 'Medium', siteId: unit.site_id, unitId: unit.id, areaId: unit.area_id };
  }

  private async miReliefDevice(tenantId: string, scope: Scope, deviceId: string) {
    if (!deviceId) return null;
    const device = await this.safeSingle<Row>(this.applyScope(this.db.from('mi_relief_devices').select('*').eq('company_id', tenantId).eq('id', deviceId), scope).maybeSingle());
    if (!device) throw new NotFoundException('MI relief device not found or outside your company/site access.');
    return device;
  }

  private async ensureNoActiveDuplicate(tenantId: string, unitId: string, equipmentId: string) {
    const existing = await this.safeSingle<Row>(this.db.from('psi_relief_systems').select('id').eq('company_id', tenantId).eq('unit_id', unitId).eq('protected_equipment_id', equipmentId).is('archived_at', null).maybeSingle());
    if (existing) throw new BadRequestException('This protected equipment already has an active PSI Relief Systems record.');
  }

  private async clearGoverning(tenantId: string, reliefSystemId: string) {
    await this.db.many(this.db.from('psi_relief_scenarios').update({ governing_case: false, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('relief_system_id', reliefSystemId).select('id')).catch(() => null);
  }

  private async upsertUnitCompleteness(tenantId: string, system: Row, status: string, critical: number, pssr: boolean) {
    await this.db.single(this.db.from('psi_completeness_evaluations').upsert({ id: randomUUID(), company_id: tenantId, site_id: system.site_id, unit_id: system.unit_id, category: 'Relief systems', requirement_name: `Relief systems - ${system.protected_equipment_tag}`, status: status === 'Complete' ? 'Complete' : 'Missing', severity: critical ? 'Critical' : 'High', missing_reason: status === 'Complete' ? null : `Relief system completeness is ${status}.`, linked_module: 'PSI Relief Systems', linked_record_id: system.id, readiness_impact: pssr ? 'PSSR blocker' : 'MI readiness / PSI completeness', pssr_blocker: pssr, evaluated_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'company_id,unit_id,category,requirement_name' }).select('id').single()).catch(() => null);
  }

  private overview(system: Row, protectedEquipment: Row | null, devices: Row[], scenarios: Row[], sizing: Row | null, discharge: Row | null, documents: Row[], conflicts: Row[], completeness: Row[]) {
    const governing = scenarios.find((s) => s.governing_case);
    const device = devices[0];
    return { cards: [
      { label: 'Protected equipment', value: system.protected_equipment_tag, tone: 'neutral' },
      { label: 'Unit / area', value: `${system.unit_id}${system.area_id ? ` / ${system.area_id}` : ''}`, tone: 'neutral' },
      { label: 'Relief device tag', value: device?.relief_device_tag ?? 'Missing', tone: device ? 'neutral' : 'warn' },
      { label: 'Relief system type', value: system.relief_system_type, tone: 'neutral' },
      { label: 'Set pressure', value: this.withUnit(sizing?.set_pressure ?? device?.set_pressure, sizing?.set_pressure_unit ?? device?.set_pressure_unit), tone: sizing?.set_pressure || device?.set_pressure ? 'neutral' : 'warn' },
      { label: 'MAWP / design pressure', value: `${this.withUnit(protectedEquipment?.mawp, '')} / ${this.withUnit(protectedEquipment?.design_pressure, '')}`, tone: protectedEquipment?.mawp || protectedEquipment?.design_pressure ? 'neutral' : 'warn' },
      { label: 'Governing scenario', value: governing?.scenario_title ?? 'Missing', tone: governing ? 'neutral' : 'warn' },
      { label: 'Required relief rate', value: this.withUnit(sizing?.required_relief_rate ?? governing?.required_relief_rate, sizing?.required_relief_rate_unit ?? governing?.required_relief_rate_unit), tone: sizing?.required_relief_rate || governing?.required_relief_rate ? 'neutral' : 'warn' },
      { label: 'Rated capacity', value: this.withUnit(sizing?.rated_relief_capacity ?? device?.rated_capacity, sizing?.rated_capacity_unit ?? device?.rated_capacity_unit), tone: sizing?.rated_relief_capacity || device?.rated_capacity ? 'neutral' : 'warn' },
      { label: 'Capacity margin', value: sizing?.capacity_margin ?? this.capacityMargin(sizing, device, governing) ?? 'Not calculated', tone: 'neutral' },
      { label: 'Relief destination', value: discharge?.relief_destination_type ?? 'Missing', tone: discharge?.relief_destination_type ? 'neutral' : 'warn' },
      { label: 'Calculation status', value: sizing?.calculation_status ?? 'Not Started', tone: sizing?.calculation_status === 'Approved' ? 'good' : 'warn' },
      { label: 'Device status from MI', value: device?.mi_device_status ?? 'Not linked', tone: /failed|overdue|impaired/i.test(String(device?.mi_device_status ?? device?.mi_impairment_status ?? '')) ? 'danger' : 'neutral' },
      { label: 'Completeness status', value: `${system.completeness_status}${system.completeness_score !== null ? ` (${system.completeness_score}%)` : ''}`, tone: system.completeness_status === 'Complete' ? 'good' : 'warn' },
      { label: 'Conflict status', value: system.conflict_status, tone: system.conflict_status === 'Critical Conflict' ? 'danger' : system.conflict_status === 'No Conflict' ? 'good' : 'warn' },
      { label: 'Review status', value: system.review_status, tone: 'neutral' },
      { label: 'MOC required', value: system.moc_update_required ? 'Yes' : 'No', tone: system.moc_update_required ? 'warn' : 'neutral' },
      { label: 'PSSR blocker', value: system.pssr_blocker ? 'Yes' : 'No', tone: system.pssr_blocker ? 'danger' : 'good' },
      { label: 'MI readiness impact', value: system.mi_readiness_impact ? 'Yes' : 'No', tone: system.mi_readiness_impact ? 'warn' : 'good' },
      { label: 'PSI completeness impact', value: completeness.some((c) => c.status !== 'Complete') ? 'Open gaps' : 'No open gaps', tone: completeness.some((c) => c.status !== 'Complete') ? 'warn' : 'good' }
    ], protectedEquipment, devices, scenarios, sizing, discharge, documents, conflicts, completeness };
  }

  private actions(system: Row, conflicts: Row[], completeness: Row[]) {
    const locked = system.review_status === 'Approved';
    const criticalConflict = conflicts.some((c) => c.conflict_status === 'Critical Conflict' && !c.override_approved);
    const missingCritical = completeness.some((c) => c.status !== 'Complete' && c.severity === 'Critical');
    return [
      { key: 'edit', label: 'Edit', enabled: !locked, disabledReason: locked ? 'Approved relief basis requires controlled edit/MOC.' : null },
      { key: 'link-device', label: 'Link Relief Device', enabled: !locked, disabledReason: locked ? 'Approved relief basis is read-only.' : null },
      { key: 'add-scenario', label: 'Add Relief Scenario', enabled: !locked, disabledReason: locked ? 'Approved relief basis is read-only.' : null },
      { key: 'sync-mi', label: 'Compare / Sync MI', enabled: !locked, disabledReason: locked ? 'Approved relief basis cannot sync without controlled edit.' : null },
      { key: 'run-completeness', label: 'Run Completeness Check', enabled: true },
      { key: 'run-conflict-check', label: 'Run Conflict Check', enabled: true },
      { key: 'submit-review', label: 'Submit for Review', enabled: !locked && !criticalConflict && !missingCritical, disabledReason: criticalConflict ? 'Critical relief conflicts must be resolved or overridden first.' : missingCritical ? 'Critical relief completeness gaps must be resolved before review.' : null }
    ];
  }

  private tabs(id: string) {
    const base = `/process-safety-information/relief-systems/${id}`;
    return ['Overview', 'Protected Equipment', 'Relief Device / Protection', 'Relief Scenarios', 'Sizing / Capacity Basis', 'Discharge / Destination', 'Conflicts / Completeness', 'Linked Records', 'Documents', 'Review & Approval', 'Change History'].map((label) => ({ label, href: base, enabled: true }));
  }

  private conflict(system: Row, type: string, status: string, severity: string, message: string, comparedModule: string, comparedRecordId: string | null, compared: Row, current: Row) {
    return { id: randomUUID(), company_id: system.company_id, site_id: system.site_id, relief_system_id: system.id, protected_equipment_id: system.protected_equipment_id, conflict_type: type, conflict_status: status, severity, message, compared_module: comparedModule, compared_record_id: comparedRecordId, compared_value_json: compared, current_value_json: current, override_required: ['Major Conflict', 'Critical Conflict'].includes(status), override_approved: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  }

  private check(key: string, title: string, complete: boolean, severity: string) {
    return { key, title, complete, severity, message: `${title} is missing or incomplete.` };
  }

  private validateIdentity(dto: Row) {
    this.requireText(dto.unit_id ?? dto.unitId, 'Process unit is required.');
    this.requireText(dto.protected_equipment_id ?? dto.protectedEquipmentId ?? dto.equipment_id ?? dto.equipmentId, 'Protected equipment is required.');
    this.requireText(dto.relief_basis_title ?? dto.reliefBasisTitle, 'Relief basis title is required.');
    this.requireText(dto.relief_system_type ?? dto.reliefSystemType, 'Relief system type is required.');
    if ((dto.safety_critical || dto.safetyCritical || dto.psm_critical || dto.psmCritical) && !(dto.owner_user_id ?? dto.ownerUserId)) throw new BadRequestException('Safety-critical or PSM-critical relief basis requires owner assignment.');
  }

  private hasProtectedEquipmentFields(dto: Row) { return ['mawp','mop','design_pressure','design_temperature','service_fluid','fluid_phase','material_of_construction'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private hasSizingFields(dto: Row) { return ['required_relief_rate','rated_relief_capacity','set_pressure','calculation_status','calculation_reference'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private hasDischargeFields(dto: Row) { return ['relief_destination_type','destination_system','flare_header','scrubber','vent_stack','atmosphere_location'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private capacityOk(detail: Row) { const required = this.num(detail.sizing?.required_relief_rate ?? detail.scenarios.find((s: Row) => s.governing_case)?.required_relief_rate); const rated = this.num(detail.sizing?.rated_relief_capacity ?? detail.devices[0]?.rated_capacity); return required === null || rated === null || rated >= required; }
  private capacityMargin(sizing: Row | null, device: Row | undefined, governing: Row | undefined) { const required = this.num(sizing?.required_relief_rate ?? governing?.required_relief_rate); const rated = this.num(sizing?.rated_relief_capacity ?? device?.rated_capacity); return required !== null && rated !== null ? rated - required : null; }
  private field(dto: Row, field: string) { const value = dto[field] ?? dto[this.camel(field)]; if (typeof value === 'boolean') return value; if (field.endsWith('_json')) return value ?? null; if (['mawp','mop','design_pressure','design_temperature','normal_operating_pressure','normal_operating_temperature','max_safe_operating_pressure','max_safe_operating_temperature','maximum_intended_inventory','volume_capacity','relieving_temperature','relieving_pressure','required_relief_rate','required_vapor_rate','required_liquid_rate','rated_relief_capacity','capacity_margin','set_pressure'].includes(field)) return this.num(value); return value === '' ? null : value; }
  private applyScope(query: any, scope: Scope, column = 'site_id') { if (scope.corporateView) return query; if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId); if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds); return query; }
  private selectedSite(scope: Scope) { return scope.selectedSiteId ?? scope.allowedSiteIds?.[0] ?? null; }
  private isReviewOverdue(row: Row) { if (!row.next_review_due) return false; return new Date(row.next_review_due).getTime() < Date.now(); }
  private worstConflict(results: Row[]) { if (results.some((r) => r.conflict_status === 'Critical Conflict' && !r.override_approved)) return 'Critical Conflict'; if (results.some((r) => r.conflict_status === 'Major Conflict' && !r.override_approved)) return 'Major Conflict'; if (results.some((r) => r.conflict_status === 'Warning')) return 'Warning'; if (results.some((r) => r.conflict_status === 'Override Approved')) return 'Override Approved'; return 'No Conflict'; }
  private safeSortColumn(column: string) { return new Set(['updated_at', 'created_at', 'protected_equipment_tag', 'relief_basis_title', 'relief_system_type', 'criticality', 'review_status', 'conflict_status', 'completeness_status']).has(column) ? column : 'updated_at'; }
  private num(value: unknown) { if (value === null || value === undefined || value === '') return null; const n = Number(value); return Number.isFinite(n) ? n : null; }
  private requireText(value: unknown, message: string) { if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(message); return value.trim(); }
  private requireRow<T>(row: T | null | undefined, message: string): T { if (!row) throw new BadRequestException(message); return row; }
  private async safeSingle<T>(query: PromiseLike<any>) { try { return await this.db.single<T>(query); } catch { return null; } }
  private async safeMany<T>(query: PromiseLike<any>) { try { return await this.db.many<T>(query); } catch { return []; } }
  private dateOrNull(value: unknown) { if (!value) return null; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? null : date.toISOString(); }
  private camel(value: string) { return value.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }
  private clean<T extends Row>(value: T): T { return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T; }
  private withUnit(value: unknown, unit: unknown) { return value === null || value === undefined || value === '' ? 'Not defined' : `${value}${unit ? ` ${unit}` : ''}`; }

  private async writeHistory(tenantId: string, actorId: string, action: string, system: Row, before: any, after: any, title: string, description?: string | null) {
    await this.audit.write({ tenantId, actorId, action, entityType: 'PSI_RELIEF_SYSTEM', entityId: system.id, before: before as JsonValue, after: after as JsonValue }).catch(() => null);
    await this.db.single(this.db.from('psi_relief_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: system.site_id, unit_id: system.unit_id, protected_equipment_id: system.protected_equipment_id, relief_system_id: system.id, event_type: action, event_title: title, event_description: description ?? null, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId, source_record_id: system.id }).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('psi_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: system.site_id, unit_id: system.unit_id, event_type: action, event_title: title, event_description: description ?? null, source_module: 'PSI Relief Systems', source_record_id: system.id, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId }).select('id').single()).catch(() => null);
  }
}
