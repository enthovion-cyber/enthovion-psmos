import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchIndexService } from '../search/search-index.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { ActionsService } from '../actions/actions.service';
import { CreateMocDto } from './dto/create-moc.dto';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type UploadedMocFile = { originalname: string; mimetype: string; size: number; buffer: Buffer };

@Injectable()
export class MocService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly searchIndex: SearchIndexService,
    private readonly workflows: WorkflowsService,
    private readonly actions: ActionsService
  ) {}

  async context(tenantId: string, scope: Scope) {
    const [companies, sites, units, areas, departments, users] = await Promise.all([
      this.db.many<any>(this.db.from('Company').select('*').eq('tenantId', tenantId).order('name')),
      this.db.many<any>(this.scopeSiteQuery(this.db.from('Site').select('*').eq('tenantId', tenantId), scope).order('name')),
      this.db.many<any>(this.db.from('Unit').select('*').eq('tenantId', tenantId).order('name')),
      this.db.many<any>(this.db.from('Area').select('*').eq('tenantId', tenantId).order('name')),
      this.db.many<any>(this.db.from('Department').select('*').eq('tenantId', tenantId).order('name')),
      this.db.many<any>(this.db.from('User').select('id,displayName,email,title,department,status').eq('tenantId', tenantId).eq('status', 'ACTIVE').order('displayName'))
    ]);
    return { companies, sites, units, areas, departments, users, siteMaxTemporaryDurationDays: 90 };
  }

  async equipmentSearch(tenantId: string, scope: Scope, search = '') {
    let query = this.db.from('Equipment').select('id,tag,name,type,criticality,safetyCritical,siteId,unitId,areaId,system,fluidService,status').eq('tenantId', tenantId);
    query = this.scopeQuery(query, scope);
    if (search.trim()) query = query.or(`tag.ilike.%${search.trim()}%,name.ilike.%${search.trim()}%`);
    const equipment = await this.db.many<any>(query.order('tag').limit(25));
    if (!equipment.length) return [];
    const ids = equipment.map((item) => item.id);
    const [ptws, actions, linked] = await Promise.all([
      this.db.many<any>(this.db.from('permits').select('id,equipment_id,status').in('equipment_id', ids).in('status', ['Active', 'Submitted', 'Under Review'])),
      this.db.many<any>(this.db.from('Action').select('id,equipmentId,status').in('equipmentId', ids).in('status', ['OPEN', 'IN_PROGRESS', 'PENDING_VERIFICATION'])),
      this.db.many<any>(this.db.from('EquipmentLinkedRecord').select('*').eq('tenantId', tenantId).in('equipmentId', ids))
    ]);
    return equipment.map((item) => ({
      ...item,
      linkedPtwCount: ptws.filter((row) => row.equipment_id === item.id).length,
      openActionCount: actions.filter((row) => row.equipmentId === item.id).length,
      openIncidentCount: linked.filter((row) => row.equipmentId === item.id && row.moduleKey === 'incident' && !['Closed', 'CLOSED'].includes(row.status)).length,
      openHazopRecommendationCount: linked.filter((row) => row.equipmentId === item.id && row.moduleKey === 'hazop' && !['Closed', 'CLOSED'].includes(row.status)).length
    }));
  }

  async list(tenantId: string, scope: Scope, filters: Record<string, any> = {}) {
    let query = this.db.from('mocs').select('*').eq('tenant_id', tenantId);
    if (scope.selectedSiteId) query = query.eq('site_id', scope.selectedSiteId);
    else if (!scope.corporateView && scope.allowedSiteIds?.length) query = query.in('site_id', scope.allowedSiteIds);
    const riskLevel = filters.riskLevel ?? filters.risk_level;
    const changeType = filters.changeType ?? filters.change_type;
    const siteId = filters.siteId ?? filters.site_id;
    const unitId = filters.unitId ?? filters.unit_id;
    const areaId = filters.areaId ?? filters.area_id;
    const departmentId = filters.departmentId ?? filters.department_id;
    const originatorId = filters.originatorId ?? filters.originator_id;
    const workflowStatus = filters.workflowStatus ?? filters.workflow_status;
    if (filters.status) query = query.eq('status', filters.status);
    if (riskLevel) query = query.eq('risk_level', riskLevel);
    if (changeType) query = query.eq('change_type', changeType);
    if (siteId) query = query.eq('site_id', siteId);
    if (unitId) query = query.eq('unit_id', unitId);
    if (areaId) query = query.eq('area_id', areaId);
    if (departmentId) query = query.eq('department_id', departmentId);
    if (originatorId) query = query.eq('originator_id', originatorId);
    if (workflowStatus) query = query.eq('workflow_status', workflowStatus);
    if (filters.is_temporary !== undefined) query = query.eq('is_temporary', String(filters.is_temporary) === 'true');
    if (filters.is_emergency !== undefined) query = query.eq('is_emergency', String(filters.is_emergency) === 'true');
    if (filters.date_from) query = query.gte('created_at', filters.date_from);
    if (filters.date_to) query = query.lte('created_at', filters.date_to);
    if (filters.search) {
      const value = String(filters.search).trim().replace(/[,%*()]/g, ' ').replace(/\s+/g, ' ');
      if (value) query = query.or(`moc_number.ilike.%${value}%,title.ilike.%${value}%,description.ilike.%${value}%`);
    }
    const limit = Math.min(Number(filters.limit ?? 50), 100);
    const page = Math.max(Number(filters.page ?? 1), 1);
    const from = (page - 1) * limit;
    const rows = await this.db.many<any>(query.order('updated_at', { ascending: false }).range(from, from + limit - 1));
    return rows;
  }

  async get(tenantId: string, id: string, scope: Scope) {
    const moc = await this.db.single<any>(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!moc) throw new NotFoundException('MOC not found');
    this.assertSiteAccess(moc.site_id, scope);
    const [company, site, unit, area, department, originator, equipment, risk, impact, engineeringPackage, documents, actions, temporary, emergency, pssr, communication, training, attachments, history] = await Promise.all([
      moc.company_id ? this.db.single<any>(this.db.from('Company').select('id,name,code').eq('tenantId', tenantId).eq('id', moc.company_id).maybeSingle()) : null,
      moc.site_id ? this.db.single<any>(this.db.from('Site').select('id,name,code').eq('tenantId', tenantId).eq('id', moc.site_id).maybeSingle()) : null,
      moc.unit_id ? this.db.single<any>(this.db.from('Unit').select('id,name,code').eq('tenantId', tenantId).eq('id', moc.unit_id).maybeSingle()) : null,
      moc.area_id ? this.db.single<any>(this.db.from('Area').select('id,name,code').eq('tenantId', tenantId).eq('id', moc.area_id).maybeSingle()) : null,
      moc.department_id ? this.db.single<any>(this.db.from('Department').select('id,name,code').eq('tenantId', tenantId).eq('id', moc.department_id).maybeSingle()) : null,
      moc.originator_id ? this.db.single<any>(this.db.from('User').select('id,displayName,email,title,department').eq('tenantId', tenantId).eq('id', moc.originator_id).maybeSingle()) : null,
      this.db.many<any>(this.db.from('moc_affected_equipment').select('*, equipment:Equipment(*)').eq('tenant_id', tenantId).eq('moc_id', id)),
      this.db.single<any>(this.db.from('moc_risk_assessments').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.single<any>(this.db.from('moc_impact_assessments').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.single<any>(this.db.from('moc_engineering_packages').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.many<any>(this.db.from('moc_engineering_documents').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('uploaded_at', { ascending: false })),
      this.db.many<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at')),
      this.db.single<any>(this.db.from('moc_temporary_controls').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.single<any>(this.db.from('moc_emergency_controls').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.single<any>(this.db.from('moc_pssr_requirements').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle()),
      this.db.many<any>(this.db.from('moc_communication_records').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at', { ascending: false })),
      this.db.many<any>(this.db.from('moc_training_requirements').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at', { ascending: false })),
      this.db.many<any>(this.db.from('moc_attachments').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('uploaded_at', { ascending: false })),
      this.db.many<any>(this.db.from('moc_history_events').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at', { ascending: false }))
    ]);
    return { ...moc, company, site, unit, area, department, originator, equipment, risk, impact, engineeringPackage, documents, actions, temporary, emergency, pssr, communication, training, attachments, history, summary: this.buildSummary({ ...moc, equipment, risk, impact, engineeringPackage, documents, actions, temporary, emergency, pssr, communication, training, attachments, history }) };
  }

  async create(tenantId: string, actorId: string, dto: CreateMocDto, scope: Scope, submit = false) {
    this.validate(dto, submit);
    this.assertSiteAccess(dto.siteId, scope);
    const risk = this.calculateRisk(dto.risk ?? { safetyImpact: 0, environmentalImpact: 0, productionImpact: 0 });
    const site = await this.db.single<any>(this.db.from('Site').select('*').eq('tenantId', tenantId).eq('id', dto.siteId).maybeSingle());
    if (!site) throw new BadRequestException('Site is required');
    const companyId = dto.companyId ?? site.companyId ?? site.company_id;
    if (!companyId) throw new BadRequestException('Company could not be resolved for selected site');
    const now = new Date().toISOString();
    const moc = await this.db.single<any>(this.db.from('mocs').insert({
      id: crypto.randomUUID(),
      moc_number: await this.nextMocNumber(tenantId),
      tenant_id: tenantId,
      company_id: companyId,
      site_id: dto.siteId,
      department_id: dto.departmentId || null,
      unit_id: dto.unitId || null,
      area_id: dto.areaId || null,
      title: dto.title?.trim() || 'Untitled MOC Draft',
      description: dto.description?.trim() || 'Draft MOC request',
      affected_system: dto.affectedSystem || null,
      location_description: dto.locationDescription || null,
      change_description: dto.changeDescription ?? {},
      like_for_like: dto.likeForLike ?? {},
      change_type: dto.changeType ?? 'Permanent Process Change',
      change_category: dto.changeCategory ?? 'Process',
      priority: dto.priority ?? 'Medium',
      risk_level: risk.level,
      risk_score: risk.score,
      status: submit ? 'Submitted' : 'Draft',
      originator_id: dto.originatorId ?? actorId,
      requested_start_date: dto.requestedStartDate ?? null,
      target_implementation_date: dto.targetImplementationDate || null,
      submitted_at: submit ? now : null,
      created_by: actorId,
      updated_at: now
    }).select().single());
    await this.saveChildren(tenantId, actorId, moc, dto, risk);
    await this.audit.write({ tenantId, actorId, action: submit ? 'MOC_SUBMITTED' : 'MOC_DRAFT_CREATED', entityType: 'MOC', entityId: moc.id, after: moc as JsonValue });
    await this.history(tenantId, moc.id, actorId, submit ? 'MOC_SUBMITTED' : 'MOC_DRAFT_CREATED', submit ? 'MOC submitted for review' : 'MOC draft created', null, moc);
    await this.indexMoc(tenantId, moc.id);
    if (submit) await this.afterSubmit(tenantId, actorId, moc, dto, risk, scope);
    return this.get(tenantId, moc.id, scope);
  }

  async submit(tenantId: string, actorId: string, id: string, scope: Scope) {
    const before = await this.get(tenantId, id, scope);
    if (before.status !== 'Draft') throw new BadRequestException('Only draft MOCs can be submitted');
    const updated = await this.db.single<any>(this.db.from('mocs').update({ status: 'Submitted', submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, id, actorId, 'MOC_SUBMITTED', 'MOC submitted for review', before, updated);
    await this.audit.write({ tenantId, actorId, action: 'MOC_SUBMITTED', entityType: 'MOC', entityId: id, before: before as JsonValue, after: updated as JsonValue });
    await this.indexMoc(tenantId, id);
    return this.get(tenantId, id, scope);
  }

  async uploadDocument(tenantId: string, actorId: string, id: string, dto: Record<string, string>, file: UploadedMocFile | undefined, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    const fileName = file?.originalname ?? dto.fileName;
    if (!fileName) throw new BadRequestException('Document file is required');
    const document = await this.db.single<any>(this.db.from('moc_engineering_documents').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      moc_id: id,
      document_type: dto.documentType ?? 'Other supporting documents',
      title: dto.title ?? fileName,
      file_name: fileName,
      mime_type: file?.mimetype ?? dto.mimeType ?? 'application/octet-stream',
      size_bytes: file?.size ?? Number(dto.sizeBytes ?? 0),
      storage_key: dto.storageKey ?? `moc/${tenantId}/${id}/${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      document_id: dto.documentId ?? null,
      justification: dto.justification ?? null,
      uploaded_by: actorId
    }).select().single());
    await this.history(tenantId, id, actorId, 'MOC_DOCUMENT_UPLOADED', `${document.title} uploaded`, null, document);
    await this.audit.write({ tenantId, actorId, action: 'MOC_DOCUMENT_UPLOADED', entityType: 'MOC', entityId: id, after: document as JsonValue });
    return document;
  }

  async deleteDocument(tenantId: string, actorId: string, id: string, documentId: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    const doc = await this.db.single<any>(this.db.from('moc_engineering_documents').delete().eq('tenant_id', tenantId).eq('moc_id', id).eq('id', documentId).select().single());
    await this.history(tenantId, id, actorId, 'MOC_DOCUMENT_DELETED', `${doc.title} deleted`, doc, null);
    return { deleted: true, id: documentId };
  }

  async summary(tenantId: string, id: string, scope: Scope) {
    return (await this.get(tenantId, id, scope)).summary;
  }

  async update(tenantId: string, actorId: string, id: string, dto: Partial<CreateMocDto>, scope: Scope) {
    const before = await this.get(tenantId, id, scope);
    if (['Closed', 'Cancelled'].includes(before.status)) throw new BadRequestException('Closed or cancelled MOCs cannot be edited');
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.changeType !== undefined) patch.change_type = dto.changeType;
    if (dto.changeCategory !== undefined) patch.change_category = dto.changeCategory;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.departmentId !== undefined) patch.department_id = dto.departmentId || null;
    if (dto.unitId !== undefined) patch.unit_id = dto.unitId || null;
    if (dto.areaId !== undefined) patch.area_id = dto.areaId || null;
    if (dto.locationDescription !== undefined) patch.location_description = dto.locationDescription || null;
    if (dto.affectedSystem !== undefined) patch.affected_system = dto.affectedSystem || null;
    if (dto.requestedStartDate !== undefined) patch.requested_start_date = dto.requestedStartDate || null;
    if (dto.targetImplementationDate !== undefined) patch.target_implementation_date = dto.targetImplementationDate || null;
    if (dto.changeDescription !== undefined) patch.change_description = dto.changeDescription;
    if (dto.likeForLike !== undefined) patch.like_for_like = dto.likeForLike;
    const updated = await this.db.single<any>(this.db.from('mocs').update(patch).eq('tenant_id', tenantId).eq('id', id).select().single());
    if (dto.equipmentIds !== undefined || dto.primaryEquipmentId !== undefined) await this.replaceEquipment(tenantId, actorId, updated, dto);
    await this.history(tenantId, id, actorId, 'MOC_DETAILS_EDITED', 'MOC details edited', before, updated);
    await this.audit.write({ tenantId, actorId, action: 'MOC_DETAILS_EDITED', entityType: 'MOC', entityId: id, before: before as JsonValue, after: updated as JsonValue });
    await this.indexMoc(tenantId, id);
    return this.get(tenantId, id, scope);
  }

  async transition(tenantId: string, actorId: string, id: string, transition: string, body: Record<string, any>, scope: Scope) {
    const before = await this.get(tenantId, id, scope);
    const next: Record<string, string> = {
      approve: 'Approved',
      reject: 'Rejected',
      return: 'Draft',
      'start-implementation': 'Implementation',
      'mark-implementation-complete': before.pssr?.required ? 'Pending PSSR' : 'Ready For Startup',
      'ready-for-startup': 'Ready For Startup',
      close: 'Closed',
      cancel: 'Cancelled'
    };
    const target = next[transition];
    if (!target) throw new BadRequestException('Unsupported MOC transition');
    this.validateTransition(before, target);
    const updated = await this.db.single<any>(this.db.from('mocs').update({ status: target, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, id, actorId, `MOC_${target.toUpperCase().replaceAll(' ', '_')}`, body?.comment || `MOC moved to ${target}`, before, updated);
    await this.audit.write({ tenantId, actorId, action: `MOC_${target.toUpperCase().replaceAll(' ', '_')}`, entityType: 'MOC', entityId: id, before: before as JsonValue, after: updated as JsonValue });
    await this.indexMoc(tenantId, id);
    await this.notifications.notifyUser({ tenantId, userId: updated.originator_id ?? actorId, companyId: updated.company_id, siteId: updated.site_id, type: `moc.${target.toLowerCase().replaceAll(' ', '_')}`, module: 'moc', title: `${updated.moc_number} ${target}`, message: body?.comment || updated.title, relatedRecordId: id, relatedRecordType: 'MOC', relatedUrl: `/moc/${id}`, priority: target === 'Rejected' ? 'High' : 'Normal' }).catch(() => null);
    return this.get(tenantId, id, scope);
  }

  async duplicate(tenantId: string, actorId: string, id: string, scope: Scope) {
    const source = await this.get(tenantId, id, scope);
    const cloneDto: any = {
      title: `${source.title} Copy`,
      description: source.description,
      siteId: source.site_id,
      companyId: source.company_id,
      changeType: source.change_type,
      changeCategory: source.change_category,
      priority: source.priority,
      affectedSystem: source.affected_system,
      locationDescription: source.location_description,
      changeDescription: source.change_description,
      likeForLike: source.like_for_like,
      risk: { safetyImpact: source.risk?.safety_impact ?? 0, environmentalImpact: source.risk?.environmental_impact ?? 0, productionImpact: source.risk?.production_impact ?? 0 },
      impactAssessment: source.impact?.answers ?? {},
      equipmentIds: source.equipment?.map((item: any) => item.equipment_id) ?? [],
      primaryEquipmentId: source.equipment?.find((item: any) => item.role === 'PRIMARY')?.equipment_id
    };
    if (source.department_id) cloneDto.departmentId = source.department_id;
    if (source.unit_id) cloneDto.unitId = source.unit_id;
    if (source.area_id) cloneDto.areaId = source.area_id;
    if (source.target_implementation_date) cloneDto.targetImplementationDate = source.target_implementation_date;
    const clone = await this.create(tenantId, actorId, cloneDto, scope, false);
    await this.history(tenantId, clone.id, actorId, 'MOC_DUPLICATED', `Duplicated from ${source.moc_number}`, source, clone);
    return clone;
  }

  async getRisk(tenantId: string, id: string, scope: Scope) {
    return (await this.get(tenantId, id, scope)).risk;
  }

  async updateRisk(tenantId: string, actorId: string, id: string, dto: any, scope: Scope) {
    const before = await this.get(tenantId, id, scope);
    const risk = this.calculateRisk({ safetyImpact: dto.safetyImpact, environmentalImpact: dto.environmentalImpact, productionImpact: dto.productionImpact });
    const row = await this.upsertSingle('moc_risk_assessments', 'moc_id', id, {
      tenant_id: tenantId,
      company_id: before.company_id,
      site_id: before.site_id,
      moc_id: id,
      safety_impact: dto.safetyImpact,
      environmental_impact: dto.environmentalImpact,
      production_impact: dto.productionImpact,
      total_score: risk.score,
      risk_level: risk.level,
      rationale: dto.rationale ?? null,
      before_risk: dto.beforeRisk ?? {},
      after_risk: dto.afterRisk ?? {},
      created_by: actorId,
      updated_at: new Date().toISOString()
    });
    await this.db.single(this.db.from('mocs').update({ risk_level: risk.level, risk_score: risk.score, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    if (risk.level === 'Critical') await this.ensurePssr(tenantId, actorId, before, 'Critical risk ranking requires PSSR');
    await this.history(tenantId, id, actorId, 'MOC_RISK_CHANGED', 'Risk ranking changed', before.risk, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_RISK_CHANGED', entityType: 'MOC', entityId: id, before: before.risk as JsonValue, after: row as JsonValue });
    await this.regenerateRequiredActions(tenantId, actorId, id, scope);
    return this.get(tenantId, id, scope);
  }

  async getImpact(tenantId: string, id: string, scope: Scope) {
    return (await this.get(tenantId, id, scope)).impact;
  }

  async updateImpact(tenantId: string, actorId: string, id: string, answers: Record<string, any>, scope: Scope) {
    const before = await this.get(tenantId, id, scope);
    const row = await this.upsertSingle('moc_impact_assessments', 'moc_id', id, { tenant_id: tenantId, company_id: before.company_id, site_id: before.site_id, moc_id: id, answers, created_by: actorId, updated_at: new Date().toISOString() });
    await this.history(tenantId, id, actorId, 'MOC_IMPACT_CHANGED', 'Impact assessment changed', before.impact, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_IMPACT_CHANGED', entityType: 'MOC', entityId: id, before: before.impact as JsonValue, after: row as JsonValue });
    await this.regenerateRequiredActions(tenantId, actorId, id, scope);
    return this.get(tenantId, id, scope);
  }

  async engineeringDocuments(tenantId: string, id: string, scope: Scope) {
    return (await this.get(tenantId, id, scope)).documents;
  }

  async linkEngineeringDocument(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_engineering_documents').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: id,
      document_type: dto.documentType ?? 'Controlled document',
      title: dto.title ?? dto.documentNumber ?? 'Linked controlled document',
      document_id: dto.documentId,
      controlled_document_status: dto.status ?? 'Linked',
      version_label: dto.versionLabel ?? null,
      created_by: actorId,
      uploaded_by: actorId
    }).select().single());
    await this.history(tenantId, id, actorId, 'MOC_DOCUMENT_LINKED', `${row.title} linked`, null, row);
    return row;
  }

  async requiredActions(tenantId: string, id: string, scope: Scope) {
    return (await this.get(tenantId, id, scope)).actions;
  }

  async regenerateRequiredActions(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    const generated = this.generateRequiredActions(moc.impact?.answers ?? {}, { level: moc.risk_level, score: moc.risk_score }, moc.change_type);
    const existing = moc.actions ?? [];
    for (const current of existing.filter((item: any) => item.system_generated)) {
      if (!generated.some((item) => item.actionType === current.action_type)) {
        await this.db.single(this.db.from('moc_required_actions').update({ required: false, status: current.action_id ? current.status : 'No Longer Required', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', current.id).select().single());
      }
    }
    const inserts = generated.filter((item) => !existing.some((current: any) => current.action_type === item.actionType)).map((item: any) => ({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: id,
      action_type: item.actionType,
      title: item.title,
      description: item.description ?? item.title,
      priority: item.priority ?? 'MEDIUM',
      required: true,
      system_generated: true,
      status: 'Preview',
      linked_module: item.actionType,
      required_before_startup: ['PSSR', 'Training', 'HAZOP', 'LOPA'].includes(item.actionType),
      required_before_closure: true,
      source_impact_answer: item.sourceImpactAnswer ?? item.actionType,
      created_by: actorId
    }));
    if (inserts.length) await this.db.many(this.db.from('moc_required_actions').insert(inserts).select());
    await this.history(tenantId, id, actorId, 'MOC_REQUIRED_ACTIONS_REGENERATED', 'Required actions regenerated from impact assessment', existing, generated);
    return this.requiredActions(tenantId, id, scope);
  }

  async addRequiredAction(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_required_actions').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: id,
      action_type: dto.actionType ?? 'Custom action',
      title: dto.title,
      description: dto.description ?? null,
      priority: dto.priority ?? 'MEDIUM',
      required: dto.required ?? true,
      system_generated: false,
      status: 'Preview',
      owner_id: dto.ownerId ?? null,
      due_date: dto.dueDate ?? null,
      required_before_startup: dto.requiredBeforeStartup ?? false,
      required_before_closure: dto.requiredBeforeClosure ?? true,
      created_by: actorId
    }).select().single());
    await this.history(tenantId, id, actorId, 'MOC_REQUIRED_ACTION_ADDED', `${row.title} added`, null, row);
    return row;
  }

  async updateRequiredAction(tenantId: string, actorId: string, id: string, actionId: string, dto: Record<string, any>, scope: Scope) {
    await this.get(tenantId, id, scope);
    const before = await this.db.single<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', id).eq('id', actionId).maybeSingle());
    if (!before) throw new NotFoundException('MOC action not found');
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [from, to] of [['title', 'title'], ['description', 'description'], ['priority', 'priority'], ['status', 'status'], ['ownerId', 'owner_id'], ['dueDate', 'due_date'], ['evidenceStatus', 'evidence_status'], ['verificationStatus', 'verification_status'], ['requiredBeforeStartup', 'required_before_startup'], ['requiredBeforeClosure', 'required_before_closure']] as const) {
      if (dto[from] !== undefined) patch[to] = dto[from];
    }
    const row = await this.db.single<any>(this.db.from('moc_required_actions').update(patch).eq('tenant_id', tenantId).eq('id', actionId).select().single());
    await this.history(tenantId, id, actorId, 'MOC_REQUIRED_ACTION_UPDATED', `${row.title} updated`, before, row);
    return row;
  }

  async workflow(tenantId: string, id: string, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    return {
      template: moc.risk_level === 'Critical' ? 'Critical MOC Workflow' : moc.risk_level === 'High' ? 'High Risk MOC Workflow' : 'Standard MOC Workflow',
      currentStep: moc.status,
      pendingApprovers: moc.risk_level === 'Critical' ? ['HAZOP Review', 'HSE Director', 'VP Operations', 'Plant Manager'] : moc.risk_level === 'High' ? ['HSE Director', 'VP Operations'] : ['Department Head', 'HSE Manager'],
      completedApprovers: moc.status === 'Draft' || moc.status === 'Submitted' ? [] : ['Originator Submit'],
      rejectedSteps: moc.status === 'Rejected' ? ['Approval'] : [],
      returnedForRevisionSteps: moc.status === 'Draft' && moc.submitted_at ? ['Returned for Revision'] : [],
      slaDueDates: [],
      escalations: [],
      comments: [],
      history: moc.history
    };
  }

  async getTemporaryControl(tenantId: string, id: string, scope: Scope) {
    return (await this.get(tenantId, id, scope)).temporary;
  }

  async updateTemporaryControl(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    const row = await this.upsertSingle('moc_temporary_controls', 'moc_id', id, {
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: id,
      expiry_date: dto.expiryDate,
      duration_days: dto.durationDays,
      reason: dto.reason,
      risk_controls: dto.riskControls,
      reversal_plan: dto.reversalPlan,
      removal_owner_id: dto.removalOwnerId ?? null,
      extension_allowed: dto.extensionAllowed ?? false,
      created_by: actorId,
      updated_at: new Date().toISOString()
    });
    await this.history(tenantId, id, actorId, 'MOC_TEMPORARY_CONTROL_UPDATED', 'Temporary control updated', moc.temporary, row);
    return row;
  }

  async extendTemporaryControl(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    if (!moc.temporary) throw new BadRequestException('Temporary control does not exist');
    const history = [...(moc.temporary.extension_history ?? []), { requestedBy: actorId, requestedAt: new Date().toISOString(), previousExpiryDate: moc.temporary.expiry_date, newExpiryDate: dto.expiryDate, reason: dto.reason, status: 'Pending Re-Approval' }];
    const row = await this.db.single<any>(this.db.from('moc_temporary_controls').update({ expiry_date: dto.expiryDate, duration_days: dto.durationDays ?? moc.temporary.duration_days, extension_history: history, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('moc_id', id).select().single());
    await this.history(tenantId, id, actorId, 'MOC_TEMPORARY_CHANGE_EXTENDED', 'Temporary change extension requested', moc.temporary, row);
    return row;
  }

  async getEmergencyControl(tenantId: string, id: string, scope: Scope) {
    return (await this.get(tenantId, id, scope)).emergency;
  }

  async updateEmergencyControl(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    const row = await this.upsertSingle('moc_emergency_controls', 'moc_id', id, {
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: id,
      emergency_justification: dto.emergencyJustification,
      immediate_risk_controls: dto.immediateRiskControls,
      implemented_by: dto.implementedBy ?? actorId,
      implementation_datetime: dto.implementationDateTime,
      post_review_due_date: dto.postReviewDueDate,
      review_status: dto.reviewStatus ?? 'Pending',
      review_owner_id: dto.reviewOwnerId ?? null,
      review_findings: dto.reviewFindings ?? null,
      created_by: actorId,
      updated_at: new Date().toISOString()
    });
    await this.history(tenantId, id, actorId, 'MOC_EMERGENCY_CONTROL_UPDATED', 'Emergency control updated', moc.emergency, row);
    return row;
  }

  async completeEmergencyReview(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_emergency_controls').update({ review_status: 'Completed', review_findings: dto.reviewFindings, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('moc_id', id).select().single());
    await this.history(tenantId, id, actorId, 'MOC_EMERGENCY_REVIEW_COMPLETED', 'Emergency 72-hour review completed', null, row);
    return row;
  }

  async pssr(tenantId: string, id: string, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    return moc.pssr ?? this.derivedPssrRequirement(moc);
  }

  async triggerPssr(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    const row = await this.ensurePssr(tenantId, actorId, moc, dto.triggerReason ?? 'PSSR manually triggered');
    await this.history(tenantId, id, actorId, 'MOC_PSSR_TRIGGERED', row.trigger_reason, null, row);
    return row;
  }

  async communicationTraining(tenantId: string, id: string, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    return { communication: moc.communication, training: moc.training, stakeholders: moc.communication?.filter((item: any) => item.record_type === 'Stakeholder') ?? [] };
  }

  async addStakeholder(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    return this.addCommunicationRecord(tenantId, actorId, id, { ...dto, recordType: 'Stakeholder' }, scope);
  }

  async addCommunication(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    return this.addCommunicationRecord(tenantId, actorId, id, { ...dto, recordType: 'Communication', sentAt: new Date().toISOString() }, scope);
  }

  async addTrainingRequirement(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_training_requirements').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: id, role_name: dto.roleName, training_topic: dto.trainingTopic, required_before_startup: dto.requiredBeforeStartup ?? true, status: dto.status ?? 'Open', linked_training_record_id: dto.linkedTrainingRecordId ?? null, created_by: actorId }).select().single());
    await this.history(tenantId, id, actorId, 'MOC_TRAINING_REQUIREMENT_CREATED', `${row.role_name}: ${row.training_topic}`, null, row);
    return row;
  }

  async historyEvents(tenantId: string, id: string, scope: Scope) {
    return (await this.get(tenantId, id, scope)).history;
  }

  async attachments(tenantId: string, id: string, scope: Scope) {
    return (await this.get(tenantId, id, scope)).attachments;
  }

  async uploadAttachment(tenantId: string, actorId: string, id: string, dto: Record<string, string>, file: UploadedMocFile | undefined, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    const fileName = file?.originalname ?? dto.fileName;
    if (!fileName) throw new BadRequestException('Attachment file is required');
    const row = await this.db.single<any>(this.db.from('moc_attachments').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: id, attachment_type: dto.attachmentType ?? 'Other files', title: dto.title ?? fileName, file_name: fileName, mime_type: file?.mimetype ?? dto.mimeType ?? 'application/octet-stream', size_bytes: file?.size ?? Number(dto.sizeBytes ?? 0), storage_key: dto.storageKey ?? `moc-attachments/${tenantId}/${id}/${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`, document_id: dto.documentId ?? null, uploaded_by: actorId, created_by: actorId }).select().single());
    await this.history(tenantId, id, actorId, 'MOC_ATTACHMENT_UPLOADED', `${row.title} uploaded`, null, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_ATTACHMENT_UPLOADED', entityType: 'MOC', entityId: id, after: row as JsonValue });
    return row;
  }

  async deleteAttachment(tenantId: string, actorId: string, id: string, attachmentId: string, scope: Scope) {
    await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_attachments').delete().eq('tenant_id', tenantId).eq('moc_id', id).eq('id', attachmentId).select().single());
    await this.history(tenantId, id, actorId, 'MOC_ATTACHMENT_DELETED', `${row.title} deleted`, row, null);
    return { deleted: true, id: attachmentId };
  }

  async report(tenantId: string, id: string, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    return { fileName: `${moc.moc_number}.json`, mimeType: 'application/json', generatedAt: new Date().toISOString(), record: moc };
  }

  generatedActionsPreview(dto: Partial<CreateMocDto> & { impactAssessment?: Record<string, any>; risk?: any; changeType?: string }) {
    return this.generateRequiredActions(dto.impactAssessment ?? {}, dto.risk ? this.calculateRisk(dto.risk) : { level: 'Low', score: 0 }, dto.changeType);
  }

  async createGeneratedActions(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    const rows = moc.actions?.length ? moc.actions : this.generateRequiredActions(moc.impact?.answers ?? {}, { level: moc.risk_level, score: moc.risk_score }, moc.change_type);
    const created = [];
    for (const row of rows) {
      if (row.action_id) continue;
      const actionInput: any = {
        title: row.title,
        description: row.description ?? row.title,
        sourceModule: 'MOC',
        sourceRecordId: id,
        sourceType: 'MOC',
        siteId: moc.site_id,
        ownerId: moc.originator_id ?? actorId,
        priority: row.priority ?? 'MEDIUM',
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        evidenceRequired: true,
        verificationRequired: true
      };
      if (moc.department_id) actionInput.departmentId = moc.department_id;
      const action = await this.actions.create(tenantId, actorId, actionInput);
      await this.db.single(this.db.from('moc_required_actions').update({ action_id: action.id, status: 'Created' }).eq('tenant_id', tenantId).eq('id', row.id).select().single());
      created.push(action);
    }
    return created;
  }

  private async saveChildren(tenantId: string, actorId: string, moc: any, dto: CreateMocDto, risk: { score: number; level: string }) {
    const dtoRisk = dto.risk ?? { safetyImpact: 0, environmentalImpact: 0, productionImpact: 0 };
    await this.db.single(this.db.from('moc_risk_assessments').insert({ id: crypto.randomUUID(), tenant_id: tenantId, moc_id: moc.id, safety_impact: dtoRisk.safetyImpact, environmental_impact: dtoRisk.environmentalImpact, production_impact: dtoRisk.productionImpact, total_score: risk.score, risk_level: risk.level }).select().single());
    await this.db.single(this.db.from('moc_impact_assessments').insert({ id: crypto.randomUUID(), tenant_id: tenantId, moc_id: moc.id, answers: dto.impactAssessment ?? {} }).select().single());
    const equipmentIds = Array.from(new Set([dto.primaryEquipmentId, ...(dto.equipmentIds ?? [])].filter(Boolean))) as string[];
    if (equipmentIds.length) {
      const equipment = await this.db.many<any>(this.db.from('Equipment').select('*').eq('tenantId', tenantId).in('id', equipmentIds));
      await this.db.many(this.db.from('moc_affected_equipment').insert(equipment.map((item) => ({ id: crypto.randomUUID(), tenant_id: tenantId, moc_id: moc.id, equipment_id: item.id, role: item.id === dto.primaryEquipmentId ? 'PRIMARY' : 'RELATED', equipment_snapshot: item }))).select());
      await Promise.all(equipment.map((item) => this.linkEquipment(tenantId, actorId, item, moc)));
    }
    if (dto.engineeringDocuments?.length) {
      await this.db.many(this.db.from('moc_engineering_documents').insert(dto.engineeringDocuments.map((doc) => ({ id: crypto.randomUUID(), tenant_id: tenantId, moc_id: moc.id, document_type: doc.documentType, title: doc.title, file_name: doc.fileName ?? null, mime_type: doc.mimeType ?? null, size_bytes: doc.sizeBytes ?? 0, storage_key: doc.storageKey ?? null, document_id: doc.documentId ?? null, justification: doc.justification ?? null, uploaded_by: actorId }))).select());
    }
    if (dto.changeType === 'Temporary Change' && dto.temporaryControls) await this.db.single(this.db.from('moc_temporary_controls').insert({ id: crypto.randomUUID(), tenant_id: tenantId, moc_id: moc.id, expiry_date: dto.temporaryControls.expiryDate, duration_days: dto.temporaryControls.durationDays, reason: dto.temporaryControls.reason, risk_controls: dto.temporaryControls.riskControls, reversal_plan: dto.temporaryControls.reversalPlan, removal_owner_id: dto.temporaryControls.removalOwnerId ?? null, extension_allowed: dto.temporaryControls.extensionAllowed ?? false }).select().single());
    if (dto.changeType === 'Emergency Change' && dto.emergencyControls) await this.db.single(this.db.from('moc_emergency_controls').insert({ id: crypto.randomUUID(), tenant_id: tenantId, moc_id: moc.id, emergency_justification: dto.emergencyControls.emergencyJustification, immediate_risk_controls: dto.emergencyControls.immediateRiskControls, implemented_by: dto.emergencyControls.implementedBy ?? actorId, implementation_datetime: dto.emergencyControls.implementationDateTime, post_review_due_date: dto.emergencyControls.postReviewDueDate }).select().single());
    const actions = [...this.generateRequiredActions(dto.impactAssessment ?? {}, risk, dto.changeType), ...(dto.additionalActions ?? []).map((item) => ({ ...item, required: false, systemGenerated: false }))];
    if (actions.length) await this.db.many(this.db.from('moc_required_actions').insert(actions.map((item: any) => ({ id: crypto.randomUUID(), tenant_id: tenantId, moc_id: moc.id, action_type: item.actionType ?? 'Additional', title: item.title, description: item.description ?? null, priority: item.priority ?? 'MEDIUM', required: item.required ?? true, system_generated: item.systemGenerated ?? true, status: 'Preview' }))).select());
  }

  private validate(dto: CreateMocDto, submit: boolean) {
    if (!submit) return;
    if (!dto.title?.trim()) throw new BadRequestException('MOC title is required');
    if (!dto.description?.trim()) throw new BadRequestException('MOC description is required');
    if (!dto.siteId) throw new BadRequestException('Site is required');
    if (!dto.changeType) throw new BadRequestException('Change type is required');
    if (!dto.changeCategory) throw new BadRequestException('Change category is required');
    if (!dto.departmentId) throw new BadRequestException('Owning department is required');
    if (!dto.targetImplementationDate) throw new BadRequestException('Target implementation date is required');
    if (!dto.risk) throw new BadRequestException('Risk ranking is required');
    const processLike = ['Process', 'Equipment', 'Operating Limit', 'Safety System', 'Software / Control System'].includes(dto.changeCategory ?? '');
    if (processLike && (!dto.unitId || !dto.areaId)) throw new BadRequestException('Unit and area are required for process/equipment changes');
    if (dto.changeCategory === 'Equipment' && !(dto.equipmentIds?.length || dto.primaryEquipmentId)) throw new BadRequestException('At least one equipment tag is required for equipment changes');
    const desc = dto.changeDescription ?? {};
    for (const key of ['currentCondition', 'proposedChange', 'reasonForChange']) if (!desc[key]) throw new BadRequestException(`${key} is required`);
    if (processLike && (!desc.preChangeState || !desc.postChangeState)) throw new BadRequestException('Pre-change and post-change state are required');
    if (dto.changeType === 'Temporary Change') {
      if (!dto.temporaryControls?.expiryDate) throw new BadRequestException('Temporary change expiry date is required');
      if ((dto.temporaryControls.durationDays ?? 0) > 90) throw new BadRequestException('Temporary change duration exceeds the default 90 day site limit');
    }
    if (dto.changeType === 'Emergency Change') {
      if (!dto.emergencyControls?.postReviewDueDate) throw new BadRequestException('Emergency post-implementation review is required within 72 hours');
      const implementation = new Date(dto.emergencyControls.implementationDateTime).getTime();
      const due = new Date(dto.emergencyControls.postReviewDueDate).getTime();
      if (due - implementation > 72 * 60 * 60 * 1000) throw new BadRequestException('Emergency post-implementation review must be within 72 hours');
    }
  }

  private calculateRisk(risk: { safetyImpact: number; environmentalImpact: number; productionImpact: number }) {
    const score = Number(risk.safetyImpact) + Number(risk.environmentalImpact) + Number(risk.productionImpact);
    const level = score <= 2 ? 'Low' : score <= 4 ? 'Medium' : score <= 7 ? 'High' : 'Critical';
    return { score, level };
  }

  private generateRequiredActions(impact: Record<string, any>, risk: { level: string; score: number }, changeType?: string) {
    const actions: Array<Record<string, any>> = [];
    const add = (condition: boolean, actionType: string, title: string, priority = 'MEDIUM', sourceImpactAnswer = actionType) => { if (condition) actions.push({ actionType, title, description: title, priority, required: true, systemGenerated: true, sourceImpactAnswer }); };
    add(impact.sopUpdateRequired, 'SOP', 'Update affected SOPs', 'MEDIUM', 'sopUpdateRequired');
    add(impact.pidUpdateRequired || impact.pidRevisionRequired, 'P&ID', 'Update P&ID / engineering drawings', 'HIGH', 'pidUpdateRequired');
    add(impact.sdsUpdateRequired, 'SDS', 'Update SDS and chemical safety information', 'MEDIUM', 'sdsUpdateRequired');
    add(impact.psiUpdateRequired, 'PSI', 'Update process safety information', 'MEDIUM', 'psiUpdateRequired');
    add(impact.trainingRequired, 'Training', 'Complete training for affected roles', 'HIGH', 'trainingRequired');
    add(impact.operatingLimitsChanged || impact.hazopDeviationReviewRequired || risk.level === 'Critical', 'HAZOP', 'Complete HAZOP deviation review', 'HIGH', 'hazopDeviationReviewRequired');
    add(impact.lopaReviewRequired || impact.sisAffected || impact.safetySystemAffected, 'LOPA', 'Complete LOPA / SIS revalidation', 'HIGH', 'lopaReviewRequired');
    add(impact.equipmentRegistryUpdateRequired, 'Equipment', 'Update Equipment Registry', 'MEDIUM', 'equipmentRegistryUpdateRequired');
    add(impact.documentControlUpdateRequired, 'Document Control', 'Create Document Control revision action', 'MEDIUM', 'documentControlUpdateRequired');
    add(risk.level === 'Critical' || changeType === 'Emergency Change', 'PSSR', 'PSSR required before startup', 'SAFETY_CRITICAL', 'pssrRequired');
    return actions;
  }

  private buildSummary(moc: any) {
    const actions = moc.actions ?? [];
    const requiredActions = actions.filter((item: any) => item.required !== false);
    const verifiedActions = requiredActions.filter((item: any) => item.verification_status === 'Verified' || item.status === 'Completed' || item.status === 'Closed');
    const startupBlockers = [
      ...requiredActions.filter((item: any) => item.required_before_startup && !['Completed', 'Closed'].includes(item.status)),
      ...(moc.pssr?.required && !['Completed', 'Ready'].includes(moc.pssr.status) ? [{ title: 'PSSR incomplete' }] : []),
      ...((moc.training ?? []).filter((item: any) => item.required_before_startup && item.status !== 'Completed'))
    ];
    const docTypes = (moc.documents ?? []).map((item: any) => item.document_type);
    const requiredDocs = ['P&ID redline / markup', 'Design basis document', 'Equipment datasheets'];
    const completeDocs = requiredDocs.filter((type) => docTypes.includes(type)).length;
    const engineeringPackage = moc.engineeringPackage;
    const requiredEngineeringDocuments = engineeringPackage?.required_documents_count ?? requiredDocs.length;
    const missingEngineeringDocuments = engineeringPackage?.missing_required_documents_count ?? Math.max(requiredDocs.length - completeDocs, 0);
    const approvedEngineeringDocuments = engineeringPackage?.approved_documents_count ?? completeDocs;
    const temporaryDaysRemaining = moc.temporary?.expiry_date ? Math.ceil((new Date(moc.temporary.expiry_date).getTime() - Date.now()) / 86400000) : null;
    return {
      approvalProgress: this.approvalProgress(moc.status),
      requiredActionCompletion: { total: requiredActions.length, completed: verifiedActions.length, percent: requiredActions.length ? Math.round((verifiedActions.length / requiredActions.length) * 100) : 100 },
      engineeringPackageReadiness: {
        status: engineeringPackage?.status ?? (completeDocs === requiredDocs.length ? 'Ready For Review' : 'Not Started'),
        readinessStatus: engineeringPackage?.readiness_status ?? (missingEngineeringDocuments ? 'Not Ready' : 'Ready'),
        required: requiredEngineeringDocuments,
        completed: approvedEngineeringDocuments,
        missing: missingEngineeringDocuments,
        percent: requiredEngineeringDocuments ? Math.round((approvedEngineeringDocuments / requiredEngineeringDocuments) * 100) : 100
      },
      pssrStatus: moc.pssr ?? this.derivedPssrRequirement(moc),
      startupBlockers,
      startupReady: startupBlockers.length === 0,
      documentReadiness: { total: requiredDocs.length, complete: completeDocs },
      temporaryDaysRemaining,
      trainingStatus: { total: moc.training?.length ?? 0, completed: (moc.training ?? []).filter((item: any) => item.status === 'Completed').length },
      impactCompletion: this.impactCompletion(moc.impact?.answers ?? {}),
      latestHistory: (moc.history ?? []).slice(0, 5)
    };
  }

  private approvalProgress(status: string) {
    const statuses = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Implementation', 'Pending PSSR', 'Ready For Startup', 'Closed'];
    const index = Math.max(0, statuses.indexOf(status));
    return { currentStep: status, percent: Math.round(((index + 1) / statuses.length) * 100), steps: statuses.map((item, stepIndex) => ({ status: item, complete: stepIndex <= index, active: item === status })) };
  }

  private impactCompletion(impact: Record<string, any>) {
    const keys = ['equipmentAffected', 'pidUpdateRequired', 'datasheetUpdateRequired', 'equipmentRegistryUpdateRequired', 'chemistryAffected', 'sdsUpdateRequired', 'psiUpdateRequired', 'sopUpdateRequired', 'operatingLimitsChanged', 'hazopDeviationReviewRequired', 'sisAffected', 'lopaReviewRequired', 'trainingRequired', 'documentControlUpdateRequired'];
    const answered = keys.filter((key) => impact[key] !== undefined && impact[key] !== '').length;
    return { answered, total: keys.length, percent: Math.round((answered / keys.length) * 100) };
  }

  private validateTransition(moc: any, target: string) {
    if (['Closed', 'Cancelled'].includes(moc.status)) throw new BadRequestException('Closed and cancelled MOCs are final');
    const requiredActions = (moc.actions ?? []).filter((item: any) => item.required !== false);
    const startupBlocking = requiredActions.filter((item: any) => item.required_before_startup && !['Completed', 'Closed'].includes(item.status));
    const closureBlocking = requiredActions.filter((item: any) => item.required_before_closure && !(item.evidence_status === 'Uploaded' || item.evidence_status === 'Accepted') && item.verification_status !== 'Verified');
    const engineeringPackage = moc.engineeringPackage;
    if (target === 'Approved') {
      if (!moc.impact) throw new BadRequestException('Cannot approve if required impact assessment is incomplete');
      if (!moc.risk) throw new BadRequestException('Cannot approve if risk ranking is incomplete');
      if (['High', 'Critical'].includes(moc.risk_level) && !engineeringPackage && !(moc.documents ?? []).length) throw new BadRequestException('High/Critical MOC requires engineering package or approved justification');
      if (engineeringPackage?.missing_required_documents_count > 0) throw new BadRequestException('Required engineering documents are missing');
      if (engineeringPackage && !['Approved', 'Ready For Review'].includes(engineeringPackage.status)) throw new BadRequestException('Engineering package is not ready for approval');
    }
    if (target === 'Ready For Startup') {
      if (startupBlocking.length) throw new BadRequestException('Startup-blocking actions are incomplete');
      if (engineeringPackage?.readiness_status === 'Blocked') throw new BadRequestException('Engineering package has startup blockers');
      if (engineeringPackage?.missing_required_documents_count > 0) throw new BadRequestException('Startup-blocking engineering documents are missing');
      if (moc.pssr?.required && !['Completed', 'Ready'].includes(moc.pssr.status)) throw new BadRequestException('PSSR is required but incomplete');
    }
    if (target === 'Closed') {
      if (closureBlocking.length) throw new BadRequestException('Cannot close until all required actions are verified with evidence');
      if (moc.change_type === 'Temporary Change' && !moc.temporary?.reversal_plan) throw new BadRequestException('Temporary removal/reversal plan is incomplete');
      if (moc.change_type === 'Emergency Change' && moc.emergency?.review_status !== 'Completed') throw new BadRequestException('Emergency 72-hour review is incomplete');
    }
  }

  private async upsertSingle(table: string, key: string, keyValue: string, payload: Record<string, any>) {
    const existing = await this.db.single<any>(this.db.from(table).select('*').eq(key, keyValue).maybeSingle());
    if (existing) return this.db.single<any>(this.db.from(table).update(payload).eq(key, keyValue).select().single());
    return this.db.single<any>(this.db.from(table).insert({ id: crypto.randomUUID(), ...payload }).select().single());
  }

  private derivedPssrRequirement(moc: any) {
    const required = ['High', 'Critical'].includes(moc.risk_level) || Boolean(moc.impact?.answers?.sisAffected || moc.impact?.answers?.equipmentAffected || moc.impact?.answers?.operatingLimitsChanged);
    return { required, status: required ? 'Required' : 'Not Required', trigger_reason: required ? 'Risk, equipment, process, or safety-system change' : 'No PSSR trigger', readiness_score: required ? 0 : 100, startup_blockers: required ? ['PSSR not triggered'] : [] };
  }

  private async ensurePssr(tenantId: string, actorId: string, moc: any, reason: string) {
    return this.upsertSingle('moc_pssr_requirements', 'moc_id', moc.id, {
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: moc.id,
      required: true,
      trigger_reason: reason,
      status: 'Required',
      startup_blockers: ['PSSR not completed'],
      readiness_score: 0,
      created_by: actorId,
      updated_at: new Date().toISOString()
    });
  }

  private async replaceEquipment(tenantId: string, actorId: string, moc: any, dto: Partial<CreateMocDto>) {
    await this.db.many(this.db.from('moc_affected_equipment').delete().eq('tenant_id', tenantId).eq('moc_id', moc.id).select());
    const equipmentIds = Array.from(new Set([dto.primaryEquipmentId, ...(dto.equipmentIds ?? [])].filter(Boolean))) as string[];
    if (!equipmentIds.length) return;
    const equipment = await this.db.many<any>(this.db.from('Equipment').select('*').eq('tenantId', tenantId).in('id', equipmentIds));
    await this.db.many(this.db.from('moc_affected_equipment').insert(equipment.map((item) => ({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, equipment_id: item.id, role: item.id === dto.primaryEquipmentId ? 'PRIMARY' : 'RELATED', equipment_snapshot: item, created_by: actorId }))).select());
    await Promise.all(equipment.map((item) => this.linkEquipment(tenantId, actorId, item, moc)));
  }

  private async addCommunicationRecord(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.get(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_communication_records').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: id,
      record_type: dto.recordType ?? 'Communication',
      stakeholder_name: dto.stakeholderName ?? null,
      stakeholder_role: dto.stakeholderRole ?? null,
      department_id: dto.departmentId ?? null,
      message: dto.message ?? null,
      acknowledgement_required: dto.acknowledgementRequired ?? false,
      acknowledged_at: dto.acknowledgedAt ?? null,
      sent_at: dto.sentAt ?? null,
      created_by: actorId
    }).select().single());
    await this.history(tenantId, id, actorId, `MOC_${String(row.record_type).toUpperCase()}_ADDED`, row.message ?? row.stakeholder_name ?? row.record_type, null, row);
    return row;
  }

  private async nextMocNumber(tenantId: string) {
    const year = new Date().getFullYear();
    const prefix = `MOC-${year}-`;
    const rows = await this.db.many<any>(this.db.from('mocs').select('moc_number').eq('tenant_id', tenantId).like('moc_number', `${prefix}%`).order('moc_number', { ascending: false }).limit(1));
    const last = rows[0]?.moc_number ? Number(String(rows[0].moc_number).split('-').pop()) : 0;
    return `${prefix}${String(last + 1).padStart(6, '0')}`;
  }

  private async afterSubmit(tenantId: string, actorId: string, moc: any, dto: CreateMocDto, risk: { score: number; level: string }, scope: Scope) {
    await this.createGeneratedActions(tenantId, actorId, moc.id, scope).catch(() => []);
    await this.workflows.startWorkflow(tenantId, actorId, { module: 'MOC', recordId: moc.id, recordNumber: moc.moc_number, siteId: moc.site_id, companyId: moc.company_id, contextData: { riskLevel: risk.level, changeType: dto.changeType } }, scope).catch(() => null);
    await this.notifications.notifyUser({ tenantId, userId: actorId, companyId: moc.company_id, siteId: moc.site_id, type: risk.level === 'Critical' ? 'moc.critical.submitted' : 'moc.approval.request', module: 'moc', title: `${moc.moc_number} submitted`, message: `${moc.title} submitted with ${risk.level} risk`, relatedRecordId: moc.id, relatedRecordType: 'MOC', relatedUrl: `/moc/${moc.id}`, priority: risk.level === 'Critical' ? 'Safety-Critical' : 'High' }).catch(() => null);
  }

  private async linkEquipment(tenantId: string, actorId: string, equipment: any, moc: any) {
    await this.db.single(this.db.from('EquipmentLinkedRecord').upsert({ id: `equipment-moc-${equipment.id}-${moc.id}`, tenantId, equipmentId: equipment.id, moduleKey: 'moc', recordType: 'MOC', recordId: moc.id, title: `${moc.moc_number} - ${moc.title}`, status: moc.status, priority: moc.risk_level, url: `/moc/${moc.id}` }, { onConflict: 'tenantId,equipmentId,moduleKey,recordId' }).select().single());
    await this.db.single(this.db.from('EquipmentTimelineEvent').insert({ id: crypto.randomUUID(), tenantId, equipmentId: equipment.id, eventType: 'MOC_SUBMITTED', title: `MOC linked: ${moc.moc_number}`, actorName: actorId, occurredAt: new Date().toISOString(), sourceType: 'MOC', sourceId: moc.id }).select().single());
  }

  private history(tenantId: string, mocId: string, actorId: string, eventType: string, title: string, before: unknown, after: unknown) {
    return this.db.single(this.db.from('moc_history_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, moc_id: mocId, event_type: eventType, title, actor_id: actorId, before_value: before ?? null, after_value: after ?? null }).select().single());
  }

  private async indexMoc(tenantId: string, id: string) {
    const moc = await this.db.single<any>(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!moc) return;
    await this.searchIndex.indexRecord(tenantId, { module: 'moc', recordType: 'MOC', recordId: moc.id, recordNumber: moc.moc_number, title: moc.title, description: moc.description, status: moc.status, priority: moc.risk_level, siteId: moc.site_id, url: `/moc/${moc.id}`, searchableText: [moc.moc_number, moc.title, moc.change_type, moc.change_category, moc.risk_level, moc.status].join(' '), metadata: { changeType: moc.change_type, changeCategory: moc.change_category } });
  }

  private scopeQuery(query: any, scope: Scope) {
    if (scope.selectedSiteId) return query.eq('siteId', scope.selectedSiteId);
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in('siteId', scope.allowedSiteIds);
    return query;
  }

  private scopeSiteQuery(query: any, scope: Scope) {
    if (scope.selectedSiteId) return query.eq('id', scope.selectedSiteId);
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in('id', scope.allowedSiteIds);
    return query;
  }

  private assertSiteAccess(siteId: string | null | undefined, scope: Scope) {
    if (!siteId || scope.corporateView) return;
    if (scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('MOC is outside your site access scope');
  }
}
