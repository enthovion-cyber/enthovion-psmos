import { Injectable } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { SupabaseService } from '../database/supabase.service';

type Requirement = {
  reviewType: string;
  title: string;
  description: string;
  source: string;
  requiredBeforeApproval: boolean;
  requiredBeforeStartup: boolean;
  ownerRole: string;
  evidenceRequired: boolean;
  verificationRequired: boolean;
};

@Injectable()
export class MocRiskReviewRequirementService {
  constructor(private readonly db: SupabaseService, private readonly actions: ActionsService) {}

  async list(tenantId: string, moc: any, risk: any) {
    const generated = await this.generate(tenantId, moc, risk);
    const existing = await this.db.many<any>(this.db.from('moc_risk_review_requirements').select('*').eq('tenant_id', tenantId).eq('moc_id', moc.id).order('review_type'));
    return generated.map((item) => existing.find((row) => row.review_type === item.reviewType && row.source === item.source) ?? this.previewRow(moc, risk, item));
  }

  async apply(tenantId: string, actorId: string, moc: any, risk: any) {
    const generated = await this.generate(tenantId, moc, risk);
    const rows = [];
    for (const item of generated) {
      const row = await this.db.single<any>(this.db.from('moc_risk_review_requirements').upsert({
        id: `${moc.id}_${item.source}_${item.reviewType}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
        tenant_id: tenantId,
        company_id: moc.company_id,
        site_id: moc.site_id,
        moc_id: moc.id,
        risk_assessment_id: risk.id,
        review_type: item.reviewType,
        title: item.title,
        description: item.description,
        source: item.source,
        required: true,
        required_before_approval: item.requiredBeforeApproval,
        required_before_startup: item.requiredBeforeStartup,
        owner_role: item.ownerRole,
        due_date: this.dueDate(item.requiredBeforeApproval ? 7 : 14),
        evidence_required: item.evidenceRequired,
        verification_required: item.verificationRequired,
        metadata: { riskLevel: risk.risk_level, riskScore: risk.total_score },
        created_by: actorId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'moc_id,review_type,source' }).select().single());
      if (!row.action_id) {
        const action = await this.actions.create(tenantId, actorId, {
          title: item.title,
          description: item.description,
          sourceModule: 'MOC',
          sourceType: 'MOC Risk Review',
          sourceRecordId: moc.id,
          priority: risk.risk_level === 'Critical' ? 'SAFETY_CRITICAL' : risk.risk_level === 'High' ? 'HIGH' : 'MEDIUM',
          ownerId: moc.originator_id ?? actorId,
          siteId: moc.site_id,
          departmentId: moc.department_id,
          dueDate: this.dueDate(item.requiredBeforeApproval ? 7 : 14),
          evidenceRequired: item.evidenceRequired,
          verificationRequired: item.verificationRequired
        } as any);
        await this.db.single(this.db.from('moc_risk_review_requirements').update({ action_id: action.id, status: 'Action Created', updated_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', row.id).select().single());
        rows.push({ ...row, action_id: action.id, status: 'Action Created' });
      } else {
        rows.push(row);
      }
    }
    return rows;
  }

  async generate(tenantId: string, moc: any, risk: any): Promise<Requirement[]> {
    const impact = await this.db.single<any>(this.db.from('moc_impact_assessments').select('*').eq('tenant_id', tenantId).eq('moc_id', moc.id).maybeSingle());
    const answers = impact?.answers ?? {};
    const items: Requirement[] = [];
    const add = (condition: boolean, item: Requirement) => { if (condition && !items.some((row) => row.reviewType === item.reviewType && row.source === item.source)) items.push(item); };
    const level = risk.risk_level;
    add(['High', 'Critical'].includes(level), this.req('HSE_REVIEW', 'HSE risk review required', 'HSE must validate risk controls, residual risk, safeguards, and acceptance basis.', 'risk', true, false, 'HSE Manager', true));
    add(['High', 'Critical'].includes(level), this.req('ENGINEERING_REVIEW', 'Engineering risk review required', 'Engineering must verify technical controls and consequence assumptions.', 'risk', true, false, 'Process Engineer', true));
    add(['High', 'Critical'].includes(level), this.req('OPERATIONS_REVIEW', 'Operations readiness risk review required', 'Operations must validate operating envelope, temporary controls, and work readiness.', 'risk', true, false, 'Operations Supervisor', false));
    add(level === 'Critical' || answers.hazopDeviationReviewRequired || answers.operatingLimitsChanged, this.req('HAZOP_REVIEW', 'HAZOP deviation review required', 'Critical risk or operating limit change requires HAZOP/PHA review before implementation.', 'risk', true, false, 'HAZOP Facilitator', true));
    add(level === 'Critical' || answers.safetySystemsAffected || answers.sisAffected || answers.lopaReviewRequired, this.req('LOPA_SIS_REVIEW', 'LOPA / SIS review required', 'Safety system or critical risk impact requires LOPA/SIS validation.', 'risk', true, true, 'Process Safety Engineer', true));
    add(level === 'Critical' || answers.safetyCriticalElementAffected || answers.commissioningTestRequired || answers.equipmentAffected, this.req('PSSR_REQUIRED', 'PSSR startup readiness required', 'Startup is blocked until PSSR readiness is verified for this risk profile.', 'risk', false, true, 'PSSR Owner', true));
    add(Number(risk.environmental_score ?? 0) > 0 || answers.environmentalImpactAffected || answers.regulatoryNotificationRequired, this.req('ENVIRONMENTAL_REVIEW', 'Environmental / regulatory review required', 'Environmental or permit impacts must be reviewed and documented.', 'risk', true, false, 'Environmental Coordinator', true));
    add(level === 'Critical', this.req('MANAGEMENT_REVIEW', 'Critical risk management acceptance required', 'Critical MOC requires documented management risk acceptance before approval.', 'risk', true, false, 'Plant Manager', true));
    return items;
  }

  private req(reviewType: string, title: string, description: string, source: string, requiredBeforeApproval: boolean, requiredBeforeStartup: boolean, ownerRole: string, evidenceRequired: boolean): Requirement {
    return { reviewType, title, description, source, requiredBeforeApproval, requiredBeforeStartup, ownerRole, evidenceRequired, verificationRequired: true };
  }

  private previewRow(moc: any, risk: any, item: Requirement) {
    return {
      id: `${moc.id}_${item.source}_${item.reviewType}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
      moc_id: moc.id,
      risk_assessment_id: risk.id,
      review_type: item.reviewType,
      title: item.title,
      description: item.description,
      source: item.source,
      required: true,
      required_before_approval: item.requiredBeforeApproval,
      required_before_startup: item.requiredBeforeStartup,
      owner_role: item.ownerRole,
      status: 'Preview',
      evidence_required: item.evidenceRequired,
      verification_required: item.verificationRequired
    };
  }

  private dueDate(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
