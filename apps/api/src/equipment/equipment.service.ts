import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { JsonValue } from '../common/types/db.types';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../database/supabase.service';
import { EventTypes } from '../events/event-types';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchIndexService } from '../search/search-index.service';
import { BulkImportDto } from './dto/bulk-import.dto';
import { CreateEquipmentInspectionDto } from './dto/create-equipment-inspection.dto';
import { CreateEquipmentNoteDto } from './dto/create-equipment-note.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { EquipmentFilterDto } from './dto/equipment-filter.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentInspectionDto } from './dto/update-equipment-inspection.dto';
import { UpdateEquipmentNoteDto } from './dto/update-equipment-note.dto';
import { UploadEquipmentAttachmentDto } from './dto/upload-equipment-attachment.dto';
import { UploadEquipmentDocumentDto } from './dto/upload-equipment-document.dto';
import { EquipmentRepository } from './repositories/equipment.repository';
import { EquipmentTagValidator } from './validators/equipment-tag.validator';

type UploadedEquipmentFile = { originalname: string; mimetype: string; size: number; buffer: Buffer };

@Injectable()
export class EquipmentService {
  constructor(
    private readonly repository: EquipmentRepository,
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
    private readonly notifications: NotificationsService,
    private readonly tagValidator: EquipmentTagValidator,
    private readonly searchIndex: SearchIndexService
  ) {}

  list(tenantId: string, filter: EquipmentFilterDto) {
    return this.repository.findMany(tenantId, filter);
  }

  async get(tenantId: string, id: string, allowedSiteIds: string[] = []) {
    const equipment = await this.repository.findById(tenantId, id);
    if (!equipment) throw new NotFoundException('Equipment not found');
    this.assertSiteAccess(equipment.siteId, allowedSiteIds);
    return equipment;
  }

  async create(tenantId: string, actorId: string, dto: CreateEquipmentDto) {
    const tag = dto.tag.trim().toUpperCase();
    this.tagValidator.assertValid(tag);
    const equipment = await this.repository.create({
      ...this.toCreateInput(tenantId, tag, dto),
      qrCodePayload: this.buildQrPayload(tenantId, tag)
    });
    await this.indexEquipment(equipment);
    await this.audit.write({
      tenantId,
      actorId,
      action: 'EQUIPMENT_CREATED',
      entityType: 'Equipment',
      entityId: equipment.id,
      after: equipment as JsonValue
    });
    this.events.emit(EventTypes.EquipmentCreated, {
      type: 'equipment.created',
      tenantId,
      actorId,
      occurredAt: new Date().toISOString(),
      payload: { equipmentId: equipment.id, tag: equipment.tag }
    });
    if (equipment.safetyCritical) {
      await this.notifyEquipment(tenantId, actorId, equipment, 'equipment.safety_critical.changed', 'Safety-critical equipment created', `${equipment.tag} was created as safety-critical equipment.`, 'Safety-Critical');
    }
    await this.addTimelineEvent(tenantId, equipment.id, 'EQUIPMENT_CREATED', 'Equipment created', actorId, 'Equipment', equipment.id);
    return equipment;
  }

  async update(tenantId: string, actorId: string, id: string, dto: UpdateEquipmentDto, allowedSiteIds: string[] = []) {
    const before = await this.get(tenantId, id, allowedSiteIds);
    const data = this.toUpdateInput(dto);
    if (dto.tag) {
      const tag = dto.tag.trim().toUpperCase();
      this.tagValidator.assertValid(tag);
      data.tag = tag;
      data.qrCodePayload = this.buildQrPayload(tenantId, tag);
    }
    if (dto.commissionDate) data.commissionDate = new Date(dto.commissionDate);
    const equipment = await this.repository.update(tenantId, id, data);
    await this.indexEquipment(equipment);
    await this.audit.write({
      tenantId,
      actorId,
      action: 'EQUIPMENT_UPDATED',
      entityType: 'Equipment',
      entityId: equipment.id,
      before: before as JsonValue,
      after: equipment as JsonValue
    });
    if (equipment.safetyCritical || before.safetyCritical !== equipment.safetyCritical || before.criticality !== equipment.criticality) {
      await this.notifyEquipment(tenantId, actorId, equipment, 'equipment.safety_critical.changed', 'Safety-critical equipment changed', `${equipment.tag} safety or criticality data was updated.`, equipment.safetyCritical ? 'Safety-Critical' : 'High');
    }
    await this.addTimelineEvent(tenantId, equipment.id, 'EQUIPMENT_UPDATED', 'Equipment edited', actorId, 'Equipment', equipment.id);
    return equipment;
  }

  async createChild(tenantId: string, actorId: string, parentId: string, dto: CreateEquipmentDto, allowedSiteIds: string[] = []) {
    const parent = await this.get(tenantId, parentId, allowedSiteIds);
    const child = await this.create(tenantId, actorId, { ...dto, parentId });
    const existingRelationship = await this.db.single<any>(
      this.db.from('EquipmentRelationship')
        .select('*')
        .eq('tenantId', tenantId)
        .eq('fromEquipmentId', parent.id)
        .eq('toEquipmentId', child.id)
        .eq('type', 'PARENT_CHILD')
        .maybeSingle()
    );
    if (!existingRelationship) {
      await this.db.single(this.db.from('EquipmentRelationship').insert({
        id: crypto.randomUUID(),
        tenantId,
        fromEquipmentId: parent.id,
        toEquipmentId: child.id,
        type: 'PARENT_CHILD',
        description: `${child.tag} child equipment for ${parent.tag}`
      }).select().single());
    }
    await this.addTimelineEvent(tenantId, parent.id, 'CHILD_EQUIPMENT_ADDED', `Child equipment added: ${child.tag}`, actorId, 'Equipment', child.id);
    await this.audit.write({ tenantId, actorId, action: 'EQUIPMENT_CHILD_CREATED', entityType: 'Equipment', entityId: parent.id, after: child as JsonValue });
    return child;
  }

  async bulkImport(tenantId: string, actorId: string, dto: BulkImportDto) {
    const created = [];
    for (const row of dto.rows) {
      created.push(await this.create(tenantId, actorId, row));
    }
    return { count: created.length, equipment: created };
  }

