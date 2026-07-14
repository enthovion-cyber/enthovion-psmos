import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

type GeneratedAction = {
  id?: string;
  ruleId: string;
  impactArea: string;
  questionKey: string;
  sourceImpactAnswer: string;
  title: string;
  description: string;
  linkedModule: string;
  ownerRoleId?: string | null;
  dueDate: string;
  dueDateRule: string;
  requiredBeforeApproval: boolean;
  requiredBeforeStartup: boolean;
  requiredBeforeClosure: boolean;
  evidenceRequired: boolean;
  verificationRequired: boolean;
  priority: string;
  status: string;
  actionId?: string | null;
};

@Injectable()
export class MocImpactActionGeneratorService {
  constructor(private readonly db: SupabaseService) {}

  async generate(tenantId: string, moc: any, answers: Record<string, any>): Promise<GeneratedAction[]> {
    const [rules, existing, links] = await Promise.all([
      this.db.many<any>(
        this.db.from('moc_generated_action_rules')
          .select('*')
          .eq('is_active', true)
          .or(`tenant_id.is.null,tenant_id.eq.${tenantId}`)
      ),
      this.db.many<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', moc.id)),
      this.db.many<any>(this.db.from('moc_generated_action_links').select('*').eq('tenant_id', tenantId).eq('moc_id', moc.id))
    ]);

    const generated = rules
      .filter((rule) => this.matches(answers[rule.question_key], rule.trigger_value))
      .map((rule) => {
        const current = existing.find((item) => item.source_impact_answer === rule.question_key || item.action_type === rule.linked_module || item.title === rule.action_title_template);
        const link = links.find((item) => item.generated_from_rule_id === rule.id);
        return {
          ruleId: rule.id,
          impactArea: rule.impact_area,
          questionKey: rule.question_key,
          sourceImpactAnswer: rule.question_key,
          title: this.render(rule.action_title_template, moc, answers),
          description: this.render(rule.action_description_template, moc, answers),
          linkedModule: rule.linked_module,
          ownerRoleId: rule.owner_role_id,
          dueDate: this.dueDate(rule.due_date_rule),
          dueDateRule: rule.due_date_rule,
          requiredBeforeApproval: Boolean(rule.required_before_approval),
          requiredBeforeStartup: Boolean(rule.required_before_startup),
          requiredBeforeClosure: Boolean(rule.required_before_closure),
          evidenceRequired: Boolean(rule.evidence_required),
          verificationRequired: Boolean(rule.verification_required),
          priority: rule.priority_rule ?? 'MEDIUM',
          status: current?.action_id ? this.statusFromAction(current.status) : link?.status ?? current?.status ?? 'New',
          actionId: current?.action_id ?? link?.action_id ?? null
        };
      });
    return generated;
  }

  async upsertPreviewRows(tenantId: string, actorId: string, moc: any, actions: GeneratedAction[]) {
    const existing = await this.db.many<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', moc.id).eq('system_generated', true));
    for (const current of existing) {
      if (!actions.some((item) => item.questionKey === current.source_impact_answer)) {
        await this.db.single(this.db.from('moc_required_actions').update({
          required: false,
          status: current.action_id ? current.status : 'No Longer Required',
          updated_at: new Date().toISOString()
        }).eq('tenant_id', tenantId).eq('id', current.id).select().single());
      }
    }
    const inserts = actions
      .filter((item) => !existing.some((current) => current.source_impact_answer === item.questionKey))
      .map((item) => ({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        company_id: moc.company_id,
        site_id: moc.site_id,
        moc_id: moc.id,
        action_type: item.linkedModule,
        title: item.title,
        description: item.description,
        priority: item.priority,
        required: true,
        system_generated: true,
        status: 'Preview',
        linked_module: item.linkedModule,
        owner_id: null,
        due_date: item.dueDate,
        evidence_status: 'Not Uploaded',
        verification_status: 'Not Verified',
        required_before_startup: item.requiredBeforeStartup,
        required_before_closure: item.requiredBeforeClosure,
        source_impact_answer: item.questionKey,
        created_by: actorId
      }));
    if (inserts.length) await this.db.many(this.db.from('moc_required_actions').insert(inserts).select());
  }

  private matches(answer: unknown, triggerValue: string) {
    if (triggerValue === 'true') return answer === true;
    if (triggerValue === 'false') return answer === false;
    return String(answer) === triggerValue;
  }

  private render(template: string, moc: any, answers: Record<string, any>) {
    return template
      .replaceAll('{{moc_number}}', moc.moc_number ?? '')
      .replaceAll('{{title}}', moc.title ?? '')
      .replaceAll('{{primaryEquipment}}', answers.primaryEquipmentAffected ?? 'affected equipment');
  }

  private dueDate(rule: string) {
    const match = /^(\d+)d$/.exec(rule ?? '');
    const days = match ? Number(match[1]) : 14;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private statusFromAction(status?: string) {
    if (status === 'CLOSED') return 'Completed';
    if (status === 'IN_PROGRESS' || status === 'PENDING_VERIFICATION') return 'In Progress';
    return status ? 'Existing' : 'New';
  }
}
