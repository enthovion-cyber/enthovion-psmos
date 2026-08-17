import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type Row = Record<string, any>;

const chemistryTypes = ['Reaction', 'Mixing / blending', 'Neutralization', 'Distillation chemistry', 'Absorption / stripping', 'Extraction', 'Crystallization', 'Polymerization', 'Oxidation', 'Reduction', 'Hydrogenation', 'Chlorination', 'Nitration', 'Sulfonation', 'Decomposition concern', 'Storage stability', 'Waste treatment chemistry', 'Utility chemical treatment', 'Other'];
const operatingModes = ['Batch', 'Continuous', 'Semi-batch', 'Campaign', 'Startup', 'Shutdown', 'Cleaning / flushing', 'Emergency / abnormal', 'Storage only'];
const reactionPhases = ['Gas', 'Liquid', 'Solid', 'Gas-liquid', 'Liquid-liquid', 'Slurry', 'Vapor-liquid', 'Multiphase'];
const chemicalRoles = ['Reactant', 'Product', 'Intermediate', 'Byproduct', 'Impurity', 'Catalyst', 'Inhibitor', 'Solvent', 'Diluent', 'Utility chemical', 'Cleaning chemical', 'Waste component', 'Contaminant', 'Quench agent', 'Emergency neutralizer'];
const hazardLevels = ['Low', 'Medium', 'High', 'Critical', 'Unknown / Needs Study'];
const scenarioTypes = ['High temperature', 'Low temperature', 'High pressure', 'Low pressure', 'Wrong concentration', 'Wrong feed ratio', 'Wrong addition order', 'Too fast addition', 'Loss of cooling', 'Loss of agitation', 'Loss of inerting', 'Air ingress', 'Water ingress', 'Contamination', 'Wrong chemical addition', 'Catalyst overdose', 'Catalyst missing', 'Inhibitor missing', 'Blocked vent', 'Blocked outlet', 'Utility failure', 'Decomposition', 'Polymerization', 'Runaway', 'Toxic gas release', 'Fire/explosion', 'Other'];
const controlTypes = ['Operating procedure', 'Safe operating limit', 'Alarm', 'Interlock', 'SIF/SIS', 'PSV/relief device', 'Vent system', 'Scrubber', 'Cooling system', 'Inerting system', 'Agitation/mixing control', 'Feed ratio control', 'Addition rate control', 'Emergency shutdown', 'Emergency quench', 'Spill containment', 'Fire protection', 'Gas detection', 'Operator monitoring', 'Training requirement', 'PTW/LOTO requirement', 'Other'];

