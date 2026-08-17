import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

type Row = Record<string, any>;

@Injectable()
export class AuditPlanConflictService {
  constructor(private readonly db: SupabaseService) {}

  async detect(plan: Row) {
    await this.db.single(this.db.from('audit_plan_conflicts').delete().eq('company_id', plan.company_id).eq('plan_id', plan.id).in('conflict_status', ['Potential Conflict','Hard Conflict','Needs Review']).select('id')).catch(() => null);
    if (!plan.planned_start_at || !plan.planned_end_at) return [];
    let query = this.db.from('audit_plans').select('id,plan_code,plan_title,site_id,lead_auditor_user_id,planned_start_at,planned_end_at').eq('company_id', plan.company_id).neq('id', plan.id).lt('planned_start_at', plan.planned_end_at).gt('planned_end_at', plan.planned_start_at).not('plan_status', 'in', '(Cancelled,Archived)');
    const overlaps = await this.db.many<Row>(query);
    const conflicts = overlaps.flatMap((other) => {
      const rows: Row[] = [];
      if (plan.lead_auditor_user_id && other.lead_auditor_user_id === plan.lead_auditor_user_id) rows.push(this.row(plan, other, 'Lead Auditor Double-Booked', 'Hard Conflict'));
      if (plan.site_id && other.site_id === plan.site_id) rows.push(this.row(plan, other, 'Overlapping Site Audit', 'Potential Conflict'));
      return rows;
    });
    if (conflicts.length) await this.db.many(this.db.from('audit_plan_conflicts').insert(conflicts).select());
    const status = conflicts.some((item) => item.severity === 'Hard Conflict') ? 'Hard Conflict' : conflicts.length ? 'Potential Conflict' : 'No Conflict';
    await this.db.single(this.db.from('audit_plans').update({ conflict_status: status }).eq('company_id', plan.company_id).eq('id', plan.id).select('id').single());
    return conflicts;
  }

  private row(plan: Row, other: Row, type: string, severity: string) { return { id: crypto.randomUUID(), company_id: plan.company_id, site_id: plan.site_id, plan_id: plan.id, conflict_type: type, conflict_status: severity, severity, title: type, description: `Schedule overlaps ${other.plan_code} - ${other.plan_title}.`, related_record_type: 'audit_plan', related_record_id: other.id, detected_at: new Date().toISOString() }; }
}
