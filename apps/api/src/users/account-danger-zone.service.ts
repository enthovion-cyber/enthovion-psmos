import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { UsersService } from './users.service';

@Injectable()
export class AccountDangerZoneService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly users: UsersService
  ) {}

  async createRequest(tenantId: string, userId: string, input: { requestType: 'deactivate' | 'delete' | 'leave_workspace'; reason?: string; confirmationText?: string; companyId?: string }) {
    if (!['deactivate', 'delete', 'leave_workspace'].includes(input.requestType)) throw new BadRequestException('Invalid account request type.');
    if (input.confirmationText !== 'I understand') throw new BadRequestException('Type "I understand" to confirm the account request.');
    const profile = await this.users.getProfile(userId);
    const roleKeys = new Set<string>((profile.userRoles ?? []).map((assignment: any) => assignment.role?.key).filter(Boolean));
    if (profile.id === 'user_imran_shah' || roleKeys.has('platform_admin') || roleKeys.has('super_admin')) {
      throw new ForbiddenException('Seed and super admin accounts cannot be deleted or deactivated through self-service.');
    }
    if (['delete', 'deactivate'].includes(input.requestType) && [...roleKeys].some((key) => ['corporate_admin', 'company_admin', 'site_admin'].includes(key))) {
      await this.assertNotLastAdmin(tenantId, userId);
    }
    const companyId = input.companyId ?? (profile.userSites ?? [])[0]?.companyId ?? (profile.userRoles ?? [])[0]?.companyId ?? null;
    const row = await this.db.single<any>(this.db.from('user_account_deletion_requests').insert({
      id: crypto.randomUUID(),
      user_id: userId,
      company_id: companyId,
      request_type: input.requestType,
      status: 'pending',
      reason: input.reason ?? null,
      requested_by: userId,
      metadata_json: { preservedAuditTrail: true, source: 'profile-danger-zone' },
      updated_at: new Date().toISOString()
    }).select().single());
    await this.audit.write({
      tenantId,
      actorId: userId,
      action: `ACCOUNT_${input.requestType.toUpperCase()}_REQUESTED`,
      entityType: 'User',
      entityId: userId,
      after: { requestId: row?.id, requestType: input.requestType, companyId, retentionRequired: true } as JsonValue
    });
    return row;
  }

  async myRequests(userId: string) {
    return this.db.many<any>(this.db.from('user_account_deletion_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false })).catch(() => []);
  }

  private async assertNotLastAdmin(tenantId: string, userId: string) {
    const admins = await this.db.many<any>(
      this.db.from('UserRole')
        .select('userId,role:Role!inner(key,tenantId)')
        .eq('role.tenantId', tenantId)
        .in('role.key', ['corporate_admin', 'company_admin', 'site_admin', 'platform_admin', 'super_admin'])
    ).catch(() => []);
    const otherAdminIds = [...new Set(admins.map((row) => row.userId).filter((id) => id && id !== userId))];
    if (!otherAdminIds.length) throw new BadRequestException('Cannot request deletion or deactivation because you are the last Company Admin.');
  }
}
