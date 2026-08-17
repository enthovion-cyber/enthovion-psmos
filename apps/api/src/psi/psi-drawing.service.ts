import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type Row = Record<string, any>;

export const drawingTypes = ['PFD', 'P&ID', 'Plot plan', 'Equipment layout', 'General arrangement', 'Isometric drawing', 'Line list', 'Equipment datasheet drawing', 'Electrical single line diagram', 'Hazardous area classification drawing', 'Instrument loop drawing', 'Instrument index', 'Cause & effect matrix', 'Control narrative', 'Logic diagram', 'Fire and gas layout', 'Utility drawing', 'Drainage drawing', 'Vent/flare drawing', 'Relief system drawing', 'Emergency response layout', 'Other'];
export const drawingDisciplines = ['Process', 'Mechanical', 'Piping', 'Instrumentation', 'Electrical', 'Civil/Structural', 'Fire & Gas', 'HSE / Process Safety', 'Vendor Package', 'Multi-discipline'];
export const drawingStatuses = ['Draft', 'Pending Review', 'Approved', 'Current', 'Superseded', 'Expired', 'Rejected', 'Archived', 'Redline', 'As-Built Pending', 'As-Built Verified'];
export const tagTypes = ['Equipment tag', 'Line number', 'Instrument tag', 'Valve tag', 'PSV/relief device tag', 'SIF tag', 'Interlock tag', 'Alarm tag', 'Analyzer tag', 'Fire/gas detector tag', 'Pump/compressor tag', 'Tank/vessel tag', 'Utility tag', 'Drain/vent tag', 'Other'];
export const tagVerificationStatuses = ['Unverified', 'Verified', 'Mismatch', 'Missing In Source Module', 'Missing On Drawing', 'Needs Review'];
export const tagSourceMethods = ['Manual', 'CSV import', 'Document OCR', 'CAD extraction', 'AI extraction', 'Synced from Equipment Registry', 'Synced from MI', 'Synced from Instrument Index'];
export const redlineStatuses = ['None', 'Open', 'Under Review', 'Incorporated', 'Rejected', 'Superseded', 'Closed'];
export const mocDrawingUpdateStatuses = ['Not Required', 'Required', 'Pending Update', 'Updated Pending Review', 'Updated Approved', 'Overdue', 'Waived With Approval'];
export const drawingConflictStatuses = ['No Conflict', 'Warning', 'Major Conflict', 'Critical Conflict', 'Override Approved'];
const relationshipTypes = ['Shows', 'Defines', 'Supports', 'Current drawing for', 'Supersedes', 'Redline for', 'As-built evidence', 'Design basis evidence', 'Operating basis evidence', 'Isolation reference', 'Relief basis evidence', 'Safeguard basis evidence', 'PSSR requirement', 'HAZOP evidence', 'MOC affected drawing', 'Audit evidence'];

