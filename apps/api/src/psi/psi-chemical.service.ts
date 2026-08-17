import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type SiteScope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type Row = Record<string, any>;

const physicalStates = ['Solid', 'Liquid', 'Gas', 'Vapor', 'Aerosol', 'Slurry', 'Mixture', 'Unknown'];
const chemicalCategories = ['Raw material', 'Intermediate', 'Product', 'Byproduct', 'Waste', 'Utility', 'Catalyst', 'Solvent', 'Additive', 'Cleaning chemical', 'Laboratory chemical', 'Other'];
const useTypes = ['Feed', 'Intermediate', 'Product', 'Byproduct', 'Waste', 'Utility', 'Catalyst', 'Solvent', 'Cleaning', 'Maintenance', 'Other'];
const ghsHazardClasses = ['Explosive', 'Flammable', 'Oxidizer', 'Gas under pressure', 'Corrosive', 'Acute toxicity', 'Skin irritation', 'Eye damage', 'Respiratory sensitizer', 'Carcinogen', 'Mutagen', 'Reproductive toxicity', 'Specific target organ toxicity', 'Aspiration hazard', 'Aquatic toxicity'];
const sdsStatuses = ['Current', 'Missing', 'Expired', 'Pending Approval', 'Superseded', 'Rejected', 'Waived With Approval', 'Not Required'];
const storageClasses = ['Flammable liquid', 'Combustible liquid', 'Corrosive acid', 'Corrosive base', 'Oxidizer', 'Organic peroxide', 'Water reactive', 'Air reactive', 'Toxic', 'Compressed gas', 'Cryogenic', 'General chemical', 'Unknown'];
const compatibilityRiskLevels = ['Not Reviewed', 'Low', 'Medium', 'High', 'Critical'];

