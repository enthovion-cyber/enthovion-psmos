import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../database/supabase.service';
import type { OpScope } from './operating-procedures.service';

type Row = Record<string, any>;

@Injectable()
export class OpReportsService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  // ---------------------------------------------------------------- Controlled Document Distribution
  async getControlledCopyWatermark(scope: OpScope, procedureId: string, revisionId?: string) {
    const proc = await this.db.single<Row>(
      this.db.from('op_procedures').select('*').eq('id', procedureId).eq('company_id', scope.companyId).single()
    );
    if (!proc) throw new NotFoundException(`Procedure ${procedureId} not found.`);

    let rev: Row | null = null;
    if (revisionId) {
      rev = await this.db.single<Row>(
        this.db.from('op_revisions').select('*').eq('id', revisionId).eq('procedure_id', procedureId).maybeSingle()
      );
    } else {
      rev = await this.db.single<Row>(
        this.db.from('op_revisions')
          .select('*')
          .eq('procedure_id', procedureId)
          .eq('status', 'Published')
          .order('revision_number', { ascending: false })
          .limit(1)
          .maybeSingle()
      );
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const isCurrentPublished = rev?.status === 'Published';

    return {
      procedureNumber: proc.procedure_number,
      title: proc.title,
      revisionLabel: rev?.revision_label || 'Current',
      effectiveDate: rev?.effective_date || proc.effective_date,
      watermarkText: isCurrentPublished
        ? 'CONTROLLED DOCUMENT - FOR INTERNAL USE ONLY'
        : 'UNCONTROLLED COPY WHEN PRINTED - VERIFY REVISION BEFORE USE',
      printDate: todayStr,
      validOnlyOnDate: todayStr,
      verificationUrl: `/operating-procedures/${procedureId}`,
      psmCovered: proc.is_psm_covered,
      regulatoryBasis: proc.regulatory_basis
    };
  }

  // ---------------------------------------------------------------- OSHA 1910.119(f) Audit Evidence Package
  async generateAuditPackage(userId: string, scope: OpScope, dto: Row = {}) {
    const year = dto.year ?? new Date().getUTCFullYear();
    const countRes = await this.db.many<Row>(
      this.db.from('op_audit_packages').select('id').eq('company_id', scope.companyId)
    );
    const packageNumber = `AUDIT-PKG-OP-${year}-${String((countRes?.length ?? 0) + 1).padStart(4, '0')}`;
    const packageId = crypto.randomUUID();

    // Compile 1910.119(f) Evidence Components
    const [
      procedures,
      certStatements,
      certReviews,
      swpPrograms,
      changeFlags,
      acknowledgmentSummary,
      executionSummary
    ] = await Promise.all([
      // 1910.119(f)(1) All Procedures & Scopes
      this.db.many<Row>(
        this.db.from('op_procedures')
          .select('id, procedure_number, title, procedure_type_code, operating_mode, criticality, is_psm_covered, procedure_status, certification_status, effective_date, last_certified_at, next_certification_due')
          .eq('company_id', scope.companyId)
      ),
      // 1910.119(f)(3) Annual Certification Statements
      this.db.many<Row>(
        this.db.from('op_annual_certification_statements')
          .select('*')
          .eq('company_id', scope.companyId)
          .eq('year', year)
      ),
      // 1910.119(f)(3) Periodic SME Review Log
      this.db.many<Row>(
        this.db.from('op_certification_reviews')
          .select('id, procedure_id, outcome, certified_at, findings_summary, reviewer_user_id')
          .eq('company_id', scope.companyId)
          .limit(100)
      ),
      // 1910.119(f)(4) Safe Work Practice Programs
      this.db.many<Row>(
        this.db.from('op_swp_programs')
          .select('program_code, program_name, regulatory_reference, permit_required, is_active')
          .eq('company_id', scope.companyId)
      ),
      // 1910.119(l) MOC Change Flags
      this.db.many<Row>(
        this.db.from('op_change_flags')
          .select('id, procedure_id, source_type, source_reference, priority, status, created_at, resolved_at')
          .eq('company_id', scope.companyId)
      ),
      // 1910.119(f)(4) Workforce Read-and-Understand Acknowledgment Stats
      this.db.many<Row>(
        this.db.from('op_acknowledgment_records')
          .select('id, status, due_date, acknowledged_at')
          .eq('company_id', scope.companyId)
      ),
      // Field Execution Runs
      this.db.many<Row>(
        this.db.from('op_executions')
          .select('id, execution_number, execution_mode, status, total_steps, completed_steps, deviated_steps, started_at, completed_at')
          .eq('company_id', scope.companyId)
      )
    ]);

    const totalProcs = procedures.length;
    const certifiedProcs = procedures.filter(p => p.certification_status === 'Certified').length;
    const overdueProcs = procedures.filter(p => p.certification_status === 'Overdue').length;

    const totalAcks = acknowledgmentSummary.length;
    const completedAcks = acknowledgmentSummary.filter(a => a.status === 'Acknowledged').length;
    const ackComplianceRate = totalAcks > 0 ? Math.round((completedAcks / totalAcks) * 100) : 100;

    const auditData = {
      executiveSummary: {
        totalOperatingProcedures: totalProcs,
        certifiedCurrent: certifiedProcs,
        compliancePercentage: totalProcs > 0 ? Math.round((certifiedProcs / totalProcs) * 100) : 100,
        overdueCount: overdueProcs,
        annualStatementSigned: certStatements.some(s => s.statement_status === 'Certified & Signed'),
        workforceAcknowledgmentCompliance: `${ackComplianceRate}%`,
        activeSafeWorkPracticePrograms: swpPrograms.filter(s => s.is_active).length,
        openChangeFlags: changeFlags.filter(f => f.status === 'Open').length,
        completedExecutionRuns: executionSummary.filter(e => e.status === 'Completed').length,
        solDeviationsLogged: executionSummary.reduce((acc, e) => acc + (e.deviated_steps || 0), 0)
      },
      f1_procedureRegister: procedures,
      f3_annualStatements: certStatements,
      f3_smeReviews: certReviews,
      f4_safeWorkPractices: swpPrograms,
      f4_workforceAcknowledgments: {
        totalAssigned: totalAcks,
        acknowledgedCount: completedAcks,
        compliancePct: ackComplianceRate
      },
      moc_changeFlags: changeFlags,
      fieldExecutions: executionSummary
    };

    const pkg = await this.db.single<Row>(
      this.db.from('op_audit_packages').insert({
        id: packageId,
        company_id: scope.companyId,
        site_id: scope.selectedSiteId,
        package_number: packageNumber,
        title: dto.title ?? `OSHA 29 CFR 1910.119(f) Compliance Package - ${year}`,
        scope_type: dto.scopeType ?? 'Full Site',
        year,
        generated_by_user_id: userId,
        status: 'Ready',
        package_data: auditData
      }).select('*').single()
    );

    await this.audit.write({
      tenantId: scope.companyId,
      actorId: userId,
      action: 'op.audit_package.generate',
      entityType: 'op_audit_package',
      entityId: packageId,
      metadata: { packageNumber, year }
    } as any).catch(() => null);

    return pkg;
  }

  async getAuditPackages(scope: OpScope, query: Row = {}) {
    let q = this.db.from('op_audit_packages')
      .select('id, company_id, site_id, package_number, title, scope_type, year, status, created_at')
      .eq('company_id', scope.companyId);

    if (query.year) {
      q = q.eq('year', query.year);
    }

    q = q.order('created_at', { ascending: false });
    return this.db.many<Row>(q);
  }

  async getAuditPackageDetail(scope: OpScope, packageId: string) {
    const pkg = await this.db.single<Row>(
      this.db.from('op_audit_packages')
        .select('*')
        .eq('id', packageId)
        .eq('company_id', scope.companyId)
        .single()
    );
    if (!pkg) throw new NotFoundException(`Audit package ${packageId} not found.`);
    return pkg;
  }
}
