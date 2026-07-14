import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { createHash } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../permissions/permissions.service';
import { SignatureProfileDto } from './dto/signature-profile.dto';
import { ChangeSignaturePinDto, SetSignaturePinDto, VerifySignaturePinDto } from './dto/signature-pin.dto';
import { RejectElectronicSignatureDto, SignElectronicSignatureDto, SignatureRequirementDto, ValidateBeforeActionDto } from './dto/signature.dto';

type RequestMeta = { ipAddress?: string | null; userAgent?: string | null };

@Injectable()
export class SignaturesService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly permissions: PermissionsService,
    private readonly notifications: NotificationsService
  ) {}

  async myProfile(tenantId: string, userId: string) {
    return this.db.single<any>(
      this.db.from('user_signature_profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .in('status', ['Draft', 'Active', 'Disabled'])
        .maybeSingle()
    );
  }

  async saveMyProfile(tenantId: string, userId: string, dto: SignatureProfileDto) {
    this.validateSignaturePayload(dto);
    const before = await this.myProfile(tenantId, userId);
    const payload = {
      tenant_id: tenantId,
      company_id: await this.firstCompanyId(tenantId, userId),
      user_id: userId,
      full_name: dto.fullName,
      job_title: dto.jobTitle ?? null,
      department_id: dto.departmentId ?? null,
      department_name: dto.departmentName ?? null,
      signature_method: dto.signatureMethod,
      signature_text: dto.signatureText ?? null,
      signature_image_key: dto.signatureImageKey ?? null,
      signature_image_url: dto.signatureImageUrl ?? null,
      signature_vector_json: dto.signatureVectorJson ?? null,
      initials: dto.initials ?? null,
      style_config: dto.styleConfig ?? {},
      status: before?.status === 'Active' ? 'Active' : 'Draft',
      updated_by: userId,
      updated_at: new Date().toISOString()
    };
    const profile = before
      ? await this.db.single<any>(this.db.from('user_signature_profiles').update(payload).eq('id', before.id).select().single())
      : await this.db.single<any>(this.db.from('user_signature_profiles').insert({ id: crypto.randomUUID(), ...payload, created_by: userId }).select().single());
    await this.createProfileVersion(tenantId, profile);
    await this.audit.write({ tenantId, actorId: userId, action: before ? 'SIGNATURE_PROFILE_UPDATED' : 'SIGNATURE_PROFILE_CREATED', entityType: 'SignatureProfile', entityId: profile.id, before: before as JsonValue, after: profile as JsonValue });
    await this.notifications.notifyUser({ tenantId, userId, type: before ? 'signature.profile_updated' : 'signature.profile_created', module: 'signature', title: before ? 'Signature profile updated' : 'Signature profile created', message: 'Your electronic signature profile was saved.', relatedRecordId: profile.id, relatedRecordType: 'SignatureProfile', relatedUrl: '/settings/signature', priority: 'Info' }).catch(() => null);
    return profile;
  }

  async verifyMyProfile(tenantId: string, userId: string) {
    const before = await this.myProfile(tenantId, userId);
    if (!before) throw new BadRequestException('Create a signature profile before verification');
    this.validateSignaturePayload({
      fullName: before.full_name,
      signatureMethod: before.signature_method,
      signatureText: before.signature_text,
      signatureImageKey: before.signature_image_key,
      signatureImageUrl: before.signature_image_url,
      signatureVectorJson: before.signature_vector_json,
      initials: before.initials
    } as SignatureProfileDto);
    const profile = await this.db.single<any>(
      this.db.from('user_signature_profiles')
        .update({ status: 'Active', verified_at: new Date().toISOString(), updated_by: userId, updated_at: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('id', before.id)
        .select()
        .single()
    );
    await this.createProfileVersion(tenantId, profile);
    await this.audit.write({ tenantId, actorId: userId, action: 'SIGNATURE_PROFILE_VERIFIED', entityType: 'SignatureProfile', entityId: profile.id, before: before as JsonValue, after: profile as JsonValue });
    return profile;
  }

  async disableMyProfile(tenantId: string, userId: string) {
    const before = await this.myProfile(tenantId, userId);
    if (!before) throw new NotFoundException('Signature profile not found');
    const profile = await this.db.single<any>(
      this.db.from('user_signature_profiles')
        .update({ status: 'Disabled', updated_by: userId, updated_at: new Date().toISOString() })
        .eq('id', before.id)
        .select()
        .single()
    );
    await this.audit.write({ tenantId, actorId: userId, action: 'SIGNATURE_PROFILE_DISABLED', entityType: 'SignatureProfile', entityId: profile.id, before: before as JsonValue, after: profile as JsonValue });
    return profile;
  }

  versions(tenantId: string, userId: string) {
    return this.db.many<any>(
      this.db.from('user_signature_profile_versions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .order('version', { ascending: false })
    );
  }

  async adminProfileStatus(tenantId: string, userId: string) {
    const profile = await this.db.single<any>(
      this.db.from('user_signature_profiles')
        .select('id,user_id,full_name,signature_method,initials,status,verified_at,updated_at')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .maybeSingle()
    );
    return profile ?? { user_id: userId, status: 'Not Created' };
  }

  async setPin(tenantId: string, userId: string, dto: SetSignaturePinDto) {
    if (dto.password) await this.assertPassword(userId, tenantId, dto.password);
    const pin = await this.db.single<any>(this.db.from('user_signature_pins').select('*').eq('tenant_id', tenantId).eq('user_id', userId).maybeSingle());
    const payload = {
      tenant_id: tenantId,
      company_id: await this.firstCompanyId(tenantId, userId),
      user_id: userId,
      pin_hash: await hash(dto.pin, 12),
      status: 'Active',
      failed_attempts: 0,
      locked_until: null,
      updated_at: new Date().toISOString()
    };
    const row = pin
      ? await this.db.single<any>(this.db.from('user_signature_pins').update(payload).eq('id', pin.id).select('id,user_id,status,failed_attempts,locked_until,created_at,updated_at').single())
      : await this.db.single<any>(this.db.from('user_signature_pins').insert({ id: crypto.randomUUID(), ...payload }).select('id,user_id,status,failed_attempts,locked_until,created_at,updated_at').single());
    await this.audit.write({ tenantId, actorId: userId, action: pin ? 'SIGNATURE_PIN_CHANGED' : 'SIGNATURE_PIN_SET', entityType: 'SignaturePin', entityId: row.id, after: { status: row.status } });
    return row;
  }

  async changePin(tenantId: string, userId: string, dto: ChangeSignaturePinDto) {
    await this.verifyPin(tenantId, userId, { pin: dto.currentPin });
    return this.setPin(tenantId, userId, { pin: dto.newPin });
  }

  async verifyPin(tenantId: string, userId: string, dto: VerifySignaturePinDto) {
    const row = await this.db.single<any>(this.db.from('user_signature_pins').select('*').eq('tenant_id', tenantId).eq('user_id', userId).maybeSingle());
    if (!row || row.status !== 'Active') throw new UnauthorizedException('Signature PIN is not active');
    if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) throw new ForbiddenException('Signature PIN is temporarily locked');
    const valid = await compare(dto.pin, row.pin_hash);
    if (!valid) {
      const failed = Number(row.failed_attempts ?? 0) + 1;
      const lockedUntil = failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
      await this.db.single(this.db.from('user_signature_pins').update({ failed_attempts: failed, locked_until: lockedUntil, status: lockedUntil ? 'Locked' : 'Active', updated_at: new Date().toISOString() }).eq('id', row.id).select('id').single());
      await this.audit.write({ tenantId, actorId: userId, action: 'SIGNATURE_PIN_VERIFY_FAILED', entityType: 'SignaturePin', entityId: row.id, metadata: { failedAttempts: failed, locked: Boolean(lockedUntil) } });
      throw new UnauthorizedException('Invalid signature PIN');
    }
    await this.db.single(this.db.from('user_signature_pins').update({ failed_attempts: 0, locked_until: null, status: 'Active', updated_at: new Date().toISOString() }).eq('id', row.id).select('id').single());
    await this.audit.write({ tenantId, actorId: userId, action: 'SIGNATURE_PIN_VERIFIED', entityType: 'SignaturePin', entityId: row.id });
    return { verified: true };
  }

  requirements(tenantId: string, query: Record<string, string | undefined>) {
    let builder = this.db.from('signature_requirements').select('*').eq('tenant_id', tenantId).eq('active', true);
    if (query.moduleName) builder = builder.eq('module_name', query.moduleName);
    if (query.recordType) builder = builder.eq('record_type', query.recordType);
    if (query.actionType) builder = builder.eq('action_type', query.actionType);
    if (query.siteId) builder = builder.eq('site_id', query.siteId);
    return this.db.many<any>(builder.order('sequence_order'));
  }

  async createRequirement(tenantId: string, actorId: string, dto: SignatureRequirementDto) {
    const row = await this.db.single<any>(
      this.db.from('signature_requirements').insert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: dto.companyId ?? null,
        site_id: dto.siteId ?? null,
        module_name: dto.moduleName,
        record_type: dto.recordType,
        action_type: dto.actionType,
        signature_role: dto.signatureRole,
        required_permission: dto.requiredPermission ?? null,
        required: dto.required ?? true,
        sequence_order: dto.sequenceOrder ?? 1,
        can_delegate: dto.canDelegate ?? true,
        requires_independent_signer: dto.requiresIndependentSigner ?? false,
        blocks_action_until_signed: dto.blocksActionUntilSigned ?? true,
        declaration_text: dto.declarationText ?? 'I confirm that I have reviewed the information above and approve this action using my electronic signature.'
      }).select().single()
    );
    await this.audit.write({ tenantId, actorId, action: 'SIGNATURE_REQUIREMENT_CREATED', entityType: 'SignatureRequirement', entityId: row.id, after: row as JsonValue });
    return row;
  }

  async updateRequirement(tenantId: string, actorId: string, id: string, dto: Partial<SignatureRequirementDto>) {
    const before = await this.db.single<any>(this.db.from('signature_requirements').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!before) throw new NotFoundException('Signature requirement not found');
    const row = await this.db.single<any>(
      this.db.from('signature_requirements').update({
        company_id: dto.companyId ?? before.company_id,
        site_id: dto.siteId ?? before.site_id,
        module_name: dto.moduleName ?? before.module_name,
        record_type: dto.recordType ?? before.record_type,
        action_type: dto.actionType ?? before.action_type,
        signature_role: dto.signatureRole ?? before.signature_role,
        required_permission: dto.requiredPermission ?? before.required_permission,
        required: dto.required ?? before.required,
        sequence_order: dto.sequenceOrder ?? before.sequence_order,
        can_delegate: dto.canDelegate ?? before.can_delegate,
        requires_independent_signer: dto.requiresIndependentSigner ?? before.requires_independent_signer,
        blocks_action_until_signed: dto.blocksActionUntilSigned ?? before.blocks_action_until_signed,
        declaration_text: dto.declarationText ?? before.declaration_text,
        updated_at: new Date().toISOString()
      }).eq('id', id).select().single()
    );
    await this.audit.write({ tenantId, actorId, action: 'SIGNATURE_REQUIREMENT_UPDATED', entityType: 'SignatureRequirement', entityId: id, before: before as JsonValue, after: row as JsonValue });
    return row;
  }

  async deleteRequirement(tenantId: string, actorId: string, id: string) {
    const row = await this.db.single<any>(this.db.from('signature_requirements').update({ active: false, updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).select().single());
    await this.audit.write({ tenantId, actorId, action: 'SIGNATURE_REQUIREMENT_DISABLED', entityType: 'SignatureRequirement', entityId: id, after: row as JsonValue });
    return row;
  }

  records(tenantId: string) {
    return this.db.many<any>(this.db.from('electronic_signatures').select('*').eq('tenant_id', tenantId).order('signed_at', { ascending: false }).limit(200));
  }

  record(tenantId: string, id: string) {
    return this.db.single<any>(this.db.from('electronic_signatures').select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
  }

  forRecord(tenantId: string, moduleName: string, recordType: string, recordId: string) {
    return this.db.many<any>(
      this.db.from('electronic_signatures')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('module_name', moduleName)
        .eq('record_type', recordType)
        .eq('record_id', recordId)
        .order('signed_at', { ascending: true })
    );
  }

  async sign(tenantId: string, userId: string, dto: SignElectronicSignatureDto, meta: RequestMeta = {}) {
    const user = await this.db.single<any>(this.db.from('User').select('*').eq('tenantId', tenantId).eq('id', userId).maybeSingle());
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Active user session is required for electronic signature');
    if (user.email.toLowerCase() !== dto.usernameReentry.trim().toLowerCase() && user.displayName.toLowerCase() !== dto.usernameReentry.trim().toLowerCase()) {
      await this.audit.write({ tenantId, actorId: userId, action: 'SIGNATURE_AUTH_FAILED', entityType: 'ElectronicSignature', metadata: { moduleName: dto.moduleName, recordType: dto.recordType, recordId: dto.recordId, reason: 'username_reentry' } });
      throw new UnauthorizedException('Username re-entry does not match the active user');
    }
    if (dto.authMethod === 'password') await this.assertPassword(userId, tenantId, dto.passwordOrPin);
    if (dto.authMethod === 'pin') await this.verifyPin(tenantId, userId, { pin: dto.passwordOrPin });

    const profile = await this.myProfile(tenantId, userId);
    if (!profile || profile.status !== 'Active') throw new BadRequestException('An active verified signature profile is required before signing');
    const version = await this.latestProfileVersion(tenantId, profile.id);
    const requirement = await this.findRequirement(tenantId, dto);
    await this.assertSigningPermission(userId, tenantId, requirement?.required_permission ?? this.defaultPermission(dto));
    await this.assertSignerAuthority(tenantId, userId, user, dto);
    await this.assertSignatureSequence(tenantId, dto, requirement);
    await this.assertIndependentSigner(tenantId, userId, dto, requirement);

    const signedPayload = {
      tenantId,
      userId,
      moduleName: dto.moduleName,
      recordType: dto.recordType,
      recordId: dto.recordId,
      recordNumber: dto.recordNumber ?? null,
      actionType: dto.actionType,
      signatureRole: dto.signatureRole,
      signedAt: new Date().toISOString(),
      profileVersionId: version?.id ?? null
    };
    const signedPayloadHash = sha256(JSON.stringify(signedPayload));
    const signatureHash = sha256(`${signedPayloadHash}:${profile.id}:${version?.id ?? ''}:${userId}:${dto.recordHashBeforeSigning ?? ''}`);
    const signature = await this.db.single<any>(
      this.db.from('electronic_signatures').insert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: profile.company_id ?? null,
        site_id: (dto.metadata?.siteId as string | undefined) ?? null,
        user_id: userId,
        signature_profile_id: profile.id,
        signature_profile_version_id: version?.id ?? null,
        module_name: dto.moduleName,
        record_type: dto.recordType,
        record_id: dto.recordId,
        record_number: dto.recordNumber ?? null,
        action_type: dto.actionType,
        signature_role: dto.signatureRole,
        declaration_text: dto.declarationText ?? requirement?.declaration_text ?? null,
        signature_snapshot_method: profile.signature_method,
        signature_snapshot_text: profile.signature_text,
        signature_snapshot_image_key: profile.signature_image_key,
        signature_snapshot_image_url: profile.signature_image_url,
        signature_snapshot_vector_json: profile.signature_vector_json,
        signer_full_name: profile.full_name,
        signer_job_title: profile.job_title ?? user.title ?? null,
        signer_department: profile.department_name ?? user.department ?? null,
        ip_address: meta.ipAddress ?? null,
        user_agent: meta.userAgent ?? null,
        auth_method: dto.authMethod,
        auth_result: 'Passed',
        signature_hash: signatureHash,
        record_hash_before_signing: dto.recordHashBeforeSigning ?? null,
        signed_payload_hash: signedPayloadHash,
        status: 'Signed',
        metadata: { ...(dto.metadata ?? {}), comment: dto.comment ?? null }
      }).select().single()
    );
    await this.audit.write({ tenantId, actorId: userId, action: 'ELECTRONIC_SIGNATURE_COMPLETED', entityType: 'ElectronicSignature', entityId: signature.id, after: { ...signature, signature_snapshot_vector_json: '[snapshot]' } as JsonValue, metadata: { moduleName: dto.moduleName, recordType: dto.recordType, recordId: dto.recordId, ipAddress: meta.ipAddress ?? null, userAgent: meta.userAgent ?? null } });
    await this.writeModuleHistory(tenantId, userId, signature);
    await this.notifications.notifyUser({ tenantId, userId, type: 'signature.completed', module: 'signature', title: 'Electronic signature completed', message: `${dto.moduleName} ${dto.recordNumber ?? dto.recordId} was signed.`, relatedRecordId: dto.recordId, relatedRecordType: dto.recordType, priority: 'Info' }).catch(() => null);
    return signature;
  }

  async reject(tenantId: string, userId: string, dto: RejectElectronicSignatureDto, meta: RequestMeta = {}) {
    await this.assertSigningPermission(userId, tenantId, this.defaultPermission(dto));
    const user = await this.db.single<any>(this.db.from('User').select('*').eq('tenantId', tenantId).eq('id', userId).maybeSingle());
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Active user session is required for electronic signature rejection');
    const profile = await this.myProfile(tenantId, userId);
    if (!profile || profile.status !== 'Active') throw new BadRequestException('An active verified signature profile is required before rejecting a signature');
    const version = await this.latestProfileVersion(tenantId, profile.id);
    const signedPayload = {
      tenantId,
      userId,
      moduleName: dto.moduleName,
      recordType: dto.recordType,
      recordId: dto.recordId,
      actionType: dto.actionType,
      signatureRole: dto.signatureRole,
      status: 'Rejected',
      signedAt: new Date().toISOString(),
      profileVersionId: version?.id ?? null
    };
    const row = await this.db.single<any>(
      this.db.from('electronic_signatures').insert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: profile.company_id ?? null,
        user_id: userId,
        signature_profile_id: profile.id,
        signature_profile_version_id: version?.id ?? null,
        module_name: dto.moduleName,
        record_type: dto.recordType,
        record_id: dto.recordId,
        action_type: dto.actionType,
        signature_role: dto.signatureRole,
        signature_snapshot_method: profile.signature_method,
        signature_snapshot_text: profile.signature_text,
        signature_snapshot_image_key: profile.signature_image_key,
        signature_snapshot_image_url: profile.signature_image_url,
        signature_snapshot_vector_json: profile.signature_vector_json,
        signer_full_name: profile.full_name,
        signer_job_title: profile.job_title ?? user.title ?? null,
        signer_department: profile.department_name ?? user.department ?? null,
        signed_at: new Date().toISOString(),
        ip_address: meta.ipAddress ?? null,
        user_agent: meta.userAgent ?? null,
        auth_method: 'session',
        auth_result: 'Rejected',
        signature_hash: sha256(`${sha256(JSON.stringify(signedPayload))}:${profile.id}:${version?.id ?? ''}:${userId}:rejected`),
        signed_payload_hash: sha256(JSON.stringify(signedPayload)),
        status: 'Rejected',
        rejection_reason: dto.rejectionReason
      }).select().single()
    );
    await this.audit.write({ tenantId, actorId: userId, action: 'ELECTRONIC_SIGNATURE_REJECTED', entityType: 'ElectronicSignature', entityId: row.id, after: row as JsonValue });
    return row;
  }

  async validateBeforeAction(tenantId: string, dto: ValidateBeforeActionDto) {
    const [requirements, signatures] = await Promise.all([
      this.requirements(tenantId, { moduleName: dto.moduleName, recordType: dto.recordType, actionType: dto.actionType }),
      this.forRecord(tenantId, dto.moduleName, dto.recordType, dto.recordId)
    ]);
    const signedKeys = new Set(signatures.filter((row) => row.status === 'Signed').map((row) => `${row.action_type}:${row.signature_role}`));
    const missing = requirements
      .filter((req) => req.required && req.blocks_action_until_signed)
      .filter((req) => !signedKeys.has(`${req.action_type}:${req.signature_role}`))
      .map((req) => req.signature_role);
    return { valid: missing.length === 0, missing, requirements, signatures };
  }

  private validateSignaturePayload(dto: SignatureProfileDto) {
    if (dto.signatureMethod === 'Type' && !dto.signatureText?.trim()) throw new BadRequestException('Typed signature text is required');
    if (dto.signatureMethod === 'Draw' && !dto.signatureVectorJson) throw new BadRequestException('Drawn signature vector is required');
    if (dto.signatureMethod === 'Upload' && !dto.signatureImageKey && !dto.signatureImageUrl) throw new BadRequestException('Uploaded signature image is required');
    if (dto.signatureMethod === 'Initials' && !dto.initials?.trim()) throw new BadRequestException('Initials are required');
  }

  private async createProfileVersion(tenantId: string, profile: any) {
    const latest = await this.db.single<any>(
      this.db.from('user_signature_profile_versions')
        .select('version')
        .eq('tenant_id', tenantId)
        .eq('signature_profile_id', profile.id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
    );
    return this.db.single<any>(
      this.db.from('user_signature_profile_versions').insert({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        signature_profile_id: profile.id,
        user_id: profile.user_id,
        company_id: profile.company_id,
        version: Number(latest?.version ?? 0) + 1,
        signature_method: profile.signature_method,
        signature_text: profile.signature_text,
        signature_image_key: profile.signature_image_key,
        signature_image_url: profile.signature_image_url,
        signature_vector_json: profile.signature_vector_json,
        initials: profile.initials,
        style_config: profile.style_config ?? {},
        status: profile.status
      }).select().single()
    );
  }

  private latestProfileVersion(tenantId: string, profileId: string) {
    return this.db.single<any>(
      this.db.from('user_signature_profile_versions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('signature_profile_id', profileId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()
    );
  }

  private async assertPassword(userId: string, tenantId: string, password: string) {
    if (!password?.trim()) throw new UnauthorizedException('Password confirmation is required');
    const user = await this.db.single<any>(this.db.from('User').select('id,passwordHash').eq('tenantId', tenantId).eq('id', userId).maybeSingle());
    if (!user?.passwordHash || !(await compare(password, user.passwordHash))) {
      await this.audit.write({ tenantId, actorId: userId, action: 'SIGNATURE_PASSWORD_AUTH_FAILED', entityType: 'User', entityId: userId });
      throw new UnauthorizedException('Password confirmation failed');
    }
  }

  private async assertSigningPermission(userId: string, tenantId: string, permission: string) {
    const result = await this.permissions.check(userId, tenantId, permission);
    const universal = await this.permissions.check(userId, tenantId, 'signature.sign');
    if (!result.allowed && !universal.allowed) throw new ForbiddenException(`Missing signature permission: ${permission}`);
  }

  private async assertSignerAuthority(tenantId: string, userId: string, user: any, dto: SignElectronicSignatureDto) {
    if (await this.recordAssignmentAllows(tenantId, userId, dto)) return;
    if (await this.userRoleAllows(tenantId, userId, user, dto.signatureRole)) return;
    await this.audit.write({
      tenantId,
      actorId: userId,
      action: 'SIGNATURE_ROLE_AUTHORITY_DENIED',
      entityType: 'ElectronicSignature',
      metadata: { moduleName: dto.moduleName, recordType: dto.recordType, recordId: dto.recordId, signatureRole: dto.signatureRole }
    });
    throw new ForbiddenException(`You are not assigned to sign as ${dto.signatureRole}`);
  }

  private async userRoleAllows(tenantId: string, userId: string, user: any, signatureRole: string) {
    const allowed = this.roleTokens(signatureRole);
    const roleAssignments = await this.db.many<any>(this.db.from('UserRole').select('roleId').eq('userId', userId)).catch(() => []);
    const roleIds = roleAssignments.map((assignment) => assignment.roleId).filter(Boolean);
    const roles = roleIds.length
      ? await this.db.many<any>(this.db.from('Role').select('id,key,name').eq('tenantId', tenantId).in('id', roleIds)).catch(() => [])
      : [];
    const userTokens = [
      user?.title,
      user?.department,
      ...roles.flatMap((role) => [role.key, role.name])
    ].map((value) => normalizeRole(value)).filter(Boolean);
    return userTokens.some((token) => allowed.has(token));
  }

  private async recordAssignmentAllows(tenantId: string, userId: string, dto: SignElectronicSignatureDto) {
    const moduleName = dto.moduleName.toLowerCase();
    if (moduleName === 'ptw') return this.ptwAssignmentAllows(tenantId, userId, dto);
    if (moduleName === 'moc') return this.mocAssignmentAllows(tenantId, userId, dto);
    if (moduleName === 'pssr') return this.pssrAssignmentAllows(tenantId, userId, dto);
    if (moduleName === 'lopa') return this.lopaAssignmentAllows(tenantId, userId, dto);
    return false;
  }

  private async lopaAssignmentAllows(tenantId: string, userId: string, dto: SignElectronicSignatureDto) {
    if (dto.recordType !== 'lopa_review') return false;
    const participantId = String(dto.metadata?.participantId ?? '');
    let query = this.db.from('lopa_review_participants')
      .select('id,user_id,review_role,signature_required,signature_status')
      .eq('tenant_id', tenantId)
      .eq('lopa_study_id', dto.recordId)
      .eq('user_id', userId)
      .eq('review_role', dto.signatureRole)
      .eq('signature_required', true);
    if (participantId) query = query.eq('id', participantId);
    const participant = await this.db.single<any>(query.maybeSingle()).catch(() => null);
    return !!participant && participant.signature_status !== 'Signed';
  }

  private async ptwAssignmentAllows(tenantId: string, userId: string, dto: SignElectronicSignatureDto) {
    const role = normalizeRole(dto.signatureRole);
    const permitId = String(dto.metadata?.permitId ?? (dto.recordType === 'permit' ? dto.recordId : ''));
    if (dto.recordType === 'shift_handover') {
      const handover = await this.db.single<any>(this.db.from('permit_shift_handovers').select('*').eq('tenant_id', tenantId).eq('id', dto.recordId).maybeSingle()).catch(() => null);
      if (handover) {
        if (['incomingperformingauthority', 'incomingsupervisor', 'permitreceiver'].includes(role) && handover.incoming_supervisor_id === userId) return true;
        if (['outgoingperformingauthority', 'outgoingsupervisor'].includes(role) && handover.outgoing_supervisor_id === userId) return true;
      }
    }
    if (!permitId) return false;
    const permit = await this.db.single<any>(this.db.from('permits').select('*').eq('tenant_id', tenantId).eq('id', permitId).maybeSingle()).catch(() => null);
    if (permit) {
      if (['requestor', 'permitrequestor'].includes(role) && [permit.requested_by, permit.created_by].includes(userId)) return true;
      if (['permitholder', 'performingauthority'].includes(role) && permit.holder_id === userId) return true;
      if (['issuingauthority', 'permitissuer', 'issuer'].includes(role) && permit.issuer_id === userId) return true;
      if (['closureauthority'].includes(role) && [permit.issuer_id, permit.holder_id].includes(userId)) return true;
    }
    const workforce = await this.db.many<any>(this.db.from('permit_workforce').select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).eq('user_id', userId)).catch(() => []);
    return workforce.some((worker) => {
      const workerRole = normalizeRole(worker.role_on_permit ?? worker.role);
      if (workerRole && this.roleTokens(dto.signatureRole).has(workerRole)) return true;
      if (role === 'permitholder' && worker.is_permit_holder) return true;
      if (role === 'permitissuer' && worker.is_permit_issuer) return true;
      if (role === 'gasstester' && worker.is_gas_tester) return true;
      if (role === 'isolatingauthority' && worker.is_isolation_authority) return true;
      return false;
    });
  }

  private async mocAssignmentAllows(tenantId: string, userId: string, dto: SignElectronicSignatureDto) {
    const mocId = String(dto.metadata?.mocId ?? dto.recordId);
    const moc = await this.db.single<any>(this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', mocId).maybeSingle()).catch(() => null);
    if (!moc) return false;
    const role = normalizeRole(dto.signatureRole);
    if (['originator', 'requestor'].includes(role) && moc.originator_id === userId) return true;
    const stakeholders = await this.db.many<any>(this.db.from('moc_stakeholders').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId).eq('user_id', userId)).catch(() => []);
    return stakeholders.length > 0;
  }

  private async pssrAssignmentAllows(tenantId: string, userId: string, dto: SignElectronicSignatureDto) {
    const pssrId = String(dto.metadata?.pssrId ?? dto.recordId);
    const pssr = await this.db.single<any>(this.db.from('pssrs').select('*').eq('tenant_id', tenantId).eq('id', pssrId).maybeSingle()).catch(() => null);
    if (!pssr) return false;
    const role = normalizeRole(dto.signatureRole);
    if (['originator', 'coordinator', 'pssrowner'].includes(role) && [pssr.originator_id, pssr.coordinator_id, pssr.owner_id].includes(userId)) return true;
    return false;
  }

  private roleTokens(signatureRole: string) {
    const normalized = normalizeRole(signatureRole);
    const aliases: Record<string, string[]> = {
      requestor: ['requestor', 'permitrequestor', 'originator'],
      performingauthority: ['performingauthority', 'permitholder', 'operationssupervisor', 'contractor'],
      incomingperformingauthority: ['incomingperformingauthority', 'incomingsupervisor', 'operationssupervisor', 'permitholder'],
      outgoingperformingauthority: ['outgoingperformingauthority', 'outgoingsupervisor', 'operationssupervisor', 'permitholder'],
      issuingauthority: ['issuingauthority', 'permitissuer'],
      isolatingauthority: ['isolatingauthority', 'isolationauthority', 'maintenancesupervisor'],
      gastester: ['gastester', 'hsemanager', 'hseengineer'],
      closureauthority: ['closureauthority', 'permitissuer', 'plantmanager', 'hsemanager'],
      approver: ['approver', 'plantmanager', 'hsemanager', 'processengineer', 'operationsmanager'],
      disciplinereviewer: ['disciplinereviewer', 'processengineer', 'maintenancesupervisor', 'operationssupervisor', 'hsemanager'],
      plantmanager: ['plantmanager']
    };
    return new Set([normalized, ...(aliases[normalized] ?? [])]);
  }

  private async findRequirement(tenantId: string, dto: { moduleName: string; recordType: string; actionType: string; signatureRole: string }) {
    return this.db.single<any>(
      this.db.from('signature_requirements')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('module_name', dto.moduleName)
        .eq('record_type', dto.recordType)
        .eq('action_type', dto.actionType)
        .eq('signature_role', dto.signatureRole)
        .eq('active', true)
        .order('sequence_order')
        .limit(1)
        .maybeSingle()
    );
  }

  private async assertSignatureSequence(tenantId: string, dto: SignElectronicSignatureDto, requirement: any) {
    if (!requirement) return;
    const previous = await this.db.many<any>(
      this.db.from('signature_requirements')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('module_name', dto.moduleName)
        .eq('record_type', dto.recordType)
        .eq('action_type', dto.actionType)
        .lt('sequence_order', requirement.sequence_order)
        .eq('required', true)
        .eq('active', true)
    );
    if (!previous.length) return;
    const signatures = await this.forRecord(tenantId, dto.moduleName, dto.recordType, dto.recordId);
    const signed = new Set(signatures.filter((row) => row.status === 'Signed').map((row) => row.signature_role));
    const missing = previous.filter((row) => !signed.has(row.signature_role));
    if (missing.length) throw new BadRequestException(`Previous signature required first: ${missing.map((row) => row.signature_role).join(', ')}`);
  }

  private async assertIndependentSigner(tenantId: string, userId: string, dto: SignElectronicSignatureDto, requirement: any) {
    if (!requirement?.requires_independent_signer) return;
    const signatures = await this.forRecord(tenantId, dto.moduleName, dto.recordType, dto.recordId);
    if (signatures.some((row) => row.user_id === userId && row.status === 'Signed')) throw new BadRequestException('Independent signer policy blocks the same user from signing this record again');
    if (dto.metadata?.originatorId === userId || dto.metadata?.createdBy === userId) throw new BadRequestException('Independent signer policy blocks self-signing');
  }

  private defaultPermission(input: { moduleName: string; recordType: string; actionType: string }) {
    const moduleName = input.moduleName.toLowerCase();
    if (moduleName === 'ptw' && input.recordType === 'shift_handover') return 'ptw.handover.sign';
    if (moduleName === 'ptw' && input.recordType === 'gas_test') return 'ptw.gas.sign';
    if (moduleName === 'ptw' && input.recordType === 'isolation') return 'ptw.isolation.sign';
    if (moduleName === 'ptw' && input.actionType === 'close') return 'ptw.close.sign';
    if (moduleName === 'ptw') return 'ptw.signatures.sign';
    if (moduleName === 'moc' && input.actionType === 'close') return 'moc.close.sign';
    if (moduleName === 'moc') return 'moc.approval.sign';
    if (moduleName === 'pssr' && input.recordType === 'discipline_signoff') return 'pssr.discipline_signoff.sign';
    if (moduleName === 'pssr' && input.recordType === 'certificate') return 'pssr.certificate.sign';
    if (moduleName === 'pssr') return 'pssr.authorization.sign';
    if (moduleName === 'lopa' && input.recordType === 'lopa_review') return 'lopa.review_signatures.sign';
    return 'signature.sign';
  }

  private async firstCompanyId(tenantId: string, userId: string) {
    const site = await this.db.single<any>(this.db.from('UserSite').select('companyId,site:Site(companyId)').eq('userId', userId).limit(1).maybeSingle()).catch(() => null);
    if (site?.companyId ?? site?.site?.companyId) return site.companyId ?? site.site.companyId;
    const company = await this.db.single<any>(this.db.from('Company').select('id').eq('tenantId', tenantId).limit(1).maybeSingle()).catch(() => null);
    return company?.id ?? null;
  }

  private async writeModuleHistory(tenantId: string, actorId: string, signature: any) {
    const message = `${signature.module_name} ${signature.record_type} ${signature.signature_role} signed by ${signature.signer_full_name}`;
    if (signature.module_name === 'PTW') {
      await this.db.single(this.db.from('permit_history').insert({ id: crypto.randomUUID(), tenant_id: tenantId, permit_id: signature.record_id, event_type: 'SIGNATURE_COMPLETED', event_title: message, event_description: signature.declaration_text, created_by: actorId }).select().single()).catch(() => null);
    }
    if (signature.module_name === 'MOC') {
      await this.db.single(this.db.from('moc_history').insert({ id: crypto.randomUUID(), tenant_id: tenantId, moc_id: signature.record_id, event_type: 'SIGNATURE_COMPLETED', title: message, description: signature.declaration_text, created_by: actorId }).select().single()).catch(() => null);
    }
    if (signature.module_name === 'PSSR') {
      await this.db.single(this.db.from('pssr_history').insert({ id: crypto.randomUUID(), tenant_id: tenantId, pssr_id: signature.record_id, event_type: 'SIGNATURE_COMPLETED', title: message, description: signature.declaration_text, created_by: actorId }).select().single()).catch(() => null);
    }
    if (signature.module_name === 'LOPA') {
      await this.db.single(this.db.from('lopa_history_events').insert({ id: crypto.randomUUID(), tenant_id: tenantId, lopa_study_id: signature.record_id, event_type: 'SIGNATURE_COMPLETED', title: message, description: signature.declaration_text, actor_id: actorId, severity: 'Info', metadata: { signatureId: signature.id, signatureRole: signature.signature_role } }).select().single()).catch(() => null);
    }
  }
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeRole(value: unknown) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
