import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchIndexService } from '../search/search-index.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { ActionsService } from '../actions/actions.service';
import { AddGasTestDto } from './dto/add-gas-test.dto';
import { AddIsolationDto } from './dto/add-isolation.dto';
import { AddSignatureDto } from './dto/add-signature.dto';
import { AddWorkforceDto } from './dto/add-workforce.dto';
import { ClosureChecklistDto } from './dto/closure-checklist.dto';
import { ClosePermitDto } from './dto/close-permit.dto';
import { ConfirmIsolationDto } from './dto/confirm-isolation.dto';
import { CreatePermitDto } from './dto/create-permit.dto';
import { CreatePermitTemplateDto } from './dto/create-permit-template.dto';
import { ExtendPermitDto } from './dto/extend-permit.dto';
import { GasThresholdDto } from './dto/gas-threshold.dto';
import { HandoverAcknowledgeDto, HandoverChecklistDto, ShiftHandoverDto, SuspendHandoverDto } from './dto/shift-handover.dto';
import { IssuePermitDto } from './dto/issue-permit.dto';
import { PermitAttachmentDto } from './dto/attachment.dto';
import { PermitFilterDto } from './dto/permit-filter.dto';
import { SuspendPermitDto } from './dto/suspend-permit.dto';
import { UpdateGasTestDto } from './dto/update-gas-test.dto';
import { UpdateIsolationDto } from './dto/update-isolation.dto';
import { UpdateWorkforceDto } from './dto/update-workforce.dto';
import { UpdatePermitDto } from './dto/update-permit.dto';
import { WorkforceAccountabilityDto, WorkforceBriefingDto, WorkforceBulkDto, WorkerBriefingDto } from './dto/workforce-briefing.dto';
import { PermitClosedEvent } from './events/permit-closed.event';
import { ConflictMatrixRuleDto, ConflictOverrideDto, ConflictRejectDto, SimopsControlDto, SimopsReviewDto, UpdateConflictDto } from './dto/conflict-simops.dto';
import { RejectPermitSignatureDto, SignatureRequirementDto, SignPermitSignatureDto } from './dto/signature-tab.dto';
import { PermitConflictEvent } from './events/permit-conflict.event';
import { PermitIssuedEvent } from './events/permit-issued.event';
import { PermitSuspendedEvent } from './events/permit-suspended.event';
import { PermitMapper } from './mappers/permit.mapper';
import { ClosePermitPolicy } from './policies/close-permit.policy';
import { ExtendPermitPolicy } from './policies/extend-permit.policy';
import { IssuePermitPolicy } from './policies/issue-permit.policy';
import { PermitRepository } from './repositories/permit.repository';
import { ElectronicSignatureAdapter } from './services/electronic-signature.adapter';
import { PtwSignatureService } from './services/ptw-signature.service';
import { SignatureRequirementService } from './services/signature-requirement.service';
import { ClosureCompleteValidator } from './validators/closure-complete.validator';
import { GasLimitsValidator } from './validators/gas-limits.validator';
import { IsolationCompleteValidator } from './validators/isolation-complete.validator';
import { PermitConflictValidator } from './validators/permit-conflict.validator';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type UploadedPtwFile = { originalname: string; mimetype: string; size: number; buffer: Buffer };

const handoverChecklist = [
  ['workScopeReviewed', 'Work scope reviewed'],
  ['permitStatusReviewed', 'Permit status reviewed'],
  ['workProgressReviewed', 'Work progress reviewed'],
  ['isolationVerifiedAndValid', 'Isolation verified and valid'],
  ['gasTestWithinValidPeriod', 'Gas test within valid period'],
  ['workforceAccountabilityReviewed', 'Workforce/accountability reviewed'],
  ['openConflictsReviewed', 'Open conflicts reviewed'],
  ['areaInspected', 'Area inspected'],
  ['emergencyContactsReviewed', 'Emergency contacts reviewed'],
  ['permitExpiryReviewed', 'Permit expiry reviewed'],
  ['requiredAttachmentsReviewed', 'Required attachments reviewed'],
  ['controlRoomNotifiedIfRequired', 'Control room notified if required']
] as const;

@Injectable()
export class PtwService {
  constructor(
    private readonly repo: PermitRepository,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly searchIndex: SearchIndexService,
    private readonly workflows: WorkflowsService,
    private readonly actions: ActionsService,
    private readonly events: EventEmitter2,
    private readonly gasLimits: GasLimitsValidator,
    private readonly conflicts: PermitConflictValidator,
    private readonly isolationComplete: IsolationCompleteValidator,
    private readonly closureComplete: ClosureCompleteValidator,
    private readonly issuePolicy: IssuePermitPolicy,
    private readonly closePolicy: ClosePermitPolicy,
    private readonly extendPolicy: ExtendPermitPolicy
  ) {}

