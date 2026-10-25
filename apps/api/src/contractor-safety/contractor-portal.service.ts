// apps/api/src/contractor-safety/contractor-portal.service.ts
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { CSM_DOCUMENT_TYPES } from './contractor-safety.constants';
import {
  AcknowledgeEvaluationDto,
  AddWorkerCertDto,
  CreateContractorDocumentDto,
  CreateContractorWorkerDto,
  PortalUpdateProfileDto,
  SubmitInductionQuizDto
} from './dto/contractor-safety.dto';
import { ContractorInductionService } from './contractor-induction.service';

type Row = Record<string, any>;

@Injectable()
export class ContractorPortalService {
  constructor(
    private readonly db: SupabaseService,
    private readonly induction: ContractorInductionService
  ) {}

  // ---------------------------------------------------------------- Authenticate by Token
  async validateTokenAndGetSession(token: string, clientIp = 'unknown') {
    if (!token) {
      throw new UnauthorizedException('Missing portal access token.');
    }

    const contractor = await this.db.single<Row>(
      this.db
        .from('csm_contractor_profiles')
        .select('*')
        .eq('portal_access_token', token)
    );

    if (!contractor) {
      throw new NotFoundException('Invalid contractor portal link or access token.');
    }

    if (contractor.portal_status !== 'ACTIVE') {
      throw new UnauthorizedException('Portal access has been revoked or suspended. Contact plant safety administration.');
    }

    if (contractor.portal_token_expires_at) {
      const expiry = new Date(contractor.portal_token_expires_at);
      if (expiry <= new Date()) {
        throw new UnauthorizedException('Portal access link has expired. Request a refreshed invitation link from plant safety.');
      }
    }

    // Update last login
    try {
      await this.db
        .from('csm_contractor_profiles')
        .update({ portal_last_login_at: new Date().toISOString() })
        .eq('id', contractor.id);
    } catch {}

    // Record login audit event
    try {
      await this.db.from('csm_portal_audit_logs').insert({
        tenant_id: contractor.tenant_id,
        contractor_id: contractor.id,
        event_type: 'PORTAL_LOGIN',
        event_payload: { accessed_at: new Date().toISOString() },
        actor_ip: clientIp,
        actor_email: contractor.primary_contact_email ?? 'contractor-portal'
      });
    } catch {}

    return contractor;
  }

