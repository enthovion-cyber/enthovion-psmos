import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;

@Injectable()
export class AuditPlanReadinessService {
  constructor(private readonly db: SupabaseService) {}

  async run(plan: Row) {
    const [scopes, standards, modules, team, conflicts] = await Promise.all([
      this.rows('audit_plan_scopes', plan), this.rows('audit_plan_standards', plan), this.rows('audit_plan_modules', plan), this.rows('audit_plan_team_members', plan), this.rows('audit_plan_conflicts', plan)
    ]);
    const checks = [
      this.check('program', 'Program or standalone reason', Boolean(plan.program_id || (plan.standalone_audit && plan.standalone_reason)), true),
      this.check('scope', 'Audit scope', scopes.length > 0, true),
      this.check('standards', 'Standards / regulations', standards.length > 0 || plan.plan_category === 'Internal Only', true),
      this.check('modules', 'Modules covered', modules.length > 0, true),
      this.check('lead', 'Lead auditor', Boolean(plan.lead_auditor_user_id), true),
      this.check('team', 'Audit team', team.length > 0 || !['Safety-Critical','Regulatory-Critical','PSM-Critical'].includes(plan.criticality), ['Safety-Critical','Regulatory-Critical','PSM-Critical'].includes(plan.criticality)),
      this.check('dates', 'Planned dates', Boolean(plan.planned_start_at && plan.planned_end_at), true),
      this.check('conflicts', 'No unresolved hard conflicts', !conflicts.some((item) => item.severity === 'Hard Conflict' && !['Resolved','Override Approved'].includes(item.conflict_status)), true),
      this.check('approval', 'Approval route', plan.plan_status !== 'Pending Approval', false)
    ];
    const blocking = checks.filter((item) => item.blocking && item.check_status !== 'Complete');
    const missing = blocking[0]?.check_key;
    const health = missing === 'program' ? 'Missing Program' : missing === 'scope' ? 'Missing Scope' : missing === 'standards' ? 'Missing Standards' : missing === 'modules' ? 'Missing Modules' : missing === 'lead' ? 'Missing Lead Auditor' : missing === 'team' ? 'Missing Team' : missing === 'dates' ? 'Missing Dates' : missing === 'conflicts' ? 'Conflict Detected' : plan.plan_status === 'Pending Approval' ? 'Pending Approval' : 'Ready For Checklist';
    await this.db.single(this.db.from('audit_plan_readiness_checks').delete().eq('company_id', plan.company_id).eq('plan_id', plan.id).select('id')).catch(() => null);
    await this.db.many(this.db.from('audit_plan_readiness_checks').insert(checks.map((item) => ({ id: crypto.randomUUID(), company_id: plan.company_id, site_id: plan.site_id, plan_id: plan.id, ...item, evaluated_at: new Date().toISOString() }))).select()).catch(() => []);
    await this.db.single(this.db.from('audit_plans').update({ readiness_health: health, ready_for_checklist: health === 'Ready For Checklist', updated_at: new Date().toISOString() }).eq('company_id', plan.company_id).eq('id', plan.id).select('id').single());
    return { health, readyForChecklist: health === 'Ready For Checklist', blockers: blocking, checks };
  }

  private rows(table: string, plan: Row) { return this.db.many<Row>(this.db.from(table).select('*').eq('company_id', plan.company_id).eq('plan_id', plan.id)); }
  private check(key: string, label: string, complete: boolean, blocking: boolean) { return { check_key: key, check_label: label, check_status: complete ? 'Complete' : 'Missing', blocking, reason: complete ? null : `${label} is required before scheduling.` }; }
}
