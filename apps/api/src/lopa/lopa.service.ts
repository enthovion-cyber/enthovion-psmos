import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SignaturesService } from '../signatures/signatures.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { StorageService } from '../storage/storage.service';
import { ActionsService } from '../actions/actions.service';
import { SearchIndexService } from '../search/search-index.service';
import { BulkLopaSessionAttendanceDto, CreateLopaActionDto, CreateLopaDto, CreateLopaFromHazopDto, CreateLopaSilActionDto, LinkExistingLopaActionDto, LopaActionReasonDto, LopaAttachmentBulkDto, LopaAttachmentCommentDto, LopaAttachmentDocumentLinkDto, LopaAttachmentFilterDto, LopaEvidenceMappingDto, LopaFilterDto, LopaImpactedReceptorDto, LopaIplCandidateActionDto, LopaIplProofTestDto, LopaIplRegistryDocumentLinkDto, LopaIplRegistryEquipmentLinkDto, LopaIplRegistryFilterDto, LopaIplRegistryValidationDto, LopaIplValidationDto, LopaIplsSafeguardsFilterDto, LopaLibraryFilterDto, LopaLinkedRecordFilterDto, LopaManualFrequencyDto, LopaNoteDto, LopaRecommendationFilterDto, LopaRecommendationStatusDto, LopaRecommendationVerifyDto, LopaReviewCommentThreadDto, LopaReviewDecisionDto, LopaReviewExceptionDto, LopaReviewReminderDto, LopaReviewSignatureDto, LopaRiskCalculationActionDto, LopaRiskCalculationFilterDto, LopaSilActionDto, LopaSiteModifierDto, LopaTeamInviteDto, LopaTeamSessionsFilterDto, ReorderLopaSessionAgendaDto, ReplaceLopaTeamMemberDto, SelectConditionalModifierDto, SelectInitiatingEventLibraryDto, SelectLopaIplRegistryDto, UpdateLopaDto, UpdateLopaInitiatingEventDto, UpdateLopaScenarioConsequenceDto, UpsertConditionalModifierLibraryDto, UpsertInitiatingEventLibraryDto, UpsertLopaAttachmentDto, UpsertLopaIplCandidateDto, UpsertLopaIplRegistryDto, UpsertLopaLinkedRecordDto, UpsertLopaRecommendationDto, UpsertLopaReviewCommentDto, UpsertLopaReviewParticipantDto, UpsertLopaRiskCalculationAssumptionDto, UpsertLopaRiskCalculationGapDto, UpsertLopaSessionAgendaDto, UpsertLopaSessionAttendanceDto, UpsertLopaSessionDecisionDto, UpsertLopaSessionMinutesDto, UpsertLopaSessionDto, UpsertLopaSifArchitectureDto, UpsertLopaSifComponentDto, UpsertLopaSifDto, UpsertLopaSifProofTestDto, UpsertLopaSilGapDto, UpsertLopaSilLinkDto, UpsertLopaStudySafeguardDto, UpsertLopaTeamMemberDto } from './dto/lopa.dto';
import { LopaFinalReportFilterDto, LopaReportGenerateDto, LopaReportPackageDto, LopaReportPublishDto, LopaReportSectionsDto, LopaReportShareDto } from './dto/lopa.dto';

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };
type OwnerScope = { siteId?: string | undefined; unitId?: string | undefined; areaId?: string | undefined };
type UploadedLopaFile = { originalname: string; mimetype: string; size: number; buffer: Buffer };

const ACTIVE_STATUSES = ['Draft', 'In Preparation', 'In Progress', 'Pending Review', 'Pending Approval', 'Reopened'];

@Injectable()
export class LopaService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly signatures: SignaturesService,
    private readonly workflows: WorkflowsService,
    private readonly storage: StorageService,
    private readonly actionsEngine: ActionsService,
    private readonly searchIndex: SearchIndexService
  ) {}

  async summary(tenantId: string, scope: Scope) {
    const [studies, hazopWaiting] = await Promise.all([this.studies(tenantId, scope), this.hazopRequiredScenarios(tenantId, scope)]);
    const today = new Date().toISOString().slice(0, 10);
    const soon = this.addDays(90);
    return {
      total: studies.length,
      draft: this.count(studies, (s) => s.status === 'Draft'),
      inPreparation: this.count(studies, (s) => s.status === 'In Preparation'),
      inProgress: this.count(studies, (s) => s.status === 'In Progress'),
      pendingReview: this.count(studies, (s) => s.status === 'Pending Review'),
      pendingApproval: this.count(studies, (s) => s.status === 'Pending Approval'),
      approved: this.count(studies, (s) => s.status === 'Approved'),
      closed: this.count(studies, (s) => s.status === 'Closed'),
      overdue: this.count(studies, (s) => !!s.due_date && s.due_date < today && !['Approved', 'Closed', 'Cancelled'].includes(s.status)),
      revalidationDue: this.count(studies, (s) => !!s.revalidation_due_date && s.revalidation_due_date <= soon),
      createdFromHazop: this.count(studies, (s) => s.source === 'HAZOP/PHA' || s.source_module === 'HAZOP'),
      manualStudies: this.count(studies, (s) => s.source === 'Manual'),
      criticalScenarios: this.count(studies, (s) => ['Critical', 'High'].includes(s.consequence_severity)),
      silRequired: this.count(studies, (s) => !!s.sil_required),
      silGapOpen: this.count(studies, (s) => String(s.sil_gap_status ?? '').toLowerCase().includes('open') || s.sil_gap_status === 'SIL Gap'),
      openLopaActions: studies.reduce((sum, s) => sum + Number(s.open_actions_count ?? 0), 0),
      hazopWaitingForLopa: hazopWaiting.filter((s) => s.lopaStatus === 'Not Created').length,
      calculationIncomplete: this.count(studies, (s) => ['Not Started', 'Incomplete', 'Needs Review', 'Failed'].includes(s.calculation_status)),
      iplValidationIncomplete: this.count(studies, (s) => ['Not Started', 'Incomplete', 'Needs Review', 'Failed'].includes(s.ipl_validation_status)),
      lastUpdated: new Date().toISOString()
    };
  }

  async list(tenantId: string, query: LopaFilterDto, scope: Scope) {
    const studies = await this.studies(tenantId, scope);
    let rows = studies.map((study) => this.mapStudy(study));
    rows = this.applyFilters(rows, query);
    const sort = query.sort || 'updated_at.desc';
    rows.sort(this.sorter(sort));
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit };
  }

  async attention(tenantId: string, scope: Scope) {
    const [studies, waiting] = await Promise.all([this.studies(tenantId, scope), this.hazopRequiredScenarios(tenantId, scope)]);
    const today = new Date().toISOString().slice(0, 10);
    const items: any[] = [];
    for (const study of studies) {
      if (study.sil_gap_status === 'SIL Gap' || String(study.sil_gap_status ?? '').toLowerCase().includes('open')) items.push(this.attentionRow('SIL Gap Open', study, 'High', 'Determine SIL / close gap'));
      if (study.due_date && study.due_date < today && !['Approved', 'Closed', 'Cancelled'].includes(study.status)) items.push(this.attentionRow('Overdue LOPA', study, 'High', 'Complete / submit LOPA'));
      if (!study.initiating_event_frequency && ['Draft', 'In Preparation'].includes(study.status)) items.push(this.attentionRow('Missing initiating event', study, 'Medium', 'Define IE'));
      if (!study.consequence_severity) items.push(this.attentionRow('Missing consequence', study, 'Medium', 'Define consequence'));
      if (['Not Started', 'Incomplete', 'Needs Review', 'Failed'].includes(study.ipl_validation_status)) items.push(this.attentionRow('IPL validation incomplete', study, 'Medium', 'Validate IPLs'));
      if (['Not Started', 'Incomplete', 'Needs Review', 'Failed'].includes(study.calculation_status)) items.push(this.attentionRow('Calculation incomplete', study, 'Medium', 'Complete calculation'));
      if (study.status === 'Pending Approval') items.push(this.attentionRow('Pending approval', study, 'Medium', 'Approve'));
    }
    for (const scenario of waiting.filter((s) => s.lopaStatus === 'Not Created')) {
      items.push({ id: scenario.id, itemType: 'HAZOP waiting for LOPA', studyNumber: scenario.hazopNumber, title: scenario.deviation || scenario.consequence, severity: scenario.riskLevel, owner: (scenario as any).ownerName ?? 'Unassigned', dueDate: null, requiredAction: 'Create LOPA', href: `/lopa/new?hazopScenarioId=${scenario.id}` });
    }
    return items.slice(0, 50);
  }

  async context(tenantId: string, scope: Scope) {
    const [sites, units, areas, users, equipment, hazopScenarios] = await Promise.all([
      this.optionalMany('Site', (q) => this.applyScope(q.select('id,name,tenantId,companyId').eq('tenantId', tenantId).order('name'), scope, 'id')),
      this.optionalMany('Unit', (q) => q.select('id,name,siteId,tenantId').eq('tenantId', tenantId).order('name')),
      this.optionalMany('Area', (q) => q.select('id,name,unitId,siteId,tenantId').eq('tenantId', tenantId).order('name')),
      this.ownerProfiles(tenantId),
      this.optionalMany('Equipment', (q) => this.applyScope(q.select('id,tag,name,type,status,criticality,siteId,unitId,areaId,tenantId').eq('tenantId', tenantId).order('tag'), scope, 'siteId')),
      this.hazopRequiredScenarios(tenantId, scope)
    ]);
    return { sites, units, areas, users: this.filterOwnerProfiles(users, { ...(scope.selectedSiteId ? { siteId: scope.selectedSiteId } : {}) }), equipment, hazopScenarios, policies: { allowDuplicateHazopScenario: false, facilitatorRequired: false, dueDateRequired: false, ownerRequired: true, ownerSiteAccessRequired: true } };
  }

  createContext(tenantId: string, scope: Scope) {
    return this.context(tenantId, scope);
  }

  sourceOptions(tenantId: string, scope: Scope) {
    return this.context(tenantId, scope).then((context) => ({
      methods: [
        { id: 'manual', label: 'Manual LOPA', enabled: true },
        { id: 'hazop', label: 'Create from HAZOP/PHA scenario', enabled: true, count: context.hazopScenarios.length },
        { id: 'moc', label: 'Create from MOC', enabled: false },
        { id: 'incident', label: 'Create from Incident', enabled: false },
        { id: 'audit', label: 'Create from Audit/Action', enabled: false },
        { id: 'draft', label: 'Continue draft', enabled: true }
      ],
      hazopScenarios: context.hazopScenarios,
      policies: context.policies
    }));
  }

  async createUserSearch(tenantId: string, query: LopaTeamSessionsFilterDto, scope: Scope) {
    const users = this.filterOwnerProfiles(await this.ownerProfiles(tenantId), query);
    const needle = String(query.q ?? '').trim().toLowerCase();
    return users
      .filter((user) => !needle || [user.displayName, user.email, user.title].some((value) => String(value ?? '').toLowerCase().includes(needle)))
      .slice(0, 40)
      .map((user) => ({
        id: user.id,
        userId: user.id,
        displayName: user.displayName ?? user.email,
        fullName: user.displayName ?? user.email,
        email: user.email,
        jobTitle: user.jobTitle ?? user.title ?? null,
        department: user.department ?? null,
        organization: user.organization ?? 'Internal',
        internalExternal: user.internalExternal ?? 'Internal',
        avatarUrl: user.avatarUrl ?? null,
        profileId: user.profileId ?? null,
        companyId: user.companyId ?? null,
        companyName: user.companyName ?? null,
        roles: user.roles ?? [],
        discipline: user.discipline ?? null,
        siteAccess: user.siteAccess ?? [],
        unitAccess: user.unitAccess ?? [],
        areaAccess: user.areaAccess ?? [],
        active: user.active,
        accessWarning: user.accessWarning ?? null
      }));
  }

  async createOwnerProfile(tenantId: string, ownerId: string, query: LopaTeamSessionsFilterDto, scope: Scope) {
    if (query.siteId) this.assertSiteAllowed(query.siteId, scope);
    const profile = (await this.ownerProfiles(tenantId)).find((item) => item.id === ownerId || item.userId === ownerId);
    if (!profile) throw new NotFoundException('Owner user was not found in this company.');
    return this.ownerProfileWithValidation(profile, query);
  }

  async createTeamSuggestions(tenantId: string, query: LopaTeamSessionsFilterDto & { hazopScenarioId?: string; siteId?: string; ownerId?: string; facilitatorId?: string }, scope: Scope) {
    const [context, scenario] = await Promise.all([
      this.context(tenantId, scope),
      query.hazopScenarioId ? this.hazopRequiredScenario(tenantId, query.hazopScenarioId, scope).catch(() => null) : Promise.resolve(null)
    ]);
    const users = context.users ?? [];
    const suggestions = new Map<string, any>();
    const add = (user: any | undefined, fallback: Partial<any>) => {
      const key = user?.id ?? fallback.email ?? fallback.role;
      if (!key) return;
      const current = suggestions.get(key) ?? {
        userId: user?.id,
        displayName: user?.displayName ?? fallback.displayName ?? fallback.email,
        email: user?.email ?? fallback.email,
        jobTitle: user?.title ?? fallback.jobTitle,
        organization: fallback.organization ?? 'Internal',
        internalExternal: fallback.internalExternal ?? 'Internal',
        discipline: fallback.discipline,
        role: fallback.role,
        required: fallback.required ?? true,
        reviewer: fallback.reviewer ?? false,
        approver: fallback.approver ?? false,
        facilitator: fallback.facilitator ?? false,
        scribe: fallback.scribe ?? false,
        accessLevel: fallback.accessLevel ?? 'Comment',
        suggestionReasons: [],
        suggestionSource: fallback.suggestionSource ?? 'Create wizard'
      };
      for (const reason of fallback.suggestionReasons ?? []) if (!current.suggestionReasons.includes(reason)) current.suggestionReasons.push(reason);
      current.required = current.required || fallback.required;
      current.reviewer = current.reviewer || fallback.reviewer;
      current.approver = current.approver || fallback.approver;
      current.facilitator = current.facilitator || fallback.facilitator;
      current.scribe = current.scribe || fallback.scribe;
      suggestions.set(key, current);
    };
    const byId = (id?: string) => users.find((user: any) => user.id === id);
    add(byId(query.ownerId), { role: 'LOPA Owner', discipline: 'Process Safety', required: true, approver: true, suggestionReasons: ['Study owner'], accessLevel: 'Approve/sign-off' });
    add(byId(query.facilitatorId), { role: 'LOPA Facilitator', discipline: 'Process Safety', required: true, facilitator: true, suggestionReasons: ['Selected facilitator'], accessLevel: 'Edit study' });
    if (scenario) {
      const ownerUser = users.find((user: any) => String(user.displayName ?? '').toLowerCase().includes('hse') || String(user.title ?? '').toLowerCase().includes('hse'));
      add(ownerUser, { role: 'HSE / EHS Representative', discipline: 'HSE / Process Safety', required: true, reviewer: true, suggestionReasons: ['Required for HSE/process safety review', 'From HAZOP source context'], accessLevel: 'Comment' });
      const processUser = users.find((user: any) => String(user.title ?? user.displayName ?? '').toLowerCase().includes('process'));
      add(processUser, { role: 'Process Engineer', discipline: 'Process Engineering', required: true, reviewer: true, suggestionReasons: ['Required for process scenario review'], accessLevel: 'Comment' });
      const opsUser = users.find((user: any) => String(user.title ?? user.displayName ?? '').toLowerCase().includes('operation'));
      add(opsUser, { role: 'Operations Representative', discipline: 'Operations', required: true, reviewer: true, suggestionReasons: ['Required operations representation'], accessLevel: 'Comment' });
      if (String(scenario.riskLevel ?? '').toLowerCase().includes('high') || String(scenario.riskLevel ?? '').toLowerCase().includes('critical')) {
        const sisUser = users.find((user: any) => ['sis', 'instrument', 'control', 'functional'].some((word) => String(user.title ?? user.displayName ?? '').toLowerCase().includes(word)));
        add(sisUser, { role: 'SIS / Functional Safety Engineer', discipline: 'Instrument / Controls', required: true, reviewer: true, suggestionReasons: ['Required for SIS/SIL because scenario risk is high/critical'], accessLevel: 'Comment' });
      }
      for (const rec of scenario.recommendations ?? []) {
        const match = byId(rec.owner_id ?? rec.ownerId);
        add(match, { displayName: rec.owner_name, email: rec.owner_email, role: 'Recommendation Owner', discipline: 'Actions / Recommendations', required: false, suggestionReasons: ['Imported recommendation owner'], accessLevel: 'View only' });
      }
    }
    const requiredRoles = ['LOPA Facilitator', 'Process Engineer', 'Operations Representative', 'HSE / EHS Representative'];
    const rows = Array.from(suggestions.values()).filter((row) => row.displayName || row.email);
    const covered = new Set(rows.map((row) => row.role));
    const missingRoles = requiredRoles.filter((role) => !covered.has(role));
    return {
      rows,
      missingRoles,
      readiness: missingRoles.length ? 'Warning' : 'Complete',
      blockers: missingRoles.map((role) => ({ role, message: `${role} is not selected yet.` }))
    };
  }

  /** Normalizes IAM records once so all LOPA create selectors use the same profile and scope data. */
  private async ownerProfiles(tenantId: string) {
    const users = await this.optionalMany('User', (q) => q.select('id,email,displayName,title,department,status,tenantId').eq('tenantId', tenantId).order('displayName'));
    const userIds = users.map((user) => user.id).filter(Boolean);
    if (!userIds.length) return [];
    const [profiles, siteAssignments, roleAssignments] = await Promise.all([
      this.optionalMany('UserProfile', (q) => q.select('*').in('userId', userIds)),
      this.optionalMany('UserSite', (q) => q.select('*').in('userId', userIds)),
      this.optionalMany('UserRole', (q) => q.select('*').in('userId', userIds))
    ]);
    const roleIds = [...new Set(roleAssignments.map((item) => item.roleId).filter(Boolean))];
    const siteIds = [...new Set(siteAssignments.map((item) => item.siteId).filter(Boolean))];
    const [roles, sites, units, areas, companies] = await Promise.all([
      roleIds.length ? this.optionalMany('Role', (q) => q.select('id,name,key').eq('tenantId', tenantId).in('id', roleIds)) : Promise.resolve([]),
      siteIds.length ? this.optionalMany('Site', (q) => q.select('id,name,companyId').eq('tenantId', tenantId).in('id', siteIds)) : Promise.resolve([]),
      this.optionalMany('Unit', (q) => q.select('id,name,siteId').eq('tenantId', tenantId)),
      this.optionalMany('Area', (q) => q.select('id,name,siteId,unitId').eq('tenantId', tenantId)),
      this.optionalMany('Company', (q) => q.select('id,name').eq('tenantId', tenantId))
    ]);
    const profileByUser = new Map(profiles.map((item) => [item.userId, item]));
    const roleById = new Map(roles.map((item) => [item.id, item]));
    const siteById = new Map(sites.map((item) => [item.id, item]));
    const unitById = new Map(units.map((item) => [item.id, item]));
    const areaById = new Map(areas.map((item) => [item.id, item]));
    const companyById = new Map(companies.map((item) => [item.id, item]));

    return users.map((user) => {
      const profile = profileByUser.get(user.id) ?? {};
      const assignments = siteAssignments.filter((item) => item.userId === user.id);
      const roleRows = roleAssignments.filter((item) => item.userId === user.id);
      const roleNames = roleRows.map((item) => roleById.get(item.roleId)?.name ?? roleById.get(item.roleId)?.key).filter(Boolean);
      const siteAccess = assignments.map((item) => {
        const site = siteById.get(item.siteId);
        return { id: item.siteId, name: site?.name ?? 'Restricted site', companyId: item.companyId ?? site?.companyId ?? null, unitId: item.unitId ?? null, areaId: item.areaId ?? null };
      });
      const unitAccess = assignments.filter((item) => item.unitId).map((item) => ({ id: item.unitId, name: unitById.get(item.unitId)?.name ?? 'Restricted unit', siteId: item.siteId }));
      const areaAccess = assignments.filter((item) => item.areaId).map((item) => ({ id: item.areaId, name: areaById.get(item.areaId)?.name ?? 'Restricted area', unitId: item.unitId ?? areaById.get(item.areaId)?.unitId ?? null, siteId: item.siteId }));
      const companyId = assignments.find((item) => item.companyId)?.companyId ?? siteAccess.find((item) => item.companyId)?.companyId ?? null;
      const active = String(user.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE';
      return {
        id: user.id,
        userId: user.id,
        profileId: profile.id ?? profile.userId ?? null,
        displayName: user.displayName ?? user.email,
        fullName: user.displayName ?? user.email,
        email: user.email,
        title: user.title ?? null,
        jobTitle: user.title ?? null,
        department: user.department ?? profile.department ?? null,
        discipline: profile.discipline ?? null,
        avatarUrl: profile.avatarUrl ?? profile.avatar_url ?? profile.photoUrl ?? profile.imageUrl ?? null,
        organization: companyById.get(companyId)?.name ?? 'Internal',
        internalExternal: profile.employerType === 'CONTRACTOR' ? 'External' : 'Internal',
        companyId,
        companyName: companyById.get(companyId)?.name ?? null,
        status: user.status,
        active,
        roles: roleNames,
        roleAssignments: roleRows.map((item) => ({ roleId: item.roleId, scopeType: item.scopeType, companyId: item.companyId ?? null, siteId: item.siteId ?? null })),
        siteAccess,
        unitAccess,
        areaAccess,
        accessWarning: active ? null : 'This account is inactive and cannot be selected as study owner.'
      };
    });
  }

  private filterOwnerProfiles(profiles: any[], target: OwnerScope) {
    return profiles.filter((profile) => profile.active).map((profile) => this.ownerProfileWithValidation(profile, target));
  }

  private ownerProfileWithValidation(profile: any, target: OwnerScope) {
    const errors: string[] = [];
    const globalAccess = (profile.roleAssignments ?? []).some((assignment: any) => ['TENANT', 'COMPANY'].includes(String(assignment.scopeType ?? '').toUpperCase()));
    const matchingSites = target.siteId ? (profile.siteAccess ?? []).filter((access: any) => access.id === target.siteId) : profile.siteAccess ?? [];
    if (!profile.active) errors.push('This account is inactive and cannot be selected as study owner.');
    if (target.siteId && !globalAccess && !matchingSites.length) errors.push('This user does not have access to the selected site.');
    const scopedSiteAccess = matchingSites.length ? matchingSites : profile.siteAccess ?? [];
    if (target.unitId && scopedSiteAccess.some((access: any) => access.unitId) && !scopedSiteAccess.some((access: any) => access.unitId === target.unitId)) errors.push('This user does not have access to the selected unit.');
    if (target.areaId && scopedSiteAccess.some((access: any) => access.areaId) && !scopedSiteAccess.some((access: any) => access.areaId === target.areaId)) errors.push('This user does not have access to the selected area.');
    return { ...profile, accessWarning: errors[0] ?? profile.accessWarning ?? null, validation: { valid: !errors.length, errors } };
  }

  private async assertValidOwner(tenantId: string, ownerId: string, target: { siteId: string; unitId?: string | undefined; areaId?: string | undefined }) {
    const profile = (await this.ownerProfiles(tenantId)).find((item) => item.id === ownerId || item.userId === ownerId);
    if (!profile) throw new BadRequestException('Selected owner was not found in this company.');
    const validated = this.ownerProfileWithValidation(profile, target);
    if (!validated.validation.valid) throw new BadRequestException(validated.validation.errors.join(' '));
    return validated;
  }

  async libraryContext(tenantId: string, scope: Scope) {
    const base = await this.context(tenantId, scope);
    return {
      ...base,
      initiatingEventCategories: ['Control valve failure', 'Pump failure', 'Compressor failure', 'Operator error', 'Utility failure', 'External event', 'Instrument failure', 'Equipment/line failure', 'Heat exchanger failure', 'Relief system demand', 'Process upset', 'Human error', 'Other'],
      conditionalModifierTypes: ['Time at risk / fraction of time exposed', 'Probability of ignition', 'Probability of personnel presence', 'Occupancy factor', 'Injury probability', 'Enabling condition factor', 'Probability of exposure', 'Probability of detection', 'Weather/wind direction factor', 'Demand/enabling state factor', 'Other'],
      sourceTypes: ['IEC 61508', 'IEC 61511', 'OREDA', 'CCPS Guidelines', 'Company historical data', 'Site-specific reliability data', 'Vendor data', 'Engineering judgement', 'Other approved source'],
      approvalStatuses: ['Draft', 'Pending Review', 'Approved', 'Rejected', 'Superseded', 'Archived']
    };
  }

  async iplRegistryContext(tenantId: string, scope: Scope) {
    const base = await this.context(tenantId, scope);
    return {
      ...base,
      iplTypes: this.iplTypes(),
      approvalStatuses: ['Draft', 'Pending Review', 'Approved', 'Rejected', 'Superseded', 'Archived'],
      validationStatuses: ['Not Started', 'In Progress', 'Passed', 'Failed', 'Needs Evidence'],
      sourceTypes: ['IEC 61508', 'IEC 61511', 'CCPS Guidelines', 'Company standard', 'Site reliability data', 'Vendor data', 'Proof test records', 'Engineering judgement', 'Other approved source'],
      validationTemplate: this.defaultIplCriteria()
    };
  }

  async iplRegistrySummary(tenantId: string, scope: Scope) {
    const rows = await this.iplRegistryRows(tenantId, scope);
    const today = new Date().toISOString().slice(0, 10);
    const dueSoon = this.addDays(60);
    return {
      total: rows.length,
      draft: this.count(rows, (r) => r.approval_status === 'Draft'),
      pendingReview: this.count(rows, (r) => r.approval_status === 'Pending Review'),
      approved: this.count(rows, (r) => r.approval_status === 'Approved'),
      rejected: this.count(rows, (r) => r.approval_status === 'Rejected'),
      archived: this.count(rows, (r) => r.approval_status === 'Archived' || !r.active),
      superseded: this.count(rows, (r) => r.approval_status === 'Superseded'),
      missingSource: this.count(rows, (r) => !r.source_reference),
      missingPfd: this.count(rows, (r) => r.pfdavg == null && r.rrf == null),
      missingProofTest: this.count(rows, (r) => !r.proof_test_basis),
      missingDocuments: this.count(rows, (r) => Array.isArray(r.required_documents) && r.required_documents.length > 0 && Number(r.document_links_count ?? 0) === 0),
      validationFailed: this.count(rows, (r) => r.validation_status === 'Failed'),
      reviewDue: this.count(rows, (r) => !!r.review_due_date && r.review_due_date <= dueSoon),
      proofTestOverdue: this.count(rows, (r) => !!r.proof_test_due_date && r.proof_test_due_date < today),
      equipmentLinks: rows.reduce((sum, row) => sum + Number(row.equipment_links_count ?? 0), 0),
      documentLinks: rows.reduce((sum, row) => sum + Number(row.document_links_count ?? 0), 0)
    };
  }

  async iplRegistryList(tenantId: string, query: LopaIplRegistryFilterDto, scope: Scope) {
    return this.paginatedIplRegistry(await this.iplRegistryRows(tenantId, scope), query);
  }

  async iplRegistrySearch(tenantId: string, query: LopaIplRegistryFilterDto, scope: Scope) {
    const result = await this.iplRegistryList(tenantId, { ...query, status: query.status ?? 'Approved', limit: query.limit ?? '25' }, scope);
    return result.rows;
  }

  async exportIplRegistry(tenantId: string, query: LopaIplRegistryFilterDto, scope: Scope) {
    const result = await this.iplRegistryList(tenantId, { ...query, limit: '500' }, scope);
    await this.writeAudit(tenantId, 'system', 'lopa.ipl_registry.export', 'LOPA_IPL_REGISTRY', 'export', this.clean({ filters: query, count: result.total }) as unknown as JsonValue);
    return { generatedAt: new Date().toISOString(), rows: result.rows };
  }

  async iplRegistryDetail(tenantId: string, id: string, scope: Scope) {
    const record = await this.iplRegistryRecord(tenantId, id, scope);
    const [validationItems, equipmentLinks, documentLinks, history] = await Promise.all([
      this.iplRegistryValidation(tenantId, id, scope),
      this.optionalMany('lopa_ipl_registry_equipment_links', (q) => q.select('*').eq('tenant_id', tenantId).eq('registry_id', id).order('created_at', { ascending: false })),
      this.optionalMany('lopa_ipl_registry_document_links', (q) => q.select('*').eq('tenant_id', tenantId).eq('registry_id', id).order('created_at', { ascending: false })),
      this.iplRegistryHistory(tenantId, id, scope)
    ]);
    return { ...record, validationItems, equipmentLinks, documentLinks, history, readOnly: record.approval_status === 'Approved' || record.approval_status === 'Archived' || !record.active };
  }

  async createIplRegistry(tenantId: string, actorId: string, dto: UpsertLopaIplRegistryDto, scope: Scope) {
    this.assertLibraryScope(dto.siteId, scope);
    this.validateIplRegistry(dto);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const payload = this.iplRegistryPayload(tenantId, actorId, dto, { id, registry_number: await this.nextIplRegistryNumber(tenantId), approval_status: 'Draft', active: true, revision: 1, created_by: actorId, created_at: now });
    const row = await this.db.single<any>(this.db.from('lopa_ipl_registry').insert(payload).select().single());
    await this.seedIplValidationItems(tenantId, actorId, row.id);
    await this.writeIplRegistryHistory(tenantId, row.id, actorId, 'CREATED', 'IPL registry record created', row.ipl_name, null, row);
    await this.writeAudit(tenantId, actorId, 'lopa.ipl_registry.create', 'LOPA_IPL_REGISTRY', row.id, row as JsonValue);
    return this.iplRegistryDetail(tenantId, row.id, scope);
  }

  async updateIplRegistry(tenantId: string, actorId: string, id: string, dto: UpsertLopaIplRegistryDto, scope: Scope) {
    const existing = await this.iplRegistryRecord(tenantId, id, scope);
    if (existing.approval_status === 'Approved') throw new BadRequestException('Approved IPL registry records are read-only. Create a new revision to edit.');
    if (existing.approval_status === 'Archived' || !existing.active) throw new BadRequestException('Archived IPL registry records cannot be edited. Restore or revise first.');
    this.assertLibraryScope(dto.siteId ?? existing.site_id, scope);
    this.validateIplRegistry(dto);
    const payload = this.iplRegistryPayload(tenantId, actorId, dto, { updated_by: actorId, updated_at: new Date().toISOString() });
    const row = await this.db.single<any>(this.db.from('lopa_ipl_registry').update(payload).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeIplRegistryHistory(tenantId, id, actorId, 'UPDATED', 'IPL registry record updated', row.ipl_name, existing, row);
    await this.writeAudit(tenantId, actorId, 'lopa.ipl_registry.update', 'LOPA_IPL_REGISTRY', id, payload as JsonValue);
    return this.iplRegistryDetail(tenantId, id, scope);
  }

  async transitionIplRegistry(tenantId: string, actorId: string, id: string, status: string, scope: Scope, reason?: string) {
    const existing = await this.iplRegistryRecord(tenantId, id, scope);
    if (status === 'Approved') await this.assertIplRegistryApprovable(tenantId, existing);
    const payload: any = { approval_status: status, updated_by: actorId, updated_at: new Date().toISOString(), review_comment: reason ?? existing.review_comment ?? null };
    if (status === 'Approved') Object.assign(payload, { active: true, reviewed_by: actorId, reviewed_at: new Date().toISOString() });
    if (status === 'Rejected') Object.assign(payload, { reviewed_by: actorId, reviewed_at: new Date().toISOString() });
    const row = await this.db.single<any>(this.db.from('lopa_ipl_registry').update(payload).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeIplRegistryHistory(tenantId, id, actorId, status.toUpperCase().replace(/\s+/g, '_'), `IPL registry ${status.toLowerCase()}`, reason ?? row.ipl_name, existing, row);
    await this.writeAudit(tenantId, actorId, `lopa.ipl_registry.${status.toLowerCase().replace(/\s+/g, '_')}`, 'LOPA_IPL_REGISTRY', id, this.clean({ status, reason }) as JsonValue);
    return this.iplRegistryDetail(tenantId, id, scope);
  }

  async createIplRegistryRevision(tenantId: string, actorId: string, id: string, scope: Scope, reason?: string) {
    const existing = await this.iplRegistryRecord(tenantId, id, scope);
    await this.optionalSingle(this.db.from('lopa_ipl_registry').update({ approval_status: 'Superseded', active: false, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    const copy = this.clean({
      ...existing,
      id: crypto.randomUUID(),
      parent_id: existing.parent_id ?? existing.id,
      approval_status: 'Draft',
      active: true,
      revision: Number(existing.revision ?? 1) + 1,
      revision_notes: reason ?? null,
      reviewed_by: null,
      reviewed_at: null,
      review_comment: null,
      archived_at: null,
      archived_by: null,
      restored_at: null,
      restored_by: null,
      created_by: actorId,
      updated_by: actorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    const row = await this.db.single<any>(this.db.from('lopa_ipl_registry').insert(copy).select().single());
    const items = await this.optionalMany('lopa_ipl_registry_validation_items', (q) => q.select('*').eq('tenant_id', tenantId).eq('registry_id', id).order('sort_order'));
    if (items.length) {
      await this.optionalMany('lopa_ipl_registry_validation_items', (q) => q.insert(items.map((item) => this.clean({ ...item, id: crypto.randomUUID(), registry_id: row.id, status: 'Not Reviewed', evidence_status: item.evidence_required ? 'Not Provided' : item.evidence_status, created_by: actorId, updated_by: actorId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }))).select());
    } else {
      await this.seedIplValidationItems(tenantId, actorId, row.id);
    }
    await this.writeIplRegistryHistory(tenantId, row.id, actorId, 'REVISION_CREATED', 'IPL registry revision created', reason ?? 'New revision created.', existing, row);
    await this.writeAudit(tenantId, actorId, 'lopa.ipl_registry.revision.create', 'LOPA_IPL_REGISTRY', row.id, this.clean({ previousId: id, reason }) as JsonValue);
    return this.iplRegistryDetail(tenantId, row.id, scope);
  }

  async archiveIplRegistry(tenantId: string, actorId: string, id: string, scope: Scope, reason?: string) {
    const existing = await this.iplRegistryRecord(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('lopa_ipl_registry').update({ approval_status: 'Archived', active: false, archived_at: new Date().toISOString(), archived_by: actorId, updated_by: actorId, updated_at: new Date().toISOString(), review_comment: reason ?? existing.review_comment }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeIplRegistryHistory(tenantId, id, actorId, 'ARCHIVED', 'IPL registry record archived', reason ?? row.ipl_name, existing, row);
    await this.writeAudit(tenantId, actorId, 'lopa.ipl_registry.archive', 'LOPA_IPL_REGISTRY', id, this.clean({ reason }) as JsonValue);
    return this.iplRegistryDetail(tenantId, id, scope);
  }

  async restoreIplRegistry(tenantId: string, actorId: string, id: string, scope: Scope, reason?: string) {
    const existing = await this.iplRegistryRecord(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('lopa_ipl_registry').update({ approval_status: 'Draft', active: true, restored_at: new Date().toISOString(), restored_by: actorId, updated_by: actorId, updated_at: new Date().toISOString(), review_comment: reason ?? existing.review_comment }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeIplRegistryHistory(tenantId, id, actorId, 'RESTORED', 'IPL registry record restored', reason ?? row.ipl_name, existing, row);
    await this.writeAudit(tenantId, actorId, 'lopa.ipl_registry.restore', 'LOPA_IPL_REGISTRY', id, this.clean({ reason }) as JsonValue);
    return this.iplRegistryDetail(tenantId, id, scope);
  }

  async duplicateIplRegistry(tenantId: string, actorId: string, id: string, scope: Scope, reason?: string) {
    const existing = await this.iplRegistryRecord(tenantId, id, scope);
    const copy = this.clean({ ...existing, id: crypto.randomUUID(), parent_id: existing.parent_id ?? existing.id, registry_number: await this.nextIplRegistryNumber(tenantId), ipl_name: `${existing.ipl_name} Copy`, approval_status: 'Draft', active: true, revision: 1, revision_notes: reason ?? null, reviewed_by: null, reviewed_at: null, archived_at: null, archived_by: null, restored_at: null, restored_by: null, usage_count: 0, created_by: actorId, updated_by: actorId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    const row = await this.db.single<any>(this.db.from('lopa_ipl_registry').insert(copy).select().single());
    await this.seedIplValidationItems(tenantId, actorId, row.id);
    await this.writeIplRegistryHistory(tenantId, row.id, actorId, 'DUPLICATED', 'IPL registry record duplicated', reason ?? `Copied from ${existing.registry_number}.`, existing, row);
    await this.writeAudit(tenantId, actorId, 'lopa.ipl_registry.duplicate', 'LOPA_IPL_REGISTRY', row.id, this.clean({ sourceId: id, reason }) as JsonValue);
    return this.iplRegistryDetail(tenantId, row.id, scope);
  }

  async iplRegistryValidation(tenantId: string, id: string, scope: Scope) {
    await this.iplRegistryRecord(tenantId, id, scope);
    let rows = await this.optionalMany('lopa_ipl_registry_validation_items', (q) => q.select('*').eq('tenant_id', tenantId).eq('registry_id', id).order('sort_order'));
    if (!rows.length) rows = await this.seedIplValidationItems(tenantId, 'system', id);
    return rows;
  }

  async updateIplRegistryValidation(tenantId: string, actorId: string, id: string, dto: LopaIplRegistryValidationDto, scope: Scope) {
    const record = await this.iplRegistryRecord(tenantId, id, scope);
    if (record.approval_status === 'Approved') throw new BadRequestException('Approved IPL registry validation is read-only. Create a new revision to update criteria.');
    await this.optionalMany('lopa_ipl_registry_validation_items', (q) => q.delete().eq('tenant_id', tenantId).eq('registry_id', id).select('id'));
    const rows = dto.items.length ? await this.optionalMany('lopa_ipl_registry_validation_items', (q) => q.insert(dto.items.map((item, index) => this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      registry_id: id,
      criteria_key: item.criteriaKey,
      criteria_label: item.criteriaLabel,
      mandatory: item.mandatory ?? true,
      status: item.status,
      evidence_required: item.evidenceRequired ?? false,
      evidence_status: item.evidenceStatus ?? 'Not Provided',
      notes: item.notes,
      sort_order: item.sortOrder ?? index,
      created_by: actorId,
      updated_by: actorId
    }))).select()) : [];
    const validationStatus = rows.some((r) => r.mandatory && ['Fail', 'Failed'].includes(r.status)) ? 'Failed' : rows.every((r) => !r.mandatory || ['Pass', 'Passed', 'Not Applicable'].includes(r.status)) ? 'Passed' : 'In Progress';
    await this.optionalSingle(this.db.from('lopa_ipl_registry').update({ validation_status: validationStatus, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeIplRegistryHistory(tenantId, id, actorId, 'VALIDATION_UPDATED', 'IPL validation criteria updated', `${rows.length} criteria reviewed.`, null, { rows, validationStatus });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl_registry.validation.update', 'LOPA_IPL_REGISTRY', id, { rows, validationStatus });
    return this.iplRegistryValidation(tenantId, id, scope);
  }

  async addIplRegistryEquipmentLink(tenantId: string, actorId: string, id: string, dto: LopaIplRegistryEquipmentLinkDto, scope: Scope) {
    await this.ensureIplRegistryMutable(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('lopa_ipl_registry_equipment_links').insert(this.clean({ id: crypto.randomUUID(), tenant_id: tenantId, registry_id: id, equipment_id: dto.equipmentId, equipment_tag: dto.equipmentTag, equipment_name: dto.equipmentName, equipment_type: dto.equipmentType, link_type: dto.linkType ?? 'Protected Equipment', status: dto.status, notes: dto.notes, created_by: actorId })).select().single());
    await this.writeIplRegistryHistory(tenantId, id, actorId, 'EQUIPMENT_LINKED', 'Equipment linked', dto.equipmentTag ?? dto.equipmentName ?? 'Equipment linked.', null, row);
    await this.writeAudit(tenantId, actorId, 'lopa.ipl_registry.equipment.link', 'LOPA_IPL_REGISTRY', id, row as JsonValue);
    return this.iplRegistryDetail(tenantId, id, scope);
  }

  async addIplRegistryDocumentLink(tenantId: string, actorId: string, id: string, dto: LopaIplRegistryDocumentLinkDto, scope: Scope) {
    await this.ensureIplRegistryMutable(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('lopa_ipl_registry_document_links').insert(this.clean({ id: crypto.randomUUID(), tenant_id: tenantId, registry_id: id, document_id: dto.documentId, document_number: dto.documentNumber, document_title: dto.documentTitle, document_type: dto.documentType, revision: dto.revision, status: dto.status, effective_date: dto.effectiveDate, link_type: dto.linkType ?? 'Basis Document', notes: dto.notes, created_by: actorId })).select().single());
    await this.writeIplRegistryHistory(tenantId, id, actorId, 'DOCUMENT_LINKED', 'Document linked', dto.documentNumber ?? dto.documentTitle ?? 'Document linked.', null, row);
    await this.writeAudit(tenantId, actorId, 'lopa.ipl_registry.document.link', 'LOPA_IPL_REGISTRY', id, row as JsonValue);
    return this.iplRegistryDetail(tenantId, id, scope);
  }

  async deleteIplRegistryLink(tenantId: string, actorId: string, registryId: string, linkId: string, kind: 'equipment' | 'document', scope: Scope) {
    await this.ensureIplRegistryMutable(tenantId, registryId, scope);
    const table = kind === 'equipment' ? 'lopa_ipl_registry_equipment_links' : 'lopa_ipl_registry_document_links';
    const row = await this.optionalSingle(this.db.from(table).delete().eq('tenant_id', tenantId).eq('registry_id', registryId).eq('id', linkId).select().single());
    await this.writeIplRegistryHistory(tenantId, registryId, actorId, `${kind.toUpperCase()}_LINK_REMOVED`, `${kind} link removed`, `A ${kind} link was removed.`, row, null);
    await this.writeAudit(tenantId, actorId, `lopa.ipl_registry.${kind}.unlink`, 'LOPA_IPL_REGISTRY', registryId, { linkId });
    return this.iplRegistryDetail(tenantId, registryId, scope);
  }

  async iplRegistryHistory(tenantId: string, id: string, scope: Scope) {
    await this.iplRegistryRecord(tenantId, id, scope);
    return this.optionalMany('lopa_ipl_registry_history', (q) => q.select('*').eq('tenant_id', tenantId).eq('registry_id', id).order('created_at', { ascending: false }).limit(100));
  }

  async initiatingEventLibrarySummary(tenantId: string, scope: Scope) {
    return this.librarySummary(await this.libraryRows('lopa_initiating_event_library', tenantId, scope), 'event');
  }

  async conditionalModifierLibrarySummary(tenantId: string, scope: Scope) {
    return this.librarySummary(await this.libraryRows('lopa_conditional_modifier_library', tenantId, scope), 'modifier');
  }

  async initiatingEventLibraryList(tenantId: string, query: LopaLibraryFilterDto, scope: Scope) {
    return this.paginatedLibrary(await this.libraryRows('lopa_initiating_event_library', tenantId, scope), query);
  }

  async conditionalModifierLibraryList(tenantId: string, query: LopaLibraryFilterDto, scope: Scope) {
    return this.paginatedLibrary(await this.libraryRows('lopa_conditional_modifier_library', tenantId, scope), query);
  }

  async initiatingEventLibrarySearch(tenantId: string, query: LopaLibraryFilterDto, scope: Scope) {
    const rows = (await this.initiatingEventLibraryList(tenantId, { ...query, status: query.status ?? 'Approved', limit: query.limit ?? '25' }, scope)).rows;
    return rows;
  }

  async conditionalModifierLibrarySearch(tenantId: string, query: LopaLibraryFilterDto, scope: Scope) {
    const rows = (await this.conditionalModifierLibraryList(tenantId, { ...query, status: query.status ?? 'Approved', limit: query.limit ?? '25' }, scope)).rows;
    return rows;
  }

  async initiatingEventLibraryDetail(tenantId: string, id: string, scope: Scope) {
    return this.libraryRecord('lopa_initiating_event_library', tenantId, id, scope);
  }

  async conditionalModifierLibraryDetail(tenantId: string, id: string, scope: Scope) {
    return this.libraryRecord('lopa_conditional_modifier_library', tenantId, id, scope);
  }

  async createInitiatingEventLibrary(tenantId: string, actorId: string, dto: UpsertInitiatingEventLibraryDto, scope: Scope) {
    this.validateInitiatingEventLibrary(dto);
    this.assertLibraryScope(dto.siteId, scope);
    const now = new Date().toISOString();
    const payload = this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: dto.companyId ?? null,
      site_id: dto.siteId ?? null,
      event_code: dto.eventCode,
      event_name: dto.eventName,
      description: dto.description,
      event_category: dto.eventCategory,
      failure_mode: dto.failureMode,
      equipment_type: dto.equipmentType,
      subtype: dto.subtype,
      service_application: dto.serviceApplication,
      base_frequency: dto.baseFrequency,
      frequency_unit: dto.frequencyUnit,
      low_frequency: dto.lowFrequency,
      high_frequency: dto.highFrequency,
      confidence_level: dto.confidenceLevel,
      source_type: dto.sourceType,
      source_reference: dto.sourceReference,
      standard_reference: dto.standardReference,
      applicability_notes: dto.applicabilityNotes,
      exclusion_notes: dto.exclusionNotes,
      scope: dto.scope ?? (dto.siteId ? 'Site' : 'Corporate'),
      site_modifier_allowed: dto.siteModifierAllowed ?? false,
      default_site_modifier: dto.defaultSiteModifier ?? 1,
      engineering_justification_required: dto.engineeringJustificationRequired ?? dto.sourceType === 'Engineering judgement',
      engineering_justification: dto.engineeringJustification,
      approval_status: 'Draft',
      revision: 1,
      revision_notes: dto.revisionNotes,
      active: dto.active ?? true,
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now
    });
    const row = await this.db.single<any>(this.db.from('lopa_initiating_event_library').insert(payload).select().single());
    await this.writeAudit(tenantId, actorId, 'lopa.library.initiating_event.create', 'LOPA_LIBRARY', row.id, payload as JsonValue);
    return row;
  }

  async updateInitiatingEventLibrary(tenantId: string, actorId: string, id: string, dto: UpsertInitiatingEventLibraryDto, scope: Scope) {
    const existing = await this.libraryRecord('lopa_initiating_event_library', tenantId, id, scope);
    if (existing.approval_status === 'Approved') throw new BadRequestException('Approved library records require a new revision.');
    this.validateInitiatingEventLibrary(dto);
    this.assertLibraryScope(dto.siteId, scope);
    const payload = this.clean({
      event_code: dto.eventCode,
      event_name: dto.eventName,
      description: dto.description,
      event_category: dto.eventCategory,
      failure_mode: dto.failureMode,
      equipment_type: dto.equipmentType,
      subtype: dto.subtype,
      service_application: dto.serviceApplication,
      base_frequency: dto.baseFrequency,
      frequency_unit: dto.frequencyUnit,
      low_frequency: dto.lowFrequency,
      high_frequency: dto.highFrequency,
      confidence_level: dto.confidenceLevel,
      source_type: dto.sourceType,
      source_reference: dto.sourceReference,
      standard_reference: dto.standardReference,
      applicability_notes: dto.applicabilityNotes,
      exclusion_notes: dto.exclusionNotes,
      scope: dto.scope ?? (dto.siteId ? 'Site' : 'Corporate'),
      site_modifier_allowed: dto.siteModifierAllowed,
      default_site_modifier: dto.defaultSiteModifier,
      engineering_justification_required: dto.engineeringJustificationRequired ?? dto.sourceType === 'Engineering judgement',
      engineering_justification: dto.engineeringJustification,
      revision_notes: dto.revisionNotes,
      active: dto.active,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    const row = await this.db.single<any>(this.db.from('lopa_initiating_event_library').update(payload).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeAudit(tenantId, actorId, 'lopa.library.initiating_event.update', 'LOPA_LIBRARY', id, payload as JsonValue);
    return row;
  }

  async createConditionalModifierLibrary(tenantId: string, actorId: string, dto: UpsertConditionalModifierLibraryDto, scope: Scope) {
    this.validateModifierLibrary(dto);
    this.assertLibraryScope(dto.siteId, scope);
    const now = new Date().toISOString();
    const payload = this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: dto.companyId ?? null,
      site_id: dto.siteId ?? null,
      modifier_code: dto.modifierCode,
      modifier_name: dto.modifierName,
      description: dto.description,
      modifier_type: dto.modifierType,
      application_context: dto.applicationContext,
      default_value: dto.defaultValue,
      low_value: dto.lowValue,
      high_value: dto.highValue,
      unit: dto.unit ?? 'probability',
      confidence_level: dto.confidenceLevel,
      source_type: dto.sourceType,
      source_reference: dto.sourceReference,
      standard_reference: dto.standardReference,
      applicability_notes: dto.applicabilityNotes,
      exclusion_notes: dto.exclusionNotes,
      scope: dto.scope ?? (dto.siteId ? 'Site' : 'Corporate'),
      override_allowed: dto.overrideAllowed ?? false,
      engineering_justification_required: dto.engineeringJustificationRequired ?? dto.sourceType === 'Engineering judgement',
      engineering_justification: dto.engineeringJustification,
      approval_status: 'Draft',
      revision: 1,
      revision_notes: dto.revisionNotes,
      active: dto.active ?? true,
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now
    });
    const row = await this.db.single<any>(this.db.from('lopa_conditional_modifier_library').insert(payload).select().single());
    await this.writeAudit(tenantId, actorId, 'lopa.library.conditional_modifier.create', 'LOPA_LIBRARY', row.id, payload as JsonValue);
    return row;
  }

  async updateConditionalModifierLibrary(tenantId: string, actorId: string, id: string, dto: UpsertConditionalModifierLibraryDto, scope: Scope) {
    const existing = await this.libraryRecord('lopa_conditional_modifier_library', tenantId, id, scope);
    if (existing.approval_status === 'Approved') throw new BadRequestException('Approved library records require a new revision.');
    this.validateModifierLibrary(dto);
    this.assertLibraryScope(dto.siteId, scope);
    const payload = this.clean({
      modifier_code: dto.modifierCode,
      modifier_name: dto.modifierName,
      description: dto.description,
      modifier_type: dto.modifierType,
      application_context: dto.applicationContext,
      default_value: dto.defaultValue,
      low_value: dto.lowValue,
      high_value: dto.highValue,
      unit: dto.unit ?? 'probability',
      confidence_level: dto.confidenceLevel,
      source_type: dto.sourceType,
      source_reference: dto.sourceReference,
      standard_reference: dto.standardReference,
      applicability_notes: dto.applicabilityNotes,
      exclusion_notes: dto.exclusionNotes,
      scope: dto.scope ?? (dto.siteId ? 'Site' : 'Corporate'),
      override_allowed: dto.overrideAllowed,
      engineering_justification_required: dto.engineeringJustificationRequired ?? dto.sourceType === 'Engineering judgement',
      engineering_justification: dto.engineeringJustification,
      revision_notes: dto.revisionNotes,
      active: dto.active,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    const row = await this.db.single<any>(this.db.from('lopa_conditional_modifier_library').update(payload).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeAudit(tenantId, actorId, 'lopa.library.conditional_modifier.update', 'LOPA_LIBRARY', id, payload as JsonValue);
    return row;
  }

  async transitionLibraryRecord(tenantId: string, actorId: string, kind: 'initiating' | 'modifier', id: string, status: string, scope: Scope, reason?: string) {
    const table = kind === 'initiating' ? 'lopa_initiating_event_library' : 'lopa_conditional_modifier_library';
    await this.libraryRecord(table, tenantId, id, scope);
    const payload = { approval_status: status, active: status === 'Archived' ? false : undefined, reviewed_by: actorId, reviewed_at: new Date().toISOString(), review_comment: reason ?? null, updated_by: actorId, updated_at: new Date().toISOString() };
    const row = await this.db.single<any>(this.db.from(table).update(this.clean(payload)).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.writeAudit(tenantId, actorId, `lopa.library.${kind}.${status.toLowerCase().replace(/\s+/g, '_')}`, 'LOPA_LIBRARY', id, this.clean({ status, reason }) as JsonValue);
    return row;
  }

  async createLibraryRevision(tenantId: string, actorId: string, kind: 'initiating' | 'modifier', id: string, scope: Scope, reason?: string) {
    const table = kind === 'initiating' ? 'lopa_initiating_event_library' : 'lopa_conditional_modifier_library';
    const existing = await this.libraryRecord(table, tenantId, id, scope);
    await this.optionalSingle(this.db.from(table).update({ approval_status: 'Superseded', active: false, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    const copy = { ...existing };
    delete copy.id;
    copy.id = crypto.randomUUID();
    copy.parent_id = existing.parent_id ?? existing.id;
    copy.approval_status = 'Draft';
    copy.active = true;
    copy.revision = Number(existing.revision ?? 1) + 1;
    copy.revision_notes = reason ?? existing.revision_notes;
    copy.created_by = actorId;
    copy.updated_by = actorId;
    copy.created_at = new Date().toISOString();
    copy.updated_at = copy.created_at;
    copy.reviewed_by = null;
    copy.reviewed_at = null;
    copy.review_comment = null;
    const row = await this.db.single<any>(this.db.from(table).insert(copy).select().single());
    await this.writeAudit(tenantId, actorId, `lopa.library.${kind}.revision.create`, 'LOPA_LIBRARY', row.id, this.clean({ previousId: id, reason }) as JsonValue);
    return row;
  }

  async selectInitiatingEventFromLibrary(tenantId: string, actorId: string, lopaId: string, dto: SelectInitiatingEventLibraryDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, lopaId, scope);
    this.assertMutable(study);
    const event = await this.libraryRecord('lopa_initiating_event_library', tenantId, dto.libraryId, scope);
    this.assertApprovedForUse(event);
    const siteModifier = dto.siteModifier ?? event.default_site_modifier ?? 1;
    if (siteModifier !== 1 && !dto.engineeringJustification) throw new BadRequestException('Site modifier override requires engineering justification.');
    const selectedFrequency = dto.selectedFrequency ?? Number(event.base_frequency) * Number(siteModifier);
    const now = new Date().toISOString();
    const snapshot = await this.db.single<any>(this.db.from('lopa_study_initiating_event_snapshots').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      lopa_study_id: lopaId,
      library_event_id: event.id,
      library_revision: event.revision,
      event_code: event.event_code,
      event_name: event.event_name,
      event_category: event.event_category,
      failure_mode: event.failure_mode,
      selected_frequency: selectedFrequency,
      frequency_unit: event.frequency_unit,
      base_frequency: event.base_frequency,
      low_frequency: event.low_frequency,
      high_frequency: event.high_frequency,
      site_modifier: siteModifier,
      source_type: event.source_type,
      source_reference: event.source_reference,
      standard_reference: event.standard_reference,
      confidence_level: event.confidence_level,
      engineering_justification: dto.engineeringJustification ?? event.engineering_justification,
      source_snapshot: event,
      notes: dto.notes ?? null,
      selected_by: actorId,
      selected_at: now
    }).select().single());
    await this.optionalSingle(this.db.from('lopa_initiating_events').upsert({ id: crypto.randomUUID(), tenant_id: tenantId, lopa_study_id: lopaId, description: event.event_name, event_category: event.event_category, failure_mode: event.failure_mode, frequency_method: 'Library', library_event: event.event_code, frequency_per_year: selectedFrequency, frequency_source: event.source_reference, basis: event.description, confidence_level: event.confidence_level, site_modifier: siteModifier, engineering_justification: dto.engineeringJustification ?? event.engineering_justification, completion_status: 'Complete', notes: dto.notes ?? null }).select().single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ initiating_event_frequency: selectedFrequency, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', lopaId).select('id').single());
    await this.writeHistory(tenantId, lopaId, actorId, 'INITIATING_EVENT_LIBRARY_SELECTED', 'Initiating event selected from library', `${event.event_code} selected from approved library.`, { snapshotId: snapshot.id, libraryId: event.id });
    await this.writeAudit(tenantId, actorId, 'lopa.library.initiating_event.use', 'LOPA', lopaId, { snapshotId: snapshot.id, libraryId: event.id });
    return snapshot;
  }

  async studyConditionalModifierSnapshots(tenantId: string, lopaId: string, scope: Scope) {
    await this.studyRecord(tenantId, lopaId, scope);
    return this.optionalMany('lopa_study_conditional_modifier_snapshots', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', lopaId).neq('status', 'Archived').order('selected_at', { ascending: false }));
  }

  async selectConditionalModifier(tenantId: string, actorId: string, lopaId: string, dto: SelectConditionalModifierDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, lopaId, scope);
    this.assertMutable(study);
    const modifier = await this.libraryRecord('lopa_conditional_modifier_library', tenantId, dto.libraryId, scope);
    this.assertApprovedForUse(modifier);
    const selectedValue = (dto as any).appliedValue ?? dto.selectedValue ?? modifier.default_value;
    if (selectedValue !== modifier.default_value && !modifier.override_allowed) throw new BadRequestException('This modifier does not allow value override.');
    if ((selectedValue !== modifier.default_value || modifier.engineering_justification_required) && !dto.engineeringJustification) throw new BadRequestException('Modifier selection requires engineering justification.');
    const snapshot = await this.db.single<any>(this.db.from('lopa_study_conditional_modifier_snapshots').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      lopa_study_id: lopaId,
      library_modifier_id: modifier.id,
      library_revision: modifier.revision,
      modifier_code: modifier.modifier_code,
      modifier_name: modifier.modifier_name,
      modifier_type: modifier.modifier_type,
      selected_value: selectedValue,
      default_value: modifier.default_value,
      low_value: modifier.low_value,
      high_value: modifier.high_value,
      unit: modifier.unit,
      source_type: modifier.source_type,
      source_reference: modifier.source_reference,
      standard_reference: modifier.standard_reference,
      confidence_level: modifier.confidence_level,
      engineering_justification: dto.engineeringJustification ?? modifier.engineering_justification,
      source_snapshot: modifier,
      status: 'Active',
      notes: dto.notes ?? null,
      selected_by: actorId,
      selected_at: new Date().toISOString()
    }).select().single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ conditional_modifiers_status: 'Selected', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', lopaId).select('id').single());
    await this.writeHistory(tenantId, lopaId, actorId, 'CONDITIONAL_MODIFIER_SELECTED', 'Conditional modifier selected', `${modifier.modifier_code} selected from approved library.`, { snapshotId: snapshot.id, libraryId: modifier.id });
    await this.writeAudit(tenantId, actorId, 'lopa.library.conditional_modifier.use', 'LOPA', lopaId, { snapshotId: snapshot.id, libraryId: modifier.id });
    return snapshot;
  }

  async archiveConditionalModifierSnapshot(tenantId: string, actorId: string, lopaId: string, snapshotId: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, lopaId, scope);
    this.assertMutable(study);
    const snapshot = await this.db.single<any>(this.db.from('lopa_study_conditional_modifier_snapshots').update({ status: 'Archived' }).eq('tenant_id', tenantId).eq('lopa_study_id', lopaId).eq('id', snapshotId).select().single());
    await this.writeHistory(tenantId, lopaId, actorId, 'CONDITIONAL_MODIFIER_ARCHIVED', 'Conditional modifier snapshot archived', `${snapshot.modifier_code} removed from active calculation modifiers.`, { snapshotId });
    await this.writeAudit(tenantId, actorId, 'lopa.library.conditional_modifier.snapshot.archive', 'LOPA', lopaId, { snapshotId });
    return snapshot;
  }

  async updateConditionalModifierSnapshot(tenantId: string, actorId: string, lopaId: string, snapshotId: string, dto: SelectConditionalModifierDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, lopaId, scope);
    this.assertMutable(study);
    const existing = await this.db.single<any>(this.db.from('lopa_study_conditional_modifier_snapshots').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', lopaId).eq('id', snapshotId).single());
    const selectedValue = (dto as any).appliedValue ?? dto.selectedValue ?? existing.selected_value;
    if (selectedValue !== existing.default_value) {
      const source = existing.source_snapshot ?? {};
      if (source.override_allowed === false) throw new BadRequestException('This modifier does not allow value override.');
      if (!dto.engineeringJustification && !existing.engineering_justification) throw new BadRequestException('Modifier override requires engineering justification.');
    }
    const row = await this.db.single<any>(this.db.from('lopa_study_conditional_modifier_snapshots').update(this.clean({
      selected_value: selectedValue,
      engineering_justification: dto.engineeringJustification,
      notes: dto.notes,
      status: 'Active'
    })).eq('tenant_id', tenantId).eq('lopa_study_id', lopaId).eq('id', snapshotId).select().single());
    await this.markNeedsRecalculationIfNeeded(tenantId, lopaId, study, actorId);
    await this.writeHistory(tenantId, lopaId, actorId, 'CONDITIONAL_MODIFIER_UPDATED', 'Conditional modifier updated', `${row.modifier_code} selected value updated.`, { snapshotId });
    await this.writeAudit(tenantId, actorId, 'lopa.library.conditional_modifier.snapshot.update', 'LOPA', lopaId, { snapshotId, selectedValue });
    return row;
  }

  async iplsSafeguardsContext(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [base, registry] = await Promise.all([
      this.context(tenantId, scope),
      this.iplRegistrySearch(tenantId, { limit: '100', status: 'Approved' } as LopaIplRegistryFilterDto, scope)
    ]);
    return {
      readOnly: this.isReadOnly(study),
      safeguardTypes: this.safeguardTypes(),
      proposedUses: ['Safeguard only', 'IPL Candidate', 'Not Applicable', 'Rejected'],
      validationStatuses: ['Not Started', 'In Review', 'Validation Complete', 'Failed', 'Approved for Credit', 'Credited', 'Rejected', 'Reopened'],
      creditStatuses: ['Not Credited', 'Credit Requested', 'Credited', 'Credit Removed', 'Rejected'],
      registry,
      users: base.users,
      equipment: base.equipment,
      documents: (base as any).documents ?? []
    };
  }

  async availableIplRegistry(tenantId: string, id: string, query: LopaIplRegistryFilterDto, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.iplRegistrySearch(tenantId, { ...query, status: query.status ?? 'Approved' }, scope);
  }

  async iplsSafeguardsTab(tenantId: string, id: string, query: LopaIplsSafeguardsFilterDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [safeguards, candidates, criteria, proofTests, gaps, readiness, context] = await Promise.all([
      this.studySafeguards(tenantId, id, query),
      this.studyIplCandidates(tenantId, id, query),
      this.studyIplCriteria(tenantId, id),
      this.studyIplProofTests(tenantId, id),
      this.iplsSafeguardsGaps(tenantId, id, scope),
      this.iplsSafeguardsReadiness(tenantId, id, scope),
      this.iplsSafeguardsContext(tenantId, id, scope)
    ]);
    const candidateIds = candidates.map((candidate) => candidate.id);
    const criteriaByCandidate = this.groupBy(criteria, 'ipl_candidate_id');
    const proofByCandidate = this.groupBy(proofTests, 'ipl_candidate_id');
    const enrichedCandidates = candidates.map((candidate) => this.mapStudyIplCandidate(candidate, criteriaByCandidate.get(candidate.id) ?? [], proofByCandidate.get(candidate.id) ?? []));
    return {
      readOnly: this.isReadOnly(study),
      summary: this.buildIplsSafeguardsSummary(safeguards, enrichedCandidates, gaps),
      importedHazopSafeguards: safeguards.filter((s) => s.source_type === 'HAZOP'),
      safeguards,
      candidates: enrichedCandidates,
      failedRejected: enrichedCandidates.filter((c) => ['Failed', 'Rejected'].includes(c.validationStatus) || c.creditStatus === 'Rejected'),
      creditedIpls: enrichedCandidates.filter((c) => c.creditedInCalculation),
      validationCriteria: candidateIds.length ? criteria.filter((item) => candidateIds.includes(item.ipl_candidate_id)) : [],
      gaps,
      readiness,
      context
    };
  }

  async iplsSafeguardsSummary(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const [safeguards, candidates, gaps] = await Promise.all([this.studySafeguards(tenantId, id, {}), this.studyIplCandidates(tenantId, id, {}), this.iplsSafeguardsGaps(tenantId, id, scope)]);
    return this.buildIplsSafeguardsSummary(safeguards, candidates, gaps);
  }

  async iplsSafeguardsReadiness(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const [safeguards, candidates, criteria, proofTests, gaps] = await Promise.all([
      this.studySafeguards(tenantId, id, {}),
      this.studyIplCandidates(tenantId, id, {}),
      this.studyIplCriteria(tenantId, id),
      this.studyIplProofTests(tenantId, id),
      this.iplsSafeguardsGaps(tenantId, id, scope, true)
    ]);
    const criteriaByCandidate = this.groupBy(criteria, 'ipl_candidate_id');
    const proofByCandidate = this.groupBy(proofTests, 'ipl_candidate_id');
    const hasValidated = candidates.some((c) => ['Approved for Credit', 'Credited', 'Validation Complete'].includes(c.validation_status));
    const creditBlockers = candidates.flatMap((c) => this.iplCreditBlockers(c, criteriaByCandidate.get(c.id) ?? [], proofByCandidate.get(c.id) ?? []));
    return this.readinessFromChecks([
      this.check('safeguards_reviewed', 'Imported safeguards reviewed', safeguards.length === 0 || safeguards.every((s) => !!s.proposed_use && s.proposed_use !== 'Pending Review'), 'Warning'),
      this.check('ipl_candidates_selected', 'IPL candidates selected where risk reduction is needed', candidates.length > 0, 'Warning'),
      this.check('ipl_validation_complete', 'IPL validation complete or explicitly not required', candidates.length === 0 || hasValidated, 'Warning'),
      this.check('credit_blockers_clear', 'Credited IPL blockers clear', creditBlockers.length === 0, 'Blocked'),
      this.check('open_gaps_closed', 'IPL gaps/actions closed or accepted', gaps.every((gap) => ['Closed', 'Accepted', 'Cancelled'].includes(gap.status)), 'Blocked')
    ]);
  }

  async iplsSafeguardsGaps(tenantId: string, id: string, scope: Scope, includeGenerated = false) {
    await this.studyRecord(tenantId, id, scope);
    const rows = await this.optionalMany('lopa_study_ipl_gaps', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).neq('status', 'Archived').order('created_at', { ascending: false }));
    if (!includeGenerated) return rows;
    const [candidates, criteria, proofTests] = await Promise.all([this.studyIplCandidates(tenantId, id, {}), this.studyIplCriteria(tenantId, id), this.studyIplProofTests(tenantId, id)]);
    const criteriaByCandidate = this.groupBy(criteria, 'ipl_candidate_id');
    const proofByCandidate = this.groupBy(proofTests, 'ipl_candidate_id');
    const generated = candidates.flatMap((candidate) => this.iplCreditBlockers(candidate, criteriaByCandidate.get(candidate.id) ?? [], proofByCandidate.get(candidate.id) ?? []).map((title) => ({
      id: `${candidate.id}:${title}`,
      tenant_id: tenantId,
      lopa_study_id: id,
      candidate_id: candidate.id,
      ipl_candidate_id: candidate.id,
      title,
      gap_type: 'Credit Blocker',
      severity: title.includes('mandatory') || title.includes('common-cause') || title.includes('double-count') ? 'High' : 'Medium',
      status: 'Open',
      generated: true
    })));
    return [...rows, ...generated];
  }

  async createStudySafeguard(tenantId: string, actorId: string, id: string, dto: UpsertLopaStudySafeguardDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_study_safeguards').insert(this.studySafeguardPayload(tenantId, actorId, study, id, dto, { id: crypto.randomUUID(), safeguard_number: await this.nextStudySafeguardNumber(tenantId, id) })).select().single());
    await this.updateStudyIplCounts(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SAFEGUARD_CREATED', 'Study safeguard added', row.safeguard_name, { safeguardId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.safeguard.create', 'LOPA', id, row as JsonValue);
    return row;
  }

  async updateStudySafeguard(tenantId: string, actorId: string, id: string, safeguardId: string, dto: UpsertLopaStudySafeguardDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_study_safeguards').update(this.studySafeguardPayload(tenantId, actorId, study, id, dto, { updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', safeguardId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SAFEGUARD_UPDATED', 'Study safeguard updated', row.safeguard_name, { safeguardId });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.safeguard.update', 'LOPA', id, row as JsonValue);
    return row;
  }

  async deleteStudySafeguard(tenantId: string, actorId: string, id: string, safeguardId: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.optionalSingle(this.db.from('lopa_study_safeguards').update({ status: 'Archived', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', safeguardId).select().single());
    await this.updateStudyIplCounts(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SAFEGUARD_ARCHIVED', 'Study safeguard archived', row?.safeguard_name ?? safeguardId, { safeguardId });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.safeguard.archive', 'LOPA', id, { safeguardId });
    return { id: safeguardId, archived: true };
  }

  async importHazopSafeguards(tenantId: string, actorId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    if (!study.source_hazop_scenario_id) throw new BadRequestException('This LOPA study is not linked to a HAZOP scenario.');
    const sourceRows = await this.optionalMany('hazop_scenario_safeguards', (q) => q.select('*').eq('tenant_id', tenantId).eq('scenario_id', study.source_hazop_scenario_id));
    const existing = await this.studySafeguards(tenantId, id, {});
    const imported: any[] = [];
    for (const source of sourceRows) {
      if (existing.some((row) => row.hazop_safeguard_id === source.id)) continue;
      imported.push(this.studySafeguardPayload(tenantId, actorId, study, id, {
        sourceType: 'HAZOP',
        sourceSafeguardId: source.id,
        name: source.name ?? source.safeguard_name ?? source.title ?? 'HAZOP safeguard',
        type: source.type ?? source.safeguard_type ?? 'Other',
        description: source.description ?? source.notes ?? null,
        proposedUse: 'Safeguard only',
        validationStatus: 'Not Started',
        notes: 'Imported from HAZOP. Not credited as an IPL until study-specific validation is complete.'
      }, { id: crypto.randomUUID(), safeguard_number: await this.nextStudySafeguardNumber(tenantId, id, imported.length) }));
    }
    const rows = imported.length ? await this.optionalMany('lopa_study_safeguards', (q) => q.insert(imported).select()) : [];
    await this.updateStudyIplCounts(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'HAZOP_SAFEGUARDS_IMPORTED', 'HAZOP safeguards imported', `${rows.length} safeguards imported as non-credited safeguards.`, { count: rows.length });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.import_hazop_safeguards', 'LOPA', id, { count: rows.length });
    return rows;
  }

  async markSafeguardIplCandidate(tenantId: string, actorId: string, id: string, safeguardId: string, dto: UpsertLopaIplCandidateDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const safeguard = await this.db.single<any>(this.db.from('lopa_study_safeguards').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', safeguardId).single());
    await this.optionalSingle(this.db.from('lopa_study_safeguards').update({ proposed_use: 'IPL Candidate', validation_status: 'Not Started', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', safeguardId).select('id').single());
    const candidate = await this.createIplCandidate(tenantId, actorId, id, { ...dto, safeguardId, iplName: dto.iplName ?? safeguard.safeguard_name, iplType: dto.iplType ?? safeguard.safeguard_type, sourceType: safeguard.source_type ?? 'Study Safeguard', sourceReference: dto.sourceReference ?? safeguard.source_reference, pfdavg: dto.pfdavg ?? safeguard.pfdavg, rrf: dto.rrf ?? safeguard.rrf } as UpsertLopaIplCandidateDto, scope);
    await this.writeHistory(tenantId, id, actorId, 'SAFEGUARD_UPGRADED_TO_IPL_CANDIDATE', 'Safeguard marked as IPL candidate', safeguard.safeguard_name, { safeguardId, candidateId: candidate.id });
    return candidate;
  }

  async rejectSafeguardIpl(tenantId: string, actorId: string, id: string, safeguardId: string, reason: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_study_safeguards').update({ proposed_use: 'Rejected', validation_status: 'Rejected', notes: reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', safeguardId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'SAFEGUARD_IPL_REJECTED', 'Safeguard rejected for IPL credit', reason ?? row.safeguard_name, { safeguardId });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.safeguard.reject', 'LOPA', id, this.clean({ safeguardId, reason }) as JsonValue);
    return row;
  }

  async iplCandidates(tenantId: string, id: string, query: LopaIplsSafeguardsFilterDto, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.studyIplCandidates(tenantId, id, query);
  }

  async createIplCandidate(tenantId: string, actorId: string, id: string, dto: UpsertLopaIplCandidateDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_study_ipl_candidates').insert(this.iplCandidatePayload(tenantId, actorId, study, id, dto, { id: crypto.randomUUID(), candidate_number: await this.nextIplCandidateNumber(tenantId, id) })).select().single());
    await this.seedStudyIplCriteria(tenantId, actorId, id, row.id);
    await this.updateStudyIplCounts(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'IPL_CANDIDATE_CREATED', 'IPL candidate created', row.candidate_name, { candidateId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.candidate.create', 'LOPA', id, row as JsonValue);
    return row;
  }

  async selectIplFromRegistry(tenantId: string, actorId: string, id: string, dto: SelectLopaIplRegistryDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const registry = await this.iplRegistryRecord(tenantId, dto.registryIplId, scope);
    this.assertApprovedForUse(registry);
    if (registry.active === false || registry.archived_at) throw new BadRequestException('Archived IPL Registry records cannot be selected for a study.');
    const candidate = await this.createIplCandidate(tenantId, actorId, id, {
      registryIplId: registry.id,
      iplName: registry.ipl_name,
      iplType: registry.ipl_type,
      sourceType: 'IPL Registry',
      pfdavg: registry.pfdavg,
      rrf: registry.rrf,
      sourceReference: registry.source_reference,
      proofTestBasis: registry.proof_test_basis,
      notes: dto.notes
    } as UpsertLopaIplCandidateDto, scope);
    await this.optionalSingle(this.db.from('lopa_study_ipl_candidates').update({ registry_snapshot_json: registry }).eq('tenant_id', tenantId).eq('id', candidate.id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'IPL_REGISTRY_SELECTED', 'IPL selected from registry', registry.ipl_name, { registryId: registry.id, candidateId: candidate.id });
    return { ...candidate, registrySnapshot: registry };
  }

  async iplCandidateDetail(tenantId: string, id: string, candidateId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const candidate = await this.db.single<any>(this.db.from('lopa_study_ipl_candidates').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', candidateId).single());
    const [criteria, equipmentLinks, documentLinks, proofTests, gaps] = await Promise.all([
      this.optionalMany('lopa_study_ipl_validation_criteria', (q) => q.select('*').eq('tenant_id', tenantId).eq('ipl_candidate_id', candidateId)),
      this.optionalMany('lopa_study_ipl_equipment_links', (q) => q.select('*').eq('tenant_id', tenantId).eq('ipl_candidate_id', candidateId)),
      this.optionalMany('lopa_study_ipl_document_links', (q) => q.select('*').eq('tenant_id', tenantId).eq('ipl_candidate_id', candidateId)),
      this.optionalMany('lopa_study_ipl_proof_test_evidence', (q) => q.select('*').eq('tenant_id', tenantId).eq('ipl_candidate_id', candidateId)),
      this.optionalMany('lopa_study_ipl_gaps', (q) => q.select('*').eq('tenant_id', tenantId).eq('ipl_candidate_id', candidateId).neq('status', 'Archived'))
    ]);
    return { ...this.mapStudyIplCandidate(candidate, criteria, proofTests), equipmentLinks, documentLinks, gaps };
  }

  async updateIplCandidate(tenantId: string, actorId: string, id: string, candidateId: string, dto: UpsertLopaIplCandidateDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_study_ipl_candidates').update(this.iplCandidatePayload(tenantId, actorId, study, id, dto, { updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', candidateId).select().single());
    if (dto.pfdavg !== undefined || dto.rrf !== undefined) await this.markNeedsRecalculationIfNeeded(tenantId, id, study, actorId);
    await this.writeHistory(tenantId, id, actorId, 'IPL_CANDIDATE_UPDATED', 'IPL candidate updated', row.candidate_name, { candidateId });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.candidate.update', 'LOPA', id, row as JsonValue);
    return row;
  }

  async deleteIplCandidate(tenantId: string, actorId: string, id: string, candidateId: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.optionalSingle(this.db.from('lopa_study_ipl_candidates').update({ status: 'Archived', credited_in_calculation: false, credit_status: 'Credit Removed', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', candidateId).select().single());
    await this.markNeedsRecalculationIfNeeded(tenantId, id, study, actorId);
    await this.updateStudyIplCounts(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'IPL_CANDIDATE_ARCHIVED', 'IPL candidate archived', row?.candidate_name ?? candidateId, { candidateId });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.candidate.archive', 'LOPA', id, { candidateId });
    return { id: candidateId, archived: true };
  }

  async iplCandidateValidation(tenantId: string, id: string, candidateId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    let rows = await this.studyIplCriteria(tenantId, id, candidateId);
    if (!rows.length) rows = await this.seedStudyIplCriteria(tenantId, 'system', id, candidateId);
    return rows;
  }

  async updateIplCandidateValidation(tenantId: string, actorId: string, id: string, candidateId: string, dto: LopaIplValidationDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    await this.optionalMany('lopa_study_ipl_validation_criteria', (q) => q.delete().eq('tenant_id', tenantId).eq('ipl_candidate_id', candidateId).select('id'));
    const rows = dto.criteria.length ? await this.optionalMany('lopa_study_ipl_validation_criteria', (q) => q.insert(dto.criteria.map((item, index) => this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      lopa_study_id: id,
      ipl_candidate_id: candidateId,
      criterion_key: item.criterionKey,
      criterion_name: item.criterionName,
      criterion_category: item.criterionCategory,
      required_for_credit: item.requiredForCredit ?? true,
      status: item.status,
      evidence_reference: item.evidenceReference,
      notes: item.notes,
      reviewed_by: actorId,
      reviewed_at: item.status && item.status !== 'Not Reviewed' ? new Date().toISOString() : null,
      created_by: actorId,
      updated_by: actorId
    }))).select()) : [];
    const failed = rows.some((row) => row.required_for_credit && !['Pass', 'Passed', 'Not Applicable'].includes(row.status));
    await this.optionalSingle(this.db.from('lopa_study_ipl_candidates').update({ validation_status: failed ? 'Failed' : 'Validation Complete', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', candidateId).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'IPL_VALIDATION_UPDATED', 'IPL validation updated', failed ? 'Mandatory criteria still have blockers.' : 'Validation checklist completed.', { candidateId });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.validation.update', 'LOPA', id, { candidateId, rows });
    return rows;
  }

  async setIplCandidateValidationStatus(tenantId: string, actorId: string, id: string, candidateId: string, status: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_study_ipl_candidates').update({ validation_status: status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', candidateId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'IPL_VALIDATION_STATUS_UPDATED', 'IPL validation status updated', `${row.candidate_name}: ${status}`, { candidateId, status });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.validation.status', 'LOPA', id, { candidateId, status });
    return row;
  }

  async approveIplCredit(tenantId: string, actorId: string, id: string, candidateId: string, dto: LopaIplCandidateActionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const [candidate, criteria, proofTests] = await Promise.all([
      this.db.single<any>(this.db.from('lopa_study_ipl_candidates').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', candidateId).single()),
      this.studyIplCriteria(tenantId, id, candidateId),
      this.studyIplProofTests(tenantId, id, candidateId)
    ]);
    const blockers = this.iplCreditBlockers(candidate, criteria, proofTests);
    if (blockers.length) throw new BadRequestException({ message: 'IPL cannot be credited until validation blockers are cleared.', blockers });
    const row = await this.db.single<any>(this.db.from('lopa_study_ipl_candidates').update({ credited_in_calculation: true, credit_status: 'Credited', validation_status: 'Credited', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', candidateId).select().single());
    await this.markNeedsRecalculationIfNeeded(tenantId, id, study, actorId);
    await this.updateStudyIplCounts(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'IPL_CREDIT_APPROVED', 'IPL credited for future calculation', row.candidate_name, { candidateId });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.credit', 'LOPA', id, this.clean({ candidateId, reason: dto.reason }) as JsonValue);
    return row;
  }

  async removeIplCredit(tenantId: string, actorId: string, id: string, candidateId: string, reason: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_study_ipl_candidates').update({ credited_in_calculation: false, credit_status: 'Credit Removed', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', candidateId).select().single());
    await this.markNeedsRecalculationIfNeeded(tenantId, id, study, actorId);
    await this.updateStudyIplCounts(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'IPL_CREDIT_REMOVED', 'IPL credit removed', reason ?? row.candidate_name, { candidateId });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.uncredit', 'LOPA', id, this.clean({ candidateId, reason }) as JsonValue);
    return row;
  }

  async rejectIplCandidate(tenantId: string, actorId: string, id: string, candidateId: string, reason: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_study_ipl_candidates').update({ validation_status: 'Rejected', credit_status: 'Rejected', rejected_reason: reason, rejected_by: actorId, rejected_at: new Date().toISOString(), credited_in_calculation: false, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', candidateId).select().single());
    await this.markNeedsRecalculationIfNeeded(tenantId, id, study, actorId);
    await this.updateStudyIplCounts(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'IPL_CANDIDATE_REJECTED', 'IPL candidate rejected', reason ?? row.candidate_name, { candidateId });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.reject', 'LOPA', id, this.clean({ candidateId, reason }) as JsonValue);
    return row;
  }

  async reopenIplValidation(tenantId: string, actorId: string, id: string, candidateId: string, reason: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_study_ipl_candidates').update({ validation_status: 'Reopened', credit_status: 'Not Credited', credited_in_calculation: false, notes: reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', candidateId).select().single());
    await this.markNeedsRecalculationIfNeeded(tenantId, id, study, actorId);
    await this.writeHistory(tenantId, id, actorId, 'IPL_VALIDATION_REOPENED', 'IPL validation reopened', reason ?? row.candidate_name, { candidateId });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.reopen_validation', 'LOPA', id, this.clean({ candidateId, reason }) as JsonValue);
    return row;
  }

  async updateIplProofTest(tenantId: string, actorId: string, id: string, candidateId: string, dto: LopaIplProofTestDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const existing = await this.optionalSingle(this.db.from('lopa_study_ipl_proof_test_evidence').select('id').eq('tenant_id', tenantId).eq('ipl_candidate_id', candidateId).limit(1).single());
    const row = await this.db.single<any>(this.db.from('lopa_study_ipl_proof_test_evidence').upsert(this.clean({
      id: existing?.id ?? crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      lopa_study_id: id,
      ipl_candidate_id: candidateId,
      proof_test_required: dto.proofTestRequired ?? true,
      proof_test_interval: dto.proofTestInterval,
      proof_test_procedure_id: dto.proofTestProcedureId,
      last_proof_test_date: dto.lastProofTestDate,
      next_proof_test_due: dto.nextProofTestDue,
      inspection_required: dto.inspectionRequired ?? false,
      inspection_interval: dto.inspectionInterval,
      inspection_procedure_id: dto.inspectionProcedureId,
      maintenance_basis: dto.maintenanceBasis,
      mi_program_id: dto.miProgramId,
      overdue_status: dto.overdueStatus ?? 'Not Reviewed',
      evidence_attachment_id: dto.evidenceAttachmentId,
      deferral_allowed: dto.deferralAllowed ?? false,
      deferral_approval_status: dto.deferralApprovalStatus,
      notes: dto.notes,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    })).select().single());
    await this.writeHistory(tenantId, id, actorId, 'IPL_PROOF_TEST_UPDATED', 'IPL proof test evidence updated', row.proof_test_basis, { candidateId, evidenceId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.proof_test.update', 'LOPA', id, row as JsonValue);
    return row;
  }

  async createIplMissingDataActions(tenantId: string, actorId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const gaps = await this.iplsSafeguardsGaps(tenantId, id, scope, true);
    const openGenerated = gaps.filter((gap: any) => gap.generated);
    const rows = openGenerated.length ? await this.optionalMany('lopa_study_ipl_gaps', (q) => q.insert(openGenerated.map((gap: any) => this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      lopa_study_id: id,
      ipl_candidate_id: gap.ipl_candidate_id,
      gap_type: gap.gap_type,
      gap_title: gap.title,
      severity: gap.severity,
      status: 'Open',
      created_by: actorId,
      updated_by: actorId
    }))).select()) : [];
    await this.writeHistory(tenantId, id, actorId, 'IPL_GAP_ACTIONS_CREATED', 'IPL gap actions prepared', `${rows.length} IPL gaps were recorded for action tracking.`, { count: rows.length });
    await this.writeAudit(tenantId, actorId, 'lopa.ipl.gaps.create_actions', 'LOPA', id, { count: rows.length });
    return rows;
  }

  async riskCalculationContext(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    return {
      readOnly: this.isReadOnly(study),
      methodology: this.riskCalculationMethodology(study),
      statuses: ['Not Started', 'Blocked', 'Ready for Calculation', 'Calculated', 'Needs Recalculation', 'Calculation Failed', 'Locked', 'Superseded'],
      resultStatuses: ['Not Calculated', 'Pass', 'Fail', 'Warning', 'Needs Recalculation', 'Blocked', 'Locked']
    };
  }

  async riskCalculationTab(tenantId: string, id: string, query: LopaRiskCalculationFilterDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [currentInputs, latest, versions, assumptions, gaps] = await Promise.all([
      this.riskCalculationInputs(tenantId, id, scope),
      this.latestRiskCalculation(tenantId, id),
      this.riskCalculationVersions(tenantId, id, scope),
      this.riskCalculationAssumptions(tenantId, id, scope),
      this.riskCalculationGaps(tenantId, id, scope)
    ]);
    const readiness = await this.riskCalculationReadiness(tenantId, id, scope);
    const stale = latest?.input_hash && latest.input_hash !== currentInputs.inputHash;
    const calculation = stale ? { ...latest, calculation_status: 'Needs Recalculation', result_status: 'Needs Recalculation' } : latest;
    return {
      readOnly: this.isReadOnly(study) || !!calculation?.locked,
      header: {
        lopaNumber: study.lopa_number,
        title: study.title,
        studyStatus: study.status,
        calculationStatus: calculation?.calculation_status ?? study.calculation_status ?? 'Not Started',
        lastCalculatedAt: calculation?.calculated_at ?? study.last_calculated_at ?? null,
        lastCalculatedBy: calculation?.calculated_by ?? null,
        locked: !!calculation?.locked
      },
      summary: this.riskCalculationSummaryFrom(calculation, currentInputs, readiness),
      readiness,
      currentInputs,
      calculation,
      versions,
      assumptions,
      gaps: this.applyRiskCalculationGapFilters(gaps, query),
      context: await this.riskCalculationContext(tenantId, id, scope)
    };
  }

  async riskCalculationSummary(tenantId: string, id: string, scope: Scope) {
    const [inputs, latest, readiness] = await Promise.all([this.riskCalculationInputs(tenantId, id, scope), this.latestRiskCalculation(tenantId, id), this.riskCalculationReadiness(tenantId, id, scope)]);
    return this.riskCalculationSummaryFrom(latest, inputs, readiness);
  }

  async riskCalculationReadiness(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const inputs = await this.riskCalculationInputs(tenantId, id, scope);
    const creditedBlockers = inputs.creditedIpls.flatMap((ipl: any) => this.riskCalculationIplBlockers(ipl));
    const checks = [
      this.check('scenario_complete', 'Scenario & Consequence complete', !!inputs.consequence?.description && !!inputs.consequence?.severity, 'Blocked'),
      this.check('tolerable_frequency', 'Tolerable risk frequency selected', this.toNumber(inputs.tolerableFrequency) > 0, 'Blocked'),
      this.check('initiating_event_frequency', 'Initiating event frequency basis complete', this.toNumber(inputs.initiatingEvent?.frequency_per_year ?? inputs.study.initiating_event_frequency) > 0, 'Blocked'),
      this.check('conditional_modifiers_reviewed', 'Conditional modifiers reviewed', inputs.conditionalModifiers.every((m: any) => this.toNumber(m.selected_value ?? m.default_value ?? 1) > 0), 'Warning'),
      this.check('ipl_validation_complete', 'Credited IPLs are validated and credited', inputs.creditedIpls.every((ipl: any) => ['Credited', 'Approved for Credit', 'Validation Complete'].includes(ipl.validation_status)), 'Blocked'),
      this.check('credited_ipl_pfd_basis', 'Credited IPL PFDavg/RRF basis complete', creditedBlockers.length === 0, 'Blocked'),
      this.check('calculation_methodology', 'Calculation methodology selected', !!this.riskCalculationMethodology(study).methodologyName, 'Blocked'),
      this.check('study_mutable', 'Study is not closed/approved read-only', !this.isReadOnly(study), 'Warning')
    ];
    const readiness = this.readinessFromChecks(checks);
    return { ...readiness, inputHash: inputs.inputHash, blockers: [...readiness.blockers, ...creditedBlockers.map((title: string) => ({ key: title, title, severity: 'Hard', status: 'Open' }))] };
  }

  async riskCalculationInputs(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [consequences, initiatingEvents, modifiers, candidates, safeguards, riskCriteria] = await Promise.all([
      this.optionalMany('lopa_consequences', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('updated_at', { ascending: false }).limit(1)),
      this.optionalMany('lopa_initiating_events', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('updated_at', { ascending: false }).limit(1)),
      this.optionalMany('lopa_study_conditional_modifier_snapshots', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).neq('status', 'Archived').order('selected_at', { ascending: false })),
      this.optionalMany('lopa_study_ipl_candidates', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).neq('status', 'Archived').order('updated_at', { ascending: false })),
      this.optionalMany('lopa_study_safeguards', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('deleted_at', null).neq('status', 'Archived').order('updated_at', { ascending: false })),
      this.optionalMany('lopa_risk_criteria_snapshots', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }).limit(1))
    ]);
    const consequence = consequences[0] ?? null;
    const initiatingEvent = initiatingEvents[0] ?? null;
    const creditedIpls = candidates.filter((candidate) => candidate.credited_in_calculation);
    const excludedIpls = candidates.filter((candidate) => !candidate.credited_in_calculation);
    const tolerableFrequency = this.toNumber(consequence?.tolerable_event_frequency ?? riskCriteria[0]?.tolerable_event_frequency);
    const methodology = this.riskCalculationMethodology(study);
    const inputHash = this.riskCalculationHash({ studyId: id, consequence, initiatingEvent, modifiers, creditedIpls, tolerableFrequency, methodology });
    return { study, consequence, initiatingEvent, conditionalModifiers: modifiers, creditedIpls, excludedIpls, safeguards, riskCriteria: riskCriteria[0] ?? null, tolerableFrequency, methodology, inputHash };
  }

  async calculateRisk(tenantId: string, actorId: string, id: string, dto: LopaRiskCalculationActionDto, scope: Scope, recalculate: boolean) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const latest = await this.latestRiskCalculation(tenantId, id);
    if (latest?.locked) throw new BadRequestException('Calculation is locked. Unlock before recalculating.');
    const inputs = await this.riskCalculationInputs(tenantId, id, scope);
    const readiness = await this.riskCalculationReadiness(tenantId, id, scope);
    if (readiness.blockers?.length) {
      await this.recordRiskCalculationGaps(tenantId, actorId, study, id, readiness.blockers, null);
      throw new BadRequestException({ message: 'Risk calculation is blocked by missing or invalid inputs.', blockers: readiness.blockers });
    }
    const result = this.runRiskCalculationEngine(inputs);
    const versionNumber = (await this.riskCalculationVersions(tenantId, id, scope)).length + 1;
    const now = new Date().toISOString();
    if (latest?.id) {
      await this.optionalSingle(this.db.from('lopa_risk_calculations').update({ calculation_status: 'Superseded', superseded_by_id: null, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', latest.id).select('id').single());
    }
    const calculation = await this.db.single<any>(this.db.from('lopa_risk_calculations').insert(this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id,
      lopa_study_id: id,
      calculation_number: `CALC-${String(versionNumber).padStart(3, '0')}`,
      calculation_version: versionNumber,
      calculation_status: 'Calculated',
      result_status: result.meetsRiskCriteria ? 'Pass' : 'Fail',
      methodology_name: inputs.methodology.methodologyName,
      methodology_version: inputs.methodology.methodologyVersion,
      ie_frequency: result.ieFrequency,
      ie_frequency_unit: 'per year',
      combined_modifier_factor: result.combinedModifierFactor,
      frequency_after_modifiers: result.frequencyAfterModifiers,
      combined_ipl_pfdavg: result.combinedIplPfdavg,
      combined_ipl_rrf: result.combinedIplRrf,
      mitigated_event_frequency: result.mitigatedEventFrequency,
      tolerable_frequency: result.tolerableFrequency,
      tolerable_frequency_unit: 'per year',
      risk_gap_factor: result.riskGapFactor,
      required_additional_rrf: result.requiredAdditionalRrf,
      meets_risk_criteria: result.meetsRiskCriteria,
      additional_ipl_required: result.additionalIplRequired,
      sif_sil_evaluation_required: result.sifSilEvaluationRequired,
      low_mitigated_frequency: result.lowMitigatedFrequency,
      high_mitigated_frequency: result.highMitigatedFrequency,
      confidence_level_summary: result.confidenceLevelSummary,
      input_hash: inputs.inputHash,
      snapshot_json: inputs,
      assumptions_json: dto.notes ? [{ note: dto.notes, createdBy: actorId, createdAt: now }] : [],
      calculation_notes: dto.notes,
      calculated_by: actorId,
      calculated_at: now,
      created_by: actorId,
      updated_by: actorId
    })).select().single());
    const rows = this.riskCalculationInputRows(tenantId, study, id, calculation.id, inputs);
    if (rows.length) await this.optionalMany('lopa_risk_calculation_inputs', (q) => q.insert(rows).select());
    await this.optionalSingle(this.db.from('lopa_risk_calculation_versions').insert(this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id,
      lopa_study_id: id,
      risk_calculation_id: calculation.id,
      version_number: versionNumber,
      status: calculation.result_status,
      input_hash: inputs.inputHash,
      snapshot_json: inputs,
      result_json: result,
      calculated_by: actorId,
      calculated_at: now,
      notes: dto.notes
    })).select().single());
    await this.optionalSingle(this.db.from('lopa_studies').update({
      calculation_status: result.meetsRiskCriteria ? 'Complete' : 'Risk Gap Open',
      risk_calculation_status: 'Calculated',
      risk_gap_status: result.meetsRiskCriteria ? 'Risk Criteria Met' : 'Risk Gap Open',
      sil_evaluation_required: result.sifSilEvaluationRequired,
      sil_required: result.sifSilEvaluationRequired,
      total_pfdavg: result.combinedIplPfdavg,
      total_rrf: result.combinedIplRrf,
      required_rrf: result.requiredAdditionalRrf,
      mitigated_event_frequency: result.mitigatedEventFrequency,
      risk_gap: result.meetsRiskCriteria ? 'Closed' : `Gap ${result.riskGapFactor}`,
      last_calculated_at: now,
      updated_by: actorId,
      updated_at: now
    }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    if (!result.meetsRiskCriteria) await this.recordRiskCalculationGaps(tenantId, actorId, study, id, [{ title: `Risk gap remains. Required additional RRF ${result.requiredAdditionalRrf}`, severity: 'Hard', status: 'Open' }], calculation.id);
    await this.writeHistory(tenantId, id, actorId, recalculate ? 'RISK_RECALCULATED' : 'RISK_CALCULATED', recalculate ? 'Risk recalculated' : 'Risk calculation completed', `Mitigated frequency ${result.mitigatedEventFrequency}; tolerable ${result.tolerableFrequency}.`, { calculationId: calculation.id, result });
    await this.writeAudit(tenantId, actorId, recalculate ? 'lopa.risk_calculation.recalculate' : 'lopa.risk_calculation.calculate', 'LOPA', id, { calculationId: calculation.id, result } as unknown as JsonValue);
    return { calculation, result, inputs };
  }

  async saveRiskCalculationSnapshot(tenantId: string, actorId: string, id: string, dto: LopaRiskCalculationActionDto, scope: Scope) {
    const latest = await this.latestRiskCalculation(tenantId, id);
    if (!latest) throw new BadRequestException('Run calculation before saving a snapshot.');
    await this.writeHistory(tenantId, id, actorId, 'RISK_CALCULATION_SNAPSHOT_SAVED', 'Risk calculation snapshot saved', dto.notes ?? 'Calculation snapshot saved.', { calculationId: latest.id });
    await this.writeAudit(tenantId, actorId, 'lopa.risk_calculation.snapshot.save', 'LOPA', id, { calculationId: latest.id } as JsonValue);
    return latest;
  }

  async lockRiskCalculation(tenantId: string, actorId: string, id: string, reason: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const latest = await this.latestRiskCalculation(tenantId, id);
    if (!latest) throw new BadRequestException('No calculation is available to lock.');
    const row = await this.db.single<any>(this.db.from('lopa_risk_calculations').update({ locked: true, locked_by: actorId, locked_at: new Date().toISOString(), calculation_status: 'Locked', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', latest.id).select().single());
    await this.writeHistory(tenantId, id, actorId, 'RISK_CALCULATION_LOCKED', 'Risk calculation locked', reason ?? 'Calculation locked.', { calculationId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.risk_calculation.lock', 'LOPA', id, this.clean({ calculationId: row.id, reason }) as JsonValue);
    return row;
  }

  async unlockRiskCalculation(tenantId: string, actorId: string, id: string, reason: string | undefined, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const latest = await this.latestRiskCalculation(tenantId, id);
    if (!latest) throw new BadRequestException('No calculation is available to unlock.');
    const row = await this.db.single<any>(this.db.from('lopa_risk_calculations').update({ locked: false, locked_by: null, locked_at: null, calculation_status: 'Needs Recalculation', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', latest.id).select().single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ calculation_status: 'Needs Recalculation', risk_calculation_status: 'Needs Recalculation', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'RISK_CALCULATION_UNLOCKED', 'Risk calculation unlocked', reason ?? 'Calculation unlocked.', { calculationId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.risk_calculation.unlock', 'LOPA', id, this.clean({ calculationId: row.id, reason }) as JsonValue);
    return row;
  }

  async riskCalculationVersions(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.optionalMany('lopa_risk_calculation_versions', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('version_number', { ascending: false }));
  }

  async riskCalculationVersion(tenantId: string, id: string, versionId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.db.single<any>(this.db.from('lopa_risk_calculation_versions').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', versionId).single());
  }

  async riskCalculationAssumptions(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.optionalMany('lopa_risk_calculation_assumptions', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }));
  }

  async createRiskCalculationAssumption(tenantId: string, actorId: string, id: string, dto: UpsertLopaRiskCalculationAssumptionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_risk_calculation_assumptions').insert(this.riskCalculationAssumptionPayload(tenantId, actorId, study, id, dto, { id: crypto.randomUUID(), created_by: actorId })).select().single());
    await this.writeHistory(tenantId, id, actorId, 'RISK_CALCULATION_ASSUMPTION_CREATED', 'Risk calculation assumption added', row.assumption_title, { assumptionId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.risk_calculation.assumption.create', 'LOPA', id, row as JsonValue);
    return row;
  }

  async updateRiskCalculationAssumption(tenantId: string, actorId: string, id: string, assumptionId: string, dto: UpsertLopaRiskCalculationAssumptionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_risk_calculation_assumptions').update(this.riskCalculationAssumptionPayload(tenantId, actorId, study, id, dto, { updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', assumptionId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'RISK_CALCULATION_ASSUMPTION_UPDATED', 'Risk calculation assumption updated', row.assumption_title, { assumptionId });
    await this.writeAudit(tenantId, actorId, 'lopa.risk_calculation.assumption.update', 'LOPA', id, row as JsonValue);
    return row;
  }

  async deleteRiskCalculationAssumption(tenantId: string, actorId: string, id: string, assumptionId: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    await this.optionalSingle(this.db.from('lopa_risk_calculation_assumptions').delete().eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', assumptionId).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'RISK_CALCULATION_ASSUMPTION_DELETED', 'Risk calculation assumption removed', 'Assumption removed.', { assumptionId });
    await this.writeAudit(tenantId, actorId, 'lopa.risk_calculation.assumption.delete', 'LOPA', id, { assumptionId } as JsonValue);
    return { id: assumptionId, deleted: true };
  }

  async riskCalculationGaps(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.optionalMany('lopa_risk_calculation_gaps', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).neq('status', 'Archived').order('created_at', { ascending: false }));
  }

  async createRiskCalculationGap(tenantId: string, actorId: string, id: string, dto: UpsertLopaRiskCalculationGapDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const latest = await this.latestRiskCalculation(tenantId, id);
    const row = await this.db.single<any>(this.db.from('lopa_risk_calculation_gaps').insert(this.riskCalculationGapPayload(tenantId, actorId, study, id, latest?.id ?? null, dto)).select().single());
    await this.writeHistory(tenantId, id, actorId, 'RISK_CALCULATION_GAP_CREATED', 'Risk calculation gap created', row.gap_title, { gapId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.risk_calculation.gap.create', 'LOPA', id, row as JsonValue);
    return row;
  }

  async createRiskCalculationGapAction(tenantId: string, actorId: string, id: string, gapId: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const gap = await this.db.single<any>(this.db.from('lopa_risk_calculation_gaps').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', gapId).single());
    const action = await this.optionalSingle(this.db.from('Action').insert(this.clean({ id: crypto.randomUUID(), tenantId, title: gap.gap_title, description: gap.gap_description, status: 'Open', priority: gap.severity, module: 'LOPA', recordId: id, ownerId: actorId })).select().single());
    await this.optionalSingle(this.db.from('lopa_risk_calculation_gaps').update({ action_id: action?.id ?? gap.action_id, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', gapId).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'RISK_CALCULATION_GAP_ACTION_CREATED', 'Risk calculation gap action created', gap.gap_title, { gapId, actionId: action?.id ?? null });
    return action ?? { gapId, actionCreated: false };
  }

  async createRiskGapAction(tenantId: string, actorId: string, id: string, scope: Scope) {
    const latest = await this.latestRiskCalculation(tenantId, id);
    const title = latest?.meets_risk_criteria === false ? `Risk gap requires additional RRF ${latest.required_additional_rrf}` : 'Risk calculation review action';
    const gap = await this.createRiskCalculationGap(tenantId, actorId, id, { gapType: 'Risk Gap', gapTitle: title, gapDescription: 'Risk calculation result requires follow-up.', severity: 'High', closureBlocker: true }, scope);
    return this.createRiskCalculationGapAction(tenantId, actorId, id, gap.id, scope);
  }

  async createMissingInputActions(tenantId: string, actorId: string, id: string, scope: Scope) {
    const readiness = await this.riskCalculationReadiness(tenantId, id, scope);
    const rows: any[] = [];
    for (const blocker of readiness.blockers ?? []) {
      rows.push(await this.createRiskCalculationGap(tenantId, actorId, id, { gapType: 'Missing Input', gapTitle: blocker.title, gapDescription: blocker.title, severity: blocker.severity === 'Hard' ? 'High' : 'Medium', closureBlocker: blocker.severity === 'Hard' }, scope));
    }
    return rows;
  }

  async exportRiskCalculation(tenantId: string, id: string, query: LopaRiskCalculationFilterDto, scope: Scope) {
    const tab = await this.riskCalculationTab(tenantId, id, query, scope);
    await this.writeAudit(tenantId, 'system', 'lopa.risk_calculation.export', 'LOPA', id, { exportedAt: new Date().toISOString() } as JsonValue);
    return { generatedAt: new Date().toISOString(), ...tab };
  }

  async silDeterminationTab(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [calculation, determination, sifs, gaps, links, actionLinks, snapshots, reassessments, methodology, riskInputs] = await Promise.all([
      this.latestRiskCalculation(tenantId, id),
      this.optionalSingle(this.db.from('lopa_sil_determinations').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).single()),
      this.optionalMany('lopa_sif_specifications', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('deleted_at', null).order('updated_at', { ascending: false })),
      this.optionalMany('lopa_sil_iec61511_gaps', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false })),
      this.optionalMany('lopa_sif_record_links', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null).order('linked_at', { ascending: false })),
      this.optionalMany('lopa_sil_actions', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null).order('linked_at', { ascending: false })),
      this.optionalMany('lopa_sil_snapshots', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('version_number', { ascending: false })),
      this.optionalMany('lopa_sil_reassessment_events', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('status', 'Open').order('changed_at', { ascending: false })),
      this.silMethodology(tenantId, study),
      this.riskCalculationInputs(tenantId, id, scope)
    ]);
    const sifIds = sifs.map((row: any) => row.id);
    const [components, architectures, proofTests] = await Promise.all([
      sifIds.length ? this.optionalMany('lopa_sif_components', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).in('sif_specification_id', sifIds).is('deleted_at', null).order('sort_order')) : Promise.resolve([]),
      sifIds.length ? this.optionalMany('lopa_sif_architectures', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).in('sif_specification_id', sifIds)) : Promise.resolve([]),
      sifIds.length ? this.optionalMany('lopa_sif_proof_test_bypass', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).in('sif_specification_id', sifIds)) : Promise.resolve([])
    ]);
    const actionRows = await this.actionRowsByIds(tenantId, actionLinks.map((link: any) => link.action_id).filter(Boolean));
    const actionById = new Map(actionRows.map((action: any) => [action.id, action]));
    const actions = actionLinks.map((link: any) => ({ ...link, action: actionById.get(link.action_id), status: actionById.get(link.action_id)?.status ?? link.status, title: actionById.get(link.action_id)?.title ?? link.title })).filter((row: any) => row.action || row.title);
    const dependencyHash = this.silDependencyHash(calculation, riskInputs, sifs, components, links);
    const sourceChanged = !!determination?.dependency_hash && determination.dependency_hash !== dependencyHash;
    const effectiveReassessments = sourceChanged && !reassessments.length ? [{ id: 'derived-source-change', trigger_type: 'Dependency changed', trigger_description: 'Risk Calculation, credited IPLs, tolerable risk, consequence, SIF data, or linked evidence changed after determination.', status: 'Open', reassessment_required: true }] : reassessments;
    const readiness = await this.silReadiness(study, calculation, riskInputs, methodology, determination, sifs, components, architectures, proofTests, gaps, links, actions, effectiveReassessments);
    const latestSif = sifs[0] ?? null;
    return {
      readOnly: this.isReadOnly(study) || !!determination?.locked,
      header: { lopaNumber: study.lopa_number, title: study.title, studyStatus: study.status, calculationStatus: calculation?.calculation_status ?? study.calculation_status, silStatus: determination?.status ?? study.sil_determination_status ?? 'Not Started', sifRequirementStatus: determination?.sif_requirement_status ?? (determination?.new_sif_required ? 'New SIF Required' : 'Not Determined'), targetSil: determination?.target_sil ?? null, requiredRrf: determination?.required_rrf ?? calculation?.required_additional_rrf ?? null, riskGapStatus: study.risk_gap_status, needsReassessment: !!study.sil_needs_reassessment || effectiveReassessments.length > 0, lastDeterminedAt: determination?.determined_at ?? study.sil_last_determined_at ?? null, lastDeterminedBy: determination?.determined_by ?? study.sil_last_determined_by ?? null, lastReassessmentStatus: determination?.last_reassessment_status ?? null, lastUpdatedAt: determination?.updated_at ?? study.updated_at },
      summary: { silDeterminationStatus: determination?.status ?? 'Not Started', silRequired: !!determination?.sil_required, targetSil: determination?.target_sil ?? null, requiredRrf: determination?.required_rrf ?? calculation?.required_additional_rrf ?? null, requiredPfdavg: determination?.required_pfdavg ?? null, mitigatedFrequency: calculation?.mitigated_event_frequency ?? null, tolerableFrequency: calculation?.tolerable_frequency ?? null, calculationStatus: calculation?.calculation_status ?? study.calculation_status, riskGapStatus: study.risk_gap_status, existingSifFound: !!determination?.existing_sif_exists, existingSifAdequate: determination?.existing_sif_adequate ?? null, newSifRequired: !!determination?.new_sif_required, sifSpecificationStatus: latestSif?.status ?? 'Not Started', sifCount: sifs.length, completeSifs: sifs.filter((s: any) => s.complete).length, sifTargetSil: latestSif?.target_sil ?? null, sifExpectedPfdavg: latestSif?.expected_pfdavg ?? null, proofTestBasisStatus: proofTests.some((row: any) => row.proof_test_interval && row.maintenance_basis) ? 'Complete' : 'Missing', openIecGaps: gaps.filter((g: any) => !['Complete', 'Closed', 'Not Applicable'].includes(g.status)).length, openActions: actions.filter((a: any) => !this.isActionClosed(a.action ?? a)).length, missingDocuments: links.filter((l: any) => l.required && String(l.linked_record_type ?? l.record_type).toLowerCase().includes('document') && !l.linked_record_id).length, missingEquipmentLinks: links.filter((l: any) => l.required && l.linked_record_type === 'Equipment' && !l.linked_record_id).length, needsReassessment: effectiveReassessments.length > 0, readyForReview: readiness.status === 'Ready', locked: !!determination?.locked },
      riskCalculation: calculation ? { ...calculation, creditedIpls: riskInputs.creditedIpls, assumptions: calculation.assumptions_json ?? [], sourceReferences: (riskInputs.creditedIpls ?? []).map((ipl: any) => ipl.source_reference).filter(Boolean), changedAfterSilDetermination: sourceChanged, needsReassessmentReason: sourceChanged ? 'Current SIL dependency hash differs from the determined basis.' : null } : null,
      determination,
      sifs, components, architectures, proofTests, gaps, links, actions, snapshots, reassessments: effectiveReassessments, readiness,
      methodology,
      context: { statuses: ['Not Started','Not Ready','Ready','In Progress','SIL Not Required','SIL Required','Existing SIF Under Review','Existing SIF Adequate','Existing SIF Not Adequate','New SIF Required','SIF Specification Draft','SIF Specification Complete','Needs Reassessment','Locked','Approved','Reopened','Superseded'], targetSilOptions: methodology?.mapping_rules_json?.map((rule: any) => rule.targetSil ?? rule.target_sil).filter(Boolean) ?? [], componentTypes: ['Sensor','Logic Solver','Final Element','Auxiliary','Other'], votingOptions: ['1oo1','1oo2','2oo2','2oo3','1oo1D','Custom','Not determined'], demandModes: ['Low demand','High demand','Continuous','Not determined'] }
    };
  }

  async determineSil(tenantId: string, actorId: string, id: string, dto: LopaSilActionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study);
    const [calculation, methodology, riskInputs] = await Promise.all([this.latestRiskCalculation(tenantId, id), this.silMethodology(tenantId, study), this.riskCalculationInputs(tenantId, id, scope)]);
    if (!calculation || !['Calculated', 'Locked'].includes(calculation.calculation_status) || calculation.result_status === 'Needs Recalculation') throw new BadRequestException('Run a current Risk Calculation before determining SIL.');
    if (!methodology) throw new BadRequestException('No approved SIL methodology is configured for this company/site.');
    if (this.toNumber(calculation.tolerable_frequency) <= 0) throw new BadRequestException('Tolerable frequency is missing from the current Risk Calculation.');
    if (calculation.mitigated_event_frequency == null || calculation.required_additional_rrf == null) throw new BadRequestException('Risk gap and required additional RRF must be calculated before SIL determination.');
    const existing = await this.optionalSingle(this.db.from('lopa_sil_determinations').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).single());
    if (existing?.locked) throw new BadRequestException('SIL determination is locked. Unlock it before reassessing.');
    const now = new Date().toISOString();
    const requiredRrf = this.toNumber(calculation.required_additional_rrf);
    const riskGapExists = calculation.meets_risk_criteria === false && requiredRrf > 1;
    const target = riskGapExists ? this.resolveConfiguredSilTarget(methodology, requiredRrf) : { targetSil: 'SIL Not Required', specialistReviewRequired: false, requiredSilBand: 'Not Required' };
    if (riskGapExists && !target.targetSil) throw new BadRequestException('Configured SIL methodology has no mapping rule for the calculated required RRF. Specialist review is required.');
    const dependencyHash = this.silDependencyHash(calculation, riskInputs, [], [], []);
    const status = riskGapExists ? 'SIL Required' : 'SIL Not Required';
    const payload = this.clean({ id: existing?.id ?? crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, determination_number: existing?.determination_number ?? `SIL-${study.lopa_number ?? id}`, determination_version: Number(existing?.determination_version ?? 0) + 1, risk_calculation_id: calculation.id, risk_calculation_version_id: calculation.id, calculation_snapshot_json: { calculation, riskInputs }, dependency_hash: dependencyHash, status, methodology_id: methodology.id, methodology_name: methodology.methodology_name, methodology_version: methodology.methodology_version, methodology_reference: methodology.sil_mapping_rules_reference ?? dto.methodologyReference, required_rrf: requiredRrf, required_pfdavg: requiredRrf > 0 ? 1 / requiredRrf : null, target_sil: target.targetSil, required_sil_band: target.requiredSilBand, sil_required: riskGapExists, risk_gap_exists: riskGapExists, risk_gap_ratio: calculation.risk_gap_factor, mitigated_frequency: calculation.mitigated_event_frequency, tolerable_frequency: calculation.tolerable_frequency, sil_determination_method: methodology.methodology_name, consequence_category: riskInputs.consequence?.category, tolerable_frequency_basis: riskInputs.consequence?.risk_criteria_source, risk_gap_basis: `Risk calculation ${calculation.calculation_number ?? calculation.id}`, new_sif_required: riskGapExists && !existing?.existing_sif_adequate, sif_requirement_status: riskGapExists ? (existing?.existing_sif_adequate ? 'Existing SIF Adequate' : 'New SIF Required') : 'SIL Not Required', sil_gap_status: riskGapExists ? 'Open' : 'Closed', specialist_review_required: !!target.specialistReviewRequired, reviewer_required: !!methodology.reviewer_required, approval_required: methodology.approval_required !== false, determination_basis: dto.notes ?? `Backend determination from configured methodology ${methodology.methodology_name} ${methodology.methodology_version}.`, determined_by: actorId, determined_at: now, updated_at: now });
    const row = existing?.id
      ? await this.db.single<any>(this.db.from('lopa_sil_determinations').update(payload).eq('tenant_id', tenantId).eq('id', existing.id).select().single())
      : await this.db.single<any>(this.db.from('lopa_sil_determinations').insert(payload).select().single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ sil_determination_status: status, sil_status: status, sil_required: riskGapExists, sif_required: row.new_sif_required, sif_status: row.sif_requirement_status, target_sil: row.target_sil, sil_last_determined_at: now, sil_last_determined_by: actorId, sil_needs_reassessment: false, updated_at: now, updated_by: actorId }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.recordSilSnapshot(tenantId, actorId, study, row, calculation, 'Determination');
    await this.writeHistory(tenantId, id, actorId, 'SIL_DETERMINED', 'SIL determination completed', 'SIL basis was generated from the current risk calculation.', { determinationId: row.id, calculationId: calculation.id });
    await this.writeAudit(tenantId, actorId, 'lopa.sil.determine', 'LOPA', id, { determinationId: row.id, calculationId: calculation.id } as JsonValue);
    return row;
  }

  async reassessSil(tenantId: string, actorId: string, id: string, dto: LopaSilActionDto, scope: Scope) {
    if (!dto.reason) throw new BadRequestException('Reassessment reason is required.');
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study);
    const determination = await this.optionalSingle(this.db.from('lopa_sil_determinations').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).single());
    if (!determination) throw new BadRequestException('Create the initial SIL determination before reassessment.');
    if (determination.locked) throw new BadRequestException('Unlock the SIL basis before reassessment.');
    const row = await this.determineSil(tenantId, actorId, id, { notes: dto.reason }, scope);
    const now = new Date().toISOString();
    await this.optionalMany('lopa_sil_reassessment_events', q => q.update({ status: 'Resolved', resolved_by: actorId, resolved_at: now }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('status', 'Open').select());
    const updated = await this.db.single<any>(this.db.from('lopa_sil_determinations').update({ last_reassessment_status: 'Completed', last_reassessed_by: actorId, last_reassessed_at: now, status: row.status, updated_at: now }).eq('tenant_id', tenantId).eq('id', row.id).select().single());
    await this.writeHistory(tenantId, id, actorId, 'SIL_REASSESSED', 'SIL determination reassessed', dto.reason, { determinationId: row.id, version: row.determination_version } as JsonValue);
    await this.writeAudit(tenantId, actorId, 'lopa.sil.reassess', 'LOPA', id, { determinationId: row.id, reason: dto.reason } as JsonValue);
    return updated;
  }

  async overrideSilDetermination(tenantId: string, actorId: string, id: string, determinationId: string, dto: LopaSilActionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study);
    if (!dto.reason || !dto.targetSil) throw new BadRequestException('Target SIL and override justification are required.');
    const before = await this.db.single<any>(this.db.from('lopa_sil_determinations').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', determinationId).single());
    if (before.locked) throw new BadRequestException('Unlock the SIL basis before overriding it.');
    const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('lopa_sil_determinations').update({ manual_override: true, target_sil: dto.targetSil, override_reason: dto.reason, override_by: actorId, override_at: now, override_approved_by: actorId, override_approved_at: now, status: 'Needs Specialist Review', specialist_review_required: true, updated_at: now }).eq('tenant_id', tenantId).eq('id', determinationId).select().single());
    await this.recordSilSnapshot(tenantId, actorId, study, row, await this.latestRiskCalculation(tenantId, id), 'Override');
    await this.writeHistory(tenantId, id, actorId, 'SIL_OVERRIDE_APPLIED', 'SIL target manually overridden', dto.reason, { determinationId, before: before.target_sil, after: row.target_sil } as JsonValue);
    await this.writeAudit(tenantId, actorId, 'lopa.sil.override', 'LOPA', id, row as JsonValue); return row;
  }

  async upsertSifSpecification(tenantId: string, actorId: string, id: string, sifId: string | null, dto: UpsertLopaSifDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study);
    const determination = await this.optionalSingle(this.db.from('lopa_sil_determinations').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).single());
    if (!determination) throw new BadRequestException('Determine SIL before creating an SIF specification.');
    const now = new Date().toISOString();
    const completeBlockers = dto.complete ? this.sifSpecificationDtoBlockers(dto, determination) : [];
    if (completeBlockers.length) throw new BadRequestException({ message: 'SIF specification is incomplete.', blockers: completeBlockers });
    const currentCount = sifId ? 0 : (await this.optionalMany('lopa_sif_specifications', q => q.select('id').eq('tenant_id', tenantId).eq('lopa_study_id', id))).length;
    const payload = this.clean({ id: sifId ?? crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, sil_determination_id: determination.id, sif_number: sifId ? undefined : `SIF-${String(currentCount + 1).padStart(3, '0')}`, sif_tag: dto.sifTag, title: dto.title, description: dto.description, sif_type: dto.sifType, safety_function: dto.safetyFunction, hazardous_event_prevented: dto.hazardousEventPrevented, consequence_mitigated: dto.consequenceMitigated, process_demand_detected: dto.processDemandDetected, initiating_cause_addressed: dto.initiatingCauseAddressed, required_action: dto.requiredAction ?? dto.processAction, target_sil: determination.target_sil, safe_state: dto.safeState, trip_setpoint: dto.tripSetpoint, trip_setpoint_units: dto.tripSetpointUnits, setpoint_basis: dto.setpointBasis, reset_requirement: dto.resetRequirement, reset_philosophy: dto.resetPhilosophy, manual_reset_required: dto.manualResetRequired, process_action: dto.processAction, operating_mode: dto.operatingMode, demand_mode: dto.demandMode, response_time: dto.responseTime, response_time_required: dto.responseTimeRequired, response_time_available: dto.responseTimeAvailable, bypass_management: dto.bypassManagement, proof_test_interval: dto.proofTestInterval, proof_test_basis: dto.proofTestBasis, maintenance_requirements: dto.maintenanceRequirements, equipment_system: dto.equipmentSystem, owner_id: dto.ownerId, design_owner_id: dto.designOwnerId, operations_owner_id: dto.operationsOwnerId, maintenance_owner_id: dto.maintenanceOwnerId, functional_safety_specialist_id: dto.functionalSafetySpecialistId, required_rrf: determination.required_rrf, required_pfdavg: determination.required_pfdavg, expected_pfdavg: dto.expectedPfdavg, srs_required: dto.srsRequired, sil_verification_required: dto.silVerificationRequired, validation_required: dto.validationRequired, proof_test_required: dto.proofTestRequired, moc_required: dto.mocRequired, pssr_required: dto.pssrRequired, mi_required: dto.miRequired, notes: dto.notes, assumptions: dto.assumptions, limitations: dto.limitations, complete: !!dto.complete, status: dto.complete ? 'Specification Complete' : 'Draft', updated_by: actorId, updated_at: now, ...(sifId ? {} : { created_by: actorId }) });
    const row = sifId ? await this.db.single<any>(this.db.from('lopa_sif_specifications').update(payload).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', sifId).select().single()) : await this.db.single<any>(this.db.from('lopa_sif_specifications').insert(payload).select().single());
    await this.markSilNeedsReassessment(tenantId, actorId, study, determination, sifId ? 'SIF specification updated' : 'SIF specification created');
    await this.writeHistory(tenantId, id, actorId, sifId ? 'SIF_UPDATED' : 'SIF_CREATED', sifId ? 'SIF specification updated' : 'SIF specification created', row.title, { sifId: row.id });
    await this.writeAudit(tenantId, actorId, sifId ? 'lopa.sif.edit' : 'lopa.sif.create', 'LOPA', id, row as JsonValue);
    await this.indexSilRecord(tenantId, study, determination, row);
    return row;
  }

  async deleteSifSpecification(tenantId: string, actorId: string, id: string, sifId: string, reason: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); if (!reason) throw new BadRequestException('Deletion reason is required.');
    const row = await this.db.single<any>(this.db.from('lopa_sif_specifications').update({ deleted_at: new Date().toISOString(), deleted_by: actorId, status: 'Superseded', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', sifId).select().single());
    await this.markSilNeedsReassessment(tenantId, actorId, study, { id: row.sil_determination_id }, `SIF ${row.sif_number ?? row.title} removed: ${reason}`);
    await this.writeHistory(tenantId, id, actorId, 'SIF_DELETED', 'SIF specification superseded', reason, { sifId } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.sif.delete', 'LOPA', id, row as JsonValue); return row;
  }

  async upsertSifComponent(tenantId: string, actorId: string, id: string, sifId: string, componentId: string | null, dto: UpsertLopaSifComponentDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); await this.assertSif(tenantId, id, sifId);
    if (!['Sensor','Logic Solver','Final Element','Auxiliary','Other'].includes(dto.componentType)) throw new BadRequestException('Invalid SIF component type.');
    const now = new Date().toISOString(); const payload = this.clean({ id: componentId ?? crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, sif_specification_id: sifId, component_type: dto.componentType, component_tag: dto.componentTag, component_name: dto.componentName, component_description: dto.componentDescription, equipment_id: dto.equipmentId, process_variable: dto.processVariable, range_text: dto.rangeText, setpoint: dto.setpoint, voting_group: dto.votingGroup, action_on_trip: dto.actionOnTrip, fail_position: dto.failPosition, response_time: dto.responseTime, diagnostics: dto.diagnostics, independence_notes: dto.independenceNotes, proof_test_requirement: dto.proofTestRequirement, document_id: dto.documentId, sort_order: dto.sortOrder ?? 0, updated_by: actorId, updated_at: now, ...(componentId ? {} : { created_by: actorId }) });
    const row = componentId ? await this.db.single<any>(this.db.from('lopa_sif_components').update(payload).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('sif_specification_id', sifId).eq('id', componentId).select().single()) : await this.db.single<any>(this.db.from('lopa_sif_components').insert(payload).select().single());
    await this.markSilNeedsReassessment(tenantId, actorId, study, await this.determinationFor(tenantId, id), `${dto.componentType} ${componentId ? 'updated' : 'added'}`);
    await this.writeHistory(tenantId, id, actorId, componentId ? 'SIF_COMPONENT_UPDATED' : 'SIF_COMPONENT_CREATED', `${dto.componentType} ${componentId ? 'updated' : 'added'}`, dto.componentTag ?? dto.componentName ?? dto.componentType, { sifId, componentId: row.id } as JsonValue); await this.writeAudit(tenantId, actorId, componentId ? 'lopa.sif.components.edit' : 'lopa.sif.components.create', 'LOPA', id, row as JsonValue); return row;
  }

  async deleteSifComponent(tenantId: string, actorId: string, id: string, sifId: string, componentId: string, reason: string | undefined, scope: Scope) { const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); const row = await this.db.single<any>(this.db.from('lopa_sif_components').update({ deleted_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('sif_specification_id', sifId).eq('id', componentId).select().single()); await this.markSilNeedsReassessment(tenantId, actorId, study, await this.determinationFor(tenantId, id), `${row.component_type} removed`); await this.writeHistory(tenantId, id, actorId, 'SIF_COMPONENT_DELETED', 'SIF component removed', reason ?? row.component_tag ?? row.component_type, { sifId, componentId } as JsonValue); return row; }

  async upsertSifArchitecture(tenantId: string, actorId: string, id: string, sifId: string, dto: UpsertLopaSifArchitectureDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); await this.assertSif(tenantId, id, sifId); const current = await this.optionalSingle(this.db.from('lopa_sif_architectures').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('sif_specification_id', sifId).single()); const now = new Date().toISOString();
    const payload = this.clean({ id: current?.id ?? crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, sif_specification_id: sifId, architecture_status: dto.architectureStatus, sensor_voting: dto.sensorVoting, logic_solver_architecture: dto.logicSolverArchitecture, final_element_voting: dto.finalElementVoting, overall_architecture: dto.overallArchitecture, redundancy_requirement: dto.redundancyRequirement, diagnostic_coverage_assumption: dto.diagnosticCoverageAssumption, common_cause_consideration: dto.commonCauseConsideration, beta_factor: dto.betaFactor, spurious_trip_concern: dto.spuriousTripConcern, independence_from_bpcs: dto.independenceFromBpcs, independence_from_initiating_event: dto.independenceFromInitiatingEvent, independence_from_other_ipls: dto.independenceFromOtherIpls, architecture_notes: dto.architectureNotes, architecture_document_id: dto.architectureDocumentId, updated_by: actorId, updated_at: now, ...(current ? {} : { created_by: actorId }) });
    const row = current ? await this.db.single<any>(this.db.from('lopa_sif_architectures').update(payload).eq('tenant_id', tenantId).eq('id', current.id).select().single()) : await this.db.single<any>(this.db.from('lopa_sif_architectures').insert(payload).select().single()); await this.markSilNeedsReassessment(tenantId, actorId, study, await this.determinationFor(tenantId, id), 'SIF architecture/voting updated'); await this.writeHistory(tenantId, id, actorId, 'SIF_ARCHITECTURE_UPDATED', 'SIF architecture and voting updated', dto.overallArchitecture ?? 'Architecture basis updated.', { sifId, architectureId: row.id } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.sif.architecture.manage', 'LOPA', id, row as JsonValue); return row;
  }

  async upsertSifProofTest(tenantId: string, actorId: string, id: string, sifId: string, dto: UpsertLopaSifProofTestDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); await this.assertSif(tenantId, id, sifId); const current = await this.optionalSingle(this.db.from('lopa_sif_proof_test_bypass').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('sif_specification_id', sifId).single()); const now = new Date().toISOString();
    const payload = this.clean({ id: current?.id ?? crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, sif_specification_id: sifId, proof_test_required: dto.proofTestRequired, proof_test_interval: dto.proofTestInterval, proof_test_procedure_document_id: dto.proofTestProcedureDocumentId, partial_stroke_test_required: dto.partialStrokeTestRequired, functional_test_required: dto.functionalTestRequired, last_proof_test_date: dto.lastProofTestDate, next_proof_test_due: dto.nextProofTestDue, proof_test_coverage_assumption: dto.proofTestCoverageAssumption, maintenance_basis: dto.maintenanceBasis, mi_program_id: dto.miProgramId, bypass_allowed: dto.bypassAllowed, bypass_approval_required: dto.bypassApprovalRequired, bypass_risk_assessment_required: dto.bypassRiskAssessmentRequired, maximum_bypass_duration: dto.maximumBypassDuration, bypass_log_reference: dto.bypassLogReference, override_management_notes: dto.overrideManagementNotes, inspection_maintenance_owner_id: dto.inspectionMaintenanceOwnerId, notes: dto.notes, updated_by: actorId, updated_at: now, ...(current ? {} : { created_by: actorId }) });
    const row = current ? await this.db.single<any>(this.db.from('lopa_sif_proof_test_bypass').update(payload).eq('tenant_id', tenantId).eq('id', current.id).select().single()) : await this.db.single<any>(this.db.from('lopa_sif_proof_test_bypass').insert(payload).select().single()); await this.markSilNeedsReassessment(tenantId, actorId, study, await this.determinationFor(tenantId, id), 'Proof-test/maintenance/bypass basis updated'); await this.writeHistory(tenantId, id, actorId, 'SIF_PROOF_TEST_UPDATED', 'SIF proof-test and bypass basis updated', dto.proofTestInterval ?? 'Proof-test basis updated.', { sifId, proofTestId: row.id } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.sif.proof_test.manage', 'LOPA', id, row as JsonValue); return row;
  }

  async generateIec61511Gaps(tenantId: string, actorId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); const determination = await this.determinationFor(tenantId, id); if (!determination) throw new BadRequestException('Determine SIL before generating IEC 61511 gaps.');
    const configured = await this.optionalMany('lopa_sil_iec61511_gap_templates', q => q.select('*').eq('tenant_id', tenantId).eq('company_id', study.company_id).eq('active', true));
    const templates = configured.length ? configured : this.iecGapBaseline(); const existing = await this.optionalMany('lopa_sil_iec61511_gaps', q => q.select('gap_key').eq('tenant_id', tenantId).eq('lopa_study_id', id)); const keys = new Set(existing.map((row: any) => row.gap_key ?? row.requirement_key));
    const rows = templates.filter((template: any) => !keys.has(template.gap_key)).map((template: any) => ({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, sil_determination_id: determination.id, gap_key: template.gap_key, gap_title: template.gap_title, gap_description: template.gap_description, requirement_key: template.gap_key, requirement_title: template.gap_title, required: template.required !== false, mandatory: template.required !== false, closure_blocker: template.blocking !== false, status: 'Incomplete', created_by: actorId, updated_by: actorId })); if (rows.length) await this.optionalMany('lopa_sil_iec61511_gaps', q => q.insert(rows).select()); await this.writeHistory(tenantId, id, actorId, 'IEC61511_GAPS_GENERATED', 'IEC 61511 lifecycle checklist generated', `${rows.length} configured lifecycle requirements added.`, { count: rows.length } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.iec61511_gaps.generate', 'LOPA', id, { count: rows.length } as JsonValue); return this.optionalMany('lopa_sil_iec61511_gaps', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at'));
  }

  async updateIec61511Gap(tenantId: string, actorId: string, id: string, gapId: string, dto: UpsertLopaSilGapDto, scope: Scope) { const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); const row = await this.db.single<any>(this.db.from('lopa_sil_iec61511_gaps').update(this.clean({ status: dto.status, required: dto.mandatory, mandatory: dto.mandatory, closure_blocker: dto.closureBlocker, finding: dto.finding, gap_description: dto.finding, evidence_reference: dto.evidenceReference, due_date: dto.dueDate, exception_reason: dto.exceptionReason, updated_by: actorId, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', gapId).select().single()); await this.writeHistory(tenantId, id, actorId, 'IEC61511_GAP_UPDATED', 'IEC 61511 gap updated', row.gap_title ?? row.requirement_title, { gapId, status: row.status } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.iec61511_gaps.manage', 'LOPA', id, row as JsonValue); return row; }

  async acceptIec61511Exception(tenantId: string, actorId: string, id: string, gapId: string, reason: string | undefined, scope: Scope) { const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); if (!reason) throw new BadRequestException('Exception reason is required.'); const row = await this.db.single<any>(this.db.from('lopa_sil_iec61511_gaps').update({ accepted_exception: true, exception_reason: reason, exception_approved_by: actorId, exception_approved_at: new Date().toISOString(), status: 'Warning', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', gapId).select().single()); await this.writeHistory(tenantId, id, actorId, 'IEC61511_GAP_EXCEPTION_ACCEPTED', 'IEC 61511 exception accepted', reason, { gapId } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.iec61511_gaps.accept_exception', 'LOPA', id, row as JsonValue); return row; }

  async createSilLink(tenantId: string, actorId: string, id: string, dto: UpsertLopaSilLinkDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); const determination = await this.determinationFor(tenantId, id); if (!determination) throw new BadRequestException('Determine SIL before linking SIF records.');
    const snapshot = await this.resolveSilLinkedRecord(tenantId, study, dto);
    const row = await this.db.single<any>(this.db.from('lopa_sif_record_links').insert(this.clean({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, sil_determination_id: determination.id, sif_specification_id: dto.sifSpecificationId, linked_record_type: dto.linkedRecordType, linked_record_id: dto.linkedRecordId, linked_record_number: snapshot.linkedRecordNumber, linked_record_title: snapshot.linkedRecordTitle, source_module: dto.sourceModule ?? dto.linkedRecordType, relationship_type: dto.relationship ?? 'SIF/SIL basis', required: !!dto.required, status_snapshot: snapshot.statusSnapshot, revision_snapshot: snapshot.revisionSnapshot, snapshot_json: snapshot.snapshotJson, linked_by: actorId, linked_at: new Date().toISOString(), restricted: !!snapshot.restricted })).select().single());
    await this.markSilNeedsReassessment(tenantId, actorId, study, determination, `${dto.linkedRecordType} link added`); await this.writeHistory(tenantId, id, actorId, 'SIF_RECORD_LINKED', `${dto.linkedRecordType} linked to SIL/SIF`, row.linked_record_title ?? row.linked_record_number ?? row.id, { linkId: row.id, recordId: dto.linkedRecordId } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.sil.links.manage', 'LOPA', id, row as JsonValue); return row;
  }

  async unlinkSilRecord(tenantId: string, actorId: string, id: string, linkId: string, reason: string | undefined, scope: Scope) { const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); if (!reason) throw new BadRequestException('Unlink reason is required.'); const row = await this.db.single<any>(this.db.from('lopa_sif_record_links').update({ unlinked_by: actorId, unlinked_at: new Date().toISOString(), unlink_reason: reason }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', linkId).select().single()); await this.markSilNeedsReassessment(tenantId, actorId, study, await this.determinationFor(tenantId, id), `${row.linked_record_type} evidence unlinked`); await this.writeHistory(tenantId, id, actorId, 'SIF_RECORD_UNLINKED', 'SIF/SIL linked record removed', reason, { linkId } as JsonValue); return row; }

  async createSilAction(tenantId: string, actorId: string, id: string, dto: CreateLopaSilActionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); const determination = await this.determinationFor(tenantId, id); if (!determination) throw new BadRequestException('Determine SIL before creating an SIL/SIF action.');
    const action = await this.actionsEngine.create(tenantId, actorId, { title: dto.title, description: dto.description, sourceModule: 'LOPA', sourceRecordId: id, sourceType: dto.sourceType ?? 'SIL/SIF', ownerId: dto.ownerId, priority: dto.priority, dueDate: dto.dueDate, siteId: study.site_id, evidenceRequired: true, verificationRequired: true });
    const link = await this.db.single<any>(this.db.from('lopa_sil_actions').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, sil_determination_id: determination.id, sif_specification_id: dto.sifSpecificationId ?? null, action_id: action.id, title: action.title, status: action.status, source_type: dto.sourceType ?? 'SIL/SIF', source_record_id: dto.sourceRecordId ?? null, blocking: dto.blocking !== false, closure_blocker: dto.blocking !== false, linked_by: actorId, linked_at: new Date().toISOString(), created_by: actorId }).select().single());
    await this.writeHistory(tenantId, id, actorId, 'SIL_ACTION_CREATED', 'Universal Action created for SIL/SIF', action.title, { actionId: action.id, actionLinkId: link.id } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.sil.actions.manage', 'LOPA', id, { action, link } as unknown as JsonValue); return { action, link };
  }

  async linkExistingSilAction(tenantId: string, actorId: string, id: string, actionId: string, dto: LopaSilActionDto, scope: Scope) { const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); const determination = await this.determinationFor(tenantId, id); const action = await this.actionsEngine.get(tenantId, actionId, scope.allowedSiteIds ?? []); const existing = await this.optionalSingle(this.db.from('lopa_sil_actions').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('action_id', actionId).is('unlinked_at', null).single()); if (existing) return existing; const row = await this.db.single<any>(this.db.from('lopa_sil_actions').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, sil_determination_id: determination?.id ?? null, action_id: action.id, title: action.title, status: action.status, source_type: dto.status ?? 'Linked existing action', blocking: true, closure_blocker: true, linked_by: actorId, linked_at: new Date().toISOString(), created_by: actorId }).select().single()); await this.writeHistory(tenantId, id, actorId, 'SIL_ACTION_LINKED', 'Existing Universal Action linked', action.title, { actionId, actionLinkId: row.id } as JsonValue); return row; }

  async unlinkSilAction(tenantId: string, actorId: string, id: string, actionLinkId: string, reason: string | undefined, scope: Scope) { const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); if (!reason) throw new BadRequestException('Unlink reason is required.'); const row = await this.db.single<any>(this.db.from('lopa_sil_actions').update({ unlinked_by: actorId, unlinked_at: new Date().toISOString(), unlink_reason: reason }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', actionLinkId).select().single()); await this.writeHistory(tenantId, id, actorId, 'SIL_ACTION_UNLINKED', 'Universal Action unlinked from SIL/SIF', reason, { actionLinkId, actionId: row.action_id } as JsonValue); return row; }

  async compareSilSnapshot(tenantId: string, id: string, snapshotId: string, scope: Scope) { const tab = await this.silDeterminationTab(tenantId, id, scope); const snapshot = tab.snapshots.find((row: any) => row.id === snapshotId); if (!snapshot) throw new NotFoundException('SIL snapshot not found.'); const current = this.silSnapshotPayload(tab.header, tab.determination, tab.riskCalculation, tab.sifs, tab.components, tab.architectures, tab.proofTests, tab.gaps, tab.links, tab.actions); const previous = snapshot.snapshot_json ?? {}; return { snapshot, current, changed: JSON.stringify(previous) !== JSON.stringify(current), differences: this.objectDiff(previous, current) }; }

  async checkSilReassessment(tenantId: string, actorId: string, id: string, scope: Scope) { const tab = await this.silDeterminationTab(tenantId, id, scope); const changed = !!tab.determination?.dependency_hash && tab.determination.dependency_hash !== this.silDependencyHash(tab.riskCalculation, { creditedIpls: tab.riskCalculation?.creditedIpls ?? [] }, tab.sifs, tab.components, tab.links); if (changed) await this.markSilNeedsReassessment(tenantId, actorId, await this.studyRecord(tenantId, id, scope), tab.determination, 'SIL dependency comparison detected changed source data'); return { needsReassessment: changed || tab.reassessments.length > 0, events: tab.reassessments }; }

  async lockSilDetermination(tenantId: string, actorId: string, id: string, dto: LopaSilActionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study);
    const tab = await this.silDeterminationTab(tenantId, id, scope);
    if (tab.readiness.blockers.length) throw new BadRequestException({ message: 'SIL determination cannot be locked while blockers are open.', blockers: tab.readiness.blockers });
    if (!tab.determination) throw new BadRequestException('No SIL determination exists to lock.');
    const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('lopa_sil_determinations').update({ locked: true, locked_by: actorId, locked_at: now, status: 'Locked', updated_at: now }).eq('tenant_id', tenantId).eq('id', tab.determination.id).select().single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ sil_determination_status: 'Locked', sil_locked: true, sil_needs_reassessment: false, updated_at: now, updated_by: actorId }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.recordSilSnapshot(tenantId, actorId, study, row, tab.riskCalculation, 'Locked');
    await this.writeHistory(tenantId, id, actorId, 'SIL_DETERMINATION_LOCKED', 'SIL basis locked', dto.reason ?? 'Locked after readiness passed.', { determinationId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.sil.lock', 'LOPA', id, { determinationId: row.id } as JsonValue);
    return row;
  }

  async unlockSilDetermination(tenantId: string, actorId: string, id: string, dto: LopaSilActionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); const row = await this.optionalSingle(this.db.from('lopa_sil_determinations').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).single());
    if (!row) throw new NotFoundException('SIL determination not found.');
    const now = new Date().toISOString();
    const updated = await this.db.single<any>(this.db.from('lopa_sil_determinations').update({ locked: false, locked_by: null, locked_at: null, status: 'Needs Reassessment', updated_at: now }).eq('tenant_id', tenantId).eq('id', row.id).select().single());
    await this.markSilNeedsReassessment(tenantId, actorId, study, updated, dto.reason ?? 'SIL determination unlocked');
    await this.writeHistory(tenantId, id, actorId, 'SIL_DETERMINATION_UNLOCKED', 'SIL basis unlocked', dto.reason ?? 'SIL determination requires reassessment.', { determinationId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.sil.unlock', 'LOPA', id, { determinationId: row.id, reason: dto.reason } as JsonValue);
    return updated;
  }

  async finalReportTab(tenantId: string, id: string, query: LopaFinalReportFilterDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [summary, readiness, templates, sections, register, packages, appendices, redaction, exportHistory, distribution, snapshots] = await Promise.all([
      this.finalReportSummaryData(tenantId, id, scope),
      this.finalReportReadiness(tenantId, id, scope),
      this.finalReportTemplates(tenantId, id, scope),
      this.finalReportSections(tenantId, id, scope),
      this.finalReportRegister(tenantId, id, query, scope),
      this.finalReportPackages(tenantId, id, scope),
      this.finalReportAppendices(tenantId, id, scope),
      this.finalReportRedactionPreview(tenantId, id, scope),
      this.finalReportExportHistory(tenantId, id, scope),
      this.finalReportDistribution(tenantId, id, scope),
      this.finalReportSourceSnapshots(tenantId, id, scope)
    ]);
    const latest = register.rows[0] ?? null;
    return {
      readOnly: this.isReadOnly(study),
      header: {
        title: 'Final Report / Export',
        subtitle: 'Generate audit-ready LOPA/SIL reports, appendices, and approved report packages',
        lopaNumber: study.lopa_number,
        studyTitle: study.title,
        studyStatus: study.status,
        reportReadinessStatus: readiness.status,
        reviewStatus: study.review_status ?? study.review_readiness_status ?? 'Not Started',
        approvalStatus: study.approval_status ?? 'Not Started',
        signatureStatus: study.signature_status ?? 'Not Started',
        officialReportStatus: latest?.official ? 'Official' : study.final_report_status ?? 'Not Started',
        latestReportVersion: latest?.report_version ?? null,
        latestGeneratedAt: latest?.generated_at ?? null,
        latestGeneratedBy: latest?.generated_by ?? null,
        lastUpdatedAt: study.updated_at
      },
      summary,
      readiness,
      templates,
      sections,
      preview: await this.previewFinalReportPayload(tenantId, id, scope, {}),
      register,
      packages,
      appendices,
      redaction,
      exportHistory,
      distribution,
      snapshots,
      context: await this.finalReportContext(tenantId, id, scope)
    };
  }

  async finalReportSummaryData(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [reports, exports, packages, readiness, attachments, history, linkedRecords, actions] = await Promise.all([
      this.optionalMany('lopa_report_generations', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      this.optionalMany('lopa_report_exports', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      this.optionalMany('lopa_report_packages', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      this.finalReportReadiness(tenantId, id, scope),
      this.optionalMany('lopa_attachments', q => q.select('id,status,required_evidence,archived_at,deleted_at,access_level,classification,restricted').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      this.optionalMany('lopa_history_events', q => q.select('id').eq('tenant_id', tenantId).eq('lopa_study_id', id).limit(1)),
      this.optionalMany('lopa_linked_records', q => q.select('id,status,required,blocking,unlinked_at').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      this.optionalMany('Action', q => q.select('id,status,recordId,tenantId').eq('tenantId', tenantId).eq('recordId', id))
    ]);
    const official = reports.filter((r: any) => r.official && !r.archived_at);
    const missingEvidence = attachments.filter((a: any) => a.required_evidence && !['Active', 'Approved'].includes(a.status) && !a.archived_at && !a.deleted_at);
    return {
      reportReadinessStatus: readiness.status,
      reviewSignoffStatus: study.review_status ?? study.review_readiness_status ?? 'Not Started',
      approvalStatus: study.approval_status ?? 'Not Started',
      signatureStatus: study.signature_status ?? 'Not Started',
      finalReportGenerated: reports.some((r: any) => ['Generated', 'Official', 'Published'].includes(r.status)),
      officialReportPublished: official.some((r: any) => r.published),
      latestReportVersion: Math.max(0, ...reports.map((r: any) => Number(r.report_version ?? 0))),
      draftReports: reports.filter((r: any) => r.status === 'Draft').length,
      officialReports: official.length,
      supersededReports: reports.filter((r: any) => r.status === 'Superseded' || r.superseded_by_report_id).length,
      failedExports: exports.filter((e: any) => e.status === 'Failed').length,
      missingRequiredSections: readiness.checklist.filter((c: any) => c.section && c.status === 'Blocked').length,
      missingRequiredEvidence: missingEvidence.length,
      openBlockers: readiness.blockers.length,
      openActions: actions.filter((a: any) => !this.isActionClosed(a)).length,
      calculationSnapshotStatus: study.calculation_status ?? 'Not Started',
      silSnapshotStatus: study.sil_determination_status ?? study.sil_gap_status ?? 'Not Started',
      attachmentIndexStatus: attachments.length ? 'Ready' : 'Missing',
      historyTrailStatus: history.length ? 'Ready' : 'Missing',
      linkedRecordsStatus: linkedRecords.some((r: any) => r.required && r.blocking && !r.unlinked_at && r.status !== 'Resolved') ? 'Blocked' : 'Ready',
      teamSessionReadiness: study.team_readiness_status ?? 'Not Started',
      reportPackageComplete: packages.some((p: any) => p.status === 'Generated')
    };
  }

  async finalReportReadiness(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [risk, silRows, recReadiness, teamData, linkedRows, reviewData, attachmentsData, templates, historyRows, reports] = await Promise.all([
      this.latestRiskCalculation(tenantId, id),
      this.optionalMany('lopa_sil_determinations', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }).limit(1)),
      this.recommendationsReadiness(tenantId, id, scope).catch(() => null),
      this.teamSessionsTab(tenantId, id, {}, scope).catch(() => null),
      this.optionalMany('lopa_linked_records', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null)),
      this.reviewSignoffTab(tenantId, id, scope).catch(() => null),
      this.attachmentsTab(tenantId, id, {}, scope).catch(() => null),
      this.finalReportTemplates(tenantId, id, scope),
      this.optionalMany('lopa_history_events', q => q.select('id').eq('tenant_id', tenantId).eq('lopa_study_id', id).limit(1)),
      this.optionalMany('lopa_report_generations', q => q.select('id,official').eq('tenant_id', tenantId).eq('lopa_study_id', id))
    ]);
    const reviewSummary = (reviewData as any)?.summary ?? {};
    const reviewComplete = ['Approved', 'Closed', 'Review Complete'].includes(reviewSummary.reviewStatus ?? study.review_status ?? '');
    const eSignComplete = ['Complete', 'Signed', 'Approved'].includes(reviewSummary.signatureStatus ?? study.signature_status ?? '');
    const linkedBlocked = linkedRows.some((r: any) => r.blocking && !['Resolved', 'Closed', 'Complete'].includes(r.status));
    const attachmentReady = ['Ready', 'Complete', 'Warning'].includes(attachmentsData?.readiness?.status ?? '');
    const checks = [
      this.check('study_metadata', 'Study metadata complete', !!study.title && !!study.site_id, 'Blocked', 'overview'),
      this.check('scenario_consequence', 'Scenario & Consequence complete', !!study.consequence_description || !!study.consequence_severity, 'Blocked', 'scenario'),
      this.check('initiating_event', 'Initiating Event complete', !!study.initiating_event_frequency || !!study.initiating_event_description, 'Blocked', 'initiating-event'),
      this.check('conditional_modifiers', 'Conditional Modifiers complete if required', true, 'Not Applicable', 'risk-calculation'),
      this.check('ipls_safeguards', 'IPLs / Safeguards validation complete', !['Not Started', 'Incomplete', 'Needs Review', 'Failed'].includes(study.ipl_validation_status), 'Blocked', 'ipls'),
      this.check('risk_calculation', 'Risk Calculation complete', !!risk && ['Calculated', 'Locked', 'Complete'].includes(risk.calculation_status), 'Blocked', 'risk-calculation'),
      this.check('calculation_current', 'Calculation status not Needs Recalculation', study.calculation_status !== 'Needs Recalculation' && risk?.calculation_status !== 'Needs Recalculation', 'Blocked', 'risk-calculation'),
      this.check('sil', 'SIL Determination / SIF Specification complete if required', !study.sil_required || !!silRows[0], 'Blocked', 'sil'),
      this.check('recommendations', 'Recommendations / Actions readiness complete', !recReadiness || !['Blocked', 'Not Ready'].includes(recReadiness.status), 'Blocked', 'actions'),
      this.check('blocking_actions', 'Blocking actions resolved or accepted', !recReadiness?.blockers?.length, 'Blocked', 'actions'),
      this.check('team_sessions', 'Team & Sessions readiness complete', !teamData || !['Blocked', 'Not Ready'].includes(teamData.readiness?.status), 'Blocked', 'team-sessions'),
      this.check('linked_records', 'Linked Records readiness complete', !linkedBlocked, 'Blocked', 'linked-records'),
      this.check('review_signoff', 'Review & Sign-Off complete if final/official report', reviewComplete || !['Approved', 'Closed'].includes(study.status), 'Blocked', 'review'),
      this.check('esignatures', 'Required e-signatures complete if final/official report', eSignComplete || !['Approved', 'Closed'].includes(study.status), 'Blocked', 'review'),
      this.check('attachments', 'Required attachments/evidence complete', attachmentReady, 'Blocked', 'attachments'),
      this.check('attachment_index', 'Attachment index ready', !!attachmentsData, 'Blocked', 'attachments'),
      this.check('history', 'History/audit trail ready', historyRows.length > 0, 'Blocked', 'history'),
      this.check('approval_snapshot', 'Approval snapshot available if approved report', !['Approved', 'Closed'].includes(study.status) || !!reviewData?.snapshots?.length || reports.some((r: any) => r.official), 'Blocked', 'review'),
      this.check('template', 'Required report template available', templates.length > 0, 'Blocked', 'final-report'),
      this.check('export_service', 'Export service available', !!this.storage, 'Blocked', 'final-report'),
      this.check('permission', 'User has permission to generate/export', true, 'Complete', 'final-report'),
      this.check('restricted_content', 'No restricted inaccessible required content for report scope', !(attachmentsData?.summary?.restricted ?? 0), 'Warning', 'attachments')
    ];
    const readiness = this.readinessFromChecks(checks);
    const status = readiness.blockers.length ? 'Blocked' : readiness.warnings.length ? 'Warning' : 'Ready';
    await this.optionalSingle(this.db.from('lopa_studies').update({ report_readiness_status: status }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    return { ...readiness, status, blockers: readiness.blockers.map((b: any) => ({ ...b, blockerType: b.title, relatedTab: checks.find(c => c.key === b.key)?.tab ?? 'final-report' })) };
  }

  async finalReportTemplates(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    let rows = await this.optionalMany('lopa_report_templates', q => q.select('*').eq('tenant_id', tenantId).eq('active', true).order('default_template', { ascending: false }).order('template_name'));
    rows = rows.filter((row: any) => !row.site_id || row.site_id === study.site_id);
    return rows.length ? rows : this.defaultReportTemplates(study);
  }

  async finalReportSections(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const stored = await this.optionalMany('lopa_report_sections', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('report_generation_id', null).order('sort_order'));
    return stored.length ? stored : this.defaultReportSections(study).map((section, index) => ({ ...section, id: `system-${section.section_key}`, tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, sort_order: index + 1 }));
  }

  async updateFinalReportSections(tenantId: string, actorId: string, id: string, dto: LopaReportSectionsDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const base = await this.finalReportSections(tenantId, id, scope);
    const byKey = new Map((dto.sections ?? []).map((row) => [row.sectionKey, row]));
    const rows = await Promise.all(base.map((section: any, index: number) => {
      const patch = byKey.get(section.section_key);
      if (section.required && patch?.included === false && !dto.reason && !patch.reason) throw new BadRequestException(`A reason is required to exclude required section: ${section.section_title}`);
      const payload = this.clean({ id: section.id?.startsWith('system-') ? crypto.randomUUID() : section.id, tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, section_key: section.section_key, section_title: section.section_title, source_module: section.source_module, required: section.required, included: patch?.included ?? section.included, status: section.status, missing_data_count: section.missing_data_count ?? 0, restricted_data_count: section.restricted_data_count ?? 0, sort_order: section.sort_order ?? index + 1, config_json: patch?.config ?? section.config_json, created_by: section.created_by ?? actorId, updated_by: actorId, updated_at: new Date().toISOString() });
      return this.optionalSingle(this.db.from('lopa_report_sections').upsert(payload, { onConflict: 'tenant_id,lopa_study_id,report_generation_id,section_key' }).select().single());
    }));
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_SECTIONS_UPDATED', 'Final report sections updated', dto.reason ?? 'Report section builder changed.', { count: rows.length });
    await this.writeAudit(tenantId, actorId, 'lopa.final_report.sections.manage', 'LOPA', id, this.clean({ count: rows.length, reason: dto.reason }) as unknown as JsonValue);
    return rows.filter(Boolean);
  }

  async previewFinalReport(tenantId: string, actorId: string, id: string, dto: LopaReportGenerateDto, scope: Scope) {
    const preview = await this.previewFinalReportPayload(tenantId, id, scope, dto);
    await this.recordReportExport(tenantId, actorId, id, null, null, 'Preview', 'HTML', 'Complete', preview);
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_PREVIEW_GENERATED', 'Final report preview generated', preview.watermark, this.clean({ templateId: dto.templateId, redacted: dto.redacted }) as unknown as JsonValue);
    await this.writeAudit(tenantId, actorId, 'lopa.final_report.preview', 'LOPA', id, preview as unknown as JsonValue);
    return preview;
  }

  async generateFinalReport(tenantId: string, actorId: string, id: string, dto: LopaReportGenerateDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const readiness = await this.finalReportReadiness(tenantId, id, scope);
    if (dto.official && readiness.status === 'Blocked') throw new BadRequestException(`Official report blocked: ${readiness.blockers.map((b: any) => b.title).join('; ')}`);
    const templates = await this.finalReportTemplates(tenantId, id, scope);
    const template = templates.find((row: any) => row.id === dto.templateId) ?? templates.find((row: any) => row.default_template) ?? templates[0];
    if (!template) throw new BadRequestException('No final report template is available.');
    const snapshot = await this.createFinalReportSourceSnapshot(tenantId, actorId, id, scope);
    const existing = await this.optionalMany('lopa_report_generations', q => q.select('report_version').eq('tenant_id', tenantId).eq('lopa_study_id', id));
    const version = Math.max(0, ...existing.map((row: any) => Number(row.report_version ?? 0))) + 1;
    const format = dto.outputFormat ?? 'PDF';
    const fileName = dto.fileName ?? `${study.lopa_number}-LOPA-Final-Report-v${version}.${format.toLowerCase() === 'pdf' ? 'pdf' : format.toLowerCase()}`;
    const content = await this.renderFinalReportArtifact(tenantId, id, scope, dto, snapshot, template);
    const buffer = format.toUpperCase() === 'PDF' ? this.minimalPdfBuffer(content.title, content.lines) : Buffer.from(content.lines.join('\n'), 'utf8');
    const storageKey = this.storage.buildObjectKey(tenantId, 'lopa-final-reports', fileName);
    await this.storage.putObject(storageKey, buffer);
    const row = await this.db.single<any>(this.db.from('lopa_report_generations').insert(this.clean({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, report_number: await this.nextReportNumber(tenantId, id), report_title: dto.reportType ?? 'LOPA/SIL Final Report', report_type: dto.reportType ?? 'Final Report', template_id: template.id?.startsWith('system-') ? null : template.id, template_name_snapshot: template.template_name, template_version_snapshot: template.template_version, report_version: version, status: dto.official ? 'Generated' : 'Draft', output_format: format, file_name: fileName, file_size: buffer.length, storage_provider: 'local', storage_key: storageKey, file_hash: this.stableHash({ storageKey, bytes: buffer.length, snapshot: snapshot.id }), classification: dto.classification ?? 'Internal', official: false, published: false, source_snapshot_id: snapshot.id, generation_options_json: dto as unknown as JsonValue, redaction_summary_json: content.redactionSummary as JsonValue, generated_by: actorId, generated_at: new Date().toISOString() })).select().single());
    await this.recordReportExport(tenantId, actorId, id, row.id, null, dto.official ? 'Official Report' : 'Draft Report', format, 'Complete', { fileName, bytes: buffer.length });
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_GENERATED', 'Final report generated', `${row.report_number} generated as ${format}.`, { reportId: row.id, version });
    await this.writeAudit(tenantId, actorId, 'lopa.final_report.generate', 'LOPA_REPORT', row.id, row as JsonValue);
    await this.optionalSingle(this.db.from('lopa_studies').update({ final_report_status: dto.official ? 'Generated' : 'Draft Generated' }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    return row;
  }

  async generateFinalReportPackage(tenantId: string, actorId: string, id: string, dto: LopaReportPackageDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const reports = await this.optionalMany('lopa_report_generations', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('archived_at', null).order('generated_at', { ascending: false }).limit(10));
    const appendices = await this.finalReportAppendices(tenantId, id, scope);
    const versionRows = await this.optionalMany('lopa_report_packages', q => q.select('package_version').eq('tenant_id', tenantId).eq('lopa_study_id', id));
    const version = Math.max(0, ...versionRows.map((row: any) => Number(row.package_version ?? 0))) + 1;
    const manifest = { reports: reports.map((row: any) => ({ id: row.id, title: row.report_title, format: row.output_format })), appendices: dto.includedAppendices ?? appendices.map((row: any) => row.key), attachments: dto.attachmentIds ?? [], generatedAt: new Date().toISOString(), classification: dto.classification ?? 'Internal' };
    const packageName = dto.packageName ?? `${study.lopa_number} Final Report Package`;
    const fileName = `${study.lopa_number}-report-package-v${version}.txt`;
    const buffer = Buffer.from(`LOPA Final Report Package\n${packageName}\n\n${JSON.stringify(manifest, null, 2)}`, 'utf8');
    const storageKey = this.storage.buildObjectKey(tenantId, 'lopa-final-report-packages', fileName);
    await this.storage.putObject(storageKey, buffer);
    const pkg = await this.db.single<any>(this.db.from('lopa_report_packages').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, package_number: await this.nextPackageNumber(tenantId, id), package_name: packageName, package_version: version, status: 'Generated', storage_provider: 'local', storage_key: storageKey, file_size: buffer.length, file_hash: this.stableHash(manifest), classification: dto.classification ?? 'Internal', manifest_json: manifest, generated_by: actorId, generated_at: new Date().toISOString() }).select().single());
    if (reports.length) await this.optionalMany('lopa_report_package_items', q => q.insert(reports.map((report: any, index: number) => ({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, package_id: pkg.id, item_type: 'Report', item_title: report.report_title, report_generation_id: report.id, included: true, redacted: !!dto.redacted, sort_order: index + 1 }))).select());
    await this.recordReportExport(tenantId, actorId, id, null, pkg.id, 'Report Package', 'ZIP', 'Complete', manifest);
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_PACKAGE_GENERATED', 'Final report package generated', packageName, { packageId: pkg.id, version });
    await this.writeAudit(tenantId, actorId, 'lopa.final_report.generate_package', 'LOPA_REPORT_PACKAGE', pkg.id, pkg as JsonValue);
    return this.finalReportPackageDetail(tenantId, id, pkg.id, scope);
  }

  async finalReportRegister(tenantId: string, id: string, query: LopaFinalReportFilterDto, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    let rows = await this.optionalMany('lopa_report_generations', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('generated_at', { ascending: false }));
    rows = rows.filter((row: any) => this.finalReportMatches(row, query));
    rows.sort(this.sorter(query.sort ?? 'generated_at.desc'));
    const page = Math.max(Number(query.page ?? 1), 1), limit = Math.min(Math.max(Number(query.limit ?? 10), 1), 100);
    return { rows: rows.slice((page - 1) * limit, page * limit), total: rows.length, page, limit };
  }

  async finalReportDetail(tenantId: string, id: string, reportId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const report = await this.db.single<any>(this.db.from('lopa_report_generations').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', reportId).single());
    const [versions, exports, snapshot] = await Promise.all([
      this.optionalMany('lopa_report_generations', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('report_version', { ascending: false })),
      this.optionalMany('lopa_report_exports', q => q.select('*').eq('tenant_id', tenantId).eq('report_generation_id', reportId).order('requested_at', { ascending: false })),
      report.source_snapshot_id ? this.optionalSingle(this.db.from('lopa_report_source_snapshots').select('*').eq('tenant_id', tenantId).eq('id', report.source_snapshot_id).single()) : null
    ]);
    return { ...report, versions, exports, sourceSnapshot: snapshot, readOnly: !!report.official || ['Official', 'Published', 'Superseded'].includes(report.status) };
  }

  async finalReportPreviewById(tenantId: string, id: string, reportId: string, scope: Scope) {
    const detail = await this.finalReportDetail(tenantId, id, reportId, scope);
    return { title: detail.report_title, reportNumber: detail.report_number, status: detail.status, fileName: detail.file_name, sourceSnapshot: detail.sourceSnapshot, previewAvailable: true, redactionSummary: detail.redaction_summary_json };
  }

  async downloadFinalReport(tenantId: string, actorId: string, id: string, reportId: string, scope: Scope) {
    const detail = await this.finalReportDetail(tenantId, id, reportId, scope);
    if (!detail.storage_key) throw new NotFoundException('Generated report file was not found in storage.');
    const buffer = await this.storage.getObject(detail.storage_key);
    await this.recordReportExport(tenantId, actorId, id, reportId, null, 'Download', detail.output_format, 'Complete', { fileName: detail.file_name });
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_DOWNLOADED', 'Final report downloaded', detail.file_name, { reportId });
    return { fileName: detail.file_name ?? `${detail.report_number}.pdf`, mimeType: this.reportMimeType(detail.output_format), buffer };
  }

  async markFinalReportOfficial(tenantId: string, actorId: string, id: string, reportId: string, reason: string | undefined, scope: Scope) {
    if (!reason) throw new BadRequestException('Reason is required to mark an official report.');
    const readiness = await this.finalReportReadiness(tenantId, id, scope);
    if (readiness.status === 'Blocked') throw new BadRequestException(`Cannot mark official while blockers are open: ${readiness.blockers.map((b: any) => b.title).join('; ')}`);
    const previous = await this.optionalMany('lopa_report_generations', q => q.select('id').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('official', true).is('archived_at', null));
    const now = new Date().toISOString();
    for (const row of previous.filter((row: any) => row.id !== reportId)) await this.optionalSingle(this.db.from('lopa_report_generations').update({ status: 'Superseded', official: false, superseded_by_report_id: reportId, updated_at: now }).eq('tenant_id', tenantId).eq('id', row.id).select('id').single());
    const report = await this.db.single<any>(this.db.from('lopa_report_generations').update({ status: 'Official', official: true, updated_at: now }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', reportId).select().single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ final_report_status: 'Official', official_report_id: reportId }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_MARKED_OFFICIAL', 'Final report marked official', reason, { reportId });
    await this.writeAudit(tenantId, actorId, 'lopa.final_report.mark_official', 'LOPA_REPORT', reportId, { reason, report } as unknown as JsonValue);
    return report;
  }

  async publishFinalReport(tenantId: string, actorId: string, id: string, reportId: string, dto: LopaReportPublishDto, scope: Scope) {
    const report = await this.finalReportDetail(tenantId, id, reportId, scope);
    if (!report.official) throw new BadRequestException('Only an official report can be published to Document Control.');
    const documentNumber = dto.documentNumber ?? `DOC-${report.report_number}`;
    const updated = await this.db.single<any>(this.db.from('lopa_report_generations').update({ status: 'Published', published: true, document_id: report.document_id ?? crypto.randomUUID(), document_number_snapshot: documentNumber, classification: dto.classification ?? report.classification, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', reportId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_PUBLISHED_DOCUMENT_CONTROL', 'Final report published to Document Control', dto.reason ?? documentNumber, { reportId, documentNumber });
    await this.writeAudit(tenantId, actorId, 'lopa.final_report.publish_document_control', 'LOPA_REPORT', reportId, updated as JsonValue);
    return updated;
  }

  async supersedeFinalReport(tenantId: string, actorId: string, id: string, reportId: string, reason: string | undefined, scope: Scope) {
    if (!reason) throw new BadRequestException('Reason is required to supersede a report.');
    const row = await this.db.single<any>(this.db.from('lopa_report_generations').update({ status: 'Superseded', official: false, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', reportId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_SUPERSEDED', 'Final report superseded', reason, { reportId });
    await this.writeAudit(tenantId, actorId, 'lopa.final_report.supersede', 'LOPA_REPORT', reportId, { reason, row } as JsonValue);
    return row;
  }

  async archiveFinalReport(tenantId: string, actorId: string, id: string, reportId: string, reason: string | undefined, scope: Scope) {
    const row = await this.db.single<any>(this.db.from('lopa_report_generations').update({ status: 'Archived', archived_by: actorId, archived_at: new Date().toISOString(), archive_reason: reason, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', reportId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_ARCHIVED', 'Final report archived', reason ?? row.report_title, { reportId });
    await this.writeAudit(tenantId, actorId, 'lopa.final_report.archive', 'LOPA_REPORT', reportId, row as JsonValue);
    return row;
  }

  async restoreFinalReport(tenantId: string, actorId: string, id: string, reportId: string, reason: string | undefined, scope: Scope) {
    const row = await this.db.single<any>(this.db.from('lopa_report_generations').update({ status: 'Generated', archived_by: null, archived_at: null, archive_reason: null, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', reportId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_RESTORED', 'Final report restored', reason ?? row.report_title, { reportId });
    await this.writeAudit(tenantId, actorId, 'lopa.final_report.restore', 'LOPA_REPORT', reportId, row as JsonValue);
    return row;
  }

  async finalReportSourceSnapshots(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.optionalMany('lopa_report_source_snapshots', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }));
  }

  async createFinalReportSourceSnapshot(tenantId: string, actorId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [detail, risk, sil, recommendations, team, linked, attachments, history, reviewSnapshots] = await Promise.all([
      this.get(tenantId, id, scope).catch(() => null),
      this.latestRiskCalculation(tenantId, id),
      this.optionalMany('lopa_sil_determinations', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }).limit(1)),
      this.optionalMany('lopa_recommendations', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('deleted_at', null)),
      this.optionalMany('lopa_study_team_members', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('removed_at', null)),
      this.optionalMany('lopa_linked_records', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null)),
      this.optionalMany('lopa_attachments', q => q.select('id,attachment_number,file_name,status,classification,required_evidence').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      this.optionalMany('lopa_history_events', q => q.select('id,event_number,event_type,created_at').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }).limit(50)),
      this.optionalMany('lopa_review_approval_snapshots', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('snapshot_version', { ascending: false }).limit(1))
    ]);
    const existing = await this.optionalMany('lopa_report_source_snapshots', q => q.select('snapshot_version').eq('tenant_id', tenantId).eq('lopa_study_id', id));
    const data = { study, detail, riskCalculation: risk, sil: sil[0] ?? null, recommendations, team, linkedRecords: linked, attachments, history, approvalSnapshot: reviewSnapshots[0] ?? null, capturedAt: new Date().toISOString() };
    const row = await this.db.single<any>(this.db.from('lopa_report_source_snapshots').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, snapshot_version: existing.length + 1, snapshot_status: 'Active', study_status_snapshot: study.status, approval_snapshot_id: reviewSnapshots[0]?.id ?? null, calculation_version_id: risk?.id ?? null, sil_snapshot_id: sil[0]?.id ?? null, review_workflow_id: reviewSnapshots[0]?.workflow_id ?? null, data_snapshot_json: data as unknown as JsonValue, snapshot_hash: this.stableHash(data), created_by: actorId }).select().single());
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_SOURCE_SNAPSHOT_CREATED', 'Final report source snapshot created', `Snapshot v${row.snapshot_version} captured.`, { snapshotId: row.id });
    return row;
  }

  async finalReportSourceSnapshotDetail(tenantId: string, id: string, snapshotId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.db.single<any>(this.db.from('lopa_report_source_snapshots').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', snapshotId).single());
  }

  async finalReportAppendices(tenantId: string, id: string, scope: Scope) {
    const sections = await this.finalReportSections(tenantId, id, scope);
    const rows: Array<[string, string, string]> = [
      ['ipl-validation', 'Full IPL validation checklist', 'IPLs / Safeguards'],
      ['calculation-tables', 'Calculation input/output tables', 'Risk Calculation'],
      ['sensitivity', 'Sensitivity/uncertainty appendix', 'Risk Calculation'],
      ['sif-components', 'SIF component appendix', 'SIL Determination / SIF Specification'],
      ['iec61511', 'IEC 61511 gap checklist', 'SIL Determination / SIF Specification'],
      ['recommendations', 'Recommendations/action details', 'Recommendations / Actions'],
      ['team-minutes', 'Team attendance/minutes summary', 'Team & Sessions'],
      ['linked-records', 'Linked records register', 'Linked Records'],
      ['attachments', 'Attachment index', 'Attachments'],
      ['history', 'Full history export', 'History'],
      ['approval-snapshot', 'Approval snapshot', 'Review & Sign-Off'],
      ['signature-certificates', 'Signature certificates/references', 'Review & Sign-Off']
    ];
    return rows.map(([key, title, source]) => ({ key, title, sourceModule: source, included: sections.some((s: any) => s.section_key === key || s.source_module === source), status: 'Available' }));
  }

  async previewFinalReportAppendix(tenantId: string, actorId: string, id: string, appendixKey: string, scope: Scope) {
    const appendix = (await this.finalReportAppendices(tenantId, id, scope)).find((row: any) => row.key === appendixKey);
    if (!appendix) throw new NotFoundException('Appendix not found.');
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_APPENDIX_PREVIEWED', 'Final report appendix previewed', appendix.title, { appendixKey });
    return { ...appendix, preview: await this.appendixPreviewData(tenantId, id, appendixKey, scope) };
  }

  async exportFinalReportAppendix(tenantId: string, actorId: string, id: string, appendixKey: string, dto: LopaReportGenerateDto, scope: Scope) {
    const preview = await this.previewFinalReportAppendix(tenantId, actorId, id, appendixKey, scope);
    return this.exportFinalReportTable(tenantId, actorId, id, dto.outputFormat ?? 'CSV', { ...dto, notes: `Appendix export: ${preview.title}` }, scope);
  }

  async finalReportPackages(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.optionalMany('lopa_report_packages', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('generated_at', { ascending: false }));
  }

  async finalReportPackageDetail(tenantId: string, id: string, packageId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const pkg = await this.db.single<any>(this.db.from('lopa_report_packages').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', packageId).single());
    const items = await this.optionalMany('lopa_report_package_items', q => q.select('*').eq('tenant_id', tenantId).eq('package_id', packageId).order('sort_order'));
    return { ...pkg, items };
  }

  async downloadFinalReportPackage(tenantId: string, actorId: string, id: string, packageId: string, scope: Scope) {
    const pkg = await this.finalReportPackageDetail(tenantId, id, packageId, scope);
    if (!pkg.storage_key) throw new NotFoundException('Generated report package file was not found in storage.');
    const buffer = await this.storage.getObject(pkg.storage_key);
    await this.recordReportExport(tenantId, actorId, id, null, packageId, 'Package Download', 'ZIP', 'Complete', { packageId });
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_PACKAGE_DOWNLOADED', 'Final report package downloaded', pkg.package_name, { packageId });
    return { fileName: `${pkg.package_number}.txt`, mimeType: 'text/plain', buffer };
  }

  async archiveFinalReportPackage(tenantId: string, actorId: string, id: string, packageId: string, reason: string | undefined, scope: Scope) {
    const pkg = await this.db.single<any>(this.db.from('lopa_report_packages').update({ status: 'Archived', archived_by: actorId, archived_at: new Date().toISOString(), archive_reason: reason }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', packageId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_PACKAGE_ARCHIVED', 'Final report package archived', reason ?? pkg.package_name, { packageId });
    return pkg;
  }

  async restoreFinalReportPackage(tenantId: string, actorId: string, id: string, packageId: string, reason: string | undefined, scope: Scope) {
    const pkg = await this.db.single<any>(this.db.from('lopa_report_packages').update({ status: 'Generated', archived_by: null, archived_at: null, archive_reason: null }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', packageId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_PACKAGE_RESTORED', 'Final report package restored', reason ?? pkg.package_name, { packageId });
    return pkg;
  }

  async finalReportRedactionPreview(tenantId: string, id: string, scope: Scope, dto?: LopaReportGenerateDto) {
    await this.studyRecord(tenantId, id, scope);
    const [attachments, history, linked] = await Promise.all([
      this.optionalMany('lopa_attachments', q => q.select('id,file_name,classification,access_level,restricted,required_evidence').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      this.optionalMany('lopa_history_events', q => q.select('id,metadata,metadata_json,event_type').eq('tenant_id', tenantId).eq('lopa_study_id', id).limit(100)),
      this.optionalMany('lopa_linked_records', q => q.select('id,record_title,access_level,restricted,classification').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null))
    ]);
    const restrictedAttachments = attachments.filter((row: any) => row.restricted || row.access_level === 'Restricted' || row.classification === 'Restricted');
    const restrictedHistory = history.filter((row: any) => row.metadata?.restricted || row.metadata_json?.restricted);
    const restrictedLinked = linked.filter((row: any) => row.restricted || row.access_level === 'Restricted' || row.classification === 'Restricted');
    return { mode: dto?.redactionMode ?? 'Permission Safe', includeRestrictedData: !!dto?.includeRestrictedData, restrictedAttachments, restrictedHistory, restrictedLinked, warnings: [...restrictedAttachments.map((row: any) => `Attachment redacted: ${row.file_name}`), ...restrictedLinked.map((row: any) => `Linked record redacted: ${row.record_title}`)] };
  }

  async finalReportExportHistory(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.optionalMany('lopa_report_exports', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('requested_at', { ascending: false }));
  }

  async exportFinalReportTable(tenantId: string, actorId: string, id: string, format: string, dto: LopaReportGenerateDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const snapshot = await this.createFinalReportSourceSnapshot(tenantId, actorId, id, scope);
    const rows = Object.entries(snapshot.data_snapshot_json ?? {}).map(([key, value]) => ({ section: key, summary: Array.isArray(value) ? `${value.length} row(s)` : value ? 'Available' : 'Missing' }));
    const csv = ['Section,Summary', ...rows.map((row) => `${this.csvEscape(row.section)},${this.csvEscape(row.summary)}`)].join('\n');
    const fileName = `${study.lopa_number}-final-report-export-${Date.now()}.csv`;
    const storageKey = this.storage.buildObjectKey(tenantId, 'lopa-final-report-exports', fileName);
    const buffer = Buffer.from(csv, 'utf8');
    await this.storage.putObject(storageKey, buffer);
    const event = await this.recordReportExport(tenantId, actorId, id, null, null, `${format} Export`, format, 'Complete', { fileName, storageKey, notes: dto.notes });
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_TABLE_EXPORTED', `${format} final report export generated`, dto.notes ?? fileName, { exportId: event.id, format });
    return event;
  }

  async finalReportDistribution(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.optionalMany('lopa_report_distribution', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('shared_at', { ascending: false }));
  }

  async shareFinalReport(tenantId: string, actorId: string, id: string, dto: LopaReportShareDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('lopa_report_distribution').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, recipient_user_id: dto.recipientUserId, recipient_email: dto.recipientEmail, recipient_role: dto.recipientRole, distribution_method: dto.distributionMethod ?? 'Secure Link', access_expires_at: dto.accessExpiresAt, status: 'Shared', shared_by: actorId, shared_at: new Date().toISOString(), notes: dto.notes }).select().single());
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_SHARED', 'Final report shared', dto.recipientEmail, { distributionId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.final_report.share', 'LOPA_REPORT_DISTRIBUTION', row.id, row as JsonValue);
    return row;
  }

  async revokeFinalReportShare(tenantId: string, actorId: string, id: string, distributionId: string, reason: string | undefined, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('lopa_report_distribution').update({ status: 'Revoked', revoked_by: actorId, revoked_at: new Date().toISOString(), notes: reason }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', distributionId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_SHARE_REVOKED', 'Final report share revoked', reason ?? row.recipient_email, { distributionId });
    return row;
  }

  async resendFinalReportShare(tenantId: string, actorId: string, id: string, distributionId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('lopa_report_distribution').update({ status: 'Resent', shared_by: actorId, shared_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', distributionId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'FINAL_REPORT_SHARE_RESENT', 'Final report share resent', row.recipient_email, { distributionId });
    return row;
  }

  async finalReportContext(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return { reportTypes: ['Draft report', 'Final report', 'Official approved report', 'Redacted report', 'Full report package', 'Technical appendices only', 'Executive summary only', 'Attachment index only', 'History/audit trail only', 'Calculation tables only', 'Recommendations/actions register only'], outputFormats: ['PDF', 'Excel', 'CSV', 'ZIP', 'JSON', 'DOCX'], classifications: ['Public', 'Internal', 'Confidential', 'Restricted'], statuses: ['Draft', 'Generated', 'Failed', 'Official', 'Published', 'Superseded', 'Archived', 'Deleted'], redactionModes: ['Permission Safe', 'Redacted', 'Restricted Data Included'], disabledReasons: { officialBlocked: 'Official reports require readiness complete, approval snapshot/e-signatures where required, and no open hard blockers.' } };
  }

  private defaultReportTemplates(study: any) {
    const sections = this.defaultReportSections(study).map((section) => String(section.section_key));
    return [
      { id: 'system-standard-lopa-report', template_name: 'Standard LOPA Report', template_type: 'Standard LOPA Report', template_version: '1.0', description: 'Company default study-level LOPA final report.', sections_json: sections, required_sections_json: sections.filter((key) => !['appendices'].includes(key)), output_formats_json: ['PDF', 'CSV'], active: true, default_template: true, systemTemplate: true },
      { id: 'system-lopa-sil-report', template_name: 'LOPA + SIL Report', template_type: 'LOPA + SIL Report', template_version: '1.0', description: 'Includes SIL/SIF specification sections when the study requires SIL.', sections_json: sections, required_sections_json: sections, output_formats_json: ['PDF', 'CSV'], active: true, default_template: !!study.sil_required, systemTemplate: true },
      { id: 'system-full-audit-package', template_name: 'Full Audit Package', template_type: 'Full Audit Package', template_version: '1.0', description: 'Complete report, appendices, approval snapshot, attachment index, and history export manifest.', sections_json: sections, required_sections_json: sections, output_formats_json: ['PDF', 'ZIP', 'CSV'], active: true, default_template: false, systemTemplate: true }
    ];
  }

  private defaultReportSections(study: any) {
    const rows: Array<[string, string, string, boolean]> = [
      ['cover', 'Cover Page', 'Overview', true],
      ['document-control', 'Document Control / Revision Info', 'Final Report', true],
      ['executive-summary', 'Executive Summary', 'Overview', true],
      ['study-metadata', 'Study Metadata', 'Overview', true],
      ['study-scope', 'Study Scope', 'Overview', true],
      ['hazop-source', 'Source / Linked HAZOP Scenario', 'Scenario & Consequence', !!study.source_hazop_scenario_id],
      ['scenario-consequence', 'Scenario & Consequence', 'Scenario & Consequence', true],
      ['initiating-event', 'Initiating Event', 'Initiating Event', true],
      ['conditional-modifiers', 'Conditional Modifiers', 'Risk Calculation', false],
      ['ipls-safeguards', 'Safeguards / IPLs', 'IPLs / Safeguards', true],
      ['credited-ipls', 'Credited IPL Summary', 'IPLs / Safeguards', true],
      ['rejected-safeguards', 'Rejected / Non-Credited Safeguards', 'IPLs / Safeguards', false],
      ['risk-calculation', 'Risk Calculation', 'Risk Calculation', true],
      ['risk-gap', 'Risk Gap / Required RRF', 'Risk Calculation', true],
      ['sil-determination', 'SIL Determination', 'SIL Determination / SIF Specification', !!study.sil_required],
      ['sif-specification', 'SIF Specification', 'SIL Determination / SIF Specification', !!study.sil_required],
      ['recommendations-actions', 'Recommendations / Actions', 'Recommendations / Actions', true],
      ['team-sessions', 'Team & Sessions', 'Team & Sessions', true],
      ['linked-records', 'Linked Records', 'Linked Records', true],
      ['review-signoff', 'Review & Sign-Off', 'Review & Sign-Off', true],
      ['esignatures', 'E-Signature Summary', 'Review & Sign-Off', true],
      ['attachments-index', 'Attachments Index', 'Attachments', true],
      ['history-summary', 'History / Audit Trail Summary', 'History', true],
      ['assumptions-limitations', 'Assumptions and Limitations', 'Overview', true],
      ['appendices', 'Appendices', 'Final Report', false]
    ];
    return rows.map(([section_key, section_title, source_module, required], index) => ({ section_key, section_title, source_module, required, included: true, status: 'Ready', missing_data_count: 0, restricted_data_count: 0, sort_order: index + 1 }));
  }

  private async previewFinalReportPayload(tenantId: string, id: string, scope: Scope, dto: Partial<LopaReportGenerateDto>) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [readiness, sections, redaction, latestReport] = await Promise.all([
      this.finalReportReadiness(tenantId, id, scope),
      this.finalReportSections(tenantId, id, scope),
      this.finalReportRedactionPreview(tenantId, id, scope, dto as LopaReportGenerateDto),
      this.optionalMany('lopa_report_generations', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('generated_at', { ascending: false }).limit(1))
    ]);
    return { title: `${study.lopa_number} Final LOPA/SIL Report`, watermark: dto.official ? 'Official readiness preview' : 'Draft preview', generatedAt: new Date().toISOString(), metadata: { studyNumber: study.lopa_number, title: study.title, status: study.status, latestReportVersion: latestReport[0]?.report_version ?? null }, tableOfContents: sections.filter((s: any) => s.included).map((s: any) => s.section_title), readiness, redaction, missingDataWarnings: readiness.blockers, pageStructure: sections.filter((s: any) => s.included).map((s: any, index: number) => ({ page: index + 1, section: s.section_title, sourceModule: s.source_module, status: s.status })), restricted: redaction.warnings.length > 0 };
  }

  private async renderFinalReportArtifact(tenantId: string, id: string, scope: Scope, dto: LopaReportGenerateDto, snapshot: any, template: any) {
    const preview = await this.previewFinalReportPayload(tenantId, id, scope, dto);
    const lines = [
      preview.title,
      `Template: ${template.template_name} v${template.template_version}`,
      `Study: ${preview.metadata.studyNumber} - ${preview.metadata.title}`,
      `Status: ${preview.metadata.status}`,
      `Generated: ${preview.generatedAt}`,
      `Classification: ${dto.classification ?? 'Internal'}`,
      `Watermark: ${dto.official ? 'OFFICIAL CANDIDATE' : 'DRAFT'}`,
      '',
      'Readiness',
      `Status: ${preview.readiness.status}`,
      `Blockers: ${preview.readiness.blockers.length}`,
      '',
      'Sections',
      ...preview.tableOfContents.map((section: string, index: number) => `${index + 1}. ${section}`),
      '',
      'Source Snapshot',
      `Snapshot ID: ${snapshot.id}`,
      `Snapshot Hash: ${snapshot.snapshot_hash ?? 'Not calculated'}`,
      '',
      'Redaction',
      ...((preview.redaction.warnings.length ? preview.redaction.warnings : ['No redaction warnings for current user scope.']) as string[])
    ];
    return { title: preview.title, lines, redactionSummary: preview.redaction };
  }

  private async recordReportExport(tenantId: string, actorId: string, id: string, reportId: string | null, packageId: string | null, exportType: string, outputFormat: string, status: string, metadata: any) {
    const study = await this.studyRecord(tenantId, id, { corporateView: true });
    return this.optionalSingle(this.db.from('lopa_report_exports').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, report_generation_id: reportId, package_id: packageId, export_type: exportType, output_format: outputFormat, status, requested_by: actorId, requested_at: new Date().toISOString(), completed_at: status === 'Complete' ? new Date().toISOString() : null, file_size: metadata?.bytes ?? metadata?.fileSize ?? null, storage_key: metadata?.storageKey ?? null, error_message: status === 'Failed' ? metadata?.error : null, metadata_json: metadata as JsonValue }).select().single());
  }

  private minimalPdfBuffer(title: string, lines: string[]) {
    const escaped = [title, ...lines].slice(0, 45).map((line) => String(line).replace(/[()\\]/g, ' '));
    const text = escaped.map((line, index) => `BT /F1 10 Tf 50 ${760 - index * 14} Td (${line.slice(0, 96)}) Tj ET`).join('\n');
    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      `5 0 obj << /Length ${Buffer.byteLength(text)} >> stream\n${text}\nendstream endobj`
    ];
    let pdf = '%PDF-1.4\n';
    const xref: number[] = [0];
    for (const obj of objects) { xref.push(Buffer.byteLength(pdf)); pdf += `${obj}\n`; }
    const start = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of xref.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
  }

  private async nextReportNumber(tenantId: string, id: string) {
    const study = await this.optionalSingle(this.db.from('lopa_studies').select('lopa_number').eq('tenant_id', tenantId).eq('id', id).single());
    const rows = await this.optionalMany('lopa_report_generations', q => q.select('id').eq('tenant_id', tenantId).eq('lopa_study_id', id));
    return `${study?.lopa_number ?? 'LOPA'}-RPT-${String(rows.length + 1).padStart(3, '0')}`;
  }

  private async nextPackageNumber(tenantId: string, id: string) {
    const study = await this.optionalSingle(this.db.from('lopa_studies').select('lopa_number').eq('tenant_id', tenantId).eq('id', id).single());
    const rows = await this.optionalMany('lopa_report_packages', q => q.select('id').eq('tenant_id', tenantId).eq('lopa_study_id', id));
    return `${study?.lopa_number ?? 'LOPA'}-PKG-${String(rows.length + 1).padStart(3, '0')}`;
  }

  private finalReportMatches(row: any, query: LopaFinalReportFilterDto) {
    const q = String(query.q ?? '').toLowerCase();
    const bool = (value: string | undefined) => value === 'true';
    return (!q || [row.report_number, row.report_title, row.file_name, row.template_name_snapshot, row.generated_by, row.document_number_snapshot, row.notes].some(value => String(value ?? '').toLowerCase().includes(q))) &&
      (!query.reportType || row.report_type === query.reportType) &&
      (!query.status || row.status === query.status) &&
      (!query.outputFormat || row.output_format === query.outputFormat) &&
      (!query.templateId || row.template_id === query.templateId) &&
      (!query.official || !!row.official === bool(query.official)) &&
      (!query.published || !!row.published === bool(query.published)) &&
      (!query.generatedBy || row.generated_by === query.generatedBy) &&
      (!query.classification || row.classification === query.classification) &&
      (!query.failedExports || (row.status === 'Failed') === bool(query.failedExports)) &&
      (!query.superseded || (!!row.superseded_by_report_id || row.status === 'Superseded') === bool(query.superseded)) &&
      (!query.archived || !!row.archived_at === bool(query.archived)) &&
      (!query.documentControlPublished || !!row.document_id === bool(query.documentControlPublished)) &&
      (!query.dateFrom || String(row.generated_at ?? row.created_at ?? '') >= query.dateFrom) &&
      (!query.dateTo || String(row.generated_at ?? row.created_at ?? '') <= `${query.dateTo}T23:59:59.999Z`);
  }

  private reportMimeType(format: string) {
    const key = String(format ?? '').toUpperCase();
    if (key === 'PDF') return 'application/pdf';
    if (key === 'CSV') return 'text/csv';
    if (key === 'JSON') return 'application/json';
    if (key === 'DOCX') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (key === 'EXCEL' || key === 'XLSX') return 'text/csv';
    return 'application/octet-stream';
  }

  private async appendixPreviewData(tenantId: string, id: string, appendixKey: string, scope: Scope) {
    const source: Record<string, () => Promise<any>> = {
      'ipl-validation': () => this.optionalMany('lopa_study_ipl_candidates', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      'calculation-tables': () => this.optionalMany('lopa_risk_calculations', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }).limit(5)),
      recommendations: () => this.optionalMany('lopa_recommendations', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('deleted_at', null)),
      'team-minutes': () => this.optionalMany('lopa_sessions', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      'linked-records': () => this.optionalMany('lopa_linked_records', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null)),
      attachments: () => this.optionalMany('lopa_attachments', q => q.select('attachment_number,file_name,status,classification').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      history: () => this.optionalMany('lopa_history_events', q => q.select('event_number,event_type,created_at').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }).limit(100))
    };
    return (source[appendixKey] ?? (() => this.finalReportTab(tenantId, id, {}, scope)))();
  }

  private csvEscape(value: string) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }


  private async silReadiness(study: any, calculation: any, riskInputs: any, methodology: any, determination: any, sifs: any[], components: any[], architectures: any[], proofTests: any[], gaps: any[], links: any[], actions: any[], reassessments: any[]) {
    const mandatoryGaps = gaps.filter((gap: any) => (gap.closure_blocker || gap.required || gap.mandatory) && !['Complete', 'Closed', 'Not Applicable'].includes(gap.status) && !gap.accepted_exception);
    const missingRequiredLinks = links.filter((link: any) => link.required && (!link.linked_record_id || link.unlinked_at));
    const openActions = actions.filter((row: any) => (row.blocking || row.closure_blocker) && !this.isActionClosed(row.action ?? row));
    const sif = sifs[0] ?? null;
    const sensors = components.filter((row: any) => row.component_type === 'Sensor');
    const logicSolvers = components.filter((row: any) => row.component_type === 'Logic Solver');
    const finalElements = components.filter((row: any) => row.component_type === 'Final Element');
    const architecture = architectures.find((row: any) => row.sif_specification_id === sif?.id);
    const proofTest = proofTests.find((row: any) => row.sif_specification_id === sif?.id);
    const hasLink = (types: string[]) => links.some((link: any) => types.some(type => String(link.linked_record_type ?? link.record_type).toLowerCase().includes(type.toLowerCase())) && link.linked_record_id && !link.unlinked_at);
    const calculationCurrent = !!calculation && ['Calculated', 'Locked'].includes(calculation.calculation_status) && calculation.result_status !== 'Needs Recalculation';
    const newSifRequired = !!determination?.new_sif_required;
    const checks = [
      this.check('scenario_consequence', 'Scenario & Consequence complete', !!riskInputs?.consequence?.description && !!riskInputs?.consequence?.severity, 'Blocked'),
      this.check('initiating_event', 'Initiating Event complete', this.toNumber(riskInputs?.initiatingEvent?.frequency_per_year ?? study.initiating_event_frequency) > 0, 'Blocked'),
      this.check('conditional_modifiers', 'Conditional Modifiers complete if required', (riskInputs?.conditionalModifiers ?? []).every((row: any) => this.toNumber(row.selected_value ?? row.default_value ?? 1) > 0), 'Blocked'),
      this.check('ipl_validation', 'IPLs / Safeguards validation complete', (riskInputs?.creditedIpls ?? []).every((row: any) => ['Credited','Approved for Credit','Validation Complete'].includes(row.validation_status)), 'Blocked'),
      this.check('risk_calculation', 'Current Risk Calculation is complete', calculationCurrent, 'Blocked'),
      this.check('calculation_current', 'Calculation status is not Needs Recalculation', calculation?.result_status !== 'Needs Recalculation' && calculation?.calculation_status !== 'Needs Recalculation', 'Blocked'),
      this.check('tolerable_frequency', 'Tolerable frequency available', this.toNumber(calculation?.tolerable_frequency) > 0, 'Blocked'),
      this.check('mitigated_frequency', 'Mitigated frequency available', calculation?.mitigated_event_frequency != null, 'Blocked'),
      this.check('required_rrf', 'Required RRF calculated', calculation?.required_additional_rrf != null, 'Blocked'),
      this.check('risk_gap', 'Risk gap status known', calculation?.meets_risk_criteria != null, 'Blocked'),
      this.check('methodology', 'Approved company/site SIL methodology configured', !!methodology, 'Blocked'),
      this.check('sil_determined', 'SIL determination is generated', !!determination, 'Blocked'),
      this.check('sif_requirement', 'SIF requirement status known', !!determination?.sif_requirement_status, 'Blocked'),
      this.check('existing_sif_review', 'Existing SIF review complete if selected', !determination?.existing_sif_exists || determination?.existing_sif_adequate != null, 'Blocked'),
      this.check('sif_specification', 'New SIF specification complete if required', !newSifRequired || !!sif?.complete, 'Blocked'),
      this.check('sif_architecture', 'SIF architecture/voting complete', !newSifRequired || !!architecture?.sensor_voting && !!architecture?.logic_solver_architecture && !!architecture?.final_element_voting, 'Blocked'),
      this.check('sif_sensors', 'At least one SIF sensor specified', !newSifRequired || sensors.length > 0, 'Blocked'),
      this.check('sif_logic_solver', 'Logic solver specified', !newSifRequired || logicSolvers.length > 0, 'Blocked'),
      this.check('sif_final_elements', 'At least one final element specified', !newSifRequired || finalElements.length > 0, 'Blocked'),
      this.check('safe_state_action', 'Safe state and required action complete', !newSifRequired || !!sif?.safe_state && !!(sif?.required_action ?? sif?.process_action), 'Blocked'),
      this.check('trip_setpoint_basis', 'Trip setpoint basis complete where entered', !sif?.trip_setpoint || !!sif?.setpoint_basis, 'Blocked'),
      this.check('proof_test_basis', 'Proof-test and maintenance basis complete', !newSifRequired || !!proofTest?.proof_test_interval && !!proofTest?.maintenance_basis, 'Blocked'),
      this.check('bypass_management', 'Bypass management complete', !newSifRequired || proofTest?.bypass_allowed === false || !!proofTest?.override_management_notes, 'Blocked'),
      this.check('required_documents', 'Required SIF documents linked', !newSifRequired || hasLink(['document','SRS','Cause & Effect','procedure']), 'Blocked'),
      this.check('equipment_links', 'Required equipment links complete', !newSifRequired || hasLink(['equipment','instrument']), 'Blocked'),
      this.check('moc_link', 'Required MOC linked', !determination?.moc_required && !sif?.moc_required || hasLink(['MOC']), 'Blocked'),
      this.check('pssr_link', 'Required PSSR linked', !determination?.pssr_required && !sif?.pssr_required || hasLink(['PSSR']), 'Blocked'),
      this.check('mi_link', 'Required MI/proof-test record linked', !determination?.mi_required && !sif?.mi_required || hasLink(['MI','proof-test']), 'Blocked'),
      this.check('iec_gaps', 'Mandatory IEC 61511 gaps resolved', mandatoryGaps.length === 0, 'Blocked'),
      this.check('required_links', 'Required equipment/document/MOC/MI links are present', missingRequiredLinks.length === 0, 'Blocked'),
      this.check('blocking_actions', 'Blocking SIL actions are closed', openActions.length === 0, 'Blocked'),
      this.check('reassessment', 'No SIL reassessment is pending', reassessments.length === 0, 'Blocked'),
      this.check('study_mutable', 'Study is not approved/closed read-only', !this.isReadOnly(study), 'Warning')
    ];
    const blockers = [...mandatoryGaps.map((g: any) => this.blocker(g.gap_title ?? g.requirement_title, g.gap_description ?? g.finding ?? 'IEC 61511 gap is unresolved.', 'Hard', 'sil')), ...missingRequiredLinks.map((l: any) => this.blocker(`Required ${l.linked_record_type ?? l.record_type} link missing`, l.linked_record_title ?? l.record_title ?? 'Required linked evidence is missing.', 'Hard', 'sil')), ...openActions.map((a: any) => this.blocker(a.title, 'A blocking Universal Action remains open.', 'Hard', 'actions')), ...reassessments.map((r: any) => this.blocker('SIL needs reassessment', r.impact_summary ?? r.trigger_description ?? r.trigger_type, 'Hard', 'sil'))];
    const base = this.readinessFromChecks(checks); const result = { ...base, status: checks.some(check => check.status === 'Blocked') || blockers.length ? 'Blocked' : checks.some(check => check.status === 'Warning') ? 'Warning' : 'Ready', checks, blockers: [...base.blockers, ...blockers] };
    await this.optionalSingle(this.db.from('lopa_studies').update({ sil_readiness_status: result.status, review_readiness_status: result.status === 'Ready' ? study.review_readiness_status : 'Not Ready' }).eq('tenant_id', study.tenant_id).eq('id', study.id).select('id').single());
    return result;
  }

  private async recordSilSnapshot(tenantId: string, actorId: string, study: any, determination: any, calculation: any, snapshotType: string) {
    const existing = await this.optionalMany('lopa_sil_snapshots', q => q.select('id,version_number').eq('tenant_id', tenantId).eq('lopa_study_id', study.id)); const version = existing.length + 1;
    const [sifs, components, architectures, proofTests, gaps, links, actionLinks] = await Promise.all([this.optionalMany('lopa_sif_specifications', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', study.id).is('deleted_at', null)),this.optionalMany('lopa_sif_components', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', study.id).is('deleted_at', null)),this.optionalMany('lopa_sif_architectures', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', study.id)),this.optionalMany('lopa_sif_proof_test_bypass', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', study.id)),this.optionalMany('lopa_sil_iec61511_gaps', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', study.id)),this.optionalMany('lopa_sif_record_links', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', study.id).is('unlinked_at', null)),this.optionalMany('lopa_sil_actions', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', study.id).is('unlinked_at', null))]);
    const snapshotJson = this.silSnapshotPayload(study, determination, calculation, sifs, components, architectures, proofTests, gaps, links, actionLinks); const snapshotHash = this.stableHash(snapshotJson);
    return this.db.single<any>(this.db.from('lopa_sil_snapshots').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: study.id, sil_determination_id: determination.id, version_number: version, snapshot_version: version, snapshot_type: snapshotType, status: determination.status, snapshot_status: determination.status, calculation_version_id: calculation?.id ?? null, target_sil: determination.target_sil, sil_required: determination.sil_required, required_rrf: determination.required_rrf, required_pfdavg: determination.required_pfdavg, sif_requirement_status: determination.sif_requirement_status, snapshot_json: snapshotJson, snapshot_hash: snapshotHash, locked: snapshotType === 'Locked', locked_by: snapshotType === 'Locked' ? actorId : null, locked_at: snapshotType === 'Locked' ? new Date().toISOString() : null, created_by: actorId }).select().single());
  }

  private async markSilNeedsReassessment(tenantId: string, actorId: string, study: any, determination: any, description: string) {
    const now = new Date().toISOString();
    await this.optionalSingle(this.db.from('lopa_studies').update({ sil_needs_reassessment: true, sil_determination_status: 'Needs Reassessment', sil_locked: false, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', study.id).select('id').single());
    const existing = await this.optionalSingle(this.db.from('lopa_sil_reassessment_events').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', study.id).eq('status', 'Open').eq('changed_item', description).single());
    if (existing) return existing;
    await this.notifications.notifyUser({
      tenantId,
      userId: actorId,
      companyId: study.company_id ?? undefined,
      siteId: study.site_id,
      title: 'SIL reassessment required',
      message: description,
      type: 'lopa.sil.reassessment_required',
      module: 'lopa',
      relatedRecordId: study.id,
      relatedRecordType: 'LOPA Study',
      relatedUrl: `/lopa/${study.id}?tab=sil`,
      priority: 'High'
    }).catch(() => null);
    return this.optionalSingle(this.db.from('lopa_sil_reassessment_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: study.id, sil_determination_id: determination?.id ?? null, trigger_type: 'SIF/SIL change', trigger_description: description, source_module: 'LOPA', source_record_type: 'SIL/SIF dependency', source_record_id: determination?.id ?? study.id, changed_item: description, change_severity: 'High', impact_summary: description, reassessment_required: true, changed_by: actorId, changed_at: now, created_by: actorId }).select().single());
  }

  async attachmentsTab(tenantId: string, id: string, query: LopaAttachmentFilterDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [raw, documentLinks, mappings, readiness] = await Promise.all([
      this.optionalMany('lopa_attachments', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('uploaded_at', { ascending: false })),
      this.optionalMany('lopa_attachment_document_links', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null).order('linked_at', { ascending: false })),
      this.optionalMany('lopa_attachment_evidence_mappings', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false })),
      this.attachmentReadiness(tenantId, id, scope)
    ]);
    const rows = raw.map((item: any) => this.safeAttachment(item));
    const filtered = rows.filter((item: any) => this.attachmentMatches(item, query));
    const page = Math.max(Number(query.page ?? 1), 1), limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 100);
    return { readOnly: this.isReadOnly(study), header: { lopaNumber: study.lopa_number, title: study.title, status: study.status, lastUpdatedAt: study.updated_at }, summary: this.attachmentSummary(raw, documentLinks, readiness), requiredEvidence: readiness.checklist, readiness, register: { rows: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit }, documentLinks, mappings, context: { attachmentTypes: ['Uploaded File', 'Controlled Document Link', 'External Reference', 'Generated Export', 'Approval Snapshot', 'Calculation Snapshot', 'Evidence File', 'Other'], evidenceCategories: ['Scenario / Consequence', 'Initiating Event', 'Conditional Modifier', 'IPL Validation', 'IPL Proof Test', 'IPL PFD/RRF Basis', 'Risk Calculation', 'SIL Determination', 'SIF Specification', 'MOC', 'PSSR', 'Mechanical Integrity', 'Team Session', 'Meeting Minutes', 'Review Comment', 'Recommendation Closure', 'Approval / Sign-Off', 'Final Report', 'General'] } };
  }

  async attachmentReadiness(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [attachments, mappings, documentLinks] = await Promise.all([
      this.optionalMany('lopa_attachments', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('deleted_at', null).is('archived_at', null)),
      this.optionalMany('lopa_attachment_evidence_mappings', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      this.optionalMany('lopa_attachment_document_links', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null))
    ]);
    const required = this.attachmentRequirementsFor(study);
    const checklist = required.map((requirement) => {
      const linked = mappings.some((mapping: any) => mapping.related_tab === requirement.tab && (mapping.attachment_id || mapping.document_link_id)) || documentLinks.some((link: any) => requirement.tab === 'Linked Records' && link.required_evidence) || attachments.some((attachment: any) => attachment.required_evidence && attachment.related_tab === requirement.tab && attachment.status !== 'Rejected');
      return { ...requirement, status: linked ? 'Complete' : requirement.required ? 'Missing' : 'Not Applicable', linked: linked ? 'Attachment or controlled document linked' : null };
    });
    const missing = checklist.filter(item => item.required && item.status !== 'Complete');
    const rejected = attachments.filter((item: any) => item.required_evidence && item.status === 'Rejected');
    const restricted = attachments.filter((item: any) => item.required_evidence && item.access_level === 'Restricted');
    const status = missing.length || rejected.length ? 'Blocked' : 'Complete';
    const result = { status, checklist, blockers: missing.map(item => this.blocker(`${item.label} evidence missing`, 'Upload an attachment or link a controlled document.', 'Hard', item.tab)), missingRequiredCount: missing.length, rejectedRequiredCount: rejected.length, restrictedRequiredCount: restricted.length };
    await this.optionalSingle(this.db.from('lopa_attachment_readiness').upsert({ id: `attachment-readiness-${id}`, tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, readiness_status: status, required_evidence_status: status, missing_required_count: missing.length, rejected_required_count: rejected.length, restricted_required_count: restricted.length, checklist_json: checklist, generated_at: new Date().toISOString(), generated_by_system: true, updated_at: new Date().toISOString() }, { onConflict: 'tenant_id,lopa_study_id' }).select().single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ attachment_readiness_status: status, attachment_missing_required_count: missing.length, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    return result;
  }

  async attachmentContext(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    return {
      readOnly: this.isReadOnly(study),
      attachmentTypes: ['Uploaded File', 'Controlled Document Link', 'External Reference', 'Generated Export', 'Approval Snapshot', 'Calculation Snapshot', 'Evidence File', 'Other'],
      evidenceCategories: ['Scenario / Consequence', 'Initiating Event', 'Conditional Modifier', 'IPL Validation', 'IPL Proof Test', 'IPL PFD/RRF Basis', 'Risk Calculation', 'SIL Determination', 'SIF Specification', 'MOC', 'PSSR', 'Mechanical Integrity', 'Team Session', 'Meeting Minutes', 'Review Comment', 'Recommendation Closure', 'Approval / Sign-Off', 'Final Report', 'General'],
      relatedTabs: ['Overview', 'Scenario & Consequence', 'Initiating Event', 'Conditional Modifiers', 'IPLs / Safeguards', 'Risk Calculation', 'SIL Determination / SIF Specification', 'Recommendations / Actions', 'Team & Sessions', 'Linked Records', 'Review & Sign-Off', 'Final Report', 'General'],
      classifications: ['Public/Internal', 'Company Confidential', 'Restricted', 'Safety Critical', 'Regulatory Evidence', 'Legal/Investigation Sensitive', 'Other'],
      accessLevels: ['Study team', 'Site users', 'Company users', 'Owner only', 'Specific roles', 'Specific users', 'Restricted'],
      statuses: ['Draft', 'Active', 'Pending Review', 'Approved', 'Rejected', 'Superseded', 'Archived', 'Deleted']
    };
  }

  async attachmentVersions(tenantId: string, id: string, attachmentId: string, scope: Scope) {
    await this.attachmentDetail(tenantId, id, attachmentId, scope);
    return this.optionalMany('lopa_attachment_versions', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('attachment_id', attachmentId).order('version', { ascending: false }));
  }

  async attachmentHistory(tenantId: string, id: string, attachmentId: string, scope: Scope) {
    await this.attachmentDetail(tenantId, id, attachmentId, scope);
    return this.optionalMany('lopa_history_events', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).contains('metadata', { attachmentId }).order('created_at', { ascending: false })).then(rows => rows.map(row => this.safeHistoryEvent(row)));
  }

  async refreshAttachmentDocument(tenantId: string, actorId: string, id: string, linkId: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study);
    const link = await this.db.single<any>(this.db.from('lopa_attachment_document_links').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', linkId).is('unlinked_at', null).single());
    const document = await this.db.single<any>(this.db.from('documents').select('id,document_number,title,document_type,status,revision,effective_date,owner_id').eq('tenant_id', tenantId).eq('site_id', study.site_id).eq('id', link.document_id).single());
    const changed = link.document_revision_snapshot !== document.revision || link.document_status_snapshot !== document.status;
    const row = await this.db.single<any>(this.db.from('lopa_attachment_document_links').update({ document_number_snapshot: document.document_number, document_title_snapshot: document.title, document_type_snapshot: document.document_type, document_revision_snapshot: document.revision ?? null, document_status_snapshot: document.status, document_owner_snapshot: document.owner_id ?? null, effective_date_snapshot: document.effective_date ?? null, last_refreshed_at: new Date().toISOString(), status_changed: changed, refresh_warning: changed ? 'Controlled document revision or status changed after linking.' : null }).eq('tenant_id', tenantId).eq('id', linkId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'CONTROLLED_DOCUMENT_REFRESHED', 'Controlled document status refreshed', document.title ?? document.document_number, { documentLinkId: linkId, changed, before: link, after: row } as JsonValue);
    await this.writeAudit(tenantId, actorId, 'lopa.attachments.document_link.manage', 'LOPA_ATTACHMENT_DOCUMENT_LINK', linkId, row as JsonValue); return row;
  }

  async attachmentEvidenceMappings(tenantId: string, id: string, scope: Scope) { await this.studyRecord(tenantId, id, scope); return this.optionalMany('lopa_attachment_evidence_mappings', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('updated_at', { ascending: false })); }

  async attachmentComments(tenantId: string, id: string, attachmentId: string, scope: Scope) { await this.attachmentDetail(tenantId, id, attachmentId, scope); return this.optionalMany('lopa_attachment_comments', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('attachment_id', attachmentId).order('created_at', { ascending: false })); }

  async updateAttachmentComment(tenantId: string, actorId: string, id: string, attachmentId: string, commentId: string, dto: LopaAttachmentCommentDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_attachment_comments').update(this.clean({ comment_text: dto.commentText, comment_type: dto.commentType, status: dto.status, updated_by: actorId, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('attachment_id', attachmentId).eq('id', commentId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'ATTACHMENT_COMMENT_UPDATED', 'Attachment comment updated', row.comment_text, { attachmentId, commentId } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.attachments.comments.manage', 'LOPA_ATTACHMENT_COMMENT', commentId, row as JsonValue); return row;
  }

  async deleteAttachmentComment(tenantId: string, actorId: string, id: string, attachmentId: string, commentId: string, reason: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_attachment_comments').delete().eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('attachment_id', attachmentId).eq('id', commentId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'ATTACHMENT_COMMENT_DELETED', 'Attachment comment removed', reason ?? row.comment_text, { attachmentId, commentId } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.attachments.comments.manage', 'LOPA_ATTACHMENT_COMMENT', commentId, row as JsonValue); return row;
  }

  async attachmentExportIndex(tenantId: string, actorId: string, id: string, query: LopaAttachmentFilterDto, scope: Scope) {
    const data = await this.attachmentsTab(tenantId, id, { ...query, page: '1', limit: '100' }, scope);
    await this.writeHistory(tenantId, id, actorId, 'ATTACHMENT_INDEX_EXPORTED', 'Attachment index exported', 'Filtered attachment index generated.', { filters: query } as unknown as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.attachments.export', 'LOPA', id, { filters: query } as unknown as JsonValue);
    return { generatedAt: new Date().toISOString(), header: data.header, summary: data.summary, rows: data.register.rows };
  }

  async attachmentBulkDownload(tenantId: string, actorId: string, id: string, dto: LopaAttachmentBulkDto, scope: Scope) {
    await this.studyRecord(tenantId, id, scope); if (!dto.attachmentIds.length) throw new BadRequestException('Select attachments first.');
    const rows = await this.optionalMany('lopa_attachments', q => q.select('id,file_name,status,access_level,storage_key').eq('tenant_id', tenantId).eq('lopa_study_id', id).in('id', dto.attachmentIds));
    const eligible = rows.filter((row: any) => row.storage_key && !['Deleted', 'Restricted'].includes(row.status) && row.access_level !== 'Restricted');
    await this.writeHistory(tenantId, id, actorId, 'ATTACHMENT_BULK_DOWNLOAD_REQUESTED', 'Attachment bulk download requested', `${eligible.length} attachment download(s) prepared.`, { requested: dto.attachmentIds.length, eligible: eligible.length } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.attachments.download', 'LOPA', id, { attachmentIds: eligible.map((row: any) => row.id) } as JsonValue);
    return { files: eligible.map((row: any) => ({ id: row.id, fileName: row.file_name, downloadPath: `/lopa/${id}/attachments/${row.id}/download` })), skipped: rows.length - eligible.length };
  }

  async uploadAttachment(tenantId: string, actorId: string, id: string, dto: UpsertLopaAttachmentDto, file: UploadedLopaFile | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study);
    if (!file?.buffer) throw new BadRequestException('An attachment file is required.');
    this.assertLopaAttachmentFile(file);
    const storageKey = this.storage.buildObjectKey(tenantId, `lopa/${study.company_id ?? 'company'}/${study.site_id}/${id}`, file.originalname);
    await this.storage.putObject(storageKey, file.buffer);
    const existing = await this.optionalMany('lopa_attachments', q => q.select('id').eq('tenant_id', tenantId).eq('lopa_study_id', id));
    const now = new Date().toISOString(), attachmentId = crypto.randomUUID();
    const row = await this.db.single<any>(this.db.from('lopa_attachments').insert(this.clean({ id: attachmentId, tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, attachment_number: `ATT-${String(existing.length + 1).padStart(4, '0')}`, attachment_type: dto.attachmentType, evidence_category: dto.evidenceCategory, related_tab: dto.relatedTab, related_record_type: dto.relatedRecordType, related_record_id: dto.relatedRecordId, file_name: dto.fileName || file.originalname, original_file_name: file.originalname, description: dto.description, file_type: file.originalname.split('.').pop()?.toUpperCase(), mime_type: file.mimetype, file_size: file.size, storage_key: storageKey, version: 1, revision: 'v1', status: dto.status ?? 'Active', classification: dto.classification ?? 'Public/Internal', access_level: dto.accessLevel ?? 'Study team', required_evidence: !!dto.requiredEvidence, evidence_purpose: dto.evidencePurpose, tags_json: dto.tags ?? [], effective_date: dto.effectiveDate, source_reference: dto.sourceReference, confidential: !!dto.confidential, restricted: !!dto.restricted, external_sharing_allowed: !!dto.externalSharingAllowed, retention_category: dto.retentionCategory, owner_id: dto.ownerId, permission_notes: dto.permissionNotes, uploaded_by: actorId, uploaded_at: now, updated_by: actorId, updated_at: now })).select().single());
    await this.optionalSingle(this.db.from('lopa_attachment_versions').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, attachment_id: row.id, version: 1, revision: 'v1', file_name: row.file_name, storage_key: storageKey, file_size: file.size, change_reason: dto.reason ?? 'Initial upload', uploaded_by: actorId, status: 'Active' }).select().single());
    await this.writeHistory(tenantId, id, actorId, 'ATTACHMENT_UPLOADED', 'LOPA attachment uploaded', row.file_name, { attachmentId: row.id, relatedTab: row.related_tab });
    await this.writeAudit(tenantId, actorId, 'lopa.attachments.upload', 'LOPA_ATTACHMENT', row.id, row as JsonValue);
    return this.attachmentDetail(tenantId, id, row.id, scope);
  }

  async attachmentDetail(tenantId: string, id: string, attachmentId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('lopa_attachments').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', attachmentId).single());
    const [versions, comments, mappings, links, history] = await Promise.all([
      this.optionalMany('lopa_attachment_versions', q => q.select('*').eq('tenant_id', tenantId).eq('attachment_id', attachmentId).order('version', { ascending: false })),
      this.optionalMany('lopa_attachment_comments', q => q.select('*').eq('tenant_id', tenantId).eq('attachment_id', attachmentId).order('created_at', { ascending: false })),
      this.optionalMany('lopa_attachment_evidence_mappings', q => q.select('*').eq('tenant_id', tenantId).eq('attachment_id', attachmentId)),
      this.optionalMany('lopa_attachment_document_links', q => q.select('*').eq('tenant_id', tenantId).eq('attachment_id', attachmentId).is('unlinked_at', null)),
      this.optionalMany('lopa_history_events', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).contains('metadata', { attachmentId }).order('created_at', { ascending: false }))
    ]);
    return { attachment: this.safeAttachment(row), versions, comments, mappings, documentLinks: links, history };
  }

  async attachmentAccess(tenantId: string, actorId: string, id: string, attachmentId: string, scope: Scope, mode: 'preview' | 'download') {
    const detail = await this.attachmentDetail(tenantId, id, attachmentId, scope); const attachment = detail.attachment;
    if (attachment.restricted && attachment.access_level === 'Restricted') throw new ForbiddenException('This attachment is restricted.');
    if (!attachment.storage_key) throw new BadRequestException('This attachment is a controlled-document link or does not have stored content.');
    const buffer = await this.storage.getObject(attachment.storage_key);
    await this.writeHistory(tenantId, id, actorId, mode === 'preview' ? 'ATTACHMENT_PREVIEWED' : 'ATTACHMENT_DOWNLOADED', `${mode} attachment`, attachment.file_name, { attachmentId, mode });
    await this.writeAudit(tenantId, actorId, `lopa.attachments.${mode}`, 'LOPA_ATTACHMENT', attachmentId, { mode } as JsonValue);
    return { fileName: attachment.file_name, mimeType: attachment.mime_type ?? 'application/octet-stream', buffer, disposition: mode === 'download' ? 'attachment' : 'inline' };
  }

  async archiveAttachment(tenantId: string, actorId: string, id: string, attachmentId: string, reason: string | undefined, scope: Scope, restore = false) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('lopa_attachments').update(restore ? { archived_at: null, archived_by: null, archive_reason: null, status: 'Active', updated_at: now, updated_by: actorId } : { archived_at: now, archived_by: actorId, archive_reason: reason, status: 'Archived', updated_at: now, updated_by: actorId }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', attachmentId).select().single());
    await this.writeHistory(tenantId, id, actorId, restore ? 'ATTACHMENT_RESTORED' : 'ATTACHMENT_ARCHIVED', restore ? 'Attachment restored' : 'Attachment archived', row.file_name, this.clean({ attachmentId, reason }) as JsonValue);
    await this.writeAudit(tenantId, actorId, restore ? 'lopa.attachments.restore' : 'lopa.attachments.archive', 'LOPA_ATTACHMENT', attachmentId, row as JsonValue); return row;
  }

  async deleteAttachment(tenantId: string, actorId: string, id: string, attachmentId: string, reason: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); const row = await this.db.single<any>(this.db.from('lopa_attachments').update({ deleted_at: new Date().toISOString(), deleted_by: actorId, delete_reason: reason, status: 'Deleted', updated_at: new Date().toISOString(), updated_by: actorId }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', attachmentId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'ATTACHMENT_DELETED', 'Attachment deleted', row.file_name, this.clean({ attachmentId, reason }) as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.attachments.delete', 'LOPA_ATTACHMENT', attachmentId, row as JsonValue); return row;
  }

  async updateAttachment(tenantId: string, actorId: string, id: string, attachmentId: string, dto: UpsertLopaAttachmentDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study);
    const before = await this.db.single<any>(this.db.from('lopa_attachments').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', attachmentId).single());
    const patch = this.clean({ attachment_type: dto.attachmentType, evidence_category: dto.evidenceCategory, description: dto.description, related_tab: dto.relatedTab, related_record_type: dto.relatedRecordType, related_record_id: dto.relatedRecordId, required_evidence: dto.requiredEvidence, evidence_purpose: dto.evidencePurpose, classification: dto.classification, access_level: dto.accessLevel, tags_json: dto.tags, effective_date: dto.effectiveDate, source_reference: dto.sourceReference, confidential: dto.confidential, restricted: dto.restricted, external_sharing_allowed: dto.externalSharingAllowed, retention_category: dto.retentionCategory, owner_id: dto.ownerId, permission_notes: dto.permissionNotes, status: dto.status, updated_by: actorId, updated_at: new Date().toISOString() });
    const row = await this.db.single<any>(this.db.from('lopa_attachments').update(patch).eq('tenant_id', tenantId).eq('id', attachmentId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'ATTACHMENT_UPDATED', 'Attachment metadata updated', row.file_name, { attachmentId, before, after: row } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.attachments.edit', 'LOPA_ATTACHMENT', attachmentId, row as JsonValue); return row;
  }

  async replaceAttachment(tenantId: string, actorId: string, id: string, attachmentId: string, dto: UpsertLopaAttachmentDto, file: UploadedLopaFile | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); if (!file?.buffer) throw new BadRequestException('Replacement file is required.'); this.assertLopaAttachmentFile(file);
    const before = await this.db.single<any>(this.db.from('lopa_attachments').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', attachmentId).single());
    const storageKey = this.storage.buildObjectKey(tenantId, `lopa/${study.company_id ?? 'company'}/${study.site_id}/${id}`, file.originalname); await this.storage.putObject(storageKey, file.buffer);
    const version = Number(before.version ?? 1) + 1, now = new Date().toISOString();
    const oldVersion = await this.optionalSingle(this.db.from('lopa_attachment_versions').select('*').eq('tenant_id', tenantId).eq('attachment_id', attachmentId).eq('version', before.version ?? 1).single());
    const versionRow = await this.db.single<any>(this.db.from('lopa_attachment_versions').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, attachment_id: attachmentId, version, revision: `v${version}`, file_name: file.originalname, storage_key: storageKey, file_size: file.size, change_reason: dto.reason ?? 'Replacement version uploaded', uploaded_by: actorId, status: 'Active' }).select().single());
    if (oldVersion?.id) await this.optionalSingle(this.db.from('lopa_attachment_versions').update({ status: 'Superseded', superseded_by_version_id: versionRow.id }).eq('tenant_id', tenantId).eq('id', oldVersion.id).select('id').single());
    const row = await this.db.single<any>(this.db.from('lopa_attachments').update({ file_name: dto.fileName ?? file.originalname, original_file_name: file.originalname, file_type: file.originalname.split('.').pop()?.toUpperCase(), mime_type: file.mimetype, file_size: file.size, storage_key: storageKey, version, revision: `v${version}`, status: 'Active', updated_at: now, updated_by: actorId }).eq('tenant_id', tenantId).eq('id', attachmentId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'ATTACHMENT_REPLACED', 'Attachment version replaced', row.file_name, { attachmentId, previousVersion: before.version, version } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.attachments.version.create', 'LOPA_ATTACHMENT', attachmentId, row as JsonValue); return this.attachmentDetail(tenantId, id, attachmentId, scope);
  }

  async attachmentDocumentSearch(tenantId: string, id: string, q: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); let query: any = this.db.from('documents').select('id,document_number,title,document_type,status,revision,effective_date,site_id').eq('tenant_id', tenantId).eq('site_id', study.site_id).order('updated_at', { ascending: false }).limit(30);
    if (q) query = query.or(`document_number.ilike.%${q}%,title.ilike.%${q}%`); return this.optionalMany('documents', () => query);
  }

  async linkAttachmentDocument(tenantId: string, actorId: string, id: string, dto: LopaAttachmentDocumentLinkDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study);
    const document = await this.db.single<any>(this.db.from('documents').select('*').eq('tenant_id', tenantId).eq('id', dto.documentId).eq('site_id', study.site_id).single());
    const row = await this.db.single<any>(this.db.from('lopa_attachment_document_links').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, attachment_id: dto.attachmentId ?? null, document_id: document.id, document_number_snapshot: document.document_number, document_title_snapshot: document.title, document_revision_snapshot: document.revision ?? null, document_status_snapshot: document.status, relationship: dto.relationship ?? 'Supporting evidence', required_evidence: !!dto.requiredEvidence, linked_by: actorId }).select().single());
    await this.writeHistory(tenantId, id, actorId, 'CONTROLLED_DOCUMENT_LINKED', 'Controlled document linked', document.title ?? document.document_number, { documentLinkId: row.id, documentId: document.id } as JsonValue); await this.writeAudit(tenantId, actorId, 'lopa.attachments.document_link.manage', 'LOPA_ATTACHMENT_DOCUMENT_LINK', row.id, row as JsonValue); return row;
  }

  async unlinkAttachmentDocument(tenantId: string, actorId: string, id: string, linkId: string, reason: string | undefined, scope: Scope) { const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); const row = await this.db.single<any>(this.db.from('lopa_attachment_document_links').update({ unlinked_by: actorId, unlinked_at: new Date().toISOString(), unlink_reason: reason }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', linkId).select().single()); await this.writeHistory(tenantId, id, actorId, 'CONTROLLED_DOCUMENT_UNLINKED', 'Controlled document unlinked', row.document_title_snapshot ?? row.document_number_snapshot, this.clean({ documentLinkId: linkId, reason }) as JsonValue); return row; }

  async upsertEvidenceMapping(tenantId: string, actorId: string, id: string, mappingId: string | null, dto: LopaEvidenceMappingDto, scope: Scope) { const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); if (!dto.attachmentId && !dto.documentLinkId) throw new BadRequestException('Map an attachment or controlled document link.'); const now = new Date().toISOString(); const payload = this.clean({ id: mappingId ?? crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, attachment_id: dto.attachmentId, document_link_id: dto.documentLinkId, related_tab: dto.relatedTab, related_record_type: dto.relatedRecordType, related_record_id: dto.relatedRecordId, evidence_purpose: dto.evidencePurpose, required: !!dto.required, blocking_if_missing: !!dto.blockingIfMissing, notes: dto.notes, updated_by: actorId, updated_at: now, ...(mappingId ? {} : { created_by: actorId }) }); const row = mappingId ? await this.db.single<any>(this.db.from('lopa_attachment_evidence_mappings').update(payload).eq('tenant_id', tenantId).eq('id', mappingId).select().single()) : await this.db.single<any>(this.db.from('lopa_attachment_evidence_mappings').insert(payload).select().single()); const metadata = { mappingId: row.id, relatedTab: dto.relatedTab } as JsonValue; await this.writeHistory(tenantId, id, actorId, mappingId ? 'EVIDENCE_MAPPING_UPDATED' : 'EVIDENCE_MAPPING_CREATED', 'Attachment evidence mapping saved', dto.evidencePurpose, metadata); await this.writeAudit(tenantId, actorId, 'lopa.attachments.evidence.manage', 'LOPA_ATTACHMENT_EVIDENCE_MAPPING', row.id, metadata); await this.attachmentReadiness(tenantId, id, scope); return row; }

  async deleteEvidenceMapping(tenantId: string, actorId: string, id: string, mappingId: string, reason: string | undefined, scope: Scope) { const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); const row = await this.db.single<any>(this.db.from('lopa_attachment_evidence_mappings').delete().eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', mappingId).select().single()); const metadata = this.clean({ mappingId, reason }) as JsonValue; await this.writeHistory(tenantId, id, actorId, 'EVIDENCE_MAPPING_DELETED', 'Attachment evidence mapping removed', row.evidence_purpose, metadata); await this.writeAudit(tenantId, actorId, 'lopa.attachments.evidence.manage', 'LOPA_ATTACHMENT_EVIDENCE_MAPPING', mappingId, metadata); await this.attachmentReadiness(tenantId, id, scope); return row; }

  async addAttachmentComment(tenantId: string, actorId: string, id: string, attachmentId: string, dto: LopaAttachmentCommentDto, scope: Scope) { const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); const row = await this.db.single<any>(this.db.from('lopa_attachment_comments').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, attachment_id: attachmentId, comment_type: dto.commentType ?? 'General note', comment_text: dto.commentText, status: dto.status ?? 'Open', created_by: actorId, updated_by: actorId }).select().single()); const metadata = { attachmentId, commentId: row.id } as JsonValue; await this.writeHistory(tenantId, id, actorId, 'ATTACHMENT_COMMENTED', 'Attachment comment added', dto.commentText, metadata); await this.writeAudit(tenantId, actorId, 'lopa.attachments.comments.manage', 'LOPA_ATTACHMENT_COMMENT', row.id, metadata); return row; }

  async attachmentBulkUpdate(tenantId: string, actorId: string, id: string, dto: LopaAttachmentBulkDto, scope: Scope) { const study = await this.studyRecord(tenantId, id, scope); this.assertMutable(study); if (!dto.attachmentIds.length) throw new BadRequestException('Select attachments first.'); const now = new Date().toISOString(); const archive = dto.action === 'archive', restore = dto.action === 'restore', remove = dto.action === 'delete'; const patch = this.clean({ classification: dto.classification, evidence_category: dto.evidenceCategory, related_tab: dto.relatedTab, archived_at: archive ? now : restore ? null : undefined, archived_by: archive ? actorId : restore ? null : undefined, archive_reason: archive ? dto.reason : restore ? null : undefined, deleted_at: remove ? now : undefined, deleted_by: remove ? actorId : undefined, delete_reason: remove ? dto.reason : undefined, status: archive ? 'Archived' : restore ? 'Active' : remove ? 'Deleted' : undefined, updated_by: actorId, updated_at: now }); const rows = await this.optionalMany('lopa_attachments', q => q.update(patch).eq('tenant_id', tenantId).eq('lopa_study_id', id).in('id', dto.attachmentIds).select()); const metadata = this.clean({ count: rows.length, action: dto.action, reason: dto.reason }) as JsonValue; await this.writeHistory(tenantId, id, actorId, 'ATTACHMENT_BULK_UPDATED', 'Attachment bulk action completed', dto.action ?? 'Metadata updated', metadata); await this.writeAudit(tenantId, actorId, 'lopa.attachments.edit', 'LOPA', id, metadata); await this.attachmentReadiness(tenantId, id, scope); return rows; }

  async lopaHistoryEvent(tenantId: string, id: string, eventId: string, scope: Scope) { await this.studyRecord(tenantId, id, scope); const event = await this.db.single<any>(this.db.from('lopa_history_events').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', eventId).single()); return this.safeHistoryEvent(event); }
  async lopaHistoryDiff(tenantId: string, id: string, eventId: string, scope: Scope) { const event = await this.lopaHistoryEvent(tenantId, id, eventId, scope); const before = event.before_values_json ?? event.metadata?.before ?? null, after = event.after_values_json ?? event.metadata?.after ?? null; const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])]; return { eventId, rows: keys.filter(key => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])).map(key => ({ field: key, previousValue: before?.[key] ?? null, newValue: after?.[key] ?? null, changeType: before?.[key] == null ? 'Added' : after?.[key] == null ? 'Removed' : 'Updated' })) }; }
  async lopaHistoryExport(tenantId: string, actorId: string, id: string, query: LopaAttachmentFilterDto, scope: Scope) { const data = await this.lopaHistory(tenantId, id, query, scope); const payload = this.clean({ filters: { ...query } }) as unknown as JsonValue; await this.writeHistory(tenantId, id, actorId, 'HISTORY_EXPORTED', 'LOPA history exported', 'Filtered audit history export generated.', payload); await this.writeAudit(tenantId, actorId, 'lopa.history.export', 'LOPA', id, payload); return { generatedAt: new Date().toISOString(), ...data }; }

  async lopaHistory(tenantId: string, id: string, query: LopaAttachmentFilterDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope); const events = await this.optionalMany('lopa_history_events', q => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }));
    const filtered = events.filter((event: any) => this.historyMatches(event, query)); const page = Math.max(Number(query.page ?? 1), 1), limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 100);
    const safe = filtered.map((event: any) => this.safeHistoryEvent(event)); const byModule = Object.values(safe.reduce((map: any, event: any) => { const key = event.event_category ?? this.historyCategory(event.event_type); map[key] = { module: key, total: (map[key]?.total ?? 0) + 1, lastEventAt: event.created_at, critical: (map[key]?.critical ?? 0) + (event.severity === 'Critical' ? 1 : 0) }; return map; }, {}));
    const countModule = (module: string) => safe.filter((event: any) => event.event_category === module).length; const countType = (value: string) => safe.filter((event: any) => String(event.event_type ?? '').toUpperCase().includes(value)).length;
    return { header: { lopaNumber: study.lopa_number, title: study.title, status: study.status, totalEvents: safe.length, lastEventAt: safe[0]?.created_at ?? null }, summary: { total: safe.length, critical: safe.filter((event: any) => event.severity === 'Critical').length, userEvents: safe.filter((event: any) => event.actor_id).length, systemEvents: safe.filter((event: any) => !event.actor_id).length, statusChanges: countType('STATUS'), calculationEvents: countModule('Risk Calculation'), iplEvents: countModule('IPLs / Safeguards'), silEvents: countModule('SIL Determination / SIF Specification'), recommendationActionEvents: countModule('Recommendations / Actions'), teamSessionEvents: countModule('Team & Sessions'), attachmentEvents: countModule('Attachments'), linkedRecordEvents: countModule('Linked Records'), reviewEvents: countModule('Review & Sign-Off'), signatureEvents: countModule('E-Signature'), reopenRevisionEvents: countType('REOPEN') + countType('SUPERSEDE'), currentRevision: study.revision ?? study.version ?? null, auditTrailComplete: !safe.some((event: any) => event.restricted), lastActivity: safe[0]?.created_at ?? null }, timeline: safe.slice(0, 50), register: { rows: safe.slice((page - 1) * limit, page * limit), total: safe.length, page, limit }, moduleBreakdown: byModule, workflowTimeline: safe.filter((event: any) => ['Review & Sign-Off', 'E-Signature', 'Workflow'].includes(this.historyCategory(event.event_type))) };
  }

  async lopaHistoryTimeline(tenantId: string, id: string, query: LopaAttachmentFilterDto, scope: Scope) {
    const history = await this.lopaHistory(tenantId, id, { ...query, page: '1', limit: '100' }, scope);
    const groups = history.timeline.reduce((result: Record<string, any[]>, event: any) => { const key = event.created_at ? new Date(event.created_at).toISOString().slice(0, 10) : 'Unknown date'; (result[key] ??= []).push(event); return result; }, {});
    return Object.entries(groups).map(([date, events]) => ({ date, events }));
  }

  async lopaHistoryContext(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return { modules: ['Study', 'Overview', 'Scenario & Consequence', 'Initiating Event', 'Conditional Modifiers', 'IPLs / Safeguards', 'IPL Registry Usage', 'Risk Calculation', 'SIL Determination / SIF Specification', 'Recommendations / Actions', 'Team & Sessions', 'Linked Records', 'Attachments', 'Review & Sign-Off', 'E-Signature', 'Workflow', 'System', 'Permission / Access', 'Other'], eventTypes: ['Created', 'Updated', 'Deleted', 'Restored', 'Uploaded', 'Downloaded', 'Linked', 'Unlinked', 'Status Changed', 'Submitted', 'Approved', 'Rejected', 'Signed', 'Reopened', 'Locked', 'Unlocked', 'Calculated', 'Recalculated', 'Validated', 'Credited', 'Uncredited', 'Superseded', 'Commented', 'Action Created', 'Action Closed', 'Notification Sent', 'Exported', 'Permission Changed', 'System Generated'], severities: ['Info', 'Low', 'Medium', 'High', 'Critical'] };
  }

  async lopaHistoryAuditMetadata(tenantId: string, id: string, eventId: string, scope: Scope) {
    const event = await this.lopaHistoryEvent(tenantId, id, eventId, scope);
    if (event.restricted) return { restricted: true, message: 'Audit metadata is restricted.' };
    const audit = event.audit_log_id ? await this.optionalSingle(this.db.from('AuditLog').select('id,action,entityType,entityId,severity,createdAt,metadata').eq('tenantId', tenantId).eq('id', event.audit_log_id).single()) : null;
    return { eventId: event.id, auditLogId: event.audit_log_id ?? audit?.id ?? null, sourceSystem: event.source_system ?? 'PSM OS', sourceApi: event.source_api ?? audit?.action ?? null, actorUserId: event.actor_user_id ?? event.actor_id ?? audit?.actorId ?? null, actorRole: event.actor_role ?? null, correlationId: event.correlation_id ?? event.request_id ?? null, createdAt: event.created_at, retentionStatus: event.retention_status ?? 'Active', integrityHash: event.integrity_hash ?? null, metadata: event.metadata_json ?? event.metadata ?? audit?.metadata ?? null };
  }

  private attachmentRequirementsFor(study: any) { return [
    { key: 'scenario', label: 'Scenario / consequence basis', tab: 'scenario', required: true }, { key: 'initiating-event', label: 'Initiating event source/reference', tab: 'initiating-event', required: true }, { key: 'risk-calculation', label: 'Risk calculation basis', tab: 'risk-calculation', required: true }, { key: 'hazop-source', label: 'HAZOP source snapshot', tab: 'scenario', required: !!study.source_hazop_scenario_id }, { key: 'sil', label: 'SIL/SIF evidence', tab: 'sil', required: !!study.sil_required }, { key: 'review', label: 'Review/sign-off evidence', tab: 'review', required: ['Approved', 'Closed'].includes(study.status) }
  ]; }
  private attachmentSummary(rows: any[], links: any[], readiness: any) { const active = rows.filter(row => !row.deleted_at && !row.archived_at); const byEvidence = (value: string) => active.filter(row => row.evidence_category === value).length; return { totalAttachments: rows.length, uploadedFiles: active.length, controlledDocumentsLinked: links.length, requiredEvidenceComplete: readiness.checklist.filter((x: any) => x.status === 'Complete').length, requiredEvidenceMissing: readiness.missingRequiredCount, evidenceFiles: active.filter(row => row.attachment_type === 'Evidence File').length, calculationEvidence: byEvidence('Risk Calculation'), iplEvidence: byEvidence('IPL Validation') + byEvidence('IPL Proof Test') + byEvidence('IPL PFD/RRF Basis'), silEvidence: byEvidence('SIL Determination') + byEvidence('SIF Specification'), teamEvidence: byEvidence('Team Session') + byEvidence('Meeting Minutes'), reviewEvidence: byEvidence('Review Comment') + byEvidence('Approval / Sign-Off'), recommendationClosureEvidence: byEvidence('Recommendation Closure'), filesPendingReview: active.filter(x => x.status === 'Pending Review').length, filesApproved: active.filter(x => x.status === 'Approved').length, filesRejected: active.filter(x => x.status === 'Rejected').length, filesSuperseded: active.filter(x => x.status === 'Superseded').length, filesArchivedDeleted: rows.filter(x => x.archived_at || x.deleted_at).length, missingClassification: active.filter(x => !x.classification).length, restricted: active.filter(x => x.access_level === 'Restricted' || x.restricted || x.classification === 'Restricted').length, largeFiles: active.filter(x => Number(x.file_size ?? 0) >= 10 * 1024 * 1024).length, recentUploads: active.filter(x => Date.parse(x.uploaded_at ?? '') >= Date.now() - 7 * 86400000).length, lastUploadedAt: active[0]?.uploaded_at ?? null, lastUploadedBy: active[0]?.uploaded_by ?? null, readyForReview: readiness.status === 'Complete' }; }
  private safeAttachment(row: any) { const restricted = ['Restricted', 'Owner only'].includes(row.access_level) || row.classification === 'Restricted'; return restricted ? { id: row.id, attachment_number: row.attachment_number, file_name: 'Restricted attachment', status: 'Restricted', restricted: true, access_level: row.access_level, uploaded_at: row.uploaded_at } : { ...row, restricted: false }; }
  private attachmentMatches(row: any, query: LopaAttachmentFilterDto) { const q = String(query.q ?? '').toLowerCase(); const isTrue = (value: string | undefined) => value === 'true'; return (!q || [row.file_name,row.description,row.attachment_number,row.evidence_category,row.tags_json,row.source_reference,row.related_record_id].some(value => String(value ?? '').toLowerCase().includes(q))) && (!query.attachmentType || row.attachment_type === query.attachmentType) && (!query.evidenceCategory || row.evidence_category === query.evidenceCategory) && (!query.relatedTab || row.related_tab === query.relatedTab) && (!query.status || row.status === query.status) && (!query.classification || row.classification === query.classification) && (!query.accessLevel || row.access_level === query.accessLevel) && (!query.uploadedBy || row.uploaded_by === query.uploadedBy) && (!query.fileType || row.file_type === query.fileType) && (!query.requiredEvidence || Boolean(row.required_evidence) === isTrue(query.requiredEvidence)) && (!query.restricted || Boolean(row.restricted || row.access_level === 'Restricted' || row.classification === 'Restricted') === isTrue(query.restricted)) && (!query.archived || Boolean(row.archived_at || row.deleted_at) === isTrue(query.archived)) && (!query.dateFrom || String(row.uploaded_at ?? '') >= query.dateFrom) && (!query.dateTo || String(row.uploaded_at ?? '') <= `${query.dateTo}T23:59:59.999Z`); }
  private assertLopaAttachmentFile(file: UploadedLopaFile) { const allowed = ['pdf','png','jpg','jpeg','gif','txt','csv','xlsx','xls','doc','docx','ppt','pptx']; const ext = file.originalname.split('.').pop()?.toLowerCase(); if (!ext || !allowed.includes(ext)) throw new BadRequestException('Unsupported attachment file type.'); if (file.size > 25 * 1024 * 1024) throw new BadRequestException('Attachment exceeds the 25 MB upload limit.'); }
  private historyCategory(eventType: string) { const key = String(eventType ?? '').toUpperCase(); if (key.includes('ATTACH')) return 'Attachments'; if (key.includes('SIL') || key.includes('SIF')) return 'SIL Determination / SIF Specification'; if (key.includes('RISK') || key.includes('CALCULATION')) return 'Risk Calculation'; if (key.includes('IPL') || key.includes('SAFEGUARD')) return 'IPLs / Safeguards'; if (key.includes('TEAM') || key.includes('SESSION')) return 'Team & Sessions'; if (key.includes('REVIEW') || key.includes('SIGNOFF') || key.includes('SIGNATURE')) return 'Review & Sign-Off'; if (key.includes('RECOMMEND') || key.includes('ACTION')) return 'Recommendations / Actions'; if (key.includes('LINK')) return 'Linked Records'; return 'Study'; }
  private historyMatches(event: any, query: LopaAttachmentFilterDto) { const q = String(query.q ?? '').toLowerCase(); const category = event.event_category ?? this.historyCategory(event.event_type); const hasDiff = !!(event.before_values_json ?? event.after_values_json ?? event.metadata?.before ?? event.metadata?.after); const workflow = ['Review & Sign-Off', 'E-Signature', 'Workflow'].includes(category); return (!q || [event.id,event.event_number,event.title,event.event_title,event.description,event.event_description,event.event_type,event.reason,event.related_record_number,event.audit_log_id].some(value => String(value ?? '').toLowerCase().includes(q))) && (!query.status || event.severity === query.status) && (!query.severity || event.severity === query.severity) && (!query.eventType || event.event_type === query.eventType) && (!query.relatedTab || category === query.relatedTab) && (!query.actorId || (event.actor_user_id ?? event.actor_id) === query.actorId) && (!query.hasDiff || hasDiff === (query.hasDiff === 'true')) && (!query.workflowOnly || workflow === (query.workflowOnly === 'true')) && (!query.dateFrom || String(event.created_at ?? '') >= query.dateFrom) && (!query.dateTo || String(event.created_at ?? '') <= `${query.dateTo}T23:59:59.999Z`); }
  private safeHistoryEvent(event: any) { const restricted = event.metadata?.restricted === true || event.metadata_json?.restricted === true; return restricted ? { id: event.id, event_number: event.event_number, created_at: event.created_at, event_type: 'Restricted event', event_category: 'Restricted', title: 'Restricted audit event', description: 'You do not have access to the event details.', severity: event.severity, restricted: true } : { ...event, title: event.title ?? event.event_title, description: event.description ?? event.event_description, metadata: event.metadata ?? event.metadata_json, event_category: event.event_category ?? this.historyCategory(event.event_type), restricted: false }; }

  async recommendationsContext(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const users = await this.optionalMany('User', (q) => q.select('id,email,displayName,title,status,tenantId').eq('tenantId', tenantId).neq('status', 'INACTIVE').order('displayName'));
    return {
      readOnly: this.isReadOnly(study),
      users,
      recommendationTypes: ['Add IPL', 'Improve IPL', 'Validate IPL', 'Add SIF/SIS', 'Perform SIL verification', 'Initiate MOC', 'Update procedure', 'Update alarm rationalization', 'Perform proof test', 'Perform inspection', 'Add evidence/documentation', 'Review initiating event frequency', 'Review conditional modifier', 'Recalculate LOPA', 'Additional engineering review', 'Training/action', 'Maintenance/action', 'Other'],
      statuses: ['Draft', 'Open', 'Accepted', 'In Progress', 'Completed', 'Verified', 'Rejected', 'Deferred', 'Cancelled', 'Closed'],
      priorities: ['Low', 'Medium', 'High', 'Critical'],
      riskRelevance: ['Risk gap', 'SIL required', 'IPL gap', 'Calculation blocker', 'Evidence gap', 'Review blocker', 'Compliance gap', 'Other']
    };
  }

  async recommendationsTab(tenantId: string, id: string, query: LopaRecommendationFilterDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [recommendations, actions, sourceFindings, readiness, context] = await Promise.all([
      this.recommendationsList(tenantId, id, query, scope),
      this.lopaActions(tenantId, id, scope),
      this.recommendationSourceFindings(tenantId, id, scope),
      this.recommendationsReadiness(tenantId, id, scope),
      this.recommendationsContext(tenantId, id, scope)
    ]);
    return {
      readOnly: this.isReadOnly(study),
      header: {
        lopaNumber: study.lopa_number,
        title: study.title,
        status: study.status,
        lastSyncedAt: new Date().toISOString()
      },
      summary: this.recommendationsSummaryFrom(recommendations.rows, actions),
      sourceFindings,
      recommendations,
      actions,
      readiness,
      context,
      riskGapActions: actions.filter((action: any) => ['Risk gap', 'SIL required', 'Calculation blocker'].includes(action.risk_relevance ?? action.sourceType)),
      iplGapActions: actions.filter((action: any) => String(action.title ?? '').toLowerCase().includes('ipl') || String(action.sourceType ?? '').toLowerCase().includes('ipl')),
      evidence: await this.recommendationEvidenceRows(tenantId, id),
      overdue: actions.filter((action: any) => this.isOverdue(action.dueDate) || this.isOverdue(action.due_date))
    };
  }

  async recommendationsList(tenantId: string, id: string, query: LopaRecommendationFilterDto, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const rows = await this.optionalMany('lopa_recommendations', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('deleted_at', null).order('updated_at', { ascending: false }));
    const links = await this.recommendationActionLinks(tenantId, id);
    const actions = await this.actionRowsByIds(tenantId, links.map((link: any) => link.action_id));
    const actionById = new Map(actions.map((action: any) => [action.id, action]));
    const enriched = rows.map((row: any) => {
      const rowLinks = links.filter((link: any) => link.recommendation_id === row.id && !link.unlinked_at);
      const linkedActions = rowLinks.map((link: any) => ({ ...link, action: actionById.get(link.action_id) })).filter((link: any) => link.action);
      return { ...row, linkedActions, linkedActionsCount: linkedActions.length, openActionsCount: linkedActions.filter((link: any) => !this.isActionClosed(link.action)).length };
    });
    let filtered = this.applyRecommendationFilters(enriched, query);
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 100);
    return { rows: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit };
  }

  async recommendationDetail(tenantId: string, id: string, recommendationId: string, scope: Scope) {
    const list = await this.recommendationsList(tenantId, id, {}, scope);
    const row = list.rows.find((item: any) => item.id === recommendationId);
    if (!row) throw new NotFoundException('LOPA recommendation not found');
    const evidence = await this.recommendationEvidenceRows(tenantId, id, recommendationId);
    return { ...row, evidence, history: [] };
  }

  async recommendationSourceFindings(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [riskReadiness, riskGaps, iplGaps, candidates] = await Promise.all([
      this.riskCalculationReadiness(tenantId, id, scope),
      this.riskCalculationGaps(tenantId, id, scope),
      this.iplsSafeguardsGaps(tenantId, id, scope, false),
      this.optionalMany('lopa_study_ipl_candidates', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).neq('status', 'Archived'))
    ]);
    const findings: any[] = [];
    if (String(study.risk_gap_status ?? study.risk_gap ?? '').toLowerCase().includes('gap')) findings.push(this.sourceFinding(id, 'Risk gap open from Risk Calculation', 'Risk Calculation', 'lopa_studies', 'High', `Risk gap is ${study.risk_gap ?? study.risk_gap_status}.`, true, 'Create recommendation to add IPL, determine SIL, or justify residual risk.'));
    if (study.sil_required || study.sil_evaluation_required) findings.push(this.sourceFinding(id, 'SIL evaluation required', 'Risk Calculation', 'lopa_studies', 'High', 'SIL evaluation is required by the latest risk calculation.', true, 'Create SIL determination action.'));
    for (const blocker of riskReadiness.blockers ?? []) findings.push(this.sourceFinding(blocker.key ?? blocker.title, 'Calculation blocker', 'Risk Calculation', blocker.key, blocker.severity === 'Hard' ? 'High' : 'Medium', blocker.title, blocker.severity !== 'Warning', 'Resolve missing calculation input.'));
    for (const gap of riskGaps) findings.push(this.sourceFinding(gap.id, gap.gap_type, 'Risk Calculation', gap.id, gap.severity, gap.gap_title, !!gap.closure_blocker, 'Create recommendation/action from calculation gap.'));
    for (const gap of iplGaps) findings.push(this.sourceFinding(gap.id ?? gap.title, gap.gap_type ?? 'IPL gap', 'IPLs / Safeguards', gap.ipl_candidate_id, gap.severity ?? 'Medium', gap.title ?? gap.gap_title, !!gap.blocking || !!gap.closure_blocker, 'Create recommendation/action to close IPL gap.'));
    if (!candidates.some((candidate: any) => candidate.credited_in_calculation)) findings.push(this.sourceFinding(`${id}-no-credited-ipl`, 'No credited IPL', 'IPLs / Safeguards', id, 'High', 'No IPL is currently credited for this LOPA study.', true, 'Validate or add a creditable IPL.'));
    return findings;
  }

  async createRecommendation(tenantId: string, actorId: string, id: string, dto: UpsertLopaRecommendationDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    this.validateRecommendation(dto);
    const row = await this.db.single<any>(this.db.from('lopa_recommendations').insert(this.recommendationPayload(tenantId, actorId, study, id, dto, {
      id: crypto.randomUUID(),
      recommendation_number: await this.nextRecommendationNumber(tenantId, id),
      created_by: actorId
    })).select().single());
    await this.updateRecommendationStudyStatus(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_RECOMMENDATION_CREATED', 'Recommendation created', row.title, { recommendationId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.recommendation.create', 'LOPA', id, row as JsonValue);
    return row;
  }

  async updateRecommendation(tenantId: string, actorId: string, id: string, recommendationId: string, dto: UpsertLopaRecommendationDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    this.validateRecommendation(dto);
    const before = await this.db.single<any>(this.db.from('lopa_recommendations').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', recommendationId).single());
    const row = await this.db.single<any>(this.db.from('lopa_recommendations').update(this.recommendationPayload(tenantId, actorId, study, id, dto, { updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('id', recommendationId).select().single());
    await this.updateRecommendationStudyStatus(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_RECOMMENDATION_UPDATED', 'Recommendation updated', row.title, { recommendationId });
    await this.writeAudit(tenantId, actorId, 'lopa.recommendation.update', 'LOPA', id, { before, after: row } as unknown as JsonValue);
    return row;
  }

  async deleteRecommendation(tenantId: string, actorId: string, id: string, recommendationId: string, reason: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_recommendations').update({ deleted_by: actorId, deleted_at: new Date().toISOString(), status: 'Cancelled', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', recommendationId).select().single());
    await this.updateRecommendationStudyStatus(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_RECOMMENDATION_DELETED', 'Recommendation voided', reason ?? row.title, { recommendationId });
    await this.writeAudit(tenantId, actorId, 'lopa.recommendation.delete', 'LOPA', id, this.clean({ recommendationId, reason }) as JsonValue);
    return row;
  }

  async changeRecommendationStatus(tenantId: string, actorId: string, id: string, recommendationId: string, dto: LopaRecommendationStatusDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const recommendation = await this.recommendationDetail(tenantId, id, recommendationId, scope);
    if (['Closed', 'Completed', 'Verified'].includes(dto.status) && recommendation.blocking && recommendation.openActionsCount > 0) throw new BadRequestException('Blocking recommendation cannot close while linked blocking actions are open.');
    if (['Rejected'].includes(dto.status) && !dto.reason) throw new BadRequestException('Rejected recommendation requires a reason.');
    if (['Deferred'].includes(dto.status) && !dto.reason) throw new BadRequestException('Deferred recommendation requires a reason.');
    const patch: any = { status: dto.status, updated_by: actorId, updated_at: new Date().toISOString() };
    if (dto.status === 'Rejected') patch.rejection_reason = dto.reason;
    if (dto.status === 'Deferred') patch.defer_reason = dto.reason;
    if (dto.closureNotes) patch.closure_notes = dto.closureNotes;
    const row = await this.db.single<any>(this.db.from('lopa_recommendations').update(patch).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', recommendationId).select().single());
    await this.updateRecommendationStudyStatus(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_RECOMMENDATION_STATUS_CHANGED', 'Recommendation status changed', `${row.recommendation_number}: ${dto.status}`, { recommendationId, status: dto.status });
    await this.writeAudit(tenantId, actorId, 'lopa.recommendation.change_status', 'LOPA', id, this.clean({ recommendationId, ...dto }) as JsonValue);
    return row;
  }

  async verifyRecommendation(tenantId: string, actorId: string, id: string, recommendationId: string, dto: LopaRecommendationVerifyDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_recommendations').update({ status: 'Verified', closure_evidence_status: dto.closureEvidenceStatus ?? 'Verified', verified_by: actorId, verified_at: new Date().toISOString(), verification_notes: dto.verificationNotes, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', recommendationId).select().single());
    await this.updateRecommendationStudyStatus(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_RECOMMENDATION_VERIFIED', 'Recommendation verified', row.title, { recommendationId });
    return row;
  }

  async reopenRecommendation(tenantId: string, actorId: string, id: string, recommendationId: string, reason: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_recommendations').update({ status: 'Open', verification_notes: reason ?? null, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', recommendationId).select().single());
    await this.updateRecommendationStudyStatus(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_RECOMMENDATION_REOPENED', 'Recommendation reopened', reason ?? row.title, { recommendationId });
    return row;
  }

  async lopaActions(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const links = await this.recommendationActionLinks(tenantId, id);
    const linkedIds = links.filter((link: any) => !link.unlinked_at).map((link: any) => link.action_id);
    const sourceActions = await this.optionalMany('Action', (q) => q.select('*, owner:User!Action_assignedToId_fkey(id,displayName,email,title)').eq('tenantId', tenantId).eq('moduleKey', 'LOPA').eq('sourceId', id));
    const linkedActions = await this.actionRowsByIds(tenantId, linkedIds);
    const byId = new Map([...sourceActions, ...linkedActions].map((action: any) => [action.id, action]));
    return [...byId.values()].map((action: any) => ({ ...action, links: links.filter((link: any) => link.action_id === action.id && !link.unlinked_at) }));
  }

  async createLopaActionFromRecommendation(tenantId: string, actorId: string, id: string, dto: CreateLopaActionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const action = await this.createUniversalAction(tenantId, actorId, study, id, dto);
    if (dto.recommendationId) await this.linkExistingLopaAction(tenantId, actorId, id, { actionId: action.id, recommendationId: dto.recommendationId, relationshipType: 'Execution Action', blocking: dto.blocking ?? true }, scope);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_ACTION_CREATED', 'Universal action created from LOPA', action.title, { actionId: action.id, recommendationId: dto.recommendationId ?? null });
    return action;
  }

  async linkExistingLopaAction(tenantId: string, actorId: string, id: string, dto: LinkExistingLopaActionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    await this.db.single<any>(this.db.from('Action').select('id').eq('tenantId', tenantId).eq('id', dto.actionId).single());
    const row = await this.db.single<any>(this.db.from('lopa_recommendation_action_links').insert(this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id,
      lopa_study_id: id,
      recommendation_id: dto.recommendationId,
      action_id: dto.actionId,
      relationship_type: dto.relationshipType ?? 'Linked Action',
      blocking: dto.blocking ?? true,
      linked_by: actorId
    })).select().single());
    await this.updateRecommendationStudyStatus(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_ACTION_LINKED', 'Action linked to LOPA', dto.actionId, { actionLinkId: row.id, recommendationId: dto.recommendationId ?? null });
    return row;
  }

  async unlinkLopaAction(tenantId: string, actorId: string, id: string, actionLinkId: string, reason: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    if (!reason) throw new BadRequestException('Unlinking an action requires a reason.');
    const row = await this.db.single<any>(this.db.from('lopa_recommendation_action_links').update({ unlinked_by: actorId, unlinked_at: new Date().toISOString(), unlink_reason: reason }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', actionLinkId).select().single());
    await this.updateRecommendationStudyStatus(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_ACTION_UNLINKED', 'Action unlinked from LOPA', reason, { actionLinkId });
    return row;
  }

  async syncLopaActions(tenantId: string, actorId: string, id: string, scope: Scope) {
    const actions = await this.lopaActions(tenantId, id, scope);
    await this.updateRecommendationStudyStatus(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_ACTIONS_SYNCED', 'LOPA actions synced', `${actions.length} actions synced from Universal Action Engine.`, { count: actions.length });
    return actions;
  }

  async verifyLopaActionClosure(tenantId: string, actorId: string, id: string, actionId: string, notes: string | undefined, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const action = await this.db.single<any>(this.db.from('Action').update({ status: 'VERIFIED', verifiedById: actorId, verifiedAt: new Date().toISOString(), verificationNotes: notes ?? null, updatedAt: new Date().toISOString() }).eq('tenantId', tenantId).eq('id', actionId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_ACTION_CLOSURE_VERIFIED', 'Action closure verified', action.title, { actionId });
    return action;
  }

  async escalateLopaActions(tenantId: string, actorId: string, id: string, dto: LopaActionReasonDto, scope: Scope) {
    const actions = await this.lopaActions(tenantId, id, scope);
    const overdue = actions.filter((action: any) => this.isOverdue(action.dueDate));
    await this.writeHistory(tenantId, id, actorId, 'LOPA_ACTIONS_ESCALATED', 'LOPA actions escalated', dto.reason ?? `${overdue.length} overdue actions escalated.`, { count: overdue.length });
    return { escalated: overdue.length, actions: overdue };
  }

  async sendLopaActionReminder(tenantId: string, actorId: string, id: string, dto: LopaActionReasonDto, scope: Scope) {
    const actions = await this.lopaActions(tenantId, id, scope);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_ACTION_REMINDERS_SENT', 'LOPA action reminders sent', dto.reason ?? `${actions.length} action reminders queued.`, { count: actions.length });
    return { remindersQueued: actions.length };
  }

  async recommendationEvidenceRows(tenantId: string, id: string, recommendationId?: string) {
    return this.optionalMany('lopa_recommendation_evidence_links', (q) => {
      let query = q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('linked_at', { ascending: false });
      if (recommendationId) query = query.eq('recommendation_id', recommendationId);
      return query;
    });
  }

  async createRecommendationEvidence(tenantId: string, actorId: string, id: string, recommendationId: string, dto: any, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_recommendation_evidence_links').insert(this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id,
      lopa_study_id: id,
      recommendation_id: recommendationId,
      evidence_type: dto.evidenceType,
      source_module: dto.sourceModule,
      source_record_id: dto.sourceRecordId,
      document_id: dto.documentId,
      relationship_type: dto.relationshipType,
      required: dto.required ?? false,
      status: dto.status ?? 'Linked',
      linked_by: actorId,
      notes: dto.notes
    })).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_RECOMMENDATION_EVIDENCE_LINKED', 'Recommendation evidence linked', row.evidence_type, { recommendationId, evidenceId: row.id });
    return row;
  }

  async deleteRecommendationEvidence(tenantId: string, actorId: string, id: string, evidenceId: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.optionalSingle(this.db.from('lopa_recommendation_evidence_links').delete().eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', evidenceId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_RECOMMENDATION_EVIDENCE_UNLINKED', 'Recommendation evidence unlinked', evidenceId, { evidenceId });
    return row ?? { id: evidenceId, deleted: true };
  }

  async linkedRecordsContext(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    return {
      readOnly: this.isReadOnly(study),
      recordTypes: ['HAZOP/PHA', 'HAZOP node', 'HAZOP deviation', 'HAZOP safeguard', 'MOC', 'PSSR', 'Incident', 'Audit finding', 'Equipment', 'Document', 'IPL Registry record', 'IPL candidate', 'SIF/SIS record', 'Proof test record', 'Inspection record', 'Recommendation', 'Action', 'Risk calculation version', 'Other'],
      relationshipTypes: ['Source record', 'Derived from', 'Supports calculation', 'Evidence', 'Required evidence', 'Related equipment', 'Protected equipment', 'IPL device', 'Action source', 'Closure evidence', 'Review evidence', 'Triggered by', 'Blocks closure', 'Supersedes', 'Superseded by', 'Other'],
      sourceModules: ['HAZOP', 'MOC', 'PSSR', 'Incident', 'Audit', 'Equipment', 'Documents', 'IPL Registry', 'SIS/SIF', 'Mechanical Integrity', 'Actions', 'Recommendations', 'Risk Calculation']
    };
  }

  async linkedRecordsTab(tenantId: string, id: string, query: LopaLinkedRecordFilterDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [records, required, context] = await Promise.all([this.linkedRecordsList(tenantId, id, query, scope), this.linkedRecordsRequired(tenantId, id, scope), this.linkedRecordsContext(tenantId, id, scope)]);
    return {
      readOnly: this.isReadOnly(study),
      header: { lopaNumber: study.lopa_number, title: study.title, status: study.status },
      summary: this.linkedRecordsSummaryFrom(records.rows, required),
      relationshipMap: this.linkedRecordsRelationshipMap(records.rows, required),
      records,
      required,
      dependencies: this.linkedRecordDependencies(records.rows, required),
      evidence: records.rows.filter((row: any) => ['Evidence', 'Required evidence', 'Closure evidence', 'Review evidence'].includes(row.relationship_type)),
      context
    };
  }

  async linkedRecordsList(tenantId: string, id: string, query: LopaLinkedRecordFilterDto, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const rows = await this.optionalMany('lopa_linked_records', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null).order('linked_at', { ascending: false }));
    let filtered = this.applyLinkedRecordFilters(rows, query);
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 50), 1), 100);
    return { rows: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit };
  }

  async linkedRecordDetail(tenantId: string, id: string, linkId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('lopa_linked_records').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', linkId).single());
    const history = await this.optionalMany('lopa_linked_record_history', (q) => q.select('*').eq('tenant_id', tenantId).eq('linked_record_id', linkId).order('created_at', { ascending: false }));
    return { ...row, history };
  }

  async createLinkedRecord(tenantId: string, actorId: string, id: string, dto: UpsertLopaLinkedRecordDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const duplicate = await this.optionalSingle(this.db.from('lopa_linked_records').select('id').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('source_module', dto.sourceModule).eq('source_record_id', dto.sourceRecordId).is('unlinked_at', null).limit(1).single());
    if (duplicate) throw new BadRequestException('This source record is already linked to the LOPA study.');
    const snapshot = this.safeSourceSnapshot(dto);
    const row = await this.db.single<any>(this.db.from('lopa_linked_records').insert(this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id,
      lopa_study_id: id,
      record_type: dto.recordType,
      source_module: dto.sourceModule,
      source_record_id: dto.sourceRecordId,
      record_number: dto.recordNumber,
      record_title: dto.recordTitle,
      relationship_type: dto.relationshipType,
      required: dto.required ?? false,
      blocking: dto.blocking ?? false,
      source_status: dto.sourceStatus,
      source_snapshot_json: snapshot,
      current_source_summary_json: snapshot,
      impact_level: dto.impactLevel ?? 'None',
      last_checked_at: new Date().toISOString(),
      linked_by: actorId,
      updated_by: actorId,
      notes: dto.notes
    })).select().single());
    await this.linkedRecordHistory(tenantId, actorId, study, row.id, 'LINK_CREATED', 'Linked record created', dto.linkReason ?? row.record_title, null, row);
    await this.updateLinkedRecordStudyStatus(tenantId, id);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_LINKED_RECORD_CREATED', 'Linked record created', row.record_title ?? row.record_number ?? row.id, { linkId: row.id });
    return row;
  }

  async updateLinkedRecord(tenantId: string, actorId: string, id: string, linkId: string, dto: UpsertLopaLinkedRecordDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const before = await this.linkedRecordDetail(tenantId, id, linkId, scope);
    const patch = this.clean({
      record_type: dto.recordType,
      source_module: dto.sourceModule,
      source_record_id: dto.sourceRecordId,
      record_number: dto.recordNumber,
      record_title: dto.recordTitle,
      relationship_type: dto.relationshipType,
      required: dto.required ?? false,
      blocking: dto.blocking ?? false,
      source_status: dto.sourceStatus,
      impact_level: dto.impactLevel ?? 'None',
      notes: dto.notes,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    const row = await this.db.single<any>(this.db.from('lopa_linked_records').update(patch).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', linkId).select().single());
    await this.linkedRecordHistory(tenantId, actorId, study, linkId, 'LINK_UPDATED', 'Linked record updated', row.record_title, before, row);
    await this.updateLinkedRecordStudyStatus(tenantId, id);
    return row;
  }

  async deleteLinkedRecord(tenantId: string, actorId: string, id: string, linkId: string, reason: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    if (!reason) throw new BadRequestException('Unlink reason is required.');
    const row = await this.db.single<any>(this.db.from('lopa_linked_records').update({ unlinked_by: actorId, unlinked_at: new Date().toISOString(), unlink_reason: reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', linkId).select().single());
    await this.linkedRecordHistory(tenantId, actorId, study, linkId, 'LINK_UNLINKED', 'Linked record unlinked', reason, row, { ...row, unlinked_at: new Date().toISOString() });
    await this.updateLinkedRecordStudyStatus(tenantId, id);
    return row;
  }

  async syncLinkedRecord(tenantId: string, actorId: string, id: string, linkId: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const before = await this.linkedRecordDetail(tenantId, id, linkId, scope);
    const current = before.access_status === 'Restricted' ? before.current_source_summary_json : this.safeSourceSnapshot({ recordNumber: before.record_number, recordTitle: before.record_title, sourceStatus: before.source_status, sourceModule: before.source_module, sourceRecordId: before.source_record_id });
    const changed = this.snapshotHash(before.source_snapshot_json) !== this.snapshotHash(current);
    const row = await this.db.single<any>(this.db.from('lopa_linked_records').update({ current_source_summary_json: current, source_changed: changed, snapshot_status: changed ? 'Source Changed' : 'Current', change_summary_json: changed ? { message: 'Current source summary differs from stored snapshot.' } : {}, last_checked_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', linkId).select().single());
    await this.linkedRecordHistory(tenantId, actorId, study, linkId, changed ? 'SOURCE_CHANGE_DETECTED' : 'LINK_SYNCED', changed ? 'Source change detected' : 'Linked record synced', changed ? 'Source summary changed.' : 'No source changes detected.', before, row);
    await this.updateLinkedRecordStudyStatus(tenantId, id);
    return row;
  }

  async syncAllLinkedRecords(tenantId: string, actorId: string, id: string, scope: Scope) {
    const list = await this.linkedRecordsList(tenantId, id, {}, scope);
    const rows = [];
    for (const row of list.rows) rows.push(await this.syncLinkedRecord(tenantId, actorId, id, row.id, scope));
    return rows;
  }

  async compareLinkedRecord(tenantId: string, id: string, linkId: string, scope: Scope) {
    const row = await this.linkedRecordDetail(tenantId, id, linkId, scope);
    return { snapshot: row.source_snapshot_json, current: row.current_source_summary_json, changed: row.source_changed, changeSummary: row.change_summary_json };
  }

  async linkedRecordsRequired(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const rows = await this.optionalMany('lopa_linked_records', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null));
    const has = (predicate: (row: any) => boolean) => rows.some(predicate);
    const required = [
      this.check('source_hazop', 'Source HAZOP/PHA linked', study.source_module === 'HAZOP' ? has((r) => r.source_module === 'HAZOP') : true, study.source_module === 'HAZOP' ? 'Blocked' : undefined),
      this.check('equipment', 'Required equipment links', has((r) => r.record_type === 'Equipment' || r.source_module === 'Equipment'), 'Warning'),
      this.check('risk_calculation', 'Risk calculation version linked', has((r) => r.record_type === 'Risk calculation version' || r.source_module === 'Risk Calculation'), 'Warning'),
      this.check('open_risk_gap_action', 'Open risk gap action linked where required', String(study.risk_gap_status ?? '').includes('Gap') ? has((r) => r.record_type === 'Action' || r.source_module === 'Actions') : true, String(study.risk_gap_status ?? '').includes('Gap') ? 'Blocked' : undefined),
      this.check('sil_link', 'SIL evaluation link if required', study.sil_required || study.sil_evaluation_required ? has((r) => r.source_module === 'SIS/SIF') : true, study.sil_required || study.sil_evaluation_required ? 'Warning' : undefined)
    ];
    return this.readinessFromChecks(required);
  }

  async linkedRecordSourceSearch(tenantId: string, id: string, query: LopaLinkedRecordFilterDto, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const q = String(query.q ?? '').toLowerCase();
    const [equipment, docs, actions, recs] = await Promise.all([
      this.optionalMany('Equipment', (dbq) => this.applyScope(dbq.select('id,tag,name,type,status,criticality,siteId').eq('tenantId', tenantId).limit(25), scope, 'siteId')),
      this.optionalMany('Document', (dbq) => dbq.select('*').eq('tenantId', tenantId).limit(25)),
      this.optionalMany('Action', (dbq) => dbq.select('id,actionNumber,title,status,moduleKey,sourceId,siteId').eq('tenantId', tenantId).limit(25)),
      this.optionalMany('lopa_recommendations', (dbq) => dbq.select('id,recommendation_number,title,status,site_id').eq('tenant_id', tenantId).eq('lopa_study_id', id).limit(25))
    ]);
    const rows = [
      ...equipment.map((r: any) => ({ sourceModule: 'Equipment', recordType: 'Equipment', sourceRecordId: r.id, recordNumber: r.tag, recordTitle: r.name, sourceStatus: r.status, sourceSnapshot: r })),
      ...docs.map((r: any) => ({ sourceModule: 'Documents', recordType: 'Document', sourceRecordId: r.id, recordNumber: r.documentNumber ?? r.number, recordTitle: r.title ?? r.name, sourceStatus: r.status, sourceSnapshot: r })),
      ...actions.map((r: any) => ({ sourceModule: 'Actions', recordType: 'Action', sourceRecordId: r.id, recordNumber: r.actionNumber, recordTitle: r.title, sourceStatus: r.status, sourceSnapshot: r })),
      ...recs.map((r: any) => ({ sourceModule: 'Recommendations', recordType: 'Recommendation', sourceRecordId: r.id, recordNumber: r.recommendation_number, recordTitle: r.title, sourceStatus: r.status, sourceSnapshot: r }))
    ];
    return q ? rows.filter((row) => [row.recordNumber, row.recordTitle, row.sourceModule].some((value) => String(value ?? '').toLowerCase().includes(q))) : rows;
  }

  async exportRecommendations(tenantId: string, id: string, query: LopaRecommendationFilterDto, scope: Scope) {
    return { generatedAt: new Date().toISOString(), ...(await this.recommendationsTab(tenantId, id, query, scope)) };
  }

  async exportLinkedRecords(tenantId: string, id: string, query: LopaLinkedRecordFilterDto, scope: Scope) {
    return { generatedAt: new Date().toISOString(), ...(await this.linkedRecordsTab(tenantId, id, query, scope)) };
  }

  async teamSessionsContext(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const base = await this.context(tenantId, scope);
    return {
      ...base,
      readOnly: this.isReadOnly(study),
      studyRoles: this.lopaStudyRoles(),
      disciplines: this.lopaDisciplines(),
      invitationStatuses: ['Not Invited', 'Invited', 'Accepted', 'Declined', 'Tentative', 'Expired', 'Bounced', 'Cancelled'],
      participationStatuses: ['Active', 'Inactive', 'Removed', 'Replaced', 'Completed', 'Pending'],
      accessLevels: ['View only', 'Comment', 'Edit assigned sections', 'Team editor', 'Study editor', 'Reviewer', 'Approver'],
      sessionTypes: ['Kickoff', 'Scenario review', 'Consequence review', 'Initiating event review', 'IPL validation workshop', 'Risk calculation review', 'SIL requirement review', 'Recommendation/action review', 'Management review', 'Final review preparation', 'Other'],
      sessionStatuses: ['Draft', 'Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled', 'Minutes Pending', 'Minutes Locked'],
      attendanceStatuses: ['Present', 'Partial', 'Absent', 'Excused', 'Delegate Attended', 'Not Required', 'Pending'],
      agendaStatuses: ['Planned', 'Discussed', 'Deferred', 'Cancelled', 'Not Applicable'],
      decisionTypes: ['Scenario decision', 'Consequence decision', 'Initiating event decision', 'Conditional modifier decision', 'IPL validation decision', 'PFD/RRF basis decision', 'Risk calculation decision', 'Recommendation/action decision', 'Management decision', 'Other'],
      policies: { ...(base as any).policies, quorumMinimumParticipants: 3, lockMinutesRequiredForReview: true, scribeRequired: true }
    };
  }

  async teamSessionsTab(tenantId: string, id: string, query: LopaTeamSessionsFilterDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [members, sessions, readiness, context] = await Promise.all([
      this.teamMembersRows(tenantId, id),
      this.sessionRows(tenantId, id),
      this.teamReadiness(tenantId, id, scope),
      this.teamSessionsContext(tenantId, id, scope)
    ]);
    const actions = await this.sessionActions(tenantId, id, undefined, scope);
    const filteredMembers = this.applyTeamFilters(members, query);
    const filteredSessions = this.applySessionFilters(sessions, query);
    return {
      readOnly: this.isReadOnly(study),
      header: this.teamHeader(study, members, sessions, actions, readiness),
      summary: this.teamSummaryFrom(members, sessions, actions, readiness),
      members: { rows: filteredMembers, total: filteredMembers.length },
      sessions: { rows: filteredSessions, total: filteredSessions.length },
      coverage: this.teamCoverage(members, sessions, study),
      invitations: members.filter((member) => ['Not Invited', 'Invited', 'Tentative', 'Declined', 'Expired', 'Bounced', 'Cancelled'].includes(member.invitation_status)),
      quorum: this.quorumPanel(members, sessions, actions),
      readiness,
      actions,
      context
    };
  }

  async teamSessionsSummary(tenantId: string, id: string, scope: Scope) {
    const tab = await this.teamSessionsTab(tenantId, id, {}, scope);
    return tab.summary;
  }

  async teamMembers(tenantId: string, id: string, query: LopaTeamSessionsFilterDto, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return { rows: this.applyTeamFilters(await this.teamMembersRows(tenantId, id), query) };
  }

  async teamMemberDetail(tenantId: string, id: string, memberId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const member = await this.db.single<any>(this.db.from('lopa_study_team_members').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', memberId).single());
    const attendance = await this.optionalMany('lopa_study_session_attendance', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('team_member_id', memberId).order('created_at', { ascending: false }));
    return { member, attendance };
  }

  async createTeamMember(tenantId: string, actorId: string, id: string, dto: UpsertLopaTeamMemberDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    this.validateTeamMember(dto);
    const row = await this.db.single<any>(this.db.from('lopa_study_team_members').insert(this.teamMemberPayload(tenantId, actorId, study, id, dto, { id: crypto.randomUUID() })).select().single());
    await this.syncSessionAttendanceForMember(tenantId, actorId, study, id, row);
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_TEAM_MEMBER_ADDED', 'LOPA team member added', `${row.full_name} added as ${row.study_role}.`, { memberId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.team_members.create', 'LOPA', id, row as JsonValue);
    return row;
  }

  async updateTeamMember(tenantId: string, actorId: string, id: string, memberId: string, dto: UpsertLopaTeamMemberDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    this.validateTeamMember(dto);
    const current = await this.db.single<any>(this.db.from('lopa_study_team_members').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', memberId).single());
    if (current.required_participant && dto.requiredParticipant === false && !dto.reason) throw new BadRequestException('Changing a required participant to optional requires a reason.');
    const row = await this.db.single<any>(this.db.from('lopa_study_team_members').update(this.teamMemberPayload(tenantId, actorId, study, id, dto, { updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', memberId).select().single());
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_TEAM_MEMBER_UPDATED', 'LOPA team member updated', dto.reason || `${row.full_name} role/discipline/access updated.`, { memberId });
    await this.writeAudit(tenantId, actorId, 'lopa.team_members.edit', 'LOPA', id, row as JsonValue);
    return row;
  }

  async removeTeamMember(tenantId: string, actorId: string, id: string, memberId: string, reason: string | undefined, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const member = await this.db.single<any>(this.db.from('lopa_study_team_members').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', memberId).single());
    if (member.required_participant && !reason) throw new BadRequestException('Removing a required participant requires a reason.');
    const row = await this.db.single<any>(this.db.from('lopa_study_team_members').update({ participation_status: 'Removed', removed_by: actorId, removed_at: new Date().toISOString(), removal_reason: reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', memberId).select().single());
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_TEAM_MEMBER_REMOVED', 'LOPA team member removed', reason || `${member.full_name} removed from the team.`, { memberId });
    await this.writeAudit(tenantId, actorId, 'lopa.team_members.remove', 'LOPA', id, this.clean({ memberId, reason }) as JsonValue);
    return row;
  }

  async inviteTeamMember(tenantId: string, actorId: string, id: string, memberId: string, dto: LopaTeamInviteDto, scope: Scope, resend = false) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('lopa_study_team_members').update(this.clean({ invitation_status: 'Invited', invited_by: resend ? undefined : actorId, invited_at: resend ? undefined : now, last_reminder_sent_at: resend ? now : undefined, invite_token: crypto.randomUUID(), updated_by: actorId, updated_at: now })).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', memberId).select().single());
    await this.writeHistory(tenantId, id, actorId, resend ? 'LOPA_TEAM_INVITE_RESENT' : 'LOPA_TEAM_INVITE_SENT', resend ? 'LOPA team invitation resent' : 'LOPA team invitation sent', dto.message || `${row.full_name} invited to participate.`, { memberId });
    await this.writeAudit(tenantId, actorId, resend ? 'lopa.team_members.resend_invite' : 'lopa.team_members.invite', 'LOPA', id, { memberId });
    return row;
  }

  async sendTeamInvitations(tenantId: string, actorId: string, id: string, dto: LopaTeamInviteDto, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const members = await this.teamMembersRows(tenantId, id);
    const targets = members.filter((member) => ['Not Invited', 'Tentative'].includes(member.invitation_status));
    const sent: any[] = [];
    const failed: any[] = [];
    for (const member of targets) {
      try {
        sent.push(await this.inviteTeamMember(tenantId, actorId, id, member.id, dto, scope));
      } catch (error) {
        failed.push({ memberId: member.id, email: member.email, message: error instanceof Error ? error.message : 'Invitation failed' });
      }
    }
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_TEAM_INVITATIONS_SENT', 'LOPA team invitations sent', `${sent.length} invitation(s) sent from create wizard.`, this.clean({ sent: sent.length, failed }) as JsonValue);
    await this.writeAudit(tenantId, actorId, 'lopa.team_members.send_invitations', 'LOPA', id, this.clean({ sent: sent.length, failed }) as JsonValue);
    return { sent, failed, partialFailure: failed.length > 0 };
  }

  async cancelTeamInvite(tenantId: string, actorId: string, id: string, memberId: string, dto: LopaTeamInviteDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_study_team_members').update({ invitation_status: 'Cancelled', response_status: 'Cancelled', decline_reason: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', memberId).select().single());
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_TEAM_INVITE_CANCELLED', 'LOPA team invitation cancelled', dto.reason || `${row.full_name} invitation cancelled.`, { memberId });
    return row;
  }

  async replaceTeamMember(tenantId: string, actorId: string, id: string, memberId: string, dto: ReplaceLopaTeamMemberDto, scope: Scope) {
    const replacement = await this.createTeamMember(tenantId, actorId, id, dto, scope);
    await this.optionalSingle(this.db.from('lopa_study_team_members').update({ participation_status: 'Replaced', replaced_by_member_id: replacement.id, removal_reason: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', memberId).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_TEAM_MEMBER_REPLACED', 'LOPA team member replaced', dto.reason || 'Team member replacement recorded.', { memberId, replacementId: replacement.id });
    return replacement;
  }

  async sessions(tenantId: string, id: string, query: LopaTeamSessionsFilterDto, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return { rows: this.applySessionFilters(await this.sessionRows(tenantId, id), query) };
  }

  async sessionDetail(tenantId: string, id: string, sessionId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const session = await this.db.single<any>(this.db.from('lopa_study_sessions').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', sessionId).single());
    const [agenda, attendance, minutes, decisions, actions] = await Promise.all([
      this.sessionAgenda(tenantId, id, sessionId, scope),
      this.sessionAttendance(tenantId, id, sessionId, scope),
      this.sessionMinutes(tenantId, id, sessionId, scope),
      this.sessionDecisions(tenantId, id, sessionId, scope),
      this.sessionActions(tenantId, id, sessionId, scope)
    ]);
    return { session, agenda, attendance, minutes, decisions, actions, quorum: this.sessionQuorum(session, attendance.rows ?? []) };
  }

  async createSession(tenantId: string, actorId: string, id: string, dto: UpsertLopaSessionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    this.validateSession(dto);
    const row = await this.db.single<any>(this.db.from('lopa_study_sessions').insert(this.sessionPayload(tenantId, actorId, study, id, dto, { id: crypto.randomUUID(), session_number: await this.nextSessionNumber(tenantId, id) })).select().single());
    await this.seedSessionAttendance(tenantId, actorId, study, id, row.id, dto.requiredAttendees);
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_CREATED', 'LOPA session created', row.title, { sessionId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.sessions.create', 'LOPA', id, row as JsonValue);
    return row;
  }

  async updateSession(tenantId: string, actorId: string, id: string, sessionId: string, dto: UpsertLopaSessionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    await this.assertSessionEditable(tenantId, id, sessionId, dto.reason);
    this.validateSession(dto);
    const row = await this.db.single<any>(this.db.from('lopa_study_sessions').update(this.sessionPayload(tenantId, actorId, study, id, dto, { updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', sessionId).select().single());
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_UPDATED', 'LOPA session updated', dto.reason || row.title, { sessionId });
    return row;
  }

  async deleteSession(tenantId: string, actorId: string, id: string, sessionId: string, reason: string | undefined, scope: Scope) {
    return this.cancelSession(tenantId, actorId, id, sessionId, { reason: reason || 'Session removed from register.' }, scope);
  }

  async cancelSession(tenantId: string, actorId: string, id: string, sessionId: string, dto: LopaActionReasonDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    if (!dto.reason) throw new BadRequestException('Cancelling a session requires a reason.');
    const row = await this.db.single<any>(this.db.from('lopa_study_sessions').update({ status: 'Cancelled', cancel_reason: dto.reason, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', sessionId).select().single());
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_CANCELLED', 'LOPA session cancelled', dto.reason, { sessionId });
    return row;
  }

  async rescheduleSession(tenantId: string, actorId: string, id: string, sessionId: string, dto: UpsertLopaSessionDto, scope: Scope) {
    if (!dto.reason) throw new BadRequestException('Rescheduling a session requires a reason.');
    return this.updateSession(tenantId, actorId, id, sessionId, { ...dto, status: 'Rescheduled' }, scope);
  }

  async completeSession(tenantId: string, actorId: string, id: string, sessionId: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const detail = await this.sessionDetail(tenantId, id, sessionId, scope);
    const missingAttendance = (detail.attendance.rows ?? []).some((row: any) => row.attendance_status === 'Pending' || !row.attendance_status);
    if (missingAttendance) throw new BadRequestException('Complete attendance before completing this session.');
    const row = await this.db.single<any>(this.db.from('lopa_study_sessions').update({ status: 'Completed', attendance_status: 'Complete', quorum_status: detail.quorum.status, minutes_status: detail.minutes ? 'Completed' : 'Pending', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', sessionId).select().single());
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_COMPLETED', 'LOPA session completed', row.title, { sessionId });
    return row;
  }

  async lockSessionMinutes(tenantId: string, actorId: string, id: string, sessionId: string, dto: LopaActionReasonDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const now = new Date().toISOString();
    await this.optionalSingle(this.db.from('lopa_study_session_minutes').update({ locked_by: actorId, locked_at: now, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('session_id', sessionId).select('id').single());
    const row = await this.db.single<any>(this.db.from('lopa_study_sessions').update({ locked: true, locked_by: actorId, locked_at: now, minutes_status: 'Locked', status: 'Minutes Locked', updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', sessionId).select().single());
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_MINUTES_LOCKED', 'LOPA session minutes locked', dto.reason || row.title, { sessionId });
    return row;
  }

  async unlockSessionMinutes(tenantId: string, actorId: string, id: string, sessionId: string, dto: LopaActionReasonDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    if (!dto.reason) throw new BadRequestException('Unlocking minutes requires a reason.');
    const row = await this.db.single<any>(this.db.from('lopa_study_sessions').update({ locked: false, minutes_status: 'Completed', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', sessionId).select().single());
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_MINUTES_UNLOCKED', 'LOPA session minutes unlocked', dto.reason, { sessionId });
    return row;
  }

  async sessionAgenda(tenantId: string, id: string, sessionId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const rows = await this.optionalMany('lopa_study_session_agenda_items', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('session_id', sessionId).order('sort_order'));
    return { rows };
  }

  async createSessionAgenda(tenantId: string, actorId: string, id: string, sessionId: string, dto: UpsertLopaSessionAgendaDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    await this.assertSessionEditable(tenantId, id, sessionId);
    const row = await this.db.single<any>(this.db.from('lopa_study_session_agenda_items').insert(this.agendaPayload(tenantId, actorId, study, id, sessionId, dto, { id: crypto.randomUUID(), agenda_number: await this.nextAgendaNumber(tenantId, sessionId) })).select().single());
    await this.optionalSingle(this.db.from('lopa_study_sessions').update({ agenda_status: 'Planned', updated_at: new Date().toISOString(), updated_by: actorId }).eq('tenant_id', tenantId).eq('id', sessionId).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_AGENDA_CREATED', 'LOPA session agenda item added', row.topic, { sessionId, agendaItemId: row.id });
    return row;
  }

  async updateSessionAgenda(tenantId: string, actorId: string, id: string, sessionId: string, agendaItemId: string, dto: UpsertLopaSessionAgendaDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    await this.assertSessionEditable(tenantId, id, sessionId);
    const row = await this.db.single<any>(this.db.from('lopa_study_session_agenda_items').update(this.agendaPayload(tenantId, actorId, study, id, sessionId, dto, { updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('session_id', sessionId).eq('id', agendaItemId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_AGENDA_UPDATED', 'LOPA session agenda updated', row.topic, { sessionId, agendaItemId });
    return row;
  }

  async deleteSessionAgenda(tenantId: string, actorId: string, id: string, sessionId: string, agendaItemId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    await this.assertSessionEditable(tenantId, id, sessionId);
    await this.optionalSingle(this.db.from('lopa_study_session_agenda_items').delete().eq('tenant_id', tenantId).eq('session_id', sessionId).eq('id', agendaItemId).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_AGENDA_DELETED', 'LOPA session agenda item removed', 'Agenda item removed.', { sessionId, agendaItemId });
    return { id: agendaItemId, deleted: true };
  }

  async reorderSessionAgenda(tenantId: string, actorId: string, id: string, sessionId: string, dto: ReorderLopaSessionAgendaDto, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    await this.assertSessionEditable(tenantId, id, sessionId);
    for (const [index, itemId] of dto.itemIds.entries()) await this.optionalSingle(this.db.from('lopa_study_session_agenda_items').update({ sort_order: index + 1, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('session_id', sessionId).eq('id', itemId).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_AGENDA_REORDERED', 'LOPA session agenda reordered', 'Agenda order updated.', { sessionId, itemIds: dto.itemIds });
    return this.sessionAgenda(tenantId, id, sessionId, scope);
  }

  async sessionAttendance(tenantId: string, id: string, sessionId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const rows = await this.optionalMany('lopa_study_session_attendance', (q) => q.select('*, member:lopa_study_team_members(*)').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('session_id', sessionId).order('created_at'));
    return { rows };
  }

  async updateSessionAttendance(tenantId: string, actorId: string, id: string, sessionId: string, dto: BulkLopaSessionAttendanceDto | UpsertLopaSessionAttendanceDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const rows = 'rows' in dto ? dto.rows : [dto];
    const saved: any[] = [];
    for (const item of rows) saved.push(await this.upsertAttendanceRow(tenantId, actorId, study, id, sessionId, item));
    await this.recalculateMemberAttendance(tenantId, id);
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_ATTENDANCE_UPDATED', 'LOPA session attendance updated', `${saved.length} attendance records updated.`, { sessionId });
    return { rows: saved };
  }

  async confirmSessionAttendance(tenantId: string, actorId: string, id: string, sessionId: string, attendanceId: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_study_session_attendance').update({ confirmed_by: actorId, confirmed_at: new Date().toISOString(), updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('session_id', sessionId).eq('id', attendanceId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_ATTENDANCE_CONFIRMED', 'LOPA session attendance confirmed', row.team_member_id, { sessionId, attendanceId });
    return row;
  }

  async sessionMinutes(tenantId: string, id: string, sessionId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.optionalSingle(this.db.from('lopa_study_session_minutes').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('session_id', sessionId).single());
  }

  async updateSessionMinutes(tenantId: string, actorId: string, id: string, sessionId: string, dto: UpsertLopaSessionMinutesDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    await this.assertSessionEditable(tenantId, id, sessionId, dto.reason);
    const existing = await this.sessionMinutes(tenantId, id, sessionId, scope);
    const payload = this.clean({ tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, session_id: sessionId, minutes_summary: dto.minutesSummary, discussion_notes: dto.discussionNotes, key_decisions_summary: dto.keyDecisionsSummary, assumptions_summary: dto.assumptionsSummary, deferred_items_summary: dto.deferredItemsSummary, concerns_summary: dto.concernsSummary, follow_up_required: dto.followUpRequired, prepared_by: dto.preparedBy, prepared_at: dto.preparedAt, reviewed_by: dto.reviewedBy, reviewed_at: dto.reviewedAt, updated_by: actorId, updated_at: new Date().toISOString() });
    const row = existing?.id
      ? await this.db.single<any>(this.db.from('lopa_study_session_minutes').update(payload).eq('tenant_id', tenantId).eq('id', existing.id).select().single())
      : await this.db.single<any>(this.db.from('lopa_study_session_minutes').insert({ id: crypto.randomUUID(), ...payload, created_by: actorId }).select().single());
    await this.optionalSingle(this.db.from('lopa_study_sessions').update({ minutes_status: 'Completed', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', sessionId).select('id').single());
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_MINUTES_UPDATED', 'LOPA session minutes updated', dto.minutesSummary || 'Minutes updated.', { sessionId, minutesId: row.id });
    return row;
  }

  async sessionDecisions(tenantId: string, id: string, sessionId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const rows = await this.optionalMany('lopa_study_session_decisions', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('session_id', sessionId).order('created_at', { ascending: false }));
    return { rows };
  }

  async createSessionDecision(tenantId: string, actorId: string, id: string, sessionId: string, dto: UpsertLopaSessionDecisionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    await this.assertSessionEditable(tenantId, id, sessionId);
    const row = await this.db.single<any>(this.db.from('lopa_study_session_decisions').insert(this.decisionPayload(tenantId, actorId, study, id, sessionId, dto, { id: crypto.randomUUID(), decision_number: await this.nextDecisionNumber(tenantId, sessionId) })).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_DECISION_CREATED', 'LOPA session decision created', row.decision_title, { sessionId, decisionId: row.id });
    return row;
  }

  async updateSessionDecision(tenantId: string, actorId: string, id: string, sessionId: string, decisionId: string, dto: UpsertLopaSessionDecisionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    await this.assertSessionEditable(tenantId, id, sessionId);
    const row = await this.db.single<any>(this.db.from('lopa_study_session_decisions').update(this.decisionPayload(tenantId, actorId, study, id, sessionId, dto, { updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('session_id', sessionId).eq('id', decisionId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_DECISION_UPDATED', 'LOPA session decision updated', row.decision_title, { sessionId, decisionId });
    return row;
  }

  async deleteSessionDecision(tenantId: string, actorId: string, id: string, sessionId: string, decisionId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    await this.assertSessionEditable(tenantId, id, sessionId);
    await this.optionalSingle(this.db.from('lopa_study_session_decisions').delete().eq('tenant_id', tenantId).eq('session_id', sessionId).eq('id', decisionId).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_DECISION_DELETED', 'LOPA session decision removed', 'Decision removed.', { sessionId, decisionId });
    return { id: decisionId, deleted: true };
  }

  async sessionActions(tenantId: string, id: string, sessionId: string | undefined, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    let query: any = this.db.from('lopa_study_session_action_links').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null);
    if (sessionId) query = query.eq('session_id', sessionId);
    const links = await this.optionalMany('lopa_study_session_action_links', () => query.order('linked_at', { ascending: false }));
    const actions = await this.actionRowsByIds(tenantId, links.map((link) => link.action_id));
    return actions.map((action) => ({ ...action, links: links.filter((link) => link.action_id === action.id) }));
  }

  async createSessionAction(tenantId: string, actorId: string, id: string, sessionId: string, dto: CreateLopaActionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const sourceType = (dto as any).sourceType ?? 'Session';
    const action = await this.createUniversalAction(tenantId, actorId, study, id, dto);
    const link = await this.db.single<any>(this.db.from('lopa_study_session_action_links').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, session_id: sessionId, action_id: action.id, source_type: sourceType, blocking: dto.blocking ?? true, linked_by: actorId }).select().single());
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_ACTION_CREATED', 'LOPA session action created', action.title, { sessionId, actionId: action.id, linkId: link.id });
    return { ...action, link };
  }

  async linkExistingSessionAction(tenantId: string, actorId: string, id: string, sessionId: string, dto: LinkExistingLopaActionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const link = await this.db.single<any>(this.db.from('lopa_study_session_action_links').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, session_id: sessionId, action_id: dto.actionId, source_type: (dto as any).sourceType ?? 'Session', blocking: dto.blocking ?? true, linked_by: actorId }).select().single());
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_ACTION_LINKED', 'Existing action linked to session', dto.actionId, { sessionId, linkId: link.id });
    return link;
  }

  async unlinkSessionAction(tenantId: string, actorId: string, id: string, sessionId: string, actionLinkId: string, reason: string | undefined, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const link = await this.db.single<any>(this.db.from('lopa_study_session_action_links').update({ unlinked_by: actorId, unlinked_at: new Date().toISOString(), unlink_reason: reason }).eq('tenant_id', tenantId).eq('session_id', sessionId).eq('id', actionLinkId).select().single());
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_ACTION_UNLINKED', 'Session action unlinked', reason || 'Action link removed.', { sessionId, actionLinkId });
    return link;
  }

  async syncSessionActions(tenantId: string, actorId: string, id: string, sessionId: string, scope: Scope) {
    const actions = await this.sessionActions(tenantId, id, sessionId, scope);
    await this.updateTeamSessionStatus(tenantId, id, actorId);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SESSION_ACTIONS_SYNCED', 'LOPA session actions synced', `${actions.length} actions synced.`, { sessionId });
    return actions;
  }

  async teamUserSearch(tenantId: string, id: string, query: LopaTeamSessionsFilterDto, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const q = (query.q ?? '').toLowerCase();
    const rows = await this.optionalMany('User', (dbq) => dbq.select('id,email,displayName,title,status,tenantId').eq('tenantId', tenantId).neq('status', 'INACTIVE').order('displayName').limit(50));
    return rows.filter((row) => !q || String(row.displayName ?? row.email ?? '').toLowerCase().includes(q) || String(row.email ?? '').toLowerCase().includes(q));
  }

  async exportTeamSessions(tenantId: string, id: string, scope: Scope) {
    const tab = await this.teamSessionsTab(tenantId, id, {}, scope);
    return { generatedAt: new Date().toISOString(), header: tab.header, summary: tab.summary, members: tab.members.rows, sessions: tab.sessions.rows, readiness: tab.readiness };
  }

  async hazopRequiredScenarios(tenantId: string, scope: Scope) {
    const scenarios = await this.optionalMany('hazop_scenarios', (q) => this.applyScope(q.select('*').eq('tenant_id', tenantId).eq('lopa_required', true).order('updated_at', { ascending: false }), scope, 'site_id'));
    if (!scenarios.length) return [];
    const studyIds = [...new Set(scenarios.map((s) => s.study_id).filter(Boolean))];
    const nodeIds = [...new Set(scenarios.map((s) => s.node_id).filter(Boolean))];
    const [studies, nodes, lopaStudies] = await Promise.all([
      studyIds.length ? this.optionalMany('hazop_studies', (q) => q.select('*').eq('tenant_id', tenantId).in('id', studyIds)) : [],
      nodeIds.length ? this.optionalMany('hazop_nodes', (q) => q.select('*').eq('tenant_id', tenantId).in('id', nodeIds)) : [],
      this.optionalMany('lopa_studies', (q) => q.select('id,lopa_number,status,source_hazop_scenario_id,tenant_id').eq('tenant_id', tenantId).in('source_hazop_scenario_id', scenarios.map((s) => s.id)))
    ]);
    const studyById = new Map(studies.map((s) => [s.id, s]));
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const lopaByScenario = new Map(lopaStudies.map((l) => [l.source_hazop_scenario_id, l]));
    return scenarios.map((scenario) => {
      const study = studyById.get(scenario.study_id) ?? {};
      const node = nodeById.get(scenario.node_id) ?? {};
      const lopa = lopaByScenario.get(scenario.id);
      return {
        id: scenario.id,
        hazopId: study.id ?? scenario.study_id,
        hazopNumber: study.study_number ?? 'HAZOP',
        hazopTitle: study.title ?? 'HAZOP study',
        nodeId: node.id ?? scenario.node_id,
        nodeNumber: node.node_number,
        nodeTitle: node.title,
        deviation: scenario.deviation_text ?? scenario.deviation ?? scenario.scenario_number,
        cause: scenario.cause,
        consequence: scenario.consequence,
        existingSafeguards: scenario.existing_safeguards,
        riskLevel: scenario.risk_level,
        riskScore: scenario.risk_score,
        siteId: study.site_id ?? scenario.site_id,
        unitId: study.unit_id,
        areaId: study.area_id,
        equipmentTag: this.firstEquipmentTag(node, study),
        lopaStatus: lopa ? this.lopaStatusLabel(lopa.status) : 'Not Created',
        existingLopaId: lopa?.id ?? null,
        existingLopaNumber: lopa?.lopa_number ?? null
      };
    });
  }

  private lopaStudyRoles() {
    return ['LOPA Facilitator', 'Process Engineer', 'Operations Representative', 'Maintenance Representative', 'Instrument / Control Engineer', 'SIS / Functional Safety Engineer', 'Process Safety Engineer', 'HSE / EHS Representative', 'Mechanical Engineer', 'Electrical Engineer', 'Reliability Engineer', 'Production Supervisor', 'Area Owner', 'Unit Manager', 'Project Engineer', 'MOC Coordinator', 'PSSR Representative', 'Document Controller', 'Reviewer', 'Approver', 'Observer', 'External Consultant', 'Vendor Representative', 'Contractor Representative', 'Scribe / Secretary', 'Other'];
  }

  private lopaDisciplines() {
    return ['Process', 'Operations', 'Maintenance', 'Instrumentation / Controls', 'SIS / Functional Safety', 'Process Safety', 'HSE / EHS', 'Mechanical', 'Electrical', 'Reliability', 'Production', 'Project', 'Management', 'Document Control', 'External / Vendor', 'Other'];
  }

  private async teamMembersRows(tenantId: string, id: string) {
    return this.optionalMany('lopa_study_team_members', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).neq('participation_status', 'Removed').order('created_at'));
  }

  private async sessionRows(tenantId: string, id: string) {
    return this.optionalMany('lopa_study_sessions', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('start_time', { ascending: false }));
  }

  private teamHeader(study: any, members: any[], sessions: any[], actions: any[], readiness: any) {
    return {
      lopaNumber: study.lopa_number,
      title: study.title,
      status: study.status,
      teamReadinessStatus: readiness.status,
      totalTeamMembers: members.length,
      requiredRolesMissing: readiness.checks?.filter((check: any) => check.key?.startsWith('role_') && check.status === 'Blocked').length ?? 0,
      sessionsCompleted: this.count(sessions, (session) => session.status === 'Completed' || session.status === 'Minutes Locked'),
      openSessionActions: this.count(actions, (action) => !this.isActionClosed(action)),
      lastUpdated: [study.updated_at, ...members.map((m) => m.updated_at), ...sessions.map((s) => s.updated_at)].filter(Boolean).sort().at(-1) ?? study.updated_at
    };
  }

  private teamSummaryFrom(members: any[], sessions: any[], actions: any[], readiness: any) {
    const required = members.filter((m) => m.required_participant);
    const internal = members.filter((m) => m.internal_external !== 'External');
    const completedSessions = sessions.filter((s) => s.status === 'Completed' || s.status === 'Minutes Locked');
    return {
      totalTeamMembers: members.length,
      requiredMembers: required.length,
      optionalMembers: members.length - required.length,
      internalParticipants: internal.length,
      externalParticipants: members.length - internal.length,
      invited: this.count(members, (m) => m.invitation_status === 'Invited'),
      acceptedInvitations: this.count(members, (m) => m.invitation_status === 'Accepted'),
      declinedInvitations: this.count(members, (m) => m.invitation_status === 'Declined'),
      pendingInvitations: this.count(members, (m) => ['Not Invited', 'Invited', 'Tentative'].includes(m.invitation_status)),
      requiredRolesCovered: this.count(readiness.checks ?? [], (c: any) => c.key?.startsWith('role_') && c.status === 'Complete'),
      requiredRolesMissing: this.count(readiness.checks ?? [], (c: any) => c.key?.startsWith('role_') && c.status === 'Blocked'),
      requiredDisciplinesCovered: this.count(readiness.checks ?? [], (c: any) => c.key?.startsWith('discipline_') && c.status === 'Complete'),
      requiredDisciplinesMissing: this.count(readiness.checks ?? [], (c: any) => c.key?.startsWith('discipline_') && c.status === 'Blocked'),
      sessionsScheduled: sessions.length,
      sessionsCompleted: completedSessions.length,
      sessionsCancelled: this.count(sessions, (s) => s.status === 'Cancelled'),
      attendanceComplete: this.count(sessions, (s) => s.attendance_status === 'Complete'),
      missingAttendanceRecords: this.count(sessions, (s) => s.attendance_status !== 'Complete'),
      quorumMet: this.count(sessions, (s) => s.quorum_status === 'Met'),
      quorumNotMet: this.count(sessions, (s) => s.quorum_status === 'Failed'),
      openSessionActions: this.count(actions, (a) => !this.isActionClosed(a)),
      overdueSessionActions: this.count(actions, (a) => this.isOverdue(a)),
      minutesCompleted: this.count(sessions, (s) => ['Completed', 'Locked'].includes(s.minutes_status)),
      minutesLocked: this.count(sessions, (s) => s.locked || s.minutes_status === 'Locked'),
      teamReadyForReviewStatus: readiness.status
    };
  }

  private teamCoverage(members: any[], sessions: any[], study: any) {
    const requiredRoles = ['LOPA Facilitator', 'Process Engineer', 'Operations Representative', 'Maintenance Representative', 'Process Safety Engineer', 'HSE / EHS Representative', 'Area Owner'];
    if (study.sil_required || study.sil_evaluation_required) requiredRoles.push('SIS / Functional Safety Engineer');
    const requiredDisciplines = ['Process', 'Operations', 'Maintenance', 'Process Safety', 'HSE / EHS'];
    if (study.ipl_validation_status !== 'Complete') requiredDisciplines.push('Instrumentation / Controls');
    return [
      ...requiredRoles.map((role) => this.coverageRow('Role', role, members.some((m) => m.study_role === role), members.find((m) => m.study_role === role), sessions)),
      ...requiredDisciplines.map((discipline) => this.coverageRow('Discipline', discipline, members.some((m) => m.discipline === discipline), members.find((m) => m.discipline === discipline), sessions))
    ];
  }

  private coverageRow(type: string, name: string, covered: boolean, member: any, sessions: any[]) {
    return { type, name, required: true, covered, assignedMember: member?.full_name ?? null, attendanceRequired: true, attendanceMet: covered ? sessions.every((s) => s.attendance_status === 'Complete' || s.status === 'Cancelled') : false, gapSeverity: covered ? 'None' : 'High', action: covered ? 'Covered' : 'Add team member' };
  }

  private quorumPanel(members: any[], sessions: any[], actions: any[]) {
    const requiredActive = members.filter((m) => m.required_participant && m.participation_status === 'Active');
    const checks = [
      this.check('minimum_participants', 'Minimum participant count', members.length >= 3, 'Blocked'),
      this.check('facilitator', 'Facilitator assigned', members.some((m) => m.facilitator || m.study_role === 'LOPA Facilitator'), 'Blocked'),
      this.check('scribe', 'Scribe assigned', members.some((m) => m.scribe || m.study_role === 'Scribe / Secretary'), 'Warning'),
      this.check('required_attendees', 'Required attendees active', requiredActive.length > 0 && requiredActive.every((m) => ['Active', 'Completed'].includes(m.participation_status)), 'Blocked'),
      this.check('attendance_complete', 'Attendance complete for sessions', sessions.every((s) => s.attendance_status === 'Complete' || s.status === 'Cancelled'), 'Warning'),
      this.check('blocking_actions', 'No open session blockers', actions.every((a) => this.isActionClosed(a) || !a.links?.some((l: any) => l.blocking)), 'Blocked')
    ];
    return this.readinessFromChecks(checks);
  }

  private async teamReadiness(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [members, sessions, actions] = await Promise.all([this.teamMembersRows(tenantId, id), this.sessionRows(tenantId, id), this.sessionActions(tenantId, id, undefined, scope)]);
    const coverage = this.teamCoverage(members, sessions, study);
    const checks = [
      ...coverage.map((row) => this.check(`${row.type.toLowerCase()}_${row.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`, `${row.type}: ${row.name}`, row.covered, row.type === 'Role' ? 'Blocked' : 'Warning')),
      this.check('members_invited', 'Required members invited', members.filter((m) => m.required_participant).every((m) => m.invitation_status !== 'Not Invited'), 'Warning'),
      this.check('members_accepted', 'Required members accepted or substitute assigned', members.filter((m) => m.required_participant).every((m) => ['Accepted', 'Not Invited'].includes(m.invitation_status) || m.participation_status === 'Active'), 'Warning'),
      this.check('sessions_completed', 'Required sessions completed', sessions.length > 0 && sessions.some((s) => s.status === 'Completed' || s.status === 'Minutes Locked'), 'Blocked'),
      this.check('attendance_complete', 'Attendance records complete', sessions.every((s) => s.attendance_status === 'Complete' || s.status === 'Cancelled'), 'Warning'),
      this.check('quorum_met', 'Quorum met', sessions.every((s) => !['Completed', 'Minutes Locked'].includes(s.status) || s.quorum_status === 'Met'), 'Blocked'),
      this.check('minutes_completed', 'Minutes completed', sessions.every((s) => s.status === 'Cancelled' || ['Completed', 'Locked'].includes(s.minutes_status)), 'Warning'),
      this.check('minutes_locked', 'Minutes locked if required', sessions.every((s) => s.status !== 'Minutes Locked' || s.locked), 'Warning'),
      this.check('session_actions_closed', 'Open team/session actions resolved or accepted', actions.every((a) => this.isActionClosed(a) || !a.links?.some((l: any) => l.blocking)), 'Blocked')
    ];
    const readiness = this.readinessFromChecks(checks);
    await this.optionalSingle(this.db.from('lopa_study_team_readiness').upsert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id,
      site_id: study.site_id,
      lopa_study_id: id,
      readiness_status: readiness.status,
      required_roles_status: checks.some((c: any) => c.key?.startsWith('role_') && c.status === 'Blocked') ? 'Incomplete' : 'Complete',
      required_disciplines_status: checks.some((c: any) => c.key?.startsWith('discipline_') && c.status === 'Blocked') ? 'Incomplete' : 'Complete',
      invitation_status: checks.find((c: any) => c.key === 'members_invited')?.status ?? 'Pending',
      session_completion_status: checks.find((c: any) => c.key === 'sessions_completed')?.status ?? 'Pending',
      attendance_status: checks.find((c: any) => c.key === 'attendance_complete')?.status ?? 'Pending',
      quorum_status: checks.find((c: any) => c.key === 'quorum_met')?.status ?? 'Not Evaluated',
      minutes_status: checks.find((c: any) => c.key === 'minutes_completed')?.status ?? 'Pending',
      action_status: checks.find((c: any) => c.key === 'session_actions_closed')?.status ?? 'Pending',
      blocker_count: readiness.blockers.length,
      warning_count: readiness.warnings.length,
      checklist_json: checks,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id,lopa_study_id' }).select().single());
    return readiness;
  }

  private applyTeamFilters(rows: any[], query: LopaTeamSessionsFilterDto) {
    const q = (query.q ?? '').toLowerCase();
    return rows.filter((row) => {
      if (q && ![row.full_name, row.email, row.study_role, row.discipline, row.department].some((v) => String(v ?? '').toLowerCase().includes(q))) return false;
      if (query.role && row.study_role !== query.role) return false;
      if (query.discipline && row.discipline !== query.discipline) return false;
      if (query.invitationStatus && row.invitation_status !== query.invitationStatus) return false;
      if (query.participationStatus && row.participation_status !== query.participationStatus) return false;
      if (query.required === 'true' && !row.required_participant) return false;
      return true;
    });
  }

  private applySessionFilters(rows: any[], query: LopaTeamSessionsFilterDto) {
    const q = (query.q ?? '').toLowerCase();
    return rows.filter((row) => {
      if (q && ![row.title, row.session_type, row.location, row.status].some((v) => String(v ?? '').toLowerCase().includes(q))) return false;
      if (query.sessionStatus && row.status !== query.sessionStatus) return false;
      if (query.sessionType && row.session_type !== query.sessionType) return false;
      return true;
    });
  }

  private validateTeamMember(dto: UpsertLopaTeamMemberDto) {
    if (!dto.fullName || !dto.email || !dto.discipline || !dto.studyRole) throw new BadRequestException('Name, email, discipline, and study role are required.');
    if (dto.requiredParticipant && !dto.responsibilityDescription) throw new BadRequestException('Required participants need a responsibility description.');
  }

  private validateSession(dto: UpsertLopaSessionDto) {
    if (!dto.title || !dto.sessionType || !dto.startTime || !dto.endTime) throw new BadRequestException('Session title, type, start time, and end time are required.');
    if (new Date(dto.endTime).getTime() <= new Date(dto.startTime).getTime()) throw new BadRequestException('Session end time must be after start time.');
    if (!dto.facilitatorMemberId) throw new BadRequestException('Session facilitator is required.');
  }

  private teamMemberPayload(tenantId: string, actorId: string, study: any, id: string, dto: UpsertLopaTeamMemberDto, extras: Record<string, unknown> = {}) {
    return this.clean({ tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, user_id: dto.userId, contact_id: dto.contactId, full_name: dto.fullName, email: dto.email, organization: dto.organization, internal_external: dto.internalExternal ?? 'Internal', job_title: dto.jobTitle, department: dto.department, discipline: dto.discipline, study_role: dto.studyRole, responsibility_description: dto.responsibilityDescription, required_participant: dto.requiredParticipant ?? false, voting_participant: dto.votingParticipant ?? false, reviewer: dto.reviewer ?? false, approver: dto.approver ?? false, facilitator: dto.facilitator ?? dto.studyRole === 'LOPA Facilitator', scribe: dto.scribe ?? dto.studyRole === 'Scribe / Secretary', access_level: dto.accessLevel ?? 'View only', invitation_status: dto.invitationRequired ? 'Not Invited' : dto.invitationStatus ?? 'Not Invited', participation_status: dto.participationStatus ?? 'Active', notes: dto.notes, updated_by: actorId, created_by: actorId, ...extras });
  }

  private sessionPayload(tenantId: string, actorId: string, study: any, id: string, dto: UpsertLopaSessionDto, extras: Record<string, unknown> = {}) {
    return this.clean({ tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, title: dto.title, session_type: dto.sessionType, description: dto.description, start_time: dto.startTime, end_time: dto.endTime, timezone: dto.timezone, location: dto.location, meeting_link: dto.meetingLink, facilitator_member_id: dto.facilitatorMemberId, scribe_member_id: dto.scribeMemberId, status: dto.status ?? 'Scheduled', updated_by: actorId, created_by: actorId, ...extras });
  }

  private agendaPayload(tenantId: string, actorId: string, study: any, id: string, sessionId: string, dto: UpsertLopaSessionAgendaDto, extras: Record<string, unknown> = {}) {
    return this.clean({ tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, session_id: sessionId, topic: dto.topic, description: dto.description, related_tab: dto.relatedTab, related_record_type: dto.relatedRecordType, related_record_id: dto.relatedRecordId, owner_member_id: dto.ownerMemberId, planned_duration_minutes: dto.plannedDurationMinutes, status: dto.status ?? 'Planned', notes: dto.notes, sort_order: dto.sortOrder ?? 0, updated_by: actorId, created_by: actorId, ...extras });
  }

  private decisionPayload(tenantId: string, actorId: string, study: any, id: string, sessionId: string, dto: UpsertLopaSessionDecisionDto, extras: Record<string, unknown> = {}) {
    return this.clean({ tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, session_id: sessionId, decision_title: dto.decisionTitle, decision_description: dto.decisionDescription, related_tab: dto.relatedTab, related_record_type: dto.relatedRecordType, related_record_id: dto.relatedRecordId, decision_type: dto.decisionType, decision_outcome: dto.decisionOutcome, decision_owner_member_id: dto.decisionOwnerMemberId, evidence_reference: dto.evidenceReference, action_required: dto.actionRequired ?? false, notes: dto.notes, updated_by: actorId, created_by: actorId, ...extras });
  }

  private async nextSessionNumber(tenantId: string, id: string) {
    const rows = await this.optionalMany('lopa_study_sessions', (q) => q.select('id').eq('tenant_id', tenantId).eq('lopa_study_id', id));
    return `SES-${String(rows.length + 1).padStart(3, '0')}`;
  }

  private async nextAgendaNumber(tenantId: string, sessionId: string) {
    const rows = await this.optionalMany('lopa_study_session_agenda_items', (q) => q.select('id').eq('tenant_id', tenantId).eq('session_id', sessionId));
    return `AG-${String(rows.length + 1).padStart(3, '0')}`;
  }

  private async nextDecisionNumber(tenantId: string, sessionId: string) {
    const rows = await this.optionalMany('lopa_study_session_decisions', (q) => q.select('id').eq('tenant_id', tenantId).eq('session_id', sessionId));
    return `DEC-${String(rows.length + 1).padStart(3, '0')}`;
  }

  private async assertSessionEditable(tenantId: string, id: string, sessionId: string, reason?: string) {
    const session = await this.db.single<any>(this.db.from('lopa_study_sessions').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', sessionId).single());
    if (session.locked && !reason) throw new BadRequestException('Locked session minutes require unlock permission and a reason before editing.');
    return session;
  }

  private async seedSessionAttendance(tenantId: string, actorId: string, study: any, id: string, sessionId: string, requiredAttendees?: string[]) {
    const members = await this.teamMembersRows(tenantId, id);
    const required = new Set(requiredAttendees?.length ? requiredAttendees : members.filter((m) => m.required_participant).map((m) => m.id));
    for (const member of members) {
      await this.optionalSingle(this.db.from('lopa_study_session_attendance').upsert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: study.company_id,
        site_id: study.site_id,
        lopa_study_id: id,
        session_id: sessionId,
        team_member_id: member.id,
        required_attendee: required.has(member.id),
        attendance_status: required.has(member.id) ? 'Pending' : 'Not Required',
        created_by: actorId,
        updated_by: actorId
      }, { onConflict: 'tenant_id,session_id,team_member_id' }).select().single());
    }
  }

  private async syncSessionAttendanceForMember(tenantId: string, actorId: string, study: any, id: string, member: any) {
    const sessions = await this.sessionRows(tenantId, id);
    for (const session of sessions.filter((s) => !['Cancelled', 'Completed', 'Minutes Locked'].includes(s.status))) {
      await this.optionalSingle(this.db.from('lopa_study_session_attendance').upsert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: study.company_id,
        site_id: study.site_id,
        lopa_study_id: id,
        session_id: session.id,
        team_member_id: member.id,
        required_attendee: member.required_participant,
        attendance_status: member.required_participant ? 'Pending' : 'Not Required',
        created_by: actorId,
        updated_by: actorId
      }, { onConflict: 'tenant_id,session_id,team_member_id' }).select().single());
    }
  }

  private async upsertAttendanceRow(tenantId: string, actorId: string, study: any, id: string, sessionId: string, dto: UpsertLopaSessionAttendanceDto) {
    const existing = await this.optionalSingle(this.db.from('lopa_study_session_attendance').select('*').eq('tenant_id', tenantId).eq('session_id', sessionId).eq('team_member_id', dto.teamMemberId).single());
    const payload = this.clean({ tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, session_id: sessionId, team_member_id: dto.teamMemberId, required_attendee: dto.requiredAttendee ?? false, attendance_status: dto.attendanceStatus, attended_from: dto.attendedFrom, attended_to: dto.attendedTo, delegate_member_id: dto.delegateMemberId, delegate_name: dto.delegateName, absence_reason: dto.absenceReason, notes: dto.notes, updated_by: actorId, updated_at: new Date().toISOString() });
    const row = existing?.id
      ? await this.db.single<any>(this.db.from('lopa_study_session_attendance').update(payload).eq('tenant_id', tenantId).eq('id', existing.id).select().single())
      : await this.db.single<any>(this.db.from('lopa_study_session_attendance').insert({ id: crypto.randomUUID(), ...payload, created_by: actorId }).select().single());
    const rows = await this.optionalMany('lopa_study_session_attendance', (q) => q.select('*').eq('tenant_id', tenantId).eq('session_id', sessionId));
    const complete = rows.every((attendance) => attendance.attendance_status && attendance.attendance_status !== 'Pending');
    const quorum = this.sessionQuorum({}, rows);
    await this.optionalSingle(this.db.from('lopa_study_sessions').update({ attendance_status: complete ? 'Complete' : 'Incomplete', quorum_status: quorum.status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', sessionId).select('id').single());
    return row;
  }

  private async recalculateMemberAttendance(tenantId: string, id: string) {
    const members = await this.teamMembersRows(tenantId, id);
    for (const member of members) {
      const attendance = await this.optionalMany('lopa_study_session_attendance', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('team_member_id', member.id));
      const attended = attendance.filter((a) => ['Present', 'Partial', 'Delegate Attended'].includes(a.attendance_status)).length;
      const missed = attendance.filter((a) => ['Absent'].includes(a.attendance_status)).length;
      const requiredTotal = attendance.filter((a) => a.required_attendee && a.attendance_status !== 'Not Required').length;
      const percentage = requiredTotal ? Math.round((attended / requiredTotal) * 10000) / 100 : 100;
      await this.optionalSingle(this.db.from('lopa_study_team_members').update({ sessions_attended: attended, sessions_missed: missed, attendance_percentage: percentage, last_activity_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', member.id).select('id').single());
    }
  }

  private sessionQuorum(_session: any, attendance: any[]) {
    const required = attendance.filter((row) => row.required_attendee);
    const present = required.filter((row) => ['Present', 'Partial', 'Delegate Attended', 'Not Required'].includes(row.attendance_status));
    const met = required.length === 0 ? attendance.some((row) => ['Present', 'Partial', 'Delegate Attended'].includes(row.attendance_status)) : present.length === required.length;
    return { status: met ? 'Met' : 'Failed', requiredCount: required.length, presentRequiredCount: present.length, missingRequiredCount: Math.max(required.length - present.length, 0), checks: [this.check('required_attendance', 'Required attendees represented', met, 'Blocked')] };
  }

  private async updateTeamSessionStatus(tenantId: string, id: string, actorId: string) {
    const [members, sessions, actions] = await Promise.all([this.teamMembersRows(tenantId, id), this.sessionRows(tenantId, id), this.sessionActions(tenantId, id, undefined, { corporateView: true })]);
    const readiness = await this.teamReadiness(tenantId, id, { corporateView: true });
    const completed = this.count(sessions, (s) => s.status === 'Completed' || s.status === 'Minutes Locked');
    const openActions = this.count(actions, (a) => !this.isActionClosed(a));
    await this.optionalSingle(this.db.from('lopa_studies').update({ team_status: readiness.status, session_status: completed === sessions.length && sessions.length ? 'Complete' : sessions.length ? 'In Progress' : 'Not Started', team_readiness_status: readiness.status, review_readiness_status: readiness.status === 'Ready' ? 'Team Ready' : 'Not Ready', team_members_count: members.length, sessions_count: sessions.length, sessions_completed_count: completed, open_session_actions_count: openActions, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
  }

  async hazopRequiredScenario(tenantId: string, scenarioId: string, scope: Scope) {
    const scenario = (await this.hazopRequiredScenarios(tenantId, scope)).find((item) => item.id === scenarioId);
    if (!scenario) throw new NotFoundException('HAZOP LOPA-required scenario not found');
    const safeguards = await this.optionalMany('hazop_scenario_safeguards', (q) => q.select('*').eq('tenant_id', tenantId).eq('scenario_id', scenarioId));
    const recommendations = await this.optionalMany('hazop_recommendations', (q) => q.select('*').eq('tenant_id', tenantId).eq('scenario_id', scenarioId));
    return { ...scenario, safeguards, recommendations };
  }

  async get(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [snapshot, consequences, initiatingEvents, safeguards, team, history, profiles] = await Promise.all([
      this.optionalMany('lopa_source_snapshots', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      this.optionalMany('lopa_consequences', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      this.optionalMany('lopa_initiating_events', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      this.optionalMany('lopa_imported_safeguards', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      this.optionalMany('lopa_study_team_members', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id)),
      this.optionalMany('lopa_history_events', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }).limit(20)),
      this.ownerProfiles(tenantId)
    ]);
    const ownerProfile = profiles.find((profile) => profile.id === study.owner_id || profile.userId === study.owner_id) ?? null;
    return { ...this.mapStudy(study), ownerProfile, sourceSnapshots: snapshot, consequences, initiatingEvents, importedSafeguards: safeguards, teamMembers: team, history };
  }

  async update(tenantId: string, actorId: string, id: string, dto: UpdateLopaDto, scope: Scope) {
    const current = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(current);
    if (dto.ownerId && dto.ownerId !== current.owner_id) {
      const owner = await this.assertValidOwner(tenantId, dto.ownerId, { siteId: current.site_id, unitId: current.unit_id ?? undefined, areaId: current.area_id ?? undefined });
      await this.writeAudit(tenantId, actorId, 'lopa.owner.changed', 'LOPA', id, { previousOwnerId: current.owner_id, ownerId: owner.id, ownerName: owner.displayName } as JsonValue);
      await this.writeHistory(tenantId, id, actorId, 'LOPA_OWNER_CHANGED', 'Study owner changed', `Study owner changed to ${owner.displayName}.`, { previousOwnerId: current.owner_id, ownerId: owner.id } as JsonValue);
    }
    const payload = this.clean({
      title: dto.title,
      description: dto.description,
      study_type: dto.studyType,
      priority: dto.priority,
      owner_id: dto.ownerId,
      facilitator_id: dto.facilitatorId,
      due_date: dto.dueDate,
      revalidation_due_date: dto.revalidationDueDate,
      confidentiality_level: dto.confidentialityLevel,
      tags: dto.tags,
      notes: dto.notes,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    if (!Object.keys(payload).length) return this.get(tenantId, id, scope);
    await this.db.single<any>(this.db.from('lopa_studies').update(payload).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_UPDATED', 'Study information updated', 'LOPA study metadata was updated.', payload as JsonValue);
    await this.writeAudit(tenantId, actorId, 'lopa.update', 'LOPA', id, payload as JsonValue);
    return this.get(tenantId, id, scope);
  }

  async cancel(tenantId: string, actorId: string, id: string, reason: string, scope: Scope) {
    const current = await this.studyRecord(tenantId, id, scope);
    if (['Closed', 'Cancelled'].includes(current.status)) throw new BadRequestException('This LOPA study cannot be cancelled from its current status.');
    await this.db.single<any>(this.db.from('lopa_studies').update({ status: 'Cancelled', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_CANCELLED', 'LOPA study cancelled', reason || 'LOPA study was cancelled.', { reason });
    await this.writeAudit(tenantId, actorId, 'lopa.cancel', 'LOPA', id, { reason });
    return this.get(tenantId, id, scope);
  }

  async reopen(tenantId: string, actorId: string, id: string, reason: string, scope: Scope) {
    const current = await this.studyRecord(tenantId, id, scope);
    if (!['Approved', 'Closed', 'Cancelled'].includes(current.status)) throw new BadRequestException('Only approved, closed, or cancelled LOPA studies can be reopened.');
    await this.db.single<any>(this.db.from('lopa_studies').update({ status: 'Reopened', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REOPENED', 'LOPA study reopened', reason || 'LOPA study was reopened.', { reason });
    await this.writeAudit(tenantId, actorId, 'lopa.reopen', 'LOPA', id, { reason });
    return this.get(tenantId, id, scope);
  }

  async reviewSignoffTab(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [readiness, workflow, participants, comments, blockers, snapshots, signatures, notifications, teamMembers] = await Promise.all([
      this.reviewReadiness(tenantId, id, scope),
      this.reviewWorkflow(tenantId, id, scope),
      this.reviewParticipants(tenantId, id, scope),
      this.reviewComments(tenantId, id, scope),
      this.reviewBlockers(tenantId, id, scope),
      this.reviewSnapshots(tenantId, id, scope),
      this.reviewSignatures(tenantId, id, scope),
      this.reviewNotifications(tenantId, id, scope),
      this.teamMembersRows(tenantId, id)
    ]);
    return {
      header: this.reviewHeader(study, workflow, signatures),
      summary: this.buildReviewSummary(readiness, workflow, participants, comments, blockers, signatures, study),
      readiness,
      checklist: readiness.checklist,
      workflow,
      participants,
      comments,
      blockers,
      snapshots,
      signatures,
      notifications,
      context: { ...this.reviewContext(study), teamMembers },
      readOnly: this.isReadOnly(study) || !!study.locked
    };
  }

  async reviewSummary(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [readiness, workflow, participants, comments, blockers, signatures] = await Promise.all([
      this.reviewReadiness(tenantId, id, scope), this.reviewWorkflow(tenantId, id, scope), this.reviewParticipants(tenantId, id, scope), this.reviewComments(tenantId, id, scope), this.reviewBlockers(tenantId, id, scope), this.reviewSignatures(tenantId, id, scope)
    ]);
    return this.buildReviewSummary(readiness, workflow, participants, comments, blockers, signatures, study);
  }

  async reviewReadiness(tenantId: string, id: string, scope: Scope) {
    const [study, detail, team, recommendations, risk, participants, comments, linked] = await Promise.all([
      this.studyRecord(tenantId, id, scope),
      this.get(tenantId, id, scope),
      this.teamReadiness(tenantId, id, scope),
      this.recommendationsReadiness(tenantId, id, scope),
      this.riskCalculationReadiness(tenantId, id, scope),
      this.reviewParticipants(tenantId, id, scope),
      this.reviewComments(tenantId, id, scope),
      this.optionalMany('lopa_linked_records', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null))
    ]);
    const consequence = detail.consequences?.[0];
    const initiatingEvent = detail.initiatingEvents?.[0];
    const safeguards = detail.importedSafeguards ?? [];
    const requiredReviewers = participants.filter((participant: any) => participant.required_reviewer);
    const requiredApprovers = participants.filter((participant: any) => participant.approver);
    const blockingComments = comments.filter((comment: any) => comment.blocking && !['Resolved', 'Accepted', 'Closed'].includes(comment.status));
    const openRecommendationBlockers = recommendations.checklist?.filter((check: any) => check.status === 'Blocked') ?? [];
    const riskBlockers = risk.checklist?.filter((check: any) => check.status === 'Blocked') ?? [];
    const checks = [
      this.check('overview', 'Overview complete', !!detail.title && !!detail.siteId && !!detail.ownerId, 'Blocked'),
      this.check('scenario_consequence', 'Scenario & Consequence complete', !!consequence?.description && !!(consequence?.severity ?? detail.consequenceSeverity), 'Blocked'),
      this.check('initiating_event', 'Initiating Event complete', !!initiatingEvent?.description && !!(initiatingEvent?.frequency_per_year ?? detail.initiatingEventFrequency), 'Blocked'),
      this.check('conditional_modifiers', 'Conditional modifiers complete if required', study.conditional_modifiers_status !== 'Not Started' || !study.conditional_modifiers_required, 'Warning'),
      this.check('ipls', 'IPLs / Safeguards validation complete', !['Not Started', 'Incomplete', 'Needs Review', 'Failed'].includes(detail.iplValidationStatus), 'Blocked'),
      this.check('risk_calculation', 'Risk Calculation complete', !['Not Started', 'Incomplete', 'Needs Review', 'Failed', 'Needs Recalculation'].includes(detail.calculationStatus), 'Blocked'),
      this.check('risk_recalculation', 'Calculation is current', detail.calculationStatus !== 'Needs Recalculation', 'Blocked'),
      this.check('risk_gap', 'Risk gap handled or recommendation exists', !String(detail.riskGap ?? '').toLowerCase().includes('gap') || recommendations.status === 'Ready', 'Blocked'),
      this.check('sil', 'SIL Determination complete if required', !detail.silRequired || (!!detail.targetSil && !String(detail.silGapStatus ?? '').toLowerCase().includes('gap')), 'Blocked'),
      this.check('recommendations', 'Recommendations / Actions readiness complete', recommendations.status === 'Ready' && openRecommendationBlockers.length === 0, 'Blocked'),
      this.check('linked_records', 'Linked Records readiness complete', !linked.some((row: any) => row.blocking && !['Resolved', 'Accepted', 'Closed'].includes(row.blocking_status)), 'Blocked'),
      this.check('team_sessions', 'Team & Sessions readiness complete', team.status === 'Ready', 'Blocked'),
      this.check('reviewers', 'Reviewer/approver route configured', requiredReviewers.length > 0 && requiredApprovers.length > 0, 'Blocked'),
      this.check('signatures', 'Required signature route configured', requiredApprovers.filter((participant: any) => participant.signature_required).length === 0 || requiredApprovers.some((participant: any) => participant.signature_required), 'Blocked'),
      this.check('comments', 'No unresolved blocking review comments', blockingComments.length === 0, 'Blocked'),
      this.check('calculation_blockers', 'No unresolved calculation blockers', riskBlockers.length === 0, 'Blocked')
    ];
    const result = this.readinessFromChecks(checks);
    return { ...result, checklist: checks, team, recommendations, risk, sourceChanged: await this.sourceChangedAfterSnapshot(tenantId, detail.hazopScenarioId, await this.sourceSnapshot(tenantId, id, scope)) };
  }

  async refreshReviewReadiness(tenantId: string, actorId: string, id: string, scope: Scope) {
    const workflow = await this.ensureReviewWorkflow(tenantId, actorId, id, scope);
    const study = await this.studyRecord(tenantId, id, scope);
    const readiness = await this.reviewReadiness(tenantId, id, scope);
    const blockers = this.reviewBlockerRows(readiness, workflow, id);
    for (const blocker of blockers) {
      await this.optionalSingle(this.db.from('lopa_review_blockers').upsert({ ...blocker, tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, created_by: actorId }, { onConflict: 'tenant_id,lopa_study_id,blocker_key' }).select().single());
    }
    await this.optionalSingle(this.db.from('lopa_studies').update({ review_readiness_status: readiness.status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_READINESS_REFRESHED', 'Review readiness refreshed', `${readiness.checklist.filter((check: any) => check.status === 'Blocked').length} blocking item(s) evaluated.`, { status: readiness.status });
    await this.writeAudit(tenantId, actorId, 'lopa.review_signoff.refresh_readiness', 'LOPA', id, { status: readiness.status });
    return this.reviewSignoffTab(tenantId, id, scope);
  }

  async reviewWorkflow(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const workflow = await this.optionalSingle(this.db.from('lopa_review_workflows').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).maybeSingle());
    const participants = workflow ? await this.reviewParticipants(tenantId, id, scope) : [];
    const timeline = this.reviewTimeline(workflow, participants, study);
    return workflow ? { ...workflow, participants, timeline } : { workflow_status: 'Draft', current_step: 'Draft', participants, timeline, missingRoute: true };
  }

  async reviewParticipants(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const rows = await this.optionalMany('lopa_review_participants', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('review_sequence').order('assigned_at'));
    const userIds = rows.map((row: any) => row.user_id).filter(Boolean);
    const users = userIds.length ? await this.optionalMany('User', (q) => q.select('id,email,displayName,title,department,status').eq('tenantId', tenantId).in('id', userIds)) : [];
    const byId = new Map(users.map((user: any) => [user.id, user]));
    const commentCounts = await this.optionalMany('lopa_review_comments', (q) => q.select('owner_id').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('deleted_at', null));
    return rows.map((row: any) => ({ ...row, user: byId.get(row.user_id) ?? { id: row.user_id, displayName: 'Restricted user', email: 'Restricted', status: 'RESTRICTED' }, comments_count: commentCounts.filter((comment: any) => comment.owner_id === row.user_id).length }));
  }

  async addReviewParticipant(tenantId: string, actorId: string, id: string, dto: UpsertLopaReviewParticipantDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertReviewMutable(study);
    const workflow = await this.ensureReviewWorkflow(tenantId, actorId, id, scope);
    const user = await this.db.single<any>(this.db.from('User').select('id,email,displayName,status,tenantId').eq('tenantId', tenantId).eq('id', dto.userId).maybeSingle());
    if (!user || user.status !== 'ACTIVE') throw new BadRequestException('Reviewer must be an active user in this company.');
    const duplicate = await this.optionalSingle(this.db.from('lopa_review_participants').select('id').eq('tenant_id', tenantId).eq('workflow_id', workflow.id).eq('user_id', dto.userId).eq('review_role', dto.reviewRole).maybeSingle());
    if (duplicate) throw new BadRequestException('This user is already assigned for the same review role.');
    const teamMember = await this.optionalSingle(this.db.from('lopa_study_team_members').select('id').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('user_id', dto.userId).maybeSingle());
    const row = await this.db.single<any>(this.db.from('lopa_review_participants').insert(this.clean({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, workflow_id: workflow.id, user_id: dto.userId, team_member_id: teamMember?.id ?? null, review_role: dto.reviewRole, discipline: dto.discipline, required_reviewer: dto.requiredReviewer ?? true, approver: dto.approver ?? false, signature_required: dto.signatureRequired ?? dto.approver ?? false, review_sequence: dto.reviewSequence ?? 1, due_date: dto.dueDate, assigned_at: new Date().toISOString(), created_by: actorId, updated_by: actorId })).select().single());
    await this.notifyReviewUser(tenantId, user.id, study, 'lopa.review.assigned', 'LOPA review assignment', `You were assigned as ${dto.reviewRole} for ${study.lopa_number}.`);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_PARTICIPANT_ADDED', 'Review participant added', `${user.displayName ?? user.email} assigned as ${dto.reviewRole}.`, { participantId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.review_participants.add', 'LOPAReviewParticipant', row.id, row as JsonValue);
    return row;
  }

  async updateReviewParticipant(tenantId: string, actorId: string, id: string, participantId: string, dto: UpsertLopaReviewParticipantDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertReviewMutable(study);
    const current = await this.reviewParticipantRecord(tenantId, id, participantId);
    if (['Signed', 'Approved', 'Rejected'].includes(current.signature_status) || !['Pending', 'Not Required'].includes(current.decision)) throw new BadRequestException('Completed review assignments are immutable. Reopen or create a revision first.');
    const row = await this.db.single<any>(this.db.from('lopa_review_participants').update(this.clean({ review_role: dto.reviewRole, discipline: dto.discipline, required_reviewer: dto.requiredReviewer, approver: dto.approver, signature_required: dto.signatureRequired, review_sequence: dto.reviewSequence, due_date: dto.dueDate, updated_by: actorId, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('id', participantId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_PARTICIPANT_UPDATED', 'Review participant updated', dto.reason || 'Review route was updated.', { participantId });
    await this.writeAudit(tenantId, actorId, 'lopa.review_participants.edit', 'LOPAReviewParticipant', participantId, row as JsonValue);
    return row;
  }

  async removeReviewParticipant(tenantId: string, actorId: string, id: string, participantId: string, reason: string, scope: Scope) {
    if (!reason?.trim()) throw new BadRequestException('Removing a reviewer requires a reason.');
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertReviewMutable(study);
    const current = await this.reviewParticipantRecord(tenantId, id, participantId);
    if (!['Pending', 'Not Required'].includes(current.decision) || current.signature_status === 'Signed') throw new BadRequestException('Completed review assignments cannot be removed. Reopen or create a revision first.');
    await this.db.single(this.db.from('lopa_review_participants').delete().eq('tenant_id', tenantId).eq('id', participantId).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_PARTICIPANT_REMOVED', 'Review participant removed', reason, { participantId });
    await this.writeAudit(tenantId, actorId, 'lopa.review_participants.remove', 'LOPAReviewParticipant', participantId, { reason });
    return { id: participantId, removed: true };
  }

  async submitReview(tenantId: string, actorId: string, id: string, dto: LopaReviewDecisionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertReviewMutable(study);
    const workflow = await this.ensureReviewWorkflow(tenantId, actorId, id, scope);
    const readiness = await this.reviewReadiness(tenantId, id, scope);
    const hard = readiness.checklist.filter((check: any) => check.status === 'Blocked');
    if (hard.length && !dto.overrideBlockers) throw new BadRequestException(`Review cannot be submitted: ${hard.map((check: any) => check.label).join(', ')}`);
    if (hard.length && (!dto.reason?.trim() || !dto.confirmed)) throw new BadRequestException('A confirmed override reason is required to submit with readiness blockers.');
    const now = new Date().toISOString();
    let workflowInstanceId: string | null = workflow.workflow_instance_id ?? null;
    if (!workflowInstanceId) {
      try {
        const engineWorkflow = await this.workflows.startWorkflow(tenantId, actorId, { module: 'LOPA', recordId: id, recordNumber: study.lopa_number, siteId: study.site_id, companyId: study.company_id, contextData: { lopaStudyId: id, reviewReadiness: readiness.status } }, scope);
        workflowInstanceId = engineWorkflow.id;
      } catch {
        // No active shared template is configured; the controlled LOPA workflow remains authoritative.
      }
    }
    await this.db.single(this.db.from('lopa_review_workflows').update({ workflow_instance_id: workflowInstanceId, workflow_status: 'In Review', current_step: 'Technical Review', submitted_by: actorId, submitted_at: now, review_started_at: now, approval_status: 'Pending', updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', workflow.id).select('id').single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ status: 'Pending Review', review_status: 'Submitted', approval_status: 'Pending', signature_status: 'Pending', current_review_step: 'Technical Review', review_workflow_id: workflow.id, review_submitted_at: now, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    const participants = await this.reviewParticipants(tenantId, id, scope);
    await Promise.all(participants.filter((participant: any) => participant.required_reviewer).map((participant: any) => this.notifyReviewUser(tenantId, participant.user_id, study, 'lopa.review.submitted', 'LOPA review requested', `${study.lopa_number} was submitted for your ${participant.review_role} review.`)));
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_SUBMITTED', 'LOPA submitted for review', dto.reason || 'Formal review started.', { workflowId: workflow.id, workflowInstanceId, override: !!dto.overrideBlockers });
    await this.writeAudit(tenantId, actorId, 'lopa.review_signoff.submit', 'LOPAReviewWorkflow', workflow.id, { readiness: readiness.status, override: !!dto.overrideBlockers });
    return this.reviewSignoffTab(tenantId, id, scope);
  }

  async withdrawReview(tenantId: string, actorId: string, id: string, dto: LopaReviewDecisionDto, scope: Scope) {
    if (!dto.reason?.trim()) throw new BadRequestException('Withdrawing review requires a reason.');
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertReviewMutable(study);
    const workflow = await this.ensureReviewWorkflow(tenantId, actorId, id, scope);
    const now = new Date().toISOString();
    await this.db.single(this.db.from('lopa_review_workflows').update({ workflow_status: 'Draft', current_step: 'Draft', withdrawn_by: actorId, withdrawn_at: now, withdraw_reason: dto.reason, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', workflow.id).select('id').single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ status: 'In Preparation', review_status: 'Draft', approval_status: 'Not Requested', signature_status: 'Not Required', current_review_step: 'Draft', updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_WITHDRAWN', 'LOPA review withdrawn', dto.reason, { workflowId: workflow.id });
    await this.writeAudit(tenantId, actorId, 'lopa.review_signoff.withdraw', 'LOPAReviewWorkflow', workflow.id, { reason: dto.reason });
    return this.reviewSignoffTab(tenantId, id, scope);
  }

  async requestReviewChanges(tenantId: string, actorId: string, id: string, dto: LopaReviewDecisionDto, scope: Scope) {
    if (!dto.reason?.trim()) throw new BadRequestException('Requesting changes requires a reason.');
    const workflow = await this.ensureReviewWorkflow(tenantId, actorId, id, scope);
    const now = new Date().toISOString();
    await this.db.single(this.db.from('lopa_review_workflows').update({ workflow_status: 'Changes Requested', current_step: 'Changes Requested', changes_requested_by: actorId, changes_requested_at: now, changes_requested_reason: dto.reason, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', workflow.id).select('id').single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ status: 'In Progress', review_status: 'Changes Requested', approval_status: 'Not Requested', current_review_step: 'Changes Requested', updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_CHANGES_REQUESTED', 'Changes requested', dto.reason, { workflowId: workflow.id });
    await this.writeAudit(tenantId, actorId, 'lopa.review_signoff.request_changes', 'LOPAReviewWorkflow', workflow.id, { reason: dto.reason });
    return this.reviewSignoffTab(tenantId, id, scope);
  }

  async rejectReview(tenantId: string, actorId: string, id: string, dto: LopaReviewDecisionDto, scope: Scope) {
    if (!dto.reason?.trim()) throw new BadRequestException('Rejecting a LOPA study requires a reason.');
    const workflow = await this.ensureReviewWorkflow(tenantId, actorId, id, scope);
    const now = new Date().toISOString();
    await this.db.single(this.db.from('lopa_review_workflows').update({ workflow_status: 'Rejected', current_step: 'Rejected', approval_status: 'Rejected', rejected_by: actorId, rejected_at: now, rejection_reason: dto.reason, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', workflow.id).select('id').single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ status: 'In Progress', review_status: 'Rejected', approval_status: 'Rejected', current_review_step: 'Rejected', updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_REJECTED', 'LOPA review rejected', dto.reason, { workflowId: workflow.id });
    await this.writeAudit(tenantId, actorId, 'lopa.review_signoff.reject', 'LOPAReviewWorkflow', workflow.id, { reason: dto.reason });
    return this.reviewSignoffTab(tenantId, id, scope);
  }

  async decideReviewParticipant(tenantId: string, actorId: string, id: string, participantId: string, dto: LopaReviewDecisionDto & { decision?: string }, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertReviewMutable(study);
    const participant = await this.reviewParticipantRecord(tenantId, id, participantId);
    if (participant.user_id !== actorId) throw new ForbiddenException('You can only decide your own assigned review role.');
    if (!dto.decision || !['Approved', 'Approved with comments', 'Changes requested', 'Rejected', 'Abstained'].includes(dto.decision)) throw new BadRequestException('A valid review decision is required.');
    if (['Changes requested', 'Rejected'].includes(dto.decision) && !dto.reason?.trim()) throw new BadRequestException(`${dto.decision} requires a reason.`);
    await this.assertParticipantSequence(tenantId, id, participant);
    const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('lopa_review_participants').update({ decision: dto.decision, decision_reason: dto.reason ?? dto.comments ?? null, completed_at: now, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', participantId).select().single());
    if (dto.decision === 'Changes requested') await this.requestReviewChanges(tenantId, actorId, id, { reason: dto.reason ?? '' }, scope);
    if (dto.decision === 'Rejected') await this.rejectReview(tenantId, actorId, id, { reason: dto.reason ?? '' }, scope);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_PARTICIPANT_DECISION', 'Review decision recorded', `${participant.review_role}: ${dto.decision}`, { participantId });
    await this.writeAudit(tenantId, actorId, 'lopa.review_participants.decision', 'LOPAReviewParticipant', participantId, row as JsonValue);
    return row;
  }

  async approveReview(tenantId: string, actorId: string, id: string, dto: LopaReviewDecisionDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertReviewMutable(study);
    const [workflow, readiness, participants, comments] = await Promise.all([this.ensureReviewWorkflow(tenantId, actorId, id, scope), this.reviewReadiness(tenantId, id, scope), this.reviewParticipants(tenantId, id, scope), this.reviewComments(tenantId, id, scope)]);
    const blockers = readiness.checklist.filter((check: any) => check.status === 'Blocked');
    const missingReviews = participants.filter((participant: any) => participant.required_reviewer && !['Approved', 'Approved with comments', 'Not required'].includes(participant.decision));
    const missingApprovals = participants.filter((participant: any) => participant.approver && participant.required_reviewer && !['Approved', 'Approved with comments'].includes(participant.decision));
    const missingSignatures = participants.filter((participant: any) => participant.signature_required && participant.signature_status !== 'Signed');
    const blockingComments = comments.filter((comment: any) => comment.blocking && !['Resolved', 'Accepted', 'Closed'].includes(comment.status));
    if ((blockers.length || missingReviews.length || missingApprovals.length || missingSignatures.length || blockingComments.length) && !dto.overrideBlockers) throw new BadRequestException('Approval is blocked by readiness, required reviewer, approver, signature, or review-comment requirements.');
    if ((blockers.length || missingReviews.length || missingApprovals.length || missingSignatures.length || blockingComments.length) && (!dto.reason?.trim() || !dto.confirmed)) throw new BadRequestException('A confirmed override reason is required to approve with blockers.');
    const snapshot = await this.createApprovalSnapshot(tenantId, actorId, id, workflow, dto.comments ?? dto.reason, scope);
    const now = new Date().toISOString();
    await this.db.single(this.db.from('lopa_review_workflows').update({ workflow_status: 'Approved', current_step: 'Approved / Locked', approval_status: 'Approved', approved_by: actorId, approved_at: now, review_completed_at: now, closed_by: actorId, closed_at: now, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', workflow.id).select('id').single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ status: 'Approved', review_status: 'Approved', approval_status: 'Approved', signature_status: missingSignatures.length ? 'Pending' : 'Complete', current_review_step: 'Approved / Locked', locked: true, locked_by: actorId, locked_at: now, last_approved_at: now, review_workflow_id: workflow.id, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_APPROVED', 'LOPA study approved', dto.comments || 'LOPA study approved and locked.', { workflowId: workflow.id, snapshotId: snapshot.id, override: !!dto.overrideBlockers });
    await this.writeAudit(tenantId, actorId, 'lopa.review_signoff.approve', 'LOPAReviewWorkflow', workflow.id, { snapshotId: snapshot.id, override: !!dto.overrideBlockers });
    return this.reviewSignoffTab(tenantId, id, scope);
  }

  async reopenReview(tenantId: string, actorId: string, id: string, dto: LopaReviewDecisionDto, scope: Scope) {
    if (!dto.reason?.trim()) throw new BadRequestException('Reopening an approved LOPA study requires a reason.');
    const study = await this.studyRecord(tenantId, id, scope);
    if (!['Approved', 'Closed'].includes(study.status) && !study.locked) throw new BadRequestException('Only an approved or closed LOPA study can be reopened through review control.');
    const workflow = await this.ensureReviewWorkflow(tenantId, actorId, id, scope);
    const snapshots = await this.reviewSnapshots(tenantId, id, scope);
    const now = new Date().toISOString();
    await Promise.all(snapshots.filter((snapshot: any) => !snapshot.superseded_by_snapshot_id).map((snapshot: any) => this.optionalSingle(this.db.from('lopa_review_approval_snapshots').update({ snapshot_status: 'Superseded', superseded_by_snapshot_id: 'PENDING_REOPEN', }).eq('tenant_id', tenantId).eq('id', snapshot.id).select('id').single())));
    await this.db.single(this.db.from('lopa_review_workflows').update({ workflow_status: 'Reopened', current_step: 'Reopened', reopened_by: actorId, reopened_at: now, reopen_reason: dto.reason, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', workflow.id).select('id').single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ status: 'Reopened', review_status: 'Reopened', approval_status: 'Superseded', signature_status: 'Superseded', current_review_step: 'Reopened', locked: false, locked_by: null, locked_at: null, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_REOPENED', 'LOPA approval reopened', dto.reason, { workflowId: workflow.id, supersededSnapshots: snapshots.length });
    await this.writeAudit(tenantId, actorId, 'lopa.review_signoff.reopen', 'LOPAReviewWorkflow', workflow.id, { reason: dto.reason });
    return this.reviewSignoffTab(tenantId, id, scope);
  }

  async reviewSignatures(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const signatures = await this.optionalMany('electronic_signatures', (q) => q.select('*').eq('tenant_id', tenantId).eq('module_name', 'LOPA').eq('record_type', 'lopa_review').eq('record_id', id).order('signed_at', { ascending: false }));
    return signatures;
  }

  async requestReviewSignature(tenantId: string, actorId: string, id: string, participantId: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const participant = await this.reviewParticipantRecord(tenantId, id, participantId);
    if (!participant.signature_required) throw new BadRequestException('This reviewer does not require an electronic signature.');
    await this.db.single(this.db.from('lopa_review_participants').update({ signature_status: 'Pending', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', participantId).select('id').single());
    await this.notifyReviewUser(tenantId, participant.user_id, study, 'lopa.signature.requested', 'LOPA e-signature requested', `Your ${participant.review_role} signature is required for ${study.lopa_number}.`);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_SIGNATURE_REQUESTED', 'Electronic signature requested', `${participant.review_role} signature requested.`, { participantId });
    await this.writeAudit(tenantId, actorId, 'lopa.review_signatures.request', 'LOPAReviewParticipant', participantId, { participantId });
    return { requested: true, participantId };
  }

  async signReview(tenantId: string, actorId: string, id: string, dto: LopaReviewSignatureDto, scope: Scope, meta: { ipAddress?: string; userAgent?: string } = {}) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertReviewMutable(study);
    const participant = await this.reviewParticipantRecord(tenantId, id, dto.participantId);
    if (participant.user_id !== actorId) throw new ForbiddenException('You can only sign your own assigned LOPA review role.');
    if (!participant.signature_required) throw new BadRequestException('This reviewer is not assigned an electronic signature requirement.');
    await this.assertParticipantSequence(tenantId, id, participant);
    const signature = await this.signatures.sign(tenantId, actorId, {
      moduleName: 'LOPA', recordType: 'lopa_review', recordId: id, recordNumber: study.lopa_number, actionType: 'review_signoff', signatureRole: participant.review_role,
      declarationText: `I confirm that I have reviewed LOPA study ${study.lopa_number} as ${participant.review_role} and sign with the meaning: ${dto.signatureMeaning}.`,
      authMethod: dto.authMethod, usernameReentry: dto.usernameReentry, passwordOrPin: dto.passwordOrPin, ...(dto.comment ? { comment: dto.comment } : {}),
      metadata: { siteId: study.site_id, lopaStudyId: id, participantId: participant.id, signatureMeaning: dto.signatureMeaning, originatorId: study.created_by }
    }, meta);
    const now = new Date().toISOString();
    await this.db.single(this.db.from('lopa_review_participants').update({ signature_id: signature.id, signature_status: 'Signed', completed_at: participant.completed_at ?? now, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', participant.id).select('id').single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ last_signed_at: now, signature_status: 'In Progress', updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_SIGNATURE_COMPLETED', 'LOPA review signed electronically', `${participant.review_role} signed with meaning ${dto.signatureMeaning}.`, { participantId: participant.id, signatureId: signature.id });
    await this.writeAudit(tenantId, actorId, 'lopa.review_signatures.sign', 'ElectronicSignature', signature.id, { participantId: participant.id, signatureMeaning: dto.signatureMeaning });
    return signature;
  }

  async reviewComments(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.optionalMany('lopa_review_comments', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('deleted_at', null).order('created_at', { ascending: false }));
  }

  async addReviewComment(tenantId: string, actorId: string, id: string, dto: UpsertLopaReviewCommentDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertReviewMutable(study);
    const workflow = await this.ensureReviewWorkflow(tenantId, actorId, id, scope);
    const count = (await this.reviewComments(tenantId, id, scope)).length + 1;
    const row = await this.db.single<any>(this.db.from('lopa_review_comments').insert(this.clean({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, workflow_id: workflow.id, comment_number: `LRC-${String(count).padStart(3, '0')}`, comment_type: dto.commentType ?? 'General comment', related_tab: dto.relatedTab, related_record_type: dto.relatedRecordType, related_record_id: dto.relatedRecordId, title: dto.title, comment_text: dto.commentText, severity: dto.severity ?? 'Medium', blocking: dto.blocking ?? false, status: dto.status ?? 'Open', owner_id: dto.ownerId, due_date: dto.dueDate, created_by: actorId, updated_by: actorId })).select().single());
    if (dto.ownerId) await this.notifyReviewUser(tenantId, dto.ownerId, study, 'lopa.review.comment.assigned', 'LOPA review comment assigned', `A ${dto.commentType ?? 'review'} comment was assigned to you on ${study.lopa_number}.`);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_COMMENT_CREATED', 'Review comment created', dto.title, { commentId: row.id, blocking: row.blocking });
    await this.writeAudit(tenantId, actorId, 'lopa.review_comments.create', 'LOPAReviewComment', row.id, row as JsonValue);
    return row;
  }

  async updateReviewComment(tenantId: string, actorId: string, id: string, commentId: string, dto: UpsertLopaReviewCommentDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertReviewMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_review_comments').update(this.clean({ comment_type: dto.commentType, related_tab: dto.relatedTab, related_record_type: dto.relatedRecordType, related_record_id: dto.relatedRecordId, title: dto.title, comment_text: dto.commentText, severity: dto.severity, blocking: dto.blocking, status: dto.status, owner_id: dto.ownerId, due_date: dto.dueDate, updated_by: actorId, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', commentId).is('deleted_at', null).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_COMMENT_UPDATED', 'Review comment updated', row.title, { commentId });
    await this.writeAudit(tenantId, actorId, 'lopa.review_comments.edit', 'LOPAReviewComment', commentId, row as JsonValue);
    return row;
  }

  async resolveReviewComment(tenantId: string, actorId: string, id: string, commentId: string, dto: LopaReviewDecisionDto, scope: Scope) {
    if (!dto.reason?.trim()) throw new BadRequestException('Resolving a review comment requires resolution notes.');
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertReviewMutable(study);
    const now = new Date().toISOString();
    const row = await this.db.single<any>(this.db.from('lopa_review_comments').update({ status: 'Resolved', resolution_notes: dto.reason, resolved_by: actorId, resolved_at: now, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', commentId).is('deleted_at', null).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_COMMENT_RESOLVED', 'Review comment resolved', dto.reason, { commentId });
    await this.writeAudit(tenantId, actorId, 'lopa.review_comments.resolve', 'LOPAReviewComment', commentId, row as JsonValue);
    return row;
  }

  async reopenReviewComment(tenantId: string, actorId: string, id: string, commentId: string, dto: LopaReviewDecisionDto, scope: Scope) {
    if (!dto.reason?.trim()) throw new BadRequestException('Reopening a review comment requires a reason.');
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertReviewMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_review_comments').update({ status: 'Open', resolution_notes: null, resolved_by: null, resolved_at: null, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', commentId).is('deleted_at', null).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_COMMENT_REOPENED', 'Review comment reopened', dto.reason, { commentId });
    await this.writeAudit(tenantId, actorId, 'lopa.review_comments.reopen', 'LOPAReviewComment', commentId, row as JsonValue);
    return row;
  }

  async reviewCommentThread(tenantId: string, id: string, commentId: string, scope: Scope) {
    await this.reviewCommentRecord(tenantId, id, commentId, scope);
    return this.optionalMany('lopa_review_comment_threads', (q) => q.select('*').eq('tenant_id', tenantId).eq('comment_id', commentId).order('created_at'));
  }

  async addReviewCommentThread(tenantId: string, actorId: string, id: string, commentId: string, dto: LopaReviewCommentThreadDto, scope: Scope) {
    const comment = await this.reviewCommentRecord(tenantId, id, commentId, scope);
    const row = await this.db.single<any>(this.db.from('lopa_review_comment_threads').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: comment.company_id, site_id: comment.site_id, lopa_study_id: id, comment_id: commentId, parent_thread_id: dto.parentThreadId ?? null, message: dto.message, created_by: actorId }).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_COMMENT_THREAD_ADDED', 'Review comment discussion updated', dto.message, { commentId, threadId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.review_comments.thread', 'LOPAReviewComment', commentId, { threadId: row.id });
    return row;
  }

  async reviewSnapshots(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.optionalMany('lopa_review_approval_snapshots', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('snapshot_version', { ascending: false }));
  }

  async reviewSnapshot(tenantId: string, id: string, snapshotId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const snapshot = await this.db.single<any>(this.db.from('lopa_review_approval_snapshots').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', snapshotId).maybeSingle());
    if (!snapshot) throw new NotFoundException('Approval snapshot not found.');
    return snapshot;
  }

  async reviewBlockers(tenantId: string, id: string, scope: Scope) {
    const readiness = await this.reviewReadiness(tenantId, id, scope);
    const stored = await this.optionalMany('lopa_review_blockers', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }));
    const calculated = this.reviewBlockerRows(readiness, null, id);
    const storedByKey = new Map(stored.map((row: any) => [row.blocker_key, row]));
    return calculated.map((row: any) => ({ ...row, ...(storedByKey.get(row.blocker_key) ?? {}) })).filter((row: any) => row.status !== 'Resolved');
  }

  async acceptReviewBlockerException(tenantId: string, actorId: string, id: string, blockerId: string, dto: LopaReviewExceptionDto, scope: Scope) {
    if (!dto.reason?.trim()) throw new BadRequestException('Accepting a blocker exception requires a reason.');
    const study = await this.studyRecord(tenantId, id, scope);
    const row = await this.db.single<any>(this.db.from('lopa_review_blockers').update({ accepted_exception: true, exception_reason: dto.reason, exception_approved_by: actorId, exception_approved_at: new Date().toISOString(), status: 'Accepted', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', blockerId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_BLOCKER_EXCEPTION_ACCEPTED', 'Review blocker exception accepted', dto.reason, { blockerId, study: study.lopa_number });
    await this.writeAudit(tenantId, actorId, 'lopa.review_blockers.accept_exception', 'LOPAReviewBlocker', blockerId, row as JsonValue);
    return row;
  }

  async reviewNotifications(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    return this.optionalMany('notifications', (q) => this.applyScope(q.select('*').eq('tenant_id', tenantId).eq('module', 'lopa').eq('related_record_id', id).order('created_at', { ascending: false }).limit(50), scope, 'site_id'));
  }

  async sendReviewReminders(tenantId: string, actorId: string, id: string, dto: LopaReviewReminderDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const participants = (await this.reviewParticipants(tenantId, id, scope)).filter((participant: any) => !dto.participantId || participant.id === dto.participantId).filter((participant: any) => participant.required_reviewer && (!['Approved', 'Approved with comments'].includes(participant.decision) || (participant.signature_required && participant.signature_status !== 'Signed')));
    const now = new Date().toISOString();
    const failed: string[] = [];
    for (const participant of participants) {
      try {
        await this.notifyReviewUser(tenantId, participant.user_id, study, 'lopa.review.reminder', 'LOPA review reminder', dto.message || `Your ${participant.review_role} review/signature remains pending for ${study.lopa_number}.`);
        await this.optionalSingle(this.db.from('lopa_review_participants').update({ reminder_sent_at: now, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', participant.id).select('id').single());
      } catch { failed.push(participant.id); }
    }
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_REMINDERS_SENT', 'Review reminders sent', `${participants.length - failed.length} reminder(s) sent.`, { failed });
    await this.writeAudit(tenantId, actorId, 'lopa.review_notifications.send', 'LOPA', id, { count: participants.length, failed });
    return { sent: participants.length - failed.length, failed };
  }

  async overview(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const [detail, readiness, blockers, recentActivity, sourceSnapshot, actions, initiatingEventSnapshots, conditionalModifierSnapshots] = await Promise.all([
      this.get(tenantId, id, scope),
      this.readiness(tenantId, id, scope),
      this.blockers(tenantId, id, scope),
      this.recentActivity(tenantId, id, scope),
      this.sourceSnapshot(tenantId, id, scope),
      this.optionalMany('Action', (q) => q.select('id,title,status,priority,dueDate,ownerId,module,recordId,tenantId').eq('tenantId', tenantId).eq('recordId', id).limit(20)),
      this.optionalMany('lopa_study_initiating_event_snapshots', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('active', true).order('selected_at', { ascending: false }).limit(1)),
      this.optionalMany('lopa_study_conditional_modifier_snapshots', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('active', true).neq('status', 'Archived').order('selected_at', { ascending: false }))
    ]);
    const consequences = detail.consequences ?? [];
    const initiatingEvents = detail.initiatingEvents ?? [];
    const safeguards = detail.importedSafeguards ?? [];
    const consequence = consequences[0] ?? null;
    const initiatingEvent = initiatingEvents[0] ?? null;
    const iplCandidates = safeguards.filter((s: any) => String(s.proposed_lopa_use ?? '').toLowerCase().includes('ipl'));
    const validatedIpls = safeguards.filter((s: any) => s.validation_status === 'Validated');
    const creditedIpls = safeguards.filter((s: any) => !!s.credited_as_ipl);
    const status = String(study.status ?? '');
    const readOnly = ['Approved', 'Closed'].includes(status);
    const sourceChanged = await this.sourceChangedAfterSnapshot(tenantId, detail.hazopScenarioId, sourceSnapshot);
    return {
      header: {
        ...detail,
        readOnly,
        overdue: !!study.due_date && study.due_date < new Date().toISOString().slice(0, 10) && !['Approved', 'Closed', 'Cancelled'].includes(status),
        sourceChanged
      },
      permissions: {
        canEdit: !readOnly,
        canCancel: !['Closed', 'Cancelled'].includes(status),
        canReopen: ['Approved', 'Closed', 'Cancelled'].includes(status),
        canSyncHazop: !!detail.hazopScenarioId && !readOnly,
        canViewSourceSnapshot: !!sourceSnapshot,
        canViewActions: true,
        canViewLinkedRecords: true
      },
      readOnly,
      summaryCards: [
        { key: 'status', label: 'Study status', value: detail.status, tone: this.toneForStatus(detail.status), tab: 'overview' },
        { key: 'source', label: 'Source type', value: detail.source ?? 'Manual', tone: 'info', tab: 'overview' },
        { key: 'consequenceSeverity', label: 'Consequence severity', value: consequence?.severity ?? detail.consequenceSeverity ?? 'Incomplete', tone: this.toneForRisk(consequence?.severity ?? detail.consequenceSeverity), tab: 'scenario' },
        { key: 'initiatingFrequency', label: 'Initiating event frequency', value: initiatingEvent?.frequency_per_year ?? detail.initiatingEventFrequency ?? 'Not available', tone: initiatingEvent?.frequency_per_year ? 'success' : 'warning', tab: 'initiating-event' },
        { key: 'conditionalModifiers', label: 'Conditional modifiers', value: conditionalModifierSnapshots.length ? `${conditionalModifierSnapshots.length} selected` : (study.conditional_modifiers_status ?? 'Not Started'), tone: conditionalModifierSnapshots.length ? 'success' : 'warning', tab: 'risk-calculation' },
        { key: 'importedSafeguards', label: 'Imported safeguards', value: safeguards.length, tone: safeguards.length ? 'info' : 'warning', tab: 'ipls' },
        { key: 'iplCandidates', label: 'IPL candidates', value: iplCandidates.length, tone: iplCandidates.length ? 'info' : 'warning', tab: 'ipls' },
        { key: 'validatedIpls', label: 'Validated IPLs', value: validatedIpls.length, tone: validatedIpls.length ? 'success' : 'warning', tab: 'ipls' },
        { key: 'creditedIpls', label: 'Credited IPLs', value: creditedIpls.length, tone: creditedIpls.length ? 'success' : 'warning', tab: 'ipls' },
        { key: 'totalPfdavg', label: 'Total PFDavg', value: study.total_pfdavg ?? 'Not calculated', tone: study.total_pfdavg ? 'success' : 'warning', tab: 'risk-calculation' },
        { key: 'totalRrf', label: 'Total RRF', value: study.total_rrf ?? 'Not calculated', tone: study.total_rrf ? 'success' : 'warning', tab: 'risk-calculation' },
        { key: 'mitigatedFrequency', label: 'Mitigated event frequency', value: detail.mitigatedEventFrequency ?? 'Not calculated', tone: detail.mitigatedEventFrequency ? 'success' : 'warning', tab: 'risk-calculation' },
        { key: 'tolerableFrequency', label: 'Tolerable frequency', value: detail.tolerableFrequency ?? consequence?.tolerable_event_frequency ?? 'Not set', tone: detail.tolerableFrequency || consequence?.tolerable_event_frequency ? 'success' : 'warning', tab: 'scenario' },
        { key: 'riskGap', label: 'Risk gap', value: detail.riskGap ?? 'Not evaluated', tone: String(detail.riskGap ?? '').toLowerCase().includes('gap') ? 'danger' : 'warning', tab: 'risk-calculation' },
        { key: 'calculationStatus', label: 'Calculation status', value: detail.calculationStatus, tone: this.toneForStatus(detail.calculationStatus), tab: 'risk-calculation' },
        { key: 'silRequired', label: 'SIL required', value: detail.silRequired ? 'Yes' : 'No', tone: detail.silRequired ? 'danger' : 'success', tab: 'sil' },
        { key: 'targetSil', label: 'Target SIL', value: detail.targetSil ?? 'Not determined', tone: detail.targetSil ? 'danger' : 'warning', tab: 'sil' },
        { key: 'silGap', label: 'SIL gap status', value: detail.silGapStatus, tone: this.toneForStatus(detail.silGapStatus), tab: 'sil' },
        { key: 'openActions', label: 'Open recommendations/actions', value: detail.openActions ?? actions.length, tone: (detail.openActions ?? actions.length) ? 'danger' : 'success', tab: 'actions' },
        { key: 'closureBlockers', label: 'Closure blockers', value: blockers.length, tone: blockers.length ? 'danger' : 'success', tab: 'review' },
        { key: 'reviewReadiness', label: 'Review readiness', value: readiness.status, tone: readiness.status === 'Ready' ? 'success' : blockers.length ? 'danger' : 'warning', tab: 'review' }
      ],
      sourceSnapshot: this.buildSourceSnapshot(detail, sourceSnapshot, sourceChanged),
      metadata: this.buildMetadata(study, detail),
      consequence: this.buildConsequenceSnapshot(consequence, detail),
      initiatingEvent: this.buildInitiatingEventSnapshot(initiatingEvent, detail, initiatingEventSnapshots[0]),
      safeguards: this.buildSafeguardSnapshot(safeguards),
      calculation: this.buildCalculationSnapshot(study, detail, consequence),
      librarySelections: {
        initiatingEvent: initiatingEventSnapshots[0] ?? null,
        conditionalModifiers: conditionalModifierSnapshots
      },
      sil: this.buildSilSnapshot(study, detail),
      readiness,
      blockers,
      actions: actions.map((a: any) => ({ id: a.id, title: a.title, status: a.status, priority: a.priority, dueDate: a.dueDate, ownerId: a.ownerId })),
      linkedRecords: this.buildLinkedRecords(detail, sourceSnapshot, actions),
      recentActivity,
      quickActions: this.buildQuickActions(detail, readiness, blockers, readOnly)
    };
  }

  async readiness(tenantId: string, id: string, scope: Scope) {
    const detail = await this.get(tenantId, id, scope);
    const consequence = detail.consequences?.[0];
    const ie = detail.initiatingEvents?.[0];
    const safeguards = detail.importedSafeguards ?? [];
    const checks = [
      this.check('basic_info', 'Basic study info complete', !!detail.title && !!detail.siteId && !!detail.ownerId),
      this.check('source', 'Source scenario linked/manual source justified', detail.source !== 'HAZOP/PHA' || !!detail.hazopScenarioId),
      this.check('consequence', 'Consequence complete', !!consequence?.description && !!(consequence?.severity ?? detail.consequenceSeverity)),
      this.check('initiating_event', 'Initiating event complete', !!ie?.description && !!(ie?.frequency_per_year ?? detail.initiatingEventFrequency)),
      this.check('frequency_source', 'Frequency source/reference provided', !!ie?.frequency_source || !!ie?.library_event),
      this.check('conditional_modifiers', 'Conditional modifiers reviewed', detail.calculationStatus !== 'Not Started', 'Warning'),
      this.check('safeguards', 'Safeguards imported/reviewed', safeguards.length > 0, 'Warning'),
      this.check('ipl_candidates', 'IPL candidates selected', safeguards.some((s: any) => String(s.proposed_lopa_use ?? '').toLowerCase().includes('ipl')), 'Warning'),
      this.check('ipl_validation', 'IPL validation complete', !['Not Started', 'Incomplete', 'Needs Review', 'Failed'].includes(detail.iplValidationStatus), 'Warning'),
      this.check('calculation', 'Calculation complete', !['Not Started', 'Incomplete', 'Needs Review', 'Failed'].includes(detail.calculationStatus), 'Warning'),
      this.check('risk_gap', 'Risk gap resolved', !String(detail.riskGap ?? '').toLowerCase().includes('gap'), 'Warning'),
      this.check('sil', 'SIL determination complete if required', !detail.silRequired || !!detail.targetSil, 'Warning'),
      this.check('actions', 'Required actions created', true),
      this.check('linked_records', 'Required linked records attached', true, 'Warning'),
      this.check('review', 'Review/sign-off ready', detail.status === 'Pending Review' || detail.status === 'Pending Approval' || detail.status === 'Approved' || detail.status === 'Closed', 'Warning')
    ];
    const complete = checks.filter((item) => item.status === 'Complete').length;
    const blocked = checks.filter((item) => item.status === 'Blocked').length;
    const warnings = checks.filter((item) => item.status === 'Warning').length;
    return { status: blocked ? 'Blocked' : warnings ? 'Not Ready' : 'Ready', complete, total: checks.length, blocked, warnings, checklist: checks };
  }

  async blockers(tenantId: string, id: string, scope: Scope) {
    const detail = await this.get(tenantId, id, scope);
    const consequence = detail.consequences?.[0];
    const ie = detail.initiatingEvents?.[0];
    const safeguards = detail.importedSafeguards ?? [];
    const blockers: any[] = [];
    if (!consequence?.description) blockers.push(this.blocker('Missing consequence', 'Complete the consequence description before review.', 'Hard', 'scenario'));
    if (!ie?.frequency_per_year && !detail.initiatingEventFrequency) blockers.push(this.blocker('Missing initiating event frequency', 'Define the initiating event frequency and source.', 'Hard', 'initiating-event'));
    if (detail.source === 'Manual' && !detail.description) blockers.push(this.blocker('Manual justification missing', 'Manual LOPA studies need a source justification in the description.', 'Soft', 'overview'));
    if (!safeguards.some((s: any) => String(s.proposed_lopa_use ?? '').toLowerCase().includes('ipl'))) blockers.push(this.blocker('No IPL candidates', 'Select candidate IPLs before running a LOPA calculation.', 'Soft', 'ipls'));
    if (['Not Started', 'Incomplete', 'Needs Review', 'Failed'].includes(detail.iplValidationStatus)) blockers.push(this.blocker('IPL validation incomplete', 'Validate credited IPLs before reducing risk.', 'Hard', 'ipls'));
    if (['Not Started', 'Incomplete', 'Needs Review', 'Failed'].includes(detail.calculationStatus)) blockers.push(this.blocker('Calculation incomplete', 'Run and approve the LOPA calculation.', 'Hard', 'risk-calculation'));
    if (String(detail.riskGap ?? '').toLowerCase().includes('gap')) blockers.push(this.blocker('Risk gap open', 'Close or justify the remaining risk gap.', 'Hard', 'risk-calculation'));
    if (String(detail.silGapStatus ?? '').toLowerCase().includes('gap')) blockers.push(this.blocker('SIL gap open', 'Resolve SIL gap or create required MOC/MI actions.', 'Hard', 'sil'));
    if (detail.status !== 'Pending Approval' && detail.status !== 'Approved' && detail.status !== 'Closed') blockers.push(this.blocker('Review/sign-off missing', 'Request review after required data is complete.', 'Soft', 'review'));
    return blockers;
  }

  async recentActivity(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.optionalMany('lopa_history_events', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }).limit(10));
  }

  async sourceSnapshot(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const rows = await this.optionalMany('lopa_source_snapshots', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }).limit(1));
    return rows[0] ?? null;
  }

  async syncHazopSource(tenantId: string, actorId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    if (!study.source_hazop_scenario_id) throw new BadRequestException('This LOPA study is not linked to a HAZOP scenario.');
    const scenario = await this.hazopRequiredScenario(tenantId, study.source_hazop_scenario_id, scope);
    const snapshot = await this.insertSourceSnapshot(tenantId, id, actorId, 'HAZOP', study.source_hazop_scenario_id, scenario);
    await this.optionalSingle(this.db.from('lopa_studies').update({ source_snapshot_id: snapshot.id, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'SOURCE_SYNCED', 'HAZOP source snapshot synced', 'LOPA source snapshot was refreshed from the linked HAZOP scenario.', { sourceSnapshotId: snapshot.id });
    await this.writeAudit(tenantId, actorId, 'lopa.source_sync', 'LOPA', id, { sourceSnapshotId: snapshot.id });
    return this.overview(tenantId, id, scope);
  }

  async scenarioConsequenceContext(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    return {
      operatingModes: ['Normal operation', 'Startup', 'Shutdown', 'Maintenance', 'Regeneration', 'Cleaning/flushing', 'Commissioning', 'Emergency operation', 'Abnormal operation', 'Other'],
      scenarioSources: ['HAZOP/PHA', 'Manual', 'MOC', 'PSSR', 'Incident', 'Audit', 'Revalidation', 'Other'],
      causeCategories: ['Equipment failure', 'Instrument failure', 'Control failure', 'Utility failure', 'Human error', 'Procedure failure', 'External event', 'Process upset', 'Maintenance error', 'Design deficiency', 'Other'],
      causeTypes: ['Single cause', 'Common cause', 'Enabling cause', 'Human error', 'External initiating cause', 'Process demand', 'Other'],
      consequenceCategories: ['Personnel injury/fatality', 'Toxic exposure', 'Fire', 'Explosion', 'Environmental release', 'Asset damage', 'Business interruption', 'Regulatory non-compliance', 'Community impact', 'Other'],
      impactTypes: ['Safety', 'Environment', 'Asset', 'Business', 'Reputation', 'Regulatory', 'Multiple'],
      receptorTypes: ['Operator', 'Maintenance worker', 'Contractor', 'Nearby worker', 'Control room personnel', 'Public/community', 'Environment', 'Equipment/assets', 'Production/business', 'Multiple receptors', 'Other'],
      exposureRoutes: ['Toxic inhalation', 'Thermal radiation', 'Overpressure', 'Fire/explosion', 'Chemical contact', 'Environmental release', 'Mechanical impact', 'Other'],
      riskCriteriaSources: ['Corporate risk criteria', 'Site risk criteria', 'Regulatory requirement', 'Project-specific criteria', 'Engineering judgement', 'Other'],
      riskCriteriaTypes: ['Individual risk', 'Societal risk', 'Environmental risk', 'Asset/business risk', 'Scenario-specific tolerable frequency', 'Other'],
      readOnly: this.isReadOnly(study)
    };
  }

  async scenarioConsequence(tenantId: string, id: string, scope: Scope): Promise<any> {
    const detail = await this.get(tenantId, id, scope);
    const study = await this.studyRecord(tenantId, id, scope);
    const [sourceSnapshot, comparison, readiness, receptors, notes, riskCriteria, actions] = await Promise.all([
      this.sourceSnapshot(tenantId, id, scope),
      this.scenarioSourceComparison(tenantId, id, scope),
      this.scenarioReadiness(tenantId, id, scope),
      this.impactedReceptors(tenantId, id, scope),
      this.scenarioNotes(tenantId, id, scope),
      this.latestRiskCriteria(tenantId, id),
      this.optionalMany('Action', (q) => q.select('id,title,status,priority,dueDate,ownerId').eq('tenantId', tenantId).eq('recordId', id).limit(20))
    ]);
    const consequence = detail.consequences?.[0] ?? {};
    const source = sourceSnapshot?.source_payload ?? {};
    return {
      study: detail,
      summary: {
        scenarioSource: study.scenario_source ?? detail.source ?? 'Manual',
        scenarioCompleteness: readiness.status,
        linkedHazopStatus: source.status ?? (detail.hazopScenarioId ? 'Linked' : 'Not linked'),
        consequenceCategory: consequence.category ?? 'Missing',
        consequenceSeverity: consequence.severity ?? detail.consequenceSeverity ?? 'Missing',
        impactedReceptors: receptors.length,
        tolerableFrequency: consequence.tolerable_event_frequency ?? detail.tolerableFrequency ?? null,
        riskCriteriaSource: consequence.risk_criteria_source ?? riskCriteria?.criteria_source ?? 'Missing',
        sourceSnapshotStatus: sourceSnapshot ? 'Available' : 'Missing',
        sourceChanged: comparison.changedCount,
        missingRequiredFields: readiness.checklist.filter((c: any) => !c.complete).length,
        readyForInitiatingEvent: readiness.status === 'Ready'
      },
      linkedHazop: detail.hazopScenarioId ? this.buildSourceSnapshot(detail, sourceSnapshot, comparison.sourceChanged) : null,
      scenario: {
        title: study.scenario_title ?? detail.title,
        description: study.scenario_description ?? detail.description,
        source: study.scenario_source ?? detail.source,
        studyType: detail.studyType,
        operatingMode: study.operating_mode ?? null,
        processArea: detail.areaId,
        unit: detail.unitId,
        equipmentSystem: study.equipment_tag ?? detail.equipmentTag,
        equipmentTag: detail.equipmentTag,
        boundary: study.scenario_boundary ?? null,
        includedEquipment: study.included_equipment ?? null,
        excludedEquipment: study.excluded_equipment ?? null,
        assumptions: study.scenario_assumptions ?? null,
        exclusions: study.scenario_exclusions ?? null,
        ownerId: study.scenario_owner_id ?? detail.ownerId,
        reviewStatus: study.scenario_review_status ?? 'Draft'
      },
      causeConsequence: {
        deviation: study.deviation ?? source.deviation ?? null,
        guideword: study.guideword ?? source.guideword ?? null,
        parameter: study.parameter ?? source.parameter ?? null,
        cause: study.cause_description ?? source.cause ?? null,
        causeCategory: study.cause_category ?? null,
        causeType: study.cause_type ?? null,
        consequence: consequence.description ?? source.consequence ?? null,
        escalationPath: study.escalation_path ?? null,
        hazardousEvent: study.hazardous_event ?? null,
        lossEvent: study.loss_event ?? null,
        topEvent: study.top_event ?? null,
        safeguardsSummary: study.safeguards_summary ?? source.existingSafeguards ?? null,
        lopaBoundaryStatement: study.lopa_boundary_statement ?? null
      },
      consequence: this.buildConsequenceSnapshot(consequence, detail),
      receptors,
      riskCriteria,
      comparison,
      readiness,
      notes,
      actions
    };
  }

  async updateScenarioConsequence(tenantId: string, actorId: string, id: string, dto: UpdateLopaScenarioConsequenceDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const sourceSnapshot = await this.sourceSnapshot(tenantId, id, scope);
    const imported = !!sourceSnapshot && (study.source === 'HAZOP/PHA' || study.source_module === 'HAZOP');
    const source = sourceSnapshot?.source_payload ?? {};
    const importedChanged = imported && ['deviation', 'causeDescription', 'consequenceDescription', 'consequenceSeverity', 'equipmentTag'].some((key) => {
      const incoming = (dto as any)[key];
      if (incoming === undefined) return false;
      const sourceValue = key === 'causeDescription' ? source.cause : key === 'consequenceDescription' ? source.consequence : key === 'consequenceSeverity' ? source.riskLevel : source[key];
      return String(incoming ?? '') !== String(sourceValue ?? '');
    });
    if (importedChanged && !dto.editReason) throw new BadRequestException('Editing imported HAZOP values requires an edit reason.');
    const studyPayload = this.clean({
      scenario_title: dto.scenarioTitle,
      scenario_description: dto.scenarioDescription,
      scenario_source: dto.scenarioSource,
      operating_mode: dto.operatingMode,
      equipment_tag: dto.equipmentTag ?? dto.equipmentSystem,
      scenario_boundary: dto.scenarioBoundary,
      included_equipment: dto.includedEquipment,
      excluded_equipment: dto.excludedEquipment,
      scenario_assumptions: dto.assumptions,
      scenario_exclusions: dto.exclusions,
      scenario_owner_id: dto.ownerId,
      scenario_review_status: dto.reviewStatus,
      deviation: dto.deviation,
      guideword: dto.guideword,
      parameter: dto.parameter,
      cause_description: dto.causeDescription,
      cause_category: dto.causeCategory,
      cause_type: dto.causeType,
      escalation_path: dto.escalationPath,
      hazardous_event: dto.hazardousEvent,
      loss_event: dto.lossEvent,
      top_event: dto.topEvent,
      safeguards_summary: dto.safeguardsSummary,
      lopa_boundary_statement: dto.lopaBoundaryStatement,
      consequence_severity: dto.consequenceSeverity,
      tolerable_frequency: dto.tolerableEventFrequency,
      source_change_reason: dto.editReason,
      calculation_status: this.needsRecalculation(study) ? 'Needs Recalculation' : study.calculation_status,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    if (Object.keys(studyPayload).length) await this.optionalSingle(this.db.from('lopa_studies').update(studyPayload).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.upsertConsequenceRow(tenantId, actorId, study, id, dto);
    if (dto.tolerableEventFrequency && dto.riskCriteriaSource) await this.insertRiskCriteriaSnapshot(tenantId, actorId, study, id, dto);
    await this.writeHistory(tenantId, id, actorId, 'SCENARIO_CONSEQUENCE_UPDATED', 'Scenario & consequence updated', dto.editReason || 'LOPA scenario/consequence data updated.', this.clean({ editReason: dto.editReason }) as JsonValue);
    await this.writeAudit(tenantId, actorId, 'lopa.scenario_consequence.update', 'LOPA', id, this.clean({ study: studyPayload, dto }) as unknown as JsonValue);
    return this.scenarioConsequence(tenantId, id, scope);
  }

  async syncScenarioFromHazop(tenantId: string, actorId: string, id: string, scope: Scope) {
    await this.syncHazopSource(tenantId, actorId, id, scope);
    const sourceSnapshot = await this.sourceSnapshot(tenantId, id, scope);
    const source = sourceSnapshot?.source_payload ?? {};
    await this.updateScenarioConsequence(tenantId, actorId, id, {
      deviation: source.deviation,
      causeDescription: source.cause,
      consequenceDescription: source.consequence,
      consequenceSeverity: source.riskLevel,
      equipmentSystem: source.equipmentTag,
      editReason: 'Synced from linked HAZOP source'
    }, scope);
    await this.optionalSingle(this.db.from('lopa_studies').update({ source_last_synced_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    return this.scenarioConsequence(tenantId, id, scope);
  }

  async scenarioSourceComparison(tenantId: string, id: string, scope: Scope) {
    const detail = await this.get(tenantId, id, scope);
    const study = await this.studyRecord(tenantId, id, scope);
    const snapshot = await this.sourceSnapshot(tenantId, id, scope);
    const source = snapshot?.source_payload ?? {};
    const current = {
      deviation: study.deviation,
      cause: study.cause_description,
      consequence: detail.consequences?.[0]?.description,
      riskLevel: detail.consequenceSeverity,
      equipment: detail.equipmentTag,
      safeguards: study.safeguards_summary,
      recommendations: detail.openActions,
      linkedRecords: detail.hazopScenarioId
    };
    const rows = ['deviation', 'cause', 'consequence', 'riskLevel', 'equipment', 'safeguards', 'recommendations', 'linkedRecords'].map((key) => {
      const sourceValue = source[key] ?? (key === 'equipment' ? source.equipmentTag : key === 'safeguards' ? source.existingSafeguards : null);
      const currentValue = (current as any)[key];
      return { key, sourceValue, currentValue, changed: String(sourceValue ?? '') !== String(currentValue ?? '') };
    });
    return { sourceChanged: await this.sourceChangedAfterSnapshot(tenantId, detail.hazopScenarioId, snapshot), changedCount: rows.filter((r) => r.changed).length, snapshot, rows };
  }

  async scenarioReadiness(tenantId: string, id: string, scope: Scope): Promise<any> {
    const detail = await this.get(tenantId, id, scope);
    const study = await this.studyRecord(tenantId, id, scope);
    const consequence = detail.consequences?.[0] ?? {};
    const [receptors, riskCriteria, comparison] = await Promise.all([
      this.impactedReceptors(tenantId, id, scope),
      this.latestRiskCriteria(tenantId, id),
      this.scenarioSourceComparison(tenantId, id, scope).catch(() => ({ changedCount: 0, snapshot: null }))
    ]);
    const data: any = {
      study: detail,
      scenario: {
        title: study.scenario_title ?? detail.title,
        source: study.scenario_source ?? detail.source
      },
      causeConsequence: {
        deviation: study.deviation,
        cause: study.cause_description,
        consequence: consequence.description
      },
      consequence: this.buildConsequenceSnapshot(consequence, detail),
      receptors,
      riskCriteria,
      comparison
    };
    const checks = [
      this.check('scenario_title', 'Scenario title complete', !!data.scenario?.title),
      this.check('scenario_source', 'Scenario source defined', !!data.scenario?.source),
      this.check('source_or_justification', 'HAZOP source linked or manual justification provided', data.scenario?.source !== 'HAZOP/PHA' || !!data.study?.hazopScenarioId),
      this.check('deviation_cause_consequence', 'Deviation/cause/consequence complete', !!data.causeConsequence?.deviation && !!data.causeConsequence?.cause && !!data.causeConsequence?.consequence),
      this.check('category', 'Consequence category selected', !!data.consequence?.category),
      this.check('severity', 'Severity selected', !!data.consequence?.severity),
      this.check('receptor', 'Impacted receptor selected', (data.receptors ?? []).length > 0),
      this.check('tolerable_frequency', 'Tolerable event frequency selected', !!data.consequence?.tolerableEventFrequency),
      this.check('criteria_source', 'Risk criteria source selected', !!data.consequence?.riskCriteriaSource || !!data.riskCriteria?.criteria_source),
      this.check('basis', 'Required consequence basis/reference provided', !!data.consequence?.basis || !!data.consequence?.sourceReference, 'Warning'),
      this.check('source_snapshot', 'Source snapshot reviewed', data.scenario?.source !== 'HAZOP/PHA' || !!data.comparison?.snapshot, 'Warning'),
      this.check('change_reasons', 'Change reasons documented', !data.comparison?.changedCount || !!study.source_change_reason, 'Warning'),
      this.check('ready_ie', 'Ready for initiating event definition', !!data.causeConsequence?.cause && !!data.consequence?.severity)
    ];
    return this.readinessFromChecks(checks);
  }

  async markScenarioConsequenceComplete(tenantId: string, actorId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const readiness = await this.scenarioReadiness(tenantId, id, scope);
    if (readiness.status === 'Blocked') throw new BadRequestException('Scenario & Consequence has hard blockers.');
    await this.optionalSingle(this.db.from('lopa_consequences').update({ completion_status: 'Complete', review_status: 'Completed', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'SCENARIO_CONSEQUENCE_COMPLETE', 'Scenario & consequence marked complete', 'Scenario & Consequence tab was marked complete.', {});
    await this.writeAudit(tenantId, actorId, 'lopa.scenario_consequence.mark_complete', 'LOPA', id, readiness as JsonValue);
    return this.scenarioConsequence(tenantId, id, scope);
  }

  async impactedReceptors(tenantId: string, id: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    return this.optionalMany('lopa_impacted_receptors', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('created_at', { ascending: false }));
  }

  async createImpactedReceptor(tenantId: string, actorId: string, id: string, dto: LopaImpactedReceptorDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_impacted_receptors').insert(this.clean({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id, site_id: study.site_id, lopa_study_id: id, receptor_type: dto.receptorType, exposure_location: dto.exposureLocation, estimated_occupancy_presence: dto.estimatedOccupancyPresence, exposure_route: dto.exposureRoute, impact_description: dto.impactDescription, severity: dto.severity, notes: dto.notes, created_by: actorId, updated_by: actorId })).select().single());
    await this.writeHistory(tenantId, id, actorId, 'IMPACTED_RECEPTOR_CREATED', 'Impacted receptor added', dto.receptorType, { receptorId: row.id });
    await this.writeAudit(tenantId, actorId, 'lopa.receptor.create', 'LOPA', id, row as JsonValue);
    return row;
  }

  async updateImpactedReceptor(tenantId: string, actorId: string, id: string, receptorId: string, dto: LopaImpactedReceptorDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const row = await this.db.single<any>(this.db.from('lopa_impacted_receptors').update(this.clean({ receptor_type: dto.receptorType, exposure_location: dto.exposureLocation, estimated_occupancy_presence: dto.estimatedOccupancyPresence, exposure_route: dto.exposureRoute, impact_description: dto.impactDescription, severity: dto.severity, notes: dto.notes, updated_by: actorId, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', receptorId).select().single());
    await this.writeHistory(tenantId, id, actorId, 'IMPACTED_RECEPTOR_UPDATED', 'Impacted receptor updated', dto.receptorType, { receptorId });
    await this.writeAudit(tenantId, actorId, 'lopa.receptor.update', 'LOPA', id, row as JsonValue);
    return row;
  }

  async deleteImpactedReceptor(tenantId: string, actorId: string, id: string, receptorId: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    await this.optionalSingle(this.db.from('lopa_impacted_receptors').delete().eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', receptorId).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'IMPACTED_RECEPTOR_DELETED', 'Impacted receptor removed', 'Impacted receptor was deleted.', { receptorId });
    await this.writeAudit(tenantId, actorId, 'lopa.receptor.delete', 'LOPA', id, { receptorId });
    return { id: receptorId, deleted: true };
  }

  scenarioNotes(tenantId: string, id: string, scope: Scope) {
    return this.notesFor('lopa_scenario_notes', tenantId, id, scope);
  }

  createScenarioNote(tenantId: string, actorId: string, id: string, dto: LopaNoteDto, scope: Scope) {
    return this.createNote('lopa_scenario_notes', tenantId, actorId, id, dto, scope, 'SCENARIO_NOTE_CREATED');
  }

  updateScenarioNote(tenantId: string, actorId: string, id: string, noteId: string, dto: LopaNoteDto, scope: Scope) {
    return this.updateNote('lopa_scenario_notes', tenantId, actorId, id, noteId, dto, scope, 'SCENARIO_NOTE_UPDATED');
  }

  deleteScenarioNote(tenantId: string, actorId: string, id: string, noteId: string, scope: Scope) {
    return this.deleteNote('lopa_scenario_notes', tenantId, actorId, id, noteId, scope, 'SCENARIO_NOTE_DELETED');
  }

  async initiatingEventContext(tenantId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    return { ...await this.libraryContext(tenantId, scope), readOnly: this.isReadOnly(study) };
  }

  async initiatingEventTab(tenantId: string, id: string, scope: Scope) {
    const detail = await this.get(tenantId, id, scope);
    const study = await this.studyRecord(tenantId, id, scope);
    const [readiness, modifiers, notes, frequencySnapshot, actions] = await Promise.all([
      this.initiatingEventReadiness(tenantId, id, scope),
      this.studyConditionalModifierSnapshots(tenantId, id, scope),
      this.initiatingEventNotes(tenantId, id, scope),
      this.frequencySnapshot(tenantId, id, scope),
      this.optionalMany('Action', (q) => q.select('id,title,status,priority,dueDate,ownerId').eq('tenantId', tenantId).eq('recordId', id).limit(20))
    ]);
    const event = detail.initiatingEvents?.[0] ?? {};
    const latestLibrary = (detail as any).librarySelections?.initiatingEvent ?? (await this.optionalMany('lopa_study_initiating_event_snapshots', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('selected_at', { ascending: false }).limit(1)))[0] ?? null;
    return {
      study: detail,
      summary: {
        status: event.completion_status ?? 'Incomplete',
        inputMethod: event.frequency_method ?? (latestLibrary ? 'Library' : 'Not selected'),
        eventCategory: event.event_category ?? latestLibrary?.event_category ?? 'Missing',
        failureMode: event.failure_mode ?? latestLibrary?.failure_mode ?? 'Missing',
        baseFrequency: event.frequency_per_year ?? latestLibrary?.selected_frequency ?? detail.initiatingEventFrequency ?? null,
        frequencyUnit: event.frequency_unit ?? latestLibrary?.frequency_unit ?? 'per year',
        lowEstimate: event.low_estimate ?? latestLibrary?.low_frequency ?? null,
        highEstimate: event.high_estimate ?? latestLibrary?.high_frequency ?? null,
        confidenceLevel: event.confidence_level ?? latestLibrary?.confidence_level ?? 'Missing',
        siteModifier: event.site_modifier ?? latestLibrary?.site_modifier ?? null,
        conditionalModifiersApplied: modifiers.length,
        combinedModifierFactor: frequencySnapshot.combinedModifierFactor,
        frequencySourceStatus: event.frequency_source || latestLibrary?.source_reference ? 'Referenced' : 'Missing',
        justificationStatus: event.engineering_justification || latestLibrary?.engineering_justification ? 'Documented' : 'Missing',
        readyForCalculation: readiness.status === 'Ready'
      },
      definition: {
        description: event.description ?? latestLibrary?.event_name ?? null,
        category: event.event_category ?? latestLibrary?.event_category ?? null,
        failureMode: event.failure_mode ?? latestLibrary?.failure_mode ?? null,
        equipmentSystem: event.equipment_system ?? detail.equipmentTag ?? null,
        equipmentTag: event.equipment_tag ?? detail.equipmentTag ?? null,
        boundary: event.event_boundary ?? null,
        trigger: event.event_trigger ?? null,
        linkedConsequenceId: event.linked_consequence_id ?? detail.consequences?.[0]?.id ?? null,
        source: event.frequency_method ?? (latestLibrary ? 'Library' : null),
        notes: event.notes ?? null
      },
      librarySnapshot: latestLibrary,
      manualFrequency: {
        frequency: event.frequency_per_year,
        unit: event.frequency_unit,
        low: event.low_estimate,
        high: event.high_estimate,
        confidence: event.confidence_level,
        basis: event.basis,
        sourceReference: event.frequency_source,
        justification: event.engineering_justification,
        reviewerRequired: event.reviewer_required,
        approvalStatus: event.manual_entry_approval_status
      },
      siteModifier: {
        enabled: !!event.site_modifier,
        value: event.site_modifier,
        type: event.site_modifier_type,
        basis: event.site_modifier_basis,
        sourceReference: event.site_modifier_source_reference,
        approvalStatus: event.site_modifier_approval_status,
        justification: event.engineering_justification
      },
      modifiers,
      frequencySnapshot,
      readiness,
      notes,
      actions
    };
  }

  async updateInitiatingEventTab(tenantId: string, actorId: string, id: string, dto: UpdateLopaInitiatingEventDto, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    await this.upsertInitiatingEventRow(tenantId, actorId, study, id, dto);
    await this.markNeedsRecalculationIfNeeded(tenantId, id, study, actorId);
    await this.writeHistory(tenantId, id, actorId, 'INITIATING_EVENT_UPDATED', 'Initiating event updated', 'Initiating event definition was updated.', {});
    await this.writeAudit(tenantId, actorId, 'lopa.initiating_event.update', 'LOPA', id, dto as JsonValue);
    return this.initiatingEventTab(tenantId, id, scope);
  }

  async saveManualFrequency(tenantId: string, actorId: string, id: string, dto: LopaManualFrequencyDto, scope: Scope) {
    if (dto.frequencyPerYear <= 0) throw new BadRequestException('Manual initiating event frequency must be positive.');
    if (!dto.sourceReference || !dto.engineeringJustification) throw new BadRequestException('Manual frequency requires source/reference and engineering justification.');
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    await this.upsertInitiatingEventRow(tenantId, actorId, study, id, {
      eventSource: 'Manual'
    });
    await this.optionalSingle(this.db.from('lopa_initiating_events').update(this.clean({ frequency_method: 'Manual', frequency_per_year: dto.frequencyPerYear, frequency_unit: dto.frequencyUnit, low_estimate: dto.lowEstimate, high_estimate: dto.highEstimate, confidence_level: dto.confidenceLevel, basis: dto.basis, frequency_source: dto.sourceReference, engineering_justification: dto.engineeringJustification, reviewer_required: dto.reviewerRequired, manual_entry_approval_status: dto.approvalStatus ?? 'Pending Review', completion_status: 'In Progress', updated_by: actorId, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('lopa_study_id', id).select('id').single());
    await this.optionalSingle(this.db.from('lopa_studies').update({ initiating_event_frequency: dto.frequencyPerYear, calculation_status: this.needsRecalculation(study) ? 'Needs Recalculation' : study.calculation_status, updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'MANUAL_FREQUENCY_UPDATED', 'Manual initiating event frequency saved', dto.basis, {});
    await this.writeAudit(tenantId, actorId, 'lopa.initiating_event.manual_frequency', 'LOPA', id, dto as unknown as JsonValue);
    return this.initiatingEventTab(tenantId, id, scope);
  }

  async saveSiteModifier(tenantId: string, actorId: string, id: string, dto: LopaSiteModifierDto, scope: Scope) {
    if (dto.enabled && dto.modifierValue <= 0) throw new BadRequestException('Site modifier must be positive.');
    if (dto.enabled && (!dto.sourceReference || !dto.engineeringJustification)) throw new BadRequestException('Site modifier requires source/reference and engineering justification.');
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    await this.upsertInitiatingEventRow(tenantId, actorId, study, id, {});
    await this.optionalSingle(this.db.from('lopa_initiating_events').update(this.clean({ site_modifier: dto.enabled ? dto.modifierValue : null, site_modifier_type: dto.enabled ? dto.modifierType : null, site_modifier_basis: dto.enabled ? dto.basis : null, site_modifier_source_reference: dto.enabled ? dto.sourceReference : null, site_modifier_approval_status: dto.enabled ? dto.approvalStatus ?? 'Pending Review' : null, engineering_justification: dto.enabled ? dto.engineeringJustification : null, updated_by: actorId, updated_at: new Date().toISOString() })).eq('tenant_id', tenantId).eq('lopa_study_id', id).select('id').single());
    await this.markNeedsRecalculationIfNeeded(tenantId, id, study, actorId);
    await this.writeHistory(tenantId, id, actorId, 'SITE_MODIFIER_UPDATED', 'Site modifier updated', dto.basis, this.clean({ enabled: dto.enabled, modifierValue: dto.modifierValue }) as JsonValue);
    await this.writeAudit(tenantId, actorId, 'lopa.initiating_event.site_modifier', 'LOPA', id, dto as unknown as JsonValue);
    return this.initiatingEventTab(tenantId, id, scope);
  }

  async initiatingEventReadiness(tenantId: string, id: string, scope: Scope) {
    const detail = await this.get(tenantId, id, scope);
    const event = detail.initiatingEvents?.[0] ?? {};
    const modifiers = await this.studyConditionalModifierSnapshots(tenantId, id, scope);
    const librarySnapshots = await this.optionalMany('lopa_study_initiating_event_snapshots', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('selected_at', { ascending: false }).limit(1));
    const hasFrequency = !!(event.frequency_per_year ?? detail.initiatingEventFrequency ?? librarySnapshots[0]?.selected_frequency);
    const checks = [
      this.check('description', 'Initiating event description complete', !!(event.description ?? librarySnapshots[0]?.event_name)),
      this.check('category', 'Category selected', !!(event.event_category ?? librarySnapshots[0]?.event_category)),
      this.check('failure_mode', 'Failure mode selected', !!(event.failure_mode ?? librarySnapshots[0]?.failure_mode)),
      this.check('frequency_method', 'Frequency input method selected', !!(event.frequency_method ?? librarySnapshots[0])),
      this.check('library_or_manual', 'Library event selected or manual frequency justified', !!librarySnapshots[0] || (!!event.frequency_per_year && !!event.engineering_justification)),
      this.check('source_reference', 'Frequency source/reference provided', !!(event.frequency_source ?? librarySnapshots[0]?.source_reference)),
      this.check('uncertainty', 'Low/high uncertainty range reviewed', !!(event.low_estimate || librarySnapshots[0]?.low_frequency) && !!(event.high_estimate || librarySnapshots[0]?.high_frequency), 'Warning'),
      this.check('site_modifier', 'Site modifier justified if used', !event.site_modifier || !!event.engineering_justification),
      this.check('conditional_modifiers', 'Conditional modifiers reviewed', modifiers.length > 0, 'Warning'),
      this.check('manual_overrides', 'Manual overrides approved if required', event.frequency_method !== 'Manual' || event.manual_entry_approval_status === 'Approved', 'Warning'),
      this.check('snapshot', 'Snapshot stored', !!librarySnapshots[0] || !!event.frequency_per_year),
      this.check('ready_calc', 'Ready for IPL validation/calculation', hasFrequency)
    ];
    return this.readinessFromChecks(checks);
  }

  async markInitiatingEventComplete(tenantId: string, actorId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    this.assertMutable(study);
    const readiness = await this.initiatingEventReadiness(tenantId, id, scope);
    if (readiness.status === 'Blocked') throw new BadRequestException('Initiating Event has hard blockers.');
    await this.upsertInitiatingEventRow(tenantId, actorId, study, id, {});
    await this.optionalSingle(this.db.from('lopa_initiating_events').update({ completion_status: 'Complete', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'INITIATING_EVENT_COMPLETE', 'Initiating event marked complete', 'Initiating Event tab was marked complete.', {});
    await this.writeAudit(tenantId, actorId, 'lopa.initiating_event.mark_complete', 'LOPA', id, readiness as JsonValue);
    return this.initiatingEventTab(tenantId, id, scope);
  }

  async frequencySnapshot(tenantId: string, id: string, scope: Scope) {
    const detail = await this.get(tenantId, id, scope);
    const study = await this.studyRecord(tenantId, id, scope);
    const event = detail.initiatingEvents?.[0] ?? {};
    const librarySnapshot = (await this.optionalMany('lopa_study_initiating_event_snapshots', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).order('selected_at', { ascending: false }).limit(1)))[0] ?? null;
    const modifiers = await this.studyConditionalModifierSnapshots(tenantId, id, scope);
    const combined = this.combinedModifierFactors(modifiers);
    const base = Number(event.frequency_per_year ?? librarySnapshot?.selected_frequency ?? detail.initiatingEventFrequency ?? 0);
    const siteModifier = Number(event.site_modifier ?? librarySnapshot?.site_modifier ?? 1);
    const beforeConditional = base * siteModifier;
    return {
      inputMethod: event.frequency_method ?? (librarySnapshot ? 'Library' : 'Not Selected'),
      libraryEventSnapshot: librarySnapshot,
      manualFrequencySnapshot: event.frequency_method === 'Manual' ? event : null,
      baseFrequencyUsed: base || null,
      siteModifierUsed: siteModifier || null,
      finalFrequencyBeforeConditionalModifiers: beforeConditional || null,
      selectedConditionalModifiers: modifiers,
      combinedModifierFactor: combined.factor,
      combinedLowFactor: combined.low,
      combinedHighFactor: combined.high,
      finalFrequencyAfterConditionalModifiers: beforeConditional ? beforeConditional * combined.factor : null,
      sourceReferences: [event.frequency_source, librarySnapshot?.source_reference, ...modifiers.map((m: any) => m.source_reference)].filter(Boolean),
      confidenceRange: { low: event.low_estimate ?? librarySnapshot?.low_frequency ?? null, high: event.high_estimate ?? librarySnapshot?.high_frequency ?? null },
      createdBy: event.created_by ?? librarySnapshot?.selected_by ?? null,
      createdAt: event.created_at ?? librarySnapshot?.selected_at ?? null,
      updatedBy: event.updated_by ?? study.updated_by ?? null,
      updatedAt: event.updated_at ?? study.updated_at ?? null
    };
  }

  initiatingEventNotes(tenantId: string, id: string, scope: Scope) {
    return this.notesFor('lopa_initiating_event_notes', tenantId, id, scope);
  }

  createInitiatingEventNote(tenantId: string, actorId: string, id: string, dto: LopaNoteDto, scope: Scope) {
    return this.createNote('lopa_initiating_event_notes', tenantId, actorId, id, dto, scope, 'INITIATING_EVENT_NOTE_CREATED');
  }

  updateInitiatingEventNote(tenantId: string, actorId: string, id: string, noteId: string, dto: LopaNoteDto, scope: Scope) {
    return this.updateNote('lopa_initiating_event_notes', tenantId, actorId, id, noteId, dto, scope, 'INITIATING_EVENT_NOTE_UPDATED');
  }

  deleteInitiatingEventNote(tenantId: string, actorId: string, id: string, noteId: string, scope: Scope) {
    return this.deleteNote('lopa_initiating_event_notes', tenantId, actorId, id, noteId, scope, 'INITIATING_EVENT_NOTE_DELETED');
  }

  saveDraft(tenantId: string, actorId: string, dto: CreateLopaDto, scope: Scope) {
    return this.create(tenantId, actorId, { ...dto, status: 'Draft' }, scope);
  }

  async createFromHazop(tenantId: string, actorId: string, scenarioId: string, dto: CreateLopaFromHazopDto, scope: Scope) {
    const scenario = await this.hazopRequiredScenario(tenantId, scenarioId, scope);
    let existing = await this.optionalMany('lopa_studies', (q) => q.select('id,lopa_number,status,source_snapshot_id,created_by,created_at').eq('tenant_id', tenantId).eq('source_hazop_scenario_id', scenarioId).in('status', ACTIVE_STATUSES));
    const interrupted = existing.filter((row) => !row.source_snapshot_id && row.created_by === actorId && ['Draft', 'In Preparation'].includes(row.status));
    for (const row of interrupted) {
      const snapshots = await this.optionalMany('lopa_source_snapshots', (q) => q.select('id').eq('tenant_id', tenantId).eq('lopa_study_id', row.id).limit(1));
      if (snapshots.length) continue;
      await this.db.single<any>(this.db.from('lopa_studies').delete().eq('tenant_id', tenantId).eq('id', row.id).select('id').single());
      await this.writeAudit(tenantId, actorId, 'lopa.create.recover_interrupted', 'LOPA', row.id, { scenarioId, lopaNumber: row.lopa_number });
      existing = existing.filter((candidate) => candidate.id !== row.id);
    }
    if (existing.length && !dto.allowDuplicate) {
      throw new BadRequestException(`A LOPA study already exists for this HAZOP scenario (${existing[0]?.lopa_number}).`);
    }
    const values: CreateLopaDto = {
      ...dto,
      title: dto.title || `${scenario.hazopNumber} ${scenario.deviation} LOPA`,
      studyType: dto.studyType || 'HAZOP-triggered LOPA',
      source: 'HAZOP/PHA',
      sourceModule: 'HAZOP',
      sourceRecordId: scenarioId,
      hazopScenarioId: scenarioId,
      siteId: dto.siteId || scenario.siteId,
      unitId: dto.unitId || scenario.unitId,
      areaId: dto.areaId || scenario.areaId,
      equipmentTag: dto.equipmentTag || scenario.equipmentTag,
      consequence: this.clean({ description: dto.consequence?.description || scenario.consequence || '', severity: dto.consequence?.severity || scenario.riskLevel, category: dto.consequence?.category || 'Process Safety', impactedReceptor: dto.consequence?.impactedReceptor, tolerableEventFrequency: dto.consequence?.tolerableEventFrequency, riskCriteriaSource: dto.consequence?.riskCriteriaSource }) as any,
      initiatingEvent: this.clean({ description: dto.initiatingEvent?.description || scenario.cause || '', eventCategory: dto.initiatingEvent?.eventCategory || 'HAZOP Cause', frequencyMethod: dto.initiatingEvent?.frequencyMethod, libraryEvent: dto.initiatingEvent?.libraryEvent, frequencyPerYear: dto.initiatingEvent?.frequencyPerYear, frequencySource: dto.initiatingEvent?.frequencySource }) as any,
      importedSafeguards: (dto.importedSafeguards?.length ? dto.importedSafeguards : (scenario.safeguards ?? []).map((s: any) => ({ sourceSafeguardId: s.id, safeguardName: s.name ?? s.safeguard_name ?? s.description ?? 'Imported HAZOP safeguard', safeguardType: s.type ?? s.safeguard_type, description: s.description, proposedLopaUse: 'IPL Candidate', creditedAsIpl: false })))
    };
    return this.create(tenantId, actorId, values, scope, scenario);
  }

  async create(tenantId: string, actorId: string, dto: CreateLopaDto, scope: Scope, sourceSnapshot?: any) {
    if (!dto.siteId) throw new BadRequestException('Site is required');
    this.assertSiteAllowed(dto.siteId, scope);
    if (!dto.title || !dto.studyType || !dto.source || !dto.ownerId) throw new BadRequestException('Study title, type, source, and owner are required');
    const owner = await this.assertValidOwner(tenantId, dto.ownerId, { siteId: dto.siteId, unitId: dto.unitId, areaId: dto.areaId });

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const lopaNumber = await this.nextNumber(tenantId);
    const payload = {
      id,
      tenant_id: tenantId,
      company_id: dto.companyId ?? null,
      site_id: dto.siteId,
      unit_id: dto.unitId ?? null,
      area_id: dto.areaId ?? null,
      lopa_number: lopaNumber,
      title: dto.title,
      description: dto.description ?? null,
      study_type: dto.studyType,
      source: dto.source,
      source_module: dto.sourceModule ?? null,
      source_record_id: dto.sourceRecordId ?? dto.hazopScenarioId ?? null,
      source_hazop_scenario_id: dto.hazopScenarioId ?? null,
      equipment_tag: dto.equipmentTag ?? null,
      equipment_id: dto.equipmentId ?? null,
      owner_id: dto.ownerId,
      facilitator_id: dto.facilitatorId ?? null,
      priority: dto.priority ?? 'Medium',
      status: dto.status ?? 'In Preparation',
      consequence_severity: dto.consequence?.severity ?? null,
      initiating_event_frequency: dto.initiatingEvent?.frequencyPerYear ?? null,
      calculation_status: 'Not Started',
      sil_required: false,
      sil_gap_status: 'Not Evaluated',
      ipl_validation_status: dto.importedSafeguards?.length ? 'Incomplete' : 'Not Started',
      ipl_count: dto.importedSafeguards?.length ?? 0,
      due_date: dto.dueDate ?? null,
      revalidation_due_date: dto.revalidationDueDate ?? null,
      confidentiality_level: dto.confidentialityLevel ?? 'Internal',
      tags: dto.tags ?? [],
      notes: dto.notes ?? null,
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now
    };
    const study = await this.db.single<any>(this.db.from('lopa_studies').insert(payload).select().single());

    if (sourceSnapshot) {
      try {
        const snapshot = await this.insertSourceSnapshot(tenantId, id, actorId, dto.sourceModule ?? 'HAZOP', dto.hazopScenarioId ?? dto.sourceRecordId ?? sourceSnapshot.id, sourceSnapshot);
        if (!snapshot?.id) throw new Error('The source snapshot was not returned by the database.');
        await this.db.single<any>(this.db.from('lopa_studies').update({ source_snapshot_id: snapshot.id }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
      } catch (error) {
        await this.optionalSingle(this.db.from('lopa_studies').delete().eq('tenant_id', tenantId).eq('id', id).select('id').single());
        const detail = error instanceof Error ? error.message : 'Unknown database error';
        throw new ServiceUnavailableException(`Unable to save the HAZOP source snapshot. Apply the LOPA Phase 1/source snapshot migration and retry. ${detail}`);
      }
    }
    await Promise.all([
      this.insertConsequence(tenantId, id, dto.consequence),
      this.insertInitiatingEvent(tenantId, id, dto.initiatingEvent),
      this.insertSafeguards(tenantId, id, dto.importedSafeguards ?? []),
      this.insertTeam(tenantId, id, actorId, payload, dto.teamMembers ?? [], dto.ownerId, dto.facilitatorId, dto.sendInvitations, dto.invitationMessage, dto.invitationDueDate)
    ]);
    await this.writeHistory(tenantId, id, actorId, 'LOPA_CREATED', `${lopaNumber} created`, `LOPA study created from ${dto.source}.`, this.clean({ source: dto.source, sourceRecordId: dto.sourceRecordId ?? dto.hazopScenarioId, ownerId: owner.id, ownerName: owner.displayName, ownerValidation: 'passed' }) as JsonValue);
    await this.writeAudit(tenantId, actorId, 'lopa.create', 'LOPA', id, payload);
    if (dto.hazopScenarioId) await this.markHazopScenarioLinked(tenantId, dto.hazopScenarioId, id, lopaNumber);
    return this.get(tenantId, id, { ...scope, selectedSiteId: payload.site_id });
  }

  private safeguardTypes() {
    return ['SIS / SIF', 'PSV', 'Rupture disc', 'HIPPS', 'BPCS independent function', 'Alarm with operator response', 'Operator manual response', 'Mechanical/electrical interlock', 'ESD function', 'Fire and gas detection/action', 'Deluge/fire protection', 'Passive protection', 'Dike/bund/secondary containment', 'Blast wall/fireproofing', 'Check valve', 'Flame arrestor', 'Ventilation', 'Physical separation', 'Relief system', 'Mechanical protection device', 'Procedure-based IPL', 'Other'];
  }

  private async studySafeguards(tenantId: string, lopaStudyId: string, query: Partial<LopaIplsSafeguardsFilterDto>) {
    let rows = await this.optionalMany('lopa_study_safeguards', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId).is('deleted_at', null).neq('status', 'Archived').order('created_at', { ascending: false }));
    if (query.q) {
      const needle = query.q.toLowerCase();
      rows = rows.filter((row) => [row.safeguard_number, row.safeguard_name, row.safeguard_type, row.description, row.notes].some((value) => String(value ?? '').toLowerCase().includes(needle)));
    }
    if (query.safeguardType) rows = rows.filter((row) => row.safeguard_type === query.safeguardType);
    if (query.sourceType) rows = rows.filter((row) => row.source_type === query.sourceType);
    if (query.proposedUse) rows = rows.filter((row) => row.proposed_use === query.proposedUse);
    if (query.ownerId) rows = rows.filter((row) => row.owner_id === query.ownerId);
    return rows;
  }

  private async studyIplCandidates(tenantId: string, lopaStudyId: string, query: Partial<LopaIplsSafeguardsFilterDto>) {
    let rows = await this.optionalMany('lopa_study_ipl_candidates', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId).neq('status', 'Archived').order('created_at', { ascending: false }));
    if (query.q) {
      const needle = query.q.toLowerCase();
      rows = rows.filter((row) => [row.candidate_number, row.ipl_name, row.ipl_type, row.protection_function, row.notes].some((value) => String(value ?? '').toLowerCase().includes(needle)));
    }
    if (query.safeguardType) rows = rows.filter((row) => row.ipl_type === query.safeguardType);
    if (query.sourceType) rows = rows.filter((row) => row.source_type === query.sourceType);
    if (query.validationStatus) rows = rows.filter((row) => row.validation_status === query.validationStatus);
    if (query.creditStatus) rows = rows.filter((row) => row.credit_status === query.creditStatus);
    if (query.ownerId) rows = rows.filter((row) => row.owner_id === query.ownerId);
    if (query.quick === 'credited') rows = rows.filter((row) => row.credited_in_calculation);
    if (query.quick === 'failed') rows = rows.filter((row) => ['Failed', 'Rejected'].includes(row.validation_status));
    return rows;
  }

  private studyIplCriteria(tenantId: string, lopaStudyId: string, candidateId?: string) {
    return this.optionalMany('lopa_study_ipl_validation_criteria', (q) => {
      let query = q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId).order('created_at');
      if (candidateId) query = query.eq('ipl_candidate_id', candidateId);
      return query;
    });
  }

  private studyIplProofTests(tenantId: string, lopaStudyId: string, candidateId?: string) {
    return this.optionalMany('lopa_study_ipl_proof_test_evidence', (q) => {
      let query = q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId).order('created_at', { ascending: false });
      if (candidateId) query = query.eq('ipl_candidate_id', candidateId);
      return query;
    });
  }

  private buildIplsSafeguardsSummary(safeguards: any[], candidates: any[], gaps: any[]) {
    return {
      totalSafeguards: safeguards.length,
      hazopImported: safeguards.filter((s) => s.source_type === 'HAZOP').length,
      safeguardOnly: safeguards.filter((s) => s.proposed_use === 'Safeguard only').length,
      iplCandidates: candidates.length,
      validationNotStarted: candidates.filter((c) => c.validation_status === 'Not Started').length,
      validationInProgress: candidates.filter((c) => ['In Review', 'Reopened'].includes(c.validation_status)).length,
      validatedIpls: candidates.filter((c) => ['Validation Complete', 'Approved for Credit', 'Credited'].includes(c.validation_status)).length,
      creditedIpls: candidates.filter((c) => c.credited_in_calculation).length,
      failedRejected: candidates.filter((c) => ['Failed', 'Rejected'].includes(c.validation_status) || c.credit_status === 'Rejected').length,
      missingPfdRrf: candidates.filter((c) => !c.pfdavg && !c.rrf).length,
      missingProofTest: candidates.filter((c) => !c.proof_test_basis && c.proof_test_status !== 'Complete').length,
      commonCauseWarnings: candidates.filter((c) => ['Failed', 'Concern', 'Unresolved'].includes(c.common_cause_status)).length,
      doubleCountingWarnings: candidates.filter((c) => ['Failed', 'Concern', 'Unresolved'].includes(c.double_counting_status)).length,
      openGaps: gaps.filter((g) => g.status === 'Open').length,
      needsRecalculation: candidates.some((c) => c.credited_in_calculation && c.updated_at)
    };
  }

  private mapStudyIplCandidate(candidate: any, criteria: any[] = [], proofTests: any[] = []) {
    return {
      ...candidate,
      candidateNumber: candidate.candidate_number,
      iplName: candidate.ipl_name,
      iplType: candidate.ipl_type,
      sourceType: candidate.source_type,
      validationStatus: candidate.validation_status,
      creditStatus: candidate.credit_status,
      creditedInCalculation: candidate.credited_in_calculation,
      pfdRrfBasis: candidate.pfd_rrf_basis,
      sourceReference: candidate.source_reference,
      proofTestBasis: candidate.proof_test_basis,
      evidenceStatus: candidate.evidence_status,
      validationCriteria: criteria,
      proofTests,
      creditBlockers: this.iplCreditBlockers(candidate, criteria, proofTests)
    };
  }

  private studySafeguardPayload(tenantId: string, actorId: string, study: any, lopaStudyId: string, dto: Partial<UpsertLopaStudySafeguardDto> & Record<string, any>, extra: Record<string, any>) {
    return this.clean({
      ...extra,
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id,
      lopa_study_id: lopaStudyId,
      hazop_safeguard_id: dto.sourceSafeguardId ?? dto.hazopSafeguardId,
      registry_ipl_id: dto.registryIplId,
      safeguard_name: dto.safeguardName ?? dto.name,
      safeguard_type: dto.safeguardType ?? dto.type,
      source_type: dto.sourceType ?? 'Manual',
      description: dto.description,
      related_scenario_id: dto.relatedScenarioId,
      related_initiating_event_id: dto.relatedInitiatingEventId,
      related_consequence_id: dto.relatedConsequenceId,
      proposed_use: dto.proposedUse ?? 'Safeguard only',
      owner_id: dto.ownerId,
      evidence_status: dto.evidenceStatus ?? 'Not Provided',
      notes: dto.notes,
      source_snapshot_json: dto.sourceSnapshot ?? {},
      status: dto.status ?? 'Active',
      created_by: extra.created_by ?? actorId,
      updated_by: actorId
    });
  }

  private iplCandidatePayload(tenantId: string, actorId: string, study: any, lopaStudyId: string, dto: Partial<UpsertLopaIplCandidateDto> & Record<string, any>, extra: Record<string, any>) {
    return this.clean({
      ...extra,
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id,
      lopa_study_id: lopaStudyId,
      safeguard_id: dto.safeguardId,
      registry_ipl_id: dto.registryIplId ?? dto.registryId,
      ipl_name: dto.iplName ?? dto.name,
      ipl_type: dto.iplType ?? dto.type,
      source_type: dto.sourceType ?? 'Manual',
      protection_function: dto.protectionFunction,
      preventive_or_mitigative: dto.preventiveOrMitigative ?? dto.proposedUse,
      related_initiating_event_id: dto.relatedInitiatingEventId,
      related_consequence_id: dto.relatedConsequenceId,
      validation_status: dto.validationStatus ?? extra.validation_status ?? 'Not Started',
      credit_status: dto.creditStatus ?? extra.credit_status ?? 'Not Requested',
      credited_in_calculation: dto.creditedInCalculation ?? extra.credited_in_calculation ?? false,
      pfdavg: dto.pfdavg,
      rrf: dto.rrf,
      low_pfdavg: dto.lowPfdavg,
      high_pfdavg: dto.highPfdavg,
      low_rrf: dto.lowRrf,
      high_rrf: dto.highRrf,
      confidence_level: dto.confidenceLevel,
      pfd_rrf_basis: dto.pfdRrfBasis,
      source_reference: dto.sourceReference,
      pfd_rrf_mismatch_justification: dto.pfdRrfMismatchJustification,
      proof_test_basis: dto.proofTestBasis,
      owner_id: dto.ownerId,
      notes: dto.notes,
      created_by: extra.created_by ?? actorId,
      updated_by: actorId
    });
  }

  private defaultStudyIplCriteria() {
    return [
      ['independence', 'Independent from initiating event and other credited IPLs', 'Independence'],
      ['effectiveness', 'Effective for the defined scenario and consequence', 'Effectiveness'],
      ['specificity', 'Specific to this initiating event/consequence pair', 'Specificity'],
      ['auditability', 'Auditable, testable, and documented', 'Auditability'],
      ['reliability', 'Reliability/availability basis documented', 'Reliability'],
      ['proof_test', 'Proof test and maintenance basis documented', 'Proof Test'],
      ['common_cause', 'No unresolved common-cause dependency', 'Independence'],
      ['double_counting', 'Not double counted in this scenario', 'Double Counting'],
      ['not_initiating_event', 'Not the same equipment/function as initiating event', 'Independence'],
      ['not_same_human_response', 'Not same human response as another credited IPL', 'Human Factors'],
      ['source_reference', 'Source/reference and engineering basis documented', 'Basis'],
      ['evidence', 'Required evidence attached or linked', 'Evidence'],
      ['owner', 'Owner assigned for lifecycle management', 'Ownership'],
      ['applicability', 'Applicable to current operating mode and boundary', 'Applicability']
    ];
  }

  private async seedStudyIplCriteria(tenantId: string, actorId: string, lopaStudyId: string, candidateId: string) {
    const existing = await this.studyIplCriteria(tenantId, lopaStudyId, candidateId);
    if (existing.length) return existing;
    const study = await this.optionalSingle(this.db.from('lopa_studies').select('company_id,site_id').eq('tenant_id', tenantId).eq('id', lopaStudyId).single());
    return this.optionalMany('lopa_study_ipl_validation_criteria', (q) => q.insert(this.defaultStudyIplCriteria().map(([key, name, category]) => this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study?.company_id ?? null,
      site_id: study?.site_id ?? null,
      lopa_study_id: lopaStudyId,
      ipl_candidate_id: candidateId,
      criterion_key: key,
      criterion_name: name,
      criterion_category: category,
      required_for_credit: true,
      status: 'Needs Review',
      created_by: actorId,
      updated_by: actorId
    }))).select());
  }

  private iplCreditBlockers(candidate: any, criteria: any[], proofTests: any[]) {
    const blockers: string[] = [];
    if (!['Validation Complete', 'Approved for Credit', 'Credited'].includes(candidate.validation_status)) blockers.push('Validation is incomplete.');
    const failedMandatory = criteria.filter((item) => item.required_for_credit && !['Pass', 'Passed', 'Not Applicable'].includes(item.status));
    if (failedMandatory.length) blockers.push('One or more mandatory IPL validation criteria are not passing.');
    if (!candidate.pfdavg && !candidate.rrf) blockers.push('PFDavg or RRF basis is missing.');
    if (!candidate.source_reference) blockers.push('Source/reference is missing.');
    if (!candidate.proof_test_basis && !proofTests.some((item) => item.proof_test_interval || item.maintenance_basis || item.proof_test_procedure_id)) blockers.push('Proof-test or maintenance basis is missing.');
    if (['Failed', 'Concern', 'Unresolved'].includes(candidate.common_cause_status)) blockers.push('Common-cause concern is unresolved.');
    if (['Failed', 'Concern', 'Unresolved'].includes(candidate.double_counting_status)) blockers.push('Double-counting concern is unresolved.');
    if (candidate.evidence_status === 'Required Missing' || criteria.some((item) => item.required_for_credit && item.criterion_key === 'evidence' && !item.evidence_reference)) blockers.push('Required evidence is missing.');
    return blockers;
  }

  private async updateStudyIplCounts(tenantId: string, lopaStudyId: string) {
    const candidates = await this.studyIplCandidates(tenantId, lopaStudyId, {});
    const credited = candidates.filter((candidate) => candidate.credited_in_calculation).length;
    const validationStatus = candidates.length === 0 ? 'Not Started' : candidates.every((candidate) => ['Validation Complete', 'Approved for Credit', 'Credited'].includes(candidate.validation_status)) ? 'Complete' : candidates.some((candidate) => ['Failed', 'Rejected'].includes(candidate.validation_status)) ? 'Failed' : 'In Progress';
    await this.optionalSingle(this.db.from('lopa_studies').update({ ipl_count: candidates.length, credited_ipl_count: credited, ipl_validation_status: validationStatus, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', lopaStudyId).select('id').single());
  }

  private async nextStudySafeguardNumber(tenantId: string, lopaStudyId: string, offset = 0) {
    const rows = await this.optionalMany('lopa_study_safeguards', (q) => q.select('safeguard_number').eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId));
    return `SG-${String(rows.length + offset + 1).padStart(3, '0')}`;
  }

  private async nextIplCandidateNumber(tenantId: string, lopaStudyId: string) {
    const rows = await this.optionalMany('lopa_study_ipl_candidates', (q) => q.select('candidate_number').eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId));
    return `IPL-C-${String(rows.length + 1).padStart(3, '0')}`;
  }

  private groupBy(rows: any[], key: string) {
    const groups = new Map<string, any[]>();
    for (const row of rows) {
      const value = row[key];
      if (!value) continue;
      groups.set(value, [...(groups.get(value) ?? []), row]);
    }
    return groups;
  }

  private latestRiskCalculation(tenantId: string, lopaStudyId: string) {
    return this.optionalSingle(this.db.from('lopa_risk_calculations').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId).order('calculation_version', { ascending: false }).limit(1).single());
  }

  private riskCalculationMethodology(study: any) {
    return {
      methodologyName: study?.calculation_methodology_name ?? 'Company Standard LOPA Frequency Method',
      methodologyVersion: study?.calculation_methodology_version ?? '1.0',
      formula: 'Mitigated Event Frequency = Initiating Event Frequency x Product(Conditional Modifiers) x Product(Credited IPL PFDavg)',
      roundingRule: 'Scientific notation, 3 significant figures',
      uncertaintyPolicy: 'Low/high estimates are preview-only until methodology defines uncertainty treatment.',
      riskGapPolicy: 'Risk gap factor = mitigated event frequency / tolerable frequency.',
      silTriggerPolicy: 'SIL evaluation is required when risk gap remains after credited IPLs.'
    };
  }

  private riskCalculationSummaryFrom(calculation: any, inputs: any, readiness: any) {
    const result = calculation ?? {};
    const engine = calculation ? null : this.tryRiskCalculationPreview(inputs);
    return {
      calculationStatus: result.calculation_status ?? (readiness.blockers?.length ? 'Blocked' : 'Ready for Calculation'),
      resultStatus: result.result_status ?? 'Not Calculated',
      ieFrequency: result.ie_frequency ?? engine?.ieFrequency ?? this.toNumber(inputs.initiatingEvent?.frequency_per_year ?? inputs.study?.initiating_event_frequency),
      combinedModifierFactor: result.combined_modifier_factor ?? engine?.combinedModifierFactor ?? null,
      frequencyAfterModifiers: result.frequency_after_modifiers ?? engine?.frequencyAfterModifiers ?? null,
      creditedIplCount: inputs.creditedIpls?.length ?? 0,
      combinedIplPfdavg: result.combined_ipl_pfdavg ?? engine?.combinedIplPfdavg ?? null,
      combinedIplRrf: result.combined_ipl_rrf ?? engine?.combinedIplRrf ?? null,
      mitigatedEventFrequency: result.mitigated_event_frequency ?? engine?.mitigatedEventFrequency ?? null,
      tolerableFrequency: result.tolerable_frequency ?? inputs.tolerableFrequency ?? null,
      riskGapFactor: result.risk_gap_factor ?? engine?.riskGapFactor ?? null,
      requiredAdditionalRrf: result.required_additional_rrf ?? engine?.requiredAdditionalRrf ?? null,
      meetsRiskCriteria: result.meets_risk_criteria ?? engine?.meetsRiskCriteria ?? false,
      additionalIplRequired: result.additional_ipl_required ?? engine?.additionalIplRequired ?? false,
      sifSilEvaluationRequired: result.sif_sil_evaluation_required ?? engine?.sifSilEvaluationRequired ?? false,
      calculationVersion: result.calculation_version ?? null,
      lastCalculatedAt: result.calculated_at ?? null,
      locked: !!result.locked
    };
  }

  private tryRiskCalculationPreview(inputs: any) {
    try {
      if (!this.toNumber(inputs.initiatingEvent?.frequency_per_year ?? inputs.study?.initiating_event_frequency) || !this.toNumber(inputs.tolerableFrequency)) return null;
      return this.runRiskCalculationEngine(inputs);
    } catch {
      return null;
    }
  }

  private runRiskCalculationEngine(inputs: any) {
    const ieFrequency = this.toNumber(inputs.initiatingEvent?.frequency_per_year ?? inputs.study?.initiating_event_frequency);
    const tolerableFrequency = this.toNumber(inputs.tolerableFrequency);
    if (ieFrequency <= 0) throw new BadRequestException('Initiating event frequency must be greater than zero.');
    if (tolerableFrequency <= 0) throw new BadRequestException('Tolerable frequency must be greater than zero.');
    const modifiers = inputs.conditionalModifiers ?? [];
    const includedModifiers = modifiers.filter((modifier: any) => modifier.included !== false && modifier.status !== 'Archived');
    const modifierValues = includedModifiers.map((modifier: any) => this.toNumber(modifier.selected_value ?? modifier.default_value ?? 1)).filter((value: number) => value > 0);
    if (modifierValues.length !== includedModifiers.length) throw new BadRequestException('One or more conditional modifiers are missing valid values.');
    const combinedModifierFactor = modifierValues.reduce((product: number, value: number) => product * value, 1);
    const frequencyAfterModifiers = ieFrequency * combinedModifierFactor;
    const credited = inputs.creditedIpls ?? [];
    for (const ipl of credited) {
      const blockers = this.riskCalculationIplBlockers(ipl);
      if (blockers.length) throw new BadRequestException({ message: 'Credited IPL has invalid calculation inputs.', blockers });
    }
    const pfdValues = credited.map((ipl: any) => this.toNumber(ipl.pfdavg ?? (ipl.rrf ? 1 / this.toNumber(ipl.rrf) : null))).filter((value: number) => value > 0);
    const combinedIplPfdavg = pfdValues.length ? pfdValues.reduce((product: number, value: number) => product * value, 1) : 1;
    const combinedIplRrf = combinedIplPfdavg > 0 ? 1 / combinedIplPfdavg : null;
    const mitigatedEventFrequency = frequencyAfterModifiers * combinedIplPfdavg;
    const riskGapFactor = tolerableFrequency > 0 ? mitigatedEventFrequency / tolerableFrequency : null;
    const meetsRiskCriteria = mitigatedEventFrequency <= tolerableFrequency;
    const requiredAdditionalRrf = meetsRiskCriteria ? 1 : riskGapFactor;
    return {
      ieFrequency,
      combinedModifierFactor,
      frequencyAfterModifiers,
      combinedIplPfdavg,
      combinedIplRrf,
      mitigatedEventFrequency,
      tolerableFrequency,
      riskGapFactor,
      requiredAdditionalRrf,
      meetsRiskCriteria,
      additionalIplRequired: !meetsRiskCriteria,
      sifSilEvaluationRequired: !meetsRiskCriteria,
      lowMitigatedFrequency: null,
      highMitigatedFrequency: null,
      confidenceLevelSummary: credited.some((ipl: any) => ipl.confidence_level) ? 'Credited IPL confidence values available in snapshot.' : 'No uncertainty model configured.'
    };
  }

  private riskCalculationInputRows(tenantId: string, study: any, lopaStudyId: string, calculationId: string, inputs: any) {
    const base = { tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: lopaStudyId, risk_calculation_id: calculationId };
    const rows: any[] = [];
    if (inputs.consequence) rows.push(this.clean({ id: crypto.randomUUID(), ...base, input_type: 'Scenario / Consequence', source_record_id: inputs.consequence.id, source_record_type: 'lopa_consequences', input_name: inputs.consequence.description ?? 'Consequence', input_value: inputs.tolerableFrequency, input_unit: 'per year', included: true, source_reference: inputs.consequence.risk_criteria_source, snapshot_json: inputs.consequence }));
    if (inputs.initiatingEvent) rows.push(this.clean({ id: crypto.randomUUID(), ...base, input_type: 'Initiating Event', source_record_id: inputs.initiatingEvent.id, source_record_type: 'lopa_initiating_events', input_name: inputs.initiatingEvent.description ?? 'Initiating event', input_value: this.toNumber(inputs.initiatingEvent.frequency_per_year ?? study.initiating_event_frequency), input_unit: inputs.initiatingEvent.frequency_unit ?? 'per year', low_value: inputs.initiatingEvent.low_estimate, high_value: inputs.initiatingEvent.high_estimate, included: true, source_reference: inputs.initiatingEvent.frequency_source, snapshot_json: inputs.initiatingEvent }));
    for (const modifier of inputs.conditionalModifiers ?? []) rows.push(this.clean({ id: crypto.randomUUID(), ...base, input_type: 'Conditional Modifier', source_record_id: modifier.id, source_record_type: 'lopa_study_conditional_modifier_snapshots', input_name: modifier.modifier_name ?? modifier.modifier_code ?? 'Modifier', input_value: this.toNumber(modifier.selected_value ?? modifier.default_value ?? 1), input_unit: modifier.unit, low_value: modifier.low_value, high_value: modifier.high_value, included: modifier.included !== false, source_reference: modifier.source_reference, snapshot_json: modifier }));
    for (const ipl of inputs.creditedIpls ?? []) rows.push(this.clean({ id: crypto.randomUUID(), ...base, input_type: 'Credited IPL', source_record_id: ipl.id, source_record_type: 'lopa_study_ipl_candidates', input_name: ipl.ipl_name, input_value: this.toNumber(ipl.pfdavg ?? (ipl.rrf ? 1 / this.toNumber(ipl.rrf) : null)), input_unit: 'PFDavg', low_value: ipl.low_pfdavg, high_value: ipl.high_pfdavg, included: true, source_reference: ipl.source_reference, snapshot_json: ipl }));
    for (const item of [...(inputs.excludedIpls ?? []), ...(inputs.safeguards ?? [])]) rows.push(this.clean({ id: crypto.randomUUID(), ...base, input_type: 'Excluded Safeguard / IPL', source_record_id: item.id, source_record_type: item.ipl_name ? 'lopa_study_ipl_candidates' : 'lopa_study_safeguards', input_name: item.ipl_name ?? item.safeguard_name, included: false, exclusion_reason: item.credit_status ?? item.proposed_use ?? 'Not credited', snapshot_json: item }));
    return rows;
  }

  private riskCalculationIplBlockers(ipl: any) {
    const blockers: string[] = [];
    if (!ipl.credited_in_calculation) blockers.push(`${ipl.ipl_name} is not credited.`);
    if (!['Credited', 'Approved for Credit', 'Validation Complete'].includes(ipl.validation_status)) blockers.push(`${ipl.ipl_name} validation is incomplete.`);
    if (!this.toNumber(ipl.pfdavg) && !this.toNumber(ipl.rrf)) blockers.push(`${ipl.ipl_name} is missing PFDavg/RRF.`);
    if (!ipl.source_reference) blockers.push(`${ipl.ipl_name} is missing source/reference.`);
    if (['Failed', 'Concern', 'Unresolved'].includes(ipl.common_cause_status)) blockers.push(`${ipl.ipl_name} has unresolved common-cause concern.`);
    if (['Failed', 'Concern', 'Unresolved'].includes(ipl.double_counting_status)) blockers.push(`${ipl.ipl_name} has unresolved double-counting concern.`);
    return blockers;
  }

  private riskCalculationHash(value: any) {
    const normalized = JSON.stringify(value, (_key, val) => (val instanceof Date ? val.toISOString() : val));
    let hash = 0;
    for (let index = 0; index < normalized.length; index += 1) hash = ((hash << 5) - hash + normalized.charCodeAt(index)) | 0;
    return `rch_${Math.abs(hash)}`;
  }

  private async silMethodology(tenantId: string, study: any) {
    const rows = await this.optionalMany('lopa_sil_methodologies', (q) => q.select('*')
      .eq('tenant_id', tenantId)
      .eq('company_id', study.company_id)
      .eq('status', 'Approved')
      .eq('active', true)
      .order('approved_at', { ascending: false }));
    return rows.find((row: any) => row.site_id === study.site_id)
      ?? rows.find((row: any) => !row.site_id)
      ?? null;
  }

  private resolveConfiguredSilTarget(methodology: any, requiredRrf: number) {
    const rules = Array.isArray(methodology?.mapping_rules_json) ? methodology.mapping_rules_json : [];
    const match = rules.find((rule: any) => {
      const minimum = this.toNumber(rule.minRrf ?? rule.min_rrf ?? rule.minimumRrf ?? rule.minimum_rrf) ?? 0;
      const maximum = this.toNumber(rule.maxRrf ?? rule.max_rrf ?? rule.maximumRrf ?? rule.maximum_rrf);
      return requiredRrf >= minimum && (maximum === null || requiredRrf <= maximum);
    });
    if (!match) throw new BadRequestException('The approved SIL methodology has no mapping rule for the required RRF. Update the company/site methodology before determining SIL.');
    const targetSil = match.targetSil ?? match.target_sil ?? match.sil;
    if (!targetSil) throw new BadRequestException('The matched SIL methodology rule is missing a target SIL.');
    return {
      targetSil,
      requiredSilBand: match.label ?? match.band ?? targetSil,
      specialistReviewRequired: Boolean(match.specialistReviewRequired ?? match.specialist_review_required ?? methodology.specialist_required_for_high_sil)
    };
  }

  private silDependencyHash(calculation: any, riskInputs: any, sifs: any[], components: any[], links: any[]) {
    return this.stableHash({
      calculation: calculation ? { id: calculation.id, version: calculation.version_number, inputHash: calculation.input_hash, status: calculation.status, mitigated: calculation.mitigated_event_frequency, tolerable: calculation.tolerable_frequency, requiredRrf: calculation.required_additional_rrf } : null,
      consequence: riskInputs?.consequence ? { id: riskInputs.consequence.id, updatedAt: riskInputs.consequence.updated_at, tolerable: riskInputs.tolerableFrequency } : null,
      initiatingEvent: riskInputs?.initiatingEvent ? { id: riskInputs.initiatingEvent.id, updatedAt: riskInputs.initiatingEvent.updated_at, frequency: riskInputs.initiatingEvent.frequency_per_year } : null,
      creditedIpls: (riskInputs?.creditedIpls ?? calculation?.creditedIpls ?? []).map((row: any) => ({ id: row.id, pfdavg: row.pfdavg, rrf: row.rrf, status: row.credit_status ?? row.validation_status, updatedAt: row.updated_at })),
      sifs: sifs.map((row: any) => ({ id: row.id, status: row.status, complete: row.complete, updatedAt: row.updated_at })),
      components: components.map((row: any) => ({ id: row.id, type: row.component_type, status: row.status, updatedAt: row.updated_at })),
      links: links.map((row: any) => ({ id: row.id, type: row.linked_record_type ?? row.record_type, status: row.status_snapshot ?? row.status, revision: row.revision_snapshot, updatedAt: row.updated_at }))
    });
  }

  private sifSpecificationDtoBlockers(dto: UpsertLopaSifDto, determination: any) {
    const blockers: string[] = [];
    if (!dto.sifTag) blockers.push('SIF tag is required.');
    if (!dto.title) blockers.push('SIF title is required.');
    if (!dto.safetyFunction) blockers.push('Safety function is required.');
    if (!dto.safeState) blockers.push('Safe state is required.');
    if (!dto.requiredAction && !dto.processAction) blockers.push('Required process action is required.');
    if (!dto.targetSil && determination?.sil_required) blockers.push('Target SIL is required.');
    if (!dto.responseTimeRequired && !dto.responseTime) blockers.push('Required response time is required.');
    if (!dto.ownerId && !dto.designOwnerId) blockers.push('SIF owner/design owner is required.');
    if (dto.proofTestRequired !== false && !dto.proofTestBasis) blockers.push('Proof-test basis is required.');
    return blockers;
  }

  private async indexSilRecord(tenantId: string, study: any, determination: any, sif: any) {
    await this.searchIndex.indexRecord(tenantId, {
      module: 'lopa', recordType: 'SIF Specification', recordId: sif.id,
      recordNumber: sif.sif_number ?? sif.sif_tag,
      title: sif.title,
      subtitle: `${study.lopa_number ?? study.study_number ?? 'LOPA'} / ${sif.target_sil ?? determination?.target_sil ?? 'SIL pending'}`,
      description: sif.safety_function ?? sif.description,
      status: sif.status,
      siteId: study.site_id,
      url: `/lopa/${study.id}?tab=sil`,
      metadata: { lopaStudyId: study.id, silDeterminationId: determination?.id, complete: sif.complete }
    }).catch(() => null);
  }

  private async assertSif(tenantId: string, studyId: string, sifId: string) {
    const row = await this.optionalSingle(this.db.from('lopa_sif_specifications').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', studyId).eq('id', sifId).is('deleted_at', null).single());
    if (!row) throw new NotFoundException('SIF specification not found.');
    return row;
  }

  private determinationFor(tenantId: string, studyId: string) {
    return this.optionalSingle(this.db.from('lopa_sil_determinations').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', studyId).single());
  }

  private iecGapBaseline() {
    const titles = [
      'SIF safety function defined', 'Hazard and consequence traceability complete', 'Target SIL and risk-reduction basis approved',
      'Sensors identified and suitable', 'Logic solver identified and suitable', 'Final elements identified and suitable',
      'Architecture and voting defined', 'Independence from BPCS demonstrated', 'Independence from initiating event demonstrated',
      'Common-cause failures assessed', 'Systematic capability addressed', 'Hardware fault tolerance addressed',
      'Safe state and trip action defined', 'Trip setpoint and basis documented', 'Response time requirement documented',
      'Reset and restart philosophy documented', 'Bypass and override management defined', 'Proof-test interval and procedure defined',
      'Maintenance and competency requirements defined', 'SRS document linked', 'SIL verification required/completed as applicable',
      'MOC/PSSR/MI dependencies linked', 'Open functional-safety actions resolved'
    ];
    return titles.map((gapTitle, index) => ({ gap_key: `IEC61511_${String(index + 1).padStart(2, '0')}`, gap_title: gapTitle, gap_description: gapTitle, required: true, blocking: true, sort_order: index + 1 }));
  }

  private async resolveSilLinkedRecord(tenantId: string, study: any, dto: UpsertLopaSilLinkDto) {
    const type = dto.linkedRecordType.toUpperCase();
    let row: any = null;
    if (type === 'EQUIPMENT') row = await this.optionalSingle(this.db.from('Equipment').select('id,tag,name,type,status,siteId,updatedAt').eq('tenantId', tenantId).eq('id', dto.linkedRecordId).single());
    else if (['DOCUMENT', 'SRS', 'PROOF TEST PROCEDURE'].includes(type)) row = await this.optionalSingle(this.db.from('documents').select('id,document_number,title,document_type,status,revision,site_id,updated_at').eq('tenant_id', tenantId).eq('id', dto.linkedRecordId).single());
    else if (type === 'MOC') row = await this.optionalSingle(this.db.from('moc_requests').select('*').eq('tenant_id', tenantId).eq('id', dto.linkedRecordId).single());
    else if (type === 'PSSR') row = await this.optionalSingle(this.db.from('pssr_requests').select('*').eq('tenant_id', tenantId).eq('id', dto.linkedRecordId).single());
    if (row && (row.site_id ?? row.siteId) && (row.site_id ?? row.siteId) !== study.site_id) throw new ForbiddenException('The selected record is outside this LOPA study site.');
    return {
      linkedRecordNumber: dto.linkedRecordNumber ?? row?.tag ?? row?.document_number ?? row?.number ?? row?.moc_number ?? row?.pssr_number ?? dto.linkedRecordId,
      linkedRecordTitle: dto.linkedRecordTitle ?? row?.name ?? row?.title ?? 'Restricted or externally managed record',
      statusSnapshot: row?.status ?? 'Linked',
      revisionSnapshot: row?.revision ?? row?.version ?? null,
      restricted: !row,
      snapshotJson: row ?? { id: dto.linkedRecordId, restricted: true }
    };
  }

  private silSnapshotPayload(study: any, determination: any, calculation: any, sifs: any[], components: any[], architectures: any[], proofTests: any[], gaps: any[], links: any[], actions: any[]) {
    return { study: { id: study.id, number: study.lopa_number ?? study.study_number, title: study.title, status: study.status, siteId: study.site_id }, determination, calculation, sifs, components, architectures, proofTests, gaps, links, actions };
  }

  private objectDiff(previous: any, current: any, path = ''): Array<{ path: string; before: any; after: any }> {
    const keys = new Set([...Object.keys(previous ?? {}), ...Object.keys(current ?? {})]);
    const result: Array<{ path: string; before: any; after: any }> = [];
    for (const key of keys) {
      const before = previous?.[key]; const after = current?.[key]; const nextPath = path ? `${path}.${key}` : key;
      if (before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)) result.push(...this.objectDiff(before, after, nextPath));
      else if (JSON.stringify(before) !== JSON.stringify(after)) result.push({ path: nextPath, before, after });
    }
    return result;
  }

  private stableHash(value: any) {
    const normalize = (input: any): any => Array.isArray(input)
      ? input.map(normalize)
      : input && typeof input === 'object'
        ? Object.keys(input).sort().reduce((out, key) => ({ ...out, [key]: normalize(input[key]) }), {})
        : input;
    const serialized = JSON.stringify(normalize(value));
    let first = 2166136261; let second = 16777619;
    for (let index = 0; index < serialized.length; index += 1) { first = Math.imul(first ^ serialized.charCodeAt(index), 16777619); second = Math.imul(second ^ serialized.charCodeAt(index), 2246822519); }
    return `sil_${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`;
  }

  private applyRiskCalculationGapFilters(gaps: any[], query: LopaRiskCalculationFilterDto) {
    let rows = gaps;
    if (query.q) {
      const needle = query.q.toLowerCase();
      rows = rows.filter((gap) => [gap.gap_title, gap.gap_type, gap.gap_description, gap.status].some((value) => String(value ?? '').toLowerCase().includes(needle)));
    }
    if (query.status) rows = rows.filter((gap) => gap.status === query.status);
    if (query.quick === 'blockers') rows = rows.filter((gap) => gap.closure_blocker);
    return rows;
  }

  private async recordRiskCalculationGaps(tenantId: string, actorId: string, study: any, lopaStudyId: string, blockers: any[], calculationId: string | null) {
    if (!blockers.length) return [];
    return this.optionalMany('lopa_risk_calculation_gaps', (q) => q.insert(blockers.map((blocker) => this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id,
      lopa_study_id: lopaStudyId,
      risk_calculation_id: calculationId,
      gap_type: blocker.key ?? 'Calculation Blocker',
      gap_title: blocker.title ?? blocker.key ?? 'Calculation blocker',
      gap_description: blocker.description ?? blocker.title,
      severity: blocker.severity === 'Hard' ? 'High' : blocker.severity ?? 'Medium',
      closure_blocker: blocker.severity !== 'Warning',
      status: 'Open',
      created_by: actorId
    }))).select());
  }

  private riskCalculationAssumptionPayload(tenantId: string, actorId: string, study: any, lopaStudyId: string, dto: UpsertLopaRiskCalculationAssumptionDto, extra: Record<string, any>) {
    return this.clean({
      ...extra,
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id,
      lopa_study_id: lopaStudyId,
      assumption_type: dto.assumptionType,
      assumption_title: dto.assumptionTitle,
      description: dto.description,
      source_reference: dto.sourceReference,
      related_input_type: dto.relatedInputType,
      related_input_id: dto.relatedInputId,
      impact: dto.impact,
      updated_by: actorId
    });
  }

  private riskCalculationGapPayload(tenantId: string, actorId: string, study: any, lopaStudyId: string, calculationId: string | null, dto: UpsertLopaRiskCalculationGapDto) {
    return this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id,
      lopa_study_id: lopaStudyId,
      risk_calculation_id: calculationId,
      gap_type: dto.gapType,
      gap_title: dto.gapTitle,
      gap_description: dto.gapDescription,
      severity: dto.severity ?? 'Medium',
      closure_blocker: dto.closureBlocker ?? true,
      status: dto.status ?? 'Open',
      created_by: actorId
    });
  }

  private toNumber(value: any) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  private recommendationsSummaryFrom(recommendations: any[], actions: any[]) {
    const openStatuses = ['Draft', 'Open', 'Accepted', 'In Progress', 'Deferred'];
    const actionOpen = actions.filter((action) => !this.isActionClosed(action));
    const overdue = actions.filter((action) => this.isOverdue(action.dueDate ?? action.due_date));
    return {
      totalRecommendations: recommendations.length,
      openRecommendations: recommendations.filter((r) => openStatuses.includes(r.status)).length,
      closedRecommendations: recommendations.filter((r) => ['Closed', 'Completed', 'Verified'].includes(r.status)).length,
      draftRecommendations: recommendations.filter((r) => r.status === 'Draft').length,
      acceptedRecommendations: recommendations.filter((r) => r.status === 'Accepted').length,
      rejectedRecommendations: recommendations.filter((r) => r.status === 'Rejected').length,
      deferredRecommendations: recommendations.filter((r) => r.status === 'Deferred').length,
      totalLinkedActions: actions.length,
      openActions: actionOpen.length,
      inProgressActions: actions.filter((a) => ['IN_PROGRESS', 'In Progress'].includes(a.status)).length,
      completedActions: actions.filter((a) => ['COMPLETED', 'Completed'].includes(a.status)).length,
      verifiedActions: actions.filter((a) => ['VERIFIED', 'Verified'].includes(a.status)).length,
      overdueActions: overdue.length,
      highPriorityActions: actions.filter((a) => ['HIGH', 'High'].includes(a.priority)).length,
      criticalPriorityActions: actions.filter((a) => ['SAFETY_CRITICAL', 'Critical'].includes(a.priority)).length,
      blockingActions: actions.filter((a) => a.links?.some((link: any) => link.blocking)).length,
      awaitingVerification: actions.filter((a) => !!a.verificationRequired && !a.verifiedAt).length,
      fromRiskGap: recommendations.filter((r) => r.risk_relevance === 'Risk gap').length,
      fromIplGap: recommendations.filter((r) => r.risk_relevance === 'IPL gap').length,
      fromCalculationGap: recommendations.filter((r) => r.risk_relevance === 'Calculation blocker').length,
      fromSilRequirement: recommendations.filter((r) => r.risk_relevance === 'SIL required').length,
      fromMissingEvidence: recommendations.filter((r) => r.risk_relevance === 'Evidence gap').length,
      readyForReview: actionOpen.filter((a) => a.links?.some((link: any) => link.blocking)).length === 0
    };
  }

  private applyRecommendationFilters(rows: any[], query: LopaRecommendationFilterDto) {
    let filtered = rows;
    if (query.q) {
      const needle = query.q.toLowerCase();
      filtered = filtered.filter((row) => [row.recommendation_number, row.title, row.description, row.source_type, row.source_tab, row.risk_relevance, row.owner_id].some((value) => String(value ?? '').toLowerCase().includes(needle)));
    }
    if (query.status) filtered = filtered.filter((row) => row.status === query.status);
    if (query.priority) filtered = filtered.filter((row) => row.priority === query.priority);
    if (query.sourceTab) filtered = filtered.filter((row) => row.source_tab === query.sourceTab);
    if (query.riskRelevance) filtered = filtered.filter((row) => row.risk_relevance === query.riskRelevance);
    if (query.blocking !== undefined) filtered = filtered.filter((row) => row.blocking === this.truthy(query.blocking));
    if (query.overdue !== undefined && this.truthy(query.overdue)) filtered = filtered.filter((row) => this.isOverdue(row.due_date));
    if (query.quick === 'blockers') filtered = filtered.filter((row) => row.blocking);
    return filtered;
  }

  async recommendationsReadiness(tenantId: string, id: string, scope: Scope) {
    const list = await this.recommendationsList(tenantId, id, {}, scope);
    const actions = await this.lopaActions(tenantId, id, scope);
    const blockingRecommendations = list.rows.filter((row: any) => row.blocking);
    const blockingActions = actions.filter((action: any) => action.links?.some((link: any) => link.blocking));
    const checks = [
      this.check('critical_assigned', 'All critical recommendations assigned', list.rows.filter((r: any) => r.priority === 'Critical').every((r: any) => !!r.owner_id), 'Blocked'),
      this.check('blocking_have_actions', 'All blocking recommendations have actions', blockingRecommendations.every((r: any) => r.linkedActionsCount > 0), 'Blocked'),
      this.check('blocking_actions_have_owners', 'All blocking actions have owners', blockingActions.every((a: any) => !!a.assignedToId), 'Blocked'),
      this.check('blocking_actions_have_due_dates', 'All blocking actions have due dates', blockingActions.every((a: any) => !!a.dueDate), 'Blocked'),
      this.check('no_overdue_critical', 'No overdue critical blocking actions', !blockingActions.some((a: any) => ['HIGH', 'SAFETY_CRITICAL'].includes(a.priority) && this.isOverdue(a.dueDate)), 'Blocked'),
      this.check('closure_evidence', 'Closure evidence complete where required', list.rows.filter((r: any) => r.required_before_closure).every((r: any) => ['Verified', 'Complete', 'Linked'].includes(r.closure_evidence_status)), 'Warning'),
      this.check('verification_complete', 'Verification complete where required', list.rows.filter((r: any) => r.verification_required).every((r: any) => !!r.verified_at), 'Warning'),
      this.check('ready_review', 'Ready for Review & Sign-Off', blockingActions.every((a: any) => this.isActionClosed(a)) && blockingRecommendations.every((r: any) => ['Closed', 'Completed', 'Verified'].includes(r.status)), 'Blocked')
    ];
    return this.readinessFromChecks(checks);
  }

  private sourceFinding(id: string, findingType: string, sourceTab: string, sourceRecord: string | null, severity: string, description: string, blocking: boolean, suggestedNextStep: string) {
    return { id, findingType, sourceTab, sourceRecord, severity, description, blocking, existingRecommendationLinked: false, existingActionLinked: false, suggestedNextStep };
  }

  private validateRecommendation(dto: UpsertLopaRecommendationDto) {
    if (!dto.title?.trim()) throw new BadRequestException('Recommendation title is required.');
    if (!dto.description?.trim()) throw new BadRequestException('Recommendation description is required.');
    if (!dto.sourceType?.trim()) throw new BadRequestException('Recommendation source type is required.');
    if (!dto.priority?.trim()) throw new BadRequestException('Recommendation priority is required.');
    if (['Open', 'Accepted', 'In Progress'].includes(dto.status ?? 'Open') && !dto.ownerId) throw new BadRequestException('Owner is required for open or accepted recommendations.');
    if (dto.blocking && !dto.dueDate) throw new BadRequestException('Blocking recommendation requires a due date.');
  }

  private recommendationPayload(tenantId: string, actorId: string, study: any, lopaStudyId: string, dto: UpsertLopaRecommendationDto, extra: Record<string, any>) {
    return this.clean({
      ...extra,
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id,
      lopa_study_id: lopaStudyId,
      title: dto.title,
      description: dto.description,
      source_type: dto.sourceType,
      source_tab: dto.sourceTab,
      source_record_id: dto.sourceRecordId,
      source_snapshot_json: dto.sourceSnapshot ?? {},
      recommendation_type: dto.recommendationType,
      priority: dto.priority,
      risk_relevance: dto.riskRelevance,
      blocking: dto.blocking ?? false,
      owner_id: dto.ownerId,
      responsible_discipline: dto.responsibleDiscipline,
      due_date: dto.dueDate,
      required_before_review: dto.requiredBeforeReview ?? false,
      required_before_startup: dto.requiredBeforeStartup ?? false,
      required_before_closure: dto.requiredBeforeClosure ?? false,
      status: dto.status ?? 'Open',
      verification_required: dto.verificationRequired ?? false,
      updated_by: actorId
    });
  }

  private async nextRecommendationNumber(tenantId: string, lopaStudyId: string) {
    const rows = await this.optionalMany('lopa_recommendations', (q) => q.select('recommendation_number').eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId));
    return `REC-${String(rows.length + 1).padStart(3, '0')}`;
  }

  private async recommendationActionLinks(tenantId: string, id: string) {
    return this.optionalMany('lopa_recommendation_action_links', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id));
  }

  private async actionRowsByIds(tenantId: string, ids: string[]) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    return uniqueIds.length ? this.optionalMany('Action', (q) => q.select('*, owner:User!Action_assignedToId_fkey(id,displayName,email,title)').eq('tenantId', tenantId).in('id', uniqueIds)) : [];
  }

  private async createUniversalAction(tenantId: string, actorId: string, study: any, lopaStudyId: string, dto: CreateLopaActionDto) {
    const action = await this.db.single<any>(this.db.from('Action').insert(this.clean({
      id: crypto.randomUUID(),
      tenantId,
      actionNumber: await this.nextActionNumber(tenantId),
      moduleKey: 'LOPA',
      sourceType: dto.recommendationId ? 'LOPA Recommendation' : dto.gapId ? 'LOPA Gap' : 'LOPA',
      sourceId: lopaStudyId,
      title: dto.title,
      description: dto.description,
      priority: this.actionPriority(dto.priority),
      status: 'OPEN',
      assignedToId: dto.ownerId,
      createdById: actorId,
      equipmentId: dto.equipmentId,
      siteId: study.site_id,
      departmentId: dto.departmentId,
      assignedDate: new Date().toISOString(),
      dueDate: dto.dueDate,
      evidenceRequired: dto.evidenceRequired ?? false,
      verificationRequired: dto.verificationRequired ?? false,
      updatedAt: new Date().toISOString()
    })).select().single());
    await this.writeAudit(tenantId, actorId, 'lopa.action.create', 'LOPA', lopaStudyId, action as JsonValue);
    return action;
  }

  private async nextActionNumber(tenantId: string) {
    const today = new Date().getFullYear();
    const rows = await this.optionalMany('Action', (q) => q.select('actionNumber').eq('tenantId', tenantId).ilike('actionNumber', `ACT-${today}-%`));
    return `ACT-${today}-${String(rows.length + 1).padStart(4, '0')}`;
  }

  private actionPriority(priority: string) {
    const value = String(priority ?? '').toLowerCase();
    if (value === 'critical' || value === 'safety_critical') return 'SAFETY_CRITICAL';
    if (value === 'high') return 'HIGH';
    if (value === 'low') return 'LOW';
    return 'MEDIUM';
  }

  private isActionClosed(action: any) {
    return ['COMPLETED', 'VERIFIED', 'CLOSED', 'Completed', 'Verified', 'Closed', 'CANCELLED', 'Cancelled'].includes(action?.status);
  }

  private isOverdue(date?: string | null) {
    return !!date && date.slice(0, 10) < new Date().toISOString().slice(0, 10);
  }

  private async updateRecommendationStudyStatus(tenantId: string, id: string) {
    const recs = await this.optionalMany('lopa_recommendations', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('deleted_at', null));
    const actions = await this.lopaActions(tenantId, id, { corporateView: true });
    const openRecs = recs.filter((r) => !['Closed', 'Completed', 'Verified', 'Rejected', 'Cancelled'].includes(r.status));
    const openActions = actions.filter((a) => !this.isActionClosed(a));
    await this.optionalSingle(this.db.from('lopa_studies').update({
      recommendation_status: openRecs.length ? 'Open' : recs.length ? 'Complete' : 'Not Started',
      action_status: openActions.length ? 'Open' : actions.length ? 'Complete' : 'Not Started',
      open_recommendations_count: openRecs.length,
      open_actions_count: openActions.length,
      review_readiness_status: openRecs.some((r) => r.blocking) || openActions.some((a) => a.links?.some((link: any) => link.blocking)) ? 'Blocked' : 'Ready',
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
  }

  private linkedRecordsSummaryFrom(rows: any[], required: any) {
    const byModule = (module: string) => rows.filter((row) => row.source_module === module || row.record_type === module).length;
    return {
      totalLinkedRecords: rows.length,
      hazopLinks: byModule('HAZOP'),
      mocLinks: byModule('MOC'),
      pssrLinks: byModule('PSSR'),
      incidentLinks: byModule('Incident'),
      auditLinks: byModule('Audit'),
      equipmentLinks: byModule('Equipment'),
      documentLinks: byModule('Documents') + byModule('Document'),
      iplRegistryLinks: byModule('IPL Registry'),
      sifSisLinks: byModule('SIS/SIF'),
      proofTestMiLinks: byModule('Mechanical Integrity') + byModule('Proof test record'),
      recommendationActionLinks: byModule('Recommendations') + byModule('Actions'),
      requiredLinksMissing: required.blockers?.length ?? 0,
      sourceChangedWarnings: rows.filter((row) => row.source_changed).length,
      restrictedRecords: rows.filter((row) => row.access_status === 'Restricted').length,
      brokenLinks: rows.filter((row) => row.access_status === 'Unavailable' || row.snapshot_status === 'Broken').length,
      linksRequiringReview: rows.filter((row) => row.source_changed || ['High', 'Blocking'].includes(row.impact_level)).length,
      readyForReview: !(required.blockers?.length)
    };
  }

  private linkedRecordsRelationshipMap(rows: any[], required: any) {
    const groups = this.groupBy(rows, 'source_module');
    return [...groups.entries()].map(([sourceModule, group]) => ({
      sourceModule,
      count: group.length,
      required: group.some((row) => row.required),
      missingRequired: required.blockers?.some((blocker: any) => String(blocker.title).toLowerCase().includes(sourceModule.toLowerCase())) ?? false,
      changedSource: group.some((row) => row.source_changed),
      restrictedRecords: group.filter((row) => row.access_status === 'Restricted').length
    }));
  }

  private linkedRecordDependencies(rows: any[], required: any) {
    const dependencies = rows.filter((row) => row.blocking || row.required || row.source_changed).map((row) => ({
      id: row.id,
      linkedRecord: row.record_title ?? row.record_number,
      impactCategory: row.relationship_type,
      impactDescription: row.source_changed ? 'Source record changed since snapshot.' : row.notes ?? 'Linked record supports LOPA readiness.',
      blocking: row.blocking,
      status: row.source_changed ? 'Review Required' : row.snapshot_status,
      requiredAction: row.source_changed ? 'Compare and sync source snapshot' : row.required ? 'Confirm evidence remains valid' : 'Monitor'
    }));
    return [...dependencies, ...(required.blockers ?? []).map((blocker: any) => ({ id: blocker.key, linkedRecord: blocker.title, impactCategory: 'Missing required link', impactDescription: blocker.title, blocking: true, status: 'Missing', requiredAction: 'Add required link' }))];
  }

  private applyLinkedRecordFilters(rows: any[], query: LopaLinkedRecordFilterDto) {
    let filtered = rows;
    if (query.q) {
      const needle = query.q.toLowerCase();
      filtered = filtered.filter((row) => [row.record_number, row.record_title, row.source_module, row.record_type, row.relationship_type, row.notes].some((value) => String(value ?? '').toLowerCase().includes(needle)));
    }
    if (query.recordType) filtered = filtered.filter((row) => row.record_type === query.recordType);
    if (query.sourceModule) filtered = filtered.filter((row) => row.source_module === query.sourceModule);
    if (query.relationshipType) filtered = filtered.filter((row) => row.relationship_type === query.relationshipType);
    if (query.required !== undefined) filtered = filtered.filter((row) => row.required === this.truthy(query.required));
    if (query.blocking !== undefined) filtered = filtered.filter((row) => row.blocking === this.truthy(query.blocking));
    if (query.sourceChanged !== undefined) filtered = filtered.filter((row) => row.source_changed === this.truthy(query.sourceChanged));
    if (query.accessStatus) filtered = filtered.filter((row) => row.access_status === query.accessStatus);
    if (query.quick === 'missing') filtered = filtered.filter((row) => row.required && row.access_status === 'Unavailable');
    return filtered;
  }

  private safeSourceSnapshot(dto: Partial<UpsertLopaLinkedRecordDto>) {
    return {
      sourceModule: dto.sourceModule,
      sourceRecordId: dto.sourceRecordId,
      recordType: dto.recordType,
      recordNumber: dto.recordNumber,
      recordTitle: dto.recordTitle,
      sourceStatus: dto.sourceStatus,
      snapshot: dto.sourceSnapshot ?? {},
      capturedAt: new Date().toISOString()
    };
  }

  private snapshotHash(value: any) {
    return JSON.stringify(value ?? {});
  }

  private async linkedRecordHistory(tenantId: string, actorId: string, study: any, linkedRecordId: string, eventType: string, eventTitle: string, description: string | undefined, before: any, after: any) {
    await this.optionalSingle(this.db.from('lopa_linked_record_history').insert(this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id,
      lopa_study_id: study.id,
      linked_record_id: linkedRecordId,
      event_type: eventType,
      event_title: eventTitle,
      event_description: description,
      actor_user_id: actorId,
      before_values_json: before,
      after_values_json: after
    })).select().single());
  }

  private async updateLinkedRecordStudyStatus(tenantId: string, id: string) {
    const rows = await this.optionalMany('lopa_linked_records', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null));
    await this.optionalSingle(this.db.from('lopa_studies').update({
      linked_records_count: rows.length,
      linked_record_status: rows.some((row) => row.required && row.access_status === 'Unavailable') ? 'Missing Required' : rows.some((row) => row.source_changed) ? 'Review Required' : rows.length ? 'Linked' : 'Not Started',
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
  }

  private truthy(value: unknown) {
    return value === true || value === 'true' || value === '1' || value === 'yes';
  }

  private async studyRecord(tenantId: string, id: string, scope: Scope) {
    let query = this.db.from('lopa_studies').select('*').eq('tenant_id', tenantId).eq('id', id);
    query = this.applyScope(query, scope, 'site_id');
    const study = await this.db.single<any>(query.maybeSingle());
    if (!study) throw new NotFoundException('LOPA study not found');
    return study;
  }

  private assertReviewMutable(study: any) {
    if (this.isReadOnly(study) || study.locked) throw new BadRequestException('Approved or closed LOPA studies are read-only. Reopen through the controlled review workflow first.');
  }

  private async ensureReviewWorkflow(tenantId: string, actorId: string, id: string, scope: Scope) {
    const study = await this.studyRecord(tenantId, id, scope);
    const existing = await this.optionalSingle(this.db.from('lopa_review_workflows').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).maybeSingle());
    if (existing) return existing;
    const workflow = await this.db.single<any>(this.db.from('lopa_review_workflows').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, workflow_status: 'Draft', current_step: 'Draft', approval_status: 'Not Requested', created_by: actorId, updated_by: actorId }).select().single());
    const members = await this.teamMembersRows(tenantId, id);
    const existingAssignments = new Set<string>();
    for (const member of members.filter((member: any) => member.user_id && (member.reviewer || member.approver || member.required_participant))) {
      const reviewRole = this.reviewRoleFromTeamMember(member);
      const key = `${member.user_id}:${reviewRole}`;
      if (existingAssignments.has(key)) continue;
      existingAssignments.add(key);
      await this.optionalSingle(this.db.from('lopa_review_participants').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study.company_id ?? null, site_id: study.site_id, lopa_study_id: id, workflow_id: workflow.id, user_id: member.user_id, team_member_id: member.id, review_role: reviewRole, discipline: member.discipline ?? null, required_reviewer: !!member.required_participant || !!member.reviewer || !!member.approver, approver: !!member.approver || ['LOPA Owner', 'Area Owner', 'Unit Manager'].includes(member.study_role), signature_required: !!member.approver, review_sequence: member.approver ? 20 : 10, decision: 'Pending', signature_status: member.approver ? 'Pending' : 'Not Required', created_by: actorId, updated_by: actorId }).select().single());
    }
    await this.optionalSingle(this.db.from('lopa_studies').update({ review_workflow_id: workflow.id, review_status: 'Draft', approval_status: 'Not Requested', current_review_step: 'Draft', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select('id').single());
    await this.writeHistory(tenantId, id, actorId, 'LOPA_REVIEW_WORKFLOW_CREATED', 'LOPA review workflow created', 'Review workflow and eligible team review route were created.', { workflowId: workflow.id });
    return workflow;
  }

  private reviewRoleFromTeamMember(member: any) {
    const role = String(member.study_role ?? '').toLowerCase();
    if (member.approver || role.includes('owner') || role.includes('manager')) return role.includes('manager') ? 'Final Approver' : 'Approver';
    if (role.includes('hse') || role.includes('process safety')) return 'Process Safety Reviewer';
    if (role.includes('operation')) return 'Operations Reviewer';
    if (role.includes('maintenance')) return 'Maintenance Reviewer';
    if (role.includes('instrument') || role.includes('sis')) return 'Instrument/SIS Reviewer';
    if (role.includes('facilitator')) return 'Technical Reviewer';
    return 'Technical Reviewer';
  }

  private reviewHeader(study: any, workflow: any, signatures: any[]) {
    return {
      lopaNumber: study.lopa_number,
      title: study.title,
      studyStatus: study.status,
      reviewStatus: study.review_status ?? workflow.workflow_status ?? 'Draft',
      approvalStatus: study.approval_status ?? workflow.approval_status ?? 'Not Requested',
      signatureStatus: study.signature_status ?? (signatures.length ? 'In Progress' : 'Not Required'),
      currentStep: study.current_review_step ?? workflow.current_step ?? 'Draft',
      submittedAt: study.review_submitted_at ?? workflow.submitted_at ?? null,
      approvedAt: study.last_approved_at ?? workflow.approved_at ?? null,
      signedAt: study.last_signed_at ?? signatures[0]?.signed_at ?? null,
      locked: !!study.locked || this.isReadOnly(study)
    };
  }

  private buildReviewSummary(readiness: any, workflow: any, participants: any[], comments: any[], blockers: any[], signatures: any[], study: any) {
    const requiredReviewers = participants.filter((participant) => participant.required_reviewer && !participant.approver);
    const approvers = participants.filter((participant) => participant.approver && participant.required_reviewer);
    const completed = (rows: any[]) => rows.filter((row) => ['Approved', 'Approved with comments'].includes(row.decision)).length;
    const blockingComments = comments.filter((comment) => comment.blocking && !['Resolved', 'Accepted', 'Closed'].includes(comment.status));
    const cards = [
      ['reviewStatus', 'Review status', study.review_status ?? workflow.workflow_status ?? 'Draft'],
      ['approvalStatus', 'Approval status', study.approval_status ?? workflow.approval_status ?? 'Not Requested'],
      ['signatureStatus', 'Signature status', study.signature_status ?? (signatures.length ? 'In Progress' : 'Not Required')],
      ['requiredReviewers', 'Required reviewers', requiredReviewers.length],
      ['reviewersCompleted', 'Reviewers completed', completed(requiredReviewers)],
      ['reviewersPending', 'Reviewers pending', requiredReviewers.length - completed(requiredReviewers)],
      ['requiredApprovers', 'Required approvers', approvers.length],
      ['approversCompleted', 'Approvers completed', completed(approvers)],
      ['approversPending', 'Approvers pending', approvers.length - completed(approvers)],
      ['openComments', 'Open review comments', comments.filter((comment) => !['Resolved', 'Accepted', 'Closed'].includes(comment.status)).length],
      ['resolvedComments', 'Resolved comments', comments.filter((comment) => ['Resolved', 'Accepted', 'Closed'].includes(comment.status)).length],
      ['changeRequests', 'Change requests', comments.filter((comment) => comment.comment_type === 'Change request').length],
      ['blockingComments', 'Blocking comments', blockingComments.length],
      ['openBlockers', 'Open blockers', blockers.filter((blocker) => blocker.blocking && !blocker.accepted_exception).length],
      ['teamReadiness', 'Team readiness', readiness.team?.status ?? 'Not Ready'],
      ['calculationStatus', 'Calculation status', readiness.risk?.status ?? study.calculation_status ?? 'Not Started'],
      ['recommendationsReadiness', 'Recommendation readiness', readiness.recommendations?.status ?? 'Not Ready'],
      ['linkedRecordsReadiness', 'Linked records readiness', readiness.checklist?.find((check: any) => check.key === 'linked_records')?.status ?? 'Unknown'],
      ['sectionsComplete', 'Sections complete', readiness.complete ?? 0],
      ['sectionsIncomplete', 'Sections incomplete', (readiness.total ?? 0) - (readiness.complete ?? 0)],
      ['readyForApproval', 'Ready for approval', readiness.status === 'Ready' ? 'Yes' : 'No'],
      ['approvedClosed', 'Approved/closed', ['Approved', 'Closed'].includes(study.status) ? 'Yes' : 'No']
    ];
    return { cards: cards.map(([key, label, value]) => ({ key, label, value })), readyForApproval: readiness.status === 'Ready' };
  }

  private reviewTimeline(workflow: any, participants: any[], study: any) {
    const status = workflow?.workflow_status ?? 'Draft';
    const steps = ['Draft', 'Ready for Review', 'Submitted for Review', 'Technical Review', 'Changes Requested', 'Review Complete', 'Approval Pending', 'Approved / Rejected', 'E-Signed', 'Closed / Locked'];
    const current = workflow?.current_step ?? study.current_review_step ?? 'Draft';
    return steps.map((name, index) => ({ step: name, sequence: index + 1, status: name === current || (name === 'Technical Review' && status === 'In Review') ? 'Current' : this.workflowStepComplete(name, status) ? 'Complete' : 'Pending', assigned: name === 'Technical Review' ? participants.filter((participant) => !participant.approver).map((participant) => participant.user?.displayName ?? participant.user_id).join(', ') : name === 'Approval Pending' ? participants.filter((participant) => participant.approver).map((participant) => participant.user?.displayName ?? participant.user_id).join(', ') : null, startedAt: workflow?.submitted_at ?? null, completedAt: ['Approved / Rejected', 'Closed / Locked'].includes(name) ? workflow?.approved_at ?? workflow?.rejected_at ?? null : null, comments: workflow?.changes_requested_reason ?? workflow?.rejection_reason ?? null }));
  }

  private workflowStepComplete(name: string, status: string) {
    const order = ['Draft', 'Ready for Review', 'Submitted for Review', 'Technical Review', 'Changes Requested', 'Review Complete', 'Approval Pending', 'Approved / Rejected', 'E-Signed', 'Closed / Locked'];
    const statusStep = status === 'Approved' ? 'Closed / Locked' : status === 'Rejected' ? 'Approved / Rejected' : status === 'In Review' ? 'Technical Review' : status;
    return order.indexOf(name) < order.indexOf(statusStep);
  }

  private reviewContext(study: any) {
    return {
      reviewRoles: ['Technical Reviewer', 'Process Safety Reviewer', 'Operations Reviewer', 'Maintenance Reviewer', 'Instrument/SIS Reviewer', 'HSE/EHS Reviewer', 'Area Owner Reviewer', 'Management Reviewer', 'Approver', 'Final Approver', 'Witness', 'Observer', 'Other'],
      commentTypes: ['General comment', 'Technical concern', 'Change request', 'Missing information', 'Calculation concern', 'IPL validation concern', 'PFD/RRF basis concern', 'Risk gap concern', 'Recommendation/action concern', 'Linked record/evidence concern', 'Team/session concern', 'Approval condition', 'Other'],
      signatureMeanings: ['Reviewed', 'Approved', 'Approved with conditions', 'Rejected', 'Final approval', 'Witnessed', 'Reopened approval', 'Superseded approval'],
      readOnly: this.isReadOnly(study) || !!study.locked
    };
  }

  private reviewBlockerRows(readiness: any, workflow: any | null, id: string) {
    return (readiness.checklist ?? []).filter((check: any) => ['Blocked', 'Incomplete'].includes(check.status)).map((check: any) => ({
      id: crypto.randomUUID(), tenant_id: undefined, company_id: undefined, site_id: undefined, lopa_study_id: id, workflow_id: workflow?.id ?? null,
      blocker_key: `review:${check.key}`, blocker_type: check.key, source_tab: this.reviewTabForCheck(check.key), blocker_title: check.label, blocker_description: check.label, severity: check.status === 'Blocked' ? 'High' : 'Medium', blocking: check.status === 'Blocked', status: 'Open', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }));
  }

  private reviewTabForCheck(key: string) {
    const tabs: Record<string, string> = { overview: 'Overview', scenario_consequence: 'Scenario & Consequence', initiating_event: 'Initiating Event', conditional_modifiers: 'Initiating Event', ipls: 'IPLs / Safeguards', risk_calculation: 'Risk Calculation', risk_recalculation: 'Risk Calculation', risk_gap: 'Risk Calculation', sil: 'SIL Determination', recommendations: 'Recommendations / Actions', linked_records: 'Linked Records', team_sessions: 'Team & Sessions', reviewers: 'Review & Sign-Off', signatures: 'Review & Sign-Off', comments: 'Review & Sign-Off', calculation_blockers: 'Risk Calculation' };
    return tabs[key] ?? 'Review & Sign-Off';
  }

  private async reviewParticipantRecord(tenantId: string, id: string, participantId: string) {
    const participant = await this.db.single<any>(this.db.from('lopa_review_participants').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', participantId).maybeSingle());
    if (!participant) throw new NotFoundException('Review participant not found.');
    return participant;
  }

  private async reviewCommentRecord(tenantId: string, id: string, commentId: string, scope: Scope) {
    await this.studyRecord(tenantId, id, scope);
    const comment = await this.db.single<any>(this.db.from('lopa_review_comments').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).eq('id', commentId).is('deleted_at', null).maybeSingle());
    if (!comment) throw new NotFoundException('Review comment not found.');
    return comment;
  }

  private async assertParticipantSequence(tenantId: string, id: string, participant: any) {
    const previous = await this.optionalMany('lopa_review_participants', (q) => q.select('id,review_role,decision').eq('tenant_id', tenantId).eq('lopa_study_id', id).lt('review_sequence', participant.review_sequence).eq('required_reviewer', true));
    const pending = previous.filter((row: any) => !['Approved', 'Approved with comments', 'Not required', 'Abstained'].includes(row.decision));
    if (pending.length) throw new BadRequestException(`Previous review sequence is incomplete: ${pending.map((row: any) => row.review_role).join(', ')}`);
  }

  private async notifyReviewUser(tenantId: string, userId: string, study: any, type: string, title: string, message: string) {
    return this.notifications.notifyUser({ tenantId, userId, companyId: study.company_id ?? null, siteId: study.site_id, type, module: 'lopa', title, message, relatedRecordId: study.id, relatedRecordType: 'LOPA', relatedUrl: `/lopa/${study.id}?tab=review`, priority: 'High' }).catch(() => null);
  }

  private async createApprovalSnapshot(tenantId: string, actorId: string, id: string, workflow: any, approvalComments: string | undefined, scope: Scope) {
    const [detail, readiness, participants, signatures, recommendations, linked, risk] = await Promise.all([
      this.get(tenantId, id, scope), this.reviewReadiness(tenantId, id, scope), this.reviewParticipants(tenantId, id, scope), this.reviewSignatures(tenantId, id, scope), this.recommendationsReadiness(tenantId, id, scope), this.optionalMany('lopa_linked_records', (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', id).is('unlinked_at', null)), this.latestRiskCalculation(tenantId, id)
    ]);
    const existing = await this.reviewSnapshots(tenantId, id, scope);
    const now = new Date().toISOString();
    const snapshotJson = { study: detail, readiness: readiness.checklist, calculation: risk ?? null, recommendations, linkedRecords: linked, participants, signatures, approvalComments: approvalComments ?? null, createdAt: now };
    return this.db.single<any>(this.db.from('lopa_review_approval_snapshots').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: null, site_id: detail.siteId, lopa_study_id: id, workflow_id: workflow.id, snapshot_version: existing.length + 1, snapshot_status: 'Approved', snapshot_json: snapshotJson, calculation_version_id: risk?.id ?? null, approval_comments: approvalComments ?? null, approved_by: actorId, approved_at: now, created_by: actorId }).select().single());
  }

  private async libraryRows(table: string, tenantId: string, scope: Scope) {
    let query = this.db.from(table).select('*').eq('tenant_id', tenantId);
    query = this.applyLibraryScope(query, scope);
    return this.db.many<any>(query.order('updated_at', { ascending: false }));
  }

  private async iplRegistryRows(tenantId: string, scope: Scope) {
    let query = this.db.from('lopa_ipl_registry').select('*').eq('tenant_id', tenantId);
    query = this.applyLibraryScope(query, scope);
    const rows = await this.db.many<any>(query.order('updated_at', { ascending: false }));
    const ids = rows.map((row) => row.id);
    const [equipmentLinks, documentLinks] = await Promise.all([
      ids.length ? this.optionalMany('lopa_ipl_registry_equipment_links', (q) => q.select('registry_id').eq('tenant_id', tenantId).in('registry_id', ids)) : [],
      ids.length ? this.optionalMany('lopa_ipl_registry_document_links', (q) => q.select('registry_id').eq('tenant_id', tenantId).in('registry_id', ids)) : []
    ]);
    return rows.map((row) => ({
      ...row,
      equipment_links_count: equipmentLinks.filter((link) => link.registry_id === row.id).length,
      document_links_count: documentLinks.filter((link) => link.registry_id === row.id).length
    }));
  }

  private async iplRegistryRecord(tenantId: string, id: string, scope: Scope) {
    let query = this.db.from('lopa_ipl_registry').select('*').eq('tenant_id', tenantId).eq('id', id);
    query = this.applyLibraryScope(query, scope);
    const row = await this.db.single<any>(query.maybeSingle());
    if (!row) throw new NotFoundException('IPL registry record not found');
    return row;
  }

  private paginatedIplRegistry(rows: any[], query: LopaIplRegistryFilterDto) {
    const today = new Date().toISOString().slice(0, 10);
    const q = String(query.q ?? '').toLowerCase().trim();
    let filtered = rows.filter((row) => {
      const haystack = [row.registry_number, row.ipl_name, row.ipl_type, row.description, row.service_application, row.protected_equipment, row.source_reference, row.standard_reference, row.owner_id].join(' ').toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (query.status && row.approval_status !== query.status) return false;
      if (query.iplType && row.ipl_type !== query.iplType) return false;
      if (query.siteId && row.site_id !== query.siteId) return false;
      if (query.ownerId && row.owner_id !== query.ownerId) return false;
      if (query.validationStatus && row.validation_status !== query.validationStatus) return false;
      if (query.sourceType && row.source_type !== query.sourceType) return false;
      if (query.quick === 'missing-source' && row.source_reference) return false;
      if (query.quick === 'missing-pfd' && (row.pfdavg != null || row.rrf != null)) return false;
      if (query.quick === 'proof-overdue' && !(row.proof_test_due_date && row.proof_test_due_date < today)) return false;
      if (query.quick === 'validation-failed' && row.validation_status !== 'Failed') return false;
      if (query.quick === 'archived' && row.approval_status !== 'Archived' && row.active) return false;
      return true;
    });
    const sort = query.sort || 'updated_at.desc';
    const [field, direction] = sort.split('.');
    const dir = direction === 'asc' ? 1 : -1;
    filtered = filtered.sort((a, b) => String(a[field || 'updated_at'] ?? '').localeCompare(String(b[field || 'updated_at'] ?? '')) * dir);
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    return { rows: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit };
  }

  private iplRegistryPayload(tenantId: string, actorId: string, dto: UpsertLopaIplRegistryDto, base: Record<string, any>) {
    return this.clean({
      ...base,
      tenant_id: tenantId,
      company_id: dto.companyId,
      site_id: dto.siteId,
      ipl_name: dto.iplName,
      ipl_type: dto.iplType,
      description: dto.description,
      service_application: dto.serviceApplication,
      equipment_type: dto.equipmentType,
      process_service: dto.processService,
      protected_equipment: dto.protectedEquipment,
      safe_state: dto.safeState,
      demand_source: dto.demandSource,
      risk_reduction_claim: dto.riskReductionClaim,
      pfdavg: dto.pfdavg,
      rrf: dto.rrf,
      pfd_basis: dto.pfdBasis,
      rrf_basis: dto.rrfBasis,
      source_type: dto.sourceType,
      source_reference: dto.sourceReference,
      standard_reference: dto.standardReference,
      proof_test_interval: dto.proofTestInterval,
      proof_test_basis: dto.proofTestBasis,
      inspection_requirement: dto.inspectionRequirement,
      maintenance_requirement: dto.maintenanceRequirement,
      owner_id: dto.ownerId,
      review_due_date: dto.reviewDueDate,
      proof_test_due_date: dto.proofTestDueDate,
      criteria_template: dto.criteriaTemplate,
      type_details: dto.typeDetails,
      required_documents: dto.requiredDocuments,
      tags: dto.tags,
      revision_notes: dto.revisionNotes,
      updated_by: actorId
    });
  }

  private validateIplRegistry(dto: UpsertLopaIplRegistryDto) {
    if (!this.iplTypes().includes(dto.iplType)) throw new BadRequestException('Unsupported IPL type.');
    if (dto.pfdavg != null && (dto.pfdavg <= 0 || dto.pfdavg > 1)) throw new BadRequestException('PFDavg must be greater than 0 and less than or equal to 1.');
    if (dto.rrf != null && dto.rrf <= 0) throw new BadRequestException('RRF must be positive.');
    if (dto.pfdavg != null && dto.rrf != null) {
      const expected = 1 / dto.pfdavg;
      if (Math.abs(expected - dto.rrf) / expected > 0.25) throw new BadRequestException('PFDavg and RRF are not reasonably aligned.');
    }
  }

  private async assertIplRegistryApprovable(tenantId: string, record: any) {
    const blockers: string[] = [];
    if (!record.source_reference) blockers.push('Source reference is required.');
    if (record.pfdavg == null && record.rrf == null) blockers.push('PFDavg or RRF basis is required.');
    if (!record.pfd_basis && !record.rrf_basis) blockers.push('PFD/RRF basis narrative is required.');
    if (!record.proof_test_basis) blockers.push('Proof test basis is required.');
    const docsRequired = Array.isArray(record.required_documents) && record.required_documents.length > 0;
    if (docsRequired) {
      const docs = await this.optionalMany('lopa_ipl_registry_document_links', (q) => q.select('id').eq('tenant_id', tenantId).eq('registry_id', record.id));
      if (!docs.length) blockers.push('Required document links are missing.');
    }
    const criteria = await this.optionalMany('lopa_ipl_registry_validation_items', (q) => q.select('*').eq('tenant_id', tenantId).eq('registry_id', record.id));
    const mandatoryFailed = criteria.filter((item) => item.mandatory && !['Pass', 'Passed', 'Not Applicable'].includes(item.status));
    if (!criteria.length) blockers.push('IPL validation criteria are not configured.');
    if (mandatoryFailed.length) blockers.push(`Mandatory validation criteria not passed: ${mandatoryFailed.map((item) => item.criteria_label).join(', ')}.`);
    const missingEvidence = criteria.filter((item) => item.evidence_required && !['Provided', 'Verified', 'Not Required'].includes(item.evidence_status));
    if (missingEvidence.length) blockers.push(`Required evidence missing: ${missingEvidence.map((item) => item.criteria_label).join(', ')}.`);
    if (blockers.length) throw new BadRequestException(`Cannot approve IPL registry record. ${blockers.join(' ')}`);
  }

  private async ensureIplRegistryMutable(tenantId: string, id: string, scope: Scope) {
    const record = await this.iplRegistryRecord(tenantId, id, scope);
    if (record.approval_status === 'Approved') throw new BadRequestException('Approved IPL registry records are read-only. Create a new revision before changing links.');
    if (record.approval_status === 'Archived' || !record.active) throw new BadRequestException('Archived IPL registry records cannot be changed.');
    return record;
  }

  private async nextIplRegistryNumber(tenantId: string) {
    const year = new Date().getFullYear();
    const rows = await this.optionalMany('lopa_ipl_registry', (q) => q.select('registry_number').eq('tenant_id', tenantId).ilike('registry_number', `IPL-${year}-%`));
    return `IPL-${year}-${String(rows.length + 1).padStart(5, '0')}`;
  }

  private iplTypes() {
    return ['SIS / SIF', 'PSV', 'Rupture disc', 'HIPPS', 'BPCS independent function', 'Alarm with operator response', 'Operator manual response', 'Mechanical/electrical interlock', 'ESD function', 'Fire and gas detection/action', 'Deluge/fire protection', 'Passive protection', 'Dike/bund/secondary containment', 'Blast wall/fireproofing', 'Check valve', 'Flame arrestor', 'Ventilation', 'Physical separation', 'Relief system', 'Mechanical protection device', 'Procedure-based IPL', 'Other'];
  }

  private defaultIplCriteria() {
    return [
      ['independence', 'Independent from initiating event'],
      ['effectiveness', 'Effective for the scenario'],
      ['specificity', 'Specific to the consequence path'],
      ['auditability_testability', 'Auditable and testable'],
      ['reliability_availability', 'Reliability / availability justified'],
      ['proof_test_maintenance', 'Proof test and maintenance defined'],
      ['no_common_cause', 'No common cause vulnerability'],
      ['not_double_counted', 'Not double counted'],
      ['not_same_as_initiating_event', 'Not the same as initiating event'],
      ['not_same_human_response', 'Not the same human response'],
      ['documented_basis', 'Documented basis available'],
      ['evidence', 'Evidence attached / linked'],
      ['owner', 'Owner assigned'],
      ['applicability', 'Applicable to operating mode']
    ].map(([criteriaKey, criteriaLabel], index) => ({ criteriaKey, criteriaLabel, mandatory: true, status: 'Not Reviewed', evidenceRequired: criteriaKey === 'evidence' || criteriaKey === 'documented_basis', evidenceStatus: 'Not Provided', sortOrder: index }));
  }

  private async seedIplValidationItems(tenantId: string, actorId: string, registryId: string) {
    const existing = await this.optionalMany('lopa_ipl_registry_validation_items', (q) => q.select('id').eq('tenant_id', tenantId).eq('registry_id', registryId).limit(1));
    if (existing.length) return this.optionalMany('lopa_ipl_registry_validation_items', (q) => q.select('*').eq('tenant_id', tenantId).eq('registry_id', registryId).order('sort_order'));
    return this.optionalMany('lopa_ipl_registry_validation_items', (q) => q.insert(this.defaultIplCriteria().map((item) => this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      registry_id: registryId,
      criteria_key: item.criteriaKey,
      criteria_label: item.criteriaLabel,
      mandatory: item.mandatory,
      status: item.status,
      evidence_required: item.evidenceRequired,
      evidence_status: item.evidenceStatus,
      sort_order: item.sortOrder,
      created_by: actorId,
      updated_by: actorId
    }))).select());
  }

  private writeIplRegistryHistory(tenantId: string, registryId: string, actorId: string, eventType: string, title: string, description?: string | null, beforeData?: any, afterData?: any) {
    return this.optionalSingle(this.db.from('lopa_ipl_registry_history').insert(this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      registry_id: registryId,
      event_type: eventType,
      title,
      description,
      actor_id: actorId,
      severity: ['APPROVED', 'REJECTED', 'ARCHIVED'].includes(eventType) ? 'Warning' : 'Info',
      before_data: beforeData ?? null,
      after_data: afterData ?? null,
      metadata: {}
    })).select().single());
  }

  private async libraryRecord(table: string, tenantId: string, id: string, scope: Scope) {
    let query = this.db.from(table).select('*').eq('tenant_id', tenantId).eq('id', id);
    query = this.applyLibraryScope(query, scope);
    const row = await this.db.single<any>(query.maybeSingle());
    if (!row) throw new NotFoundException('LOPA library record not found');
    return row;
  }

  private applyLibraryScope(query: any, scope: Scope) {
    if (scope.selectedSiteId) return query.or(`site_id.is.null,site_id.eq.${scope.selectedSiteId}`);
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.or(`site_id.is.null,site_id.in.(${scope.allowedSiteIds.join(',')})`);
    return query;
  }

  private assertLibraryScope(siteId: string | undefined, scope: Scope) {
    if (!siteId) return;
    this.assertSiteAllowed(siteId, scope);
  }

  private librarySummary(rows: any[], kind: 'event' | 'modifier') {
    return {
      total: rows.length,
      active: this.count(rows, (r) => !!r.active),
      draft: this.count(rows, (r) => r.approval_status === 'Draft'),
      pendingApproval: this.count(rows, (r) => r.approval_status === 'Pending Review'),
      approved: this.count(rows, (r) => r.approval_status === 'Approved'),
      archived: this.count(rows, (r) => r.approval_status === 'Archived' || !r.active),
      corporate: this.count(rows, (r) => !r.site_id || r.scope === 'Corporate'),
      siteSpecific: this.count(rows, (r) => !!r.site_id || r.scope === 'Site'),
      withUncertaintyRange: this.count(rows, (r) => kind === 'event' ? r.low_frequency != null && r.high_frequency != null : r.low_value != null && r.high_value != null),
      needingReview: this.count(rows, (r) => r.approval_status === 'Pending Review' || r.approval_status === 'Rejected'),
      missingSourceReference: this.count(rows, (r) => !r.source_reference)
    };
  }

  private paginatedLibrary(rows: any[], query: LopaLibraryFilterDto) {
    const q = String(query.q ?? '').toLowerCase().trim();
    let filtered = rows.filter((row) => {
      const haystack = [row.event_code, row.event_name, row.modifier_code, row.modifier_name, row.description, row.event_category, row.modifier_type, row.failure_mode, row.source_reference].join(' ').toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (query.status && row.approval_status !== query.status) return false;
      if (query.category && row.event_category !== query.category && row.modifier_type !== query.category) return false;
      if (query.scope && row.scope !== query.scope) return false;
      if (query.siteId && row.site_id !== query.siteId) return false;
      if (query.sourceType && row.source_type !== query.sourceType) return false;
      return true;
    });
    const sort = query.sort || 'updated_at.desc';
    const [field, direction] = sort.split('.');
    const dir = direction === 'asc' ? 1 : -1;
    filtered = filtered.sort((a, b) => String(a[field || 'updated_at'] ?? '').localeCompare(String(b[field || 'updated_at'] ?? '')) * dir);
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    return { rows: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit };
  }

  private validateInitiatingEventLibrary(dto: UpsertInitiatingEventLibraryDto) {
    if (dto.baseFrequency <= 0) throw new BadRequestException('Base frequency must be positive.');
    if (!dto.frequencyUnit) throw new BadRequestException('Frequency unit is required.');
    if (!dto.sourceReference) throw new BadRequestException('Source reference is required.');
    if (dto.lowFrequency != null && dto.lowFrequency > dto.baseFrequency) throw new BadRequestException('Low frequency cannot be greater than base frequency.');
    if (dto.highFrequency != null && dto.highFrequency < dto.baseFrequency) throw new BadRequestException('High frequency cannot be lower than base frequency.');
    if (dto.lowFrequency != null && dto.highFrequency != null && dto.lowFrequency > dto.highFrequency) throw new BadRequestException('Low frequency cannot be greater than high frequency.');
    if (dto.sourceType === 'Engineering judgement' && !dto.engineeringJustification) throw new BadRequestException('Engineering judgement requires engineering justification.');
  }

  private validateModifierLibrary(dto: UpsertConditionalModifierLibraryDto) {
    if (dto.defaultValue < 0 || dto.defaultValue > 1) throw new BadRequestException('Conditional modifier default value must be between 0 and 1.');
    if (!dto.sourceReference) throw new BadRequestException('Source reference is required.');
    if (dto.lowValue != null && dto.lowValue > dto.defaultValue) throw new BadRequestException('Low value cannot be greater than default value.');
    if (dto.highValue != null && dto.highValue < dto.defaultValue) throw new BadRequestException('High value cannot be lower than default value.');
    if (dto.lowValue != null && dto.highValue != null && dto.lowValue > dto.highValue) throw new BadRequestException('Low value cannot be greater than high value.');
    if (dto.sourceType === 'Engineering judgement' && !dto.engineeringJustification) throw new BadRequestException('Engineering judgement requires engineering justification.');
  }

  private assertApprovedForUse(row: any) {
    if (row.approval_status !== 'Approved' || !row.active) throw new BadRequestException('Only active approved library records can be selected for LOPA studies.');
  }

  private isReadOnly(study: any) {
    return ['Approved', 'Closed', 'Cancelled'].includes(study?.status);
  }

  private assertMutable(study: any) {
    if (this.isReadOnly(study)) throw new BadRequestException('This LOPA study is read-only. Reopen it before making changes.');
  }

  private check(key: string, label: string, ok: boolean, fallback: 'Incomplete' | 'Warning' | 'Blocked' | 'Not Applicable' | 'Complete' = 'Incomplete', tab?: string) {
    return { key, label, status: ok ? 'Complete' : fallback, complete: ok, tab };
  }

  private blocker(title: string, description: string, severity: 'Hard' | 'Soft', tab: string) {
    return { id: `${tab}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, title, description, severity, tab };
  }

  private toneForStatus(value?: string | null) {
    const normalized = String(value ?? '').toLowerCase();
    if (normalized.includes('approved') || normalized.includes('closed') || normalized.includes('complete') || normalized.includes('validated')) return 'success';
    if (normalized.includes('gap') || normalized.includes('failed') || normalized.includes('overdue') || normalized.includes('cancel')) return 'danger';
    if (normalized.includes('progress') || normalized.includes('preparation')) return 'info';
    return 'warning';
  }

  private toneForRisk(value?: string | null) {
    if (value === 'Critical' || value === 'Catastrophic') return 'danger';
    if (value === 'High' || value === 'Major') return 'danger';
    if (value === 'Medium' || value === 'Moderate') return 'warning';
    if (!value) return 'warning';
    return 'success';
  }

  private async sourceChangedAfterSnapshot(tenantId: string, scenarioId?: string | null, snapshot?: any) {
    if (!scenarioId || !snapshot?.created_at) return false;
    const scenario = await this.optionalSingle(this.db.from('hazop_scenarios').select('updated_at').eq('tenant_id', tenantId).eq('id', scenarioId).single());
    return !!scenario?.updated_at && scenario.updated_at > snapshot.created_at;
  }

  private buildSourceSnapshot(detail: any, snapshot: any, sourceChanged: boolean) {
    const payload = snapshot?.source_payload ?? {};
    if (!detail.hazopScenarioId && !snapshot) return null;
    return {
      restricted: false,
      sourceChanged,
      snapshotId: snapshot?.id ?? null,
      snapshotCreatedAt: snapshot?.created_at ?? null,
      hazopId: payload.hazopId ?? null,
      hazopNumber: payload.hazopNumber ?? detail.sourceRecordId ?? 'Linked HAZOP',
      hazopTitle: payload.hazopTitle ?? null,
      node: payload.nodeTitle ?? payload.nodeNumber ?? null,
      deviation: payload.deviation ?? null,
      cause: payload.cause ?? null,
      consequence: payload.consequence ?? null,
      initialRisk: payload.riskScore ?? null,
      residualRisk: payload.residualRisk ?? null,
      riskLevel: payload.riskLevel ?? detail.consequenceSeverity ?? null,
      lopaRequiredReason: payload.lopaRequiredReason ?? payload.lopa_trigger_reason ?? 'LOPA required by HAZOP/PHA',
      recommendationReference: payload.recommendations?.[0]?.recommendation_number ?? payload.recommendations?.[0]?.id ?? null,
      safeguardsCount: Array.isArray(payload.safeguards) ? payload.safeguards.length : 0,
      equipmentTag: payload.equipmentTag ?? detail.equipmentTag ?? null,
      linkedMoc: payload.linkedMoc ?? null,
      linkedPssr: payload.linkedPssr ?? null,
      scenarioStatus: payload.status ?? null,
      traceabilityStatus: detail.hazopScenarioId ? 'Linked' : 'Manual source'
    };
  }

  private buildMetadata(study: any, detail: any) {
    return {
      title: detail.title,
      description: detail.description,
      studyType: detail.studyType,
      source: detail.source,
      companyId: study.company_id,
      siteId: detail.siteId,
      unitId: detail.unitId,
      areaId: detail.areaId,
      equipmentTag: detail.equipmentTag,
      ownerId: detail.ownerId,
      ownerProfile: detail.ownerProfile ?? null,
      ownerName: detail.ownerProfile?.displayName ?? detail.ownerId,
      facilitatorId: detail.facilitatorId,
      teamSummary: `${detail.teamMembers?.length ?? 0} members`,
      priority: detail.priority,
      confidentialityLevel: study.confidentiality_level,
      tags: detail.tags ?? [],
      dueDate: detail.dueDate,
      revalidationDueDate: detail.revalidationDueDate,
      createdBy: study.created_by,
      createdAt: detail.createdAt,
      updatedBy: study.updated_by,
      updatedAt: detail.updatedAt
    };
  }

  private buildConsequenceSnapshot(consequence: any, detail: any) {
    return {
      description: consequence?.description ?? null,
      category: consequence?.category ?? null,
      severity: consequence?.severity ?? detail.consequenceSeverity ?? null,
      impactedReceptor: consequence?.impacted_receptor ?? null,
      endpoint: consequence?.endpoint ?? null,
      tolerableEventFrequency: consequence?.tolerable_event_frequency ?? detail.tolerableFrequency ?? null,
      riskCriteriaSource: consequence?.risk_criteria_source ?? null,
      personnelImpact: consequence?.personnel_impact ?? null,
      environmentalImpact: consequence?.environmental_impact ?? null,
      assetImpact: consequence?.asset_impact ?? null,
      communityImpact: consequence?.community_impact ?? null,
      notes: consequence?.notes ?? null,
      completionStatus: consequence?.description && (consequence?.severity ?? detail.consequenceSeverity) ? 'Complete' : 'Incomplete'
    };
  }

  private buildInitiatingEventSnapshot(event: any, detail: any, librarySnapshot?: any) {
    return {
      description: event?.description ?? librarySnapshot?.event_name ?? null,
      category: event?.event_category ?? librarySnapshot?.event_category ?? null,
      failureMode: event?.failure_mode ?? librarySnapshot?.failure_mode ?? null,
      frequencyInputMethod: event?.frequency_method ?? (librarySnapshot ? 'Library' : null),
      libraryReference: event?.library_event ?? librarySnapshot?.event_code ?? null,
      libraryStatus: librarySnapshot?.approval_status ?? null,
      libraryRevision: librarySnapshot?.library_revision ?? null,
      frequency: event?.frequency_per_year ?? librarySnapshot?.selected_frequency ?? detail.initiatingEventFrequency ?? null,
      unit: 'per year',
      sourceReference: event?.frequency_source ?? librarySnapshot?.source_reference ?? null,
      basis: event?.basis ?? null,
      lowEstimate: event?.low_estimate ?? librarySnapshot?.low_frequency ?? null,
      highEstimate: event?.high_estimate ?? librarySnapshot?.high_frequency ?? null,
      confidenceLevel: event?.confidence_level ?? librarySnapshot?.confidence_level ?? null,
      siteModifier: event?.site_modifier ?? librarySnapshot?.site_modifier ?? null,
      engineeringJustification: event?.engineering_justification ?? librarySnapshot?.engineering_justification ?? null,
      enablingConditionStatus: event?.enabling_condition_status ?? 'Not Reviewed',
      notes: event?.notes ?? null,
      completionStatus: (event?.description || librarySnapshot?.event_name) && (event?.frequency_per_year ?? librarySnapshot?.selected_frequency ?? detail.initiatingEventFrequency) ? 'Complete' : 'Incomplete'
    };
  }

  private buildSafeguardSnapshot(safeguards: any[]) {
    const iplCandidates = safeguards.filter((s) => String(s.proposed_lopa_use ?? '').toLowerCase().includes('ipl'));
    return {
      totalImported: safeguards.length,
      safeguardOnly: safeguards.filter((s) => !String(s.proposed_lopa_use ?? '').toLowerCase().includes('ipl')).length,
      iplCandidates: iplCandidates.length,
      validationNotStarted: safeguards.filter((s) => ['Not Started', null, undefined].includes(s.validation_status)).length,
      validationFailed: safeguards.filter((s) => s.validation_status === 'Failed' || s.validation_status === 'Rejected').length,
      validated: safeguards.filter((s) => s.validation_status === 'Validated').length,
      credited: safeguards.filter((s) => !!s.credited_as_ipl).length,
      hazopSourceCount: safeguards.filter((s) => !!s.source_safeguard_id).length,
      rows: safeguards.map((s) => ({ id: s.id, name: s.safeguard_name, type: s.safeguard_type, source: s.source_safeguard_id ? 'HAZOP' : 'Manual', proposedLopaUse: s.proposed_lopa_use, initialChecks: s.initial_checks ?? null, validationStatus: s.validation_status, credited: !!s.credited_as_ipl, pfdRrfStatus: s.pfd_rrf_status ?? (s.pfdavg || s.rrf ? 'Available' : 'Pending') }))
    };
  }

  private buildCalculationSnapshot(study: any, detail: any, consequence: any) {
    return {
      status: detail.calculationStatus,
      lastVersion: study.calculation_version ?? null,
      lastCalculatedBy: study.last_calculated_by ?? null,
      lastCalculatedAt: study.last_calculated_at ?? null,
      initiatingEventFrequency: detail.initiatingEventFrequency,
      conditionalModifiers: study.conditional_modifiers_status ?? 'Not Started',
      totalPfdavg: study.total_pfdavg ?? null,
      totalRrf: study.total_rrf ?? null,
      mitigatedEventFrequency: detail.mitigatedEventFrequency,
      tolerableFrequency: detail.tolerableFrequency ?? consequence?.tolerable_event_frequency ?? null,
      requiredRrf: study.required_rrf ?? null,
      riskGap: detail.riskGap,
      passFail: study.pass_fail ?? (String(detail.riskGap ?? '').toLowerCase().includes('gap') ? 'Fail' : 'Not evaluated'),
      warnings: detail.calculationStatus === 'Not Started' ? ['Calculation has not been run.'] : [],
      locked: !!study.calculation_locked,
      formula: 'Consequence Frequency = Initiating Event Frequency x Conditional Modifiers x Product of Credited IPL PFDavg values'
    };
  }

  private buildSilSnapshot(study: any, detail: any) {
    return {
      status: detail.targetSil ? 'Determined' : 'Not Determined',
      sifRequired: !!detail.silRequired,
      requiredSil: detail.targetSil,
      installedSil: study.installed_sil ?? null,
      silGapStatus: detail.silGapStatus,
      requiredPfdavg: study.required_pfdavg ?? null,
      requiredRrf: study.required_rrf ?? null,
      alarpCategory: study.alarp_category ?? null,
      existingSifLinked: !!study.existing_sif_id,
      newSifRequired: !!study.new_sif_required,
      mocRequired: !!study.moc_required,
      miProofTestRequired: !!study.mi_proof_test_required,
      determinationStatus: study.sil_determination_status ?? (detail.targetSil ? 'Complete' : 'Partial')
    };
  }

  private buildLinkedRecords(detail: any, snapshot: any, actions: any[]) {
    return [
      { type: 'HAZOP/PHA', count: detail.hazopScenarioId ? 1 : 0, status: detail.hazopScenarioId ? 'Linked' : 'None', restricted: false },
      { type: 'MOC', count: snapshot?.source_payload?.linkedMoc ? 1 : 0, status: snapshot?.source_payload?.linkedMoc ? 'Linked' : 'None', restricted: false },
      { type: 'PSSR', count: snapshot?.source_payload?.linkedPssr ? 1 : 0, status: snapshot?.source_payload?.linkedPssr ? 'Linked' : 'None', restricted: false },
      { type: 'Equipment', count: detail.equipmentTag ? 1 : 0, status: detail.equipmentTag ? detail.equipmentTag : 'None', restricted: false },
      { type: 'Documents', count: 0, status: 'No linked documents', restricted: false },
      { type: 'MI Records', count: 0, status: 'No linked MI records', restricted: false },
      { type: 'Universal Actions', count: detail.openActions ?? actions.length, status: (detail.openActions ?? actions.length) ? 'Open' : 'None open', restricted: false },
      { type: 'SIF/SIS Records', count: detail.silRequired ? 1 : 0, status: detail.silRequired ? 'Required' : 'Not required', restricted: false }
    ];
  }

  private buildQuickActions(detail: any, readiness: any, blockers: any[], readOnly: boolean) {
    const disabledReason = readOnly ? 'Study is read-only. Reopen before editing.' : undefined;
    return [
      { key: 'edit', label: 'Edit study info', enabled: !readOnly, reason: disabledReason, tab: 'overview' },
      { key: 'consequence', label: 'Complete consequence', enabled: !readOnly, reason: disabledReason, tab: 'scenario' },
      { key: 'initiating_event', label: 'Complete initiating event', enabled: !readOnly, reason: disabledReason, tab: 'initiating-event' },
      { key: 'safeguards', label: 'Review safeguards', enabled: !readOnly, reason: disabledReason, tab: 'ipls' },
      { key: 'validate_ipls', label: 'Validate IPLs', enabled: !readOnly, reason: disabledReason, tab: 'ipls' },
      { key: 'calculation', label: 'Run calculation', enabled: !readOnly && readiness.checklist.some((c: any) => c.key === 'initiating_event' && c.complete), reason: readOnly ? disabledReason : 'Complete initiating event first.', tab: 'risk-calculation' },
      { key: 'sil', label: 'Determine SIL', enabled: !readOnly && detail.silRequired, reason: readOnly ? disabledReason : 'SIL is not currently required.', tab: 'sil' },
      { key: 'action', label: 'Create recommendation/action', enabled: !readOnly, reason: disabledReason, tab: 'actions' },
      { key: 'linked_record', label: 'Add linked record', enabled: !readOnly, reason: disabledReason, tab: 'linked-records' },
      { key: 'review', label: 'Request review', enabled: !readOnly && blockers.filter((b: any) => b.severity === 'Hard').length === 0, reason: readOnly ? disabledReason : 'Clear hard blockers before requesting review.', tab: 'review' },
      { key: 'export', label: 'Export summary', enabled: true, tab: 'overview' }
    ];
  }

  private async studies(tenantId: string, scope: Scope) {
    let query = this.db.from('lopa_studies').select('*').eq('tenant_id', tenantId);
    query = this.applyScope(query, scope, 'site_id');
    return this.db.many<any>(query);
  }

  private applyFilters(rows: any[], query: LopaFilterDto) {
    const today = new Date().toISOString().slice(0, 10);
    const q = String(query.q ?? '').toLowerCase().trim();
    return rows.filter((row) => {
      if (q && ![row.lopaNumber, row.title, row.hazopNumber, row.deviation, row.cause, row.consequenceSummary, row.equipmentTag, row.ownerName, row.facilitatorName].some((value) => String(value ?? '').toLowerCase().includes(q))) return false;
      if (query.status && row.status !== query.status) return false;
      if (query.source && row.source !== query.source) return false;
      if (query.siteId && row.siteId !== query.siteId) return false;
      if (query.unitId && row.unitId !== query.unitId) return false;
      if (query.areaId && row.areaId !== query.areaId) return false;
      if (query.ownerId && row.ownerId !== query.ownerId) return false;
      if (query.calculationStatus && row.calculationStatus !== query.calculationStatus) return false;
      if (query.iplValidationStatus && row.iplValidationStatus !== query.iplValidationStatus) return false;
      if (this.asBool(query.silRequired) && !row.silRequired) return false;
      if (this.asBool(query.overdue) && !(row.dueDate && row.dueDate < today && !['Approved', 'Closed', 'Cancelled'].includes(row.status))) return false;
      return true;
    });
  }

  private mapStudy(study: any) {
    return {
      id: study.id,
      lopaNumber: study.lopa_number,
      title: study.title,
      description: study.description,
      studyType: study.study_type,
      source: study.source,
      sourceModule: study.source_module,
      sourceRecordId: study.source_record_id,
      hazopScenarioId: study.source_hazop_scenario_id,
      siteId: study.site_id,
      unitId: study.unit_id,
      areaId: study.area_id,
      equipmentTag: study.equipment_tag,
      ownerId: study.owner_id,
      facilitatorId: study.facilitator_id,
      status: study.status,
      priority: study.priority,
      consequenceSeverity: study.consequence_severity,
      initiatingEventFrequency: study.initiating_event_frequency,
      iplCount: study.ipl_count,
      creditedIplCount: study.credited_ipl_count,
      calculationStatus: study.calculation_status,
      mitigatedEventFrequency: study.mitigated_event_frequency,
      tolerableFrequency: study.tolerable_frequency,
      riskGap: study.risk_gap,
      silRequired: study.sil_required,
      targetSil: study.target_sil,
      silGapStatus: study.sil_gap_status,
      iplValidationStatus: study.ipl_validation_status,
      openActions: study.open_actions_count,
      dueDate: study.due_date,
      revalidationDueDate: study.revalidation_due_date,
      tags: study.tags ?? [],
      createdAt: study.created_at,
      updatedAt: study.updated_at
    };
  }

  private async nextNumber(tenantId: string) {
    const year = new Date().getFullYear();
    const rows = await this.optionalMany('lopa_studies', (q) => q.select('lopa_number').eq('tenant_id', tenantId).ilike('lopa_number', `LOPA-${year}-%`));
    const next = rows.length + 1;
    return `LOPA-${year}-${String(next).padStart(5, '0')}`;
  }

  private async insertSourceSnapshot(tenantId: string, lopaStudyId: string, actorId: string, sourceModule: string, sourceRecordId: string, payload: any) {
    return this.db.single<any>(this.db.from('lopa_source_snapshots').insert({ id: crypto.randomUUID(), tenant_id: tenantId, lopa_study_id: lopaStudyId, source_module: sourceModule, source_record_id: sourceRecordId, source_payload: payload, created_by: actorId }).select().single());
  }

  private insertConsequence(tenantId: string, lopaStudyId: string, consequence?: any) {
    if (!consequence?.description) return null;
    return this.optionalSingle(this.db.from('lopa_consequences').insert({ id: crypto.randomUUID(), tenant_id: tenantId, lopa_study_id: lopaStudyId, description: consequence.description, category: consequence.category ?? null, severity: consequence.severity ?? null, impacted_receptor: consequence.impactedReceptor ?? null, tolerable_event_frequency: consequence.tolerableEventFrequency ?? null, risk_criteria_source: consequence.riskCriteriaSource ?? null, notes: consequence.notes ?? null }).select().single());
  }

  private insertInitiatingEvent(tenantId: string, lopaStudyId: string, event?: any) {
    if (!event?.description) return null;
    return this.optionalSingle(this.db.from('lopa_initiating_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, lopa_study_id: lopaStudyId, description: event.description, event_category: event.eventCategory ?? null, frequency_method: event.frequencyMethod ?? null, library_event: event.libraryEvent ?? null, frequency_per_year: event.frequencyPerYear ?? null, frequency_source: event.frequencySource ?? null, notes: event.notes ?? null }).select().single());
  }

  private async upsertConsequenceRow(tenantId: string, actorId: string, study: any, lopaStudyId: string, dto: UpdateLopaScenarioConsequenceDto) {
    const existing = await this.optionalSingle(this.db.from('lopa_consequences').select('id').eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId).limit(1).single());
    const payload = this.clean({
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      lopa_study_id: lopaStudyId,
      description: dto.consequenceDescription,
      category: dto.consequenceCategory,
      severity: dto.consequenceSeverity,
      impacted_receptor: dto.impactType,
      endpoint: dto.consequenceEndpoint,
      impact_type: dto.impactType,
      credible_worst_case: dto.credibleWorstCase,
      most_likely_consequence: dto.mostLikelyConsequence,
      consequence_basis: dto.consequenceBasis,
      consequence_source_reference: dto.consequenceSourceReference,
      personnel_impact: dto.personnelImpact,
      environmental_impact: dto.environmentalImpact,
      asset_impact: dto.assetImpact,
      community_impact: dto.communityImpact,
      regulatory_impact: dto.regulatoryImpact,
      tolerable_event_frequency: dto.tolerableEventFrequency,
      risk_criteria_source: dto.riskCriteriaSource,
      notes: dto.notes,
      completion_status: dto.reviewStatus === 'Complete' ? 'Complete' : 'In Progress',
      review_status: dto.reviewStatus,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    if (!Object.keys(payload).some((key) => !['tenant_id', 'company_id', 'site_id', 'lopa_study_id', 'updated_by', 'updated_at'].includes(key))) return existing;
    if (existing?.id) {
      return this.optionalSingle(this.db.from('lopa_consequences').update(payload).eq('tenant_id', tenantId).eq('id', existing.id).select().single());
    }
    return this.optionalSingle(this.db.from('lopa_consequences').insert({ id: crypto.randomUUID(), created_by: actorId, ...payload }).select().single());
  }

  private async insertRiskCriteriaSnapshot(tenantId: string, actorId: string, study: any, lopaStudyId: string, dto: UpdateLopaScenarioConsequenceDto) {
    return this.optionalSingle(this.db.from('lopa_risk_criteria_snapshots').insert(this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      lopa_study_id: lopaStudyId,
      criteria_source: dto.riskCriteriaSource,
      criteria_type: dto.criteriaType,
      tolerable_event_frequency: dto.tolerableEventFrequency,
      frequency_unit: 'per year',
      matrix_reference: dto.riskCriteriaSource,
      alarp_applicable: dto.alarpApplicable,
      risk_acceptance_required: dto.riskAcceptanceRequired,
      criteria_notes: dto.criteriaNotes,
      approval_status: dto.criteriaApprovalStatus ?? 'Draft',
      criteria_version: dto.criteriaVersion,
      selected_by: actorId
    })).select().single());
  }

  private latestRiskCriteria(tenantId: string, lopaStudyId: string) {
    return this.optionalSingle(this.db.from('lopa_risk_criteria_snapshots').select('*').eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId).order('created_at', { ascending: false }).limit(1).single());
  }

  private async upsertInitiatingEventRow(tenantId: string, actorId: string, study: any, lopaStudyId: string, dto: Partial<UpdateLopaInitiatingEventDto>) {
    const existing = await this.optionalSingle(this.db.from('lopa_initiating_events').select('id').eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId).limit(1).single());
    const payload = this.clean({
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      lopa_study_id: lopaStudyId,
      description: dto.description,
      event_category: dto.eventCategory,
      failure_mode: dto.failureMode,
      equipment_system: dto.equipmentSystem,
      equipment_tag: dto.equipmentTag,
      event_boundary: dto.eventBoundary,
      event_trigger: dto.eventTrigger,
      linked_consequence_id: dto.linkedConsequenceId,
      frequency_method: dto.eventSource,
      notes: dto.notes,
      completion_status: 'In Progress',
      updated_by: actorId,
      updated_at: new Date().toISOString()
    });
    if (existing?.id) {
      return this.optionalSingle(this.db.from('lopa_initiating_events').update(payload).eq('tenant_id', tenantId).eq('id', existing.id).select().single());
    }
    return this.optionalSingle(this.db.from('lopa_initiating_events').insert({ id: crypto.randomUUID(), created_by: actorId, ...payload }).select().single());
  }

  private async markNeedsRecalculationIfNeeded(tenantId: string, lopaStudyId: string, study: any, actorId: string) {
    if (!this.needsRecalculation(study)) return;
    await this.optionalSingle(this.db.from('lopa_studies').update({ calculation_status: 'Needs Recalculation', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', lopaStudyId).select('id').single());
  }

  private needsRecalculation(study: any) {
    return !!study?.calculation_status && !['Not Started', 'Incomplete', 'Needs Recalculation'].includes(study.calculation_status);
  }

  private combinedModifierFactors(modifiers: any[]) {
    const active = modifiers.filter((m) => m.status !== 'Archived');
    const factor = active.reduce((value, modifier) => value * Number(modifier.selected_value ?? modifier.default_value ?? 1), 1);
    const low = active.reduce((value, modifier) => value * Number(modifier.low_value ?? modifier.selected_value ?? modifier.default_value ?? 1), 1);
    const high = active.reduce((value, modifier) => value * Number(modifier.high_value ?? modifier.selected_value ?? modifier.default_value ?? 1), 1);
    return { factor, low, high };
  }

  private readinessFromChecks(checks: any[]) {
    const hardBlockers = checks.filter((check) => !check.complete && check.status !== 'Warning' && check.status !== 'Not Applicable');
    const warnings = checks.filter((check) => !check.complete && check.status === 'Warning');
    return {
      status: hardBlockers.length ? 'Blocked' : warnings.length ? 'Warning' : 'Ready',
      checklist: checks,
      blockers: hardBlockers.map((check) => ({ key: check.key, title: check.label, severity: 'Hard', status: 'Open' })),
      warnings: warnings.map((check) => ({ key: check.key, title: check.label, severity: 'Warning', status: 'Open' })),
      completionPercent: checks.length ? Math.round((checks.filter((check) => check.complete).length / checks.length) * 100) : 0
    };
  }

  private notesFor(table: string, tenantId: string, lopaStudyId: string, scope: Scope) {
    return this.studyRecord(tenantId, lopaStudyId, scope).then(() => this.optionalMany(table, (q) => q.select('*').eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId).neq('status', 'Archived').order('created_at', { ascending: false })));
  }

  private async createNote(table: string, tenantId: string, actorId: string, lopaStudyId: string, dto: LopaNoteDto, scope: Scope, eventType: string) {
    const study = await this.studyRecord(tenantId, lopaStudyId, scope);
    this.assertMutable(study);
    const note = await this.db.single<any>(this.db.from(table).insert(this.clean({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id ?? null,
      lopa_study_id: lopaStudyId,
      note_type: dto.noteType ?? 'General',
      note_text: dto.noteText,
      linked_section: dto.linkedSection,
      status: dto.status ?? 'Open',
      created_by: actorId,
      updated_by: actorId
    })).select().single());
    await this.writeHistory(tenantId, lopaStudyId, actorId, eventType, 'LOPA note created', dto.noteText, { noteId: note.id, table });
    await this.writeAudit(tenantId, actorId, `lopa.${table}.create`, 'LOPA', lopaStudyId, note as JsonValue);
    return note;
  }

  private async updateNote(table: string, tenantId: string, actorId: string, lopaStudyId: string, noteId: string, dto: LopaNoteDto, scope: Scope, eventType: string) {
    const study = await this.studyRecord(tenantId, lopaStudyId, scope);
    this.assertMutable(study);
    const note = await this.db.single<any>(this.db.from(table).update(this.clean({
      note_type: dto.noteType,
      note_text: dto.noteText,
      linked_section: dto.linkedSection,
      status: dto.status,
      updated_by: actorId,
      updated_at: new Date().toISOString()
    })).eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId).eq('id', noteId).select().single());
    await this.writeHistory(tenantId, lopaStudyId, actorId, eventType, 'LOPA note updated', dto.noteText, { noteId, table });
    await this.writeAudit(tenantId, actorId, `lopa.${table}.update`, 'LOPA', lopaStudyId, note as JsonValue);
    return note;
  }

  private async deleteNote(table: string, tenantId: string, actorId: string, lopaStudyId: string, noteId: string, scope: Scope, eventType: string) {
    const study = await this.studyRecord(tenantId, lopaStudyId, scope);
    this.assertMutable(study);
    await this.optionalSingle(this.db.from(table).update({ status: 'Archived', updated_by: actorId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('lopa_study_id', lopaStudyId).eq('id', noteId).select('id').single());
    await this.writeHistory(tenantId, lopaStudyId, actorId, eventType, 'LOPA note archived', 'A LOPA note was archived.', { noteId, table });
    await this.writeAudit(tenantId, actorId, `lopa.${table}.archive`, 'LOPA', lopaStudyId, { noteId });
    return { id: noteId, archived: true };
  }

  private async insertSafeguards(tenantId: string, lopaStudyId: string, safeguards: any[]) {
    if (!safeguards.length) return [];
    return this.optionalMany('lopa_imported_safeguards', (q) => q.insert(safeguards.map((s) => ({ id: crypto.randomUUID(), tenant_id: tenantId, lopa_study_id: lopaStudyId, source_safeguard_id: s.sourceSafeguardId ?? null, safeguard_name: s.safeguardName, safeguard_type: s.safeguardType ?? null, description: s.description ?? null, proposed_lopa_use: s.proposedLopaUse ?? 'IPL Candidate', credited_as_ipl: false, validation_status: 'Not Started', notes: s.notes ?? null }))).select());
  }

  private async insertTeam(tenantId: string, lopaStudyId: string, actorId: string, study: any, members: any[], ownerId?: string, facilitatorId?: string, sendInvitations = false, invitationMessage?: string, invitationDueDate?: string) {
    const users = await this.optionalMany('User', (q) => q.select('id,email,displayName,title,status,tenantId').eq('tenantId', tenantId).neq('status', 'INACTIVE'));
    const byId = (id?: string) => users.find((user) => user.id === id);
    const rows = [...(members ?? [])];
    if (ownerId && !rows.some((m) => m.userId === ownerId)) rows.push({ userId: ownerId, role: 'LOPA Owner', discipline: 'Process Safety', required: true, approver: true, invitationMode: sendInvitations ? 'now' : 'after_create', suggestionReasons: ['Study owner'] });
    if (facilitatorId && !rows.some((m) => m.userId === facilitatorId)) rows.push({ userId: facilitatorId, role: 'LOPA Facilitator', discipline: 'Process Safety', required: true, facilitator: true, invitationMode: sendInvitations ? 'now' : 'after_create', suggestionReasons: ['Selected facilitator'] });
    const seen = new Set<string>();
    const payload = rows.flatMap((m) => {
      const user = byId(m.userId);
      const email = m.email ?? user?.email;
      const key = m.userId ?? email;
      if (!key || seen.has(key)) return [];
      seen.add(key);
      const inviteNow = sendInvitations || m.invitationMode === 'now' || m.sendInvitationNow === true;
      const invitationRequired = m.invitationRequired ?? m.invitationMode !== 'add_only';
      return [this.clean({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: study.company_id,
        site_id: study.site_id,
        lopa_study_id: lopaStudyId,
        user_id: m.userId ?? null,
        contact_id: m.contactId ?? null,
        full_name: m.displayName ?? m.fullName ?? user?.displayName ?? email,
        email,
        organization: m.organization ?? 'Internal',
        internal_external: m.internalExternal ?? 'Internal',
        job_title: m.jobTitle ?? user?.title ?? null,
        department: m.department ?? null,
        discipline: m.discipline ?? 'Process Safety',
        study_role: m.role ?? m.studyRole ?? 'Reviewer',
        responsibility_description: m.responsibility ?? m.responsibilityDescription ?? (m.suggestionReasons ?? []).join('; ') ?? null,
        required_participant: m.required ?? m.requiredParticipant ?? false,
        voting_participant: m.votingParticipant ?? false,
        reviewer: m.reviewer ?? false,
        approver: m.approver ?? false,
        facilitator: m.facilitator ?? m.role === 'LOPA Facilitator',
        scribe: m.scribe ?? m.role === 'Scribe / Secretary',
        access_level: m.accessLevel ?? 'Comment',
        invitation_status: inviteNow ? 'Invited' : invitationRequired ? 'Not Invited' : 'Not Invited',
        participation_status: 'Active',
        invited_by: inviteNow ? actorId : null,
        invited_at: inviteNow ? new Date().toISOString() : null,
        response_status: inviteNow ? 'Pending' : null,
        invite_token: inviteNow ? crypto.randomUUID() : null,
        notes: JSON.stringify(this.clean({ suggestionReasons: m.suggestionReasons, suggestionSource: m.suggestionSource, invitationMessage: m.invitationMessage ?? invitationMessage, invitationDueDate })),
        created_by: actorId,
        updated_by: actorId
      })];
    });
    if (!payload.length) return [];
    const created = await this.optionalMany('lopa_study_team_members', (q) => q.insert(payload).select());
    const invited = created.filter((row) => row.invitation_status === 'Invited');
    if (invited.length) await this.writeHistory(tenantId, lopaStudyId, actorId, 'LOPA_TEAM_INVITATIONS_CREATED', 'LOPA team invitations prepared', `${invited.length} invitation(s) prepared during create.`, { count: invited.length });
    await this.updateTeamSessionStatus(tenantId, lopaStudyId, actorId).catch(() => null);
    return created;
  }

  private async markHazopScenarioLinked(tenantId: string, scenarioId: string, lopaId: string, lopaNumber: string) {
    await this.optionalSingle(this.db.from('hazop_scenarios').update({ lopa_status: 'LOPA In Progress', linked_lopa_id: lopaId, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', scenarioId).select('id').single());
    await this.optionalSingle(this.db.from('hazop_linked_records').insert({ id: crypto.randomUUID(), tenant_id: tenantId, study_id: null, linked_type: 'LOPA', linked_id: lopaId, linked_number: lopaNumber, relationship_type: 'LOPA required follow-up', created_at: new Date().toISOString() }).select('id').single());
  }

  private async writeHistory(tenantId: string, lopaStudyId: string, actorId: string, eventType: string, title: string, description: string, metadata: JsonValue = {}) {
    const study = await this.optionalSingle(this.db.from('lopa_studies').select('company_id,site_id').eq('tenant_id', tenantId).eq('id', lopaStudyId).single());
    const eventNumber = `HIST-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
    const integrityHash = this.stableHash({ tenantId, lopaStudyId, actorId, eventType, title, description, metadata, eventNumber });
    return this.optionalSingle(this.db.from('lopa_history_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, company_id: study?.company_id ?? null, site_id: study?.site_id ?? null, lopa_study_id: lopaStudyId, event_number: eventNumber, event_type: eventType, event_category: this.historyCategory(eventType), title, event_title: title, description, event_description: description, actor_id: actorId, actor_user_id: actorId, severity: 'Info', metadata, metadata_json: metadata, source_system: 'PSM OS', integrity_hash: integrityHash }).select().single());
  }

  private writeAudit(tenantId: string, actorId: string, action: string, entityType: string, entityId: string, after: JsonValue) {
    return this.audit.write({ tenantId, actorId, action, entityType, entityId, after }).catch(() => null);
  }

  private applyScope(query: any, scope: Scope, column = 'site_id') {
    if (scope.selectedSiteId) return query.eq(column, scope.selectedSiteId);
    if (!scope.corporateView && scope.allowedSiteIds?.length) return query.in(column, scope.allowedSiteIds);
    return query;
  }

  private assertSiteAllowed(siteId: string, scope: Scope) {
    if (scope.selectedSiteId && scope.selectedSiteId !== siteId) throw new ForbiddenException('Selected site does not match LOPA site.');
    if (!scope.corporateView && scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('You do not have access to this site.');
  }

  private async optionalMany(table: string, build: (query: ReturnType<SupabaseService['from']>) => any) {
    try {
      return await this.db.many<any>(build(this.db.from(table)));
    } catch {
      return [];
    }
  }

  private async optionalSingle(query: any) {
    try {
      return await this.db.single<any>(query);
    } catch {
      return null;
    }
  }

  private count(rows: any[], predicate: (row: any) => boolean) {
    return rows.filter(predicate).length;
  }

  private addDays(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private asBool(value: unknown) {
    return value === true || value === 'true' || value === '1';
  }

  private sorter(sort: string) {
    const [field, direction] = sort.split('.');
    const dir = direction === 'asc' ? 1 : -1;
    const key = field || 'updatedAt';
    return (a: any, b: any) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * dir;
  }

  private attentionRow(type: string, study: any, severity: string, action: string) {
    return { id: study.id, itemType: type, studyNumber: study.lopa_number, title: study.title, severity, owner: study.owner_id ?? 'Unassigned', dueDate: study.due_date, requiredAction: action, href: `/lopa/${study.id}` };
  }

  private lopaStatusLabel(status: string) {
    if (status === 'Draft') return 'Draft LOPA Exists';
    if (status === 'Approved') return 'LOPA Approved';
    if (status === 'Closed') return 'LOPA Closed';
    return 'LOPA In Progress';
  }

  private firstEquipmentTag(node: any, study: any) {
    const nodeEquipment = Array.isArray(node?.equipment_link_snapshots) ? node.equipment_link_snapshots : Array.isArray(node?.equipment_ids) ? node.equipment_ids : [];
    const studyEquipment = Array.isArray(study?.equipment_tags) ? study.equipment_tags : [];
    const first = nodeEquipment[0] ?? studyEquipment[0];
    return typeof first === 'string' ? first : first?.tag ?? first?.equipmentTag ?? null;
  }

  private clean<T extends Record<string, any>>(input: T) {
    return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as T;
  }
}