  async uploadDocument(
    tenantId: string,
    actorId: string,
    equipmentId: string,
    dto: UploadEquipmentDocumentDto,
    file?: UploadedEquipmentFile
  ) {
    const equipment = await this.get(tenantId, equipmentId);
    const fileName = file?.originalname ?? dto.fileName;
    if (!fileName) throw new BadRequestException('Uploaded document file is required');
    const mimeType = file?.mimetype ?? dto.mimeType ?? 'application/octet-stream';
    const sizeBytes = file?.size ?? dto.sizeBytes ?? 0;
    const input: {
      title: string;
      documentType: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      documentNo?: string;
      storageKey?: string;
      buffer?: Buffer;
    } = {
      title: dto.title,
      documentType: dto.documentType,
      fileName,
      mimeType,
      sizeBytes
    };
    if (dto.documentNo) input.documentNo = dto.documentNo;
    if (dto.storageKey) input.storageKey = dto.storageKey;
    if (file?.buffer) input.buffer = file.buffer;
    const document = await this.createControlledEquipmentDocument(tenantId, actorId, equipment, input);
    await this.notifyEquipment(tenantId, actorId, equipment, 'equipment.document.linked', 'Equipment document linked', `${document.title} linked to ${equipment.tag}.`, 'Normal');
    return document;
  }

  async documents(tenantId: string, equipmentId: string, allowedSiteIds: string[] = []) {
    await this.get(tenantId, equipmentId, allowedSiteIds);
    const [controlled, legacy] = await Promise.all([
      this.controlledDocuments(tenantId, equipmentId),
      this.repository.documents(tenantId, equipmentId)
    ]);
    return [...controlled, ...legacy];
  }

