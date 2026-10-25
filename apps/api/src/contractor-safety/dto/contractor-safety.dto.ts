// apps/api/src/contractor-safety/dto/contractor-safety.dto.ts
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateContractorDto {
  @IsString()
  company_name!: string;

  @IsString()
  company_code!: string;

  @IsString()
  @IsOptional()
  tier?: string = 'TIER_1';

  @IsArray()
  @IsOptional()
  specialties?: string[] = [];

  @IsString()
  @IsOptional()
  status?: string = 'PENDING_PREQUAL';

  @IsString()
  @IsOptional()
  primary_contact_name?: string;

  @IsString()
  @IsOptional()
  primary_contact_title?: string;

  @IsString()
  @IsOptional()
  primary_contact_email?: string;

  @IsString()
  @IsOptional()
  primary_contact_phone?: string;

  @IsString()
  @IsOptional()
  emergency_contact_name?: string;

  @IsString()
  @IsOptional()
  emergency_contact_phone?: string;

  @IsString()
  @IsOptional()
  office_address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  postal_code?: string;

  @IsString()
  @IsOptional()
  tax_id_ein?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  site_ids?: string[] = [];
}

export class UpdateContractorDto {
  @IsString()
  @IsOptional()
  company_name?: string;

  @IsString()
  @IsOptional()
  company_code?: string;

  @IsString()
  @IsOptional()
  tier?: string;

  @IsArray()
  @IsOptional()
  specialties?: string[];

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  safety_grade?: string;

  @IsNumber()
  @IsOptional()
  prequal_score?: number;

  @IsDateString()
  @IsOptional()
  prequal_valid_until?: string;

  @IsString()
  @IsOptional()
  primary_contact_name?: string;

  @IsString()
  @IsOptional()
  primary_contact_title?: string;

  @IsString()
  @IsOptional()
  primary_contact_email?: string;

  @IsString()
  @IsOptional()
  primary_contact_phone?: string;

  @IsString()
  @IsOptional()
  emergency_contact_name?: string;

  @IsString()
  @IsOptional()
  emergency_contact_phone?: string;

  @IsString()
  @IsOptional()
  office_address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  postal_code?: string;

  @IsString()
  @IsOptional()
  tax_id_ein?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  site_ids?: string[];
}

export class CreateContractorDocumentDto {
  @IsString()
  document_type!: string;

  @IsString()
  title!: string;

  @IsString()
  file_name!: string;

  @IsString()
  file_url!: string;

  @IsNumber()
  @IsOptional()
  file_size_bytes?: number;

  @IsString()
  @IsOptional()
  mime_type?: string = 'application/pdf';

  @IsString()
  @IsOptional()
  policy_number?: string;

  @IsString()
  @IsOptional()
  insurance_carrier?: string;

  @IsNumber()
  @IsOptional()
  coverage_amount_usd?: number;

  @IsDateString()
  @IsOptional()
  effective_date?: string;

  @IsDateString()
  @IsOptional()
  expiration_date?: string;
}

export class VerifyContractorDocumentDto {
  @IsString()
  verification_status!: 'VERIFIED' | 'REJECTED';

  @IsString()
  @IsOptional()
  rejection_reason?: string;
}

export class PortalUpdateProfileDto {
  @IsString()
  @IsOptional()
  primary_contact_name?: string;

  @IsString()
  @IsOptional()
  primary_contact_title?: string;

  @IsString()
  @IsOptional()
  primary_contact_phone?: string;

  @IsString()
  @IsOptional()
  primary_contact_email?: string;

  @IsString()
  @IsOptional()
  emergency_contact_name?: string;

  @IsString()
  @IsOptional()
  emergency_contact_phone?: string;

  @IsString()
  @IsOptional()
  office_address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  postal_code?: string;
}

export class UpsertContractorMetricsDto {
  @IsNumber()
  year!: number;

  @IsNumber()
  total_hours_worked!: number;

  @IsNumber()
  @IsOptional()
  fatalities_count?: number = 0;

