import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class MocClosureChecklistService {
  constructor(private readonly db: SupabaseService) {}

  async recalculate(tenantId: string, moc: any, actorId?: string) {
    const actions = moc.actions ?? [];
    const impact = moc.impact?.answers ?? {};
    const engineering = moc.engineeringPackage;
    const items = [
      this.item('sop_procedure_updates', 'SOP / procedure updates', impact.sopUpdateRequired || impact.proceduresAffected, 'closure', actions),
      this.item('pid_drawing_updates', 'P&ID / drawing updates', impact.pidUpdateRequired || impact.equipmentAffected, 'closure', actions),
      this.item('sds_chemical_updates', 'SDS / chemical updates', impact.sdsUpdateRequired || impact.chemistryAffected, 'closure', actions),
      this.item('psi_updates', 'PSI updates', impact.psiUpdateRequired || impact.documentControlUpdateRequired, 'closure', actions),
      this.item('engineering_package', 'Engineering package', true, 'approval', actions, engineering?.readiness_status === 'Ready' || engineering?.status === 'Approved'),
      this.item('training', 'Training', impact.trainingRequired, 'startup', actions),
      this.item('hazop_lopa', 'HAZOP / LOPA', impact.hazopDeviationReviewRequired || impact.lopaReviewRequired || ['High', 'Critical'].includes(moc.risk_level), 'startup', actions),
      this.item('pssr', 'PSSR', Boolean(moc.pssr?.required || ['High', 'Critical'].includes(moc.risk_level)), 'startup', actions, moc.pssr?.status === 'Completed' || moc.pssr?.status === 'Ready'),
      this.item('equipment_registry', 'Equipment Registry', impact.equipmentRegistryUpdateRequired || impact.equipmentAffected, 'closure', actions),
      this.item('temporary_reversal', 'Temporary reversal', moc.change_type === 'Temporary Change', 'closure', actions, moc.change_type !== 'Temporary Change' || Boolean(moc.temporary?.reversal_plan)),
      this.item('emergency_review', 'Emergency review', moc.change_type === 'Emergency Change', 'closure', actions, moc.change_type !== 'Emergency Change' || moc.emergency?.review_status === 'Completed'),
      this.item('evidence', 'Evidence', actions.some((row: any) => row.evidence_required || row.evidenceRequired), 'closure', actions),
      this.item('verification', 'Verification', actions.some((row: any) => row.verification_required || row.verificationRequired), 'closure', actions)
    ];
    const rows = [];
    for (const item of items) {
      rows.push(await this.db.single<any>(this.db.from('moc_closure_checklist').upsert({
        id: `${moc.id}_${item.checklist_key}`,
        tenant_id: tenantId,
        company_id: moc.company_id,
        site_id: moc.site_id,
        moc_id: moc.id,
        ...item,
        completed_at: item.status === 'Green' ? new Date().toISOString() : null,
        completed_by: item.status === 'Green' ? actorId ?? moc.originator_id ?? null : null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'moc_id,checklist_key' }).select().single()));
    }
    return rows;
  }

  list(tenantId: string, mocId: string) {
    return this.db.many<any>(this.db.from('moc_closure_checklist').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId).order('checklist_key'));
  }

  private item(checklistKey: string, title: string, required: boolean, blockingStage: string, actions: any[], externalComplete = false) {
    const titleKeyword = title.split(' ')[0] ?? title;
    const keyKeyword = checklistKey.split('_')[0] ?? checklistKey;
    const related = actions.filter((action) => String(action.title ?? action.action_title ?? '').toLowerCase().includes(titleKeyword.toLowerCase()) || String(action.action_type ?? '').toLowerCase().includes(keyKeyword));
    const complete = externalComplete || related.some((action) => ['Completed', 'Closed', 'CLOSED'].includes(action.status) && (!action.verification_required || action.verification_status === 'Verified'));
    const blocking = related.some((action) => (blockingStage === 'startup' ? action.required_before_startup : action.required_before_closure) && !['Completed', 'Closed', 'CLOSED'].includes(action.status));
    return {
      checklist_key: checklistKey,
      title,
      required: Boolean(required),
      blocking_stage: required ? blockingStage : null,
      linked_action_id: related[0]?.action_id ?? related[0]?.id ?? null,
      status: !required ? 'Gray' : complete ? 'Green' : blocking ? 'Red' : 'Amber'
    };
  }
}