  async replaceDocument(tenantId: string, actorId: string, equipmentId: string, documentId: string, dto: UploadEquipmentDocumentDto, file?: UploadedEquipmentFile) {
    const equipment = await this.get(tenantId, equipmentId);
    const controlled = await this.controlledDocumentByIdForEquipment(tenantId, equipmentId, documentId);
    if (controlled) {
      const fileName = file?.originalname ?? dto.fileName ?? controlled.current_version?.file_name;
      if (!fileName) throw new BadRequestException('Replacement document file is required');
      const mimeType = file?.mimetype ?? dto.mimeType ?? controlled.current_version?.file_type ?? 'application/octet-stream';
      const sizeBytes = file?.size ?? dto.sizeBytes ?? controlled.current_version?.file_size ?? 0;
      const storageKey = dto.storageKey ?? `documents/${tenantId}/${documentId}/${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      if (file?.buffer) await this.persistControlledFile(storageKey, file.buffer);
      await this.db.many(this.db.from('document_versions').update({ is_current: false }).eq('document_id', documentId).select());
      const version = await this.db.single<any>(this.db.from('document_versions').insert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        document_id: documentId,
        version_number: this.nextControlledVersion(controlled.versions ?? []),
        file_name: fileName,
        file_url: storageKey,
        file_type: mimeType,
        file_size: sizeBytes,
        uploaded_by: actorId,
        change_summary: dto.title ? `Replacement upload: ${dto.title}` : 'Replacement upload from Equipment Registry',
        is_current: true
      }).select().single());
      const updated = await this.db.single<any>(this.db.from('documents').update({
        title: dto.title ?? controlled.title,
        document_type: dto.documentType ?? controlled.document_type,
        current_version_id: version.id,
        status: controlled.status === 'Active' ? 'Approved' : controlled.status,
        updated_at: new Date().toISOString()
      }).eq('tenant_id', tenantId).eq('id', documentId).select('*, current_version:document_versions!documents_current_version_fkey(*)').single());
      await this.addTimelineEvent(tenantId, equipmentId, 'DOCUMENT_REPLACED', `Document replaced: ${updated.title}`, actorId, 'Document', documentId);
      await this.audit.write({ tenantId, actorId, action: 'DOCUMENT_VERSION_UPLOADED', entityType: 'Document', entityId: documentId, before: controlled as JsonValue, after: updated as JsonValue });
      return this.mapControlledDocument(updated);
    }
    const before = await this.findRequired('EquipmentDocument', tenantId, documentId, { equipmentId });
    const fileName = file?.originalname ?? dto.fileName ?? before.fileName;
    const mimeType = file?.mimetype ?? dto.mimeType ?? before.mimeType;
    const sizeBytes = file?.size ?? dto.sizeBytes ?? before.sizeBytes;
    const storageKey = dto.storageKey ?? (file ? `equipment-documents/${tenantId}/${equipmentId}/${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}` : before.storageKey);
    if (file?.buffer) await this.persistUploadedFile(storageKey, file.buffer);
    const document = await this.repository.updateDocument(tenantId, documentId, {
      title: dto.title ?? before.title,
      documentNo: dto.documentNo ?? before.documentNo,
      documentType: dto.documentType ?? before.documentType,
      fileName,
      mimeType,
      sizeBytes,
      storageKey,
      uploadedById: actorId,
      uploadedAt: new Date().toISOString()
    });
    await this.addTimelineEvent(tenantId, equipmentId, 'DOCUMENT_REPLACED', `Document replaced: ${document.title}`, actorId, 'EquipmentDocument', document.id);
    await this.audit.write({ tenantId, actorId, action: 'EQUIPMENT_DOCUMENT_REPLACED', entityType: 'EquipmentDocument', entityId: documentId, before: before as JsonValue, after: document as JsonValue });
    return document;
  }

  async deleteDocument(tenantId: string, actorId: string, equipmentId: string, documentId: string) {
    await this.get(tenantId, equipmentId);
    const controlledRelation = await this.db.single<any>(
      this.db.from('document_relations')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('document_id', documentId)
        .eq('equipment_id', equipmentId)
        .maybeSingle()
    );
    if (controlledRelation) {
      await this.db.single(this.db.from('document_relations').delete().eq('tenant_id', tenantId).eq('id', controlledRelation.id).select().single());
      await this.addTimelineEvent(tenantId, equipmentId, 'CONTROLLED_DOCUMENT_UNLINKED', 'Controlled document unlinked', actorId, 'Document', documentId);
      await this.audit.write({ tenantId, actorId, action: 'DOCUMENT_RELATION_DELETED', entityType: 'Document', entityId: documentId, before: controlledRelation as JsonValue });
      return { id: documentId, deleted: true };
    }
    const document = await this.findRequired('EquipmentDocument', tenantId, documentId, { equipmentId });
    const deleted = await this.repository.deleteDocument(tenantId, documentId);
    await this.removeStoredFile(document.storageKey);
    await this.addTimelineEvent(tenantId, equipmentId, 'DOCUMENT_DELETED', `Document deleted: ${document.title}`, actorId, 'EquipmentDocument', documentId);
    await this.audit.write({ tenantId, actorId, action: 'EQUIPMENT_DOCUMENT_DELETED', entityType: 'EquipmentDocument', entityId: documentId, before: deleted as JsonValue });
    return { id: documentId, deleted: true };
  }

  async documentFile(tenantId: string, equipmentId: string, documentId: string) {
    await this.get(tenantId, equipmentId);
    const controlled = await this.controlledDocumentByIdForEquipment(tenantId, equipmentId, documentId);
    if (controlled) {
      const version = controlled.current_version;
      if (!version) throw new NotFoundException('Controlled document has no current version');
      await this.db.single(this.db.from('document_access_logs').insert({ id: crypto.randomUUID(), tenant_id: tenantId, document_id: documentId, user_id: null, action: 'equipment_preview' }).select().single());
      return { buffer: await this.readControlledFile(version.file_url), fileName: version.file_name, mimeType: version.file_type };
    }
    const document = await this.findRequired('EquipmentDocument', tenantId, documentId, { equipmentId });
    const buffer = await this.readStoredFile(document.storageKey);
    return { buffer, fileName: document.fileName, mimeType: document.mimeType };
  }

  attachments(tenantId: string, equipmentId: string) {
    return this.repository.attachments(tenantId, equipmentId);
  }

  async uploadAttachment(tenantId: string, actorId: string, equipmentId: string, dto: UploadEquipmentAttachmentDto, file?: UploadedEquipmentFile) {
    await this.get(tenantId, equipmentId);
    const fileName = file?.originalname ?? dto.fileName;
    if (!fileName) throw new BadRequestException('Uploaded attachment file is required');
    const mimeType = file?.mimetype ?? dto.mimeType ?? 'application/octet-stream';
    const sizeBytes = file?.size ?? 0;
    const storageKey = dto.storageKey ?? `equipment-attachments/${tenantId}/${equipmentId}/${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    if (file?.buffer) await this.persistUploadedFile(storageKey, file.buffer);
    const attachment = await this.repository.createAttachment({
      tenantId,
      equipmentId,
      inspectionId: dto.inspectionId ?? null,
      title: dto.title,
      attachmentType: dto.attachmentType ?? 'misc',
      fileName,
      mimeType,
      sizeBytes,
      storageKey,
      uploadedById: actorId
    });
    await this.addTimelineEvent(tenantId, equipmentId, 'ATTACHMENT_UPLOADED', `Attachment uploaded: ${attachment.title}`, actorId, 'EquipmentAttachment', attachment.id);
    await this.audit.write({ tenantId, actorId, action: 'EQUIPMENT_ATTACHMENT_UPLOADED', entityType: 'EquipmentAttachment', entityId: attachment.id, after: attachment as JsonValue });
    return attachment;
  }

  async deleteAttachment(tenantId: string, actorId: string, equipmentId: string, attachmentId: string) {
    await this.get(tenantId, equipmentId);
    const attachment = await this.findRequired('EquipmentAttachment', tenantId, attachmentId, { equipmentId });
    await this.repository.deleteAttachment(tenantId, attachmentId);
    await this.removeStoredFile(attachment.storageKey);
    await this.addTimelineEvent(tenantId, equipmentId, 'ATTACHMENT_DELETED', `Attachment deleted: ${attachment.title}`, actorId, 'EquipmentAttachment', attachmentId);
    await this.audit.write({ tenantId, actorId, action: 'EQUIPMENT_ATTACHMENT_DELETED', entityType: 'EquipmentAttachment', entityId: attachmentId, before: attachment as JsonValue });
    return { id: attachmentId, deleted: true };
  }

  async attachmentFile(tenantId: string, equipmentId: string, attachmentId: string) {
    await this.get(tenantId, equipmentId);
    const attachment = await this.findRequired('EquipmentAttachment', tenantId, attachmentId, { equipmentId });
    const buffer = await this.readStoredFile(attachment.storageKey);
    return { buffer, fileName: attachment.fileName, mimeType: attachment.mimeType };
  }

  linkedRecords(tenantId: string, equipmentId: string, moduleKey?: string) {
    return this.repository.linkedRecords(tenantId, equipmentId, moduleKey);
  }

  async actions(tenantId: string, equipmentId: string, allowedSiteIds: string[] = []) {
    await this.get(tenantId, equipmentId, allowedSiteIds);
    return this.repository.actions(tenantId, equipmentId);
  }

  async updateActionStatus(tenantId: string, actorId: string, equipmentId: string, actionId: string, status: string) {
    await this.get(tenantId, equipmentId);
    const allowed = ['OPEN', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'CLOSED', 'CANCELLED'];
    if (!allowed.includes(status)) throw new BadRequestException('Invalid action status');
    const before = await this.findRequired('Action', tenantId, actionId);
    if (before.equipmentId !== equipmentId && !(before.sourceType === 'Equipment' && before.sourceId === equipmentId)) {
      throw new BadRequestException('Action is not linked to this equipment');
    }
    const action = await this.db.single<any>(
      this.db.from('Action')
        .update({ status, closedAt: status === 'CLOSED' ? new Date().toISOString() : null, updatedAt: new Date().toISOString() })
        .eq('tenantId', tenantId)
        .eq('id', actionId)
        .select('*, assignedTo:User!Action_assignedToId_fkey(id, displayName, title, department), createdBy:User!Action_createdById_fkey(id, displayName, title, department), evidence:ActionEvidence(id,status,fileName,mimeType,storageKey,uploadedAt)')
        .single()
    );
    await this.syncActionLinkedRecord(tenantId, equipmentId, action);
    await this.audit.write({
      tenantId,
      actorId,
      action: 'EQUIPMENT_ACTION_STATUS_UPDATED',
      entityType: 'Action',
      entityId: actionId,
      before: before as JsonValue,
      after: action as JsonValue
    });
    await this.addTimelineEvent(tenantId, equipmentId, 'ACTION_STATUS_UPDATED', `Action status updated: ${action.title}`, actorId, 'Action', action.id);
    return action;
  }

  inspectionHistory(tenantId: string, equipmentId: string) {
    return this.repository.inspectionHistory(tenantId, equipmentId);
  }

  async createInspection(tenantId: string, actorId: string, equipmentId: string, dto: CreateEquipmentInspectionDto) {
    await this.get(tenantId, equipmentId);
    const inspection = await this.repository.createInspection(this.toInspectionCreateInput(tenantId, equipmentId, dto));
    await this.addTimelineEvent(tenantId, equipmentId, 'INSPECTION_ADDED', `Inspection added: ${inspection.inspectionType}`, actorId, 'EquipmentInspection', inspection.id);
    await this.audit.write({ tenantId, actorId, action: 'EQUIPMENT_INSPECTION_CREATED', entityType: 'EquipmentInspection', entityId: inspection.id, after: inspection as JsonValue });
    return inspection;
  }

  async updateInspection(tenantId: string, actorId: string, equipmentId: string, inspectionId: string, dto: UpdateEquipmentInspectionDto) {
    await this.get(tenantId, equipmentId);
    const before = await this.findRequired('EquipmentInspection', tenantId, inspectionId, { equipmentId });
    const inspection = await this.repository.updateInspection(tenantId, inspectionId, this.toInspectionUpdateInput(dto));
    await this.addTimelineEvent(tenantId, equipmentId, 'INSPECTION_UPDATED', `Inspection updated: ${inspection.inspectionType}`, actorId, 'EquipmentInspection', inspection.id);
    await this.audit.write({ tenantId, actorId, action: 'EQUIPMENT_INSPECTION_UPDATED', entityType: 'EquipmentInspection', entityId: inspection.id, before: before as JsonValue, after: inspection as JsonValue });
    return inspection;
  }

  async deleteInspection(tenantId: string, actorId: string, equipmentId: string, inspectionId: string) {
    await this.get(tenantId, equipmentId);
    const before = await this.findRequired('EquipmentInspection', tenantId, inspectionId, { equipmentId });
    await this.repository.deleteInspection(tenantId, inspectionId);
    await this.addTimelineEvent(tenantId, equipmentId, 'INSPECTION_DELETED', `Inspection deleted: ${before.inspectionType}`, actorId, 'EquipmentInspection', inspectionId);
    await this.audit.write({ tenantId, actorId, action: 'EQUIPMENT_INSPECTION_DELETED', entityType: 'EquipmentInspection', entityId: inspectionId, before: before as JsonValue });
    return { id: inspectionId, deleted: true };
  }

  timeline(tenantId: string, equipmentId: string) {
    return this.repository.timeline(tenantId, equipmentId);
  }

  async addNote(tenantId: string, actorId: string, equipmentId: string, dto: CreateEquipmentNoteDto) {
    await this.get(tenantId, equipmentId);
    const note = await this.repository.addNote(tenantId, equipmentId, actorId, dto.body);
    await this.db.single(this.db.from('EquipmentTimelineEvent').insert({
        id: crypto.randomUUID(),
        tenantId,
        equipmentId,
        eventType: 'NOTE_ADDED',
        title: 'Equipment note added',
        actorName: actorId,
        occurredAt: new Date().toISOString(),
        sourceType: 'EquipmentNote',
        sourceId: note.id
    }).select().single());
    await this.audit.write({ tenantId, actorId, action: 'EQUIPMENT_NOTE_ADDED', entityType: 'Equipment', entityId: equipmentId, after: note as JsonValue });
    return note;
  }

  async updateNote(tenantId: string, actorId: string, equipmentId: string, noteId: string, dto: UpdateEquipmentNoteDto) {
    await this.get(tenantId, equipmentId);
    const before = await this.findRequired('EquipmentNote', tenantId, noteId, { equipmentId, deletedAt: null });
    const note = await this.repository.updateNote(tenantId, noteId, dto.body);
    await this.audit.write({
      tenantId,
      actorId,
      action: 'EQUIPMENT_NOTE_UPDATED',
      entityType: 'EquipmentNote',
      entityId: noteId,
      before: before as JsonValue,
      after: note as JsonValue
    });
    await this.addTimelineEvent(tenantId, equipmentId, 'NOTE_UPDATED', 'Equipment note edited', actorId, 'EquipmentNote', note.id);
    return note;
  }

  async deleteNote(tenantId: string, actorId: string, equipmentId: string, noteId: string) {
    await this.get(tenantId, equipmentId);
    const before = await this.findRequired('EquipmentNote', tenantId, noteId, { equipmentId, deletedAt: null });
    const note = await this.repository.deleteNote(tenantId, noteId);
    await this.audit.write({
      tenantId,
      actorId,
      action: 'EQUIPMENT_NOTE_DELETED',
      entityType: 'EquipmentNote',
      entityId: noteId,
      before: before as JsonValue,
      after: note as JsonValue
    });
    await this.addTimelineEvent(tenantId, equipmentId, 'NOTE_DELETED', 'Equipment note deleted', actorId, 'EquipmentNote', noteId);
    return { id: note.id, deleted: true };
  }

  async generateQrCode(tenantId: string, actorId: string, equipmentId: string) {
    const equipment = await this.get(tenantId, equipmentId);
    const payload = this.buildQrPayload(tenantId, equipment.tag);
    const svg = this.buildQrSvg(payload, equipment.tag);
    const storageKey = `equipment-qr/${tenantId}/${equipmentId}/${crypto.randomUUID()}.svg`;
    await this.persistUploadedFile(storageKey, Buffer.from(svg, 'utf-8'));
    const qr = await this.repository.createQrCode({
      tenantId,
      equipmentId,
      payload,
      label: `${equipment.tag} - ${equipment.name}`,
      svg,
      storageKey,
      generatedById: actorId
    });
    await this.repository.update(tenantId, equipmentId, { qrCodePayload: payload });
    await this.audit.write({ tenantId, actorId, action: 'EQUIPMENT_QR_GENERATED', entityType: 'Equipment', entityId: equipmentId, after: qr as JsonValue });
    await this.addTimelineEvent(tenantId, equipmentId, 'QR_GENERATED', `QR generated for ${equipment.tag}`, actorId, 'EquipmentQrCode', qr.id);
    await this.notifyEquipment(tenantId, actorId, equipment, 'equipment.qr.generated', 'Equipment QR generated', `QR generated for ${equipment.tag}.`, 'Info');
    return qr;
  }

  qrCode(tenantId: string, equipmentId: string) {
    return this.repository.latestQrCode(tenantId, equipmentId);
  }

  async crossModuleSummary(tenantId: string, equipmentId: string) {
    const [records, documents, actions] = await Promise.all([
      this.repository.linkedRecords(tenantId, equipmentId),
      this.documents(tenantId, equipmentId),
      this.countOpenEquipmentActions(tenantId, equipmentId)
    ]);
    const countOpen = (moduleKey: string) => records.filter((record) => String(record.moduleKey).toLowerCase() === moduleKey && !['CLOSED', 'COMPLETED'].includes(record.status)).length;
    return {
      ptwOpen: countOpen('ptw'),
      mocOpen: countOpen('moc'),
      hazopOpen: countOpen('hazop'),
      documents: documents.length,
      actionsOpen: actions,
      pssrLinked: records.filter((record) => String(record.moduleKey).toLowerCase() === 'pssr').length
    };
  }

  async hierarchy(tenantId: string, rootId?: string, allowedSiteIds: string[] = [], selectedSiteId?: string | null) {
    let query = this.db.from('Equipment').select('*, children:Equipment!Equipment_parentId_fkey(*, children:Equipment!Equipment_parentId_fkey(*))').eq('tenantId', tenantId);
    if (rootId) query = query.eq('id', rootId);
    else query = query.is('parentId', null);
    if (!rootId && selectedSiteId) query = query.eq('siteId', selectedSiteId);
    else if (!rootId && allowedSiteIds.length) query = query.in('siteId', allowedSiteIds);
    return this.db.many(query.order('tag', { ascending: true }));
  }

  hierarchyForEquipment(tenantId: string, equipmentId: string) {
    return this.repository.findById(tenantId, equipmentId);
  }

  private toCreateInput(tenantId: string, tag: string, dto: CreateEquipmentDto): Record<string, any> {
    const data: Record<string, any> = {
      id: crypto.randomUUID(),
      tenantId,
      siteId: dto.siteId,
      unitId: dto.unitId,
      name: dto.name,
      type: dto.type,
      tag,
      updatedAt: new Date().toISOString()
    };
    this.assignDefined(data, 'areaId', dto.areaId);
    this.assignDefined(data, 'description', dto.description);
    this.assignDefined(data, 'subtype', dto.subtype);
    this.assignDefined(data, 'manufacturer', dto.manufacturer);
    this.assignDefined(data, 'model', dto.model);
    this.assignDefined(data, 'serialNumber', dto.serialNumber);
    this.assignDefined(data, 'nameplateNumber', dto.nameplateNumber);
    this.assignDefined(data, 'fabricationYear', dto.fabricationYear);
    this.assignDefined(data, 'vendorSupplier', dto.vendorSupplier);
    this.assignDefined(data, 'companyName', dto.companyName);
    this.assignDefined(data, 'systemName', dto.systemName);
    this.assignDefined(data, 'buildingZone', dto.buildingZone);
    this.assignDefined(data, 'status', dto.status);
    this.assignDefined(data, 'criticality', dto.criticality);
    this.assignDefined(data, 'safetyCritical', dto.safetyCritical);
    this.assignDefined(data, 'parentId', dto.parentId);
    this.assignDefined(data, 'classification', dto.classification);
    this.assignDefined(data, 'hazardClass', dto.hazardClass);
    this.assignDefined(data, 'areaClassification', dto.areaClassification);
    this.assignDefined(data, 'fluidName', dto.fluidName);
    this.assignDefined(data, 'fluidService', dto.fluidService);
    this.assignDefined(data, 'phase', dto.phase);
    this.assignDefined(data, 'sdsReference', dto.sdsReference);
    this.assignDefined(data, 'exposureLimits', dto.exposureLimits);
    this.assignDefined(data, 'environmentalImpact', dto.environmentalImpact);
    this.assignDefined(data, 'toxicityClass', dto.toxicityClass);
    this.assignDefined(data, 'flammabilityClass', dto.flammabilityClass);
    this.assignDefined(data, 'corrosivityClass', dto.corrosivityClass);
    this.assignDefined(data, 'compositionNotes', dto.compositionNotes);
    this.assignDefined(data, 'processChemistryNotes', dto.processChemistryNotes);
    this.assignDefined(data, 'designPressure', dto.designPressure);
    this.assignDefined(data, 'designPressureUnit', dto.designPressureUnit);
    this.assignDefined(data, 'designTemperature', dto.designTemperature);
    this.assignDefined(data, 'designTemperatureUnit', dto.designTemperatureUnit);
    this.assignDefined(data, 'designFlow', dto.designFlow);
    this.assignDefined(data, 'designFlowUnit', dto.designFlowUnit);
    this.assignDefined(data, 'designCapacity', dto.designCapacity);
    this.assignDefined(data, 'designCapacityUnit', dto.designCapacityUnit);
    this.assignDefined(data, 'materialOfConstruction', dto.materialOfConstruction);
    this.assignDefined(data, 'corrosionAllowance', dto.corrosionAllowance);
    this.assignDefined(data, 'designCode', dto.designCode);
    this.assignDefined(data, 'designBasisDocumentRef', dto.designBasisDocumentRef);
    this.assignDefined(data, 'operatingPressure', dto.operatingPressure);
    this.assignDefined(data, 'operatingPressureUnit', dto.operatingPressureUnit);
    this.assignDefined(data, 'operatingTemperature', dto.operatingTemperature);
    this.assignDefined(data, 'operatingTemperatureUnit', dto.operatingTemperatureUnit);
    this.assignDefined(data, 'normalFlowRate', dto.normalFlowRate);
    this.assignDefined(data, 'flowUnit', dto.flowUnit);
    this.assignDefined(data, 'normalCapacityLoad', dto.normalCapacityLoad);
    this.assignDefined(data, 'capacityUnit', dto.capacityUnit);
    this.assignDefined(data, 'operatingMode', dto.operatingMode);
    this.assignDefined(data, 'operatingDuty', dto.operatingDuty);
    this.assignDefined(data, 'serviceType', dto.serviceType);
    this.assignDefined(data, 'fluidPhase', dto.fluidPhase);
    this.assignDefined(data, 'lotoRequired', dto.lotoRequired);
    this.assignDefined(data, 'confinedSpace', dto.confinedSpace);
    this.assignDefined(data, 'hotWorkRestrictedArea', dto.hotWorkRestrictedArea);
    this.assignDefined(data, 'psvProtected', dto.psvProtected);
    this.assignDefined(data, 'psvTag', dto.psvTag);
    this.assignDefined(data, 'sisProtected', dto.sisProtected);
    this.assignDefined(data, 'sisFunctionTag', dto.sisFunctionTag);
    this.assignDefined(data, 'esdValveAssociated', dto.esdValveAssociated);
    this.assignDefined(data, 'esdValveTag', dto.esdValveTag);
    this.assignDefined(data, 'alarmTags', dto.alarmTags);
    this.assignDefined(data, 'interlockTags', dto.interlockTags);
    this.assignDefined(data, 'hazardousAreaClassification', dto.hazardousAreaClassification);
    this.assignDefined(data, 'mechanicalIntegrityCategory', dto.mechanicalIntegrityCategory);
    this.assignDefined(data, 'inspectionCategory', dto.inspectionCategory);
    this.assignDefined(data, 'rbiPriority', dto.rbiPriority);
    this.assignDefined(data, 'maintenancePriority', dto.maintenancePriority);
    this.assignDefined(data, 'environmentalCriticality', dto.environmentalCriticality);
    this.assignDefined(data, 'productionCriticality', dto.productionCriticality);
    if (dto.commissionDate) data.commissionDate = new Date(dto.commissionDate);
    if (dto.installationDate) data.installationDate = new Date(dto.installationDate);
    if (dto.warrantyExpiryDate) data.warrantyExpiryDate = new Date(dto.warrantyExpiryDate);
    if (dto.gpsLatitude !== undefined) data.gpsLatitude = dto.gpsLatitude;
    if (dto.gpsLongitude !== undefined) data.gpsLongitude = dto.gpsLongitude;
    if (dto.metadata) data.metadata = dto.metadata;
    return data;
  }

  private toUpdateInput(dto: UpdateEquipmentDto): Record<string, any> {
    const data: Record<string, any> = {};
    for (const key of [
      'siteId',
      'unitId',
      'areaId',
      'name',
      'description',
      'type',
      'subtype',
      'manufacturer',
      'model',
      'serialNumber',
      'nameplateNumber',
      'fabricationYear',
      'vendorSupplier',
      'companyName',
      'systemName',
      'buildingZone',
      'status',
      'criticality',
      'safetyCritical',
      'parentId',
      'classification',
      'hazardClass',
      'areaClassification',
      'fluidName',
      'fluidService',
      'phase',
      'sdsReference',
      'exposureLimits',
      'environmentalImpact',
      'toxicityClass',
      'flammabilityClass',
      'corrosivityClass',
      'compositionNotes',
      'processChemistryNotes',
      'designPressure',
      'designPressureUnit',
      'designTemperature',
      'designTemperatureUnit',
      'designFlow',
      'designFlowUnit',
      'designCapacity',
      'designCapacityUnit',
      'materialOfConstruction',
      'corrosionAllowance',
      'designCode',
      'designBasisDocumentRef',
      'operatingPressure',
      'operatingPressureUnit',
      'operatingTemperature'
      ,
      'operatingTemperatureUnit',
      'normalFlowRate',
      'flowUnit',
      'normalCapacityLoad',
      'capacityUnit',
      'operatingMode',
      'operatingDuty',
      'serviceType',
      'fluidPhase',
      'lotoRequired',
      'confinedSpace',
      'hotWorkRestrictedArea',
      'psvProtected',
      'psvTag',
      'sisProtected',
      'sisFunctionTag',
      'esdValveAssociated',
      'esdValveTag',
      'alarmTags',
      'interlockTags',
      'hazardousAreaClassification',
      'mechanicalIntegrityCategory',
      'inspectionCategory',
      'rbiPriority',
      'maintenancePriority',
      'environmentalCriticality',
      'productionCriticality'
    ] as const) {
      this.assignDefined(data, key, dto[key]);
    }
    if (dto.commissionDate) data.commissionDate = new Date(dto.commissionDate);
    if (dto.installationDate) data.installationDate = new Date(dto.installationDate);
    if (dto.warrantyExpiryDate) data.warrantyExpiryDate = new Date(dto.warrantyExpiryDate);
    if (dto.gpsLatitude !== undefined) data.gpsLatitude = dto.gpsLatitude;
    if (dto.gpsLongitude !== undefined) data.gpsLongitude = dto.gpsLongitude;
    if (dto.metadata) data.metadata = dto.metadata;
    data.updatedAt = new Date().toISOString();
    return data;
  }

  private toInspectionCreateInput(tenantId: string, equipmentId: string, dto: CreateEquipmentInspectionDto): Record<string, any> {
    const data: Record<string, any> = {
      id: crypto.randomUUID(),
      tenantId,
      equipmentId,
      inspectionType: dto.inspectionType,
      status: dto.status ?? (dto.completedAt ? 'COMPLETED' : 'SCHEDULED'),
      dueDate: new Date(dto.nextInspectionDate).toISOString(),
      nextInspectionDate: new Date(dto.nextInspectionDate).toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (dto.inspectionDate) data.inspectionDate = new Date(dto.inspectionDate).toISOString();
    this.assignDefined(data, 'inspector', dto.inspector);
    this.assignDefined(data, 'result', dto.result);
    this.assignDefined(data, 'observation', dto.observation);
    if (dto.completedAt) data.completedAt = new Date(dto.completedAt).toISOString();
    this.assignDefined(data, 'intervalMonths', dto.intervalMonths);
    this.assignDefined(data, 'rbiPriority', dto.rbiPriority);
    this.assignDefined(data, 'summary', dto.summary);
    return data;
  }

  private toInspectionUpdateInput(dto: UpdateEquipmentInspectionDto): Record<string, any> {
    const data: Record<string, any> = {};
    this.assignDefined(data, 'inspectionType', dto.inspectionType);
    this.assignDefined(data, 'inspector', dto.inspector);
    this.assignDefined(data, 'result', dto.result);
    this.assignDefined(data, 'observation', dto.observation);
    this.assignDefined(data, 'status', dto.status);
    this.assignDefined(data, 'intervalMonths', dto.intervalMonths);
    this.assignDefined(data, 'rbiPriority', dto.rbiPriority);
    this.assignDefined(data, 'summary', dto.summary);
    if (dto.inspectionDate) data.inspectionDate = new Date(dto.inspectionDate).toISOString();
    if (dto.nextInspectionDate) {
      data.nextInspectionDate = new Date(dto.nextInspectionDate).toISOString();
      data.dueDate = new Date(dto.nextInspectionDate).toISOString();
    }
    if (dto.completedAt) data.completedAt = new Date(dto.completedAt).toISOString();
    data.updatedAt = new Date().toISOString();
    return data;
  }

  private assignDefined<T extends object, K extends keyof T>(target: T, key: K, value: T[K] | undefined) {
    if (value !== undefined) target[key] = value;
  }

  private buildQrPayload(tenantId: string, tag: string) {
    return JSON.stringify({ type: 'PSM_OS_EQUIPMENT', tenantId, tag });
  }

  private buildQrSvg(payload: string, label: string) {
    const bytes = Buffer.from(payload);
    const cells = 29;
    const cell = 4;
    const size = cells * cell;
    const rects: string[] = [];
    for (let y = 0; y < cells; y += 1) {
      for (let x = 0; x < cells; x += 1) {
        const finder = (x < 7 && y < 7) || (x > 21 && y < 7) || (x < 7 && y > 21);
        const byte = bytes[(x * 17 + y * 31) % bytes.length] ?? 0;
        const bit = finder || ((byte + x + y) % 3 === 0);
        if (bit) rects.push(`<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`);
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 20}" viewBox="0 0 ${size} ${size + 20}"><rect width="100%" height="100%" fill="white"/><g fill="black">${rects.join('')}</g><text x="${size / 2}" y="${size + 14}" font-size="10" text-anchor="middle" fill="black">${label}</text></svg>`;
  }

  private async createControlledEquipmentDocument(
    tenantId: string,
    actorId: string,
    equipment: Record<string, any>,
    input: {
      title: string;
      documentNo?: string;
      documentType: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      storageKey?: string;
      buffer?: Buffer;
    }
  ) {
    const documentId = crypto.randomUUID();
    const now = new Date().toISOString();
    const storageKey = input.storageKey ?? `documents/${tenantId}/${documentId}/${crypto.randomUUID()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    if (input.buffer) await this.persistControlledFile(storageKey, input.buffer);
    const documentNumber = input.documentNo?.trim() || await this.nextControlledDocumentNumber(tenantId, equipment.siteId, input.documentType);
    const doc = await this.db.single<any>(this.db.from('documents').insert({
      id: documentId,
      tenant_id: tenantId,
      company_id: equipment.companyId ?? null,
      site_id: equipment.siteId,
      unit_id: equipment.unitId ?? null,
      area_id: equipment.areaId ?? null,
      document_number: documentNumber,
      title: input.title,
      description: `Controlled document linked from Equipment Registry for ${equipment.tag}.`,
      document_type: input.documentType,
      status: 'Draft',
      owner_id: actorId,
      created_by: actorId,
      updated_at: now
    }).select().single());
    const version = await this.db.single<any>(this.db.from('document_versions').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      document_id: documentId,
      version_number: 'v1.0',
      file_name: input.fileName,
      file_url: storageKey,
      file_type: input.mimeType,
      file_size: input.sizeBytes,
      uploaded_by: actorId,
      change_summary: 'Initial upload from Equipment Registry',
      is_current: true
    }).select().single());
    const updated = await this.db.single<any>(this.db.from('documents').update({ current_version_id: version.id, updated_at: now }).eq('id', documentId).select('*, current_version:document_versions!documents_current_version_fkey(*)').single());
    await this.db.single(this.db.from('document_reviews').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      document_id: documentId,
      review_frequency_months: 12,
      next_review_date: this.addMonths(new Date(), 12).toISOString().slice(0, 10),
      review_owner_id: actorId,
      review_status: 'Scheduled',
      updated_at: now
    }).select().single());
    await this.db.single(this.db.from('document_relations').upsert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      document_id: documentId,
      related_module: 'equipment',
      related_record_id: equipment.id,
      equipment_id: equipment.id,
      relation_type: 'Controlled Document',
      created_by: actorId
    }, { onConflict: 'document_id,related_module,related_record_id,relation_type' }).select().single());
    await this.db.single(this.db.from('document_access_logs').insert({ id: crypto.randomUUID(), tenant_id: tenantId, document_id: documentId, user_id: actorId, action: 'upload' }).select().single());
    await this.addTimelineEvent(tenantId, equipment.id, 'CONTROLLED_DOCUMENT_UPLOADED', `Controlled document uploaded: ${input.title}`, actorId, 'Document', documentId);
    await this.audit.write({ tenantId, actorId, action: 'DOCUMENT_UPLOADED', entityType: 'Document', entityId: documentId, after: { doc, version } as JsonValue });
    await this.audit.write({ tenantId, actorId, action: 'EQUIPMENT_DOCUMENT_LINKED', entityType: 'Equipment', entityId: equipment.id, after: updated as JsonValue });
    return this.mapControlledDocument(updated);
  }

  private async controlledDocuments(tenantId: string, equipmentId: string) {
    const relations = await this.db.many<any>(
      this.db.from('document_relations')
        .select('*, document:documents(*, current_version:document_versions!documents_current_version_fkey(*))')
        .eq('tenant_id', tenantId)
        .eq('equipment_id', equipmentId)
        .order('created_at', { ascending: false })
    );
    return relations.filter((relation) => relation.document).map((relation) => this.mapControlledDocument(relation.document));
  }

  private async controlledDocumentByIdForEquipment(tenantId: string, equipmentId: string, documentId: string) {
    const relation = await this.db.single<any>(
      this.db.from('document_relations')
        .select('*, document:documents(*, current_version:document_versions!documents_current_version_fkey(*), versions:document_versions(*))')
        .eq('tenant_id', tenantId)
        .eq('equipment_id', equipmentId)
        .eq('document_id', documentId)
        .maybeSingle()
    );
    return relation?.document ?? null;
  }

  private mapControlledDocument(doc: Record<string, any>) {
    const version = doc.current_version;
    return {
      id: doc.id,
      title: doc.title,
      documentNo: doc.document_number,
      documentType: doc.document_type,
      fileName: version?.file_name ?? doc.title,
      mimeType: version?.file_type ?? 'application/octet-stream',
      sizeBytes: version?.file_size ?? 0,
      storageKey: version?.file_url ?? '',
      status: String(doc.status ?? 'Draft').toUpperCase(),
      uploadedById: version?.uploaded_by ?? doc.created_by,
      uploadedAt: version?.uploaded_at ?? doc.updated_at,
      controlledDocument: true
    };
  }

  private async nextControlledDocumentNumber(tenantId: string, siteId: string, type: string) {
    const year = new Date().getFullYear();
    const prefix = `${this.controlledDocumentPrefix(type)}-${year}-`;
    const rows = await this.db.many<any>(
      this.db.from('documents')
        .select('document_number')
        .eq('tenant_id', tenantId)
        .eq('site_id', siteId)
        .like('document_number', `${prefix}%`)
        .order('document_number', { ascending: false })
        .limit(1)
    );
    const last = rows[0]?.document_number ? Number(String(rows[0].document_number).split('-').pop()) : 0;
    return `${prefix}${String(last + 1).padStart(6, '0')}`;
  }

  private controlledDocumentPrefix(type: string) {
    const normalized = type.toLowerCase();
    if (normalized.includes('p&id') || normalized.includes('pid')) return 'PID';
    if (normalized.includes('sop')) return 'SOP';
    if (normalized.includes('cert')) return 'CERT';
    return 'DOC';
  }

  private nextControlledVersion(versions: any[]) {
    const current = versions.map((version) => Number(String(version.version_number).replace(/^v/, '').split('.')[0])).filter(Boolean).sort((a, b) => b - a)[0] ?? 1;
    return `v${current + 1}.0`;
  }

  private addMonths(date: Date, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  }

  private async persistControlledFile(storageKey: string, buffer: Buffer) {
    const storageRoot = path.resolve(process.cwd(), '.uploads');
    const targetPath = path.resolve(storageRoot, storageKey);
    if (!targetPath.startsWith(storageRoot)) throw new BadRequestException('Invalid storage key');
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buffer);
  }

  private async readControlledFile(storageKey: string) {
    const storageRoot = path.resolve(process.cwd(), '.uploads');
    const targetPath = path.resolve(storageRoot, storageKey);
    if (!targetPath.startsWith(storageRoot)) throw new BadRequestException('Invalid storage key');
    try {
      return await readFile(targetPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return Buffer.from(`PSM OS controlled document placeholder\nStorage key: ${storageKey}\nUpload or replace this file to store the real controlled document.`, 'utf-8');
      }
      throw error;
    }
  }

  private async persistUploadedFile(storageKey: string, buffer: Buffer) {
    const storageRoot = process.env.EQUIPMENT_STORAGE_ROOT ?? path.resolve(process.cwd(), 'storage');
    const targetPath = path.resolve(storageRoot, storageKey);
    if (!targetPath.startsWith(path.resolve(storageRoot))) throw new BadRequestException('Invalid storage key');
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buffer);
  }

  private async removeStoredFile(storageKey: string) {
    const storageRoot = process.env.EQUIPMENT_STORAGE_ROOT ?? path.resolve(process.cwd(), 'storage');
    const targetPath = path.resolve(storageRoot, storageKey);
    if (!targetPath.startsWith(path.resolve(storageRoot))) return;
    await rm(targetPath, { force: true });
  }

  private async readStoredFile(storageKey: string) {
    const storageRoot = process.env.EQUIPMENT_STORAGE_ROOT ?? path.resolve(process.cwd(), 'storage');
    const targetPath = path.resolve(storageRoot, storageKey);
    if (!targetPath.startsWith(path.resolve(storageRoot))) throw new BadRequestException('Invalid storage key');
    try {
      return await readFile(targetPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return Buffer.from(`PSM OS demo file placeholder\nStorage key: ${storageKey}\nUpload or replace this file to store the real controlled document.`, 'utf-8');
      }
      throw error;
    }
  }

  private async addTimelineEvent(tenantId: string, equipmentId: string, eventType: string, title: string, actorName?: string, sourceType?: string, sourceId?: string) {
    await this.db.single(this.db.from('EquipmentTimelineEvent').insert({
        id: crypto.randomUUID(),
        tenantId,
        equipmentId,
        eventType,
        title,
        actorName: actorName ?? null,
        occurredAt: new Date().toISOString(),
        sourceType: sourceType ?? null,
        sourceId: sourceId ?? null
    }).select().single());
  }

  private async indexEquipment(equipment: { tenantId: string; id: string; tag: string; name: string } & Record<string, unknown>) {
    const enriched = await this.db.single<any>(
      this.db.from('Equipment')
        .select('*, site:Site(name,code), unit:Unit(name,code), area:Area(name,code)')
        .eq('tenantId', equipment.tenantId)
        .eq('id', equipment.id)
        .maybeSingle()
    );
    if (enriched) await this.searchIndex.indexEquipment(enriched);
  }

  private async findRequired(table: string, tenantId: string, id: string, extra: Record<string, unknown> = {}) {
    let query = this.db.from(table).select('*').eq('tenantId', tenantId).eq('id', id);
    for (const [key, value] of Object.entries(extra)) {
      query = value === null ? query.is(key, null) : query.eq(key, value as string);
    }
    const record = await this.db.single<any>(query.maybeSingle());
    if (!record) throw new NotFoundException(`${table} not found`);
    return record;
  }

  private assertSiteAccess(siteId: string | null | undefined, allowedSiteIds: string[]) {
    if (!siteId || !allowedSiteIds.length) return;
    if (!allowedSiteIds.includes(siteId)) throw new ForbiddenException('Equipment is outside the current user site access scope');
  }

  private async countOpenEquipmentActions(tenantId: string, equipmentId: string) {
    const actions = await this.repository.actions(tenantId, equipmentId);
    return actions.filter((action) => !['CLOSED', 'CANCELLED'].includes(action.status)).length;
  }

  private async syncActionLinkedRecord(tenantId: string, equipmentId: string, action: Record<string, any>) {
    await this.db.single(this.db.from('EquipmentLinkedRecord').upsert({
      id: `equipment-action-${equipmentId}-${action.id}`,
      tenantId,
      equipmentId,
      moduleKey: 'actions',
      recordType: 'Action',
      recordId: action.id,
      title: `${action.actionNumber ?? action.id} - ${action.title}`,
      status: action.status,
      priority: action.priority,
      url: `/actions/${action.id}`
    }, { onConflict: 'tenantId,equipmentId,moduleKey,recordId' }).select().single());
  }

  private notifyEquipment(tenantId: string, userId: string, equipment: any, type: string, title: string, message: string, priority: string) {
    return this.notifications.notifyUser({
      tenantId,
      userId,
      companyId: equipment.companyId ?? null,
      siteId: equipment.siteId ?? null,
      type,
      module: 'equipment',
      title,
      message,
      relatedRecordId: equipment.id,
      relatedRecordType: 'Equipment',
      relatedUrl: `/equipment/${equipment.id}`,
      priority,
      metadata: { tag: equipment.tag, criticality: equipment.criticality }
    });
  }
}
