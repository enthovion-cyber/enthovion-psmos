import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { EquipmentFilterDto } from '../dto/equipment-filter.dto';

@Injectable()
export class EquipmentRepository {
  constructor(private readonly db: SupabaseService) {}

  create(data: Record<string, unknown>) {
    return this.db.single<any>(this.db.from('Equipment').insert(this.withCreateFields(data)).select().single());
  }

  async findMany(tenantId: string, filter: EquipmentFilterDto) {
    let query = this.db.from('Equipment').select('*, site:Site(*), unit:Unit(*), area:Area(*)').eq('tenantId', tenantId);
    if (filter.siteId) query = query.eq('siteId', filter.siteId);
    if (filter.unitId) query = query.eq('unitId', filter.unitId);
    if (filter.areaId) query = query.eq('areaId', filter.areaId);
    if (filter.status) query = query.eq('status', filter.status);
    if (filter.criticality) query = query.eq('criticality', filter.criticality);
    if (filter.q) {
      const q = filter.q.replace(/[%(),]/g, '');
      query = query.or(`tag.ilike.%${q}%,name.ilike.%${q}%,type.ilike.%${q}%,manufacturer.ilike.%${q}%,model.ilike.%${q}%`);
    }
    return this.db.many<any>(query.order('tag', { ascending: true }).limit(100));
  }

  async findById(tenantId: string, id: string) {
    const equipment = await this.db.single<any>(
      this.db.from('Equipment').select('*, site:Site(*), unit:Unit(*), area:Area(*)').eq('tenantId', tenantId).eq('id', id).maybeSingle()
    );
    if (!equipment) return null;
    const [parent, children, documents, attachments, notes, timelineEvents, linkedRecords, qrCodes, inspections, relationshipsFrom, relationshipsTo] = await Promise.all([
      equipment.parentId
        ? this.db.single<any>(this.db.from('Equipment').select('*').eq('tenantId', tenantId).eq('id', equipment.parentId).maybeSingle())
        : Promise.resolve(null),
      this.db.many<any>(this.db.from('Equipment').select('*').eq('tenantId', tenantId).eq('parentId', id).order('tag')),
      this.documents(tenantId, id),
      this.attachments(tenantId, id),
      this.db.many<any>(this.db.from('EquipmentNote').select('*').eq('tenantId', tenantId).eq('equipmentId', id).is('deletedAt', null).order('createdAt', { ascending: false }).limit(20)),
      this.timeline(tenantId, id).then((events) => events.slice(0, 20)),
      this.linkedRecords(tenantId, id),
      this.db.many<any>(this.db.from('EquipmentQrCode').select('*').eq('tenantId', tenantId).eq('equipmentId', id).order('generatedAt', { ascending: false }).limit(5)),
      this.db.many<any>(this.db.from('EquipmentInspection').select('*, attachments:EquipmentAttachment(*)').eq('tenantId', tenantId).eq('equipmentId', id).order('dueDate', { ascending: true }).limit(10)),
      this.db.many<any>(this.db.from('EquipmentRelationship').select('*, toEquipment:Equipment!EquipmentRelationship_toEquipmentId_fkey(*)').eq('tenantId', tenantId).eq('fromEquipmentId', id)),
      this.db.many<any>(this.db.from('EquipmentRelationship').select('*, fromEquipment:Equipment!EquipmentRelationship_fromEquipmentId_fkey(*)').eq('tenantId', tenantId).eq('toEquipmentId', id))
    ]);
    return { ...equipment, parent, children, documents, attachments, notes, timelineEvents, linkedRecords, qrCodes, inspections, relationshipsFrom, relationshipsTo };
  }

  update(tenantId: string, id: string, data: Record<string, unknown>) {
    return this.db.single<any>(this.db.from('Equipment').update(this.withUpdateFields(data)).eq('tenantId', tenantId).eq('id', id).select().single());
  }

  addNote(tenantId: string, equipmentId: string, authorId: string, body: string) {
    return this.db.single<any>(this.db.from('EquipmentNote').insert(this.withCreateFields({ tenantId, equipmentId, authorId, body })).select().single());
  }

  updateNote(tenantId: string, noteId: string, body: string) {
    return this.db.single<any>(this.db.from('EquipmentNote').update(this.withUpdateFields({ body })).eq('tenantId', tenantId).eq('id', noteId).select().single());
  }

  deleteNote(tenantId: string, noteId: string) {
    return this.db.single<any>(this.db.from('EquipmentNote').update(this.withUpdateFields({ deletedAt: new Date().toISOString() })).eq('tenantId', tenantId).eq('id', noteId).select().single());
  }

  documents(tenantId: string, equipmentId: string) {
    return this.db.many<any>(this.db.from('EquipmentDocument').select('*').eq('tenantId', tenantId).eq('equipmentId', equipmentId).order('uploadedAt', { ascending: false }));
  }

