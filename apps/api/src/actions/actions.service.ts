import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchIndexService } from '../search/search-index.service';
import { ActionCommentDto } from './dto/action-comment.dto';
import { ActionEvidenceDto } from './dto/action-evidence.dto';
import { ActionFilterDto } from './dto/action-filter.dto';
import { CloseActionDto } from './dto/close-action.dto';
import { CreateActionDto } from './dto/create-action.dto';
import { UpdateActionDto } from './dto/update-action.dto';
import { VerifyActionDto } from './dto/verify-action.dto';

const terminalStatuses = ['CLOSED', 'CANCELLED'];

@Injectable()
export class ActionsService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly searchIndex: SearchIndexService
  ) {}

  async list(tenantId: string, userId: string, filters: ActionFilterDto, allowedSiteIds: string[] = []) {
    let query = this.db.from('Action')
      .select('*, owner:User!Action_assignedToId_fkey(id,displayName,email,title), creator:User!Action_createdById_fkey(id,displayName,email), equipment:Equipment(id,tag,name), site:Site(id,name,code)')
      .eq('tenantId', tenantId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (filters.siteId) query = query.eq('siteId', filters.siteId);
    else if (allowedSiteIds.length) query = query.in('siteId', allowedSiteIds);
    if (filters.departmentId) query = query.eq('departmentId', filters.departmentId);
    if (filters.moduleKey) query = query.eq('moduleKey', filters.moduleKey);
    if (filters.ownerId) query = query.eq('assignedToId', filters.ownerId);
    if (filters.view === 'mine' || filters.view === 'assigned-to-me') query = query.eq('assignedToId', userId);
    if (filters.dateFrom) query = query.gte('dueDate', filters.dateFrom);
    if (filters.dateTo) query = query.lte('dueDate', filters.dateTo);
    return this.db.many(query.order('dueDate', { ascending: true }));
  }

  async get(tenantId: string, id: string, allowedSiteIds: string[] = []) {
    const action = await this.db.single<any>(
      this.db.from('Action')
        .select('*, owner:User!Action_assignedToId_fkey(id,displayName,email,title), creator:User!Action_createdById_fkey(id,displayName,email), verifier:User!Action_verifiedById_fkey(id,displayName,email), equipment:Equipment(id,tag,name), site:Site(id,name,code)')
        .eq('tenantId', tenantId)
        .eq('id', id)
        .maybeSingle()
    );
    if (!action) throw new NotFoundException('Action not found');
    this.assertSiteAccess(action.siteId, allowedSiteIds);
    const [comments, evidence, verifications, watchers, history] = await Promise.all([
      this.db.many(this.db.from('ActionComment').select('*, author:User(id,displayName,email)').eq('tenantId', tenantId).eq('actionId', id).order('createdAt')),
      this.db.many(this.db.from('ActionEvidence').select('*, uploadedBy:User(id,displayName,email)').eq('tenantId', tenantId).eq('actionId', id).order('uploadedAt', { ascending: false })),
      this.db.many(this.db.from('ActionVerification').select('*, verifiedBy:User(id,displayName,email)').eq('tenantId', tenantId).eq('actionId', id).order('verifiedAt', { ascending: false })),
      this.db.many(this.db.from('ActionWatcher').select('*, user:User(id,displayName,email)').eq('tenantId', tenantId).eq('actionId', id)),
      this.db.many(this.db.from('ActionHistory').select('*, actor:User(id,displayName,email)').eq('tenantId', tenantId).eq('actionId', id).order('createdAt', { ascending: false }))
    ]);
    return { ...action, comments, evidence, verifications, watchers, history };
  }

  async create(tenantId: string, actorId: string, dto: CreateActionDto) {
    if (dto.priority === 'SAFETY_CRITICAL') {
      dto.evidenceRequired = true;
      dto.verificationRequired = true;
      if (!dto.dueDate) throw new BadRequestException('Safety-critical actions require a due date');
    }
    const now = new Date().toISOString();
    const action = await this.db.single<any>(this.db.from('Action').insert({
      id: crypto.randomUUID(),
      tenantId,
      actionNumber: await this.nextActionNumber(tenantId),
      moduleKey: dto.sourceModule,
      sourceType: dto.sourceType ?? dto.sourceModule,
      sourceId: dto.sourceRecordId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      status: 'OPEN',
      assignedToId: dto.ownerId,
      createdById: actorId,
      equipmentId: dto.equipmentId ?? null,
      siteId: dto.siteId ?? null,
      departmentId: dto.departmentId ?? null,
      assignedDate: now,
      dueDate: dto.dueDate,
      evidenceRequired: dto.evidenceRequired ?? false,
      verificationRequired: dto.verificationRequired ?? false,
      updatedAt: now
    }).select().single());
    await this.history(tenantId, action.id, actorId, 'ACTION_CREATED', null, action);
    await this.notification(tenantId, action.assignedToId, 'action.assigned', 'Action Assigned', `${action.actionNumber} assigned: ${action.title}`, action.id, action.siteId, 'Normal');
    await this.audit.write({ tenantId, actorId, action: 'ACTION_CREATED', entityType: 'Action', entityId: action.id, after: action as JsonValue });
    await this.indexAction(tenantId, action.id);
    return action;
  }

  async update(tenantId: string, actorId: string, id: string, dto: UpdateActionDto) {
    const before = await this.getBase(tenantId, id);
    if (terminalStatuses.includes(before.status)) throw new BadRequestException('Closed or cancelled actions cannot be edited');
    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.ownerId !== undefined) {
      patch.assignedToId = dto.ownerId;
      patch.assignedDate = new Date().toISOString();
    }
    if (dto.dueDate !== undefined) patch.dueDate = dto.dueDate;
    if (dto.evidenceRequired !== undefined) patch.evidenceRequired = dto.evidenceRequired;
    if (dto.verificationRequired !== undefined) patch.verificationRequired = dto.verificationRequired;
    if (dto.priority === 'SAFETY_CRITICAL') {
      patch.evidenceRequired = true;
      patch.verificationRequired = true;
    }
    const action = await this.db.single<any>(this.db.from('Action').update(patch).eq('tenantId', tenantId).eq('id', id).select().single());
    await this.history(tenantId, id, actorId, 'ACTION_UPDATED', before, action);
    await this.audit.write({ tenantId, actorId, action: 'ACTION_UPDATED', entityType: 'Action', entityId: id, before: before as JsonValue, after: action as JsonValue });
    await this.indexAction(tenantId, id);
    return action;
  }

  async transition(tenantId: string, actorId: string, id: string, status: string) {
    const before = await this.getBase(tenantId, id);
    const allowed: Record<string, string[]> = {
      OPEN: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['PENDING_VERIFICATION', 'CANCELLED'],
      PENDING_VERIFICATION: ['CLOSED', 'IN_PROGRESS'],
      CLOSED: ['IN_PROGRESS'],
      CANCELLED: ['OPEN']
    };
    if (!allowed[before.status]?.includes(status)) throw new BadRequestException(`Cannot move action from ${before.status} to ${status}`);
    const action = await this.db.single<any>(this.db.from('Action').update({
      status,
      closedAt: status === 'CLOSED' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    }).eq('tenantId', tenantId).eq('id', id).select().single());
    await this.history(tenantId, id, actorId, `ACTION_${status}`, before, action);
    await this.audit.write({ tenantId, actorId, action: `ACTION_${status}`, entityType: 'Action', entityId: id, before: before as JsonValue, after: action as JsonValue });
    await this.indexAction(tenantId, id);
    return action;
  }

  async close(tenantId: string, actorId: string, id: string, dto: CloseActionDto) {
    const action = await this.getBase(tenantId, id);
    const evidence = await this.db.many<any>(this.db.from('ActionEvidence').select('id,status').eq('tenantId', tenantId).eq('actionId', id));
    if (action.evidenceRequired && !evidence.length) throw new BadRequestException('Evidence is required before closing this action');
    if (action.verificationRequired && !action.verifiedAt) throw new BadRequestException('Verification is required before closing this action');
    const closed = await this.transition(tenantId, actorId, id, 'CLOSED');
    if (dto.notes) await this.addComment(tenantId, actorId, id, { body: dto.notes });
    await this.notification(tenantId, action.assignedToId, 'action.closed', 'Action Closed', `${action.actionNumber} closed`, id, action.siteId, 'Normal');
    return closed;
  }

  async addComment(tenantId: string, actorId: string, actionId: string, dto: ActionCommentDto) {
    await this.getBase(tenantId, actionId);
    const comment = await this.db.single<any>(this.db.from('ActionComment').insert({
      id: crypto.randomUUID(),
      tenantId,
      actionId,
      parentCommentId: dto.parentCommentId ?? null,
      body: dto.body,
      authorId: actorId,
      updatedAt: new Date().toISOString()
    }).select().single());
    await this.history(tenantId, actionId, actorId, 'COMMENT_ADDED', null, comment);
    await this.audit.write({ tenantId, actorId, action: 'ACTION_COMMENT_ADDED', entityType: 'Action', entityId: actionId, after: comment as JsonValue });
    return comment;
  }

  async updateComment(tenantId: string, actorId: string, commentId: string, dto: ActionCommentDto) {
    const before = await this.getComment(tenantId, commentId);
    if (before.authorId !== actorId) throw new ForbiddenException('Only the comment author can edit this comment');
    const comment = await this.db.single<any>(this.db.from('ActionComment').update({ body: dto.body, editedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).eq('tenantId', tenantId).eq('id', commentId).select().single());
    await this.history(tenantId, comment.actionId, actorId, 'COMMENT_EDITED', before, comment);
    return comment;
  }

  async deleteComment(tenantId: string, actorId: string, commentId: string) {
    const comment = await this.getComment(tenantId, commentId);
    if (comment.authorId !== actorId) throw new ForbiddenException('Only the comment author can delete this comment');
    await this.db.single(this.db.from('ActionComment').delete().eq('tenantId', tenantId).eq('id', commentId).select().single());
    await this.history(tenantId, comment.actionId, actorId, 'COMMENT_DELETED', comment, null);
    return { deleted: true };
  }

  async addEvidence(tenantId: string, actorId: string, actionId: string, dto: ActionEvidenceDto) {
    await this.getBase(tenantId, actionId);
    const evidence = await this.db.single<any>(this.db.from('ActionEvidence').insert({
      id: crypto.randomUUID(),
      tenantId,
      actionId,
      description: dto.description ?? null,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      storageKey: dto.storageKey,
      uploadedById: actorId
    }).select().single());
    await this.history(tenantId, actionId, actorId, 'EVIDENCE_UPLOADED', null, evidence);
    await this.audit.write({ tenantId, actorId, action: 'ACTION_EVIDENCE_UPLOADED', entityType: 'Action', entityId: actionId, after: evidence as JsonValue });
    return evidence;
  }

  async deleteEvidence(tenantId: string, actorId: string, evidenceId: string) {
    const evidence = await this.db.single<any>(this.db.from('ActionEvidence').select('*').eq('tenantId', tenantId).eq('id', evidenceId).maybeSingle());
    if (!evidence) throw new NotFoundException('Evidence not found');
    await this.db.single(this.db.from('ActionEvidence').delete().eq('tenantId', tenantId).eq('id', evidenceId).select().single());
    await this.history(tenantId, evidence.actionId, actorId, 'EVIDENCE_DELETED', evidence, null);
    return { deleted: true };
  }

  async verify(tenantId: string, actorId: string, actionId: string, dto: VerifyActionDto) {
    const before = await this.getBase(tenantId, actionId);
    if (before.assignedToId === actorId) throw new BadRequestException('Owner cannot verify own action');
    const verification = await this.db.single<any>(this.db.from('ActionVerification').insert({
      id: crypto.randomUUID(),
      tenantId,
      actionId,
      decision: dto.decision,
      notes: dto.notes ?? null,
      verifiedById: actorId
    }).select().single());
    const patch = dto.decision === 'APPROVED'
      ? { status: 'PENDING_VERIFICATION', verifiedById: actorId, verifiedAt: new Date().toISOString(), verificationNotes: dto.notes ?? null, updatedAt: new Date().toISOString() }
      : { status: 'IN_PROGRESS', verifiedById: null, verifiedAt: null, verificationNotes: dto.notes ?? null, updatedAt: new Date().toISOString() };
    const action = await this.db.single<any>(this.db.from('Action').update(patch).eq('tenantId', tenantId).eq('id', actionId).select().single());
    await this.history(tenantId, actionId, actorId, dto.decision === 'APPROVED' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED', before, { action, verification });
    await this.audit.write({ tenantId, actorId, action: dto.decision === 'APPROVED' ? 'ACTION_VERIFIED' : 'ACTION_VERIFICATION_REJECTED', entityType: 'Action', entityId: actionId, before: before as JsonValue, after: action as JsonValue });
    return action;
  }

  async watch(tenantId: string, actorId: string, actionId: string) {
    await this.getBase(tenantId, actionId);
    return this.db.single(this.db.from('ActionWatcher').upsert({ id: crypto.randomUUID(), tenantId, actionId, userId: actorId }, { onConflict: 'actionId,userId' }).select().single());
  }

  async dashboard(tenantId: string, userId: string, allowedSiteIds: string[] = [], selectedSiteId?: string | null, corporateView = false) {
    const filter: ActionFilterDto = { view: 'all' };
    if (!corporateView || selectedSiteId) filter.siteId = selectedSiteId ?? undefined;
    const actions = await this.list(tenantId, userId, filter, allowedSiteIds);
    const open = actions.filter((action: any) => !terminalStatuses.includes(action.status));
    return {
      totals: {
        all: actions.length,
        open: open.length,
        overdue: open.filter((action: any) => new Date(action.dueDate).getTime() < Date.now()).length,
        safetyCritical: open.filter((action: any) => action.priority === 'SAFETY_CRITICAL').length,
        pendingVerification: open.filter((action: any) => action.status === 'PENDING_VERIFICATION').length
      },
      byPriority: groupCount(open, 'priority'),
      byModule: groupCount(open, 'moduleKey'),
      byDepartment: groupCount(open, 'departmentId')
    };
  }

  async agingSummary(tenantId: string, userId: string, allowedSiteIds: string[] = [], selectedSiteId?: string | null, corporateView = false) {
    const filter: ActionFilterDto = { view: 'all' };
    if (!corporateView || selectedSiteId) filter.siteId = selectedSiteId ?? undefined;
    const actions = await this.list(tenantId, userId, filter, allowedSiteIds);
    const now = Date.now();
    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    actions.filter((action: any) => !terminalStatuses.includes(action.status)).forEach((action: any) => {
      const age = Math.max(0, Math.floor((now - new Date(action.createdAt).getTime()) / 86400000));
      if (age <= 30) buckets['0-30'] += 1;
      else if (age <= 60) buckets['31-60'] += 1;
      else if (age <= 90) buckets['61-90'] += 1;
      else buckets['90+'] += 1;
    });
    return buckets;
  }

  async export(tenantId: string, userId: string, filters: ActionFilterDto, allowedSiteIds: string[] = []) {
    const actions = await this.list(tenantId, userId, filters, allowedSiteIds);
    return {
      generatedAt: new Date().toISOString(),
      rows: actions.map((action: any) => ({
        actionNumber: action.actionNumber,
        title: action.title,
        sourceModule: action.moduleKey,
        sourceRecord: action.sourceId,
        owner: action.owner?.displayName ?? action.assignedToId,
        priority: action.priority,
        status: action.status,
        dueDate: action.dueDate,
        equipment: action.equipment ? `${action.equipment.tag} - ${action.equipment.name}` : '',
        site: action.site?.name ?? ''
      }))
    };
  }

  async runEscalations(tenantId: string, actorId: string) {
    const actions = await this.db.many<any>(
      this.db.from('Action')
        .select('*')
        .eq('tenantId', tenantId)
        .in('status', ['OPEN', 'IN_PROGRESS', 'PENDING_VERIFICATION'])
        .lt('dueDate', new Date().toISOString())
    );
    const results = [];
    for (const action of actions) {
      const overdueDays = Math.floor((Date.now() - new Date(action.dueDate).getTime()) / 86400000);
      const next = overdueDays >= 14 ? { level: 4, role: 'Plant Manager' }
        : overdueDays >= 7 ? { level: 3, role: 'Department Manager' }
        : overdueDays >= 3 ? { level: 2, role: 'Supervisor' }
        : overdueDays >= 1 ? { level: 1, role: 'Owner' }
        : null;
      if (!next || action.escalationLevel >= next.level) continue;
      const escalation = await this.db.single<any>(this.db.from('ActionEscalation').insert({
        id: crypto.randomUUID(),
        tenantId,
        actionId: action.id,
        level: next.level,
        recipientRole: next.role
      }).select().single());
      const updated = await this.db.single<any>(this.db.from('Action').update({
        escalationLevel: next.level,
        lastEscalationDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).eq('tenantId', tenantId).eq('id', action.id).select().single());
      await this.notification(tenantId, action.assignedToId, 'action.overdue', 'Action Overdue', `${action.actionNumber ?? action.id} is ${overdueDays} day(s) overdue`, action.id, action.siteId, overdueDays >= 7 ? 'Safety-Critical' : 'High');
      await this.history(tenantId, action.id, actorId, 'ACTION_ESCALATED', action, { escalation, action: updated });
      results.push(escalation);
    }
    return { escalated: results.length, results };
  }

  private async nextActionNumber(tenantId: string) {
    const year = new Date().getFullYear();
    const prefix = `ACT-${year}-`;
    const existing = await this.db.many<any>(
      this.db.from('Action').select('actionNumber').eq('tenantId', tenantId).like('actionNumber', `${prefix}%`).order('actionNumber', { ascending: false }).limit(1)
    );
    const last = existing[0]?.actionNumber ? Number(String(existing[0].actionNumber).split('-').pop()) : 0;
    return `${prefix}${String(last + 1).padStart(6, '0')}`;
  }

  private async getBase(tenantId: string, id: string) {
    const action = await this.db.single<any>(this.db.from('Action').select('*').eq('tenantId', tenantId).eq('id', id).maybeSingle());
    if (!action) throw new NotFoundException('Action not found');
    return action;
  }

  private assertSiteAccess(siteId: string | null | undefined, allowedSiteIds: string[]) {
    if (!siteId || !allowedSiteIds.length) return;
    if (!allowedSiteIds.includes(siteId)) throw new ForbiddenException('Action is outside the current user site access scope');
  }

  private async getComment(tenantId: string, id: string) {
    const comment = await this.db.single<any>(this.db.from('ActionComment').select('*').eq('tenantId', tenantId).eq('id', id).maybeSingle());
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  private async history(tenantId: string, actionId: string, actorId: string, event: string, before: unknown, after: unknown) {
    return this.db.single(this.db.from('ActionHistory').insert({ id: crypto.randomUUID(), tenantId, actionId, actorId, event, before, after }).select().single());
  }

  private async notification(tenantId: string, userId: string, type: string, title: string, body: string, actionId: string, siteId?: string | null, priority = 'Normal') {
    return this.notifications.notifyUser({
      tenantId,
      userId,
      siteId,
      type,
      module: 'actions',
      title,
      message: body,
      relatedRecordId: actionId,
      relatedRecordType: 'Action',
      relatedUrl: `/actions/${actionId}`,
      priority
    });
  }

  private async indexAction(tenantId: string, actionId: string) {
    const action = await this.db.single<any>(
      this.db.from('Action')
        .select('*, owner:User!Action_assignedToId_fkey(displayName,email), equipment:Equipment(tag,name)')
        .eq('tenantId', tenantId)
        .eq('id', actionId)
        .maybeSingle()
    );
    if (action) await this.searchIndex.indexAction(action);
  }
}

function groupCount(rows: any[], key: string) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = row[key] ?? 'Unassigned';
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}
