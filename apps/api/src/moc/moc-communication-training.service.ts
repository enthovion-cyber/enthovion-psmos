import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

@Injectable()
export class MocCommunicationTrainingService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly actions: ActionsService
  ) {}

  async aggregate(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const [stakeholders, plan, logs, acknowledgements, requirements, assignments, blockers] = await Promise.all([
      this.stakeholders(tenantId, id, scope),
      this.plan(tenantId, id, scope),
      this.logs(tenantId, id, scope),
      this.acknowledgements(tenantId, id, scope),
      this.trainingRequirements(tenantId, id, scope),
      this.trainingAssignments(tenantId, id, scope),
      this.startupBlockers(tenantId, id, scope)
    ]);
    return { summary: this.summary(stakeholders, plan, logs, acknowledgements, requirements, assignments, blockers), stakeholders, plan, logs, acknowledgements, trainingRequirements: requirements, trainingAssignments: assignments, startupBlockers: blockers, moc };
  }

  async summaryOnly(tenantId: string, id: string, scope: Scope) {
    return (await this.aggregate(tenantId, id, scope)).summary;
  }

  async startupBlockers(tenantId: string, id: string, scope: Scope) {
    await this.getMoc(tenantId, id, scope);
    const [ack, reqs, assignments] = await Promise.all([this.acknowledgements(tenantId, id, scope), this.trainingRequirements(tenantId, id, scope), this.trainingAssignments(tenantId, id, scope)]);
    const blockers = [
      ...ack.filter((item) => item.status === 'Pending' || item.status === 'Overdue').map((item) => ({ id: item.id, type: 'Acknowledgement', title: 'Required acknowledgement pending', severity: 'High', sourceRecordId: item.id })),
      ...reqs.filter((item) => item.required_before_startup && !['Completed', 'Verified', 'Waived'].includes(item.status)).map((item) => ({ id: item.id, type: 'Training', title: item.title ?? item.training_topic, severity: 'High', sourceRecordId: item.id })),
      ...assignments.filter((item) => item.status !== 'Verified' && item.status !== 'Waived').map((item) => ({ id: item.id, type: 'Training Assignment', title: 'Training assignment incomplete', severity: item.status === 'Overdue' ? 'Critical' : 'High', sourceRecordId: item.id }))
    ];
    return blockers;
  }

  stakeholders(tenantId: string, id: string, scope: Scope) {
    return this.getMoc(tenantId, id, scope).then(() => this.db.many<any>(this.db.from('moc_stakeholders').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at')));
  }

  async createStakeholder(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_stakeholders').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: id, stakeholder_type: dto.stakeholderType ?? 'Other', department_id: dto.departmentId ?? null, role_id: dto.roleId ?? null, user_id: dto.userId ?? null, group_id: dto.groupId ?? null, acknowledgement_required: dto.acknowledgementRequired ?? true, training_required: dto.trainingRequired ?? false, required_before_startup: dto.requiredBeforeStartup ?? false, required_before_closure: dto.requiredBeforeClosure ?? false, notes: dto.notes ?? null, created_by: actorId }).select().single());
    if (row.acknowledgement_required) await this.createAckForStakeholder(tenantId, moc, row);
    await this.history(tenantId, moc, actorId, 'Communication', 'MOC_STAKEHOLDER_ADDED', `${row.stakeholder_type} stakeholder added`, null, row);
    return row;
  }

  async updateStakeholder(tenantId: string, actorId: string, id: string, stakeholderId: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.db.single<any>(this.db.from('moc_stakeholders').select('*').eq('tenant_id', tenantId).eq('id', stakeholderId).maybeSingle());
    if (!before) throw new NotFoundException('Stakeholder not found');
    const patch = { stakeholder_type: dto.stakeholderType ?? before.stakeholder_type, department_id: dto.departmentId ?? before.department_id, role_id: dto.roleId ?? before.role_id, user_id: dto.userId ?? before.user_id, group_id: dto.groupId ?? before.group_id, acknowledgement_required: dto.acknowledgementRequired ?? before.acknowledgement_required, training_required: dto.trainingRequired ?? before.training_required, required_before_startup: dto.requiredBeforeStartup ?? before.required_before_startup, required_before_closure: dto.requiredBeforeClosure ?? before.required_before_closure, notes: dto.notes ?? before.notes, updated_at: new Date().toISOString() };
    const row = await this.db.single<any>(this.db.from('moc_stakeholders').update(patch).eq('tenant_id', tenantId).eq('id', stakeholderId).select().single());
    await this.history(tenantId, moc, actorId, 'Communication', 'MOC_STAKEHOLDER_UPDATED', `${row.stakeholder_type} stakeholder updated`, before, row);
    return row;
  }

  async deleteStakeholder(tenantId: string, actorId: string, id: string, stakeholderId: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_stakeholders').delete().eq('tenant_id', tenantId).eq('id', stakeholderId).select().single());
    await this.history(tenantId, moc, actorId, 'Communication', 'MOC_STAKEHOLDER_REMOVED', `${row.stakeholder_type} stakeholder removed`, row, null);
    return { deleted: true, id: stakeholderId };
  }

  async importFromImpact(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const answers = moc.impact?.answers ?? {};
    const types = new Set<string>();
    if (answers.trainingRequired) types.add('Operations');
    if (answers.operatingLimitsChanged || answers.sopUpdateRequired) { types.add('Operations'); types.add('Control Room'); }
    if (answers.equipmentAffected || answers.equipmentRegistryUpdateRequired) types.add('Maintenance');
    if (answers.sisAffected || answers.lopaReviewRequired) { types.add('HSE'); types.add('Engineering'); }
    if (!types.size) types.add('Operations');
    const rows = await this.db.many<any>(this.db.from('moc_stakeholders').insert(Array.from(types).map((type) => ({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: id, stakeholder_type: type, acknowledgement_required: true, training_required: Boolean(answers.trainingRequired), required_before_startup: Boolean(answers.trainingRequired), notes: 'Imported from Impact Assessment', created_by: actorId }))).select());
    await this.history(tenantId, moc, actorId, 'Communication', 'MOC_STAKEHOLDERS_IMPORTED_IMPACT', `${rows.length} stakeholder groups imported from impact assessment`, null, rows);
    return rows;
  }

  async importFromEquipment(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const rows = await this.db.many<any>(this.db.from('moc_stakeholders').insert(['Operations', 'Maintenance', 'Inspection / Mechanical Integrity'].map((type) => ({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: id, stakeholder_type: type, acknowledgement_required: true, notes: 'Imported from affected equipment / area', created_by: actorId }))).select());
    await this.history(tenantId, moc, actorId, 'Communication', 'MOC_STAKEHOLDERS_IMPORTED_EQUIPMENT', `${rows.length} stakeholder groups imported from equipment`, null, rows);
    return rows;
  }

  async plan(tenantId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const existing = await this.db.single<any>(this.db.from('moc_communication_plans').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle());
    if (existing) return existing;
    return this.db.single<any>(this.db.from('moc_communication_plans').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: id, objective: `Communicate ${moc.moc_number}`, message_summary: moc.title, method: 'In-app notification', status: 'Not Started' }).select().single());
  }

  async updatePlan(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.plan(tenantId, id, scope);
    if (!dto.effectiveDate && !before.effective_date) throw new BadRequestException('Communication effective date is required');
    const row = await this.db.single<any>(this.db.from('moc_communication_plans').update({ objective: dto.objective ?? before.objective, message_summary: dto.messageSummary ?? before.message_summary, key_change_points: dto.keyChangePoints ?? before.key_change_points, safety_precautions: dto.safetyPrecautions ?? before.safety_precautions, operational_restrictions: dto.operationalRestrictions ?? before.operational_restrictions, procedure_reference: dto.procedureReference ?? before.procedure_reference, effective_date: dto.effectiveDate ?? before.effective_date, communication_owner_id: dto.communicationOwnerId ?? before.communication_owner_id, planned_date: dto.plannedDate ?? before.planned_date, method: dto.method ?? before.method, status: dto.status ?? 'Planned', created_by: before.created_by ?? actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', before.id).select().single());
    await this.history(tenantId, moc, actorId, 'Communication', 'MOC_COMMUNICATION_PLAN_UPDATED', 'Communication plan updated', before, row);
    return row;
  }

  async sendCommunication(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const plan = await this.plan(tenantId, id, scope);
    if (!plan.effective_date && !dto.effectiveDate) throw new BadRequestException('Communication must include effective date');
    const stakeholders = await this.stakeholders(tenantId, id, scope);
    const log = await this.db.single<any>(this.db.from('moc_communication_logs').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: id, communication_number: `COMM-${Date.now()}`, method: dto.method ?? plan.method ?? 'In-app notification', subject: dto.subject ?? plan.objective ?? moc.title, message: dto.message ?? plan.message_summary ?? moc.description, sent_to: stakeholders.map((s) => ({ stakeholderId: s.id, type: s.stakeholder_type, userId: s.user_id, roleId: s.role_id })), sent_by: actorId, sent_at: new Date().toISOString(), status: 'Sent', acknowledgement_required: dto.acknowledgementRequired ?? stakeholders.some((s) => s.acknowledgement_required) }).select().single());
    await Promise.all(stakeholders.filter((s) => s.acknowledgement_required).map((s) => this.createAckForStakeholder(tenantId, moc, s, log.id)));
    await this.notifications.notifyUser({ tenantId, userId: moc.originator_id ?? actorId, companyId: moc.company_id, siteId: moc.site_id, type: 'moc.communication.sent', module: 'moc', title: 'MOC communication sent', message: log.subject, relatedRecordId: id, relatedRecordType: 'MOC', relatedUrl: `/moc/${id}`, priority: 'Normal' }).catch(() => null);
    await this.history(tenantId, moc, actorId, 'Communication', 'MOC_COMMUNICATION_SENT', log.subject, null, log);
    return log;
  }

  async scheduleCommunication(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    return this.updatePlan(tenantId, actorId, id, { ...dto, status: 'Scheduled' }, scope);
  }

  logs(tenantId: string, id: string, scope: Scope) {
    return this.getMoc(tenantId, id, scope).then(() => this.db.many<any>(this.db.from('moc_communication_logs').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at', { ascending: false })));
  }

  async resendLog(tenantId: string, actorId: string, id: string, logId: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.db.single<any>(this.db.from('moc_communication_logs').select('*').eq('tenant_id', tenantId).eq('id', logId).maybeSingle());
    if (!before) throw new NotFoundException('Communication log not found');
    const row = await this.db.single<any>(this.db.from('moc_communication_logs').update({ status: 'Sent', sent_by: actorId, sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', logId).select().single());
    await this.history(tenantId, moc, actorId, 'Communication', 'MOC_COMMUNICATION_RESENT', row.subject, before, row);
    return row;
  }

  async remindLog(tenantId: string, actorId: string, id: string, logId: string, scope: Scope) {
    const acks = await this.db.many<any>(this.db.from('moc_acknowledgements').update({ reminder_count: 1, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('moc_id', id).eq('communication_log_id', logId).neq('status', 'Acknowledged').select());
    const moc = await this.getMoc(tenantId, id, scope);
    await this.history(tenantId, moc, actorId, 'Communication', 'MOC_ACKNOWLEDGEMENT_REMINDER_SENT', `${acks.length} acknowledgement reminders sent`, null, acks);
    return acks;
  }

  acknowledgements(tenantId: string, id: string, scope: Scope) {
    return this.getMoc(tenantId, id, scope).then(() => this.db.many<any>(this.db.from('moc_acknowledgements').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at')));
  }

  async acknowledge(tenantId: string, actorId: string, id: string, ackId: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.db.single<any>(this.db.from('moc_acknowledgements').select('*').eq('tenant_id', tenantId).eq('id', ackId).maybeSingle());
    if (!before) throw new NotFoundException('Acknowledgement not found');
    if (before.user_id && before.user_id !== actorId) throw new BadRequestException('Users can only acknowledge their own assignment');
    const row = await this.db.single<any>(this.db.from('moc_acknowledgements').update({ status: 'Acknowledged', acknowledged_by: actorId, acknowledged_at: new Date().toISOString(), ip_address: dto.ipAddress ?? null, user_agent: dto.userAgent ?? null, comment: dto.comment ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', ackId).select().single());
    await this.history(tenantId, moc, actorId, 'Communication', 'MOC_ACKNOWLEDGEMENT_COMPLETED', 'Acknowledgement completed', before, row);
    return row;
  }

  async waiveAck(tenantId: string, actorId: string, id: string, ackId: string, dto: Record<string, any>, scope: Scope) {
    if (!dto.reason) throw new BadRequestException('Waiver requires written justification');
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.db.single<any>(this.db.from('moc_acknowledgements').select('*').eq('tenant_id', tenantId).eq('id', ackId).maybeSingle());
    const row = await this.db.single<any>(this.db.from('moc_acknowledgements').update({ status: 'Waived', waiver_reason: dto.reason, waived_by: actorId, waived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', ackId).select().single());
    await this.history(tenantId, moc, actorId, 'Communication', 'MOC_ACKNOWLEDGEMENT_WAIVED', dto.reason, before, row);
    return row;
  }

  remindAck(tenantId: string, actorId: string, id: string, ackId: string, scope: Scope) {
    return this.db.single<any>(this.db.from('moc_acknowledgements').update({ reminder_count: 1, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('moc_id', id).eq('id', ackId).select().single());
  }

  trainingRequirements(tenantId: string, id: string, scope: Scope) {
    return this.getMoc(tenantId, id, scope).then(() => this.db.many<any>(this.db.from('moc_training_requirements').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at')));
  }

  async createTrainingRequirement(tenantId: string, actorId: string, id: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_training_requirements').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: id, title: dto.title ?? dto.trainingTopic, description: dto.description ?? null, training_type: dto.trainingType ?? 'General awareness', role_name: dto.roleName ?? dto.requiredRoleName ?? 'Affected role', training_topic: dto.trainingTopic ?? dto.title, required_role_id: dto.requiredRoleId ?? null, required_department_id: dto.requiredDepartmentId ?? null, owner_id: dto.ownerId ?? actorId, due_date: dto.dueDate ?? null, required_before_startup: dto.requiredBeforeStartup ?? true, required_before_closure: dto.requiredBeforeClosure ?? false, evidence_required: dto.evidenceRequired ?? false, verification_required: dto.verificationRequired ?? false, linked_training_record_id: dto.linkedTrainingRecordId ?? null, status: dto.status ?? 'Assigned', created_by: actorId }).select().single());
    if (dto.createAction) {
      const action = await this.actions.create(tenantId, actorId, { sourceModule: 'moc', sourceRecordId: id, sourceType: 'Training Requirement', title: row.title, description: row.description ?? row.training_topic, priority: 'HIGH', ownerId: row.owner_id ?? actorId, dueDate: row.due_date, siteId: moc.site_id, evidenceRequired: row.evidence_required, verificationRequired: row.verification_required } as any);
      await this.db.single(this.db.from('moc_training_requirements').update({ linked_action_id: action.id }).eq('tenant_id', tenantId).eq('id', row.id).select().single());
    }
    await this.history(tenantId, moc, actorId, 'Training', 'MOC_TRAINING_REQUIREMENT_CREATED', row.title, null, row);
    return row;
  }

  async updateTrainingRequirement(tenantId: string, actorId: string, id: string, requirementId: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.db.single<any>(this.db.from('moc_training_requirements').select('*').eq('tenant_id', tenantId).eq('id', requirementId).maybeSingle());
    if (!before) throw new NotFoundException('Training requirement not found');
    const row = await this.db.single<any>(this.db.from('moc_training_requirements').update({ title: dto.title ?? before.title, description: dto.description ?? before.description, training_type: dto.trainingType ?? before.training_type, owner_id: dto.ownerId ?? before.owner_id, due_date: dto.dueDate ?? before.due_date, required_before_startup: dto.requiredBeforeStartup ?? before.required_before_startup, required_before_closure: dto.requiredBeforeClosure ?? before.required_before_closure, evidence_required: dto.evidenceRequired ?? before.evidence_required, verification_required: dto.verificationRequired ?? before.verification_required, status: dto.status ?? before.status, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', requirementId).select().single());
    await this.history(tenantId, moc, actorId, 'Training', 'MOC_TRAINING_REQUIREMENT_UPDATED', row.title, before, row);
    return row;
  }

  async deleteTrainingRequirement(tenantId: string, actorId: string, id: string, requirementId: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_training_requirements').delete().eq('tenant_id', tenantId).eq('id', requirementId).select().single());
    await this.history(tenantId, moc, actorId, 'Training', 'MOC_TRAINING_REQUIREMENT_DELETED', row.title ?? row.training_topic, row, null);
    return { deleted: true, id: requirementId };
  }

  async generateTrainingFromImpact(tenantId: string, actorId: string, id: string, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const answers = moc.impact?.answers ?? {};
    const rows: any[] = [];
    const add = (condition: boolean, title: string, type: string, roleName: string) => condition && rows.push({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: id, title, description: `Generated from Impact Assessment: ${title}`, training_type: type, role_name: roleName, training_topic: title, required_before_startup: true, evidence_required: true, verification_required: true, status: 'Assigned', created_by: actorId });
    add(Boolean(answers.sopUpdateRequired), 'SOP change training', 'SOP training', 'Operations');
    add(Boolean(answers.operatingLimitsChanged), 'Operating limits training', 'Operating limits training', 'Control Room');
    add(Boolean(answers.equipmentAffected), 'Equipment change briefing', 'Equipment change briefing', 'Maintenance');
    add(Boolean(answers.sisAffected), 'Safety system training', 'Safety system training', 'Operations / HSE');
    add(Boolean(answers.trainingRequired) && !rows.length, 'General MOC awareness training', 'General awareness', 'Affected roles');
    if (!rows.length) return [];
    const inserted = await this.db.many<any>(this.db.from('moc_training_requirements').insert(rows).select());
    await this.history(tenantId, moc, actorId, 'Training', 'MOC_TRAINING_GENERATED_FROM_IMPACT', `${inserted.length} training requirement(s) generated`, null, inserted);
    return inserted;
  }

  async assignTraining(tenantId: string, actorId: string, id: string, requirementId: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const users = dto.userIds?.length ? dto.userIds : [dto.userId ?? null];
    const rows = await this.db.many<any>(this.db.from('moc_training_assignments').insert(users.map((userId: string | null) => ({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: id, training_requirement_id: requirementId, user_id: userId, role_id: dto.roleId ?? null, department_id: dto.departmentId ?? null, status: 'Assigned' }))).select());
    await this.history(tenantId, moc, actorId, 'Training', 'MOC_TRAINING_ASSIGNED', `${rows.length} training assignment(s) created`, null, rows);
    return rows;
  }

  trainingAssignments(tenantId: string, id: string, scope: Scope) {
    return this.getMoc(tenantId, id, scope).then(() => this.db.many<any>(this.db.from('moc_training_assignments').select('*').eq('tenant_id', tenantId).eq('moc_id', id).order('created_at')));
  }

  async updateTrainingAssignment(tenantId: string, actorId: string, id: string, assignmentId: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.db.single<any>(this.db.from('moc_training_assignments').select('*').eq('tenant_id', tenantId).eq('id', assignmentId).maybeSingle());
    const row = await this.db.single<any>(this.db.from('moc_training_assignments').update({ status: dto.status ?? before?.status, evidence_attachment_id: dto.evidenceAttachmentId ?? before?.evidence_attachment_id, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', assignmentId).select().single());
    await this.history(tenantId, moc, actorId, 'Training', 'MOC_TRAINING_ASSIGNMENT_UPDATED', 'Training assignment updated', before, row);
    return row;
  }

  completeAssignment(tenantId: string, actorId: string, id: string, assignmentId: string, dto: Record<string, any>, scope: Scope) {
    return this.updateTrainingAssignment(tenantId, actorId, id, assignmentId, { status: 'Completed', evidenceAttachmentId: dto.evidenceAttachmentId, completedAt: new Date().toISOString() }, scope).then(async (row) => {
      await this.db.single(this.db.from('moc_training_assignments').update({ completed_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', assignmentId).select().single());
      return row;
    });
  }

  async verifyAssignment(tenantId: string, actorId: string, id: string, assignmentId: string, dto: Record<string, any>, scope: Scope) {
    const moc = await this.getMoc(tenantId, id, scope);
    const before = await this.db.single<any>(this.db.from('moc_training_assignments').select('*').eq('tenant_id', tenantId).eq('id', assignmentId).maybeSingle());
    const row = await this.db.single<any>(this.db.from('moc_training_assignments').update({ status: 'Verified', verified_by: actorId, verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', assignmentId).select().single());
    await this.history(tenantId, moc, actorId, 'Training', 'MOC_TRAINING_VERIFIED', dto.comment ?? 'Training verified', before, row);
    return row;
  }

  async waiveAssignment(tenantId: string, actorId: string, id: string, assignmentId: string, dto: Record<string, any>, scope: Scope) {
    if (!dto.reason) throw new BadRequestException('Waiver requires reason');
    const moc = await this.getMoc(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('moc_training_assignments').update({ status: 'Waived', waiver_reason: dto.reason, waived_by: actorId, waived_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', assignmentId).select().single());
    await this.history(tenantId, moc, actorId, 'Training', 'MOC_TRAINING_WAIVED', dto.reason, null, row);
    return row;
  }

  private summary(stakeholders: any[], plan: any, logs: any[], acknowledgements: any[], requirements: any[], assignments: any[], blockers: any[]) {
    const requiredAck = acknowledgements.filter((item) => item.status !== 'Not Required');
    const ackDone = requiredAck.filter((item) => ['Acknowledged', 'Waived'].includes(item.status)).length;
    const completedTraining = assignments.filter((item) => ['Completed', 'Verified', 'Waived'].includes(item.status)).length;
    return {
      communicationStatus: plan?.status ?? (logs.length ? 'In Progress' : 'Not Started'),
      trainingRequired: requirements.length > 0 || stakeholders.some((item) => item.training_required),
      trainingCompletionPercent: assignments.length ? Math.round((completedTraining / assignments.length) * 100) : (requirements.length ? 0 : 100),
      acknowledgementCompletionPercent: requiredAck.length ? Math.round((ackDone / requiredAck.length) * 100) : 100,
      totalStakeholders: stakeholders.length,
      pendingAcknowledgements: requiredAck.length - ackDone,
      requiredTrainingRoles: Array.from(new Set(requirements.map((item) => item.role_name).filter(Boolean))),
      trainingRecordsCompleted: completedTraining,
      startupBlockingTrainingIncompleteCount: blockers.length,
      lastCommunicationSent: logs.find((item) => item.sent_at)?.sent_at ?? null,
      lastUpdatedBy: plan?.created_by ?? null,
      lastUpdatedAt: plan?.updated_at ?? null
    };
  }

  private createAckForStakeholder(tenantId: string, moc: any, stakeholder: any, logId?: string) {
    return this.db.single(this.db.from('moc_acknowledgements').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, communication_log_id: logId ?? null, stakeholder_id: stakeholder.id, user_id: stakeholder.user_id, role_id: stakeholder.role_id, status: stakeholder.acknowledgement_required ? 'Pending' : 'Not Required' }).select().single()).catch(() => null);
  }

  private async getMoc(tenantId: string, id: string, scope: Scope) {
    const moc = await this.db.single<any>(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!moc) throw new NotFoundException('MOC not found');
    if (scope.selectedSiteId && moc.site_id !== scope.selectedSiteId) throw new NotFoundException('MOC not found for selected site');
    if (!scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(moc.site_id)) throw new NotFoundException('MOC not found for allowed sites');
    const impact = await this.db.single<any>(this.db.from('moc_impact_assessments').select('*').eq('tenant_id', tenantId).eq('moc_id', id).maybeSingle());
    return { ...moc, impact };
  }

  private async history(tenantId: string, moc: any, actorId: string, category: string, eventType: string, title: string, before: unknown, after: unknown) {
    await this.db.single(this.db.from('moc_history_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: moc.company_id, site_id: moc.site_id, moc_id: moc.id, event_category: category, event_type: eventType, title, event_title: title, actor_id: actorId, user_id: actorId, before_value: before ?? null, after_value: after ?? null, is_safety_critical: ['High', 'Critical'].includes(moc.risk_level) }).select().single());
    await this.audit.write({ tenantId, actorId, action: eventType, entityType: 'MOC', entityId: moc.id, before: before as JsonValue, after: after as JsonValue }).catch(() => null);
  }
}
