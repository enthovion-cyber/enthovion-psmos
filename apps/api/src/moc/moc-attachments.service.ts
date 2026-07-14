import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type UploadedFile = { originalname: string; mimetype: string; size: number; buffer: Buffer };

const allowedMime = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'text/plain'];

@Injectable()
export class MocAttachmentsService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async list(tenantId: string, id: string, scope: Scope) {
    await this.getMoc(tenantId, id, scope);
    return this.db.many<any>(this.db.from('moc_attachments').select('*').eq('tenant_id', tenantId).eq('moc_id', id).is('deleted_at', null).order('uploaded_at', { ascending: false }));
  }

  async summary(tenantId: string, id: string, scope: Scope) {
    const rows = await this.list(tenantId, id, scope);
    const byType = rows.reduce((acc: Record<string, number>, item) => {
      acc[item.attachment_type] = (acc[item.attachment_type] ?? 0) + 1;
      return acc;
    }, {});
    return { total: rows.length, linkedDocuments: rows.filter((r) => r.document_id).length, totalSize: rows.reduce((sum, item) => sum + Number(item.file_size ?? item.size_bytes ?? 0), 0), byType, latestUpload: rows[0]?.uploaded_at ?? null };
  }

  async upload(tenantId: string, actorId: string, id: string, dto: Record<string, string>, file: UploadedFile | undefined, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const fileName = file?.originalname ?? dto.fileName;
    if (!fileName) throw new BadRequestException('Attachment file is required');
    const mimeType = file?.mimetype ?? dto.mimeType ?? 'application/octet-stream';
    if (!allowedMime.includes(mimeType)) throw new BadRequestException('Unsafe or unsupported attachment file type');
    const key = dto.fileKey ?? `moc/${moc.company_id}/${moc.site_id}/${id}/${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const row = await this.db.single<any>(this.db.from('moc_attachments').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: id, attachment_type: dto.attachmentType ?? 'Other', title: dto.title ?? fileName, file_name: fileName, file_key: key, storage_key: key, file_url: dto.fileUrl ?? null, mime_type: mimeType, file_size: file?.size ?? Number(dto.fileSize ?? dto.sizeBytes ?? 0), size_bytes: file?.size ?? Number(dto.fileSize ?? dto.sizeBytes ?? 0), description: dto.description ?? null, related_section: dto.relatedSection ?? null, related_record_type: dto.relatedRecordType ?? null, related_record_id: dto.relatedRecordId ?? null, document_id: dto.documentId ?? null, document_version_id: dto.documentVersionId ?? null, uploaded_by: actorId, created_by: actorId }).select().single());
    await this.history(tenantId, moc, actorId, 'Attachments', 'MOC_ATTACHMENT_UPLOADED', `${row.file_name} uploaded`, null, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_ATTACHMENT_UPLOADED', entityType: 'MOC', entityId: id, after: row as JsonValue });
    return row;
  }

  async get(tenantId: string, id: string, attachmentId: string, scope: Scope) {
    await this.getMoc(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_attachments').select('*').eq('tenant_id', tenantId).eq('moc_id', id).eq('id', attachmentId).maybeSingle());
    if (!row || row.deleted_at) throw new NotFoundException('Attachment not found');
    return row;
  }

  async remove(tenantId: string, actorId: string, id: string, attachmentId: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.get(tenantId, id, attachmentId, scope);
    const row = await this.db.single<any>(this.db.from('moc_attachments').update({ deleted_by: actorId, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', attachmentId).select().single());
    await this.history(tenantId, moc, actorId, 'Attachments', 'MOC_ATTACHMENT_DELETED', `${before.file_name} deleted`, before, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_ATTACHMENT_DELETED', entityType: 'MOC', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return { deleted: true, id: attachmentId };
  }

  async preview(tenantId: string, id: string, attachmentId: string, scope: Scope) {
    const row = await this.get(tenantId, id, attachmentId, scope);
    return { id: row.id, fileName: row.file_name, mimeType: row.mime_type, fileUrl: row.file_url, fileKey: row.file_key ?? row.storage_key, previewable: String(row.mime_type).startsWith('image/') || row.mime_type === 'application/pdf' || row.mime_type === 'text/plain' };
  }

  async download(tenantId: string, actorId: string, id: string, attachmentId: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const row = await this.get(tenantId, id, attachmentId, scope);
    await this.history(tenantId, moc, actorId, 'Attachments', 'MOC_ATTACHMENT_DOWNLOADED', `${row.file_name} downloaded`, null, { id: row.id });
    return { fileName: row.file_name, mimeType: row.mime_type, fileUrl: row.file_url, fileKey: row.file_key ?? row.storage_key };
  }

  async linkDocument(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_attachments').update({ document_id: dto.documentId, document_version_id: dto.documentVersionId ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('moc_id', id).eq('id', dto.attachmentId).select().single());
    await this.history(tenantId, moc, actorId, 'Attachments', 'MOC_ATTACHMENT_LINKED_DOCUMENT', 'Attachment linked to Document Control', null, row);
    return row;
  }

  async unlinkDocument(tenantId: string, actorId: string, id: string, documentId: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const rows = await this.db.many<any>(this.db.from('moc_attachments').update({ document_id: null, document_version_id: null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('moc_id', id).eq('document_id', documentId).select());
    await this.history(tenantId, moc, actorId, 'Attachments', 'MOC_ATTACHMENT_UNLINKED_DOCUMENT', 'Attachment unlinked from Document Control', null, rows);
    return rows;
  }

  private async getMoc(tenantId: string, id: string, scope: Scope) {
    const moc = await this.db.single<any>(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!moc) throw new NotFoundException('MOC not found');
    if (scope.selectedSiteId && moc.site_id !== scope.selectedSiteId) throw new NotFoundException('MOC not found for selected site');
    if (!scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(moc.site_id)) throw new NotFoundException('MOC not found for allowed sites');
    return moc;
  }

  private history(tenantId: string, moc: any, actorId: string, category: string, eventType: string, title: string, before: unknown, after: unknown) {
    return this.db.single(this.db.from('moc_history_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, event_category: category, event_type: eventType, title, event_title: title, actor_id: actorId, user_id: actorId, before_value: before ?? null, after_value: after ?? null, is_safety_critical: ['High', 'Critical'].includes(moc.risk_level) }).select().single());
  }
}
