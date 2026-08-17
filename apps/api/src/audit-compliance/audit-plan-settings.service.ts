import { Injectable } from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";

type Row = Record<string, any>;
@Injectable()
export class AuditPlanSettingsService {
  constructor(private readonly db: SupabaseService) {}
  async get(user: RequestUser, siteId?: string | null) {
    const target = siteId ?? user.selectedSiteId ?? null;
    let query: any = this.db
      .from("audit_plan_settings")
      .select("*")
      .eq("company_id", user.tenantId);
    query = target ? query.eq("site_id", target) : query.is("site_id", null);
    return (
      (await this.db.single<Row>(query.maybeSingle()).catch(() => null)) ?? {
        company_id: user.tenantId,
        site_id: target,
        allow_standalone_audits: true,
        require_scope_for_schedule: true,
        require_standards_for_schedule: true,
        require_modules_for_schedule: true,
        require_lead_auditor_for_schedule: true,
        require_team_for_safety_critical: true,
        hard_conflicts_block_schedule: true,
        require_approval_before_checklist: false,
        due_soon_days: 14,
        settings_json: {},
      }
    );
  }
  async update(user: RequestUser, dto: Row) {
    const before = await this.get(user, dto.siteId ?? null);
    return this.db.single<Row>(
      this.db
        .from("audit_plan_settings")
        .upsert({
          ...before,
          ...this.snake(dto),
          id: before.id ?? crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: dto.siteId ?? user.selectedSiteId ?? null,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single(),
    );
  }
  private snake(dto: Row) {
    return {
      allow_standalone_audits: dto.allowStandaloneAudits,
      require_scope_for_schedule: dto.requireScopeForSchedule,
      require_standards_for_schedule: dto.requireStandardsForSchedule,
      require_modules_for_schedule: dto.requireModulesForSchedule,
      require_lead_auditor_for_schedule: dto.requireLeadAuditorForSchedule,
      require_team_for_safety_critical: dto.requireTeamForSafetyCritical,
      hard_conflicts_block_schedule: dto.hardConflictsBlockSchedule,
      require_approval_before_checklist: dto.requireApprovalBeforeChecklist,
      due_soon_days: dto.dueSoonDays,
      settings_json: dto.settingsJson ?? {},
    };
  }
}
