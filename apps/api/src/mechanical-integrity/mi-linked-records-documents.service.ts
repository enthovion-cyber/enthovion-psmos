import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { AuditService } from '../audit/audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { DocumentsService } from '../documents/documents.service';
import { NotificationsService } from '../notifications/notifications.service';

type Query = Record<string, string | undefined>;
type UploadedFile = { originalname: string; mimetype: string; size: number; buffer: Buffer };

export const miLinkedRecordTypes = [
  'Equipment','CML/TML','Inspection Plan / ITP','Inspection Record','UT Reading / Reading Campaign','Remaining Life Evaluation','Criticality Assessment','PM Plan','PM Record','Calibration Plan','Calibration Record','PSV / Relief Device','PSV Test','SIF / SIS','Interlock','Critical Alarm','Safeguard Test','Bypass / Impairment','Deficiency','Deviation','Work Order','Action','Readiness Assessment','MOC','PSSR','HAZOP/PHA','LOPA/SIL','Incident / Near Miss','PTW','LOTO / Isolation','Audit','Training','SOP / Procedure','Document Control record'
];
export const miRelationshipTypes = ['Source','Evidence','Supports','Caused By','Corrects','Verifies','Blocks','Clears','Requires','Supersedes','Related','Parent','Child','Follow-up','Approval Basis','Readiness Basis','MOC Trigger','PSSR Requirement','Test Evidence','Inspection Evidence','Certificate','Calculation Basis'];
export const miDocumentTypes = [
  'Equipment datasheet','Vendor manual','Manufacturer certificate','Nameplate photo','P&ID','PFD','Isometric drawing','General arrangement drawing','Mechanical drawing','Electrical drawing','Instrument datasheet','Cause & effect matrix','Logic narrative','SRS document','Alarm rationalization','Relief basis calculation','Design calculation','Material certificate','Inspection procedure','Maintenance procedure','Calibration procedure','SOP','JSA/JHA','Method statement','Inspection report','NDT report','UT report','CML/TML report','Thickness survey','Corrosion study','RBI/criticality report','Remaining life calculation','Fitness-for-service assessment','Repair report','Hydrotest report','Leak test report','Pressure test certificate','PSV test certificate','PSV repair certificate','Relief calculation','Rupture disk certificate','SIF proof test report','Interlock test report','Critical alarm test report','Functional test report','Calibration certificate','Reference standard certificate','Bypass approval document','Impairment mitigation document','Readiness approval package','PSSR checklist evidence','MOC approval document','Deficiency closure evidence','Deviation approval','Work completion package','Photos/evidence','Regulatory certificate','External inspection certificate','Insurance inspection report','Third-party approval report'
];
const documentStatuses = ['Draft','Pending Review','Approved','Current','Superseded','Expired','Rejected','Archived','Missing','Not Required','Required','Waived With Approval'];

@Injectable()
export class MiLinkedRecordsDocumentsService {
  constructor(
    private readonly db: SupabaseService,
    private readonly documents: DocumentsService,
    private readonly actions: ActionsService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService
  ) {}