  @IsNumber()
  @IsOptional()
  recordable_cases_count?: number = 0;

  @IsNumber()
  @IsOptional()
  dart_cases_count?: number = 0;

  @IsNumber()
  @IsOptional()
  emr?: number = 1.0;

  @IsString()
  @IsOptional()
  emr_carrier?: string;

  @IsNumber()
  @IsOptional()
  osha_citations_count?: number = 0;

  @IsNumber()
  @IsOptional()
  osha_citations_penalties_usd?: number = 0;

  @IsBoolean()
  @IsOptional()
  has_written_safety_program?: boolean = true;

  @IsBoolean()
  @IsOptional()
  has_subcontractor_management_plan?: boolean = true;
}

export class EvaluateContractorPrequalDto {
  @IsString()
  @IsOptional()
  evaluation_notes?: string;
}

export class CreateVarianceRequestDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  reason_category?: string = 'GRADE_C_CONDITIONAL';

  @IsString()
  justification!: string;

  @IsString()
  work_scope!: string;

  @IsString()
  @IsOptional()
  target_unit_id?: string;

  @IsString()
  @IsOptional()
  target_site_id?: string;

  @IsArray()
  @IsOptional()
  required_mitigations?: string[] = [];

  @IsDateString()
  @IsOptional()
  starts_at?: string;

  @IsDateString()
  @IsOptional()
  expires_at?: string;
}

export class ApproveVarianceDto {
  @IsString()
  decision!: 'APPROVED' | 'REJECTED';

  @IsString()
  @IsOptional()
  approval_notes?: string;
}

export class CreateContractorWorkerDto {
  @IsString()
  contractor_id!: string;

  @IsString()
  first_name!: string;

  @IsString()
  last_name!: string;

  @IsString()
  @IsOptional()
  worker_code?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  badge_number?: string;

  @IsString()
  @IsOptional()
  craft_trade?: string = 'GENERAL_LABOR';

  @IsString()
  @IsOptional()
  craft_skill_level?: string = 'JOURNEYMAN';

  @IsString()
  @IsOptional()
  badge_status?: string = 'ACTIVE';

  @IsString()
  @IsOptional()
  emergency_contact_name?: string;

  @IsString()
  @IsOptional()
  emergency_contact_phone?: string;

