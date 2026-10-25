import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { SupabaseService } from '../database/supabase.service';
import type { OpScope } from './operating-procedures.service';

type Row = Record<string, any>;

@Injectable()
export class OpAuthoringService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  // ---------------------------------------------------------------- Revisions
  async getRevisions(scope: OpScope, procedureId: string) {
    await this.assertProcedure(scope, procedureId);
    return this.db.many<Row>(
      this.db
        .from('op_revisions')
        .select('*')
        .eq('company_id', scope.companyId)
        .eq('procedure_id', procedureId)
        .order('revision_number', { ascending: false })
    );
  }

  async getRevision(scope: OpScope, procedureId: string, revisionId: string) {
    const rev = await this.db.single<Row>(
      this.db
        .from('op_revisions')
        .select('*')
        .eq('company_id', scope.companyId)
        .eq('procedure_id', procedureId)
        .eq('id', revisionId)
        .maybeSingle()
    );
    if (!rev) throw new NotFoundException('Revision not found.');

    const [sections, steps, comments] = await Promise.all([
      this.db.many<Row>(
        this.db
          .from('op_sections')
          .select('*')
          .eq('revision_id', revisionId)
          .order('section_order', { ascending: true })
      ),
      this.db.many<Row>(
        this.db
          .from('op_steps')
          .select('*')
          .eq('revision_id', revisionId)
          .order('step_order', { ascending: true })
      ),
      this.db.many<Row>(
        this.db
          .from('op_step_comments')
          .select('*')
          .eq('revision_id', revisionId)
          .order('created_at', { ascending: false })
      )
    ]);

    // Attach step hazards
    const stepIds = steps.map((s) => s.id);
    let hazards: Row[] = [];
    if (stepIds.length > 0) {
      hazards = await this.db.many<Row>(
        this.db.from('op_step_hazards').select('*').in('step_id', stepIds)
      );
    }

    const stepsWithHazards = steps.map((s) => ({
      ...s,
      hazards: hazards.filter((h) => h.step_id === s.id)
    }));

    return {
      ...rev,
      sections,
      steps: stepsWithHazards,
      comments
    };
  }

  async createRevision(userId: string, scope: OpScope, procedureId: string, dto: Row) {
    const proc = await this.assertProcedure(scope, procedureId);
    const existing = await this.db.many<Row>(
      this.db
        .from('op_revisions')
        .select('revision_number')
        .eq('company_id', scope.companyId)
        .eq('procedure_id', procedureId)
        .order('revision_number', { ascending: false })
        .limit(1)
    );

    const nextNumber = (existing[0]?.revision_number ?? 0) + 1;
    const revisionLabel = dto.revisionLabel ?? `Rev ${nextNumber}.0`;

    const newRev = await this.db.single<Row>(
      this.db
        .from('op_revisions')
        .insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: proc.site_id,
          procedure_id: procedureId,
          revision_number: nextNumber,
          revision_label: revisionLabel,
          status: 'Draft',
          change_summary: dto.changeSummary ?? 'New draft revision',
          change_reason: dto.changeReason ?? 'Periodic Review',
          moc_id: dto.mocId ?? null,
          created_by: userId,
          updated_by: userId
        })
        .select('*')
        .single()
    );

    // If source revision specified, clone sections and steps
    if (dto.sourceRevisionId) {
      await this.cloneRevisionContent(userId, scope, dto.sourceRevisionId, newRev!.id);
    } else {
      // Auto-apply default template if available
      await this.applyDefaultTemplate(userId, scope, proc.procedure_type_code, newRev!.id);
    }

    // Update procedure current_revision_id and procedure_status
    await this.db.single(
      this.db
        .from('op_procedures')
        .update({
          current_revision_id: newRev!.id,
          current_revision_label: revisionLabel,
          procedure_status: proc.procedure_status === 'Published' ? 'Under Revision' : 'Draft',
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', procedureId)
    );

    return this.getRevision(scope, procedureId, newRev!.id);
  }

  // ---------------------------------------------------------------- Sections
  async saveSection(userId: string, scope: OpScope, revisionId: string, dto: Row) {
    const rev = await this.assertRevision(scope, revisionId);
    if (rev.locked || rev.status === 'Published') {
      throw new BadRequestException('Revision is locked or published.');
    }

    if (dto.id) {
      // Update
      return this.db.single<Row>(
        this.db
          .from('op_sections')
          .update({
            section_title: dto.sectionTitle,
            section_kind: dto.sectionKind ?? 'steps',
            section_order: dto.sectionOrder ?? 10,
            content_markdown: dto.contentMarkdown ?? null,
            content_json: dto.contentJson ?? null,
            updated_at: new Date().toISOString()
          })
          .eq('id', dto.id)
          .eq('revision_id', revisionId)
          .select('*')
          .single()
      );
    }

    // Insert
    return this.db.single<Row>(
      this.db
        .from('op_sections')
        .insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: rev.site_id,
          revision_id: revisionId,
          section_title: dto.sectionTitle ?? 'Untitled Section',
          section_kind: dto.sectionKind ?? 'steps',
          section_order: dto.sectionOrder ?? 10,
          content_markdown: dto.contentMarkdown ?? null,
          content_json: dto.contentJson ?? null,
          created_by: userId
        })
        .select('*')
        .single()
    );
  }

  async deleteSection(scope: OpScope, sectionId: string) {
    const sec = await this.db.single<Row>(
      this.db.from('op_sections').select('*, op_revisions(status, locked)').eq('id', sectionId).maybeSingle()
    );
    if (!sec) throw new NotFoundException('Section not found.');
    return this.db.single(this.db.from('op_sections').delete().eq('id', sectionId));
  }

  // ---------------------------------------------------------------- Steps
  async saveStep(userId: string, scope: OpScope, revisionId: string, dto: Row) {
    const rev = await this.assertRevision(scope, revisionId);
    if (rev.locked || rev.status === 'Published') {
      throw new BadRequestException('Revision is locked or published.');
    }

    if (!dto.sectionId) throw new BadRequestException('sectionId is required.');

    const stepPayload: Row = {
      section_id: dto.sectionId,
      step_order: Number(dto.stepOrder ?? 10),
      step_number: String(dto.stepNumber ?? '1.0'),
      step_title: dto.stepTitle ?? null,
      step_text: dto.stepText ?? '',
      step_type: dto.stepType ?? 'action',
      role_required: dto.roleRequired ?? null,
      is_critical: Boolean(dto.isCritical),
      requires_signoff: Boolean(dto.requiresSignoff),
      requires_witness: Boolean(dto.requiresWitness),
      expected_value: dto.expectedValue ?? null,
      min_value: dto.minValue !== undefined && dto.minValue !== null && dto.minValue !== '' ? Number(dto.minValue) : null,
      max_value: dto.maxValue !== undefined && dto.maxValue !== null && dto.maxValue !== '' ? Number(dto.maxValue) : null,
      uom: dto.uom ?? null,
      psi_sol_id: dto.psiSolId ?? null,
      equipment_id: dto.equipmentId ?? null,
      equipment_tag: dto.equipmentTag ?? null,
      estimated_duration_minutes: dto.estimatedDurationMinutes ? Number(dto.estimatedDurationMinutes) : null,
      branch_condition: dto.branchCondition ?? null,
      branch_next_step: dto.branchNextStep ?? null,
      updated_at: new Date().toISOString()
    };

    if (dto.id) {
      return this.db.single<Row>(
        this.db
          .from('op_steps')
          .update(stepPayload)
          .eq('id', dto.id)
          .eq('revision_id', revisionId)
          .select('*')
          .single()
      );
    }

    return this.db.single<Row>(
      this.db
        .from('op_steps')
        .insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: rev.site_id,
          revision_id: revisionId,
          parent_step_id: dto.parentStepId ?? null,
          created_by: userId,
          ...stepPayload
        })
        .select('*')
        .single()
    );
  }

  async deleteStep(scope: OpScope, stepId: string) {
    const step = await this.db.single<Row>(
      this.db.from('op_steps').select('id, revision_id').eq('id', stepId).maybeSingle()
    );
    if (!step) throw new NotFoundException('Step not found.');
    return this.db.single(this.db.from('op_steps').delete().eq('id', stepId));
  }

  async reorderSteps(scope: OpScope, revisionId: string, stepIds: string[]) {
    await this.assertRevision(scope, revisionId);
    const updates = stepIds.map((id, index) =>
      this.db.from('op_steps').update({ step_order: (index + 1) * 10 }).eq('id', id).eq('revision_id', revisionId)
    );
    await Promise.all(updates);
    return { success: true };
  }

  // ---------------------------------------------------------------- Hazards
  async addStepHazard(scope: OpScope, stepId: string, dto: Row) {
    const step = await this.db.single<Row>(
      this.db.from('op_steps').select('id, company_id, site_id').eq('id', stepId).maybeSingle()
    );
    if (!step) throw new NotFoundException('Step not found.');

    return this.db.single<Row>(
      this.db
        .from('op_step_hazards')
        .insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: step.site_id,
          step_id: stepId,
          hazard_level: dto.hazardLevel ?? 'WARNING',
          hazard_text: dto.hazardText ?? 'Operational hazard alert',
          consequence_of_deviation: dto.consequenceOfDeviation ?? null,
          corrective_steps: dto.correctiveSteps ?? null,
          ppe_required: Array.isArray(dto.ppeRequired) ? dto.ppeRequired : []
        })
        .select('*')
        .single()
    );
  }

  async removeStepHazard(scope: OpScope, hazardId: string) {
    return this.db.single(this.db.from('op_step_hazards').delete().eq('id', hazardId));
  }

  // ---------------------------------------------------------------- Comments
  async addComment(userId: string, scope: OpScope, revisionId: string, dto: Row) {
    await this.assertRevision(scope, revisionId);
    return this.db.single<Row>(
      this.db
        .from('op_step_comments')
        .insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          site_id: null,
          revision_id: revisionId,
          step_id: dto.stepId ?? null,
          comment_text: dto.commentText,
          author_user_id: userId
        })
        .select('*')
        .single()
    );
  }

  async resolveComment(userId: string, scope: OpScope, commentId: string) {
    return this.db.single<Row>(
      this.db
        .from('op_step_comments')
        .update({
          is_resolved: true,
          resolved_by: userId,
          resolved_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select('*')
        .single()
    );
  }

  // ---------------------------------------------------------------- Templates
  async getTemplates(scope: OpScope, typeCode?: string) {
    let q = this.db.from('op_templates').select('*').eq('company_id', scope.companyId).eq('active', true);
    if (typeCode) q = q.eq('procedure_type_code', typeCode);
    return this.db.many<Row>(q);
  }

  private async applyDefaultTemplate(userId: string, scope: OpScope, typeCode: string, revisionId: string) {
    const tpl = await this.db.single<Row>(
      this.db
        .from('op_templates')
        .select('*')
        .eq('company_id', scope.companyId)
        .eq('procedure_type_code', typeCode)
        .eq('is_default', true)
        .maybeSingle()
    );

    const sections = tpl?.sections_json ?? [
      { title: '1.0 Purpose & Scope', kind: 'purpose', order: 10 },
      { title: '2.0 Safety & Hazard Controls', kind: 'hazards', order: 20 },
      { title: '3.0 Step-by-Step Instructions', kind: 'steps', order: 30 }
    ];

    for (const sec of sections) {
      await this.db.single(
        this.db.from('op_sections').insert({
          id: crypto.randomUUID(),
          company_id: scope.companyId,
          revision_id: revisionId,
          section_title: sec.title,
          section_kind: sec.kind ?? 'steps',
          section_order: sec.order ?? 10,
          created_by: userId
        })
      );
    }
  }

  private async cloneRevisionContent(userId: string, scope: OpScope, sourceRevId: string, targetRevId: string) {
    const [sections, steps] = await Promise.all([
      this.db.many<Row>(this.db.from('op_sections').select('*').eq('revision_id', sourceRevId)),
      this.db.many<Row>(this.db.from('op_steps').select('*').eq('revision_id', sourceRevId))
    ]);

    const sectionMap = new Map<string, string>();
    for (const s of sections) {
      const newSecId = crypto.randomUUID();
      sectionMap.set(s.id, newSecId);
      await this.db.single(
        this.db.from('op_sections').insert({
          id: newSecId,
          company_id: scope.companyId,
          revision_id: targetRevId,
          section_title: s.section_title,
          section_kind: s.section_kind,
          section_order: s.section_order,
          content_markdown: s.content_markdown,
          content_json: s.content_json,
          created_by: userId
        })
      );
    }

    for (const st of steps) {
      const targetSecId = sectionMap.get(st.section_id);
      if (!targetSecId) continue;
      await this.db.single(
        this.db.from('op_steps').insert({
          ...st,
          id: crypto.randomUUID(),
          revision_id: targetRevId,
          section_id: targetSecId,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      );
    }
  }

  private async assertProcedure(scope: OpScope, procedureId: string) {
    const row = await this.db.single<Row>(
      this.db.from('op_procedures').select('*').eq('company_id', scope.companyId).eq('id', procedureId).maybeSingle()
    );
    if (!row) throw new NotFoundException('Procedure not found.');
    return row;
  }

  private async assertRevision(scope: OpScope, revisionId: string) {
    const row = await this.db.single<Row>(
      this.db.from('op_revisions').select('*').eq('company_id', scope.companyId).eq('id', revisionId).maybeSingle()
    );
    if (!row) throw new NotFoundException('Revision not found.');
    return row;
  }
}
