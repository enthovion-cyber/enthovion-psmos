import { PsiCard } from '../../shared/PsiUi';
import type { SafeguardLookups } from '../../types/safeguard.types';
import { FieldGrid, SelectInput, TextArea, TextInput, Toggle } from '../SafeguardPrimitives';

export function SafeguardEffectivenessIndependenceSection({ value, lookups, onChange }: { value: Record<string, any>; lookups: SafeguardLookups; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="5. Effectiveness / Independence Basis" subtitle="PSI stores IPL foundation only. Full IPL credit remains in LOPA/SIL. Unknown effectiveness creates completeness and conflict gaps for critical safeguards."><FieldGrid>
    <SelectInput label="Effectiveness status" value={value.effectiveness_status} options={lookups.effectivenessStatuses} onChange={(effectiveness_status) => onChange({ effectiveness_status })} />
    <TextArea label="Effectiveness basis" value={value.effectiveness_basis} onChange={(effectiveness_basis) => onChange({ effectiveness_basis })} />
    <Toggle label="Independence required" checked={value.independence_required} onChange={(independence_required) => onChange({ independence_required })} />
    <TextArea label="Independence basis" value={value.independence_basis} onChange={(independence_basis) => onChange({ independence_basis })} />
    <Toggle label="IPL candidate" checked={value.ipl_candidate} onChange={(ipl_candidate) => onChange({ ipl_candidate })} />
    <Toggle label="IPL claimed in LOPA" checked={value.ipl_claimed_in_lopa} onChange={(ipl_claimed_in_lopa) => onChange({ ipl_claimed_in_lopa })} />
    <SelectInput label="IPL qualification status" value={value.ipl_qualification_status} options={lookups.iplQualificationStatuses} onChange={(ipl_qualification_status) => onChange({ ipl_qualification_status })} />
    <TextInput label="Demand mode foundation" value={value.demand_mode_foundation} onChange={(demand_mode_foundation) => onChange({ demand_mode_foundation })} />
    <TextInput label="Human response dependency" value={value.human_response_dependency} onChange={(human_response_dependency) => onChange({ human_response_dependency })} />
    <TextInput label="Shared component / common cause note" value={value.shared_component_common_cause_note} onChange={(shared_component_common_cause_note) => onChange({ shared_component_common_cause_note })} />
    <TextInput label="Diagnostic / monitoring basis" value={value.diagnostic_monitoring_basis} onChange={(diagnostic_monitoring_basis) => onChange({ diagnostic_monitoring_basis })} />
    <TextInput label="Failure data source foundation" value={value.failure_data_source_foundation} onChange={(failure_data_source_foundation) => onChange({ failure_data_source_foundation })} />
    <TextArea label="Reliability note" value={value.reliability_note} onChange={(reliability_note) => onChange({ reliability_note })} />
    <TextArea label="Limitations / assumptions" value={value.limitations_assumptions} onChange={(limitations_assumptions) => onChange({ limitations_assumptions })} />
    <TextArea label="Conditions for credit / not-creditable reason" value={value.conditions_for_credit ?? value.not_creditable_reason} onChange={(conditions_for_credit) => onChange({ conditions_for_credit })} />
    <Toggle label="Engineering review required" checked={value.engineering_review_required} onChange={(engineering_review_required) => onChange({ engineering_review_required })} />
    <Toggle label="Approved exception" checked={value.approved_exception} onChange={(approved_exception) => onChange({ approved_exception })} />
    <TextArea label="Exception reason" value={value.exception_reason} onChange={(exception_reason) => onChange({ exception_reason })} />
  </FieldGrid></PsiCard>;
}
