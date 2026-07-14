import { SignatureRequirementDto } from '../dto/signature-tab.dto';

type Scope = { selectedSiteId?: string | null };

export class SignatureRequirementService {
  static payload(tenantId: string, actorId: string, dto: SignatureRequirementDto, scope: Scope, includeCreated = true) {
    const now = new Date().toISOString();
    return {
      ...(includeCreated ? { id: crypto.randomUUID(), tenant_id: tenantId, site_id: scope.selectedSiteId ?? null, created_by: actorId, created_at: now } : {}),
      permit_type: dto.permitType ?? null,
      risk_level: dto.riskLevel ?? null,
      area_classification: dto.areaClassification ?? null,
      equipment_criticality: dto.equipmentCriticality ?? null,
      signature_role: dto.signatureRole,
      signature_purpose: dto.signaturePurpose,
      required_for_status: dto.requiredForStatus,
      assigned_role_id: dto.assignedRoleId ?? null,
      is_required: dto.isRequired,
      condition_rule: dto.conditionRule ?? {},
      expires_on_extension: dto.expiresOnExtension,
      expires_on_suspension: false,
      requires_revalidation: dto.requiresRevalidation,
      updated_at: now
    };
  }
}
