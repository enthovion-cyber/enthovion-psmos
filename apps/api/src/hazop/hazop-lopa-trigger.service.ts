import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ActionsService } from '../actions/actions.service';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EscalateScenarioToLopaDto } from './dto/hazop.dto';

export type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

@Injectable()
export class HazopLopaTriggerService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly actions: ActionsService,
    private readonly notifications: NotificationsService
  ) {}

  async escalateScenarioToLopa(
    tenantId: string,
    actorId: string,
    studyId: string,
    scenarioId: string,
    dto: EscalateScenarioToLopaDto = {},
    scope?: Scope
  ) {
    // 1. Fetch study
    const study = await this.db.single<any>(
      this.db.from('hazop_studies').select('*').eq('tenant_id', tenantId).eq('id', studyId).maybeSingle()
    );
    if (!study) {
      throw new NotFoundException('HAZOP study not found.');
    }

    if (scope?.allowedSiteIds?.length && study.site_id && !scope.allowedSiteIds.includes(study.site_id)) {
      throw new BadRequestException('You do not have permission to access the site for this study.');
    }

    // 2. Fetch scenario
    const scenario = await this.db.single<any>(
      this.db.from('hazop_scenarios').select('*').eq('tenant_id', tenantId).eq('study_id', studyId).eq('id', scenarioId).maybeSingle()
    );
    if (!scenario) {
      throw new NotFoundException('HAZOP scenario not found.');
    }

    // 3. Fetch node
    const node = await this.db.single<any>(
      this.db.from('hazop_nodes').select('*').eq('tenant_id', tenantId).eq('id', scenario.node_id).maybeSingle()
    );

    // 4. Fetch existing safeguards
    const safeguards = await this.db.many<any>(
      this.db.from('hazop_scenario_safeguards').select('*').eq('tenant_id', tenantId).eq('scenario_id', scenarioId)
    ).catch(() => []);

    // 5. Check if an active LOPA study already exists for this scenario
    const existingLopa = await this.db.single<any>(
      this.db
        .from('lopa_studies')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('source_hazop_scenario_id', scenarioId)
        .not('status', 'in', '("Closed","Cancelled","Superseded")')
        .maybeSingle()
    ).catch(() => null);

    const now = new Date().toISOString();

    if (existingLopa) {
      // Ensure scenario is marked as LOPA required and linked
      await this.db.single(
        this.db
          .from('hazop_scenarios')
          .update({
            lopa_required: true,
            lopa_trigger_source: scenario.lopa_trigger_source ?? 'HAZOP Escalation Engine',
            lopa_trigger_reason: scenario.lopa_trigger_reason ?? dto.reason ?? 'Escalated to LOPA study',
            status: scenario.status === 'Closed' ? scenario.status : 'LOPA Required',
            updated_by: actorId,
            updated_at: now
          })
          .eq('tenant_id', tenantId)
          .eq('id', scenarioId)
          .select('id')
          .single()
      ).catch(() => null);

      await this.ensureLinkedRecord(tenantId, actorId, study, existingLopa, dto.reason);

      return {
        success: true,
        isExisting: true,
        lopaStudyId: existingLopa.id,
        lopaNumber: existingLopa.lopa_number,
        title: existingLopa.title,
        status: existingLopa.status,
        message: `LOPA study ${existingLopa.lopa_number} is already active for this scenario.`
      };
    }

    // 6. Generate next LOPA study number
    const year = new Date().getFullYear();
    const countRows = await this.db.many<any>(
      this.db.from('lopa_studies').select('id').eq('tenant_id', tenantId).ilike('lopa_number', `LOPA-${year}-%`)
    ).catch(() => []);
    const lopaNumber = `LOPA-${year}-${String(countRows.length + 1).padStart(5, '0')}`;

    const title = dto.title || `${study.study_number} - Node ${node?.node_number ?? '1'} - ${scenario.deviation_text || scenario.scenario_number} LOPA`;
    const lopaId = randomUUID();

    const equipmentTag = Array.isArray(node?.equipment_ids) && node.equipment_ids[0]
      ? String(node.equipment_ids[0])
      : null;

    const ownerId = dto.ownerId || scenario.owner_id || study.facilitator_id || study.study_leader_id || actorId;
    const priority = dto.priority || (scenario.risk_level === 'Critical' ? 'Critical' : scenario.risk_level === 'High' ? 'High' : 'Medium');

    const lopaPayload = {
      id: lopaId,
      tenant_id: tenantId,
      company_id: study.company_id ?? null,
      site_id: study.site_id,
      unit_id: study.unit_id ?? null,
      area_id: study.area_id ?? null,
      lopa_number: lopaNumber,
      title,
      description: `Auto-escalated from HAZOP Study ${study.study_number}, Node ${node?.node_number ?? '1'} (${node?.title ?? ''}), Scenario ${scenario.scenario_number}. Cause: ${scenario.cause}. Consequence: ${scenario.consequence}.`,
      study_type: 'HAZOP-triggered LOPA',
      source: 'HAZOP/PHA',
      source_module: 'HAZOP',
      source_record_id: scenario.id,
      source_hazop_scenario_id: scenario.id,
      equipment_tag: equipmentTag,
      owner_id: ownerId,
      facilitator_id: study.facilitator_id ?? null,
      priority,
      status: 'In Preparation',
      consequence_severity: scenario.risk_level ?? 'High',
      initiating_event_frequency: dto.initiatingEventFrequency ?? 0.1,
      calculation_status: 'Not Started',
      sil_required: false,
      sil_gap_status: 'Not Evaluated',
      ipl_validation_status: safeguards.length ? 'Incomplete' : 'Not Started',
      ipl_count: safeguards.length,
      created_by: actorId,
      updated_by: actorId,
      created_at: now,
      updated_at: now
    };

    const createdLopa = await this.db.single<any>(
      this.db.from('lopa_studies').insert(lopaPayload).select().single()
    );

    // 7. Save source snapshot
    await this.db.single(
      this.db.from('lopa_source_snapshots').insert({
        id: randomUUID(),
        tenant_id: tenantId,
        lopa_study_id: lopaId,
        source_module: 'HAZOP',
        source_record_id: scenario.id,
        source_payload: { study, node, scenario, safeguards },
        created_by: actorId,
        created_at: now
      })
    ).catch(() => null);

    // 8. Insert initiating event
    await this.db.single(
      this.db.from('lopa_initiating_events').insert({
        id: randomUUID(),
        tenant_id: tenantId,
        lopa_study_id: lopaId,
        description: scenario.cause || 'HAZOP deviation initiating cause',
        event_category: 'HAZOP Cause',
        frequency_per_year: dto.initiatingEventFrequency ?? 0.1,
        frequency_method: 'Engineering Judgment / HAZOP',
        frequency_source: `HAZOP Study ${study.study_number}`,
        created_at: now
      })
    ).catch(() => null);

    // 9. Insert consequence
    await this.db.single(
      this.db.from('lopa_consequences').insert({
        id: randomUUID(),
        tenant_id: tenantId,
        lopa_study_id: lopaId,
        description: scenario.consequence || 'HAZOP deviation consequence',
        category: 'Process Safety',
        severity: scenario.risk_level || 'High',
        tolerable_event_frequency: scenario.risk_level === 'Critical' ? 1e-5 : 1e-4,
        risk_criteria_source: 'Tenant Risk Matrix',
        created_at: now
      })
    ).catch(() => null);

    // 10. Import existing safeguards as IPL candidates
    for (const s of safeguards) {
      const sgId = randomUUID();
      await this.db.single(
        this.db.from('lopa_imported_safeguards').insert({
          id: sgId,
          tenant_id: tenantId,
          lopa_study_id: lopaId,
          source_safeguard_id: s.id,
          safeguard_name: s.safeguard_name || s.name || s.description || 'Imported HAZOP safeguard',
          safeguard_type: s.safeguard_type || 'Safeguard',
          description: s.description || null,
          proposed_lopa_use: 'IPL Candidate',
          credited_as_ipl: false,
          created_at: now
        })
      ).catch(() => null);

      await this.db.single(
        this.db.from('lopa_study_safeguards').insert({
          id: randomUUID(),
          tenant_id: tenantId,
          lopa_study_id: lopaId,
          source_safeguard_id: s.id,
          safeguard_name: s.safeguard_name || s.name || s.description || 'Imported HAZOP safeguard',
          safeguard_type: s.safeguard_type || 'Safeguard',
          proposed_lopa_use: 'IPL Candidate',
          credited_as_ipl: false,
          created_at: now
        })
      ).catch(() => null);
    }

    // 11. Update HAZOP scenario
    await this.db.single(
      this.db
        .from('hazop_scenarios')
        .update({
          lopa_required: true,
          lopa_trigger_source: 'HAZOP Escalation Engine',
          lopa_trigger_reason: dto.reason || 'Escalated to LOPA from worksheet',
          lopa_triggered_by: actorId,
          lopa_triggered_at: now,
          status: 'LOPA Required',
          updated_by: actorId,
          updated_at: now
        })
        .eq('tenant_id', tenantId)
        .eq('id', scenarioId)
        .select('id')
        .single()
    );

    // 12. Ensure link in hazop_linked_records
    await this.ensureLinkedRecord(tenantId, actorId, study, createdLopa, dto.reason);

    // 13. Optionally create tracked Action in Action Center
    let actionRecord: any = null;
    if (dto.createAction || ['Critical', 'High'].includes(scenario.risk_level)) {
      actionRecord = await this.actions.create(tenantId, actorId, {
        title: dto.actionTitle || `Complete LOPA Assessment: ${lopaNumber} (${scenario.scenario_number})`,
        description: `Escalated from HAZOP Study ${study.study_number}, Node ${node?.node_number ?? '1'}, Scenario ${scenario.scenario_number}. Consequence: ${scenario.consequence}. LOPA study ${lopaNumber} must be validated.`,
        sourceModule: 'HAZOP',
        sourceType: 'lopa_escalation',
        sourceRecordId: scenario.id,
        ownerId,
        priority: scenario.risk_level === 'Critical' ? 'SAFETY_CRITICAL' : 'HIGH',
        dueDate: dto.actionDueDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        siteId: study.site_id ?? undefined,
        evidenceRequired: true,
        verificationRequired: true
      }).catch(() => null);
    }

    // 14. Dispatch notification
    await this.notifications.notifyUser({
      tenantId,
      userId: ownerId,
      siteId: study.site_id,
      title: `LOPA Required: ${study.study_number} - ${scenario.scenario_number}`,
      message: `Scenario ${scenario.scenario_number} has been escalated to LOPA study ${lopaNumber}.`,
      type: 'WARNING',
      module: 'HAZOP',
      relatedUrl: `/lopa/${lopaId}`,
      metadata: { studyId, scenarioId, lopaId, lopaNumber }
    }).catch(() => null);

    // 15. Write audit & history
    await this.audit.write({
      tenantId,
      actorId,
      action: 'HAZOP_SCENARIO_ESCALATED_TO_LOPA',
      entityType: 'hazop_scenarios',
      entityId: scenarioId,
      after: { lopaId, lopaNumber, title } as JsonValue
    }).catch(() => null);

    await this.db.single(
      this.db.from('hazop_history_events').insert({
        id: randomUUID(),
        tenant_id: tenantId,
        study_id: studyId,
        event_type: 'LOPA_ESCALATED',
        title: `Scenario ${scenario.scenario_number} escalated to LOPA`,
        description: `Created LOPA study ${lopaNumber} (${title}). ${dto.reason ?? ''}`.trim(),
        actor_id: actorId,
        metadata: { scenarioId, lopaId, lopaNumber, actionId: actionRecord?.id },
        created_at: now
      })
    ).catch(() => null);

    return {
      success: true,
      isExisting: false,
      lopaStudyId: lopaId,
      lopaNumber,
      title,
      status: 'In Preparation',
      actionId: actionRecord?.id ?? null,
      message: `Successfully escalated scenario to LOPA study ${lopaNumber}.`
    };
  }

  private async ensureLinkedRecord(tenantId: string, actorId: string, study: any, lopaStudy: any, reason?: string) {
    const existingLink = await this.db.single<any>(
      this.db
        .from('hazop_linked_records')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('study_id', study.id)
        .eq('record_type', 'LOPA')
        .eq('record_id', lopaStudy.id)
        .maybeSingle()
    ).catch(() => null);

    if (!existingLink) {
      await this.db.single(
        this.db.from('hazop_linked_records').insert({
          id: randomUUID(),
          tenant_id: tenantId,
          company_id: study.company_id ?? null,
          site_id: study.site_id ?? null,
          study_id: study.id,
          record_type: 'LOPA',
          record_id: lopaStudy.id,
          record_number: lopaStudy.lopa_number,
          title: lopaStudy.title,
          linked_module: 'LOPA',
          linked_record_id: lopaStudy.id,
          linked_record_number: lopaStudy.lopa_number,
          linked_record_title: lopaStudy.title,
          relationship_type: 'Escalated LOPA Study',
          link_reason: reason || 'Escalated from HAZOP worksheet',
          blocking_status: 'Not Blocking',
          created_by: actorId,
          created_at: new Date().toISOString()
        })
      ).catch(() => null);
    }
  }
}
