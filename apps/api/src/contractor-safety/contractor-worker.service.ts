import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateContractorWorkerDto,
  UpdateContractorWorkerDto,
  AddWorkerCertDto,
  VerifyCertDto
} from './dto/contractor-safety.dto';

@Injectable()
export class ContractorWorkerService {
  private readonly logger = new Logger(ContractorWorkerService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly auditService: AuditService
  ) {}

  /**
   * List contractor workers with craft trade, badge status, and prequalification details
   */
  async listWorkers(
    companyId: string,
    query: {
      contractor_id?: string | undefined;
      craft_trade?: string | undefined;
      badge_status?: string | undefined;
      search?: string | undefined;
      limit?: number | undefined;
      offset?: number | undefined;
    }
  ) {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    let builder = this.supabase.client
      .from('csm_contractor_workers')
      .select(`
        *,
        contractor:csm_contractor_profiles(id, company_name, vendor_number, safety_grade, status),
        certifications:csm_worker_certifications(id, certification_name, verification_status, expiration_date, is_ptw_blocking)
      `, { count: 'exact' })
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (query.contractor_id) {
      builder = builder.eq('contractor_id', query.contractor_id);
    }
    if (query.craft_trade) {
      builder = builder.eq('craft_trade', query.craft_trade);
    }
    if (query.badge_status) {
      builder = builder.eq('badge_status', query.badge_status);
    }
    if (query.search) {
      builder = builder.or(`first_name.ilike.%${query.search}%,last_name.ilike.%${query.search}%,worker_code.ilike.%${query.search}%,badge_number.ilike.%${query.search}%`);
    }

    const { data, count, error } = await builder;
    if (error) {
      this.logger.error(`Error querying contractor workers: ${error.message}`);
      throw new BadRequestException('Failed to fetch contractor workers');
    }

    const now = new Date();

    const formatted = (data ?? []).map((w: any) => {
      const certs = w.certifications ?? [];
      const totalCerts = certs.length;
      const verifiedCerts = certs.filter((c: any) => c.verification_status === 'VERIFIED').length;
      const expiredCerts = certs.filter((c: any) => {
        if (!c.expiration_date) return false;
        return new Date(c.expiration_date) < now;
      }).length;
      const pendingCerts = certs.filter((c: any) => c.verification_status === 'PENDING').length;

      const isPtwBlocked = expiredCerts > 0 || w.badge_status !== 'ACTIVE';

      return {
        ...w,
        stats: {
          total_certifications: totalCerts,
          verified_certifications: verifiedCerts,
          expired_certifications: expiredCerts,
          pending_certifications: pendingCerts,
          ptw_eligible: !isPtwBlocked
        }
      };
    });

    return {
      workers: formatted,
      total: count ?? 0,
      limit,
      offset
    };
  }

  /**
   * Get single worker by ID with full certification record (OSHA 1910.119(h)(3)(iv))
   */
  async getWorkerById(companyId: string, workerId: string) {
    const { data: worker, error } = await this.supabase.client
      .from('csm_contractor_workers')
      .select(`
        *,
        contractor:csm_contractor_profiles(*),
        certifications:csm_worker_certifications(*)
      `)
      .eq('id', workerId)
      .eq('company_id', companyId)
      .single();

    if (error || !worker) {
      throw new NotFoundException(`Contractor worker ${workerId} not found`);
    }

    const now = new Date();
    const certs = (worker.certifications ?? []).map((c: any) => {
      const isExpired = c.expiration_date ? new Date(c.expiration_date) < now : false;
      const effectiveStatus = isExpired ? 'EXPIRED' : c.verification_status;
      return {
        ...c,
        is_expired: isExpired,
        effective_status: effectiveStatus
      };
    });

    const expiredBlocking = certs.filter((c: any) => c.is_expired && c.is_ptw_blocking).length;
    const isPtwEligible = worker.badge_status === 'ACTIVE' && expiredBlocking === 0;

    return {
      ...worker,
      certifications: certs,
      compliance_summary: {
        total_certifications: certs.length,
        verified_count: certs.filter((c: any) => c.effective_status === 'VERIFIED').length,
        expired_count: certs.filter((c: any) => c.is_expired).length,
        pending_count: certs.filter((c: any) => c.effective_status === 'PENDING').length,
        ptw_eligible: isPtwEligible,
        block_reasons: isPtwEligible ? [] : [
          ...(worker.badge_status !== 'ACTIVE' ? [`Badge status is ${worker.badge_status}`] : []),
          ...(expiredBlocking > 0 ? [`${expiredBlocking} mandatory safety certification(s) expired`] : [])
        ]
      }
    };
  }