@Injectable()
export class PsiDrawingService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async summary(tenantId: string, scope: Scope, query: Row = {}) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    const count = (predicate: (row: Row) => boolean) => rows.filter(predicate).length;
    return {
      totalDrawings: rows.length,
      currentApprovedDrawings: count((row) => row.current_approved),
      pids: count((row) => row.drawing_type === 'P&ID'),
      pfds: count((row) => row.drawing_type === 'PFD'),
      drawingsMissingCurrentApprovedVersion: count((row) => !row.current_approved),
      supersededDrawings: count((row) => row.status === 'Superseded' || row.document_status === 'Superseded'),
      redlinesOpen: count((row) => ['Open', 'Under Review'].includes(row.redline_status)),
      pendingApproval: count((row) => ['Submitted', 'Pending Review', 'In Review'].includes(row.review_status)),
      asBuiltVerificationRequired: count((row) => row.as_built_required && !row.as_built_verified),
      mocUpdatesRequired: count((row) => row.moc_update_required),
      pssrBlockers: count((row) => row.pssr_blocker),
      unitsMissingPid: count((row) => row.drawing_type === 'P&ID' && !row.current_approved),
      unitsMissingPfd: count((row) => row.drawing_type === 'PFD' && !row.current_approved),
      equipmentMissingDrawingLink: count((row) => !row.relationships?.some((rel: Row) => rel.linked_module === 'Equipment')),
      reliefSystemsMissingPid: count((row) => row.drawing_type === 'P&ID' && !row.relationships?.some((rel: Row) => rel.linked_module === 'Relief Systems')),
      sisInterlocksMissingCauseEffect: count((row) => ['Cause & effect matrix', 'Logic diagram', 'Control narrative'].includes(row.drawing_type) && !row.current_approved),
      documentsExpiredSuperseded: count((row) => ['Expired', 'Superseded'].includes(row.document_status)),
      reviewOverdue: count((row) => this.isReviewOverdue(row)),
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
      savedViews: ['All Drawings', 'Current Approved', 'P&IDs', 'PFDs', 'Missing Drawings', 'Superseded', 'Redlines Open', 'Pending Approval', 'MOC Updates Required', 'PSSR Blockers', 'As-Built Required', 'My Unit Drawings'],
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
    const unit = dto.unit_id ?? dto.unitId ? await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId)) : null;
    const siteId = unit?.site_id ?? this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? this.selectedSite(scope) ?? ''));
    await this.ensureNoActiveDuplicate(tenantId, siteId, String(dto.drawing_number ?? dto.drawingNumber), String(dto.revision_number ?? dto.revisionNumber ?? ''));
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawings').insert(this.drawingPayload(tenantId, actorId, siteId, unit, dto, { created_at: new Date().toISOString(), updated_at: new Date().toISOString() })).select().single()), 'Unable to create drawing record.');
    await this.upsertScope(tenantId, actorId, scope, row.id, dto, false);
    if (dto.document_id ?? dto.documentId) await this.linkDocument(tenantId, actorId, scope, row.id, dto, false);
    if (this.hasMocRedlineFields(dto)) await this.upsertMocRedlines(tenantId, actorId, scope, row.id, dto, false);
    for (const rel of Array.isArray(dto.relationships) ? dto.relationships : []) await this.addRelationship(tenantId, actorId, scope, row.id, rel, false);
    for (const tag of Array.isArray(dto.tagIndex) ? dto.tagIndex : []) await this.addTag(tenantId, actorId, scope, row.id, tag, false);
    await this.runConflictCheck(tenantId, actorId, scope, row.id);
    await this.runCompleteness(tenantId, actorId, scope, row.id);
    await this.writeHistory(tenantId, actorId, 'psi.drawing.created', row, null, row, 'Drawing created', `${row.drawing_number} - ${row.drawing_title} created.`);
    return this.detail(tenantId, scope, row.id);
  }

  async update(tenantId: string, actorId: string, scope: Scope, drawingId: string, dto: Row, permissions: string[] = []) {
    const before = await this.record(tenantId, scope, drawingId);
    if (before.review_status === 'Approved' && !permissions.includes('psi.drawing.approve')) throw new ForbiddenException('Approved drawing metadata is read-only unless controlled edit/MOC permission exists.');
    const unit = dto.unit_id ?? dto.unitId ? await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId)) : before.unit_id ? await this.unitRecord(tenantId, scope, before.unit_id) : null;
    const siteId = unit?.site_id ?? this.assertSiteAccess(scope, String(dto.site_id ?? dto.siteId ?? before.site_id));
    this.validateIdentity({ ...before, ...dto });
    const safetyKeys = ['drawing_number', 'drawing_title', 'drawing_type', 'discipline', 'unit_id', 'area_id', 'current_approved', 'critical_drawing', 'psm_critical', 'redline_status', 'as_built_verified'];
    const safetyChanged = safetyKeys.some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined);
    const payload = this.drawingPayload(tenantId, actorId, siteId, unit, { ...before, ...dto }, { updated_at: new Date().toISOString(), moc_update_required: safetyChanged ? true : before.moc_update_required });
    delete payload.created_by;
    delete payload.created_at;
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawings').update(payload).eq('company_id', tenantId).eq('id', drawingId).select().single()), 'Unable to update drawing record.');
    if (this.hasScopeFields(dto)) await this.upsertScope(tenantId, actorId, scope, drawingId, dto, false);
    if (this.hasMocRedlineFields(dto)) await this.upsertMocRedlines(tenantId, actorId, scope, drawingId, dto, false);
    await this.runConflictCheck(tenantId, actorId, scope, drawingId);
    await this.runCompleteness(tenantId, actorId, scope, drawingId);
    await this.writeHistory(tenantId, actorId, 'psi.drawing.updated', row, before, row, 'Drawing updated', safetyChanged ? 'Safety-sensitive drawing change may require MOC.' : 'Drawing metadata updated.');
    return this.detail(tenantId, scope, drawingId);
  }

  async detail(tenantId: string, scope: Scope, drawingId: string) {
    const drawing = await this.record(tenantId, scope, drawingId, true);
    const [unit, documents, drawingScope, relationships, tagIndex, mocRedlines, asBuiltVerifications, completeness, conflicts, history] = await Promise.all([
      drawing.unit_id ? this.unitRecord(tenantId, scope, drawing.unit_id).catch(() => null) : Promise.resolve(null),
      this.documents(tenantId, scope, drawingId),
      this.scopeDetail(tenantId, scope, drawingId),
      this.relationships(tenantId, scope, drawingId),
      this.tagIndex(tenantId, scope, drawingId, {}),
      this.mocRedlines(tenantId, scope, drawingId),
      this.asBuiltVerifications(tenantId, scope, drawingId),
      this.completeness(tenantId, scope, drawingId),
      this.conflicts(tenantId, scope, drawingId),
      this.history(tenantId, scope, drawingId)
    ]);
    return {
      drawing,
      unit,
      documents,
      scope: drawingScope,
      relationships,
      tagIndex,
      mocRedlines,
      asBuiltVerifications,
      completeness,
      conflicts,
      history,
      overview: this.overview(drawing, documents, relationships, tagIndex, mocRedlines, completeness, conflicts),
      tabs: this.tabs(drawingId),
      actions: this.actions(drawing, documents, completeness, conflicts)
    };
  }

  async clone(tenantId: string, actorId: string, scope: Scope, drawingId: string, dto: Row) {
    const detail = await this.detail(tenantId, scope, drawingId);
    return this.create(tenantId, actorId, scope, {
      ...detail.drawing,
      ...dto,
      drawing_number: dto.drawing_number ?? dto.drawingNumber ?? `${detail.drawing.drawing_number}-COPY`,
      drawing_title: dto.drawing_title ?? dto.drawingTitle ?? `${detail.drawing.drawing_title} copy`,
      status: 'Draft',
      review_status: 'Not Reviewed',
      current_approved: false,
      as_built_verified: false,
      document_id: null,
      relationships: detail.relationships,
      tagIndex: detail.tagIndex
    });
  }

  async archive(tenantId: string, actorId: string, scope: Scope, drawingId: string, dto: Row) {
    const before = await this.record(tenantId, scope, drawingId);
    if (!dto.reason) throw new BadRequestException('Archive requires a reason.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawings').update({ archived_at: new Date().toISOString(), archived_by: actorId, archive_reason: dto.reason, status: 'Archived', current_approved: false, moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', drawingId).select().single()), 'Unable to archive drawing.');
    await this.writeHistory(tenantId, actorId, 'psi.drawing.archived', row, before, row, 'Drawing archived', dto.reason);
    return row;
  }

  async reactivate(tenantId: string, actorId: string, scope: Scope, drawingId: string, dto: Row) {
    const before = await this.record(tenantId, scope, drawingId, true);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawings').update({ archived_at: null, archived_by: null, archive_reason: null, status: dto.status ?? 'Draft', moc_update_required: true, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', drawingId).select().single()), 'Unable to reactivate drawing.');
    await this.writeHistory(tenantId, actorId, 'psi.drawing.reactivated', row, before, row, 'Drawing reactivated', dto.reason ?? 'Drawing reactivated.');
    return row;
  }

  async documents(tenantId: string, scope: Scope, drawingId: string) {
    await this.record(tenantId, scope, drawingId, true);
    return this.safeMany<Row>(this.db.from('psi_drawing_document_links').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId).is('removed_at', null).order('current_approved', { ascending: false }).order('linked_at', { ascending: false }));
  }

  async linkDocument(tenantId: string, actorId: string, scope: Scope, drawingId: string, dto: Row, writeEvent = true) {
    const drawing = await this.record(tenantId, scope, drawingId);
    this.requireText(dto.document_id ?? dto.documentId, 'Document Control document is required.');
    if (Boolean(dto.current_approved ?? dto.currentApproved) && !this.isApprovedDocumentStatus(String(dto.document_status ?? dto.documentStatus ?? ''))) {
      throw new BadRequestException('Current approved drawing requires an Approved/Current/As-Built Verified Document Control status.');
    }
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawing_document_links').upsert(this.documentPayload(tenantId, actorId, drawing, dto), { onConflict: 'company_id,drawing_id,document_id' }).select().single()), 'Unable to link drawing document.');
    await this.syncDrawingDocumentStatus(tenantId, actorId, scope, drawingId, false);
    await this.runConflictCheck(tenantId, actorId, scope, drawingId);
    await this.runCompleteness(tenantId, actorId, scope, drawingId);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.drawing.document.linked', drawing, null, row, 'Document linked', `${row.document_number ?? row.document_id} linked to drawing.`);
    return row;
  }

  async unlinkDocument(tenantId: string, actorId: string, scope: Scope, drawingId: string, documentLinkId: string, dto: Row) {
    const drawing = await this.record(tenantId, scope, drawingId);
    const before = await this.safeSingle<Row>(this.db.from('psi_drawing_document_links').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId).eq('id', documentLinkId).maybeSingle());
    if (!before) throw new NotFoundException('Drawing document link not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawing_document_links').update({ removed_by: actorId, removed_at: new Date().toISOString(), remove_reason: dto.reason ?? null }).eq('company_id', tenantId).eq('id', documentLinkId).select().single()), 'Unable to remove drawing document.');
    await this.syncDrawingDocumentStatus(tenantId, actorId, scope, drawingId, false);
    await this.runCompleteness(tenantId, actorId, scope, drawingId);
    await this.writeHistory(tenantId, actorId, 'psi.drawing.document.unlinked', drawing, before, row, 'Document unlinked', dto.reason ?? row.document_id);
    return row;
  }

  async syncDrawingDocumentStatus(tenantId: string, actorId: string, scope: Scope, drawingId: string, writeEvent = true) {
    const drawing = await this.record(tenantId, scope, drawingId);
    const docs = await this.documents(tenantId, scope, drawingId);
    const current = docs.find((doc) => doc.current_approved) ?? docs.find((doc) => this.isApprovedDocumentStatus(doc.document_status));
    const before = drawing;
    const patch = {
      current_approved: Boolean(current?.current_approved || this.isApprovedDocumentStatus(current?.document_status)),
      status: current?.document_status === 'Superseded' ? 'Superseded' : before.status,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    };
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawings').update(patch).eq('company_id', tenantId).eq('id', drawingId).select().single()), 'Unable to sync drawing document status.');
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.drawing.document_status.synced', row, before, row, 'Document status synced', 'Document Control status snapshot refreshed.');
    return row;
  }

  async scopeDetail(tenantId: string, scope: Scope, drawingId: string) {
    await this.record(tenantId, scope, drawingId, true);
    return this.safeSingle<Row>(this.db.from('psi_drawing_scopes').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId).maybeSingle());
  }

  async upsertScope(tenantId: string, actorId: string, scope: Scope, drawingId: string, dto: Row, writeEvent = true) {
    const drawing = await this.record(tenantId, scope, drawingId);
    if (dto.unit_id ?? dto.unitId) await this.unitRecord(tenantId, scope, String(dto.unit_id ?? dto.unitId));
    const before = await this.scopeDetail(tenantId, scope, drawingId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawing_scopes').upsert(this.scopePayload(tenantId, drawing, dto), { onConflict: 'company_id,drawing_id' }).select().single()), 'Unable to save drawing scope.');
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.drawing.scope.updated', drawing, before, row, 'Drawing scope updated', 'Company/site/unit/area drawing scope saved.');
    return row;
  }

  async relationships(tenantId: string, scope: Scope, drawingId: string) {
    await this.record(tenantId, scope, drawingId, true);
    return this.safeMany<Row>(this.db.from('psi_drawing_relationships').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId).is('removed_at', null).order('linked_module').order('created_at', { ascending: false }));
  }

  async addRelationship(tenantId: string, actorId: string, scope: Scope, drawingId: string, dto: Row, writeEvent = true) {
    const drawing = await this.record(tenantId, scope, drawingId);
    this.requireText(dto.linked_module ?? dto.linkedModule, 'Linked module is required.');
    this.requireText(dto.linked_record_id ?? dto.linkedRecordId, 'Linked record is required.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawing_relationships').insert(this.relationshipPayload(tenantId, actorId, drawing, dto)).select().single()), 'Unable to add drawing relationship.');
    await this.runConflictCheck(tenantId, actorId, scope, drawingId);
    await this.runCompleteness(tenantId, actorId, scope, drawingId);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.drawing.relationship.linked', drawing, null, row, 'Relationship linked', `${row.linked_module}: ${row.relationship_type}.`);
    return row;
  }

  async removeRelationship(tenantId: string, actorId: string, scope: Scope, drawingId: string, relationshipId: string, dto: Row) {
    const drawing = await this.record(tenantId, scope, drawingId);
    const before = await this.safeSingle<Row>(this.db.from('psi_drawing_relationships').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId).eq('id', relationshipId).maybeSingle());
    if (!before) throw new NotFoundException('Drawing relationship not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawing_relationships').update({ removed_by: actorId, removed_at: new Date().toISOString(), remove_reason: dto.reason ?? null }).eq('company_id', tenantId).eq('id', relationshipId).select().single()), 'Unable to remove drawing relationship.');
    await this.runCompleteness(tenantId, actorId, scope, drawingId);
    await this.writeHistory(tenantId, actorId, 'psi.drawing.relationship.unlinked', drawing, before, row, 'Relationship unlinked', dto.reason ?? row.linked_record_id);
    return row;
  }

  async tagIndex(tenantId: string, scope: Scope, drawingId: string, query: Row = {}) {
    await this.record(tenantId, scope, drawingId, true);
    let request: any = this.db.from('psi_drawing_tag_index').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId);
    if (query.search) request = request.or(`tag_number.ilike.%${query.search}%,tag_description.ilike.%${query.search}%,service.ilike.%${query.search}%`);
    if (query.tagType) request = request.eq('tag_type', query.tagType);
    if (query.verificationStatus) request = request.eq('verification_status', query.verificationStatus);
    return this.safeMany<Row>(request.order('tag_type').order('tag_number'));
  }

  async addTag(tenantId: string, actorId: string, scope: Scope, drawingId: string, dto: Row, writeEvent = true) {
    const drawing = await this.record(tenantId, scope, drawingId);
    this.requireText(dto.tag_number ?? dto.tagNumber, 'Tag number is required.');
    this.requireText(dto.tag_type ?? dto.tagType, 'Tag type is required.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawing_tag_index').upsert(this.tagPayload(tenantId, actorId, drawing, dto), { onConflict: 'company_id,drawing_id,tag_number,tag_type' }).select().single()), 'Unable to save drawing tag.');
    await this.runConflictCheck(tenantId, actorId, scope, drawingId);
    await this.runCompleteness(tenantId, actorId, scope, drawingId);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.drawing.tag.saved', drawing, null, row, 'Tag index updated', `${row.tag_type}: ${row.tag_number}.`);
    return row;
  }

  async updateTag(tenantId: string, actorId: string, scope: Scope, drawingId: string, tagId: string, dto: Row) {
    const drawing = await this.record(tenantId, scope, drawingId);
    const before = await this.safeSingle<Row>(this.db.from('psi_drawing_tag_index').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId).eq('id', tagId).maybeSingle());
    if (!before) throw new NotFoundException('Tag index entry not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawing_tag_index').update(this.clean({ tag_number: dto.tag_number ?? dto.tagNumber ?? before.tag_number, tag_type: dto.tag_type ?? dto.tagType ?? before.tag_type, tag_description: dto.tag_description ?? dto.tagDescription ?? before.tag_description, service: dto.service ?? before.service, unit_id: dto.unit_id ?? dto.unitId ?? before.unit_id, area_id: dto.area_id ?? dto.areaId ?? before.area_id, linked_module: dto.linked_module ?? dto.linkedModule ?? before.linked_module, linked_record_id: dto.linked_record_id ?? dto.linkedRecordId ?? before.linked_record_id, sheet_page_reference: dto.sheet_page_reference ?? dto.sheetPageReference ?? before.sheet_page_reference, coordinate_reference: dto.coordinate_reference ?? dto.coordinateReference ?? before.coordinate_reference, verification_status: dto.verification_status ?? dto.verificationStatus ?? before.verification_status, source_method: dto.source_method ?? dto.sourceMethod ?? before.source_method, mismatch_reason: dto.mismatch_reason ?? dto.mismatchReason ?? before.mismatch_reason, notes: dto.notes ?? before.notes, updated_by: actorId, updated_at: new Date().toISOString() })).eq('company_id', tenantId).eq('id', tagId).select().single()), 'Unable to update drawing tag.');
    await this.runConflictCheck(tenantId, actorId, scope, drawingId);
    await this.runCompleteness(tenantId, actorId, scope, drawingId);
    await this.writeHistory(tenantId, actorId, 'psi.drawing.tag.updated', drawing, before, row, 'Tag index entry updated', `${row.tag_number} updated.`);
    return row;
  }

  async removeTag(tenantId: string, actorId: string, scope: Scope, drawingId: string, tagId: string) {
    const drawing = await this.record(tenantId, scope, drawingId);
    const before = await this.safeSingle<Row>(this.db.from('psi_drawing_tag_index').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId).eq('id', tagId).maybeSingle());
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawing_tag_index').delete().eq('company_id', tenantId).eq('drawing_id', drawingId).eq('id', tagId).select().single()), 'Unable to remove drawing tag.');
    await this.runCompleteness(tenantId, actorId, scope, drawingId);
    await this.writeHistory(tenantId, actorId, 'psi.drawing.tag.removed', drawing, before, row, 'Tag index entry removed', row.tag_number);
    return row;
  }

  async importTagIndex(tenantId: string, actorId: string, scope: Scope, drawingId: string, dto: Row) {
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const preview = rows.map((row: Row, index: number) => ({ rowNumber: index + 1, row, errors: this.validateTagImportRow(row) }));
    if (dto.commit !== true || preview.some((row: Row) => row.errors.length)) return { status: preview.some((row: Row) => row.errors.length) ? 'Errors' : 'Preview Ready', preview };
    const created: Row[] = [];
    for (const item of preview) created.push(await this.addTag(tenantId, actorId, scope, drawingId, { ...item.row, source_method: item.row.source_method ?? 'CSV import' }, false));
    const drawing = await this.record(tenantId, scope, drawingId);
    await this.writeHistory(tenantId, actorId, 'psi.drawing.tag_index.imported', drawing, null, { count: created.length }, 'Tag index imported', `${created.length} tag index rows imported.`);
    return { status: 'Imported', createdCount: created.length, rows: created };
  }

  async verifyTagIndex(tenantId: string, actorId: string, scope: Scope, drawingId: string) {
    const tags = await this.tagIndex(tenantId, scope, drawingId, {});
    const drawing = await this.record(tenantId, scope, drawingId);
    const mismatches = tags.filter((tag) => ['Mismatch', 'Missing In Source Module', 'Missing On Drawing', 'Needs Review'].includes(tag.verification_status));
    await this.runConflictCheck(tenantId, actorId, scope, drawingId);
    await this.writeHistory(tenantId, actorId, 'psi.drawing.tag_index.verified', drawing, null, { tagCount: tags.length, mismatchCount: mismatches.length }, 'Tag index verification run', `${mismatches.length} mismatch or review item(s).`);
    return { tagCount: tags.length, mismatchCount: mismatches.length, status: mismatches.length ? 'Needs Review' : 'Verified' };
  }

  async globalTagSearch(tenantId: string, scope: Scope, query: Row = {}) {
    let request: any = this.applyScope(this.db.from('psi_drawing_tag_index').select('*, psi_drawings(drawing_number,drawing_title,drawing_type)').eq('company_id', tenantId), scope);
    if (query.search) request = request.or(`tag_number.ilike.%${query.search}%,tag_description.ilike.%${query.search}%,service.ilike.%${query.search}%`);
    return this.safeMany<Row>(request.order('tag_number').limit(Math.min(100, Number(query.limit ?? 50))));
  }

  async mocRedlines(tenantId: string, scope: Scope, drawingId: string) {
    await this.record(tenantId, scope, drawingId, true);
    return this.safeSingle<Row>(this.db.from('psi_drawing_moc_redline_status').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId).maybeSingle());
  }

  async upsertMocRedlines(tenantId: string, actorId: string, scope: Scope, drawingId: string, dto: Row, writeEvent = true) {
    const drawing = await this.record(tenantId, scope, drawingId);
    const before = await this.mocRedlines(tenantId, scope, drawingId);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawing_moc_redline_status').upsert(this.mocRedlinePayload(tenantId, drawing, dto), { onConflict: 'company_id,drawing_id' }).select().single()), 'Unable to save MOC/redline/as-built status.');
    const drawingPatch = {
      moc_update_required: Boolean(row.moc_required || row.drawing_update_required_by_moc) && !row.drawing_update_completed,
      pssr_blocker: this.shouldBlockPssr(drawing, row),
      redline_status: row.redline_status,
      as_built_verified: Boolean(row.as_built_verified),
      updated_by: actorId,
      updated_at: new Date().toISOString()
    };
    await this.db.single(this.db.from('psi_drawings').update(drawingPatch).eq('company_id', tenantId).eq('id', drawingId).select('id').single()).catch(() => null);
    await this.runConflictCheck(tenantId, actorId, scope, drawingId);
    await this.runCompleteness(tenantId, actorId, scope, drawingId);
    if (writeEvent) await this.writeHistory(tenantId, actorId, 'psi.drawing.moc_redline.updated', drawing, before, row, 'MOC/redline/as-built updated', 'Drawing change control status saved.');
    return row;
  }

  async markAsBuiltVerified(tenantId: string, actorId: string, scope: Scope, drawingId: string, dto: Row) {
    if (!dto.reason && !dto.findings_summary && !dto.findingsSummary) throw new BadRequestException('As-built verification requires findings, evidence, or reason.');
    const drawing = await this.record(tenantId, scope, drawingId);
    const verification = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawing_as_built_verifications').insert({ id: randomUUID(), company_id: tenantId, site_id: drawing.site_id, drawing_id: drawingId, verification_type: dto.verification_type ?? dto.verificationType ?? 'As-Built Verification', verification_status: 'Verified', verified_by: actorId, verified_at: new Date().toISOString(), field_walkdown_date: this.dateOrNull(dto.field_walkdown_date ?? dto.fieldWalkdownDate), evidence_document_id: dto.evidence_document_id ?? dto.evidenceDocumentId ?? null, findings_summary: dto.findings_summary ?? dto.findingsSummary ?? dto.reason ?? null, mismatches_found: Boolean(dto.mismatches_found ?? dto.mismatchesFound), action_required: Boolean(dto.action_required ?? dto.actionRequired), comments: dto.comments ?? null, created_by: actorId }).select().single()), 'Unable to save as-built verification.');
    await this.upsertMocRedlines(tenantId, actorId, scope, drawingId, { as_built_verified: true, as_built_verified_by: actorId, as_built_verified_at: new Date().toISOString(), as_built_required: false }, false);
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawings').update({ as_built_verified: true, status: 'As-Built Verified', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', drawingId).select().single()), 'Unable to update as-built drawing status.');
    await this.writeHistory(tenantId, actorId, 'psi.drawing.as_built.verified', row, drawing, { row, verification }, 'As-built verified', dto.reason ?? 'As-built verification completed.');
    return verification;
  }

  async fieldWalkdown(tenantId: string, actorId: string, scope: Scope, drawingId: string, dto: Row) {
    return this.markAsBuiltVerified(tenantId, actorId, scope, drawingId, { ...dto, verification_type: dto.verification_type ?? 'Field Walkdown', verification_status: dto.verification_status ?? 'Walkdown Recorded' });
  }

  async asBuiltVerifications(tenantId: string, scope: Scope, drawingId: string) {
    await this.record(tenantId, scope, drawingId, true);
    return this.safeMany<Row>(this.db.from('psi_drawing_as_built_verifications').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId).order('created_at', { ascending: false }));
  }

  async completeness(tenantId: string, scope: Scope, drawingId: string) {
    await this.record(tenantId, scope, drawingId, true);
    return this.safeMany<Row>(this.db.from('psi_drawing_completeness_evaluations').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId).order('severity').order('check_title'));
  }

  async runCompleteness(tenantId: string, actorId: string, scope: Scope, drawingId: string) {
    const drawing = await this.record(tenantId, scope, drawingId, true);
    const [docs, moc, tags, conflicts, relationships] = await Promise.all([
      this.documents(tenantId, scope, drawingId),
      this.mocRedlines(tenantId, scope, drawingId),
      this.tagIndex(tenantId, scope, drawingId, {}),
      this.conflicts(tenantId, scope, drawingId),
      this.relationships(tenantId, scope, drawingId)
    ]);
    const currentDoc = docs.find((doc) => doc.current_approved || this.isApprovedDocumentStatus(doc.document_status));
    const requiredCurrent = ['P&ID', 'PFD'].includes(drawing.drawing_type) || drawing.critical_drawing || drawing.psm_critical;
    const evaluations = [
      this.check('document_link', 'Drawing has Document Control link', docs.length > 0, 'Critical', 'Document Control link required before approval.'),
      this.check('current_approved_document', 'Current approved Document Control version exists', !requiredCurrent || Boolean(currentDoc), 'Critical', 'Missing current approved drawing/document version.'),
      this.check('revision_metadata', 'Revision metadata exists', docs.some((doc) => doc.revision_number || doc.revision_date), 'High', 'Revision number/date missing.'),
      this.check('owner_assigned', 'Drawing owner assigned', !drawing.critical_drawing || Boolean(drawing.owner_user_id), 'High', 'Critical drawing requires owner.'),
      this.check('review_date', 'Review date exists and is not overdue', !drawing.critical_drawing || Boolean(drawing.next_review_due), 'High', 'Critical drawing requires review schedule.'),
      this.check('redline_controlled', 'Redlines closed or controlled', !moc?.redline_exists || ['Closed', 'Incorporated', 'Waived With Approval', 'Superseded'].includes(moc.redline_status), 'High', 'Open redline requires control.'),
      this.check('moc_update_complete', 'MOC-required updates complete', !moc?.drawing_update_required_by_moc || Boolean(moc.drawing_update_completed) || moc.moc_update_status === 'Waived With Approval', 'Critical', 'MOC drawing update is incomplete.'),
      this.check('as_built_verified', 'As-built verification complete where required', !moc?.as_built_required || Boolean(moc.as_built_verified || drawing.as_built_verified), 'High', 'As-built verification required.'),
      this.check('relationships_available', 'Linked equipment/records captured', relationships.length > 0 || !drawing.critical_drawing, 'Medium', 'Critical drawing should link equipment, tags, or module records.'),
      this.check('tag_mismatch_reviewed', 'Tag index mismatches reviewed', !tags.some((tag) => ['Mismatch', 'Missing In Source Module', 'Missing On Drawing', 'Needs Review'].includes(tag.verification_status)), 'Medium', 'Tag index has mismatches or review items.'),
      this.check('conflicts_checked', 'Critical conflicts cleared', !conflicts.some((conflict) => conflict.conflict_status === 'Critical Conflict' && !conflict.override_approved), 'Critical', 'Critical drawing conflict blocks approval.')
    ].map((check) => ({ id: randomUUID(), company_id: tenantId, site_id: drawing.site_id, drawing_id: drawingId, unit_id: drawing.unit_id, evaluated_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...check }));
    for (const evaluation of evaluations) await this.safeSingle(this.db.from('psi_drawing_completeness_evaluations').upsert(evaluation, { onConflict: 'company_id,drawing_id,check_key' }).select().single());
    const complete = evaluations.filter((item) => item.status === 'Complete').length;
    const score = evaluations.length ? Math.round((complete / evaluations.length) * 10000) / 100 : 0;
    const critical = evaluations.some((item) => item.status !== 'Complete' && item.severity === 'Critical');
    const incomplete = evaluations.some((item) => item.status !== 'Complete');
    const reviewOverdue = this.isReviewOverdue(drawing);
    const status = critical ? 'Critical Gaps' : reviewOverdue ? 'Review Overdue' : !incomplete ? 'Complete' : score >= 70 ? 'Mostly Complete' : score > 0 ? 'Incomplete' : 'Not Reviewed';
    const pssrBlocker = evaluations.some((item) => item.pssr_blocker && item.status !== 'Complete');
    await this.db.single(this.db.from('psi_drawings').update({ completeness_score: score, completeness_status: status, pssr_blocker: pssrBlocker, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', drawingId).select('id').single()).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.drawing.completeness.run', drawing, null, { score, status, evaluations }, 'Drawing completeness checked', `${status} (${score}%).`);
    return this.completeness(tenantId, scope, drawingId);
  }

  async conflicts(tenantId: string, scope: Scope, drawingId: string) {
    await this.record(tenantId, scope, drawingId, true);
    return this.safeMany<Row>(this.db.from('psi_drawing_conflict_results').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId).order('created_at', { ascending: false }));
  }

  async runConflictCheck(tenantId: string, actorId: string, scope: Scope, drawingId: string) {
    const drawing = await this.record(tenantId, scope, drawingId, true);
    const [docs, moc, tags] = await Promise.all([this.documents(tenantId, scope, drawingId), this.mocRedlines(tenantId, scope, drawingId), this.tagIndex(tenantId, scope, drawingId, {})]);
    const conflicts: Row[] = [];
    const currentDoc = docs.find((doc) => doc.current_approved || this.isApprovedDocumentStatus(doc.document_status));
    if (drawing.current_approved && !currentDoc) conflicts.push(this.conflict(tenantId, drawing, 'Document Status Conflict', 'Critical Conflict', 'Critical', 'Drawing is marked current approved but no approved/current Document Control version is linked.', 'Document Control', null, { currentApproved: drawing.current_approved }, { documents: docs.map((doc) => doc.document_status) }));
    if (docs.some((doc) => doc.current_approved && ['Superseded', 'Expired', 'Rejected', 'Archived'].includes(doc.document_status))) conflicts.push(this.conflict(tenantId, drawing, 'Superseded Current Drawing', 'Critical Conflict', 'Critical', 'Superseded/expired/rejected document cannot be current approved PSI evidence.', 'Document Control'));
    if (moc?.drawing_update_required_by_moc && !moc.drawing_update_completed && moc.moc_update_status !== 'Waived With Approval') conflicts.push(this.conflict(tenantId, drawing, 'MOC Update Incomplete', 'Critical Conflict', 'Critical', 'MOC requires drawing update and update is not complete.', 'MOC', moc.linked_moc_id));
    if (moc?.redline_exists && ['Open', 'Under Review'].includes(moc.redline_status)) conflicts.push(this.conflict(tenantId, drawing, 'Open Redline', drawing.critical_drawing ? 'Major Conflict' : 'Warning', drawing.critical_drawing ? 'High' : 'Medium', 'Open redline remains on drawing.', 'Document Control', moc.redline_document_id));
    if (moc?.redline_due_date && new Date(moc.redline_due_date).getTime() < Date.now() && !['Closed', 'Incorporated'].includes(moc.redline_status)) conflicts.push(this.conflict(tenantId, drawing, 'Redline Overdue', 'Major Conflict', 'High', 'Redline due date has passed.', 'Document Control'));
    for (const tag of tags.filter((row) => ['Mismatch', 'Missing In Source Module', 'Missing On Drawing', 'Needs Review'].includes(row.verification_status))) conflicts.push(this.conflict(tenantId, drawing, 'Tag Index Mismatch', 'Warning', 'Medium', `${tag.tag_number} is ${tag.verification_status}.`, tag.linked_module, tag.linked_record_id, { tag }, { verificationStatus: tag.verification_status }));
    await this.safeMany(this.db.from('psi_drawing_conflict_results').delete().eq('company_id', tenantId).eq('drawing_id', drawingId).eq('override_approved', false).select('id'));
    for (const result of conflicts) await this.safeSingle(this.db.from('psi_drawing_conflict_results').insert(result).select().single());
    const status = this.worstConflict([...(await this.conflicts(tenantId, scope, drawingId)), ...conflicts]);
    await this.db.single(this.db.from('psi_drawings').update({ conflict_status: status, pssr_blocker: status === 'Critical Conflict' || drawing.pssr_blocker, updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', drawingId).select('id').single()).catch(() => null);
    await this.writeHistory(tenantId, actorId, 'psi.drawing.conflict_check.run', drawing, null, { status, count: conflicts.length }, 'Drawing conflict check run', `${status}: ${conflicts.length} new result(s).`);
    return this.conflicts(tenantId, scope, drawingId);
  }

  async overrideConflict(tenantId: string, actorId: string, scope: Scope, drawingId: string, conflictId: string, dto: Row) {
    const drawing = await this.record(tenantId, scope, drawingId);
    if (!dto.reason) throw new BadRequestException('Conflict override requires a reason.');
    const before = await this.safeSingle<Row>(this.db.from('psi_drawing_conflict_results').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId).eq('id', conflictId).maybeSingle());
    if (!before) throw new NotFoundException('Conflict not found.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawing_conflict_results').update({ conflict_status: 'Override Approved', override_approved: true, override_reason: dto.reason, override_approved_by: actorId, override_approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', conflictId).select().single()), 'Unable to override drawing conflict.');
    await this.writeHistory(tenantId, actorId, 'psi.drawing.conflict.override', drawing, before, row, 'Drawing conflict override approved', dto.reason);
    return this.conflicts(tenantId, scope, drawingId);
  }

  async submitReview(tenantId: string, actorId: string, scope: Scope, drawingId: string, dto: Row) {
    const before = await this.record(tenantId, scope, drawingId);
    await this.runConflictCheck(tenantId, actorId, scope, drawingId);
    await this.runCompleteness(tenantId, actorId, scope, drawingId);
    const conflicts = await this.conflicts(tenantId, scope, drawingId);
    if (conflicts.some((item) => item.conflict_status === 'Critical Conflict' && !item.override_approved)) throw new BadRequestException('Critical conflicts must be resolved or overridden before review.');
    const row = this.requireRow(await this.db.single<Row>(this.db.from('psi_drawings').update({ review_status: 'Submitted', status: 'Pending Review', updated_by: actorId, updated_at: new Date().toISOString() }).eq('company_id', tenantId).eq('id', drawingId).select().single()), 'Unable to submit drawing review.');
    await this.writeHistory(tenantId, actorId, 'psi.drawing.review.submitted', row, before, row, 'Drawing submitted for review', dto.reason ?? 'Review requested.');
    return row;
  }

  async history(tenantId: string, scope: Scope, drawingId: string) {
    await this.record(tenantId, scope, drawingId, true);
    return this.safeMany<Row>(this.db.from('psi_drawing_history_events').select('*').eq('company_id', tenantId).eq('drawing_id', drawingId).order('created_at', { ascending: false }).limit(150));
  }

  importTemplate() {
    return {
      drawingColumns: ['unit_code', 'area', 'drawing_number', 'drawing_title', 'drawing_type', 'discipline', 'revision_number', 'revision_date', 'document_reference', 'document_status', 'current_approved', 'critical_drawing', 'psm_critical', 'owner_email', 'document_controller_email', 'next_review_due', 'moc_required', 'linked_moc_reference', 'redline_status', 'as_built_required', 'as_built_verified'],
      tagIndexColumns: ['drawing_number', 'revision_number', 'tag_number', 'tag_type', 'tag_description', 'service', 'unit_code', 'area', 'linked_module', 'linked_record_reference', 'sheet_page_reference', 'source_method', 'verification_status']
    };
  }

  async importPreview(tenantId: string, actorId: string, scope: Scope, dto: Row) {
    const rows = Array.isArray(dto.rows) ? dto.rows : [];
    const preview = rows.map((row: Row, index: number) => ({ rowNumber: index + 1, row, errors: this.validateImportRow(row) }));
    const job = await this.db.single<Row>(this.db.from('psi_drawing_import_jobs').insert({ id: randomUUID(), company_id: tenantId, site_id: this.selectedSite(scope), uploaded_by: actorId, file_name: dto.fileName ?? 'psi-drawings-import.csv', file_key: dto.fileKey ?? null, status: preview.some((row: Row) => row.errors.length) ? 'Errors' : 'Preview Ready', total_rows: preview.length, valid_rows: preview.filter((row: Row) => !row.errors.length).length, error_rows: preview.filter((row: Row) => row.errors.length).length, preview_json: preview }).select().single());
    return job;
  }

  async exportRows(tenantId: string, actorId: string, scope: Scope, query: Row) {
    const rows = await this.registryRows(tenantId, scope, query, false);
    if (rows[0]) await this.writeHistory(tenantId, actorId, 'psi.drawing.exported', rows[0], null, { count: rows.length, query }, 'Drawings exported', `${rows.length} rows exported.`);
    return { rows, exportedAt: new Date().toISOString(), format: query.format ?? 'json' };
  }

  lookups() {
    return { drawingTypes, drawingDisciplines, drawingStatuses, tagTypes, tagVerificationStatuses, tagSourceMethods, redlineStatuses, mocDrawingUpdateStatuses, drawingConflictStatuses, relationshipTypes };
  }

  private async registryRows(tenantId: string, scope: Scope, query: Row, paged: boolean, page = 1, limit = 25) {
    const sort = String(query.sort ?? 'updated_at.desc');
    const [sortColumn, sortDirection] = sort.split('.');
    let request: any = this.applyScope(this.db.from('psi_drawings').select('*, psi_drawing_document_links(*), psi_drawing_relationships(*), psi_drawing_moc_redline_status(*)').eq('company_id', tenantId), scope);
    if (query.includeArchived !== 'true') request = request.is('archived_at', null);
    if (query.search) request = request.or(`drawing_number.ilike.%${query.search}%,drawing_title.ilike.%${query.search}%,system_service.ilike.%${query.search}%`);
    if (query.unitId ?? query.unit_id) request = request.eq('unit_id', query.unitId ?? query.unit_id);
    if (query.areaId ?? query.area_id) request = request.eq('area_id', query.areaId ?? query.area_id);
    if (query.drawingType ?? query.drawing_type) request = request.eq('drawing_type', query.drawingType ?? query.drawing_type);
    if (query.discipline) request = request.eq('discipline', query.discipline);
    if (query.status) request = request.eq('status', query.status);
    if (query.reviewStatus ?? query.review_status) request = request.eq('review_status', query.reviewStatus ?? query.review_status);
    if (query.currentApproved === 'true' || query.current_approved === 'true') request = request.eq('current_approved', true);
    if (query.currentApproved === 'false' || query.current_approved === 'false') request = request.eq('current_approved', false);
    if (query.asBuiltVerified === 'true') request = request.eq('as_built_verified', true);
    if (query.asBuiltVerified === 'false') request = request.eq('as_built_verified', false);
    if (query.mocRequired === 'true' || query.moc_update_required === 'true') request = request.eq('moc_update_required', true);
    if (query.pssrBlocker === 'true') request = request.eq('pssr_blocker', true);
    if (query.conflictStatus ?? query.conflict_status) request = request.eq('conflict_status', query.conflictStatus ?? query.conflict_status);
    if (query.completenessStatus ?? query.completeness_status) request = request.eq('completeness_status', query.completenessStatus ?? query.completeness_status);
    const rows = await this.safeMany<Row>(request.order(this.safeSortColumn(sortColumn ?? 'updated_at'), { ascending: sortDirection !== 'desc' }));
    const normalized = rows.map((row) => this.normalize(row)).filter((row) => {
      if (query.pids) return row.drawing_type === 'P&ID';
      if (query.pfds) return row.drawing_type === 'PFD';
      if (query.missing) return !row.current_approved || ['Incomplete', 'Critical Gaps', 'Not Reviewed'].includes(row.completeness_status);
      if (query.superseded) return row.status === 'Superseded' || row.document_status === 'Superseded';
      if (query.pendingApproval) return ['Submitted', 'Pending Review', 'In Review'].includes(row.review_status);
      if (query.redlines) return ['Open', 'Under Review'].includes(row.redline_status);
      if (query.asBuiltRequired) return row.as_built_required && !row.as_built_verified;
      if (query.reviewOverdue) return this.isReviewOverdue(row);
      if (query.equipmentId ?? query.equipment_id) return row.relationships?.some((rel: Row) => rel.linked_module === 'Equipment' && rel.linked_record_id === (query.equipmentId ?? query.equipment_id));
      return true;
    });
    if (!paged) return normalized;
    return normalized.slice((page - 1) * limit, page * limit);
  }

  private normalize(row: Row): Row {
    const documents = (row.psi_drawing_document_links ?? []).filter((doc: Row) => !doc.removed_at);
    const relationships = (row.psi_drawing_relationships ?? []).filter((rel: Row) => !rel.removed_at);
    const mocRows = row.psi_drawing_moc_redline_status ?? [];
    const moc = Array.isArray(mocRows) ? mocRows[0] : mocRows;
    const currentDocument = documents.find((doc: Row) => doc.current_approved) ?? documents[0] ?? null;
    return {
      ...row,
      documents,
      relationships,
      mocRedlines: moc ?? null,
      document_status: currentDocument?.document_status ?? null,
      document_revision: currentDocument?.revision_number ?? null,
      as_built_required: Boolean(moc?.as_built_required),
      redline_status: moc?.redline_status ?? row.redline_status ?? 'None',
      linkedEquipmentCount: relationships.filter((rel: Row) => rel.linked_module === 'Equipment').length,
      linkedTagsCount: Number(row.linkedTagsCount ?? 0)
    };
  }

  private async record(tenantId: string, scope: Scope, drawingId: string, includeArchived = false) {
    let request: any = this.applyScope(this.db.from('psi_drawings').select('*').eq('company_id', tenantId).eq('id', drawingId), scope);
    if (!includeArchived) request = request.is('archived_at', null);
    const row = await this.safeSingle<Row>(request.maybeSingle());
    if (!row) throw new NotFoundException('Drawing not found or outside your company/site access.');
    return row;
  }

  private async unitRecord(tenantId: string, scope: Scope, unitId: string) {
    if (!unitId) throw new BadRequestException('Process unit is required.');
    const row = await this.safeSingle<Row>(this.applyScope(this.db.from('psi_units').select('*').eq('company_id', tenantId).eq('id', unitId), scope).maybeSingle());
    if (!row) throw new NotFoundException('Process unit not found or outside your company/site access.');
    return row;
  }

  private async ensureNoActiveDuplicate(tenantId: string, siteId: string, drawingNumber: string, revisionNumber: string) {
    let request: any = this.db.from('psi_drawings').select('id').eq('company_id', tenantId).eq('site_id', siteId).eq('drawing_number', drawingNumber).is('archived_at', null);
    if (!revisionNumber) {
      const existing = await this.safeSingle<Row>(request.maybeSingle());
      if (existing) throw new BadRequestException('Drawing number already exists for this company/site. Add a new revision/document to the existing drawing or archive the duplicate.');
    }
  }

  private drawingPayload(tenantId: string, actorId: string, siteId: string, unit: Row | null, dto: Row, extra: Row = {}): Row {
    return this.clean({
      id: dto.id,
      company_id: tenantId,
      site_id: siteId,
      unit_id: unit?.id ?? dto.unit_id ?? dto.unitId ?? null,
      area_id: dto.area_id ?? dto.areaId ?? unit?.area_id ?? null,
      drawing_number: dto.drawing_number ?? dto.drawingNumber,
      drawing_title: dto.drawing_title ?? dto.drawingTitle,
      drawing_type: dto.drawing_type ?? dto.drawingType,
      discipline: dto.discipline,
      system_service: dto.system_service ?? dto.systemService ?? null,
      drawing_package: dto.drawing_package ?? dto.drawingPackage ?? null,
      sheet_number: dto.sheet_number ?? dto.sheetNumber ?? null,
      total_sheets: this.num(dto.total_sheets ?? dto.totalSheets),
      drawing_scale: dto.drawing_scale ?? dto.drawingScale ?? null,
      status: dto.status ?? 'Draft',
      critical_drawing: Boolean(dto.critical_drawing ?? dto.criticalDrawing),
      psm_critical: Boolean(dto.psm_critical ?? dto.psmCritical),
      current_approved: Boolean(dto.current_approved ?? dto.currentApproved),
      as_built_verified: Boolean(dto.as_built_verified ?? dto.asBuiltVerified),
      redline_status: dto.redline_status ?? dto.redlineStatus ?? null,
      owner_user_id: dto.owner_user_id ?? dto.ownerUserId ?? null,
      document_controller_id: dto.document_controller_id ?? dto.documentControllerId ?? null,
      process_engineer_id: dto.process_engineer_id ?? dto.processEngineerId ?? null,
      discipline_engineer_id: dto.discipline_engineer_id ?? dto.disciplineEngineerId ?? null,
      operations_owner_id: dto.operations_owner_id ?? dto.operationsOwnerId ?? null,
      hse_reviewer_id: dto.hse_reviewer_id ?? dto.hseReviewerId ?? null,
      last_review_date: this.dateOrNull(dto.last_review_date ?? dto.lastReviewDate),
      next_review_due: this.dateOrNull(dto.next_review_due ?? dto.nextReviewDue),
      notes: dto.notes ?? null,
      created_by: actorId,
      updated_by: actorId,
      ...extra
    });
  }

  private documentPayload(tenantId: string, actorId: string, drawing: Row, dto: Row) {
    return this.clean({
      id: dto.id ?? randomUUID(),
      company_id: tenantId,
      site_id: drawing.site_id,
      drawing_id: drawing.id,
      document_id: dto.document_id ?? dto.documentId,
      document_version_id: dto.document_version_id ?? dto.documentVersionId ?? null,
      document_number: dto.document_number ?? dto.documentNumber ?? null,
      document_title: dto.document_title ?? dto.documentTitle ?? null,
      revision_number: dto.revision_number ?? dto.revisionNumber ?? null,
      revision_date: this.dateOrNull(dto.revision_date ?? dto.revisionDate),
      document_status: dto.document_status ?? dto.documentStatus ?? null,
      current_approved: Boolean(dto.current_approved ?? dto.currentApproved),
      supersedes_document_id: dto.supersedes_document_id ?? dto.supersedesDocumentId ?? null,
      superseded_by_document_id: dto.superseded_by_document_id ?? dto.supersededByDocumentId ?? null,
      issued_for_review_date: this.dateOrNull(dto.issued_for_review_date ?? dto.issuedForReviewDate),
      issued_for_construction_date: this.dateOrNull(dto.issued_for_construction_date ?? dto.issuedForConstructionDate),
      issued_as_built_date: this.dateOrNull(dto.issued_as_built_date ?? dto.issuedAsBuiltDate),
      approval_date: this.dateOrNull(dto.approval_date ?? dto.approvalDate),
      effective_date: this.dateOrNull(dto.effective_date ?? dto.effectiveDate),
      document_language: dto.document_language ?? dto.documentLanguage ?? null,
      file_type: dto.file_type ?? dto.fileType ?? null,
      source_system_reference: dto.source_system_reference ?? dto.sourceSystemReference ?? null,
      revision_notes: dto.revision_notes ?? dto.revisionNotes ?? null,
      linked_by: actorId,
      linked_at: new Date().toISOString(),
      removed_at: null,
      removed_by: null,
      remove_reason: null
    });
  }

  private scopePayload(tenantId: string, drawing: Row, dto: Row) {
    return this.clean({
      id: dto.scope_id ?? dto.scopeId ?? randomUUID(),
      company_id: tenantId,
      site_id: drawing.site_id,
      drawing_id: drawing.id,
      unit_id: dto.unit_id ?? dto.unitId ?? drawing.unit_id ?? null,
      department_id: dto.department_id ?? dto.departmentId ?? null,
      area_id: dto.area_id ?? dto.areaId ?? drawing.area_id ?? null,
      building_location: dto.building_location ?? dto.buildingLocation ?? null,
      battery_limits: dto.battery_limits ?? dto.batteryLimits ?? null,
      system_service: dto.system_service ?? dto.systemService ?? drawing.system_service ?? null,
      related_process_step: dto.related_process_step ?? dto.relatedProcessStep ?? null,
      related_operating_mode: dto.related_operating_mode ?? dto.relatedOperatingMode ?? null,
      related_utilities_json: dto.related_utilities_json ?? dto.relatedUtilities ?? null,
      upstream_unit_id: dto.upstream_unit_id ?? dto.upstreamUnitId ?? null,
      downstream_unit_id: dto.downstream_unit_id ?? dto.downstreamUnitId ?? null,
      affected_units_json: dto.affected_units_json ?? dto.affectedUnits ?? null,
      notes: dto.scope_notes ?? dto.scopeNotes ?? dto.notes ?? null,
      updated_at: new Date().toISOString()
    });
  }

  private relationshipPayload(tenantId: string, actorId: string, drawing: Row, dto: Row) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: drawing.site_id, drawing_id: drawing.id, linked_module: dto.linked_module ?? dto.linkedModule, linked_record_id: dto.linked_record_id ?? dto.linkedRecordId, linked_record_label: dto.linked_record_label ?? dto.linkedRecordLabel ?? null, relationship_type: dto.relationship_type ?? dto.relationshipType ?? 'Supports', readiness_impact: Boolean(dto.readiness_impact ?? dto.readinessImpact), pssr_impact: Boolean(dto.pssr_impact ?? dto.pssrImpact), moc_impact: Boolean(dto.moc_impact ?? dto.mocImpact), notes: dto.notes ?? null, created_by: actorId });
  }

  private tagPayload(tenantId: string, actorId: string, drawing: Row, dto: Row) {
    return this.clean({ id: dto.id ?? randomUUID(), company_id: tenantId, site_id: drawing.site_id, drawing_id: drawing.id, unit_id: dto.unit_id ?? dto.unitId ?? drawing.unit_id ?? null, area_id: dto.area_id ?? dto.areaId ?? drawing.area_id ?? null, tag_number: dto.tag_number ?? dto.tagNumber, tag_type: dto.tag_type ?? dto.tagType, tag_description: dto.tag_description ?? dto.tagDescription ?? null, service: dto.service ?? null, linked_module: dto.linked_module ?? dto.linkedModule ?? null, linked_record_id: dto.linked_record_id ?? dto.linkedRecordId ?? null, sheet_page_reference: dto.sheet_page_reference ?? dto.sheetPageReference ?? null, coordinate_reference: dto.coordinate_reference ?? dto.coordinateReference ?? null, verification_status: dto.verification_status ?? dto.verificationStatus ?? 'Unverified', source_method: dto.source_method ?? dto.sourceMethod ?? 'Manual', mismatch_reason: dto.mismatch_reason ?? dto.mismatchReason ?? null, notes: dto.notes ?? null, created_by: actorId, updated_by: actorId, updated_at: new Date().toISOString() });
  }

  private mocRedlinePayload(tenantId: string, drawing: Row, dto: Row) {
    return this.clean({ id: dto.moc_redline_id ?? dto.mocRedlineId ?? randomUUID(), company_id: tenantId, site_id: drawing.site_id, drawing_id: drawing.id, redline_exists: Boolean(dto.redline_exists ?? dto.redlineExists), redline_status: dto.redline_status ?? dto.redlineStatus ?? 'None', redline_document_id: dto.redline_document_id ?? dto.redlineDocumentId ?? null, redline_owner_id: dto.redline_owner_id ?? dto.redlineOwnerId ?? null, redline_due_date: this.dateOrNull(dto.redline_due_date ?? dto.redlineDueDate), moc_required: Boolean(dto.moc_required ?? dto.mocRequired), linked_moc_id: dto.linked_moc_id ?? dto.linkedMocId ?? null, moc_update_status: dto.moc_update_status ?? dto.mocUpdateStatus ?? 'Not Required', drawing_update_required_by_moc: Boolean(dto.drawing_update_required_by_moc ?? dto.drawingUpdateRequiredByMoc), drawing_update_completed: Boolean(dto.drawing_update_completed ?? dto.drawingUpdateCompleted), as_built_required: Boolean(dto.as_built_required ?? dto.asBuiltRequired), as_built_verified: Boolean(dto.as_built_verified ?? dto.asBuiltVerified), as_built_verified_by: dto.as_built_verified_by ?? dto.asBuiltVerifiedBy ?? null, as_built_verified_at: this.dateOrNull(dto.as_built_verified_at ?? dto.asBuiltVerifiedAt), field_walkdown_required: Boolean(dto.field_walkdown_required ?? dto.fieldWalkdownRequired), field_walkdown_status: dto.field_walkdown_status ?? dto.fieldWalkdownStatus ?? null, field_walkdown_evidence_document_id: dto.field_walkdown_evidence_document_id ?? dto.fieldWalkdownEvidenceDocumentId ?? null, comments: dto.comments ?? null, updated_at: new Date().toISOString() });
  }

  private conflict(tenantId: string, drawing: Row, type: string, status: string, severity: string, message: string, comparedModule?: string | null, comparedRecordId?: string | null, comparedValue?: Row | null, currentValue?: Row | null) {
    return { id: randomUUID(), company_id: tenantId, site_id: drawing.site_id, drawing_id: drawing.id, unit_id: drawing.unit_id, conflict_type: type, conflict_status: status, severity, message, compared_module: comparedModule ?? null, compared_record_id: comparedRecordId ?? null, compared_value_json: comparedValue ?? null, current_value_json: currentValue ?? null, override_required: status === 'Critical Conflict', override_approved: false };
  }

  private check(key: string, title: string, ok: boolean, severity: string, message: string) {
    return { check_key: key, check_title: title, status: ok ? 'Complete' : severity === 'Critical' ? 'Critical Gaps' : 'Incomplete', severity, message: ok ? null : message, missing_reason: ok ? null : message, pssr_blocker: severity === 'Critical' && !ok, action_required: !ok };
  }

  private validateIdentity(dto: Row) {
    this.requireText(dto.drawing_number ?? dto.drawingNumber, 'Drawing number is required.');
    this.requireText(dto.drawing_title ?? dto.drawingTitle, 'Drawing title is required.');
    this.requireText(dto.drawing_type ?? dto.drawingType, 'Drawing type is required.');
    if (!drawingTypes.includes(String(dto.drawing_type ?? dto.drawingType))) throw new BadRequestException('Drawing type is not supported by PSI Drawings / P&IDs.');
    if ((dto.critical_drawing ?? dto.criticalDrawing) && !(dto.owner_user_id ?? dto.ownerUserId)) throw new BadRequestException('Critical P&ID/PFD requires an owner.');
  }

  private validateImportRow(row: Row) {
    const errors: string[] = [];
    if (!row.drawing_number) errors.push('drawing_number is required');
    if (!row.drawing_title) errors.push('drawing_title is required');
    if (!row.drawing_type || !drawingTypes.includes(String(row.drawing_type))) errors.push('drawing_type is invalid');
    if (row.document_status && row.current_approved && !this.isApprovedDocumentStatus(row.document_status)) errors.push('current_approved requires approved/current document status');
    return errors;
  }

  private validateTagImportRow(row: Row) {
    const errors: string[] = [];
    if (!row.tag_number) errors.push('tag_number is required');
    if (!row.tag_type || !tagTypes.includes(String(row.tag_type))) errors.push('tag_type is invalid');
    if (row.verification_status && !tagVerificationStatuses.includes(String(row.verification_status))) errors.push('verification_status is invalid');
    return errors;
  }

  private hasScopeFields(dto: Row) { return ['department_id', 'building_location', 'battery_limits', 'related_process_step', 'related_operating_mode', 'related_utilities_json', 'upstream_unit_id', 'downstream_unit_id', 'affected_units_json'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private hasMocRedlineFields(dto: Row) { return ['redline_exists', 'redline_status', 'moc_required', 'linked_moc_id', 'moc_update_status', 'drawing_update_required_by_moc', 'drawing_update_completed', 'as_built_required', 'as_built_verified', 'field_walkdown_required', 'field_walkdown_status'].some((key) => dto[key] !== undefined || dto[this.camel(key)] !== undefined); }
  private shouldBlockPssr(drawing: Row, moc: Row) { return Boolean((drawing.critical_drawing || drawing.psm_critical || ['P&ID', 'PFD'].includes(drawing.drawing_type)) && ((moc.drawing_update_required_by_moc && !moc.drawing_update_completed) || (moc.as_built_required && !moc.as_built_verified) || ['Open', 'Under Review'].includes(moc.redline_status))); }
  private isApprovedDocumentStatus(status: unknown) { return ['Approved', 'Current', 'As-Built Verified'].includes(String(status ?? '')); }
  private applyScope(query: any, scope: Scope, column = 'site_id') { if (scope.corporateView) return query; if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId); if (scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds); return query; }
  private assertSiteAccess(scope: Scope, siteId: string) { if (!siteId) throw new BadRequestException('Site is required.'); if (scope.corporateView) return siteId; if (scope.selectedSiteId && scope.selectedSiteId !== siteId) throw new ForbiddenException('Selected site is outside your active site scope.'); if (scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('Site is outside your permitted scope.'); return siteId; }
  private selectedSite(scope: Scope) { return scope.selectedSiteId ?? scope.allowedSiteIds?.[0] ?? null; }
  private isReviewOverdue(row: Row) { if (!row.next_review_due) return false; return new Date(row.next_review_due).getTime() < Date.now() && row.review_status !== 'Approved'; }
  private worstConflict(results: Row[]) { if (results.some((row) => row.conflict_status === 'Critical Conflict' && !row.override_approved)) return 'Critical Conflict'; if (results.some((row) => row.conflict_status === 'Major Conflict' && !row.override_approved)) return 'Major Conflict'; if (results.some((row) => row.conflict_status === 'Warning')) return 'Warning'; if (results.some((row) => row.conflict_status === 'Override Approved')) return 'Override Approved'; return 'No Conflict'; }
  private safeSortColumn(column: string) { return new Set(['updated_at', 'created_at', 'drawing_number', 'drawing_title', 'drawing_type', 'discipline', 'review_status', 'conflict_status', 'completeness_status', 'next_review_due']).has(column) ? column : 'updated_at'; }
  private requireText(value: unknown, message: string) { const text = String(value ?? '').trim(); if (!text) throw new BadRequestException(message); return text; }
  private requireRow<T>(row: T | null | undefined, message: string): T { if (!row) throw new BadRequestException(message); return row; }
  private async safeSingle<T>(query: PromiseLike<any>) { try { return await this.db.single<T>(query); } catch { return null; } }
  private async safeMany<T>(query: PromiseLike<any>) { try { return await this.db.many<T>(query); } catch { return []; } }
  private dateOrNull(value: unknown) { if (!value) return null; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? null : date.toISOString(); }
  private num(value: unknown) { if (value === null || value === undefined || value === '') return null; const num = Number(value); return Number.isFinite(num) ? num : null; }
  private camel(value: string) { return value.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }
  private clean<T extends Row>(value: T): T { return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T; }

  private overview(drawing: Row, documents: Row[], relationships: Row[], tagIndex: Row[], moc: Row | null, completeness: Row[], conflicts: Row[]) {
    return {
      cards: [
        { label: 'Drawing', value: `${drawing.drawing_number} - ${drawing.drawing_title}` },
        { label: 'Drawing Type', value: drawing.drawing_type },
        { label: 'Unit / Area', value: [drawing.unit_id, drawing.area_id].filter(Boolean).join(' / ') || 'Global site drawing' },
        { label: 'Revision', value: documents.find((doc) => doc.current_approved)?.revision_number ?? documents[0]?.revision_number ?? 'Missing' },
        { label: 'Document Status', value: documents.find((doc) => doc.current_approved)?.document_status ?? documents[0]?.document_status ?? 'No document linked' },
        { label: 'Current Approved', value: drawing.current_approved ? 'Yes' : 'No', tone: drawing.current_approved ? 'good' : 'danger' },
        { label: 'Redline Status', value: moc?.redline_status ?? drawing.redline_status ?? 'None' },
        { label: 'As-Built Status', value: drawing.as_built_verified ? 'Verified' : moc?.as_built_required ? 'Required' : 'Not required' },
        { label: 'Linked Equipment', value: relationships.filter((rel) => rel.linked_module === 'Equipment').length },
        { label: 'Linked Tags', value: tagIndex.length },
        { label: 'MOC Update Required', value: drawing.moc_update_required ? 'Yes' : 'No', tone: drawing.moc_update_required ? 'warn' : 'good' },
        { label: 'PSSR Blocker', value: drawing.pssr_blocker ? 'Yes' : 'No', tone: drawing.pssr_blocker ? 'danger' : 'good' },
        { label: 'Completeness', value: `${drawing.completeness_status} ${drawing.completeness_score ?? 0}%` },
        { label: 'Conflict Status', value: drawing.conflict_status },
        { label: 'Review Status', value: drawing.review_status },
        { label: 'PSI Completeness Impact', value: completeness.filter((row) => row.status !== 'Complete').length ? 'Open gaps' : 'No gaps' }
      ],
      blockers: [...completeness.filter((row) => row.status !== 'Complete'), ...conflicts.filter((row) => row.conflict_status !== 'No Conflict')]
    };
  }

  private tabs(drawingId: string) {
    return ['Overview', 'Document / Revision', 'Drawing Scope', 'Linked Equipment / Records', 'Tag Index', 'MOC / Redlines', 'As-Built Verification', 'Completeness / Conflicts', 'Documents', 'Review & Approval', 'Change History'].map((label) => ({ label, href: `/process-safety-information/drawings/${drawingId}`, enabled: true }));
  }

  private actions(drawing: Row, documents: Row[], completeness: Row[], conflicts: Row[]) {
    const criticalConflict = conflicts.some((item) => item.conflict_status === 'Critical Conflict' && !item.override_approved);
    const missingDoc = !documents.length;
    const incomplete = completeness.some((item) => item.status !== 'Complete');
    return [
      { key: 'edit', label: 'Edit Metadata', enabled: drawing.review_status !== 'Approved', disabledReason: drawing.review_status === 'Approved' ? 'Approved drawing metadata requires controlled edit/MOC.' : null },
      { key: 'link-document', label: 'Link Document', enabled: true, disabledReason: null },
      { key: 'manage-tag-index', label: 'Extract / Manage Tag Index', enabled: true, disabledReason: null },
      { key: 'mark-as-built', label: 'Mark As-Built Verified', enabled: !drawing.as_built_verified, disabledReason: drawing.as_built_verified ? 'As-built is already verified.' : null },
      { key: 'submit-review', label: 'Submit for Review', enabled: !criticalConflict && !missingDoc, disabledReason: criticalConflict ? 'Critical conflicts must be cleared before review.' : missingDoc ? 'Document Control link is required before review.' : incomplete ? 'Completeness warnings will be submitted with review.' : null }
    ];
  }

  private async writeHistory(tenantId: string, actorId: string, action: string, drawing: Row, before: any, after: any, title: string, description?: string | null) {
    await this.audit.write({ tenantId, actorId, action, entityType: 'PSI_DRAWING', entityId: drawing.id, before: before as JsonValue, after: after as JsonValue }).catch(() => null);
    await this.db.single(this.db.from('psi_drawing_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: drawing.site_id, unit_id: drawing.unit_id ?? null, drawing_id: drawing.id, event_type: action, event_title: title, event_description: description ?? null, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId, source_record_id: drawing.id }).select('id').single()).catch(() => null);
    await this.db.single(this.db.from('psi_history_events').insert({ id: randomUUID(), company_id: tenantId, site_id: drawing.site_id, unit_id: drawing.unit_id ?? null, event_type: action, event_title: title, event_description: description ?? null, source_module: 'PSI Drawings / P&IDs', source_record_id: drawing.id, before_value_json: before ?? null, after_value_json: after ?? null, actor_user_id: actorId }).select('id').single()).catch(() => null);
  }
}
