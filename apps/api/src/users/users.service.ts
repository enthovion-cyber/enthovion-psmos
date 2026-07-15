import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue, UserRecord } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../permissions/permissions.service';
import { SearchIndexService } from '../search/search-index.service';
import { ApprovalDelegationDto } from './dto/approval-delegation.dto';
import { BulkImportUserRowDto } from './dto/bulk-import-users.dto';
import { ContractorAccessDto } from './dto/contractor-access.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRoleDto } from './dto/user-role.dto';
import { UserSiteAccessDto } from './dto/user-site-access.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly searchIndex: SearchIndexService,
    private readonly permissionService: PermissionsService
  ) {}

  findByEmail(email: string) {
    return this.db.single<UserRecord>(this.db.from('User').select('*').eq('email', email).maybeSingle());
  }

  async getProfile(userId: string) {
    const user = await this.db.single<any>(
      this.db.from('User')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
    );
    if (!user) throw new NotFoundException('User not found');
    const [tenant, profile] = await Promise.all([
      this.db.single<any>(this.db.from('Tenant').select('*').eq('id', user.tenantId).maybeSingle()).catch(() => null),
      this.db.single<any>(this.db.from('UserProfile').select('*').eq('userId', user.id).maybeSingle()).catch(() => null)
    ]);
    const [hydrated] = await this.hydrateUsers(user.tenantId, [{ ...user, tenant, profile }]);
    return this.withSeededRoleFallback(hydrated);
  }

  async list(tenantId: string) {
    const users = await this.db.many<any>(
      this.db.from('User')
        .select('id, tenantId, email, displayName, title, department, status, createdAt, updatedAt')
        .eq('tenantId', tenantId)
        .order('displayName')
    );
    const hydrated = await this.hydrateUsers(tenantId, users);
    return Promise.all(hydrated.map((user) => this.withSeededRoleFallback(user)));
  }

  async getById(tenantId: string, id: string) {
    const user = await this.db.single<any>(
      this.db.from('User')
        .select('id, tenantId, email, displayName, title, department, status, createdAt, updatedAt')
        .eq('tenantId', tenantId)
        .eq('id', id)
        .maybeSingle()
    );
    if (!user) throw new NotFoundException('User not found');
    const [hydrated] = await this.hydrateUsers(tenantId, [user]);
    return this.withSeededRoleFallback(hydrated);
  }

  async create(tenantId: string, actorId: string, dto: CreateUserDto) {
    const existing = await this.findByEmail(dto.email.toLowerCase());
    if (existing) throw new BadRequestException('A user with this email already exists');
    const defaults = await this.resolveUserCreateDefaults(tenantId, dto);
    const roleIds = await this.resolveRoleIds(tenantId, dto.roleIds?.length ? dto.roleIds : defaults.roleIds);
    const companyIds = dto.companyIds?.length ? dto.companyIds : defaults.companyIds;
    const siteIds = dto.siteIds?.length ? dto.siteIds : defaults.siteIds;
    if (!roleIds.length) throw new BadRequestException('No roles are configured for this tenant. Create a role before adding users.');
    if (!companyIds.length && !siteIds.length) throw new BadRequestException('No company or site is configured for this tenant. Create tenant hierarchy before adding users.');
    const password = dto.password ?? generatePassword();
    const user = await this.db.single<any>(
      this.db.from('User').insert({
        id: crypto.randomUUID(),
        tenantId,
        email: dto.email.toLowerCase(),
        passwordHash: await hash(password, 10),
        displayName: dto.displayName ?? dto.fullName,
        title: dto.title ?? null,
        department: dto.department ?? null,
        status: 'ACTIVE',
        updatedAt: new Date().toISOString()
      }).select('id, tenantId, email, displayName, title, department, status, createdAt, updatedAt').single()
    );
    await this.upsertUserProfile(user.id, dto);
    for (const roleId of roleIds) {
      await this.assignRole(tenantId, actorId, user.id, {
        roleId,
        ...(companyIds[0] ? { companyId: companyIds[0] } : {}),
        ...(siteIds[0] ? { siteId: siteIds[0] } : {}),
        scopeType: siteIds[0] ? 'SITE' : companyIds[0] ? 'COMPANY' : 'TENANT'
      });
    }
    for (const siteId of siteIds) {
      await this.assignSiteAccess(tenantId, actorId, user.id, {
        siteId,
        ...(companyIds[0] ? { companyId: companyIds[0] } : {}),
        ...(dto.unitIds?.[0] ? { unitId: dto.unitIds[0] } : {}),
        ...(dto.areaIds?.[0] ? { areaId: dto.areaIds[0] } : {})
      });
    }
    if (dto.contractorCompanyId) await this.assignContractorAccess(tenantId, actorId, user.id, { contractorCompanyId: dto.contractorCompanyId });
    if (dto.permissionKeys?.length) await this.assignPermissionOverrides(tenantId, actorId, user.id, dto.permissionKeys, companyIds[0], siteIds[0]);
    await this.markSessionsStale(user.id);
    await this.audit.write({ tenantId, actorId, action: 'USER_CREATED', entityType: 'User', entityId: user.id, after: user as JsonValue });
    if (!dto.password && dto.authMethod === 'generated_password') {
      await this.audit.write({ tenantId, actorId, action: 'USER_TEMP_PASSWORD_GENERATED', entityType: 'User', entityId: user.id, after: { forcePasswordChange: dto.forcePasswordChange ?? true } });
    }
    await this.searchIndex.reindexModule(tenantId, 'users');
    return { ...user, temporaryPassword: dto.authMethod === 'generated_password' ? password : undefined, shownOnce: dto.authMethod === 'generated_password' };
  }

  async invite(tenantId: string, actorId: string, dto: InviteUserDto) {
    const existing = await this.findByEmail(dto.email.toLowerCase());
    if (existing) throw new BadRequestException('A user with this email already exists');
    const token = crypto.randomUUID();
    const invitation = await this.db.single<any>(
      this.db.from('Invitation').insert({
        id: crypto.randomUUID(),
        tenantId,
        email: dto.email.toLowerCase(),
        companyId: dto.companyId ?? null,
        siteId: dto.siteId ?? null,
        roleId: dto.roleId ?? null,
        tokenHash: tokenHash(token),
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invitedById: actorId,
        updatedAt: new Date().toISOString()
      }).select().single()
    );
    await this.audit.write({ tenantId, actorId, action: 'USER_INVITED', entityType: 'Invitation', entityId: invitation.id, after: { ...invitation, tokenHash: '[redacted]' } as JsonValue });
    await this.notifications.notifyUser({ tenantId, userId: actorId, siteId: dto.siteId ?? null, type: 'iam.user.invited', module: 'iam', title: 'User invited', message: `${dto.email.toLowerCase()} was invited to PSM OS.`, relatedRecordId: invitation.id, relatedRecordType: 'Invitation', relatedUrl: '/settings/users', priority: 'Info' });
    return { ...invitation, token, tokenHash: undefined };
  }

  async acceptInvitation(token: string, displayName: string, password: string) {
    const invitation = await this.db.single<any>(
      this.db.from('Invitation').select('*').eq('tokenHash', tokenHash(token)).eq('status', 'PENDING').maybeSingle()
    );
    if (!invitation) throw new BadRequestException('Invitation is invalid or already accepted');
    if (new Date(invitation.expiresAt).getTime() < Date.now()) throw new BadRequestException('Invitation has expired');
    const actorId = invitation.invitedById ?? 'system';
    const user = await this.create(invitation.tenantId, actorId, {
      email: invitation.email,
      displayName,
      password,
      authMethod: 'invite',
      roleIds: invitation.roleId ? [invitation.roleId] : undefined,
      companyIds: invitation.companyId ? [invitation.companyId] : undefined,
      siteIds: invitation.siteId ? [invitation.siteId] : undefined
    } as CreateUserDto);
    if (invitation.roleId) await this.assignRole(invitation.tenantId, actorId, user.id, { roleId: invitation.roleId, companyId: invitation.companyId ?? undefined, siteId: invitation.siteId ?? undefined });
    if (invitation.siteId) await this.assignSiteAccess(invitation.tenantId, actorId, user.id, { siteId: invitation.siteId, companyId: invitation.companyId ?? undefined });
    await this.db.single(this.db.from('Invitation').update({ status: 'ACCEPTED', acceptedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).eq('id', invitation.id).select().single());
    return user;
  }

  async update(tenantId: string, actorId: string, id: string, dto: UpdateUserDto) {
    const before = await this.getById(tenantId, id);
    const user = await this.db.single<any>(
      this.db.from('User')
        .update({ ...dto, updatedAt: new Date().toISOString() })
        .eq('tenantId', tenantId)
        .eq('id', id)
        .select('id, tenantId, email, displayName, title, department, status, createdAt, updatedAt')
        .single()
    );
    await this.upsertUserProfile(id, dto as CreateUserDto);
    await this.markSessionsStale(id);
    await this.audit.write({ tenantId, actorId, action: 'USER_UPDATED', entityType: 'User', entityId: id, before: before as JsonValue, after: user as JsonValue });
    await this.searchIndex.reindexModule(tenantId, 'users');
    return user;
  }

  async updateOwnProfile(tenantId: string, actorId: string, dto: UpdateProfileDto) {
    const before = await this.getProfile(actorId);
    const userPatch: Record<string, unknown> = {};
    if (dto.displayName !== undefined) userPatch.displayName = dto.displayName;
    if (dto.title !== undefined) userPatch.title = dto.title;
    if (dto.department !== undefined) userPatch.department = dto.department;
    if (Object.keys(userPatch).length) {
      await this.db.single(
        this.db.from('User')
          .update({ ...userPatch, updatedAt: new Date().toISOString() })
          .eq('tenantId', tenantId)
          .eq('id', actorId)
          .select()
          .single()
      );
    }

    const profilePatch = {
      userId: actorId,
      avatarUrl: dto.avatarUrl ?? before.profile?.avatarUrl ?? null,
      phone: dto.phone ?? before.profile?.phone ?? null,
      mobile: dto.mobile ?? before.profile?.mobile ?? null,
      timezone: dto.timezone ?? before.profile?.timezone ?? null,
      locale: dto.locale ?? before.profile?.locale ?? null,
      bio: dto.bio ?? before.profile?.bio ?? null,
      metadata: dto.metadata ?? before.profile?.metadata ?? null,
      updatedAt: new Date().toISOString()
    };
    const existingProfile = await this.db.single<any>(
      this.db.from('UserProfile').select('userId').eq('userId', actorId).maybeSingle()
    );
    try {
      if (existingProfile) {
        await this.db.single(this.db.from('UserProfile').update(profilePatch).eq('userId', actorId).select().single());
      } else {
        await this.db.single(this.db.from('UserProfile').insert(profilePatch).select().single());
      }
    } catch {
      const basicPatch = stripUndefined({
        userId: actorId,
        avatarUrl: dto.avatarUrl ?? before.profile?.avatarUrl ?? null,
        phone: dto.phone ?? before.profile?.phone ?? null,
        updatedAt: new Date().toISOString()
      });
      if (existingProfile) {
        await this.db.single(this.db.from('UserProfile').update(basicPatch).eq('userId', actorId).select().single());
      } else {
        await this.db.single(this.db.from('UserProfile').insert(basicPatch).select().single());
      }
    }
    const after = await this.getProfile(actorId);
    await this.audit.write({ tenantId, actorId, action: 'USER_PROFILE_UPDATED', entityType: 'User', entityId: actorId, before: before as JsonValue, after: after as JsonValue });
    return after;
  }

  async profileInvitations(tenantId: string, actorId: string) {
    const actor = await this.db.single<any>(this.db.from('User').select('id,email,tenantId').eq('tenantId', tenantId).eq('id', actorId).maybeSingle());
    if (!actor) throw new NotFoundException('User not found');
    const email = String(actor.email ?? '').toLowerCase();
    await this.backfillHazopTeamInvitationsForUser(tenantId, actorId, email);
    await this.backfillIncidentTeamInvitationsForUser(tenantId, actorId, email);
    let query = this.db.from('hazop_team_invitations').select('*').eq('tenant_id', tenantId);
    query = email ? query.or(`invited_user_id.eq.${actorId},invited_email.eq.${email}`) : query.eq('invited_user_id', actorId);
    const invitations = await this.db.many<any>(query.order('created_at', { ascending: false }));
    const incidentMembers = await this.incidentInvitationMembersForActor(tenantId, actorId, email);
    const incidentMemberIds = incidentMembers.map((member) => member.id).filter(Boolean);
    const incidentInvitations = incidentMemberIds.length
      ? await this.db.many<any>(
        this.db.from('incident_team_notifications')
          .select('*')
          .eq('tenant_id', tenantId)
          .in('member_id', incidentMemberIds)
          .eq('notification_type', 'Assignment Invitation')
          .order('sent_at', { ascending: false })
      ).catch(() => [])
      : [];
    const now = Date.now();
    const expired = invitations.filter((row) => row.status === 'Pending' && new Date(row.expires_at).getTime() < now);
    await Promise.all(expired.map((row) => this.db.single(
      this.db.from('hazop_team_invitations')
        .update({ status: 'Expired', updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .eq('id', row.id)
        .select()
        .single()
    ).catch(() => null)));

    const studyIds = [...new Set(invitations.map((row) => row.study_id).filter(Boolean))];
    const memberIds = [...new Set(invitations.map((row) => row.team_member_id).filter(Boolean))];
    const inviterIds = [...new Set(invitations.map((row) => row.invited_by).filter(Boolean))];
    const [studies, members, inviters] = await Promise.all([
      studyIds.length ? this.db.many<any>(this.db.from('hazop_studies').select('id,study_number,title,status,site_id,company_id').eq('tenant_id', tenantId).in('id', studyIds)).catch(() => []) : [],
      memberIds.length ? this.db.many<any>(this.db.from('hazop_study_team_members').select('*').eq('tenant_id', tenantId).in('id', memberIds)).catch(() => []) : [],
      inviterIds.length ? this.db.many<any>(this.db.from('User').select('id,displayName,email,title').eq('tenantId', tenantId).in('id', inviterIds)).catch(() => []) : []
    ]);
    const studyById = new Map(studies.map((study) => [study.id, study]));
    const memberById = new Map(members.map((member) => [member.id, member]));
    const inviterById = new Map(inviters.map((inviter) => [inviter.id, inviter]));
    const hazopRows = invitations.map((row) => {
      const isExpired = row.status === 'Pending' && new Date(row.expires_at).getTime() < now;
      const member = memberById.get(row.team_member_id) ?? {};
      const study = studyById.get(row.study_id) ?? {};
      return {
        ...row,
        status: isExpired ? 'Expired' : row.status,
        expired: isExpired,
        study,
        teamMember: member,
        invitedBy: inviterById.get(row.invited_by) ?? null,
        studyNumber: study.study_number ?? row.metadata?.studyNumber ?? null,
        studyTitle: study.title ?? row.metadata?.studyTitle ?? null,
        studyRole: row.study_role ?? member.study_role ?? member.role ?? null,
        discipline: row.discipline ?? member.discipline ?? null,
        requiredAttendance: Boolean(row.required_attendance ?? member.required_attendance ?? member.required),
        signoffRequired: Boolean(row.signoff_required ?? member.signoff_required),
        expiresAt: row.expires_at
      };
    });
    const incidentRows = await this.decorateIncidentProfileInvitations(tenantId, incidentInvitations, incidentMembers);
    return [...hazopRows, ...incidentRows].sort((a, b) => new Date(b.created_at ?? b.sent_at ?? 0).getTime() - new Date(a.created_at ?? a.sent_at ?? 0).getTime());
  }

  async acceptProfileInvitation(tenantId: string, actorId: string, invitationId: string) {
    const { invitation, actor, source } = await this.invitationForActor(tenantId, actorId, invitationId);
    if (source === 'incident') return this.acceptIncidentProfileInvitation(tenantId, actorId, actor, invitation);
    if (invitation.status !== 'Pending') throw new BadRequestException(`Invitation is ${invitation.status}`);
    if (new Date(invitation.expires_at).getTime() < Date.now()) {
      await this.expireHazopInvitation(tenantId, invitation.id);
      throw new BadRequestException('Invitation has expired');
    }
    const now = new Date().toISOString();
    const [updated, teamMember, study] = await Promise.all([
      this.db.single<any>(this.db.from('hazop_team_invitations').update({ status: 'Accepted', responded_at: now, updated_at: now }).eq('tenant_id', tenantId).eq('id', invitation.id).select().single()),
      this.db.single<any>(this.db.from('hazop_study_team_members').update({ status: 'Active', user_id: actorId, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', invitation.team_member_id).select().single()),
      this.db.single<any>(this.db.from('hazop_studies').select('*').eq('tenant_id', tenantId).eq('id', invitation.study_id).maybeSingle())
    ]);
    await this.db.single(this.db.from('hazop_study_access').upsert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: invitation.company_id ?? study?.company_id ?? null,
      site_id: invitation.site_id ?? study?.site_id ?? null,
      study_id: invitation.study_id,
      team_member_id: invitation.team_member_id,
      user_id: actorId,
      study_role: invitation.study_role ?? teamMember.study_role ?? teamMember.role ?? null,
      permission_level: invitation.permission_level ?? teamMember.permission_level ?? 'Comment',
      access_status: 'Active',
      granted_by: invitation.invited_by ?? actorId,
      granted_at: now,
      updated_at: now
    }, { onConflict: 'tenant_id,study_id,user_id' }).select().single());
    await this.writeHazopInvitationHistory(tenantId, actorId, study, updated, 'TEAM_INVITATION_ACCEPTED', `${actor.displayName ?? actor.email} accepted HAZOP team invitation`);
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_TEAM_INVITATION_ACCEPTED', entityType: 'hazop_team_invitations', entityId: invitation.id, before: invitation as JsonValue, after: updated as JsonValue });
    await this.notifyHazopLeader(tenantId, study, actorId, 'HAZOP team invitation accepted', `${actor.displayName ?? actor.email} accepted the invitation for ${study?.study_number ?? 'HAZOP study'}.`, invitation.id);
    return { invitation: updated, teamMember };
  }

  async declineProfileInvitation(tenantId: string, actorId: string, invitationId: string, reason?: string) {
    const { invitation, actor, source } = await this.invitationForActor(tenantId, actorId, invitationId);
    if (source === 'incident') return this.declineIncidentProfileInvitation(tenantId, actorId, actor, invitation, reason);
    if (invitation.status !== 'Pending') throw new BadRequestException(`Invitation is ${invitation.status}`);
    if (new Date(invitation.expires_at).getTime() < Date.now()) {
      await this.expireHazopInvitation(tenantId, invitation.id);
      throw new BadRequestException('Invitation has expired');
    }
    const now = new Date().toISOString();
    const [updated, teamMember, study] = await Promise.all([
      this.db.single<any>(this.db.from('hazop_team_invitations').update({ status: 'Declined', responded_at: now, decline_reason: reason ?? null, updated_at: now }).eq('tenant_id', tenantId).eq('id', invitation.id).select().single()),
      this.db.single<any>(this.db.from('hazop_study_team_members').update({ status: 'Declined', notes: reason ?? null, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', invitation.team_member_id).select().single()),
      this.db.single<any>(this.db.from('hazop_studies').select('*').eq('tenant_id', tenantId).eq('id', invitation.study_id).maybeSingle())
    ]);
    await this.writeHazopInvitationHistory(tenantId, actorId, study, updated, 'TEAM_INVITATION_DECLINED', `${actor.displayName ?? actor.email} declined HAZOP team invitation`, reason);
    await this.audit.write({ tenantId, actorId, action: 'HAZOP_TEAM_INVITATION_DECLINED', entityType: 'hazop_team_invitations', entityId: invitation.id, before: invitation as JsonValue, after: updated as JsonValue });
    await this.notifyHazopLeader(tenantId, study, actorId, 'HAZOP team invitation declined', `${actor.displayName ?? actor.email} declined the invitation for ${study?.study_number ?? 'HAZOP study'}.`, invitation.id);
    return { invitation: updated, teamMember };
  }

  async createPasswordReset(email: string) {
    const user = await this.findByEmail(email.toLowerCase());
    if (!user || user.status !== 'ACTIVE') return { success: true };
    const token = crypto.randomUUID();
    const reset = await this.db.single<any>(
      this.db.from('PasswordResetToken').insert({
        id: crypto.randomUUID(),
        tenantId: user.tenantId,
        userId: user.id,
        tokenHash: tokenHash(token),
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }).select().single()
    );
    await this.audit.write({ tenantId: user.tenantId, actorId: user.id, action: 'PASSWORD_RESET_REQUESTED', entityType: 'User', entityId: user.id, after: { resetId: reset.id } });
    await this.notifications.notifyUser({ tenantId: user.tenantId, userId: user.id, type: 'iam.password.reset', module: 'iam', title: 'Password reset requested', message: 'A password reset was requested for your account.', relatedRecordId: user.id, relatedRecordType: 'User', relatedUrl: '/profile', priority: 'High' });
    return { success: true, resetToken: token };
  }

  async resetPassword(token: string, password: string) {
    const reset = await this.db.single<any>(
      this.db.from('PasswordResetToken').select('*').eq('tokenHash', tokenHash(token)).eq('status', 'PENDING').maybeSingle()
    );
    if (!reset) throw new BadRequestException('Password reset token is invalid or already used');
    if (new Date(reset.expiresAt).getTime() < Date.now()) throw new BadRequestException('Password reset token has expired');
    await this.db.single(
      this.db.from('User')
        .update({ passwordHash: await hash(password, 10), updatedAt: new Date().toISOString() })
        .eq('id', reset.userId)
        .eq('tenantId', reset.tenantId)
        .select()
        .single()
    );
    await this.db.single(
      this.db.from('PasswordResetToken')
        .update({ status: 'USED', usedAt: new Date().toISOString() })
        .eq('id', reset.id)
        .select()
        .single()
    );
    await this.audit.write({ tenantId: reset.tenantId, actorId: reset.userId, action: 'PASSWORD_RESET_COMPLETED', entityType: 'User', entityId: reset.userId, after: { resetId: reset.id } });
    return { success: true };
  }

  async bulkImport(tenantId: string, actorId: string, rows: BulkImportUserRowDto[]) {
    const results = [];
    for (const row of rows) {
      try {
        const user = await this.create(tenantId, actorId, row);
        if (row.roleId) await this.assignRole(tenantId, actorId, user.id, { roleId: row.roleId });
        if (row.siteId) await this.assignSiteAccess(tenantId, actorId, user.id, { siteId: row.siteId });
        results.push({ email: row.email, status: 'CREATED', userId: user.id });
      } catch (error) {
        results.push({ email: row.email, status: 'FAILED', error: error instanceof Error ? error.message : 'Import failed' });
      }
    }
    await this.audit.write({ tenantId, actorId, action: 'USERS_BULK_IMPORTED', entityType: 'User', after: results as JsonValue });
    return { total: rows.length, created: results.filter((result) => result.status === 'CREATED').length, failed: results.filter((result) => result.status === 'FAILED').length, results };
  }

  bulkTemplate() {
    const columns = ['full_name', 'work_email', 'personal_email', 'phone', 'employee_id', 'job_title', 'department', 'employer_type', 'contractor_company', 'company', 'sites', 'units', 'areas', 'roles', 'module_permissions', 'send_invite_to', 'generate_password', 'force_password_change', 'active'];
    return { fileName: 'psm-os-user-import-template.csv', contentType: 'text/csv', columns, csv: `${columns.join(',')}\n` };
  }

  async createBulkJob(tenantId: string, actorId: string, dto: { fileName?: string; users: BulkImportUserRowDto[] }) {
    const job = await this.insertBulkJob(tenantId, actorId, dto.fileName ?? 'admin-upload.csv', dto.users);
    await this.audit.write({ tenantId, actorId, action: 'USER_BULK_IMPORT_UPLOADED', entityType: 'UserBulkImportJob', entityId: job.id, after: job as JsonValue });
    return this.validateBulkJob(tenantId, actorId, job.id);
  }

  async getBulkJob(tenantId: string, jobId: string) {
    const job = await this.db.single<any>(this.db.from('UserBulkImportJob').select('*').eq('tenantId', tenantId).eq('id', jobId).maybeSingle());
    if (!job) throw new NotFoundException('Bulk import job not found');
    const rows = await this.db.many<any>(this.db.from('UserBulkImportRow').select('*').eq('jobId', jobId).order('rowNumber'));
    return { ...job, rows };
  }

  async validateBulkJob(tenantId: string, actorId: string, jobId: string) {
    const job = await this.getBulkJob(tenantId, jobId);
    const roles = await this.db.many<any>(this.db.from('Role').select('id,key,name').eq('tenantId', tenantId));
    const roleLookup = new Set(roles.flatMap((role) => [role.id, role.key, role.name].filter(Boolean)));
    let validRows = 0;
    let errorRows = 0;
    const seen = new Set<string>();
    for (const row of job.rows) {
      const data = row.normalizedData ?? row.rawData ?? {};
      const errors: string[] = [];
      const email = String(data.email ?? data.work_email ?? '').toLowerCase();
      if (!email.includes('@')) errors.push('Valid work_email is required');
      if (seen.has(email)) errors.push('Duplicate email in file');
      seen.add(email);
      const existing = email ? await this.findByEmail(email) : null;
      if (existing) errors.push('Email already exists');
      const roleNames = String(data.roles ?? data.roleId ?? '').split(/[|;]/).map((value) => value.trim()).filter(Boolean);
      if (!roleNames.length) errors.push('At least one role is required');
      for (const roleName of roleNames) if (!roleLookup.has(roleName)) errors.push(`Invalid role: ${roleName}`);
      const status = errors.length ? 'Validation Failed' : 'Ready';
      if (errors.length) errorRows += 1;
      else validRows += 1;
      await this.db.single(this.db.from('UserBulkImportRow').update({ validationStatus: status, validationErrors: errors, updatedAt: new Date().toISOString() }).eq('id', row.id).select().single());
    }
    await this.db.single(this.db.from('UserBulkImportJob').update({ status: errorRows ? 'Validation Failed' : 'Ready To Import', totalRows: job.rows.length, validRows, errorRows, updatedAt: new Date().toISOString() }).eq('id', jobId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'USER_BULK_IMPORT_VALIDATED', entityType: 'UserBulkImportJob', entityId: jobId, after: { validRows, errorRows } });
    return this.getBulkJob(tenantId, jobId);
  }

  async importBulkJob(tenantId: string, actorId: string, jobId: string) {
    const job = await this.getBulkJob(tenantId, jobId);
    const roleRows = await this.db.many<any>(this.db.from('Role').select('id,key,name').eq('tenantId', tenantId));
    const roleByName = new Map(roleRows.flatMap((role) => [[role.id, role.id], [role.key, role.id], [role.name, role.id]]));
    let created = 0;
    let skipped = 0;
    for (const row of job.rows) {
      if (row.validationStatus !== 'Ready') {
        skipped += 1;
        continue;
      }
      const data = row.normalizedData ?? row.rawData ?? {};
      const roleIds = String(data.roles ?? data.roleId ?? '').split(/[|;]/).map((value) => roleByName.get(value.trim())).filter(Boolean) as string[];
      const user = await this.create(tenantId, actorId, {
        email: String(data.email ?? data.work_email).toLowerCase(),
        personalEmail: data.personal_email,
        displayName: data.displayName ?? data.full_name,
        title: data.title ?? data.job_title,
        department: data.department,
        employeeId: data.employee_id,
        phone: data.phone,
        employerType: data.employer_type,
        roleIds,
        companyIds: String(data.company ?? '').split(/[|;]/).filter(Boolean),
        siteIds: String(data.sites ?? data.siteId ?? '').split(/[|;]/).filter(Boolean),
        authMethod: data.generate_password ? 'generated_password' : 'invite',
        forcePasswordChange: data.force_password_change !== false
      } as CreateUserDto);
      created += 1;
      await this.db.single(this.db.from('UserBulkImportRow').update({ validationStatus: 'Imported', createdUserId: user.id, updatedAt: new Date().toISOString() }).eq('id', row.id).select().single());
    }
    await this.db.single(this.db.from('UserBulkImportJob').update({ status: skipped ? 'Completed With Errors' : 'Completed', createdUsersCount: created, skippedUsersCount: skipped, updatedAt: new Date().toISOString() }).eq('id', jobId).select().single());
    await this.audit.write({ tenantId, actorId, action: 'USER_BULK_IMPORT_COMPLETED', entityType: 'UserBulkImportJob', entityId: jobId, after: { created, skipped } });
    return this.getBulkJob(tenantId, jobId);
  }

  async exportUsers(tenantId: string) {
    const users = await this.list(tenantId);
    const columns = [
      'id',
      'displayName',
      'email',
      'title',
      'department',
      'status',
      'roles',
      'sites',
      'createdAt',
      'updatedAt'
    ];
    const rows = users.map((user: any) => [
      user.id,
      user.displayName,
      user.email,
      user.title ?? '',
      user.department ?? '',
      user.status,
      (user.userRoles ?? []).map((assignment: any) => assignment.role?.name).filter(Boolean).join('|'),
      (user.userSites ?? []).map((access: any) => access.site?.name).filter(Boolean).join('|'),
      user.createdAt ?? '',
      user.updatedAt ?? ''
    ]);
    return {
      fileName: `admin-users-${new Date().toISOString().slice(0, 10)}.csv`,
      contentType: 'text/csv',
      csv: [columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
    };
  }

  async userAudit(tenantId: string, targetUserId: string) {
    await this.getByIdIncludingArchived(tenantId, targetUserId);
    const rows = await this.db.many<any>(
      this.db.from('AuditLog')
        .select('*')
        .eq('tenantId', tenantId)
        .eq('entityType', 'User')
        .eq('entityId', targetUserId)
        .order('createdAt', { ascending: false })
    ).catch(() => []);
    const invitationRows = await this.db.many<any>(
      this.db.from('AuditLog')
        .select('*')
        .eq('tenantId', tenantId)
        .eq('entityType', 'Invitation')
        .order('createdAt', { ascending: false })
    ).catch(() => []);
    return [...rows, ...invitationRows.filter((row) => row.after?.email || row.metadata?.targetUserId === targetUserId)]
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }

  async bulkErrorReport(tenantId: string, jobId: string) {
    const job = await this.getBulkJob(tenantId, jobId);
    const rows = (job.rows ?? []).filter((row: any) => (row.validationErrors ?? []).length || String(row.validationStatus ?? '').toLowerCase().includes('fail'));
    const columns = ['rowNumber', 'email', 'validationStatus', 'validationErrors'];
    const csv = [columns, ...rows.map((row: any) => {
      const data = row.normalizedData ?? row.rawData ?? {};
      return [row.rowNumber, data.email ?? data.work_email ?? '', row.validationStatus ?? '', (row.validationErrors ?? []).join('; ')];
    })].map((row) => row.map(csvCell).join(',')).join('\n');
    return { jobId, fileName: `user-bulk-import-errors-${jobId}.csv`, contentType: 'text/csv', csv, rows };
  }

  async addPermissionOverride(
    tenantId: string,
    actorId: string,
    userId: string,
    dto: { permissionKeys?: string[]; permissionKey?: string; effect?: 'allow' | 'deny'; companyId?: string; siteId?: string; reason?: string }
  ) {
    await this.getById(tenantId, userId);
    const permissionKeys = dto.permissionKeys?.length ? dto.permissionKeys : dto.permissionKey ? [dto.permissionKey] : [];
    if (!permissionKeys.length) throw new BadRequestException('At least one permission key is required');
    await this.insertPermissionOverrides(tenantId, actorId, userId, permissionKeys, dto.effect ?? 'allow', dto.companyId, dto.siteId);
    await this.markSessionsStale(userId);
    await this.audit.write({
      tenantId,
      actorId,
      action: 'USER_PERMISSION_OVERRIDE_ADDED',
      entityType: 'User',
      entityId: userId,
      after: { permissionKeys, effect: dto.effect ?? 'allow', companyId: dto.companyId ?? null, siteId: dto.siteId ?? null, reason: dto.reason ?? null }
    });
    return this.permissionService.effectiveForUser(userId, tenantId);
  }

  async removePermissionOverride(tenantId: string, actorId: string, userId: string, overrideId: string) {
    await this.getById(tenantId, userId);
    const removed = await this.db.single<any>(
      this.db.from('UserPermissionOverride')
        .delete()
        .eq('tenantId', tenantId)
        .eq('userId', userId)
        .eq('id', overrideId)
        .select()
        .maybeSingle()
    );
    await this.markSessionsStale(userId);
    await this.audit.write({ tenantId, actorId, action: 'USER_PERMISSION_OVERRIDE_REMOVED', entityType: 'User', entityId: userId, after: { overrideId, removed } });
    return this.permissionService.effectiveForUser(userId, tenantId);
  }

  async updateAccessScope(
    tenantId: string,
    actorId: string,
    userId: string,
    dto: { companyIds?: string[]; siteIds?: string[]; unitIds?: string[]; areaIds?: string[]; replace?: boolean }
  ) {
    await this.getById(tenantId, userId);
    if (dto.replace) {
      await Promise.all([
        this.db.many(this.db.from('UserSite').delete().eq('userId', userId).select()).catch(() => []),
        this.db.many(this.db.from('UserUnitAccess').delete().eq('tenantId', tenantId).eq('userId', userId).select()).catch(() => []),
        this.db.many(this.db.from('UserAreaAccess').delete().eq('tenantId', tenantId).eq('userId', userId).select()).catch(() => [])
      ]);
    }
    const siteIds = dto.siteIds ?? [];
    for (const siteId of siteIds) {
      const site = await this.db.single<any>(this.db.from('Site').select('id,companyId').eq('tenantId', tenantId).eq('id', siteId).maybeSingle());
      if (!site) throw new NotFoundException(`Site not found: ${siteId}`);
      await this.upsertUserSite(userId, siteId, site.companyId ?? dto.companyIds?.[0] ?? null);
    }
    for (const unitId of dto.unitIds ?? []) {
      await this.db.single(this.db.from('UserUnitAccess').upsert({
        id: crypto.randomUUID(),
        tenantId,
        userId,
        unitId,
        accessLevel: 'Member',
        updatedAt: new Date().toISOString()
      }, { onConflict: 'tenantId,userId,unitId' }).select().single()).catch(() => null);
    }
    for (const areaId of dto.areaIds ?? []) {
      await this.db.single(this.db.from('UserAreaAccess').upsert({
        id: crypto.randomUUID(),
        tenantId,
        userId,
        areaId,
        accessLevel: 'Member',
        updatedAt: new Date().toISOString()
      }, { onConflict: 'tenantId,userId,areaId' }).select().single()).catch(() => null);
    }
    await this.markSessionsStale(userId);
    await this.audit.write({ tenantId, actorId, action: 'USER_ACCESS_SCOPE_UPDATED', entityType: 'User', entityId: userId, after: dto as JsonValue });
    return this.getById(tenantId, userId);
  }

  inviteExistingUser(tenantId: string, actorId: string, userId: string) {
    return this.resendInvite(tenantId, actorId, userId);
  }

  async resendInvitationById(tenantId: string, actorId: string, invitationId: string) {
    const invitation = await this.db.single<any>(this.db.from('Invitation').select('*').eq('tenantId', tenantId).eq('id', invitationId).maybeSingle());
    if (!invitation) throw new NotFoundException('Invitation not found');
    const token = crypto.randomUUID();
    const updated = await this.db.single<any>(
      this.db.from('Invitation')
        .update({ tokenHash: tokenHash(token), status: 'PENDING', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), invitedById: actorId, updatedAt: new Date().toISOString() })
        .eq('tenantId', tenantId)
        .eq('id', invitationId)
        .select()
        .single()
    );
    await this.audit.write({ tenantId, actorId, action: 'USER_INVITATION_RESENT', entityType: 'Invitation', entityId: invitationId, before: { ...invitation, tokenHash: '[redacted]' } as JsonValue, after: { ...updated, tokenHash: '[redacted]' } as JsonValue });
    return { ...updated, token, tokenHash: undefined };
  }

  async getInvitationByToken(token: string) {
    const invitation = await this.db.single<any>(
      this.db.from('Invitation').select('id,tenantId,email,companyId,siteId,roleId,status,expiresAt,acceptedAt,createdAt,updatedAt').eq('tokenHash', tokenHash(token)).maybeSingle()
    );
    if (!invitation) throw new NotFoundException('Invitation not found');
    const expired = invitation.expiresAt && new Date(invitation.expiresAt).getTime() < Date.now();
    return { ...invitation, expired, tokenValid: invitation.status === 'PENDING' && !expired };
  }

  acceptInvitationToken(token: string, displayName: string, password: string) {
    return this.acceptInvitation(token, displayName, password);
  }

  async securityEvents(tenantId: string, userId: string) {
    return this.db.many<any>(
      this.db.from('UserSecurityEvent')
        .select('*')
        .eq('tenantId', tenantId)
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(100)
    ).catch(() => []);
  }

  async changeOwnPassword(tenantId: string, actorId: string, currentPassword: string | undefined, newPassword: string) {
    if (!newPassword || newPassword.length < 12) throw new BadRequestException('New password must be at least 12 characters');
    const user = await this.db.single<any>(this.db.from('User').select('id,tenantId,passwordHash').eq('tenantId', tenantId).eq('id', actorId).maybeSingle());
    if (!user) throw new NotFoundException('User not found');
    if (currentPassword && user.passwordHash) {
      const ok = await compare(currentPassword, user.passwordHash);
      if (!ok) throw new BadRequestException('Current password is incorrect');
    }
    await this.db.single(this.db.from('User').update({ passwordHash: await hash(newPassword, 10), updatedAt: new Date().toISOString() }).eq('tenantId', tenantId).eq('id', actorId).select('id').single());
    await this.markSessionsStale(actorId);
    await this.audit.write({ tenantId, actorId, action: 'USER_PASSWORD_CHANGED', entityType: 'User', entityId: actorId });
    await this.writeSecurityEvent(tenantId, actorId, 'PASSWORD_CHANGED', 'Password changed from profile');
    return { success: true };
  }

  async setStatus(tenantId: string, actorId: string, id: string, status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED') {
    await this.assertCanChangeUser(tenantId, actorId, id, status === 'ACTIVE' ? 'reactivate' : 'deactivate');
    if (status !== 'ACTIVE') {
      const impact = await this.removalImpact(tenantId, id);
      if (impact.blocking) throw new BadRequestException(`User has active responsibilities: ${impact.blockers.join('; ')}`);
    }
    const before = await this.getById(tenantId, id);
    const user = await this.db.single<any>(
      this.db.from('User')
        .update({ status, updatedAt: new Date().toISOString() })
        .eq('tenantId', tenantId)
        .eq('id', id)
        .select('id, tenantId, email, displayName, title, department, status, createdAt, updatedAt')
        .single()
    );
    await this.audit.write({ tenantId, actorId, action: `USER_${status}`, entityType: 'User', entityId: id, before: before as JsonValue, after: user as JsonValue });
    await this.markSessionsStale(id);
    if (status === 'SUSPENDED' || status === 'ACTIVE') {
      await this.notifications.notifyUser({ tenantId, userId: id, type: status === 'SUSPENDED' ? 'iam.user.suspended' : 'iam.user.reactivated', module: 'iam', title: status === 'SUSPENDED' ? 'User suspended' : 'User reactivated', message: `Your PSM OS account status is now ${status}.`, relatedRecordId: id, relatedRecordType: 'User', relatedUrl: '/profile', priority: status === 'SUSPENDED' ? 'High' : 'Info' });
    }
    await this.searchIndex.reindexModule(tenantId, 'users');
    return user;
  }

  async removalImpact(tenantId: string, id: string) {
    const user = await this.getById(tenantId, id);
    const [permits, mocRecords, pssrs, actions] = await Promise.all([
      this.optionalMany('permit_workforce', (query) => query.select('id, permit_id, role_on_permit, status').eq('tenant_id', tenantId).eq('user_id', id).in('status', ['Signed In', 'Active', 'On Permit']).limit(10)),
      this.optionalMany('moc_requests', (query) => query.select('id, moc_number, status').eq('tenant_id', tenantId).eq('originator_id', id).not('status', 'in', '("Closed","Cancelled","Archived")').limit(10)),
      this.optionalMany('pssr_requests', (query) => query.select('id, pssr_number, status').eq('tenant_id', tenantId).eq('coordinator_id', id).not('status', 'in', '("Closed","Cancelled","Archived")').limit(10)),
      this.optionalMany('Action', (query) => query.select('id, actionNumber, status').eq('tenantId', tenantId).eq('ownerId', id).not('status', 'in', '("Closed","Cancelled","Archived")').limit(10))
    ]);
    const blockers: string[] = [];
    if (permits.length) blockers.push(`${permits.length} active PTW workforce/responsibility records`);
    if (mocRecords.length) blockers.push(`${mocRecords.length} active MOC records`);
    if (pssrs.length) blockers.push(`${pssrs.length} active PSSR records`);
    if (actions.length) blockers.push(`${actions.length} open actions`);
    return {
      user: { id: user.id, email: user.email, displayName: user.displayName, status: user.status },
      blocking: blockers.length > 0,
      blockers,
      records: { permits, mocRecords, pssrs, actions },
      guidance: blockers.length ? 'Reassign active responsibilities before deactivation/archive/delete, or use a higher-level emergency override policy.' : 'No active blocking responsibilities found.'
    };
  }

  async archive(tenantId: string, actorId: string, id: string, reason?: string) {
    await this.assertCanChangeUser(tenantId, actorId, id, 'archive');
    const impact = await this.removalImpact(tenantId, id);
    if (impact.blocking) throw new BadRequestException(`Archive blocked: ${impact.blockers.join('; ')}`);
    const before = await this.getById(tenantId, id);
    const user = await this.db.single<any>(
      this.db.from('User')
        .update({ status: 'DEACTIVATED', updatedAt: new Date().toISOString() })
        .eq('tenantId', tenantId)
        .eq('id', id)
        .select('id, tenantId, email, displayName, title, department, status, createdAt, updatedAt')
        .single()
    );
    await this.markSessionsStale(id);
    await this.audit.write({ tenantId, actorId, action: 'USER_ARCHIVED', entityType: 'User', entityId: id, before: before as JsonValue, after: user as JsonValue, metadata: { reason: reason ?? null } });
    await this.searchIndex.reindexModule(tenantId, 'users');
    return user;
  }

  async restore(tenantId: string, actorId: string, id: string) {
    await this.assertCanChangeUser(tenantId, actorId, id, 'restore');
    const before = await this.getByIdIncludingArchived(tenantId, id);
    const user = await this.db.single<any>(
      this.db.from('User')
        .update({ status: 'ACTIVE', updatedAt: new Date().toISOString() })
        .eq('tenantId', tenantId)
        .eq('id', id)
        .select('id, tenantId, email, displayName, title, department, status, createdAt, updatedAt')
        .single()
    );
    await this.audit.write({ tenantId, actorId, action: 'USER_RESTORED', entityType: 'User', entityId: id, before: before as JsonValue, after: user as JsonValue });
    await this.searchIndex.reindexModule(tenantId, 'users');
    return user;
  }

  async deleteUser(tenantId: string, actorId: string, id: string, reason?: string) {
    await this.assertCanChangeUser(tenantId, actorId, id, 'delete');
    const impact = await this.removalImpact(tenantId, id);
    if (impact.blocking) throw new BadRequestException(`Delete blocked: ${impact.blockers.join('; ')}`);
    const before = await this.getByIdIncludingArchived(tenantId, id);
    await this.markSessionsStale(id);
    const removed = await this.db.single<any>(this.db.from('User').delete().eq('tenantId', tenantId).eq('id', id).select('id,email,displayName,status').single());
    await this.audit.write({ tenantId, actorId, action: 'USER_DELETED', entityType: 'User', entityId: id, before: before as JsonValue, after: removed as JsonValue, metadata: { reason: reason ?? null } });
    await this.searchIndex.removeRecord(tenantId, 'users', id);
    return { deleted: true, user: removed };
  }

  async adminResetPassword(tenantId: string, actorId: string, id: string, generateTemporaryPassword: boolean) {
    const user = await this.getByIdIncludingArchived(tenantId, id);
    if (user.status !== 'ACTIVE') throw new BadRequestException('Password can only be reset for active users');
    if (generateTemporaryPassword) {
      const temporaryPassword = generatePassword();
      await this.db.single(this.db.from('User').update({ passwordHash: await hash(temporaryPassword, 10), updatedAt: new Date().toISOString() }).eq('tenantId', tenantId).eq('id', id).select('id').single());
      await this.upsertUserProfile(id, { forcePasswordChange: true });
      await this.markSessionsStale(id);
      await this.audit.write({ tenantId, actorId, action: 'USER_TEMP_PASSWORD_GENERATED', entityType: 'User', entityId: id, after: { forcePasswordChange: true } });
      return { userId: id, temporaryPassword, forcePasswordChange: true, shownOnce: true };
    }
    const reset = await this.createPasswordReset(user.email);
    await this.audit.write({ tenantId, actorId, action: 'USER_PASSWORD_RESET_LINK_CREATED', entityType: 'User', entityId: id, after: { resetCreated: true } });
    return { userId: id, resetToken: reset.resetToken, resetLinkCreated: true };
  }

  async resendInvite(tenantId: string, actorId: string, id: string) {
    const user = await this.getByIdIncludingArchived(tenantId, id);
    const token = crypto.randomUUID();
    const invitation = await this.db.single<any>(
      this.db.from('Invitation').insert({
        id: crypto.randomUUID(),
        tenantId,
        email: user.email,
        tokenHash: tokenHash(token),
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invitedById: actorId,
        updatedAt: new Date().toISOString()
      }).select().single()
    );
    await this.audit.write({ tenantId, actorId, action: 'USER_INVITATION_RESENT', entityType: 'User', entityId: id, after: { invitationId: invitation.id } });
    return { ...invitation, token, tokenHash: undefined };
  }

  async forceLogout(tenantId: string, actorId: string, id: string, reason?: string) {
    await this.getByIdIncludingArchived(tenantId, id);
    await this.markSessionsStale(id);
    await this.audit.write({ tenantId, actorId, action: 'USER_FORCED_LOGOUT', entityType: 'User', entityId: id, metadata: { reason: reason ?? null } });
    return { userId: id, sessionsRevoked: true };
  }

  async testPermission(tenantId: string, id: string, permission: string) {
    return this.permissionService.check(id, tenantId, permission);
  }

  async applyModulePreset(tenantId: string, actorId: string, userId: string, dto: { moduleKey: string; presetName: string; companyId?: string; siteId?: string }) {
    await this.getById(tenantId, userId);
    const moduleKey = dto.moduleKey.toLowerCase();
    const preset = await this.findPermissionPreset(tenantId, moduleKey, dto.presetName);
    const modulePermissions = await this.db.many<any>(this.db.from('Permission').select('id,key').eq('tenantId', tenantId).eq('moduleKey', moduleKey));
    const modulePermissionIds = modulePermissions.map((permission) => permission.id);
    if (modulePermissionIds.length) {
      await this.db.many(
        this.db.from('UserPermissionOverride')
          .delete()
          .eq('tenantId', tenantId)
          .eq('userId', userId)
          .in('permissionId', modulePermissionIds)
          .select()
      ).catch(() => []);
    }
    const permissionKeys = preset.permissions;
    if (preset.mode === 'deny') {
      await this.insertPermissionOverrides(tenantId, actorId, userId, modulePermissions.map((permission) => permission.key), 'deny', dto.companyId, dto.siteId);
    } else if (permissionKeys.length) {
      await this.insertPermissionOverrides(tenantId, actorId, userId, permissionKeys, 'allow', dto.companyId, dto.siteId);
    }
    await this.markSessionsStale(userId);
    await this.audit.write({ tenantId, actorId, action: 'USER_MODULE_PERMISSION_PRESET_APPLIED', entityType: 'User', entityId: userId, after: { moduleKey, presetName: dto.presetName, permissionCount: permissionKeys.length } });
    return this.permissionService.effectiveForUser(userId, tenantId);
  }

  async assignRole(tenantId: string, actorId: string, userId: string, dto: UserRoleDto) {
    await this.getById(tenantId, userId);
    const role = await this.db.single<any>(this.db.from('Role').select('*').eq('tenantId', tenantId).eq('id', dto.roleId).maybeSingle());
    if (!role) throw new NotFoundException('Role not found');
    const scopeType = dto.scopeType ?? (dto.siteId ? 'SITE' : dto.companyId ? 'COMPANY' : 'TENANT');
    const existing = await this.findExistingUserRole(userId, dto.roleId, scopeType, dto.companyId, dto.siteId);
    const assignment = existing ?? await this.insertUserRole(userId, dto.roleId, scopeType, dto.companyId, dto.siteId);
    await this.audit.write({ tenantId, actorId, action: 'USER_ROLE_ASSIGNED', entityType: 'User', entityId: userId, after: assignment as JsonValue });
    await this.markSessionsStale(userId);
    await this.notifications.notifyUser({ tenantId, userId, siteId: dto.siteId ?? null, type: 'iam.role.assigned', module: 'iam', title: 'Role assigned', message: `${role.name} role was assigned to your account.`, relatedRecordId: role.id, relatedRecordType: 'Role', relatedUrl: '/profile', priority: 'Info' });
    return assignment;
  }

  async removeRole(tenantId: string, actorId: string, userId: string, roleId: string) {
    await this.getById(tenantId, userId);
    const removed = await this.db.single<any>(this.db.from('UserRole').delete().eq('userId', userId).eq('roleId', roleId).select().maybeSingle());
    await this.audit.write({ tenantId, actorId, action: 'USER_ROLE_REMOVED', entityType: 'User', entityId: userId, after: { roleId } });
    await this.markSessionsStale(userId);
    await this.notifications.notifyUser({ tenantId, userId, type: 'iam.role.removed', module: 'iam', title: 'Role removed', message: 'A role was removed from your PSM OS account.', relatedRecordId: roleId, relatedRecordType: 'Role', relatedUrl: '/profile', priority: 'Info' });
    return removed ?? { userId, roleId, removed: true };
  }

  async assignSiteAccess(tenantId: string, actorId: string, userId: string, dto: UserSiteAccessDto) {
    await this.getById(tenantId, userId);
    const site = await this.db.single<any>(this.db.from('Site').select('*').eq('tenantId', tenantId).eq('id', dto.siteId).maybeSingle());
    if (!site) throw new NotFoundException('Site not found');
    const access = await this.upsertUserSite(userId, dto.siteId, dto.companyId ?? site.companyId ?? null, dto.unitId, dto.areaId);
    await this.audit.write({ tenantId, actorId, action: 'USER_SITE_ACCESS_ASSIGNED', entityType: 'User', entityId: userId, after: access as JsonValue });
    await this.markSessionsStale(userId);
    return access;
  }

  async removeSiteAccess(tenantId: string, actorId: string, userId: string, siteId: string) {
    await this.getById(tenantId, userId);
    const removed = await this.db.single<any>(this.db.from('UserSite').delete().eq('userId', userId).eq('siteId', siteId).select().maybeSingle());
    await this.audit.write({ tenantId, actorId, action: 'USER_SITE_ACCESS_REMOVED', entityType: 'User', entityId: userId, after: { siteId } });
    await this.markSessionsStale(userId);
    return removed ?? { userId, siteId, removed: true };
  }

  async assignDepartment(tenantId: string, actorId: string, userId: string, departmentId: string) {
    const department = await this.db.single<any>(this.db.from('Department').select('*').eq('tenantId', tenantId).eq('id', departmentId).maybeSingle());
    if (!department) throw new NotFoundException('Department not found');
    return this.update(tenantId, actorId, userId, { department: department.name });
  }

  async assignApprovalDelegation(tenantId: string, actorId: string, delegatorId: string, dto: ApprovalDelegationDto) {
    await this.getById(tenantId, delegatorId);
    await this.getById(tenantId, dto.delegateId);
    if (new Date(dto.startsAt).getTime() >= new Date(dto.endsAt).getTime()) throw new BadRequestException('Delegation end date must be after start date');
    const delegation = await this.db.single<any>(
      this.db.from('ApprovalDelegation').insert({
        id: crypto.randomUUID(),
        tenantId,
        delegatorId,
        delegateId: dto.delegateId,
        moduleKey: dto.moduleKey ?? null,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt,
        status: 'ACTIVE',
        updatedAt: new Date().toISOString()
      }).select().single()
    );
    await this.audit.write({ tenantId, actorId, action: 'APPROVAL_DELEGATION_ASSIGNED', entityType: 'ApprovalDelegation', entityId: delegation.id, after: delegation as JsonValue });
    return delegation;
  }

  async assignContractorAccess(tenantId: string, actorId: string, userId: string, dto: ContractorAccessDto) {
    await this.getById(tenantId, userId);
    const contractorCompany = await this.db.single<any>(
      this.db.from('ContractorCompany').select('*').eq('tenantId', tenantId).eq('id', dto.contractorCompanyId).maybeSingle()
    );
    if (!contractorCompany) throw new NotFoundException('Contractor company not found');
    const existing = await this.db.single<any>(
      this.db.from('ContractorUser').select('*').eq('tenantId', tenantId).eq('userId', userId).maybeSingle()
    );
    const contractorUser = existing
      ? await this.db.single<any>(
          this.db.from('ContractorUser')
            .update({ contractorCompanyId: dto.contractorCompanyId, status: 'ACTIVE', updatedAt: new Date().toISOString() })
            .eq('id', existing.id)
            .select()
            .single()
        )
      : await this.db.single<any>(
          this.db.from('ContractorUser').insert({
            id: crypto.randomUUID(),
            tenantId,
            userId,
            contractorCompanyId: dto.contractorCompanyId,
            status: 'ACTIVE',
            updatedAt: new Date().toISOString()
          }).select().single()
        );
    await this.audit.write({ tenantId, actorId, action: 'CONTRACTOR_ACCESS_ASSIGNED', entityType: 'ContractorUser', entityId: contractorUser.id, after: contractorUser as JsonValue });
    return contractorUser;
  }

  private async invitationForActor(tenantId: string, actorId: string, invitationId: string) {
    const [actor, invitation, incidentInvitation] = await Promise.all([
      this.db.single<any>(this.db.from('User').select('id,email,displayName,tenantId').eq('tenantId', tenantId).eq('id', actorId).maybeSingle()),
      this.db.single<any>(this.db.from('hazop_team_invitations').select('*').eq('tenant_id', tenantId).eq('id', invitationId).maybeSingle()).catch(() => null),
      this.db.single<any>(this.db.from('incident_team_notifications').select('*').eq('tenant_id', tenantId).eq('id', invitationId).maybeSingle()).catch(() => null)
    ]);
    if (!actor) throw new NotFoundException('User not found');
    const email = String(actor.email ?? '').toLowerCase();
    if (invitation) {
      const invitedEmail = String(invitation.invited_email ?? '').toLowerCase();
      const userMatches = invitation.invited_user_id && invitation.invited_user_id === actorId;
      const emailMatches = invitedEmail && invitedEmail === email;
      if (!userMatches && !emailMatches) throw new ForbiddenException('You can only respond to your own invitation');
      return { actor, invitation, source: 'hazop' };
    }
    if (incidentInvitation) {
      const member = await this.db.single<any>(this.db.from('incident_investigation_team_members').select('*').eq('tenant_id', tenantId).eq('id', incidentInvitation.member_id).maybeSingle());
      if (!member) throw new NotFoundException('Invitation member not found');
      const memberEmail = String(member.email ?? '').toLowerCase();
      const userMatches = member.user_id && member.user_id === actorId;
      const emailMatches = memberEmail && memberEmail === email;
      if (!userMatches && !emailMatches) throw new ForbiddenException('You can only respond to your own invitation');
      return { actor, invitation: { ...incidentInvitation, member }, source: 'incident' };
    }
    throw new NotFoundException('Invitation not found');
  }

  private async incidentInvitationMembersForActor(tenantId: string, actorId: string, email: string) {
    const [byUser, byEmail] = await Promise.all([
      this.db.many<any>(this.db.from('incident_investigation_team_members').select('*').eq('tenant_id', tenantId).eq('user_id', actorId)).catch(() => []),
      email ? this.db.many<any>(this.db.from('incident_investigation_team_members').select('*').eq('tenant_id', tenantId).eq('email', email)).catch(() => []) : Promise.resolve([])
    ]);
    return [...new Map([...byUser, ...byEmail].filter((member) => member.status !== 'Removed').map((member) => [member.id, member])).values()];
  }

  private async backfillIncidentTeamInvitationsForUser(tenantId: string, actorId: string, email: string) {
    const members = (await this.incidentInvitationMembersForActor(tenantId, actorId, email)).filter((member) => ['Pending Acceptance', 'Pending', 'Invited'].includes(member.acceptance_status ?? member.active_status ?? ''));
    if (!members.length) return;
    const incidentIds = [...new Set(members.map((member) => member.incident_id).filter(Boolean))];
    const incidents = incidentIds.length ? await this.db.many<any>(this.db.from('incidents').select('id,incident_number,title,company_id,site_id,created_by,investigation_owner_id,investigation_lead_id').eq('tenant_id', tenantId).in('id', incidentIds)).catch(() => []) : [];
    const incidentById = new Map(incidents.map((incident) => [incident.id, incident]));
    for (const member of members) {
      const exists = await this.db.single<any>(this.db.from('incident_team_notifications').select('id').eq('tenant_id', tenantId).eq('member_id', member.id).eq('notification_type', 'Assignment Invitation').maybeSingle()).catch(() => null);
      if (exists) continue;
      const incident = incidentById.get(member.incident_id);
      await this.db.single(this.db.from('incident_team_notifications').insert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: member.company_id ?? incident?.company_id ?? null,
        site_id: member.site_id ?? incident?.site_id ?? null,
        incident_id: member.incident_id,
        member_id: member.id,
        notification_type: 'Assignment Invitation',
        subject: `Incident ${incident?.incident_number ?? ''} investigation team assignment`.trim(),
        message: `You have been assigned as ${member.team_role ?? 'Team Member'} for ${incident?.title ?? 'an incident investigation'}.`,
        status: 'Pending Invitation',
        sent_by: member.assigned_by ?? member.created_by ?? incident?.investigation_owner_id ?? incident?.created_by ?? actorId,
        sent_at: new Date().toISOString()
      }).select().single()).catch(() => null);
    }
  }

  private async decorateIncidentProfileInvitations(tenantId: string, invitations: any[], members: any[]) {
    if (!invitations.length) return [];
    const memberById = new Map(members.map((member) => [member.id, member]));
    const incidentIds = [...new Set(invitations.map((row) => row.incident_id).filter(Boolean))];
    const inviterIds = [...new Set(invitations.map((row) => row.sent_by).filter(Boolean))];
    const [incidents, inviters] = await Promise.all([
      incidentIds.length ? this.db.many<any>(this.db.from('incidents').select('id,incident_number,title,status,site_id,company_id').eq('tenant_id', tenantId).in('id', incidentIds)).catch(() => []) : [],
      inviterIds.length ? this.db.many<any>(this.db.from('User').select('id,displayName,email,title').eq('tenantId', tenantId).in('id', inviterIds)).catch(() => []) : []
    ]);
    const incidentById = new Map(incidents.map((incident) => [incident.id, incident]));
    const inviterById = new Map(inviters.map((inviter) => [inviter.id, inviter]));
    return invitations.map((row) => {
      const member = memberById.get(row.member_id) ?? {};
      const incident = incidentById.get(row.incident_id) ?? {};
      const status = member.acceptance_status === 'Accepted' ? 'Accepted' : member.acceptance_status === 'Declined' ? 'Declined' : row.status === 'Pending Invitation' ? 'Pending' : row.status ?? 'Pending';
      return {
        ...row,
        sourceModule: 'Incident',
        status,
        expired: false,
        study: { id: incident.id, study_number: incident.incident_number, title: incident.title, status: incident.status },
        teamMember: member,
        invitedBy: inviterById.get(row.sent_by) ?? null,
        studyNumber: incident.incident_number ?? null,
        studyTitle: incident.title ?? 'Incident investigation team assignment',
        studyRole: member.team_role ?? 'Investigation Team Member',
        discipline: member.discipline ?? null,
        requiredAttendance: Boolean(member.required_member ?? member.required_role),
        signoffRequired: Boolean(member.approver ?? member.reviewer),
        expiresAt: member.acceptance_due_date ?? null,
        recordUrl: incident.id ? `/incidents/${incident.id}?tab=investigation-team` : '/incidents',
        decline_reason: member.decline_reason ?? null
      };
    });
  }

  private async acceptIncidentProfileInvitation(tenantId: string, actorId: string, actor: any, invitation: any) {
    const member = invitation.member;
    if (!['Pending Invitation', 'Pending', 'Sent'].includes(invitation.status) && !['Pending Acceptance', 'Pending', 'Invited'].includes(member.acceptance_status ?? '')) throw new BadRequestException(`Invitation is ${invitation.status}`);
    if (member.acceptance_due_date && new Date(member.acceptance_due_date).getTime() < Date.now()) throw new BadRequestException('Invitation has expired');
    const now = new Date().toISOString();
    const [updatedInvitation, teamMember, incident] = await Promise.all([
      this.db.single<any>(this.db.from('incident_team_notifications').update({ status: 'Accepted', responded_at: now }).eq('tenant_id', tenantId).eq('id', invitation.id).select().single()),
      this.db.single<any>(this.db.from('incident_investigation_team_members').update({ acceptance_status: 'Accepted', active_status: 'Active', user_id: actorId, accepted_by: actorId, accepted_at: now, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', member.id).select().single()),
      this.db.single<any>(this.db.from('incidents').select('*').eq('tenant_id', tenantId).eq('id', invitation.incident_id).maybeSingle())
    ]);
    await this.writeIncidentInvitationHistory(tenantId, actorId, incident, updatedInvitation, 'Status Changed', `${actor.displayName ?? actor.email} accepted incident investigation team invitation`, member, teamMember);
    await this.audit.write({ tenantId, actorId, action: 'INCIDENT_TEAM_INVITATION_ACCEPTED', entityType: 'incident_team_notifications', entityId: invitation.id, before: invitation as JsonValue, after: { invitation: updatedInvitation, teamMember } as JsonValue });
    return { invitation: updatedInvitation, teamMember };
  }

  private async declineIncidentProfileInvitation(tenantId: string, actorId: string, actor: any, invitation: any, reason?: string) {
    const member = invitation.member;
    if (!['Pending Invitation', 'Pending', 'Sent'].includes(invitation.status) && !['Pending Acceptance', 'Pending', 'Invited'].includes(member.acceptance_status ?? '')) throw new BadRequestException(`Invitation is ${invitation.status}`);
    const now = new Date().toISOString();
    const [updatedInvitation, teamMember, incident] = await Promise.all([
      this.db.single<any>(this.db.from('incident_team_notifications').update({ status: 'Declined', responded_at: now, decline_reason: reason ?? null }).eq('tenant_id', tenantId).eq('id', invitation.id).select().single()),
      this.db.single<any>(this.db.from('incident_investigation_team_members').update({ acceptance_status: 'Declined', active_status: 'Declined', declined_at: now, decline_reason: reason ?? null, updated_by: actorId, updated_at: now }).eq('tenant_id', tenantId).eq('id', member.id).select().single()),
      this.db.single<any>(this.db.from('incidents').select('*').eq('tenant_id', tenantId).eq('id', invitation.incident_id).maybeSingle())
    ]);
    await this.writeIncidentInvitationHistory(tenantId, actorId, incident, updatedInvitation, 'Status Changed', `${actor.displayName ?? actor.email} declined incident investigation team invitation`, member, teamMember, reason);
    await this.audit.write({ tenantId, actorId, action: 'INCIDENT_TEAM_INVITATION_DECLINED', entityType: 'incident_team_notifications', entityId: invitation.id, before: invitation as JsonValue, after: { invitation: updatedInvitation, teamMember } as JsonValue });
    return { invitation: updatedInvitation, teamMember };
  }

  private async writeIncidentInvitationHistory(tenantId: string, actorId: string, incident: any, invitation: any, eventType: string, title: string, before?: any, after?: any, description?: string) {
    if (!incident?.id) return null;
    const existing = await this.db.many<any>(this.db.from('incident_history_events').select('id').eq('tenant_id', tenantId).eq('incident_id', incident.id)).catch(() => []);
    return this.db.single(this.db.from('incident_history_events').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      company_id: incident.company_id,
      site_id: incident.site_id,
      incident_id: incident.id,
      event_number: existing.length + 1,
      event_type: eventType,
      event_category: 'Investigation Team',
      event_title: title,
      event_description: description ?? null,
      actor_user_id: actorId,
      severity: 'Info',
      before_values_json: before ?? null,
      after_values_json: after ?? null,
      metadata_json: { invitationId: invitation.id, teamMemberId: invitation.member_id },
      source_system: 'PSM OS'
    }).select().single()).catch(() => null);
  }

  private async backfillHazopTeamInvitationsForUser(tenantId: string, actorId: string, email: string) {
    const [byUser, byEmail, byExternalEmail] = await Promise.all([
      this.db.many<any>(this.db.from('hazop_study_team_members').select('*').eq('tenant_id', tenantId).eq('user_id', actorId).eq('status', 'Invited')).catch(() => []),
      email ? this.db.many<any>(this.db.from('hazop_study_team_members').select('*').eq('tenant_id', tenantId).eq('email', email).eq('status', 'Invited')).catch(() => []) : Promise.resolve([]),
      email ? this.db.many<any>(this.db.from('hazop_study_team_members').select('*').eq('tenant_id', tenantId).eq('external_email', email).eq('status', 'Invited')).catch(() => []) : Promise.resolve([])
    ]);
    const members = [...new Map([...byUser, ...byEmail, ...byExternalEmail].map((member) => [member.id, member])).values()];
    if (!members.length) return;
    const studyIds = [...new Set(members.map((member) => member.study_id).filter(Boolean))];
    const studies = studyIds.length ? await this.db.many<any>(this.db.from('hazop_studies').select('*').eq('tenant_id', tenantId).in('id', studyIds)).catch(() => []) : [];
    const studyById = new Map(studies.map((study) => [study.id, study]));
    for (const member of members) {
      const exists = await this.db.single<any>(this.db.from('hazop_team_invitations').select('id').eq('tenant_id', tenantId).eq('team_member_id', member.id).maybeSingle()).catch(() => null);
      if (exists) continue;
      const study = studyById.get(member.study_id);
      await this.db.single(this.db.from('hazop_team_invitations').insert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: member.company_id ?? study?.company_id ?? null,
        site_id: member.site_id ?? study?.site_id ?? null,
        study_id: member.study_id,
        team_member_id: member.id,
        invited_user_id: member.user_id ?? actorId,
        invited_email: String(member.email ?? member.external_email ?? email).toLowerCase(),
        invited_by: member.added_by ?? member.created_by ?? study?.created_by ?? null,
        study_role: member.study_role ?? member.role ?? null,
        discipline: member.discipline ?? null,
        permission_level: member.permission_level ?? 'Comment',
        required_attendance: Boolean(member.required_attendance ?? member.required),
        signoff_required: Boolean(member.signoff_required),
        status: 'Pending',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { backfilled: true, studyNumber: study?.study_number, studyTitle: study?.title }
      }).select().single()).catch(() => null);
    }
  }

  private async expireHazopInvitation(tenantId: string, invitationId: string) {
    return this.db.single<any>(
      this.db.from('hazop_team_invitations')
        .update({ status: 'Expired', updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .eq('id', invitationId)
        .select()
        .single()
    );
  }

  private async writeHazopInvitationHistory(tenantId: string, actorId: string, study: any, invitation: any, eventType: string, title: string, description?: string) {
    if (!study?.id) return null;
    return this.db.single(this.db.from('hazop_history_events').insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      study_id: study.id,
      event_type: eventType,
      title,
      description: description ?? null,
      actor_id: actorId,
      metadata: { invitationId: invitation.id, teamMemberId: invitation.team_member_id }
    }).select().single()).catch(() => null);
  }

  private async notifyHazopLeader(tenantId: string, study: any, actorId: string, title: string, message: string, invitationId: string) {
    const leaderId = study?.study_leader_id ?? study?.facilitator_id ?? study?.created_by;
    if (!leaderId || leaderId === actorId) return null;
    return this.notifications.notifyUser({
      tenantId,
      companyId: study.company_id ?? null,
      siteId: study.site_id ?? null,
      userId: leaderId,
      type: 'hazop.team.invitation.response',
      module: 'hazop',
      title,
      message,
      relatedRecordId: invitationId,
      relatedRecordType: 'hazop_team_invitations',
      relatedUrl: `/hazop/${study.id}`,
      priority: 'Info'
    }).catch(() => null);
  }

  async accessReference(tenantId: string) {
    const [companies, sites, units, areas, departments, contractorCompanies] = await Promise.all([
      this.db.many<any>(this.db.from('Company').select('*').eq('tenantId', tenantId).order('name')),
      this.db.many<any>(this.db.from('Site').select('*').eq('tenantId', tenantId).order('name')),
      this.db.many<any>(this.db.from('Unit').select('*').eq('tenantId', tenantId).order('name')),
      this.db.many<any>(this.db.from('Area').select('*').eq('tenantId', tenantId).order('name')),
      this.db.many<any>(this.db.from('Department').select('*').eq('tenantId', tenantId).order('name')),
      this.db.many<any>(this.db.from('ContractorCompany').select('*').eq('tenantId', tenantId).order('name'))
    ]);
    return { companies, sites, units, areas, departments, contractorCompanies };
  }

  private async hydrateUsers(tenantId: string, users: any[]) {
    const userIds = users.map((user) => user.id).filter(Boolean);
    if (!userIds.length) return users.map((user) => ({ ...user, userRoles: [], userSites: [] }));

    const [userRoles, userSites] = await Promise.all([
      this.db.many<any>(this.db.from('UserRole').select('*').in('userId', userIds)).catch(() => []),
      this.db.many<any>(this.db.from('UserSite').select('*').in('userId', userIds)).catch(() => [])
    ]);
    const roleIds = [...new Set(userRoles.map((assignment) => assignment.roleId).filter(Boolean))];
    const siteIds = [...new Set(userSites.map((access) => access.siteId).filter(Boolean))];
    const [roles, sites] = await Promise.all([
      roleIds.length ? this.db.many<any>(this.db.from('Role').select('*').eq('tenantId', tenantId).in('id', roleIds)).catch(() => []) : [],
      siteIds.length ? this.db.many<any>(this.db.from('Site').select('*').eq('tenantId', tenantId).in('id', siteIds)).catch(() => []) : []
    ]);
    const roleById = new Map(roles.map((role) => [role.id, role]));
    const siteById = new Map(sites.map((site) => [site.id, site]));

    return users.map((user) => ({
      ...user,
      userRoles: userRoles
        .filter((assignment) => assignment.userId === user.id)
        .map((assignment) => ({ ...assignment, role: roleById.get(assignment.roleId) ?? null })),
      userSites: userSites
        .filter((access) => access.userId === user.id)
        .map((access) => ({ ...access, site: siteById.get(access.siteId) ?? null }))
    }));
  }

  private async resolveUserCreateDefaults(tenantId: string, dto: CreateUserDto) {
    const [defaultRole, defaultSite, defaultCompany] = await Promise.all([
      dto.roleIds?.length
        ? null
        : this.db.single<any>(
            this.db.from('Role')
              .select('id')
              .eq('tenantId', tenantId)
              .in('key', ['viewer', 'Viewer', 'contractor'])
              .limit(1)
              .maybeSingle()
          ).catch(() => null),
      dto.siteIds?.length
        ? null
        : this.db.single<any>(
            this.db.from('Site')
              .select('id,companyId')
              .eq('tenantId', tenantId)
              .order('name')
              .limit(1)
              .maybeSingle()
          ).catch(() => null),
      dto.companyIds?.length
        ? null
        : this.db.single<any>(
            this.db.from('Company')
              .select('id')
              .eq('tenantId', tenantId)
              .order('name')
              .limit(1)
              .maybeSingle()
          ).catch(() => null)
    ]);
    let roleId = defaultRole?.id;
    if (!roleId && !dto.roleIds?.length) {
      const firstRole = await this.db.single<any>(
        this.db.from('Role')
          .select('id')
          .eq('tenantId', tenantId)
          .order('name')
          .limit(1)
          .maybeSingle()
      ).catch(() => null);
      roleId = firstRole?.id;
    }
    return {
      roleIds: dto.roleIds?.length ? dto.roleIds : roleId ? [roleId] : [],
      companyIds: dto.companyIds?.length ? dto.companyIds : (defaultSite?.companyId ? [defaultSite.companyId] : defaultCompany?.id ? [defaultCompany.id] : []),
      siteIds: dto.siteIds?.length ? dto.siteIds : defaultSite?.id ? [defaultSite.id] : []
    };
  }

  private async resolveRoleIds(tenantId: string, roleIdsOrKeys: string[]) {
    if (!roleIdsOrKeys.length) return [];
    const directRoles = await this.db.many<any>(
      this.db.from('Role').select('id,key,name').eq('tenantId', tenantId).in('id', roleIdsOrKeys)
    ).catch(() => []);
    const found = new Map<string, string>(directRoles.map((role) => [role.id, role.id]));
    const missing = roleIdsOrKeys.filter((value) => !found.has(value));
    if (missing.length) {
      const roles = await this.db.many<any>(
        this.db.from('Role').select('id,key,name').eq('tenantId', tenantId)
      ).catch(() => []);
      for (const value of missing) {
        const normalized = value.trim().toLowerCase();
        const match = roles.find((role) => role.key?.toLowerCase() === normalized || role.name?.toLowerCase() === normalized);
        if (match) found.set(value, match.id);
      }
    }
    const resolved = roleIdsOrKeys.map((value) => found.get(value)).filter(Boolean) as string[];
    if (resolved.length !== roleIdsOrKeys.length) {
      throw new BadRequestException('One or more selected roles are not configured for this tenant.');
    }
    return [...new Set(resolved)];
  }

  private async findExistingUserRole(userId: string, roleId: string, scopeType: string, companyId?: string, siteId?: string) {
    try {
      return await this.db.single<any>(
        this.db.from('UserRole')
          .select('*')
          .eq('userId', userId)
          .eq('roleId', roleId)
          .eq('scopeType', scopeType)
          .filter('companyId', companyId ? 'eq' : 'is', companyId ?? null)
          .filter('siteId', siteId ? 'eq' : 'is', siteId ?? null)
          .maybeSingle()
      );
    } catch {
      return this.db.single<any>(
        this.db.from('UserRole')
          .select('*')
          .eq('userId', userId)
          .eq('roleId', roleId)
          .maybeSingle()
      ).catch(() => null);
    }
  }

  private async insertUserRole(userId: string, roleId: string, scopeType: string, companyId?: string, siteId?: string) {
    try {
      return await this.db.single<any>(
        this.db.from('UserRole').insert({
          id: crypto.randomUUID(),
          userId,
          roleId,
          scopeType,
          companyId: companyId ?? null,
          siteId: siteId ?? null
        }).select().single()
      );
    } catch {
      return this.db.single<any>(
        this.db.from('UserRole').insert({ userId, roleId }).select().single()
      );
    }
  }

  private async upsertUserSite(userId: string, siteId: string, companyId?: string | null, unitId?: string, areaId?: string) {
    try {
      return await this.db.single<any>(
        this.db.from('UserSite').upsert({
          userId,
          siteId,
          companyId: companyId ?? null,
          unitId: unitId ?? null,
          areaId: areaId ?? null
        }, { onConflict: 'userId,siteId' }).select().single()
      );
    } catch {
      return this.db.single<any>(
        this.db.from('UserSite').upsert({ userId, siteId }, { onConflict: 'userId,siteId' }).select().single()
      );
    }
  }

  private async withSeededRoleFallback(user: any) {
    if (user?.id !== 'user_imran_shah' || user?.tenantId !== 'tenant_alkylation' || user.userRoles?.length) return user;
    const role = await this.db.single<any>(this.db.from('Role').select('*').eq('tenantId', user.tenantId).eq('id', 'role_hse_manager').maybeSingle()).catch(() => null);
    return role ? { ...user, userRoles: [{ role }] } : { ...user, userRoles: [] };
  }

  async permissions(userId: string, tenantId: string) {
    const grants = await this.db.many<any>(
      this.db.from('UserRole')
        .select('role:Role!inner(tenantId, rolePermissions:RolePermission(permission:Permission(key,moduleKey,label)))')
        .eq('userId', userId)
        .eq('role.tenantId', tenantId)
    );
    return [...new Map(grants.flatMap((grant) => grant.role?.rolePermissions ?? []).map((grant) => [grant.permission?.key, grant.permission])).values()].filter(Boolean);
  }

  private async upsertUserProfile(userId: string, dto: Partial<CreateUserDto>) {
    const profilePatch = stripUndefined({
      userId,
      personalEmail: dto.personalEmail,
      phone: dto.phone,
      employeeId: dto.employeeId,
      employerType: dto.employerType,
      contractorCompanyId: dto.contractorCompanyId,
      forcePasswordChange: dto.forcePasswordChange,
      mfaRequired: dto.mfaRequired,
      updatedAt: new Date().toISOString()
    });
    const existingProfile = await this.db.single<any>(this.db.from('UserProfile').select('userId').eq('userId', userId).maybeSingle());
    try {
      if (existingProfile) {
        await this.db.single(this.db.from('UserProfile').update(profilePatch).eq('userId', userId).select().single());
      } else {
        await this.db.single(this.db.from('UserProfile').insert(profilePatch).select().single());
      }
    } catch (error) {
      const basicPatch = stripUndefined({
        userId,
        phone: dto.phone,
        updatedAt: new Date().toISOString()
      });
      if (existingProfile) {
        await this.db.single(this.db.from('UserProfile').update(basicPatch).eq('userId', userId).select().single());
      } else {
        await this.db.single(this.db.from('UserProfile').insert(basicPatch).select().single());
      }
    }
  }

  private async assignPermissionOverrides(tenantId: string, actorId: string, userId: string, permissionKeys: string[], companyId?: string, siteId?: string) {
    await this.insertPermissionOverrides(tenantId, actorId, userId, permissionKeys, 'allow', companyId, siteId);
    await this.audit.write({ tenantId, actorId, action: 'USER_PERMISSION_OVERRIDES_ADDED', entityType: 'User', entityId: userId, after: { permissionKeys } });
  }

  private async insertPermissionOverrides(tenantId: string, actorId: string, userId: string, permissionKeys: string[], effect: 'allow' | 'deny', companyId?: string, siteId?: string) {
    const permissions = await this.db.many<any>(this.db.from('Permission').select('id,key').eq('tenantId', tenantId).in('key', permissionKeys));
    if (!permissions.length && permissionKeys.length) throw new BadRequestException('One or more module permissions are invalid');
    if (permissions.length) {
      await this.db.many(
        this.db.from('UserPermissionOverride')
          .delete()
          .eq('tenantId', tenantId)
          .eq('userId', userId)
          .in('permissionId', permissions.map((permission) => permission.id))
          .select()
      ).catch(() => []);
    }
    const rows = permissions.map((permission) => ({
      id: crypto.randomUUID(),
      tenantId,
      userId,
      permissionId: permission.id,
      companyId: companyId ?? null,
      siteId: siteId ?? null,
      effect,
      reason: 'Assigned by admin',
      createdBy: actorId,
      createdAt: new Date().toISOString()
    }));
    if (rows.length) await this.db.many(this.db.from('UserPermissionOverride').insert(rows).select());
  }

  private async insertBulkJob(tenantId: string, actorId: string, fileName: string, rows: BulkImportUserRowDto[]) {
    const job = await this.db.single<any>(this.db.from('UserBulkImportJob').insert({
      id: crypto.randomUUID(),
      tenantId,
      uploadedBy: actorId,
      fileName,
      status: 'Validating',
      totalRows: rows.length,
      validRows: 0,
      errorRows: 0,
      createdUsersCount: 0,
      skippedUsersCount: 0,
      inviteSentCount: 0,
      passwordGeneratedCount: 0,
      updatedAt: new Date().toISOString()
    }).select().single());
    if (rows.length) {
      await this.db.many(this.db.from('UserBulkImportRow').insert(rows.map((row, index) => ({
        id: crypto.randomUUID(),
        jobId: job.id,
        rowNumber: index + 1,
        rawData: row,
        normalizedData: normalizeImportRow(row),
        validationStatus: 'Pending',
        validationErrors: [],
        passwordGenerated: false,
        updatedAt: new Date().toISOString()
      }))).select());
    }
    return job;
  }

  private async markSessionsStale(userId: string) {
    try {
      await this.db.many(this.db.from('Session').update({ revokedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).eq('userId', userId).is('revokedAt', null).select());
    } catch {
      return;
    }
  }

  private async writeSecurityEvent(tenantId: string, userId: string, eventType: string, description: string, metadata?: JsonValue) {
    return this.db.single(this.db.from('UserSecurityEvent').insert({
      id: crypto.randomUUID(),
      tenantId,
      userId,
      eventType,
      description,
      metadata: metadata ?? null
    }).select().single()).catch(() => null);
  }

  private async getByIdIncludingArchived(tenantId: string, id: string) {
    const user = await this.db.single<any>(
      this.db.from('User')
        .select('id, tenantId, email, displayName, title, department, status, createdAt, updatedAt')
        .eq('tenantId', tenantId)
        .eq('id', id)
        .maybeSingle()
    );
    if (!user) throw new NotFoundException('User not found');
    const [hydrated] = await this.hydrateUsers(tenantId, [user]);
    return this.withSeededRoleFallback(hydrated);
  }

  private async assertCanChangeUser(tenantId: string, actorId: string, targetUserId: string, action: string) {
    if (actorId === targetUserId && ['delete', 'archive', 'deactivate'].includes(action)) throw new BadRequestException('You cannot remove or deactivate your own account');
    const [actor, target] = await Promise.all([this.getByIdIncludingArchived(tenantId, actorId), this.getByIdIncludingArchived(tenantId, targetUserId)]);
    const targetRoleKeys = new Set<string>((target.userRoles ?? []).map((assignment: any) => assignment.role?.key).filter(Boolean));
    const actorRoleKeys = new Set<string>((actor.userRoles ?? []).map((assignment: any) => assignment.role?.key).filter(Boolean));
    if ((target.id === 'user_imran_shah' || targetRoleKeys.has('platform_admin') || targetRoleKeys.has('super_admin')) && !actorRoleKeys.has('platform_admin') && !actorRoleKeys.has('super_admin')) {
      throw new ForbiddenException('Seed and super admin users are protected');
    }
    if (['delete', 'archive', 'deactivate'].includes(action)) {
      const companyAdmins = await this.db.many<any>(
        this.db.from('UserRole')
          .select('userId,role:Role!inner(key,tenantId)')
          .eq('role.tenantId', tenantId)
          .in('role.key', ['corporate_admin', 'company_admin', 'site_admin', 'platform_admin', 'super_admin'])
      );
      const activeAdminIds = [...new Set(companyAdmins.map((row) => row.userId).filter((id) => id !== targetUserId))];
      if (!activeAdminIds.length && [...targetRoleKeys].some((key) => ['corporate_admin', 'company_admin', 'site_admin', 'platform_admin', 'super_admin'].includes(key))) {
        throw new BadRequestException('Cannot remove the last administrator');
      }
    }
  }

  private async optionalMany(table: string, build: (query: ReturnType<SupabaseService['from']>) => any) {
    try {
      return await this.db.many<any>(build(this.db.from(table)));
    } catch {
      return [];
    }
  }

  private async findPermissionPreset(tenantId: string, moduleKey: string, presetName: string) {
    const normalized = presetName.trim().toLowerCase();
    try {
      const row = await this.db.single<any>(
        this.db.from('PermissionPreset')
          .select('*')
          .eq('tenantId', tenantId)
          .eq('moduleKey', moduleKey)
          .ilike('name', presetName)
          .maybeSingle()
      );
      if (row) return { mode: row.name.toLowerCase().includes('no access') ? 'deny' as const : 'allow' as const, permissions: row.permissionsJson?.permissions ?? row.permissionsJson ?? [] };
    } catch {
      // Fall through to in-code presets when the migration is not applied yet.
    }
    const preset = permissionPresetFallbacks[moduleKey]?.[normalized];
    if (!preset) throw new BadRequestException(`Unknown permission preset: ${presetName}`);
    return preset;
  }
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function generatePassword() {
  const raw = randomBytes(18).toString('base64url');
  return `${raw.slice(0, 9)}A!7${raw.slice(9, 15)}z`;
}

function stripUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null));
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function normalizeImportRow(row: BulkImportUserRowDto) {
  return {
    ...row,
    email: row.email?.toLowerCase(),
    work_email: row.email?.toLowerCase(),
    full_name: row.displayName,
    job_title: row.title,
    employee_id: row.employeeId,
    personal_email: row.personalEmail,
    employer_type: row.employerType,
    contractor_company: row.contractorCompany,
    module_permissions: row.modulePermissions,
    send_invite_to: row.sendInviteTo,
    generate_password: row.generatePassword,
    force_password_change: row.forcePasswordChange
  };
}

const permissionPresetFallbacks: Record<string, Record<string, { mode: 'allow' | 'deny'; permissions: string[] }>> = {
  moc: {
    'no access': { mode: 'deny', permissions: [] },
    'read only moc': { mode: 'allow', permissions: ['moc.dashboard.view', 'moc.view'] },
    'allow all moc': { mode: 'allow', permissions: ['moc.dashboard.view', 'moc.view', 'moc.create', 'moc.edit', 'moc.submit', 'moc.approve', 'moc.reject', 'moc.close', 'moc.cancel', 'moc.risk.edit', 'moc.impact.edit', 'moc.engineering.upload', 'moc.workflow.approve', 'moc.temporary.extend', 'moc.emergency.review', 'moc.pssr.trigger', 'moc.release_startup', 'moc.export'] }
  },
  ptw: {
    'no access': { mode: 'deny', permissions: [] },
    'read only ptw': { mode: 'allow', permissions: ['ptw.dashboard.view', 'ptw.view'] },
    'allow all ptw': { mode: 'allow', permissions: ['ptw.dashboard.view', 'ptw.view', 'ptw.create', 'ptw.edit', 'ptw.submit', 'ptw.approve', 'ptw.reject', 'ptw.issue', 'ptw.suspend', 'ptw.resume', 'ptw.extend', 'ptw.close', 'ptw.cancel', 'ptw.gas.add', 'ptw.gas.verify', 'ptw.isolation.apply', 'ptw.isolation.verify', 'ptw.conflicts.override', 'ptw.handover.complete', 'ptw.sign', 'ptw.export'] }
  },
  pssr: {
    'no access': { mode: 'deny', permissions: [] },
    'read only pssr': { mode: 'allow', permissions: ['pssr.dashboard.view', 'pssr.view'] },
    'allow all pssr': { mode: 'allow', permissions: ['pssr.dashboard.view', 'pssr.view', 'pssr.create', 'pssr.edit', 'pssr.trigger_from_moc', 'pssr.checklist.complete', 'pssr.field.verify', 'pssr.documents.verify', 'pssr.training.verify', 'pssr.testing.verify', 'pssr.punch.close', 'pssr.authorization.sign', 'pssr.authorization.release', 'pssr.certificate.generate', 'pssr.certificate.secure_share', 'pssr.export'] }
  }
};
