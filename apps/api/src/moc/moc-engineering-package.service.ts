import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MocEngineeringRequirementService } from './moc-engineering-requirement.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type UploadedMocFile = { originalname: string; mimetype: string; size: number; buffer: Buffer };

@Injectable()
export class MocEngineeringPackageService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly requirements: MocEngineeringRequirementService
  ) {}

  async getPackage(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const pkg = await this.ensurePackage(tenantId, moc, moc.created_by ?? moc.originator_id);
    const [documents, requirements, reviews] = await Promise.all([
      this.documents(tenantId, id),
      this.requirements.generate(tenantId, moc),
      this.db.many<any>(this.db.from('moc_engineering_reviews').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at', { ascending: false }))
    ]);
    const summary = this.summary(pkg, documents, requirements);
    const updated = await this.updatePackageSummary(tenantId, pkg.id, summary);
    return { package: updated, summary, requirements: this.requirementStatus(requirements, documents), documents, reviews, readOnly: this.readOnly(moc, updated) };
  }

  async updatePackage(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const pkg = await this.ensurePackage(tenantId, moc, actorId);
    this.assertEditable(moc, pkg);
    const row = await this.db.single<any>(this.db.from('moc_engineering_packages').update({ status: dto.status ?? pkg.status, readiness_status: dto.readinessStatus ?? dto.readiness_status, review_comments: dto.reviewComments ?? dto.review_comments ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', pkg.id).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_ENGINEERING_PACKAGE_UPDATED', 'Engineering package updated', pkg, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_ENGINEERING_PACKAGE_UPDATED', entityType: 'MOC', entityId: id, before: pkg as JsonValue, after: row as JsonValue });
    return this.getPackage(tenantId, id, scope);
  }

  summaryOnly(tenantId: string, id: string, scope: Scope) {
    return this.getPackage(tenantId, id, scope).then((result) => result.summary);
  }

  requirementsFor(tenantId: string, id: string, scope: Scope) {
    return this.getPackage(tenantId, id, scope).then((result) => result.requirements);
  }

  async regenerateRequirements(tenantId: string, actorId: string, id: string, scope: Scope) {
    const result = await this.getPackage(tenantId, id, scope);
    await this.history(tenantId, await this.getMoc(tenantId, id, scope), actorId, 'MOC_ENGINEERING_REQUIREMENTS_REGENERATED', 'Engineering document requirements regenerated', null, result.requirements);
    return result.requirements;
  }

  async uploadDocument(tenantId: string, actorId: string, id: string, dto: Record<string, any>, file: UploadedMocFile | undefined, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const pkg = await this.ensurePackage(tenantId, moc, actorId);
    this.assertEditable(moc, pkg);
    const fileName = file?.originalname ?? dto.fileName;
    if (!fileName && !dto.controlledDocumentId && !dto.documentId) throw new BadRequestException('Engineering document file or controlled document link is required');
    const storageKey = dto.storageKey ?? `moc/${moc.company_id}/${moc.site_id}/${id}/engineering/${crypto.randomUUID()}-${String(fileName ?? dto.title).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const row = await this.db.single<any>(this.db.from('moc_engineering_documents').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: moc.company_id,
      site_id: moc.site_id,
      moc_id: id,
      package_id: pkg.id,
      document_type: dto.documentType ?? 'Other engineering evidence',
      title: dto.title ?? fileName ?? 'Engineering document',
      description: dto.description ?? dto.justification ?? null,
      file_name: fileName ?? dto.fileName ?? null,
      file_key: storageKey,
      storage_key: storageKey,
      file_url: dto.fileUrl ?? null,
      mime_type: file?.mimetype ?? dto.mimeType ?? 'application/octet-stream',
      file_size: file?.size ?? Number(dto.fileSize ?? dto.sizeBytes ?? 0),
      size_bytes: file?.size ?? Number(dto.fileSize ?? dto.sizeBytes ?? 0),
      controlled_document_id: dto.controlledDocumentId ?? dto.documentId ?? null,
      controlled_document_version_id: dto.controlledDocumentVersionId ?? null,
      document_id: dto.documentId ?? dto.controlledDocumentId ?? null,
      version: dto.version ?? dto.versionLabel ?? null,
      status: dto.status ?? 'Uploaded',
      is_required: dto.isRequired === 'true' || dto.isRequired === true,
      required_before_approval: dto.requiredBeforeApproval === 'true' || dto.requiredBeforeApproval === true,
      required_before_startup: dto.requiredBeforeStartup === 'true' || dto.requiredBeforeStartup === true,
      required_before_closure: dto.requiredBeforeClosure === undefined ? true : dto.requiredBeforeClosure === 'true' || dto.requiredBeforeClosure === true,
      review_owner_id: dto.reviewOwnerId ?? null,
      review_due_date: dto.reviewDueDate || null,
      uploaded_by: actorId,
      created_by: actorId
    }).select().single());
    await this.syncPackage(tenantId, id, scope);
    await this.history(tenantId, moc, actorId, 'MOC_ENGINEERING_DOCUMENT_UPLOADED', `${row.title} uploaded`, null, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_ENGINEERING_DOCUMENT_UPLOADED', entityType: 'MOC', entityId: id, after: row as JsonValue });
    await this.notifications.notifyUser({ tenantId, userId: moc.originator_id ?? actorId, companyId: moc.company_id, siteId: moc.site_id, type: 'moc.engineering.document_uploaded', module: 'moc', title: `${moc.moc_number} engineering document uploaded`, message: row.title, relatedRecordId: id, relatedRecordType: 'MOC', relatedUrl: `/moc/${id}`, priority: 'Normal' }).catch(() => null);
    return row;
  }

  async linkDocumentControl(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    return this.uploadDocument(tenantId, actorId, id, { ...dto, status: dto.status ?? 'Linked', controlledDocumentId: dto.documentId ?? dto.controlledDocumentId, fileName: dto.fileName ?? dto.title ?? 'Controlled document' }, undefined, scope);
  }

  async unlinkDocumentControl(tenantId: string, actorId: string, id: string, documentId: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.getDocument(tenantId, id, documentId, scope);
    const row = await this.db.single<any>(this.db.from('moc_engineering_documents').update({ controlled_document_id: null, controlled_document_version_id: null, document_id: null, controlled_document_status: 'Unlinked', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', documentId).select().single());
    await this.history(tenantId, moc, actorId, 'MOC_ENGINEERING_DOCUMENT_UNLINKED', `${row.title} unlinked`, before, row);
    return row;
  }

  async getDocument(tenantId: string, id: string, documentId: string, scope: Scope) {
    await this.getMoc(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_engineering_documents').select('*').eq('tenant_id', tenantId).eq('moc_id', id).eq('id', documentId).is('deleted_at', null).maybeSingle());
    if (!row) throw new NotFoundException('Engineering document not found');
    return row;
  }

  downloadDocument(tenantId: string, id: string, documentId: string, scope: Scope) {
    return this.getDocument(tenantId, id, documentId, scope).then((doc) => ({ fileName: doc.file_name ?? doc.title, mimeType: doc.mime_type ?? 'application/octet-stream', storageKey: doc.file_key ?? doc.storage_key, url: doc.file_url ?? null, document: doc }));
  }

  previewDocument(tenantId: string, id: string, documentId: string, scope: Scope) {
    return this.getDocument(tenantId, id, documentId, scope).then((doc) => ({ title: doc.title, mimeType: doc.mime_type, previewAvailable: Boolean(doc.file_url || doc.file_key || doc.storage_key || doc.controlled_document_id), url: doc.file_url ?? null, document: doc }));
  }

  async deleteDocument(tenantId: string, actorId: string, id: string, documentId: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.getDocument(tenantId, id, documentId, scope);
    const row = await this.db.single<any>(this.db.from('moc_engineering_documents').update({ status: 'Deleted', deleted_by: actorId, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', documentId).select().single());
    await this.syncPackage(tenantId, id, scope);
    await this.history(tenantId, moc, actorId, 'MOC_ENGINEERING_DOCUMENT_DELETED', `${row.title} deleted`, before, row);
    await this.audit.write({ tenantId, actorId, action: 'MOC_ENGINEERING_DOCUMENT_DELETED', entityType: 'MOC', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return { deleted: true, id: documentId };
  }

  async submitReview(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const pkg = await this.ensurePackage(tenantId, moc, actorId);
    const row = await this.db.single<any>(this.db.from('moc_engineering_packages').update({ status: 'Needs Review', reviewed_by: actorId, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', pkg.id).select().single());
    await this.reviewRow(tenantId, moc, row, actorId, 'Needs Review', null, 'Submitted for review');
    return this.getPackage(tenantId, id, scope);
  }

  async approve(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const pkg = await this.ensurePackage(tenantId, moc, actorId);
    const current = await this.getPackage(tenantId, id, scope);
    if (current.summary.missingRequiredDocumentsCount > 0 && !dto.overrideJustification) throw new BadRequestException('Missing required engineering documents require override justification before approval');
    const row = await this.db.single<any>(this.db.from('moc_engineering_packages').update({ status: 'Approved', readiness_status: 'Ready', approved_by: actorId, approved_at: new Date().toISOString(), review_comments: dto.comments ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', pkg.id).select().single());
    await this.reviewRow(tenantId, moc, row, actorId, 'Approved', dto.comments ?? dto.overrideJustification ?? null, 'Approved');
    await this.notifications.notifyUser({ tenantId, userId: moc.originator_id ?? actorId, companyId: moc.company_id, siteId: moc.site_id, type: 'moc.engineering.package_ready', module: 'moc', title: `${moc.moc_number} engineering package approved`, message: dto.comments ?? 'Engineering package approved.', relatedRecordId: id, relatedRecordType: 'MOC', relatedUrl: `/moc/${id}`, priority: 'Normal' }).catch(() => null);
    return this.getPackage(tenantId, id, scope);
  }

  async reject(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    if (!dto.reason) throw new BadRequestException('Rejection reason is required');
    const moc = await this.getMoc(tenantId, id, scope);
    const pkg = await this.ensurePackage(tenantId, moc, actorId);
    const row = await this.db.single<any>(this.db.from('moc_engineering_packages').update({ status: 'Needs Review', readiness_status: 'Blocked', rejection_reason: dto.reason, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', pkg.id).select().single());
    await this.reviewRow(tenantId, moc, row, actorId, 'Returned', dto.reason, 'Rejected / returned for correction');
    await this.notifications.notifyUser({ tenantId, userId: moc.originator_id ?? actorId, companyId: moc.company_id, siteId: moc.site_id, type: 'moc.engineering.package_rejected', module: 'moc', title: `${moc.moc_number} engineering package returned`, message: dto.reason, relatedRecordId: id, relatedRecordType: 'MOC', relatedUrl: `/moc/${id}`, priority: 'High' }).catch(() => null);
    return this.getPackage(tenantId, id, scope);
  }

  async requestDocument(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const pkg = await this.ensurePackage(tenantId, moc, actorId);
    const row = await this.reviewRow(tenantId, moc, pkg, actorId, 'Document Requested', dto.comments ?? dto.documentType, `Requested ${dto.documentType ?? 'engineering document'}`);
    await this.history(tenantId, moc, actorId, 'MOC_ENGINEERING_DOCUMENT_REQUESTED', row.comments ?? 'Engineering document requested', null, row);
    return row;
  }

  private async syncPackage(tenantId: string, id: string, scope: Scope) {
    const result = await this.getPackage(tenantId, id, scope);
    return result.package;
  }

  private async ensurePackage(tenantId: string, moc: any, actorId?: string | null) {
    const existing = await this.db.single<any>(this.db.from('moc_engineering_packages').select('*').eq('tenant_id', tenantId).eq('moc_id', moc.id).maybeSingle());
    if (existing) return existing;
    return this.db.single<any>(this.db.from('moc_engineering_packages').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, status: 'Not Started', readiness_status: 'Not Ready', created_by: actorId ?? null }).select().single());
  }

  private documents(tenantId: string, mocId: string) {
    return this.db.many<any>(this.db.from('moc_engineering_documents').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId).is('deleted_at', null).order('uploaded_at', { ascending: false }));
  }

  private requirementStatus(requirements: any[], documents: any[]) {
    return requirements.map((requirement) => {
      const matching = documents.filter((doc) => doc.document_type === requirement.documentType && !['Deleted', 'Rejected'].includes(doc.status));
      const approved = matching.some((doc) => ['Approved', 'Linked', 'Uploaded'].includes(doc.status));
      const justified = matching.some((doc) => doc.justification || doc.description);
      return { ...requirement, documents: matching, status: approved || (requirement.allowJustification && justified) ? 'Ready' : requirement.isRequired ? 'Missing' : 'Optional' };
    });
  }

  private summary(pkg: any, documents: any[], requirements: any[]) {
    const checklist = this.requirementStatus(requirements, documents);
    const required = checklist.filter((item) => item.isRequired);
    const missing = required.filter((item) => item.status === 'Missing');
    const approvedDocuments = documents.filter((doc) => doc.status === 'Approved').length;
    const pendingReview = documents.filter((doc) => ['Uploaded', 'Needs Review', 'Linked'].includes(doc.status)).length;
    const readinessStatus = missing.some((item) => item.requiredBeforeStartup) ? 'Blocked' : missing.length ? 'Not Ready' : 'Ready';
    const status = missing.length ? 'Missing Required Documents' : approvedDocuments || documents.length ? 'Complete' : pkg.status;
    return {
      status,
      readinessStatus,
      totalEngineeringDocuments: documents.length,
      requiredDocumentsCount: required.length,
      missingRequiredDocumentsCount: missing.length,
      linkedDocumentControlDocumentsCount: documents.filter((doc) => doc.controlled_document_id || doc.document_id).length,
      uploadedFilesCount: documents.filter((doc) => doc.file_key || doc.storage_key || doc.file_name).length,
      documentsPendingReview: pendingReview,
      documentsApproved: approvedDocuments,
      lastUpdatedBy: pkg.approved_by ?? pkg.reviewed_by ?? pkg.created_by,
      lastUpdatedAt: pkg.updated_at,
      engineeringReadiness: readinessStatus
    };
  }

  private async updatePackageSummary(tenantId: string, packageId: string, summary: any) {
    return this.db.single<any>(this.db.from('moc_engineering_packages').update({ status: summary.status, readiness_status: summary.readinessStatus, required_documents_count: summary.requiredDocumentsCount, missing_required_documents_count: summary.missingRequiredDocumentsCount, approved_documents_count: summary.documentsApproved, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', packageId).select().single());
  }

  private async reviewRow(tenantId: string, moc: any, pkg: any, actorId: string, status: string, comments: string | null, decision: string) {
    const row = await this.db.single<any>(this.db.from('moc_engineering_reviews').insert({ id: crypto.randomUUID(), tenant_id: tenantId, moc_id: moc.id, package_id: pkg.id, company_id: moc.company_id, site_id: moc.site_id, review_status: status, reviewer_id: actorId, comments, decision }).select().single());
    await this.history(tenantId, moc, actorId, `MOC_ENGINEERING_${decision.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`, comments ?? decision, null, row);
    await this.audit.write({ tenantId, actorId, action: `MOC_ENGINEERING_${decision.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`, entityType: 'MOC', entityId: moc.id, after: row as JsonValue });
    return row;
  }

  private async getMoc(tenantId: string, id: string, scope: Scope) {
    const moc = await this.db.single<any>(this.db.from('mocs').select('*, impact:moc_impact_assessments(*), risk:moc_risk_assessments(*)').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!moc) throw new NotFoundException('MOC not found');
    if (moc.site_id && !scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(moc.site_id)) throw new BadRequestException('MOC is outside your site access scope');
    return moc;
  }

  private readOnly(moc: any, pkg: any) {
    return ['Closed', 'Cancelled'].includes(moc.status) || pkg.status === 'Approved';
  }

  private assertEditable(moc: any, pkg: any) {
    if (['Closed', 'Cancelled'].includes(moc.status)) throw new BadRequestException('Closed or cancelled MOCs cannot be edited');
    if (pkg.status === 'Approved') throw new BadRequestException('Approved engineering package is locked unless the MOC is returned for revision');
  }

  private history(tenantId: string, moc: any, actorId: string, eventType: string, title: string, before: unknown, after: unknown) {
    return this.db.single(this.db.from('moc_history_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, event_type: eventType, title, actor_id: actorId, before_value: before ?? null, after_value: after ?? null, related_record_type: 'MOC Engineering', related_record_id: moc.id, related_url: `/moc/${moc.id}` }).select().single()).catch(() => null);
  }
}
