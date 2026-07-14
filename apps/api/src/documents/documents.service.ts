import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchIndexService } from '../search/search-index.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentCommentDto } from './dto/document-comment.dto';
import { DocumentDecisionDto, DocumentReasonDto, DocumentRejectDto } from './dto/document-decision.dto';
import { DocumentFilterDto } from './dto/document-filter.dto';
import { DocumentRelationDto } from './dto/document-relation.dto';
import { DocumentVersionDto } from './dto/document-version.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentsRepository } from './repositories/documents.repository';

type UploadedFile = { originalname: string; mimetype: string; size: number; buffer: Buffer };
type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

@Injectable()
export class DocumentsService {
  constructor(
    private readonly repo: DocumentsRepository,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly searchIndex: SearchIndexService
  ) {}

  async list(tenantId: string, filters: DocumentFilterDto, scope: Scope) {
    let query = this.repo.documents().select('*, current_version:document_versions!documents_current_version_fkey(*), review:document_reviews(*), relations:document_relations(*), tags:document_tags(*)').eq('tenant_id', tenantId);
    if (filters.documentType) query = query.eq('document_type', filters.documentType);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    else if (scope.selectedSiteId) query = query.eq('site_id', scope.selectedSiteId);
    else if (!scope.corporateView && scope.allowedSiteIds?.length) query = query.in('site_id', scope.allowedSiteIds);
    if (filters.unitId) query = query.eq('unit_id', filters.unitId);
    if (filters.areaId) query = query.eq('area_id', filters.areaId);
    if (filters.ownerId) query = query.eq('owner_id', filters.ownerId);
    if (filters.folderId) query = query.eq('folder_id', filters.folderId);
    if (filters.search) query = query.or(`title.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    const docs = await this.repo.db.many<any>(query.order('updated_at', { ascending: false }));
    if (filters.equipmentId) return docs.filter((doc) => (doc.relations ?? []).some((rel: any) => rel.equipment_id === filters.equipmentId || rel.related_record_id === filters.equipmentId));
    if (filters.tag) return docs.filter((doc) => (doc.tags ?? []).some((tag: any) => tag.tag === filters.tag));
    return docs;
  }

  async get(tenantId: string, id: string, scope: Scope) {
    const doc = await this.repo.db.single<any>(this.repo.documents().select('*, current_version:document_versions!documents_current_version_fkey(*), versions:document_versions(*), review:document_reviews(*), relations:document_relations(*), comments:document_comments(*), approvals:document_approvals(*), access_logs:document_access_logs(*), tags:document_tags(*)').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!doc) throw new NotFoundException('Document not found');
    this.assertSiteAccess(doc.site_id, scope);
    return doc;
  }

  async create(tenantId: string, actorId: string, dto: CreateDocumentDto, file: UploadedFile | undefined, scope: Scope) {
    if (!file?.buffer) throw new BadRequestException('File is required');
    this.assertSiteAccess(dto.siteId, scope);
    const now = new Date().toISOString();
    const documentId = crypto.randomUUID();
    const documentNumber = await this.nextDocumentNumber(tenantId, dto.siteId, dto.documentType);
    const storageKey = `documents/${tenantId}/${documentId}/${crypto.randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await this.persist(storageKey, file.buffer);
    const doc = await this.repo.db.single<any>(this.repo.documents().insert({
      id: documentId,
      tenant_id: tenantId,
      site_id: dto.siteId,
      unit_id: dto.unitId ?? null,
      area_id: dto.areaId ?? null,
      folder_id: dto.folderId ?? null,
      document_number: documentNumber,
      title: dto.title,
      description: dto.description ?? null,
      document_type: dto.documentType,
      status: 'Draft',
      owner_id: dto.ownerId,
      created_by: actorId,
      updated_at: now
    }).select().single());
    const version = await this.createVersionRow(tenantId, documentId, 'v1.0', file, storageKey, actorId, dto.changeSummary ?? 'Initial controlled document upload', true);
    await this.repo.db.single(this.repo.documents().update({ current_version_id: version.id, updated_at: now }).eq('id', documentId).select().single());
    await this.repo.db.single(this.repo.reviews().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      document_id: documentId,
      review_frequency_months: dto.reviewFrequencyMonths ?? 12,
      next_review_date: this.addMonths(new Date(), dto.reviewFrequencyMonths ?? 12).toISOString().slice(0, 10),
      review_owner_id: dto.ownerId,
      review_status: 'Scheduled',
      updated_at: now
    }).select().single());
    await this.replaceTags(tenantId, documentId, dto.tags);
    if (dto.relatedEquipmentId || (dto.relatedModule && dto.relatedRecordId)) {
      const relation: DocumentRelationDto = {
        relatedModule: dto.relatedModule ?? 'equipment',
        relatedRecordId: dto.relatedRecordId ?? dto.relatedEquipmentId!,
        relationType: dto.relationType ?? 'Reference'
      };
      if (dto.relatedEquipmentId) relation.equipmentId = dto.relatedEquipmentId;
      await this.addRelation(tenantId, actorId, documentId, relation);
    }
    await this.access(tenantId, documentId, actorId, 'upload');
    await this.audit.write({ tenantId, actorId, action: 'DOCUMENT_UPLOADED', entityType: 'Document', entityId: documentId, after: { doc, version } as JsonValue });
    await this.indexDocument(tenantId, documentId);
    await this.notifications.notifyUser({ tenantId, userId: dto.ownerId, siteId: dto.siteId, type: 'document.uploaded', module: 'documents', title: 'Document uploaded', message: `${documentNumber} - ${dto.title} was uploaded.`, relatedRecordId: documentId, relatedRecordType: 'Document', relatedUrl: `/documents/${documentId}`, priority: 'Info' });
    return this.get(tenantId, documentId, scope);
  }