  createDocument(data: Record<string, unknown>) {
    return this.db.single<any>(this.db.from('EquipmentDocument').insert(this.withId(data)).select().single());
  }

  updateDocument(tenantId: string, documentId: string, data: Record<string, unknown>) {
    return this.db.single<any>(this.db.from('EquipmentDocument').update(data).eq('tenantId', tenantId).eq('id', documentId).select().single());
  }

  deleteDocument(tenantId: string, documentId: string) {
    return this.db.single<any>(this.db.from('EquipmentDocument').delete().eq('tenantId', tenantId).eq('id', documentId).select().single());
  }

  attachments(tenantId: string, equipmentId: string) {
    return this.db.many<any>(this.db.from('EquipmentAttachment').select('*').eq('tenantId', tenantId).eq('equipmentId', equipmentId).order('uploadedAt', { ascending: false }));
  }

  createAttachment(data: Record<string, unknown>) {
    return this.db.single<any>(this.db.from('EquipmentAttachment').insert(this.withId(data)).select().single());
  }

  deleteAttachment(tenantId: string, attachmentId: string) {
    return this.db.single<any>(this.db.from('EquipmentAttachment').delete().eq('tenantId', tenantId).eq('id', attachmentId).select().single());
  }

  linkedRecords(tenantId: string, equipmentId: string, moduleKey?: string) {
    let query = this.db.from('EquipmentLinkedRecord').select('*').eq('tenantId', tenantId).eq('equipmentId', equipmentId);
    if (moduleKey) query = query.ilike('moduleKey', moduleKey);
    return this.db.many<any>(query.order('createdAt', { ascending: false }));
  }

  async actions(tenantId: string, equipmentId: string) {
    const select = '*, assignedTo:User!Action_assignedToId_fkey(id, displayName, title, department), createdBy:User!Action_createdById_fkey(id, displayName, title, department), evidence:ActionEvidence(id,status,fileName,mimeType,storageKey,uploadedAt)';
    const [direct, legacySource] = await Promise.all([
      this.db.many<any>(
        this.db.from('Action')
          .select(select)
          .eq('tenantId', tenantId)
          .eq('equipmentId', equipmentId)
      ),
      this.db.many<any>(
        this.db.from('Action')
          .select(select)
          .eq('tenantId', tenantId)
          .eq('sourceType', 'Equipment')
          .eq('sourceId', equipmentId)
      )
    ]);
    return Array.from(new Map([...direct, ...legacySource].map((action) => [action.id, action])).values())
      .sort((a, b) => `${a.status}-${a.dueDate}`.localeCompare(`${b.status}-${b.dueDate}`));
  }

  inspectionHistory(tenantId: string, equipmentId: string) {
    return this.db.many<any>(this.db.from('EquipmentInspection').select('*, attachments:EquipmentAttachment(*)').eq('tenantId', tenantId).eq('equipmentId', equipmentId).order('dueDate', { ascending: false }));
  }

  createInspection(data: Record<string, unknown>) {
    return this.db.single<any>(this.db.from('EquipmentInspection').insert(this.withCreateFields(data)).select('*, attachments:EquipmentAttachment(*)').single());
  }

  updateInspection(tenantId: string, inspectionId: string, data: Record<string, unknown>) {
    return this.db.single<any>(this.db.from('EquipmentInspection').update(this.withUpdateFields(data)).eq('tenantId', tenantId).eq('id', inspectionId).select('*, attachments:EquipmentAttachment(*)').single());
  }

  deleteInspection(tenantId: string, inspectionId: string) {
    return this.db.single<any>(this.db.from('EquipmentInspection').delete().eq('tenantId', tenantId).eq('id', inspectionId).select().single());
  }

  timeline(tenantId: string, equipmentId: string) {
    return this.db.many<any>(this.db.from('EquipmentTimelineEvent').select('*').eq('tenantId', tenantId).eq('equipmentId', equipmentId).order('occurredAt', { ascending: false }));
  }

  createQrCode(data: Record<string, unknown>) {
    return this.db.single<any>(this.db.from('EquipmentQrCode').insert(this.withId(data)).select().single());
  }

  latestQrCode(tenantId: string, equipmentId: string) {
    return this.db.single<any>(this.db.from('EquipmentQrCode').select('*').eq('tenantId', tenantId).eq('equipmentId', equipmentId).order('generatedAt', { ascending: false }).limit(1).maybeSingle());
  }

  private withId(data: Record<string, unknown>) {
    return { id: crypto.randomUUID(), ...data };
  }

  private withCreateFields(data: Record<string, unknown>) {
    return { id: crypto.randomUUID(), updatedAt: new Date().toISOString(), ...data };
  }

  private withUpdateFields(data: Record<string, unknown>) {
    return { ...data, updatedAt: new Date().toISOString() };
  }
}