  async linkedRecords(user: RequestUser, query: Query = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    let request = this.applyScope(this.db.from('mi_linked_records').select('*', { count: 'exact' }), user, query);
    request = this.applyLinkFilters(request, query);
    const { data, error, count } = await request.order('updated_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    return { rows, page, limit, total: count ?? rows.length, summary: this.linkSummary(rows), savedViews: ['All Links','Broken Links','Permission Limited','MOC Links','PSSR Links','Incident Links','Deficiency Links','Work Order Links','Inspection Links','PSV/SIF Links'], lastUpdated: new Date().toISOString() };
  }

  async linkedRecord(user: RequestUser, linkId: string) {
    const row = await this.db.single<any>(this.applyScope(this.db.from('mi_linked_records').select('*').eq('id', linkId), user, {}).maybeSingle());
    if (!row) throw new NotFoundException('Linked record not found.');
    const history = await this.history(user, { linkId });
    return { row, history, permissionStatus: row.permission_limited ? 'Limited' : 'Full' };
  }

  async createLinkedRecord(user: RequestUser, body: Record<string, any>) {
    const sourceModule = this.required(body.sourceModule ?? body.source_module, 'Source module is required.');
    const sourceRecordId = this.required(body.sourceRecordId ?? body.source_record_id, 'Source record is required.');
    const targetModule = this.required(body.targetModule ?? body.target_module, 'Target module is required.');
    const targetRecordId = this.required(body.targetRecordId ?? body.target_record_id, 'Target record is required.');
    const relationshipType = this.required(body.relationshipType ?? body.relationship_type, 'Relationship type is required.');
    const source = await this.resolveRecord(user, sourceModule, sourceRecordId, body.equipmentId ?? body.equipment_id);
    const target = await this.resolveRecord(user, targetModule, targetRecordId, source.equipment_id);
    if (source.site_id !== target.site_id) throw new BadRequestException('Source and target records must belong to the same site.');
    const duplicate = await this.db.single<any>(this.db.from('mi_linked_records').select('id').eq('company_id', user.tenantId).eq('source_module', sourceModule).eq('source_record_id', sourceRecordId).eq('target_module', targetModule).eq('target_record_id', targetRecordId).eq('relationship_type', relationshipType).maybeSingle()).catch(() => null);
    if (duplicate && body.allowDuplicate !== true) throw new BadRequestException('Duplicate linked record relationship is not allowed.');
    const row = await this.db.single<any>(this.db.from('mi_linked_records').insert({
      company_id: user.tenantId,
      site_id: source.site_id,
      equipment_id: source.equipment_id ?? target.equipment_id ?? null,
      source_module: sourceModule,
      source_record_id: sourceRecordId,
      source_record_number: body.sourceRecordNumber ?? body.source_record_number ?? source.record_number ?? null,
      target_module: targetModule,
      target_record_id: targetRecordId,
      target_record_number: body.targetRecordNumber ?? body.target_record_number ?? target.record_number ?? null,
      relationship_type: relationshipType,
      relationship_description: body.relationshipDescription ?? body.relationship_description ?? null,
      readiness_impact: !!(body.readinessImpact ?? body.readiness_impact),
      primary_link: !!(body.primaryLink ?? body.primary_link),
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.event(user, { ...row, link_id: row.id }, 'LINKED_RECORD_CREATED', 'Linked record created', null, row);
    return row;
  }

  async updateLinkedRecord(user: RequestUser, linkId: string, body: Record<string, any>) {
    const before = (await this.linkedRecord(user, linkId)).row;
    const patch: Record<string, unknown> = { updated_by: user.id, updated_at: new Date().toISOString() };
    if (body.relationshipType ?? body.relationship_type) patch.relationship_type = body.relationshipType ?? body.relationship_type;
    if (body.relationshipDescription !== undefined || body.relationship_description !== undefined) patch.relationship_description = body.relationshipDescription ?? body.relationship_description ?? null;
    if (body.readinessImpact !== undefined || body.readiness_impact !== undefined) patch.readiness_impact = !!(body.readinessImpact ?? body.readiness_impact);
    if (body.primaryLink !== undefined || body.primary_link !== undefined) patch.primary_link = !!(body.primaryLink ?? body.primary_link);
    if (body.active !== undefined) patch.active = !!body.active;
    const row = await this.db.single<any>(this.db.from('mi_linked_records').update(patch).eq('company_id', user.tenantId).eq('id', linkId).select().single());
    await this.event(user, { ...row, link_id: row.id }, 'LINKED_RECORD_UPDATED', 'Linked record updated', before, row);
    return row;
  }

  async removeLinkedRecord(user: RequestUser, linkId: string) {
    const before = (await this.linkedRecord(user, linkId)).row;
    const row = await this.db.single<any>(this.db.from('mi_linked_records').update({ active: false, updated_by: user.id, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', linkId).select().single());
    await this.event(user, { ...row, link_id: row.id }, 'LINKED_RECORD_REMOVED', 'Linked record removed', before, row);
    return row;
  }

  async equipmentLinkedRecords(user: RequestUser, equipmentId: string, query: Query = {}) {
    await this.resolveEquipment(user, equipmentId);
    return this.linkedRecords(user, { ...query, equipmentId });
  }

  moduleLinkedRecords(user: RequestUser, module: string, recordId: string) {
    return this.linkedRecords(user, { sourceModule: module, sourceRecordId: recordId });
  }

  async documentsDashboard(user: RequestUser, query: Query = {}) {
    const rows = await this.documentRows(user, query);
    const evaluations = await this.evaluations(user, query);
    const requirements = {
      rows: evaluations,
      missing: evaluations.filter((row) => row.status === 'Missing'),
      readinessBlockers: evaluations.filter((row) => row.readiness_blocker)
    };
    return { rows, summary: await this.documentSummary(user, rows, evaluations), requirements, savedViews: ['All Documents','Required','Missing','Expired','Pending Approval','Superseded','Current Approved','Readiness Blocking','PSV Certificates Missing','Calibration Certificates Missing','SIF Proof Test Reports Missing','Inspection Reports Missing','FFS Evidence Missing'], lastUpdated: new Date().toISOString() };
  }

  async documentDetail(user: RequestUser, documentLinkId: string) {
    const row = await this.db.single<any>(this.applyScope(this.db.from('mi_document_links').select('*').eq('id', documentLinkId), user, {}).maybeSingle());
    if (!row) throw new NotFoundException('Document link not found.');
    const document = await this.documentStatus(user, row.document_id).catch(() => null);
    const history = await this.history(user, { documentLinkId });
    return { row: { ...row, document }, history };
  }

  async linkDocument(user: RequestUser, body: Record<string, any>) {
    const documentId = this.required(body.documentId ?? body.document_id, 'Document ID is required.');
    const linkedModule = this.required(body.linkedModule ?? body.linked_module, 'Linked module is required.');
    const linkedRecordId = this.required(body.linkedRecordId ?? body.linked_record_id, 'Linked record is required.');
    const documentType = this.required(body.documentType ?? body.document_type, 'Document type is required.');
    const source = await this.resolveRecord(user, linkedModule, linkedRecordId, body.equipmentId ?? body.equipment_id);
    const doc = await this.documentStatus(user, documentId);
    if (doc.site_id && doc.site_id !== source.site_id) throw new BadRequestException('Document and linked record must belong to the same site.');
    const row = await this.db.single<any>(this.db.from('mi_document_links').insert({
      company_id: user.tenantId,
      site_id: source.site_id,
      equipment_id: source.equipment_id ?? body.equipmentId ?? body.equipment_id ?? null,
      linked_module: linkedModule,
      linked_record_id: linkedRecordId,
      linked_record_number: body.linkedRecordNumber ?? body.linked_record_number ?? source.record_number ?? null,
      document_id: documentId,
      file_id: body.fileId ?? body.file_id ?? doc.current_version_id ?? null,
      document_type: documentType,
      relationship_type: body.relationshipType ?? body.relationship_type ?? 'Evidence',
      purpose: body.purpose ?? null,
      required: !!body.required,
      readiness_impact: !!(body.readinessImpact ?? body.readiness_impact),
      expiry_required: !!(body.expiryRequired ?? body.expiry_required),
      owner_user_id: body.ownerUserId ?? body.owner_user_id ?? null,
      linked_by: user.id
    }).select().single());
    await this.event(user, { ...row, document_link_id: row.id }, 'DOCUMENT_LINKED', 'MI document link created', null, row);
    return { ...row, document: doc };
  }

  async uploadAndLinkDocument(user: RequestUser, body: Record<string, any>, file?: UploadedFile) {
    const siteId = body.siteId ?? body.site_id ?? user.selectedSiteId ?? user.siteIds[0];
    const document = await this.documents.create(user.tenantId, user.id, {
      title: this.required(body.title, 'Document title is required.'),
      description: body.description,
      documentType: this.required(body.documentType ?? body.document_type, 'Document type is required.'),
      siteId,
      unitId: body.unitId ?? body.unit_id,
      areaId: body.areaId ?? body.area_id,
      ownerId: body.ownerUserId ?? body.owner_id ?? user.id,
      relatedEquipmentId: body.equipmentId ?? body.equipment_id,
      relatedModule: body.linkedModule ?? body.linked_module,
      relatedRecordId: body.linkedRecordId ?? body.linked_record_id,
      relationType: body.relationshipType ?? body.relationship_type ?? 'Evidence'
    } as any, file, this.scope(user));
    return this.linkDocument(user, { ...body, documentId: document.id });
  }

  async removeDocumentLink(user: RequestUser, documentLinkId: string, body: Record<string, any> = {}) {
    const before = (await this.documentDetail(user, documentLinkId)).row;
    if (body.locked === true && !(body.reason ?? body.removeReason)) throw new BadRequestException('Removal reason is required for approved or locked source records.');
    const row = await this.db.single<any>(this.db.from('mi_document_links').update({ active: false, removed_by: user.id, removed_at: new Date().toISOString(), remove_reason: body.reason ?? body.removeReason ?? null }).eq('company_id', user.tenantId).eq('id', documentLinkId).select().single());
    await this.event(user, { ...row, document_link_id: row.id }, 'DOCUMENT_UNLINKED', 'MI document link removed', before, row);
    return row;
  }

  async equipmentDocuments(user: RequestUser, equipmentId: string, query: Query = {}) {
    await this.resolveEquipment(user, equipmentId);
    const data = await this.documentsDashboard(user, { ...query, equipmentId });
    const requirements = await this.evaluateRequirements(user, { equipmentId, sourceModule: 'Equipment', sourceRecordId: equipmentId });
    return { ...data, requirements };
  }

  moduleDocuments(user: RequestUser, module: string, recordId: string) {
    return this.documentsDashboard(user, { linkedModule: module, linkedRecordId: recordId });
  }

  async requirements(user: RequestUser, query: Query = {}) {
    let request = this.applyRequirementScope(this.db.from('mi_document_requirements').select('*'), user, query);
    if (query.documentType) request = request.eq('document_type', query.documentType);
    if (query.moduleName) request = request.eq('module_name', query.moduleName);
    if (query.scope) request = request.eq('requirement_scope', query.scope);
    return this.db.many<any>(request.order('requirement_name'));
  }

  async createRequirement(user: RequestUser, body: Record<string, any>) {
    const row = await this.db.single<any>(this.db.from('mi_document_requirements').insert({
      company_id: user.tenantId,
      site_id: body.siteId ?? body.site_id ?? null,
      requirement_name: this.required(body.requirementName ?? body.requirement_name, 'Requirement name is required.'),
      requirement_scope: body.requirementScope ?? body.requirement_scope ?? 'Equipment',
      equipment_type: body.equipmentType ?? body.equipment_type ?? null,
      equipment_category: body.equipmentCategory ?? body.equipment_category ?? null,
      module_name: body.moduleName ?? body.module_name ?? null,
      record_type: body.recordType ?? body.record_type ?? null,
      document_type: this.required(body.documentType ?? body.document_type, 'Document type is required.'),
      required_condition_json: body.requiredConditionJson ?? body.required_condition_json ?? null,
      readiness_impact: !!(body.readinessImpact ?? body.readiness_impact),
      startup_blocker_if_missing: !!(body.startupBlockerIfMissing ?? body.startup_blocker_if_missing),
      expiry_required: !!(body.expiryRequired ?? body.expiry_required),
      approval_required_for_waiver: body.approvalRequiredForWaiver ?? body.approval_required_for_waiver ?? true,
      created_by: user.id,
      updated_by: user.id
    }).select().single());
    await this.event(user, { ...row, equipment_id: null }, 'DOCUMENT_REQUIREMENT_CREATED', 'MI document requirement created', null, row);
    return row;
  }

  async updateRequirement(user: RequestUser, requirementId: string, body: Record<string, any>) {
    const before = await this.requirement(user, requirementId);
    const row = await this.db.single<any>(this.db.from('mi_document_requirements').update({
      requirement_name: body.requirementName ?? body.requirement_name ?? before.requirement_name,
      document_type: body.documentType ?? body.document_type ?? before.document_type,
      readiness_impact: body.readinessImpact ?? body.readiness_impact ?? before.readiness_impact,
      startup_blocker_if_missing: body.startupBlockerIfMissing ?? body.startup_blocker_if_missing ?? before.startup_blocker_if_missing,
      expiry_required: body.expiryRequired ?? body.expiry_required ?? before.expiry_required,
      active: body.active ?? before.active,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }).eq('company_id', user.tenantId).eq('id', requirementId).select().single());
    await this.event(user, { ...row, equipment_id: null }, 'DOCUMENT_REQUIREMENT_UPDATED', 'MI document requirement updated', before, row);
    return row;
  }

  async archiveRequirement(user: RequestUser, requirementId: string) {
    return this.updateRequirement(user, requirementId, { active: false });
  }

  async evaluateRequirements(user: RequestUser, body: Record<string, any>) {
    const equipmentId = body.equipmentId ?? body.equipment_id ?? null;
    const sourceModule = body.sourceModule ?? body.source_module ?? (equipmentId ? 'Equipment' : 'Mechanical Integrity');
    const sourceRecordId = body.sourceRecordId ?? body.source_record_id ?? equipmentId ?? null;
    const equipment = equipmentId ? await this.resolveEquipment(user, equipmentId) : null;
    const siteId = equipment?.site_id ?? body.siteId ?? body.site_id ?? user.selectedSiteId ?? user.siteIds[0];
    const requirements = await this.requirements(user, { siteId, moduleName: sourceModule });
    const docs = await this.documentRows(user, { equipmentId: equipmentId ?? undefined, linkedModule: sourceModule, linkedRecordId: sourceRecordId ?? undefined });
    const created = [];
    for (const req of requirements.filter((item) => item.active !== false)) {
      const matching = docs.find((doc) => String(doc.document_type).toLowerCase() === String(req.document_type).toLowerCase() && doc.active !== false);
      const status = matching ? this.normalizedDocumentStatus(matching.document) : 'Missing';
      const readinessBlocker = !matching && (req.readiness_impact || req.startup_blocker_if_missing);
      const row = await this.db.single<any>(this.db.from('mi_document_requirement_evaluations').insert({ company_id: user.tenantId, site_id: siteId, equipment_id: equipmentId, source_module: sourceModule, source_record_id: sourceRecordId, requirement_id: req.id, document_type: req.document_type, required: true, status, linked_document_id: matching?.id ?? null, missing_reason: matching ? null : `${req.document_type} is required and not linked.`, readiness_blocker: readinessBlocker }).select().single());
      created.push(row);
      if (readinessBlocker) await this.createMissingDocumentAction(user, siteId, equipmentId, req, sourceModule, sourceRecordId).catch(() => null);
    }
    await this.event(user, { company_id: user.tenantId, site_id: siteId, equipment_id: equipmentId }, 'DOCUMENT_REQUIREMENTS_EVALUATED', 'MI document requirements evaluated', null, created);
    return { rows: created, missing: created.filter((row) => row.status === 'Missing'), readinessBlockers: created.filter((row) => row.readiness_blocker) };
  }

  missingDocuments(user: RequestUser, query: Query = {}) {
    return this.evaluations(user, { ...query, status: 'Missing' });
  }

  expiredDocuments(user: RequestUser, query: Query = {}) {
    return this.documentRows(user, { ...query, status: 'Expired' });
  }

  pendingApprovalDocuments(user: RequestUser, query: Query = {}) {
    return this.documentRows(user, { ...query, status: 'Pending Review' });
  }

  async requestWaiver(user: RequestUser, requirementId: string, body: Record<string, any>) {
    const req = await this.requirement(user, requirementId);
    const equipmentId = body.equipmentId ?? body.equipment_id ?? null;
    const siteId = body.siteId ?? body.site_id ?? req.site_id ?? user.selectedSiteId ?? user.siteIds[0];
    const row = await this.db.single<any>(this.db.from('mi_document_waivers').insert({ company_id: user.tenantId, site_id: siteId, equipment_id: equipmentId, requirement_id: requirementId, linked_module: body.linkedModule ?? body.linked_module ?? req.module_name ?? 'Equipment', linked_record_id: body.linkedRecordId ?? body.linked_record_id ?? equipmentId, waiver_reason: this.required(body.reason ?? body.waiverReason ?? body.waiver_reason, 'Waiver reason is required.'), risk_assessment_json: body.riskAssessmentJson ?? body.risk_assessment_json ?? null, expiry_date: body.expiryDate ?? body.expiry_date ?? null, requested_by: user.id }).select().single());
    await this.notify(user, siteId, 'mi.document.waiver.requested', 'Document waiver requested', `${req.requirement_name} waiver requested.`);
    await this.event(user, { ...row, equipment_id: equipmentId }, 'DOCUMENT_WAIVER_REQUESTED', 'MI document waiver requested', null, row);
    return row;
  }

  async decideWaiver(user: RequestUser, waiverId: string, action: 'approve' | 'reject', body: Record<string, any> = {}) {
    const before = await this.db.single<any>(this.applyScope(this.db.from('mi_document_waivers').select('*').eq('id', waiverId), user, {}).maybeSingle());
    if (!before) throw new NotFoundException('Document waiver not found.');
    if (action === 'reject' && !(body.reason ?? body.rejectionReason)) throw new BadRequestException('Rejection reason is required.');
    const row = await this.db.single<any>(this.db.from('mi_document_waivers').update(action === 'approve' ? { status: 'Approved', approved_by: user.id, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() } : { status: 'Rejected', rejected_by: user.id, rejected_at: new Date().toISOString(), rejection_reason: body.reason ?? body.rejectionReason, updated_at: new Date().toISOString() }).eq('company_id', user.tenantId).eq('id', waiverId).select().single());
    await this.notify(user, row.site_id, `mi.document.waiver.${action}d`, `Document waiver ${action}d`, `Document waiver ${action}d.`);
    await this.event(user, row, action === 'approve' ? 'DOCUMENT_WAIVER_APPROVED' : 'DOCUMENT_WAIVER_REJECTED', `MI document waiver ${action}d`, before, row);
    return row;
  }

  searchTargets(user: RequestUser, query: Query = {}) {
    const module = query.module ?? query.targetModule ?? 'Equipment';
    const search = query.search ?? query.q ?? '';
    return this.searchModule(user, module, search);
  }

  documentSearch(user: RequestUser, query: Query = {}) {
    return this.documents.list(user.tenantId, { search: query.search ?? query.q, documentType: query.documentType, status: query.status, siteId: query.siteId } as any, this.scope(user));
  }

  importTemplate() {
    return { fileName: 'mi-linked-records-import-template.csv', content: this.csv([{ source_module: '', source_record_id: '', target_module: '', target_record_id: '', relationship_type: 'Related', equipment_id: '' }], ['source_module','source_record_id','target_module','target_record_id','relationship_type','equipment_id']) };
  }

  importRows(user: RequestUser, body: Record<string, any>) {
    return this.db.single<any>(this.db.from('mi_linked_record_import_jobs').insert({ company_id: user.tenantId, site_id: body.siteId ?? user.selectedSiteId ?? null, uploaded_by: user.id, file_name: body.fileName ?? 'mi-linked-records-import.csv', file_key: body.fileKey ?? null, total_rows: Array.isArray(body.rows) ? body.rows.length : 0 }).select().single());
  }

  async exportLinkedRecords(user: RequestUser, query: Query = {}) {
    const rows = await this.linkedRecords(user, { ...query, limit: '1000' }).then((data) => data.rows);
    return { fileName: 'mi-linked-records.csv', content: this.csv(rows, ['source_module','source_record_number','relationship_type','target_module','target_record_number','equipment_id','permission_limited','broken_link','created_by','created_at']) };
  }

  async exportDocuments(user: RequestUser, query: Query = {}) {
    const rows = await this.documentRows(user, query);
    return { fileName: 'mi-documents.csv', content: this.csv(rows, ['document_title','document_type','linked_module','linked_record_number','equipment_id','version','status','approval_status','expiry_date','required','readiness_impact','linked_by','linked_at']) };
  }

  lookups() {
    return { linkedRecordTypes: miLinkedRecordTypes, relationshipTypes: miRelationshipTypes, documentTypes: miDocumentTypes, documentLinkStatuses: documentStatuses };
  }

  private async documentRows(user: RequestUser, query: Query = {}) {
    let request = this.applyScope(this.db.from('mi_document_links').select('*'), user, query);
    if (query.equipmentId) request = request.eq('equipment_id', query.equipmentId);
    if (query.linkedModule) request = request.eq('linked_module', query.linkedModule);
    if (query.linkedRecordId) request = request.eq('linked_record_id', query.linkedRecordId);
    if (query.documentType) request = request.eq('document_type', query.documentType);
    if (query.required === 'true') request = request.eq('required', true);
    if (query.active !== 'false') request = request.eq('active', true);
    const rows = await this.db.many<any>(request.order('linked_at', { ascending: false })).catch(() => []);
    const enriched = [];
    for (const row of rows) {
      const doc = await this.documentStatus(user, row.document_id).catch(() => null);
      const status = this.normalizedDocumentStatus(doc);
      if (query.status && query.status !== status) continue;
      enriched.push({ ...row, document: doc, document_title: doc?.title ?? row.document_id, version: doc?.current_version?.version_label ?? doc?.current_version?.version_number ?? null, status, approval_status: doc?.status ?? status, expiry_date: doc?.review?.next_review_date ?? doc?.expiry_date ?? null });
    }
    return enriched;
  }

  private async documentSummary(user: RequestUser, rows: any[], evaluations?: any[]) {
    const evals = evaluations ?? await this.evaluations(user, {});
    const missing = evals.filter((row: any) => row.status === 'Missing');
    return {
      totalMiDocumentLinks: rows.length,
      requiredDocuments: rows.filter((row) => row.required).length + missing.length,
      missingRequiredDocuments: missing.length,
      expiredDocuments: rows.filter((row) => row.status === 'Expired').length,
      pendingApproval: rows.filter((row) => /pending/i.test(row.status)).length,
      supersededDocuments: rows.filter((row) => row.status === 'Superseded').length,
      currentApprovedDocuments: rows.filter((row) => ['Current','Approved'].includes(row.status)).length,
      equipmentWithMissingDocuments: new Set(missing.map((row: any) => row.equipment_id).filter(Boolean)).size,
      readinessBlockedByDocuments: missing.filter((row: any) => row.readiness_blocker).length,
      certificatesExpiringSoon: rows.filter((row) => this.isSoon(row.expiry_date)).length,
      psvCertificatesMissing: missing.filter((row: any) => /PSV/i.test(row.document_type)).length,
      calibrationCertificatesMissing: missing.filter((row: any) => /Calibration/i.test(row.document_type)).length,
      sifProofTestReportsMissing: missing.filter((row: any) => /SIF|proof/i.test(row.document_type)).length,
      inspectionReportsMissing: missing.filter((row: any) => /Inspection/i.test(row.document_type)).length,
      ffsEvidenceMissing: missing.filter((row: any) => /Fitness|FFS/i.test(row.document_type)).length
    };
  }

  private async evaluations(user: RequestUser, query: Query) {
    let request = this.applyScope(this.db.from('mi_document_requirement_evaluations').select('*'), user, query);
    if (query.status) request = request.eq('status', query.status);
    if (query.equipmentId) request = request.eq('equipment_id', query.equipmentId);
    return this.db.many<any>(request.order('evaluated_at', { ascending: false })).catch(() => []);
  }

  private async requirement(user: RequestUser, requirementId: string) {
    const row = await this.db.single<any>(this.applyRequirementScope(this.db.from('mi_document_requirements').select('*').eq('id', requirementId), user, {}).maybeSingle());
    if (!row) throw new NotFoundException('Document requirement not found.');
    return row;
  }

  private linkSummary(rows: any[]) {
    const count = (pattern: RegExp) => rows.filter((row) => pattern.test(`${row.source_module} ${row.target_module}`)).length;
    return {
      totalLinks: rows.length,
      equipmentLinks: count(/Equipment/i),
      documentLinks: count(/Document/i),
      mocLinks: count(/MOC/i),
      pssrLinks: count(/PSSR/i),
      incidentLinks: count(/Incident/i),
      deficiencyLinks: count(/Deficiency/i),
      workOrderLinks: count(/Work Order/i),
      inspectionLinks: count(/Inspection/i),
      psvSifLinks: count(/PSV|SIF|SIS/i),
      brokenLinks: rows.filter((row) => row.broken_link).length,
      permissionLimitedLinks: rows.filter((row) => row.permission_limited).length,
      linksAddedThisMonth: rows.filter((row) => row.created_at && new Date(row.created_at).getMonth() === new Date().getMonth()).length
    };
  }

  private async resolveRecord(user: RequestUser, module: string, recordId: string, equipmentHint?: string) {
    if (/equipment/i.test(module)) return this.resolveEquipment(user, recordId);
    const normalized = module.toLowerCase();
    const table = this.moduleTable(normalized);
    if (!table) return { company_id: user.tenantId, site_id: user.selectedSiteId ?? user.siteIds[0], equipment_id: equipmentHint ?? null, record_number: recordId, permission_limited: true };
    let request = this.db.from(table.table).select('*').eq(table.companyField, user.tenantId).eq(table.idField, recordId);
    const row = await this.db.single<any>(request.maybeSingle()).catch(() => null);
    if (!row) throw new BadRequestException(`Linked ${module} record was not found or is outside your scope.`);
    const siteId = row[table.siteField] ?? row.siteId ?? row.site_id;
    this.assertSite(user, siteId);
    return { company_id: user.tenantId, site_id: siteId, equipment_id: row[table.equipmentField] ?? equipmentHint ?? null, record_number: row[table.numberField] ?? row.record_number ?? row.number ?? null };
  }

  private moduleTable(module: string) {
    const common = { companyField: 'company_id', siteField: 'site_id', idField: 'id', equipmentField: 'equipment_id', numberField: 'record_number' };
    if (/inspection/.test(module)) return { ...common, table: 'mi_inspection_records', numberField: 'inspection_number' };
    if (/work/.test(module)) return { ...common, table: 'mi_work_orders', numberField: 'work_order_number' };
    if (/deficien/.test(module)) return { ...common, table: 'mi_deficiencies' };
    if (/deviation/.test(module)) return { ...common, table: 'mi_deviations' };
    if (/readiness/.test(module)) return { ...common, table: 'mi_readiness_assessments', numberField: 'assessment_number' };
    if (/bypass|impair/.test(module)) return { ...common, table: 'mi_safeguard_impairments' };
    if (/psv|relief/.test(module)) return { ...common, table: 'mi_relief_devices', numberField: 'relief_device_number' };
    if (/sif|sis/.test(module)) return { ...common, table: 'mi_sifs', numberField: 'sif_tag' };
    if (/document/.test(module)) return { table: 'documents', companyField: 'tenant_id', siteField: 'site_id', idField: 'id', equipmentField: 'related_equipment_id', numberField: 'document_number' };
    return null;
  }

  private async resolveEquipment(user: RequestUser, equipmentId: string) {
    const row = await this.db.single<any>(this.db.from('Equipment').select('id,tenantId,siteId,tag,name,type,status,safetyCritical,psmCritical').eq('tenantId', user.tenantId).eq('id', equipmentId).maybeSingle());
    if (!row) throw new NotFoundException('Equipment not found.');
    this.assertSite(user, row.siteId);
    return { company_id: user.tenantId, site_id: row.siteId, equipment_id: row.id, record_number: row.tag ?? row.id, equipment: row };
  }

  private async documentStatus(user: RequestUser, documentId: string) {
    return this.documents.get(user.tenantId, documentId, this.scope(user));
  }

  private normalizedDocumentStatus(doc: any) {
    if (!doc) return 'Missing';
    if (/obsolete|superseded/i.test(doc.status)) return 'Superseded';
    if (/archived/i.test(doc.status)) return 'Archived';
    if (/reject/i.test(doc.status)) return 'Rejected';
    if (/pending|review|draft/i.test(doc.status)) return doc.status === 'Draft' ? 'Draft' : 'Pending Review';
    const reviewDate = doc.review?.next_review_date ?? doc.expiry_date;
    if (reviewDate && new Date(reviewDate) < new Date()) return 'Expired';
    if (/active|approved|current/i.test(doc.status)) return doc.status === 'Active' ? 'Current' : 'Approved';
    return doc.status ?? 'Current';
  }

  private async createMissingDocumentAction(user: RequestUser, siteId: string, equipmentId: string | null, req: any, sourceModule: string, sourceRecordId: string | null) {
    await this.actions.create(user.tenantId, user.id, { sourceModule: 'mechanical-integrity', sourceType: 'MI Missing Required Document', sourceRecordId: sourceRecordId ?? req.id, title: `Upload missing ${req.document_type}`, description: `${req.requirement_name} is required for ${sourceModule}.`, priority: req.startup_blocker_if_missing ? 'SAFETY_CRITICAL' : 'HIGH', ownerId: user.id, dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), equipmentId: equipmentId ?? undefined, siteId, evidenceRequired: true, verificationRequired: true } as any);
  }

  private searchModule(user: RequestUser, module: string, search: string) {
    const table = this.moduleTable(module.toLowerCase());
    if (!table) return Promise.resolve([]);
    let request = this.db.from(table.table).select('*').eq(table.companyField, user.tenantId).limit(25);
    if (search) request = request.or(`${table.numberField}.ilike.%${search}%,id.ilike.%${search}%`);
    if (!user.corporateView && user.siteIds.length) request = request.in(table.siteField, user.siteIds);
    return this.db.many<any>(request).catch(() => []);
  }

  private history(user: RequestUser, query: { linkId?: string; documentLinkId?: string }) {
    let request = this.applyScope(this.db.from('mi_linked_record_history_events').select('*'), user, {});
    if (query.linkId) request = request.eq('link_id', query.linkId);
    if (query.documentLinkId) request = request.eq('document_link_id', query.documentLinkId);
    return this.db.many<any>(request.order('created_at', { ascending: false })).catch(() => []);
  }

  private async event(user: RequestUser, row: any, eventType: string, title: string, before: unknown, after: unknown) {
    await this.db.single(this.db.from('mi_linked_record_history_events').insert({ company_id: row.company_id ?? user.tenantId, site_id: row.site_id ?? user.selectedSiteId ?? user.siteIds[0], equipment_id: row.equipment_id ?? null, link_id: row.link_id ?? null, document_link_id: row.document_link_id ?? null, event_type: eventType, event_title: title, event_description: title, before_value_json: before as JsonValue, after_value_json: after as JsonValue, actor_user_id: user.id, source_module: row.source_module ?? row.linked_module ?? 'Mechanical Integrity', source_record_id: row.source_record_id ?? row.linked_record_id ?? null }).select('id').single()).catch(() => null);
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: eventType, entityType: 'MechanicalIntegrityLinkedRecordsDocuments', entityId: String(row.id ?? row.link_id ?? row.document_link_id ?? ''), before: before as JsonValue, after: after as JsonValue }).catch(() => null);
  }

  private notify(user: RequestUser, siteId: string, type: string, title: string, message: string) {
    return this.notifications.notifyUser({ tenantId: user.tenantId, userId: user.id, siteId, type, module: 'mechanical-integrity', title, message, priority: 'Normal' });
  }

  private applyScope(request: any, user: RequestUser, query: Query) {
    let scoped = request.eq('company_id', user.tenantId);
    if (query.siteId) scoped = scoped.eq('site_id', query.siteId);
    else if (user.selectedSiteId) scoped = scoped.eq('site_id', user.selectedSiteId);
    else if (!user.corporateView && user.siteIds.length) scoped = scoped.in('site_id', user.siteIds);
    return scoped;
  }

  private applyRequirementScope(request: any, user: RequestUser, query: Query) {
    let scoped = request.eq('company_id', user.tenantId);
    if (query.siteId) scoped = scoped.or(`site_id.eq.${query.siteId},site_id.is.null`);
    else if (user.selectedSiteId) scoped = scoped.or(`site_id.eq.${user.selectedSiteId},site_id.is.null`);
    return scoped;
  }

  private applyLinkFilters(request: any, query: Query) {
    let scoped = request;
    if (query.equipmentId) scoped = scoped.eq('equipment_id', query.equipmentId);
    if (query.sourceModule) scoped = scoped.eq('source_module', query.sourceModule);
    if (query.sourceRecordId) scoped = scoped.eq('source_record_id', query.sourceRecordId);
    if (query.targetModule) scoped = scoped.eq('target_module', query.targetModule);
    if (query.targetRecordId) scoped = scoped.eq('target_record_id', query.targetRecordId);
    if (query.relationshipType) scoped = scoped.eq('relationship_type', query.relationshipType);
    if (query.brokenLink === 'true') scoped = scoped.eq('broken_link', true);
    if (query.permissionLimited === 'true') scoped = scoped.eq('permission_limited', true);
    if (query.active !== 'false') scoped = scoped.eq('active', true);
    if (query.search) scoped = scoped.or(`source_record_number.ilike.%${query.search}%,target_record_number.ilike.%${query.search}%,relationship_description.ilike.%${query.search}%`);
    return scoped;
  }

  private scope(user: RequestUser) {
    return { allowedSiteIds: user.siteIds, selectedSiteId: user.selectedSiteId ?? null, corporateView: user.corporateView ?? false };
  }

  private assertSite(user: RequestUser, siteId?: string | null) {
    if (siteId && !user.corporateView && user.siteIds.length && !user.siteIds.includes(siteId)) throw new BadRequestException('Record is outside your site access scope.');
  }

  private required(value: unknown, message: string) {
    const text = String(value ?? '').trim();
    if (!text) throw new BadRequestException(message);
    return text;
  }

  private isSoon(date?: string | null) {
    if (!date) return false;
    const time = new Date(date).getTime();
    return Number.isFinite(time) && time >= Date.now() && time <= Date.now() + 60 * 86400000;
  }

  private csv(rows: any[], columns: string[]) {
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n');
  }
}