  async update(tenantId: string, actorId: string, id: string, dto: UpdateDocumentDto, scope: Scope) {
    const before = await this.get(tenantId, id, scope);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.documentType !== undefined) patch.document_type = dto.documentType;
    if (dto.siteId !== undefined) { this.assertSiteAccess(dto.siteId, scope); patch.site_id = dto.siteId; }
    if (dto.unitId !== undefined) patch.unit_id = dto.unitId || null;
    if (dto.areaId !== undefined) patch.area_id = dto.areaId || null;
    if (dto.ownerId !== undefined) patch.owner_id = dto.ownerId;
    if (dto.folderId !== undefined) patch.folder_id = dto.folderId || null;
    const doc = await this.repo.db.single<any>(this.repo.documents().update(patch).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.audit.write({ tenantId, actorId, action: 'DOCUMENT_UPDATED', entityType: 'Document', entityId: id, before: before as JsonValue, after: doc as JsonValue });
    await this.indexDocument(tenantId, id);
    return this.get(tenantId, id, scope);
  }

  async uploadVersion(tenantId: string, actorId: string, id: string, dto: DocumentVersionDto, file: UploadedFile | undefined, scope: Scope) {
    if (!file?.buffer) throw new BadRequestException('File is required');
    if (!dto.changeSummary) throw new BadRequestException('New version requires change summary');
    const doc = await this.get(tenantId, id, scope);
    const versionNumber = this.nextVersion(doc.versions ?? []);
    const storageKey = `documents/${tenantId}/${id}/${crypto.randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await this.persist(storageKey, file.buffer);
    await this.repo.db.many(this.repo.versions().update({ is_current: false }).eq('document_id', id).select());
    const version = await this.createVersionRow(tenantId, id, versionNumber, file, storageKey, actorId, dto.changeSummary, true);
    await this.repo.db.single(this.repo.documents().update({ current_version_id: version.id, status: doc.status === 'Active' ? 'Approved' : doc.status, updated_at: new Date().toISOString() }).eq('id', id).select().single());
    await this.access(tenantId, id, actorId, 'new_version');
    await this.audit.write({ tenantId, actorId, action: 'DOCUMENT_VERSION_UPLOADED', entityType: 'Document', entityId: id, after: version as JsonValue });
    await this.indexDocument(tenantId, id);
    return this.get(tenantId, id, scope);
  }

  versions(tenantId: string, documentId: string) {
    return this.repo.db.many(this.repo.versions().select('*').eq('tenant_id', tenantId).eq('document_id', documentId).order('uploaded_at', { ascending: false }));
  }

  async submitReview(tenantId: string, actorId: string, id: string, scope: Scope) {
    return this.transition(tenantId, actorId, id, 'Under Review', 'DOCUMENT_SUBMITTED_REVIEW', scope);
  }

  async approve(tenantId: string, actorId: string, id: string, dto: DocumentDecisionDto, scope: Scope) {
    await this.decision(tenantId, actorId, id, 'Approved', dto.comment ?? null, scope);
    const doc = await this.transition(tenantId, actorId, id, 'Approved', 'DOCUMENT_APPROVED', scope);
    await this.notifications.notifyUser({ tenantId, userId: doc.owner_id, siteId: doc.site_id, type: 'document.approved', module: 'documents', title: 'Document approved', message: `${doc.document_number} was approved.`, relatedRecordId: id, relatedRecordType: 'Document', relatedUrl: `/documents/${id}`, priority: 'Normal' });
    return doc;
  }

  async reject(tenantId: string, actorId: string, id: string, dto: DocumentRejectDto, scope: Scope) {
    await this.decision(tenantId, actorId, id, 'Rejected', dto.comment, scope);
    const doc = await this.transition(tenantId, actorId, id, 'Draft', 'DOCUMENT_REJECTED', scope);
    await this.notifications.notifyUser({ tenantId, userId: doc.owner_id, siteId: doc.site_id, type: 'document.rejected', module: 'documents', title: 'Document rejected', message: `${doc.document_number} was rejected: ${dto.comment}`, relatedRecordId: id, relatedRecordType: 'Document', relatedUrl: `/documents/${id}`, priority: 'High' });
    return doc;
  }

  async activate(tenantId: string, actorId: string, id: string, scope: Scope) {
    const doc = await this.get(tenantId, id, scope);
    if (doc.status !== 'Approved') throw new BadRequestException('Only approved documents can become Active');
    return this.transition(tenantId, actorId, id, 'Active', 'DOCUMENT_ACTIVATED', scope);
  }

  async obsolete(tenantId: string, actorId: string, id: string, dto: DocumentReasonDto, scope: Scope) {
    const before = await this.get(tenantId, id, scope);
    const doc = await this.repo.db.single<any>(this.repo.documents().update({ status: 'Obsolete', obsolete_reason: dto.reason, replacement_document_id: dto.replacementDocumentId ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.audit.write({ tenantId, actorId, action: 'DOCUMENT_OBSOLETE', entityType: 'Document', entityId: id, before: before as JsonValue, after: doc as JsonValue });
    return this.get(tenantId, id, scope);
  }

  async archive(tenantId: string, actorId: string, id: string, dto: DocumentReasonDto, scope: Scope) {
    const before = await this.get(tenantId, id, scope);
    const doc = await this.repo.db.single<any>(this.repo.documents().update({ status: 'Archived', archive_reason: dto.reason, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.audit.write({ tenantId, actorId, action: 'DOCUMENT_ARCHIVED', entityType: 'Document', entityId: id, before: before as JsonValue, after: doc as JsonValue });
    return this.get(tenantId, id, scope);
  }

  async addRelation(tenantId: string, actorId: string, documentId: string, dto: DocumentRelationDto) {
    const relation = await this.repo.db.single<any>(this.repo.relations().upsert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      document_id: documentId,
      related_module: dto.relatedModule,
      related_record_id: dto.relatedRecordId,
      equipment_id: dto.equipmentId ?? (dto.relatedModule === 'equipment' ? dto.relatedRecordId : null),
      relation_type: dto.relationType ?? 'Reference',
      created_by: actorId
    }, { onConflict: 'document_id,related_module,related_record_id,relation_type' }).select().single());
    if (relation.equipment_id) {
      await this.repo.db.single(this.repo.equipmentTimeline().insert({ id: crypto.randomUUID(), tenantId, equipmentId: relation.equipment_id, eventType: 'CONTROLLED_DOCUMENT_LINKED', title: 'Controlled document linked', actorName: actorId, occurredAt: new Date().toISOString(), sourceType: 'Document', sourceId: documentId }).select().single());
    }
    await this.audit.write({ tenantId, actorId, action: 'DOCUMENT_RELATION_LINKED', entityType: 'Document', entityId: documentId, after: relation as JsonValue });
    return relation;
  }

  relations(tenantId: string, documentId: string) {
    return this.repo.db.many(this.repo.relations().select('*').eq('tenant_id', tenantId).eq('document_id', documentId));
  }

  async deleteRelation(tenantId: string, actorId: string, relationId: string) {
    const relation = await this.repo.db.single<any>(this.repo.relations().delete().eq('tenant_id', tenantId).eq('id', relationId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'DOCUMENT_RELATION_DELETED', entityType: 'Document', entityId: relation.document_id, before: relation as JsonValue });
    return { deleted: true };
  }

  async addComment(tenantId: string, actorId: string, documentId: string, dto: DocumentCommentDto) {
    const comment = await this.repo.db.single<any>(this.repo.comments().insert({ id: crypto.randomUUID(), tenant_id: tenantId, document_id: documentId, author_id: actorId, body: dto.body, updated_at: new Date().toISOString() }).select().single());
    await this.audit.write({ tenantId, actorId, action: 'DOCUMENT_COMMENT_ADDED', entityType: 'Document', entityId: documentId, after: comment as JsonValue });
    return comment;
  }

  async updateComment(tenantId: string, actorId: string, commentId: string, dto: DocumentCommentDto) {
    const before = await this.repo.db.single<any>(this.repo.comments().select('*').eq('tenant_id', tenantId).eq('id', commentId).maybeSingle());
    if (!before) throw new NotFoundException('Comment not found');
    if (before.author_id !== actorId) throw new ForbiddenException('Only the author can edit this comment');
    return this.repo.db.single(this.repo.comments().update({ body: dto.body, edited_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', commentId).select().single());
  }

  async deleteComment(tenantId: string, actorId: string, commentId: string) {
    const comment = await this.repo.db.single<any>(this.repo.comments().select('*').eq('tenant_id', tenantId).eq('id', commentId).maybeSingle());
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.author_id !== actorId) throw new ForbiddenException('Only the author can delete this comment');
    await this.repo.db.single(this.repo.comments().delete().eq('id', commentId).select().single());
    return { deleted: true };
  }

  async file(tenantId: string, actorId: string, documentId: string, action: 'preview' | 'download', scope: Scope) {
    const doc = await this.get(tenantId, documentId, scope);
    const version = doc.current_version;
    if (!version) throw new NotFoundException('Document has no current version');
    await this.access(tenantId, documentId, actorId, action);
    await this.audit.write({ tenantId, actorId, action: action === 'download' ? 'DOCUMENT_DOWNLOADED' : 'DOCUMENT_PREVIEWED', entityType: 'Document', entityId: documentId });
    return { buffer: await this.read(version.file_url), fileName: version.file_name, mimeType: version.file_type };
  }

  accessLog(tenantId: string, documentId: string) {
    return this.repo.db.many(this.repo.accessLogs().select('*').eq('tenant_id', tenantId).eq('document_id', documentId).order('created_at', { ascending: false }));
  }

  reviewDue(tenantId: string, days = 90) {
    return this.repo.db.many(this.repo.reviews().select('*, document:documents(*)').eq('tenant_id', tenantId).lte('next_review_date', new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)).order('next_review_date'));
  }

  overdueReviews(tenantId: string) {
    return this.repo.db.many(this.repo.reviews().select('*, document:documents(*)').eq('tenant_id', tenantId).lt('next_review_date', new Date().toISOString().slice(0, 10)).order('next_review_date'));
  }

  folders(tenantId: string) {
    return this.repo.db.many(this.repo.folders().select('*').eq('tenant_id', tenantId).order('path'));
  }

  async listForEntity(tenantId: string, entityType: string, entityId: string, allowedSiteIds: string[] = [], selectedSiteId?: string | null) {
    const filter: DocumentFilterDto = {};
    if (entityType.toLowerCase() === 'equipment') filter.equipmentId = entityId;
    return this.list(tenantId, filter, { allowedSiteIds, selectedSiteId: selectedSiteId ?? null });
  }

  private async transition(tenantId: string, actorId: string, id: string, status: string, action: string, scope: Scope) {
    const before = await this.get(tenantId, id, scope);
    const doc = await this.repo.db.single<any>(this.repo.documents().update({ status, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.audit.write({ tenantId, actorId, action, entityType: 'Document', entityId: id, before: before as JsonValue, after: doc as JsonValue });
    await this.indexDocument(tenantId, id);
    return this.get(tenantId, id, scope);
  }

  private async decision(tenantId: string, actorId: string, documentId: string, decision: string, comment: string | null, scope: Scope) {
    await this.get(tenantId, documentId, scope);
    return this.repo.db.single(this.repo.approvals().insert({ id: crypto.randomUUID(), tenant_id: tenantId, document_id: documentId, approver_id: actorId, decision, comment }).select().single());
  }

  private async createVersionRow(tenantId: string, documentId: string, versionNumber: string, file: UploadedFile, storageKey: string, actorId: string, changeSummary: string, isCurrent: boolean) {
    return this.repo.db.single<any>(this.repo.versions().insert({ id: crypto.randomUUID(), tenant_id: tenantId, document_id: documentId, version_number: versionNumber, file_name: file.originalname, file_url: storageKey, file_type: file.mimetype || 'application/octet-stream', file_size: file.size, uploaded_by: actorId, change_summary: changeSummary, is_current: isCurrent }).select().single());
  }

  private async replaceTags(tenantId: string, documentId: string, tags?: string) {
    if (!tags) return [];
    const rows = tags.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => ({ id: crypto.randomUUID(), tenant_id: tenantId, document_id: documentId, tag }));
    return rows.length ? this.repo.db.many(this.repo.tags().insert(rows).select()) : [];
  }

  private async nextDocumentNumber(tenantId: string, siteId: string, type: string) {
    const year = new Date().getFullYear();
    const prefix = `${this.prefixForType(type)}-${year}-`;
    const rows = await this.repo.db.many<any>(this.repo.documents().select('document_number').eq('tenant_id', tenantId).eq('site_id', siteId).like('document_number', `${prefix}%`).order('document_number', { ascending: false }).limit(1));
    const last = rows[0]?.document_number ? Number(String(rows[0].document_number).split('-').pop()) : 0;
    return `${prefix}${String(last + 1).padStart(6, '0')}`;
  }

  private prefixForType(type: string) {
    const normalized = type.toLowerCase();
    if (normalized.includes('p&id') || normalized.includes('pid')) return 'PID';
    if (normalized.includes('sop')) return 'SOP';
    if (normalized.includes('cert')) return 'CERT';
    return 'DOC';
  }

  private nextVersion(versions: any[]) {
    const current = versions.map((version) => Number(String(version.version_number).replace(/^v/, '').split('.')[0])).filter(Boolean).sort((a, b) => b - a)[0] ?? 1;
    return `v${current + 1}.0`;
  }

  private addMonths(date: Date, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  }

  private async persist(storageKey: string, buffer: Buffer) {
    const full = path.join(process.cwd(), '.uploads', storageKey);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, buffer);
  }

  private read(storageKey: string) {
    return readFile(path.join(process.cwd(), '.uploads', storageKey));
  }

  private access(tenantId: string, documentId: string, actorId: string, action: string) {
    return this.repo.db.single(this.repo.accessLogs().insert({ id: crypto.randomUUID(), tenant_id: tenantId, document_id: documentId, user_id: actorId, action }).select().single());
  }

  private async indexDocument(tenantId: string, documentId: string) {
    const doc = await this.repo.db.single<any>(this.repo.documents().select('*, current_version:document_versions!documents_current_version_fkey(*), tags:document_tags(*)').eq('tenant_id', tenantId).eq('id', documentId).maybeSingle());
    if (!doc) return;
    await this.searchIndex.indexRecord(tenantId, { module: 'documents', recordType: 'Document', recordId: doc.id, recordNumber: doc.document_number, title: doc.title, subtitle: `${doc.document_type} / ${doc.status}`, description: doc.description, status: doc.status, siteId: doc.site_id, url: `/documents/${doc.id}`, searchableText: [doc.document_number, doc.title, doc.description, doc.document_type, ...(doc.tags ?? []).map((tag: any) => tag.tag)].filter(Boolean).join(' ') });
  }

  private assertSiteAccess(siteId: string | null | undefined, scope: Scope) {
    if (!siteId || scope.corporateView) return;
    if (scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('Document is outside your site access scope');
  }
}