  /**
   * Create a new contractor worker
   */
  async createWorker(companyId: string, userId: string | null, dto: CreateContractorWorkerDto) {
    const code = dto.worker_code ?? `WRK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const { data, error } = await this.supabase.client
      .from('csm_contractor_workers')
      .insert({
        company_id: companyId,
        contractor_id: dto.contractor_id,
        worker_code: code,
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email,
        phone: dto.phone,
        badge_number: dto.badge_number ?? `BDG-${Math.floor(1000 + Math.random() * 9000)}`,
        craft_trade: dto.craft_trade ?? 'GENERAL_LABOR',
        craft_skill_level: dto.craft_skill_level ?? 'JOURNEYMAN',
        badge_status: dto.badge_status ?? 'ACTIVE',
        emergency_contact_name: dto.emergency_contact_name,
        emergency_contact_phone: dto.emergency_contact_phone,
        photo_url: dto.photo_url,
        notes: dto.notes,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create contractor worker: ${error.message}`);
      throw new BadRequestException(`Failed to register contractor worker: ${error.message}`);
    }

    try {
      await this.auditService.write({
        tenantId: companyId,
        actorId: userId ?? 'SYSTEM',
        action: 'csm.worker.created',
        entityType: 'csm_contractor_workers',
        entityId: data.id,
        metadata: {
          worker_code: data.worker_code,
          name: `${data.first_name} ${data.last_name}`,
          contractor_id: data.contractor_id
        }
      });
    } catch {
      // audit logging best effort
    }

    return data;
  }

  /**
   * Update contractor worker profile
   */
  async updateWorker(companyId: string, workerId: string, dto: UpdateContractorWorkerDto) {
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (dto.first_name !== undefined) updates.first_name = dto.first_name;
    if (dto.last_name !== undefined) updates.last_name = dto.last_name;
    if (dto.email !== undefined) updates.email = dto.email;
    if (dto.phone !== undefined) updates.phone = dto.phone;
    if (dto.badge_number !== undefined) updates.badge_number = dto.badge_number;
    if (dto.craft_trade !== undefined) updates.craft_trade = dto.craft_trade;
    if (dto.craft_skill_level !== undefined) updates.craft_skill_level = dto.craft_skill_level;
    if (dto.badge_status !== undefined) updates.badge_status = dto.badge_status;
    if (dto.emergency_contact_name !== undefined) updates.emergency_contact_name = dto.emergency_contact_name;
    if (dto.emergency_contact_phone !== undefined) updates.emergency_contact_phone = dto.emergency_contact_phone;
    if (dto.photo_url !== undefined) updates.photo_url = dto.photo_url;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.notes !== undefined) updates.notes = dto.notes;

    const { data, error } = await this.supabase.client
      .from('csm_contractor_workers')
      .update(updates)
      .eq('id', workerId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to update contractor worker: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete / Deactivate worker
   */
  async deleteWorker(companyId: string, workerId: string) {
    const { error } = await this.supabase.client
      .from('csm_contractor_workers')
      .update({ is_active: false, badge_status: 'REVOKED', updated_at: new Date().toISOString() })
      .eq('id', workerId)
      .eq('company_id', companyId);

    if (error) {
      throw new BadRequestException(`Failed to deactivate worker: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * Add worker certification / qualification record
   */
  async addCertification(companyId: string, workerId: string, dto: AddWorkerCertDto) {
    // Verify worker exists
    const { data: worker } = await this.supabase.client
      .from('csm_contractor_workers')
      .select('id')
      .eq('id', workerId)
      .eq('company_id', companyId)
      .single();

    if (!worker) {
      throw new NotFoundException(`Worker ${workerId} not found`);
    }

    const { data, error } = await this.supabase.client
      .from('csm_worker_certifications')
      .insert({
        company_id: companyId,
        worker_id: workerId,
        certification_name: dto.certification_name,
        certification_category: dto.certification_category ?? 'PROCESS_SAFETY',
        certifying_body: dto.certifying_body,
        certificate_number: dto.certificate_number,
        issue_date: dto.issue_date,
        expiration_date: dto.expiration_date,
        document_url: dto.document_url,
        is_ptw_blocking: dto.is_ptw_blocking ?? true,
        verification_status: 'PENDING'
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to record certification: ${error.message}`);
    }

    return data;
  }

  /**
   * Verify or reject worker certification
   */
  async verifyCertification(companyId: string, certId: string, userId: string, dto: VerifyCertDto) {
    const { data: cert, error: fetchErr } = await this.supabase.client
      .from('csm_worker_certifications')
      .select('*, worker:csm_contractor_workers(*)')
      .eq('id', certId)
      .eq('company_id', companyId)
      .single();

    if (fetchErr || !cert) {
      throw new NotFoundException(`Certification ${certId} not found`);
    }

    const { data, error } = await this.supabase.client
      .from('csm_worker_certifications')
      .update({
        verification_status: dto.verification_status,
        verified_by: userId,
        verified_at: new Date().toISOString(),
        verification_notes: dto.verification_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', certId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to verify certification: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete certification
   */
  async deleteCertification(companyId: string, certId: string) {
    const { error } = await this.supabase.client
      .from('csm_worker_certifications')
      .delete()
      .eq('id', certId)
      .eq('company_id', companyId);

    if (error) {
      throw new BadRequestException(`Failed to delete certification: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * Expiring Credentials Radar (Key PSM Audit requirement)
   * Discovers credentials expired or expiring within N days
   */
  async getExpiringCredentialsRadar(companyId: string, daysThreshold: number = 60) {
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + daysThreshold);

    const { data, error } = await this.supabase.client
      .from('csm_worker_certifications')
      .select(`
        *,
        worker:csm_contractor_workers(
          id, worker_code, first_name, last_name, craft_trade, badge_status,
          contractor:csm_contractor_profiles(id, company_name, vendor_number)
        )
      `)
      .eq('company_id', companyId)
      .not('expiration_date', 'is', null)
      .lte('expiration_date', thresholdDate.toISOString().split('T')[0])
      .order('expiration_date', { ascending: true });

    if (error) {
      throw new BadRequestException(`Failed to query credential radar: ${error.message}`);
    }

    const todayStr = now.toISOString().slice(0, 10);
    const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
    const in30Days = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);

    const expired: any[] = [];
    const urgent7Days: any[] = [];
    const warning30Days: any[] = [];
    const upcoming60Days: any[] = [];

    (data ?? []).forEach((c: any) => {
      const exp = c.expiration_date;
      if (exp < todayStr) {
        expired.push(c);
      } else if (exp <= in7Days) {
        urgent7Days.push(c);
      } else if (exp <= in30Days) {
        warning30Days.push(c);
      } else {
        upcoming60Days.push(c);
      }
    });

    return {
      summary: {
        total_flagged: (data ?? []).length,
        expired_count: expired.length,
        urgent_7_days_count: urgent7Days.length,
        warning_30_days_count: warning30Days.length,
        upcoming_60_days_count: upcoming60Days.length
      },
      expired,
      urgent7Days,
      warning30Days,
      upcoming60Days
    };
  }

  /**
   * Check Permit to Work (PTW) Eligibility for a contract worker
   * Validates badge active state and verifies mandatory certifications
   */
  async checkWorkerPtwEligibility(
    companyId: string,
    workerId: string,
    requiredCertifications: string[] = []
  ) {
    const worker = await this.getWorkerById(companyId, workerId);

    const activeCerts = (worker.certifications ?? []).filter(
      (c: any) => c.effective_status === 'VERIFIED' && !c.is_expired
    );

    const activeCertNames: string[] = activeCerts.map((c: any) =>
      String(c.certification_name || '').toLowerCase()
    );

    const missingCerts: string[] = [];
    for (const req of requiredCertifications) {
      const found = activeCertNames.some((name: string) => name.includes(req.toLowerCase()));
      if (!found) {
        missingCerts.push(req);
      }
    }

    const badgeOk = worker.badge_status === 'ACTIVE';
    const isEligible = badgeOk && missingCerts.length === 0;

    return {
      worker_id: worker.id,
      worker_name: `${worker.first_name} ${worker.last_name}`,
      craft_trade: worker.craft_trade,
      badge_status: worker.badge_status,
      badge_ok: badgeOk,
      required_certifications: requiredCertifications,
      missing_certifications: missingCerts,
      is_eligible: isEligible,
      reasons: [
        ...(!badgeOk ? [`Badge status is ${worker.badge_status}`] : []),
        ...(missingCerts.length > 0 ? [`Missing required active certifications: ${missingCerts.join(', ')}`] : [])
      ]
    };
  }
}