  // ---------------------------------------------------------------- Portal Dashboard / Overview
  async getPortalOverview(token: string, clientIp?: string) {
    const contractor = await this.validateTokenAndGetSession(token, clientIp);
    const contractorId = contractor.id;

    const [documents, auditLogs] = await Promise.all([
      this.db.many<Row>(
        this.db
          .from('csm_contractor_documents')
          .select('*')
          .eq('contractor_id', contractorId)
          .order('expiration_date', { ascending: true })
      ).catch(() => []),
      this.db.many<Row>(
        this.db
          .from('csm_portal_audit_logs')
          .select('*')
          .eq('contractor_id', contractorId)
          .order('created_at', { ascending: false })
          .limit(10)
      ).catch(() => [])
    ]);

    // Compute checklist based on contractor tier
    const tier = contractor.tier ?? 'TIER_1';
    const requiredTypes = CSM_DOCUMENT_TYPES.filter((dt) =>
      (dt.requiredFor as readonly string[]).includes(tier)
    );

    const checklist = requiredTypes.map((req) => {
      const match = documents.find((d) => d.document_type === req.value);
      const isExpired = match?.expiration_date ? new Date(match.expiration_date) <= new Date() : false;
      const isExpiringSoon = match?.expiration_date
        ? !isExpired && new Date(match.expiration_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : false;

      return {
        document_type: req.value,
        label: req.label,
        isRequired: true,
        document: match ?? null,
        isUploaded: Boolean(match),
        verification_status: match ? match.verification_status : 'MISSING',
        isExpired,
        isExpiringSoon
      };
    });

    const isFullyCompliant = checklist.every(
      (item) => item.isUploaded && item.verification_status === 'VERIFIED' && !item.isExpired
    );

    return {
      contractor: {
        id: contractor.id,
        company_name: contractor.company_name,
        company_code: contractor.company_code,
        tier: contractor.tier,
        status: contractor.status,
        safety_grade: contractor.safety_grade,
        prequal_score: contractor.prequal_score,
        prequal_valid_until: contractor.prequal_valid_until,
        specialties: contractor.specialties,
        primary_contact_name: contractor.primary_contact_name,
        primary_contact_title: contractor.primary_contact_title,
        primary_contact_email: contractor.primary_contact_email,
        primary_contact_phone: contractor.primary_contact_phone,
        emergency_contact_name: contractor.emergency_contact_name,
        emergency_contact_phone: contractor.emergency_contact_phone,
        office_address: contractor.office_address,
        city: contractor.city,
        state: contractor.state,
        postal_code: contractor.postal_code,
        portal_token_expires_at: contractor.portal_token_expires_at
      },
      documents,
      checklist,
      complianceSummary: {
        totalRequired: checklist.length,
        verifiedCount: checklist.filter((c) => c.verification_status === 'VERIFIED' && !c.isExpired).length,
        missingCount: checklist.filter((c) => !c.isUploaded).length,
        pendingReviewCount: checklist.filter((c) => c.verification_status === 'PENDING_REVIEW').length,
        expiringSoonCount: checklist.filter((c) => c.isExpiringSoon).length,
        isFullyCompliant
      },
      auditLogs
    };
  }

  // ---------------------------------------------------------------- Portal Document Upload
  async uploadDocument(token: string, dto: CreateContractorDocumentDto, clientIp?: string) {
    const contractor = await this.validateTokenAndGetSession(token, clientIp);

    const payload = {
      tenant_id: contractor.tenant_id,
      contractor_id: contractor.id,
      document_type: dto.document_type,
      title: dto.title,
      file_name: dto.file_name,
      file_url: dto.file_url,
      file_size_bytes: dto.file_size_bytes ?? 0,
      mime_type: dto.mime_type ?? 'application/pdf',
      policy_number: dto.policy_number ?? null,
      insurance_carrier: dto.insurance_carrier ?? null,
      coverage_amount_usd: dto.coverage_amount_usd ?? 0,
      effective_date: dto.effective_date ?? null,
      expiration_date: dto.expiration_date ?? null,
      verification_status: 'PENDING_REVIEW', // External uploads require plant safety review
      uploaded_via_portal: true,
      uploader_ip: clientIp ?? 'external'
    };

    const inserted = await this.db.single<Row>(
      this.db.from('csm_contractor_documents').insert(payload).select('*')
    );

    try {
      await this.db.from('csm_portal_audit_logs').insert({
        tenant_id: contractor.tenant_id,
        contractor_id: contractor.id,
        event_type: 'DOCUMENT_UPLOAD',
        event_payload: { document_type: dto.document_type, file_name: dto.file_name, title: dto.title },
        actor_ip: clientIp ?? 'external',
        actor_email: contractor.primary_contact_email ?? 'contractor-vendor'
      });
    } catch {}

    return inserted ?? payload;
  }

  // ---------------------------------------------------------------- Portal Profile Update
  async updateProfile(token: string, dto: PortalUpdateProfileDto, clientIp?: string) {
    const contractor = await this.validateTokenAndGetSession(token, clientIp);

    const payload: Row = {
      updated_at: new Date().toISOString()
    };

    if (dto.primary_contact_name !== undefined) payload.primary_contact_name = dto.primary_contact_name;
    if (dto.primary_contact_title !== undefined) payload.primary_contact_title = dto.primary_contact_title;
    if (dto.primary_contact_email !== undefined) payload.primary_contact_email = dto.primary_contact_email;
    if (dto.primary_contact_phone !== undefined) payload.primary_contact_phone = dto.primary_contact_phone;
    if (dto.emergency_contact_name !== undefined) payload.emergency_contact_name = dto.emergency_contact_name;
    if (dto.emergency_contact_phone !== undefined) payload.emergency_contact_phone = dto.emergency_contact_phone;
    if (dto.office_address !== undefined) payload.office_address = dto.office_address;
    if (dto.city !== undefined) payload.city = dto.city;
    if (dto.state !== undefined) payload.state = dto.state;
    if (dto.postal_code !== undefined) payload.postal_code = dto.postal_code;

    const updated = await this.db.single<Row>(
      this.db.from('csm_contractor_profiles').update(payload).eq('id', contractor.id).select('*')
    );

    try {
      await this.db.from('csm_portal_audit_logs').insert({
        tenant_id: contractor.tenant_id,
        contractor_id: contractor.id,
        event_type: 'PROFILE_UPDATE',
        event_payload: { updated_fields: Object.keys(payload) },
        actor_ip: clientIp ?? 'external',
        actor_email: contractor.primary_contact_email ?? 'contractor-vendor'
      });
    } catch {}

    return updated ?? { ...contractor, ...payload };
  }

  // ---------------------------------------------------------------- Portal Worker Roster
  async getPortalWorkers(token: string, clientIp?: string) {
    const contractor = await this.validateTokenAndGetSession(token, clientIp);

    const workers = await this.db.many<Row>(
      this.db
        .from('csm_contractor_workers')
        .select(`
          *,
          certifications:csm_worker_certifications(*)
        `)
        .eq('contractor_id', contractor.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
    ).catch(() => []);

    return workers;
  }

  async createPortalWorker(token: string, dto: CreateContractorWorkerDto, clientIp?: string) {
    const contractor = await this.validateTokenAndGetSession(token, clientIp);

    const code = dto.worker_code ?? `WRK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const { data, error } = await this.db.client
      .from('csm_contractor_workers')
      .insert({
        company_id: contractor.company_id ?? contractor.tenant_id,
        contractor_id: contractor.id,
        worker_code: code,
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email,
        phone: dto.phone,
        badge_number: dto.badge_number ?? `BDG-${Math.floor(1000 + Math.random() * 9000)}`,
        craft_trade: dto.craft_trade ?? 'GENERAL_LABOR',
        craft_skill_level: dto.craft_skill_level ?? 'JOURNEYMAN',
        badge_status: 'PENDING_VERIFICATION', // External additions start pending verification
        emergency_contact_name: dto.emergency_contact_name,
        emergency_contact_phone: dto.emergency_contact_phone,
        notes: dto.notes
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to register worker: ${error.message}`);
    }

    try {
      await this.db.from('csm_portal_audit_logs').insert({
        tenant_id: contractor.tenant_id,
        contractor_id: contractor.id,
        event_type: 'WORKER_REGISTERED',
        event_payload: { worker_id: data.id, worker_name: `${dto.first_name} ${dto.last_name}` },
        actor_ip: clientIp ?? 'external',
        actor_email: contractor.primary_contact_email ?? 'contractor-vendor'
      });
    } catch {}

    return data;
  }

