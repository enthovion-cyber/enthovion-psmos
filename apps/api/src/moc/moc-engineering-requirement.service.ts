import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

type Requirement = {
  documentType: string;
  impactArea: string;
  isRequired: boolean;
  requiredBeforeApproval: boolean;
  requiredBeforeStartup: boolean;
  requiredBeforeClosure: boolean;
  allowJustification: boolean;
  reason: string;
};

@Injectable()
export class MocEngineeringRequirementService {
  constructor(private readonly db: SupabaseService) {}

  async listAdmin(tenantId: string) {
    return this.db.many<any>(this.db.from('moc_engineering_document_requirements').select('*').or(`tenant_id.is.null,tenant_id.eq.${tenantId}`).order('document_type'));
  }

  async createAdmin(tenantId: string, dto: Record<string, any>) {
    return this.db.single<any>(this.db.from('moc_engineering_document_requirements').insert({ id: crypto.randomUUID(), tenant_id: tenantId, ...this.toDb(dto) }).select().single());
  }

  async updateAdmin(tenantId: string, requirementId: string, dto: Record<string, any>) {
    return this.db.single<any>(this.db.from('moc_engineering_document_requirements').update({ ...this.toDb(dto), updated_at: new Date().toISOString() }).eq('id', requirementId).or(`tenant_id.is.null,tenant_id.eq.${tenantId}`).select().single());
  }

  async deleteAdmin(tenantId: string, requirementId: string) {
    return this.db.single<any>(this.db.from('moc_engineering_document_requirements').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', requirementId).or(`tenant_id.is.null,tenant_id.eq.${tenantId}`).select().single());
  }

  async generate(tenantId: string, moc: any) {
    const persisted = await this.listAdmin(tenantId);
    const generated = this.generatedFromMoc(moc);
    const policyRows = persisted.filter((row: any) => row.is_active && this.matches(row, moc)).map((row: any) => ({
      id: row.id,
      documentType: row.document_type,
      impactArea: row.impact_area ?? 'policy',
      isRequired: row.is_required,
      requiredBeforeApproval: row.required_before_approval,
      requiredBeforeStartup: row.required_before_startup,
      requiredBeforeClosure: row.required_before_closure,
      allowJustification: row.allow_justification,
      reason: 'Site engineering document requirement policy.'
    }));
    return this.merge([...generated, ...policyRows]);
  }

  private generatedFromMoc(moc: any): Requirement[] {
    const answers = moc.impact?.answers ?? {};
    const risk = moc.risk_level;
    const add: Requirement[] = [];
    const push = (condition: boolean, documentType: string, impactArea: string, reason: string, options: Partial<Requirement> = {}) => {
      if (!condition) return;
      add.push({
        documentType,
        impactArea,
        isRequired: true,
        requiredBeforeApproval: options.requiredBeforeApproval ?? false,
        requiredBeforeStartup: options.requiredBeforeStartup ?? false,
        requiredBeforeClosure: options.requiredBeforeClosure ?? true,
        allowJustification: options.allowJustification ?? true,
        reason
      });
    };
    push(Boolean(answers.pidUpdateRequired || answers.equipmentAffected), 'P&ID redline / markup', 'documents', 'P&ID redline is required when equipment or P&ID update is affected.', { requiredBeforeApproval: true });
    push(Boolean(answers.pidUpdateRequired), 'P&ID revision', 'documents', 'P&ID revision action is required for Document Control.', { requiredBeforeClosure: true });
    push(Boolean(['High', 'Critical'].includes(risk)), 'Design basis document', 'risk', 'High/Critical risk requires design basis evidence or approved justification.', { requiredBeforeApproval: true });
    push(Boolean(answers.equipmentAffected), 'Equipment datasheet', 'equipment', 'Equipment changes require datasheet update evidence.', { requiredBeforeStartup: true });
    push(Boolean(answers.safetySystemsAffected || answers.sisAffected), 'SIS logic document', 'safety_systems', 'SIS/safety system changes require logic documentation.', { requiredBeforeStartup: true, allowJustification: false });
    push(Boolean(answers.safetySystemsAffected || answers.dcsAffected || answers.bpcsAffected), 'DCS / BPCS logic document', 'safety_systems', 'DCS/BPCS change requires controls review evidence.', { requiredBeforeStartup: true });
    push(Boolean(answers.safetySystemsAffected || answers.sisAffected), 'Cause & effect diagram', 'safety_systems', 'Safety system changes require cause and effect review.', { requiredBeforeStartup: true });
    push(Boolean(answers.operatingLimitsChanged), 'Operating limits document', 'operating_limits', 'Operating limit changes require operating limit document update.', { requiredBeforeStartup: true });
    push(Boolean(answers.reliefDeviceAffected), 'Relief device calculation', 'equipment', 'Relief device impact requires calculation or review evidence.', { requiredBeforeStartup: true });
    push(Boolean(answers.hazardousAreaAffected), 'Hazardous area classification drawing', 'hazardous_area', 'Hazardous area impact requires classification review evidence.', { requiredBeforeStartup: true });
    push(Boolean(answers.trainingRequired || answers.commissioningTestRequired), 'Commissioning / test procedure', 'startup', 'Startup or testing impact requires test procedure evidence.', { requiredBeforeStartup: true });
    push(Boolean(moc.change_type === 'Emergency Change'), 'Other engineering evidence', 'emergency', 'Emergency change requires supporting engineering evidence.', { requiredBeforeClosure: true });
    return add;
  }

  private merge(items: Requirement[]) {
    const map = new Map<string, Requirement>();
    for (const item of items) {
      const existing = map.get(item.documentType);
      if (!existing) map.set(item.documentType, item);
      else map.set(item.documentType, {
        ...existing,
        isRequired: existing.isRequired || item.isRequired,
        requiredBeforeApproval: existing.requiredBeforeApproval || item.requiredBeforeApproval,
        requiredBeforeStartup: existing.requiredBeforeStartup || item.requiredBeforeStartup,
        requiredBeforeClosure: existing.requiredBeforeClosure || item.requiredBeforeClosure,
        allowJustification: existing.allowJustification && item.allowJustification,
        reason: `${existing.reason} ${item.reason}`
      });
    }
    return [...map.values()];
  }

  private matches(row: any, moc: any) {
    if (row.change_type && row.change_type !== moc.change_type) return false;
    if (row.risk_level && row.risk_level !== moc.risk_level) return false;
    if (row.site_id && row.site_id !== moc.site_id) return false;
    return true;
  }

  private toDb(dto: Record<string, any>) {
    return {
      company_id: dto.companyId ?? dto.company_id ?? null,
      site_id: dto.siteId ?? dto.site_id ?? null,
      change_type: dto.changeType ?? dto.change_type ?? null,
      risk_level: dto.riskLevel ?? dto.risk_level ?? null,
      impact_area: dto.impactArea ?? dto.impact_area ?? null,
      condition_rule: dto.conditionRule ?? dto.condition_rule ?? {},
      document_type: dto.documentType ?? dto.document_type,
      is_required: dto.isRequired ?? dto.is_required ?? true,
      required_before_approval: dto.requiredBeforeApproval ?? dto.required_before_approval ?? false,
      required_before_startup: dto.requiredBeforeStartup ?? dto.required_before_startup ?? false,
      required_before_closure: dto.requiredBeforeClosure ?? dto.required_before_closure ?? true,
      allow_justification: dto.allowJustification ?? dto.allow_justification ?? true,
      is_active: dto.isActive ?? dto.is_active ?? true
    };
  }
}
