import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../database/supabase.service';
import type { OpScope } from './operating-procedures.service';

type Row = Record<string, any>;

@Injectable()
export class OpCertificationService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  // ---------------------------------------------------------------- Cycles
  async getCycles(scope: OpScope, query: Row = {}) {
    const year = Number(query.year ?? new Date().getFullYear());
    let q = this.db
      .from('op_certification_cycles')
      .select('*, op_procedures!inner(id, procedure_number, title, procedure_status, criticality, review_frequency_months, site_id, unit_id)')
      .eq('company_id', scope.companyId)
      .eq('cycle_year', year);

    if (scope.selectedSiteId && !scope.corporateView) {
      q = q.eq('site_id', scope.selectedSiteId);
    }
    if (query.status) {
      q = q.eq('status', query.status);
    }

    const rows = await this.db.many<Row>(q.order('due_date', { ascending: true }));
    return rows;
  }

  async getProcedureCertification(scope: OpScope, procedureId: string) {
    const [proc, cycles, reviews] = await Promise.all([
      this.assertProcedure(scope, procedureId),
      this.db.many<Row>(
        this.db
          .from('op_certification_cycles')
          .select('*')
          .eq('company_id', scope.companyId)
          .eq('procedure_id', procedureId)
          .order('cycle_year', { ascending: false })
      ),
      this.db.many<Row>(
        this.db
          .from('op_certification_reviews')
          .select('*')
          .eq('company_id', scope.companyId)
          .eq('procedure_id', procedureId)
          .order('certified_at', { ascending: false })
      )
    ]);

    return {
      procedure: proc,
      cycles,
      reviews
    };
  }

  async getChecklistItems(scope: OpScope) {
    return this.db.many<Row>(
      this.db
        .from('op_certification_checklist_items')
        .select('*')
        .eq('company_id', scope.companyId)
        .eq('active', true)
        .order('sort_order', { ascending: true })
    );
  }

  // ---------------------------------------------------------------- Certification Action
  async recordReview(userId: string, scope: OpScope, cycleId: string, dto: Row) {
    const cycle = await this.db.single<Row>(
      this.db
        .from('op_certification_cycles')
        .select('*, op_procedures!inner(*)')
        .eq('id', cycleId)
        .eq('company_id', scope.companyId)
        .maybeSingle()
    );
    if (!cycle) throw new NotFoundException('Certification cycle not found.');

    const proc = cycle.op_procedures;
    const outcome = dto.outcome ?? 'Current & Accurate (No Change)';
    if (!['Current & Accurate (No Change)', 'Certified with Minor Edits', 'Revision Required via MOC'].includes(outcome)) {
      throw new BadRequestException('Invalid certification outcome.');
    }

    const today = new Date().toISOString().slice(0, 10);
    const reviewFrequencyMonths = proc.review_frequency_months ?? 12;

    const nextDueDate = new Date(`${today}T00:00:00Z`);
    nextDueDate.setUTCMonth(nextDueDate.getUTCMonth() + reviewFrequencyMonths);
    const nextDueStr = nextDueDate.toISOString().slice(0, 10);

    const certStatus =
      outcome === 'Current & Accurate (No Change)'
        ? 'Certified'
        : outcome === 'Certified with Minor Edits'
        ? 'Certified With Changes'
        : 'Certified With Changes';

    // Insert certification review with electronic signature
    const review = await this.db.single<Row>(
      this.db
        .from('op_certification_reviews')
        .insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: proc.site_id,
          cycle_id: cycleId,
          procedure_id: proc.id,
          reviewer_user_id: userId,
          checklist_responses: dto.checklistResponses ?? {},
          findings_summary: dto.findingsSummary ?? null,
          outcome,
          meaning_of_signature:
            dto.meaningOfSignature ??
            'I certify that I have reviewed this operating procedure and verify that it reflects current operating practice and safe operating limits per OSHA 1910.119(f)(3).',
          signature_hash: dto.signatureHash ?? crypto.randomUUID(),
          esignature_id: dto.esignatureId ?? null,
          certified_at: new Date().toISOString()
        })
        .select('*')
        .single()
    );

    // Update cycle record
    await this.db
      .from('op_certification_cycles')
      .update({
        status: certStatus,
        last_certified_at: today,
        completed_at: new Date().toISOString(),
        notes: dto.findingsSummary ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('id', cycleId);

    // Update procedure master record
    await this.db
      .from('op_procedures')
      .update({
        last_certified_at: today,
        next_certification_due: nextDueStr,
        certification_status: certStatus,
        procedure_status: outcome === 'Revision Required via MOC' ? 'Under Revision' : proc.procedure_status,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', proc.id);

    // Log immutable history event
    await this.audit.write({
      tenantId: scope.companyId,
      actorId: userId,
      action: 'Procedure Certified Annually',
      entityType: 'OperatingProcedureCertification',
      entityId: proc.id,
      metadata: { cycleId, outcome, nextDue: nextDueStr, sourceModule: 'Operating Procedures Certification' }
    } as any).catch(() => null);

    await this.db.single(
      this.db.from('op_history_events').insert({
        id: crypto.randomUUID(),
        company_id: scope.companyId,
        site_id: proc.site_id,
        procedure_id: proc.id,
        event_type: 'ANNUAL_CERTIFICATION_COMPLETED',
        event_title: `OSHA Annual Certification: ${outcome}`,
        event_description: `Certified current and accurate per 29 CFR 1910.119(f)(3). Next due: ${nextDueStr}.`,
        actor_user_id: userId
      }).select('id').single()
    ).catch(() => null);

    return this.getProcedureCertification(scope, proc.id);
  }

  // ---------------------------------------------------------------- Annual Employer Statements
  async generateStatement(userId: string, scope: OpScope, siteId: string, year: number) {
    // Tally procedures for this site
    const procs = await this.db.many<Row>(
      this.db
        .from('op_procedures')
        .select('id, procedure_status, certification_status, next_certification_due')
        .eq('company_id', scope.companyId)
        .eq('site_id', siteId)
        .is('archived_at', null)
    );

    const total = procs.length;
    const certified = procs.filter((p) => p.certification_status === 'Certified' || p.certification_status === 'Certified With Changes').length;
    const underRevision = procs.filter((p) => p.procedure_status === 'Under Revision').length;
    const overdue = procs.filter((p) => p.certification_status === 'Overdue').length;
    const compliancePct = total > 0 ? Math.round((certified / total) * 100) : 100;

    const statementText =
      `ANNUAL EMPLOYER OPERATING PROCEDURE CERTIFICATION STATEMENT (${year})\n\n` +
      `Pursuant to OSHA 29 CFR 1910.119(f)(3) and EPA RMP 40 CFR 68.69, the employer hereby certifies that the operating procedures for this facility have been reviewed as often as necessary to assure that they reflect current operating practice, including changes that result from changes in process chemicals, technology, and equipment, and changes to facilities.\n\n` +
      `The employer hereby certifies annually that these operating procedures are current and accurate.\n\n` +
      `Site Compliance Summary for Year ${year}:\n` +
      `- Total Active Operating Procedures: ${total}\n` +
      `- Certified Current & Accurate: ${certified} (${compliancePct}%)\n` +
      `- Under Active Revision / MOC: ${underRevision}\n` +
      `- Overdue Procedures: ${overdue}`;

    const statement = await this.db.single<Row>(
      this.db
        .from('op_annual_certification_statements')
        .upsert(
          {
            id: crypto.randomUUID(),
            company_id: scope.companyId,
            site_id: siteId,
            year,
            total_procedures: total,
            certified_procedures: certified,
            procedures_under_revision: underRevision,
            overdue_procedures: overdue,
            compliance_percentage: compliancePct,
            statement_text: statementText,
            statement_status: 'Generated',
            updated_at: new Date().toISOString()
          },
          { onConflict: 'company_id,site_id,year' }
        )
        .select('*')
        .single()
    );

    return statement;
  }

  async signStatement(userId: string, scope: OpScope, statementId: string, dto: Row) {
    const stmt = await this.db.single<Row>(
      this.db.from('op_annual_certification_statements').select('*').eq('id', statementId).eq('company_id', scope.companyId).maybeSingle()
    );
    if (!stmt) throw new NotFoundException('Annual statement not found.');

    const signed = await this.db.single<Row>(
      this.db
        .from('op_annual_certification_statements')
        .update({
          statement_status: 'Certified & Signed',
          signed_by_user_id: userId,
          signed_at: new Date().toISOString(),
          signature_hash: dto.signatureHash ?? crypto.randomUUID(),
          updated_at: new Date().toISOString()
        })
        .eq('id', statementId)
        .select('*')
        .single()
    );

    return signed;
  }

  async getStatements(scope: OpScope, siteId?: string) {
    let q = this.db.from('op_annual_certification_statements').select('*').eq('company_id', scope.companyId);
    if (siteId) q = q.eq('site_id', siteId);
    return this.db.many<Row>(q.order('year', { ascending: false }));
  }

  private async assertProcedure(scope: OpScope, id: string) {
    const row = await this.db.single<Row>(
      this.db.from('op_procedures').select('*').eq('company_id', scope.companyId).eq('id', id).maybeSingle()
    );
    if (!row) throw new NotFoundException('Procedure not found.');
    return row;
  }
}
