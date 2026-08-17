import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { SupabaseService } from '../database/supabase.service';
import { AuditProgramHistoryService } from './audit-program-history.service';

type Row = Record<string, any>;

@Injectable()
export class AuditSettingsService {
  constructor(private readonly db: SupabaseService, private readonly history: AuditProgramHistoryService) {}

  async get(user: RequestUser, siteId?: string | null) {
    const targetSiteId = this.assertSiteScope(user, siteId ?? user.selectedSiteId ?? null);
    const row = await this.db.single<Row>(this.db.from('audit_module_settings').select('*').eq('company_id', user.tenantId).eq('site_id', targetSiteId).maybeSingle()).catch(() => null);
    return row ?? this.defaults(user.tenantId, targetSiteId);
  }

  async summary(user: RequestUser) {
    const permissionRows = await this.db.many<Row>(
      this.db.from('Permission').select('key,moduleKey,label').eq('tenantId', user.tenantId).like('key', 'audit.%'),
    ).catch(() => []);
    const groups = permissionRows.reduce<Record<string, number>>((acc, row) => {
      const group = String(row.key ?? '').split('.').slice(0, 2).join('.') || 'audit.unknown';
      acc[group] = (acc[group] ?? 0) + 1;
      return acc;
    }, {});
    const requiredRoutes = [
      '/audit-compliance',
      '/audit-compliance/dashboard',
      '/audit-compliance/programs',
      '/audit-compliance/plans',
      '/audit-compliance/checklists',
      '/audit-compliance/execution',
      '/audit-compliance/findings',
      '/audit-compliance/capa',
      '/audit-compliance/evidence',
      '/audit-compliance/scoring',
      '/audit-compliance/standards-mapping',
      '/audit-compliance/review-approval',
      '/audit-compliance/reports',
      '/audit-compliance/history',
      '/audit-compliance/settings',
    ];
    return {
      companyId: user.tenantId,
      selectedSiteId: user.selectedSiteId ?? null,
      allowedSiteIds: user.siteIds ?? [],
      corporateView: Boolean(user.corporateView || user.isSuperAdmin || user.isCompanyAdmin),
      permissionGroups: groups,
      totalAuditPermissions: permissionRows.length,
      navigation: requiredRoutes.map((route) => ({ route, guarded: true, directRefreshSupported: true })),
      hardening: {
        backendSourceOfTruth: true,
        frontendStatusCalculationAllowed: false,
        tenantIsolationEnforcedByApi: true,
        siteScopeValidatedForSettings: true,
        mutationHistoryRequired: true,
      },
    };
  }

  async update(user: RequestUser, dto: Row) {
    const siteId = this.assertSiteScope(user, dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? null);
    const before = await this.get(user, siteId);
    const patch = {
      ...before,
      id: before.id ?? crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: siteId,
      default_program_review_frequency: dto.defaultProgramReviewFrequency ?? dto.default_program_review_frequency ?? before.default_program_review_frequency ?? 'Annual',
      require_standards_for_activation: dto.requireStandardsForActivation ?? dto.require_standards_for_activation ?? before.require_standards_for_activation ?? true,
      require_scope_for_activation: dto.requireScopeForActivation ?? dto.require_scope_for_activation ?? before.require_scope_for_activation ?? true,
      require_owner_for_activation: dto.requireOwnerForActivation ?? dto.require_owner_for_activation ?? before.require_owner_for_activation ?? true,
      require_reviewer_for_safety_critical: dto.requireReviewerForSafetyCritical ?? dto.require_reviewer_for_safety_critical ?? before.require_reviewer_for_safety_critical ?? true,
      require_reviewer_for_regulatory_critical: dto.requireReviewerForRegulatoryCritical ?? dto.require_reviewer_for_regulatory_critical ?? before.require_reviewer_for_regulatory_critical ?? true,
      auto_calculate_configuration_health: dto.autoCalculateConfigurationHealth ?? dto.auto_calculate_configuration_health ?? before.auto_calculate_configuration_health ?? true,
      auto_mark_review_overdue: dto.autoMarkReviewOverdue ?? dto.auto_mark_review_overdue ?? before.auto_mark_review_overdue ?? true,
      enable_review_approval_for_program_activation: dto.enableReviewApprovalForProgramActivation ?? dto.enable_review_approval_for_program_activation ?? before.enable_review_approval_for_program_activation ?? false,
      include_archived_in_dashboard: dto.includeArchivedInDashboard ?? dto.include_archived_in_dashboard ?? before.include_archived_in_dashboard ?? false,
      settings_json: dto.settingsJson ?? dto.settings_json ?? before.settings_json ?? {},
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
    const saved = await this.db.single<Row>(this.db.from('audit_module_settings').upsert(patch).select().single());
    await this.history.write({ tenantId: user.tenantId, actorId: user.id, siteId, type: 'Settings Updated', title: 'Audit module settings updated', before, after: saved });
    return saved;
  }

  private defaults(companyId: string, siteId: string | null) {
    return {
      id: null,
      company_id: companyId,
      site_id: siteId,
      default_program_review_frequency: 'Annual',
      require_standards_for_activation: true,
      require_scope_for_activation: true,
      require_owner_for_activation: true,
      require_reviewer_for_safety_critical: true,
      require_reviewer_for_regulatory_critical: true,
      auto_calculate_configuration_health: true,
      auto_mark_review_overdue: true,
      enable_review_approval_for_program_activation: false,
      include_archived_in_dashboard: false,
      settings_json: {}
    };
  }

  private assertSiteScope(user: RequestUser, siteId: string | null) {
    if (!siteId) return null;
    if (user.corporateView || user.isSuperAdmin || user.isCompanyAdmin) return siteId;
    if (user.selectedSiteId && user.selectedSiteId !== siteId) throw new ForbiddenException('Selected site is outside the active Audit settings scope.');
    if (user.siteIds?.length && !user.siteIds.includes(siteId)) throw new ForbiddenException('Site is outside your permitted Audit settings scope.');
    if (!user.siteIds?.length) throw new BadRequestException('No site access is available for Audit settings.');
    return siteId;
  }
}