@Injectable()
export class PsiChemicalService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async summary(tenantId: string, scope: SiteScope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    const count = (predicate: (row: Row) => boolean) => rows.filter(predicate).length;
    return {
      totalChemicals: rows.length,
      currentSds: count((row) => row.sds_status === 'Current'),
      missingSds: count((row) => row.sds_status === 'Missing'),
      expiredSds: count((row) => row.sds_status === 'Expired'),
      highHazardChemicals: count((row) => row.high_hazard),
      flammableChemicals: count((row) => this.text(row).includes('flamm')),
      toxicChemicals: count((row) => this.text(row).includes('toxic')),
      reactiveChemicals: count((row) => this.text(row).includes('reactive')),
      corrosiveChemicals: count((row) => this.text(row).includes('corrosive')),
      carcinogenCmrFlagged: count((row) => row.carcinogen_flag || row.mutagen_flag || row.reproductive_toxicity_flag),
      incompatibleStorageRisks: count((row) => ['High', 'Critical'].includes(row.compatibility_risk_level)),
      missingExposureLimits: count((row) => row.exposure_limit_status === 'Missing'),
      missingEmergencyResponseInfo: count((row) => row.emergency_response_status === 'Missing'),
      mocUpdateRequired: count((row) => row.moc_update_required),
      lastUpdated: new Date().toISOString()
    };
  }

  async registry(tenantId: string, scope: SiteScope, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const rows = await this.registryRows(tenantId, scope, query, true, page, limit);
    const totalRows = await this.registryRows(tenantId, scope, query, false);
    return {
      rows,
      page,
      limit,
      total: totalRows.length,
      summary: await this.summary(tenantId, scope, query),
      savedViews: ['All Chemicals', 'Missing SDS', 'Expired SDS', 'High Hazard', 'Flammable', 'Toxic', 'Reactive', 'Corrosive', 'Incompatible Storage', 'Missing Exposure Limits', 'MOC Required', 'My Unit Chemicals'],
      lastUpdated: new Date().toISOString()
    };
  }

  async unitChemicals(tenantId: string, scope: SiteScope, unitId: string, query: Row = {}) {
    await this.unitRecord(tenantId, scope, unitId);
    return this.registry(tenantId, scope, { ...query, unitId });
  }

  async createChemical(tenantId: string, actorId: string, scope: SiteScope, dto: Row) {
    const unit = await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId ?? ''));
    this.validateChemicalInput(dto, false);
    const payload = this.chemicalPayload(tenantId, actorId, unit, dto, { created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_chemicals').insert(payload).select().single()), 'Unable to create PSI chemical.');
    await this.upsertSectionRows(tenantId, actorId, row, dto);
    if (dto.sds_id || dto.sdsId || dto.document_id || dto.documentId || dto.waiver_reason || dto.waiverReason) await this.linkSds(tenantId, actorId, scope, row.id, dto);
    await this.refreshChemicalStatus(tenantId, actorId, scope, row.id, 'psi.chemical.created');
    await this.writeHistory(tenantId, actorId, 'psi.chemical.created', row, null, row, 'Chemical created', `${row.chemical_name} added to ${unit.unit_code}.`);
    return this.detail(tenantId, scope, row.id);
  }

  async updateChemical(tenantId: string, actorId: string, scope: SiteScope, chemicalId: string, dto: Row, permissions: string[] = []) {
    const before = await this.chemicalRecord(tenantId, scope, chemicalId);
    if (before.review_status === 'Approved' && !permissions.includes('psi.chemical.approve')) throw new ForbiddenException('Approved PSI chemical records are read-only unless controlled edit/MOC permission exists.');
    const unit = await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId ?? before.unit_id));
    this.validateChemicalInput({ ...before, ...dto }, true);
    const majorChanged = ['chemical_name', 'cas_number', 'process_use', 'use_type', 'max_intended_inventory', 'storage_condition', 'high_hazard', 'chemical_database_id'].some((key) => dto[key] !== undefined && dto[key] !== before[key]);
    const patch: Row = this.chemicalPayload(tenantId, actorId, unit, dto, { updated_at: new Date().toISOString(), moc_update_required: majorChanged ? true : before.moc_update_required });
    delete patch.created_by;
    delete patch.created_at;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_chemicals').update(patch).eq('company_id', tenantId).eq('id', chemicalId).select().single()), 'Unable to update PSI chemical.');
    await this.upsertSectionRows(tenantId, actorId, row, dto);
    await this.refreshChemicalStatus(tenantId, actorId, scope, row.id, 'psi.chemical.updated');
    await this.writeHistory(tenantId, actorId, 'psi.chemical.updated', row, before, row, 'Chemical updated', majorChanged ? 'Chemical change may require MOC review.' : 'Chemical profile updated.');
    return this.detail(tenantId, scope, row.id);
  }

  async detail(tenantId: string, scope: SiteScope, chemicalId: string) {
    const chemical = await this.chemicalRecord(tenantId, scope, chemicalId);
    const [unit, sdsLinks, hazards, exposureHealth, storageCompatibility, emergencyControls, compatibilityChecks, history] = await Promise.all([
      this.unitRecord(tenantId, scope, chemical.unit_id),
      this.sdsLinks(tenantId, scope, chemicalId),
      this.section(tenantId, scope, chemicalId, 'psi_chemical_hazards'),
      this.section(tenantId, scope, chemicalId, 'psi_chemical_exposure_health'),
      this.section(tenantId, scope, chemicalId, 'psi_chemical_storage_compatibility'),
      this.section(tenantId, scope, chemicalId, 'psi_chemical_emergency_controls'),
      this.safeMany<Row>(this.db.from('psi_chemical_compatibility_checks').select('*').eq('company_id', tenantId).eq('chemical_id', chemicalId).order('created_at', { ascending: false })),
      this.safeMany<Row>(this.db.from('psi_chemical_history_events').select('*').eq('company_id', tenantId).eq('chemical_id', chemicalId).order('created_at', { ascending: false }).limit(100))
    ]);
    return {
      chemical,
      unit,
      sdsLinks,
      hazards,
      exposureHealth,
      storageCompatibility,
      emergencyControls,
      compatibilityChecks,
      history,
      overview: this.overview(chemical, sdsLinks, hazards, exposureHealth, storageCompatibility, emergencyControls, compatibilityChecks),
      tabs: this.tabs(chemicalId),
      actions: this.actions(chemical)
    };
  }

  async archiveChemical(tenantId: string, actorId: string, scope: SiteScope, chemicalId: string, dto: Row) {
    const before = await this.chemicalRecord(tenantId, scope, chemicalId);
    if (!dto.reason) throw new BadRequestException('Archive requires a reason.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_chemicals').update({ archived_at: new Date().toISOString(), archived_by: actorId, archive_reason: dto.reason, status: 'Archived', moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', chemicalId).select().single()), 'Unable to archive PSI chemical.');
    await this.writeHistory(tenantId, actorId, 'psi.chemical.archived', row, before, row, 'Chemical archived', dto.reason);
    await this.updateUnitCompleteness(tenantId, actorId, scope, row.unit_id);
    return row;
  }

  async reactivateChemical(tenantId: string, actorId: string, scope: SiteScope, chemicalId: string, dto: Row) {
    const before = await this.chemicalRecord(tenantId, scope, chemicalId, true);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_chemicals').update({ archived_at: null, archived_by: null, archive_reason: null, status: dto.status ?? 'Active', moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', chemicalId).select().single()), 'Unable to reactivate PSI chemical.');
    await this.writeHistory(tenantId, actorId, 'psi.chemical.reactivated', row, before, row, 'Chemical reactivated', dto.reason ?? 'Chemical reactivated.');
    await this.updateUnitCompleteness(tenantId, actorId, scope, row.unit_id);
    return row;
  }

  async sdsLinks(tenantId: string, scope: SiteScope, chemicalId: string) {
    await this.chemicalRecord(tenantId, scope, chemicalId, true);
    return this.safeMany<Row>(this.db.from('psi_chemical_sds_links').select('*').eq('company_id', tenantId).eq('chemical_id', chemicalId).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async linkSds(tenantId: string, actorId: string, scope: SiteScope, chemicalId: string, dto: Row) {
    const chemical = await this.chemicalRecord(tenantId, scope, chemicalId);
    const status = this.calculateSdsStatus(dto);
    const payload = this.clean({
      id: dto.id ?? randomUUID(),
      company_id: tenantId,
      site_id: chemical.site_id,
      chemical_id: chemicalId,
      sds_id: dto.sds_id ?? dto.sdsId ?? null,
      document_id: dto.document_id ?? dto.documentId ?? null,
      supplier_name: dto.supplier_name ?? dto.supplierName ?? null,
      manufacturer_name: dto.manufacturer_name ?? dto.manufacturerName ?? null,
      sds_version: dto.sds_version ?? dto.sdsVersion ?? null,
      sds_issue_date: this.dateOrNull(dto.sds_issue_date ?? dto.sdsIssueDate),
      sds_review_date: this.dateOrNull(dto.sds_review_date ?? dto.sdsReviewDate),
      sds_expiry_date: this.dateOrNull(dto.sds_expiry_date ?? dto.sdsExpiryDate),
      language: dto.language ?? null,
      jurisdiction: dto.jurisdiction ?? null,
      sds_status: status,
      approved_sds: Boolean(dto.approved_sds ?? dto.approvedSds),
      waiver_reason: dto.waiver_reason ?? dto.waiverReason ?? null,
      waiver_requested_by: dto.waiver_reason || dto.waiverReason ? actorId : null,
      waiver_requested_at: dto.waiver_reason || dto.waiverReason ? new Date().toISOString() : null,
      source_snapshot_json: dto.sourceSnapshot ?? null,
      linked_by: actorId
    });
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_chemical_sds_links').insert(payload).select().single()), 'Unable to link SDS.');
    await this.refreshChemicalStatus(tenantId, actorId, scope, chemicalId, 'psi.chemical.sds.linked');
    await this.writeHistory(tenantId, actorId, 'psi.chemical.sds.linked', chemical, null, row, 'SDS linked', `SDS status: ${row.sds_status}.`);
    return this.sdsLinks(tenantId, scope, chemicalId);
  }

  async removeSds(tenantId: string, actorId: string, scope: SiteScope, chemicalId: string, linkId: string, dto: Row) {
    const chemical = await this.chemicalRecord(tenantId, scope, chemicalId);
    const before = await this.safeSingle<Row>(this.db.from('psi_chemical_sds_links').select('*').eq('company_id', tenantId).eq('chemical_id', chemicalId).eq('id', linkId).single());
    if (!before) throw new NotFoundException('SDS link not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_chemical_sds_links').update({ removed_by: actorId, removed_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', linkId).select().single()), 'Unable to remove SDS link.');
    await this.refreshChemicalStatus(tenantId, actorId, scope, chemicalId, 'psi.chemical.sds.removed');
    await this.writeHistory(tenantId, actorId, 'psi.chemical.sds.removed', chemical, before, row, 'SDS unlinked', dto.reason ?? 'SDS link removed.');
    return this.sdsLinks(tenantId, scope, chemicalId);
  }

  async runSdsCheck(tenantId: string, actorId: string, scope: SiteScope, chemicalId: string) {
    const chemical = await this.chemicalRecord(tenantId, scope, chemicalId);
    const status = await this.refreshChemicalStatus(tenantId, actorId, scope, chemicalId, 'psi.chemical.sds.checked');
    await this.writeHistory(tenantId, actorId, 'psi.chemical.sds.checked', chemical, chemical, { ...chemical, sds_status: status }, 'SDS status checked', `Official SDS status is ${status}.`);
    return this.detail(tenantId, scope, chemicalId);
  }

  async requestWaiver(tenantId: string, actorId: string, scope: SiteScope, chemicalId: string, dto: Row) {
    if (!dto.reason && !dto.waiverReason) throw new BadRequestException('SDS waiver requires a reason.');
    return this.linkSds(tenantId, actorId, scope, chemicalId, { ...dto, waiver_reason: dto.reason ?? dto.waiverReason, sds_status: 'Pending Approval' });
  }

  async decideWaiver(tenantId: string, actorId: string, scope: SiteScope, chemicalId: string, linkId: string, decision: 'Approved' | 'Rejected', dto: Row) {
    const chemical = await this.chemicalRecord(tenantId, scope, chemicalId);
    const before = await this.safeSingle<Row>(this.db.from('psi_chemical_sds_links').select('*').eq('company_id', tenantId).eq('chemical_id', chemicalId).eq('id', linkId).single());
    if (!before) throw new NotFoundException('SDS waiver request not found.');
    const patch = decision === 'Approved'
      ? { sds_status: 'Waived With Approval', approved_sds: false, waiver_approved_by: actorId, waiver_approved_at: new Date().toISOString() }
      : { sds_status: 'Rejected', waiver_rejected_by: actorId, waiver_rejected_at: new Date().toISOString(), waiver_rejection_reason: dto.reason ?? null };
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_chemical_sds_links').update(patch).eq('company_id', tenantId).eq('id', linkId).select().single()), 'Unable to update waiver.');
    await this.refreshChemicalStatus(tenantId, actorId, scope, chemicalId, `psi.chemical.sds.waiver.${decision.toLowerCase()}`);
    await this.writeHistory(tenantId, actorId, `psi.chemical.sds.waiver.${decision.toLowerCase()}`, chemical, before, row, `SDS waiver ${decision.toLowerCase()}`, dto.reason ?? row.waiver_reason);
    return this.sdsLinks(tenantId, scope, chemicalId);
  }

  async patchSection(tenantId: string, actorId: string, scope: SiteScope, chemicalId: string, section: 'hazards' | 'exposure' | 'storage' | 'emergency', dto: Row) {
    const chemical = await this.chemicalRecord(tenantId, scope, chemicalId);
    const table = this.sectionTable(section);
    const before = await this.section(tenantId, scope, chemicalId, table);
    const payload: Row = this.sectionPayload(section, tenantId, chemical.site_id, chemicalId, dto);
    const row = this.requireRow(await this.db.single<Row>(this.db.from(table).upsert(payload, { onConflict: 'company_id,chemical_id' }).select().single()), `Unable to update ${section}.`);
    await this.refreshChemicalStatus(tenantId, actorId, scope, chemicalId, `psi.chemical.${section}.updated`);
    await this.writeHistory(tenantId, actorId, `psi.chemical.${section}.updated`, chemical, before, row, `${section} updated`, `${section} information updated.`);
    return this.detail(tenantId, scope, chemicalId);
  }

  async runCompatibilityCheck(tenantId: string, actorId: string, scope: SiteScope, chemicalId: string, dto: Row = {}) {
    const chemical = await this.chemicalRecord(tenantId, scope, chemicalId);
    const storage = await this.section(tenantId, scope, chemicalId, 'psi_chemical_storage_compatibility');
    const warnings = this.compatibilityWarnings(storage ?? {}, dto);
    const rows = [];
    for (const warning of warnings) {
      const row = await this.db.single<Row>(this.db.from('psi_chemical_compatibility_checks').insert({
        id: randomUUID(),
        company_id: tenantId,
        site_id: chemical.site_id,
        unit_id: chemical.unit_id,
        chemical_id: chemicalId,
        compared_chemical_id: dto.comparedChemicalId ?? null,
        compared_material: dto.comparedMaterial ?? null,
        check_type: warning.checkType,
        result_status: warning.resultStatus,
        risk_level: warning.riskLevel,
        warning_message: warning.warningMessage,
        evidence_source: warning.evidenceSource,
        action_required: warning.actionRequired,
        created_by: actorId
      }).select().single());
      if (row) rows.push(row);
    }
    if (!warnings.length) {
      const row = await this.db.single<Row>(this.db.from('psi_chemical_compatibility_checks').insert({
        id: randomUUID(),
        company_id: tenantId,
        site_id: chemical.site_id,
        unit_id: chemical.unit_id,
        chemical_id: chemicalId,
        check_type: 'Structured rules foundation',
        result_status: 'No warning identified',
        risk_level: 'Low',
        warning_message: null,
        evidence_source: 'PSI structured compatibility fields',
        action_required: false,
        created_by: actorId
      }).select().single());
      if (row) rows.push(row);
    }
    await this.refreshChemicalStatus(tenantId, actorId, scope, chemicalId, 'psi.chemical.compatibility.checked');
    await this.writeHistory(tenantId, actorId, 'psi.chemical.compatibility.checked', chemical, null, rows, 'Compatibility check completed', rows.some((row) => row.action_required) ? 'Compatibility warning requires mitigation/action.' : 'No structured compatibility warning identified.');
    return this.detail(tenantId, scope, chemicalId);
  }

  async searchChemicalDatabase(tenantId: string, scope: SiteScope, search = '') {
    const tables = ['chemicals', 'Chemical'];
    const rows: Row[] = [];
    for (const table of tables) {
      const tenantColumn = table === 'Chemical' ? 'tenantId' : 'tenant_id';
      const siteColumn = table === 'Chemical' ? 'siteId' : 'site_id';
      let request: any = this.db.from(table).select('*').eq(tenantColumn, tenantId).limit(25);
      request = this.applyGenericScope(request, scope, siteColumn);
      const data = await this.safeMany<Row>(request);
      rows.push(...data.map((row) => ({ ...row, sourceTable: table })));
    }
    return rows.filter((row) => !search || `${row.name ?? row.chemical_name ?? row.chemicalName ?? ''} ${row.cas_number ?? row.casNumber ?? ''}`.toLowerCase().includes(search.toLowerCase())).slice(0, 50);
  }

  async searchSdsLibrary(tenantId: string, scope: SiteScope, search = '') {
    const tables = ['sds_records', 'documents', 'Document'];
    const rows: Row[] = [];
    for (const table of tables) {
      const tenantColumn = table === 'Document' ? 'tenantId' : 'tenant_id';
      const siteColumn = table === 'Document' ? 'siteId' : 'site_id';
      let request: any = this.db.from(table).select('*').eq(tenantColumn, tenantId).limit(25);
      request = this.applyGenericScope(request, scope, siteColumn);
      const data = await this.safeMany<Row>(request);
      rows.push(...data.map((row) => ({ ...row, sourceTable: table })));
    }
    return rows.filter((row) => !search || `${row.document_number ?? row.documentNumber ?? row.title ?? row.chemical_name ?? ''}`.toLowerCase().includes(search.toLowerCase())).slice(0, 50);
  }

  async syncFromChemicalDatabase(tenantId: string, actorId: string, scope: SiteScope, chemicalId: string, dto: Row) {
    const chemical = await this.chemicalRecord(tenantId, scope, chemicalId);
    if (!dto.chemicalDatabaseId && !dto.record) throw new BadRequestException('Chemical Database record is required.');
    const snapshot = dto.record ?? { id: dto.chemicalDatabaseId };
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_chemicals').update({ chemical_database_id: dto.chemicalDatabaseId ?? snapshot.id, chemical_database_snapshot_json: snapshot, moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', chemicalId).select().single()), 'Unable to sync chemical database record.');
    await this.writeHistory(tenantId, actorId, 'psi.chemical.database.synced', row, chemical, row, 'Chemical Database snapshot synced', 'Canonical chemical record snapshot linked without silently overwriting approved PSI fields.');
    return this.detail(tenantId, scope, chemicalId);
  }

  async syncFromSds(tenantId: string, actorId: string, scope: SiteScope, chemicalId: string, dto: Row) {
    if (!dto.sdsId && !dto.documentId && !dto.record) throw new BadRequestException('SDS Library or Document Control record is required.');
    return this.linkSds(tenantId, actorId, scope, chemicalId, {
      ...dto,
      sds_id: dto.sdsId ?? dto.record?.id,
      document_id: dto.documentId,
      sourceSnapshot: dto.record
    });
  }

  importTemplate() {
    return {
      columns: ['unit_code', 'area', 'chemical_name', 'common_name', 'cas_number', 'formula', 'physical_state', 'chemical_category', 'process_use', 'use_type', 'normal_inventory', 'max_intended_inventory', 'inventory_unit', 'storage_condition', 'supplier_name', 'sds_reference', 'ghs_hazard_classes', 'signal_word', 'nfpa_health', 'nfpa_fire', 'nfpa_reactivity', 'oel_value', 'storage_class', 'incompatible_chemicals', 'required_ppe', 'emergency_response_notes'],
      supportedFormats: ['.xlsx', '.csv'],
      validationRules: ['Unit must exist and be accessible.', 'CAS format is validated if provided.', 'Max inventory and inventory unit are required.', 'Duplicate chemical in the same unit is warned before commit.']
    };
  }

  async importPreview(tenantId: string, actorId: string, scope: SiteScope, dto: Row) {
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const preview = [];
    for (const [index, row] of rows.entries()) {
      const errors = [];
      if (!row.unit_code && !row.unitId) errors.push('unit_code is required.');
      if (!row.chemical_name && !row.chemicalName) errors.push('chemical_name is required.');
      if (!row.max_intended_inventory && !row.maxIntendedInventory) errors.push('max_intended_inventory is required.');
      if (!row.inventory_unit && !row.inventoryUnit) errors.push('inventory_unit is required.');
      preview.push({ rowNumber: index + 1, row, errors });
    }
    const job = await this.db.single<Row>(this.db.from('psi_chemical_import_jobs').insert({
      id: randomUUID(),
      company_id: tenantId,
      site_id: this.selectedSite(scope),
      uploaded_by: actorId,
      file_name: dto.fileName ?? 'inline-import.csv',
      file_key: dto.fileKey ?? null,
      status: preview.some((row) => row.errors.length) ? 'Errors' : 'Preview Ready',
      total_rows: preview.length,
      valid_rows: preview.filter((row) => !row.errors.length).length,
      error_rows: preview.filter((row) => row.errors.length).length,
      preview_json: preview
    }).select().single());
    return job;
  }

  async exportRows(tenantId: string, actorId: string, scope: SiteScope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    if (rows.length) {
      const first = rows[0];
      if (first) await this.writeHistory(tenantId, actorId, 'psi.chemical.exported', first, null, { count: rows.length, query }, 'Chemical registry exported', `${rows.length} chemical rows exported.`);
    }
    return { rows, format: query.format ?? 'json', generatedAt: new Date().toISOString() };
  }

  lookups(kind: string) {
    const map: Record<string, string[]> = {
      'chemical-categories': chemicalCategories,
      'physical-states': physicalStates,
      'chemical-use-types': useTypes,
      'ghs-hazard-classes': ghsHazardClasses,
      'sds-statuses': sdsStatuses,
      'storage-classes': storageClasses,
      'compatibility-risk-levels': compatibilityRiskLevels
    };
    return map[kind] ?? [];
  }

  private async registryRows(tenantId: string, scope: SiteScope, query: Row, paginated: boolean, page = 1, limit = 25) {
    let request: any = this.applyScope(this.db.from('psi_chemicals').select(`
      *,
      psi_chemical_hazards(*),
      psi_chemical_exposure_health(*),
      psi_chemical_storage_compatibility(*),
      psi_chemical_emergency_controls(*)
    `).eq('company_id', tenantId), scope);
    if (query.includeArchived !== 'true') request = request.is('archived_at', null);
    if (query.unitId || query.unit_id) request = request.eq('unit_id', query.unitId ?? query.unit_id);
    if (query.areaId || query.area_id) request = request.eq('area_id', query.areaId ?? query.area_id);
    if (query.search) request = request.or(`chemical_name.ilike.%${query.search}%,cas_number.ilike.%${query.search}%,formula.ilike.%${query.search}%`);
    if (query.physicalState) request = request.eq('physical_state', query.physicalState);
    if (query.chemicalCategory) request = request.eq('chemical_category', query.chemicalCategory);
    if (query.sdsStatus) request = request.eq('sds_status', query.sdsStatus);
    if (query.highHazard === 'true') request = request.eq('high_hazard', true);
    if (query.mocRequired === 'true') request = request.eq('moc_update_required', true);
    if (query.compatibilityRisk) request = request.eq('compatibility_risk_level', query.compatibilityRisk);
    if (query.missingExposureLimits === 'true') request = request.eq('exposure_limit_status', 'Missing');
    const sort = String(query.sort ?? 'updated_at.desc');
    const [column, direction] = sort.split('.');
    request = request.order(this.safeSortColumn(column ?? 'updated_at'), { ascending: direction !== 'desc' });
    if (paginated) request = request.range((page - 1) * limit, page * limit - 1);
    const rows = await this.safeMany<Row>(request);
    return rows.map((row) => this.flattenChemical(row));
  }

  private validateChemicalInput(dto: Row, partial: boolean) {
    if (!partial || dto.chemical_name !== undefined || dto.chemicalName !== undefined) this.requireText(dto.chemical_name ?? dto.chemicalName, 'Chemical name is required.');
    if (!partial || dto.process_use !== undefined || dto.processUse !== undefined) this.requireText(dto.process_use ?? dto.processUse, 'Process use is required.');
    if (!partial || dto.max_intended_inventory !== undefined || dto.maxIntendedInventory !== undefined) {
      if (dto.max_intended_inventory === undefined && dto.maxIntendedInventory === undefined) throw new BadRequestException('Maximum intended inventory is required.');
    }
    if (!partial || dto.inventory_unit !== undefined || dto.inventoryUnit !== undefined) this.requireText(dto.inventory_unit ?? dto.inventoryUnit, 'Inventory unit is required.');
    const cas = dto.cas_number ?? dto.casNumber;
    const mixture = Boolean(dto.is_mixture ?? dto.isMixture);
    if (!partial && !mixture && !cas && !(dto.cas_unknown_reason ?? dto.casUnknownReason)) throw new BadRequestException('CAS number is required unless mixture/unknown reason is provided.');
    if (cas && !/^[0-9]{2,7}-[0-9]{2}-[0-9]$/.test(String(cas))) throw new BadRequestException('CAS number format is invalid.');
  }

  private chemicalPayload(tenantId: string, actorId: string, unit: Row, dto: Row, extras: Row) {
    return this.clean({
      company_id: tenantId,
      site_id: unit.site_id,
      unit_id: unit.id,
      area_id: dto.area_id ?? dto.areaId ?? unit.area_id ?? null,
      equipment_id: dto.equipment_id ?? dto.equipmentId ?? null,
      chemical_name: dto.chemical_name ?? dto.chemicalName,
      common_name: dto.common_name ?? dto.commonName ?? null,
      cas_number: dto.cas_number ?? dto.casNumber ?? null,
      cas_unknown_reason: dto.cas_unknown_reason ?? dto.casUnknownReason ?? null,
      formula: dto.formula ?? null,
      molecular_weight: dto.molecular_weight ?? dto.molecularWeight ?? null,
      physical_state: dto.physical_state ?? dto.physicalState ?? 'Unknown',
      chemical_category: dto.chemical_category ?? dto.chemicalCategory ?? null,
      purity_concentration: dto.purity_concentration ?? dto.purityConcentration ?? null,
      is_mixture: Boolean(dto.is_mixture ?? dto.isMixture),
      mixture_description: dto.mixture_description ?? dto.mixtureDescription ?? null,
      chemical_database_id: dto.chemical_database_id ?? dto.chemicalDatabaseId ?? null,
      process_use: dto.process_use ?? dto.processUse,
      use_type: dto.use_type ?? dto.useType ?? null,
      normal_inventory: this.numberOrNull(dto.normal_inventory ?? dto.normalInventory),
      max_intended_inventory: this.numberOrZero(dto.max_intended_inventory ?? dto.maxIntendedInventory),
      inventory_unit: dto.inventory_unit ?? dto.inventoryUnit,
      normal_temperature: dto.normal_temperature ?? dto.normalTemperature ?? null,
      normal_pressure: dto.normal_pressure ?? dto.normalPressure ?? null,
      storage_temperature: dto.storage_temperature ?? dto.storageTemperature ?? null,
      storage_pressure: dto.storage_pressure ?? dto.storagePressure ?? null,
      storage_condition: dto.storage_condition ?? dto.storageCondition ?? null,
      transfer_method: dto.transfer_method ?? dto.transferMethod ?? null,
      use_frequency: dto.use_frequency ?? dto.useFrequency ?? null,
      operating_mode: dto.operating_mode ?? dto.operatingMode ?? null,
      high_hazard: Boolean(dto.high_hazard ?? dto.highHazard),
      psm_threshold_flag: Boolean(dto.psm_threshold_flag ?? dto.psmThresholdFlag),
      rmp_threshold_flag: Boolean(dto.rmp_threshold_flag ?? dto.rmpThresholdFlag),
      status: dto.status ?? 'Draft',
      review_status: dto.review_status ?? dto.reviewStatus ?? 'Not Reviewed',
      created_by: actorId,
      updated_by: actorId,
      ...extras
    });
  }

  private async upsertSectionRows(tenantId: string, actorId: string, chemical: Row, dto: Row) {
    await Promise.all([
      this.db.single(this.db.from('psi_chemical_hazards').upsert(this.sectionPayload('hazards', tenantId, chemical.site_id, chemical.id, dto) as Row, { onConflict: 'company_id,chemical_id' }).select().single()).catch(() => null),
      this.db.single(this.db.from('psi_chemical_exposure_health').upsert(this.sectionPayload('exposure', tenantId, chemical.site_id, chemical.id, dto) as Row, { onConflict: 'company_id,chemical_id' }).select().single()).catch(() => null),
      this.db.single(this.db.from('psi_chemical_storage_compatibility').upsert(this.sectionPayload('storage', tenantId, chemical.site_id, chemical.id, dto) as Row, { onConflict: 'company_id,chemical_id' }).select().single()).catch(() => null),
      this.db.single(this.db.from('psi_chemical_emergency_controls').upsert(this.sectionPayload('emergency', tenantId, chemical.site_id, chemical.id, dto) as Row, { onConflict: 'company_id,chemical_id' }).select().single()).catch(() => null)
    ]);
    void actorId;
  }

  private sectionPayload(section: string, tenantId: string, siteId: string, chemicalId: string, dto: Row) {
    const base = { id: dto[`${section}_id`] ?? randomUUID(), company_id: tenantId, site_id: siteId, chemical_id: chemicalId, updated_at: new Date().toISOString() };
    if (section === 'hazards') return this.clean({ ...base, ghs_hazard_classes_json: this.arrayJson(dto.ghs_hazard_classes_json ?? dto.ghsHazardClasses), ghs_categories_json: this.arrayJson(dto.ghs_categories_json ?? dto.ghsCategories), pictograms_json: this.arrayJson(dto.pictograms_json ?? dto.pictograms), signal_word: dto.signal_word ?? dto.signalWord ?? null, hazard_statements_json: this.arrayJson(dto.hazard_statements_json ?? dto.hazardStatements), precautionary_statements_json: this.arrayJson(dto.precautionary_statements_json ?? dto.precautionaryStatements), nfpa_health: this.numberOrNull(dto.nfpa_health ?? dto.nfpaHealth), nfpa_fire: this.numberOrNull(dto.nfpa_fire ?? dto.nfpaFire), nfpa_reactivity: this.numberOrNull(dto.nfpa_reactivity ?? dto.nfpaReactivity), nfpa_special: dto.nfpa_special ?? dto.nfpaSpecial ?? null, hmis_health: this.numberOrNull(dto.hmis_health ?? dto.hmisHealth), hmis_flammability: this.numberOrNull(dto.hmis_flammability ?? dto.hmisFlammability), hmis_physical_hazard: this.numberOrNull(dto.hmis_physical_hazard ?? dto.hmisPhysicalHazard), hazard_summary: dto.hazard_summary ?? dto.hazardSummary ?? null });
    if (section === 'exposure') return this.clean({ ...base, oel_value: dto.oel_value ?? dto.oelValue ?? null, oel_unit: dto.oel_unit ?? dto.oelUnit ?? null, oel_source: dto.oel_source ?? dto.oelSource ?? null, oel_not_available_reason: dto.oel_not_available_reason ?? dto.oelNotAvailableReason ?? null, twa_value: dto.twa_value ?? dto.twaValue ?? null, stel_value: dto.stel_value ?? dto.stelValue ?? null, ceiling_value: dto.ceiling_value ?? dto.ceilingValue ?? null, idlh_value: dto.idlh_value ?? dto.idlhValue ?? null, exposure_routes_json: this.arrayJson(dto.exposure_routes_json ?? dto.exposureRoutes), acute_toxicity_summary: dto.acute_toxicity_summary ?? dto.acuteToxicitySummary ?? null, chronic_toxicity_summary: dto.chronic_toxicity_summary ?? dto.chronicToxicitySummary ?? null, carcinogen_flag: Boolean(dto.carcinogen_flag ?? dto.carcinogenFlag), mutagen_flag: Boolean(dto.mutagen_flag ?? dto.mutagenFlag), reproductive_toxicity_flag: Boolean(dto.reproductive_toxicity_flag ?? dto.reproductiveToxicityFlag), sensitizer_flag: Boolean(dto.sensitizer_flag ?? dto.sensitizerFlag), first_aid_summary: dto.first_aid_summary ?? dto.firstAidSummary ?? null });
    if (section === 'storage') return this.clean({ ...base, storage_class: dto.storage_class ?? dto.storageClass ?? null, compatible_storage_group: dto.compatible_storage_group ?? dto.compatibleStorageGroup ?? null, incompatible_chemicals_json: this.arrayJson(dto.incompatible_chemicals_json ?? dto.incompatibleChemicals), incompatible_materials_json: this.arrayJson(dto.incompatible_materials_json ?? dto.incompatibleMaterials), water_reactive: Boolean(dto.water_reactive ?? dto.waterReactive), air_reactive: Boolean(dto.air_reactive ?? dto.airReactive), oxidizer: Boolean(dto.oxidizer), organic_peroxide: Boolean(dto.organic_peroxide ?? dto.organicPeroxide), acid_base_notes: dto.acid_base_notes ?? dto.acidBaseNotes ?? null, metal_compatibility_notes: dto.metal_compatibility_notes ?? dto.metalCompatibilityNotes ?? null, elastomer_compatibility_notes: dto.elastomer_compatibility_notes ?? dto.elastomerCompatibilityNotes ?? null, segregation_requirement: dto.segregation_requirement ?? dto.segregationRequirement ?? null, ventilation_requirement: dto.ventilation_requirement ?? dto.ventilationRequirement ?? null, compatibility_risk_level: dto.compatibility_risk_level ?? dto.compatibilityRiskLevel ?? 'Not Reviewed' });
    return this.clean({ ...base, required_ppe_json: this.arrayJson(dto.required_ppe_json ?? dto.requiredPpe), respiratory_protection: dto.respiratory_protection ?? dto.respiratoryProtection ?? null, glove_requirement: dto.glove_requirement ?? dto.gloveRequirement ?? null, eye_face_protection: dto.eye_face_protection ?? dto.eyeFaceProtection ?? null, protective_clothing: dto.protective_clothing ?? dto.protectiveClothing ?? null, spill_response_summary: dto.spill_response_summary ?? dto.spillResponseSummary ?? null, fire_response_summary: dto.fire_response_summary ?? dto.fireResponseSummary ?? null, suitable_extinguishing_media: dto.suitable_extinguishing_media ?? dto.suitableExtinguishingMedia ?? null, unsuitable_extinguishing_media: dto.unsuitable_extinguishing_media ?? dto.unsuitableExtinguishingMedia ?? null, special_firefighting_hazards: dto.special_firefighting_hazards ?? dto.specialFirefightingHazards ?? null, emergency_response_notes: dto.emergency_response_notes ?? dto.emergencyResponseNotes ?? null, waste_disposal_notes: dto.waste_disposal_notes ?? dto.wasteDisposalNotes ?? null });
  }

  private async refreshChemicalStatus(tenantId: string, actorId: string, scope: SiteScope, chemicalId: string, reason: string) {
    const chemical = await this.chemicalRecord(tenantId, scope, chemicalId, true);
    const [sdsLinks, hazards, exposure, storage, emergency] = await Promise.all([
      this.sdsLinks(tenantId, scope, chemicalId),
      this.section(tenantId, scope, chemicalId, 'psi_chemical_hazards'),
      this.section(tenantId, scope, chemicalId, 'psi_chemical_exposure_health'),
      this.section(tenantId, scope, chemicalId, 'psi_chemical_storage_compatibility'),
      this.section(tenantId, scope, chemicalId, 'psi_chemical_emergency_controls')
    ]);
    const sdsStatus = this.officialSdsStatus(sdsLinks);
    const exposureStatus = exposure?.oel_value || exposure?.oel_not_available_reason ? 'Complete' : 'Missing';
    const emergencyStatus = emergency?.spill_response_summary || emergency?.fire_response_summary || emergency?.emergency_response_notes ? 'Complete' : 'Missing';
    const compatibilityRisk = storage?.compatibility_risk_level ?? 'Not Reviewed';
    const pssrBlocker = Boolean(chemical.high_hazard && ['Missing', 'Expired', 'Rejected'].includes(sdsStatus));
    await this.db.single(this.db.from('psi_chemicals').update({ sds_status: sdsStatus, exposure_limit_status: exposureStatus, compatibility_risk_level: compatibilityRisk, emergency_response_status: emergencyStatus, pssr_blocker: pssrBlocker, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', chemicalId).select('id').single()).catch(() => null);
    await this.upsertChemicalCompleteness(tenantId, chemical, { sdsStatus, hazards, exposure, storage, emergency });
    await this.updateUnitCompleteness(tenantId, actorId, scope, chemical.unit_id);
    void reason;
    return sdsStatus;
  }

  private async upsertChemicalCompleteness(tenantId: string, chemical: Row, state: Row) {
    const gaps = [
      { category: 'Chemical hazards / SDS', requirement_name: `${chemical.chemical_name} SDS current`, status: ['Current', 'Waived With Approval', 'Not Required'].includes(state.sdsStatus) ? 'Complete' : 'Missing', severity: chemical.high_hazard ? 'Critical' : 'High', missing_reason: `SDS status is ${state.sdsStatus}.`, pssr_blocker: chemical.high_hazard && ['Missing', 'Expired'].includes(state.sdsStatus) },
      { category: 'Chemical hazards / SDS', requirement_name: `${chemical.chemical_name} GHS hazards`, status: state.hazards?.signal_word || state.hazards?.ghs_hazard_classes_json ? 'Complete' : 'Missing', severity: chemical.high_hazard ? 'High' : 'Medium', missing_reason: 'GHS hazard classification is missing.', pssr_blocker: false },
      { category: 'Chemical hazards / SDS', requirement_name: `${chemical.chemical_name} exposure limits`, status: state.exposure?.oel_value || state.exposure?.oel_not_available_reason ? 'Complete' : 'Warning', severity: 'Medium', missing_reason: 'Exposure limit or not-available reason is missing.', pssr_blocker: false },
      { category: 'Emergency response info', requirement_name: `${chemical.chemical_name} emergency controls`, status: state.emergency?.emergency_response_notes || state.emergency?.spill_response_summary || state.emergency?.fire_response_summary ? 'Complete' : 'Warning', severity: chemical.high_hazard ? 'High' : 'Medium', missing_reason: 'Emergency response information is missing.', pssr_blocker: false }
    ];
    for (const gap of gaps) {
      await this.db.single(this.db.from('psi_completeness_evaluations').upsert({
        id: randomUUID(),
        company_id: tenantId,
        site_id: chemical.site_id,
        unit_id: chemical.unit_id,
        category: gap.category,
        requirement_name: gap.requirement_name,
        status: gap.status,
        severity: gap.severity,
        missing_reason: gap.status === 'Complete' ? null : gap.missing_reason,
        linked_module: 'PSI Chemicals',
        linked_record_id: chemical.id,
        readiness_impact: gap.pssr_blocker ? 'PSSR blocker' : 'PSI completeness',
        pssr_blocker: gap.pssr_blocker,
        evaluated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'company_id,unit_id,category,requirement_name' }).select('id').single()).catch(() => null);
    }
  }

  private async updateUnitCompleteness(tenantId: string, actorId: string, scope: SiteScope, unitId: string) {
    const evaluations = await this.safeMany<Row>(this.db.from('psi_completeness_evaluations').select('*').eq('company_id', tenantId).eq('unit_id', unitId));
    const total = evaluations.length;
    const complete = evaluations.filter((row) => row.status === 'Complete').length;
    const critical = evaluations.filter((row) => row.status !== 'Complete' && row.severity === 'Critical').length;
    const pssr = evaluations.some((row) => row.status !== 'Complete' && row.pssr_blocker);
    const score = total ? Math.round((complete / total) * 100) : 0;
    const status = critical ? 'Critical Gaps' : score >= 100 ? 'Complete' : score >= 70 ? 'Mostly Complete' : 'Incomplete';
    await this.db.single(this.db.from('psi_units').update({ completeness_score: score, completeness_status: status, critical_gap_count: critical, pssr_blocker: pssr, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', unitId).select('id').single()).catch(() => null);
    void scope;
  }

  private officialSdsStatus(links: Row[]) {
    const active = links.filter((row) => !row.removed_at);
    if (!active.length) return 'Missing';
    if (active.some((row) => row.sds_status === 'Waived With Approval')) return 'Waived With Approval';
    if (active.some((row) => row.sds_status === 'Pending Approval')) return 'Pending Approval';
    if (active.some((row) => row.sds_status === 'Rejected')) return 'Rejected';
    if (active.some((row) => row.sds_status === 'Current')) return 'Current';
    if (active.some((row) => row.sds_status === 'Expired')) return 'Expired';
    return active[0]?.sds_status ?? 'Missing';
  }

  private calculateSdsStatus(dto: Row) {
    const requested = dto.sds_status ?? dto.sdsStatus;
    if (requested && sdsStatuses.includes(String(requested))) return String(requested);
    if (dto.waiver_reason || dto.waiverReason) return 'Pending Approval';
    if (!(dto.sds_id ?? dto.sdsId ?? dto.document_id ?? dto.documentId)) return 'Missing';
    const expiry = dto.sds_expiry_date ?? dto.sdsExpiryDate;
    if (expiry && new Date(String(expiry)).getTime() < Date.now()) return 'Expired';
    if (dto.approved_sds ?? dto.approvedSds) return 'Current';
    return 'Pending Approval';
  }

  private compatibilityWarnings(storage: Row, dto: Row) {
    const warnings = [];
    if (storage.oxidizer && this.containsAny(dto.comparedTags, ['flammable', 'combustible'])) warnings.push(this.warning('Oxidizer/flammable conflict', 'Critical', 'Oxidizer stored or compared with flammable material.', 'PSI storage compatibility fields'));
    if (storage.water_reactive) warnings.push(this.warning('Water reactive warning', 'High', 'Water reactive chemical requires segregation and emergency control review.', 'PSI storage compatibility fields'));
    if (storage.air_reactive) warnings.push(this.warning('Air reactive warning', 'High', 'Air reactive chemical requires inerting/storage control review.', 'PSI storage compatibility fields'));
    if ((storage.storage_class ?? '').toLowerCase().includes('corrosive')) warnings.push(this.warning('Corrosive material concern', 'Medium', 'Corrosive storage/material compatibility review required.', 'PSI storage compatibility fields'));
    if (storage.incompatible_chemicals_json || storage.incompatible_materials_json) warnings.push(this.warning('Listed incompatibilities', storage.compatibility_risk_level ?? 'High', 'Structured incompatibility list is present.', 'PSI incompatibility records'));
    return warnings;
  }

  private warning(checkType: string, riskLevel: string, warningMessage: string, evidenceSource: string) {
    return { checkType, resultStatus: 'Warning', riskLevel, warningMessage, evidenceSource, actionRequired: ['High', 'Critical'].includes(riskLevel) };
  }

  private overview(chemical: Row, sdsLinks: Row[], hazards: Row | null, exposure: Row | null, storage: Row | null, emergency: Row | null, checks: Row[]) {
    return {
      cards: [
        { label: 'SDS status', value: chemical.sds_status, tone: ['Missing', 'Expired', 'Rejected'].includes(chemical.sds_status) ? 'danger' : chemical.sds_status === 'Current' ? 'good' : 'warn' },
        { label: 'High hazard', value: chemical.high_hazard ? 'Yes' : 'No', tone: chemical.high_hazard ? 'danger' : 'neutral' },
        { label: 'Max intended inventory', value: `${chemical.max_intended_inventory ?? '-'} ${chemical.inventory_unit ?? ''}`, tone: 'neutral' },
        { label: 'GHS signal word', value: hazards?.signal_word ?? 'Missing', tone: hazards?.signal_word === 'Danger' ? 'danger' : hazards?.signal_word ? 'warn' : 'danger' },
        { label: 'NFPA/HMIS', value: `${hazards?.nfpa_health ?? '-'}/${hazards?.nfpa_fire ?? '-'}/${hazards?.nfpa_reactivity ?? '-'}`, tone: 'neutral' },
        { label: 'Exposure limit', value: exposure?.oel_value ?? exposure?.oel_not_available_reason ?? 'Missing', tone: exposure?.oel_value || exposure?.oel_not_available_reason ? 'good' : 'warn' },
        { label: 'Compatibility risk', value: storage?.compatibility_risk_level ?? 'Not Reviewed', tone: ['High', 'Critical'].includes(storage?.compatibility_risk_level) ? 'danger' : 'neutral' },
        { label: 'Emergency response', value: emergency?.emergency_response_notes || emergency?.spill_response_summary || emergency?.fire_response_summary ? 'Complete' : 'Missing', tone: emergency?.emergency_response_notes || emergency?.spill_response_summary || emergency?.fire_response_summary ? 'good' : 'warn' },
        { label: 'MOC required', value: chemical.moc_update_required ? 'Yes' : 'No', tone: chemical.moc_update_required ? 'warn' : 'neutral' },
        { label: 'PSI completeness impact', value: chemical.pssr_blocker ? 'Critical gap' : ['Missing', 'Expired'].includes(chemical.sds_status) ? 'Gap' : 'Tracked', tone: chemical.pssr_blocker ? 'danger' : ['Missing', 'Expired'].includes(chemical.sds_status) ? 'warn' : 'good' }
      ],
      sdsLinks,
      compatibilityWarnings: checks.filter((row) => row.action_required)
    };
  }

  private actions(chemical: Row) {
    const locked = chemical.review_status === 'Approved';
    return [
      { key: 'edit', label: 'Edit', enabled: !locked, disabledReason: locked ? 'Approved chemicals require controlled edit/MOC workflow.' : null },
      { key: 'link-sds', label: 'Link SDS', enabled: !locked, disabledReason: locked ? 'Approved chemicals are read-only.' : null },
      { key: 'run-sds-check', label: 'Run SDS Check', enabled: true, disabledReason: null },
      { key: 'compatibility', label: 'Check Compatibility', enabled: true, disabledReason: null },
      { key: 'submit-review', label: 'Submit for Review', enabled: !locked, disabledReason: locked ? 'Already approved.' : null }
    ];
  }

  private tabs(chemicalId: string) {
    const base = `/process-safety-information/chemicals/${chemicalId}`;
    return ['Overview', 'Process Use / Inventory', 'SDS', 'Hazards', 'Exposure / Health', 'Storage / Compatibility', 'PPE / Emergency', 'Linked Records', 'Documents', 'Review & Approval', 'Change History'].map((label) => ({ label, href: base, enabled: ['Overview', 'SDS', 'Hazards', 'Exposure / Health', 'Storage / Compatibility', 'PPE / Emergency', 'Change History'].includes(label) }));
  }

  private sectionTable(section: string) {
    if (section === 'hazards') return 'psi_chemical_hazards';
    if (section === 'exposure') return 'psi_chemical_exposure_health';
    if (section === 'storage') return 'psi_chemical_storage_compatibility';
    return 'psi_chemical_emergency_controls';
  }

  private async section(tenantId: string, scope: SiteScope, chemicalId: string, table: string) {
    await this.chemicalRecord(tenantId, scope, chemicalId, true);
    return this.safeSingle<Row>(this.db.from(table).select('*').eq('company_id', tenantId).eq('chemical_id', chemicalId).maybeSingle());
  }

  private async chemicalRecord(tenantId: string, scope: SiteScope, chemicalId: string, includeArchived = false) {
    let request: any = this.applyScope(this.db.from('psi_chemicals').select('*').eq('company_id', tenantId).eq('id', chemicalId), scope);
    if (!includeArchived) request = request.is('archived_at', null);
    const row = await this.safeSingle<Row>(request.maybeSingle());
    if (!row) throw new NotFoundException('PSI chemical not found or outside your company/site access.');
    return row;
  }

  private async unitRecord(tenantId: string, scope: SiteScope, unitId: string) {
    if (!unitId) throw new BadRequestException('Process unit is required.');
    const row = await this.safeSingle<Row>(this.applyScope(this.db.from('psi_units').select('*').eq('company_id', tenantId).eq('id', unitId), scope).maybeSingle());
    if (!row) throw new NotFoundException('Process unit not found or outside your company/site access.');
    return row;
  }

  private async writeHistory(tenantId: string, actorId: string, action: string, chemical: Row, before: any, after: any, title: string, description?: string | null) {
    const auditInput: { tenantId: string; actorId: string; action: string; entityType: string; entityId?: string; before: JsonValue; after: JsonValue } = { tenantId, actorId, action, entityType: 'PSI_CHEMICAL', before: before as JsonValue, after: after as JsonValue };
    if (chemical?.id) auditInput.entityId = chemical.id;
    await this.audit.write(auditInput).catch(() => null);
    await this.db.single(this.db.from('psi_chemical_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: chemical.site_id, unit_id: chemical.unit_id, chemical_id: chemical.id, event_type: action, event_title: title, event_description: description ?? null, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId }).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('psi_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: chemical.site_id, unit_id: chemical.unit_id, event_type: action, event_title: title, event_description: description ?? null, source_module: 'PSI Chemicals', source_record_id: chemical.id, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId }).select('id').single()).catch(() => null);
  }

  private flattenChemical(row: Row) {
    const hazards = Array.isArray(row.psi_chemical_hazards) ? row.psi_chemical_hazards[0] : row.psi_chemical_hazards;
    const exposure = Array.isArray(row.psi_chemical_exposure_health) ? row.psi_chemical_exposure_health[0] : row.psi_chemical_exposure_health;
    const storage = Array.isArray(row.psi_chemical_storage_compatibility) ? row.psi_chemical_storage_compatibility[0] : row.psi_chemical_storage_compatibility;
    const emergency = Array.isArray(row.psi_chemical_emergency_controls) ? row.psi_chemical_emergency_controls[0] : row.psi_chemical_emergency_controls;
    return { ...row, hazards, exposureHealth: exposure, storageCompatibility: storage, emergencyControls: emergency };
  }

  private text(row: Row) {
    return JSON.stringify(row).toLowerCase();
  }

  private containsAny(value: unknown, terms: string[]) {
    const text = Array.isArray(value) ? value.join(' ').toLowerCase() : String(value ?? '').toLowerCase();
    return terms.some((term) => text.includes(term));
  }

  private applyScope(query: any, scope: SiteScope, column = 'site_id') {
    if (scope.corporateView) return query;
    if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId);
    if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds);
    return query;
  }

  private applyGenericScope(query: any, scope: SiteScope, column: string) {
    if (scope.corporateView) return query;
    if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId);
    if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds);
    return query;
  }

  private selectedSite(scope: SiteScope) {
    return scope.selectedSiteId ?? scope.allowedSiteIds?.[0] ?? null;
  }

  private requireText(value: unknown, message: string) {
    if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(message);
    return value.trim();
  }

  private requireRow<T>(row: T | null | undefined, message: string): T {
    if (!row) throw new BadRequestException(message);
    return row;
  }

  private safeSortColumn(column: string) {
    const allowed = new Set(['updated_at', 'created_at', 'chemical_name', 'cas_number', 'sds_status', 'high_hazard', 'max_intended_inventory', 'review_status']);
    return allowed.has(column) ? column : 'updated_at';
  }

  private async safeSingle<T>(query: PromiseLike<any>) {
    try { return await this.db.single<T>(query); } catch { return null; }
  }

  private async safeMany<T>(query: PromiseLike<any>) {
    try { return await this.db.many<T>(query); } catch { return []; }
  }

  private numberOrNull(value: unknown) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private numberOrZero(value: unknown) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
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

  private clean<T extends Row>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
  }
}
