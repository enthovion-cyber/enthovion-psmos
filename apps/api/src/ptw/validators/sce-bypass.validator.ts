import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PermitRepository } from '../repositories/permit.repository';

export interface SceBypassCheckResult {
  hasSafetyCriticalIsolations: boolean;
  totalIsolations: number;
  safetyCriticalCount: number;
  bypassesPendingApproval: number;
  blockers: string[];
  isolations: Array<{
    id: string;
    isolationPointTag: string;
    equipmentTag?: string;
    isSafetyCritical: boolean;
    isSifBypass: boolean;
    silRating?: string | null;
    bypassStatus: string;
    bypassCertificateNumber?: string | null;
    bypassAuthorizedBy?: string | null;
    bypassAuthorizedAt?: string | null;
    isBlocked: boolean;
    blockerReason?: string | null;
  }>;
}

@Injectable()
export class SceBypassValidator {
  private readonly logger = new Logger(SceBypassValidator.name);

  constructor(private readonly repo: PermitRepository) {}

  /**
   * Scans all isolation points for a permit and cross-references Equipment Registry
   * to determine if any point isolates a Safety Critical Element (SCE) or Safety Instrumented Function (SIF).
   */
  async evaluateBypassStatus(tenantId: string, permit: Record<string, any>, isolations: any[]): Promise<SceBypassCheckResult> {
    if (!isolations || !isolations.length) {
      return {
        hasSafetyCriticalIsolations: false,
        totalIsolations: 0,
        safetyCriticalCount: 0,
        bypassesPendingApproval: 0,
        blockers: [],
        isolations: []
      };
    }

    // Query Equipment records referenced in isolations or main permit
    const equipmentIds = Array.from(new Set([
      permit.equipment_id,
      ...isolations.map((i) => i.equipment_id).filter(Boolean)
    ]));

    const equipmentTags = Array.from(new Set([
      permit.equipment_tag,
      ...isolations.map((i) => i.equipment_tag ?? i.isolation_point_tag).filter(Boolean)
    ]));

    let equipmentRecords: any[] = [];
    try {
      if (equipmentIds.length || equipmentTags.length) {
        equipmentRecords = await this.repo.db.many<any>(
          this.repo.db.from('Equipment')
            .select('id, tag, name, criticality, safetyCritical, type')
            .eq('tenantId', tenantId)
            .or(`id.in.(${equipmentIds.map(id => `"${id}"`).join(',')}),tag.in.(${equipmentTags.map(t => `"${t}"`).join(',')})`)
        );
      }
    } catch {
      equipmentRecords = [];
    }

    // Query LOPA SIF specifications for SIL-rated safety loops
    let sifRecords: any[] = [];
    try {
      sifRecords = await this.repo.db.many<any>(
        this.repo.db.from('lopa_sif_specifications')
          .select('id, sif_tag, required_sil, equipment_id')
          .eq('tenant_id', tenantId)
      );
    } catch {
      sifRecords = [];
    }

    const blockers: string[] = [];
    let safetyCriticalCount = 0;
    let bypassesPendingApproval = 0;

    const evaluatedIsolations = isolations.map((iso) => {
      const eq = equipmentRecords.find(
        (e) => (iso.equipment_id && e.id === iso.equipment_id) || (iso.equipment_tag && e.tag === iso.equipment_tag) || (iso.isolation_point_tag && e.tag === iso.isolation_point_tag)
      );

      const sif = sifRecords.find(
        (s) => (iso.equipment_id && s.equipment_id === iso.equipment_id) || (iso.sif_tag && s.sif_tag === iso.sif_tag) || (iso.isolation_point_tag && s.sif_tag?.includes(iso.isolation_point_tag))
      );

      const isSce = iso.is_safety_critical === true || eq?.safetyCritical === true || eq?.criticality === 'CRITICAL';
      const isSif = iso.is_sif_bypass === true || Boolean(sif);
      const silRating = iso.sil_rating ?? sif?.required_sil ?? (isSif ? 'SIL-1' : null);

      if (isSce || isSif) {
        safetyCriticalCount++;
      }

      const bypassStatus = iso.bypass_status ?? (isSce || isSif ? 'Pending Authorization' : 'Not Required');
      const hasCertificate = Boolean(iso.bypass_certificate_number);
      const isAuthorized = Boolean(iso.bypass_authorized_by || bypassStatus === 'Approved' || bypassStatus === 'Authorized');

      let isBlocked = false;
      let blockerReason: string | null = null;

      if (isSce || isSif) {
        if (!hasCertificate) {
          isBlocked = true;
          bypassesPendingApproval++;
          blockerReason = `Isolation point ${iso.isolation_point_tag ?? iso.tag} is a Safety Critical Element${silRating ? ` (${silRating})` : ''} and requires an Interlock / SCE Bypass Certificate.`;
          blockers.push(blockerReason);
        } else if (!isAuthorized) {
          isBlocked = true;
          bypassesPendingApproval++;
          blockerReason = `Interlock Bypass Certificate ${iso.bypass_certificate_number} for ${iso.isolation_point_tag} is pending Area Authority / Plant Manager sign-off.`;
          blockers.push(blockerReason);
        }
      }

      return {
        id: iso.id,
        isolationPointTag: iso.isolation_point_tag ?? iso.tag ?? 'ISO-POINT',
        equipmentTag: iso.equipment_tag ?? eq?.tag,
        isSafetyCritical: isSce,
        isSifBypass: isSif,
        silRating,
        bypassStatus,
        bypassCertificateNumber: iso.bypass_certificate_number ?? null,
        bypassAuthorizedBy: iso.bypass_authorized_by ?? null,
        bypassAuthorizedAt: iso.bypass_authorized_at ?? null,
        isBlocked,
        blockerReason
      };
    });

    return {
      hasSafetyCriticalIsolations: safetyCriticalCount > 0,
      totalIsolations: isolations.length,
      safetyCriticalCount,
      bypassesPendingApproval,
      blockers,
      isolations: evaluatedIsolations
    };
  }

  /**
   * Asserts that all Safety Critical Element / SIF bypasses are authorized with certificates
   * before permitting activation.
   */
  async assertBypassesAuthorized(tenantId: string, permit: Record<string, any>, isolations: any[]): Promise<void> {
    const result = await this.evaluateBypassStatus(tenantId, permit, isolations);
    if (result.blockers.length > 0) {
      throw new BadRequestException(
        `Permit activation blocked by Safety Critical Element (SCE) Gate: ${result.blockers.join(' ')}`
      );
    }
  }
}