  async list(tenantId: string, filters: PermitFilterDto, scope: Scope) {
    const rawFilters = filters as any;
    const permitType = filters.permitType ?? rawFilters.permit_type;
    const riskLevel = filters.riskLevel ?? rawFilters.risk_level;
    const unitId = filters.unitId ?? rawFilters.unit_id;
    const areaId = filters.areaId ?? rawFilters.area_id;
    const equipmentId = filters.equipmentId ?? rawFilters.equipment_id;
    const holderId = filters.holderId ?? rawFilters.holder_id;
    const contractorCompanyId = filters.contractorCompanyId ?? rawFilters.contractor_company_id;
    const expiringWithin = filters.expiringWithin ?? rawFilters.expiring_within;
    const hasConflict = filters.hasConflict ?? rawFilters.has_conflict;
    const gasRetestDue = filters.gasRetestDue ?? rawFilters.gas_retest_due;
    const isolationPending = filters.isolationPending ?? rawFilters.isolation_pending;
    const handoverPending = filters.handoverPending ?? rawFilters.handover_pending;
    let query = this.repo.permits()
      .select('*, equipment:Equipment(id,tag,name,type,criticality,safetyCritical,fluidService,hazardClass), issuer:User!permits_issuer_id_fkey(id,displayName,title), holder:User!permits_holder_id_fkey(id,displayName,title), site:Site(id,name,code), unit:Unit(id,name,code), area:Area(id,name,code)')
      .eq('tenant_id', tenantId);
    if (filters.status) query = query.eq('status', filters.status);
    if (permitType) query = query.eq('permit_type', permitType);
    if (riskLevel) query = query.eq('risk_level', riskLevel);
    if (unitId) query = query.eq('unit_id', unitId);
    if (areaId) query = query.eq('area_id', areaId);
    if (contractorCompanyId) query = query.eq('contractor_company_id', contractorCompanyId);
    if (filters.issuerId) query = query.eq('issuer_id', filters.issuerId);
    if (holderId) query = query.eq('holder_id', holderId);
    if (equipmentId) query = query.eq('equipment_id', equipmentId);
    if (filters.dateFrom) query = query.gte('planned_start_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('planned_end_at', filters.dateTo);
    if (expiringWithin) {
      const hours = Number(expiringWithin);
      if (Number.isFinite(hours) && hours > 0) {
        query = query
          .gte('planned_end_at', new Date().toISOString())
          .lte('planned_end_at', new Date(Date.now() + hours * 60 * 60 * 1000).toISOString());
      }
    }
    if (filters.siteId) query = query.eq('site_id', filters.siteId);
    else if (scope.selectedSiteId) query = query.eq('site_id', scope.selectedSiteId);
    else if (!scope.corporateView && scope.allowedSiteIds?.length) query = query.in('site_id', scope.allowedSiteIds);
    if (filters.search) query = query.or(`permit_number.ilike.%${filters.search}%,title.ilike.%${filters.search}%,equipment_tag.ilike.%${filters.search}%,work_description.ilike.%${filters.search}%`);
    const page = Math.max(Number(filters.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(filters.limit ?? 25), 1), 100);
    const [sortColumnRaw, sortDirection] = String(filters.sort ?? 'planned_end_at:asc').split(':');
    const sortColumn = sortColumnRaw ?? 'planned_end_at';
    const allowedSort = new Set(['planned_end_at', 'planned_start_at', 'permit_number', 'status', 'risk_level', 'permit_type', 'created_at']);
    const orderBy = allowedSort.has(sortColumn) ? sortColumn : 'planned_end_at';
    const rows = await this.repo.db.many<any>(query.order(orderBy, { ascending: sortDirection !== 'desc' }).range(0, 499));
    return this.applyOperationalPermitFilters(tenantId, rows, { ...filters, hasConflict, gasRetestDue, isolationPending, handoverPending }).then((filtered) => filtered.slice((page - 1) * limit, page * limit));
  }

  async get(tenantId: string, id: string, scope: Scope) {
    const permit = await this.repo.db.single<any>(
      this.repo.permits()
        .select('*, equipment:Equipment(id,tag,name,type,criticality,safetyCritical,fluidService,hazardClass), issuer:User!permits_issuer_id_fkey(id,displayName,title), holder:User!permits_holder_id_fkey(id,displayName,title), site:Site(id,name,code), unit:Unit(id,name,code), area:Area(id,name,code)')
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .maybeSingle()
    );
    if (!permit) throw new NotFoundException('Permit not found');
    this.assertSiteAccess(permit.site_id, scope);
    const [isolations, gasTests, conflicts, workforce, handovers, attachments, history, signatures, extensions, closureChecklist] = await Promise.all([
      this.repo.db.many(this.repo.isolations().select('*').eq('tenant_id', tenantId).eq('permit_id', id).order('created_at')),
      this.repo.db.many(this.repo.gasTests().select('*').eq('tenant_id', tenantId).eq('permit_id', id).order('tested_at', { ascending: false })),
      this.repo.db.many(this.repo.conflicts().select('*, conflicting_permit:permits!permit_conflicts_conflicting_permit_id_fkey(id,permit_number,permit_type,status,title)').eq('tenant_id', tenantId).eq('permit_id', id).order('created_at', { ascending: false })),
      this.repo.db.many(this.repo.workforce().select('*').eq('tenant_id', tenantId).eq('permit_id', id).order('created_at')),
      this.repo.db.many(this.repo.handover().select('*').eq('tenant_id', tenantId).eq('permit_id', id).order('created_at', { ascending: false })),
      this.repo.db.many(this.repo.attachments().select('*').eq('tenant_id', tenantId).eq('permit_id', id).order('created_at', { ascending: false })),
      this.repo.db.many(this.repo.history().select('*').eq('tenant_id', tenantId).eq('permit_id', id).order('created_at', { ascending: false })),
      this.repo.db.many(this.repo.signatures().select('*').eq('tenant_id', tenantId).eq('permit_id', id).order('created_at', { ascending: false })),
      this.repo.db.many(this.repo.extensions().select('*').eq('tenant_id', tenantId).eq('permit_id', id).order('created_at', { ascending: false })),
      this.repo.db.single<any>(this.repo.closureChecklists().select('*').eq('tenant_id', tenantId).eq('permit_id', id).maybeSingle())
    ]);
    return { ...permit, isolations, gasTests, conflicts, workforce, handovers, attachments, history, signatures, extensions, closureChecklist };
  }

  async preview(tenantId: string, id: string, scope: Scope) {
    const permit = await this.get(tenantId, id, scope);
    const latestGas = permit.gasTests?.[0] ?? null;
    const openConflicts = (permit.conflicts ?? []).filter((item: any) => item.status === 'Open');
    const isolationTotal = permit.isolations?.length ?? 0;
    const isolationComplete = (permit.isolations ?? []).filter((item: any) => ['Confirmed', 'Verified', 'Fully Isolated'].includes(item.isolation_status ?? item.status)).length;
    const signed = (permit.signatures ?? []).filter((item: any) => item.status === 'Signed').length;
    return {
      ...permit,
      preview: {
        expiryCountdownMs: this.dateMs(permit.planned_end_at) - Date.now(),
        gasStatus: latestGas?.result ?? 'No Test',
        nextGasRetestDueAt: latestGas?.next_test_due_at ?? latestGas?.next_retest_due_at ?? null,
        isolation: { total: isolationTotal, completed: isolationComplete, percent: isolationTotal ? Math.round((isolationComplete / isolationTotal) * 100) : 100 },
        workforce: { total: permit.workforce?.length ?? 0, maxPersonnel: permit.max_personnel ?? null },
        conflicts: { open: openConflicts.length, highestSeverity: openConflicts[0]?.severity ?? 'None' },
        handoverStatus: this.isHandoverPending(permit) ? 'Pending' : 'Current',
        signatures: { signed, total: permit.signatures?.length ?? 0 },
        lastHistoryEvent: permit.history?.[0] ?? null
      }
    };
  }

  async create(tenantId: string, actorId: string, dto: CreatePermitDto, scope: Scope) {
    this.assertSiteAccess(dto.siteId, scope);
    const equipment = dto.equipmentId ? await this.getEquipment(tenantId, dto.equipmentId) : null;
    const now = new Date().toISOString();
    const generated = this.permitTypeDefaults(dto.permitType);
    const requiredControls = this.mergePermitSafetyPayload(generated.requiredControls, dto.requiredControls);
    const typeSpecificData = this.mergePermitSafetyPayload(generated.typeSpecificData, dto.typeSpecificData);
    const permit = await this.repo.db.single<any>(this.repo.permits().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: await this.companyForSite(dto.siteId),
      site_id: dto.siteId,
      unit_id: dto.unitId ?? equipment?.unitId ?? null,
      area_id: dto.areaId ?? equipment?.areaId ?? null,
      permit_number: await this.nextPermitNumber(tenantId, dto.siteId),
      permit_type: dto.permitType,
      title: dto.title,
      work_description: dto.workDescription,
      status: 'Draft',
      risk_level: equipment?.safetyCritical || equipment?.criticality === 'HIGH' ? 'High' : dto.riskLevel ?? 'Medium',
      equipment_id: equipment?.id ?? null,
      equipment_tag: equipment?.tag ?? null,
      equipment_name: equipment?.name ?? null,
      location: dto.location ?? null,
      job_area: dto.jobArea ?? equipment?.area?.name ?? null,
      issuer_id: actorId,
      holder_id: dto.holderId ?? null,
      area_authority_id: dto.areaAuthorityId ?? null,
      contractor_company_id: dto.contractorCompanyId ?? null,
      planned_start_at: dto.plannedStartAt,
      planned_end_at: dto.plannedEndAt,
      required_controls: requiredControls,
      type_specific_data: typeSpecificData,
      max_personnel: dto.maxPersonnel ?? null,
      created_by: actorId,
      updated_at: now
    }).select().single());
    if (equipment) await this.linkEquipment(tenantId, actorId, permit, equipment);
    await this.history(tenantId, actorId, permit, 'PERMIT_CREATED', 'Permit created', null, permit);
    await this.audit.write({ tenantId, actorId, action: 'PTW_CREATED', entityType: 'Permit', entityId: permit.id, after: permit as JsonValue });
    await this.indexPermit(tenantId, permit.id);
    return this.get(tenantId, permit.id, scope);
  }

  async update(tenantId: string, actorId: string, id: string, dto: UpdatePermitDto, scope: Scope) {
    const before = await this.getBase(tenantId, id, scope);
    if (['Closed', 'Cancelled'].includes(before.status)) throw new BadRequestException('Closed or cancelled permits cannot be edited');
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const nextPermitType = dto.permitType ?? before.permit_type;
    for (const [dtoKey, dbKey] of Object.entries({
      permitType: 'permit_type',
      title: 'title',
      workDescription: 'work_description',
      riskLevel: 'risk_level',
      siteId: 'site_id',
      unitId: 'unit_id',
      areaId: 'area_id',
      location: 'location',
      jobArea: 'job_area',
      holderId: 'holder_id',
      areaAuthorityId: 'area_authority_id',
      contractorCompanyId: 'contractor_company_id',
      plannedStartAt: 'planned_start_at',
      plannedEndAt: 'planned_end_at',
      requiredControls: 'required_controls',
      typeSpecificData: 'type_specific_data',
      maxPersonnel: 'max_personnel'
    })) {
      const value = (dto as any)[dtoKey];
      if (value !== undefined) patch[dbKey] = value || null;
    }
    if (dto.permitType !== undefined || dto.requiredControls !== undefined || dto.typeSpecificData !== undefined) {
      const generated = this.permitTypeDefaults(nextPermitType);
      patch.required_controls = this.mergePermitSafetyPayload(generated.requiredControls, dto.requiredControls ?? before.required_controls ?? {});
      patch.type_specific_data = this.mergePermitSafetyPayload(generated.typeSpecificData, dto.typeSpecificData ?? before.type_specific_data ?? {});
    }
    if (dto.equipmentId !== undefined) {
      const equipment = dto.equipmentId ? await this.getEquipment(tenantId, dto.equipmentId) : null;
      patch.equipment_id = equipment?.id ?? null;
      patch.equipment_tag = equipment?.tag ?? null;
      patch.equipment_name = equipment?.name ?? null;
    }
    const permit = await this.repo.db.single<any>(this.repo.permits().update(patch).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, actorId, permit, 'PERMIT_UPDATED', 'Permit updated', before, permit);
    await this.audit.write({ tenantId, actorId, action: 'PTW_UPDATED', entityType: 'Permit', entityId: id, before: before as JsonValue, after: permit as JsonValue });
    await this.indexPermit(tenantId, id);
    return this.get(tenantId, id, scope);
  }

  async submit(tenantId: string, actorId: string, id: string, scope: Scope) {
    const before = await this.getBase(tenantId, id, scope);
    if (before.status !== 'Draft') throw new BadRequestException('Only draft permits can be submitted');
    let workflowInstanceId: string | null = null;
    try {
      const workflow = await this.workflows.startWorkflow(tenantId, actorId, {
        module: 'PTW',
        recordId: id,
        recordNumber: before.permit_number,
        companyId: before.company_id,
        siteId: before.site_id,
        contextData: { permitType: before.permit_type, riskLevel: before.risk_level, equipmentId: before.equipment_id }
      }, scope);
      workflowInstanceId = workflow.id;
    } catch {
      workflowInstanceId = null;
    }
    return this.transition(tenantId, actorId, id, 'Submitted', 'PERMIT_SUBMITTED', 'Permit submitted for approval', scope, { workflow_instance_id: workflowInstanceId });
  }

  async approve(tenantId: string, actorId: string, id: string, scope: Scope) {
    const full = await this.get(tenantId, id, scope);
    this.assertLifecycleSignatures(full, 'Approved', ['Permit Holder', 'Permit Issuer']);
    return this.transition(tenantId, actorId, id, 'Approved', 'PERMIT_APPROVED', 'Permit approved', scope);
  }

  async issue(tenantId: string, actorId: string, id: string, dto: IssuePermitDto, scope: Scope) {
    const permit = await this.getBase(tenantId, id, scope);
    this.issuePolicy.assertCanIssue(permit);
    const full = await this.get(tenantId, id, scope);
    this.assertLifecycleSignatures(full, 'Issued', ['Permit Holder', 'Permit Issuer', 'Area Authority']);
    const issued = await this.transition(tenantId, actorId, id, 'Issued', 'PERMIT_ISSUED', 'Permit issued', scope, { issued_at: new Date().toISOString() });
    await this.signature(tenantId, actorId, issued, 'Issue', dto.signature ?? dto.acknowledgement);
    this.events.emit('permit.issued', new PermitIssuedEvent({ tenantId, permitId: id }));
    return issued;
  }

  async activate(tenantId: string, actorId: string, id: string, scope: Scope) {
    const full = await this.get(tenantId, id, scope);
    if (!['Issued', 'Extended'].includes(full.status)) throw new BadRequestException(`Cannot activate permit from ${full.status}`);
    this.assertLifecycleSignatures(full, 'Active', ['Permit Holder', 'Permit Issuer', 'Area Authority']);
    this.assertWorkforceReady(full);
    this.isolationComplete.assertComplete(full, full.isolations);
    await this.assertRequiredAttachmentsReady(tenantId, id, scope);
    const gasSummary = await this.gasTestSummary(tenantId, id, scope);
    if (gasSummary.blockers.length) throw new BadRequestException(gasSummary.blockers.join(' '));
    const conflicts = await this.detectAndStoreConflicts(tenantId, actorId, full);
    if (conflicts.some((conflict) => conflict.status === 'Open')) throw new BadRequestException('Open permit conflicts must be resolved before activation');
    return this.transition(tenantId, actorId, id, 'Active', 'PERMIT_ACTIVATED', 'Permit activated', scope, { activated_at: new Date().toISOString() });
  }

  async suspend(tenantId: string, actorId: string, id: string, dto: SuspendPermitDto, scope: Scope) {
    const suspended = await this.transition(tenantId, actorId, id, 'Suspended', 'PERMIT_SUSPENDED', dto.reason, scope, { suspended_at: new Date().toISOString() });
    this.events.emit('permit.suspended', new PermitSuspendedEvent({ tenantId, permitId: id, reason: dto.reason }));
    const actionInput: any = {
      sourceModule: 'PTW',
      sourceType: 'Permit',
      sourceRecordId: id,
      title: `Resolve suspended permit ${suspended.permit_number}`,
      description: dto.reason,
      priority: 'HIGH',
      ownerId: suspended.area_authority_id ?? actorId,
      siteId: suspended.site_id,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    if (suspended.equipment_id) actionInput.equipmentId = suspended.equipment_id;
    await this.actions.create(tenantId, actorId, actionInput);
    return suspended;
  }

  async extend(tenantId: string, actorId: string, id: string, dto: ExtendPermitDto, scope: Scope) {
    const before = await this.getBase(tenantId, id, scope);
    this.extendPolicy.assertCanExtend(before, dto.newExpiryAt);
    const extension = await this.repo.db.single<any>(this.repo.extensions().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: before.company_id,
      site_id: before.site_id,
      permit_id: id,
      old_expiry_at: before.planned_end_at,
      new_expiry_at: dto.newExpiryAt,
      reason: dto.reason,
      approved_by: actorId,
      created_by: actorId
    }).select().single());
    const permit = await this.transition(tenantId, actorId, id, 'Extended', 'PERMIT_EXTENDED', dto.reason, scope, { planned_end_at: dto.newExpiryAt, extension_count: (before.extension_count ?? 0) + 1 });
    await this.audit.write({ tenantId, actorId, action: 'PTW_EXTENDED', entityType: 'Permit', entityId: id, after: extension as JsonValue });
    return permit;
  }

  async close(tenantId: string, actorId: string, id: string, dto: ClosePermitDto, scope: Scope) {
    const full = await this.get(tenantId, id, scope);
    this.closePolicy.assertCanClose(full);
    this.assertLifecycleSignatures(full, 'Closed', ['Closure Authority']);
    await this.assertRequiredAttachmentsReady(tenantId, id, scope);
    const workforceClosureBlockers = this.workforceClosureBlockers(full, full.workforce ?? []);
    if (workforceClosureBlockers.length && !dto.overrideReason) throw new BadRequestException(workforceClosureBlockers.join(' '));
    this.closureComplete.assertComplete(full.closureChecklist, full.workforce, full.isolations, dto.overrideReason);
    const closed = await this.transition(tenantId, actorId, id, 'Closed', 'PERMIT_CLOSED', dto.notes ?? 'Permit closed', scope, { closed_at: new Date().toISOString() });
    this.events.emit('permit.closed', new PermitClosedEvent({ tenantId, permitId: id }));
    return closed;
  }

  cancel(tenantId: string, actorId: string, id: string, dto: SuspendPermitDto, scope: Scope) {
    return this.transition(tenantId, actorId, id, 'Cancelled', 'PERMIT_CANCELLED', dto.reason, scope, { cancelled_at: new Date().toISOString() });
  }

  async summary(tenantId: string, permitId: string, scope: Scope) {
    const permit = await this.get(tenantId, permitId, scope);
    const latestGasTest = permit.gasTests?.[0] ?? null;
    const isolationTotal = permit.isolations?.length ?? 0;
    const isolationConfirmed = (permit.isolations ?? []).filter((item: any) => item.status === 'Confirmed' || item.status === 'De-Isolated').length;
    const workforceOnSite = (permit.workforce ?? []).filter((worker: any) => worker.time_in && !worker.time_out).length;
    const openConflicts = (permit.conflicts ?? []).filter((conflict: any) => conflict.status === 'Open').length;
    const requiredSignatures = ['Permit Holder', 'Permit Issuer', 'Area Authority'];
    const signatureTypes = new Set((permit.signatures ?? []).filter((signature: any) => signature.status === 'Signed' || signature.signed_by).map((signature: any) => signature.signature_role ?? signature.signature_type));
    const missingSignatures = requiredSignatures.filter((signature) => !signatureTypes.has(signature));
    return {
      permitId,
      permitNumber: permit.permit_number,
      status: permit.status,
      riskLevel: permit.risk_level,
      expiresAt: permit.planned_end_at,
      isolation: {
        total: isolationTotal,
        confirmed: isolationConfirmed,
        percent: isolationTotal ? Math.round((isolationConfirmed / isolationTotal) * 100) : 0
      },
      gasTest: {
        latest: latestGasTest,
        dueAt: latestGasTest?.next_test_due_at ?? null,
        status: latestGasTest?.result ?? 'Not Tested'
      },
      workforce: {
        total: permit.workforce?.length ?? 0,
        onSite: workforceOnSite,
        maxPersonnel: permit.max_personnel ?? null
      },
      conflicts: {
        open: openConflicts,
        total: permit.conflicts?.length ?? 0
      },
      signatures: {
        completed: permit.signatures?.length ?? 0,
        missing: missingSignatures
      },
      attachments: permit.attachments?.length ?? 0,
      handovers: permit.handovers?.length ?? 0
    };
  }

  async addIsolation(tenantId: string, actorId: string, permitId: string, dto: AddIsolationDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    this.assertIsolationInput(dto);
    const isolation = await this.repo.db.single<any>(this.repo.isolations().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      permit_id: permitId,
      equipment_id: dto.equipmentId ?? permit.equipment_id ?? null,
      equipment_tag: dto.equipmentTag ?? permit.equipment_tag ?? null,
      energy_type: dto.energyType,
      source_description: dto.sourceDescription ?? dto.isolationPointDescription ?? dto.isolationPoint,
      isolation_point: dto.isolationPoint,
      isolation_point_tag: dto.isolationPointTag ?? dto.isolationPoint,
      isolation_point_description: dto.isolationPointDescription ?? dto.sourceDescription ?? null,
      valve_tag: dto.valveTag ?? null,
      breaker_tag: dto.breakerTag ?? null,
      blind_spade_number: dto.blindSpadeNumber ?? null,
      required_position: dto.requiredPosition ?? null,
      normal_position: dto.normalPosition ?? null,
      current_position: dto.currentPosition ?? dto.normalPosition ?? null,
      lock_number: dto.lockNumber ?? null,
      lock_holder: dto.lockHolder ?? null,
      lock_holder_name: dto.lockHolderName ?? dto.lockHolder ?? null,
      lock_holder_user_id: dto.lockHolderUserId ?? null,
      isolation_method: dto.isolationMethod ?? null,
      isolation_status: 'Planned',
      verification_required: dto.verificationRequired ?? false,
      second_person_verification_required: dto.secondPersonVerificationRequired ?? false,
      notes: dto.notes ?? null,
      status: 'Planned',
      applied_by: actorId,
      created_by: actorId,
      updated_at: new Date().toISOString()
    }).select().single());
    await this.history(tenantId, actorId, permit, 'ISOLATION_ADDED', `Isolation added: ${dto.isolationPoint}`, null, isolation);
    await this.isolationHistory(tenantId, actorId, permit, isolation.id, 'ISOLATION_ADDED', `Isolation point added: ${isolation.isolation_point_tag ?? isolation.isolation_point}`, null, isolation);
    await this.audit.write({ tenantId, actorId, action: 'PTW_ISOLATION_ADDED', entityType: 'Permit', entityId: permitId, after: isolation as JsonValue });
    return isolation;
  }

  async isolationForPermit(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    return this.repo.db.many(this.repo.isolations().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('created_at'));
  }

  async isolationSummary(tenantId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const [pointsRaw, certificates] = await Promise.all([
      this.isolationForPermit(tenantId, permitId, scope),
      this.repo.db.many<any>(this.repo.isolationCertificates().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('version', { ascending: false }).limit(1))
    ]);
    const points = pointsRaw as Record<string, any>[];
    const total = points.length;
    const confirmed = points.filter((item: any) => ['Confirmed', 'Verified', 'De-Isolation Started', 'De-Isolated', 'Removal Verified'].includes(item.isolation_status ?? item.status)).length;
    const verified = points.filter((item: any) => ['Verified', 'De-Isolation Started', 'De-Isolated', 'Removal Verified'].includes(item.isolation_status ?? item.status)).length;
    const deisolated = points.filter((item: any) => ['De-Isolated', 'Removal Verified'].includes(item.isolation_status ?? item.status)).length;
    const removalVerified = points.filter((item: any) => (item.isolation_status ?? item.status) === 'Removal Verified').length;
    const isolationRequired = permit.isolation_required === true || permit.required_controls?.isolationRequired === true || ['ELECTRICAL_ISOLATION', 'LINE_BREAKING'].includes(permit.permit_type);
    const blockers = this.isolationBlockers(isolationRequired, points, certificates[0]);
    return {
      isolationRequired,
      total,
      confirmed,
      verified,
      deisolated,
      removalVerified,
      completionPercent: total ? Math.round((confirmed / total) * 100) : 0,
      deIsolationPercent: total ? Math.round((deisolated / total) * 100) : 0,
      status: this.isolationStatus(isolationRequired, points),
      isolationAuthority: permit.area_authority_id ?? permit.issuer_id ?? null,
      lastUpdatedBy: points[0]?.updated_by ?? points[0]?.created_by ?? null,
      lastUpdatedAt: points.reduce((latest: string | null, item: any) => !latest || item.updated_at > latest ? item.updated_at : latest, null),
      certificate: certificates[0] ?? null,
      activationBlocked: blockers.length > 0,
      blockers
    };
  }

  async updateIsolation(tenantId: string, actorId: string, permitId: string, isolationId: string, dto: UpdateIsolationDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.isolations().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', isolationId).maybeSingle());
    if (!before) throw new NotFoundException('Isolation record not found');
    this.assertIsolationInput({
      ...dto,
      isolationPoint: dto.isolationPoint ?? before.isolation_point,
      energyType: dto.energyType ?? before.energy_type,
      requiredPosition: dto.requiredPosition ?? before.required_position,
      blindSpadeNumber: dto.blindSpadeNumber ?? before.blind_spade_number,
      breakerTag: dto.breakerTag ?? before.breaker_tag,
      valveTag: dto.valveTag ?? before.valve_tag,
      isolationMethod: dto.isolationMethod ?? before.isolation_method
    });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [dtoKey, dbKey] of Object.entries({
      energyType: 'energy_type',
      sourceDescription: 'source_description',
      isolationPoint: 'isolation_point',
      equipmentId: 'equipment_id',
      equipmentTag: 'equipment_tag',
      isolationPointTag: 'isolation_point_tag',
      isolationPointDescription: 'isolation_point_description',
      valveTag: 'valve_tag',
      breakerTag: 'breaker_tag',
      blindSpadeNumber: 'blind_spade_number',
      requiredPosition: 'required_position',
      normalPosition: 'normal_position',
      currentPosition: 'current_position',
      lockNumber: 'lock_number',
      lockHolder: 'lock_holder',
      lockHolderName: 'lock_holder_name',
      lockHolderUserId: 'lock_holder_user_id',
      isolationMethod: 'isolation_method',
      isolationStatus: 'isolation_status',
      verificationRequired: 'verification_required',
      secondPersonVerificationRequired: 'second_person_verification_required',
      notes: 'notes'
    })) {
      if ((dto as any)[dtoKey] !== undefined) patch[dbKey] = (dto as any)[dtoKey] || null;
    }
    if (dto.isolationStatus) patch.status = dto.isolationStatus;
    const row = await this.repo.db.single<any>(this.repo.isolations().update(patch).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', isolationId).select().single());
    await this.history(tenantId, actorId, permit, 'ISOLATION_UPDATED', `Isolation updated: ${row.isolation_point}`, before, row);
    await this.isolationHistory(tenantId, actorId, permit, row.id, 'ISOLATION_UPDATED', `Isolation point updated: ${row.isolation_point_tag ?? row.isolation_point}`, before, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_ISOLATION_UPDATED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async deleteIsolation(tenantId: string, actorId: string, permitId: string, isolationId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.isolations().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', isolationId).maybeSingle());
    if (!before) throw new NotFoundException('Isolation record not found');
    await this.repo.db.single(this.repo.isolations().delete().eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', isolationId).select().single());
    await this.history(tenantId, actorId, permit, 'ISOLATION_DELETED', `Isolation deleted: ${before.isolation_point}`, before, null);
    await this.isolationHistory(tenantId, actorId, permit, isolationId, 'ISOLATION_DELETED', `Isolation point deleted: ${before.isolation_point_tag ?? before.isolation_point}`, before, null);
    await this.audit.write({ tenantId, actorId, action: 'PTW_ISOLATION_DELETED', entityType: 'Permit', entityId: permitId, before: before as JsonValue });
    return { deleted: true, id: isolationId };
  }

  async confirmIsolation(tenantId: string, actorId: string, permitId: string, isolationId: string, dto: ConfirmIsolationDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.isolations().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', isolationId).maybeSingle());
    if (!before) throw new NotFoundException('Isolation record not found');
    if (!before.lock_number || !(before.lock_holder_name ?? before.lock_holder)) throw new BadRequestException('Lock number and lock holder are required before confirmation');
    const signature = await this.signature(tenantId, actorId, permit, 'Isolation Confirmation', dto.signature);
    const isolation = await this.repo.db.single<any>(this.repo.isolations().update({ status: 'Confirmed', isolation_status: 'Confirmed', confirmed_by: actorId, confirmed_signature_id: (signature as any)?.id ?? null, confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', isolationId).select().single());
    await this.history(tenantId, actorId, permit, 'ISOLATION_CONFIRMED', `Isolation confirmed: ${isolation.isolation_point}`, null, isolation);
    await this.isolationHistory(tenantId, actorId, permit, isolation.id, 'ISOLATION_CONFIRMED', `Isolation confirmed: ${isolation.isolation_point_tag ?? isolation.isolation_point}`, before, isolation);
    await this.audit.write({ tenantId, actorId, action: 'PTW_ISOLATION_CONFIRMED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: isolation as JsonValue });
    return isolation;
  }

  async verifyIsolation(tenantId: string, actorId: string, permitId: string, isolationId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.isolations().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', isolationId).maybeSingle());
    if (!before) throw new NotFoundException('Isolation record not found');
    const signature = await this.signature(tenantId, actorId, permit, 'Isolation Verification');
    const isolation = await this.repo.db.single<any>(this.repo.isolations().update({ status: 'Verified', isolation_status: 'Verified', verified_by: actorId, verified_at: new Date().toISOString(), verified_signature_id: (signature as any)?.id ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', isolationId).select().single());
    await this.history(tenantId, actorId, permit, 'ISOLATION_VERIFIED', `Isolation verified: ${isolation.isolation_point}`, null, isolation);
    await this.isolationHistory(tenantId, actorId, permit, isolation.id, 'ISOLATION_VERIFIED', `Isolation verified: ${isolation.isolation_point_tag ?? isolation.isolation_point}`, before, isolation);
    await this.audit.write({ tenantId, actorId, action: 'PTW_ISOLATION_VERIFIED', entityType: 'Permit', entityId: permitId, after: isolation as JsonValue });
    return isolation;
  }

  async deisolate(tenantId: string, actorId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const rows = await this.repo.db.many<any>(this.repo.isolations().update({ status: 'De-Isolated', isolation_status: 'De-Isolated', deisolated_by: actorId, deisolated_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).in('isolation_status', ['Confirmed', 'Verified', 'De-Isolation Started']).select());
    await this.history(tenantId, actorId, permit, 'DE_ISOLATION_COMPLETED', `De-isolated ${rows.length} point(s)`, null, rows);
    return { count: rows.length, rows };
  }

  async importIsolationFromEquipment(tenantId: string, actorId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    if (!permit.equipment_id) return { imported: 0, rows: [], message: 'No equipment is linked to this permit.' };
    let suggestions: any[] = [];
    try {
      suggestions = await this.repo.db.many<any>(this.repo.db.from('EquipmentIsolationPoint').select('*').eq('tenantId', tenantId).eq('equipmentId', permit.equipment_id));
    } catch {
      suggestions = [];
    }
    if (!suggestions.length) return { imported: 0, rows: [], message: 'No isolation points found for this equipment. Add manually.' };
    const rows = [];
    for (const point of suggestions) {
      rows.push(await this.addIsolation(tenantId, actorId, permitId, {
        energyType: point.energyType ?? point.energy_type ?? 'Mechanical',
        equipmentId: permit.equipment_id,
        equipmentTag: permit.equipment_tag,
        isolationPoint: point.tag ?? point.isolationPointTag ?? point.isolation_point_tag,
        isolationPointTag: point.tag ?? point.isolationPointTag ?? point.isolation_point_tag,
        isolationPointDescription: point.description ?? point.isolationPointDescription,
        valveTag: point.valveTag,
        breakerTag: point.breakerTag,
        blindSpadeNumber: point.blindSpadeNumber,
        requiredPosition: point.requiredPosition ?? 'Isolated',
        currentPosition: point.currentPosition,
        isolationMethod: point.isolationMethod,
        verificationRequired: point.verificationRequired ?? true,
        secondPersonVerificationRequired: point.secondPersonVerificationRequired ?? true
      } as AddIsolationDto, scope));
    }
    await this.history(tenantId, actorId, permit, 'ISOLATION_IMPORTED', `Imported ${rows.length} isolation point(s) from equipment`, null, rows);
    return { imported: rows.length, rows };
  }

  async startDeIsolation(tenantId: string, actorId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const rows = await this.repo.db.many<any>(this.repo.isolations().update({ status: 'De-Isolation Started', isolation_status: 'De-Isolation Started', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).in('isolation_status', ['Confirmed', 'Verified']).select());
    await this.history(tenantId, actorId, permit, 'DE_ISOLATION_STARTED', `De-isolation started for ${rows.length} point(s)`, null, rows);
    return { count: rows.length, rows };
  }

  async deIsolatePoint(tenantId: string, actorId: string, permitId: string, isolationId: string, dto: ConfirmIsolationDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.isolations().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', isolationId).maybeSingle());
    if (!before) throw new NotFoundException('Isolation record not found');
    const signature = await this.signature(tenantId, actorId, permit, 'De-Isolation Confirmation', dto.signature);
    const row = await this.repo.db.single<any>(this.repo.isolations().update({ status: 'De-Isolated', isolation_status: 'De-Isolated', deisolated_by: actorId, deisolated_at: new Date().toISOString(), deisolated_signature_id: (signature as any)?.id ?? null, notes: dto.notes ?? before.notes ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', isolationId).select().single());
    await this.history(tenantId, actorId, permit, 'DE_ISOLATION_POINT_COMPLETED', `De-isolated: ${row.isolation_point_tag ?? row.isolation_point}`, before, row);
    await this.isolationHistory(tenantId, actorId, permit, row.id, 'DE_ISOLATION_POINT_COMPLETED', `Point de-isolated: ${row.isolation_point_tag ?? row.isolation_point}`, before, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_DE_ISOLATION_POINT_COMPLETED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async verifyRemoval(tenantId: string, actorId: string, permitId: string, isolationId: string, dto: ConfirmIsolationDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.isolations().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', isolationId).maybeSingle());
    if (!before) throw new NotFoundException('Isolation record not found');
    const signature = await this.signature(tenantId, actorId, permit, 'Isolation Removal Verification', dto.signature);
    const row = await this.repo.db.single<any>(this.repo.isolations().update({ status: 'Removal Verified', isolation_status: 'Removal Verified', removal_verified_by: actorId, removal_verified_at: new Date().toISOString(), removal_verified_signature_id: (signature as any)?.id ?? null, notes: dto.notes ?? before.notes ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', isolationId).select().single());
    await this.history(tenantId, actorId, permit, 'ISOLATION_REMOVAL_VERIFIED', `Removal verified: ${row.isolation_point_tag ?? row.isolation_point}`, before, row);
    await this.isolationHistory(tenantId, actorId, permit, row.id, 'ISOLATION_REMOVAL_VERIFIED', `Removal verified: ${row.isolation_point_tag ?? row.isolation_point}`, before, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_ISOLATION_REMOVAL_VERIFIED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async isolationHistoryForPermit(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    return this.repo.db.many(this.repo.isolationHistory().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('created_at', { ascending: false }));
  }

  async generateIsolationCertificate(tenantId: string, actorId: string, permitId: string, scope: Scope) {
    const permit = await this.get(tenantId, permitId, scope);
    const blockers = this.isolationBlockers(true, permit.isolations ?? [], null).filter((item) => item !== 'Isolation certificate has not been generated.');
    if (blockers.length) throw new BadRequestException(`Isolation certificate cannot be generated: ${blockers.join(' ')}`);
    const previous = await this.repo.db.many<any>(this.repo.isolationCertificates().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('version', { ascending: false }).limit(1));
    const version = (previous[0]?.version ?? 0) + 1;
    const certificateNumber = `${permit.permit_number}-ISO-V${version}`;
    const lines = [
      'PSM OS - Isolation / LOTO Certificate',
      `Certificate: ${certificateNumber}`,
      `Permit: ${permit.permit_number}`,
      `Title: ${permit.title}`,
      `Type: ${permit.permit_type}`,
      `Equipment: ${permit.equipment_tag ?? 'N/A'}`,
      `Area: ${permit.area?.name ?? permit.job_area ?? 'N/A'}`,
      `Isolation authority: ${permit.area_authority_id ?? permit.issuer_id ?? 'N/A'}`,
      `Company/Site: ${permit.company_id ?? 'N/A'} / ${permit.site?.name ?? permit.site_id}`,
      `QR link: /ptw/${permit.id}`,
      `Version: ${version}`,
      'Isolation Points:',
      ...(permit.isolations ?? []).map((item: any) => `${item.energy_type} | ${item.isolation_point_tag ?? item.isolation_point} | ${item.valve_tag ?? item.breaker_tag ?? '-'} | ${item.required_position ?? '-'} | ${item.isolation_status ?? item.status} | confirmed ${item.confirmed_by ?? '-'} | verified ${item.verified_by ?? '-'}`)
    ];
    const storageKey = `ptw-certificates/${tenantId}/${permitId}/isolation-v${version}.pdf`;
    await this.persistUploadedFile(storageKey, this.simplePdf(lines));
    const row = await this.repo.db.single<any>(this.repo.isolationCertificates().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      permit_id: permitId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      certificate_number: certificateNumber,
      file_url: `/api/v1/ptw/${permitId}/isolation-certificate`,
      file_key: storageKey,
      generated_by: actorId,
      generated_at: new Date().toISOString(),
      version,
      status: 'Generated'
    }).select().single());
    await this.history(tenantId, actorId, permit, 'ISOLATION_CERTIFICATE_GENERATED', `Isolation certificate generated: ${certificateNumber}`, null, row);
    await this.isolationHistory(tenantId, actorId, permit, null, 'ISOLATION_CERTIFICATE_GENERATED', `Certificate generated: ${certificateNumber}`, null, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_ISOLATION_CERTIFICATE_GENERATED', entityType: 'Permit', entityId: permitId, after: row as JsonValue });
    return row;
  }

  async isolationCertificateRecord(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    return this.repo.db.single<any>(this.repo.isolationCertificates().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('version', { ascending: false }).limit(1).maybeSingle());
  }

  async addGasTest(tenantId: string, actorId: string, permitId: string, dto: AddGasTestDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const evaluation = await this.gasLimits.evaluate(tenantId, permit, dto);
    const testedAt = dto.testedAt ?? new Date().toISOString();
    if (dto.calibrationExpiryDate && new Date(dto.calibrationExpiryDate).getTime() < new Date(testedAt).getTime()) {
      throw new BadRequestException('Instrument calibration expiry date must be after the test date/time');
    }
    const gasTest = await this.repo.db.single<any>(this.repo.gasTests().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      permit_id: permitId,
      test_type: dto.testType ?? 'Initial',
      test_location: dto.testLocation ?? permit.location ?? permit.job_area ?? 'Permit work area',
      tested_at: testedAt,
      tester_id: dto.testerId ?? actorId,
      tester_user_id: dto.testerId ?? actorId,
      tester_name: dto.testerName ?? null,
      instrument_id: dto.instrumentId ?? null,
      instrument_serial_number: dto.instrumentSerialNumber ?? null,
      calibration_date: dto.calibrationDate ?? null,
      calibration_due_date: dto.calibrationDueDate ?? null,
      calibration_expiry_date: dto.calibrationExpiryDate ?? dto.calibrationDueDate ?? null,
      ventilation_status: dto.ventilationStatus ?? null,
      weather_condition: dto.weatherCondition ?? null,
      o2: dto.o2 ?? null,
      lel: dto.lel ?? null,
      h2s: dto.h2s ?? null,
      co: dto.co ?? null,
      custom_gases: dto.customGases ?? {},
      gps_latitude: dto.gpsLatitude ?? null,
      gps_longitude: dto.gpsLongitude ?? null,
      permit_status_at_test: permit.status,
      result: evaluation.result,
      result_status: evaluation.result,
      next_test_due_at: evaluation.nextRetestDueAt,
      next_retest_due_at: evaluation.nextRetestDueAt,
      retest_status: evaluation.nextRetestDueAt ? 'Scheduled' : 'Not Required',
      validation_details: { failures: evaluation.failures, missing: evaluation.missing },
      notes: [dto.notes, ...evaluation.failures, ...evaluation.missing.map((item) => `${item} missing`)].filter(Boolean).join(' | ') || null,
      created_by: actorId,
      updated_at: new Date().toISOString()
    }).select().single());
    await this.replaceGasReadings(tenantId, permit, gasTest.id, dto, evaluation);
    await this.history(tenantId, actorId, permit, evaluation.result === 'Pass' ? 'GAS_TEST_PASSED' : 'GAS_TEST_FAILED', `Gas test ${evaluation.result}`, null, gasTest);
    await this.gasHistory(tenantId, actorId, permit, gasTest.id, 'GAS_TEST_ADDED', `Gas test ${evaluation.result}`, null, gasTest);
    await this.audit.write({ tenantId, actorId, action: 'PTW_GAS_TEST_ADDED', entityType: 'Permit', entityId: permitId, after: gasTest as JsonValue });
    await this.notification(tenantId, permit, evaluation.result === 'Pass' ? 'ptw.gas_test.added' : 'ptw.gas_test.failed', `Gas test ${evaluation.result}`);
    if (evaluation.result !== 'Pass') await this.createFailedGasAction(tenantId, actorId, permit, evaluation.failures);
    if (evaluation.result !== 'Pass' && permit.status === 'Active' && evaluation.thresholds.some((threshold: any) => threshold.auto_suspend_on_fail !== false)) {
      await this.suspend(tenantId, actorId, permitId, { reason: `Failed gas test: ${evaluation.failures.join(', ') || evaluation.result}` }, scope);
      await this.gasHistory(tenantId, actorId, permit, gasTest.id, 'PERMIT_AUTO_SUSPENDED_GAS', 'Permit auto-suspended because gas test failed', null, gasTest);
      await this.notification(tenantId, permit, 'ptw.permit.auto_suspended_gas', 'Permit auto-suspended because gas test failed');
    }
    return this.hydrateGasTest(tenantId, gasTest);
  }

  async gasTests(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    const tests = await this.repo.db.many<any>(this.repo.gasTests().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('tested_at', { ascending: false }));
    return Promise.all(tests.map((test) => this.hydrateGasTest(tenantId, test)));
  }

  async updateGasTest(tenantId: string, actorId: string, permitId: string, gasTestId: string, dto: UpdateGasTestDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.gasTests().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', gasTestId).maybeSingle());
    if (!before) throw new NotFoundException('Gas test not found');
    const evaluation = await this.gasLimits.evaluate(tenantId, permit, { ...before, ...dto });
    const testedAt = dto.testedAt ?? before.tested_at;
    if (dto.calibrationExpiryDate && new Date(dto.calibrationExpiryDate).getTime() < new Date(testedAt).getTime()) {
      throw new BadRequestException('Instrument calibration expiry date must be after the test date/time');
    }
    const patch: Record<string, unknown> = {
      test_type: dto.testType ?? before.test_type,
      test_location: dto.testLocation ?? before.test_location,
      tested_at: testedAt,
      tester_id: dto.testerId ?? before.tester_id,
      tester_user_id: dto.testerId ?? before.tester_user_id,
      tester_name: dto.testerName ?? before.tester_name,
      instrument_id: dto.instrumentId ?? before.instrument_id,
      instrument_serial_number: dto.instrumentSerialNumber ?? before.instrument_serial_number,
      calibration_date: dto.calibrationDate ?? before.calibration_date,
      calibration_due_date: dto.calibrationDueDate ?? before.calibration_due_date,
      calibration_expiry_date: dto.calibrationExpiryDate ?? dto.calibrationDueDate ?? before.calibration_expiry_date,
      ventilation_status: dto.ventilationStatus ?? before.ventilation_status,
      weather_condition: dto.weatherCondition ?? before.weather_condition,
      o2: dto.o2 ?? before.o2,
      lel: dto.lel ?? before.lel,
      h2s: dto.h2s ?? before.h2s,
      co: dto.co ?? before.co,
      custom_gases: dto.customGases ?? before.custom_gases ?? {},
      gps_latitude: dto.gpsLatitude ?? before.gps_latitude,
      gps_longitude: dto.gpsLongitude ?? before.gps_longitude,
      result: evaluation.result,
      result_status: evaluation.result,
      next_test_due_at: evaluation.nextRetestDueAt,
      next_retest_due_at: evaluation.nextRetestDueAt,
      retest_status: evaluation.nextRetestDueAt ? 'Scheduled' : 'Not Required',
      validation_details: { failures: evaluation.failures, missing: evaluation.missing },
      notes: [dto.notes ?? before.notes, ...evaluation.failures, ...evaluation.missing.map((item) => `${item} missing`)].filter(Boolean).join(' | ') || null,
      updated_at: new Date().toISOString()
    };
    const gasTest = await this.repo.db.single<any>(this.repo.gasTests().update(patch).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', gasTestId).select().single());
    await this.replaceGasReadings(tenantId, permit, gasTest.id, { ...before, ...dto }, evaluation);
    await this.history(tenantId, actorId, permit, 'GAS_TEST_UPDATED', `Gas test updated: ${evaluation.result}`, before, gasTest);
    await this.gasHistory(tenantId, actorId, permit, gasTest.id, 'GAS_TEST_UPDATED', `Gas test updated: ${evaluation.result}`, before, gasTest);
    await this.audit.write({ tenantId, actorId, action: 'PTW_GAS_TEST_UPDATED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: gasTest as JsonValue });
    return this.hydrateGasTest(tenantId, gasTest);
  }

  async deleteGasTest(tenantId: string, actorId: string, permitId: string, gasTestId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.gasTests().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', gasTestId).maybeSingle());
    if (!before) throw new NotFoundException('Gas test not found');
    await this.repo.db.single(this.repo.gasTests().delete().eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', gasTestId).select().single());
    await this.history(tenantId, actorId, permit, 'GAS_TEST_DELETED', 'Gas test deleted', before, null);
    await this.gasHistory(tenantId, actorId, permit, gasTestId, 'GAS_TEST_DELETED', 'Gas test deleted', before, null);
    await this.audit.write({ tenantId, actorId, action: 'PTW_GAS_TEST_DELETED', entityType: 'Permit', entityId: permitId, before: before as JsonValue });
    return { deleted: true, id: gasTestId };
  }

  async latestGasTest(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    const test = await this.repo.db.single<any>(this.repo.gasTests().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('tested_at', { ascending: false }).limit(1).maybeSingle());
    return test ? this.hydrateGasTest(tenantId, test) : null;
  }

  async gasTestSummary(tenantId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const latest = await this.latestGasTest(tenantId, permitId, scope) as Record<string, any> | null;
    const thresholds = await this.gasLimits.applicableThresholds(tenantId, permit);
    const gasTestRequired = this.gasLimits.gasTestRequired(permit);
    const now = Date.now();
    const dueAt = latest?.next_retest_due_at ?? latest?.next_test_due_at ?? null;
    const dueMs = dueAt ? new Date(dueAt).getTime() - now : null;
    const overdue = dueMs !== null && dueMs < 0;
    const dueSoon = dueMs !== null && dueMs >= 0 && dueMs <= 30 * 60 * 1000;
    const blockers: string[] = [];
    if (gasTestRequired && !latest) blockers.push('Gas test is required before permit activation.');
    if (latest && ['Fail', 'Calibration Expired'].includes(latest.result_status ?? latest.result)) blockers.push('Latest gas test failed.');
    if (latest && (latest.result_status ?? latest.result) === 'Incomplete') blockers.push('Required gas fields are missing.');
    if (latest?.calibration_expiry_date && new Date(latest.calibration_expiry_date).getTime() < new Date(latest.tested_at).getTime()) blockers.push('Instrument calibration is expired.');
    if (gasTestRequired && overdue) blockers.push('Gas test is older than the allowed validity period.');
    const permitGasStatus = !gasTestRequired ? 'Not Required' : !latest ? 'Required' : overdue ? 'Re-Test Overdue' : dueSoon ? 'Re-Test Due Soon' : (latest.result_status ?? latest.result) === 'Pass' ? 'Passed' : (latest.result_status ?? latest.result) === 'Fail' ? 'Failed' : latest.result_status ?? latest.result;
    return {
      gasTestRequired,
      latestStatus: overdue ? 'Overdue' : latest?.result_status ?? latest?.result ?? 'Not Recorded',
      lastTestedAt: latest?.tested_at ?? null,
      nextRetestDueAt: dueAt,
      retestCountdownSeconds: dueMs === null ? null : Math.floor(dueMs / 1000),
      tester: latest?.tester_name ?? latest?.tester_user_id ?? latest?.tester_id ?? null,
      instrumentId: latest?.instrument_id ?? null,
      instrumentCalibrationStatus: latest?.calibration_expiry_date && new Date(latest.calibration_expiry_date).getTime() < Date.now() ? 'Expired' : latest?.calibration_expiry_date ? 'Valid' : 'Unknown',
      permitGasStatus,
      blockers,
      latest,
      thresholds
    };
  }

  async gasTestHistoryForPermit(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    return this.repo.db.many(this.repo.gasTestHistory().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('created_at', { ascending: false }));
  }

  async gasTestTrends(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    const readings = await this.repo.db.many<any>(this.repo.gasReadings().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).in('gas_code', ['O2', 'LEL', 'H2S', 'CO']).order('created_at', { ascending: true }));
    return ['O2', 'LEL', 'H2S', 'CO'].map((gasCode) => ({
      gasCode,
      points: readings.filter((row) => row.gas_code === gasCode).map((row) => ({ at: row.created_at, value: Number(row.value), passFail: row.pass_fail }))
    }));
  }

  async permitGasThresholds(tenantId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    return this.gasLimits.applicableThresholds(tenantId, permit);
  }

  async gasThresholds(tenantId: string, scope: Scope, siteId?: string, permitType?: string) {
    if (siteId) this.assertSiteAccess(siteId, scope);
    let query = this.repo.thresholds().select('*').eq('tenant_id', tenantId).order('gas_code');
    if (siteId) query = query.eq('site_id', siteId);
    else if (scope.selectedSiteId) query = query.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    else if (!scope.corporateView && scope.allowedSiteIds?.length) query = query.in('site_id', scope.allowedSiteIds);
    if (permitType) query = query.or(`permit_type.is.null,permit_type.eq.${permitType}`);
    return this.repo.db.many(query);
  }

  async createGasThreshold(tenantId: string, actorId: string, dto: GasThresholdDto, scope: Scope) {
    if (dto.siteId) this.assertSiteAccess(dto.siteId, scope);
    const siteId = dto.siteId ?? scope.selectedSiteId ?? null;
    const companyId = siteId ? await this.companyForSite(siteId) : null;
    const row = await this.repo.db.single<any>(this.repo.thresholds().insert(this.thresholdPayload(tenantId, actorId, dto, siteId, companyId)).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_GAS_THRESHOLD_CREATED', entityType: 'GasThreshold', entityId: row.id, after: row as JsonValue });
    return row;
  }

  async updateGasThreshold(tenantId: string, actorId: string, thresholdId: string, dto: GasThresholdDto, scope: Scope) {
    const before = await this.repo.db.single<any>(this.repo.thresholds().select('*').eq('tenant_id', tenantId).eq('id', thresholdId).maybeSingle());
    if (!before) throw new NotFoundException('Gas threshold not found');
    this.assertSiteAccess(before.site_id, scope);
    const siteId = dto.siteId ?? before.site_id ?? null;
    const companyId = siteId ? await this.companyForSite(siteId) : before.company_id ?? null;
    const row = await this.repo.db.single<any>(this.repo.thresholds().update({ ...this.thresholdPayload(tenantId, actorId, dto, siteId, companyId, false), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', thresholdId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_GAS_THRESHOLD_UPDATED', entityType: 'GasThreshold', entityId: thresholdId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async deleteGasThreshold(tenantId: string, actorId: string, thresholdId: string, scope: Scope) {
    const before = await this.repo.db.single<any>(this.repo.thresholds().select('*').eq('tenant_id', tenantId).eq('id', thresholdId).maybeSingle());
    if (!before) throw new NotFoundException('Gas threshold not found');
    this.assertSiteAccess(before.site_id, scope);
    await this.repo.db.single(this.repo.thresholds().delete().eq('tenant_id', tenantId).eq('id', thresholdId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_GAS_THRESHOLD_DELETED', entityType: 'GasThreshold', entityId: thresholdId, before: before as JsonValue });
    return { deleted: true, id: thresholdId };
  }

  async validateGasTest(tenantId: string, actorId: string, permitId: string, gasTestId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const gasTest = await this.repo.db.single<any>(this.repo.gasTests().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', gasTestId).maybeSingle());
    if (!gasTest) throw new NotFoundException('Gas test not found');
    const evaluation = await this.gasLimits.evaluate(tenantId, permit, gasTest);
    const row = await this.repo.db.single<any>(this.repo.gasTests().update({ result: evaluation.result, result_status: evaluation.result, validation_details: { failures: evaluation.failures, missing: evaluation.missing }, next_test_due_at: evaluation.nextRetestDueAt, next_retest_due_at: evaluation.nextRetestDueAt, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', gasTestId).select().single());
    await this.gasHistory(tenantId, actorId, permit, gasTestId, 'GAS_TEST_VALIDATED', `Gas test validated: ${evaluation.result}`, gasTest, row);
    return this.hydrateGasTest(tenantId, row);
  }

  async checkGasTestOverdue(tenantId: string, actorId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const summary = await this.gasTestSummary(tenantId, permitId, scope);
    const overdue = summary.permitGasStatus === 'Re-Test Overdue';
    const dueSoon = summary.permitGasStatus === 'Re-Test Due Soon';
    if (dueSoon) {
      await this.notification(tenantId, permit, 'ptw.gas_test.retest_due', 'Gas re-test due soon');
      await this.gasHistory(tenantId, actorId, permit, summary.latest?.id ?? null, 'GAS_RETEST_DUE', 'Gas re-test is due soon', null, summary);
    }
    if (overdue) {
      await this.notification(tenantId, permit, 'ptw.gas_test.retest_overdue', 'Gas re-test overdue');
      await this.history(tenantId, actorId, permit, 'GAS_RETEST_OVERDUE', 'Gas re-test is overdue', null, summary);
      await this.gasHistory(tenantId, actorId, permit, summary.latest?.id ?? null, 'GAS_RETEST_OVERDUE', 'Gas re-test is overdue', null, summary);
      if (permit.status === 'Active' && (summary.thresholds ?? []).some((threshold: any) => threshold.auto_suspend_on_overdue !== false)) {
        await this.suspend(tenantId, actorId, permitId, { reason: 'Gas re-test overdue' }, scope);
        await this.notification(tenantId, permit, 'ptw.permit.auto_suspended_gas', 'Permit auto-suspended because gas re-test is overdue');
      }
    }
    return { overdue, dueSoon, summary };
  }

  async addWorkforce(tenantId: string, actorId: string, permitId: string, dto: AddWorkforceDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    this.assertWorkforceInput(dto);
    const row = await this.repo.db.single<any>(this.repo.workforce().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      permit_id: permitId,
      ...this.workforcePayload(dto, actorId),
      signature: dto.signature ?? null,
      created_by: actorId,
      updated_at: new Date().toISOString()
    }).select().single());
    await this.history(tenantId, actorId, permit, 'WORKFORCE_ADDED', `${dto.workerName} added to permit`, null, row);
    await this.workforceHistory(tenantId, actorId, permit, row.id, 'WORKFORCE_ADDED', `${row.worker_name} added to permit`, null, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_WORKFORCE_ADDED', entityType: 'Permit', entityId: permitId, after: row as JsonValue });
    await this.notification(tenantId, permit, 'ptw.workforce.added', `${row.worker_name} added to workforce`);
    return row;
  }

  workforceSign(tenantId: string, actorId: string, permitId: string, workerId: string, direction: 'in' | 'out', scope: Scope) {
    return this.signWorkforce(tenantId, actorId, permitId, workerId, direction, scope);
  }

  async workforceForPermit(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    return this.repo.db.many(this.repo.workforce().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('created_at'));
  }

  async workforceSummary(tenantId: string, permitId: string, scope: Scope) {
    const permit = await this.get(tenantId, permitId, scope);
    const workers = permit.workforce ?? [];
    const total = workers.length;
    const signedIn = workers.filter((worker: any) => worker.signed_in === true || (worker.time_in && !worker.time_out)).length;
    const signedOut = workers.filter((worker: any) => worker.signed_out === true || worker.time_out).length;
    const briefingRequired = workers.filter((worker: any) => worker.briefing_required !== false);
    const briefingCompleted = briefingRequired.filter((worker: any) => worker.briefing_completed === true || worker.signed_briefing === true).length;
    const contractorPersonnel = workers.filter((worker: any) => worker.worker_type === 'Contractor' || worker.contractor_company_id || /contractor/i.test(worker.employer_company ?? worker.company ?? '')).length;
    const internalPersonnel = total - contractorPersonnel;
    const activationBlockers = this.workforceActivationBlockers(permit, workers);
    const closureBlockers = this.workforceClosureBlockers(permit, workers);
    const status = this.workforceStatus(workers, activationBlockers, closureBlockers);
    const latestAccountability = (permit.history ?? []).find((event: any) => event.event_type === 'WORKFORCE_ACCOUNTABILITY_CONFIRMED') ?? null;
    return {
      totalPersonnel: total,
      signedInPersonnel: signedIn,
      signedOutPersonnel: signedOut,
      briefingCompletedPercent: briefingRequired.length ? Math.round((briefingCompleted / briefingRequired.length) * 100) : 100,
      contractorPersonnel,
      internalPersonnel,
      maximumPersonnelAllowed: permit.max_personnel ?? null,
      workforceStatus: status,
      activationBlocked: activationBlockers.length > 0,
      activationBlockers,
      closureBlocked: closureBlockers.length > 0,
      closureBlockers,
      emergency: {
        currentlySignedIn: signedIn,
        missingSignOut: signedIn,
        emergencyContacts: workers.filter((worker: any) => worker.emergency_contact_name || worker.emergency_contact_phone).map((worker: any) => ({ workerName: worker.worker_name, name: worker.emergency_contact_name, phone: worker.emergency_contact_phone })),
        lastAccountabilityCheck: latestAccountability?.created_at ?? null,
        accountabilityConfirmedBy: latestAccountability?.actor_id ?? null,
        accountabilityConfirmedAt: latestAccountability?.created_at ?? null
      }
    };
  }

  async workforceRequiredRoles(tenantId: string, permitId: string, scope: Scope) {
    const permit = await this.get(tenantId, permitId, scope);
    const required = this.requiredWorkforceRoles(permit);
    const workers = permit.workforce ?? [];
    return required.map((role) => ({
      role,
      filled: workers.some((worker: any) => this.workerHasRole(worker, role)),
      workers: workers.filter((worker: any) => this.workerHasRole(worker, role))
    }));
  }

  async workforceHistoryForPermit(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    return this.repo.db.many(this.repo.workforceHistory().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('created_at', { ascending: false }));
  }

  async updateWorkforce(tenantId: string, actorId: string, permitId: string, workerId: string, dto: UpdateWorkforceDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.workforce().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', workerId).maybeSingle());
    if (!before) throw new NotFoundException('Workforce record not found');
    this.assertWorkforceInput({ ...before, ...dto, workerName: dto.workerName ?? before.worker_name } as AddWorkforceDto);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [dtoKey, dbKey] of Object.entries({
      userId: 'user_id',
      workerName: 'worker_name',
      workerType: 'worker_type',
      company: 'company',
      employerCompany: 'employer_company',
      contractorCompanyId: 'contractor_company_id',
      trade: 'trade',
      role: 'role',
      roleOnPermit: 'role_on_permit',
      phone: 'phone',
      contactNumber: 'contact_number',
      badgeId: 'badge_id',
      emergencyContactName: 'emergency_contact_name',
      emergencyContactPhone: 'emergency_contact_phone',
      isPermitHolder: 'is_permit_holder',
      isPerformingAuthority: 'is_performing_authority',
      isAreaAuthority: 'is_area_authority',
      isPermitIssuer: 'is_permit_issuer',
      isFireWatch: 'is_fire_watch',
      isAttendant: 'is_attendant',
      isEntrySupervisor: 'is_entry_supervisor',
      isGasTester: 'is_gas_tester',
      isIsolationAuthority: 'is_isolation_authority',
      briefingRequired: 'briefing_required',
      signedBriefing: 'signed_briefing',
      briefingCompleted: 'briefing_completed',
      signature: 'signature',
      timeIn: 'time_in',
      timeOut: 'time_out',
      status: 'status',
      notes: 'notes'
    })) {
      if ((dto as any)[dtoKey] !== undefined) patch[dbKey] = (dto as any)[dtoKey];
    }
    if (dto.contactNumber !== undefined) patch.phone = dto.contactNumber;
    if (dto.phone !== undefined) patch.contact_number = dto.phone;
    if (dto.roleOnPermit !== undefined) patch.role = dto.roleOnPermit;
    if (dto.role !== undefined) patch.role_on_permit = dto.role;
    if (dto.briefingCompleted === true || dto.signedBriefing === true) {
      patch.signed_briefing = true;
      patch.briefing_completed = true;
      patch.briefing_completed_at = new Date().toISOString();
      patch.briefing_completed_by = actorId;
      if (!patch.status) patch.status = before.signed_in ? 'Signed In' : 'Briefed';
    }
    const row = await this.repo.db.single<any>(this.repo.workforce().update(patch).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', workerId).select().single());
    await this.history(tenantId, actorId, permit, 'WORKFORCE_UPDATED', `${row.worker_name} workforce record updated`, null, row);
    await this.workforceHistory(tenantId, actorId, permit, row.id, 'WORKFORCE_UPDATED', `${row.worker_name} workforce record updated`, before, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_WORKFORCE_UPDATED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async deleteWorkforce(tenantId: string, actorId: string, permitId: string, workerId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.workforce().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', workerId).maybeSingle());
    if (!before) throw new NotFoundException('Workforce record not found');
    await this.repo.db.single(this.repo.workforce().delete().eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', workerId).select().single());
    await this.history(tenantId, actorId, permit, 'WORKFORCE_REMOVED', `${before.worker_name} removed from permit`, before, null);
    await this.workforceHistory(tenantId, actorId, permit, workerId, 'WORKFORCE_REMOVED', `${before.worker_name} removed from permit`, before, null);
    await this.audit.write({ tenantId, actorId, action: 'PTW_WORKFORCE_REMOVED', entityType: 'Permit', entityId: permitId, before: before as JsonValue });
    return { deleted: true, id: workerId };
  }

  async completeWorkerBriefing(tenantId: string, actorId: string, permitId: string, workerId: string, dto: WorkerBriefingDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.workforce().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', workerId).maybeSingle());
    if (!before) throw new NotFoundException('Workforce record not found');
    const row = await this.repo.db.single<any>(this.repo.workforce().update({
      signed_briefing: true,
      briefing_completed: true,
      briefing_completed_at: new Date().toISOString(),
      briefing_completed_by: actorId,
      signature: dto.signature ?? before.signature ?? null,
      notes: dto.notes ?? before.notes ?? null,
      status: before.signed_in ? 'Signed In' : 'Briefed',
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', workerId).select().single());
    await this.history(tenantId, actorId, permit, 'WORKFORCE_BRIEFING_COMPLETED', `${row.worker_name} acknowledged briefing`, before, row);
    await this.workforceHistory(tenantId, actorId, permit, workerId, 'WORKFORCE_BRIEFING_COMPLETED', `${row.worker_name} acknowledged briefing`, before, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_WORKFORCE_BRIEFING_COMPLETED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async bulkBriefing(tenantId: string, actorId: string, permitId: string, dto: WorkforceBulkDto, scope: Scope) {
    const workers = await this.workforceForPermit(tenantId, permitId, scope);
    const ids = dto.workerIds?.length ? dto.workerIds : workers.map((worker: any) => worker.id);
    const rows = [];
    for (const id of ids) rows.push(await this.completeWorkerBriefing(tenantId, actorId, permitId, id, {}, scope));
    return { count: rows.length, rows };
  }

  async bulkWorkforceSign(tenantId: string, actorId: string, permitId: string, dto: WorkforceBulkDto, direction: 'in' | 'out', scope: Scope) {
    const workers = await this.workforceForPermit(tenantId, permitId, scope);
    const ids = dto.workerIds?.length ? dto.workerIds : workers.map((worker: any) => worker.id);
    const rows = [];
    for (const id of ids) rows.push(await this.signWorkforce(tenantId, actorId, permitId, id, direction, scope));
    return { count: rows.length, rows };
  }

  async createBriefing(tenantId: string, actorId: string, permitId: string, dto: WorkforceBriefingDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const workers = await this.workforceForPermit(tenantId, permitId, scope);
    const completed = workers.filter((worker: any) => worker.briefing_completed === true || worker.signed_briefing === true).length;
    const missing = workers.filter((worker: any) => worker.briefing_required !== false && worker.briefing_completed !== true && worker.signed_briefing !== true).length;
    const row = await this.repo.db.single<any>(this.repo.briefings().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      permit_id: permitId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      briefing_title: dto.briefingTitle,
      briefing_topic: dto.briefingTopic,
      briefing_notes: dto.briefingNotes ?? null,
      conducted_by: dto.conductedBy ?? actorId,
      conducted_at: dto.conductedAt ?? new Date().toISOString(),
      required_for_all_workers: dto.requiredForAllWorkers ?? true,
      completed_count: completed,
      missing_count: missing,
      status: missing ? 'Open' : 'Complete',
      created_by: actorId,
      updated_at: new Date().toISOString()
    }).select().single());
    await this.history(tenantId, actorId, permit, 'WORKFORCE_BRIEFING_CREATED', `Briefing created: ${row.briefing_title}`, null, row);
    await this.workforceHistory(tenantId, actorId, permit, null, 'WORKFORCE_BRIEFING_CREATED', `Briefing created: ${row.briefing_title}`, null, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_WORKFORCE_BRIEFING_CREATED', entityType: 'Permit', entityId: permitId, after: row as JsonValue });
    if (missing) await this.notification(tenantId, permit, 'ptw.briefing.missing', `${missing} briefing acknowledgement(s) missing`);
    return row;
  }

  async updateBriefing(tenantId: string, actorId: string, permitId: string, briefingId: string, dto: WorkforceBriefingDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.briefings().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', briefingId).maybeSingle());
    if (!before) throw new NotFoundException('Briefing not found');
    const row = await this.repo.db.single<any>(this.repo.briefings().update({
      briefing_title: dto.briefingTitle ?? before.briefing_title,
      briefing_topic: dto.briefingTopic ?? before.briefing_topic,
      briefing_notes: dto.briefingNotes ?? before.briefing_notes,
      conducted_by: dto.conductedBy ?? before.conducted_by,
      conducted_at: dto.conductedAt ?? before.conducted_at,
      required_for_all_workers: dto.requiredForAllWorkers ?? before.required_for_all_workers,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', briefingId).select().single());
    await this.history(tenantId, actorId, permit, 'WORKFORCE_BRIEFING_UPDATED', `Briefing updated: ${row.briefing_title}`, before, row);
    await this.workforceHistory(tenantId, actorId, permit, null, 'WORKFORCE_BRIEFING_UPDATED', `Briefing updated: ${row.briefing_title}`, before, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_WORKFORCE_BRIEFING_UPDATED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async briefingsForPermit(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    return this.repo.db.many(this.repo.briefings().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('conducted_at', { ascending: false }));
  }

  async accountabilityCheck(tenantId: string, actorId: string, permitId: string, dto: WorkforceAccountabilityDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const workers = await this.workforceForPermit(tenantId, permitId, scope);
    const signedIn = workers.filter((worker: any) => worker.signed_in === true || (worker.time_in && !worker.time_out));
    const eventType = signedIn.length ? 'WORKFORCE_ACCOUNTABILITY_INCOMPLETE' : 'WORKFORCE_ACCOUNTABILITY_CONFIRMED';
    const title = signedIn.length ? `${signedIn.length} worker(s) still signed in` : 'Emergency accountability confirmed';
    const after = { signedIn: signedIn.map((worker: any) => worker.worker_name), notes: dto.notes ?? null, confirmedBy: dto.confirmedBy ?? actorId };
    await this.history(tenantId, actorId, permit, eventType, title, null, after);
    await this.workforceHistory(tenantId, actorId, permit, null, eventType, title, null, after);
    await this.audit.write({ tenantId, actorId, action: `PTW_${eventType}`, entityType: 'Permit', entityId: permitId, after: after as JsonValue });
    if (signedIn.length) await this.notification(tenantId, permit, 'ptw.accountability.incomplete', title);
    return { complete: signedIn.length === 0, signedIn, checkedAt: new Date().toISOString(), confirmedBy: dto.confirmedBy ?? actorId };
  }

  async shiftHandoversForPermit(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    const handovers = await this.repo.db.many(this.repo.shiftHandovers().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('created_at', { ascending: false }));
    return Promise.all(handovers.map((row: any) => this.withHandoverChecklist(tenantId, row)));
  }

  async currentShiftHandover(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    const row = await this.repo.db.single<any>(this.repo.shiftHandovers().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).in('status', ['Draft', 'Pending Incoming Acknowledgement', 'Acknowledged']).order('created_at', { ascending: false }).limit(1).maybeSingle());
    return row ? this.withHandoverChecklist(tenantId, row) : null;
  }

  async createShiftHandover(tenantId: string, actorId: string, permitId: string, dto: ShiftHandoverDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    if (['Closed', 'Cancelled'].includes(permit.status)) throw new BadRequestException('Cannot create handover for closed or cancelled permit');
    if (!['Active', 'Issued', 'Suspended', 'Extended'].includes(permit.status)) throw new BadRequestException('Permit must be Active, Issued, Suspended, or Extended for handover');
    const readiness = await this.shiftHandoverReadiness(tenantId, permitId, scope);
    const row = await this.repo.db.single<any>(this.repo.shiftHandovers().insert(this.handoverPayload(tenantId, actorId, permit, dto, readiness, 'Draft')).select().single());
    await this.ensureHandoverChecklist(tenantId, actorId, permit, row.id, dto.checklist ?? {});
    const full = await this.withHandoverChecklist(tenantId, row);
    await this.handoverEvent(tenantId, actorId, permit, row.id, 'HANDOVER_CREATED', 'Shift handover created', null, full);
    await this.audit.write({ tenantId, actorId, action: 'PTW_HANDOVER_CREATED', entityType: 'Permit', entityId: permitId, after: full as JsonValue });
    await this.notification(tenantId, permit, 'ptw.handover.created', 'Shift handover created');
    if (readiness.expiry.expiresWithinTwoHours) await this.notification(tenantId, permit, 'ptw.handover.expiry_warning', 'Permit expires within 2 hours');
    if (readiness.gasTest.dueSoon || readiness.gasTest.overdue) await this.notification(tenantId, permit, 'ptw.handover.gas_retest_warning', readiness.gasTest.status);
    return full;
  }

  async updateShiftHandover(tenantId: string, actorId: string, permitId: string, handoverId: string, dto: ShiftHandoverDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getShiftHandover(tenantId, permitId, handoverId);
    if (['Completed', 'Cancelled'].includes(before.status)) throw new BadRequestException('Completed or cancelled handovers cannot be edited');
    const readiness = await this.shiftHandoverReadiness(tenantId, permitId, scope);
    const row = await this.repo.db.single<any>(this.repo.shiftHandovers().update(this.handoverPayload(tenantId, actorId, permit, dto, readiness, before.status, false)).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', handoverId).select().single());
    await this.ensureHandoverChecklist(tenantId, actorId, permit, row.id, dto.checklist ?? {});
    const full = await this.withHandoverChecklist(tenantId, row);
    await this.handoverEvent(tenantId, actorId, permit, handoverId, 'HANDOVER_UPDATED', 'Shift handover updated', before, full);
    await this.audit.write({ tenantId, actorId, action: 'PTW_HANDOVER_UPDATED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: full as JsonValue });
    return full;
  }

  async deleteShiftHandover(tenantId: string, actorId: string, permitId: string, handoverId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getShiftHandover(tenantId, permitId, handoverId);
    if (before.status !== 'Draft') throw new BadRequestException('Only draft handovers can be deleted');
    await this.repo.db.single(this.repo.shiftHandovers().delete().eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', handoverId).select().single());
    await this.handoverEvent(tenantId, actorId, permit, handoverId, 'HANDOVER_DELETED', 'Draft handover deleted', before, null);
    await this.audit.write({ tenantId, actorId, action: 'PTW_HANDOVER_DELETED', entityType: 'Permit', entityId: permitId, before: before as JsonValue });
    return { deleted: true, id: handoverId };
  }

  async acknowledgeShiftHandover(tenantId: string, actorId: string, permitId: string, handoverId: string, dto: HandoverAcknowledgeDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getShiftHandover(tenantId, permitId, handoverId);
    const row = await this.repo.db.single<any>(this.repo.shiftHandovers().update({
      acknowledgement_status: 'Acknowledged',
      acknowledged_by: actorId,
      acknowledged_at: new Date().toISOString(),
      acknowledgement_signature_id: crypto.randomUUID(),
      acknowledgement_signature: dto.signature,
      acknowledgement_ip: dto.ipAddress ?? null,
      incoming_supervisor_comments: dto.comments ?? before.incoming_supervisor_comments ?? null,
      status: before.status === 'Draft' ? 'Acknowledged' : before.status === 'Pending Incoming Acknowledgement' ? 'Acknowledged' : before.status,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', handoverId).select().single());
    const full = await this.withHandoverChecklist(tenantId, row);
    await this.handoverEvent(tenantId, actorId, permit, handoverId, 'HANDOVER_ACKNOWLEDGED', 'Incoming shift acknowledged handover', before, full);
    await this.audit.write({ tenantId, actorId, action: 'PTW_HANDOVER_ACKNOWLEDGED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: full as JsonValue });
    await this.notification(tenantId, permit, 'ptw.handover.acknowledged', 'Shift handover acknowledged');
    return full;
  }

  async completeShiftHandover(tenantId: string, actorId: string, permitId: string, handoverId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.withHandoverChecklist(tenantId, await this.getShiftHandover(tenantId, permitId, handoverId));
    const missing = (before.checklistItems ?? []).filter((item: any) => item.is_required && !item.is_checked);
    if (missing.length) throw new BadRequestException(`Required handover checklist incomplete: ${missing.map((item: any) => item.checklist_label).join(', ')}`);
    if (before.acknowledgement_status !== 'Acknowledged') throw new BadRequestException('Incoming supervisor acknowledgement is required before completion');
    const row = await this.repo.db.single<any>(this.repo.shiftHandovers().update({ status: 'Completed', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', handoverId).select().single());
    const full = await this.withHandoverChecklist(tenantId, row);
    await this.handoverEvent(tenantId, actorId, permit, handoverId, 'HANDOVER_COMPLETED', 'Shift handover completed', before, full);
    await this.audit.write({ tenantId, actorId, action: 'PTW_HANDOVER_COMPLETED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: full as JsonValue });
    await this.notification(tenantId, permit, 'ptw.handover.completed', 'Shift handover completed');
    return full;
  }

  async suspendPermitDuringHandover(tenantId: string, actorId: string, permitId: string, handoverId: string, dto: SuspendHandoverDto, scope: Scope) {
    if (!dto.reason?.trim()) throw new BadRequestException('Suspension reason is required');
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getShiftHandover(tenantId, permitId, handoverId);
    const row = await this.repo.db.single<any>(this.repo.shiftHandovers().update({ status: 'Suspended', suspended_during_handover: true, suspension_reason: dto.reason, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', handoverId).select().single());
    await this.suspend(tenantId, actorId, permitId, { reason: dto.reason }, scope);
    const full = await this.withHandoverChecklist(tenantId, row);
    await this.handoverEvent(tenantId, actorId, permit, handoverId, 'HANDOVER_PERMIT_SUSPENDED', dto.reason, before, full);
    await this.audit.write({ tenantId, actorId, action: 'PTW_HANDOVER_PERMIT_SUSPENDED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: full as JsonValue });
    await this.notification(tenantId, permit, 'ptw.handover.permit_suspended', 'Permit suspended during shift handover');
    return full;
  }

  async updateShiftHandoverChecklistItem(tenantId: string, actorId: string, permitId: string, handoverId: string, checklistItemId: string, dto: HandoverChecklistDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.handoverChecklistItems().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('handover_id', handoverId).eq('id', checklistItemId).single());
    const row = await this.repo.db.single<any>(this.repo.handoverChecklistItems().update({ is_checked: dto.isChecked, checked_by: dto.isChecked ? actorId : null, checked_at: dto.isChecked ? new Date().toISOString() : null, notes: dto.notes ?? before.notes ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', checklistItemId).select().single());
    await this.repo.db.single(this.repo.shiftHandovers().update({ checklist: await this.checklistObject(tenantId, handoverId), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', handoverId).select().single());
    await this.handoverEvent(tenantId, actorId, permit, handoverId, 'HANDOVER_CHECKLIST_UPDATED', `${row.checklist_label}: ${row.is_checked ? 'checked' : 'unchecked'}`, before, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_HANDOVER_CHECKLIST_UPDATED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async shiftHandoverHistory(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    return this.repo.db.many(this.repo.handoverHistory().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('created_at', { ascending: false }));
  }

  async shiftHandoverReadiness(tenantId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const [isolations, gasSummary, workers, conflicts, signatures] = await Promise.all([
      this.repo.db.many(this.repo.isolations().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId)),
      this.gasTestSummary(tenantId, permitId, scope).catch(() => null),
      this.repo.db.many(this.repo.workforce().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId)),
      this.repo.db.many(this.repo.conflicts().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId)),
      this.repo.db.many(this.repo.signatures().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId))
    ]);
    const expiresAt = permit.planned_end_at ?? permit.valid_until ?? null;
    const expiresWithinTwoHours = expiresAt ? new Date(expiresAt).getTime() - Date.now() <= 2 * 60 * 60 * 1000 : false;
    const activeWorkers = workers.filter((worker: any) => worker.signed_in === true || (worker.time_in && !worker.time_out));
    const openConflicts = conflicts.filter((conflict: any) => ['Open', 'Conflict', 'Active'].includes(conflict.status));
    const confirmedIsolations = isolations.filter((item: any) => ['Confirmed', 'Verified', 'Locked Out'].includes(item.status ?? item.isolation_status));
    return {
      permit: { status: permit.status, permitType: permit.permit_type, riskLevel: permit.risk_level, activeRisks: permit.hazards ?? [], requiredControls: permit.controls ?? [], safetyCritical: permit.safety_critical ?? false },
      expiry: { permitExpiryAt: expiresAt, expiresWithinTwoHours },
      isolation: { status: isolations.length ? `${confirmedIsolations.length}/${isolations.length} verified` : 'No isolation required', deIsolationStatus: isolations.some((item: any) => item.de_isolated_at) ? 'Started' : 'Not Started', complete: !isolations.length || confirmedIsolations.length === isolations.length },
      gasTest: { status: gasSummary?.permitGasStatus ?? 'No gas test', nextDueAt: gasSummary?.nextRetestDueAt ?? null, dueSoon: gasSummary?.permitGasStatus === 'Re-Test Due Soon', overdue: gasSummary?.permitGasStatus === 'Re-Test Overdue' },
      workforce: { status: activeWorkers.length ? `${activeWorkers.length} worker(s) signed in` : 'No workers signed in', signedInCount: activeWorkers.length, briefingStatus: workers.length ? `${workers.filter((worker: any) => worker.signed_briefing || worker.briefing_completed).length}/${workers.length} briefed` : 'No workforce' },
      conflicts: { status: openConflicts.length ? `${openConflicts.length} open conflict(s)` : 'No open conflicts', openCount: openConflicts.length },
      signatures: { complete: signatures.length >= 2, completedCount: signatures.length }
    };
  }

  async conflictsForPermit(tenantId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    await this.detectAndStoreConflicts(tenantId, permit.created_by ?? '', permit);
    return this.repo.db.many(this.repo.conflicts().select('*, conflicting_permit:permits!permit_conflicts_conflicting_permit_id_fkey(id,permit_number,permit_type,status,title,job_area,equipment_tag)').eq('tenant_id', tenantId).eq('permit_id', permitId).order('detected_at', { ascending: false }));
  }

  async runConflictCheck(tenantId: string, actorId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const rows = await this.detectAndStoreConflicts(tenantId, actorId, permit);
    await this.history(tenantId, actorId, permit, 'CONFLICT_CHECK_RUN', `Conflict check completed: ${rows.length} conflict(s) detected`, null, rows);
    await this.conflictEvent(tenantId, actorId, permit, null, 'CONFLICT_CHECK_RUN', `Conflict check completed: ${rows.length} conflict(s) detected`, null, rows);
    await this.audit.write({ tenantId, actorId, action: 'PTW_CONFLICT_CHECK_RUN', entityType: 'Permit', entityId: permitId, after: rows as JsonValue });
    return this.conflictsForPermit(tenantId, permitId, scope);
  }

  async conflictSummary(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    const conflicts = await this.repo.db.many<any>(this.repo.conflicts().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId));
    const open = conflicts.filter((row) => row.status === 'Open' || row.status === 'Under Review');
    const critical = conflicts.filter((row) => row.severity === 'Critical');
    const high = conflicts.filter((row) => row.severity === 'High');
    const last = conflicts.map((row) => row.detected_at ?? row.created_at).filter(Boolean).sort().at(-1) ?? null;
    const blocked = open.some((row) => row.severity === 'Critical' || (row.severity === 'High' && row.override_status !== 'Approved'));
    const status = blocked ? 'Blocked' : open.length ? 'Review Required' : conflicts.some((row) => row.status === 'Overridden') ? 'Overridden' : conflicts.length ? 'Resolved' : 'No Conflict';
    const blockers = [
      !last ? 'Conflict check has not been run' : null,
      blocked ? 'Open high/critical conflict blocks activation' : null
    ].filter(Boolean);
    return {
      total: conflicts.length,
      open: open.length,
      overridden: conflicts.filter((row) => row.status === 'Overridden').length,
      resolved: conflicts.filter((row) => row.status === 'Resolved').length,
      critical: critical.length,
      high: high.length,
      lastCheckedAt: last,
      lastCheckedBy: conflicts.find((row) => row.detected_at === last)?.detected_by ?? null,
      overallStatus: status,
      activationBlocked: blockers.length > 0,
      blockers,
      checkScope: ['Same equipment', 'Same area', 'Same process unit', 'Nearby radius', 'Incompatible permit matrix', 'SIMOPS rules']
    };
  }

  async conflictDetail(tenantId: string, permitId: string, conflictId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    const conflict = await this.getConflict(tenantId, permitId, conflictId);
    const [overrides, history] = await Promise.all([
      this.conflictOverrideHistory(tenantId, permitId, conflictId, scope),
      this.repo.db.many(this.repo.conflictHistory().select('*').eq('tenant_id', tenantId).eq('conflict_id', conflictId).order('created_at', { ascending: false }))
    ]);
    return { ...conflict, overrides, history, relatedNotifications: [] };
  }

  async updateConflict(tenantId: string, actorId: string, permitId: string, conflictId: string, dto: UpdateConflictDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getConflict(tenantId, permitId, conflictId);
    const row = await this.repo.db.single<any>(this.repo.conflicts().update({ status: dto.status ?? before.status, resolution_notes: dto.resolutionNotes ?? before.resolution_notes ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', conflictId).select().single());
    await this.conflictEvent(tenantId, actorId, permit, conflictId, 'CONFLICT_UPDATED', `Conflict updated: ${row.status}`, before, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_CONFLICT_UPDATED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async resolveConflict(tenantId: string, actorId: string, permitId: string, conflictId: string, dto: UpdateConflictDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getConflict(tenantId, permitId, conflictId);
    const row = await this.repo.db.single<any>(this.repo.conflicts().update({ status: 'Resolved', resolved_by: actorId, resolved_at: new Date().toISOString(), resolution_notes: dto.resolutionNotes ?? 'Conflict resolved', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', conflictId).select().single());
    await this.conflictEvent(tenantId, actorId, permit, conflictId, 'CONFLICT_RESOLVED', row.resolution_notes ?? 'Conflict resolved', before, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_CONFLICT_RESOLVED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async falsePositiveConflict(tenantId: string, actorId: string, permitId: string, conflictId: string, dto: UpdateConflictDto, scope: Scope) {
    if (!dto.resolutionNotes?.trim()) throw new BadRequestException('False positive reason is required');
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getConflict(tenantId, permitId, conflictId);
    const row = await this.repo.db.single<any>(this.repo.conflicts().update({ status: 'False Positive', resolved_by: actorId, resolved_at: new Date().toISOString(), resolution_notes: dto.resolutionNotes, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', conflictId).select().single());
    await this.conflictEvent(tenantId, actorId, permit, conflictId, 'CONFLICT_FALSE_POSITIVE', dto.resolutionNotes, before, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_CONFLICT_FALSE_POSITIVE', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async overrideConflict(tenantId: string, actorId: string, permitId: string, conflictId: string, dto: SuspendPermitDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getConflict(tenantId, permitId, conflictId);
    const conflict = await this.repo.db.single<any>(this.repo.conflicts().update({ status: 'Overridden', override_status: 'Approved', reason: dto.reason, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', conflictId).select().single());
    await this.conflictEvent(tenantId, actorId, permit, conflictId, 'CONFLICT_OVERRIDDEN', dto.reason, before, conflict);
    return conflict;
  }

  async requestConflictOverride(tenantId: string, actorId: string, permitId: string, conflictId: string, dto: ConflictOverrideDto, scope: Scope) {
    if (!dto.justification?.trim()) throw new BadRequestException('Justification is required');
    const permit = await this.getBase(tenantId, permitId, scope);
    const conflict = await this.getConflict(tenantId, permitId, conflictId);
    if (['High', 'Critical'].includes(conflict.severity) && !dto.requiredControls?.trim()) throw new BadRequestException('Required controls are required for high/critical conflicts');
    const row = await this.repo.db.single<any>(this.repo.conflictOverrides().insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: permit.company_id, site_id: permit.site_id, conflict_id: conflictId, permit_id: permitId, requested_by: actorId, justification: dto.justification, required_controls: dto.requiredControls.split('\n').filter(Boolean), status: 'Pending Approval', ip_address: dto.ipAddress ?? null }).select().single());
    await this.repo.db.single(this.repo.conflicts().update({ status: 'Under Review', override_status: 'Pending Approval', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', conflictId).select().single());
    await this.conflictEvent(tenantId, actorId, permit, conflictId, 'CONFLICT_OVERRIDE_REQUESTED', dto.justification, conflict, row);
    await this.notification(tenantId, permit, 'ptw.conflict.override_requested', 'Conflict override requested');
    return row;
  }

  async approveConflictOverride(tenantId: string, actorId: string, permitId: string, conflictId: string, dto: ConflictOverrideDto, scope: Scope) {
    if (!dto.signature?.trim()) throw new BadRequestException('Electronic signature is required');
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getConflict(tenantId, permitId, conflictId);
    const override = await this.repo.db.single<any>(this.repo.conflictOverrides().update({ status: 'Approved', approved_by: actorId, approved_at: new Date().toISOString(), signature_id: crypto.randomUUID(), ip_address: dto.ipAddress ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('conflict_id', conflictId).eq('status', 'Pending Approval').select().single());
    const conflict = await this.repo.db.single<any>(this.repo.conflicts().update({ status: 'Overridden', override_status: 'Approved', reason: dto.comment ?? dto.justification, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', conflictId).select().single());
    await this.conflictEvent(tenantId, actorId, permit, conflictId, 'CONFLICT_OVERRIDE_APPROVED', dto.comment ?? 'Override approved', before, { conflict, override });
    await this.notification(tenantId, permit, 'ptw.conflict.override_approved', 'Conflict override approved');
    return { conflict, override };
  }

  async rejectConflictOverride(tenantId: string, actorId: string, permitId: string, conflictId: string, dto: ConflictRejectDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getConflict(tenantId, permitId, conflictId);
    const override = await this.repo.db.single<any>(this.repo.conflictOverrides().update({ status: 'Rejected', rejected_by: actorId, rejected_at: new Date().toISOString(), rejection_reason: dto.reason, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('conflict_id', conflictId).eq('status', 'Pending Approval').select().single());
    const conflict = await this.repo.db.single<any>(this.repo.conflicts().update({ status: 'Open', override_status: 'Rejected', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', conflictId).select().single());
    await this.conflictEvent(tenantId, actorId, permit, conflictId, 'CONFLICT_OVERRIDE_REJECTED', dto.reason, before, { conflict, override });
    return { conflict, override };
  }

  async conflictOverrideHistory(tenantId: string, permitId: string, conflictId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    return this.repo.db.many(this.repo.conflictOverrides().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('conflict_id', conflictId).order('created_at', { ascending: false }));
  }

  async simopsForPermit(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    const review = await this.repo.db.single<any>(this.repo.simopsReviews().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('created_at', { ascending: false }).limit(1).maybeSingle());
    if (!review) return null;
    const controls = await this.repo.db.many(this.repo.simopsControls().select('*').eq('tenant_id', tenantId).eq('simops_review_id', review.id).order('created_at'));
    return { ...review, controls };
  }

  async createSimopsReview(tenantId: string, actorId: string, permitId: string, dto: SimopsReviewDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const row = await this.repo.db.single<any>(this.repo.simopsReviews().insert(this.simopsPayload(tenantId, actorId, permit, dto)).select().single());
    await this.conflictEvent(tenantId, actorId, permit, null, 'SIMOPS_REVIEW_CREATED', 'SIMOPS review created', null, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_SIMOPS_REVIEW_CREATED', entityType: 'Permit', entityId: permitId, after: row as JsonValue });
    return row;
  }

  async updateSimopsReview(tenantId: string, actorId: string, permitId: string, simopsId: string, dto: SimopsReviewDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getSimops(tenantId, permitId, simopsId);
    const row = await this.repo.db.single<any>(this.repo.simopsReviews().update(this.simopsPayload(tenantId, actorId, permit, dto, false)).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', simopsId).select().single());
    await this.conflictEvent(tenantId, actorId, permit, null, 'SIMOPS_REVIEW_UPDATED', 'SIMOPS review updated', before, row);
    return row;
  }

  async approveSimopsReview(tenantId: string, actorId: string, permitId: string, simopsId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getSimops(tenantId, permitId, simopsId);
    const row = await this.repo.db.single<any>(this.repo.simopsReviews().update({ status: 'Approved', area_authority_reviewed: true, area_authority_reviewed_by: actorId, area_authority_reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', simopsId).select().single());
    await this.conflictEvent(tenantId, actorId, permit, null, 'SIMOPS_REVIEW_APPROVED', 'SIMOPS review approved', before, row);
    return row;
  }

  async rejectSimopsReview(tenantId: string, actorId: string, permitId: string, simopsId: string, dto: ConflictRejectDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getSimops(tenantId, permitId, simopsId);
    const row = await this.repo.db.single<any>(this.repo.simopsReviews().update({ status: 'Rejected', comments: dto.reason, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', simopsId).select().single());
    await this.conflictEvent(tenantId, actorId, permit, null, 'SIMOPS_REVIEW_REJECTED', dto.reason, before, row);
    return row;
  }

  async acknowledgeSimopsControlRoom(tenantId: string, actorId: string, permitId: string, simopsId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getSimops(tenantId, permitId, simopsId);
    const row = await this.repo.db.single<any>(this.repo.simopsReviews().update({ control_room_acknowledged: true, control_room_acknowledged_by: actorId, control_room_acknowledged_at: new Date().toISOString(), status: before.status === 'Required' ? 'Under Review' : before.status, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', simopsId).select().single());
    await this.conflictEvent(tenantId, actorId, permit, null, 'SIMOPS_CONTROL_ROOM_ACKNOWLEDGED', 'Control room acknowledged SIMOPS', before, row);
    return row;
  }

  async createSimopsControl(tenantId: string, actorId: string, permitId: string, simopsId: string, dto: SimopsControlDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    await this.getSimops(tenantId, permitId, simopsId);
    const row = await this.repo.db.single<any>(this.repo.simopsControls().insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: permit.company_id, site_id: permit.site_id, permit_id: permitId, simops_review_id: simopsId, control_description: dto.controlDescription, responsible_user_id: dto.responsibleUserId ?? null, due_at: dto.dueAt ?? null, status: dto.status ?? 'Open' }).select().single());
    await this.conflictEvent(tenantId, actorId, permit, null, 'SIMOPS_CONTROL_CREATED', row.control_description, null, row);
    return row;
  }

  async updateSimopsControl(tenantId: string, actorId: string, permitId: string, simopsId: string, controlId: string, dto: SimopsControlDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.simopsControls().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('simops_review_id', simopsId).eq('id', controlId).single());
    const row = await this.repo.db.single<any>(this.repo.simopsControls().update({ control_description: dto.controlDescription ?? before.control_description, responsible_user_id: dto.responsibleUserId ?? before.responsible_user_id ?? null, due_at: dto.dueAt ?? before.due_at ?? null, status: dto.status ?? before.status, completed_by: dto.status === 'Completed' ? actorId : before.completed_by, completed_at: dto.status === 'Completed' ? new Date().toISOString() : before.completed_at, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', controlId).select().single());
    await this.conflictEvent(tenantId, actorId, permit, null, 'SIMOPS_CONTROL_UPDATED', row.control_description, before, row);
    return row;
  }

  async conflictMatrix(tenantId: string, scope: Scope) {
    let query = this.repo.conflictMatrixRules().select('*').eq('tenant_id', tenantId).eq('is_active', true).order('created_at', { ascending: false });
    if (scope.selectedSiteId) query = query.eq('site_id', scope.selectedSiteId);
    return this.repo.db.many(query);
  }

  async createConflictMatrixRule(tenantId: string, actorId: string, dto: ConflictMatrixRuleDto, scope: Scope) {
    const row = await this.repo.db.single<any>(this.repo.conflictMatrixRules().insert(this.matrixPayload(tenantId, actorId, dto, scope)).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_CONFLICT_MATRIX_CREATED', entityType: 'PermitConflictMatrixRule', entityId: row.id, after: row as JsonValue });
    return row;
  }

  async updateConflictMatrixRule(tenantId: string, actorId: string, ruleId: string, dto: ConflictMatrixRuleDto, scope: Scope) {
    const row = await this.repo.db.single<any>(this.repo.conflictMatrixRules().update(this.matrixPayload(tenantId, actorId, dto, scope, false)).eq('tenant_id', tenantId).eq('id', ruleId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_CONFLICT_MATRIX_UPDATED', entityType: 'PermitConflictMatrixRule', entityId: ruleId, after: row as JsonValue });
    return row;
  }

  async deleteConflictMatrixRule(tenantId: string, actorId: string, ruleId: string, scope: Scope) {
    const row = await this.repo.db.single<any>(this.repo.conflictMatrixRules().update({ is_active: false, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', ruleId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_CONFLICT_MATRIX_DELETED', entityType: 'PermitConflictMatrixRule', entityId: ruleId, after: row as JsonValue });
    return row;
  }

  async conflictMap(tenantId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const conflicts = await this.conflictsForPermit(tenantId, permitId, scope);
    return {
      currentPermit: { id: permit.id, permitNumber: permit.permit_number, area: permit.job_area, equipmentTag: permit.equipment_tag, latitude: permit.latitude ?? null, longitude: permit.longitude ?? null },
      radiusMeters: 50,
      markers: conflicts.map((conflict: any, index: number) => ({ id: conflict.id, type: conflict.conflict_type, severity: conflict.severity, permitId: conflict.conflicting_permit_id, label: conflict.conflicting_permit?.permit_number ?? conflict.conflicting_permit_id, area: conflict.conflicting_permit?.job_area ?? permit.job_area, equipmentTag: conflict.conflicting_permit?.equipment_tag ?? conflict.conflicting_equipment_id, x: 15 + index * 12, y: 28 + index * 9 })),
      areas: [...new Set(conflicts.map((conflict: any) => conflict.conflicting_permit?.job_area ?? permit.job_area).filter(Boolean))]
    };
  }

  async conflictHistoryForPermit(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    return this.repo.db.many(this.repo.conflictHistory().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('created_at', { ascending: false }));
  }

  async closureChecklist(tenantId: string, actorId: string, permitId: string, dto: ClosureChecklistDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const complete = Object.values(dto.items ?? {}).every(Boolean);
    const row = await this.repo.db.single<any>(this.repo.closureChecklists().upsert({
      id: `closure_${permitId}`,
      tenant_id: tenantId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      permit_id: permitId,
      items: dto.items,
      completed_by: complete ? actorId : null,
      completed_at: complete ? new Date().toISOString() : null,
      verifier_id: complete ? actorId : null,
      verification_notes: dto.verificationNotes ?? null,
      created_by: actorId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'permit_id' }).select().single());
    await this.history(tenantId, actorId, permit, 'CLOSURE_CHECKLIST_UPDATED', 'Closure checklist updated', null, row);
    return row;
  }

  dashboard(tenantId: string, scope: Scope) {
    return this.dashboardData(tenantId, scope);
  }

  async dashboardKpis(tenantId: string, scope: Scope) {
    return (await this.dashboardData(tenantId, scope)).kpis;
  }

  async dashboardAlerts(tenantId: string, scope: Scope) {
    return (await this.dashboardData(tenantId, scope)).alerts;
  }

  async dashboardExpiring(tenantId: string, scope: Scope) {
    return (await this.dashboardData(tenantId, scope)).panels.expiring;
  }

  async dashboardGasRetest(tenantId: string, scope: Scope) {
    return (await this.dashboardData(tenantId, scope)).panels.gasRetest;
  }

  async dashboardConflicts(tenantId: string, scope: Scope) {
    return (await this.dashboardData(tenantId, scope)).panels.conflicts;
  }

  async dashboardIsolation(tenantId: string, scope: Scope) {
    return (await this.dashboardData(tenantId, scope)).panels.isolation;
  }

  async dashboardHandover(tenantId: string, scope: Scope) {
    return (await this.dashboardData(tenantId, scope)).panels.handover;
  }

  async dashboardSafetyCritical(tenantId: string, scope: Scope) {
    return (await this.dashboardData(tenantId, scope)).panels.safetyCritical;
  }

  async dashboardAreaOverview(tenantId: string, scope: Scope) {
    return (await this.dashboardData(tenantId, scope)).areaOverview;
  }

  async dashboardRunConflictScan(tenantId: string, actorId: string, scope: Scope) {
    const permits = await this.list(tenantId, { status: 'Active', limit: '100' }, scope);
    const results = [];
    for (const permit of permits as any[]) {
      results.push(...await this.detectAndStoreConflicts(tenantId, actorId, permit));
    }
    await this.audit.write({ tenantId, actorId, action: 'PTW_DASHBOARD_CONFLICT_SCAN', entityType: 'PermitDashboard', entityId: tenantId, after: { scanned: (permits as any[]).length, conflicts: results.length } as JsonValue });
    return { scanned: (permits as any[]).length, conflicts: results.length, results };
  }

  async dashboardExport(tenantId: string, actorId: string, scope: Scope, format: 'pdf' | 'csv') {
    const dashboard = await this.dashboardData(tenantId, scope);
    await this.audit.write({ tenantId, actorId, action: `PTW_DASHBOARD_EXPORT_${format.toUpperCase()}`, entityType: 'PermitDashboard', entityId: tenantId, after: { format, generatedAt: new Date().toISOString() } as JsonValue });
    return { format, fileName: `ptw-dashboard.${format}`, generatedAt: new Date().toISOString(), dashboard };
  }

  async map(tenantId: string, scope: Scope, query: Record<string, string> = {}) {
    return this.ptwMapData(tenantId, scope, query);
  }

  async mapSummary(tenantId: string, scope: Scope, query: Record<string, string> = {}) {
    return (await this.ptwMapData(tenantId, scope, query)).summary;
  }

  async mapAreas(tenantId: string, scope: Scope, query: Record<string, string> = {}) {
    return (await this.ptwMapData(tenantId, scope, query)).areas;
  }

  async mapEquipment(tenantId: string, scope: Scope, query: Record<string, string> = {}) {
    return (await this.ptwMapData(tenantId, scope, query)).equipment;
  }

  async mapConflicts(tenantId: string, scope: Scope, query: Record<string, string> = {}) {
    return (await this.ptwMapData(tenantId, scope, query)).conflicts;
  }

  async mapAlerts(tenantId: string, scope: Scope, query: Record<string, string> = {}) {
    return (await this.ptwMapData(tenantId, scope, query)).alerts;
  }

  async mapLayouts(tenantId: string, scope: Scope, query: Record<string, string> = {}) {
    let dbQuery = this.repo.mapLayouts().select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false });
    dbQuery = this.applyMapScope(dbQuery, scope, query);
    return this.safeMany<any>(dbQuery);
  }

  async createMapLayout(tenantId: string, actorId: string, scope: Scope, dto: Record<string, any>) {
    const siteId = dto.siteId ?? dto.site_id ?? scope.selectedSiteId;
    this.assertSiteAccess(siteId, scope);
    const row = await this.repo.db.single<any>(this.repo.mapLayouts().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: dto.companyId ?? dto.company_id ?? await this.companyForSite(siteId),
      site_id: siteId,
      unit_id: dto.unitId ?? dto.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? null,
      layout_name: dto.layoutName ?? dto.layout_name ?? 'Plant Layout',
      layout_type: dto.layoutType ?? dto.layout_type ?? 'DATA',
      svg_file_url: dto.svgFileUrl ?? dto.svg_file_url ?? null,
      image_file_url: dto.imageFileUrl ?? dto.image_file_url ?? null,
      width: Number(dto.width ?? 1200),
      height: Number(dto.height ?? 720),
      version: dto.version ?? '1.0',
      is_active: dto.isActive ?? dto.is_active ?? true,
      created_by: actorId,
      updated_at: new Date().toISOString()
    }).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_MAP_LAYOUT_CREATED', entityType: 'PTWMapLayout', entityId: row.id, after: row as JsonValue });
    return row;
  }

  async updateMapLayout(tenantId: string, actorId: string, scope: Scope, layoutId: string, dto: Record<string, any>) {
    const before = await this.getMapLayout(tenantId, scope, layoutId);
    const patch = this.mapLayoutPatch(dto);
    const row = await this.repo.db.single<any>(this.repo.mapLayouts().update({ ...patch, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', layoutId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_MAP_LAYOUT_UPDATED', entityType: 'PTWMapLayout', entityId: layoutId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async deleteMapLayout(tenantId: string, actorId: string, scope: Scope, layoutId: string) {
    const before = await this.getMapLayout(tenantId, scope, layoutId);
    await this.repo.db.single<any>(this.repo.mapLayouts().update({ is_active: false, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', layoutId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_MAP_LAYOUT_DELETED', entityType: 'PTWMapLayout', entityId: layoutId, before: before as JsonValue });
    return { deleted: true, id: layoutId };
  }

  async uploadMapSvg(tenantId: string, actorId: string, scope: Scope, layoutId: string, file?: UploadedPtwFile) {
    const layout = await this.getMapLayout(tenantId, scope, layoutId);
    if (!file) throw new BadRequestException('SVG file is required');
    if (!/svg|xml/i.test(file.mimetype) && !file.originalname.toLowerCase().endsWith('.svg')) throw new BadRequestException('Only SVG files are supported for plant layout upload');
    const storageKey = `${layout.company_id}/${layout.site_id}/ptw-map/${layoutId}/${crypto.randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await this.persistUploadedFile(storageKey, file.buffer);
    const row = await this.repo.db.single<any>(this.repo.mapLayouts().update({ layout_type: 'SVG', svg_file_url: `/api/v1/ptw/map/layouts/${layoutId}/svg/${encodeURIComponent(storageKey)}`, uploaded_by: actorId, uploaded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', layoutId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_MAP_SVG_UPLOADED', entityType: 'PTWMapLayout', entityId: layoutId, after: row as JsonValue });
    return row;
  }

  async mapZones(tenantId: string, scope: Scope, layoutId: string) {
    await this.getMapLayout(tenantId, scope, layoutId);
    return this.safeMany<any>(this.repo.mapZones().select('*').eq('tenant_id', tenantId).eq('layout_id', layoutId).order('zone_name'));
  }

  async createMapZone(tenantId: string, actorId: string, scope: Scope, layoutId: string, dto: Record<string, any>) {
    const layout = await this.getMapLayout(tenantId, scope, layoutId);
    const row = await this.repo.db.single<any>(this.repo.mapZones().insert(this.mapZonePayload(tenantId, actorId, layout, dto)).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_MAP_ZONE_CREATED', entityType: 'PTWMapZone', entityId: row.id, after: row as JsonValue });
    return row;
  }

  async updateMapZone(tenantId: string, actorId: string, scope: Scope, layoutId: string, zoneId: string, dto: Record<string, any>) {
    await this.getMapLayout(tenantId, scope, layoutId);
    const before = await this.repo.db.single<any>(this.repo.mapZones().select('*').eq('tenant_id', tenantId).eq('layout_id', layoutId).eq('id', zoneId).maybeSingle());
    if (!before) throw new NotFoundException('Map zone not found');
    const row = await this.repo.db.single<any>(this.repo.mapZones().update({ ...this.mapZonePatch(dto), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('layout_id', layoutId).eq('id', zoneId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_MAP_ZONE_UPDATED', entityType: 'PTWMapZone', entityId: zoneId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async deleteMapZone(tenantId: string, actorId: string, scope: Scope, layoutId: string, zoneId: string) {
    await this.getMapLayout(tenantId, scope, layoutId);
    const before = await this.repo.db.single<any>(this.repo.mapZones().select('*').eq('tenant_id', tenantId).eq('layout_id', layoutId).eq('id', zoneId).maybeSingle());
    if (!before) throw new NotFoundException('Map zone not found');
    await this.repo.db.single<any>(this.repo.mapZones().delete().eq('tenant_id', tenantId).eq('layout_id', layoutId).eq('id', zoneId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_MAP_ZONE_DELETED', entityType: 'PTWMapZone', entityId: zoneId, before: before as JsonValue });
    return { deleted: true, id: zoneId };
  }

  async mapConfiguredMarkers(tenantId: string, scope: Scope, layoutId: string) {
    await this.getMapLayout(tenantId, scope, layoutId);
    return this.safeMany<any>(this.repo.mapMarkers().select('*').eq('tenant_id', tenantId).eq('layout_id', layoutId).order('label'));
  }

  async createMapMarker(tenantId: string, actorId: string, scope: Scope, layoutId: string, dto: Record<string, any>) {
    const layout = await this.getMapLayout(tenantId, scope, layoutId);
    const row = await this.repo.db.single<any>(this.repo.mapMarkers().insert(this.mapMarkerPayload(tenantId, actorId, layout, dto)).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_MAP_MARKER_CREATED', entityType: 'PTWMapMarker', entityId: row.id, after: row as JsonValue });
    return row;
  }

  async updateMapMarker(tenantId: string, actorId: string, scope: Scope, layoutId: string, markerId: string, dto: Record<string, any>) {
    await this.getMapLayout(tenantId, scope, layoutId);
    const before = await this.repo.db.single<any>(this.repo.mapMarkers().select('*').eq('tenant_id', tenantId).eq('layout_id', layoutId).eq('id', markerId).maybeSingle());
    if (!before) throw new NotFoundException('Map marker not found');
    const row = await this.repo.db.single<any>(this.repo.mapMarkers().update({ ...this.mapMarkerPatch(dto), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('layout_id', layoutId).eq('id', markerId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_MAP_MARKER_UPDATED', entityType: 'PTWMapMarker', entityId: markerId, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async deleteMapMarker(tenantId: string, actorId: string, scope: Scope, layoutId: string, markerId: string) {
    await this.getMapLayout(tenantId, scope, layoutId);
    const before = await this.repo.db.single<any>(this.repo.mapMarkers().select('*').eq('tenant_id', tenantId).eq('layout_id', layoutId).eq('id', markerId).maybeSingle());
    if (!before) throw new NotFoundException('Map marker not found');
    await this.repo.db.single<any>(this.repo.mapMarkers().delete().eq('tenant_id', tenantId).eq('layout_id', layoutId).eq('id', markerId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_MAP_MARKER_DELETED', entityType: 'PTWMapMarker', entityId: markerId, before: before as JsonValue });
    return { deleted: true, id: markerId };
  }

  expiring(tenantId: string, scope: Scope) {
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    return this.list(tenantId, { status: 'Active', dateTo: soon }, scope);
  }

  active(tenantId: string, scope: Scope) {
    return this.list(tenantId, { status: 'Active' }, scope);
  }

  async newPermitContext(tenantId: string, scope: Scope) {
    const applySiteScope = (query: any, column = 'siteId') => {
      if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId);
      if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds);
      return query;
    };
    const siteQuery = () => {
      let query = this.repo.db.from('Site').select('id,name,code,companyId').eq('tenantId', tenantId).order('name');
      if (scope.selectedSiteId) query = query.eq('id', scope.selectedSiteId);
      else if (!scope.corporateView && scope.allowedSiteIds?.length) query = query.in('id', scope.allowedSiteIds);
      return query;
    };
    const [permitTypes, sites, units, areas, gasThresholds, contractorCompanies] = await Promise.all([
      this.safeMany(this.repo.permitTypes().select('*').eq('tenant_id', tenantId).order('name')),
      this.safeMany(siteQuery()),
      this.safeMany(applySiteScope(this.repo.db.from('Unit').select('id,name,code,siteId').eq('tenantId', tenantId)).order('name')),
      this.safeMany(this.repo.db.from('Area').select('id,name,code,unitId').eq('tenantId', tenantId).order('name')),
      this.safeMany(applySiteScope(this.repo.thresholds().select('*').eq('tenant_id', tenantId), 'site_id').order('gas_key')),
      this.safeMany(this.repo.db.from('ContractorCompany').select('id,name,status').eq('tenantId', tenantId).order('name'))
    ]);
    return { permitTypes, sites, units, areas, gasThresholds, contractorCompanies };
  }

  async equipmentSearch(tenantId: string, search: string, scope: Scope) {
    let query = this.repo.db.from('Equipment')
      .select('id,tag,name,type,criticality,safetyCritical,siteId,unitId,areaId,fluidService,hazardClass,unit:Unit(id,name,code),area:Area(id,name,code)')
      .eq('tenantId', tenantId)
      .order('tag')
      .limit(25);
    const term = search.trim();
    if (term) query = query.or(`tag.ilike.%${term}%,name.ilike.%${term}%,type.ilike.%${term}%`);
    if (scope.selectedSiteId) query = query.eq('siteId', scope.selectedSiteId);
    else if (!scope.corporateView && scope.allowedSiteIds?.length) query = query.in('siteId', scope.allowedSiteIds);
    return this.repo.db.many(query);
  }

  equipmentPermits(tenantId: string, equipmentId: string, scope: Scope) {
    return this.list(tenantId, { equipmentId }, scope);
  }

  async addAttachment(tenantId: string, actorId: string, permitId: string, dto: PermitAttachmentDto, scope: Scope, file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const fileName = dto.fileName ?? file?.originalname ?? 'attachment.bin';
    const mimeType = dto.mimeType ?? file?.mimetype ?? 'application/octet-stream';
    this.assertSafeAttachment(fileName, mimeType);
    const storageKey = dto.storageKey ?? `${permit.company_id}/${permit.site_id}/ptw/${permitId}/${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    if (file?.buffer) await this.persistUploadedFile(storageKey, file.buffer);
    const attachment = await this.repo.db.single<any>(this.repo.attachments().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      permit_id: permitId,
      title: dto.title ?? fileName,
      attachment_type: dto.attachmentType ?? 'Other',
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: dto.sizeBytes ?? file?.size ?? 0,
      file_size: dto.sizeBytes ?? file?.size ?? 0,
      storage_key: storageKey,
      file_key: storageKey,
      description: dto.description ?? null,
      related_section: dto.relatedSection ?? null,
      is_evidence: dto.isEvidence ?? false,
      is_required: dto.isRequired ?? false,
      visibility: dto.visibility ?? 'Internal',
      uploaded_by: actorId,
      uploaded_at: new Date().toISOString(),
      created_by: actorId,
      updated_at: new Date().toISOString()
    }).select().single());
    await this.history(tenantId, actorId, permit, 'ATTACHMENT_UPLOADED', `Attachment uploaded: ${dto.title ?? fileName}`, null, attachment);
    await this.audit.write({ tenantId, actorId, action: 'PTW_ATTACHMENT_UPLOADED', entityType: 'Permit', entityId: permitId, after: attachment as JsonValue });
    return attachment;
  }

  async attachmentsForPermit(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    return this.repo.db.many(this.repo.attachments().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).is('deleted_at', null).order('created_at', { ascending: false }));
  }

  async attachmentSummary(tenantId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const [attachments, requirements] = await Promise.all([this.attachmentsForPermit(tenantId, permitId, scope), this.attachmentRequirementsForPermit(tenantId, permitId, scope)]);
    const uploadedTypes = new Set(attachments.map((item: any) => item.attachment_type ?? item.title));
    const required = requirements.filter((item: any) => item.is_required);
    const missing = required.filter((item: any) => !uploadedTypes.has(item.attachment_type));
    const uploadedToday = attachments.filter((item: any) => new Date(item.uploaded_at ?? item.created_at).toDateString() === new Date().toDateString()).length;
    const storageUsedBytes = attachments.reduce((total: number, item: any) => total + Number(item.file_size ?? item.size_bytes ?? 0), 0);
    const linkedDocuments = attachments.filter((item: any) => item.document_id).length;
    const status = required.length === 0 ? 'Not Required' : missing.length ? 'Missing Required Files' : 'Complete';
    return { permitId: permit.id, totalAttachments: attachments.length, requiredAttachments: required.length, missingRequired: missing.length, uploadedToday, linkedDocuments, storageUsedBytes, status, missingTypes: missing.map((item: any) => item.attachment_type) };
  }

  async attachmentRequirementsForPermit(tenantId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const policy = this.attachmentRulesForPermit(permit);
    const siteRules = await this.repo.db.many<any>(this.repo.attachmentRequirements().select('*').eq('tenant_id', tenantId).eq('is_active', true).or(`site_id.is.null,site_id.eq.${permit.site_id}`));
    const matching = siteRules.filter((rule: any) => (!rule.permit_type || rule.permit_type === permit.permit_type) && (!rule.risk_level || rule.risk_level === permit.risk_level));
    const merged = new Map<string, any>();
    for (const item of [...policy, ...matching]) merged.set(item.attachment_type, item);
    return [...merged.values()];
  }

  async attachmentRequirements(tenantId: string, scope: Scope) {
    let query = this.repo.attachmentRequirements().select('*').eq('tenant_id', tenantId).eq('is_active', true).order('created_at', { ascending: false });
    if (scope.selectedSiteId) query = query.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    return this.repo.db.many(query);
  }

  async createAttachmentRequirement(tenantId: string, actorId: string, dto: any, scope: Scope) {
    const row = await this.repo.db.single<any>(this.repo.attachmentRequirements().insert(this.attachmentRequirementPayload(tenantId, actorId, dto, scope)).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_ATTACHMENT_REQUIREMENT_CREATED', entityType: 'PermitAttachmentRequirement', entityId: row.id, after: row as JsonValue });
    return row;
  }

  async updateAttachmentRequirement(tenantId: string, actorId: string, requirementId: string, dto: any, scope: Scope) {
    const row = await this.repo.db.single<any>(this.repo.attachmentRequirements().update(this.attachmentRequirementPayload(tenantId, actorId, dto, scope, false)).eq('tenant_id', tenantId).eq('id', requirementId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_ATTACHMENT_REQUIREMENT_UPDATED', entityType: 'PermitAttachmentRequirement', entityId: requirementId, after: row as JsonValue });
    return row;
  }

  async deleteAttachmentRequirement(tenantId: string, actorId: string, requirementId: string) {
    const row = await this.repo.db.single<any>(this.repo.attachmentRequirements().update({ is_active: false, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', requirementId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_ATTACHMENT_REQUIREMENT_DELETED', entityType: 'PermitAttachmentRequirement', entityId: requirementId, after: row as JsonValue });
    return row;
  }

  async attachmentDetail(tenantId: string, permitId: string, attachmentId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    const attachment = await this.repo.db.single<any>(this.repo.attachments().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', attachmentId).is('deleted_at', null).maybeSingle());
    if (!attachment) throw new NotFoundException('Attachment not found');
    return attachment;
  }

  async previewAttachment(tenantId: string, actorId: string, permitId: string, attachmentId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const attachment = await this.attachmentDetail(tenantId, permitId, attachmentId, scope);
    await this.history(tenantId, actorId, permit, 'ATTACHMENT_PREVIEWED', `Attachment previewed: ${attachment.title}`, null, attachment);
    return { ...attachment, previewUrl: `/api/v1/ptw/${permitId}/attachments/${attachmentId}/download`, previewSupported: this.previewSupported(attachment.mime_type) };
  }

  async linkDocumentAttachment(tenantId: string, actorId: string, permitId: string, dto: any, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const row = await this.repo.db.single<any>(this.repo.attachments().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      permit_id: permitId,
      title: dto.title ?? dto.documentNumber ?? 'Linked controlled document',
      attachment_type: dto.attachmentType ?? 'Document Control',
      file_name: dto.documentNumber ?? dto.documentId,
      mime_type: 'application/vnd.psm.document-control',
      size_bytes: 0,
      file_size: 0,
      storage_key: `document-control/${dto.documentId}`,
      file_key: `document-control/${dto.documentId}`,
      document_id: dto.documentId,
      document_version_id: dto.documentVersionId ?? null,
      uploaded_by: actorId,
      uploaded_at: new Date().toISOString(),
      created_by: actorId,
      updated_at: new Date().toISOString()
    }).select().single());
    await this.history(tenantId, actorId, permit, 'DOCUMENT_LINKED', `Document linked: ${row.title}`, null, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_DOCUMENT_LINKED', entityType: 'Permit', entityId: permitId, after: row as JsonValue });
    return row;
  }

  async unlinkDocumentAttachment(tenantId: string, actorId: string, permitId: string, documentId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const row = await this.repo.db.single<any>(this.repo.attachments().update({ deleted_by: actorId, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('document_id', documentId).is('deleted_at', null).select().single());
    await this.history(tenantId, actorId, permit, 'DOCUMENT_UNLINKED', `Document unlinked: ${row.title}`, row, null);
    return row;
  }

  async deleteAttachment(tenantId: string, actorId: string, permitId: string, attachmentId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const attachment = await this.repo.db.single<any>(this.repo.attachments().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', attachmentId).maybeSingle());
    if (!attachment) throw new NotFoundException('Attachment not found');
    await this.repo.db.single(this.repo.attachments().update({ deleted_by: actorId, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', attachmentId).select().single());
    await this.history(tenantId, actorId, permit, 'ATTACHMENT_DELETED', `Attachment deleted: ${attachment.title}`, attachment, null);
    await this.audit.write({ tenantId, actorId, action: 'PTW_ATTACHMENT_DELETED', entityType: 'Permit', entityId: permitId, before: attachment as JsonValue });
    return { deleted: true, id: attachmentId };
  }

  async readAttachment(tenantId: string, permitId: string, attachmentId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    const attachment = await this.repo.db.single<any>(this.repo.attachments().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', attachmentId).is('deleted_at', null).maybeSingle());
    if (!attachment) throw new NotFoundException('Attachment not found');
    return { buffer: await this.readStoredFile(attachment.storage_key), fileName: attachment.file_name, mimeType: attachment.mime_type ?? 'application/octet-stream' };
  }

  async addSignature(tenantId: string, actorId: string, permitId: string, dto: AddSignatureDto, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const signature = await this.signature(tenantId, actorId, permit, dto.signatureType, dto.signature, dto.roleName, dto.ipAddress);
    await this.history(tenantId, actorId, permit, 'SIGNATURE_COMPLETED', `${dto.signatureType} signature completed`, null, signature);
    return signature;
  }

  async signaturesForPermit(tenantId: string, permitId: string, scope: Scope): Promise<Record<string, any>[]> {
    await this.getBase(tenantId, permitId, scope);
    return this.repo.db.many<Record<string, any>>(this.repo.signatures().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('created_at', { ascending: true }));
  }

  async signatureSummary(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    const rows = await this.signaturesForPermit(tenantId, permitId, scope);
    return PtwSignatureService.summary(rows);
  }

  async generateSignatureRequirements(tenantId: string, actorId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const roles = this.requiredSignatureRoles(permit);
    const existing = await this.signaturesForPermit(tenantId, permitId, scope);
    const existingKeys = new Set(existing.map((row: any) => `${row.signature_role ?? row.signature_type}:${row.signature_purpose}:${row.required_for_status}`));
    const rows = [];
    for (const req of roles) {
      const key = `${req.role}:${req.purpose}:${req.status}`;
      if (existingKeys.has(key)) continue;
      const row = await this.repo.db.single<any>(this.repo.signatures().insert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: permit.company_id,
        site_id: permit.site_id,
        permit_id: permitId,
        signature_type: req.role,
        signature_role: req.role,
        signature_purpose: req.purpose,
        required_for_status: req.status,
        assigned_user_id: req.userId ?? null,
        assigned_role_id: req.roleId ?? null,
        status: 'Pending',
        created_by: actorId,
        updated_at: new Date().toISOString()
      }).select().single());
      await this.signatureEvent(tenantId, actorId, permit, row.id, 'SIGNATURE_REQUESTED', `${req.role} signature requested`, null, row);
      rows.push(row);
    }
    await this.audit.write({ tenantId, actorId, action: 'PTW_SIGNATURE_REQUIREMENTS_GENERATED', entityType: 'Permit', entityId: permitId, after: rows as JsonValue });
    if (rows.length) await this.notification(tenantId, permit, 'ptw.signature.requested', `${rows.length} signature(s) requested`);
    return this.signaturesForPermit(tenantId, permitId, scope);
  }

  async signPermitSignature(tenantId: string, actorId: string, permitId: string, signatureId: string, dto: SignPermitSignatureDto, scope: Scope) {
    ElectronicSignatureAdapter.assertValid(dto);
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getPermitSignature(tenantId, permitId, signatureId);
    this.assertSignatureActor(actorId, before);
    if (before.status === 'Signed') throw new BadRequestException('Signature already completed');
    const row = await this.repo.db.single<any>(this.repo.signatures().update({ status: 'Signed', signed_by: actorId, signed_at: new Date().toISOString(), signature_id: crypto.randomUUID(), signature: dto.electronicSignature, ip_address: dto.ipAddress ?? null, user_agent: dto.userAgent ?? null, comment: dto.comment ?? null, rejection_reason: null, correction_required: null, revalidation_required: false, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', signatureId).select().single());
    await this.signatureEvent(tenantId, actorId, permit, signatureId, 'SIGNATURE_COMPLETED', `${row.signature_role ?? row.signature_type} signature completed`, before, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_SIGNATURE_COMPLETED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: row as JsonValue });
    await this.notification(tenantId, permit, 'ptw.signature.completed', `${row.signature_role ?? row.signature_type} signature completed`);
    return row;
  }

  async rejectPermitSignature(tenantId: string, actorId: string, permitId: string, signatureId: string, dto: RejectPermitSignatureDto, scope: Scope) {
    if (!dto.rejectionReason?.trim()) throw new BadRequestException('Rejection reason is required');
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getPermitSignature(tenantId, permitId, signatureId);
    this.assertSignatureActor(actorId, before);
    const row = await this.repo.db.single<any>(this.repo.signatures().update({ status: 'Rejected', rejection_reason: dto.rejectionReason, correction_required: dto.correctionRequired ?? null, comment: dto.comment ?? null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', signatureId).select().single());
    await this.signatureEvent(tenantId, actorId, permit, signatureId, 'SIGNATURE_REJECTED', dto.rejectionReason, before, row);
    await this.audit.write({ tenantId, actorId, action: 'PTW_SIGNATURE_REJECTED', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: row as JsonValue });
    await this.notification(tenantId, permit, 'ptw.signature.rejected', `${row.signature_role ?? row.signature_type} signature rejected`);
    return row;
  }

  async revalidatePermitSignature(tenantId: string, actorId: string, permitId: string, signatureId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.getPermitSignature(tenantId, permitId, signatureId);
    const row = await this.repo.db.single<any>(this.repo.signatures().update({ status: 'Pending', signed_by: null, signed_at: null, signature_id: null, signature: null, revalidation_required: true, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', signatureId).select().single());
    await this.signatureEvent(tenantId, actorId, permit, signatureId, 'SIGNATURE_REVALIDATION_REQUIRED', `${row.signature_role ?? row.signature_type} signature requires revalidation`, before, row);
    await this.notification(tenantId, permit, 'ptw.signature.revalidation_required', 'Signature revalidation required');
    return row;
  }

  async signatureHistoryForPermit(tenantId: string, permitId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    return this.repo.db.many(this.repo.signatureHistory().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('created_at', { ascending: false }));
  }

  async signatureRequirements(tenantId: string, scope: Scope) {
    let query = this.repo.signatureRequirements().select('*').eq('tenant_id', tenantId).eq('is_active', true).order('created_at', { ascending: false });
    if (scope.selectedSiteId) query = query.eq('site_id', scope.selectedSiteId);
    return this.repo.db.many(query);
  }

  async createSignatureRequirement(tenantId: string, actorId: string, dto: SignatureRequirementDto, scope: Scope) {
    const row = await this.repo.db.single<any>(this.repo.signatureRequirements().insert(this.signatureRequirementPayload(tenantId, actorId, dto, scope)).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_SIGNATURE_REQUIREMENT_CREATED', entityType: 'PermitSignatureRequirement', entityId: row.id, after: row as JsonValue });
    return row;
  }

  async updateSignatureRequirement(tenantId: string, actorId: string, requirementId: string, dto: SignatureRequirementDto, scope: Scope) {
    const row = await this.repo.db.single<any>(this.repo.signatureRequirements().update(this.signatureRequirementPayload(tenantId, actorId, dto, scope, false)).eq('tenant_id', tenantId).eq('id', requirementId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_SIGNATURE_REQUIREMENT_UPDATED', entityType: 'PermitSignatureRequirement', entityId: requirementId, after: row as JsonValue });
    return row;
  }

  async deleteSignatureRequirement(tenantId: string, actorId: string, requirementId: string, scope: Scope) {
    const row = await this.repo.db.single<any>(this.repo.signatureRequirements().update({ is_active: false, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', requirementId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_SIGNATURE_REQUIREMENT_DELETED', entityType: 'PermitSignatureRequirement', entityId: requirementId, after: row as JsonValue });
    return row;
  }

  async historyForPermit(tenantId: string, permitId: string, scope: Scope, filters: any = {}) {
    await this.getBase(tenantId, permitId, scope);
    let query = this.repo.history().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId);
    if (filters.category && filters.category !== 'All') query = query.eq('event_category', filters.category);
    if (filters.event_type) query = query.eq('event_type', filters.event_type);
    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.date_from) query = query.gte('created_at', filters.date_from);
    if (filters.date_to) query = query.lte('created_at', filters.date_to);
    if (filters.safety_critical === true) query = query.eq('is_safety_critical', true);
    if (filters.search?.trim()) query = query.or(`event_type.ilike.%${filters.search}%,title.ilike.%${filters.search}%,event_title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    const page = Number(filters.page ?? 1);
    const limit = Math.min(Number(filters.limit ?? 100), 250);
    return this.repo.db.many(query.order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1));
  }

  async historySummary(tenantId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const rows = await this.historyForPermit(tenantId, permitId, scope, { limit: 500 });
    const last = rows[0] as any;
    const lifecycleEvents = rows.filter((row: any) => row.event_category === 'Lifecycle' || String(row.event_type).startsWith('PERMIT_')).length;
    const safetyCriticalEvents = rows.filter((row: any) => row.is_safety_critical).length;
    return { permitId, totalEvents: rows.length, lastEvent: last?.event_title ?? last?.title ?? last?.event_type ?? null, lastUpdatedBy: last?.user_name ?? last?.actor_id ?? last?.user_id ?? null, lastUpdatedAt: last?.created_at ?? null, permitAgeDays: Math.max(0, Math.floor((Date.now() - new Date(permit.created_at).getTime()) / 86400000)), currentStatus: permit.status, lifecycleEvents, safetyCriticalEvents };
  }

  async historyEvent(tenantId: string, permitId: string, eventId: string, scope: Scope) {
    await this.getBase(tenantId, permitId, scope);
    const row = await this.repo.db.single<any>(this.repo.history().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', eventId).maybeSingle());
    if (!row) throw new NotFoundException('History event not found');
    return row;
  }

  async historyExport(tenantId: string, permitId: string, scope: Scope, kind: 'pdf' | 'csv') {
    const permit = await this.getBase(tenantId, permitId, scope);
    const rows = await this.historyForPermit(tenantId, permitId, scope, { limit: 500 });
    if (kind === 'csv') {
      const header = ['created_at', 'event_category', 'event_type', 'event_title', 'user_id', 'is_safety_critical'];
      const csv = [header.join(','), ...rows.map((row: any) => header.map((key) => JSON.stringify(row[key] ?? '')).join(','))].join('\n');
      return { buffer: Buffer.from(csv, 'utf-8'), fileName: `${permit.permit_number}-history.csv`, mimeType: 'text/csv' };
    }
    const lines = ['PSM OS - PTW History Export', `Permit: ${permit.permit_number}`, `Status: ${permit.status}`, ...rows.slice(0, 25).map((row: any) => `${new Date(row.created_at).toLocaleString()} - ${row.event_category ?? 'System'} - ${row.event_title ?? row.title ?? row.event_type}`)];
    return { buffer: this.simplePdf(lines), fileName: `${permit.permit_number}-history.pdf`, mimeType: 'application/pdf' };
  }

  async certificate(tenantId: string, permitId: string, scope: Scope, kind: 'permit' | 'isolation') {
    const permit = await this.get(tenantId, permitId, scope);
    const lines = kind === 'isolation'
      ? [
          'PSM OS - Isolation Certificate',
          `Permit: ${permit.permit_number}`,
          `Work: ${permit.title}`,
          `Isolation points: ${permit.isolations.length}`,
          ...permit.isolations.map((item: any) => `${item.isolation_point} - ${item.status} - Lock ${item.lock_number ?? 'N/A'}`)
        ]
      : [
          'PSM OS - Permit To Work Certificate',
          `Permit: ${permit.permit_number}`,
          `Type: ${permit.permit_type}`,
          `Status: ${permit.status}`,
          `Risk: ${permit.risk_level}`,
          `Equipment: ${permit.equipment_tag ?? 'N/A'} ${permit.equipment_name ?? ''}`,
          `Start: ${permit.planned_start_at}`,
          `Expiry: ${permit.planned_end_at}`,
          `Work: ${permit.work_description}`
        ];
    return { buffer: this.simplePdf(lines), fileName: `${permit.permit_number}-${kind}-certificate.pdf`, mimeType: 'application/pdf' };
  }

  async createTemplate(tenantId: string, actorId: string, dto: CreatePermitTemplateDto, scope: Scope) {
    if (dto.siteId) this.assertSiteAccess(dto.siteId, scope);
    const row = await this.repo.db.single<any>(this.repo.templates().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: dto.siteId ? await this.companyForSite(dto.siteId) : null,
      site_id: dto.siteId ?? null,
      permit_type: dto.permitType,
      name: dto.name,
      description: dto.description ?? null,
      template_data: dto.templateData,
      equipment_id: dto.equipmentId ?? null,
      created_by: actorId,
      updated_at: new Date().toISOString()
    }).select().single());
    await this.audit.write({ tenantId, actorId, action: 'PTW_TEMPLATE_CREATED', entityType: 'PermitTemplate', entityId: row.id, after: row as JsonValue });
    return row;
  }

  templates(tenantId: string, scope: Scope) {
    let query = this.repo.templates().select('*').eq('tenant_id', tenantId);
    if (scope.selectedSiteId) query = query.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    return this.repo.db.many(query.order('name'));
  }

  async clone(tenantId: string, actorId: string, permitId: string, scope: Scope) {
    const source = await this.get(tenantId, permitId, scope);
    return this.create(tenantId, actorId, {
      siteId: source.site_id,
      unitId: source.unit_id,
      areaId: source.area_id,
      permitType: source.permit_type,
      title: `${source.title} Copy`,
      workDescription: source.work_description,
      riskLevel: source.risk_level,
      equipmentId: source.equipment_id,
      location: source.location,
      jobArea: source.job_area,
      holderId: source.holder_id,
      areaAuthorityId: source.area_authority_id,
      contractorCompanyId: source.contractor_company_id,
      plannedStartAt: new Date().toISOString(),
      plannedEndAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      requiredControls: source.required_controls,
      typeSpecificData: source.type_specific_data,
      maxPersonnel: source.max_personnel
    }, scope);
  }

  async createMocAction(tenantId: string, actorId: string, permitId: string, scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const action = await this.actions.create(tenantId, actorId, {
      sourceModule: 'PTW',
      sourceType: 'Permit',
      sourceRecordId: permitId,
      title: `Create MOC from ${permit.permit_number}`,
      description: `Evaluate whether permit work requires a Management of Change record. ${permit.work_description ?? ''}`,
      priority: permit.risk_level === 'High' ? 'HIGH' : 'MEDIUM',
      ownerId: permit.area_authority_id ?? permit.issuer_id ?? actorId,
      siteId: permit.site_id,
      equipmentId: permit.equipment_id ?? undefined,
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    } as any);
    await this.history(tenantId, actorId, permit, 'MOC_ACTION_CREATED', 'MOC creation action opened from permit', null, action);
    await this.audit.write({ tenantId, actorId, action: 'PTW_MOC_ACTION_CREATED', entityType: 'Permit', entityId: permitId, after: action as JsonValue });
    return action;
  }

  async saveTemplate(tenantId: string, actorId: string, permitId: string, scope: Scope) {
    const permit = await this.get(tenantId, permitId, scope);
    return this.createTemplate(tenantId, actorId, {
      siteId: permit.site_id,
      permitType: permit.permit_type,
      name: `${permit.permit_number} template`,
      description: permit.title,
      equipmentId: permit.equipment_id,
      templateData: {
        title: permit.title,
        workDescription: permit.work_description,
        requiredControls: permit.required_controls,
        typeSpecificData: permit.type_specific_data,
        maxPersonnel: permit.max_personnel
      }
    }, scope);
  }

  private async transition(tenantId: string, actorId: string, id: string, status: string, eventType: string, title: string, scope: Scope, extra: Record<string, unknown> = {}) {
    const before = await this.getBase(tenantId, id, scope);
    this.assertTransition(before.status, status);
    const permit = await this.repo.db.single<any>(this.repo.permits().update({ status, updated_at: new Date().toISOString(), ...extra }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.history(tenantId, actorId, permit, eventType, title, before, permit);
    await this.audit.write({ tenantId, actorId, action: `PTW_${status.toUpperCase()}`, entityType: 'Permit', entityId: id, before: before as JsonValue, after: permit as JsonValue });
    await this.notification(tenantId, permit, `permit.${status.toLowerCase()}`, title);
    await this.indexPermit(tenantId, id);
    return this.get(tenantId, id, scope);
  }

  private async getBase(tenantId: string, id: string, scope: Scope) {
    const permit = await this.repo.db.single<any>(this.repo.permits().select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!permit) throw new NotFoundException('Permit not found');
    this.assertSiteAccess(permit.site_id, scope);
    return permit;
  }

  private async getEquipment(tenantId: string, equipmentId: string) {
    const equipment = await this.repo.db.single<any>(this.repo.db.from('Equipment').select('*, area:Area(id,name,code)').eq('tenantId', tenantId).eq('id', equipmentId).maybeSingle());
    if (!equipment) throw new NotFoundException('Equipment not found');
    return equipment;
  }

  private async linkEquipment(tenantId: string, actorId: string, permit: Record<string, any>, equipment: Record<string, any>) {
    await this.repo.db.single(this.repo.equipment().upsert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      permit_id: permit.id,
      equipment_id: equipment.id,
      relation_type: 'Primary',
      risk_context: { criticality: equipment.criticality, safetyCritical: equipment.safetyCritical, fluidService: equipment.fluidService, hazardClass: equipment.hazardClass },
      created_by: actorId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'permit_id,equipment_id,relation_type' }).select().single());
    await this.repo.db.single(this.repo.db.from('EquipmentLinkedRecord').upsert({
      id: `ptw-${permit.id}-${equipment.id}`,
      tenantId,
      equipmentId: equipment.id,
      moduleKey: 'PTW',
      recordType: 'Permit To Work',
      recordId: permit.id,
      title: `${permit.permit_number} - ${permit.title}`,
      status: permit.status.toUpperCase(),
      priority: permit.risk_level?.toUpperCase?.() ?? 'MEDIUM',
      url: `/ptw/${permit.id}`
    }, { onConflict: 'tenantId,equipmentId,moduleKey,recordId' }).select().single());
    await this.repo.db.single(this.repo.db.from('EquipmentTimelineEvent').insert({
      id: crypto.randomUUID(),
      tenantId,
      equipmentId: equipment.id,
      eventType: 'PTW_LINKED',
      title: `PTW linked: ${permit.permit_number}`,
      actorName: actorId,
      occurredAt: new Date().toISOString(),
      sourceType: 'Permit',
      sourceId: permit.id
    }).select().single());
  }

  private async detectAndStoreConflicts(tenantId: string, actorId: string, permit: Record<string, any>) {
    const detected = await this.conflicts.detect(tenantId, permit);
    const rows = [];
    for (const item of detected) {
      const row = await this.repo.db.single<any>(this.repo.conflicts().upsert({
        id: `conflict-${permit.id}-${item.conflictingPermitId}-${item.type}`,
        tenant_id: tenantId,
        company_id: permit.company_id,
        site_id: permit.site_id,
        permit_id: permit.id,
        conflicting_permit_id: item.conflictingPermitId,
        conflict_type: item.type,
        severity: item.severity,
        description: item.description,
        why_it_matters: this.conflictWhyItMatters(item.type, item.severity),
        required_controls: this.conflictRequiredControls(item.type),
        recommended_action: this.conflictRecommendedAction(item.severity),
        override_status: 'Not Requested',
        area_id: permit.area_id ?? null,
        unit_id: permit.unit_id ?? null,
        equipment_id: permit.equipment_id ?? null,
        status: 'Open',
        detected_by: actorId,
        detected_at: new Date().toISOString(),
        created_by: actorId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }).select().single());
      rows.push(row);
      await this.conflictEvent(tenantId, actorId, permit, row.id, 'CONFLICT_DETECTED', row.description, null, row);
      this.events.emit('permit.conflict', new PermitConflictEvent({ tenantId, permitId: permit.id, conflictId: row.id }));
      await this.notification(tenantId, permit, 'permit.conflict.detected', 'Permit conflict detected');
    }
    return rows;
  }

  private async getConflict(tenantId: string, permitId: string, conflictId: string) {
    const row = await this.repo.db.single<any>(this.repo.conflicts().select('*, conflicting_permit:permits!permit_conflicts_conflicting_permit_id_fkey(id,permit_number,permit_type,status,title,job_area,equipment_tag)').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', conflictId).maybeSingle());
    if (!row) throw new NotFoundException('Conflict not found');
    return row;
  }

  private async getSimops(tenantId: string, permitId: string, simopsId: string) {
    const row = await this.repo.db.single<any>(this.repo.simopsReviews().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', simopsId).maybeSingle());
    if (!row) throw new NotFoundException('SIMOPS review not found');
    return row;
  }

  private simopsPayload(tenantId: string, actorId: string, permit: Record<string, any>, dto: SimopsReviewDto, includeCreated = true) {
    return {
      ...(includeCreated ? { id: crypto.randomUUID(), tenant_id: tenantId, company_id: permit.company_id, site_id: permit.site_id, permit_id: permit.id, created_by: actorId, created_at: new Date().toISOString() } : {}),
      simops_required: dto.simopsRequired,
      coordinator_id: dto.coordinatorId ?? null,
      coordinator_name: dto.coordinatorName,
      concurrent_work_description: dto.concurrentWorkDescription,
      interaction_hazards: dto.interactionHazards,
      required_controls: dto.requiredControls,
      comments: dto.comments ?? null,
      status: dto.simopsRequired ? 'Under Review' : 'Not Required',
      updated_at: new Date().toISOString()
    };
  }

  private matrixPayload(tenantId: string, actorId: string, dto: ConflictMatrixRuleDto, scope: Scope, includeCreated = true) {
    return {
      ...(includeCreated ? { id: crypto.randomUUID(), tenant_id: tenantId, created_by: actorId, created_at: new Date().toISOString() } : {}),
      site_id: scope.selectedSiteId ?? null,
      unit_id: dto.unitId ?? null,
      area_classification: dto.areaClassification ?? null,
      permit_type_a: dto.permitTypeA,
      permit_type_b: dto.permitTypeB,
      conflict_type: dto.conflictType,
      severity: dto.severity,
      block_activation: dto.blockActivation,
      override_allowed: dto.overrideAllowed,
      required_control: dto.requiredControl ?? null,
      radius_meters: dto.radiusMeters ?? null,
      is_active: true,
      updated_at: new Date().toISOString()
    };
  }

  private async conflictEvent(tenantId: string, actorId: string, permit: Record<string, any>, conflictId: string | null, eventType: string, description: string, before: unknown, after: unknown) {
    await this.history(tenantId, actorId, permit, eventType, description, before, after);
    await this.repo.db.single(this.repo.conflictHistory().insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: permit.company_id, site_id: permit.site_id, permit_id: permit.id, conflict_id: conflictId, event_type: eventType, description, user_id: actorId, before_value: before as JsonValue, after_value: after as JsonValue }).select().single());
  }

  private conflictWhyItMatters(type: string, severity: string) {
    if (severity === 'Critical') return 'This conflict can create immediate life-safety exposure if simultaneous work proceeds without coordination.';
    if (/Hot Work|Line Breaking|Confined Space/i.test(type)) return 'This combination can introduce ignition, toxic exposure, oxygen deficiency, or isolation boundary risk.';
    return 'This conflict may affect area congestion, equipment isolation, emergency access, or permit control validity.';
  }

  private conflictRequiredControls(type: string) {
    const controls = ['Area Authority review', 'Permit issuer notification', 'Control room awareness'];
    if (/Hot Work/i.test(type)) controls.push('Gas test verification', 'Fire watch confirmation');
    if (/Confined Space/i.test(type)) controls.push('Attendant and rescue readiness');
    if (/Line Breaking|LOTO|Isolation/i.test(type)) controls.push('Isolation boundary verification');
    return controls;
  }

  private conflictRecommendedAction(severity: string) {
    return ['Critical', 'High'].includes(severity) ? 'Pause activation until conflict is resolved or formally overridden by Area Authority.' : 'Review controls and document coordination before activation.';
  }

  private permitTypeDefaults(permitType: string) {
    const base = {
      hazards: ['Uncontrolled work scope', 'Area congestion', 'Communication failure'],
      controls: ['Toolbox talk required', 'Area authority approval required', 'Permit boundary verified'],
      requiredGases: [] as string[],
      requiredSignatures: ['Permit Holder', 'Permit Issuer', 'Area Authority'],
      closeoutChecks: ['Work area inspected', 'Tools and materials removed', 'Permit holder closeout acknowledgement'],
      gasTest: false,
      isolationRequired: false,
      rescuePlan: false,
      fireWatch: false,
      simopsReview: false
    };
    const byType: Record<string, Partial<typeof base>> = {
      HOT_WORK: {
        hazards: ['Fire', 'Explosion', 'Spark generation', 'Flammable vapour', 'Combustible material ignition', 'Burn injury'],
        controls: ['Gas test required', 'Fire extinguisher required', 'Fire watch required', 'Combustible material removal/control', 'Spark containment', 'Hot work area inspection', 'LEL safe limit check', 'Post-work fire watch'],
        requiredGases: ['O2', 'LEL'],
        closeoutChecks: ['Post-work fire watch completed', 'Hot spots checked', 'Combustible material controls removed safely'],
        gasTest: true,
        fireWatch: true
      },
      COLD_WORK: {
        hazards: ['Mechanical injury', 'Dropped objects', 'Manual handling', 'Line of fire', 'Unexpected process exposure'],
        controls: ['Job safety analysis reviewed', 'Area barricaded if required', 'PPE verified', 'Energy sources reviewed'],
        closeoutChecks: ['Housekeeping complete', 'Temporary equipment removed']
      },
      CONFINED_SPACE: {
        hazards: ['Oxygen deficiency', 'Oxygen enrichment', 'Toxic gas', 'Flammable atmosphere', 'Engulfment', 'Poor ventilation', 'Restricted rescue'],
        controls: ['O2 gas test', 'LEL gas test', 'Toxic gas test', 'Ventilation', 'Attendant required', 'Entry supervisor required', 'Rescue plan', 'Communication method', 'Entry/exit log'],
        requiredGases: ['O2', 'LEL', 'H2S', 'CO'],
        requiredSignatures: ['Permit Holder', 'Permit Issuer', 'Area Authority', 'Entry Supervisor', 'Gas Tester'],
        closeoutChecks: ['Entry log reconciled', 'All entrants accounted for', 'Rescue equipment returned', 'Space secured'],
        gasTest: true,
        rescuePlan: true
      },
      ELECTRICAL_ISOLATION: {
        hazards: ['Electric shock', 'Arc flash', 'Stored energy', 'Unexpected startup', 'Mechanical energy release'],
        controls: ['Isolation points', 'Lock and tag', 'Zero-energy verification', 'Try-test', 'Authorized isolator signoff', 'De-isolation workflow'],
        requiredSignatures: ['Permit Holder', 'Permit Issuer', 'Area Authority', 'Isolation Authority'],
        closeoutChecks: ['Lock removal verified', 'De-isolation authorized', 'Equipment returned to safe state'],
        isolationRequired: true
      },
      EXCAVATION: {
        hazards: ['Underground services strike', 'Collapse', 'Vehicle interface', 'Water ingress', 'Fall into excavation'],
        controls: ['Buried services check', 'Excavation certificate', 'Barricading', 'Access/egress verified', 'Spoil placement controlled'],
        closeoutChecks: ['Excavation made safe', 'Barricades reviewed', 'Open excavation handed over if active']
      },
      RADIOGRAPHY: {
        hazards: ['Ionising radiation', 'Unauthorized entry', 'Dose exposure', 'Source control failure'],
        controls: ['Radiation exclusion zone', 'Barricades and warning signs', 'Radiation protection supervisor approval', 'Area sweep before exposure'],
        requiredSignatures: ['Permit Holder', 'Permit Issuer', 'Area Authority', 'Radiation Protection Supervisor'],
        closeoutChecks: ['Source secured', 'Exclusion zone removed', 'Area released by RPS']
      },
      WORKING_AT_HEIGHT: {
        hazards: ['Fall from height', 'Dropped objects', 'Scaffold failure', 'Weather exposure', 'Rescue delay'],
        controls: ['Fall protection', 'Anchor point verification', 'Scaffold/tag inspection', 'Dropped object controls', 'Rescue plan if required'],
        closeoutChecks: ['Dropped object sweep complete', 'Access equipment secured', 'Open edges protected']
      },
      LINE_BREAKING: {
        hazards: ['Chemical exposure', 'Pressure release', 'Residual energy', 'Flammable liquid/gas', 'Toxic release'],
        controls: ['Isolation required', 'Depressurization and draining', 'Gas test required', 'Line break PPE', 'Spill control', 'Initial crack-open procedure'],
        requiredGases: ['O2', 'LEL', 'H2S', 'CO'],
        requiredSignatures: ['Permit Holder', 'Permit Issuer', 'Area Authority', 'Isolation Authority', 'Gas Tester'],
        closeoutChecks: ['Line restored or secured', 'Spill area cleaned', 'Temporary blinds/spades status verified'],
        gasTest: true,
        isolationRequired: true
      },
      SIMOPS: {
        hazards: ['Simultaneous work interaction', 'Emergency access restriction', 'Shared isolation boundary', 'Conflicting work controls'],
        controls: ['SIMOPS review required', 'Conflict scan required', 'Control room acknowledgement', 'Coordination meeting', 'Work sequencing controls'],
        requiredSignatures: ['Permit Holder', 'Permit Issuer', 'Area Authority', 'SIMOPS Coordinator'],
        closeoutChecks: ['SIMOPS controls closed', 'Control room notified', 'Affected permits updated'],
        simopsReview: true
      }
    };
    const typed = byType[permitType] ?? {};
    const merged = { ...base, ...typed };
    return {
      requiredControls: {
        generatedByBackend: true,
        permitType,
        hazards: merged.hazards,
        controls: merged.controls,
        gasTest: merged.gasTest,
        gasTestRequired: merged.gasTest,
        isolationRequired: merged.isolationRequired,
        rescuePlanRequired: merged.rescuePlan,
        fireWatchRequired: merged.fireWatch,
        simopsReviewRequired: merged.simopsReview,
        requiredGases: merged.requiredGases,
        requiredSignatures: merged.requiredSignatures,
        closeoutChecks: merged.closeoutChecks
      },
      typeSpecificData: {
        generatedRequirements: {
          permitType,
          hazards: merged.hazards,
          controls: merged.controls,
          requiredGases: merged.requiredGases,
          requiredSignatures: merged.requiredSignatures,
          closeoutChecks: merged.closeoutChecks
        }
      }
    };
  }

  private mergePermitSafetyPayload(generated: Record<string, unknown>, provided?: Record<string, unknown>) {
    const merged = { ...generated, ...(provided ?? {}) };
    for (const key of ['hazards', 'controls', 'requiredGases', 'requiredSignatures', 'closeoutChecks']) {
      const values = [
        ...((generated[key] as unknown[]) ?? []),
        ...(((provided ?? {})[key] as unknown[]) ?? [])
      ].filter(Boolean);
      if (values.length) merged[key] = [...new Set(values.map((item) => String(item)))];
    }
    return merged;
  }

  private async signWorkforce(tenantId: string, actorId: string, permitId: string, workerId: string, direction: 'in' | 'out', scope: Scope) {
    const permit = await this.getBase(tenantId, permitId, scope);
    const before = await this.repo.db.single<any>(this.repo.workforce().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', workerId).maybeSingle());
    if (!before) throw new NotFoundException('Workforce record not found');
    if (direction === 'in' && before.briefing_required !== false && before.briefing_completed !== true && before.signed_briefing !== true) {
      throw new BadRequestException('Worker must complete briefing before sign-in');
    }
    const now = new Date().toISOString();
    const patch = direction === 'in'
      ? { time_in: now, signed_in: true, signed_in_at: now, signed_in_by: actorId, signed_out: false, signed_out_at: null, signed_out_by: null, status: 'Signed In' }
      : { time_out: now, signed_out: true, signed_out_at: now, signed_out_by: actorId, status: 'Signed Out' };
    const row = await this.repo.db.single<any>(this.repo.workforce().update({ ...patch, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', workerId).select().single());
    await this.history(tenantId, actorId, permit, direction === 'in' ? 'WORKFORCE_SIGNED_IN' : 'WORKFORCE_SIGNED_OUT', `${row.worker_name} signed ${direction}`, null, row);
    await this.workforceHistory(tenantId, actorId, permit, workerId, direction === 'in' ? 'WORKFORCE_SIGNED_IN' : 'WORKFORCE_SIGNED_OUT', `${row.worker_name} signed ${direction}`, before, row);
    await this.audit.write({ tenantId, actorId, action: direction === 'in' ? 'PTW_WORKFORCE_SIGNED_IN' : 'PTW_WORKFORCE_SIGNED_OUT', entityType: 'Permit', entityId: permitId, before: before as JsonValue, after: row as JsonValue });
    await this.notification(tenantId, permit, direction === 'in' ? 'ptw.worker.signed_in' : 'ptw.worker.signed_out', `${row.worker_name} signed ${direction}`);
    return row;
  }

  private async dashboardData(tenantId: string, scope: Scope) {
    const permits = await this.list(tenantId, { limit: '100' }, scope) as any[];
    const ids = permits.map((permit) => permit.id);
    const siteIds = [...new Set(permits.map((permit) => permit.site_id).filter(Boolean))];
    const now = Date.now();
    const soon2h = now + 2 * 60 * 60 * 1000;
    const soon30m = now + 30 * 60 * 1000;
    const openStatuses = ['Issued', 'Active', 'Extended', 'Suspended'];

    const [gasTests, isolations, conflicts, workforce, handovers, legacyHandovers, signatures, history, mapLocations, units, areas] = ids.length ? await Promise.all([
      this.safeMany<any>(this.repo.gasTests().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('tested_at', { ascending: false })),
      this.safeMany<any>(this.repo.isolations().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('created_at')),
      this.safeMany<any>(this.repo.conflicts().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('created_at', { ascending: false })),
      this.safeMany<any>(this.repo.workforce().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('created_at')),
      this.safeMany<any>(this.repo.shiftHandovers().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('created_at', { ascending: false })),
      this.safeMany<any>(this.repo.handover().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('created_at', { ascending: false })),
      this.safeMany<any>(this.repo.signatures().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('created_at', { ascending: false })),
      this.safeMany<any>(this.repo.history().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('created_at', { ascending: false })),
      this.safeMany<any>(this.repo.mapLocations().select('*').eq('tenant_id', tenantId).in('permit_id', ids)),
      siteIds.length ? this.safeMany<any>(this.repo.db.from('Unit').select('id,name,code,siteId').eq('tenantId', tenantId).in('siteId', siteIds).order('name')) : Promise.resolve([]),
      siteIds.length ? this.safeMany<any>(this.repo.db.from('Area').select('id,name,code,unitId').eq('tenantId', tenantId).order('name')) : Promise.resolve([])
    ]) : [[], [], [], [], [], [], [], [], [], [], []];

    const grouped = {
      gasTests: this.groupByPermit(gasTests),
      isolations: this.groupByPermit(isolations),
      conflicts: this.groupByPermit(conflicts),
      workforce: this.groupByPermit(workforce),
      handovers: this.groupByPermit([...handovers, ...legacyHandovers]),
      signatures: this.groupByPermit(signatures),
      history: this.groupByPermit(history)
    };
    const enriched = permits.map((permit) => ({
      ...permit,
      gasTests: grouped.gasTests[permit.id] ?? [],
      isolations: grouped.isolations[permit.id] ?? [],
      conflicts: grouped.conflicts[permit.id] ?? [],
      workforce: grouped.workforce[permit.id] ?? [],
      handovers: grouped.handovers[permit.id] ?? [],
      signatures: grouped.signatures[permit.id] ?? [],
      history: grouped.history[permit.id] ?? []
    }));
    const activePermits = enriched.filter((permit) => permit.status === 'Active');
    const openPermits = enriched.filter((permit) => openStatuses.includes(permit.status));
    const openConflicts = conflicts.filter((conflict) => conflict.status === 'Open');
    const gasDuePermits = enriched.filter((permit) => this.latestGas(permit)?.next_test_due_at && new Date(this.latestGas(permit).next_test_due_at).getTime() <= soon2h);
    const gasOverduePermits = gasDuePermits.filter((permit) => this.dateMs(this.latestGas(permit)?.next_test_due_at) < now);
    const gasDueSoonPermits = gasDuePermits.filter((permit) => {
      const due = this.dateMs(this.latestGas(permit)?.next_test_due_at);
      return due >= now && due <= soon2h;
    });
    const isolationPending = enriched.filter((permit) => this.isIsolationPending(permit));
    const handoverPending = enriched.filter((permit) => this.isHandoverPending(permit));
    const closedToday = enriched.filter((permit) => permit.status === 'Closed' && new Date(permit.closed_at ?? permit.updated_at ?? 0).toDateString() === new Date().toDateString());
    const highRisk = enriched.filter((permit) => ['High', 'Critical'].includes(permit.risk_level));
    const safetyCritical = enriched.filter((permit) => ['High', 'Critical'].includes(permit.risk_level) || permit.equipment?.safetyCritical || permit.permit_type === 'HOT_WORK' || permit.permit_type === 'CONFINED_SPACE');
    const activeByType = (type: string) => activePermits.filter((permit) => permit.permit_type === type).length;
    const counts = {
      total: enriched.length,
      draft: enriched.filter((permit) => permit.status === 'Draft').length,
      submitted: enriched.filter((permit) => permit.status === 'Submitted').length,
      awaitingApproval: enriched.filter((permit) => ['Submitted', 'Pending Approval'].includes(permit.status)).length,
      approved: enriched.filter((permit) => permit.status === 'Approved').length,
      issued: enriched.filter((permit) => permit.status === 'Issued').length,
      active: activePermits.length,
      pendingApproval: enriched.filter((permit) => ['Submitted', 'Pending Approval'].includes(permit.status)).length,
      expiringSoon: openPermits.filter((permit) => {
        const end = this.dateMs(permit.planned_end_at);
        return end >= now && end <= soon2h;
      }).length,
      suspended: enriched.filter((permit) => permit.status === 'Suspended').length,
      expired: openPermits.filter((permit) => this.dateMs(permit.planned_end_at) < now).length,
      conflicts: openConflicts.length,
      gasRetestDue: gasDuePermits.length,
      isolationPending: isolationPending.length,
      handoverPending: handoverPending.length,
      closedToday: closedToday.length,
      closed: enriched.filter((permit) => permit.status === 'Closed').length,
      highRisk: highRisk.length,
      hotWorkActive: activeByType('HOT_WORK'),
      confinedSpaceActive: activeByType('CONFINED_SPACE'),
      lotoActive: activeByType('ELECTRICAL_ISOLATION'),
      simopsActive: activeByType('SIMOPS')
    };
    const kpis = [
      this.kpi('active', 'Active Permits', counts.active, 'green', 'status=Active'),
      this.kpi('expiringSoon', 'Expiring Within 2 Hrs', counts.expiringSoon, 'amber', 'expiringWithin=2'),
      this.kpi('conflicts', 'Conflicts Detected', counts.conflicts, 'red', 'hasConflict=true'),
      this.kpi('suspended', 'Suspended', counts.suspended, 'gray', 'status=Suspended'),
      this.kpi('closedToday', 'Closed Today', counts.closedToday, 'green', 'status=Closed'),
      this.kpi('pendingApproval', 'Awaiting Approval', counts.awaitingApproval, 'amber', 'status=Submitted'),
      this.kpi('gasRetestDue', 'Gas Tests Due', counts.gasRetestDue, 'amber', 'gasRetestDue=true'),
      this.kpi('isolationPending', 'Active LOTO / Isolation', counts.isolationPending, 'amber', 'isolationPending=true'),
      this.kpi('handoverPending', 'Requires Handover', counts.handoverPending, 'amber', 'handoverPending=true'),
      this.kpi('highRisk', 'High Risk Permits', counts.highRisk, 'red', 'riskLevel=High')
    ];
    const expiringPermits = openPermits.filter((permit) => {
      const end = this.dateMs(permit.planned_end_at);
      return end >= now && end <= soon2h;
    }).sort((a, b) => this.dateMs(a.planned_end_at) - this.dateMs(b.planned_end_at));
    const expiredPermits = openPermits.filter((permit) => this.dateMs(permit.planned_end_at) < now).sort((a, b) => this.dateMs(b.planned_end_at) - this.dateMs(a.planned_end_at));
    const alerts = this.dashboardAlertsFrom(enriched, openConflicts, now);
    const areaOverview = this.areaOverviewFrom(enriched, units, areas, mapLocations);

    return {
      generatedAt: new Date().toISOString(),
      realtime: { connected: true, channel: 'ptw-dashboard', refreshIntervalMs: 30000 },
      currentShift: this.currentShift(),
      counts,
      kpis,
      activePermits: activePermits.slice(0, 50),
      register: { permits: enriched, total: enriched.length, page: 1, limit: 100 },
      conflicts: openConflicts,
      alerts,
      areaOverview,
      panels: {
        expiring: {
          withinTwoHours: expiringPermits,
          withinThirtyMinutes: expiringPermits.filter((permit) => this.dateMs(permit.planned_end_at) <= soon30m),
          expired: expiredPermits
        },
        gasRetest: {
          dueSoon: gasDueSoonPermits,
          overdue: gasOverduePermits,
          latest: activePermits.map((permit) => ({ permitId: permit.id, permitNumber: permit.permit_number, latest: this.latestGas(permit) })).filter((item) => item.latest)
        },
        conflicts: {
          open: openConflicts,
          critical: openConflicts.filter((conflict) => conflict.severity === 'Critical'),
          high: openConflicts.filter((conflict) => conflict.severity === 'High'),
          overridePending: openConflicts.filter((conflict) => conflict.override_status === 'Requested')
        },
        isolation: {
          pending: isolationPending,
          incomplete: enriched.filter((permit) => this.isIsolationIncomplete(permit)),
          deIsolationPending: enriched.filter((permit) => (permit.isolations ?? []).some((item: any) => ['De-Isolation Started', 'De-Isolation Pending'].includes(item.isolation_status ?? item.status))),
          certificatePending: isolationPending.filter((permit) => !(permit.isolations ?? []).some((item: any) => item.certificate_id))
        },
        handover: {
          crossingShift: activePermits.filter((permit) => this.crossesCurrentShift(permit)),
          pendingAcknowledgement: handoverPending,
          nextShiftExpiring: activePermits.filter((permit) => {
            const end = this.dateMs(permit.planned_end_at);
            return end >= now && end <= now + 12 * 60 * 60 * 1000;
          })
        },
        safetyCritical: {
          permits: safetyCritical,
          highRisk,
          criticalEquipment: enriched.filter((permit) => permit.equipment?.safetyCritical),
          hotWork: enriched.filter((permit) => permit.permit_type === 'HOT_WORK'),
          confinedSpace: enriched.filter((permit) => permit.permit_type === 'CONFINED_SPACE')
        }
      }
    };
  }

  private async ptwMapData(tenantId: string, scope: Scope, query: Record<string, string>) {
    const filters = this.mapQueryToPermitFilters(query);
    const permits = await this.list(tenantId, filters, scope) as any[];
    const ids = permits.map((permit) => permit.id);
    const siteIds = [...new Set(permits.map((permit) => permit.site_id).filter(Boolean))];
    const [gasTests, isolations, conflicts, workforce, handovers, signatures, mapLocations, layouts, configuredMarkers, zones, equipmentRows] = ids.length ? await Promise.all([
      this.safeMany<any>(this.repo.gasTests().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('tested_at', { ascending: false })),
      this.safeMany<any>(this.repo.isolations().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('created_at')),
      this.safeMany<any>(this.repo.conflicts().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('created_at', { ascending: false })),
      this.safeMany<any>(this.repo.workforce().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('created_at')),
      this.safeMany<any>(this.repo.shiftHandovers().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('created_at', { ascending: false })),
      this.safeMany<any>(this.repo.signatures().select('*').eq('tenant_id', tenantId).in('permit_id', ids).order('created_at', { ascending: false })),
      this.safeMany<any>(this.applyMapScope(this.repo.mapLocations().select('*').eq('tenant_id', tenantId), scope, query).in('permit_id', ids)),
      this.safeMany<any>(this.applyMapScope(this.repo.mapLayouts().select('*').eq('tenant_id', tenantId).eq('is_active', true), scope, query).order('updated_at', { ascending: false })),
      this.safeMany<any>(this.repo.mapMarkers().select('*').eq('tenant_id', tenantId)),
      this.safeMany<any>(this.repo.mapZones().select('*').eq('tenant_id', tenantId)),
      siteIds.length ? this.safeMany<any>(this.repo.db.from('Equipment').select('id,tag,name,type,criticality,safetyCritical,siteId,unitId,areaId').eq('tenantId', tenantId).in('siteId', siteIds)) : Promise.resolve([])
    ]) : [[], [], [], [], [], [], [], [], [], [], []];
    const grouped = {
      gasTests: this.groupByPermit(gasTests),
      isolations: this.groupByPermit(isolations),
      conflicts: this.groupByPermit(conflicts),
      workforce: this.groupByPermit(workforce),
      handovers: this.groupByPermit(handovers),
      signatures: this.groupByPermit(signatures)
    };
    const locationByPermit = new Map(mapLocations.map((item) => [item.permit_id, item]));
    const markersByEquipment = new Map(configuredMarkers.filter((item) => item.equipment_id).map((item) => [item.equipment_id, item]));
    const enriched = permits.map((permit, index) => {
      const gasRows = grouped.gasTests[permit.id] ?? [];
      const isolationRows = grouped.isolations[permit.id] ?? [];
      const conflictRows = grouped.conflicts[permit.id] ?? [];
      const handoverRows = grouped.handovers[permit.id] ?? [];
      const signatureRows = grouped.signatures[permit.id] ?? [];
      const location = locationByPermit.get(permit.id);
      const equipmentMarker = permit.equipment_id ? markersByEquipment.get(permit.equipment_id) : null;
      const synthetic = this.syntheticMapPoint(index, permit.area_id ?? permit.unit_id ?? permit.site_id);
      const latestGas = gasRows[0];
      const openConflicts = conflictRows.filter((item: any) => item.status === 'Open');
      const expiresInMinutes = Math.round((this.dateMs(permit.planned_end_at) - Date.now()) / 60000);
      return {
        permit_id: permit.id,
        permit_number: permit.permit_number,
        permit_title: permit.title,
        permit_type: permit.permit_type,
        status: permit.status,
        risk_level: permit.risk_level,
        company_id: permit.company_id,
        site_id: permit.site_id,
        unit_id: permit.unit_id,
        unit_name: permit.unit?.name ?? null,
        area_id: permit.area_id,
        area_name: permit.area?.name ?? permit.job_area ?? null,
        equipment_id: permit.equipment_id,
        equipment_tag: permit.equipment_tag,
        holder_name: permit.holder?.displayName ?? null,
        contractor_company: permit.contractor_company_name ?? null,
        planned_start: permit.planned_start_at,
        planned_end: permit.planned_end_at,
        expiry_at: permit.planned_end_at,
        expires_in_minutes: Number.isFinite(expiresInMinutes) ? expiresInMinutes : null,
        has_conflict: openConflicts.length > 0,
        highest_conflict_severity: this.highestSeverity(openConflicts),
        gas_status: this.mapGasStatus(latestGas),
        isolation_status: this.mapIsolationStatus(isolationRows),
        handover_status: this.mapHandoverStatus(handoverRows, permit),
        signature_status: this.mapSignatureStatus(signatureRows),
        latitude: equipmentMarker?.latitude ?? location?.latitude ?? null,
        longitude: equipmentMarker?.longitude ?? location?.longitude ?? null,
        svg_x: Number(equipmentMarker?.svg_x ?? location?.x ?? synthetic.x),
        svg_y: Number(equipmentMarker?.svg_y ?? location?.y ?? synthetic.y),
        map_zone_id: equipmentMarker?.map_zone_id ?? location?.map_zone_id ?? null,
        permit,
        gasTests: gasRows,
        isolations: isolationRows,
        conflicts: conflictRows,
        workforce: grouped.workforce[permit.id] ?? [],
        handovers: handoverRows,
        signatures: signatureRows
      };
    }).filter((item) => this.mapItemMatches(item, query));
    const areas = this.mapAreaItems(enriched);
    const equipment = this.mapEquipmentItems(enriched, equipmentRows, configuredMarkers);
    const conflictMarkers = this.mapConflictMarkers(enriched);
    const alerts = this.mapAlertsFromItems(enriched);
    const layout = layouts[0] ?? null;
    return {
      generatedAt: new Date().toISOString(),
      mode: layout?.layout_type === 'SVG' ? 'SVG' : 'DATA',
      realtime: { connected: true, channel: 'ptw-map', refreshIntervalMs: 30000 },
      layout,
      zones: layout ? zones.filter((zone) => zone.layout_id === layout.id) : [],
      configuredMarkers: layout ? configuredMarkers.filter((marker) => marker.layout_id === layout.id) : [],
      permits: enriched,
      areas,
      equipment,
      conflicts: conflictMarkers,
      alerts,
      summary: {
        activePermits: enriched.filter((item) => item.status === 'Active').length,
        highRisk: enriched.filter((item) => ['High', 'Critical'].includes(item.risk_level)).length,
        conflicts: conflictMarkers.length,
        expiringSoon: enriched.filter((item) => Number(item.expires_in_minutes) <= 120).length,
        gasRetestDue: enriched.filter((item) => item.gas_status !== 'Current' && item.gas_status !== 'No Test').length,
        isolationPending: enriched.filter((item) => item.isolation_status !== 'Complete' && item.isolation_status !== 'Not Required').length,
        handoverPending: enriched.filter((item) => item.handover_status !== 'Current').length,
        equipmentMarkers: equipment.length,
        areaCount: areas.length
      }
    };
  }

  private mapQueryToPermitFilters(query: Record<string, string>): PermitFilterDto {
    const filters: PermitFilterDto = {
      limit: query.limit ?? '100',
      sort: query.sort ?? 'planned_end_at:asc'
    };
    const assign = (key: keyof PermitFilterDto, value?: string) => {
      if (value !== undefined && value !== '') filters[key] = value;
    };
    assign('status', query.status);
    assign('permitType', query.permit_type ?? query.permitType);
    assign('riskLevel', query.risk_level ?? query.riskLevel);
    assign('siteId', query.site_id ?? query.siteId);
    assign('unitId', query.unit_id ?? query.unitId);
    assign('areaId', query.area_id ?? query.areaId);
    assign('equipmentId', query.equipment_id ?? query.equipmentId);
    assign('holderId', query.holder_id ?? query.holderId);
    assign('contractorCompanyId', query.contractor_company_id ?? query.contractorCompanyId);
    assign('expiringWithin', query.expiring_within ?? query.expiringWithin);
    assign('hasConflict', query.has_conflict ?? query.hasConflict);
    assign('gasRetestDue', query.gas_retest_due ?? query.gasRetestDue);
    assign('isolationPending', query.isolation_pending ?? query.isolationPending);
    assign('handoverPending', query.handover_pending ?? query.handoverPending);
    return filters;
  }

  private applyMapScope(query: any, scope: Scope, filters: Record<string, string>) {
    const siteId = filters.site_id ?? filters.siteId ?? scope.selectedSiteId;
    if (siteId) return query.eq('site_id', siteId);
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in('site_id', scope.allowedSiteIds);
    return query;
  }

  private mapItemMatches(item: any, query: Record<string, string>) {
    const conflict = query.has_conflict ?? query.hasConflict;
    const gas = query.gas_status ?? query.gasStatus;
    const isolation = query.isolation_status ?? query.isolationStatus;
    const handover = query.handover_status ?? query.handoverStatus;
    if (conflict && String(item.has_conflict) !== String(conflict)) return false;
    if (gas && item.gas_status !== gas) return false;
    if (isolation && item.isolation_status !== isolation) return false;
    if (handover && item.handover_status !== handover) return false;
    return true;
  }

  private mapAreaItems(items: any[]) {
    const areas = new Map<string, any>();
    for (const item of items) {
      const key = item.area_id ?? item.unit_id ?? item.site_id;
      if (!areas.has(key)) areas.set(key, { area_id: item.area_id, area_name: item.area_name ?? 'Unassigned Area', unit_id: item.unit_id, unit_name: item.unit_name ?? 'Unassigned Unit', active_permit_count: 0, high_risk_count: 0, critical_risk_count: 0, conflict_count: 0, expiring_count: 0, gas_retest_due_count: 0, isolation_pending_count: 0, handover_pending_count: 0, highest_risk: 'Low', permits: [] });
      const area = areas.get(key);
      area.permits.push(item);
      if (item.status === 'Active') area.active_permit_count += 1;
      if (item.risk_level === 'High') area.high_risk_count += 1;
      if (item.risk_level === 'Critical') area.critical_risk_count += 1;
      if (item.has_conflict) area.conflict_count += 1;
      if (Number(item.expires_in_minutes) <= 120) area.expiring_count += 1;
      if (!['Current', 'No Test'].includes(item.gas_status)) area.gas_retest_due_count += 1;
      if (!['Complete', 'Not Required'].includes(item.isolation_status)) area.isolation_pending_count += 1;
      if (item.handover_status !== 'Current') area.handover_pending_count += 1;
      area.highest_risk = this.higherRisk(area.highest_risk, item.risk_level);
    }
    return [...areas.values()];
  }

  private mapEquipmentItems(items: any[], equipmentRows: any[], configuredMarkers: any[]) {
    const byEquipment = new Map<string, any>();
    for (const equipment of equipmentRows) {
      byEquipment.set(equipment.id, { equipment_id: equipment.id, equipment_tag: equipment.tag, equipment_name: equipment.name, equipment_type: equipment.type, criticality: equipment.criticality ?? (equipment.safetyCritical ? 'High' : 'Medium'), area_id: equipment.areaId, active_permit_count: 0, latitude: null, longitude: null, svg_x: null, svg_y: null, permits: [] });
    }
    for (const item of items) {
      if (!item.equipment_id) continue;
      if (!byEquipment.has(item.equipment_id)) byEquipment.set(item.equipment_id, { equipment_id: item.equipment_id, equipment_tag: item.equipment_tag, equipment_name: item.permit?.equipment_name ?? item.equipment_tag, equipment_type: item.permit?.equipment?.type ?? 'Equipment', criticality: item.permit?.equipment?.criticality ?? item.risk_level, area_id: item.area_id, active_permit_count: 0, latitude: item.latitude, longitude: item.longitude, svg_x: item.svg_x, svg_y: item.svg_y, permits: [] });
      const equipment = byEquipment.get(item.equipment_id);
      equipment.permits.push(item);
      if (item.status === 'Active') equipment.active_permit_count += 1;
      equipment.svg_x = equipment.svg_x ?? item.svg_x;
      equipment.svg_y = equipment.svg_y ?? item.svg_y;
    }
    for (const marker of configuredMarkers) {
      if (!marker.equipment_id || !byEquipment.has(marker.equipment_id)) continue;
      const equipment = byEquipment.get(marker.equipment_id);
      equipment.svg_x = Number(marker.svg_x ?? equipment.svg_x);
      equipment.svg_y = Number(marker.svg_y ?? equipment.svg_y);
      equipment.latitude = marker.latitude ?? equipment.latitude;
      equipment.longitude = marker.longitude ?? equipment.longitude;
    }
    return [...byEquipment.values()].filter((item) => item.active_permit_count > 0 || item.svg_x !== null || item.svg_y !== null);
  }

  private mapConflictMarkers(items: any[]) {
    return items.flatMap((item) => (item.conflicts ?? []).filter((conflict: any) => conflict.status === 'Open').map((conflict: any, index: number) => ({ ...conflict, permit_id: item.permit_id, permit_number: item.permit_number, x: Math.min(92, Number(item.svg_x) + 2 + index * 2), y: Math.min(92, Number(item.svg_y) + 2 + index * 2), related_permits: [item.permit_number, conflict.conflicting_permit_id].filter(Boolean) })));
  }

  private mapAlertsFromItems(items: any[]) {
    const alerts = [];
    for (const item of items) {
      if (Number(item.expires_in_minutes) <= 120) alerts.push({ id: `expiry-${item.permit_id}`, type: 'Permit expiring', severity: Number(item.expires_in_minutes) <= 30 ? 'Critical' : 'Warning', permit_id: item.permit_id, permit_number: item.permit_number, message: `${item.permit_number} expires in ${item.expires_in_minutes} minutes` });
      if (item.gas_status === 'Overdue' || item.gas_status === 'Failed') alerts.push({ id: `gas-${item.permit_id}`, type: 'Gas warning', severity: 'Critical', permit_id: item.permit_id, permit_number: item.permit_number, message: `${item.permit_number} gas status: ${item.gas_status}` });
      if (item.isolation_status === 'Pending' || item.isolation_status === 'Incomplete') alerts.push({ id: `iso-${item.permit_id}`, type: 'Isolation warning', severity: 'Warning', permit_id: item.permit_id, permit_number: item.permit_number, message: `${item.permit_number} isolation status: ${item.isolation_status}` });
      if (item.handover_status !== 'Current') alerts.push({ id: `handover-${item.permit_id}`, type: 'Handover pending', severity: 'Warning', permit_id: item.permit_id, permit_number: item.permit_number, message: `${item.permit_number} handover status: ${item.handover_status}` });
    }
    return alerts.slice(0, 50);
  }

  private syntheticMapPoint(index: number, seed: string | null | undefined) {
    const base = [...String(seed ?? index)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return { x: 8 + ((base + index * 17) % 78), y: 10 + ((base + index * 23) % 74) };
  }

  private highestSeverity(conflicts: any[]) {
    const order: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };
    return conflicts.reduce((highest, conflict) => (order[conflict.severity] ?? 0) > (order[highest] ?? 0) ? conflict.severity : highest, 'None');
  }

  private mapGasStatus(latestGas: any) {
    if (!latestGas) return 'No Test';
    if (['FAIL', 'Fail', 'Failed'].includes(latestGas.result ?? latestGas.result_status)) return 'Failed';
    const due = this.dateMs(latestGas.next_test_due_at ?? latestGas.next_retest_due_at);
    if (due < Date.now()) return 'Overdue';
    if (due < Date.now() + 60 * 60 * 1000) return 'Due Soon';
    return 'Current';
  }

  private mapIsolationStatus(rows: any[]) {
    if (!rows.length) return 'Not Required';
    const statuses = rows.map((row) => row.isolation_status ?? row.status);
    if (statuses.every((status) => ['Confirmed', 'Verified', 'Fully Isolated'].includes(status))) return 'Complete';
    if (statuses.some((status) => ['Confirmed', 'Verified'].includes(status))) return 'Incomplete';
    return 'Pending';
  }

  private mapHandoverStatus(rows: any[], permit: any) {
    if ((rows ?? []).some((row) => row.status !== 'Completed' || !row.acknowledged_at)) return 'Pending';
    return this.crossesCurrentShift(permit) ? 'Crossing Shift' : 'Current';
  }

  private mapSignatureStatus(rows: any[]) {
    if (!rows.length) return 'Not Required';
    const signed = rows.filter((row) => row.status === 'Signed' || row.signed_by).length;
    return signed === rows.length ? 'Complete' : `${signed}/${rows.length}`;
  }

  private async getMapLayout(tenantId: string, scope: Scope, layoutId: string) {
    const layout = await this.repo.db.single<any>(this.repo.mapLayouts().select('*').eq('tenant_id', tenantId).eq('id', layoutId).maybeSingle());
    if (!layout) throw new NotFoundException('Map layout not found');
    this.assertSiteAccess(layout.site_id, scope);
    return layout;
  }

  private mapLayoutPatch(dto: Record<string, any>) {
    return {
      ...(dto.layoutName ?? dto.layout_name ? { layout_name: dto.layoutName ?? dto.layout_name } : {}),
      ...(dto.layoutType ?? dto.layout_type ? { layout_type: dto.layoutType ?? dto.layout_type } : {}),
      ...(dto.svgFileUrl ?? dto.svg_file_url ? { svg_file_url: dto.svgFileUrl ?? dto.svg_file_url } : {}),
      ...(dto.imageFileUrl ?? dto.image_file_url ? { image_file_url: dto.imageFileUrl ?? dto.image_file_url } : {}),
      ...(dto.width !== undefined ? { width: Number(dto.width) } : {}),
      ...(dto.height !== undefined ? { height: Number(dto.height) } : {}),
      ...(dto.version ? { version: dto.version } : {}),
      ...(dto.isActive !== undefined || dto.is_active !== undefined ? { is_active: dto.isActive ?? dto.is_active } : {})
    };
  }

  private mapZonePayload(tenantId: string, actorId: string, layout: any, dto: Record<string, any>) {
    return { id: crypto.randomUUID(), tenant_id: tenantId, company_id: layout.company_id, site_id: layout.site_id, layout_id: layout.id, created_by: actorId, created_at: new Date().toISOString(), ...this.mapZonePatch(dto), updated_at: new Date().toISOString() };
  }

  private mapZonePatch(dto: Record<string, any>) {
    return { unit_id: dto.unitId ?? dto.unit_id ?? null, area_id: dto.areaId ?? dto.area_id ?? null, zone_name: dto.zoneName ?? dto.zone_name ?? 'Map Zone', zone_type: dto.zoneType ?? dto.zone_type ?? 'Area', svg_element_id: dto.svgElementId ?? dto.svg_element_id ?? null, polygon_points: dto.polygonPoints ?? dto.polygon_points ?? null, x: Number(dto.x ?? 0), y: Number(dto.y ?? 0), width: Number(dto.width ?? 160), height: Number(dto.height ?? 96), color: dto.color ?? null, metadata: dto.metadata ?? {} };
  }

  private mapMarkerPayload(tenantId: string, actorId: string, layout: any, dto: Record<string, any>) {
    return { id: crypto.randomUUID(), tenant_id: tenantId, company_id: layout.company_id, site_id: layout.site_id, layout_id: layout.id, created_by: actorId, created_at: new Date().toISOString(), ...this.mapMarkerPatch(dto), updated_at: new Date().toISOString() };
  }

  private mapMarkerPatch(dto: Record<string, any>) {
    return { equipment_id: dto.equipmentId ?? dto.equipment_id ?? null, area_id: dto.areaId ?? dto.area_id ?? null, marker_type: dto.markerType ?? dto.marker_type ?? 'Equipment', label: dto.label ?? 'Marker', svg_x: dto.svgX ?? dto.svg_x ?? null, svg_y: dto.svgY ?? dto.svg_y ?? null, latitude: dto.latitude ?? null, longitude: dto.longitude ?? null, metadata: dto.metadata ?? {} };
  }

  private async applyOperationalPermitFilters(tenantId: string, rows: any[], filters: PermitFilterDto) {
    if (!rows.length || (!filters.hasConflict && !filters.gasRetestDue && !filters.isolationPending && !filters.handoverPending)) return rows;
    const ids = rows.map((row) => row.id);
    const [conflicts, gasTests, isolations, handovers] = await Promise.all([
      filters.hasConflict ? this.repo.db.many<any>(this.repo.conflicts().select('permit_id,status').eq('tenant_id', tenantId).in('permit_id', ids).eq('status', 'Open')) : Promise.resolve([]),
      filters.gasRetestDue ? this.repo.db.many<any>(this.repo.gasTests().select('permit_id,next_test_due_at,next_retest_due_at').eq('tenant_id', tenantId).in('permit_id', ids)) : Promise.resolve([]),
      filters.isolationPending ? this.repo.db.many<any>(this.repo.isolations().select('permit_id,status,isolation_status').eq('tenant_id', tenantId).in('permit_id', ids)) : Promise.resolve([]),
      filters.handoverPending ? this.repo.db.many<any>(this.repo.shiftHandovers().select('permit_id,status,acknowledged_at').eq('tenant_id', tenantId).in('permit_id', ids)) : Promise.resolve([])
    ]);
    const conflictIds = new Set(conflicts.map((row) => row.permit_id));
    const gasDueIds = new Set(gasTests.filter((row) => this.dateMs(row.next_test_due_at ?? row.next_retest_due_at) <= Date.now() + 2 * 60 * 60 * 1000).map((row) => row.permit_id));
    const isolationIds = new Set(isolations.filter((row) => !['Confirmed', 'Verified', 'Fully Isolated'].includes(row.isolation_status ?? row.status)).map((row) => row.permit_id));
    const handoverIds = new Set(handovers.filter((row) => row.status !== 'Completed' || !row.acknowledged_at).map((row) => row.permit_id));
    return rows.filter((row) => (!filters.hasConflict || conflictIds.has(row.id)) && (!filters.gasRetestDue || gasDueIds.has(row.id)) && (!filters.isolationPending || isolationIds.has(row.id)) && (!filters.handoverPending || handoverIds.has(row.id)));
  }

  private groupByPermit(rows: any[]) {
    return rows.reduce<Record<string, any[]>>((acc, row) => {
      const key = row.permit_id;
      if (!key) return acc;
      acc[key] = acc[key] ?? [];
      acc[key].push(row);
      return acc;
    }, {});
  }

  private kpi(key: string, label: string, value: number, tone: string, filter: string) {
    return { key, label, value, tone, filter, trend: { value: 0, label: 'vs previous shift' } };
  }

  private latestGas(permit: any) {
    return (permit?.gasTests ?? [])[0] ?? null;
  }

  private isIsolationPending(permit: any) {
    const isolations = permit.isolations ?? [];
    return isolations.length > 0 && isolations.some((item: any) => !['Confirmed', 'Verified', 'Fully Isolated'].includes(item.isolation_status ?? item.status));
  }

  private isIsolationIncomplete(permit: any) {
    const isolations = permit.isolations ?? [];
    return isolations.length > 0 && !isolations.every((item: any) => ['Confirmed', 'Verified', 'Fully Isolated'].includes(item.isolation_status ?? item.status));
  }

  private isHandoverPending(permit: any) {
    return (permit.handovers ?? []).some((item: any) => item.status !== 'Completed' || !item.acknowledged_at);
  }

  private crossesCurrentShift(permit: any) {
    const shift = this.currentShift();
    return this.dateMs(permit.planned_start_at) <= this.dateMs(shift.endAt) && this.dateMs(permit.planned_end_at) >= this.dateMs(shift.endAt);
  }

  private currentShift() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(now.getHours() >= 7 && now.getHours() < 19 ? 7 : 19, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() === 7 ? 19 : 31, 0, 0, 0);
    return { name: start.getHours() === 7 ? 'Day Shift' : 'Night Shift', startAt: start.toISOString(), endAt: end.toISOString() };
  }

  private dashboardAlertsFrom(permits: any[], conflicts: any[], now: number) {
    const alerts: any[] = [];
    for (const permit of permits) {
      const expiryMs = this.dateMs(permit.planned_end_at);
      if (permit.status === 'Active' && expiryMs <= now + 2 * 60 * 60 * 1000) alerts.push(this.alert('Permit expiring', expiryMs < now ? 'Critical' : 'Warning', permit, `${permit.permit_number} expires ${expiryMs < now ? 'now/overdue' : 'within 2 hours'}`));
      const gas = this.latestGas(permit);
      if (gas?.next_test_due_at && this.dateMs(gas.next_test_due_at) <= now) alerts.push(this.alert('Gas retest overdue', 'Critical', permit, `Gas retest overdue for ${permit.permit_number}`));
      if (this.isIsolationPending(permit)) alerts.push(this.alert('Isolation incomplete', 'Warning', permit, `Isolation still pending for ${permit.permit_number}`));
      if (this.isHandoverPending(permit)) alerts.push(this.alert('Handover pending', 'Warning', permit, `Shift handover acknowledgement pending for ${permit.permit_number}`));
      if (['High', 'Critical'].includes(permit.risk_level)) alerts.push(this.alert('High risk permit created', permit.risk_level === 'Critical' ? 'Critical' : 'High', permit, `${permit.risk_level} risk PTW is active in the control room`));
    }
    for (const conflict of conflicts) alerts.push(this.alert('Conflict detected', conflict.severity, { id: conflict.permit_id, permit_number: conflict.permit?.permit_number ?? conflict.permit_id }, conflict.description));
    return alerts.sort((a, b) => this.dateMs(b.timestamp) - this.dateMs(a.timestamp)).slice(0, 30);
  }

  private alert(type: string, severity: string, permit: any, message: string) {
    return { id: `${type}-${permit.id}-${message}`.replace(/\s+/g, '-'), type, severity, permitId: permit.id, permitNumber: permit.permit_number, message, timestamp: new Date().toISOString(), href: `/ptw/${permit.id}` };
  }

  private areaOverviewFrom(permits: any[], units: any[], areas: any[], mapLocations: any[]) {
    const byUnit = new Map<string, any>();
    for (const unit of units) byUnit.set(unit.id, { id: unit.id, name: unit.name, code: unit.code, activePermits: 0, conflicts: 0, expiringSoon: 0, highestRisk: 'Low', areas: [] });
    for (const area of areas) {
      const unit = byUnit.get(area.unitId);
      if (unit) unit.areas.push({ id: area.id, name: area.name, code: area.code, activePermits: 0, conflicts: 0, highestRisk: 'Low' });
    }
    for (const permit of permits) {
      const unit = byUnit.get(permit.unit_id);
      if (!unit) continue;
      if (permit.status === 'Active') unit.activePermits += 1;
      unit.conflicts += (permit.conflicts ?? []).filter((conflict: any) => conflict.status === 'Open').length;
      if (this.dateMs(permit.planned_end_at) <= Date.now() + 2 * 60 * 60 * 1000) unit.expiringSoon += 1;
      unit.highestRisk = this.higherRisk(unit.highestRisk, permit.risk_level);
      const area = unit.areas.find((item: any) => item.id === permit.area_id);
      if (area) {
        if (permit.status === 'Active') area.activePermits += 1;
        area.conflicts += (permit.conflicts ?? []).filter((conflict: any) => conflict.status === 'Open').length;
        area.highestRisk = this.higherRisk(area.highestRisk, permit.risk_level);
      }
    }
    return { units: [...byUnit.values()], mapLocations };
  }

  private higherRisk(current: string, next: string) {
    const order: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };
    return (order[next] ?? 0) > (order[current] ?? 0) ? next : current;
  }

  private dateMs(value?: string | null) {
    const ms = value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
    return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
  }

  private async nextPermitNumber(tenantId: string, siteId: string) {
    const year = new Date().getFullYear();
    const prefix = `PTW-${year}-`;
    const rows = await this.repo.db.many<any>(this.repo.permits().select('permit_number').eq('tenant_id', tenantId).eq('site_id', siteId).like('permit_number', `${prefix}%`).order('permit_number', { ascending: false }).limit(1));
    const last = rows[0]?.permit_number ? Number(String(rows[0].permit_number).split('-').pop()) : 0;
    return `${prefix}${String(last + 1).padStart(4, '0')}`;
  }

  private async companyForSite(siteId: string) {
    const site = await this.repo.db.single<any>(this.repo.db.from('Site').select('companyId').eq('id', siteId).maybeSingle());
    return site?.companyId ?? null;
  }

  private assertIsolationInput(dto: Partial<AddIsolationDto & UpdateIsolationDto>) {
    const energyType = dto.energyType;
    const requiredPosition = dto.requiredPosition;
    if (!energyType) throw new BadRequestException('Energy type is required');
    if (!(dto.isolationPoint ?? dto.isolationPointTag)) throw new BadRequestException('Isolation point tag is required');
    if (!requiredPosition) throw new BadRequestException('Required position is required');
    if (['Blinded', 'Spaded'].includes(requiredPosition) && !dto.blindSpadeNumber) throw new BadRequestException('Blind/spade number is required when required position is Blinded or Spaded');
    if (energyType === 'Electrical' && !dto.breakerTag) throw new BadRequestException('Breaker tag is required for electrical isolation');
    if ((dto.isolationMethod ?? '').toLowerCase().includes('valve') && !dto.valveTag) throw new BadRequestException('Valve tag is required for valve isolation');
  }

  private isolationStatus(isolationRequired: boolean, points: Record<string, any>[]) {
    if (!isolationRequired) return 'Not Required';
    if (!points.length) return 'Planned';
    const statuses = points.map((item) => item.isolation_status ?? item.status);
    if (statuses.every((status) => status === 'Removal Verified' || status === 'De-Isolated')) return 'De-Isolated';
    if (statuses.some((status) => status === 'De-Isolated' || status === 'Removal Verified')) return 'Partially De-Isolated';
    if (statuses.every((status) => status === 'Verified' || status === 'Confirmed')) return 'Fully Isolated';
    if (statuses.some((status) => status === 'Confirmed' || status === 'Verified')) return 'In Progress';
    return 'Planned';
  }

  private isolationBlockers(isolationRequired: boolean, points: Record<string, any>[], certificate: Record<string, any> | null) {
    if (!isolationRequired) return [];
    const blockers: string[] = [];
    if (!points.length) blockers.push('Isolation required but no isolation points exist.');
    if (points.some((item) => !['Confirmed', 'Verified', 'De-Isolation Started', 'De-Isolated', 'Removal Verified'].includes(item.isolation_status ?? item.status))) blockers.push('Some isolation points are not confirmed.');
    if (points.some((item) => item.second_person_verification_required === true && !['Verified', 'De-Isolation Started', 'De-Isolated', 'Removal Verified'].includes(item.isolation_status ?? item.status))) blockers.push('Second-person verification is required but missing.');
    if (!certificate) blockers.push('Isolation certificate has not been generated.');
    return blockers;
  }

  private handoverPayload(tenantId: string, actorId: string, permit: Record<string, any>, dto: ShiftHandoverDto, readiness: any, status: string, includeCreated = true) {
    const now = new Date().toISOString();
    return {
      ...(includeCreated ? { id: crypto.randomUUID(), tenant_id: tenantId, company_id: permit.company_id, site_id: permit.site_id, permit_id: permit.id, created_by: actorId, created_at: now } : {}),
      current_shift_name: dto.currentShiftName,
      current_shift_start: dto.currentShiftStart,
      current_shift_end: dto.currentShiftEnd,
      incoming_shift_name: dto.incomingShiftName,
      incoming_shift_start: dto.incomingShiftStart,
      incoming_shift_end: dto.incomingShiftEnd ?? null,
      outgoing_supervisor_id: dto.outgoingSupervisorId ?? actorId,
      outgoing_supervisor_name: dto.outgoingSupervisorName,
      incoming_supervisor_id: dto.incomingSupervisorId ?? null,
      incoming_supervisor_name: dto.incomingSupervisorName,
      incoming_supervisor_contact: dto.incomingSupervisorContact ?? null,
      permit_status_at_handover: permit.status,
      work_progress_status: dto.workProgressStatus,
      work_progress_notes: dto.workProgressNotes ?? null,
      remaining_work: dto.remainingWork ?? null,
      hazards_observed: dto.hazardsObserved ?? null,
      special_precautions: dto.specialPrecautions ?? null,
      control_room_message: dto.controlRoomMessage ?? null,
      incoming_supervisor_comments: dto.incomingSupervisorComments ?? null,
      permit_expiry_at: readiness.expiry?.permitExpiryAt ?? permit.planned_end_at ?? null,
      expires_within_two_hours: readiness.expiry?.expiresWithinTwoHours ?? false,
      isolation_status: readiness.isolation?.status ?? 'Not Reviewed',
      de_isolation_status: readiness.isolation?.deIsolationStatus ?? 'Not Started',
      gas_test_status: readiness.gasTest?.status ?? 'Not Reviewed',
      next_gas_retest_due: readiness.gasTest?.nextDueAt ?? null,
      workforce_status: readiness.workforce?.status ?? 'Not Reviewed',
      conflict_status: readiness.conflicts?.status ?? 'Not Reviewed',
      checklist: dto.checklist ?? {},
      status,
      updated_at: now
    };
  }

  private async getShiftHandover(tenantId: string, permitId: string, handoverId: string) {
    const row = await this.repo.db.single<any>(this.repo.shiftHandovers().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', handoverId).maybeSingle());
    if (!row) throw new NotFoundException('Shift handover not found');
    return row;
  }

  private async withHandoverChecklist(tenantId: string, row: any) {
    const checklistItems = await this.repo.db.many(this.repo.handoverChecklistItems().select('*').eq('tenant_id', tenantId).eq('handover_id', row.id).order('created_at'));
    return { ...row, checklistItems };
  }

  private async ensureHandoverChecklist(tenantId: string, actorId: string, permit: Record<string, any>, handoverId: string, values: Record<string, boolean>) {
    const rows = handoverChecklist.map(([key, label]) => ({
      id: `${handoverId}_${key}`,
      handover_id: handoverId,
      permit_id: permit.id,
      tenant_id: tenantId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      checklist_key: key,
      checklist_label: label,
      is_required: true,
      is_checked: Boolean(values[key]),
      checked_by: values[key] ? actorId : null,
      checked_at: values[key] ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }));
    await this.repo.db.many(this.repo.handoverChecklistItems().upsert(rows, { onConflict: 'handover_id,checklist_key' }).select());
  }

  private async checklistObject(tenantId: string, handoverId: string) {
    const rows = await this.repo.db.many(this.repo.handoverChecklistItems().select('checklist_key,is_checked').eq('tenant_id', tenantId).eq('handover_id', handoverId));
    return rows.reduce((next: Record<string, boolean>, row: any) => {
      next[row.checklist_key] = Boolean(row.is_checked);
      return next;
    }, {});
  }

  private async handoverEvent(tenantId: string, actorId: string, permit: Record<string, any>, handoverId: string | null, eventType: string, description: string, before: unknown, after: unknown) {
    await this.history(tenantId, actorId, permit, eventType, description, before, after);
    await this.repo.db.single(this.repo.handoverHistory().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      permit_id: permit.id,
      handover_id: handoverId,
      event_type: eventType,
      description,
      user_id: actorId,
      before_value: before as JsonValue,
      after_value: after as JsonValue
    }).select().single());
  }

  private async history(tenantId: string, actorId: string, permit: Record<string, any>, eventType: string, title: string, before: unknown, after: unknown) {
    await this.repo.db.single(this.repo.history().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      permit_id: permit.id,
      event_category: this.historyCategory(eventType),
      event_type: eventType,
      title,
      event_title: title,
      user_id: actorId,
      actor_id: actorId,
      before_data: before ?? null,
      after_data: after ?? null,
      before_value: before ?? null,
      after_value: after ?? null,
      is_safety_critical: this.isSafetyCriticalEvent(eventType),
      created_by: actorId,
      updated_at: new Date().toISOString()
    }).select().single());
  }

  private attachmentRulesForPermit(permit: Record<string, any>) {
    const type = String(permit.permit_type ?? '').toLowerCase();
    const risk = String(permit.risk_level ?? '').toLowerCase();
    const rules: any[] = [];
    const add = (attachmentType: string, isRequired: boolean, description: string) => rules.push({ id: `policy_${attachmentType.replace(/[^a-z0-9]/gi, '_')}`, permit_type: permit.permit_type, risk_level: isRequired ? permit.risk_level : null, attachment_type: attachmentType, is_required: isRequired, description, is_active: true });
    if (type.includes('confined')) {
      add('Rescue Plan', true, 'Confined space rescue plan is required.');
      add('Gas Test Certificate', true, 'Gas testing evidence is required for confined space entry.');
    }
    if (type.includes('excavation')) {
      add('Excavation Drawing', true, 'Excavation drawing is required when depth or buried-service risk applies.');
      add('Buried Services Check', true, 'Buried services check is required before excavation.');
    }
    if (type.includes('radiography')) {
      add('Radiography Plan', true, 'Radiography plan is required.');
      add('Exclusion Zone Plan', true, 'Exclusion zone plan is required.');
    }
    if (type.includes('height')) {
      add('Rescue Plan', true, 'Working at height rescue plan is required when configured.');
      add('Scaffold Tag / Photo', false, 'Scaffold tag/photo is recommended.');
    }
    if (type.includes('electrical') || type.includes('loto') || permit.isolation_required) {
      add('Isolation Certificate', true, 'Isolation certificate is required after isolation generation.');
      add('LOTO Photo', false, 'LOTO photo evidence is recommended.');
    }
    if (['high', 'critical'].includes(risk)) add('Job Safety Analysis', true, 'High or critical risk permits require a JSA or method statement.');
    return rules;
  }

  private attachmentRequirementPayload(tenantId: string, actorId: string, dto: any, scope: Scope, includeCreated = true) {
    const now = new Date().toISOString();
    return {
      ...(includeCreated ? { id: crypto.randomUUID(), tenant_id: tenantId, site_id: scope.selectedSiteId ?? null, created_by: actorId, created_at: now } : {}),
      permit_type: dto.permitType ?? null,
      risk_level: dto.riskLevel ?? null,
      condition_rule: dto.conditionRule ?? {},
      attachment_type: dto.attachmentType,
      is_required: dto.isRequired,
      description: dto.description ?? null,
      updated_at: now
    };
  }

  private assertSafeAttachment(fileName: string, mimeType: string) {
    const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
    const blocked = ['exe', 'bat', 'cmd', 'com', 'scr', 'ps1', 'js', 'vbs', 'msi', 'dll'];
    if (blocked.includes(extension)) throw new BadRequestException('Executable and unsafe file types are not allowed');
    const allowed = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'];
    if (!allowed.includes(extension) && !mimeType.startsWith('image/') && mimeType !== 'application/pdf' && mimeType !== 'text/plain') throw new BadRequestException('Unsupported attachment file type');
  }

  private previewSupported(mimeType?: string | null) {
    return Boolean(mimeType?.startsWith('image/') || mimeType === 'application/pdf' || mimeType?.startsWith('text/'));
  }

  private historyCategory(eventType: string) {
    if (eventType.startsWith('PERMIT_')) return 'Lifecycle';
    if (eventType.startsWith('ISOLATION_') || eventType.startsWith('DE_ISOLATION')) return 'Isolation';
    if (eventType.startsWith('GAS_')) return 'Gas Test';
    if (eventType.startsWith('WORKFORCE_')) return 'Workforce';
    if (eventType.includes('HANDOVER')) return 'Handover';
    if (eventType.startsWith('CONFLICT_') || eventType.startsWith('SIMOPS_')) return 'Conflicts';
    if (eventType.startsWith('SIGNATURE_')) return 'Signatures';
    if (eventType.startsWith('ATTACHMENT_') || eventType.startsWith('DOCUMENT_')) return 'Attachments';
    if (eventType.includes('CERTIFICATE')) return 'Certificates';
    return 'System';
  }

  private isSafetyCriticalEvent(eventType: string) {
    return ['FAILED', 'OVERDUE', 'SUSPENDED', 'CONFLICT', 'REJECTED', 'CRITICAL', 'AUTO_SUSPENDED'].some((token) => eventType.includes(token));
  }

  private requiredSignatureRoles(permit: Record<string, any>) {
    return PtwSignatureService.requirementsForPermit(permit);
  }

  private async getPermitSignature(tenantId: string, permitId: string, signatureId: string) {
    const row = await this.repo.db.single<any>(this.repo.signatures().select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('id', signatureId).maybeSingle());
    if (!row) throw new NotFoundException('Signature not found');
    return row;
  }

  private assertSignatureActor(actorId: string, signature: Record<string, any>) {
    if (signature.assigned_user_id && signature.assigned_user_id !== actorId) throw new ForbiddenException('This signature is assigned to another user');
    if (['Cancelled', 'Skipped by Rule', 'Not Required'].includes(signature.status)) throw new BadRequestException(`Signature cannot be completed while status is ${signature.status}`);
  }

  private async signatureEvent(tenantId: string, actorId: string, permit: Record<string, any>, signatureId: string | null, eventType: string, description: string, before: unknown, after: unknown) {
    await this.history(tenantId, actorId, permit, eventType, description, before, after);
    await this.repo.db.single(this.repo.signatureHistory().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      permit_id: permit.id,
      signature_id: signatureId,
      event_type: eventType,
      description,
      user_id: actorId,
      before_value: before ?? null,
      after_value: after ?? null
    }).select().single());
  }

  private signatureRequirementPayload(tenantId: string, actorId: string, dto: SignatureRequirementDto, scope: Scope, includeCreated = true) {
    return SignatureRequirementService.payload(tenantId, actorId, dto, scope, includeCreated);
  }

  private async hydrateGasTest(tenantId: string, gasTest: Record<string, any>) {
    const readings = await this.repo.db.many<any>(this.repo.gasReadings().select('*').eq('tenant_id', tenantId).eq('gas_test_id', gasTest.id).order('gas_code'));
    return { ...gasTest, readings };
  }

  private async replaceGasReadings(tenantId: string, permit: Record<string, any>, gasTestId: string, dto: Record<string, any>, evaluation: Record<string, any>) {
    await this.repo.db.many(this.repo.gasReadings().delete().eq('tenant_id', tenantId).eq('gas_test_id', gasTestId).select());
    const thresholdByGas = new Map<string, Record<string, any>>((evaluation.thresholds ?? []).map((threshold: any) => [String(threshold.gas_code ?? threshold.gas_key).toUpperCase(), threshold]));
    const values = evaluation.values ?? this.gasLimits.readingValues(dto);
    const rows = Object.entries(values).map(([gasCode, rawValue]) => {
      const threshold = thresholdByGas.get(gasCode) as Record<string, any> | undefined;
      const value = Number(rawValue);
      const minLimit = dto.readings?.find?.((item: any) => String(item.gasCode).toUpperCase() === gasCode)?.minLimit ?? threshold?.min_limit ?? null;
      const maxLimit = dto.readings?.find?.((item: any) => String(item.gasCode).toUpperCase() === gasCode)?.maxLimit ?? threshold?.max_limit ?? null;
      const unit = dto.readings?.find?.((item: any) => String(item.gasCode).toUpperCase() === gasCode)?.unit ?? threshold?.unit ?? (['O2', 'LEL'].includes(gasCode) ? '%' : 'ppm');
      const passFail = (minLimit !== null && minLimit !== undefined && value < Number(minLimit)) || (maxLimit !== null && maxLimit !== undefined && value > Number(maxLimit)) ? 'Fail' : 'Pass';
      return {
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        gas_test_id: gasTestId,
        permit_id: permit.id,
        company_id: permit.company_id,
        site_id: permit.site_id,
        gas_code: gasCode,
        gas_name: dto.readings?.find?.((item: any) => String(item.gasCode).toUpperCase() === gasCode)?.gasName ?? threshold?.gas_name ?? gasCode,
        value,
        unit,
        min_limit: minLimit,
        max_limit: maxLimit,
        pass_fail: passFail,
        threshold_source: threshold?.id ?? (dto.readings?.some?.((item: any) => String(item.gasCode).toUpperCase() === gasCode) ? 'Manual / Custom' : 'Default')
      };
    });
    if (rows.length) await this.repo.db.many(this.repo.gasReadings().insert(rows).select());
  }

  private async gasHistory(tenantId: string, actorId: string, permit: Record<string, any>, gasTestId: string | null, eventType: string, description: string, before: unknown, after: unknown) {
    await this.repo.db.single(this.repo.gasTestHistory().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      permit_id: permit.id,
      gas_test_id: gasTestId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      event_type: eventType,
      description,
      user_id: actorId,
      before_value: before ?? null,
      after_value: after ?? null
    }).select().single());
  }

  private thresholdPayload(tenantId: string, actorId: string, dto: GasThresholdDto, siteId: string | null, companyId: string | null, includeId = true) {
    const gasCode = dto.gasCode.toUpperCase();
    return {
      ...(includeId ? { id: crypto.randomUUID() } : {}),
      tenant_id: tenantId,
      company_id: companyId,
      site_id: siteId,
      permit_type: dto.permitType ?? null,
      area_classification: dto.areaClassification ?? null,
      gas_key: gasCode,
      gas_code: gasCode,
      gas_name: dto.gasName ?? gasCode,
      units: dto.unit,
      unit: dto.unit,
      min_value: dto.minLimit ?? null,
      max_value: dto.maxLimit ?? null,
      min_limit: dto.minLimit ?? null,
      max_limit: dto.maxLimit ?? null,
      alert_limit: dto.alertLimit ?? null,
      action_limit: dto.actionLimit ?? null,
      retest_interval_minutes: dto.retestIntervalMinutes ?? 120,
      auto_suspend_on_fail: dto.autoSuspendOnFail ?? true,
      auto_suspend_on_overdue: dto.autoSuspendOnOverdue ?? true,
      is_active: dto.isActive ?? true,
      policy: dto.policy ?? null,
      created_by: actorId,
      updated_at: new Date().toISOString()
    };
  }

  private async createFailedGasAction(tenantId: string, actorId: string, permit: Record<string, any>, failures: string[]) {
    try {
      await this.actions.create(tenantId, actorId, {
        sourceModule: 'PTW',
        sourceType: 'Permit',
        sourceRecordId: permit.id,
        title: `Failed gas test for ${permit.permit_number}`,
        description: failures.length ? failures.join(', ') : 'Gas test failed or is incomplete.',
        priority: permit.risk_level === 'Critical' ? 'SAFETY_CRITICAL' : 'HIGH',
        ownerId: permit.area_authority_id ?? permit.issuer_id ?? actorId,
        siteId: permit.site_id,
        equipmentId: permit.equipment_id ?? undefined,
        dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      } as any);
    } catch {
      // Action creation is best effort so gas-test recording is not lost.
    }
  }

  private async isolationHistory(tenantId: string, actorId: string, permit: Record<string, any>, isolationPointId: string | null, eventType: string, description: string, before: unknown, after: unknown) {
    await this.repo.db.single(this.repo.isolationHistory().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      permit_id: permit.id,
      isolation_point_id: isolationPointId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      event_type: eventType,
      description,
      user_id: actorId,
      before_value: before ?? null,
      after_value: after ?? null
    }).select().single());
  }

  private async signature(tenantId: string, actorId: string, permit: Record<string, any>, signatureType: string, signature?: string, roleName?: string, ipAddress?: string) {
    return this.repo.db.single(this.repo.signatures().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      permit_id: permit.id,
      signature_type: signatureType,
      signature_role: signatureType,
      signature_purpose: signatureType,
      status: 'Signed',
      signed_by: actorId,
      signed_at: new Date().toISOString(),
      signature_id: crypto.randomUUID(),
      role_name: roleName ?? null,
      signature: signature ?? null,
      ip_address: ipAddress ?? null,
      created_by: actorId,
      updated_at: new Date().toISOString()
    }).select().single());
  }

  private assertTransition(from: string, to: string) {
    if (from === to) return;
    const allowed: Record<string, string[]> = {
      Draft: ['Submitted', 'Cancelled'],
      Submitted: ['Approved', 'Cancelled'],
      Approved: ['Issued', 'Cancelled'],
      Issued: ['Active', 'Extended', 'Suspended', 'Cancelled'],
      Active: ['Suspended', 'Extended', 'Closed', 'Cancelled'],
      Suspended: ['Active', 'Extended', 'Closed', 'Cancelled'],
      Extended: ['Active', 'Suspended', 'Closed', 'Cancelled'],
      Closed: [],
      Cancelled: []
    };
    if (!allowed[from]?.includes(to)) throw new BadRequestException(`Invalid PTW lifecycle transition from ${from} to ${to}`);
  }

  private assertRequiredSignatures(permit: Record<string, any>, required: string[]) {
    const signed = new Set((permit.signatures ?? []).filter((item: any) => item.status === 'Signed' || item.signed_by).map((item: any) => item.signature_role ?? item.signature_type));
    const missing = required.filter((signature) => !signed.has(signature));
    if (missing.length) throw new BadRequestException(`Required signatures missing: ${missing.join(', ')}`);
  }

  private async assertRequiredAttachmentsReady(tenantId: string, permitId: string, scope: Scope) {
    const summary = await this.attachmentSummary(tenantId, permitId, scope);
    if (summary.missingRequired > 0) throw new BadRequestException(`Required attachments missing: ${summary.missingTypes.join(', ')}`);
  }

  private assertLifecycleSignatures(permit: Record<string, any>, requiredForStatus: string, fallbackRequired: string[]) {
    const required = new Set(fallbackRequired);
    for (const item of permit.signatures ?? []) {
      if (item.required_for_status === requiredForStatus && !['Not Required', 'Skipped by Rule', 'Cancelled'].includes(item.status)) required.add(item.signature_role ?? item.signature_type);
    }
    this.assertRequiredSignatures(permit, [...required]);
  }

  private assertWorkforceReady(permit: Record<string, any>) {
    const workers = permit.workforce ?? [];
    const blockers = this.workforceActivationBlockers(permit, workers);
    if (blockers.length) throw new BadRequestException(blockers.join(' '));
  }

  private assertWorkforceInput(dto: Partial<AddWorkforceDto & UpdateWorkforceDto>) {
    if (!dto.workerName) throw new BadRequestException('Worker name is required');
    const workerType = dto.workerType ?? 'Internal';
    if (!['Internal', 'Contractor', 'Visitor'].includes(workerType)) throw new BadRequestException('Worker type is required');
    const role = dto.roleOnPermit ?? dto.role;
    if (!role) throw new BadRequestException('Role on permit is required');
    if (!dto.trade) throw new BadRequestException('Trade is required');
    if (workerType === 'Contractor' && !(dto.contractorCompanyId ?? dto.employerCompany ?? dto.company)) throw new BadRequestException('Contractor company is required for contractor workers');
    if (workerType === 'Contractor' && !(dto.contactNumber ?? dto.phone)) throw new BadRequestException('Contact number is required for contractor workers');
  }

  private workforcePayload(dto: AddWorkforceDto, actorId: string) {
    const role = dto.roleOnPermit ?? dto.role ?? 'Worker';
    const briefingCompleted = dto.briefingCompleted ?? dto.signedBriefing ?? false;
    return {
      user_id: dto.userId ?? null,
      worker_name: dto.workerName,
      worker_type: dto.workerType ?? 'Internal',
      company: dto.company ?? dto.employerCompany ?? null,
      employer_company: dto.employerCompany ?? dto.company ?? null,
      contractor_company_id: dto.contractorCompanyId ?? null,
      trade: dto.trade ?? null,
      role,
      role_on_permit: role,
      phone: dto.phone ?? dto.contactNumber ?? null,
      contact_number: dto.contactNumber ?? dto.phone ?? null,
      badge_id: dto.badgeId ?? null,
      emergency_contact_name: dto.emergencyContactName ?? null,
      emergency_contact_phone: dto.emergencyContactPhone ?? null,
      is_permit_holder: dto.isPermitHolder ?? role === 'Permit Holder',
      is_performing_authority: dto.isPerformingAuthority ?? role === 'Performing Authority',
      is_area_authority: dto.isAreaAuthority ?? role === 'Area Authority',
      is_permit_issuer: dto.isPermitIssuer ?? role === 'Permit Issuer',
      is_fire_watch: dto.isFireWatch ?? role === 'Fire Watch',
      is_attendant: dto.isAttendant ?? ['Confined Space Attendant', 'Attendant'].includes(role),
      is_entry_supervisor: dto.isEntrySupervisor ?? role === 'Entry Supervisor',
      is_gas_tester: dto.isGasTester ?? role === 'Gas Tester',
      is_isolation_authority: dto.isIsolationAuthority ?? role === 'Isolation Authority',
      briefing_required: dto.briefingRequired ?? true,
      signed_briefing: briefingCompleted,
      briefing_completed: briefingCompleted,
      briefing_completed_at: briefingCompleted ? new Date().toISOString() : null,
      briefing_completed_by: briefingCompleted ? actorId : null,
      status: briefingCompleted ? 'Briefed' : 'Briefing Pending',
      notes: dto.notes ?? null
    };
  }

  private requiredWorkforceRoles(permit: Record<string, any>) {
    const base = ['Permit Holder', 'Performing Authority', 'Area Authority'];
    const byType: Record<string, string[]> = {
      HOT_WORK: [...base, 'Fire Watch', 'Permit Issuer'],
      CONFINED_SPACE: [...base, 'Entry Supervisor', 'Confined Space Attendant', 'Confined Space Entrant', 'Gas Tester'],
      ELECTRICAL_ISOLATION: [...base, 'Isolation Authority'],
      EXCAVATION: [...base],
      RADIOGRAPHY: [...base, 'Radiation Worker'],
      WORKING_AT_HEIGHT: [...base, 'Standby Person'],
      LINE_BREAKING: [...base, 'Standby Person'],
      SIMOPS: [...base, 'SIMOPS Coordinator'],
      COLD_WORK: base
    };
    const required = byType[permit.permit_type] ?? base;
    if (permit.required_controls?.gasTest === true && !required.includes('Gas Tester')) required.push('Gas Tester');
    if ((permit.required_controls?.isolation === true || ['ELECTRICAL_ISOLATION', 'LINE_BREAKING'].includes(permit.permit_type)) && !required.includes('Isolation Authority')) required.push('Isolation Authority');
    return required;
  }

  private workerHasRole(worker: Record<string, any>, role: string) {
    const workerRole = worker.role_on_permit ?? worker.role;
    if (workerRole === role) return true;
    const flagByRole: Record<string, string[]> = {
      'Permit Holder': ['is_permit_holder'],
      'Performing Authority': ['is_performing_authority'],
      'Area Authority': ['is_area_authority'],
      'Permit Issuer': ['is_permit_issuer'],
      'Fire Watch': ['is_fire_watch'],
      'Confined Space Attendant': ['is_attendant'],
      Attendant: ['is_attendant'],
      'Entry Supervisor': ['is_entry_supervisor'],
      'Gas Tester': ['is_gas_tester'],
      'Isolation Authority': ['is_isolation_authority']
    };
    return (flagByRole[role] ?? []).some((flag) => worker[flag] === true);
  }

  private workforceActivationBlockers(permit: Record<string, any>, workers: Record<string, any>[]) {
    const blockers: string[] = [];
    if (!workers.length) blockers.push('No workers assigned.');
    const required = this.requiredWorkforceRoles(permit);
    const missingRoles = required.filter((role) => !workers.some((worker) => this.workerHasRole(worker, role)));
    if (missingRoles.includes('Permit Holder')) blockers.push('Permit holder missing.');
    if (missingRoles.includes('Performing Authority')) blockers.push('Performing authority missing.');
    if (missingRoles.includes('Area Authority')) blockers.push('Area authority missing.');
    const otherMissing = missingRoles.filter((role) => !['Permit Holder', 'Performing Authority', 'Area Authority'].includes(role));
    if (otherMissing.length) blockers.push(`Required roles missing: ${otherMissing.join(', ')}.`);
    const unbriefed = workers.filter((worker) => worker.briefing_required !== false && worker.briefing_completed !== true && worker.signed_briefing !== true);
    if (unbriefed.length) blockers.push('Required briefing incomplete.');
    const activeCount = workers.filter((worker) => worker.signed_out !== true && !worker.time_out && worker.status !== 'Removed' && worker.status !== 'No Show').length;
    if (permit.max_personnel && activeCount > permit.max_personnel) blockers.push('Maximum personnel count exceeded.');
    return blockers;
  }

  private workforceClosureBlockers(permit: Record<string, any>, workers: Record<string, any>[]) {
    const blockers: string[] = [];
    const signedIn = workers.filter((worker) => worker.signed_in === true || (worker.time_in && !worker.time_out));
    if (signedIn.length) blockers.push('Workers are still signed in.');
    const accountability = (permit.history ?? []).find((event: any) => event.event_type === 'WORKFORCE_ACCOUNTABILITY_CONFIRMED');
    if (!accountability) blockers.push('Emergency accountability not confirmed.');
    const permitHolder = workers.find((worker) => this.workerHasRole(worker, 'Permit Holder'));
    if (permitHolder && permitHolder.signed_out !== true && !permitHolder.time_out) blockers.push('Permit holder has not signed off work completion.');
    return blockers;
  }

  private workforceStatus(workers: Record<string, any>[], activationBlockers: string[], closureBlockers: string[]) {
    if (!workers.length) return 'Not Assigned';
    if (workers.some((worker) => worker.briefing_required !== false && worker.briefing_completed !== true && worker.signed_briefing !== true)) return 'Briefing Pending';
    if (workers.some((worker) => worker.signed_in === true || (worker.time_in && !worker.time_out))) return 'Active';
    if (closureBlockers.length && workers.some((worker) => worker.signed_in === true || (worker.time_in && !worker.time_out))) return 'Sign-Out Pending';
    if (workers.every((worker) => worker.signed_out === true || worker.time_out)) return 'Complete';
    return activationBlockers.length ? 'Briefing Pending' : 'Ready';
  }

  private async workforceHistory(tenantId: string, actorId: string, permit: Record<string, any>, workforceId: string | null, eventType: string, description: string, before: unknown, after: unknown) {
    await this.repo.db.single(this.repo.workforceHistory().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      permit_id: permit.id,
      workforce_id: workforceId,
      company_id: permit.company_id,
      site_id: permit.site_id,
      event_type: eventType,
      description,
      user_id: actorId,
      before_value: before ?? null,
      after_value: after ?? null
    }).select().single());
  }

  private simplePdf(lines: string[]) {
    const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const text = ['BT', '/F1 18 Tf', '72 760 Td', ...lines.flatMap((line, index) => [index === 0 ? `(${escape(line)}) Tj` : `0 -24 Td (${escape(line)}) Tj`]), 'ET'].join('\n');
    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      `5 0 obj << /Length ${Buffer.byteLength(text)} >> stream\n${text}\nendstream endobj`
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const object of objects) {
      offsets.push(Buffer.byteLength(pdf));
      pdf += `${object}\n`;
    }
    const xref = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    pdf += `trailer << /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(pdf, 'utf-8');
  }

  private async notification(tenantId: string, permit: Record<string, any>, type: string, title: string) {
    const userId = permit.holder_id ?? permit.issuer_id ?? permit.created_by;
    if (!userId) return;
    await this.notifications.notifyUser({ tenantId, userId, siteId: permit.site_id, type, module: 'ptw', title, message: `${permit.permit_number} - ${permit.title}`, relatedRecordId: permit.id, relatedRecordType: 'Permit', relatedUrl: `/ptw/${permit.id}`, priority: permit.risk_level === 'High' ? 'High' : 'Normal' });
  }

  private async indexPermit(tenantId: string, permitId: string) {
    const permit = await this.repo.db.single<any>(this.repo.permits().select('*').eq('tenant_id', tenantId).eq('id', permitId).maybeSingle());
    if (!permit) return;
    await this.searchIndex.indexRecord(tenantId, { module: 'ptw', recordType: 'Permit To Work', recordId: permit.id, recordNumber: permit.permit_number, title: permit.title, subtitle: `${permit.permit_type} / ${permit.status}`, description: permit.work_description, status: permit.status, siteId: permit.site_id, url: `/ptw/${permit.id}`, searchableText: PermitMapper.toSearchText(permit) });
  }

  private async safeMany<T = any>(query: PromiseLike<any>) {
    try {
      return await this.repo.db.many<T>(query);
    } catch (error) {
      console.warn('PTW context lookup skipped:', error instanceof Error ? error.message : error);
      return [];
    }
  }

  private assertSiteAccess(siteId: string | null | undefined, scope: Scope) {
    if (!siteId || scope.corporateView) return;
    if (scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('Permit is outside your site access scope');
  }

  private storageRoot() {
    return path.resolve(process.env.PTW_STORAGE_ROOT ?? path.resolve(process.cwd(), 'storage'));
  }

  private async persistUploadedFile(storageKey: string, buffer: Buffer) {
    const root = this.storageRoot();
    const targetPath = path.resolve(root, storageKey);
    if (!targetPath.startsWith(root)) throw new BadRequestException('Invalid storage key');
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, buffer);
  }

  private async readStoredFile(storageKey: string) {
    const root = this.storageRoot();
    const targetPath = path.resolve(root, storageKey);
    if (!targetPath.startsWith(root)) throw new BadRequestException('Invalid storage key');
    return fs.readFile(targetPath);
  }

  private async removeStoredFile(storageKey: string) {
    if (!storageKey) return;
    const root = this.storageRoot();
    const targetPath = path.resolve(root, storageKey);
    if (!targetPath.startsWith(root)) return;
    await fs.rm(targetPath, { force: true });
  }
}