  @IsString()
  @IsOptional()
  photo_url?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateContractorWorkerDto {
  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  badge_number?: string;

  @IsString()
  @IsOptional()
  craft_trade?: string;

  @IsString()
  @IsOptional()
  craft_skill_level?: string;

  @IsString()
  @IsOptional()
  badge_status?: string;

  @IsString()
  @IsOptional()
  emergency_contact_name?: string;

  @IsString()
  @IsOptional()
  emergency_contact_phone?: string;

  @IsString()
  @IsOptional()
  photo_url?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class AddWorkerCertDto {
  @IsString()
  certification_name!: string;

  @IsString()
  @IsOptional()
  certification_category?: string = 'PROCESS_SAFETY';

  @IsString()
  certifying_body!: string;

  @IsString()
  @IsOptional()
  certificate_number?: string;

  @IsDateString()
  issue_date!: string;

  @IsDateString()
  @IsOptional()
  expiration_date?: string;

  @IsString()
  @IsOptional()
  document_url?: string;

  @IsBoolean()
  @IsOptional()
  is_ptw_blocking?: boolean = true;
}

export class VerifyCertDto {
  @IsString()
  verification_status!: 'VERIFIED' | 'REJECTED' | 'EXPIRED';

  @IsString()
  @IsOptional()
  verification_notes?: string;
}

export class CheckPtwEligibilityDto {
  @IsArray()
  @IsOptional()
  required_certifications?: string[] = [];
}

// ============================================================================
// Phase 4: Induction Courses & QR Gate Pass DTOs
// ============================================================================

export class CreateInductionCourseDto {
  @IsString()
  course_code!: string;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  site_id?: string;

  @IsString()
  @IsOptional()
  unit_id?: string;

  @IsString()
  @IsOptional()
  target_audience?: string = 'ALL_CONTRACTORS';

  @IsNumber()
  @IsOptional()
  passing_score_percent?: number = 80;

  @IsNumber()
  @IsOptional()
  validity_period_days?: number = 365;

  @IsArray()
  @IsOptional()
  slides_content?: any[] = [];

  @IsArray()
  @IsOptional()
  quiz_questions?: any[] = [];

  @IsBoolean()
  @IsOptional()
  is_mandatory?: boolean = true;
}

export class UpdateInductionCourseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  target_audience?: string;

  @IsNumber()
  @IsOptional()
  passing_score_percent?: number;

  @IsNumber()
  @IsOptional()
  validity_period_days?: number;

  @IsArray()
  @IsOptional()
  slides_content?: any[];

  @IsArray()
  @IsOptional()
  quiz_questions?: any[];

  @IsBoolean()
  @IsOptional()
  is_mandatory?: boolean;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class SubmitInductionQuizDto {
  @IsArray()
  answers!: number[]; // Array of selected option indices

  @IsBoolean()
  hazard_acknowledgment_signed!: boolean;

  @IsString()
  signature_name!: string;
}

export class IssueGatePassDto {
  @IsString()
  worker_id!: string;

  @IsArray()
  @IsOptional()
  authorized_sites?: string[] = [];

  @IsArray()
  @IsOptional()
  authorized_units?: string[] = [];

  @IsDateString()
  @IsOptional()
  valid_until?: string;
}

export class ScanGatePassDto {
  @IsString()
  pass_code!: string;

  @IsString()
  @IsOptional()
  gate_location?: string = 'MAIN_GATE_TURNSTILE_1';
}

// ============================================================================
// Phase 5: Post-Job Evaluation & OSHA Audit DTOs
// ============================================================================

export class CreatePostJobEvaluationDto {
  @IsString()
  contractor_id!: string;

  @IsString()
  work_order_or_job_number!: string;

  @IsString()
  evaluation_title!: string;

  @IsDateString()
  @IsOptional()
  evaluation_date?: string | undefined;

  @IsString()
  @IsOptional()
  work_category?: string | undefined = 'ROUTINE_MAINTENANCE';

  @IsString()
  @IsOptional()
  site_id?: string | undefined;

  @IsString()
  @IsOptional()
  unit_id?: string | undefined;

  @IsNumber()
  ppe_compliance_score!: number; // 1 - 5

  @IsNumber()
  housekeeping_score!: number; // 1 - 5

  @IsNumber()
  ptw_adherence_score!: number; // 1 - 5

  @IsNumber()
  near_miss_reporting_score!: number; // 1 - 5

  @IsNumber()
  stop_work_authority_score!: number; // 1 - 5

  @IsNumber()
  quality_and_craftsmanship_score!: number; // 1 - 5

  @IsNumber()
  schedule_adherence_score!: number; // 1 - 5

  @IsBoolean()
  @IsOptional()
  safety_incidents_occurred?: boolean | undefined = false;

  @IsString()
  @IsOptional()
  incidents_summary?: string | undefined;

  @IsString()
  @IsOptional()
  strengths?: string | undefined;

  @IsString()
  @IsOptional()
  improvement_areas?: string | undefined;

  @IsBoolean()
  @IsOptional()
  recommend_for_future_work?: boolean | undefined = true;

  @IsString()
  supervisor_signature_name!: string;
}

export class AcknowledgeEvaluationDto {
  @IsString()
  @IsOptional()
  vendor_feedback_comments?: string | undefined;
}

export class GenerateAuditPackageDto {
  @IsString()
  @IsOptional()
  contractor_id?: string | undefined;

  @IsString()
  @IsOptional()
  site_id?: string | undefined;

  @IsNumber()
  @IsOptional()
  year?: number | undefined;

  @IsDateString()
  @IsOptional()
  date_from?: string | undefined;

  @IsDateString()
  @IsOptional()
  date_to?: string | undefined;
}