@Injectable()
export class PsiProcessChemistryService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async summary(tenantId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    const units = new Set(rows.map((row: Row) => row.unit_id));
    const allUnits = await this.safeMany<Row>(this.applyScope(this.db.from('psi_units').select('id').eq('company_id', tenantId).is('archived_at', null), scope));
    const has = (predicate: (row: Row) => boolean) => rows.filter(predicate).length;
    return {
      totalChemistryRecords: rows.length,
      unitsWithChemistryDefined: units.size,
      unitsMissingChemistry: Math.max(0, allUnits.length - units.size),
      highHazardReactions: has((r) => ['High', 'Critical'].includes(r.hazard_level)),
      exothermicReactions: has((r) => r.hazards?.exothermic),
      runawayPotential: has((r) => ['High', 'Critical', 'Unknown / Needs Study'].includes(r.runaway_potential)),
      decompositionHazards: has((r) => ['High', 'Critical', 'Unknown / Needs Study'].includes(r.decomposition_potential)),
      polymerizationHazards: has((r) => ['High', 'Critical', 'Unknown / Needs Study'].includes(r.polymerization_potential)),
      toxicGasPotential: has((r) => ['High', 'Critical'].includes(r.hazards?.toxic_gas_generation_potential)),
      overpressurePotential: has((r) => ['High', 'Critical'].includes(r.hazards?.overpressure_potential)),
      incompatibleMixingRisks: has((r) => ['High', 'Critical'].includes(r.hazards?.incompatible_mixing_risk)),
      missingReactionConditions: has((r) => r.completenessMissingKeys?.includes('conditions')),
      missingUnwantedScenarioData: has((r) => r.completenessMissingKeys?.includes('scenarios')),
      mocUpdateRequired: has((r) => r.moc_update_required),
      pssrBlockers: has((r) => r.pssr_blocker),
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
      savedViews: ['All Chemistry Records', 'High Hazard', 'Runaway Potential', 'Exothermic', 'Polymerization Risk', 'Decomposition Risk', 'Toxic Gas Risk', 'Missing Data', 'MOC Required', 'PSSR Blockers', 'My Unit Chemistry'],
      lastUpdated: new Date().toISOString()
    };
  }

  async unitChemistry(tenantId: string, scope: Scope, unitId: string, query: Row = {}) {
    await this.unitRecord(tenantId, scope, unitId);
    return this.registry(tenantId, scope, { ...query, unitId });
  }

  async create(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const unit = await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId ?? ''));
    this.validate(dto, false);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_process_chemistry').insert(this.payload(tenantId, actorId, unit, dto, { created_at: new Date().toISOString(), updated_at: new Date().toISOString() })).select().single()), 'Unable to create process chemistry.');
    await this.upsertSections(tenantId, actorId, row, dto);
    await this.runCompleteness(tenantId, actorId, scope, row.id);
    await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.created', row, null, row, 'Process chemistry created', `${row.chemistry_name} created.`);
    return this.detail(tenantId, scope, row.id);
  }

  async update(tenantId: string, actorId: string, scope: Scope, chemistryId: string, dto: Row, permissions: string[] = []) {
    const before = await this.record(tenantId, scope, chemistryId);
    if (before.review_status === 'Approved' && !permissions.includes('psi.process_chemistry.approve')) throw new ForbiddenException('Approved process chemistry is read-only unless controlled edit/MOC workflow is available.');
    const unit = await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId ?? before.unit_id));
    this.validate({ ...before, ...dto }, true);
    const safetyKeys = ['process_chemistry_summary', 'main_reaction_equation', 'chemistry_type', 'operating_mode', 'catalyst_involved', 'inhibitor_required', 'cooling_sensitivity', 'runaway_potential', 'decomposition_potential', 'polymerization_potential'];
    const safetyChanged = safetyKeys.some((key) => dto[key] !== undefined && dto[key] !== before[key]);
    const patch: Row = this.payload(tenantId, actorId, unit, dto, { updated_at: new Date().toISOString(), moc_update_required: safetyChanged ? true : before.moc_update_required });
    delete patch.created_by;
    delete patch.created_at;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_process_chemistry').update(patch).eq('company_id', tenantId).eq('id', chemistryId).select().single()), 'Unable to update process chemistry.');
    await this.upsertSections(tenantId, actorId, row, dto);
    await this.runCompleteness(tenantId, actorId, scope, row.id);
    await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.updated', row, before, row, 'Process chemistry updated', safetyChanged ? 'Safety-sensitive chemistry change may require MOC.' : 'Process chemistry updated.');
    return this.detail(tenantId, scope, row.id);
  }

  async detail(tenantId: string, scope: Scope, chemistryId: string) {
    const chemistry = await this.record(tenantId, scope, chemistryId);
    const [unit, roles, conditions, hazards, scenarios, controls, documents, completeness, history] = await Promise.all([
      this.unitRecord(tenantId, scope, chemistry.unit_id),
      this.roles(tenantId, scope, chemistryId),
      this.section(tenantId, scope, chemistryId, 'psi_process_chemistry_conditions'),
      this.section(tenantId, scope, chemistryId, 'psi_process_chemistry_hazards'),
      this.scenarios(tenantId, scope, chemistryId),
      this.controls(tenantId, scope, chemistryId),
      this.documents(tenantId, scope, chemistryId),
      this.completeness(tenantId, scope, chemistryId),
      this.history(tenantId, scope, chemistryId)
    ]);
    return {
      chemistry,
      unit,
      roles,
      conditions,
      hazards,
      scenarios,
      controls,
      documents,
      completeness,
      history,
      overview: this.overview(chemistry, roles, conditions, hazards, scenarios, controls, completeness),
      tabs: this.tabs(chemistryId),
      actions: this.actions(chemistry)
    };
  }

  async archive(tenantId: string, actorId: string, scope: Scope, chemistryId: string, dto: Row) {
    const before = await this.record(tenantId, scope, chemistryId);
    if (!dto.reason) throw new BadRequestException('Archive requires a reason.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_process_chemistry').update({ archived_at: new Date().toISOString(), archived_by: actorId, archive_reason: dto.reason, status: 'Archived', moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', chemistryId).select().single()), 'Unable to archive process chemistry.');
    await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.archived', row, before, row, 'Process chemistry archived', dto.reason);
    return row;
  }

  async reactivate(tenantId: string, actorId: string, scope: Scope, chemistryId: string, dto: Row) {
    const before = await this.record(tenantId, scope, chemistryId, true);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_process_chemistry').update({ archived_at: null, archived_by: null, archive_reason: null, status: dto.status ?? 'Active', moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', chemistryId).select().single()), 'Unable to reactivate process chemistry.');
    await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.reactivated', row, before, row, 'Process chemistry reactivated', dto.reason ?? 'Process chemistry reactivated.');
    return row;
  }

  async roles(tenantId: string, scope: Scope, chemistryId: string) {
    await this.record(tenantId, scope, chemistryId, true);
    return this.safeMany<Row>(this.db.from('psi_process_chemistry_chemical_roles').select('*, psi_chemicals(*)').eq('company_id', tenantId).eq('chemistry_id', chemistryId).order('created_at'));
  }

  async addRole(tenantId: string, actorId: string, scope: Scope, chemistryId: string, dto: Row) {
    const chemistry = await this.record(tenantId, scope, chemistryId);
    const chemical = await this.chemicalRecord(tenantId, scope, String(dto.chemical_id ?? dto.chemicalId ?? ''), chemistry.unit_id);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_process_chemistry_chemical_roles').insert(this.rolePayload(tenantId, actorId, chemistry, chemical, dto)).select().single()), 'Unable to link chemical role.');
    await this.runCompleteness(tenantId, actorId, scope, chemistryId);
    await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.chemical.linked', chemistry, null, row, 'Chemical role linked', `${chemical.chemical_name} linked as ${row.chemical_role}.`);
    return this.roles(tenantId, scope, chemistryId);
  }

  async updateRole(tenantId: string, actorId: string, scope: Scope, chemistryId: string, roleId: string, dto: Row) {
    const chemistry = await this.record(tenantId, scope, chemistryId);
    const before = await this.safeSingle<Row>(this.db.from('psi_process_chemistry_chemical_roles').select('*').eq('company_id', tenantId).eq('chemistry_id', chemistryId).eq('id', roleId).single());
    if (!before) throw new NotFoundException('Chemical role not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_process_chemistry_chemical_roles').update({ ...this.clean(dto), updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', roleId).select().single()), 'Unable to update chemical role.');
    await this.runCompleteness(tenantId, actorId, scope, chemistryId);
    await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.chemical.updated', chemistry, before, row, 'Chemical role updated', 'Chemical role/concentration/feed data updated.');
    return this.roles(tenantId, scope, chemistryId);
  }

  async removeRole(tenantId: string, actorId: string, scope: Scope, chemistryId: string, roleId: string) {
    const chemistry = await this.record(tenantId, scope, chemistryId);
    const row = await this.safeSingle<Row>(this.db.from('psi_process_chemistry_chemical_roles').delete().eq('company_id', tenantId).eq('chemistry_id', chemistryId).eq('id', roleId).select().single());
    if (!row) throw new NotFoundException('Chemical role not found.');
    await this.runCompleteness(tenantId, actorId, scope, chemistryId);
    await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.chemical.removed', chemistry, row, null, 'Chemical role removed', 'Chemical role removed from process chemistry.');
    return this.roles(tenantId, scope, chemistryId);
  }

  async patchSection(tenantId: string, actorId: string, scope: Scope, chemistryId: string, section: 'conditions' | 'hazards', dto: Row) {
    const chemistry = await this.record(tenantId, scope, chemistryId);
    const table = section === 'conditions' ? 'psi_process_chemistry_conditions' : 'psi_process_chemistry_hazards';
    const before = await this.section(tenantId, scope, chemistryId, table);
    const payload: Row = section === 'conditions' ? this.conditionsPayload(tenantId, chemistry, dto) : this.hazardsPayload(tenantId, chemistry, dto);
    const row = this.requireRow(await this.db.single<Row>(this.db.from(table).upsert(payload, { onConflict: 'company_id,chemistry_id' }).select().single()), `Unable to update ${section}.`);
    await this.runCompleteness(tenantId, actorId, scope, chemistryId);
    await this.writeHistory(tenantId, actorId, `psi.process_chemistry.${section}.updated`, chemistry, before, row, `${section} updated`, 'Process chemistry section updated.');
    return this.detail(tenantId, scope, chemistryId);
  }

  async scenarios(tenantId: string, scope: Scope, chemistryId: string) {
    await this.record(tenantId, scope, chemistryId, true);
    return this.safeMany<Row>(this.db.from('psi_unwanted_reaction_scenarios').select('*').eq('company_id', tenantId).eq('chemistry_id', chemistryId).order('created_at', { ascending: false }));
  }

  async saveScenario(tenantId: string, actorId: string, scope: Scope, chemistryId: string, dto: Row, scenarioId?: string) {
    const chemistry = await this.record(tenantId, scope, chemistryId);
    const payload = this.scenarioPayload(tenantId, actorId, chemistry, dto);
    const before = scenarioId ? await this.safeSingle<Row>(this.db.from('psi_unwanted_reaction_scenarios').select('*').eq('company_id', tenantId).eq('chemistry_id', chemistryId).eq('id', scenarioId).single()) : null;
    const row = scenarioId
      ? this.requireRow(await this.db.single<Row>(this.db.from('psi_unwanted_reaction_scenarios').update({ ...payload, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', scenarioId).select().single()), 'Unable to update scenario.')
      : this.requireRow(await this.db.single<Row>(this.db.from('psi_unwanted_reaction_scenarios').insert(payload).select().single()), 'Unable to create scenario.');
    await this.runCompleteness(tenantId, actorId, scope, chemistryId);
    await this.writeHistory(tenantId, actorId, scenarioId ? 'psi.process_chemistry.scenario.updated' : 'psi.process_chemistry.scenario.created', chemistry, before, row, scenarioId ? 'Unwanted scenario updated' : 'Unwanted scenario created', row.uncontrolled_high_severity ? 'Uncontrolled high severity scenario creates critical gap.' : row.scenario_title);
    return this.scenarios(tenantId, scope, chemistryId);
  }

  async removeScenario(tenantId: string, actorId: string, scope: Scope, chemistryId: string, scenarioId: string) {
    const chemistry = await this.record(tenantId, scope, chemistryId);
    const row = await this.safeSingle<Row>(this.db.from('psi_unwanted_reaction_scenarios').delete().eq('company_id', tenantId).eq('chemistry_id', chemistryId).eq('id', scenarioId).select().single());
    if (!row) throw new NotFoundException('Scenario not found.');
    await this.runCompleteness(tenantId, actorId, scope, chemistryId);
    await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.scenario.removed', chemistry, row, null, 'Unwanted scenario removed', row.scenario_title);
    return this.scenarios(tenantId, scope, chemistryId);
  }

  async controls(tenantId: string, scope: Scope, chemistryId: string) {
    await this.record(tenantId, scope, chemistryId, true);
    return this.safeMany<Row>(this.db.from('psi_process_chemistry_controls').select('*').eq('company_id', tenantId).eq('chemistry_id', chemistryId).order('created_at', { ascending: false }));
  }

  async saveControl(tenantId: string, actorId: string, scope: Scope, chemistryId: string, dto: Row, controlId?: string) {
    const chemistry = await this.record(tenantId, scope, chemistryId);
    const payload = this.controlPayload(tenantId, actorId, chemistry, dto);
    const before = controlId ? await this.safeSingle<Row>(this.db.from('psi_process_chemistry_controls').select('*').eq('company_id', tenantId).eq('chemistry_id', chemistryId).eq('id', controlId).single()) : null;
    const row = controlId
      ? this.requireRow(await this.db.single<Row>(this.db.from('psi_process_chemistry_controls').update(payload).eq('company_id', tenantId).eq('id', controlId).select().single()), 'Unable to update control.')
      : this.requireRow(await this.db.single<Row>(this.db.from('psi_process_chemistry_controls').insert(payload).select().single()), 'Unable to create control.');
    await this.runCompleteness(tenantId, actorId, scope, chemistryId);
    await this.writeHistory(tenantId, actorId, controlId ? 'psi.process_chemistry.control.updated' : 'psi.process_chemistry.control.created', chemistry, before, row, controlId ? 'Control updated' : 'Control linked', row.control_description);
    return this.controls(tenantId, scope, chemistryId);
  }

  async removeControl(tenantId: string, actorId: string, scope: Scope, chemistryId: string, controlId: string) {
    const chemistry = await this.record(tenantId, scope, chemistryId);
    const row = await this.safeSingle<Row>(this.db.from('psi_process_chemistry_controls').delete().eq('company_id', tenantId).eq('chemistry_id', chemistryId).eq('id', controlId).select().single());
    if (!row) throw new NotFoundException('Control not found.');
    await this.runCompleteness(tenantId, actorId, scope, chemistryId);
    await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.control.removed', chemistry, row, null, 'Control removed', row.control_description);
    return this.controls(tenantId, scope, chemistryId);
  }

  async documents(tenantId: string, scope: Scope, chemistryId: string) {
    await this.record(tenantId, scope, chemistryId, true);
    return this.safeMany<Row>(this.db.from('psi_process_chemistry_document_links').select('*').eq('company_id', tenantId).eq('chemistry_id', chemistryId).is('removed_at', null).order('linked_at', { ascending: false }));
  }

  async linkDocument(tenantId: string, actorId: string, scope: Scope, chemistryId: string, dto: Row) {
    const chemistry = await this.record(tenantId, scope, chemistryId);
    if (!dto.document_id && !dto.documentId) throw new BadRequestException('Document ID is required.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_process_chemistry_document_links').insert({ id: randomUUID(), company_id: tenantId, site_id: chemistry.site_id, chemistry_id: chemistryId, document_id: dto.document_id ?? dto.documentId, document_type: dto.document_type ?? dto.documentType ?? 'Process chemistry document', relationship_type: dto.relationship_type ?? dto.relationshipType ?? 'Reference', required: Boolean(dto.required), readiness_impact: Boolean(dto.readiness_impact ?? dto.readinessImpact), linked_by: actorId }).select().single()), 'Unable to link document.');
    await this.runCompleteness(tenantId, actorId, scope, chemistryId);
    await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.document.linked', chemistry, null, row, 'Document linked', row.document_type);
    return this.documents(tenantId, scope, chemistryId);
  }

  async unlinkDocument(tenantId: string, actorId: string, scope: Scope, chemistryId: string, documentLinkId: string, dto: Row) {
    const chemistry = await this.record(tenantId, scope, chemistryId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_process_chemistry_document_links').update({ removed_by: actorId, removed_at: new Date().toISOString(), remove_reason: dto.reason ?? null }).eq('company_id', tenantId).eq('id', documentLinkId).select().single()), 'Unable to unlink document.');
    await this.runCompleteness(tenantId, actorId, scope, chemistryId);
    await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.document.unlinked', chemistry, row, null, 'Document unlinked', dto.reason ?? row.document_type);
    return this.documents(tenantId, scope, chemistryId);
  }

  async completeness(tenantId: string, scope: Scope, chemistryId: string) {
    await this.record(tenantId, scope, chemistryId, true);
    return this.safeMany<Row>(this.db.from('psi_process_chemistry_completeness_evaluations').select('*').eq('company_id', tenantId).eq('chemistry_id', chemistryId).order('severity').order('check_title'));
  }

  async runCompleteness(tenantId: string, actorId: string, scope: Scope, chemistryId: string) {
    const chemistry = await this.record(tenantId, scope, chemistryId, true);
    const [roles, conditions, hazards, scenarios, controls, documents] = await Promise.all([
      this.roles(tenantId, scope, chemistryId),
      this.section(tenantId, scope, chemistryId, 'psi_process_chemistry_conditions'),
      this.section(tenantId, scope, chemistryId, 'psi_process_chemistry_hazards'),
      this.scenarios(tenantId, scope, chemistryId),
      this.controls(tenantId, scope, chemistryId),
      this.documents(tenantId, scope, chemistryId)
    ]);
    const hasRole = (role: string) => roles.some((r) => r.chemical_role === role);
    const highHazard = ['High', 'Critical'].includes(chemistry.hazard_level) || ['High', 'Critical'].includes(hazards?.runaway_potential) || scenarios.some((s) => ['High', 'Critical'].includes(s.severity));
    const uncontrolled = scenarios.some((s) => s.uncontrolled_high_severity);
    const checks = [
      this.check('unit', 'Unit selected', Boolean(chemistry.unit_id), 'Critical'),
      this.check('description', 'Chemistry description exists', Boolean(chemistry.process_chemistry_summary), 'High'),
      this.check('chemicals', 'Chemicals linked', roles.length > 0, 'High'),
      this.check('reactants_products', 'Reactants/products identified', !['Reaction', 'Polymerization', 'Oxidation', 'Reduction', 'Hydrogenation', 'Chlorination', 'Nitration'].includes(chemistry.chemistry_type) || (hasRole('Reactant') && hasRole('Product')), 'High'),
      this.check('conditions', 'Normal temperature/pressure defined', Boolean(conditions?.normal_temperature && conditions?.normal_pressure), 'High'),
      this.check('hazards', 'Major reaction hazards identified', Boolean(hazards?.reaction_hazard_summary || hazards?.runaway_potential), highHazard ? 'Critical' : 'High'),
      this.check('scenarios', 'Unwanted scenarios assessed', scenarios.length > 0, highHazard ? 'Critical' : 'Medium'),
      this.check('high_scenario_safeguards', 'High severity scenarios have safeguards', !scenarios.some((s) => ['High', 'Critical'].includes(s.severity)) || controls.length > 0, 'Critical'),
      this.check('emergency', 'Emergency response notes present for high hazard', !highHazard || scenarios.some((s) => s.emergency_response) || controls.some((c) => /emergency|quench|shutdown|scrubber|vent/i.test(`${c.control_type} ${c.control_description}`)), 'High'),
      this.check('documents', 'Required documents linked where configured', documents.some((d) => d.required) || !highHazard, 'Medium'),
      this.check('owner', 'Review owner assigned', Boolean(chemistry.owner_user_id || chemistry.process_engineer_id || chemistry.hse_reviewer_id), 'Medium'),
      this.check('review_date', 'Review date exists', Boolean(chemistry.last_review_date || chemistry.next_review_due), 'Medium')
    ];
    let complete = 0;
    let critical = 0;
    for (const item of checks) {
      if (item.complete) complete += 1;
      if (!item.complete && item.severity === 'Critical') critical += 1;
      await this.db.single(this.db.from('psi_process_chemistry_completeness_evaluations').upsert({ id: randomUUID(), company_id: tenantId, site_id: chemistry.site_id, chemistry_id: chemistryId, unit_id: chemistry.unit_id, check_key: item.key, check_title: item.title, status: item.complete ? 'Complete' : 'Missing', severity: item.severity, message: item.complete ? 'Complete' : item.message, missing_reason: item.complete ? null : item.message, pssr_blocker: !item.complete && item.severity === 'Critical', action_required: !item.complete, evaluated_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'company_id,chemistry_id,check_key' }).select('id').single()).catch(() => null);
    }
    const score = Math.round((complete / checks.length) * 100);
    const pssr = critical > 0 || uncontrolled;
    const status = critical ? 'Critical Gaps' : score === 100 ? 'Complete' : score >= 70 ? 'Mostly Complete' : 'Incomplete';
    await this.db.single(this.db.from('psi_process_chemistry').update({ completeness_score: score, completeness_status: status, pssr_blocker: pssr, moc_update_required: chemistry.moc_update_required || highHazard, hazard_level: highHazard ? (chemistry.hazard_level === 'Unknown / Needs Study' ? 'High' : chemistry.hazard_level) : chemistry.hazard_level, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', chemistryId).select('id').single()).catch(() => null);
    await this.upsertUnitCompleteness(tenantId, chemistry, status, critical, pssr);
    await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.completeness.run', chemistry, null, { score, status, critical }, 'Process chemistry completeness checked', `${status} (${score}%).`);
    return this.completeness(tenantId, scope, chemistryId);
  }

  async submitReview(tenantId: string, actorId: string, scope: Scope, chemistryId: string, dto: Row) {
    const before = await this.record(tenantId, scope, chemistryId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_process_chemistry').update({ review_status: 'Submitted', status: 'Under Review', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', chemistryId).select().single()), 'Unable to submit review.');
    await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.review.submitted', row, before, row, 'Process chemistry submitted for review', dto.reason ?? 'Review requested.');
    return row;
  }

  async history(tenantId: string, scope: Scope, chemistryId: string) {
    await this.record(tenantId, scope, chemistryId, true);
    return this.safeMany<Row>(this.db.from('psi_process_chemistry_history_events').select('*').eq('company_id', tenantId).eq('chemistry_id', chemistryId).order('created_at', { ascending: false }).limit(100));
  }

  importTemplate() {
    return { supportedFormats: ['.xlsx', '.csv'], columns: ['unit_code', 'chemistry_name', 'chemistry_type', 'operating_mode', 'process_step', 'main_reaction_equation', 'reaction_phase', 'reactants', 'products', 'catalysts', 'inhibitors', 'solvents', 'normal_temperature', 'min_temperature', 'max_temperature', 'normal_pressure', 'min_pressure', 'max_pressure', 'ph_normal', 'feed_ratio_range', 'exothermic', 'runaway_potential', 'decomposition_potential', 'polymerization_potential', 'overpressure_potential', 'toxic_gas_generation_potential', 'main_unwanted_scenarios', 'existing_safeguards', 'emergency_response', 'owner_email'] };
  }

  async importPreview(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const preview = rows.map((row: Row, index: number) => ({ rowNumber: index + 1, row, errors: [!row.unit_code && !row.unitId ? 'unit_code is required.' : null, !row.chemistry_name && !row.chemistryName ? 'chemistry_name is required.' : null, !row.chemistry_type && !row.chemistryType ? 'chemistry_type is required.' : null, !row.process_chemistry_summary && !row.processChemistrySummary ? 'process chemistry summary is required.' : null].filter(Boolean) }));
    return this.db.single<Row>(this.db.from('psi_process_chemistry_import_jobs').insert({ id: randomUUID(), company_id: tenantId, site_id: this.selectedSite(scope), uploaded_by: actorId, file_name: dto.fileName ?? 'process-chemistry-import.csv', file_key: dto.fileKey ?? null, status: preview.some((r: Row) => r.errors.length) ? 'Errors' : 'Preview Ready', total_rows: preview.length, valid_rows: preview.filter((r: Row) => !r.errors.length).length, error_rows: preview.filter((r: Row) => r.errors.length).length, preview_json: preview }).select().single());
  }

  async exportRows(tenantId: string, actorId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    if (rows[0]) await this.writeHistory(tenantId, actorId, 'psi.process_chemistry.exported', rows[0], null, { count: rows.length, query }, 'Process chemistry exported', `${rows.length} rows exported.`);
    return { rows, format: query.format ?? 'json', generatedAt: new Date().toISOString() };
  }

  lookups(kind: string) {
    const map: Record<string, string[]> = { 'chemistry-types': chemistryTypes, 'reaction-phases': reactionPhases, 'operating-modes': operatingModes, 'chemical-roles': chemicalRoles, 'reaction-hazard-levels': hazardLevels, 'unwanted-scenario-types': scenarioTypes, 'chemistry-control-types': controlTypes };
    return map[kind] ?? [];
  }

  private async registryRows(tenantId: string, scope: Scope, query: Row, paginated: boolean, page = 1, limit = 25) {
    let request: any = this.applyScope(this.db.from('psi_process_chemistry').select('*, psi_process_chemistry_conditions(*), psi_process_chemistry_hazards(*)').eq('company_id', tenantId), scope);
    if (query.includeArchived !== 'true') request = request.is('archived_at', null);
    if (query.unitId || query.unit_id) request = request.eq('unit_id', query.unitId ?? query.unit_id);
    if (query.search) request = request.or(`chemistry_name.ilike.%${query.search}%,process_chemistry_summary.ilike.%${query.search}%,main_reaction_equation.ilike.%${query.search}%`);
    if (query.chemistryType) request = request.eq('chemistry_type', query.chemistryType);
    if (query.hazardLevel) request = request.eq('hazard_level', query.hazardLevel);
    if (query.runawayPotential) request = request.eq('runaway_potential', query.runawayPotential);
    if (query.mocRequired === 'true') request = request.eq('moc_update_required', true);
    if (query.pssrBlocker === 'true') request = request.eq('pssr_blocker', true);
    if (query.missingData === 'true') request = request.in('completeness_status', ['Incomplete', 'Critical Gaps', 'Not Reviewed']);
    const [column, direction] = String(query.sort ?? 'updated_at.desc').split('.');
    request = request.order(this.safeSortColumn(column ?? 'updated_at'), { ascending: direction !== 'desc' });
    if (paginated) request = request.range((page - 1) * limit, page * limit - 1);
    const rows = await this.safeMany<Row>(request);
    return rows.map((row: Row) => ({ ...row, conditions: Array.isArray(row.psi_process_chemistry_conditions) ? row.psi_process_chemistry_conditions[0] : row.psi_process_chemistry_conditions, hazards: Array.isArray(row.psi_process_chemistry_hazards) ? row.psi_process_chemistry_hazards[0] : row.psi_process_chemistry_hazards, completenessMissingKeys: row.completeness_status === 'Complete' ? [] : ['conditions', 'scenarios'] }));
  }

  private validate(dto: Row, partial: boolean) {
    if (!partial || dto.chemistry_name !== undefined || dto.chemistryName !== undefined) this.requireText(dto.chemistry_name ?? dto.chemistryName, 'Chemistry record name is required.');
    if (!partial || dto.chemistry_type !== undefined || dto.chemistryType !== undefined) this.requireText(dto.chemistry_type ?? dto.chemistryType, 'Chemistry type is required.');
    if (!partial || dto.process_chemistry_summary !== undefined || dto.processChemistrySummary !== undefined) this.requireText(dto.process_chemistry_summary ?? dto.processChemistrySummary, 'Process chemistry summary is required.');
    if (!partial && !(dto.main_reaction_equation ?? dto.mainReactionEquation) && !(dto.unavailable_reaction_reason ?? dto.unavailableReactionReason)) throw new BadRequestException('Main reaction equation or unavailable reason is required.');
  }

  private payload(tenantId: string, actorId: string, unit: Row, dto: Row, extras: Row) {
    return this.clean({ company_id: tenantId, site_id: unit.site_id, unit_id: unit.id, area_id: dto.area_id ?? dto.areaId ?? unit.area_id ?? null, equipment_id: dto.equipment_id ?? dto.equipmentId ?? null, chemistry_name: dto.chemistry_name ?? dto.chemistryName, chemistry_type: dto.chemistry_type ?? dto.chemistryType, operating_mode: dto.operating_mode ?? dto.operatingMode ?? 'Continuous', process_step: dto.process_step ?? dto.processStep ?? null, status: dto.status ?? 'Draft', process_chemistry_summary: dto.process_chemistry_summary ?? dto.processChemistrySummary, main_reaction_equation: dto.main_reaction_equation ?? dto.mainReactionEquation ?? null, balanced_reaction_available: Boolean(dto.balanced_reaction_available ?? dto.balancedReactionAvailable), unavailable_reaction_reason: dto.unavailable_reaction_reason ?? dto.unavailableReactionReason ?? null, reaction_mechanism_summary: dto.reaction_mechanism_summary ?? dto.reactionMechanismSummary ?? null, process_purpose: dto.process_purpose ?? dto.processPurpose ?? null, desired_conversion: dto.desired_conversion ?? dto.desiredConversion ?? null, desired_selectivity: dto.desired_selectivity ?? dto.desiredSelectivity ?? null, main_side_reactions: dto.main_side_reactions ?? dto.mainSideReactions ?? null, byproducts_summary: dto.byproducts_summary ?? dto.byproductsSummary ?? null, waste_streams_summary: dto.waste_streams_summary ?? dto.wasteStreamsSummary ?? null, reaction_phase: dto.reaction_phase ?? dto.reactionPhase ?? null, reversible_reaction: Boolean(dto.reversible_reaction ?? dto.reversibleReaction), catalyst_involved: Boolean(dto.catalyst_involved ?? dto.catalystInvolved), inhibitor_required: Boolean(dto.inhibitor_required ?? dto.inhibitorRequired), solvent_involved: Boolean(dto.solvent_involved ?? dto.solventInvolved), water_moisture_sensitivity: Boolean(dto.water_moisture_sensitivity ?? dto.waterMoistureSensitivity), air_oxygen_sensitivity: Boolean(dto.air_oxygen_sensitivity ?? dto.airOxygenSensitivity), addition_order_sensitivity: Boolean(dto.addition_order_sensitivity ?? dto.additionOrderSensitivity), mixing_sensitivity: Boolean(dto.mixing_sensitivity ?? dto.mixingSensitivity), cooling_sensitivity: Boolean(dto.cooling_sensitivity ?? dto.coolingSensitivity), hazard_level: dto.hazard_level ?? dto.hazardLevel ?? 'Unknown / Needs Study', runaway_potential: dto.runaway_potential ?? dto.runawayPotential ?? 'Unknown / Needs Study', decomposition_potential: dto.decomposition_potential ?? dto.decompositionPotential ?? 'Unknown / Needs Study', polymerization_potential: dto.polymerization_potential ?? dto.polymerizationPotential ?? 'Unknown / Needs Study', owner_user_id: dto.owner_user_id ?? dto.ownerUserId ?? null, process_engineer_id: dto.process_engineer_id ?? dto.processEngineerId ?? null, hse_reviewer_id: dto.hse_reviewer_id ?? dto.hseReviewerId ?? null, last_review_date: this.dateOrNull(dto.last_review_date ?? dto.lastReviewDate), next_review_due: this.dateOrNull(dto.next_review_due ?? dto.nextReviewDue), review_status: dto.review_status ?? dto.reviewStatus ?? 'Not Reviewed', created_by: actorId, updated_by: actorId, ...extras });
  }

  private conditionsPayload(tenantId: string, chemistry: Row, dto: Row) {
    const fields = ['normal_temperature','min_temperature','max_temperature','temperature_unit','design_temperature_reference','normal_pressure','min_pressure','max_pressure','pressure_unit','design_pressure_reference','ph_normal','ph_min','ph_max','normal_concentration_range','feed_ratio_range','residence_time','reaction_time','agitation_speed','cooling_duty','heating_duty','utility_requirements','inerting_requirement','oxygen_limit','moisture_limit','addition_rate_limit','venting_requirement','heat_release_absorption','gas_generation'];
    const row: Row = { id: dto.id ?? randomUUID(), company_id: tenantId, site_id: chemistry.site_id, chemistry_id: chemistry.id, updated_at: new Date().toISOString() };
    fields.forEach((f) => row[f] = dto[f] ?? dto[this.camel(f)] ?? null);
    return row;
  }

  private hazardsPayload(tenantId: string, chemistry: Row, dto: Row) {
    const fields = ['heat_of_reaction_value','heat_of_reaction_unit','adiabatic_temperature_rise','runaway_potential','decomposition_potential','polymerization_potential','overpressure_potential','gas_generation_potential','toxic_gas_generation_potential','flammable_vapor_generation_potential','corrosion_potential','erosion_solids_potential','fouling_plugging_potential','crystallization_solidification_risk','incompatible_mixing_risk','thermal_instability_risk','shock_friction_sensitivity','static_ignition_concern','dust_explosion_concern','environmental_release_concern','reaction_hazard_summary'];
    const row: Row = { id: dto.id ?? randomUUID(), company_id: tenantId, site_id: chemistry.site_id, chemistry_id: chemistry.id, exothermic: Boolean(dto.exothermic), endothermic: Boolean(dto.endothermic), heat_of_reaction_available: Boolean(dto.heat_of_reaction_available ?? dto.heatOfReactionAvailable), adiabatic_temperature_rise_available: Boolean(dto.adiabatic_temperature_rise_available ?? dto.adiabaticTemperatureRiseAvailable), updated_at: new Date().toISOString() };
    fields.forEach((f) => row[f] = dto[f] ?? dto[this.camel(f)] ?? null);
    return row;
  }

  private rolePayload(tenantId: string, actorId: string, chemistry: Row, chemical: Row, dto: Row) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: chemistry.site_id, chemistry_id: chemistry.id, unit_id: chemistry.unit_id, chemical_id: chemical.id, chemical_role: dto.chemical_role ?? dto.chemicalRole ?? 'Reactant', normal_concentration: dto.normal_concentration ?? dto.normalConcentration ?? null, min_concentration: dto.min_concentration ?? dto.minConcentration ?? null, max_concentration: dto.max_concentration ?? dto.maxConcentration ?? null, concentration_unit: dto.concentration_unit ?? dto.concentrationUnit ?? null, normal_feed_rate: dto.normal_feed_rate ?? dto.normalFeedRate ?? null, feed_rate_unit: dto.feed_rate_unit ?? dto.feedRateUnit ?? null, normal_ratio: dto.normal_ratio ?? dto.normalRatio ?? null, addition_order: dto.addition_order ?? dto.additionOrder ?? null, addition_rate_limit: dto.addition_rate_limit ?? dto.additionRateLimit ?? null, criticality: dto.criticality ?? null, hazard_contribution: dto.hazard_contribution ?? dto.hazardContribution ?? null, notes: dto.notes ?? null, created_by: actorId, updated_by: actorId });
  }

  private scenarioPayload(tenantId: string, actorId: string, chemistry: Row, dto: Row) {
    const severity = dto.severity ?? 'Unknown / Needs Study';
    const hasSafeguard = Boolean(dto.existing_safeguards_summary ?? dto.existingSafeguardsSummary);
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: chemistry.site_id, chemistry_id: chemistry.id, unit_id: chemistry.unit_id, scenario_title: dto.scenario_title ?? dto.scenarioTitle, scenario_type: dto.scenario_type ?? dto.scenarioType ?? 'Other', trigger_cause: dto.trigger_cause ?? dto.triggerCause ?? null, deviation_condition: dto.deviation_condition ?? dto.deviationCondition ?? null, involved_chemicals_json: this.arrayJson(dto.involved_chemicals_json ?? dto.involvedChemicals), expected_behavior: dto.expected_behavior ?? dto.expectedBehavior ?? null, consequence: dto.consequence ?? null, severity, likelihood: dto.likelihood ?? null, existing_safeguards_summary: dto.existing_safeguards_summary ?? dto.existingSafeguardsSummary ?? null, required_operator_response: dto.required_operator_response ?? dto.requiredOperatorResponse ?? null, emergency_response: dto.emergency_response ?? dto.emergencyResponse ?? null, related_hazop_deviation_id: dto.related_hazop_deviation_id ?? dto.relatedHazopDeviationId ?? null, related_lopa_sil_id: dto.related_lopa_sil_id ?? dto.relatedLopaSilId ?? null, related_safe_operating_limit_id: dto.related_safe_operating_limit_id ?? dto.relatedSafeOperatingLimitId ?? null, related_alarm_interlock_sif_id: dto.related_alarm_interlock_sif_id ?? dto.relatedAlarmInterlockSifId ?? null, additional_actions_required: Boolean(dto.additional_actions_required ?? dto.additionalActionsRequired), uncontrolled_high_severity: ['High', 'Critical'].includes(severity) && !hasSafeguard, notes: dto.notes ?? null, created_by: actorId, updated_by: actorId });
  }

  private controlPayload(tenantId: string, actorId: string, chemistry: Row, dto: Row) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: chemistry.site_id, chemistry_id: chemistry.id, unit_id: chemistry.unit_id, control_type: dto.control_type ?? dto.controlType ?? 'Operating procedure', linked_module: dto.linked_module ?? dto.linkedModule ?? null, linked_record_id: dto.linked_record_id ?? dto.linkedRecordId ?? null, control_description: dto.control_description ?? dto.controlDescription, hazard_scenario_id: dto.hazard_scenario_id ?? dto.hazardScenarioId ?? null, required_response: dto.required_response ?? dto.requiredResponse ?? null, reliability_criticality: dto.reliability_criticality ?? dto.reliabilityCriticality ?? null, test_inspection_requirement: dto.test_inspection_requirement ?? dto.testInspectionRequirement ?? null, owner_user_id: dto.owner_user_id ?? dto.ownerUserId ?? null, notes: dto.notes ?? null, created_by: actorId });
  }

  private async upsertSections(tenantId: string, actorId: string, chemistry: Row, dto: Row) {
    await Promise.all([
      this.db.single(this.db.from('psi_process_chemistry_conditions').upsert(this.conditionsPayload(tenantId, chemistry, dto), { onConflict: 'company_id,chemistry_id' }).select('id').single()).catch(() => null),
      this.db.single(this.db.from('psi_process_chemistry_hazards').upsert(this.hazardsPayload(tenantId, chemistry, dto), { onConflict: 'company_id,chemistry_id' }).select('id').single()).catch(() => null)
    ]);
    void actorId;
  }

  private check(key: string, title: string, complete: boolean, severity: string) {
    return { key, title, complete, severity, message: `${title} is missing or incomplete.` };
  }

  private async upsertUnitCompleteness(tenantId: string, chemistry: Row, status: string, critical: number, pssr: boolean) {
    await this.db.single(this.db.from('psi_completeness_evaluations').upsert({ id: randomUUID(), company_id: tenantId, site_id: chemistry.site_id, unit_id: chemistry.unit_id, category: 'Process chemistry', requirement_name: `Process chemistry - ${chemistry.chemistry_name}`, status: status === 'Complete' ? 'Complete' : 'Missing', severity: critical ? 'Critical' : 'High', missing_reason: status === 'Complete' ? null : `Process chemistry completeness is ${status}.`, linked_module: 'PSI Process Chemistry', linked_record_id: chemistry.id, readiness_impact: pssr ? 'PSSR blocker' : 'PSI completeness', pssr_blocker: pssr, evaluated_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'company_id,unit_id,category,requirement_name' }).select('id').single()).catch(() => null);
  }

  private overview(chemistry: Row, roles: Row[], conditions: Row | null, hazards: Row | null, scenarios: Row[], controls: Row[], completeness: Row[]) {
    return { cards: [
      { label: 'Chemistry status', value: chemistry.status, tone: 'neutral' },
      { label: 'Reaction type', value: chemistry.chemistry_type, tone: 'neutral' },
      { label: 'Main chemicals', value: roles.length, tone: roles.length ? 'good' : 'warn' },
      { label: 'Operating mode', value: chemistry.operating_mode, tone: 'neutral' },
      { label: 'Hazard level', value: chemistry.hazard_level, tone: ['High', 'Critical'].includes(chemistry.hazard_level) ? 'danger' : 'neutral' },
      { label: 'Runaway potential', value: chemistry.runaway_potential, tone: ['High', 'Critical', 'Unknown / Needs Study'].includes(chemistry.runaway_potential) ? 'danger' : 'good' },
      { label: 'Decomposition/polymerization', value: `${chemistry.decomposition_potential} / ${chemistry.polymerization_potential}`, tone: 'warn' },
      { label: 'Missing data count', value: completeness.filter((c) => c.status !== 'Complete').length, tone: completeness.some((c) => c.status !== 'Complete') ? 'warn' : 'good' },
      { label: 'Linked safeguards', value: controls.length, tone: controls.length ? 'good' : 'warn' },
      { label: 'Review status', value: chemistry.review_status, tone: 'neutral' },
      { label: 'MOC required', value: chemistry.moc_update_required ? 'Yes' : 'No', tone: chemistry.moc_update_required ? 'warn' : 'neutral' },
      { label: 'PSSR blocker', value: chemistry.pssr_blocker ? 'Yes' : 'No', tone: chemistry.pssr_blocker ? 'danger' : 'good' }
    ], conditions, hazards, scenarios };
  }

  private actions(chemistry: Row) {
    const locked = chemistry.review_status === 'Approved';
    return [{ key: 'edit', label: 'Edit', enabled: !locked, disabledReason: locked ? 'Approved chemistry requires controlled edit/MOC.' : null }, { key: 'run-completeness', label: 'Run Completeness Check', enabled: true }, { key: 'submit-review', label: 'Submit for Review', enabled: !locked }];
  }

  private tabs(id: string) {
    const base = `/process-safety-information/process-chemistry/${id}`;
    return ['Overview', 'Reaction Description', 'Chemicals & Roles', 'Normal Conditions', 'Reaction Hazards', 'Unwanted Scenarios', 'Controls / Safeguards', 'Linked Records', 'Documents', 'Review & Approval', 'Change History'].map((label) => ({ label, href: base, enabled: true }));
  }

  private async section(tenantId: string, scope: Scope, chemistryId: string, table: string) {
    await this.record(tenantId, scope, chemistryId, true);
    return this.safeSingle<Row>(this.db.from(table).select('*').eq('company_id', tenantId).eq('chemistry_id', chemistryId).maybeSingle());
  }

  private async record(tenantId: string, scope: Scope, chemistryId: string, includeArchived = false) {
    let request: any = this.applyScope(this.db.from('psi_process_chemistry').select('*').eq('company_id', tenantId).eq('id', chemistryId), scope);
    if (!includeArchived) request = request.is('archived_at', null);
    const row = await this.safeSingle<Row>(request.maybeSingle());
    if (!row) throw new NotFoundException('Process chemistry not found or outside your company/site access.');
    return row;
  }

  private async unitRecord(tenantId: string, scope: Scope, unitId: string) {
    if (!unitId) throw new BadRequestException('Process unit is required.');
    const row = await this.safeSingle<Row>(this.applyScope(this.db.from('psi_units').select('*').eq('company_id', tenantId).eq('id', unitId), scope).maybeSingle());
    if (!row) throw new NotFoundException('Process unit not found or outside your company/site access.');
    return row;
  }

  private async chemicalRecord(tenantId: string, scope: Scope, chemicalId: string, unitId: string) {
    const row = await this.safeSingle<Row>(this.applyScope(this.db.from('psi_chemicals').select('*').eq('company_id', tenantId).eq('id', chemicalId).eq('unit_id', unitId), scope).maybeSingle());
    if (!row) throw new NotFoundException('Linked chemical not found in the same company/site/unit.');
    return row;
  }

  private async writeHistory(tenantId: string, actorId: string, action: string, chemistry: Row, before: any, after: any, title: string, description?: string | null) {
    const auditInput: { tenantId: string; actorId: string; action: string; entityType: string; entityId?: string; before: JsonValue; after: JsonValue } = { tenantId, actorId, action, entityType: 'PSI_PROCESS_CHEMISTRY', before: before as JsonValue, after: after as JsonValue };
    if (chemistry.id) auditInput.entityId = chemistry.id;
    await this.audit.write(auditInput).catch(() => null);
    await this.db.single(this.db.from('psi_process_chemistry_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: chemistry.site_id, unit_id: chemistry.unit_id, chemistry_id: chemistry.id, event_type: action, event_title: title, event_description: description ?? null, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId }).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('psi_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: chemistry.site_id, unit_id: chemistry.unit_id, event_type: action, event_title: title, event_description: description ?? null, source_module: 'PSI Process Chemistry', source_record_id: chemistry.id, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId }).select('id').single()).catch(() => null);
  }

  private applyScope(query: any, scope: Scope, column = 'site_id') { if (scope.corporateView) return query; if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId); if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds); return query; }
  private selectedSite(scope: Scope) { return scope.selectedSiteId ?? scope.allowedSiteIds?.[0] ?? null; }
  private safeSortColumn(column: string) { return new Set(['updated_at', 'created_at', 'chemistry_name', 'chemistry_type', 'hazard_level', 'runaway_potential', 'review_status']).has(column) ? column : 'updated_at'; }
  private requireText(value: unknown, message: string) { if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(message); return value.trim(); }
  private requireRow<T>(row: T | null | undefined, message: string): T { if (!row) throw new BadRequestException(message); return row; }
  private async safeSingle<T>(query: PromiseLike<any>) { try { return await this.db.single<T>(query); } catch { return null; } }
  private async safeMany<T>(query: PromiseLike<any>) { try { return await this.db.many<T>(query); } catch { return []; } }
  private dateOrNull(value: unknown) { if (!value) return null; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10); }
  private arrayJson(value: unknown) { if (value === undefined || value === null || value === '') return null; if (Array.isArray(value)) return value; if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean); return value; }
  private camel(value: string) { return value.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }
  private clean<T extends Row>(value: T): T { return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T; }
}