  async addPortalWorkerCert(token: string, workerId: string, dto: AddWorkerCertDto, clientIp?: string) {
    const contractor = await this.validateTokenAndGetSession(token, clientIp);

    // Ensure worker belongs to this contractor
    const worker = await this.db.single<Row>(
      this.db
        .from('csm_contractor_workers')
        .select('id')
        .eq('id', workerId)
        .eq('contractor_id', contractor.id)
    );

    if (!worker) {
      throw new NotFoundException('Worker not found under this contractor account.');
    }

    const { data, error } = await this.db.client
      .from('csm_worker_certifications')
      .insert({
        company_id: contractor.company_id ?? contractor.tenant_id,
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
      throw new BadRequestException(`Failed to upload certification: ${error.message}`);
    }

    return data;
  }

  // ---------------------------------------------------------------- Portal Inductions & Pass
  async getPortalInductionCourses(token: string, clientIp?: string) {
    const contractor = await this.validateTokenAndGetSession(token, clientIp);
    const companyId = contractor.company_id ?? contractor.tenant_id;
    return this.induction.listCourses(companyId);
  }

  async submitPortalWorkerInduction(
    token: string,
    workerId: string,
    courseId: string,
    dto: SubmitInductionQuizDto,
    clientIp?: string
  ) {
    const contractor = await this.validateTokenAndGetSession(token, clientIp);
    const companyId = contractor.company_id ?? contractor.tenant_id;

    // Verify worker belongs to this contractor
    const worker = await this.db.single<Row>(
      this.db
        .from('csm_contractor_workers')
        .select('id')
        .eq('id', workerId)
        .eq('contractor_id', contractor.id)
    );

    if (!worker) {
      throw new NotFoundException('Worker not found under this contractor account.');
    }

    return this.induction.submitInductionQuiz(companyId, workerId, courseId, dto);
  }

  async getPortalWorkerGatePass(token: string, workerId: string, clientIp?: string) {
    const contractor = await this.validateTokenAndGetSession(token, clientIp);
    const companyId = contractor.company_id ?? contractor.tenant_id;

    const pass = await this.db.single<Row>(
      this.db
        .from('csm_gate_passes')
        .select('*')
        .eq('worker_id', workerId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
    );

    return pass ?? null;
  }

  async getPortalEvaluations(token: string, clientIp?: string) {
    const contractor = await this.validateTokenAndGetSession(token, clientIp);
    const companyId = contractor.company_id ?? contractor.tenant_id;

    const { data, error } = await this.db.client
      .from('csm_post_job_evaluations')
      .select('*')
      .eq('company_id', companyId)
      .eq('contractor_id', contractor.id)
      .order('evaluation_date', { ascending: false });

    if (error) {
      throw new BadRequestException('Failed to fetch contractor evaluations.');
    }

    return data ?? [];
  }

  async acknowledgePortalEvaluation(
    token: string,
    evalId: string,
    dto: AcknowledgeEvaluationDto,
    clientIp?: string
  ) {
    const contractor = await this.validateTokenAndGetSession(token, clientIp);
    const companyId = contractor.company_id ?? contractor.tenant_id;

    const { data: existing } = await this.db.client
      .from('csm_post_job_evaluations')
      .select('id')
      .eq('id', evalId)
      .eq('contractor_id', contractor.id)
      .eq('company_id', companyId)
      .single();

    if (!existing) {
      throw new NotFoundException('Evaluation not found or not assigned to this contractor.');
    }

    const { data, error } = await this.db.client
      .from('csm_post_job_evaluations')
      .update({
        status: 'ACKNOWLEDGED_BY_VENDOR',
        vendor_feedback_comments: dto.vendor_feedback_comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', evalId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to acknowledge evaluation: ${error.message}`);
    }

    return data;
  }
}
