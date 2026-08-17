import type { MiSafeguardImpairment } from '../types/impairment.types';
import { KeyValueGrid, SectionCard } from '../safeguards/SafeguardUiPrimitives';

export function ImpairmentDetailPanels({ impairment, linkedRecords }: { impairment: MiSafeguardImpairment; linkedRecords?: Array<Record<string, unknown>> }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <SectionCard title="Safeguard Snapshot" description="Source safeguard, equipment, criticality, LOPA/SIL, and test status captured at impairment creation/update.">
        <KeyValueGrid items={[
          ['Safeguard tag', impairment.safeguard_tag], ['Safeguard type', impairment.safeguard_type], ['Safeguard status', impairment.current_safeguard_status],
          ['Equipment', impairment.equipment_tag ?? impairment.equipment_id], ['Equipment criticality', impairment.equipment_criticality], ['Safety critical', impairment.safety_critical],
          ['PSM critical', impairment.psm_critical], ['LOPA / SIL IPL', impairment.lopa_sil_ipl], ['Last test', impairment.last_test_at], ['Next due', impairment.next_test_due_at]
        ]} />
      </SectionCard>
      <SectionCard title="Bypass / Impairment Details" description="Operational need, affected function/scenario/equipment, reason, consequence, and status.">
        <KeyValueGrid items={[
          ['Type', impairment.impairment_type], ['Reason', impairment.reason], ['Planned / emergency', impairment.planned_emergency],
          ['Work description', impairment.work_description], ['Operational need', impairment.operational_need], ['Affected function', impairment.affected_function],
          ['Affected scenario', impairment.affected_scenario], ['Affected equipment', impairment.affected_equipment], ['Consequence', impairment.consequence_if_needed]
        ]} />
      </SectionCard>
      <SectionCard title="Risk / Mitigation" description="Risk level, temporary mitigation, operator monitoring, emergency readiness, and communication controls.">
        <KeyValueGrid items={[
          ['Risk level', impairment.risk_level], ['Risk assessment', impairment.risk_assessment_summary], ['Mitigation required', impairment.mitigation_required],
          ['Temporary mitigation', impairment.temporary_mitigation_summary], ['Operator monitoring', impairment.operator_monitoring_required], ['Temporary alarm/protection', impairment.temporary_alarm_or_protection],
          ['Extra rounds', impairment.extra_rounds_required], ['Reduced envelope', impairment.reduced_operating_envelope], ['Standby equipment', impairment.standby_equipment_required],
          ['Fire/gas watch', impairment.fire_gas_watch_required], ['Manual control', impairment.manual_control_required], ['Emergency readiness', impairment.emergency_readiness_required],
          ['Control room communication', impairment.control_room_communication_required], ['Shift handover', impairment.shift_handover_required], ['Management notification', impairment.management_notification_required]
        ]} />
      </SectionCard>
      <SectionCard title="Duration / Expiry / Workflow" description="Start, expiry, reminder, extension, escalation, approval, activation, and restoration status.">
        <KeyValueGrid items={[
          ['Start', impairment.start_at], ['Max duration', `${impairment.max_duration_value ?? ''} ${impairment.max_duration_unit ?? ''}`], ['Expiry', impairment.expiry_at],
          ['Time remaining', impairment.timeRemainingLabel], ['Reminder', impairment.reminder_at], ['Extension allowed', impairment.extension_allowed],
          ['Escalation level', impairment.escalation_level], ['Auto-create action if expired', impairment.auto_create_action_if_expired], ['Restoration status', impairment.restoration_status],
          ['Requester', impairment.requester_user_id], ['Authorized by', impairment.authorized_by], ['Approved by', impairment.approved_by], ['Activated by', impairment.activated_by]
        ]} />
      </SectionCard>
      <SectionCard title="Linked Records" description="PTW, LOTO, MOC, PSSR, Incident, LOPA, HAZOP, test, calibration, deficiency, action, and document relationships.">
        {linkedRecords?.length ? <div className="space-y-2">{linkedRecords.map((item) => <div key={String(item.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">{String(item.linked_module)} · {String(item.linked_record_number ?? item.linked_record_id)}</div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No linked records are stored for this impairment.</p>}
      </SectionCard>
      <SectionCard title="Integration Impacts" description="Equipment readiness, PSSR/startup blockers, LOPA/SIL warning, MOC/PTW/LOTO flags.">
        <KeyValueGrid items={[
          ['Startup blocked', impairment.startup_blocked], ['PSSR blocker', impairment.pssr_blocker], ['PSSR required', impairment.pssr_required],
          ['MOC required', impairment.moc_required], ['MOC suggested', impairment.moc_suggested], ['PTW required', impairment.ptw_required], ['PTW linked', impairment.ptw_linked],
          ['LOTO required', impairment.loto_required], ['LOTO linked', impairment.loto_linked], ['LOPA/SIL warning', impairment.lopa_warning_required]
        ]} />
      </SectionCard>
    </div>
  );
}
